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

function log(message) {
	const now = new Date();
	const time = now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
	console.log(time + ': ' + message);
}

const safe = Safety.fromDurations(
	safety.recall.delay.min,
	safety.recall.delay.max,
	log
);

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
	
	reminderAt(date) {
		const info = this.infoAt(date);
		var recallDelay = info.remaining;// TODO add margin?
		const reminderMargin = parseDuration("PT5M").milliseconds();
		
		return {
			info: info,
			shouldNotice: (info.nextPhase.isBattle || info.nextPhase.isDeclaration) && info.remaining <= reminderMargin,
			recallDelay: recallDelay,
		};
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
					isDeclaration: key == "declaration",
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
	if (info.phase.isBattle) {
		const remaining = formatDuration(info.remaining);
		const end = formatTime(info.phase.end);
		return "Que fais-tu encore là "+username+" ?\nLa guerre est en cours !\n"+remaining+" avant la fin de la phase "+info.phase.name+" à "+end;
	} else if (info.phase.isDeclaration) {
		const remaining = formatDuration(info.remaining);
		const end = formatTime(info.phase.end);
		return "Les déclarations d'attaque de château sont en cours !\n"+remaining+" avant la fin de la phase "+info.phase.name+" à "+end;
	} else {
		const remaining = formatDuration(info.remaining);
		const nextStart = formatTime(info.nextPhase.start);
		return "Phase "+info.phase.name+", "+remaining+" avant la phase "+info.nextPhase.name+" à "+nextStart;
	}
}

// TODO rappel bataille
// TODO rappel déclaration
// TODO commande pour indiquer quoi déclarer
// TODO commande pour indiquer quoi combattre
function nextWarReminder(now) {
	now = new Date('2022-07-27T08:00+02:00');
console.log(now);
	const reminderInfo = warInfo.reminderAt(now);
console.log(reminderInfo);
	const info = reminderInfo.info;
	const phase = info.phase;
	const recallDelay = reminderInfo.recallDelay;
	const reminderMargin = parseDuration("PT5M").milliseconds();
console.log(reminderMargin);
	
	if (info.shouldNotice) {
		if (info.nextPhase.isDeclaration) {
			const start = formatTime(phase.start);
			const delay = formatDuration(recallDelay);
			const remaining = formatDuration(info.remaining);
			log('rappel de '+info.nextPhase.name+' à '+start+', prochain check dans '+delay);
			const channel = client.channels.cache.get(channels.war.id);
			channel.send("@everyone La phase "+info.nextPhase.name+" débute dans "+remaining+" ! Visez vos châteaux !");
		} else if (info.nextPhase.isBattle) {
			const start = formatTime(phase.start);
			const delay = formatDuration(recallDelay);
			const remaining = formatDuration(info.remaining);
			log('rappel de '+info.nextPhase.name+' à '+start+', prochain check dans '+delay);
			const channel = client.channels.cache.get(channels.war.id);
			channel.send("@everyone La phase "+info.nextPhase.name+" débute dans "+remaining+" ! Préparez vos troupes !");
		} else {
			throw new Error("Notice demandée pendant une phase "+info.phase.name);
		}
	} else {
		var formatDate = date => date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
		const start = formatDate(phase.start);
		const end = formatDate(phase.end);
		const delay = formatDuration(recallDelay);
		log('phase de guerre '+info.phase.name+' ['+start+' ; '+end+'], prochain check dans '+delay);
	}
	return recallDelay;
}
reminder.start(nextWarReminder);

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
