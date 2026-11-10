/* ================================================================
   LÍNEA DEL TIEMPO — dates, layout maths and the four games
   (js/linea-engine.js). No DOM, so it can be tested (and seeded).

   Years: -1 is 1 BC and 1 is AD 1 (no year 0). `astro` converts to a
   plain number line (1 BC = 0) for distances and positions.
   Age tiers are those of getAgeTier(): beginner (<=5), intermediate
   (6-8), advanced (9-11), expert (12+).
   ================================================================ */

var LineaEngine = (function (D) {
  'use strict';

  var TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];

  function astro(y) { return y < 0 ? y + 1 : y; }
  function fromAstro(a) { return a <= 0 ? a - 1 : a; }

  function fmtNum(n, es) {
    var s = String(Math.round(Math.abs(n))), out = '';
    for (var i = 0; i < s.length; i++) { if (i && (s.length - i) % 3 === 0) out += es ? '.' : ','; out += s.charAt(i); }
    return (n < 0 ? '-' : '') + out;
  }
  function yearLabel(y, es) { return y < 0 ? Math.abs(y) + (es ? ' a. C.' : ' BC') : String(Math.floor(y)); }

  // The date as it is written on a card: "1541", "c. 2560 a. C.", "1181–1226".
  function dateText(ev, es) {
    if (ev.dt) return ev.dt[es ? 0 : 1];
    var c = ev.c ? 'c. ' : '';
    if (ev.sp) {
      var a = ev.sp[0], b = ev.sp[1];
      if (a < 0 && b < 0) return c + Math.abs(a) + '–' + yearLabel(b, es);
      if (a < 0) return c + yearLabel(a, es) + '–' + yearLabel(b, es);
      return c + a + '–' + b;
    }
    return c + yearLabel(ev.y, es);
  }
  function eraOf(ev) {
    var e = D.ERAS[0];
    D.ERAS.forEach(function (x) { if (ev.y >= x.from) e = x; });
    return e;
  }
  function agoYears(ev, now) { return Math.max(0, Math.round(now - astro(ev.y))); }

  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(rand, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Which events a tier may be asked about.
  function maxTier(tier) { return tier === 'beginner' ? 1 : tier === 'intermediate' ? 2 : 3; }
  function pool(tier, o) {
    o = o || {};
    var m = o.maxTier || maxTier(tier);
    return D.EVENTS.filter(function (e) { return e.tier <= m && (o.persons === true ? e.person : o.persons === false ? !e.person : true); });
  }
  function unc(e) { return e.c ? 20 : 0; }
  function dist(a, b) { return Math.abs(astro(a.y) - astro(b.y)); }
  function tidx(tier) { var i = TIERS.indexOf(tier); return i < 0 ? 1 : i; }

  var GAP = { order: [150, 80, 40, 20], ba: [300, 120, 60, 30], first: [300, 120, 60, 30] };
  var ORDER_N = [3, 4, 5, 6];

  // ---- Put these in order -------------------------------------------
  function genOrder(rand, tier) {
    var n = ORDER_N[tidx(tier)], gap = GAP.order[tidx(tier)], p = pool(tier, { persons: false });
    for (var tries = 0; tries < 400; tries++) {
      var sh = shuffle(rand, p), pick = [];
      for (var i = 0; i < sh.length && pick.length < n; i++) {
        var ok = true;
        for (var j = 0; j < pick.length; j++) if (dist(sh[i], pick[j]) < gap + unc(sh[i]) + unc(pick[j])) { ok = false; break; }
        if (ok) pick.push(sh[i]);
      }
      if (pick.length === n) {
        var ans = pick.slice().sort(function (a, b) { return astro(a.y) - astro(b.y); });
        var shown = shuffle(rand, pick);
        var tries2 = 0;
        while (shown.every(function (e, i) { return e === ans[i]; }) && tries2++ < 20) shown = shuffle(rand, pick);
        return { n: n, shown: shown.map(function (e) { return e.id; }), answer: ans.map(function (e) { return e.id; }) };
      }
    }
    return null;
  }

  // ---- Who lived at the same time? ----------------------------------
  function start(e) { return astro(e.sp[0]); }
  function end(e) { return astro(e.sp[1]); }
  function overlap(a, b) { return Math.min(end(a), end(b)) - Math.max(start(a), start(b)); }
  function gapBetween(a, b) { return Math.max(start(a), start(b)) - Math.min(end(a), end(b)); }

  function genSame(rand, tier, kind) {
    var n = tier === 'beginner' ? 2 : 3;
    var persons = pool(tier === 'beginner' ? 'intermediate' : tier, { persons: true });
    var evs = pool(tier === 'beginner' ? 'intermediate' : tier, { persons: false }).filter(function (e) { return !e.c && !e.dt; });
    kind = kind || (tier !== 'beginner' && rand() < 0.4 ? 'during' : 'person');
    for (var tries = 0; tries < 400; tries++) {
      var A = persons[Math.floor(rand() * persons.length)], right, wrong;
      if (kind === 'person') {
        var good = persons.filter(function (b) { return b !== A && overlap(A, b) >= ((A.c || b.c) ? 25 : 8); });
        var far = persons.filter(function (b) { return b !== A && gapBetween(A, b) >= ((A.c || b.c) ? 60 : 40); });
        if (!good.length || far.length < n - 1) continue;
        right = good[Math.floor(rand() * good.length)];
        wrong = shuffle(rand, far).slice(0, n - 1);
      } else {
        if (end(A) - start(A) < 25) continue;
        var inside = evs.filter(function (e) { return astro(e.y) >= start(A) + 3 && astro(e.y) <= end(A) - 3; });
        var outside = evs.filter(function (e) { return astro(e.y) < start(A) - 25 || astro(e.y) > end(A) + 25; });
        if (!inside.length || outside.length < n - 1) continue;
        right = inside[Math.floor(rand() * inside.length)];
        wrong = shuffle(rand, outside).slice(0, n - 1);
      }
      var opts = shuffle(rand, [right].concat(wrong));
      return { kind: kind, a: A.id, options: opts.map(function (e) { return e.id; }), answer: right.id };
    }
    return kind === 'during' ? genSame(rand, tier, 'person') : null;
  }

  // ---- Before or after? ---------------------------------------------
  function genBA(rand, tier) {
    var p = pool(tier, { persons: false }), gap = GAP.ba[tidx(tier)];
    for (var tries = 0; tries < 400; tries++) {
      var a = p[Math.floor(rand() * p.length)], b = p[Math.floor(rand() * p.length)];
      if (a === b || dist(a, b) < gap + unc(a) + unc(b)) continue;
      return { a: a.id, b: b.id, answer: astro(b.y) < astro(a.y) ? 'before' : 'after' };
    }
    return null;
  }

  // ---- Time-travel trivia -------------------------------------------
  function niceStep(x) {
    var s = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    for (var i = 0; i < s.length; i++) if (s[i] >= x) return s[i];
    return 1000;
  }
  function plainEvents(list) { return list.filter(function (e) { return !e.person && !e.dt; }); }

  // One question, or null. era: an era id or 'all'.
  function oneQuestion(rand, tier, kind, era, now) {
    var all = pool(tier, { persons: false });
    var own = era && era !== 'all' ? all.filter(function (e) { return eraOf(e).id === era; }) : all;
    if (!own.length) return null;
    var E = own[Math.floor(rand() * own.length)], i;
    var gap = GAP.first[tidx(tier)];
    if (kind === 'year') {
      if (E.person || E.dt) return null;
      var ageY = Math.max(1, now - astro(E.y)), step = niceStep(ageY * 0.12), offs = shuffle(rand, [-3, -2, -1, 1, 2, 3]), ys = [E.y], seen = {};
      seen[astro(E.y)] = 1;
      for (i = 0; i < offs.length && ys.length < 4; i++) {
        var a = astro(E.y) + offs[i] * step;
        if (a > now || a < D.START || seen[a]) continue;
        seen[a] = 1; ys.push(fromAstro(a));
      }
      if (ys.length < 4) return null;
      var opts = shuffle(rand, ys), lab = function (y) { return dateText({ y: y, c: E.c, dt: null, sp: null }, true); }, labE = function (y) { return dateText({ y: y, c: E.c, dt: null, sp: null }, false); };
      return { kind: 'year', ev: E.id, choices: opts.map(function (y) { return { es: lab(y), en: labE(y) }; }), answer: opts.indexOf(E.y) };
    }
    if (kind === 'what') {
      if (E.person || E.dt || E.c) return null;
      var others = shuffle(rand, plainEvents(all).filter(function (e) { return e !== E && !e.c && dist(e, E) >= 20; })).slice(0, 3);
      if (others.length < 3) return null;
      var o2 = shuffle(rand, [E].concat(others));
      return { kind: 'what', ev: E.id, choices: o2.map(function (e) { return { id: e.id, es: e.t[0], en: e.t[1] }; }), answer: o2.indexOf(E) };
    }
    if (kind === 'why') {
      if (E.person) return null;
      var oth = shuffle(rand, all.filter(function (e) { return e !== E && !e.person; })).slice(0, 3);
      if (oth.length < 3) return null;
      var o3 = shuffle(rand, [E].concat(oth));
      return { kind: 'why', ev: E.id, choices: o3.map(function (e) { return { id: e.id, es: e.t[0], en: e.t[1] }; }), answer: o3.indexOf(E) };
    }
    if (kind === 'first2' || kind === 'first3' || kind === 'last3') {
      var k = kind === 'first2' ? 2 : 3;
      if (E.person) return null;
      var spanEv = own.filter(function (e) { return !e.person; }), spanY = spanEv.length ? Math.max.apply(null, spanEv.map(function (e) { return astro(e.y); })) - Math.min.apply(null, spanEv.map(function (e) { return astro(e.y); })) : 0;
      var g = era && era !== 'all' ? Math.min(gap, Math.max(2, Math.floor(spanY / 8))) : gap;
      var group = [E], cand = shuffle(rand, all.filter(function (e) { return !e.person && e !== E; }));
      for (i = 0; i < cand.length && group.length < k; i++) {
        if (group.every(function (m) { return dist(m, cand[i]) >= g + unc(m) + unc(cand[i]); })) group.push(cand[i]);
      }
      if (group.length < k) return null;
      var sorted = group.slice().sort(function (a, b) { return astro(a.y) - astro(b.y); });
      var target = kind === 'last3' ? sorted[sorted.length - 1] : sorted[0], shownG = shuffle(rand, group);
      return { kind: kind, ev: target.id, choices: shownG.map(function (e) { return { id: e.id, es: e.t[0], en: e.t[1] }; }), answer: shownG.indexOf(target) };
    }
    return null;
  }

  var KINDS = { beginner: ['first2'], intermediate: ['year', 'first3', 'what'], advanced: ['year', 'first3', 'what', 'why', 'last3'], expert: ['year', 'first3', 'what', 'why', 'last3'] };

  function genTrivia(rand, tier, era, count, now) {
    count = count || 6; now = now || 2026;
    var kinds = KINDS[tier] || KINDS.intermediate, out = [], used = {};
    for (var tries = 0; tries < 600 && out.length < count; tries++) {
      var kind = kinds[out.length % kinds.length];
      if (tries > 200) kind = kinds[Math.floor(rand() * kinds.length)];
      var q = oneQuestion(rand, tier, kind, era, now);
      if (!q || used[q.ev]) continue;
      used[q.ev] = 1; out.push(q);
    }
    return out;
  }

  // Stars for a round: right out of total.
  function starsFor(right, total) {
    if (!total) return 0;
    var p = right / total;
    return p >= 0.9 ? 3 : p >= 0.6 ? 2 : right > 0 ? 1 : 0;
  }

  // ---- The timeline's layout ----------------------------------------
  // Greedy placement of event markers into `rows` rows per lane, by
  // priority (tier, then year). The result depends only on the zoom
  // (pixels per year), not on where the view is, so markers do not
  // jump around while panning.
  function layout(ppy, opts) {
    opts = opts || {};
    var rows = opts.rows || 2, w = opts.width || 86, m = opts.maxTier || 3, out = {};
    D.LANES.forEach(function (lane) {
      var list = D.EVENTS.filter(function (e) { return e.lane === lane.id && e.tier <= m; })
        .sort(function (a, b) { return a.tier - b.tier || astro(a.y) - astro(b.y); });
      var placed = [];
      for (var r = 0; r < rows; r++) placed.push([]);
      list.forEach(function (e) {
        var x = astro(e.y) * ppy;
        for (var r = 0; r < rows; r++) {
          var clash = placed[r].some(function (px) { return Math.abs(px - x) < w; });
          if (!clash) { placed[r].push(x); out[e.id] = r; return; }
        }
      });
    });
    return out;
  }

  // Nice tick labels for the axis: [{a: astro position, text}]
  function ticks(fromA, toA, ppy, es, minPx) {
    minPx = minPx || 74;
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000], step = steps[steps.length - 1], out = [], i;
    for (i = 0; i < steps.length; i++) if (steps[i] * ppy >= minPx) { step = steps[i]; break; }
    // AD side: years that are multiples of step; BC side: labels (BC) that are multiples of step
    var lo = Math.ceil(Math.max(fromA, 1) / step) * step;
    for (var y = lo; y <= toA; y += step) out.push({ a: y, text: String(y) });
    if (fromA < 0) {
      var bcMax = 1 - fromA, bcMin = Math.max(1, 1 - Math.min(toA, 0));
      for (var b = Math.ceil(bcMin / step) * step; b <= bcMax; b += step) out.push({ a: 1 - b, text: b + (es ? ' a. C.' : ' BC') });
    }
    return out;
  }

  return {
    TIERS: TIERS, astro: astro, fromAstro: fromAstro, fmtNum: fmtNum, yearLabel: yearLabel, dateText: dateText,
    eraOf: eraOf, agoYears: agoYears, rng: rng, shuffle: shuffle, pool: pool, maxTier: maxTier,
    overlap: overlap, gapBetween: gapBetween, genOrder: genOrder, genSame: genSame, genBA: genBA, genTrivia: genTrivia,
    starsFor: starsFor, layout: layout, ticks: ticks, GAP: GAP, ORDER_N: ORDER_N, KINDS: KINDS
  };
})(typeof LineaData !== 'undefined' ? LineaData : require('./linea-data.js'));

if (typeof module !== 'undefined' && module.exports) module.exports = LineaEngine;
