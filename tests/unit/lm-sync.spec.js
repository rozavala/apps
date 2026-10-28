// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = 'littlemaestro_' + TEST_PROFILE.name.toLowerCase();
const MAY = '2026-05-11T01:34:59.528Z';

// A fake family server inside the page: GET returns the stored copy,
// PUT stores it with the server's own stamp (like vps/server.js).
async function fakeServer(page, initial) {
  await page.evaluate(([initial, key]) => {
    const srv = { data: initial, puts: 0, failGet: false };
    // @ts-ignore
    window.__srv = srv;
    // @ts-ignore
    window.fetch = async (url, opts) => {
      const u = String(url);
      if (!u.endsWith('/littlemaestro')) return { ok: true, status: 200, json: async () => ({}) };
      if (opts && opts.method === 'PUT') {
        srv.puts++;
        await new Promise(r => setTimeout(r, 5));          // the server's clock is a little later
        srv.data = Object.assign({}, JSON.parse(opts.body), { _syncedAt: new Date().toISOString() });
        return { ok: true, status: 200, json: async () => ({ status: 'saved', syncedAt: srv.data._syncedAt }) };
      }
      if (srv.failGet) throw new TypeError('Load failed');
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(srv.data)) };
    };
    // @ts-ignore
    window.CloudSync.online = true;
  }, [initial, KEY]);
}

const piece = (id, savedAt) => ({ id, title: 'Piece ' + id, custom: true, savedAt,
  score: { time: '4/4', key: 'C', rh: 'C4w', lh: 'C3w' }, bpm: { normal: 80 } });

