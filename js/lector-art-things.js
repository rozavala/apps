/* ================================================================
   LECTOR — everyday things (js/lector-art-things.js)
   Hand-drawn pictures for the simple 3-letter words. Loaded after
   js/lector-art.js; each one registers itself with LectorArt.add.
   No text, letters or numbers appear in any of them.
   ================================================================ */
(function () {
  'use strict';

  var SKIN = '#E8B48A';

  // a clip path (in the object's own coordinates)
  function clip(c, d) {
    var id = c._id();
    c.defs += '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>';
    return id;
  }
  function pattern(c, inner, w, h) {
    var id = c._id();
    c.defs += '<pattern id="' + id + '" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse">' + inner + '</pattern>';
    return 'url(#' + id + ')';
  }
  function steam(c, x, y, col) {
    c.line('M' + x + ' ' + y + ' q-4 -5 0 -9 q4 -5 0 -9', col || '#B4BEC8', 2.4, { op: 0.8 });
  }

  // ── pan ─────────────────────────────────────────────────────
  LectorArt.add('pan', function (c) {
    c.shadow(46, 88, 42, 5);
    c.path('M68 56 L93 47 Q99 48 97 54 L71 66Z', '#4A3A33', { sw: 0.9 });
    c.circ(93, 51, 1.6, '#E8E4DC', { flat: true, sw: 0.6 });
    c.ell(36, 63, 33, 22, '#8A9097');
    c.ell(36, 57, 33, 22, '#CDD3D9', { mode: 'v' });
    c.ell(36, 58, 28, 18, '#3B3D43', { rad: true, sw: 0.8 });
    c.ell(36, 60, 20, 11, '#2E3035', { flat: true, stroke: false, op: 0.5 });
    c.circ(65, 54, 1.5, '#D5D9DE', { sw: 0.5 });
    c.circ(65, 60, 1.5, '#D5D9DE', { sw: 0.5 });
    c.shine('M8 52 Q11 38 28 36 Q17 42 13 56Z', 0.65);
    c.shine('M20 52 Q25 45 36 44 Q27 48 24 56Z', 0.25);
  });

  // ── tin ─────────────────────────────────────────────────────
  LectorArt.add('tin', function (c) {
    c.shadow(50, 91, 30, 5);
    c.path('M24 30 V82 Q24 91 50 91 Q76 91 76 82 V30Z', '#C6CCD3', { mode: 'h' });
    [41, 52, 63, 74].forEach(function (y) {
      c.line('M24 ' + y + ' Q50 ' + (y + 6) + ' 76 ' + y, '#6F7780', 1.5, { op: 0.65 });
      c.line('M24.5 ' + (y + 2) + ' Q50 ' + (y + 8) + ' 75.5 ' + (y + 2), '#fff', 1.1, { op: 0.7 });
    });
    c.path('M24 80 Q50 90 76 80 V84 Q76 91 50 91 Q24 91 24 84Z', '#9AA2AB', { stroke: false, op: 0.7 });
    c.ell(50, 30, 27, 8.5, '#E3E7EB');
    c.ell(50, 30.5, 21.5, 5.8, '#AEB6BE', { mode: 'v' });
    c.ell(50, 30, 17, 3.6, '#D5DADF', { flat: true, stroke: false, op: 0.7 });
    c.shine('M30 42 H34 V84 Q30 83 30 80Z', 0.5);
    c.shine('M35 27 Q44 24 56 25 Q44 27 38 31Z', 0.7);
  });

  // ── tap ─────────────────────────────────────────────────────
  LectorArt.add('tap', function (c) {
    c.shadow(40, 90, 28, 4);
    // spout (behind the column)
    c.line('M36 44 V30 Q36 14 54 14 Q70 14 70 30 V38', '#5E6770', 12.5);
    c.line('M36 44 V30 Q36 14 54 14 Q70 14 70 30 V38', '#CBD3DA', 10);
    c.line('M34 34 V30 Q34 17 52 16.5', '#fff', 2.2, { op: 0.8 });
    c.line('M72.5 30 V38', '#8D98A2', 1.6, { op: 0.8 });
    c.path('M64 36 H76 L75 44 H65Z', '#AAB3BB', { sw: 0.9, mode: 'h' });
    // lever handle
    c.path('M33 52 L12 44 Q7 43 7 47.5 Q7 51 12 52 L33 61Z', '#B9C2CA', { mode: 'v', sw: 0.9 });
    c.shine('M13 45 L30 52 L12 47Z', 0.7);
    // column and base
    c.path('M30 42 H42 V80 H30Z', '#C4CCD3', { mode: 'h' });
    c.ell(36, 42, 6.5, 2.2, '#E3E8EC', { sw: 0.8 });
    c.ell(36, 57, 7, 6, '#AEB7BF', { rad: true });
    c.path('M24 88 Q25 78 30 78 H42 Q47 78 48 88Z', '#C4CCD3', { mode: 'h' });
    c.shine('M32 46 H34 V76 H32Z', 0.7);
    // drop
    c.path('M70 54 Q64 63 66 68 Q70 73 74 68 Q76 63 70 54Z', '#6CB8E8', { rad: true, sw: 0.9 });
    c.shine('M68 62 Q67 66 68.5 68 Q67.5 64.5 69 61Z', 0.8);
  });

  // ── cap ─────────────────────────────────────────────────────
  LectorArt.add('cap', function (c) {
    c.shadow(50, 85, 40, 5);
    var dome = 'M16 68 Q12 26 50 24 Q86 26 82 68 Q50 76 16 68Z';
    c.path('M54 64 Q82 56 98 68 Q96 84 66 82 Q54 78 50 72Z', '#2D63B8', { sw: 1.1 });
    c.path('M66 71 Q84 66 94 70', '#1D4A92', { flat: true, stroke: false, op: 0 });
    c.path(dome, '#3A78D0', { rad: true });
    var id = clip(c, dome);
    c.raw('<g clip-path="url(#' + id + ')">');
    c.line('M50 24 Q30 44 26 72', '#1E4C94', 1.2, { op: 0.8 });
    c.line('M50 24 Q70 44 74 72', '#1E4C94', 1.2, { op: 0.8 });
    c.line('M50 24 Q48 44 54 74', '#1E4C94', 1.2, { op: 0.8 });
    c.line('M50 24 Q30 44 26 72', '#9CC1F0', 0.8, { dash: '2 2', op: 0.6 });
    c.line('M50 24 Q70 44 74 72', '#9CC1F0', 0.8, { dash: '2 2', op: 0.6 });
    c.path('M12 62 Q50 72 88 62 L88 80 L12 80Z', '#2A5CAA', { flat: true, stroke: false, op: 0.65 });
    c.raw('</g>');
    c.path('M16 68 Q50 76 82 68', '#1D4A92', { flat: true, stroke: '#173F80', sw: 1.1 });
    c.circ(50, 25, 4, '#3A78D0', { rad: true, sw: 1 });
    c.circ(27, 44, 1.5, '#1D4A92', { flat: true, stroke: false });
    c.circ(73, 44, 1.5, '#1D4A92', { flat: true, stroke: false });
    c.shine('M26 40 Q32 28 48 27 Q36 32 31 46Z', 0.45);
    c.shine('M68 71 Q82 67 92 70 Q80 70 70 74Z', 0.25);
  });

  // ── hat ─────────────────────────────────────────────────────
  LectorArt.add('hat', function (c) {
    c.shadow(50, 84, 44, 5);
    c.ell(50, 68, 46, 15, '#8A5A33', { mode: 'v' });
    c.ell(50, 70, 44, 11.5, '#6F4526', { flat: true, stroke: false, op: 0.35 });
    var crown = 'M29 66 Q26 38 36 30 Q50 22 64 30 Q74 38 71 66 Q50 76 29 66Z';
    c.path(crown, '#A06B3F', { mode: 'h' });
    c.path('M29.5 57 Q50 67 70.5 57 L71 66 Q50 76 29 66Z', '#4A2D1B', { mode: 'v', sw: 0.9 });
    c.path('M36 30 Q50 40 64 30 Q50 22 36 30Z', '#7E5030', { flat: true, stroke: false, op: 0.7 });
    c.line('M37 31 Q50 39 63 31', '#5E3A20', 1.4, { op: 0.7 });
    c.line('M30 59 Q50 69 70 59', '#8A5E3A', 0.9, { op: 0.7 });
    c.shine('M33 52 Q31 40 37 33 Q36 42 37 52Z', 0.4);
    c.shine('M8 66 Q14 56 28 54 Q16 60 12 68Z', 0.4);
  });

  // ── ham ─────────────────────────────────────────────────────
  LectorArt.add('ham', function (c) {
    c.ell(50, 84, 46, 8, '#F4F0E6', { sw: 0.9 });
    c.ell(50, 84, 38, 5, '#E6DFCF', { flat: true, stroke: false, op: 0.8 });
    c.shadow(44, 79, 34, 4, 0.8);
    // bone end
    c.path('M18 62 L8 62 Q4 60 5 56 Q7 52 11 54 Q12 50 16 52 L21 54Z', '#F1E7D2', { sw: 0.9 });
    var ham = 'M14 62 Q8 38 38 30 Q70 22 84 48 Q92 72 62 80 Q30 86 14 62Z';
    c.path(ham, '#DE8E78', { rad: true });
    var id = clip(c, ham);
    c.raw('<g clip-path="url(#' + id + ')">');
    c.path('M10 70 Q50 92 94 62 L94 90 L10 90Z', '#B25A3E', { flat: true, stroke: false, op: 0.45 });
    c.path('M16 56 Q40 42 70 38 Q50 50 22 66Z', '#E9A25A', { flat: true, stroke: false, op: 0.55 });
    for (var i = -3; i < 7; i++) {
      c.line('M' + (14 + i * 12) + ' 30 L' + (34 + i * 12) + ' 86', '#A2492F', 1, { op: 0.6 });
      c.line('M' + (86 + i * -12) + ' 30 L' + (66 + i * -12) + ' 86', '#A2492F', 1, { op: 0.6 });
    }
    c.raw('</g>');
    [[34, 46], [46, 40], [58, 46], [40, 58], [52, 56], [64, 58], [46, 70], [28, 58]].forEach(function (p) {
      c.circ(p[0], p[1], 1.5, '#4A2A1A', { flat: true, stroke: false });
    });
    c.shine('M22 50 Q28 38 46 34 Q32 42 27 56Z', 0.45);
    // the slice, leaning against the ham
    c.g('rotate(-14 78 66)', function () {
      c.ell(79, 66, 12, 17, '#F2B8AE', { sw: 1 });
      c.ell(79, 66, 9.4, 14.2, '#EE9B94', { rad: true, sw: 0.8 });
      c.raw('<ellipse cx="79" cy="66" rx="12" ry="17" fill="none" stroke="#F8E2C8" stroke-width="1.8" opacity=".9"/>');
      c.line('M73 58 Q78 53 85 56', '#F8CFC6', 1.2, { op: 0.8 });
      c.line('M74 72 Q80 78 86 72', '#D5736D', 1.1, { op: 0.6 });
    });
  });

  // ── pen ─────────────────────────────────────────────────────
  LectorArt.add('pen', function (c) {
    // the ink line it has just written
    c.line('M8 80 q5 -8 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t6 -8', '#2748A8', 2, { op: 0.85 });
    c.shadow(48, 84, 40, 3, 0.5);
    c.g('translate(50 54) rotate(18)', function () {
      c.path('M-42 -5 H-26 V5 H-42 Q-45 5 -45 2 V-2 Q-45 -5 -42 -5Z', '#1F4FA8', { sw: 1 });
      c.path('M-26 -6 H22 Q28 -6 30 -4 V4 Q28 6 22 6 H-26Z', '#3B7BE0', { mode: 'v' });
      c.path('M22 -5 H34 L38 -2 V2 L34 5 H22Z', '#1F4FA8', { mode: 'v', sw: 0.9 });
      c.path('M38 -2.4 L48 -0.6 L48 0.6 L38 2.4Z', '#BFC6CD', { mode: 'v', sw: 0.8 });
      c.path('M-24 -6 V-8 H8 Q10 -8 10 -6 V-5 H-24Z', '#C9D0D7', { mode: 'v', sw: 0.9 });
      c.line('M-22 -7 H6', '#fff', 0.8, { op: 0.8 });
      c.ell(-34, 0, 1.8, 3, '#8DB3F0', { flat: true, stroke: false, op: 0.7 });
      c.shine('M-20 -3 H20 Q22 -3 20 -1.5 H-20Z', 0.5);
    });
  });

  // ── net ─────────────────────────────────────────────────────
  LectorArt.add('net', function (c) {
    c.shadow(28, 91, 20, 3, 0.7);
    var bag = 'M39 34 Q58 14 80 12 Q95 12 91 26 Q84 46 69 62 Q56 52 39 34Z';
    c.path(bag, '#EAF4F2', { flat: true, stroke: false, op: 0.6 });
    var id = clip(c, bag);
    c.raw('<g clip-path="url(#' + id + ')">');
    for (var i = -8; i < 16; i++) {
      c.line('M' + (i * 6) + ' 0 L' + (i * 6 + 70) + ' 80', '#8FA9A6', 0.6, { op: 0.8 });
      c.line('M' + (i * 6 + 110) + ' 0 L' + (i * 6 + 20) + ' 80', '#8FA9A6', 0.6, { op: 0.8 });
    }
    c.raw('</g>');
    c.raw('<path d="' + bag + '" fill="none" stroke="#7C9794" stroke-width="1.1" stroke-linejoin="round"/>');
    c.shine('M44 34 Q58 20 76 16 Q60 24 48 38Z', 0.5);
    // the handle
    c.line('M9 91 L50 56', '#6E4220', 6);
    c.line('M9 91 L50 56', '#B27B45', 4);
    c.line('M10.5 88.5 L48 56.5', '#E8C592', 1, { op: 0.8 });
    // the hoop
    c.raw('<ellipse cx="54" cy="48" rx="9" ry="20" transform="rotate(-47 54 48)" fill="none" stroke="#3E4852" stroke-width="5.2"/>' +
      '<ellipse cx="54" cy="48" rx="9" ry="20" transform="rotate(-47 54 48)" fill="none" stroke="#A8B3BE" stroke-width="3.2"/>' +
      '<path d="M44 36 Q50 31 56 31" transform="rotate(0)" fill="none" stroke="#fff" stroke-width="1" opacity=".7" stroke-linecap="round"/>');
  });

  // ── mop ─────────────────────────────────────────────────────
  LectorArt.add('mop', function (c) {
    c.shadow(50, 91, 32, 5);
    c.ell(50, 57, 26, 7, '#2F6FB5', { sw: 0.9 });
    // strands standing in the bucket
    c.path('M30 62 Q24 40 38 34 Q50 28 62 34 Q76 40 70 62Z', '#E7E4DB', { mode: 'd' });
    for (var i = 0; i < 9; i++) {
      c.line('M' + (33 + i * 4.4) + ' 60 Q' + (30 + i * 5) + ' 46 ' + (36 + i * 3.6) + ' 36', '#A9A69C', 0.9, { op: 0.8 });
    }
    // the wooden handle
    c.line('M47 4 L49 42', '#7A4C26', 5);
    c.line('M47 4 L49 42', '#C08A52', 3.2);
    c.line('M46 6 L47.6 38', '#EBC896', 0.9, { op: 0.8 });
        // bucket
    c.path('M26 58 Q50 66 74 58 L68 86 Q67 91 60 91 H40 Q33 91 32 86Z', '#4A91DC', { mode: 'h' });
    c.path('M28 66 Q50 74 72 66 L70 74 Q50 82 30 74Z', '#2F6FB5', { flat: true, stroke: false, op: 0.35 });
    c.path('M26 58 Q50 66 74 58 Q74 55 71 54 Q50 62 29 54 Q26 55 26 58Z', '#7DB6EE', { sw: 0.9, flat: true });
    c.shine('M31 66 L34 84 L36.5 84 L34 66Z', 0.5);
    // loose strands over the rim
    c.path('M38 61 Q35 66 38 72 Q41 66 41 62Z', '#E7E4DB', { sw: 0.8 });
    c.path('M58 62 Q62 66 60 73 Q57 68 56 63Z', '#E7E4DB', { sw: 0.8 });
  });

  // ── pot ─────────────────────────────────────────────────────
  LectorArt.add('pot', function (c) {
    c.shadow(50, 91, 38, 5);
    // side handles
    c.path('M8 58 Q8 54 12 54 H22 V62 H12 Q8 62 8 58Z', '#3D3F45', { sw: 0.9 });
    c.path('M92 58 Q92 54 88 54 H78 V62 H88 Q92 62 92 58Z', '#3D3F45', { sw: 0.9 });
    // body
    c.path('M20 48 H80 V82 Q80 91 71 91 H29 Q20 91 20 82Z', '#C3C9D0', { mode: 'h' });
    c.path('M20 74 Q50 82 80 74 V82 Q80 91 71 91 H29 Q20 91 20 82Z', '#8E96A0', { stroke: false, op: 0.4 });
    c.line('M21 50 H79', '#8E96A0', 1.2, { op: 0.8 });
    // lid
    c.path('M17 49 Q20 34 50 33 Q80 34 83 49 Q50 54 17 49Z', '#D6DBE1', { mode: 'h' });
    c.line('M20 46 Q50 51 80 46', '#8E96A0', 1.1, { op: 0.7 });
    // knob
    c.path('M46 33 H54 L53 28 H47Z', '#6A6D74', { sw: 0.8 });
    c.ell(50, 26, 7, 4.6, '#44464C', { rad: true, sw: 0.9 });
    c.shine('M26 44 Q32 37 44 36 Q34 40 31 47Z', 0.7);
    c.shine('M25 54 H29 V86 Q25 84 25 80Z', 0.5);
    // steam from the rim of the lid
    steam(c, 33, 30); steam(c, 68, 28);
  });

  // ── box ─────────────────────────────────────────────────────
  LectorArt.add('box', function (c) {
    c.shadow(50, 90, 44, 5);
    // back flaps
    c.path('M14 46 L50 34 L47 17 L8 29Z', '#C99A5C', { sw: 1 });
    c.path('M50 34 L86 46 L92 29 L53 17Z', '#B3844A', { sw: 1 });
    // inside of the open top
    c.path('M14 46 L50 34 L86 46 L50 58Z', '#6B4524', { sw: 1 });
    c.path('M16 47 L50 36 L50 50Z', '#523417', { flat: true, stroke: false, op: 0.6 });
    // faces
    c.path('M14 46 L50 58 V90 L14 78Z', '#D2A266', { mode: 'h' });
    c.path('M50 58 L86 46 V78 L50 90Z', '#B48549', { mode: 'h' });
    // tape
    c.path('M27 51 L36 54 V86 L27 83Z', '#E6CB97', { sw: 0.8, flat: true });
    c.line('M31 55 V84', '#C9AC73', 0.7, { op: 0.6 });
    // front flaps folded out
    c.path('M14 46 L50 58 L46 69 L7 56Z', '#DDB173', { sw: 1 });
    c.path('M50 58 L86 46 L93 56 L54 69Z', '#C7985C', { sw: 1 });
    c.line('M12 56 L44 67', '#fff', 1, { op: 0.35 });
    c.line('M50 58 V90', '#7E5628', 1.2, { op: 0.5 });
    c.shine('M16 78 V50 L19 51 V77Z', 0.3);
  });

  // ── cup ─────────────────────────────────────────────────────
  LectorArt.add('cup', function (c) {
    c.shadow(48, 91, 32, 5);
    // handle
    c.line('M68 48 Q90 46 87 62 Q84 76 66 74', '#A9A296', 9.5);
    c.line('M68 48 Q90 46 87 62 Q84 76 66 74', '#F5F2EA', 7);
    c.line('M72 49 Q86 49 84 60', '#fff', 1.4, { op: 0.8 });
    // mug
    c.path('M24 40 H72 V78 Q72 91 58 91 H38 Q24 91 24 78Z', '#F6F3EC', { mode: 'h' });
    c.path('M24 70 Q48 80 72 70 V78 Q72 91 58 91 H38 Q24 91 24 78Z', '#CFC8B8', { stroke: false, op: 0.45 });
    c.ell(48, 40, 24, 7, '#FAF8F2');
    c.ell(48, 41, 20.5, 5.2, '#7A4526', { rad: true, sw: 0.8 });
    c.ell(44, 40, 8, 1.8, '#A5703F', { flat: true, stroke: false, op: 0.7 });
    c.shine('M29 46 Q28 66 31 80 Q33 66 33 46Z', 0.8);
    steam(c, 38, 30); steam(c, 52, 29); steam(c, 62, 31);
  });

  // ── rug ─────────────────────────────────────────────────────
  LectorArt.add('rug', function (c) {
    // bilinear map of the rug's own (u, v) onto the picture
    function P(u, v) {
      var x0 = 27 + (83 - 27) * u, x1 = 6 + (96 - 6) * u;
      var y0 = 34 + 2 * u, y1 = 86;
      return [x0 + (x1 - x0) * v, y0 + (y1 - y0) * v];
    }
    function quad(u0, u1, v0, v1) {
      var a = P(u0, v0), b = P(u1, v0), d = P(u1, v1), e = P(u0, v1);
      return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + ' L' +
        d[0].toFixed(1) + ' ' + d[1].toFixed(1) + ' L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) + 'Z';
    }
    c.shadow(52, 87, 48, 4, 0.6);
    // fringe on the two short ends
    var f = '';
    for (var i = 0; i <= 12; i++) {
      var v = 0.02 + i * 0.08;
      var a = P(0, v), b = P(-0.05, v + 0.01), a2 = P(1, v), b2 = P(1.05, v + 0.01);
      f += 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' + (b[0] - 1).toFixed(1) + ' ' + b[1].toFixed(1) +
        ' M' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1) + ' L' + (b2[0] + 1).toFixed(1) + ' ' + b2[1].toFixed(1);
    }
    c.line(f, '#D9C79B', 1.4);
    c.path(quad(0, 1, 0, 1), '#C0453A', { mode: 'v' });
    c.path(quad(0.07, 0.93, 0.1, 0.9), '#F1E4C3', { flat: true, sw: 0.8, stroke: '#9A3A30' });
    c.path(quad(0.12, 0.88, 0.2, 0.8), '#B83E34', { mode: 'v', sw: 0.8 });
    // diamonds down the middle
    for (var k = 0; k < 5; k++) {
      var u = 0.2 + k * 0.15;
      var t = P(u, 0.32), r = P(u + 0.07, 0.5), bt = P(u, 0.68), l = P(u - 0.07, 0.5);
      c.path('M' + t[0] + ' ' + t[1] + ' L' + r[0] + ' ' + r[1] + ' L' + bt[0] + ' ' + bt[1] + ' L' + l[0] + ' ' + l[1] + 'Z',
        k % 2 ? '#E8B54A' : '#F1E4C3', { flat: true, sw: 0.7, stroke: '#8A3228' });
    }
    // border dashes in the cream band
    var dsh = '';
    for (var j = 0; j < 12; j++) {
      var p = P(0.1 + j * 0.073, 0.95), q = P(0.1 + j * 0.073, 0.97);
      dsh += 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }
    c.line(dsh, '#C0453A', 1.2, { op: 0.8 });
    c.shine('M28 36 L82 36 L81 38 L27 38Z', 0.35);
  });

  // ── bag ─────────────────────────────────────────────────────
  LectorArt.add('bag', function (c) {
    c.shadow(50, 91, 36, 5);
    // straps: the back one stands up, the front one has flopped
    c.line('M34 44 Q32 8 52 10 Q64 11 64 44', '#B5A074', 6.5);
    c.line('M34 44 Q32 8 52 10 Q64 11 64 44', '#D8C79B', 4.4);
    var body = 'M20 42 Q50 36 80 42 Q82 64 84 86 Q50 96 16 86 Q18 64 20 42Z';
    c.path(body, '#E6D6AE', { mode: 'd' });
    c.path('M20 42 Q50 49 80 42 Q50 38 20 42Z', '#8A7650', { flat: true, stroke: false, op: 0.55 });
    var id = clip(c, body);
    c.raw('<g clip-path="url(#' + id + ')">');
    c.path('M17 60 Q50 68 83 60 V72 Q50 80 17 72Z', '#D95A4C', { flat: true, stroke: '#A23A30', sw: 0.9 });
    c.line('M17 62.5 Q50 70.5 83 62.5 M17 69.5 Q50 77.5 83 69.5', '#F4D9A8', 0.8, { dash: '2 2' });
    c.line('M30 48 Q36 66 32 90 M66 50 Q62 70 70 90', '#A8956A', 1, { op: 0.45 });
    c.raw('</g>');
    c.path('M40 44 Q36 24 22 30 Q18 36 24 44Z', '#D8C79B', { sw: 1 });
    c.line('M24 44 Q20 36 24 31 Q36 26 40 44', '#B5A074', 1.1, { op: 0.8 });
    c.line('M30 40 Q32 34 36 40', '#9B8860', 0.9, { op: 0.5 });
    c.shine('M23 48 Q22 66 21 84 L25 85 Q26 66 27 48Z', 0.45);
  });

  // ── leg ─────────────────────────────────────────────────────
  LectorArt.add('leg', function (c) {
    c.shadow(56, 91, 40, 4);
    var leg = 'M27 18 L63 18 Q64 34 69 44 Q74 52 66 58 Q62 66 61 74 L38 74 Q38 70 33 64 Q28 58 36 50 Q38 36 27 18Z';
    c.path(leg, SKIN, { mode: 'h' });
    var id = clip(c, leg);
    c.raw('<g clip-path="url(#' + id + ')">');
    c.ell(67, 50, 6, 8, '#F4CBA5', { flat: true, stroke: false, op: 0.6 });
    c.path('M28 58 Q34 70 38 80 L62 80 L58 64 Q44 70 28 58Z', '#B9794F', { flat: true, stroke: false, op: 0.1 });
    c.raw('</g>');
    c.line('M63 58 Q68 53 67 47', '#B9794F', 1, { op: 0.7 });
    c.line('M36 51 Q41 52 42 56', '#B9794F', 1, { op: 0.5 });
    // sock cuff and sneaker
    c.path('M36 64 H62 V74 H36Z', '#F4F1EA', { sw: 0.9 });
    c.line('M38 67 H60 M38 70 H60', '#C9C3B4', 0.7, { op: 0.8 });
    c.path('M25 91 Q22 80 28 73 L37 71 L62 71 Q64 78 72 80 Q96 78 98 88 L98 92 L25 92Z', '#F7F4EC', { mode: 'v' });
    c.path('M24.5 86 Q60 89 98 86 V92.5 H25Z', '#D3CBB8', { sw: 0.8, mode: 'v' });
    c.path('M25 91 Q22 80 28 73 L37 71 L40 84 Q34 90 25 87Z', '#DE5646', { sw: 0.9 });
    c.path('M37 71 L62 71 L64 76 L42 78Z', '#9A9384', { flat: true, stroke: false, op: 0.35 });
    c.line('M48 75 l7 -2 M52 78 l8 -2 M57 80.5 l8 -1.5 M62 82 l8 -1', '#8E959D', 1.5);
    c.path('M72 80 Q90 78 96 86 Q86 82 72 83Z', '#fff', { flat: true, stroke: false, op: 0.7 });
    c.shine('M70 81 Q82 79 92 83 Q80 82 69 83.5Z', 0.8);
    // shorts hem
    c.path('M20 3 H70 L72 12 Q70 20 65 24 L25 24 Q21 18 19 11Z', '#4B74B4', { mode: 'd' });
    c.path('M25 20 L65 20 L65 24.5 L25 24.5Z', '#3E629C', { sw: 0.9 });
    c.line('M26 21.8 H64', '#9DB9E0', 0.8, { dash: '2 2', op: 0.8 });
    c.shine('M30 28 Q29 44 33 52 Q33 38 33 28Z', 0.4);
    c.shine('M26 7 Q40 5 56 6 L56 8 Q40 7 26 9Z', 0.3);
  });

  // ── jam ─────────────────────────────────────────────────────
  LectorArt.add('jam', function (c) {
    c.shadow(40, 91, 32, 5);
    // wooden spoon leaning on the right
    c.g('rotate(8 86 70)', function () {
      c.line('M86 90 L86 46', '#7A4C26', 5);
      c.line('M86 90 L86 46', '#CFA06A', 3);
      c.ell(86, 36, 6.4, 9.5, '#C8955C', { rad: true, sw: 1 });
      c.ell(86, 36, 4.2, 6.8, '#B22236', { flat: true, stroke: false, op: 0.9 });
      c.shine('M83 30 Q84 27 87 27 Q85 30 84.5 34Z', 0.7);
    });
    // jar
    var jar = 'M16 52 H62 V84 Q62 91 55 91 H23 Q16 91 16 84Z';
    c.path(jar, '#DCEBF0', { mode: 'h', op: 0.85, stroke: '#7FA3B0' });
    c.path('M18 58 H60 V84 Q60 89 55 89 H23 Q18 89 18 84Z', '#B52035', { mode: 'h', sw: 0.9, stroke: '#7A1626' });
    c.ell(28, 76, 2.6, 2, '#E0566A', { flat: true, stroke: false, op: 0.7 });
    c.ell(48, 68, 2, 1.6, '#E0566A', { flat: true, stroke: false, op: 0.7 });
    c.shine('M20 60 Q19 74 21 86 L24 86 Q22 72 23 60Z', 0.6);
    // gingham cloth cover
    var gp = pattern(c, '<rect width="6" height="6" fill="#FFF"/><rect width="3" height="6" fill="#E85A52" opacity=".55"/><rect width="6" height="3" fill="#E85A52" opacity=".55"/>', 6, 6);
    c.path('M20 41 Q39 33 58 41 L68 55 Q64 60 60 55 Q56 62 50 56 Q44 63 39 57 Q33 63 28 56 Q23 61 18 56 Q12 60 10 55Z', gp, { flat: true, stroke: '#A33F38', sw: 1 });
    c.path('M20 41 Q39 33 58 41 L60 46 Q39 40 18 46Z', '#fff', { flat: true, stroke: false, op: 0.25 });
    c.line('M12 55 L22 41 M66 55 L56 41', '#A33F38', 0.6, { op: 0.4 });
    // string and bow
    c.line('M18 49 Q39 55 60 49', '#8A5A2E', 1.6);
    c.path('M39 52 Q32 46 30 52 Q33 56 39 53Z M39 52 Q46 46 48 52 Q45 56 39 53Z', '#B88B55', { sw: 0.7 });
    c.line('M39 53 Q37 58 35 61 M39 53 Q41 58 43 61', '#8A5A2E', 1.2);
  });

  // ── web ─────────────────────────────────────────────────────
  LectorArt.add('web', function (c) {
    var silver = '#8F9BA6';
    // twigs
    c.line('M6 94 L14 12', '#6B4423', 4.6);
    c.line('M6 94 L14 12', '#9A6B3C', 2.8);
    c.line('M12 36 L22 28 M10 62 L20 56 M13 18 L7 10', '#7A4F2B', 2);
    c.line('M96 94 L88 10', '#6B4423', 4.6);
    c.line('M96 94 L88 10', '#9A6B3C', 2.8);
    c.line('M90 32 L80 26 M92 62 L82 56', '#7A4F2B', 2);
    c.path('M22 28 Q30 20 34 28 Q28 34 22 28Z', '#6DB04F', { sw: 0.8 });
    c.path('M82 56 Q74 48 70 56 Q76 62 82 56Z', '#5CA244', { sw: 0.8 });
    // the web: spokes, then rings
    var hub = [46, 48];
    var ends = [[15, 16], [50, 13], [87, 14], [86, 46], [88, 82], [50, 84], [12, 80], [14, 46]];
    var sp = '';
    ends.forEach(function (e) { sp += 'M' + hub[0] + ' ' + hub[1] + ' L' + e[0] + ' ' + e[1]; });
    c.line(sp, silver, 0.9, { op: 0.95 });
    var dew = [];
    [0.2, 0.36, 0.52, 0.68, 0.84, 1].forEach(function (fr, ri) {
      var pts = ends.map(function (e) { return [hub[0] + (e[0] - hub[0]) * fr, hub[1] + (e[1] - hub[1]) * fr]; });
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var i = 1; i <= pts.length; i++) {
        var a = pts[i - 1], b = pts[i % pts.length];
        var mx = (a[0] + b[0]) / 2 + (hub[0] - (a[0] + b[0]) / 2) * 0.12, my = (a[1] + b[1]) / 2 + (hub[1] - (a[1] + b[1]) / 2) * 0.12;
        d += ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
      }
      c.line(d, silver, ri === 5 ? 1.1 : 0.8, { op: 0.9 });
      if (ri === 2 || ri === 4) pts.forEach(function (p, i) { if ((i + ri) % 3 === 0) dew.push([p[0], p[1], ri === 4 ? 1.9 : 1.6]); });
    });
    c.circ(hub[0], hub[1], 1.4, silver, { flat: true, stroke: false });
    dew.forEach(function (p) {
      c.circ(p[0], p[1], p[2], '#BFE6F7', { rad: true, sw: 0.5, stroke: '#5E97B5' });
      c.circ(p[0] - p[2] * 0.3, p[1] - p[2] * 0.3, p[2] * 0.3, '#fff', { flat: true, stroke: false });
    });
    // the spider on its thread
    c.line('M70 13 L70 60', '#6E7782', 0.9);
    [[-1, -1], [-1, 0], [-1, 1], [-1, 2], [1, -1], [1, 0], [1, 1], [1, 2]].forEach(function (l) {
      var y0 = 62 + l[1] * 1.8;
      c.line('M70 ' + y0 + ' L' + (70 + l[0] * 4) + ' ' + (y0 - 3.5) + ' L' + (70 + l[0] * 8.5) + ' ' + (y0 + (l[1] < 1 ? -1 : 4)), '#1E1E24', 1);
    });
    c.ell(70, 66, 4, 5.2, '#2A2A32', { rad: true, sw: 0.7 });
    c.circ(70, 59, 2.8, '#2A2A32', { rad: true, sw: 0.7 });
    c.circ(69, 58.4, 0.6, '#fff', { flat: true, stroke: false });
    c.circ(71.2, 58.4, 0.6, '#fff', { flat: true, stroke: false });
    c.shine('M68.5 63 Q68.5 66 69.5 68 Q68.3 66 68.2 63Z', 0.5);
  });

  // ── sock ────────────────────────────────────────────────────
  LectorArt.add('sock', function (c) {
    c.shadow(52, 88, 40, 4, 0.7);
    c.g('rotate(-10 50 50)', function () {
      var sock = 'M22 10 H46 L48 50 Q62 48 76 52 Q92 56 92 70 Q92 84 76 84 L30 84 Q14 84 15 68 Q16 60 22 54Z';
      c.path(sock, '#F1E6CC', { mode: 'd' });
      var id = clip(c, sock);
      c.raw('<g clip-path="url(#' + id + ')">');
      // leg stripes run across the leg
      for (var y = 18; y < 52; y += 12) c.rect(10, y, 44, 6, '#D84B45', { flat: true, stroke: false });
      // foot stripes run across the foot
      for (var x = 56; x < 92; x += 12) c.rect(x, 40, 6, 50, '#D84B45', { flat: true, stroke: false });
      // heel and toe patches
      c.path('M12 60 Q30 54 48 56 L50 90 H10Z', '#C23C3A', { flat: true, stroke: false });
      c.path('M78 40 Q100 52 96 96 L80 96 Q84 70 78 40Z', '#C23C3A', { flat: true, stroke: false });
      c.rect(10, 6, 50, 8, '#B83A38', { flat: true, stroke: false });
      c.line('M24 10 V14 M29 10 V14 M34 10 V14 M39 10 V14 M44 10 V14', '#7A2222', 0.8, { op: 0.6 });
      c.path('M10 70 Q50 92 100 70 V96 H10Z', '#6B3B1A', { flat: true, stroke: false, op: 0.14 });
      for (var i = 0; i < 9; i++) c.line('M' + (22 + i * 8) + ' 62 q3 4 6 0', '#9A2C2C', 0.6, { op: 0.4 });
      c.raw('</g>');
      c.raw('<path d="' + sock + '" fill="none" stroke="#7A3028" stroke-width="1.2" stroke-linejoin="round"/>');
      c.line('M22 14 H46', '#7A2222', 0.8, { op: 0.6 });
      c.shine('M24 20 L26 48 L28.5 48 L26.5 20Z', 0.5);
      c.shine('M62 54 Q76 54 86 60 Q74 58 62 58Z', 0.45);
    });
  });

  // ── thumb ───────────────────────────────────────────────────
  LectorArt.add('thumb', function (c) {
    c.shadow(46, 91, 28, 4);
    // sleeve cuff
    c.path('M18 80 H60 V88 Q60 92 55 92 H23 Q18 92 18 88Z', '#4B74B4', { mode: 'h' });
    c.line('M20 83 H58', '#9DB9E0', 0.8, { op: 0.7 });
    // back of the hand and the wrist
    c.path('M24 82 L22 54 Q22 44 34 44 L66 44 L66 82Z', SKIN, { mode: 'h' });
    // the thumb, pointing up
    c.path('M24 54 Q18 34 26 20 Q33 8 43 11 Q52 15 49 28 Q47 38 46 50Z', SKIN, { rad: true });
    c.path('M40 14 Q47 16 47 24 Q44 26 40 22Z', '#F7DCC3', { sw: 0.8 });
    c.line('M27 36 Q34 39 41 36', '#B9794F', 1, { op: 0.55 });
    // curled fingers, stacked
    [[40, 82, 45], [40, 82, 55], [41, 80, 65], [44, 74, 75]].forEach(function (f, i) {
      c.rect(f[0], f[2] - 0.5, f[1] - f[0], 10, SKIN, { r: 5, rad: true, sw: 1 });
    });
    c.line('M70 48 q4 1 6 3 M70 58 q4 1 6 3 M68 68 q4 1 6 3', '#B9794F', 0.8, { op: 0.45 });
    c.shine('M26 50 Q22 36 28 24 Q26 38 29 50Z', 0.45);
    c.shine('M46 48 H70 Q72 48 70 49.5 H46Z', 0.5);
    c.shine('M25 84 L24 56 L27 56 L27 84Z', 0.3);
  });
})();
