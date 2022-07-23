const { formatTime } = require('./datetime.js')

describe('Format date into time of the day', () => {
	test.each`
		date                     | result
		${'1234-05-02T00:00:00'} | ${'0h00'}
		${'1234-05-02T01:02:02'} | ${'1h02'}
		${'1234-05-02T23:59:59'} | ${'23h59'}
		
	`('$date = $result', ({ date, result }) => {
		expect(formatTime(new Date(date))).toBe(result);
	});
});
