// @ts-check
// Árbol familiar, in the browser, on a FICTIONAL family (tests/helpers/gedcom-samples.js).
// The sync server is never reached, and nothing real is ever used.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('../helpers/gedcom-samples.js');

const KEY = 'zs_family_tree';

async function open(page, o = {}) {
  const { age = 9, tree = true, linked = true, cfg = {}, extra, url = '/arbol-familiar.html?seed=4', user = true } = o;
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  await page.addInitScript(([age, user]) => {
    if (user && !localStorage.getItem('zs_profiles')) {
      const p = { name: 'Lucia', color: 'blue', age, avatar: '🦊', lang: 'en' };
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
    }
  }, [age, user]);
  await page.goto(url);
  if (tree) await seed(page, { linked, cfg, extra });
  return requests;
}
async function seed(page, { linked = true, cfg = {}, extra } = {}) {
  await page.evaluate(([text, linked, cfg, extra]) => {
    // @ts-ignore
    const r = ArbolStore.merge(null, Gedcom.parse(extra ? text.replace('0 TRLR', extra + '\n0 TRLR') : text), { file: 'sample.ged' });
    r.store.cfg = Object.assign({ map: linked ? { lucia: 'I24' } : {}, notes: 0, living: 0 }, cfg);
    // The way the first version stored it: the page moves it to IndexedDB on reload.
    localStorage.setItem('zs_family_tree', JSON.stringify(r.store));
    // @ts-ignore
    return Arbol.reload();
  }, [H.sample(), linked, cfg, extra]);
}
// The tree as saved on this device (IndexedDB, js/arbol-db.js).
// @ts-ignore
const stored = (page) => page.evaluate(() => ArbolDB.get().then(r => r && r.tree));
async function edit(page, kind) {
  await page.evaluate(async (kind) => {
    // @ts-ignore
    const r = await ArbolDB.get(), s = r.tree;
    if (kind === 'hostile') { s.P.I77.fc = []; s.P.I24.fc = ['F9']; }
    if (kind === 'kid-added') s.P.I12.a = { photo: 'later' };
    // @ts-ignore
    await ArbolDB.put(s, Date.now());
    // @ts-ignore
    await Arbol.reload();
  }, kind);
}
const bodyText = (page) => page.locator('#ar-wrap').innerText();

