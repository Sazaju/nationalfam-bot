class Reminder {
	constructor(dateFactory, firstCaller, recaller) {
		this.createDate = dateFactory;
		this.firstCall = firstCaller;
		this.recall = recaller;
	}
	
	start(fn) {
		const functionWithRecall = () => {
			const recallDelay = fn(this.createDate());
			if (recallDelay !== undefined) {
				this.recall(functionWithRecall, recallDelay);
			}
		};
		this.firstCall(functionWithRecall);
	}
}

module.exports = {
	Reminder
}
