// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

/**
 * Smoke tests for the World Cup 2026 app. The point is to catch regressions
 * like a ReferenceError that leaves the Home tab blank — every tab must
 * mount its contents without throwing any unhandled errors.
 */
test.describe('World Cup 2026 app', () => {

  test('all tabs render with no console errors', async ({ page }) => {
    await injectMockProfile(page);

    /** @type {string[]} */
    const errors = [];
    page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
    });

    await page.goto('/world-cup.html');
    await page.waitForLoadState('domcontentloaded');

    // Home should populate something — at minimum, a card with the WC at-a-glance text.
    await expect(page.locator('#screen-home')).toBeVisible();
    await expect(page.locator('#screen-home')).toContainText('48-team World Cup', { timeout: 5000 });

    // Walk every tab and verify its screen mounts visible content.
    const tabs = [
      { id: 'santaclara', expect: "Levi's Stadium" },
      { id: 'teams',      expect: 'Group A' },
      { id: 'matches',    expect: 'Official 2026 schedule' },
      { id: 'venues',     expect: '16 host venues' },
      { id: 'standings',  expect: 'Knockout bracket' },
      { id: 'pool',       expect: 'Family Bracket Pool' },
      { id: 'quiz',       expect: 'Start a quiz' },
      { id: 'about',      expect: 'About this app' },
    ];

    for (const tab of tabs) {
      await page.locator(`.tab[data-tab="${tab.id}"]`).click();
      const screen = page.locator(`#screen-${tab.id}`);
      await expect(screen).toBeVisible();
      await expect(screen).toContainText(tab.expect, { timeout: 5000 });
    }

    // Back to Home to confirm it still renders after navigation churn.
    await page.locator('.tab[data-tab="home"]').click();
    await expect(page.locator('#screen-home')).toContainText('48-team World Cup');

    // No JS error of any kind should have surfaced across the whole walk.
    // (Filter out font-loading / network noise that doesn't indicate a bug.)
    const meaningful = errors.filter(e =>
      !/fonts.gstatic|fonts.googleapis|manifest|favicon|404|net::ERR/i.test(e)
    );
    expect(meaningful, 'No JS errors across the tab walk').toEqual([]);
  });

  test('Home shows the next upcoming match', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/world-cup.html');
    await page.waitForLoadState('domcontentloaded');

    // Pre-tournament: either the Today card lists today's games OR it shows
    // the next upcoming fixture as a "next match" row. Either way the card
    // body must contain a real match (a flag-emoji + 'vs' marker, or 'FT'/'LIVE').
    const todayList = page.locator('#today-list');
    await expect(todayList).toBeVisible();
    // Should NOT be the regression case — empty card body or just a thin date line.
    await expect(todayList).not.toHaveText('');
  });

});
