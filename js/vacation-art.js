/* ================================================================
   VACATION ART — vacation-art.js
   Hand-drawn SVG scenes for the Vacation Planner. A trip (family data,
   synced — never in this repo) names a scene with an `art` key on a
   place, stay, food, flight, "I spy" item or itinerary day, and the
   planner draws it here. Offline, no image hosts. Unknown keys draw
   nothing, so trips stay valid if a scene is renamed.

   VacArt.svg(name, opts) -> '<svg …>' string ('' if unknown)
   VacArt.has(name)       -> bool
   VacArt.names()         -> [names]
   ================================================================ */
var VacArt = (function () {
  'use strict';

  var _n = 0;

  // ── Shared pieces ──
  function sky(id, top, bot) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bot + '"/></linearGradient>';
  }
  function cloud(x, y, s, o) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff" opacity="' + (o || 0.9) + '">' +
      '<ellipse cx="0" cy="0" rx="22" ry="9"/><ellipse cx="-10" cy="-6" rx="11" ry="9"/>' +
      '<ellipse cx="8" cy="-8" rx="13" ry="11"/></g>';
  }
  function sun(x, y, r, c) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.8) + '" fill="' + c + '" opacity=".18"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>';
  }
  // A live oak: wide crown, twisted trunk, optional Spanish moss.
  function oak(x, y, s, moss) {
    var m = '';
    if (moss) {
      [-30, -16, -2, 14, 28].forEach(function (dx, i) {
        m += '<path d="M' + dx + ' ' + (-34 + (i % 2) * 4) + ' q2 10 -1 ' + (14 + i * 2) + ' q3 -6 2 -' + (12 + i) + '" ' +
          'stroke="#9aa58a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>';
      });
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-5 0 q-3 -18 -14 -30 M5 0 q3 -16 16 -28 M0 0 q-1 -20 2 -36" stroke="#5b4330" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="-44" rx="46" ry="20" fill="#3f6b3a"/>' +
      '<ellipse cx="-22" cy="-48" rx="24" ry="14" fill="#4d7f45"/>' +
      '<ellipse cx="20" cy="-50" rx="26" ry="15" fill="#4d7f45"/>' +
      '<ellipse cx="2" cy="-58" rx="22" ry="12" fill="#5c9152"/>' +
      m + '</g>';
  }
  function notes(x, y, c) {
    return '<g fill="' + c + '">' +
      '<path d="M' + x + ' ' + y + ' v-16 l9 -3 v16" stroke="' + c + '" stroke-width="2" fill="none"/>' +
      '<ellipse cx="' + (x - 3) + '" cy="' + y + '" rx="4" ry="3"/>' +
      '<ellipse cx="' + (x + 6) + '" cy="' + (y - 3) + '" rx="4" ry="3"/>' +
      '<path d="M' + (x + 22) + ' ' + (y - 10) + ' v-14" stroke="' + c + '" stroke-width="2"/>' +
      '<ellipse cx="' + (x + 19) + '" cy="' + (y - 10) + '" rx="4" ry="3"/></g>';
  }
  function water(id, y, c1, c2) {
    return '<rect x="0" y="' + y + '" width="320" height="' + (200 - y) + '" fill="url(#' + id + ')"/>' +
      '<g stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".35">' +
      '<path d="M20 ' + (y + 14) + ' h26 M90 ' + (y + 26) + ' h34 M190 ' + (y + 12) + ' h22 M250 ' + (y + 30) + ' h30 M60 ' + (y + 40) + ' h20"/></g>';
  }

  // ── Scenes (viewBox 320×200) ──
  var S = {};

  // Skyline at sunset across the river, with a paddle steamboat.
  S.nola = function (u) {
    return '<defs>' + sky(u + 's', '#ff9a62', '#ffd9a0') + sky(u + 'w', '#4f86b5', '#2c5d8a') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      sun(250, 70, 20, '#fff2b3') + cloud(70, 40, 1, .7) + cloud(180, 28, .8, .6) +
      // skyline
      '<g fill="#7a4e6b" opacity=".75">' +
        '<rect x="12" y="78" width="22" height="52"/><rect x="38" y="62" width="18" height="68"/>' +
        '<rect x="60" y="84" width="26" height="46"/><rect x="214" y="70" width="20" height="60"/>' +
        '<rect x="238" y="88" width="30" height="42"/><rect x="272" y="74" width="16" height="56"/>' +
        '<rect x="292" y="92" width="24" height="38"/></g>' +
      // cathedral, three spires
      '<g fill="#f6efe6" stroke="#b79c86" stroke-width="1">' +
        '<rect x="118" y="88" width="76" height="42"/>' +
        '<rect x="148" y="66" width="16" height="30"/><path d="M146 66 L156 34 L166 66 Z"/>' +
        '<rect x="122" y="80" width="12" height="20"/><path d="M120 80 L128 58 L136 80 Z"/>' +
        '<rect x="178" y="80" width="12" height="20"/><path d="M176 80 L184 58 L192 80 Z"/>' +
        '<path d="M150 130 v-16 a6 6 0 0 1 12 0 v16" fill="#9a7b66"/></g>' +
      water(u + 'w', 128) +
      // steamboat
      '<g transform="translate(40 138)">' +
        '<path d="M0 22 h120 l-10 12 h-100 Z" fill="#fdfaf3" stroke="#8b2c2c" stroke-width="1.5"/>' +
        '<rect x="12" y="8" width="90" height="14" fill="#fff" stroke="#8b2c2c" stroke-width="1"/>' +
        '<rect x="24" y="-4" width="64" height="12" fill="#fff" stroke="#8b2c2c" stroke-width="1"/>' +
        '<g fill="#8b2c2c">' + [18, 30, 42, 54, 66, 78, 90].map(function (x) { return '<rect x="' + x + '" y="12" width="5" height="6"/>'; }).join('') + '</g>' +
        '<rect x="34" y="-22" width="6" height="18" fill="#2a2a2a"/><rect x="72" y="-22" width="6" height="18" fill="#2a2a2a"/>' +
        '<circle cx="120" cy="22" r="14" fill="#c0392b"/><circle cx="120" cy="22" r="9" fill="none" stroke="#fff" stroke-width="2"/>' +
        '<path d="M120 8 v28 M106 22 h28" stroke="#fff" stroke-width="1.5"/></g>';
  };

  S.cathedral = function (u) {
    return '<defs>' + sky(u + 's', '#8fd0ff', '#e3f4ff') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + cloud(60, 34, 1) + cloud(260, 46, .8) +
      '<g fill="#fbf7f0" stroke="#bfa58f" stroke-width="1.2">' +
        '<rect x="96" y="80" width="128" height="80"/>' +
        '<rect x="146" y="50" width="28" height="50"/><path d="M143 52 L160 6 L177 52 Z" fill="#3b3b46"/>' +
        '<rect x="100" y="66" width="22" height="40"/><path d="M98 68 L111 32 L124 68 Z" fill="#3b3b46"/>' +
        '<rect x="198" y="66" width="22" height="40"/><path d="M196 68 L209 32 L222 68 Z" fill="#3b3b46"/></g>' +
      '<circle cx="160" cy="76" r="7" fill="#fff" stroke="#3b3b46" stroke-width="1.5"/>' +
      '<path d="M160 72 v4 h3" stroke="#3b3b46" stroke-width="1.2" fill="none"/>' +
      '<path d="M160 0 v8 M156 4 h8" stroke="#c8a24a" stroke-width="2"/>' +
      '<g fill="#7a5c48"><path d="M150 160 v-26 a10 10 0 0 1 20 0 v26"/><rect x="110" y="112" width="12" height="20" rx="6"/><rect x="198" y="112" width="12" height="20" rx="6"/></g>' +
      '<rect x="0" y="160" width="320" height="40" fill="#8bc47a"/>' +
      '<path d="M0 166 H320" stroke="#2b2b2b" stroke-width="2"/>' +
      '<g stroke="#2b2b2b" stroke-width="1.5">' + Array.apply(null, Array(32)).map(function (_, i) { return '<path d="M' + (i * 10 + 5) + ' 166 v20"/>'; }).join('') + '</g>' +
      '<path d="M0 186 H320" stroke="#2b2b2b" stroke-width="2"/>' +
      // statue on horse
      '<g transform="translate(40 150)" fill="#4a5a52"><rect x="-8" y="0" width="16" height="16"/>' +
        '<path d="M-14 0 q2 -14 14 -14 q6 -8 10 -4 l-4 6 q2 6 -2 12 Z"/><circle cx="0" cy="-22" r="4"/></g>' +
      '<g transform="translate(285 150)">' +
        '<path d="M0 30 q-2 -20 2 -44" stroke="#7d6a4a" stroke-width="5" fill="none"/>' +
        '<path d="M2 -14 q-20 -4 -26 8 M2 -14 q20 -6 26 6 M2 -14 q-10 -16 -22 -14 M2 -14 q12 -18 22 -12" stroke="#3f8a4a" stroke-width="6" fill="none" stroke-linecap="round"/></g>';
  };

  S.beignets = function (u) {
    function beignet(x, y, r) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')">' +
        '<path d="M-26 -16 q26 -10 52 0 q8 16 0 32 q-26 10 -52 0 q-8 -16 0 -32 Z" fill="#d99a4e"/>' +
        '<path d="M-24 -14 q24 -9 48 0 q6 12 0 22 q-24 8 -48 0 q-6 -11 0 -22 Z" fill="#f7f1e8"/>' +
        '<g fill="#fff">' + [[-14, -4], [-4, 2], [8, -6], [14, 4], [-10, 8], [2, -10]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4"/>'; }).join('') + '</g></g>';
    }
    return '<defs><radialGradient id="' + u + 't" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#3f8f5a"/><stop offset="1" stop-color="#21573a"/></radialGradient></defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 't)"/>' +
      '<g stroke="#fff" stroke-width="10" opacity=".1"><path d="M0 40 H320 M0 100 H320 M0 160 H320"/></g>' +
      '<ellipse cx="140" cy="118" rx="110" ry="58" fill="#000" opacity=".2"/>' +
      '<ellipse cx="136" cy="110" rx="108" ry="56" fill="#fff"/><ellipse cx="136" cy="110" rx="88" ry="42" fill="#f1f1f1"/>' +
      beignet(100, 104, -12) + beignet(162, 94, 10) + beignet(138, 132, 2) +
      '<g fill="#fff" opacity=".85">' + Array.apply(null, Array(40)).map(function (_, i) { return '<circle cx="' + (60 + (i * 37) % 170) + '" cy="' + (70 + (i * 23) % 80) + '" r="1.3"/>'; }).join('') + '</g>' +
      // café au lait
      '<g transform="translate(262 112)"><ellipse cx="0" cy="34" rx="40" ry="10" fill="#fff"/>' +
        '<path d="M-26 -10 h52 l-6 44 h-40 Z" fill="#fff" stroke="#ddd"/><ellipse cx="0" cy="-10" rx="26" ry="7" fill="#c89766"/>' +
        '<path d="M26 0 q16 0 12 14 q-3 8 -14 8" stroke="#fff" stroke-width="5" fill="none"/>' +
        '<path d="M-8 -22 q-6 -10 2 -18 M6 -22 q-6 -10 2 -18" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></g>';
  };

  S.streetcar = function (u) {
    return '<defs>' + sky(u + 's', '#9ad5ff', '#e8f6ff') +
      '<linearGradient id="' + u + 'c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8f4f"/><stop offset="1" stop-color="#22603a"/></linearGradient></defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      oak(30, 150, 1.1, true) + oak(300, 150, 1.2, true) +
      '<rect x="0" y="150" width="320" height="50" fill="#9fca86"/>' +
      '<rect x="0" y="162" width="320" height="18" fill="#b9a891"/>' +
      '<g stroke="#6b6b6b" stroke-width="2"><path d="M0 166 H320 M0 176 H320"/></g>' +
      '<path d="M0 14 H320" stroke="#333" stroke-width="1"/>' +
      '<path d="M170 14 L160 54" stroke="#333" stroke-width="2"/>' +
      '<g transform="translate(70 54)">' +
        '<rect x="0" y="6" width="180" height="96" rx="10" fill="url(#' + u + 'c)"/>' +
        '<path d="M6 6 q84 -14 168 0" fill="#2c6b3d" stroke="#1d4a2a" stroke-width="2"/>' +
        '<rect x="0" y="78" width="180" height="8" fill="#a32a2a"/>' +
        '<rect x="0" y="96" width="180" height="6" fill="#222"/>' +
        '<g fill="#fff7d6" stroke="#a37b2c" stroke-width="2">' +
          [12, 40, 68, 96, 124, 152].map(function (x) { return '<rect x="' + x + '" y="22" width="20" height="30" rx="4"/>'; }).join('') + '</g>' +
        '<rect x="74" y="10" width="34" height="10" rx="2" fill="#111"/><text x="91" y="18" font-size="7" font-weight="800" text-anchor="middle" fill="#ffd34d" font-family="sans-serif">ST CHARLES</text>' +
        '<circle cx="8" cy="64" r="4" fill="#ffe680"/><circle cx="172" cy="64" r="4" fill="#ffe680"/>' +
        '<g fill="#222"><circle cx="34" cy="108" r="9"/><circle cx="56" cy="108" r="9"/><circle cx="124" cy="108" r="9"/><circle cx="146" cy="108" r="9"/></g></g>';
  };

  S.ferry = function (u) {
    return '<defs>' + sky(u + 's', '#7ec3f2', '#dff1ff') + sky(u + 'w', '#5e8fb3', '#355f80') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + cloud(90, 30, 1) + cloud(240, 40, .9) +
      '<g fill="#8aa0b8">' +
        '<rect x="150" y="58" width="22" height="62"/><rect x="176" y="40" width="18" height="80"/>' +
        '<rect x="198" y="66" width="28" height="54"/><rect x="230" y="50" width="20" height="70"/>' +
        '<rect x="254" y="76" width="34" height="44"/><rect x="292" y="62" width="20" height="58"/>' +
        '<rect x="110" y="80" width="36" height="40"/></g>' +
      '<g fill="#b9c8d8" opacity=".9"><rect x="180" y="46" width="4" height="70"/><rect x="236" y="56" width="3" height="60"/></g>' +
      water(u + 'w', 118) +
      '<g transform="translate(36 120)">' +
        '<path d="M0 24 h150 l-14 18 h-122 Z" fill="#fff" stroke="#2f4c66" stroke-width="2"/>' +
        '<rect x="20" y="4" width="104" height="20" fill="#f3f6f9" stroke="#2f4c66" stroke-width="1.5"/>' +
        '<g fill="#3f7fb3">' + [26, 44, 62, 80, 98].map(function (x) { return '<rect x="' + x + '" y="9" width="12" height="9" rx="2"/>'; }).join('') + '</g>' +
        '<rect x="54" y="-10" width="36" height="14" fill="#fff" stroke="#2f4c66" stroke-width="1.5"/>' +
        '<rect x="66" y="-22" width="6" height="12" fill="#d64545"/>' +
        '<path d="M0 34 q-20 6 -36 2" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/></g>' +
      '<g transform="translate(268 150)"><circle r="7" fill="#fff"/><path d="M-4 -2 q4 -8 8 0" stroke="#e8a33d" stroke-width="3" fill="none"/></g>';
  };

  S.museum = function (u) {
    function plane(x, y, s, c) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + c + '">' +
        '<path d="M-60 0 q10 -6 60 -6 q50 0 62 4 q2 4 -2 6 q-60 4 -120 2 Z"/>' +
        '<path d="M-10 -2 l-30 -32 h12 l40 30 Z"/><path d="M-10 2 l-30 30 h12 l40 -28 Z"/>' +
        '<path d="M-56 -2 l-10 -16 h8 l12 14 Z"/>' +
        '<circle cx="-24" cy="-24" r="2" fill="#555"/><circle cx="-24" cy="24" r="2" fill="#555"/>' +
        '<path d="M58 -3 h6 v6 h-6 Z" fill="#ccc"/></g>';
    }
    return '<defs>' + sky(u + 's', '#dde7ef', '#b8c6d3') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      '<g stroke="#93a3b2" stroke-width="2">' + [20, 70, 120, 170, 220, 270].map(function (x) { return '<path d="M' + x + ' 0 L' + (x + 20) + ' 60"/>'; }).join('') +
        '<path d="M0 60 H320"/></g>' +
      '<g fill="#cfe2f3" opacity=".7">' + [10, 60, 110, 160, 210, 260].map(function (x) { return '<rect x="' + (x + 4) + '" y="4" width="36" height="50"/>'; }).join('') + '</g>' +
      '<g stroke="#666" stroke-width="1"><path d="M120 60 v24 M200 60 v28 M80 60 v70 M250 60 v66"/></g>' +
      plane(160, 92, 1, '#7f8c6a') + plane(250, 130, .55, '#a7a9ad') + plane(80, 140, .5, '#5d6b7a') +
      '<rect x="0" y="170" width="320" height="30" fill="#8d7a66"/>' +
      '<g fill="#3a3a4a">' + [40, 120, 210, 280].map(function (x, i) {
        return '<g transform="translate(' + x + ' 170)"><circle cx="0" cy="-26" r="5"/><rect x="-5" y="-21" width="10" height="16" rx="3"/>' +
          '<rect x="-5" y="-6" width="4" height="7"/><rect x="1" y="-6" width="4" height="7"/>' +
          (i % 2 ? '<circle cx="12" cy="-18" r="3.5"/><rect x="9" y="-15" width="7" height="12" rx="2"/>' : '') + '</g>';
      }).join('') + '</g>';
  };

  S.mansion = function (u) {
    var cols = '', rail = '';
    [60, 98, 136, 174, 212, 250].forEach(function (x) { cols += '<rect x="' + x + '" y="70" width="8" height="90" fill="#fff"/>'; });
    for (var i = 0; i < 40; i++) rail += '<path d="M' + (56 + i * 5.2) + ' 108 v10 M' + (56 + i * 5.2) + ' 148 v10"/>';
    return '<defs>' + sky(u + 's', '#a8dcff', '#eaf7ff') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + cloud(270, 30, .9) +
      '<path d="M44 66 L160 30 L276 66 Z" fill="#6c7a89"/>' +
      '<rect x="50" y="66" width="220" height="96" fill="#f6d9b8"/>' +
      '<g fill="#2f5d50">' + [72, 110, 148, 186, 224].map(function (x) { return '<rect x="' + x + '" y="78" width="18" height="24" rx="2"/><rect x="' + x + '" y="124" width="18" height="30" rx="2"/>'; }).join('') + '</g>' +
      cols +
      '<rect x="50" y="104" width="220" height="4" fill="#fff"/><g stroke="#fff" stroke-width="1.6">' + rail + '</g>' +
      '<rect x="50" y="118" width="220" height="2" fill="#fff"/>' +
      oak(18, 190, 1, true) + oak(310, 196, 1.05, true) +
      '<rect x="0" y="160" width="320" height="40" fill="#7bb36a"/>' +
      '<g fill="#d04f8a">' + [80, 96, 210, 228, 244].map(function (x) { return '<circle cx="' + x + '" cy="164" r="5"/>'; }).join('') + '</g>' +
      '<path d="M0 178 H320" stroke="#222" stroke-width="2"/><g stroke="#222" stroke-width="2">' +
        Array.apply(null, Array(40)).map(function (_, i) { return '<path d="M' + (i * 8 + 4) + ' 178 v14"/><circle cx="' + (i * 8 + 4) + '" cy="176" r="1.6"/>'; }).join('') + '</g>';
  };

  S.races = function (u) {
    function horse(x, y, c, cap) {
      return '<g transform="translate(' + x + ' ' + y + ')">' +
        '<path d="M-30 0 q4 -16 26 -16 q16 0 22 -6 l10 -12 q6 -2 8 4 l-4 8 q4 4 0 8 l-14 4 q-2 12 -10 14 l-30 0 q-10 0 -8 -4 Z" fill="' + c + '"/>' +
        '<path d="M-26 2 l-10 18 M-14 4 l-4 18 M6 4 l10 16 M12 2 l18 10" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M-30 -6 q-14 -2 -18 10" stroke="#222" stroke-width="3" fill="none"/>' +
        '<circle cx="-2" cy="-26" r="6" fill="' + cap + '"/><path d="M-6 -22 l-8 10 h12 Z" fill="' + cap + '"/></g>';
    }
    return '<defs>' + sky(u + 's', '#8cd0ff', '#e6f6ff') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + cloud(60, 26, .9) +
      // grandstand
      '<path d="M150 70 h170 v46 h-170 Z" fill="#f2f2f2"/><path d="M144 70 l12 -16 h164 v16 Z" fill="#2d6a4f"/>' +
      '<g>' + Array.apply(null, Array(26)).map(function (_, i) {
        var c = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#8338ec', '#ff6b9d'][i % 6];
        return '<circle cx="' + (158 + i * 6.3) + '" cy="' + (88 + (i % 3) * 8) + '" r="3" fill="#6b4a3a"/>' +
          '<ellipse cx="' + (158 + i * 6.3) + '" cy="' + (85 + (i % 3) * 8) + '" rx="5" ry="2" fill="' + c + '"/>';
      }).join('') + '</g>' +
      '<rect x="0" y="116" width="320" height="84" fill="#6fae5c"/>' +
      '<path d="M0 134 q160 -14 320 0 v40 q-160 -14 -320 0 Z" fill="#b98b5e"/>' +
      '<path d="M0 132 q160 -14 320 0" stroke="#fff" stroke-width="3" fill="none"/>' +
      horse(90, 152, '#6b3e26', '#e63946') + horse(170, 158, '#2b2b2b', '#ffd60a') + horse(250, 150, '#a0522d', '#4361ee') +
      '<g transform="translate(36 112)"><rect x="-2" y="0" width="4" height="30" fill="#fff"/><rect x="-10" y="-10" width="20" height="10" fill="#e63946"/></g>';
  };

  S.park = function (u) {
    return '<defs>' + sky(u + 's', '#9edbff', '#effaff') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + sun(270, 36, 14, '#ffe27a') + cloud(70, 34, .9) +
      '<rect x="0" y="140" width="320" height="60" fill="#8cc97a"/>' +
      '<ellipse cx="230" cy="168" rx="80" ry="14" fill="#7fbde6"/>' +
      oak(100, 150, 1.8, true) +
      '<path d="M0 186 q160 -16 320 0" stroke="#e8dcc0" stroke-width="10" fill="none"/>' +
      // bike
      '<g transform="translate(220 168)" stroke="#d62828" stroke-width="3" fill="none">' +
        '<circle cx="-18" cy="0" r="11" stroke="#222"/><circle cx="18" cy="0" r="11" stroke="#222"/>' +
        '<path d="M-18 0 L-4 -16 H12 L18 0 M-4 -16 L2 0 L12 -16 M10 -20 h8 M-6 -20 h6"/></g>' +
      '<g transform="translate(40 150)"><circle cx="0" cy="-6" r="10" fill="#ff8fab"/><path d="M0 4 v20" stroke="#555" stroke-width="1.5"/>' +
        '<circle cx="14" cy="-12" r="9" fill="#ffd166"/><path d="M14 -3 v26" stroke="#555" stroke-width="1.5"/></g>';
  };

  S.oakalley = function (u) {
    var trees = '';
    for (var i = 0; i < 5; i++) {
      var s = 0.55 + i * 0.22, dx = 60 + i * 22;
      trees += oak(160 - dx, 110 + i * 18, s, true) + oak(160 + dx, 110 + i * 18, s, true);
    }
    return '<defs>' + sky(u + 's', '#9ad4ff', '#f1faff') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      '<rect x="0" y="104" width="320" height="96" fill="#93c47d"/>' +
      '<path d="M150 104 L170 104 L230 200 L90 200 Z" fill="#e3d3b0"/>' +
      '<g transform="translate(160 104)"><rect x="-26" y="-22" width="52" height="22" fill="#f4c7c3"/>' +
        '<path d="M-30 -22 L0 -34 L30 -22 Z" fill="#7a6f68"/>' +
        '<g fill="#fff">' + [-22, -13, -4, 5, 14, 23].map(function (x) { return '<rect x="' + (x - 1) + '" y="-22" width="2.4" height="22"/>'; }).join('') + '</g></g>' +
      trees;
  };

  S.swamp = function (u) {
    function cypress(x, y, s) {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
        '<path d="M-10 0 q4 -8 6 -60 h8 q2 52 6 60 Z" fill="#5d4a36"/>' +
        '<ellipse cx="0" cy="-70" rx="22" ry="16" fill="#4c6b3c"/><ellipse cx="-8" cy="-80" rx="14" ry="10" fill="#5a7d48"/>' +
        '<path d="M-12 -62 q-2 12 2 22 M12 -64 q3 10 0 20" stroke="#9aa58a" stroke-width="2" fill="none"/></g>';
    }
    return '<defs>' + sky(u + 's', '#cfe8d6', '#f4f0d8') + sky(u + 'w', '#58714a', '#33452c') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      cypress(30, 130, 1.1) + cypress(90, 124, .8) + cypress(250, 128, 1) + cypress(300, 132, 1.2) +
      water(u + 'w', 120) +
      '<g fill="#6d8f3a" opacity=".8">' + [40, 70, 200, 230, 280].map(function (x) { return '<ellipse cx="' + x + '" cy="' + (178 - (x % 20)) + '" rx="8" ry="3"/>'; }).join('') + '</g>' +
      // boat
      '<g transform="translate(150 128)"><path d="M0 14 h110 l-8 10 h-96 Z" fill="#e9eef2" stroke="#3a4a55" stroke-width="1.5"/>' +
        '<rect x="10" y="-18" width="90" height="4" fill="#2a7b9b"/>' +
        '<path d="M14 -14 v28 M54 -14 v28 M96 -14 v28" stroke="#555" stroke-width="2"/>' +
        '<g fill="#3a3a4a"><circle cx="30" cy="2" r="4"/><circle cx="44" cy="2" r="4"/><circle cx="70" cy="2" r="4"/><circle cx="84" cy="2" r="4"/></g></g>' +
      // alligator
      '<g transform="translate(70 170)">' +
        '<path d="M-50 0 q20 -10 60 -8 q30 2 46 6 q-14 6 -46 6 q-36 2 -60 -4 Z" fill="#3e5b2a"/>' +
        '<g fill="#2f4620">' + [-30, -18, -6, 6, 18].map(function (x) { return '<path d="M' + x + ' -7 l4 -5 l4 5 Z"/>'; }).join('') + '</g>' +
        '<circle cx="34" cy="-6" r="3.5" fill="#f2e35a"/><circle cx="34.6" cy="-6" r="1.4" fill="#111"/>' +
        '<path d="M40 2 h14" stroke="#e9f0d0" stroke-width="1.2" stroke-dasharray="2 2"/></g>' +
      // heron
      '<g transform="translate(286 150)" stroke="#fff" fill="#fff"><ellipse cx="0" cy="0" rx="9" ry="6"/>' +
        '<path d="M6 -2 q8 -10 2 -20 l10 -2" stroke-width="2.5" fill="none"/><path d="M-2 6 v16 M3 6 v16" stroke="#e0b84a" stroke-width="1.5"/></g>';
  };

  S.jazz = function (u) {
    return '<defs>' + sky(u + 's', '#3a2b6b', '#7a3b6e') +
      '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#c9921f"/></linearGradient></defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      '<g fill="#ffd166" opacity=".9">' + [[30, 30], [80, 18], [250, 26], [290, 60], [200, 14]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6"/>'; }).join('') + '</g>' +
      // balcony
      '<rect x="0" y="120" width="320" height="80" fill="#c86b4a"/>' +
      '<rect x="0" y="116" width="320" height="6" fill="#1f1f2a"/>' +
      '<g stroke="#1f1f2a" stroke-width="2" fill="none">' + Array.apply(null, Array(20)).map(function (_, i) {
        var x = i * 16 + 8; return '<path d="M' + x + ' 122 v26 M' + (x - 6) + ' 135 q6 -8 12 0"/>';
      }).join('') + '<path d="M0 148 H320"/></g>' +
      '<g fill="#7fd1ae" stroke="#2c5f4d"><rect x="24" y="152" width="38" height="48"/><rect x="258" y="152" width="38" height="48"/></g>' +
      // trumpet
      '<g transform="translate(120 70) rotate(-14)" fill="url(#' + u + 'g)" stroke="#8a6414" stroke-width="1.2">' +
        '<path d="M-60 -4 h80 l30 -18 v44 l-30 -18 h-80 Z"/>' +
        '<rect x="-30" y="-14" width="6" height="10"/><rect x="-18" y="-14" width="6" height="10"/><rect x="-6" y="-14" width="6" height="10"/>' +
        '<path d="M-40 4 q20 18 50 0" fill="none" stroke-width="4"/><circle cx="-62" cy="0" r="4"/></g>' +
      // sax
      '<g transform="translate(238 66)" fill="url(#' + u + 'g)" stroke="#8a6414" stroke-width="1.2">' +
        '<path d="M-6 -40 q-14 -6 -20 -2 l4 6 q8 -2 14 2 v64 q0 22 20 22 q20 0 22 -24 l-10 -2 q-2 12 -12 12 q-8 0 -8 -10 v-68 Z"/>' +
        '<g fill="#8a6414">' + [-24, -12, 0, 12].map(function (y) { return '<circle cx="2" cy="' + y + '" r="2.4"/>'; }).join('') + '</g></g>' +
      notes(170, 40, '#ffd166') + notes(60, 30, '#ff9ecf') + notes(282, 110, '#9ee6ff');
  };

  S.plane = function (u) {
    return '<defs>' + sky(u + 's', '#4fa3ff', '#cdeaff') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      cloud(60, 150, 1.6) + cloud(250, 160, 1.8) + cloud(160, 182, 1.4) + cloud(270, 50, .9, .7) +
      '<g transform="translate(160 86) rotate(-8)">' +
        '<path d="M-110 0 q0 -14 20 -14 h150 q30 0 40 14 q-10 14 -40 14 h-150 q-20 0 -20 -14 Z" fill="#f7f9fc" stroke="#9fb3c8" stroke-width="1.5"/>' +
        '<path d="M-100 -12 l-16 -30 h18 l26 28 Z" fill="#1d4f91"/>' +
        '<path d="M-10 4 l-34 46 h20 l50 -44 Z" fill="#dfe6ee" stroke="#9fb3c8"/>' +
        '<path d="M-10 -4 l-20 -26 h14 l30 24 Z" fill="#cfd8e2"/>' +
        '<ellipse cx="-14" cy="30" rx="14" ry="6" fill="#9fb3c8"/>' +
        '<g fill="#3a6ea5">' + Array.apply(null, Array(12)).map(function (_, i) { return '<circle cx="' + (-70 + i * 10) + '" cy="-4" r="2.6"/>'; }).join('') + '</g>' +
        '<path d="M66 -8 q14 2 20 8 h-22 Z" fill="#3a6ea5"/>' +
        '<path d="M-110 2 h170" stroke="#1d4f91" stroke-width="3"/></g>';
  };

  S.hotel = function (u) {
    var win = '';
    for (var r = 0; r < 7; r++) for (var c = 0; c < 6; c++)
      win += '<rect x="' + (114 + c * 16) + '" y="' + (40 + r * 16) + '" width="10" height="10" rx="1" fill="' + ((r * 6 + c) % 5 === 0 ? '#ffe9a8' : '#bfe3ff') + '"/>';
    return '<defs>' + sky(u + 's', '#ffb36b', '#ffe3b8') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + sun(60, 60, 16, '#fff3b0') +
      '<g fill="#e0a37a"><rect x="20" y="96" width="60" height="70"/><rect x="236" y="80" width="70" height="86"/></g>' +
      '<rect x="104" y="28" width="112" height="140" rx="4" fill="#f5f2ee" stroke="#c9b8a6"/>' +
      '<rect x="104" y="28" width="112" height="8" fill="#2f8f83"/>' + win +
      '<rect x="140" y="150" width="40" height="18" fill="#2f8f83"/><rect x="152" y="154" width="16" height="14" fill="#bfe3ff"/>' +
      '<rect x="0" y="166" width="320" height="34" fill="#8e8e96"/><path d="M0 184 H320" stroke="#fff" stroke-width="2" stroke-dasharray="14 10"/>' +
      '<g transform="translate(96 166)"><path d="M0 0 q-2 -18 2 -34" stroke="#7d6a4a" stroke-width="4" fill="none"/>' +
        '<path d="M2 -34 q-16 -2 -20 6 M2 -34 q16 -4 20 4 M2 -34 q-6 -12 -16 -12 M2 -34 q8 -12 16 -10" stroke="#3f8a4a" stroke-width="5" fill="none" stroke-linecap="round"/></g>';
  };

  S.pelican = function (u) {
    return '<defs>' + sky(u + 's', '#7ccaf5', '#e6f6ff') + sky(u + 'w', '#4d93c2', '#2f6c96') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + cloud(240, 40, 1) +
      water(u + 'w', 130) +
      '<rect x="138" y="118" width="26" height="82" fill="#8a6b4f"/><ellipse cx="151" cy="118" rx="13" ry="4" fill="#a8896b"/>' +
      '<g transform="translate(150 86)">' +
        '<path d="M-30 30 q-8 -30 14 -46 q26 -10 34 14 q4 24 -14 34 Z" fill="#8a7a6a"/>' +
        '<path d="M-22 20 q-4 -18 8 -28" stroke="#6a5a4a" stroke-width="3" fill="none"/>' +
        '<path d="M10 -6 q4 -24 2 -32 q10 -6 14 4 q0 10 -4 24 Z" fill="#f2efe6"/>' +
        '<circle cx="20" cy="-30" r="9" fill="#f7f3e8"/><circle cx="23" cy="-32" r="1.8" fill="#111"/>' +
        '<path d="M26 -30 l50 10 q-30 14 -50 -2 Z" fill="#e8a33d"/><path d="M28 -26 q20 14 46 6" stroke="#c97f1d" stroke-width="1.5" fill="#f1c27d"/>' +
        '<path d="M-6 30 v10 M4 30 v10" stroke="#555" stroke-width="2"/></g>';
  };

  S.gumbo = function (u) {
    return '<defs><radialGradient id="' + u + 'b" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#9a5a2a"/><stop offset="1" stop-color="#6b3a18"/></radialGradient></defs>' +
      '<rect width="320" height="200" fill="#f3e2c7"/>' +
      '<g stroke="#e6cfa8" stroke-width="12"><path d="M0 30 H320 M0 90 H320 M0 150 H320"/></g>' +
      '<ellipse cx="160" cy="124" rx="120" ry="52" fill="#000" opacity=".15"/>' +
      '<ellipse cx="160" cy="112" rx="116" ry="50" fill="#2c6e8f"/><ellipse cx="160" cy="106" rx="100" ry="40" fill="url(#' + u + 'b)"/>' +
      '<ellipse cx="160" cy="100" rx="36" ry="18" fill="#fffaf0"/><ellipse cx="160" cy="96" rx="28" ry="12" fill="#fff"/>' +
      '<g fill="#f08a5d">' + [[100, 104], [214, 112], [124, 124], [196, 92]].map(function (p) { return '<path d="M' + p[0] + ' ' + p[1] + ' q8 -10 16 0 q-4 6 -10 4 Z"/>'; }).join('') + '</g>' +
      '<g fill="#a33b2b">' + [[118, 92], [208, 126], [176, 130], [92, 118]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#c96a5a"/>'; }).join('') + '</g>' +
      '<g fill="#5aa04a">' + [[140, 120], [186, 106], [110, 98], [230, 104]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.5"/>'; }).join('') + '</g>' +
      '<path d="M260 60 q10 10 40 -20" stroke="#c0c0c8" stroke-width="8" stroke-linecap="round"/><ellipse cx="252" cy="70" rx="14" ry="9" fill="#c0c0c8"/>';
  };

  S.poboy = function (u) {
    return '<rect width="320" height="200" fill="#d9eefc"/>' +
      '<g stroke="#bcdcf2" stroke-width="2">' + Array.apply(null, Array(16)).map(function (_, i) { return '<path d="M' + (i * 20) + ' 0 V200 M0 ' + (i * 20) + ' H320"/>'; }).join('') + '</g>' +
      '<ellipse cx="160" cy="150" rx="140" ry="24" fill="#fff"/>' +
      '<path d="M36 120 q124 -20 248 0 q10 16 -6 22 q-118 14 -236 0 q-16 -6 -6 -22 Z" fill="#d9944a"/>' +
      '<path d="M40 118 q120 -10 240 0" stroke="#7fbf4a" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<g fill="#e35d4a">' + [70, 110, 150, 190, 230].map(function (x) { return '<ellipse cx="' + x + '" cy="110" rx="12" ry="5"/>'; }).join('') + '</g>' +
      '<g fill="#f2a66a" stroke="#d07a3a">' + [60, 88, 116, 144, 172, 200, 228, 256].map(function (x, i) {
        return '<path d="M' + (x - 10) + ' ' + (102 - (i % 2) * 3) + ' q10 -14 22 -2 q-4 6 -12 6 Z"/>';
      }).join('') + '</g>' +
      '<path d="M34 104 q126 -56 252 0 q-4 -6 -8 -8 q-118 -46 -236 0 q-6 2 -8 8 Z" fill="#e8a75a"/>' +
      '<path d="M40 98 q120 -48 240 0" fill="#e6a052"/>' +
      '<g stroke="#f7d29a" stroke-width="2" opacity=".8"><path d="M90 78 l12 -6 M140 66 l12 -4 M190 66 l12 2 M236 78 l12 4"/></g>';
  };

  S.turkey = function (u) {
    var fan = '';
    ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#e67e22', '#c0392b', '#8e44ad'].forEach(function (c, i) {
      var a = -75 + i * 25;
      fan += '<ellipse cx="0" cy="-46" rx="13" ry="40" fill="' + c + '" transform="rotate(' + a + ')"/>';
    });
    return '<defs>' + sky(u + 's', '#ffe0a6', '#fff4dd') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      '<g fill="#e07a2f" opacity=".6">' + [[30, 40], [280, 30], [60, 170], [270, 160], [240, 90]].map(function (p) {
        return '<path d="M' + p[0] + ' ' + p[1] + ' l6 -10 l6 10 l10 -2 l-6 8 l6 8 l-10 -2 l-6 10 l-6 -10 l-10 2 l6 -8 l-6 -8 Z"/>';
      }).join('') + '</g>' +
      '<g transform="translate(160 140)">' + fan +
        '<ellipse cx="0" cy="0" rx="36" ry="32" fill="#7a4a2a"/>' +
        '<circle cx="0" cy="-34" r="16" fill="#8b5a33"/>' +
        '<circle cx="-6" cy="-38" r="5" fill="#fff"/><circle cx="6" cy="-38" r="5" fill="#fff"/>' +
        '<circle cx="-5" cy="-37" r="2.4" fill="#111"/><circle cx="7" cy="-37" r="2.4" fill="#111"/>' +
        '<path d="M-4 -30 l4 8 l4 -8 Z" fill="#f5b041"/><path d="M2 -24 q4 8 0 12 q-4 -4 -2 -12" fill="#d63031"/>' +
        '<path d="M-10 30 v12 M10 30 v12" stroke="#f5b041" stroke-width="3"/></g>';
  };

  S.alligator = function (u) {
    return '<defs>' + sky(u + 's', '#bfe6c9', '#f1f8e8') + sky(u + 'w', '#5f7f4a', '#3a5230') + '</defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + water(u + 'w', 110) +
      '<g transform="translate(160 132)">' +
        '<path d="M-130 10 q30 -30 120 -30 q60 0 110 14 q20 6 8 12 q-30 8 -70 6 q-30 10 -60 10 q-70 0 -108 -12 Z" fill="#4a6b2f"/>' +
        '<path d="M60 6 q30 4 58 -2" stroke="#2f4620" stroke-width="2" fill="none"/>' +
        '<g fill="#e9f0d0">' + [70, 80, 90, 100, 110].map(function (x) { return '<path d="M' + x + ' 6 l3 5 l3 -5 Z"/>'; }).join('') + '</g>' +
        '<g fill="#36501f">' + [-90, -70, -50, -30, -10, 10, 30].map(function (x) { return '<path d="M' + x + ' -18 l7 -9 l7 9 Z"/>'; }).join('') + '</g>' +
        '<ellipse cx="54" cy="-12" rx="9" ry="7" fill="#4a6b2f"/><circle cx="56" cy="-14" r="5" fill="#f2e35a"/><ellipse cx="57" cy="-14" rx="1.6" ry="4" fill="#111"/>' +
        '<path d="M-40 10 l-6 16 h12 M20 12 l-4 14 h12" stroke="#4a6b2f" stroke-width="7" stroke-linecap="round" fill="none"/></g>';
  };

  // Suitcase with travel stickers and a globe — the planner's own banner.
  S.travel = function (u) {
    return '<defs>' + sky(u + 's', '#6d5dfc', '#c4b5fd') +
      '<radialGradient id="' + u + 'g" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#2563eb"/></radialGradient></defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' +
      '<g fill="#fff" opacity=".5">' + [[30, 30], [290, 24], [250, 70], [60, 90], [180, 20]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2"/>'; }).join('') + '</g>' +
      '<path d="M20 60 q90 -50 180 -20" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 6" fill="none" opacity=".8"/>' +
      '<g transform="translate(206 38) rotate(14) scale(.55)" fill="#fff"><path d="M-40 0 q0 -8 12 -8 h60 q18 0 24 8 q-6 8 -24 8 h-60 q-12 0 -12 -8 Z"/>' +
        '<path d="M-6 0 l-20 -26 h12 l26 24 Z M-6 0 l-20 26 h12 l26 -24 Z M-34 -2 l-8 -12 h6 l10 10 Z"/></g>' +
      // globe
      '<g transform="translate(250 128)"><circle r="44" fill="url(#' + u + 'g)"/>' +
        '<path d="M-30 -20 q14 -8 22 2 q6 10 -6 16 q-10 4 -8 16 q-14 -6 -14 -18 Z M8 -34 q18 2 26 18 q-10 2 -16 -6 q-8 -4 -10 -12 Z M10 10 q14 -4 22 6 q-2 16 -16 20 q-10 -8 -6 -26 Z" fill="#4ade80"/>' +
        '<ellipse rx="44" ry="14" fill="none" stroke="#fff" stroke-width="1" opacity=".35"/><path d="M0 -44 V44" stroke="#fff" stroke-width="1" opacity=".35"/>' +
        '<path d="M-10 48 h20 l-4 14 h-12 Z" fill="#a16207"/><path d="M-50 0 a50 50 0 0 1 100 0" fill="none" stroke="#ca8a04" stroke-width="4"/></g>' +
      // suitcase
      '<g transform="translate(110 112)">' +
        '<rect x="-22" y="-62" width="44" height="22" rx="8" fill="none" stroke="#7c2d12" stroke-width="7"/>' +
        '<rect x="-76" y="-46" width="152" height="104" rx="16" fill="#f97316"/>' +
        '<rect x="-76" y="-46" width="152" height="18" rx="9" fill="#fb923c"/>' +
        '<path d="M-40 -46 v104 M40 -46 v104" stroke="#c2410c" stroke-width="7"/>' +
        '<circle cx="-50" cy="64" r="8" fill="#292524"/><circle cx="50" cy="64" r="8" fill="#292524"/>' +
        '<g transform="translate(-58 -6) rotate(-12)"><rect x="-16" y="-11" width="32" height="22" rx="4" fill="#fde047"/><text x="0" y="4" font-size="9" font-weight="900" text-anchor="middle" fill="#7c2d12" font-family="sans-serif">TRIP</text></g>' +
        '<g transform="translate(2 18) rotate(8)"><circle r="16" fill="#38bdf8"/><path d="M-10 4 l6 -10 l4 6 l4 -4 l6 8 Z" fill="#fff"/></g>' +
        '<g transform="translate(56 -14) rotate(-6)"><rect x="-14" y="-14" width="28" height="28" rx="6" fill="#f472b6"/><path d="M0 -7 l2 5 h5 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 h5 Z" fill="#fff"/></g>' +
        '<g transform="translate(-6 -16)"><rect x="-16" y="-8" width="32" height="16" rx="8" fill="#a3e635"/><text x="0" y="4" font-size="8" font-weight="900" text-anchor="middle" fill="#365314" font-family="sans-serif">FUN!</text></g></g>';
  };

  // Volcano over a lake with forest — for mountain and lake trips (Pucón, Patagonia…).
  S.volcano = function (u) {
    return '<defs>' + sky(u + 's', '#7cc7ff', '#e7f6ff') + sky(u + 'w', '#3f8fc2', '#1f5f8b') +
      '<linearGradient id="' + u + 'v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b8fa3"/><stop offset="1" stop-color="#4b5563"/></linearGradient></defs>' +
      '<rect width="320" height="200" fill="url(#' + u + 's)"/>' + cloud(60, 40, 1) + cloud(270, 30, .8) +
      '<path d="M182 22 q6 -10 14 -4 q8 -8 14 2" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M60 130 L178 38 h28 L300 130 Z" fill="url(#' + u + 'v)"/>' +
      '<path d="M156 56 L178 38 h28 L228 56 q-10 8 -18 0 q-8 10 -18 2 q-10 8 -18 -2 q-8 6 -18 0 Z" fill="#fff"/>' +
      '<path d="M0 130 q60 -30 120 -6 q50 -26 100 0 q50 -20 100 4 V140 H0 Z" fill="#3f6b3a"/>' +
      '<g fill="#2f5a2c">' + [10, 34, 58, 82, 236, 262, 288, 312].map(function (x, i) {
        var h = 26 + (i % 3) * 8; return '<path d="M' + x + ' ' + (138 - h) + ' l-10 ' + h + ' h20 Z"/>';
      }).join('') + '</g>' +
      water(u + 'w', 136) +
      '<path d="M100 150 L178 190 h28 L260 150 Z" fill="#fff" opacity=".1"/>' +
      '<g transform="translate(110 170)"><path d="M-20 0 h40 l-6 8 h-28 Z" fill="#f59e0b"/><path d="M0 0 v-26 l14 22 Z" fill="#fff"/></g>';
  };

  var SCENES = S;

  function has(name) { return Object.prototype.hasOwnProperty.call(SCENES, String(name || '')); }

  function svg(name, opts) {
    if (!has(name)) return '';
    opts = opts || {};
    var u = 'va' + (++_n) + '_';
    var label = opts.label ? String(opts.label).replace(/[&<>"']/g, '') : '';
    return '<svg class="' + (opts.cls || 'va-art') + '" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" ' +
      (label ? 'role="img" aria-label="' + label + '"' : 'aria-hidden="true"') + '>' +
      SCENES[name](u) + '</svg>';
  }

  // Picks a scene from free text (a place name, a day's plan) by the
  // keyword that appears EARLIEST, so "Beignets… then the ferry" draws
  // beignets. Spanish and English keywords both count.
  var KEYWORDS = [
    [/new orleans|nola\b/, 'nola'],
    [/puc[oó]n|volc[aá]n|volcano|patagonia|mountain|monta[ñn]a|cordillera|\blago\b|\blake\b|ski\b|esqu[ií]/, 'volcano'],
    [/vuelo|flight|airport|aeropuerto|\bfly\b|plane|avi[oó]n/, 'plane'],
    [/thanksgiving|turkey|acci[oó]n de gracias/, 'turkey'],
    [/streetcar|tranv[ií]a/, 'streetcar'],
    [/beignet|caf[eé] du monde/, 'beignets'],
    [/ferry|algiers/, 'ferry'],
    [/swamp|pantano|bayou|alligator|caim[aá]n/, 'swamp'],
    [/oak alley|plantation/, 'oakalley'],
    [/wwii|museum|museo/, 'museum'],
    [/garden district|mansion|mansi[oó]n/, 'mansion'],
    [/fair ?grounds|horse|caballo|hip[oó]dromo|race course/, 'races'],
    [/city park|\bpark\b|parque/, 'park'],
    [/jazz|preservation hall|music|m[uú]sica/, 'jazz'],
    [/cathedral|catedral|jackson square|french quarter/, 'cathedral'],
    [/hotel|our stay/, 'hotel'],
    [/pelican|pel[ií]cano/, 'pelican'],
    [/gumbo|jambalaya|stew/, 'gumbo'],
    [/po'?-?boy|sandwich|muffuletta/, 'poboy']
  ];
  function guess(text) {
    var t = String(text || '').toLowerCase(), best = null, at = Infinity;
    KEYWORDS.forEach(function (k) {
      var m = k[1] && t.search(k[0]);
      if (m >= 0 && m < at) { at = m; best = k[1]; }
    });
    return best;
  }
  // The scene for an item: its own `art` if valid, else a guess from text.
  // art: 'none' opts out of guessing.
  function pick(art, text) { return art === 'none' ? null : (has(art) ? art : guess(text)); }

  return { svg: svg, has: has, guess: guess, pick: pick, names: function () { return Object.keys(SCENES); } };
})();
