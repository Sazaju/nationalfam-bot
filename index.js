// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, channels, safety, raids } = require('./config.json');
const { Safety } = require('./safety.js');
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

/*************
 * RAID INFO *
 *************/

const raidInfo = RaidInfoFactory.fromStartsAndDuration(raids.starts, raids.duration);
function raidInfoFor(user) {
	const username = user.username;
	log("infos de raid demandées par "+username);
	
	const now = new Date();
	const info = raidInfo.at(now);
	if (info.status == RaidStatus.Waiting) {
		return formatDuration(info.remaining)+" avant le raid de "+formatTime(info.period.start);
	} else {
		return "Que fais-tu encore là "+username+" ?\nLe raid est en cours !\n"+formatDuration(info.remaining)+" avant la fin du raid de "+formatTime(info.period.start);
	}
}

function remindNextRaid() {
	const now = new Date();
	const info = raidInfo.at(now);
	
	if (info.status == RaidStatus.Running) {
		const runningDuration = millisecondsBetween(now, info.period.end);
		const safetyDuration = parseDuration(safety.recall.delay.afterRun).milliseconds();
		const recallDelay = safe.recallDelay(runningDuration + safetyDuration);
		log('rappel pour '+formatTime(info.period.start)+', prochain check dans '+formatDuration(recallDelay));
		const channel = client.channels.cache.get(channels.raids.id);
		channel.send("@everyone Le raid de "+formatTime(info.period.start)+" est en cours !");
		setTimeout(remindNextRaid, recallDelay);
	} else {// Waiting case
		const recallDelay = safe.recallDelay(info.remaining);
		var formatDate = date => date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
		log('prochain raid ['+formatDate(info.period.start)+' ; '+formatDate(info.period.end)+'], prochain check dans '+formatDuration(recallDelay));
		setTimeout(remindNextRaid, recallDelay);
	}
}
client.once('ready', () => remindNextRaid());

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
		// TODO Only in raid channel
		await interaction.reply(raidInfoFor(interaction.user));
	}
});

// Login to Discord
client.login(token);
