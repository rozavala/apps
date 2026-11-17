// @ts-check
// Misiones de Mapa, in the browser: the home by age, mystery places on the
// map, trip missions with time zones, the free planner, skill rounds, the
// Chile order puzzle, saved stars and the daily review. Service workers are
// blocked, speech is off and the sync server is never reached.
const { test, expect } = require('@playwright/test');

async function open(page, o = {}) {
  const { age = 9, lang = 'es', seed = 3, saved, query = '', width } = o;
  if (width) await page.setViewportSize({ width, height: 844 });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, lang, saved]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊', lang };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_tts', JSON.stringify({ test: { mode: 'off', enabled: false, rate: 0.85 } }));
      if (saved) localStorage.setItem('zs_mapa_test', JSON.stringify(saved));
    }
  }, [age, lang, saved || null]);
  await page.goto('/misiones-mapa.html?seed=' + seed + query);
  await page.waitForSelector('#mm-main');
}
const state = (page) => page.evaluate(() => /** @type {any} */ (window).Misiones.state());
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_mapa_test') || 'null'));
const review = (page) => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('zs_review_test') || 'null'); return d ? Object.values(d.items) : []; });
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// Answer the current round question right (or wrong) through the UI.
async function answerRound(page, right = true) {
  const s = await state(page);
  const q = s.round.q;
  if (q.order) {
    for (const id of (right ? q.order : [...q.order].reverse())) await page.click(`.mm-ocard[data-id="${id}"]`);
    await page.click('#mm-ocheck');
  } else {
    const n = await page.locator('.mm-opt').count();
    const i = right ? q.answer : (q.answer + 1) % n;
    await page.click(`.mm-opt[data-i="${i}"]`);
  }
  await page.click('#mm-next');
}

