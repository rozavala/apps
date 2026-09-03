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
    stars: 7, note: 'browsing roots does not score' }
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
