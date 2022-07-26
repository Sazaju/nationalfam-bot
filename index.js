// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, channels, safety, raids, war } = require('./config.json');
const { Safety } = require('./safety.js');
const { Reminder } = require('./reminder.js');
const { parseTime, parseDuration, millisecondsBetween, nextDayOf, formatTime, formatDuration } = require('./datetime.js');
const { RaidInfoFactory, RaidStatus } = require('./raidInfo.js');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

/*********
 * UTILS *
 *********/

const safe = Safety.fromDurations(
	safety.recall.delay.min,
	safety.recall.delay.max
);

function log(message) {
	const now = new Date();
	const time = now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
	console.log(time + ': ' + message);
}

const reminder = new Reminder(
	() => new Date(),
	(fn) => client.once('ready', fn),
	(fn, delay) => setTimeout(fn, safe.recallDelay(delay))
);

/*************
 * RAID INFO *
 *************/

const raidInfo = RaidInfoFactory.parse(raids.starts, raids.duration, raids.recallDelayAfterRun);
function raidInfoFor(user) {
	const username = user.username;
	log("infos de raid demandées par "+username);
	
	const now = new Date();
	const info = raidInfo.infoAt(now);
	const start = formatTime(info.period.start);
	const remaining = formatDuration(info.remaining);
	if (info.status == RaidStatus.Waiting) {
		return remaining+" avant le raid de "+start;
	} else {
		return "Que fais-tu encore là "+username+" ?\nLe raid est en cours !\n"+remaining+" avant la fin du raid de "+start;
	}
}

function nextRaidReminder(now) {
	const reminderInfo = raidInfo.reminderAt(now);
	const info = reminderInfo.info;
	const period = info.period;
	const recallDelay = reminderInfo.recallDelay;
	
	if (info.status == RaidStatus.Running) {
		const start = formatTime(period.start);
		const delay = formatDuration(recallDelay);
		log('rappel pour '+start+', prochain check dans '+delay);
		const channel = client.channels.cache.get(channels.raids.id);
		channel.send("@everyone Le raid de "+start+" est en cours !");
	} else {// Waiting case
		var formatDate = date => date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
		const start = formatDate(period.start);
		const end = formatDate(period.end);
		const delay = formatDuration(recallDelay);
		log('prochain raid ['+start+' ; '+end+'], prochain check dans '+delay);
	}
	return recallDelay;
}
reminder.start(nextRaidReminder);


/************
 * WAR INFO *
 ************/

class WarInfo {
	constructor(phase, nextPhase, remaining) {
		this.phase = phase;
		this.nextPhase = nextPhase;
		this.remaining = remaining;
	}
}
class WarInfoFactory {
	constructor(phases) {
		this.phases = phases;
	}
	
	infoAt(date) {
		const datedPhases = this.phases.atDayOf(date);
		const datedPhase = Object.values(datedPhases).filter(phase => {
			return phase.start <= date && date <= phase.end;
		})[0]
		const nextPhase = Object.values(datedPhases).filter(phase => {
			return date < phase.start;
		})[0] || this.phases.atDayOf(nextDayOf(date)).preDeclaration;
		const remaining = nextPhase.start.getTime() - date.getTime();
		return new WarInfo(datedPhase, nextPhase, remaining);
	}
	
	static parse(start, duration, phases, rest) {
		// TODO start
		// TODO duration
		// TODO rest at the end of the duration
		const phaseEntries = Object.entries(phases);
		phases.atDayOf = date => {
			const datedPhases = {};
			phaseEntries.forEach(entry => {
				const [key, phase] = entry;
				datedPhases[key] = {
					name: phase.name,
					start: parseTime(phase.start).atDayOf(date),
					end: parseTime(phase.end).atDayOf(date),
					isBattle: key == "battle",
				};
			});
			return datedPhases;
		};
		return new WarInfoFactory(phases);
	}
}
const warInfo = WarInfoFactory.parse(war.start, war.duration, war.phases, war.rest);
function warInfoFor(user) {
	const username = user.username;
	log("infos de guerre d'alliance demandées par "+username);
	
	const now = new Date();
	const info = warInfo.infoAt(now);
	if (!info.phase.isBattle) {
		const remaining = formatDuration(info.remaining);
		const nextStart = formatTime(info.nextPhase.start);
		return "Phase "+info.phase.name+", "+remaining+" avant la phase "+info.nextPhase.name+" à "+nextStart;
	} else {
		const remaining = formatDuration(info.remaining);
		const end = formatTime(info.phase.end);
		return "Que fais-tu encore là "+username+" ?\nLa guerre est en cours !\n"+remaining+" avant la fin de la phase "+info.phase.name+" à "+end;
	}
}

/*
// TODO rappel bataille
// TODO rappel déclaration
// TODO commande pour indiquer quoi déclarer
// TODO commande pour indiquer quoi combattre
function nextRaidReminder(now) {
	const reminderInfo = raidInfo.reminderAt(now);
	const info = reminderInfo.info;
	const period = info.period;
	const recallDelay = reminderInfo.recallDelay;
	
	if (info.status == RaidStatus.Running) {
		const start = formatTime(period.start);
		const delay = formatDuration(recallDelay);
		log('rappel pour '+start+', prochain check dans '+delay);
		const channel = client.channels.cache.get(channels.raids.id);
		channel.send("@everyone Le raid de "+start+" est en cours !");
	} else {// Waiting case
		var formatDate = date => date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
		const start = formatDate(period.start);
		const end = formatDate(period.end);
		const delay = formatDuration(recallDelay);
		log('prochain raid ['+start+' ; '+end+'], prochain check dans '+delay);
	}
	return recallDelay;
}
reminder.start(nextRaidReminder);
 */

/********
 * MAIN *
 ********/

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'dev-source') {
		await interaction.reply("Mon code source se trouve là :\nhttps://github.com/Sazaju/nationalfam-bot");
	} else if (commandName === 'raid') {
		await interaction.reply(raidInfoFor(interaction.user));
	} else if (commandName === 'guerre') {
		await interaction.reply(warInfoFor(interaction.user));
	}
	// TODO rappel perso générique
});

// Login to Discord
client.login(token);
