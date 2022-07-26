const { nextDayOf } = require('./datetime.js')

describe('Next day', () => {
	test.each`
		date                     | nextDate
		${'1234-01-01T00:00:00'} | ${'1234-01-02T00:00:00'}
		${'1234-01-01T12:34:56'} | ${'1234-01-02T12:34:56'}
		${'2222-12-31T23:59:59'} | ${'2223-01-01T23:59:59'}
		
	`('$date => $nextDate', ({ date, nextDate }) => {
		expect(nextDayOf(new Date(date))).toEqual(new Date(nextDate));
	});
});
