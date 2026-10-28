// @ts-check
// Day lists across the November clock change in Santa Clara: Sunday
// Nov 1 2026 is 25 hours long, so stepping by 24 h repeats that Sunday
// and drops the last day.
const { test, expect } = require('@playwright/test');

test.use({ timezoneId: 'America/Los_Angeles', locale: 'en-US', serviceWorkers: 'block' });

test('the Family Wall week shows each day once across the clock change', async ({ page }) => {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.clock.setFixedTime(new Date('2026-10-27T09:00:00-07:00'));
  await page.addInitScript(() => {
    const kid = { name: 'Mid', color: '#10B981', age: 8, avatar: '🐸' };
    localStorage.setItem('zs_profiles', JSON.stringify([kid]));
    localStorage.setItem('zs_active_user', JSON.stringify(kid));
  });
  await page.goto('/family.html');
  await page.waitForLoadState('networkidle');
  const dates = await page.evaluate(() => {
    // One afternoon event a day, Tue Oct 27 – Tue Nov 3.
    const events = [];
    for (let d = 27; d <= 34; d++) {
      events.push({ summary: 'Practice ' + d, start: new Date(2026, 9, d, 16, 0), allDay: false });
    }
    FamilyCalendar.getUrls = () => [{ id: 'c1', url: 'https://example.invalid/cal.ics' }];
    FamilyCalendar.getUpcoming = () => events;
    FamilyWall.paint();
    return [...document.querySelectorAll('#fw-week-card .fw-week-day-date')].map(e => e.textContent);
  });
  expect(dates).toEqual(['Oct 28', 'Oct 29', 'Oct 30', 'Oct 31', 'Nov 1', 'Nov 2']);
  await expect(page.locator('#fw-week-card')).toContainText('Practice 33');   // Mon Nov 2
});
