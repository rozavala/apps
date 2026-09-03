// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase(); // 'test'

// The five apps that used to save to a bare key: getUserAppKey('world')
// concatenates to `worldtest`, not `zs_world_test`.
const LEGACY = [
  { app: 'World Explorer',   legacy: 'world',   prefix: 'zs_world_' },
  { app: 'Story Explorer',   legacy: 'story',   prefix: 'zs_story_' },
  { app: 'Lab Explorer',     legacy: 'lab',     prefix: 'zs_lab_' },
  { app: 'Quest Adventure',  legacy: 'quest',   prefix: 'zs_quest_' },
  { app: 'Vacation quiz',    legacy: 'vacquiz', prefix: 'zs_vacquiz_' }
];

test.describe('legacy storage keys', () => {

  test.beforeEach(async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    await page.waitForFunction(() => !!window.adoptLegacyAppKey && !!window.ProgressAdmin);
  });

  test('adoptLegacyAppKey moves an old blob onto the prefixed key', async ({ page }) => {
    const results = await page.evaluate(({ legacy, key }) => {
      return legacy.map(({ legacy: old, prefix }) => {
        localStorage.setItem(old + key, JSON.stringify({ totalStars: 7 }));
        localStorage.removeItem(prefix + key);
        // @ts-ignore
        const moved = window.adoptLegacyAppKey(old, prefix);
        return {
          prefix: prefix,
          moved: moved,
          adopted: JSON.parse(localStorage.getItem(prefix + key) || 'null'),
          legacyGone: localStorage.getItem(old + key) === null
        };
      });
    }, { legacy: LEGACY, key: KEY });

    for (const r of results) {
      expect(r.moved, r.prefix + ' reported a move').toBe(true);
      expect(r.adopted, r.prefix + ' carries the old progress').toEqual({ totalStars: 7 });
      expect(r.legacyGone, r.prefix + ' cleaned up the old key').toBe(true);
    }
  });

  test('adoption never overwrites real progress on the new key', async ({ page }) => {
    const kept = await page.evaluate((key) => {
      localStorage.setItem('worldother', JSON.stringify({ totalStars: 1 }));
      localStorage.setItem('zs_world_other', JSON.stringify({ totalStars: 99 }));
      // @ts-ignore
      const moved = window.adoptLegacyAppKey('world', 'zs_world_', 'Other');
      return { moved, now: JSON.parse(localStorage.getItem('zs_world_other')).totalStars };
    }, KEY);

    expect(kept.moved).toBe(false);
    expect(kept.now).toBe(99);
  });

  test('adoption does replace a record left empty by a reset', async ({ page }) => {
    // Progress Manager's reset writes {_syncedAt}. That is bookkeeping,
    // not progress, so a real legacy blob should still come across.
    const after = await page.evaluate(() => {
      localStorage.setItem('worldemptied', JSON.stringify({ totalStars: 4 }));
      localStorage.setItem('zs_world_emptied', JSON.stringify({ _syncedAt: 123 }));
      // @ts-ignore
      const moved = window.adoptLegacyAppKey('world', 'zs_world_', 'Emptied');
      return { moved, now: JSON.parse(localStorage.getItem('zs_world_emptied')) };
    });

    expect(after.moved).toBe(true);
    expect(after.now.totalStars).toBe(4);
  });

  test('adoption is safe to repeat', async ({ page }) => {
    const out = await page.evaluate(() => {
      localStorage.setItem('worldrepeat', JSON.stringify({ totalStars: 2 }));
      // @ts-ignore
      const first = window.adoptLegacyAppKey('world', 'zs_world_', 'Repeat');
      localStorage.setItem('worldrepeat', JSON.stringify({ totalStars: 55 }));
      // @ts-ignore
      const second = window.adoptLegacyAppKey('world', 'zs_world_', 'Repeat');
      return { first, second, value: JSON.parse(localStorage.getItem('zs_world_repeat')).totalStars };
    });

    expect(out.first).toBe(true);
    expect(out.second, 'the new key now holds real progress — refuse').toBe(false);
    expect(out.value).toBe(2);
  });

  test('Progress Manager sees progress still sitting on a legacy key', async ({ page }) => {
    // The kid played World Explorer before the fix; the parent opens
    // Parents Corner before the kid next opens the app.
    const state = await page.evaluate((key) => {
      // @ts-ignore
      const units = window.ZSProgressCatalog.world;
      localStorage.removeItem('zs_world_' + key);
      localStorage.setItem('world' + key, JSON.stringify({
        visited: units.slice(0, 3).map(u => u.i), totalStars: 3
      }));
      // @ts-ignore
      return window.ProgressAdmin.getState('Test', 'world');
    }, KEY);

    expect(state.hasData).toBe(true);
    expect(state.doneCount).toBe(3);
  });

  test('Progress Manager can reset World Explorer', async ({ page }) => {
    const after = await page.evaluate((key) => {
      // @ts-ignore
      const units = window.ZSProgressCatalog.world;
      localStorage.setItem('world' + key, JSON.stringify({
        visited: units.slice(0, 5).map(u => u.i), totalStars: 5
      }));
      localStorage.removeItem('zs_world_' + key);
      // @ts-ignore
      window.ProgressAdmin.reset('Test', 'world');
      // @ts-ignore
      const state = window.ProgressAdmin.getState('Test', 'world');
      return {
        doneCount: state.doneCount,
        legacyGone: localStorage.getItem('world' + key) === null,
        record: JSON.parse(localStorage.getItem('zs_world_' + key))
      };
    }, KEY);

    expect(after.doneCount).toBe(0);
    expect(after.legacyGone, 'the old key cannot resurrect the progress').toBe(true);
    expect(after.record.visited).toBeUndefined();
  });

  test('the five apps and the suite agree on one key per app', async ({ page }) => {
    // getPlayerStats, CloudSync's KEY_MAP and ProgressAdmin all read the
    // zs_ form; this is what used to make those apps invisible to them.
    const stars = await page.evaluate((key) => {
      localStorage.setItem('zs_world_' + key, JSON.stringify({ totalStars: 12 }));
      localStorage.setItem('zs_story_' + key, JSON.stringify({ totalStars: 8 }));
      // @ts-ignore
      const s = window.getPlayerStats('Test');
      return { total: s.totalStars, world: s.appStats.world.totalStars, story: s.appStats.story.totalStars };
    }, KEY);

    expect(stars.world).toBe(12);
    expect(stars.story).toBe(8);
    expect(stars.total).toBeGreaterThanOrEqual(20);
  });
});
