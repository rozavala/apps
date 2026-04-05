// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// We test a subset of representative apps for visual regression
const VISUAL_APPS = [
  'index.html',
  'math-galaxy.html',
  'art-studio.html'
];

test.describe('Visual Regression Tests', () => {

  for (const app of VISUAL_APPS) {
    test(`Visual snapshot for ${app}`, async ({ page }) => {
      await page.goto('/');
      await injectMockProfile(page);
      await page.goto(`/${app}`);

      // Wait for fonts/images to potentially load
      await page.waitForLoadState('networkidle');

      // Hide dynamic elements like timers and changing animations if they exist
      await page.addStyleTag({
        content: `
          #timer-display, .timer, #time-left, .dynamic-score, canvas {
            visibility: hidden !important;
          }
          * {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      });

      // Take a screenshot of the viewport
      await expect(page).toHaveScreenshot(`${app.replace('.html', '')}-snapshot.png`, {
        maxDiffPixelRatio: 0.1, // Allow 10% diff for flakiness
        fullPage: true
      });
    });
  }

});
