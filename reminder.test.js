const { Reminder } = require('./reminder.js')

test('Reminder calls', () => {
	// Prepare dates of calls
	const firstCallDate = new Date(1);
	const secondCallDate = new Date(2);
	const thirdCallDate = new Date(3);
	const lastCallDate = new Date(4);
	
	// Prepare reminder
	const requestedCalls = [];
	const firstCallDelay = -1;
	const firstCaller = (fn) => requestedCalls.push({fn: fn, delay: firstCallDelay});
	const recaller = (fn, delay) => requestedCalls.push({fn: fn, delay: delay});
	var dateFactoryOutput = null;
	const dateFactory = () => dateFactoryOutput;
	const reminder = new Reminder(dateFactory, firstCaller, recaller);
	
	// Prepare function to remind
	const calls = [];
	var delay = 123;
	const fn = date => {
		calls.push(date);
		return delay;
	};
	
	// Prepare requested calls execution
	const executeNextRequestedCall = callDate => {
		const fnToCall = requestedCalls.shift().fn;
		calls.length = 0;
		dateFactoryOutput = callDate;
		fnToCall();
	};
	
	// Prepare expectations
	const expectToRequestFirstCall = () => {
		expect(calls.length).toBe(0);
		expect(requestedCalls.length).toBe(1);
		expect(requestedCalls[0].delay).toBe(firstCallDelay);
	};
	const expectToExecuteCallAndRequestNext = callDate => {
		expect(calls.length).toBe(1);
		expect(calls[0]).toBe(callDate);
		expect(requestedCalls.length).toBe(1);
		expect(requestedCalls[0].delay).toBe(delay);
	};
	const expectToExecuteCallAndNoMoreRequest = callDate => {
		expect(calls.length).toBe(1);
		expect(calls[0]).toBe(callDate);
		expect(requestedCalls.length).toBe(0);
	};
	
	// Start reminder
	fnCalled = false;
	reminder.start(fn);
	expectToRequestFirstCall();
	
	// Simulate first call
	executeNextRequestedCall(firstCallDate);
	expectToExecuteCallAndRequestNext(firstCallDate);
	
	// Simulate second call
	executeNextRequestedCall(secondCallDate);
	expectToExecuteCallAndRequestNext(secondCallDate);
	
	// Simulate third call
	executeNextRequestedCall(thirdCallDate);
	expectToExecuteCallAndRequestNext(thirdCallDate);
	
	// Simulate last call (no delay)
	delay = undefined;
	executeNextRequestedCall(lastCallDate);
	expectToExecuteCallAndNoMoreRequest(lastCallDate);
});
