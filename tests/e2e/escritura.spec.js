// @ts-check
// Escritura in the browser: tracing a letter through its three steps, a stroke
// in the wrong direction, a cursive letter, copying a word, writing your own
// name, the letter dictation, palm rejection and the phone layout.
// Strokes are drawn with the mouse along the letter's own model strokes.
// Invented kid only; nothing is said out loud (speech is stubbed).
const { test, expect } = require('@playwright/test');

const KEY = 'zs_escritura_test';

async function open(page, { age = 7, saved = null, width = 390, height = 844 } = {}) {
  await page.setViewportSize({ width, height });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(({ age, saved, KEY }) => {
    if (localStorage.getItem('zs_profiles')) return;
    const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
    if (saved) localStorage.setItem(KEY, JSON.stringify(saved));
    // @ts-ignore
    window.__said = [];
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], cancel() {}, addEventListener() {}, speaking: false,
      // @ts-ignore
      speak(u) { window.__said.push({ text: u.text, lang: u.lang }); } }, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  }, { age, saved, KEY });
  await page.goto('/escritura.html');
  await page.waitForSelector('.es-hero');
}

const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const model = (page) => page.evaluate(() => (/** @type {any} */ (window)).Escritura.letter().model);
const stage = (page) => page.evaluate(() => (/** @type {any} */ (window)).Escritura.letter().stage);
const inkCount = (page) => page.evaluate(() => (/** @type {any} */ (window)).Escritura.pad().count());

// Draw strokes given in sheet units with the mouse.
async function draw(page, strokes, { dx = 0 } = {}) {
  for (const st of strokes) {
    const pts = await page.evaluate(({ st, dx }) => {
      const pad = (/** @type {any} */ (window)).Escritura.pad(), r = pad.canvas.getBoundingClientRect();
      return st.map((q) => { const v = pad.toPx({ x: q.x + dx, y: q.y }); return { x: v.x + r.left, y: v.y + r.top }; });
    }, { st, dx });
    await page.mouse.move(pts[0].x, pts[0].y);
    await page.mouse.down();
    for (let i = 1; i < pts.length; i += 2) await page.mouse.move(pts[i].x, pts[i].y);
    await page.mouse.move(pts[pts.length - 1].x, pts[pts.length - 1].y);
    await page.mouse.up();
  }
}

