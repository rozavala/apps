/* ================================================================
   FAMILY FILES — photos and documents attached to people in the
   family tree (Árbol familiar).

   A parent attaches pictures or scanned documents (a marriage or
   baptism record, a letter) to a person. The tree itself only keeps a
   list of { id, type, title, ... } per person (synced like the rest of
   the tree); the files live here, one file per id, under
     data/_household/files/<id>.<ext>
   (inside the household folder, so /api/kids never lists it as a kid,
   and its .json listing never picks the files up).

     PUT    /api/files/arbol/:id   raw body, Content-Type one of TYPES
     GET    /api/files/arbol/:id   the file
     DELETE /api/files/arbol/:id

   Safety:
     - ids are 32 lowercase hex characters made by the client, so a path
       can never be built from anything else;
     - only JPEG, PNG, WebP, HEIC/HEIF and PDF are accepted, and the first
       bytes must match the declared type (an HTML or SVG file can never
       be stored, so nothing stored can run script);
     - each file is at most 25 MB, and the folder at most 5 GB;
     - a file is never overwritten (ids are random; a repeat is a 409);
     - files are served with nosniff and a sandbox CSP, as attachments
       for anything but images and PDFs (which is all there is).
   Like the rest of this server, it is reachable only over the tailnet.
   ================================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL = 5 * 1024 * 1024 * 1024;
const ID_RE = /^[a-f0-9]{32}$/;
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf'
};
const EXT_TYPE = Object.fromEntries(Object.entries(TYPES).map(([t, e]) => [e, t]));

// Does the start of the file look like the declared type?
function sniff(type, buf) {
  if (!buf || buf.length < 12) return false;
  const ascii = (a, b) => buf.slice(a, b).toString('latin1');
  switch (type) {
    case 'image/jpeg': return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    case 'image/png': return buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    case 'image/webp': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'image/heic':
    case 'image/heif': return ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1|avif)$/.test(ascii(8, 12));
    case 'application/pdf': return ascii(0, 5) === '%PDF-';
    default: return false;
  }
}

function create(dataDir) {
  const DIR = path.join(dataDir, '_household', 'files');

  function ensureDir() { if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true }); }
  function find(id) {
    if (!ID_RE.test(id)) return null;
    for (const ext of Object.values(TYPES)) {
      const p = path.join(DIR, id + '.' + ext);
      if (fs.existsSync(p)) return { path: p, type: EXT_TYPE[ext] };
    }
    return null;
  }
  function total() {
    if (!fs.existsSync(DIR)) return 0;
    return fs.readdirSync(DIR).reduce((n, f) => { try { return n + fs.statSync(path.join(DIR, f)).size; } catch (e) { return n; } }, 0);
  }

  // Store a file. Returns { status, body }.
  function save(id, type, buf) {
    type = String(type || '').split(';')[0].trim().toLowerCase();
    if (!ID_RE.test(String(id))) return { status: 400, body: { error: 'bad id' } };
    if (!TYPES[type]) return { status: 415, body: { error: 'only photos (JPEG, PNG, WebP, HEIC) and PDF documents' } };
    if (!buf || !buf.length) return { status: 400, body: { error: 'empty file' } };
    if (buf.length > MAX_BYTES) return { status: 413, body: { error: 'file too large' } };
    if (!sniff(type, buf)) return { status: 415, body: { error: 'the file does not match its type' } };
    if (find(id)) return { status: 409, body: { error: 'exists' } };
    if (total() + buf.length > MAX_TOTAL) return { status: 507, body: { error: 'no space left for family files' } };
    ensureDir();
    const p = path.join(DIR, id + '.' + TYPES[type]);
    const tmp = p + '.part';
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, p);
    return { status: 200, body: { status: 'saved', id, type, size: buf.length } };
  }

  function read(id) {
    const f = find(String(id));
    if (!f) return null;
    return { type: f.type, data: fs.readFileSync(f.path) };
  }

  function remove(id) {
    const f = find(String(id));
    if (!f) return false;
    fs.unlinkSync(f.path);
    return true;
  }

  return { save, read, remove, find, DIR };
}

// Read a raw request body, refusing past `limit` bytes. Resolves a Buffer, or null when too large.
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] || 0);
    if (declared > limit) { resolve(null); req.resume(); return; }
    const chunks = []; let n = 0, over = false;
    req.on('data', (c) => {
      if (over) return;
      n += c.length;
      if (n > limit) { over = true; chunks.length = 0; return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(over ? null : Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// Handlers in plain Node terms (req.params.id, res.statusCode/setHeader/end), so they run under
// express and under a bare http server in the tests alike.
function handlers(store) {
  return {
    put: async (req, res) => {
      try {
        const buf = await readBody(req, MAX_BYTES);
        if (buf === null) return send(res, 413, { error: 'file too large' });
        const r = store.save(req.params.id, req.headers['content-type'], buf);
        send(res, r.status, r.body);
      } catch (e) { send(res, 500, { error: 'could not save' }); }
    },
    get: (req, res) => {
      const f = store.read(req.params.id);
      if (!f) return send(res, 404, { error: 'not found' });
      res.statusCode = 200;
      res.setHeader('Content-Type', f.type);
      res.setHeader('Content-Length', f.data.length);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; object-src 'self'");
      res.setHeader('Content-Disposition', 'inline');
      // ids are never reused, so a file never changes
      res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
      res.end(f.data);
    },
    del: (req, res) => {
      if (!ID_RE.test(String(req.params.id))) return send(res, 400, { error: 'bad id' });
      send(res, 200, { status: store.remove(req.params.id) ? 'deleted' : 'absent' });
    }
  };
}

function init(app, dataDir) {
  const h = handlers(create(dataDir));
  app.put('/api/files/arbol/:id', h.put);
  app.get('/api/files/arbol/:id', h.get);
  app.delete('/api/files/arbol/:id', h.del);
}

module.exports = { init, create, handlers, sniff, TYPES, MAX_BYTES, ID_RE };
