// @ts-check
// Examen y Virtudes in the browser: a whole evening, the next evening's
// "did you practise it?", picture-only little kids with read-aloud
// (stubbed: nothing is said out loud), older kids' longer writing, the
// drawing pad, privacy (own journal only; parents behind the PIN), the
// Fe Explorador saint link, the Sunday Report line and the phone layout.
// Invented kids only; the live sync server is never reached.
const { test, expect } = require('@playwright/test');

const KEY = 'zs_examen_test';
// The suite runs in America/Los_Angeles (playwright.config.js): local times carry its offset.
const at = (hhmm) => new Date('2026-11-17T' + hhmm + ':00-08:00');
const EVENING = at('19:30');                       // Tue 17 Nov 2026, 19:30

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ age?: number, saved?: any, sibling?: any, tts?: string|null, width?: number, when?: Date }} [o]
 */
async function open(page, { age = 8, saved = null, sibling = null, tts = null, width = 390, when = EVENING } = {}) {
  await page.setViewportSize({ width, height: 844 });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.clock.setFixedTime(when);
  await page.addInitScript(({ age, saved, sibling, tts, KEY }) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p, { name: 'Sib', color: 'red', age: 10, avatar: '🐶' }]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (saved) localStorage.setItem(KEY, JSON.stringify(saved));
      if (sibling) localStorage.setItem('zs_examen_sib', JSON.stringify(sibling));
      if (tts) localStorage.setItem('zs_tts', JSON.stringify({ test: { mode: tts } }));
    }
    // @ts-ignore  nothing is said out loud; what would be said is recorded
    window.__said = [];
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], cancel() {}, addEventListener() {}, speaking: false,
      // @ts-ignore
      speak(u) { window.__said.push({ text: u.text, lang: u.lang }); } }, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  }, { age, saved, sibling, tts, KEY });
  await page.goto('/examen.html');
  await page.waitForSelector('.ex-hero');
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const said = (page) => page.evaluate(() => (/** @type {any} */ (window)).__said);
const next = (page) => page.locator('[data-next]').click();

