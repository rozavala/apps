// @ts-check

/**
 * Standard test profile used across tests.
 */
const TEST_PROFILE = {
  name: 'Test',
  color: 'blue',
  age: 8,
  avatar: '🦊'
};

/**
 * Injects a mock profile and sets it as active to bypass the hub's profile selection.
 * @param {import('@playwright/test').Page} page
 */
async function injectMockProfile(page) {
  await page.addInitScript((profile) => {
    localStorage.setItem('zs_profiles', JSON.stringify([profile]));
    localStorage.setItem('zs_active_user', JSON.stringify(profile));
  }, TEST_PROFILE);
}

/**
 * Clears localStorage.
 * @param {import('@playwright/test').Page} page
 */
async function clearStorage(page) {
  await page.evaluate(() => localStorage.clear());
}

module.exports = {
  TEST_PROFILE,
  injectMockProfile,
  clearStorage,
};
