const { parseDuration } = require('./datetime.js')

describe('Non ISO-8601 durations', () => {
	test.each([
		'foo',
		'PTSS', 'PTTS', 'PPTS',
		'PXTS', 'PTXS',
	])('%p', (str) => {
		expect(() => parseDuration(str)).toThrow(`Non ISO-8601 duration: ${str}`);
	});
});

describe('Parse for milliseconds', () => {
	test.each`
		duration        |       result
		
		${'PT0S'}       |         ${0}
		${'PT0M'}       |         ${0}
		${'PT0H'}       |         ${0}
		${'PT0H0M0S'}   |         ${0}
		
		${'PT1S'}       |      ${1000}
		${'PT5000S'}    |   ${5000000}
		
		${'PT1M'}       |     ${60000}
		${'PT111M'}     |   ${6660000}
		
		${'PT1H'}       |   ${3600000}
		${'PT100H'}     | ${360000000}
		
		${'PT5H10M23S'} |  ${18623000}
		
	`('$duration = $result', ({ duration, result }) => {
		expect(parseDuration(duration).milliseconds()).toBe(result);
	});
});
