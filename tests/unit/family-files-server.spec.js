// @ts-check
// vps/family-files.js: the photos and documents attached to people in the
// family tree. Runs the handlers on a bare local http server (127.0.0.1, a
// random port) over a temporary folder; nothing reaches the real server.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const FF = require('../../vps/family-files.js');

const JPEG = Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.alloc(60, 1)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.alloc(40, 2)]);
const PDF = Buffer.from('%PDF-1.4\n% fictional test document\n%%EOF\n');
const HEIC = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(40, 3)]);
const HTML = Buffer.from('<html><script>alert(1)</script></html>');
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
const id = (n) => n.toString(16).padStart(32, '0');

let dir, server, base;
test.beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'family-files-'));
  const h = FF.handlers(FF.create(dir));
  server = http.createServer((req, res) => {
    const m = /^\/api\/files\/arbol\/([^/?]*)$/.exec(req.url || '');
    if (!m) { res.statusCode = 404; return res.end(); }
    /** @type {any} */ (req).params = { id: decodeURIComponent(m[1]) };
    if (req.method === 'PUT') return h.put(req, res);
    if (req.method === 'GET') return h.get(req, res);
    if (req.method === 'DELETE') return h.del(req, res);
    res.statusCode = 405; res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port + '/api/files/arbol/';
});
test.afterAll(async () => {
  await new Promise(r => server.close(r));
  fs.rmSync(dir, { recursive: true, force: true });
});

const put = (i, type, body) => fetch(base + i, { method: 'PUT', headers: { 'Content-Type': type }, body });

test('a photo and a PDF are stored, served back byte for byte, and deleted', async () => {
  for (const [n, type, body] of [[1, 'image/jpeg', JPEG], [2, 'image/png', PNG], [3, 'application/pdf', PDF], [4, 'image/heic', HEIC]]) {
    const r = await put(id(n), type, body);
    expect(r.status, type).toBe(200);
    const g = await fetch(base + id(n));
    expect(g.status).toBe(200);
    expect(g.headers.get('content-type')).toBe(type);
    expect(g.headers.get('x-content-type-options')).toBe('nosniff');
    expect(g.headers.get('content-security-policy')).toContain('sandbox');
    expect(Buffer.from(await g.arrayBuffer()).equals(body)).toBe(true);
  }
  // the files sit in the household folder, not where /api/kids would list them as a kid
  expect(fs.readdirSync(path.join(dir, '_household', 'files')).sort()).toEqual([id(1) + '.jpg', id(2) + '.png', id(3) + '.pdf', id(4) + '.heic']);
  expect(fs.readdirSync(dir)).toEqual(['_household']);
  expect((await (await fetch(base + id(1), { method: 'DELETE' })).json()).status).toBe('deleted');
  expect((await fetch(base + id(1))).status).toBe(404);
  expect((await (await fetch(base + id(1), { method: 'DELETE' })).json()).status).toBe('absent');
});

test('anything that is not a photo or a PDF is refused, even when it claims to be one', async () => {
  expect((await put(id(10), 'text/html', HTML)).status).toBe(415);
  expect((await put(id(11), 'image/svg+xml', SVG)).status).toBe(415);
  expect((await put(id(12), 'image/jpeg', HTML)).status).toBe(415);      // HTML calling itself a JPEG
  expect((await put(id(13), 'application/pdf', SVG)).status).toBe(415);
  expect((await put(id(14), 'image/png', JPEG)).status).toBe(415);       // a JPEG calling itself a PNG
  expect((await fetch(base + id(12))).status).toBe(404);
});

test('ids must be 32 hex characters, so no path can be built from one', async () => {
  for (const bad of ['../../etc/passwd', '..%2F..%2Fx', 'ABCDEF' + '0'.repeat(26), '0'.repeat(31), '0'.repeat(33), 'g'.repeat(32), '']) {
    const r = await put(encodeURIComponent(bad), 'image/jpeg', JPEG);
    expect([400, 404], bad).toContain(r.status);
  }
  expect(FF.create(dir).find('../x')).toBeNull();
});

test('a file is never overwritten, and one over 25 MB is refused', async () => {
  expect((await put(id(20), 'image/jpeg', JPEG)).status).toBe(200);
  expect((await put(id(20), 'image/jpeg', JPEG)).status).toBe(409);
  const big = Buffer.concat([JPEG, Buffer.alloc(FF.MAX_BYTES, 0)]);
  expect((await put(id(21), 'image/jpeg', big)).status).toBe(413);
  expect((await fetch(base + id(21))).status).toBe(404);
});

test('the server registers the three routes', () => {
  const routes = [];
  const app = { put: (p) => routes.push('PUT ' + p), get: (p) => routes.push('GET ' + p), delete: (p) => routes.push('DELETE ' + p) };
  FF.init(app, dir);
  expect(routes).toEqual(['PUT /api/files/arbol/:id', 'GET /api/files/arbol/:id', 'DELETE /api/files/arbol/:id']);
  expect(fs.readFileSync(path.join(__dirname, '../../vps/server.js'), 'utf8')).toContain("familyFiles.init(app, DATA_DIR)");
});
