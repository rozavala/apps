/* ================================================================
   LECTOR — art: nature, buildings and vehicles (js/lector-art-nature.js)
   Registers more objects with LectorArt (see lector-art.js for the API).
   ================================================================ */
(function () {
  'use strict';

  var FLAT = { flat: true, stroke: false };

  // A pointed leaf lying along -y from the origin, with a midrib and side veins.
  function leaf(c, x, y, rot, len, col, vein) {
    c.g('translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + len / 50 + ')', function () {
      c.path('M0 0 Q-17 -20 0 -50 Q17 -20 0 0Z', col, { sw: 1.4 });
      c.line('M0 -2 L0 -44 M0 -14 L-8 -24 M0 -14 L8 -24 M0 -26 L-6 -35 M0 -26 L6 -35', vein || '#2F6B2E', 1.1, { op: 0.7 });
      c.shine('M-3 -8 Q-10 -22 -1 -42 Q-4 -24 -3 -8Z', 0.35);
    });
  }

  // ── grapes ──────────────────────────────────────────────────
  LectorArt.add('grapes', function (c) {
    c.line('M50 22 Q48 12 54 5', '#6B4A2A', 3);
    leaf(c, 54, 18, 62, 36, '#52A646');
    var rows = [[28, [37, 51, 65]], [40, [30, 44, 58, 72]], [53, [34, 48, 62]], [65, [40, 54]], [76, [47]]];
    rows.forEach(function (r, i) {
      r[1].forEach(function (x, j) {
        var y = r[0] + (j % 2 ? 1.5 : 0);
        c.circ(x, y, 8.4, (i + j) % 2 ? '#7A3C9E' : '#6A2F8E', { rad: true, sw: 1 });
        c.circ(x - 3, y - 3.2, 2.2, '#fff', { flat: true, stroke: false, op: 0.6 });
      });
    });
    c.line('M50 18 Q50 24 50 30', '#6B4A2A', 2.4);
  });

  // ── rose ────────────────────────────────────────────────────
  LectorArt.add('rose', function (c) {
    c.shadow(50, 91, 18, 3.5);
    c.path('M48 56 Q43 72 50 92 L54 92 Q49 72 53 56Z', '#4C9A3F', { sw: 1 });
    c.path('M48 78 L41 74 L48 72Z M52 66 L59 62 L52 60Z', '#5E8F3A', { sw: 0.8 });
    leaf(c, 49, 82, -60, 30, '#4FA044');
    leaf(c, 52, 72, 62, 28, '#58AA48');
    // bloom: a ring of outer petals, a second ring, then the tight centre
    var cx = 50, cy = 33;
    [0, 72, -72, 144, -144].forEach(function (a, i) {
      c.g('rotate(' + a + ' ' + cx + ' ' + cy + ')', function () { c.ell(cx, cy - 11, 12, 15, i % 2 ? '#C6213A' : '#B5172C', { sw: 1.1 }); });
    });
    [36, -36, 108, -108, 180].forEach(function (a, i) {
      c.g('rotate(' + a + ' ' + cx + ' ' + cy + ')', function () { c.ell(cx, cy - 7, 9, 11, i % 2 ? '#DB3A50' : '#D12E45', { sw: 1 }); });
    });
    c.circ(cx, cy, 7.5, '#B01A30', { rad: true, sw: 1 });
    c.line('M47 31 Q49 27 53 29 Q56 33 51 36 Q45 36 44 31 Q45 24 53 24', '#7E0C1F', 1.1);
    c.shine('M33 24 Q37 17 45 16 Q38 22 36 31Z', 0.45);
    c.path('M42 54 L36 61 L48 58Z M58 54 L64 61 L52 58Z M50 58 L49 65 L54 58Z', '#4C9A3F', { sw: 0.7 });
  });

  // ── pear ────────────────────────────────────────────────────
  LectorArt.add('pear', function (c) {
    c.shadow(50, 91, 26, 4.5);
    c.path('M50 22 Q62 22 62 38 Q62 50 72 62 Q82 78 66 88 Q50 94 34 88 Q18 78 28 62 Q38 50 38 38 Q38 22 50 22Z', '#B9CB3C', { rad: true, sw: 1.3 });
    c.path('M64 58 Q76 68 70 82 Q62 88 56 87 Q66 76 64 58Z', '#E88A3A', { stroke: false, op: 0.35 });
    c.circ(40, 78, 1, '#8A9A2A', { flat: true, stroke: false, op: 0.7 });
    c.circ(58, 66, 0.9, '#8A9A2A', { flat: true, stroke: false, op: 0.7 });
    c.circ(46, 62, 0.9, '#8A9A2A', { flat: true, stroke: false, op: 0.7 });
    c.line('M50 23 Q50 14 55 8', '#6B4220', 3);
    leaf(c, 53, 17, 70, 30, '#4FA044');
    c.shine('M40 34 Q42 26 47 25 Q43 34 44 46Z', 0.5);
    c.shine('M32 66 Q36 58 40 56 Q34 66 36 74Z', 0.4);
  });

  // ── cloud ───────────────────────────────────────────────────
  LectorArt.add('cloud', function (c) {
    var parts = [[50, 66, 36, 14], [28, 58, 15, 15], [48, 45, 21, 21], [70, 52, 16, 16], [82, 64, 11, 11]];
    parts.forEach(function (p) {
      c.ell(p[0], p[1] + 2, p[2], p[3], '#B7C9E0', { flat: true, sw: 1.2, stroke: '#8FA7C6' });
    });
    parts.forEach(function (p) {
      c.ell(p[0], p[1] + 2, p[2] - 0.2, p[3] - 0.2, '#B7C9E0', FLAT);
    });
    parts.forEach(function (p) {
      c.ell(p[0] - 1, p[1] - 2, p[2] - 3, p[3] - 3.5, '#FFFFFF', FLAT);
    });
    c.line('M30 50 Q36 44 44 46 M56 36 Q64 34 68 40 M72 52 Q78 50 80 56', '#CBD9EA', 1.4, { op: 0.9 });
    c.ell(46, 70, 26, 5, '#DCE7F4', { flat: true, stroke: false, op: 0.7 });
    c.shine('M34 40 Q40 30 52 28 Q42 34 38 46Z', 0.9);
  });

  // ── pine ────────────────────────────────────────────────────
  LectorArt.add('pine', function (c) {
    c.shadow(50, 91, 28, 4.5);
    c.path('M44 92 L45 74 H55 L56 92Z', '#7A4F27');
    c.line('M48 90 L48 76', '#9A6A38', 1.2, { op: 0.6 });
    var tiers = [[78, 32, 54, '#2C7344'], [66, 28, 40, '#318049'], [54, 24, 27, '#378D4E'], [42, 19, 16, '#3F9A55'], [31, 14, 5, '#48A85E']];
    tiers.forEach(function (t) {
      var b = t[0], hw = t[1], ap = t[2];
      c.path('M' + (50 - hw) + ' ' + b + ' Q50 ' + (b + 8) + ' ' + (50 + hw) + ' ' + b + ' L50 ' + ap + 'Z', t[3], { sw: 1.2 });
      c.shine('M50 ' + (ap + 3) + ' L' + (50 - hw * 0.8) + ' ' + (b - 2) + ' L' + (50 - hw * 0.5) + ' ' + (b - 3) + ' Q' + (50 - hw * 0.2) + ' ' + (ap + 14) + ' 50 ' + (ap + 3) + 'Z', 0.22);
    });
  });

  // ── leaf ────────────────────────────────────────────────────
  LectorArt.add('leaf', function (c) {
    c.shadow(50, 91, 22, 3.5);
    c.line('M40 90 Q44 74 50 58 Q52 52 60 46', '#7A4F27', 4);
    c.line('M40 90 Q44 74 50 58', '#A57640', 1.6, { op: 0.8 });
    leaf(c, 60, 48, 30, 52, '#4FA044');
    leaf(c, 47, 66, -52, 46, '#5BB04C');
    c.line('M44 74 L40 70', '#7A4F27', 2);
  });

  // ── apple ───────────────────────────────────────────────────
  LectorArt.add('apple', function (c) {
    c.shadow(50, 91, 30, 4.5);
    c.path('M50 33 Q40 24 27 32 Q13 44 19 66 Q27 89 46 86 Q50 85 54 86 Q73 89 81 66 Q87 44 73 32 Q60 24 50 33Z', '#D8352B', { rad: true, sw: 1.3 });
    c.path('M50 33 Q46 40 50 44 Q54 40 50 33Z', '#8E1D18', { flat: true, stroke: false, op: 0.45 });
    c.path('M66 50 Q80 56 76 72 Q72 82 62 84 Q72 72 66 50Z', '#8E1D18', { flat: true, stroke: false, op: 0.18 });
    c.line('M50 34 Q49 22 56 12', '#6B4220', 3.2);
    leaf(c, 54, 22, 62, 32, '#4FA044');
    c.shine('M26 44 Q28 36 36 34 Q30 42 30 56Z', 0.6);
    c.circ(33, 63, 2, '#fff', { flat: true, stroke: false, op: 0.4 });
  });

  // ── orange ──────────────────────────────────────────────────
  LectorArt.add('orange', function (c) {
    c.shadow(50, 91, 30, 4.5);
    c.circ(50, 56, 33, '#F38B1C', { rad: true, sw: 1.3 });
    for (var i = 1; i < 60; i++) {
      var a = i * 2.39996, r = Math.sqrt(i / 60) * 29;
      c.circ(50 + Math.cos(a) * r, 56 + Math.sin(a) * r, 0.75, '#B5560A', { flat: true, stroke: false, op: 0.4 });
    }
    c.path('M50 24 l-4 3 l4 2 l4 -2Z', '#5E8F2F', { sw: 0.7 });
    c.circ(50, 25, 2.2, '#7A5A2A', { flat: true, sw: 0.7 });
    leaf(c, 52, 25, 58, 30, '#4FA044');
    c.shine('M27 46 Q30 36 40 31 Q32 40 30 54Z', 0.6);
    c.circ(33, 66, 1.6, '#fff', { flat: true, stroke: false, op: 0.35 });
  });

  // ── tomato ──────────────────────────────────────────────────
  LectorArt.add('tomato', function (c) {
    c.shadow(50, 91, 32, 4.5);
    c.path('M50 34 Q36 26 22 38 Q10 52 18 70 Q28 88 50 86 Q72 88 82 70 Q90 52 78 38 Q64 26 50 34Z', '#E02D22', { rad: true, sw: 1.3 });
    c.path('M70 52 Q84 58 80 72 Q74 82 62 85 Q74 72 70 52Z', '#8E1A12', { flat: true, stroke: false, op: 0.2 });
    // calyx: a five-pointed green star
    var pts = [], k;
    for (k = 0; k < 10; k++) {
      var ang = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 6 : 17;
      pts.push((50 + Math.cos(ang) * rr).toFixed(1) + ' ' + (38 + Math.sin(ang) * rr * 0.62).toFixed(1));
    }
    c.path('M' + pts.join(' L') + 'Z', '#4C9A3F', { sw: 1 });
    c.circ(50, 38, 3.4, '#3E8A32', { rad: true, sw: 0.8 });
    c.line('M50 36 Q50 28 55 24', '#5C7F2A', 3);
    c.shine('M24 48 Q26 40 34 38 Q28 46 28 58Z', 0.6);
    c.circ(31, 66, 1.8, '#fff', { flat: true, stroke: false, op: 0.4 });
  });

  // ── lake ────────────────────────────────────────────────────
  LectorArt.add('lake', function (c) {
    c.ell(52, 70, 44, 20, '#E8DAAE', { sw: 1 });
    c.ell(52, 70, 40, 17, '#C9B98A', { flat: true, stroke: false, op: 0.35 });
    c.ell(52, 69, 38, 15.5, '#4FA9D6', { mode: 'v', sw: 1.1 });
    c.ell(52, 66, 30, 8, '#8FD0EC', { flat: true, stroke: false, op: 0.45 });
    c.line('M30 68 q6 -3 12 0 t12 0 M52 76 q6 -3 12 0 t10 0 M60 62 q5 -2.5 10 0', '#fff', 1.4, { op: 0.8 });
    c.shine('M26 62 Q34 56 46 56 Q36 59 30 66Z', 0.5);
    // reeds and cattails
    [[14, 76, 30, 22], [20, 78, 24, 28], [9, 78, 40, 32]].forEach(function (r) {
      c.line('M' + r[0] + ' ' + r[1] + ' Q' + (r[0] - 2) + ' ' + (r[1] - 18) + ' ' + (r[0] + 1) + ' ' + r[2], '#5F9A3A', 1.8);
      c.ell(r[0] + 1, r[2] - 3, 2.6, 7, '#7A4F27', { sw: 0.9 });
      c.line('M' + (r[0] + 1) + ' ' + (r[2] - 11) + ' v-3', '#7A4F27', 1);
    });
    c.line('M22 80 q-3 -10 -8 -14 M17 80 q2 -8 -2 -16 M6 80 q4 -8 2 -12', '#6FAE46', 1.6);
    c.line('M80 84 q-4 -6 -9 -7 M84 82 q3 -5 8 -6 M74 85 l-2 -5', '#6FAE46', 1.4, { op: 0.8 });
  });

  // ── island ──────────────────────────────────────────────────
  LectorArt.add('island', function (c) {
    c.ell(50, 76, 46, 17, '#3C9BCE', { mode: 'v', sw: 1 });
    c.ell(50, 75, 38, 12.5, '#6EC6E4', { flat: true, stroke: false, op: 0.6 });
    c.path('M16 76 Q26 58 50 56 Q74 58 84 76 Q50 88 16 76Z', '#EBD08E', { sw: 1.2 });
    c.path('M22 72 Q34 82 50 82 Q66 82 78 72 Q66 86 50 86 Q34 86 22 72Z', '#C9AB68', { flat: true, stroke: false, op: 0.35 });
    c.path('M34 64 Q44 58 56 60 Q50 66 40 68Z', '#5CAE4A', { sw: 0.9 });
    c.line('M12 84 q6 -3 12 0 t12 0 M64 88 q6 -3 12 0 t10 0 M70 70 q5 -2 10 0', '#fff', 1.3, { op: 0.8 });
    // palm
    c.line('M50 64 Q56 46 60 22', '#6E4A24', 5.5);
    c.line('M50 64 Q56 46 60 22', '#A87A45', 3);
    c.line('M52 54 l4 -1 M54 46 l4 -1 M56 38 l4 -1 M58 30 l3 -1', '#6E4A24', 1, { op: 0.8 });
    [[1, -38], [1, 4], [1, 48], [-1, -38], [-1, 4], [-1, 48]].forEach(function (f) {
      c.g('translate(60 22) scale(' + f[0] + ' 1) rotate(' + f[1] + ')', function () {
        c.path('M0 0 Q14 -13 32 3 Q16 -2 0 4Z', '#3F9A4A', { sw: 1 });
        c.line('M2 1 Q16 -5 30 3', '#2B7A36', 0.9, { op: 0.8 });
      });
    });
    c.circ(58, 26, 2.8, '#7A4F27', { rad: true, sw: 0.7 });
    c.circ(63, 26, 2.8, '#6E4A24', { rad: true, sw: 0.7 });
  });

  // ── rock ────────────────────────────────────────────────────
  LectorArt.add('rock', function (c) {
    c.shadow(50, 90, 42, 5.5);
    c.path('M12 86 Q8 64 22 48 Q32 30 54 29 Q76 30 85 52 Q94 70 90 86 Q52 95 12 86Z', '#8E9096', { sw: 1.4 });
    c.path('M22 48 Q32 30 54 29 Q72 30 82 46 Q62 40 44 46 Q30 52 22 48Z', '#BBBEC3', { flat: true, stroke: false, op: 0.9 });
    c.path('M72 50 Q90 64 90 86 Q80 90 68 90 Q78 72 72 50Z', '#4F5258', { flat: true, stroke: false, op: 0.3 });
    c.line('M44 48 Q40 62 46 74 M62 54 Q66 64 62 74', '#5F6268', 1.3, { op: 0.7 });
    c.path('M22 52 Q24 42 32 40 Q38 38 42 42 Q34 46 30 54 Q26 58 22 52Z', '#5F9E3E', { sw: 0.8 });
    c.circ(46, 40, 2.6, '#6FAE4A', { flat: true, stroke: false });
    c.circ(36, 56, 2, '#6FAE4A', { flat: true, stroke: false });
    c.shine('M30 40 Q38 33 50 32 Q40 36 34 44Z', 0.5);
  });

  // ── nest ────────────────────────────────────────────────────
  LectorArt.add('nest', function (c) {
    c.shadow(50, 90, 40, 4.5);
    c.ell(50, 62, 40, 14, '#6B4423', { sw: 1.1 });
    c.ell(50, 62, 33, 10, '#3E2812', { flat: true, stroke: false });
    [[36, 59, 0], [50, 57, 1], [63, 60, 2]].forEach(function (e) {
      c.ell(e[0], e[1], 8.2, 10.4, '#A9DCEA', { rad: true, sw: 1 });
      [[-2, -3], [3, 1], [-3, 4], [2, -6], [4, 6]].forEach(function (s, i) {
        c.circ(e[0] + s[0] + (e[2] - 1), e[1] + s[1], 0.9, '#4E7388', { flat: true, stroke: false, op: 0.7 });
      });
      c.shine('M' + (e[0] - 5) + ' ' + (e[1] - 4) + ' Q' + (e[0] - 4) + ' ' + (e[1] - 9) + ' ' + (e[0] - 1) + ' ' + (e[1] - 9) + ' Q' + (e[0] - 4) + ' ' + (e[1] - 5) + ' ' + (e[0] - 5) + ' ' + (e[1] - 1) + 'Z', 0.6);
    });
    c.path('M10 62 Q12 90 50 90 Q88 90 90 62 Q50 72 10 62Z', '#8B6234', { sw: 1.2 });
    var tw = ['#6B4423', '#A07842', '#7A5530', '#B58B50'];
    ['M14 70 Q50 82 86 68', 'M12 78 Q50 90 88 76', 'M20 84 Q50 92 80 84', 'M18 66 Q40 78 70 74', 'M30 72 Q60 84 90 70', 'M24 88 Q50 80 76 88'].forEach(function (d, i) {
      c.line(d, tw[i % 4], 2.1);
    });
    c.line('M10 62 q-4 -6 -2 -10 M90 62 q5 -5 4 -10 M24 52 l-4 -6 M78 52 l5 -5', '#6B4423', 1.8);
    c.line('M12 60 Q50 72 88 60', '#B58B50', 1.6, { op: 0.8 });
  });

  // ── egg ─────────────────────────────────────────────────────
  LectorArt.add('egg', function (c) {
    c.shadow(53, 90, 27, 4.5);
    c.g('rotate(8 50 88)', function () {
      c.path('M50 9 Q77 11 79 56 Q79 91 50 91 Q21 91 21 56 Q23 11 50 9Z', '#EFD9B8', { rad: true, sw: 1.3 });
      c.path('M64 40 Q78 52 77 72 Q74 88 58 90 Q70 76 64 40Z', '#B98B52', { flat: true, stroke: false, op: 0.18 });
      [[42, 74], [60, 66], [54, 52]].forEach(function (p) {
        c.circ(p[0], p[1], 1, '#C49A66', { flat: true, stroke: false, op: 0.4 });
      });
      c.shine('M30 42 Q31 24 44 18 Q36 30 37 48Z', 0.7);
      c.circ(33, 62, 1.8, '#fff', { flat: true, stroke: false, op: 0.4 });
    });
  });

  // ── log ─────────────────────────────────────────────────────
  LectorArt.add('log', function (c) {
    c.shadow(50, 90, 42, 5);
    c.path('M26 38 H76 V84 H26 Q12 84 12 61 Q12 38 26 38Z', '#8B5A2B', { sw: 1.3 });
    c.path('M26 38 H76 V48 H26 Q16 48 14 52 Q16 38 26 38Z', '#B07A44', { flat: true, stroke: false, op: 0.6 });
    ['M22 48 Q40 46 70 49', 'M18 58 Q40 56 72 59', 'M18 68 Q40 71 72 68', 'M24 78 Q44 76 70 79'].forEach(function (d) {
      c.line(d, '#4E2F12', 1.3, { op: 0.6 });
    });
    c.line('M34 52 v6 M50 62 v7 M30 72 v5 M58 50 v5 M44 76 v5', '#4E2F12', 1.2, { op: 0.5 });
    c.ell(76, 61, 14, 23, '#E0B87C', { sw: 1.3 });
    [[12, 20.5], [8.6, 14.5], [5.2, 9]].forEach(function (r) {
      c.line('M' + (76 - r[0]) + ' 61 a' + r[0] + ' ' + r[1] + ' 0 1 0 ' + 2 * r[0] + ' 0 a' + r[0] + ' ' + r[1] + ' 0 1 0 ' + (-2 * r[0]) + ' 0', '#A8773F', 1);
    });
    c.circ(76, 61, 1.6, '#8B5A2B', { flat: true, stroke: false });
    c.line('M76 61 L86 52', '#A8773F', 0.8, { op: 0.7 });
    c.shine('M20 44 Q40 41 58 42 Q38 45 22 50Z', 0.35);
  });

  // ── lighthouse ──────────────────────────────────────────────
  LectorArt.add('lighthouse', function (c) {
    c.shadow(50, 92, 44, 4);
    c.path('M10 92 Q12 78 28 74 L72 74 Q88 78 90 92Z', '#7B7F86', { sw: 1.3 });
    c.path('M22 80 Q34 72 52 74 Q40 78 30 88 L16 90Z', '#A4A8AE', { flat: true, stroke: false, op: 0.6 });
    c.path('M70 76 Q86 80 88 92 L76 92Z', '#4F5258', { flat: true, stroke: false, op: 0.3 });
    // tower: x(y) edges
    function L(y) { return 36 + (76 - y) * 6 / 50; }
    function R(y) { return 64 - (76 - y) * 6 / 50; }
    function band(y1, y2, col) {
      c.path('M' + L(y1).toFixed(1) + ' ' + y1 + ' L' + R(y1).toFixed(1) + ' ' + y1 + ' L' + R(y2).toFixed(1) + ' ' + y2 + ' L' + L(y2).toFixed(1) + ' ' + y2 + 'Z', col, { sw: 0.9 });
    }
    band(26, 76, '#F6F3EC');
    band(62, 76, '#D0382C'); band(38, 50, '#D0382C');
    c.path('M' + R(26).toFixed(1) + ' 26 L' + R(76).toFixed(1) + ' 76 L' + ((R(76) + L(76)) / 2 + 4).toFixed(1) + ' 76 L' + ((R(26) + L(26)) / 2 + 3).toFixed(1) + ' 26Z', '#2A1608', { flat: true, stroke: false, op: 0.16 });
    c.path('M' + (L(26) + 2).toFixed(1) + ' 28 L' + (L(76) + 2.5).toFixed(1) + ' 74 L' + (L(76) + 5).toFixed(1) + ' 74 L' + (L(26) + 4.5).toFixed(1) + ' 28Z', '#fff', { flat: true, stroke: false, op: 0.5 });
    c.path('M47 76 V68 Q50 64 53 68 V76Z', '#5A3A1C', { sw: 0.8 });
    c.rect(48.5, 52, 3, 5, '#3E5C86', { sw: 0.6 });
    c.rect(48.5, 31, 3, 5, '#3E5C86', { sw: 0.6 });
    // gallery, lamp room, cap
    c.circ(50, 17, 20, c.radGrad('#FFF3A8', '#FFF3A800', 0.5, 0.5, 0.5), { flat: true, stroke: false, op: 0.9 });
    c.rect(38, 24, 24, 3.5, '#33363B', { sw: 0.8 });
    c.rect(44, 12, 12, 12, '#FFE35E', { sw: 1 });
    c.line('M50 12 V24 M44 18 H56', '#8E6A12', 1);
    c.rect(44.8, 12.8, 3.4, 10.4, '#fff', { flat: true, stroke: false, op: 0.5 });
    c.line('M38 18 H62 M39 18 V24 M45 20 V24 M50 20 V24 M55 20 V24 M61 18 V24', '#33363B', 1);
    c.rect(42, 9, 16, 4, '#33363B', { sw: 0.8 });
    c.path('M43 9 Q50 -1 57 9Z', '#2B2B30', { sw: 1 });
    c.circ(50, 3.6, 1.6, '#2B2B30', { sw: 0.6 });
  });

  // ── ship ────────────────────────────────────────────────────
  LectorArt.add('ship', function (c) {
    c.path('M6 58 H96 Q92 74 82 82 H16 Q8 72 6 58Z', '#5F7F9E', { sw: 1.3 });
    c.path('M8.5 64 H94 L91.5 70 H11 Z', '#D0382C', { sw: 0.9 });
    c.rect(6, 56, 90, 3.5, '#33414F', { r: 1, sw: 0.7 });
    // funnel and smoke
    c.path('M54 26 L55 12 H68 L69 26Z', '#D0382C', { sw: 1 });
    c.rect(54.6, 12, 13.8, 4.5, '#2B2B30', { sw: 0.8 });
    c.circ(66, 8, 3, '#D9DDE2', { flat: true, stroke: false, op: 0.75 });
    c.circ(72, 4.5, 2.6, '#D9DDE2', { flat: true, stroke: false, op: 0.55 });
    // cabins
    c.rect(18, 42, 66, 15, '#F6F3EC', { sw: 1 });
    c.rect(28, 31, 44, 11.5, '#F1EEE6', { sw: 1 });
    c.rect(38, 24, 22, 7.5, '#F6F3EC', { sw: 1 });
    var x;
    for (x = 22; x < 80; x += 6.4) c.rect(x, 46, 3.8, 5, '#3E78A6', { sw: 0.6 });
    for (x = 32; x < 68; x += 6.4) c.rect(x, 34, 3.8, 4.5, '#3E78A6', { sw: 0.6 });
    for (x = 41; x < 58; x += 5.2) c.rect(x, 26, 3.2, 3.6, '#3E78A6', { sw: 0.6 });
    c.line('M20 42 H82', '#9CA3AB', 1);
    c.shine('M20 44 H50 V45.5 H20Z', 0.7);
    // water
    c.path('M2 80 Q8 76 16 80 T32 80 T48 80 T64 80 T80 80 T98 80 Q100 88 94 91 H6 Q0 88 2 80Z', '#3F9FD0', { sw: 1, stroke: '#2C7BA8' });
    c.line('M6 84 q6 -3 12 0 t12 0 M56 86 q6 -3 12 0 t12 0', '#fff', 1.3, { op: 0.7 });
    c.line('M2 79 q6 -3 12 0 t12 0 M70 79 q6 -3 12 0 t14 0', '#fff', 1.2, { op: 0.8 });
  });

  // ── house ───────────────────────────────────────────────────
  LectorArt.add('house', function (c) {
    c.shadow(50, 91, 44, 4.5);
    c.path('M44 88 H56 L64 96 H36Z', '#D9C7A0', { sw: 0.9 });
    c.rect(66, 20, 9, 22, '#B65A3E', { sw: 1 });
    c.rect(64.5, 18, 12, 4, '#9C4630', { sw: 0.9 });
    c.rect(20, 48, 60, 41, '#FBF3E4', { sw: 1.2 });
    c.rect(20, 48, 60, 4, '#2A1608', { flat: true, stroke: false, op: 0.12 });
    c.path('M10 52 L50 17 L90 52Z', '#C8442F', { sw: 1.3 });
    var y;
    for (y = 28; y <= 48; y += 5) {
      var dx = (y - 17) * 40 / 35 - 1;
      c.line('M' + (50 - dx).toFixed(1) + ' ' + y + ' H' + (50 + dx).toFixed(1), '#7E2416', 1, { op: 0.5 });
    }
    c.shine('M16 50 L46 22 L48 25 L22 50Z', 0.3);
    c.rect(44, 64, 12, 25, '#8B5A2B', { r: 6, sw: 1 });
    c.circ(53, 77, 1.2, '#F2C94C', { flat: true, stroke: false });
    [[26, 60], [61, 60]].forEach(function (w) {
      c.rect(w[0], w[1], 13, 13, '#BFE3F5', { sw: 1 });
      c.line('M' + (w[0] + 6.5) + ' ' + w[1] + ' V' + (w[1] + 13) + ' M' + w[0] + ' ' + (w[1] + 6.5) + ' H' + (w[0] + 13), '#fff', 1.2);
      c.rect(w[0] - 1.5, w[1] + 13, 16, 2.5, '#8B5A2B', { sw: 0.7 });
      c.shine('M' + (w[0] + 1.5) + ' ' + (w[1] + 1.5) + ' h4 l-4 5Z', 0.7);
    });
  });

  // ── tent ────────────────────────────────────────────────────
  LectorArt.add('tent', function (c) {
    c.ell(50, 88, 48, 7, '#6DB84F', { flat: true, stroke: false, op: 0.9 });
    c.shadow(52, 90, 42, 4);
    c.line('M12 90 l-2 -4 M20 92 l0 -5 M82 91 l2 -4 M92 90 l3 -5', '#3E8A32', 1.2, { op: 0.8 });
    // guy ropes and pegs
    c.line('M30 52 L6 90 M86 70 L96 91', '#B89A64', 1.2);
    c.line('M5 87 l3 5 M95 88 l3 4', '#A0A4AA', 2);
    c.path('M46 18 L84 28 L92 82 L74 88Z', '#357A3C', { sw: 1.2 });
    c.path('M46 18 L12 88 L74 88Z', '#52A04C', { sw: 1.3 });
    c.path('M46 18 L80 27', '#2A5E30', { flat: true, stroke: false, op: 0 });
    c.path('M46 36 L33 88 L60 88Z', '#233B28', { sw: 1 });
    c.path('M46 34 L31 88 L21 88 Q28 58 46 34Z', '#6BB85F', { sw: 1.1 });
    c.path('M46 34 L61 88 L68 88 Q62 58 46 34Z', '#4C9446', { sw: 1.1 });
    c.line('M46 34 L46 26', '#F0E6C8', 1.2);
    c.shine('M44 24 L22 74 L25 74 L46 30Z', 0.3);
    c.path('M84 30 L90 78', '#2A1608', { flat: true, stroke: false, op: 0 });
    c.circ(46, 18, 1.8, '#C9CED4', { flat: true, sw: 0.7 });
  });

  // ── igloo ───────────────────────────────────────────────────
  LectorArt.add('igloo', function (c) {
    c.ell(50, 88, 48, 7, '#DCEAF6', { flat: true, stroke: false });
    c.ell(60, 91, 38, 4.5, '#A9C6E4', { flat: true, stroke: false, op: 0.75 });
    c.path('M10 86 Q10 26 50 26 Q90 26 90 86Z', '#F4F9FD', { sw: 1.3, stroke: '#8FAECB' });
    // ice blocks
    var rows = [40, 52, 64, 76], hw = function (y) { var t = (86 - y) / 60; return 40 * Math.sqrt(Math.max(0, 1 - t * t)); };
    rows.forEach(function (y, i) {
      var h = hw(y) - 0.5;
      c.line('M' + (50 - h).toFixed(1) + ' ' + y + ' Q50 ' + (y + 3) + ' ' + (50 + h).toFixed(1) + ' ' + y, '#8FAECB', 1.1, { op: 0.8 });
      var n = 4 - Math.floor(i / 2), step = (2 * h) / (n + 1), j;
      var top = y, bot = i < 3 ? rows[i + 1] : 86;
      for (j = 1; j <= n; j++) {
        var jx = 50 - h + step * (j + (i % 2 ? 0.5 : 0) - 0.25);
        if (Math.abs(jx - 50) < hw(top + 6) - 2) c.line('M' + jx.toFixed(1) + ' ' + top + ' L' + (jx + (jx - 50) * 0.04).toFixed(1) + ' ' + (bot - 1), '#8FAECB', 1, { op: 0.7 });
      }
    });
    c.path('M60 28 Q88 36 90 86 L68 86 Q72 50 60 28Z', '#6F95C4', { flat: true, stroke: false, op: 0.28 });
    c.shine('M22 54 Q26 38 42 31 Q32 42 28 60Z', 0.9);
    // tunnel entrance
    c.path('M30 88 Q30 62 50 62 Q70 62 70 88Z', '#EEF5FB', { sw: 1.2, stroke: '#8FAECB' });
    c.path('M40 88 Q40 71 50 71 Q60 71 60 88Z', '#2D4F7C', { sw: 1, stroke: '#6F95C4' });
    c.path('M44 88 Q44 77 50 77 Q56 77 56 88Z', '#1C3555', { flat: true, stroke: false, op: 0.7 });
    c.line('M32 80 Q32 66 44 64', '#fff', 1.4, { op: 0.8 });
  });

  // ── bus ─────────────────────────────────────────────────────
  LectorArt.add('bus', function (c) {
    c.shadow(50, 90, 46, 4);
    c.path('M6 32 Q6 24 14 24 H86 Q94 24 94 32 V76 H6Z', '#D8302A', { sw: 1.3 });
    c.rect(6, 56, 88, 6, '#F4E6C8', { sw: 0.8 });
    c.rect(8, 64, 84, 11, '#B02420', { flat: true, stroke: false, op: 0.35 });
    var x;
    for (x = 11; x < 64; x += 11.5) c.rect(x, 30, 10, 17, '#9AD0EC', { r: 1.5, sw: 0.9 });
    for (x = 11; x < 64; x += 11.5) c.shine('M' + (x + 1.2) + ' 31.5 h3.2 l-3.2 5Z', 0.7);
    // doors
    c.rect(68, 30, 7, 34, '#9AD0EC', { r: 1, sw: 0.9 });
    c.rect(76, 30, 7, 34, '#8CC4E2', { r: 1, sw: 0.9 });
    c.line('M75.5 30 V64', '#7E1814', 1);
    // windscreen
    c.path('M85 30 H91 Q93 30 93 33 V50 H85Z', '#9AD0EC', { sw: 0.9 });
    c.rect(70, 25.5, 20, 3, '#2B2B30', { r: 1, sw: 0.6 });
    c.ell(91.5, 66, 2.4, 3.5, '#FFE9A0', { sw: 0.8 });
    c.rect(88, 72, 8, 4, '#8A8D92', { sw: 0.8 });
    c.shine('M10 26.5 H80 V28 H10Z', 0.45);
    // wheels
    [24, 76].forEach(function (wx) {
      c.circ(wx, 76, 11, '#2B2B30', { flat: true, sw: 0.8, stroke: '#111' });
      c.circ(wx, 77, 9, '#1F1F24', { rad: true, sw: 1, stroke: '#111' });
      c.circ(wx, 77, 4.6, '#C9CED4', { rad: true, sw: 0.8 });
      c.circ(wx, 77, 1.3, '#6A6E75', { flat: true, stroke: false });
    });
  });

  // ── van ─────────────────────────────────────────────────────
  LectorArt.add('van', function (c) {
    c.shadow(50, 90, 44, 4);
    c.path('M6 38 Q6 28 15 28 H58 Q66 28 72 38 L88 50 Q95 53 95 60 V78 H6Z', '#F4F4F1', { sw: 1.3, stroke: '#7E8187' });
    c.path('M88 50 Q95 53 95 60 V78 H88 V54Z', '#C9CCD2', { sw: 0.9 });
    c.path('M6 62 H88 L95 63 V68 H6Z', '#2F6FC0', { sw: 0.8 });
    c.path('M58 33 H64 Q68 33 72 40 L76 47 H58Z', '#9AD0EC', { sw: 0.9 });
    c.rect(10, 34, 14, 16, '#9AD0EC', { r: 1.5, sw: 0.9 });
    c.rect(28, 34, 26, 40, 'none', { r: 2, sw: 1, stroke: '#8A8D92' });
    c.line('M28 55 H54', '#C9CCD2', 1);
    c.rect(48, 50, 4, 2, '#8A8D92', { r: 1, sw: 0.6 });
    c.line('M56 33 V74', '#8A8D92', 1);
    c.ell(92.5, 58, 2.4, 3.2, '#FFE9A0', { sw: 0.8 });
    c.rect(86, 72, 10, 4, '#8A8D92', { sw: 0.8 });
    c.shine('M10 30.5 H54 V32 H10Z', 0.8);
    c.shine('M12 36 h4 l-4 7Z', 0.7);
    [24, 74].forEach(function (wx) {
      c.circ(wx, 77, 10.5, '#2B2B30', { flat: true, sw: 0.8, stroke: '#111' });
      c.circ(wx, 78, 8.6, '#1F1F24', { rad: true, sw: 1, stroke: '#111' });
      c.circ(wx, 78, 4.4, '#C9CED4', { rad: true, sw: 0.8 });
      c.circ(wx, 78, 1.3, '#6A6E75', { flat: true, stroke: false });
    });
  });

  // ── jet ─────────────────────────────────────────────────────
  LectorArt.add('jet', function (c) {
    c.g('rotate(-9 50 52)', function () {
      // far wing and tailplane
      c.path('M54 50 L72 36 L80 38 L70 52Z', '#B9C2CC', { sw: 0.9 });
      c.path('M10 46 L2 30 L14 34 L26 46Z', '#AEB8C4', { sw: 0.8 });
      // tail fin
      c.path('M8 48 L4 16 Q6 14 12 14 L34 44Z', '#2F6FC0', { sw: 1.2 });
      // fuselage
      c.path('M4 54 Q6 44 24 43 H76 Q95 44 98 52 Q94 60 76 61 H22 Q6 62 4 54Z', '#F7F8FA', { sw: 1.3 });
      c.path('M8 57 Q20 61 40 61 H76 Q92 60 96 54 Q90 59 76 59 H24 Q12 59 8 57Z', '#2F6FC0', { flat: true, stroke: false, op: 0.9 });
      c.path('M8 50 H88', '#2F6FC0', { flat: true, stroke: false, op: 0 });
      var x;
      for (x = 26; x < 74; x += 6) c.circ(x, 50, 1.9, '#8CC4E2', { rad: true, sw: 0.7 });
      c.path('M80 46 Q90 45 94 50 H82Z', '#6AA8D0', { sw: 0.9 });
      // near wing and engine
      c.path('M50 54 L22 82 H40 L72 56Z', '#E4E9EF', { sw: 1.2 });
      c.path('M24 80 L40 80 L44 76', '#9CA3AB', { flat: true, stroke: false, op: 0 });
      c.ell(50, 66, 11, 5.4, '#C3CAD3', { sw: 1.1 });
      c.ell(60, 66, 2.4, 4.2, '#5E646C', { flat: true, sw: 0.8 });
      c.shine('M20 46 H70 V47.6 H20Z', 0.8);
      c.shine('M30 80 L46 63 L48 64 L34 80Z', 0.5);
    });
  });
})();
