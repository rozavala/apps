/* ================================================================
   CHESS QUEST — ART (js/chess-quest-art.js)

   Everything you see on the boards:
     • Staunton-style pieces drawn as inline SVG <symbol>s — turned
       boxwood (white) and lacquered ebony (black), with cylinder
       shading, top-face highlights and a soft cast shadow.
     • Maple / walnut squares and a walnut frame, painted once into
       canvas textures at load (no image files).
     • CQBoard.render(): the board renderer behind renderBoard(), with
       piece-move and capture animations, last-move, legal-move dots,
       check glow, arrows and an optional flipped view.
   No network, no images — all art is generated here.
   ================================================================ */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------------------------------------------------------------
     PIECE DRAWING (viewBox 0 0 100 100, centre x = 50, base y = 90)
     --------------------------------------------------------------- */
  function f(n) { return Math.round(n * 10) / 10; }

  // A cylinder/frustum: side wall from (top radius rt at yt) to (bottom
  // radius rb at yb), elliptical bottom edge, plus its top face.
  function drum(yt, rt, yb, rb, ry, side, top, stroke, sw) {
    var d = 'M' + f(50 - rt) + ' ' + f(yt) + ' L' + f(50 - rb) + ' ' + f(yb) +
      ' A' + f(rb) + ' ' + f(ry) + ' 0 0 0 ' + f(50 + rb) + ' ' + f(yb) +
      ' L' + f(50 + rt) + ' ' + f(yt) +
      ' A' + f(rt) + ' ' + f(ry * rt / rb) + ' 0 0 0 ' + f(50 - rt) + ' ' + f(yt) + 'Z';
    var out = '<path d="' + d + '" fill="' + side + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    if (top) out += '<ellipse cx="50" cy="' + f(yt) + '" rx="' + f(rt) + '" ry="' + f(ry * rt / rb) + '" fill="' + top + '" stroke="' + stroke + '" stroke-width="' + (sw * 0.8) + '"/>';
    return out;
  }

  // A turned (lathe) body: pts = [[halfWidth, y], ...] top → bottom,
  // smoothed with Catmull-Rom; closed with an elliptical bottom edge.
  function lathe(pts, ry, fill, stroke, sw) {
    function cr(p) {
      var s = '';
      for (var i = 0; i < p.length - 1; i++) {
        var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        s += ' C' + f(c1x) + ' ' + f(c1y) + ' ' + f(c2x) + ' ' + f(c2y) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
      }
      return s;
    }
    var right = pts.map(function (p) { return [50 + p[0], p[1]]; });
    var left = pts.slice().reverse().map(function (p) { return [50 - p[0], p[1]]; });
    var last = pts[pts.length - 1];
    var d = 'M' + f(right[0][0]) + ' ' + f(right[0][1]) + cr(right) +
      ' A' + f(last[0]) + ' ' + f(ry) + ' 0 0 1 ' + f(50 - last[0]) + ' ' + f(last[1]) +
      cr(left) + 'Z';
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
  }

  function pieceBody(type, c) {
    var W = c === 'w';
    var side = W ? 'url(#cqgW)' : 'url(#cqgB)';
    var top = W ? 'url(#cqgWt)' : 'url(#cqgBt)';
    var ball = W ? 'url(#cqgWs)' : 'url(#cqgBs)';
    var ink = W ? '#4a2a10' : '#050201';
    var sw = W ? 2 : 1.8;
    var rim = W ? 'rgba(255,255,255,0.75)' : 'rgba(255,214,170,0.38)';
    var s = '<ellipse cx="50" cy="90.5" rx="35" ry="6.5" fill="url(#cqgShadow)"/>';
    // two-step plinth shared by every piece
    function base(r) {
      return drum(84, r, 89, r, 3.6, side, null, ink, sw) +
        drum(79, r * 0.86, 84.5, r * 0.97, 3.4, side, top, ink, sw);
    }
    function sheen(x1, y1, x2, y2) {   // vertical highlight line on a turned part
      return '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="' + rim + '" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>';
    }
    switch (type) {
      case 'P':
        s += base(24);
        s += lathe([[7.5, 50], [8.5, 56], [11, 64], [15.5, 72], [19.5, 78.5]], 3.2, side, ink, sw);
        s += drum(46, 13.5, 51, 13.5, 3, side, top, ink, sw);
        s += '<circle cx="50" cy="33.5" r="13" fill="' + ball + '" stroke="' + ink + '" stroke-width="' + sw + '"/>';
        s += '<ellipse cx="45.5" cy="28.5" rx="4.2" ry="3" fill="#fff" opacity="' + (W ? 0.75 : 0.28) + '"/>';
        s += sheen(43.5, 58, 40.5, 74);
        break;
      case 'R':
        s += base(28);
        s += lathe([[14.5, 42], [14.8, 54], [16.5, 66], [20.5, 78.5]], 3.4, side, ink, sw);
        s += drum(38.5, 19, 43, 18, 3, side, top, ink, sw);
        s += '<path d="M31 39 L31 17 L38.5 17 L38.5 23 L46 23 L46 17 L54 17 L54 23 L61.5 23 L61.5 17 L69 17 L69 39 Z" fill="' + side + '" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
        s += '<path d="M31.8 27 H68.2" stroke="' + ink + '" stroke-width="1.2" opacity="0.55"/>';
        s += '<path d="M31.8 28.6 H68.2" stroke="' + rim + '" stroke-width="1" opacity="0.6"/>';
        s += sheen(36, 31, 36, 37) + sheen(41.5, 50, 40.5, 72);
        break;
      case 'B':
        s += base(26);
        s += lathe([[8.5, 52], [9.5, 59], [12.5, 68], [18, 78.5]], 3.2, side, ink, sw);
        s += drum(47.5, 15.5, 52.5, 15, 2.8, side, top, ink, sw);
        s += drum(44, 10, 47.5, 10.5, 2.2, side, top, ink, sw);
        s += lathe([[2.5, 17], [8.5, 21.5], [12.5, 29], [13, 36], [10, 42], [7.5, 44.5]], 2.2, side, ink, sw);
        s += '<path d="M56.5 24.5 L46 36" stroke="' + ink + '" stroke-width="2.8" stroke-linecap="round"/>';
        s += '<path d="M57.6 26.2 L47.6 37.4" stroke="' + rim + '" stroke-width="1.1" stroke-linecap="round"/>';
        s += '<circle cx="50" cy="13" r="4.6" fill="' + ball + '" stroke="' + ink + '" stroke-width="' + (sw * 0.9) + '"/>';
        s += sheen(43, 27, 42, 38) + sheen(44, 58, 41, 74);
        break;
      case 'Q':
        s += base(29);
        s += lathe([[8, 43], [9, 52], [12, 63], [17, 72], [21.5, 78.5]], 3.4, side, ink, sw);
        s += drum(42, 15, 46.5, 14.5, 2.8, side, top, ink, sw);
        s += drum(38, 17.5, 42.5, 16.5, 3, side, top, ink, sw);
        // coronet: flared cup with five points, each tipped with a bead
        s += '<path d="M33 38.5 L28.5 21 L37 29.5 L41.5 18.5 L46 28.5 L50 17 L54 28.5 L58.5 18.5 L63 29.5 L71.5 21 L67 38.5 Z" fill="' + side + '" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
        [[28.5, 20], [41.5, 17.5], [58.5, 17.5], [71.5, 20]].forEach(function (b) {
          s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="3.3" fill="' + ball + '" stroke="' + ink + '" stroke-width="' + (sw * 0.75) + '"/>';
        });
        s += '<ellipse cx="50" cy="27" rx="8.5" ry="5.5" fill="' + ball + '" stroke="' + ink + '" stroke-width="' + (sw * 0.8) + '"/>';
        s += '<circle cx="50" cy="15" r="5" fill="' + ball + '" stroke="' + ink + '" stroke-width="' + (sw * 0.85) + '"/>';
        s += sheen(42.5, 52, 40, 72);
        break;
      case 'K':
        s += base(29);
        s += lathe([[8.5, 44], [9.5, 53], [12.5, 64], [17.5, 72.5], [21.5, 78.5]], 3.4, side, ink, sw);
        s += drum(43, 15, 47.5, 14.5, 2.8, side, top, ink, sw);
        s += drum(39, 17.5, 43.5, 16.5, 3, side, top, ink, sw);
        s += lathe([[17, 25.5], [16, 30], [13.5, 35], [12, 39.5]], 2.6, side, ink, sw);
        s += '<ellipse cx="50" cy="25.5" rx="17" ry="4.2" fill="' + top + '" stroke="' + ink + '" stroke-width="' + (sw * 0.8) + '"/>';
        s += '<ellipse cx="50" cy="23.5" rx="9.5" ry="5.2" fill="' + ball + '" stroke="' + ink + '" stroke-width="' + (sw * 0.8) + '"/>';
        s += '<path d="M47 20 V12.5 H41.5 V7.5 H47 V2.8 H53 V7.5 H58.5 V12.5 H53 V20 Z" fill="' + side + '" stroke="' + ink + '" stroke-width="' + (sw * 0.9) + '" stroke-linejoin="round"/>';
        s += sheen(48.6, 4.5, 48.6, 18) + sheen(42.5, 52, 40, 72);
        break;
      case 'N':
        s += base(28);
        s += drum(73.5, 22.5, 79.5, 23.5, 3.2, side, top, ink, sw);
        // Horse head, facing left (the classic Staunton knight)
        var horse = 'M33.5 74.5 C32 66 33.5 60 39 54.5 C42.5 51 44 48.5 43.5 46 ' +
          'C40 48.5 35.5 50.5 31.5 54 C28.5 56.5 24.5 57.5 21.5 55.5 C18.5 53.5 18.5 49.5 20.5 46.5 ' +
          'C24 41 28.5 35.5 31.5 30 C33.5 26 36.5 22.5 40 20.5 L41 11 L46.5 18 ' +
          'C49 17.2 51.5 17.2 53.5 17.8 L57.5 10.5 L59.5 19.5 ' +
          'C67 23.5 72 31.5 73.5 41.5 C75 52 73.5 63 70.5 74.5 Z';
        s += '<path d="' + horse + '" fill="' + side + '" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
        // mane ridge
        s += '<path d="M59.5 20.5 C66 25.5 69.5 33 70.6 42 C71.5 51 70.5 61 68.6 72" fill="none" stroke="' + ink + '" stroke-width="1.3" opacity="0.6"/>';
        s += '<path d="M63 25 l4.5 -1.5 M66.5 31 l5 -0.8 M68.6 38 l5 0 M69.8 45 l4.8 0.8 M70 52.5 l4.6 1.2 M69.6 60 l4.2 1.4" stroke="' + ink + '" stroke-width="1.4" stroke-linecap="round" opacity="0.65"/>';
        // jaw and cheek
        s += '<path d="M43.5 46 C46.5 41 46 35.5 42.5 32.5" fill="none" stroke="' + ink + '" stroke-width="1.4" opacity="0.55" stroke-linecap="round"/>';
        // eye, nostril, mouth
        s += '<ellipse cx="41" cy="29.5" rx="2.6" ry="2" fill="' + ink + '"/>';
        s += '<circle cx="40.3" cy="28.9" r="0.75" fill="#fff" opacity="0.8"/>';
        s += '<ellipse cx="24.2" cy="48" rx="1.6" ry="1.2" fill="' + ink + '" opacity="0.85"/>';
        s += '<path d="M21.5 53.2 C24 53.6 26.5 53.2 28.5 52" fill="none" stroke="' + ink + '" stroke-width="1.2" opacity="0.6" stroke-linecap="round"/>';
        // highlight down the face and chest
        s += '<path d="M37.5 25.5 C33 31 28.5 37 24.8 43" fill="none" stroke="' + rim + '" stroke-width="2.2" stroke-linecap="round"/>';
        s += '<path d="M37 58 C35.5 62 35 67 35.6 72" fill="none" stroke="' + rim + '" stroke-width="2" stroke-linecap="round" opacity="0.8"/>';
        break;
    }
    return s;
  }

  function defsMarkup() {
    var g = '';
    // White: lacquered boxwood. Black: ebonised wood with a warm sheen.
    g += '<linearGradient id="cqgW" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#a77a47"/><stop offset="0.13" stop-color="#e3c592"/>' +
      '<stop offset="0.32" stop-color="#fffaf0"/><stop offset="0.52" stop-color="#f6e4c2"/>' +
      '<stop offset="0.8" stop-color="#d9b27a"/><stop offset="1" stop-color="#8f6536"/></linearGradient>';
    g += '<linearGradient id="cqgB" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#0d0604"/><stop offset="0.16" stop-color="#3b2418"/>' +
      '<stop offset="0.33" stop-color="#8a604a"/><stop offset="0.5" stop-color="#4a2c1d"/>' +
      '<stop offset="0.8" stop-color="#22130b"/><stop offset="1" stop-color="#080302"/></linearGradient>';
    g += '<radialGradient id="cqgWt" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#e2c38f"/></radialGradient>';
    g += '<radialGradient id="cqgBt" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#7b5541"/><stop offset="1" stop-color="#26150d"/></radialGradient>';
    g += '<radialGradient id="cqgWs" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#fffef9"/><stop offset="0.45" stop-color="#f4dfb8"/><stop offset="1" stop-color="#9c7040"/></radialGradient>';
    g += '<radialGradient id="cqgBs" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#9a715a"/><stop offset="0.4" stop-color="#4a2c1d"/><stop offset="1" stop-color="#070302"/></radialGradient>';
    g += '<radialGradient id="cqgShadow"><stop offset="0" stop-color="#1a0d04" stop-opacity="0.55"/><stop offset="0.6" stop-color="#1a0d04" stop-opacity="0.22"/><stop offset="1" stop-color="#1a0d04" stop-opacity="0"/></radialGradient>';
    var sym = '';
    ['w', 'b'].forEach(function (c) {
      ['P', 'N', 'B', 'R', 'Q', 'K'].forEach(function (t) {
        sym += '<symbol id="cqp-' + c + t + '" viewBox="0 0 100 100">' + pieceBody(t, c) + '</symbol>';
      });
    });
    return '<defs>' + g + '</defs>' + sym;
  }

  function ensureDefs() {
    if (document.getElementById('cq-defs')) return;
    var holder = document.createElementNS(SVGNS, 'svg');
    holder.setAttribute('id', 'cq-defs');
    holder.setAttribute('aria-hidden', 'true');
    holder.setAttribute('width', '0');
    holder.setAttribute('height', '0');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = defsMarkup();
    (document.body || document.documentElement).appendChild(holder);
  }

  // Markup for one piece (code like 'wN'); used on boards and in the UI.
  // `tight` crops the empty margin so pieces fill more of a square.
  function pieceSVG(code, cls, tight) {
    return '<svg class="' + (cls || 'pc-svg') + '" viewBox="' + (tight ? '8 3 84 89' : '0 0 100 100') + '" aria-hidden="true" focusable="false"><use href="#cqp-' + code + '"/></svg>';
  }

  /* ---------------------------------------------------------------
     WOOD TEXTURES — painted once into canvases, cached as data URLs
     --------------------------------------------------------------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function noise2(seed) {
    var R = rng(seed), P = new Float32Array(64 * 64);
    for (var i = 0; i < P.length; i++) P[i] = R();
    function lat(x, y) { return P[((y & 63) << 6) | (x & 63)]; }
    return function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = lat(xi, yi), b = lat(xi + 1, yi), c = lat(xi, yi + 1), d = lat(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  var WOODS = {
    maple:  { base: [236, 211, 164], dark: [205, 164, 104], light: [248, 232, 198], freq: 0.11, warp: 9, ring: 0.5, fiber: 0.22, pores: 0 },
    walnut: { base: [137, 90, 55], dark: [96, 60, 33], light: [166, 116, 74], freq: 0.1, warp: 15, ring: 0.5, fiber: 0.28, pores: 0.5 },
    frame:  { base: [92, 56, 32], dark: [52, 29, 14], light: [124, 80, 48], freq: 0.09, warp: 14, ring: 0.7, fiber: 0.32, pores: 0.6 }
  };
  function paintWood(kind, seed, w, h, horizontal) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    if (!ctx) return null;
    var W = WOODS[kind], img = ctx.createImageData(w, h), px = img.data;
    var n1 = noise2(seed), n2 = noise2(seed * 7 + 3), n3 = noise2(seed * 13 + 11), R = rng(seed + 99);
    var phase = R() * 40;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var a = horizontal ? y : x, b = horizontal ? x : y;      // a = across grain, b = along grain
        var warp = (n1(a / 26, b / 70) - 0.5) * W.warp * 2 + (n2(a / 9, b / 160) - 0.5) * 3;
        var v = (a + warp + phase) * W.freq * Math.PI;
        var ring = Math.pow((Math.sin(v) + 1) / 2, 3.2);
        var fiber = n3(a * 0.9, b * 0.035);
        var t = ring * W.ring + (fiber - 0.5) * W.fiber;
        var lightT = Math.max(0, (n2(a / 40, b / 40) - 0.55)) * 0.9;
        var r = W.base[0] + (W.dark[0] - W.base[0]) * t + (W.light[0] - W.base[0]) * lightT;
        var g = W.base[1] + (W.dark[1] - W.base[1]) * t + (W.light[1] - W.base[1]) * lightT;
        var bl = W.base[2] + (W.dark[2] - W.base[2]) * t + (W.light[2] - W.base[2]) * lightT;
        var i = (y * w + x) * 4;
        px[i] = r; px[i + 1] = g; px[i + 2] = bl; px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // open pores: short dark streaks along the grain
    if (W.pores) {
      ctx.strokeStyle = 'rgba(40,20,8,' + (0.18 * W.pores) + ')';
      ctx.lineWidth = 1;
      for (var k = 0; k < w * h / 260; k++) {
        var px0 = R() * w, py0 = R() * h, len = 3 + R() * 7;
        ctx.beginPath();
        if (horizontal) { ctx.moveTo(px0, py0); ctx.lineTo(px0 + len, py0); }
        else { ctx.moveTo(px0, py0); ctx.lineTo(px0, py0 + len); }
        ctx.stroke();
      }
    }
    try { return cv.toDataURL('image/jpeg', 0.86); } catch (e) { return null; }
  }
  var woodReady = false;
  function ensureWood() {
    if (woodReady) return;
    woodReady = true;
    var root = document.documentElement.style;
    try {
      for (var i = 0; i < 3; i++) {
        var m = paintWood('maple', 11 + i * 17, 120, 240, false);
        var wn = paintWood('walnut', 5 + i * 23, 120, 240, false);
        if (m) root.setProperty('--cq-maple-' + i, 'url(' + m + ')');
        if (wn) root.setProperty('--cq-walnut-' + i, 'url(' + wn + ')');
      }
      var fr = paintWood('frame', 77, 480, 160, true);
      if (fr) root.setProperty('--cq-frame', 'url(' + fr + ')');
      var plank = paintWood('maple', 41, 640, 220, true);
      if (plank) root.setProperty('--cq-plank', 'url(' + plank + ')');
    } catch (e) { /* plain colours from CSS fall back */ }
  }

  /* ---------------------------------------------------------------
     SOUND — a short wooden "tock" for moves, a deeper one for captures
     --------------------------------------------------------------- */
  var actx = null;
  function tock(capture) {
    try {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
      }
      if (actx.state === 'suspended') actx.resume();
      var t0 = actx.currentTime, len = 0.09;
      var buf = actx.createBuffer(1, Math.floor(actx.sampleRate * len), actx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
      var src = actx.createBufferSource(); src.buffer = buf;
      var bp = actx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = capture ? 900 : 1500; bp.Q.value = 3.5;
      var gn = actx.createGain(); gn.gain.value = capture ? 0.55 : 0.38;
      src.connect(bp); bp.connect(gn); gn.connect(actx.destination);
      src.start(t0);
      if (capture) {
        var o = actx.createOscillator(), og = actx.createGain();
        o.frequency.setValueAtTime(220, t0 + 0.02); o.frequency.exponentialRampToValueAtTime(110, t0 + 0.14);
        og.gain.setValueAtTime(0.12, t0 + 0.02); og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        o.connect(og); og.connect(actx.destination); o.start(t0 + 0.02); o.stop(t0 + 0.18);
      }
    } catch (e) {}
  }
  var soundOn = true;

  /* ---------------------------------------------------------------
     BOARD RENDERER
     --------------------------------------------------------------- */
  var NAMES = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };
  function codeAt(board, r, c) { var s = board[r] && board[r][c]; return s ? s.color + s.piece : ''; }
  function has(list, r, c) {
    if (!list) return false;
    for (var i = 0; i < list.length; i++) if (list[i][0] === r && list[i][1] === c) return true;
    return false;
  }

  function ensureFrame(el, flipped) {
    var wrap = el.parentNode;
    if (!wrap) return;
    if (!wrap.classList.contains('cq-frame')) {
      wrap.classList.add('cq-frame');
      var files = document.createElement('div'); files.className = 'cq-files'; files.setAttribute('aria-hidden', 'true');
      var ranks = document.createElement('div'); ranks.className = 'cq-ranks'; ranks.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 8; i++) { files.appendChild(document.createElement('span')); ranks.appendChild(document.createElement('span')); }
      wrap.appendChild(files); wrap.appendChild(ranks);
    }
    if (wrap._cqFlip === flipped) return;
    wrap._cqFlip = flipped;
    var fs = wrap.querySelectorAll('.cq-files span'), rs = wrap.querySelectorAll('.cq-ranks span');
    for (var k = 0; k < 8; k++) {
      fs[k].textContent = 'abcdefgh'[flipped ? 7 - k : k];
      rs[k].textContent = String(flipped ? k + 1 : 8 - k);
    }
  }

  function arrowSVG(arrows, flipped) {
    if (!arrows || !arrows.length) return '';
    var out = '<svg class="cq-arrows" viewBox="0 0 8 8" aria-hidden="true">';
    arrows.forEach(function (a, i) {
      var fr = a.from, to = a.to;
      var x1 = (flipped ? 7 - fr[1] : fr[1]) + 0.5, y1 = (flipped ? 7 - fr[0] : fr[0]) + 0.5;
      var x2 = (flipped ? 7 - to[1] : to[1]) + 0.5, y2 = (flipped ? 7 - to[0] : to[0]) + 0.5;
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
      var hx = x2 - ux * 0.34, hy = y2 - uy * 0.34;      // head base
      var sx = x1 + ux * 0.22, sy = y1 + uy * 0.22;
      var col = a.color || 'rgba(37,99,235,0.82)';
      out += '<line x1="' + sx + '" y1="' + sy + '" x2="' + hx + '" y2="' + hy + '" stroke="' + col + '" stroke-width="0.17" stroke-linecap="round"/>';
      var px = -uy, py = ux;
      out += '<path d="M' + (x2 - ux * 0.05) + ' ' + (y2 - uy * 0.05) + ' L' + (hx + px * 0.24) + ' ' + (hy + py * 0.24) + ' L' + (hx - px * 0.24) + ' ' + (hy - py * 0.24) + ' Z" fill="' + col + '"/>';
    });
    return out + '</svg>';
  }

  function render(el, board, o) {
    o = o || {};
    ensureDefs(); ensureWood();
    var flipped = !!(o.flipped != null ? o.flipped : el._cqFlipPref);
    el.classList.add('cq-board');
    ensureFrame(el, flipped);
    var prev = el._cqPrev, prevFlip = el._cqPrevFlip;
    var cur = [];
    for (var r0 = 0; r0 < 8; r0++) for (var c0 = 0; c0 < 8; c0++) cur.push(codeAt(board, r0, c0));

    var html = '';
    var cells = [];
    for (var dr = 0; dr < 8; dr++) {
      for (var dc = 0; dc < 8; dc++) {
        var r = flipped ? 7 - dr : dr, c = flipped ? 7 - dc : dc;
        var light = (r + c) % 2 === 0;
        var cls = 'sq ' + (light ? 'light' : 'dark') + ' v' + ((r * 3 + c * 5) % 3) + ((r * 7 + c) % 2 ? ' fy' : '');
        if (o.selected && o.selected[0] === r && o.selected[1] === c) cls += ' selected';
        if (has(o.moveDots, r, c)) cls += ' move-dot';
        if (has(o.captureDots, r, c)) cls += ' capture-ring';
        if (o.lastMove) {
          if (o.lastMove.fr === r && o.lastMove.fc === c) cls += ' last-from';
          if (o.lastMove.tr === r && o.lastMove.tc === c) cls += ' last-to';
        }
        if (has(o.hintSquares, r, c)) cls += ' hint-sq';
        if (has(o.goodSquares, r, c)) cls += ' good-sq';
        if (has(o.badSquares, r, c)) cls += ' bad-sq';
        var isCheck = o.checkSquare && o.checkSquare[0] === r && o.checkSquare[1] === c;
        if (isCheck) cls += ' check-sq';
        var code = cur[r * 8 + c];
        var label = 'abcdefgh'[c] + (8 - r) + (code ? ', ' + (code[0] === 'w' ? 'white ' : 'black ') + NAMES[code[1]] : '');
        html += '<button type="button" class="' + cls + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + label + '"' + (o.onClick ? '' : ' tabindex="-1"') + '>' +
          (isCheck ? '<span class="cq-glow"></span>' : '') +
          (code ? '<span class="pc pc-' + code[0] + '" data-code="' + code + '">' + pieceSVG(code, null, true) + '</span>' : '') +
          '</button>';
      }
    }
    html += arrowSVG(o.arrows, flipped);
    el.innerHTML = html;
    if (o.onClick) {
      el.onclick = function (e) {
        var b = e.target.closest ? e.target.closest('.sq') : null;
        if (!b || !el.contains(b)) return;
        o.onClick(+b.getAttribute('data-r'), +b.getAttribute('data-c'));
      };
    } else el.onclick = null;

    el._cqPrev = cur; el._cqPrevFlip = flipped;
    if (o.animate === false || !prev || prevFlip !== flipped || reduceMotion || typeof Element === 'undefined' || !Element.prototype.animate) return;
    animateDiff(el, prev, cur, flipped, o);
  }

  function squareEl(el, s) { return el.querySelector('.sq[data-r="' + (s >> 3) + '"][data-c="' + (s & 7) + '"]'); }
  function disp(s, flipped) { var r = s >> 3, c = s & 7; return flipped ? [7 - r, 7 - c] : [r, c]; }

  function animateDiff(el, prev, cur, flipped, o) {
    var changed = [];
    for (var s = 0; s < 64; s++) if (prev[s] !== cur[s]) changed.push(s);
    if (!changed.length || changed.length > 6) return;
    var used = {}, moves = [];
    changed.forEach(function (t) {
      if (!cur[t]) return;
      var best = -1, bestD = 99;
      changed.forEach(function (s2) {
        if (s2 === t || used[s2] || prev[s2] !== cur[t]) return;
        var d = Math.abs((s2 >> 3) - (t >> 3)) + Math.abs((s2 & 7) - (t & 7));
        if (d < bestD) { bestD = d; best = s2; }
      });
      var promo = false;
      if (best < 0) {   // promotion: a pawn of the same colour vanished nearby
        changed.forEach(function (s2) {
          if (best >= 0 || s2 === t || used[s2] || prev[s2] !== cur[t][0] + 'P' || cur[s2] === prev[s2]) return;
          best = s2; promo = true;
        });
      }
      if (best >= 0) { used[best] = true; moves.push({ from: best, to: t, promo: promo }); }
    });
    var maxDur = 0, captured = [];
    moves.forEach(function (m) {
      var a = disp(m.from, flipped), b = disp(m.to, flipped);
      var dist = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
      var dur = Math.min(520, 210 + dist * 48);
      maxDur = Math.max(maxDur, dur);
      var sq = squareEl(el, m.to); if (!sq) return;
      var pc = sq.querySelector('.pc'); if (!pc) return;
      var dx = (a[1] - b[1]) * 100, dy = (a[0] - b[0]) * 100;
      pc.classList.add('moving');
      var anim = pc.animate([
        { transform: 'translate(' + dx + '%,' + dy + '%) scale(1)', filter: 'drop-shadow(0 2px 2px rgba(30,15,5,.35))' },
        { transform: 'translate(' + (dx * 0.45) + '%,' + (dy * 0.45 - 8) + '%) scale(1.14)', filter: 'drop-shadow(0 10px 7px rgba(30,15,5,.35))', offset: 0.55 },
        { transform: 'translate(0,0) scale(1)', filter: 'drop-shadow(0 2px 2px rgba(30,15,5,.35))' }
      ], { duration: dur, easing: 'cubic-bezier(.35,.1,.25,1)' });
      anim.onfinish = function () { pc.classList.remove('moving'); };
      if (m.promo) sparkle(sq, dur);
    });
    // pieces that disappeared without moving were captured
    changed.forEach(function (s2) {
      if (prev[s2] && !used[s2] && !(cur[s2] && cur[s2] === prev[s2])) captured.push(s2);
    });
    captured.forEach(function (s2) {
      var sq = squareEl(el, s2); if (!sq) return;
      var ghost = document.createElement('span');
      ghost.className = 'pc pc-ghost';
      ghost.innerHTML = pieceSVG(prev[s2], null, true);
      sq.insertBefore(ghost, sq.firstChild);
      var delay = Math.max(0, maxDur * 0.72);
      var tilt = (s2 % 2 ? 1 : -1) * 38;
      var a = ghost.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'none', opacity: 1, offset: 0.01 },
        { transform: 'translate(' + (tilt / 3) + '%,-14%) rotate(' + tilt + 'deg) scale(1.08)', opacity: 0.85, offset: 0.45 },
        { transform: 'translate(' + (tilt / 1.6) + '%,18%) rotate(' + (tilt * 2.2) + 'deg) scale(0.55)', opacity: 0 }
      ], { duration: 520, delay: delay, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' });
      a.onfinish = function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); };
      var puff = document.createElement('span');
      puff.className = 'cq-puff';
      sq.appendChild(puff);
      var pa = puff.animate([{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(0.5)', opacity: 0.9, offset: 0.15 }, { transform: 'scale(1.35)', opacity: 0 }],
        { duration: 560, delay: delay, easing: 'ease-out', fill: 'both' });
      pa.onfinish = function () { if (puff.parentNode) puff.parentNode.removeChild(puff); };
    });
    if (moves.length && soundOn && !o.silent) {
      setTimeout(function () { tock(captured.length > 0); }, Math.max(0, maxDur - 40));
    }
  }

  function sparkle(sq, delay) {
    var s = document.createElement('span');
    s.className = 'cq-spark';
    sq.appendChild(s);
    var a = s.animate([{ transform: 'scale(0.2) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(60deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(1.4) rotate(120deg)', opacity: 0 }],
      { duration: 800, delay: delay, fill: 'both' });
    a.onfinish = function () { if (s.parentNode) s.parentNode.removeChild(s); };
  }

  /* ---------------------------------------------------------------
     HERO SCENE — a few large pieces standing on a maple plank
     --------------------------------------------------------------- */
  function heroMarkup() {
    ensureDefs(); ensureWood();
    var pcs = [['bR', 4, 46, 0.78], ['wN', 22, 40, 0.92], ['wK', 40, 30, 1.1], ['bQ', 60, 36, 1.0], ['wP', 79, 52, 0.7]];
    return '<div class="cq-hero-plank" aria-hidden="true">' + pcs.map(function (p) {
      return '<span class="cq-hero-pc" style="left:' + p[1] + '%;bottom:' + (12 + (1.1 - p[3]) * 6) + '%;height:' + (p[3] * 74) + '%">' + pieceSVG(p[0]) + '</span>';
    }).join('') + '</div>';
  }

  window.CQArt = {
    ensureDefs: ensureDefs,
    ensureWood: ensureWood,
    pieceSVG: pieceSVG,
    heroMarkup: heroMarkup,
    tock: tock,
    setSound: function (on) { soundOn = !!on; },
    _pieceBody: pieceBody
  };
  window.CQBoard = { render: render };
})();
