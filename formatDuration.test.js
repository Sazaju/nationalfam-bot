const { formatDuration } = require('./datetime.js')

describe('Format milliseconds into duration', () => {
	test.each`
		milliseconds | result
		${0} | ${'0s'}
		${1} | ${'0s'}
		${1000} | ${'1s'}
		${60000} | ${'1m'}
		${61000} | ${'1m01s'}
		${119999} | ${'1m59s'}
		${3600000} | ${'1h'}
		${3601000} | ${'1h'}
		${3660000} | ${'1h01'}
		${7199999} | ${'1h59'}
		${99999999} | ${'27h46'}
		
	`('$milliseconds = $result', ({ milliseconds, result }) => {
		expect(formatDuration(milliseconds)).toBe(result);
	});
});
