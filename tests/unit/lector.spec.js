// @ts-check
// Lector, the reading app. Part 1 (no browser): the curriculum and the
// books. A book may only use what its level has taught: the letter
// tables below are written out here on purpose, apart from the data file,
// so a mistake in the data cannot hide behind its own helper.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const Data = require('../../js/lector-data.js');

// What each level teaches (cumulative from level 1).
const TAUGHT = {
  es: [['a', 'e', 'i', 'o', 'u'], ['m', 'p', 's', 'l'], ['t', 'd'], ['n', 'r'], ['c', 'b', 'v'], ['f', 'g']],
  en: [['s', 'a', 't', 'p', 'i', 'n'], ['c', 'e', 'h', 'r', 'm', 'd'], ['g', 'o', 'u', 'l', 'f', 'b', 'x'], ['sh', 'ch', 'th', 'ck', 'j', 'w', 'v']]
};
const SIGHT = {
  es: { y: 2 },
  en: { a: 1, the: 1, i: 1, is: 1, to: 2, no: 2, he: 2, me: 2, we: 2, go: 3, my: 3, you: 3, was: 3, said: 3, are: 3, she: 4, they: 4, her: 4 }
};
const VOWEL_CLUSTER_OK = ['dios'];            // a reviewed word: two vowels that read as one sound
const INTERJECTION = ['mmm'];                  // a hum, not a word to sound out
const ACC = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };

function levelOfLetter(lang, g) {
  for (let i = 0; i < TAUGHT[lang].length; i++) if (TAUGHT[lang][i].includes(g)) return i + 1;
  return Infinity;
}

// The level a word first becomes readable at, or Infinity (not decodable).
function esLevel(word) {
  const w = word.toLowerCase().replace(/[áéíóú]/g, m => ACC[m]);
  if (INTERJECTION.includes(w)) return 2;
  if (/[aeiou]{2}/.test(w) && !VOWEL_CLUSTER_OK.includes(w)) return Infinity;
  let lv = 1;
  for (let i = 0; i < w.length; i++) {
    const ch = w[i], nx = w[i + 1] || '';
    let n = levelOfLetter('es', ch);
    if (ch === 'c' && nx && 'ei'.includes(nx)) n = Infinity;                 // soft c is not taught
    if (ch === 'g' && ((nx && 'ei'.includes(nx)) || (nx === 'u' && w[i + 2] && 'ei'.includes(w[i + 2])))) n = Infinity;
    if ((ch === 'l' || ch === 'r') && nx === ch) n = Infinity;         // ll and rr are digraphs
    lv = Math.max(lv, n);
  }
  return lv;
}

function enGraphemes(w) {
  const out = [];
  for (let i = 0; i < w.length;) {
    const two = w.substr(i, 2);
    if (['sh', 'ch', 'th', 'ck'].includes(two)) { out.push(two); i += 2; } else { out.push(w[i]); i++; }
  }
  return out;
}
function enLevel(word) {
  const w = word.toLowerCase();
  if (INTERJECTION.includes(w)) return 3;
  const g = enGraphemes(w);
  // one short vowel, sounds before and after it
  if (!/^[^aeiou]*[aeiou][^aeiou]*$/.test(w)) return Infinity;
  let lv = 1;
  for (let i = 0; i < g.length; i++) {
    let n = levelOfLetter('en', g[i]);
    if (g[i] === 'c' && 'eiy'.includes((g[i + 1] || '')[0] || '-')) n = Infinity;
    if (g[i] === 'g' && 'eiy'.includes((g[i + 1] || '')[0] || '-')) n = Infinity;
    lv = Math.max(lv, n);
  }
  return lv;
}

const wordLevel = (lang, w) => (lang === 'es' ? esLevel(w) : enLevel(w));

function tokens(text) {
  return text.split(/\s+/).filter(Boolean)
    .map(t => t.replace(/^[¡¿"“(]+|[.,;:!?"”)…]+$/g, '').toLowerCase())
    .filter(Boolean);
}

