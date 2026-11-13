// @ts-check
// Night-routine tasks that only show on some days of the week: drying
// hair is Emilia's and Isabel's, on Thursday and Sunday nights. Kids who
// already have an edited night list get it put in once, after Shower.
const { test, expect } = require('@playwright/test');

const KIDS = [
  { name: 'Emilia', color: '#10B981', age: 8, avatar: '🐸' },
  { name: 'Isabel', color: '#EF4444', age: 5, avatar: '🐰' },
  { name: 'Pablo',  color: '#7C3AED', age: 10, avatar: '🦊' }
];

// 2026-11-12 is a Thursday, 11-13 a Friday, 11-15 a Sunday.
async function open(page, when, init) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.clock.setFixedTime(new Date(when));
  await page.addInitScript(([kids, init]) => {
    if (localStorage.getItem('zs_profiles')) return;
    localStorage.setItem('zs_profiles', JSON.stringify(kids));
    localStorage.setItem('zs_active_user', JSON.stringify(kids[0]));
    Object.keys(init || {}).forEach(k => localStorage.setItem(k, JSON.stringify(init[k])));
  }, [KIDS, init]);
  await page.goto('/family.html');
  await page.waitForLoadState('networkidle');
}

const night = (page) => page.evaluate(() => {
  const R = /** @type {any} */ (window).Routines;
  R.refreshConditions();
  const ids = (kid) => R.getStatusFor(kid).evening.items.map((i) => i.id);
  return { emilia: ids('Emilia'), isabel: ids('Isabel'), pablo: ids('Pablo') };
});

test.describe('Routines: tasks on some days only', () => {
  for (const [day, when, shown] of [['Thursday', '2026-11-12T19:00:00', true], ['Friday', '2026-11-13T19:00:00', false], ['Sunday', '2026-11-15T19:00:00', true]]) {
    test(`drying hair is on the girls' night list on ${day}: ${shown}`, async ({ page }) => {
      await open(page, when);
      const n = await night(page);
      expect(n.emilia.includes('hair_dry')).toBe(shown);
      expect(n.isabel.includes('hair_dry')).toBe(shown);
      expect(n.pablo).not.toContain('hair_dry');
      if (shown) expect(n.emilia.indexOf('hair_dry')).toBe(n.emilia.indexOf('shower') + 1);
    });
  }

  test('a girl with her own night list gets it once, after Shower, and a parent can remove it for good', async ({ page }) => {
    const own = [{ id: 'dinner', label: 'Cena 🍽️' }, { id: 'shower', label: 'Ducha 🚿' }, { id: 'teeth_pm', label: 'Dientes 🦷' }];
    await open(page, '2026-11-15T19:00:00', {
      zs_routines_emilia: { days: {}, streak: 0, bestStreak: 0, templates: { evening: own } },
      zs_routines_pablo: { days: {}, streak: 0, bestStreak: 0, templates: { evening: own } }
    });
    let n = await night(page);
    expect(n.emilia).toEqual(['dinner', 'shower', 'hair_dry', 'teeth_pm']);
    expect(n.pablo).toEqual(['dinner', 'shower', 'teeth_pm']);
    // reading alone writes nothing
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zs_routines_emilia')).addedDefaults)).toBeUndefined();

    // it can be ticked, and the tick saves it with the list
    await page.evaluate(() => /** @type {any} */ (window).Routines.toggleFor('Emilia', 'evening', 'hair_dry'));
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_routines_emilia')));
    expect(saved.days['2026-11-15'].evening).toEqual(['hair_dry']);
    expect(saved.addedDefaults).toEqual(['hair_dry']);
    expect(saved.templates.evening.map((i) => i.id)).toEqual(['dinner', 'shower', 'hair_dry', 'teeth_pm']);

    // the editor shows when it is on, and keeps the days through a label edit
    const t = await page.evaluate(() => {
      const R = /** @type {any} */ (window).Routines;
      const tpl = R.getTemplates('Emilia').evening;
      const i = tpl.findIndex((x) => x.id === 'hair_dry');
      tpl[i].label = 'Secar el pelo 💨';
      R.setTemplate('evening', tpl, 'Emilia');
      const after = R.getTemplates('Emilia').evening[i];
      return { after, cond: R.conditionLabel(after) };
    });
    expect(t.after).toMatchObject({ label: 'Secar el pelo 💨', days: [4, 0], only: ['Emilia', 'Isabel'] });
    expect(t.cond).toBe('👤 Emilia, Isabel only · 📅 Thu, Sun only');

    // removed by a parent: it stays gone
    await page.evaluate(() => {
      const R = /** @type {any} */ (window).Routines;
      R.setTemplate('evening', R.getTemplates('Emilia').evening.filter((x) => x.id !== 'hair_dry'), 'Emilia');
    });
    await page.reload();
    n = await night(page);
    expect(n.emilia).toEqual(['dinner', 'shower', 'teeth_pm']);
  });

  test('a night with hair drying needs it ticked to count for the streak', async ({ page }) => {
    await open(page, '2026-11-12T20:00:00');
    const r = await page.evaluate(() => {
      const R = /** @type {any} */ (window).Routines;
      R.refreshConditions();
      const s = R.getStatusFor('Isabel');
      ['morning', 'afternoon', 'evening'].forEach((w) => s[w].items.forEach((i) => { if (i.id !== 'hair_dry') R.toggleFor('Isabel', w, i.id); }));
      const before = R.getStatusFor('Isabel').streak;
      R.toggleFor('Isabel', 'evening', 'hair_dry');
      return [before, R.getStatusFor('Isabel').streak];
    });
    expect(r).toEqual([0, 1]);
  });
});
