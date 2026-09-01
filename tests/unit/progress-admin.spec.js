// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KID = TEST_PROFILE.name;                       // 'Test'
const KEY = KID.toLowerCase().replace(/\s+/g, '_');  // 'test'

test.describe('ProgressAdmin', () => {

  test.beforeEach(async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    // Wait on the modules under test rather than networkidle — the hub
    // also pulls webfonts, which may or may not be reachable.
    await page.waitForFunction(() => !!window.ProgressAdmin && !!window.ZSProgressCatalog);
  });

  test('catalogs load and are ordered by group', async ({ page }) => {
    const info = await page.evaluate(() => {
      // @ts-ignore
      const cat = window.ZSProgressCatalog;
      // @ts-ignore
      const piano = cat.piano;
      const worlds = [];
      piano.forEach(u => { if (worlds[worlds.length - 1] !== u.g) worlds.push(u.g); });
      return {
        ids: Object.keys(cat).sort(),
        pianoLen: piano.length,
        // each world appears as exactly one contiguous run
        worldRuns: worlds.length,
        distinctWorlds: new Set(piano.map(u => u.g)).size,
        firstPiano: piano[0]
      };
    });

    expect(info.ids).toContain('piano');
    expect(info.ids).toContain('codecadet');
    expect(info.pianoLen).toBeGreaterThan(100);
    expect(info.worldRuns).toBe(info.distinctWorlds);
    expect(info.firstPiano.g).toBe('World 1');
  });

  test('setPosition marks earlier songs done and leaves later ones alone', async ({ page }) => {
    const result = await page.evaluate((key) => {
      // @ts-ignore
      const units = window.ZSProgressCatalog.piano;
      // @ts-ignore
      window.ProgressAdmin.setPosition('Test', 'piano', 10);
      const data = JSON.parse(localStorage.getItem('littlemaestro_' + key));
      const prog = data.progress;
      return {
        before: units.slice(0, 10).every(u => prog[u.i] && prog[u.i].stars > 0),
        currentHasNoStars: !prog[units[10].i].stars,
        currentUnlocked: prog[units[10].i].unlocked === true,
        afterAbsent: units.slice(11, 20).every(u => !prog[u.i]),
        completedSongs: prog.completedSongs.length,
        songStars: Object.keys(prog.songStars).length,
        currentWorld: prog.currentWorld,
        currentSong: prog.currentSong,
        // @ts-ignore
        state: window.ProgressAdmin.getState('Test', 'piano')
      };
    }, KEY);

    expect(result.before).toBe(true);
    expect(result.currentHasNoStars).toBe(true);
    expect(result.currentUnlocked).toBe(true);
    expect(result.afterAbsent).toBe(true);
    expect(result.completedSongs).toBe(10);
    expect(result.songStars).toBe(10);
    expect(result.currentWorld).toBe(1);
    expect(result.currentSong).toBe(11);
    expect(result.state.doneCount).toBe(10);
    expect(result.state.index).toBe(10);
  });

  test('setPosition keeps stars a kid actually earned', async ({ page }) => {
    const stars = await page.evaluate((key) => {
      const k = 'littlemaestro_' + key;
      // @ts-ignore
      const units = window.ZSProgressCatalog.piano;
      localStorage.setItem(k, JSON.stringify({
        progress: { [units[0].i]: { stars: 1, completedAt: '2024-01-01T00:00:00.000Z' } }
      }));
      // @ts-ignore
      window.ProgressAdmin.setPosition('Test', 'piano', 5);
      const prog = JSON.parse(localStorage.getItem(k)).progress;
      return { first: prog[units[0].i], second: prog[units[1].i] };
    }, KEY);

    // The one-star run they really did survives; the filler is 3 stars.
    expect(stars.first.stars).toBe(1);
    expect(stars.first.completedAt).toBe('2024-01-01T00:00:00.000Z');
    expect(stars.second.stars).toBe(3);
  });

  test('setPosition can move a kid backwards', async ({ page }) => {
    const state = await page.evaluate(() => {
      // @ts-ignore
      window.ProgressAdmin.setPosition('Test', 'piano', 40);
      // @ts-ignore
      window.ProgressAdmin.setPosition('Test', 'piano', 3);
      // @ts-ignore
      return window.ProgressAdmin.getState('Test', 'piano');
    });
    expect(state.doneCount).toBe(3);
  });

  test('every sequence app round-trips a position', async ({ page }) => {
    const results = await page.evaluate(() => {
      // @ts-ignore
      const PA = window.ProgressAdmin;
      return PA.APPS.filter(a => a.mode === 'sequence').map(app => {
        const total = PA.unitsFor(app).length;
        const target = Math.min(3, total);
        PA.setPosition('Test', app.id, target);
        const mid = PA.getState('Test', app.id);
        PA.setPosition('Test', app.id, total);
        const full = PA.getState('Test', app.id);
        return { id: app.id, total: total, mid: mid.doneCount, target: target, full: full.doneCount };
      });
    });

    expect(results.length).toBeGreaterThan(5);
    for (const r of results) {
      expect(r.total, r.id + ' has units').toBeGreaterThan(0);
      expect(r.mid, r.id + ' set to ' + r.target).toBe(r.target);
      expect(r.full, r.id + ' marked complete').toBe(r.total);
    }
  });

  test('reset clears an app but keeps the Little Maestro settings', async ({ page }) => {
    const after = await page.evaluate((key) => {
      const k = 'littlemaestro_' + key;
      localStorage.setItem(k, JSON.stringify({
        profile: { name: 'Test' },
        settings: { parentPin: '4321' },
        progress: { 100: { stars: 3 } }
      }));
      // @ts-ignore
      window.ProgressAdmin.reset('Test', 'piano');
      return JSON.parse(localStorage.getItem(k));
    }, KEY);

    expect(after.settings.parentPin).toBe('4321');
    expect(after.progress.completedSongs).toEqual([]);
    expect(after.progress[100]).toBeUndefined();
  });

  test('reset writes an empty record instead of dropping the key', async ({ page }) => {
    // A removed key reads as "nothing local" to CloudSync, which would
    // let another device push the old progress straight back.
    const raw = await page.evaluate((key) => {
      localStorage.setItem('zs_codecadet_' + key, JSON.stringify({ 'w1-1': { stars: 3 } }));
      // @ts-ignore
      window.ProgressAdmin.reset('Test', 'codecadet');
      return localStorage.getItem('zs_codecadet_' + key);
    }, KEY);

    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed['w1-1']).toBeUndefined();
    expect(typeof parsed._syncedAt).toBe('number');
  });

  test('reset keeps the Art Studio gallery — drawings are not progress', async ({ page }) => {
    const after = await page.evaluate((key) => {
      localStorage.setItem('zs_art_' + key, JSON.stringify({
        gallery: [{ id: 'a1', title: 'Rocket' }],
        lessonsCompleted: ['shapes'],
        totalStars: 3
      }));
      // @ts-ignore
      window.ProgressAdmin.reset('Test', 'art');
      return JSON.parse(localStorage.getItem('zs_art_' + key));
    }, KEY);

    expect(after.gallery).toHaveLength(1);
    expect(after.lessonsCompleted).toEqual([]);
  });

  test('resetAll wipes every registered app for one kid', async ({ page }) => {
    const leftovers = await page.evaluate(() => {
      // @ts-ignore
      const PA = window.ProgressAdmin;
      // Seed each app with progress in the shape that app actually uses,
      // so "did the reset land?" is a real question for every one.
      PA.APPS.forEach(a => {
        const units = PA.unitsFor(a);
        localStorage.setItem(a.prefix + 'test', JSON.stringify({ totalStars: 9 }));
        if (units.length) PA.setPosition('Test', a.id, units.length);
      });
      localStorage.setItem('zs_guess_other_kid', JSON.stringify({ totalStars: 9 }));

      PA.resetAll('Test');

      const stillDone = PA.APPS
        .filter(a => PA.getState('Test', a.id).doneCount > 0)
        .map(a => a.id);
      const stillTallied = PA.APPS
        .filter(a => a.mode === 'reset' &&
                     (JSON.parse(localStorage.getItem(a.prefix + 'test')) || {}).totalStars === 9)
        .map(a => a.id);
      return {
        stillDone: stillDone,
        stillTallied: stillTallied,
        otherKid: JSON.parse(localStorage.getItem('zs_guess_other_kid')).totalStars
      };
    });

    expect(leftovers.stillDone).toEqual([]);
    expect(leftovers.stillTallied).toEqual([]);
    expect(leftovers.otherKid, 'another kid is untouched').toBe(9);
  });

  test('writes stamp _syncedAt so a stale cloud pull cannot undo them', async ({ page }) => {
    const stamped = await page.evaluate((key) => {
      // @ts-ignore
      window.ProgressAdmin.setPosition('Test', 'story', 2);
      const d = JSON.parse(localStorage.getItem('zs_story_' + key));
      return { ts: d._syncedAt, read: d.storiesRead.length };
    }, KEY);

    expect(stamped.read).toBe(2);
    expect(stamped.ts).toBeGreaterThan(Date.now() - 60000);
  });

  test('reset-only apps report no units and still reset', async ({ page }) => {
    const info = await page.evaluate((key) => {
      localStorage.setItem('zs_move_' + key, JSON.stringify({ steps: 5000 }));
      // @ts-ignore
      const before = window.ProgressAdmin.getState('Test', 'move');
      // @ts-ignore
      window.ProgressAdmin.reset('Test', 'move');
      return {
        mode: before.mode, hasData: before.hasData, total: before.total,
        after: JSON.parse(localStorage.getItem('zs_move_' + key)).steps
      };
    }, KEY);

    expect(info.mode).toBe('reset');
    expect(info.hasData).toBe(true);
    expect(info.total).toBe(0);
    expect(info.after).toBeUndefined();
  });
});
