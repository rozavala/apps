/* ================================================================
   CIRCUIT LAB — drawing (js/circuit-lab-art.js)
   Everything on the workbench is painted here with canvas 2D:
   the plywood board with brass posts, insulated copper wires,
   batteries, bulbs, switches, buzzer, motor, resistor, LED, the
   material tester and the test objects. No images, no emoji.

   Conventions
   - Parts are drawn in a LOCAL frame: origin at the middle of the
     part's two posts, +x from terminal a to terminal b, posts at
     x = ±u/2 (u = grid spacing in CSS px). The two-way switch is
     drawn with its origin on the common post instead.
   - Light comes from the top-left; shadows fall bottom-right in
     screen space (shadowOffset ignores the canvas transform, which
     is exactly what keeps them consistent on rotated parts).
   - setDpr() must be called so shadow blur scales with the canvas.
   ================================================================ */

var CircuitLabArt = (function() {
  'use strict';

  var DPR = 1;
  function setDpr(d) { DPR = d || 1; }

  // ---------------- small helpers ----------------
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); }
  function lin(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }
  function rad(ctx, x0, y0, r0, x1, y1, r1, stops) {
    var g = ctx.createRadialGradient(x0, y0, Math.max(0, r0), x1, y1, Math.max(0.01, r1));
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }
  function shadow(ctx, blur, ox, oy, col) {
    ctx.shadowColor = col || 'rgba(30,15,5,0.42)';
    ctx.shadowBlur = blur * DPR;
    ctx.shadowOffsetX = ox * DPR;
    ctx.shadowOffsetY = oy * DPR;
  }
  function noShadow(ctx) {
    ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  }
  function mulberry(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(h, f) { // f<0 darker, f>0 lighter
    var c = hexToRgb(h);
    for (var i = 0; i < 3; i++) c[i] = Math.round(f < 0 ? c[i] * (1 + f) : c[i] + (255 - c[i]) * f);
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  // Rotate text 180° when the part's frame would draw it upside down.
  function upright(ctx, x, y) {
    var m = ctx.getTransform ? ctx.getTransform() : null;
    ctx.save();
    ctx.translate(x, y);
    if (m && m.a < -0.01 * Math.abs(m.b) - 1e-6) ctx.rotate(Math.PI);
  }
  var BRASS = [[0, '#fbe7a6'], [0.35, '#d9a948'], [0.7, '#a8761f'], [1, '#6e4a12']];
  var CHROME = [[0, '#f4f6f8'], [0.3, '#c3c9cf'], [0.55, '#8a9299'], [0.8, '#d7dce0'], [1, '#6c737a']];

  // A tinned component lead along the local x axis.
  function lead(ctx, x0, x1, y, w) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = lin(ctx, 0, y - w / 2, 0, y + w / 2, [[0, '#5d6268'], [0.35, '#eef1f3'], [0.6, '#a4abb1'], [1, '#4b5056']]);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.restore();
  }
  // A short insulated flying lead (battery holders, buzzer).
  function flyLead(ctx, pts, color, w) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    shadow(ctx, w * 0.8, w * 0.25, w * 0.45, 'rgba(30,15,5,0.35)');
    ctx.strokeStyle = shade(color, -0.45); ctx.lineWidth = w;
    path(ctx, pts); ctx.stroke();
    noShadow(ctx);
    ctx.strokeStyle = color; ctx.lineWidth = w * 0.7;
    path(ctx, pts); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = w * 0.22;
    ctx.translate(-w * 0.12, -w * 0.16);
    path(ctx, pts); ctx.stroke();
    ctx.restore();
  }
  function path(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    if (pts.length === 4) ctx.lineTo(pts[2], pts[3]);
    else if (pts.length === 6) ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    else if (pts.length === 8) ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
  }
  function screwHead(ctx, x, y, r, ang) {
    ctx.save();
    shadow(ctx, r * 0.6, r * 0.2, r * 0.35);
    ctx.fillStyle = rad(ctx, x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r, BRASS);
    circle(ctx, x, y, r); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(80,50,10,0.6)'; ctx.lineWidth = Math.max(0.6, r * 0.12);
    circle(ctx, x, y, r * 0.94); ctx.stroke();
    ctx.translate(x, y); ctx.rotate(ang || 0.6);
    ctx.strokeStyle = 'rgba(60,35,5,0.85)'; ctx.lineWidth = Math.max(0.8, r * 0.22);
    ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(r * 0.62, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,190,0.5)'; ctx.lineWidth = Math.max(0.5, r * 0.08);
    ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.14); ctx.lineTo(r * 0.6, r * 0.14); ctx.stroke();
    ctx.restore();
  }

  // ---------------- the workbench + board (cached) ----------------
  // rect: board outline in CSS px; posts: [{x,y}] in CSS px; edges: [[x1,y1,x2,y2]]
  function makeBoard(cw, ch, rect, posts, edges, u) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(cw * DPR));
    c.height = Math.max(1, Math.round(ch * DPR));
    var ctx = ZsCanvas.get2d(c);
    if (!ctx) { ZsCanvas.release(c); return null; } // no canvas memory: no board image
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var rnd = mulberry(7);
    var i, j;

    // Workbench: dark oiled walnut table top.
    ctx.fillStyle = lin(ctx, 0, 0, cw, ch, [[0, '#4a3121'], [0.5, '#3a2618'], [1, '#2b1b10']]);
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalAlpha = 0.5;
    for (i = 0; i < ch; i += 2 + rnd() * 5) {
      ctx.strokeStyle = rnd() < 0.5 ? 'rgba(20,10,4,0.35)' : 'rgba(110,70,40,0.18)';
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      var ph = rnd() * 10, am = 1 + rnd() * 3;
      for (j = 0; j <= cw; j += 20) ctx.lineTo(j, i + Math.sin(j / 140 + ph) * am);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // soft vignette on the table
    ctx.fillStyle = rad(ctx, cw / 2, ch / 2, Math.min(cw, ch) * 0.2, cw / 2, ch / 2, Math.max(cw, ch) * 0.75,
      [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]);
    ctx.fillRect(0, 0, cw, ch);

    var x = rect.x, y = rect.y, w = rect.w, h = rect.h;
    var fr = Math.max(8, u * 0.16);  // frame width
    // board drop shadow
    ctx.save();
    shadow(ctx, u * 0.35, u * 0.06, u * 0.12, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = '#7a5530';
    rr(ctx, x, y, w, h, fr * 0.8); ctx.fill();
    ctx.restore();

    // Frame: darker hardwood with a bevel.
    ctx.fillStyle = lin(ctx, x, y, x, y + h, [[0, '#9c6a3a'], [0.5, '#7c5128'], [1, '#5e3b1b']]);
    rr(ctx, x, y, w, h, fr * 0.8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,0.35)'; ctx.lineWidth = 1.2;
    rr(ctx, x + 1, y + 1, w - 2, h - 2, fr * 0.8); ctx.stroke();

    // Plywood panel inside the frame, in three planks.
    var px = x + fr, py = y + fr, pw = w - fr * 2, ph2 = h - fr * 2;
    ctx.save();
    rr(ctx, px, py, pw, ph2, fr * 0.3); ctx.clip();
    var horiz = pw >= ph2;
    var planks = 3;
    for (var p = 0; p < planks; p++) {
      var tone = [[222, 182, 124], [214, 172, 112], [228, 190, 134]][p];
      var bx = horiz ? px : px + pw * p / planks, by = horiz ? py + ph2 * p / planks : py;
      var bw = horiz ? pw : pw / planks, bh = horiz ? ph2 / planks : ph2;
      ctx.fillStyle = 'rgb(' + tone.join(',') + ')';
      ctx.fillRect(bx, by, bw + 1, bh + 1);
      // grain lines along the plank
      var len = horiz ? bw : bh, across = horiz ? bh : bw;
      for (var g = 0; g < across; g += 1.2 + rnd() * 3.2) {
        var dark = rnd();
        ctx.strokeStyle = dark < 0.6 ? 'rgba(140,90,45,' + (0.05 + rnd() * 0.13) + ')' : 'rgba(255,235,200,' + (0.05 + rnd() * 0.1) + ')';
        ctx.lineWidth = 0.5 + rnd() * 1.8;
        ctx.beginPath();
        var phs = rnd() * 6.28, amp = 0.6 + rnd() * 2.5, fq = 60 + rnd() * 160;
        for (var s = -10; s <= len + 10; s += 12) {
          var off = g + Math.sin(s / fq + phs) * amp + Math.sin(s / (fq * 0.37) + phs * 2) * amp * 0.4;
          if (horiz) ctx.lineTo(bx + s, by + off); else ctx.lineTo(bx + off, by + s);
        }
        ctx.stroke();
      }
      // a knot or two
      if (rnd() < 0.8) {
        var kx = horiz ? bx + bw * (0.15 + rnd() * 0.7) : bx + bw * (0.3 + rnd() * 0.4);
        var ky = horiz ? by + bh * (0.3 + rnd() * 0.4) : by + bh * (0.15 + rnd() * 0.7);
        var kr = u * (0.035 + rnd() * 0.03);
        // grain flowing around the knot: stretched, irregular, fading out
        for (var k = 5; k >= 1; k--) {
          ctx.strokeStyle = 'rgba(120,70,30,' + (0.03 + 0.025 * (5 - k)) + ')';
          ctx.lineWidth = 0.8 + rnd() * 0.8;
          ctx.beginPath();
          var ex = kr * (1 + k * 0.9) * (horiz ? 3.2 : 1), ey = kr * (1 + k * 0.6) * (horiz ? 1 : 3.2);
          for (var a2 = 0; a2 <= 6.3; a2 += 0.3) {
            var wob = 1 + Math.sin(a2 * 3 + k) * 0.08;
            ctx.lineTo(kx + Math.cos(a2) * ex * wob, ky + Math.sin(a2) * ey * wob);
          }
          ctx.stroke();
        }
        ctx.fillStyle = rad(ctx, kx, ky, 0, kx, ky, kr * 1.4, [[0, 'rgba(85,42,12,0.6)'], [0.7, 'rgba(110,60,22,0.35)'], [1, 'rgba(120,70,30,0)']]);
        ctx.beginPath(); ctx.ellipse(kx, ky, kr * (horiz ? 1.7 : 1), kr * (horiz ? 1 : 1.7), 0, 0, Math.PI * 2); ctx.fill();
      }
      // seam between planks
      if (p > 0) {
        ctx.fillStyle = 'rgba(70,40,15,0.45)';
        if (horiz) ctx.fillRect(bx, by - 0.8, bw, 1.6); else ctx.fillRect(bx - 0.8, by, 1.6, bh);
        ctx.fillStyle = 'rgba(255,240,210,0.35)';
        if (horiz) ctx.fillRect(bx, by + 0.8, bw, 0.8); else ctx.fillRect(bx + 0.8, by, 0.8, bh);
      }
    }
    // fine speckle
    for (i = 0; i < pw * ph2 / 90; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(90,50,20,0.10)' : 'rgba(255,245,220,0.10)';
      ctx.fillRect(px + rnd() * pw, py + rnd() * ph2, 1 + rnd(), 1 + rnd());
    }
    // varnish sheen + inner shadow from the frame
    ctx.fillStyle = lin(ctx, px, py, px + pw, py + ph2, [[0, 'rgba(255,250,235,0.20)'], [0.45, 'rgba(255,250,235,0.02)'], [1, 'rgba(60,30,10,0.12)']]);
    ctx.fillRect(px, py, pw, ph2);
    ctx.restore();
    ctx.save();
    rr(ctx, px, py, pw, ph2, fr * 0.3); ctx.clip();
    ctx.strokeStyle = 'rgba(40,20,5,0.55)'; ctx.lineWidth = fr * 0.5;
    shadow(ctx, fr * 0.8, fr * 0.15, fr * 0.25, 'rgba(30,15,0,0.7)');
    rr(ctx, px - fr * 0.25, py - fr * 0.25, pw + fr * 0.5, ph2 + fr * 0.5, fr * 0.4); ctx.stroke();
    ctx.restore();

    // Pencil guide lines between neighbouring posts.
    ctx.save();
    ctx.strokeStyle = 'rgba(70,45,20,0.20)';
    ctx.lineWidth = Math.max(1, u * 0.012);
    ctx.setLineDash([u * 0.05, u * 0.06]);
    for (i = 0; i < edges.length; i++) {
      var e = edges[i];
      ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.stroke();
    }
    ctx.restore();

    // Brass binding posts.
    for (i = 0; i < posts.length; i++) emptyPost(ctx, posts[i].x, posts[i].y, u, rnd() * 3);

    // Little maker's plate in the corner.
    if (u > 50) {
      ctx.save();
      ctx.font = '700 ' + Math.round(u * 0.11) + 'px "Baloo 2", sans-serif';
      ctx.fillStyle = 'rgba(80,45,15,0.35)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('CIRCUIT LAB · LABORATORIO', px + pw - u * 0.15, py + ph2 - u * 0.12);
      ctx.restore();
    }
    return c;
  }

  function emptyPost(ctx, x, y, u, ang) {
    var r = u * 0.085;
    ctx.save();
    shadow(ctx, r * 0.9, r * 0.25, r * 0.4, 'rgba(40,20,0,0.5)');
    // hex nut base
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = ang + i * Math.PI / 3;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = lin(ctx, x - r, y - r, x + r, y + r, [[0, '#f3d995'], [0.45, '#c49238'], [1, '#77501a']]);
    ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(90,55,10,0.7)'; ctx.lineWidth = Math.max(0.6, r * 0.08); ctx.stroke();
    // threaded stud
    ctx.fillStyle = rad(ctx, x - r * 0.15, y - r * 0.15, 0, x, y, r * 0.5, [[0, '#e8d3a0'], [0.6, '#9c7330'], [1, '#5b3d10']]);
    circle(ctx, x, y, r * 0.48); ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,5,0.55)'; ctx.lineWidth = Math.max(0.5, r * 0.06);
    circle(ctx, x, y, r * 0.32); ctx.stroke();
    ctx.restore();
  }

  // Knurled brass cap screwed down over wire ends (drawn on top).
  function nut(ctx, x, y, u, hot) {
    var r = u * 0.078;
    ctx.save();
    shadow(ctx, r * 0.8, r * 0.25, r * 0.4, 'rgba(30,15,0,0.55)');
    ctx.fillStyle = rad(ctx, x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r, [[0, '#fff1c4'], [0.3, '#e2b558'], [0.75, '#a9771f'], [1, '#6a450e']]);
    circle(ctx, x, y, r); ctx.fill();
    noShadow(ctx);
    if (u > 55) {
      ctx.strokeStyle = 'rgba(90,55,8,0.55)'; ctx.lineWidth = Math.max(0.5, r * 0.07);
      for (var i = 0; i < 16; i++) {
        var a = i * Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
        ctx.lineTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98);
        ctx.stroke();
      }
    }
    ctx.fillStyle = rad(ctx, x - r * 0.2, y - r * 0.25, 0, x, y, r * 0.6, [[0, '#fff6d8'], [0.7, '#d4a447'], [1, '#9b6c1c']]);
    circle(ctx, x, y, r * 0.6); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,5,0.6)'; ctx.lineWidth = Math.max(0.5, r * 0.06);
    circle(ctx, x, y, r * 0.6); ctx.stroke();
    if (hot) {
      ctx.fillStyle = 'rgba(255,120,40,' + (0.5 * hot) + ')';
      circle(ctx, x, y, r); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- wires ----------------
  var WIRE_COLORS = ['#d62828', '#222831', '#1d6fd6', '#f2b705', '#2a9d47', '#f4f4ef', '#e8711c'];

  // pts: flat [x0,y0,x1,y1,...] polyline in CSS px; cum: cumulative lengths
  function subPath(ctx, pts, cum, d0, d1) {
    ctx.beginPath();
    var n = pts.length / 2, started = false;
    for (var i = 0; i < n - 1; i++) {
      var a = cum[i], b = cum[i + 1];
      if (b < d0 || a > d1) continue;
      var x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[i * 2 + 2], y1 = pts[i * 2 + 3];
      var seg = b - a || 1;
      var t0 = Math.max(0, (d0 - a) / seg), t1 = Math.min(1, (d1 - a) / seg);
      if (!started) { ctx.moveTo(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0); started = true; }
      ctx.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
    }
  }
  function pointAt(pts, cum, d) {
    var n = pts.length / 2;
    for (var i = 0; i < n - 1; i++) {
      if (d <= cum[i + 1] || i === n - 2) {
        var seg = (cum[i + 1] - cum[i]) || 1, t = Math.max(0, Math.min(1, (d - cum[i]) / seg));
        var x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[i * 2 + 2], y1 = pts[i * 2 + 3];
        return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, dx: (x1 - x0) / seg, dy: (y1 - y0) / seg };
      }
    }
    return { x: pts[0], y: pts[1], dx: 1, dy: 0 };
  }

  function drawWire(ctx, pts, cum, color, u, opt) {
    opt = opt || {};
    var L = cum[cum.length - 1];
    var w = Math.max(4.5, u * 0.085);
    var tip = Math.min(L * 0.3, u * 0.15);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (opt.selected) {
      ctx.strokeStyle = 'rgba(70,160,255,0.55)'; ctx.lineWidth = w + 9;
      subPath(ctx, pts, cum, 0, L); ctx.stroke();
    }
    // bare copper ends
    ctx.lineWidth = w * 0.42;
    ctx.strokeStyle = '#b5652a';
    shadow(ctx, w * 0.4, w * 0.15, w * 0.3, 'rgba(30,15,0,0.4)');
    subPath(ctx, pts, cum, 0, tip + 2); ctx.stroke();
    subPath(ctx, pts, cum, L - tip - 2, L); ctx.stroke();
    noShadow(ctx);
    ctx.lineWidth = w * 0.16; ctx.strokeStyle = '#ffd2a1';
    ctx.save(); ctx.translate(-w * 0.06, -w * 0.08);
    subPath(ctx, pts, cum, 0, tip); ctx.stroke();
    subPath(ctx, pts, cum, L - tip, L); ctx.stroke();
    ctx.restore();
    // insulation
    var ghost = opt.ghost;
    if (ghost) ctx.globalAlpha = 0.55;
    shadow(ctx, w * 1.1, w * 0.3, w * 0.6, 'rgba(30,12,0,0.45)');
    ctx.strokeStyle = shade(color, color === '#222831' ? -0.3 : -0.42); ctx.lineWidth = w;
    subPath(ctx, pts, cum, tip, L - tip); ctx.stroke();
    noShadow(ctx);
    ctx.strokeStyle = color; ctx.lineWidth = w * 0.72;
    subPath(ctx, pts, cum, tip, L - tip); ctx.stroke();
    ctx.save();
    ctx.translate(-w * 0.13, -w * 0.17);
    ctx.strokeStyle = color === '#222831' ? 'rgba(200,210,225,0.35)' : 'rgba(255,255,255,0.45)';
    ctx.lineWidth = w * 0.2;
    subPath(ctx, pts, cum, tip + w * 0.3, L - tip - w * 0.3); ctx.stroke();
    ctx.restore();
    // insulation end collars
    ctx.fillStyle = shade(color, -0.55);
    var e1 = pointAt(pts, cum, tip), e2 = pointAt(pts, cum, L - tip);
    circle(ctx, e1.x, e1.y, w * 0.36); ctx.fill();
    circle(ctx, e2.x, e2.y, w * 0.36); ctx.fill();
    // hidden break: a small crease in the plastic
    if (opt.kink) {
      var m = pointAt(pts, cum, L * 0.5);
      var nx = -m.dy, ny = m.dx;
      ctx.strokeStyle = opt.kinkHi ? 'rgba(255,40,40,0.95)' : 'rgba(0,0,0,0.45)';
      ctx.lineWidth = opt.kinkHi ? 2.4 : 1.1;
      for (var k = -1; k <= 1; k += 2) {
        ctx.beginPath();
        ctx.moveTo(m.x + m.dx * k * w * 0.25 - nx * w * 0.45, m.y + m.dy * k * w * 0.25 - ny * w * 0.45);
        ctx.lineTo(m.x - m.dx * k * w * 0.05 + nx * w * 0.45, m.y - m.dy * k * w * 0.05 + ny * w * 0.45);
        ctx.stroke();
      }
      if (opt.kinkHi) {
        ctx.strokeStyle = 'rgba(255,60,60,0.8)'; ctx.lineWidth = 2;
        circle(ctx, m.x, m.y, w * 1.6); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------------- current dots ----------------
  function dot(ctx, x, y, r, electron) {
    ctx.fillStyle = electron
      ? rad(ctx, x, y, 0, x, y, r, [[0, 'rgba(235,250,255,1)'], [0.45, 'rgba(90,185,255,0.95)'], [1, 'rgba(40,120,255,0)']])
      : rad(ctx, x, y, 0, x, y, r, [[0, 'rgba(255,255,235,1)'], [0.45, 'rgba(255,205,70,0.95)'], [1, 'rgba(255,150,0,0)']]);
    circle(ctx, x, y, r); ctx.fill();
  }

  // ---------------- parts ----------------
  // st: { glow, burnt, open, angle, speed, buzz, heat, obj, ohms, t }
  function drawPart(ctx, type, u, st) {
    switch (type) {
      case 'aa': return drawAA(ctx, u, st);
      case 'nine': return drawNine(ctx, u, st);
      case 'bulb': return drawBulb(ctx, u, st);
      case 'switch': return drawKnife(ctx, u, st);
      case 'spdt': return drawSpdt(ctx, u, st);
      case 'buzzer': return drawBuzzer(ctx, u, st);
      case 'motor': return drawMotor(ctx, u, st);
      case 'resistor': return drawResistor(ctx, u, st);
      case 'led': return drawLed(ctx, u, st);
      case 'tester': return drawTester(ctx, u, st);
    }
  }

  function drawAA(ctx, u, st) {
    var hl = u * 0.37, hw = u * 0.16, lw = Math.max(2.5, u * 0.045);
    flyLead(ctx, [-u * 0.5, 0, -hl + 2, 0], '#d62828', lw);
    flyLead(ctx, [hl - 2, 0, u * 0.5, 0], '#222831', lw);
    ctx.save();
    // holder
    shadow(ctx, u * 0.08, u * 0.03, u * 0.06);
    ctx.fillStyle = lin(ctx, 0, -hw, 0, hw, [[0, '#4b4d52'], [0.25, '#2a2b2f'], [1, '#0d0d0f']]);
    rr(ctx, -hl, -hw, hl * 2, hw * 2, u * 0.04); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    rr(ctx, -hl + 0.5, -hw + 0.5, hl * 2 - 1, hw * 2 - 1, u * 0.04); ctx.stroke();
    ctx.fillStyle = '#08080a';
    rr(ctx, -hl + u * 0.03, -hw + u * 0.028, hl * 2 - u * 0.06, hw * 2 - u * 0.056, u * 0.025); ctx.fill();
    // spring at the − end
    ctx.strokeStyle = lin(ctx, 0, -hw, 0, hw, CHROME); ctx.lineWidth = Math.max(1, u * 0.012);
    ctx.beginPath();
    for (var s = 0; s <= 8; s++) {
      var sx = hl - u * 0.035 - s * u * 0.0065, sy = (s % 2 ? 1 : -1) * u * 0.07;
      if (s === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    // + contact plate
    ctx.fillStyle = lin(ctx, 0, -hw, 0, hw, CHROME);
    ctx.fillRect(-hl + u * 0.03, -u * 0.06, u * 0.012, u * 0.12);
    // cell
    var x0 = -hl + u * 0.06, x1 = hl - u * 0.09, r = u * 0.105;
    var cut = x0 + (x1 - x0) * 0.34;
    ctx.fillStyle = lin(ctx, 0, -r, 0, r, [[0, '#7a4a12'], [0.3, '#f0b25a'], [0.55, '#c27a22'], [1, '#5a3206']]);
    ctx.fillRect(x0 + u * 0.02, -r, cut - x0 - u * 0.02, r * 2);
    ctx.fillStyle = '#16171a';
    ctx.fillRect(cut, -r, x1 - cut, r * 2);
    // label
    if (u > 52) {
      ctx.fillStyle = '#f2f2f2';
      ctx.font = '800 ' + (u * 0.075).toFixed(1) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      upright(ctx, (cut + x1) / 2, 0); ctx.fillText('1.5V', 0, 0); ctx.restore();
      ctx.fillStyle = '#3a2004';
      ctx.font = '900 ' + (u * 0.1).toFixed(1) + 'px Nunito, sans-serif';
      ctx.fillText('+', (x0 + cut) / 2 + u * 0.01, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(cut + u * 0.01, -r * 0.62, u * 0.006, r * 1.24);
    }
    // cylinder shading
    ctx.fillStyle = lin(ctx, 0, -r, 0, r, [[0, 'rgba(0,0,0,0.55)'], [0.22, 'rgba(255,255,255,0.38)'], [0.34, 'rgba(255,255,255,0.08)'], [0.7, 'rgba(0,0,0,0.15)'], [1, 'rgba(0,0,0,0.6)']]);
    ctx.fillRect(x0 + u * 0.02, -r, x1 - x0 - u * 0.02, r * 2);
    // metal ends
    ctx.fillStyle = lin(ctx, 0, -r, 0, r, CHROME);
    ctx.fillRect(x0, -u * 0.036, u * 0.024, u * 0.072);           // + nub
    ctx.fillRect(x0 + u * 0.018, -r * 0.92, u * 0.01, r * 1.84);  // shoulder
    ctx.fillRect(x1 - u * 0.01, -r * 0.96, u * 0.014, r * 1.92);  // − cap
    // warm when shorted
    if (st && st.heat > 0.02) {
      ctx.fillStyle = 'rgba(255,90,20,' + Math.min(0.55, st.heat * 0.55) + ')';
      rr(ctx, -hl, -hw, hl * 2, hw * 2, u * 0.04); ctx.fill();
    }
    ctx.restore();
  }

  function drawNine(ctx, u, st) {
    var lw = Math.max(2.5, u * 0.045);
    var bx0 = -u * 0.27, bx1 = u * 0.3, hh = u * 0.17;
    // clip + leads (both leave from the + end, black runs back along the side)
    flyLead(ctx, [-u * 0.5, 0, -u * 0.44, 0, -u * 0.37, -u * 0.04], '#d62828', lw);
    flyLead(ctx, [-u * 0.36, u * 0.05, -u * 0.36, u * 0.26, u * 0.42, u * 0.26, u * 0.5, 0], '#222831', lw);
    ctx.save();
    shadow(ctx, u * 0.08, u * 0.03, u * 0.06);
    ctx.fillStyle = lin(ctx, 0, -hh, 0, hh, [[0, '#33373d'], [0.5, '#1f2226'], [1, '#0d0f12']]);
    rr(ctx, bx0, -hh, bx1 - bx0, hh * 2, u * 0.03); ctx.fill();
    noShadow(ctx);
    // label band
    ctx.fillStyle = lin(ctx, bx0, 0, bx1, 0, [[0, '#1f5fbf'], [1, '#143f86']]);
    ctx.fillRect(bx0 + u * 0.16, -hh, u * 0.24, hh * 2);
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(bx0 + u * 0.16, -hh, u * 0.02, hh * 2);
    if (u > 45) {
      ctx.fillStyle = '#fff';
      ctx.font = '900 ' + (u * 0.12).toFixed(1) + 'px "Baloo 2", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      upright(ctx, bx0 + u * 0.29, 0);
      ctx.fillText('9V', 0, u * 0.005);
      ctx.restore();
    }
    // bevel highlight
    ctx.fillStyle = lin(ctx, 0, -hh, 0, hh, [[0, 'rgba(255,255,255,0.28)'], [0.18, 'rgba(255,255,255,0.05)'], [0.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']]);
    rr(ctx, bx0, -hh, bx1 - bx0, hh * 2, u * 0.03); ctx.fill();
    // metal end with snap terminals, and the black snap clip
    ctx.fillStyle = lin(ctx, 0, -hh, 0, hh, CHROME);
    ctx.fillRect(bx0 - u * 0.02, -hh * 0.9, u * 0.025, hh * 1.8);
    ctx.fillStyle = lin(ctx, 0, -hh, 0, hh, [[0, '#3a3a3a'], [0.4, '#1b1b1b'], [1, '#050505']]);
    rr(ctx, -u * 0.39, -hh * 0.8, u * 0.11, hh * 1.6, u * 0.02); ctx.fill();
    if (st && st.heat > 0.02) {
      ctx.fillStyle = 'rgba(255,90,20,' + Math.min(0.55, st.heat * 0.55) + ')';
      rr(ctx, bx0, -hh, bx1 - bx0, hh * 2, u * 0.03); ctx.fill();
    }
    ctx.restore();
  }

  function filamentColor(g) {
    var stops = [[0, [70, 70, 72]], [0.15, [130, 25, 0]], [0.4, [255, 90, 10]], [0.7, [255, 180, 70]], [1, [255, 244, 205]], [1.4, [255, 255, 255]]];
    if (g <= 0) return 'rgb(70,70,72)';
    for (var i = 1; i < stops.length; i++) {
      if (g <= stops[i][0] || i === stops.length - 1) {
        var a = stops[i - 1], b = stops[i], t = Math.min(1, (g - a[0]) / (b[0] - a[0]));
        return 'rgb(' + Math.round(a[1][0] + (b[1][0] - a[1][0]) * t) + ',' + Math.round(a[1][1] + (b[1][1] - a[1][1]) * t) + ',' + Math.round(a[1][2] + (b[1][2] - a[1][2]) * t) + ')';
      }
    }
  }

  function drawBulb(ctx, u, st) {
    var g = (st && st.glow) || 0, burnt = st && st.burnt;
    var lw = Math.max(2, u * 0.028);
    lead(ctx, -u * 0.5, -u * 0.24, 0, lw);
    lead(ctx, u * 0.24, u * 0.5, 0, lw);
    ctx.save();
    // bakelite base
    var bw = u * 0.31, bh = u * 0.19;
    shadow(ctx, u * 0.08, u * 0.03, u * 0.06);
    ctx.fillStyle = lin(ctx, 0, -bh, 0, bh, [[0, '#3f3a38'], [0.4, '#24201f'], [1, '#100d0c']]);
    rr(ctx, -bw, -bh, bw * 2, bh * 2, u * 0.07); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    rr(ctx, -bw + 0.5, -bh + 0.5, bw * 2 - 1, bh * 2 - 1, u * 0.07); ctx.stroke();
    // brass terminal screws
    screwHead(ctx, -u * 0.245, 0, u * 0.042, 0.5);
    screwHead(ctx, u * 0.245, 0, u * 0.042, 2.1);
    // brass socket ring
    var sr = u * 0.165;
    ctx.fillStyle = rad(ctx, -sr * 0.3, -sr * 0.3, 0, 0, 0, sr, BRASS);
    circle(ctx, 0, 0, sr); ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,10,0.7)'; ctx.lineWidth = Math.max(0.6, u * 0.006);
    circle(ctx, 0, 0, sr * 0.92); ctx.stroke();
    circle(ctx, 0, 0, sr * 0.82); ctx.stroke();
    // glass envelope
    var gr = u * 0.15;
    shadow(ctx, u * 0.06, u * 0.035, u * 0.05, 'rgba(20,10,0,0.35)');
    ctx.fillStyle = burnt
      ? rad(ctx, -gr * 0.3, -gr * 0.3, 0, 0, 0, gr, [[0, 'rgba(200,195,185,0.55)'], [0.6, 'rgba(110,100,90,0.6)'], [1, 'rgba(60,50,45,0.75)']])
      : rad(ctx, -gr * 0.3, -gr * 0.35, 0, 0, 0, gr, [[0, 'rgba(255,255,255,0.55)'], [0.55, 'rgba(225,235,240,0.28)'], [0.85, 'rgba(160,175,185,0.38)'], [1, 'rgba(90,100,110,0.6)']]);
    circle(ctx, 0, 0, gr); ctx.fill();
    noShadow(ctx);
    if (g > 0.02 && !burnt) {
      var gg = Math.min(1.3, g);
      ctx.fillStyle = rad(ctx, 0, 0, 0, 0, 0, gr, [[0, 'rgba(255,252,230,' + Math.min(1, gg) + ')'], [0.45, 'rgba(255,215,110,' + (0.75 * Math.min(1, gg)) + ')'], [1, 'rgba(255,160,40,' + (0.35 * Math.min(1, gg)) + ')']]);
      circle(ctx, 0, 0, gr); ctx.fill();
    }
    // filament supports + coil
    ctx.strokeStyle = 'rgba(70,70,75,0.9)'; ctx.lineWidth = Math.max(0.7, u * 0.008);
    ctx.beginPath();
    ctx.moveTo(-gr * 0.55, gr * 0.75); ctx.lineTo(-gr * 0.38, -gr * 0.05);
    ctx.moveTo(gr * 0.55, gr * 0.75); ctx.lineTo(gr * 0.38, -gr * 0.05);
    ctx.stroke();
    var fc = burnt ? 'rgb(60,58,55)' : filamentColor(g);
    if (g > 0.15 && !burnt) shadow(ctx, u * 0.04 * Math.min(1.3, g), 0, 0, fc);
    ctx.strokeStyle = fc; ctx.lineWidth = Math.max(0.9, u * 0.011);
    ctx.beginPath();
    var n = 7, fx0 = -gr * 0.38, fx1 = gr * 0.38;
    for (var i = 0; i <= n * 6; i++) {
      var t = i / (n * 6);
      var fx = fx0 + (fx1 - fx0) * t;
      if (burnt && t > 0.42 && t < 0.58) { ctx.stroke(); ctx.beginPath(); continue; }
      var fy = -gr * 0.05 + Math.sin(t * n * Math.PI * 2) * gr * 0.09 + (burnt ? Math.sin(t * Math.PI) * gr * 0.25 : 0);
      if (i === 0) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
    }
    ctx.stroke();
    noShadow(ctx);
    // glass edge and highlights
    ctx.strokeStyle = 'rgba(70,80,90,0.45)'; ctx.lineWidth = Math.max(0.7, u * 0.008);
    circle(ctx, 0, 0, gr); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(-gr * 0.42, -gr * 0.45, gr * 0.28, gr * 0.14, -0.75, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(gr * 0.45, gr * 0.42, gr * 0.12, gr * 0.06, -0.75, 0, Math.PI * 2); ctx.fill();
    // tip of the bulb
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    circle(ctx, gr * 0.05, -gr * 0.02, gr * 0.08); ctx.fill();
    if (burnt) {
      ctx.fillStyle = 'rgba(40,30,25,0.35)';
      ctx.beginPath(); ctx.ellipse(gr * 0.1, -gr * 0.35, gr * 0.6, gr * 0.35, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function porcelainBase(ctx, x, y, w, h, u) {
    shadow(ctx, u * 0.08, u * 0.03, u * 0.06);
    ctx.fillStyle = lin(ctx, x, y, x, y + h, [[0, '#ffffff'], [0.5, '#ece8df'], [1, '#c9c2b4']]);
    rr(ctx, x, y, w, h, u * 0.05); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(120,110,95,0.45)'; ctx.lineWidth = 1;
    rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, u * 0.05); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    rr(ctx, x + u * 0.03, y + u * 0.015, w - u * 0.06, h * 0.22, u * 0.03); ctx.fill();
  }

  function blade(ctx, u, len, open, w) {
    // blade along +x from the pivot at the origin; open 0..1 lifts it towards the viewer
    var phi = open * 1.15;
    var L = len * Math.cos(phi);
    ctx.save();
    ctx.rotate(-open * 0.22);
    shadow(ctx, u * (0.02 + 0.06 * open), u * (0.015 + 0.09 * open), u * (0.02 + 0.13 * open), 'rgba(30,15,0,0.45)');
    ctx.fillStyle = lin(ctx, 0, -w / 2, 0, w / 2, [[0, '#ffd9a8'], [0.35, '#d98a45'], [0.75, '#a6561e'], [1, '#6b320c']]);
    rr(ctx, -w * 0.4, -w / 2, L + w * 0.4, w, w * 0.3); ctx.fill();
    noShadow(ctx);
    // insulated handle (grows a little as it comes towards the viewer)
    var hs = 1 + open * 0.25;
    ctx.fillStyle = rad(ctx, L - u * 0.01, -u * 0.015, 0, L, 0, u * 0.05 * hs, [[0, '#6b6b6b'], [0.5, '#1d1d1d'], [1, '#000']]);
    rr(ctx, L - u * 0.03, -u * 0.04 * hs, u * 0.09 * hs, u * 0.08 * hs, u * 0.035 * hs); ctx.fill();
    // pivot rivet
    ctx.fillStyle = rad(ctx, -1, -1, 0, 0, 0, w * 0.45, BRASS);
    circle(ctx, 0, 0, w * 0.42); ctx.fill();
    ctx.restore();
  }

  function drawKnife(ctx, u, st) {
    var open = st ? st.open || 0 : 0;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, u * 0.03);
    lead(ctx, -u * 0.5, -u * 0.27, 0, Math.max(2, u * 0.03));
    lead(ctx, u * 0.27, u * 0.5, 0, Math.max(2, u * 0.03));
    porcelainBase(ctx, -u * 0.37, -u * 0.18, u * 0.74, u * 0.36, u);
    // screws holding the base
    screwHead(ctx, -u * 0.31, -u * 0.12, u * 0.026, 1);
    screwHead(ctx, u * 0.31, u * 0.12, u * 0.026, 2);
    // brass hinge block and contact jaws
    ctx.fillStyle = lin(ctx, 0, -u * 0.06, 0, u * 0.06, BRASS);
    rr(ctx, -u * 0.3, -u * 0.065, u * 0.11, u * 0.13, u * 0.015); ctx.fill();
    rr(ctx, u * 0.18, -u * 0.09, u * 0.11, u * 0.038, u * 0.01); ctx.fill();
    rr(ctx, u * 0.18, u * 0.052, u * 0.11, u * 0.038, u * 0.01); ctx.fill();
    ctx.translate(-u * 0.245, 0);
    blade(ctx, u, u * 0.56, open, u * 0.065);
    ctx.restore();
  }

  // Two-way switch, origin = common post, +x along d, +y along n; throws at (u, ±u).
  function drawSpdt(ctx, u, st) {
    var lever = st ? (st.lever != null ? st.lever : (st.state ? 1 : 0)) : 0; // 0 → throw +y, 1 → throw -y
    var lw = Math.max(2, u * 0.03);
    ctx.save();
    lead(ctx, 0, u * 0.2, 0, lw);
    ctx.lineCap = 'round';
    ctx.strokeStyle = lin(ctx, 0, 0, u, u, [[0, '#9aa1a8'], [0.5, '#eef1f3'], [1, '#6c737a']]);
    ctx.lineWidth = lw * 1.3;
    shadow(ctx, u * 0.02, u * 0.01, u * 0.02);
    ctx.beginPath(); ctx.moveTo(u * 0.64, u * 0.36); ctx.lineTo(u, u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(u * 0.64, -u * 0.36); ctx.lineTo(u, -u); ctx.stroke();
    noShadow(ctx);
    porcelainBase(ctx, u * 0.1, -u * 0.5, u * 0.66, u * 1.0, u);
    screwHead(ctx, u * 0.68, 0, u * 0.025, 1.2);
    // contact jaws at both throws
    ctx.fillStyle = lin(ctx, 0, -u * 0.06, 0, u * 0.06, BRASS);
    [1, -1].forEach(function(sg) {
      ctx.save();
      ctx.translate(u * 0.6, sg * u * 0.33);
      ctx.rotate(sg * 0.72);
      rr(ctx, -u * 0.05, -u * 0.05, u * 0.1, u * 0.025, u * 0.008); ctx.fill();
      rr(ctx, -u * 0.05, u * 0.025, u * 0.1, u * 0.025, u * 0.008); ctx.fill();
      ctx.restore();
    });
    // hinge block
    ctx.fillStyle = lin(ctx, 0, -u * 0.06, 0, u * 0.06, BRASS);
    rr(ctx, u * 0.15, -u * 0.06, u * 0.11, u * 0.12, u * 0.015); ctx.fill();
    ctx.translate(u * 0.2, 0);
    var ang = (0.5 - lever) * 2 * 0.69; // ±40°
    ctx.rotate(ang);
    blade(ctx, u, u * 0.52, Math.abs(Math.abs(0.5 - lever) * 2 - 1) * 0.6, u * 0.05);
    ctx.restore();
  }

  function drawBuzzer(ctx, u, st) {
    var lw = Math.max(2.5, u * 0.04);
    var on = st && st.buzz > 0.01;
    flyLead(ctx, [-u * 0.5, 0, -u * 0.32, 0, -u * 0.16, -u * 0.02], '#d62828', lw);
    flyLead(ctx, [u * 0.5, 0, u * 0.32, 0, u * 0.16, -u * 0.02], '#222831', lw);
    ctx.save();
    if (on) ctx.translate(Math.sin(st.t * 150) * u * 0.004, Math.cos(st.t * 130) * u * 0.004);
    // flange
    shadow(ctx, u * 0.07, u * 0.03, u * 0.05);
    ctx.fillStyle = lin(ctx, 0, -u * 0.08, 0, u * 0.08, [[0, '#3a3a3d'], [1, '#121214']]);
    rr(ctx, -u * 0.33, -u * 0.085, u * 0.66, u * 0.17, u * 0.08); ctx.fill();
    noShadow(ctx);
    ctx.fillStyle = 'rgba(200,170,110,0.9)';
    circle(ctx, -u * 0.275, 0, u * 0.024); ctx.fill();
    circle(ctx, u * 0.275, 0, u * 0.024); ctx.fill();
    // cylinder
    var r = u * 0.22;
    shadow(ctx, u * 0.08, u * 0.035, u * 0.06);
    ctx.fillStyle = rad(ctx, -r * 0.35, -r * 0.4, r * 0.1, 0, 0, r, [[0, '#4b4c50'], [0.6, '#232427'], [1, '#0b0b0c']]);
    circle(ctx, 0, 0, r); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, u * 0.01);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, Math.PI * 0.95, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = rad(ctx, -r * 0.2, -r * 0.2, 0, 0, 0, r * 0.75, [[0, '#2f3034'], [1, '#18191b']]);
    circle(ctx, 0, 0, r * 0.75); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
    circle(ctx, 0, 0, r * 0.75); ctx.stroke();
    // sound hole
    ctx.fillStyle = '#000';
    circle(ctx, 0, 0, r * 0.2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0.2, 1.6); ctx.stroke();
    if (u > 55) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '800 ' + (u * 0.045).toFixed(1) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      upright(ctx, 0, 0); ctx.fillText('BUZZER', 0, r * 0.5); ctx.restore();
    }
    ctx.restore();
  }

  function fanBlades(ctx, u, ang, alpha) {
    var R = u * 0.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.rotate(ang);
    for (var b = 0; b < 3; b++) {
      ctx.save();
      ctx.rotate(b * Math.PI * 2 / 3);
      ctx.beginPath();
      ctx.moveTo(u * 0.03, -u * 0.03);
      ctx.bezierCurveTo(R * 0.4, -u * 0.12, R * 0.95, -u * 0.11, R, -u * 0.02);
      ctx.bezierCurveTo(R * 1.02, u * 0.04, R * 0.7, u * 0.055, u * 0.03, u * 0.03);
      ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, -u * 0.1, 0, u * 0.05, [[0, '#ff8a5c'], [0.45, '#e8452c'], [1, '#9c2312']]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,200,0.55)'; ctx.lineWidth = Math.max(0.6, u * 0.006);
      ctx.beginPath(); ctx.moveTo(u * 0.06, -u * 0.035); ctx.bezierCurveTo(R * 0.45, -u * 0.1, R * 0.85, -u * 0.09, R * 0.97, -u * 0.03); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMotor(ctx, u, st) {
    var lw = Math.max(2, u * 0.03);
    lead(ctx, -u * 0.5, -u * 0.2, 0, lw);
    lead(ctx, u * 0.2, u * 0.5, 0, lw);
    ctx.save();
    // brass solder tabs
    ctx.fillStyle = lin(ctx, 0, -u * 0.04, 0, u * 0.04, BRASS);
    rr(ctx, -u * 0.255, -u * 0.035, u * 0.08, u * 0.07, u * 0.012); ctx.fill();
    rr(ctx, u * 0.175, -u * 0.035, u * 0.08, u * 0.07, u * 0.012); ctx.fill();
    // can
    var r = u * 0.2;
    shadow(ctx, u * 0.09, u * 0.04, u * 0.07);
    ctx.fillStyle = rad(ctx, -r * 0.3, -r * 0.35, r * 0.05, 0, 0, r, [[0, '#ffffff'], [0.3, '#cfd5da'], [0.75, '#8b939a'], [1, '#4f565c']]);
    circle(ctx, 0, 0, r); ctx.fill();
    noShadow(ctx);
    if (ctx.createConicGradient) {
      var cg = ctx.createConicGradient(0.4, 0, 0);
      cg.addColorStop(0, 'rgba(255,255,255,0.35)'); cg.addColorStop(0.15, 'rgba(0,0,0,0.12)');
      cg.addColorStop(0.35, 'rgba(255,255,255,0.3)'); cg.addColorStop(0.55, 'rgba(0,0,0,0.15)');
      cg.addColorStop(0.8, 'rgba(255,255,255,0.28)'); cg.addColorStop(1, 'rgba(255,255,255,0.35)');
      ctx.fillStyle = cg; circle(ctx, 0, 0, r * 0.98); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(40,45,50,0.55)'; ctx.lineWidth = Math.max(0.8, u * 0.008);
    circle(ctx, 0, 0, r * 0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(40,45,50,0.5)';
    circle(ctx, -r * 0.45, 0, r * 0.07); ctx.fill();
    circle(ctx, r * 0.45, 0, r * 0.07); ctx.fill();
    // fan (with motion blur when fast)
    var ang = st ? st.angle || 0 : 0, spd = st ? Math.abs(st.speed || 0) : 0; // rev/s
    shadow(ctx, u * 0.06, u * 0.05, u * 0.09, 'rgba(30,10,0,0.35)');
    var sweep = Math.min(Math.PI * 0.66, spd * 2 * Math.PI / 40);
    var samples = sweep > 0.05 ? 6 : 1;
    if (samples > 1) {
      noShadow(ctx);
      ctx.fillStyle = 'rgba(232,80,50,' + Math.min(0.28, sweep * 0.18) + ')';
      circle(ctx, 0, 0, u * 0.4); ctx.fill();
      for (var s = 0; s < samples; s++) fanBlades(ctx, u, ang - sweep * s / samples, 1.6 / samples);
    } else {
      fanBlades(ctx, u, ang, 1);
    }
    noShadow(ctx);
    // hub
    ctx.fillStyle = rad(ctx, -u * 0.015, -u * 0.02, 0, 0, 0, u * 0.06, [[0, '#9a9a9a'], [0.5, '#3a3a3a'], [1, '#111']]);
    circle(ctx, 0, 0, u * 0.055); ctx.fill();
    ctx.fillStyle = lin(ctx, -u * 0.02, -u * 0.02, u * 0.02, u * 0.02, CHROME);
    circle(ctx, 0, 0, u * 0.018); ctx.fill();
    ctx.restore();
  }

  var BAND_HEX = { black: '#1a1a1a', brown: '#6b3a1e', red: '#c8201e', orange: '#ee7a12', yellow: '#f2cc16',
    green: '#2b8a3e', blue: '#1e4fc7', violet: '#7a3fc4', grey: '#888', white: '#f4f4f4', gold: '#c9a233' };

  function drawResistor(ctx, u, st) {
    var lw = Math.max(2, u * 0.026);
    lead(ctx, -u * 0.5, -u * 0.22, 0, lw);
    lead(ctx, u * 0.22, u * 0.5, 0, lw);
    var bands = (st && st.bands) || ['brown', 'black', 'black', 'gold'];
    ctx.save();
    var hx = u * 0.25, eb = u * 0.078, mb = u * 0.06;
    function body() {
      ctx.beginPath();
      ctx.moveTo(-hx + eb, -eb);
      ctx.bezierCurveTo(-hx + eb * 1.8, -eb, -hx + eb * 1.9, -mb, -hx + eb * 2.4, -mb);
      ctx.lineTo(hx - eb * 2.4, -mb);
      ctx.bezierCurveTo(hx - eb * 1.9, -mb, hx - eb * 1.8, -eb, hx - eb, -eb);
      ctx.arc(hx - eb, 0, eb, -Math.PI / 2, Math.PI / 2);
      ctx.bezierCurveTo(hx - eb * 1.8, eb, hx - eb * 1.9, mb, hx - eb * 2.4, mb);
      ctx.lineTo(-hx + eb * 2.4, mb);
      ctx.bezierCurveTo(-hx + eb * 1.9, mb, -hx + eb * 1.8, eb, -hx + eb, eb);
      ctx.arc(-hx + eb, 0, eb, Math.PI / 2, Math.PI * 1.5);
      ctx.closePath();
    }
    shadow(ctx, u * 0.05, u * 0.02, u * 0.04);
    ctx.fillStyle = '#d9c08f';
    body(); ctx.fill();
    noShadow(ctx);
    ctx.save();
    body(); ctx.clip();
    var bx = [-hx + eb * 0.9, -hx + eb * 2.6, -hx + eb * 3.7, hx - eb * 1.5];
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = BAND_HEX[bands[i]] || '#000';
      ctx.fillRect(bx[i], -eb, u * 0.032, eb * 2);
    }
    ctx.fillStyle = lin(ctx, 0, -eb, 0, eb, [[0, 'rgba(0,0,0,0.45)'], [0.25, 'rgba(255,255,255,0.5)'], [0.42, 'rgba(255,255,255,0.08)'], [0.8, 'rgba(0,0,0,0.18)'], [1, 'rgba(0,0,0,0.5)']]);
    ctx.fillRect(-hx, -eb, hx * 2, eb * 2);
    if (st && st.warm > 0.02) {
      ctx.fillStyle = 'rgba(255,80,20,' + Math.min(0.5, st.warm * 0.5) + ')';
      ctx.fillRect(-hx, -eb, hx * 2, eb * 2);
    }
    ctx.restore();
    if (st && st.label && u > 48) {
      ctx.fillStyle = 'rgba(60,35,10,0.85)';
      ctx.font = '800 ' + (u * 0.085).toFixed(1) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      upright(ctx, 0, 0);
      ctx.textBaseline = 'middle';
      ctx.fillText(st.label, 0, (eb + u * 0.075) * ((ctx.getTransform && ctx.getTransform().a < -1e-6) ? -1 : 1));
      ctx.restore();
    }
    ctx.restore();
  }

  function drawLed(ctx, u, st) {
    var g = (st && st.glow) || 0, burnt = st && st.burnt;
    var lw = Math.max(1.8, u * 0.022);
    ctx.save();
    // anode (+): longer leg with a bend, cathode straight
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = lin(ctx, 0, -lw, 0, lw, [[0, '#5d6268'], [0.4, '#eef1f3'], [1, '#4b5056']]);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-u * 0.5, 0); ctx.lineTo(-u * 0.3, 0); ctx.lineTo(-u * 0.25, -u * 0.04); ctx.lineTo(-u * 0.2, 0); ctx.lineTo(-u * 0.05, 0);
    ctx.stroke();
    lead(ctx, u * 0.06, u * 0.5, 0, lw);
    var r = u * 0.13, fl = u * 0.15;
    // flange with the flat on the cathode side
    shadow(ctx, u * 0.06, u * 0.03, u * 0.05);
    ctx.fillStyle = burnt ? '#3a1a14' : (g > 0.05 ? '#ff5a3c' : '#8d1c14');
    ctx.beginPath();
    ctx.arc(0, 0, fl, Math.acos(0.82), Math.PI * 2 - Math.acos(0.82));
    ctx.closePath(); ctx.fill();
    noShadow(ctx);
    // dome
    var on = Math.min(1, g);
    ctx.fillStyle = burnt
      ? rad(ctx, -r * 0.3, -r * 0.3, 0, 0, 0, r, [[0, '#6b4a40'], [1, '#2a120c']])
      : rad(ctx, -r * 0.25, -r * 0.3, 0, 0, 0, r, [[0, on > 0.05 ? 'rgb(255,' + Math.round(200 + 55 * on) + ',' + Math.round(170 + 60 * on) + ')' : '#e35a48'],
        [0.5, on > 0.05 ? 'rgb(255,' + Math.round(70 + 60 * on) + ',40)' : '#b3231a'], [1, on > 0.05 ? '#e0200c' : '#5e0d08']]);
    circle(ctx, 0, 0, r); ctx.fill();
    // inner anvil and post seen through the epoxy
    if (!burnt) {
      ctx.fillStyle = 'rgba(40,10,8,' + (0.45 - 0.3 * on) + ')';
      ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.45); ctx.lineTo(r * 0.55, -r * 0.3); ctx.lineTo(r * 0.55, r * 0.3); ctx.lineTo(r * 0.05, r * 0.45); ctx.closePath(); ctx.fill();
      ctx.fillRect(-r * 0.55, -r * 0.12, r * 0.4, r * 0.24);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      circle(ctx, r * 0.1, -r * 0.1, r * 0.35); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.42, r * 0.3, r * 0.15, -0.7, 0, Math.PI * 2); ctx.fill();
    if (u > 45) {
      ctx.fillStyle = 'rgba(30,20,10,0.8)';
      ctx.font = '900 ' + (u * 0.1).toFixed(1) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', -u * 0.3, -u * 0.12);
      ctx.fillText('−', u * 0.3, -u * 0.1);
    }
    ctx.restore();
  }

  function drawTester(ctx, u, st) {
    var lw = Math.max(2, u * 0.03);
    lead(ctx, -u * 0.5, -u * 0.26, 0, lw);
    lead(ctx, u * 0.26, u * 0.5, 0, lw);
    ctx.save();
    // hardwood block
    var hw = u * 0.34, hh = u * 0.15;
    shadow(ctx, u * 0.08, u * 0.03, u * 0.06);
    ctx.fillStyle = lin(ctx, 0, -hh, 0, hh, [[0, '#8a4f2a'], [0.5, '#6e3a1c'], [1, '#4a240f']]);
    rr(ctx, -hw, -hh, hw * 2, hh * 2, u * 0.035); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(40,15,5,0.35)'; ctx.lineWidth = 1;
    for (var i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-hw + 2, i * hh * 0.28);
      ctx.bezierCurveTo(-hw * 0.3, i * hh * 0.28 + 2, hw * 0.3, i * hh * 0.28 - 2, hw - 2, i * hh * 0.28 + 1);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,220,180,0.15)';
    rr(ctx, -hw + 2, -hh + 2, hw * 2 - 4, hh * 0.5, u * 0.02); ctx.fill();
    // brass plates
    [-1, 1].forEach(function(sg) {
      var x0 = sg < 0 ? -u * 0.27 : u * 0.07;
      shadow(ctx, u * 0.02, u * 0.01, u * 0.015);
      ctx.fillStyle = lin(ctx, x0, -u * 0.09, x0 + u * 0.2, u * 0.09, BRASS);
      rr(ctx, x0, -u * 0.09, u * 0.2, u * 0.18, u * 0.02); ctx.fill();
      noShadow(ctx);
      screwHead(ctx, x0 + (sg < 0 ? u * 0.05 : u * 0.15), 0, u * 0.024, sg);
    });
    if (st && st.obj) {
      ctx.save();
      drawObject(ctx, st.obj, u);
      ctx.restore();
    } else if (u > 50 && st && st.hint) {
      ctx.strokeStyle = 'rgba(255,240,200,0.7)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      rr(ctx, -u * 0.1, -u * 0.1, u * 0.2, u * 0.2, u * 0.03); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------- test objects (centred on the origin, lying along x) ----------------
  function drawObject(ctx, id, u) {
    ctx.save();
    shadow(ctx, u * 0.05, u * 0.025, u * 0.045);
    switch (id) {
      case 'coin': {
        var r = u * 0.15;
        ctx.fillStyle = rad(ctx, -r * 0.4, -r * 0.4, 0, 0, 0, r, [[0, '#fff1b8'], [0.5, '#d9b04a'], [1, '#8d6a14']]);
        circle(ctx, 0, 0, r); ctx.fill();
        noShadow(ctx);
        ctx.fillStyle = rad(ctx, -r * 0.25, -r * 0.3, 0, 0, 0, r * 0.66, [[0, '#ffffff'], [0.5, '#c7ccd1'], [1, '#7d848b']]);
        circle(ctx, 0, 0, r * 0.64); ctx.fill();
        ctx.strokeStyle = 'rgba(110,80,10,0.6)'; ctx.lineWidth = 1;
        circle(ctx, 0, 0, r * 0.92); ctx.stroke();
        ctx.strokeStyle = 'rgba(70,75,80,0.5)';
        circle(ctx, 0, 0, r * 0.64); ctx.stroke();
        if (u > 40) {
          ctx.fillStyle = 'rgba(70,75,82,0.85)';
          ctx.font = '900 ' + (r * 0.55).toFixed(1) + 'px Nunito, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('100', 0, r * 0.03);
        }
        break;
      }
      case 'clip': {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = lin(ctx, 0, -u * 0.07, 0, u * 0.07, CHROME);
        ctx.lineWidth = Math.max(1.6, u * 0.018);
        var L = u * 0.2, a = u * 0.065, b = u * 0.045, c2 = u * 0.026;
        ctx.beginPath();
        ctx.moveTo(L * 0.55, -c2);
        ctx.lineTo(-L * 0.75, -c2); ctx.arc(-L * 0.75, 0, c2, -Math.PI / 2, Math.PI / 2, true);
        ctx.lineTo(L * 0.85, c2); ctx.arc(L * 0.85, -b + c2 + (b - c2), b, Math.PI / 2, -Math.PI / 2, true);
        ctx.lineTo(-L, -b); ctx.arc(-L, -b + a, a, -Math.PI / 2, Math.PI / 2, true);
        ctx.lineTo(L * 0.6, -b + a * 2);
        ctx.stroke();
        break;
      }
      case 'foil': {
        var rnd = mulberry(3), pts = [];
        for (var i = 0; i < 12; i++) {
          var an = i / 12 * Math.PI * 2;
          pts.push([Math.cos(an) * u * (0.17 + rnd() * 0.05), Math.sin(an) * u * (0.09 + rnd() * 0.04)]);
        }
        ctx.fillStyle = '#c9cfd4';
        ctx.beginPath(); pts.forEach(function(p, j) { if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill();
        noShadow(ctx);
        for (var f = 0; f < 12; f++) {
          var p1 = pts[f], p2 = pts[(f + 1) % 12];
          var l = 0.55 + rnd() * 0.45;
          ctx.fillStyle = 'rgba(' + Math.round(150 + 105 * l) + ',' + Math.round(158 + 97 * l) + ',' + Math.round(165 + 90 * l) + ',0.95)';
          ctx.beginPath(); ctx.moveTo(rnd() * u * 0.04 - u * 0.02, rnd() * u * 0.03 - u * 0.015); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8;
        for (var q = 0; q < 6; q++) { ctx.beginPath(); ctx.moveTo(pts[q * 2][0] * 0.3, pts[q * 2][1] * 0.3); ctx.lineTo(pts[q * 2][0] * 0.9, pts[q * 2][1] * 0.9); ctx.stroke(); }
        break;
      }
      case 'pencil': {
        var hl = u * 0.22, hr = u * 0.03;
        ctx.fillStyle = lin(ctx, 0, -hr, 0, hr, [[0, '#2a2c30'], [0.3, '#9aa0a8'], [0.5, '#4a4d52'], [1, '#141518']]);
        rr(ctx, -hl, -hr, hl * 2, hr * 2, hr * 0.8); ctx.fill();
        noShadow(ctx);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-hl * 0.85, -hr * 0.55, hl * 1.7, hr * 0.22);
        break;
      }
      case 'eraser': {
        var ew = u * 0.16, eh = u * 0.08;
        ctx.fillStyle = lin(ctx, 0, -eh, 0, eh, [[0, '#ffb3c1'], [0.5, '#f48ca3'], [1, '#c45d76']]);
        ctx.beginPath();
        ctx.moveTo(-ew, -eh + u * 0.02); ctx.lineTo(ew - u * 0.04, -eh); ctx.quadraticCurveTo(ew, -eh, ew, -eh + u * 0.04);
        ctx.lineTo(ew, eh - u * 0.015); ctx.lineTo(-ew + u * 0.015, eh); ctx.quadraticCurveTo(-ew - u * 0.01, eh * 0.2, -ew, -eh + u * 0.02);
        ctx.closePath(); ctx.fill();
        noShadow(ctx);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        rr(ctx, -ew * 0.85, -eh * 0.8, ew * 1.6, eh * 0.35, eh * 0.15); ctx.fill();
        break;
      }
      case 'stick': {
        var sl = u * 0.24, sh = u * 0.04;
        ctx.fillStyle = lin(ctx, 0, -sh, 0, sh, [[0, '#f7e0b5'], [0.5, '#e2c48c'], [1, '#b8955c']]);
        rr(ctx, -sl, -sh, sl * 2, sh * 2, sh); ctx.fill();
        noShadow(ctx);
        ctx.strokeStyle = 'rgba(150,110,60,0.45)'; ctx.lineWidth = 0.8;
        for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-sl + sh, k * sh * 0.45); ctx.bezierCurveTo(-sl * 0.3, k * sh * 0.45 + 1, sl * 0.3, k * sh * 0.45 - 1, sl - sh, k * sh * 0.45); ctx.stroke(); }
        break;
      }
      case 'spoon': {
        ctx.fillStyle = lin(ctx, 0, -u * 0.08, 0, u * 0.08, [[0, '#ffffff'], [0.6, '#e8eef4'], [1, '#b9c4ce']]);
        ctx.beginPath(); ctx.ellipse(u * 0.13, 0, u * 0.1, u * 0.07, 0, 0, Math.PI * 2); ctx.fill();
        rr(ctx, -u * 0.25, -u * 0.022, u * 0.32, u * 0.044, u * 0.022); ctx.fill();
        noShadow(ctx);
        ctx.fillStyle = rad(ctx, u * 0.11, -u * 0.01, 0, u * 0.13, 0, u * 0.08, [[0, 'rgba(160,175,190,0.5)'], [1, 'rgba(160,175,190,0)']]);
        ctx.beginPath(); ctx.ellipse(u * 0.13, 0, u * 0.08, u * 0.05, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.ellipse(u * 0.1, -u * 0.035, u * 0.04, u * 0.012, -0.2, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'marble': {
        var mr = u * 0.11;
        ctx.fillStyle = rad(ctx, -mr * 0.3, -mr * 0.3, 0, 0, 0, mr, [[0, 'rgba(230,250,255,0.85)'], [0.6, 'rgba(120,200,220,0.6)'], [1, 'rgba(30,90,120,0.85)']]);
        circle(ctx, 0, 0, mr); ctx.fill();
        noShadow(ctx);
        ctx.strokeStyle = 'rgba(230,60,40,0.85)'; ctx.lineWidth = Math.max(1.5, mr * 0.22); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-mr * 0.6, mr * 0.2); ctx.bezierCurveTo(-mr * 0.2, -mr * 0.6, mr * 0.2, mr * 0.6, mr * 0.6, -mr * 0.2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,40,0.8)'; ctx.lineWidth = Math.max(1, mr * 0.12);
        ctx.beginPath(); ctx.moveTo(-mr * 0.5, -mr * 0.1); ctx.bezierCurveTo(-mr * 0.1, mr * 0.5, mr * 0.3, -mr * 0.5, mr * 0.55, mr * 0.15); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.ellipse(-mr * 0.38, -mr * 0.42, mr * 0.25, mr * 0.13, -0.7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(20,60,80,0.5)'; ctx.lineWidth = 1;
        circle(ctx, 0, 0, mr); ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  // ---------------- glow pass (additive) ----------------
  function glowBulb(ctx, x, y, u, g) {
    if (g <= 0.02) return;
    var gg = Math.min(1.4, g);
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, u * (0.7 + 1.1 * gg), [[0, 'rgba(255,190,90,' + (0.28 * gg) + ')'], [0.5, 'rgba(255,170,60,' + (0.09 * gg) + ')'], [1, 'rgba(255,150,40,0)']]);
    circle(ctx, x, y, u * (0.7 + 1.1 * gg)); ctx.fill();
    var hr = u * (0.16 + 0.32 * gg);
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, hr, [[0, 'rgba(255,250,225,' + Math.min(0.9, 0.75 * gg) + ')'], [0.35, 'rgba(255,210,120,' + (0.4 * gg) + ')'], [1, 'rgba(255,170,60,0)']]);
    circle(ctx, x, y, hr); ctx.fill();
    if (gg > 0.75) {
      var f = (gg - 0.75) * 1.5, fl = u * (0.4 + 0.5 * f);
      ctx.fillStyle = lin(ctx, x - fl, y, x + fl, y, [[0, 'rgba(255,230,170,0)'], [0.5, 'rgba(255,240,200,' + (0.5 * f) + ')'], [1, 'rgba(255,230,170,0)']]);
      ctx.fillRect(x - fl, y - u * 0.008, fl * 2, u * 0.016);
      ctx.fillStyle = lin(ctx, x, y - fl, x, y + fl, [[0, 'rgba(255,230,170,0)'], [0.5, 'rgba(255,240,200,' + (0.4 * f) + ')'], [1, 'rgba(255,230,170,0)']]);
      ctx.fillRect(x - u * 0.007, y - fl, u * 0.014, fl * 2);
    }
  }
  function glowLed(ctx, x, y, u, g) {
    if (g <= 0.02) return;
    var gg = Math.min(1.4, g);
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, u * (0.5 + 0.7 * gg), [[0, 'rgba(255,60,30,' + (0.3 * gg) + ')'], [1, 'rgba(255,20,0,0)']]);
    circle(ctx, x, y, u * (0.5 + 0.7 * gg)); ctx.fill();
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, u * (0.12 + 0.18 * gg), [[0, 'rgba(255,230,210,' + Math.min(0.9, 0.8 * gg) + ')'], [0.4, 'rgba(255,90,60,' + (0.5 * gg) + ')'], [1, 'rgba(255,40,20,0)']]);
    circle(ctx, x, y, u * (0.12 + 0.18 * gg)); ctx.fill();
  }
  function glowHeat(ctx, x, y, u, heat, t) {
    if (heat <= 0.02) return;
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, u * 0.6, [[0, 'rgba(255,110,30,' + (0.35 * heat) + ')'], [1, 'rgba(255,60,0,0)']]);
    circle(ctx, x, y, u * 0.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,170,90,' + (0.45 * heat) + ')';
    ctx.lineWidth = Math.max(1, u * 0.012); ctx.lineCap = 'round';
    for (var i = -1; i <= 1; i++) {
      var ph = (t * 0.8 + i * 0.33) % 1;
      if (ph < 0) ph += 1;
      ctx.globalAlpha = (1 - ph) * Math.min(1, heat * 1.4);
      ctx.beginPath();
      for (var s = 0; s <= 10; s++) {
        var yy = y - u * 0.15 - s * u * 0.025 - ph * u * 0.2;
        var xx = x + i * u * 0.12 + Math.sin(s * 0.9 + t * 7 + i) * u * 0.018;
        if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function soundWaves(ctx, x, y, u, vol, t, ang) {
    if (vol <= 0.01) return;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round';
    for (var k = 0; k < 3; k++) {
      var ph = (t * 1.8 + k / 3) % 1;
      var r = u * (0.24 + ph * 0.36);
      ctx.strokeStyle = 'rgba(255,250,235,' + ((1 - ph) * Math.min(0.9, 0.35 + vol)) + ')';
      ctx.lineWidth = Math.max(1.2, u * 0.018);
      ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55); ctx.stroke();
    }
    ctx.restore();
  }
  function flash(ctx, x, y, u, a) {
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, u * 0.8, [[0, 'rgba(255,255,255,' + a + ')'], [0.3, 'rgba(255,230,160,' + (a * 0.6) + ')'], [1, 'rgba(255,200,120,0)']]);
    circle(ctx, x, y, u * 0.8); ctx.fill();
  }
  function smoke(ctx, x, y, r, a) {
    ctx.fillStyle = rad(ctx, x, y, 0, x, y, r, [[0, 'rgba(120,115,110,' + a + ')'], [1, 'rgba(120,115,110,0)']]);
    circle(ctx, x, y, r); ctx.fill();
  }

  // ---------------- tray thumbnails ----------------
  function thumb(canvas, type, opts) {
    var dpr = ZsCanvas.dpr();
    var cw = canvas.clientWidth || parseInt(canvas.getAttribute('width'), 10) || 64;
    var ch = canvas.clientHeight || parseInt(canvas.getAttribute('height'), 10) || 48;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    var ctx = ZsCanvas.get2d(canvas);
    if (!ctx) return;
    var old = DPR; DPR = dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    var u = Math.min(cw * 0.95, ch * 1.9);
    ctx.save();
    if (type === 'wire') {
      var pts = [], cum = [0];
      for (var i = 0; i <= 24; i++) {
        var t = i / 24;
        pts.push(cw * 0.12 + t * cw * 0.76, ch * 0.5 + Math.sin(t * Math.PI * 2) * ch * 0.22);
        if (i) cum.push(cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]));
      }
      drawWire(ctx, pts, cum, (opts && opts.color) || '#d62828', u * 0.75);
    } else if (type === 'spdt') {
      var su = ch * 0.48;
      ctx.translate(cw / 2 - su * 0.5, ch / 2);
      drawSpdt(ctx, su, { lever: 0 });
    } else if (type && type.indexOf('obj:') === 0) {
      ctx.translate(cw / 2, ch / 2);
      drawObject(ctx, type.slice(4), Math.min(cw * 1.9, ch * 2.6));
    } else {
      ctx.translate(cw / 2, ch / 2);
      var st = opts || {};
      drawPart(ctx, type, u, st);
    }
    ctx.restore();
    DPR = old;
  }

  return {
    setDpr: setDpr, makeBoard: makeBoard, nut: nut, drawWire: drawWire, dot: dot,
    drawPart: drawPart, drawObject: drawObject, glowBulb: glowBulb, glowLed: glowLed,
    glowHeat: glowHeat, soundWaves: soundWaves, flash: flash, smoke: smoke, thumb: thumb,
    pointAt: pointAt, WIRE_COLORS: WIRE_COLORS, BAND_HEX: BAND_HEX
  };
})();
