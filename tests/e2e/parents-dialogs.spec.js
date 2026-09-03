// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile, TEST_PROFILE } = require('../helpers/utils');

const KEY = TEST_PROFILE.name.toLowerCase();

test.describe('Parents Corner dialogs and layering', () => {

  test.beforeEach(async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20000 });
    await page.waitForFunction(() => !!window.ProgressAdmin && !!window.ZsDialog);
    // Fail loudly if anything still reaches for a native dialog: on the
    // iPad's webview those never render and confirm() answers false.
    await page.evaluate(() => {
      window.__nativeDialogs = 0;
      window.confirm = () => { window.__nativeDialogs++; return false; };
      window.alert = () => { window.__nativeDialogs++; };
    });
  });

  test('the Progress Manager opens above Parents Corner, not behind it', async ({ page }) => {
    await page.evaluate(() => { window.openParentsCorner(); window.openProgressManager(); });
    await page.locator('.pg-app-card').first().waitFor();

    // Both panels are open; the one the parent just asked for must be
    // the one they can actually touch.
    const onTop = await page.evaluate(() => {
      const panel = document.querySelector('#progress-overlay .dash-panel');
      const r = panel.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, Math.max(2, r.y + 8));
      return {
        parentsOpen: document.getElementById('parents-overlay').classList.contains('active'),
        insideProgress: !!(hit && hit.closest('#progress-overlay')),
        progressZ: getComputedStyle(document.getElementById('progress-overlay')).zIndex,
        parentsZ: getComputedStyle(document.getElementById('parents-overlay')).zIndex
      };
    });

    expect(onTop.parentsOpen, 'Parents Corner stays open underneath').toBe(true);
    expect(onTop.insideProgress, 'the Progress Manager receives the tap').toBe(true);
    expect(Number(onTop.progressZ)).toBeGreaterThan(Number(onTop.parentsZ));
  });

  test('Set asks in the page, and acts when confirmed', async ({ page }) => {
    await page.evaluate(() => window.openProgressManager());
    const card = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await card.locator('select').selectOption('12');
    await card.getByRole('button', { name: 'Set', exact: true }).click();

    const dialog = page.locator('.zsd-overlay');
    await expect(dialog, 'an in-page dialog, not a native one').toBeVisible();
    await expect(dialog).toContainText('Set Test');

    await dialog.getByRole('button', { name: 'Set' }).click();
    await expect(card.locator('.pg-status')).toContainText('12 of');
    await expect(page.locator('.zsd-toast--on')).toBeVisible();

    expect(await page.evaluate(() => window.__nativeDialogs),
      'nothing fell back to window.confirm/alert').toBe(0);
  });

  test('Cancel leaves the progress alone', async ({ page }) => {
    await page.evaluate(() => {
      window.ProgressAdmin.setPosition('Test', 'piano', 5);
      window.openProgressManager();
    });
    const card = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await card.getByRole('button', { name: 'Reset' }).click();
    await page.locator('.zsd-overlay').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.locator('.zsd-overlay')).toHaveCount(0);
    await expect(card.locator('.pg-status')).toContainText('5 of');
  });

  test('dismissing with Escape counts as no', async ({ page }) => {
    await page.evaluate(() => {
      window.ProgressAdmin.setPosition('Test', 'piano', 4);
      window.openProgressManager();
    });
    const card = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await card.getByRole('button', { name: 'Reset' }).click();
    await page.keyboard.press('Escape');

    await expect(page.locator('.zsd-overlay')).toHaveCount(0);
    await expect(card.locator('.pg-status')).toContainText('4 of');
  });

  test('wiping every app takes two deliberate confirmations', async ({ page }) => {
    await page.evaluate(() => {
      window.ProgressAdmin.setPosition('Test', 'piano', 6);
      window.openProgressManager();
    });
    await page.getByRole('button', { name: /Reset every app/ }).click();
    await page.locator('.zsd-overlay').getByRole('button', { name: 'Erase everything' }).click();

    // Backing out of the second question must leave everything intact.
    await expect(page.locator('.zsd-overlay')).toContainText('Last chance');
    await page.locator('.zsd-overlay').getByRole('button', { name: 'Cancel' }).click();

    const card = page.locator('.pg-app-card').filter({ hasText: 'Little Maestro' });
    await expect(card.locator('.pg-status')).toContainText('6 of');
  });
});
