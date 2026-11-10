// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');
const fs = require('fs');
const path = require('path');

const src = f => fs.readFileSync(path.resolve(__dirname, '../../js/' + f), 'utf8');

const KEY = TEST_PROFILE.name.toLowerCase();

// One saved blob per app, in that app's own shape, and the stars it
// should be worth.
const CASES = [
  { id: 'math',  prefix: 'zs_mathgalaxy_', data: { cadet: { bestStars: 3 }, pilot: { bestStars: 2 } }, stars: 5 },
  { id: 'chile', prefix: 'zs_chile_',
    data: { geography: { bestStars: 3 }, vr: ['norte'], memBest: 12 }, stars: 3 },
  { id: 'chess', prefix: 'zs_chess_', data: { puzzlesSolved: 4, wins: 2 }, stars: 6 },
  { id: 'piano', prefix: 'littlemaestro_',
    data: { progress: { 100: { stars: 3 }, 101: { stars: 1 }, currentWorld: 1 } }, stars: 4 },
  { id: 'guitar', prefix: 'zs_guitar_', data: { totalStars: 9 }, stars: 9 },

  // The six that never counted before.
  { id: 'money', prefix: 'zs_money_',
    data: { clp: { identify: { stars: 3 }, change: { stars: 2 } }, usd: { identify: { stars: 1 } } },
    stars: 6 },
  { id: 'invest', prefix: 'zs_invest_',
    data: { bestStars: 3, quizBest: 8, mathBest: { compound: 5, risk: 4 } }, stars: 6 },
  { id: 'invest', prefix: 'zs_invest_',
    data: { bestStars: 2, quizBest: 3, mathBest: {} }, stars: 2, note: 'weak quiz earns nothing' },
  { id: 'bible', prefix: 'zs_bible_',
    data: { stories: ['creation'], storyStars: { creation: 3 },
            verses: { 'Jn 3:16': { stars: 2 } }, books: { torah: { stars: 1 } } }, stars: 6 },
  { id: 'civics', prefix: 'zs_civics_',
    data: { branches: ['exec', 'leg'], institutions: ['moneda'], lawCompleted: true, comparativeBest: 9 },
    stars: 5 },
  { id: 'civics', prefix: 'zs_civics_',
    data: { branches: [], institutions: [], comparativeBest: 4 }, stars: 0, note: 'weak comparative' },
  { id: 'codecadet', prefix: 'zs_codecadet_',
    data: { 'w1-1': { stars: 3 }, 'w1-2': { stars: 2 } }, stars: 5 },
  { id: 'vocab', prefix: 'zs_vocab_',
    data: { seenRoots: ['aqua', 'bio', 'geo'], matchStars: 3, dictationStars: 2, builds: [0, 1] },
    stars: 7, note: 'browsing roots does not score' },
  { id: 'vocab', prefix: 'zs_vocab_',
    data: { matchStars: 3, dictationStars: 2, builds: [0], spotStars: 2, cogStars: 1 },
    stars: 9, note: 'Detective and Cognados count' },

  // Learn-by-doing apps
  { id: 'circuit', prefix: 'zs_circuit_',
    data: { v: 1, levels: { loop: { stars: 3, date: '2026-11-03' }, switch: { stars: 2, date: '2026-11-03' },
            motor: { stars: 1, date: '2026-11-04' } }, facts: ['safety', 'volta', 'bulb'], electrons: false },
    stars: 6, note: 'fact cards read do not score' },
  { id: 'engineer', prefix: 'zs_engineer_',
    data: { v: 1, levels: { l1: { stars: 3, best: 20800 }, l2: { stars: 2, best: 52000 }, l5: { stars: 1, best: 110000 } },
            designs: {}, realBuild: { date: '2026-11-03', coins: 23 } },
    stars: 7, note: 'real build adds one' },
  { id: 'negocio', prefix: 'zs_negocio_',
    data: { seasons: 3, best: { empanadas: { profit: 286000, stars: 2 }, mote: { profit: 427500, stars: 3 },
            limonada: { profit: -4000, stars: 0 } }, quizBest: 5, lastPlayed: '2026-11-03', cur: null },
    stars: 6, note: 'a losing season scores nothing' },
  { id: 'secretos', prefix: 'zs_secretos_',
    data: { missions: { m01: { stars: 3, date: '2026-11-03' }, m02: { stars: 2, date: '2026-11-03' },
            m10: { stars: 1, date: '2026-11-04' } }, tools: { caesar: '2026-11-03' }, history: ['h-caesar'] },
    stars: 6, note: 'tools and history cards do not score' },
  { id: 'clock', prefix: 'zs_clock_',
    data: { lang: 'es', helper: true, digital: true, rounds: 5, levels: {
            'set-oclock': { stars: 3, best: 10, of: 10 }, 'read-half': { stars: 2, best: 8, of: 10 },
            'day-day1': { stars: 1, best: 5, of: 8 }, 'calendar-cal1': { stars: 0, best: 3, of: 10 } } },
    stars: 6, note: 'rounds played do not score' },
  { id: 'naturaleza', prefix: 'zs_naturaleza_',
    data: { cards: { '2026-spring': { found: ['loica', 'chincol', 'zorzal', 'jilguero', 'chinita', 'queltehue'] },
                     '2026-winter': { found: ['picaflor', 'jilguero', 'chuncho', 'queltehue', 'tiuque', 'zorzal', 'espino', 'boldo', 'condor'] } },
            quiz: { clues_birds: 3, tap_all: 1, shadow_bugs: 5 }, sightings: [], seen: ['pudu'] },
    stars: 12, note: 'quiz stars cap at 3' },
  { id: 'euclid', prefix: 'zs_euclid_',
    data: { v: 1, levels: { equilateral: { stars: 3, best: 4, at: '2026-11-03' }, midpoint: { stars: 2, best: 3, at: '2026-11-03' },
            hexagon: { stars: 1, best: 12, at: '2026-11-03' } }, guided: false, last: 'hexagon' },
    stars: 6 },
  { id: 'cocina', prefix: 'zs_cocina_',
    data: { v: 1, cooked: { 'huevos-revueltos': { stars: 3, count: 2, dates: ['2026-11-03', '2026-10-28'] },
            pebre: { stars: 2, count: 1, dates: ['2026-11-01'] } }, measure: { m1: 3, m2: 2, m6: 1 },
            safetyStars: 2, safetyBest: 5, eggStars: 3 },
    stars: 16 },
  { id: 'marinero', prefix: 'zs_marinero_',
    data: { knots: { fig8: { w: 1, c: 1, r: 1 }, bowline: { w: 1 } }, best: { steer: 3, names: 2, buoys: 1 }, hunts: 4 },
    stars: 13, note: 'treasure hunts cap at 3' },
  { id: 'calculo', prefix: 'zs_calculo_',
    data: { v: 1, sprint: { level: 8, mastered: 7, best: 120, plays: 9, rounds: [{ p: 40 }] },
            est: { door: 3, heart: 2, bath: 1, pitch: 2, egg: 0 },
            units: { length: 3, mass: 2, zones: 5 },
            eng: { area: 1, volume: 3, scale: 6, ohm: 20, rates: 0 } },
    stars: 23, note: 'sprint 3 (7 mastered) + 3 estimates at 2+ stars + units 3+2+3 + engineer 1+2+3+3' },
  { id: 'calculo', prefix: 'zs_calculo_',
    data: { sprint: { mastered: 99 }, est: Object.fromEntries(Array.from({ length: 20 }, (_, i) => ['q' + i, 3])), units: {}, eng: {} },
    stars: 18, note: 'sprint stars cap at 6 and estimate stars at 12' },
  { id: 'calculo', prefix: 'zs_calculo_', data: { v: 1 }, stars: 0, note: 'nothing played yet' },
  { id: 'lector', prefix: 'zs_lector_',
    data: { v: 1, lv: { es1: { sounds: 3 }, es2: { sounds: 2, syll: 3, build: 1, read: 0 }, en1: { blend: 3, read: 9 } },
            books: { 'es-mi-mama': { l: 1, r: 1, p: 1 }, 'en-pip-ant': { l: 1 } } },
    stars: 19, note: 'activities cap at 3; a book is one star each for listening, reading and reading aloud' },
  { id: 'lector', prefix: 'zs_lector_', data: { v: 1, lv: {}, books: {} }, stars: 0, note: 'nothing yet' },
  { id: 'linea', prefix: 'zs_linea_',
    data: { v: 1, seen: Object.fromEntries(Array.from({ length: 25 }, (_, i) => ['e' + i, 1])), g: { order3: 3, order4: 1, same: 2, ba: 9, t_all: 0 } },
    stars: 2 + 3 + 1 + 2 + 3 + 0, note: 'one star per 10 events opened, plus each game best (up to 3)' },
  { id: 'linea', prefix: 'zs_linea_', data: { v: 1, seen: Object.fromEntries(Array.from({ length: 400 }, (_, i) => ['e' + i, 1])), g: {} }, stars: 15, note: 'opened-event stars cap at 15' },
  { id: 'linea', prefix: 'zs_linea_', data: { v: 1, seen: {}, g: {} }, stars: 0, note: 'nothing yet' },
  { id: 'arbol', prefix: 'zs_arbol_',
    data: { v: 1, q: { grand: 5, who: 4, where: 3, term: 2, older: 0 }, seen: { I1: 1, I2: 1, I3: 1, I4: 1, I5: 1, I6: 1, I7: 1 }, rel: 5, map: 1 },
    stars: 3 + 2 + 1 + 0 + 0 + 2 + 2 + 1, note: 'quiz best scores 3/2/1/0 stars + 7 pages seen (2) + 5 relations asked (2) + the map (1)' },
  { id: 'arbol', prefix: 'zs_arbol_', data: { q: { who: 5, where: 5, term: 5, older: 5, grand: 5 }, seen: Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['I' + i, 1])), rel: 99, map: 1 },
    stars: 15 + 3 + 3 + 1, note: 'pages seen cap at 3 stars and relations at 3' },
  { id: 'arbol', prefix: 'zs_arbol_', data: { v: 1 }, stars: 0, note: 'nothing yet' },
  { id: 'codelab', prefix: 'zs_codelab_',
    data: { v: 1, m: { hello: { s: 3 }, name: { s: 2, code: 'print("x")' }, line: { s: 9 }, corner: { s: 0 }, bad: null }, free: [{ id: 'p1', name: 'x', code: '' }] },
    stars: 8, note: 'each mission counts up to 3 stars; saved workshop programs do not score' },
  { id: 'codelab', prefix: 'zs_codelab_', data: { v: 1, m: {}, free: [] }, stars: 0, note: 'nothing yet' },
  { id: 'review', prefix: 'zs_review_',
    data: { v: 1, items: { 'math:a': { id: 'math:a', box: 1, due: 20000 } }, done: { '2026-11-03': 10, '2026-11-04': 6, '2026-11-05': 3 }, retired: 4 },
    stars: 3, note: 'one star for each day the review was finished; items and retired ones do not score' },
  { id: 'review', prefix: 'zs_review_', data: { items: {} }, stars: 0, note: 'nothing finished yet' },
  { id: 'dictado', prefix: 'zs_dictado_',
    data: { v: 1, lang: 'es', mode: 'keys', best: { 'es-bv:1': 3, 'es-bv:2': 2, 'en-magice:1': 1, 'es-h:3': 9, 'es-gj:1': 0 },
            words: { escribir: [3, 1] }, rv: {}, rounds: 7 },
    stars: 9, note: 'best round of each list and level; the words and rounds do not score; at most 3 each' },
  { id: 'dictado', prefix: 'zs_dictado_', data: {}, stars: 0, note: 'nothing played yet' },
  { id: 'challenge', prefix: 'zs_challenge_',
    data: { v: 1, stars: { c_a: '2026-11-09', c_b: '2026-11-10', c_c: '2026-11-10' } },
    stars: 3, note: 'one per solved challenge' },
  { id: 'challenge', prefix: 'zs_challenge_',
    data: { v: 1, stars: { a: '2026-11-10', b: '2026-11-10', c: '2026-11-10', d: '2026-11-10', e: '2026-11-11' } },
    stars: 4, note: 'at most 3 a day' }
];

