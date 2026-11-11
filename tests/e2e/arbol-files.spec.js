// @ts-check
// Árbol familiar: photos and documents attached to a person, on the FICTIONAL
// sample family. The family server is a fake one inside the test (never the
// real one), which checks what a real upload would carry.
const { test, expect } = require('@playwright/test');
const H = require('../helpers/gedcom-samples.js');

const FAKE = 'http://sync.test';
// a 2x2 PNG (made in the test, nothing real)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64');
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const DEAD = 'I1';     // Giuseppe Ejemplo, who died long ago
const LIVING = 'I12';  // Marta, living

async function open(page, o = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  const server = { files: {}, items: {} };
  await page.route(FAKE + '/**', async (route) => {
    const req = route.request(), u = new URL(req.url());
    let m = /^\/api\/files\/arbol\/([a-f0-9]{32})$/.exec(u.pathname);
    if (m) {
      const id = m[1];
      if (req.method() === 'PUT') { server.files[id] = { type: req.headers()['content-type'], body: req.postDataBuffer() }; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"saved"}' }); }
      if (req.method() === 'DELETE') { delete server.files[id]; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"deleted"}' }); }
      const f = server.files[id];
      // like the real server (cors()), so a canvas may read the photo to cut a face from it
      return f ? route.fulfill({ status: 200, contentType: f.type, body: f.body, headers: { 'Access-Control-Allow-Origin': '*' } }) : route.fulfill({ status: 404, body: '' });
    }
    m = /^\/api\/kids\/([^/]+)\/([^/]+)$/.exec(u.pathname);
    if (m && req.method() === 'PUT') { server.items[m[1] + '/' + m[2]] = JSON.parse(req.postData() || 'null'); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"saved"}' }); }
    if (m) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(server.items[m[1] + '/' + m[2]] || null) });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.addInitScript(() => {
    const p = { name: 'Lucia', color: 'blue', age: 10, avatar: '🦊', lang: 'en' };
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
  });
  await page.goto('/arbol-familiar.html');
  await page.evaluate(async ([t, url]) => {
    // @ts-ignore
    const r = ArbolStore.merge(null, Gedcom.parse(t), { file: 'sample.ged' }); r.store.cfg.map = { lucia: 'I24' };
    // @ts-ignore
    await ArbolDB.put(r.store, Date.now());
    /** @type {any} */ const c = window.CloudSync; c.server = url; c.online = true;
    // @ts-ignore
    await Arbol.reload();
  }, [H.sample(), FAKE]);
  return server;
}
async function person(page, id) {
  await page.evaluate((id) => { /** @type {any} */ const b = document.createElement('button'); b.setAttribute('data-act', 'person'); b.setAttribute('data-id', id); document.getElementById('ar-wrap').appendChild(b); b.click(); }, id);
  await expect(page.locator('.ar-person')).toBeVisible();
}
async function unlock(page) {
  await page.click('[data-act=fileunlock]');
  await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
  await expect(page.locator('.ar-fpanel')).toBeVisible();
}
// @ts-ignore
const filesOf = (page, id) => page.evaluate((id) => ArbolDB.get().then(r => (r.tree.P[id].a || {}).files || []), id);

