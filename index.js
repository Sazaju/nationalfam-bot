// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

/**********
 * FORMAT *
 **********/

function formatTime(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	return hours+"h"+String(minutes).padStart(2, '0');
}

function formatDuration(timestamp) {
	var seconds = Math.floor(timestamp / 1000);
	if (seconds < 60) {
		return seconds+"s";
	}
	
	seconds++;
	var minutes = Math.floor(seconds / 60);
	var seconds = seconds % 60;
	if (minutes < 60) {
		return minutes+"m"+String(seconds).padStart(2, '0')+"s";
	}
	
	minutes++;
	var hours = Math.floor(minutes / 60);
	var minutes = minutes % 60;
	return hours+"h"+String(minutes).padStart(2, '0');
}

/*************
 * RAID INFO *
 *************/

function raidInfo(user) {
	const oneHour = 60*60*1000;
	const oneDay = 24*oneHour;
	
	var now = new Date();
	var raid1Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 45, 0);
	var raid1End = new Date(raid1Start.getTime() + oneHour);
	var raid2Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 45, 0);
	var raid2End = new Date(raid2Start.getTime() + oneHour);
	var raidTomorrowStart = new Date(raid1Start.getTime() + oneDay);
	
	var remainingUntil = (date) => formatDuration(date.getTime() - now.getTime())
	var nextRaidAt = (date) => remainingUntil(date)+" avant le raid de "+formatTime(date);
	var currentRaid = (start, stop) => "Que fais-tu encore là "+user.username+" ?\nLe raid est en cours !\n"+remainingUntil(stop)+" avant la fin du raid de "+formatTime(start);
	
	if (now < raid1Start) {
		return nextRaidAt(raid1Start);
	} else if (now < raid1End) {
		return currentRaid(raid1Start, raid1End);
	} else if (now < raid2Start) {
		return nextRaidAt(raid2Start);
	} else if (now < raid2End) {
		return currentRaid(raid2Start, raid2End);
	} else {
		return nextRaidAt(raidTomorrowStart);
	}
}

// TODO Automatic raid reminder
// setTimeout
// setInterval

/********
 * MAIN *
 ********/

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'mascotte') {
		await interaction.reply('La chambre rouge est au fond à gauche.');
	} else if (commandName === 'raid') {
		await interaction.reply(raidInfo(interaction.user));
	}
});

// Login to Discord with your client's token
client.login(token);
