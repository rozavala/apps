// @ts-check
// Type Quest in the browser: lessons, words, passages, Letter Hunt, the
// keyboard check on a touch screen, the on-screen keys, layouts, accents,
// saved progress and the phone layout. Nothing is said out loud (speech is
// stubbed) and the sync server is never reached.
const { test, expect } = require('@playwright/test');

async function open(page, o = {}) {
  const { age = 9, lang = 'both', saved, speech = false, seed = 3 } = o;
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, lang, saved, speech]) => {
    if (!sessionStorage.getItem('tq-init')) {
      sessionStorage.setItem('tq-init', '1');
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊', lang };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (saved) localStorage.setItem('zs_typing_test', JSON.stringify(saved));
    }
    // @ts-ignore
    window.__said = [];
    if (speech) {
      const synth = { speaking: false, getVoices: () => [], speak(u) { // @ts-ignore
        window.__said.push(u.text); }, cancel() {}, addEventListener() {} };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
      // @ts-ignore
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: true }, configurable: true });
    }
  }, [age, lang, saved || null, speech]);
  await page.goto('/type-quest.html?seed=' + seed);
  await page.waitForSelector('.tq-tabs');
}
const state = (page) => page.evaluate(() => /** @type {any} */ (window).TypeQuest.state());
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_typing_test') || 'null'));

async function typeAll(page, delay = 0) {
  const s = await state(page);
  const rest = s.run.text.slice(s.run.pos);
  for (const ch of rest) await page.keyboard.type(ch, { delay });
}

