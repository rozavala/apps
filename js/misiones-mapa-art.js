/* ================================================================
   MISIONES DE MAPA — misiones-mapa-art.js
   Hand-built SVG for the app: a brass compass rose, the picture-map
   tiles of the little valley (plaza and church, school, farm, the
   Andes, a lighthouse, forest, house, lake, pier), the Chile zone
   pictures (desert, valley, glacier, moai and friends), a jet, map
   pins, a ruler, cross-section charts and contour-line hills.
   Pure strings: no DOM, no network.
   ================================================================ */
'use strict';

var MapaArt = (function () {
  var uid = 0;
  function id(p) { return 'mm' + p + (++uid); }
  function f(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function svg(vb, body, label, cls) {
    return '<svg class="' + (cls || 'mm-art') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg"' +
      (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + ' focusable="false">' + body + '</svg>';
  }

  // ---------------------------------------------------------------
  // Compass rose (brass ring, 16 points, red north needle)
  // ---------------------------------------------------------------
  function rose(opts) {
    opts = opts || {};
    var g = id('rg'), g2 = id('rb'), es = opts.es !== false, h = opts.highlight || '';
    var lab = { N: 'N', E: 'E', S: 'S', O: es ? 'O' : 'W' };
    var b = '<defs><radialGradient id="' + g + '" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fdf6e3"/><stop offset="1" stop-color="#efe0b8"/></radialGradient>' +
      '<linearGradient id="' + g2 + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c46a"/><stop offset=".5" stop-color="#b8892f"/><stop offset="1" stop-color="#8a6420"/></linearGradient></defs>';
    b += '<circle cx="50" cy="50" r="48" fill="url(#' + g2 + ')"/><circle cx="50" cy="50" r="43" fill="url(#' + g + ')" stroke="#8a6420" stroke-width=".8"/>';
    for (var i = 0; i < 72; i++) {
      var a = i * 5 * Math.PI / 180, r1 = i % 6 === 0 ? 37 : 40;
      b += '<line x1="' + f(50 + Math.sin(a) * r1) + '" y1="' + f(50 - Math.cos(a) * r1) + '" x2="' + f(50 + Math.sin(a) * 42.5) + '" y2="' + f(50 - Math.cos(a) * 42.5) + '" stroke="#8a6420" stroke-width="' + (i % 6 === 0 ? .9 : .45) + '"/>';
    }
    function pt(deg, len, w, c1, c2) {
      var a = deg * Math.PI / 180, x = 50 + Math.sin(a) * len, y = 50 - Math.cos(a) * len;
      var lx = 50 + Math.sin(a - Math.PI / 2) * w, ly = 50 - Math.cos(a - Math.PI / 2) * w;
      var rx = 50 + Math.sin(a + Math.PI / 2) * w, ry = 50 - Math.cos(a + Math.PI / 2) * w;
      return '<path d="M50,50L' + f(lx) + ',' + f(ly) + 'L' + f(x) + ',' + f(y) + 'Z" fill="' + c1 + '"/><path d="M50,50L' + f(rx) + ',' + f(ry) + 'L' + f(x) + ',' + f(y) + 'Z" fill="' + c2 + '"/>';
    }
    [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].forEach(function (d) { b += pt(d, 22, 3, '#c9b48a', '#a8916a'); });
    [45, 135, 225, 315].forEach(function (d) { b += pt(d, 28, 4.2, '#6b7f99', '#3f5370'); });
    [90, 180, 270].forEach(function (d) { b += pt(d, 35, 5.5, '#2f3e57', '#55698a'); });
    b += pt(0, 35, 5.5, '#c0392b', '#8e1f14');
    b += '<circle cx="50" cy="50" r="3.2" fill="#e9c46a" stroke="#8a6420" stroke-width=".8"/>';
    var pos = { N: [50, 12.5], E: [88, 50], S: [50, 88], O: [12, 50] };
    Object.keys(pos).forEach(function (k) {
      var on = h === k;
      b += (on ? '<circle cx="' + pos[k][0] + '" cy="' + pos[k][1] + '" r="6.4" fill="#c0392b"/>' : '') +
        '<text x="' + pos[k][0] + '" y="' + (pos[k][1] + 3.6) + '" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10" fill="' + (on ? '#fff' : (k === 'N' ? '#8e1f14' : '#3b2f1a')) + '">' + lab[k] + '</text>';
    });
    return svg('0 0 100 100', b, opts.label, opts.cls || 'mm-rose');
  }

  // ---------------------------------------------------------------
  // Picture-map tiles (viewBox 0 0 100 80, ground drawn by the map)
  // ---------------------------------------------------------------
  function tree(x, y, s, c) {
    c = c || '#2f7d3a';
    return '<rect x="' + f(x - 1.2 * s) + '" y="' + f(y - 2 * s) + '" width="' + f(2.4 * s) + '" height="' + f(7 * s) + '" fill="#7a4e2a"/>' +
      '<path d="M' + f(x) + ',' + f(y - 14 * s) + 'L' + f(x + 7 * s) + ',' + f(y - 1 * s) + 'L' + f(x - 7 * s) + ',' + f(y - 1 * s) + 'Z" fill="' + c + '"/>' +
      '<path d="M' + f(x) + ',' + f(y - 18 * s) + 'L' + f(x + 5.4 * s) + ',' + f(y - 7 * s) + 'L' + f(x - 5.4 * s) + ',' + f(y - 7 * s) + 'Z" fill="' + c + '" opacity=".88"/>' +
      '<path d="M' + f(x) + ',' + f(y - 18 * s) + 'L' + f(x - 5.4 * s) + ',' + f(y - 7 * s) + 'L' + f(x - 7 * s) + ',' + f(y - 1 * s) + 'L' + f(x) + ',' + f(y - 1 * s) + 'Z" fill="#000" opacity=".12"/>';
  }
  var TILES = {
    plaza: function () {
      return '<ellipse cx="50" cy="62" rx="40" ry="11" fill="#d9c9a3"/><ellipse cx="50" cy="62" rx="31" ry="7.5" fill="#cbb98f"/>' +
        tree(18, 62, .55) + tree(82, 62, .55) +
        '<rect x="38" y="30" width="24" height="30" fill="#f3ead7" stroke="#b9a37a" stroke-width=".8"/>' +
        '<path d="M36,31L50,19L64,31Z" fill="#a0442e"/>' +
        '<rect x="45" y="8" width="10" height="22" fill="#f8f1e2" stroke="#b9a37a" stroke-width=".8"/><path d="M44,9L50,1L56,9Z" fill="#a0442e"/>' +
        '<rect x="49.2" y="-3" width="1.6" height="6" fill="#5b4a2c"/><rect x="47.5" y="-1.6" width="5" height="1.4" fill="#5b4a2c"/>' +
        '<rect x="47.6" y="13" width="4.8" height="6" rx="2.4" fill="#5b4a2c"/>' +
        '<path d="M46,60V48a4,4 0 0 1 8,0V60Z" fill="#6b3f23"/><circle cx="50" cy="38" r="3.4" fill="#86b8d8" stroke="#b9a37a" stroke-width=".7"/>';
    },
    school: function () {
      return '<rect x="14" y="34" width="72" height="30" fill="#f1c27d" stroke="#b07a3a" stroke-width=".8"/><path d="M10,35L50,16L90,35Z" fill="#6c8ebf"/>' +
        '<rect x="44" y="46" width="12" height="18" fill="#7a4e2a"/>' +
        [20, 31, 62, 73].map(function (x) { return '<rect x="' + x + '" y="41" width="8" height="8" fill="#cfe6f5" stroke="#b07a3a" stroke-width=".7"/>'; }).join('') +
        '<rect x="49.4" y="4" width="1.2" height="14" fill="#555"/><path d="M50.6,4H62V8.6H50.6Z" fill="#fff" stroke="#999" stroke-width=".3"/><rect x="50.6" y="4" width="4" height="2.3" fill="#1d4f9c"/><path d="M50.6,6.3H62V8.6H50.6Z" fill="#d52b1e"/><circle cx="52.6" cy="5.15" r=".7" fill="#fff"/>' +
        '<circle cx="50" cy="27.5" r="4" fill="#fff" stroke="#3b4a66" stroke-width=".8"/><path d="M50,25V27.5L52,28.6" stroke="#3b4a66" stroke-width=".8" fill="none"/>';
    },
    farm: function () {
      return '<path d="M4,66Q30,58 52,64T98,62V76H4Z" fill="#a7c957"/>' +
        [0, 1, 2, 3].map(function (i) { return '<path d="M' + (8 + i * 6) + ',74L' + (30 + i * 4) + ',60" stroke="#8a6d3b" stroke-width="1.4"/>'; }).join('') +
        '<rect x="44" y="30" width="34" height="32" fill="#b23a2e"/><path d="M41,31L61,14L81,31Z" fill="#7d2a20"/>' +
        '<rect x="54" y="42" width="14" height="20" fill="#f3ead7"/><path d="M54,42L68,62M68,42L54,62" stroke="#b23a2e" stroke-width="1.6"/>' +
        '<rect x="57" y="23" width="8" height="6" fill="#f3ead7"/>' +
        '<rect x="82" y="22" width="9" height="40" rx="4.5" fill="#c9ccd1"/><path d="M82,26a4.5,4.5 0 0 1 9,0" fill="#9aa1aa"/>' +
        '<ellipse cx="24" cy="56" rx="8" ry="4.6" fill="#fff"/><circle cx="17" cy="53" r="3" fill="#fff"/><circle cx="26" cy="55" r="2" fill="#333"/><rect x="19" y="59" width="1.4" height="4" fill="#333"/><rect x="28" y="59" width="1.4" height="4" fill="#333"/>';
    },
    andes: function () {
      var g = id('ag');
      return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c8aa5"/><stop offset="1" stop-color="#4f5d78"/></linearGradient></defs>' +
        '<path d="M0,70L22,30L34,44L52,8L70,38L80,26L100,70Z" fill="url(#' + g + ')"/>' +
        '<path d="M52,8L60,22L55,20L50,25L45,19Z" fill="#fff"/><path d="M22,30L27,39L23,37L19,40Z" fill="#fff"/><path d="M80,26L85,35L80,33L76,35Z" fill="#fff"/>' +
        '<path d="M52,8L70,38L80,26L100,70H60Z" fill="#000" opacity=".12"/>' +
        '<circle cx="86" cy="12" r="6" fill="#f4c542"/>' +
        '<path d="M40,16q3,-3 6,0q3,-3 6,0" stroke="#3b3b3b" stroke-width="1" fill="none"/>';
    },
    lighthouse: function () {
      return '<path d="M0,58Q12,54 24,58T48,58T72,58T100,58V80H0Z" fill="#3d8fc4"/><path d="M0,64Q12,60 24,64T48,64T72,64T100,64" stroke="#bfe3f7" stroke-width="1.2" fill="none"/>' +
        '<path d="M44,60L58,60L62,68L40,68Z" fill="#8f8573"/>' +
        '<path d="M45,60L47,20H55L57,60Z" fill="#fff" stroke="#a9a9a9" stroke-width=".6"/>' +
        '<path d="M45.9,46H56.1L56.6,54H45.4Z" fill="#c0392b"/><path d="M46.5,30H55.5L55.9,38H46.1Z" fill="#c0392b"/>' +
        '<rect x="45" y="13" width="12" height="7" fill="#fbe7a1" stroke="#555" stroke-width=".6"/><path d="M44,13L51,6L58,13Z" fill="#2f3e57"/>' +
        '<path d="M57,15L92,6V24Z" fill="#fff3b0" opacity=".55"/>';
    },
    forest: function () {
      return '<ellipse cx="50" cy="70" rx="46" ry="6" fill="#7fb069" opacity=".6"/>' +
        tree(20, 68, .95, '#2e6b34') + tree(40, 62, 1.25, '#357a3a') + tree(62, 66, 1.05, '#2a5f2e') + tree(80, 70, .9, '#3a8a40') + tree(52, 74, .8, '#2e6b34');
    },
    house: function () {
      return '<rect x="22" y="36" width="50" height="30" fill="#fae1b8" stroke="#b9895a" stroke-width=".8"/><path d="M17,38L47,14L77,38Z" fill="#8c3b2a"/>' +
        '<rect x="60" y="16" width="7" height="14" fill="#7a5a4a"/><circle cx="66" cy="10" r="3" fill="#ddd" opacity=".8"/><circle cx="70" cy="5" r="3.6" fill="#e5e5e5" opacity=".7"/>' +
        '<rect x="42" y="48" width="11" height="18" fill="#2f6e4f"/><circle cx="51" cy="57" r=".9" fill="#e9c46a"/>' +
        '<rect x="27" y="44" width="10" height="9" fill="#cfe6f5" stroke="#b9895a" stroke-width=".7"/><rect x="58" y="44" width="10" height="9" fill="#cfe6f5" stroke="#b9895a" stroke-width=".7"/>' +
        '<path d="M76,66V52h12v14" fill="none" stroke="#8a6d3b" stroke-width="1"/><circle cx="82" cy="49" r="5" fill="#e76f51"/><circle cx="86" cy="54" r="4" fill="#f4a261"/>';
    },
    lake: function () {
      return '<ellipse cx="50" cy="56" rx="42" ry="17" fill="#5aa9d6"/><ellipse cx="50" cy="56" rx="42" ry="17" fill="none" stroke="#a6d4ee" stroke-width="2"/>' +
        '<path d="M28,54q4,-2 8,0M58,60q4,-2 8,0M44,50q3,-2 6,0" stroke="#e7f5fc" stroke-width="1.2" fill="none"/>' +
        '<path d="M62,46q8,-9 16,0Z" fill="#fff"/><path d="M70,37V46" stroke="#555" stroke-width=".8"/><path d="M70,37L77,44H70Z" fill="#e76f51"/>' +
        '<path d="M14,48q3,-8 6,0M84,52q3,-8 6,0" stroke="#4a7c39" stroke-width="1.4" fill="none"/>';
    },
    pier: function () {
      return '<path d="M0,50Q12,46 24,50T48,50T72,50T100,50V80H0Z" fill="#3d8fc4"/>' +
        '<rect x="44" y="34" width="54" height="7" fill="#9c6b3c"/>' + [48, 60, 72, 84, 94].map(function (x) { return '<rect x="' + x + '" y="41" width="2.4" height="18" fill="#7a4e2a"/>'; }).join('') +
        '<path d="M8,58H34L30,66H12Z" fill="#c0392b"/><path d="M21,58V36" stroke="#5b4a2c" stroke-width="1.2"/><path d="M21,36L34,55H21Z" fill="#fff"/><path d="M21,40L11,55H21Z" fill="#f3ead7"/>';
    }
  };
  function tile(name, label) {
    var fn = TILES[name];
    return svg('0 -4 100 84', fn ? fn() : '', label, 'mm-tile-art');
  }

  // ---------------------------------------------------------------
  // Chile zone pictures and things (viewBox 0 0 100 80)
  // ---------------------------------------------------------------
  function sky(c1, c2) {
    var g = id('sk');
    return '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="100" height="80" fill="url(#' + g + ')"/>';
  }
  function moai(x, y, s) {
    return '<path d="M' + f(x - 7 * s) + ',' + f(y) + 'V' + f(y - 22 * s) + 'Q' + f(x - 7 * s) + ',' + f(y - 34 * s) + ' ' + f(x) + ',' + f(y - 34 * s) + 'Q' + f(x + 7 * s) + ',' + f(y - 34 * s) + ' ' + f(x + 7 * s) + ',' + f(y - 22 * s) + 'V' + f(y) + 'Z" fill="#6f6257"/>' +
      '<rect x="' + f(x - 6 * s) + '" y="' + f(y - 26 * s) + '" width="' + f(12 * s) + '" height="' + f(2.4 * s) + '" fill="#4d433b"/>' +
      '<path d="M' + f(x + 1 * s) + ',' + f(y - 24 * s) + 'L' + f(x + 3.6 * s) + ',' + f(y - 14 * s) + 'H' + f(x - .4 * s) + 'Z" fill="#5a4f46"/>' +
      '<rect x="' + f(x - 4 * s) + '" y="' + f(y - 11 * s) + '" width="' + f(8 * s) + '" height="' + f(1.6 * s) + '" fill="#4d433b"/>' +
      '<path d="M' + f(x - 7 * s) + ',' + f(y - 34 * s) + 'H' + f(x + 7 * s) + 'V' + f(y - 38 * s) + 'H' + f(x - 7 * s) + 'Z" fill="#a0522d" opacity=".9"/>';
  }
  var ZONE_ART = {
    desert: function () {
      return sky('#f6d6a8', '#fbecd2') + '<circle cx="78" cy="18" r="9" fill="#f4a63a"/>' +
        '<path d="M0,52L18,30L30,42L46,22L62,46L74,36L100,56V80H0Z" fill="#c98b5b"/><path d="M46,22L51,30L46,28L42,31Z" fill="#fff"/>' +
        '<path d="M0,62Q30,52 60,62T100,60V80H0Z" fill="#e3b77a"/><ellipse cx="66" cy="70" rx="18" ry="3.5" fill="#f2f2f2" opacity=".85"/>' +
        ZONE_THING.cactus(18, 74, .7) + ZONE_THING.llama(84, 72, .55);
    },
    valley: function () {
      return sky('#a9d6f5', '#e8f4fc') + '<path d="M0,46L20,22L34,34L54,12L72,32L86,22L100,40V80H0Z" fill="#8995ad"/>' +
        '<path d="M54,12L61,22L55,20L50,24L46,19Z" fill="#fff"/><path d="M20,22L25,30L20,28L16,30Z" fill="#fff"/><path d="M86,22L90,29L86,27L82,29Z" fill="#fff"/>' +
        '<path d="M0,56Q50,46 100,56V80H0Z" fill="#9bc36b"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<path d="M' + (6 + i * 7) + ',78L' + (14 + i * 6) + ',60" stroke="#6a8f3a" stroke-width="2" stroke-dasharray="2 1.6"/>'; }).join('') +
        ZONE_THING.city(70, 72, .55);
    },
    glacier: function () {
      return sky('#b9dcf1', '#eef7fc') + '<path d="M0,40L16,18L30,30L44,10L60,28L76,14L100,36V60H0Z" fill="#7d8ca6"/>' +
        '<path d="M30,30L44,10L60,28L56,60H34Z" fill="#dff1fb"/><path d="M38,40L44,60M48,34L48,60M54,40L50,60" stroke="#9ccbe6" stroke-width="1"/>' +
        '<path d="M0,58H100V80H0Z" fill="#3b7fb3"/><path d="M20,62L30,58L36,64L24,66Z" fill="#fff"/><path d="M66,64L74,60L80,66Z" fill="#eaf6fd"/>' +
        ZONE_THING.penguin(82, 76, .5) + ZONE_THING.penguin(90, 77, .42);
    },
    moai: function () {
      return sky('#ffd2a6', '#ffefd9') + '<circle cx="22" cy="22" r="10" fill="#ffb15c"/>' +
        '<path d="M0,62Q50,54 100,62V80H0Z" fill="#7fb069"/><path d="M0,70Q50,66 100,70V80H0Z" fill="#3d8fc4"/>' +
        '<rect x="22" y="58" width="60" height="5" fill="#5d544b"/>' + moai(34, 58, .85) + moai(52, 58, .95) + moai(70, 58, .85);
    }
  };
  var ZONE_THING = {
    cactus: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      return '<path d="M' + f(x - 4 * s) + ',' + f(y) + 'V' + f(y - 40 * s) + 'a4,4 0 0 1 ' + f(8 * s) + ',0V' + f(y) + 'Z" fill="#3f8f4a"/>' +
        '<path d="M' + f(x - 4 * s) + ',' + f(y - 22 * s) + 'H' + f(x - 12 * s) + 'V' + f(y - 32 * s) + '" stroke="#3f8f4a" stroke-width="' + f(5 * s) + '" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + f(x + 4 * s) + ',' + f(y - 16 * s) + 'H' + f(x + 11 * s) + 'V' + f(y - 28 * s) + '" stroke="#3f8f4a" stroke-width="' + f(5 * s) + '" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + f(x) + ',' + f(y - 42 * s) + 'V' + f(y) + '" stroke="#2c6b35" stroke-width="' + f(1 * s) + '"/>';
    },
    llama: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      function X(v) { return f(x + v * s); } function Y(v) { return f(y + v * s); }
      return '<ellipse cx="' + X(-4) + '" cy="' + Y(-22) + '" rx="' + f(16 * s) + '" ry="' + f(9 * s) + '" fill="#f1e4cf"/>' +
        '<path d="M' + X(8) + ',' + Y(-24) + 'L' + X(10) + ',' + Y(-50) + 'H' + X(17) + 'L' + X(16) + ',' + Y(-22) + 'Z" fill="#f1e4cf"/>' +
        '<ellipse cx="' + X(15) + '" cy="' + Y(-50) + '" rx="' + f(6 * s) + '" ry="' + f(4 * s) + '" fill="#f1e4cf"/>' +
        '<path d="M' + X(11) + ',' + Y(-53) + 'L' + X(11) + ',' + Y(-60) + 'L' + X(14) + ',' + Y(-54) + 'Z" fill="#e2d1b3"/>' +
        '<circle cx="' + X(16) + '" cy="' + Y(-51) + '" r="' + f(1 * s) + '" fill="#333"/>' +
        [-16, -9, 2, 9].map(function (lx) { return '<rect x="' + X(lx) + '" y="' + Y(-16) + '" width="' + f(3 * s) + '" height="' + f(16 * s) + '" fill="#e2d1b3"/>'; }).join('') +
        '<path d="M' + X(-12) + ',' + Y(-28) + 'h' + f(14 * s) + '" stroke="#c0392b" stroke-width="' + f(2 * s) + '"/>';
    },
    city: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      var out = '', bs = [[-30, 22, 10], [-19, 34, 9], [-9, 26, 10], [2, 50, 8], [11, 30, 10], [22, 20, 9]];
      bs.forEach(function (b, i) {
        out += '<rect x="' + f(x + b[0] * s) + '" y="' + f(y - b[1] * s) + '" width="' + f(b[2] * s) + '" height="' + f(b[1] * s) + '" fill="' + (i === 3 ? '#5f7896' : ['#8796ad', '#a3b1c4', '#6f819c'][i % 3]) + '"/>';
        for (var wy = y - b[1] * s + 3 * s; wy < y - 3 * s; wy += 5 * s) out += '<rect x="' + f(x + (b[0] + 2) * s) + '" y="' + f(wy) + '" width="' + f((b[2] - 4) * s) + '" height="' + f(1.6 * s) + '" fill="#e8f0f9" opacity=".8"/>';
      });
      return out + '<path d="M' + f(x + 6 * s) + ',' + f(y - 50 * s) + 'V' + f(y - 58 * s) + '" stroke="#5f7896" stroke-width="' + f(1.2 * s) + '"/>';
    },
    grapes: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      var out = '<path d="M' + f(x) + ',' + f(y - 52 * s) + 'q' + f(6 * s) + ',' + f(-8 * s) + ' ' + f(14 * s) + ',' + f(-6 * s) + '" stroke="#6b4b2a" stroke-width="' + f(2 * s) + '" fill="none"/>' +
        '<path d="M' + f(x + 2 * s) + ',' + f(y - 54 * s) + 'q' + f(14 * s) + ',' + f(-10 * s) + ' ' + f(22 * s) + ',' + f(2 * s) + 'q' + f(-12 * s) + ',' + f(6 * s) + ' ' + f(-22 * s) + ',' + f(-2 * s) + 'Z" fill="#5c9b3a"/>';
      var rows = [[-9, 0, 9], [-6, 3, 12], [-4, 4], [0]];
      rows.forEach(function (row, ri) {
        row.forEach(function (dx) { out += '<circle cx="' + f(x + dx * s) + '" cy="' + f(y - (46 - ri * 9) * s) + '" r="' + f(5.2 * s) + '" fill="#6d3a8a"/><circle cx="' + f(x + (dx - 1.6) * s) + '" cy="' + f(y - (47.6 - ri * 9) * s) + '" r="' + f(1.4 * s) + '" fill="#fff" opacity=".45"/>'; });
      });
      return out;
    },
    penguin: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      function X(v) { return f(x + v * s); } function Y(v) { return f(y + v * s); }
      return '<ellipse cx="' + X(0) + '" cy="' + Y(-22) + '" rx="' + f(12 * s) + '" ry="' + f(22 * s) + '" fill="#1f2a36"/>' +
        '<ellipse cx="' + X(0) + '" cy="' + Y(-18) + '" rx="' + f(8 * s) + '" ry="' + f(16 * s) + '" fill="#fff"/>' +
        '<circle cx="' + X(0) + '" cy="' + Y(-44) + '" r="' + f(9 * s) + '" fill="#1f2a36"/>' +
        '<circle cx="' + X(-3) + '" cy="' + Y(-45) + '" r="' + f(1.6 * s) + '" fill="#fff"/><circle cx="' + X(3) + '" cy="' + Y(-45) + '" r="' + f(1.6 * s) + '" fill="#fff"/>' +
        '<path d="M' + X(-2.4) + ',' + Y(-41) + 'L' + X(0) + ',' + Y(-36) + 'L' + X(2.4) + ',' + Y(-41) + 'Z" fill="#f4a63a"/>' +
        '<path d="M' + X(-7) + ',' + Y(0) + 'h' + f(5 * s) + 'M' + X(2) + ',' + Y(0) + 'h' + f(5 * s) + '" stroke="#f4a63a" stroke-width="' + f(2.4 * s) + '"/>';
    },
    ice: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      function X(v) { return f(x + v * s); } function Y(v) { return f(y + v * s); }
      return '<path d="M' + X(-36) + ',' + Y(0) + 'L' + X(-26) + ',' + Y(-30) + 'L' + X(-10) + ',' + Y(-46) + 'L' + X(6) + ',' + Y(-34) + 'L' + X(18) + ',' + Y(-42) + 'L' + X(34) + ',' + Y(0) + 'Z" fill="#e4f4fc" stroke="#5aa0c8" stroke-width="' + f(1.2 * s) + '" stroke-linejoin="round"/>' +
        '<path d="M' + X(-10) + ',' + Y(-46) + 'L' + X(-4) + ',' + Y(0) + 'H' + X(-36) + 'L' + X(-26) + ',' + Y(-30) + 'Z" fill="#b9dff2"/>' +
        '<path d="M' + X(18) + ',' + Y(-42) + 'L' + X(12) + ',' + Y(0) + 'H' + X(34) + 'Z" fill="#cbe8f6"/>' +
        '<path d="M' + X(-18) + ',' + Y(-20) + 'l' + f(4 * s) + ',' + f(8 * s) + 'M' + X(4) + ',' + Y(-24) + 'l' + f(-2 * s) + ',' + f(10 * s) + 'M' + X(22) + ',' + Y(-16) + 'l' + f(2 * s) + ',' + f(8 * s) + '" stroke="#7fbfe0" stroke-width="' + f(1.2 * s) + '"/>' +
        '<rect x="' + X(-46) + '" y="' + Y(0) + '" width="' + f(92 * s) + '" height="' + f(5 * s) + '" fill="#2f78ad"/>' +
        '<path d="M' + X(-40) + ',' + Y(2.4) + 'q' + f(4 * s) + ',' + f(-2 * s) + ' ' + f(8 * s) + ',0M' + X(20) + ',' + Y(2.4) + 'q' + f(4 * s) + ',' + f(-2 * s) + ' ' + f(8 * s) + ',0" stroke="#bfe3f7" stroke-width="' + f(1 * s) + '" fill="none"/>' +
        '<path d="M' + X(26) + ',' + Y(0) + 'l' + f(6 * s) + ',' + f(-5 * s) + 'l' + f(6 * s) + ',' + f(5 * s) + 'Z" fill="#fff"/>';
    },
    araucaria: function (x, y, s) {
      s = s || 1; x = x == null ? 50 : x; y = y == null ? 74 : y;
      var out = '<rect x="' + f(x - 2 * s) + '" y="' + f(y - 56 * s) + '" width="' + f(4 * s) + '" height="' + f(56 * s) + '" fill="#6e5a48"/>';
      for (var i = 0; i < 4; i++) {
        var yy = y - (56 - i * 4) * s, w = (14 + i * 4) * s;
        out += '<path d="M' + f(x) + ',' + f(yy) + 'q' + f(-w / 2) + ',' + f(-2 * s) + ' ' + f(-w) + ',' + f(6 * s) + '" stroke="#2f5d33" stroke-width="' + f(3.2 * s) + '" fill="none" stroke-linecap="round"/>' +
          '<path d="M' + f(x) + ',' + f(yy) + 'q' + f(w / 2) + ',' + f(-2 * s) + ' ' + f(w) + ',' + f(6 * s) + '" stroke="#2f5d33" stroke-width="' + f(3.2 * s) + '" fill="none" stroke-linecap="round"/>';
      }
      return out;
    },
    moai: function (x, y, s) { return moai(x == null ? 50 : x, y == null ? 74 : y, (s || 1) * 1.4); }
  };
  function zone(name, label) { var fn = ZONE_ART[name]; return svg('0 0 100 80', fn ? fn() : '', label, 'mm-zone-art'); }
  function thing(name, label) {
    var fn = ZONE_THING[name], g = id('tb');
    var bg = '<defs><radialGradient id="' + g + '" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e9f3f8"/></radialGradient></defs>' +
      '<rect width="100" height="80" rx="8" fill="url(#' + g + ')"/><ellipse cx="50" cy="77" rx="40" ry="4.5" fill="#000" opacity=".08"/>';
    return svg('0 0 100 80', bg + (fn ? fn(50, 76, 1) : ''), label, 'mm-thing-art');
  }

  // ---------------------------------------------------------------
  // Jet (pointing right, rotate as needed) and pins
  // ---------------------------------------------------------------
  function planeShape(c) {
    c = c || '#fff';
    return '<path d="M-14,0Q-14,-2.2 -10,-2.2H9Q14,-2 16,0Q14,2 9,2.2H-10Q-14,2.2 -14,0Z" fill="' + c + '" stroke="#24324a" stroke-width=".9"/>' +
      '<path d="M-1,-2L-6,-13H-2.6L5,-2Z" fill="' + c + '" stroke="#24324a" stroke-width=".9"/><path d="M-1,2L-6,13H-2.6L5,2Z" fill="' + c + '" stroke="#24324a" stroke-width=".9"/>' +
      '<path d="M-11,-2L-14,-7H-12L-8,-2Z" fill="' + c + '" stroke="#24324a" stroke-width=".8"/><path d="M-11,2L-14,7H-12L-8,2Z" fill="' + c + '" stroke="#24324a" stroke-width=".8"/>' +
      '<path d="M11,-1.4Q13,-1 14.2,0H11Z" fill="#24324a"/>';
  }
  function plane(label) { return svg('-17 -15 34 30', planeShape('#fff'), label, 'mm-plane-art'); }
  function pin(x, y, s, col, label) {
    return '<g class="mm-pin" transform="translate(' + f(x) + ',' + f(y) + ') scale(' + s + ')"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' +
      '<path d="M0,0C-3,-6 -7,-9 -7,-14A7,7 0 0 1 7,-14C7,-9 3,-6 0,0Z" fill="' + (col || '#c0392b') + '" stroke="#fff" stroke-width="1.2"/><circle cx="0" cy="-14" r="2.6" fill="#fff"/></g>';
  }

  // ---------------------------------------------------------------
  // Ruler and scale bar (used by the scale questions). u = px per cm.
  // ---------------------------------------------------------------
  function ruler(x, y, cm, u) {
    var w = cm * u + 16, out = '<rect x="' + f(x - 8) + '" y="' + f(y) + '" width="' + f(w) + '" height="22" rx="3" fill="#f6e7b4" stroke="#b08d3a"/>';
    for (var i = 0; i <= cm * 10; i++) {
      var tx = x + i * u / 10, h = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4;
      out += '<line x1="' + f(tx) + '" y1="' + f(y) + '" x2="' + f(tx) + '" y2="' + f(y + h) + '" stroke="#6b5420" stroke-width="' + (i % 10 === 0 ? 1 : .6) + '"/>';
      if (i % 10 === 0) out += '<text x="' + f(tx) + '" y="' + f(y + 19) + '" text-anchor="middle" font-size="8" font-weight="700" fill="#6b5420">' + (i / 10) + '</text>';
    }
    return out;
  }
  function scaleBar(x, y, blocks, u, labelEach) {
    var out = '';
    for (var i = 0; i < blocks; i++) out += '<rect x="' + f(x + i * u) + '" y="' + f(y) + '" width="' + f(u) + '" height="6" fill="' + (i % 2 ? '#fff' : '#1f2937') + '" stroke="#1f2937" stroke-width=".8"/>';
    for (var j = 0; j <= blocks; j++) out += '<text x="' + f(x + j * u) + '" y="' + f(y - 4) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#1f2937">' + (j * labelEach) + '</text>';
    return out;
  }

  // ---------------------------------------------------------------
  // Cross-section chart. opts: { w, h, es, highlight: [markIds], names }
  // ---------------------------------------------------------------
  function profileChart(p, opts) {
    opts = opts || {};
    var W = 360, H = 220, L = 44, R = 12, T = 18, B = 40, maxKm = p.pts[p.pts.length - 1][0];
    var maxM = Math.ceil(Math.max.apply(null, p.pts.map(function (q) { return q[1]; })) / 1000) * 1000;
    function X(km) { return L + km / maxKm * (W - L - R); }
    function Y(m) { return H - B - m / maxM * (H - T - B); }
    var g = id('pg'), gs = id('ps'), out = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a68a64"/><stop offset=".55" stop-color="#7d9a55"/><stop offset="1" stop-color="#5f7f3f"/></linearGradient>' +
      '<linearGradient id="' + gs + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbeefa"/><stop offset="1" stop-color="#fdfaf2"/></linearGradient></defs>';
    out += '<rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="url(#' + gs + ')"/>';
    for (var m = 0; m <= maxM; m += 1000) {
      out += '<line x1="' + L + '" y1="' + f(Y(m)) + '" x2="' + (W - R) + '" y2="' + f(Y(m)) + '" stroke="#c9c2ae" stroke-width=".6"' + (m ? ' stroke-dasharray="3 3"' : '') + '/>' +
        '<text x="' + (L - 4) + '" y="' + f(Y(m) + 3) + '" text-anchor="end" font-size="8.5" fill="#5b5141">' + (m ? (m / 1000) + (opts.es ? '.000' : ',000') : '0') + '</text>';
    }
    var stepKm = maxKm > 300 ? 100 : 50;
    for (var k = 0; k <= maxKm; k += stepKm) {
      out += '<line x1="' + f(X(k)) + '" y1="' + (H - B) + '" x2="' + f(X(k)) + '" y2="' + (H - B + 4) + '" stroke="#5b5141"/><text x="' + f(X(k)) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#5b5141">' + k + '</text>';
    }
    out += '<text x="' + f((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#3b3326">' + esc(opts.es ? 'kilómetros' : 'kilometres') + '</text>' +
      '<text x="10" y="' + f((T + H - B) / 2) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#3b3326" transform="rotate(-90 10 ' + f((T + H - B) / 2) + ')">' + esc(opts.es ? 'metros' : 'metres') + '</text>';
    var d = 'M' + f(X(0)) + ',' + f(Y(0));
    p.pts.forEach(function (q) { d += 'L' + f(X(q[0])) + ',' + f(Y(q[1])); });
    d += 'L' + f(X(maxKm)) + ',' + f(Y(0)) + 'Z';
    out += '<path d="M' + L + ',' + f(Y(0)) + 'h-1v' + f(H - B - Y(0)) + 'Z" fill="#3d8fc4"/>';
    out += '<path d="' + d + '" fill="url(#' + g + ')" stroke="#4a3b24" stroke-width="1.2" stroke-linejoin="round"/>';
    // snow above 4,500 m
    var snow = '';
    for (var i = 1; i < p.pts.length; i++) {
      var a = p.pts[i - 1], b = p.pts[i];
      if (a[1] > 4500 && b[1] > 4500) snow += 'M' + f(X(a[0])) + ',' + f(Y(a[1])) + 'L' + f(X(b[0])) + ',' + f(Y(b[1]));
    }
    if (snow) out += '<path d="' + snow + '" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>';
    var hi = opts.highlight || [], names = opts.names || {};
    p.marks.forEach(function (mk, i) {
      var x = X(mk.km), y = Y(mk.m), on = hi.indexOf(mk.id) >= 0;
      var showH = opts.showHeights !== false && !(opts.hideHeight && opts.hideHeight === mk.id);
      var lbl = (names[mk.id] || mk.id) + (showH ? ' · ' + mk.m.toLocaleString(opts.es ? 'es-CL' : 'en-US') + ' m' : '');
      var ly = Math.max(T + 9, y - 12 - (i % 2) * 13), anchor = x < L + 40 ? 'start' : x > W - 60 ? 'end' : 'middle';
      out += '<line x1="' + f(x) + '" y1="' + f(y) + '" x2="' + f(x) + '" y2="' + f(ly + 3) + '" stroke="#3b3326" stroke-width=".6"/>' +
        '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + (on ? 4.6 : 3) + '" fill="' + (on ? '#c0392b' : '#fff') + '" stroke="#3b3326" stroke-width="1"/>' +
        '<text x="' + f(x) + '" y="' + f(ly) + '" text-anchor="' + anchor + '" font-size="9" font-weight="800" fill="' + (on ? '#8e1f14' : '#1f2937') + '" paint-order="stroke" stroke="#fdfaf2" stroke-width="3">' + esc(lbl) + '</text>';
    });
    return svg('0 0 ' + W + ' ' + H, out, opts.label, 'mm-profile-art');
  }

  // ---------------------------------------------------------------
  // Contour hill. q: { n, step, steep: 'N'|'E'|'S'|'O', ring? }
  // ---------------------------------------------------------------
  function contour(q, opts) {
    opts = opts || {};
    var cx = 160, cy = 110, out = '', g = id('cg');
    var sh = { N: [0, -1], S: [0, 1], E: [1, 0], O: [-1, 0] }[q.steep];
    out += '<defs><radialGradient id="' + g + '" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#e8d9b0"/><stop offset="1" stop-color="#cfe3b8"/></radialGradient></defs>';
    out += '<rect width="320" height="220" fill="url(#' + g + ')" rx="10"/>';
    // rings: each smaller ring is shifted towards the steep side so lines bunch up there
    for (var i = 0; i < q.n; i++) {
      var t = i / q.n, rx = 140 - t * 128, ry = 92 - t * 80, off = t * 62;
      var x = cx + sh[0] * off, y = cy + sh[1] * off * .62;
      var isRing = q.ring && q.ring === i + 1;
      out += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + (i % 2 ? '#c4a87a' : '#d5bd8f') + '" fill-opacity=".45" stroke="' + (i % 5 === 4 ? '#6d4a1f' : '#8a6a3a') + '" stroke-width="' + (i % 5 === 4 ? 1.8 : 1.1) + '"/>';
      if (opts.labels !== false && i < q.n - 1 && !isRing) {
        out += '<text x="' + f(x - rx + 3) + '" y="' + f(y + 3) + '" font-size="8" font-weight="700" fill="#5b4320" paint-order="stroke" stroke="#f3ead3" stroke-width="2.6">' + ((i + 1) * q.step) + '</text>';
      }
      if (isRing) {
        var ang = -Math.PI / 4;
        out += '<circle cx="' + f(x + Math.cos(ang) * rx) + '" cy="' + f(y + Math.sin(ang) * ry) + '" r="5.5" fill="#c0392b" stroke="#fff" stroke-width="1.6"/>';
      }
    }
    var tx = cx + sh[0] * 62 * (q.n - 1) / q.n, ty = cy + sh[1] * 62 * .62 * (q.n - 1) / q.n;
    out += '<path d="M' + f(tx) + ',' + f(ty - 7) + 'L' + f(tx + 6) + ',' + f(ty + 4) + 'H' + f(tx - 6) + 'Z" fill="#5b4320"/>';
    // mini compass
    out += '<g transform="translate(290,30)"><circle r="16" fill="#fff" stroke="#8a6420"/><path d="M0,-13L4,0H-4Z" fill="#c0392b"/><path d="M0,13L4,0H-4Z" fill="#2f3e57"/>' +
      '<text y="-17" text-anchor="middle" font-size="8" font-weight="800" fill="#8e1f14" dy="-1">N</text></g>';
    return svg('0 0 320 220', out, opts.label, 'mm-contour-art');
  }

  return {
    rose: rose, tile: tile, TILE_NAMES: Object.keys(TILES), zone: zone, thing: thing, plane: plane, planeShape: planeShape, pin: pin,
    ruler: ruler, scaleBar: scaleBar, profileChart: profileChart, contour: contour, svg: svg, esc: esc
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MapaArt;
