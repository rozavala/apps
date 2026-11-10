// @ts-check
// The hub by age: Today's 3 for everyone, a short list of big cards with
// "More apps" for 5 and under, and subject sections for the rest.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const WED = [2026, 10, 11];            // Wednesday 11 November 2026 (Pacific, local)

async function openHub(page, { age = 8, day = WED, hubHidden, hubMoreLocked, log, minage } = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.clock.setFixedTime(new Date(day[0], day[1], day[2], 10, 0, 0));
  await page.addInitScript(([age, hubHidden, hubMoreLocked, log, minage]) => {
    if (localStorage.getItem('zs_profiles')) return;
    const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
    if (hubHidden) p.hubHidden = hubHidden;
    if (hubMoreLocked) p.hubMoreLocked = true;
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
    localStorage.removeItem('zs_schedule_override');
    localStorage.setItem('zs_schedule_mode', 'smart');
    if (log) localStorage.setItem('zs_activity_test', JSON.stringify(log));
    if (minage) localStorage.setItem('zs_hub_minage', JSON.stringify(minage));
    // Nothing is said out loud.
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], speak(u) { // @ts-ignore
      (window.__said = window.__said || []).push(u.text); }, cancel() {}, addEventListener() {} }, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: true }, configurable: true });
  }, [age, hubHidden || null, hubMoreLocked || false, log || null, minage || null]);
  await page.goto('/');
  await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active') && !!document.getElementById('hub-today'));
}

const todayNames = (page) => page.locator('#hub-today .hub-today-card').evaluateAll(els => els.map(e => /** @type {HTMLElement} */ (e).dataset.app));
const visibleHrefs = (page) => page.evaluate(() =>
  [...document.querySelectorAll('a.app-card')].filter(a => /** @type {HTMLElement} */ (a).offsetParent !== null).map(a => a.getAttribute('href')));

