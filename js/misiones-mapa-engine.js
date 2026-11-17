/* ================================================================
   MISIONES DE MAPA — misiones-mapa-engine.js
   The maths behind the missions, with no DOM: great-circle distances,
   flight times, time zones and local arrival times, compass
   directions, latitude and longitude, map scales, cross-sections and
   contour lines. Every question generator takes a seeded random
   function so tests (and ?seed=N) are repeatable.

   Works in the browser (global MapaEngine) and in Node (module.exports).
   ================================================================ */
'use strict';

var MapaEngine = (function () {
  var D2R = Math.PI / 180;

  // ---------------------------------------------------------------
  // Random helpers
  // ---------------------------------------------------------------
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(arr, r) { return arr[Math.floor(r() * arr.length)]; }
  function pickN(arr, n, r) { return shuffle(arr, r).slice(0, n); }
  function int(lo, hi, r) { return lo + Math.floor(r() * (hi - lo + 1)); }

  // Choices: the right value plus distractors, shuffled, no duplicates.
  // Returns { choices:[...], answer: index }.
  function choiceSet(right, wrongs, r, n) {
    n = n || 4;
    var seen = {}, out = [right];
    seen[String(right)] = 1;
    for (var i = 0; i < wrongs.length && out.length < n; i++) {
      var k = String(wrongs[i]);
      if (!seen[k]) { seen[k] = 1; out.push(wrongs[i]); }
    }
    out = shuffle(out, r);
    return { choices: out, answer: out.indexOf(right) };
  }

  // Stars for a round: all right 3, 80% 2, 60% 1.
  function roundStars(right, n) {
    if (!n) return 0;
    var f = right / n;
    return f >= 1 ? 3 : f >= 0.8 ? 2 : f >= 0.6 ? 1 : 0;
  }

  // ---------------------------------------------------------------
  // Distances and flights
  // ---------------------------------------------------------------
  // Great-circle distance in km on a sphere of radius 6371 km.
  function distanceKm(a, b) {
    var f1 = a[1] * D2R, f2 = b[1] * D2R, dl = (b[0] - a[0]) * D2R;
    var h = Math.sin((f2 - f1) / 2), g = Math.sin(dl / 2);
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h * h + Math.cos(f1) * Math.cos(f2) * g * g)));
  }
  function round10(km) { return Math.round(km / 10) * 10; }

  // The rule the kids use: a jet flies about 800 km each hour, plus
  // half an hour to take off and land. Rounded to the nearest half hour.
  var SPEED = 800, EXTRA_MIN = 30;
  function flightMinutes(km) {
    var m = km / SPEED * 60 + EXTRA_MIN;
    return Math.max(30, Math.round(m / 30) * 30);
  }
  // Whole hours only, for the middle tier (no take-off half hour).
  function flightHoursSimple(km) { return Math.max(1, Math.round(km / SPEED)); }

  // Initial great-circle bearing, degrees clockwise from north.
  function bearing(a, b) {
    var f1 = a[1] * D2R, f2 = b[1] * D2R, dl = (b[0] - a[0]) * D2R;
    var y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
    return (Math.atan2(y, x) / D2R + 360) % 360;
  }

  // Direction on a flat map (x grows east, y grows south) as one of
  // 8 or 4 compass points. Ids use Spanish letters (O = oeste).
  var DIR8 = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  var DIR4 = ['N', 'E', 'S', 'O'];
  function degFromDelta(dx, dy) { return (Math.atan2(dx, -dy) / D2R + 360) % 360; }
  function dir8(deg) { return DIR8[Math.round(((deg % 360) + 360) % 360 / 45) % 8]; }
  function dir4(deg) { return DIR4[Math.round(((deg % 360) + 360) % 360 / 90) % 4]; }
  function dirDeg(id) { return DIR8.indexOf(id) * 45; }
  function opposite(id) { return DIR8[(DIR8.indexOf(id) + 4) % 8]; }

  // ---------------------------------------------------------------
  // Time zones
  // ---------------------------------------------------------------
  // UTC offset (minutes) of an IANA zone at a moment, from the device's
  // own time-zone data. fallback: [jan, jul] hours, used without Intl.
  var _fmtCache = {};
  function tzOffsetMin(tz, utcMs, fallback) {
    try {
      var f = _fmtCache[tz] || (_fmtCache[tz] = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
      var p = {}, parts = f.formatToParts(new Date(utcMs));
      for (var i = 0; i < parts.length; i++) p[parts[i].type] = parts[i].value;
      var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
    } catch (e) {
      if (!fallback) return 0;
      var m = new Date(utcMs).getUTCMonth();
      return Math.round((m >= 3 && m <= 8 ? fallback[1] : fallback[0]) * 60);
    }
  }
  // Local wall time {y, mo (0-11), d, h, mi} in a zone → UTC ms.
  function localToUtc(t, tz, fallback) {
    var guess = Date.UTC(t.y, t.mo, t.d, t.h, t.mi);
    var off = tzOffsetMin(tz, guess, fallback);
    var utc = guess - off * 60000;
    var off2 = tzOffsetMin(tz, utc, fallback);
    if (off2 !== off) utc = guess - off2 * 60000;
    return utc;
  }
  function utcToLocal(utc, tz, fallback) {
    var off = tzOffsetMin(tz, utc, fallback), d = new Date(utc + off * 60000);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), off: off };
  }
  function parseHM(s) { var p = String(s).split(':'); return { h: +p[0] | 0, mi: +p[1] | 0 }; }
  function hm(h, mi) { return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0'); }
  function dayIndex(t) { return Math.floor(Date.UTC(t.y, t.mo, t.d) / 86400000); }

  // A whole trip: from and to are city records ({ll, tz, off}).
  // dep 'HH:MM' local at the origin on the 15th of month mon of year y.
  function trip(from, to, dep, mon, y) {
    var km = distanceKm(from.ll, to.ll), mins = flightMinutes(km), hmDep = parseHM(dep);
    var t0 = { y: y, mo: mon, d: 15, h: hmDep.h, mi: hmDep.mi };
    var utc0 = localToUtc(t0, from.tz, from.off), utc1 = utc0 + mins * 60000;
    var a = utcToLocal(utc1, to.tz, to.off);
    var offFrom = tzOffsetMin(from.tz, utc0, from.off), offTo = tzOffsetMin(to.tz, utc1, to.off);
    return {
      km: km, kmR: round10(km), mins: mins, dep: hm(hmDep.h, hmDep.mi), arr: hm(a.h, a.mi),
      days: dayIndex(a) - dayIndex(t0), offFrom: offFrom, offTo: offTo, diffMin: offTo - offFrom,
      // What the origin's clock reads at landing (no zone change).
      arrHome: (function () { var h = utcToLocal(utc1, from.tz, from.off); return hm(h.h, h.mi); })(),
      bearing: bearing(from.ll, to.ll)
    };
  }
  function fmtOffset(min) {
    var s = min < 0 ? '−' : '+', a = Math.abs(min), h = Math.floor(a / 60), m = a % 60;
    return 'UTC' + s + h + (m ? ':' + String(m).padStart(2, '0') : '');
  }
  function fmtDuration(mins, es) {
    var h = Math.floor(mins / 60), m = mins % 60;
    if (!m) return h + ' h';
    return h + ' h ' + m + ' min';
  }
  // Add minutes to 'HH:MM' → {t:'HH:MM', days}
  function addClock(t, mins) {
    var p = parseHM(t), total = p.h * 60 + p.mi + mins, days = Math.floor(total / 1440);
    total = ((total % 1440) + 1440) % 1440;
    return { t: hm(Math.floor(total / 60), total % 60), days: days };
  }

  // ---------------------------------------------------------------
  // Latitude and longitude
  // ---------------------------------------------------------------
  function fmtLat(lat, es) { return Math.round(Math.abs(lat)) + '° ' + (lat < 0 ? 'S' : 'N'); }
  function fmtLon(lon, es) { return Math.round(Math.abs(lon)) + '° ' + (lon < 0 ? (es ? 'O' : 'W') : 'E'); }
  function fmtLL(ll, es) { return fmtLat(ll[1], es) + ', ' + fmtLon(ll[0], es); }

  // ---------------------------------------------------------------
  // Question generators. Each returns a plain object; the UI draws it.
  // Text comes back as [es, en] pairs or as values the UI formats.
  // ---------------------------------------------------------------

  // Compass on the picture map. level 4 (cardinal only) or 8.
  // kinds: 'what' — what is to the <dir> of A?  'which' — from A, which
  // way is B?
  function compassQ(village, level, r) {
    var byPos = {};
    village.forEach(function (v) { byPos[v.x + ',' + v.y] = v; });
    var tries = 0;
    while (tries++ < 200) {
      var a = pick(village, r), b = pick(village, r);
      if (a === b) continue;
      var dx = b.x - a.x, dy = b.y - a.y;
      if (dx && dy && Math.abs(dx) !== Math.abs(dy)) continue;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 1) continue;   // neighbours only: no "behind something"
      var d = dir8(degFromDelta(dx, dy));
      if (level === 4 && d.length > 1) continue;
      var kind = r() < 0.5 ? 'what' : 'which';
      if (kind === 'which') {
        var pool = level === 4 ? DIR4 : DIR8;
        var wrong = shuffle(pool.filter(function (x) { return x !== d; }), r);
        if (level === 8) wrong.sort(function (p, q) { return (p === opposite(d) ? -1 : 0) - (q === opposite(d) ? -1 : 0); });
        var cs = choiceSet(d, wrong, r, 4);
        return { kind: 'which', from: a.id, to: b.id, dir: d, choices: cs.choices, answer: cs.answer };
      }
      // 'what is <d> of a': the right answer is b; distractors are other neighbours of a.
      var others = village.filter(function (v) {
        if (v === a || v === b) return false;
        var ex = v.x - a.x, ey = v.y - a.y;
        return Math.max(Math.abs(ex), Math.abs(ey)) <= 1;
      });
      var cs2 = choiceSet(b.id, shuffle(others, r).map(function (v) { return v.id; }), r, level === 4 ? 3 : 4);
      return { kind: 'what', from: a.id, to: b.id, dir: d, choices: cs2.choices, answer: cs2.answer };
    }
    return null;
  }

  // Bearings in degrees ↔ the 8 compass points (expert).
  function bearingQ(r) {
    var d = pick(DIR8, r), deg = dirDeg(d);
    if (r() < 0.5) {
      var cs = choiceSet(d, shuffle(DIR8.filter(function (x) { return x !== d; }), r), r, 4);
      return { kind: 'deg2dir', deg: deg, dir: d, choices: cs.choices, answer: cs.answer };
    }
    var cs2 = choiceSet(deg, shuffle(DIR8.filter(function (x) { return x !== d; }).map(dirDeg), r), r, 4);
    return { kind: 'dir2deg', deg: deg, dir: d, choices: cs2.choices, answer: cs2.answer };
  }

  // Latitude/longitude from the city list.
  // level 'hemi' (north/south, east/west of Greenwich), 'read' (which
  // coordinates is the dot at?), 'find' (which city is at these?).
  function latlonQ(cities, level, r) {
    var c = pick(cities, r);
    if (level === 'hemi') {
      var ns = r() < 0.6;
      if (ns) return { kind: 'ns', city: c.id, answer: c.ll[1] < 0 ? 1 : 0, choices: ['N', 'S'] };
      return { kind: 'ew', city: c.id, answer: c.ll[0] < 0 ? 1 : 0, choices: ['E', 'O'] };
    }
    if (level === 'read') {
      var lat = Math.round(c.ll[1]) || 0, lon = Math.round(c.ll[0]) || 0;
      var wrong = [[-lat, lon], [lat, -lon], [lat + (lat >= 0 ? -25 : 25), lon], [lat, lon + (lon >= 0 ? -30 : 30)], [-lat, -lon]]
        .filter(function (p) { return Math.abs(p[0]) <= 85 && Math.abs(p[1]) <= 180 && (p[0] !== lat || p[1] !== lon); });
      var key = function (p) { return p[0] + ',' + p[1]; };
      var cs = choiceSet(key([lat, lon]), shuffle(wrong, r).map(key), r, 4);
      return { kind: 'read', city: c.id, choices: cs.choices.map(function (k) { var p = k.split(','); return [+p[1], +p[0]]; }), answer: cs.answer };
    }
    // find: pick 3 other cities in other places
    var others = shuffle(cities.filter(function (x) { return x !== c && distanceKm(x.ll, c.ll) > 1500; }), r).slice(0, 3);
    var cs2 = choiceSet(c.id, others.map(function (x) { return x.id; }), r, 4);
    return { kind: 'find', city: c.id, ll: [Math.round(c.ll[0]), Math.round(c.ll[1])], choices: cs2.choices, answer: cs2.answer };
  }

  // Map scales. level 'blocks' (count blocks of a scale bar), 'cm'
  // (1 cm = N km, measure on the ruler), 'two' (two legs), 'ratio'
  // (1:N scale), 'back' (km → cm).
  var KM_PER_CM = [1, 2, 5, 10, 20, 25, 50, 100];
  function scaleQ(level, r) {
    var q;
    if (level === 'blocks') {
      var per = pick([1, 2, 5, 10], r), n = int(2, 6, r);
      q = { kind: 'blocks', per: per, cm: n, km: per * n };
    } else if (level === 'cm') {
      var k = pick(KM_PER_CM, r), cm = int(2, 9, r);
      q = { kind: 'cm', per: k, cm: cm, km: k * cm };
    } else if (level === 'two') {
      var k2 = pick([5, 10, 20, 25, 50], r), a = int(2, 5, r), b = int(2, 5, r);
      q = { kind: 'two', per: k2, cm: a, cm2: b, km: k2 * (a + b) };
    } else if (level === 'ratio') {
      var den = pick([100000, 200000, 250000, 500000, 1000000, 2000000], r), cm3 = int(2, 9, r);
      q = { kind: 'ratio', den: den, per: den / 100000, cm: cm3, km: den / 100000 * cm3 };
    } else {
      var k4 = pick([5, 10, 20, 25, 50, 100], r), cm4 = int(2, 9, r);
      q = { kind: 'back', per: k4, cm: cm4, km: k4 * cm4 };
    }
    var right = q.kind === 'back' ? q.cm : q.km;
    var step = q.kind === 'back' ? 1 : q.per;
    var wrong = [right + step, right - step, right * 2, Math.round(right / 2), right + 2 * step, right * 10]
      .filter(function (x) { return x > 0 && x !== right; });
    var cs = choiceSet(right, shuffle(wrong, r), r, 4);
    q.choices = cs.choices; q.answer = cs.answer;
    return q;
  }

  // Cross-section questions from a profile's marks.
  function heightAt(profile, km) {
    var p = profile.pts;
    for (var i = 1; i < p.length; i++) {
      if (km <= p[i][0]) { var t = (km - p[i - 1][0]) / (p[i][0] - p[i - 1][0]); return p[i - 1][1] + t * (p[i][1] - p[i - 1][1]); }
    }
    return p[p.length - 1][1];
  }
  function profileQ(profile, r) {
    var M = profile.marks, top = M.reduce(function (a, b) { return b.m > a.m ? b : a; });
    var kinds = ['highest', 'height', 'diff', 'higher', 'dist'];
    var kind = pick(kinds, r), q;
    if (kind === 'highest') {
      var cs = choiceSet(top.id, shuffle(M.filter(function (m) { return m !== top; }), r).map(function (m) { return m.id; }), r, 4);
      q = { kind: kind, choices: cs.choices, answer: cs.answer, mark: top.id };
    } else if (kind === 'height') {
      var m = pick(M.filter(function (x) { return x.m > 0; }), r);
      var w = [m.m + 1000, Math.max(100, m.m - 1000), m.m * 2, Math.round(m.m / 2)].filter(function (x) { return x !== m.m; });
      var cs2 = choiceSet(m.m, shuffle(w, r), r, 4);
      q = { kind: kind, mark: m.id, choices: cs2.choices, answer: cs2.answer };
    } else if (kind === 'diff') {
      var lows = M.filter(function (x) { return x !== top; }), lo = pick(lows, r), d = top.m - lo.m;
      var w2 = [d + 1000, d - 1000, top.m + lo.m, top.m].filter(function (x) { return x > 0 && x !== d; });
      var cs3 = choiceSet(d, shuffle(w2, r), r, 4);
      q = { kind: kind, a: top.id, b: lo.id, choices: cs3.choices, answer: cs3.answer };
    } else if (kind === 'higher') {
      var pair = pickN(M.filter(function (x) { return x.m > 0; }), 2, r);
      var hi = pair[0].m >= pair[1].m ? pair[0] : pair[1];
      q = { kind: kind, choices: [pair[0].id, pair[1].id], answer: pair.indexOf(hi) };
    } else {
      var two = pickN(M, 2, r), dd = Math.abs(two[0].km - two[1].km);
      var w3 = [dd + 50, Math.max(10, dd - 50), dd * 2, dd + 100].filter(function (x) { return x !== dd; });
      var cs4 = choiceSet(dd, shuffle(w3, r), r, 4);
      q = { kind: kind, a: two[0].id, b: two[1].id, choices: cs4.choices, answer: cs4.answer };
    }
    q.profile = profile.id;
    return q;
  }

  // Contour lines: a hill with n rings every `step` m; one side has its
  // rings packed close (the steep side).
  function contourQ(r) {
    var n = int(3, 7, r), step = pick([50, 100, 200], r), steep = pick(DIR4, r);
    var kind = pick(['top', 'steep', 'dot'], r), q = { n: n, step: step, steep: steep, kind: kind, base: 0 };
    if (kind === 'top') {
      var top = n * step, w = [top + step, top - step, n, top * 2].filter(function (x) { return x > 0 && x !== top; });
      var cs = choiceSet(top, shuffle(w, r), r, 4);
      q.choices = cs.choices; q.answer = cs.answer;
    } else if (kind === 'steep') {
      var cs2 = choiceSet(steep, shuffle(DIR4.filter(function (x) { return x !== steep; }), r), r, 4);
      q.choices = cs2.choices; q.answer = cs2.answer;
    } else {
      var ring = int(1, n, r), h = ring * step;
      q.ring = ring;
      var w2 = [h + step, h - step, h + 2 * step, ring].filter(function (x) { return x > 0 && x !== h; });
      var cs3 = choiceSet(h, shuffle(w2, r), r, 4);
      q.choices = cs3.choices; q.answer = cs3.answer;
    }
    return q;
  }

  // Ruta 5: road distance between two cities on the same road.
  // Position along the road: north of Santiago is negative.
  function ruta5Pos(c) { return c.side === 'n' ? -c.km : c.km; }
  function ruta5Km(a, b) { return Math.abs(ruta5Pos(a) - ruta5Pos(b)); }
  function ruta5Q(list, level, r) {
    var two = pickN(list, 2, r), a = two[0], b = two[1];
    var km = ruta5Km(a, b);
    if (level === 'time') {
      var speed = pick([80, 100], r), h = Math.round(km / speed * 2) / 2;
      var w = [h + 1, Math.max(0.5, h - 1), h * 2, h + 2].filter(function (x) { return x !== h; });
      var cs = choiceSet(h, shuffle(w, r), r, 4);
      return { kind: 'time', a: a.id, b: b.id, km: km, speed: speed, choices: cs.choices, answer: cs.answer };
    }
    var other = ruta5Pos(a) + ruta5Pos(b);
    var w2 = [Math.abs(other), km + 100, Math.max(10, km - 100), km + 200].filter(function (x) { return x !== km && x > 0; });
    var cs2 = choiceSet(km, shuffle(w2, r), r, 4);
    return { kind: 'km', a: a.id, b: b.id, km: km, choices: cs2.choices, answer: cs2.answer };
  }

  // Which of two places is farther north?
  function northQ(list, r) {
    var two = pickN(list, 2, r);
    while (Math.abs(two[0].ll[1] - two[1].ll[1]) < 1.5) two = pickN(list, 2, r);
    return { kind: 'north', choices: [two[0].id, two[1].id], answer: two[0].ll[1] > two[1].ll[1] ? 0 : 1 };
  }

  // An order puzzle: n items shuffled; answer is their north→south order.
  function orderPuzzle(list, n, r) {
    var sorted = list.map(function (x, i) { return { x: x, i: i }; });
    var chosen = pickN(sorted, n, r).sort(function (a, b) { return a.i - b.i; });
    var answer = chosen.map(function (c) { return c.x.id; });
    var shown = shuffle(answer, r);
    var guard = 0;
    while (shown.join() === answer.join() && guard++ < 10) shown = shuffle(answer, r);
    return { shown: shown, answer: answer };
  }

  // The answer choices for a flight time, in minutes.
  function flightChoices(mins, r) {
    var w = [mins + 60, mins - 60, mins + 120, mins - 120, mins + 180, Math.round(mins * 1.5 / 30) * 30]
      .filter(function (x) { return x >= 30 && x !== mins; });
    return choiceSet(mins, shuffle(w, r).slice(0, 3), r, 4);
  }
  // Arrival choices as 'HH:MM|days'.
  function arrivalChoices(t, r) {
    var right = t.arr + '|' + t.days;
    function shift(mins) { var a = addClock(t.arr, mins); return a.t + '|' + (t.days + a.days); }
    var w = [];
    // forgetting the zone change, the zone change backwards, an hour off
    w.push(t.arrHome + '|' + (t.days + addClock(t.arr, -t.diffMin).days));
    if (t.diffMin) w.push(shift(-2 * t.diffMin));
    w.push(shift(60)); w.push(shift(-60)); w.push(shift(120));
    if (t.days) w.push(t.arr + '|0');
    return choiceSet(right, w.filter(function (x) { return x !== right; }), r, 4);
  }

  return {
    rng: rng, shuffle: shuffle, pick: pick, pickN: pickN, int: int, choiceSet: choiceSet, roundStars: roundStars,
    distanceKm: distanceKm, round10: round10, flightMinutes: flightMinutes, flightHoursSimple: flightHoursSimple, SPEED: SPEED, EXTRA_MIN: EXTRA_MIN,
    bearing: bearing, degFromDelta: degFromDelta, dir8: dir8, dir4: dir4, dirDeg: dirDeg, opposite: opposite, DIR8: DIR8, DIR4: DIR4,
    tzOffsetMin: tzOffsetMin, localToUtc: localToUtc, utcToLocal: utcToLocal, trip: trip, fmtOffset: fmtOffset, fmtDuration: fmtDuration, addClock: addClock, hm: hm,
    fmtLat: fmtLat, fmtLon: fmtLon, fmtLL: fmtLL,
    compassQ: compassQ, bearingQ: bearingQ, latlonQ: latlonQ, scaleQ: scaleQ, heightAt: heightAt, profileQ: profileQ, contourQ: contourQ,
    ruta5Pos: ruta5Pos, ruta5Km: ruta5Km, ruta5Q: ruta5Q, northQ: northQ, orderPuzzle: orderPuzzle,
    flightChoices: flightChoices, arrivalChoices: arrivalChoices
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MapaEngine;
