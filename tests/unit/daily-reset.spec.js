// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// UTC midnight is 5 PM here in October; the day must turn at local midnight.
test.use({ timezoneId: 'America/Los_Angeles', serviceWorkers: 'block' });

async function dayAt(page, when) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.addInitScript(() => {
    localStorage.setItem('zs_timer_test', JSON.stringify({ date: '2026-10-19', minutesUsed: 15, maxMinutes: 20 }));
    localStorage.setItem('zs_chores_test', JSON.stringify({ date: '2026-10-19', completed: ['bed'], totalTokens: 3 }));
  });
  await page.clock.setFixedTime(new Date(when));
  await page.goto('/');
  await page.waitForFunction(() => !!window.TimerManager && !!window.ChoresManager);
  return page.evaluate(() => ({
    used: TimerManager.getDataForKid('Test').minutesUsed,
    chores: ChoresManager.getStatus().completed.length,
  }));
}

test('screen time and chores keep the day through the evening', async ({ page }) => {
  expect(await dayAt(page, '2026-10-19T17:30:00-07:00')).toEqual({ used: 15, chores: 1 });
});

test('screen time and chores start fresh after local midnight', async ({ page }) => {
  expect(await dayAt(page, '2026-10-20T00:05:00-07:00')).toEqual({ used: 0, chores: 0 });
});
