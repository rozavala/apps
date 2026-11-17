// @ts-check
// Lógica, in the browser: the home screen and rooms by age, solving each
// kind of puzzle through the real controls, hints lowering stars, the
// daily puzzle streak, saved progress, phone layout and read-aloud.
// Service workers are blocked and the sync server is never reached.
const { test, expect } = require('@playwright/test');

async function open(page, o = {}) {
  const { age = 10, lang = 'en', seed = 5, saved, level, speech = false, w } = o;
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  if (w) await page.setViewportSize({ width: w, height: 860 });
  await page.addInitScript(([age, lang, saved, speech]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊', lang };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (saved) localStorage.setItem('zs_logica_test', JSON.stringify(saved));
    }
    // @ts-ignore
    window.__said = [];
    if (speech) {
      const synth = { speaking: false, getVoices: () => [], speak(u) { // @ts-ignore
        window.__said.push(u.text); }, cancel() {}, addEventListener() {} };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
      // @ts-ignore
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    }
  }, [age, lang, saved || null, speech]);
  await page.goto('/logica.html?seed=' + seed + (level ? '&level=' + level : ''));
  await page.waitForSelector('#lg-main .lg-head');
}
const state = page => page.evaluate(() => /** @type {any} */ (window).Logica.state());
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('zs_logica_test') || 'null'));
const T = (page, fn, arg) => page.evaluate(([fn, arg]) => { const g = /** @type {any} */ (window).Logica.game(); return new Function('g', 'arg', 'return (' + fn + ')(g, arg)')(g, arg); }, [String(fn), arg]);

