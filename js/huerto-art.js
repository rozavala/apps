/* ================================================================
   HUERTO — the drawings (js/huerto-art.js)

   Every plant of the guide is drawn here in code, as an inline SVG,
   at each of its six stages: 0 seed in the soil · 1 sprout ·
   2 seedling · 3 growing · 4 flowers · 5 harvest. The pieces are
   built from a few shapes (a leaf outline traced along a curved
   midrib with its own width profile and edge, stems drawn as tapered
   strokes with a highlight, flowers, fruit, soil, pots) shaded with
   gradients, and placed with a seeded random so the same plant always
   looks the same.

   HuertoArt.plant(id, stage, { where:'cup'|'pot'|'bed', seed, label }) -> '<svg…>'
   HuertoArt.icon(name)      small pictures: sun, part, drop, cup, pot, bed, ruler, bag, …
   HuertoArt.seasons(lang)   the Earth around the Sun, for "why are the seasons opposite?"
   ================================================================ */

var HuertoArt = (function() {
  'use strict';

  var uid = 0;
  var PI = Math.PI;

  // ---------- utilities ----------
  function n(v) { return Math.round(v * 10) / 10; }
  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function stops(a) {
    return a.map(function(s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('');
  }
  function lg(id, x1, y1, x2, y2, st, extra) {
    return '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (extra || '') + '>' + stops(st) + '</linearGradient>';
  }
  function rg(id, cx, cy, r, st, extra) {
    return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + (extra || '') + '>' + stops(st) + '</radialGradient>';
  }
  function rad(d) { return d * PI / 180; }
  function pt(x, y, a, d) { return [x + Math.cos(rad(a)) * d, y + Math.sin(rad(a)) * d]; }

  // Smooth path through points (Catmull-Rom to cubic Bézier).
  function smooth(P, closed) {
    if (P.length < 2) return '';
    var d = 'M' + n(P[0][0]) + ' ' + n(P[0][1]);
    var L = P.length;
    for (var i = 0; i < (closed ? L : L - 1); i++) {
      var p0 = P[(i - 1 + L) % L], p1 = P[i], p2 = P[(i + 1) % L], p3 = P[(i + 2) % L];
      if (!closed) { p0 = P[Math.max(0, i - 1)]; p3 = P[Math.min(L - 1, i + 2)]; }
      d += 'C' + n(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        n(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n(p2[0]) + ' ' + n(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }

  // ---------- the drawing context ----------
  // Each drawing gets its own id prefix (many share a page) and its own defs.
  function Ctx(seed, where) {
    this.id = 'hu' + (++uid) + '_';
    this.r = rng(seed);
    this.defs = [];
    this.made = {};
    this.where = where;
    this.back = [];   // behind the container
    this.mid = [];    // the plant
    this.front = [];  // in front (fruit on the soil, labels)
    this.under = [];  // in the soil (seen through a cup, or in the lens)
  }
  Ctx.prototype.rnd = function(a, b) { return a + (b - a) * this.r(); };
  Ctx.prototype.def = function(key, fn) {
    if (!this.made[key]) { this.made[key] = 1; this.defs.push(fn(this.id + key)); }
    return 'url(#' + this.id + key + ')';
  };
  // A leaf fill: dark edges, a lighter band along the midrib (in the leaf's own frame).
  Ctx.prototype.leafFill = function(c1, c2, c3) {
    var key = 'lf' + (c1 + c2 + c3).replace(/#/g, '');
    return this.def(key, function(id) { return lg(id, 0, 0, 0, 1, [[0, c1], [0.42, c2], [0.58, c3], [1, c1]]); });
  };

  // ---------- leaves ----------
  // A leaf from (x, y) pointing at angle a (degrees, 0 = right, -90 = up),
  // length L, half-width W. o: { prof: width profile name, edge, teeth, bend,
  // fill: [dark, light, mid], vein, veins }.
  var PROF = {
    oval:   function(t) { return Math.pow(Math.sin(PI * t), 0.85); },
    ovate:  function(t) { return Math.pow(Math.sin(PI * Math.pow(t, 0.75)), 0.8) * (1.05 - 0.25 * t); },
    lance:  function(t) { return Math.pow(Math.sin(PI * t), 1.2) * (1 - 0.25 * t); },
    heart:  function(t) { return t < 0.08 ? 0.55 + t * 4 : Math.pow(Math.sin(PI * (0.08 + t * 0.92)), 0.7) * (1.1 - 0.35 * t); },
    strap:  function(t) { return (1 - Math.pow(t, 4)) * (t < 0.05 ? 0.6 + t * 8 : 1); },
    round:  function(t) { return Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))); },
    spoon:  function(t) { return Math.pow(Math.sin(PI * Math.pow(t, 1.5)), 0.8); },
    blade:  function(t) { return (1 - t) * (t < 0.04 ? 0.5 + t * 12 : 1); }
  };
  function leafPath(L, W, o) {
    var prof = PROF[o.prof || 'oval'], teeth = o.teeth || 0, ruff = o.ruff || 0, N = teeth ? 34 : 24;
    var bend = o.bend || 0, droop = o.droop || 0;
    function mid(t) { return [t * L, bend * L * t * (1 - t) + droop * L * t * t]; }
    function nrm(t) {
      var dy = bend * L * (1 - 2 * t) + droop * L * 2 * t, len = Math.sqrt(L * L + dy * dy);
      return [-dy / len, L / len];
    }
    var top = [], bot = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N, m = mid(t), q = nrm(t), w = W * prof(t);
      var et = 1, eb = 1;
      if (teeth && t > 0.08 && t < 0.97) { et = i % 2 ? 1.1 : 0.93; eb = i % 2 ? 0.93 : 1.1; }
      if (ruff) { et += ruff * Math.sin(t * PI * 11 + 0.6); eb += ruff * Math.sin(t * PI * 11 + 2.4); }
      top.push([m[0] + q[0] * w * et, m[1] - q[1] * w * et]);
      bot.push([m[0] - q[0] * w * eb, m[1] + q[1] * w * eb]);
    }
    var P = top.concat(bot.reverse().slice(1, -1)), d;
    if (teeth) {
      d = 'M' + n(P[0][0]) + ' ' + n(P[0][1]);
      for (var k = 1; k < P.length; k++) d += 'L' + n(P[k][0]) + ' ' + n(P[k][1]);
      d += 'Z';
    } else d = smooth(P, true);
    return { d: d, mid: mid, w: function(t) { return W * prof(t); }, nrm: nrm };
  }
  Ctx.prototype.leaf = function(x, y, a, L, W, o) {
    o = o || {};
    // droop always bends toward the ground, whichever way the leaf points
    if (o.droop && Math.cos(rad(a)) < 0) { o = Object.assign({}, o); o.droop = -o.droop; o.bend = -(o.bend || 0); }
    var f = o.fill || ['#3f7a2c', '#7fbf4a', '#5d9e38'];
    var lp = leafPath(L, W, o);
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a) + ')">';
    s += '<path d="' + lp.d + '" fill="' + this.leafFill(f[0], f[1], f[2]) + '" stroke="' + (o.line || 'rgba(30,60,20,.4)') + '" stroke-width="' + (o.lw || 0.5) + '" stroke-linejoin="round"/>';
    if (o.vein !== false) {
      var m0 = lp.mid(0.02), m1 = lp.mid(0.9), mm = lp.mid(0.5), vc = o.veinCol || 'rgba(230,248,200,.7)';
      s += '<path d="M' + n(m0[0]) + ' ' + n(m0[1]) + 'Q' + n(mm[0]) + ' ' + n(mm[1]) + ' ' + n(m1[0]) + ' ' + n(m1[1]) + '" fill="none" stroke="' + vc + '" stroke-width="' + n(Math.max(0.45, W * 0.06)) + '" stroke-linecap="round"/>';
      var nv = o.veins == null ? 4 : o.veins, v = '';
      for (var i = 1; i <= nv; i++) {
        var t = 0.1 + i * (0.75 / (nv + 1)), t2 = Math.min(0.97, t + 0.16), m = lp.mid(t), e = lp.mid(t2), q = lp.nrm(t2), w2 = lp.w(t2) * 0.78;
        v += 'M' + n(m[0]) + ' ' + n(m[1]) + 'Q' + n((m[0] + e[0]) / 2 + q[0] * w2 * 0.3) + ' ' + n((m[1] + e[1]) / 2 - q[1] * w2 * 0.45) + ' ' + n(e[0] + q[0] * w2) + ' ' + n(e[1] - q[1] * w2);
        v += 'M' + n(m[0]) + ' ' + n(m[1]) + 'Q' + n((m[0] + e[0]) / 2 - q[0] * w2 * 0.3) + ' ' + n((m[1] + e[1]) / 2 + q[1] * w2 * 0.45) + ' ' + n(e[0] - q[0] * w2) + ' ' + n(e[1] + q[1] * w2);
      }
      if (v) s += '<path d="' + v + '" fill="none" stroke="' + vc + '" stroke-opacity=".7" stroke-width="0.45"/>';
    }
    return s + '</g>';
  };
  // A palmate (hand-shaped) leaf seen from above, centre (x, y), radius R.
  Ctx.prototype.palmLeaf = function(x, y, R, a, o) {
    o = o || {};
    var f = o.fill || ['#2f6a25', '#6fae45', '#4f8f33'], lobes = o.lobes || 5, P = [], N = 60, deep = o.deep || 0.22;
    for (var i = 0; i < N; i++) {
      var th = (i / N) * 2 * PI;
      var gap = Math.abs(Math.cos((th - PI / 2) / 2));       // the notch where the stalk joins
      var r = R * (1 - deep + deep * Math.abs(Math.cos(th * lobes / 2))) * (0.55 + 0.45 * Math.min(1, gap * 1.6));
      r *= 1 + (o.teeth ? (i % 2 ? 0.03 : -0.02) : 0);
      P.push([Math.cos(th) * r, Math.sin(th) * r * (o.squash || 0.8)]);
    }
    var fill = this.def('pl' + f.join('').replace(/#/g, ''), function(id) { return rg(id, 0.5, 0.75, 0.75, [[0, f[1]], [0.55, f[2]], [1, f[0]]]); });
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a || 0) + ')">';
    s += '<path d="' + smooth(P, true) + '" fill="' + fill + '" stroke="rgba(25,55,20,.5)" stroke-width="0.7"/>';
    var base = [0, R * 0.35 * (o.squash || 0.8)];
    for (var k = 0; k < lobes; k++) {
      var t = -PI / 2 + (k - (lobes - 1) / 2) * (PI * 1.5 / lobes);
      s += '<path d="M' + n(base[0]) + ' ' + n(base[1]) + 'L' + n(Math.cos(t) * R * 0.82) + ' ' + n(Math.sin(t) * R * 0.82 * (o.squash || 0.8)) + '" stroke="rgba(220,240,190,.6)" stroke-width="0.9" fill="none" stroke-linecap="round"/>';
    }
    if (o.spots) {
      for (var j = 0; j < 7; j++) {
        var ra = this.rnd(0.2, 0.75) * R, th2 = this.rnd(-PI, 0);
        s += '<ellipse cx="' + n(Math.cos(th2) * ra) + '" cy="' + n(Math.sin(th2) * ra * 0.8) + '" rx="' + n(this.rnd(1.5, 3.5)) + '" ry="1.2" fill="rgba(235,245,225,.45)"/>';
      }
    }
    return s + '</g>';
  };
  // A round leaf held up from its middle (nasturtium), seen a little from the side.
  Ctx.prototype.shield = function(x, y, R, tilt) {
    var fill = this.def('sh', function(id) { return rg(id, 0.45, 0.42, 0.65, [[0, '#a9d97a'], [0.6, '#6fae4c'], [1, '#3f7f2f']]); });
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(tilt || 0) + ')">';
    s += '<ellipse cx="0" cy="0" rx="' + n(R) + '" ry="' + n(R * 0.72) + '" fill="' + fill + '" stroke="rgba(30,70,25,.5)" stroke-width="0.7"/>';
    for (var k = 0; k < 9; k++) {
      var t = k / 9 * 2 * PI;
      s += '<path d="M0 0L' + n(Math.cos(t) * R * 0.9) + ' ' + n(Math.sin(t) * R * 0.65) + '" stroke="rgba(240,250,220,.7)" stroke-width="0.6"/>';
    }
    return s + '<circle r="1.6" fill="#e9f5d0"/></g>';
  };

  // ---------- stems ----------
  // A tapered stem along points: a darker stroke with a light one on top.
  Ctx.prototype.stem = function(P, w, col, hi) {
    var d = smooth(P, false);
    return '<path d="' + d + '" fill="none" stroke="' + (col || '#4c7f2a') + '" stroke-width="' + n(w) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + (hi || 'rgba(200,235,150,.55)') + '" stroke-width="' + n(Math.max(0.5, w * 0.35)) + '" stroke-linecap="round" transform="translate(' + n(-w * 0.18) + ' 0)"/>';
  };
  // Points of a gently swaying stem from (x, y) up to height H.
  Ctx.prototype.stemPts = function(x, y, H, sway, lean) {
    var P = [], k = 6, ph = this.rnd(0, PI * 2);
    for (var i = 0; i <= k; i++) {
      var t = i / k;
      P.push([x + Math.sin(ph + t * 2.4) * sway * t + (lean || 0) * t * t * H, y - t * H]);
    }
    return P;
  };
  function along(P, t) {
    var f = t * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), u = f - i;
    var a = P[i], b = P[i + 1];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / PI];
  }

  // ---------- flowers ----------
  Ctx.prototype.star = function(x, y, R, col, centre, petals) {
    var k = petals || 5, s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(this.rnd(0, 72)) + ')">';
    var fill = this.def('st' + col.replace('#', ''), function(id) { return rg(id, 0.5, 0.5, 0.6, [[0, '#fffbe6'], [0.45, col], [1, col]]); });
    for (var i = 0; i < k; i++) {
      var a = i * 360 / k;
      s += '<path d="M0 0Q' + n(R * 0.35) + ' ' + n(-R * 0.28) + ' ' + n(R) + ' 0Q' + n(R * 0.35) + ' ' + n(R * 0.28) + ' 0 0" fill="' + fill + '" stroke="rgba(120,90,20,.35)" stroke-width="0.4" transform="rotate(' + a + ')"/>';
    }
    return s + '<circle r="' + n(R * 0.22) + '" fill="' + (centre || '#e0a21a') + '"/></g>';
  };
  Ctx.prototype.round5 = function(x, y, R, col, centre, line) {
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(this.rnd(0, 72)) + ')">';
    for (var i = 0; i < 5; i++) {
      var p = pt(0, 0, i * 72, R * 0.55);
      s += '<circle cx="' + n(p[0]) + '" cy="' + n(p[1]) + '" r="' + n(R * 0.5) + '" fill="' + col + '" stroke="' + (line || 'rgba(120,120,120,.35)') + '" stroke-width="0.4"/>';
    }
    return s + '<circle r="' + n(R * 0.3) + '" fill="' + (centre || '#f2c230') + '"/></g>';
  };
  Ctx.prototype.daisy = function(x, y, R, col, dark, disc, k) {
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ')">', m = k || 18;
    var fill = this.def('dz' + col.replace('#', '') + dark.replace('#', ''), function(id) { return lg(id, 0, 0, 1, 0, [[0, dark], [0.55, col], [1, col]]); });
    for (var i = 0; i < m; i++) {
      var a = i * 360 / m + this.rnd(-4, 4);
      s += '<path d="M' + n(R * 0.3) + ' 0Q' + n(R * 0.65) + ' ' + n(-R * 0.17) + ' ' + n(R) + ' 0Q' + n(R * 0.65) + ' ' + n(R * 0.17) + ' ' + n(R * 0.3) + ' 0" fill="' + fill + '" stroke="rgba(110,60,10,.3)" stroke-width="0.4" transform="rotate(' + n(a) + ')"/>';
    }
    s += '<circle r="' + n(R * 0.36) + '" fill="' + (disc || '#7a4a12') + '"/>';
    // the florets of the middle, in the golden-angle spiral
    var cnt = Math.round(R * 4), ga = 137.508;
    for (var j = 1; j < cnt; j++) {
      var rr = R * 0.34 * Math.sqrt(j / cnt), aa = j * ga;
      var q = pt(0, 0, aa, rr);
      s += '<circle cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" r="' + n(Math.max(0.35, R * 0.028)) + '" fill="' + (j % 3 ? '#3b230a' : '#a5701e') + '"/>';
    }
    return s + '</g>';
  };
  Ctx.prototype.trumpet = function(x, y, R, a) {
    var fill = this.def('tr', function(id) { return rg(id, 0.5, 0.6, 0.7, [[0, '#ffb020'], [0.55, '#ffd22e'], [1, '#f6b40e']]); });
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a || 0) + ')">';
    s += '<path d="M0 0L' + n(-R * 0.25) + ' ' + n(-R * 0.9) + 'Q0 ' + n(-R * 1.25) + ' ' + n(R * 0.25) + ' ' + n(-R * 0.9) + 'Z" fill="#e9a713"/>';
    var P = [];
    for (var i = 0; i < 10; i++) { var th = i / 10 * 2 * PI; var r = R * (i % 2 ? 0.72 : 1); P.push([Math.cos(th) * r, -R * 0.95 + Math.sin(th) * r * 0.45]); }
    s += '<path d="' + smooth(P, true) + '" fill="' + fill + '" stroke="rgba(150,90,0,.4)" stroke-width="0.5"/>';
    s += '<ellipse cx="0" cy="' + n(-R * 0.95) + '" rx="' + n(R * 0.25) + '" ry="' + n(R * 0.12) + '" fill="#d98a06"/>';
    return s + '</g>';
  };
  Ctx.prototype.umbel = function(x, y, R, col) {
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ')">';
    for (var i = 0; i < 7; i++) {
      var a = -150 + i * 20, p = pt(0, 0, a, R);
      s += '<path d="M0 0L' + n(p[0]) + ' ' + n(p[1]) + '" stroke="#6c9a3c" stroke-width="0.6"/>';
      for (var j = 0; j < 6; j++) {
        var q = pt(p[0], p[1], this.rnd(-180, 0), this.rnd(0.5, R * 0.3));
        s += '<circle cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" r="' + n(R * 0.11) + '" fill="' + (col || '#fbfbf3') + '" stroke="rgba(120,120,100,.35)" stroke-width="0.3"/>';
      }
    }
    return s + '</g>';
  };
  Ctx.prototype.pompom = function(x, y, R) {
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ')">';
    s += '<circle r="' + n(R) + '" fill="#b37acb"/>';
    for (var i = 0; i < 26; i++) {
      var q = pt(0, 0, this.rnd(0, 360), this.rnd(0, R * 0.9));
      s += '<path d="M' + n(q[0]) + ' ' + n(q[1] + 1.4) + 'l1.2 -2.6l1.2 2.6z" fill="' + (i % 2 ? '#d7a6e6' : '#8f55a8') + '"/>';
    }
    return s + '</g>';
  };
  Ctx.prototype.spike = function(x, y, H, col) {
    var s = '';
    for (var i = 0; i < 5; i++) {
      var yy = y - i * H / 5, w = 4.2 - i * 0.6;
      s += '<ellipse cx="' + n(x) + '" cy="' + n(yy) + '" rx="' + n(w) + '" ry="1.6" fill="#7a9a54"/>';
      for (var j = -1; j <= 1; j++) s += '<circle cx="' + n(x + j * w * 0.8) + '" cy="' + n(yy - 1.4) + '" r="1.25" fill="' + (col || '#f6f2fb') + '" stroke="rgba(140,120,160,.5)" stroke-width="0.3"/>';
    }
    return s;
  };
  Ctx.prototype.peaFlower = function(x, y, R, col) {
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(this.rnd(-20, 20)) + ')">' +
      '<path d="M0 0C' + n(-R) + ' ' + n(-R * 0.4) + ' ' + n(-R * 0.9) + ' ' + n(-R * 1.6) + ' 0 ' + n(-R * 1.5) + 'C' + n(R * 0.9) + ' ' + n(-R * 1.6) + ' ' + n(R) + ' ' + n(-R * 0.4) + ' 0 0Z" fill="' + (col || '#fbfaf4') + '" stroke="rgba(130,130,110,.5)" stroke-width="0.5"/>' +
      '<path d="M0 0C' + n(-R * 0.5) + ' ' + n(R * 0.1) + ' ' + n(-R * 0.4) + ' ' + n(R * 0.7) + ' 0 ' + n(R * 0.55) + 'C' + n(R * 0.4) + ' ' + n(R * 0.7) + ' ' + n(R * 0.5) + ' ' + n(R * 0.1) + ' 0 0Z" fill="#eef2e1" stroke="rgba(130,130,110,.5)" stroke-width="0.4"/>' +
      '<path d="M0 0L0 ' + n(R * 0.9) + '" stroke="#6e9b3e" stroke-width="0.8"/></g>';
  };
  Ctx.prototype.nastFlower = function(x, y, R, col) {
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(this.rnd(-30, 30)) + ')">';
    var fill = this.def('nf' + col.replace('#', ''), function(id) { return rg(id, 0.5, 0.5, 0.6, [[0, '#ffd34a'], [0.4, col], [1, col]]); });
    for (var i = 0; i < 5; i++) {
      s += '<path d="M0 0C' + n(R * 0.3) + ' ' + n(-R * 0.5) + ' ' + n(R * 1.1) + ' ' + n(-R * 0.55) + ' ' + n(R) + ' 0C' + n(R * 1.1) + ' ' + n(R * 0.55) + ' ' + n(R * 0.3) + ' ' + n(R * 0.5) + ' 0 0Z" fill="' + fill + '" stroke="rgba(120,40,0,.35)" stroke-width="0.4" transform="rotate(' + (i * 72) + ')"/>';
      s += '<path d="M' + n(R * 0.15) + ' 0L' + n(R * 0.6) + ' 0" stroke="rgba(140,30,0,.55)" stroke-width="0.5" transform="rotate(' + (i * 72 + 8) + ')"/>';
    }
    return s + '<circle r="' + n(R * 0.18) + '" fill="#f0b81c"/></g>';
  };

  // ---------- fruit ----------
  Ctx.prototype.tomato = function(x, y, R, ripe) {
    var col = ripe >= 1 ? ['#ff6a4d', '#e0301e', '#a81c12'] : ripe > 0.5 ? ['#ffb36b', '#f07a2a', '#b65314'] : ['#c8e59a', '#86bd4e', '#557f2b'];
    var fill = this.def('tm' + col[1].replace('#', ''), function(id) { return rg(id, 0.36, 0.32, 0.75, [[0, col[0]], [0.55, col[1]], [1, col[2]]]); });
    var s = '<ellipse cx="' + n(x) + '" cy="' + n(y) + '" rx="' + n(R * 1.06) + '" ry="' + n(R) + '" fill="' + fill + '"/>';
    s += '<ellipse cx="' + n(x - R * 0.35) + '" cy="' + n(y - R * 0.4) + '" rx="' + n(R * 0.25) + '" ry="' + n(R * 0.14) + '" fill="rgba(255,255,255,.55)" transform="rotate(-30 ' + n(x - R * 0.35) + ' ' + n(y - R * 0.4) + ')"/>';
    for (var i = 0; i < 5; i++) {
      var p = pt(x, y - R * 0.9, i * 72 - 90 + this.rnd(-10, 10), R * 0.55);
      s += '<path d="M' + n(x) + ' ' + n(y - R * 0.9) + 'L' + n(p[0]) + ' ' + n(p[1] + R * 0.15) + '" stroke="#3e7a26" stroke-width="' + n(R * 0.16) + '" stroke-linecap="round"/>';
    }
    return s;
  };
  Ctx.prototype.berry = function(x, y, R, ripe) {
    var col = ripe ? ['#ff6b6b', '#d81f2a', '#8f0f18'] : ['#f4f6e0', '#d8e6b0', '#a9c27a'];
    var fill = this.def('br' + (ripe ? 1 : 0), function(id) { return rg(id, 0.4, 0.3, 0.8, [[0, col[0]], [0.6, col[1]], [1, col[2]]]); });
    var s = '<path d="M' + n(x) + ' ' + n(y - R) + 'C' + n(x + R * 1.25) + ' ' + n(y - R * 1.1) + ' ' + n(x + R * 0.8) + ' ' + n(y + R * 0.6) + ' ' + n(x) + ' ' + n(y + R * 1.3) + 'C' + n(x - R * 0.8) + ' ' + n(y + R * 0.6) + ' ' + n(x - R * 1.25) + ' ' + n(y - R * 1.1) + ' ' + n(x) + ' ' + n(y - R) + 'Z" fill="' + fill + '"/>';
    for (var i = 0; i < 12; i++) {
      var q = [x + this.rnd(-0.7, 0.7) * R, y + this.rnd(-0.6, 0.9) * R];
      if (Math.abs(q[0] - x) > R * (1 - (q[1] - y + R) / (R * 2.6))) continue;
      s += '<ellipse cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" rx="0.55" ry="0.8" fill="' + (ripe ? '#f7d35a' : '#c9b97a') + '"/>';
    }
    for (var k = 0; k < 5; k++) {
      var p = pt(x, y - R, -90 + (k - 2) * 38, R * 0.75);
      s += '<path d="M' + n(x) + ' ' + n(y - R) + 'Q' + n((x + p[0]) / 2) + ' ' + n(y - R * 1.35) + ' ' + n(p[0]) + ' ' + n(p[1] + R * 0.6) + '" stroke="#3f8a2e" stroke-width="' + n(R * 0.28) + '" fill="none" stroke-linecap="round"/>';
    }
    return s;
  };
  Ctx.prototype.pod = function(x, y, L, a, col, peas) {
    var c = col || ['#5c9b31', '#9fd35e'];
    var fill = this.def('pd' + c[0].replace('#', ''), function(id) { return lg(id, 0, 0, 0, 1, [[0, c[1]], [0.6, c[0]], [1, '#3b6a1f']]); });
    var w = peas ? L * 0.16 : L * 0.09, P = [], N = 12;
    for (var i = 0; i <= N; i++) { var t = i / N; P.push([t * L, -Math.sin(PI * t) * w - (peas ? Math.abs(Math.sin(t * PI * 5)) * w * 0.25 : 0) + t * t * L * 0.15]); }
    for (var j = N; j >= 0; j--) { var t2 = j / N; P.push([t2 * L, Math.sin(PI * t2) * w * 0.8 + t2 * t2 * L * 0.15]); }
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a) + ')"><path d="' + smooth(P, true) + '" fill="' + fill + '" stroke="rgba(40,70,20,.5)" stroke-width="0.5"/>' +
      '<path d="M0 0Q' + n(L * 0.5) + ' ' + n(-w * 0.9) + ' ' + n(L) + ' ' + n(L * 0.15) + '" stroke="rgba(230,250,200,.6)" stroke-width="0.6" fill="none"/></g>';
  };
  Ctx.prototype.cuke = function(x, y, L, a, dark) {
    var c = dark ? ['#2f5a22', '#5e8f3a', '#1d3d15'] : ['#4e8a32', '#9ccb68', '#2e5c1f'];
    var fill = this.def('ck' + (dark ? 1 : 0), function(id) { return lg(id, 0, 0, 0, 1, [[0, c[1]], [0.45, c[0]], [1, c[2]]]); });
    var w = L * (dark ? 0.15 : 0.17);
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a) + ')"><rect x="0" y="' + n(-w) + '" width="' + n(L) + '" height="' + n(w * 2) + '" rx="' + n(w) + '" fill="' + fill + '" stroke="rgba(20,40,10,.4)" stroke-width="0.5"/>';
    for (var i = 0; i < 9; i++) {
      var px = this.rnd(w * 0.6, L - w * 0.6), py = this.rnd(-w * 0.7, w * 0.7);
      s += dark ? '<ellipse cx="' + n(px) + '" cy="' + n(py) + '" rx="1.6" ry="0.5" fill="rgba(200,230,150,.45)"/>' : '<circle cx="' + n(px) + '" cy="' + n(py) + '" r="0.6" fill="rgba(240,250,210,.85)"/>';
    }
    s += '<rect x="' + n(-w * 0.35) + '" y="' + n(-w * 0.25) + '" width="' + n(w * 0.6) + '" height="' + n(w * 0.5) + '" rx="1" fill="#7d6a2a"/>';
    return s + '</g>';
  };
  Ctx.prototype.chili = function(x, y, L, a, ripe) {
    var c = ripe ? ['#ff5a3c', '#d4180f', '#8c0d07'] : ['#9fd36a', '#4f9a2e', '#2f6a1a'];
    var fill = this.def('ch' + (ripe ? 1 : 0), function(id) { return lg(id, 0, 0, 1, 0, [[0, c[0]], [0.5, c[1]], [1, c[2]]]); });
    var w = L * 0.17;
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a) + ')">' +
      '<path d="M' + n(-w) + ' 0C' + n(-w) + ' ' + n(L * 0.5) + ' ' + n(-w * 0.2) + ' ' + n(L * 0.85) + ' ' + n(w * 0.5) + ' ' + n(L) + 'C' + n(w * 0.4) + ' ' + n(L * 0.7) + ' ' + n(w) + ' ' + n(L * 0.4) + ' ' + n(w) + ' 0Z" fill="' + fill + '" stroke="rgba(80,10,0,.35)" stroke-width="0.4"/>' +
      '<path d="M' + n(-w * 0.4) + ' ' + n(L * 0.1) + 'Q' + n(-w * 0.5) + ' ' + n(L * 0.5) + ' ' + n(0) + ' ' + n(L * 0.75) + '" stroke="rgba(255,255,255,.5)" stroke-width="0.8" fill="none"/>' +
      '<path d="M' + n(-w * 1.1) + ' 0Q0 ' + n(-w * 0.7) + ' ' + n(w * 1.1) + ' 0Z" fill="#3f7a26"/><path d="M0 0L0 ' + n(-L * 0.2) + '" stroke="#3f7a26" stroke-width="1.2"/></g>';
  };
  Ctx.prototype.cob = function(x, y, L, a) {
    var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(a) + ')">';
    var husk = this.def('hk', function(id) { return lg(id, 0, 0, 1, 0, [[0, '#4f8a2c'], [0.5, '#9cc85c'], [1, '#3f7224']]); });
    s += '<path d="M0 0C' + n(-L * 0.28) + ' ' + n(-L * 0.25) + ' ' + n(-L * 0.25) + ' ' + n(-L * 0.8) + ' 0 ' + n(-L) + 'C' + n(L * 0.25) + ' ' + n(-L * 0.8) + ' ' + n(L * 0.28) + ' ' + n(-L * 0.25) + ' 0 0Z" fill="' + husk + '" stroke="rgba(30,60,15,.5)" stroke-width="0.5"/>';
    for (var i = 0; i < 5; i++) {
      var yy = -L * (0.45 + i * 0.09);
      s += '<circle cx="' + n((i % 2 ? 1 : -1) * L * 0.035) + '" cy="' + n(yy) + '" r="' + n(L * 0.05) + '" fill="#f4d13a" stroke="#c99b12" stroke-width="0.3"/>';
    }
    s += '<path d="M0 ' + n(-L * 0.7) + 'C' + n(-L * 0.05) + ' ' + n(-L * 0.4) + ' ' + n(L * 0.2) + ' ' + n(-L * 0.3) + ' ' + n(-L * 0.06) + ' 0" stroke="rgba(60,100,30,.6)" stroke-width="0.6" fill="none"/>';
    for (var k = 0; k < 7; k++) s += '<path d="M0 ' + n(-L) + 'q' + n(this.rnd(-6, 6)) + ' ' + n(-this.rnd(3, 8)) + ' ' + n(this.rnd(-9, 9)) + ' ' + n(-this.rnd(6, 12)) + '" stroke="' + (k % 2 ? '#c98a3a' : '#e8c07a') + '" stroke-width="0.6" fill="none"/>';
    return s + '</g>';
  };

  // ---------- containers and soil ----------
  var SOIL_Y = 196;
  function soilDots(c, x0, x1, y0, y1, k) {
    var s = '';
    for (var i = 0; i < k; i++) {
      s += '<circle cx="' + n(c.rnd(x0, x1)) + '" cy="' + n(c.rnd(y0, y1)) + '" r="' + n(c.rnd(0.4, 1.3)) + '" fill="' + (i % 3 ? 'rgba(30,18,8,.35)' : 'rgba(190,150,100,.45)') + '"/>';
    }
    return s;
  }
  Ctx.prototype.container = function() {
    var c = this, w = this.where, s = '';
    var soil = this.def('soil', function(id) { return lg(id, 0, 0, 0, 1, [[0, '#6b4a2e'], [0.25, '#4e3320'], [1, '#2e1e12']]); });
    if (w === 'cup') {
      var cup = this.def('cup', function(id) { return lg(id, 0, 0, 1, 0, [[0, 'rgba(255,255,255,.55)'], [0.18, 'rgba(255,255,255,.12)'], [0.75, 'rgba(255,255,255,.05)'], [1, 'rgba(255,255,255,.4)']]); });
      s += '<ellipse cx="100" cy="236" rx="46" ry="5" fill="rgba(50,40,20,.18)"/>';
      s += '<path d="M66 ' + SOIL_Y + 'L74 234L126 234L134 ' + SOIL_Y + 'Z" fill="' + soil + '"/>';
      s += soilDots(c, 72, 128, SOIL_Y + 2, 232, 46);
      return { back: s, front: '<path d="M62 168L73 234Q100 238 127 234L138 168" fill="' + cup + '" stroke="rgba(120,140,150,.65)" stroke-width="1.2"/><ellipse cx="100" cy="168" rx="38" ry="4.5" fill="none" stroke="rgba(130,150,160,.7)" stroke-width="1.4"/><path d="M68 176L76 228" stroke="rgba(255,255,255,.7)" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="100" cy="' + SOIL_Y + '" rx="34.5" ry="3.2" fill="#5a3d26"/>' };
    }
    if (w === 'bed') {
      var bed = this.def('bed', function(id) { return lg(id, 0, 0, 0, 1, [[0, '#7a5534'], [0.3, '#5b3d24'], [1, '#3a2716']]); });
      var wood = this.def('wood', function(id) { return lg(id, 0, 0, 0, 1, [[0, '#c58f58'], [0.5, '#a8743f'], [1, '#7d5228']]); });
      s += '<path d="M8 ' + (SOIL_Y + 2) + 'Q100 ' + (SOIL_Y - 8) + ' 192 ' + (SOIL_Y + 2) + 'L192 240L8 240Z" fill="' + bed + '"/>';
      s += soilDots(c, 12, 188, SOIL_Y + 2, 222, 90);
      var front = '<rect x="0" y="222" width="200" height="18" fill="' + wood + '"/><path d="M0 230H200" stroke="rgba(80,45,15,.4)" stroke-width="0.8"/>';
      for (var i = 0; i < 6; i++) front += '<path d="M' + (14 + i * 34) + ' 225q6 2 12 0" stroke="rgba(80,45,15,.45)" stroke-width="0.7" fill="none"/>';
      front += '<rect x="0" y="222" width="200" height="2" fill="rgba(255,230,190,.45)"/>';
      return { back: s, front: front };
    }
    // pot (terracotta)
    var clay = this.def('clay', function(id) { return lg(id, 0, 0, 1, 0, [[0, '#a4502c'], [0.3, '#d9804f'], [0.55, '#c86a3c'], [1, '#8a3e20']]); });
    var rim = this.def('rim', function(id) { return lg(id, 0, 0, 1, 0, [[0, '#a9532e'], [0.3, '#e59767'], [0.6, '#cf7444'], [1, '#8f4222']]); });
    s += '<ellipse cx="100" cy="236" rx="44" ry="5" fill="rgba(60,30,10,.22)"/>';
    s += '<ellipse cx="100" cy="' + (SOIL_Y + 2) + '" rx="40" ry="5" fill="' + soil + '"/>';
    s += soilDots(c, 64, 136, SOIL_Y - 1, SOIL_Y + 5, 18);
    return { back: s, front: '<path d="M64 202L74 236L126 236L136 202Z" fill="' + clay + '"/><path d="M58 190H142V203Q100 207 58 203Z" fill="' + rim + '"/><path d="M58 190H142" stroke="rgba(255,220,190,.55)" stroke-width="1.2"/><path d="M76 210L82 232" stroke="rgba(255,210,170,.35)" stroke-width="3" stroke-linecap="round"/>' };
  };

  // ---------- the plants ----------
  // Each: { H: full height, mono: grass-like sprout, from: 'seed'|'plant'|'tuber',
  //         coty: seed-leaf colour, draw(c, x, y, s, st) } where s is 0..1 of the
  // full size and st the stage (2 seedling … 5 harvest).
  var LEAF = {
    green: ['#3a7428', '#86c652', '#5f9f39'],
    dark: ['#2c5e20', '#6aa843', '#467f2e'],
    light: ['#5a9a33', '#b3e07a', '#83bf51'],
    blue: ['#3d6b4a', '#86b48e', '#5c8f68'],
    glossy: ['#2f6d22', '#8fd157', '#4f9a31']
  };

  var PL = {};

  PL.poroto = { H: 120, coty: '#b6c96a', draw: function(c, x, y, s, st) {
    var P = c.stemPts(x, y, 118 * s, 8, 0.02), out = '', back = '', fruit = '';
    var nodes = st <= 2 ? 1 : st === 3 ? 4 : 6;
    for (var i = 0; i < nodes; i++) {
      var t = 0.3 + i * (0.66 / Math.max(1, nodes)), q = along(P, t), side = i % 2 ? 1 : -1;
      var pa = -90 + side * (58 + c.rnd(-6, 6)), stalk = pt(q[0], q[1], pa, 14 * s + 5), L = 17 + 13 * s;
      var g = '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'Q' + n((q[0] + stalk[0]) / 2) + ' ' + n(Math.min(q[1], stalk[1]) - 3) + ' ' + n(stalk[0]) + ' ' + n(stalk[1]) + '" stroke="#5d8a2e" stroke-width="1.1" fill="none"/>';
      // three leaflets: one at the end, two to the sides
      g += c.leaf(stalk[0], stalk[1], pa - 62, L * 0.82, L * 0.4, { prof: 'ovate', fill: LEAF.green, droop: 0.12, bend: -0.1 });
      g += c.leaf(stalk[0], stalk[1], pa + 62, L * 0.82, L * 0.4, { prof: 'ovate', fill: LEAF.green, droop: 0.12, bend: 0.1 });
      g += c.leaf(stalk[0], stalk[1], pa + side * 8, L, L * 0.46, { prof: 'ovate', fill: LEAF.green, droop: 0.1 });
      if (i % 2) back += g; else out += g;
      if (st >= 4 && i % 2 === 0 && i > 0) out += c.peaFlower(q[0] - side * 5, q[1] + 4, 3.4, '#f3edf8') + c.peaFlower(q[0] - side * 9, q[1] + 8, 3, '#f3edf8');
      if (st >= 5 && i % 2 === 1) fruit += c.pod(q[0] - side * 3, q[1] + 3, 30, 90 - side * 18, ['#5f9c35', '#a4d566']) + c.pod(q[0] - side * 6, q[1] + 4, 26, 90 - side * 30, ['#5f9c35', '#a4d566']);
    }
    if (st === 2) { var q2 = along(P, 1); out += c.leaf(q2[0], q2[1], -150, 18, 9, { prof: 'heart', fill: LEAF.green, droop: 0.1 }) + c.leaf(q2[0], q2[1], -30, 18, 9, { prof: 'heart', fill: LEAF.green, droop: 0.1 }); }
    if (st >= 3) { var tp = along(P, 1); out += c.leaf(tp[0], tp[1], -120, 9, 4.5, { prof: 'ovate', fill: LEAF.light }) + c.leaf(tp[0], tp[1], -60, 9, 4.5, { prof: 'ovate', fill: LEAF.light }); }
    return back + c.stem(P, 2.2 + s, '#5d8a2e') + out + fruit;
  } };

  PL.maravilla = { H: 165, coty: '#9cc25a', draw: function(c, x, y, s, st) {
    var P = c.stemPts(x, y, 160 * s, 3, 0), out = c.stem(P, 2.5 + s * 3, '#6a8f2e', 'rgba(210,235,160,.6)');
    var nodes = st <= 2 ? 1 : st === 3 ? 5 : 7;
    for (var i = 0; i < nodes; i++) {
      var t = 0.2 + i * (0.68 / Math.max(1, nodes)), q = along(P, t), side = i % 2 ? 1 : -1;
      var L = (34 - i * 2.4) * Math.max(0.55, s);
      out += c.leaf(q[0], q[1], -90 + side * 62 + c.rnd(-6, 6), L, L * 0.45, { prof: 'heart', fill: LEAF.dark, droop: 0.18, teeth: 1, veins: 5 });
    }
    var top = along(P, 1);
    if (st >= 4) out += '<g>' + c.daisy(top[0] + 2, top[1] - 4, st >= 5 ? 26 : 22, '#ffd21f', '#e79e0c', st >= 5 ? '#4a2c0c' : '#6b4313', 24) + '</g>';
    else if (st === 3) out += '<circle cx="' + n(top[0]) + '" cy="' + n(top[1] - 2) + '" r="5" fill="#6d9a38" stroke="#3f6a20" stroke-width="0.6"/>';
    else if (st === 2) out += c.leaf(top[0], top[1], -135, 13, 6, { prof: 'ovate', fill: LEAF.dark }) + c.leaf(top[0], top[1], -45, 13, 6, { prof: 'ovate', fill: LEAF.dark });
    return out;
  } };

  PL.albahaca = { H: 85, coty: '#9fcf6a', draw: function(c, x, y, s, st) {
    var out = '', stems = st >= 3 ? 3 : 1;
    for (var k = 0; k < stems; k++) {
      var P = c.stemPts(x + (k - 1) * 6, y, (86 - Math.abs(k - 1) * 18) * s, 3, (k - 1) * 0.25), pairs = st <= 2 ? 1 : st === 3 ? 4 : 5;
      out += c.stem(P, 1.8 + s, '#5e8e33');
      for (var i = 0; i < pairs; i++) {
        var q = along(P, 0.25 + i * (0.7 / pairs)), L = (22 - i * 2.4) * Math.max(0.6, s);
        out += c.leaf(q[0], q[1], -170 + i * 10, L, L * 0.42, { prof: 'ovate', fill: LEAF.glossy, bend: -0.25, droop: 0.12 });
        out += c.leaf(q[0], q[1], -10 - i * 10, L, L * 0.42, { prof: 'ovate', fill: LEAF.glossy, bend: 0.25, droop: 0.12 });
      }
      var top = along(P, 1);
      if (st >= 4) out += c.spike(top[0], top[1], 18, '#fbf8ff');
      else out += c.leaf(top[0], top[1], -115, 8, 3.5, { prof: 'ovate', fill: LEAF.light }) + c.leaf(top[0], top[1], -65, 8, 3.5, { prof: 'ovate', fill: LEAF.light });
    }
    return out;
  } };

  PL.tomate = { H: 160, coty: '#93c062', draw: function(c, x, y, s, st) {
    var out = '', back = '', fruit = '';
    if (st >= 3) back += '<path d="M' + (x + 16) + ' ' + (y + 8) + 'L' + (x + 16) + ' ' + n(y - 160 * s - 6) + '" stroke="#b58c5a" stroke-width="3.2" stroke-linecap="round"/><path d="M' + (x + 15) + ' ' + (y + 8) + 'L' + (x + 15) + ' ' + n(y - 160 * s - 6) + '" stroke="rgba(255,235,200,.5)" stroke-width="0.9"/>';
    var P = c.stemPts(x, y, 158 * s, 7, 0.03);
    var nodes = st <= 2 ? 1 : st === 3 ? 5 : 7;
    // one compound leaf: a stalk with pairs of toothed leaflets and one at the end
    function compound(q, a, L, dk) {
      var tip = pt(q[0], q[1], a, L), ctl = pt(q[0], q[1], a - 12 * Math.sign(Math.cos(rad(a))), L * 0.5);
      var g = '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'Q' + n(ctl[0]) + ' ' + n(ctl[1] - 4) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#5d8b30" stroke-width="1.2" fill="none"/>';
      for (var j = 0; j < 3; j++) {
        var b = pt(q[0], q[1], a, L * (0.3 + j * 0.24)), sz = L * (0.3 - j * 0.02);
        g += c.leaf(b[0], b[1], a - 62, sz, sz * 0.45, { prof: 'ovate', fill: dk, teeth: 1, veins: 2, droop: 0.15 });
        g += c.leaf(b[0], b[1], a + 62, sz, sz * 0.45, { prof: 'ovate', fill: dk, teeth: 1, veins: 2, droop: 0.15 });
      }
      return g + c.leaf(tip[0], tip[1], a, L * 0.34, L * 0.16, { prof: 'ovate', fill: dk, teeth: 1, veins: 2 });
    }
    for (var i = 0; i < nodes; i++) {
      var q = along(P, 0.18 + i * (0.76 / nodes)), side = i % 2 ? 1 : -1;
      var a = -90 + side * (72 + c.rnd(-8, 6)), L = (44 - i * 3) * Math.max(0.45, s);
      var leaf = compound(q, a, L, i % 2 ? LEAF.dark : ['#356f27', '#7cbf4c', '#529a36']);
      if (i % 2) back += leaf; else out += leaf;
      if (st >= 4 && i >= 1 && i < nodes - 1) {
        var f = pt(q[0], q[1], -90 - side * 35, 12);
        out += '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'Q' + n(f[0]) + ' ' + n(f[1] - 4) + ' ' + n(f[0] - side * 4) + ' ' + n(f[1] + 6) + '" stroke="#5d8b30" stroke-width="0.9" fill="none"/>';
        if (st >= 5 && i % 2) fruit += c.tomato(f[0] - side * 4, f[1] + 12, 8, 1) + c.tomato(f[0] + side * 6, f[1] + 16, 7, i === 1 ? 1 : 0.7) + c.tomato(f[0] - side * 2, f[1] + 26, 6, 0.3);
        else if (st === 4 || (st >= 5 && i % 2 === 0)) out += c.star(f[0] - side * 4, f[1] + 7, 4.6, '#ffd83a', '#e2a90f') + c.star(f[0] + side * 3, f[1] + 11, 4, '#ffd83a', '#e2a90f');
      }
    }
    if (st >= 3) out += '<path d="M' + (x + 12) + ' ' + n(y - 55 * s) + 'q4 -3 7 0M' + (x + 12) + ' ' + n(y - 115 * s) + 'q4 -3 7 0" stroke="#e8dcb7" stroke-width="1.3" fill="none"/>';
    var top = along(P, 1);
    if (st === 2) out += c.leaf(top[0], top[1], -150, 18, 7, { prof: 'ovate', teeth: 1, fill: LEAF.dark, droop: 0.1 }) + c.leaf(top[0], top[1], -30, 18, 7, { prof: 'ovate', teeth: 1, fill: LEAF.dark, droop: 0.1 });
    else out += c.leaf(top[0], top[1], -125, 10, 4.5, { prof: 'ovate', teeth: 1, fill: LEAF.light }) + c.leaf(top[0], top[1], -55, 10, 4.5, { prof: 'ovate', teeth: 1, fill: LEAF.light });
    return back + c.stem(P, 2.4 + s * 2, '#5d8b30') + out + fruit;
  } };

  PL.lechuga = { H: 60, coty: '#b7dd7a', draw: function(c, x, y, s, st) {
    var out = '', R = 50 * s + 10;
    var outer = ['#4f8f2a', '#cdea8a', '#90c955'], inner = ['#6faa38', '#effabf', '#bfe580'];
    if (st <= 2) {
      out += c.leaf(x, y - 1, -150, 16, 7, { prof: 'spoon', ruff: 0.06, fill: outer, veins: 3 });
      out += c.leaf(x, y - 1, -30, 16, 7, { prof: 'spoon', ruff: 0.06, fill: outer, veins: 3 });
      return out + c.leaf(x, y - 1, -95, 12, 6, { prof: 'spoon', ruff: 0.06, fill: inner, veins: 2 });
    }
    // loose outer leaves lying out, then upright ruffled ones, then the heart
    var k = 9;
    for (var i = 0; i < k; i++) {
      var a = -172 + i * (164 / (k - 1)) + c.rnd(-5, 5), L = R * c.rnd(0.88, 1.04);
      out += c.leaf(x, y - 2, a, L, L * 0.46, { prof: 'spoon', ruff: 0.11, fill: outer, veins: 5, droop: Math.abs(a + 90) > 50 ? 0.12 : 0.02 });
    }
    for (var j = 0; j < 7; j++) {
      var a2 = -140 + j * 16.5 + c.rnd(-4, 4), L2 = R * 0.72;
      out += c.leaf(x, y - 4, a2, L2, L2 * 0.5, { prof: 'spoon', ruff: 0.13, fill: inner, veins: 4 });
    }
    for (var m = 0; m < 3; m++) out += c.leaf(x, y - 5, -115 + m * 25, R * 0.42, R * 0.24, { prof: 'spoon', ruff: 0.1, fill: ['#93c454', '#f6fdd6', '#d8f0a6'], veins: 2 });
    return out;
  } };

  PL.frutilla = { H: 60, from: 'plant', draw: function(c, x, y, s, st) {
    var out = '', k = st <= 1 ? 2 : st === 2 ? 3 : 6, h = 44 * s + 12;
    if (st >= 3) out += '<path d="M' + x + ' ' + (y - 2) + 'C' + (x + 30) + ' ' + (y - 14) + ' ' + (x + 52) + ' ' + (y - 6) + ' ' + (x + 64) + ' ' + y + '" stroke="#b5463c" stroke-width="1" fill="none"/>' + c.leaf(x + 64, y - 1, -110, 8, 4, { prof: 'ovate', teeth: 1, fill: LEAF.green, veins: 1 });
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (110 / Math.max(1, k - 1)) + c.rnd(-5, 5), top = pt(x, y, a, h * c.rnd(0.85, 1.05));
      out += '<path d="M' + x + ' ' + y + 'Q' + n((x + top[0]) / 2 + (a + 90) * 0.1) + ' ' + n((y + top[1]) / 2 - 6) + ' ' + n(top[0]) + ' ' + n(top[1]) + '" stroke="#6f8f35" stroke-width="1.2" fill="none"/>';
      var L = 15 * s + 6;
      out += c.leaf(top[0], top[1], a, L, L * 0.5, { prof: 'ovate', teeth: 1, fill: LEAF.dark, veins: 4 });
      out += c.leaf(top[0], top[1], a - 55, L * 0.9, L * 0.48, { prof: 'ovate', teeth: 1, fill: LEAF.dark, veins: 4 });
      out += c.leaf(top[0], top[1], a + 55, L * 0.9, L * 0.48, { prof: 'ovate', teeth: 1, fill: LEAF.dark, veins: 4 });
    }
    if (st >= 4) {
      out += '<path d="M' + x + ' ' + y + 'Q' + (x - 18) + ' ' + (y - 30) + ' ' + (x - 30) + ' ' + (y - 18) + 'M' + x + ' ' + y + 'Q' + (x + 16) + ' ' + (y - 26) + ' ' + (x + 26) + ' ' + (y - 12) + '" stroke="#7a9a3c" stroke-width="0.9" fill="none"/>';
      if (st >= 5) out += c.berry(x - 30, y - 12, 6.5, true) + c.berry(x + 26, y - 6, 5.5, true) + c.berry(x - 20, y - 6, 4.5, false);
      else out += c.round5(x - 30, y - 18, 6, '#fffef6', '#f1c232') + c.round5(x + 26, y - 12, 5.5, '#fffef6', '#f1c232');
    }
    return out;
  } };

  PL.rabano = { H: 50, coty: '#a9d36e', draw: function(c, x, y, s, st) {
    var out = '';
    if (st >= 4) {
      var red = c.def('rad', function(id) { return rg(id, 0.4, 0.35, 0.7, [[0, '#ff6b8a'], [0.6, '#d41e4b'], [1, '#8a0f2e']]); });
      var R = st >= 5 ? 12 : 7;
      out += '<path d="M' + x + ' ' + n(y + R * 0.6) + 'q1 9 0 16" stroke="#f3eee0" stroke-width="1.2" fill="none"/>';
      out += '<ellipse cx="' + x + '" cy="' + n(y - R * 0.3) + '" rx="' + n(R) + '" ry="' + n(R * 0.92) + '" fill="' + red + '"/>';
      out += '<ellipse cx="' + n(x - R * 0.35) + '" cy="' + n(y - R * 0.7) + '" rx="' + n(R * 0.3) + '" ry="' + n(R * 0.16) + '" fill="rgba(255,255,255,.45)"/>';
    }
    var k = st <= 2 ? 2 : 7, L0 = 40 * s + 8;
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (120 / Math.max(1, k - 1)) + c.rnd(-6, 6), L = L0 * c.rnd(0.8, 1.05);
      out += c.leaf(x, y - (st >= 4 ? 8 : 1), a, L, L * 0.26, { prof: 'spoon', teeth: 1, fill: LEAF.green, veins: 4, bend: (a + 90) / 60 * 0.3 });
    }
    return out;
  } };

  PL.menta = { H: 70, from: 'plant', draw: function(c, x, y, s, st) {
    var out = '', stems = st <= 2 ? 2 : 5;
    for (var k = 0; k < stems; k++) {
      var off = (k - (stems - 1) / 2) * 9, P = c.stemPts(x + off, y, (66 - Math.abs(off) * 0.8) * s + 10, 3, off * 0.012);
      out += c.stem(P, 1.6, '#6a5a3a', 'rgba(220,200,160,.5)');
      var pairs = st <= 2 ? 2 : 4;
      for (var i = 0; i < pairs; i++) {
        var q = along(P, 0.3 + i * (0.68 / pairs)), L = (15 - i * 1.5) * Math.max(0.65, s);
        out += c.leaf(q[0], q[1], -160 + i * 8, L, L * 0.5, { prof: 'ovate', teeth: 1, fill: ['#2f6b2a', '#8ccf73', '#57a04a'], bend: -0.15 });
        out += c.leaf(q[0], q[1], -20 - i * 8, L, L * 0.5, { prof: 'ovate', teeth: 1, fill: ['#2f6b2a', '#8ccf73', '#57a04a'], bend: 0.15 });
      }
      var top = along(P, 1);
      if (st >= 4 && k % 2 === 0) out += c.spike(top[0], top[1], 14, '#e5cff2');
      else out += c.leaf(top[0], top[1], -120, 7, 3.5, { prof: 'ovate', fill: LEAF.light }) + c.leaf(top[0], top[1], -60, 7, 3.5, { prof: 'ovate', fill: LEAF.light });
    }
    return out;
  } };

  PL.arveja = { H: 150, coty: null, draw: function(c, x, y, s, st) {
    var out = '';
    if (st >= 3) {
      // a little net of sticks to climb
      out += '<path d="M' + (x - 26) + ' ' + (y + 6) + 'L' + (x - 22) + ' ' + n(y - 150 * s - 8) + 'M' + (x + 26) + ' ' + (y + 6) + 'L' + (x + 22) + ' ' + n(y - 150 * s - 8) + '" stroke="#b08a58" stroke-width="2.4" stroke-linecap="round"/>';
      for (var g = 1; g < 6; g++) out += '<path d="M' + (x - 24) + ' ' + n(y - g * 150 * s / 6) + 'H' + (x + 24) + '" stroke="rgba(230,220,190,.9)" stroke-width="0.7"/>';
    }
    var P = c.stemPts(x, y, 150 * s, 10, 0), nodes = st <= 2 ? 2 : st === 3 ? 6 : 8;
    out += c.stem(P, 1.6 + s, '#79a64a', 'rgba(225,245,200,.6)');
    for (var i = 0; i < nodes; i++) {
      var q = along(P, 0.18 + i * (0.8 / nodes)), side = i % 2 ? 1 : -1, L = 13 * Math.max(0.6, s) + 3;
      out += c.leaf(q[0], q[1], -90 + side * 55, L, L * 0.48, { prof: 'oval', fill: LEAF.blue, veins: 2 });
      out += c.leaf(q[0], q[1], -90 + side * 115, L * 0.9, L * 0.45, { prof: 'oval', fill: LEAF.blue, veins: 2 });
      if (st >= 3) { var t1 = pt(q[0], q[1], -90 - side * 30, 10); out += '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'Q' + n(t1[0]) + ' ' + n(t1[1]) + ' ' + n(t1[0] - side * 3) + ' ' + n(t1[1] - 5) + 'a2.2 2.2 0 1 1 ' + (side * 2.5) + ' 1.5" stroke="#8fbf5c" stroke-width="0.7" fill="none"/>'; }
      if (st === 4 && i % 3 === 1) out += c.peaFlower(q[0] + side * 7, q[1] + 3, 4.2);
      if (st >= 5 && i % 2 === 1 && i < nodes - 1) out += c.pod(q[0] - side * 2, q[1] + 3, 22, 85 + side * 14, ['#6fb03d', '#b8e57d'], true);
    }
    return out;
  } };

  PL.zanahoria = { H: 80, coty: '#9fca5f', mono: false, draw: function(c, x, y, s, st) {
    var out = '';
    if (st >= 4) {
      var org = c.def('car', function(id) { return lg(id, 0, 0, 1, 0, [[0, '#ff9a3d'], [0.5, '#f07c12'], [1, '#c75a06']]); });
      out += '<path d="M' + (x - 8) + ' ' + (y - 4) + 'Q' + x + ' ' + (y - 8) + ' ' + (x + 8) + ' ' + (y - 4) + 'L' + (x + 5) + ' ' + (y + 4) + 'L' + (x - 5) + ' ' + (y + 4) + 'Z" fill="' + org + '"/>';
    }
    var k = st <= 2 ? 2 : 6, H = 74 * s + 8;
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (70 / Math.max(1, k - 1)), tip = pt(x, y - 5, a, H * c.rnd(0.85, 1.05));
      out += '<path d="M' + x + ' ' + (y - 5) + 'Q' + n((x + tip[0]) / 2) + ' ' + n((y + tip[1]) / 2) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#5f9334" stroke-width="1.1" fill="none"/>';
      // feathery fronds: little forked leaflets along the stalk
      for (var j = 2; j < 9; j++) {
        var b = [x + (tip[0] - x) * j / 9, y - 5 + (tip[1] - y + 5) * j / 9], w = 8 * (1 - j / 11) * Math.max(0.5, s);
        for (var side = -1; side <= 1; side += 2) {
          var e = pt(b[0], b[1], a + side * 60, w);
          out += '<path d="M' + n(b[0]) + ' ' + n(b[1]) + 'L' + n(e[0]) + ' ' + n(e[1]) + 'M' + n((b[0] + e[0]) / 2) + ' ' + n((b[1] + e[1]) / 2) + 'l' + n(side * 2) + ' -2.4M' + n(e[0]) + ' ' + n(e[1]) + 'l' + n(side * 1.6) + ' -2" stroke="#4f8a2c" stroke-width="1.1" stroke-linecap="round"/>';
        }
      }
    }
    return out;
  } };

  PL.zapallito = { H: 95, coty: '#a8cf68', draw: function(c, x, y, s, st) {
    var out = '', k = st <= 2 ? 2 : st === 3 ? 5 : 7;
    if (st >= 5) out += c.cuke(x + 6, y - 4, 52, 8, true) + c.cuke(x - 54, y - 2, 40, -6, true);
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (150 / Math.max(1, k - 1)), L = (60 * s + 10) * c.rnd(0.8, 1), tip = pt(x, y - 4, a, L);
      out += '<path d="M' + x + ' ' + (y - 4) + 'Q' + n((x + tip[0]) / 2) + ' ' + n(Math.min(y, tip[1]) - 6) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#7ea94a" stroke-width="2" fill="none"/>';
      out += c.palmLeaf(tip[0], tip[1] - 6, 24 * s + 7, a + 90, { lobes: 5, deep: 0.28, spots: st >= 3, fill: LEAF.dark, teeth: 1 });
    }
    if (st >= 4) out += c.trumpet(x - 8, y - 10, 9, -20) + (st === 4 ? c.trumpet(x + 12, y - 8, 8, 25) : '');
    return out;
  } };

  PL.pepino = { H: 140, coty: '#a8cf68', draw: function(c, x, y, s, st) {
    var out = '';
    if (st >= 3) {
      var top = n(y - 140 * s - 6);
      out += '<path d="M' + (x - 34) + ' ' + (y + 6) + 'L' + (x - 34) + ' ' + top + 'M' + (x + 34) + ' ' + (y + 6) + 'L' + (x + 34) + ' ' + top + '" stroke="#a7825a" stroke-width="2.4"/>';
      for (var g = 0; g < 7; g++) out += '<path d="M' + (x - 34) + ' ' + n(y - g * 140 * s / 6) + 'L' + (x + 34) + ' ' + n(y - (g + 1) * 140 * s / 6) + 'M' + (x + 34) + ' ' + n(y - g * 140 * s / 6) + 'L' + (x - 34) + ' ' + n(y - (g + 1) * 140 * s / 6) + '" stroke="rgba(235,228,205,.85)" stroke-width="0.6"/>';
    }
    var P = c.stemPts(x, y, 140 * s, 14, 0), nodes = st <= 2 ? 1 : st === 3 ? 5 : 7;
    out += c.stem(P, 1.8 + s, '#6f9c3f');
    for (var i = 0; i < nodes; i++) {
      var q = along(P, 0.2 + i * (0.78 / nodes)), side = i % 2 ? 1 : -1, tip = pt(q[0], q[1], -90 + side * 70, 12);
      out += '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'L' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#6f9c3f" stroke-width="1"/>';
      out += c.palmLeaf(tip[0], tip[1] - 4, 15 * s + 5, side * 20, { lobes: 5, deep: 0.14, fill: LEAF.green, teeth: 1 });
      if (st >= 3) { var t1 = pt(q[0], q[1], -90 - side * 50, 9); out += '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'L' + n(t1[0]) + ' ' + n(t1[1]) + 'a2 2 0 1 0 ' + (-side * 2.6) + ' -1.4a1.4 1.4 0 1 1 ' + (side * 1.4) + ' -1" stroke="#8cbf55" stroke-width="0.7" fill="none"/>'; }
      if (st === 4 && i % 2 === 0) out += c.round5(q[0] - side * 6, q[1] + 4, 4, '#ffd83a', '#e7a80e', 'rgba(170,120,0,.4)');
      if (st >= 5 && i % 2 === 1 && i < nodes - 1) out += c.cuke(q[0] - side * 2, q[1] + 2, 26, 90 - side * 12, false);
    }
    return out;
  } };

  PL.choclo = { H: 175, mono: true, draw: function(c, x, y, s, st) {
    var out = '', H = 172 * s, P = c.stemPts(x, y, H, 2, 0);
    out += c.stem(P, 3 + s * 3.5, '#6d9a38', 'rgba(220,240,170,.6)');
    var nodes = st <= 2 ? 2 : st === 3 ? 6 : 8;
    for (var i = 0; i < nodes; i++) {
      var q = along(P, 0.1 + i * (0.75 / nodes)), side = i % 2 ? 1 : -1, L = (70 - i * 3) * Math.max(0.4, s) + 8;
      out += c.leaf(q[0], q[1], -90 + side * (38 + i * 3), L, 3.8 + s * 2, { prof: 'blade', fill: LEAF.green, droop: 0.42, bend: 0.1, veins: 0 });
    }
    if (st >= 4) {
      var top = along(P, 1);
      for (var t = 0; t < 7; t++) out += '<path d="M' + n(top[0]) + ' ' + n(top[1]) + 'q' + n((t - 3) * 3) + ' -8 ' + n((t - 3) * 6) + ' -6" stroke="#c9a85a" stroke-width="1.1" fill="none"/>';
      var ear = along(P, 0.52);
      out += c.cob(ear[0] + 3, ear[1] + 6, st >= 5 ? 34 : 22, 22);
    }
    return out;
  } };

  PL.cilantro = { H: 70, coty: '#a5d16c', draw: function(c, x, y, s, st) {
    var out = '', k = st <= 2 ? 3 : 8, H = 52 * s + 10;
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (120 / Math.max(1, k - 1)) + c.rnd(-6, 6), tip = pt(x, y, a, H * c.rnd(0.8, 1.05));
      out += '<path d="M' + x + ' ' + y + 'Q' + n((x + tip[0]) / 2) + ' ' + n((y + tip[1]) / 2 - 3) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#6b9a3a" stroke-width="1" fill="none"/>';
      out += c.palmLeaf(tip[0], tip[1], 6 + 4 * s, a + 90, { lobes: 3, deep: 0.35, fill: LEAF.green, teeth: 1 });
    }
    if (st >= 4) {
      var P = c.stemPts(x + 3, y, 76 * s, 3, 0), top = along(P, 1);
      out += c.stem(P, 1.4, '#6b9a3a') + c.umbel(top[0], top[1], 9);
      if (st >= 5) for (var j = 0; j < 6; j++) out += '<circle cx="' + n(top[0] + (j - 2.5) * 3) + '" cy="' + n(top[1] - 8 + Math.abs(j - 2.5) * 1.4) + '" r="1.5" fill="#a8a35a" stroke="#6f6a2a" stroke-width="0.3"/>';
    }
    return out;
  } };

  PL.perejil = { H: 60, coty: '#a5d16c', draw: function(c, x, y, s, st) {
    var out = '', k = st <= 2 ? 3 : 9, H = 50 * s + 10;
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (130 / Math.max(1, k - 1)) + c.rnd(-5, 5), tip = pt(x, y, a, H * c.rnd(0.8, 1.05));
      out += '<path d="M' + x + ' ' + y + 'Q' + n((x + tip[0]) / 2) + ' ' + n((y + tip[1]) / 2 - 4) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#5b8f30" stroke-width="1.1" fill="none"/>';
      for (var j = -1; j <= 1; j++) out += c.palmLeaf(pt(tip[0], tip[1], a + j * 40, 5)[0], pt(tip[0], tip[1], a + j * 40, 5)[1], 5 + 2.5 * s, a + 90 + j * 40, { lobes: 3, deep: 0.3, fill: LEAF.dark, teeth: 1 });
    }
    return out;
  } };

  PL.ciboulette = { H: 70, mono: true, draw: function(c, x, y, s, st) {
    var out = '', k = st <= 2 ? 3 : 14, H = 60 * s + 10;
    for (var i = 0; i < k; i++) {
      var dx = (i - (k - 1) / 2) * 1.8, a = -90 + dx * 2.4 + c.rnd(-4, 4), tip = pt(x + dx, y, a, H * c.rnd(0.8, 1.05));
      out += '<path d="M' + n(x + dx) + ' ' + y + 'Q' + n(x + dx + (tip[0] - x - dx) * 0.3) + ' ' + n((y + tip[1]) / 2) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="' + (i % 3 ? '#4f8f33' : '#6fae45') + '" stroke-width="2.2" stroke-linecap="round" fill="none"/>';
      if (st >= 4 && i % 4 === 1) out += c.pompom(tip[0], tip[1] - 3, 5);
    }
    return out;
  } };

  PL.calendula = { H: 60, coty: '#a5d16c', draw: function(c, x, y, s, st) {
    var out = '', k = st <= 2 ? 2 : 7;
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (150 / Math.max(1, k - 1)), L = (30 * s + 8) * c.rnd(0.85, 1.05);
      out += c.leaf(x, y - 1, a, L, L * 0.28, { prof: 'spoon', fill: ['#4f8a2c', '#a8d672', '#7cb34a'], veins: 2 });
    }
    if (st >= 3) {
      var heads = st >= 4 ? 3 : 1;
      for (var j = 0; j < heads; j++) {
        var P = c.stemPts(x + (j - 1) * 10, y, (50 + (j % 2) * 10) * s, 3, (j - 1) * 0.3), top = along(P, 1);
        out += c.stem(P, 1.6, '#5f8f34');
        out += c.leaf(along(P, 0.5)[0], along(P, 0.5)[1], -90 + (j - 1) * 60 - 30, 12 * s, 3.5, { prof: 'spoon', fill: ['#4f8a2c', '#a8d672', '#7cb34a'], veins: 1 });
        out += st >= 4 ? c.daisy(top[0], top[1], 11, j === 1 ? '#ffb21f' : '#ff8a14', '#e0600a', '#a6450c', 22) : '<ellipse cx="' + n(top[0]) + '" cy="' + n(top[1]) + '" rx="3" ry="4" fill="#78a63f"/>';
      }
    }
    return out;
  } };

  PL.capuchina = { H: 60, coty: '#a5d16c', draw: function(c, x, y, s, st) {
    var out = '', k = st <= 2 ? 2 : st === 3 ? 6 : 8;
    for (var i = 0; i < k; i++) {
      var a = -90 + (i - (k - 1) / 2) * (160 / Math.max(1, k - 1)) + c.rnd(-8, 8), L = (44 * s + 8) * c.rnd(0.75, 1.05), tip = pt(x, y, a, L);
      out += '<path d="M' + x + ' ' + y + 'Q' + n((x + tip[0]) / 2) + ' ' + n(Math.min(y, tip[1]) - 8) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#8cb55a" stroke-width="1.2" fill="none"/>';
      out += c.shield(tip[0], tip[1], 9 * s + 5, (a + 90) * 0.25);
    }
    if (st >= 4) { var cols = ['#ff7a12', '#e8341c', '#ffb01f']; for (var j = 0; j < (st >= 5 ? 4 : 3); j++) { var p = pt(x, y, -150 + j * 40, 30 + (j % 2) * 10); out += c.nastFlower(p[0], p[1] - 4, 7, cols[j % 3]); } }
    return out;
  } };

  PL.papa = { H: 85, from: 'tuber', draw: function(c, x, y, s, st) {
    var out = '';
    if (st >= 5) {
      var sk = c.def('pot', function(id) { return rg(id, 0.4, 0.35, 0.75, [[0, '#f0d39a'], [0.6, '#cfa565'], [1, '#93683a']]); });
      [[x - 44, y + 1, 9, 6.5], [x + 40, y + 2, 8, 6], [x + 52, y, 6, 4.5]].forEach(function(t) {
        out += '<ellipse cx="' + t[0] + '" cy="' + t[1] + '" rx="' + t[2] + '" ry="' + t[3] + '" fill="' + sk + '" stroke="rgba(100,65,25,.5)" stroke-width="0.5"/><circle cx="' + (t[0] - 2) + '" cy="' + (t[1] - 1) + '" r="0.7" fill="#7a5226"/><circle cx="' + (t[0] + 3) + '" cy="' + (t[1] + 1) + '" r="0.6" fill="#7a5226"/>';
      });
    }
    var stems = st <= 2 ? 1 : 4;
    for (var k = 0; k < stems; k++) {
      var off = (k - (stems - 1) / 2) * 10, P = c.stemPts(x + off, y, (80 - Math.abs(off)) * s + 6, 4, off * 0.02);
      out += c.stem(P, 2 + s, '#567f2e');
      var nodes = st <= 2 ? 2 : 4;
      for (var i = 0; i < nodes; i++) {
        var q = along(P, 0.3 + i * (0.65 / nodes)), side = (i + k) % 2 ? 1 : -1, a = -90 + side * 55, L = 22 * Math.max(0.5, s);
        var tip = pt(q[0], q[1], a, L);
        out += '<path d="M' + n(q[0]) + ' ' + n(q[1]) + 'L' + n(tip[0]) + ' ' + n(tip[1]) + '" stroke="#567f2e" stroke-width="0.9"/>';
        out += c.leaf(tip[0], tip[1], a, L * 0.4, L * 0.2, { prof: 'ovate', fill: LEAF.dark, veins: 2 });
        out += c.leaf(pt(q[0], q[1], a, L * 0.5)[0], pt(q[0], q[1], a, L * 0.5)[1], a - 70, L * 0.34, L * 0.17, { prof: 'ovate', fill: LEAF.dark, veins: 2 });
        out += c.leaf(pt(q[0], q[1], a, L * 0.5)[0], pt(q[0], q[1], a, L * 0.5)[1], a + 70, L * 0.34, L * 0.17, { prof: 'ovate', fill: LEAF.dark, veins: 2 });
      }
      var top = along(P, 1);
      if (st === 4 && k % 2 === 0) out += c.star(top[0], top[1] - 2, 5, '#f4efff', '#f2c230') + c.star(top[0] + 7, top[1] + 2, 4.5, '#e4d4f6', '#f2c230');
    }
    return out;
  } };

  PL.aji = { H: 90, coty: '#9cc768', draw: function(c, x, y, s, st) {
    var P = c.stemPts(x, y, 86 * s, 4, 0), out = c.stem(P, 2 + s * 1.5, '#4f7d2a');
    var nodes = st <= 2 ? 1 : st === 3 ? 5 : 7;
    for (var i = 0; i < nodes; i++) {
      var q = along(P, 0.3 + i * (0.65 / nodes)), side = i % 2 ? 1 : -1, br = pt(q[0], q[1], -90 + side * 45, 18 * s);
      if (st >= 3) out += c.stem([[q[0], q[1]], [n((q[0] + br[0]) / 2), n((q[1] + br[1]) / 2 - 2)], [br[0], br[1]]], 1.2, '#4f7d2a');
      var L = 18 * Math.max(0.6, s);
      out += c.leaf(br[0], br[1], -90 + side * 70, L, L * 0.36, { prof: 'lance', fill: LEAF.glossy, droop: 0.1 });
      out += c.leaf(br[0], br[1], -90 + side * 20, L * 0.8, L * 0.3, { prof: 'lance', fill: LEAF.glossy });
      if (st === 4 && i % 2 === 0) out += c.star(br[0] - side * 3, br[1] + 6, 3.4, '#fbfbf2', '#c7c07a');
      if (st >= 5 && i % 2 === 0) out += c.chili(br[0] - side * 2, br[1] + 4, 18, side * 12, i !== 2);
    }
    if (st === 2) { var q2 = along(P, 1); out += c.leaf(q2[0], q2[1], -140, 12, 4, { prof: 'lance', fill: LEAF.glossy }) + c.leaf(q2[0], q2[1], -40, 12, 4, { prof: 'lance', fill: LEAF.glossy }); }
    return out;
  } };

  var SCALE = [0, 0.16, 0.3, 0.62, 0.86, 1];

  // The seed (or the potato, or the young plant) in the soil.
  function seedShape(c, id, x, y) {
    var p = PL[id];
    if (p && p.from === 'tuber') return '<ellipse cx="' + x + '" cy="' + y + '" rx="9" ry="6.5" fill="#d1a868" stroke="#8a6232" stroke-width="0.6"/><path d="M' + (x - 2) + ' ' + (y - 6) + 'q-1 -4 1 -6M' + (x + 4) + ' ' + (y - 5) + 'q1 -3 3 -4" stroke="#cfe0a0" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    var big = { poroto: [6, 4, '#b04a3a'], maravilla: [5, 2.4, '#3a3530'], arveja: [3.6, 3.4, '#c9c79a'], choclo: [4, 3.4, '#e9c043'], zapallito: [5, 2.6, '#efe4c1'], pepino: [4, 1.8, '#f0e8cc'], capuchina: [4, 3.6, '#a29462'], aji: [2.6, 2.2, '#efdca0'] };
    var b = big[id] || [2, 1.5, '#5b4a35'];
    var s = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + b[0] + '" ry="' + b[1] + '" fill="' + b[2] + '" stroke="rgba(30,15,5,.55)" stroke-width="0.5"/>';
    if (id === 'maravilla') s += '<path d="M' + (x - 4) + ' ' + y + 'H' + (x + 4) + '" stroke="#e8e0d0" stroke-width="0.5"/>';
    if (id === 'poroto') s += '<ellipse cx="' + (x - 1.5) + '" cy="' + (y - 1.5) + '" rx="1.6" ry="0.8" fill="rgba(255,255,255,.45)"/>';
    return s;
  }
  // Roots under the soil (seen through the cup, or in the lens).
  function roots(c, x, y, len) {
    var s = '';
    for (var i = 0; i < 5; i++) {
      var a = 90 + (i - 2) * 24 + c.rnd(-8, 8), e = pt(x, y, a, len * c.rnd(0.6, 1)), m = pt(x, y, a + c.rnd(-15, 15), len * 0.5);
      s += '<path d="M' + x + ' ' + y + 'Q' + n(m[0]) + ' ' + n(m[1]) + ' ' + n(e[0]) + ' ' + n(e[1]) + '" stroke="#efe6cf" stroke-width="' + (i === 2 ? 1.3 : 0.7) + '" fill="none" stroke-linecap="round"/>';
    }
    return s;
  }
  // The first shoot: two seed leaves on a little arched stem (one blade for grasses and onions).
  function sprout(c, id, x, y, h) {
    var p = PL[id] || {}, s = '';
    if (p.mono) {
      return '<path d="M' + x + ' ' + y + 'Q' + (x + 1) + ' ' + (y - h * 0.6) + ' ' + (x + 4) + ' ' + (y - h) + '" stroke="#7cb342" stroke-width="2.2" stroke-linecap="round" fill="none"/>' + (id === 'choclo' ? '<path d="M' + x + ' ' + (y - h * 0.4) + 'q-6 -6 -9 -14" stroke="#8fc456" stroke-width="2.6" stroke-linecap="round" fill="none"/>' : '');
    }
    if (p.from === 'plant' || p.from === 'tuber') return '';
    s += c.stem([[x, y], [x + 1, y - h * 0.5], [x, y - h]], 2, '#8bb04f');
    var col = p.coty || '#a6cd6a', thick = id === 'poroto';
    var fill = [col, '#e4f5b5', col];
    s += c.leaf(x, y - h, -165, thick ? 11 : 9, thick ? 6 : 4.2, { prof: 'round', fill: fill, veins: 0, lw: 0.7 });
    s += c.leaf(x, y - h, -15, thick ? 11 : 9, thick ? 6 : 4.2, { prof: 'round', fill: fill, veins: 0, lw: 0.7 });
    return s;
  }

  // The whole picture of plant `id` at a stage.
  function plant(id, st, o) {
    o = o || {};
    st = Math.max(0, Math.min(5, st | 0));
    var where = o.where || 'pot';
    var c = new Ctx(hash(id + '|' + (o.seed || 0)), where);
    var box = c.container(), y = SOIL_Y, x = 100, p = PL[id];
    var mid = '', under = '';
    if (!p) return '';
    if (st === 0) {
      var sx = where === 'cup' ? 100 : 100;
      under += seedShape(c, id, sx, where === 'cup' ? y + 12 : y + 14);
      if (where === 'cup' && p.from !== 'plant') under += '<path d="M' + (sx + 2) + ' ' + (y + 15) + 'q2 4 1 7" stroke="#efe6cf" stroke-width="0.9" fill="none"/>';
      if (p.from === 'plant') mid += c.stem([[x, y], [x, y - 8]], 2, '#6b8f3a') + c.leaf(x, y - 8, -140, 9, 4, { prof: 'ovate', fill: LEAF.green }) + c.leaf(x, y - 8, -40, 9, 4, { prof: 'ovate', fill: LEAF.green });
      else mid += '<path d="M' + (x - 10) + ' ' + (y - 1) + 'q10 -4 20 0" stroke="rgba(120,85,50,.7)" stroke-width="1.6" fill="none"/>';
    } else if (st === 1) {
      under += roots(c, x, y + 2, 16);
      if (p.from === 'plant' || p.from === 'tuber') mid += p.draw(c, x, y, 0.14, 2);
      else mid += sprout(c, id, x, y, 14 + (id === 'maravilla' || id === 'poroto' || id === 'choclo' ? 8 : 0));
    } else {
      under += roots(c, x, y + 2, 20 + st * 4);
      var s = SCALE[st];
      // a dicot from seed keeps its seed leaves while young
      if (st === 2 && !p.mono && p.from !== 'plant' && p.from !== 'tuber') mid += sprout(c, id, x, y, 10);
      mid += p.draw(c, x, y, s, st);
    }
    var cutaway = where === 'cup' ? '<g opacity=".9">' + under + '</g>' : '';
    // a lens shows what is under the soil when you cannot see it
    var lens = '';
    if (st === 0 && where !== 'cup') {
      var lid = c.id + 'lens';
      lens = '<defs><clipPath id="' + lid + '"><circle cx="160" cy="200" r="26"/></clipPath></defs>' +
        '<path d="M110 ' + (y + 4) + 'L140 186" stroke="rgba(60,40,20,.5)" stroke-width="1" stroke-dasharray="2 2"/>' +
        '<g clip-path="url(#' + lid + ')"><rect x="130" y="170" width="60" height="60" fill="#4e3320"/><rect x="130" y="170" width="60" height="16" fill="#9fd3f0"/><path d="M130 186H190" stroke="#6b4a2e" stroke-width="2"/>' + soilDots(c, 134, 186, 188, 226, 30) + seedShape(c, id, 160, 206) + '</g>' +
        '<circle cx="160" cy="200" r="26" fill="none" stroke="#3b3b44" stroke-width="3"/><circle cx="160" cy="200" r="24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1"/><path d="M178 219L190 232" stroke="#3b3b44" stroke-width="5" stroke-linecap="round"/>';
    }
    var label = o.label ? '<title>' + esc(o.label) + '</title>' : '';
    // fit: crop the empty sky above a young plant (for small pictures)
    var top = 0;
    if (o.fit) top = st <= 1 ? 120 : st === 2 ? 95 : st === 3 && (p.H || 100) < 100 ? 70 : (p.H || 100) < 100 ? 40 : 0;
    return '<svg class="hu-art" viewBox="' + (top ? '10 ' + top + ' 182 ' + (240 - top) : '0 0 200 240') + '" role="img"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : ' aria-hidden="true"') + ' xmlns="http://www.w3.org/2000/svg">' + label +
      '<defs>' + c.defs.join('') + '</defs>' + box.back + cutaway + (where === 'bed' ? '<g opacity=".95">' + under + '</g>' : '') + mid + box.front + lens + '</svg>';
  }

  // ---------- small pictures ----------
  function icon(name) {
    var s = '<svg class="hu-ico" viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">';
    var id = 'hi' + (++uid);
    switch (name) {
      case 'sun':
        s += '<defs>' + rg(id, 0.4, 0.4, 0.6, [[0, '#fff3a6'], [0.6, '#ffcb2e'], [1, '#f29a0c']]) + '</defs>';
        for (var i = 0; i < 12; i++) { var a = i * 30, p = pt(24, 24, a, 15), q = pt(24, 24, a, 21); s += '<path d="M' + n(p[0]) + ' ' + n(p[1]) + 'L' + n(q[0]) + ' ' + n(q[1]) + '" stroke="#f5a90f" stroke-width="2.6" stroke-linecap="round"/>'; }
        s += '<circle cx="24" cy="24" r="11" fill="url(#' + id + ')"/>'; break;
      case 'part':
        s += '<defs>' + rg(id, 0.4, 0.4, 0.6, [[0, '#fff3a6'], [0.6, '#ffcb2e'], [1, '#f29a0c']]) + lg(id + 'c', 0, 0, 0, 1, [[0, '#ffffff'], [1, '#c9d3e0']]) + '</defs>';
        for (var j = 0; j < 8; j++) { var a2 = j * 45 - 90, p2 = pt(19, 19, a2, 11), q2 = pt(19, 19, a2, 16); s += '<path d="M' + n(p2[0]) + ' ' + n(p2[1]) + 'L' + n(q2[0]) + ' ' + n(q2[1]) + '" stroke="#f5a90f" stroke-width="2.4" stroke-linecap="round"/>'; }
        s += '<circle cx="19" cy="19" r="8" fill="url(#' + id + ')"/><path d="M14 38a7 7 0 0 1 3-13a9 9 0 0 1 17-2a7 7 0 0 1 3 15z" fill="url(#' + id + 'c)" stroke="#9aa8bb" stroke-width="1"/>'; break;
      case 'drop':
        s += '<defs>' + lg(id, 0, 0, 1, 1, [[0, '#9fe0ff'], [0.5, '#3aa4e8'], [1, '#1667b8']]) + '</defs><path d="M24 5C18 15 11 22 11 30a13 13 0 0 0 26 0c0-8-7-15-13-25z" fill="url(#' + id + ')" stroke="#155a9c" stroke-width="1"/><path d="M17 29a7 7 0 0 0 4 7" stroke="rgba(255,255,255,.8)" stroke-width="2.4" stroke-linecap="round" fill="none"/>'; break;
      case 'dropoff':
        s += '<path d="M24 5C18 15 11 22 11 30a13 13 0 0 0 26 0c0-8-7-15-13-25z" fill="#e8eef4" stroke="#b8c4d0" stroke-width="1.2" stroke-dasharray="3 2"/>'; break;
      case 'cup':
        s += '<path d="M12 10L16 42H32L36 10Z" fill="rgba(200,225,240,.5)" stroke="#8aa4b4" stroke-width="1.4"/><path d="M14.5 24L16 42H32L33.5 24Z" fill="#5a3d26"/><path d="M24 24q-1-7 1-10" stroke="#5f9e30" stroke-width="2" fill="none"/><ellipse cx="21" cy="14" rx="4" ry="2" fill="#7fbf4a" transform="rotate(-25 21 14)"/><ellipse cx="28" cy="14" rx="4" ry="2" fill="#7fbf4a" transform="rotate(25 28 14)"/>'; break;
      case 'pot':
        s += '<defs>' + lg(id, 0, 0, 1, 0, [[0, '#a4502c'], [0.35, '#e08a57'], [1, '#8a3e20']]) + '</defs><path d="M24 22q-1-9 2-13" stroke="#5f9e30" stroke-width="2" fill="none"/><ellipse cx="21" cy="12" rx="5" ry="2.4" fill="#6fae45" transform="rotate(-25 21 12)"/><ellipse cx="30" cy="12" rx="5" ry="2.4" fill="#6fae45" transform="rotate(25 30 12)"/><path d="M13 28L16 43H32L35 28Z" fill="url(#' + id + ')"/><rect x="10" y="21" width="28" height="8" rx="1.5" fill="url(#' + id + ')"/>'; break;
      case 'bed':
        s += '<path d="M3 30Q24 24 45 30V38H3Z" fill="#5b3d24"/><rect x="2" y="36" width="44" height="7" fill="#b07a45"/>';
        [10, 24, 38].forEach(function(x) { s += '<path d="M' + x + ' 29q-1-8 1-12" stroke="#4f8f33" stroke-width="1.8" fill="none"/><ellipse cx="' + (x - 3) + '" cy="19" rx="4" ry="2" fill="#6fae45" transform="rotate(-30 ' + (x - 3) + ' 19)"/><ellipse cx="' + (x + 3) + '" cy="20" rx="4" ry="2" fill="#6fae45" transform="rotate(30 ' + (x + 3) + ' 20)"/>'; }); break;
      case 'ruler':
        s += '<rect x="4" y="16" width="40" height="16" rx="2" fill="#f7d774" stroke="#b8901c"/>';
        for (var k = 0; k <= 8; k++) s += '<path d="M' + (7 + k * 4.25) + ' 16v' + (k % 2 ? 4 : 7) + '" stroke="#6b5310" stroke-width="1"/>'; break;
      case 'bag':
        s += '<rect x="9" y="6" width="30" height="36" rx="3" fill="rgba(210,235,250,.6)" stroke="#8aa4b4" stroke-width="1.4"/><path d="M9 11H39" stroke="#3a9de0" stroke-width="2.4"/><rect x="12" y="14" width="24" height="25" fill="#f4f1e6"/><ellipse cx="19" cy="25" rx="4" ry="3" fill="#b04a3a"/><path d="M19 28q0 5 -2 8" stroke="#efe6cf" stroke-width="1.4" fill="none"/><ellipse cx="29" cy="22" rx="4" ry="3" fill="#b04a3a"/><path d="M29 19q1-4 4-5" stroke="#7cb342" stroke-width="1.6" fill="none"/>'; break;
      case 'sprout':
        s += '<path d="M8 40Q24 34 40 40" stroke="#6b4a2e" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M24 38q-1-12 1-20" stroke="#5f9e30" stroke-width="2.6" fill="none"/><path d="M25 20C18 20 13 15 12 9C20 9 24 13 25 20Z" fill="#7fbf4a" stroke="#4f8a2c"/><path d="M25 22C31 22 36 17 37 11C29 11 26 15 25 22Z" fill="#8fcf55" stroke="#4f8a2c"/>'; break;
      case 'flower':
        s += '<path d="M24 44V22" stroke="#5f9e30" stroke-width="2.4"/>';
        for (var f = 0; f < 6; f++) { var fp = pt(24, 18, f * 60, 7); s += '<circle cx="' + n(fp[0]) + '" cy="' + n(fp[1]) + '" r="6" fill="#ffd21f" stroke="#e29a0c"/>'; }
        s += '<circle cx="24" cy="18" r="5" fill="#7a4a12"/>'; break;
      case 'basket':
        s += '<path d="M8 22H40L36 42H12Z" fill="#c98f4f" stroke="#8a5a28"/><path d="M10 28H38M11 34H37" stroke="#8a5a28"/><circle cx="18" cy="19" r="6" fill="#e0301e"/><circle cx="29" cy="18" r="6" fill="#f07a2a"/><path d="M14 22q10-22 20 0" stroke="#8a5a28" stroke-width="2.4" fill="none"/>'; break;
      case 'pencil':
        s += '<path d="M10 38L12 30L32 10L38 16L18 36Z" fill="#f6c443" stroke="#9a7413"/><path d="M10 38L12 30L18 36Z" fill="#f3d9b0"/><path d="M10 38L11 35L13 37Z" fill="#333"/><path d="M32 10L38 16L40 14Q41 12 39 10L36 7Q34 6 33 8Z" fill="#e88c8c"/>'; break;
      case 'camera':
        s += '<rect x="5" y="14" width="38" height="26" rx="5" fill="#4b5563"/><rect x="16" y="9" width="14" height="7" rx="2" fill="#4b5563"/><circle cx="24" cy="27" r="9" fill="#cbd5e1" stroke="#1f2937" stroke-width="2"/><circle cx="24" cy="27" r="5" fill="#1e3a5f"/><circle cx="22" cy="25" r="1.5" fill="#fff"/>'; break;
      case 'chart':
        s += '<rect x="5" y="6" width="38" height="36" rx="4" fill="#fff" stroke="#cbd5e1"/><path d="M10 36L18 28L25 31L38 14" stroke="#16a34a" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="18" cy="28" r="2" fill="#16a34a"/><circle cx="25" cy="31" r="2" fill="#16a34a"/><circle cx="38" cy="14" r="2" fill="#16a34a"/>'; break;
      case 'globe':
        s += '<defs>' + rg(id, 0.35, 0.35, 0.7, [[0, '#9fdcff'], [1, '#1f6fb5']]) + '</defs><circle cx="24" cy="24" r="18" fill="url(#' + id + ')"/><path d="M14 14q6 2 6 7t-5 6q-2 4 1 8M30 9q-3 4 0 7t6 3q3 4 0 9" stroke="#3e9a46" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M6 24H42" stroke="rgba(255,255,255,.7)" stroke-dasharray="2 2"/>'; break;
      case 'lab':
        s += '<path d="M19 6H29M20 6V18L9 38Q8 42 12 42H36Q40 42 39 38L28 18V6" fill="#e0f2fe" stroke="#0e7490" stroke-width="1.6"/><path d="M13 32H35L38 38Q39 41 36 41H12Q9 41 10 38Z" fill="#22c55e"/><circle cx="20" cy="36" r="1.6" fill="#fff"/><circle cx="27" cy="34" r="1.2" fill="#fff"/>'; break;
      case 'leafbook':
        s += '<path d="M6 10Q15 7 24 11Q33 7 42 10V40Q33 37 24 41Q15 37 6 40Z" fill="#f2e7cf" stroke="#9c7a4e"/><path d="M24 11V41" stroke="#9c7a4e"/><path d="M12 30C12 22 17 17 21 16C21 24 17 29 12 30Z" fill="#6fae45"/><path d="M28 30q4-8 9-12" stroke="#a3322a" stroke-width="2" fill="none"/>'; break;
      default: s += '<circle cx="24" cy="24" r="10" fill="#7fbf4a"/>';
    }
    return s + '</svg>';
  }

  // The Earth at two times of the year, tilted the same way: in December the
  // south leans toward the Sun (summer in Chile), in June the north does.
  function seasons(es) {
    var id = 'hs' + (++uid);
    var t = function(a, b) { return esc(es ? a : b); };
    var earth = function(cx, north) {
      // the axis leans 23.4° the same way at both ends of the orbit
      var g = '<g transform="translate(' + cx + ' 120) rotate(23.4)">' +
        '<circle r="38" fill="url(#' + id + 'e)"/>' +
        '<path d="M-38 0H38" stroke="rgba(255,255,255,.55)" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<path d="M0 -50V50" stroke="#334155" stroke-width="1.6"/>' +
        '</g>';
      // the lit half faces the Sun (in the middle)
      var lit = cx < 200 ? 'M' + cx + ' 82A38 38 0 0 1 ' + cx + ' 158Z' : 'M' + cx + ' 82A38 38 0 0 0 ' + cx + ' 158Z';
      g += '<path d="' + (cx < 200 ? 'M' + cx + ' 82A38 38 0 0 0 ' + cx + ' 158Z' : 'M' + cx + ' 82A38 38 0 0 1 ' + cx + ' 158Z') + '" fill="rgba(10,20,50,.38)"/>';
      void lit;
      // California (about 37° N) and central Chile (about 33° S) on the tilted
      // globe, on the side that faces the Sun
      var right = cx < 200, eq = right ? 23.4 : 203.4;
      var ca = pt(cx, 120, right ? eq - 37 : eq + 37, 31), cl = pt(cx, 120, right ? eq + 33 : eq - 33, 31);
      g += '<circle cx="' + n(ca[0]) + '" cy="' + n(ca[1]) + '" r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="1.4"/>';
      g += '<circle cx="' + n(cl[0]) + '" cy="' + n(cl[1]) + '" r="4.5" fill="#dc2626" stroke="#fff" stroke-width="1.4"/>';
      return g;
    };
    var s = '<svg class="hu-seasons" viewBox="0 0 400 250" role="img" aria-label="' + t('La Tierra gira alrededor del Sol con su eje inclinado', 'The Earth goes around the Sun with its axis tilted') + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<defs>' + rg(id + 's', 0.45, 0.45, 0.6, [[0, '#fff8c4'], [0.5, '#ffd23a'], [1, '#f59e0b']]) + rg(id + 'e', 0.4, 0.35, 0.75, [[0, '#7fd0ff'], [0.55, '#2f86d6'], [1, '#174e8f']]) + rg(id + 'g', 0.5, 0.5, 0.5, [[0, 'rgba(255,210,60,.55)'], [1, 'rgba(255,210,60,0)']]) + '</defs>';
    s += '<rect width="400" height="250" rx="18" fill="#0f1d3a"/>';
    for (var i = 0; i < 40; i++) { var r = rng(77 + i); s += '<circle cx="' + n(r() * 400) + '" cy="' + n(r() * 250) + '" r="' + n(0.4 + r()) + '" fill="rgba(255,255,255,' + n(0.3 + r() * 0.5) + ')"/>'; }
    s += '<ellipse cx="200" cy="120" rx="150" ry="34" fill="none" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 5"/>';
    s += '<circle cx="200" cy="120" r="56" fill="url(#' + id + 'g)"/><circle cx="200" cy="120" r="26" fill="url(#' + id + 's)"/>';
    s += earth(56, true) + earth(344, false);
    s += '<text x="56" y="190" text-anchor="middle" font-size="13" font-weight="800" fill="#fde68a">' + t('Junio', 'June') + '</text>';
    s += '<text x="344" y="190" text-anchor="middle" font-size="13" font-weight="800" fill="#fde68a">' + t('Diciembre', 'December') + '</text>';
    s += '<text x="56" y="206" text-anchor="middle" font-size="10.5" fill="#e2e8f0">' + t('verano en California', 'summer in California') + '</text>';
    s += '<text x="56" y="220" text-anchor="middle" font-size="10.5" fill="#e2e8f0">' + t('invierno en Chile', 'winter in Chile') + '</text>';
    s += '<text x="344" y="206" text-anchor="middle" font-size="10.5" fill="#e2e8f0">' + t('invierno en California', 'winter in California') + '</text>';
    s += '<text x="344" y="220" text-anchor="middle" font-size="10.5" fill="#e2e8f0">' + t('verano en Chile', 'summer in Chile') + '</text>';
    s += '<circle cx="128" cy="236" r="4" fill="#f59e0b"/><text x="136" y="240" font-size="10" fill="#e2e8f0">California</text><circle cx="222" cy="236" r="4" fill="#dc2626"/><text x="230" y="240" font-size="10" fill="#e2e8f0">Chile</text>';
    s += '<text x="200" y="30" text-anchor="middle" font-size="11" fill="#cbd5e1">' + t('El eje de la Tierra está inclinado 23,4°', 'The Earth\'s axis is tilted 23.4°') + '</text>';
    return s + '</svg>';
  }

  function has(id) { return !!PL[id]; }

  return { plant: plant, icon: icon, seasons: seasons, has: has, SCALE: SCALE };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HuertoArt;
