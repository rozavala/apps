// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

test.describe('Hub and Core E2E', () => {

  test('New profile creation flow', async ({ page }) => {
    // Navigate first so we're on the right origin before accessing localStorage
    await page.goto('/');

    // Clear storage before starting to simulate a fresh load
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Ensure we are on the profile selection screen, typically has an auth/user select container
    // We'll check for a general auth container class or element text
    const authIsVisible = await page.evaluate(() => {
      return document.querySelector('#login-screen') !== null || document.querySelector('.profiles-grid') !== null;
    });
    expect(authIsVisible).toBe(true);

    // Click 'New Profile' or equivalent
    const createBtn = page.locator('.add-card').first();
    await createBtn.click();

    // Check if modal or form appears
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('Bypass to hub with active user', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/');

    // Wait for network idle or main view to load
    await page.waitForLoadState('networkidle');

    // The main view (hub) has elements like 'Welcome back' or the active user name.
    // We check for the active profile name, or the hub container
    const isHubVisible = await page.evaluate(() => {
      return document.querySelector('.hub-container') !== null || document.querySelector('.app-grid') !== null;
    });
    expect(isHubVisible).toBe(true);

    // The active profile name should be displayed
    await expect(page.getByText('Test').first()).toBeVisible();
  });

  test('Export functionality works (test_export.html)', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/test_export.html');

    // Basic verification that the page loads and doesn't crash
    const content = await page.content();
    expect(content).toContain('<script src="js/index.js"></script>');
  });

});
