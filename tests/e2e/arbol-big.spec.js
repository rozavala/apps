// @ts-check
// Árbol familiar with a BIG tree: a 10 MB GEDCOM of 20,000 people (generated,
// FICTIONAL: tests/helpers/gedcom-samples.js big()). It is kept in IndexedDB,
// and synced to a fake family server (in this test, never the real one) that
// refuses any request over 5 MB, as the real one does.
const { test, expect } = require('@playwright/test');
const H = require('../helpers/gedcom-samples.js');

const FAKE = 'http://sync.test';
const LIMIT = 5 * 1024 * 1024;

async function open(page, o = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  const server = { items: {}, biggest: 0, puts: 0, refused: 0 };
  await page.route(FAKE + '/**', async (route) => {
    const req = route.request(), m = /\/api\/kids\/([^/]+)\/([^/?]+)/.exec(req.url());
    if (!m) return route.fulfill({ status: 404, body: '' });
    const key = m[1] + '/' + m[2];
    if (req.method() === 'PUT') {
      const body = req.postDataBuffer() || Buffer.alloc(0);
      server.biggest = Math.max(server.biggest, body.length);
      if (body.length > LIMIT) { server.refused++; return route.fulfill({ status: 413, body: '' }); }
      server.puts++;
      server.items[key] = Object.assign(JSON.parse(body.toString('utf8')), { _syncedAt: new Date().toISOString() });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'saved' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(server.items[key] || null) });
  });
  await page.addInitScript((age) => {
    const p = { name: 'Lucia', color: 'blue', age, avatar: '🦊', lang: 'en' };
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
  }, o.age || 10);
  await page.goto(o.url || '/arbol-familiar.html');
  if (o.online !== false) await goOnline(page);
  return server;
}
async function goOnline(page) {
  // point the page at the fake server
  await page.evaluate((url) => { /** @type {any} */ const c = window.CloudSync; c.server = url; c.online = true; }, FAKE);
}
// @ts-ignore
const stored = (page) => page.evaluate(() => ArbolDB.get().then(r => r && { people: Object.keys(r.tree.P).length, trim: r.tree.imp && r.tree.imp.trim, ts: r.ts, json: JSON.stringify(r.tree).length }));