test.describe('Misiones de Mapa', () => {

  test('opens with four missions and links to the other map apps, with no script errors and no sideways scroll', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { width: 390 });
    await expect(page.locator('.mm-sec')).toHaveCount(4);
    await expect(page.locator('.mm-link[href="world-explorer.html"]')).toBeVisible();
    await expect(page.locator('.mm-link[href="world-atlas.html"]')).toBeVisible();
    await expect(page.locator('.mm-link[href="descubre-chile.html"]')).toBeVisible();
    expect(await noHScroll(page)).toBe(true);
    for (const tab of ['mystery', 'trips', 'skills', 'chile']) {
      await page.click(`.mm-tab[data-go="${tab}"]`);
      expect(await noHScroll(page), tab).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('touch targets on the phone are at least 44 px', async ({ page }) => {
    await open(page, { width: 390 });
    for (const view of ['home', 'skills', 'chile', 'trips']) {
      await page.evaluate(v => /** @type {any} */ (window).Misiones.go(v), view);
      const small = await page.evaluate(() => [...document.querySelectorAll('#mm-wrap button, #mm-wrap a')]
        .filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 43.5 || r.width < 43.5); })
        .map(b => b.className + ' ' + b.textContent.trim().slice(0, 20)));
      expect(small, view).toEqual([]);
    }
  });

  test('a mystery place: a wrong tap names the country and adds a clue, the right tap finds it and saves it', async ({ page }) => {
    await open(page, { age: 9 });
    await page.click('.mm-tab[data-go="mystery"]');
    let s = await state(page);
    expect(s.mystery.shown).toBe(1);
    // tap a wrong country (one that is not the answer), through the map
    const wrong = s.mystery.c === 'aus' ? 'bra' : 'aus';
    await page.evaluate(c => document.querySelector(`#mm-mapbox path[data-c="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), wrong);
    await expect(page.locator('#mm-mys-fb .mm-fb.no')).toBeVisible();
    s = await state(page);
    expect(s.mystery.shown).toBe(2);
    await page.click(`.mm-zbtn[data-z="world"]`);
    await page.evaluate(c => document.querySelector(`#mm-mapbox path[data-c="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), s.mystery.c);
    await expect(page.locator('#mm-mys-fb .mm-fb.ok')).toBeVisible();
    expect((await saved(page)).found[s.mystery.c]).toBe(1);
  });

  test('a full mystery round gives stars; a missed place goes to the daily review', async ({ page }) => {
    await open(page, { age: 10 });
    await page.click('.mm-tab[data-go="mystery"]');
    for (let i = 0; i < 5; i++) {
      const s = await state(page);
      if (i === 0) await page.click('#mm-more'), await page.click('#mm-more'), await page.click('#mm-more'), await page.click('#mm-more'), await page.click('#mm-give');
      else await page.evaluate(c => document.querySelector(`#mm-mapbox path[data-c="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), s.mystery.c);
      await page.click('#mm-next');
    }
    await expect(page.locator('.mm-done-t')).toContainText('4 de 5');
    expect((await saved(page)).best.mys).toBe(2);
    const items = await review(page);
    expect(items.length).toBe(1);
    expect(items[0].app).toBe('mapa');
  });

  test('a 5-year-old picks the country from three big pictures with flags', async ({ page }) => {
    await open(page, { age: 5 });
    await page.click('.mm-sec[data-go="mystery"]');
    await expect(page.locator('.mm-pick')).toHaveCount(3);
    await expect(page.locator('.mm-clue .mm-flag')).toBeVisible();      // the flag clue comes first
    const s = await state(page);
    await page.click(`.mm-pick[data-c="${s.mystery.c}"]`);
    await expect(page.locator('.mm-fb.ok')).toBeVisible();
  });

  test('trip mission for a 10-year-old: Santiago 22:00 to San Francisco lands at 05:30 the next day', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-03-02T12:00:00'));
    await open(page, { age: 10, query: '&m=trip&a=sfo' });
    let s = await state(page);
    expect(s.trip.T.arr).toBe('05:30');
    expect(s.trip.T.days).toBe(1);
    await expect(page.locator('.mm-q')).toContainText('9.560 km');
    await page.click(`.mm-opt[data-i="${s.trip.q.answer}"]`);
    await expect(page.locator('.mm-opt.right')).toContainText('12 h 30 min');
    await page.click('#mm-next');
    s = await state(page);
    await expect(page.locator('.mm-q')).toContainText('22:00');
    await page.click(`.mm-opt[data-i="${s.trip.q.answer}"]`);
    await expect(page.locator('.mm-opt.right')).toContainText('05:30 del día siguiente');
    await page.click('#mm-next');
    await expect(page.locator('.mm-done .mm-st.on')).toHaveCount(3);
    expect((await saved(page)).best.trip_sfo).toBe(3);
  });

  test('a 12-year-old also works out the time difference from UTC offsets', async ({ page }) => {
    await open(page, { age: 12, lang: 'en', query: '&m=trip&a=mad' });
    const s = await state(page);
    expect(s.trip.n).toBe(3);
    await page.click(`.mm-opt[data-i="${s.trip.q.answer}"]`);
    await page.click('#mm-next');
    await expect(page.locator('.mm-q')).toContainText('UTC−3');
    await expect(page.locator('.mm-q')).toContainText('UTC+1');
    const s2 = await state(page);
    await expect(page.locator(`.mm-opt[data-i="${s2.trip.q.answer}"]`)).toContainText('4 hours ahead');
  });

  test('a 5-year-old flies the plane by tapping the city, then says which way it went', async ({ page }) => {
    await open(page, { age: 5, query: '&m=trip&a=mad' });
    await page.click('.mm-citybtn[data-city="tyo"]');
    await expect(page.locator('.mm-fb.no')).toContainText('Tokio');
    await page.click('.mm-citybtn[data-city="mad"]');
    await expect(page.locator('.mm-opts-dirs')).toBeVisible();
    const s = await state(page);
    await page.click(`.mm-opt[data-i="${s.trip.q.answer}"]`);
    await expect(page.locator('.mm-opt.right')).toBeVisible();
    await page.click('#mm-next');
    expect((await saved(page)).best.trip_mad).toBe(2);                   // one missed tap costs a little
  });

  test('the free planner adds stops, shows each leg with local times, and saves a trip once', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-01-15T10:00:00'));
    await open(page, { age: 10, query: '&m=plan' });
    await page.selectOption('#mm-add', 'lim');
    await page.selectOption('#mm-add', 'mad');
    await expect(page.locator('.mm-leg')).toHaveCount(2);
    const s = await state(page);
    expect(s.planner.stops).toEqual(['scl', 'lim', 'mad']);
    expect(s.planner.legs[0].dep).toBe('09:00');
    expect(s.planner.legs[0].arr).toBe('10:30');                         // 3 h 30 min, Lima two hours behind
    await page.click('#mm-save');
    await expect(page.locator('#mm-save')).toBeDisabled();
    expect((await saved(page)).plans).toBe(1);
    await page.click('#mm-undo');
    await expect(page.locator('.mm-leg')).toHaveCount(1);
  });

  test('a compass round answered right gives 3 stars and shows the valley map', async ({ page }) => {
    await open(page, { age: 7, query: '&m=sk_compass' });
    await expect(page.locator('.mm-village .mm-vcell')).toHaveCount(9);
    for (let i = 0; i < 6; i++) await answerRound(page, true);
    await expect(page.locator('.mm-done .mm-st.on')).toHaveCount(3);
    expect((await saved(page)).best.sk_compass).toBe(3);
  });

  test('scale, latitude, cross-section and contour rounds all run to the end for a 12-year-old', async ({ page }) => {
    await open(page, { age: 12 });
    for (const key of ['sk_scale', 'sk_latlon', 'sk_profile', 'sk_contour']) {
      await page.evaluate(k => /** @type {any} */ (window).Misiones.go(k), key);
      for (let i = 0; i < 6; i++) await answerRound(page, i !== 0);
      await expect(page.locator('.mm-done-t'), key).toContainText('5 de 6');
      expect((await saved(page)).best[key], key).toBe(2);
    }
    // the misses are waiting in the daily review, with their choices
    const items = await review(page);
    expect(items.length).toBe(4);
    expect(items.every(x => x.app === 'mapa' && x.choices && x.choices.includes(x.answer))).toBe(true);
  });

  test('the Chile order puzzle: tap the regions north to south', async ({ page }) => {
    await open(page, { age: 9, query: '&m=cl_order' });
    await expect(page.locator('.mm-ocard')).toHaveCount(5);
    await expect(page.locator('#mm-ocheck')).toBeDisabled();
    await answerRound(page, true);
    await answerRound(page, false);
    await answerRound(page, true);
    await expect(page.locator('.mm-done-t')).toContainText('2 de 3');
  });

  test('Chile missions: Ruta 5, Rapa Nui and Antarctica run for a 10-year-old; little kids get north, centre and south', async ({ page }) => {
    await open(page, { age: 10 });
    for (const key of ['cl_caps', 'cl_ruta5', 'cl_rapa', 'cl_ant']) {
      await page.evaluate(k => /** @type {any} */ (window).Misiones.go(k), key);
      const n = (await state(page)).round.n;
      for (let i = 0; i < n; i++) await answerRound(page, true);
      expect((await saved(page)).best[key], key).toBe(3);
    }
    await expect(page.locator('.mm-link[href="descubre-chile.html"]')).toBeVisible();
  });

  test('a 5-year-old sees the picture missions for Chile', async ({ page }) => {
    await open(page, { age: 5, query: '&m=chile' });
    await expect(page.locator('.mm-card[data-go="cl_zones"]')).toBeVisible();
    await expect(page.locator('.mm-card[data-go="cl_ruta5"]')).toHaveCount(0);
    await page.click('.mm-card[data-go="cl_zones"]');
    await expect(page.locator('.mm-opts-pics .mm-opt')).toHaveCount(4);
  });

  test('saved progress from an older version keeps its fields and stars show in the header', async ({ page }) => {
    await open(page, { age: 9, saved: { v: 1, best: { mys: 3, extra: 1 }, found: { arg: 1 }, other: 'kept' } });
    await expect(page.locator('.mm-star-line b')).toHaveText('4');          // 3 + 1 from the saved bests
    await page.click('.mm-tab[data-go="mystery"]');
    const s = await state(page);
    await page.evaluate(c => document.querySelector(`#mm-mapbox path[data-c="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), s.mystery.c);
    const d2 = await saved(page);
    expect(d2.other).toBe('kept');
    expect(d2.best.mys).toBe(3);
  });

  test('works on an iPad and on a desktop without sideways scroll', async ({ page }) => {
    for (const width of [820, 1280]) {
      await open(page, { width, age: 9 });
      expect(await noHScroll(page), 'home ' + width).toBe(true);
      await page.click('.mm-tab[data-go="mystery"]');
      expect(await noHScroll(page), 'mystery ' + width).toBe(true);
    }
  });
});
