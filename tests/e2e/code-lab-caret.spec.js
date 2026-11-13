// @ts-check
// Code Lab's editor on a tablet: you can always see where you are typing.
// The textarea is see-through over the coloured text, so the editor draws its
// own caret and current-line band from the line and column; they must sit on
// the letters, follow every caret move, and stay above the on-screen keyboard.
const { test, expect } = require('@playwright/test');

async function open(page, { width = 820, height = 1180, keyboardAt = 0 } = {}) {
  await page.setViewportSize({ width, height });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(({ keyboardAt }) => {
    const p = { name: 'Test', color: 'blue', age: 10, avatar: '🦊' };
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
    localStorage.setItem('zs_tts', JSON.stringify({ test: { mode: 'off' } }));
    if (keyboardAt) {
      // an iPad keyboard: the visible area ends at keyboardAt px
      const listeners = [];
      const vv = { offsetTop: 0, offsetLeft: 0, height: window.innerHeight, width: window.innerWidth, scale: 1,
        addEventListener: (t, f) => listeners.push(f), removeEventListener() {} };
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => vv });
      // @ts-ignore
      window.__keyboard = (on) => { vv.height = on ? keyboardAt : window.innerHeight; listeners.forEach(f => f()); };
    }
  }, { keyboardAt });
  await page.goto('/code-lab.html');
  await page.waitForSelector('.cl-chapter');
  await page.evaluate(() => /** @type {any} */ (window).CodeLab._t.open('hello'));
  await expect(page.locator('.cl-ta')).toBeVisible();
}

// Where a column's letter is drawn in the coloured layer (left edge, top), in page pixels.
const letterAt = (page, line, col) => page.evaluate(([line, col]) => {
  const hl = document.querySelector('.cl-hl'), want = hl.textContent.split('\n').slice(0, line).join('\n').length + (line ? 1 : 0) + col;
  const walker = document.createTreeWalker(hl, NodeFilter.SHOW_TEXT); let n, seen = 0;
  while ((n = walker.nextNode())) {
    if (seen + n.length > want) { const r = document.createRange(); r.setStart(n, want - seen); r.setEnd(n, want - seen + 1); const b = r.getBoundingClientRect(); return { x: b.left, y: b.top }; }
    seen += n.length;
  }
  return null;
}, [line, col]);
const box = (page, sel) => page.locator(sel).evaluate(el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, bottom: b.bottom, shown: getComputedStyle(el).display !== 'none' }; });

test.describe('Code Lab: the caret', () => {
  test('the drawn caret sits on the letters, line by line, and follows every move', async ({ page }) => {
    await open(page);
    const code = 'print("hola")\nrepeat 4:\n    forward(100)\n    left(90)\nprint("listo")';
    await page.locator('.cl-ta').fill(code);
    for (const [line, col] of [[0, 0], [0, 6], [2, 4], [2, 12], [3, 9], [4, 13]]) {
      await page.evaluate(([line, col]) => {
        const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('.cl-ta'));
        const at = ta.value.split('\n').slice(0, line).join('\n').length + (line ? 1 : 0) + col;
        ta.focus(); ta.setSelectionRange(at, at);
      }, [line, col]);
      // after a caret move with no typing (an arrow key, a tap) the caret follows
      await expect.poll(async () => {
        const c = await box(page, '.cl-caret'), l = await letterAt(page, line, Math.min(col, 12));
        const want = col <= 12 ? l.x : null;
        return c.shown && Math.abs(c.y - l.y) <= 2 && (want === null || Math.abs(c.x + 1 - want) <= 1.5);
      }, { message: `line ${line}, column ${col}` }).toBe(true);
    }
    // the current-line band is on the same line
    const band = await box(page, '.cl-curline'), c = await box(page, '.cl-caret');
    expect(Math.abs(band.y - c.y)).toBeLessThanOrEqual(1);
    // the textarea's own caret is hidden (it may sit off the letters on an iPad)
    expect(await page.locator('.cl-ta').evaluate(el => getComputedStyle(el).caretColor)).toBe('rgba(0, 0, 0, 0)');
  });

  test('typing moves the caret to the end of what was typed; leaving the editor hides it', async ({ page }) => {
    await open(page);
    await page.locator('.cl-ta').fill('');
    await page.locator('.cl-ta').click();
    await page.keyboard.type('print(');
    // the editor closed the bracket for us; the caret is between ( and )
    await expect(page.locator('.cl-ta')).toHaveValue('print()');
    const l = await letterAt(page, 0, 6), c = await box(page, '.cl-caret');
    expect(Math.abs(c.x + 1 - l.x)).toBeLessThanOrEqual(1.5);
    await page.keyboard.press('Enter');
    await page.locator('h1, .cl-head, body').first().click({ position: { x: 5, y: 5 } });
    await expect.poll(async () => (await box(page, '.cl-caret')).shown).toBe(false);
    await expect.poll(async () => (await box(page, '.cl-curline')).shown).toBe(false);
  });

  test('with the keyboard up, the line being typed stays above it', async ({ page }) => {
    await open(page, { width: 820, height: 1180, keyboardAt: 560 });
    const long = Array.from({ length: 30 }, (_, i) => 'print(' + i + ')').join('\n');
    await page.locator('.cl-ta').fill(long);
    await page.evaluate(() => {
      const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('.cl-ta'));
      ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
      /** @type {any} */ (window).__keyboard(true);
    });
    await expect.poll(async () => {
      const b = await box(page, '.cl-curline');
      return b.shown && b.bottom <= 560 - 8 && b.y >= 80;
    }, { timeout: 3000 }).toBe(true);
    // and it keeps up while typing new lines at the bottom
    for (let i = 0; i < 6; i++) await page.keyboard.press('Enter');
    await page.keyboard.type('print("fin")');
    await expect.poll(async () => { const b = await box(page, '.cl-curline'); return b.bottom <= 560 - 8 && b.y >= 80; }, { timeout: 3000 }).toBe(true);
  });
});
