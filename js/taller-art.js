/* ================================================================
   TALLER DE MÁQUINAS — art (js/taller-art.js)
   Everything is drawn in code: a workshop wall and concrete floor,
   wood with grain, brushed steel, twisted rope, crates, a spring
   scale (dynamometer) that reads the effort, toothed gears in brass
   and steel, and one scene per simple machine.

   Camera: { s: px per metre, ox, oy } — screenX = ox + x*s,
   screenY = oy - y*s (world y points up). Drawing is in CSS px; the
   caller scales the context by devicePixelRatio.
   ================================================================ */

var TallerArt = (function() {
  'use strict';

  var TAU = Math.PI * 2;

  // ---------------------------------------------------------------- helpers
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
  function X(c, x) { return c.ox + x * c.s; }
  function Y(c, y) { return c.oy - y * c.s; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function rgba(h, a) { var A = hexRgb(h); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function shadow(g, blur, oy, a) { g.shadowColor = 'rgba(30,20,10,' + (a == null ? 0.35 : a) + ')'; g.shadowBlur = blur; g.shadowOffsetX = 0; g.shadowOffsetY = oy; }
  function noShadow(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }

  // ---------------------------------------------------------------- backdrop
  // A workshop: pine-board wall with a pegboard of tools, a window glow
  // and a concrete floor. floorY is the screen y of the floor line.
  function backdrop(g, W, H, floorY, seed) {
    var R = rng(seed || 7);
    // wall boards
    var wall = g.createLinearGradient(0, 0, 0, floorY);
    wall.addColorStop(0, '#efe2cb'); wall.addColorStop(1, '#e2cfae');
    g.fillStyle = wall; g.fillRect(0, 0, W, floorY);
    var bw = Math.max(46, W / 16);
    for (var x = -R() * bw; x < W; x += bw) {
      var tone = R();
      g.fillStyle = 'rgba(160,110,60,' + (0.03 + tone * 0.07) + ')';
      g.fillRect(x, 0, bw, floorY);
      g.fillStyle = 'rgba(120,80,40,0.18)'; g.fillRect(x, 0, 1.2, floorY);
      g.strokeStyle = 'rgba(140,95,50,0.10)'; g.lineWidth = 1;
      for (var k = 0; k < 4; k++) {
        var gx = x + 6 + R() * (bw - 12);
        g.beginPath(); g.moveTo(gx, 0);
        g.bezierCurveTo(gx + (R() - 0.5) * 10, floorY * 0.33, gx + (R() - 0.5) * 10, floorY * 0.66, gx + (R() - 0.5) * 6, floorY);
        g.stroke();
      }
      if (R() < 0.35) { // a knot
        var kx = x + bw * (0.3 + R() * 0.4), ky = floorY * (0.1 + R() * 0.8);
        g.fillStyle = 'rgba(120,75,35,0.18)'; g.beginPath(); g.ellipse(kx, ky, 3 + R() * 3, 6 + R() * 5, 0, 0, TAU); g.fill();
      }
    }
    // window light from the top left
    var lg = g.createRadialGradient(W * 0.18, -H * 0.1, 10, W * 0.18, -H * 0.1, Math.max(W, H) * 0.9);
    lg.addColorStop(0, 'rgba(255,250,235,0.55)'); lg.addColorStop(1, 'rgba(255,250,235,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, floorY);
    // skirting board
    g.fillStyle = '#9a6b3c'; g.fillRect(0, floorY - 7, W, 7);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, floorY - 7, W, 1);
    // concrete floor
    var fl = g.createLinearGradient(0, floorY, 0, H);
    fl.addColorStop(0, '#b9b3a8'); fl.addColorStop(1, '#9c958a');
    g.fillStyle = fl; g.fillRect(0, floorY, W, H - floorY);
    for (var i = 0; i < W * (H - floorY) / 260; i++) {
      g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(60,50,40,0.10)';
      g.fillRect(R() * W, floorY + R() * (H - floorY), 1 + R() * 2, 1);
    }
    g.fillStyle = 'rgba(40,30,20,0.18)'; g.fillRect(0, floorY, W, 2);
  }

  // A pegboard with hanging tool silhouettes (decoration).
  function pegboard(g, x, y, w, h) {
    g.save();
    shadow(g, 10, 4, 0.18);
    rr(g, x, y, w, h, 6); g.fillStyle = '#c8a27a'; g.fill();
    noShadow(g);
    g.fillStyle = 'rgba(70,45,25,0.35)';
    for (var px = x + 10; px < x + w - 4; px += 14) for (var py = y + 10; py < y + h - 4; py += 14) { g.beginPath(); g.arc(px, py, 1.4, 0, TAU); g.fill(); }
    // wrench
    g.strokeStyle = '#6b7280'; g.lineCap = 'round'; g.lineWidth = Math.max(3, w * 0.035);
    g.beginPath(); g.moveTo(x + w * 0.16, y + h * 0.2); g.lineTo(x + w * 0.16, y + h * 0.78); g.stroke();
    g.lineWidth = Math.max(2, w * 0.02);
    g.beginPath(); g.arc(x + w * 0.16, y + h * 0.17, w * 0.045, 0.6, TAU - 0.6 + Math.PI, false); g.stroke();
    // hammer
    g.strokeStyle = '#8b5a2b'; g.lineWidth = Math.max(3, w * 0.03);
    g.beginPath(); g.moveTo(x + w * 0.4, y + h * 0.3); g.lineTo(x + w * 0.4, y + h * 0.82); g.stroke();
    g.fillStyle = '#4b5563'; rr(g, x + w * 0.33, y + h * 0.18, w * 0.14, h * 0.12, 2); g.fill();
    // saw
    g.fillStyle = '#9ca3af';
    g.beginPath(); g.moveTo(x + w * 0.6, y + h * 0.2); g.lineTo(x + w * 0.88, y + h * 0.24); g.lineTo(x + w * 0.88, y + h * 0.36); g.lineTo(x + w * 0.6, y + h * 0.5); g.closePath(); g.fill();
    g.fillStyle = '#b45309'; rr(g, x + w * 0.52, y + h * 0.18, w * 0.1, h * 0.34, 4); g.fill();
    // coil of rope
    g.strokeStyle = '#c9a56b'; g.lineWidth = Math.max(2, w * 0.02);
    for (var r = 0; r < 3; r++) { g.beginPath(); g.ellipse(x + w * 0.74, y + h * 0.7, w * (0.09 - r * 0.012), h * (0.12 - r * 0.015), 0, 0, TAU); g.stroke(); }
    g.restore();
  }

  // ---------------------------------------------------------------- materials
  // Wood beam from (x1,y1) to (x2,y2) in screen px, thickness th.
  function woodBeam(g, x1, y1, x2, y2, th, seed, tone) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    var R = rng(seed || 3);
    var base = tone || '#c58b4c';
    g.save();
    g.translate(x1, y1); g.rotate(a);
    shadow(g, 8, 4, 0.3);
    var gr = g.createLinearGradient(0, -th / 2, 0, th / 2);
    gr.addColorStop(0, mix(base, '#ffffff', 0.25)); gr.addColorStop(0.45, base); gr.addColorStop(1, mix(base, '#3b2410', 0.35));
    rr(g, 0, -th / 2, L, th, Math.min(3, th / 3)); g.fillStyle = gr; g.fill();
    noShadow(g);
    g.save(); rr(g, 0, -th / 2, L, th, Math.min(3, th / 3)); g.clip();
    g.strokeStyle = rgba('#5a3414', 0.22); g.lineWidth = 0.8;
    var lines = Math.max(2, Math.round(th / 3.2));
    for (var i = 0; i < lines; i++) {
      var yy = -th / 2 + (i + 0.5) * th / lines + (R() - 0.5) * 1.5;
      g.beginPath(); g.moveTo(0, yy);
      for (var s = 0; s <= L; s += 18) g.lineTo(s, yy + Math.sin(s * 0.03 + i * 1.7 + R()) * 0.9);
      g.stroke();
    }
    if (L > 60) { // knots
      for (var k = 0; k < Math.floor(L / 120) + 1; k++) {
        var kx = 20 + R() * (L - 40);
        g.fillStyle = rgba('#5a3414', 0.28); g.beginPath(); g.ellipse(kx, (R() - 0.5) * th * 0.4, Math.max(2, th * 0.22), Math.max(1.2, th * 0.14), 0, 0, TAU); g.fill();
      }
    }
    g.restore();
    g.strokeStyle = rgba('#3b2410', 0.45); g.lineWidth = 1;
    rr(g, 0.5, -th / 2 + 0.5, L - 1, th - 1, Math.min(3, th / 3)); g.stroke();
    g.restore();
  }

  // Brushed steel bar (or rod) along a line.
  function steelBar(g, x1, y1, x2, y2, th, tone) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    var base = tone || '#8b95a3';
    g.save(); g.translate(x1, y1); g.rotate(a);
    shadow(g, 6, 3, 0.3);
    var gr = g.createLinearGradient(0, -th / 2, 0, th / 2);
    gr.addColorStop(0, mix(base, '#ffffff', 0.55)); gr.addColorStop(0.35, mix(base, '#ffffff', 0.15)); gr.addColorStop(0.6, base); gr.addColorStop(1, mix(base, '#111827', 0.5));
    rr(g, 0, -th / 2, L, th, th / 2); g.fillStyle = gr; g.fill();
    noShadow(g);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.6;
    for (var s = 6; s < L - 4; s += 9) { g.beginPath(); g.moveTo(s, -th * 0.28); g.lineTo(s + 5, -th * 0.28); g.stroke(); }
    g.restore();
  }

  // Twisted rope along a polyline of screen points.
  function rope(g, pts, w) {
    if (pts.length < 2) return;
    var lw = w || 3;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.strokeStyle = '#8a6a3c'; g.lineWidth = lw + 1.2; g.stroke();
    g.strokeStyle = '#d8b878'; g.lineWidth = lw; g.stroke();
    // twist marks
    g.strokeStyle = 'rgba(110,80,40,0.55)'; g.lineWidth = Math.max(0.8, lw * 0.35);
    for (var j = 1; j < pts.length; j++) {
      var ax = pts[j - 1][0], ay = pts[j - 1][1], bx = pts[j][0], by = pts[j][1];
      var dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy);
      if (L < 1) continue;
      var ux = dx / L, uy = dy / L, nx = -uy, ny = ux, step = lw * 1.4;
      for (var s = step / 2; s < L; s += step) {
        var cx = ax + ux * s, cy = ay + uy * s;
        g.beginPath();
        g.moveTo(cx - ux * lw * 0.4 + nx * lw * 0.45, cy - uy * lw * 0.4 + ny * lw * 0.45);
        g.lineTo(cx + ux * lw * 0.4 - nx * lw * 0.45, cy + uy * lw * 0.4 - ny * lw * 0.45);
        g.stroke();
      }
    }
    g.restore();
  }

  // Wooden crate, bottom-centre at (x,y) screen, size s px.
  function crate(g, x, y, s, label, seed) {
    var R = rng(seed || 11);
    g.save();
    shadow(g, 10, 5, 0.3);
    g.fillStyle = '#b77b3e'; g.fillRect(x - s / 2, y - s, s, s);
    noShadow(g);
    var slats = 4, sh = s / slats;
    for (var i = 0; i < slats; i++) {
      var gr = g.createLinearGradient(0, y - s + i * sh, 0, y - s + (i + 1) * sh);
      var tone = mix('#c98d4e', '#a8692f', R() * 0.6);
      gr.addColorStop(0, mix(tone, '#ffffff', 0.15)); gr.addColorStop(1, tone);
      g.fillStyle = gr; g.fillRect(x - s / 2, y - s + i * sh + 0.6, s, sh - 1.2);
      g.strokeStyle = 'rgba(90,52,20,0.22)'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(x - s / 2, y - s + i * sh + sh * 0.5); g.bezierCurveTo(x - s / 6, y - s + i * sh + sh * 0.4, x + s / 6, y - s + i * sh + sh * 0.65, x + s / 2, y - s + i * sh + sh * 0.5); g.stroke();
    }
    // frame and brace
    var f = Math.max(3, s * 0.1);
    g.fillStyle = '#8a5526';
    g.fillRect(x - s / 2, y - s, f, s); g.fillRect(x + s / 2 - f, y - s, f, s);
    g.fillRect(x - s / 2, y - s, s, f); g.fillRect(x - s / 2, y - f, s, f);
    g.save(); g.beginPath(); g.rect(x - s / 2 + f, y - s + f, s - 2 * f, s - 2 * f); g.clip();
    g.strokeStyle = '#8a5526'; g.lineWidth = f * 0.9;
    g.beginPath(); g.moveTo(x - s / 2, y); g.lineTo(x + s / 2, y - s); g.stroke(); g.restore();
    // nails
    g.fillStyle = '#4b5563';
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(c) { g.beginPath(); g.arc(x + c[0] * (s / 2 - f / 2), y - s / 2 + c[1] * (s / 2 - f / 2), Math.max(1, f * 0.18), 0, TAU); g.fill(); });
    if (label) {
      g.font = '800 ' + Math.max(10, Math.round(s * 0.2)) + 'px Nunito, system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      var tw = g.measureText(label).width + 10, th = Math.max(14, s * 0.26);
      rr(g, x - tw / 2, y - s / 2 - th / 2, tw, th, 4); g.fillStyle = 'rgba(255,248,230,0.92)'; g.fill();
      g.fillStyle = '#3b2410'; g.fillText(label, x, y - s / 2 + 0.5);
    }
    g.restore();
  }

  // Iron weight / boulder etc.
  function boulder(g, x, y, s, seed) {
    var R = rng(seed || 5), n = 11, pts = [];
    for (var i = 0; i < n; i++) { var a = Math.PI + i / (n - 1) * Math.PI, r = s * (0.45 + R() * 0.1); pts.push([x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.6 * (a > Math.PI * 1.02 && a < Math.PI * 1.98 ? 1 : 0.2)]); }
    g.save(); shadow(g, 10, 4, 0.35);
    g.beginPath(); g.moveTo(x - s * 0.55, y);
    pts.forEach(function(p) { g.lineTo(p[0], Math.min(y, p[1])); });
    g.lineTo(x + s * 0.55, y); g.closePath();
    var gr = g.createRadialGradient(x - s * 0.2, y - s * 0.6, s * 0.05, x, y - s * 0.3, s * 0.8);
    gr.addColorStop(0, '#a8a29e'); gr.addColorStop(0.6, '#78716c'); gr.addColorStop(1, '#44403c');
    g.fillStyle = gr; g.fill(); noShadow(g);
    g.strokeStyle = 'rgba(30,27,24,0.35)'; g.lineWidth = 1;
    for (var c = 0; c < 4; c++) { g.beginPath(); var cx = x + (R() - 0.5) * s * 0.6, cy = y - s * (0.2 + R() * 0.45); g.moveTo(cx, cy); g.lineTo(cx + (R() - 0.5) * s * 0.3, cy + R() * s * 0.15); g.stroke(); }
    g.restore();
  }

  // Spring scale (dynamometer): hangs from (x,y) and is pulled along
  // (ux,uy) (unit vector). `ext` 0..1 stretches it; reading in kg.
  function springScale(g, x, y, ux, uy, len, reading, max, strained) {
    var a = Math.atan2(uy, ux) - Math.PI / 2;
    g.save(); g.translate(x, y); g.rotate(a);
    var w = Math.max(14, len * 0.2), body = len * 0.62;
    // top hook
    g.strokeStyle = '#4b5563'; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 6, 5, Math.PI * 1.1, Math.PI * 2.4); g.stroke();
    g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 16); g.stroke();
    // tube
    shadow(g, 6, 3, 0.3);
    var gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
    gr.addColorStop(0, '#9a7b2c'); gr.addColorStop(0.35, '#f3d27a'); gr.addColorStop(0.6, '#d4a843'); gr.addColorStop(1, '#7c5e1c');
    rr(g, -w / 2, 16, w, body, w / 2.4); g.fillStyle = gr; g.fill(); noShadow(g);
    // scale window
    rr(g, -w * 0.28, 22, w * 0.56, body - 12, 3); g.fillStyle = '#fffaf0'; g.fill();
    var frac = clamp(reading / (max || 30), 0, 1);
    g.strokeStyle = '#6b5a35'; g.lineWidth = 0.8;
    for (var t = 0; t <= 10; t++) { var ty = 24 + (body - 16) * t / 10; g.beginPath(); g.moveTo(-w * 0.24, ty); g.lineTo(t % 5 === 0 ? w * 0.12 : -w * 0.04, ty); g.stroke(); }
    var ny = 24 + (body - 16) * frac;
    g.fillStyle = strained ? '#dc2626' : '#b91c1c'; g.fillRect(-w * 0.28, ny - 1.4, w * 0.56, 2.8);
    // inner rod and bottom hook
    var rod = 16 + body + 2 + len * 0.18 * frac;
    g.strokeStyle = '#9ca3af'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 16 + body - 2); g.lineTo(0, rod); g.stroke();
    g.strokeStyle = '#4b5563'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(0, rod); g.lineTo(0, rod + 4); g.arc(-4, rod + 8, 4, 0, Math.PI * 0.95); g.stroke();
    g.restore();
    // label (unrotated)
    return { tipX: x + ux * (len * 0.82 + len * 0.18 * frac + 12), tipY: y + uy * (len * 0.82 + len * 0.18 * frac + 12) };
  }

  // A cartoon-real gloved hand gripping at (x,y), pulling along angle a.
  function hand(g, x, y, a, s, strain) {
    g.save(); g.translate(x, y); g.rotate(a);
    var k = s || 22;
    shadow(g, 6, 3, 0.25);
    var gr = g.createLinearGradient(-k * 0.5, 0, k * 0.6, 0);
    gr.addColorStop(0, '#f59e0b'); gr.addColorStop(1, '#b45309');
    g.fillStyle = gr;
    rr(g, -k * 0.45, -k * 0.1, k * 0.9, k * 0.75, k * 0.25); g.fill();
    noShadow(g);
    g.strokeStyle = 'rgba(80,40,0,0.45)'; g.lineWidth = 1;
    for (var i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-k * 0.45 + i * k * 0.225, -k * 0.08); g.lineTo(-k * 0.45 + i * k * 0.225, k * 0.25); g.stroke(); }
    g.fillStyle = '#1d4ed8'; rr(g, -k * 0.42, k * 0.58, k * 0.84, k * 0.5, 3); g.fill(); // sleeve cuff
    g.restore();
    if (strain) {
      g.save(); g.strokeStyle = 'rgba(220,38,38,0.8)'; g.lineWidth = 2;
      for (var j = 0; j < 3; j++) { var an = -0.8 + j * 0.8; g.beginPath(); g.moveTo(x + Math.cos(an) * k * 0.9, y - k * 0.7 + Math.sin(an) * 4); g.lineTo(x + Math.cos(an) * k * 1.25, y - k * 0.95 + Math.sin(an) * 6); g.stroke(); }
      g.restore();
    }
  }

  function arrow(g, x1, y1, x2, y2, col, w) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 4) return;
    var ux = dx / L, uy = dy / L, hw = (w || 4) * 2.2;
    g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w || 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - ux * hw, y2 - uy * hw); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * hw * 1.6 - uy * hw, y2 - uy * hw * 1.6 + ux * hw); g.lineTo(x2 - ux * hw * 1.6 + uy * hw, y2 - uy * hw * 1.6 - ux * hw); g.closePath(); g.fill();
    g.restore();
  }

  // Labels are skipped while api.quiet is set (small thumbnails).
  function tag(g, x, y, text, bg, fg, size) {
    if (api.quiet || !text) return;
    g.save();
    g.font = '800 ' + (size || 12) + 'px Nunito, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    var tw = g.measureText(text).width + 12, th = (size || 12) + 9;
    shadow(g, 6, 2, 0.2);
    rr(g, x - tw / 2, y - th / 2, tw, th, th / 2); g.fillStyle = bg || 'rgba(255,255,255,0.94)'; g.fill();
    noShadow(g);
    g.fillStyle = fg || '#1f2937'; g.fillText(text, x, y + 0.5);
    g.restore();
  }

  // Distance bracket with a label, between two screen points.
  function dimension(g, x1, y1, x2, y2, label, col, off) {
    if (api.quiet) return;
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 6) return;
    var nx = -dy / L * (off || 14), ny = dx / L * (off || 14);
    g.save(); g.strokeStyle = col; g.lineWidth = 1.5; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + nx, y1 + ny); g.moveTo(x2, y2); g.lineTo(x2 + nx, y2 + ny); g.stroke();
    g.setLineDash([]); g.lineWidth = 2;
    g.beginPath(); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x2 + nx, y2 + ny); g.stroke();
    g.restore();
    if (label) tag(g, (x1 + x2) / 2 + nx * 1.6, (y1 + y2) / 2 + ny * 1.6, label, '#fff', col, 11);
  }

  // ---------------------------------------------------------------- pulleys
  function sheave(g, x, y, r, rot) {
    g.save(); g.translate(x, y);
    shadow(g, 6, 3, 0.3);
    var gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    gr.addColorStop(0, '#e5e7eb'); gr.addColorStop(0.7, '#9ca3af'); gr.addColorStop(1, '#4b5563');
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = gr; g.fill(); noShadow(g);
    g.beginPath(); g.arc(0, 0, r * 0.78, 0, TAU); g.strokeStyle = 'rgba(31,41,55,0.5)'; g.lineWidth = 1.5; g.stroke();
    g.rotate(rot || 0);
    g.strokeStyle = 'rgba(55,65,81,0.6)'; g.lineWidth = Math.max(1.5, r * 0.12);
    for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(i * Math.PI / 2) * r * 0.7, Math.sin(i * Math.PI / 2) * r * 0.7); g.stroke(); }
    g.beginPath(); g.arc(0, 0, r * 0.2, 0, TAU); g.fillStyle = '#374151'; g.fill();
    g.beginPath(); g.arc(-r * 0.05, -r * 0.05, r * 0.08, 0, TAU); g.fillStyle = '#d1d5db'; g.fill();
    g.restore();
  }
  function block(g, x, y, w, h) { // the cheek plates of a pulley block
    g.save(); shadow(g, 5, 2, 0.25);
    var gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#6b7280'); gr.addColorStop(0.5, '#cbd5e1'); gr.addColorStop(1, '#6b7280');
    rr(g, x - w / 2, y - h / 2, w, h, Math.min(8, h / 2)); g.fillStyle = gr; g.fill(); noShadow(g);
    g.restore();
  }
  function hook(g, x, y, s) {
    g.save(); g.strokeStyle = '#374151'; g.lineWidth = Math.max(2.5, s * 0.18); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s * 0.5); g.arc(x - s * 0.3, y + s * 0.5, s * 0.3, 0, Math.PI * 0.9); g.stroke(); g.restore();
  }

  // ---------------------------------------------------------------- gears
  // A gear sprite: drawn once to an offscreen canvas, then rotated.
  var _gearCache = {};
  function gearSprite(teeth, rpx, metal, dpr) {
    var key = teeth + '|' + Math.round(rpx) + '|' + metal + '|' + dpr;
    if (_gearCache[key]) return _gearCache[key];
    var m = rpx * 2 / teeth, ra = rpx + m, size = Math.ceil((ra + 6) * 2);
    var cv = document.createElement('canvas');
    cv.width = Math.ceil(size * dpr); cv.height = Math.ceil(size * dpr);
    var g = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(cv) : cv.getContext('2d');
    if (!g) return null;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGear(g, size / 2, size / 2, teeth, rpx, 0, metal);
    var spr = { cv: cv, size: size };
    _gearCache[key] = spr;
    return spr;
  }
  function clearGearCache() {
    for (var k in _gearCache) { if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(_gearCache[k].cv); }
    _gearCache = {};
  }
  if (typeof ZsCanvas !== 'undefined') ZsCanvas.onPressure(clearGearCache);

  function gearPath(g, cx, cy, teeth, rpx, ang) {
    var m = rpx * 2 / teeth, ra = rpx + m, rf = rpx - 1.25 * m, P = TAU / teeth;
    g.beginPath();
    for (var k = 0; k < teeth; k++) {
      var a = ang + k * P;
      var a0 = a - 0.5 * P, a1 = a - 0.27 * P, a2 = a - 0.13 * P, a3 = a + 0.13 * P, a4 = a + 0.27 * P;
      if (k === 0) g.moveTo(cx + Math.cos(a0) * rf, cy + Math.sin(a0) * rf);
      g.arc(cx, cy, rf, a0, a1);
      g.lineTo(cx + Math.cos(a2) * ra, cy + Math.sin(a2) * ra);
      g.arc(cx, cy, ra, a2, a3);
      g.lineTo(cx + Math.cos(a4) * rf, cy + Math.sin(a4) * rf);
      g.arc(cx, cy, rf, a4, a + 0.5 * P);
    }
    g.closePath();
  }
  var METALS = {
    brass: ['#fde68a', '#d4a843', '#8a6419'],
    steel: ['#f1f5f9', '#94a3b8', '#475569'],
    copper: ['#fecaca', '#d9774a', '#7c2d12'],
    blue: ['#dbeafe', '#3b82f6', '#1e3a8a']
  };
  function drawGear(g, cx, cy, teeth, rpx, ang, metal) {
    var M = METALS[metal] || METALS.steel;
    var m = rpx * 2 / teeth, rf = rpx - 1.25 * m;
    g.save();
    shadow(g, 8, 4, 0.35);
    gearPath(g, cx, cy, teeth, rpx, ang);
    var gr = g.createRadialGradient(cx - rpx * 0.4, cy - rpx * 0.45, rpx * 0.05, cx, cy, rpx * 1.15);
    gr.addColorStop(0, M[0]); gr.addColorStop(0.55, M[1]); gr.addColorStop(1, M[2]);
    g.fillStyle = gr; g.fill();
    noShadow(g);
    g.strokeStyle = rgba('#111827', 0.35); g.lineWidth = 1; g.stroke();
    // rim recess and spokes (big gears are cut out between spokes)
    var inner = rf - Math.max(3, m * 1.3), hub = Math.max(rpx * 0.22, 6);
    if (teeth >= 20 && inner > hub + 6) {
      var spokes = teeth >= 40 ? 6 : teeth >= 30 ? 5 : 4, sw = Math.max(3, rpx * 0.1);
      g.save();
      g.beginPath(); g.arc(cx, cy, inner, 0, TAU); g.arc(cx, cy, hub + 2, 0, TAU, true); g.clip('evenodd');
      for (var s = 0; s < spokes; s++) {
        var a0 = ang + s * TAU / spokes + sw / inner * 0.9, a1 = ang + (s + 1) * TAU / spokes - sw / inner * 0.9;
        g.beginPath(); g.arc(cx, cy, inner, a0, a1); g.arc(cx, cy, hub + 2, a1 - 0.08, a0 + 0.08, true); g.closePath();
        var hg = g.createRadialGradient(cx, cy, hub, cx, cy, inner);
        hg.addColorStop(0, 'rgba(40,30,20,0.55)'); hg.addColorStop(1, 'rgba(40,30,20,0.38)');
        g.fillStyle = hg; g.fill();
      }
      g.restore();
    } else {
      g.beginPath(); g.arc(cx, cy, Math.max(hub + 2, inner), 0, TAU); g.strokeStyle = rgba(M[2], 0.45); g.lineWidth = 1.2; g.stroke();
    }
    // hub, axle and keyway
    var hg2 = g.createRadialGradient(cx - hub * 0.3, cy - hub * 0.3, 1, cx, cy, hub);
    hg2.addColorStop(0, M[0]); hg2.addColorStop(1, M[2]);
    g.beginPath(); g.arc(cx, cy, hub, 0, TAU); g.fillStyle = hg2; g.fill();
    g.beginPath(); g.arc(cx, cy, hub * 0.45, 0, TAU); g.fillStyle = '#1f2937'; g.fill();
    g.save(); g.translate(cx, cy); g.rotate(ang);
    g.fillStyle = '#1f2937'; g.fillRect(-hub * 0.12, -hub * 0.62, hub * 0.24, hub * 0.25);
    // a painted mark so the turning is easy to follow
    g.fillStyle = '#ef4444'; g.beginPath(); g.arc(0, -(rf - m * 0.9), Math.max(2.5, m * 0.42), 0, TAU); g.fill();
    g.restore();
    g.restore();
  }

  // ---------------------------------------------------------------- bicycle
  function bikeScene(g, W, H, st) {
    // st: { front, rear, crank (rad), wheel (rad), scroll (m), s (px/m) }
    var s = st.s, ground = H * 0.83;
    // sky and road
    var sky = g.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, '#bfdbfe'); sky.addColorStop(1, '#eff6ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, ground);
    // hills (parallax)
    var R = rng(19);
    ['#bbd7a8', '#9cc58a'].forEach(function(col, li) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, ground);
      var off = (st.scroll * s * (0.15 + li * 0.2)) % W;
      for (var x = -W; x <= W * 2; x += 30) g.lineTo(x - off, ground - H * (0.18 + li * 0.05) - Math.sin((x) * 0.006 + li) * H * 0.06 - Math.sin(x * 0.017) * H * 0.02);
      g.lineTo(W * 2, ground); g.closePath(); g.fill();
    });
    // poplars
    for (var i = 0; i < 9; i++) {
      var tx = ((i * 173 + 40 - st.scroll * s * 0.55) % (W + 120) + (W + 120)) % (W + 120) - 60, th = H * (0.18 + (i % 3) * 0.03);
      g.fillStyle = '#7a5230'; g.fillRect(tx - 2, ground - th * 0.25, 4, th * 0.25);
      g.fillStyle = i % 2 ? '#4d7c3a' : '#3f6b31'; g.beginPath(); g.ellipse(tx, ground - th * 0.58, th * 0.13, th * 0.42, 0, 0, TAU); g.fill();
    }
    g.fillStyle = '#6b7280'; g.fillRect(0, ground, W, H - ground);
    g.fillStyle = '#9ca3af'; g.fillRect(0, ground, W, 3);
    g.strokeStyle = '#f8fafc'; g.lineWidth = 3; g.setLineDash([26, 22]); g.lineDashOffset = st.scroll * s;
    g.beginPath(); g.moveTo(0, ground + (H - ground) * 0.55); g.lineTo(W, ground + (H - ground) * 0.55); g.stroke(); g.setLineDash([]);
    // distance posts every metre
    for (var mtr = Math.floor(st.scroll - 6); mtr < st.scroll + W / s; mtr++) {
      var px = W * 0.45 + (mtr - st.scroll) * s;
      if (px < -20 || px > W + 20) continue;
      g.fillStyle = mtr % 5 === 0 ? '#1f2937' : '#94a3b8';
      g.fillRect(px - 1, ground + 2, 2, mtr % 5 === 0 ? 12 : 6);
      if (mtr % 5 === 0) { g.font = '800 10px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText(mtr + ' m', px, ground + 24); }
    }
    // the bike
    var wr = 0.33 * s, cx = W * 0.45, bbx = cx, rearX = cx - 0.42 * s, frontX = cx + 0.62 * s, wy = ground - wr;
    var bby = wy + 0.04 * s;
    function wheel(x, rot) {
      g.save(); g.translate(x, wy);
      g.beginPath(); g.arc(0, 0, wr, 0, TAU); g.strokeStyle = '#111827'; g.lineWidth = Math.max(4, wr * 0.11); g.stroke();
      g.beginPath(); g.arc(0, 0, wr * 0.9, 0, TAU); g.strokeStyle = '#9ca3af'; g.lineWidth = 2; g.stroke();
      g.rotate(rot); g.strokeStyle = 'rgba(203,213,225,0.9)'; g.lineWidth = 0.8;
      for (var k = 0; k < 16; k++) { var a = k * TAU / 16; g.beginPath(); g.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); g.lineTo(Math.cos(a + 0.3) * wr * 0.9, Math.sin(a + 0.3) * wr * 0.9); g.stroke(); }
      g.fillStyle = '#ef4444'; g.beginPath(); g.arc(0, -wr * 0.95, 3, 0, TAU); g.fill();
      g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fillStyle = '#4b5563'; g.fill();
      g.restore();
    }
    wheel(rearX, st.wheel); wheel(frontX, st.wheel);
    // sprockets and chain
    // real sprockets: 12.7 mm (½ inch) chain pitch → radius = teeth × 12.7 mm ÷ 2π;
    // drawn 1.5× so the sizes are easy to compare
    var mod = 0.0127 / Math.PI * 1.5 * s;
    var rF = mod * st.front / 2, rR = mod * st.rear / 2;
    g.strokeStyle = '#374151'; g.lineWidth = 2.4;
    var dx = rearX - bbx, dy = wy - bby, d = Math.sqrt(dx * dx + dy * dy), base = Math.atan2(dy, dx), off = Math.asin((rF - rR) / d);
    var t1 = base + Math.PI / 2 + off, t2 = base - Math.PI / 2 - off;
    g.beginPath();
    g.moveTo(bbx + Math.cos(t1) * rF, bby + Math.sin(t1) * rF); g.lineTo(rearX + Math.cos(t1) * rR, wy + Math.sin(t1) * rR);
    g.moveTo(bbx + Math.cos(t2) * rF, bby + Math.sin(t2) * rF); g.lineTo(rearX + Math.cos(t2) * rR, wy + Math.sin(t2) * rR);
    g.stroke();
    drawGear(g, rearX, wy, st.rear, rR, st.wheel, 'steel');
    // frame
    var seatX = cx - 0.18 * s, seatY = wy - 0.62 * s, headX = cx + 0.5 * s, headY = wy - 0.58 * s;
    g.strokeStyle = '#1d4ed8'; g.lineCap = 'round'; g.lineWidth = Math.max(4, s * 0.035);
    g.beginPath();
    g.moveTo(rearX, wy); g.lineTo(bbx, bby); g.lineTo(seatX, seatY); g.lineTo(rearX, wy);
    g.moveTo(bbx, bby); g.lineTo(headX - 0.02 * s, headY + 0.06 * s); g.moveTo(seatX + 0.02 * s, seatY + 0.05 * s); g.lineTo(headX, headY);
    g.moveTo(headX, headY - 0.05 * s); g.lineTo(frontX, wy);
    g.stroke();
    g.strokeStyle = '#111827'; g.lineWidth = Math.max(3, s * 0.025);
    g.beginPath(); g.moveTo(seatX, seatY); g.lineTo(seatX - 0.03 * s, seatY - 0.12 * s); g.stroke();
    g.fillStyle = '#111827'; rr(g, seatX - 0.14 * s, seatY - 0.16 * s, 0.22 * s, 0.05 * s, 0.02 * s); g.fill();
    g.beginPath(); g.moveTo(headX, headY - 0.05 * s); g.lineTo(headX - 0.02 * s, headY - 0.2 * s); g.lineTo(headX - 0.14 * s, headY - 0.22 * s); g.stroke();
    drawGear(g, bbx, bby, st.front, rF, st.crank, 'steel');
    // crank arms and pedals
    var ca = st.crank, cl = 0.17 * s;
    [0, Math.PI].forEach(function(o, i) {
      var px = bbx + Math.cos(ca + o) * cl, py = bby + Math.sin(ca + o) * cl;
      g.strokeStyle = i ? '#6b7280' : '#cbd5e1'; g.lineWidth = Math.max(4, s * 0.03);
      g.beginPath(); g.moveTo(bbx, bby); g.lineTo(px, py); g.stroke();
      g.fillStyle = '#111827'; rr(g, px - 0.05 * s, py - 0.012 * s, 0.1 * s, 0.024 * s, 2); g.fill();
    });
    return { bbx: bbx, bby: bby, crankR: cl };
  }

  var api = {
    rng: rng, X: X, Y: Y, mix: mix, rgba: rgba, rr: rr, clamp: clamp, shadow: shadow, noShadow: noShadow,
    backdrop: backdrop, pegboard: pegboard, woodBeam: woodBeam, steelBar: steelBar, rope: rope, crate: crate, boulder: boulder,
    springScale: springScale, hand: hand, arrow: arrow, tag: tag, dimension: dimension,
    sheave: sheave, block: block, hook: hook, drawGear: drawGear, gearSprite: gearSprite, clearGearCache: clearGearCache,
    bikeScene: bikeScene, METALS: METALS, quiet: false
  };
  return api;
})();
