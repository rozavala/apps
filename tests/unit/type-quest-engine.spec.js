// @ts-check
// Type Quest: the data, the drill builder, scoring and the passages. Every
// drill must be typeable on the keyboard it was made for, and only use keys
// taught so far; every passage must follow the content rules.
const { test, expect } = require('@playwright/test');
const D = require('../../js/type-quest-data.js');
const E = require('../../js/type-quest-engine.js');
const P = require('../../js/type-quest-passages.js');

const TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];
const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;

test.describe('Type Quest data', () => {
  test('every key has a finger, and the home row is where the fingers rest', () => {
    for (const lay of Object.values(D.LAYOUTS)) {
      for (const k of lay.list) {
        if (k.base) expect(k.finger, lay.id + ' ' + k.code).toBeTruthy();
      }
      expect(D.HOME.map(c => lay.keys[c].row)).toEqual([2, 2, 2, 2, 2, 2, 2, 2]);
      expect(lay.keys.KeyF.finger).toBe('li');
      expect(lay.keys.KeyJ.finger).toBe('ri');
    }
    expect(D.LAYOUTS.latam.keys.Semicolon.base).toBe('ñ');
    expect(D.LAYOUTS.us.keys.Semicolon.base).toBe(';');
  });

  test('Spanish characters can be typed on both keyboards', () => {
    for (const ch of 'áéíóúÁÉÍÓÚñÑ¿¡') {
      expect(D.stepsFor(ch, 'us'), 'us ' + ch).toBeTruthy();
      expect(D.stepsFor(ch, 'latam'), 'latam ' + ch).toBeTruthy();
    }
    expect(D.stepsFor('á', 'latam')).toEqual([{ code: 'BracketLeft', shift: false, dead: true }, { code: 'KeyA', shift: false }]);
    expect(D.stepsFor('ñ', 'us')[0]).toMatchObject({ code: 'KeyN', alt: true });
    expect(D.stepsFor('¿', 'latam')).toEqual([{ code: 'Equal', shift: false }]);
  });

  test('lesson ids are unique and the words are plain lower-case', () => {
    const ids = D.LESSONS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const lang of ['es', 'en']) {
      for (const w of D.WORDS[lang]) {
        expect(w, lang).toMatch(/^[a-záéíóúñ]+$/);
        expect(RESTRICTED.test(w)).toBe(false);
      }
    }
  });
});

