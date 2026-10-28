// @ts-check
// The iPad ISBN scanner (ZXing path) against a fake camera: a canvas
// stream that shows empty frames first, then a real EAN-13 barcode.
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// No service worker: its first-visit reload can land mid-test.
test.use({ serviceWorkers: 'block' });

const ISBN = '9780786838653';   // The Lightning Thief

async function open(page, { deny } = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.addInitScript((deny) => {
    // iPad Safari has no BarcodeDetector, so the app uses ZXing.
    // @ts-ignore
    delete window.BarcodeDetector;
    const cam = document.createElement('canvas');
    cam.width = 1280; cam.height = 720;
    const ctx = cam.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cam.width, cam.height);
    // @ts-ignore
    window.__cam = { cam, ctx, requests: 0 };
    navigator.mediaDevices.getUserMedia = async () => {
      // @ts-ignore
      window.__cam.requests++;
      if (deny) throw new DOMException('Permission denied', 'NotAllowedError');
      return cam.captureStream(15);
    };
    // Keep the stream producing frames.
    setInterval(() => { ctx.fillStyle = 'rgba(255,255,255,0.01)'; ctx.fillRect(0, 0, 1, 1); }, 60);
  }, !!deny);
  await page.goto('/book-movie-check.html');
  await page.waitForFunction(() => typeof BMC !== 'undefined' && typeof ZXing !== 'undefined');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    // @ts-ignore
    window.__lookups = [];
    window.fetch = async (url, opts) => {
      // @ts-ignore
      if (String(url).endsWith('/api/media/lookup')) window.__lookups.push(JSON.parse(opts.body));
      return { ok: true, status: 200, json: async () => ({ candidates: [] }) };
    };
  });
}

// Draw an EAN-13 barcode on the fake camera (standard bar patterns; the
// vendored ZXing build decodes EAN-13 but has no encoder for it).
async function showBarcode(page, code) {
  await page.evaluate((code) => {
    const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
    const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
    const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
    const d = code.split('').map(Number);
    let bits = '101';
    for (let i = 1; i <= 6; i++) bits += (PARITY[d[0]][i - 1] === 'L' ? L : G)[d[i]];
    bits += '01010';
    for (let i = 7; i <= 12; i++) bits += R[d[i]];
    bits += '101';
    // @ts-ignore
    const { cam, ctx } = window.__cam;
    const module = 5, height = 220;
    const x0 = (cam.width - bits.length * module) / 2, y0 = (cam.height - height) / 2;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cam.width, cam.height);
    ctx.fillStyle = '#000';
    for (let i = 0; i < bits.length; i++) if (bits[i] === '1') ctx.fillRect(x0 + i * module, y0, module, height);
  }, code);
}

test.describe('Book & Movie Check — ISBN scanner on iPad', () => {
  test('reads an ISBN after empty frames, without claiming the camera failed', async ({ page }) => {
    await open(page);
    await page.evaluate(() => BMC.scanIsbn());
    await expect(page.locator('#bmc-scan-hint')).toContainText('Apunta');
    await page.waitForTimeout(1500);                       // ~15 empty frames
    await expect(page.locator('#bmc-scan-ipad-hint')).toBeHidden();
    await showBarcode(page, ISBN);
    // @ts-ignore
    await expect.poll(() => page.evaluate(() => window.__lookups.map(l => l.isbn))).toEqual([ISBN]);
    await expect(page.locator('#bmc-scan-modal')).not.toHaveClass(/active/);
    // @ts-ignore
    expect(await page.evaluate(() => window.__cam.requests)).toBe(1);
  });

  test('a barcode that isn\'t an ISBN is ignored with a hint', async ({ page }) => {
    await open(page);
    await page.evaluate(() => BMC.scanIsbn());
    await showBarcode(page, '4006381333931');
    await expect(page.locator('#bmc-scan-hint')).toContainText('isn\'t an ISBN');
    // @ts-ignore
    expect(await page.evaluate(() => window.__lookups.length)).toBe(0);
  });

  test('a refused camera says how to allow it', async ({ page }) => {
    await open(page, { deny: true });
    await page.evaluate(() => BMC.scanIsbn());
    await expect(page.locator('#bmc-scan-ipad-hint')).toContainText('Website Settings');
  });

  test('tapping Scan twice opens the camera once', async ({ page }) => {
    await open(page);
    await page.evaluate(() => { BMC.scanIsbn(); BMC.scanIsbn(); });
    await expect(page.locator('#bmc-scan-hint')).toContainText('Apunta');
    // @ts-ignore
    expect(await page.evaluate(() => window.__cam.requests)).toBe(1);
  });
});
