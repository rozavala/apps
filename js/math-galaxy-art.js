/* ================================================================
   MATH GALAXY — art (js/math-galaxy-art.js)
   Hand-drawn canvas space scenes: layered starfield with parallax,
   nebulae, lit planets (craters, bands, storms, rings), the kid's
   rocket, and an asteroid for boss rounds. No images, no network.

   MGArt.scene(canvas, opts) → controller
     opts.mode: 'map'    galaxy route Earth → Moon → … → Neptune
                'orbit'  one world with its sector beacons
                'flight' the trip during a mission (progress 0..1)
                'arrive' rocket in orbit after a mission
     controller.set(patch)  controller.pulse(kind)  controller.destroy()
   MGArt.thumb(canvas, kind)     draw one planet into a small canvas
   MGArt.icon(name)              small inline SVG string for UI chrome
   ================================================================ */

var MGArt = (function() {
  'use strict';

  var TAU = Math.PI * 2;

  function reduceMotion() {
    try {
      if (document.documentElement.classList.contains('zs-a11y-reduce-motion')) return true;
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }
  function dpr() { return Math.min(2, window.devicePixelRatio || 1); }

  // Small seeded RNG so every planet looks the same on every visit.
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function() {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function safeColor(c, fallback) {
    return (typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c)) ? c : fallback;
  }
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, f) {
    var c = hexToRgb(hex);
    var m = f < 0 ? 0 : 255, k = Math.abs(f);
    return 'rgb(' + c.map(function(v) { return Math.round(v + (m - v) * k); }).join(',') + ')';
  }

  /* ------------------------------------------------------------
     Planets — catalogue
     ------------------------------------------------------------ */
  var BODIES = {
    earth:   { seed: 11, atm: 'rgba(110,170,255,0.55)', label: 'Earth' },
    moon:    { seed: 23, atm: 'rgba(255,255,255,0.10)', label: 'The Moon' },
    mars:    { seed: 37, atm: 'rgba(255,140,100,0.30)', label: 'Mars' },
    jupiter: { seed: 41, atm: 'rgba(255,220,170,0.22)', label: 'Jupiter' },
    saturn:  { seed: 53, atm: 'rgba(255,230,170,0.20)', label: 'Saturn', rings: true },
    neptune: { seed: 67, atm: 'rgba(100,150,255,0.50)', label: 'Neptune' }
  };

  function softBlob(g, x, y, rx, ry, color, alpha) {
    g.save();
    g.translate(x, y);
    g.scale(1, ry / rx);
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, color.replace('A', alpha));
    gr.addColorStop(0.6, color.replace('A', alpha * 0.55));
    gr.addColorStop(1, color.replace('A', 0));
    g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill();
    g.restore();
  }

  // Wavy latitude bands; lat values are sin(latitude) in -1..1.
  function bands(g, R, list, rnd, amp) {
    list.forEach(function(b) {
      var ph = rnd() * TAU, fq = 2 + rnd() * 3;
      g.beginPath();
      for (var x = -R; x <= R; x += R / 24) g.lineTo(x, b[0] * R + Math.sin(x / R * fq * Math.PI + ph) * R * amp);
      for (var x2 = R; x2 >= -R; x2 -= R / 24) g.lineTo(x2, b[1] * R + Math.sin(x2 / R * (fq + 1) * Math.PI + ph * 1.3) * R * amp);
      g.closePath();
      g.fillStyle = b[2];
      g.fill();
    });
  }
  function streaks(g, R, rnd, n, color, maxA) {
    for (var i = 0; i < n; i++) {
      var y = (rnd() * 2 - 1) * R * 0.95;
      var w = R * (0.3 + rnd() * 1.2), x = (rnd() * 2 - 1) * R;
      g.strokeStyle = color.replace('A', (rnd() * maxA).toFixed(3));
      g.lineWidth = R * (0.006 + rnd() * 0.02);
      g.beginPath(); g.moveTo(x - w / 2, y);
      g.quadraticCurveTo(x, y + (rnd() - 0.5) * R * 0.05, x + w / 2, y);
      g.stroke();
    }
  }
  function crater(g, x, y, cr, base) {
    g.fillStyle = 'rgba(55,52,50,0.45)';
    g.beginPath(); g.arc(x, y, cr, 0, TAU); g.fill();
    g.fillStyle = base;
    g.beginPath(); g.arc(x + cr * 0.18, y + cr * 0.18, cr * 0.82, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,250,0.35)';
    g.lineWidth = Math.max(0.6, cr * 0.14);
    g.beginPath(); g.arc(x, y, cr * 0.95, 0.1 * Math.PI, 0.7 * Math.PI); g.stroke();
  }

  var texCache = {};
  function planetTex(kind, R) {
    // Quantise the size so a growing planet reuses a few textures.
    R = R <= 32 ? Math.max(4, Math.round(R)) : Math.min(720, Math.ceil(R / 24) * 24);
    var key = kind + ':' + R;
    if (texCache[key]) return texCache[key];
    var keys = Object.keys(texCache);
    if (keys.length > 48) keys.slice(0, 16).forEach(function(k) { delete texCache[k]; });
    var c = document.createElement('canvas');
    c.width = c.height = R * 2;
    var g = c.getContext('2d');
    var rnd = rng(BODIES[kind].seed * 7919);
    g.translate(R, R);
    g.save();
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();

    var i;
    if (kind === 'moon') {
      g.fillStyle = '#bdbab2'; g.fillRect(-R, -R, 2 * R, 2 * R);
      for (i = 0; i < 7; i++) softBlob(g, (rnd() - 0.6) * R * 1.2, (rnd() - 0.6) * R * 1.1, R * (0.18 + rnd() * 0.25), R * (0.12 + rnd() * 0.2), 'rgba(110,108,104,A)', 0.55);
      for (i = 0; i < 26; i++) {
        var a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.92;
        crater(g, Math.cos(a) * d, Math.sin(a) * d, R * (0.025 + rnd() * rnd() * 0.12), 'rgba(178,175,168,0.9)');
      }
    } else if (kind === 'mars') {
      var mg = g.createLinearGradient(0, -R, 0, R);
      mg.addColorStop(0, '#d0774a'); mg.addColorStop(0.5, '#c25a32'); mg.addColorStop(1, '#a9472a');
      g.fillStyle = mg; g.fillRect(-R, -R, 2 * R, 2 * R);
      for (i = 0; i < 9; i++) softBlob(g, (rnd() - 0.5) * R * 1.8, (rnd() - 0.45) * R * 1.4, R * (0.15 + rnd() * 0.3), R * (0.08 + rnd() * 0.15), 'rgba(110,40,22,A)', 0.55);
      for (i = 0; i < 6; i++) softBlob(g, (rnd() - 0.5) * R * 1.8, (rnd() - 0.5) * R * 1.6, R * (0.12 + rnd() * 0.25), R * (0.1 + rnd() * 0.15), 'rgba(235,160,110,A)', 0.35);
      // a long dark canyon
      g.strokeStyle = 'rgba(90,30,18,0.45)'; g.lineWidth = R * 0.035;
      g.beginPath(); g.moveTo(-R * 0.55, R * 0.05); g.bezierCurveTo(-R * 0.2, -R * 0.02, R * 0.1, R * 0.12, R * 0.45, R * 0.06); g.stroke();
      for (i = 0; i < 10; i++) crater(g, (rnd() - 0.5) * R * 1.6, (rnd() - 0.5) * R * 1.6, R * (0.02 + rnd() * 0.05), 'rgba(190,90,55,0.85)');
      softBlob(g, -R * 0.05, -R * 0.92, R * 0.42, R * 0.16, 'rgba(255,250,245,A)', 0.95);
      softBlob(g, R * 0.05, R * 0.95, R * 0.3, R * 0.1, 'rgba(255,250,245,A)', 0.7);
    } else if (kind === 'jupiter') {
      g.fillStyle = '#e9d8b4'; g.fillRect(-R, -R, 2 * R, 2 * R);
      bands(g, R, [
        [-1.0, -0.78, '#b48d6a'], [-0.7, -0.55, '#c8a27a'], [-0.42, -0.18, '#a86e48'],
        [-0.1, 0.06, '#f3e7cf'], [0.14, 0.4, '#b07450'], [0.5, 0.62, '#cfae86'], [0.72, 1.0, '#a98563']
      ], rnd, 0.018);
      streaks(g, R, rnd, 70, 'rgba(255,245,225,A)', 0.35);
      streaks(g, R, rnd, 50, 'rgba(120,70,40,A)', 0.25);
      // Great Red Spot
      g.save(); g.translate(R * 0.28, R * 0.3); g.scale(1, 0.58);
      var sg = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.2);
      sg.addColorStop(0, '#c8553a'); sg.addColorStop(0.65, '#b8573f'); sg.addColorStop(0.85, '#e7c7a3'); sg.addColorStop(1, 'rgba(231,199,163,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(0, 0, R * 0.2, 0, TAU); g.fill();
      g.restore();
    } else if (kind === 'saturn') {
      g.fillStyle = '#e8d29e'; g.fillRect(-R, -R, 2 * R, 2 * R);
      bands(g, R, [
        [-1.0, -0.7, '#c9ad73'], [-0.6, -0.42, '#dcc28a'], [-0.3, -0.12, '#d2b679'],
        [0.05, 0.2, '#efdfb4'], [0.3, 0.5, '#d5b97c'], [0.62, 1.0, '#c4a56c']
      ], rnd, 0.008);
      streaks(g, R, rnd, 50, 'rgba(255,248,225,A)', 0.3);
    } else if (kind === 'neptune') {
      var ng = g.createLinearGradient(0, -R, 0, R);
      ng.addColorStop(0, '#5b86ec'); ng.addColorStop(0.5, '#3a63d6'); ng.addColorStop(1, '#2b4bb8');
      g.fillStyle = ng; g.fillRect(-R, -R, 2 * R, 2 * R);
      bands(g, R, [[-0.75, -0.55, 'rgba(40,70,170,0.55)'], [-0.15, 0.02, 'rgba(120,160,245,0.45)'], [0.45, 0.62, 'rgba(35,62,160,0.5)']], rnd, 0.01);
      streaks(g, R, rnd, 26, 'rgba(255,255,255,A)', 0.55);
      g.save(); g.translate(-R * 0.25, R * 0.18); g.scale(1, 0.55);
      var dg = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.16);
      dg.addColorStop(0, 'rgba(18,32,105,0.95)'); dg.addColorStop(1, 'rgba(18,32,105,0)');
      g.fillStyle = dg; g.beginPath(); g.arc(0, 0, R * 0.16, 0, TAU); g.fill();
      g.restore();
    } else { // earth
      var eg = g.createLinearGradient(0, -R, 0, R);
      eg.addColorStop(0, '#2c74d8'); eg.addColorStop(1, '#1a4fa8');
      g.fillStyle = eg; g.fillRect(-R, -R, 2 * R, 2 * R);
      for (i = 0; i < 6; i++) softBlob(g, (rnd() - 0.5) * R * 1.6, (rnd() - 0.5) * R * 1.4, R * (0.2 + rnd() * 0.3), R * (0.15 + rnd() * 0.25), 'rgba(58,135,70,A)', 0.95);
      for (i = 0; i < 4; i++) softBlob(g, (rnd() - 0.5) * R * 1.2, (rnd() - 0.5) * R * 1.0, R * (0.1 + rnd() * 0.15), R * (0.08 + rnd() * 0.1), 'rgba(170,140,80,A)', 0.7);
      streaks(g, R, rnd, 34, 'rgba(255,255,255,A)', 0.8);
      softBlob(g, 0, -R * 0.98, R * 0.5, R * 0.14, 'rgba(255,255,255,A)', 0.9);
    }

    // Terminator lighting: the Sun is up and to the left.
    var lx = -0.45 * R, ly = -0.4 * R;
    var lg = g.createRadialGradient(lx, ly, R * 0.05, lx * 0.15, ly * 0.15, R * 1.32);
    lg.addColorStop(0, 'rgba(255,255,255,0.28)');
    lg.addColorStop(0.32, 'rgba(255,255,255,0)');
    lg.addColorStop(0.68, 'rgba(0,0,14,0.38)');
    lg.addColorStop(1, 'rgba(0,0,18,0.94)');
    g.fillStyle = lg; g.fillRect(-R, -R, 2 * R, 2 * R);
    g.restore();
    texCache[key] = c;
    return c;
  }

  var RING_BANDS = [
    [1.22, 1.36, 'rgba(170,150,115,0.30)'],
    [1.38, 1.62, 'rgba(232,214,172,0.92)'],
    [1.62, 1.78, 'rgba(214,192,148,0.85)'],
    [1.84, 2.1, 'rgba(206,186,142,0.72)'],
    [2.12, 2.18, 'rgba(206,186,142,0.35)']
  ];
  function drawRings(ctx, x, y, R, front) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.36);
    ctx.beginPath();
    if (front) ctx.rect(-R * 2.4, 0, R * 4.8, R * 2.4);
    else ctx.rect(-R * 2.4, -R * 2.4, R * 4.8, R * 2.4);
    ctx.clip();
    ctx.scale(1, 0.27);
    RING_BANDS.forEach(function(b) {
      ctx.strokeStyle = b[2];
      ctx.lineWidth = (b[1] - b[0]) * R;
      ctx.beginPath(); ctx.arc(0, 0, (b[0] + b[1]) / 2 * R, 0, TAU); ctx.stroke();
    });
    // fine ringlets
    ctx.lineWidth = Math.max(0.5, R * 0.006);
    for (var k = 0; k < 18; k++) {
      ctx.strokeStyle = 'rgba(120,100,70,' + (0.08 + (k % 3) * 0.05) + ')';
      ctx.beginPath(); ctx.arc(0, 0, (1.4 + k * 0.042) * R, 0, TAU); ctx.stroke();
    }
    if (!front) {
      // the globe's shadow on the far side of the rings, away from the Sun
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 2.2 * R, 0, TAU);
      ctx.arc(0, 0, 1.2 * R, 0, TAU, true);
      ctx.clip('evenodd');
      ctx.fillStyle = 'rgba(0,0,12,0.55)';
      ctx.fillRect(R * 0.15, -R * 2.4, R * 0.85, R * 2.4);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPlanet(ctx, kind, x, y, R, opts) {
    opts = opts || {};
    var b = BODIES[kind] || BODIES.moon;
    if (b.rings && !opts.noRings) drawRings(ctx, x, y, R, false);
    // atmosphere glow
    var ag = ctx.createRadialGradient(x, y, R * 0.92, x, y, R * 1.28);
    ag.addColorStop(0, b.atm); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(x, y, R * 1.28, 0, TAU); ctx.fill();
    var px = R * (opts.ratio || dpr());
    var tex = planetTex(kind, px);
    ctx.drawImage(tex, x - R, y - R, R * 2, R * 2);
    if (b.rings && !opts.noRings) {
      // ring shadow on the globe
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
      ctx.translate(x, y + R * 0.1); ctx.rotate(-0.36); ctx.scale(1, 0.27);
      ctx.strokeStyle = 'rgba(40,25,5,0.28)'; ctx.lineWidth = R * 0.5;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.5, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke();
      ctx.restore();
      drawRings(ctx, x, y, R, true);
    }
  }

  /* ------------------------------------------------------------
     Rocket — drawn pointing +x, ~110 units long at scale 100.
     ------------------------------------------------------------ */
  function drawFlame(ctx, x0, power, t) {
    var fl = Math.sin(t * 31) * 0.08 + Math.sin(t * 17.3) * 0.06;
    var L = (26 + 30 * power) * (1 + fl);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var glow = ctx.createRadialGradient(x0 - L * 0.3, 0, 2, x0 - L * 0.3, 0, L * 0.9);
    glow.addColorStop(0, 'rgba(255,170,60,0.55)'); glow.addColorStop(1, 'rgba(255,90,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x0 - L * 0.3, 0, L * 0.9, 0, TAU); ctx.fill();
    function tongue(len, wid, c0, c1) {
      var g = ctx.createLinearGradient(x0, 0, x0 - len, 0);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0, -wid);
      ctx.quadraticCurveTo(x0 - len * 0.45, -wid * 1.15, x0 - len, 0);
      ctx.quadraticCurveTo(x0 - len * 0.45, wid * 1.15, x0, wid);
      ctx.closePath(); ctx.fill();
    }
    tongue(L, 11, 'rgba(255,120,30,0.95)', 'rgba(255,40,0,0)');
    tongue(L * 0.72, 8, 'rgba(255,205,70,1)', 'rgba(255,140,20,0)');
    tongue(L * 0.42, 4.5, 'rgba(255,255,235,1)', 'rgba(255,230,160,0)');
    ctx.restore();
  }

  function bodyPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(-36, -13);
    ctx.lineTo(18, -15.5);
    ctx.bezierCurveTo(38, -15.5, 54, -7, 61, 0);
    ctx.bezierCurveTo(54, 7, 38, 15.5, 18, 15.5);
    ctx.lineTo(-36, 13);
    ctx.quadraticCurveTo(-41, 0, -36, -13);
    ctx.closePath();
  }

  function drawRocket(ctx, x, y, size, ang, o) {
    o = o || {};
    var col = safeColor(o.color, '#7C3AED');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang || 0);
    ctx.scale(size / 100, size / 100);
    if (o.flame > 0) drawFlame(ctx, -47, o.flame, o.t || 0);

    // nozzle
    var ng = ctx.createLinearGradient(0, -14, 0, 14);
    ng.addColorStop(0, '#9aa1ad'); ng.addColorStop(0.45, '#4b5260'); ng.addColorStop(1, '#22262e');
    ctx.fillStyle = ng;
    ctx.beginPath(); ctx.moveTo(-36, -9); ctx.lineTo(-48, -13); ctx.lineTo(-48, 13); ctx.lineTo(-36, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#15181e'; ctx.fillRect(-49, -13, 2.5, 26);

    // fins (kid's colour)
    function fin(sgn) {
      var fg = ctx.createLinearGradient(-10, 0, -44, sgn * 38);
      fg.addColorStop(0, shade(col, 0.25)); fg.addColorStop(1, shade(col, -0.35));
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-2, sgn * 14);
      ctx.bezierCurveTo(-12, sgn * 19, -28, sgn * 27, -40, sgn * 39);
      ctx.lineTo(-45, sgn * 33);
      ctx.quadraticCurveTo(-43, sgn * 20, -36, sgn * 13);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-6, sgn * 16); ctx.bezierCurveTo(-16, sgn * 21, -28, sgn * 28, -39, sgn * 37); ctx.stroke();
    }
    fin(-1); fin(1);

    // fuselage
    bodyPath(ctx);
    var bg = ctx.createLinearGradient(0, -16, 0, 16);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.35, '#eef1f6'); bg.addColorStop(0.75, '#b9c1cf'); bg.addColorStop(1, '#7c8698');
    ctx.fillStyle = bg; ctx.fill();
    ctx.save();
    bodyPath(ctx); ctx.clip();
    // nose cone
    var rg = ctx.createLinearGradient(0, -16, 0, 16);
    rg.addColorStop(0, '#ff7a6b'); rg.addColorStop(0.4, '#e2372b'); rg.addColorStop(1, '#8e1219');
    ctx.fillStyle = rg; ctx.fillRect(24, -20, 40, 40);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(23, -20, 1.6, 40);
    // stripe
    var stg = ctx.createLinearGradient(0, -16, 0, 16);
    stg.addColorStop(0, shade(col, 0.3)); stg.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = stg; ctx.fillRect(-22, -20, 8, 40);
    // panel lines + rivets
    ctx.strokeStyle = 'rgba(40,50,70,0.22)'; ctx.lineWidth = 0.9;
    [-28, -8, 16].forEach(function(px) { ctx.beginPath(); ctx.moveTo(px, -18); ctx.lineTo(px, 18); ctx.stroke(); });
    ctx.fillStyle = 'rgba(40,50,70,0.35)';
    for (var rx = -32; rx < 22; rx += 6) { ctx.beginPath(); ctx.arc(rx, 11, 0.8, 0, TAU); ctx.fill(); }
    // specular streak
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-30, -9.5); ctx.lineTo(40, -9.5); ctx.stroke();
    ctx.restore();
    bodyPath(ctx);
    ctx.strokeStyle = 'rgba(20,25,40,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();

    // porthole
    var wx = 4;
    var ring = ctx.createLinearGradient(wx - 9, -9, wx + 9, 9);
    ring.addColorStop(0, '#fff0b0'); ring.addColorStop(0.5, '#d4a21c'); ring.addColorStop(1, '#7a5508');
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(wx, 0, 9.5, 0, TAU); ctx.fill();
    var gl = ctx.createRadialGradient(wx - 2.5, -2.5, 1, wx, 0, 7.5);
    gl.addColorStop(0, '#bfe6ff'); gl.addColorStop(0.45, '#2e6fc0'); gl.addColorStop(1, '#0a1838');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(wx, 0, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(wx, 0, 5, 1.1 * Math.PI, 1.55 * Math.PI); ctx.stroke();
    // centre fin seen edge-on
    ctx.fillStyle = shade(col, -0.3);
    ctx.beginPath(); ctx.moveTo(-18, -1.8); ctx.lineTo(-45, -2.5); ctx.lineTo(-45, 2.5); ctx.lineTo(-18, 1.8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------
     Asteroid (boss rounds) — seeded lumpy rock that cracks.
     ------------------------------------------------------------ */
  function asteroidShape(seed, n) {
    var r = rng(seed), pts = [];
    for (var i = 0; i < n; i++) pts.push(0.78 + r() * 0.26);
    return pts;
  }
  var AST = asteroidShape(991, 22);
  function drawAsteroid(ctx, x, y, R, hp, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.12);
    ctx.beginPath();
    AST.forEach(function(k, i) {
      var a = i / AST.length * TAU;
      ctx.lineTo(Math.cos(a) * R * k, Math.sin(a) * R * k);
    });
    ctx.closePath();
    var g = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R * 1.05);
    g.addColorStop(0, '#a99b8a'); g.addColorStop(0.55, '#6b5d50'); g.addColorStop(1, '#2b231d');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = Math.max(1, R * 0.02); ctx.stroke();
    ctx.save(); ctx.clip();
    var r = rng(77);
    for (var i = 0; i < 9; i++) crater(ctx, (r() - 0.5) * R * 1.3, (r() - 0.5) * R * 1.3, R * (0.06 + r() * 0.12), 'rgba(110,98,86,0.9)');
    // cracks grow as hp falls (hp 1 → 0)
    var cracks = Math.round((1 - hp) * 8);
    ctx.strokeStyle = 'rgba(255,170,80,0.9)'; ctx.lineWidth = Math.max(1, R * 0.025);
    ctx.shadowColor = 'rgba(255,140,40,0.9)'; ctx.shadowBlur = R * 0.12;
    var cr = rng(5);
    for (var c = 0; c < cracks; c++) {
      var a0 = cr() * TAU, x0 = Math.cos(a0) * R * 0.15, y0 = Math.sin(a0) * R * 0.15;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      var xx = x0, yy = y0;
      for (var s = 0; s < 4; s++) { xx += Math.cos(a0 + (cr() - 0.5)) * R * 0.22; yy += Math.sin(a0 + (cr() - 0.5)) * R * 0.22; ctx.lineTo(xx, yy); }
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  /* ------------------------------------------------------------
     Starfield + nebula
     ------------------------------------------------------------ */
  function makeStars(w, h, seed) {
    var r = rng(seed || 4242), n = Math.min(420, Math.round(w * h / 1500)), out = [];
    var tints = ['255,255,255', '255,255,255', '200,220,255', '255,236,200', '190,200,255'];
    for (var i = 0; i < n; i++) {
      var z = r();
      out.push({ x: r(), y: r(), z: z, r: 0.4 + z * z * 1.6, a: 0.35 + r() * 0.65, ph: r() * TAU, c: tints[Math.floor(r() * tints.length)] });
    }
    return out;
  }
  function makeNebula(w, h, seed, palette) {
    var c = document.createElement('canvas');
    var s = 0.5;
    c.width = Math.max(2, Math.round(w * s)); c.height = Math.max(2, Math.round(h * s));
    var g = c.getContext('2d'), r = rng(seed || 99);
    var W = c.width, H = c.height;
    g.globalCompositeOperation = 'lighter';
    palette = palette || ['109,40,217', '190,24,93', '14,116,144', '37,99,235'];
    for (var i = 0; i < 14; i++) {
      var x = r() * W, y = r() * H, rr = (0.15 + r() * 0.35) * Math.max(W, H);
      var col = palette[i % palette.length];
      var gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(' + col + ',' + (0.12 + r() * 0.14).toFixed(3) + ')');
      gr.addColorStop(0.5, 'rgba(' + col + ',0.05)');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    // dust lanes
    g.globalCompositeOperation = 'source-over';
    for (var k = 0; k < 5; k++) {
      var y0 = r() * H;
      g.strokeStyle = 'rgba(5,6,20,0.22)'; g.lineWidth = H * (0.03 + r() * 0.05);
      g.beginPath(); g.moveTo(-10, y0); g.bezierCurveTo(W * 0.3, y0 - H * 0.2 * r(), W * 0.7, y0 + H * 0.2 * r(), W + 10, y0 - H * 0.1); g.stroke();
    }
    return c;
  }

  function drawSky(ctx, W, H, st, t, opts) {
    var bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
    bg.addColorStop(0, '#060a22'); bg.addColorStop(0.55, '#0b0f33'); bg.addColorStop(1, '#170c33');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    var px = opts.px || 0, py = opts.py || 0, scroll = opts.scroll || 0, streak = opts.streak || 0;
    if (st.neb) {
      var nx = (-px * 8 - scroll * 0.05) % W;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(st.neb, nx, -py * 6, W, H);
      if (nx < 0) ctx.drawImage(st.neb, nx + W, -py * 6, W, H);
      ctx.globalAlpha = 1;
    }
    var stars = st.stars;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var depth = 0.2 + s.z;
      var x = s.x * W - px * depth * 18 - scroll * depth;
      x = ((x % W) + W) % W;
      var y = s.y * H - py * depth * 12;
      var tw = opts.still ? 1 : (0.75 + 0.25 * Math.sin(t * (1 + s.z * 2) + s.ph));
      var a = s.a * tw;
      if (streak > 0.05 && s.z > 0.35) {
        ctx.strokeStyle = 'rgba(' + s.c + ',' + (a * 0.8).toFixed(3) + ')';
        ctx.lineWidth = s.r;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + streak * depth * 60, y); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, TAU); ctx.fill();
        if (s.r > 1.5) {
          ctx.fillStyle = 'rgba(' + s.c + ',' + (a * 0.18).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, s.r * 3.2, 0, TAU); ctx.fill();
        }
      }
    }
  }

  /* ------------------------------------------------------------
     Paths (Catmull-Rom through points, sampled)
     ------------------------------------------------------------ */
  function sampleSpline(pts, perSeg) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < perSeg; k++) {
        var t = k / perSeg, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
          seg: i
        });
      }
    }
    var last = pts[pts.length - 1];
    out.push({ x: last.x, y: last.y, seg: pts.length - 2 });
    return out;
  }

  /* ------------------------------------------------------------
     Scene controller
     ------------------------------------------------------------ */
  var ROUTE = ['earth', 'moon', 'mars', 'jupiter', 'saturn', 'neptune'];
  var ROUTE_SIZE = { earth: 0.55, moon: 0.48, mars: 0.55, jupiter: 1.0, saturn: 0.78, neptune: 0.7 };

  function scene(canvas, opts) {
    var ctx = canvas.getContext('2d');
    var o = {
      mode: 'map', color: '#7C3AED', current: 0, progress: 0, planet: 'moon', from: 'earth',
      beacons: [], rocketAt: 0, boss: false, hp: 1, stars: 0, onLayout: null
    };
    for (var k in opts) o[k] = opts[k];
    var W = 0, H = 0, R = 1, st = { stars: [], neb: null }, layout = null;
    var raf = 0, alive = true, t0 = performance.now(), last = t0;
    var still = reduceMotion();
    var fx = { boost: 0, wobble: 0, warp: 0, beam: 0, sparks: [], chunks: [] };
    var fly = null; // map: { from, to, start, dur }
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var shownProgress = o.progress;

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      R = dpr();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * R); canvas.height = Math.round(H * R);
      st.stars = makeStars(W, H, o.mode === 'flight' ? 777 : 4242);
      st.neb = makeNebula(W, H, o.mode === 'orbit' ? 131 : 99, o.palette);
      computeLayout();
      return true;
    }

    function computeLayout() {
      layout = { bodies: [], beacons: [] };
      if (o.mode === 'map') {
        var portrait = W < H * 0.95;
        var u = portrait ? Math.min(W / 4.6, H / 12.5) : Math.min(W / 13, H / 4.4);
        var xs, ys;
        if (portrait) { ys = [0.87, 0.73, 0.58, 0.41, 0.24, 0.09]; xs = [0.26, 0.7, 0.3, 0.68, 0.3, 0.7]; }
        else { xs = [0.06, 0.2, 0.36, 0.55, 0.74, 0.92]; ys = [0.66, 0.36, 0.64, 0.4, 0.62, 0.36]; }
        ROUTE.forEach(function(kind, i) {
          layout.bodies.push({ kind: kind, x: xs[i] * W, y: ys[i] * H, r: u * ROUTE_SIZE[kind] });
        });
        layout.path = sampleSpline(layout.bodies, 40);
      } else if (o.mode === 'orbit') {
        var por = W < H * 1.2;
        var pr, cx, cy;
        if (por) { pr = Math.min(W * 0.48, H * 0.52); cx = W * 0.5; cy = H + pr * 0.38; }
        else { pr = Math.min(H * 0.46, W * 0.22); cx = W * 0.2; cy = H * 0.56; }
        if (o.planet === 'saturn') { pr *= 0.6; if (por) cy = H + pr * 0.1; else cx = W * 0.19; }
        layout.planet = { x: cx, y: cy, r: pr };
        var n = o.beacons.length || 5, pts = [];
        for (var i = 0; i < n; i++) {
          var f = n === 1 ? 0.5 : i / (n - 1);
          if (por) {
            pts.push({ x: W * (0.12 + 0.76 * f), y: H * (0.5 - Math.sin(f * Math.PI) * 0.26) - (cy - H) * 0.05 });
          } else {
            var a = -1.0 + f * 1.55;
            pts.push({ x: W * (0.42 + f * 0.5), y: H * (0.68 - Math.sin(f * Math.PI * 0.9) * 0.4) + (f > 0.8 ? -H * 0.02 : 0) });
          }
        }
        layout.beacons = pts;
        layout.path = sampleSpline(pts, 30);
      }
      if (o.onLayout) { try { o.onLayout(layout, W, H); } catch (e) {} }
    }

    function spark(x, y, n, col) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, v = 40 + Math.random() * 120;
        fx.sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col: col || '255,220,120', r: 1 + Math.random() * 2.2 });
      }
    }

    function frame(now) {
      raf = 0;
      if (!alive) return;
      if (!canvas.isConnected) { destroy(); return; }
      // Hidden screen (display:none): stop; the ResizeObserver restarts us.
      if (!canvas.offsetParent && !canvas.getClientRects().length) return;
      if (!W && !resize()) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var t = (now - t0) / 1000;
      if (still) t = 1.3;
      draw(t, dt);
      if (!still && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function draw(t, dt) {
      ctx.setTransform(R, 0, 0, R, 0, 0);
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      fx.boost = Math.max(0, fx.boost - dt * 1.2);
      fx.wobble = Math.max(0, fx.wobble - dt * 1.8);
      fx.warp = Math.max(0, fx.warp - dt * 0.8);
      fx.beam = Math.max(0, fx.beam - dt * 2.5);
      shownProgress += (o.progress - shownProgress) * Math.min(1, dt * 2.5);
      if (still) shownProgress = o.progress;

      var flightScroll = 0;
      if (o.mode === 'flight') flightScroll = t * (30 + fx.boost * 180 + fx.warp * 260);
      drawSky(ctx, W, H, st, t, { px: pointer.x, py: pointer.y, scroll: flightScroll, streak: o.mode === 'flight' ? (fx.warp * 1.2 + fx.boost * 0.4) : 0, still: still });

      if (o.mode === 'map') drawMap(t, dt);
      else if (o.mode === 'orbit') drawOrbit(t);
      else if (o.mode === 'flight') drawFlight(t);
      else drawArrive(t);

      // sparks
      for (var i = fx.sparks.length - 1; i >= 0; i--) {
        var s = fx.sparks[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.97; s.vy *= 0.97; s.life -= dt * 1.4;
        if (s.life <= 0) { fx.sparks.splice(i, 1); continue; }
        ctx.fillStyle = 'rgba(' + s.col + ',' + s.life.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.5 + s.life), 0, TAU); ctx.fill();
      }
      for (var j = fx.chunks.length - 1; j >= 0; j--) {
        var c = fx.chunks[j];
        c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; c.life -= dt * 0.7;
        if (c.life <= 0) { fx.chunks.splice(j, 1); continue; }
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = Math.min(1, c.life * 2);
        ctx.fillStyle = '#6b5d50';
        ctx.beginPath(); ctx.moveTo(-c.s, -c.s * 0.6); ctx.lineTo(c.s * 0.8, -c.s); ctx.lineTo(c.s, c.s * 0.7); ctx.lineTo(-c.s * 0.6, c.s); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    function rocketOnPath(path, f) {
      var idx = Math.max(0, Math.min(path.length - 1, f * (path.length - 1)));
      var i0 = Math.floor(idx), i1 = Math.min(path.length - 1, i0 + 1), k = idx - i0;
      var p = { x: path[i0].x + (path[i1].x - path[i0].x) * k, y: path[i0].y + (path[i1].y - path[i0].y) * k };
      var a = path[Math.min(path.length - 1, i0 + 2)], b = path[Math.max(0, i0 - 1)];
      p.a = Math.atan2(a.y - b.y, a.x - b.x);
      return p;
    }

    function drawRoute(path, doneUntil, gold) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.setLineDash([2, 9]);
      ctx.strokeStyle = 'rgba(190,200,255,0.45)'; ctx.lineWidth = 2.2;
      ctx.beginPath(); path.forEach(function(p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.stroke();
      ctx.setLineDash([]);
      if (doneUntil > 0) {
        var n = Math.round(doneUntil * (path.length - 1));
        ctx.strokeStyle = gold || 'rgba(255,205,90,0.9)'; ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255,190,60,0.8)'; ctx.shadowBlur = 8;
        ctx.beginPath(); for (var i = 0; i <= n; i++) { if (i) ctx.lineTo(path[i].x, path[i].y); else ctx.moveTo(path[i].x, path[i].y); } ctx.stroke();
      }
      ctx.restore();
    }

    function drawMap(t, dt) {
      var L = layout; if (!L) return;
      var segs = L.bodies.length - 1;
      drawRoute(L.path, o.current / segs);
      L.bodies.forEach(function(b, i) {
        if (i === o.highlight) {
          var pg = ctx.createRadialGradient(b.x, b.y, b.r, b.x, b.y, b.r * 2.1);
          pg.addColorStop(0, 'rgba(255,215,120,' + (0.28 + 0.12 * Math.sin(t * 2.4)).toFixed(3) + ')'); pg.addColorStop(1, 'rgba(255,215,120,0)');
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.1, 0, TAU); ctx.fill();
        }
        drawPlanet(ctx, b.kind, b.x, b.y, b.r);
      });
      // rocket: flying or parked in orbit around the current body
      var size = Math.max(34, Math.min(70, (L.bodies[1].r) * 1.5));
      var pos;
      if (fly) {
        var f = Math.min(1, (performance.now() - fly.start) / fly.dur);
        if (still) f = 1;
        var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        var g = (fly.from + (fly.to - fly.from) * e) / segs;
        pos = rocketOnPath(L.path, g);
        if (fly.to < fly.from) pos.a += Math.PI;
        drawRocket(ctx, pos.x, pos.y, size, pos.a, { color: o.color, flame: 1.1, t: t });
        if (f >= 1) fly = null;
      } else {
        var b = L.bodies[o.current] || L.bodies[0];
        var oa = t * 0.55, orr = b.r + size * 0.55;
        pos = { x: b.x + Math.cos(oa) * orr, y: b.y + Math.sin(oa) * orr * 0.55 };
        var ang = Math.atan2(Math.cos(oa) * 0.55, -Math.sin(oa));
        var behind = Math.sin(oa) < 0 && b.kind !== 'earth';
        if (behind) { ctx.globalAlpha = 0.95; }
        drawRocket(ctx, pos.x, pos.y, size * 0.8, ang, { color: o.color, flame: 0.35, t: t });
        ctx.globalAlpha = 1;
      }
    }

    function drawOrbit(t) {
      var L = layout; if (!L) return;
      var P = L.planet;
      drawPlanet(ctx, o.planet, P.x, P.y, P.r);
      var bs = o.beacons, pts = L.beacons;
      var doneF = 0;
      for (var i = 0; i < bs.length; i++) if (bs[i].stars >= 2) doneF = (i + 1) / Math.max(1, bs.length - 1);
      drawRoute(L.path, Math.min(1, Math.max(0, (o.rocketAt) / Math.max(1, bs.length - 1))));
      pts.forEach(function(p, i) {
        var b = bs[i] || {};
        var rr = Math.max(16, Math.min(28, W * 0.04));
        if (b.boss) {
          drawAsteroid(ctx, p.x, p.y, rr * 1.15, b.stars >= 2 ? 0.2 : 1, t * 0.6);
          if (!b.locked) {
            ctx.strokeStyle = 'rgba(255,120,80,' + (0.45 + 0.25 * Math.sin(t * 3)).toFixed(3) + ')';
            ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, rr * 1.55, 0, TAU); ctx.stroke();
          }
          return;
        }
        var col = b.locked ? '150,155,180' : (b.stars >= 2 ? '255,200,80' : '90,220,255');
        var pulse = b.locked ? 0 : 0.5 + 0.5 * Math.sin(t * 2.6 + i);
        var gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 2);
        gg.addColorStop(0, 'rgba(' + col + ',' + (0.35 + pulse * 0.25).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, rr * 2, 0, TAU); ctx.fill();
        // beacon: metal ring with lit core
        var mg = ctx.createLinearGradient(p.x - rr, p.y - rr, p.x + rr, p.y + rr);
        mg.addColorStop(0, '#e8ecf5'); mg.addColorStop(1, '#5b6478');
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, TAU); ctx.fill();
        var cg = ctx.createRadialGradient(p.x - rr * 0.2, p.y - rr * 0.2, 1, p.x, p.y, rr * 0.75);
        cg.addColorStop(0, 'rgba(255,255,255,0.95)'); cg.addColorStop(0.4, 'rgba(' + col + ',1)'); cg.addColorStop(1, 'rgba(' + col + ',0.35)');
        ctx.fillStyle = b.locked ? '#2a2f45' : cg;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr * 0.72, 0, TAU); ctx.fill();
      });
      var rp = rocketOnPath(L.path, Math.min(1, o.rocketAt / Math.max(1, bs.length - 1)));
      var bob = still ? 0 : Math.sin(t * 2) * 4;
      drawRocket(ctx, rp.x, rp.y - Math.max(30, W * 0.05) + bob, Math.max(44, Math.min(78, W * 0.09)), -0.25, { color: o.color, flame: 0.5, t: t });
    }

    function drawFlight(t) {
      var p = shownProgress;
      var mob = H < 150;
      // origin world sinks away to the left
      var oR = H * 0.55;
      drawPlanet(ctx, o.from, -oR * 0.35 - p * W * 0.12, H * 0.82, oR);
      // destination grows on the right
      var dR = H * (0.14 + 0.36 * p);
      var dx = W * (0.98 - 0.14 * p) + dR * 0.2, dy = H * 0.42;
      drawPlanet(ctx, o.planet, dx, dy, dR);
      var rx = W * (0.24 + p * 0.2), ry = H * 0.52;
      var bob = still ? 0 : Math.sin(t * 2.2) * H * 0.03;
      var wob = Math.sin(t * 40) * fx.wobble * 0.18;
      var size = Math.max(54, Math.min(120, H * 0.62));
      if (o.boss && o.hp > 0) {
        var ax = W * 0.66, ay = H * 0.5, aR = H * 0.3;
        if (fx.beam > 0) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          var bg = ctx.createLinearGradient(rx, ry, ax, ay);
          bg.addColorStop(0, 'rgba(120,240,255,' + fx.beam.toFixed(3) + ')'); bg.addColorStop(1, 'rgba(255,255,255,' + (fx.beam * 0.6).toFixed(3) + ')');
          ctx.strokeStyle = bg; ctx.lineWidth = 3 + fx.beam * 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(rx + size * 0.6, ry + bob); ctx.lineTo(ax - aR * 0.7, ay); ctx.stroke();
          ctx.restore();
        }
        drawAsteroid(ctx, ax, ay, aR, o.hp, t);
        // shield bar
        var bw = Math.min(160, W * 0.3), bx = ax - bw / 2, by = ay - aR - 16;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, bx - 2, by - 2, bw + 4, 10, 5); ctx.fill();
        ctx.fillStyle = '#f97316'; roundRect(ctx, bx, by, bw * o.hp, 6, 3); ctx.fill();
      }
      drawRocket(ctx, rx, ry + bob, size, wob, { color: o.color, flame: 0.7 + fx.boost * 1.2 + fx.warp, t: t });
      if (mob) {}
    }

    function drawArrive(t) {
      var pr = Math.min(H * 0.36, W * 0.22);
      var cx = W * 0.5, cy = H * 0.5;
      drawPlanet(ctx, o.planet, cx, cy, pr);
      var oa = still ? 2.4 : t * 0.7;
      var orr = pr * 1.5;
      var x = cx + Math.cos(oa) * orr, y = cy + Math.sin(oa) * orr * 0.42;
      var ang = Math.atan2(Math.cos(oa) * 0.42, -Math.sin(oa));
      drawRocket(ctx, x, y, Math.max(40, pr * 0.7), ang, { color: o.color, flame: 0.5, t: t });
      if (o.stars >= 3 && !still && Math.random() < 0.25) spark(Math.random() * W, Math.random() * H * 0.6, 3, ['255,215,90', '120,230,255', '255,140,200'][Math.floor(Math.random() * 3)]);
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(function() { if (resize()) kick(); });
      ro.observe(canvas);
    }
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5);
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5);
      kick();
    }
    if (!still) canvas.addEventListener('pointermove', onMove);
    function onVis() { if (!document.hidden) kick(); }
    document.addEventListener('visibilitychange', onVis);

    function kick() {
      if (!alive) return;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function set(patch) {
      var relayout = false;
      for (var k in patch) {
        if (k === 'beacons' || k === 'mode') relayout = true;
        o[k] = patch[k];
      }
      if (relayout && W) computeLayout();
      kick();
    }
    function pulse(kind, n) {
      if (!W) return;
      var rx = W * (0.24 + shownProgress * 0.2), ry = H * 0.52;
      if (kind === 'correct') { fx.boost = 1; spark(rx, ry, 16); if (o.boss) { fx.beam = 1; spawnChunks(); } }
      else if (kind === 'wrong') { fx.wobble = 1; }
      else if (kind === 'combo') { fx.warp = 1.2; spark(rx, ry, 30, '140,230,255'); }
      kick();
    }
    function spawnChunks() {
      var ax = W * 0.66, ay = H * 0.5;
      for (var i = 0; i < 5; i++) fx.chunks.push({ x: ax, y: ay, vx: 40 + Math.random() * 120, vy: (Math.random() - 0.5) * 140, rot: 0, vr: (Math.random() - 0.5) * 6, s: 3 + Math.random() * 5, life: 1 });
    }
    function flyTo(from, to) {
      fly = { from: from, to: to, start: performance.now(), dur: 700 };
      o.current = to;
      kick();
    }
    function destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
    }
    requestAnimationFrame(function() { if (resize()) kick(); else kick(); });
    return { set: set, pulse: pulse, flyTo: flyTo, destroy: destroy, layout: function() { return layout; }, size: function() { return { w: W, h: H }; } };
  }

  /* ------------------------------------------------------------
     Thumbnails + icons
     ------------------------------------------------------------ */
  function thumb(canvas, kind) {
    var r = canvas.getBoundingClientRect();
    var w = r.width || canvas.width, h = r.height || canvas.height, d = dpr();
    canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
    var c = canvas.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    var rad = BODIES[kind] && BODIES[kind].rings ? Math.min(w, h) * 0.26 : Math.min(w, h) * 0.4;
    drawPlanet(c, kind, w / 2, h / 2, rad, { ratio: d });
  }

  function drawRocketTo(canvas, color) {
    var r = canvas.getBoundingClientRect(), d = dpr();
    var w = r.width || 80, h = r.height || 80;
    canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
    var c = canvas.getContext('2d');
    c.setTransform(d, 0, 0, d, 0, 0);
    drawRocket(c, w * 0.55, h * 0.55, Math.min(w, h) * 0.75, -Math.PI / 4, { color: color, flame: 0.8, t: 0.4 });
  }

  var ICONS = {
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="mgIcStar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></linearGradient></defs><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 16.9 6.3 20l1.2-6.3L2.8 9.3l6.4-.8z" fill="url(#mgIcStar)" stroke="#92400E" stroke-width="1" stroke-linejoin="round"/></svg>',
    starEmpty: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 16.9 6.3 20l1.2-6.3L2.8 9.3l6.4-.8z" fill="#E5E3EE" stroke="#B9B5CC" stroke-width="1" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#8B8AA0"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#8B8AA0" stroke-width="2.4"/><circle cx="12" cy="15.5" r="1.6" fill="#fff"/></svg>',
    hint: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="#FBBF24" stroke="#B45309" stroke-width="1.2"/><rect x="9.4" y="17" width="5.2" height="2.2" rx="1" fill="#6B7280"/><rect x="10.2" y="19.6" width="3.6" height="1.6" rx=".8" fill="#6B7280"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sprint: '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="mgIcSp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><circle cx="24" cy="26" r="18" fill="#1E1B4B"/><circle cx="24" cy="26" r="15" fill="none" stroke="#4338CA" stroke-width="3" stroke-dasharray="3 3"/><path d="M27 9L15 28h8l-3 13 13-20h-8z" fill="url(#mgIcSp)" stroke="#92400E" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    words: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c6-2 11-1 16 2v28c-5-3-10-4-16-2z" fill="#EDE9FE" stroke="#6D28D9" stroke-width="2" stroke-linejoin="round"/><path d="M40 10c-6-2-11-1-16 2v28c5-3 10-4 16-2z" fill="#DDD6FE" stroke="#6D28D9" stroke-width="2" stroke-linejoin="round"/><path d="M12 17h8M12 22h8M12 27h6M28 17h8M28 22h8M28 27h5" stroke="#7C3AED" stroke-width="1.8" stroke-linecap="round"/><text x="31" y="38" font-size="9" font-weight="800" fill="#6D28D9" font-family="Nunito, sans-serif">+×</text></svg>',
    duel: '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-35 16 26)"><rect x="12" y="14" width="8" height="22" rx="4" fill="#F1F5F9" stroke="#475569" stroke-width="1.4"/><path d="M12 18q4-10 8 0z" fill="#DC2626"/><circle cx="16" cy="24" r="2.2" fill="#2563EB"/><path d="M12 32l-3 5h3zM20 32l3 5h-3z" fill="#059669"/></g><g transform="rotate(35 32 26)"><rect x="28" y="14" width="8" height="22" rx="4" fill="#F1F5F9" stroke="#475569" stroke-width="1.4"/><path d="M28 18q4-10 8 0z" fill="#DC2626"/><circle cx="32" cy="24" r="2.2" fill="#2563EB"/><path d="M28 32l-3 5h3zM36 32l3 5h-3z" fill="#7C3AED"/></g></svg>',
    log: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="4" fill="#1E3A8A"/><rect x="13" y="9" width="22" height="30" rx="2" fill="#F8FAFC"/><path d="M17 16l2.5 2.5L24 14M17 24l2.5 2.5L24 22M17 32l2.5 2.5L24 30" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 16h5M27 24h5M27 32h5" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="36" r="8" fill="#FBBF24" stroke="#B45309" stroke-width="1.5"/><path d="M36 31.5l1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z" fill="#fff"/></svg>'
  };
  // Each copy gets its own gradient ids: a gradient defined inside a
  // hidden screen would otherwise leave every other copy unpainted.
  var iconN = 0;
  function icon(name) {
    var svg = ICONS[name] || '';
    if (svg.indexOf('id="') < 0) return svg;
    var n = ++iconN;
    return svg.replace(/id="(\w+)"/g, 'id="$1_' + n + '"').replace(/url\(#(\w+)\)/g, 'url(#$1_' + n + ')');
  }

  return {
    scene: scene, thumb: thumb, rocketTo: drawRocketTo, icon: icon,
    drawPlanet: drawPlanet, drawRocket: drawRocket, ROUTE: ROUTE, BODIES: BODIES, safeColor: safeColor
  };
})();
