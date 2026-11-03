/* ================================================================
   LITTLE ENGINEER — art (js/little-engineer-art.js)
   Everything drawn in code: sky with time-of-day light, soft clouds,
   layered Andes with haze and snow, rock cliffs with strata, grass,
   river water with ripples, concrete piers, bridge members, bolted
   joints, the four test vehicles, and the lesson diagrams (SVG).

   Camera: { s: px per metre, ox, oy } — screenX = ox + x*s,
   screenY = oy - y*s (world y points up). All drawing is in CSS px;
   the caller scales the context by devicePixelRatio.
   ================================================================ */

var LittleEngineerArt = (function() {
  'use strict';

  // ---- helpers -------------------------------------------------------
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
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function X(c, x) { return c.ox + x * c.s; }
  function Y(c, y) { return c.oy - y * c.s; }
  function hexRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function rgba(h, a) { var A = hexRgb(h); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // midpoint-displacement ridge, normalised 0..1
  function ridge(R, rough, n) {
    var N = n || 128, a = new Array(N + 1);
    a[0] = R(); a[N] = R();
    var step = N, amp = 1;
    while (step > 1) {
      var half = step / 2;
      for (var i = half; i < N; i += step) a[i] = (a[i - half] + a[i + half]) / 2 + (R() - 0.5) * amp;
      amp *= rough; step = half;
    }
    var mn = Infinity, mx = -Infinity;
    for (var j = 0; j <= N; j++) { mn = Math.min(mn, a[j]); mx = Math.max(mx, a[j]); }
    for (var k = 0; k <= N; k++) a[k] = (a[k] - mn) / (mx - mn || 1);
    return a;
  }

  // ---- palettes --------------------------------------------------------
  var TIMES = {
    morning: { top: '#4b86cf', mid: '#9ec5ea', bot: '#fde2c2', sunX: 0.16, sunY: 0.30, sun: '#fff1d6', glow: '255,226,180',
               far: '#a8b9d2', farSnow: '#f4f7fb', mid2: '#7f95b0', hill: '#5f7e64', haze: '#dfe6ee', tint: '#ffd9a8', tintA: 0.06, stars: 0 },
    noon:    { top: '#2c6fcb', mid: '#7db4ea', bot: '#d4ebfa', sunX: 0.74, sunY: 0.10, sun: '#ffffff', glow: '255,250,225',
               far: '#a4b8d3', farSnow: '#ffffff', mid2: '#7a93b2', hill: '#4f7656', haze: '#d6e7f5', tint: '#ffffff', tintA: 0.0, stars: 0 },
    golden:  { top: '#4f7cc4', mid: '#f0b884', bot: '#ffdca6', sunX: 0.84, sunY: 0.40, sun: '#fff0c8', glow: '255,196,120',
               far: '#b49aa6', farSnow: '#ffe6cf', mid2: '#8b7a8c', hill: '#5d6a48', haze: '#f2cfa6', tint: '#ff9d4d', tintA: 0.07, stars: 0 },
    dusk:    { top: '#1c2758', mid: '#7a4c86', bot: '#f08c60', sunX: 0.87, sunY: 0.56, sun: '#ffd2a4', glow: '255,150,100',
               far: '#6e5d86', farSnow: '#e9c7c9', mid2: '#4e486d', hill: '#363d45', haze: '#c88786', tint: '#7a4c9a', tintA: 0.16, stars: 1 }
  };
  var ROCKS = {
    andes:    { base: '#8b7666', bands: ['#9b8676', '#7f6b5d', '#a99583', '#735f52', '#94806f'], soil: '#5d4634', grass: '#6c8f3f', grass2: '#9bbb55', tree: 'araucaria' },
    south:    { base: '#6f6c66', bands: ['#7c7972', '#625f59', '#86827a', '#57544f', '#706d66'], soil: '#4a3a2c', grass: '#3f7f36', grass2: '#7fb350', tree: 'broadleaf' },
    volcanic: { base: '#55525a', bands: ['#5f5c64', '#48464d', '#69656c', '#3f3d44', '#58555c'], soil: '#3b3029', grass: '#4d7f35', grass2: '#86b34f', tree: 'broadleaf' },
    desert:   { base: '#bf8455', bands: ['#cc915e', '#b0744a', '#d8a272', '#a56a43', '#c58a5a'], soil: '#9a6a43', grass: '#a89458', grass2: '#cdb874', tree: 'cactus' }
  };

  // ---- clouds (pre-rendered sprites) -------------------------------------
  var _cloudSprites = null;
  function cloudSprites() {
    if (_cloudSprites) return _cloudSprites;
    _cloudSprites = [];
    if (typeof document === 'undefined') return _cloudSprites;
    for (var k = 0; k < 4; k++) {
      var R = rng(900 + k * 77);
      var w = 360, h = 150;
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var g = cv.getContext('2d');
      var puffs = [];
      var n = 9 + Math.floor(R() * 5);
      for (var i = 0; i < n; i++) {
        var u = i / (n - 1);
        var px = 50 + u * 260 + (R() - 0.5) * 30;
        var hump = Math.sin(u * Math.PI);
        var pr = 26 + hump * 34 + R() * 14;
        puffs.push([px, 112 - hump * 34 - R() * 12, pr]);
      }
      // shadowed underside
      puffs.forEach(function(p) {
        var gr = g.createRadialGradient(p[0], p[1] + p[2] * 0.25, p[2] * 0.1, p[0], p[1] + p[2] * 0.2, p[2]);
        gr.addColorStop(0, 'rgba(206,214,230,0.95)'); gr.addColorStop(0.7, 'rgba(196,205,224,0.6)'); gr.addColorStop(1, 'rgba(196,205,224,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1] + p[2] * 0.2, p[2], 0, Math.PI * 2); g.fill();
      });
      // lit tops
      puffs.forEach(function(p) {
        var gr = g.createRadialGradient(p[0] - p[2] * 0.2, p[1] - p[2] * 0.35, p[2] * 0.05, p[0], p[1], p[2] * 0.95);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(250,251,255,0.85)'); gr.addColorStop(1, 'rgba(240,244,252,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1] - p[2] * 0.1, p[2] * 0.95, 0, Math.PI * 2); g.fill();
      });
      _cloudSprites.push(cv);
    }
    return _cloudSprites;
  }

  // ---- scene build -----------------------------------------------------
  function buildScene(level) {
    var R = rng(hash(level.id + level.name));
    var sc = { level: level, T: TIMES[level.time] || TIMES.noon, K: ROCKS[level.rock] || ROCKS.andes };
    sc.far = ridge(R, 0.56);
    sc.mid = ridge(R, 0.5);
    sc.hill = ridge(R, 0.45);
    sc.snowN = ridge(R, 0.7);
    // cliff face profiles (indent into the rock, never sticking out)
    function face() {
      var arr = [], y;
      for (y = 0; y >= level.water - 6; y -= 0.3) {
        var v = Math.abs(Math.sin(y * 1.7 + R() * 0.4) * 0.18 + Math.sin(y * 0.63 + R() * 6) * 0.14) + R() * 0.05;
        if (y > -0.35) v = 0;
        arr.push([y, -v]);
      }
      return arr;
    }
    sc.faceL = face(); sc.faceR = face();
    sc.strata = [];
    var y0 = -0.55;
    while (y0 > level.water - 7) {
      sc.strata.push({ y: y0, ph: R() * 6, ph2: R() * 6, dip: (R() - 0.5) * 0.04 });
      y0 -= 0.55 + R() * 0.9;
    }
    sc.speckles = [];
    for (var i = 0; i < 520; i++) sc.speckles.push([R(), R(), R()]);
    sc.cracks = [];
    for (var c = 0; c < 70; c++) sc.cracks.push([R(), R(), R()]);
    sc.tufts = [];
    for (var t = 0; t < 70; t++) sc.tufts.push([R(), R(), R(), R()]);
    sc.boulders = [];
    for (var b = 0; b < 7; b++) sc.boulders.push([R(), R(), R()]);
    sc.trees = [];
    for (var tr = 0; tr < 6; tr++) sc.trees.push([R(), R(), R()]);
    sc.ripples = [];
    for (var rp = 0; rp < 46; rp++) sc.ripples.push([R(), R(), R(), R()]);
    sc.stars = [];
    for (var st = 0; st < 60; st++) sc.stars.push([R(), R() * 0.45, R()]);
    sc.clouds = [];
    for (var cl = 0; cl < 5; cl++) sc.clouds.push({ k: cl % 4, x: R(), y: 0.05 + R() * 0.22, sc: 0.45 + R() * 0.55, sp: 0.004 + R() * 0.006 });
    sc.condor = { ph: R() * 6.28, r: 0.1 + R() * 0.06, x: 0.3 + R() * 0.4, y: 0.18 + R() * 0.1 };
    return sc;
  }

  // ===================================================================
  //  BACK LAYER: sky, sun, mountains, hills  (cached by the caller)
  // ===================================================================
  function drawBack(g, sc, cam, W, H) {
    var T = sc.T, lv = sc.level;
    var horizon = Y(cam, lv.water + 0.6);
    // sky
    var sk = g.createLinearGradient(0, 0, 0, Math.max(horizon, H * 0.6));
    sk.addColorStop(0, T.top); sk.addColorStop(0.55, T.mid); sk.addColorStop(1, T.bot);
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    // stars at dusk
    if (T.stars) {
      sc.stars.forEach(function(s) {
        g.fillStyle = 'rgba(255,255,255,' + (0.25 + s[2] * 0.55) * (1 - s[1] * 1.6) + ')';
        g.beginPath(); g.arc(s[0] * W, s[1] * H, 0.6 + s[2] * 0.9, 0, 6.283); g.fill();
      });
    }
    // sun + glow
    var sx = T.sunX * W, sy = T.sunY * H;
    var gl = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.55);
    gl.addColorStop(0, 'rgba(' + T.glow + ',0.85)'); gl.addColorStop(0.12, 'rgba(' + T.glow + ',0.38)');
    gl.addColorStop(0.4, 'rgba(' + T.glow + ',0.12)'); gl.addColorStop(1, 'rgba(' + T.glow + ',0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    var sr = Math.max(10, Math.min(W, H) * 0.035);
    var sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.7, T.sun); sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, sr, 0, 6.283); g.fill();

    var shift = ((cam.ox + cam.s * lv.span / 2) - W / 2) * 0.06;
    // far Andes
    mountainLayer(g, sc.far, sc.snowN, W, H, horizon, H * 0.20, shift * 0.5, T.far, T.haze, T, true);
    // mid range
    mountainLayer(g, sc.mid, null, W, H, horizon + H * 0.02, H * 0.36, shift, T.mid2, T.haze, T, false);
    // near hills with forest texture
    hillLayer(g, sc, W, H, horizon + H * 0.03, shift * 1.6);
    // valley haze
    var hz = g.createLinearGradient(0, horizon - H * 0.25, 0, horizon + H * 0.08);
    hz.addColorStop(0, rgba(T.haze.length === 7 ? T.haze : '#dfe6ee', 0));
    hz.addColorStop(1, rgba(T.haze, 0.4));
    g.fillStyle = hz; g.fillRect(0, horizon - H * 0.25, W, H * 0.33 + H);
  }

  function mountainLayer(g, arr, snow, W, H, base, topY, shift, col, haze, T, snowy) {
    var n = arr.length - 1, span = W * 1.5, x0 = -W * 0.25 - shift;
    var hgt = Math.max(30, base - topY);
    function px(i) { return x0 + (i / n) * span; }
    function py(i) { return base - (0.18 + arr[i] * 0.82) * hgt; }
    function outline() {
      g.beginPath(); g.moveTo(px(0), base + 2);
      for (var i = 0; i <= n; i++) g.lineTo(px(i), py(i));
      g.lineTo(px(n), base + 2); g.closePath();
    }
    var gr = g.createLinearGradient(0, base - hgt, 0, base);
    gr.addColorStop(0, col); gr.addColorStop(1, mix(col, haze, 0.75));
    g.fillStyle = gr; outline(); g.fill();
    g.save(); outline(); g.clip();
    // major peaks: local maxima over a wide window
    var peaks = [], win = 7, i2, k;
    for (i2 = 2; i2 < n - 1; i2++) {
      var isMax = true;
      for (k = Math.max(0, i2 - win); k <= Math.min(n, i2 + win); k++) if (arr[k] > arr[i2]) { isMax = false; break; }
      if (isMax) peaks.push(i2);
    }
    var sunLeft = T.sunX < 0.5, dir = sunLeft ? 1 : -1;
    // snow first so the shade facets darken it too
    if (snowy && snow) {
      var sn = g.createLinearGradient(0, base - hgt, 0, base - hgt * 0.4);
      sn.addColorStop(0, T.farSnow); sn.addColorStop(1, mix(T.farSnow, col, 0.3));
      g.fillStyle = sn;
      g.beginPath(); g.moveTo(px(0), base - hgt * 1.3);
      for (var b2 = 0; b2 <= n; b2++) g.lineTo(px(b2), base - hgt * (0.7 + snow[b2] * 0.12) + Math.sin(b2 * 1.7) * hgt * 0.03 + Math.sin(b2 * 0.45) * hgt * 0.04);
      g.lineTo(px(n), base - hgt * 1.3); g.closePath(); g.fill();
    }
    peaks.forEach(function(p) {
      // walk down the shaded side to the valley
      var q = p;
      while (q + dir > 0 && q + dir < n && arr[q + dir] <= arr[q] + 0.01) q += dir;
      if (Math.abs(q - p) < 4) return;
      var dx = px(q) - px(p);
      var ph = base - py(p);
      var fg = g.createLinearGradient(0, py(p), 0, base);
      fg.addColorStop(0, 'rgba(28,36,70,0.30)'); fg.addColorStop(0.6, 'rgba(28,36,70,0.14)'); fg.addColorStop(1, 'rgba(28,36,70,0)');
      g.fillStyle = fg;
      g.beginPath(); g.moveTo(px(p), py(p));
      for (var j = p; j !== q + dir; j += dir) g.lineTo(px(j), py(j));
      // spur: from the valley down-slope to a foot, then a ridge-line back up to the peak
      g.lineTo(px(p) + dx * 0.75, py(q) + (base - py(q)) * 0.55);
      g.lineTo(px(p) + dx * 0.35, base);
      g.quadraticCurveTo(px(p) + dx * 0.08, py(p) + ph * 0.45, px(p), py(p));
      g.closePath(); g.fill();
      // sunlit rim on the bright side
      g.strokeStyle = 'rgba(255,250,235,0.35)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(px(p), py(p));
      for (var j2 = p; j2 !== p - dir * 6 && j2 > 0 && j2 < n; j2 -= dir) g.lineTo(px(j2), py(j2));
      g.stroke();
    });
    g.restore();
  }

  function hillLayer(g, sc, W, H, base, shift) {
    var arr = sc.hill, n = arr.length - 1, span = W * 1.6, x0 = -W * 0.3 - shift;
    var hgt = H * 0.16;
    var T = sc.T, K = sc.K;
    var col = sc.level.rock === 'desert' ? mix('#b98a62', T.haze, 0.35) : mix(T.hill, T.haze, 0.25);
    function px(i) { return x0 + (i / n) * span; }
    function py(i) { return base - (0.25 + arr[i] * 0.75) * hgt; }
    var gr = g.createLinearGradient(0, base - hgt, 0, base + H * 0.2);
    gr.addColorStop(0, col); gr.addColorStop(1, mix(col.charAt(0) === '#' ? col : T.hill, T.haze, 0.6));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(px(0), H);
    for (var i = 0; i <= n; i++) g.lineTo(px(i), py(i));
    g.lineTo(px(n), H); g.closePath(); g.fill();
    // forest texture along the ridge
    if (sc.level.rock !== 'desert') {
      var R = rng(hash(sc.level.id + 'trees'));
      g.fillStyle = mix(T.hill, '#13261a', 0.45);
      for (var t = 0; t < 220; t++) {
        var u = R(), idx = Math.floor(u * n), yy = py(idx) + R() * hgt * 0.55;
        var xx = px(0) + u * span, th = 4 + R() * 7;
        g.globalAlpha = 0.35 + R() * 0.35;
        g.beginPath(); g.moveTo(xx, yy - th); g.lineTo(xx + th * 0.38, yy); g.lineTo(xx - th * 0.38, yy); g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
    } else {
      g.strokeStyle = 'rgba(120,70,40,0.25)'; g.lineWidth = 1;
      for (var d = 0; d < 6; d++) {
        g.beginPath();
        for (var j = 0; j <= n; j += 2) { var yy2 = py(j) + 6 + d * 7; if (j === 0) g.moveTo(px(j), yy2); else g.lineTo(px(j), yy2); }
        g.stroke();
      }
    }
  }

  // ---- clouds + condors (animated, drawn each frame) ---------------------
  function drawSky(g, sc, cam, W, H, t) {
    var sp = cloudSprites();
    if (sp.length) {
      sc.clouds.forEach(function(c) {
        var cw = W * 0.34 * c.sc, ch = cw * (150 / 360);
        var x = ((c.x + t * c.sp) % 1.3) * (W + cw * 1.2) - cw;
        g.globalAlpha = sc.T.stars ? 0.55 : 0.9;
        g.drawImage(sp[c.k], x, c.y * H, cw, ch);
      });
      g.globalAlpha = 1;
    }
    // two condors soaring in wide circles
    var cd = sc.condor;
    for (var k = 0; k < 2; k++) {
      var a = t * 0.12 + cd.ph + k * 2.4;
      var bx = (cd.x + Math.cos(a) * cd.r + k * 0.12) * W, by = (cd.y + Math.sin(a) * cd.r * 0.35 + k * 0.03) * H;
      condor(g, bx, by, Math.max(9, W * 0.013) * (k ? 0.75 : 1), Math.sin(t * 1.3 + k) * 0.08, Math.cos(a) < 0);
    }
  }
  function condor(g, x, y, s, flap, flip) {
    g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
    g.fillStyle = 'rgba(28,26,34,0.82)';
    g.beginPath();
    g.moveTo(-0.15, 0);
    g.quadraticCurveTo(-0.9, -0.25 - flap, -1.9, -0.05 - flap);
    g.lineTo(-1.75, 0.04 - flap); g.lineTo(-1.82, 0.12 - flap); g.lineTo(-1.6, 0.1 - flap); g.lineTo(-1.62, 0.2 - flap);
    g.quadraticCurveTo(-0.8, 0.12, -0.2, 0.18);
    g.lineTo(0.2, 0.18);
    g.quadraticCurveTo(0.8, 0.12, 1.62, 0.2 - flap); g.lineTo(1.6, 0.1 - flap); g.lineTo(1.82, 0.12 - flap); g.lineTo(1.75, 0.04 - flap);
    g.lineTo(1.9, -0.05 - flap);
    g.quadraticCurveTo(0.9, -0.25 - flap, 0.15, 0);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(240,240,240,0.7)';
    g.beginPath(); g.ellipse(0, 0.02, 0.16, 0.07, 0, 0, 6.283); g.fill();
    g.restore();
  }

  // ===================================================================
  //  WATER (animated)
  // ===================================================================
  function drawWater(g, sc, cam, W, H, t) {
    var lv = sc.level, top = Y(cam, lv.water);
    if (top > H) return;
    var x0 = X(cam, -0.6), x1 = X(cam, lv.span + 0.6);
    var T = sc.T;
    var gr = g.createLinearGradient(0, top, 0, Math.max(top + 1, H));
    gr.addColorStop(0, mix(T.bot, '#4f9fb2', 0.55));
    gr.addColorStop(0.08, mix(T.mid, '#2f7f95', 0.65));
    gr.addColorStop(0.5, '#1d5c70');
    gr.addColorStop(1, '#0d3242');
    g.fillStyle = gr; g.fillRect(x0, top, x1 - x0, H - top + 2);
    // sheen of the sky near the surface
    var sh = g.createLinearGradient(0, top, 0, top + cam.s * 0.7);
    sh.addColorStop(0, 'rgba(255,255,255,0.35)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(x0, top, x1 - x0, cam.s * 0.7);
    // moving reflection streaks
    g.lineCap = 'round';
    sc.ripples.forEach(function(r, i) {
      var depth = r[1] * 1.6;
      var yy = top + (0.08 + depth) * cam.s;
      if (yy > H) return;
      var dir = (i % 2) ? 1 : -1;
      var len = (0.25 + r[2] * 1.1) * cam.s * (1 - depth * 0.35);
      var xx = x0 + ((r[0] + dir * t * (0.01 + r[3] * 0.02)) % 1 + 1) % 1 * (x1 - x0);
      var a = (0.38 - depth * 0.2) * (0.6 + 0.4 * Math.sin(t * 2 + i));
      g.strokeStyle = 'rgba(235,248,255,' + clamp(a, 0, 1) + ')';
      g.lineWidth = Math.max(1, cam.s * 0.045 * (1 - depth * 0.4));
      g.beginPath(); g.moveTo(xx - len / 2, yy); g.lineTo(xx + len / 2, yy); g.stroke();
    });
    // surface line
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(1, cam.s * 0.04);
    g.beginPath();
    for (var x = -0.6; x <= lv.span + 0.6; x += 0.25) {
      var yy2 = top + Math.sin(x * 2.1 + t * 2.2) * cam.s * 0.025 + Math.sin(x * 5.3 - t * 3.1) * cam.s * 0.012;
      if (x === -0.6) g.moveTo(X(cam, x), yy2); else g.lineTo(X(cam, x), yy2);
    }
    g.stroke();
    // foam at the cliffs and piers
    var foamAt = [0, lv.span];
    (lv.pillars || []).forEach(function(p) { foamAt.push(p.x - p.w / 2, p.x + p.w / 2); });
    if (lv.tower) foamAt.push(lv.tower.x - lv.tower.w / 2, lv.tower.x + lv.tower.w / 2);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    foamAt.forEach(function(fx, i) {
      for (var k = 0; k < 6; k++) {
        var ph = t * 1.6 + k * 1.1 + i;
        var ox = (Math.sin(ph) * 0.25 + (k - 2.5) * 0.12) * cam.s;
        var rr = Math.max(1.2, cam.s * (0.05 + 0.03 * Math.sin(ph * 1.7)));
        g.beginPath(); g.ellipse(X(cam, fx) + ox, top + cam.s * 0.02, rr * 1.8, rr * 0.7, 0, 0, 6.283); g.fill();
      }
    });
  }
  // Tint submerged parts drawn after the structure.
  function drawWaterVeil(g, sc, cam, W, H, t) {
    var lv = sc.level, top = Y(cam, lv.water) + cam.s * 0.03;
    if (top > H) return;
    var x0 = X(cam, 0), x1 = X(cam, lv.span);
    var gr = g.createLinearGradient(0, top, 0, H);
    gr.addColorStop(0, 'rgba(30,100,120,0.55)'); gr.addColorStop(1, 'rgba(10,40,55,0.8)');
    g.fillStyle = gr; g.fillRect(x0, top, x1 - x0, H - top);
  }

  // ===================================================================
  //  FRONT LAYER: cliffs, piers, tower, cliff roads (cached)
  // ===================================================================
  function cliffPath(g, sc, cam, side, H) {
    var lv = sc.level, prof = side === 'L' ? sc.faceL : sc.faceR;
    var ex = side === 'L' ? 0 : lv.span, sgn = side === 'L' ? 1 : -1;
    var far = side === 'L' ? -60 : lv.span + 60;
    var bottom = lv.water - 8;
    g.beginPath();
    g.moveTo(X(cam, far), Y(cam, 0));
    g.lineTo(X(cam, ex - sgn * 0.12), Y(cam, 0));
    g.quadraticCurveTo(X(cam, ex), Y(cam, 0), X(cam, ex), Y(cam, -0.12));
    prof.forEach(function(p) { g.lineTo(X(cam, ex + sgn * p[1]), Y(cam, p[0])); });
    g.lineTo(X(cam, ex), Y(cam, bottom));
    g.lineTo(X(cam, far), Y(cam, bottom));
    g.closePath();
  }

  function drawCliff(g, sc, cam, W, H, side) {
    var lv = sc.level, K = sc.K, T = sc.T;
    var ex = side === 'L' ? 0 : lv.span, sgn = side === 'L' ? 1 : -1;
    var inner = ex - sgn * 14;
    g.save();
    cliffPath(g, sc, cam, side, H);
    var base = g.createLinearGradient(0, Y(cam, 0), 0, Y(cam, lv.water - 1));
    base.addColorStop(0, mix(K.base, '#ffffff', 0.08)); base.addColorStop(1, mix(K.base, '#1b1a22', 0.45));
    g.fillStyle = base; g.fill();
    g.clip();
    // strata bands
    var xa = Math.min(ex, inner) - 2, xb = Math.max(ex, inner) + 2;
    function bandY(st, x) { return st.y + st.dip * x + Math.sin(x * 0.7 + st.ph) * 0.12 + Math.sin(x * 2.3 + st.ph2) * 0.05; }
    for (var i = 0; i < sc.strata.length - 1; i++) {
      var A = sc.strata[i], B = sc.strata[i + 1];
      g.beginPath();
      var x;
      for (x = xa; x <= xb; x += 0.4) { if (x === xa) g.moveTo(X(cam, x), Y(cam, bandY(A, x))); else g.lineTo(X(cam, x), Y(cam, bandY(A, x))); }
      for (x = xb; x >= xa; x -= 0.4) g.lineTo(X(cam, x), Y(cam, bandY(B, x)));
      g.closePath();
      var depthT = clamp(-A.y / (8 - lv.water * 0.2), 0, 1);
      g.fillStyle = rgba(K.bands[i % K.bands.length], 0.55 - depthT * 0.15);
      g.fill();
    }
    // band edges: dark seam with a light bevel under it
    for (var j = 0; j < sc.strata.length; j++) {
      var S = sc.strata[j];
      g.lineWidth = Math.max(1, cam.s * 0.05);
      g.strokeStyle = 'rgba(35,25,20,0.35)';
      g.beginPath();
      for (var xx = xa; xx <= xb; xx += 0.4) { if (xx === xa) g.moveTo(X(cam, xx), Y(cam, bandY(S, xx))); else g.lineTo(X(cam, xx), Y(cam, bandY(S, xx))); }
      g.stroke();
      g.lineWidth = Math.max(0.8, cam.s * 0.03);
      g.strokeStyle = 'rgba(255,240,220,0.14)';
      g.beginPath();
      for (var x2 = xa; x2 <= xb; x2 += 0.4) { var yy = Y(cam, bandY(S, x2)) + Math.max(1.5, cam.s * 0.06); if (x2 === xa) g.moveTo(X(cam, x2), yy); else g.lineTo(X(cam, x2), yy); }
      g.stroke();
    }
    // vertical joints (cracks) in the rock
    g.strokeStyle = 'rgba(30,22,18,0.3)'; g.lineWidth = Math.max(0.8, cam.s * 0.025);
    sc.cracks.forEach(function(c) {
      var cx = ex - sgn * (0.3 + c[0] * 12), si = Math.floor(c[1] * (sc.strata.length - 1));
      var S1 = sc.strata[si], S2 = sc.strata[si + 1];
      if (!S2) return;
      var ya = bandY(S1, cx), yb = bandY(S2, cx);
      g.beginPath(); g.moveTo(X(cam, cx), Y(cam, ya)); g.lineTo(X(cam, cx + (c[2] - 0.5) * 0.25), Y(cam, yb)); g.stroke();
    });
    // speckle texture (pebbles, pits)
    sc.speckles.forEach(function(p) {
      var px = ex - sgn * p[0] * 14, py = -0.5 - p[1] * (-(lv.water) + 6);
      var r = Math.max(0.6, cam.s * (0.02 + p[2] * 0.04));
      g.fillStyle = p[2] > 0.5 ? 'rgba(255,245,230,0.12)' : 'rgba(20,14,10,0.16)';
      g.beginPath(); g.arc(X(cam, px), Y(cam, py), r, 0, 6.283); g.fill();
    });
    // gorge ambient occlusion + rim light along the face
    var sunLeft = T.sunX < 0.5;
    var lit = (side === 'R') === sunLeft;
    var rim = g.createLinearGradient(X(cam, ex), 0, X(cam, ex - sgn * 1.4), 0);
    rim.addColorStop(0, lit ? 'rgba(255,236,200,0.28)' : 'rgba(10,8,20,0.35)');
    rim.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rim; g.fillRect(Math.min(X(cam, ex), X(cam, ex - sgn * 1.4)), 0, Math.abs(cam.s * 1.4), H);
    var ao = g.createLinearGradient(0, Y(cam, lv.water + 3), 0, Y(cam, lv.water - 1));
    ao.addColorStop(0, 'rgba(10,15,30,0)'); ao.addColorStop(1, 'rgba(10,15,30,0.4)');
    g.fillStyle = ao; g.fillRect(0, Y(cam, lv.water + 3), W, H);
    // top soil
    g.beginPath();
    g.moveTo(X(cam, ex - sgn * 60), Y(cam, 0));
    g.lineTo(X(cam, ex), Y(cam, 0));
    for (var sx = 0; sx <= 60; sx += 0.5) {
      var xs = ex - sgn * sx;
      g.lineTo(X(cam, xs), Y(cam, -0.42 - Math.sin(xs * 1.9) * 0.08 - Math.sin(xs * 4.1) * 0.04));
    }
    g.closePath();
    var sg = g.createLinearGradient(0, Y(cam, 0), 0, Y(cam, -0.55));
    sg.addColorStop(0, mix(K.soil, '#000000', 0.15)); sg.addColorStop(1, K.soil);
    g.fillStyle = sg; g.fill();
    g.restore();
  }

  function drawAbutments(g, sc, cam) {
    var lv = sc.level;
    lv.anchors.forEach(function(a) {
      var ax = a[0], ay = a[1];
      var onLeft = ax <= 0 && ay <= 0, onRight = ax >= lv.span && ay <= 0;
      if (!onLeft && !onRight) return;
      var sgn = onLeft ? 1 : -1;
      var w = ay === 0 ? 1.3 : 0.9, h = ay === 0 ? 1.5 : 1.0;
      var xA = ax - sgn * w, xB = ax + sgn * 0.12;
      var top = ay === 0 ? 0 : ay + h / 2, bot = ay === 0 ? -h : ay - h / 2;
      var x0 = X(cam, Math.min(xA, xB)), x1 = X(cam, Math.max(xA, xB));
      var gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, '#9c9c96'); gr.addColorStop(0.6, '#c9c8c1'); gr.addColorStop(1, '#a9a8a1');
      g.fillStyle = gr;
      roundRect(g, x0, Y(cam, top), x1 - x0, (top - bot) * cam.s, Math.max(1, cam.s * 0.08));
      g.fill();
      g.strokeStyle = 'rgba(60,60,60,0.45)'; g.lineWidth = 1; g.stroke();
      // formwork lines
      g.strokeStyle = 'rgba(80,80,80,0.18)';
      for (var k = 1; k < 3; k++) {
        var yy = Y(cam, top - (top - bot) * k / 3);
        g.beginPath(); g.moveTo(x0 + 2, yy); g.lineTo(x1 - 2, yy); g.stroke();
      }
      // shadow under block
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(x0, Y(cam, bot), x1 - x0, Math.max(1, cam.s * 0.08));
    });
  }

  function drawPier(g, sc, cam, p, tall) {
    var lv = sc.level, bot = lv.water - 6;
    var hw = p.w / 2, flare = tall ? 0.1 : 0.25;
    var xl = X(cam, p.x - hw), xr = X(cam, p.x + hw);
    var gr = g.createLinearGradient(xl, 0, xr, 0);
    gr.addColorStop(0, '#8d8b85'); gr.addColorStop(0.35, '#d5d3cb'); gr.addColorStop(0.65, '#bdbbb3'); gr.addColorStop(1, '#7a7872');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(xl, Y(cam, p.top));
    g.lineTo(xr, Y(cam, p.top));
    g.lineTo(X(cam, p.x + hw + flare), Y(cam, bot));
    g.lineTo(X(cam, p.x - hw - flare), Y(cam, bot));
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(50,50,50,0.35)'; g.lineWidth = 1; g.stroke();
    // formwork joints
    g.strokeStyle = 'rgba(60,60,60,0.16)';
    for (var y = p.top - 1; y > bot; y -= 1) {
      g.beginPath(); g.moveTo(xl, Y(cam, y)); g.lineTo(xr, Y(cam, y)); g.stroke();
    }
    // wet stain + algae near the waterline
    var wl = Y(cam, lv.water);
    var st = g.createLinearGradient(0, wl - cam.s * 0.8, 0, wl);
    st.addColorStop(0, 'rgba(60,70,50,0)'); st.addColorStop(1, 'rgba(50,70,40,0.45)');
    g.fillStyle = st; g.fillRect(xl - cam.s * flare, wl - cam.s * 0.8, xr - xl + cam.s * flare * 2, cam.s * 0.8);
    // cap
    var capH = tall ? 0.5 : 0.35, capW = tall ? 0.15 : 0.25;
    var cg = g.createLinearGradient(0, Y(cam, p.top + capH * 0.2), 0, Y(cam, p.top - capH));
    cg.addColorStop(0, '#e4e2da'); cg.addColorStop(1, '#9e9c95');
    g.fillStyle = cg;
    roundRect(g, X(cam, p.x - hw - capW), Y(cam, p.top), (p.w + capW * 2) * cam.s, capH * cam.s, Math.max(1, cam.s * 0.05));
    g.fill();
    g.strokeStyle = 'rgba(50,50,50,0.35)'; g.stroke();
    if (tall) {
      // saddle at the top of the tower
      g.fillStyle = '#5a6672';
      roundRect(g, X(cam, p.x - 0.35), Y(cam, p.top + 0.35), 0.7 * cam.s, 0.4 * cam.s, Math.max(1, cam.s * 0.08));
      g.fill();
    }
  }

  function drawCliffTop(g, sc, cam, W, H, side) {
    var lv = sc.level, K = sc.K;
    var ex = side === 'L' ? 0 : lv.span, sgn = side === 'L' ? 1 : -1;
    // trees behind the road
    sc.trees.forEach(function(tr, i) {
      if ((i % 2 === 0) !== (side === 'L')) return;
      var tx = ex - sgn * (3.5 + tr[0] * 9);
      tree(g, cam, tx, 0, 2.4 + tr[1] * 1.6, K.tree, tr[2]);
    });
    // grass tufts behind the road
    sc.tufts.forEach(function(tf, i) {
      if ((i % 2 === 0) !== (side === 'L')) return;
      var tx = ex - sgn * (0.2 + tf[0] * 14);
      tuft(g, cam, tx, 0.02, 0.18 + tf[1] * 0.32, K, tf[2], tf[3]);
    });
    // roadside posts (hitos) with red reflectors
    for (var d = 1.0; d < 16; d += 2.6) {
      var px = ex - sgn * d;
      var pw = Math.max(2, cam.s * 0.11), ph = 0.95 * cam.s;
      var x0 = X(cam, px) - pw / 2, y0 = Y(cam, 0) - ph;
      var pg = g.createLinearGradient(x0, 0, x0 + pw, 0);
      pg.addColorStop(0, '#f2f2ee'); pg.addColorStop(1, '#bdbdb7');
      g.fillStyle = pg; g.fillRect(x0, y0, pw, ph);
      g.fillStyle = '#222'; g.fillRect(x0, y0 + ph * 0.08, pw, ph * 0.16);
      g.fillStyle = '#e0362c'; g.fillRect(x0 + pw * 0.15, y0 + ph * 0.3, pw * 0.7, ph * 0.1);
    }
    // the road on the cliff top
    var rx0 = X(cam, ex - sgn * 60), rx1 = X(cam, ex);
    var xa = Math.min(rx0, rx1), xb = Math.max(rx0, rx1);
    var rg = g.createLinearGradient(0, Y(cam, 0), 0, Y(cam, -0.2));
    rg.addColorStop(0, '#6d7077'); rg.addColorStop(0.25, '#3d4046'); rg.addColorStop(1, '#2c2e33');
    g.fillStyle = rg; g.fillRect(xa, Y(cam, 0), xb - xa, Math.max(2, cam.s * 0.2));
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(xa, Y(cam, 0), xb - xa, Math.max(1, cam.s * 0.02));
    // grass in front at the edge of the road (lower)
    sc.tufts.forEach(function(tf, i) {
      if (i % 3 !== 0 || (i % 2 === 0) !== (side === 'L')) return;
      var tx = ex - sgn * (1.6 + tf[1] * 12);
      tuft(g, cam, tx, -0.2, 0.12 + tf[0] * 0.15, K, tf[3], tf[2]);
    });
  }

  function tuft(g, cam, x, y, h, K, r1, r2) {
    var n = 6 + Math.floor(r1 * 5), bx = X(cam, x), by = Y(cam, y), hh = h * cam.s;
    g.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1) - 0.5;
      var lean = (u * 1.4 + (r2 - 0.5) * 0.6) * hh;
      var hgt = hh * (0.6 + 0.4 * Math.cos(u * 2.4));
      g.strokeStyle = i % 2 ? K.grass : K.grass2;
      g.lineWidth = Math.max(1, cam.s * 0.035);
      g.beginPath(); g.moveTo(bx + u * hh * 0.5, by);
      g.quadraticCurveTo(bx + u * hh * 0.6 + lean * 0.3, by - hgt * 0.6, bx + u * hh * 0.4 + lean, by - hgt);
      g.stroke();
    }
  }

  function tree(g, cam, x, y, h, kind, r) {
    var bx = X(cam, x), by = Y(cam, y), s = cam.s;
    if (kind === 'cactus') {
      var cg = g.createLinearGradient(bx - s * 0.25, 0, bx + s * 0.25, 0);
      cg.addColorStop(0, '#3e6b3a'); cg.addColorStop(0.5, '#6f9b58'); cg.addColorStop(1, '#2f5530');
      g.strokeStyle = cg; g.lineCap = 'round';
      g.lineWidth = s * 0.42;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - h * 0.62 * s); g.stroke();
      g.lineWidth = s * 0.3;
      g.beginPath(); g.moveTo(bx, by - h * 0.25 * s); g.quadraticCurveTo(bx - s * 0.8, by - h * 0.25 * s, bx - s * 0.8, by - h * 0.48 * s); g.stroke();
      g.beginPath(); g.moveTo(bx, by - h * 0.33 * s); g.quadraticCurveTo(bx + s * 0.75, by - h * 0.33 * s, bx + s * 0.75, by - h * 0.55 * s); g.stroke();
      return;
    }
    // trunk
    var tw = s * (kind === 'araucaria' ? 0.22 : 0.26);
    var tg = g.createLinearGradient(bx - tw, 0, bx + tw, 0);
    tg.addColorStop(0, '#3d2a1d'); tg.addColorStop(0.5, '#6e4f37'); tg.addColorStop(1, '#2e1f15');
    g.fillStyle = tg;
    g.beginPath(); g.moveTo(bx - tw, by); g.lineTo(bx - tw * 0.55, by - h * s * 0.92); g.lineTo(bx + tw * 0.55, by - h * s * 0.92); g.lineTo(bx + tw, by); g.closePath(); g.fill();
    if (kind === 'araucaria') {
      // umbrella crown of up-curved branch clusters
      var top = by - h * s, cw = h * s * 0.55;
      for (var k = 0; k < 4; k++) {
        var ly = top + k * h * s * 0.09, lw = cw * (0.55 + k * 0.18);
        var gg = g.createLinearGradient(0, ly - s * 0.6, 0, ly + s * 0.5);
        gg.addColorStop(0, '#4f7a3a'); gg.addColorStop(1, '#1f3a22');
        g.fillStyle = gg;
        g.beginPath();
        g.moveTo(bx - lw, ly + s * 0.25);
        g.quadraticCurveTo(bx - lw * 0.6, ly - s * 0.45, bx, ly - s * 0.5);
        g.quadraticCurveTo(bx + lw * 0.6, ly - s * 0.45, bx + lw, ly + s * 0.25);
        g.quadraticCurveTo(bx, ly + s * 0.05, bx - lw, ly + s * 0.25);
        g.fill();
      }
      return;
    }
    // broadleaf crown (coigüe-like), clusters with lit tops
    var R = rng(Math.floor(r * 1e6));
    var cx = bx, cy = by - h * s * 0.78, cr = h * s * 0.33;
    for (var c = 0; c < 9; c++) {
      var a = R() * 6.283, d = R() * cr * 0.6;
      var px = cx + Math.cos(a) * d * 1.2, py = cy + Math.sin(a) * d * 0.8, pr = cr * (0.45 + R() * 0.3);
      var lg = g.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr);
      lg.addColorStop(0, '#7fae55'); lg.addColorStop(0.6, '#3f7134'); lg.addColorStop(1, '#244a24');
      g.fillStyle = lg; g.beginPath(); g.arc(px, py, pr, 0, 6.283); g.fill();
    }
  }

  function drawBoulders(g, sc, cam) {
    var lv = sc.level;
    sc.boulders.forEach(function(b, i) {
      var nearL = i % 2 === 0;
      var bx = nearL ? 0.15 + b[0] * 0.9 : lv.span - 0.15 - b[0] * 0.9;
      var r = 0.25 + b[1] * 0.4;
      var by = lv.water + r * 0.35 - b[2] * 0.2;
      var x = X(cam, bx), y = Y(cam, by), rr = r * cam.s;
      var gr = g.createRadialGradient(x - rr * 0.35, y - rr * 0.4, rr * 0.1, x, y, rr * 1.1);
      gr.addColorStop(0, mix(sc.K.base, '#ffffff', 0.4)); gr.addColorStop(0.55, mix(sc.K.base, '#ffffff', 0.08)); gr.addColorStop(1, mix(sc.K.base, '#000000', 0.35));
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x, y, rr * 1.25, rr * 0.85, (b[2] - 0.5) * 0.4, 0, 6.283); g.fill();
    });
  }

  function drawFront(g, sc, cam, W, H) {
    var lv = sc.level;
    if (lv.tower) drawPier(g, sc, cam, lv.tower, true);
    (lv.pillars || []).forEach(function(p) { drawPier(g, sc, cam, p, false); });
    drawBoulders(g, sc, cam);
    drawCliff(g, sc, cam, W, H, 'L');
    drawCliff(g, sc, cam, W, H, 'R');
    drawAbutments(g, sc, cam);
    drawCliffTop(g, sc, cam, W, H, 'L');
    drawCliffTop(g, sc, cam, W, H, 'R');
    // time-of-day colour grade over the foreground
    if (sc.T.tintA > 0) {
      g.save();
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = rgba(sc.T.tint, sc.T.tintA);
      g.fillRect(0, 0, W, H);
      g.restore();
    }
  }

  // ===================================================================
  //  BLUEPRINT OVERLAY (build mode)
  // ===================================================================
  function drawBlueprint(g, sc, cam, W, H, opts) {
    var lv = sc.level;
    g.fillStyle = 'rgba(14,52,112,0.24)';
    g.fillRect(0, 0, W, H);
    var xmin = Math.floor((0 - cam.ox) / cam.s) - 1, xmax = Math.ceil((W - cam.ox) / cam.s) + 1;
    var ymax = Math.ceil((cam.oy - 0) / cam.s) + 1, ymin = Math.floor((cam.oy - H) / cam.s) - 1;
    g.lineWidth = 1;
    for (var x = xmin; x <= xmax; x++) {
      g.strokeStyle = x % 5 === 0 ? 'rgba(190,225,255,0.34)' : 'rgba(190,225,255,0.14)';
      g.beginPath(); g.moveTo(Math.round(X(cam, x)) + 0.5, 0); g.lineTo(Math.round(X(cam, x)) + 0.5, H); g.stroke();
    }
    for (var y = ymin; y <= ymax; y++) {
      g.strokeStyle = y % 5 === 0 ? 'rgba(190,225,255,0.34)' : 'rgba(190,225,255,0.14)';
      g.beginPath(); g.moveTo(0, Math.round(Y(cam, y)) + 0.5); g.lineTo(W, Math.round(Y(cam, y)) + 0.5); g.stroke();
    }
    // span dimension line
    var dy = Math.min(H - 14, Y(cam, lv.water + 1.2));
    var xa = X(cam, 0), xb = X(cam, lv.span);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.fillStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(xa, dy); g.lineTo(xb, dy); g.stroke();
    [xa, xb].forEach(function(xx, i) {
      var d = i ? -1 : 1;
      g.beginPath(); g.moveTo(xx, dy); g.lineTo(xx + d * 8, dy - 4); g.lineTo(xx + d * 8, dy + 4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(xx, dy - 8); g.lineTo(xx, dy + 8); g.stroke();
    });
    var label = lv.span + ' m';
    g.font = '800 ' + Math.max(11, Math.min(15, cam.s * 0.5)) + 'px Nunito, system-ui, sans-serif';
    var tw = g.measureText(label).width + 12;
    g.fillStyle = 'rgba(14,52,112,0.85)';
    roundRect(g, (xa + xb) / 2 - tw / 2, dy - 10, tw, 20, 8); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, (xa + xb) / 2, dy + 1);
    // no-build box
    if (lv.clear) {
      var c = lv.clear;
      var bx0 = X(cam, c.x0), bx1 = X(cam, c.x1), by0 = Y(cam, c.y1), by1 = Y(cam, Math.max(c.y0, lv.water));
      g.fillStyle = 'rgba(255,90,90,0.13)';
      g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,150,150,0.9)'; g.lineWidth = 2;
      g.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
      g.setLineDash([]);
      g.fillStyle = 'rgba(255,220,220,0.95)';
      g.font = '800 ' + Math.max(11, Math.min(14, cam.s * 0.45)) + 'px Nunito, system-ui, sans-serif';
      g.fillText('Boat lane — keep clear', (bx0 + bx1) / 2, by0 + Math.max(14, cam.s * 0.6));
    }
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // ===================================================================
  //  MEMBERS + JOINTS
  // ===================================================================
  var MAT_LOOK = {
    wood:  { w: 0.24, min: 4.5, edge: '#4f3218', main: '#b07a43', hi: '#e0b27a', grain: 'rgba(110,66,30,0.55)' },
    steel: { w: 0.22, min: 4.5, edge: '#28313c', main: '#6f8194', hi: '#d3dde7', grain: null },
    cable: { w: 0.075, min: 2, edge: '#16191d', main: '#4a5159', hi: '#a6b0ba', grain: null },
    road:  { w: 0.34, min: 7, edge: '#2a2c30', main: '#3c3f45', hi: '#7b7f86', grain: null }
  };

  function stressColor(ratio) {
    // neutral → green → yellow → red
    var r = clamp(ratio, 0, 1.2);
    if (r < 0.5) return mix('#22c55e', '#facc15', r / 0.5);
    if (r < 1) return mix('#facc15', '#ef4444', (r - 0.5) / 0.5);
    return '#dc2626';
  }

  // opts: { tint:css|null, tintA, ghost, bad, sel, broken, pullPush }
  function drawMember(g, cam, ax, ay, bx, by, mat, opts) {
    opts = opts || {};
    var L = MAT_LOOK[mat] || MAT_LOOK.wood;
    var x1 = X(cam, ax), y1 = Y(cam, ay), x2 = X(cam, bx), y2 = Y(cam, by);
    var w = Math.max(L.min, L.w * cam.s);
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; }                // normal pointing up on screen
    g.lineCap = 'round';
    if (opts.ghost || opts.bad) {
      g.setLineDash([Math.max(4, w), Math.max(4, w * 0.8)]);
      g.lineWidth = Math.max(3, w * 0.7);
      g.strokeStyle = opts.bad ? 'rgba(255,80,80,0.9)' : 'rgba(255,255,255,0.55)';
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.setLineDash([]);
      if (!opts.bad && opts.ghostMat) {
        g.lineWidth = Math.max(1.5, w * 0.25);
        g.strokeStyle = { wood: 'rgba(240,180,110,0.8)', steel: 'rgba(180,210,240,0.85)', cable: 'rgba(30,40,50,0.6)', road: 'rgba(40,40,40,0.5)' }[mat];
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      }
      return;
    }
    if (mat === 'road') {
      var t = w;
      // slab: asphalt on top, concrete side, steel girder lip
      g.lineCap = 'butt';
      g.fillStyle = '#26282c';
      g.beginPath();
      g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x2 - nx * t, y2 - ny * t); g.lineTo(x1 - nx * t, y1 - ny * t); g.closePath();
      g.fill();
      var gx = (x1 + x2) / 2, gy = (y1 + y2) / 2;
      var rg = g.createLinearGradient(gx, gy, gx - nx * t, gy - ny * t);
      rg.addColorStop(0, '#5d6067'); rg.addColorStop(0.12, '#3b3e44'); rg.addColorStop(0.32, '#2f3136');
      rg.addColorStop(0.36, '#a7a59d'); rg.addColorStop(0.8, '#8a8880'); rg.addColorStop(1, '#5d5b55');
      g.fillStyle = rg;
      g.beginPath();
      g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x2 - nx * t * 0.94, y2 - ny * t * 0.94); g.lineTo(x1 - nx * t * 0.94, y1 - ny * t * 0.94); g.closePath();
      g.fill();
      if (opts.tint) {
        g.globalAlpha = opts.tintA == null ? 0.75 : opts.tintA;
        g.fillStyle = opts.tint;
        g.beginPath();
        g.moveTo(x1 - nx * t * 0.36, y1 - ny * t * 0.36); g.lineTo(x2 - nx * t * 0.36, y2 - ny * t * 0.36);
        g.lineTo(x2 - nx * t * 0.9, y2 - ny * t * 0.9); g.lineTo(x1 - nx * t * 0.9, y1 - ny * t * 0.9); g.closePath(); g.fill();
        g.globalAlpha = 1;
      }
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      // railing posts
      if (cam.s > 14) {
        g.strokeStyle = 'rgba(200,205,210,0.8)'; g.lineWidth = Math.max(1, cam.s * 0.04);
        var n = Math.max(1, Math.round(len / (cam.s * 1.0)));
        for (var i = 0; i <= n; i++) {
          var u = i / n, px = x1 + dx * u, py = y1 + dy * u;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + nx * cam.s * 0.55, py + ny * cam.s * 0.55); g.stroke();
        }
        g.beginPath(); g.moveTo(x1 + nx * cam.s * 0.55, y1 + ny * cam.s * 0.55); g.lineTo(x2 + nx * cam.s * 0.55, y2 + ny * cam.s * 0.55); g.stroke();
      }
      if (opts.sel) selGlow(g, x1, y1, x2, y2, w);
      return;
    }
    // beams + cable
    g.strokeStyle = L.edge; g.lineWidth = w + 2;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = opts.tint && opts.tintA >= 0.99 ? opts.tint : L.main; g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    if (opts.tint && opts.tintA < 0.99) {
      g.globalAlpha = opts.tintA; g.strokeStyle = opts.tint;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.globalAlpha = 1;
    }
    // highlight along the upper edge
    var ho = w * 0.22;
    g.strokeStyle = L.hi; g.lineWidth = Math.max(1, w * 0.22);
    g.globalAlpha = opts.tint ? 0.55 : 0.9;
    g.beginPath(); g.moveTo(x1 + nx * ho, y1 + ny * ho); g.lineTo(x2 + nx * ho, y2 + ny * ho); g.stroke();
    g.globalAlpha = 1;
    if (L.grain && w > 6) {
      g.strokeStyle = L.grain; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x1 - nx * w * 0.18, y1 - ny * w * 0.18); g.lineTo(x2 - nx * w * 0.18, y2 - ny * w * 0.18); g.stroke();
      g.beginPath(); g.moveTo(x1 + nx * w * 0.02 + dx * 0.15, y1 + ny * w * 0.02 + dy * 0.15); g.lineTo(x1 + nx * w * 0.02 + dx * 0.55, y1 + ny * w * 0.02 + dy * 0.55); g.stroke();
    }
    if (mat === 'steel' && cam.s > 18) {
      // rivets
      g.fillStyle = 'rgba(30,38,48,0.55)';
      var nr = Math.floor(len / (cam.s * 0.45));
      for (var k = 1; k < nr; k++) {
        var uu = k / nr;
        g.beginPath(); g.arc(x1 + dx * uu - nx * w * 0.12, y1 + dy * uu - ny * w * 0.12, Math.max(0.8, w * 0.09), 0, 6.283); g.fill();
      }
    }
    if (opts.sel) selGlow(g, x1, y1, x2, y2, w);
  }
  function selGlow(g, x1, y1, x2, y2, w) {
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2; g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.setLineDash([]);
  }

  function drawJoint(g, cam, x, y, kind, state) {
    var px = X(cam, x), py = Y(cam, y);
    var r = Math.max(kind === 'anchor' ? 6 : 4.5, cam.s * (kind === 'anchor' ? 0.26 : 0.17));
    if (state === 'hot' || state === 'sel') {
      g.fillStyle = state === 'sel' ? 'rgba(255,214,10,0.45)' : 'rgba(255,255,255,0.35)';
      g.beginPath(); g.arc(px, py, r * 2.1, 0, 6.283); g.fill();
    }
    var gr = g.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.1, px, py, r);
    if (kind === 'anchor') {
      gr.addColorStop(0, '#ffe08a'); gr.addColorStop(0.55, '#d79a1e'); gr.addColorStop(1, '#7a4f08');
    } else {
      gr.addColorStop(0, '#f4f7fa'); gr.addColorStop(0.6, '#9aa6b2'); gr.addColorStop(1, '#4a5561');
    }
    g.fillStyle = gr;
    g.beginPath(); g.arc(px, py, r, 0, 6.283); g.fill();
    g.strokeStyle = kind === 'anchor' ? '#5a3a06' : '#2d353e'; g.lineWidth = 1.2; g.stroke();
    // bolt
    g.fillStyle = kind === 'anchor' ? '#6b4507' : '#38424d';
    g.beginPath(); g.arc(px, py, r * 0.32, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.beginPath(); g.arc(px - r * 0.1, py - r * 0.12, r * 0.12, 0, 6.283); g.fill();
  }

  // ===================================================================
  //  VEHICLES — drawn in local metres, x forward, y up from the road.
  //  pose: { cx, cy, ang, g (local y of the road), wheels:[{x,y,rot}] }
  // ===================================================================
  function paint(g, y0, y1, base, light, dark) {
    var gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, dark); gr.addColorStop(0.45, base); gr.addColorStop(0.78, light); gr.addColorStop(0.86, mix(light, '#ffffff', 0.5)); gr.addColorStop(1, base);
    return gr;
  }
  function glass(g, x0, y0, x1, y1) {
    var gr = g.createLinearGradient(x0, y1, x1, y0);
    gr.addColorStop(0, '#1d2a38'); gr.addColorStop(0.45, '#3f5a73'); gr.addColorStop(0.55, '#9fc3dc'); gr.addColorStop(0.62, '#3f5a73'); gr.addColorStop(1, '#253547');
    return gr;
  }
  function poly(g, pts) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  }
  function wheel(g, x, y, r, rot, rimCol, dual) {
    var tg = g.createRadialGradient(x, y, r * 0.55, x, y, r);
    tg.addColorStop(0, '#2a2a2c'); tg.addColorStop(0.75, '#1a1a1b'); tg.addColorStop(0.93, '#333336'); tg.addColorStop(1, '#0d0d0e');
    g.fillStyle = tg; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    // tread
    g.strokeStyle = 'rgba(80,80,84,0.8)'; g.lineWidth = r * 0.05;
    for (var t = 0; t < 14; t++) {
      var a = rot + t * 6.283 / 14;
      g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86); g.lineTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98); g.stroke();
    }
    var rr = r * (dual ? 0.58 : 0.62);
    var rg = g.createRadialGradient(x + rr * 0.25, y + rr * 0.3, rr * 0.1, x, y, rr);
    rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.5, rimCol || '#c3cad2'); rg.addColorStop(1, '#5d656e');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, rr, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(40,44,50,0.7)'; g.lineWidth = r * 0.09;
    for (var s = 0; s < 5; s++) {
      var b = rot + s * 6.283 / 5;
      g.beginPath(); g.moveTo(x + Math.cos(b) * rr * 0.28, y + Math.sin(b) * rr * 0.28); g.lineTo(x + Math.cos(b) * rr * 0.92, y + Math.sin(b) * rr * 0.92); g.stroke();
    }
    g.fillStyle = '#3b4048'; g.beginPath(); g.arc(x, y, rr * 0.26, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x + rr * 0.06, y + rr * 0.08, rr * 0.09, 0, 6.283); g.fill();
  }
  function lamp(g, x, y, rx, ry, col, glow) {
    if (glow) {
      var gg = g.createRadialGradient(x, y, 0, x, y, rx * 5);
      gg.addColorStop(0, glow); gg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, rx * 5, 0, 6.283); g.fill();
    }
    g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.283); g.fill();
  }

  function drawCar(g, P) {
    var gy = P.g;  // local y of the road under the car
    function Pt(x, h) { return [x, gy + h]; }
    // body
    var body = [Pt(-2.0, 0.33), Pt(-2.06, 0.62), Pt(-1.98, 0.9), Pt(-1.55, 0.96), Pt(-0.98, 1.38), Pt(0.32, 1.42), Pt(1.0, 0.99), Pt(1.88, 0.84), Pt(2.06, 0.62), Pt(2.0, 0.33)];
    g.fillStyle = paint(g, gy + 0.3, gy + 1.42, '#1f6fd1', '#5aa2ff', '#0d3a78');
    g.beginPath(); g.moveTo(body[0][0], body[0][1]);
    for (var i = 1; i < body.length; i++) g.lineTo(body[i][0], body[i][1]);
    // wheel arches along the bottom (front → rear)
    var R = 0.43, wc = gy + 0.33;
    g.lineTo(1.25 + R, gy + 0.33); g.arc(1.25, wc, R, 0, Math.PI, false); g.lineTo(-1.25 + R, gy + 0.33);
    g.arc(-1.25, wc, R, 0, Math.PI, false); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(5,20,45,0.7)'; g.lineWidth = 0.03; g.stroke();
    // windows
    g.fillStyle = glass(g, -1, gy + 0.98, 1, gy + 1.36);
    poly(g, [Pt(-0.86, 1.0), Pt(-0.9, 1.04), Pt(-0.55, 1.32), Pt(-0.12, 1.33), Pt(-0.12, 1.0)]); g.fill();
    poly(g, [Pt(0.0, 1.0), Pt(0.0, 1.33), Pt(0.3, 1.33), Pt(0.85, 1.01)]); g.fill();
    // door lines, handles, sill
    g.strokeStyle = 'rgba(5,20,45,0.55)'; g.lineWidth = 0.025;
    g.beginPath(); g.moveTo(-0.06, gy + 1.0); g.lineTo(-0.1, gy + 0.36); g.moveTo(0.95, gy + 0.98); g.lineTo(0.92, gy + 0.4); g.moveTo(-0.95, gy + 1.0); g.lineTo(-0.98, gy + 0.42); g.stroke();
    g.fillStyle = '#c9d6e6'; g.fillRect(-0.55, gy + 0.85, 0.2, 0.04); g.fillRect(0.45, gy + 0.85, 0.2, 0.04);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(-1.8, gy + 0.88, 3.6, 0.025);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-1.6, gy + 0.33, 3.2, 0.07);
    // mirror
    g.fillStyle = '#0f3f82'; poly(g, [Pt(0.82, 1.0), Pt(0.98, 1.0), Pt(0.96, 1.1), Pt(0.82, 1.08)]); g.fill();
    // bumpers + lights
    g.fillStyle = '#2b2f36'; g.fillRect(1.92, gy + 0.34, 0.15, 0.22); g.fillRect(-2.07, gy + 0.34, 0.15, 0.22);
    lamp(g, 1.98, gy + 0.72, 0.07, 0.06, '#fff8dc', 'rgba(255,240,200,0.55)');
    lamp(g, -2.0, gy + 0.74, 0.05, 0.07, '#e3262c', 'rgba(255,60,60,0.35)');
  }

  function drawPickup(g, P) {
    var gy = P.g;
    function Pt(x, h) { return [x, gy + h]; }
    var R = 0.52, wc = gy + 0.4;
    g.fillStyle = paint(g, gy + 0.42, gy + 1.82, '#b3262e', '#ec5a5f', '#5c0d12');
    g.beginPath();
    var top = [Pt(-2.64, 0.46), Pt(-2.66, 1.08), Pt(-0.62, 1.08), Pt(-0.56, 1.76), Pt(0.62, 1.82), Pt(1.28, 1.18), Pt(2.5, 1.04), Pt(2.66, 0.84), Pt(2.62, 0.46)];
    g.moveTo(top[0][0], top[0][1]);
    for (var i = 1; i < top.length; i++) g.lineTo(top[i][0], top[i][1]);
    g.lineTo(1.6 + R, gy + 0.46); g.arc(1.6, wc, R, 0, Math.PI, false); g.lineTo(-1.6 + R, gy + 0.46);
    g.arc(-1.6, wc, R, 0, Math.PI, false); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,0,5,0.7)'; g.lineWidth = 0.03; g.stroke();
    // bed side + rail
    g.fillStyle = 'rgba(60,0,8,0.25)'; g.fillRect(-2.55, gy + 0.62, 1.86, 0.36);
    g.fillStyle = '#2b2f36'; g.fillRect(-2.68, gy + 1.06, 2.1, 0.06);
    // a spare tyre and a sack in the bed
    g.fillStyle = '#1b1b1d'; g.beginPath(); g.ellipse(-1.9, gy + 1.18, 0.32, 0.12, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#c9a66b'; g.beginPath(); g.ellipse(-1.1, gy + 1.2, 0.3, 0.16, 0, Math.PI, 0); g.fill();
    // windows
    g.fillStyle = glass(g, -0.5, gy + 1.15, 1.2, gy + 1.72);
    poly(g, [Pt(-0.46, 1.16), Pt(-0.43, 1.68), Pt(0.06, 1.7), Pt(0.06, 1.16)]); g.fill();
    poly(g, [Pt(0.16, 1.16), Pt(0.16, 1.71), Pt(0.58, 1.72), Pt(1.12, 1.17)]); g.fill();
    g.strokeStyle = 'rgba(40,0,5,0.55)'; g.lineWidth = 0.025;
    g.beginPath(); g.moveTo(0.11, gy + 1.16); g.lineTo(0.09, gy + 0.5); g.moveTo(1.2, gy + 1.14); g.lineTo(1.16, gy + 0.55); g.moveTo(-0.56, gy + 1.1); g.lineTo(-0.56, gy + 0.55); g.stroke();
    g.fillStyle = '#e8eef4'; g.fillRect(-0.32, gy + 1.0, 0.2, 0.04); g.fillRect(0.6, gy + 1.0, 0.2, 0.04);
    // black plastic flares + step
    g.fillStyle = '#25272b';
    g.fillRect(-0.9, gy + 0.44, 1.75, 0.08);
    // grille, bumpers, lights
    g.fillStyle = '#1e2126'; g.fillRect(2.52, gy + 0.62, 0.15, 0.32);
    g.fillStyle = '#9aa3ad'; g.fillRect(2.5, gy + 0.44, 0.2, 0.16); g.fillRect(-2.72, gy + 0.44, 0.18, 0.16);
    lamp(g, 2.6, gy + 0.96, 0.07, 0.06, '#fff8dc', 'rgba(255,240,200,0.55)');
    lamp(g, -2.64, gy + 0.9, 0.05, 0.1, '#e3262c', 'rgba(255,60,60,0.3)');
  }

  function drawBus(g, P) {
    var gy = P.g;
    function Pt(x, h) { return [x, gy + h]; }
    var R = 0.62, wc = gy + 0.5;
    var bodyG = g.createLinearGradient(0, gy + 0.45, 0, gy + 3.15);
    bodyG.addColorStop(0, '#c9c2a8'); bodyG.addColorStop(0.5, '#f4efdc'); bodyG.addColorStop(0.92, '#fffdf3'); bodyG.addColorStop(1, '#dcd6c2');
    g.fillStyle = bodyG;
    g.beginPath();
    var o = [Pt(-5.2, 0.5), Pt(-5.26, 2.95), Pt(-5.05, 3.14), Pt(4.6, 3.14), Pt(5.0, 2.95), Pt(5.24, 1.6), Pt(5.26, 0.5)];
    g.moveTo(o[0][0], o[0][1]);
    for (var i = 1; i < o.length; i++) g.lineTo(o[i][0], o[i][1]);
    g.lineTo(3.0 + R, gy + 0.5); g.arc(3.0, wc, R, 0, Math.PI, false); g.lineTo(-3.0 + R, gy + 0.5);
    g.arc(-3.0, wc, R, 0, Math.PI, false); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,55,40,0.6)'; g.lineWidth = 0.035; g.stroke();
    // livery stripes
    g.fillStyle = '#1f7a4d'; g.fillRect(-5.24, gy + 1.05, 10.45, 0.36);
    g.fillStyle = '#c62f2f'; g.fillRect(-5.24, gy + 1.46, 10.45, 0.08);
    g.fillStyle = '#1f7a4d'; g.fillRect(-5.2, gy + 2.82, 10.0, 0.12);
    // side windows
    for (var w = 0; w < 7; w++) {
      var wx = -4.75 + w * 1.18;
      g.fillStyle = glass(g, wx, gy + 1.7, wx + 1.0, gy + 2.68);
      roundRect(g, wx, gy + 1.7, 1.02, 0.98, 0.08); g.fill();
    }
    // door + windshield
    g.fillStyle = glass(g, 3.6, gy + 0.65, 4.4, gy + 2.7);
    roundRect(g, 3.62, gy + 0.62, 0.86, 2.08, 0.06); g.fill();
    g.strokeStyle = 'rgba(30,30,30,0.6)'; g.lineWidth = 0.03;
    g.beginPath(); g.moveTo(4.05, gy + 0.64); g.lineTo(4.05, gy + 2.68); g.stroke();
    g.fillStyle = glass(g, 4.6, gy + 1.6, 5.2, gy + 2.9);
    poly(g, [Pt(4.6, 1.65), Pt(4.62, 2.86), Pt(4.96, 2.86), Pt(5.18, 1.65)]); g.fill();
    // destination sign
    g.fillStyle = '#1b1d22'; g.fillRect(4.55, gy + 2.9, 0.46, 0.18);
    g.fillStyle = '#ffb21a'; g.fillRect(4.6, gy + 2.95, 0.36, 0.08);
    // mirror arm
    g.strokeStyle = '#222'; g.lineWidth = 0.05;
    g.beginPath(); g.moveTo(5.15, gy + 2.6); g.lineTo(5.45, gy + 2.7); g.lineTo(5.45, gy + 2.3); g.stroke();
    // skirt, bumper, lights
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-5.2, gy + 0.5, 10.4, 0.1);
    g.fillStyle = '#2b2f36'; g.fillRect(5.1, gy + 0.5, 0.2, 0.3); g.fillRect(-5.32, gy + 0.5, 0.18, 0.3);
    lamp(g, 5.2, gy + 0.98, 0.08, 0.08, '#fff8dc', 'rgba(255,240,200,0.55)');
    lamp(g, -5.24, gy + 1.0, 0.06, 0.12, '#e3262c', 'rgba(255,60,60,0.3)');
    // roof highlight
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(-5.0, gy + 3.08, 9.5, 0.04);
  }

  function drawTruck(g, P) {
    var gy = P.g;
    function Pt(x, h) { return [x, gy + h]; }
    // chassis rails + trailer bed
    g.fillStyle = '#23262b'; g.fillRect(-5.0, gy + 0.85, 9.0, 0.34);
    g.fillStyle = '#3a3f46'; g.fillRect(-5.05, gy + 1.15, 7.4, 0.16);
    // logs: three rows of long trunks with bark
    var R2 = rng(4242);
    for (var row = 0; row < 3; row++) {
      var n = 4 - row;
      for (var k = 0; k < n; k++) {
        var d = 0.46;
        var ly = gy + 1.31 + d / 2 + row * d * 0.86;
        var x0 = -5.1 + R2() * 0.2, x1 = 2.0 - R2() * 0.3;
        var off = (k - (n - 1) / 2) * 0.02;
        var bg = g.createLinearGradient(0, ly - d / 2, 0, ly + d / 2);
        var bark = ['#6b4a2e', '#7a5636', '#5d3f27'][(row + k) % 3];
        bg.addColorStop(0, mix(bark, '#ffffff', 0.25)); bg.addColorStop(0.45, bark); bg.addColorStop(1, mix(bark, '#000000', 0.45));
        g.fillStyle = bg;
        roundRect(g, x0, ly - d / 2 + off, x1 - x0, d * 0.95, d * 0.3); g.fill();
        g.strokeStyle = 'rgba(40,25,12,0.45)'; g.lineWidth = 0.02;
        for (var b = 0; b < 6; b++) {
          var bx = x0 + 0.4 + R2() * (x1 - x0 - 0.8);
          g.beginPath(); g.moveTo(bx, ly - d * 0.3); g.lineTo(bx + 0.5, ly - d * 0.25 + R2() * 0.1); g.stroke();
        }
        // cut end at the back with rings
        var eg = g.createRadialGradient(x0 + 0.05, ly, 0.02, x0 + 0.05, ly, d * 0.48);
        eg.addColorStop(0, '#f0d29c'); eg.addColorStop(0.7, '#d8ae6f'); eg.addColorStop(0.9, '#a77a45'); eg.addColorStop(1, '#5d3f27');
        g.fillStyle = eg; g.beginPath(); g.ellipse(x0 + 0.05, ly, d * 0.16, d * 0.46, 0, 0, 6.283); g.fill();
      }
    }
    // stakes
    g.fillStyle = '#2c3036';
    [-4.7, -2.4, -0.2, 1.9].forEach(function(sx) { g.fillRect(sx, gy + 1.15, 0.1, 1.75); });
    // binding straps
    g.strokeStyle = '#e2b007'; g.lineWidth = 0.05;
    [-3.6, -1.2].forEach(function(sx) { g.beginPath(); g.moveTo(sx, gy + 1.3); g.lineTo(sx + 0.1, gy + 2.92); g.stroke(); });
    // cab (conventional, long hood)
    g.fillStyle = paint(g, gy + 0.85, gy + 3.1, '#c0392b', '#f06a5a', '#5f130d');
    var cab = [Pt(2.3, 0.9), Pt(2.3, 3.0), Pt(2.45, 3.1), Pt(3.55, 3.1), Pt(3.8, 2.2), Pt(4.9, 2.06), Pt(5.0, 1.0), Pt(4.98, 0.9)];
    var R = 0.66, wc = gy + 0.52;
    g.beginPath(); g.moveTo(cab[0][0], cab[0][1]);
    for (var i = 1; i < cab.length; i++) g.lineTo(cab[i][0], cab[i][1]);
    g.lineTo(3.2 + R, gy + 0.9); g.arc(3.2, wc + 0.05, R, 0, Math.PI, false);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,5,0,0.7)'; g.lineWidth = 0.03; g.stroke();
    g.fillStyle = glass(g, 2.6, gy + 2.2, 3.7, gy + 3.0);
    poly(g, [Pt(2.55, 2.25), Pt(2.55, 2.95), Pt(3.45, 2.95), Pt(3.68, 2.25)]); g.fill();
    g.strokeStyle = 'rgba(40,5,0,0.5)'; g.lineWidth = 0.025;
    g.beginPath(); g.moveTo(2.45, gy + 2.15); g.lineTo(3.75, gy + 2.15); g.moveTo(3.75, gy + 2.15); g.lineTo(3.75, gy + 1.1); g.stroke();
    // grille + bumper + lights + exhaust stack + fuel tank
    g.fillStyle = '#bfc6ce'; g.fillRect(4.88, gy + 1.1, 0.14, 0.9);
    g.fillStyle = '#9aa3ad'; g.fillRect(4.8, gy + 0.78, 0.32, 0.22);
    lamp(g, 4.95, gy + 1.85, 0.06, 0.08, '#fff8dc', 'rgba(255,240,200,0.55)');
    var eg2 = g.createLinearGradient(2.12, 0, 2.28, 0);
    eg2.addColorStop(0, '#7c858f'); eg2.addColorStop(0.5, '#f2f5f8'); eg2.addColorStop(1, '#6b737c');
    g.fillStyle = eg2; g.fillRect(2.12, gy + 1.3, 0.14, 2.3);
    var ft = g.createLinearGradient(0, gy + 0.85, 0, gy + 1.25);
    ft.addColorStop(0, '#f2f5f8'); ft.addColorStop(1, '#6b737c');
    g.fillStyle = ft; roundRect(g, 1.0, gy + 0.85, 1.1, 0.38, 0.15); g.fill();
    g.fillStyle = '#e3262c'; g.fillRect(-5.12, gy + 0.92, 0.08, 0.18);
  }

  var VEH_DRAW = { car: drawCar, pickup: drawPickup, bus: drawBus, truck: drawTruck };
  var RIM = { car: '#c3cad2', pickup: '#b8bec6', bus: '#d5d8dc', truck: '#c9cfd6' };

  // pose from the sim: wheels in world, chassis points in world.
  function drawVehicle(gx, cam, type, pose) {
    var V = pose.V;
    gx.save();
    // soft shadow on the road under the vehicle
    var mx = (pose.wheels[0].x + pose.wheels[1].x) / 2, my = (pose.wheels[0].y + pose.wheels[1].y) / 2 - V.r;
    var sw = V.len * 0.55 * cam.s, shh = Math.max(2, 0.14 * cam.s);
    var sg = gx.createRadialGradient(X(cam, mx), Y(cam, my), 0, X(cam, mx), Y(cam, my), sw);
    sg.addColorStop(0, 'rgba(0,0,0,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    gx.fillStyle = sg;
    gx.beginPath(); gx.ellipse(X(cam, mx), Y(cam, my), sw, shh, -pose.ang, 0, 6.283); gx.fill();

    gx.translate(X(cam, pose.cx), Y(cam, pose.cy));
    gx.rotate(-pose.ang);
    gx.scale(cam.s, -cam.s);
    // the road is (rideH + r) below the chassis line
    var P = { g: -(V.rideH + V.r) };
    VEH_DRAW[type](gx, P);
    gx.restore();
    // wheels at their own (suspension) positions
    pose.wheels.forEach(function(w, i) {
      gx.save();
      gx.translate(X(cam, w.x), Y(cam, w.y));
      gx.scale(cam.s, -cam.s);
      wheel(gx, 0, 0, V.r, w.rot, RIM[type]);
      gx.restore();
    });
    // the log truck's extra rear axle (drawn only), carried by the body
    if (type === 'truck') {
      gx.save();
      gx.translate(X(cam, pose.cx), Y(cam, pose.cy));
      gx.rotate(-pose.ang);
      gx.scale(cam.s, -cam.s);
      wheel(gx, -1.95, -V.rideH, V.r, pose.wheels[0].rot, RIM[type]);
      gx.restore();
    }
  }

  // ---- static vehicle portrait (level cards, results) --------------------
  function vehicleThumb(cv, type, V) {
    var g = cv.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var W = cv.clientWidth || 120, H = cv.clientHeight || 60;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var s = Math.min(W / (V.len + 1), H / 3.8);
    var cam = { s: s, ox: W / 2, oy: H - 6 };
    drawVehicle(g, cam, type, { V: V, cx: 0, cy: V.r + V.rideH, ang: 0,
      wheels: [{ x: -V.wheelbase / 2, y: V.r, rot: 0.3 }, { x: V.wheelbase / 2, y: V.r, rot: 1.1 }] });
  }

  // ===================================================================
  //  SPLASH + SPARKS (drawn each frame by the game)
  // ===================================================================
  function drawDrops(g, cam, drops) {
    drops.forEach(function(d) {
      var a = clamp(d.life, 0, 1);
      if (d.kind === 'ring') {
        g.strokeStyle = 'rgba(255,255,255,' + 0.7 * a + ')'; g.lineWidth = Math.max(1, cam.s * 0.05);
        g.beginPath(); g.ellipse(X(cam, d.x), Y(cam, d.y), d.r * cam.s, d.r * cam.s * 0.18, 0, 0, 6.283); g.stroke();
      } else if (d.kind === 'chip') {
        g.fillStyle = d.col; g.globalAlpha = a;
        g.fillRect(X(cam, d.x) - 1.5, Y(cam, d.y) - 1.5, Math.max(2, cam.s * 0.1), Math.max(2, cam.s * 0.06));
        g.globalAlpha = 1;
      } else {
        g.fillStyle = 'rgba(235,248,255,' + 0.85 * a + ')';
        g.beginPath(); g.arc(X(cam, d.x), Y(cam, d.y), Math.max(1.2, d.r * cam.s), 0, 6.283); g.fill();
      }
    });
  }

  function drawBoat(g, cam, x, y, t) {
    var bob = Math.sin(t * 1.8) * 0.06, tilt = Math.sin(t * 1.3) * 0.04;
    g.save();
    g.translate(X(cam, x), Y(cam, y + bob));
    g.rotate(tilt);
    g.scale(cam.s, -cam.s);
    // hull
    var hg = g.createLinearGradient(0, -0.4, 0, 0.5);
    hg.addColorStop(0, '#0f3b66'); hg.addColorStop(0.6, '#1f64a8'); hg.addColorStop(1, '#f2f2ee');
    g.fillStyle = hg;
    g.beginPath(); g.moveTo(-2.1, 0.5); g.lineTo(2.3, 0.55); g.quadraticCurveTo(2.1, -0.1, 1.4, -0.35); g.lineTo(-1.8, -0.35); g.quadraticCurveTo(-2.1, 0, -2.1, 0.5); g.closePath(); g.fill();
    g.fillStyle = '#c62f2f'; g.fillRect(-2.05, 0.42, 4.3, 0.1);
    // cabin
    g.fillStyle = '#f4f1e6'; g.fillRect(-1.2, 0.52, 1.5, 0.8);
    g.fillStyle = glass(g, -1.1, 0.8, 0.2, 1.2); g.fillRect(-1.05, 0.85, 0.55, 0.32); g.fillRect(-0.35, 0.85, 0.55, 0.32);
    g.fillStyle = '#c62f2f'; g.fillRect(-1.3, 1.32, 1.7, 0.1);
    // mast with Chilean-flag pennant colours
    g.strokeStyle = '#444'; g.lineWidth = 0.05;
    g.beginPath(); g.moveTo(0.9, 0.5); g.lineTo(0.9, 2.0); g.stroke();
    g.fillStyle = '#d52b1e'; g.fillRect(0.92, 1.62, 0.5, 0.14);
    g.fillStyle = '#ffffff'; g.fillRect(0.92, 1.76, 0.5, 0.14);
    g.fillStyle = '#0039a6'; g.fillRect(0.92, 1.76, 0.16, 0.14);
    g.restore();
  }

  // ===================================================================
  //  UI ICONS + LESSON DIAGRAMS (SVG strings)
  // ===================================================================
  function materialIcon(id) {
    var s = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">';
    if (id === 'wood') {
      s += '<defs><linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7b77d"/><stop offset=".5" stop-color="#b07a43"/><stop offset="1" stop-color="#6e4520"/></linearGradient></defs>' +
        '<rect x="4" y="18" width="40" height="12" rx="3" fill="url(#mw)" stroke="#4f3218" stroke-width="1.5" transform="rotate(-20 24 24)"/>' +
        '<path d="M10 26 Q22 22 38 18" stroke="#7d4f25" stroke-width="1" fill="none" transform="rotate(-20 24 24)" opacity=".6"/>';
    } else if (id === 'steel') {
      s += '<defs><linearGradient id="ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eaf1"/><stop offset=".45" stop-color="#7b8da0"/><stop offset="1" stop-color="#3a4654"/></linearGradient></defs>' +
        '<g transform="rotate(-20 24 24)"><rect x="4" y="16" width="40" height="4" fill="url(#ms)" stroke="#28313c"/><rect x="4" y="28" width="40" height="4" fill="url(#ms)" stroke="#28313c"/>' +
        '<rect x="5" y="20" width="38" height="8" fill="#6f8194" stroke="#28313c"/><circle cx="12" cy="24" r="1.4" fill="#2b3440"/><circle cx="24" cy="24" r="1.4" fill="#2b3440"/><circle cx="36" cy="24" r="1.4" fill="#2b3440"/></g>';
    } else if (id === 'cable') {
      s += '<path d="M6 36 C14 8 34 8 42 36" stroke="#1d2126" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M6 36 C14 8 34 8 42 36" stroke="#8d98a3" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="3 2"/>' +
        '<circle cx="6" cy="36" r="3.5" fill="#d79a1e" stroke="#5a3a06"/><circle cx="42" cy="36" r="3.5" fill="#d79a1e" stroke="#5a3a06"/>';
    } else if (id === 'road') {
      s += '<defs><linearGradient id="mr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6067"/><stop offset=".3" stop-color="#2f3136"/><stop offset=".34" stop-color="#b3b1a9"/><stop offset="1" stop-color="#6d6b65"/></linearGradient></defs>' +
        '<rect x="3" y="18" width="42" height="13" rx="2" fill="url(#mr)" stroke="#2a2c30"/>' +
        '<path d="M7 15 V18 M17 15 V18 M27 15 V18 M37 15 V18 M5 15 H43" stroke="#aeb4ba" stroke-width="1.5"/>' +
        '<path d="M8 22 H16 M22 22 H30 M36 22 H42" stroke="#f5d142" stroke-width="1.2"/>';
    } else if (id === 'erase') {
      s += '<path d="M12 34 L28 12 L40 22 L26 40 H16 Z" fill="#f28b8b" stroke="#9b1c1c" stroke-width="2" stroke-linejoin="round"/><path d="M12 34 L22 40" stroke="#9b1c1c" stroke-width="2"/><path d="M8 42 H40" stroke="#9b1c1c" stroke-width="2" stroke-linecap="round"/>';
    }
    return s + '</svg>';
  }

  var SVG_DEFS = '<defs>' +
    '<linearGradient id="lsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0fb"/><stop offset="1" stop-color="#f3f8fd"/></linearGradient>' +
    '<linearGradient id="lsWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0b27a"/><stop offset="1" stop-color="#8a5a2e"/></linearGradient>' +
    '<linearGradient id="lsStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9cdb8"/><stop offset="1" stop-color="#9c8b72"/></linearGradient>' +
    '<linearGradient id="lsWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb0c4"/><stop offset="1" stop-color="#1d5c70"/></linearGradient>' +
    '<marker id="arB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#2563EB"/></marker>' +
    '<marker id="arR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#DC2626"/></marker>' +
    '</defs>';
  function svgWrap(inner, vb) {
    return '<svg viewBox="' + (vb || '0 0 320 170') + '" class="le-lesson-svg" role="img" aria-hidden="true">' + SVG_DEFS +
      '<rect x="0" y="0" width="320" height="170" rx="14" fill="url(#lsSky)"/>' + inner + '</svg>';
  }
  function bar(x1, y1, x2, y2, col, w) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + (w || 6) + '" stroke-linecap="round"/>';
  }
  function pin(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="#cfd6dd" stroke="#38424d" stroke-width="1.5"/>'; }
  function ground(y) {
    return '<rect x="0" y="' + y + '" width="320" height="' + (170 - y) + '" fill="#8b7666"/><rect x="0" y="' + y + '" width="320" height="5" fill="#6c8f3f"/>';
  }
  var BL = '#2563EB', RD = '#DC2626', NE = '#64748b';

  function trussSvg(kind) {
    // 4 panels, 60 px wide, height 46, bottom chord at y 120
    var x0 = 40, p = 60, yb = 120, yt = 74, out = '';
    var tops = [], bots = [];
    for (var i = 0; i <= 4; i++) bots.push([x0 + i * p, yb]);
    if (kind === 'warren') {
      for (var j = 0; j < 4; j++) tops.push([x0 + j * p + p / 2, yt]);
      for (var k = 0; k < 4; k++) {
        out += bar(bots[k][0], yb, tops[k][0], yt, k < 2 ? RD : BL, 5);
        out += bar(tops[k][0], yt, bots[k + 1][0], yb, k < 2 ? BL : RD, 5);
      }
      for (var m = 0; m < 3; m++) out += bar(tops[m][0], yt, tops[m + 1][0], yt, RD, 6);
    } else {
      for (var j2 = 1; j2 <= 3; j2++) tops.push([x0 + j2 * p, yt]);
      out += bar(bots[0][0], yb, tops[0][0], yt, RD, 6) + bar(tops[2][0], yt, bots[4][0], yb, RD, 6);
      for (var m2 = 0; m2 < 2; m2++) out += bar(tops[m2][0], yt, tops[m2 + 1][0], yt, RD, 6);
      for (var v = 0; v < 3; v++) out += bar(tops[v][0], yt, tops[v][0], yb, kind === 'pratt' ? (v === 1 ? NE : RD) : BL, 4);
      if (kind === 'pratt') {
        out += bar(tops[0][0], yt, bots[2][0], yb, BL, 4) + bar(tops[2][0], yt, bots[2][0], yb, BL, 4);
      } else {
        out += bar(bots[1][0], yb, tops[1][0], yt, RD, 4) + bar(bots[3][0], yb, tops[1][0], yt, RD, 4);
      }
    }
    for (var b = 0; b < 4; b++) out += bar(bots[b][0], yb, bots[b + 1][0], yb, BL, 6);
    tops.concat(bots).forEach(function(q) { out += pin(q[0], q[1]); });
    out += '<path d="M150 128 L170 128 L160 140 Z" fill="#475569"/><text x="160" y="155" text-anchor="middle" font-size="11" font-weight="800" fill="#475569">load</text>';
    return out;
  }

  function lessonSvg(key) {
    var s = '';
    if (key === 'triangle') {
      s = '<g class="le-shear-sq">' +
        '<polygon points="40,130 120,130 120,50 40,50" fill="rgba(37,99,235,0.06)" stroke="none"/>' +
        bar(40, 130, 120, 130, 'url(#lsWood)', 8) + bar(120, 130, 120, 50, 'url(#lsWood)', 8) + bar(120, 50, 40, 50, 'url(#lsWood)', 8) + bar(40, 50, 40, 130, 'url(#lsWood)', 8) +
        pin(40, 130) + pin(120, 130) + pin(120, 50) + pin(40, 50) + '</g>' +
        '<g class="le-shear-tri">' + bar(190, 130, 280, 130, 'url(#lsWood)', 8) + bar(280, 130, 235, 52, 'url(#lsWood)', 8) + bar(235, 52, 190, 130, 'url(#lsWood)', 8) +
        pin(190, 130) + pin(280, 130) + pin(235, 52) + '</g>' +
        '<text x="80" y="160" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">square: wobbles</text>' +
        '<text x="235" y="160" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">triangle: firm</text>' +
        '<path class="le-push" d="M10 50 L30 50" stroke="#DC2626" stroke-width="4" marker-end="url(#arR)"/>';
    } else if (key === 'forces') {
      s = '<text x="80" y="24" text-anchor="middle" font-size="13" font-weight="800" fill="' + BL + '">PULLED · tracción</text>' +
        '<path d="M22 70 L48 70" stroke="' + BL + '" stroke-width="5" marker-start="url(#arB)"/><path d="M112 70 L138 70" stroke="' + BL + '" stroke-width="5" marker-end="url(#arB)"/>' +
        '<path d="M50 70 C60 64 70 76 80 70 S100 64 110 70" stroke="#8a6a3a" stroke-width="6" fill="none"/>' +
        '<text x="80" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">rope, cable, bottom chord</text>' +
        '<text x="240" y="24" text-anchor="middle" font-size="13" font-weight="800" fill="' + RD + '">SQUEEZED · compresión</text>' +
        '<rect x="225" y="48" width="30" height="80" rx="3" fill="url(#lsStone)" stroke="#6b5d48"/>' +
        '<path d="M240 28 L240 44" stroke="' + RD + '" stroke-width="5" marker-end="url(#arR)"/><path d="M240 150 L240 134" stroke="' + RD + '" stroke-width="5" marker-end="url(#arR)"/>' +
        '<text x="240" y="166" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">column, arch, top chord</text>' +
        '<path d="M60 130 Q80 112 100 130" stroke="#b07a43" stroke-width="5" fill="none"/>' +
        '<path d="M44 130 L56 130" stroke="' + RD + '" stroke-width="4" marker-end="url(#arR)"/><path d="M116 130 L104 130" stroke="' + RD + '" stroke-width="4" marker-end="url(#arR)"/>' +
        '<text x="80" y="150" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">a long stick squeezed: buckles!</text>';
    } else if (key === 'truss') {
      return '<div class="le-truss-row">' +
        ['warren', 'pratt', 'howe'].map(function(k) {
          return '<figure><svg viewBox="0 0 320 170" class="le-lesson-svg" role="img" aria-hidden="true">' + SVG_DEFS +
            '<rect width="320" height="170" rx="14" fill="url(#lsSky)"/>' + trussSvg(k) +
            '<text x="160" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#312e81">' + k.charAt(0).toUpperCase() + k.slice(1) + '</text></svg></figure>';
        }).join('') + '</div><p class="le-legend"><span class="le-dot pull"></span> pulled (tension) <span class="le-dot push"></span> squeezed (compression)</p>';
    } else if (key === 'arch') {
      s = ground(118) + '<rect x="0" y="118" width="70" height="52" fill="#8b7666"/><rect x="250" y="118" width="70" height="52" fill="#8b7666"/>' +
        '<rect x="70" y="135" width="180" height="35" fill="url(#lsWater)"/>' +
        '<path d="M60 118 Q160 20 260 118 L240 118 Q160 45 80 118 Z" fill="url(#lsStone)" stroke="#6b5d48" stroke-width="1.5"/>' +
        '<rect x="56" y="72" width="208" height="10" rx="2" fill="#3c3f45"/>' +
        [100, 130, 160, 190, 220].map(function(x) { var y = 118 - (1 - Math.pow((x - 160) / 100, 2)) * 74; return bar(x, 82, x, y + 10, '#9c8b72', 4); }).join('') +
        '<path d="M90 100 Q110 70 140 58" stroke="' + RD + '" stroke-width="4" fill="none" marker-end="url(#arR)"/>' +
        '<path d="M230 100 Q210 70 180 58" stroke="' + RD + '" stroke-width="4" fill="none" marker-end="url(#arR)"/>' +
        '<path d="M64 130 L40 130" stroke="' + RD + '" stroke-width="5" marker-end="url(#arR)"/><path d="M256 130 L280 130" stroke="' + RD + '" stroke-width="5" marker-end="url(#arR)"/>' +
        '<text x="40" y="160" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">push out</text><text x="280" y="160" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">push out</text>';
    } else if (key === 'suspension') {
      var hang = '';
      for (var x = 98; x <= 222; x += 12) {
        var yc = 30 + 66 * (1 - Math.pow((x - 160) / 70, 2));
        hang += bar(x, yc, x, 102, BL, 1.5);
      }
      s = '<rect x="0" y="120" width="320" height="50" fill="url(#lsWater)"/>' +
        '<path d="M10 116 L90 30 Q160 162 230 30 L310 116" stroke="' + BL + '" stroke-width="4" fill="none"/>' + hang +
        '<rect x="84" y="26" width="12" height="100" fill="#c0392b"/><rect x="224" y="26" width="12" height="100" fill="#c0392b"/>' +
        '<rect x="10" y="102" width="300" height="7" fill="#3c3f45"/>' +
        '<path d="M90 60 L90 80" stroke="' + RD + '" stroke-width="4" marker-end="url(#arR)"/><path d="M230 60 L230 80" stroke="' + RD + '" stroke-width="4" marker-end="url(#arR)"/>' +
        '<rect x="0" y="112" width="20" height="14" fill="#8b7666"/><rect x="300" y="112" width="20" height="14" fill="#8b7666"/>' +
        '<text x="160" y="150" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">cables pulled · towers squeezed</text>';
    } else if (key === 'stayed') {
      var st = '';
      [30, 55, 80, 105, 130].forEach(function(x) { st += bar(150, 22, x, 104, BL, 1.8) + bar(150, 22, 300 - x, 104, BL, 1.8); });
      s = '<rect x="0" y="120" width="320" height="50" fill="url(#lsWater)"/>' + st +
        '<path d="M144 130 L148 14 L152 14 L156 130 Z" fill="#9aa3ad" stroke="#5d656e"/>' +
        '<rect x="10" y="102" width="300" height="7" fill="#3c3f45"/>' +
        '<path d="M40 96 L80 96" stroke="' + RD + '" stroke-width="3" marker-end="url(#arR)"/><path d="M260 96 L220 96" stroke="' + RD + '" stroke-width="3" marker-end="url(#arR)"/>' +
        '<text x="160" y="150" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">straight stays from the tower</text>';
    } else if (key === 'chile') {
      // Malleco-style tall steel railway viaduct
      var tr = '';
      for (var i = 0; i < 5; i++) {
        var cx = 50 + i * 55, h = 100 - Math.abs(i - 2) * 22;
        tr += '<path d="M' + (cx - 10) + ' 44 L' + (cx - 16 - h * 0.1) + ' ' + (44 + h) + ' L' + (cx + 16 + h * 0.1) + ' ' + (44 + h) + ' L' + (cx + 10) + ' 44 Z" fill="none" stroke="#7a2e1f" stroke-width="2.5"/>' +
          '<path d="M' + (cx - 12) + ' 60 L' + (cx + 12) + ' 80 M' + (cx + 12) + ' 60 L' + (cx - 12) + ' 80 M' + (cx - 14) + ' 95 L' + (cx + 14) + ' 115 M' + (cx + 14) + ' 95 L' + (cx - 14) + ' 115" stroke="#9b3b26" stroke-width="1.5"/>';
      }
      s = '<path d="M0 60 Q60 150 160 150 Q260 150 320 60 L320 170 L0 170 Z" fill="#6c8f3f"/>' +
        '<path d="M120 160 Q160 150 200 160" stroke="#5fb0c4" stroke-width="6" fill="none"/>' + tr +
        '<rect x="10" y="36" width="300" height="9" fill="#7a2e1f"/>' +
        '<path d="M10 34 H310" stroke="#3a3a3a" stroke-width="2"/>' +
        '<rect x="40" y="22" width="36" height="12" rx="3" fill="#2b2b2b"/><rect x="78" y="24" width="30" height="10" rx="2" fill="#7c2d12"/>' +
        '<text x="250" y="24" text-anchor="middle" font-size="11" font-weight="800" fill="#312e81">about 102 m high</text>';
    }
    return svgWrap(s);
  }

  function levelThumb(cv, level) {
    var g = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth || 200, H = cv.clientHeight || 110;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sc = buildScene(level);
    var top = Math.max(4, level.tower ? level.tower.top + 1 : 3.5);
    var xm = -3, xM = level.span + 3, ym = level.water - 1.2;
    var s = Math.min(W / (xM - xm), H / (top - ym));
    var cam = { s: s, ox: W / 2 - (xm + xM) / 2 * s, oy: H / 2 + (top + ym) / 2 * s };
    drawBack(g, sc, cam, W, H);
    drawSky(g, sc, cam, W, H, 3);
    drawWater(g, sc, cam, W, H, 0);
    drawFront(g, sc, cam, W, H);
    level.anchors.forEach(function(a) { drawJoint(g, cam, a[0], a[1], 'anchor'); });
  }

  return {
    buildScene: buildScene, drawBack: drawBack, drawSky: drawSky, drawWater: drawWater, drawWaterVeil: drawWaterVeil,
    drawFront: drawFront, drawBlueprint: drawBlueprint, drawMember: drawMember, drawJoint: drawJoint,
    drawVehicle: drawVehicle, vehicleThumb: vehicleThumb, drawDrops: drawDrops, drawBoat: drawBoat,
    stressColor: stressColor, materialIcon: materialIcon, lessonSvg: lessonSvg, levelThumb: levelThumb,
    roundRect: roundRect, X: X, Y: Y
  };
})();
