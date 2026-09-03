// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

test.describe('Trophy Room', () => {

  test('badges light up for the six apps that used to score zero', async ({ page }) => {
    await injectMockProfile(page);
    await page.addInitScript((key) => {
      localStorage.setItem('zs_money_' + key, JSON.stringify({ clp: { identify: { stars: 3 } } }));
      localStorage.setItem('zs_invest_' + key, JSON.stringify({ bestStars: 3 }));
      localStorage.setItem('zs_bible_' + key, JSON.stringify({ storyStars: { creation: 3 } }));
      localStorage.setItem('zs_civics_' + key, JSON.stringify({ branches: ['exec'], lawCompleted: true }));
      localStorage.setItem('zs_codecadet_' + key, JSON.stringify({ 'w1-1': { stars: 3 } }));
      localStorage.setItem('zs_vocab_' + key, JSON.stringify({ matchStars: 3, builds: [0] }));
    }, KEY);

    await page.goto('/trophy-room.html', { waitUntil: 'domcontentloaded' });
    // The PWA service worker reloads the page once when it first takes
    // control; wait that out before reading from the page.
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });
    await page.waitForFunction(() => typeof window.getPlayerStats === 'function');

    for (const name of ['Money Master', 'Invest Quest', 'Bible Explorer',
                        'Civics Lab', 'Code Cadet', 'Vocabulario Vivo']) {
      await expect(page.getByText(name, { exact: false }).first(),
        name + ' has a badge').toBeVisible({ timeout: 15000 });
    }

    // And those stars reach the rank the Trophy Room reports.
    const total = await page.evaluate(() => window.getPlayerStats('Test').totalStars);
    expect(total).toBe(3 + 3 + 3 + 2 + 3 + 4);
  });
});
