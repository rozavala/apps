// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// The Smart Schedule hides hub cards by CSS selector. A selector that
// matches nothing silently never hides its app (Descubre Chile shipped
// that way once), and an app missing from every day is never offered.
const LEARN_BY_DOING = ['circuit', 'engineer', 'negocio', 'euclid', 'cocina',
  'marinero', 'naturaleza', 'secretos', 'clock', 'calculo', 'linea', 'examen', 'logica', 'mapa', 'typing', 'taller', 'trivia'];

test.describe('Smart Schedule', () => {

  test('every scheduled app has a hub card, and the new apps each get a day', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    await page.waitForFunction(() => typeof window.AppSchedule !== 'undefined');

    const out = await page.evaluate(() => {
      const days = [0, 1, 2, 3, 4, 5, 6].map(d =>
        // @ts-ignore
        window.AppSchedule.getScheduleForDay(d).apps);
      const ids = new Set(days.flat());
      const missingCards = [...ids].filter(id =>
        !document.querySelector('.card-' + (id === 'chile' ? 'history' : id)));
      return { days, missingCards };
    });

    expect(out.missingCards, 'scheduled ids without a hub card').toEqual([]);
    for (const id of LEARN_BY_DOING) {
      const n = out.days.filter(d => d.includes(id)).length;
      expect(n, id + ' days per week').toBeGreaterThanOrEqual(1);
    }
  });

  test('on a Monday the hub shows Monday\'s apps and hides the rest', async ({ page }) => {
    // Monday 2 November 2026, mid-morning (outside Off Hours).
    await page.clock.setFixedTime(new Date(2026, 10, 2, 10, 0, 0));
    await injectMockProfile(page);
    await page.addInitScript(() => {
      localStorage.removeItem('zs_schedule_override');
      localStorage.setItem('zs_schedule_mode', 'smart');
    });
    await page.goto('/');
    await page.waitForFunction(() => typeof window.AppSchedule !== 'undefined');

    const shown = await page.evaluate(() => {
      // @ts-ignore
      window.AppSchedule.applyToHub(window.getActiveUser());
      const vis = (c) => {
        const el = document.querySelector(c);
        return !!el && getComputedStyle(el).display !== 'none';
      };
      return { circuit: vis('.card-circuit'), clock: vis('.card-clock'),
               cocina: vis('.card-cocina'), euclid: vis('.card-euclid'),
               move: vis('.card-move') };
    });

    expect(shown).toEqual({ circuit: true, clock: true, cocina: false, euclid: false, move: true });
  });

  test('Examen y Virtudes is offered every evening, from 18:00, and not in the morning', async ({ page }) => {
    await injectMockProfile(page);
    await page.addInitScript(() => {
      localStorage.removeItem('zs_schedule_override');
      localStorage.setItem('zs_schedule_mode', 'smart');
    });
    // Monday 2 November 2026 in the suite's time zone (America/Los_Angeles).
    const at = async (h) => {
      await page.clock.setFixedTime(new Date('2026-11-02T' + String(h).padStart(2, '0') + ':00:00-08:00'));
      await page.goto('/');
      await page.waitForFunction(() => typeof window.AppSchedule !== 'undefined');
      return page.evaluate(() => {
        // @ts-ignore
        window.AppSchedule.applyToHub(window.getActiveUser());
        const el = document.querySelector('.card-examen');
        // @ts-ignore
        return { today: window.AppSchedule.getTodayApps().includes('examen'), shown: !!el && getComputedStyle(el).display !== 'none',
          // @ts-ignore
          days: [0, 1, 2, 3, 4, 5, 6].filter(d => window.AppSchedule.getScheduleForDay(d).apps.includes('examen')).length };
      });
    };
    expect(await at(10)).toEqual({ today: false, shown: false, days: 7 });
    expect(await at(17)).toEqual({ today: false, shown: false, days: 7 });
    expect(await at(18)).toEqual({ today: true, shown: true, days: 7 });
    expect(await at(20)).toEqual({ today: true, shown: true, days: 7 });
  });

});