test.describe('per-app star rules', () => {

  test.beforeEach(async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    await page.waitForFunction(() => !!window.getAppStars);
  });

  test('every rule scores its app the way that app records progress', async ({ page }) => {
    const got = await page.evaluate((cases) =>
      // @ts-ignore
      cases.map(c => window.getAppStars(c.id, c.data)), CASES);

    CASES.forEach((c, i) => {
      expect(got[i], `${c.id}${c.note ? ' — ' + c.note : ''}`).toBe(c.stars);
    });
  });

  test('getPlayerStats totals the six apps that used to score zero', async ({ page }) => {
    const stats = await page.evaluate(({ cases, key }) => {
      const newcomers = ['money', 'invest', 'bible', 'civics', 'codecadet', 'vocab'];
      const seen = new Set();
      cases.filter(c => newcomers.includes(c.id) && !seen.has(c.id) && seen.add(c.id))
           .forEach(c => localStorage.setItem(c.prefix + key, JSON.stringify(c.data)));
      // @ts-ignore
      const s = window.getPlayerStats('Test');
      return { total: s.totalStars, apps: s.appsWithStars };
    }, { cases: CASES, key: KEY });

    // 6 + 6 + 6 + 5 + 5 + 7
    expect(stats.total).toBe(35);
    expect(stats.apps).toBe(6);
  });

  test('an unknown app id falls back to totalStars and never throws', async ({ page }) => {
    const out = await page.evaluate(() => ({
      // @ts-ignore
      unknown: window.getAppStars('not_an_app', { totalStars: 4 }),
      // @ts-ignore
      empty: window.getAppStars('bible', {}),
      // @ts-ignore
      nullish: window.getAppStars('civics', null),
      // @ts-ignore
      junk: window.getAppStars('codecadet', { 'w1-1': 'not an object' })
    }));

    expect(out.unknown).toBe(4);
    expect(out.empty).toBe(0);
    expect(out.nullish).toBe(0);
    expect(out.junk).toBe(0);
  });

});
test.describe('app registration', () => {

  // These lists drifted apart once already: five apps saved to a key
  // nothing else read, and the Trophy Room kept its own star rules.
  // Every app that scores stars has to be known to all three.
  test('every scoring app is registered for sync and a trophy badge', () => {
    const auth = src('auth.js');
    const registry = auth.slice(auth.indexOf('var APP_STAR_CONFIGS'), auth.indexOf('var _starConfigById'));
    const apps = [...registry.matchAll(/id:\s*'([a-z]+)',\s*prefix:\s*'([^']+)'/g)]
      .map(m => ({ id: m[1], prefix: m[2] }));

    const sync = src('sync.js');
    const keyMap = sync.slice(sync.indexOf('var KEY_MAP'), sync.indexOf('// Household-shared'));
    const trophy = src('trophy-room.js');

    expect(apps.length, 'registry parsed').toBeGreaterThan(20);

    const notSynced = apps.filter(a => !keyMap.includes("'" + a.prefix + "'")).map(a => a.id);
    expect(notSynced, 'apps missing from CloudSync KEY_MAP').toEqual([]);

    // Four apps count toward the Explorer Rank but have never had a
    // badge on the wall. Left as-is deliberately; listed here so adding
    // an app forces a choice rather than silently landing in the gap.
    const KNOWN_BADGELESS = ['move', 'atlas', 'quest', 'bmcheck'];
    const noBadge = apps
      .filter(a => !new RegExp("id:\\s*'" + a.id + "'").test(trophy))
      .map(a => a.id);
    expect(noBadge.sort(), 'apps missing a Trophy Room badge')
      .toEqual(KNOWN_BADGELESS.slice().sort());
  });

  test('no app reads a bare, un-prefixed storage key', () => {
    // getUserAppKey('world') concatenates to `worlddiego`, not
    // `zs_world_diego` — the bug this whole audit started from.
    const files = fs.readdirSync(path.resolve(__dirname, '../../js'))
      .filter(f => f.endsWith('.js') && !/vexflow|zxing|lz-string/.test(f));

    const offenders = [];
    for (const f of files) {
      const body = src(f).replace(/^\s*\/\/.*$/gm, '');   // ignore comments
      for (const m of body.matchAll(/getUserAppKey\(\s*'([^']+)'\s*\)/g)) {
        if (!/^(zs_|littlemaestro_)/.test(m[1])) offenders.push(f + " -> '" + m[1] + "'");
      }
    }
    expect(offenders).toEqual([]);
  });
});
