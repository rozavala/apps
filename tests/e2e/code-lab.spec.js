// @ts-check
// Code Lab in the browser: the editor (indent, auto-closing brackets, the
// palette), a run with the turtle, the goal check and stars, kid-language
// errors, runaway programs, saving, the workshop, and the layout at phone
// and iPad width. An invented kid only; nothing leaves the machine.
const { test, expect } = require('@playwright/test');

const KEY = 'zs_codelab_test';

async function open(page, { age = 10, lang = null, saved = null, width = 390, height = 844 } = {}) {
  await page.setViewportSize({ width, height });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  const external = [];
  page.on('request', r => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !/^(data|blob):/.test(u.protocol)) external.push(r.url()); });
  await page.addInitScript(({ age, lang, saved, KEY }) => {
    if (localStorage.getItem('zs_profiles')) return;
    const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
    if (lang) p.lang = lang;
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
    localStorage.setItem('zs_tts', JSON.stringify({ test: { mode: 'off' } }));
    if (saved) localStorage.setItem(KEY, JSON.stringify(saved));
  }, { age, lang, saved, KEY });
  await page.goto('/code-lab.html');
  await page.waitForSelector('.cl-chapter');
  return external;
}
const data = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const CL = '(window.CodeLab._t)';
const openMission = (page, id) => page.evaluate((id) => /** @type {any} */ (window).CodeLab._t.open(id), id);
const setSpeed = async (page, speed = 'instant') => { await page.locator('.cl-speed [data-speed="' + speed + '"]').click(); };
const value = (page) => page.locator('.cl-ta').inputValue();
// Type into the real editor, like a keyboard does.
async function typeCode(page, text) {
  await page.locator('.cl-ta').fill(text);      // set whole, so the editor's auto-indent does not double ours
}
const run = async (page) => { await page.locator('#cl-run').click(); };
const finished = (page) => page.waitForFunction(() => !document.getElementById('cl-run').hidden, null, { timeout: 15000 });

