/* ================================================================
   QUEST ADVENTURE — quest-adventure-art.js
   Hand-built SVG art for the adventure map. Nothing is fetched:
   every coastline, tree, mountain and landmark is drawn here.

   buildBase()        the static painted world (rasterised once as an
                      <img>, so the browser never re-paints it)
   buildOverlay(st)   the living layer on top: trail, fog over locked
                      regions, smoke, glints, flags
   landmark(id)       one landmark on its own, for the region sheet
   trail()            sampled trail for the walking explorer token

   World units: 1000 × 1500, south (Base Camp) at the bottom, the
   Pacific to the west and a mountain range to the east.
   ================================================================ */

var QA_ART = (function() {
  'use strict';

  var W = 1000, H = 1500;
  var D = QA_DATA;

  // ── Small helpers ──────────────────────────────────────────────
  function rng(seed) {
    var a = seed >>> 0;
    return function() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }

  // Catmull-Rom through the points → cubic Bézier segments.
  function crSegs(pts, closed) {
    var segs = [], n = pts.length;
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      var p1 = pts[i];
      var p2 = pts[closed ? (i + 1) % n : i + 1];
      var p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      segs.push([p1,
        [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
        p2]);
    }
    return segs;
  }
  function segD(segs, closed) {
    if (!segs.length) return '';
    var d = 'M' + f(segs[0][0][0]) + ' ' + f(segs[0][0][1]);
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      d += 'C' + f(s[1][0]) + ' ' + f(s[1][1]) + ' ' + f(s[2][0]) + ' ' + f(s[2][1]) + ' ' + f(s[3][0]) + ' ' + f(s[3][1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function smooth(pts, closed) { return segD(crSegs(pts, closed), closed); }
  function bez(s, t) {
    var u = 1 - t;
    return [
      u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
      u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]
    ];
  }
  // Dense samples along segments; each sample remembers its segment.
  function sample(segs, steps) {
    var out = [];
    for (var i = 0; i < segs.length; i++) {
      for (var k = (i === 0 ? 0 : 1); k <= steps; k++) {
        var p = bez(segs[i], k / steps);
        out.push({ x: p[0], y: p[1], seg: i });
      }
    }
    return out;
  }
  // Jitter a polyline with small seeded wobble for a hand-drawn coast.
  function roughen(pts, amp, seed, every) {
    var r = rng(seed), out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      out.push(a);
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.max(1, Math.round(len / every));
      for (var j = 1; j < k; j++) {
        var t = j / k, o = (r() - 0.5) * 2 * amp;
        out.push([a[0] + dx * t - dy / len * o, a[1] + dy * t + dx / len * o]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function inPoly(x, y, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function distTo(x, y, samples) {
    var best = 1e9;
    for (var i = 0; i < samples.length; i += 2) {
      var dx = samples[i].x - x, dy = samples[i].y - y, d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  // ── Geography ──────────────────────────────────────────────────
  var COAST = [
    [300, 1520], [262, 1470], [215, 1440], [178, 1395], [150, 1340], [138, 1290], [150, 1235],
    [168, 1190], [158, 1150], [182, 1112], [222, 1072], [262, 1030], [292, 982], [318, 935],
    [336, 890], [354, 848], [374, 800], [400, 760], [420, 722], [430, 690], [420, 656],
    [402, 622], [390, 585], [398, 545], [420, 506], [430, 470], [420, 430], [404, 392],
    [404, 356], [440, 342], [474, 334], [450, 318], [404, 310], [364, 294], [342, 258],
    [352, 216], [372, 176], [398, 134], [420, 94], [440, 54], [456, 14], [462, -30]
  ];
  var ISLANDS = {
    volcano: { c: [150, 902], pts: [[150, 806], [196, 815], [236, 846], [250, 895], [236, 948], [196, 984], [146, 996], [98, 980], [64, 944], [56, 892], [74, 842], [108, 814]] },
    rapanui: { c: [140, 178], pts: [[84, 214], [96, 160], [130, 110], [162, 104], [190, 132], [214, 186], [204, 226], [150, 236], [108, 232]] },
    islet1:  { c: [62, 560], pts: [[40, 556], [52, 540], [76, 538], [90, 552], [82, 570], [56, 574]] },
    islet2:  { c: [318, 1062], pts: [[0, 0]] } // placeholder, unused
  };
  delete ISLANDS.islet2;

  var _geo = null;
  function geo() {
    if (_geo) return _geo;
    var coastPts = roughen(COAST, 7, 11, 22);
    var coastSegs = crSegs(coastPts, false);
    var coastS = sample(coastSegs, 6);
    var land = coastS.map(function(p) { return { x: p.x, y: p.y }; });
    land.push({ x: 1030, y: -30 }, { x: 1030, y: 1530 }, { x: 300, y: 1530 });
    var mainD = segD(coastSegs, false) + 'L1030 -30L1030 1530L300 1530Z';
    var isl = {};
    Object.keys(ISLANDS).forEach(function(k, i) {
      var pts = roughen(ISLANDS[k].pts.concat([ISLANDS[k].pts[0]]), 5, 40 + i, 18);
      pts.pop();
      var segs = crSegs(pts, true);
      isl[k] = { d: segD(segs, true), poly: sample(segs, 5) };
    });
    var landD = mainD + Object.keys(isl).map(function(k) { return isl[k].d; }).join('');
    function onLand(x, y) {
      if (inPoly(x, y, land)) return true;
      for (var k in isl) if (inPoly(x, y, isl[k].poly)) return true;
      return false;
    }

    // River: from Crystal Lake, under the bridge, south off the map.
    var riverPts = [[612, 1034], [580, 1070], [560, 1112], [572, 1160], [612, 1214], [648, 1272], [640, 1340], [664, 1410], [700, 1470], [724, 1530]];
    var riverSegs = crSegs(riverPts, false);
    var riverS = sample(riverSegs, 10);

    // Trail
    var tp = D.TRAIL.map(function(p) { return [p[0], p[1]]; });
    var trailSegs = crSegs(tp, false);
    var trailS = sample(trailSegs, 14);
    var len = 0;
    for (var i = 0; i < trailS.length; i++) {
      if (i) { var dx = trailS[i].x - trailS[i - 1].x, dy = trailS[i].y - trailS[i - 1].y; len += Math.sqrt(dx * dx + dy * dy); }
      trailS[i].len = len;
      trailS[i].sea = !onLand(trailS[i].x, trailS[i].y);
    }
    var anchors = {};
    D.TRAIL.forEach(function(p, idx) {
      if (!p[3]) return;
      // first sample of segment idx (or the very end)
      var at = null;
      for (var j = 0; j < trailS.length; j++) {
        if (trailS[j].seg === idx) { at = j; break; }
      }
      if (at === null) at = trailS.length - 1;
      anchors[p[3]] = { i: at, len: trailS[at].len };
    });

    _geo = { mainD: mainD, landD: landD, isl: isl, onLand: onLand, land: land,
      riverD: segD(riverSegs, false), riverS: riverS, trailS: trailS, anchors: anchors, total: len };
    return _geo;
  }

  // ── Shared paint (gradients, filters) ──────────────────────────
  function defs(base) {
    var g = '';
    g += '<linearGradient id="qaSea" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#1d5f87"/><stop offset="0.55" stop-color="#2a7fa8"/><stop offset="1" stop-color="#3a98ba"/></linearGradient>';
    g += '<linearGradient id="qaLand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8bd83"/><stop offset="0.35" stop-color="#a5c272"/><stop offset="1" stop-color="#9ccb68"/></linearGradient>';
    g += '<linearGradient id="qaTentA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7a35c"/><stop offset="1" stop-color="#d0581f"/></linearGradient>';
    g += '<linearGradient id="qaTentB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b4412a"/><stop offset="1" stop-color="#7d2716"/></linearGradient>';
    g += '<linearGradient id="qaTentG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fa66a"/><stop offset="1" stop-color="#2e6b3e"/></linearGradient>';
    g += '<linearGradient id="qaRockL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9bfb2"/><stop offset="1" stop-color="#8f8478"/></linearGradient>';
    g += '<linearGradient id="qaRockD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a6f65"/><stop offset="1" stop-color="#4c443d"/></linearGradient>';
    g += '<linearGradient id="qaSnow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe9f3"/></linearGradient>';
    g += '<linearGradient id="qaSnowD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d2deec"/><stop offset="1" stop-color="#aebfd3"/></linearGradient>';
    g += '<linearGradient id="qaWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c08a52"/><stop offset="1" stop-color="#7d5027"/></linearGradient>';
    g += '<linearGradient id="qaTrunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a65b38"/><stop offset="0.6" stop-color="#7b3f23"/><stop offset="1" stop-color="#4e2614"/></linearGradient>';
    g += '<linearGradient id="qaGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset="0.5" stop-color="#f2b631"/><stop offset="1" stop-color="#b9771b"/></linearGradient>';
    g += '<linearGradient id="qaStone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffdf6"/><stop offset="0.65" stop-color="#e9e0cd"/><stop offset="1" stop-color="#c3b597"/></linearGradient>';
    g += '<linearGradient id="qaIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6fdff"/><stop offset="0.5" stop-color="#c4e8f5"/><stop offset="1" stop-color="#7fbedc"/></linearGradient>';
    g += '<linearGradient id="qaLava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="0.45" stop-color="#ff8a2a"/><stop offset="1" stop-color="#c2311c"/></linearGradient>';
    g += '<linearGradient id="qaCone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f5a50"/><stop offset="0.5" stop-color="#4d3d37"/><stop offset="1" stop-color="#2f2522"/></linearGradient>';
    g += '<linearGradient id="qaDome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#e3e8ee"/><stop offset="1" stop-color="#a9b4c1"/></linearGradient>';
    g += '<linearGradient id="qaMoai" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a8f84"/><stop offset="0.55" stop-color="#776c62"/><stop offset="1" stop-color="#51483f"/></linearGradient>';
    g += '<linearGradient id="qaWhale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c6479"/><stop offset="1" stop-color="#22313f"/></linearGradient>';
    g += '<linearGradient id="qaPine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4f8f4a"/><stop offset="0.5" stop-color="#2f6b35"/><stop offset="1" stop-color="#1f4d27"/></linearGradient>';
    g += '<linearGradient id="qaWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0e2"/><stop offset="1" stop-color="#3b97bd"/></linearGradient>';
    g += '<radialGradient id="qaShadow"><stop offset="0" stop-color="#1b2a10" stop-opacity="0.38"/><stop offset="1" stop-color="#1b2a10" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaGlow"><stop offset="0" stop-color="#fff3b0" stop-opacity="0.95"/><stop offset="0.5" stop-color="#ffd25a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaCanopy" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#8cc05a"/><stop offset="0.6" stop-color="#4f8d3c"/><stop offset="1" stop-color="#2c5e2a"/></radialGradient>';
    g += '<radialGradient id="qaCanopyR" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#5f9a4a"/><stop offset="0.6" stop-color="#2f6a34"/><stop offset="1" stop-color="#1b4422"/></radialGradient>';
    g += '<radialGradient id="qaFog" cx="0.42" cy="0.38" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#eef2f8" stop-opacity="0.75"/><stop offset="1" stop-color="#dfe6ef" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaMist" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#eef2f7" stop-opacity="0.9"/><stop offset="0.6" stop-color="#e6ecf3" stop-opacity="0.8"/><stop offset="1" stop-color="#e6ecf3" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaSmoke"><stop offset="0" stop-color="#cfc8c2" stop-opacity="0.9"/><stop offset="0.6" stop-color="#bdb5ae" stop-opacity="0.5"/><stop offset="1" stop-color="#bdb5ae" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaMistBand"><stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="0.7" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaReef"><stop offset="0" stop-color="#9fe3e0" stop-opacity="0.95"/><stop offset="1" stop-color="#5fc0cf" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="qaHill" cx="0.4" cy="0.2" r="0.9"><stop offset="0" stop-color="#c5e08e"/><stop offset="1" stop-color="#7fae55"/></radialGradient>';
    if (base) {
      g += '<filter id="qaBlur20" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>';
      g += '<filter id="qaBlur8" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="8"/></filter>';
      g += '<filter id="qaBlur3"><feGaussianBlur stdDeviation="3"/></filter>';
      g += '<filter id="qaPaper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 -1.6 1.05"/></filter>';
      g += '<filter id="qaBrush" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="8" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.25  0 0 0 0 0.05  0 0 0 1.4 -0.55"/></filter>';
      g += '<pattern id="qaWaves" width="46" height="26" patternUnits="userSpaceOnUse"><path d="M3 18q5-6 10 0M26 7q5-6 10 0" fill="none" stroke="#e8f7ff" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/></pattern>';
      g += '<radialGradient id="qaVignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.62" stop-color="#6b4a1f" stop-opacity="0"/><stop offset="1" stop-color="#6b4a1f" stop-opacity="0.42"/></radialGradient>';
      g += '<clipPath id="qaLandClip"><path d="' + geo().landD + '"/></clipPath>';
    }
    return '<defs>' + g + '</defs>';
  }

  // ── Terrain pieces ─────────────────────────────────────────────
  function pine(x, y, s, r) {
    var h = 26 * s, w = 9 * s;
    var o = '<ellipse cx="' + f(x + 3 * s) + '" cy="' + f(y + 1) + '" rx="' + f(w * 0.9) + '" ry="' + f(2.6 * s) + '" fill="#1d3412" opacity="0.28"/>';
    o += '<rect x="' + f(x - 1.1 * s) + '" y="' + f(y - 4 * s) + '" width="' + f(2.2 * s) + '" height="' + f(4.5 * s) + '" fill="#5a3a20"/>';
    var tiers = 3;
    for (var t = 0; t < tiers; t++) {
      var ty = y - 3 * s - t * h * 0.27, tw = w * (1 - t * 0.22), th = h * 0.48;
      o += '<path d="M' + f(x - tw) + ' ' + f(ty) + 'L' + f(x) + ' ' + f(ty - th) + 'L' + f(x + tw) + ' ' + f(ty) + 'Z" fill="url(#qaPine)"/>';
      o += '<path d="M' + f(x - tw) + ' ' + f(ty) + 'L' + f(x) + ' ' + f(ty - th) + 'L' + f(x - tw * 0.15) + ' ' + f(ty) + 'Z" fill="#6aa85a" opacity="0.55"/>';
    }
    return o;
  }
  function roundTree(x, y, s, dark) {
    var r = 8.5 * s;
    var o = '<ellipse cx="' + f(x + 4 * s) + '" cy="' + f(y + 1) + '" rx="' + f(r * 1.05) + '" ry="' + f(r * 0.32) + '" fill="#1d3412" opacity="0.28"/>';
    o += '<rect x="' + f(x - 1.3 * s) + '" y="' + f(y - 7 * s) + '" width="' + f(2.6 * s) + '" height="' + f(7.2 * s) + '" fill="#6a4426"/>';
    o += '<circle cx="' + f(x) + '" cy="' + f(y - 7 * s - r * 0.7) + '" r="' + f(r) + '" fill="url(#' + (dark ? 'qaCanopyR' : 'qaCanopy') + ')"/>';
    o += '<circle cx="' + f(x - r * 0.45) + '" cy="' + f(y - 7 * s - r * 0.35) + '" r="' + f(r * 0.62) + '" fill="url(#' + (dark ? 'qaCanopyR' : 'qaCanopy') + ')"/>';
    o += '<circle cx="' + f(x + r * 0.5) + '" cy="' + f(y - 7 * s - r * 0.4) + '" r="' + f(r * 0.6) + '" fill="url(#' + (dark ? 'qaCanopyR' : 'qaCanopy') + ')"/>';
    o += '<circle cx="' + f(x - r * 0.3) + '" cy="' + f(y - 7 * s - r * 1.05) + '" r="' + f(r * 0.32) + '" fill="#b6dc7c" opacity="0.55"/>';
    return o;
  }
  function mountain(x, y, w, h, r, snow) {
    var px = x + (r() - 0.5) * w * 0.2, py = y - h;
    var lx = x - w / 2, rx = x + w / 2;
    var ridge = [];
    var o = '<ellipse cx="' + f(x + w * 0.12) + '" cy="' + f(y + 2) + '" rx="' + f(w * 0.55) + '" ry="' + f(h * 0.08 + 3) + '" fill="#2a2a12" opacity="0.18"/>';
    // silhouette with a few shoulders
    var lsh = [lx + (px - lx) * 0.45, y - h * (0.42 + r() * 0.12)];
    var rsh = [px + (rx - px) * 0.55, y - h * (0.38 + r() * 0.14)];
    var sil = 'M' + f(lx) + ' ' + f(y) + 'L' + f(lsh[0]) + ' ' + f(lsh[1]) + 'L' + f(px) + ' ' + f(py) + 'L' + f(rsh[0]) + ' ' + f(rsh[1]) + 'L' + f(rx) + ' ' + f(y) + 'Z';
    o += '<path d="' + sil + '" fill="url(#qaRockD)"/>';
    // lit west face
    var mid = [px + (r() - 0.3) * w * 0.12, y];
    o += '<path d="M' + f(lx) + ' ' + f(y) + 'L' + f(lsh[0]) + ' ' + f(lsh[1]) + 'L' + f(px) + ' ' + f(py) + 'L' + f(px + w * 0.04) + ' ' + f(py + h * 0.35) + 'L' + f(mid[0]) + ' ' + f(y) + 'Z" fill="url(#qaRockL)"/>';
    // gullies
    o += '<path d="M' + f(px - w * 0.02) + ' ' + f(py + h * 0.3) + 'L' + f(px - w * 0.12) + ' ' + f(y - h * 0.25) + 'M' + f(px + w * 0.12) + ' ' + f(py + h * 0.45) + 'L' + f(px + w * 0.2) + ' ' + f(y - h * 0.12) + '" stroke="#5a5048" stroke-width="1.2" fill="none" opacity="0.5"/>';
    if (snow) {
      var sh = h * (0.28 + r() * 0.12);
      var sl = px - (px - lsh[0]) * (sh / (py - lsh[1] === 0 ? 1 : (lsh[1] - py))) * 0.9;
      var sr = px + (rsh[0] - px) * (sh / (rsh[1] - py)) * 0.9;
      var sy = py + sh;
      var d = 'M' + f(px) + ' ' + f(py) + 'L' + f(sl) + ' ' + f(sy);
      var n = 5;
      for (var i = 1; i <= n; i++) {
        var tx = sl + (sr - sl) * i / n;
        d += 'L' + f(tx - (sr - sl) / n / 2) + ' ' + f(sy - sh * (0.18 + r() * 0.22)) + 'L' + f(tx) + ' ' + f(sy + (i < n ? sh * (r() * 0.18) : 0));
      }
      d += 'Z';
      o += '<path d="' + d + '" fill="url(#qaSnowD)"/>';
      o += '<path d="M' + f(px) + ' ' + f(py) + 'L' + f(sl) + ' ' + f(sy) + 'L' + f(sl + (sr - sl) * 0.22) + ' ' + f(sy - sh * 0.3) + 'L' + f(px + (sr - px) * 0.15) + ' ' + f(py + sh * 0.55) + 'Z" fill="url(#qaSnow)"/>';
    }
    return o;
  }
  function hill(x, y, w, h) {
    return '<path d="M' + f(x - w / 2) + ' ' + f(y) + 'Q' + f(x - w * 0.15) + ' ' + f(y - h * 1.3) + ' ' + f(x + w * 0.1) + ' ' + f(y - h * 0.9) + 'Q' + f(x + w * 0.4) + ' ' + f(y - h * 0.6) + ' ' + f(x + w / 2) + ' ' + f(y) + 'Z" fill="url(#qaHill)" opacity="0.85"/>' +
      '<path d="M' + f(x - w * 0.05) + ' ' + f(y - h * 0.95) + 'Q' + f(x + w * 0.3) + ' ' + f(y - h * 0.55) + ' ' + f(x + w * 0.45) + ' ' + f(y - h * 0.05) + '" stroke="#6d9a49" stroke-width="2" fill="none" opacity="0.45"/>';
  }
  function tuft(x, y) {
    return '<path d="M' + f(x - 3) + ' ' + f(y) + 'l1-5M' + f(x) + ' ' + f(y) + 'l0-7M' + f(x + 3) + ' ' + f(y) + 'l-1-5" stroke="#6e9c45" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>';
  }
  function palm(x, y, s, lean) {
    var tx = x + lean * s, ty = y - 26 * s;
    var o = '<path d="M' + f(x) + ' ' + f(y) + 'Q' + f(x + lean * s * 0.2) + ' ' + f(y - 14 * s) + ' ' + f(tx) + ' ' + f(ty) + '" stroke="#7a5532" stroke-width="' + f(2.6 * s) + '" fill="none" stroke-linecap="round"/>';
    var leaves = [[-14, 2], [-10, -6], [0, -9], [10, -6], [14, 3]];
    leaves.forEach(function(l) {
      o += '<path d="M' + f(tx) + ' ' + f(ty) + 'q' + f(l[0] * s * 0.5) + ' ' + f((l[1] - 6) * s * 0.5) + ' ' + f(l[0] * s) + ' ' + f(l[1] * s + 6 * s) + 'q' + f(-l[0] * s * 0.45) + ' ' + f(-6 * s) + ' ' + f(-l[0] * s) + ' ' + f(-l[1] * s - 6 * s) + 'Z" fill="#3f8a3c"/>';
    });
    return o;
  }

  // ── Landmarks (local coords: 0,0 is where the explorer stands) ──
  var LM = {};
  LM.basecamp = function() {
    var o = '<ellipse cx="10" cy="2" rx="104" ry="20" fill="#c9a56c" opacity="0.6"/>';
    o += '<ellipse cx="0" cy="6" rx="60" ry="13" fill="url(#qaShadow)"/>';
    // flagpole
    o += '<path d="M-70 4V-74" stroke="#5b3b1e" stroke-width="2.4"/><path d="M-69 -74l26 7-26 8z" fill="#e2552c"/><path d="M-69 -74l26 7-26 2z" fill="#f58a55"/>';
    // big tent
    o += '<path d="M-22 -60L20 -2L44 -10L4 -66Z" fill="url(#qaTentB)"/>';
    o += '<path d="M-64 0L-22 -60L20 0Z" fill="url(#qaTentA)"/>';
    o += '<path d="M-64 0L-22 -60L-40 0Z" fill="#fbb979" opacity="0.5"/>';
    o += '<path d="M-31 0L-22 -30L-13 0Z" fill="#4a210f"/><path d="M-22 -30L-13 0L-8 0L-19 -32Z" fill="#f08a4b"/>';
    o += '<path d="M-22 -60L4 -66" stroke="#6b3418" stroke-width="2"/>';
    o += '<path d="M-64 0l-10 6M20 0l8 7M44 -10l12 4" stroke="#8a6a44" stroke-width="1"/>';
    // small tent
    o += '<path d="M46 -38L68 -2L80 -8L58 -42Z" fill="#2c5d36"/>';
    o += '<path d="M24 0L46 -38L68 0Z" fill="url(#qaTentG)"/>';
    o += '<path d="M40 0L46 -16L52 0Z" fill="#173a20"/>';
    // log bench + crate
    o += '<rect x="76" y="-12" width="30" height="7" rx="3.5" fill="url(#qaWood)"/><circle cx="106" cy="-8.5" r="3.5" fill="#d9b27c" stroke="#7d5027"/>';
    o += '<rect x="-92" y="-12" width="16" height="13" fill="#b07a45" stroke="#6b4422"/><path d="M-92 -6h16M-84 -12v13" stroke="#6b4422"/>';
    // fire ring + logs (flame lives in the overlay)
    for (var i = 0; i < 9; i++) {
      var a = i / 9 * Math.PI * 2;
      o += '<ellipse cx="' + f(-30 + Math.cos(a) * 13 + 120) + '" cy="' + f(Math.sin(a) * 5.5) + '" rx="4" ry="3" fill="#9b958c" stroke="#6b665f" stroke-width="0.8"/>';
    }
    o += '<path d="M80 3L100 -3M80 -3L100 3" stroke="#5e3a1d" stroke-width="3.6" stroke-linecap="round"/>';
    o += '<ellipse cx="90" cy="-1" rx="7" ry="3" fill="#ffb347" opacity="0.9"/>';
    return o;
  };
  LM.forest = function() {
    var o = '<ellipse cx="0" cy="4" rx="70" ry="14" fill="url(#qaShadow)"/>';
    function redwood(x, h, w) {
      var s = '<path d="M' + (x - w / 2) + ' 2L' + (x - w * 0.28) + ' ' + (-h) + 'L' + (x + w * 0.28) + ' ' + (-h) + 'L' + (x + w / 2) + ' 2Z" fill="url(#qaTrunk)"/>';
      for (var k = 0; k < 6; k++) {
        var cy = -h * 0.42 - k * h * 0.11, cw = w * (3.4 - k * 0.42);
        s += '<path d="M' + f(x - cw) + ' ' + f(cy + 6) + 'Q' + f(x) + ' ' + f(cy - 26) + ' ' + f(x + cw) + ' ' + f(cy + 6) + 'Q' + f(x) + ' ' + f(cy - 4) + ' ' + f(x - cw) + ' ' + f(cy + 6) + 'Z" fill="url(#qaCanopyR)"/>';
        s += '<path d="M' + f(x - cw) + ' ' + f(cy + 6) + 'Q' + f(x - cw * 0.3) + ' ' + f(cy - 18) + ' ' + f(x) + ' ' + f(cy - 10) + 'Q' + f(x - cw * 0.4) + ' ' + f(cy - 2) + ' ' + f(x - cw) + ' ' + f(cy + 6) + 'Z" fill="#6fae58" opacity="0.6"/>';
      }
      return s;
    }
    o += redwood(-34, 112, 10) + redwood(30, 128, 12) + redwood(-2, 146, 13);
    o += roundTree(-60, 6, 1.4, true) + roundTree(62, 8, 1.3, false);
    // ferns
    [[-20, 6], [14, 8], [44, 4]].forEach(function(p) {
      o += '<path d="M' + p[0] + ' ' + p[1] + 'q-10-10-16-6M' + p[0] + ' ' + p[1] + 'q-2-14 4-16M' + p[0] + ' ' + p[1] + 'q10-8 16-4" stroke="#3e7f38" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    });
    // mushrooms
    [[-10, 12, 1], [-2, 14, 0.7], [24, 14, 0.85]].forEach(function(m) {
      var s = m[2];
      o += '<rect x="' + f(m[0] - 1.6 * s) + '" y="' + f(m[1] - 7 * s) + '" width="' + f(3.2 * s) + '" height="' + f(7 * s) + '" rx="1" fill="#f4ead6"/>';
      o += '<path d="M' + f(m[0] - 7 * s) + ' ' + f(m[1] - 6 * s) + 'Q' + f(m[0]) + ' ' + f(m[1] - 17 * s) + ' ' + f(m[0] + 7 * s) + ' ' + f(m[1] - 6 * s) + 'Z" fill="#d8342a"/>';
      o += '<circle cx="' + f(m[0] - 2.5 * s) + '" cy="' + f(m[1] - 9.5 * s) + '" r="' + f(1.3 * s) + '" fill="#fff"/><circle cx="' + f(m[0] + 2.6 * s) + '" cy="' + f(m[1] - 8 * s) + '" r="' + f(1 * s) + '" fill="#fff"/>';
    });
    return o;
  };
  LM.river = function() {
    // the river itself is in the terrain; this is the bridge across it
    var o = '<g transform="rotate(-18)">';
    o += '<ellipse cx="0" cy="10" rx="56" ry="8" fill="#14384d" opacity="0.25"/>';
    o += '<path d="M-58 6h16v-12h-16z" fill="#9c958a" stroke="#6b665f"/><path d="M42 6h16v-12H42z" fill="#9c958a" stroke="#6b665f"/>';
    o += '<path d="M-50 -2Q0 -30 50 -2L50 6Q0 -22 -50 6Z" fill="url(#qaWood)" stroke="#5e3a1d" stroke-width="1"/>';
    for (var i = -4; i <= 4; i++) {
      var x = i * 10.5, y = -2 - 24 * (1 - (x / 50) * (x / 50)) * 0.62;
      o += '<path d="M' + f(x) + ' ' + f(y - 1) + 'v' + f(9) + '" stroke="#5e3a1d" stroke-width="0.9" opacity="0.6"/>';
      o += '<path d="M' + f(x) + ' ' + f(y) + 'v-14" stroke="#6b4422" stroke-width="2.2" stroke-linecap="round"/>';
    }
    o += '<path d="M-50 -16Q0 -44 50 -16" stroke="#8a5a2e" stroke-width="3" fill="none" stroke-linecap="round"/>';
    o += '<path d="M-50 -9Q0 -37 50 -9" stroke="#8a5a2e" stroke-width="1.6" fill="none"/>';
    o += '</g>';
    // reeds and rocks on the banks
    [[-64, 4], [-58, 10], [66, 2], [72, -4]].forEach(function(p) {
      o += '<path d="M' + p[0] + ' ' + p[1] + 'q-2-12 1-20M' + (p[0] + 3) + ' ' + p[1] + 'q1-10 4-15M' + (p[0] - 3) + ' ' + p[1] + 'q-4-8-6-12" stroke="#4f7d33" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
      o += '<ellipse cx="' + (p[0]) + '" cy="' + (p[1] - 20) + '" rx="1.8" ry="4" fill="#7a4a22"/>';
    });
    o += '<ellipse cx="22" cy="30" rx="7" ry="4" fill="#8f8a80"/><ellipse cx="-26" cy="-30" rx="6" ry="3.5" fill="#8f8a80"/>';
    o += '<ellipse cx="-14" cy="34" rx="6" ry="2.4" fill="#5aa04e"/><ellipse cx="-6" cy="38" rx="4" ry="1.8" fill="#6db35d"/>';
    return o;
  };
  LM.mountain = function() {
    var o = '<ellipse cx="6" cy="2" rx="96" ry="14" fill="#2a2a12" opacity="0.2"/>';
    o += '<path d="M-92 0L-40 -78L-12 -96L8 -152L36 -104L62 -80L100 0Z" fill="url(#qaRockD)"/>';
    o += '<path d="M-92 0L-40 -78L-12 -96L8 -152L0 -94L-14 -40L-20 0Z" fill="url(#qaRockL)"/>';
    o += '<path d="M8 -152L-12 -96L-26 -88L-14 -100L-6 -104L2 -96L10 -108L18 -100L26 -112L36 -104Z" fill="url(#qaSnowD)"/>';
    o += '<path d="M8 -152L-12 -96L-26 -88L-14 -100L-6 -104L2 -96L4 -126Z" fill="url(#qaSnow)"/>';
    o += '<path d="M-2 -90L-24 -30M20 -86L40 -40M-48 -60L-62 -20" stroke="#4c443d" stroke-width="1.4" opacity="0.5" fill="none"/>';
    // storm cloud with a bolt
    o += '<g opacity="0.95"><ellipse cx="44" cy="-150" rx="34" ry="14" fill="#7d8796"/><ellipse cx="24" cy="-158" rx="20" ry="14" fill="#9aa4b2"/><ellipse cx="54" cy="-162" rx="22" ry="15" fill="#a9b2be"/><ellipse cx="70" cy="-150" rx="16" ry="11" fill="#8a94a2"/>';
    o += '<path d="M48 -140l-9 18h8l-6 16 16-22h-8l6-12z" fill="url(#qaGold)" stroke="#a86b12" stroke-width="0.8"/></g>';
    // climbers' hut
    o += '<path d="M-54 2v-18h26v18z" fill="url(#qaWood)" stroke="#5e3a1d"/><path d="M-58 -15l17-13 17 13z" fill="#b8402a" stroke="#7d2716"/><rect x="-46" y="-10" width="7" height="12" fill="#3a2414"/><rect x="-35" y="-12" width="5" height="5" fill="#ffd77a"/>';
    return o;
  };
  LM.volcano = function() {
    var o = '<ellipse cx="0" cy="4" rx="78" ry="12" fill="#2a1a10" opacity="0.25"/>';
    o += '<path d="M-78 2Q-50 -30 -22 -84L22 -84Q50 -30 80 2Z" fill="url(#qaCone)"/>';
    o += '<path d="M-78 2Q-50 -30 -22 -84L-8 -84Q-30 -40 -36 2Z" fill="#8a7264" opacity="0.6"/>';
    o += '<path d="M-60 -16Q-10 -26 62 -16M-44 -44Q0 -52 46 -44" stroke="#2a1f1b" stroke-width="1.2" fill="none" opacity="0.5"/>';
    o += '<ellipse cx="0" cy="-84" rx="22" ry="6" fill="#2a1a14"/><ellipse cx="0" cy="-84" rx="16" ry="3.6" fill="url(#qaLava)"/>';
    o += '<path d="M-6 -82Q-12 -60 -22 -44Q-26 -34 -24 -24" stroke="url(#qaLava)" stroke-width="4" fill="none" stroke-linecap="round"/>';
    o += '<path d="M8 -82Q14 -66 20 -58" stroke="url(#qaLava)" stroke-width="3" fill="none" stroke-linecap="round"/>';
    o += '<ellipse cx="0" cy="-90" rx="30" ry="14" fill="url(#qaGlow)" opacity="0.6"/>';
    o += palm(-66, 6, 1.1, -6) + palm(-50, 10, 0.9, 4) + palm(64, 8, 1.05, 7);
    return o;
  };
  LM.ocean = function() {
    var o = '<ellipse cx="0" cy="0" rx="86" ry="34" fill="url(#qaReef)"/>';
    // coral under the surface
    var corals = [[-40, 6, '#f08a7a'], [-18, 14, '#f6b25e'], [18, 10, '#e46aa0'], [44, 4, '#f39a6b'], [0, 20, '#ff9d7d']];
    corals.forEach(function(c) {
      o += '<path d="M' + c[0] + ' ' + c[1] + 'v-10m0 4l-6-6m6 2l6-7m-6 11l-9 1" stroke="' + c[2] + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.75"/>';
    });
    o += '<ellipse cx="0" cy="8" rx="80" ry="24" fill="#2a86b0" opacity="0.32"/>';
    // whale back + spout
    o += '<path d="M-58 -2Q-38 -28 -6 -18Q6 -14 12 -2Z" fill="url(#qaWhale)"/>';
    o += '<path d="M-48 -8Q-34 -22 -14 -16" stroke="#8aa3b8" stroke-width="1.5" fill="none" opacity="0.6"/>';
    o += '<path d="M-38 -24q-6-16-16-22M-38 -24q-1-18 2-28M-38 -24q8-14 18-18" stroke="#eaf8ff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.9"/>';
    // tail fluke
    o += '<path d="M40 -2Q42 -24 38 -40Q30 -48 16 -50Q30 -42 34 -36L38 -36Q44 -40 56 -52Q66 -50 72 -44Q56 -44 48 -36Q44 -22 48 -2Z" fill="url(#qaWhale)"/>';
    o += '<path d="M16 -50Q30 -42 34 -36Q28 -40 16 -50ZM72 -44Q56 -44 48 -36Q58 -38 72 -44Z" fill="#d8e3ec" opacity="0.7"/>';
    o += '<path d="M24 -2q20-8 40 0M-64 0q34-10 80 0" stroke="#fff" stroke-width="2.4" fill="none" opacity="0.85" stroke-linecap="round"/>';
    // small dive boat with the diver-down flag
    o += '<g transform="translate(-74 22)"><path d="M-16 0h32l-6 8h-20z" fill="#fff" stroke="#9aa6b2"/><path d="M-16 0h32" stroke="#c2352b" stroke-width="2"/><path d="M-2 0v-20" stroke="#5b3b1e" stroke-width="1.6"/><rect x="-1" y="-20" width="14" height="10" fill="#d62d20"/><path d="M-1 -20l14 10" stroke="#fff" stroke-width="2"/></g>';
    return o;
  };
  LM.sky_temple = function() {
    var o = '<ellipse cx="0" cy="4" rx="60" ry="12" fill="url(#qaShadow)"/>';
    // mesa
    o += '<path d="M-52 4L-44 -40L-50 -62L-36 -76L36 -76L50 -60L44 -36L54 4Z" fill="url(#qaRockD)"/>';
    o += '<path d="M-52 4L-44 -40L-50 -62L-36 -76L-6 -76L-16 -40L-10 4Z" fill="url(#qaRockL)"/>';
    o += '<path d="M-36 -76L36 -76L30 -70L-32 -70Z" fill="#7fb35a"/>';
    // temple
    o += '<path d="M-42 -76h84v-5h-84zM-38 -81h76v-4h-76z" fill="url(#qaStone)" stroke="#a79670" stroke-width="0.6"/>';
    for (var i = 0; i < 6; i++) {
      var x = -32 + i * 12.8;
      o += '<rect x="' + f(x - 3.2) + '" y="-118" width="6.4" height="33" fill="url(#qaStone)" stroke="#b5a582" stroke-width="0.5"/>';
      o += '<path d="M' + f(x - 1) + ' -117v31" stroke="#c9bc9c" stroke-width="0.8"/>';
    }
    o += '<rect x="-40" y="-125" width="80" height="7" fill="url(#qaStone)" stroke="#a79670" stroke-width="0.6"/>';
    o += '<path d="M-44 -125L0 -146L44 -125Z" fill="url(#qaStone)" stroke="#a79670" stroke-width="0.6"/>';
    o += '<path d="M-30 -128L0 -141L30 -128Z" fill="#e9dfc8"/>';
    o += '<circle cx="0" cy="-149" r="4" fill="url(#qaGold)"/><circle cx="-44" cy="-127" r="2.6" fill="url(#qaGold)"/><circle cx="44" cy="-127" r="2.6" fill="url(#qaGold)"/>';
    // clouds hugging the mesa
    o += '<g fill="#fff" opacity="0.92"><ellipse cx="-58" cy="-30" rx="26" ry="10"/><ellipse cx="-40" cy="-36" rx="16" ry="11"/><ellipse cx="56" cy="-22" rx="28" ry="10"/><ellipse cx="40" cy="-28" rx="15" ry="10"/></g>';
    o += '<g fill="#dfe8f2" opacity="0.9"><ellipse cx="-56" cy="-24" rx="24" ry="5"/><ellipse cx="56" cy="-16" rx="26" ry="5"/></g>';
    return o;
  };
  LM.legend_peak = function() {
    var o = '<ellipse cx="0" cy="2" rx="104" ry="15" fill="#2a2a12" opacity="0.2"/>';
    o += '<circle cx="0" cy="-168" r="46" fill="url(#qaGlow)"/>';
    o += '<path d="M-100 0L-56 -90L-30 -110L0 -168L30 -122L58 -96L104 0Z" fill="url(#qaRockD)"/>';
    o += '<path d="M-100 0L-56 -90L-30 -110L0 -168L-6 -120L-20 -50L-26 0Z" fill="url(#qaRockL)"/>';
    o += '<path d="M0 -168L-30 -110L-42 -100L-30 -104L-20 -94L-12 -108L-2 -96L8 -112L18 -98L28 -110L40 -100L30 -122Z" fill="url(#qaSnowD)"/>';
    o += '<path d="M0 -168L-30 -110L-42 -100L-30 -104L-20 -94L-12 -108L-4 -140Z" fill="url(#qaSnow)"/>';
    o += '<path d="M-56 -90L-70 -60L-58 -66L-50 -56L-44 -80Z" fill="url(#qaSnow)" opacity="0.9"/>';
    o += '<path d="M-8 -100L-34 -30M18 -94L44 -36" stroke="#4c443d" stroke-width="1.4" opacity="0.45"/>';
    // summit banner
    o += '<path d="M0 -168V-200" stroke="#5b3b1e" stroke-width="2.4"/>';
    o += '<path d="M1 -200h30l-7 9 7 9H1z" fill="url(#qaGold)" stroke="#a86b12" stroke-width="0.8"/>';
    o += '<path d="M12 -195l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="#fff"/>';
    // cairn
    o += '<ellipse cx="-6" cy="-168" rx="6" ry="2.6" fill="#8f8a80"/><ellipse cx="-6" cy="-171" rx="4" ry="2.2" fill="#a7a197"/>';
    return o;
  };
  LM.observatory = function() {
    var o = '<ellipse cx="0" cy="4" rx="84" ry="18" fill="#c99a52" opacity="0.55"/>';
    o += '<ellipse cx="0" cy="6" rx="70" ry="12" fill="url(#qaShadow)"/>';
    // big dome
    o += '<rect x="-44" y="-34" width="44" height="36" fill="url(#qaDome)" stroke="#8d99a7" stroke-width="0.8"/>';
    o += '<path d="M-48 -34a26 26 0 0 1 52 0z" fill="url(#qaDome)" stroke="#8d99a7" stroke-width="0.8"/>';
    o += '<path d="M-26 -60L-16 -60L-14 -34L-28 -34Z" fill="#243142"/>';
    o += '<path d="M-24 -54L-8 -76" stroke="#4b5a6c" stroke-width="5" stroke-linecap="round"/>';
    o += '<rect x="-30" y="-14" width="10" height="16" fill="#6f7d8d"/>';
    // small dome
    o += '<rect x="12" y="-18" width="26" height="20" fill="url(#qaDome)" stroke="#8d99a7" stroke-width="0.8"/>';
    o += '<path d="M10 -18a15 15 0 0 1 30 0z" fill="url(#qaDome)" stroke="#8d99a7" stroke-width="0.8"/>';
    o += '<path d="M23 -32L28 -32L28 -18L22 -18Z" fill="#243142"/>';
    // radio dish
    o += '<g transform="translate(62 0)"><path d="M-3 2l3-18 3 18z" fill="#a9b4c1"/><path d="M0 -16l-5-6" stroke="#8d99a7" stroke-width="2"/>';
    o += '<ellipse cx="-8" cy="-28" rx="17" ry="7" transform="rotate(-38 -8 -28)" fill="url(#qaDome)" stroke="#8d99a7"/>';
    o += '<path d="M-8 -28l-8-8" stroke="#6f7d8d" stroke-width="1.4"/></g>';
    // candelabra cactus
    o += '<path d="M-64 4v-24M-64 -10q-8 0-8-8v-6M-64 -14q7 0 7-7v-5" stroke="#5c8a4a" stroke-width="5" fill="none" stroke-linecap="round"/>';
    o += '<ellipse cx="44" cy="10" rx="6" ry="2.4" fill="#9a7442"/>';
    return o;
  };
  LM.glacier = function() {
    var o = '';
    // flanking ridges
    o += '<path d="M-60 -40L-20 -150L10 -96L-6 -30Z" fill="url(#qaRockD)"/><path d="M-60 -40L-20 -150L-24 -60Z" fill="url(#qaRockL)"/>';
    o += '<path d="M-20 -150L-34 -112L-26 -116L-20 -104L-12 -118L-2 -112Z" fill="url(#qaSnow)"/>';
    o += '<path d="M40 -40L80 -140L118 -40Z" fill="url(#qaRockD)"/><path d="M40 -40L80 -140L74 -50Z" fill="url(#qaRockL)"/>';
    o += '<path d="M80 -140L66 -104L76 -108L82 -98L92 -110L98 -104Z" fill="url(#qaSnow)"/>';
    // the ice tongue flowing down into the fjord
    o += '<path d="M-4 -120Q30 -124 62 -112Q58 -60 30 -20Q8 10 -30 28L-56 22Q-30 2 -18 -30Q-6 -70 -4 -120Z" fill="url(#qaIce)" stroke="#8cc7e3" stroke-width="1"/>';
    o += '<path d="M10 -100Q20 -70 14 -40M30 -96Q36 -60 22 -26M46 -90Q46 -60 34 -40M-2 -50q14 2 24-6M-14 -10q16 2 30-8M-34 14q14 0 24-8" stroke="#6aaed0" stroke-width="1.4" fill="none" opacity="0.8"/>';
    o += '<path d="M-56 22L-30 28L-30 34L-58 28Z" fill="#9fd6ec"/>';
    // icebergs
    [[-62, 40, 1], [-30, 48, 0.7], [-84, 26, 0.6]].forEach(function(b) {
      var s = b[2];
      o += '<g transform="translate(' + b[0] + ' ' + b[1] + ') scale(' + s + ')"><path d="M-16 0L-10 -14L-2 -20L8 -12L16 0Z" fill="url(#qaIce)" stroke="#8cc7e3"/><path d="M-16 0h32l-6 6h-20z" fill="#7fbedc" opacity="0.6"/></g>';
    });
    // penguins on a floe
    o += '<ellipse cx="28" cy="36" rx="24" ry="6" fill="#eef8fd" stroke="#a9d3e6"/>';
    [[18, 32], [28, 30], [38, 33]].forEach(function(p) {
      o += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><ellipse cx="0" cy="-6" rx="4" ry="7" fill="#1e2630"/><ellipse cx="0.8" cy="-5" rx="2.4" ry="5" fill="#fff"/><circle cx="0" cy="-13" r="3" fill="#1e2630"/><path d="M2 -13l3 1-3 1z" fill="#f2a33a"/></g>';
    });
    return o;
  };
  LM.rapanui = function() {
    var o = '<ellipse cx="0" cy="6" rx="70" ry="12" fill="url(#qaShadow)"/>';
    o += '<path d="M-66 8h132v-10h-132z" fill="#8e8579" stroke="#5e564c"/><path d="M-66 -2h132" stroke="#a69d90" stroke-width="2"/>';
    for (var k = -5; k <= 5; k++) o += '<path d="M' + (k * 12) + ' -2v10" stroke="#6e665b" stroke-width="0.8"/>';
    var xs = [-48, -24, 0, 24, 48];
    xs.forEach(function(x, i) {
      var s = i === 2 ? 1.12 : (i % 2 ? 1 : 0.94);
      o += '<g transform="translate(' + x + ' -2) scale(' + s + ')">';
      o += '<path d="M-9 0L-10 -20Q-12 -38 -8 -50L8 -50Q12 -38 10 -20L9 0Z" fill="url(#qaMoai)"/>';
      o += '<path d="M-8.5 -38h17v-4h-17z" fill="#4d443c" opacity="0.75"/>';
      o += '<path d="M1 -38L4 -26L-1 -25" fill="none" stroke="#3e362f" stroke-width="1.3"/>';
      o += '<path d="M-4 -20h8" stroke="#3e362f" stroke-width="1.4"/>';
      o += '<path d="M-10 -40q-3 4 -1 10M10 -40q3 4 1 10" stroke="#5e554b" stroke-width="1.6" fill="none"/>';
      o += '<path d="M-6 -12q6 3 12 0" stroke="#5e554b" stroke-width="1" fill="none"/>';
      if (i === 1 || i === 3) o += '<path d="M-7 -50h14v-6q-7-3-14 0z" fill="#a8432e"/>';
      o += '</g>';
    });
    o += palm(-74, 10, 1, -5) + palm(74, 8, 0.95, 6);
    return o;
  };

  // ── The static world ───────────────────────────────────────────
  var _base = {};
  function buildBase(walkedLen) {
    var key = Math.round(walkedLen || 0);
    if (_base[key]) return _base[key];
    var G = geo();
    var r = rng(2024);
    var o = [];
    o.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">');
    o.push(defs(true));
    // sea
    o.push('<rect width="' + W + '" height="' + H + '" fill="url(#qaSea)"/>');
    o.push('<rect width="' + W + '" height="' + H + '" fill="url(#qaWaves)"/>');
    // shallows and beach
    o.push('<path d="' + G.landD + '" fill="none" stroke="#7fcbd2" stroke-width="80" opacity="0.5" filter="url(#qaBlur20)"/>');
    o.push('<path d="' + G.landD + '" fill="none" stroke="#a8e0dc" stroke-width="30" opacity="0.65" filter="url(#qaBlur8)"/>');
    o.push('<path d="' + G.landD + '" fill="none" stroke="#e6f6f2" stroke-width="7" opacity="0.6"/>');
    o.push('<path d="' + G.landD + '" fill="#ecd8a2" stroke="#ecd8a2" stroke-width="12"/>');
    o.push('<path d="' + G.landD + '" fill="url(#qaLand)"/>');
    // biome washes
    o.push('<g clip-path="url(#qaLandClip)"><g filter="url(#qaBlur20)">');
    var washes = [
      [930, 750, 120, 820, '#a49d78', 0.85], [760, 205, 220, 120, '#e2bf7c', 0.95], [520, 170, 170, 110, '#e9eef2', 0.9],
      [900, 220, 160, 200, '#d8d2c4', 0.8], [262, 1262, 150, 92, '#5d9540', 0.85], [660, 790, 150, 90, '#5f9a44', 0.8],
      [480, 1400, 230, 110, '#b9d97f', 0.8], [480, 540, 110, 80, '#86b85a', 0.7], [150, 902, 80, 70, '#6f7c4a', 0.8],
      [140, 175, 60, 50, '#93bf6a', 0.9], [610, 420, 120, 60, '#6c9f48', 0.6], [830, 1290, 120, 140, '#6d9d48', 0.7],
      [600, 1010, 120, 70, '#9cc86a', 0.7]
    ];
    washes.forEach(function(w) {
      o.push('<ellipse cx="' + w[0] + '" cy="' + w[1] + '" rx="' + w[2] + '" ry="' + w[3] + '" fill="' + w[4] + '" opacity="' + w[5] + '"/>');
    });
    o.push('</g>');
    o.push('<rect width="' + W + '" height="' + H + '" filter="url(#qaBrush)" opacity="0.5"/>');
    o.push('</g>');

    // hills and grass
    for (var hI = 0; hI < 40; hI++) {
      var hx = 200 + r() * 700, hy = 380 + r() * 1100;
      if (!G.onLand(hx - 30, hy) || !G.onLand(hx + 30, hy)) continue;
      if (distTo(hx, hy, G.trailS) < 34 || distTo(hx, hy, G.riverS) < 30) continue;
      if (nearLandmark(hx, hy, 80)) continue;
      o.push(hill(hx, hy, 50 + r() * 40, 12 + r() * 10));
    }
    // desert dunes and rocks on the northern plateau
    var dr = rng(17);
    for (var dI = 0; dI < 26; dI++) {
      var dx = 470 + dr() * 420, dy = 40 + dr() * 230;
      if (!G.onLand(dx, dy) || distTo(dx, dy, G.trailS) < 22 || nearLandmark(dx, dy, 70)) continue;
      if (dx < 640 && dy > 120) continue; // the glacier side stays cold
      var dw = 26 + dr() * 34;
      o.push('<path d="M' + f(dx - dw) + ' ' + f(dy) + 'q' + f(dw * 0.6) + ' ' + f(-dw * 0.32) + ' ' + f(dw * 2) + ' 0" stroke="#b98c4c" stroke-width="2" fill="none" opacity="0.45"/>');
      if (dr() < 0.35) o.push('<path d="M' + f(dx) + ' ' + f(dy - 2) + 'l6-12h12l5 12z" fill="#b77d48" opacity="0.85"/><path d="M' + f(dx) + ' ' + f(dy - 2) + 'l6-12h4l-3 12z" fill="#d49a5e" opacity="0.85"/>');
    }
    for (var tI = 0; tI < 260; tI++) {
      var tx = 160 + r() * 800, ty = 340 + r() * 1150;
      if (G.onLand(tx, ty) && distTo(tx, ty, G.trailS) > 14 && distTo(tx, ty, G.riverS) > 14) o.push(tuft(tx, ty));
    }

    // lake + waterfall + river
    o.push('<ellipse cx="624" cy="1010" rx="64" ry="34" fill="#e6d9a8"/>');
    o.push('<ellipse cx="624" cy="1010" rx="58" ry="29" fill="url(#qaWater)" stroke="#2f7fa6" stroke-width="2"/>');
    o.push('<ellipse cx="610" cy="1002" rx="34" ry="9" fill="#d6f3fb" opacity="0.35"/>');
    o.push('<path d="M652 960l18 -6 14 8 4 16-10 10z" fill="url(#qaRockL)"/><path d="M664 962q-2 16 -6 30" stroke="#e8fbff" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="657" cy="994" rx="10" ry="3.4" fill="#fff" opacity="0.8"/>');
    o.push('<path d="' + G.riverD + '" fill="none" stroke="#e1cf98" stroke-width="22" stroke-linecap="round"/>');
    o.push('<path d="' + G.riverD + '" fill="none" stroke="#2f7fa6" stroke-width="15" stroke-linecap="round"/>');
    o.push('<path d="' + G.riverD + '" fill="none" stroke="#5db3d4" stroke-width="10" stroke-linecap="round"/>');
    o.push('<path d="' + G.riverD + '" fill="none" stroke="#c6ecf7" stroke-width="2.2" stroke-dasharray="14 22" opacity="0.7"/>');
    // fjord meltwater stream
    o.push('<path d="M520 230Q500 262 486 300" stroke="#5db3d4" stroke-width="5" fill="none" stroke-linecap="round"/>');

    o.push(trailSvg(G, key));

    // things that stand up, painted back to front
    var props = [];
    // mountain range along the east and the north
    var mr = rng(77);
    for (var my = 30; my < 1180; my += 34) {
      var count = my < 300 ? 3 : 2;
      for (var c = 0; c < count; c++) {
        var mx = (my < 300 ? 560 + mr() * 440 : 860 + mr() * 150) + (c * 30);
        var mw = 90 + mr() * 70, mh = 70 + mr() * 70 * (my < 700 ? 1.2 : 0.9);
        if (nearLandmark(mx, my, 95) || inPeakZone(mx, my, mw)) continue;
        if (distTo(mx, my - mh * 0.3, G.trailS) < 50) continue;
        if (!G.onLand(mx, my)) continue;
        if (my < 320 && mx < 700 && mx > 560 && my > 160) continue; // keep the glacier pass open
        props.push({ y: my, s: mountain(mx, my, mw, mh, mr, mh > 90 || my < 500) });
      }
    }
    // forests
    var tr = rng(91);
    var groves = [
      [262, 1262, 160, 90, 150, 'pine'], [800, 1300, 110, 90, 70, 'mix'], [380, 1060, 90, 40, 40, 'round'],
      [660, 790, 150, 80, 110, 'pine'], [480, 540, 90, 60, 45, 'round'], [610, 410, 100, 50, 45, 'pine'],
      [380, 1460, 90, 30, 30, 'round'], [700, 1190, 50, 40, 20, 'round'], [450, 760, 60, 60, 28, 'mix'],
      [900, 1430, 90, 60, 40, 'pine'], [320, 450, 60, 60, 24, 'pine']
    ];
    groves.forEach(function(gv) {
      for (var i = 0; i < gv[4]; i++) {
        var a = tr() * Math.PI * 2, d = Math.sqrt(tr());
        var x = gv[0] + Math.cos(a) * gv[2] * d, y = gv[1] + Math.sin(a) * gv[3] * d;
        if (!G.onLand(x, y) || !G.onLand(x, y + 8)) continue;
        if (distTo(x, y, G.trailS) < 16 || distTo(x, y, G.riverS) < 14) continue;
        if (nearLandmark(x, y, 62)) continue;
        if (Math.abs(x - 624) < 72 && Math.abs(y - 1010) < 42) continue;
        var s = 0.8 + tr() * 0.55;
        var kind = gv[5] === 'mix' ? (tr() < 0.5 ? 'pine' : 'round') : gv[5];
        props.push({ y: y, s: kind === 'pine' ? pine(x, y, s, tr) : roundTree(x, y, s, tr() < 0.4) });
      }
    });
    // landmarks
    D.REGION_ORDER.forEach(function(id) {
      var p = D.POS[id];
      props.push({ y: p.y + 2, s: '<g transform="translate(' + p.x + ' ' + p.y + ')">' + LM[id]() + '</g>' });
    });
    props.sort(function(a, b) { return a.y - b.y; });
    for (var pi = 0; pi < props.length; pi++) o.push(props[pi].s);

    // rocks in the surf
    var rr = rng(5);
    for (var k = 0; k < 26; k++) {
      var ci = Math.floor(rr() * G.land.length * 0.9);
      var cp = G.land[ci];
      if (!cp || cp.x > 900) continue;
      var rx2 = cp.x - 10 - rr() * 18, ry2 = cp.y + (rr() - 0.5) * 20;
      if (G.onLand(rx2, ry2)) continue;
      o.push('<ellipse cx="' + f(rx2) + '" cy="' + f(ry2) + '" rx="' + f(3 + rr() * 4) + '" ry="' + f(2 + rr() * 2) + '" fill="#8b857b" stroke="#e9f7f7" stroke-width="1"/>');
    }

    // compass rose
    o.push(compass(96, 1408, 52));
    // sea labels in an old-map hand
    o.push('<text x="182" y="430" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-style="italic" font-size="30" fill="#e6f4fb" opacity="0.6" letter-spacing="5">Pacific Ocean</text>');
    o.push('<path d="M70 446q112 14 224 0" stroke="#e6f4fb" stroke-width="1.2" fill="none" opacity="0.45"/>');

    // paper grain, vignette and frame
    o.push('<rect width="' + W + '" height="' + H + '" filter="url(#qaPaper)" opacity="0.22"/>');
    o.push('<rect width="' + W + '" height="' + H + '" fill="url(#qaVignette)"/>');
    o.push('<rect x="7" y="7" width="' + (W - 14) + '" height="' + (H - 14) + '" fill="none" stroke="#6b4a1f" stroke-width="5" opacity="0.6" rx="6"/>');
    o.push('<rect x="17" y="17" width="' + (W - 34) + '" height="' + (H - 34) + '" fill="none" stroke="#f3e6c6" stroke-width="2" opacity="0.7" rx="4"/>');
    o.push('</svg>');
    _base[key] = o.join('');
    return _base[key];
  }
  function nearLandmark(x, y, rad) {
    for (var id in D.POS) {
      var p = D.POS[id];
      var dx = x - p.x, dy = y - (p.y - 50);
      if (Math.abs(dx) < rad && dy > -rad - 40 && dy < rad * 0.7) return true;
    }
    return false;
  }
  // big landmark mountains keep the range from standing in front of them
  function inPeakZone(x, y, w) {
    var z = [[D.POS.legend_peak, 84, 130, 80], [D.POS.mountain, 80, 90, 70], [D.POS.observatory, 90, 110, 95]];
    for (var i = 0; i < z.length; i++) {
      var p = z[i][0];
      if (Math.abs(x - p.x) < z[i][1] + w * 0.4 && y > p.y - z[i][2] && y < p.y + z[i][3]) return true;
    }
    return false;
  }
  function compass(cx, cy, R) {
    var o = '<g transform="translate(' + cx + ' ' + cy + ')" opacity="0.9">';
    o += '<circle r="' + R + '" fill="#f3e6c6" opacity="0.25" stroke="#f3e6c6" stroke-width="1.5"/>';
    o += '<circle r="' + (R * 0.78) + '" fill="none" stroke="#f3e6c6" stroke-width="1" opacity="0.7"/>';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, l = i % 2 ? R * 0.55 : R * 0.95, w = i % 2 ? 6 : 9;
      var ex = Math.sin(a) * l, ey = -Math.cos(a) * l;
      var px = Math.cos(a) * w, py = Math.sin(a) * w;
      o += '<path d="M0 0L' + f(px) + ' ' + f(py) + 'L' + f(ex) + ' ' + f(ey) + 'Z" fill="' + (i % 2 ? '#e8d6a8' : '#fff7e0') + '"/>';
      o += '<path d="M0 0L' + f(-px) + ' ' + f(-py) + 'L' + f(ex) + ' ' + f(ey) + 'Z" fill="' + (i % 2 ? '#a88b55' : '#b5462c') + '"/>';
    }
    o += '<circle r="4" fill="#f3e6c6"/>';
    o += '<text y="' + (-R - 6) + '" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="18" fill="#fff7e0">N</text>';
    return o + '</g>';
  }

  // ── The living layer ───────────────────────────────────────────
  function runs(samples, upto) {
    // split the trail into land / sea polylines, up to a length
    var out = [], cur = null;
    for (var i = 0; i < samples.length; i++) {
      var s = samples[i];
      if (upto != null && s.len > upto) break;
      if (!cur || cur.sea !== s.sea) {
        if (cur) cur.d += 'L' + f(s.x) + ' ' + f(s.y);
        cur = { sea: s.sea, d: 'M' + f(s.x) + ' ' + f(s.y) };
        out.push(cur);
      } else cur.d += 'L' + f(s.x) + ' ' + f(s.y);
    }
    return out;
  }
  function trailSvg(G, walked) {
    var o = '';
    runs(G.trailS).forEach(function(rn) {
      if (rn.sea) o += '<path d="' + rn.d + '" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="0.1 11" stroke-linecap="round" opacity="0.5"/>';
      else {
        o += '<path d="' + rn.d + '" fill="none" stroke="#efe0b4" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>';
        o += '<path d="' + rn.d + '" fill="none" stroke="#8a6238" stroke-width="2.4" stroke-dasharray="7 8" stroke-linecap="round" opacity="0.4"/>';
      }
    });
    runs(G.trailS, walked).forEach(function(rn) {
      if (rn.sea) o += '<path d="' + rn.d + '" fill="none" stroke="#fff6d8" stroke-width="5" stroke-dasharray="0.1 11" stroke-linecap="round"/>';
      else {
        o += '<path d="' + rn.d + '" fill="none" stroke="#5e3a1d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.18"/>';
        o += '<path d="' + rn.d + '" fill="none" stroke="#fff1cc" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
        o += '<path d="' + rn.d + '" fill="none" stroke="#a0542a" stroke-width="3.6" stroke-dasharray="9 7" stroke-linecap="round"/>';
      }
    });
    return o;
  }
  var FOG_SY = { legend_peak: 1.36, mountain: 1.1, glacier: 1.05 };
  var FOG = [[-60, -110, 40], [-12, -138, 44], [40, -122, 42], [84, -86, 38], [-92, -70, 36], [-70, -18, 38], [74, -24, 40], [-28, 10, 34], [30, 8, 36], [0, -70, 48], [-40, -60, 40], [44, -60, 42], [100, -40, 26], [-104, -30, 26]];

  function buildOverlay(st) {
    var G = geo();
    var o = [];
    o.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" class="qa-live" aria-hidden="true" focusable="false">');
    o.push(defs(false));
    // water glints
    var gr = rng(33);
    for (var i = 0; i < 22; i++) {
      var x = 30 + gr() * 420, y = 40 + gr() * 1420;
      if (G.onLand(x, y) || G.onLand(x + 20, y)) continue;
      o.push('<path class="qa-glint" style="animation-delay:' + f(-gr() * 6) + 's" d="M' + f(x) + ' ' + f(y) + 'q6-5 12 0q6 5 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>');
    }
    // river flow
    o.push('<path class="qa-flow" d="' + G.riverD + '" fill="none" stroke="#e9fbff" stroke-width="2.4" stroke-dasharray="6 30" stroke-linecap="round"/>');
    // little life on the map
    var bc = D.POS.basecamp;
    o.push('<g transform="translate(' + (bc.x + 89) + ' ' + (bc.y - 1) + ')"><path class="qa-flame" d="M0 0q-9-6-4-16q2 6 5 4q-2-8 4-14q2 10 6 12q5 6-1 14z" fill="url(#qaLava)"/><path class="qa-flame qa-flame2" d="M1 0q-4-4-1-9q2 3 3 2q1-4 3-6q1 6 2 7q1 4-2 6z" fill="#fff3a0"/></g>');
    if (st.unlocked.volcano) {
      var vp = D.POS.volcano;
      for (var s = 0; s < 4; s++) o.push('<circle class="qa-smoke" style="animation-delay:' + (-s * 1.6) + 's" cx="' + vp.x + '" cy="' + (vp.y - 92) + '" r="12" fill="url(#qaSmoke)"/>');
    }
    if (st.unlocked.mountain) {
      var mp = D.POS.mountain;
      o.push('<ellipse class="qa-flash" cx="' + (mp.x + 46) + '" cy="' + (mp.y - 150) + '" rx="40" ry="20" fill="#fff6c4"/>');
    }
    if (st.unlocked.forest) {
      var fp = D.POS.forest;
      var fr = rng(4);
      for (var ff = 0; ff < 7; ff++) o.push('<circle class="qa-firefly" style="animation-delay:' + f(-fr() * 4) + 's" cx="' + f(fp.x - 60 + fr() * 120) + '" cy="' + f(fp.y - 10 - fr() * 70) + '" r="2" fill="#fff7a8"/>');
    }
    if (st.unlocked.observatory) {
      var op = D.POS.observatory, sr = rng(9);
      for (var so = 0; so < 6; so++) o.push('<path class="qa-twinkle" style="animation-delay:' + f(-sr() * 3) + 's" transform="translate(' + f(op.x - 70 + sr() * 140) + ' ' + f(op.y - 70 - sr() * 50) + ')" d="M0 -5L1.2 -1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2 -1.2Z" fill="#fff8d6"/>');
    }
    // a sailing ship off the coast
    o.push('<g transform="translate(80 1030)"><g class="qa-bob">' + ship() + '</g></g>');
    o.push('<g transform="translate(300 260)"><g class="qa-bob" style="animation-delay:-1.5s">' + ship(0.8) + '</g></g>');
    // flags on regions whose quests are all done
    (st.sealed || []).forEach(function(id) {
      var p = D.POS[id];
      o.push('<g transform="translate(' + (p.x + 44) + ' ' + (p.y + 2) + ')"><path d="M0 0V-34" stroke="#5b3b1e" stroke-width="2"/><path class="qa-pennant" d="M1 -34h20l-6 6 6 6H1z" fill="#C2410C" stroke="#7c2d12" stroke-width="0.6"/><path d="M8 -30l1.2 2.4 2.6.3-2 1.8.6 2.6-2.4-1.4-2.4 1.4.6-2.6-2-1.8 2.6-.3z" fill="#ffe08a"/></g>');
    });
    // mist over the regions still to be discovered
    D.REGION_ORDER.forEach(function(id) {
      if (st.unlocked[id] && !st.clearing[id]) return;
      var p = D.POS[id];
      var cls = 'qa-fog' + (st.clearing[id] ? ' qa-clearing' : '');
      var g = '<g class="' + cls + '" data-fog="' + id + '" transform="translate(' + p.x + ' ' + p.y + ')' + (FOG_SY[id] ? ' scale(1 ' + FOG_SY[id] + ')' : '') + '">';
      g += '<g class="qa-puffw" style="--dx:0px;--dy:-40px"><ellipse cx="0" cy="-62" rx="118" ry="96" fill="url(#qaMist)"/></g>';
      FOG.forEach(function(q, k) {
        g += '<g class="qa-puffw" style="--dx:' + (q[0] * 1.6) + 'px;--dy:' + (q[1] * 0.6 - 30) + 'px;animation-delay:' + (k * 0.05) + 's"><circle class="qa-puff" style="animation-delay:' + (-k * 0.7) + 's" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="url(#qaFog)"/></g>';
      });
      [[-20, -96, 96], [26, -46, 104], [-10, -2, 86]].forEach(function(b, k) {
        g += '<g class="qa-puffw" style="--dx:' + (k % 2 ? 140 : -140) + 'px;--dy:0px"><ellipse class="qa-band" style="animation-delay:' + (-k * 2.3) + 's" cx="' + b[0] + '" cy="' + b[1] + '" rx="' + b[2] + '" ry="16" fill="url(#qaMistBand)"/></g>';
      });
      g += '</g>';
      o.push(g);
    });
    o.push('</svg>');
    return o.join('');
  }
  function ship(s) {
    s = s || 1;
    return '<g transform="scale(' + s + ')"><path d="M-22 0h44l-8 10h-28z" fill="#7d5027" stroke="#4e2f14"/><path d="M-20 0h40" stroke="#c08a52" stroke-width="2"/>' +
      '<path d="M0 0V-38" stroke="#4e2f14" stroke-width="2"/><path d="M2 -36q14 12 0 30z" fill="#fbf4e2" stroke="#cdbf9c"/><path d="M-2 -32q-12 10 0 26z" fill="#f3e9d0" stroke="#cdbf9c"/>' +
      '<path d="M0 -38l10 3-10 3z" fill="#C2410C"/><path d="M-26 12q8-4 16 0t16 0 16 0" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.7"/></g>';
  }

  function cloud() {
    return '<svg viewBox="0 0 200 90" aria-hidden="true" focusable="false"><ellipse cx="100" cy="82" rx="78" ry="7" fill="#24405a" opacity="0.12"/>' +
      '<g fill="#fff"><ellipse cx="60" cy="56" rx="40" ry="22"/><ellipse cx="100" cy="42" rx="42" ry="30"/><ellipse cx="142" cy="54" rx="38" ry="22"/><ellipse cx="100" cy="62" rx="74" ry="16"/></g>' +
      '<g fill="#dfe9f3"><ellipse cx="100" cy="70" rx="70" ry="8"/></g><ellipse cx="88" cy="30" rx="20" ry="9" fill="#fff" opacity="0.9"/></svg>';
  }

  // A single landmark, framed on its own patch of ground, for the sheet.
  function landmark(id) {
    var bg = {
      ocean: '<ellipse cx="0" cy="4" rx="110" ry="46" fill="#3a98ba"/><ellipse cx="0" cy="4" rx="110" ry="46" fill="none" stroke="#a8e0dc" stroke-width="6" opacity="0.6"/>',
      volcano: '<ellipse cx="0" cy="8" rx="104" ry="30" fill="#3a98ba"/><ellipse cx="0" cy="2" rx="90" ry="22" fill="#ecd8a2"/><ellipse cx="0" cy="0" rx="82" ry="18" fill="#7f8a52"/>',
      rapanui: '<ellipse cx="0" cy="8" rx="104" ry="30" fill="#3a98ba"/><ellipse cx="0" cy="2" rx="92" ry="22" fill="#ecd8a2"/><ellipse cx="0" cy="0" rx="86" ry="18" fill="#93bf6a"/>',
      glacier: '<ellipse cx="0" cy="20" rx="110" ry="34" fill="#3a98ba"/><ellipse cx="20" cy="-30" rx="110" ry="40" fill="#d8d2c4"/>',
      observatory: '<ellipse cx="0" cy="2" rx="104" ry="26" fill="#e2bf7c"/>',
      river: '<ellipse cx="0" cy="0" rx="104" ry="34" fill="#9ccb68"/><path d="M14 -40Q-6 -10 2 6Q12 26 -4 44" stroke="#2f7fa6" stroke-width="18" fill="none"/><path d="M14 -40Q-6 -10 2 6Q12 26 -4 44" stroke="#5db3d4" stroke-width="12" fill="none"/>'
    }[id] || '<ellipse cx="0" cy="2" rx="104" ry="26" fill="#a5c272"/>';
    var top = { legend_peak: -240, mountain: -175, forest: -160, sky_temple: -165, glacier: -160 }[id] || -125;
    return '<svg viewBox="-120 ' + top + ' 240 ' + (-top + 60) + '" role="img" aria-hidden="true" focusable="false">' + defs(false) + bg + LM[id]() + '</svg>';
  }

  return {
    W: W, H: H,
    buildBase: buildBase,
    buildOverlay: buildOverlay,
    cloud: cloud,
    landmark: landmark,
    geo: geo
  };
})();