test.describe('Árbol familiar', () => {
  test('without a tree a kid is told to ask a grown-up, and the page has no script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { tree: false });
    await expect(page.locator('#ar-wrap')).toContainText('Ask a grown-up');
    await expect(page.locator('.ar-lock')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a tree that is not linked to this kid says so', async ({ page }) => {
    await open(page, { linked: false });
    await expect(page.locator('#ar-wrap')).toContainText('which one is you');
  });

  test('the hub has the card, and it opens the app', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 9, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_arbol_test', JSON.stringify({ q: { who: 5 }, map: 1 }));
    });
    await page.goto('/');
    const card = page.locator('a.app-card[href="arbol-familiar.html"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator('.card-title')).toHaveText('Árbol familiar');
    await expect(page.locator('#stats-arbol')).toContainText('4');       // 3 stars for a 5/5 game + 1 for the map
  });

  test('Parents Corner links to the setup', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 9, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
    });
    await page.goto('/');
    await page.evaluate(() => { /** @type {any} */ (window).openParentsCorner(); });
    await expect(page.locator('#parents-content a[href="arbol-familiar.html?parent=1"]')).toBeVisible();
  });

  test.describe('the tree', () => {
    test('starts from the kid, with parents and grandparents as portrait cards, birthplace flags and years', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page);
      await page.click('[data-to=tree]');
      const cards = page.locator('.ar-pcard');
      await expect(cards.first()).toBeVisible();
      expect(await cards.count()).toBe(7);                                  // me, 2 parents, 4 grandparents (phones start at 2 generations)
      const labels = await cards.evaluateAll(els => els.map(e => e.getAttribute('aria-label')));
      expect(labels[0]).toContain('Lucía');
      expect(labels.join('|')).toContain('Alberto Ejemplo, 1938–2019');      // a grandfather who died: full name and years
      expect(await page.locator('.ar-pcard .ar-cflag svg').count()).toBeGreaterThanOrEqual(6);
      await page.click('[data-act=depth][data-n="4"]');
      expect(await page.locator('.ar-pcard').count()).toBeGreaterThan(12);
    });

    test('zoom buttons change the view box, and dragging pans it', async ({ page }) => {
      await page.setViewportSize({ width: 820, height: 1180 });
      await open(page);
      await page.click('[data-to=tree]');
      const vb = () => page.locator('#ar-tree').getAttribute('viewBox').then(v => v.split(' ').map(Number));
      const a = await vb();
      await page.click('[data-act=zoom][data-f="1.35"]');
      const b = await vb();
      expect(b[2]).toBeLessThan(a[2]);
      await page.click('[data-act=fit]');
      expect((await vb())[2]).toBeGreaterThanOrEqual(a[2]);
      const box = await page.locator('#ar-tree').boundingBox();
      const before = await vb();
      await page.mouse.move(box.x + 60, box.y + 60);
      await page.mouse.down(); await page.mouse.move(box.x + 160, box.y + 140, { steps: 5 }); await page.mouse.up();
      const after = await vb();
      expect(after[0]).not.toBe(before[0]);
    });

    test('tapping a card opens that person, and the back button returns', async ({ page }) => {
      await open(page);
      await page.click('[data-to=tree]');
      await page.locator('.ar-pcard', { hasText: 'Alberto' }).click();
      await expect(page.locator('.ar-pinfo h2')).toContainText('Alberto Ejemplo');
      await expect(page.locator('.ar-rel')).toContainText('Is your grandfather');
      await page.click('[data-act=back]');
      await expect(page.locator('#ar-tree')).toBeVisible();
    });

    test('"see their tree" re-roots the tree on that person', async ({ page }) => {
      await open(page);
      await page.click('[data-to=tree]');
      await page.locator('.ar-pcard', { hasText: 'Alberto' }).click();
      await page.click('[data-act=treefrom]');
      await expect(page.locator('.ar-h2')).toContainText('Alberto');
    });
  });

  test.describe('privacy for kids', () => {
    test('a living relative is a first name, a birth year and a country; a person who died is shown in full', async ({ page }) => {
      await open(page);
      await page.click('[data-to=tree]');
      await page.locator('.ar-pcard', { hasText: 'Paula' }).click();
      const t = await bodyText(page);
      expect(t).toContain('Paula');
      expect(t).not.toContain('Muestra');
      expect(t).toContain('b. 1971');
      expect(t).toContain('Born in Chile');
      expect(t).not.toContain('Santiago');
      await expect(page.locator('.ar-tl')).toHaveCount(0);                 // no timeline for a living person
    });

    test('a living kid’s own page hides the exact birth date, and a parent can opt in', async ({ page }) => {
      await open(page);
      await page.evaluate(() => { /** @type {any} */ (window).Arbol.reload(); });
      await page.click('[data-to=tree]');
      await page.locator('.ar-pcard').first().click();
      expect(await bodyText(page)).not.toMatch(/12 May|Santa Clara/);
      await page.goto('/arbol-familiar.html');
      await seed(page, { cfg: { living: 1 } });
      await page.click('[data-to=tree]');
      await page.locator('.ar-pcard').first().click();
      expect(await bodyText(page)).toMatch(/12 May 2016/);
      expect(await bodyText(page)).toContain('Lucía Ejemplo');
    });

    test('notes are not shown until a parent ticks "show notes"', async ({ page }) => {
      await open(page);
      await page.click('[data-to=tree]');
      await page.click('[data-act=depth][data-n="3"]');
      await page.locator('.ar-pcard', { hasText: 'Luis' }).click();
      expect(await bodyText(page)).not.toContain('long table');
      await page.goto('/arbol-familiar.html');
      await seed(page, { cfg: { notes: 1 } });
      await page.click('[data-to=tree]');
      await page.click('[data-act=depth][data-n="3"]');
      await page.locator('.ar-pcard', { hasText: 'Luis' }).click();
      await expect(page.locator('.ar-notes')).toContainText('built the long table');
    });

    test('text from the file is never run as markup', async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => { /** @type {any} */ (window).__pwn = 0; });
      await open(page, { extra: [
        '0 @I77@ INDI', '1 NAME <img src=x onerror="window.__pwn=1"> /<script>window.__pwn=2<\/script>/', '1 SEX M',
        '1 BIRT', '2 DATE 1900', '2 PLAC <b onmouseover="window.__pwn=3">Nowhere</b>, Chile', '1 DEAT', '2 DATE 1950',
        '1 NOTE <svg onload="window.__pwn=4">', '1 FAMC @F9@'].join('\n') + '\n0 @F77@ FAM\n1 CHIL @I77@\n1 HUSB @I77@', cfg: { notes: 1 } });
      await edit(page, 'hostile');
      // the hostile person as a search result in "How are we related?"
      await page.click('[data-to=related]');
      await page.fill('#ar-q', 'img');
      await expect(page.locator('.ar-pchip').first()).toContainText('<img');
      await page.locator('.ar-pchip').first().click();
      await expect(page.locator('.ar-result')).toBeVisible().catch(() => {});
      expect(await page.evaluate(() => /** @type {any} */ (window).__pwn)).toBe(0);
      expect(await page.locator('#ar-wrap img[src="x"], #ar-wrap script').count()).toBe(0);
      expect(errors).toEqual([]);
    });
  });

  test('"How are we related?" says the right word in the kid’s language, and draws the path', async ({ page }) => {
    await open(page);
    await page.click('[data-to=related]');
    await page.fill('#ar-q', 'ernesto');
    await page.locator('.ar-pchip', { hasText: 'Ernesto' }).click();
    await expect(page.locator('.ar-big-sentence')).toContainText('Ernesto is your great-grandfather.');
    await expect(page.locator('.ar-sentence2')).toContainText('You are Ernesto’s great-granddaughter.');
    await expect(page.locator('.ar-step')).toHaveCount(4);
    // pick another: a cousin
    await page.click('[data-act=pick][data-who=b]');
    await page.fill('#ar-q', 'mateo');
    await page.locator('.ar-pchip', { hasText: 'Mateo' }).click();
    await expect(page.locator('.ar-big-sentence')).toContainText('Mateo is your 1st cousin.');
    await expect(page.locator('.ar-hint')).toContainText('They share');
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_arbol_lucia')));
    expect(d.rel).toBe(2);
  });

  test('Spanish: the words and the article', async ({ page }) => {
    await page.addInitScript(() => {
      const p = { name: 'Lucia', color: 'blue', age: 9, avatar: '🦊', lang: 'es' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
    });
    await open(page);
    await page.click('[data-to=related]');
    await page.fill('#ar-q', 'clara');
    await page.locator('.ar-pchip', { hasText: 'Clara' }).click();
    await expect(page.locator('.ar-big-sentence')).toContainText('Clara es tu tía abuela.');
    await expect(page.locator('.ar-sentence2')).toContainText('Tú eres la sobrina nieta de Clara.');
  });

  test('the family map counts relatives by country and lists them', async ({ page }) => {
    await open(page);
    await page.click('[data-to=map]');
    await expect(page.locator('svg.ar-map')).toBeVisible();
    await expect(page.locator('.ar-crow').first()).toContainText('Chile');
    await page.locator('.ar-crow').first().click();
    await expect(page.locator('.ar-chips .ar-pchip').first()).toBeVisible();
    await page.click('[data-act=mapgen][data-n="2"]');                       // grandparents only
    const rows = await page.locator('.ar-crow').allInnerTexts();
    expect(rows.join(' ')).toContain('Argentina');
    expect(rows.join(' ')).not.toContain('Italy');
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_arbol_lucia')));
    expect(d.map).toBe(1);
  });

  test('the quiz: five questions, one right answer each, the best score is saved and starred', async ({ page }) => {
    await open(page);
    await page.click('[data-to=quiz]');
    await page.click('[data-kind=who]');
    for (let i = 0; i < 5; i++) {
      const s = await page.evaluate(() => /** @type {any} */ (window).Arbol.state().quiz);
      const q = s.list[s.i];
      await page.click(`[data-act=qpick][data-i="${q.answer}"]`);
      await expect(page.locator('.ar-fb.ok')).toBeVisible();
      await page.click('[data-act=qnext]');
    }
    await expect(page.locator('.ar-qscore')).toHaveText('5/5');
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_arbol_lucia')));
    expect(d.q.who).toBe(5);
    await expect(page.locator('.ar-stars')).toContainText('3');
  });

  test('a wrong answer shows the right one and scores less', async ({ page }) => {
    await open(page);
    await page.click('[data-to=quiz]');
    await page.click('[data-kind=where]');
    const s = await page.evaluate(() => /** @type {any} */ (window).Arbol.state().quiz);
    const wrong = s.list[0].opts.findIndex(o => !o.correct);
    await page.click(`[data-act=qpick][data-i="${wrong}"]`);
    await expect(page.locator('.ar-fb.no')).toContainText('The answer was');
    await expect(page.locator('.ar-opt.right')).toHaveCount(1);
  });

  test('the youngest see their grandparents on big cards and a "tap your grandmother" game, nothing else', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, { age: 5 });
    await expect(page.locator('.ar-card-btn')).toHaveCount(2);
    await page.click('[data-to=tree]');
    await expect(page.locator('.ar-big')).toHaveCount(7);                   // me, 2 parents, 4 grandparents
    await expect(page.locator('#ar-tree')).toHaveCount(0);
    await page.click('[data-act=back]');
    await page.click('[data-to=quiz]');
    await expect(page.locator('.ar-card-btn')).toHaveCount(1);
    await page.click('[data-kind=grand]');
    await expect(page.locator('.ar-qtext')).toContainText(/Tap your grand(mother|father)/);
    await expect(page.locator('.ar-opts.big')).toBeVisible();
  });

  test.describe('parents', () => {
    test('the import is behind the parent PIN', async ({ page }) => {
      await open(page, { tree: false, url: '/arbol-familiar.html?parent=1' });
      await expect(page.locator('.zsd-input')).toBeVisible();
      await page.fill('.zsd-input', '0000');
      await page.keyboard.press('Enter');
      await expect(page.locator('#ar-file')).toHaveCount(0);
      await page.reload();
      await page.fill('.zsd-input', '1234');
      await page.keyboard.press('Enter');
      await expect(page.locator('#ar-file')).toBeAttached();
    });

    test('import a GEDCOM file, link the kid, then re-import a newer file without losing anything the kids have', async ({ page }) => {
      const requests = await open(page, { tree: false, url: '/arbol-familiar.html?parent=1' });
      await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
      await page.setInputFiles('#ar-file', path.join(__dirname, '../fixtures/familia-ejemplo.ged'));
      await expect(page.locator('.ar-preview')).toContainText('30 people and 12 families');
      await expect(page.locator('.ar-preview')).toContainText('look to be living');
      await expect(page.locator('.ar-preview')).toContainText('1 photo or media records are not imported');
      await page.click('[data-act=doimport]');
      await expect(page.locator('.ar-psec').first()).toContainText('30 people saved');
      // link: the kid's name is suggested
      await expect(page.locator('.ar-kpick', { hasText: 'Lucía Ejemplo' })).toBeVisible();
      await page.click('.ar-kpick:has-text("Lucía Ejemplo")');
      await expect(page.locator('.ar-klinked')).toContainText('Lucía Ejemplo');
      await expect(page.locator('#ar-file')).toBeAttached();
      await expect.poll(async () => (await stored(page)).cfg.map).toEqual({ lucia: 'I24' });
      const tree = await stored(page);
      expect(Object.keys(tree.P)).toHaveLength(30);
      // something the kids added, then a newer export (a corrected name) with the same ids
      await edit(page, 'kid-added');
      const newer = H.sample().replace('1 NAME Marta /Soto/', '1 NAME Marta Elena /Soto/').replace('2 GIVN Marta', '2 GIVN Marta Elena');
      await page.setInputFiles('#ar-file', { name: 'newer.ged', mimeType: 'text/plain', buffer: Buffer.from(newer, 'utf8') });
      await expect(page.locator('.ar-preview')).toContainText('1 updated');
      await page.click('[data-act=doimport]');
      const after = await stored(page);
      expect(after.P.I12.g).toBe('Marta Elena');
      expect(after.P.I12.a).toEqual({ photo: 'later' });
      expect(after.cfg.map).toEqual({ lucia: 'I24' });
      expect(requests.filter(u => /tail57521e/.test(u) && !/^data:/.test(u)).length).toBeLessThan(50);   // (all aborted by the route above)
    });

    test('a file that is not a family tree is refused with a plain message', async ({ page }) => {
      await open(page, { tree: false, url: '/arbol-familiar.html?parent=1' });
      await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
      await page.setInputFiles('#ar-file', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('shopping list\nmilk\neggs\n') });
      await expect(page.locator('.ar-warn[role=alert]')).toContainText('No people were found');
    });

    test('the privacy switches are saved, and the help names the FamilySearch pages and partner programs', async ({ page }) => {
      await open(page, { url: '/arbol-familiar.html?parent=1' });
      await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
      await page.check('#ar-notes');
      await page.check('#ar-live');
      await expect.poll(async () => (await stored(page)).cfg).toMatchObject({ notes: 1, living: 1 });
      await page.locator('.ar-help summary').click();
      const help = await page.locator('.ar-helpb').innerText();
      expect(help).toContain('https://www.familysearch.org/innovate/export');
      expect(help).toContain('https://www.familysearch.org/en/wiki/GEDCOM');
      expect(help).toContain('https://www.familysearch.org/en/innovate/solutions-gallery/');
      expect(help).toMatch(/RootsMagic/);
      expect(help).toMatch(/Ancestry/);
    });

    test('the tree can be deleted from the device', async ({ page }) => {
      await open(page, { url: '/arbol-familiar.html?parent=1' });
      await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
      await page.click('[data-act=removetree]');
      await page.click('.zsd-ok');
      await expect.poll(() => stored(page)).toBeNull();
      expect(await page.evaluate(() => localStorage.getItem('zs_family_tree'))).toBeNull();
    });
  });

  test('phone width: nothing scrolls sideways and the fixed nav buttons do not cover the content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    for (const to of ['tree', 'related', 'map', 'quiz']) {
      await page.goto('/arbol-familiar.html');
      await seed(page);
      await page.click(`[data-to=${to}]`);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, to).toBeLessThanOrEqual(0);
      const nav = await page.locator('#zs-nav').boundingBox();
      const first = await page.locator('#ar-wrap .ar-head').boundingBox();
      expect(first.y, to).toBeGreaterThanOrEqual(nav.y + nav.height - 2);
    }
  });
});