test.describe('Weekly schedule editor (Parents Corner)', () => {

  test('an edited day still gets apps added to the suite later', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await injectMockProfile(page);
    await page.addInitScript(() => {
      // Tuesday was edited by a parent before (an older plain list).
      localStorage.setItem('zs_schedule_override', JSON.stringify({ 2: ['piano', 'chess'] }));
    });
    await page.goto('/');
    await page.waitForFunction(() => typeof window.AppSchedule !== 'undefined');
    const out = await page.evaluate(() => {
      // @ts-ignore
      const S = window.AppSchedule;
      // A new app arrives and is scheduled on Tuesdays.
      S.ALL_APPS.push({ id: 'newapp', card: '.card-newapp' });
      S.SMART_SCHEDULE[2].push('newapp');
      const legacy = S.getScheduleForDay(2);
      // The parent saves Tuesday again, now unticking it: it stays off.
      localStorage.setItem('zs_schedule_override', JSON.stringify({ 2: { apps: ['piano'], known: S.ALL_APPS.map(a => a.id) } }));
      const saved = S.getScheduleForDay(2);
      // A day saved before the app existed gets it.
      const before = S.ALL_APPS.map(a => a.id).filter(id => id !== 'newapp');
      localStorage.setItem('zs_schedule_override', JSON.stringify({ 2: { apps: ['piano'], known: before } }));
      const older = S.getScheduleForDay(2);
      // An older plain list knew only the apps from before Examen y Virtudes,
      // so the roadmap apps scheduled on Tuesday join it too.
      const roadmap = S.SMART_SCHEDULE[2].filter(id => ['examen', 'logica', 'mapa', 'typing', 'escritura', 'huerto', 'taller', 'trivia', 'newapp'].includes(id));
      return { legacy, saved, older, roadmap };
    });
    expect(out.legacy.mode).toBe('manual');
    expect(out.legacy.apps.slice(0, 2)).toEqual(['piano', 'chess']);
    expect(out.legacy.apps.slice(2).sort()).toEqual(out.roadmap.slice().sort());
    expect(out.legacy.apps).toContain('examen');
    expect(out.legacy.apps).toContain('newapp');
    expect(out.saved.apps).toEqual(['piano']);
    expect(out.older.apps).toEqual(['piano', 'newapp']);
  });

  test('the editor shows app names and saves the apps it knew', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await injectMockProfile(page);
    await page.addInitScript(() => localStorage.removeItem('zs_schedule_override'));
    await page.goto('/');
    await page.waitForFunction(() => typeof window.AppSchedule !== 'undefined');
    // @ts-ignore
    await expect.poll(() => page.evaluate(() => window.AppSchedule.renderScheduleConfig())).toContain('Code Lab');
    // @ts-ignore
    await page.evaluate(() => window.AppSchedule.editDay(1));
    const labels = page.locator('#schedule-day-checkboxes label');
    await expect(labels.filter({ hasText: 'Math Galaxy' })).toHaveCount(1);
    await expect(labels.filter({ hasText: 'Circuit Lab' })).toHaveCount(1);
    // Always-visible pages are not offered (ticking them changes nothing).
    await expect(labels.filter({ hasText: 'Trophy' })).toHaveCount(0);
    await page.locator('#schedule-day-checkboxes input[value="chess"]').check();
    // @ts-ignore
    await page.evaluate(() => window.AppSchedule.saveDay(1));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_schedule_override') || '{}')[1]);
    expect(saved.apps).toContain('chess');
    expect(saved.known).toContain('examen');
  });
});

test.describe('Parent Dashboard', () => {
  test('shows a row for every app the kid has stars in, new apps included', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await injectMockProfile(page);
    await page.addInitScript(() => {
      localStorage.setItem('zs_circuit_test', JSON.stringify({ levels: { 1: { stars: 3 }, 2: { stars: 2 } }, totalStars: 5 }));
    });
    await page.goto('/');
    await page.waitForFunction(() => typeof window.openDashboard === 'function' && typeof getAppStars === 'function');
    // @ts-ignore
    const n = await page.evaluate(() => getAppStars('circuit', JSON.parse(localStorage.getItem('zs_circuit_test'))));
    expect(n).toBeGreaterThan(0);
    // @ts-ignore
    await page.evaluate(() => window.openDashboard());
    const row = page.locator('#dash-content .dash-app-row', { hasText: 'Circuit Lab' });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('⭐ ' + n);
  });
});
