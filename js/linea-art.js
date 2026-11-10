/* ================================================================
   LÍNEA DEL TIEMPO — hand-built SVG scenes (js/linea-art.js)

   LineaArt.scene(id, seed) returns an <svg> string (viewBox 240 x 160)
   with a warm, painted look: a sky and ground gradient, soft shadows
   and one clear subject. The same ~60 scenes serve all the events (an
   event names its scene in `art`); people use 'p:<look>' portraits
   whose skin, hair and cloth colours vary with the person's id, so no
   two portraits are the same. Nothing is fetched; no emoji are used as
   pictures.
   ================================================================ */

var LineaArt = (function () {
  'use strict';

  var _n = 0;
  function uid() { return 'la' + (++_n) + 'x'; }
  function hash(s) { var h = 5381; s = String(s || ''); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function pick(a, seed) { return a[hash(seed) % a.length]; }

  function grad(id, a, b, vertical) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical === false ? 1 : 0) + '" y2="' + (vertical === false ? 0 : 1) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
  }
  // Sky from top to the horizon line, then ground.
  function back(u, top, bot, hor, g1, g2) {
    return '<defs>' + grad(u + 's', top, bot) + grad(u + 'g', g1, g2) + '</defs>' +
      '<rect width="240" height="160" fill="url(#' + u + 's)"/>' +
      '<rect y="' + hor + '" width="240" height="' + (160 - hor) + '" fill="url(#' + u + 'g)"/>';
  }
  function sun(x, y, r, c) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.9) + '" fill="' + (c || '#fff3c4') + '" opacity=".35"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (c || '#fff3c4') + '"/>'; }
  function shadow(x, y, rx, ry) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + (ry || rx / 5) + '" fill="#2b1d10" opacity=".25"/>'; }
  function stars(n, seed) {
    var o = '';
    for (var i = 0; i < n; i++) { var h = hash(seed + i); o += '<circle cx="' + (h % 230 + 5) + '" cy="' + ((h >> 8) % 90 + 4) + '" r="' + (0.8 + (h % 3) * 0.4) + '" fill="#fff" opacity="' + (0.5 + (h % 5) / 10) + '"/>'; }
    return o;
  }
  function cloud(x, y, s, o) { return '<g opacity="' + (o || .85) + '" transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><ellipse cx="0" cy="0" rx="22" ry="7" fill="#fff"/><ellipse cx="-9" cy="-5" rx="11" ry="7" fill="#fff"/><ellipse cx="8" cy="-6" rx="13" ry="8" fill="#fff"/></g>'; }
  function hills(u, y, c1, c2) { return '<path d="M0 ' + y + ' Q40 ' + (y - 26) + ' 85 ' + (y - 6) + ' T170 ' + (y - 10) + ' T240 ' + (y - 2) + ' V160 H0Z" fill="' + c1 + '"/><path d="M0 ' + (y + 14) + ' Q60 ' + (y - 8) + ' 120 ' + (y + 6) + ' T240 ' + (y + 2) + ' V160 H0Z" fill="' + c2 + '"/>'; }
  function mtn(x, y, w, h, c, snow) {
    var o = '<path d="M' + (x - w / 2) + ' ' + y + ' L' + x + ' ' + (y - h) + ' L' + (x + w / 2) + ' ' + y + 'Z" fill="' + c + '"/>';
    if (snow) o += '<path d="M' + (x - w * 0.14) + ' ' + (y - h * 0.72) + ' L' + x + ' ' + (y - h) + ' L' + (x + w * 0.14) + ' ' + (y - h * 0.72) + ' L' + (x + w * 0.05) + ' ' + (y - h * 0.8) + ' L' + x + ' ' + (y - h * 0.7) + ' L' + (x - w * 0.06) + ' ' + (y - h * 0.8) + 'Z" fill="#fff"/>';
    return o;
  }
  function tree(x, y, s, c) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><rect x="-1.5" y="-8" width="3" height="9" fill="#6b4a2b"/><circle cx="0" cy="-14" r="8" fill="' + (c || '#4f8a3c') + '"/><circle cx="-5" cy="-10" r="5" fill="' + (c || '#4f8a3c') + '"/><circle cx="5" cy="-10" r="5" fill="' + (c || '#4f8a3c') + '"/></g>'; }
  function palm(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><path d="M0 0 Q3 -14 -2 -28" stroke="#7a5230" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M-2 -28 Q-14 -34 -22 -26 M-2 -28 Q-10 -40 -20 -38 M-2 -28 Q8 -40 18 -34 M-2 -28 Q12 -30 20 -22 M-2 -28 Q-2 -42 4 -44" stroke="#3f7d3a" stroke-width="4" fill="none" stroke-linecap="round"/></g>'; }
  function win(x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (c || '#3a2a1c') + '" rx="1.5"/>'; }

  // ------------------------------------------------------------------
  // Scenes
  // ------------------------------------------------------------------
  var SC = {};

  SC.pyramid = function (u) {
    return back(u, '#f6c27a', '#fde7b8', 112, '#e3b66b', '#c99646') + sun(190, 38, 14, '#fff6d2') +
      '<path d="M20 116 L92 40 L164 116Z" fill="#d9a94f"/><path d="M92 40 L164 116 L112 116Z" fill="#b98a38"/>' +
      '<path d="M120 118 L178 70 L236 118Z" fill="#d1a047"/><path d="M178 70 L236 118 L190 118Z" fill="#a97d33"/>' +
      '<path d="M30 112 L150 112 M40 104 L140 104 M52 92 L128 92 M64 80 L116 80" stroke="#a17a30" stroke-width=".8" opacity=".5"/>' +
      '<path d="M0 130 Q60 122 120 132 T240 128 V160 H0Z" fill="#d4a553"/>' + shadow(60, 124, 40, 4);
  };
  SC.stepped = function (u) {
    var o = back(u, '#7fc4d8', '#e7f3d8', 112, '#5f9a4a', '#41763a') + cloud(40, 30, 1) + cloud(190, 24, .8);
    for (var i = 0; i < 6; i++) o += '<rect x="' + (60 + i * 8) + '" y="' + (108 - i * 12) + '" width="' + (120 - i * 16) + '" height="12" fill="' + (i % 2 ? '#d8c9a8' : '#c9b78f') + '"/>';
    return o + '<rect x="108" y="36" width="24" height="12" fill="#a8412c"/><rect x="116" y="82" width="8" height="26" fill="#6e5b3f"/>' +
      '<path d="M0 124 Q60 116 120 124 T240 120 V160 H0Z" fill="#3a8a8e" opacity=".8"/>' + palm(24, 126, .9) + palm(214, 126, .8);
  };
  SC.stonehenge = function (u) {
    var o = back(u, '#9fb9d6', '#f2ddb5', 108, '#7fa85a', '#5e8a42') + sun(46, 56, 13, '#fff0b8');
    [[40, 78], [78, 74], [120, 72], [160, 74], [198, 78]].forEach(function (p, i) { o += '<rect x="' + (p[0] - 9) + '" y="' + p[1] + '" width="18" height="' + (118 - p[1]) + '" fill="' + (i % 2 ? '#a9a08f' : '#bdb4a2') + '"/>'; });
    o += '<rect x="28" y="66" width="60" height="12" fill="#9d9483"/><rect x="108" y="64" width="64" height="12" fill="#aaa190"/><rect x="170" y="68" width="40" height="12" fill="#9d9483"/>';
    return o + shadow(120, 124, 96, 5);
  };
  SC.mask = function (u) {
    return back(u, '#2d3d57', '#5a4a3a', 118, '#8a6a35', '#5e4624') + stars(14, 'mask') +
      '<path d="M120 28 C86 28 80 62 84 92 C86 112 100 128 120 134 C140 128 154 112 156 92 C160 62 154 28 120 28Z" fill="#e0b445"/>' +
      '<path d="M84 60 H156 L150 40 H90Z" fill="#274b9a"/><path d="M92 54 H148 M94 46 H146" stroke="#e0b445" stroke-width="3"/>' +
      '<path d="M96 78 Q108 70 118 80 Q108 86 96 78Z M142 78 Q132 70 122 80 Q132 86 142 78Z" fill="#161616"/><path d="M99 78 Q108 74 114 79" stroke="#fff" stroke-width="2" fill="none"/>' +
      '<path d="M120 84 V104 M112 108 Q120 114 128 108" stroke="#a37b1f" stroke-width="2.5" fill="none"/><path d="M96 122 H144 L136 140 H104Z" fill="#274b9a"/>';
  };
  SC.tablet = function (u) {
    var o = back(u, '#e9c98c', '#f6e4b9', 110, '#c79b5d', '#a77c42') + sun(200, 36, 12);
    o += '<path d="M64 38 L172 30 L180 122 L72 130Z" fill="#c98f5a"/><path d="M64 38 L172 30 L172 36 L68 44Z" fill="#dba97a"/>';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 6; c++) { var x = 82 + c * 14 + (r % 2) * 3, y = 54 + r * 14; o += '<path d="M' + x + ' ' + y + ' l7 2 l-6 5z" fill="#7a4a24"/>'; }
    return o + shadow(120, 134, 70, 5) + '<path d="M196 120 L214 100 L218 104 L200 124Z" fill="#6b4a2b"/>';
  };
  SC.arch = function (u) {
    var o = back(u, '#f4b678', '#ffe6bf', 112, '#a99a6c', '#857a52') + sun(190, 52, 16, '#fff0b0');
    o += '<rect x="20" y="64" width="200" height="14" fill="#d9c7a0"/>';
    for (var i = 0; i < 4; i++) { var x = 26 + i * 48; o += '<path d="M' + x + ' 124 V92 Q' + (x + 18) + ' 62 ' + (x + 36) + ' 92 V124Z" fill="#7f6a4b"/><rect x="' + (x - 6) + '" y="78" width="48" height="8" fill="#cdb98f"/>'; }
    return o + '<rect x="20" y="124" width="200" height="8" fill="#cdb98f"/>' + shadow(120, 134, 100, 4);
  };
  SC.temple = function (u) {
    var o = back(u, '#7fb6e0', '#f3e6c8', 112, '#c8b27b', '#a78f58') + cloud(52, 28, .9);
    o += '<path d="M40 56 L120 28 L200 56Z" fill="#ece3cf"/><path d="M40 56 L120 28 L120 40 L56 60Z" fill="#fff" opacity=".5"/><rect x="40" y="56" width="160" height="9" fill="#d9ceb4"/>';
    for (var i = 0; i < 7; i++) o += '<rect x="' + (46 + i * 22) + '" y="65" width="11" height="52" fill="' + (i % 2 ? '#e4dac2' : '#f1e9d6') + '"/><rect x="' + (44 + i * 22) + '" y="65" width="15" height="4" fill="#cfc4a8"/>';
    return o + '<rect x="34" y="117" width="172" height="8" fill="#cdbf9d"/><rect x="28" y="125" width="184" height="8" fill="#bcad88"/>' + shadow(120, 136, 96, 4);
  };
  SC.torch = function (u) {
    return back(u, '#3a2f66', '#e9884a', 100, '#5d6a3a', '#3e4a28') + stars(8, 'torch') +
      '<path d="M104 70 L136 70 L128 134 L112 134Z" fill="#c9a040"/><path d="M104 70 L136 70 L134 78 L106 78Z" fill="#e5c25f"/>' +
      '<path d="M120 20 C140 38 146 54 138 68 C130 76 110 76 102 68 C94 54 104 40 120 20Z" fill="#f08a1c"/><path d="M120 36 C132 48 134 58 128 66 C122 70 114 70 112 64 C108 54 114 46 120 36Z" fill="#ffd34f"/>' +
      '<path d="M40 128 q10 -12 22 0 M180 128 q10 -12 22 0" stroke="#6a8a32" stroke-width="3" fill="none"/>' + shadow(120, 136, 30, 4);
  };
  SC.globe = function (u) {
    return back(u, '#2c4f7a', '#7fb4d4', 120, '#2a5d86', '#1d4468') + stars(10, 'globe') +
      '<circle cx="120" cy="76" r="46" fill="#3d86c6"/><path d="M92 58 Q104 44 120 52 Q128 62 118 72 Q104 74 96 84 Q86 74 92 58Z M126 78 Q142 70 152 82 Q148 100 136 104 Q124 96 126 78Z" fill="#6aa14c"/>' +
      '<ellipse cx="120" cy="76" rx="46" ry="14" fill="none" stroke="#fff" stroke-width=".8" opacity=".5"/><ellipse cx="120" cy="76" rx="18" ry="46" fill="none" stroke="#fff" stroke-width=".8" opacity=".5"/>' +
      '<path d="M104 40 Q96 50 100 62" stroke="#fff" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/><rect x="100" y="124" width="40" height="8" rx="3" fill="#6b4a2b"/><rect x="112" y="118" width="16" height="8" fill="#8a6038"/>';
  };
  SC.crown = function (u) {
    return back(u, '#5a2a62', '#c9704a', 124, '#6d3a2b', '#4b2418') +
      '<rect x="88" y="104" width="64" height="14" rx="2" fill="#c8302a"/><path d="M84 106 L92 60 L106 84 L120 48 L134 84 L148 60 L156 106Z" fill="#e8b830"/><path d="M84 106 L156 106 L156 116 L84 116Z" fill="#c99a1e"/>' +
      '<circle cx="92" cy="60" r="5" fill="#d9312a"/><circle cx="120" cy="48" r="6" fill="#2d6ec4"/><circle cx="148" cy="60" r="5" fill="#2e9b52"/><circle cx="120" cy="110" r="4" fill="#fff"/>' +
      '<path d="M96 100 Q120 90 144 100" stroke="#fff3a8" stroke-width="2" fill="none" opacity=".7"/>' + shadow(120, 128, 46, 4);
  };
  SC.volcano = function (u) {
    return back(u, '#e9a06a', '#f7d9a8', 112, '#6b8a46', '#4a6a30') + sun(46, 36, 11) +
      '<path d="M30 118 L100 54 L110 50 L136 50 L146 54 L214 118Z" fill="#6a5a50"/><path d="M110 50 L100 54 L118 118 L136 118 L146 54 L136 50Z" fill="#54453e"/>' +
      '<path d="M118 50 C100 30 104 14 122 8 C136 22 146 34 136 50Z" fill="#6f6862" opacity=".85"/><path d="M104 30 C90 22 84 12 96 6" stroke="#8a827b" stroke-width="8" fill="none" opacity=".55" stroke-linecap="round"/>' +
      '<path d="M114 52 q4 22 -2 40" stroke="#ff7a1c" stroke-width="3" fill="none"/>' + tree(40, 126, 1) + tree(204, 128, 1.1);
  };
  SC.colosseum = function (u) {
    var o = back(u, '#f7a86a', '#fde3b4', 118, '#a88c5c', '#82683f') + sun(196, 40, 14, '#fff1bd');
    o += '<path d="M20 120 V66 Q120 40 220 66 V120Z" fill="#d6bd8a"/><path d="M20 66 Q120 40 220 66 V76 Q120 50 20 76Z" fill="#c5aa74"/>';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 9; c++) o += '<path d="M' + (30 + c * 20.5) + ' ' + (62 + r * 19 + 14) + ' v-8 q4 -7 8 0 v8z" fill="#5b4630"/>';
    return o + '<rect x="14" y="120" width="212" height="8" fill="#b79c68"/>' + shadow(120, 132, 100, 4);
  };
  SC.castle = function (u) {
    return back(u, '#8fb7de', '#eadfc6', 112, '#6a9a4c', '#4a7a36') + cloud(60, 30, 1) +
      '<rect x="64" y="64" width="112" height="56" fill="#b9ae98"/><rect x="48" y="44" width="28" height="76" fill="#a89d88"/><rect x="164" y="44" width="28" height="76" fill="#a89d88"/>' +
      '<path d="M44 44 L62 22 L80 44Z" fill="#9c3a2c"/><path d="M160 44 L178 22 L196 44Z" fill="#9c3a2c"/>' +
      '<path d="M64 64 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h4 v6" fill="#a89d88"/>' +
      '<path d="M108 120 V92 Q120 76 132 92 V120Z" fill="#4a3320"/><rect x="58" y="62" width="6" height="12" fill="#3a2a1c"/><rect x="176" y="62" width="6" height="12" fill="#3a2a1c"/>' +
      '<path d="M178 22 V6 L196 12 L178 18" fill="#b8312b"/><path d="M62 22 V8" stroke="#6b4a2b" stroke-width="2"/>' + shadow(120, 124, 80, 4);
  };
  SC.longship = function (u) {
    return back(u, '#9db9cf', '#e4eef0', 96, '#3d6f8e', '#264e6c') +
      '<path d="M30 100 Q60 94 90 100 T150 100 T210 100" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>' +
      '<path d="M44 86 Q70 108 120 110 Q170 108 196 86 Q184 92 170 90 L70 90 Q56 92 44 86Z" fill="#7b4a26"/><path d="M44 86 Q36 70 46 64 Q44 76 52 86Z" fill="#7b4a26"/><path d="M196 86 Q206 70 194 64 Q196 76 188 86Z" fill="#7b4a26"/>' +
      '<rect x="118" y="30" width="3" height="60" fill="#5a3a1c"/><path d="M121 34 L168 40 L168 78 L121 84Z" fill="#c8362e"/><path d="M121 34 L168 40 L168 48 L121 42Z M121 56 L168 58 L168 66 L121 64Z" fill="#f4e3c0" opacity=".9"/>' +
      '<g fill="#e5b84a">' + [72, 90, 108, 130, 148, 166].map(function (x) { return '<circle cx="' + x + '" cy="94" r="5"/>'; }).join('') + '</g>' +
      '<path d="M20 112 Q60 104 100 114 T180 112 T230 114 V160 H0 V118Z" fill="#2b5e84" opacity=".85"/><path d="M0 128 Q40 120 80 130 T160 128 T240 130 V160 H0Z" fill="#1f4a6e"/>';
  };
  SC.ship = function (u) {
    return back(u, '#f2a96a', '#ffe9c4', 100, '#2d6f9c', '#1d4f78') + sun(190, 70, 15, '#fff4c4') + cloud(50, 28, 1) +
      '<path d="M22 108 Q60 112 120 112 Q180 112 216 100 L200 128 Q120 138 44 128Z" fill="#6d3f1e"/><path d="M22 108 Q60 112 120 112 Q180 112 216 100 L214 106 Q180 118 120 118 Q60 118 24 112Z" fill="#8a5428"/>' +
      '<rect x="70" y="30" width="3" height="80" fill="#4d311a"/><rect x="118" y="20" width="3" height="90" fill="#4d311a"/><rect x="164" y="40" width="3" height="68" fill="#4d311a"/>' +
      '<path d="M73 34 Q96 44 112 36 V80 Q96 90 73 80Z" fill="#f6ecd2"/><path d="M121 24 Q150 36 160 26 V78 Q140 88 121 78Z" fill="#faf1d6"/><path d="M167 44 Q184 52 198 46 V82 Q182 88 167 82Z" fill="#f6ecd2"/>' +
      '<path d="M91 40 V76 M82 58 H104 M139 32 V74 M128 52 H152" stroke="#b8312b" stroke-width="3"/><path d="M121 20 L136 14 L121 8Z" fill="#b8312b"/>' +
      '<path d="M0 122 Q40 112 80 124 T160 122 T240 124 V160 H0Z" fill="#2a76a8" opacity=".9"/><path d="M0 138 Q50 128 100 140 T200 138 T240 142 V160 H0Z" fill="#1b5886"/>';
  };
  SC.map = function (u) {
    return back(u, '#e9d6a8', '#f3e5bf', 160, '#e9d6a8', '#e9d6a8') +
      '<rect x="22" y="18" width="196" height="124" rx="6" fill="#f2e2b4" stroke="#a8864a" stroke-width="3"/>' +
      '<path d="M52 56 Q70 40 94 50 Q104 66 90 78 Q70 82 60 98 Q44 86 52 56Z" fill="#9ec27a"/><path d="M130 44 Q160 34 190 50 Q198 72 176 82 Q150 76 136 96 Q120 70 130 44Z" fill="#9ec27a"/><path d="M108 104 Q124 96 140 106 Q146 124 126 128 Q106 124 108 104Z" fill="#9ec27a"/>' +
      '<path d="M60 112 Q96 70 130 92 T186 70" stroke="#b8312b" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/><circle cx="186" cy="70" r="5" fill="#b8312b"/>' +
      '<g transform="translate(184 118)"><circle r="14" fill="#fff" stroke="#6b4a2b" stroke-width="2"/><path d="M0 -11 L4 0 L0 11 L-4 0Z" fill="#b8312b"/><path d="M-11 0 L0 -3 L11 0 L0 3Z" fill="#3a4a6a"/></g>';
  };
  SC.terraces = function (u) {
    var o = back(u, '#9cc8e6', '#e6f1d8', 100, '#5f8a3c', '#41692c') + mtn(60, 92, 120, 70, '#6e8a6a') + mtn(180, 92, 130, 80, '#5f7a62', true) + cloud(120, 24, 1);
    var cols = ['#7aa84e', '#6a9a44', '#5c8a3c', '#4d7a34'];
    for (var i = 0; i < 4; i++) o += '<path d="M' + (26 - i * 2) + ' ' + (104 + i * 14) + ' Q120 ' + (92 + i * 14) + ' ' + (214 + i * 2) + ' ' + (104 + i * 14) + ' V' + (118 + i * 14) + ' H' + (26 - i * 2) + 'Z" fill="' + cols[i] + '"/><path d="M' + (26 - i * 2) + ' ' + (116 + i * 14) + ' H' + (214 + i * 2) + '" stroke="#a89f88" stroke-width="3"/>';
    return o + '<rect x="96" y="78" width="26" height="16" fill="#b4a98f"/><path d="M92 78 L109 64 L126 78Z" fill="#c9a84a"/><rect x="132" y="84" width="20" height="12" fill="#a99f85"/><path d="M129 84 L142 73 L155 84Z" fill="#c9a84a"/><rect x="102" y="84" width="6" height="10" fill="#3a2a1c"/>';
  };
  SC.press = function (u) {
    return back(u, '#8a6a46', '#c9a678', 120, '#6b4a2b', '#4b321c') +
      '<rect x="60" y="28" width="12" height="94" fill="#5b3a1c"/><rect x="148" y="28" width="12" height="94" fill="#5b3a1c"/><rect x="56" y="22" width="108" height="14" fill="#6b4524"/>' +
      '<rect x="106" y="22" width="8" height="52" fill="#8a5a2c"/><path d="M82 66 H138" stroke="#2c2c2c" stroke-width="6" stroke-linecap="round"/><rect x="72" y="74" width="76" height="8" fill="#7a5028"/>' +
      '<rect x="64" y="96" width="92" height="16" fill="#9a7140"/><rect x="72" y="92" width="76" height="6" fill="#2d2d2d"/><g fill="#d8d8d8">' + [76, 86, 96, 106, 116, 126, 136].map(function (x) { return '<rect x="' + x + '" y="91" width="6" height="4"/>'; }).join('') + '</g>' +
      '<g transform="translate(176 100) rotate(-8)"><rect width="34" height="22" fill="#f8efd6" stroke="#b79d62"/><path d="M5 6 H29 M5 11 H29 M5 16 H22" stroke="#4a3a28" stroke-width="1.5"/></g>' + shadow(110, 124, 60, 4);
  };
  SC.solar = function (u) {
    var o = back(u, '#0f1d3d', '#2b3f73', 160, '#2b3f73', '#2b3f73') + stars(24, 'solar');
    o += '<circle cx="120" cy="80" r="30" fill="#ffd34f"/><circle cx="120" cy="80" r="40" fill="#ffd34f" opacity=".2"/>';
    [[56, '#c9a37a', 5], [74, '#e8b66a', 8], [96, '#3d86c6', 8], [118, '#c8553c', 6]].forEach(function (p, i) {
      o += '<ellipse cx="120" cy="80" rx="' + (p[0] + 36) + '" ry="' + (p[0] * 0.5 + 8) + '" fill="none" stroke="#9fb4e0" stroke-width=".8" opacity=".6"/>';
    });
    return o + '<circle cx="44" cy="92" r="5" fill="#c9a37a"/><circle cx="196" cy="94" r="8" fill="#e8b66a"/><circle cx="170" cy="60" r="8" fill="#3d86c6"/><circle cx="170" cy="60" r="8" fill="none" stroke="#fff" stroke-width=".6" opacity=".4"/><circle cx="68" cy="112" r="6" fill="#c8553c"/>';
  };
  SC.telescope = function (u) {
    return back(u, '#1a2a55', '#5a4a8a', 124, '#2d3a2a', '#1d2a1c') + stars(22, 'tele') + '<circle cx="190" cy="34" r="12" fill="#f4efd0"/><circle cx="186" cy="31" r="12" fill="#1a2a55" opacity=".25"/>' +
      '<g transform="translate(120 96) rotate(-34)"><rect x="-6" y="-70" width="46" height="14" rx="3" fill="#8a5a2c" transform="translate(-34 40)"/><rect x="-40" y="-22" width="92" height="22" rx="3" fill="#b78a3c"/><rect x="-46" y="-26" width="14" height="30" rx="2" fill="#6b4a22"/><rect x="48" y="-20" width="10" height="18" fill="#2c2c2c"/><rect x="2" y="-22" width="6" height="22" fill="#e5c25f"/></g>' +
      '<path d="M120 100 L96 134 M120 100 L144 134 M120 100 L120 136" stroke="#6b4a2b" stroke-width="5" stroke-linecap="round"/>' + shadow(120, 138, 34, 4);
  };
  SC.book = function (u) {
    return back(u, '#c89a62', '#ecd5a8', 112, '#7a5230', '#5b3a20') +
      '<path d="M40 52 Q80 44 120 56 Q160 44 200 52 V120 Q160 112 120 124 Q80 112 40 120Z" fill="#f8efd8" stroke="#a88650" stroke-width="2"/><path d="M120 56 V124" stroke="#a88650" stroke-width="2"/>' +
      '<path d="M54 66 Q80 62 106 68 M54 78 Q80 74 106 80 M54 90 Q80 86 106 92 M54 102 Q80 98 100 103 M134 68 Q160 62 186 66 M134 80 Q160 74 186 78 M134 92 Q160 86 186 90" stroke="#5a4630" stroke-width="2" fill="none" opacity=".7"/>' +
      '<rect x="150" y="96" width="34" height="14" fill="#b8312b" opacity=".85"/><path d="M40 120 Q80 112 120 124 Q160 112 200 120 V128 Q160 120 120 132 Q80 120 40 128Z" fill="#6b4524"/>' + shadow(120, 140, 80, 4);
  };
  SC.scroll = function (u) {
    return back(u, '#caa06a', '#eed9ae', 112, '#8a6038', '#6a4626') +
      '<path d="M58 40 H182 Q196 40 196 54 V112 Q196 124 182 124 H58Z" fill="#f6e8c4"/><ellipse cx="58" cy="82" rx="10" ry="42" fill="#e8d4a4" stroke="#b59357" stroke-width="2"/><ellipse cx="58" cy="82" rx="4" ry="30" fill="#c9ae74"/>' +
      '<path d="M78 58 H176 M78 70 H176 M78 82 H176 M78 94 H150 M78 106 H168" stroke="#4a3a28" stroke-width="2.2" opacity=".7"/>' +
      '<circle cx="168" cy="104" r="11" fill="#b8312b"/><path d="M162 112 L158 132 L168 124 L178 132 L174 112Z" fill="#9c2620"/>' + shadow(120, 134, 76, 4);
  };
  SC.engine = function (u) {
    return back(u, '#aab6c2', '#e3e6e8', 118, '#6a6a68', '#46464a') + cloud(60, 26, 1.1, .9) + cloud(176, 44, .9, .7) +
      '<rect x="68" y="76" width="104" height="44" rx="6" fill="#3d4a58"/><rect x="62" y="68" width="40" height="52" rx="6" fill="#4a5968"/><circle cx="82" cy="94" r="10" fill="#c9a040" stroke="#8a6a1c" stroke-width="2"/>' +
      '<rect x="98" y="44" width="16" height="34" fill="#2e2e32"/><path d="M96 44 H116 L112 38 H100Z" fill="#2e2e32"/><path d="M106 36 C92 24 112 14 104 6" stroke="#f4f4f4" stroke-width="7" fill="none" opacity=".8" stroke-linecap="round"/>' +
      '<circle cx="104" cy="120" r="16" fill="#b8312b" stroke="#6a1c18" stroke-width="3"/><circle cx="156" cy="124" r="12" fill="#b8312b" stroke="#6a1c18" stroke-width="3"/><path d="M104 120 L156 124" stroke="#c9a040" stroke-width="4"/>' +
      '<rect x="0" y="134" width="240" height="4" fill="#2e2e32"/>' + shadow(120, 140, 80, 3);
  };
  SC.flask = function (u) {
    return back(u, '#cfe5ea', '#eef6f2', 120, '#c9d6d2', '#a5b8b2') +
      '<path d="M104 30 H136 V62 L170 118 Q176 132 160 134 H80 Q64 132 70 118 L104 62Z" fill="#f8fdfd" stroke="#6d8a94" stroke-width="3" opacity=".95"/>' +
      '<path d="M88 100 Q120 90 152 100 L166 122 Q170 130 160 130 H80 Q70 130 74 122Z" fill="#4fb3a0"/><circle cx="110" cy="112" r="4" fill="#bff0e6"/><circle cx="130" cy="106" r="3" fill="#bff0e6"/><circle cx="122" cy="118" r="2.5" fill="#bff0e6"/>' +
      '<rect x="100" y="24" width="40" height="8" rx="3" fill="#8a6a46"/><path d="M110 34 V60" stroke="#fff" stroke-width="3" opacity=".6"/>' + shadow(120, 138, 56, 4);
  };
  SC.battery = function (u) {
    var o = back(u, '#3d3f63', '#7a6a8a', 120, '#4a3f36', '#2e2822');
    for (var i = 0; i < 5; i++) o += '<ellipse cx="120" cy="' + (112 - i * 14) + '" rx="34" ry="8" fill="' + (i % 2 ? '#d8d2c4' : '#c9894a') + '"/><rect x="86" y="' + (112 - i * 14) + '" width="68" height="6" fill="' + (i % 2 ? '#c4bdad' : '#a9703a') + '"/>';
    return o + '<ellipse cx="120" cy="42" rx="34" ry="8" fill="#d8d2c4"/><path d="M154 112 Q190 100 190 70 Q190 54 176 50" stroke="#c9894a" stroke-width="3" fill="none"/><path d="M168 28 L158 46 H168 L162 62 L180 40 H170Z" fill="#ffd34f"/>' + shadow(120, 128, 40, 4);
  };
  SC.train = function (u) {
    return back(u, '#8fc0e4', '#f0e6c8', 112, '#7a9a54', '#5a7a3a') + cloud(60, 28, 1) + cloud(190, 36, .8) + mtn(50, 108, 100, 40, '#8aa6b8') + mtn(200, 108, 110, 48, '#7a98ac') +
      '<rect x="0" y="128" width="240" height="6" fill="#6b5a46"/><path d="M0 134 H240" stroke="#3a3a3a" stroke-width="3"/><g fill="#5a4630">' + [8, 36, 64, 92, 120, 148, 176, 204].map(function (x) { return '<rect x="' + x + '" y="134" width="14" height="6"/>'; }).join('') + '</g>' +
      '<rect x="46" y="86" width="82" height="36" rx="3" fill="#2f3a46"/><rect x="42" y="74" width="34" height="48" rx="3" fill="#2f3a46"/><rect x="86" y="62" width="14" height="28" fill="#2f3a46"/><path d="M82 62 H104 L100 54 H86Z" fill="#2f3a46"/>' +
      '<rect x="46" y="78" width="26" height="14" fill="#9fd0e6"/><rect x="40" y="70" width="40" height="5" fill="#b8312b"/><path d="M128 122 H148 V104 H128Z" fill="#b8312b"/><path d="M128 100 L152 118 V122 H128Z" fill="#8a2420"/>' +
      '<circle cx="62" cy="126" r="10" fill="#b8312b" stroke="#2f3a46" stroke-width="3"/><circle cx="92" cy="126" r="10" fill="#b8312b" stroke="#2f3a46" stroke-width="3"/><circle cx="116" cy="128" r="7" fill="#b8312b" stroke="#2f3a46" stroke-width="3"/>' +
      '<rect x="150" y="90" width="64" height="32" rx="3" fill="#a05a2c"/><rect x="156" y="96" width="14" height="12" fill="#e8c88a"/><rect x="176" y="96" width="14" height="12" fill="#e8c88a"/><rect x="196" y="96" width="14" height="12" fill="#e8c88a"/>' +
      '<circle cx="164" cy="126" r="7" fill="#2f3a46"/><circle cx="200" cy="126" r="7" fill="#2f3a46"/><path d="M92 56 C84 44 96 36 90 26" stroke="#fff" stroke-width="7" fill="none" opacity=".85" stroke-linecap="round"/>';
  };
  SC.telegraph = function (u) {
    return back(u, '#b98c58', '#e5cfa2', 110, '#6a4526', '#4a2f18') +
      '<rect x="48" y="96" width="144" height="24" rx="4" fill="#5a3a1c"/><rect x="60" y="88" width="120" height="10" rx="3" fill="#7a5230"/>' +
      '<rect x="78" y="70" width="8" height="20" fill="#c9a040"/><path d="M60 72 H132 L138 64 H66Z" fill="#c9a040"/><circle cx="62" cy="72" r="4" fill="#e5c25f"/><circle cx="134" cy="66" r="6" fill="#2c2c2c"/>' +
      '<path d="M138 66 Q168 40 188 54" stroke="#2c2c2c" stroke-width="2.5" fill="none"/><g fill="#2c2c2c" font-family="monospace" font-weight="900" font-size="15"><rect x="150" y="76" width="8" height="5"/><rect x="162" y="76" width="4" height="5"/><rect x="170" y="76" width="8" height="5"/></g>' +
      '<rect x="146" y="28" width="46" height="34" fill="#f4e8c6" stroke="#a8864a"/><path d="M152 38 H186 M152 46 H178 M152 54 H182" stroke="#4a3a28" stroke-width="2" stroke-dasharray="6 3"/>' + shadow(120, 124, 76, 3);
  };
  SC.phone = function (u) {
    return back(u, '#7e6a5a', '#c9b49a', 120, '#5b4636', '#3e2f23') +
      '<rect x="92" y="40" width="56" height="78" rx="6" fill="#4a3320"/><rect x="100" y="48" width="40" height="40" rx="3" fill="#2c1e12"/><circle cx="120" cy="68" r="9" fill="#c9a040"/><circle cx="120" cy="68" r="4" fill="#2c1e12"/>' +
      '<rect x="108" y="22" width="24" height="16" rx="3" fill="#c9a040"/><rect x="114" y="38" width="12" height="6" fill="#6b4a2b"/>' +
      '<path d="M80 74 Q72 70 70 86 Q72 100 82 96 L92 92 V80Z" fill="#2c1e12"/><path d="M78 80 Q76 90 82 92" stroke="#6b4a2b" stroke-width="2" fill="none"/><path d="M74 96 Q64 120 100 128 H140" stroke="#2c1e12" stroke-width="3" fill="none"/>' +
      '<rect x="98" y="96" width="44" height="22" rx="3" fill="#6b4524"/><circle cx="106" cy="107" r="3" fill="#e5c25f"/><circle cx="120" cy="107" r="3" fill="#e5c25f"/><circle cx="134" cy="107" r="3" fill="#e5c25f"/>' + shadow(120, 130, 56, 3);
  };
  SC.bulb = function (u) {
    return back(u, '#1d2240', '#4a3f66', 124, '#3a2c20', '#241a12') + '<circle cx="120" cy="64" r="56" fill="#ffd34f" opacity=".18"/><circle cx="120" cy="64" r="38" fill="#ffd34f" opacity=".22"/>' +
      '<path d="M120 20 C92 20 82 46 92 66 C98 78 104 84 104 94 H136 C136 84 142 78 148 66 C158 46 148 20 120 20Z" fill="#fff6c8" stroke="#d8b84a" stroke-width="2"/>' +
      '<path d="M108 94 V64 M132 94 V64 M108 64 Q114 52 120 64 Q126 52 132 64" stroke="#c97a1c" stroke-width="2.5" fill="none"/>' +
      '<rect x="104" y="94" width="32" height="8" fill="#b9b9b9"/><rect x="104" y="102" width="32" height="6" fill="#8a8a8a"/><rect x="104" y="108" width="32" height="6" fill="#b9b9b9"/><path d="M108 114 H132 L126 124 H114Z" fill="#6a6a6a"/>' +
      '<path d="M96 40 Q92 54 98 62" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>';
  };
  SC.car = function (u) {
    return back(u, '#b7d4ea', '#f1e9d3', 112, '#8a8f84', '#5f645c') + cloud(190, 30, 1) +
      '<path d="M56 100 Q58 66 100 64 L150 64 Q172 66 178 100Z" fill="#2f3f55"/><rect x="62" y="96" width="120" height="16" rx="4" fill="#1f2d40"/><path d="M70 98 Q74 76 100 74 H128 V98Z" fill="#b6dcec"/><path d="M134 74 H150 Q160 76 164 98 H134Z" fill="#b6dcec"/>' +
      '<circle cx="82" cy="116" r="20" fill="#3a2a1c"/><circle cx="82" cy="116" r="12" fill="#c9a040"/><circle cx="82" cy="116" r="4" fill="#3a2a1c"/><circle cx="160" cy="118" r="17" fill="#3a2a1c"/><circle cx="160" cy="118" r="10" fill="#c9a040"/><circle cx="160" cy="118" r="3" fill="#3a2a1c"/>' +
      '<rect x="184" y="92" width="14" height="6" rx="2" fill="#ffe27a"/><rect x="112" y="60" width="4" height="8" fill="#6a6a6a"/>' + shadow(120, 136, 80, 3);
  };
  SC.plane = function (u) {
    return back(u, '#7fb8e8', '#f2ead0', 118, '#8aa86a', '#617f4a') + sun(190, 34, 13) + cloud(50, 40, 1.2) + cloud(180, 100, .9, .7) +
      '<g transform="translate(120 74) rotate(-8)"><rect x="-70" y="-26" width="140" height="6" rx="2" fill="#e9d9a8" stroke="#8a6a2c"/><rect x="-70" y="6" width="140" height="6" rx="2" fill="#e9d9a8" stroke="#8a6a2c"/><path d="M-50 -20 V6 M-20 -20 V6 M20 -20 V6 M50 -20 V6" stroke="#6b4a2b" stroke-width="2"/>' +
      '<path d="M-14 -8 Q-8 -14 8 -12 L30 -6 L30 2 L8 6 Q-8 8 -14 2Z" fill="#8a5a2c"/><circle cx="-18" cy="-3" r="6" fill="#6b4a2b"/><path d="M-18 -16 V10" stroke="#2c2c2c" stroke-width="3"/><path d="M30 -6 L58 -4 V0 L30 2Z" fill="#a67a3a"/><path d="M46 -18 V10" stroke="#a67a3a" stroke-width="3"/><circle cx="-4" cy="-6" r="4" fill="#f2d6b0"/></g>' +
      '<path d="M0 138 Q60 130 120 138 T240 136 V160 H0Z" fill="#5c7f3e"/>';
  };
  SC.pole = function (u) {
    return back(u, '#bcd8ec', '#f6fafc', 100, '#eef4f8', '#cfdde8') + cloud(190, 28, 1, .8) + mtn(40, 104, 80, 34, '#d3e1ec', true) +
      '<path d="M0 108 Q60 100 120 108 T240 104" stroke="#aac2d4" stroke-width="2" fill="none"/>' +
      '<rect x="118" y="44" width="3" height="84" fill="#6b4a2b"/><path d="M121 44 L156 52 L121 62Z" fill="#c8302a"/><path d="M121 44 L156 52 L121 62Z" fill="#fff" opacity=".0"/>' +
      '<path d="M121 52 L146 56 L121 60Z" fill="#fff"/>' +
      '<g transform="translate(70 118)"><ellipse cx="0" cy="-4" rx="10" ry="12" fill="#2f4a6a"/><circle cx="0" cy="-20" r="6" fill="#e8c8a0"/><path d="M-6 -22 Q0 -30 6 -22" fill="#8a2c2c"/></g>' + shadow(120, 130, 30, 3) +
      '<g transform="translate(176 122)"><rect x="-14" y="-8" width="28" height="14" rx="3" fill="#b8312b"/><circle cx="-8" cy="8" r="4" fill="#3a3a3a"/><circle cx="8" cy="8" r="4" fill="#3a3a3a"/></g>';
  };
  SC.peace = function (u) {
    return back(u, '#f6dca8', '#fdf3d8', 112, '#9cb878', '#6f9356') + sun(120, 54, 20, '#fff6c8') +
      '<path d="M70 120 Q100 70 150 60" stroke="#6b4a2b" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<g fill="#5f9a4a">' + [[84, 100, -30], [96, 86, -20], [110, 76, -10], [126, 68, 0], [92, 106, 20], [106, 94, 25], [120, 84, 30]].map(function (l) { return '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="11" ry="4.5" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"/>'; }).join('') + '</g>' +
      '<circle cx="150" cy="58" r="3" fill="#3a2a1c"/>' +
      '<g transform="translate(166 100)"><path d="M0 0 Q14 -26 34 -22 Q22 -6 14 0Z" fill="#fff" stroke="#c8c0aa"/><path d="M0 0 Q-16 -12 -12 -26 Q4 -20 8 -4Z" fill="#f2efe4" stroke="#c8c0aa"/><circle cx="32" cy="-22" r="3" fill="#fff" stroke="#c8c0aa"/><path d="M36 -22 L42 -20 L36 -19Z" fill="#e8a23a"/></g>';
  };
  SC.summit = function (u) {
    return back(u, '#4a7fc4', '#cfe3f4', 112, '#e9f1f8', '#c6d6e4') + sun(194, 30, 11, '#fff') +
      mtn(70, 128, 140, 70, '#8aa0b8', true) + mtn(160, 128, 190, 108, '#6f88a6', true) + mtn(120, 128, 70, 30, '#a9bacb') +
      '<path d="M160 20 V8" stroke="#6b4a2b" stroke-width="2"/><path d="M160 8 L176 12 L160 17Z" fill="#c8302a"/>' +
      '<g transform="translate(150 66)"><circle cx="0" cy="0" r="3" fill="#e8c8a0"/><rect x="-2.5" y="3" width="5" height="9" fill="#d9531e"/></g>' +
      '<path d="M120 128 H240 V160 H0 V132 Q60 124 120 128Z" fill="#dce8f2"/>';
  };
  SC.sat = function (u) {
    return back(u, '#050a1c', '#18294f', 160, '#18294f', '#18294f') + stars(36, 'sat') +
      '<circle cx="190" cy="150" r="70" fill="#2f78c0"/><path d="M150 112 Q170 96 196 100 Q212 106 222 120 Q190 118 170 132 Q158 124 150 112Z" fill="#69a64c"/><circle cx="190" cy="150" r="70" fill="none" stroke="#9fd0f0" stroke-width="3" opacity=".5"/>' +
      '<g transform="translate(84 62) rotate(-24)"><rect x="-14" y="-10" width="28" height="20" rx="2" fill="#c9ccd2"/><rect x="-14" y="-10" width="28" height="6" fill="#e5c25f"/><rect x="-62" y="-8" width="44" height="16" fill="#25488a" stroke="#9fb4e0"/><rect x="18" y="-8" width="44" height="16" fill="#25488a" stroke="#9fb4e0"/><path d="M-50 -8 V8 M-40 -8 V8 M-30 -8 V8 M30 -8 V8 M40 -8 V8 M50 -8 V8" stroke="#9fb4e0" stroke-width=".8"/><path d="M0 -10 V-22" stroke="#c9ccd2" stroke-width="2"/><circle cx="0" cy="-24" r="3" fill="#c9ccd2"/></g>';
  };
  SC.rocket = function (u) {
    return back(u, '#1a3f7a', '#f0a868', 118, '#6b6a5c', '#46453c') + stars(10, 'rk') +
      '<path d="M120 14 C140 34 144 70 140 104 H100 C96 70 100 34 120 14Z" fill="#f2f2ee"/><path d="M120 14 C130 24 136 34 138 44 H102 C104 34 110 24 120 14Z" fill="#c8302a"/><circle cx="120" cy="66" r="9" fill="#7cc0e8" stroke="#8a8a8a" stroke-width="3"/>' +
      '<path d="M100 84 L80 116 L100 108Z M140 84 L160 116 L140 108Z" fill="#c8302a"/><rect x="108" y="104" width="24" height="8" fill="#6a6a6a"/>' +
      '<path d="M108 112 Q120 160 132 112 Q120 126 108 112Z" fill="#ffb02e"/><path d="M114 112 Q120 140 126 112Z" fill="#fff3a8"/>' +
      '<ellipse cx="90" cy="128" rx="34" ry="12" fill="#fff" opacity=".7"/><ellipse cx="150" cy="130" rx="34" ry="12" fill="#fff" opacity=".7"/>';
  };
  SC.moon = function (u) {
    return back(u, '#02040c', '#0c1226', 108, '#a8a49c', '#6f6c66') + stars(30, 'moon') + '<circle cx="190" cy="42" r="22" fill="#2f78c0"/><path d="M180 34 Q194 28 204 38 Q196 46 188 50 Q178 44 180 34Z" fill="#69a64c"/>' +
      '<ellipse cx="50" cy="124" rx="22" ry="5" fill="#85817a"/><ellipse cx="190" cy="136" rx="30" ry="6" fill="#85817a"/><ellipse cx="120" cy="146" rx="14" ry="3" fill="#85817a"/>' +
      '<g transform="translate(112 90)"><path d="M-10 6 L-14 26 H-4 L0 16 L4 26 H14 L10 6Z" fill="#e8e8e6"/><rect x="-11" y="-14" width="22" height="24" rx="8" fill="#f2f2ee"/><rect x="-14" y="-6" width="6" height="14" rx="3" fill="#d6d6d2"/><circle cx="0" cy="-22" r="12" fill="#f2f2ee"/><path d="M-8 -26 Q0 -34 8 -26 V-18 Q0 -12 -8 -18Z" fill="#d89a2a"/><path d="M-6 -24 Q0 -30 6 -24" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></g>' +
      '<path d="M130 70 V120" stroke="#cfcfcb" stroke-width="2.5"/><path d="M130 72 L160 78 L130 88Z" fill="#fff"/><path d="M130 72 L146 75 L130 80Z" fill="#c8302a"/><path d="M130 80 L146 82 L130 86Z" fill="#2d4a9a"/>';
  };
  SC.dna = function (u) {
    var o = back(u, '#14305a', '#2f6aa0', 160, '#2f6aa0', '#2f6aa0'), a = '', b = '', rungs = '';
    for (var i = 0; i <= 14; i++) {
      var y = 12 + i * 10, x1 = 120 + Math.sin(i * 0.8) * 38, x2 = 120 - Math.sin(i * 0.8) * 38;
      a += (i ? 'L' : 'M') + x1.toFixed(1) + ' ' + y; b += (i ? 'L' : 'M') + x2.toFixed(1) + ' ' + y;
      rungs += '<path d="M' + x1.toFixed(1) + ' ' + y + ' H' + x2.toFixed(1) + '" stroke="' + (i % 2 ? '#ffd34f' : '#7fe0b0') + '" stroke-width="3.5" opacity=".9"/>';
    }
    return o + stars(14, 'dna') + rungs + '<path d="' + a + '" stroke="#ff8aa8" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="' + b + '" stroke="#8ad0ff" stroke-width="5" fill="none" stroke-linejoin="round"/>';
  };
  SC.web = function (u) {
    var o = back(u, '#173a6b', '#2f78c0', 160, '#2f78c0', '#2f78c0'), pts = [[120, 34], [60, 62], [180, 58], [86, 112], [160, 116], [40, 110], [204, 100]];
    o += '<circle cx="120" cy="80" r="46" fill="#1d5a96" stroke="#9fd0f0" stroke-width="2"/><ellipse cx="120" cy="80" rx="46" ry="14" fill="none" stroke="#9fd0f0" stroke-width=".8"/><ellipse cx="120" cy="80" rx="18" ry="46" fill="none" stroke="#9fd0f0" stroke-width=".8"/>';
    var edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 5], [2, 6], [3, 5], [4, 6], [0, 3], [0, 4]];
    edges.forEach(function (e) { o += '<path d="M' + pts[e[0]].join(' ') + ' L' + pts[e[1]].join(' ') + '" stroke="#ffd34f" stroke-width="2" opacity=".85"/>'; });
    pts.forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="#fff" stroke="#ffd34f" stroke-width="3"/>'; });
    return o;
  };

  // ---- Chile --------------------------------------------------------
  SC.mummy = function (u) {
    return back(u, '#f2c27c', '#f9e3b4', 100, '#d9b072', '#b88c4c') + sun(196, 36, 13, '#fff1c4') + '<path d="M0 100 Q60 90 120 98 T240 94 V108 H0Z" fill="#3d86a8" opacity=".6"/>' +
      '<g transform="translate(120 76)"><ellipse cx="0" cy="48" rx="26" ry="5" fill="#2b1d10" opacity=".25"/><path d="M-16 44 Q-18 6 -10 -8 H10 Q18 6 16 44Z" fill="#cfa86b"/><path d="M-16 20 H16 M-17 32 H17 M-15 8 H15 M-12 -2 H12" stroke="#8a6a38" stroke-width="2" opacity=".7"/>' +
      '<ellipse cx="0" cy="-22" rx="15" ry="19" fill="#b98f55"/><path d="M-15 -26 Q0 -52 15 -26 Q10 -34 0 -34 Q-10 -34 -15 -26Z" fill="#2a1d14"/><circle cx="-5" cy="-24" r="2.4" fill="#2a1d14"/><circle cx="5" cy="-24" r="2.4" fill="#2a1d14"/><path d="M-4 -12 Q0 -9 4 -12" stroke="#2a1d14" stroke-width="2" fill="none"/></g>' +
      '<g stroke="#8a6a38" stroke-width="2" fill="none"><path d="M30 130 q10 -12 22 0 M188 128 q10 -10 22 0"/></g>';
  };
  SC.moai = function (u) {
    var o = back(u, '#8fcbe8', '#e8f2dc', 104, '#7ba44a', '#557a32') + cloud(50, 30, 1) + cloud(190, 22, .8) + '<path d="M0 104 Q60 98 120 104 T240 100 V110 H0Z" fill="#2d7fae"/>';
    function moai(x, s) {
      return '<g transform="translate(' + x + ' 128) scale(' + s + ')"><path d="M-17 0 L-14 -56 Q-14 -76 -8 -80 H8 Q14 -76 14 -56 L17 0Z" fill="#6f6a60"/><path d="M-17 0 L-14 -56 Q-14 -76 -8 -80 L-6 -80 L-6 0Z" fill="#847e72"/><path d="M-12 -62 H12 L10 -70 H-10Z" fill="#555048"/><path d="M-3 -62 L-5 -40 H4 L2 -62Z" fill="#5a554c"/><path d="M-9 -46 H9" stroke="#4a463f" stroke-width="2.5"/><path d="M-14 -34 q-6 14 -3 24 M14 -34 q6 14 3 24" stroke="#5a554c" stroke-width="3" fill="none"/></g>';
    }
    return o + moai(70, .85) + moai(120, 1) + moai(170, .9) + shadow(120, 130, 100, 4);
  };
  SC.plaza = function (u) {
    return back(u, '#f2b87a', '#fde8c4', 108, '#c8a878', '#a68754') + sun(40, 44, 12) +
      '<rect x="22" y="70" width="64" height="46" fill="#f0e2c0"/><rect x="154" y="64" width="64" height="52" fill="#e5cfa4"/><path d="M18 70 H90 L86 62 H22Z" fill="#a8412c"/><path d="M150 64 H222 L218 56 H154Z" fill="#a8412c"/>' +
      win(34, 82, 10, 16) + win(56, 82, 10, 16) + win(166, 78, 10, 16) + win(190, 78, 10, 16) + '<rect x="30" y="102" width="52" height="14" fill="#cdb98e" opacity=".6"/>' +
      '<rect x="104" y="46" width="32" height="70" fill="#f6ecd2"/><path d="M104 46 L120 28 L136 46Z" fill="#a8412c"/><path d="M120 28 V16 M114 22 H126" stroke="#5a3a1c" stroke-width="2.5"/><path d="M112 116 V90 Q120 78 128 90 V116Z" fill="#4a3320"/><circle cx="120" cy="64" r="6" fill="#d9a53a"/>' +
      '<g transform="translate(120 130)"><ellipse rx="22" ry="6" fill="#b9a67c"/><ellipse cy="-2" rx="16" ry="4" fill="#5aa0c0"/><rect x="-2" y="-14" width="4" height="12" fill="#c9bfa0"/></g>' + shadow(120, 120, 100, 3);
  };
  SC.island = function (u) {
    return back(u, '#8fd0ea', '#f4efd2', 98, '#e9d49a', '#cdb472') + cloud(48, 26, 1) + sun(196, 34, 11) +
      '<path d="M0 98 Q60 90 120 98 T240 94 V120 H0Z" fill="#2d9ac0"/><path d="M0 108 Q60 102 120 110 T240 106" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>' +
      '<path d="M40 130 Q70 100 120 104 Q170 102 200 130 Z" fill="#e3cc8a"/>' + palm(92, 116, 1.5) + palm(148, 114, 1.2) +
      '<path d="M120 122 L136 108 L152 122Z" fill="#8a5a2c"/><path d="M118 122 L136 104 L154 122" stroke="#4a3320" stroke-width="2" fill="none"/><path d="M60 130 Q70 128 78 132" stroke="#a88c4a" stroke-width="2" fill="none"/>';
  };
  SC.school = function (u) {
    return back(u, '#9cc4e6', '#f2e9cf', 112, '#7fa85a', '#5e8a42') + cloud(190, 28, 1) +
      '<rect x="36" y="64" width="168" height="54" fill="#efe3c4"/><path d="M28 64 L120 36 L212 64Z" fill="#d8c9a0"/><path d="M28 64 L120 36 L120 44 L40 66Z" fill="#fff" opacity=".4"/><circle cx="120" cy="54" r="7" fill="#b8312b"/>' +
      [48, 74, 100, 138, 164, 190].map(function (x) { return '<rect x="' + x + '" y="76" width="12" height="20" fill="#3a2a1c"/><path d="M' + x + ' 76 Q' + (x + 6) + ' 70 ' + (x + 12) + ' 76Z" fill="#3a2a1c"/>'; }).join('') +
      '<rect x="108" y="86" width="24" height="32" fill="#5a3a1c"/><path d="M108 86 Q120 72 132 86Z" fill="#5a3a1c"/><rect x="100" y="118" width="40" height="5" fill="#cdbf9d"/><rect x="94" y="123" width="52" height="5" fill="#bcad88"/>' +
      '<path d="M120 36 V18" stroke="#6b4a2b" stroke-width="2"/><path d="M120 18 L136 22 L120 27Z" fill="#c8302a"/>' + shadow(120, 130, 90, 3);
  };
  SC.flag = function (u) {
    return back(u, '#8dc4ea', '#e9f1dc', 118, '#7ba44a', '#557a32') + cloud(50, 30, 1) + cloud(190, 40, .8) + mtn(46, 118, 100, 54, '#8fa6b8', true) + mtn(196, 118, 110, 64, '#7d97ac', true) +
      '<rect x="58" y="20" width="4" height="112" fill="#6b4a2b"/><circle cx="60" cy="18" r="4" fill="#d9a53a"/>' +
      '<g><path d="M62 24 Q96 18 130 26 T198 26 V76 Q164 84 130 76 T62 76Z" fill="#fff"/><path d="M62 76 V50 Q96 44 130 52 T198 52 V76 Q164 84 130 76 T62 76Z" fill="#fff"/><path d="M62 50 Q96 44 130 52 T198 52 V76 Q164 84 130 76 T62 76Z" fill="#d52b1e"/><path d="M62 24 Q80 20 96 22 V50 Q80 48 62 50Z" fill="#0039a6"/><path d="M62 24 Q96 18 130 26 T198 26 V52 Q164 58 130 52 T62 50Z" fill="none"/></g>' +
      '<path d="M79 29 l2.3 7 7.2 0 -5.8 4.3 2.2 7 -5.9 -4.3 -5.9 4.3 2.2 -7 -5.8 -4.3 7.2 0z" fill="#fff"/>' + shadow(60, 132, 22, 3);
  };
  SC.andes = function (u) {
    return back(u, '#6aa4dc', '#f4ead2', 112, '#a8a898', '#7d7d70') + sun(46, 36, 11, '#fff') + mtn(60, 116, 130, 76, '#8a96a8', true) + mtn(170, 116, 150, 98, '#76849a', true) + mtn(116, 116, 90, 50, '#9aa6b6', true) + cloud(190, 30, .9, .7) +
      '<path d="M20 146 Q70 124 112 130 T210 112" stroke="#6b5a46" stroke-width="4" fill="none" stroke-dasharray="2 5" stroke-linecap="round"/>' +
      [[60, 138], [96, 130], [130, 132], [166, 122]].map(function (p) { return '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><ellipse cx="0" cy="0" rx="8" ry="4.5" fill="#7a5a3a"/><rect x="-6" y="3" width="2" height="6" fill="#5a3f26"/><rect x="4" y="3" width="2" height="6" fill="#5a3f26"/><path d="M6 -1 L10 -7" stroke="#7a5a3a" stroke-width="3"/><rect x="-5" y="-6" width="10" height="5" fill="#c8302a"/></g>'; }).join('');
  };
  SC.helmet = function (u) {
    return back(u, '#f08a4c', '#fcd9a0', 120, '#6a5a4a', '#46382c') +
      '<path d="M66 100 Q68 50 120 44 Q172 50 174 100Z" fill="#c8302a"/><path d="M60 100 H180 Q184 112 170 112 H70 Q56 112 60 100Z" fill="#a82420"/><path d="M104 44 Q120 28 136 44Z" fill="#c8302a"/><rect x="110" y="30" width="20" height="14" rx="3" fill="#a82420"/>' +
      '<path d="M86 96 Q88 62 120 58 Q152 62 154 96Z" fill="#e8b830"/><path d="M96 86 Q120 70 144 86" stroke="#fff3a8" stroke-width="3" fill="none"/><path d="M92 106 H148" stroke="#6a1c18" stroke-width="2"/>' +
      '<path d="M74 70 Q78 58 90 54" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/><path d="M30 128 q20 -30 4 -60 q26 18 14 60Z" fill="#f0701c" opacity=".85"/><path d="M200 126 q-18 -26 -2 -52 q22 16 12 52Z" fill="#f0701c" opacity=".85"/>' + shadow(120, 124, 64, 4);
  };
  SC.quake = function (u) {
    return back(u, '#c9b79a', '#eadcc0', 102, '#7a6a52', '#54463a') + mtn(60, 102, 100, 40, '#9a8a74') + mtn(180, 102, 120, 52, '#8a7a64') +
      '<path d="M0 102 L80 102 L92 116 L74 124 L98 138 L84 160 H0Z" fill="#5a4a38"/><path d="M92 116 L98 104 L240 104 V160 H84 L98 138 L74 124Z" fill="#6f5e48"/>' +
      '<path d="M0 124 H20 L28 112 L38 136 L48 108 L58 140 L68 118 H240" stroke="#b8312b" stroke-width="3" fill="none" transform="translate(0 -52) scale(1 .7) translate(0 40)"/>' +
      '<g transform="translate(150 60)"><rect x="-30" y="0" width="60" height="30" rx="3" fill="#f6ecd2" stroke="#8a7a60"/><path d="M-26 22 H-14 L-10 8 L-4 26 L2 4 L8 24 L12 14 H26" stroke="#b8312b" stroke-width="2.2" fill="none"/></g>';
  };
  SC.soccer = function (u) {
    return back(u, '#8cc4ea', '#e8f1d6', 96, '#5c9a3e', '#3e7a2c') + cloud(190, 26, 1) +
      '<g stroke="#fff" stroke-width="2" fill="none" opacity=".8"><path d="M0 120 H240"/><path d="M120 100 V160"/><ellipse cx="120" cy="130" rx="40" ry="10"/></g>' +
      '<path d="M30 100 V70 H60 V100" stroke="#f4f4f4" stroke-width="3" fill="none"/><path d="M30 76 H60 M30 84 H60 M30 92 H60 M40 70 V100 M50 70 V100" stroke="#f4f4f4" stroke-width=".8" opacity=".6"/>' +
      '<circle cx="132" cy="92" r="30" fill="#fff" stroke="#2c2c2c" stroke-width="2.5"/><path d="M132 78 l12 9 -5 14 h-14 l-5 -14z" fill="#2c2c2c"/><path d="M132 62 V78 M144 87 L158 82 M139 101 L148 114 M125 101 L116 114 M120 87 L106 82" stroke="#2c2c2c" stroke-width="2"/>' + shadow(132, 124, 30, 5);
  };
  SC.capsule = function (u) {
    return back(u, '#c9a070', '#f0d8a8', 116, '#9a7448', '#6e4e2c') + mtn(40, 112, 100, 46, '#b08a5c') + mtn(200, 112, 110, 54, '#a47e50') + sun(206, 30, 11) +
      '<rect x="40" y="46" width="6" height="68" fill="#4a3a2c"/><rect x="34" y="40" width="18" height="10" fill="#6a5a46"/><circle cx="43" cy="46" r="9" fill="#8a7a62" stroke="#4a3a2c" stroke-width="2"/><circle cx="43" cy="46" r="3" fill="#2c2c2c"/><path d="M43 55 L120 80" stroke="#3a3a3a" stroke-width="1.8"/>' +
      '<g transform="translate(130 62)"><path d="M-12 0 Q-14 -12 0 -14 Q14 -12 12 0 V40 Q0 50 -12 40Z" fill="#e8c02a"/><path d="M-12 14 H12 M-12 28 H12" stroke="#b8312b" stroke-width="4"/><circle cx="0" cy="-2" r="5" fill="#fff"/><circle cx="0" cy="-2" r="5" fill="none" stroke="#6b4a2b" stroke-width="2"/></g>' +
      '<path d="M0 124 Q60 118 120 126 T240 122 V160 H0Z" fill="#7a5a36"/><rect x="154" y="112" width="36" height="12" rx="3" fill="#2d6e9e"/><circle cx="162" cy="126" r="5" fill="#2c2c2c"/><circle cx="182" cy="126" r="5" fill="#2c2c2c"/>';
  };
  SC.theatre = function (u) {
    var o = back(u, '#3d1f2f', '#a8482c', 118, '#4a2a1c', '#2e1a10') + '<rect x="40" y="56" width="160" height="62" fill="#eadcb8"/><path d="M32 56 H208 L120 26Z" fill="#d6c394"/><path d="M120 26 L208 56 H120Z" fill="#c4ae7c"/><circle cx="120" cy="46" r="7" fill="#b8312b"/>';
    for (var i = 0; i < 6; i++) o += '<rect x="' + (50 + i * 27) + '" y="62" width="9" height="56" fill="#f8f0d6"/>';
    return o + '<rect x="100" y="86" width="40" height="32" fill="#5a1c1c"/><path d="M100 86 Q120 74 140 86" fill="#3a1010"/><rect x="34" y="118" width="172" height="8" fill="#c9b684"/><g fill="#ffe27a" opacity=".9"><circle cx="52" cy="130" r="3"/><circle cx="188" cy="130" r="3"/></g>' + shadow(120, 134, 92, 3);
  };

  // ---- Church -------------------------------------------------------
  SC.nativity = function (u) {
    return back(u, '#141f4a', '#3a3a78', 112, '#5e4a2c', '#3e2f1b') + stars(26, 'nat') +
      '<g transform="translate(150 22)"><path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="#fff6a8"/><circle r="22" fill="#fff6a8" opacity=".25"/></g>' +
      '<path d="M44 112 V62 L120 36 L196 62 V112Z" fill="#8a6038"/><path d="M36 64 L120 32 L204 64 L196 70 L120 42 L44 70Z" fill="#6a4524"/><path d="M60 112 V74 L120 52 L180 74 V112Z" fill="#2a1d14"/>' +
      '<g transform="translate(108 112)"><rect x="-26" y="-14" width="52" height="14" rx="3" fill="#a0722e"/><rect x="-22" y="-20" width="44" height="9" rx="4" fill="#e8c860"/><ellipse cx="0" cy="-26" rx="12" ry="6" fill="#fdf4e0"/><circle cx="-6" cy="-31" r="5" fill="#f2d2b0"/></g>' +
      '<circle cx="150" cy="86" r="9" fill="#e8c8a0"/><path d="M138 112 Q140 90 150 92 Q162 92 164 112Z" fill="#3d6aa8"/><circle cx="82" cy="82" r="9" fill="#e8c8a0"/><path d="M70 112 Q72 90 82 92 Q94 92 96 112Z" fill="#a8412c"/>' +
      '<circle cx="82" cy="82" r="13" fill="none" stroke="#ffe27a" stroke-width="1.6" opacity=".7"/><circle cx="150" cy="86" r="13" fill="none" stroke="#ffe27a" stroke-width="1.6" opacity=".7"/>' +
      '<path d="M0 112 H240 V160 H0Z" fill="#4a3a22"/>';
  };
  SC.cross = function (u) {
    return back(u, '#f9c97a', '#fdeec8', 108, '#7a9a5a', '#5a7a40') + sun(120, 74, 38, '#fff6c8') +
      '<path d="M0 108 Q60 96 120 108 T240 104 V160 H0Z" fill="#6c8c4a"/>' +
      '<rect x="112" y="38" width="16" height="84" fill="#7a4e24"/><rect x="88" y="58" width="64" height="16" fill="#7a4e24"/><rect x="112" y="38" width="6" height="84" fill="#9a6a38"/><rect x="88" y="58" width="64" height="6" fill="#9a6a38"/>' +
      '<g fill="#fff" stroke="#d9d0b8"><ellipse cx="60" cy="124" rx="3" ry="5"/><ellipse cx="180" cy="128" rx="3" ry="5"/></g>' + shadow(120, 124, 34, 4) +
      '<g>' + [[52, 120], [72, 126], [168, 124], [190, 120]].map(function (p) { return '<path d="M' + p[0] + ' ' + p[1] + ' v-10" stroke="#4f7a38" stroke-width="2"/><circle cx="' + p[0] + '" cy="' + (p[1] - 12) + '" r="4" fill="#f4d34f"/>'; }).join('') + '</g>';
  };
  SC.flame = function (u) {
    var o = back(u, '#2a1740', '#6a3a60', 120, '#3e2a24', '#241812') + stars(8, 'fl') + '<rect x="56" y="64" width="128" height="58" fill="#5a4636"/><path d="M48 64 L120 30 L192 64Z" fill="#3a2a1f"/><rect x="104" y="86" width="32" height="36" fill="#1d130c"/>';
    [[84, 56], [120, 40], [156, 56]].forEach(function (p, i) { o += '<g transform="translate(' + p[0] + ' ' + (p[1] - 4) + ')"><path d="M0 -26 C10 -14 14 -4 8 6 C4 12 -4 12 -8 6 C-14 -4 -10 -14 0 -26Z" fill="#f08a1c"/><path d="M0 -14 C6 -6 8 0 4 5 C1 8 -3 8 -4 4 C-6 -2 -3 -8 0 -14Z" fill="#ffe27a"/></g>'; });
    return o + '<g transform="translate(160 36)"><path d="M0 0 C-8 -10 8 -16 0 -26 C14 -14 12 -4 6 0Z" fill="#fff" opacity=".0"/></g><path d="M40 118 Q120 100 200 118" stroke="#fff3a8" stroke-width="2" fill="none" opacity=".4"/>';
  };
  SC.keys = function (u) {
    return back(u, '#cbb8e6', '#f6ecd4', 118, '#b8a478', '#8a7850') + sun(190, 36, 12, '#fff') +
      '<g transform="translate(96 84) rotate(-40)"><circle cx="0" cy="0" r="17" fill="none" stroke="#d9a53a" stroke-width="8"/><rect x="14" y="-4" width="64" height="8" fill="#d9a53a"/><rect x="58" y="4" width="8" height="14" fill="#d9a53a"/><rect x="70" y="4" width="8" height="10" fill="#d9a53a"/></g>' +
      '<g transform="translate(146 84) rotate(40)"><circle cx="0" cy="0" r="17" fill="none" stroke="#c0c4cc" stroke-width="8"/><rect x="-78" y="-4" width="64" height="8" fill="#c0c4cc"/><rect x="-66" y="4" width="8" height="14" fill="#c0c4cc"/><rect x="-78" y="4" width="8" height="10" fill="#c0c4cc"/></g>' +
      '<path d="M104 70 Q120 54 136 70" stroke="#a08850" stroke-width="3" fill="none"/>' + shadow(120, 128, 54, 4);
  };
  SC.council = function (u) {
    var o = back(u, '#d4b88a', '#f2e4c2', 112, '#8a6a46', '#5e4528') + '<rect x="24" y="30" width="192" height="78" fill="#efe0bc"/><path d="M24 30 H216" stroke="#a8864a" stroke-width="3"/>' + [48, 96, 144, 192].map(function (x) { return '<path d="M' + (x - 14) + ' 108 V54 Q' + x + ' 36 ' + (x + 14) + ' 54 V108" fill="#c9a870" opacity=".6"/>'; }).join('');
    o += '<ellipse cx="120" cy="112" rx="88" ry="26" fill="#6a4524"/><ellipse cx="120" cy="108" rx="82" ry="22" fill="#9a6a38"/>';
    var cl = ['#7b2a8c', '#f4f0e6', '#7b2a8c', '#f4f0e6', '#7b2a8c', '#f4f0e6', '#7b2a8c'];
    for (var i = 0; i < 7; i++) { var a = Math.PI * (0.12 + i * 0.126), x = 120 - Math.cos(a) * 66, y = 92 - Math.sin(a) * 4; o += '<g transform="translate(' + x.toFixed(0) + ' ' + (y + 8).toFixed(0) + ')"><path d="M-9 0 Q-9 -16 0 -16 Q9 -16 9 0Z" fill="' + cl[i] + '" stroke="#d6c9a8" stroke-width=".8"/><circle cx="0" cy="-22" r="6" fill="#e8c8a0"/><path d="M-4 -26 L0 -34 L4 -26Z" fill="' + (i % 2 ? '#d9a53a' : '#f4f0e6') + '"/></g>'; }
    return o + '<rect x="110" y="86" width="20" height="10" fill="#f6ecd2"/><path d="M114 90 H126 M114 93 H122" stroke="#4a3a28" stroke-width="1.2"/>';
  };
  SC.cathedral = function (u) {
    var o = back(u, '#8cb4e0', '#f4e8cc', 118, '#8a9a6a', '#617548') + cloud(34, 28, .9) + cloud(206, 38, .8) + '<path d="M60 118 V50 L76 20 L92 50 V118Z" fill="#d8ccb0"/><path d="M148 118 V50 L164 20 L180 50 V118Z" fill="#d8ccb0"/><rect x="92" y="64" width="56" height="54" fill="#e2d6ba"/>';
    o += '<path d="M76 20 V8 M70 14 H82" stroke="#8a7a5a" stroke-width="2"/><path d="M164 20 V8 M158 14 H170" stroke="#8a7a5a" stroke-width="2"/><circle cx="120" cy="82" r="14" fill="#cfa63c"/><circle cx="120" cy="82" r="10" fill="#3a6aa8"/><circle cx="120" cy="82" r="4" fill="#f4d34f"/>';
    [[76, 66], [164, 66]].forEach(function (p) { o += '<path d="M' + (p[0] - 6) + ' ' + (p[1] + 14) + ' V' + (p[1] + 2) + ' Q' + p[0] + ' ' + (p[1] - 8) + ' ' + (p[0] + 6) + ' ' + (p[1] + 2) + ' V' + (p[1] + 14) + 'Z" fill="#3a6aa8"/>'; });
    return o + '<path d="M108 118 V100 Q120 86 132 100 V118Z" fill="#4a3320"/><path d="M60 118 V104 M92 118 V104" stroke="#bcae8e" stroke-width="1"/><rect x="48" y="118" width="144" height="6" fill="#c9bc9a"/>' + shadow(120, 128, 92, 3);
  };
  SC.dome = function (u) {
    return back(u, '#7ab4e6', '#f6e8c8', 118, '#cbbd96', '#a49670') + cloud(40, 28, 1) + sun(206, 34, 11) +
      '<rect x="60" y="88" width="120" height="30" fill="#efe3c4"/><path d="M68 88 Q70 40 120 36 Q170 40 172 88Z" fill="#d8dce2"/><path d="M68 88 Q70 40 120 36 L120 88Z" fill="#fff" opacity=".35"/><path d="M96 82 Q98 52 120 46 M144 82 Q142 52 120 46" stroke="#a8aeb8" stroke-width="1.5" fill="none"/>' +
      '<rect x="106" y="22" width="28" height="18" fill="#efe3c4"/><path d="M104 22 Q120 4 136 22Z" fill="#d8dce2"/><path d="M120 6 V-2" stroke="#d9a53a" stroke-width="2" transform="translate(0 4)"/><path d="M116 10 H124" stroke="#d9a53a" stroke-width="2"/>' +
      [66, 90, 114, 138, 162].map(function (x) { return '<rect x="' + x + '" y="90" width="7" height="26" fill="#f8f0d8"/>'; }).join('') + '<rect x="52" y="118" width="136" height="6" fill="#bcae8e"/><rect x="44" y="124" width="152" height="6" fill="#a99a76"/>' + shadow(120, 134, 90, 3);
  };
  SC.calendar = function (u) {
    var o = back(u, '#cdb48a', '#efe0bc', 120, '#8a6a46', '#5e4528') + '<rect x="52" y="24" width="136" height="100" rx="6" fill="#fffaf0" stroke="#a8864a" stroke-width="2"/><path d="M52 30 Q52 24 58 24 H182 Q188 24 188 30 V50 H52Z" fill="#b8312b"/><circle cx="82" cy="24" r="4" fill="#6b4a2b"/><circle cx="158" cy="24" r="4" fill="#6b4a2b"/>';
    for (var r = 0; r < 4; r++) for (var c = 0; c < 6; c++) { var n = r * 6 + c; o += '<rect x="' + (62 + c * 20) + '" y="' + (58 + r * 16) + '" width="15" height="11" rx="2" fill="' + (n === 9 || n === 10 ? '#e8b830' : '#efe6d0') + '"/>'; }
    return o + '<path d="M130 54 l16 12 M146 54 l-16 12" stroke="#b8312b" stroke-width="2.4" opacity="0"/><path d="M124 64 L168 64" stroke="#b8312b" stroke-width="2.4" opacity="0"/>' + shadow(120, 134, 64, 3);
  };
  SC.crib = function (u) {
    return back(u, '#1c2a5a', '#46508a', 114, '#6a5a38', '#463a22') + stars(16, 'crib') + '<path d="M40 114 V70 Q40 50 70 44 L170 44 Q200 50 200 70 V114Z" fill="#5a4630"/><path d="M60 114 V76 Q60 62 80 58 H160 Q180 62 180 76 V114Z" fill="#2a1d14"/>' +
      '<rect x="92" y="96" width="56" height="12" rx="3" fill="#a0722e"/><ellipse cx="120" cy="92" rx="22" ry="8" fill="#e8c860"/><ellipse cx="120" cy="88" rx="12" ry="6" fill="#fdf4e0"/><circle cx="116" cy="84" r="5" fill="#f2d2b0"/>' +
      '<g transform="translate(64 112)"><ellipse cx="0" cy="-8" rx="14" ry="9" fill="#8a6a46"/><path d="M10 -12 L20 -22 L20 -10" fill="#8a6a46"/><rect x="-10" y="-2" width="3" height="8" fill="#6a4a2a"/><rect x="4" y="-2" width="3" height="8" fill="#6a4a2a"/></g>' +
      '<g transform="translate(180 112)"><ellipse cx="0" cy="-8" rx="13" ry="9" fill="#e8e0cc"/><circle cx="-10" cy="-14" r="6" fill="#e8e0cc"/><rect x="-6" y="-2" width="3" height="8" fill="#6a6050"/><rect x="6" y="-2" width="3" height="8" fill="#6a6050"/></g>' +
      '<g transform="translate(152 30)"><path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3Z" fill="#fff6a8"/></g><path d="M0 114 H240 V160 H0Z" fill="#4a3a22"/><path d="M92 100 L98 112 M148 100 L142 112" stroke="#5a3a1c" stroke-width="2"/>';
  };
  SC.grotto = function (u) {
    return back(u, '#7ea0b8', '#c8d4c4', 100, '#4a7a4a', '#2e5a34') + '<path d="M0 160 V60 Q30 20 90 24 Q140 26 160 60 L240 56 V160Z" fill="#6a665e"/><path d="M60 160 V84 Q64 52 110 50 Q156 52 160 84 V160Z" fill="#1d1a16"/>' +
      '<path d="M0 60 Q30 20 90 24" stroke="#8a867c" stroke-width="3" fill="none"/>' +
      '<g transform="translate(110 96)"><ellipse cx="0" cy="22" rx="12" ry="3" fill="#2b1d10" opacity=".25"/><path d="M-9 20 Q-10 -2 -4 -10 H4 Q10 -2 9 20Z" fill="#f6f2e8"/><circle cx="0" cy="-16" r="6" fill="#f2d6b0"/><path d="M-9 -12 Q0 -26 9 -12 L12 22 H-12Z" fill="#cfe0f2" opacity=".85"/><circle cx="0" cy="-16" r="14" fill="none" stroke="#ffe27a" stroke-width="1.6" opacity=".6"/><rect x="-9" y="2" width="18" height="3" fill="#6aa0d8"/></g>' +
      '<g fill="#e8e8e0">' + [[40, 140], [200, 134], [170, 148]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4"/>'; }).join('') + '</g>' +
      '<path d="M170 160 Q200 130 240 126 V160Z" fill="#3e8aa8" opacity=".7"/>';
  };
  SC.roses = function (u) {
    var o = back(u, '#f5c9a0', '#fde9cf', 108, '#8a9a5a', '#5f7a3e') + sun(120, 46, 36, '#fff3c0') + mtn(36, 108, 80, 32, '#b99a76') + mtn(210, 108, 90, 38, '#a8886a');
    o += '<path d="M78 40 H162 L150 124 H90Z" fill="#c9a06a"/><path d="M78 40 H162 L158 56 H82Z" fill="#a8784a"/><path d="M96 70 H144 M102 88 H138" stroke="#e8c880" stroke-width="2.5" opacity=".7"/><circle cx="120" cy="86" r="10" fill="#c8302a"/><circle cx="120" cy="86" r="5" fill="#8a1c18"/>';
    [[88, 128], [104, 134], [122, 130], [140, 136], [156, 128], [72, 138], [172, 138]].forEach(function (p, i) { o += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><path d="M0 4 L2 14" stroke="#3f7a38" stroke-width="2"/><circle r="6" fill="' + (i % 2 ? '#e8587a' : '#d9314a') + '"/><circle r="3.4" fill="#b81f38"/><path d="M-4 0 Q0 -4 4 0" stroke="#f9a8b8" stroke-width="1" fill="none"/></g>'; });
    return o;
  };
  SC.fresco = function (u) {
    return back(u, '#3e6aa8', '#9ec0e0', 160, '#9ec0e0', '#9ec0e0') + '<rect x="0" y="0" width="240" height="160" fill="#d9c7a0"/><path d="M0 0 H240 V160 H0Z" fill="#dec9a2"/>' +
      '<path d="M0 30 Q120 4 240 30 V160 H0Z" fill="#8ab4d8"/><path d="M0 30 Q120 4 240 30" stroke="#b8943c" stroke-width="6" fill="none"/>' + cloud(60, 52, 1.1, .9) + cloud(184, 40, .9, .9) +
      '<g transform="translate(60 90)"><path d="M-6 24 Q-10 0 4 -6 L30 -4 Q40 6 30 20 L10 30Z" fill="#c8302a" opacity=".9"/><path d="M-10 24 L30 14 L50 4 L56 8 L30 24 L-6 32Z" fill="#e8c8a0"/><circle cx="-2" cy="-8" r="9" fill="#e8c8a0"/><path d="M-10 -10 Q-2 -20 8 -10 L6 4Z" fill="#8a8a8a"/></g>' +
      '<g transform="translate(182 82)"><path d="M-30 10 Q-34 -16 -14 -22 L14 -22 Q30 -16 30 10Z" fill="#f2efe6"/><path d="M-30 10 L-60 14 L-80 18 L-82 12 L-56 6Z" fill="#e8c8a0"/><circle cx="2" cy="-30" r="10" fill="#e8c8a0"/><path d="M-8 -34 Q2 -46 14 -34 L14 -22 H-8Z" fill="#ccc"/></g>' +
      '<path d="M112 108 L130 106" stroke="#e8c8a0" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="104" r="12" fill="#ffe27a" opacity=".35"/>';
  };
  SC.cathedral_ = SC.cathedral;

  // ------------------------------------------------------------------
  // Portraits
  // ------------------------------------------------------------------
  var SKIN = ['#f1cfa8', '#e5b98c', '#d9a577', '#c68e61', '#f6d9b8'];
  var HAIR = ['#2a1d14', '#4a3320', '#6b4a2b', '#a8782e', '#8a8a86', '#d8d4cc'];

  function face(skin, hair, o) {
    o = o || {};
    // head from y 36 to 80, centred at x 120
    return '<ellipse cx="120" cy="60" rx="19" ry="23" fill="' + skin + '"/>' +
      '<ellipse cx="111" cy="58" rx="2.4" ry="2.8" fill="#2a1d14"/><ellipse cx="129" cy="58" rx="2.4" ry="2.8" fill="#2a1d14"/>' +
      '<path d="M105 52 Q111 49 116 52 M124 52 Q129 49 135 52" stroke="' + hair + '" stroke-width="2" fill="none"/>' +
      '<path d="M120 60 V68 M115 70 Q120 73 125 70" stroke="#a8705a" stroke-width="1.6" fill="none"/>' +
      '<ellipse cx="104" cy="62" rx="3" ry="6" fill="' + skin + '"/><ellipse cx="136" cy="62" rx="3" ry="6" fill="' + skin + '"/>' +
      (o.cheeks ? '<circle cx="109" cy="67" r="4" fill="#e8908a" opacity=".35"/><circle cx="131" cy="67" r="4" fill="#e8908a" opacity=".35"/>' : '');
  }
  function shoulders(c, c2, y) { y = y || 84; return '<path d="M52 160 Q52 ' + (y + 12) + ' 92 ' + (y + 4) + ' L120 ' + (y + 14) + ' L148 ' + (y + 4) + ' Q188 ' + (y + 12) + ' 188 160Z" fill="' + c + '"/><path d="M92 ' + (y + 4) + ' L120 ' + (y + 14) + ' L148 ' + (y + 4) + ' L120 ' + (y + 40) + 'Z" fill="' + (c2 || c) + '" opacity=".5"/>'; }
  function neck(skin) { return '<rect x="110" y="78" width="20" height="14" fill="' + skin + '"/>'; }
  function beard(c, y) { return '<path d="M103 66 Q104 ' + (y || 90) + ' 120 ' + ((y || 90) + 4) + ' Q136 ' + (y || 90) + ' 137 66 Q130 76 120 74 Q110 76 103 66Z" fill="' + c + '"/>'; }

  var LOOKS = {
    toga: function (s, sk, ha) { var hc = pick(['#d8d4cc', '#8a8a86', '#a89a86'], s); return shoulders('#f4efe2', '#d8cfb8') + '<path d="M60 160 Q70 104 118 100 L150 160Z" fill="#e8dfc8" opacity=".9"/>' + neck(sk) + '<path d="M100 56 Q98 28 120 28 Q142 28 140 56 Q132 40 120 40 Q108 40 100 56Z" fill="' + hc + '"/>' + face(sk, hc) + beard(hc, 94); },
    king: function (s, sk, ha) { return shoulders('#a8222a', '#6a1418') + '<path d="M64 150 Q70 104 100 98 L100 160Z" fill="#e8b830" opacity=".6"/>' + neck(sk) + face(sk, '#4a3320') + beard('#4a3320', 92) + '<path d="M96 40 L100 20 L110 32 L120 14 L130 32 L140 20 L144 40Z" fill="#e8b830"/><rect x="96" y="38" width="48" height="7" fill="#c99a1e"/><circle cx="120" cy="22" r="3" fill="#2d6ec4"/>'; },
    painter: function (s, sk, ha) { var hc = ha; return shoulders(pick(['#3a4a6a', '#5a3a2a', '#2f4a3a'], s), '#1d1d1d') + '<rect x="88" y="94" width="64" height="12" fill="#f2e8d0" opacity=".8"/>' + neck(sk) + '<path d="M96 70 Q90 40 108 34 L132 34 Q150 40 144 70 Q146 56 140 50 H100 Q94 56 96 70Z" fill="' + hc + '"/>' + face(sk, hc) + '<path d="M92 40 Q120 18 150 36 Q154 44 140 42 Q116 34 96 46Z" fill="#8a1c2a"/><path d="M146 36 q10 -2 10 6" stroke="#8a1c2a" stroke-width="3" fill="none"/>' + beard(hc, 86).replace('M103 66', 'M106 70'); },
    noble: function (s, sk, ha) { var hc = ha; return shoulders(pick(['#2a3550', '#5a2a3a', '#3a3a2a'], s), '#111') + '<path d="M80 94 Q120 126 160 94 Q150 108 120 112 Q90 108 80 94Z" fill="#fbf7ee"/><path d="M84 98 Q120 130 156 98" stroke="#d6cdb4" stroke-width="1.5" fill="none"/>' + neck(sk) + '<path d="M96 66 Q92 36 112 32 H128 Q148 36 144 66 Q140 44 120 44 Q100 44 96 66Z" fill="' + hc + '"/>' + face(sk, hc) + '<path d="M110 72 Q120 68 130 72" stroke="' + hc + '" stroke-width="3" fill="none"/>'; },
    wig: function (s, sk, ha) { return shoulders(pick(['#5a2a3a', '#2a4a6a', '#3a5a4a'], s), '#111') + '<path d="M104 94 L120 116 L136 94 Z" fill="#fbf7ee"/><path d="M106 96 L120 112 L134 96" stroke="#d6cdb4" fill="none"/>' + neck(sk) + '<path d="M92 82 Q86 50 100 36 Q120 22 140 36 Q154 50 148 82 Q142 66 142 56 Q120 40 98 56 Q98 66 92 82Z" fill="#f4f0e8" stroke="#d6cdb4" stroke-width="1.5"/><circle cx="92" cy="82" r="6" fill="#f4f0e8"/><circle cx="148" cy="82" r="6" fill="#f4f0e8"/>' + face(sk, '#8a8a86'); },
    scholar: function (s, sk, ha) { var hc = pick(['#8a8a86', '#d8d4cc'], s); return shoulders('#3a3f4a', '#22262e') + '<path d="M104 92 L120 108 L136 92Z" fill="#f4f0e6"/><path d="M120 100 L126 130 L120 140 L114 130Z" fill="#8a1c2a" opacity=".85"/>' + neck(sk) + '<path d="M94 58 Q86 24 120 24 Q154 24 146 58 Q138 38 120 40 Q102 38 94 58Z M90 52 Q82 40 92 34 Q94 44 98 50Z M150 52 Q158 40 148 34 Q146 44 142 50Z" fill="' + hc + '"/>' + face(sk, hc) + '<path d="M108 74 Q120 70 132 74 Q128 80 120 78 Q112 80 108 74Z" fill="' + hc + '"/>'; },
    officer: function (s, sk, ha) { return shoulders('#1f3a6a', '#12244a') + '<rect x="108" y="86" width="24" height="12" fill="#a8222a"/><path d="M52 112 H96 M144 112 H188" stroke="#e8b830" stroke-width="6"/><circle cx="82" cy="104" r="7" fill="#e8b830"/><circle cx="158" cy="104" r="7" fill="#e8b830"/><path d="M98 100 L120 120 L142 100" stroke="#e8b830" stroke-width="3" fill="none"/>' + neck(sk) + '<path d="M96 62 Q90 30 120 28 Q150 30 144 62 Q138 42 120 42 Q102 42 96 62Z" fill="' + ha + '"/>' + face(sk, ha) + '<path d="M104 70 Q112 76 120 74 Q128 76 136 70" stroke="' + ha + '" stroke-width="2.5" fill="none"/>'; },
    writer: function (s, sk, ha) { return shoulders('#2a2f3a', '#161a22') + '<path d="M96 88 Q120 108 144 88 L140 98 Q120 112 100 98Z" fill="#f4f0e6"/><circle cx="120" cy="100" r="4" fill="#b8944a"/>' + neck(sk) + '<path d="M96 66 Q90 34 120 30 Q150 34 144 66 Q146 46 120 44 Q94 46 96 66Z" fill="#6b6b68"/><ellipse cx="120" cy="32" rx="16" ry="9" fill="#6b6b68"/>' + face(sk, '#5a5a56'); },
    priest: function (s, sk, ha) { return shoulders('#1a1a1c', '#0d0d0e') + '<rect x="110" y="84" width="20" height="9" fill="#fbf7ee"/>' + neck(sk) + '<path d="M96 60 Q92 32 120 30 Q148 32 144 60 Q138 42 120 42 Q102 42 96 60Z" fill="' + ha + '"/>' + face(sk, ha) + '<path d="M104 44 Q120 38 136 44" stroke="' + ha + '" stroke-width="2" fill="none"/><path d="M120 108 V140 M110 120 H130" stroke="#d9a53a" stroke-width="3"/>'; },
    friar: function (s, sk, ha) { return shoulders('#7a5a38', '#4e3920') + '<path d="M60 160 L86 108 Q104 122 120 122 Q136 122 154 108 L180 160Z" fill="#6a4a2a" opacity=".5"/><path d="M96 92 L120 124 L144 92 L130 90 L120 108 L110 90Z" fill="#5e4528"/>' + neck(sk) + '<path d="M94 64 Q86 36 104 32 Q112 30 120 32 Q128 30 136 32 Q154 36 146 64 Q140 48 134 46 Q120 40 106 46 Q100 48 94 64Z" fill="' + ha + '"/>' + face(sk, ha) + '<path d="M104 72 Q120 82 136 72" stroke="' + ha + '" stroke-width="2.5" fill="none"/><path d="M60 150 Q120 134 180 150" stroke="#efe5cc" stroke-width="4" fill="none" stroke-dasharray="8 3"/>'; },
    monk: function (s, sk, ha) { return shoulders('#3a2f28', '#211a15') + '<path d="M84 110 Q80 50 120 30 Q160 50 156 110 Q150 74 120 66 Q90 74 84 110Z" fill="#3a2f28"/><path d="M96 108 Q96 56 120 44 Q144 56 144 108 Q136 70 120 66 Q104 70 96 108Z" fill="#2a211b"/>' + neck(sk) + face(sk, '#6a5a4a') + '<path d="M104 66 Q120 90 136 66 Q132 78 120 80 Q108 78 104 66Z" fill="#6a5a4a" opacity=".8"/>'; },
    bishop: function (s, sk, ha) { return shoulders('#7b2a8c', '#4e1a5a') + '<path d="M96 92 L120 112 L144 92" stroke="#f4f0e6" stroke-width="5" fill="none"/>' + neck(sk) + '<path d="M96 62 Q90 38 104 34 H136 Q150 38 144 62 Q138 44 120 44 Q102 44 96 62Z" fill="' + ha + '"/>' + face(sk, ha) + beard(ha, 86) + '<path d="M96 38 L102 8 Q120 -4 138 8 L144 38Z" fill="#f4efe4" stroke="#d9a53a" stroke-width="2"/><path d="M120 8 V38 M108 24 H132" stroke="#d9a53a" stroke-width="3"/><path d="M178 60 V150 M170 66 Q178 52 186 66" stroke="#d9a53a" stroke-width="4" fill="none"/>'; },
    pope: function (s, sk, ha) { return shoulders('#f8f6f0', '#d8d4c8') + '<path d="M94 94 Q120 116 146 94 L150 108 Q120 126 90 108Z" fill="#c8302a" opacity=".9"/><path d="M120 108 V146 M110 120 H130" stroke="#d9a53a" stroke-width="3.5"/>' + neck(sk) + '<path d="M96 62 Q90 40 102 34 H138 Q150 40 144 62 Q142 46 134 44 H106 Q98 46 96 62Z" fill="#e8e4dc"/>' + face(sk, '#c8c4bc', { cheeks: 1 }) + '<path d="M98 42 Q120 22 142 42 Q120 34 98 42Z" fill="#f8f6f0" stroke="#d9d3c4"/>'; },
    nun: function (s, sk, ha) { var dark = pick(['#2a2420', '#3a2f28', '#22262e'], s); return shoulders(dark, '#111') + '<path d="M60 160 Q60 100 100 92 L140 92 Q180 100 180 160Z" fill="' + dark + '"/><path d="M84 78 Q80 30 120 26 Q160 30 156 78 L170 130 Q120 110 70 130Z" fill="' + dark + '"/><path d="M96 90 Q104 100 120 100 Q136 100 144 90 L140 80 Q120 88 100 80Z" fill="#f8f4ea"/>' + '<path d="M97 64 Q96 36 120 34 Q144 36 143 64 Q130 50 120 50 Q110 50 97 64Z" fill="#f8f4ea"/>' + '<ellipse cx="120" cy="62" rx="16" ry="20" fill="' + sk + '"/><ellipse cx="113" cy="60" rx="2.2" ry="2.6" fill="#2a1d14"/><ellipse cx="127" cy="60" rx="2.2" ry="2.6" fill="#2a1d14"/><path d="M116 70 Q120 73 124 70" stroke="#a8705a" stroke-width="1.6" fill="none"/><circle cx="110" cy="67" r="3.4" fill="#e8908a" opacity=".35"/><circle cx="130" cy="67" r="3.4" fill="#e8908a" opacity=".35"/><path d="M120 108 V138 M112 118 H128" stroke="#d9a53a" stroke-width="3"/>'; },
    veil: function (s, sk, ha) { return shoulders('#5a3a2c', '#33211a') + '<path d="M84 80 Q82 28 120 24 Q158 28 156 80 L166 140 Q120 118 74 140Z" fill="#f4efe4" stroke="#d6cdb4"/><path d="M92 74 Q92 44 120 42 Q148 44 148 74 Q134 58 120 58 Q106 58 92 74Z" fill="#e8dfc8"/><ellipse cx="120" cy="64" rx="16" ry="19" fill="' + sk + '"/><ellipse cx="113" cy="62" rx="2.2" ry="2.6" fill="#2a1d14"/><ellipse cx="127" cy="62" rx="2.2" ry="2.6" fill="#2a1d14"/><path d="M116 72 Q120 75 124 72" stroke="#a8705a" stroke-width="1.6" fill="none"/><circle cx="110" cy="69" r="3.4" fill="#e8908a" opacity=".35"/><circle cx="130" cy="69" r="3.4" fill="#e8908a" opacity=".35"/><circle cx="150" cy="42" r="6" fill="#e8587a"/><circle cx="150" cy="42" r="3" fill="#b81f38"/>'; },
    girl: function (s, sk, ha) { return shoulders('#4a78b8', '#2f5688', 90) + '<path d="M100 92 Q120 106 140 92 L140 100 Q120 114 100 100Z" fill="#fbf7ee"/>' + neck(sk) + '<path d="M94 64 Q86 30 120 28 Q154 30 146 64 Q144 44 120 42 Q96 44 94 64Z" fill="' + ha + '"/><path d="M96 56 Q82 80 88 112 M144 56 Q158 80 152 112" stroke="' + ha + '" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="88" cy="112" r="5" fill="#e8587a"/><circle cx="152" cy="112" r="5" fill="#e8587a"/>' + face(sk, ha, { cheeks: 1 }) + '<circle cx="104" cy="40" r="5" fill="#f4efe4"/><circle cx="104" cy="40" r="2.4" fill="#e8b830"/>'; }
  };

  function portrait(look, seed) {
    var u = uid(), sk = pick(SKIN, seed + 's'), ha = pick(HAIR.slice(0, 4), seed + 'h');
    if (look === 'friar' || look === 'priest' || look === 'bishop' || look === 'monk' || look === 'toga') ha = pick(['#4a3320', '#6b4a2b', '#2a1d14', '#8a8a86'], seed + 'h');
    var f = LOOKS[look] || LOOKS.scholar;
    var bgs = { toga: ['#c9d8c4', '#e9ecd8'], king: ['#e0b0a0', '#f2d6b8'], painter: ['#cfd8e8', '#ece2cf'], noble: ['#d8c4d8', '#efe3d6'], wig: ['#c8d0e0', '#efe9dc'], scholar: ['#c8dad8', '#ece8da'], officer: ['#c4d4e8', '#f0e8d6'], writer: ['#e4d0c4', '#f4e8d6'], priest: ['#d4cfe0', '#efe6d6'], friar: ['#e0d0b0', '#f4e6c8'], monk: ['#cbc4b8', '#ece4d4'], bishop: ['#d8c8e4', '#f1e8dc'], pope: ['#f0e4b8', '#fbf3d8'], nun: ['#d8dce8', '#f1ebdc'], veil: ['#e8d8d0', '#f6ece0'], girl: ['#d4e4f0', '#f4ecd8'] };
    var b = bgs[look] || bgs.scholar;
    return '<defs>' + grad(u + 'b', b[0], b[1]) + '<radialGradient id="' + u + 'r" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><clipPath id="' + u + 'c"><rect width="240" height="160"/></clipPath></defs>' +
      '<rect width="240" height="160" fill="url(#' + u + 'b)"/><rect width="240" height="160" fill="url(#' + u + 'r)"/>' +
      '<g clip-path="url(#' + u + 'c)">' + '<circle cx="120" cy="84" r="64" fill="#fff" opacity=".25"/>' + f(seed, sk, ha) + '</g>' +
      '<rect x="3" y="3" width="234" height="154" rx="6" fill="none" stroke="#a8864a" stroke-width="3" opacity=".55"/>';
  }

  function scene(id, seed, label) {
    var u = uid(), inner;
    if (String(id).indexOf('p:') === 0) inner = portrait(String(id).slice(2), seed || id);
    else inner = (SC[id] || SC.scroll)(u);
    return '<svg class="ln-art" viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + String(label || '').replace(/[<>&"]/g, '') + '" preserveAspectRatio="xMidYMid slice">' + inner + '</svg>';
  }

  var IDS = Object.keys(SC).filter(function (k) { return k.charAt(k.length - 1) !== '_'; });
  var LOOK_IDS = Object.keys(LOOKS);

  return { scene: scene, ids: IDS, looks: LOOK_IDS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LineaArt;