test.describe('Examen y Virtudes', () => {

  test('a whole evening: pictures, words, a virtue with its saint, the prayer word for word, one star', async ({ page }) => {
    await open(page, { age: 8 });
    await page.locator('[data-start]').click();
    // 1 thanks: three at most (a fourth replaces the oldest)
    for (const id of ['familia', 'comida', 'casa', 'amigos']) await page.locator('[data-pick="' + id + '"]').click();
    await expect(page.locator('.ex-pick.on')).toHaveCount(3);
    await expect(page.locator('[data-pick="familia"]')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('#ex-text').fill('Por la once con la abuela');
    await next(page);
    // 2 happy
    await expect(page.locator('.ex-title')).toHaveText(/feliz/);
    await page.locator('[data-pick="jugar"]').click();
    await next(page);
    // 3 better: the "nothing today" choice clears the pictures
    await page.locator('[data-pick="palabras"]').click();
    await next(page);
    // 4 virtue: the one that helps with step 3 is suggested; Next waits for a choice
    await expect(page.locator('[data-virtue="amabilidad"]')).toHaveClass(/sugg/);
    await expect(page.locator('[data-next]')).toBeDisabled();
    await page.locator('[data-virtue="amabilidad"]').click();
    await expect(page.locator('.ex-vcard')).toContainText('San Juan Bosco');
    await expect(page.locator('.ex-vcard .ex-saint-pic svg')).toHaveCount(1);
    await next(page);
    // 5 prayer: the very lines Fe Explorador has
    for (const id of ['padrenuestro', 'avemaria', 'angelguarda']) {
      await page.locator('[data-prayer="' + id + '"]').click();
      // @ts-ignore  FeManager is the page's own global (js/fe-explorador.js)
      const want = await page.evaluate((id) => FeManager.getPrayer(id).lines, id);
      await expect(page.locator('.ex-lines p')).toHaveText(want);
    }
    await page.locator('[data-finish]').click();
    // done: a star, tomorrow's virtue with a link to its saint in Fe Explorador
    await expect(page.locator('.ex-earned')).toBeVisible();
    await expect(page.locator('#zs-star-count')).toHaveText(/1/);
    await expect(page.locator('a[href="fe-explorador.html?saint=juan_bosco"]')).toBeVisible();
    const d = await saved(page);
    const e = d.entries['2026-11-17'];
    expect(e).toMatchObject({ done: true, thanks: ['comida', 'casa', 'amigos'], thanksText: 'Por la once con la abuela',
      happy: ['jugar'], better: ['palabras'], virtue: 'amabilidad', prayer: 'angelguarda' });
    expect(await page.evaluate(() => getAppStars('examen', JSON.parse(localStorage.getItem('zs_examen_test') || '{}')))).toBe(1);
    // the activity log says it happened, never what was written
    const log = await page.evaluate(() => localStorage.getItem('zs_activity_test') || JSON.stringify(Object.keys(localStorage).filter(k => /activity/.test(k)).map(k => localStorage.getItem(k))));
    expect(log).not.toContain('abuela');
    // journal
    await page.locator('[data-go="journal"]').click();
    await expect(page.locator('.ex-entry')).toHaveCount(1);
    await expect(page.locator('.ex-entry')).toContainText('Por la once con la abuela');
    // a second go the same evening changes the answers, not the stars
    await page.locator('[data-go="home"]').click();
    await expect(page.locator('.ex-tonight')).toContainText(/Ya hiciste|You did/);
    await page.locator('.ex-tonight [data-start]').click();
    await expect(page.locator('[data-pick="comida"]')).toHaveAttribute('aria-pressed', 'true');   // answers come back
    for (let i = 0; i < 4; i++) await next(page);
    await page.locator('[data-finish]').click();
    await expect(page.locator('.ex-earned')).toHaveCount(0);
    expect(Object.keys((await saved(page)).entries)).toHaveLength(1);
  });

  test('the next evening asks gently about yesterday\'s virtue and counts it for the week', async ({ page }) => {
    const prev = { v: 1, lang: 'es', entries: { '2026-11-16': { done: true, t: 1, thanks: ['familia'], virtue: 'paciencia' } } };
    await open(page, { saved: prev });
    await page.locator('[data-start]').click();
    await expect(page.locator('.ex-check')).toContainText(/paciencia/i);
    await expect(page.locator('[data-next]')).toBeDisabled();
    await page.locator('[data-did="notyet"]').click();
    await expect(page.locator('#ex-reply')).toContainText(/No pasa nada|That's all right/);
    await page.locator('[data-did="yes"]').click();
    await expect(page.locator('#ex-reply')).toContainText(/Qué bien|Well done/);
    await next(page);
    await page.locator('[data-pick="salud"]').click();
    await next(page); await next(page); await next(page);   // happy and better are both optional
    await page.locator('[data-virtue="gratitud"]').click();
    await next(page);
    await page.locator('[data-finish]').click();
    await expect(page.locator('.ex-week')).toContainText(/practicaste paciencia 1 vez|practised patience 1 time/);
    const d = await saved(page);
    expect(d.entries['2026-11-16']).toMatchObject({ did: 'yes', didOn: '2026-11-17' });
    expect(d.entries['2026-11-17'].virtue).toBe('gratitud');
  });

  test('little kids: pictures only, and each step is read aloud', async ({ page }) => {
    await open(page, { age: 5, tts: 'auto' });
    await page.locator('[data-start]').click();
    await expect(page.locator('.ex-pick').first()).toBeVisible();
    await expect(page.locator('#ex-text')).toHaveCount(0);
    await expect.poll(async () => (await said(page)).some(s => /Gracias, Dios/.test(s.text))).toBe(true);
    await page.locator('[data-pick="mascota"]').click();
    await expect.poll(async () => (await said(page)).some(s => s.text === 'Los animales')).toBe(true);
    // the prayer is read in Spanish
    await next(page); await next(page); await next(page);
    await page.locator('[data-virtue="valentia"]').click();
    await expect(page.locator('.ex-vcard')).toContainText(/miedo/);                 // the short description
    await next(page);
    await page.locator('.ex-holy .ex-say').click();
    await expect.poll(async () => (await said(page)).some(s => s.lang === 'es-CL' && /Padre nuestro/.test(s.text))).toBe(true);
  });

  test('older kids get room to write (280 characters) and can switch to English', async ({ page }) => {
    await open(page, { age: 11 });
    await page.locator('[data-lang-set="en"]').click();
    await expect(page.locator('.ex-hello')).toContainText('Good evening');
    await page.locator('[data-start]').click();
    await expect(page.locator('.ex-title')).toHaveText('Thank you, God, for…');
    await expect(page.locator('textarea#ex-text')).toHaveAttribute('maxlength', '280');
    await page.locator('#ex-text').fill('the long walk home and the dog that came to say hello');
    await next(page);
    await page.locator('[data-prev]').click();                                     // what was written is kept
    await expect(page.locator('#ex-text')).toHaveValue('the long walk home and the dog that came to say hello');
    expect((await saved(page)).lang).toBe('en');
  });

  test('the drawing pad saves a small picture with the evening', async ({ page }) => {
    await open(page, { age: 7 });
    await page.locator('[data-start]').click();
    await page.locator('[data-draw-open]').click();
    const c = page.locator('#ex-canvas');
    const b = await c.boundingBox();
    if (!b) throw new Error('no canvas');
    await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.down();
    await page.mouse.move(b.x + 120, b.y + 80, { steps: 8 }); await page.mouse.up();
    await page.locator('[data-pad-save]').click();
    await expect(page.locator('.ex-drawn')).toBeVisible();
    for (let i = 0; i < 3; i++) await next(page);
    await page.locator('[data-virtue="diligencia"]').click();
    await next(page);
    await page.locator('[data-finish]').click();
    const draw = (await saved(page)).entries['2026-11-17'].draw;
    expect(draw).toMatch(/^data:image\/png;base64,/);
    expect(draw.length).toBeLessThan(120000);
  });

  test('private: a kid sees only their own journal; parents read any journal behind the PIN', async ({ page }) => {
    const sib = { v: 1, entries: { '2026-11-16': { done: true, thanks: ['familia'], thanksText: 'SIBLING-SECRET', virtue: 'humildad' } } };
    await open(page, { sibling: sib });
    await page.locator('.ex-menu [data-go="journal"]').click();
    await expect(page.locator('.ex-journal')).not.toContainText('SIBLING-SECRET');
    await page.locator('[data-go="home"]').click();
    // wrong PIN: nothing opens
    await page.locator('[data-go="parents"]').click();
    await page.locator('.zsd-input, input[type="password"]').fill('0000');
    await page.keyboard.press('Enter');
    await expect(page.locator('#ex-wrap')).toHaveAttribute('data-view', 'home');
    // the parent PIN (the suite default here)
    await page.locator('[data-go="parents"]').click();
    await page.locator('.zsd-input, input[type="password"]').fill('1234');
    await page.keyboard.press('Enter');
    await expect(page.locator('#ex-wrap')).toHaveAttribute('data-view', 'parents');
    await page.locator('[data-kid="Sib"]').click();
    await expect(page.locator('.ex-journal')).toContainText('SIBLING-SECRET');
    await expect(page.locator('.ex-journal')).toContainText(/Humildad|Humility/);
  });

  test('before 6 pm it says the examen is for the evening, but can still be done', async ({ page }) => {
    await open(page, { when: at('15:00') });
    await expect(page.locator('#ex-wrap')).toContainText(/final del día|end of the day/);
    await expect(page.locator('[data-start]')).toBeEnabled();
  });

  test('Fe Explorador opens straight at the virtue\'s saint', async ({ page }) => {
    await open(page);
    await page.goto('/fe-explorador.html?saint=monica');
    await expect(page.locator('.fe-saint-card')).toContainText('Santa Mónica');
  });

  test('the Sunday Report shows the week\'s count, never what was written', async ({ page }) => {
    const d = { v: 1, entries: {
      '2026-11-16': { done: true, virtue: 'amabilidad', thanksText: 'REPORT-SECRET', did: 'yes', didOn: '2026-11-17' },
      '2026-11-17': { done: true, virtue: 'amabilidad' } } };
    await open(page, { saved: d });
    await page.goto('/sunday-report.html');
    await expect(page.locator('body')).toContainText('Examen y Virtudes — 2 evenings of reflection; practised kindness 1 time');
    await expect(page.locator('body')).not.toContainText('REPORT-SECRET');
  });

  test('phone layout: no sideways scroll and every button is at least 44 px tall', async ({ page }) => {
    await open(page, { width: 390 });
    const check = async () => page.evaluate(() => {
      const small = [...document.querySelectorAll('#ex-wrap button, #ex-wrap a')].filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.height < 44 || r.width < 44);
      }).map(b => b.outerHTML.slice(0, 80));
      return { wide: document.documentElement.scrollWidth > window.innerWidth + 1, small };
    });
    expect(await check()).toEqual({ wide: false, small: [] });
    await page.locator('[data-start]').click();
    for (let i = 0; i < 3; i++) { expect(await check()).toEqual({ wide: false, small: [] }); await next(page); }
    await page.locator('[data-virtue="dominio"]').click();
    expect(await check()).toEqual({ wide: false, small: [] });
    await next(page);
    expect(await check()).toEqual({ wide: false, small: [] });
  });
});
