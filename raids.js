const { raids } = require('./config.json');
const { hour, minute, second, parseDuration, parseTime, millisecondsBetween } = require('./datetime.js');

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

module.exports = {
	RaidInfo,
	RaidStatus
}
