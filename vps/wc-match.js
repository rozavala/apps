/* ================================================================
   ZS-SYNC — Per-match summary proxy (ESPN summary?event=)

   The scoreboard endpoint (wc-scores.js) is fast and lightweight but
   stops carrying play-by-play after a few days — older matches lose
   their `competitions[0].details` scoring entries entirely. The
   summary?event=ID endpoint keeps full per-match detail for every
   game throughout the tournament, including:
     - goal scorers (name, minute, own-goal flag)
     - yellow / red cards (player, team, minute)
     - basic stats (when present in summary.boxscore.teams.statistics)

   This proxy is fetched ON DEMAND when the user opens the match
   modal, so the per-minute auto-poll (wc-scores.js) doesn't pay
   the extra round trip during live polling.

   Mounted at GET /api/wc-match?eventId=NNN

   Cache: 5 minutes per event id. The match modal opens infrequently
   enough that a short TTL is fine, and live matches still get
   refreshed roughly per-modal-open.
   ================================================================ */

'use strict';

const https = require('https');

const ESPN_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15 * 1000;
const MAX_BYTES = 4 * 1024 * 1024;

const _cache = new Map(); // eventId -> { fetchedAt, payload }

function _fetchUpstream(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'ZavalaSerra-WC-Match/1.0', 'Accept': 'application/json' },
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

// Pull a minute integer out of "23'", "45+2", "90+5'" etc.
function _minute(clock) {
  if (!clock) return null;
  const s = (clock.displayValue || clock.value || '').toString();
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// Walk the summary's plays / scoringPlays / keyEvents block, return
// { homeTeamId, awayTeamId, goals: [{teamId, name, minute, owngoal?, penalty?}],
//   cards: [{teamId, name, minute, color}] }.
function _extract(summary) {
  const out = { homeTeamId: null, awayTeamId: null, goals: [], cards: [] };
  const header = summary && summary.header;
  const competition = header && Array.isArray(header.competitions) ? header.competitions[0] : null;
  if (!competition || !Array.isArray(competition.competitors)) return out;
  const home = competition.competitors.find(c => c.homeAway === 'home');
  const away = competition.competitors.find(c => c.homeAway === 'away');
  out.homeTeamId = home && home.team ? String(home.team.id) : null;
  out.awayTeamId = away && away.team ? String(away.team.id) : null;

  // ESPN exposes per-match events under a few field names depending on
  // the sport/season — accept them all and de-duplicate by (id, minute, type).
  const sources = []
    .concat(Array.isArray(summary.keyEvents)        ? summary.keyEvents        : [])
    .concat(Array.isArray(summary.scoringPlays)     ? summary.scoringPlays     : [])
    .concat(Array.isArray(summary.plays)            ? summary.plays            : [])
    .concat(competition && Array.isArray(competition.details) ? competition.details : []);

  const seenGoals = new Set();
  const seenCards = new Set();

  for (const ev of sources) {
    if (!ev || !ev.type) continue;
    const ath = (ev.athletesInvolved || ev.athlete || [])[0] || ev.athlete || null;
    const name = ath && (ath.displayName || ath.fullName || ath.name) ? (ath.displayName || ath.fullName || ath.name) : null;
    if (!name) continue;
    const teamId = ev.team && ev.team.id ? String(ev.team.id) : null;
    const minute = _minute(ev.clock);
    const text = (ev.type.text || ev.type.name || '').toLowerCase();
    const tid  = (ev.type.id || '').toString();

    const isGoal = /goal/.test(text) && !/disallowed|missed/.test(text);
    const isOwn  = /own goal/.test(text) || ev.scoreValue === -1;
    const isPen  = /penalty/.test(text);
    const isYC   = /yellow card/.test(text);
    const isRC   = /red card/.test(text);
    const isSY   = /second yellow/.test(text);

    if (isGoal) {
      const key = name + '|' + (minute || '') + '|' + (teamId || '') + '|G';
      if (seenGoals.has(key)) continue;
      seenGoals.add(key);
      const g = { teamId, name, minute };
      if (isOwn) g.owngoal = true;
      if (isPen) g.penalty = true;
      out.goals.push(g);
    } else if (isYC || isRC || isSY) {
      const color = isRC ? 'red' : (isSY ? 'second-yellow' : 'yellow');
      const key = name + '|' + (minute || '') + '|' + (teamId || '') + '|' + color;
      if (seenCards.has(key)) continue;
      seenCards.add(key);
      out.cards.push({ teamId, name, minute, color });
    }
  }

  // Sort by minute (unknown minutes float to the bottom).
  const byMin = (a, b) => (a.minute || 999) - (b.minute || 999);
  out.goals.sort(byMin);
  out.cards.sort(byMin);
  return out;
}

// Split into home / away arrays once we know the team ids.
function _normalize(extracted) {
  const { homeTeamId, awayTeamId, goals, cards } = extracted;
  const splitByTeam = list => ({
    home: list.filter(x => x.teamId === homeTeamId).map(({ teamId, ...rest }) => rest),
    away: list.filter(x => x.teamId === awayTeamId).map(({ teamId, ...rest }) => rest),
  });
  return {
    scorers: splitByTeam(goals),
    cards: splitByTeam(cards),
  };
}

function init(app) {
  app.get('/api/wc-match', async (req, res) => {
    const eventId = (req.query.eventId || '').toString().trim();
    if (!/^\d+$/.test(eventId)) {
      return res.status(400).json({ error: 'eventId required (digits only)' });
    }
    const cached = _cache.get(eventId);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      res.set('Cache-Control', 'no-store');
      return res.json(cached.payload);
    }
    try {
      const data = await _fetchUpstream(ESPN_SUMMARY + '?event=' + encodeURIComponent(eventId));
      const extracted = _extract(data);
      const payload = {
        eventId,
        fetchedAt: new Date().toISOString(),
        ..._normalize(extracted),
      };
      _cache.set(eventId, { fetchedAt: Date.now(), payload });
      res.set('Cache-Control', 'no-store');
      res.json(payload);
    } catch (e) {
      console.warn('[wc-match]', eventId, 'fetch failed:', e.message);
      // Serve stale cache if we have one — better than nothing.
      if (cached) {
        res.set('Cache-Control', 'no-store');
        return res.json(cached.payload);
      }
      res.status(502).json({ error: e.message || 'upstream error' });
    }
  });
}

module.exports = { init };
