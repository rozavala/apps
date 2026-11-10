// @ts-check
// Dictado: the word lists (every item has a rule, no duplicates, accents and
// punctuation stable) and the checking logic (letter-by-letter diff, the word to
// practise again, stars, saved progress). Pure logic: no browser needed.
const { test, expect } = require('@playwright/test');
const D = require('../../js/dictado-data.js');
const E = require('../../js/dictado-engine.js');

const KEY = ['w', 'p', 's'];
const all = (lang, level) => D.items(lang + '-mix', level);
const wordsOf = (t) => t.split(' ').map(w => w.replace(/[¿?¡!.,;:]/g, '').toLowerCase()).filter(Boolean);

test.describe('Dictado word lists', () => {

  test('every list has a name in both languages, a badge, a probe and unique rule ids', () => {
    const ids = new Set();
    for (const l of D.LISTS) {
      expect(ids.has(l.id), l.id + ' is a repeated list id').toBe(false);
      ids.add(l.id);
      expect(['es', 'en']).toContain(l.lang);
      expect(l.id.startsWith(l.lang + '-')).toBe(true);
      expect(l.name[0] && l.name[1], l.id + ' name').toBeTruthy();
      expect(l.badge, l.id + ' badge').toBeTruthy();
      expect(() => new RegExp(l.probe, 'i')).not.toThrow();
      const rids = l.rules.map(r => r.id);
      expect(new Set(rids).size, l.id + ' repeated rule id').toBe(rids.length);
    }
    expect(D.listsFor('es').length).toBeGreaterThanOrEqual(8);
    expect(D.listsFor('en').length).toBeGreaterThanOrEqual(6);
  });

  test('every rule has a title and a card in both languages, and at least one item', () => {
    for (const l of D.LISTS) for (const r of l.rules) {
      const n = KEY.reduce((a, k) => a + (r[k] || []).length, 0);
      expect(n, l.id + '/' + r.id + ' has no items').toBeGreaterThan(0);
      expect(r.t[0] && r.t[1], l.id + '/' + r.id + ' title').toBeTruthy();
      expect(r.tip[0].length, l.id + '/' + r.id + ' Spanish card').toBeGreaterThan(25);
      expect(r.tip[1].length, l.id + '/' + r.id + ' English card').toBeGreaterThan(25);
    }
    for (const g of Object.values(D.GENERIC)) { expect(g.t[0] && g.t[1] && g.tip[0] && g.tip[1]).toBeTruthy(); }
  });

  test('every item is reachable with its rule, at every level, and each list is big enough for a round', () => {
    for (const l of D.LISTS) {
      for (const n of [1, 2, 3]) {
        const items = D.items(l.id, n);
        expect(items.length, l.id + ' level ' + n).toBeGreaterThanOrEqual(n === 1 ? 10 : 6);
        for (const it of items) {
          expect(D.rule(l.id, it.rule), l.id + ': "' + it.t + '" has no rule').toBeTruthy();
          expect(it.list).toBe(l.id);
          expect(it.lang).toBe(l.lang);
        }
      }
    }
    // the mix is every list of the language together
    for (const lang of ['es', 'en']) for (const n of [1, 2, 3]) {
      const sum = D.listsFor(lang).reduce((a, l) => a + D.items(l.id, n).length, 0);
      expect(all(lang, n).length).toBe(sum);
    }
  });

  test('no duplicates inside a language and level', () => {
    for (const lang of ['es', 'en']) for (const n of [1, 2, 3]) {
      const seen = new Map();
      for (const it of all(lang, n)) {
        const k = it.t.toLowerCase();
        expect(seen.has(k), '"' + it.t + '" is in ' + seen.get(k) + ' and ' + it.list).toBe(false);
        seen.set(k, it.list);
      }
    }
  });

  test('every expected text is stable: NFC, tidy, and checks as itself at its level', () => {
    for (const lang of ['es', 'en']) for (const n of [1, 2, 3]) for (const it of all(lang, n)) {
      const t = it.t;
      expect(t, 'NFC: ' + t).toBe(t.normalize('NFC'));
      expect(t, 'tidy: "' + t + '"').toBe(E.tidy(t));
      expect(t).not.toMatch(/\s{2,}/);
      expect(t).not.toMatch(/['’`´¨]/);              // no stray apostrophe or loose accent mark
      expect(E.isRight(t, t, n)).toBe(true);
      expect(E.norm(E.norm(t, n), n), 'norm is idempotent').toBe(E.norm(t, n));
      const d = E.diff(t, t, n);
      expect(d.ok && d.wrong === 0 && d.kind === 'ok').toBe(true);
      expect(d.cells.map(c => c.c).join(''), 'the cells spell the text').toBe(E.norm(t, n));
    }
  });

  test('words are lowercase single words, phrases are lowercase without punctuation, sentences have capitals and signs', () => {
    for (const lang of ['es', 'en']) {
      const letters = lang === 'es' ? /^[a-záéíóúüñ]+$/ : /^[a-z]+$/;
      for (const it of all(lang, 1)) expect(it.t, 'word').toMatch(letters);
      for (const it of all(lang, 2)) {
        expect(it.t.split(' ').length, '"' + it.t + '" is more than one word').toBeGreaterThanOrEqual(2);
        for (const w of it.t.split(' ')) expect(w.replace(/^[A-Z]/, m => m.toLowerCase()), 'phrase word in ' + it.t).toMatch(lang === 'es' ? /^[a-záéíóúüñA-Z]+$/ : /^[a-zA-Z]+$/);
        expect(it.t).not.toMatch(/[¿?¡!.,;:]/);
      }
      for (const it of all(lang, 3)) {
        expect(it.t, 'starts with a capital').toMatch(/^[¿¡]?[A-ZÁÉÍÓÚÑ]/);
        expect(it.t, 'ends with a sign').toMatch(/[.?!]$/);
        expect(it.t.split(' ').length, 'a sentence has words').toBeGreaterThanOrEqual(4);
        expect((it.t.match(/¿/g) || []).length).toBe((it.t.match(/\?/g) || []).length * (lang === 'es' ? 1 : 0));
        expect((it.t.match(/¡/g) || []).length).toBe((it.t.match(/!/g) || []).length * (lang === 'es' ? 1 : 0));
        if (lang === 'en') expect(it.t).not.toMatch(/[áéíóúñ¿¡]/i);
      }
    }
  });

  test('every item has the letters its list is about (the probe)', () => {
    for (const l of D.LISTS) {
      const re = new RegExp(l.probe, 'i');
      for (const n of [1, 2, 3]) for (const it of D.items(l.id, n)) expect(re.test(it.t), l.id + ': "' + it.t + '"').toBe(true);
    }
  });

  test('accents: each tilde rule only has words that follow it', () => {
    const vg = (s) => (s.match(/[aeiou]+/g) || []).length;          // vowel groups
    const after = (w) => { const i = w.search(/[áéíóú]/); return i < 0 ? -1 : vg(w.slice(i + 1)); };
    const checks = {
      'es-agudas/agud': w => /[áéíóú][ns]?$/.test(w),
      'es-agudas/noagud': w => !/[áéíóú]/.test(w) && /[^aeiouns]$/.test(w),
      'es-llanas/llana': w => after(w) === 1 && /[^aeiouns]$/.test(w),
      'es-llanas/sin': w => !/[áéíóú]/.test(w) && /[aeiouns]$/.test(w),
      'es-esdrujulas/esdr': w => after(w) >= 2,
      'es-esdrujulas/ico': w => after(w) >= 2 && /ic[oa]$/.test(w)
    };
    for (const l of D.listsFor('es')) for (const r of l.rules) {
      const check = checks[l.id + '/' + r.id];
      if (!check) continue;
      for (const k of KEY) for (const text of (r[k] || [])) {
        // a word, or at least one word of a phrase or sentence, follows the rule
        expect(wordsOf(text).some(check), l.id + '/' + r.id + ': "' + text + '"').toBe(true);
      }
    }
    // a Spanish word carries at most one accent mark
    for (const it of all('es', 1)) expect((it.t.match(/[áéíóú]/g) || []).length, it.t).toBeLessThanOrEqual(1);
  });

  test('rules about letters: the words show what the card says', () => {
    const must = {
      'es-mbmp/mb': /mb/, 'es-mbmp/mp': /mp/, 'es-h/hue': /hu?[ei]|hue|hie/, 'es-h/hum': /^hum/,
      'es-gj/aje': /aje$/, 'es-gj/gue': /gu[ei]/, 'es-lly/illo': /ill[oa]$/, 'es-lly/ll': /ll/, 'es-lly/yfin': /y$/,
      'es-bv/bir': /bir/, 'es-bv/aba': /aba/, 'es-bv/nv': /nv/, 'es-bv/bu': /^bu/, 'es-bv/bi': /^bi/,
      'es-csz/ce_ci': /c[ei]/, 'es-csz/za': /z[aou]/, 'es-csz/ion': /ción$/, 'es-csz/zces': /ces$/,
      'en-silent/kn': /^kn/, 'en-silent/wr': /^wr/, 'en-silent/mb': /mb$/,
      'en-tion/tion': /tion$/, 'en-tion/sion': /sion$/, 'en-plurals/ies': /ies$/, 'en-plurals/es': /es$/,
      'en-digraphs/sh': /sh/, 'en-digraphs/ch': /ch/, 'en-digraphs/th': /th/, 'en-digraphs/ck': /ck$/,
      'en-double/double': /(.)\1(ing|ed)$/, 'en-double/nodouble': /ing$/
    };
    for (const l of D.LISTS) for (const r of l.rules) {
      const re = must[l.id + '/' + r.id];
      if (!re) continue;
      for (const w of (r.w || [])) expect(re.test(w), l.id + '/' + r.id + ': ' + w).toBe(true);
    }
  });

  test('the content rules: none of the restricted words appear in the lists or their cards', () => {
    const re = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
    const text = JSON.stringify(D.LISTS) + JSON.stringify(D.GENERIC);
    expect(re.test(text)).toBe(false);
  });

  test('levels follow age: 6-7 words, 8-9 phrases, 10 and up sentences', () => {
    expect([6, 7, 8, 9, 10, 12, 0].map(D.levelForAge)).toEqual([1, 1, 2, 2, 3, 3, 2]);
  });
});

test.describe('Dictado checking', () => {

  test('levels 1 and 2 ignore capitals and punctuation, level 3 counts everything', () => {
    expect(E.isRight('hombre', 'Hombre', 1)).toBe(true);
    expect(E.isRight('hombre', '  hombre ', 1)).toBe(true);
    expect(E.isRight('hombre', 'ombre', 1)).toBe(false);
    expect(E.isRight('un árbol alto', 'Un árbol alto.', 2)).toBe(true);
    expect(E.isRight('canción', 'cancion', 1), 'a missing accent is a miss').toBe(false);
    expect(E.isRight('Mi mamá toma café.', 'Mi mamá toma café.', 3)).toBe(true);
    expect(E.isRight('Mi mamá toma café.', 'mi mamá toma café.', 3)).toBe(false);
    expect(E.isRight('Mi mamá toma café.', 'Mi mamá toma café', 3)).toBe(false);
    expect(E.isRight('¿Quieres un helado?', 'Quieres un helado?', 3)).toBe(false);
    expect(E.isRight('mañana', 'manana', 1), 'ñ is a letter of its own').toBe(false);
    expect(E.isRight('un  zapato', 'un zapato', 2), 'double spaces are tidied').toBe(true);
  });

  test('the diff names the kind of slip: accent, capitals, signs, letters', () => {
    expect(E.diff('canción', 'cancion', 1).kind).toBe('accent');
    expect(E.diff('Voy a casa.', 'voy a casa.', 3).kind).toBe('case');
    expect(E.diff('Voy a casa.', 'Voy a casa', 3).kind).toBe('punct');
    expect(E.diff('hombre', 'ombre', 1).kind).toBe('letters');
    expect(E.diff('hombre', 'hombre', 1).kind).toBe('ok');
  });

  test('the diff is letter by letter: wrong, missing and extra letters', () => {
    const show = (d) => d.cells.map(c => c.s === 'ok' ? c.c : c.s === 'sub' ? '[' + c.c + '<' + c.t + ']' : c.s === 'miss' ? '[' + c.c + '?]' : '[+' + c.t + ']').join('');
    expect(show(E.diff('escribir', 'escrivir', 1))).toBe('escri[b<v]ir');
    expect(show(E.diff('hombre', 'ombre', 1))).toBe('[h?]ombre');
    expect(show(E.diff('cielo', 'cielos', 1))).toBe('cielo[+s]');
    expect(show(E.diff('canción', 'cancion', 1))).toBe('canci[ó<o]n');
    expect(show(E.diff('knee', 'nee', 1))).toBe('[k?]nee');
    expect(E.diff('escribir', 'escrivir', 1).wrong).toBe(1);
    // nothing typed: every letter is shown as missing, nothing breaks
    const empty = E.diff('sol', '', 1);
    expect(empty.cells.every(c => c.s === 'miss') && empty.wrong === 3).toBe(true);
  });

  test('the word to practise again is the first word that went wrong', () => {
    const d = E.diff('Mi hermano recibió un libro nuevo.', 'Mi hermano resibió un libro nuebo.', 3);
    const f = E.focusWord(d);
    expect(f).toMatchObject({ word: 'recibió', typed: 'resibió' });
    expect(E.blank(d, f)).toBe('Mi hermano _____ un libro nuevo.');
    // a sign at the end of the word stays outside the blank
    const q = E.diff('¿Quieres un helado?', '¿Quieres un elado?', 3);
    expect(E.blank(q, E.focusWord(q))).toBe('¿Quieres un _____?');
    expect(E.focusWord(q).word).toBe('helado');
    // capitals and signs are not spelling: no word to practise
    expect(E.focusWord(E.diff('Voy a casa.', 'voy a casa.', 3))).toBeNull();
    expect(E.focusWord(E.diff('Voy a casa.', 'Voy a casa', 3))).toBeNull();
    expect(E.focusWord(E.diff('sol', 'sol', 1))).toBeNull();
  });

  test('choices for Repaso: the right spelling, what the kid wrote, and look-alikes; never a repeat', () => {
    const c = E.choicesFor('hombre', 'es', 'ombre', 4);
    expect(c[0]).toBe('hombre');
    expect(c).toContain('ombre');
    expect(c.length).toBe(4);
    expect(new Set(c).size).toBe(4);
    for (const w of ['escribir', 'cielo', 'sol', 'pez', 'knee', 'write', 'station', 'árbol', 'cumpleaños']) {
      const lang = /^(knee|write|station)$/.test(w) ? 'en' : 'es';
      const ch = E.choicesFor(w, lang, '', 3);
      expect(ch[0]).toBe(w);
      expect(ch.length, w).toBeGreaterThanOrEqual(2);
      expect(new Set(ch).size).toBe(ch.length);
    }
    // the look-alikes are the usual slips
    expect(E.choicesFor('escribir', 'es', '', 4)).toContain('escrivir');
    expect(E.choicesFor('canción', 'es', '', 4)).toContain('cancion');
    expect(E.choicesFor('knee', 'en', '', 4)).toContain('nee');
    // the same word always gets the same wrong spellings
    expect(E.choicesFor('hormiga', 'es', '', 4)).toEqual(E.choicesFor('hormiga', 'es', '', 4));
  });

  test('stars: all right 3, three quarters 2, half 1; paper stops at 2', () => {
    expect([8, 6, 5, 4, 3, 0].map(n => E.starsFor(n, 8, false))).toEqual([3, 2, 1, 1, 0, 0]);
    expect([8, 6, 4, 3].map(n => E.starsFor(n, 8, true))).toEqual([2, 2, 1, 0]);
    expect(E.starsFor(0, 0, false)).toBe(0);
  });

  test('a round: words missed more than hit come first, then new words, never more than asked', () => {
    const items = D.items('es-h', 1);
    const stats = { huevo: [0, 3], hueso: [1, 2] };
    const round = E.pickRound(items, 4, stats, () => 0.5);
    expect(round.length).toBe(4);
    expect(round.map(i => i.t)).toContain('huevo');
    expect(round.map(i => i.t)).toContain('hueso');
    expect(new Set(round.map(i => i.t)).size).toBe(4);
    expect(E.pickRound(items.slice(0, 3), 8, {}, Math.random).length).toBe(3);
    expect([E.roundSize('beginner', 1), E.roundSize('intermediate', 1), E.roundSize('advanced', 1), E.roundSize('advanced', 3)]).toEqual([4, 6, 8, 6]);
  });

  test('saved progress only gains fields; the star rule counts the best of each list and level', () => {
    const old = { best: { 'es-bv:1': 2 }, mystery: { keep: 'me' }, lang: 'fr', level: 9, mode: 'x' };
    const m = E.migrate(old);
    expect(m.mystery).toEqual({ keep: 'me' });
    expect(m.best).toEqual({ 'es-bv:1': 2 });
    expect([m.v, m.mode, m.rounds, m.words, m.rv]).toEqual([1, 'keys', 0, {}, {}]);
    expect(m.lang).toBeUndefined();
    expect(m.level).toBeUndefined();
    expect(E.migrate(null).best).toEqual({});
    expect(E.migrate([1, 2]).words).toEqual({});
    expect(E.migrate({ lang: 'en', level: 3, mode: 'paper' })).toMatchObject({ lang: 'en', level: 3, mode: 'paper' });
    expect(E.totalStars({ best: { a: 3, b: 2, c: 9, d: -1, e: 'x' } })).toBe(8);
    expect(E.totalStars({})).toBe(0);
  });
});
