// @ts-check
// Read-aloud for every app: a 🔊 next to questions, answers said on
// press-and-hold, and little-kid mode (auto-read, tap to hear then tap to
// answer, bigger buttons). speechSynthesis is stubbed, so nothing is said
// out loud and every test sees exactly what would have been.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const VOICES = [
  { name: 'Ava', lang: 'en-US', localService: true },
  { name: 'Mónica', lang: 'es-ES', localService: true },
  { name: 'Paulina', lang: 'es-MX', localService: true },
  { name: 'Francisca', lang: 'es-CL', localService: false }
];

// A page that has Marinero's rules (a group of .mar-opt choices after a question).
const PAGE = '/marinero.html';

async function open(page, o = {}) {
  const { age = 8, mode, voices = true, speech = true, activated = true } = o;
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, mode, voices, speech, activated, VOICES]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (mode) localStorage.setItem('zs_tts', JSON.stringify({ test: { mode, enabled: mode !== 'off', rate: 0.85 } }));
    }
    // @ts-ignore
    window.__said = []; window.__cancels = 0;
    if (!speech) { // @ts-ignore
      delete window.SpeechSynthesisUtterance; return;
    }
    const synth = {
      speaking: false,
      getVoices: () => (voices ? VOICES : []),
      speak(u) { // @ts-ignore
        window.__said.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null }); },
      cancel() { // @ts-ignore
        window.__cancels++; },
      addEventListener() {}
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(navigator, 'userActivation', { value: activated ? { hasBeenActive: true } : { hasBeenActive: false }, configurable: true });
  }, [age, mode || null, voices, speech, activated, VOICES]);
  await page.goto(PAGE);
  await page.waitForFunction(() => typeof window.ZsSpeak !== 'undefined');
}

// A question and three answers in the shape Marinero's rules look for.
async function quiz(page, question = 'Which knot is for a mooring?') {
  await page.evaluate((q) => {
    const host = document.createElement('div');
    host.id = 'qz';
    host.innerHTML = '<p class="qtext">' + q + '</p>' +
      '<div class="mar-opts"><button type="button" class="mar-opt">Bowline</button>' +
      '<button type="button" class="mar-opt">Cleat hitch</button><button type="button" class="mar-opt">Square knot</button></div>';
    // @ts-ignore
    window.__answers = [];
    host.querySelectorAll('.mar-opt').forEach(b => b.addEventListener('click', () => { // @ts-ignore
      window.__answers.push(b.textContent); }));
    document.body.appendChild(host);
  }, question);
}

const said = (page) => page.evaluate(() => /** @type {any} */ (window).__said);

