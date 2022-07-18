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

module.exports = {
	hour,
	minute,
	second,
	
	millisecondsBetween,
	
	parseDuration,
	parseTime,
	
	formatTime,
	formatDuration
}
