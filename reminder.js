class Reminder {
	constructor(dateFactory, firstCaller, recaller) {
		this.createDate = dateFactory;
		this.firstCall = firstCaller;
		this.recall = recaller;
	}
	
	start(fn) {
		const functionWithRecall = () => {
			const recallDelay = fn(this.createDate());
			this.recall(functionWithRecall, recallDelay);
		};
		this.firstCall(functionWithRecall);
	}
}

module.exports = {
	Reminder
}
