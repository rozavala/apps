// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// The Smart Schedule hides hub cards by CSS selector. A selector that
// matches nothing silently never hides its app (Descubre Chile shipped
// that way once), and an app missing from every day is never offered.
const LEARN_BY_DOING = ['circuit', 'engineer', 'negocio', 'euclid', 'cocina',
  'marinero', 'naturaleza', 'secretos', 'clock', 'calculo', 'linea', 'examen', 'logica', 'mapa', 'typing', 'taller'];

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
