const { parseDuration, formatDuration } = require('./datetime.js');

class Safety {
	constructor(minRecallDelay, maxRecallDelay, logger = msg => {}) {
		this.log = logger;
		this.recall = {
				delay: {
					min: minRecallDelay,
					max: maxRecallDelay,
				}
		};
	}
	
	recallDelay(delay) {
		const limits = this.recall.delay;
		if (delay < limits.min) {
			this.log("recall after "+formatDuration(delay)+" too low, replace by "+formatDuration(limits.min));
			return limits.min;
		}
		if (delay > limits.max) {
			this.log("recall after "+formatDuration(delay)+" too high, replace by "+formatDuration(limits.max));
			return limits.max;
		}
		return delay;
	}
	
	static fromDurations(minRecallDelay, maxRecallDelay, logger = msg => {}) {
		return new Safety(
			parseDuration(minRecallDelay).milliseconds(),
			parseDuration(maxRecallDelay).milliseconds(),
			logger
		);
	}
}

module.exports = {
	Safety
}
