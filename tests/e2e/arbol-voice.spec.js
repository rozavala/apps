// @ts-check
// Árbol familiar: voice notes (a grandparent telling a story), on the FICTIONAL
// sample family (tests/helpers/gedcom-samples.js). The microphone is a test tone
// made in the page, and the family server is a fake one inside the test (never
// the real one, whose host is route-aborted).
const { test, expect } = require('@playwright/test');
const H = require('../helpers/gedcom-samples.js');
const FF = require('../../vps/family-files.js');   // the real server's checks

const FAKE = 'http://sync.test';
const GRANDMA = 'I12';   // Marta, living (Lucía's grandmother)
const GRANDPA = 'I11';   // Alberto, died 2019
// the first bytes of an .m4a (Voice Memos), then silence: nothing real
const M4A = Buffer.concat([Buffer.from([0, 0, 0, 28]), Buffer.from('ftypM4A '), Buffer.alloc(200, 0)]);

async function open(page, o = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  const server = { files: {}, items: {}, failPut: false, puts: 0 };
  await page.route(FAKE + '/**', async (route) => {
    const req = route.request(), u = new URL(req.url());
    let m = /^\/api\/files\/arbol\/([a-f0-9]{32})$/.exec(u.pathname);
    if (m) {
      const id = m[1];
      if (req.method() === 'PUT') {
        if (server.failPut) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"x"}' });
        // what the real server would refuse, this one refuses too
        const type = String(req.headers()['content-type'] || '').split(';')[0];
        if (!FF.TYPES[type] || !FF.sniff(type, req.postDataBuffer())) { server.refused = (server.refused || 0) + 1; return route.fulfill({ status: 415, contentType: 'application/json', body: '{"error":"type"}' }); }
        server.puts++;
        server.files[id] = { type: req.headers()['content-type'], body: req.postDataBuffer() };
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"saved"}' });
      }
      if (req.method() === 'DELETE') {
        if (server.failDelete) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"x"}' });
        delete server.files[id]; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"deleted"}' });
      }
      const f = server.files[id];
      return f ? route.fulfill({ status: 200, contentType: f.type.split(';')[0], body: f.body, headers: { 'Access-Control-Allow-Origin': '*' } }) : route.fulfill({ status: 404, body: '' });
    }
    m = /^\/api\/kids\/([^/]+)\/([^/]+)$/.exec(u.pathname);
    if (m && req.method() === 'PUT') { server.items[m[1] + '/' + m[2]] = JSON.parse(req.postData() || 'null'); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"saved"}' }); }
    if (m) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(server.items[m[1] + '/' + m[2]] || null) });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.addInitScript(([age, mic]) => {
    const p = { name: 'Lucia', color: 'blue', age, avatar: '🦊', lang: 'en' };
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
    // the microphone: a soft test tone, or a refusal
    const md = navigator.mediaDevices || /** @type {any} */ ({});
    md.getUserMedia = async () => {
      if (mic === 'denied') throw new DOMException('no', 'NotAllowedError');
      const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain(), dest = ctx.createMediaStreamDestination();
      osc.frequency.value = 220; gain.gain.value = 0.3; osc.connect(gain); gain.connect(dest); osc.start();
      return dest.stream;
    };
    if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { value: md });
    // an older Chrome: WebM only
    if (mic === 'webm') { const real = MediaRecorder.isTypeSupported.bind(MediaRecorder); MediaRecorder.isTypeSupported = (t) => !/mp4/.test(t) && real(t); }
  }, [o.age || 10, o.mic || 'ok']);
  await page.goto('/arbol-familiar.html');
  await page.evaluate(async ([t, url, voice]) => {
    // @ts-ignore
    const r = ArbolStore.merge(null, Gedcom.parse(t), { file: 'sample.ged' }); r.store.cfg.map = { lucia: 'I24' };
    for (const [pid, list] of Object.entries(voice || {})) r.store.P[pid].a = { voice: list };
    // @ts-ignore
    await ArbolDB.put(r.store, Date.now());
    /** @type {any} */ const c = window.CloudSync; c.server = url;
    // stays "connected" (sync.js's retry pings, refused under automation, would set it back to false)
    Object.defineProperty(c, 'online', { configurable: true, get: () => !window.__offline, set: () => {} });
    // @ts-ignore
    await Arbol.reload();
  }, [H.sample(), FAKE, o.voice || null]);
  return server;
}
async function person(page, id) {
  await page.evaluate((id) => { const b = document.createElement('button'); b.setAttribute('data-act', 'person'); b.setAttribute('data-id', id); document.getElementById('ar-wrap').appendChild(b); b.click(); }, id);
  await expect(page.locator('.ar-person')).toBeVisible();
}
// @ts-ignore
const voiceOf = (page, id) => page.evaluate((id) => (Arbol.tree().P[id].a || {}).voice || [], id);
const note = (id, extra = {}) => Object.assign({ id: id.padStart(32, '0'), type: 'audio/webm', t: 'When I was little', by: '', who: '', dur: 75, w: '135797531357975313579753135797531357975313579753', kids: 1, ts: Date.UTC(2026, 10, 1) }, extra);

