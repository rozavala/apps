// @ts-check
// Huerto in the browser: planting from the guide, the watering checklist
// (and Today's 3), journal entries with heights, "predict, then measure",
// drawings for the youngest, a photo to a FAKE family server, the
// experiments and the phone layout. Service workers are blocked and the
// live sync server is never reached.
const { test, expect } = require('@playwright/test');

const FAKE = 'http://sync.test';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
const NOW = new Date(2026, 10, 17, 10, 0, 0);   // Tuesday 17 November 2026, mid-morning

async function open(page, o = {}) {
  const { age = 9, lang = 'en', saved, hash = '', server = false } = o;
  await page.clock.setFixedTime(NOW);
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  const fake = { files: {}, items: {}, deleted: [] };
  if (server) {
    await page.route(FAKE + '/**', async (route) => {
      const req = route.request(), u = new URL(req.url());
      const m = /^\/api\/files\/arbol\/([a-f0-9]{32})$/.exec(u.pathname);
      if (m) {
        if (req.method() === 'PUT') { fake.files[m[1]] = { type: req.headers()['content-type'], size: (req.postDataBuffer() || Buffer.alloc(0)).length }; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"saved"}' }); }
        if (req.method() === 'DELETE') { fake.deleted.push(m[1]); delete fake.files[m[1]]; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"deleted"}' }); }
        return fake.files[m[1]] ? route.fulfill({ status: 200, contentType: 'image/png', body: PNG }) : route.fulfill({ status: 404, body: '' });
      }
      const k = /^\/api\/kids\/([^/]+)\/([^/]+)$/.exec(u.pathname);
      if (k && req.method() === 'PUT') { fake.items[k[1] + '/' + k[2]] = JSON.parse(req.postData() || 'null'); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"saved"}' }); }
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    });
  }
  await page.addInitScript(([age, lang, saved]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊', lang };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_tts', JSON.stringify({ test: { mode: 'off', enabled: false, rate: 0.85 } }));
      if (saved) localStorage.setItem('zs_huerto_test', JSON.stringify(saved));
    }
  }, [age, lang, saved || null]);
  await page.goto('/huerto.html' + (hash ? '#' + hash : ''));
  await page.waitForSelector('.hu-head h1');
  if (server) {
    await page.evaluate((url) => { /** @type {any} */ const c = window.CloudSync; c.server = url; c.online = true; }, FAKE);
  }
  return fake;
}
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_huerto_test') || 'null'));
const state = (page) => page.evaluate(() => /** @type {any} */ (window).Huerto.state());
const bean = (extra = {}) => ({ v: 1, plants: [Object.assign({ id: 'b1', sp: 'poroto', name: 'Jack', where: 'cup', planted: '2026-11-03', ev: 1, sprouted: '2026-11-10', flowered: '', harvested: '', water: ['2026-11-15'], log: [], pred: [] }, extra)], exp: {} });

