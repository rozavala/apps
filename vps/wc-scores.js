/* ================================================================
   ZS-SYNC — World Cup live scores proxy

   ESPN publishes the JSON that powers their own scoreboard pages at
   site.api.espn.com — no API key, no signup, generally minute-by-minute
   updates. The browser can't fetch it directly (CORS), so we proxy it
   server-side and normalize the payload into roughly the OpenFootball
   shape the World Cup app already knows how to consume.

   Mounted at GET /api/wc-scores?dates=YYYYMMDD[,YYYYMMDD...]
   (defaults to today UTC if `dates` is omitted).

   Notes:
   - 60s in-memory cache per date to be kind to upstream during live
     polling — the WC app polls every minute while a match is in play.
   - 15s timeout, 2 MB ceiling. Bad responses are logged and skipped
     rather than 500'ing the whole request when only one date fails.
   - We deliberately only proxy the FIFA World Cup league
     (`soccer/fifa.world`) — no arbitrary URL fetches.
   ================================================================ */

'use strict';

const https = require('https');

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const TTL_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 15 * 1000;
const MAX_BYTES = 2 * 1024 * 1024;

const _cache = new Map(); // dateYYYYMMDD -> { fetchedAt, matches }

function _fetchUpstream(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'ZavalaSerra-WC-Scores/1.0', 'Accept': 'application/json' },
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error('upstream HTTP ' + res.statusCode));
      }
      let size = 0;
      const chunks = [];
      res.on('data', (c) => {
        size += c.length;
        if (size > MAX_BYTES) { req.destroy(new Error('response too large')); return; }
        chunks.push(c);
      });
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    });
    req.setTimeout(FETCH_TIMEOUT_MS, () => req.destroy(new Error('upstream timeout')));
    req.on('error', reject);
  });
}

// Pull the minute integer out of "23'", "45+2'", "90'+5" etc. Defensive
// against ESPN occasionally emitting non-string clock values.
function _minute(clock) {
  if (!clock) return null;
  const s = (clock.displayValue || clock.value || '').toString();
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function _normalizeEvent(ev) {
  const comp = ev && ev.competitions && ev.competitions[0];
  if (!comp || !Array.isArray(comp.competitors)) return null;
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  if (!home || !away || !home.team || !away.team) return null;

  const state = ev.status && ev.status.type && ev.status.type.state; // 'pre' | 'in' | 'post'
  const completed = state === 'post';
  const live = state === 'in';
  const date = (ev.date || '').slice(0, 10);
  const hs = parseInt(home.score, 10);
  const as = parseInt(away.score, 10);

  const goals1 = [], goals2 = [];
  for (const d of (comp.details || [])) {
    if (!d.scoringPlay) continue;
    const ath = (d.athletesInvolved || [])[0];
    if (!ath || !ath.displayName) continue;
    const g = { name: ath.displayName };
    const min = _minute(d.clock);
    if (min !== null) g.minute = min;
    if (d.scoreValue === -1 || (d.type && /own goal/i.test(d.type.text || ''))) {
      g.owngoal = true;
    }
    if (d.team && home.team && d.team.id === home.team.id) goals1.push(g);
    else if (d.team && away.team && d.team.id === away.team.id) goals2.push(g);
  }

  const out = {
    date,
    eventId: ev.id ? String(ev.id) : null,
    team1: home.team.displayName || home.team.name,
    team1_abbr: home.team.abbreviation || null,
    team2: away.team.displayName || away.team.name,
    team2_abbr: away.team.abbreviation || null,
    live,
    completed,
  };
  // Only emit a score once the match is in progress or done — pre-match
  // ESPN sometimes returns "0" placeholders which would otherwise look
  // like a real 0-0 final.
  if (!isNaN(hs) && !isNaN(as) && (completed || live)) {
    out.score = { ft: [hs, as] };
    // Penalty shootout: ESPN puts the shootout tally on each competitor
    // as `shootoutScore`. Surface it as score.p = [home, away] so the
    // client can record the PK winner for a knockout draw.
    const hp = parseInt(home.shootoutScore, 10);
    const ap = parseInt(away.shootoutScore, 10);
    if (!isNaN(hp) && !isNaN(ap) && (hp || ap)) out.score.p = [hp, ap];
  }
  // Definitive advancing side — ESPN flags exactly one competitor with
  // winner:true on a completed knockout match, however it was decided
  // (regulation, extra time, or penalties). This is the source of truth
  // the client uses to set the winner even when full-time is level.
  if (completed) {
    if (home.winner === true) out.winner = 'home';
    else if (away.winner === true) out.winner = 'away';
  }
  if (goals1.length) out.goals1 = goals1;
  if (goals2.length) out.goals2 = goals2;
  return out;
}

async function _matchesForDate(dateStr) {
  const cached = _cache.get(dateStr);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.matches;
  let data;
  try { data = await _fetchUpstream(ESPN_URL + '?dates=' + encodeURIComponent(dateStr)); }
  catch (e) {
    console.warn('[wc-scores]', dateStr, 'upstream fetch failed:', e.message);
    // Serve stale cache if we have one — better than nothing during a hiccup.
    return cached ? cached.matches : [];
  }
  const events = (data && data.events) || [];
  const matches = events.map(_normalizeEvent).filter(Boolean);
  _cache.set(dateStr, { fetchedAt: Date.now(), matches });
  return matches;
}

function _todayUTC() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function init(app) {
  app.get('/api/wc-scores', async (req, res) => {
    try {
      const raw = (req.query.dates || '').toString().trim();
      let dates = raw ? raw.split(',').map((d) => d.trim()).filter((d) => /^\d{8}$/.test(d)) : [];
      if (dates.length === 0) dates = [_todayUTC()];
      if (dates.length > 40) {
        return res.status(400).json({ error: 'at most 40 dates per call' });
      }
      const results = await Promise.all(dates.map((d) => _matchesForDate(d)));
      const matches = [];
      for (const arr of results) for (const m of arr) matches.push(m);
      res.set('Cache-Control', 'no-store');
      res.json({ source: 'espn', fetchedAt: new Date().toISOString(), matches });
    } catch (e) {
      console.error('[wc-scores] handler error:', e);
      res.status(500).json({ error: e.message || 'internal error' });
    }
  });
}

module.exports = { init };
