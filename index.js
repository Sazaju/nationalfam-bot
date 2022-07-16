// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, channels, safety, raids } = require('./config.json');

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

const second = 1000;
const minute = 60*second;
const hour = 60*minute;

const durationRegex = new RegExp("P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?");
function parseDuration(string) {
	const matches = string.match(durationRegex);
	if (matches === null) {
		throw new Error(`Non ISO-8601 duration: ${string}`);
	}
	
	const years = matches[1];
	const months = matches[2];
	const days = matches[3];
	if (years !== undefined || months !== undefined || days !== undefined) {
		throw new Error(`Cannote parse duration ${string}: date fields are not supported`);
	}
	
	const hours = parseInt(matches[4] || "0");
	const minutes = parseInt(matches[5] || "0");
	const seconds = parseInt(matches[6] || "0");
	
	return {
		milliseconds: () => hours*hour + minutes*minute + seconds*second,
	};
}

const timeRegex = new RegExp("T([0-9]{2})(?::([0-9]{2})(?::([0-9]{2})(?:[,.]([0-9]+))?)?)?(Z|[+][0-9]{2}(?::[0-9]{2})?)?");
function parseTime(string) {
	const matches = string.match(timeRegex);
	if (matches === null) {
		throw new Error(`Non ISO-8601 time: ${string}`);
	}
	
	const fraction = matches[4];
	const timezone = matches[5];
	if (fraction !== undefined || timezone !== undefined) {
		throw new Error(`Cannote parse time ${string}: fraction and time zone are not supported`);
	}
	
	const hours = parseInt(matches[1] || "0");
	const minutes = parseInt(matches[2] || "0");
	const seconds = parseInt(matches[3] || "0");
	
	return {
		hours: hours,
		minutes: minutes,
		seconds: seconds,
		atDayOf: (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds),
	};
}

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
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}
	
	toString() {
		var format = date => date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
		return "RaidPeriod["+format(this.start)+">"+format(this.end)+"]"
	}
	
	nextDay() {
		const start = new Date(this.start.getTime() + 24*hour);
		const end = new Date(this.end.getTime() + 24*hour);
		return new RaidPeriod(start, end);
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
	
	infoForDate(date) {
		if (this.isAfter(date)) {
			return {status: RaidStatus.Waiting, duration: millisecondsBetween(date, this.start)};
		} else if (this.isBefore(date)) {
			return {status: RaidStatus.Passed, duration: millisecondsBetween(this.end, date)};
		} else {
			return {status: RaidStatus.Running, duration: millisecondsBetween(date, this.end)};
		}
	}
	
	static allAt(date) {
		const raidDuration = parseDuration(raids.duration).milliseconds();
		return raids.starts.map(str => {
			const start = parseTime(str).atDayOf(date);
			const end = new Date(start.getTime() + raidDuration);
			return new RaidPeriod(start, end);
		});
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
		const raids = RaidPeriod.allAt(date);
		const remaining = raids.filter(raid => !raid.isBefore(date));
		const nextRaid = remaining.length > 0 ? remaining[0] : raids[0].nextDay();
		const dateInfo = nextRaid.infoForDate(date);
		return new RaidInfo(nextRaid, dateInfo.status, dateInfo.duration);
	}
}

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