test.describe('Huerto', () => {
  test('a 9-year-old plants a bean from the guide; it shows on the watering list, with no script errors', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await open(page);
    await expect(page.locator('.hu-today')).toContainText('No plants yet');
    await page.click('a[href="#guide"] >> nth=0');
    await expect(page.locator('.hu-gcard')).toHaveCount(20);
    await page.click('.hu-chip[data-id="cup"]');
    expect(await page.locator('.hu-gcard').count()).toBeLessThan(20);
    await page.click('a[href="#plant/poroto"]');
    await expect(page.locator('.hu-fact').first()).toContainText('6 to 10 days');
    await expect(page.locator('.hu-cal-row')).toHaveCount(2);
    await page.click('.hu-stage[data-id="1"]');
    await expect(page.locator('.hu-stage.on')).toHaveText('Sprout');
    await page.click('a[href="#add/poroto"]');
    await page.click('[data-act=where][data-id=cup]');
    await page.fill('#hu-name', 'Jack');
    await page.click('#hu-add button[type=submit]');
    await expect(page.locator('.hu-head h1')).toHaveText('Jack');
    const d = await stored(page);
    expect(d.plants).toHaveLength(1);
    expect(d.plants[0]).toMatchObject({ sp: 'poroto', name: 'Jack', where: 'cup', planted: '2026-11-17', ev: 1, water: ['2026-11-17'] });
    await page.goto('/huerto.html#home');
    await expect(page.locator('.hu-check-row')).toHaveCount(1);
    await expect(page.locator('.hu-check-row')).toContainText('Watered today');
    expect(errors).toEqual([]);
  });

  test('the watering checklist: a thirsty plant is due, a tap waters it, and Today\'s 3 sees it', async ({ page }) => {
    await open(page, { saved: bean() });
    // the hub plan reads the same blob
    expect(await page.evaluate(() => /** @type {any} */ (window).HubPlan ? 'hub' : 'none')).toBe('none');
    await expect(page.locator('.hu-check-row.is-due')).toHaveCount(1);
    await page.click('.hu-check-row [data-act=water]');
    await expect(page.locator('.hu-check-row.is-done')).toHaveCount(1);
    const d = await stored(page);
    expect(d.plants[0].water).toEqual(['2026-11-15', '2026-11-17']);
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_activity_test') || '[]'));
    expect(JSON.stringify(log)).toContain('Watered Jack');
  });

  test('Today\'s 3 puts Huerto first among equals when a plant needs water', async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript((saved) => {
      const p = { name: 'Test', color: 'blue', age: 9, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_huerto_test', JSON.stringify(saved));
    }, bean());
    await page.goto('/');
    await page.waitForFunction(() => typeof window.HubPlan !== 'undefined');
    const out = await page.evaluate(() => {
      /** @type {any} */ const H = window.HubPlan;
      const user = { name: 'Test', age: 9 }, eligible = ['math', 'huerto', 'lab', 'story', 'art'];
      const base = { scheduled: eligible, activity: { last: {}, today: {} }, stats: { appStats: {} }, reviewDue: 0, now: new Date(2026, 10, 17, 10) };
      return { due: H.huertoDue('Test', new Date(2026, 10, 17, 10)), dueLater: H.huertoDue('Test', new Date(2026, 10, 15, 10)),
        withDue: H.pickToday(user, eligible, base), without: H.pickToday(user, eligible, Object.assign({}, base, { huertoDue: false })) };
    });
    expect(out.due).toBe(true);
    expect(out.dueLater).toBe(false);
    expect(out.withDue[0]).toBe('huerto');
    await expect(page.locator('.card-huerto')).toHaveCount(1);
  });

  test('a measurement settles the guess from a week ago: very close earns a star, and the chart has a line', async ({ page }) => {
    const saved = bean({ log: [{ id: 'e1', d: '2026-11-10', h: 4 }], pred: [{ made: '2026-11-10', for: '2026-11-17', h: 9 }] });
    await open(page, { saved, hash: 'p/b1' });
    await expect(page.locator('.hu-predict')).toContainText('9 cm');
    await expect(page.locator('.hu-chart')).toHaveCount(1);
    const before = (await state(page)).stars;
    await page.click('a[href="#entry/b1"]');
    await page.fill('#hu-eh', '10');
    await page.fill('#hu-en', 'Two new leaves');
    await page.click('#hu-esave');
    await expect(page.locator('.zsd-message')).toContainText('Very close');
    await page.click('.zsd-ok');
    const d = await stored(page);
    expect(d.plants[0].log).toHaveLength(2);
    expect(d.plants[0].pred[0]).toMatchObject({ h: 9, got: 10 });
    expect((await state(page)).stars).toBe(before + 1);
    await expect(page.locator('.hu-chart path[stroke="#2f8a2c"]')).toHaveCount(1);
    await expect(page.locator('.hu-rate')).toContainText('a day');
    // a new guess for next week
    await page.locator('#hu-pred-r').fill('14');
    await page.click('[data-act=predict]');
    expect((await stored(page)).plants[0].pred[1]).toMatchObject({ made: '2026-11-17', for: '2026-11-24', h: 14 });
  });

  test('a 5-year-old draws first and sees picture bars, with no guessing game', async ({ page }) => {
    await open(page, { age: 5, lang: 'es', saved: bean({ log: [{ id: 'e1', d: '2026-11-12', h: 2 }] }), hash: 'p/b1' });
    expect((await state(page)).tier).toBe('beginner');
    await expect(page.locator('.hu-predict')).toHaveCount(0);
    await expect(page.locator('.hu-chart rect')).toHaveCount(1);
    await page.click('a[href="#entry/b1"]');
    const cv = page.locator('#hu-canvas');
    await expect(cv).toBeVisible();
    const box = await cv.boundingBox();
    if (!box) throw new Error('no canvas');
    await page.mouse.move(box.x + 40, box.y + 120); await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + 80, { steps: 5 }); await page.mouse.move(box.x + 90, box.y + 40, { steps: 5 }); await page.mouse.up();
    await page.click('#hu-ew');
    await page.click('#hu-esave');
    await expect(page.locator('.hu-thumb-dr svg path')).toHaveCount(1);
    const e = (await stored(page)).plants[0].log.slice(-1)[0];
    expect(e.w).toBe(1);
    expect(e.dr[0].p.length).toBeGreaterThan(4);
  });

  test('a photo goes to the family server, never into the saved blob, and deleting the entry removes it there', async ({ page }) => {
    const fake = await open(page, { saved: bean(), hash: 'entry/b1', server: true });
    await page.evaluate(() => { location.hash = 'p/b1'; });
    await page.evaluate(() => { location.hash = 'entry/b1'; });
    await expect(page.locator('#hu-ephoto')).toHaveCount(1);
    await page.setInputFiles('#hu-ephoto', [{ name: 'bean.png', mimeType: 'image/png', buffer: PNG }]);
    await page.fill('#hu-en', 'Photo day');
    await page.click('#hu-esave');
    await expect(page.locator('.hu-thumb img')).toHaveCount(1);
    const e = (await stored(page)).plants[0].log[0];
    expect(e.ph.id).toMatch(/^[a-f0-9]{32}$/);
    expect(Object.keys(fake.files)).toContain(e.ph.id);
    const raw = await page.evaluate(() => localStorage.getItem('zs_huerto_test') || '');
    expect(raw).not.toContain('data:image');
    expect(raw.length).toBeLessThan(4000);
    await page.click('[data-act=delentry]');
    await page.click('.zsd-ok');
    await expect(page.locator('.hu-log-row')).toHaveCount(0);
    await expect.poll(() => fake.deleted.includes(e.ph.id)).toBe(true);
  });

  test('without the family server there is no photo button, only a note', async ({ page }) => {
    await open(page, { saved: bean(), hash: 'entry/b1' });
    await expect(page.locator('#hu-ephoto')).toHaveCount(0);
    await expect(page.locator('.hu-form')).toContainText('family server');
  });

  test('an experiment: hypothesis, three observations, what happened, and what science says', async ({ page }) => {
    await open(page, { hash: 'exp/sol' });
    await page.click('[data-act=guess][data-id=a]');
    for (const [day, a, b] of [[17, '1', '1.5'], [19, '3', '5'], [21, '5', '8.5']]) {
      await page.clock.setFixedTime(new Date(2026, 10, day, 10));
      await page.evaluate(() => /** @type {any} */ (window).Huerto.reload());
      await page.fill('#hu-obs input[data-k=a]', a);
      await page.fill('#hu-obs input[data-k=b]', b);
      await page.selectOption('#hu-obs select[data-k=cb]', 'pale');
      await page.click('#hu-obs button[type=submit]');
    }
    await expect(page.locator('.hu-table tbody tr')).toHaveCount(3);
    await page.click('[data-act=result][data-id=b]');
    await page.fill('#hu-learn', 'The dark one got tall and yellow');
    await page.click('[data-act=finish]');
    await expect(page.locator('.hu-science')).toContainText('photosynthesis');
    await expect(page.locator('.hu-verdict')).toContainText('scientists');
    const x = (await stored(page)).exp.sol;
    expect(x).toMatchObject({ guess: 'a', result: 'b', start: '2026-11-17', learned: 'The dark one got tall and yellow' });
    expect(x.obs).toHaveLength(3);
    expect((await state(page)).stars).toBe(3);
  });

  test('the calendar follows the chosen place, and the seasons page explains why', async ({ page }) => {
    await open(page, { hash: 'guide' });
    await page.click('.hu-chip[data-id="month"]');
    const ca = await page.locator('.hu-gcard b').allTextContents();
    await page.click('[data-act=region][data-id=cl]');
    const cl = await page.locator('.hu-gcard b').allTextContents();
    expect(ca.join()).toContain('Radish');      // November: radishes in California
    expect(cl.join()).toContain('Bean');        // November: beans in Chile
    expect(ca.join()).not.toContain('Corn');
    expect((await stored(page)).region).toBe('cl');
    await page.goto('/huerto.html#seasons');
    await expect(page.locator('.hu-seasons')).toBeVisible();
    await expect(page.locator('.hu-root')).toContainText('tilted');
  });

  test('phone width: no sideways scroll on any screen, and buttons are big enough to tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, { lang: 'both', saved: bean({ log: [{ id: 'e1', d: '2026-11-10', h: 4, n: 'hello' }, { id: 'e2', d: '2026-11-14', h: 6 }] }) });
    for (const h of ['home', 'guide', 'plant/tomate', 'add/poroto', 'p/b1', 'entry/b1', 'exp', 'exp/bolsa', 'seasons']) {
      await page.evaluate((h) => { location.hash = h; }, h);
      await page.waitForTimeout(50);
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(w, h).toBeLessThanOrEqual(390);
      const small = await page.evaluate(() => Array.from(document.querySelectorAll('.hu-root button, .hu-root .hu-btn')).filter(b => {
        const r = b.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44);
      }).map(b => b.className + ':' + (b.textContent || '').trim().slice(0, 20)));
      expect(small, h).toEqual([]);
    }
  });
});
