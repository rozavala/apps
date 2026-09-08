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

  // The app registers a service worker that reloads the page once when a
  // new version activates. Harmless in the wild, but mid-test it throws
  // away whatever the test just set up.
  test.use({ serviceWorkers: 'block' });


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
  test('sunscreen only shows when the day earns it', async ({ page }) => {
    const morningFor = (uv, maxT) => page.evaluate(([uv, maxT]) => {
      localStorage.setItem('zs_fw_weather', JSON.stringify({
        fetchedAt: Date.now(),
        payload: { daily: { uv_index_max: [uv], temperature_2m_max: [maxT] } }
      }));
      window.Routines.refreshConditions();
      return window.Routines.getStatusFor('Young').morning
        .items.map(function(i) { return i.label; }).join(' ');
    }, [uv, maxT]);

    // Grey and cold: no sunscreen chip.
    expect(await morningFor(1, 12)).not.toContain('Sunscreen');
    // High UV: back on the list.
    expect(await morningFor(9, 28)).toContain('Sunscreen');
    // Mild but hot enough on temperature alone.
    expect(await morningFor(0, 30)).toContain('Sunscreen');
    // No forecast at all — show it rather than risk a burn.
    expect(await page.evaluate(() => {
      localStorage.removeItem('zs_fw_weather');
      window.Routines.refreshConditions();
      return window.Routines.getStatusFor('Young').morning
        .items.map(function(i) { return i.label; }).join(' ');
    })).toContain('Sunscreen');
  });

  test('a hidden task is not needed to complete the routine', async ({ page }) => {
    const done = await page.evaluate(() => {
      localStorage.setItem('zs_fw_weather', JSON.stringify({
        fetchedAt: Date.now(),
        payload: { daily: { uv_index_max: [1], temperature_2m_max: [10] } }
      }));
      window.Routines.refreshConditions();
      const status = window.Routines.getStatusFor('Young').morning;
      status.items.forEach(function(it) {
        window.Routines.toggleFor('Young', 'morning', it.id);
      });
      const after = window.Routines.getStatusFor('Young').morning;
      return { complete: after.complete, hasSunscreen: after.items.some(function(i) {
        return i.label.indexOf('Sunscreen') !== -1;
      }) };
    });
    expect(done.hasSunscreen).toBe(false);
    expect(done.complete).toBe(true);
  });

  test('football only shows on a kid\'s own practice day', async ({ page }) => {
    const seen = await page.evaluate(() => {
      // Stand in for the subscribed family calendar.
      const today = new Date();
      window.FamilyCalendar.getUpcoming = function() {
        return [{ summary: 'Fútbol Rorro', start: today, allDay: false }];
      };
      window.Routines.refreshConditions();
      const list = (kid, which) => window.Routines.getStatusFor(kid)[which]
        .items.map(function(i) { return i.label; }).join(' ');
      return {
        // Whichever name the profile carries, the roster ties them together.
        rodrigoPm: list('Rodrigo JR', 'afternoon'),
        rorroPm: list('Rorro', 'afternoon'),
        pablopm: list('Pablo', 'afternoon'),
        emiliaPm: list('Pilita', 'afternoon'),
        isabelPm: list('Isabel', 'afternoon'),
        // Cleats belong to the same football day.
        rodrigoNight: list('Rodrigo JR', 'evening'),
        pabloNight: list('Pablo', 'evening')
      };
    });
    // "Fútbol Rorro" is Rodrigo's practice — nobody else's, accent and
    // nickname notwithstanding.
    expect(seen.rodrigoPm).toContain('Football kit');
    expect(seen.rorroPm).toContain('Football kit');
    expect(seen.pablopm).not.toContain('Football kit');
    expect(seen.emiliaPm).not.toContain('Football kit');
    expect(seen.isabelPm).not.toContain('Football kit');
    expect(seen.rodrigoNight).toContain('Cleats away');
    expect(seen.pabloNight).not.toContain('Cleats away');
  });

  test('homework is Rodrigo\'s and piano is Pablo\'s', async ({ page }) => {
    const seen = await page.evaluate(() => {
      const pm = (kid) => window.Routines.getStatusFor(kid).afternoon
        .items.map(function(i) { return i.label; }).join(' ');
      return {
        rodrigo: pm('Rodrigo JR'), rorro: pm('Rorro'),
        pablo: pm('Pablo'), young: pm('Ignacio'), isabel: pm('Isabel')
      };
    });
    expect(seen.rorro).toContain('Homework');
    expect(seen.isabel).not.toContain('Homework');
    expect(seen.rodrigo).toContain('Homework');
    expect(seen.rodrigo).not.toContain('Piano');
    expect(seen.pablo).toContain('Piano');
    expect(seen.pablo).not.toContain('Homework');
    expect(seen.young).not.toContain('Homework');
    expect(seen.young).not.toContain('Piano');
  });

  test('editing a label keeps the task conditional', async ({ page }) => {
    const kept = await page.evaluate(() => {
      const tpl = window.Routines.getTemplates('Young').morning;
      const i = tpl.findIndex(function(t) { return t.when === 'sunny'; });
      tpl[i].label = 'Sun cream 🧴';
      window.Routines.setTemplate('morning', tpl, 'Young');
      const after = window.Routines.getTemplates('Young').morning[i];
      return { label: after.label, when: after.when };
    });
    expect(kept.label).toBe('Sun cream 🧴');
    expect(kept.when).toBe('sunny');
  });

  test('editing one kid cannot rewrite the shared defaults', async ({ page }) => {
    const other = await page.evaluate(() => {
      const tpl = window.Routines.getTemplates('Young').morning;
      tpl[0].label = 'CHANGED';
      window.Routines.setTemplate('morning', tpl, 'Young');
      // Mid has no override, so it must still read the untouched default.
      return window.Routines.getTemplates('Mid').morning[0].label;
    });
    expect(other).not.toBe('CHANGED');
  });
});
