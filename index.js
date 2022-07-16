// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, raidChannel } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

/**********
 * UTILS *
 **********/

function log(message) {
	const now = new Date();
	const time = now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
	console.log(time + ': ' + message);
}

const second = 1000;
const minute = 60*second;
const hour = 60*minute;

function millisecondsBetween(date1, date2) {
	return date2.getTime() - date1.getTime();
}

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
	
	var minutes = Math.floor(seconds / 60);
	var seconds = seconds % 60;
	if (minutes < 60) {
		return minutes+"m"+(seconds == 0 ? "" : String(seconds).padStart(2, '0')+"s");
	}
	
	var hours = Math.floor(minutes / 60);
	var minutes = minutes % 60;
	return hours+"h"+(minutes == 0 ? "" : String(minutes).padStart(2, '0'));
}

/*************
 * RAID INFO *
 *************/
class RaidStatus {
	static Waiting = new RaidStatus("waiting");
	static Running = new RaidStatus("running");
	static Passed = new RaidStatus("passed");
	
	constructor(name) {
		this.name = name;
	}
	
	toString() {
		return this.name;
	}
}

class RaidPeriod {
	constructor(date, hours, minutes) {
		this.start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
		this.end = new Date(this.start.getTime() + 1*hour);
	}
	
	toString() {
		var format = date => date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
		return "RaidPeriod["+format(this.start)+">"+format(this.end)+"]"
	}
	
	nextDay() {
		const tomorrow = new Date(this.start.getTime() + 24*hour);
		return new RaidPeriod(tomorrow, this.start.getHours(), this.start.getMinutes());
	}
	
	isAfter(date) {
		return date < this.start;
	}
	
	isBefore(date) {
		return this.end < date;
	}
	
	contains(date) {
		return !this.isAfter(date) && !this.isBefore(date);
	}
	
	forDate(date) {
		if (this.isAfter(date)) {
			return {status: RaidStatus.Waiting, duration: millisecondsBetween(date, this.start)};
		} else if (this.isBefore(date)) {
			return {status: RaidStatus.Passed, duration: millisecondsBetween(this.end, date)};
		} else {
			return {status: RaidStatus.Running, duration: millisecondsBetween(date, this.end)};
		}
	}
}

class RaidInfo {
	constructor(period, status, duration) {
		this.period = period;
		this.status = status;
		this.duration = duration;
	}
	
	toString() {
		return this.period+":"+this.status+":"+this.duration
	}
	
	static at(date) {
		const raid1 = new RaidPeriod(date, 12, 45);
		const raid2 = new RaidPeriod(date, 19, 45);
		const raidTomorrow = raid1.nextDay();
		
		const raid = !raid1.isBefore(date) ? raid1 : !raid2.isBefore(date) ? raid2 : raidTomorrow;
		const dateInfo = raid.forDate(date);
		return new RaidInfo(raid, dateInfo.status, dateInfo.duration);
	}
}

function raidInfo(user) {
	const now = new Date();
	const info = RaidInfo.at(now);
	if (info.status == RaidStatus.Waiting) {
		return formatDuration(info.duration)+" avant le raid de "+formatTime(info.period.start);
	} else {
		return "Que fais-tu encore là "+user.username+" ?\nLe raid est en cours !\n"+formatDuration(info.duration)+" avant la fin du raid de "+formatTime(info.period.start);
	}
}

function raidReminder() {
	const now = new Date();
	const info = RaidInfo.at(now);
	
	if (info.status == RaidStatus.Running) {
		const wait = millisecondsBetween(now, info.period.end) + 1*minute;
		log('rappel pour '+formatTime(info.period.start)+', prochain check dans '+formatDuration(wait));
		const channel = client.channels.cache.get(raidChannel);
		channel.send("@everyone Le raid de "+formatTime(info.period.start)+" est en cours !");
		setTimeout(raidReminder, wait);
	} else {// Waiting case
		const wait = Math.max(1*second, info.duration);
		log('prochain raid '+info.period+', prochain check dans '+formatDuration(wait));
		setTimeout(raidReminder, wait);
	}
	
	return 'Done';
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
		await interaction.reply(raidInfo(interaction.user));
	} else if (commandName === 'raid2') {
		await interaction.reply(raidReminder());
	}
});

// Login to Discord with your client's token
client.login(token);
