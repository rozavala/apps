/* ================================================================
   ZS-SYNC — iCal proxy (#150)

   Browsers can't fetch most iCal hosts (Google Calendar, iCloud,
   Outlook) directly because those hosts don't return CORS headers.
   This module proxies the request server-side and re-emits the body
   with permissive CORS so Family Calendar in the suite can read it.

   Mounted at GET /api/ical?url=<encoded-ics-url>.

   Safety:
   - Allowlist of hosts (extend as needed). No arbitrary URL fetches.
   - https only (no http/file/ftp/etc).
   - 30s timeout, 5 MB ceiling.
   - 5-minute in-memory response cache to be kind to upstream.

   No persistent storage (we don't want a copy of your calendar
   floating around the box).
   ================================================================ */

'use strict';

const ALLOWED_HOSTS = [
  // Google Calendar
  /^calendar\.google\.com$/,
  /^www\.google\.com$/,         // older /calendar/ical paths
  // Apple iCloud
  /^p[0-9]+-caldav\.icloud\.com$/,
  /\.icloud\.com$/,
  // Microsoft Outlook
  /^outlook\.live\.com$/,
  /^outlook\.office365\.com$/,
  /\.office365\.com$/,
  /\.outlook\.com$/
];

const TTL_MS = 5 * 60 * 1000;       // 5 minutes
const FETCH_TIMEOUT_MS = 30 * 1000; // 30 seconds
const MAX_BYTES = 5 * 1024 * 1024;  // 5 MB

const _cache = new Map(); // url -> { fetchedAt, status, body }

function _hostAllowed(hostname) {
  return ALLOWED_HOSTS.some(rx => rx.test(hostname));
}

function _validate(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return { ok: false, reason: 'missing url' };
  let u;
  try { u = new URL(rawUrl); } catch { return { ok: false, reason: 'invalid url' }; }
  if (u.protocol !== 'https:') return { ok: false, reason: 'only https is allowed' };
  if (!_hostAllowed(u.hostname)) return { ok: false, reason: 'host not on allowlist' };
  return { ok: true, url: u.toString() };
}

async function _fetchUpstream(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ZavalaSerra-iCal-Proxy/1.0',
        'Accept': 'text/calendar, text/plain, */*'
      }
    });
    if (!res.ok) {
      return { status: res.status, body: '' };
    }
    // Cap the body so a hostile/oversized response can't OOM us.
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    let body = '';
    let bytes = 0;
    if (reader) {
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > MAX_BYTES) {
          try { reader.cancel(); } catch (e) {}
          return { status: 413, body: '' };
        }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
    } else {
      body = await res.text();
      if (body.length > MAX_BYTES) return { status: 413, body: '' };
    }
    return { status: 200, body };
  } finally {
    clearTimeout(timer);
  }
}

function init(app) {
  app.get('/api/ical', async (req, res) => {
    const check = _validate(req.query.url);
    if (!check.ok) {
      return res.status(400).json({ error: check.reason });
    }
    const url = check.url;
    const now = Date.now();

    // Serve from cache when fresh.
    const cached = _cache.get(url);
    if (cached && (now - cached.fetchedAt) < TTL_MS) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Cache', 'HIT');
      res.type('text/calendar; charset=utf-8');
      return res.status(cached.status || 200).send(cached.body);
    }

    try {
      const upstream = await _fetchUpstream(url);
      _cache.set(url, { fetchedAt: now, status: upstream.status, body: upstream.body });
      // Trim cache so it can't grow without bound.
      if (_cache.size > 64) {
        const oldestKey = _cache.keys().next().value;
        if (oldestKey) _cache.delete(oldestKey);
      }
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Cache', 'MISS');
      res.type('text/calendar; charset=utf-8');
      return res.status(upstream.status).send(upstream.body);
    } catch (e) {
      const msg = e && e.name === 'AbortError' ? 'upstream timed out' : (e && e.message) || 'fetch failed';
      return res.status(502).json({ error: msg });
    }
  });
}

module.exports = { init };