test.describe('Read-aloud', () => {

  test('a question gets a 🔊 that says it', async ({ page }) => {
    await open(page);
    await quiz(page);
    const btn = page.locator('#qz .qtext .zs-say');
    await expect(btn).toHaveCount(1);
    await btn.click();
    const out = await said(page);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ text: 'Which knot is for a mooring?', lang: 'en-US', voice: 'Ava' });
    // The button is not part of what is said.
    expect(out[0].text).not.toContain('🔊');
  });

  test('a Spanish question is said in the Chilean voice', async ({ page }) => {
    await open(page);
    await quiz(page, '¿Cuál es el nudo para amarrar un bote?');
    await page.locator('#qz .qtext .zs-say').click();
    expect((await said(page))[0]).toMatchObject({ lang: 'es-CL', voice: 'Francisca' });
  });

  test('without a Chilean voice it falls back to a Latin American one on the device', async ({ page }) => {
    await open(page);
    const pick = await page.evaluate(() => {
      // @ts-ignore
      const v = ZsTTS.pickVoice('es-CL');
      return v && v.name;
    });
    expect(pick).toBe('Francisca');           // exact locale wins
    const noExact = await page.evaluate(() => {
      // @ts-ignore
      window.speechSynthesis.getVoices = () => [
        { name: 'Mónica', lang: 'es-ES', localService: true }, { name: 'Paulina', lang: 'es-MX', localService: true }];
      // @ts-ignore
      const v = ZsTTS.pickVoice('es-CL');
      // @ts-ignore
      return [v && v.name, ZsTTS.pickVoice('fr-FR')];
    });
    expect(noExact).toEqual(['Paulina', null]);
  });

  test('pressing and holding an answer says it, and does not choose it', async ({ page }) => {
    await open(page);
    await quiz(page);
    const opt = page.locator('#qz .mar-opt').nth(1);
    await opt.scrollIntoViewIfNeeded();           // the mouse needs it on screen
    const box = await opt.boundingBox();
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();
    expect((await said(page)).map(s => s.text)).toEqual(['Cleat hitch']);
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual([]);
    // A quick tap afterwards still answers.
    await page.waitForTimeout(1300);
    await opt.click();
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual(['Cleat hitch']);
  });

  test('a normal tap answers straight away for a kid who reads', async ({ page }) => {
    await open(page, { age: 9 });
    await quiz(page);
    await page.locator('#qz .mar-opt').first().click();
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual(['Bowline']);
    expect(await said(page)).toEqual([]);          // On does not read by itself
    expect(await page.evaluate(() => document.documentElement.classList.contains('zs-little'))).toBe(false);
  });

  test('little-kid mode reads a new question by itself, once', async ({ page }) => {
    await open(page, { age: 4 });
    await quiz(page);
    await expect.poll(async () => (await said(page)).length).toBe(1);
    expect((await said(page))[0].text).toBe('Which knot is for a mooring?');
    await page.waitForTimeout(900);
    expect(await said(page)).toHaveLength(1);       // redrawing nothing does not repeat it
    expect(await page.evaluate(() => document.documentElement.classList.contains('zs-little'))).toBe(true);
  });

  test('little-kid mode: the first tap says the answer, the second chooses it', async ({ page }) => {
    await open(page, { age: 5 });
    await quiz(page);
    await expect.poll(async () => (await said(page)).length).toBe(1);
    const opt = page.locator('#qz .mar-opt').nth(2);
    await opt.click();
    expect((await said(page)).map(s => s.text)).toEqual(['Which knot is for a mooring?', 'Square knot']);
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual([]);
    await expect(opt).toHaveAttribute('data-zs-armed', '1');
    await opt.click();
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual(['Square knot']);
    await expect(opt).not.toHaveAttribute('data-zs-armed', '1');
  });

  test('little-kid mode: tapping a different answer starts over on that one', async ({ page }) => {
    await open(page, { age: 5 });
    await quiz(page);
    await page.locator('#qz .mar-opt').nth(0).click();
    await page.locator('#qz .mar-opt').nth(1).click();
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual([]);
    await expect(page.locator('#qz .mar-opt[data-zs-armed="1"]')).toHaveCount(1);
    await expect(page.locator('#qz .mar-opt').nth(1)).toHaveAttribute('data-zs-armed', '1');
  });

  test('little-kid mode makes the answers at least 56px tall', async ({ page }) => {
    await open(page, { age: 4 });
    await quiz(page);
    const h = await page.locator('#qz .mar-opt').first().evaluate(el => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(56);
  });

  test('on iPad the first question waits for a touch before it speaks', async ({ page }) => {
    await open(page, { age: 4, activated: false });
    await quiz(page);
    await page.waitForTimeout(900);
    expect(await said(page)).toEqual([]);
    await page.mouse.click(2, 2);                   // any touch
    await expect.poll(async () => (await said(page)).length).toBe(1);
  });

  test('a parent can turn it off: no buttons, no speech, answers as normal', async ({ page }) => {
    await open(page, { age: 4, mode: 'off' });
    await quiz(page);
    await page.waitForTimeout(700);
    await expect(page.locator('.zs-say')).toHaveCount(0);
    await page.locator('#qz .mar-opt').first().click();
    expect(await page.evaluate(() => /** @type {any} */ (window).__answers)).toEqual(['Bowline']);
    expect(await said(page)).toEqual([]);
  });

  test('with no speech on the device: no buttons, no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { speech: false });
    await quiz(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.zs-say')).toHaveCount(0);
    expect(await page.evaluate(() => /** @type {any} */ (ZsSpeak).enabled())).toBe(false);
    expect(await page.evaluate(() => /** @type {any} */ (ZsSpeak).button('hi'))).toBe('');
    expect(errors).toEqual([]);
  });

  test('ZsSpeak.button makes a button that says its text; data-speak adds one too', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const d = document.createElement('div');
      // @ts-ignore
      d.innerHTML = ZsSpeak.button('Put the bridge across', 'en') + '<p id="ds" data-speak="Say this instead">Shown text</p>';
      document.body.appendChild(d);
    });
    await page.locator('button[data-say]').click();
    await page.locator('#ds .zs-say').click();
    expect((await said(page)).map(s => s.text)).toEqual(['Put the bridge across', 'Say this instead']);
  });

  test('sums are said as words', async ({ page }) => {
    await open(page);
    await page.evaluate(() => { /* @ts-ignore */ ZsSpeak.say('3 × 4 = ?', 'en'); });
    expect((await said(page))[0].text).toBe('3 times 4 equals what');
  });

  test('speech stops when the page goes away', async ({ page }) => {
    await open(page);
    const before = await page.evaluate(() => /** @type {any} */ (window).__cancels);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(await page.evaluate(() => /** @type {any} */ (window).__cancels)).toBeGreaterThan(before);
  });
});