test.describe('Lógica', () => {

  test('home: the daily puzzle and eight rooms, with no script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page);
    await expect(page.locator('.lg-room')).toHaveCount(8);
    await expect(page.locator('.lg-daily')).toContainText('Daily puzzle');
    await expect(page.locator('#lg-streak')).toContainText('Start a streak');
    expect((await state(page)).tier).toBe('advanced');
    await page.click('.lg-room[data-room="sudoku"]');
    await expect(page.locator('.lg-level')).toHaveCount(8);
    expect(errors).toEqual([]);
  });

  test('a 5-year-old gets picture levels marked for them, not the 9x9 grids', async ({ page }) => {
    await open(page, { age: 5, lang: 'es' });
    await page.click('.lg-room[data-room="sudoku"]');
    await expect(page.locator('.lg-level[data-level="su4p"] .lg-badge')).toHaveText('Para ti');
    await expect(page.locator('.lg-level[data-level="su9a"]')).toHaveCount(0);
    await page.click('.lg-level[data-level="su4p"]');
    await expect(page.locator('.lg-su-cell svg').first()).toBeVisible();     // fruit, not numbers
    await expect(page.locator('.lg-pad-btn svg')).toHaveCount(4);
  });

  test('sudoku: filling the grid with the pad solves it for 3 stars, and a wrong entry is caught by Check', async ({ page }) => {
    await open(page, { level: 'su4' });
    const pz = await T(page, g => g._t.pz);
    const empty = pz.puzzle.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    // a wrong value first
    const k0 = empty[0], wrongV = pz.solution[k0] % 4 + 1;
    await page.click(`.lg-su-cell[data-k="${k0}"]`);
    await page.click(`.lg-pad-btn[data-v="${wrongV}"]`);
    await page.click('#lg-check');
    await expect(page.locator('.lg-su-cell.wrong')).toHaveCount(1);
    await expect(page.locator('#lg-msg')).toContainText('doesn’t fit');
    for (const k of empty) {
      await page.click(`.lg-su-cell[data-k="${k}"]`);
      await page.click(`.lg-pad-btn[data-v="${pz.solution[k]}"]`);
    }
    await expect(page.locator('#lg-win')).toBeVisible();
    const d = await saved(page);
    expect(d.lv.su4).toBe(2);              // one mistake on Check
    expect(d.n.su4).toBe(1);
  });

  test('a hint fills a correct square and costs a star', async ({ page }) => {
    await open(page, { level: 'su6a' });
    await page.click('#lg-hint');
    await expect(page.locator('.lg-su-cell.hinted')).toHaveCount(1);
    await expect(page.locator('#lg-msg')).toHaveClass(/hint/);
    await T(page, g => g._t.solve());
    await expect(page.locator('#lg-win')).toBeVisible();
    expect((await saved(page)).lv.su6a).toBe(2);
  });

  test('nonogram: painting the right squares reveals the picture and keeps it in the gallery', async ({ page }) => {
    await open(page, { level: 'no5' });
    const pz = await T(page, g => g._t.pz);
    for (let y = 0; y < pz.h; y++) for (let x = 0; x < pz.w; x++) if (pz.solution[y][x]) await page.click(`.lg-nono-cell[data-y="${y}"][data-x="${x}"]`);
    await expect(page.locator('#lg-win')).toBeVisible();
    await expect(page.locator('.lg-nono.solved')).toBeVisible();
    const d = await saved(page);
    expect(d.pics[pz.id]).toBe(1);
    expect(d.lv.no5).toBe(3);
    await page.click('#lg-win .lg-btn:has-text("More")');
    await expect(page.locator('.lg-gal-pic')).toHaveCount(1);
  });

  test('nonogram: dragging paints a row in one stroke', async ({ page }) => {
    await open(page, { level: 'no5' });
    const a = await page.locator('.lg-nono-cell[data-y="1"][data-x="0"]').boundingBox();
    const b = await page.locator('.lg-nono-cell[data-y="1"][data-x="4"]').boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('.lg-nono-cell.on[data-y="1"]')).toHaveCount(5);
  });

  test('logic grid: marking every ✓ from the clues solves it; ✓ fills in the ✗s of its row and column', async ({ page }) => {
    await open(page, { level: 'lg3' });
    const pz = await T(page, g => g._t.pz);
    await expect(page.locator('.lg-clue')).toHaveCount(pz.clues.length);
    // tap twice: blank → ✗ → ✓
    const yes = (c, p) => page.locator(`.lg-g-cell[data-c="${c}"][data-p="${p}"][data-i="${pz.solution[c][p]}"]`);
    await yes(0, 0).click(); await yes(0, 0).click();
    await expect(page.locator('.lg-g-cell[data-c="0"].v3')).toHaveCount(4);
    for (let c = 0; c < pz.cats.length; c++) for (let p = 0; p < pz.n; p++) {
      if (c === 0 && p === 0) continue;
      const cell = yes(c, p);
      const cls = await cell.getAttribute('class');
      if (/v3/.test(cls)) await cell.click(); else { await cell.click(); await cell.click(); }
    }
    await expect(page.locator('#lg-win')).toBeVisible();
    expect((await saved(page)).lv.lg3).toBe(3);
  });

  test('river: an unsafe crossing is refused, the shortest one earns 3 stars', async ({ page }) => {
    await open(page, { level: 'rv_fox', lang: 'en' });
    await page.click('.lg-char[data-who="farmer"]');
    await page.click('.lg-char[data-who="corn"]');
    await page.click('#lg-cross');
    await expect(page.locator('#lg-msg')).toContainText('fox would chase the hen');
    await page.click('#lg-reset');
    const path = [['farmer', 'hen'], ['farmer'], ['farmer', 'fox'], ['farmer', 'hen'], ['farmer', 'corn'], ['farmer'], ['farmer', 'hen']];
    for (const g of path) {
      for (const who of g) await page.click(`.lg-bank .lg-char[data-who="${who}"]`);
      await page.click('#lg-cross');
    }
    await expect(page.locator('#lg-win')).toContainText('The fewest possible');
    const d = await saved(page);
    expect(d.lv.rv_fox).toBe(3);           // stars come from the number of crossings (and hints)
  });

  test('the night bridge: 17 minutes is 3 stars, the hint suggests a pair', async ({ page }) => {
    await open(page, { level: 'rv_bridge' });
    await page.click('#lg-hint');
    await expect(page.locator('.lg-seats .lg-char')).toHaveCount(2);
    await page.click('#lg-reset');
    for (const g of [['p1', 'p2'], ['p1'], ['p5', 'p10'], ['p2'], ['p1', 'p2']]) await T(page, (gm, gr) => gm._t.go(gr), g);
    await expect(page.locator('#lg-win')).toContainText('17 minutes');
  });

  test('truth or fib: choosing who lies and checking', async ({ page }) => {
    await open(page, { level: 'kk2', lang: 'es' });
    const pz = await T(page, g => g._t.pz);
    // wrong first: the opposite of the answer
    for (let i = 0; i < pz.n; i++) await page.locator(`.lg-isl[data-i="${i}"] .lg-isl-pick [data-v="${1 - pz.solution[i]}"]`).click();
    await page.click('#lg-check');
    await expect(page.locator('#lg-msg')).toHaveClass(/warn/);
    for (let i = 0; i < pz.n; i++) await page.locator(`.lg-isl[data-i="${i}"] .lg-isl-pick [data-v="${pz.solution[i]}"]`).click();
    await page.click('#lg-check');
    await expect(page.locator('#lg-win')).toBeVisible();
    expect((await saved(page)).lv.kk2).toBe(2);
  });

  test('fake coin: weighing 1 against 2 finds it in one go', async ({ page }) => {
    await open(page, { level: 'co3' });
    await page.click('.lg-coin[data-coin="0"]');            // left
    await page.click('.lg-coin[data-coin="1"]');
    await page.click('.lg-coin[data-coin="1"]');            // right
    await page.click('#lg-weigh');
    await expect(page.locator('.lg-coin-log li')).toHaveCount(1);
    const left = await T(page, g => g._t.st().hyps.map(h => h.c));
    expect(left).toHaveLength(1);
    await page.click(`.lg-coin[data-coin="${left[0]}"]`);
    await expect(page.locator('#lg-win')).toBeVisible();
  });

  test('fake coin: guessing before you can know is wrong and starts over', async ({ page }) => {
    await open(page, { level: 'co9' });
    await page.click('#lg-guess');
    await page.click('.lg-coin[data-coin="0"]');
    await expect(page.locator('#lg-msg')).toContainText('couldn’t know yet');
    await expect(page.locator('#lg-win')).toHaveCount(0);
  });

  test('a round of clear thinking: six answers, the reason shown each time', async ({ page }) => {
    await open(page, { level: 'ct_arg' });
    const items = await T(page, g => g._t.items.map(i => i.answer));
    expect(items).toHaveLength(6);
    for (const a of items) {
      await page.click(`.lg-opt[data-k="${a}"]`);
      await expect(page.locator('#lg-msg')).toHaveClass(/ok/);
      await page.click('#lg-q-next');
    }
    await expect(page.locator('#lg-win')).toContainText('6 of 6');
    expect((await saved(page)).lv.ct_arg).toBe(3);
  });

  test('patterns and the balance: a wrong answer shows the right one', async ({ page }) => {
    await open(page, { level: 'pa_num2' });
    const a = await T(page, g => g._t.items[0].answer);
    await page.click(`.lg-opt[data-k="${(a + 1) % 4}"]`);
    await expect(page.locator(`.lg-opt[data-k="${a}"]`)).toHaveClass(/right/);
    await open(page, { level: 'ba_eq3' });
    await expect(page.locator('.lg-scale svg').first()).toBeVisible();
    await page.click('#lg-hint');
    await expect(page.locator('.lg-opt.out')).toHaveCount(1);
  });

  test('daily puzzle: solving it starts a streak that the next day continues', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-17T10:00:00'));
    await open(page, { saved: { v: 1, lv: { su4: 1 }, daily: { last: '2026-11-16', streak: 2, best: 5, n: 8 }, extra: 'kept' } });
    await expect(page.locator('#lg-streak')).toContainText('Streak: 2 days');
    await page.click('#lg-daily-go');
    expect((await state(page)).level).toBeTruthy();
    // solve whatever today's kind is
    await T(page, g => g._t.solve ? g._t.solve() : null);
    await expect(page.locator('#lg-win')).toBeVisible();
    await expect(page.locator('.lg-win-streak')).toContainText('3 days');
    const d = await saved(page);
    expect(d.daily).toEqual({ last: '2026-11-17', streak: 3, best: 5, n: 9 });
    expect(d.extra).toBe('kept');           // unknown fields survive
    expect(d.lv.su4).toBe(1);
    await page.click('#lg-win .lg-primary');
    await expect(page.locator('.lg-daily')).toHaveClass(/done/);
  });

  test('phone (390px): no level scrolls sideways', async ({ page }) => {
    const levels = ['su9b', 'no10', 'lg4x3', 'pa_mat', 'ba_eq3', 'co12', 'rv_hens', 'rv_bridge', 'kk3h', 'ct_need'];
    await open(page, { w: 390, age: 12 });
    for (const id of levels) {
      await page.evaluate(id => /** @type {any} */ (window).Logica.play(id), id);
      await page.waitForSelector('#lg-stage');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, id).toBeLessThanOrEqual(390);
    }
    // touch targets on the sudoku pad and tools
    await page.evaluate(() => /** @type {any} */ (window).Logica.play('su9b'));
    for (const sel of ['.lg-pad-btn', '#lg-hint', '#lg-check']) {
      const bb = await page.locator(sel).first().boundingBox();
      expect(bb.height, sel).toBeGreaterThanOrEqual(44);
    }
  });

  test('read-aloud: instructions get a speaker button that says them', async ({ page }) => {
    await open(page, { level: 'kk3', speech: true, lang: 'es' });
    const btn = page.locator('.lg-intro .zs-say').first();
    await expect(btn).toBeVisible();
    await btn.click();
    const said = await page.evaluate(() => /** @type {any} */ (window).__said);
    expect(said.join(' ')).toContain('siempre dicen la verdad');
  });
});
