const { parseTime } = require('./datetime.js')

describe('Non ISO-8601 times', () => {
	test.each([
		'foo',
	])('%p', (string) => {
		expect(() => parseTime(string)).toThrow(`Non ISO-8601 time: ${string}`);
	});
});

describe('Parse for fields', () => {
	test.each`
		time           | hours | minutes | seconds
		${'T00:00:00'} |  ${0} |    ${0} |    ${0}
		${'T01:02:03'} |  ${1} |    ${2} |    ${3}
		${'T23:59:59'} | ${23} |   ${59} |   ${59}
		${'T23:59'}    | ${23} |   ${59} |    ${0}
		${'T23'}       | ${23} |    ${0} |    ${0}
		
	`('$time = $hours h $minutes m $seconds s', ({ time, hours, minutes, seconds }) => {
		expect(parseTime(time)).toMatchObject({hours: hours, minutes: minutes, seconds: seconds});
	});
});

describe('Parse for date', () => {
	test.each`
		time           | date                     | result
		${'T00:00:00'} | ${'5678-12-12T12:34:56'} | ${'5678-12-12T00:00:00'}
		${'T01:02:03'} | ${'1234-05-02T00:00:00'} | ${'1234-05-02T01:02:03'}
		${'T23:59:59'} | ${'4321-10-25T00:00:00'} | ${'4321-10-25T23:59:59'}
		
	`('$time + $date = $result', ({ time, date, result }) => {
		expect(parseTime(time).atDayOf(new Date(date))).toEqual(new Date(result));
	});
});

describe('Unsupported fields', () => {
	test.each([
		'1985-11-23T05:23:54',
	])('%p', (string) => {
		expect(() => parseTime(string)).toThrow(`Cannote parse time '${string}': date, fraction, and time zone are not supported`);
	});
});
