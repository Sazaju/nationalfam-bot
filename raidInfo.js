const { hour, minute, second, parseDuration, parseTime, millisecondsBetween } = require('./datetime.js');

const RaidStatus = Object.freeze({
	Waiting: "Waiting",
	Running: "Running",
});

class RaidPeriod {
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}
	
	isBefore(date) {
		return this.end < date;
	}
	
	isAfter(date) {
		return date < this.start;
	}
	
	nextDay() {
		const start = new Date(this.start.getTime() + 24*hour);
		const end = new Date(this.end.getTime() + 24*hour);
		return new RaidPeriod(start, end);
	}
	
	infoForDate(date) {
		if (this.isAfter(date)) {
			return {status: RaidStatus.Waiting, remaining: millisecondsBetween(date, this.start)};
		} else {
			return {status: RaidStatus.Running, remaining: millisecondsBetween(date, this.end)};
		}
	}
}

class RaidInfo {
	constructor(period, status, remaining) {
		this.period = period;
		this.status = status;
		this.remaining = remaining;
	}
}

class RaidInfoFactory {
	constructor(raids) {
		this.raids = raids;
	}
	
	at(date) {
		const periods = this.raids.map(raid => raid.atDayOf(date));
		const remaining = periods.filter(period => !period.isBefore(date));
		const nextRaid = remaining.length > 0 ? remaining[0] : periods[0].nextDay();
		const dateInfo = nextRaid.infoForDate(date);
		return new RaidInfo(nextRaid, dateInfo.status, dateInfo.remaining);
	}
	
	static fromStartsAndDuration(starts, duration) {
		const raidDuration = parseDuration(duration).milliseconds();
		const raids = starts.map(str => {
			return {
				atDayOf: date => {
					const start = parseTime(str).atDayOf(date);
					const end = new Date(start.getTime() + raidDuration);
					return new RaidPeriod(start, end);
				}
			};
		});
		return new RaidInfoFactory(raids);
	}
}

module.exports = {
	RaidInfoFactory,
	RaidStatus
}