test.describe('Árbol familiar: photos and documents', () => {
  test('a parent attaches a photo and a PDF; the kids see them, the photo opens big, and a delete removes it from the server', async ({ page }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const server = await open(page);
    await person(page, DEAD);
    await expect(page.locator('.ar-files')).toHaveCount(0);
    await unlock(page);
    await page.fill('#ar-ftitle', 'Acta de matrimonio');
    await page.setInputFiles('#ar-fup', [{ name: 'acta.png', mimeType: 'image/png', buffer: PNG }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');
    await page.fill('#ar-ftitle', 'Bautizo 1902');
    await page.setInputFiles('#ar-fup', [{ name: 'bautizo.pdf', mimeType: 'application/pdf', buffer: PDF }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');

    // the server got the photo (this tiny PNG is smaller than any JPEG of it, so it goes as it is),
    // a JPEG preview, and the PDF byte for byte
    const types = Object.values(server.files).map(f => f.type).sort();
    expect(types).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
    for (const f of Object.values(server.files)) {
      if (f.type === 'image/jpeg') expect([...f.body.slice(0, 3)]).toEqual([0xFF, 0xD8, 0xFF]);
      else if (f.type === 'image/png') expect(f.body.equals(PNG)).toBe(true);
      else expect(f.body.equals(PDF)).toBe(true);
    }
    const files = await filesOf(page, DEAD);
    expect(files.map(f => [f.t, f.type, f.kids])).toEqual([['Acta de matrimonio', 'image/png', 1], ['Bautizo 1902', 'application/pdf', 1]]);
    expect(files[0].th).toMatch(/^[a-f0-9]{32}$/);
    // and the tree (with the list) was uploaded too
    await expect.poll(() => (server.items['_household/family_tree'] || {}).v).toBe(2);

    // leave parent mode: what a kid sees
    await page.click('[data-act=parentdone]');
    await expect(page.locator('.ar-fpanel')).toHaveCount(0);
    await expect(page.locator('.ar-ftile')).toHaveCount(2);
    await expect(page.locator('.ar-ftile img')).toHaveJSProperty('naturalWidth', 2);
    await expect(page.locator('a.ar-ftile.doc')).toHaveAttribute('href', FAKE + '/api/files/arbol/' + files[1].id);
    await page.locator('button.ar-ftile').click();
    await expect(page.locator('.ar-lightbox')).toContainText('Acta de matrimonio');
    await page.click('[data-act=fileclose]');
    await expect(page.locator('.ar-lightbox')).toHaveCount(0);

    // a parent deletes the photo: gone from the server (with its preview) and from the list
    await unlock(page);
    await page.locator('.ar-flist li', { hasText: 'Acta de matrimonio' }).locator('[data-act=filedel]').click();
    await page.click('.zsd-ok');
    await expect(page.locator('.ar-flist li')).toHaveCount(1);
    expect(Object.values(server.files).map(f => f.type)).toEqual(['application/pdf']);
    expect(errors).toEqual([]);
  });

  test('a big photo is made smaller (2,400 px) before it is uploaded', async ({ page }) => {
    const server = await open(page);
    // a 4,000 x 3,000 noisy PNG, drawn in the page (a stand-in for a phone photo or a scan)
    const b64 = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 4000; c.height = 3000;
      const g = c.getContext('2d'), d = g.createImageData(4000, 3000);
      for (let i = 0; i < d.data.length; i += 4) { d.data[i] = (i * 7) & 255; d.data[i + 1] = (i * 13) & 255; d.data[i + 2] = (i >> 9) & 255; d.data[i + 3] = 255; }
      g.putImageData(d, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    });
    const big = Buffer.from(b64, 'base64');
    await person(page, DEAD);
    await unlock(page);
    await page.setInputFiles('#ar-fup', [{ name: 'scan.png', mimeType: 'image/png', buffer: big }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved', { timeout: 20000 });
    const [f] = await filesOf(page, DEAD);
    expect(f.type).toBe('image/jpeg');
    const dims = await page.evaluate((u) => new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.src = u; }), FAKE + '/api/files/arbol/' + f.id);
    expect(dims).toEqual([2400, 1800]);
    expect(Object.keys(server.files)).toHaveLength(2);     // the photo and its preview
  });

  test('a face cut from a photo replaces the drawn figure, for the kids too, and goes with its photo', async ({ page }) => {
    const server = await open(page);
    // a 600 x 400 photo, beige, with a red "face" centred at (450, 120)
    const b64 = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 600; c.height = 400; const g = c.getContext('2d');
      g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 600, 400); g.fillStyle = '#d02020'; g.beginPath(); g.arc(450, 120, 60, 0, 7); g.fill();
      return c.toDataURL('image/png').split(',')[1];
    });
    await person(page, DEAD);
    await unlock(page);
    await page.setInputFiles('#ar-fup', [{ name: 'familia.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');
    await page.click('[data-act=facepick]');
    const img = page.locator('#ar-cropimg');
    await expect(img).toHaveJSProperty('complete', true);
    const box = await img.boundingBox();
    await img.click({ position: { x: box.width * 0.75, y: box.height * 0.30 } });
    await page.fill('#ar-cropz', '3');
    await expect(page.locator('#ar-cropring')).toBeVisible();
    await page.click('[data-act=cropsave]');
    await expect(page.locator('.ar-crop')).toHaveCount(0);

    // the face: a 320 x 320 JPEG on the server, mostly the red circle
    const p = await page.evaluate((id) => /** @type {any} */ (window).ArbolDB.get().then(r => r.tree.P[id].a), DEAD);
    expect(p.face).toMatchObject({ src: p.files[0].id, kids: 1 });
    expect(server.files[p.face.id].type).toBe('image/jpeg');
    const red = await page.evaluate((u) => new Promise(res => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => {
      const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.drawImage(i, 0, 0);
      const d = g.getImageData(160, 160, 1, 1).data; res([i.naturalWidth, i.naturalHeight, d[0] > 150 && d[1] < 90]); }; i.src = u; }), FAKE + '/api/files/arbol/' + p.face.id);
    expect(red).toEqual([320, 320, true]);

    // a kid sees the face on the person's page, the family chips and the tree
    await page.click('[data-act=parentdone]');
    await expect(page.locator('.ar-pp img.ar-face')).toHaveAttribute('src', FAKE + '/api/files/arbol/' + p.face.id);
    await page.click('[data-act=treefrom]');
    await expect(page.locator('#ar-tree-g image')).toHaveAttribute('href', FAKE + '/api/files/arbol/' + p.face.id);

    // made parents-only, the photo takes its face with it
    await person(page, DEAD);
    await unlock(page);
    await page.locator('.ar-fkids').first().uncheck();
    await page.click('[data-act=parentdone]');
    await expect(page.locator('.ar-pp img.ar-face')).toHaveCount(0);
    await expect(page.locator('.ar-pp svg.ar-portrait')).toHaveCount(1);
    // and deleting the photo deletes the face
    await unlock(page);
    await page.locator('.ar-flist li', { hasText: 'familia' }).locator('[data-act=filedel]').click();
    await page.click('.zsd-ok');
    await expect(page.locator('.ar-faceRow')).toHaveCount(0);
    expect(Object.keys(server.files)).toHaveLength(0);
  });

  test('a living relative\'s face stays hidden from the kids unless the parent shows living relatives', async ({ page }) => {
    await open(page);
    await page.evaluate(async (id) => {
      // @ts-ignore
      const r = await ArbolDB.get(); r.tree.P[id].a = { face: { id: 'a'.repeat(32), src: 'b'.repeat(32), kids: 1 } }; await ArbolDB.put(r.tree, Date.now()); await Arbol.reload();
    }, LIVING);
    await person(page, LIVING);
    await expect(page.locator('.ar-pp img.ar-face')).toHaveCount(0);
    await page.evaluate(async () => {
      // @ts-ignore
      const r = await ArbolDB.get(); r.tree.cfg.living = 1; await ArbolDB.put(r.tree, Date.now()); await Arbol.reload();
    });
    await person(page, LIVING);
    await expect(page.locator('.ar-pp img.ar-face')).toHaveCount(1);
  });

  test('parents-only files, and any file of a living relative, stay hidden from the kids', async ({ page }) => {
    await open(page);
    await person(page, DEAD);
    await unlock(page);
    await page.fill('#ar-ftitle', 'Carta privada');
    await page.uncheck('#ar-fkidsnew');
    await page.setInputFiles('#ar-fup', [{ name: 'carta.pdf', mimeType: 'application/pdf', buffer: PDF }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');
    await expect(page.locator('.ar-ftile .ar-flock')).toHaveCount(1);       // parents see it, marked
    await page.click('[data-act=parentdone]');
    await expect(page.locator('.ar-ftile')).toHaveCount(0);

    await person(page, LIVING);
    await unlock(page);
    await expect(page.locator('.ar-fpanel')).toContainText('looks to be living');
    await page.fill('#ar-ftitle', 'Foto de la boda');
    await page.setInputFiles('#ar-fup', [{ name: 'boda.png', mimeType: 'image/png', buffer: PNG }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');
    await page.click('[data-act=parentdone]');
    await expect(page.locator('.ar-ftile')).toHaveCount(0);
    // the parent opts in to showing living relatives: now the kids see it
    await page.evaluate(async () => {
      // @ts-ignore
      const r = await ArbolDB.get(); r.tree.cfg.living = 1; await ArbolDB.put(r.tree, Date.now()); await Arbol.reload();
    });
    await person(page, LIVING);
    await expect(page.locator('.ar-ftile')).toHaveCount(1);
  });

  test('a file that is neither a photo nor a PDF is refused, and nothing is uploaded offline', async ({ page }) => {
    const server = await open(page);
    await person(page, DEAD);
    await unlock(page);
    await page.setInputFiles('#ar-fup', [{ name: 'page.html', mimeType: 'text/html', buffer: Buffer.from('<b>x</b>') }]);
    await expect(page.locator('.ar-fpanel .ar-warn')).toContainText('not a photo or a PDF');
    expect(Object.keys(server.files)).toHaveLength(0);
    await page.evaluate(() => { /** @type {any} */ (window).CloudSync.online = false; });
    await page.setInputFiles('#ar-fup', [{ name: 'acta.png', mimeType: 'image/png', buffer: PNG }]);
    await expect(page.locator('.ar-fpanel .ar-warn')).toContainText('connected to the family server');
    expect(Object.keys(server.files)).toHaveLength(0);
  });

  test('attached files survive a newer GEDCOM import', async ({ page }) => {
    await open(page);
    await person(page, DEAD);
    await unlock(page);
    await page.setInputFiles('#ar-fup', [{ name: 'retrato.png', mimeType: 'image/png', buffer: PNG }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');
    const r = await page.evaluate(async ([t, id]) => {
      // @ts-ignore
      const cur = await ArbolDB.get();
      // @ts-ignore
      const m = ArbolStore.merge(cur.tree, Gedcom.parse(t.replace('1 NAME Giuseppe /Ejemplo/', '1 NAME Giuseppe Luigi /Ejemplo/')), { file: 'newer.ged' });
      return m.store.P[id].a;
    }, [H.sample(), DEAD]);
    expect(r.files).toHaveLength(1);
    expect(r.files[0].t).toBe('retrato');
  });

  test('phone width: the gallery and the parent panel fit without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await person(page, DEAD);
    await unlock(page);
    await page.fill('#ar-ftitle', 'Un título bastante largo para ver que el texto se ajusta bien en el teléfono');
    await page.setInputFiles('#ar-fup', [{ name: 'a.png', mimeType: 'image/png', buffer: PNG }, { name: 'b.pdf', mimeType: 'application/pdf', buffer: PDF }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('2 saved');
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(390);
  });
});
