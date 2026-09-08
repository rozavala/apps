// @ts-check
const { test, expect } = require('@playwright/test');

// The Family Wall shows every kid, so it has to sync every kid — not
// just whoever is signed in. These tests stub the VPS with window.fetch.
const KIDS = [
  { name: 'Rodrigo JR', color: '#7C3AED', age: 11, avatar: '🦊' },
  { name: 'Emilia', color: '#EC4899', age: 9, avatar: '🦋' },
  { name: 'Pablo', color: '#10B981', age: 6, avatar: '🐸' }
];

test.describe('Family Wall — syncing across devices', () => {

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
    await page.waitForFunction(() => !!window.CloudSync && !!window.FamilyWall && !!window.SummerTodos);
  });

  test('the wall pulls every kid\'s routines, not just the signed-in one', async ({ page }) => {
    const urls = await page.evaluate(async () => {
      const seen = [];
      // @ts-ignore
      window.fetch = async (url) => {
        seen.push(String(url));
        return { ok: true, status: 200, json: async () => ({ _syncedAt: 0 }) };
      };
      // @ts-ignore
      window.CloudSync.online = true;
      // @ts-ignore
      await window.FamilyWall.pullRoutines();
      return seen;
    });
    expect(urls.some((u) => u.endsWith('/api/kids/rodrigo_jr/routines'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/api/kids/emilia/routines'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/api/kids/pablo/routines'))).toBe(true);
  });

  test('a pull unions today\'s ticks instead of overwriting them', async ({ page }) => {
    const after = await page.evaluate(async () => {
      const d = new Date();
      const today = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

      // This device ticked "bed" this morning and never got to push it.
      localStorage.setItem('zs_routines_pablo', JSON.stringify({
        days: { [today]: { morning: ['bed'], afternoon: [], evening: [] } },
        streak: 0, bestStreak: 3
      }));
      // The server has a newer record from the phone, with other ticks.
      const server = {
        days: { [today]: { morning: ['breakfast'], afternoon: [], evening: ['shower'] } },
        streak: 1, bestStreak: 7,
        _syncedAt: new Date().toISOString()
      };
      // @ts-ignore
      window.fetch = async () => ({ ok: true, status: 200, json: async () => server });
      // @ts-ignore
      window.CloudSync.online = true;
      // @ts-ignore
      await window.CloudSync.pull('zs_routines_pablo');
      const merged = JSON.parse(localStorage.getItem('zs_routines_pablo'));
      return { day: merged.days[today], bestStreak: merged.bestStreak };
    });

    // Neither side's ticks are lost.
    expect(after.day.morning.sort()).toEqual(['bed', 'breakfast']);
    expect(after.day.evening).toEqual(['shower']);
    // bestStreak is a high-water mark.
    expect(after.bestStreak).toBe(7);
  });

  test('an unchanged pull reports no change, so the wall does not repaint', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const server = {
        days: {}, streak: 2, bestStreak: 4,
        _syncedAt: new Date().toISOString()
      };
      // @ts-ignore
      window.fetch = async () => ({ ok: true, status: 200, json: async () => server });
      // @ts-ignore
      window.CloudSync.online = true;
      // @ts-ignore
      const first = await window.CloudSync.pull('zs_routines_emilia');
      // @ts-ignore
      const second = await window.CloudSync.pull('zs_routines_emilia');
      return { first, second };
    });
    expect(results.first).toBe(true);
    expect(results.second).toBe(false);
  });

  test('hiding Summer Quest is pushed to the family server', async ({ page }) => {
    const sent = await page.evaluate(async () => {
      let body = null;
      let url = null;
      // @ts-ignore
      window.fetch = async (u, opts) => {
        if (opts && opts.method === 'PUT') { url = String(u); body = JSON.parse(opts.body); }
        return { ok: true, status: 200, json: async () => ({}) };
      };
      // @ts-ignore
      window.CloudSync.online = true;
      // @ts-ignore
      window.SummerTodos.addItem('Learn to dive');
      // @ts-ignore
      window.SummerTodos.setHidden(true);
      await new Promise((r) => setTimeout(r, 50));
      return { url, body };
    });
    // The household bucket, not a per-kid one.
    expect(sent.url).toContain('/api/kids/_household/summer');
    expect(sent.body.hidden).toBe(true);
    expect(sent.body.items).toHaveLength(1);
  });

  test('another device hiding Summer Quest takes the card off this wall', async ({ page }) => {
    await page.evaluate(async () => {
      // @ts-ignore — visible here to start with.
      window.SummerTodos.addItem('Camp in the yard');
      // @ts-ignore
      window.FamilyWall.paint();
    });
    await expect(page.locator('.fw-card-summer')).toBeVisible();

    await page.evaluate(async () => {
      const server = {
        items: [{ id: 's1', label: 'Camp in the yard', done: false, createdAt: 1 }],
        target: 2, hidden: true, credit: {},
        _syncedAt: new Date().toISOString()
      };
      // @ts-ignore
      window.fetch = async () => ({ ok: true, status: 200, json: async () => server });
      // @ts-ignore
      window.CloudSync.online = true;
      // @ts-ignore
      await window.CloudSync.pull('zs_summer_todos');
      // @ts-ignore
      window.FamilyWall.paint();
    });

    await expect(page.locator('.fw-card-summer')).toHaveCount(0);
    // Parked, not deleted — and there's a way back.
    expect(await page.evaluate(() => window.SummerTodos.getItems())).toHaveLength(1);
    await expect(page.locator('.fw-quick button', { hasText: 'Show Summer Quest' })).toBeVisible();
  });
});