test.describe('Hub plan', () => {

  test('Today\'s 3: three different apps the kid can see', async ({ page }) => {
    await openHub(page, { age: 9 });
    const ids = await todayNames(page);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    const hrefs = await visibleHrefs(page);
    for (const id of ids) {
      const href = await page.evaluate((id) => /** @type {any} */ (HubPlan).APPS.find(a => a.id === id).href, id);
      expect(hrefs, id + ' is on the hub').toContain(href);
    }
    // Never more than two from one subject.
    const groups = await page.evaluate((ids) => ids.map(id => /** @type {any} */ (HubPlan).APPS.find(a => a.id === id).group), ids);
    const counts = groups.reduce((m, g) => (m[g] = (m[g] || 0) + 1, m), {});
    expect(Math.max(...Object.values(counts))).toBeLessThanOrEqual(2);
  });

  test('the suggestions change from day to day', async ({ browser }) => {
    const sets = new Set();
    for (const day of [[2026, 10, 9], [2026, 10, 10], [2026, 10, 11], [2026, 10, 12], [2026, 10, 13]]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await openHub(page, { age: 9, day });
      sets.add((await todayNames(page)).join(','));
      await ctx.close();
    }
    expect(sets.size).toBeGreaterThan(1);
  });

  test('suggestions skip what was already done today and favour what was not done lately', async ({ page }) => {
    const doneToday = new Date(2026, 10, 11, 8, 0).getTime();
    const log = [
      { app: 'Math Galaxy', icon: '🧮', desc: 'x', ts: doneToday },
      { app: 'Guess Quest', icon: '🎯', desc: 'x', ts: doneToday },
      { app: 'Little Maestro', icon: '🎹', desc: 'x', ts: doneToday },
      { app: 'Art Studio', icon: '🎨', desc: 'x', ts: doneToday }
    ];
    await openHub(page, { age: 9, log });
    const ids = await todayNames(page);
    for (const done of ['math', 'guess', 'piano', 'art']) expect(ids).not.toContain(done);
  });

  test('the same 3 all day, and a ✓ when one is done', async ({ page }) => {
    await openHub(page, { age: 9 });
    const first = await todayNames(page);
    await expect(page.locator('#hub-today .is-done')).toHaveCount(0);
    // The kid does the first one; the hub is shown again.
    await page.evaluate(([name, ts]) => {
      const k = 'zs_activity_test';
      const log = JSON.parse(localStorage.getItem(k) || '[]');
      log.push({ app: name, icon: '⭐', desc: 'done', ts });
      localStorage.setItem(k, JSON.stringify(log));
    }, [await page.evaluate((id) => /** @type {any} */ (HubPlan).APPS.find(a => a.id === id).names[0].replace(/^./, c => c.toUpperCase()), first[0]), new Date(2026, 10, 11, 9, 0).getTime()]);
    await page.reload();
    await page.waitForFunction(() => !!document.getElementById('hub-today'));
    expect(await todayNames(page)).toEqual(first);
    await expect(page.locator('#hub-today .hub-today-card.is-done')).toHaveCount(1);
    await expect(page.locator('#hub-today .hub-today-card').first()).toHaveClass(/is-done/);
    await expect(page.locator('#hub-today .hub-today-check')).toHaveCount(1);
  });

  test('all three done shows a cheer', async ({ page }) => {
    await openHub(page, { age: 9 });
    const ids = await todayNames(page);
    const names = await page.evaluate((ids) => ids.map(id => /** @type {any} */ (HubPlan).APPS.find(a => a.id === id).names[0]), ids);
    await page.evaluate(([names, ts]) => {
      localStorage.setItem('zs_activity_test', JSON.stringify(names.map(n => ({ app: n, icon: '⭐', desc: 'd', ts }))));
    }, [names, new Date(2026, 10, 11, 9, 0).getTime()]);
    await page.reload();
    await page.waitForFunction(() => !!document.getElementById('hub-today'));
    await expect(page.locator('#hub-today .hub-today-done')).toBeVisible();
  });

  test('age 4 sees at most 8 big cards, 🔊 on each, and the rest behind More apps', async ({ page }) => {
    await openHub(page, { age: 4 });
    const main = page.locator('#app-grid > a.app-card');
    expect(await main.count()).toBeGreaterThan(0);
    expect(await main.count()).toBeLessThanOrEqual(8);
    // Every main card is one of the cards meant for the youngest.
    const notFit = await page.evaluate(() => [...document.querySelectorAll('#app-grid > a.app-card')]
      .filter(a => !/** @type {any} */ (HubPlan).appForHref(a.getAttribute('href')).beginner).map(a => a.getAttribute('href')));
    expect(notFit).toEqual([]);
    await expect(main.first().locator('.zs-say')).toHaveCount(1);
    await expect(page.locator('#hub-today')).toBeVisible();
    // The others wait behind the button.
    await expect(page.locator('#hub-more')).toBeHidden();
    await page.locator('#hub-more-btn').click();
    await expect(page.locator('#hub-more')).toBeVisible();
    expect(await page.locator('#hub-more a.app-card').count()).toBeGreaterThan(0);
    // No sections for the little ones.
    await expect(page.locator('.hub-group')).toHaveCount(0);
  });

  test('age 4 does not get apps that are for older kids', async ({ page }) => {
    await openHub(page, { age: 4 });
    await page.locator('#hub-more-btn').click();
    const hrefs = await visibleHrefs(page);
    for (const old of ['patron-lancha.html', 'civics-lab.html', 'invest-quest.html', 'euclid-workshop.html', 'chess-quest.html']) {
      expect(hrefs).not.toContain(old);
    }
  });

  test('a parent can lock More apps behind the PIN', async ({ page }) => {
    await openHub(page, { age: 4, hubMoreLocked: true });
    await page.evaluate(() => {
      // @ts-ignore
      window.__asked = 0; window.requestPinThen = (fn) => { window.__asked++; window.__unlock = fn; };
    });
    await page.locator('#hub-more-btn').click();
    await expect(page.locator('#hub-more')).toBeHidden();
    expect(await page.evaluate(() => /** @type {any} */ (window).__asked)).toBe(1);
    await page.evaluate(() => /** @type {any} */ (window).__unlock());
    await expect(page.locator('#hub-more')).toBeVisible();
  });

  test('age 4: the first tap on a card says its name and the second opens it', async ({ page }) => {
    await openHub(page, { age: 4 });
    const card = page.locator('#app-grid > a.app-card').first();
    const href = await card.getAttribute('href');
    const name = (await card.locator('.card-title').evaluate(e => e.childNodes[0].textContent)).trim();
    await card.click({ position: { x: 20, y: 20 } });
    expect(await page.evaluate(() => /** @type {any} */ (window).__said)).toContain(name);
    expect(page.url()).not.toContain(href);
    await card.click({ position: { x: 20, y: 20 } });
    await page.waitForURL('**/' + href);
  });

  test('age 12 sees every app in subject sections that fold', async ({ page }) => {
    await openHub(page, { age: 12 });
    const names = await page.locator('.hub-group-name').allTextContents();
    expect(names.length).toBeGreaterThanOrEqual(7);
    expect(names).toContain('Math & Logic');
    await expect(page.locator('.hub-group[open]')).toHaveCount(names.length);
    await expect(page.locator('#hub-more-btn')).toHaveCount(0);
    // Fold one; it stays folded after a reload.
    await page.locator('.hub-group[data-group="math"] > summary').click();
    await expect(page.locator('.hub-group[data-group="math"]')).not.toHaveAttribute('open', '');
    // The browser reports the fold a moment later; wait for it to be saved.
    await page.waitForFunction(() => (localStorage.getItem('zs_hub_fold_test') || '').includes('"math":false'));
    await page.reload();
    await page.waitForFunction(() => !!document.getElementById('hub-today'));
    await expect(page.locator('.hub-group[data-group="math"]')).not.toHaveAttribute('open', '');
    await expect(page.locator('.hub-group[data-group="science"]')).toHaveAttribute('open', '');
  });

  test('the section names follow the kid\'s language', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('zs_profiles', JSON.stringify([{ name: 'Test', color: 'blue', age: 12, avatar: '🦊', lang: 'es' }])));
    await page.addInitScript(() => localStorage.setItem('zs_active_user', JSON.stringify({ name: 'Test', color: 'blue', age: 12, avatar: '🦊', lang: 'es' })));
    await openHub(page, { age: 12 });
    await expect(page.locator('.hub-group[data-group="math"] .hub-group-name')).toHaveText('Matemáticas y lógica');
    await expect(page.locator('#hub-today .hub-today-title')).toContainText('Los 3 de hoy');
  });

  test('a parent can hide an app for one kid, and it is not suggested either', async ({ page }) => {
    await openHub(page, { age: 9, hubHidden: ['math', 'guess', 'lab', 'story', 'world', 'atlas', 'art', 'piano', 'money'] });
    const hrefs = await visibleHrefs(page);
    expect(hrefs).not.toContain('math-galaxy.html');
    expect(hrefs).not.toContain('art-studio.html');
    expect(await todayNames(page)).not.toEqual(expect.arrayContaining(['math']));
    for (const id of await todayNames(page)) expect(['math', 'guess', 'lab', 'story', 'world', 'atlas', 'art', 'piano', 'money']).not.toContain(id);
  });

  test('a minimum age is stored only when it differs from the suggestion', async ({ page }) => {
    await openHub(page, { age: 8 });
    const out = await page.evaluate(() => {
      const H = /** @type {any} */ (HubPlan);
      const before = H.minAge('chess');
      H.setMinAge('chess', 12);
      const changed = H.minAge('chess');
      H.setMinAge('chess', before);                 // back to the suggestion
      return { before, changed, stored: localStorage.getItem('zs_hub_minage') };
    });
    expect(out).toEqual({ before: 5, changed: 12, stored: '{}' });
  });

  test('a minimum age keeps a younger kid away from the app', async ({ page }) => {
    await openHub(page, { age: 8, minage: { atlas: 10, euclid: 3 } });
    const hrefs = await visibleHrefs(page);
    expect(hrefs).not.toContain('world-atlas.html');
    expect(hrefs).toContain('world-explorer.html');
  });

  test('Parents Corner lists every app, so none is out of reach', async ({ page }) => {
    await openHub(page, { age: 4 });
    await page.evaluate(() => { /* @ts-ignore */ window.openParentsCorner(); });
    const links = await page.locator('.pk-hub-ages a').evaluateAll(els => els.map(e => e.getAttribute('href')));
    const html = fs.readFileSync(path.resolve(__dirname, '..', '..', 'index.html'), 'utf8');
    const cards = [...html.matchAll(/<a\s[^>]*class="app-card[^>]*href="([^"]+)"|<a href="([^"]+)" class="app-card/g)].map(m => m[1] || m[2]);
    expect(cards.length).toBeGreaterThan(30);
    for (const c of cards) expect(links, c + ' is in Parents Corner').toContain(c);
    // And a kid's own list of apps with a lock.
    await expect(page.locator('details.pk-hub .pk-hub-app').first()).toBeAttached();
    await expect(page.locator('details.pk-hub .pk-more-lock')).toBeAttached();
  });

  test('Parents Corner hides an app for a kid and the hub follows', async ({ page }) => {
    await openHub(page, { age: 9 });
    expect(await visibleHrefs(page)).toContain('math-galaxy.html');
    await page.evaluate(() => {
      // @ts-ignore
      CloudSync.overwriteProfiles = (p) => { window.__pushed = JSON.parse(JSON.stringify(p)); };
      // @ts-ignore
      window.openParentsCorner();
    });
    await page.locator('details.pk-hub > summary').first().click();
    await page.locator('.pk-hub-app[data-app="math"]').uncheck();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zs_profiles'))[0].hubHidden)).toEqual(['math']);
    expect(await page.evaluate(() => /** @type {any} */ (window).__pushed[0].hubHidden)).toEqual(['math']);
    expect(await visibleHrefs(page)).not.toContain('math-galaxy.html');
    await page.locator('.pk-hub-app[data-app="math"]').check();
    expect(await visibleHrefs(page)).toContain('math-galaxy.html');
  });

  test('the minimum ages sync with the household', async ({ page }) => {
    await openHub(page, { age: 9 });
    expect(await page.evaluate(() => /** @type {any} */ (CloudSync).isConfigured !== undefined)).toBe(true);
    const src = fs.readFileSync(path.resolve(__dirname, '..', '..', 'js', 'sync.js'), 'utf8');
    expect(src).toContain("'zs_hub_minage'");
  });
});

