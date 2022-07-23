const { parseDuration } = require('./datetime.js');

class Safety {
	constructor(minRecallDelay, maxRecallDelay) {
		this.recall = {
				delay: {
					min: minRecallDelay,
					max: maxRecallDelay,
				}
		};
	}
	
	recallDelay(delay) {
		const limits = this.recall.delay;
		return Math.max(limits.min, Math.min(delay, limits.max));
	}
	
	static fromDurations(minRecallDelay, maxRecallDelay) {
		return new Safety(
			parseDuration(minRecallDelay).milliseconds(),
			parseDuration(maxRecallDelay).milliseconds()
		);
	}
}

module.exports = {
	Safety
}