test.describe('Escritura', () => {

  test('a print letter: trace, trace with dots, write alone — 3 stars that count for the rank', async ({ page }) => {
    await open(page);
    await expect(page.locator('.es-style.on')).toContainText(/Print|Imprenta/);           // 7 years old starts in print
    await page.locator('.es-tile[data-ch="A"]').click();
    await expect(page.locator('.es-steps li.on')).toContainText(/Trace|Repasa/);
    expect((await model(page)).length).toBe(3);                                         // A has three strokes
    await draw(page, await model(page));
    await expect.poll(() => stage(page)).toBe(2);
    await draw(page, await model(page));
    await expect.poll(() => stage(page)).toBe(3);
    await draw(page, await model(page), { dx: 5 });                                     // alone, a little to the side
    await page.locator('#es-done').click();
    await expect(page.locator('.es-done-t')).toContainText(/A/);
    await expect(page.locator('.es-done-s .es-star.on')).toHaveCount(3);
    const d = await saved(page);
    expect(d.L['print:A']).toBe(3);
    expect(await page.evaluate((k) => (/** @type {any} */ (window)).getAppStars('escritura', JSON.parse(localStorage.getItem(k) || '{}')), KEY)).toBe(3);
    // the next letter in the teaching order is offered
    await expect(page.locator('#es-next')).toContainText('E');
  });

  test('a stroke drawn backwards or out of order is refused and fades away', async ({ page }) => {
    await open(page);
    await page.locator('.es-tile[data-ch="L"]').click();
    const [down] = await model(page);
    await draw(page, [down.slice().reverse()]);
    await expect(page.locator('#es-fb')).toHaveClass(/warn/);
    await expect(page.locator('#es-fb')).toContainText(/other way|otro sentido/);
    await expect.poll(() => inkCount(page)).toBe(0);
    expect(await page.evaluate(() => (/** @type {any} */ (window)).Escritura.letter().idx)).toBe(0);
    await draw(page, [down]);
    await expect(page.locator('#es-fb')).toHaveClass(/good/);

    await page.locator('#es-back').click();
    await page.locator('.es-tile[data-ch="T"]').click();
    const t = await model(page);
    await draw(page, [t[1]]);                                                            // the bar before the stem
    await expect(page.locator('#es-fb')).toContainText(/comes later|va después/);
    const d = await saved(page);
    expect(d.L['print:L']).toBe(1);                                                      // L (one stroke) passed step 1
    expect(d.L['print:T']).toBeUndefined();                                              // T: nothing passed, nothing saved
  });

  test('cursive: the style is remembered and a joined letter is traced in one stroke', async ({ page }) => {
    await open(page, { age: 10 });
    await expect(page.locator('.es-style.on')).toContainText(/Cursive|Cursiva/);         // 10: cursive first
    await expect(page.locator('.es-note')).toContainText(/Chile/);                        // says the style is approximate
    await page.locator('.es-tile[data-ch="l"]').click();
    const m = await model(page);
    expect(m.length).toBe(1);
    await draw(page, m);
    await expect.poll(() => stage(page)).toBe(2);
    expect((await saved(page)).L['cursive:l']).toBe(1);
    await page.locator('#es-back').click();
    await page.locator('.es-style[data-style="print"]').click();
    expect((await saved(page)).style).toBe('print');
    await page.reload();
    await expect(page.locator('.es-style.on')).toContainText(/Print|Imprenta/);
  });

  const wordStage = (page) => page.evaluate(() => (/** @type {any} */ (window)).Escritura.word().stage);
  const layOf = (page) => page.evaluate(() => (/** @type {any} */ (window)).Escritura.word().lay.strokes);
  // Draw, wait until every stroke has reached the pad, then press Done.
  async function writeAndDone(page, strokes, opts) {
    const before = await inkCount(page);
    await draw(page, strokes, opts);
    await expect.poll(() => inkCount(page)).toBe(before + strokes.length);
    await page.locator('#es-done').click();
  }

  test('a word: trace it, then copy it on your own', async ({ page }) => {
    test.setTimeout(60000);
    await open(page, { age: 8 });
    await page.locator('#es-go-words').click();
    await page.locator('.es-segb[data-lang="es"]').click();
    await page.locator('.es-word[data-id="sol"]').click();
    await page.locator('#es-done').click();
    await expect(page.locator('#es-fb')).toContainText(/first|Primero/);                  // nothing written yet
    await writeAndDone(page, (await layOf(page)).slice(0, 1));
    await expect(page.locator('#es-fb')).toHaveClass(/warn/);                             // only the s
    await page.locator('#es-clear').click();
    await expect.poll(() => inkCount(page)).toBe(0);
    await writeAndDone(page, await layOf(page));
    await expect.poll(() => wordStage(page), { timeout: 15000 }).toBe(2);
    await expect(page.locator('.es-steps li.on')).toContainText(/Copy|Cópiala/);
    await expect(page.locator('.es-model svg')).toBeVisible();
    await writeAndDone(page, await layOf(page), { dx: 12 });
    await expect(page.locator('.es-done-t')).toBeVisible({ timeout: 15000 });
    expect((await saved(page)).W['print:es:sol']).toBe(3);
  });

  test('my name: the profile name is written, and in cursive the screen says why it is in small letters', async ({ page }) => {
    test.setTimeout(60000);
    await open(page, { age: 8 });
    await page.locator('#es-go-name').click();
    expect(await page.evaluate(() => (/** @type {any} */ (window)).Escritura.word().w.t)).toBe('Test');
    await expect(page.locator('.es-name-note')).toHaveCount(0);
    await writeAndDone(page, await layOf(page));
    await expect.poll(() => wordStage(page), { timeout: 15000 }).toBe(2);
    expect((await saved(page)).W['print:name']).toBe(1);
    await page.locator('#es-back').click();
    await page.locator('.es-style[data-style="cursive"]').click();
    await page.locator('#es-go-name').click();
    expect(await page.evaluate(() => (/** @type {any} */ (window)).Escritura.word().w.t)).toBe('test');
    await expect(page.locator('.es-name-note')).toContainText(/small letters|minúscula/);
  });

  test('letter dictation: the app says a letter and reads what was written', async ({ page }) => {
    await open(page, { age: 8 });
    await page.locator('#es-go-dict').click();
    const target = () => page.evaluate(() => { const D = (/** @type {any} */ (window)).Escritura.dict(); return D.items[D.i]; });
    const n = await page.evaluate(() => (/** @type {any} */ (window)).Escritura.dict().items.length);
    expect(n).toBe(10);
    for (let i = 0; i < n; i++) {
      const ch = await target();
      expect(ch).toMatch(/^[a-zñ]$/);                                                     // 8 years old: small letters
      await expect.poll(async () => (await page.evaluate(() => (/** @type {any} */ (window)).__said)).length).toBeGreaterThan(0);
      const strokes = await page.evaluate((ch) => {
        const W = /** @type {any} */ (window);
        return W.EscrituraEngine.layout(ch, W.EscrituraData.font('print'), { margin: 90 }).strokes;
      }, ch);
      if (i === 0) {
        // the wrong letter first: a different one is read back
        const other = ch === 'o' ? 'l' : 'o';
        const s2 = await page.evaluate((c) => { const W = /** @type {any} */ (window); return W.EscrituraEngine.layout(c, W.EscrituraData.font('print'), { margin: 90 }).strokes; }, other);
        await draw(page, s2);
        await page.locator('#es-done').click();
        await expect(page.locator('.es-dict-ans')).not.toHaveClass(/good/);
        await page.locator('#es-next').click();
        continue;
      }
      await draw(page, strokes);
      await page.locator('#es-done').click();
      await expect(page.locator('.es-dict-ans.good')).toBeVisible();
      await page.locator('#es-next').click();
    }
    await expect(page.locator('.es-done-t')).toContainText('9 / 10');
    expect((await saved(page)).dict['print:lower']).toBe(3);
  });

  test('palm rejection: after the Pencil touches the glass, finger and palm touches do not write', async ({ page }) => {
    await open(page);
    await page.locator('#es-go-words').click();
    await page.locator('.es-segb[data-lang="es"]').click();
    await page.locator('.es-word[data-id="sol"]').click();        // a word sheet keeps every stroke until Done
    const fire = (type, pointerType, id, x, y, extra = {}) => page.evaluate(({ type, pointerType, id, x, y, extra }) => {
      const c = (/** @type {any} */ (window)).Escritura.pad().canvas, r = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent(type, Object.assign({ pointerId: id, pointerType, clientX: r.left + x, clientY: r.top + y, bubbles: true, cancelable: true, pressure: 0.5, isPrimary: true, button: 0 }, extra)));
    }, { type, pointerType, id, x, y, extra });
    // a very wide touch is a palm, even before any Pencil
    await fire('pointerdown', 'touch', 5, 40, 40, { width: 90, height: 90 });
    await fire('pointermove', 'touch', 5, 60, 80, { width: 90, height: 90 });
    await fire('pointerup', 'touch', 5, 60, 80);
    expect(await inkCount(page)).toBe(0);
    // the Pencil writes (with pressure)
    await fire('pointerdown', 'pen', 2, 30, 30, { pressure: 0.9 });
    await fire('pointermove', 'pen', 2, 50, 60, { pressure: 0.9 });
    await fire('pointerup', 'pen', 2, 50, 60);
    expect(await inkCount(page)).toBe(1);
    expect(await page.evaluate(() => (/** @type {any} */ (window)).Escritura.pad().strokes()[0][0].p)).toBeCloseTo(0.9);
    // now a finger touch is taken for the resting hand
    await fire('pointerdown', 'touch', 7, 40, 40);
    await fire('pointermove', 'touch', 7, 80, 90);
    await fire('pointerup', 'touch', 7, 80, 90);
    expect(await inkCount(page)).toBe(1);
  });

  test('the littlest: capitals first, a wider path and short words only', async ({ page }) => {
    await open(page, { age: 4 });
    await expect(page.locator('.es-tile.next')).toHaveAttribute('data-ch', 'A');
    expect(await page.evaluate(() => (/** @type {any} */ (window)).EscrituraEngine.tolerance('beginner'))).toBeGreaterThan(13);
    await page.locator('#es-go-words').click();
    await page.locator('.es-segb[data-lang="es"]').click();
    const words = await page.locator('.es-word').evaluateAll(els => els.map(e => e.getAttribute('data-id')));
    expect(words).toContain('sol');
    expect(words).not.toContain('cordillera');
  });

  for (const [w, h] of [[390, 844], [820, 1180], [1280, 800]]) {
    test('layout at ' + w + 'px: no sideways scroll, touch targets at least 44px', async ({ page }) => {
      await open(page, { width: w, height: h });
      for (const go of [null, '.es-tile[data-ch="a"]']) {
        if (go) await page.locator(go).click();
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(sw).toBeLessThanOrEqual(w);
        const small = await page.locator('.es-app button').evaluateAll(els => els
          .filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); })
          .map(e => e.id || e.className));
        expect(small).toEqual([]);
      }
      // the paper fits on screen
      const box = await page.locator('.zhp').boundingBox();
      expect(box && box.width).toBeLessThanOrEqual(w);
      expect(box && box.height).toBeLessThanOrEqual(h * 0.6);
    });
  }
});
