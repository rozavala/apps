// @ts-check
// Dictado in the browser: a full round on the on-screen keyboard, a miss that
// reaches Repaso, paper mode, read-aloud (stubbed: no real voice is used),
// punctuation at level 3 and the layout at phone width. Invented kid only.
const { test, expect } = require('@playwright/test');
const E = require('../../js/dictado-engine.js');

const KEY = 'zs_dictado_test';

async function open(page, { age = 8, saved = null, tts = null, width = 390 } = {}) {
  await page.setViewportSize({ width, height: 844 });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(({ age, saved, tts, KEY }) => {
    if (localStorage.getItem('zs_profiles')) return;           // a reload keeps what the test saved
    const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
    if (saved) localStorage.setItem(KEY, JSON.stringify(saved));
    if (tts) localStorage.setItem('zs_tts', JSON.stringify({ test: tts }));
    // @ts-ignore  nothing is said out loud; what would be said is recorded
    window.__said = [];
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], cancel() {}, addEventListener() {},
      // @ts-ignore
      speak(u) { window.__said.push({ text: u.text, rate: u.rate, lang: u.lang }); } }, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  }, { age, saved, tts, KEY });
  await page.goto('/dictado.html');
  await page.waitForSelector('.dk-list');
}

const said = (page) => page.evaluate(() => (/** @type {any} */ (window)).__said);
const current = (page) => page.evaluate(() => (/** @type {any} */ (window)).Dictado.current().t);
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const review = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_review_test') || 'null'));

// Press the on-screen keys for a text (capitals through the shift key).
async function typeKeys(page, text) {
  for (const ch of text) {
    if (ch === ' ') { await page.locator('.dk-key[data-act="space"]').click(); continue; }
    if (/[¿?¡!,.]/.test(ch)) { await page.locator('.dk-key[data-p][data-k="' + ch + '"]').click(); continue; }
    if (ch !== ch.toLowerCase()) await page.locator('.dk-key[data-act="shift"]').click();
    await page.locator('.dk-key[data-k="' + ch.toLowerCase() + '"]').click();
  }
}
// The typed text on the page is what was pressed.
const count = (page) => page.evaluate(() => (/** @type {any} */ (window)).Dictado.state().items.length);
const typedOnPage = (page) => page.evaluate(() => (/** @type {any} */ (window)).Dictado.state().typed);

