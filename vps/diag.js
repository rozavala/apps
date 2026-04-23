/* ================================================================
   VPS DIAG MODULE
   Append-only JSONL diag store + admin endpoints.
   Mounted by server.js via diag.init(app, DATA_DIR).

   Storage layout:
     <DATA_DIR>/_diag/diag.jsonl            — rolling JSONL (raw)
     <DATA_DIR>/_diag/lastflush.json        — last cron-push snapshot

   Endpoints:
     POST /api/diag            ingest a batch from the browser
     GET  /api/diag?hours=24   admin-only readout of recent entries
     POST /api/diag/flush      trigger the scrub+push bridge now
     GET  /api/diag/health     small health object

   Access control:
     Because the VPS is Tailscale-only, we trust the transport layer
     for admin endpoints. Ingest is unauthenticated on purpose (any
     tailnet device can post). If you later put the VPS on the open
     internet, wrap /api/diag (POST) with a rate-limiter and wrap
     the admin endpoints with a bearer check.
   ================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const MAX_ENTRIES_PER_BATCH = 200;
const MAX_STACK_CHARS = 4000;
const MAX_MESSAGE_CHARS = 2000;

function init(app, dataDir) {
  const DIAG_DIR = path.join(dataDir, '_diag');
  if (!fs.existsSync(DIAG_DIR)) fs.mkdirSync(DIAG_DIR, { recursive: true });
  const JSONL_PATH = path.join(DIAG_DIR, 'diag.jsonl');

  function _append(entry) {
    // One line of JSON per entry. Crash-safe: partial writes produce
    // one malformed line which the reader skips.
    fs.appendFileSync(JSONL_PATH, JSON.stringify(entry) + '\n');
  }

  function _readSince(ms) {
    if (!fs.existsSync(JSONL_PATH)) return [];
    const out = [];
    const cutoff = Date.now() - ms;
    const data = fs.readFileSync(JSONL_PATH, 'utf8');
    data.split('\n').forEach(line => {
      if (!line) return;
      try {
        const e = JSON.parse(line);
        if (e && e.ts >= cutoff) out.push(e);
      } catch (err) {}
    });
    return out;
  }

  function _clip(s, n) {
    if (typeof s !== 'string') return s;
    return s.length > n ? s.slice(0, n) : s;
  }

  function _sanitiseBatch(body, req) {
    const now = Date.now();
    if (!body || !Array.isArray(body.entries)) return [];
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
    const ua = (req.headers['user-agent'] || '').toString();

    return body.entries.slice(0, MAX_ENTRIES_PER_BATCH).map(e => ({
      id: e && e.id ? String(e.id).slice(0, 40) : undefined,
      clientTs: e && typeof e.ts === 'number' ? e.ts : now,
      serverTs: now,
      ts: now, // canonical timestamp
      kind: e && e.kind ? String(e.kind).slice(0, 40) : 'unknown',
      app: e && e.app ? String(e.app).slice(0, 60) : null,
      page: e && e.page ? String(e.page).slice(0, 120) : null,
      message: _clip(e && e.message ? String(e.message) : '', MAX_MESSAGE_CHARS),
      filename: e && e.filename ? String(e.filename).slice(0, 300) : null,
      lineno: e && typeof e.lineno === 'number' ? e.lineno : null,
      colno: e && typeof e.colno === 'number' ? e.colno : null,
      stack: _clip(e && e.stack ? String(e.stack) : null, MAX_STACK_CHARS),
      profile: e && e.profile ? {
        name: e.profile.name ? String(e.profile.name).slice(0, 60) : null,
        age: typeof e.profile.age === 'number' ? e.profile.age : null,
        isGuest: !!e.profile.isGuest
      } : null,
      ua: e && e.ua ? String(e.ua).slice(0, 400) : ua,
      breadcrumbs: Array.isArray(e && e.breadcrumbs) ? e.breadcrumbs.slice(-10).map(b => ({
        ts: typeof b.ts === 'number' ? b.ts : null,
        label: b && b.label ? String(b.label).slice(0, 80) : null
        // deliberately drop b.data — we cannot guarantee it's scrub-safe
      })) : [],
      _ip: ip
    }));
  }

  // ── Ingest ──
  app.post('/api/diag', (req, res) => {
    try {
      const batch = _sanitiseBatch(req.body, req);
      batch.forEach(_append);
      res.json({ status: 'ok', accepted: batch.length });
    } catch (e) {
      res.status(500).json({ status: 'error', error: e.message });
    }
  });

  // ── Admin readout (Tailscale-trusted) ──
  app.get('/api/diag', (req, res) => {
    const hours = Math.min(Math.max(parseInt(req.query.hours || '24', 10) || 24, 1), 24 * 30);
    const entries = _readSince(hours * 60 * 60 * 1000);
    res.json({ count: entries.length, since_hours: hours, entries });
  });

  // ── Manual flush trigger ──
  // Runs diag-push.js in the same directory. Returns the child's
  // stdout/stderr summary. Fire-and-forget behaviour if the caller
  // doesn't care about the result.
  app.post('/api/diag/flush', (req, res) => {
    const script = path.join(__dirname, 'diag-push.js');
    if (!fs.existsSync(script)) {
      return res.status(500).json({ status: 'error', error: 'diag-push.js missing on VPS' });
    }
    execFile('node', [script], { timeout: 60 * 1000 }, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ status: 'error', error: err.message, stderr: (stderr || '').slice(-2000) });
      res.json({ status: 'ok', stdout: (stdout || '').slice(-2000) });
    });
  });

  app.get('/api/diag/health', (req, res) => {
    let size = 0;
    try { size = fs.statSync(JSONL_PATH).size; } catch (e) {}
    res.json({
      status: 'ok',
      jsonl_bytes: size,
      entries_last_24h: _readSince(24 * 60 * 60 * 1000).length
    });
  });

  console.log('[diag] endpoints mounted at /api/diag');
}

module.exports = { init };
