// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

// Each app, the bare key it used to save to, and a blob in its own shape.
const APPS = [
  { page: 'world-explorer.html',  legacy: 'world', prefix: 'zs_world_', seed: { visited: ['chile'], totalStars: 1 } },
  { page: 'story-explorer.html',  legacy: 'story', prefix: 'zs_story_', seed: { storiesRead: ['ocean_dive'], totalStars: 3 } },
  { page: 'lab-explorer.html',    legacy: 'lab',   prefix: 'zs_lab_',   seed: { colors: { completed: 1, stars: 3 }, totalStars: 3 } },
  { page: 'quest-adventure.html', legacy: 'quest', prefix: 'zs_quest_', seed: { visited: ['chile'] } }
];

test.describe('legacy storage keys, in the real apps', () => {

  for (const app of APPS) {
    test(`${app.page} adopts its old key and saves to the prefixed one`, async ({ page }) => {
      await injectMockProfile(page);
      await page.addInitScript(({ legacy, key, seed, prefix }) => {
        localStorage.setItem(legacy + key, JSON.stringify(seed));
        localStorage.removeItem(prefix + key);
      }, { legacy: app.legacy, key: KEY, seed: app.seed, prefix: app.prefix });

      await page.goto('/' + app.page, { waitUntil: 'domcontentloaded' });
      // The app reads its key during init; give it a beat to boot.
      await page.waitForFunction(
        ({ prefix, key }) => localStorage.getItem(prefix + key) !== null,
        { prefix: app.prefix, key: KEY },
        { timeout: 15000 }
      );

      const after = await page.evaluate(({ prefix, legacy, key }) => ({
        adopted: JSON.parse(localStorage.getItem(prefix + key)),
        legacyGone: localStorage.getItem(legacy + key) === null
      }), { prefix: app.prefix, legacy: app.legacy, key: KEY });

      expect(after.adopted).toMatchObject(app.seed);
      expect(after.legacyGone, 'the old key is cleaned up').toBe(true);
    });
  }
});