test.describe('Type Quest drills', () => {
  test('every drill uses only the keys taught so far, and can be typed', () => {
    const fails = [];
    for (const lay of ['us', 'latam']) {
      D.LESSONS.forEach((L, i) => {
        const allowed = E.lessonChars(i, lay).all;
        for (const tier of TIERS) {
          for (const lang of ['es', 'en']) {
            for (let seed = 1; seed <= 6; seed++) {
              const t = E.makeDrill(i, lay, lang, tier, E.rng(seed));
              const tag = `${lay}/${L.id}/${tier}/${lang}/${seed}: "${t}"`;
              if (!t.length) fails.push('empty ' + tag);
              if (/^ | $|  /.test(t)) fails.push('spaces ' + tag);
              if (t.length > E.targetLength(tier) + 1) fails.push('too long ' + tag);
              for (const ch of t) {
                if (!allowed[ch]) { fails.push(`untaught "${ch}" ` + tag); break; }
                if (!D.stepsFor(ch, lay)) { fails.push(`untypeable "${ch}" ` + tag); break; }
              }
              const fresh = E.lessonChars(i, lay).fresh;
              if (fresh.length && !fresh.some(c => t.includes(c))) fails.push('no new key ' + tag);
            }
          }
        }
      });
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });

  test('drills are the same for the same seed', () => {
    expect(E.makeDrill(5, 'us', 'es', 'advanced', E.rng(9))).toBe(E.makeDrill(5, 'us', 'es', 'advanced', E.rng(9)));
    expect(E.makeWords('en', 'expert', E.rng(4), 30)).toBe(E.makeWords('en', 'expert', E.rng(4), 30));
  });

  test('words get longer with age', () => {
    const longest = tier => Math.max(...E.makeWords('es', tier, E.rng(2), 300).split(' ').map(w => w.length));
    expect(longest('beginner')).toBeLessThanOrEqual(4);
    expect(longest('intermediate')).toBeLessThanOrEqual(5);
    expect(longest('expert')).toBeGreaterThan(6);
  });

  test('a focus drill practises the keys asked for', () => {
    const t = E.makeFocus(['k', 'ñ'], 'latam', 'es', 'advanced', E.rng(3));
    expect(t).toContain('k');
    expect(t).toContain('ñ');
  });
});

test.describe('Type Quest scoring', () => {
  test('the cursor waits for the right key and counts every slip', () => {
    const s = new E.Session('ab c');
    expect(s.type('a', 0).ok).toBe(true);
    expect(s.type('x', 1000).ok).toBe(false);
    expect(s.pos).toBe(1);
    s.type('b', 2000); s.type(' ', 3000);
    const r = s.type('c', 12000);
    expect(r.done).toBe(true);
    const res = s.result();
    expect(res.chars).toBe(4);
    expect(res.errors).toBe(1);
    expect(res.acc).toBe(0.8);
    expect(res.secs).toBe(12);
    expect(res.wpm).toBe(4);           // 4 characters = 0.8 words in 12 s
    expect(res.keys.b).toEqual([1, 1]);
    expect(s.slips).toEqual({ 1: 1 });
  });

  test('relaxed accents accept the plain letter and skip ¿ ¡', () => {
    const s = new E.Session('¿Qué año?', { loose: true });
    for (const ch of 'Que ano?') s.type(ch);
    expect(s.done()).toBe(true);
    expect(s.errors).toBe(0);
    const exact = new E.Session('qué');
    exact.type('q'); exact.type('u');
    expect(exact.type('e').ok).toBe(false);
    expect(exact.type('é').ok).toBe(true);
  });

  test('stars: accuracy first, speed for the third', () => {
    expect(E.lessonStars(30, 0.79, 'advanced')).toBe(0);
    expect(E.lessonStars(30, 0.85, 'advanced')).toBe(1);
    expect(E.lessonStars(30, 0.93, 'advanced')).toBe(2);
    expect(E.lessonStars(11, 0.99, 'advanced')).toBe(2);
    expect(E.lessonStars(12, 0.95, 'advanced')).toBe(3);
    expect(E.lessonStars(7, 0.95, 'intermediate')).toBe(3);
    expect(E.passageStars(0.97)).toBe(3);
    expect(E.passageStars(0.8)).toBe(0);
  });

  test('a rank needs three long runs at 95% and never goes down', () => {
    const run = (w, a = 0.96, c = 120) => ({ w, a, c });
    expect(E.rankIndex([run(16), run(16)], 0)).toBe(0);                     // only two runs
    expect(E.rankIndex([run(16), run(16), run(11)], 0)).toBe(2);            // three at 10+: Veteran
    expect(E.rankIndex([run(16), run(16), run(16)], 0)).toBe(3);            // three at 15+: Explorer
    expect(E.rankIndex([run(30, 0.9), run(30, 0.9), run(30, 0.9)], 0)).toBe(0);   // below 95%
    expect(E.rankIndex([run(30, 1, 40), run(30, 1, 40), run(30, 1, 40)], 0)).toBe(0); // too short
    expect(E.rankIndex([], 4)).toBe(4);                                       // kept after runs are trimmed
    expect(D.RANKS.map(r => r.en)).toEqual(['Cadet', 'Apprentice', 'Veteran', 'Explorer', 'Pilot', 'Astronaut', 'Elite', 'Grand Master']);
  });

  test('the heatmap finds the keys missed most, and old counts fade', () => {
    let store = E.mergeKeys({}, { a: [20, 0], s: [10, 5], d: [3, 3], ' ': [9, 9] });
    expect(store[' ']).toBeUndefined();
    expect(E.weakest(store, 5).map(w => w.ch)).toEqual(['s']);      // d has too few tries to judge
    store = E.mergeKeys(store, { a: [500, 0] });
    expect(store.a[0]).toBeLessThan(400);
  });
});

test.describe('Type Quest passages', () => {
  test('every passage is from the suite, the right length, and typeable', () => {
    const ids = new Set();
    const LEN = { 1: [50, 140], 2: [120, 270], 3: [240, 430] };
    for (const p of P) {
      expect(ids.has(p.id), p.id).toBe(false); ids.add(p.id);
      expect(['story', 'chile', 'faith']).toContain(p.src);
      expect(['es', 'en']).toContain(p.lang);
      expect(p.text.length, p.id).toBeGreaterThanOrEqual(LEN[p.lvl][0]);
      expect(p.text.length, p.id).toBeLessThanOrEqual(LEN[p.lvl][1]);
      expect(p.text, p.id).toMatch(/^[A-Za-z0-9 .,;:!?'"()\-áéíóúÁÉÍÓÚñÑ¿¡]+$/);
      expect(p.text, p.id).not.toMatch(/  |^ | $/);
      expect(RESTRICTED.test(p.text + ' ' + p.title), p.id).toBe(false);
      for (const ch of p.text) {
        expect(D.stepsFor(ch, 'us'), p.id + ' us ' + ch).toBeTruthy();
        expect(D.stepsFor(ch, 'latam'), p.id + ' latam ' + ch).toBeTruthy();
      }
    }
    for (const src of ['story', 'chile', 'faith']) for (const lang of ['es', 'en']) for (const lvl of [1, 2, 3]) {
      expect(P.some(p => p.src === src && p.lang === lang && p.lvl === lvl), `${src}/${lang}/${lvl}`).toBe(true);
    }
  });
});
