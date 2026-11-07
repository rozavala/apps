// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

// A planner saved before the redesign: none of the new fields.
const OLD_PLANNER = {
  trips: [{
    id: 'old1', name: 'Pucón', destination: 'Pucón', country: 'Chile', icon: '🌋',
    startDate: '2027-01-03', endDate: '2027-01-05',
    packing: { shared: [{ id: 'p_s_0', label: 'Hat', packed: true }] },
    itinerary: { '2027-01-04': 'Kayak en el lago.' },
    quiz: [{ q: 'Which volcano?', options: ['Villarrica', 'Osorno'], answer: 0, explain: 'Villarrica.' }]
  }]
};

test.describe('Vacation Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 10, 7, 10, 0, 0));
    await injectMockProfile(page);
    await page.addInitScript(([planner, key]) => {
      if (!localStorage.getItem('zs_vacation')) {
        localStorage.setItem('zs_vacation', JSON.stringify(planner));
        localStorage.setItem('zs_vacquiz_' + key, JSON.stringify({ old1: { best: 1, total: 1 } }));
      }
    }, [OLD_PLANNER, KEY]);
  });

  test('a trip saved before the redesign still opens, with its plans', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/vacation.html');
    await expect(page.locator('.vc-trip-name')).toHaveText('Pucón');
    await expect(page.locator('.vc-trip-art svg')).toHaveCount(1);
    await page.locator('.vc-trip').click();
    await expect(page.locator('.vc-hero h1')).toContainText('Pucón');
    await expect(page.locator('.vc-big-cd')).toContainText('57');
    await expect(page.locator('.vc-day-text').nth(1)).toContainText('Kayak');
    await expect(page.locator('.vc-quiz-best')).toContainText('1 / 1');
    expect(errors).toEqual([]);
  });

  test('"I spy" ticks are saved per kid without touching quiz scores', async ({ page }) => {
    await page.addInitScript(() => {
      const d = JSON.parse(localStorage.getItem('zs_vacation'));
      d.trips[0].spotIt = [{ id: 'volcano', emoji: '🌋', label: 'A volcano', art: 'volcano' },
                           { id: 'kayak', emoji: '🛶', label: 'A kayak' }];
      localStorage.setItem('zs_vacation', JSON.stringify(d));
    });
    await page.goto('/vacation.html');
    await page.locator('.vc-trip').click();
    await page.locator('.vc-spot-tile').first().click();
    await expect(page.locator('.vc-spot-bar')).toContainText('1 of 2');
    await expect(page.locator('.vc-spot-tile').first()).toHaveAttribute('aria-pressed', 'true');

    const blob = await page.evaluate((k) => JSON.parse(localStorage.getItem('zs_vacquiz_' + k)), KEY);
    expect(blob.old1).toEqual({ best: 1, total: 1 });
    expect(blob._spot).toEqual({ old1: ['volcano'] });

    await page.reload();
    await page.locator('.vc-trip').click();
    await expect(page.locator('.vc-spot-bar')).toContainText('1 of 2');
  });

  test('a parent can import a trip file, and importing it again updates it', async ({ page }) => {
    await page.addInitScript(() => { window.requestPinThen = (fn) => fn(); });
    await page.goto('/vacation.html');
    await page.evaluate(() => { /* @ts-ignore */ Vacation.unlockParent(); /* @ts-ignore */ Vacation.importStart(); });
    const trip = {
      id: 'nola', name: 'New Orleans', destination: 'New Orleans', country: 'United States',
      startDate: '2026-11-22', endDate: '2026-11-27',
      itinerary: { '2026-11-22': 'Vuelo.', 'not-a-date': 'x' },
      packingExtra: { shared: ['Bug spray'], perKid: ['Walking shoes'] }
    };
    await page.fill('#vc-import-text', JSON.stringify(trip));
    await page.locator('.vc-form-actions .vc-btn-primary').click();
    await expect(page.locator('.vc-hero h1')).toContainText('New Orleans');

    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_vacation')).trips);
    expect(saved.map(t => t.id)).toEqual(['old1', 'nola']);
    const nola = saved[1];
    expect(Object.keys(nola.itinerary)).toEqual(['2026-11-22']);
    expect(nola.packingExtra).toBeUndefined();
    expect(nola.packing.shared.map(i => i.label)).toContain('Bug spray');
    expect(nola.packing[TEST_PROFILE.name].map(i => i.label)).toContain('Walking shoes');

    // Re-import with a new name: same trip updated, packing kept.
    await page.evaluate(() => { /* @ts-ignore */ Vacation.importStart(); });
    await page.fill('#vc-import-text', JSON.stringify(Object.assign({}, trip, { name: 'NOLA' })));
    await page.locator('.vc-form-actions .vc-btn-primary').click();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_vacation')).trips);
    expect(saved.length).toBe(2);
    expect(saved[1].name).toBe('NOLA');
    expect(saved[1].packing).toEqual(nola.packing);
  });
});