test.describe('Hub plan catalog', () => {
  const root = path.resolve(__dirname, '..', '..');
  const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

  test('every hub card is in the catalog, and every catalog app has a card', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.goto('/');
    const catalog = await page.evaluate(() => /** @type {any} */ (HubPlan).APPS.map(a => a.href));
    const html = read('index.html');
    const cards = [...html.matchAll(/<a\s[^>]*class="app-card[^>]*>/g)].map(m => /href="([^"]+)"/.exec(m[0])[1]);
    expect(cards.filter(c => !catalog.includes(c)), 'cards missing from the catalog').toEqual([]);
    expect(catalog.filter(c => !cards.includes(c)), 'catalog apps with no card').toEqual([]);
    expect(new Set(catalog).size).toBe(catalog.length);
  });

  test('every name an app logs under finds its app', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.goto('/');
    // The names apps pass to ActivityLog.log as a plain string.
    const names = new Set();
    for (const f of fs.readdirSync(path.join(root, 'js'))) {
      if (!f.endsWith('.js')) continue;
      for (const m of read('js/' + f).matchAll(/ActivityLog\.log\('([^']+)'/g)) names.add(m[1]);
    }
    // Not apps on the hub: household tools, Parents Corner, routines.
    const notHub = ['Parents Corner', 'Routines', 'Home Timer'];
    const lost = await page.evaluate((names) => names.filter(n => !/** @type {any} */ (HubPlan).appForLogName(n)), [...names].filter(n => !notHub.includes(n)));
    expect(lost, 'logged names that match no app').toEqual([]);
  });

  test('every app has a group, and the youngest list is about 8', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.goto('/');
    const out = await page.evaluate(() => {
      const H = /** @type {any} */ (HubPlan);
      const ids = H.GROUPS.map(g => g.id);
      return { badGroup: H.APPS.filter(a => !ids.includes(a.group)).map(a => a.id), beginners: H.APPS.filter(a => a.beginner).length,
               groups: ids };
    });
    expect(out.badGroup).toEqual([]);
    expect(out.beginners).toBeGreaterThanOrEqual(6);
    expect(out.beginners).toBeLessThanOrEqual(9);   // Lector joined the youngest list (reading is the gap for 4 to 6)
    expect(out.groups).toEqual(['math', 'science', 'reading', 'world', 'faith', 'arts', 'money', 'move', 'more']);
  });
});
