// @ts-check
// Trivia Familiar saves a record for every kid who played a game night,
// not only the one signed in, so this device's copy of a sibling's record
// can be old. Sync must merge it into the server's copy, never replace it.
const { test, expect } = require('@playwright/test');

// A fake family server inside the page: GET returns the stored copy (null
// when there is none), PUT stores it with the server's own stamp.
async function fakeServer(page, kid, initial) {
  await page.evaluate(([kid, initial]) => {
    const srv = { data: initial, puts: 0 };
    // @ts-ignore
    window.__srv = srv;
    // @ts-ignore
    window.fetch = async (url, opts) => {
      const u = String(url);
      if (!u.endsWith('/api/kids/' + kid + '/trivia')) return { ok: true, status: 200, json: async () => null };
      if (opts && opts.method === 'PUT') {
        srv.puts++;
        srv.data = Object.assign({}, JSON.parse(opts.body), { _syncedAt: new Date().toISOString() });
        return { ok: true, status: 200, json: async () => ({ status: 'saved', syncedAt: srv.data._syncedAt }) };
      }
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(srv.data)) };
    };
    // @ts-ignore
    window.CloudSync.online = true;
  }, [kid, initial]);
}

const games = (n, from = 0) => Object.fromEntries(Array.from({ length: n }, (_, i) => ['g' + (from + i), [3, 4, i % 2, 40]]));
const KIDS = [{ name: 'Tomás', age: 7, avatar: '🦁' }, { name: 'Clara', age: 10, avatar: '🐼' }];

test.describe('Trivia Familiar sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(kids => {
      if (localStorage.getItem('zs_profiles')) return;
      localStorage.setItem('zs_profiles', JSON.stringify(kids));
      localStorage.setItem('zs_active_user', JSON.stringify(kids[0]));
    }, KIDS);
  });

  test('the merge keeps every game from both sides and only lets totals go up', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => !!(/** @type {any} */ (window).CloudSync));
    const out = await page.evaluate(([a, b]) => /** @type {any} */ (window).CloudSync._mergeTrivia(
      { _syncedAt: 5, v: 1, games: 10, wins: 4, right: 30, asked: 40, best: 90, g: a, hist: { x: 9, y: 2 }, last: '2026-12-20' },
      { v: 1, games: 2, wins: 1, right: 5, asked: 8, best: 120, g: b, hist: { y: 7, z: 1 }, last: '2026-12-24' }), [games(10), games(2, 9)]);
    expect(Object.keys(out.g).length).toBe(11);       // g9 is on both sides
    expect(out.games).toBe(11);
    expect(out.best).toBe(120);
    expect(out.hist).toEqual({ x: 9, y: 7, z: 1 });
    expect(out.last).toBe('2026-12-24');
    expect(out.right).toBeGreaterThanOrEqual(30);
    // The question history stays capped.
    const big = await page.evaluate(() => {
      const h1 = {}, h2 = {};
      for (let i = 0; i < 600; i++) { h1['a' + i] = i + 1; h2['b' + i] = i + 1000; }
      return Object.keys(/** @type {any} */ (window).CloudSync._mergeTrivia({ hist: h1 }, { hist: h2 }).hist);
    });
    expect(big.length).toBe(700);
    expect(big).toContain('b0');
    expect(big).not.toContain('a0');
  });

  test('a game night with a stale local copy of a sibling: 10 games on the server become 11', async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('zs_triviafam')) return;
      // This device last saw Clara's record when she had one game.
      localStorage.setItem('zs_trivia_clara', JSON.stringify({ v: 1, games: 1, g: { g0: [3, 4, 0, 40] }, hist: { 'ci-01': 1 }, _syncedAt: '2026-11-01T00:00:00Z' }));
      localStorage.setItem('zs_triviafam', JSON.stringify({ setup: { players: ['k:Tomás', 'k:Clara'], rounds: 3 } }));
    });
    await page.goto('/trivia-familiar.html?seed=4');
    await page.waitForSelector('#tv-main');
    await fakeServer(page, 'clara', { _syncedAt: '2026-12-01T00:00:00Z', v: 1, games: 10, wins: 3, right: 30, asked: 40, best: 90, g: games(10), hist: { 'ge-05': 4 } });
    await page.click('#tv-start');
    for (let guard = 0; guard < 60; guard++) {
      const st = await page.evaluate(() => /** @type {any} */ (window).Trivia.state());
      if (st.screen === 'end') break;
      if (st.screen === 'pass') { await page.click('#tv-ready'); continue; }
      if (st.screen === 'final-intro') { await page.click('#tv-final-go'); continue; }
      if (st.screen === 'final') { if (await page.$('#tv-reveal')) await page.click('#tv-reveal'); await page.click('#tv-fin-next'); continue; }
      if (st.current.type === 'ord') {
        const vals = await page.$$eval('.tv-ord-b', bs => bs.map(b => +(/** @type {HTMLElement} */ (b).dataset.v || 0)));
        for (const v of vals.sort((a, b) => a - b)) await page.click(`.tv-ord-b[data-v="${v}"]`);
        await page.click('#tv-ord-ok');
      } else await page.click(`.tv-opt[data-i="${st.current.rightIndex}"]`);
      if (await page.$('[data-steal="none"]')) await page.click('[data-steal="none"]');
      else await page.click('#tv-next');
    }
    await page.waitForFunction(() => /** @type {any} */ (window).__srv.puts > 0 && /** @type {any} */ (window).__srv.data.games === 11);
    const res = await page.evaluate(() => ({ server: /** @type {any} */ (window).__srv.data, local: JSON.parse(localStorage.getItem('zs_trivia_clara') || '{}') }));
    expect(res.server.games).toBe(11);
    expect(Object.keys(res.server.g).length).toBe(11);
    expect(res.server.hist['ge-05']).toBe(4);           // the server's history is kept
    expect(res.local.games).toBe(11);                   // and this device catches up
    const stars = await page.evaluate(s => /** @type {any} */ (window).getAppStars('trivia', s), res.server);
    expect(stars).toBe(11);
  });
});
