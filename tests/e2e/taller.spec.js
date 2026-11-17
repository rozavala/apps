// @ts-check
// Taller de Máquinas in the browser: the machines by age, a drag that
// lifts the load, challenges (too heavy → fix → stars), the gear lab,
// the bicycle, a chain-reaction run, and phone layout. Service workers
// are blocked and the sync server is never reached.
const { test, expect } = require('@playwright/test');

async function open(page, o = {}) {
  const { age = 8, lang, saved, hash = '', width } = o;
  if (width) await page.setViewportSize({ width, height: 844 });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, lang, saved]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
      if (lang) p.lang = lang;
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_tts', JSON.stringify({ test: { mode: 'off', enabled: false, rate: 0.85 } }));
      if (saved) localStorage.setItem('zs_taller_test', JSON.stringify(saved));
    }
  }, [age, lang || null, saved || null]);
  await page.goto('/taller-maquinas.html' + hash);
  await page.waitForSelector('#tm-wrap > *');
}
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_taller_test') || 'null'));
const T = (page, js) => page.evaluate(js);

// Drag the machine's handle along its direction (or round its centre).
async function operate(page) {
  const hit = await page.evaluate(() => {
    // @ts-ignore
    const st = window.Taller._state.m, r = document.getElementById('tm-cv').getBoundingClientRect();
    return { h: st.hit, left: r.left, top: r.top };
  });
  const h = hit.h, x0 = hit.left + h.hx, y0 = hit.top + h.hy;
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  if (h.cx != null) {
    const cx = hit.left + h.cx, cy = hit.top + h.cy, R = Math.max(30, Math.hypot(h.hx - h.cx, h.hy - h.cy));
    let a = Math.atan2((h.hy - h.cy) / (h.squash || 1), h.hx - h.cx);
    const dir = h.squash ? 1 : -1;
    for (let i = 0; i < h.turns * 16 + 8; i++) {
      a += dir * Math.PI / 8;
      await page.mouse.move(cx + Math.cos(a) * R, cy + Math.sin(a) * R * (h.squash || 1));
    }
  } else {
    for (let i = 1; i <= 12; i++) await page.mouse.move(x0 + h.ux * h.travel * 1.2 * i / 12, y0 + h.uy * h.travel * 1.2 * i / 12);
  }
  await page.mouse.up();
}