test.describe('Read-aloud in a real app', () => {
  test('World Atlas: a 4-year-old hears the question and taps twice to answer', async ({ page }) => {
    await open(page, { age: 4 });
    await page.goto('/world-atlas.html');
    await page.waitForFunction(() => document.getElementById('wa-mode-quiz') && typeof window.ZsSpeak !== 'undefined');
    await page.locator('#wa-mode-quiz').click();
    await page.locator('#wa-quiz-start').click();
    const question = page.locator('#wa-quiz .wa-q-text');
    await expect(question).toBeVisible();
    await expect(question.locator('.zs-say')).toHaveCount(1);
    // It reads the question out without being asked.
    await expect.poll(async () => (await said(page)).length).toBeGreaterThan(0);
    const spoken = (await said(page))[0].text;
    expect(spoken.length).toBeGreaterThan(5);
    expect(spoken).not.toContain('🔊');

    const opt = page.locator('#wa-quiz .wa-option').first();
    await opt.click();                                              // first tap: hear it
    await expect(page.locator('#wa-quiz .wa-option.correct, #wa-quiz .wa-option.wrong')).toHaveCount(0);
    expect((await said(page)).length).toBeGreaterThan(1);
    await opt.click();                                              // second tap: answer
    await expect(page.locator('#wa-quiz .wa-option.correct')).toHaveCount(1);
  });

  test('World Atlas: a kid who reads taps once, and the 🔊 is there if they want it', async ({ page }) => {
    await open(page, { age: 9 });
    await page.goto('/world-atlas.html');
    await page.waitForFunction(() => document.getElementById('wa-mode-quiz') && typeof window.ZsSpeak !== 'undefined');
    await page.locator('#wa-mode-quiz').click();
    await page.locator('#wa-quiz-start').click();
    await expect(page.locator('#wa-quiz .wa-q-text .zs-say')).toHaveCount(1);
    expect(await said(page)).toEqual([]);                           // nothing spoken until they ask
    await page.locator('#wa-quiz .wa-option').first().click();
    await expect(page.locator('#wa-quiz .wa-option.correct')).toHaveCount(1);
    await page.locator('#wa-quiz .wa-q-text .zs-say').click();
    expect((await said(page)).length).toBe(1);
  });
});

