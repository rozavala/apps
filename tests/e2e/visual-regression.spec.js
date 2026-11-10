// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// We test a subset of representative apps for visual regression
const VISUAL_APPS = [
  'index.html',
  'math-galaxy.html',
  'art-studio.html'
];

// The committed snapshots were taken with the Google Fonts webfonts loaded, so
// this spec keeps real network access (every other spec runs with external
// hosts unresolvable, see playwright.config.js).
test.use({ launchOptions: { args: [] } });
// ...but never the live sync server (see CLAUDE.md).
test.beforeEach(async ({ page }) => { await page.route(/tail57521e\.ts\.net/, r => r.abort()); });

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