test.describe('Taller de Máquinas', () => {

  test('home: five sections, the hero canvas and the Lab Explorer link, no script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page);
    await expect(page.locator('.tm-home-card')).toHaveCount(5);
    await expect(page.locator('#tm-hero')).toBeVisible();
    await expect(page.locator('a.tm-link-card')).toHaveAttribute('href', 'lab-explorer.html');
    expect(errors).toEqual([]);
  });

  test('dragging the lever handle lifts the load and earns the machine star', async ({ page }) => {
    await open(page);
    await page.click('[data-go="machines"]');
    await expect(page.locator('.tm-mcard')).toHaveCount(6);
    await page.click('[data-m="lever"]');
    await expect(page.locator('#tm-cv')).toBeVisible();
    await operate(page);
    // @ts-ignore
    expect(await T(page, () => window.Taller._state.m.u)).toBeGreaterThan(0.99);
    await expect(page.locator('#tm-flash')).toContainText('works');
    expect((await saved(page)).seen.lever).toBe(1);
  });

  test('every machine can be turned or pulled by hand when it is light enough', async ({ page }) => {
    await open(page);
    for (const m of ['pulley', 'incline', 'wheel', 'screw', 'wedge']) {
      // @ts-ignore
      await page.evaluate(m => window.Taller.machine(m), m);
      // make each one light enough to go
      await page.evaluate(m => {
        // @ts-ignore
        const st = window.Taller._state.m;
        if (m === 'pulley') st.p.n = 4;
        if (m === 'incline') st.p.length = 4;
        if (m === 'wheel') st.p.wheelR = 0.4;
        if (m === 'wedge') { st.p.length = 0.3; st.p.thickness = 0.03; }
        // @ts-ignore
        window.Taller._state.draw();
      }, m);
      await operate(page);
      // @ts-ignore
      expect(await T(page, () => window.Taller._state.m.u), m).toBeGreaterThan(0.99);
    }
    const d = await saved(page);
    expect(Object.keys(d.seen).sort()).toEqual(['incline', 'pulley', 'screw', 'wedge', 'wheel']);
  });

  test('challenge: 100 kg with one rope is too heavy; four ropes lifts it (2 stars on the second try)', async ({ page }) => {
    await open(page, { hash: '#challenges' });
    await page.click('[data-ch="c-pulley"]');
    await expect(page.locator('.tm-goal')).toContainText('100 kg');
    await page.click('#tm-go');
    await expect(page.locator('#tm-flash')).toContainText('Too heavy');
    await expect(page.locator('#tm-numbers')).toContainText('100 kg');
    await page.click('[data-key="n"][data-val="4"]');
    await expect(page.locator('#tm-numbers')).toContainText('25 kg');
    await page.click('#tm-go');
    await expect(page.locator('.tm-win')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.tm-win-stars')).toHaveText('★★☆');
    expect((await saved(page)).ch['c-pulley']).toBe(2);
    await page.click('.tm-win [data-w="next"]');
    await expect(page.locator('.tm-goal')).toBeVisible();
  });

  test('the well challenge keeps its axle fixed: only the wheel can change', async ({ page }) => {
    await open(page, { hash: '#challenges' });
    await page.click('[data-ch="c-well"]');
    await expect(page.locator('#tm-s-wheelR')).toBeVisible();
    await expect(page.locator('#tm-s-axleR')).toHaveCount(0);
    await expect(page.locator('#tm-s-mass')).toHaveCount(0);
    // the ramp challenge keeps its height
    // @ts-ignore
    await page.evaluate(() => window.Taller.machine('incline', 'c-ramp'));
    await expect(page.locator('#tm-s-length')).toBeVisible();
    await expect(page.locator('#tm-s-height')).toHaveCount(0);
  });

  test('the home gears rest after a while, and the gear lab stops drawing when paused', async ({ page }) => {
    await open(page);
    // @ts-ignore
    await page.waitForFunction(() => window.Taller._state.raf === 0, null, { timeout: 25000 });
    // @ts-ignore
    await page.evaluate(() => window.Taller.gears());
    // @ts-ignore
    expect(await page.evaluate(() => window.Taller._state.raf !== 0)).toBe(true);
    await page.click('#tm-run');
    // @ts-ignore
    await page.waitForFunction(() => window.Taller._state.raf === 0);
    await page.click('#tm-run');
    // @ts-ignore
    expect(await page.evaluate(() => window.Taller._state.raf !== 0)).toBe(true);
  });

  test('older kids predict the force first; the right choice is confirmed', async ({ page }) => {
    await open(page, { age: 10 });
    // @ts-ignore
    await page.evaluate(() => window.Taller.machine('pulley'));
    await page.click('[data-key="n"][data-val="4"]');              // 40 kg crate on four ropes
    await expect(page.locator('.tm-q')).toBeVisible();
    await expect(page.locator('#tm-numbers')).toContainText('N)');   // newtons for 9+
    await page.click('[data-pred="10"]');
    await expect(page.locator('.tm-verdict.ok')).toContainText('10 kg');
    await expect(page.locator('#tm-numbers')).toContainText('×4');
    await expect(page.locator('#tm-numbers')).toContainText('98 N');
  });

  test('a 5-year-old sees a strength meter instead of numbers', async ({ page }) => {
    await open(page, { age: 5 });
    // @ts-ignore
    await page.evaluate(() => window.Taller.machine('lever'));
    await expect(page.locator('.tm-meter')).toBeVisible();
    await expect(page.locator('.tm-dl')).toHaveCount(0);
    await expect(page.locator('#tm-numbers')).toContainText('You can');
    await page.locator('#tm-s-mass').fill('200');
    await expect(page.locator('#tm-numbers')).toContainText('Too heavy');
    // moving the fulcrum toward the crate makes it possible
    await page.locator('#tm-s-fulcrum').fill('0.6');
    await expect(page.locator('#tm-numbers')).toContainText('You can');
  });

  test('gear lab: the train shows speeds and the "twice as fast, same way" challenge is solved', async ({ page }) => {
    await open(page, { hash: '#challenges' });
    await page.click('[data-ch="g-double"]');
    await page.click('[data-z="16"]');                 // selecting a size with the motor selected is refused
    await expect(page.locator('#tm-flash')).toContainText('motor gear stays');
    await page.click('#tm-add');                       // 24 → 16
    await page.click('#tm-check');
    await expect(page.locator('#tm-flash')).toContainText('wrong way');
    await page.click('#tm-add');
    await page.click('[data-z="12"]');                 // 24 → 16 → 12: same way, twice as fast
    await expect(page.locator('.tm-sum')).toContainText('2 times faster');
    await expect(page.locator('.tm-sum')).toContainText('the same way');
    await page.click('#tm-check');
    await expect(page.locator('.tm-win')).toBeVisible({ timeout: 5000 });
    expect((await saved(page)).ch['g-double']).toBe(2);
    expect((await saved(page)).seen.gears).toBe(1);
  });

  test('bicycle: 48 × 16 gives 3 wheel turns; the hill challenge wants 28 × 32', async ({ page }) => {
    await open(page, { hash: '#bike' });
    await page.click('[data-front="48"]');
    await page.click('[data-rear="16"]');
    await expect(page.locator('#tm-numbers')).toContainText('3');
    await expect(page.locator('#tm-numbers')).toContainText('6.22 m');
    await page.click('#tm-pedal');
    await expect(page.locator('#tm-dist')).not.toHaveText('0 m', { timeout: 4000 });
    // @ts-ignore
    await page.evaluate(() => window.Taller.bike('b-hill'));
    await page.click('[data-front="28"]');
    await page.click('[data-rear="32"]');
    await page.click('#tm-check');
    await expect(page.locator('.tm-win')).toBeVisible({ timeout: 5000 });
    expect((await saved(page)).ch['b-hill']).toBe(3);
  });

  test('chain reaction: the saved bridge plank gets the ball into the bucket', async ({ page }) => {
    await open(page, { saved: { v: 1, seen: {}, ch: {}, cr: {}, designs: { r1: 'plank,1400,850,-5' } } });
    // @ts-ignore
    await page.evaluate(() => window.Taller.chain('r1'));
    await expect(page.locator('.tm-part')).toHaveCount(1);
    await expect(page.locator('.tm-part b')).toHaveText('×1');
    await page.click('#tm-run');
    await expect(page.locator('.tm-win')).toBeVisible({ timeout: 12000 });
    const d = await saved(page);
    expect(d.cr.r1).toBe(3);
  });

  test('chain reaction: parts come from the tray, can be turned and removed', async ({ page }) => {
    await open(page);
    // @ts-ignore
    await page.evaluate(() => window.Taller.chain('r5'));
    await page.click('[data-part="plank"]');
    // @ts-ignore
    const p0 = await page.evaluate(() => window.Taller._state.cs.placed[0]);
    expect(p0.type).toBe('plank');
    await page.click('#tm-rotl');
    // @ts-ignore
    expect(await page.evaluate(() => window.Taller._state.cs.placed[0].a)).toBe(5);
    expect((await saved(page)).designs.r5).toContain('plank');
    await page.click('#tm-delp');
    // @ts-ignore
    expect(await page.evaluate(() => window.Taller._state.cs.placed.length)).toBe(0);
  });

  test('Spanish for a kid set to Spanish', async ({ page }) => {
    await open(page, { lang: 'es' });
    await expect(page.locator('.tm-home-card').first()).toContainText('máquinas simples');
    // @ts-ignore
    await page.evaluate(() => window.Taller.machine('lever'));
    await expect(page.locator('#tm-go')).toContainText('Hacer funcionar');
  });

  test('phone width: no sideways scroll on any screen, buttons at least 44 px', async ({ page }) => {
    await open(page, { width: 390 });
    const screens = ['home()', 'machines()', "machine('lever')", "machine('pulley')", "machine('incline')", "machine('screw')", "gears()", "bike()", 'challenges()', 'chainList()', "chain('r4')"];
    for (const s of screens) {
      await page.evaluate(s => (0, eval)('Taller.' + s), s);
      await page.waitForTimeout(150);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, s).toBeLessThanOrEqual(390);
      const small = await page.evaluate(() => [...document.querySelectorAll('#tm-wrap button')]
        .filter(b => b.offsetParent && b.getBoundingClientRect().height < 43.5).map(b => b.className + ':' + b.textContent.trim().slice(0, 20)));
      expect(small, s).toEqual([]);
    }
  });
});
