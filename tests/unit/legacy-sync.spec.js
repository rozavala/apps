// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

test.describe('adopted progress vs the cloud', () => {

  test.beforeEach(async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    await page.waitForFunction(() => !!window.adoptLegacyAppKey && !!window.CloudSync);
  });

  test('an adopted record is stamped fresh so a pull cannot outrank it', async ({ page }) => {
    const stamped = await page.evaluate((key) => {
      localStorage.setItem('world' + key, JSON.stringify({ visited: ['chile', 'peru'], totalStars: 2 }));
      localStorage.removeItem('zs_world_' + key);
      // @ts-ignore
      window.adoptLegacyAppKey('world', 'zs_world_');
      return JSON.parse(localStorage.getItem('zs_world_' + key));
    }, KEY);

    // Legacy keys were never in CloudSync's KEY_MAP, so the blob they
    // carry has never been stamped. Without a stamp it reads as epoch 0
    // and loses to anything the server holds.
    expect(stamped.visited).toEqual(['chile', 'peru']);
    expect(typeof stamped._syncedAt, 'adopted record carries a timestamp').toBe('number');
    expect(stamped._syncedAt).toBeGreaterThan(Date.now() - 60000);
  });

  test('a stale empty record on the server cannot wipe adopted progress', async ({ page }) => {
    // The exact sequence that hit World Explorer: a Progress Manager
    // reset wrote {_syncedAt} to the new key and pushed that husk to
    // the server, while the real progress still sat on the legacy key.
    const after = await page.evaluate(async (key) => {
      const husk = { _syncedAt: new Date().toISOString() };
      // @ts-ignore
      window.fetch = async () => ({ ok: true, status: 200, json: async () => husk });
      // @ts-ignore
      window.CloudSync.online = true;

      localStorage.setItem('world' + key, JSON.stringify({ visited: ['chile', 'peru'], totalStars: 2 }));
      localStorage.removeItem('zs_world_' + key);

      // @ts-ignore — the app's _key() adopts, then init() pulls.
      window.adoptLegacyAppKey('world', 'zs_world_');
      // @ts-ignore
      await window.CloudSync.pull('zs_world_' + key);

      return JSON.parse(localStorage.getItem('zs_world_' + key));
    }, KEY);

    expect(after.visited, 'the pull must not overwrite recovered progress').toEqual(['chile', 'peru']);
    expect(after.totalStars).toBe(2);
  });

  test('adoption keeps a recoverable copy of the old blob', async ({ page }) => {
    const out = await page.evaluate((key) => {
      const original = { visited: ['chile'], totalStars: 1 };
      localStorage.setItem('world' + key, JSON.stringify(original));
      localStorage.removeItem('zs_world_' + key);
      // @ts-ignore
      window.adoptLegacyAppKey('world', 'zs_world_');
      return {
        legacyGone: localStorage.getItem('world' + key) === null,
        archive: JSON.parse(localStorage.getItem('zs_premigration_world' + key) || 'null')
      };
    }, KEY);

    expect(out.legacyGone, 'the old key is out of the way').toBe(true);
    expect(out.archive, 'but its contents survive').toEqual({ visited: ['chile'], totalStars: 1 });
  });

  test('the archive is never restored on its own', async ({ page }) => {
    // Auto-restoring whenever the live record looks empty would quietly
    // undo a deliberate reset from Parents Corner.
    const after = await page.evaluate((key) => {
      localStorage.setItem('world' + key, JSON.stringify({ visited: ['chile'] }));
      localStorage.removeItem('zs_world_' + key);
      // @ts-ignore
      window.adoptLegacyAppKey('world', 'zs_world_');
      // @ts-ignore  a parent then resets the app on purpose
      window.ProgressAdmin.reset('Test', 'world');
      // @ts-ignore  and the app reads its key again
      window.adoptLegacyAppKey('world', 'zs_world_');
      return JSON.parse(localStorage.getItem('zs_world_' + key));
    }, KEY);

    expect(after.visited, 'the reset stands').toBeUndefined();
  });
});