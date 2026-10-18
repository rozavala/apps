// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// 2026-10-19 is a Monday, 2026-10-23 a Friday.
const MON_EARLY = '2026-10-19T06:30:00-03:00';   // Chile summer time
const ON = { enabled: true, start: '21:00', end: '07:20', days: [1, 2, 3, 4, 5] };

// No service worker: its first-visit reload would race the fake clock.
test.use({ timezoneId: 'America/Santiago', serviceWorkers: 'block' });

async function setup(page, settings = ON) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.addInitScript((s) => {
    if (s && !localStorage.getItem('zs_off_hours')) localStorage.setItem('zs_off_hours', JSON.stringify(s));
  }, settings);
}

test.describe('Off hours', () => {
  test('school nights and mornings are off, weekends are not', async ({ page }) => {
    await setup(page);
    await page.goto('/math-galaxy.html');
    await page.waitForFunction(() => !!window.OffHours);
    const res = await page.evaluate(() => {
      const at = (s) => {
        const w = OffHours.currentWindow(new Date(s));
        return w ? w.until.toTimeString().slice(0, 5) + ' ' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][w.until.getDay()] : null;
      };
      return {
        monEarly: at('2026-10-19T06:30:00'), monWake: at('2026-10-19T07:20:00'),
        monLate: at('2026-10-19T20:59:00'), monNight: at('2026-10-19T21:00:00'),
        friNight: at('2026-10-23T21:30:00'), satEarly: at('2026-10-24T06:00:00'),
        sunNight: at('2026-10-18T21:30:00'), sunNoon: at('2026-10-18T12:00:00'),
        friEarly: at('2026-10-23T05:00:00'),
      };
    });
    expect(res).toEqual({
      monEarly: '07:20 Mon', monWake: null, monLate: null, monNight: '07:20 Tue',
      friNight: null, satEarly: null, sunNight: '07:20 Mon', sunNoon: null, friEarly: '07:20 Fri',
    });
  });

  test('an app page is locked early on a school morning until a parent unlocks it', async ({ page }) => {
    await setup(page);
    await page.clock.install({ time: new Date(MON_EARLY) });
    await page.goto('/math-galaxy.html');
    const lock = page.locator('#off-hours-overlay');
    await expect(lock).toBeVisible();
    await expect(lock).toContainText('7:20 AM');

    // Screen time doesn't tick while the apps are asleep
    await page.clock.runFor('02:30');
    expect(await page.evaluate(() => TimerManager.getDataForKid('Test').minutesUsed)).toBe(0);

    await page.getByRole('button', { name: '🔒 Parents' }).click();
    await page.locator('#oh-pin-input').fill('9999');
    await page.locator('#oh-pin-ok').click();
    await expect(lock).toBeVisible();
    await page.locator('#oh-pin-input').fill('1234');
    await page.locator('#oh-pin-ok').click();
    await expect(lock).toHaveCount(0);

    // The unlock lasts for this tab, through page loads
    await page.reload();
    await page.waitForFunction(() => !!window.OffHours);
    await expect(lock).toHaveCount(0);
  });

  test('an open app warns at 8:55 and falls asleep at 9:00', async ({ page }) => {
    await setup(page);
    await page.clock.install({ time: new Date('2026-10-19T20:54:30-03:00') });
    await page.goto('/math-galaxy.html');
    await page.waitForFunction(() => !!window.OffHours);
    await expect(page.locator('#off-hours-overlay')).toHaveCount(0);
    await page.evaluate(() => {
      window.__toasts = [];
      const t = ZsDialog.toast;
      ZsDialog.toast = (msg, ...rest) => { window.__toasts.push(msg); return t(msg, ...rest); };
    });
    await page.clock.runFor('01:00');
    expect(await page.evaluate(() => window.__toasts)).toEqual(['🌙 Apps go to sleep at 9:00 PM — time to finish up.']);
    await page.clock.runFor('05:30');
    await expect(page.locator('#off-hours-overlay')).toBeVisible();
    // ...and wakes up on its own in the morning
    await page.clock.runFor('10:20:00');
    await expect(page.locator('#off-hours-overlay')).toHaveCount(0);
  });

  test('the hub stays usable with a banner instead of a lock', async ({ page }) => {
    await setup(page);
    await page.clock.setFixedTime(new Date(MON_EARLY));
    await page.goto('/');
    await expect(page.locator('#off-hours-banner')).toContainText('asleep until 7:20 AM');
    await expect(page.locator('#off-hours-overlay')).toHaveCount(0);
    await expect(page.locator('body')).toHaveClass(/zs-off-hours/);
  });

  test('pages that aren\'t apps are never locked', async ({ page }) => {
    await setup(page);
    await page.clock.setFixedTime(new Date(MON_EARLY));
    await page.goto('/home-timer.html');
    await page.waitForLoadState('load');
    expect(await page.evaluate(() => typeof window.OffHours)).toBe('undefined');
  });

  test('Parents Corner changes the hours and syncs them to the family', async ({ page }) => {
    await setup(page);
    await page.clock.setFixedTime(new Date(MON_EARLY));
    await page.goto('/');
    await page.waitForFunction(() => !!window.OffHours && !!window.CloudSync);
    await page.evaluate(() => {
      window.__puts = [];
      window.fetch = async (url, opts) => {
        if (opts && opts.method === 'PUT') window.__puts.push(String(url));
        return { ok: true, status: 200, json: async () => ({ status: 'saved', syncedAt: new Date().toISOString() }) };
      };
      CloudSync.online = true;
      window.openParentsCorner();
    });
    const box = page.locator('#off-hours-config');
    await expect(box).toBeVisible();
    await box.getByLabel('Sat').check();
    await box.getByLabel('Apps sleep at night').uncheck();
    await expect(page.locator('#off-hours-banner')).toHaveCount(0);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_off_hours')));
    expect(saved).toMatchObject({ enabled: false, days: [1, 2, 3, 4, 5, 6] });
    await expect.poll(() => page.evaluate(() => window.__puts.filter(u => u.endsWith('/_household/off_hours')).length)).toBeGreaterThan(0);
  });

  test('off by default under browser tests unless a test opts in', async ({ page }) => {
    await setup(page, null);
    await page.clock.setFixedTime(new Date(MON_EARLY));
    await page.goto('/math-galaxy.html');
    await page.waitForFunction(() => !!window.OffHours);
    expect(await page.evaluate(() => OffHours.getSettings().enabled)).toBe(false);
    await expect(page.locator('#off-hours-overlay')).toHaveCount(0);
  });
});