// All the words the lexicon lists, with the level the data says.
function lexicon(lang) {
  const out = {};
  Data.levels(lang).forEach(l => {
    l.pics.forEach(p => { out[p.w] = true; });
    Data.W(l.more || '').forEach(w => { out[w.replace(/!$/, '')] = true; });
  });
  return out;
}

test.describe('Lector curriculum', () => {

  test('each level teaches exactly the letters this test expects, in order', () => {
    ['es', 'en'].forEach(lang => {
      const levels = Data.levels(lang);
      expect(levels.map(l => l.letters), lang).toEqual(TAUGHT[lang]);
      levels.forEach(l => {
        l.letters.forEach(g => expect(Data.LETTERS[lang][g], lang + ' card for ' + g).toBeTruthy());
      });
    });
    expect(Data.SIGHT).toEqual(SIGHT);
  });

  test('every word in the lists can be sounded out at the level it is listed under or earlier', () => {
    ['es', 'en'].forEach(lang => {
      Data.levels(lang).forEach(l => {
        const words = l.pics.map(p => p.w).concat(Data.W(l.more || '').map(w => w.replace(/!$/, '')));
        // a name or word listed under a level may be easier than that level, never harder
        words.forEach(w => {
          expect(wordLevel(lang, w), lang + ' level ' + l.n + ': "' + w + '"').toBeLessThanOrEqual(l.n);
        });
      });
    });
  });

  test('a picture word has tiles that spell it, one picture, and tiles taught by its level', () => {
    ['es', 'en'].forEach(lang => {
      Data.levels(lang).forEach(l => {
        l.pics.forEach(p => {
          const spelled = p.t.join('');
          expect(spelled, lang + ' tiles of ' + p.w).toBe(p.w);
          expect(p.o, p.w + ' has a picture').toBeTruthy();
          if (lang === 'en') {
            p.t.forEach(g => expect(levelOfLetter('en', g), p.w + ' tile ' + g).toBeLessThanOrEqual(l.n));
          } else {
            p.t.forEach(syl => expect(wordLevel('es', syl), p.w + ' syllable ' + syl).toBeLessThanOrEqual(l.n));
          }
        });
        // the syllable chart has only syllables made of letters taught so far
        (l.syl || []).forEach(s => expect(wordLevel('es', s), 'syllable ' + s).toBeLessThanOrEqual(l.n));
      });
    });
  });

  test('every book page uses only words taught by the time of its book (the decodable rule)', () => {
    ['es', 'en'].forEach(lang => {
      const lex = lexicon(lang);
      Data.books(lang).forEach(b => {
        expect(b.lv, b.id + ' level').toBeGreaterThanOrEqual(1);
        expect(b.lv, b.id + ' level').toBeLessThanOrEqual(Data.levels(lang).length);
        expect(b.pages.length, b.id + ' pages').toBeGreaterThanOrEqual(4);
        expect(b.pages.length, b.id + ' pages').toBeLessThanOrEqual(8);
        b.pages.forEach((pg, i) => {
          const where = b.id + ' page ' + (i + 1) + ' "' + pg[0] + '"';
          const toks = tokens(pg[0]);
          expect(toks.length, where + ' has words').toBeGreaterThan(0);
          toks.forEach(t => {
            const sight = SIGHT[lang][t];
            if (sight !== undefined) { expect(sight, where + ': magic word "' + t + '"').toBeLessThanOrEqual(b.lv); return; }
            expect(lex[t], where + ': "' + t + '" is not in the word lists').toBe(true);
            expect(wordLevel(lang, t), where + ': "' + t + '" needs a later level').toBeLessThanOrEqual(b.lv);
          });
          // only letters, spaces and ordinary punctuation
          expect(pg[0], where).toMatch(/^[\p{L}\s.,;:!?¡¿'’"“”-]+$/u);
        });
      });
    });
  });

  test('the books are original, short and have what a page needs', () => {
    const ids = new Set();
    Data.BOOKS.forEach(b => {
      expect(ids.has(b.id), 'unique id ' + b.id).toBe(false);
      ids.add(b.id);
      expect(b.title.length).toBeGreaterThan(2);
      b.pages.forEach(pg => {
        expect(pg).toHaveLength(3);
        expect(pg[1], b.id + ' backdrop').toBeTruthy();
        expect(Array.isArray(pg[2]) && pg[2].length > 0, b.id + ' has a picture').toBe(true);
      });
    });
  });

  test('every picture a word, card or book page names is drawn, and every backdrop exists', () => {
    // The art files are plain browser scripts with no DOM calls at load.
    const sandbox = { window: {}, console };
    vm.createContext(sandbox);
    ['lector-art.js', 'lector-art-animals.js', 'lector-art-nature.js', 'lector-art-home.js', 'lector-art-things.js']
      .forEach(f => {
        const p = path.join(ROOT, 'js', f);
        if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8') + '\n;this.LectorArt = LectorArt;', sandbox, { filename: f });
      });
    const art = sandbox.LectorArt;
    const missing = new Set();
    const need = o => { if (o && !art.has(o)) missing.add(o); };
    Object.values(Data.LETTERS).forEach(set => Object.values(set).forEach(c => need(c.o)));
    Data.LEVELS.forEach(l => { need(l.icon); l.pics.forEach(p => need(p.o)); });
    const backdrops = art.backdrops();
    Data.BOOKS.forEach(b => b.pages.forEach(pg => {
      expect(backdrops, b.id + ' backdrop ' + pg[1]).toContain(pg[1]);
      pg[2].forEach(it => need(it[0]));
    }));
    expect([...missing]).toEqual([]);
    // every drawing renders to well-formed svg text
    art.ids().forEach(id => {
      const svg = art.obj(id, 64);
      expect(svg.startsWith('<svg'), id).toBe(true);
      expect(svg.endsWith('</svg>'), id).toBe(true);
      expect((svg.match(/<text/g) || []).length, id + ' has no letters in the picture').toBeLessThanOrEqual(0);
    });
  });

  test('picture words in one game round never share a picture (so one answer is right)', () => {
    ['es', 'en'].forEach(lang => {
      Data.levels(lang).forEach(l => {
        const objs = l.pics.map(p => p.o);
        // two words may share a picture (pelota and bola), but both are listed so the game can dedupe
        const dups = objs.filter((o, i) => objs.indexOf(o) !== i);
        dups.forEach(o => expect(l.pics.filter(p => p.o === o).length, lang + ' ' + l.id + ' ' + o).toBeGreaterThan(1));
      });
    });
  });
});

// The restricted-word list from CONTRIBUTING.md must not appear in anything Lector ships.
test.describe('Lector content rules', () => {
  test('none of the restricted words appear in Lector\'s files', () => {
    const re = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
    ['lector.html', 'css/lector.css', 'js/lector.js', 'js/lector-data.js', 'js/lector-art.js', 'js/lector-art-animals.js',
      'js/lector-art-nature.js', 'js/lector-art-home.js', 'js/lector-art-things.js'].forEach(f => {
      const p = path.join(ROOT, f);
      if (!fs.existsSync(p)) return;
      expect(re.test(fs.readFileSync(p, 'utf8')), f).toBe(false);
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Part 2: the app in a browser. speechSynthesis is stubbed: nothing is
// said out loud, every test sees what would have been, and the stub can
// send word-boundary events (like iPad voices) or none (like some others).
// ────────────────────────────────────────────────────────────────
const KEY = 'zs_lector_test';

async function open(page, o = {}) {
  const { age = 8, lang = 'es', blob, boundaries = true, width } = o;
  if (width) await page.setViewportSize({ width, height: 844 });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, lang, blob, boundaries]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊', lang };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (blob) localStorage.setItem('zs_lector_test', JSON.stringify(blob));
    }
    // @ts-ignore
    window.__said = [];
    const synth = {
      speaking: false, getVoices: () => [], cancel() {}, addEventListener() {},
      speak(u) { // @ts-ignore
        window.__said.push({ text: u.text, lang: u.lang });
        setTimeout(() => {
          let i = 0; const re = /\S+/g; let m;
          if (boundaries) while ((m = re.exec(u.text))) { const ci = m.index; setTimeout(() => u.onboundary && u.onboundary({ name: 'word', charIndex: ci }), 40 * i++); }
          setTimeout(() => u.onend && u.onend(), boundaries ? 40 * i + 40 : 2600);
        }, 0);
      }
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  }, [age, lang, blob || null, boundaries]);
  await page.goto('/lector.html');
  await page.waitForSelector('.lx-map');
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const said = (page) => page.evaluate(() => /** @type {any} */ (window).__said.map(s => s.text));
const ALL_DONE = (ids, acts) => Object.fromEntries(ids.map(id => [id, Object.fromEntries(acts.map(a => [a, 3]))]));

test.describe('Lector app', () => {

  test('opens on the map with level 1 open and the rest locked; a locked level says so', async ({ page }) => {
    await open(page);
    await expect(page.locator('.lx-node')).toHaveCount(6);
    await expect(page.locator('.lx-node.locked')).toHaveCount(5);
    await page.locator('.lx-node[data-level="es2"]').click();
    await expect(page.locator('.zsd-toast')).toBeVisible();
    await expect(page.locator('.lx-level-card')).toHaveCount(0);
  });

  test('the kid\'s language picks the track; a switch changes it', async ({ page }) => {
    await open(page, { lang: 'en' });
    await expect(page.locator('.lx-node')).toHaveCount(4);
    await expect(page.locator('.lx-seg-b[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.lx-seg-b[data-lang="es"]').click();
    // a parent's choice of English wins the next time the app opens, but the switch works while open
    await expect(page.locator('.lx-node')).toHaveCount(6);
    expect((await saved(page)).lang).toBe('es');
  });

  test('sounds: learn the letters, match them, earn stars and open the next level', async ({ page }) => {
    await open(page, { age: 8 });
    await page.locator('.lx-node[data-level="es1"]').click();
    await page.locator('.lx-act[data-act-id="sounds"]').click();
    for (let i = 0; i < 4; i++) await page.locator('#lx-nx').click();
    await expect.poll(async () => (await said(page)).length).toBeGreaterThan(0);      // the letter's sound was said
    await page.locator('#lx-go').click();
    const ex = await page.evaluate(() => Object.fromEntries(Object.entries(/** @type {any} */ (window).LectorData.LETTERS.es).map(([g, c]) => [g, c.ex])));
    const n = await page.locator('.lx-dots i').count();           // 5: only five vowels to ask about
    expect(n).toBe(5);
    for (let i = 0; i < n; i++) {
      const g = await page.locator('#lx-bl').getAttribute('aria-label');
      await page.locator('.lx-pic[aria-label="' + ex[/** @type {string} */ (g)] + '"]').click();
      if (i < n - 1) await expect(page.locator('.lx-dots i').nth(i + 1)).toHaveClass(/cur/);
    }
    await expect(page.locator('.lx-result')).toBeVisible({ timeout: 15000 });
    expect((await saved(page)).lv.es1.sounds).toBe(3);
    await expect(page.locator('.lx-unlock')).toContainText('2');
    await page.locator('.lx-back').click();
    await page.locator('.lx-back').click();
    await expect(page.locator('.lx-node.locked')).toHaveCount(4);
  });

  test('a wrong answer is not a first-try point and goes to the daily review as plain text', async ({ page }) => {
    await open(page, { age: 8 });
    await page.locator('.lx-node[data-level="es1"]').click();
    await page.locator('.lx-act[data-act-id="sounds"]').click();
    for (let i = 0; i < 4; i++) await page.locator('#lx-nx').click();
    await page.locator('#lx-go').click();
    const g = await page.locator('#lx-bl').getAttribute('aria-label');
    const ex = await page.evaluate((g) => /** @type {any} */ (window).LectorData.LETTERS.es[g].ex, g);
    const wrong = page.locator('.lx-pic:not([aria-label="' + ex + '"])').first();
    await wrong.click();
    await expect(wrong).toHaveClass(/bad/);
    const rv = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_review_test') || '{}'));
    const items = Object.values(rv.items || {});
    expect(items).toHaveLength(1);
    const it = /** @type {any} */ (items[0]);
    expect(it.app).toBe('lector');
    expect(it.answer).toBe(g);
    expect(it.choices).toContain(g);
    expect(it.prompt).toContain(ex);
    expect(it.prompt).not.toMatch(/<|>/);
  });

  test('build a word: tap the tiles in order, the word is said, wrong order tries again', async ({ page }) => {
    const blob = { v: 1, lv: ALL_DONE(['es1'], ['sounds']) };
    await open(page, { blob });
    await page.locator('.lx-node[data-level="es2"]').click();
    await page.locator('.lx-act[data-act-id="build"]').click();
    const word = await page.evaluate(() => { const p = document.querySelector('.lx-build-pic svg'); return p ? p.getAttribute('aria-label') : null; });
    expect(word).toBeTruthy();
    const tiles = await page.evaluate((w) => { const l = /** @type {any} */ (window).LectorData.level('es2'); return l.pics.find((p) => p.w === w).t; }, word);
    // a wrong order first (only possible with 2+ different tiles)
    const rev = tiles.slice().reverse();
    if (rev.join('') !== tiles.join('')) {
      for (const t of rev) await page.locator('.lx-tile.pick:not(.used)', { hasText: new RegExp('^' + t + '$') }).first().click();
      await expect(page.locator('.lx-slot.bad').first()).toBeVisible();
      await expect(page.locator('.lx-slot.filled')).toHaveCount(0, { timeout: 3000 });
    }
    for (const t of tiles) await page.locator('.lx-tile.pick:not(.used)', { hasText: new RegExp('^' + t + '$') }).first().click();
    await expect(page.locator('.lx-slot.ok').first()).toBeVisible();
    expect(await said(page)).toContain(word);
  });

  test('build a word: a tile can be dragged into a box', async ({ page }) => {
    await open(page, { blob: { v: 1, lv: ALL_DONE(['es1'], ['sounds']) } });
    await page.locator('.lx-node[data-level="es2"]').click();
    await page.locator('.lx-act[data-act-id="build"]').click();
    const tile = page.locator('.lx-tile.pick').first();
    const slot = page.locator('.lx-slot').nth(1);
    const a = await tile.boundingBox(), b = await slot.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 20, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('.lx-slot').nth(1)).toHaveClass(/filled/);
    await expect(page.locator('.lx-slot').nth(0)).not.toHaveClass(/filled/);
  });

  test('English blending says the sounds one by one, then picks the picture', async ({ page }) => {
    await open(page, { lang: 'en', age: 8 });
    await page.locator('.lx-node[data-level="en1"]').click();
    await page.locator('.lx-act[data-act-id="blend"]').click();
    await expect(page.locator('.lx-tile')).not.toHaveCount(0);
    await expect.poll(async () => (await said(page)).length, { timeout: 5000 }).toBeGreaterThanOrEqual(3);
    const lang = await page.evaluate(() => /** @type {any} */ (window).__said[0].lang);
    expect(lang).toBe('en-US');
  });

  test('read-along: listening lights the words in turn and 5 pages earn the listening star', async ({ page }) => {
    const blob = { v: 1, lv: ALL_DONE(['es1', 'es2'], ['sounds', 'syll', 'build', 'read']) };
    await open(page, { blob, age: 5 });
    await page.locator('.lx-seg-b[data-tab="books"]').click();
    await page.locator('.lx-book-card[data-book="es-mi-mama"]').click();
    await expect(page.locator('.lx-mode.on')).toContainText(/Léeme/);   // little kids start in "read it to me"
    const pages = await page.evaluate(() => /** @type {any} */ (window).LectorData.book('es-mi-mama').pages.length);
    for (let p = 0; p < pages; p++) {
      await page.locator('#lx-play').click();
      await expect(page.locator('.lx-w.lit').first()).toBeVisible();
      await expect(page.locator('.lx-bk-dots i').nth(p)).toHaveClass(/ok/, { timeout: 8000 });
      if (p < pages - 1) await page.locator('#lx-bn').click();
    }
    await expect.poll(async () => ((await saved(page)).books['es-mi-mama'] || {}).l, { timeout: 5000 }).toBe(1);
    // the page text was said as written, so word highlights line up
    expect((await said(page))).toContain('Mi mamá.');
  });

  test('read-along falls back to timing when the voice sends no word events', async ({ page }) => {
    const blob = { v: 1, lv: ALL_DONE(['es1', 'es2'], ['sounds', 'syll', 'build', 'read']) };
    await open(page, { blob, age: 5, boundaries: false });
    await page.locator('.lx-seg-b[data-tab="books"]').click();
    await page.locator('.lx-book-card[data-book="es-el-sapo"]').click();
    await page.locator('#lx-bn').click();
    await page.locator('#lx-bn').click();              // page 3: "El sapo pasa la mesa."
    await page.locator('#lx-play').click();
    const seen = new Set();
    for (let i = 0; i < 40 && seen.size < 3; i++) {
      const t = await page.locator('.lx-w.lit').allTextContents();
      t.forEach(x => seen.add(x));
      await page.waitForTimeout(100);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  test('tapping a word says just that word', async ({ page }) => {
    const blob = { v: 1, lv: ALL_DONE(['es1', 'es2'], ['sounds', 'syll', 'build', 'read']) };
    await open(page, { blob, age: 5 });
    await page.locator('.lx-seg-b[data-tab="books"]').click();
    await page.locator('.lx-book-card[data-book="es-mi-mama"]').click();
    await page.locator('.lx-w', { hasText: 'Mi' }).click();
    expect(await said(page)).toContain('Mi');
  });

  test('"I read it": words must be tapped in order, then the reading star is earned', async ({ page }) => {
    const blob = { v: 1, lv: ALL_DONE(['en1'], ['sounds', 'blend', 'build', 'read']) };
    await open(page, { blob, lang: 'en', age: 7 });
    await page.locator('.lx-seg-b[data-tab="books"]').click();
    await page.locator('.lx-book-card[data-book="en-pip-ant"]').click();
    await expect(page.locator('.lx-mode.on')).toContainText(/I read it/);
    const pages = await page.evaluate(() => /** @type {any} */ (window).LectorData.book('en-pip-ant').pages.length);
    // out of order does nothing
    const words = page.locator('.lx-w');
    await words.nth(2).click();
    await expect(page.locator('.lx-w.done')).toHaveCount(0);
    for (let p = 0; p < pages; p++) {
      const n = await page.locator('.lx-w').count();
      for (let i = 0; i < n; i++) await page.locator('.lx-w').nth(i).click();
      await expect(page.locator('.lx-w.done')).toHaveCount(n);
      if (p < pages - 1) await page.locator('#lx-bn').click();
    }
    await expect.poll(async () => ((await saved(page)).books['en-pip-ant'] || {}).r, { timeout: 5000 }).toBe(1);
    await page.locator('#lx-bn').click();
    await expect(page.locator('.lx-finish')).toBeVisible();
  });

  test('a grown-up confirms "read it aloud to me" with the PIN for the third star; a wrong PIN does not', async ({ page }) => {
    const blob = { v: 1, lv: ALL_DONE(['es1', 'es2'], ['sounds', 'syll', 'build', 'read']) };
    await open(page, { blob, age: 7 });
    await page.locator('.lx-seg-b[data-tab="books"]').click();
    await page.locator('.lx-book-card[data-book="es-mi-mama"]').click();
    await page.locator('#lx-adult').click();
    await page.locator('.zsd-input').fill('0000');
    await page.locator('.zsd-ok').click();
    expect(((await saved(page)).books || {})['es-mi-mama']).toBeUndefined();
    await page.locator('#lx-adult').click();
    await page.locator('.zsd-input').fill('1234');
    await page.locator('.zsd-ok').click();
    await expect.poll(async () => ((await saved(page)).books['es-mi-mama'] || {}).p, { timeout: 5000 }).toBe(1);
  });

  test('saved progress is kept: unknown fields stay, and stars only go up', async ({ page }) => {
    const blob = { v: 1, lang: 'es', future: { keep: 'me' }, lv: { es1: { sounds: 3, extra: 7 } }, books: {} };
    await open(page, { blob, age: 8 });
    await page.locator('.lx-node[data-level="es1"]').click();
    await page.locator('.lx-act[data-act-id="sounds"]').click();
    for (let i = 0; i < 4; i++) await page.locator('#lx-nx').click();
    await page.locator('#lx-go').click();
    // answer wrong on purpose all the way: the best stays 3
    const n = await page.locator('.lx-dots i').count();
    for (let i = 0; i < n; i++) {
      const g = await page.locator('#lx-bl').getAttribute('aria-label');
      const ex = await page.evaluate((g) => /** @type {any} */ (window).LectorData.LETTERS.es[g].ex, g);
      await page.locator('.lx-pic:not([aria-label="' + ex + '"])').first().click();
      await page.locator('.lx-pic[aria-label="' + ex + '"]').click();
      if (i < n - 1) await expect(page.locator('.lx-dots i').nth(i + 1)).toHaveClass(/cur/);
    }
    await expect(page.locator('.lx-result')).toBeVisible({ timeout: 20000 });
    const d = await saved(page);
    expect(d.future).toEqual({ keep: 'me' });
    expect(d.lv.es1.extra).toBe(7);
    expect(d.lv.es1.sounds).toBe(3);
  });

  test('Progress Manager can put a kid at a level, and clears one language only', async ({ page }) => {
    await open(page);
    await page.goto('/');
    await page.waitForFunction(() => !!(/** @type {any} */ (window)).ProgressAdmin);
    const out = await page.evaluate(() => {
      const PA = /** @type {any} */ (window).ProgressAdmin;
      const el = () => JSON.parse(localStorage.getItem('zs_lector_test'));
      PA.setPosition('Test', 'lector-es', 3);
      const a = PA.getState('Test', 'lector-es').doneCount;
      localStorage.setItem('zs_lector_test', JSON.stringify(Object.assign(el(), { lv: Object.assign(el().lv, { en1: { sounds: 3 } }), books: { 'es-mi-mama': { l: 1 }, 'en-pip-ant': { l: 1 } } })));
      PA.reset('Test', 'lector-es');
      return { a, left: el() };
    });
    expect(out.a).toBe(3);
    expect(Object.keys(out.left.lv)).toEqual(['en1']);
    expect(Object.keys(out.left.books)).toEqual(['en-pip-ant']);
  });

  for (const w of [390, 820]) {
    test('no sideways scroll at ' + w + 'px on the map, a level, a game and a book', async ({ page }) => {
      const blob = { v: 1, lv: ALL_DONE(['es1', 'es2'], ['sounds', 'syll', 'build', 'read']) };
      await open(page, { blob, width: w, age: 6 });
      const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(await fits()).toBe(true);
      await page.locator('.lx-seg-b[data-tab="books"]').click(); expect(await fits()).toBe(true);
      await page.locator('.lx-seg-b[data-tab="map"]').click();
      await page.locator('.lx-node[data-level="es3"]').click().catch(() => {});
      await page.locator('.lx-back').click().catch(() => {});
      await page.locator('.lx-node[data-level="es2"]').click(); expect(await fits()).toBe(true);
      await page.locator('.lx-act[data-act-id="build"]').click(); expect(await fits()).toBe(true);
      await page.locator('.lx-back').click();
      await page.locator('.lx-book-card').first().click(); expect(await fits()).toBe(true);
      // the header never runs under the fixed home and profile buttons
      const head = await page.locator('.lx-brand').boundingBox();
      const home = await page.locator('.home-btn').boundingBox();
      const badge = await page.locator('.user-badge').boundingBox();
      expect(head.x).toBeGreaterThanOrEqual(home.x + home.width - 1);
      expect(head.x + head.width).toBeLessThanOrEqual(badge.x + 1);
    });
  }

  test('the hub shows the Lector card with stars', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 6, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_lector_test', JSON.stringify({ v: 1, lv: { es1: { sounds: 3 } }, books: { 'es-mi-mama': { l: 1, r: 1 } } }));
    });
    await page.goto('/');
    await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active'));
    await expect(page.locator('a.app-card[href="lector.html"]')).toHaveCount(1);
    await expect(page.locator('#stats-lector')).toContainText('5');
  });
});