test.describe('Dictado', () => {

  test('a full round of words on the keyboard, with accents, earns 3 stars', async ({ page }) => {
    await open(page, { age: 7 });
    await expect(page.locator('.dk-lvl.on')).toContainText(/Words|Palabras/);        // 7 years old: words
    await page.locator('[data-list="es-agudas"]').click();
    await expect(page.locator('#dk-line')).toBeVisible();
    for (let i = 0; i < 6; i++) {
      const word = await current(page);
      // the word is said once as it appears, and again on "Listen"
      await expect.poll(async () => (await said(page)).some(s => s.text === word && s.lang === 'es-CL')).toBe(true);
      await page.locator('#dk-hear').click();
      await page.locator('#dk-slow').click();
      const log = await said(page);
      const last = log[log.length - 1];
      expect(last).toMatchObject({ text: word, rate: 0.5 });                         // the slower repeat
      expect(log.filter(s => s.text === word && s.rate > 0.5).length).toBeGreaterThanOrEqual(2);
      await expect(page.locator('#dk-check')).toBeDisabled();                       // nothing typed yet
      await typeKeys(page, word);
      expect(await typedOnPage(page)).toBe(word);
      await page.locator('#dk-check').click();
      await expect(page.locator('.dk-fb-msg.good')).toBeVisible();
      await page.locator('#dk-next').click();
    }
    await expect(page.locator('.dk-done-t')).toHaveText(/Perfect dictation|Dictado perfecto/);
    await expect(page.locator('.dk-done-s')).toContainText('6 / 6');
    const d = await saved(page);
    expect(d.best['es-agudas:1']).toBe(3);
    expect(d.rounds).toBe(1);
    expect(await page.evaluate(() => (/** @type {any} */ (window)).getAppStars('dictado', JSON.parse(localStorage.getItem('zs_dictado_test'))))).toBe(3);
    expect(await review(page), 'a perfect round sends nothing to Repaso').toBeNull();
    // back on the list the stars show
    await page.locator('#dk-lists').click();
    await expect(page.locator('[data-list="es-agudas"] .dk-star.on')).toHaveCount(3);
    await expect(page.locator('#dk-total')).toHaveText('★ 3');
  });

  test('a miss shows the letters kindly, the rule card, and the word comes back in Repaso', async ({ page }) => {
    await open(page, { age: 9 });
    await page.locator('[data-list="es-bv"]').click();
    const text = await current(page);
    // write the first b or v the other way round
    const wrong = text.replace(/[bv]/, m => (m === 'b' ? 'v' : 'b'));
    expect(wrong).not.toBe(text);
    await typeKeys(page, wrong);
    await page.locator('#dk-check').click();
    // the right letters stay as they are, the slip is marked, the rule is explained
    await expect(page.locator('.dk-fb-msg')).toContainText(/Almost|Casi|together|juntos/);
    await expect(page.locator('.dk-t.ok').first()).toBeVisible();
    await expect(page.locator('.dk-t.sub').first()).toBeVisible();
    await expect(page.locator('.dk-t.sub small').first()).toHaveText(/^[bv]$/);
    await expect(page.locator('.dk-rule')).toBeVisible();
    await expect(page.locator('#dk-you-text')).toHaveText(wrong);
    await expect(page.locator('.dk-rv')).toBeVisible();
    // "Spell it" says the letters, slowly
    await page.locator('#dk-spell').click();
    const last = (await said(page)).pop();
    expect(last.text.split(', ').length).toBeGreaterThanOrEqual(text.replace(/ /g, '').length);
    expect(last.rate).toBe(0.5);

    // Repaso has it as a self-contained question: the right spelling among look-alikes
    const f = E.focusWord(E.diff(text, wrong, 2));
    const rv = await review(page);
    const items = Object.values(rv.items);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ app: 'dictado', answer: f.word, box: 1 });
    expect(items[0].choices).toContain(f.word);
    expect(items[0].choices).toContain(f.typed);                                     // what the kid wrote
    expect(items[0].prompt).toMatch(/spelled correctly|bien escrita/);
    if (text.includes(' ')) expect(items[0].prompt).toContain('_____');             // the phrase with the word hidden
    const d = await saved(page);
    expect(d.words[text.toLowerCase()]).toEqual([0, 1]);
    expect(Object.keys(d.rv)).toEqual([text.toLowerCase()]);

    // the Repaso page shows it, named, and answering it moves it up a box
    await page.evaluate(() => { const k = 'zs_review_test', d = JSON.parse(localStorage.getItem(k)); Object.values(d.items).forEach(i => { i.due = 0; }); localStorage.setItem(k, JSON.stringify(d)); });
    await page.goto('/repaso.html');
    await page.locator('#rp-go').click();
    await expect(page.locator('#rp-from')).toHaveText('Dictado');
    await expect(page.locator('#rp-prompt')).toContainText(/spelled correctly|bien escrita/);
    await page.locator('.rp-choice', { hasText: new RegExp('^' + f.word + '$') }).click();
    await expect(page.locator('#rp-feedback')).toContainText(/That's it|¡Eso es!/);
    const after = Object.values((await review(page)).items)[0];
    expect(after.box).toBe(2);
  });

  test('sentences count capitals, accents and the full stop; a sign slip is not sent to Repaso', async ({ page }) => {
    await open(page, { age: 11, saved: { v: 1, mystery: 'kept', best: { 'es-bv:1': 1 } } });
    await expect(page.locator('.dk-lvl.on')).toContainText(/Sentences|Oraciones/);
    await page.locator('[data-list="es-esdrujulas"]').click();
    for (let i = 0; i < 6; i++) {
      const s = await current(page);
      await typeKeys(page, i === 0 ? s.replace(/[.?!]$/, '') : s);                  // the first one forgets the full stop
      expect(await typedOnPage(page)).toBe(i === 0 ? s.replace(/[.?!]$/, '') : s);
      await page.locator('#dk-check').click();
      if (i === 0) {
        await expect(page.locator('.dk-fb-msg')).toContainText(/punctuation|puntuación/);
        await expect(page.locator('.dk-rule b')).toHaveText(/Punctuation|Signos/);
        await expect(page.locator('.dk-rv')).toHaveCount(0);
      } else {
        await expect(page.locator('.dk-fb-msg.good')).toBeVisible();
      }
      await page.locator('#dk-next').click();
    }
    expect(await review(page)).toBeNull();
    const d = await saved(page);
    expect(d.best['es-esdrujulas:3']).toBe(2);                                       // 5 of 6
    expect(d.best['es-bv:1'], 'earlier progress is kept').toBe(1);
    expect(d.mystery, 'unknown fields are kept').toBe('kept');
  });

  test('paper mode: write it, check it yourself, pick the word to practise; paper stops at 2 stars', async ({ page }) => {
    await open(page, { age: 9, saved: { v: 1, mode: 'paper' } });
    await expect(page.locator('[data-mode="paper"]')).toHaveClass(/on/);
    await page.locator('[data-list="es-h"]').click();
    await expect(page.locator('.dk-kb')).toHaveCount(0);
    // item 1: wrote it wrong; item 2..: all right
    const first = await current(page);
    await page.locator('#dk-written').click();
    await expect(page.locator('.dk-tiles')).toContainText(first.split(' ')[0].charAt(0));
    await page.locator('#dk-pwrong').click();
    const words = first.split(' ');
    await page.locator('.dk-chip').nth(words.length - 1).click();
    await page.locator('#dk-pdone').click();
    await expect(page.locator('.dk-rule')).toBeVisible();
    const rv = Object.values((await review(page)).items);
    expect(rv).toHaveLength(1);
    expect(rv[0]).toMatchObject({ app: 'dictado', answer: words[words.length - 1] });
    await page.locator('#dk-next').click();
    const n = await count(page);
    for (let i = 1; i < n; i++) {
      await page.locator('#dk-written').click();
      await page.locator('#dk-pright').click();
      await page.locator('#dk-next').click();
    }
    await expect(page.locator('.dk-done-s')).toContainText((n - 1) + ' / ' + n);
    expect((await saved(page)).best['es-h:2']).toBe(2);
    // a perfect paper round is 2 stars, and says so
    await page.locator('#dk-more').click();
    for (let i = 0; i < n; i++) {
      await page.locator('#dk-written').click();
      await page.locator('#dk-pright').click();
      await page.locator('#dk-next').click();
    }
    await expect(page.locator('.dk-done-s')).toContainText(n + ' / ' + n);
    await expect(page.locator('.dk-done .dk-note')).toContainText(/paper|papel/);
    expect((await saved(page)).best['es-h:2']).toBe(2);
  });

  test('English: its own keyboard (no ñ), the English voice, a rule card in the kid\'s language', async ({ page }) => {
    await open(page, { age: 8, saved: { v: 1, lang: 'en', level: 1 } });
    await page.locator('[data-list="en-silent"]').click();
    await expect(page.locator('.dk-key[data-k="ñ"]')).toHaveCount(0);
    await expect(page.locator('.dk-key.acc')).toHaveCount(0);
    const w = await current(page);
    await expect.poll(async () => (await said(page)).some(s => s.text === w && s.lang === 'en-US')).toBe(true);
    await typeKeys(page, w.slice(1));                                                // first letter left out
    await page.locator('#dk-check').click();
    await expect(page.locator('.dk-t.miss')).toHaveCount(1);
    await expect(page.locator('.dk-rule')).toContainText(/silent/);
    const item = Object.values((await review(page)).items)[0];
    expect(item.answer).toBe(w);
    expect(item.choices).toContain(w.slice(1));
  });

  test('Spanish keyboard has ñ and the accented vowels; a real keyboard works too', async ({ page }) => {
    await open(page, { age: 8, saved: { v: 1, lang: 'es', level: 2 } });
    await page.locator('[data-list="es-mix"]').click();
    for (const k of ['ñ', 'á', 'é', 'í', 'ó', 'ú', 'ü']) await expect(page.locator('.dk-key[data-k="' + k + '"]')).toBeVisible();
    await page.locator('.dk-key[data-k="ñ"]').click();
    await page.keyboard.press('a');
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'é', bubbles: true })));   // an accented letter arrives as a character
    expect(await typedOnPage(page)).toBe('ñaé');
    await page.keyboard.press('Backspace');
    expect(await typedOnPage(page)).toBe('ña');
    await page.locator('.dk-key[data-act="back"]').click();
    expect(await typedOnPage(page)).toBe('ñ');
  });

  test('dictation speaks even when read-aloud buttons are turned off for the kid', async ({ page }) => {
    await open(page, { age: 8, tts: { mode: 'off', enabled: false, rate: 0.85 } });
    await page.locator('[data-list="es-h"]').click();
    const t = await current(page);
    await page.locator('#dk-hear').click();
    expect((await said(page)).some(s => s.text === t)).toBe(true);
  });

  test('a device that cannot speak says so and can show the text', async ({ page }) => {
    await page.addInitScript(() => { try { delete (/** @type {any} */ (window)).SpeechSynthesisUtterance; } catch (e) {} });
    await open(page, { age: 8 });
    await page.evaluate(() => { delete (/** @type {any} */ (window)).speechSynthesis; });
    await page.locator('[data-list="es-h"]').click();
    await expect(page.locator('.dk-nospeech')).toBeVisible();
    await page.locator('#dk-peek').click();
    await expect(page.locator('#dk-peeked')).toHaveText(await current(page));
  });

  test('Leave goes back to the lists; the hub has a Dictado card', async ({ page }) => {
    await open(page);
    await page.locator('[data-list="es-h"]').click();
    await page.locator('#dk-exit').click();
    await expect(page.locator('.dk-lists')).toBeVisible();
    await page.goto('/');
    await expect(page.locator('a.app-card[href="dictado.html"] .card-title')).toHaveText('Dictado');
  });

  for (const [name, width] of [['phone', 390], ['iPad', 820]]) {
    test('layout at ' + name + ' width: no sideways scroll, big keys, nothing under the home and profile buttons', async ({ page }) => {
      await open(page, { age: 10, width, saved: { v: 1, level: 3 } });
      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(await overflow()).toBeLessThanOrEqual(0);
      const clear = async () => page.evaluate(async () => {
        await Promise.all(document.getAnimations().filter(a => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => null)));    // the badge fades in
        const bars = ['.home-btn', '.user-badge'].map(s => document.querySelector(s)).filter(Boolean)
          .map(e => /** @type {Element} */ (e).getBoundingClientRect().bottom);
        const top = Math.min(...Array.from(document.querySelectorAll('#dk-wrap > *')).map(e => e.getBoundingClientRect().top));
        return { bars, top };
      });
      let c = await clear();
      expect(c.top).toBeGreaterThanOrEqual(Math.max(...c.bars));
      await page.locator('[data-list="es-mix"]').click();
      expect(await overflow()).toBeLessThanOrEqual(0);
      c = await clear();
      expect(c.top).toBeGreaterThanOrEqual(Math.max(...c.bars));
      const keys = await page.locator('.dk-key').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
      expect(keys.length).toBeGreaterThan(30);
      for (const [w, h] of keys) { expect(h).toBeGreaterThanOrEqual(44); expect(w).toBeGreaterThanOrEqual(30); }
      // a long wrong sentence still fits when it is shown letter by letter
      const s = await current(page);
      await typeKeys(page, 'x' + s);
      await page.locator('#dk-check').click();
      expect(await overflow()).toBeLessThanOrEqual(0);
      await expect(page.locator('#dk-next')).toBeVisible();
      const next = await page.locator('#dk-next').boundingBox();
      expect(next && next.width).toBeGreaterThan(100);
    });
  }
});
