/* ================================================================
   LECTOR — art, part: things around the house (js/lector-art-home.js)
   Loaded after lector-art.js; each object registers itself with
   LectorArt.add(id, function (c) { ... }) on the 100 x 100 box.
   ================================================================ */
(function () {
  'use strict';

  var SKIN = '#E8B48A';
  var NOSTROKE = { flat: true, stroke: false };

  // ── ladder ──────────────────────────────────────────────────
  LectorArt.add('ladder', function (c) {
    c.shadow(48, 91, 30, 4.5);
    function xl(t) { return 27 + 11 * t; }
    function xr(t) { return 67 - 5 * t; }
    function yy(t) { return 91 - 83 * t; }
    [0.13, 0.3, 0.47, 0.64, 0.8, 0.94].forEach(function (t) {
      c.rect(xl(t), yy(t) - 2.4, xr(t) - xl(t), 5, '#D9A864', { r: 1.6, sw: 0.9, mode: 'v' });
    });
    c.path('M23 91 H31 L42 8 H34Z', '#B9803F');
    c.path('M63 91 H71 L66 8 H58Z', '#B9803F');
    c.rect(22.5, 89, 9, 3, '#6E4A27', { r: 1.4, sw: 0.7 });
    c.rect(62.5, 89, 9, 3, '#6E4A27', { r: 1.4, sw: 0.7 });
    c.shine('M26 88 L36 14 L37.5 14 L28 88Z', 0.4);
    c.shine('M30 36 H62 V38 H30Z', 0.3);
    c.line('M33 60 L34.5 52 M63 70 L62 62', '#7A4F25', 0.9, { op: 0.5 });
  });

  // ── magnifier ───────────────────────────────────────────────
  LectorArt.add('magnifier', function (c) {
    c.shadow(56, 91, 28, 4);
    c.g('rotate(-40 50 50)', function () {
      c.rect(45, 50, 10, 42, '#6B4226', { r: 4.5, mode: 'h' });
      c.rect(44, 48, 12, 11, '#C99A3A', { r: 2.5, mode: 'h', sw: 0.9 });
      c.line('M47 63 V85', '#A06A3C', 1, { op: 0.6 });
      c.circ(50, 30, 25, '#C99A3A', { rad: true, sw: 1.3 });
      c.circ(50, 30, 19, '#BFE3F2', { flat: true, stroke: '#8A6420', sw: 1.4 });
      c.circ(50, 30, 19, '#CFEAF6', { flat: true, stroke: false, op: 0.55 });
    });
    c.circ(37, 35, 19, c.radGrad('#FFFFFF00', '#4C95C455', 0.4, 0.3, 0.7), NOSTROKE);
    c.shine('M22 36 Q21 24 32 19 Q27 27 27 38Z', 0.8);
    c.shine('M26 45 Q28 49 32 51 Q28 50 26 45Z', 0.55);
    c.circ(46, 24, 1.8, '#fff', { flat: true, stroke: false, op: 0.7 });
  });

  // ── shovel ──────────────────────────────────────────────────
  LectorArt.add('shovel', function (c) {
    c.shadow(50, 91, 38, 5);
    c.rect(47.5, 18, 5, 36, '#B9803F', { mode: 'h', sw: 0.9 });
    c.path('M40 6 H60 Q65 6 65 11 V15 Q65 20 60 20 H40 Q35 20 35 15 V11 Q35 6 40 6Z M42 11 V15 H58 V11Z', '#B9803F', { sw: 1 });
    c.path('M43 49 L57 49 L60 58 L40 58Z', '#8B97A4', { sw: 0.9 });
    c.path('M34 58 Q31 78 50 94 Q69 78 66 58Z', '#A9B5C2', { sw: 1.1 });
    c.line('M50 60 V80', '#7C8793', 1, { op: 0.5 });
    c.shine('M39 60 Q38 70 43 79 Q41 70 42 60Z', 0.55);
    c.path('M12 91 Q18 80 36 77 Q50 74 64 77 Q82 80 88 91 Q50 96 12 91Z', '#7A5230', { sw: 1.1 });
    c.ell(30, 82, 4.5, 2.6, '#8F6339', { flat: true, stroke: false });
    c.ell(68, 80, 5, 2.8, '#6B4524', { flat: true, stroke: false });
    c.ell(52, 87, 4, 2.2, '#8F6339', { flat: true, stroke: false });
    c.circ(78, 85, 1.8, '#5B3A1E', NOSTROKE);
    c.circ(22, 87, 1.5, '#5B3A1E', NOSTROKE);
    c.shine('M22 84 Q28 76 40 75 Q30 78 26 86Z', 0.25);
  });

  // ── finger (index finger pointing up) ───────────────────────
  LectorArt.add('finger', function (c) {
    c.shadow(50, 92, 26, 3.5);
    c.g('rotate(26 50 84)', function (c) {
    c.rect(36, 68, 28, 22, SKIN, { mode: 'h', sw: 1 });
    c.path('M28 60 Q26 46 36 46 H40 V66 H62 L72 58 Q76 72 70 82 Q60 88 50 88 Q34 88 30 76Z', SKIN, { sw: 1 });
    c.path('M40 56 V16 Q40 8 47.5 8 Q55 8 55 16 V56Z', SKIN, { mode: 'h', sw: 1.1 });
    c.rect(40, 54, 24, 20, SKIN, { flat: true, stroke: false });
    c.ell(62, 54, 11, 6.2, SKIN, { sw: 0.9 });
    c.ell(63, 64, 12, 6.2, SKIN, { sw: 0.9 });
    c.ell(61, 74, 10.5, 5.8, SKIN, { sw: 0.9 });
    c.ell(40, 70, 12, 6.5, SKIN, { sw: 0.9 });
    c.line('M44 22 H51 M44 30 H51', '#B87C56', 1, { op: 0.7 });
    c.line('M54 59 H70 M54 69 H69', '#B87C56', 0.9, { op: 0.5 });
    c.shine('M42 14 Q43 10 47 9 Q44 14 44 24Z', 0.5);
    c.rect(33, 82, 34, 12, '#5B8FCE', { r: 3, sw: 1 });
    c.shine('M35 84 H52 V86 H35Z', 0.35);
    });
  });

  // ── dice ────────────────────────────────────────────────────
  LectorArt.add('dice', function (c) {
    c.shadow(52, 90, 36, 5);
    c.path('M50 10 L84 28 V68 L50 88 L16 68 V28Z', '#F1EEE6', { stroke: '#8E897F', sw: 6 });
    function face(d, col) { c.path(d, col, { flat: true, stroke: col, sw: 3 }); }
    face('M50 15 L77 28 L50 42 L23 28Z', '#FFFFFF');
    face('M20 33 L46 48 V82 L20 66Z', '#E6E2D9');
    face('M54 48 L80 33 V66 L54 82Z', '#CFCAC0');
    function pips(m, list) {
      c.g('matrix(' + m + ')', function () {
        list.forEach(function (p) { c.circ(p[0], p[1], 11, '#1E1B19', { flat: true, stroke: false }); });
      });
    }
    pips('0.27 0.13 -0.27 0.13 50 15', [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]]);
    pips('0.26 0.16 0 0.34 20 32', [[25, 22], [50, 50], [75, 78]]);
    pips('0.26 -0.16 0 0.34 54 48', [[28, 25], [72, 75]]);
    c.shine('M30 24 L48 19 L50 20 L32 27Z', 0.6);
  });

  // ── ball (football) ─────────────────────────────────────────
  LectorArt.add('ball', function (c) {
    var cx = 50, cy = 53, R = 37;
    c.shadow(50, 91, 30, 5);
    c.circ(cx, cy, R, '#F7F5F0', { flat: true, stroke: false });
    var id = c.u + 'clip';
    c.defs += '<clipPath id="' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/></clipPath>';
    function pent(r) {
      var s = '';
      for (var j = 0; j < 5; j++) {
        var a = Math.PI + j * 2 * Math.PI / 5;
        s += (j ? 'L' : 'M') + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1);
      }
      return s + 'Z';
    }
    var px = 47, py = 50, body = '<g clip-path="url(#' + id + ')">', seams = '';
    for (var k = 0; k < 5; k++) {
      var ang = -90 + 72 * k, th = ang * Math.PI / 180;
      var vx = px + 10.5 * Math.cos(th), vy = py + 10.5 * Math.sin(th);
      var ex = px + 21 * Math.cos(th), ey = py + 21 * Math.sin(th);
      seams += 'M' + vx.toFixed(1) + ' ' + vy.toFixed(1) + ' L' + ex.toFixed(1) + ' ' + ey.toFixed(1);
      body += '<path d="' + pent(11) + '" transform="translate(' + px + ' ' + py + ') rotate(' + ang + ') translate(34 0) scale(.62 1)" fill="#25282D" stroke="#25282D" stroke-width="1.2" stroke-linejoin="round"/>';
    }
    body += '<path d="' + seams + '" stroke="#25282D" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
    body += '<path d="' + pent(10.5) + '" transform="translate(' + px + ' ' + py + ') rotate(-90) scale(1)" fill="#25282D" stroke="#25282D" stroke-width="1.2" stroke-linejoin="round"/>';
    body += '</g>';
    c.raw(body);
    c.circ(cx, cy, R, c.radGrad('#FFFFFF00', '#3A2A1C77', 0.36, 0.3, 0.85), NOSTROKE);
    c.raw('<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#4A4540" stroke-width="1.3"/>');
    c.shine('M26 38 Q32 24 46 20 Q36 28 32 42Z', 0.7);
    c.circ(58, 70, 8, c.radGrad('#FFFFFF33', '#FFFFFF00'), NOSTROKE);
  });

  // ── hand (open, palm to the viewer) ─────────────────────────
  LectorArt.add('hand', function (c) {
    c.shadow(50, 92, 28, 3.5);
    function fing(bx, by, ang, len, w) {
      c.g('rotate(' + ang + ' ' + bx + ' ' + by + ')', function () {
        c.rect(bx - w / 2, by - len, w, len + 10, SKIN, { r: w / 2, mode: 'h', sw: 1 });
      });
    }
    fing(31, 70, -62, 27, 12.5);
    fing(66, 55, 22, 27, 10.5);
    fing(59, 49, 9, 34, 11);
    fing(50, 47, 0, 39, 11.5);
    fing(41, 49, -10, 35, 11);
    c.path('M27 62 Q25 50 36 47 H66 Q76 52 73 66 Q71 84 58 87 H44 Q30 83 27 62Z', SKIN, { sw: 1.1 });
    c.rect(39, 82, 22, 11, SKIN, { mode: 'h', sw: 1 });
    c.line('M34 64 Q44 70 54 64 M40 74 Q46 78 54 74', '#B87C56', 1, { op: 0.5 });
    c.line('M36 50 V57 M50 49 V56 M62 51 V58', '#B87C56', 0.9, { op: 0.35 });
    c.shine('M32 56 Q33 50 38 49 Q34 54 34 64Z', 0.45);
    c.rect(34, 88, 32, 8, '#5B8FCE', { r: 3, sw: 1 });
  });

  // ── bread (marraqueta) ──────────────────────────────────────
  LectorArt.add('bread', function (c) {
    c.shadow(50, 88, 42, 5);
    var crust = '#D9953A', hi = '#E8AE55';
    c.ell(32, 48, 20, 16, crust, { rad: true });
    c.ell(68, 48, 20, 16, crust, { rad: true });
    c.ell(32, 65, 21, 18, crust, { rad: true });
    c.ell(68, 65, 21, 18, crust, { rad: true });
    c.line('M50 40 Q47 62 50 84', '#F2D38E', 3.6, { op: 0.95 });
    c.line('M50 40 Q47 62 50 84', '#8E5418', 1.3, { op: 0.85 });
    c.line('M18 58 Q30 62 42 58 M58 58 Q70 62 82 58', '#B8742A', 1.3, { op: 0.6 });
    c.line('M22 48 Q28 44 36 46 M62 47 Q70 43 76 46', hi, 1.6, { op: 0.8 });
    c.shine('M16 60 Q22 48 36 48 Q26 54 22 66Z', 0.35);
    c.shine('M58 54 Q66 50 76 52 Q66 55 60 60Z', 0.25);
    [[26, 62], [34, 70], [64, 62], [74, 70], [20, 52], [70, 52], [42, 76], [58, 77], [33, 55]].forEach(function (p, i) {
      c.circ(p[0], p[1], i % 3 === 0 ? 1.6 : 1.1, '#FFF8EA', { flat: true, stroke: false, op: 0.85 });
    });
    c.ell(30, 72, 9, 3, '#FFF8EA', { flat: true, stroke: false, op: 0.35 });
  });

  // ── bed ─────────────────────────────────────────────────────
  LectorArt.add('bed', function (c) {
    c.shadow(50, 90, 44, 5);
    // headboard
    c.path('M30 58 V16 Q30 8 38 8 H82 Q90 8 90 16 V58Z', '#A9753F', { sw: 1.1 });
    c.path('M36 54 V18 Q36 14 40 14 H80 Q84 14 84 18 V54Z', '#BD8A52', { sw: 0.8 });
    c.shine('M33 18 Q33 11 40 11 H50 Q38 12 36 20 V50 H33Z', 0.3);
    // legs
    c.rect(85, 56, 6, 20, '#7A4E24', { sw: 0.9 });
    c.rect(9, 72, 7, 18, '#8A5A2B', { sw: 0.9 });
    c.rect(64, 72, 7, 18, '#8A5A2B', { sw: 0.9 });
    // frame rails
    c.path('M70 68 L90 52 V60 L70 76Z', '#8A5A2B', { sw: 0.9 });
    c.rect(8, 68, 63, 8, '#A9753F', { r: 1.5, mode: 'v' });
    // mattress
    c.path('M12 58 L68 58 L88 42 L32 42Z', '#FFFFFF', { sw: 1 });
    c.path('M68 58 L88 42 V52 L68 68Z', '#E9E4D9', { sw: 1 });
    c.rect(12, 58, 56, 10, '#F4EEE2', { sw: 1 });
    // pillow
    c.path('M36 47 Q34 38 46 37 H68 Q80 38 78 47 Q76 52 64 52 H50 Q38 52 36 47Z', '#FFFFFF', { sw: 1 });
    c.line('M42 44 Q56 41 72 44', '#C9CFD8', 1, { op: 0.8 });
    // folded blanket
    c.path('M12 58 L68 58 L78 50 L22 50Z', '#4F86C6', { sw: 1 });
    c.path('M22 50 L78 50 L81 47.5 L25 47.5Z', '#9CC4EC', { sw: 0.9 });
    c.path('M68 58 L78 50 L81 47.5 V58 L71 66 L68 68Z', '#3F73B0', { sw: 1 });
    c.rect(11, 58, 58, 14, '#4F86C6', { r: 2, sw: 1 });
    c.line('M14 63 H66', '#9CC4EC', 1.6, { op: 0.8 });
    c.shine('M14 59.5 H62 V61 H14Z', 0.3);
  });

  // ── boot (yellow rain boot) ─────────────────────────────────
  LectorArt.add('boot', function (c) {
    c.shadow(50, 91, 40, 4.5);
    c.path('M70 14 Q82 14 82 23 Q82 32 70 32 V27 Q77 27 77 23 Q77 19 70 19Z', '#F2C21B', { sw: 1 });
    c.path('M45 10 Q45 7 48 7 H68 Q71 7 71 10 L71 62 Q71 66 78 68 Q87 71 87 79 V84 Q87 88 82 88 H22 Q9 88 9 77 Q9 70 20 68 Q42 66 45 54Z', '#F2C21B', { sw: 1.2 });
    c.rect(44, 7, 28, 7, '#D9A800', { r: 2.5, mode: 'v', sw: 1 });
    c.path('M8 79 H88 V84 Q88 92 80 92 H18 Q8 92 8 84Z', '#8C5A12', { sw: 1.1, mode: 'v' });
    c.line('M12 80 H86', '#C98C1E', 1, { op: 0.8 });
    c.path('M14 70 Q22 66 30 68 Q22 69 14 76Z', '#D9A800', { flat: true, stroke: false, op: 0.6 });
    c.shine('M48 18 Q47 40 50 56 Q46 50 46 40Z', 0.6);
    c.shine('M12 76 Q13 70 22 68 Q16 72 15 78Z', 0.55);
    c.line('M45 56 Q50 62 56 64', '#B88A00', 1, { op: 0.5 });
  });

  // ── candle ──────────────────────────────────────────────────
  LectorArt.add('candle', function (c) {
    c.shadow(50, 92, 32, 4);
    c.circ(50, 22, 22, c.radGrad('#FFD36EAA', '#FFD36E00', 0.5, 0.5, 0.5), NOSTROKE);
    c.line('M75 84 Q93 78 91 87 Q89 93 75 91', '#9C7424', 4.6);
    c.line('M75 84 Q91 79 89 86', '#E5BE62', 1.4, { op: 0.9 });
    c.ell(50, 86, 29, 6.2, '#C99A3A', { sw: 1.1 });
    c.ell(50, 82, 25, 5.4, '#E0B556', { sw: 1 });
    c.ell(50, 82, 12, 2.6, '#B38428', { flat: true, stroke: false, op: 0.5 });
    c.rect(41, 36, 18, 45, '#F6EBCB', { r: 3.5, mode: 'h' });
    c.ell(50, 36, 9, 3.2, '#FFF6DA', { sw: 0.9 });
    c.ell(50, 36.4, 6.5, 2, '#EBD9A8', { flat: true, stroke: false });
    c.path('M41 38 Q41 50 43.5 53 Q46 55 47.5 51 Q47 44 47.5 38Z', '#FBF1D6', { sw: 0.8 });
    c.shine('M43 40 V76 H44.6 V40Z', 0.5);
    c.line('M50 36 V30', '#3A2A1C', 1.4);
    c.path('M50 5 Q61 18 57 26 Q55 33 50 33 Q45 33 43 26 Q39 18 50 5Z', '#F59A1B', { flat: true, stroke: '#D9741A', sw: 0.9 });
    c.path('M50 14 Q57 22 55 27.5 Q53 32 50 32 Q47 32 45 27.5 Q43 22 50 14Z', '#FFD94F', { flat: true, stroke: false });
    c.path('M50 22 Q53 26 52 29 Q51 31.5 50 31.5 Q49 31.5 48 29 Q47 26 50 22Z', '#FFF6C4', { flat: true, stroke: false });
  });

  // ── glass of water ──────────────────────────────────────────
  LectorArt.add('glass', function (c) {
    c.shadow(50, 90, 36, 4.5);
    c.ell(50, 87, 30, 5.5, '#D9B88A', { sw: 1 });
    c.path('M28 22 L33 80 Q50 88 67 80 L72 22Z', '#DCEFF8', { flat: true, stroke: '#7FA9BE', sw: 1.3, op: 0.5 });
    c.path('M30.8 50 L33.4 80 Q50 88 66.6 80 L69.2 50 Q50 56 30.8 50Z', '#5FB0E0', { flat: true, stroke: false, op: 0.7 });
    c.path('M31 66 L33.4 80 Q50 88 66.6 80 L69 66 Q50 74 31 66Z', '#3E8CC4', { flat: true, stroke: false, op: 0.35 });
    c.ell(50, 50, 19.2, 4.4, '#A9DAF2', { flat: true, stroke: '#4F9ACB', sw: 0.9, op: 0.9 });
    c.path('M34 79.5 Q50 87 66 79.5 L65.6 76 Q50 83 34.4 76Z', '#FFFFFF', { flat: true, stroke: false, op: 0.4 });
    c.raw('<ellipse cx="50" cy="22" rx="22" ry="5" fill="#ECF7FC" fill-opacity=".4" stroke="#6F9DB4" stroke-width="1.3"/>');
    c.shine('M33 27 L37.5 76 L40 76 L36.5 27Z', 0.65);
    c.shine('M64 30 L66.5 70 L68 69 L66.5 30Z', 0.4);
    c.shine('M34 52 Q42 56 48 55.5 Q40 58 35 56Z', 0.5);
    c.circ(55, 66, 1.6, '#fff', { flat: true, stroke: false, op: 0.6 });
    c.circ(47, 72, 1.1, '#fff', { flat: true, stroke: false, op: 0.6 });
  });

  // ── sofa ────────────────────────────────────────────────────
  LectorArt.add('sofa', function (c) {
    var T = '#C8693F';
    c.shadow(50, 91, 46, 4.5);
    c.rect(18, 88, 6, 5, '#6E4A27', { r: 1.5, sw: 0.8 });
    c.rect(76, 88, 6, 5, '#6E4A27', { r: 1.5, sw: 0.8 });
    c.rect(6, 86, 6, 6, '#6E4A27', { r: 1.5, sw: 0.8 });
    c.rect(88, 86, 6, 6, '#6E4A27', { r: 1.5, sw: 0.8 });
    c.rect(14, 22, 72, 40, T, { r: 11 });
    c.path('M16 30 Q18 24 26 24 H74 Q82 24 84 30', '#E08A5E', { flat: true, stroke: false, op: 0.5 });
    c.rect(20, 28, 20, 30, '#D4774C', { r: 7, sw: 0.9 });
    c.rect(40, 28, 20, 30, '#D4774C', { r: 7, sw: 0.9 });
    c.rect(60, 28, 20, 30, '#D4774C', { r: 7, sw: 0.9 });
    c.rect(5, 42, 17, 44, T, { r: 8 });
    c.rect(78, 42, 17, 44, T, { r: 8 });
    c.path('M95 46 Q99 48 99 54 V80 Q99 84 94 86Z', '#A9522F', { sw: 0.9 });
    c.rect(8, 66, 84, 20, '#B95C36', { r: 5 });
    [[22, 74], [40.6, 74], [59.2, 74]].forEach(function (p) {
      c.rect(p[0], 54, 18.6, 21, T, { r: 6, sw: 1 });
      c.shine('M' + (p[0] + 3) + ' 57 H' + (p[0] + 14) + ' Q' + (p[0] + 5) + ' 58 ' + (p[0] + 3) + ' 62Z', 0.3);
    });
    c.line('M22 76 H77', '#8D3F20', 1, { op: 0.35 });
    c.g('rotate(-12 31 50)', function () { c.rect(23, 42, 17, 17, '#2E9C9A', { r: 4.5, sw: 1 }); c.line('M25 44 L38 57 M38 44 L25 57', '#1F7C7A', 0.8, { op: 0.35 }); });
    c.g('rotate(10 69 50)', function () { c.rect(61, 42, 17, 17, '#F2D58A', { r: 4.5, sw: 1 }); c.circ(69.5, 50.5, 3, '#E5BD5A', { rad: true, sw: 0.6 }); });
    c.shine('M8 48 Q10 44 16 44 Q11 47 10 56Z', 0.35);
  });

  // ── drop ────────────────────────────────────────────────────
  LectorArt.add('drop', function (c) {
    c.ell(50, 84, 38, 7, '#BFE4F6', { flat: true, stroke: false, op: 0.55 });
    c.raw('<ellipse cx="50" cy="84" rx="32" ry="5.8" fill="none" stroke="#4F9ACB" stroke-width="1.5" opacity=".8"/>' +
      '<ellipse cx="50" cy="84" rx="19" ry="3.5" fill="none" stroke="#4F9ACB" stroke-width="1.4" opacity=".9"/>' +
      '<ellipse cx="50" cy="84" rx="7" ry="1.4" fill="none" stroke="#4F9ACB" stroke-width="1.2"/>');
    c.path('M50 7 C53 22 68 38 68 54 C68 66 60 73 50 73 C40 73 32 66 32 54 C32 38 47 22 50 7Z', '#2F8FD8', { rad: true, sw: 1.3 });
    c.path('M50 73 C60 73 68 66 68 54 C68 60 62 69 50 70Z', '#1B6DB0', { flat: true, stroke: false, op: 0.5 });
    c.shine('M42 36 Q36 46 38 58 Q34 48 40 38Z', 0.85);
    c.shine('M45 24 Q46 20 47.5 18 Q47 22 45 26Z', 0.6);
    c.circ(58, 64, 2.4, '#fff', { flat: true, stroke: false, op: 0.6 });
  });

  // ── umbrella ────────────────────────────────────────────────
  LectorArt.add('umbrella', function (c) {
    c.shadow(44, 91, 24, 4);
    c.line('M50 48 V78 Q50 90 42 90 Q35 90 35 83', '#7A4A22', 3.6);
    c.line('M48.8 50 V78', '#B8793C', 1, { op: 0.7 });
    var xs = [8, 23, 38, 62, 77, 92], cols = ['#D93A32', '#F5C32B', '#D93A32', '#F5C32B', '#D93A32'];
    function ctl(x) { return (50 + (x - 50) * 1.06).toFixed(1); }
    for (var i = 0; i < 5; i++) {
      var a = xs[i], b = xs[i + 1];
      c.path('M50 16 Q' + ctl(a) + ' 24 ' + a + ' 52 Q' + ((a + b) / 2) + ' 44 ' + b + ' 52 Q' + ctl(b) + ' 24 50 16Z', cols[i], { sw: 1.1 });
    }
    var ribs = '';
    xs.forEach(function (x) { ribs += 'M50 16 Q' + ctl(x) + ' 24 ' + x + ' 52 '; });
    c.line(ribs, '#6B3A1C', 0.9, { op: 0.55 });
    c.circ(50, 13, 2.6, '#7A4A22', { rad: true, sw: 0.8 });
    c.circ(50, 51, 2.4, '#7A4A22', { rad: true, sw: 0.8 });
    c.shine('M16 40 Q18 24 36 19 Q24 28 22 44Z', 0.4);
    c.shine('M52 20 Q60 22 66 28 Q58 25 52 24Z', 0.25);
  });

  // ── pin (sewing pin in a pincushion) ────────────────────────
  LectorArt.add('pin', function (c) {
    c.shadow(50, 90, 38, 5);
    c.path('M15 76 Q13 58 50 57 Q87 58 85 76 Q86 91 50 91 Q14 91 15 76Z', '#B5353A', { rad: true, sw: 1.2 });
    c.ell(50, 63, 29, 6.2, '#C94A4D', { flat: true, stroke: false, op: 0.6 });
    c.line('M50 65 Q38 76 50 90 M50 65 Q62 76 50 90 M24 66 Q30 78 38 88 M76 66 Q70 78 62 88', '#F0C9A0', 1, { op: 0.75, dash: '2.6 2' });
    c.shine('M20 72 Q22 64 34 61 Q26 66 24 76Z', 0.35);
    c.line('M52 20 L45.5 66', '#9AA4AE', 2.2);
    c.line('M51.4 22 L45.8 63', '#F2F5F8', 0.9, { op: 0.9 });
    c.ell(45.5, 66, 3.4, 1.3, '#7A1F25', { flat: true, stroke: false, op: 0.8 });
    c.circ(54, 14, 7, '#E5322D', { rad: true, sw: 1.1 });
    c.shine('M49 11 Q51 7 56 7.5 Q52 9 51 14Z', 0.75);
  });
})();
