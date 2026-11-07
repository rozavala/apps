/* ================================================================
   ZS-SYNC — S&P 500 daily closes for Banco Familia

   The family bank values each kid's "S&P 500" money at the real index
   close. Browsers can't fetch market data themselves (CORS, and the
   apps are offline-first), so the server keeps a small table of daily
   closes and the bank page reads it.

     GET /api/market/spx[?since=YYYY-MM-DD]
       -> { symbol: 'SPX', updatedAt, source, prices: { 'YYYY-MM-DD': close } }

   - Two keyless sources, tried in order: Stooq's CSV download and
     Yahoo's chart JSON. Either is enough; if both fail the table we
     already have is served and the parent can type a close in the app.
   - Stored at <DATA_DIR>/_market/spx.json and only ever added to, so an
     upstream hiccup can't erase history. Closes from 2020 on are kept.
   - Refreshed every 6 hours, and on a request when the table is older
     than that (the request never waits for it).
   - Only these two fixed URLs are ever fetched.
   ================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const STOOQ_URL = 'https://stooq.com/q/d/l/?s=%5Espx&i=d';
const YAHOO_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=2y&interval=1d';
const KEEP_FROM = '2020-01-01';
const REFRESH_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 15 * 1000;
const MAX_BYTES = 4 * 1024 * 1024;
const UA = 'ZavalaSerra-Bank/1.0';

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const okClose = (v) => typeof v === 'number' && isFinite(v) && v > 100 && v < 100000;

// Stooq: "Date,Open,High,Low,Close,Volume\n2026-11-06,6712.1,...".
function parseStooq(text) {
  const out = {};
  const lines = String(text || '').trim().split(/\r?\n/);
  if (!lines.length || !/^date,/i.test(lines[0])) return out;
  const cols = lines[0].toLowerCase().split(',');
  const di = cols.indexOf('date'), ci = cols.indexOf('close');
  if (di < 0 || ci < 0) return out;
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(',');
    const d = f[di], c = parseFloat(f[ci]);
    if (isDate(d) && d >= KEEP_FROM && okClose(c)) out[d] = Math.round(c * 100) / 100;
  }
  return out;
}

// Yahoo: chart.result[0].timestamp[] + indicators.quote[0].close[].
// Timestamps are the session open in UTC; New York's date is what we want.
function parseYahoo(json) {
  const out = {};
  const r = json && json.chart && Array.isArray(json.chart.result) && json.chart.result[0];
  if (!r || !Array.isArray(r.timestamp)) return out;
  const q = r.indicators && r.indicators.quote && r.indicators.quote[0];
  const closes = q && Array.isArray(q.close) ? q.close : [];
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  r.timestamp.forEach((t, i) => {
    const c = closes[i];
    if (typeof t !== 'number' || !okClose(c)) return;
    const d = fmt.format(new Date(t * 1000));
    if (isDate(d) && d >= KEEP_FROM) out[d] = Math.round(c * 100) / 100;
  });
  return out;
}

async function _get(url, fetchImpl) {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': UA, 'Accept': '*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error('response too large');
  return text;
}

function create(dataDir, fetchImpl) {
  const dir = path.join(dataDir, '_market');
  const file = path.join(dir, 'spx.json');
  let table = { symbol: 'SPX', updatedAt: null, source: null, prices: {} };
  let inflight = null;

  try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (saved && saved.prices && typeof saved.prices === 'object') table = Object.assign(table, saved);
  } catch (e) { /* first run */ }

  function save() {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(table));
      fs.renameSync(tmp, file);
    } catch (e) { console.warn('[market] save failed:', e.message); }
  }

  async function refresh() {
    if (inflight) return inflight;
    inflight = (async () => {
      const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
      if (!f) return false;
      const tries = [
        ['stooq', async () => parseStooq(await _get(STOOQ_URL, f))],
        ['yahoo', async () => parseYahoo(JSON.parse(await _get(YAHOO_URL, f)))],
      ];
      for (const [name, run] of tries) {
        try {
          const got = await run();
          const n = Object.keys(got).length;
          if (n < 5) throw new Error('only ' + n + ' closes');
          Object.assign(table.prices, got);
          table.updatedAt = new Date().toISOString();
          table.source = name;
          save();
          return true;
        } catch (e) {
          console.warn('[market] ' + name + ' failed:', e.message);
        }
      }
      return false;
    })();
    try { return await inflight; } finally { inflight = null; }
  }

  function stale() {
    return !table.updatedAt || Date.now() - Date.parse(table.updatedAt) > REFRESH_MS;
  }

  function read(since) {
    const prices = {};
    Object.keys(table.prices).sort().forEach((d) => {
      if (!since || d >= since) prices[d] = table.prices[d];
    });
    return { symbol: 'SPX', updatedAt: table.updatedAt, source: table.source, prices };
  }

  return { refresh, stale, read, _table: () => table };
}

function init(app, dataDir) {
  const m = create(dataDir);
  app.get('/api/market/spx', (req, res) => {
    const since = isDate(req.query.since) ? req.query.since : null;
    if (m.stale()) m.refresh().catch(() => {});
    res.set('Cache-Control', 'no-store');
    res.json(m.read(since));
  });
  // First fill shortly after start, then every 6 hours.
  setTimeout(() => m.refresh().catch(() => {}), 5000).unref();
  setInterval(() => m.refresh().catch(() => {}), REFRESH_MS).unref();
  return m;
}

module.exports = { init, create, parseStooq, parseYahoo };
