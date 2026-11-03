/* ================================================================
   CIVICS LAB — civics-lab-art.js
   Hand-built inline SVG art for Civics Lab. No images, no network.

   Buildings are simplified but drawn from the real facades:
   - Palacio de La Moneda (Santiago): long, low neoclassical facade,
     pale stucco, barred ground-floor windows, a projecting central
     body with paired pilasters, a balcony over the main door and the
     national shield on the attic, flag on top.
   - Congreso Nacional (Valparaíso, 1990): a broad podium with a huge
     inverted-U "gateway" tower on top, seen against the port's hills.
   - Palacio de los Tribunales (Santiago, seat of the Supreme Court):
     grey stone neoclassical palace with a tall central colonnade.
   The Constitutional Tribunal, Contraloría and Central Bank are drawn
   as emblems (what they do), not as their buildings.

   Every call makes its own gradient ids, so the same picture can sit
   in several (even hidden) screens at once.
   ================================================================ */

var CivicsArt = (function () {
  'use strict';

  var _n = 0;
  function uid(p) { _n++; return (p || 'cv') + _n; }

  // Chilean flag colours
  var CL_BLUE = '#0039A6', CL_RED = '#D52B1E';

  // ── Small helpers ────────────────────────────────────────────────
  function rect(x, y, w, h, fill, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
  }
  function star5(cx, cy, r, fill) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rr = i % 2 === 0 ? r : r * 0.382;
      pts.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"/>';
  }

  // A waving Chilean flag on a pole. (x,y) = top of the pole.
  function poleFlag(x, y, poleH, fw, u) {
    var fh = fw * 2 / 3;
    var wave = 'M0,0 C' + (fw * 0.3) + ',' + (-fh * 0.08) + ' ' + (fw * 0.6) + ',' + (fh * 0.08) + ' ' + fw + ',0 ' +
               'L' + fw + ',' + fh + ' C' + (fw * 0.6) + ',' + (fh * 1.08) + ' ' + (fw * 0.3) + ',' + (fh * 0.92) + ' 0,' + fh + 'Z';
    return '<g>' +
      '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + poleH) + '" stroke="#6b6b73" stroke-width="1.6"/>' +
      '<circle cx="' + x + '" cy="' + (y - 1) + '" r="1.8" fill="#c9a227"/>' +
      '<g transform="translate(' + (x + 0.8) + ',' + (y + 1) + ')">' +
        '<clipPath id="' + u + 'fc"><path d="' + wave + '"/></clipPath>' +
        '<g clip-path="url(#' + u + 'fc)">' +
          rect(0, -4, fw, fh / 2 + 4, '#ffffff') +
          rect(0, fh / 2, fw, fh / 2 + 4, CL_RED) +
          rect(0, -4, fh / 2, fh / 2 + 4, CL_BLUE) +
          star5(fh / 4, fh / 4, fh * 0.16, '#ffffff') +
          '<path d="' + wave + '" fill="url(#' + u + 'fs)" opacity=".55"/>' +
        '</g>' +
      '</g>' +
      '<linearGradient id="' + u + 'fs" x1="0" x2="1" y1="0" y2="0">' +
        '<stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset=".3" stop-color="#000" stop-opacity=".18"/>' +
        '<stop offset=".55" stop-color="#fff" stop-opacity=".25"/><stop offset=".8" stop-color="#000" stop-opacity=".15"/>' +
        '<stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
    '</g>';
  }

  function sky(u, w, h, top, bottom) {
    return '<linearGradient id="' + u + 'sky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient>' +
      rect(0, 0, w, h, 'url(#' + u + 'sky)');
  }

  // Distant Andes with snow, for the Santiago buildings.
  function andes(u, w, base) {
    return '<linearGradient id="' + u + 'mt" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#9fb3cc"/><stop offset="1" stop-color="#c9d6e6"/></linearGradient>' +
      '<path d="M0,' + base + ' L0,' + (base - 40) + ' L40,' + (base - 62) + ' L78,' + (base - 48) + ' L120,' + (base - 86) +
        ' L158,' + (base - 58) + ' L196,' + (base - 74) + ' L240,' + (base - 104) + ' L282,' + (base - 66) + ' L322,' + (base - 80) +
        ' L362,' + (base - 54) + ' L' + w + ',' + (base - 70) + ' L' + w + ',' + base + 'Z" fill="url(#' + u + 'mt)"/>' +
      '<path d="M108,' + (base - 76) + ' L120,' + (base - 86) + ' L132,' + (base - 76) + ' L126,' + (base - 72) + ' L120,' + (base - 78) + ' L114,' + (base - 71) + 'Z' +
        ' M226,' + (base - 92) + ' L240,' + (base - 104) + ' L256,' + (base - 90) + ' L248,' + (base - 86) + ' L240,' + (base - 94) + ' L232,' + (base - 85) + 'Z' +
        ' M312,' + (base - 73) + ' L322,' + (base - 80) + ' L333,' + (base - 72) + ' L326,' + (base - 69) + ' L321,' + (base - 74) + 'Z" fill="#f4f7fb"/>';
  }

  function wrap(vb, body, opts) {
    opts = opts || {};
    var label = opts.label ? ' role="img" aria-label="' + String(opts.label).replace(/"/g, '&quot;') + '"' : ' aria-hidden="true" focusable="false"';
    return '<svg class="' + (opts.cls || 'cv-art') + '" viewBox="' + vb + '" preserveAspectRatio="' + (opts.par || 'xMidYMid meet') + '"' + label + ' xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }

  // ── Palacio de La Moneda ─────────────────────────────────────────
  function moneda(opts) {
    var u = uid('mo');
    var W = 400, H = 230;
    var s = '';
    s += sky(u, W, H, '#bcd7f0', '#eef4fb');
    s += andes(u, W, 150);
    // Plaza paving
    s += '<linearGradient id="' + u + 'pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d3c7"/><stop offset="1" stop-color="#bdb5a6"/></linearGradient>';
    s += rect(0, 192, W, 38, 'url(#' + u + 'pv)');
    for (var p = 0; p < 9; p++) s += '<line x1="' + (p * 50 - 20) + '" y1="230" x2="' + (p * 50 + 10) + '" y2="192" stroke="#a79f90" stroke-width=".6" opacity=".6"/>';
    s += '<line x1="0" y1="205" x2="400" y2="205" stroke="#a79f90" stroke-width=".5" opacity=".5"/>';
    // Shadow under building
    s += '<ellipse cx="200" cy="194" rx="196" ry="5" fill="#000" opacity=".12"/>';

    // Facade gradients
    s += '<linearGradient id="' + u + 'wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f3ec"/><stop offset="1" stop-color="#e3ddd0"/></linearGradient>';
    s += '<linearGradient id="' + u + 'ctr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf9f4"/><stop offset="1" stop-color="#e9e3d6"/></linearGradient>';
    s += '<linearGradient id="' + u + 'win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4656"/><stop offset="1" stop-color="#5d6b7d"/></linearGradient>';
    s += '<linearGradient id="' + u + 'door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3a22"/><stop offset="1" stop-color="#3b2414"/></linearGradient>';

    // Main wings
    s += rect(8, 84, 384, 108, 'url(#' + u + 'wall)');
    // Rusticated base band
    s += rect(8, 176, 384, 16, '#d8d1c2');
    for (var r = 0; r < 24; r++) s += '<line x1="' + (8 + r * 16) + '" y1="176" x2="' + (8 + r * 16) + '" y2="192" stroke="#c4bcab" stroke-width=".7"/>';
    s += '<line x1="8" y1="184" x2="392" y2="184" stroke="#c4bcab" stroke-width=".7"/>';
    // Main cornice + parapet
    s += rect(4, 76, 392, 9, '#ece7dc');
    s += rect(4, 84, 392, 3, '#cfc7b6');
    s += rect(10, 68, 380, 8, '#f1ede4');
    // String course between floors
    s += rect(8, 128, 384, 4, '#e0d9ca');
    s += rect(8, 131, 384, 1.5, '#c9c1b0');

    // Windows — two rows on each wing, skipping the central body
    function winUpper(x) {
      return rect(x - 1.5, 97, 15, 2.5, '#d8d0bf') +           // hood
        rect(x, 100, 12, 22, 'url(#' + u + 'win)') +
        '<line x1="' + (x + 6) + '" y1="100" x2="' + (x + 6) + '" y2="122" stroke="#e8e2d6" stroke-width="1"/>' +
        '<line x1="' + x + '" y1="109" x2="' + (x + 12) + '" y2="109" stroke="#e8e2d6" stroke-width="1"/>' +
        rect(x - 1, 122, 14, 2, '#d3cbb9');
    }
    function winLower(x) {
      var g = rect(x, 140, 12, 30, 'url(#' + u + 'win)') + rect(x - 1.5, 137.5, 15, 2.5, '#d3cbb9');
      for (var b = 1; b < 5; b++) g += '<line x1="' + (x + b * 2.4) + '" y1="140" x2="' + (x + b * 2.4) + '" y2="170" stroke="#1d1f24" stroke-width=".9"/>';
      g += '<line x1="' + x + '" y1="150" x2="' + (x + 12) + '" y2="150" stroke="#1d1f24" stroke-width=".8"/>';
      g += '<line x1="' + x + '" y1="160" x2="' + (x + 12) + '" y2="160" stroke="#1d1f24" stroke-width=".8"/>';
      return g + rect(x - 1, 170, 14, 2, '#cfc6b3');
    }
    var xs = [22, 46, 70, 94, 118, 142, 246, 270, 294, 318, 342, 366];
    xs.forEach(function (x) { s += winUpper(x) + winLower(x); });
    // Corner quoins
    [8, 386].forEach(function (x) {
      for (var q = 0; q < 6; q++) s += rect(x, 88 + q * 15, 6, 13, '#ece6da', 'stroke="#d2cab9" stroke-width=".5"');
    });

    // Central projecting body
    s += '<rect x="160" y="70" width="80" height="122" fill="#000" opacity=".08" transform="translate(3,0)"/>';
    s += rect(160, 72, 80, 120, 'url(#' + u + 'ctr)');
    s += rect(156, 64, 88, 9, '#f2eee6');
    s += rect(156, 72, 88, 3, '#cfc7b6');
    // Attic with national shield
    s += rect(176, 46, 48, 19, '#f4f0e8');
    s += rect(172, 44, 56, 4, '#e3dccd');
    s += '<path d="M192,49 h16 v7 c0,5 -4,8 -8,9 c-4,-1 -8,-4 -8,-9z" fill="' + CL_BLUE + '"/>';
    s += '<path d="M192,56 h16 c0,5 -4,8 -8,9 c-4,-1 -8,-4 -8,-9z" fill="' + CL_RED + '"/>';
    s += star5(200, 53, 2.6, '#fff');
    s += '<path d="M192,49 h16 v7 c0,5 -4,8 -8,9 c-4,-1 -8,-4 -8,-9z" fill="none" stroke="#c9a227" stroke-width="1"/>';
    // Paired pilasters
    [164, 172, 220, 228].forEach(function (x) {
      s += rect(x, 78, 7, 98, '#f7f4ee', 'stroke="#d9d1c1" stroke-width=".6"');
      s += rect(x - 1, 76, 9, 3, '#e2dbcc');
      s += rect(x - 1, 174, 9, 3, '#d6cebd');
    });
    // Balcony window + balcony
    s += rect(190, 96, 20, 28, 'url(#' + u + 'win)');
    s += '<path d="M187,96 L200,88 L213,96Z" fill="#e6dfd1" stroke="#cfc6b3" stroke-width=".6"/>';
    s += rect(185, 123, 30, 3, '#cfc6b3');
    for (var bi = 0; bi < 8; bi++) s += '<line x1="' + (187 + bi * 3.7) + '" y1="126" x2="' + (187 + bi * 3.7) + '" y2="133" stroke="#2a2c30" stroke-width=".9"/>';
    s += '<line x1="186" y1="126.5" x2="214" y2="126.5" stroke="#2a2c30" stroke-width="1"/>';
    s += '<line x1="186" y1="133" x2="214" y2="133" stroke="#2a2c30" stroke-width="1.1"/>';
    // Main door
    s += rect(188, 142, 24, 34, 'url(#' + u + 'door)');
    s += '<line x1="200" y1="142" x2="200" y2="176" stroke="#2a180c" stroke-width="1"/>';
    s += rect(191, 146, 6, 12, 'none', 'stroke="#7a5233" stroke-width=".8"');
    s += rect(203, 146, 6, 12, 'none', 'stroke="#7a5233" stroke-width=".8"');
    s += rect(191, 161, 6, 12, 'none', 'stroke="#7a5233" stroke-width=".8"');
    s += rect(203, 161, 6, 12, 'none', 'stroke="#7a5233" stroke-width=".8"');
    s += rect(185, 138, 30, 4, '#ddd5c5');
    // Steps
    s += rect(182, 176, 36, 6, '#d6cfc0');
    s += rect(178, 182, 44, 6, '#cbc3b2');
    s += rect(174, 188, 52, 5, '#c1b8a6');

    // Flag on top
    s += poleFlag(200, 8, 38, 30, u);

    // Soft sun-light wash
    s += '<linearGradient id="' + u + 'lt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient>';
    s += rect(8, 64, 384, 128, 'url(#' + u + 'lt)');
    return wrap('0 0 400 230', s, opts);
  }

  // ── Congreso Nacional, Valparaíso ───────────────────────────────
  function congreso(opts) {
    var u = uid('co');
    var s = '';
    s += sky(u, 400, 230, '#a9cdee', '#eaf3fb');
    // Valparaíso hills with colourful houses
    s += '<path d="M0,150 C40,112 90,104 140,122 C190,98 250,92 300,116 C340,100 380,104 400,112 L400,170 L0,170Z" fill="#9db58a"/>';
    s += '<path d="M0,160 C60,134 120,132 170,146 C230,128 300,128 400,140 L400,175 L0,175Z" fill="#88a376"/>';
    var houses = ['#e9b44c', '#d96c5a', '#5b9bd5', '#f2e3c6', '#7fb069', '#e58f65', '#b07cc6', '#f4d35e', '#64b6ac'];
    var hx = [[14, 132], [30, 126], [48, 124], [66, 128], [304, 114], [322, 110], [340, 108], [358, 112], [376, 116], [92, 126], [270, 120], [286, 118]];
    hx.forEach(function (h, i) {
      var c = houses[i % houses.length];
      s += rect(h[0], h[1], 12, 9, c) + '<path d="M' + (h[0] - 1) + ',' + h[1] + ' L' + (h[0] + 6) + ',' + (h[1] - 4) + ' L' + (h[0] + 13) + ',' + h[1] + 'Z" fill="#8c5a44"/>' +
           rect(h[0] + 3, h[1] + 3, 2.5, 3, '#33404f') + rect(h[0] + 7, h[1] + 3, 2.5, 3, '#33404f');
    });
    // Street / forecourt
    s += '<linearGradient id="' + u + 'gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc8bb"/><stop offset="1" stop-color="#b5ad9d"/></linearGradient>';
    s += rect(0, 196, 400, 34, 'url(#' + u + 'gr)');
    s += '<ellipse cx="200" cy="198" rx="190" ry="5" fill="#000" opacity=".14"/>';

    // Concrete colours
    s += '<linearGradient id="' + u + 'cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7d5b8"/><stop offset="1" stop-color="#cdb692"/></linearGradient>';
    s += '<linearGradient id="' + u + 'cs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b79d77"/><stop offset="1" stop-color="#a08562"/></linearGradient>';
    s += '<linearGradient id="' + u + 'gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f6b86"/><stop offset=".5" stop-color="#7d9ab4"/><stop offset="1" stop-color="#3f566d"/></linearGradient>';

    // Podium (wide, low, with a sloped front)
    s += '<path d="M24,160 L376,160 L388,196 L12,196Z" fill="url(#' + u + 'cf)"/>';
    s += rect(24, 150, 352, 12, '#dcc8a8');
    s += rect(20, 147, 360, 4, '#efe2cb');
    s += rect(36, 165, 328, 14, 'url(#' + u + 'gl)');
    for (var m = 0; m < 28; m++) s += '<line x1="' + (36 + m * 12) + '" y1="165" x2="' + (36 + m * 12) + '" y2="179" stroke="#2f4152" stroke-width=".8"/>';
    s += rect(36, 179, 328, 3, '#b9a27e');
    // Entrance steps
    s += rect(160, 182, 80, 5, '#d8c7a8') + rect(152, 187, 96, 5, '#cdbb9a') + rect(144, 192, 112, 4, '#c2af8d');

    // Tower: a huge inverted U (two pillars + lintel), with a side face
    var L = 116, R = 284, T = 30, LIN = 72, PW = 58;
    // side faces (depth to the right)
    s += '<path d="M' + R + ',' + T + ' L' + (R + 12) + ',' + (T + 8) + ' L' + (R + 12) + ',150 L' + R + ',150Z" fill="url(#' + u + 'cs)"/>';
    s += '<path d="M' + (L + PW) + ',' + LIN + ' L' + (L + PW + 10) + ',' + (LIN + 6) + ' L' + (L + PW + 10) + ',150 L' + (L + PW) + ',150Z" fill="#a8906c"/>';
    // underside of lintel (shadow)
    s += '<path d="M' + (L + PW) + ',' + LIN + ' L' + (R - PW) + ',' + LIN + ' L' + (R - PW + 10) + ',' + (LIN + 6) + ' L' + (L + PW + 10) + ',' + (LIN + 6) + 'Z" fill="#8f7756"/>';
    // front face
    s += '<path d="M' + L + ',' + T + ' H' + R + ' V150 H' + (R - PW) + ' V' + LIN + ' H' + (L + PW) + ' V150 H' + L + 'Z" fill="url(#' + u + 'cf)"/>';
    // crown band
    s += rect(L - 3, T - 5, R - L + 6, 6, '#f0e3cc');
    s += '<path d="M' + (R + 3) + ',' + (T - 5) + ' L' + (R + 14) + ',' + (T + 3) + ' L' + (R + 14) + ',' + (T + 8) + ' L' + (R + 3) + ',' + (T + 1) + 'Z" fill="#cdb48e"/>';
    // window grid on the pillars and lintel
    function grid(x0, y0, cols, rows, cw, rh) {
      var g = '';
      for (var c = 0; c < cols; c++) for (var r2 = 0; r2 < rows; r2++)
        g += rect(x0 + c * cw, y0 + r2 * rh, cw - 4, rh - 4, 'url(#' + u + 'gl)', 'opacity=".92"');
      return g;
    }
    s += grid(L + 6, T + 8, 5, 10, 10, 11);
    s += grid(R - PW + 6, T + 8, 5, 10, 10, 11);
    s += grid(L + PW + 4, T + 8, 5, 3, 10, 11);
    // vertical fins
    [L + 29, R - 29].forEach(function (x) { s += rect(x - 1, T + 4, 2, 150 - T - 4, '#d9c5a3'); });
    // light / shade wash on the front
    s += '<linearGradient id="' + u + 'wsh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient>';
    s += '<path d="M' + L + ',' + T + ' H' + R + ' V150 H' + (R - PW) + ' V' + LIN + ' H' + (L + PW) + ' V150 H' + L + 'Z" fill="url(#' + u + 'wsh)"/>';

    // Flag in the forecourt
    s += poleFlag(70, 104, 92, 26, u);
    return wrap('0 0 400 230', s, opts);
  }

  // ── Palacio de los Tribunales, Santiago ─────────────────────────
  function tribunales(opts) {
    var u = uid('tr');
    var s = '';
    s += sky(u, 400, 230, '#c1d8ee', '#f0f5fa');
    s += andes(u, 400, 140);
    s += '<linearGradient id="' + u + 'pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d3cdc2"/><stop offset="1" stop-color="#b3ab9d"/></linearGradient>';
    s += rect(0, 196, 400, 34, 'url(#' + u + 'pv)');
    s += '<ellipse cx="200" cy="198" rx="194" ry="5" fill="#000" opacity=".14"/>';
    s += '<linearGradient id="' + u + 'st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8d5ce"/><stop offset="1" stop-color="#b9b5ac"/></linearGradient>';
    s += '<linearGradient id="' + u + 'win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4250"/><stop offset="1" stop-color="#5b6576"/></linearGradient>';
    s += '<linearGradient id="' + u + 'col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bdb9b0"/><stop offset=".35" stop-color="#ecebe6"/><stop offset="1" stop-color="#a9a59c"/></linearGradient>';

    // Wings — three storeys
    s += rect(10, 64, 380, 132, 'url(#' + u + 'st)');
    // horizontal stone courses
    for (var c = 0; c < 9; c++) s += '<line x1="10" y1="' + (150 + c * 5) + '" x2="390" y2="' + (150 + c * 5) + '" stroke="#a9a49a" stroke-width=".5" opacity=".8"/>';
    s += rect(6, 56, 388, 9, '#e3e0d9') + rect(6, 64, 388, 3, '#a8a398');
    // balustrade
    s += rect(10, 46, 380, 3, '#d9d6cf');
    for (var b = 0; b < 63; b++) s += rect(12 + b * 6, 49, 3, 7, '#d0ccc4');
    s += rect(10, 54, 380, 3, '#d4d0c8');
    s += rect(10, 108, 380, 4, '#cbc7be');
    s += rect(10, 146, 380, 3, '#c4c0b6');

    function upperWin(x, y) { return rect(x - 2, y - 4, 16, 3, '#c9c5bc') + rect(x, y, 12, 26, 'url(#' + u + 'win)') + '<line x1="' + (x + 6) + '" y1="' + y + '" x2="' + (x + 6) + '" y2="' + (y + 26) + '" stroke="#d6d3cc" stroke-width=".8"/>'; }
    function archWin(x) {
      return '<path d="M' + x + ',184 V162 a7,7 0 0 1 14,0 V184Z" fill="url(#' + u + 'win)"/>' +
             '<path d="M' + (x - 2) + ',162 a9,9 0 0 1 18,0" fill="none" stroke="#c4bfb4" stroke-width="2"/>';
    }
    [24, 50, 76, 102, 128, 260, 286, 312, 338, 364].forEach(function (x) {
      s += upperWin(x, 74) + upperWin(x, 116) + archWin(x - 1);
    });

    // Central portico
    s += '<rect x="136" y="40" width="128" height="156" fill="#000" opacity=".08" transform="translate(3,0)"/>';
    s += rect(136, 44, 128, 152, '#cfcbc3');
    // pediment-less attic with a relief panel
    s += rect(130, 22, 140, 22, '#e2dfd8');
    s += rect(126, 18, 148, 5, '#efede8');
    s += rect(150, 27, 100, 12, '#d3cfc6', 'stroke="#bdb8ae" stroke-width=".8"');
    for (var rl = 0; rl < 5; rl++) s += '<circle cx="' + (164 + rl * 18) + '" cy="33" r="3" fill="none" stroke="#b5b0a5" stroke-width="1"/>';
    s += rect(130, 44, 140, 6, '#e8e6e0') + rect(130, 50, 140, 3, '#a8a398');
    // colonnade: 6 columns, two storeys tall
    for (var k = 0; k < 6; k++) {
      var cx = 146 + k * 21.5;
      s += rect(cx - 1, 54, 12, 4, '#e7e4de');                    // capital
      s += '<path d="M' + (cx - 2) + ',54 q6,-4 14,0" fill="#ecebe6"/>';
      s += rect(cx, 58, 10, 112, 'url(#' + u + 'col)');
      for (var f = 1; f < 4; f++) s += '<line x1="' + (cx + f * 2.5) + '" y1="59" x2="' + (cx + f * 2.5) + '" y2="169" stroke="#a7a399" stroke-width=".4" opacity=".7"/>';
      s += rect(cx - 1.5, 170, 13, 4, '#d8d5ce');
    }
    // dark loggia behind the columns + door
    s += '<linearGradient id="' + u + 'lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e6a62" stop-opacity=".55"/><stop offset="1" stop-color="#8b867d" stop-opacity=".25"/></linearGradient>';
    s += rect(140, 58, 120, 112, 'url(#' + u + 'lg)', 'style="mix-blend-mode:multiply"');
    s += '<path d="M188,170 V140 a12,12 0 0 1 24,0 V170Z" fill="#3b2c20"/>';
    s += '<line x1="200" y1="132" x2="200" y2="170" stroke="#24190f" stroke-width="1"/>';
    // steps
    s += rect(132, 174, 136, 6, '#dedbd4') + rect(126, 180, 148, 6, '#d1cdc5') + rect(120, 186, 160, 6, '#c4c0b7') + rect(114, 192, 172, 5, '#b8b3a9');
    // flag
    s += poleFlag(200, 0, 20, 22, u);
    return wrap('0 0 400 230', s, opts);
  }

  // ── Emblems for bodies drawn by what they do ─────────────────────
  function _emblemBg(u, c1, c2) {
    return '<radialGradient id="' + u + 'bg" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>' +
      rect(0, 0, 400, 230, 'url(#' + u + 'bg)');
  }
  function _brass(u) {
    return '<linearGradient id="' + u + 'br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd8a"/><stop offset=".45" stop-color="#c99a2e"/><stop offset=".7" stop-color="#f1d27a"/><stop offset="1" stop-color="#9a6f18"/></linearGradient>';
  }

  // Constitutional Tribunal: scales standing over an open Constitution.
  function tc(opts) {
    var u = uid('tc');
    var s = _emblemBg(u, '#f4efe3', '#dcd2bd') + _brass(u);
    // table edge
    s += rect(0, 186, 400, 44, '#7a5230') + rect(0, 186, 400, 4, '#9b6b40');
    s += '<ellipse cx="200" cy="190" rx="130" ry="8" fill="#000" opacity=".18"/>';
    // open book
    s += '<path d="M200,150 C170,138 120,138 82,146 L82,190 C120,182 170,182 200,194Z" fill="#fbf7ee" stroke="#cdbf9f" stroke-width="1.5"/>';
    s += '<path d="M200,150 C230,138 280,138 318,146 L318,190 C280,182 230,182 200,194Z" fill="#f6f0e2" stroke="#cdbf9f" stroke-width="1.5"/>';
    s += '<path d="M200,150 V194" stroke="#b9a882" stroke-width="2"/>';
    for (var i = 0; i < 4; i++) {
      s += '<path d="M96,' + (156 + i * 8) + ' C130,' + (150 + i * 8) + ' 165,' + (150 + i * 8) + ' 188,' + (157 + i * 8) + '" stroke="#b7ab92" stroke-width="1.4" fill="none"/>';
      s += '<path d="M212,' + (157 + i * 8) + ' C235,' + (150 + i * 8) + ' 270,' + (150 + i * 8) + ' 304,' + (156 + i * 8) + '" stroke="#b7ab92" stroke-width="1.4" fill="none"/>';
    }
    s += '<text x="140" y="151" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="bold" fill="#8a6d3b" letter-spacing="1">CONSTITUCIÓN</text>';
    // scales
    s += rect(197, 44, 6, 102, 'url(#' + u + 'br)');
    s += '<path d="M180,148 h40 l-6,-8 h-28z" fill="url(#' + u + 'br)"/>';
    s += '<circle cx="200" cy="40" r="7" fill="url(#' + u + 'br)"/>';
    s += '<g class="cv-scale-beam">';
    s += rect(120, 52, 160, 5, 'url(#' + u + 'br)', 'rx="2.5"');
    [126, 274].forEach(function (x) {
      s += '<line x1="' + x + '" y1="56" x2="' + (x - 22) + '" y2="104" stroke="#9a7a2e" stroke-width="1.3"/>';
      s += '<line x1="' + x + '" y1="56" x2="' + (x + 22) + '" y2="104" stroke="#9a7a2e" stroke-width="1.3"/>';
      s += '<path d="M' + (x - 28) + ',104 h56 a28,12 0 0 1 -56,0z" fill="url(#' + u + 'br)"/>';
    });
    s += '</g>';
    return wrap('0 0 400 230', s, opts);
  }

  // Contraloría: magnifying glass checking a ledger of public spending.
  function contraloria(opts) {
    var u = uid('ct');
    var s = _emblemBg(u, '#eef3f8', '#cfdbe8') + _brass(u);
    s += rect(0, 192, 400, 38, '#6b4a2e') + rect(0, 192, 400, 4, '#8d633e');
    // ledger
    s += '<g transform="rotate(-6 190 130)">';
    s += '<rect x="90" y="56" width="200" height="140" rx="6" fill="#2f4a6b"/>';
    s += '<rect x="98" y="50" width="188" height="140" rx="3" fill="#fdfbf6" stroke="#d6cfbf"/>';
    s += '<text x="192" y="70" text-anchor="middle" font-family="Georgia, serif" font-size="10" font-weight="bold" fill="#2f4a6b">GASTO PÚBLICO</text>';
    for (var i = 0; i < 6; i++) {
      var y = 84 + i * 16;
      s += '<line x1="108" y1="' + (y + 6) + '" x2="276" y2="' + (y + 6) + '" stroke="#e3ddcf"/>';
      s += rect(112, y - 3, 70 - (i % 3) * 12, 5, '#b9b2a2', 'rx="2"');
      s += rect(222, y - 3, 30, 5, '#b9b2a2', 'rx="2"');
      s += '<path d="M260,' + (y - 1) + ' l4,4 l8,-8" stroke="#1f8a4c" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    s += '</g>';
    // magnifier
    s += '<g transform="translate(268,128)">';
    s += '<line x1="34" y1="34" x2="78" y2="80" stroke="#4a3120" stroke-width="13" stroke-linecap="round"/>';
    s += '<line x1="34" y1="34" x2="78" y2="80" stroke="#7a5236" stroke-width="7" stroke-linecap="round"/>';
    s += '<circle cx="0" cy="0" r="44" fill="#dff1ff" fill-opacity=".35" stroke="url(#' + u + 'br)" stroke-width="9"/>';
    s += '<path d="M-26,-18 a32,32 0 0 1 24,-14" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>';
    s += '</g>';
    return wrap('0 0 400 230', s, opts);
  }

  // Central Bank: stacks of peso coins and a rising/falling price line.
  function bancoCentral(opts) {
    var u = uid('bc');
    var s = _emblemBg(u, '#f2f6ef', '#d3e0cc') + _brass(u);
    s += '<linearGradient id="' + u + 'cn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a8781c"/><stop offset=".3" stop-color="#f3d57c"/><stop offset=".6" stop-color="#d8ad45"/><stop offset="1" stop-color="#8d6210"/></linearGradient>';
    s += rect(0, 192, 400, 38, '#5e4a33') + rect(0, 192, 400, 4, '#7d6345');
    // chart panel
    s += '<rect x="40" y="30" width="150" height="110" rx="10" fill="#fff" stroke="#c9d6c2" stroke-width="2"/>';
    for (var g = 0; g < 4; g++) s += '<line x1="52" y1="' + (50 + g * 22) + '" x2="178" y2="' + (50 + g * 22) + '" stroke="#e5ece1"/>';
    s += '<polyline points="54,112 76,98 96,104 118,84 140,90 160,70 176,74" fill="none" stroke="#1f7a4c" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>';
    s += '<text x="115" y="132" text-anchor="middle" font-family="Nunito, sans-serif" font-size="10" font-weight="800" fill="#55705a">INFLACIÓN</text>';
    // coin stacks
    function stack(x, n) {
      var out = '';
      for (var i = 0; i < n; i++) {
        var y = 186 - i * 9;
        out += '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="30" ry="9" fill="#7a540d"/>';
        out += rect(x - 30, y - 4, 60, 8, 'url(#' + u + 'cn)');
        out += '<ellipse cx="' + x + '" cy="' + (y - 4) + '" rx="30" ry="9" fill="#e9c560" stroke="#b58a26" stroke-width="1"/>';
      }
      return out;
    }
    s += stack(236, 5) + stack(306, 8);
    // big face coin
    s += '<circle cx="330" cy="70" r="40" fill="url(#' + u + 'br)" stroke="#8d6210" stroke-width="3"/>';
    s += '<circle cx="330" cy="70" r="31" fill="none" stroke="#9a6f18" stroke-width="1.5" stroke-dasharray="2 3"/>';
    s += '<text x="330" y="84" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="bold" fill="#7a540d">$</text>';
    return wrap('0 0 400 230', s, opts);
  }

  var BUILDINGS = {
    moneda: moneda, congreso: congreso, tribunales: tribunales,
    tribunal_constitucional: tc, contraloria: contraloria, banco_central: bancoCentral,
    // branch ids → their seat
    ejecutivo: moneda, legislativo: congreso, judicial: tribunales
  };

  function building(id, opts) {
    var f = BUILDINGS[id];
    return f ? f(opts) : '';
  }

  // ── Flags (simplified: no coats of arms) ─────────────────────────
  function flag(code, opts) {
    var u = uid('fl');
    var s = '<clipPath id="' + u + 'c"><rect width="60" height="40" rx="3"/></clipPath><g clip-path="url(#' + u + 'c)">';
    if (code === 'cl') {
      s += rect(0, 0, 60, 20, '#fff') + rect(0, 20, 60, 20, CL_RED) + rect(0, 0, 20, 20, CL_BLUE) + star5(10, 10, 4.2, '#fff');
    } else if (code === 'us') {
      for (var i = 0; i < 13; i++) s += rect(0, i * 40 / 13, 60, 40 / 13 + 0.05, i % 2 ? '#fff' : '#B22234');
      s += rect(0, 0, 24, 40 * 7 / 13, '#3C3B6E');
      for (var r = 0; r < 5; r++) for (var c = 0; c < 6; c++) s += '<circle cx="' + (2.4 + c * 3.9) + '" cy="' + (2.3 + r * 4.6) + '" r=".8" fill="#fff"/>';
    } else if (code === 'gb') {
      s += rect(0, 0, 60, 40, '#012169');
      s += '<path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/>';
      s += '<path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" stroke-width="2.6"/>';
      s += '<path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="12"/>';
      s += '<path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="7"/>';
    } else if (code === 'es') {
      s += rect(0, 0, 60, 10, '#AA151B') + rect(0, 10, 60, 20, '#F1BF00') + rect(0, 30, 60, 10, '#AA151B');
    } else if (code === 'fr') {
      s += rect(0, 0, 20, 40, '#0055A4') + rect(20, 0, 20, 40, '#fff') + rect(40, 0, 20, 40, '#EF4135');
    } else if (code === 'de') {
      s += rect(0, 0, 60, 13.4, '#000') + rect(0, 13.3, 60, 13.4, '#DD0000') + rect(0, 26.6, 60, 13.4, '#FFCE00');
    }
    s += '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>';
    s += rect(0, 0, 60, 40, 'url(#' + u + 'g)');
    s += '</g><rect x=".5" y=".5" width="59" height="39" rx="3" fill="none" stroke="#000" stroke-opacity=".15"/>';
    return wrap('0 0 60 40', s, Object.assign({ cls: 'cv-flag' }, opts || {}));
  }

  // ── Pictograms for the law-making steps (64×64) ──────────────────
  function lawIcon(id, opts) {
    var u = uid('li');
    var s = _brass(u);
    var paper = '#fbf7ec', ink = '#3a4658', edge = '#cdbf9f';
    switch (id) {
      case 'iniciativa':   // a bill and a quill
        s += '<rect x="14" y="10" width="32" height="42" rx="3" fill="' + paper + '" stroke="' + edge + '" stroke-width="1.5"/>';
        for (var i = 0; i < 5; i++) s += rect(19, 18 + i * 6, 22 - (i === 4 ? 10 : 0), 2, '#c3b89f', 'rx="1"');
        s += '<path d="M54,6 C42,12 34,26 30,40 L33,41 C38,28 46,16 56,9Z" fill="#e8eef6" stroke="#8aa0b8" stroke-width="1"/>';
        s += '<line x1="30" y1="40" x2="27" y2="47" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>';
        break;
      case 'origen':       // a chamber (hemicycle) voting
      case 'revisora':
        s += '<path d="M6,50 a26,26 0 0 1 52,0Z" fill="' + (id === 'origen' ? '#2f6fb5' : '#b5452f') + '"/>';
        s += '<path d="M16,50 a16,16 0 0 1 32,0Z" fill="#f1ece0"/>';
        for (var a = 0; a < 9; a++) {
          var ang = Math.PI + a * Math.PI / 8;
          s += '<circle cx="' + (32 + 21 * Math.cos(ang)).toFixed(1) + '" cy="' + (50 + 21 * Math.sin(ang)).toFixed(1) + '" r="2.4" fill="#fff"/>';
        }
        s += rect(26, 40, 12, 10, '#7b5a3a', 'rx="1.5"');
        s += rect(4, 50, 56, 5, '#8b7b62', 'rx="2"');
        if (id === 'revisora') s += '<path d="M42,10 a12,12 0 1 1 -20,0" fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/><path d="M42,4 l1,7 l-7,0" fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
        break;
      case 'comision_mixta':   // two groups at one table
        s += rect(10, 34, 44, 6, '#8b5e34', 'rx="2"') + rect(14, 40, 3, 12, '#6b4526') + rect(47, 40, 3, 12, '#6b4526');
        [14, 24].forEach(function (x) { s += '<circle cx="' + x + '" cy="20" r="5" fill="#2f6fb5"/><path d="M' + (x - 6) + ',34 a6,8 0 0 1 12,0Z" fill="#2f6fb5"/>'; });
        [40, 50].forEach(function (x) { s += '<circle cx="' + x + '" cy="20" r="5" fill="#b5452f"/><path d="M' + (x - 6) + ',34 a6,8 0 0 1 12,0Z" fill="#b5452f"/>'; });
        s += '<rect x="26" y="28" width="12" height="7" rx="1" fill="' + paper + '" stroke="' + edge + '"/>';
        break;
      case 'presidente':   // signing pen over a paper with a sash colour band
        s += '<rect x="10" y="12" width="36" height="44" rx="3" fill="' + paper + '" stroke="' + edge + '" stroke-width="1.5"/>';
        s += rect(10, 12, 36, 6, CL_BLUE, 'rx="2"') + rect(10, 18, 36, 3, '#fff') + rect(10, 21, 36, 3, CL_RED);
        for (var j = 0; j < 3; j++) s += rect(15, 30 + j * 6, 26, 2, '#c3b89f', 'rx="1"');
        s += '<path d="M16,50 c4,-6 8,4 12,-2 s6,2 9,-1" fill="none" stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round"/>';
        s += '<g transform="rotate(40 48 30)"><rect x="44" y="6" width="8" height="34" rx="3" fill="#1f2937"/><rect x="44" y="12" width="8" height="3" fill="url(#' + u + 'br)"/><path d="M44,40 h8 l-4,9z" fill="url(#' + u + 'br)"/></g>';
        break;
      case 'tc_revision':  // scales
        s += rect(30, 12, 4, 38, 'url(#' + u + 'br)') + '<path d="M20,52 h24 l-4,-5 h-16z" fill="url(#' + u + 'br)"/>';
        s += rect(10, 16, 44, 3, 'url(#' + u + 'br)', 'rx="1.5"');
        [13, 51].forEach(function (x) {
          s += '<path d="M' + x + ',18 L' + (x - 8) + ',36 M' + x + ',18 L' + (x + 8) + ',36" stroke="#9a7a2e" stroke-width="1"/>';
          s += '<path d="M' + (x - 10) + ',36 h20 a10,5 0 0 1 -20,0z" fill="url(#' + u + 'br)"/>';
        });
        break;
      case 'publicacion':  // the Diario Oficial
        s += '<rect x="8" y="12" width="48" height="40" rx="2" fill="' + paper + '" stroke="' + edge + '" stroke-width="1.5"/>';
        s += '<text x="32" y="23" text-anchor="middle" font-family="Georgia, serif" font-size="7.4" font-weight="bold" fill="' + ink + '">DIARIO OFICIAL</text>';
        s += '<line x1="12" y1="26" x2="52" y2="26" stroke="' + ink + '" stroke-width="1"/>';
        s += rect(12, 30, 18, 16, '#d9d0bd');
        for (var k = 0; k < 4; k++) s += rect(33, 30 + k * 4.4, 19, 2, '#c3b89f', 'rx="1"');
        s += rect(12, 48, 40, 1.6, '#c3b89f');
        break;
      case 'ley':          // finish: a sealed law
        s += '<rect x="12" y="8" width="40" height="48" rx="3" fill="' + paper + '" stroke="' + edge + '" stroke-width="1.5"/>';
        s += '<text x="32" y="22" text-anchor="middle" font-family="Georgia, serif" font-size="10" font-weight="bold" fill="' + ink + '">LEY</text>';
        for (var m = 0; m < 3; m++) s += rect(18, 28 + m * 5, 28, 2, '#c3b89f', 'rx="1"');
        s += '<circle cx="40" cy="47" r="8" fill="#b91c1c"/><circle cx="40" cy="47" r="5" fill="none" stroke="#f3b3b3" stroke-width="1"/>';
        s += '<path d="M35,53 l-3,9 l5,-3 l3,4 l1,-9 M45,53 l3,9 l-5,-3 l-3,4" fill="#b91c1c"/>';
        break;
    }
    return wrap('0 0 64 64', s, Object.assign({ cls: 'cv-picto' }, opts || {}));
  }

  // ── Home-tile icons (64×64) ──────────────────────────────────────
  function tileIcon(name) {
    var u = uid('ti');
    var s = _brass(u);
    if (name === 'branches') {       // three columns under one roof
      s += '<path d="M6,22 L32,8 L58,22Z" fill="#e6dfcf" stroke="#bfb39a" stroke-width="1.5"/>';
      s += rect(8, 22, 48, 5, '#d8cfbb');
      var cols = ['#2f6fb5', '#b5452f', '#8a6d3b'];
      cols.forEach(function (c, i) { s += rect(13 + i * 15, 28, 8, 22, c, 'rx="1.5"') + rect(11 + i * 15, 27, 12, 3, '#efe9dc'); });
      s += rect(6, 50, 52, 5, '#cfc6b2') + rect(4, 55, 56, 4, '#bdb39c');
    } else if (name === 'law') { return lawIcon('iniciativa');
    } else if (name === 'compare') {
      return '<span class="cv-tile-flags">' + flag('cl') + flag('us') + flag('gb') + '</span>';
    } else if (name === 'sort') {    // three bins with cards
      ['#2f6fb5', '#b5452f', '#8a6d3b'].forEach(function (c, i) {
        s += '<path d="M' + (4 + i * 20) + ',34 h16 l-2,22 h-12z" fill="' + c + '"/>';
        s += rect(6 + i * 20, 16 + (i % 2) * 6, 12, 15, '#fbf7ec', 'rx="1.5" stroke="#cdbf9f" transform="rotate(' + (i * 8 - 8) + ' ' + (12 + i * 20) + ' 24)"');
      });
    } else if (name === 'order') {   // a numbered path
      s += '<path d="M8,52 C20,52 18,32 32,32 C46,32 44,12 56,12" fill="none" stroke="#d8cfbb" stroke-width="8" stroke-linecap="round"/>';
      [[8, 52, '1'], [32, 32, '2'], [56, 12, '3']].forEach(function (p) {
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7.5" fill="url(#' + u + 'br)" stroke="#8d6210"/>' +
             '<text x="' + p[0] + '" y="' + (p[1] + 3.5) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="10" fill="#4a3208">' + p[2] + '</text>';
      });
    }
    return wrap('0 0 64 64', s, { cls: 'cv-picto' });
  }

  // ── Stars for the results screen ─────────────────────────────────
  function bigStar(filled) {
    var u = uid('bs');
    var s = '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (filled ? '#fde68a' : '#e5e7eb') + '"/><stop offset="1" stop-color="' + (filled ? '#d97706' : '#c4c7cf') + '"/></linearGradient>';
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 === 0 ? 28 : 12;
      pts.push((32 + rr * Math.cos(a)).toFixed(1) + ',' + (34 + rr * Math.sin(a)).toFixed(1));
    }
    s += '<polygon points="' + pts.join(' ') + '" fill="url(#' + u + 'g)" stroke="' + (filled ? '#b45309' : '#aeb2bb') + '" stroke-width="2" stroke-linejoin="round"/>';
    if (filled) s += '<path d="M22,26 l8,-12" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>';
    return wrap('0 0 64 64', s, { cls: 'cv-bigstar' + (filled ? ' on' : '') });
  }

  return {
    building: building, flag: flag, lawIcon: lawIcon, tileIcon: tileIcon, bigStar: bigStar,
    star5: star5, uid: uid
  };
})();
