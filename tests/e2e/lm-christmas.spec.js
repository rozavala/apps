// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');
const LMScore = require('../../js/lm-score.js');
const LM_SONGS = require('../../js/lm-songs.js');

async function open(page, when) {
  await page.clock.setFixedTime(when);
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.goto('/little-maestro.html');
  await page.waitForFunction(() => typeof UserManager !== 'undefined' && UserManager.getCurrentUser());
}

test.describe('Little Maestro — Christmas Special', () => {

  test('every Christmas song compiles, both hands, and the new ones are always open', () => {
    const xmas = LM_SONGS.filter(s => s.christmas);
    expect(xmas.length).toBeGreaterThanOrEqual(14);
    for (const s of xmas) {
      const c = LMScore.compile(s);
      expect(c.hasRH && c.hasLH, s.title).toBe(true);
      if (s.world === 30) expect(s.alwaysUnlocked, s.title).toBe(true);
    }
    // Silent Night has the whole tune now: 24 bars of 3/4.
    const sn = LM_SONGS.find(s => s.id === 420);
    expect(sn.score.rh.split('|').length).toBe(24);
  });

  test('in December the Navidad tab and the home banner show the carols', async ({ page }) => {
    await open(page, new Date(2026, 11, 10, 10, 0, 0));
    await page.evaluate(() => { showScreen('home'); renderHomeScreen(); });
    await expect(page.locator('.home-xmas')).toContainText('Christmas Special');
    await page.locator('.home-xmas').click();
    await expect(page.locator('.qm-tab--active')).toContainText('Navidad');
    await expect(page.locator('.lib-card--xmas', { hasText: 'Joy to the World' })).toContainText('Al mundo paz');
    // New carols are open; clicking one starts its lesson.
    await page.locator('.lib-card--xmas', { hasText: 'Away in a Manger' }).click();
    await expect(page.locator('#screen-lesson')).toHaveClass(/active/);
  });

  test('out of season there is no tab or banner, but the Library has a Christmas shelf', async ({ page }) => {
    await open(page, new Date(2026, 6, 10, 10, 0, 0));
    await page.evaluate(() => { showScreen('home'); renderHomeScreen(); });
    await expect(page.locator('.home-xmas')).toHaveCount(0);
    await page.evaluate(() => { QuestMap.showTab('library'); showScreen('questmap'); });
    await expect(page.locator('.qm-tab', { hasText: 'Navidad' })).toHaveCount(0);
    await expect(page.locator('.lib-shelf-title', { hasText: 'Christmas' })).toBeVisible();
  });
});
