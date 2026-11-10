// @ts-check
// "Share the apps" in Parents Corner: the device's share sheet where it
// exists, otherwise the link is copied.
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// No service worker: its first-visit reload can land mid-test.
test.use({ serviceWorkers: 'block' });

// The link under test is the page's own origin + "/", whatever port the
// test server runs on (baseURL comes from playwright.config.js).
async function open(page, setup) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.addInitScript(setup);
  await page.goto('/');
  const appsUrl = new URL('/', page.url()).href;
  await page.waitForFunction(() => !!window.ZsDialog && typeof window.openParentsCorner === 'function');
  await page.evaluate(() => window.openParentsCorner());
  return appsUrl;
}

test.describe('Share the apps', () => {
  test('opens the share sheet with the link to the apps', async ({ page }) => {
    const APPS_URL = await open(page, () => {
      // @ts-ignore
      window.__shared = [];
      // @ts-ignore
      navigator.share = async (d) => { window.__shared.push(d); };
    });
    await page.getByRole('button', { name: /Share the apps/ }).click();
    // @ts-ignore
    const shared = await page.evaluate(() => window.__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toBe(APPS_URL);
    expect(shared[0].title).toBe('Zavala Serra Apps');
  });

  test('copies the link when there is no share sheet', async ({ page }) => {
    const APPS_URL = await open(page, () => {
      // @ts-ignore
      delete navigator.share;
      // @ts-ignore
      window.__copied = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        // @ts-ignore
        value: { writeText: async (t) => { window.__copied.push(t); } }
      });
    });
    await page.getByRole('button', { name: /Share the apps/ }).click();
    await expect(page.locator('.zsd-toast--on')).toContainText('Link copied');
    // @ts-ignore
    expect(await page.evaluate(() => window.__copied)).toEqual([APPS_URL]);
  });

  test('closing the share sheet does not copy anything', async ({ page }) => {
    const APPS_URL = await open(page, () => {
      // @ts-ignore
      window.__copied = [];
      // @ts-ignore
      navigator.share = async () => { throw new DOMException('cancelled', 'AbortError'); };
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        // @ts-ignore
        value: { writeText: async (t) => { window.__copied.push(t); } }
      });
    });
    await page.getByRole('button', { name: /Share the apps/ }).click();
    await page.waitForTimeout(300);
    // @ts-ignore
    expect(await page.evaluate(() => window.__copied)).toEqual([]);
    await expect(page.locator('.zsd-overlay')).toHaveCount(0);
  });

  test('shows the link in a dialog when the browser refuses to copy it', async ({ page }) => {
    const APPS_URL = await open(page, () => {
      // @ts-ignore
      delete navigator.share;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => { throw new Error('denied'); } }
      });
    });
    await page.getByRole('button', { name: /Share the apps/ }).click();
    await expect(page.locator('.zsd-message')).toHaveText(APPS_URL);
  });
});