test.describe('Type Quest', () => {

  test('home: sections, a keyboard drawn with finger colours, no script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page);
    await expect(page.locator('.tq-tab')).toHaveCount(5);
    await expect(page.locator('.tq-hero svg.tq-kb .tq-key')).toHaveCount(await page.evaluate(() => TypeQuestData.LAYOUTS.us.list.length));
    // a desktop browser has a keyboard: no keyboard question
    await expect(page.locator('#tq-kbnote')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the hub has the card, and it opens the app', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 9, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_typing_test', JSON.stringify({ v: 1, ls: { fj: { s: 3 }, dk: { s: 2 } } }));
    });
    await page.goto('/');
    const card = page.locator('a.app-card[href="type-quest.html"]');
    await expect(card).toHaveCount(1);
    await expect(page.locator('#stats-typing')).toContainText('5');
  });

  test('a lesson: typing the drill gives stars, saves, and opens the next lesson', async ({ page }) => {
    await open(page);
    await page.click('.tq-tab[data-go="lessons"]');
    await expect(page.locator('.tq-lesson.locked').first()).toBeVisible();
    await page.click('.tq-lesson[data-arg="0"]');
    await expect(page.locator('#tq-text .c')).toHaveCount(1);
    await expect(page.locator('.tq-kb .tq-ring-now')).toHaveCount(1);
    await expect(page.locator('#tq-hint')).toContainText('índice izquierdo');
    await typeAll(page);
    await expect(page.locator('.tq-result')).toBeVisible();
    await expect(page.locator('.tq-res-stars .tq-star.on')).toHaveCount(3);
    const d = await saved(page);
    expect(d.ls.fj.s).toBe(3);
    expect(d.runs.length).toBe(1);
    expect(d.keys.f[0]).toBeGreaterThan(0);
    await page.click('[data-go="lesson"][data-arg="1"]');
    expect((await state(page)).run.id).toBe('dk');
  });

  test('a wrong key does not move on, is marked and lowers accuracy', async ({ page }) => {
    await open(page);
    await page.click('.tq-card[data-go="lesson"]');
    await page.keyboard.type('x');
    let s = await state(page);
    expect(s.run.pos).toBe(0);
    expect(s.run.errors).toBe(1);
    await expect(page.locator('#tq-text .c.x')).toHaveCount(1);
    await typeAll(page);
    const d = await saved(page);
    expect(d.runs[0].a).toBeLessThan(1);
    expect(d.keys.f[1]).toBe(1);
    // Backspace and Enter do nothing
    await page.click('[data-go="lesson"][data-arg="0"]');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Enter');
    s = await state(page);
    expect([s.run.pos, s.run.errors]).toEqual([0, 0]);
  });

  test('accents: a composed á is accepted; relaxed mode takes a plain a', async ({ page }) => {
    const ls = {}; ['fj', 'dk', 'sl', 'apin', 'gh', 'ei', 'ru', 'ty', 'wo', 'qp', 'cm', 'vn', 'xz', 'caps', 'nums', 'punct'].forEach(id => { ls[id] = { s: 1 }; });
    await open(page, { saved: { v: 1, ls } });
    await page.click('.tq-tab[data-go="lessons"]');
    await page.click('.tq-lesson[data-arg="16"]');
    let s = await state(page);
    const first = s.run.text[0];
    // what a dead key (´ then a) leaves in the typing box
    await page.keyboard.insertText(first);
    s = await state(page);
    expect(s.run.pos).toBe(1);
    expect(s.run.errors).toBe(0);
    // relaxed: plain letters count, ¿ and ¡ are skipped
    await page.click('[data-go="home"].tq-tab');
    await page.click('[data-go="settings"]');
    await page.click('[data-set="acc"][data-val="loose"]');
    expect((await saved(page)).acc).toBe('loose');
    await page.click('.tq-tab[data-go="lessons"]');
    await page.click('.tq-lesson[data-arg="16"]');
    s = await state(page);
    const plain = s.run.text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿¡]/g, '');
    for (const ch of plain.slice(0, 20)) await page.keyboard.type(ch);
    s = await state(page);
    expect(s.run.errors).toBe(0);
  });

  test('a Spanish keyboard is noticed from its ñ key', async ({ page }) => {
    await open(page, { saved: { v: 1, ls: { fj: { s: 1 }, dk: { s: 1 }, sl: { s: 1 } } } });
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ñ', code: 'Semicolon', bubbles: true })));
    expect((await saved(page)).lay).toBe('latam');
    await page.click('.tq-tab[data-go="lessons"]');
    await expect(page.locator('.tq-lesson[data-arg="3"] kbd')).toContainText(['a', 'ñ']);
    // the keyboard is drawn with Ñ, the < key and the tall Enter
    await page.click('.tq-tab[data-go="home"]');
    await expect(page.locator('.tq-hero .tq-key[data-code="Semicolon"]')).toContainText('Ñ');
    await expect(page.locator('.tq-hero .tq-key[data-code="IntlBackslash"]')).toHaveCount(1);
    await expect(page.locator('.tq-hero .tq-key[data-code="Enter"] path')).toHaveCount(3);
  });

  test('words: one timed minute for older kids, best kept at 90%+', async ({ page }) => {
    await page.clock.install();
    await open(page, { age: 12 });
    await page.click('.tq-tab[data-go="words"]');
    await page.click('[data-go="wordrun"][data-arg="en"]');
    await expect(page.locator('#tq-time')).toHaveText('60');
    const s = await state(page);
    const words = s.run.text.split(' ');
    await page.keyboard.type(words.slice(0, 5).join(' ') + ' ');
    await page.clock.runFor(61000);
    await expect(page.locator('.tq-result')).toBeVisible();
    const d = await saved(page);
    expect(d.wd.en.n).toBe(1);
    expect(d.runs[0].m).toBe('words');
    expect(d.runs[0].t).toBeLessThanOrEqual(60);
  });

  test('passages: come from the suite, and a finished one scores', async ({ page }) => {
    await open(page, { age: 10, lang: 'en' });
    await page.click('.tq-tab[data-go="passages"]');
    await expect(page.locator('.tq-passage').first()).toBeVisible();
    await expect(page.locator('.tq-passage-src').first()).toHaveText(/Story Explorer|Descubre Chile|Fe Explorador/);
    // English is shown first for an English-reading kid
    const first = await page.locator('.tq-passage').first().getAttribute('data-arg');
    expect(await page.evaluate((id) => TypeQuestPassages.find(p => p.id === id).lang, first)).toBe('en');
    await page.locator('.tq-passage').first().click();
    await typeAll(page);
    await expect(page.locator('.tq-result')).toBeVisible();
    const d = await saved(page);
    expect(d.ps[first].s).toBe(3);
  });

  test('the youngest: Letter Hunt reads the letter, no passages tab', async ({ page }) => {
    await open(page, { age: 5, speech: true });
    await expect(page.locator('.tq-tab[data-go="passages"]')).toHaveCount(0);
    await page.click('.tq-card[data-go="hunt"]');
    await expect(page.locator('.tq-hunt-big')).toBeVisible();
    const s = await state(page);
    for (const ch of s.run.text) await page.keyboard.type(ch);
    await expect(page.locator('.tq-result')).toBeVisible();
    const d = await saved(page);
    expect(d.hunt.s).toBe(3);
    expect(d.runs.length).toBe(0);
    expect(await page.evaluate(() => /** @type {any} */ (window).__said.length)).toBeGreaterThan(0);
  });

  test('progress: rank ladder, speed graph, heatmap and a drill of tricky keys', async ({ page }) => {
    const runs = [12, 16, 15, 17].map(w => ({ d: '2026-11-10', m: 'passage', w, a: 0.97, c: 120, t: 60 }));
    await open(page, { saved: { v: 1, runs, keys: { k: [20, 10], l: [40, 2] } } });
    await page.click('.tq-tab[data-go="stats"]');
    await expect(page.locator('.tq-rung')).toHaveCount(8);
    await expect(page.locator('svg.tq-chart circle')).toHaveCount(4);
    await expect(page.locator('.tq-weak li').first()).toContainText('k');
    await page.click('[data-go="focus"]');
    expect((await state(page)).run.text).toContain('k');
  });

  test('older saves keep their data; junk does not break the app', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { saved: { ls: { fj: { s: 2, w: 9 } }, extra: 'kept', runs: 'junk', keys: [] } });
    await page.click('.tq-tab[data-go="lessons"]');
    await page.click('.tq-lesson[data-arg="1"]');
    await typeAll(page);
    const d = await saved(page);
    expect(d.ls.fj).toEqual({ s: 2, w: 9 });
    expect(d.extra).toBe('kept');
    expect(Array.isArray(d.runs)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test.describe('Type Quest on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('asks kindly about a keyboard, offers the keys on the screen, and notices a real one', async ({ page }) => {
    await open(page, { age: 8 });
    await expect(page.locator('#tq-kbnote.ask')).toBeVisible();
    await page.click('#tq-use-screen');
    expect((await saved(page)).kb).toBe('screen');
    await page.click('.tq-card[data-go="lesson"]');
    await expect(page.locator('.tq-pad.half')).toHaveCount(3);
    // the on-screen keys are big enough to tap
    const small = await page.$$eval('.tq-pk', bs => bs.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length);
    expect(small).toBe(0);
    const s = await state(page);
    await page.locator('.tq-pk[data-code="KeyF"]').dispatchEvent('pointerdown');
    expect((await state(page)).run.pos).toBe(s.run.text[0] === 'f' ? 1 : 0);
    await expect(page.locator('.tq-pk.next')).toHaveCount(1);
    // a key on a real keyboard switches over
    await page.keyboard.press('j');
    expect((await saved(page)).kb).toBe('hw');
    await expect(page.locator('.tq-pad')).toHaveCount(0);
    await expect(page.locator('.tq-kb')).toBeVisible();
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sw).toBeLessThanOrEqual(0);
  });

  test('no horizontal scroll on any screen at phone width', async ({ page }) => {
    await open(page, { age: 10 });
    for (const go of ['home', 'lessons', 'words', 'passages', 'stats']) {
      await page.click('.tq-tab[data-go="' + go + '"]');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sw, go).toBeLessThanOrEqual(0);
    }
    const small = await page.$$eval('#tq-wrap button', bs => bs.filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); }).map(b => b.className));
    expect(small).toEqual([]);
  });
});
