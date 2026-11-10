/* ================================================================
   LECTOR — animal art (js/lector-art-animals.js)
   Hand-built SVG animals for Lector. No text in any picture.
   ================================================================ */
(function () {
  'use strict';

  var EYE = '#2a1608';
  function eye(c, x, y, r) {
    c.circ(x, y, r, EYE, { flat: true, stroke: false });
    c.circ(x - r * 0.3, y - r * 0.3, r * 0.34, '#fff', { flat: true, stroke: false, op: 0.9 });
  }

  // ── bear ────────────────────────────────────────────────────
  LectorArt.add('bear', function (c) {
    c.shadow(50, 91, 34, 5);
    c.ell(31, 85, 12, 6.5, '#7E5030'); c.ell(69, 85, 12, 6.5, '#7E5030');
    c.ell(31, 86.5, 6, 3.2, '#D2AE86', { flat: true, stroke: false }); c.ell(69, 86.5, 6, 3.2, '#D2AE86', { flat: true, stroke: false });
    c.ell(50, 66, 26, 26, '#8B5A33', { rad: true });
    c.ell(50, 71, 14, 17, '#B58559', { flat: true, stroke: false, op: 0.55 });
    c.path('M30 50 Q18 62 22 80 Q30 84 36 78 Q38 62 38 52Z', '#855530');
    c.path('M70 50 Q82 62 78 80 Q70 84 64 78 Q62 62 62 52Z', '#855530');
    c.line('M24 77 v5 M28 78 v5 M76 77 v5 M72 78 v5', '#4a2c14', 1, { op: 0.6 });
    c.circ(31, 21, 8.5, '#8B5A33', { rad: true }); c.circ(69, 21, 8.5, '#8B5A33', { rad: true });
    c.circ(31, 22, 4.4, '#D2AE86', { flat: true, stroke: false }); c.circ(69, 22, 4.4, '#D2AE86', { flat: true, stroke: false });
    c.circ(50, 35, 21, '#966039', { rad: true });
    c.ell(50, 43, 11.5, 9, '#DDBB92', { rad: true, sw: 0.9 });
    c.ell(50, 38.5, 4.6, 3.3, EYE, { flat: true, stroke: false });
    c.line('M50 42 v3 M50 45 q-4 3 -7 0 M50 45 q4 3 7 0', '#5a3418', 1.1);
    eye(c, 40, 31, 2.5); eye(c, 60, 31, 2.5);
    c.shine('M33 24 Q40 16 51 16 Q42 20 37 30Z', 0.4);
    c.shine('M34 56 Q31 66 33 74 Q32 64 36 56Z', 0.25);
  });

  // ── puma ────────────────────────────────────────────────────
  LectorArt.add('puma', function (c) {
    c.shadow(50, 91, 38, 4.5);
    var tail = 'M74 50 Q92 50 91 66 Q90 78 80 80';
    c.line(tail, '#8A5A2A', 7.4);
    c.line(tail, '#D9A55E', 5.2);
    c.line('M85 78.6 Q82 80 79.6 80', '#3A2A20', 5.2);
    c.path('M36 60 L35 84 Q35 90 40 90 L46 90 Q46 86 45 84 L46 64Z', '#C48F4E');
    c.path('M66 60 L66 84 Q66 90 71 90 L78 90 Q78 86 76 84 L76 62Z', '#C48F4E');
    c.path('M26 46 Q38 40 58 42 Q78 42 80 54 Q82 64 72 68 L30 68 Q24 58 26 46Z', '#DBA862', { mode: 'v' });
    c.path('M30 62 Q50 70 74 64 L72 68 L30 68Z', '#F0DDB8', { flat: true, stroke: false, op: 0.7 });
    c.path('M26 60 L25 84 Q25 90 30 90 L36 90 Q36 86 35 84 L37 64Z', '#E0B070');
    c.path('M58 62 L56 76 Q60 82 62 90 L70 90 Q70 86 68 82 L70 72 L72 62Z', '#E0B070');
    c.ell(30, 89.5, 6, 2.6, '#EBC890', { sw: 0.8 }); c.ell(66, 89.5, 6.5, 2.6, '#EBC890', { sw: 0.8 });
    c.path('M16 40 Q18 52 26 58 L38 58 Q36 48 34 42Z', '#DBA862', { sw: 0.9 });
    c.path('M10 28 Q10 20 16 22 L20 28Z', '#D0A060', { sw: 0.9 }); c.path('M32 28 Q32 20 26 22 L22 28Z', '#D0A060', { sw: 0.9 });
    c.path('M12 27 Q12 23 15 24 L17 28Z', '#5a4030', { flat: true, stroke: false }); c.path('M30 27 Q30 23 27 24 L25 28Z', '#5a4030', { flat: true, stroke: false });
    c.ell(21, 38, 13, 12, '#E0B070', { rad: true });
    c.ell(16, 44, 9, 6.6, '#F4E6C8', { rad: true, sw: 0.9 });
    c.path('M10 40 h7 l-1.8 3.4Z', '#D87878', { sw: 0.6 });
    c.line('M13.6 43.2 v2 M13.6 45.2 q3 2.4 6 0', '#6a3a22', 0.9);
    c.line('M17 35 Q16 40 15 42 M25 35 Q27 40 24 44', '#5a4030', 1, { op: 0.45 });
    c.ell(16, 34, 2.8, 2, '#C8B060', { flat: true, sw: 0.5 }); c.ell(26, 34, 2.8, 2, '#C8B060', { flat: true, sw: 0.5 });
    c.ell(16.2, 34, 1, 1.8, EYE, { flat: true, stroke: false }); c.ell(26.2, 34, 1, 1.8, EYE, { flat: true, stroke: false });
    c.line('M8 44 l-6 -2 M8 46 l-6 2', '#fff', 0.8, { op: 0.9 });
    c.shine('M30 46 Q44 42 58 43 Q46 45 34 51Z', 0.35);
    c.shine('M14 28 Q20 26 26 28 Q20 29 16 34Z', 0.4);
  });

  // ── toad ────────────────────────────────────────────────────
  LectorArt.add('toad', function (c) {
    c.shadow(50, 91, 38, 5);
    c.ell(22, 78, 12, 15, '#7C7442');
    c.ell(78, 78, 12, 15, '#7C7442');
    c.ell(18, 89, 10, 3.6, '#7C7442'); c.ell(82, 89, 10, 3.6, '#7C7442');
    c.ell(50, 68, 30, 22, '#8A8650', { rad: true });
    c.ell(50, 78, 17, 12, '#C9C08A', { flat: true, stroke: false, op: 0.6 });
    c.ell(34, 87, 8, 4, '#827E48'); c.ell(66, 87, 8, 4, '#827E48');
    c.ell(50, 52, 29, 17, '#908B54', { rad: true });
    [[30, 64], [40, 72], [66, 66], [72, 76], [56, 80], [26, 76], [48, 62], [78, 62]].forEach(function (p) {
      c.circ(p[0], p[1], 2.6, '#6C6034', { flat: true, stroke: false, op: 0.85 });
      c.circ(p[0] - 0.7, p[1] - 0.7, 0.9, '#B3A874', { flat: true, stroke: false, op: 0.8 });
    });
    c.circ(34, 38, 9.5, '#8A8650', { rad: true }); c.circ(66, 38, 9.5, '#8A8650', { rad: true });
    c.circ(34, 38, 6.2, '#E0B040', { rad: true, sw: 0.7 }); c.circ(66, 38, 6.2, '#E0B040', { rad: true, sw: 0.7 });
    c.ell(34, 38, 4.4, 1.9, EYE, { flat: true, stroke: false }); c.ell(66, 38, 4.4, 1.9, EYE, { flat: true, stroke: false });
    c.circ(32.5, 35.5, 1.1, '#fff', { flat: true, stroke: false, op: 0.9 }); c.circ(64.5, 35.5, 1.1, '#fff', { flat: true, stroke: false, op: 0.9 });
    c.line('M22 58 Q50 70 78 58', '#4a3a1a', 1.7);
    c.circ(46, 52, 0.9, '#4a3a1a', { flat: true, stroke: false }); c.circ(54, 52, 0.9, '#4a3a1a', { flat: true, stroke: false });
    c.shine('M26 50 Q34 44 46 44 Q36 48 30 56Z', 0.3);
  });

  // ── mule ────────────────────────────────────────────────────
  LectorArt.add('mule', function (c) {
    c.shadow(50, 91, 38, 4.5);
    c.path('M80 44 Q92 50 90 70 Q88 78 90 82 L86 82 Q82 74 82 60Z', '#5A3822');
    c.path('M38 62 L38 88 H46 L47 66Z', '#6E4527'); c.path('M66 62 L66 88 H74 L73 66Z', '#6E4527');
    c.path('M38 88 h8 l1 3.4 h-10z M66 88 h8 l1 3.4 h-10z', '#2A1A10', { sw: 0.7 });
    c.path('M24 40 Q40 34 62 38 Q82 38 84 52 Q84 62 78 66 L30 66 Q24 56 24 40Z', '#8B5A38', { mode: 'v' });
    c.path('M30 60 Q54 68 78 62 L78 66 L30 66Z', '#B58A60', { flat: true, stroke: false, op: 0.6 });
    c.path('M28 60 L28 88 H36 L38 64Z', '#8B5A38'); c.path('M70 60 L68 88 H77 L78 64Z', '#8B5A38');
    c.path('M28 88 h8 l1 3.4 h-10z M69 88 h8 l1 3.4 h-10z', '#2A1A10', { sw: 0.7 });
    c.path('M24 28 L28 9 Q35 12 32 32Z', '#6E4527', { sw: 0.9 });
    c.path('M14 28 Q22 30 30 38 L36 54 Q28 58 22 52 Q22 42 16 38Z', '#8B5A38');
    c.path('M16 30 L13 10 Q21 8 25 28Z', '#8B5A38', { sw: 0.9 });
    c.path('M17 27 L15 13 Q19 12 22 27Z', '#E8B8A0', { flat: true, stroke: false, op: 0.85 });
    c.path('M12 30 Q8 36 6 46 Q6 54 12 56 Q18 56 22 50 L28 38 Q22 30 12 30Z', '#8B5A38', { rad: true });
    c.path('M6 44 Q5 54 11 56 Q18 57 22 51 Q16 50 12 46 Q9 42 6 44Z', '#DCC4A2', { sw: 0.9 });
    c.ell(8.5, 50, 1.4, 2, '#4a3020', { flat: true, stroke: false });
    eye(c, 16, 38, 2);
    c.path('M20 28 Q26 26 32 36 L30 40 Q24 34 20 32Z', '#4A2E1A', { sw: 0.6, op: 0.8 });
    c.shine('M30 40 Q44 36 60 38 Q46 40 34 46Z', 0.3);
  });

  // ── frog ────────────────────────────────────────────────────
  LectorArt.add('frog', function (c) {
    c.shadow(50, 91, 34, 5);
    c.ell(24, 76, 11, 15, '#5FB844'); c.ell(76, 76, 11, 15, '#5FB844');
    [[14, 90], [21, 91.5], [28, 91]].forEach(function (p) { c.circ(p[0], p[1], 3.3, '#8FD86A', { rad: true, sw: 0.8 }); });
    [[72, 91], [79, 91.5], [86, 90]].forEach(function (p) { c.circ(p[0], p[1], 3.3, '#8FD86A', { rad: true, sw: 0.8 }); });
    c.ell(50, 66, 25, 23, '#6CC04A', { rad: true });
    c.ell(50, 74, 15, 13, '#EBF4B4', { rad: true, sw: 0.8 });
    c.path('M34 62 L32 84 Q36 90 40 87 L42 66Z', '#62B845'); c.path('M66 62 L68 84 Q64 90 60 87 L58 66Z', '#62B845');
    [[33, 89], [39, 90], [61, 90], [67, 89]].forEach(function (p) { c.circ(p[0], p[1], 2.6, '#8FD86A', { rad: true, sw: 0.7 }); });
    c.ell(50, 46, 25, 17, '#72C94F', { rad: true });
    c.circ(33, 31, 10, '#6CC04A', { rad: true }); c.circ(67, 31, 10, '#6CC04A', { rad: true });
    c.circ(33, 31, 7.6, '#F3EBC0', { rad: true, sw: 0.7 }); c.circ(67, 31, 7.6, '#F3EBC0', { rad: true, sw: 0.7 });
    c.circ(34, 31.5, 4.8, EYE, { flat: true, stroke: false }); c.circ(66, 31.5, 4.8, EYE, { flat: true, stroke: false });
    c.circ(32.2, 29.2, 1.5, '#fff', { flat: true, stroke: false }); c.circ(64.2, 29.2, 1.5, '#fff', { flat: true, stroke: false });
    c.line('M30 50 Q50 58 70 50', '#3a7a28', 1.6);
    c.circ(46, 43, 0.9, '#3a7a28', { flat: true, stroke: false }); c.circ(54, 43, 0.9, '#3a7a28', { flat: true, stroke: false });
    c.shine('M30 54 Q28 64 32 72 Q30 62 34 54Z', 0.35);
    c.shine('M28 40 Q36 36 44 38 Q36 40 31 46Z', 0.3);
  });

  // ── parrot ──────────────────────────────────────────────────
  LectorArt.add('parrot', function (c) {
    c.shadow(50, 91, 36, 3.5, 0.7);
    c.path('M8 84 Q40 78 92 82 L92 88 Q40 86 8 90Z', '#8B5A2B');
    c.line('M14 86 q-1 -4 -4 -4', '#6B4220', 2);
    c.path('M52 58 Q60 78 58 90 L64 92 Q72 78 62 56Z', '#2F86C8', { sw: 0.9 });
    c.path('M48 60 Q54 80 48 91 L56 91 Q62 76 58 58Z', '#3BA7A0', { sw: 0.9 });
    c.ell(48, 54, 19, 28, '#4FB04A', { rad: true });
    c.ell(42, 58, 11, 20, '#9BD468', { flat: true, stroke: false, op: 0.45 });
    c.path('M54 36 Q70 46 68 68 Q64 74 56 70 Q52 54 50 42Z', '#3F9A3E');
    c.path('M58 52 Q66 56 65 68 Q60 70 56 66Z', '#F5C842', { sw: 0.8 });
    c.path('M56 70 Q60 72 66 68 Q64 76 58 78Z', '#2F86C8', { sw: 0.8 });
    c.path('M42 82 l-3 5 h3 M48 83 l-1 5 h3 M52 82 l1 5 h-4', '#E0A050', { flat: true, sw: 1.4, stroke: '#E0A050' });
    c.circ(44, 27, 14, '#4FB04A', { rad: true });
    c.path('M33 24 Q36 12 46 13 Q54 15 56 22 Q46 18 33 26Z', '#E03A2E', { sw: 0.9 });
    c.path('M33 26 Q22 26 22 34 Q22 40 28 38 Q27 34 32 33Z', '#F2E6C8', { sw: 0.9 });
    c.path('M22 34 Q22 40 28 38 Q27 36 25 35Z', '#8A8478', { sw: 0.6 });
    c.circ(38, 27, 4, '#fff', { flat: true, sw: 0.8 });
    eye(c, 38.4, 27, 2.2);
    c.shine('M34 36 Q32 50 36 62 Q34 48 38 38Z', 0.3);
    c.shine('M36 17 Q42 14 49 16 Q42 17 38 22Z', 0.4);
  });

  // ── cow ─────────────────────────────────────────────────────
  LectorArt.add('cow', function (c) {
    c.shadow(50, 91, 38, 4.5);
    c.path('M82 36 Q92 44 90 66 L86 80 L88 84 L82 84 L84 66 Q84 50 80 42Z', '#F3F0EA');
    c.path('M85 78 Q91 88 88 92 Q84 86 84 80Z', '#2E2A28', { sw: 0.7 });
    c.path('M38 62 L38 88 H46 L46 66Z', '#E8E3DA'); c.path('M66 62 L66 88 H74 L73 66Z', '#E8E3DA');
    c.path('M38 86 h8 l0 4 h-8z M66 86 h8 l0 4 h-8z', '#4a3a30', { sw: 0.7 });
    c.path('M22 38 Q40 32 62 36 Q82 36 84 50 Q86 62 76 68 L26 68 Q18 56 22 38Z', '#F7F4EE', { mode: 'v' });
    c.path('M36 36 Q50 32 60 38 Q58 48 48 50 Q36 50 36 36Z', '#2E2A28', { stroke: false, flat: true });
    c.path('M66 44 Q80 42 84 52 Q84 60 76 62 Q66 58 66 44Z', '#2E2A28', { stroke: false, flat: true });
    c.path('M24 56 Q30 52 34 58 Q32 66 26 66Z', '#2E2A28', { stroke: false, flat: true });
    c.path('M46 64 Q54 72 62 66 Q64 76 56 76 Q48 74 46 64Z', '#F1B6B0', { sw: 0.8 });
    c.path('M28 60 L28 88 H37 L38 64Z', '#F7F4EE'); c.path('M70 60 L68 88 H77 L78 64Z', '#F7F4EE');
    c.path('M28 86 h9 l0 4 h-9z M69 86 h9 l0 4 h-9z', '#4a3a30', { sw: 0.7 });
    c.path('M10 36 Q8 32 10 28 L14 30 Q16 24 22 28 L24 36 L30 52 Q22 58 16 54 Q14 44 10 36Z', '#F7F4EE');
    c.path('M16 22 Q10 16 8 18 Q8 24 14 28Z', '#F0E4C0', { sw: 0.9 }); c.path('M24 22 Q28 16 31 18 Q30 24 24 28Z', '#F0E4C0', { sw: 0.9 });
    c.path('M12 32 Q4 28 4 34 Q6 40 14 38Z', '#2E2A28', { sw: 0.8 });
    c.path('M10 32 Q8 28 11 28 Q22 24 30 38 L28 54 Q22 58 16 54 Q14 44 10 36Z', '#F7F4EE', { rad: true, sw: 0.9 });
    c.path('M10 42 Q9 52 16 56 Q24 58 28 54 L28 46 Q18 44 10 42Z', '#F6B8B0', { rad: true, sw: 0.9 });
    c.ell(14.5, 50, 1.4, 2, '#9A5A55', { flat: true, stroke: false }); c.ell(22, 52, 1.4, 2, '#9A5A55', { flat: true, stroke: false });
    c.path('M20 30 Q24 28 28 32 Q26 36 22 36Z', '#2E2A28', { flat: true, stroke: false });
    eye(c, 18, 38, 2);
    c.shine('M26 42 Q40 36 58 38 Q42 40 30 48Z', 0.4);
  });

  // ── seal ────────────────────────────────────────────────────
  LectorArt.add('seal', function (c) {
    c.shadow(50, 92, 44, 4.5);
    c.path('M6 90 Q4 78 16 74 Q50 68 86 74 Q98 80 94 90Z', '#8E8A84');
    c.path('M16 76 Q40 70 70 74', '#B8B4AC', { flat: true, stroke: false, op: 0.6 });
    c.line('M14 82 Q20 80 26 84 M62 84 Q70 80 80 84', '#6E6A64', 1, { op: 0.5 });
    c.path('M70 70 Q86 68 94 60 L96 66 Q90 76 82 78 L92 84 Q80 84 70 78Z', '#7C8794', { sw: 0.9 });
    c.path('M26 34 Q16 54 24 72 Q50 82 76 76 Q82 72 74 64 Q50 66 40 50 Q38 40 40 32Z', '#8D99A6', { mode: 'd' });
    c.path('M30 60 Q50 76 74 72 L76 76 Q50 84 24 72Z', '#C4CCD4', { flat: true, stroke: false, op: 0.55 });
    [[40, 66], [52, 70], [62, 70], [30, 56], [46, 60], [68, 66]].forEach(function (p) {
      c.circ(p[0], p[1], 2.2, '#5E6A78', { flat: true, stroke: false, op: 0.7 });
    });
    c.path('M38 56 Q50 60 52 68 Q42 70 36 62Z', '#7C8794', { sw: 0.9 });
    c.circ(32, 28, 15, '#97A3B0', { rad: true });
    c.ell(28, 36, 10, 7, '#C4CCD4', { rad: true, sw: 0.8 });
    c.ell(23, 33, 3.6, 2.6, EYE, { flat: true, stroke: false });
    eye(c, 25, 24, 3); eye(c, 40, 24, 3);
    [[30, 38], [34, 38]].forEach(function (p) { c.circ(p[0], p[1], 0.8, '#5E6A78', { flat: true, stroke: false }); });
    c.line('M30 40 q2 2 4 0', '#4a5460', 0.9);
    c.line('M20 36 l-12 -3 M20 38 l-13 2 M20 40 l-11 6 M36 37 l9 -2', '#fff', 1, { op: 0.95 });
    c.shine('M22 20 Q28 14 36 15 Q28 18 24 26Z', 0.45);
  });

  // ── duck ────────────────────────────────────────────────────
  LectorArt.add('duck', function (c) {
    c.shadow(50, 91, 32, 4.5);
    c.line('M44 74 v12 M60 74 v12', '#E88A2C', 3.6);
    c.path('M36 86 L52 86 L50 91 L30 91Z', '#F0A030', { sw: 0.9 });
    c.path('M54 86 L70 86 L68 91 L48 91Z', '#F0A030', { sw: 0.9 });
    c.path('M78 52 Q92 50 94 40 Q86 40 82 46Z', '#3A3430', { sw: 0.9 });
    c.path('M22 52 Q24 74 50 78 Q80 80 86 58 Q90 48 80 48 Q40 46 22 52Z', '#9C8E7C', { mode: 'v' });
    c.path('M22 52 Q22 72 44 78 Q40 66 42 52Z', '#8F4E2E', { rad: true, sw: 0.9 });
    c.path('M46 58 Q64 50 82 58 Q76 74 52 72 Q46 68 46 58Z', '#7E7060', { sw: 0.9 });
    c.path('M58 62 Q68 58 76 62 Q70 68 58 66Z', '#3E6FB8', { sw: 0.7 });
    c.path('M50 62 Q58 58 66 60 M52 67 Q62 64 72 66', '#5A4E40', { flat: true, stroke: '#5A4E40', sw: 0.8, op: 0.5 });
    c.path('M20 52 Q30 48 40 52 L40 44 Q30 38 20 44Z', '#F4F1EA', { sw: 0.8 });
    c.path('M20 30 Q22 44 24 52 L38 52 Q36 40 34 30Z', '#2F8F4A');
    c.circ(28, 28, 12, '#2F8F4A', { rad: true });
    c.path('M20 38 Q28 44 38 38 L38 43 Q28 48 20 43Z', '#F4F1EA', { sw: 0.8 });
    c.path('M18 28 Q8 27 6 31 Q8 36 18 35Z', '#F0A030', { rad: true, sw: 0.9 });
    c.path('M17 31.6 Q10 31.6 8 31.4', '#C87810', { flat: true, stroke: '#C87810', sw: 0.7 });
    eye(c, 25, 25, 2);
    c.shine('M20 22 Q26 17 33 19 Q26 20 22 27Z', 0.45);
    c.shine('M28 54 Q40 52 56 53 Q40 55 30 60Z', 0.3);
  });

  // ── hen ─────────────────────────────────────────────────────
  LectorArt.add('hen', function (c) {
    c.shadow(50, 91, 32, 4.5);
    c.path('M74 56 Q82 40 80 28 Q88 34 92 46 Q92 56 84 64Z', '#5A3A28', { sw: 0.9 });
    c.path('M74 58 Q86 46 86 34 Q94 40 96 52 Q94 62 84 66Z', '#8A4A2A', { sw: 0.9 });
    c.line('M46 76 v11 M60 76 v11', '#E8B040', 3);
    c.path('M38 90 l8 -3 l8 3 M52 90 l8 -3 l8 3', '#E8B040', { flat: true, stroke: '#D89A28', sw: 2.4, op: 1 });
    c.path('M20 46 Q40 38 66 46 Q86 52 82 68 Q70 82 46 80 Q26 78 22 62 Q18 54 20 46Z', '#B5532B', { rad: true });
    c.path('M26 66 Q40 76 64 74 Q54 80 38 78Z', '#D98A55', { flat: true, stroke: false, op: 0.6 });
    c.path('M42 54 Q60 50 74 58 Q70 72 52 72 Q42 66 42 54Z', '#9A4220', { sw: 0.9 });
    c.line('M48 58 q10 -3 18 0 M50 64 q10 -3 18 0 M54 69 q8 -2 12 -1', '#7A3216', 1, { op: 0.7 });
    c.path('M20 54 Q16 46 18 36 L28 34 L32 52Z', '#B5532B');
    c.circ(24, 30, 10.5, '#BE5A30', { rad: true });
    c.path('M18 22 Q16 12 20 12 Q22 16 22 18 Q23 8 28 8 Q30 12 28 18 Q32 12 35 14 Q34 20 31 24Z', '#D8352B', { rad: true, sw: 0.9 });
    c.path('M15 30 L8 33 L15 36Z', '#F2B63A', { sw: 0.8 });
    c.path('M17 36 Q14 46 19 46 Q22 42 21 36Z', '#D8352B', { sw: 0.8 });
    eye(c, 21, 28, 2);
    c.shine('M18 24 Q22 18 28 20 Q22 21 20 26Z', 0.4);
    c.shine('M26 50 Q40 44 56 46 Q42 48 30 56Z', 0.3);
  });

  // ── pig ─────────────────────────────────────────────────────
  LectorArt.add('pig', function (c) {
    c.shadow(50, 91, 38, 4.5);
    c.line('M82 52 q10 -6 8 -12 q-4 -4 -7 0 q-1 4 3 4', '#E89AA0', 2.6);
    c.path('M36 62 L36 88 H45 L46 66Z', '#E88A94'); c.path('M66 62 L66 88 H75 L74 66Z', '#E88A94');
    c.path('M36 86 h9 v4 h-9z M66 86 h9 v4 h-9z', '#7A4A4A', { sw: 0.7 });
    c.path('M22 46 Q36 34 60 36 Q86 38 86 58 Q86 72 74 72 L30 72 Q18 64 22 46Z', '#F4A8B0', { rad: true });
    c.path('M30 66 Q54 76 80 66 L78 72 L30 72Z', '#FAC8CC', { flat: true, stroke: false, op: 0.6 });
    c.path('M24 62 L24 88 H33 L35 66Z', '#F4A8B0'); c.path('M72 62 L70 88 H79 L80 66Z', '#F4A8B0');
    c.path('M24 86 h9 v4 h-9z M70 86 h9 v4 h-9z', '#7A4A4A', { sw: 0.7 });
    c.circ(28, 50, 17, '#F6B0B8', { rad: true });
    c.path('M26 32 Q38 28 42 38 Q42 46 36 46 Q28 44 26 32Z', '#E88A94', { sw: 0.9 });
    c.ell(14, 56, 8.5, 7, '#F2929C', { rad: true, sw: 0.9 });
    c.ell(11.5, 56, 1.6, 2.4, '#8A3A44', { flat: true, stroke: false }); c.ell(16.5, 56, 1.6, 2.4, '#8A3A44', { flat: true, stroke: false });
    c.line('M22 62 Q28 64 32 62', '#B05A64', 1);
    eye(c, 24, 46, 2);
    c.shine('M20 40 Q26 36 33 38 Q26 40 22 47Z', 0.4);
    c.shine('M34 42 Q50 38 68 41 Q52 42 38 48Z', 0.35);
  });

  // ── rat ─────────────────────────────────────────────────────
  LectorArt.add('rat', function (c) {
    c.shadow(52, 90, 40, 4);
    c.line('M80 78 Q98 82 96 66 Q95 56 88 58', '#EBA9A9', 3.8);
    c.line('M80 78 Q98 82 96 66 Q95 56 88 58', '#D88A8A', 1, { op: 0.6 });
    c.ell(38, 86, 5, 2.4, '#E8A8A6', { sw: 0.7 }); c.ell(68, 86, 5, 2.4, '#E8A8A6', { sw: 0.7 });
    c.path('M20 62 Q34 46 58 48 Q82 50 84 70 Q80 84 56 84 Q30 84 22 74Z', '#8F8174', { rad: true });
    c.path('M30 76 Q54 86 80 76 Q70 86 52 86 Q36 86 30 76Z', '#CFC4B4', { flat: true, stroke: false, op: 0.6 });
    c.path('M66 76 Q76 78 80 72 L74 84 L62 84Z', '#8F8174', { sw: 0.8 });
    c.path('M30 74 Q34 82 40 84 L46 84 Q44 76 40 72Z', '#9A8C7E', { sw: 0.8 });
    c.path('M8 66 Q12 52 28 52 Q40 56 42 66 Q40 78 26 78 Q12 78 8 66Z', '#9A8C7E', { rad: true });
    c.ell(34, 46, 8, 9, '#EBA9A9', { rad: true, sw: 0.9 });
    c.ell(34, 47, 4.6, 5.6, '#F6C8C8', { flat: true, stroke: false });
    c.circ(6, 66, 3.6, '#E8788A', { rad: true, sw: 0.7 });
    eye(c, 20, 60, 2.3);
    c.line('M12 68 l-8 -4 M12 70 l-9 1 M12 72 l-8 6', '#fff', 0.9, { op: 0.95 });
    c.line('M24 70 q3 3 7 1', '#6a5440', 0.9, { op: 0.7 });
    c.shine('M26 54 Q36 50 50 52 Q38 54 30 60Z', 0.35);
  });

  // ── dog ─────────────────────────────────────────────────────
  LectorArt.add('dog', function (c) {
    c.shadow(50, 91, 32, 5);
    c.path('M70 80 Q94 82 90 56 Q88 52 85 54 Q86 70 70 72Z', '#8B5A33');
    c.ell(50, 66, 24, 25, '#F4EEE4', { rad: true });
    c.path('M28 58 Q34 44 52 44 Q70 46 74 60 Q62 52 48 54 Q36 56 28 66Z', '#9A6438', { stroke: false, mode: 'v' });
    c.path('M34 62 L32 86 Q34 91 40 91 L48 91 Q48 84 46 62Z', '#F4EEE4', { mode: 'v' });
    c.path('M54 62 L54 86 Q54 91 60 91 L68 91 Q68 84 66 62Z', '#F4EEE4', { mode: 'v' });
    c.line('M36 88 v3 M41 88 v3 M57 88 v3 M62 88 v3', '#b9a88e', 1);
    c.path('M28 18 Q16 22 16 40 Q16 54 24 56 Q32 52 32 38Z', '#8B5A33', { rad: true });
    c.path('M72 18 Q84 22 84 40 Q84 54 76 56 Q68 52 68 38Z', '#8B5A33', { rad: true });
    c.circ(50, 33, 19, '#F6F0E6', { rad: true });
    c.path('M36 16 Q48 12 52 18 Q52 28 44 30 Q34 28 36 16Z', '#9A6438', { stroke: false, flat: true, op: 0.9 });
    c.path('M50 18 L50 30', '#E0D4C0', { flat: true, stroke: false, op: 0 });
    c.ell(50, 43, 10.5, 8, '#FFFDF6', { rad: true, sw: 0.8 });
    c.ell(50, 38, 4.6, 3.4, EYE, { flat: true, stroke: false });
    c.circ(48.6, 37, 1, '#fff', { flat: true, stroke: false, op: 0.8 });
    c.line('M50 41 v3 M50 44 q-3 3 -6 1 M50 44 q3 3 6 1', '#6a4a30', 1);
    eye(c, 41, 30, 2.4); eye(c, 59, 30, 2.4);
    c.shine('M38 22 Q44 18 52 19 Q44 22 41 28Z', 0.5);
    c.shine('M34 52 Q30 62 32 72 Q31 62 36 52Z', 0.3);
  });

  // ── fox ─────────────────────────────────────────────────────
  LectorArt.add('fox', function (c) {
    c.shadow(50, 91, 38, 5);
    c.path('M66 80 Q96 84 94 54 Q92 34 76 32 Q84 44 80 54 Q78 68 62 70Z', '#E0702A', { rad: true });
    c.path('M94 54 Q92 34 80 31 Q76 32 78 38 Q86 40 90 52 Q90 60 88 66Q94 62 94 54Z', '#FBF4E8', { sw: 0.9 });
    c.ell(48, 68, 22, 24, '#E5772E', { rad: true });
    c.path('M38 48 Q50 44 62 52 Q58 64 54 78 Q50 86 46 78 Q40 62 38 48Z', '#FBF4E8', { sw: 0.9 });
    c.path('M32 66 L32 88 Q32 91 38 91 L46 91 L46 84 L44 66Z', '#4A2A1C', { mode: 'v' });
    c.path('M54 66 L54 88 Q54 91 60 91 L68 91 L68 84 L66 66Z', '#4A2A1C', { mode: 'v' });
    c.path('M30 22 L26 2 L42 14Z', '#E5772E'); c.path('M66 22 L70 2 L54 14Z', '#E5772E');
    c.path('M30 18 L28 7 L38 14Z', '#3A2216', { sw: 0.7 }); c.path('M66 18 L68 7 L58 14Z', '#3A2216', { sw: 0.7 });
    c.path('M26 34 Q26 16 50 14 Q74 16 74 34 Q72 44 62 50 Q56 54 50 56 Q44 54 38 50 Q28 44 26 34Z', '#E87A30', { rad: true });
    c.path('M26 34 Q36 36 44 44 Q46 52 50 56 Q44 54 38 50 Q28 44 26 34Z', '#FBF4E8', { flat: true, stroke: false });
    c.path('M74 34 Q64 36 56 44 Q54 52 50 56 Q56 54 62 50 Q72 44 74 34Z', '#FBF4E8', { flat: true, stroke: false });
    c.ell(50, 52, 4.2, 3.2, EYE, { flat: true, stroke: false });
    c.line('M50 54 v3 M50 57 q-3 3 -6 0 M50 57 q3 3 6 0', '#6a3a22', 1);
    c.ell(39, 36, 3.4, 2.4, '#E8B848', { flat: true, sw: 0.5 }); c.ell(61, 36, 3.4, 2.4, '#E8B848', { flat: true, sw: 0.5 });
    c.ell(39.4, 36, 1.2, 2.2, EYE, { flat: true, stroke: false }); c.ell(61.4, 36, 1.2, 2.2, EYE, { flat: true, stroke: false });
    c.shine('M34 22 Q42 16 54 16 Q44 20 38 30Z', 0.4);
    c.shine('M36 54 Q34 66 38 76 Q36 66 40 54Z', 0.3);
  });

  // ── bug (ladybird) ──────────────────────────────────────────
  LectorArt.add('bug', function (c) {
    c.shadow(50, 91, 40, 4.5);
    c.path('M4 80 Q4 40 40 18 Q80 6 96 12 Q98 52 62 82 Q30 98 4 80Z', '#5BB04C', { mode: 'd' });
    c.path('M10 82 Q36 56 90 16', '#3E8A34', { flat: true, stroke: '#3E8A34', sw: 1.4, op: 0.8 });
    c.line('M34 56 l-6 -8 M48 44 l-4 -9 M26 68 l-8 0 M60 34 l8 2 M44 62 l8 6 M62 48 l8 4', '#3E8A34', 1, { op: 0.6 });
    c.line('M30 34 Q24 28 20 30 M70 34 Q76 28 80 30', '#2A1608', 1.2);
    c.line('M24 52 l-9 3 M76 52 l9 3 M26 70 l-8 6 M74 70 l8 6', '#2A1608', 2.4);
    c.ell(50, 24, 12, 9, '#2E2A28', { rad: true });
    c.ell(44, 22, 3.4, 2.4, '#F4F1EA', { flat: true, stroke: false }); c.ell(56, 22, 3.4, 2.4, '#F4F1EA', { flat: true, stroke: false });
    c.ell(50, 54, 33, 34, '#D8352B', { rad: true });
    c.path('M50 22 V88', '#7A1812', { flat: true, stroke: '#7A1812', sw: 1.6 });
    c.path('M30 28 Q50 20 70 28 Q50 34 30 28Z', '#2E2A28', { sw: 0.8 });
    [[36, 44, 6.5], [64, 44, 6.5], [32, 64, 5.5], [68, 64, 5.5], [42, 76, 4.4], [58, 76, 4.4]].forEach(function (p) {
      c.circ(p[0], p[1], p[2], '#2E2A28', { rad: true, sw: 0.7 });
    });
    c.shine('M30 40 Q34 28 46 26 Q36 34 34 48Z', 0.55);
    c.shine('M68 38 Q72 44 70 52 Q68 46 66 40Z', 0.3);
  });

  // ── ant ─────────────────────────────────────────────────────
  LectorArt.add('ant', function (c) {
    var L = '#3A2218';
    c.shadow(50, 90, 42, 4);
    c.line('M42 54 L34 70 L28 88 M48 56 L48 72 L50 88 M54 56 L62 70 L72 88', L, 2.8);
    c.line('M42 52 L30 40 L22 52 M52 52 L48 36 L40 46 M56 52 L70 40 L78 54', L, 2.6);
    c.ell(76, 56, 20, 15, '#5A3224', { rad: true });
    c.ell(68, 52, 3, 7, '#8C5A44', { flat: true, stroke: false, op: 0.5 });
    c.ell(54, 52, 6, 5, '#4C2A1E', { rad: true, sw: 0.8 });
    c.ell(44, 50, 10, 9, '#5A3224', { rad: true });
    c.ell(48, 56, 8, 3, '#2A1810', { flat: true, stroke: false, op: 0.35 });
    c.ell(22, 46, 13, 12, '#613728', { rad: true });
    c.path('M12 54 Q8 62 14 64 Q16 58 18 56Z', '#4C2A1E', { sw: 0.8 });
    c.path('M20 58 Q14 66 22 66 Q24 62 24 58Z', '#4C2A1E', { sw: 0.8 });
    c.line('M18 38 Q12 24 4 20 M26 36 Q30 22 22 12', '#2A1810', 1.8);
    c.circ(4, 20, 2, '#3A2218', { rad: true, sw: 0.6 }); c.circ(22, 12, 2, '#3A2218', { rad: true, sw: 0.6 });
    c.circ(16, 43, 3.6, '#F4F1EA', { flat: true, sw: 0.8 }); eye(c, 15.6, 43.4, 2.2);
    c.shine('M14 36 Q20 32 28 34 Q20 36 17 42Z', 0.4);
    c.shine('M64 46 Q74 42 86 48 Q74 48 66 54Z', 0.3);
  });

  // ── chick ───────────────────────────────────────────────────
  LectorArt.add('chick', function (c) {
    c.shadow(50, 91, 28, 4.5);
    c.line('M42 82 v8 M58 82 v8', '#F0983A', 2.6);
    c.path('M33 91 l9 -3 l9 3 M49 91 l9 -3 l9 3', '#F0983A', { flat: true, stroke: '#E0802A', sw: 2.2 });
    c.ell(50, 62, 29, 24, '#FFD94A', { rad: true });
    c.ell(50, 74, 16, 11, '#FFE98A', { flat: true, stroke: false, op: 0.6 });
    c.path('M24 54 Q10 56 12 70 Q18 76 28 70Z', '#F5C42E', { sw: 0.9 });
    c.path('M76 54 Q90 56 88 70 Q82 76 72 70Z', '#F5C42E', { sw: 0.9 });
    c.circ(50, 36, 21, '#FFDE55', { rad: true });
    c.path('M44 17 Q42 8 46 10 Q48 12 49 16 Q51 6 55 10 Q55 14 54 18Z', '#F5C42E', { sw: 0.8 });
    c.path('M44 40 L56 40 L50 47Z', '#F28A28', { sw: 0.9 });
    c.path('M46 41 L54 41 L50 43Z', '#F8B060', { flat: true, stroke: false, op: 0.9 });
    c.ell(37, 42, 4, 3, '#F59A5A', { flat: true, stroke: false, op: 0.45 }); c.ell(63, 42, 4, 3, '#F59A5A', { flat: true, stroke: false, op: 0.45 });
    eye(c, 40, 34, 2.7); eye(c, 60, 34, 2.7);
    c.shine('M36 26 Q42 18 52 18 Q44 22 40 30Z', 0.55);
    c.shine('M28 56 Q30 48 38 46 Q32 52 32 60Z', 0.35);
  });

  // ── fish ────────────────────────────────────────────────────
  LectorArt.add('fish', function (c) {
    c.path('M70 50 Q86 34 96 30 Q92 50 96 70 Q86 66 70 50Z', '#2FA6A0', { sw: 1 });
    c.line('M78 50 L92 40 M78 50 L93 50 M78 50 L92 60', '#1C7D78', 0.9, { op: 0.6 });
    c.path('M30 30 Q44 14 62 26 Q66 30 64 36 Q46 30 30 30Z', '#2FA6A0', { sw: 1 });
    c.path('M44 70 Q50 84 62 84 Q58 74 58 66Z', '#2FA6A0', { sw: 1 });
    c.path('M14 52 Q18 28 46 28 Q72 28 84 50 Q72 72 46 72 Q18 72 14 52Z', '#F08A30', { mode: 'v' });
    c.path('M18 58 Q40 74 76 56 Q70 68 46 72 Q24 72 18 58Z', '#FBD08A', { flat: true, stroke: false, op: 0.6 });
    var s = '';
    for (var r = 0; r < 3; r++) for (var k = 0; k < 4; k++) {
      var x = 40 + k * 10 + (r % 2) * 5, y = 38 + r * 10;
      s += 'M' + x + ' ' + (y - 4) + ' q5 4 0 8 ';
    }
    c.line(s, '#B85A14', 1.1, { op: 0.55 });
    c.line('M34 34 Q28 52 34 66', '#B85A14', 1.4, { op: 0.6 });
    c.path('M40 56 Q54 54 62 62 Q50 68 40 62Z', '#2FA6A0', { sw: 0.9 });
    c.circ(26, 46, 6, '#FFF3D6', { flat: true, sw: 0.8 }); eye(c, 26, 46, 3.6);
    c.path('M14 54 Q18 56 22 54', '#8A3A10', { flat: true, stroke: '#8A3A10', sw: 1, op: 0 });
    c.line('M14 54 Q18 57 22 55', '#8A3A10', 1.1);
    c.circ(10, 38, 2.2, '#fff', { flat: true, sw: 0.7, op: 0.7, stroke: '#9AD0E0' });
    c.circ(6, 28, 1.6, '#fff', { flat: true, sw: 0.7, op: 0.7, stroke: '#9AD0E0' });
    c.shine('M22 38 Q34 30 50 31 Q36 35 26 44Z', 0.5);
  });

  // ── nap (a tabby cat curled up asleep) ──────────────────────
  LectorArt.add('nap', function (c) {
    c.shadow(50, 90, 42, 5);
    c.ell(54, 68, 38, 24, '#C98A52', { rad: true });
    c.path('M30 60 Q50 54 74 58 Q60 52 46 52 Q34 52 30 60Z', '#A8683A', { flat: true, stroke: false, op: 0.5 });
    c.line('M52 46 q-2 8 0 14 M60 46 q-2 8 0 14 M68 48 q-2 8 0 14 M76 52 q-2 8 -1 14 M44 48 q-2 6 0 12', '#6E4220', 2.4, { op: 0.6 });
    c.path('M16 76 Q40 90 74 86 Q92 82 92 70 Q90 58 82 56 Q86 68 74 76 Q50 82 24 70Z', '#C98A52', { mode: 'v' });
    c.line('M30 80 q4 3 6 -2 M44 84 q4 2 6 -3 M58 85 q4 1 6 -3 M72 82 q4 0 6 -3', '#6E4220', 2.2, { op: 0.6 });
    c.circ(28, 62, 3, '#6E4220', { flat: true, stroke: false, op: 0 });
    c.path('M12 54 L12 36 L26 46Z', '#C98A52'); c.path('M44 46 L46 32 L34 42Z', '#C98A52');
    c.path('M15 50 L14 41 L21 46Z', '#F0A9A0', { stroke: false }); c.path('M42 44 L43 36 L37 42Z', '#F0A9A0', { stroke: false });
    c.ell(28, 62, 19, 17, '#D49A60', { rad: true });
    c.line('M22 47 v5 M28 46 v6 M34 47 v5', '#6E4220', 2, { op: 0.55 });
    c.line('M18 60 q3 3 7 0 M32 60 q3 3 7 0', '#3a2210', 1.5);
    c.path('M28 64 h4 l-2 3Z', '#E88A8A', { sw: 0.6 });
    c.line('M30 67 q-3 3 -6 1 M30 67 q3 3 6 1', '#7a3d2a', 0.9);
    c.line('M14 66 l-8 -2 M14 68 l-8 3', '#fff', 0.9, { op: 0.9 });
    c.ell(14, 76, 7, 4.5, '#F3E3C8', { sw: 0.8 }); c.ell(26, 80, 7, 4.5, '#F3E3C8', { sw: 0.8 });
    c.shine('M16 54 Q24 48 34 50 Q24 52 20 60Z', 0.4);
    c.shine('M42 52 Q60 46 78 52 Q60 52 46 58Z', 0.3);
  });
})();
