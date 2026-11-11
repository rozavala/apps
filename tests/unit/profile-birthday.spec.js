// @ts-check
// An optional birthday (with the year) on a profile: the age then follows it,
// going up by itself on the birthday and working for grown-ups too. Without
// one, the age picked by hand is kept, as before. Fictional profiles only.
const { test, expect } = require('@playwright/test');

// Dates are worked out in the page, in its time zone (the tests run on Pacific time), not the test runner's.
const yearsAgo = (page, n, shift = 0) => page.evaluate(([n, shift]) => {
  const d = new Date(); d.setFullYear(d.getFullYear() - n); d.setDate(d.getDate() + shift);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}, [n, shift]);

async function open(page, profiles) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript((profiles) => {
    if (localStorage.getItem('zs_profiles')) return;
    const ago = (n, shift) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); d.setDate(d.getDate() + shift); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    profiles.forEach(p => { if (p.bdayAgo) { p.birthday = ago(p.bdayAgo[0], p.bdayAgo[1]); delete p.bdayAgo; } });
    localStorage.setItem('zs_profiles', JSON.stringify(profiles));
    localStorage.setItem('zs_active_user', JSON.stringify(profiles[0]));
  }, profiles);
  await page.goto('/');
  await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active'));
}

test.describe('Profile birthdays', () => {
  test('ageFromBirthday counts whole years, turning over on the day itself', async ({ page }) => {
    await open(page, [{ name: 'Test', color: 'blue', age: 8, avatar: '🦊' }]);
    const r = await page.evaluate(() => {
      const now = new Date(2026, 10, 11);
      // @ts-ignore
      return [ageFromBirthday('2016-11-11', now), ageFromBirthday('2016-11-12', now), ageFromBirthday('1985-02-28', now),
        // @ts-ignore
        ageFromBirthday('2027-01-01', now), ageFromBirthday('not a date', now), ageFromBirthday('', now), isBirthdayToday({ birthday: '2019-11-11' }, now)];
    });
    expect(r).toEqual([10, 9, 41, null, null, null, true]);
  });

  test('a stored birthday overrides the hand-picked age, for kids and grown-ups', async ({ page }) => {
    await open(page, [
      { name: 'Kid', color: 'blue', age: 8, avatar: '🦊', bdayAgo: [9, 0] },        // turned 9 today
      { name: 'Kid2', color: 'blue', age: 8, avatar: '🐱', bdayAgo: [9, 1] },    // turns 9 tomorrow
      { name: 'Grown', color: 'red', age: 11, avatar: '🦁', birthday: '1985-01-15' },
      { name: 'Plain', color: 'red', age: 6, avatar: '🐸' }
    ]);
    const ages = await page.evaluate(() => getProfiles().map(p => p.age));
    const grown = await page.evaluate(() => new Date().getFullYear() - 1985 - (new Date() < new Date(new Date().getFullYear(), 0, 15) ? 1 : 0));
    expect(ages).toEqual([9, 8, grown, 6]);
    expect(await page.evaluate(() => getActiveUser().age)).toBe(9);
    // @ts-ignore
    expect(await page.evaluate(() => getAgeTier())).toBe('advanced');
  });

  test('the profile editor saves a birthday, shows the age it gives, and a picked age clears it', async ({ page }) => {
    await open(page, [{ name: 'Test', color: 'blue', age: 8, avatar: '🦊' }]);
    await page.evaluate(() => { /** @type {any} */ (window).openEditModal(0); });
    await expect(page.locator('#edit-modal')).toHaveClass(/active/);
    const b10 = await yearsAgo(page, 10, -3);
    await page.fill('#edit-birthday', b10);
    await expect(page.locator('#edit-birthday-hint')).toContainText('Age now: 10');
    await expect(page.locator('#edit-age-picker .age-option.selected')).toHaveText('10');
    await page.locator('#edit-modal .btn-create').click();
    let p = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_profiles'))[0]);
    expect(p).toMatchObject({ age: 10, birthday: b10 });

    // a grown-up's birthday lights "11+"
    await page.evaluate(() => { /** @type {any} */ (window).openEditModal(0); });
    await expect(page.locator('#edit-birthday')).toHaveValue(b10);
    await page.fill('#edit-birthday', '1988-06-02');
    await expect(page.locator('#edit-age-picker .age-option.selected')).toHaveText('11+');
    // picking an age by hand drops the birthday
    await page.locator('#edit-age-picker .age-option', { hasText: /^7$/ }).click();
    await expect(page.locator('#edit-birthday')).toHaveValue('');
    await page.locator('#edit-modal .btn-create').click();
    p = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_profiles'))[0]);
    expect(p.age).toBe(7);
    expect(p.birthday).toBeUndefined();
  });

  test('a new profile can be made from a birthday alone', async ({ page }) => {
    await open(page, [{ name: 'Test', color: 'blue', age: 8, avatar: '🦊' }]);
    await page.evaluate(() => { /** @type {any} */ (window).openModal(); });
    await page.fill('#new-name', 'Nueva');
    const b6 = await yearsAgo(page, 6, -40);
    await page.fill('#new-birthday', b6);
    await expect(page.locator('#age-picker .age-option.selected')).toHaveText('6');
    await page.locator('#add-modal .btn-create').click();
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_profiles')).find(x => x.name === 'Nueva'));
    expect(p).toMatchObject({ age: 6, birthday: b6 });
  });

  test('a future date is not taken', async ({ page }) => {
    await open(page, [{ name: 'Test', color: 'blue', age: 8, avatar: '🦊' }]);
    await page.evaluate(() => { /** @type {any} */ (window).openEditModal(0); });
    await page.fill('#edit-birthday', await yearsAgo(page, 0, 5));
    await expect(page.locator('#edit-birthday-hint')).toContainText('not valid');
    await page.locator('#edit-modal .btn-create').click();
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_profiles'))[0]);
    expect(p.birthday).toBeUndefined();
    expect(p.age).toBe(8);
  });
});
