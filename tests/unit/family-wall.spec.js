// @ts-check
const { test, expect } = require('@playwright/test');

// Three kids with ages out of birth order, so the eldest-first sort has
// something real to do.
const KIDS = [
  { name: 'Mid',     color: '#10B981', age: 8,  avatar: '🐸' },
  { name: 'Young',   color: '#EF4444', age: 5,  avatar: '🐰' },
  { name: 'Eldest',  color: '#7C3AED', age: 11, avatar: '🦊' }
];

test.describe('Family Wall — routines, order and Summer Quest', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((kids) => {
      localStorage.setItem('zs_profiles', JSON.stringify(kids));
      localStorage.setItem('zs_active_user', JSON.stringify(kids[0]));
    }, KIDS);
    await page.goto('/family.html');
    await page.waitForLoadState('networkidle');
  });

  test('routines.js: ships morning, afternoon and night checklists', async ({ page }) => {
    const ids = await page.evaluate(() => window.Routines.ROUTINE_IDS);
    expect(ids).toEqual(['morning', 'afternoon', 'evening']);

    const tpls = await page.evaluate(() => window.Routines.getTemplates('Eldest'));
    expect(tpls.morning.length).toBeGreaterThan(0);
    expect(tpls.afternoon.length).toBeGreaterThan(0);
    expect(tpls.evening.length).toBeGreaterThan(0);
  });

  test('routines.js: each kid keeps their own afternoon list', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.Routines.setTemplate('afternoon', [{ id: 'piano', label: 'Piano' }], 'Eldest');
      return {
        eldest: window.Routines.getTemplates('Eldest').afternoon,
        young: window.Routines.getTemplates('Young').afternoon
      };
    });
    expect(result.eldest).toHaveLength(1);
    expect(result.eldest[0].label).toBe('Piano');
    // The other kid still has the defaults — edits don't leak sideways.
    expect(result.young.length).toBeGreaterThan(1);
  });

  test('routines.js: a streak needs all three routines done', async ({ page }) => {
    const streaks = await page.evaluate(() => {
      const tick = (which) => {
        window.Routines.getTemplates('Young')[which].forEach(function(it) {
          window.Routines.toggleFor('Young', which, it.id);
        });
      };
      tick('morning');
      tick('evening');
      const beforeAfternoon = window.Routines.getStatusFor('Young').streak;
      tick('afternoon');
      const after = window.Routines.getStatusFor('Young');
      return { beforeAfternoon, after: after.streak, complete: after.afternoon.complete };
    });
    expect(streaks.beforeAfternoon).toBe(0);
    expect(streaks.after).toBe(1);
    expect(streaks.complete).toBe(true);
  });

  test('the wall lists kids from eldest to youngest', async ({ page }) => {
    const names = await page.locator('.fw-card-routines .fw-r-kid-name').allTextContents();
    expect(names).toEqual(['Eldest', 'Mid', 'Young']);
  });

  test('the routine tabs switch which checklist is on show', async ({ page }) => {
    await page.locator('.fw-r-tab', { hasText: 'Afternoon' }).click();
    await expect(page.locator('.fw-r-tab.active')).toHaveText(/Afternoon/);
    await expect(page.locator('.fw-r-section-label').first()).toHaveText(/Afternoon/);
  });

  test('Summer Quest hides without losing the list, and comes back', async ({ page }) => {
    await page.evaluate(() => window.SummerTodos.addItem('Build a sandcastle'));
    await page.evaluate(() => window.FamilyWall.paint());
    await expect(page.locator('.fw-card-summer')).toBeVisible();

    // Hiding is parent-gated (default PIN 1234).
    await page.locator('.fw-card-summer .fw-card-action').click();
    await page.locator('#fw-pin-input').fill('1234');
    await page.locator('#fw-pin-modal button[type="submit"]').click();

    await expect(page.locator('.fw-card-summer')).toHaveCount(0);
    const stored = await page.evaluate(() => window.SummerTodos.getItems());
    expect(stored).toHaveLength(1);
    expect(stored[0].label).toBe('Build a sandcastle');

    await page.locator('.fw-quick button', { hasText: 'Show Summer Quest' }).click();
    await expect(page.locator('.fw-card-summer')).toBeVisible();
    await expect(page.locator('.fw-sq-label').first()).toContainText('Build a sandcastle');
  });

  test('a parent can edit one kid\'s checklists from the wall', async ({ page }) => {
    await page.locator('.fw-r-kid', { hasText: 'Mid' }).locator('.fw-r-edit').click();
    await page.locator('#fw-pin-input').fill('1234');
    await page.locator('#fw-pin-modal button[type="submit"]').click();

    await expect(page.locator('#fw-re-title')).toContainText('Mid');
    await page.locator('#fw-re-add-afternoon').fill('Feed the dog 🐶');
    await page.locator('.fw-re-block', { hasText: 'Afternoon' }).locator('.fw-re-add-btn').click();

    const tpls = await page.evaluate(() => ({
      mid: window.Routines.getTemplates('Mid').afternoon.map(function(i) { return i.label; }),
      eldest: window.Routines.getTemplates('Eldest').afternoon.map(function(i) { return i.label; })
    }));
    expect(tpls.mid).toContain('Feed the dog 🐶');
    expect(tpls.eldest).not.toContain('Feed the dog 🐶');
  });
  test('routines.js: ticks for tasks no longer on the list stop counting', async ({ page }) => {
    const status = await page.evaluate(() => {
      // Tick every default afternoon task, then replace the list.
      window.Routines.getTemplates('Young').afternoon.forEach(function(it) {
        window.Routines.toggleFor('Young', 'afternoon', it.id);
      });
      window.Routines.setTemplate('afternoon', [
        { id: 'walk_dog', label: 'Walk the dog' },
        { id: 'read_pm', label: 'Read' }
      ], 'Young');
      const s = window.Routines.getStatusFor('Young').afternoon;
      return { doneCount: s.doneCount, total: s.total, complete: s.complete };
    });
    // The five stale ticks must not read as 5/2 done.
    expect(status.doneCount).toBe(0);
    expect(status.total).toBe(2);
    expect(status.complete).toBe(false);
  });

  test('a parent can copy one list to every other kid', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await page.locator('.fw-r-kid', { hasText: 'Eldest' }).locator('.fw-r-edit').click();
    await page.locator('#fw-pin-input').fill('1234');
    await page.locator('#fw-pin-modal button[type="submit"]').click();

    await page.locator('#fw-re-add-afternoon').fill('Walk the dog 🐶');
    await page.locator('.fw-re-block', { hasText: 'Afternoon' }).locator('.fw-re-add-btn').click();
    await page.locator('.fw-re-block', { hasText: 'Afternoon' }).locator('.fw-re-apply').click();

    await expect(page.locator('.fw-re-note')).toContainText('Copied to Mid, Young');

    const after = await page.evaluate(() => {
      const labels = (kid, which) =>
        window.Routines.getTemplates(kid)[which].map(function(i) { return i.label; });
      return {
        eldestPm: labels('Eldest', 'afternoon'),
        midPm: labels('Mid', 'afternoon'),
        youngPm: labels('Young', 'afternoon'),
        // Only the afternoon list was copied — mornings are untouched.
        midAm: labels('Mid', 'morning')
      };
    });
    expect(after.midPm).toEqual(after.eldestPm);
    expect(after.youngPm).toEqual(after.eldestPm);
    expect(after.midPm).toContain('Walk the dog 🐶');
    expect(after.midAm).not.toContain('Walk the dog 🐶');
  });
});
