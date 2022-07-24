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
		const raidInfo = RaidInfoFactory.parse(starts, duration, 'PT0S');
		expect(raidInfo.infoAt(new Date(date))).toMatchObject({
			period: {
				start: new Date(periodStart),
				end: new Date(periodEnd)
			},
			status: status,
			remaining: remaining,
		});
	});
});

describe('Raid reminder', () => {
	test.each`
		starts                       | duration   | date                     | delayAfterRun | recallDelay
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T00:00:00'} | ${'PT10S'}    | ${37421000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:23:40'} | ${'PT10S'}    | ${1000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:23:41'} | ${'PT10S'}    | ${600000+10000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:33:40'} | ${'PT10S'}    | ${1000+10000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:33:41'} | ${'PT10S'}    | ${0+10000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T10:33:42'} | ${'PT10S'}    | ${18534000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:42:35'} | ${'PT10S'}    | ${1000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:42:36'} | ${'PT10S'}    | ${600000+10000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:52:35'} | ${'PT10S'}    | ${1000+10000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:52:36'} | ${'PT10S'}    | ${0+10000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T15:52:37'} | ${'PT10S'}    | ${66664000}
		${["T10:23:41","T15:42:36"]} | ${'PT10M'} | ${'1234-05-01T23:59:59'} | ${'PT10S'}    | ${37422000}
	`('$date in $duration of $starts = remains $remaining ms $status in [$periodStart, $periodEnd]', ({ starts, duration, date, delayAfterRun, recallDelay }) => {
		const raidInfo = RaidInfoFactory.parse(starts, duration, delayAfterRun);
		date = new Date(date);
		expect(raidInfo.reminderAt(date)).toMatchObject({
			info: raidInfo.infoAt(date),
			recallDelay: recallDelay,
		});
	});
});
