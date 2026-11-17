/* ================================================================
   TALLER DE MÁQUINAS — scenes (js/taller-scenes.js)
   One drawn scene per simple machine, plus the chain-reaction parts.

   TallerScenes.draw(g, W, H, st) paints a machine and returns where
   its handle is, so js/taller.js can turn a drag into motion:
     { hx, hy }          the handle (screen px)
     { ux, uy, travel }  straight drag: direction and px for u 0 → 1
     { cx, cy, turns }   turning drag: centre and turns for u 0 → 1
   st = { kind, p (inputs), res (TallerPhysics result), u (0..1),
          strain (0..1, too heavy), t (s), lever (preset), back (cached
          backdrop canvas or null) }
   ================================================================ */

var TallerScenes = (function() {
  'use strict';

  var A = TallerArt, TAU = Math.PI * 2;

  // World box (metres) shown for each machine; the camera fits it.
  function extents(st) {
    switch (st.kind) {
      case 'lever':
        var L = st.lever.len;
        if (st.lever.id === 'rod') return [-0.35, 2.9, -0.05, 1.95];
        if (st.lever.id === 'barrow') return [-0.4, 2.0, -0.05, 1.15];
        if (st.lever.id === 'crowbar') return [-0.4, 1.9, -0.05, 1.1];
        return [-0.45, L + 0.45, -0.05, 1.75];
      case 'pulley': return [0.25, 2.75, -0.05, 2.9];
      case 'incline':
        var run = Math.max(2.2, Math.sqrt(Math.max(0, st.p.length * st.p.length - st.p.height * st.p.height)));
        return [3.6 - run - 0.45, 5.3, -0.05, Math.max(1.1, st.p.height) + 1.0];
      case 'wedge': return [-0.3, 1.1, -0.05, 1.32];
      case 'wheel': return [-0.95, 1.3, -0.05, 1.95];
      case 'screw': return [-0.62, 1.05, -0.05, 1.18];
    }
    return [0, 3, 0, 2];
  }
  function camFor(st, W, H) {
    var e = extents(st), pad = 10;
    var s = Math.min((W - pad * 2) / (e[1] - e[0]), (H - pad * 2) / (e[3] - e[2]));
    var cx = (e[0] + e[1]) / 2, cy = (e[2] + e[3]) / 2;
    return { s: s, ox: W / 2 - cx * s, oy: H / 2 + cy * s };
  }

  function kg(n) { return (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10) + ' kg'; }

  // ---------------------------------------------------------------- lever
  function lever(g, cam, st) {
    var P = st.lever, p = st.p, L = P.len, s = cam.s;
    var X = function(x) { return A.X(cam, x); }, Y = function(y) { return A.Y(cam, y); };
    var f = p.fulcrum, u = st.u, shake = st.strain ? Math.sin(st.t * 60) * 1.2 * st.strain : 0;
    var hF, th0, th1;
    var sideL = p.loadPos < f ? -1 : 1;
    if (P.id === 'seesaw') hF = 0.55;
    if (P.id === 'crowbar') { hF = 0.1; th0 = Math.atan2(hF - 0.02, f); th1 = th0 - 0.16; }
    if (P.id === 'barrow') { hF = 0.2; th0 = -0.14; th1 = 0.07; }
    if (P.id === 'rod') { hF = 0.95; th0 = 0.18; th1 = 0.55; }
    if (P.id === 'seesaw') {
      // load end starts on the ground, finishes up the same angle
      var a0 = Math.min(0.24, Math.asin(Math.min(0.95, hF / Math.max(0.3, Math.abs(p.loadPos - f)))));
      th0 = sideL < 0 ? a0 : -a0; th1 = -th0;
    }
    var th = th0 + (th1 - th0) * u + shake * 0.004;
    var ca = Math.cos(th), sa = Math.sin(th);
    function pt(d) { var dx = d - f; return [f + dx * ca, hF + dx * sa]; }   // a point on the bar
    var A0 = pt(0), A1 = pt(L);

    // fulcrum
    if (P.id === 'seesaw') {
      g.save();
      var bx = X(f), by = Y(0), hh = hF * s, bw = 0.5 * s;
      A.shadow(g, 8, 4, 0.3);
      g.beginPath(); g.moveTo(bx - bw / 2, by); g.lineTo(bx, by - hh); g.lineTo(bx + bw / 2, by); g.closePath();
      var gr = g.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0); gr.addColorStop(0, '#475569'); gr.addColorStop(0.5, '#94a3b8'); gr.addColorStop(1, '#334155');
      g.fillStyle = gr; g.fill(); A.noShadow(g);
      g.fillStyle = '#1e293b'; g.beginPath(); g.arc(bx, by - hh, Math.max(4, s * 0.04), 0, TAU); g.fill();
      g.restore();
    } else if (P.id === 'crowbar') {
      var fx = X(f), fy = Y(0);
      A.woodBeam(g, fx - 0.08 * s, fy - hF * s / 2, fx + 0.08 * s, fy - hF * s / 2, hF * s, 41, '#a8743f');
    }

    // load drawn before or after the bar
    var lp = pt(p.loadPos), size;
    if (P.id === 'seesaw') {
      size = (0.32 + 0.22 * Math.sqrt(p.mass / 100)) * s;
      var nx = -sa, ny = ca;
      g.save(); g.translate(X(lp[0]) - nx * 0.04 * s * 0, Y(lp[1]) - 0.04 * s); g.rotate(-th);
      A.crate(g, 0, 0, size, kg(p.mass), 3); g.restore();
      A.woodBeam(g, X(A0[0]), Y(A0[1]), X(A1[0]), Y(A1[1]), 0.08 * s, 9, '#c58b4c');
    } else if (P.id === 'crowbar') {
      size = (0.36 + 0.2 * Math.sqrt(p.mass / 200)) * s;
      var rockY = Math.max(0, lp[1] - 0.02);
      A.boulder(g, X(lp[0]) - size * 0.15, Y(rockY), size, 8);
      A.tag(g, X(lp[0]) - size * 0.15, Y(rockY) - size * 1.0, kg(p.mass), 'rgba(255,255,255,0.92)', '#1f2937', 12);
      A.steelBar(g, X(A0[0]), Y(A0[1]), X(A1[0]), Y(A1[1]), 0.035 * s, '#4b5563');
    } else if (P.id === 'barrow') {
      // wheel at the fulcrum
      var wx = X(0), wy = Y(hF), wr = hF * s;
      g.save(); A.shadow(g, 6, 3, 0.3);
      g.beginPath(); g.arc(wx, wy, wr, 0, TAU); g.fillStyle = '#1f2937'; g.fill(); A.noShadow(g);
      g.beginPath(); g.arc(wx, wy, wr * 0.62, 0, TAU); g.fillStyle = '#dc2626'; g.fill();
      g.strokeStyle = '#fca5a5'; g.lineWidth = 1.5; for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + u; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * wr * 0.6, wy + Math.sin(a) * wr * 0.6); g.stroke(); }
      g.beginPath(); g.arc(wx, wy, wr * 0.14, 0, TAU); g.fillStyle = '#e5e7eb'; g.fill();
      g.restore();
      // tray
      var t0 = pt(0.12), t1 = pt(1.15), tH = 0.32;
      var nxx = -sa, nyy = ca;
      g.save();
      g.beginPath();
      g.moveTo(X(t0[0]), Y(t0[1]));
      g.lineTo(X(t0[0] + nxx * tH - ca * 0.08), Y(t0[1] + nyy * tH - sa * 0.08));
      g.lineTo(X(t1[0] + nxx * tH + ca * 0.1), Y(t1[1] + nyy * tH + sa * 0.1));
      g.lineTo(X(t1[0]), Y(t1[1])); g.closePath();
      var tg = g.createLinearGradient(0, Y(t0[1] + tH), 0, Y(t0[1])); tg.addColorStop(0, '#16a34a'); tg.addColorStop(1, '#14532d');
      A.shadow(g, 8, 4, 0.3); g.fillStyle = tg; g.fill(); A.noShadow(g);
      // soil heap where the load sits
      var sp = pt(p.loadPos), heap = (0.12 + 0.12 * Math.sqrt(p.mass / 80));
      g.beginPath();
      g.ellipse(X(sp[0] + nxx * tH), Y(sp[1] + nyy * tH), Math.min(0.42, 0.18 + heap) * s, heap * s, -th, Math.PI, TAU);
      var sg = g.createRadialGradient(X(sp[0]), Y(sp[1] + tH + heap), 2, X(sp[0]), Y(sp[1] + tH), heap * s * 1.6); sg.addColorStop(0, '#8b5e34'); sg.addColorStop(1, '#4a2f17');
      g.fillStyle = sg; g.fill();
      g.restore();
      A.tag(g, X(sp[0] + nxx * (tH + heap + 0.1)), Y(sp[1] + nyy * (tH + heap + 0.1)), kg(p.mass), 'rgba(255,255,255,0.92)', '#1f2937', 12);
      // legs
      var lg = pt(1.05);
      A.steelBar(g, X(lg[0]), Y(lg[1]), X(lg[0] + 0.02), Y(Math.max(0, lg[1] - 0.2 - 0.02)), 0.03 * s, '#374151');
      A.steelBar(g, X(A0[0]), Y(A0[1]), X(A1[0]), Y(A1[1]), 0.04 * s, '#6b7280');
      g.fillStyle = '#111827'; var hg = pt(L - 0.12); A.rr(g, X(hg[0]) - 0.04 * s, Y(hg[1]) - 0.03 * s, 0.24 * s, 0.06 * s, 0.03 * s);
    } else if (P.id === 'rod') {
      // water tub under the fish
      var tubX = X(2.35), tubY = Y(0);
      g.save(); A.shadow(g, 8, 3, 0.25);
      A.rr(g, tubX - 0.38 * s, tubY - 0.28 * s, 0.76 * s, 0.28 * s, 8); g.fillStyle = '#64748b'; g.fill(); A.noShadow(g);
      g.fillStyle = '#38bdf8'; g.fillRect(tubX - 0.34 * s, tubY - 0.25 * s, 0.68 * s, 0.06 * s);
      g.restore();
      // rod: tapered, cork grip at the butt
      g.save(); g.lineCap = 'round';
      var bxs = X(A0[0]), bys = Y(A0[1]), txs = X(A1[0]), tys = Y(A1[1]);
      g.strokeStyle = '#1f2937'; g.lineWidth = 0.035 * s; g.beginPath(); g.moveTo(bxs, bys); g.lineTo(X(pt(1.2)[0]), Y(pt(1.2)[1])); g.stroke();
      g.lineWidth = 0.02 * s; g.beginPath(); g.moveTo(X(pt(1.2)[0]), Y(pt(1.2)[1])); g.lineTo(X(pt(2.0)[0]), Y(pt(2.0)[1])); g.stroke();
      g.lineWidth = 0.01 * s; g.beginPath(); g.moveTo(X(pt(2.0)[0]), Y(pt(2.0)[1])); g.lineTo(txs, tys); g.stroke();
      g.strokeStyle = '#c8a373'; g.lineWidth = 0.05 * s; g.beginPath(); g.moveTo(bxs, bys); g.lineTo(X(pt(0.35)[0]), Y(pt(0.35)[1])); g.stroke();
      g.restore();
      // line and fish
      var fy = Math.max(0.3, A1[1] - 0.55);
      g.strokeStyle = 'rgba(30,41,59,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(txs, tys); g.lineTo(X(A1[0]), Y(fy)); g.stroke();
      var fs = (0.16 + 0.05 * p.mass) * s;
      g.save(); g.translate(X(A1[0]), Y(fy) + fs * 0.55); g.rotate(Math.PI / 2);
      var fg = g.createLinearGradient(0, -fs * 0.3, 0, fs * 0.3); fg.addColorStop(0, '#64748b'); fg.addColorStop(0.5, '#cbd5e1'); fg.addColorStop(1, '#f8fafc');
      g.beginPath(); g.ellipse(0, 0, fs * 0.55, fs * 0.22, 0, 0, TAU); g.fillStyle = fg; g.fill();
      g.beginPath(); g.moveTo(fs * 0.5, 0); g.lineTo(fs * 0.85, -fs * 0.2); g.lineTo(fs * 0.85, fs * 0.2); g.closePath(); g.fillStyle = '#64748b'; g.fill();
      g.beginPath(); g.arc(-fs * 0.36, -fs * 0.05, fs * 0.04, 0, TAU); g.fillStyle = '#111827'; g.fill();
      g.restore();
      A.tag(g, X(A1[0]) + 0.32 * s, Y(fy) + fs * 0.5, kg(p.mass), 'rgba(255,255,255,0.92)', '#1f2937', 12);
      // the fulcrum hand (holding the butt)
      A.hand(g, bxs, bys - 8, 0, 0.12 * s, false);
    }

    // effort: spring scale + hand
    var ep = pt(p.effortPos), ex = X(ep[0]), ey = Y(ep[1]);
    var dirY = P.effort.dir === 'down' ? 1 : -1, len = Math.max(54, 0.32 * s);
    var reading = Math.min(st.res.effort, st.strength);
    var sc = A.springScale(g, ex, ey + dirY * 2, 0, dirY, len, reading, Math.max(st.strength * 1.2, 10), st.strain > 0);
    A.hand(g, sc.tipX, sc.tipY + (dirY > 0 ? 4 : -4), dirY > 0 ? 0 : Math.PI, Math.max(18, 0.12 * s), st.strain > 0);
    A.tag(g, sc.tipX + 0.0, sc.tipY + dirY * Math.max(28, 0.18 * s), kg(reading), st.strain ? '#dc2626' : '#1d4ed8', '#fff', 13);
    // arms (distance to the fulcrum)
    if (st.showArms) {
      var fp = pt(f), lpp = pt(p.loadPos);
      var off = P.effort.dir === 'down' ? -18 : 18;
      A.dimension(g, X(fp[0]), Y(fp[1]), X(lpp[0]), Y(lpp[1]), st.armLabel ? st.armLabel(st.res.armLoad) : '', '#b45309', P.id === 'rod' ? 18 : -off);
      A.dimension(g, X(fp[0]), Y(fp[1]), X(ep[0]), Y(ep[1]), st.armLabel ? st.armLabel(st.res.armEffort) : '', '#1d4ed8', P.id === 'rod' ? -18 : off);
      // fulcrum marker
      g.fillStyle = '#16a34a'; g.beginPath(); g.moveTo(X(fp[0]), Y(fp[1]) + 6); g.lineTo(X(fp[0]) - 6, Y(fp[1]) + 15); g.lineTo(X(fp[0]) + 6, Y(fp[1]) + 15); g.closePath(); g.fill();
    }
    // the drag goes along the effort direction; u 0→1 moves the effort end this far
    var e0 = (function() { var dx = p.effortPos - f; return hF + dx * Math.sin(th0); })();
    var e1 = (function() { var dx = p.effortPos - f; return hF + dx * Math.sin(th1); })();
    return { hx: sc.tipX, hy: sc.tipY, ux: 0, uy: e1 < e0 ? 1 : -1, travel: Math.max(30, Math.abs(e1 - e0) * s),
             fulcrumX: X(f), fulcrumY: Y(hF), loadX: X(lp[0]), loadY: Y(lp[1]) };
  }

  // ---------------------------------------------------------------- pulley
  function pulley(g, cam, st) {
    var s = cam.s, n = st.res.n, u = st.u;
    var X = function(x) { return A.X(cam, x); }, Y = function(y) { return A.Y(cam, y); };
    var lift = 0.9 * u, beamY = 2.75;
    var r = 0.075, sp = 2 * r, x0 = 1.0;
    var yU = 2.42, crateS = 0.34 + 0.18 * Math.sqrt(st.p.mass / 100);
    var crateBottom = lift, crateTop = crateBottom + crateS, yL = crateTop + 0.32;
    if (n === 1) yL = null;
    // ceiling beam and its brackets
    A.woodBeam(g, X(-0.3), Y(beamY), X(3.6), Y(beamY), 0.16 * s, 4, '#9a6534');
    var segX = []; for (var i = 0; i <= n; i++) segX.push(x0 + i * sp);
    // sheaves: between segment i and i+1; top when (n-1-i) is even
    var tops = [], bots = [];
    for (var k = 0; k < n; k++) {
      var cx = (segX[k] + segX[k + 1]) / 2;
      if ((n - 1 - k) % 2 === 0) tops.push(cx); else bots.push(cx);
    }
    // upper block hanging from the beam
    var ublkX = (tops[0] + tops[tops.length - 1]) / 2, uw = (tops[tops.length - 1] - tops[0]) + 2.6 * r;
    g.strokeStyle = '#374151'; g.lineWidth = Math.max(2, s * 0.012);
    g.beginPath(); g.moveTo(X(ublkX), Y(beamY - 0.08)); g.lineTo(X(ublkX), Y(yU + r * 1.6)); g.stroke();
    A.block(g, X(ublkX), Y(yU), uw * s, 2.8 * r * s);
    // rope (behind the sheave faces)
    var hand0 = 1.35, pulled = n * lift, handY = Math.max(0.55, hand0 - pulled), coil = Math.max(0, pulled - (hand0 - 0.55));
    var pts;
    var ropeW = Math.max(2.5, s * 0.014);
    // vertical segments
    for (var j = 0; j < n; j++) {
      var top = yU, bot = yL == null ? crateTop + 0.05 : yL;
      var isTopAnchor = (j === 0 && n % 2 === 0);
      var t0 = isTopAnchor ? beamY - 0.1 : top;
      var b0 = (j === 0 && n % 2 === 1) ? (yL == null ? crateTop + 0.05 : yL - r * 1.2) : bot;
      A.rope(g, [[X(segX[j]), Y(t0)], [X(segX[j]), Y(b0)]], ropeW);
    }
    // the pull segment, down to the scale
    var scaleTop = handY + 0.55;
    A.rope(g, [[X(segX[n]), Y(yU)], [X(segX[n]), Y(scaleTop)]], ropeW);
    // sheaves
    var rot = -pulled / r;
    tops.forEach(function(cx) { A.sheave(g, X(cx), Y(yU), r * s * 1.02, rot); });
    if (yL != null) {
      var lblkX = (bots[0] + bots[bots.length - 1]) / 2, lw = (bots[bots.length - 1] - bots[0]) + 2.6 * r;
      A.block(g, X(lblkX), Y(yL), lw * s, 2.8 * r * s);
      bots.forEach(function(cx) { A.sheave(g, X(cx), Y(yL), r * s * 1.02, -rot); });
      // rope wraps
      g.strokeStyle = '#d8b878'; g.lineWidth = ropeW;
      // hook from lower block to the crate
      A.hook(g, X(lblkX), Y(yL - r * 1.3), 0.12 * s);
      g.strokeStyle = '#4b5563'; g.lineWidth = Math.max(1.5, s * 0.008);
      g.beginPath(); g.moveTo(X(lblkX) - 0.2 * s * 0 , Y(yL - r * 1.3 - 0.1)); g.lineTo(X(1.0 + n * r) - crateS * s * 0.42, Y(crateTop)); g.moveTo(X(lblkX), Y(yL - r * 1.3 - 0.1)); g.lineTo(X(1.0 + n * r) + crateS * s * 0.42, Y(crateTop)); g.stroke();
    } else {
      g.strokeStyle = '#4b5563'; g.lineWidth = Math.max(1.5, s * 0.008);
      g.beginPath(); g.moveTo(X(segX[0]), Y(crateTop + 0.05)); g.lineTo(X(segX[0]) - crateS * s * 0.42, Y(crateTop)); g.moveTo(X(segX[0]), Y(crateTop + 0.05)); g.lineTo(X(segX[0]) + crateS * s * 0.42, Y(crateTop)); g.stroke();
    }
    var crateX = yL == null ? segX[0] : 1.0 + n * r;
    A.crate(g, X(crateX), Y(crateBottom), crateS * s, kg(st.p.mass), 2);
    // floor shadow under a lifted crate
    if (lift > 0.02) { g.fillStyle = 'rgba(0,0,0,' + (0.18 - lift * 0.1) + ')'; g.beginPath(); g.ellipse(X(crateX), Y(0) + 2, crateS * s * 0.55, 4, 0, 0, TAU); g.fill(); }
    // spring scale and hand on the pull rope
    var reading = Math.min(st.res.effort, st.strength);
    var sc = A.springScale(g, X(segX[n]), Y(scaleTop), 0, 1, Math.max(50, 0.42 * s), reading, Math.max(st.strength * 1.2, 10), st.strain > 0);
    A.hand(g, sc.tipX, sc.tipY + 4, 0, Math.max(18, 0.12 * s), st.strain > 0);
    A.tag(g, sc.tipX + Math.max(40, 0.3 * s), sc.tipY - 10, kg(reading), st.strain ? '#dc2626' : '#1d4ed8', '#fff', 13);
    // rope coil on the floor (rope pulled past the hand)
    if (coil > 0.01) {
      var cxp = X(segX[n] + 0.42), cyp = Y(0) - 4;
      for (var c = 0; c < Math.min(9, 1 + coil * 3); c++) {
        g.strokeStyle = c % 2 ? '#c9a56b' : '#b08d55'; g.lineWidth = ropeW;
        g.beginPath(); g.ellipse(cxp, cyp - c * ropeW * 0.7, (0.16 + 0.015 * c) * s, 0.04 * s, 0, 0, TAU); g.stroke();
      }
    }
    // rope-count tag over the supporting segments
    if (st.showArms) {
      var midY = yL == null ? crateTop + 0.45 : (yU + yL) / 2;
      A.tag(g, X(segX[0]) - 46, Y(midY), st.ropeLabel ? st.ropeLabel(n) : String(n), '#b45309', '#fff', 12);
    }
    return { hx: sc.tipX, hy: sc.tipY, ux: 0, uy: 1, travel: Math.max(60, 0.9 * s * 0.9) };
  }

  // ---------------------------------------------------------------- incline
  function incline(g, cam, st) {
    var s = cam.s, p = st.p, H = p.height, L = p.length, res = st.res;
    var X = function(x) { return A.X(cam, x); }, Y = function(y) { return A.Y(cam, y); };
    var top = 3.6, run = res.run, foot = top - run, ang = Math.atan2(H, run);
    // loading dock
    g.save(); A.shadow(g, 10, 4, 0.3);
    var dg = g.createLinearGradient(0, Y(H), 0, Y(0)); dg.addColorStop(0, '#a8a29e'); dg.addColorStop(1, '#78716c');
    g.fillStyle = dg; g.fillRect(X(top), Y(H), 1.6 * s, H * s); A.noShadow(g);
    g.strokeStyle = 'rgba(41,37,36,0.35)'; g.lineWidth = 1;
    for (var by = 0.15; by < H; by += 0.15) { g.beginPath(); g.moveTo(X(top), Y(by)); g.lineTo(X(top + 1.6), Y(by)); g.stroke(); }
    for (var row = 0; row * 0.15 < H; row++) for (var bx = (row % 2) * 0.15; bx < 1.6; bx += 0.3) { g.beginPath(); g.moveTo(X(top + bx), Y(row * 0.15)); g.lineTo(X(top + bx), Y(Math.min(H, row * 0.15 + 0.15))); g.stroke(); }
    g.fillStyle = '#57534e'; g.fillRect(X(top), Y(H) - 4, 1.6 * s, 5);
    g.restore();
    // ramp: two planks seen side-on with a trestle
    A.woodBeam(g, X(foot - 0.03), Y(0.02), X(top + 0.03), Y(H + 0.02), 0.07 * s, 12, '#c58b4c');
    if (H > 0.4) A.woodBeam(g, X(foot + run * 0.55), Y(0.02), X(foot + run * 0.55), Y(H * 0.55 - 0.02), 0.05 * s, 13, '#9a6534');
    // crate on the ramp, or on the dock at the end
    var cs = (0.3 + 0.12 * Math.sqrt(p.mass / 60)), d = 0.05 + (L - 0.05 - cs * 0.6) * st.u;
    var cx = foot + Math.cos(ang) * (d + cs / 2), cy = Math.sin(ang) * (d + cs / 2) + 0.035;
    g.save(); g.translate(X(cx), Y(cy)); g.rotate(-ang);
    A.crate(g, 0, 0, cs * s, kg(p.mass), 5);
    g.restore();
    // rope up the ramp to the scale and the hand on the dock
    var ux = Math.cos(ang), uy = Math.sin(ang);
    var ra = [cx + ux * cs / 2 - uy * cs * 0.5, cy + uy * cs / 2 + ux * cs * 0.5];
    var len = Math.max(50, 0.42 * s);
    var sx = X(ra[0] + ux * 0.18), sy = Y(ra[1] + uy * 0.18);
    A.rope(g, [[X(ra[0]), Y(ra[1])], [sx, sy]], Math.max(2.5, s * 0.012));
    var reading = Math.min(res.effort, st.strength);
    var sc = A.springScale(g, sx, sy, ux, -uy, len, reading, Math.max(st.strength * 1.2, 10), st.strain > 0);
    A.hand(g, sc.tipX, sc.tipY, -ang - Math.PI / 2, Math.max(18, 0.1 * s), st.strain > 0);
    A.tag(g, sc.tipX, sc.tipY - Math.max(26, 0.16 * s), kg(reading), st.strain ? '#dc2626' : '#1d4ed8', '#fff', 13);
    if (st.showArms) {
      A.dimension(g, X(top + 1.7), Y(0), X(top + 1.7), Y(H), st.armLabel ? st.armLabel(H) : '', '#b45309', -10);
      A.dimension(g, X(foot), Y(0), X(top), Y(H), st.armLabel ? st.armLabel(L) : '', '#1d4ed8', 22);
    }
    return { hx: sc.tipX, hy: sc.tipY, ux: ux, uy: -uy, travel: Math.max(60, (L - cs) * s) };
  }

  // ---------------------------------------------------------------- wedge
  function wedge(g, cam, st) {
    var s = cam.s, p = st.p, u = st.u, res = st.res;
    var X = function(x) { return A.X(cam, x); }, Y = function(y) { return A.Y(cam, y); };
    var Lw = p.length, T = p.thickness;
    // chopping block (stump)
    var stumpH = 0.16, logH = 0.46, logW = 0.34, cx = 0.4;
    g.save(); A.shadow(g, 10, 4, 0.3);
    var sg = g.createLinearGradient(X(cx - 0.32), 0, X(cx + 0.32), 0); sg.addColorStop(0, '#5b3a1e'); sg.addColorStop(0.5, '#8b5e34'); sg.addColorStop(1, '#4a2f17');
    g.fillStyle = sg; A.rr(g, X(cx - 0.32), Y(stumpH), 0.64 * s, stumpH * s, 6); g.fill(); A.noShadow(g);
    g.fillStyle = '#d6b27c'; g.beginPath(); g.ellipse(X(cx), Y(stumpH), 0.32 * s, 0.05 * s, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,80,40,0.45)'; g.lineWidth = 1; for (var ring = 1; ring < 5; ring++) { g.beginPath(); g.ellipse(X(cx), Y(stumpH), 0.32 * s * ring / 5, 0.05 * s * ring / 5, 0, 0, TAU); g.stroke(); }
    g.restore();
    // the log: splits open as the wedge goes in (only if the push is enough)
    var depth = Lw * u, split = st.strain ? 0 : (u >= 0.999 ? 1 : 0);
    var open = Math.min(T, (depth / Lw) * T) * (st.strain ? 0.2 : 1), fall = split ? Math.min(1, (st.t - (st.splitAt || st.t)) * 2.5) : 0;
    var baseY = stumpH, topY = stumpH + logH;
    [-1, 1].forEach(function(side) {
      g.save();
      var tilt = side * (Math.atan2(open / 2, logH) + fall * 0.9);
      g.translate(X(cx + side * open / 4), Y(baseY)); g.rotate(tilt);
      var w2 = logW / 2 * s;
      var lgr = g.createLinearGradient(side < 0 ? -w2 : 0, 0, side < 0 ? 0 : w2, 0);
      lgr.addColorStop(0, side < 0 ? '#6b4423' : '#e7c895'); lgr.addColorStop(1, side < 0 ? '#e7c895' : '#6b4423');
      g.fillStyle = lgr;
      g.fillRect(side < 0 ? -w2 : 0, -logH * s, w2, logH * s);
      // bark on the outer side
      g.fillStyle = '#4a2f17'; g.fillRect(side < 0 ? -w2 : w2 - 0.035 * s, -logH * s, 0.035 * s, logH * s);
      g.strokeStyle = 'rgba(60,35,15,0.4)'; g.lineWidth = 1;
      for (var gy = 0.06; gy < logH; gy += 0.07) { g.beginPath(); g.moveTo(side < 0 ? -w2 : w2, -gy * s); g.lineTo(side < 0 ? -w2 + 0.035 * s : w2 - 0.035 * s, -(gy + 0.03) * s); g.stroke(); }
      // end grain on top
      g.fillStyle = '#d6b27c'; g.beginPath(); g.ellipse(side < 0 ? -w2 / 2 : w2 / 2, -logH * s, w2 / 2, 0.035 * s, 0, 0, TAU); g.fill();
      g.restore();
    });
    // crack line
    if (!split) {
      g.strokeStyle = '#3b2410'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(X(cx), Y(topY)); g.lineTo(X(cx + 0.005), Y(topY - Math.min(logH, depth * 2.4 + 0.02))); g.stroke();
    }
    // the wedge (steel), tip down into the log
    var tipY = topY - depth;
    g.save(); A.shadow(g, 6, 3, 0.35);
    g.beginPath(); g.moveTo(X(cx), Y(tipY)); g.lineTo(X(cx - T / 2), Y(tipY + Lw)); g.lineTo(X(cx + T / 2), Y(tipY + Lw)); g.closePath();
    var wg = g.createLinearGradient(X(cx - T / 2), 0, X(cx + T / 2), 0); wg.addColorStop(0, '#64748b'); wg.addColorStop(0.45, '#e2e8f0'); wg.addColorStop(1, '#475569');
    g.fillStyle = wg; g.fill(); A.noShadow(g);
    g.fillStyle = '#334155'; g.fillRect(X(cx - T / 2) - 2, Y(tipY + Lw) - 3, T * s + 4, 4);
    g.restore();
    // push arrow on top + side push arrows
    var push = st.push;
    var ay = Y(tipY + Lw) - 8;
    var alen = Math.min(Math.max(34, 0.2 * s), Math.max(20, ay - 34));
    A.arrow(g, X(cx), ay - alen, X(cx), ay, st.strain ? '#dc2626' : '#1d4ed8', 5);
    A.tag(g, X(cx) + 62, ay - alen + 6, (st.pushLabel || '') + kg(push), st.strain ? '#dc2626' : '#1d4ed8', '#fff', 13);
    var spread = push * Lw / T;
    if (u > 0.05 && st.showArms) {
      var my = Y(topY - depth * 0.4);
      A.arrow(g, X(cx - 0.03), my, X(cx - 0.03) - Math.min(70, 18 + spread / 12), my, '#b45309', 4);
      A.arrow(g, X(cx + 0.03), my, X(cx + 0.03) + Math.min(70, 18 + spread / 12), my, '#b45309', 4);
      A.tag(g, X(cx) + Math.min(70, 18 + spread / 12) + 46, my, kg(spread), '#b45309', '#fff', 12);
    }
    if (st.showArms) {
      A.dimension(g, X(cx - T / 2 - 0.04), Y(tipY), X(cx - T / 2 - 0.04), Y(tipY + Lw), '', '#1d4ed8', -8);
      A.tag(g, X(cx - T / 2 - 0.04) - 50, Y(tipY + Lw * 0.45), (st.lenLabel || '') + (st.armLabel ? st.armLabel(Lw) : ''), '#fff', '#1d4ed8', 11);
      A.tag(g, X(cx - T / 2 - 0.04) - 50, Y(tipY + Lw) - 2, (st.thickLabel || '') + (st.armLabel ? st.armLabel(T) : ''), '#fff', '#b45309', 11);
    }
    A.tag(g, X(cx + 0.5), Y(0.12), (st.resistLabel || '') + kg(res.load), '#fff8eb', '#7c2d12', 12);
    return { hx: X(cx), hy: ay - 20, ux: 0, uy: 1, travel: Math.max(40, Lw * s * 1.3) };
  }

  // ---------------------------------------------------------------- wheel and axle
  function wheel(g, cam, st) {
    var s = cam.s, p = st.p, u = st.u, R = p.wheelR, r = p.axleR;
    var X = function(x) { return A.X(cam, x); }, Y = function(y) { return A.Y(cam, y); };
    var turns = 3, ang = -u * turns * TAU, lift = r * u * turns * TAU;
    var ax = 0, ay = 1.55;
    // well: stone ring cut away to show the shaft
    var wallH = 0.7, inner = 0.42;
    g.save();
    g.fillStyle = '#1e293b'; g.fillRect(X(-inner), Y(wallH), inner * 2 * s, wallH * s + 2);
    var wg = g.createLinearGradient(0, Y(wallH), 0, Y(0)); wg.addColorStop(0, '#0f172a'); wg.addColorStop(1, '#1e3a8a');
    g.fillStyle = wg; g.fillRect(X(-inner), Y(wallH), inner * 2 * s, wallH * s);
    g.fillStyle = 'rgba(56,189,248,0.55)'; g.fillRect(X(-inner), Y(0.12), inner * 2 * s, 0.12 * s);
    [-1, 1].forEach(function(side) {
      var x0 = side < 0 ? -inner - 0.22 : inner;
      for (var row = 0; row < 5; row++) for (var c = 0; c < 2; c++) {
        var bx = X(x0 + c * 0.11 + (row % 2) * 0.03), by = Y((row + 1) * 0.14), bw = 0.1 * s, bh = 0.13 * s;
        var t = ((row * 7 + c * 3 + (side + 1) * 5) % 5) / 5;
        g.fillStyle = A.mix('#a8a29e', '#78716c', t); A.rr(g, bx, by, bw, bh, 3); g.fill();
        g.strokeStyle = 'rgba(41,37,36,0.4)'; g.lineWidth = 1; g.stroke();
      }
    });
    g.restore();
    // posts and roof beam
    A.woodBeam(g, X(-0.62), Y(0), X(-0.62), Y(1.75), 0.08 * s, 21, '#8b5a2b');
    A.woodBeam(g, X(0.62), Y(0), X(0.62), Y(1.75), 0.08 * s, 22, '#8b5a2b');
    A.woodBeam(g, X(-0.8), Y(1.78), X(0.8), Y(1.78), 0.07 * s, 23, '#7a4a22');
    // rope from the drum down to the bucket
    var bucketTop = 0.35 + lift, ropeX = ax - r;
    A.rope(g, [[X(ropeX), Y(ay)], [X(ropeX), Y(bucketTop + 0.12)]], Math.max(2.5, s * 0.012));
    // bucket
    var bw2 = 0.2 + 0.03 * Math.sqrt(p.mass / 12), bh2 = 0.24;
    g.save(); A.shadow(g, 6, 3, 0.3);
    g.beginPath(); g.moveTo(X(ropeX - bw2 / 2), Y(bucketTop)); g.lineTo(X(ropeX + bw2 / 2), Y(bucketTop)); g.lineTo(X(ropeX + bw2 * 0.38), Y(bucketTop - bh2)); g.lineTo(X(ropeX - bw2 * 0.38), Y(bucketTop - bh2)); g.closePath();
    var bg = g.createLinearGradient(X(ropeX - bw2 / 2), 0, X(ropeX + bw2 / 2), 0); bg.addColorStop(0, '#78350f'); bg.addColorStop(0.5, '#b45309'); bg.addColorStop(1, '#78350f');
    g.fillStyle = bg; g.fill(); A.noShadow(g);
    g.strokeStyle = '#374151'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(ropeX - bw2 / 2), Y(bucketTop - 0.04)); g.lineTo(X(ropeX + bw2 / 2), Y(bucketTop - 0.04)); g.moveTo(X(ropeX - bw2 * 0.42), Y(bucketTop - bh2 + 0.04)); g.lineTo(X(ropeX + bw2 * 0.42), Y(bucketTop - bh2 + 0.04)); g.stroke();
    g.beginPath(); g.arc(X(ropeX), Y(bucketTop), bw2 / 2 * s, Math.PI, TAU); g.stroke();
    g.fillStyle = '#7dd3fc'; g.beginPath(); g.ellipse(X(ropeX), Y(bucketTop), bw2 / 2 * s * 0.92, 0.025 * s, 0, 0, TAU); g.fill();
    g.restore();
    A.tag(g, X(ropeX + bw2 / 2 + 0.2), Y(bucketTop - bh2 / 2), kg(p.mass), 'rgba(255,255,255,0.92)', '#1f2937', 12);
    // drum (axle) with rope turns, then the big wheel in front
    g.save(); g.translate(X(ax), Y(ay));
    var dg2 = g.createRadialGradient(-r * s * 0.3, -r * s * 0.3, 1, 0, 0, r * s); dg2.addColorStop(0, '#d6a46c'); dg2.addColorStop(1, '#7a4a22');
    g.beginPath(); g.arc(0, 0, r * s, 0, TAU); g.fillStyle = dg2; g.fill();
    g.strokeStyle = '#a8865a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r * s * 0.95, 0, TAU); g.stroke();
    // wheel: rim + spokes, turning
    g.rotate(ang);
    g.strokeStyle = '#7a4a22'; g.lineWidth = Math.max(5, R * s * 0.12); g.beginPath(); g.arc(0, 0, R * s, 0, TAU); g.stroke();
    g.strokeStyle = '#a0683a'; g.lineWidth = Math.max(2, R * s * 0.05); g.beginPath(); g.arc(0, 0, R * s, 0, TAU); g.stroke();
    g.strokeStyle = '#8b5a2b'; g.lineWidth = Math.max(3, s * 0.02);
    for (var k = 0; k < 6; k++) { var a = k * TAU / 6; g.beginPath(); g.moveTo(Math.cos(a) * r * s, Math.sin(a) * r * s); g.lineTo(Math.cos(a) * R * s, Math.sin(a) * R * s); g.stroke(); }
    g.beginPath(); g.arc(0, 0, Math.max(4, s * 0.025), 0, TAU); g.fillStyle = '#374151'; g.fill();
    // handle knob at the rim
    g.fillStyle = '#111827'; g.beginPath(); g.arc(R * s, 0, Math.max(6, s * 0.035), 0, TAU); g.fill();
    g.restore();
    var hx = X(ax) + Math.cos(ang) * R * s, hy = Y(ay) + Math.sin(ang) * R * s;
    // effort: tangential arrow at the handle with the needed force
    var reading = Math.min(st.res.effort, st.strength);
    var tx = -Math.sin(ang), ty = Math.cos(ang);
    A.hand(g, hx, hy + 10, 0, Math.max(18, 0.1 * s), st.strain > 0);
    A.arrow(g, hx, hy, hx + tx * -38, hy + ty * -38, st.strain ? '#dc2626' : '#1d4ed8', 4);
    A.tag(g, X(ax + Math.max(R, 0.2) + 0.32), Y(ay + 0.2), kg(reading), st.strain ? '#dc2626' : '#1d4ed8', '#fff', 13);
    if (st.showArms) {
      A.dimension(g, X(ax), Y(ay), X(ax), Y(ay - R), st.armLabel ? st.armLabel(R) : '', '#1d4ed8', 14);
      A.tag(g, X(ax) - 40, Y(ay + r + 0.08), 'r ' + (st.armLabel ? st.armLabel(r) : ''), '#fff', '#b45309', 11);
    }
    return { hx: hx, hy: hy, cx: X(ax), cy: Y(ay), turns: turns };
  }

  // ---------------------------------------------------------------- screw jack
  function screw(g, cam, st) {
    var s = cam.s, p = st.p, u = st.u, R = p.handleR, P = p.pitch;
    var X = function(x) { return A.X(cam, x); }, Y = function(y) { return A.Y(cam, y); };
    var turns = 6, ang = u * turns * TAU, lift = P * turns * u;
    var jx = 0, baseH = 0.07, colH = 0.16 + lift;
    // car (rear half of a small hatchback) resting on the jack pad;
    // the tyre leaves the ground once the jack takes the weight
    var sill = baseH + colH + 0.02, carLift = Math.max(0, lift - 0.012), b0 = sill + 0.02;
    g.save(); A.shadow(g, 12, 5, 0.3);
    g.beginPath();
    g.moveTo(X(-0.75), Y(b0));
    g.lineTo(X(0.88), Y(b0));
    g.quadraticCurveTo(X(0.97), Y(b0), X(0.97), Y(b0 + 0.1));
    g.lineTo(X(0.97), Y(b0 + 0.36));
    g.quadraticCurveTo(X(0.96), Y(b0 + 0.47), X(0.86), Y(b0 + 0.49));
    g.lineTo(X(0.74), Y(b0 + 0.5));
    g.quadraticCurveTo(X(0.64), Y(b0 + 0.7), X(0.5), Y(b0 + 0.8));
    g.quadraticCurveTo(X(0.42), Y(b0 + 0.84), X(0.2), Y(b0 + 0.84));
    g.lineTo(X(-0.75), Y(b0 + 0.85));
    g.closePath();
    var cg = g.createLinearGradient(0, Y(b0 + 0.85), 0, Y(b0));
    cg.addColorStop(0, '#f87171'); cg.addColorStop(0.45, '#dc2626'); cg.addColorStop(1, '#7f1d1d');
    g.fillStyle = cg; g.fill();
    A.noShadow(g);
    // windows
    g.beginPath();
    g.moveTo(X(0.66), Y(b0 + 0.53)); g.quadraticCurveTo(X(0.58), Y(b0 + 0.68), X(0.47), Y(b0 + 0.77));
    g.lineTo(X(-0.02), Y(b0 + 0.78)); g.lineTo(X(-0.02), Y(b0 + 0.53)); g.closePath();
    var wg = g.createLinearGradient(X(0), Y(b0 + 0.78), X(0.5), Y(b0 + 0.53)); wg.addColorStop(0, '#bfdbfe'); wg.addColorStop(1, '#1e3a8a');
    g.fillStyle = wg; g.fill();
    g.fillStyle = '#7f1d1d'; g.fillRect(X(0.17), Y(b0 + 0.79), 0.035 * s, 0.27 * s);
    g.beginPath(); g.moveTo(X(-0.75), Y(b0 + 0.53)); g.lineTo(X(-0.07), Y(b0 + 0.53)); g.lineTo(X(-0.07), Y(b0 + 0.78)); g.lineTo(X(-0.75), Y(b0 + 0.79)); g.closePath();
    g.fillStyle = wg; g.fill();
    // door seam, handle, tail light, bumper
    g.strokeStyle = 'rgba(69,10,10,0.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(X(-0.08), Y(b0 + 0.08)); g.lineTo(X(-0.08), Y(b0 + 0.8)); g.stroke();
    g.fillStyle = '#e5e7eb'; A.rr(g, X(-0.26), Y(b0 + 0.46), 0.12 * s, 0.025 * s, 3); g.fill();
    var tl = g.createLinearGradient(0, Y(b0 + 0.42), 0, Y(b0 + 0.26)); tl.addColorStop(0, '#fecaca'); tl.addColorStop(0.4, '#ef4444'); tl.addColorStop(1, '#f97316');
    g.fillStyle = tl; A.rr(g, X(0.9), Y(b0 + 0.42), 0.07 * s, 0.16 * s, 4); g.fill();
    g.fillStyle = '#111827'; A.rr(g, X(0.62), Y(b0 + 0.1), 0.37 * s, 0.1 * s, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(X(-0.75), Y(b0 + 0.44), 1.68 * s, 0.012 * s);
    g.fillStyle = '#4b5563'; g.fillRect(X(-0.75), Y(b0 + 0.04), 1.4 * s, 0.03 * s);
    g.restore();
    // wheel arch + tyre
    var tyreR = 0.3, tyreX = 0.52, tyreY = tyreR + carLift - 0.004;
    g.fillStyle = '#1f0a0a'; g.beginPath(); g.arc(X(tyreX), Y(b0 + 0.02), (tyreR + 0.05) * s, Math.PI, TAU); g.fill();
    g.save(); A.shadow(g, 8, 3, 0.35);
    g.beginPath(); g.arc(X(tyreX), Y(tyreY), tyreR * s, 0, TAU); g.fillStyle = '#111827'; g.fill(); A.noShadow(g);
    g.beginPath(); g.arc(X(tyreX), Y(tyreY), tyreR * s * 0.6, 0, TAU);
    var rg = g.createRadialGradient(X(tyreX) - 4, Y(tyreY) - 4, 2, X(tyreX), Y(tyreY), tyreR * s * 0.6); rg.addColorStop(0, '#e5e7eb'); rg.addColorStop(1, '#6b7280');
    g.fillStyle = rg; g.fill();
    for (var b = 0; b < 5; b++) { var ba = b * TAU / 5; g.beginPath(); g.arc(X(tyreX) + Math.cos(ba) * tyreR * s * 0.3, Y(tyreY) + Math.sin(ba) * tyreR * s * 0.3, 2.5, 0, TAU); g.fillStyle = '#374151'; g.fill(); }
    g.restore();
    if (carLift > 0.005) A.tag(g, X(tyreX), Y(0) - 12, '↕ ' + Math.round(carLift * 1000) + ' mm', '#16a34a', '#fff', 11);
    // jack: base, threaded column, pad
    g.save(); A.shadow(g, 6, 3, 0.3);
    g.fillStyle = '#1f2937'; g.beginPath(); g.moveTo(X(jx - 0.12), Y(0)); g.lineTo(X(jx + 0.12), Y(0)); g.lineTo(X(jx + 0.06), Y(baseH)); g.lineTo(X(jx - 0.06), Y(baseH)); g.closePath(); g.fill();
    A.noShadow(g);
    var cw = 0.045 * s;
    var tg = g.createLinearGradient(X(jx) - cw / 2, 0, X(jx) + cw / 2, 0); tg.addColorStop(0, '#6b7280'); tg.addColorStop(0.5, '#e5e7eb'); tg.addColorStop(1, '#4b5563');
    g.fillStyle = tg; g.fillRect(X(jx) - cw / 2, Y(baseH + colH), cw, colH * s);
    // threads: drawn at the real pitch (scaled), slanted, moving as it turns
    var visP = Math.max(P * s, 3.2), phase = (ang / TAU) % 1;
    g.strokeStyle = 'rgba(31,41,55,0.6)'; g.lineWidth = 1;
    for (var ty = Y(baseH) - phase * visP; ty > Y(baseH + colH); ty -= visP) { g.beginPath(); g.moveTo(X(jx) - cw / 2, ty); g.lineTo(X(jx) + cw / 2, ty - visP * 0.5); g.stroke(); }
    g.fillStyle = '#374151'; g.fillRect(X(jx) - 0.06 * s, Y(baseH + colH) - 0.025 * s, 0.12 * s, 0.025 * s);
    g.fillStyle = '#1f2937'; g.fillRect(X(jx - 0.03), Y(baseH + 0.045), 0.06 * s, 0.045 * s);
    g.restore();
    // handle bar through the top, seen slightly from above: an ellipse path
    var hcx = X(jx), hcy = Y(baseH + colH - 0.035);
    g.strokeStyle = 'rgba(29,78,216,0.25)'; g.setLineDash([4, 4]); g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(hcx, hcy, R * s, R * s * 0.28, 0, 0, TAU); g.stroke(); g.setLineDash([]);
    var hx = hcx + Math.cos(ang) * R * s, hy = hcy + Math.sin(ang) * R * s * 0.28;
    A.steelBar(g, hcx, hcy, hx, hy, Math.max(4, 0.018 * s), '#9ca3af');
    g.fillStyle = '#dc2626'; g.beginPath(); g.arc(hx, hy, Math.max(6, 0.02 * s), 0, TAU); g.fill();
    var reading = Math.min(st.res.effort, st.strength);
    A.hand(g, hx, hy + 10, 0, Math.max(16, 0.08 * s), st.strain > 0);
    A.tag(g, hcx - Math.max(R * s, 50) - 10, hcy - 34, kg(reading), st.strain ? '#dc2626' : '#1d4ed8', '#fff', 13);
    A.tag(g, X(0.3), Y(b0 + 0.3), kg(p.mass), 'rgba(255,255,255,0.92)', '#1f2937', 12);
    if (st.showArms) {
      A.dimension(g, hcx, hcy + R * s * 0.28 + 10, hcx + R * s, hcy + R * s * 0.28 + 10, st.armLabel ? st.armLabel(R) : '', '#1d4ed8', 8);
      A.tag(g, X(jx) - cw - 46, Y(baseH + colH * 0.5), (st.pitchLabel || '') + Math.round(P * 1000) + ' mm', '#fff', '#b45309', 11);
    }
    return { hx: hx, hy: hy, cx: hcx, cy: hcy, turns: turns, squash: 0.28 };
  }

  var SCENES = { lever: lever, pulley: pulley, incline: incline, wedge: wedge, wheel: wheel, screw: screw };

  // Paints backdrop (cached by the caller) and the machine.
  function draw(g, W, H, st) {
    var cam = camFor(st, W, H);
    if (st.back) g.drawImage(st.back, 0, 0, W, H);
    else A.backdrop(g, W, H, A.Y(cam, 0), 7);
    return SCENES[st.kind](g, cam, st);
  }
  function floorY(st, W, H) { return A.Y(camFor(st, W, H), 0); }

  // ---------------------------------------------------------------- chain-reaction parts
  function domino(g, w, h) {
    var gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#111827'); gr.addColorStop(0.4, '#374151'); gr.addColorStop(1, '#030712');
    A.rr(g, -w / 2, -h / 2, w, h, Math.min(3, w * 0.2)); g.fillStyle = gr; g.fill();
    g.fillStyle = '#e5e7eb'; g.fillRect(-w / 2 + 2, -0.5, w - 4, 1);
    var pr = Math.max(1, w * 0.1);
    [[-0.22, -0.32], [0.22, -0.2], [0, -0.32 + 0.06], [-0.2, 0.22], [0.2, 0.22], [0, 0.34], [0, 0.12]].forEach(function(q, i) {
      if (i === 2) return;
      g.beginPath(); g.arc(q[0] * w, q[1] * h, pr, 0, TAU); g.fill();
    });
  }
  function ball(g, r, kind, roll) {
    var gr;
    if (kind === 'rubber') { gr = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r); gr.addColorStop(0, '#fecaca'); gr.addColorStop(0.5, '#ef4444'); gr.addColorStop(1, '#7f1d1d'); }
    else { gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#cbd5e1'); gr.addColorStop(0.8, '#64748b'); gr.addColorStop(1, '#334155'); }
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = gr; g.fill();
    g.save(); g.rotate(roll || 0);
    g.strokeStyle = kind === 'rubber' ? 'rgba(255,255,255,0.7)' : 'rgba(51,65,85,0.45)'; g.lineWidth = Math.max(1, r * 0.12);
    g.beginPath(); g.arc(0, 0, r * 0.62, -0.6, 0.6); g.stroke();
    g.restore();
  }
  // Draw one part centred at screen (x,y), rotation a (screen, clockwise positive), s px/m.
  function part(g, type, x, y, a, s, opts) {
    var P = TallerPhysics.PARTS[type];
    g.save(); g.translate(x, y); g.rotate(a);
    if (opts && opts.ghost) g.globalAlpha = 0.55;
    if (opts && opts.sel) { g.shadowColor = 'rgba(37,99,235,0.95)'; g.shadowBlur = 14; }
    else A.shadow(g, 6, 3, 0.3);
    if (type === 'plank' || type === 'long') {
      g.restore(); g.save();
      if (opts && opts.ghost) g.globalAlpha = 0.55;
      var hw = P.w / 2 * s, ca = Math.cos(a), sa = Math.sin(a);
      if (opts && opts.sel) { g.shadowColor = 'rgba(37,99,235,0.95)'; g.shadowBlur = 14; }
      A.woodBeam(g, x - ca * hw, y - sa * hw, x + ca * hw, y + sa * hw, P.h * s, type === 'long' ? 31 : 29, '#c58b4c');
    } else if (type === 'domino') domino(g, P.w * s, P.h * s);
    else if (type === 'ball' || type === 'rubber') ball(g, P.r * s, type, opts && opts.roll);
    else if (type === 'crate') { A.crate(g, 0, P.h * s / 2, P.w * s, '2 kg', 17); }
    else if (type === 'seesaw') {
      A.woodBeam(g, -P.w / 2 * s, 0, P.w / 2 * s, 0, P.h * s * 1.4, 33, '#b77b3e');
      g.fillStyle = '#1f2937'; g.beginPath(); g.arc(0, 0, Math.max(3, P.h * s * 0.5), 0, TAU); g.fill();
    }
    g.restore();
  }
  // The seesaw's stand (drawn before the board) and the goals.
  function stand(g, x, y, h, s) {
    g.save(); A.shadow(g, 6, 3, 0.3);
    g.beginPath(); g.moveTo(x - 0.12 * s, y + h * s); g.lineTo(x, y); g.lineTo(x + 0.12 * s, y + h * s); g.closePath();
    var gr = g.createLinearGradient(x - 0.12 * s, 0, x + 0.12 * s, 0); gr.addColorStop(0, '#475569'); gr.addColorStop(0.5, '#94a3b8'); gr.addColorStop(1, '#334155');
    g.fillStyle = gr; g.fill(); g.restore();
  }
  function cup(g, cam, goal, glow) {
    var x0 = A.X(cam, goal.x - goal.w / 2 - 0.03), x1 = A.X(cam, goal.x + goal.w / 2 + 0.03), y0 = A.Y(cam, goal.y + goal.h), y1 = A.Y(cam, goal.y);
    g.save(); A.shadow(g, 8, 3, 0.3);
    var gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#64748b'); gr.addColorStop(0.3, '#e2e8f0'); gr.addColorStop(0.7, '#94a3b8'); gr.addColorStop(1, '#475569');
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 - 3, y1); g.lineTo(x0 + 3, y1); g.closePath(); g.fillStyle = gr; g.fill();
    A.noShadow(g);
    g.fillStyle = 'rgba(15,23,42,0.55)'; g.beginPath(); g.ellipse((x0 + x1) / 2, y0, (x1 - x0) / 2, 5, 0, 0, TAU); g.fill();
    g.strokeStyle = '#334155'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0 + (y1 - y0) * 0.3); g.lineTo(x1, y0 + (y1 - y0) * 0.3); g.moveTo(x0 + 1, y0 + (y1 - y0) * 0.75); g.lineTo(x1 - 1, y0 + (y1 - y0) * 0.75); g.stroke();
    if (glow) { g.strokeStyle = 'rgba(250,204,21,0.9)'; g.lineWidth = 4; g.strokeRect(x0 - 4, y0 - 8, x1 - x0 + 8, y1 - y0 + 10); }
    g.restore();
  }
  function bell(g, cam, goal, ring) {
    var x = A.X(cam, goal.x), y = A.Y(cam, goal.y), s = cam.s, swing = ring ? Math.sin(ring * 30) * 0.35 * Math.max(0, 1 - ring) : 0;
    // post and bracket
    g.save();
    A.steelBar(g, x + 0.12 * s, A.Y(cam, 0), x + 0.12 * s, y - 0.14 * s, 0.025 * s, '#6b7280');
    A.steelBar(g, x + 0.12 * s, y - 0.13 * s, x - 0.005 * s, y - 0.13 * s, 0.02 * s, '#6b7280');
    g.translate(x, y - 0.12 * s); g.rotate(swing);
    A.shadow(g, 8, 3, 0.35);
    var w = 0.12 * s, h = 0.14 * s;
    g.beginPath(); g.moveTo(-w * 0.18, 0); g.bezierCurveTo(-w * 0.35, h * 0.2, -w * 0.32, h * 0.6, -w * 0.55, h * 0.92); g.lineTo(w * 0.55, h * 0.92); g.bezierCurveTo(w * 0.32, h * 0.6, w * 0.35, h * 0.2, w * 0.18, 0); g.closePath();
    var gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#92400e'); gr.addColorStop(0.35, '#fcd34d'); gr.addColorStop(0.7, '#d97706'); gr.addColorStop(1, '#78350f');
    g.fillStyle = gr; g.fill(); A.noShadow(g);
    g.fillStyle = '#78350f'; g.beginPath(); g.ellipse(0, h * 0.92, w * 0.55, h * 0.07, 0, 0, TAU); g.fill();
    g.fillStyle = '#451a03'; g.beginPath(); g.arc(0, h * 1.02, w * 0.1, 0, TAU); g.fill();
    g.restore();
    if (ring) {
      g.save(); g.strokeStyle = 'rgba(250,204,21,' + Math.max(0, 1 - ring) + ')'; g.lineWidth = 3;
      for (var k = 1; k <= 3; k++) { g.beginPath(); g.arc(x, y, (0.1 + k * 0.06 + ring * 0.1) * s, -1.2, -0.2); g.stroke(); g.beginPath(); g.arc(x, y, (0.1 + k * 0.06 + ring * 0.1) * s, Math.PI + 0.2, Math.PI + 1.2); g.stroke(); }
      g.restore();
    }
  }
  function shelf(g, cam, st, tag) {
    var s = cam.s, x = A.X(cam, st.x), y = A.Y(cam, st.y), a = -(st.a || 0) * Math.PI / 180;
    if (tag === 'wall' || st.h > 0.12) {
      g.save(); g.translate(x, y); g.rotate(a); A.shadow(g, 8, 4, 0.3);
      var gr = g.createLinearGradient(-st.w / 2 * s, 0, st.w / 2 * s, 0); gr.addColorStop(0, '#78716c'); gr.addColorStop(0.5, '#a8a29e'); gr.addColorStop(1, '#57534e');
      g.fillStyle = gr; g.fillRect(-st.w / 2 * s, -st.h / 2 * s, st.w * s, st.h * s); A.noShadow(g);
      g.strokeStyle = 'rgba(41,37,36,0.35)'; g.lineWidth = 1;
      for (var by = -st.h / 2 + 0.08; by < st.h / 2; by += 0.08) { g.beginPath(); g.moveTo(-st.w / 2 * s, by * s); g.lineTo(st.w / 2 * s, by * s); g.stroke(); }
      g.restore();
      return;
    }
    if (tag === 'bin') {
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = '#7c2d12'; g.fillRect(-st.w / 2 * s, -st.h / 2 * s, st.w * s, st.h * s);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(-st.w / 2 * s, -st.h / 2 * s, st.w * s, 2);
      g.restore();
      return;
    }
    var ca = Math.cos(a), sa = Math.sin(a), hw = st.w / 2 * s;
    A.woodBeam(g, x - ca * hw, y - sa * hw, x + ca * hw, y + sa * hw, Math.max(4, st.h * s), Math.round(st.x * 100), '#9a6534');
    // a steel bracket to the wall
    g.fillStyle = '#6b7280';
    g.beginPath(); g.moveTo(x - 3, y + st.h * s / 2); g.lineTo(x + 3, y + st.h * s / 2); g.lineTo(x, y + st.h * s / 2 + 0.1 * s); g.closePath(); g.fill();
  }

  return { draw: draw, camFor: camFor, floorY: floorY, extents: extents, part: part, stand: stand, cup: cup, bell: bell, shelf: shelf, ball: ball };
})();
