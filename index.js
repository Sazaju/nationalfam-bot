// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, channels, safety, raids } = require('./config.json');
const { Safety } = require('./safety.js');
const { Reminder } = require('./reminder.js');
const { parseDuration, millisecondsBetween, formatTime, formatDuration } = require('./datetime.js');
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
	}
});

// Login to Discord
client.login(token);
