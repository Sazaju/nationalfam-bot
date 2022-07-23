const { Safety } = require('./safety.js')

describe('Safe recall delay', () => {
	test.each`
		min    | max    | delay        | result
		  ${5} | ${100} |         ${0} | ${5}
		  ${5} | ${100} |         ${4} | ${5}
		  ${5} | ${100} |         ${5} | ${5}
		  ${5} | ${100} |        ${12} | ${12}
		  ${5} | ${100} |       ${100} | ${100}
		  ${5} | ${100} |       ${101} | ${100}
		  ${5} | ${100} | ${-Infinity} | ${5}
		  ${5} | ${100} |  ${Infinity} | ${100}
		${123} | ${456} | ${-Infinity} | ${123}
		${123} | ${456} |  ${Infinity} | ${456}
	`('$delay in [$min, $max] = $result', ({ min, max, delay, result }) => {
		const safety = new Safety(min, max);
		expect(safety.recallDelay(delay)).toBe(result);
	});
});

describe('Safety from durations', () => {
	test.each`
		minDuration | maxDuration | min      | max
		${'PT5S'}   | ${'PT100S'} | ${5000}  | ${100000}
	`('[$minDuration, $maxDuration] = [$min, $max]', ({ minDuration, maxDuration, min, max }) => {
		const safety = Safety.fromDurations(minDuration, maxDuration);
		expect({
			min: safety.recallDelay(-Infinity),
			max: safety.recallDelay(Infinity),
		}).toEqual({
			min: min,
			max: max,
		});
	});
});