async function record(page, ms = 1300) {
  await page.click('[data-act=vstart]');
  await expect(page.locator('#ar-vmeter')).toBeVisible();
  await expect.poll(() => page.locator('#ar-vtime').textContent()).not.toBe('');
  await page.waitForTimeout(ms);          // a recording takes real time (not the network)
  await page.click('[data-act=vstop]');
  await expect(page.locator('[data-act=vsave]')).toBeVisible();
}

test.describe('Árbol familiar: voice notes', () => {
  test('a kid records Grandma telling a story: it goes to the family server and is attached to her', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDMA);
    await expect(page.locator('.ar-h3', { hasText: 'Record their story' })).toBeVisible();
    await page.click('[data-act=vrec]');
    const dlg = page.locator('.ar-vrec[role=dialog]');
    await expect(dlg).toBeVisible();
    // story starters for a living grandmother, one with her husband's name
    await expect(dlg.locator('.ar-vprompt')).toHaveCount(8);
    await expect(dlg.locator('.ar-vprompt', { hasText: 'How did you meet Alberto?' })).toBeVisible();
    await dlg.locator('.ar-vprompt').first().click();
    await expect(dlg.locator('.ar-vprompt').first()).toHaveAttribute('aria-checked', 'true');
    await record(page);
    await expect(page.locator('#ar-vtitle')).toHaveValue('What was your home like when you were little?');
    await page.fill('#ar-vtitle', 'Grandma’s house in Mendoza');
    await page.click('[data-act=vsave]');
    await expect(dlg).toHaveCount(0);

    const v = await voiceOf(page, GRANDMA);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ t: 'Grandma’s house in Mendoza', by: 'lucia', who: 'Lucia', kids: 1 });
    expect(['audio/mp4', 'audio/webm']).toContain(v[0].type);
    expect(v[0].dur).toBeGreaterThanOrEqual(1);
    expect(v[0].w).toMatch(/^[0-9]{48}$/);
    expect(v[0].w).not.toBe('0'.repeat(48));                 // the tone was heard
    // the recording is on the server, a real audio file the real server accepts; the tree keeps only the list
    const f = server.files[v[0].id];
    expect(f.type).toBe(v[0].type);
    expect(FF.sniff(v[0].type, f.body)).toBe(true);
    expect(server.refused || 0).toBe(0);
    expect(v[0].size).toBe(f.body.length);
    test.info().annotations.push({ type: 'recording', description: `${v[0].type}, ${f.body.length} bytes, starts ${f.body.subarray(0, 12).toString('latin1').replace(/[^ -~]/g, '.')}` });
    await expect.poll(() => (server.items['_household/family_tree'] || {}).people).toBe(30);

    // it shows on her page, and plays from the server
    const card = page.locator('.ar-vnote', { hasText: 'Grandma’s house in Mendoza' });
    await expect(card).toContainText('recorded by Lucia');
    await card.locator('[data-act=vplay]').click();
    await expect(card).toHaveClass(/playing/);
    await expect(card.locator('[data-act=vplay]')).toHaveAttribute('aria-pressed', 'true');
    await card.locator('[data-act=vplay]').click();
    await expect(card).not.toHaveClass(/playing/);
    // the kid may delete their own recording
    await expect(card.locator('[data-act=vdel]')).toBeVisible();
  });

  test('a browser that records only WebM stores WebM, which the server accepts', async ({ page }) => {
    const server = await open(page, { mic: 'webm' });
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    await record(page, 800);
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
    const v = await voiceOf(page, GRANDMA);
    expect(v[0].type).toBe('audio/webm');
    expect([...server.files[v[0].id].body.subarray(0, 4)]).toEqual([0x1A, 0x45, 0xDF, 0xA3]);
    expect(server.refused || 0).toBe(0);
  });

  test('a recording of someone who has died is "a memory of" them; the take can be heard before saving and recorded again', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDPA);
    await page.click('[data-act=vrec]');
    await expect(page.locator('.ar-vrec h2')).toContainText('A memory of Alberto');
    await expect(page.locator('.ar-vprompt', { hasText: 'A story Alberto used to tell' })).toBeVisible();
    await record(page);
    await page.click('[data-act=vpreview]');
    await expect(page.locator('.ar-vnote.take')).toHaveClass(/playing/);
    await page.click('[data-act=vredo]');
    await expect(page.locator('[data-act=vstart]')).toBeVisible();
    expect(Object.keys(server.files)).toHaveLength(0);           // nothing uploaded for a take thrown away
    // leaving with an unsaved take asks first
    await record(page, 600);
    await page.click('[data-act=vcancel]');
    await page.click('.zsd-ok');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
    expect(Object.keys(server.files)).toHaveLength(0);
    expect(await voiceOf(page, GRANDPA)).toHaveLength(0);
  });

  test('offline, or when the server fails, nothing is lost: the take waits to be saved', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    await page.evaluate(() => { /** @type {any} */ (window).__offline = true; });
    await page.click('[data-act=vstart]');
    await expect(page.locator('.ar-vrec .ar-warn')).toContainText('Connect this device to the family server first');
    await page.evaluate(() => { /** @type {any} */ (window).__offline = false; });
    await record(page);
    server.failPut = true;
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec .ar-warn')).toContainText('The recording is still here');
    expect(await voiceOf(page, GRANDMA)).toHaveLength(0);
    server.failPut = false;
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
    expect(await voiceOf(page, GRANDMA)).toHaveLength(1);
    expect(server.puts).toBe(1);
  });

  test('a note saved on another device while this one records is kept: both notes end up in the tree', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    // another iPad saves a note for Grandpa and uploads the tree
    await page.evaluate(async ([pid, n]) => {
      // @ts-ignore
      const cur = await ArbolDB.get();
      const t = JSON.parse(JSON.stringify(cur.tree));
      t.P[pid].a = { voice: [n] };
      // @ts-ignore
      await ArbolSync.push(t, cur.ts + 5000);
    }, [GRANDPA, note('d1', { t: 'From the other iPad' })]);
    // this page hears of it (as after a household sync) while the recorder is open
    await page.evaluate(() => window.dispatchEvent(new Event('zs:household-synced')));
    await expect.poll(() => page.evaluate(() => ArbolDB.get().then(r => !!(r.tree.P.I11.a && r.tree.P.I11.a.voice)))).toBe(true);
    await record(page, 700);
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
    expect(await voiceOf(page, GRANDMA)).toHaveLength(1);
    expect((await voiceOf(page, GRANDPA)).map(x => x.t)).toEqual(['From the other iPad']);
    // and the server's copy has both
    // (the upload runs after the save; until it is done the pieces do not match yet)
    await expect.poll(() => page.evaluate(() => ArbolSync.pull(0).then(r => [r.tree.P.I12.a.voice.length, r.tree.P.I11.a.voice.length], () => null))).toEqual([1, 1]);
    expect(server.refused || 0).toBe(0);
  });

  test('when the tree cannot be saved, a retry reuses the uploaded recording: one file on the server, one note', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    await record(page, 700);
    // this device's store refuses the first save
    await page.evaluate(() => {
      // @ts-ignore
      const real = ArbolDB.put; let n = 0;
      // @ts-ignore
      ArbolDB.put = function() { return n++ === 0 ? Promise.reject(new Error('quota')) : real.apply(this, arguments); };
    });
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec .ar-warn')).toContainText('The recording is still here');
    expect(await voiceOf(page, GRANDMA)).toHaveLength(0);
    expect(server.puts).toBe(1);
    await page.fill('#ar-vtitle', 'Second try');
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
    const v = await voiceOf(page, GRANDMA);
    expect(v).toHaveLength(1);
    expect(v[0].t).toBe('Second try');
    expect(server.puts).toBe(1);                                    // uploaded once
    expect(Object.keys(server.files)).toEqual([v[0].id]);
  });

  test('a recording thrown away after a failed save leaves no file behind', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    await record(page, 600);
    // @ts-ignore
    await page.evaluate(() => { ArbolDB.put = () => Promise.reject(new Error('quota')); });
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec .ar-warn')).toContainText('The recording is still here');
    expect(Object.keys(server.files)).toHaveLength(1);
    await page.click('[data-act=vredo]');
    await expect.poll(() => Object.keys(server.files).length).toBe(0);
  });

  test('if a parent deleted the tree on another device, saving a note does not bring the tree back', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    await record(page, 600);
    // another device deletes the tree: an "empty" manifest, newer than this one
    // @ts-ignore
    await page.evaluate(() => ArbolDB.get().then(r => ArbolSync.push(null, r.ts + 5000)));
    await page.click('[data-act=vsave]');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
    await expect(page.locator('#ar-wrap')).toContainText('Ask a grown-up');
    expect((server.items['_household/family_tree'] || {}).empty).toBe(1);   // still deleted on the server
    // @ts-ignore
    expect(await page.evaluate(() => ArbolDB.get())).toBeNull();
    await expect.poll(() => Object.keys(server.files).length).toBe(0);       // and the uploaded file is gone too
  });

  test('a note whose file cannot be deleted from the server stays, with a message', async ({ page }) => {
    const server = await open(page, { voice: { [GRANDMA]: [note('e1', { t: 'Mine', by: 'lucia', who: 'Lucia' })] } });
    const fid = 'e1'.padStart(32, '0');
    server.files[fid] = { type: 'audio/webm', body: Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0]) };
    await person(page, GRANDMA);
    server.failDelete = true;
    await page.locator('.ar-vnote [data-act=vdel]').click();
    await page.click('.zsd-ok');
    await expect(page.locator('.zsd-toast')).toContainText('could not be deleted');
    expect(await voiceOf(page, GRANDMA)).toHaveLength(1);
    await expect(page.locator('.ar-vnote')).toHaveCount(1);
    // offline: refused at once, nothing changes
    await page.evaluate(() => { /** @type {any} */ (window).__offline = true; });
    await page.locator('.ar-vnote [data-act=vdel]').click();
    await page.click('.zsd-ok');
    expect(await voiceOf(page, GRANDMA)).toHaveLength(1);
    // back online, the server answers: deleted from both
    await page.evaluate(() => { /** @type {any} */ (window).__offline = false; });
    server.failDelete = false;
    await page.locator('.ar-vnote [data-act=vdel]').click();
    await page.click('.zsd-ok');
    await expect.poll(async () => (await voiceOf(page, GRANDMA)).length).toBe(0);
    expect(server.files[fid]).toBeUndefined();
  });

  test('a blocked microphone says how to allow it', async ({ page }) => {
    await open(page, { mic: 'denied' });
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    await page.click('[data-act=vstart]');
    await expect(page.locator('.ar-vrec .ar-warn')).toContainText('Settings › Safari › Microphone');
    await expect(page.locator('[data-act=vstart]')).toBeVisible();
  });

  test('the little ones listen with big buttons and do not record; a "parents only" note stays hidden', async ({ page }) => {
    await open(page, { age: 5, voice: { [GRANDMA]: [note('a1'), note('a2', { t: 'For the grown-ups', kids: 0 })] } });
    // Home: the family voices card, and Grandma's tile shows she has a recording
    await expect(page.locator('[data-to=voices]')).toBeVisible();
    await page.click('[data-to=tree]');
    const tile = page.locator('.ar-big[data-id=' + GRANDMA + ']');
    await expect(tile.locator('.ar-vbadge')).toBeVisible();
    await expect(tile).toHaveAttribute('aria-label', /has recordings/);
    await tile.click();
    await expect(page.locator('.ar-vnote')).toHaveCount(1);
    await expect(page.locator('.ar-vnote.big')).toContainText('When I was little');
    const box = await page.locator('.ar-vnote.big .ar-vplay').boundingBox();
    expect(box && box.width).toBeGreaterThanOrEqual(72);
    await expect(page.locator('[data-act=vrec]')).toHaveCount(0);
    await expect(page.locator('[data-act=vdel]')).toHaveCount(0);
    await expect(page.locator('#ar-wrap')).not.toContainText('For the grown-ups');
  });

  test('parents can hide, show and delete any note; a kid deletes only their own', async ({ page }) => {
    const server = await open(page, { voice: { [GRANDMA]: [note('b1', { by: 'mateo', who: 'Mateo' }), note('b2', { t: 'Mine', by: 'lucia', who: 'Lucia', ts: Date.UTC(2026, 10, 2) })] } });
    server.files['b1'.padStart(32, '0')] = { type: 'audio/webm', body: Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0]) };
    await person(page, GRANDMA);
    const mine = page.locator('.ar-vnote', { hasText: 'Mine' }), his = page.locator('.ar-vnote', { hasText: 'When I was little' });
    await expect(page.locator('.ar-vnote').first()).toContainText('Mine');       // newest first
    await expect(his.locator('[data-act=vdel]')).toHaveCount(0);
    await expect(mine.locator('[data-act=vdel]')).toHaveCount(1);
    // parent mode: hide Mateo's note from the kids, then delete it
    await page.click('[data-act=fileunlock]');
    await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
    const row = page.locator('.ar-fpanel li', { hasText: 'When I was little' });
    await row.locator('.ar-vkids').uncheck();
    await expect.poll(async () => (await voiceOf(page, GRANDMA)).find(x => x.by === 'mateo').kids).toBe(0);
    await page.click('[data-act=parentdone]');
    await expect(page.locator('.ar-vnote')).toHaveCount(1);
    await page.click('[data-act=fileunlock]');
    await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
    await page.locator('.ar-fpanel li', { hasText: 'When I was little' }).locator('[data-act=vdel]').click();
    await page.click('.zsd-ok');
    await expect.poll(async () => (await voiceOf(page, GRANDMA)).length).toBe(1);
    expect(server.files['b1'.padStart(32, '0')]).toBeUndefined();
  });

  test('a parent uploads a Voice Memos file (.m4a) as a note; notes survive a newer GEDCOM import', async ({ page }) => {
    const server = await open(page);
    await person(page, GRANDPA);
    await page.click('[data-act=fileunlock]');
    await page.fill('.zsd-input', '1234'); await page.keyboard.press('Enter');
    await page.fill('#ar-ftitle', 'Grandpa sings');
    await page.setInputFiles('#ar-fup', [{ name: 'Recording 12.m4a', mimeType: 'audio/x-m4a', buffer: M4A }]);
    await expect(page.locator('.ar-fpanel [role=status]')).toContainText('1 saved');
    const v = await voiceOf(page, GRANDPA);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ t: 'Grandpa sings', type: 'audio/mp4', by: '', kids: 1 });
    expect(server.files[v[0].id].type).toBe('audio/mp4');
    await expect(page.locator('.ar-fpanel li', { hasText: 'Grandpa sings' })).toBeVisible();
    await expect(page.locator('.ar-vnote', { hasText: 'Grandpa sings' })).toContainText('recorded by a parent');
    const kept = await page.evaluate(async ([t, id]) => {
      // @ts-ignore
      const cur = await ArbolDB.get();
      // @ts-ignore
      const m = ArbolStore.merge(cur.tree, Gedcom.parse(t.replace('1 NAME Alberto /Ejemplo/', '1 NAME Alberto José /Ejemplo/')), { file: 'newer.ged' });
      return m.store.P[id].a.voice;
    }, [H.sample(), GRANDPA]);
    expect(kept).toEqual(v);
  });

  test('Family voices: every recording grouped by person, and recording from there', async ({ page }) => {
    await open(page, { voice: { [GRANDMA]: [note('c1')], [GRANDPA]: [note('c2', { t: 'The war years' })] } });
    await page.click('[data-to=voices]');
    await expect(page.locator('.ar-vgroup')).toHaveCount(2);
    await expect(page.locator('.ar-vgroup', { hasText: 'Marta' })).toContainText('When I was little');
    await expect(page.locator('.ar-vgroup', { hasText: 'Alberto' })).toContainText('The war years');
    await page.locator('[data-act=vrecfor][data-id=' + GRANDMA + ']').click();
    await expect(page.locator('.ar-person')).toBeVisible();
    await expect(page.locator('.ar-vrec h2')).toContainText('A story from Marta');
    await page.keyboard.press('Escape');
    await expect(page.locator('.ar-vrec')).toHaveCount(0);
  });

  test('works at phone width: the recorder fits and its buttons are big enough to tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await person(page, GRANDMA);
    await page.click('[data-act=vrec]');
    const panel = await page.locator('.ar-vpanel').boundingBox();
    expect(panel && panel.x).toBeGreaterThanOrEqual(0);
    expect(panel && panel.x + panel.width).toBeLessThanOrEqual(390);
    for (const sel of ['[data-act=vstart]', '.ar-vprompt >> nth=0', '[data-act=vcancel]']) {
      const b = await page.locator(sel).boundingBox();
      expect(b && Math.min(b.width, b.height), sel).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
