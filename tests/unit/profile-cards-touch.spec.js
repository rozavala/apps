// @ts-check
// The profile cards' hover look (a purple border and a long shadow) is for a
// mouse only: on an iPad, Safari keeps :hover on after a tap, which left
// a card with that long shadow until the next tap. Fictional profiles only.
const { test, expect, devices } = require('@playwright/test');

const PROFILES = [{ name: 'Test', color: '#6366F1', age: 8, avatar: '🦊' }, { name: 'Otro', color: '#EF4444', age: 6, avatar: '🐸' }];

async function open(page) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript((p) => localStorage.setItem('zs_profiles', JSON.stringify(p)), PROFILES);
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('.profile-card').length > 2);
  // let the cards' pop-in animation finish
  await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running' || !(/** @type {any} */ (a.effect)).target.closest('.profile-card')));
}
const look = (page) => page.$eval('.profile-card', (c) => {
  const s = getComputedStyle(c), b = getComputedStyle(/** @type {Element} */ (c.querySelector('.profile-edit-btn')));
  return { transform: s.transform, shadow: s.boxShadow, border: s.borderColor, btn: b.transform, btnOpacity: b.opacity };
});

test.describe('touch iPad', () => {
  test.use({ viewport: devices['iPad Pro 11 landscape'].viewport, hasTouch: true, isMobile: true });
  test('a hovered card stays as it is, and the edit button stays round and visible', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
    const before = await look(page);
    await page.hover('.profile-card');
    await page.waitForTimeout(500);
    expect(await look(page)).toEqual(before);
    expect(before).toMatchObject({ btn: 'matrix(1, 0, 0, 1, 0, 0)', btnOpacity: '1' });
    const box = await page.locator('.profile-edit-btn').first().boundingBox();
    expect(box && Math.round(box.width)).toBe(28);
    expect(box && Math.round(box.height)).toBe(28);
  });
});

test.describe('computer with a mouse', () => {
  test('a hovered card still lifts', async ({ page }) => {
    await open(page);
    test.skip(!(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)), 'this browser reports no mouse');
    const before = await look(page);
    await page.hover('.profile-card');
    await page.waitForTimeout(600);
    const after = await look(page);
    expect(after.shadow).not.toBe(before.shadow);
    expect(after.border).not.toBe(before.border);
  });
});
