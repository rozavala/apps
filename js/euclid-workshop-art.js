/* ================================================================
   EUCLID'S WORKSHOP — drawing of materials and instruments.
   Everything is painted in code: the parchment sheet, graphite
   grain, a brass-and-steel compass, a wooden straightedge with a
   steel edge, a drafting pencil, and the toolbar icons (inline SVG).
   All drawing functions take CSS-pixel coordinates on a context
   that is already scaled by devicePixelRatio.
   ================================================================ */

var EuclidArt = (function() {
  'use strict';

  // ---- small deterministic RNG so textures look the same each time --
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function() {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function canvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }

  // ---- parchment sheet ------------------------------------------------
  // w, h in DEVICE pixels. Returns an offscreen canvas.
  function makePaper(w, h, dpr) {
    w = Math.max(1, Math.round(w || 0)); h = Math.max(1, Math.round(h || 0));
    var c = canvas(w, h), g = ZsCanvas.get2d(c);
    if (!g) { ZsCanvas.release(c); return null; } // no canvas memory: callers use a flat colour
    var R = rng(1729);
    dpr = dpr || 1;

    var base = g.createRadialGradient(w * 0.45, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    base.addColorStop(0, '#f7eed6');
    base.addColorStop(0.55, '#f0e2c1');
    base.addColorStop(1, '#e3cc9f');
    g.fillStyle = base; g.fillRect(0, 0, w, h);

    // low-frequency mottling: tiny random canvases scaled up smoothly
    [[70, 0.10], [22, 0.07], [9, 0.05]].forEach(function(o) {
      var cw = Math.max(2, Math.ceil(w / (o[0] * dpr))), ch = Math.max(2, Math.ceil(h / (o[0] * dpr)));
      var m = canvas(cw, ch), mg = ZsCanvas.get2d(m);
      if (!mg) { ZsCanvas.release(m); return; }
      var id = mg.createImageData(cw, ch);
      for (var i = 0; i < cw * ch; i++) {
        var v = R();
        id.data[i * 4] = 150 + v * 60; id.data[i * 4 + 1] = 110 + v * 50; id.data[i * 4 + 2] = 60 + v * 30;
        id.data[i * 4 + 3] = 255 * v;
      }
      mg.putImageData(id, 0, 0);
      g.save(); g.globalAlpha = o[1]; g.imageSmoothingEnabled = true;
      g.drawImage(m, 0, 0, w, h); g.restore();
      ZsCanvas.release(m);
    });

    // fine grain
    var img = g.getImageData(0, 0, w, h), d = img.data;
    for (var p = 0; p < d.length; p += 4) {
      var n = (R() - 0.5) * 13;
      d[p] += n; d[p + 1] += n; d[p + 2] += n * 0.8;
    }
    g.putImageData(img, 0, 0);

    // fibres
    var fibres = Math.round(w * h / (2600 * dpr * dpr));
    g.lineCap = 'round';
    for (var f = 0; f < fibres; f++) {
      var x = R() * w, y = R() * h, a = R() * Math.PI * 2, L = (4 + R() * 16) * dpr;
      g.strokeStyle = R() < 0.5 ? 'rgba(120,85,45,0.07)' : 'rgba(255,250,235,0.16)';
      g.lineWidth = (0.4 + R() * 0.6) * dpr;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * L * 0.5, y + Math.sin(a + 0.6) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }

    // foxing (age spots), mostly near the edges
    for (var s = 0; s < 26; s++) {
      var edge = R() < 0.7;
      var fx = edge ? (R() < 0.5 ? R() * w * 0.18 : w - R() * w * 0.18) : R() * w;
      var fy = R() * h;
      var fr = (2 + R() * 12) * dpr;
      var sg = g.createRadialGradient(fx, fy, 0, fx, fy, fr);
      sg.addColorStop(0, 'rgba(150,95,40,' + (0.06 + R() * 0.10).toFixed(3) + ')');
      sg.addColorStop(0.7, 'rgba(150,95,40,0.03)');
      sg.addColorStop(1, 'rgba(150,95,40,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(fx, fy, fr, 0, Math.PI * 2); g.fill();
    }

    // vignette
    var vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(110,70,30,0)');
    vg.addColorStop(1, 'rgba(110,70,30,0.26)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    return c;
  }

  // ---- graphite grain pattern ------------------------------------------
  var _graphite = null;
  function graphitePattern(g) {
    if (!_graphite) {
      var N = 96, c = canvas(N, N), cg = ZsCanvas.get2d(c);
      if (!cg) { ZsCanvas.release(c); return '#4a4a52'; } // plain graphite colour
      var id = cg.createImageData(N, N), R = rng(314);
      for (var i = 0; i < N * N; i++) {
        var v = R(), sh = 46 + v * 40;
        id.data[i * 4] = sh; id.data[i * 4 + 1] = sh; id.data[i * 4 + 2] = sh + 6;
        id.data[i * 4 + 3] = 95 + Math.pow(R(), 0.6) * 160;
      }
      cg.putImageData(id, 0, 0);
      _graphite = c;
    }
    return g.createPattern(_graphite, 'repeat');
  }

  // ---- helpers ---------------------------------------------------------
  function steelGrad(g, x0, y0, x1, y1) {
    var gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, '#4a525a');
    gr.addColorStop(0.28, '#c9d1d8');
    gr.addColorStop(0.45, '#f7fafc');
    gr.addColorStop(0.62, '#9aa4ad');
    gr.addColorStop(1, '#3b4249');
    return gr;
  }
  function brassGrad(g, x0, y0, x1, y1) {
    var gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, '#6e4a12');
    gr.addColorStop(0.3, '#d9a842');
    gr.addColorStop(0.5, '#fff0b0');
    gr.addColorStop(0.7, '#c08a2a');
    gr.addColorStop(1, '#5e3d0c');
    return gr;
  }

  // tapered leg between two points (w0 at a, w1 at b)
  function leg(g, ax, ay, bx, by, w0, w1) {
    var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    g.beginPath();
    g.moveTo(ax + nx * w0, ay + ny * w0);
    g.lineTo(bx + nx * w1, by + ny * w1);
    g.lineTo(bx - nx * w1, by - ny * w1);
    g.lineTo(ax - nx * w0, ay - ny * w0);
    g.closePath();
    var mx = (ax + bx) / 2, my = (ay + by) / 2;
    g.fillStyle = steelGrad(g, mx + nx * w0, my + ny * w0, mx - nx * w0, my - ny * w0);
    g.fill();
    g.strokeStyle = 'rgba(30,34,38,0.55)'; g.lineWidth = 0.7; g.stroke();
    // a crisp specular line
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(ax + nx * w0 * 0.25, ay + ny * w0 * 0.25);
    g.lineTo(bx + nx * w1 * 0.25, by + ny * w1 * 0.25);
    g.stroke();
  }

  function rotRect(g, cx, cy, ang, w, h, fill, stroke) {
    g.save(); g.translate(cx, cy); g.rotate(ang);
    g.beginPath();
    if (g.roundRect) g.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.3);
    else g.rect(-w / 2, -h / 2, w, h);
    g.fillStyle = typeof fill === 'function' ? fill(g, w, h) : fill; g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 0.7; g.stroke(); }
    g.restore();
  }

  // ---- the drawing compass ---------------------------------------------
  // Needle at (cx, cy), pencil lead at (px, py). Seen from slightly above:
  // the hinge rises toward the top of the screen, and the shadow falls to
  // the lower right, swinging with the compass as it turns.
  function drawCompass(g, cx, cy, px, py, o) {
    o = o || {};
    var alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0) return;
    var r = Math.hypot(px - cx, py - cy);
    var L = Math.max(o.minLeg || 118, r * 0.56 + 26);           // leg length on screen
    var half = r / 2, z = Math.sqrt(Math.max(L * L - half * half, 0));
    var lift = o.lift || 0;                          // raise the whole tool (for put-down/lift)
    var mx = (cx + px) / 2, my = (cy + py) / 2;
    var k = Math.max(1, Math.min(2.1, L / 150));       // heavier build for a big opening
    // the hand leans the compass a little in the direction it turns
    var lean = o.lean == null ? 0.22 : o.lean;
    var tx = r > 0.5 ? -(py - cy) / r : 0, ty = r > 0.5 ? (px - cx) / r : 0;
    var hx = mx + tx * z * lean, hy = my + ty * z * lean - z * 0.66 - lift;
    var shx = mx + tx * z * lean + (z + lift) * 0.36, shy = my + ty * z * lean + (z + lift) * 0.17;
    var handle = 34 * k;

    g.save();
    g.globalAlpha = alpha;
    g.lineCap = 'round'; g.lineJoin = 'round';

    // --- soft cast shadow ---
    var sOff = lift * 0.3;
    [[16, 'rgba(70,42,15,0.07)'], [9, 'rgba(70,42,15,0.11)'], [4, 'rgba(60,35,12,0.12)']].forEach(function(s) {
      g.strokeStyle = s[1]; g.lineWidth = s[0] * k;
      g.beginPath();
      g.moveTo(cx + sOff, cy + sOff * 0.5); g.lineTo(shx, shy); g.lineTo(px + sOff, py + sOff * 0.5);
      g.moveTo(shx, shy); g.lineTo(shx + handle * 0.55, shy + handle * 0.26);
      g.stroke();
    });

    // needle and pencil feet
    var nfx = cx + (hx - cx) * 0.075, nfy = cy + (hy - cy) * 0.075;
    var pfx = px + (hx - px) * 0.15, pfy = py + (hy - py) * 0.15;

    function drawNeedleLeg() {
      leg(g, hx, hy, nfx, nfy, 5.4 * k, 2.8 * k);
      // steel needle
      g.strokeStyle = '#59616a'; g.lineWidth = 2.0;
      g.beginPath(); g.moveTo(nfx, nfy); g.lineTo(cx, cy); g.stroke();
      g.strokeStyle = '#e6ebef'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(nfx, nfy); g.lineTo(cx + (nfx - cx) * 0.2, cy + (nfy - cy) * 0.2); g.stroke();
      // brass collar
      var ang = Math.atan2(hy - nfy, hx - nfx);
      rotRect(g, nfx + (hx - nfx) * 0.04, nfy + (hy - nfy) * 0.04, ang, 9 * k, 7.5 * k, function(gg, w, h) {
        return brassGrad(gg, 0, -h / 2, 0, h / 2);
      }, 'rgba(70,45,10,0.6)');
    }
    function drawPencilLeg() {
      leg(g, hx, hy, pfx, pfy, 5.4 * k, 3.3 * k);
      var ang = Math.atan2(hy - pfy, hx - pfx);
      // graphite lead cone
      var dx = px - pfx, dy = py - pfy, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      g.beginPath();
      var lw = 2.4 * k;
      g.moveTo(pfx + nx * lw, pfy + ny * lw); g.lineTo(px, py); g.lineTo(pfx - nx * lw, pfy - ny * lw); g.closePath();
      var lg = g.createLinearGradient(pfx + nx * lw, pfy + ny * lw, pfx - nx * lw, pfy - ny * lw);
      lg.addColorStop(0, '#1d1d20'); lg.addColorStop(0.45, '#7b7b82'); lg.addColorStop(1, '#202024');
      g.fillStyle = lg; g.fill();
      // brass clamp with a knurled screw
      rotRect(g, pfx, pfy, ang, 13 * k, 9 * k, function(gg, w, h) { return brassGrad(gg, 0, -h / 2, 0, h / 2); }, 'rgba(70,45,10,0.65)');
      var sx = pfx + nx * 7 * k, sy = pfy + ny * 7 * k;
      var sg = g.createRadialGradient(sx - 1, sy - 1, 0.5, sx, sy, 3.6 * k);
      sg.addColorStop(0, '#fff3c4'); sg.addColorStop(0.5, '#c8922e'); sg.addColorStop(1, '#5a3a0c');
      g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 3.4 * k, 0, Math.PI * 2); g.fill();
    }
    // the leg nearer the viewer (lower on screen) is drawn last
    if (cy > py) { drawPencilLeg(); drawNeedleLeg(); } else { drawNeedleLeg(); drawPencilLeg(); }

    // --- handle (knurled grip) and hinge, scaled about the hinge ---
    g.save(); g.translate(hx, hy); g.scale(k, k); g.translate(-hx, -hy);
    handle = 34;
    var gx0 = hx - 4.2, gy0 = hy - handle;
    var hg = g.createLinearGradient(gx0, 0, gx0 + 8.4, 0);
    hg.addColorStop(0, '#5b3c0e'); hg.addColorStop(0.35, '#e8bb55'); hg.addColorStop(0.5, '#fff1b8');
    hg.addColorStop(0.75, '#b07c22'); hg.addColorStop(1, '#4e330b');
    g.fillStyle = hg;
    g.beginPath();
    if (g.roundRect) g.roundRect(gx0, gy0, 8.4, handle - 6, 3); else g.rect(gx0, gy0, 8.4, handle - 6);
    g.fill();
    g.save(); g.beginPath(); g.rect(gx0, gy0 + 3, 8.4, handle - 12); g.clip();
    g.strokeStyle = 'rgba(60,35,5,0.35)'; g.lineWidth = 0.6;
    for (var k = -10; k < handle; k += 2.4) {
      g.beginPath(); g.moveTo(gx0, gy0 + k); g.lineTo(gx0 + 8.4, gy0 + k + 4); g.stroke();
    }
    g.restore();
    // cap
    g.fillStyle = brassGrad(g, gx0 - 1, 0, gx0 + 9.4, 0);
    g.beginPath(); g.ellipse(hx, gy0, 4.6, 1.8, 0, 0, Math.PI * 2); g.fill();

    // --- hinge disc ---
    var rg = g.createRadialGradient(hx - 3, hy - 3.5, 1, hx, hy, 11);
    rg.addColorStop(0, '#fff6cf'); rg.addColorStop(0.35, '#e2b24d'); rg.addColorStop(0.8, '#9c6b1a'); rg.addColorStop(1, '#5a3b0b');
    g.fillStyle = rg; g.beginPath(); g.arc(hx, hy, 10.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(60,38,8,0.7)'; g.lineWidth = 0.8; g.stroke();
    // screw head
    var scg = g.createRadialGradient(hx - 1, hy - 1, 0.3, hx, hy, 4);
    scg.addColorStop(0, '#f4f6f8'); scg.addColorStop(1, '#6b737b');
    g.fillStyle = scg; g.beginPath(); g.arc(hx, hy, 3.8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(30,30,30,0.7)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(hx - 2.6, hy + 1.2); g.lineTo(hx + 2.6, hy - 1.2); g.stroke();
    g.restore();

    g.restore();
  }

  // ---- the straightedge ------------------------------------------------
  // Lies with its steel drawing edge exactly on the segment A→B.
  function drawStraightedge(g, ax, ay, bx, by, o) {
    o = o || {};
    var alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0) return;
    var dpr = o.dpr || 1, pad = o.pad == null ? 44 : o.pad, W = 30, off = o.offset || 0;
    if (bx < ax || (bx === ax && by < ay)) { var tx = ax, ty = ay; ax = bx; ay = by; bx = tx; by = ty; }
    var dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    if (len < 1) return;
    var ux = dx / len, uy = dy / len;
    var ang = Math.atan2(uy, ux);
    var L = len + pad * 2;

    g.save();
    g.globalAlpha = alpha;
    g.translate(ax - ux * pad, ay - uy * pad);
    g.rotate(ang);
    g.translate(0, off);

    // shadow
    g.save();
    g.shadowColor = 'rgba(60,35,10,0.38)';
    g.shadowBlur = 12 * dpr;
    g.shadowOffsetX = 5 * dpr; g.shadowOffsetY = 7 * dpr;
    g.fillStyle = '#d7b273';
    g.beginPath();
    if (g.roundRect) g.roundRect(0, 0, L, W, [1, 1, 5, 5]); else g.rect(0, 0, L, W);
    g.fill();
    g.restore();

    // wooden body
    var wg = g.createLinearGradient(0, 0, 0, W);
    wg.addColorStop(0, '#f0d9a6'); wg.addColorStop(0.45, '#dfb877'); wg.addColorStop(1, '#bf8f4c');
    g.fillStyle = wg;
    g.beginPath();
    if (g.roundRect) g.roundRect(0, 0, L, W, [1, 1, 5, 5]); else g.rect(0, 0, L, W);
    g.fill();

    // grain
    g.save();
    g.beginPath(); g.rect(0, 0, L, W); g.clip();
    var R = rng(77);
    for (var i = 0; i < 14; i++) {
      var y0 = 5 + R() * (W - 6), amp = 0.6 + R() * 1.8, fr = 0.008 + R() * 0.02, ph = R() * 6;
      g.strokeStyle = 'rgba(' + (110 + R() * 30 | 0) + ',66,24,' + (0.08 + R() * 0.14).toFixed(3) + ')';
      g.lineWidth = 0.5 + R() * 1.1;
      g.beginPath();
      for (var x = 0; x <= L; x += 8) {
        var y = y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * fr * 3.1 + ph) * amp * 0.3;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();

    // steel edge strip along the drawing edge
    var sg = g.createLinearGradient(0, 0, 0, 5.5);
    sg.addColorStop(0, '#5f676f'); sg.addColorStop(0.35, '#eef2f5'); sg.addColorStop(0.7, '#a7b0b8'); sg.addColorStop(1, '#6d757d');
    g.fillStyle = sg; g.fillRect(0, 0, L, 5.5);
    g.strokeStyle = 'rgba(25,28,32,0.65)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(0, 0.4); g.lineTo(L, 0.4); g.stroke();
    // countersunk screws holding the strip
    for (var sx = 18; sx < L - 10; sx += 90) {
      var scr = g.createRadialGradient(sx - 0.5, 2.3, 0.2, sx, 2.75, 1.8);
      scr.addColorStop(0, '#ffffff'); scr.addColorStop(1, '#5a6168');
      g.fillStyle = scr; g.beginPath(); g.arc(sx, 2.75, 1.6, 0, Math.PI * 2); g.fill();
    }
    // bevel highlight and far edge
    g.strokeStyle = 'rgba(255,248,225,0.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(2, 6.6); g.lineTo(L - 2, 6.6); g.stroke();
    g.strokeStyle = 'rgba(90,55,20,0.55)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(3, W - 0.5); g.lineTo(L - 3, W - 0.5); g.stroke();
    // hanging hole
    var hxp = L - 16, hyp = W / 2 + 3;
    g.fillStyle = 'rgba(70,40,15,0.55)'; g.beginPath(); g.arc(hxp, hyp, 3.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,240,210,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.arc(hxp, hyp + 0.4, 3.6, 0.2, Math.PI - 0.2); g.stroke();
    // maker's stamp (unmarked edge — a Euclidean straightedge has no scale)
    if (L > 200) {
      g.font = 'italic 600 9px Georgia, "Times New Roman", serif';
      g.fillStyle = 'rgba(95,55,20,0.42)';
      g.fillText('TALLER DE EUCLIDES', 28, W - 8);
    }
    g.restore();
  }

  // ---- drafting pencil -------------------------------------------------
  function drawPencil(g, tx, ty, o) {
    o = o || {};
    var alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0) return;
    var ang = o.angle == null ? -1.05 : o.angle;   // body points up and to the right
    var lift = o.lift || 0;
    g.save();
    g.globalAlpha = alpha;
    // shadow on the paper
    g.save();
    g.translate(tx + 7 + lift * 0.4, ty + 9 + lift * 0.3); g.rotate(ang + 0.08);
    g.fillStyle = 'rgba(60,35,10,0.16)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(26, -6); g.lineTo(134, -6); g.lineTo(134, 6); g.lineTo(26, 6); g.closePath(); g.fill();
    g.restore();

    g.translate(tx, ty - lift); g.rotate(ang);
    // graphite tip
    var tg = g.createLinearGradient(0, -2, 0, 2);
    tg.addColorStop(0, '#2a2a2e'); tg.addColorStop(0.5, '#86868e'); tg.addColorStop(1, '#1c1c20');
    g.fillStyle = tg; g.beginPath(); g.moveTo(0, 0); g.lineTo(8, -1.9); g.lineTo(8, 1.9); g.closePath(); g.fill();
    // sharpened wood
    var wg = g.createLinearGradient(0, -5.5, 0, 5.5);
    wg.addColorStop(0, '#f6dcb3'); wg.addColorStop(0.5, '#e4bf8b'); wg.addColorStop(1, '#b98b55');
    g.fillStyle = wg;
    g.beginPath(); g.moveTo(8, -1.9); g.lineTo(27, -5.5);
    g.quadraticCurveTo(28.5, -3.7, 27, -1.8); g.quadraticCurveTo(28.5, 0, 27, 1.8); g.quadraticCurveTo(28.5, 3.7, 27, 5.5);
    g.lineTo(8, 1.9); g.closePath(); g.fill();
    // lacquered hexagonal body: three facets
    var facets = [[-5.5, -1.8, '#4f9a6a', '#3b7f55'], [-1.8, 1.8, '#2f6e47', '#27603d'], [1.8, 5.5, '#1d4b31', '#173d28']];
    facets.forEach(function(f) {
      var fg = g.createLinearGradient(27, 0, 128, 0);
      fg.addColorStop(0, f[2]); fg.addColorStop(1, f[3]);
      g.fillStyle = fg; g.fillRect(27, f[0], 101, f[1] - f[0]);
    });
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(29, -4.2); g.lineTo(127, -4.2); g.stroke();
    // gold stamping
    g.fillStyle = 'rgba(232,196,98,0.85)';
    g.font = 'bold 4.2px Georgia, serif';
    g.fillText('HB  ·  EUCLIDES', 52, 1.4);
    // brass ferrule and end cap
    var bg = g.createLinearGradient(0, -5.8, 0, 5.8);
    bg.addColorStop(0, '#fff0b0'); bg.addColorStop(0.4, '#d6a43e'); bg.addColorStop(1, '#6b4810');
    g.fillStyle = bg; g.fillRect(128, -5.8, 8, 11.6);
    g.strokeStyle = 'rgba(80,50,10,0.5)'; g.lineWidth = 0.6;
    for (var k = 130; k < 136; k += 2) { g.beginPath(); g.moveTo(k, -5.8); g.lineTo(k, 5.8); g.stroke(); }
    g.fillStyle = '#1f2a24'; g.fillRect(136, -5.4, 3.2, 10.8);
    g.restore();
  }

  // ---- toolbar icons (inline SVG) -------------------------------------
  var DEFS =
    '<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="ewg-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#d8a43c"/><stop offset="1" stop-color="#6e4a12"/></linearGradient>' +
      '<linearGradient id="ewg-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a525a"/><stop offset=".45" stop-color="#f3f6f8"/><stop offset="1" stop-color="#5b636b"/></linearGradient>' +
      '<linearGradient id="ewg-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d9a6"/><stop offset=".5" stop-color="#dcb575"/><stop offset="1" stop-color="#b58447"/></linearGradient>' +
      '<radialGradient id="ewg-dot" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#8a8a92"/><stop offset="1" stop-color="#1e1e22"/></radialGradient>' +
      '<linearGradient id="ewg-lamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#e3a92b"/></linearGradient>' +
    '</defs></svg>';

  var P = 'fill="none" stroke="#3a3530" stroke-width="1.6" stroke-linecap="round"';
  var RED = 'fill="none" stroke="#a4321c" stroke-width="1.8" stroke-linecap="round"';
  var dot = function(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 2.6) + '" fill="url(#ewg-dot)"/>'; };
  var ruler = '<g transform="rotate(-28 16 16)"><rect x="1" y="15" width="30" height="7.5" rx="1.4" fill="url(#ewg-wood)" stroke="#8a5a2a" stroke-width=".6"/><rect x="1" y="15" width="30" height="1.8" fill="url(#ewg-steel)"/><circle cx="27.5" cy="19.4" r="1.1" fill="#7a4a1f"/></g>';
  var compassSvg = function(open) {
    var a = open || 11;
    return '<g><line x1="16" y1="7" x2="' + (16 - a * 0.55) + '" y2="27" stroke="url(#ewg-steel)" stroke-width="2.8" stroke-linecap="round"/>' +
      '<line x1="16" y1="7" x2="' + (16 + a * 0.55) + '" y2="27" stroke="url(#ewg-steel)" stroke-width="2.8" stroke-linecap="round"/>' +
      '<line x1="' + (16 - a * 0.55) + '" y1="27" x2="' + (16 - a * 0.58) + '" y2="30" stroke="#4a525a" stroke-width="1"/>' +
      '<path d="M' + (16 + a * 0.55 - 1.4) + ' 26.2 L' + (16 + a * 0.58) + ' 30 L' + (16 + a * 0.55 + 1.4) + ' 26.6Z" fill="#26262a"/>' +
      '<rect x="14.4" y="1" width="3.2" height="5" rx="1" fill="url(#ewg-brass)"/>' +
      '<circle cx="16" cy="7.4" r="3.2" fill="url(#ewg-brass)" stroke="#6e4a12" stroke-width=".5"/>' +
      '<circle cx="16" cy="7.4" r="1.1" fill="#d8dde2"/></g>';
  };

  var ICONS = {
    point: '<path d="M6 25 Q12 20 18 22 T27 17" ' + P + ' opacity=".35"/>' + dot(16, 15, 4) + '<circle cx="16" cy="15" r="7.5" fill="none" stroke="#a4321c" stroke-width="1.2" stroke-dasharray="2 2"/>',
    line: '<line x1="2" y1="25" x2="30" y2="7" ' + P + '/>' + ruler + dot(9, 20.5) + dot(23, 11.5),
    segment: '<line x1="7" y1="22" x2="25" y2="10" ' + P + ' stroke-width="2"/>' + dot(7, 22, 3) + dot(25, 10, 3),
    circle: '<circle cx="16" cy="18" r="11" ' + P + ' opacity=".55"/>' + compassSvg(12),
    transfer: '<line x1="3" y1="29" x2="29" y2="29" stroke="#a4321c" stroke-width="1.4" stroke-dasharray="2 1.6"/>' + compassSvg(14) +
      '<path d="M8 13 h16" stroke="#a4321c" stroke-width="1.4" fill="none" marker-end=""/><path d="M8 13 l2.6 -2 M8 13 l2.6 2 M24 13 l-2.6 -2 M24 13 l-2.6 2" stroke="#a4321c" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    perpbis: '<line x1="5" y1="20" x2="27" y2="20" ' + P + ' stroke-width="2"/>' + dot(5, 20, 2.6) + dot(27, 20, 2.6) +
      '<line x1="16" y1="3" x2="16" y2="30" ' + RED + '/><path d="M16 16.5 h3.5 v3.5" fill="none" stroke="#a4321c" stroke-width="1.1"/><path d="M9 18 v4 M23 18 v4" stroke="#3a3530" stroke-width="1.1"/>',
    midpoint: '<line x1="4" y1="20" x2="28" y2="20" ' + P + ' stroke-width="2"/>' + dot(4, 20, 2.6) + dot(28, 20, 2.6) +
      '<circle cx="16" cy="20" r="3.4" fill="#a4321c"/><path d="M10 16 v8 M22 16 v8" stroke="#3a3530" stroke-width="1.1" opacity=".6"/>',
    perp: '<line x1="3" y1="24" x2="29" y2="24" ' + P + ' stroke-width="2"/><line x1="13" y1="4" x2="13" y2="29" ' + RED + '/>' +
      '<path d="M13 20 h4 v4" fill="none" stroke="#a4321c" stroke-width="1.2"/>' + dot(13, 9, 2.8),
    parallel: '<line x1="3" y1="23" x2="29" y2="23" ' + P + ' stroke-width="2"/><line x1="3" y1="11" x2="29" y2="11" ' + RED + '/>' +
      dot(16, 11, 2.8) + '<path d="M9 14.5 l3 5 M20 14.5 l3 5" stroke="#3a3530" stroke-width="1" opacity=".55"/>',
    anglebis: '<path d="M4 27 L29 27 M4 27 L22 5" ' + P + ' stroke-width="2"/><path d="M4 27 L30 15" ' + RED + '/>' +
      '<path d="M13 27 A9 9 0 0 0 11.4 19" fill="none" stroke="#3a3530" stroke-width="1"/>' + dot(4, 27, 2.6),
    undo: '<path d="M10 9 L4 15 L10 21" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 15 H19 a8 8 0 0 1 0 16 h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" transform="translate(0 -4)"/>',
    hint: '<path d="M16 3 a8.5 8.5 0 0 1 5 15.4 V22 H11 V18.4 A8.5 8.5 0 0 1 16 3Z" fill="url(#ewg-lamp)" stroke="#8a5a12" stroke-width="1.2"/><rect x="11.5" y="23" width="9" height="2.6" rx="1" fill="#8a8f96"/><rect x="12.5" y="26.4" width="7" height="2.4" rx="1" fill="#6b7178"/><path d="M13.5 13 q2.5 3 5 0" fill="none" stroke="#b26a08" stroke-width="1.1"/>',
    restart: '<path d="M25 16 a9 9 0 1 1 -3 -6.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M23.5 3.5 L23 10 L16.5 9.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    fit: '<path d="M4 11 V4 H11 M21 4 H28 V11 M28 21 V28 H21 M11 28 H4 V21" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" stroke-width="2"/>',
    zoomin: '<path d="M16 7 V25 M7 16 H25" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    zoomout: '<path d="M7 16 H25" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    back: '<path d="M19 6 L9 16 L19 26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M10 6 L26 16 L10 26Z" fill="currentColor"/>',
    speak: '<path d="M5 12 H10 L17 6 V26 L10 20 H5Z" fill="currentColor"/><path d="M21 11 q4 5 0 10 M24.5 8 q7 8 0 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lock: '<rect x="8" y="14" width="16" height="13" rx="2.5" fill="currentColor"/><path d="M11 14 V10 a5 5 0 0 1 10 0 V14" fill="none" stroke="currentColor" stroke-width="2.6"/>'
  };

  function icon(name, size) {
    var s = size || 28;
    return '<svg class="ew-ico" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  return {
    rng: rng, makePaper: makePaper, graphitePattern: graphitePattern,
    drawCompass: drawCompass, drawStraightedge: drawStraightedge, drawPencil: drawPencil,
    icon: icon, DEFS: DEFS
  };
})();
