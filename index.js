// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, channels, safety, raids } = require('./config.json');
const { parseDuration, millisecondsBetween, formatTime, formatDuration } = require('./datetime.js');
const { RaidInfo, RaidStatus } = require('./raids.js');

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

/**********
 * SAFETY *
 **********/

function safeRecallDelay(delay) {
	const limits = safety.recall.delay;
	const min = parseDuration(limits.min).milliseconds();
	const max = parseDuration(limits.max).milliseconds();
	return Math.max(min, Math.min(delay, max));
}

/*************
 * RAID INFO *
 *************/

function raidInfo(user) {
	const username = user.username;
	log("infos de raid demandées par "+username);
	
	const now = new Date();
	const info = RaidInfo.at(now);
	if (info.status == RaidStatus.Waiting) {
		return formatDuration(info.duration)+" avant le raid de "+formatTime(info.period.start);
	} else {
		return "Que fais-tu encore là "+username+" ?\nLe raid est en cours !\n"+formatDuration(info.duration)+" avant la fin du raid de "+formatTime(info.period.start);
	}
}

function raidReminder() {
	const now = new Date();
	const info = RaidInfo.at(now);
	
	if (info.status == RaidStatus.Running) {
		const runningDuration = millisecondsBetween(now, info.period.end);
		const safetyDuration = parseDuration(safety.recall.delay.afterRun).milliseconds();
		const recallDelay = safeRecallDelay(runningDuration + safetyDuration);
		log('rappel pour '+formatTime(info.period.start)+', prochain check dans '+formatDuration(recallDelay));
		const channel = client.channels.cache.get(channels.raids.id);
		channel.send("@everyone Le raid de "+formatTime(info.period.start)+" est en cours !");
		setTimeout(raidReminder, recallDelay);
	} else {// Waiting case
		const recallDelay = safeRecallDelay(info.duration);
		log('prochain raid '+info.period+', prochain check dans '+formatDuration(recallDelay));
		setTimeout(raidReminder, recallDelay);
	}
}
client.once('ready', () => raidReminder());

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
		// TODO 
		// TODO Separate testing bot and prod bot
		await interaction.reply(raidInfo(interaction.user));
	}
});

// Login to Discord with your client's token
client.login(token);