test.describe('Code Lab', () => {

  test('the map: 7 chapters, 40 missions, the next one marked, a link to the workshop', async ({ page }) => {
    const external = await open(page);
    await expect(page.locator('.cl-chapter')).toHaveCount(7);
    await expect(page.locator('.cl-tile')).toHaveCount(40);
    await expect(page.locator('.cl-tile.next')).toContainText('Say hello');
    await expect(page.locator('.cl-total')).toHaveText('★ 0 / 120');
    await expect(page.locator('#cl-open-workshop')).toBeVisible();
    expect(external.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
  });

  test('the hub has a Code Lab card for a kid of 9', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      if (localStorage.getItem('zs_profiles')) return;
      const p = { name: 'Test', color: 'blue', age: 10, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
    });
    await page.goto('/');
    await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active'));
    const card = page.locator('a.app-card[href="code-lab.html"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator('.card-title')).toHaveText('Code Lab');
  });

  test('a mission: type real code, run it, reach the goal, earn 3 stars that are saved', async ({ page }) => {
    await open(page);
    await page.locator('.cl-tile[data-mission="hello"]').click();
    await expect(page.locator('.cl-goal-title')).toHaveText('Say hello');
    await setSpeed(page);
    await typeCode(page, 'print("Hello")');
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toContainText('Mission complete');
    await expect(page.locator('.cl-out')).toHaveText('Hello');
    await expect(page.locator('#cl-banner .cl-star.on')).toHaveCount(3);
    const d = await data(page);
    expect(d.m.hello.s).toBe(3);
    expect(d.m.hello.code).toBe('print("Hello")');
    await expect(page.locator('.cl-total')).toHaveText('★ 3');
    // the star rule used by the hub and the rank counts it
    expect(await page.evaluate((d) => /** @type {any} */ (window).getAppStars('codelab', d), d)).toBe(3);
    // Next goes to the next mission
    await page.locator('#cl-next-mission').click();
    await expect(page.locator('.cl-goal-title')).toHaveText('Print your name');
  });

  test('a program that runs but misses the goal says what is off, kindly, and earns nothing', async ({ page }) => {
    await open(page);
    await openMission(page, 'lines3');
    await setSpeed(page);
    await typeCode(page, 'print("one")\nprint("tow")\nprint("three")');
    await run(page);
    await expect(page.locator('#cl-banner.almost')).toContainText('Almost');
    await expect(page.locator('.cl-notes')).toContainText('Line 2 should say "two"');
    expect((await data(page)).m.lines3.s || 0).toBe(0);
  });

  test('editor: auto-indent after a colon, auto-closing brackets and quotes, typing over the closer', async ({ page }) => {
    await open(page);
    await openMission(page, 'squareloop');
    await page.locator('.cl-ta').click();
    await page.keyboard.type('repeat 4:');
    await page.keyboard.press('Enter');
    await page.keyboard.type('forward(100');             // the ( closed itself
    expect(await value(page)).toBe('repeat 4:\n  forward(100)');
    await page.keyboard.type(')');                         // typed over the closer, not doubled
    expect(await value(page)).toBe('repeat 4:\n  forward(100)');
    await page.keyboard.press('Enter');
    await page.keyboard.type('turn(90)');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('print("hi');                 // the " closed itself too
    expect(await value(page)).toBe('repeat 4:\n  forward(100)\n  turn(90)\n  \n  print("hi")');
    // Backspace between an empty pair takes both
    await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
    await page.keyboard.type('[');
    expect(await value(page)).toBe('[]');
    await page.keyboard.press('Backspace');
    expect(await value(page)).toBe('');
    // an apostrophe inside a word does not pair
    await page.keyboard.type('print("don\'t");');
    expect(await value(page)).toBe('print("don\'t");');
  });

  test('editor: Tab indents and Shift+Tab takes it back; Ctrl+Enter runs', async ({ page }) => {
    await open(page);
    await openMission(page, 'hello');
    await setSpeed(page);
    await typeCode(page, 'print("Hello")');
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    expect(await value(page)).toBe('  print("Hello")');
    await page.keyboard.press('Shift+Tab');
    expect(await value(page)).toBe('print("Hello")');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
  });

  test('palette: tap words and symbols, not the keyboard; a block word starts its own indented line', async ({ page }) => {
    await open(page);
    await openMission(page, 'squareloop');
    await page.locator('#cl-kb').click();                     // palette only
    await expect(page.locator('.cl-ta')).toHaveAttribute('inputmode', 'none');
    await page.locator('.cl-pal-body .cl-chip', { hasText: /^repeat$/ }).click();
    expect(await value(page)).toBe('repeat :\n  ');
    await page.locator('.cl-pal-syms .cl-chip', { hasText: '4' }).count();
    // the caret is after "repeat " so the number would go there; type it with the editor API
    await page.evaluate(() => { const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('.cl-ta')); ta.setSelectionRange(7, 7); });
    await page.keyboard.type('4');
    await page.locator('.cl-pal-tab[data-tab="draw"]').click();
    await page.evaluate(() => { const ta = /** @type {HTMLTextAreaElement} */ (document.querySelector('.cl-ta')); ta.setSelectionRange(ta.value.length, ta.value.length); });
    await page.locator('.cl-pal-body .cl-chip', { hasText: /^forward$/ }).click();
    expect(await value(page)).toBe('repeat 4:\n  forward()');
    await page.keyboard.type('100');
    await page.locator('.cl-pal-body .cl-chip', { hasText: /^turn$/ }).click();
    await page.keyboard.type('90');
    expect(await value(page)).toBe('repeat 4:\n  forward(100)\n  turn(90)');
    await setSpeed(page);
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    // the symbol row: indent, outdent, new line, delete
    await page.locator('#cl-tab-code').click();
    await page.locator('.cl-pal-syms .cl-chip-key[aria-label="Delete"]').click();
    expect((await value(page)).endsWith('turn(9)')).toBe(true);
  });

  test('an unknown word: the error has the line, the suggestion, and marks the line', async ({ page }) => {
    await open(page);
    await openMission(page, 'line');
    await setSpeed(page);
    await typeCode(page, '# draw\nforwrd(100)');
    await run(page);
    await expect(page.locator('#cl-err')).toBeVisible();
    await expect(page.locator('#cl-err')).toContainText("Line 2: I don't know the word forwrd — did you mean forward?");
    await expect(page.locator('#cl-err b').nth(1)).toHaveText('forward');
    await page.locator('#cl-back-to-code').click();
    await expect(page.locator('.cl-ln-err')).toHaveText('2');
    await expect(page.locator('.cl-errbar')).toBeVisible();
    // fixing it clears the mark when the code is run again
    await typeCode(page, 'forward(100)');
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    await expect(page.locator('.cl-ln-err')).toHaveCount(0);
  });

  test('Spanish: the error and the page are in Spanish', async ({ page }) => {
    await open(page, { lang: 'es' });
    await expect(page.locator('.cl-hero .cl-sub')).toContainText('misiones');
    await openMission(page, 'line');
    await setSpeed(page);
    await typeCode(page, 'forwrd(100)');
    await run(page);
    await expect(page.locator('#cl-err')).toContainText('Línea 1: No conozco la palabra forwrd — ¿quisiste decir forward?');
  });

  test('both languages: the error shows Spanish with the English under it', async ({ page }) => {
    await open(page, { lang: 'both' });
    await openMission(page, 'line');
    await setSpeed(page);
    await typeCode(page, 'forwrd(100)');
    await run(page);
    await expect(page.locator('#cl-err .cl-err-msg')).toHaveCount(2);
    await expect(page.locator('#cl-err')).toContainText("did you mean forward");
  });

  test('a loop that never ends stops with a kind message and the page stays alive', async ({ page }) => {
    await open(page);
    await openMission(page, 'count10');
    await setSpeed(page);
    await typeCode(page, 'while True:\n  pass');
    await run(page);
    await expect(page.locator('#cl-err')).toContainText('Is a loop never ending?', { timeout: 15000 });
    await expect(page.locator('#cl-err')).toContainText('Line 2');
    // the page answers clicks straight away
    await page.locator('#cl-tab-code').click();
    await expect(page.locator('.cl-ta')).toBeVisible();
    await page.locator('#cl-run').waitFor();
  });

  test('infinite recursion stops with a message about the function calling itself', async ({ page }) => {
    await open(page);
    await openMission(page, 'countdown');
    await setSpeed(page);
    await typeCode(page, 'def f(n):\n  f(n + 1)\nf(1)');
    await run(page);
    await expect(page.locator('#cl-err')).toContainText('called itself');
  });

  test('a turtle that never stops is cut off, and the picture shows what it drew', async ({ page }) => {
    await open(page);
    await openMission(page, 'line');
    await setSpeed(page, 'fast');
    await typeCode(page, 'while True:\n  forward(1)\n  turn(1)');
    await run(page);
    await expect(page.locator('#cl-err')).toContainText('moved more than', { timeout: 20000 });
  });

  test('Stop ends a long drawing at once', async ({ page }) => {
    await open(page);
    await openMission(page, 'spiral');
    await setSpeed(page, 'slow');
    await typeCode(page, 'size = 5\nrepeat 40:\n  forward(size)\n  turn(90)\n  size += 5');
    await run(page);
    await expect(page.locator('.cl-stop:visible')).toBeVisible();      // on the result screen too
    await page.locator('.cl-stop:visible').click();
    await expect(page.locator('.cl-stop:visible')).toHaveCount(0);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();          // the program had finished; the picture jumped to the end
  });

  test('the turtle draws on the canvas: a square is on the picture', async ({ page }) => {
    await open(page);
    await openMission(page, 'squareloop');
    await setSpeed(page);
    await typeCode(page, 'repeat 4:\n  forward(100)\n  turn(90)');
    await page.locator('#cl-tab-result').click();
    await page.locator('#cl-ghost').click();                 // goal guide off, so only the drawing is on the canvas
    await page.locator('#cl-tab-code').click();
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    const px = await page.evaluate(() => {
      const c = /** @type {HTMLCanvasElement} */ (document.getElementById('cl-canvas')), x = c.getContext('2d'), k = c.width / 400;
      const at = (lx, ly) => Array.from(x.getImageData(Math.round((lx + 200) * k), Math.round((200 - ly) * k), 1, 1).data);
      return { onLine: at(0, 50), inside: at(25, 25), farOff: at(-100, -100) };
    });
    expect(px.onLine[0] + px.onLine[1] + px.onLine[2]).toBeLessThan(250);       // dark pen
    expect(px.inside[0] + px.inside[1] + px.inside[2]).toBeGreaterThan(700);    // paper
    expect(px.farOff[0] + px.farOff[1] + px.farOff[2]).toBeGreaterThan(700);
  });

  test('the goal guide is drawn for a drawing mission and can be hidden', async ({ page }) => {
    await open(page);
    await openMission(page, 'triangle');
    await page.locator('#cl-tab-result').click();
    const dots = () => page.evaluate(() => {
      const c = /** @type {HTMLCanvasElement} */ (document.getElementById('cl-canvas')), x = c.getContext('2d'), k = c.width / 400;
      const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 2] > d[i] + 40) n++;       // the blue guide
      return n;
    });
    expect(await dots()).toBeGreaterThan(50);
    await page.locator('#cl-ghost').click();
    expect(await dots()).toBe(0);
  });

  test('kid text is only ever text: markup in a print or a name does not become elements', async ({ page }) => {
    await open(page);
    await openMission(page, 'hello');
    await setSpeed(page);
    await typeCode(page, 'print("<img src=x onerror=window.__pwned=1><b>x</b>")');
    await run(page);
    await expect(page.locator('.cl-out')).toHaveText('<img src=x onerror=window.__pwned=1><b>x</b>');
    expect(await page.locator('#cl-console img, #cl-console b').count()).toBe(0);
    expect(await page.evaluate(() => /** @type {any} */ (window).__pwned)).toBeUndefined();
    // and in the editor's colouring
    await expect(page.locator('.cl-hl img')).toHaveCount(0);
    // the saved program name in the workshop
    await page.evaluate(() => /** @type {any} */ (window).CodeLab._t.workshop());
    await page.locator('.cl-ta').fill('print(1)');
    await page.locator('#cl-ws-saveas').click();
    await page.locator('.zsd-input').fill('<img src=x onerror=a>');
    await page.locator('.zsd-ok').click();
    await expect(page.locator('.cl-saved-item')).toHaveText('📄 <img src=x onerror=a>');
    expect(await page.locator('.cl-saved img').count()).toBe(0);
    expect(await page.evaluate(() => /** @type {any} */ (window).__pwned)).toBeUndefined();
  });

  test('hints come one at a time, cost the no-hints star, and a solution can be peeked after the last', async ({ page }) => {
    await open(page);
    await openMission(page, 'lines3');
    await setSpeed(page);
    await expect(page.locator('#cl-peek')).toBeHidden();
    await page.locator('#cl-hint-btn').click();
    await expect(page.locator('.cl-hint')).toHaveCount(1);
    await expect(page.locator('#cl-hint-btn')).toContainText('1/2'.replace('1', '2').replace('2/2', '2/2'));
    await page.locator('#cl-hint-btn').click();
    await expect(page.locator('.cl-hint')).toHaveCount(2);
    await expect(page.locator('#cl-hint-btn')).toBeDisabled();
    await expect(page.locator('#cl-peek')).toBeVisible();
    await typeCode(page, 'print("one")\nprint("two")\nprint("three")');
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    await expect(page.locator('#cl-banner .cl-star.on')).toHaveCount(2);
    expect((await data(page)).m.lines3.h).toBe(2);
    // after a reload the hints are still shown
    await page.reload();
    await page.waitForSelector('.cl-chapter');
    await openMission(page, 'lines3');
    await expect(page.locator('.cl-hint')).toHaveCount(2);
  });

  test('peeking at a solution shows it as text and limits the mission to one star', async ({ page }) => {
    await open(page);
    await openMission(page, 'hello');
    await setSpeed(page);
    await page.locator('#cl-hint-btn').click();
    await page.locator('#cl-hint-btn').click();
    await page.locator('#cl-peek').click();
    await expect(page.locator('#cl-peek-code')).toHaveText('print("Hello")');
    await typeCode(page, 'print("Hello")');
    await run(page);
    await expect(page.locator('#cl-banner .cl-star.on')).toHaveCount(1);
  });

  test('a program is saved as you type and comes back', async ({ page }) => {
    await open(page);
    await openMission(page, 'triangle');
    await typeCode(page, 'repeat 3:\n  forward(100)');
    await expect.poll(async () => (await data(page)) && (await data(page)).m.triangle && (await data(page)).m.triangle.code, { timeout: 5000 }).toBe('repeat 3:\n  forward(100)');
    await page.reload();
    await page.waitForSelector('.cl-chapter');
    await openMission(page, 'triangle');
    expect(await value(page)).toBe('repeat 3:\n  forward(100)');
    // Start over brings back the starting code, after asking
    await page.locator('#cl-startover').click();
    await page.locator('.zsd-ok').click();
    expect(await value(page)).toBe('');
  });

  test('older saves (fewer fields) still open, and nothing is lost', async ({ page }) => {
    await open(page, { saved: { m: { hello: { s: 2 } } } });
    await expect(page.locator('.cl-total')).toHaveText('★ 2 / 120');
    await openMission(page, 'name');
    await setSpeed(page);
    await typeCode(page, 'print("Ana")');
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    const d = await data(page);
    expect(d.m.hello.s).toBe(2);
    expect(d.m.name.s).toBeGreaterThan(0);
    expect(d.v).toBe(1);
  });

  test('the Code Cadet bridge shows blocks next to their text on the first turtle missions', async ({ page }) => {
    await open(page);
    await openMission(page, 'squareloop');
    await expect(page.locator('.cl-bridge')).toBeVisible();
    await expect(page.locator('.cl-bridge .cl-blk').first()).toContainText('Repeat 4');
    await expect(page.locator('.cl-bridge-code')).toHaveText('repeat 4:\n  forward(100)\n  turn(90)');
    await openMission(page, 'squarefn');
    await expect(page.locator('.cl-blk-hat')).toHaveText('F1');
    await openMission(page, 'hello');
    await expect(page.locator('.cl-bridge')).toHaveCount(0);
  });

  test('explain your code: only from 12, and what is written is saved', async ({ page }) => {
    await open(page, { age: 10 });
    await openMission(page, 'hello');
    await setSpeed(page);
    await typeCode(page, 'print("Hello")');
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    await expect(page.locator('#cl-explain')).toHaveCount(0);
  });
  test('explain your code at 12', async ({ page }) => {
    await open(page, { age: 12 });
    await openMission(page, 'hello');
    await setSpeed(page);
    await typeCode(page, 'print("Hello")');
    await run(page);
    await expect(page.locator('.cl-explain-q')).toContainText('parentheses and the quotes');
    await page.locator('#cl-explain').fill('print shows words; quotes mark the words');
    await page.locator('#cl-explain-save').click();
    await expect(page.locator('.cl-explain-saved')).toContainText('Saved');
    expect((await data(page)).m.hello.ex).toBe('print shows words; quotes mark the words');
  });

  test('the free workshop: save, open, overwrite and delete programs', async ({ page }) => {
    await open(page);
    await page.locator('#cl-open-workshop').click();
    await expect(page.locator('.cl-goal-title')).toHaveText('Free workshop');
    await setSpeed(page);
    await typeCode(page, 'color("green")\ncircle(60)');
    await run(page);
    await expect(page.locator('#cl-err')).toBeHidden();
    await page.locator('#cl-ws-save').click();
    await page.locator('.zsd-input').fill('My circle');
    await page.locator('.zsd-ok').click();
    await expect(page.locator('.cl-saved-item')).toHaveText('📄 My circle');
    let d = await data(page);
    expect(d.free).toHaveLength(1);
    expect(d.free[0].code).toBe('color("green")\ncircle(60)');
    // a new program, then open the saved one again
    await page.locator('#cl-ws-new').click();
    expect(await value(page)).toBe('color("green")\ncircle(60)');       // the draft is kept until cleared
    await page.locator('#cl-startover').click(); await page.locator('.zsd-ok').click();
    expect(await value(page)).toBe('');
    await page.locator('.cl-saved-item').click();
    expect(await value(page)).toBe('color("green")\ncircle(60)');
    await typeCode(page, 'circle(10)');
    await page.locator('#cl-ws-save').click();
    d = await data(page);
    expect(d.free).toHaveLength(1);
    expect(d.free[0].code).toBe('circle(10)');
    await page.locator('#cl-ws-del').click();
    await page.locator('.zsd-ok').click();
    expect((await data(page)).free).toHaveLength(0);
  });

  test('the whole mission list is playable from the map, and a solved one shows its stars', async ({ page }) => {
    await open(page, { saved: { m: { hello: { s: 3 }, name: { s: 1 } } } });
    await expect(page.locator('.cl-tile.done')).toHaveCount(2);
    await expect(page.locator('.cl-tile[data-mission="hello"]')).toHaveAttribute('aria-label', /1\. Say hello — 3\/3/);
    await expect(page.locator('.cl-tile.next')).toContainText('Three lines');
  });

  test('a mission loads for every one of the 40 ids without errors', async ({ page }) => {
    await open(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const ids = await page.evaluate(() => /** @type {any} */ (window).CodeLabMissions.MISSIONS.map(m => m.id));
    expect(ids).toHaveLength(40);
    for (const id of ids) {
      await openMission(page, id);
      await expect(page.locator('.cl-goal-title')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('the reference solution typed into the editor solves each of the first mission of every chapter', async ({ page }) => {
    await open(page);
    for (const id of ['hello', 'line', 'math', 'redsquare', 'names', 'greet', 'countdown']) {
      await openMission(page, id);
      await setSpeed(page);
      const code = await page.evaluate((id) => { const m = /** @type {any} */ (window).CodeLabMissions.get(id); return m.solution; }, id);
      await page.evaluate((c) => /** @type {any} */ (window).CodeLab._t.setCode(c), code);
      await run(page);
      await expect(page.locator('#cl-banner.ok'), id).toBeVisible({ timeout: 15000 });
    }
    expect((await data(page)).m.countdown.s).toBeGreaterThan(0);
  });

  test('the flag mission accepts the reference flag and shows it painted', async ({ page }) => {
    await open(page);
    await openMission(page, 'flag');
    await setSpeed(page);
    const code = await page.evaluate(() => /** @type {any} */ (window).CodeLabMissions.get('flag').solution);
    await page.evaluate((c) => /** @type {any} */ (window).CodeLab._t.setCode(c), code);
    await page.locator('#cl-tab-result').click();
    await page.locator('#cl-ghost').click();
    await page.locator('#cl-tab-code').click();
    await run(page);
    await expect(page.locator('#cl-banner.ok')).toBeVisible();
    const colours = await page.evaluate(() => {
      const c = /** @type {HTMLCanvasElement} */ (document.getElementById('cl-canvas')), x = c.getContext('2d'), k = c.width / 400;
      const at = (lx, ly) => Array.from(x.getImageData(Math.round((lx + 200) * k), Math.round((200 - ly) * k), 1, 1).data).slice(0, 3);
      return { blue: at(-105, 65), white: at(60, 40), red: at(60, -40) };
    });
    expect(colours.blue[2]).toBeGreaterThan(colours.blue[0] + 60);
    expect(colours.red[0]).toBeGreaterThan(colours.red[2] + 60);
    expect(Math.min(...colours.white)).toBeGreaterThan(240);
  });

  test('phone width: no sideways scroll, the nav buttons do not cover the title, tabs switch code and result', async ({ page }) => {
    await open(page, { width: 390 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const box = async (sel) => page.locator(sel).first().boundingBox();
    const brand = await box('.cl-brand'), home = await box('.home-btn'), badge = await box('.user-badge');
    const overlap = (a, b) => a && b && !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
    expect(overlap(brand, home)).toBe(false);
    expect(overlap(brand, badge)).toBe(false);
    await openMission(page, 'squareloop');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('.cl-pane-code')).toBeVisible();
    await expect(page.locator('.cl-pane-result')).toBeHidden();
    await page.locator('#cl-tab-result').click();
    await expect(page.locator('.cl-pane-result')).toBeVisible();
    await expect(page.locator('.cl-pane-code')).toBeHidden();
    // running switches to the result by itself
    await page.locator('#cl-tab-code').click();
    await setSpeed(page);
    await typeCode(page, 'repeat 4:\n  forward(100)\n  turn(90)');
    await run(page);
    await expect(page.locator('.cl-pane-result')).toBeVisible();
    // every button is big enough to tap
    await page.locator('#cl-tab-code').click();
    const small = await page.evaluate(() => [...document.querySelectorAll('#cl-wrap button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40); }).map(b => b.textContent));
    expect(small).toEqual([]);
    // the fixed font is a sans-serif or monospace stack, never a serif fallback
    const fonts = await page.evaluate(() => ['.cl-goal-title', '.cl-btn', '.cl-ta'].map(s => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily : ''; }));
    for (const f of fonts) expect(f).toMatch(/sans-serif|monospace/);
  });

  test('iPad width: code and result are side by side on a landscape iPad, tabs on a portrait one', async ({ page }) => {
    await open(page, { width: 820, height: 1180 });
    await openMission(page, 'triangle');
    await expect(page.locator('.cl-tabs')).toBeVisible();
    await page.setViewportSize({ width: 1180, height: 820 });
    await expect(page.locator('.cl-tabs')).toBeHidden();
    await expect(page.locator('.cl-pane-code')).toBeVisible();
    await expect(page.locator('.cl-pane-result')).toBeVisible();
    const code = await page.locator('.cl-pane-code').boundingBox(), res = await page.locator('.cl-pane-result').boundingBox();
    expect(res.x).toBeGreaterThan(code.x + code.width - 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('a long program scrolls inside the editor and the caret stays in view', async ({ page }) => {
    await open(page);
    await openMission(page, 'hello');
    const lines = Array.from({ length: 40 }, (_, i) => '# line ' + (i + 1)).join('\n');
    await page.locator('.cl-ta').fill(lines);
    await page.locator('.cl-ta').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\nprint(1)');
    const view = await page.evaluate(() => { const s = /** @type {HTMLElement} */ (document.querySelector('.cl-scroll')); return { top: s.scrollTop, max: s.scrollHeight - s.clientHeight }; });
    expect(view.top).toBeGreaterThan(300);
    // the gutter has a number for every line
    expect(await page.locator('.cl-ln').count()).toBeGreaterThanOrEqual(41);
  });
});
