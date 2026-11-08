// @ts-check
// "Share the apps" in Parents Corner: the device's share sheet where it
// exists, otherwise the link is copied.
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// No service worker: its first-visit reload can land mid-test.
test.use({ serviceWorkers: 'block' });

async function open(page, setup) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.addInitScript(setup);
  await page.goto('/');
  await page.waitForFunction(() => !!window.ZsDialog && typeof window.openParentsCorner === 'function');
  await page.evaluate(() => window.openParentsCorner());
}

test.describe('Share the apps', () => {
  test('opens the share sheet with the link to the apps', async ({ page }) => {
    await open(page, () => {
      // @ts-ignore
      window.__shared = [];
      // @ts-ignore
      navigator.share = async (d) => { window.__shared.push(d); };
    });
    await page.getByRole('button', { name: /Share the apps/ }).click();
    // @ts-ignore
    const shared = await page.evaluate(() => window.__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toBe('http://127.0.0.1:8080/');
    expect(shared[0].title).toBe('Zavala Serra Apps');
  });

  test('copies the link when there is no share sheet', async ({ page }) => {
    await open(page, () => {
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
    expect(await page.evaluate(() => window.__copied)).toEqual(['http://127.0.0.1:8080/']);
  });

  test('closing the share sheet does not copy anything', async ({ page }) => {
    await open(page, () => {
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
    await open(page, () => {
      // @ts-ignore
      delete navigator.share;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => { throw new Error('denied'); } }
      });
    });
    await page.getByRole('button', { name: /Share the apps/ }).click();
    await expect(page.locator('.zsd-message')).toHaveText('http://127.0.0.1:8080/');
  });
});
