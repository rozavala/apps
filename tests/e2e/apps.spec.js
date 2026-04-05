// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

const MAJOR_APPS = [
  'little-maestro.html',
  'math-galaxy.html',
  'chess-quest.html',
  'descubre-chile.html',
  'fe-explorador.html',
  'guitar-jam.html',
  'art-studio.html',
  'sports-arena.html',
  'lab-explorer.html',
  'world-explorer.html',
  'story-explorer.html',
  'quest-adventure.html',
  'guess-quest.html'
];

test.describe('Major Apps Critical Path', () => {

  for (const app of MAJOR_APPS) {
    test(`Should load ${app} correctly`, async ({ page }) => {
      // Inject mock profile to bypass any lock screens
      await page.goto('/');
      await injectMockProfile(page);

      // Navigate to the app
      await page.goto(`/${app}`);

      // Basic checks: The page should have a body
      await expect(page.locator('body')).toBeVisible();

      // Ensure no generic "file not found" or "error" text is immediately visible
      // (Depends on exact server, but we can check the title isn't empty)
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // Usually all apps have a back button or an app container. We check for a generic UI element
      // like a button or canvas or main container or app wrapper to prove rendering happened.
      const hasUiElement = await page.evaluate(() => {
        return document.querySelectorAll('button, canvas, .app-container, .screen, .app').length > 0;
      });
      expect(hasUiElement).toBeTruthy();
    });
  }

});