test.describe('Little Maestro sync merge', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await injectMockProfile(page);
    await page.goto('/');
    await page.waitForFunction(() => !!window.CloudSync);
  });

  test('earned progress only goes up, from either side', async ({ page }) => {
    const out = await page.evaluate(() => {
      // @ts-ignore
      const m = window.CloudSync._mergeLM;
      return m(
        { _syncedAt: 1, progress: { 101: { stars: 3, unlocked: true, completedAt: '2026-05-01T00:00:00Z' }, 102: { stars: 2 }, currentWorld: 2, completedSongs: [101] },
          stats: { totalSessionsCompleted: 40, currentStreak: 9, lastPracticeDate: '2026-05-10', practiceSecs: { '2026-05-10': 600 } } },
        { _syncedAt: 1, progress: { 101: { stars: 1 }, 102: { stars: 3, hands: { rh: 90 } }, 130: { stars: 1 }, currentWorld: 3, completedSongs: [102] },
          stats: { totalSessionsCompleted: 12, currentStreak: 1, lastPracticeDate: '2026-10-16', practiceSecs: { '2026-10-16': 300 } } });
    });
    expect(out.progress['101']).toMatchObject({ stars: 3, unlocked: true });
    expect(out.progress['102']).toMatchObject({ stars: 3, hands: { rh: 90 } });
    expect(out.progress['130']).toMatchObject({ stars: 1 });
    expect(out.progress.currentWorld).toBe(3);
    expect(out.progress.completedSongs.sort()).toEqual([101, 102]);
    expect(out.stats.totalSessionsCompleted).toBe(40);
    expect(out.stats.currentStreak, 'the streak follows the side that practised last').toBe(1);
    expect(Object.keys(out.stats.practiceSecs).sort()).toEqual(['2026-05-10', '2026-10-16']);
  });

  test('My Book: pieces are united, deletions stick, a reused id survives', async ({ page }) => {
    const out = await page.evaluate(([a, b, c, d]) => {
      // @ts-ignore
      const m = window.CloudSync._mergeLM;
      return m({ _syncedAt: 1, customSongs: [a, b] },
               { _syncedAt: 1, customSongs: [c, d], deletedSongs: { 9001: 2000 } });
    }, [piece(9001, 1000), piece(9002, 1000), piece(9003, 1500), piece(9004, 3000)]);
    expect(out.customSongs.map(s => s.id)).toEqual([9002, 9003, 9004]);
    const again = await page.evaluate(([gone, reused]) => {
      // @ts-ignore
      return window.CloudSync._mergeLM({ _syncedAt: 1, customSongs: [gone] }, { _syncedAt: 1, customSongs: [reused], deletedSongs: { 9001: 2000 } });
    }, [piece(9001, 1000), piece(9001, 2500)]);
    expect(again.customSongs.map(s => s.savedAt)).toEqual([2500]);
  });

  test('pushing merges into the stale server copy instead of replacing it', async ({ page }) => {
    await fakeServer(page, { _syncedAt: MAY, profile: { name: 'Test' }, progress: { 101: { stars: 3 }, 105: { stars: 2 } } });
    const res = await page.evaluate(async ([key, may]) => {
      localStorage.setItem(key, JSON.stringify({ _syncedAt: may, profile: { name: 'Test' },
        progress: { 101: { stars: 3 }, 120: { stars: 2 } }, customSongs: [{ id: 9001, title: 'Mine', savedAt: 5 }] }));
      // @ts-ignore
      const ok = await window.CloudSync.push(key);
      // @ts-ignore
      return { ok, server: window.__srv.data, local: JSON.parse(localStorage.getItem(key)) };
    }, [KEY, MAY]);
    expect(res.ok).toBe(true);
    expect(Object.keys(res.server.progress).sort()).toEqual(['101', '105', '120']);
    expect(res.server.customSongs.map(s => s.id)).toEqual([9001]);
    expect(res.local._syncedAt, 'local keeps the server stamp').toBe(res.server._syncedAt);
    expect(res.local.progress['105']).toEqual({ stars: 2 });
  });

  test('a pull after a push keeps what was earned since (offline progress)', async ({ page }) => {
    await fakeServer(page, null);
    const local = await page.evaluate(async (key) => {
      localStorage.setItem(key, JSON.stringify({ profile: { name: 'Test' }, progress: { 101: { stars: 1 } } }));
      // @ts-ignore
      await window.CloudSync.push(key);
      const d = JSON.parse(localStorage.getItem(key));
      d.progress['101'].stars = 3; d.progress['102'] = { stars: 2 };   // played offline, not pushed
      localStorage.setItem(key, JSON.stringify(d));
      // @ts-ignore
      await window.CloudSync.pull(key);
      return JSON.parse(localStorage.getItem(key));
    }, KEY);
    expect(local.progress['101'].stars).toBe(3);
    expect(local.progress['102']).toEqual({ stars: 2 });
  });

  test('a new device\'s placeholder can\'t wipe the real profile', async ({ page }) => {
    await fakeServer(page, { _syncedAt: MAY, profile: { name: 'Test', avatar: '🦊' }, settings: { parentPin: '4321' },
      progress: { 101: { stars: 3 } }, customSongs: [piece(9001, 1)] });
    const server = await page.evaluate(async (key) => {
      // Never synced: the default profile LM creates before the first pull lands
      localStorage.setItem(key, JSON.stringify({ profile: { name: 'Test', avatar: '🐱' }, settings: { parentPin: '1234' },
        progress: { currentWorld: 1, completedSongs: [] }, stats: { practiceSecs: { '2026-10-17': 20 } } }));
      // @ts-ignore
      await window.CloudSync.push(key);
      // @ts-ignore
      return window.__srv.data;
    }, KEY);
    expect(server.profile.avatar).toBe('🦊');
    expect(server.settings.parentPin).toBe('4321');
    expect(server.progress['101']).toEqual({ stars: 3 });
    expect(server.customSongs.length).toBe(1);
  });

  test('no write when the server copy can\'t be read first', async ({ page }) => {
    await fakeServer(page, { _syncedAt: MAY, progress: { 101: { stars: 3 } } });
    const res = await page.evaluate(async (key) => {
      // @ts-ignore
      window.__srv.failGet = true;
      localStorage.setItem(key, JSON.stringify({ progress: {} }));
      // @ts-ignore
      const ok = await window.CloudSync.push(key);
      // @ts-ignore
      return { ok, puts: window.__srv.puts };
    }, KEY);
    expect(res).toEqual({ ok: false, puts: 0 });
  });
});

test('Little Maestro backs its data up when it changes', async ({ page }) => {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.goto('/little-maestro.html');
  await page.waitForFunction(() => typeof UserManager !== 'undefined' && UserManager.getCurrentUser() && window.LMBackup);
  await fakeServer(page, null);
  const res = await page.evaluate(async (key) => {
    const d = JSON.parse(localStorage.getItem(key));
    d.progress = d.progress || {}; d.progress['101'] = { stars: 2 };
    localStorage.setItem(key, JSON.stringify(d));
    // @ts-ignore
    window.LMBackup();
    // @ts-ignore
    await new Promise(r => { const t = setInterval(() => { if (window.__srv.puts) { clearInterval(t); r(); } }, 20); });
    // @ts-ignore
    const first = window.__srv.puts;
    await new Promise(r => setTimeout(r, 100));
    // @ts-ignore
    window.LMBackup();                      // nothing changed: no second write
    await new Promise(r => setTimeout(r, 100));
    // @ts-ignore
    return { first, after: window.__srv.puts, stars: window.__srv.data.progress['101'].stars };
  }, KEY);
  expect(res).toEqual({ first: 1, after: 1, stars: 2 });
});
