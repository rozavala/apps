// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

test.describe('Parents Corner → Progress Manager', () => {

  test.beforeEach(async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    // The PWA service worker reloads the hub once, the first time it
    // takes control. Wait that out, or it tears down the overlay
    // mid-test.
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });
    await page.waitForFunction(() => !!window.ProgressAdmin);
    // Accept the confirm() the Set and Reset buttons raise.
    page.on('dialog', d => d.accept());
  });

  test('a grown-up can set which song a kid is practising', async ({ page }) => {
    await page.evaluate(() => window.openProgressManager());
    await expect(page.locator('#progress-overlay')).toHaveClass(/active/);

    const card = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await expect(card).toBeVisible();
    await expect(card.locator('.pg-status')).toContainText('0 of');

    // Pick a song a few worlds in and apply it.
    const target = await page.evaluate(() => window.ZSProgressCatalog.piano[30]);
    await card.locator('select').selectOption('30');
    await card.getByRole('button', { name: 'Set', exact: true }).click();

    await expect(card.locator('.pg-status')).toContainText('30 of');
    await expect(card.locator('.pg-status')).toContainText(target.l);

    // …and the saved blob says the same thing.
    const saved = await page.evaluate((key) => {
      const data = JSON.parse(localStorage.getItem('littlemaestro_' + key) || '{}');
      return { unlocked: data.progress[String(30)], progress: data.progress };
    }, KEY);
    expect(saved.progress.completedSongs).toHaveLength(30);
    expect(saved.progress[String(target.i)].unlocked).toBe(true);
  });

  test('Little Maestro agrees about which song is current', async ({ page }) => {
    test.slow(); // little-maestro.html ships its own engine + VexFlow

    const target = await page.evaluate(() => {
      // @ts-ignore
      window.ProgressAdmin.setPosition('Test', 'piano', 30);
      // @ts-ignore
      return window.ZSProgressCatalog.piano[30];
    });

    await page.goto('/little-maestro.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.currentSongFrom === 'function');
    const current = await page.evaluate((key) => {
      const data = JSON.parse(localStorage.getItem('littlemaestro_' + key) || '{}');
      // @ts-ignore
      return window.currentSongFrom(data.progress || {});
    }, KEY);

    expect(current.id).toBe(target.i);
    expect(current.title).toBe(target.l);
  });

  test('reset clears one app and leaves the others alone', async ({ page }) => {
    await page.evaluate(() => {
      window.ProgressAdmin.setPosition('Test', 'piano', 5);
      window.ProgressAdmin.setPosition('Test', 'codecadet', 4);
      window.openProgressManager();
    });

    const piano = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await piano.getByRole('button', { name: 'Reset' }).click();

    await expect(piano.locator('.pg-status')).toContainText('0 of');
    const cadet = page.locator('.pg-app-card').filter({ hasText: 'Code Cadet' });
    await expect(cadet.locator('.pg-status')).toContainText('4 of');
  });

  test('switching kid tabs shows that kid’s own progress', async ({ page }) => {
    await page.evaluate(() => {
      const profiles = JSON.parse(localStorage.getItem('zs_profiles'));
      profiles.push({ name: 'Segundo', color: 'red', age: 6, avatar: '🐸' });
      localStorage.setItem('zs_profiles', JSON.stringify(profiles));
      window._profilesCached = false;
      window.ProgressAdmin.setPosition('Test', 'piano', 7);
      window.openProgressManager();
    });

    const piano = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await expect(piano.locator('.pg-status')).toContainText('7 of');

    await page.getByRole('button', { name: /Segundo/ }).click();
    await expect(piano.locator('.pg-status')).toContainText('0 of');
  });
});
