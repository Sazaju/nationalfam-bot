const { millisecondsBetween } = require('./datetime.js')

describe('Milliseconds between', () => {
	test.each`
		date1                    | date2                    | result
		${'1234-01-01T00:00:00'} | ${'1234-01-01T00:00:00'} | ${0}
		${'1234-01-01T00:00:00'} | ${'1234-01-01T00:00:01'} | ${1000}
		${'1234-01-01T00:00:01'} | ${'1234-01-01T00:00:00'} | ${-1000}
		${'1234-01-01T00:00:00'} | ${'1234-01-02T00:00:00'} | ${86400000}
		${'1234-01-02T00:00:00'} | ${'1234-01-01T00:00:00'} | ${-86400000}
		
	`('$date1 - $date2 = $result', ({ date1, date2, result }) => {
		expect(millisecondsBetween(new Date(date1), new Date(date2))).toBe(result);
	});
});