test.describe('Árbol familiar: big trees', () => {
  test.setTimeout(120000);

  test('a 10 MB GEDCOM with 20,000 people imports whole, is kept in IndexedDB and syncs in pieces under 5 MB', async ({ page }) => {
    const text = H.big(20000);
    expect(Buffer.byteLength(text)).toBeGreaterThan(10 * 1000 * 1000);
    const server = await open(page, { url: '/arbol-familiar.html?parent=1' });
    await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
    await page.setInputFiles('#ar-file', { name: 'big.ged', mimeType: 'text/plain', buffer: Buffer.from(text, 'utf8') });
    await expect(page.locator('.ar-preview')).toContainText('20000 people', { timeout: 30000 });
    await page.click('[data-act=doimport]');
    await expect(page.locator('.ar-psec').first()).toContainText('20000 people saved', { timeout: 30000 });
    // nothing trimmed: notes and all events kept
    await expect(page.locator('.ar-psec').first()).not.toContainText('smaller version');
    const s = await stored(page);
    expect(s).toMatchObject({ people: 20000, trim: 0 });
    expect(s.json).toBeGreaterThan(5 * 1000 * 1000);          // bigger than localStorage could ever hold
    expect(await page.evaluate(() => localStorage.getItem('zs_family_tree'))).toBeNull();

    // the upload: a manifest and its pieces, none refused, none near the server's limit
    await expect.poll(() => server.items['_household/family_tree'] || null, { timeout: 30000 }).not.toBeNull();
    const man = server.items['_household/family_tree'];
    expect(man).toMatchObject({ v: 2, people: 20000 });
    expect(man.ts).toBe(s.ts);
    expect(server.refused).toBe(0);
    expect(server.biggest).toBeLessThan(LIMIT);
    for (let i = 1; i <= man.parts; i++) expect(server.items['_household/family_tree_' + i]).toMatchObject({ i, ts: man.ts });
    test.info().annotations.push({ type: 'size', description: `20000 people: stored ${s.json} chars; uploaded as ${man.enc}, ${man.len} chars in ${man.parts} piece(s); biggest request ${server.biggest} bytes` });

    // another device: an empty page pulls the whole tree from the server
    const page2 = await page.context().browser().newPage();
    try {
      await page2.route(FAKE + '/**', async (route) => {
        const m = /\/api\/kids\/([^/]+)\/([^/?]+)/.exec(route.request().url());
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify((m && server.items[m[1] + '/' + m[2]]) || null) });
      });
      await page2.route(/tail57521e\.ts\.net/, r => r.abort());
      await page2.addInitScript(() => {
        const p = { name: 'Lucia', color: 'blue', age: 10, avatar: '🦊', lang: 'en' };
        localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
      });
      await page2.goto('/arbol-familiar.html');
      await goOnline(page2);
      await page2.evaluate(() => /** @type {any} */ (window).Arbol.sync());
      const s2 = await stored(page2);
      expect(s2).toMatchObject({ people: 20000, trim: 0, ts: man.ts, json: s.json });
    } finally { await page2.close(); }
  });

  test('a tree saved by the first version (one plain item) is still read from the server', async ({ page }) => {
    const server = await open(page, { online: false });
    const tree = await page.evaluate((t) => {
      // @ts-ignore
      const r = ArbolStore.merge(null, Gedcom.parse(t), { file: 'old.ged' }); r.store.cfg.map = { lucia: 'I24' }; return r.store;
    }, H.sample());
    server.items['_household/family_tree'] = Object.assign({}, tree, { _syncedAt: new Date().toISOString() });
    await goOnline(page);
    await page.evaluate(() => /** @type {any} */ (window).Arbol.sync());
    expect(await stored(page)).toMatchObject({ people: 30 });
    await expect(page.locator('#ar-wrap')).not.toContainText('Ask a grown-up');
  });

  test('a tree left in localStorage moves to IndexedDB, and a deleted tree is deleted on other devices too', async ({ page }) => {
    const server = await open(page, { url: '/arbol-familiar.html?parent=1' });
    await page.evaluate((t) => {
      // @ts-ignore
      localStorage.setItem('zs_family_tree', JSON.stringify(ArbolStore.merge(null, Gedcom.parse(t), { file: 's.ged' }).store));
      // @ts-ignore
      return Arbol.reload();
    }, H.sample());
    expect(await stored(page)).toMatchObject({ people: 30 });
    expect(await page.evaluate(() => localStorage.getItem('zs_family_tree'))).toBeNull();
    // it reaches the server
    await page.evaluate(() => /** @type {any} */ (window).Arbol.sync());
    await expect.poll(() => (server.items['_household/family_tree'] || {}).people).toBe(30);
    // a parent deletes it: the server gets an "empty" manifest
    await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
    await page.click('[data-act=removetree]');
    await page.click('.zsd-ok');
    await expect.poll(() => (server.items['_household/family_tree'] || {}).empty).toBe(1);
    expect(await stored(page)).toBeNull();
  });

  test('pieces from two different uploads are never mixed', async ({ page }) => {
    const server = await open(page);
    await page.evaluate(async (t) => {
      // @ts-ignore
      const s = ArbolStore.merge(null, Gedcom.parse(t), { file: 's.ged' }).store;
      // @ts-ignore
      await ArbolSync.push(s, 1000);
    }, H.sample());
    // a newer manifest whose pieces have not all arrived yet
    server.items['_household/family_tree'] = Object.assign({}, server.items['_household/family_tree'], { ts: 2000 });
    const r = await page.evaluate(() => /** @type {any} */ (window).ArbolSync.pull(0).then(() => 'read', (e) => 'refused: ' + e.message));
    expect(r).toMatch(/^refused: the pieces do not match/);
  });
});