test.describe('Read-aloud setting', () => {
  test('the mode starts by age, and an old on/off flag still means what it did', async ({ page }) => {
    await open(page, { age: 4 });
    const out = await page.evaluate(() => {
      // @ts-ignore
      const T = ZsTTS;
      const young = T.getSettings('Test');
      localStorage.setItem('zs_profiles', JSON.stringify([{ name: 'Test', age: 9 }, { name: 'Old', age: 4 }]));
      // @ts-ignore
      _profilesCached = false;
      const older = T.getSettings('Test');
      localStorage.setItem('zs_tts', JSON.stringify({ old: { enabled: false, rate: 0.85 } }));
      const legacyOff = T.getSettings('Old');
      T.setSettings({ mode: 'auto' }, 'Test');
      const set = T.getSettings('Test');
      T.setSettings({ enabled: false }, 'Test');
      const off = T.getSettings('Test');
      T.setSettings({ enabled: true }, 'Test');
      return { young: young.mode, older: older.mode, legacyOff: [legacyOff.mode, legacyOff.enabled],
        set: [set.mode, set.enabled], off: [off.mode, off.enabled], on: T.getSettings('Test').mode };
    });
    expect(out).toEqual({ young: 'auto', older: 'on', legacyOff: ['off', false], set: ['auto', true], off: ['off', false], on: 'on' });
  });

  test('Parents Corner has an Off / On / Auto choice per kid', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 8, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
    });
    await page.goto('/');
    await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active'));
    await page.evaluate(() => { /* @ts-ignore */ window.openParentsCorner(); });
    const sel = page.locator('select.pk-tts-mode');
    await expect(sel.locator('option')).toHaveText(['On (🔊 buttons)', 'Auto (little-kid mode)', 'Off']);
    await expect(sel).toHaveValue('on');
    await sel.selectOption('auto');
    expect(await page.evaluate(() => /** @type {any} */ (ZsTTS).getSettings('Test').mode)).toBe('auto');
  });
});

test.describe('Read-aloud coverage', () => {
  const root = path.resolve(__dirname, '..', '..');
  const read = (f) => fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), 'utf8') : '';

  test('every page with rules loads tts.js then speak.js, and every selector is in the app\'s own code', async ({ page }) => {
    await open(page);
    const rules = await page.evaluate(() => /** @type {any} */ (ZsSpeak)._rules);
    const problems = [];
    for (const [name, list] of Object.entries(rules)) {
      const html = read(name + '.html');
      if (!html) { problems.push(name + ': no such page'); continue; }
      const iT = html.indexOf('js/tts.js'), iS = html.indexOf('js/speak.js');
      if (iT < 0 || iS < 0 || iT > iS) problems.push(name + ': tts.js must load before speak.js');
      // The app's own scripts and page, to look for the class and id names.
      const src = html + [...html.matchAll(/src="(js\/[^"?]+\.js)/g)].map(m => read(m[1])).join('\n');
      for (const r of list) {
        for (const sel of [r.group, r.choice, r.prompt].filter(Boolean)) {
          for (const tok of sel.split(',').map(t => t.trim())) {
            const id = tok.replace(/^[.#]/, '');
            if (!src.includes(id)) problems.push(name + ': ' + tok + ' is not in the page or its scripts');
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  test('every kid app page has read-aloud, and the ones that are not for kids do not', async () => {
    const hub = read('js/lang.js');
    const hrefs = [...hub.matchAll(/'([a-z\-]+\.html)':\s*\{ d:/g)].map(m => m[1]);
    const notForKids = ['little-maestro.html', 'patron-lancha.html', 'book-movie-check.html'];
    const missing = hrefs.filter(h => !notForKids.includes(h) && !read(h).includes('js/speak.js'));
    expect(missing).toEqual([]);
    const misordered = hrefs.filter(h => { const html = read(h); return html.includes('js/speak.js') && html.indexOf('js/tts.js') > html.indexOf('js/speak.js'); });
    expect(misordered, 'speak.js needs tts.js (and auth.js) loaded first').toEqual([]);
    for (const h of notForKids) expect(read(h)).not.toContain('js/speak.js');
  });
});
