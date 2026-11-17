/* ================================================================
   HUERTO — the rules, with no page in them (js/huerto-engine.js)

   Dates are local calendar days, 'YYYY-MM-DD'. Everything here is
   pure so tests can run it in Node and in the page.

   A kid's blob (zs_huerto_<kid>), fields only ever added:
     { v:1,
       plants: [{ id, sp, name, where, planted, ev,
                  sprouted, flowered, harvested,     // dates the kid marked, or ''
                  done,                              // 1 = finished (kept in the journal)
                  water: ['YYYY-MM-DD', …],          // days it was watered (or checked)
                  log:   [{ id, d, h, lv, n, w, ph, dr }],
                     // h cm (one decimal) or null, lv leaves, n note, w watered,
                     // ph { id, th } photo on the family server, dr drawing strokes
                  pred:  [{ made, for, h, got }] }], // a guess, and the height it got
       exp:  { sol|agua|bolsa: { guess, why, start, obs:[{ d, a, b, ca, cb, ck:[] }],
                                 result, learned, done } } }
   ================================================================ */

var HuertoEngine = (function() {
  'use strict';

  var DAY = 86400000;
  var MAX_PLANTS = 40, MAX_LOG = 1000, MAX_NOTE = 240;   // MAX_PLANTS: plants being cared for at once

  // ---------- dates ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function isDate(s) { return !!parse(s); }
  // whole days from a to b (b later = positive); noon avoids clock-change hours
  function days(a, b) {
    var x = parse(a), y = parse(b);
    if (!x || !y) return 0;
    x.setHours(12); y.setHours(12);
    return Math.round((y - x) / DAY);
  }
  function addDays(s, n) {
    var d = parse(s);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function today(now) { return iso(now || new Date()); }

  // ---------- watering ----------
  // How often to check and water, in days: a cup dries out fast, a bed slowly.
  function everyDays(p, where) {
    var base = { 1: 3, 2: 2, 3: 1 }[p && p.water] || 2;
    if (where === 'cup') return 1;
    if (where === 'bed') return base + 1;
    return base;
  }
  function lastWater(pl) {
    var w = (pl && pl.water) || [], best = '';
    for (var i = 0; i < w.length; i++) if (isDate(w[i]) && w[i] > best) best = w[i];
    return best;
  }
  // Does this plant need its water check today? (A finished plant never does.)
  function needsWater(pl, now) {
    if (!pl || pl.done) return false;
    var t = today(now), last = lastWater(pl) || pl.planted;
    if (!isDate(last)) return true;
    return days(last, t) >= Math.max(1, pl.ev || 2);
  }
  function wateredOn(pl, d) { return ((pl && pl.water) || []).indexOf(d) >= 0; }
  function addWater(pl, d) {
    if (!pl.water) pl.water = [];
    if (pl.water.indexOf(d) < 0) pl.water.push(d);
    pl.water.sort();
    if (pl.water.length > 400) pl.water = pl.water.slice(-400);
  }
  // Days in a row (ending today or yesterday) with a watering, for any plant.
  function waterStreak(data, now) {
    var set = {}, n = 0;
    (data.plants || []).forEach(function(pl) { (pl.water || []).forEach(function(d) { set[d] = 1; }); });
    var d = today(now);
    if (!set[d]) d = addDays(d, -1);
    while (set[d]) { n++; d = addDays(d, -1); }
    return n;
  }

  // ---------- growth ----------
  // The stage the plant is probably at: what the kid marked wins, the
  // guide's days fill in the rest. 0 seed · 1 sprout · 2 seedling ·
  // 3 growing · 4 flowers · 5 harvest.
  function stage(pl, p, now) {
    if (!pl || !p) return 0;
    if (pl.harvested) return 5;
    if (pl.flowered) return 4;
    var age = days(pl.planted, today(now));
    var sp = p.sprout[0], hv = p.harvest[0];
    var since = pl.sprouted ? days(pl.sprouted, today(now)) : -1;
    if (!pl.sprouted && age < sp) return 0;
    if (!pl.sprouted && age < p.sprout[1]) return 0;          // not marked yet: still waiting
    var grown = pl.sprouted ? days(pl.planted, pl.sprouted) + since : age;
    var span = Math.max(1, hv - sp);
    var f = (grown - sp) / span;                                // 0 at sprouting, 1 at the first harvest
    if (f < 0.15) return 1;
    if (f < 0.4) return 2;
    if (f < 0.8) return 3;
    return 4;
  }
  // When to expect it: [earliest, latest] dates for sprouting and harvest.
  function expect(pl, p) {
    return {
      sprout: [addDays(pl.planted, p.sprout[0]), addDays(pl.planted, p.sprout[1])],
      harvest: [addDays(pl.planted, p.harvest[0]), addDays(pl.planted, p.harvest[1])]
    };
  }
  // A message about sprouting: 'soon', 'window' (any day now), 'late' (past the range), or ''.
  function sproutNews(pl, p, now) {
    if (!pl || !p || pl.sprouted || pl.done) return '';
    var age = days(pl.planted, today(now));
    if (age < p.sprout[0]) return 'soon';
    if (age <= p.sprout[1]) return 'window';
    return 'late';
  }

  // Heights over time: [{ d, day, h }] sorted, one per date (the last one wins).
  function series(pl) {
    var by = {};
    (pl.log || []).forEach(function(e) {
      if (e && isDate(e.d) && typeof e.h === 'number' && isFinite(e.h) && e.h >= 0) by[e.d] = e.h;
    });
    return Object.keys(by).sort().map(function(d) { return { d: d, day: days(pl.planted, d), h: by[d] }; });
  }
  // Growth per day between the first and the last measurement (cm/day), or null.
  function rate(pl) {
    var s = series(pl);
    if (s.length < 2) return null;
    var a = s[0], b = s[s.length - 1], n = b.day - a.day;
    return n > 0 ? Math.round((b.h - a.h) / n * 100) / 100 : null;
  }
  // What a straight line through the recent measurements says for date d.
  function projection(pl, d) {
    var s = series(pl);
    if (!s.length) return null;
    var last = s[s.length - 1];
    var r = rate(pl);
    if (r === null) return last.h;
    var x = days(last.d, d);
    return Math.max(0, Math.round((last.h + r * x) * 10) / 10);
  }

  // ---------- predict, then measure ----------
  // A guess counts as close within 1 cm or 20 %, whichever is bigger.
  function close(guess, got) {
    if (typeof guess !== 'number' || typeof got !== 'number') return false;
    return Math.abs(guess - got) <= Math.max(1, got * 0.2);
  }
  // The open guess (not yet measured), if any.
  function openPred(pl) {
    var p = pl.pred || [];
    for (var i = p.length - 1; i >= 0; i--) if (p[i] && typeof p[i].got !== 'number') return p[i];
    return null;
  }
  // A measurement on date d settles the open guess when it is within 3 days of the guessed date.
  function settle(pl, d, h) {
    var p = openPred(pl);
    if (!p || typeof h !== 'number') return null;
    var off = days(p['for'], d);
    if (off < -3) return null;                  // too early: keep waiting
    if (off > 3) { p.got = -1; return null; }   // too late to compare: closed, not scored
    p.got = h;
    p.at = d;
    return { guess: p.h, got: h, close: close(p.h, h) };
  }

  // ---------- experiments ----------
  function expStatus(e) {
    if (!e) return 'new';
    if (e.done) return 'done';
    if ((e.obs || []).length) return 'run';
    if (e.guess) return 'guess';
    return 'new';
  }

  // ---------- stars ----------
  // The same rule as the 'huerto' entry in APP_STAR_CONFIGS (js/auth.js);
  // a test checks they agree.
  //   each plant (up to 10): 1 for marking it sprouted, 1 for 3 journal
  //     entries with something in them, 1 for flowers or a harvest
  //   1 for every 7 days with a watering (up to 10)
  //   1 for every close guess in "predict, then measure" (up to 10)
  //   each experiment: 1 for a guess, 1 for 3 observations, 1 for finishing it
  function stars(d) {
    d = d || {};
    var n = 0, wd = {}, close = 0;
    (Array.isArray(d.plants) ? d.plants : []).slice(0, 10).forEach(function(pl) {
      if (!pl) return;
      var logs = (pl.log || []).filter(function(e) { return e && (typeof e.h === 'number' || e.n || e.ph || e.dr || e.w || e.lv); }).length;
      n += (pl.sprouted ? 1 : 0) + (logs >= 3 ? 1 : 0) + (pl.flowered || pl.harvested ? 1 : 0);
    });
    (Array.isArray(d.plants) ? d.plants : []).forEach(function(pl) {
      if (!pl) return;
      (pl.water || []).forEach(function(x) { wd[x] = 1; });
      (pl.pred || []).forEach(function(p) {
        if (p && typeof p.got === 'number' && p.got >= 0 && typeof p.h === 'number' && Math.abs(p.h - p.got) <= Math.max(1, p.got * 0.2)) close++;
      });
    });
    n += Math.min(10, Math.floor(Object.keys(wd).length / 7));
    n += Math.min(10, close);
    var ex = d.exp || {};
    for (var k in ex) {
      var e = ex[k];
      if (!e || typeof e !== 'object') continue;
      n += (e.guess ? 1 : 0) + ((e.obs || []).length >= 3 ? 1 : 0) + (e.done ? 1 : 0);
    }
    return n;
  }

  // ---------- load / clean ----------
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function str(x, n) { return typeof x === 'string' ? x.slice(0, n || 80) : ''; }
  function num(x) { return typeof x === 'number' && isFinite(x) ? x : null; }
  function newId(rand) {
    var r = rand || Math.random, s = '';
    for (var i = 0; i < 8; i++) s += Math.floor(r() * 36).toString(36);
    return s;
  }
  // Make any saved blob safe to use. Nothing is ever dropped on load: a
  // plant of a kind this copy of the app does not know (added by a newer
  // version) is kept as it is and only left out of the screens, and every
  // journal entry is kept. Missing fields are filled in.
  function clean(d, D) {
    d = obj(d);
    d.v = 1;
    d.plants = (Array.isArray(d.plants) ? d.plants : []).filter(function(pl) { return pl && typeof pl === 'object' && !Array.isArray(pl); });
    d.plants.forEach(function(pl) {
      if (typeof pl.id !== 'string' || !pl.id) pl.id = newId();
      if (typeof pl.name !== 'string') pl.name = '';
      if (!Array.isArray(pl.water)) pl.water = [];
      if (!Array.isArray(pl.log)) pl.log = [];
      if (!Array.isArray(pl.pred)) pl.pred = [];
      if (D && !D.plant(pl.sp)) return;                // unknown kind: leave it untouched
      if (['cup', 'pot', 'bed'].indexOf(pl.where) < 0) pl.where = 'pot';
      if (!isDate(pl.planted)) pl.planted = today();
      ['sprouted', 'flowered', 'harvested'].forEach(function(k) { if (!isDate(pl[k])) pl[k] = ''; });
      pl.log.forEach(function(e) {
        if (!e || typeof e !== 'object') return;
        if (typeof e.id !== 'string' || !e.id) e.id = newId();
        if (typeof e.h === 'string' && isFinite(parseFloat(e.h))) e.h = parseFloat(e.h);
        if (typeof e.h !== 'number' || !isFinite(e.h)) e.h = null;
        if (e.n != null && typeof e.n !== 'string') e.n = String(e.n);
      });
      if (!(pl.ev >= 1)) pl.ev = D ? everyDays(D.plant(pl.sp), pl.where) : 2;
    });
    d.exp = obj(d.exp);
    // photos waiting to be deleted on the family server (made while offline)
    d.trash = (Array.isArray(d.trash) ? d.trash : []).filter(function(id) { return /^[a-f0-9]{32}$/.test(String(id)); });
    return d;
  }
  // The plants this copy of the app can show (the others are kept, not shown).
  function known(d, D) { return (d.plants || []).filter(function(pl) { return !!D.plant(pl.sp); }); }
  // Entries that can be listed: an object with a real date.
  function entries(pl) { return (pl.log || []).filter(function(e) { return e && typeof e === 'object' && isDate(e.d); }); }

  return {
    DAY: DAY, MAX_PLANTS: MAX_PLANTS, MAX_LOG: MAX_LOG, MAX_NOTE: MAX_NOTE,
    iso: iso, parse: parse, isDate: isDate, days: days, addDays: addDays, today: today,
    everyDays: everyDays, lastWater: lastWater, needsWater: needsWater, wateredOn: wateredOn, addWater: addWater, waterStreak: waterStreak,
    stage: stage, expect: expect, sproutNews: sproutNews, series: series, rate: rate, projection: projection,
    close: close, openPred: openPred, settle: settle, expStatus: expStatus, stars: stars, clean: clean, newId: newId, known: known, entries: entries
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HuertoEngine;
