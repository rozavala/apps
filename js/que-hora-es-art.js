/* ================================================================
   ¿QUÉ HORA ES? — graphics (que-hora-es-art.js)

   Everything drawn in code, nothing loaded:
   - createClock(canvas, opts): a walnut wall clock with a brushed
     brass ring, cream enamel dial, blued-steel Breguet hands, a red
     station-style second hand and a glass reflection. Canvas sized
     by devicePixelRatio; static layers cached off-screen; hands
     dragged with Pointer Events and linked like real motion-work
     gears (the minute hand drives the hour hand 12:1).
   - createFlip(host): a flip-card digital display (DOM + CSS 3D).
   - sceneSVG(id) / updateSky(root, t): My Day room/outdoor scenes
     whose window sky follows the time of day.
   - calendarSVG(), seasonWheelSVG(): paper wall calendar and the
     Chilean season wheel.

   Exposes one global: QheArt
   ================================================================ */

var QheArt = (function() {
  'use strict';

  var TAU = Math.PI * 2;

  function rng(seed) {
    return function() {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function ring(x, r1, r2) {
    x.beginPath();
    x.arc(0, 0, r1, 0, TAU, false);
    x.arc(0, 0, r2, 0, TAU, true);
  }

  // Geometry shared by every layer, as fractions of the canvas size.
  function geo(S) {
    var R = S * 0.445;
    return { R: R, Rin: R * 0.855, Rb: R * 0.812, Rd: R * 0.80 };
  }

  // ---------------------------------------------------------------
  // Static face: wood bezel, brass ring, enamel dial, track, numerals
  // ---------------------------------------------------------------
  // Both static layers paint into a canvas the clock passes in (reused on
  // rebuild) and return it, or null when there is no canvas memory.
  function drawFace(S, o, c) {
    c = c || mk(S, S);
    c.width = S; c.height = S;
    var x = ZsCanvas.get2d(c);
    if (!x) return null;
    var g = geo(S), R = g.R, Rin = g.Rin, Rb = g.Rb, Rd = g.Rd;
    var small = o.size < 140;
    x.translate(S / 2, S / 2);

    // -- cast shadow on the wall (soft + contact)
    x.save();
    x.shadowColor = 'rgba(45,22,6,0.42)';
    x.shadowBlur = S * 0.032;
    x.shadowOffsetX = S * 0.006;
    x.shadowOffsetY = S * 0.016;
    x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = '#4a2410'; x.fill();
    x.restore();
    x.save();
    x.shadowColor = 'rgba(30,14,4,0.45)';
    x.shadowBlur = S * 0.01;
    x.shadowOffsetY = S * 0.005;
    x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = '#4a2410'; x.fill();
    x.restore();

    // -- walnut bezel
    x.save();
    ring(x, R, Rin * 0.99); x.clip();
    var base = x.createLinearGradient(-R, -R, R, R);
    base.addColorStop(0, '#8a4a24');
    base.addColorStop(0.3, '#7a3d1c');
    base.addColorStop(0.55, '#93542b');
    base.addColorStop(0.8, '#6c3418');
    base.addColorStop(1, '#5a2a12');
    x.fillStyle = base;
    x.fillRect(-R, -R, R * 2, R * 2);

    var rnd = rng(11);
    x.save();
    x.rotate(-0.14);
    // broad colour bands
    for (var b = 0; b < 16; b++) {
      var by = -R * 1.1 + rnd() * R * 2.2, bh = R * (0.03 + rnd() * 0.13);
      x.fillStyle = rnd() < 0.5 ? 'rgba(255,196,140,' + (0.03 + rnd() * 0.05) + ')'
                                : 'rgba(45,18,5,' + (0.05 + rnd() * 0.08) + ')';
      x.fillRect(-R * 1.2, by, R * 2.4, bh);
    }
    // fine grain lines that flow around a knot
    var kx = R * 0.42, ky = -R * 0.62, kr = R * 0.2;
    var lines = small ? 70 : 190;
    for (var i = 0; i < lines; i++) {
      var y0 = -R * 1.15 + i * (R * 2.3 / lines) + (rnd() - 0.5) * R * 0.012;
      var ph = rnd() * TAU, amp = R * (0.008 + rnd() * 0.012);
      x.beginPath();
      for (var xx = -R * 1.2; xx <= R * 1.2; xx += R * 0.03) {
        var dx = xx - kx, dy = y0 - ky;
        var bump = Math.exp(-(dx * dx + dy * dy) / (kr * kr * 2.2));
        var yy = y0 + Math.sin(xx / R * 2.6 + ph) * amp + Math.sin(xx / R * 9 + ph * 2) * amp * 0.25 +
                 (dy >= 0 ? 1 : -1) * kr * 0.75 * bump;
        if (xx === -R * 1.2) x.moveTo(xx, yy); else x.lineTo(xx, yy);
      }
      var dark = rnd() < 0.78;
      x.strokeStyle = dark ? 'rgba(40,16,4,' + (0.07 + rnd() * 0.22) + ')'
                           : 'rgba(255,214,168,' + (0.05 + rnd() * 0.1) + ')';
      x.lineWidth = S * (0.0006 + rnd() * 0.0022);
      x.stroke();
    }
    // knot
    var kg = x.createRadialGradient(kx, ky, 0, kx, ky, kr * 0.55);
    kg.addColorStop(0, 'rgba(40,14,3,0.55)');
    kg.addColorStop(0.5, 'rgba(70,28,8,0.25)');
    kg.addColorStop(1, 'rgba(70,28,8,0)');
    x.fillStyle = kg;
    x.beginPath(); x.ellipse(kx, ky, kr * 0.55, kr * 0.28, 0, 0, TAU); x.fill();
    // pores
    for (var p = 0; p < (small ? 150 : 700); p++) {
      var px = (rnd() - 0.5) * R * 2.2, py = (rnd() - 0.5) * R * 2.2;
      x.fillStyle = 'rgba(30,10,2,' + (0.1 + rnd() * 0.2) + ')';
      x.fillRect(px, py, S * (0.002 + rnd() * 0.006), S * 0.0009);
    }
    x.restore();

    // rounded profile (turned moulding): shadow at the inner step,
    // a soft highlight on the crown, darker toward the outer edge.
    var prof = x.createRadialGradient(0, 0, Rin, 0, 0, R);
    prof.addColorStop(0, 'rgba(10,4,0,0.65)');
    prof.addColorStop(0.07, 'rgba(10,4,0,0.2)');
    prof.addColorStop(0.3, 'rgba(255,230,200,0.16)');
    prof.addColorStop(0.5, 'rgba(255,230,200,0.04)');
    prof.addColorStop(0.82, 'rgba(0,0,0,0.12)');
    prof.addColorStop(0.95, 'rgba(0,0,0,0.38)');
    prof.addColorStop(1, 'rgba(0,0,0,0.6)');
    x.fillStyle = prof; x.fillRect(-R, -R, R * 2, R * 2);
    // light from the top-left
    var dir = x.createLinearGradient(-R * 0.8, -R * 0.8, R * 0.8, R * 0.8);
    dir.addColorStop(0, 'rgba(255,236,210,0.30)');
    dir.addColorStop(0.42, 'rgba(255,236,210,0.02)');
    dir.addColorStop(0.6, 'rgba(0,0,0,0)');
    dir.addColorStop(1, 'rgba(0,0,0,0.42)');
    x.fillStyle = dir; x.fillRect(-R, -R, R * 2, R * 2);
    // varnish specular streak
    var mid = (R + Rin) / 2 + (R - Rin) * 0.08;
    for (var s = 0; s < 6; s++) {
      x.beginPath();
      x.arc(0, 0, mid, Math.PI * (1.08 + s * 0.012), Math.PI * (1.52 - s * 0.012));
      x.strokeStyle = 'rgba(255,248,236,' + (0.05 + s * 0.035) + ')';
      x.lineWidth = (R - Rin) * (0.34 - s * 0.05);
      x.lineCap = 'round';
      x.stroke();
    }
    x.beginPath();
    x.arc(0, 0, mid, Math.PI * 0.12, Math.PI * 0.38);
    x.strokeStyle = 'rgba(255,240,220,0.08)';
    x.lineWidth = (R - Rin) * 0.2;
    x.stroke();
    x.restore();
    // crisp outer and inner edges
    x.beginPath(); x.arc(0, 0, R - S * 0.001, 0, TAU);
    x.strokeStyle = 'rgba(25,10,2,0.6)'; x.lineWidth = S * 0.002; x.stroke();
    x.beginPath(); x.arc(0, 0, R * 0.985, Math.PI * 1.05, Math.PI * 1.6);
    x.strokeStyle = 'rgba(255,225,190,0.35)'; x.lineWidth = S * 0.0025; x.stroke();

    // -- brushed brass ring
    x.save();
    ring(x, Rin, Rb); x.clip();
    var brass;
    if (typeof x.createConicGradient === 'function') {
      brass = x.createConicGradient(-0.4, 0, 0);
      var bs = ['#e3bb5e', '#fff0b3', '#b3842c', '#f1cf73', '#8f611b', '#f6e1a0', '#ad7d27',
                '#fae6a5', '#a0701f', '#ecc568', '#e3bb5e'];
      for (var q = 0; q < bs.length; q++) brass.addColorStop(q / (bs.length - 1), bs[q]);
    } else {
      brass = x.createLinearGradient(-Rin, -Rin, Rin, Rin);
      brass.addColorStop(0, '#fff0b3'); brass.addColorStop(0.5, '#b3842c'); brass.addColorStop(1, '#f1cf73');
    }
    x.fillStyle = brass; x.fillRect(-R, -R, R * 2, R * 2);
    var rb2 = rng(5);
    for (var rr = Rb; rr < Rin; rr += S * 0.0012) {
      x.beginPath(); x.arc(0, 0, rr, 0, TAU);
      x.strokeStyle = rb2() < 0.5 ? 'rgba(255,250,220,' + rb2() * 0.12 + ')' : 'rgba(90,55,5,' + rb2() * 0.12 + ')';
      x.lineWidth = S * 0.0007; x.stroke();
    }
    var bp = x.createRadialGradient(0, 0, Rb, 0, 0, Rin);
    bp.addColorStop(0, 'rgba(70,40,0,0.55)');
    bp.addColorStop(0.25, 'rgba(255,250,225,0.28)');
    bp.addColorStop(0.55, 'rgba(255,250,225,0)');
    bp.addColorStop(0.85, 'rgba(70,40,0,0.2)');
    bp.addColorStop(1, 'rgba(50,25,0,0.6)');
    x.fillStyle = bp; x.fillRect(-R, -R, R * 2, R * 2);
    x.restore();

    // -- enamel dial
    x.save();
    x.beginPath(); x.arc(0, 0, Rd, 0, TAU); x.clip();
    var dial = x.createRadialGradient(-Rd * 0.25, -Rd * 0.3, Rd * 0.05, 0, 0, Rd * 1.05);
    dial.addColorStop(0, '#fffdf7');
    dial.addColorStop(0.55, '#faf2df');
    dial.addColorStop(1, '#eadcb9');
    x.fillStyle = dial; x.fillRect(-Rd, -Rd, Rd * 2, Rd * 2);
    if (!small) {
      var rs = rng(3);
      for (var d = 0; d < 1600; d++) {
        x.fillStyle = rs() < 0.5 ? 'rgba(120,90,40,0.035)' : 'rgba(255,255,255,0.07)';
        x.fillRect((rs() - 0.5) * Rd * 2, (rs() - 0.5) * Rd * 2, S * 0.002, S * 0.002);
      }
    }
    if (o.helper) {
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, Rd, -Math.PI / 2, Math.PI / 2); x.closePath();
      x.fillStyle = 'rgba(22,163,74,0.10)'; x.fill();
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, Rd, Math.PI / 2, Math.PI * 1.5); x.closePath();
      x.fillStyle = 'rgba(234,88,12,0.10)'; x.fill();
      x.beginPath(); x.moveTo(0, -Rd); x.lineTo(0, Rd);
      x.strokeStyle = 'rgba(120,90,40,0.18)'; x.lineWidth = S * 0.002;
      x.setLineDash([S * 0.008, S * 0.008]); x.stroke(); x.setLineDash([]);
    }
    // inner shadow cast by the brass ring (light from top-left)
    x.save();
    x.shadowColor = 'rgba(60,35,5,0.5)';
    x.shadowBlur = S * 0.02;
    x.shadowOffsetX = S * 0.006;
    x.shadowOffsetY = S * 0.01;
    x.beginPath(); x.arc(0, 0, Rd + S * 0.06, 0, TAU);
    x.lineWidth = S * 0.12; x.strokeStyle = '#000'; x.stroke();
    x.restore();
    var vig = x.createRadialGradient(0, 0, Rd * 0.75, 0, 0, Rd);
    vig.addColorStop(0, 'rgba(90,60,20,0)');
    vig.addColorStop(1, 'rgba(90,60,20,0.16)');
    x.fillStyle = vig; x.fillRect(-Rd, -Rd, Rd * 2, Rd * 2);
    x.restore();
    x.beginPath(); x.arc(0, 0, Rd, 0, TAU);
    x.strokeStyle = 'rgba(70,45,10,0.7)'; x.lineWidth = S * 0.0025; x.stroke();

    // -- minute track
    var tOut = Rd * 0.94, tIn = o.helper ? Rd * 0.885 : Rd * 0.895, t5 = o.helper ? Rd * 0.85 : Rd * 0.855;
    x.beginPath(); x.arc(0, 0, tOut, 0, TAU);
    x.strokeStyle = '#2b231a'; x.lineWidth = S * (small ? 0.003 : 0.0022); x.stroke();
    if (!small) {
      x.beginPath(); x.arc(0, 0, tIn, 0, TAU);
      x.strokeStyle = 'rgba(43,35,26,0.55)'; x.lineWidth = S * 0.0012; x.stroke();
    }
    for (var k = 0; k < 60; k++) {
      var a = k / 60 * TAU, five = k % 5 === 0;
      if (small && !five) continue;
      var sa = Math.sin(a), ca = -Math.cos(a);
      var r1 = five ? t5 : tIn;
      x.beginPath();
      x.moveTo(sa * r1, ca * r1); x.lineTo(sa * tOut, ca * tOut);
      x.strokeStyle = five ? (o.helper ? '#b91c1c' : '#1f1a14') : '#3a3026';
      x.lineWidth = S * (five ? 0.0075 : 0.0028);
      x.lineCap = 'butt';
      x.stroke();
    }

    // -- numerals
    var numR = o.helper ? Rd * 0.635 : Rd * 0.70;
    var fs = Rd * (o.helper ? 0.165 : (small ? 0.25 : 0.19));
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '600 ' + fs + 'px Georgia, "Times New Roman", serif';
    for (var n = 1; n <= 12; n++) {
      var an = n / 12 * TAU, nx = Math.sin(an) * numR, ny = -Math.cos(an) * numR + fs * 0.04;
      x.fillStyle = 'rgba(255,255,255,0.75)';
      x.fillText(String(n), nx + S * 0.0012, ny + S * 0.0016);
      x.fillStyle = o.helper ? '#1e3a8a' : '#1d1813';
      x.fillText(String(n), nx, ny);
    }
    if (o.helper) {
      // minute numbers in red, matching the minute hand
      var mfs = Rd * 0.068, mr = Rd * 0.775;
      x.font = '800 ' + mfs + 'px "Nunito", system-ui, sans-serif';
      for (var mm = 0; mm < 60; mm += 5) {
        var am = mm / 60 * TAU;
        x.fillStyle = '#b91c1c';
        x.fillText(mm === 0 ? '00' : String(mm), Math.sin(am) * mr, -Math.cos(am) * mr + mfs * 0.05);
      }
      // past / to labels
      x.font = '800 ' + Rd * 0.06 + 'px "Nunito", system-ui, sans-serif';
      var lp = o.lang === 'es' ? 'Y' : 'PAST', lt = o.lang === 'es' ? 'MENOS' : 'TO';
      x.fillStyle = 'rgba(21,128,61,0.75)'; x.fillText(lp, Rd * 0.36, -Rd * 0.2);
      x.fillStyle = 'rgba(194,65,12,0.75)'; x.fillText(lt, -Rd * 0.36, -Rd * 0.2);
    } else if (o.brand !== false && !small) {
      spaced(x, 'ZAVALA SERRA', 0, -Rd * 0.33, Rd * 0.052, '#5a4733', Rd * 0.018, '700');
      spaced(x, 'SANTIAGO', 0, Rd * 0.34, Rd * 0.04, '#7a6650', Rd * 0.02, '600');
    }
    return c;
  }

  function spaced(x, text, cx, cy, size, color, gap, weight) {
    x.font = weight + ' ' + size + 'px Georgia, "Times New Roman", serif';
    x.fillStyle = color;
    var widths = [], total = 0;
    for (var i = 0; i < text.length; i++) { var w = x.measureText(text[i]).width; widths.push(w); total += w + gap; }
    total -= gap;
    var px = cx - total / 2;
    x.textAlign = 'left';
    for (var j = 0; j < text.length; j++) { x.fillText(text[j], px, cy); px += widths[j] + gap; }
    x.textAlign = 'center';
  }

  // ---------------------------------------------------------------
  // Glass dome reflection (cached)
  // ---------------------------------------------------------------
  function drawGlass(S, c) {
    c = c || mk(S, S);
    c.width = S; c.height = S;
    var x = ZsCanvas.get2d(c);
    if (!x) return null;
    var g = geo(S), Rg = g.Rin * 0.995;
    x.translate(S / 2, S / 2);
    x.save();
    x.beginPath(); x.arc(0, 0, Rg, 0, TAU); x.clip();
    // refraction darkening at the rim
    var edge = x.createRadialGradient(0, 0, Rg * 0.86, 0, 0, Rg);
    edge.addColorStop(0, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(30,20,5,0.16)');
    x.fillStyle = edge; x.fillRect(-Rg, -Rg, Rg * 2, Rg * 2);
    // crescent highlight, top-left
    x.beginPath();
    x.arc(0, 0, Rg, 0, TAU);
    x.arc(Rg * 0.2, Rg * 0.3, Rg * 1.04, 0, TAU, true);
    var cr = x.createLinearGradient(-Rg, -Rg, -Rg * 0.1, -Rg * 0.1);
    cr.addColorStop(0, 'rgba(255,255,255,0.42)');
    cr.addColorStop(0.6, 'rgba(255,255,255,0.10)');
    cr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = cr; x.fill('evenodd');
    // soft dome sheen
    var sh = x.createRadialGradient(-Rg * 0.35, -Rg * 0.45, 0, -Rg * 0.35, -Rg * 0.45, Rg * 0.9);
    sh.addColorStop(0, 'rgba(255,255,255,0.13)');
    sh.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sh; x.fillRect(-Rg, -Rg, Rg * 2, Rg * 2);
    // a window reflected in the glass
    x.save();
    x.rotate(0.5);
    x.fillStyle = 'rgba(255,255,255,0.055)';
    x.fillRect(Rg * 0.18, -Rg * 0.92, Rg * 0.22, Rg * 0.55);
    x.fillRect(Rg * 0.44, -Rg * 0.86, Rg * 0.12, Rg * 0.5);
    x.restore();
    x.restore();
    // glints along the lower-right rim
    x.lineCap = 'round';
    x.beginPath(); x.arc(0, 0, Rg * 0.95, Math.PI * 0.08, Math.PI * 0.36);
    x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = Rg * 0.05; x.stroke();
    x.beginPath(); x.arc(0, 0, Rg * 0.955, Math.PI * 0.12, Math.PI * 0.3);
    x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = Rg * 0.01; x.stroke();
    x.beginPath(); x.arc(0, 0, Rg * 0.96, Math.PI * 1.15, Math.PI * 1.22);
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Rg * 0.012; x.stroke();
    return c;
  }

  // ---------------------------------------------------------------
  // Hands
  // ---------------------------------------------------------------
  // Breguet hand pointing up (-y): shaft, hollow "moon" ring, tip.
  function breguetPath(x, L, W, ringAt, ringR, tail, tailDisc) {
    x.beginPath();
    var shaftEnd = ringAt - ringR * 0.82;
    x.moveTo(-W * 0.75, tail);
    x.lineTo(-W, 0);
    x.lineTo(-W * 0.5, -shaftEnd);
    x.lineTo(W * 0.5, -shaftEnd);
    x.lineTo(W, 0);
    x.lineTo(W * 0.75, tail);
    x.closePath();
    x.moveTo(ringR, -ringAt);
    x.arc(0, -ringAt, ringR, 0, TAU, false);
    x.moveTo(ringR * 0.6, -ringAt);
    x.arc(0, -ringAt, ringR * 0.6, 0, TAU, true);
    var tipStart = ringAt + ringR * 0.82;
    x.moveTo(-W * 0.55, -tipStart);
    x.lineTo(0, -L);
    x.lineTo(W * 0.55, -tipStart);
    x.closePath();
    if (tailDisc) {
      x.moveTo(tailDisc, tail);
      x.arc(0, tail, tailDisc, 0, TAU, false);
    }
  }
  // Simple bold lance for helper mode.
  function lancePath(x, L, W, tail) {
    x.beginPath();
    x.moveTo(-W * 0.8, tail);
    x.lineTo(-W, 0);
    x.lineTo(-W * 0.75, -L * 0.78);
    x.lineTo(-W * 1.9, -L * 0.78);
    x.lineTo(0, -L);
    x.lineTo(W * 1.9, -L * 0.78);
    x.lineTo(W * 0.75, -L * 0.78);
    x.lineTo(W, 0);
    x.lineTo(W * 0.8, tail);
    x.closePath();
  }
  function steel(x, W, c0, c1, c2) {
    var gr = x.createLinearGradient(-W * 2, 0, W * 2, 0);
    gr.addColorStop(0, c0); gr.addColorStop(0.46, c1); gr.addColorStop(0.5, c2);
    gr.addColorStop(0.54, c1); gr.addColorStop(1, c0);
    return gr;
  }

  function drawHands(x, S, Rd, aH, aM, aS, helper, showSec, small) {
    var sc = S / 400, fat = small ? 1.7 : 1;
    function shadow(h) {
      x.shadowColor = 'rgba(25,12,0,0.38)';
      x.shadowBlur = S * 0.008 + h * S * 0.004;
      x.shadowOffsetX = S * (0.003 + h * 0.003);
      x.shadowOffsetY = S * (0.005 + h * 0.005);
    }
    // hour
    x.save(); x.rotate(aH); shadow(0.6);
    if (helper) {
      var hw = Rd * 0.042, hl = Rd * 0.47;
      lancePath(x, hl, hw, Rd * 0.1);
      x.fillStyle = steel(x, hw, '#1e3a8a', '#2563eb', '#93c5fd');
    } else {
      var W = Rd * 0.026 * fat, L = Rd * 0.53;
      breguetPath(x, L, W, L * 0.7, Rd * 0.062, Rd * 0.11, 0);
      x.fillStyle = steel(x, W * 1.6, '#08112a', '#22417c', '#7d9be0');
    }
    x.fill('nonzero');
    x.shadowColor = 'transparent';
    x.lineWidth = Math.max(1, sc * 0.6); x.strokeStyle = 'rgba(0,0,10,0.35)'; x.stroke();
    x.restore();
    // minute
    x.save(); x.rotate(aM); shadow(1);
    if (helper) {
      var mw = Rd * 0.026, ml = Rd * 0.84;
      lancePath(x, ml, mw, Rd * 0.14);
      x.fillStyle = steel(x, mw, '#7f1d1d', '#dc2626', '#fca5a5');
    } else {
      var W2 = Rd * 0.019 * fat, L2 = Rd * 0.82;
      breguetPath(x, L2, W2, L2 * 0.8, Rd * 0.045, Rd * 0.17, Rd * 0.035);
      x.fillStyle = steel(x, W2 * 1.6, '#08112a', '#22417c', '#7d9be0');
    }
    x.fill('nonzero');
    x.shadowColor = 'transparent';
    x.lineWidth = Math.max(1, sc * 0.6); x.strokeStyle = 'rgba(0,0,10,0.35)'; x.stroke();
    x.restore();
    // brass cap
    var cg = x.createRadialGradient(-Rd * 0.02, -Rd * 0.025, 0, 0, 0, Rd * 0.06);
    cg.addColorStop(0, '#fff3c4'); cg.addColorStop(0.45, '#d9a945'); cg.addColorStop(1, '#7a5212');
    x.save(); shadow(1.1);
    x.beginPath(); x.arc(0, 0, Rd * 0.055, 0, TAU); x.fillStyle = cg; x.fill();
    x.restore();
    x.beginPath(); x.arc(0, 0, Rd * 0.055, 0, TAU);
    x.strokeStyle = 'rgba(70,40,0,0.6)'; x.lineWidth = S * 0.002; x.stroke();
    // second hand
    if (showSec) {
      x.save(); x.rotate(aS); shadow(1.6);
      x.beginPath();
      x.moveTo(-Rd * 0.006, Rd * 0.24);
      x.lineTo(-Rd * 0.004, -Rd * 0.9);
      x.lineTo(Rd * 0.004, -Rd * 0.9);
      x.lineTo(Rd * 0.006, Rd * 0.24);
      x.closePath();
      x.moveTo(Rd * 0.05, -Rd * 0.68);
      x.arc(0, -Rd * 0.68, Rd * 0.05, 0, TAU);
      x.moveTo(Rd * 0.03, Rd * 0.2);
      x.arc(0, Rd * 0.2, Rd * 0.03, 0, TAU);
      x.fillStyle = '#c81e1e'; x.fill('nonzero');
      x.restore();
      x.beginPath(); x.arc(0, 0, Rd * 0.026, 0, TAU);
      var rg = x.createRadialGradient(-Rd * 0.008, -Rd * 0.008, 0, 0, 0, Rd * 0.026);
      rg.addColorStop(0, '#ff8a80'); rg.addColorStop(1, '#a3131a');
      x.fillStyle = rg; x.fill();
    } else {
      x.beginPath(); x.arc(0, 0, Rd * 0.018, 0, TAU);
      x.fillStyle = '#5a3a08'; x.fill();
      x.beginPath(); x.arc(-Rd * 0.006, -Rd * 0.006, Rd * 0.006, 0, TAU);
      x.fillStyle = 'rgba(255,240,200,0.8)'; x.fill();
    }
  }

  // ---------------------------------------------------------------
  // Clock instances + shared animation loop
  // ---------------------------------------------------------------
  var clocks = [];
  var looping = false;
  function loop(now) {
    var any = false;
    for (var i = 0; i < clocks.length; i++) {
      if (clocks[i]._frame(now)) any = true;
    }
    if (any) requestAnimationFrame(loop); else looping = false;
  }
  function kick() {
    if (!looping) { looping = true; requestAnimationFrame(loop); }
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function angDist(a, b) { var d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d; }

  function createClock(canvas, opts) {
    var o = {
      size: 300, interactive: false, helper: false, lang: 'en', seconds: false, live: false,
      step: 5, brand: true, time: 0, onChange: null, onRelease: null, onTick: null, label: 'Clock'
    };
    for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    var dpr = ZsCanvas.dpr();
    var S = 0, face = null, glass = null, faceC = null, glassC = null;
    var T = o.time, disp = o.time;
    var anim = null, drag = null, dirty = true;
    var elapsedFrom = null, marker = null, glow = null;
    var lastTickBucket = null;
    var ctx = null;

    function build() {
      S = Math.max(40, Math.round(o.size * dpr));
      canvas.width = S; canvas.height = S;
      canvas.style.width = o.size + 'px';
      canvas.style.height = o.size + 'px';
      ctx = ZsCanvas.get2d(canvas);
      // the face and glass canvases are repainted in place, not replaced
      faceC = faceC || mk(S, S); glassC = glassC || mk(S, S);
      face = drawFace(S, o, faceC);
      glass = drawGlass(S, glassC);
      dirty = true; kick();
    }

    function render(now) {
      if (!ctx && !(ctx = ZsCanvas.get2d(canvas))) return;
      var g = geo(S), Rd = g.Rd;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, S, S);
      if (face) ctx.drawImage(face, 0, 0);
      ctx.translate(S / 2, S / 2);
      var m = disp, secA = 0;
      if (o.live) {
        var d = new Date();
        var secs = d.getSeconds() + d.getMilliseconds() / 1000;
        m = d.getHours() * 60 + d.getMinutes() + secs / 60;
        secA = secs / 60 * TAU;
      } else if (o.seconds) {
        secA = ((now / 1000) % 60) / 60 * TAU;
      }
      if (elapsedFrom != null) {
        var span = m - elapsedFrom;
        var a0 = elapsedFrom / 60 * TAU - Math.PI / 2;
        var laps = Math.floor(Math.abs(span) / 60);
        for (var l = 0; l < Math.min(laps, 3); l++) {
          ctx.beginPath(); ctx.arc(0, 0, Rd * 0.94, 0, TAU);
          ctx.fillStyle = 'rgba(245,158,11,0.13)'; ctx.fill();
        }
        var part = (span % 60) / 60 * TAU;
        if (Math.abs(part) > 0.001) {
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.arc(0, 0, Rd * 0.94, a0, a0 + part, part < 0);
          ctx.closePath();
          ctx.fillStyle = 'rgba(245,158,11,0.26)'; ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 0, Rd * 0.94, a0, a0 + part, part < 0);
          ctx.strokeStyle = 'rgba(217,119,6,0.9)'; ctx.lineWidth = S * 0.008; ctx.stroke();
        }
      }
      if (marker != null) {
        var am = marker / 60 * TAU;
        ctx.save(); ctx.rotate(am);
        ctx.beginPath();
        ctx.moveTo(0, -Rd * 0.955); ctx.lineTo(-Rd * 0.035, -Rd * 1.0); ctx.lineTo(Rd * 0.035, -Rd * 1.0);
        ctx.closePath(); ctx.fillStyle = '#d97706'; ctx.fill();
        ctx.restore();
      }
      drawHands(ctx, S, Rd, (m / 720) * TAU, (m / 60) * TAU, secA, o.helper, o.live || o.seconds, o.size < 140);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (glass) ctx.drawImage(glass, 0, 0);
      if (glow) {
        var gt = (now - glow.t0) / 900;
        if (gt >= 1) { glow = null; }
        else {
          ctx.translate(S / 2, S / 2);
          ctx.beginPath(); ctx.arc(0, 0, g.R * 1.0, 0, TAU);
          ctx.strokeStyle = glow.color.replace('A', String(0.75 * (1 - gt)));
          ctx.lineWidth = S * 0.022 * (1 - gt * 0.5);
          ctx.stroke();
        }
      }
    }

    var api = {
      _frame: function(now) {
        if (!canvas.isConnected) { api.destroy(); return false; }
        if (anim) {
          var t = Math.min(1, (now - anim.t0) / anim.dur);
          disp = anim.from + (anim.to - anim.from) * ease(t);
          if (o.onChange && anim.report) o.onChange(disp);
          if (t >= 1) {
            disp = anim.to; var done = anim.onDone; anim = null;
            if (done) done();
          }
          dirty = true;
        }
        var need = dirty || o.live || o.seconds || !!glow || !!anim;
        if (need) { render(now); dirty = false; }
        return o.live || o.seconds || !!glow || !!anim || dirty;
      },
      setTime: function(t, animMs, onDone, report) {
        T = t;
        if (animMs) {
          anim = { from: disp, to: t, t0: performance.now(), dur: animMs, onDone: onDone, report: report !== false };
        } else { anim = null; disp = t; if (onDone) onDone(); }
        dirty = true; kick();
        updateAria();
      },
      getTime: function() { return T; },
      getShown: function() { return disp; },
      setOptions: function(p) {
        var rebuild = false;
        for (var key in p) {
          if (!Object.prototype.hasOwnProperty.call(p, key)) continue;
          if ((key === 'helper' || key === 'lang' || key === 'size') && o[key] !== p[key]) rebuild = true;
          o[key] = p[key];
        }
        if (rebuild) build(); else { dirty = true; kick(); }
        canvas.style.cursor = o.interactive ? 'grab' : 'default';
        canvas.tabIndex = o.interactive ? 0 : -1;
      },
      setElapsed: function(from) { elapsedFrom = from; dirty = true; kick(); },
      setMarker: function(t) { marker = t; dirty = true; kick(); },
      flash: function(kind) {
        glow = { t0: performance.now(), color: kind === 'good' ? 'rgba(22,163,74,A)' : 'rgba(234,88,12,A)' };
        kick();
      },
      resize: function(size) { if (Math.abs(size - o.size) > 1) { o.size = size; build(); } },
      isDragging: function() { return !!drag; },
      destroy: function() {
        var i = clocks.indexOf(api);
        if (i >= 0) clocks.splice(i, 1);
        // free the memory now; the canvas is about to leave the page
        ZsCanvas.release(faceC); ZsCanvas.release(glassC); ZsCanvas.release(canvas);
        faceC = glassC = face = glass = ctx = null;
      }
    };

    function updateAria() {
      if (!o.interactive) return;
      var t = ((Math.round(T) % 720) + 720) % 720;
      var h = Math.floor(t / 60) || 12, m = t % 60;
      canvas.setAttribute('aria-valuetext', h + ':' + (m < 10 ? '0' : '') + m);
    }

    function polar(e) {
      var r = canvas.getBoundingClientRect();
      var px = e.clientX - r.left - r.width / 2, py = e.clientY - r.top - r.height / 2;
      return { a: (Math.atan2(px, -py) + TAU) % TAU, r: Math.sqrt(px * px + py * py) / (r.width / 2) };
    }
    canvas.addEventListener('pointerdown', function(e) {
      if (!o.interactive) return;
      e.preventDefault();
      var p = polar(e);
      if (p.r > 1.02) return;
      anim = null; disp = T;
      var am = ((disp % 60) + 60) % 60 / 60 * TAU;
      var ah = ((disp % 720) + 720) % 720 / 720 * TAU;
      var dm = angDist(p.a, am), dh = angDist(p.a, ah);
      var hand = (p.r < 0.5 && dh + 0.12 < dm) ? 'hour' : 'minute';
      drag = { hand: hand, last: p.a, id: e.pointerId };
      lastTickBucket = Math.floor(T / 5);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      canvas.style.cursor = 'grabbing';
      kick();
    });
    canvas.addEventListener('pointermove', function(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var p = polar(e);
      var d = p.a - drag.last;
      if (d > Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
      drag.last = p.a;
      T += d / TAU * (drag.hand === 'minute' ? 60 : 720);
      disp = T; dirty = true; kick();
      var bucket = Math.floor(T / 5);
      if (bucket !== lastTickBucket) { lastTickBucket = bucket; if (o.onTick) o.onTick(); }
      if (o.onChange) o.onChange(T);
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      drag = null;
      canvas.style.cursor = 'grab';
      var snapped = Math.round(T / o.step) * o.step;
      api.setTime(snapped, 200, function() { if (o.onRelease) o.onRelease(snapped); });
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('keydown', function(e) {
      if (!o.interactive) return;
      var delta = 0, big = e.shiftKey ? 60 : o.step;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = big;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -big;
      else if (e.key === 'PageUp') delta = 60;
      else if (e.key === 'PageDown') delta = -60;
      if (!delta) return;
      e.preventDefault();
      var target = Math.round((T + delta) / o.step) * o.step;
      api.setTime(target, 160, function() { if (o.onRelease) o.onRelease(target); });
      if (o.onTick) o.onTick();
    });

    canvas.setAttribute('role', o.interactive ? 'slider' : 'img');
    canvas.setAttribute('aria-label', o.label);
    canvas.style.touchAction = 'none';
    canvas.style.cursor = o.interactive ? 'grab' : 'default';
    canvas.tabIndex = o.interactive ? 0 : -1;
    build();
    updateAria();
    clocks.push(api);
    kick();
    return api;
  }

  // ---------------------------------------------------------------
  // Flip-card digital display
  // ---------------------------------------------------------------
  function createFlip(host) {
    function card() {
      return '<span class="qf-card"><span class="qf-half qf-top"><b></b></span>' +
        '<span class="qf-half qf-bot"><b></b></span>' +
        '<span class="qf-half qf-ftop"><b></b></span>' +
        '<span class="qf-half qf-fbot"><b></b></span><i class="qf-hinge"></i></span>';
    }
    host.classList.add('qf');
    host.innerHTML = '<span class="qf-case"><span class="qf-cards">' + card() + card() +
      '<span class="qf-colon" aria-hidden="true"><i></i><i></i></span>' + card() + card() +
      '</span><span class="qf-suffix"></span></span>';
    var cards = host.querySelectorAll('.qf-card');
    var suffix = host.querySelector('.qf-suffix');
    var vals = [null, null, null, null];
    var timers = [];
    function setCard(i, v, animate) {
      if (vals[i] === v) return;
      var c = cards[i], old = vals[i] == null ? '' : vals[i];
      vals[i] = v;
      var q = c.querySelectorAll('b');
      clearTimeout(timers[i]);
      if (!animate) {
        q[0].textContent = v; q[1].textContent = v;
        c.classList.remove('flip');
        return;
      }
      q[0].textContent = v;   // static top: new
      q[1].textContent = old; // static bottom: old, until the flap lands
      q[2].textContent = old; // falling top flap
      q[3].textContent = v;   // rising bottom flap
      c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip');
      timers[i] = setTimeout(function() { q[1].textContent = v; c.classList.remove('flip'); }, 560);
    }
    return {
      // text: "3:30", "15:05" or "--:--"; suf: "a.m." etc or ''
      set: function(text, suf, animate) {
        var parts = String(text).split(':');
        var h = parts[0] || '', m = parts[1] || '';
        if (h.length < 2) h = ' ' + h;
        var digs = [h[0], h[1], m[0] || '', m[1] || ''];
        for (var i = 0; i < 4; i++) setCard(i, digs[i] === ' ' ? '' : digs[i], animate !== false);
        suffix.textContent = suf || '';
        suffix.style.display = suf ? '' : 'none';
        host.setAttribute('aria-label', 'Digital time ' + text + (suf ? ' ' + suf : ''));
      }
    };
  }

  // ---------------------------------------------------------------
  // My Day scenes (SVG strings) + live sky
  // ---------------------------------------------------------------
  var SKY = [
    [0, '#070c26', '#17204a'], [290, '#0a1031', '#1f2a58'], [350, '#283371', '#b77d99'],
    [400, '#5a78c0', '#f4ad78'], [470, '#6aaee9', '#cbe6f6'], [720, '#3b92e2', '#a7d4f4'],
    [1030, '#4895dc', '#bcdcf1'], [1130, '#6176b9', '#f2a466'], [1185, '#3a3c7c', '#e2775a'],
    [1240, '#1b2052', '#5c4778'], [1310, '#0a1031', '#1c2450'], [1440, '#070c26', '#17204a']
  ];
  function hex2(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function mix(a, b, t) {
    var A = hex2(a), B = hex2(b), out = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.round(A[i] + (B[i] - A[i]) * t);
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }
  function skyAt(t) {
    t = ((t % 1440) + 1440) % 1440;
    for (var i = 0; i < SKY.length - 1; i++) {
      if (t >= SKY[i][0] && t <= SKY[i + 1][0]) {
        var u = (t - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]);
        return [mix(SKY[i][1], SKY[i + 1][1], u), mix(SKY[i][2], SKY[i + 1][2], u)];
      }
    }
    return [SKY[0][1], SKY[0][2]];
  }
  // 0 = full day, 1 = full night
  function nightness(t) {
    t = ((t % 1440) + 1440) % 1440;
    if (t < 330 || t > 1290) return 1;
    if (t < 450) return 1 - (t - 330) / 120;
    if (t > 1150) return (t - 1150) / 140;
    return 0;
  }
  var SUNRISE = 400, SUNSET = 1210;

  function updateSky(root, t) {
    if (!root) return;
    t = ((t % 1440) + 1440) % 1440;
    var s = skyAt(t), n = nightness(t);
    var top = root.querySelector('#qs-skyTop'), bot = root.querySelector('#qs-skyBot');
    if (top) top.setAttribute('stop-color', s[0]);
    if (bot) bot.setAttribute('stop-color', s[1]);
    var box = root.querySelector('#qs-skybox');
    if (!box) return;
    var bx = +box.getAttribute('x'), by = +box.getAttribute('y'),
        bw = +box.getAttribute('width'), bh = +box.getAttribute('height');
    var sun = root.querySelector('#qs-sun'), moon = root.querySelector('#qs-moon');
    var horizon = by + bh * 0.92;
    if (sun) {
      if (t > SUNRISE - 20 && t < SUNSET + 20) {
        var u = (t - SUNRISE) / (SUNSET - SUNRISE);
        var sx = bx + bw * (0.08 + 0.84 * u), sy = horizon - Math.sin(Math.max(0, Math.min(1, u)) * Math.PI) * bh * 0.78;
        sun.setAttribute('transform', 'translate(' + sx.toFixed(1) + ',' + sy.toFixed(1) + ')');
        sun.setAttribute('opacity', '1');
        var low = 1 - Math.min(1, Math.sin(Math.max(0, Math.min(1, u)) * Math.PI) * 2.2);
        var core = root.querySelector('#qs-sunCore');
        if (core) core.setAttribute('fill', mix('#fff6c9', '#ff9a4a', low));
      } else sun.setAttribute('opacity', '0');
    }
    if (moon) {
      var nt = t >= SUNSET ? t - SUNSET : t + 1440 - SUNSET;
      var nu = nt / (1440 - (SUNSET - SUNRISE));
      if (nu > 0 && nu < 1) {
        var mx = bx + bw * (0.1 + 0.8 * nu), my = horizon - Math.sin(nu * Math.PI) * bh * 0.7;
        moon.setAttribute('transform', 'translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ')');
        moon.setAttribute('opacity', String(Math.min(1, n * 1.3)));
      } else moon.setAttribute('opacity', '0');
    }
    var stars = root.querySelector('#qs-stars');
    if (stars) stars.setAttribute('opacity', String(Math.max(0, n * 1.2 - 0.2)));
    var dim = root.querySelectorAll('.qs-dim');
    for (var i = 0; i < dim.length; i++) dim[i].setAttribute('opacity', String(n * (+dim[i].getAttribute('data-max') || 0.5)));
    var lamps = root.querySelectorAll('.qs-lamp');
    for (var j = 0; j < lamps.length; j++) lamps[j].setAttribute('opacity', String(Math.min(1, n * 1.4)));
    var warm = root.querySelectorAll('.qs-warm');
    var golden = (t > 1080 && t < 1260) ? Math.sin((t - 1080) / 180 * Math.PI) : ((t > 380 && t < 480) ? Math.sin((t - 380) / 100 * Math.PI) : 0);
    for (var w = 0; w < warm.length; w++) warm[w].setAttribute('opacity', String(golden * 0.35));
  }

  // -- shared SVG pieces ------------------------------------------------
  function defs(extra) {
    return '<defs>' +
      '<linearGradient id="qs-sky" x1="0" y1="0" x2="0" y2="1"><stop id="qs-skyTop" offset="0" stop-color="#3b92e2"/><stop id="qs-skyBot" offset="1" stop-color="#a7d4f4"/></linearGradient>' +
      '<radialGradient id="qs-sunGlow"><stop offset="0" stop-color="#fff7d6" stop-opacity="0.95"/><stop offset="0.35" stop-color="#ffd27a" stop-opacity="0.45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="qs-moonG" cx="0.4" cy="0.35"><stop offset="0" stop-color="#fffef4"/><stop offset="1" stop-color="#d9dcc8"/></radialGradient>' +
      '<radialGradient id="qs-lampGlow"><stop offset="0" stop-color="#ffe3a3" stop-opacity="0.85"/><stop offset="0.4" stop-color="#ffc861" stop-opacity="0.35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="qs-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6436"/><stop offset="1" stop-color="#6e4020"/></linearGradient>' +
      '<linearGradient id="qs-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8683a"/><stop offset="0.5" stop-color="#8a5028"/><stop offset="1" stop-color="#6a3a1a"/></linearGradient>' +
      '<linearGradient id="qs-woodH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4422"/><stop offset="0.5" stop-color="#9c5e33"/><stop offset="1" stop-color="#6e3b1c"/></linearGradient>' +
      '<linearGradient id="qs-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dcd6c9"/></linearGradient>' +
      '<linearGradient id="qs-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.05"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="0.62" stop-color="#fff" stop-opacity="0.12"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="qs-curtain" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="13" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#9f2f3b"/><stop offset="0.25" stop-color="#cf4b57"/><stop offset="0.5" stop-color="#a8323e"/><stop offset="0.75" stop-color="#7e2230"/><stop offset="1" stop-color="#9f2f3b"/></linearGradient>' +
      '<linearGradient id="qs-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d8db3"/><stop offset="1" stop-color="#9fb0c9"/></linearGradient>' +
      '<linearGradient id="qs-mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f7a6a"/><stop offset="1" stop-color="#7f9a72"/></linearGradient>' +
      '<linearGradient id="qs-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fae4a"/><stop offset="1" stop-color="#3f7f2c"/></linearGradient>' +
      '<linearGradient id="qs-china" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8dde6"/></linearGradient>' +
      '<linearGradient id="qs-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b3"/><stop offset="0.5" stop-color="#c8952f"/><stop offset="1" stop-color="#7a5212"/></linearGradient>' +
      '<pattern id="qs-paper" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#efe3cc"/><path d="M0 7h14M7 0v14" stroke="#e4d3b4" stroke-width="1"/><circle cx="7" cy="7" r="1.4" fill="#d9c49d"/></pattern>' +
      '<pattern id="qs-planks" width="60" height="70" patternUnits="userSpaceOnUse"><path d="M0 0v70M30 0v35M60 0v70" stroke="#5a3418" stroke-width="1" opacity="0.5"/><path d="M0 35h30" stroke="#5a3418" stroke-width="1" opacity="0.35"/></pattern>' +
      '<pattern id="qs-check" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff"/><rect width="8" height="16" fill="#e86a6a" opacity="0.55"/><rect width="16" height="8" fill="#e86a6a" opacity="0.55"/></pattern>' +
      '<pattern id="qs-quilt" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#3d6fb6"/><rect width="13" height="13" fill="#f3c55c"/><rect x="13" y="13" width="13" height="13" fill="#f3c55c"/><path d="M0 0h26v26" stroke="#fff" stroke-opacity="0.5" stroke-dasharray="2 2" fill="none"/></pattern>' +
      '<linearGradient id="qs-fold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0b1a33" stop-opacity="0.35"/></linearGradient>' +
      '<radialGradient id="qs-pillow" cx="0.45" cy="0.3" r="0.7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ddd5c4"/></radialGradient>' +
      '<filter id="qs-soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="qs-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>' +
      (extra || '') + '</defs>';
  }
  function starsG(x, y, w, h) {
    var r = rng(21), s = '<g id="qs-stars" opacity="0">';
    for (var i = 0; i < 28; i++) {
      s += '<circle cx="' + (x + r() * w).toFixed(1) + '" cy="' + (y + r() * h * 0.75).toFixed(1) + '" r="' + (0.5 + r() * 1.1).toFixed(2) + '" fill="#fff" opacity="' + (0.5 + r() * 0.5).toFixed(2) + '"/>';
    }
    return s + '</g>';
  }
  function sunMoon() {
    return '<g id="qs-sun"><circle r="26" fill="url(#qs-sunGlow)"/><circle id="qs-sunCore" r="9" fill="#fff6c9"/></g>' +
      '<g id="qs-moon" opacity="0"><circle r="14" fill="#fff" opacity="0.12"/><circle r="8" fill="url(#qs-moonG)"/>' +
      '<circle cx="-2" cy="-1" r="1.6" fill="#c9cbb6"/><circle cx="2.5" cy="2.5" r="1.1" fill="#c9cbb6"/></g>';
  }
  // The Andes: far range with snow, nearer foothills.
  function andes(x, y, w, h, near) {
    var p1 = [], seed = rng(9);
    var peaks = 9, step = w / peaks;
    var far = 'M' + x + ' ' + (y + h);
    var snow = '';
    for (var i = 0; i <= peaks; i++) {
      var px = x + i * step, top = y + h * (0.1 + seed() * 0.35);
      var vx = px + step * 0.5, vy = y + h * (0.45 + seed() * 0.2);
      far += ' L' + px.toFixed(1) + ' ' + top.toFixed(1) + ' L' + vx.toFixed(1) + ' ' + vy.toFixed(1);
      p1.push([px, top]);
    }
    far += ' L' + (x + w) + ' ' + (y + h) + 'Z';
    p1.forEach(function(p) {
      var sw = step * 0.28, sh = h * 0.16;
      snow += '<path d="M' + (p[0] - sw).toFixed(1) + ' ' + (p[1] + sh).toFixed(1) + ' L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) +
        ' L' + (p[0] + sw).toFixed(1) + ' ' + (p[1] + sh).toFixed(1) + ' l-' + (sw * 0.4).toFixed(1) + ' -' + (sh * 0.3).toFixed(1) +
        ' l-' + (sw * 0.35).toFixed(1) + ' ' + (sh * 0.35).toFixed(1) + ' l-' + (sw * 0.3).toFixed(1) + ' -' + (sh * 0.4).toFixed(1) + 'Z" fill="#f4f7fb" opacity="0.95"/>';
    });
    var out = '<path d="' + far + '" fill="url(#qs-mtn)"/>' + snow;
    if (near) {
      out += '<path d="M' + x + ' ' + (y + h) + ' Q' + (x + w * 0.15) + ' ' + (y + h * 0.55) + ' ' + (x + w * 0.32) + ' ' + (y + h * 0.75) +
        ' T' + (x + w * 0.65) + ' ' + (y + h * 0.7) + ' T' + (x + w) + ' ' + (y + h * 0.62) + ' L' + (x + w) + ' ' + (y + h) + 'Z" fill="url(#qs-mtn2)"/>';
    }
    return out;
  }
  function windowBox(x, y, w, h) {
    return '<rect x="' + (x - 8) + '" y="' + (y - 8) + '" width="' + (w + 16) + '" height="' + (h + 16) + '" rx="3" fill="url(#qs-frame)" stroke="#bdb5a5"/>' +
      '<g clip-path="url(#qs-winClip)">' +
        '<rect id="qs-skybox" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#qs-sky)"/>' +
        starsG(x, y, w, h) + sunMoon() +
        andes(x, y + h * 0.45, w, h * 0.55, true) +
        '<rect class="qs-dim" data-max="0.55" x="' + x + '" y="' + (y + h * 0.45) + '" width="' + w + '" height="' + h * 0.55 + '" fill="#0a1030" opacity="0"/>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#qs-glass)"/>' +
      '</g>' +
      '<path d="M' + (x + w / 2) + ' ' + y + 'v' + h + 'M' + x + ' ' + (y + h * 0.42) + 'h' + w + '" stroke="url(#qs-frame)" stroke-width="7"/>' +
      '<path d="M' + (x + w / 2 + 3.5) + ' ' + y + 'v' + h + '" stroke="#c9c1b0" stroke-width="1"/>' +
      '<rect x="' + (x - 14) + '" y="' + (y + h + 6) + '" width="' + (w + 28) + '" height="9" rx="2" fill="url(#qs-frame)" stroke="#bdb5a5"/>' +
      '<rect x="' + (x - 12) + '" y="' + (y + h + 15) + '" width="' + (w + 24) + '" height="5" fill="#000" opacity="0.12" filter="url(#qs-soft)"/>';
  }
  function curtains(x, y, w, h) {
    var cw = w * 0.26;
    return '<rect x="' + (x - 26) + '" y="' + (y - 22) + '" width="' + (w + 52) + '" height="6" rx="3" fill="url(#qs-brass)"/>' +
      '<path d="M' + (x - 22) + ' ' + (y - 18) + ' h' + cw + ' q-8 ' + h * 0.5 + ' 6 ' + (h * 0.72) + ' q-' + cw * 0.5 + ' ' + h * 0.15 + ' -' + (cw + 6) + ' ' + (h * 0.48) + 'Z" fill="url(#qs-curtain)" style="--w:18px"/>' +
      '<path d="M' + (x + w + 22) + ' ' + (y - 18) + ' h-' + cw + ' q8 ' + h * 0.5 + ' -6 ' + (h * 0.72) + ' q' + cw * 0.5 + ' ' + h * 0.15 + ' ' + (cw + 6) + ' ' + (h * 0.48) + 'Z" fill="url(#qs-curtain)"/>' +
      '<rect x="' + (x - 22) + '" y="' + (y + h * 0.5) + '" width="' + (cw * 0.8) + '" height="5" rx="2" fill="#e8c15a" transform="rotate(-8 ' + (x - 10) + ' ' + (y + h * 0.5) + ')"/>' +
      '<rect x="' + (x + w + 22 - cw * 0.8) + '" y="' + (y + h * 0.5) + '" width="' + (cw * 0.8) + '" height="5" rx="2" fill="#e8c15a" transform="rotate(8 ' + (x + w + 10) + ' ' + (y + h * 0.5) + ')"/>';
  }
  function room(wallA, wallB, win, props, glows) {
    var w = win || { x: 52, y: 40, w: 132, h: 108 };
    return '<svg class="qs-scene" viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img">' +
      defs('<linearGradient id="qs-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + wallA + '"/><stop offset="1" stop-color="' + wallB + '"/></linearGradient>' +
           '<clipPath id="qs-winClip"><rect x="' + w.x + '" y="' + w.y + '" width="' + w.w + '" height="' + w.h + '"/></clipPath>') +
      '<rect width="480" height="270" fill="url(#qs-wall)"/>' +
      '<g opacity="0.07">' + (function() { var s = ''; for (var i = 0; i < 480; i += 24) s += '<rect x="' + i + '" width="10" height="205" fill="#fff"/>'; return s; })() + '</g>' +
      '<rect y="168" width="480" height="38" fill="#000" opacity="0.06"/>' +
      '<rect y="166" width="480" height="4" fill="#fff" opacity="0.35"/>' +
      '<rect y="200" width="480" height="70" fill="url(#qs-floor)"/>' +
      '<rect y="200" width="480" height="70" fill="url(#qs-planks)"/>' +
      '<rect y="196" width="480" height="7" fill="#f4efe6"/><rect y="203" width="480" height="3" fill="#000" opacity="0.18"/>' +
      '<rect class="qs-warm" x="0" y="0" width="480" height="270" fill="#ff9a4a" opacity="0"/>' +
      windowBox(w.x, w.y, w.w, w.h) + curtains(w.x, w.y, w.w, w.h) +
      props +
      '<rect class="qs-dim" data-max="0.42" width="480" height="270" fill="#0b1236" opacity="0" style="mix-blend-mode:multiply"/>' +
      (glows || '') +
      '</svg>';
  }
  function outdoor(props, extraDefs) {
    return '<svg class="qs-scene" viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" role="img">' +
      defs((extraDefs || '') + '<clipPath id="qs-winClip"><rect width="480" height="270"/></clipPath>') +
      '<rect id="qs-skybox" x="0" y="0" width="480" height="200" fill="url(#qs-sky)"/>' +
      '<rect y="190" width="480" height="80" fill="url(#qs-sky)"/>' +
      starsG(0, 0, 480, 170) + sunMoon() +
      andes(-10, 70, 500, 120, true) +
      '<rect class="qs-dim" data-max="0.5" x="0" y="70" width="480" height="200" fill="#0a1030" opacity="0"/>' +
      props +
      '<rect class="qs-warm" x="0" y="0" width="480" height="270" fill="#ff9a4a" opacity="0"/>' +
      '<rect class="qs-dim" data-max="0.4" width="480" height="270" fill="#0b1236" opacity="0" style="mix-blend-mode:multiply"/>' +
      '</svg>';
  }
  function shadowEllipse(cx, cy, rx, ry, op) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#000" opacity="' + (op || 0.25) + '" filter="url(#qs-soft)"/>';
  }
  function table(x, y, w, cloth) {
    return shadowEllipse(x + w / 2, 252, w * 0.55, 8, 0.3) +
      '<rect x="' + (x + 12) + '" y="' + (y + 10) + '" width="9" height="' + (248 - y - 10) + '" fill="url(#qs-woodH)"/>' +
      '<rect x="' + (x + w - 21) + '" y="' + (y + 10) + '" width="9" height="' + (248 - y - 10) + '" fill="url(#qs-woodH)"/>' +
      '<rect x="' + (x + 30) + '" y="' + (y + 10) + '" width="7" height="' + (238 - y - 10) + '" fill="#5e3318"/>' +
      '<rect x="' + (x + w - 37) + '" y="' + (y + 10) + '" width="7" height="' + (238 - y - 10) + '" fill="#5e3318"/>' +
      '<path d="M' + (x + 8) + ' ' + y + ' h' + (w - 16) + ' l8 12 h-' + w + 'Z" fill="#b4733f"/>' +
      '<rect x="' + x + '" y="' + (y + 12) + '" width="' + w + '" height="8" fill="url(#qs-wood)"/>' +
      (cloth ? '<path d="M' + (x + 4) + ' ' + (y - 1) + ' h' + (w - 8) + ' l10 14 v22 q-' + (w * 0.25) + ' 6 -' + (w * 0.5 + 6) + ' 0 q-' + (w * 0.25) + ' 6 -' + (w * 0.5 + 6) + ' 0 v-22Z" fill="url(#qs-check)" stroke="#d9c7b8"/>' +
        '<path d="M' + (x - 6) + ' ' + (y + 13) + ' h' + (w + 12) + ' v22 q-' + (w * 0.25) + ' 6 -' + (w * 0.5 + 6) + ' 0 q-' + (w * 0.25) + ' 6 -' + (w * 0.5 + 6) + ' 0Z" fill="#000" opacity="0.08"/>' : '');
  }
  function plate(cx, cy, r) {
    return '<ellipse cx="' + cx + '" cy="' + (cy + 2) + '" rx="' + r + '" ry="' + r * 0.3 + '" fill="#000" opacity="0.15"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r * 0.3 + '" fill="url(#qs-china)" stroke="#b9c0cc" stroke-width="0.8"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r * 0.68 + '" ry="' + r * 0.19 + '" fill="none" stroke="#c7cdd6" stroke-width="0.8"/>';
  }
  function mug(x, y, color) {
    return '<path d="M' + (x + 18) + ' ' + (y + 5) + ' q9 0 9 8 t-9 8" fill="none" stroke="' + color + '" stroke-width="3.5"/>' +
      '<rect x="' + x + '" y="' + y + '" width="20" height="22" rx="3" fill="' + color + '"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + 2) + '" width="4" height="17" rx="2" fill="#fff" opacity="0.35"/>' +
      '<ellipse cx="' + (x + 10) + '" cy="' + y + '" rx="10" ry="2.6" fill="#5b3418"/>' +
      '<g class="qs-steam" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7">' +
        '<path d="M' + (x + 6) + ' ' + (y - 4) + ' q-4 -6 0 -12 t0 -12"/><path d="M' + (x + 13) + ' ' + (y - 6) + ' q4 -6 0 -12 t0 -12"/></g>';
  }
  function glass(x, y, fill) {
    return '<path d="M' + x + ' ' + y + ' h16 l-2 26 h-12Z" fill="#e8f1f8" opacity="0.6" stroke="#b7c7d6" stroke-width="0.8"/>' +
      '<path d="M' + (x + 1) + ' ' + (y + 8) + ' h14 l-1.4 17 h-11.2Z" fill="' + fill + '"/>' +
      '<path d="M' + (x + 3) + ' ' + (y + 2) + ' l1 22" stroke="#fff" stroke-width="1.6" opacity="0.7"/>';
  }
  function bed(night) {
    return shadowEllipse(355, 250, 125, 10, 0.32) +
      // headboard
      '<path d="M250 112 q0 -20 20 -20 h160 q20 0 20 20 v100 h-200Z" fill="url(#qs-wood)"/>' +
      '<path d="M262 116 q0 -12 12 -12 h152 q12 0 12 12 v40 h-176Z" fill="#000" opacity="0.12"/>' +
      '<path d="M262 113 q0 -12 12 -12 h152 q12 0 12 12" fill="none" stroke="#c98a55" stroke-width="2" opacity="0.6"/>' +
      // mattress + quilt
      '<rect x="244" y="160" width="222" height="16" rx="6" fill="#f6f1e6"/>' +
      '<path d="M258 140 q-4 -14 14 -16 h52 q14 2 10 16 q-4 10 -38 10 q-34 0 -38 -10Z" fill="url(#qs-pillow)" stroke="#d6cdbb"/>' +
      '<path d="M268 138 q20 6 56 0" stroke="#e2dccf" fill="none"/>' +
      (night
        ? '<path d="M240 152 h232 v52 q-116 12 -232 0Z" fill="url(#qs-quilt)"/>'
        : '<path d="M330 150 h142 v54 q-80 10 -142 0Z" fill="url(#qs-quilt)"/><path d="M330 150 q-20 22 -6 54 l14 0 q-12 -26 6 -54Z" fill="#2e5797"/>') +
      '<path d="' + (night ? 'M240 152' : 'M330 150') + ' h' + (night ? 232 : 142) + ' v54 q-80 10 -' + (night ? 232 : 142) + ' 0Z" fill="url(#qs-fold)"/>' +
      '<path d="' + (night ? 'M262 168 q30 8 60 0 t70 2 t70 -2' : 'M352 170 q30 8 60 0 t56 2') + '" stroke="#0b1a33" stroke-opacity="0.22" stroke-width="3" fill="none"/>' +
      '<path d="M258 140 q-4 -14 14 -16 h52 q14 2 10 16" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>' +
      '<rect x="252" y="206" width="9" height="40" fill="url(#qs-woodH)"/><rect x="452" y="206" width="9" height="40" fill="url(#qs-woodH)"/>' +
      '<rect x="240" y="202" width="232" height="8" rx="3" fill="url(#qs-wood)"/>';
  }
  function nightstand(x) {
    return shadowEllipse(x + 22, 248, 28, 5, 0.3) +
      '<rect x="' + x + '" y="164" width="44" height="80" rx="2" fill="url(#qs-wood)"/>' +
      '<rect x="' + (x + 4) + '" y="174" width="36" height="28" rx="2" fill="#000" opacity="0.12"/>' +
      '<circle cx="' + (x + 22) + '" cy="188" r="2.5" fill="url(#qs-brass)"/>' +
      '<rect x="' + (x - 3) + '" y="160" width="50" height="6" rx="2" fill="#a8683a"/>';
  }
  function alarmClock(cx, cy) {
    return '<g>' +
      '<path d="M' + (cx - 11) + ' ' + (cy + 9) + ' l-4 7 M' + (cx + 11) + ' ' + (cy + 9) + ' l4 7" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="' + (cx - 10) + '" cy="' + (cy - 12) + '" r="6.5" fill="url(#qs-brass)"/><circle cx="' + (cx + 10) + '" cy="' + (cy - 12) + '" r="6.5" fill="url(#qs-brass)"/>' +
      '<path d="M' + (cx - 6) + ' ' + (cy - 19) + ' q6 -5 12 0" stroke="#8a6a2a" stroke-width="2" fill="none"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="#c0392b"/><circle cx="' + (cx - 3) + '" cy="' + (cy - 3) + '" r="14" fill="#e74c3c" opacity="0.5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="#fffaf0" stroke="#7a1d14" stroke-width="1.2"/>' +
      '<path d="M' + cx + ' ' + cy + ' l-5 -3 M' + cx + ' ' + cy + ' l5 -5" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M' + (cx - 8) + ' ' + (cy - 8) + ' q4 -3 8 -3" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.8"/></g>';
  }
  function lamp(x, on) {
    return '<g>' +
      (on ? '<circle class="qs-lamp" cx="' + (x + 14) + '" cy="132" r="62" fill="url(#qs-lampGlow)" opacity="0"/>' : '') +
      '<rect x="' + (x + 12) + '" y="136" width="4" height="22" fill="url(#qs-brass)"/>' +
      '<ellipse cx="' + (x + 14) + '" cy="159" rx="10" ry="3" fill="url(#qs-brass)"/>' +
      '<path d="M' + x + ' 138 l6 -24 h16 l6 24Z" fill="#f3e3c3" stroke="#d3bd95"/>' +
      (on ? '<path class="qs-lamp" d="M' + x + ' 138 l6 -24 h16 l6 24Z" fill="#ffd77a" opacity="0"/>' : '') + '</g>';
  }
  function teddy(cx, cy) {
    return '<g>' +
      '<circle cx="' + (cx - 9) + '" cy="' + (cy - 15) + '" r="5" fill="#8b5a2b"/><circle cx="' + (cx + 9) + '" cy="' + (cy - 15) + '" r="5" fill="#8b5a2b"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + 8) + '" rx="13" ry="14" fill="#a0693a"/>' +
      '<circle cx="' + cx + '" cy="' + (cy - 7) + '" r="11" fill="#a86f3e"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy - 3) + '" rx="5" ry="3.6" fill="#e0b98a"/>' +
      '<circle cx="' + (cx - 4) + '" cy="' + (cy - 9) + '" r="1.4" fill="#222"/><circle cx="' + (cx + 4) + '" cy="' + (cy - 9) + '" r="1.4" fill="#222"/>' +
      '<circle cx="' + cx + '" cy="' + (cy - 4.5) + '" r="1.5" fill="#3b2412"/>' +
      '<path d="M' + (cx - 7) + ' ' + (cy + 3) + ' l7 3 l7 -3" stroke="#c0392b" stroke-width="3" fill="none"/></g>';
  }
  function marraqueta(cx, cy) {
    return '<g><path d="M' + (cx - 20) + ' ' + cy + ' q0 -12 10 -12 q8 0 10 5 q2 -5 10 -5 q10 0 10 12 q-20 6 -40 0Z" fill="#d9954a"/>' +
      '<path d="M' + (cx - 16) + ' ' + (cy - 5) + ' q4 -5 10 -5" stroke="#f4cf91" stroke-width="2" fill="none"/>' +
      '<path d="M' + (cx + 4) + ' ' + (cy - 5) + ' q4 -5 10 -5" stroke="#f4cf91" stroke-width="2" fill="none"/>' +
      '<path d="M' + cx + ' ' + (cy - 7) + ' v6" stroke="#a5652a" stroke-width="1.5"/></g>';
  }
  function pianoProps() {
    var keys = '';
    for (var i = 0; i < 26; i++) keys += '<rect x="' + (262 + i * 7.4) + '" y="160" width="7" height="22" fill="#fbfaf5" stroke="#bbb" stroke-width="0.5"/>';
    var pat = [1, 1, 0, 1, 1, 1, 0];
    for (var j = 0; j < 25; j++) if (pat[j % 7]) keys += '<rect x="' + (267 + j * 7.4) + '" y="160" width="4.4" height="13" fill="#111"/>';
    return shadowEllipse(330, 250, 110, 9, 0.35) +
      '<rect x="240" y="70" width="236" height="96" rx="4" fill="#2a120a"/>' +
      '<rect x="240" y="70" width="236" height="96" rx="4" fill="url(#qs-glass)" opacity="0.5"/>' +
      '<rect x="252" y="84" width="212" height="58" rx="3" fill="#3a1a0e" stroke="#5b2c17"/>' +
      '<rect x="236" y="64" width="244" height="10" rx="3" fill="#3d1c10"/>' +
      '<rect x="252" y="152" width="212" height="8" fill="#1c0b05"/>' + keys +
      '<rect x="248" y="182" width="220" height="10" rx="2" fill="#3a1a0e"/>' +
      '<rect x="248" y="192" width="220" height="50" fill="#2a120a"/>' +
      '<rect x="256" y="198" width="204" height="38" rx="3" fill="#3a1a0e" stroke="#5b2c17"/>' +
      '<rect x="250" y="236" width="10" height="12" fill="#1c0b05"/><rect x="456" y="236" width="10" height="12" fill="#1c0b05"/>' +
      // sheet music
      '<path d="M310 112 l38 -4 v40 l-38 4Z" fill="#fbf8ef" stroke="#ccc4b0"/><path d="M350 108 l38 4 v40 l-38 -4Z" fill="#f6f1e2" stroke="#ccc4b0"/>' +
      (function() { var s = ''; for (var k = 0; k < 4; k++) { s += '<path d="M314 ' + (118 + k * 8) + ' l30 -3 M354 ' + (114 + k * 8) + ' l30 3" stroke="#888" stroke-width="0.5"/>'; } return s; })() +
      '<circle cx="322" cy="122" r="1.8" fill="#222"/><circle cx="334" cy="127" r="1.8" fill="#222"/><circle cx="364" cy="121" r="1.8" fill="#222"/><circle cx="376" cy="126" r="1.8" fill="#222"/>' +
      '<rect x="306" y="150" width="88" height="4" rx="2" fill="#5b2c17"/>' +
      // metronome
      '<path d="M420 64 l12 -44 h8 l12 44Z" fill="url(#qs-woodH)"/><path d="M426 58 l9 -32 h2 l9 32Z" fill="#2d160b"/>' +
      '<g class="qs-tick" style="transform-origin:436px 58px"><path d="M436 58 l0 -34" stroke="#d9c06a" stroke-width="1.6"/><rect x="433" y="34" width="6" height="5" fill="url(#qs-brass)"/></g>' +
      // stool
      shadowEllipse(358, 264, 46, 5, 0.4) +
      '<rect x="318" y="234" width="6" height="30" fill="#2a120a"/><rect x="392" y="234" width="6" height="30" fill="#2a120a"/>' +
      '<rect x="330" y="236" width="4" height="24" fill="#1c0b05"/><rect x="382" y="236" width="4" height="24" fill="#1c0b05"/>' +
      '<rect x="312" y="226" width="92" height="11" rx="4" fill="url(#qs-woodH)"/>' +
      '<rect x="316" y="216" width="84" height="13" rx="6" fill="#9b2c3a"/><rect x="322" y="217" width="60" height="4" rx="2" fill="#fff" opacity="0.25"/>';
  }
  function hangingLamp(cx) {
    return '<circle class="qs-lamp" cx="' + cx + '" cy="90" r="120" fill="url(#qs-lampGlow)" opacity="0"/>' +
      '<path d="M' + cx + ' 0 v52" stroke="#333" stroke-width="1.5"/>' +
      '<path d="M' + (cx - 34) + ' 82 q34 -40 68 0Z" fill="#2f5d50"/><path d="M' + (cx - 34) + ' 82 q34 -40 68 0" fill="none" stroke="#e8c15a" stroke-width="1.5"/>' +
      '<ellipse cx="' + cx + '" cy="82" rx="34" ry="4" fill="#173b31"/><ellipse class="qs-lamp" cx="' + cx + '" cy="84" rx="12" ry="4" fill="#fff3c6" opacity="0"/>';
  }
  function schoolProps() {
    var wins = '';
    for (var r = 0; r < 2; r++) for (var c = 0; c < 5; c++) {
      if (c === 2 && r === 1) continue;
      var wx = 148 + c * 40, wy = 132 + r * 34;
      wins += '<rect x="' + wx + '" y="' + wy + '" width="22" height="24" rx="2" fill="#7fb2d9" stroke="#f7f1e3" stroke-width="3"/>' +
        '<path d="M' + (wx + 11) + ' ' + wy + 'v24M' + wx + ' ' + (wy + 12) + 'h22" stroke="#f7f1e3" stroke-width="1.5"/>' +
        '<rect x="' + (wx + 2) + '" y="' + (wy + 2) + '" width="8" height="8" fill="#fff" opacity="0.35"/>' +
        '<rect class="qs-lamp" x="' + wx + '" y="' + wy + '" width="22" height="24" fill="#ffd77a" opacity="0"/>';
    }
    return '<path d="M0 196 q120 -14 240 -6 t240 2 V270 H0Z" fill="url(#qs-grass)"/>' +
      shadowEllipse(240, 236, 130, 8, 0.3) +
      '<rect x="134" y="118" width="212" height="116" fill="#f2e6cf"/>' +
      '<rect x="134" y="118" width="212" height="116" fill="url(#qs-glass)" opacity="0.25"/>' +
      '<path d="M124 122 L240 84 L356 122Z" fill="#b5462e"/>' +
      (function() { var s = ''; for (var i = 0; i < 9; i++) s += '<path d="M' + (130 + i * 26) + ' 121 q13 -4 26 0" stroke="#8c3220" stroke-width="1.4" fill="none" opacity="0.7"/>'; return s; })() +
      '<path d="M124 122 L240 84 L356 122" fill="none" stroke="#7d2a19" stroke-width="3"/>' +
      // bell gable
      '<rect x="222" y="58" width="36" height="34" fill="#efe1c6"/><path d="M216 60 L240 40 L264 60Z" fill="#b5462e"/>' +
      '<path d="M230 88 v-14 q10 -14 20 0 v14Z" fill="#3b2a1e"/><path d="M234 82 q6 -14 12 0Z" fill="url(#qs-brass)"/>' +
      wins +
      '<rect x="224" y="178" width="32" height="56" rx="14" fill="#6b3a1a"/><path d="M240 178 v56" stroke="#4a260f" stroke-width="1.5"/>' +
      '<circle cx="236" cy="208" r="1.8" fill="url(#qs-brass)"/><circle cx="244" cy="208" r="1.8" fill="url(#qs-brass)"/>' +
      '<rect x="216" y="232" width="48" height="5" fill="#cfc4ad"/><rect x="210" y="237" width="60" height="5" fill="#bdb29a"/>' +
      // flag of Chile
      '<rect x="394" y="96" width="3" height="140" fill="#cfd6de"/><circle cx="395.5" cy="95" r="3" fill="url(#qs-brass)"/>' +
      '<g class="qs-flag"><rect x="397" y="100" width="54" height="36" fill="#fff"/><rect x="397" y="118" width="54" height="18" fill="#d52b1e"/>' +
      '<rect x="397" y="100" width="18" height="18" fill="#0039a6"/>' +
      '<path d="M406 104.5 l1.2 3.4 h3.6 l-2.9 2.2 1.1 3.5 -3 -2.1 -3 2.1 1.1 -3.5 -2.9 -2.2 h3.6Z" fill="#fff"/>' +
      '<path d="M397 100 h54 v36 h-54Z" fill="url(#qs-glass)" opacity="0.5"/></g>' +
      // trees
      tree(70, 200, 1) + tree(30, 214, 0.8) + tree(440, 214, 0.7) +
      '<path d="M205 270 q20 -20 25 -28 h20 q5 8 25 28Z" fill="#cdb995"/>';
  }
  function tree(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      shadowEllipse(0, 4, 34, 6, 0.3) +
      '<path d="M-4 0 q2 -24 0 -40 h8 q-2 16 0 40Z" fill="#6b4425"/>' +
      '<circle cx="-14" cy="-48" r="20" fill="#3f7d33"/><circle cx="12" cy="-52" r="22" fill="#4a8c3a"/><circle cx="0" cy="-70" r="20" fill="#5aa045"/>' +
      '<circle cx="-6" cy="-76" r="8" fill="#7cc25d" opacity="0.6"/><circle cx="16" cy="-58" r="7" fill="#7cc25d" opacity="0.4"/></g>';
  }
  function footballProps() {
    var stripes = '';
    for (var i = 0; i < 8; i++) stripes += '<path d="M' + (-40 + i * 70) + ' 270 L' + (80 + i * 48) + ' 186 L' + (104 + i * 48) + ' 186 L' + (30 + i * 70) + ' 270Z" fill="#fff" opacity="0.06"/>';
    var net = '';
    for (var n = 0; n <= 12; n++) net += '<path d="M' + (300 + n * 10) + ' 138 L' + (306 + n * 9) + ' 196" stroke="#fff" stroke-width="0.8" opacity="0.7"/>';
    for (var m = 0; m <= 6; m++) net += '<path d="M' + (300 + m * 1) + ' ' + (140 + m * 9.5) + ' H' + (420 - m * 0.5) + '" stroke="#fff" stroke-width="0.8" opacity="0.7"/>';
    return tree(40, 186, 0.75) + tree(452, 190, 0.6) +
      '<path d="M0 186 H480 V270 H0Z" fill="url(#qs-grass)"/>' + stripes +
      '<path d="M60 270 L170 196 H430" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.85"/>' +
      '<ellipse cx="190" cy="226" rx="44" ry="10" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>' +
      shadowEllipse(362, 198, 70, 5, 0.3) +
      net +
      '<path d="M296 196 V134 H424 V196" stroke="#f8f8f8" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
      '<path d="M298 196 V136 H422 V196" stroke="#bbb" stroke-width="1" fill="none"/>' +
      // ball
      shadowEllipse(214, 252, 16, 4, 0.35) +
      '<circle cx="212" cy="236" r="15" fill="#fafafa"/>' +
      '<path d="M212 229 l6 4 -2 7 h-8 l-2 -7Z" fill="#222"/>' +
      '<path d="M199 230 l4 1 1 6 -4 3 -3 -4Z M225 230 l-4 1 -1 6 4 3 3 -4Z M207 249 l2 -5 h6 l2 5 -5 2Z" fill="#222"/>' +
      '<circle cx="212" cy="236" r="15" fill="none" stroke="#999" stroke-width="0.8"/>' +
      '<circle cx="207" cy="230" r="5" fill="#fff" opacity="0.6"/>' +
      // cones
      cone(110, 234) + cone(150, 214) + cone(268, 224);
  }
  function cone(x, y) {
    return shadowEllipse(x, y + 1, 9, 2.5, 0.3) + '<path d="M' + (x - 8) + ' ' + y + ' L' + x + ' ' + (y - 18) + ' L' + (x + 8) + ' ' + y + 'Z" fill="#f97316"/>' +
      '<path d="M' + (x - 5) + ' ' + (y - 7) + ' h10 l1 3 h-12Z" fill="#fff"/><rect x="' + (x - 10) + '" y="' + y + '" width="20" height="2.5" fill="#ea580c"/>';
  }
  function claypot(cx, cy) {
    return '<g>' + '<ellipse cx="' + cx + '" cy="' + (cy + 18) + '" rx="34" ry="6" fill="#000" opacity="0.2"/>' +
      '<path d="M' + (cx - 34) + ' ' + cy + ' q2 22 34 22 q32 0 34 -22Z" fill="#8a3f1e"/>' +
      '<path d="M' + (cx - 30) + ' ' + (cy + 4) + ' q4 12 18 15" stroke="#c46a3a" stroke-width="3" fill="none" opacity="0.6"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="34" ry="8" fill="#a24c25"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="29" ry="6" fill="#e5b04a"/>' +
      '<ellipse cx="' + (cx - 8) + '" cy="' + (cy - 1) + '" rx="7" ry="2" fill="#b9772a" opacity="0.8"/>' +
      '<ellipse cx="' + (cx + 10) + '" cy="' + (cy + 1) + '" rx="6" ry="1.8" fill="#a8641f" opacity="0.8"/>' +
      '<ellipse cx="' + (cx + 2) + '" cy="' + (cy - 2.5) + '" rx="4" ry="1.2" fill="#fff3c0" opacity="0.7"/></g>';
  }
  function candle(x) {
    return '<rect x="' + (x - 3) + '" y="150" width="6" height="18" fill="#fbf6e9"/><ellipse cx="' + x + '" cy="168" rx="7" ry="2" fill="url(#qs-brass)"/>' +
      '<path class="qs-flame" d="M' + x + ' 138 q4 6 0 12 q-4 -6 0 -12Z" fill="#ffcf5a"/><circle class="qs-lamp" cx="' + x + '" cy="144" r="20" fill="url(#qs-lampGlow)" opacity="0"/>';
  }

  function painting(x, y, w, h) {
    return shadowEllipse(x + w / 2 + 3, y + h + 4, w * 0.45, 3, 0.25) +
      '<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="' + (w + 14) + '" height="' + (h + 14) + '" rx="2" fill="url(#qs-brass)"/>' +
      '<rect x="' + (x - 3) + '" y="' + (y - 3) + '" width="' + (w + 6) + '" height="' + (h + 6) + '" fill="#7a5212" opacity="0.5"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#9cc6e8"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h * 0.5 + '" fill="#f4d9b0" opacity="0.5"/>' +
      '<path d="M' + x + ' ' + (y + h * 0.7) + ' L' + (x + w * 0.22) + ' ' + (y + h * 0.3) + ' L' + (x + w * 0.38) + ' ' + (y + h * 0.5) + ' L' + (x + w * 0.58) + ' ' + (y + h * 0.18) + ' L' + (x + w * 0.8) + ' ' + (y + h * 0.48) + ' L' + (x + w) + ' ' + (y + h * 0.35) + ' V' + (y + h * 0.7) + 'Z" fill="#7d8db3"/>' +
      '<path d="M' + (x + w * 0.52) + ' ' + (y + h * 0.27) + ' L' + (x + w * 0.58) + ' ' + (y + h * 0.18) + ' L' + (x + w * 0.65) + ' ' + (y + h * 0.27) + 'Z" fill="#fff"/>' +
      '<path d="M' + x + ' ' + (y + h * 0.7) + ' Q' + (x + w * 0.5) + ' ' + (y + h * 0.58) + ' ' + (x + w) + ' ' + (y + h * 0.68) + ' V' + (y + h) + ' H' + x + 'Z" fill="#6f9a52"/>' +
      '<rect x="' + x + '" y="' + (y + h * 0.82) + '" width="' + w + '" height="' + h * 0.18 + '" fill="#4f86b8" opacity="0.8"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#qs-glass)" opacity="0.6"/>';
  }
  function glowAt(cx, cy, r) { return '<circle class="qs-lamp" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#qs-lampGlow)" opacity="0" style="mix-blend-mode:screen"/>'; }

  var SCENES = {
    wake: function() {
      return room('#f6e6c8', '#ead2a8', null, nightstand(196) + alarmClock(218, 144) + bed(false) +
        '<ellipse cx="160" cy="236" rx="48" ry="9" fill="#2f6c8f" opacity="0.8"/><ellipse cx="160" cy="236" rx="40" ry="6" fill="none" stroke="#f3c55c" stroke-dasharray="3 3"/>');
    },
    breakfast: function() {
      return room('#e5f0e4', '#c9dfc6', null, painting(300, 48, 96, 64) + table(206, 168, 260, true) +
        plate(262, 168, 26) + marraqueta(262, 166) + mug(304, 142, '#2f6c8f') + glass(344, 140, '#fdfdfd') +
        '<rect x="372" y="146" width="22" height="22" rx="4" fill="#d9a35a" opacity="0.85"/><rect x="370" y="142" width="26" height="7" rx="2" fill="#e8e1d1"/><rect x="376" y="153" width="14" height="9" rx="1" fill="#fff" opacity="0.8"/>' +
        '<path d="M410 166 q14 -16 28 0Z" fill="#f4f1ea" stroke="#cfd3da"/><ellipse cx="424" cy="166" rx="14" ry="3.5" fill="#e9ad3b"/><circle cx="420" cy="164" r="2" fill="#c47d1a"/><circle cx="428" cy="165" r="2" fill="#c47d1a"/>');
    },
    school: function() { return outdoor(schoolProps()); },
    lunch: function() {
      return room('#f4e4d4', '#e3c7ab', null, painting(290, 44, 110, 72) + table(206, 168, 260, true) +
        claypot(296, 160) + plate(380, 168, 24) + '<path d="M368 164 q12 -10 24 0Z" fill="#7dbb4c"/><path d="M372 163 q8 -7 16 0" fill="#cf3f2e"/>' +
        glass(416, 140, '#f6a23a') + '<path d="M240 168 l18 -2 M246 170 l14 -3" stroke="#b8bcc4" stroke-width="2" stroke-linecap="round"/>');
    },
    piano: function() { return room('#e8e2f2', '#d2c8e4', null, pianoProps()); },
    football: function() { return outdoor(footballProps()); },
    dinner: function() {
      return room('#efe0c9', '#d9c19c', null, hangingLamp(336) + table(206, 168, 260, true) +
        plate(260, 168, 24) + plate(412, 168, 24) + claypot(336, 160) + candle(296) + candle(376) +
        '<path d="M232 170 l14 -2" stroke="#b8bcc4" stroke-width="2" stroke-linecap="round"/>',
        glowAt(336, 96, 130) + glowAt(296, 144, 26) + glowAt(376, 144, 26));
    },
    bedtime: function() {
      return room('#dfe5f3', '#c3cde6', null, nightstand(196) + lamp(203, true) + bed(true) + teddy(300, 132) +
        '<path d="M206 160 l12 -6 l12 6Z" fill="#7b2430"/>',
        glowAt(217, 128, 90));
    }
  };
  function sceneSVG(id) { return (SCENES[id] || SCENES.wake)(); }

  // ---------------------------------------------------------------
  // Paper wall calendar (month grid). Monday-first, Sundays in red.
  // ---------------------------------------------------------------
  function calendarSVG(year, month, o) {
    o = o || {};
    var D = QheData, lang = o.lang || 'en';
    var first = D.weekdayOf(year, month, 1), dim = D.daysInMonth(year, month);
    var rows = Math.ceil((first + dim) / 7);
    var season = D.SEASONS[D.seasonOfMonth(month)];
    var W = 360, cellW = 46, cellH = 34, gx = 19, gy = 104;
    var H = gy + rows * cellH + 22;
    var names = lang === 'es' ? D.DAYS.esShort : D.DAYS.enShort;
    var title = (lang === 'es' ? D.cap(D.MONTHS.es[month]) : D.MONTHS.en[month]) + ' ' + year;
    var s = '<svg class="qc-cal" viewBox="0 0 ' + W + ' ' + (H + 14) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Calendar ' + title + '">' +
      '<defs><linearGradient id="qc-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f1eadb"/></linearGradient>' +
      '<linearGradient id="qc-band" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + season.color + '"/><stop offset="1" stop-color="' + mix(season.color, '#000000', 0.25) + '"/></linearGradient>' +
      '<linearGradient id="qc-wire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7280"/><stop offset="0.5" stop-color="#f3f4f6"/><stop offset="1" stop-color="#4b5563"/></linearGradient>' +
      '<filter id="qc-sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="#3a2a10" flood-opacity="0.28"/></filter></defs>' +
      '<rect x="8" y="14" width="' + (W - 16) + '" height="' + H + '" rx="6" fill="url(#qc-paper)" filter="url(#qc-sh)"/>' +
      '<path d="M' + (W - 8) + ' ' + (H - 14) + ' v' + 22 + ' q0 6 -6 6 h-26 q24 -4 32 -28Z" fill="#e5dcc8"/>' +
      '<rect x="8" y="14" width="' + (W - 16) + '" height="56" rx="6" fill="url(#qc-band)"/>' +
      '<rect x="8" y="58" width="' + (W - 16) + '" height="12" fill="url(#qc-band)"/>' +
      '<rect x="8" y="14" width="' + (W - 16) + '" height="22" rx="6" fill="#fff" opacity="0.14"/>' +
      seasonIcon(D.seasonOfMonth(month), 44, 48) +
      '<text x="' + (W / 2 + 14) + '" y="54" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="24" fill="#fff">' + title + '</text>';
    // spiral rings
    for (var r = 0; r < 11; r++) {
      var rx = 28 + r * 30.5;
      s += '<circle cx="' + rx + '" cy="20" r="3.2" fill="#3b2a1a" opacity="0.6"/>' +
        '<rect x="' + (rx - 2.2) + '" y="4" width="4.4" height="18" rx="2.2" fill="url(#qc-wire)"/>';
    }
    for (var c = 0; c < 7; c++) {
      s += '<text x="' + (gx + c * cellW + cellW / 2) + '" y="' + (gy - 12) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="13" fill="' + (c === 6 ? '#c0392b' : '#5b5346') + '">' + names[c] + '</text>';
    }
    s += '<path d="M' + gx + ' ' + (gy - 4) + 'h' + cellW * 7 + '" stroke="#d8cdb6"/>';
    var hl = o.highlight || {};
    for (var d = 1; d <= dim; d++) {
      var idx = first + d - 1, col = idx % 7, row = Math.floor(idx / 7);
      var x = gx + col * cellW, y = gy + row * cellH;
      var mark = hl[d];
      s += '<g class="qc-cell' + (o.tappable ? ' qc-tap' : '') + '" data-d="' + d + '">' +
        '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (cellW - 4) + '" height="' + (cellH - 4) + '" rx="6" fill="' +
          (mark === 'good' ? '#bbf7d0' : mark === 'bad' ? '#fed7aa' : mark === 'focus' ? '#fde68a' : (col >= 5 ? '#f7efe0' : '#fffdf8')) + '" stroke="#ece3d0"/>' +
        '<text x="' + (x + cellW / 2) + '" y="' + (y + cellH / 2 + 6) + '" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="17" fill="' + (col === 6 ? '#c0392b' : '#2d261c') + '">' + d + '</text>' +
        (mark === 'circle' || mark === 'good' ? '<ellipse cx="' + (x + cellW / 2) + '" cy="' + (y + cellH / 2) + '" rx="' + (cellW / 2 - 3) + '" ry="' + (cellH / 2 - 2) + '" fill="none" stroke="#dc2626" stroke-width="2.4" transform="rotate(-6 ' + (x + cellW / 2) + ' ' + (y + cellH / 2) + ')" stroke-linecap="round" stroke-dasharray="' + (cellW * 2.6) + ' 6"/>' : '') +
        '</g>';
    }
    return s + '</svg>';
  }
  function seasonIcon(id, cx, cy) {
    if (id === 'summer') {
      var rays = '';
      for (var i = 0; i < 8; i++) { var a = i / 8 * TAU; rays += '<path d="M' + (cx + Math.cos(a) * 11).toFixed(1) + ' ' + (cy - 8 + Math.sin(a) * 11).toFixed(1) + ' L' + (cx + Math.cos(a) * 16).toFixed(1) + ' ' + (cy - 8 + Math.sin(a) * 16).toFixed(1) + '" stroke="#fff6c9" stroke-width="2.5" stroke-linecap="round"/>'; }
      return rays + '<circle cx="' + cx + '" cy="' + (cy - 8) + '" r="8" fill="#fff6c9"/>';
    }
    if (id === 'autumn') return '<path d="M' + cx + ' ' + (cy - 22) + ' q14 8 10 22 q-10 4 -10 -2 q0 6 -10 2 q-4 -14 10 -22Z" fill="#fde3c2"/><path d="M' + cx + ' ' + (cy - 18) + ' v24" stroke="#9a3412" stroke-width="1.5"/>';
    if (id === 'winter') {
      var f = '';
      for (var j = 0; j < 6; j++) { var b = j / 6 * TAU; f += '<path d="M' + cx + ' ' + (cy - 8) + ' l' + (Math.cos(b) * 14).toFixed(1) + ' ' + (Math.sin(b) * 14).toFixed(1) + '" stroke="#eef6ff" stroke-width="2.2" stroke-linecap="round"/>'; }
      return f + '<circle cx="' + cx + '" cy="' + (cy - 8) + '" r="3" fill="#eef6ff"/>';
    }
    var petals = '';
    for (var k = 0; k < 5; k++) { var c2 = k / 5 * TAU; petals += '<circle cx="' + (cx + Math.cos(c2) * 7).toFixed(1) + '" cy="' + (cy - 8 + Math.sin(c2) * 7).toFixed(1) + '" r="5.5" fill="#fde7f3"/>'; }
    return petals + '<circle cx="' + cx + '" cy="' + (cy - 8) + '" r="4" fill="#facc15"/>';
  }

  // Season wheel: 12 months around a ring, coloured by Chilean season.
  function seasonWheelSVG(lang, focusMonth) {
    var D = QheData, R1 = 128, R0 = 74, cx = 150, cy = 150;
    var s = '<svg class="qc-wheel" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Seasons in Chile">' +
      '<defs><filter id="qw-sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#3a2a10" flood-opacity="0.25"/></filter>' +
      '<radialGradient id="qw-c"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#efe5cf"/></radialGradient></defs>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R1 + 8) + '" fill="#fffaf0" filter="url(#qw-sh)"/>';
    for (var m = 0; m < 12; m++) {
      var a0 = (m / 12) * TAU - Math.PI / 2 - TAU / 24, a1 = a0 + TAU / 12;
      var col = D.SEASONS[D.seasonOfMonth(m)].color;
      var focus = m === focusMonth;
      var ro = focus ? R1 + 6 : R1;
      var p = 'M' + (cx + Math.cos(a0) * R0).toFixed(1) + ' ' + (cy + Math.sin(a0) * R0).toFixed(1) +
        ' L' + (cx + Math.cos(a0) * ro).toFixed(1) + ' ' + (cy + Math.sin(a0) * ro).toFixed(1) +
        ' A' + ro + ' ' + ro + ' 0 0 1 ' + (cx + Math.cos(a1) * ro).toFixed(1) + ' ' + (cy + Math.sin(a1) * ro).toFixed(1) +
        ' L' + (cx + Math.cos(a1) * R0).toFixed(1) + ' ' + (cy + Math.sin(a1) * R0).toFixed(1) +
        ' A' + R0 + ' ' + R0 + ' 0 0 0 ' + (cx + Math.cos(a0) * R0).toFixed(1) + ' ' + (cy + Math.sin(a0) * R0).toFixed(1) + 'Z';
      s += '<path d="' + p + '" fill="' + col + '" opacity="' + (focus ? 1 : (focusMonth == null ? 0.85 : 0.55)) + '" stroke="#fffaf0" stroke-width="2.5"/>';
      var am = (a0 + a1) / 2, tr = (R0 + ro) / 2;
      var label = (lang === 'es' ? D.MONTHS.es[m] : D.MONTHS.en[m]).substr(0, 3);
      s += '<text x="' + (cx + Math.cos(am) * tr).toFixed(1) + '" y="' + (cy + Math.sin(am) * tr + 4.5).toFixed(1) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="' + (focus ? 15 : 12.5) + '" fill="#fff">' + D.cap(label) + '</text>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R0 - 4) + '" fill="url(#qw-c)" stroke="#e5d8bd"/>';
    // small Chile silhouette suggestion: a tall thin band + star
    s += '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="20" fill="#312e81">Chile</text>' +
      '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="11" fill="#6b6878">' + (lang === 'es' ? 'Hemisferio sur' : 'Southern hemisphere') + '</text>';
    return s + '</svg>';
  }

  return {
    createClock: createClock,
    createFlip: createFlip,
    sceneSVG: sceneSVG,
    updateSky: updateSky,
    calendarSVG: calendarSVG,
    seasonWheelSVG: seasonWheelSVG,
    skyAt: skyAt
  };
})();
