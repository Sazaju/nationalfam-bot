const { RaidInfoFactory, RaidStatus } = require('./raidInfo.js')

describe('Raid info', () => {
	test.each`
		starts                       | duration   | date                     | status                | periodStart              | periodEnd                | remaining
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T00:00:00'} | ${RaidStatus.Waiting} | ${'1234-05-01T10:23:41'} | ${'1234-05-01T10:33:41'} | ${37421000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:23:40'} | ${RaidStatus.Waiting} | ${'1234-05-01T10:23:41'} | ${'1234-05-01T10:33:41'} | ${1000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:23:41'} | ${RaidStatus.Running} | ${'1234-05-01T10:23:41'} | ${'1234-05-01T10:33:41'} | ${600000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:33:40'} | ${RaidStatus.Running} | ${'1234-05-01T10:23:41'} | ${'1234-05-01T10:33:41'} | ${1000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:33:41'} | ${RaidStatus.Running} | ${'1234-05-01T10:23:41'} | ${'1234-05-01T10:33:41'} | ${0}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:33:42'} | ${RaidStatus.Waiting} | ${'1234-05-01T15:42:36'} | ${'1234-05-01T15:52:36'} | ${18534000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:42:35'} | ${RaidStatus.Waiting} | ${'1234-05-01T15:42:36'} | ${'1234-05-01T15:52:36'} | ${1000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:42:36'} | ${RaidStatus.Running} | ${'1234-05-01T15:42:36'} | ${'1234-05-01T15:52:36'} | ${600000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:52:35'} | ${RaidStatus.Running} | ${'1234-05-01T15:42:36'} | ${'1234-05-01T15:52:36'} | ${1000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:52:36'} | ${RaidStatus.Running} | ${'1234-05-01T15:42:36'} | ${'1234-05-01T15:52:36'} | ${0}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:52:37'} | ${RaidStatus.Waiting} | ${'1234-05-02T10:23:41'} | ${'1234-05-02T10:33:41'} | ${66664000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T23:59:59'} | ${RaidStatus.Waiting} | ${'1234-05-02T10:23:41'} | ${'1234-05-02T10:33:41'} | ${37422000}
	`('$date in $duration of $starts = remains $remaining ms $status in [$periodStart, $periodEnd]', ({ starts, duration, date, status, periodStart, periodEnd, remaining }) => {
		const raidInfo = RaidInfoFactory.fromStartsAndDuration(starts, duration);
		expect(raidInfo.at(new Date(date))).toMatchObject({
			period: {
				start: new Date(periodStart),
				end: new Date(periodEnd)
			},
			status: status,
			remaining: remaining,
		});
	});
});
