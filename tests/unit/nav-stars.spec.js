// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

// nav.js put "⭐ 0" in every app's top bar for as long as it existed:
// it called getTotalStars(), which auth.js never defined.
test('the top-bar star counter shows the kid\'s real total', async ({ page }) => {
  await injectMockProfile(page);
  await page.addInitScript((key) => {
    localStorage.setItem('zs_circuit_' + key, JSON.stringify({ levels: { loop: { stars: 3 }, switch: { stars: 2 } } }));
    localStorage.setItem('zs_secretos_' + key, JSON.stringify({ missions: { m01: { stars: 1 } } }));
  }, KEY);
  await page.goto('/money-master.html');

  await expect(page.locator('#zs-star-count')).toHaveText('⭐ 6');
  const same = await page.evaluate(() =>
    // @ts-ignore
    window.getTotalStars() === window.getPlayerStats().totalStars);
  expect(same).toBe(true);
});
