/* ================================================================
   LÓGICA — hand-built SVG art (js/logica-art.js)
   Every function returns an SVG string (our own static markup, never
   anything a kid typed). Ids inside gradients carry a counter so two
   copies on one page never share a gradient by accident.
   ================================================================ */

var LogicaArt = (function () {
  'use strict';

  var uid = 0;
  function U(p) { uid++; return p + uid; }
  function svg(vb, size, body, label) {
    var w = Array.isArray(size) ? size[0] : size, h = Array.isArray(size) ? size[1] : size;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="' + w + '" height="' + h + '"' +
      (label ? ' role="img" aria-label="' + String(label).replace(/"/g, '&quot;') + '"' : ' aria-hidden="true" focusable="false"') + '>' + body + '</svg>';
  }
  function lin(id, x1, y1, x2, y2, stops) {
    return '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join('') + '</linearGradient>';
  }
  function rad(id, cx, cy, r, stops) {
    return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join('') + '</radialGradient>';
  }

  var PALETTE = {
    red: ['#F26B7E', '#D12F48', '#9E1C33'], blue: ['#6EA4FF', '#2F6FE0', '#1D4AA6'],
    yellow: ['#FFF27A', '#F7D417', '#A68A00'], green: ['#6FD48E', '#2FA35B', '#1B703C'],
    purple: ['#B79BFF', '#8B5CF6', '#5B33C2'], orange: ['#FF9A52', '#E8590C', '#A63D04']
  };
  var COLOR_NAMES = { red: ['rojo', 'red'], blue: ['azul', 'blue'], yellow: ['amarillo', 'yellow'], green: ['verde', 'green'], purple: ['morado', 'purple'], orange: ['naranjo', 'orange'] };
  var SHAPE_NAMES = { circle: ['círculo', 'circle'], square: ['cuadrado', 'square'], triangle: ['triángulo', 'triangle'], star: ['estrella', 'star'], heart: ['corazón', 'heart'], diamond: ['rombo', 'diamond'] };

  // ---------------------------------------------------------------
  // The mascot: Lechuza, a little owl on a branch
  // ---------------------------------------------------------------
  function owl(size, label) {
    var b = U('owb'), be = U('owbe'), ey = U('owey'), wi = U('owwi');
    var body =
      '<defs>' + lin(b, 0, 0, 0, 1, [[0, '#9A6B45'], [1, '#6B4428']]) + rad(be, '.5', '.35', '.7', [[0, '#F7E6C8'], [1, '#E2C49A']]) +
      rad(ey, '.4', '.4', '.6', [[0, '#FFD45A'], [0.7, '#F2A516'], [1, '#C77A06']]) + lin(wi, 0, 0, 1, 1, [[0, '#7E5232'], [1, '#55341C']]) + '</defs>' +
      '<path d="M6 104 Q60 96 116 106" stroke="#6B4A2B" stroke-width="9" stroke-linecap="round" fill="none"/>' +
      '<path d="M88 102 q10 -8 20 -4" stroke="#6B4A2B" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="96" cy="94" rx="9" ry="5" fill="#4E9A4A" transform="rotate(-20 96 94)"/>' +
      '<path d="M30 30 L24 8 L44 22 Z M90 30 L96 8 L76 22 Z" fill="#6B4428"/>' +
      '<ellipse cx="60" cy="62" rx="36" ry="40" fill="url(#' + b + ')"/>' +
      '<path d="M26 60 Q20 86 40 98 Q34 76 38 58 Z" fill="url(#' + wi + ')"/><path d="M94 60 Q100 86 80 98 Q86 76 82 58 Z" fill="url(#' + wi + ')"/>' +
      '<ellipse cx="60" cy="74" rx="22" ry="25" fill="url(#' + be + ')"/>' +
      [[52, 66], [68, 66], [44, 76], [60, 76], [76, 76], [52, 86], [68, 86]].map(function (p) {
        return '<path d="M' + (p[0] - 5) + ' ' + p[1] + ' q5 5 10 0" stroke="#C9A06E" stroke-width="2" fill="none" stroke-linecap="round"/>';
      }).join('') +
      '<circle cx="44" cy="44" r="17" fill="#F7E6C8"/><circle cx="76" cy="44" r="17" fill="#F7E6C8"/>' +
      '<circle cx="44" cy="44" r="12" fill="url(#' + ey + ')"/><circle cx="76" cy="44" r="12" fill="url(#' + ey + ')"/>' +
      '<circle cx="45" cy="45" r="6.5" fill="#1C1408"/><circle cx="77" cy="45" r="6.5" fill="#1C1408"/>' +
      '<circle cx="42" cy="41" r="2.6" fill="#fff"/><circle cx="74" cy="41" r="2.6" fill="#fff"/>' +
      '<path d="M54 54 L66 54 L60 64 Z" fill="#F08A24" stroke="#B85A0B" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M48 100 l-3 6 M52 100 l0 7 M56 100 l3 6 M66 100 l-3 6 M70 100 l0 7 M74 100 l3 6" stroke="#E6A23C" stroke-width="3" stroke-linecap="round"/>';
    return svg('0 0 120 112', [size, size * 112 / 120], body, label);
  }

  // ---------------------------------------------------------------
  // Little pieces
  // ---------------------------------------------------------------
  function star(on, size) {
    var g = U('st');
    return svg('0 0 24 24', size || 18,
      '<defs>' + lin(g, 0, 0, 0, 1, on ? [[0, '#FFE27A'], [1, '#F2A516']] : [[0, '#E6E4EE'], [1, '#CFCBDC']]) + '</defs>' +
      '<path d="M12 2.2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.3 1.3-6.6L2.5 9.1l6.6-.8z" fill="url(#' + g + ')" stroke="' + (on ? '#B97A05' : '#B5B0C6') + '" stroke-width="1.2" stroke-linejoin="round"/>');
  }
  function flame(size, lit) {
    var g = U('fl');
    return svg('0 0 24 30', [size * 0.8, size],
      '<defs>' + lin(g, 0, 1, 0, 0, lit === false ? [[0, '#B8B4C6'], [1, '#DDDAE6']] : [[0, '#D9361F'], [0.55, '#F7891F'], [1, '#FFD34D']]) + '</defs>' +
      '<path d="M12 1 C14 8 21 11 21 19 A9 9 0 0 1 3 19 C3 14 6 12 8 8 C9 12 11 13 12 13 C11 9 11 5 12 1Z" fill="url(#' + g + ')"/>' +
      '<path d="M12 15 C13 18 16 19 16 22 A4 4 0 0 1 8 22 C8 20 10 19 12 15Z" fill="' + (lit === false ? '#EEECF3' : '#FFE9A0') + '"/>');
  }
  function shape(s, c, size, label) {
    var P = PALETTE[c] || PALETTE.blue, g = U('sh'), body;
    var fill = 'url(#' + g + ')', st = ' stroke="' + P[2] + '" stroke-width="2.2" stroke-linejoin="round"';
    switch (s) {
      case 'circle': body = '<circle cx="20" cy="20" r="15"' + st + ' fill="' + fill + '"/>'; break;
      case 'square': body = '<rect x="6" y="6" width="28" height="28" rx="4"' + st + ' fill="' + fill + '"/>'; break;
      case 'triangle': body = '<path d="M20 4 L36 34 L4 34 Z"' + st + ' fill="' + fill + '"/>'; break;
      case 'star': body = '<path d="M20 3l4.9 10.2 11.1 1.4-8.2 7.7 2.1 11-9.9-5.5-9.9 5.5 2.1-11-8.2-7.7 11.1-1.4z"' + st + ' fill="' + fill + '"/>'; break;
      case 'heart': body = '<path d="M20 35 C6 25 3 18 3 12.5 A8.5 8.5 0 0 1 20 9 A8.5 8.5 0 0 1 37 12.5 C37 18 34 25 20 35Z"' + st + ' fill="' + fill + '"/>'; break;
      default: body = '<path d="M20 3 L36 20 L20 37 L4 20 Z"' + st + ' fill="' + fill + '"/>';
    }
    return svg('0 0 40 40', size || 36, '<defs>' + lin(g, 0, 0, 0.4, 1, [[0, P[0]], [1, P[1]]]) + '</defs>' + body +
      '<ellipse cx="14" cy="12" rx="4" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-30 14 12)"/>', label);
  }
  function shapeName(s, c, lang) {
    var i = lang === 'es' ? 0 : 1;
    return lang === 'es' ? SHAPE_NAMES[s][0] + ' ' + COLOR_NAMES[c][0] : COLOR_NAMES[c][1] + ' ' + SHAPE_NAMES[s][1];
  }

  // ---------------------------------------------------------------
  // Fruit (picture sudoku, balance scales) and the wooden block
  // ---------------------------------------------------------------
  function fruitBody(id) {
    var a = U('fa'), b = U('fb');
    switch (id) {
      case 'apple': return '<defs>' + rad(a, '.35', '.35', '.75', [[0, '#FF8A8F'], [0.5, '#E2303F'], [1, '#9F1426']]) + '</defs>' +
        '<path d="M20 11 C12 6 3 11 4 22 C5 31 11 37 16 37 C18 37 19 36 20 36 C21 36 22 37 24 37 C29 37 35 31 36 22 C37 11 28 6 20 11Z" fill="url(#' + a + ')"/>' +
        '<path d="M20 11 C20 7 21 5 23 3" stroke="#6B4423" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
        '<path d="M22 7 C26 2 32 3 33 5 C29 8 25 9 22 7Z" fill="#4FA34A"/><ellipse cx="12" cy="18" rx="3" ry="5" fill="#fff" opacity=".35" transform="rotate(25 12 18)"/>';
      case 'pear': return '<defs>' + rad(a, '.35', '.4', '.8', [[0, '#E8F59A'], [0.55, '#A9CF3C'], [1, '#6E9420']]) + '</defs>' +
        '<path d="M20 7 C15 7 14 12 14 15 C14 19 7 22 7 29 C7 35 13 38 20 38 C27 38 33 35 33 29 C33 22 26 19 26 15 C26 12 25 7 20 7Z" fill="url(#' + a + ')"/>' +
        '<path d="M20 8 C20 5 21 3 23 2" stroke="#6B4423" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
        '<path d="M21 5 C24 1 29 2 30 3 C27 6 24 7 21 5Z" fill="#4FA34A"/><ellipse cx="14" cy="27" rx="2.6" ry="4.5" fill="#fff" opacity=".35" transform="rotate(20 14 27)"/>';
      case 'orange': return '<defs>' + rad(a, '.35', '.35', '.75', [[0, '#FFC370'], [0.55, '#F58A1F'], [1, '#C15E08']]) + '</defs>' +
        '<circle cx="20" cy="22" r="15" fill="url(#' + a + ')"/>' +
        [[14, 17], [24, 15], [27, 25], [17, 28], [21, 22], [11, 24]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r=".9" fill="#C46A12" opacity=".55"/>'; }).join('') +
        '<path d="M20 7 C22 4 26 4 28 5 C26 8 23 8 20 7Z" fill="#4FA34A"/><circle cx="20" cy="8" r="1.6" fill="#7A5A1C"/>' +
        '<ellipse cx="13" cy="16" rx="3" ry="4.5" fill="#fff" opacity=".35" transform="rotate(30 13 16)"/>';
      case 'banana': return '<defs>' + lin(a, 0, 0, 1, 1, [[0, '#FFE680'], [0.6, '#F6CB2F'], [1, '#D9A40F']]) + '</defs>' +
        '<path d="M7 9 C5 24 14 35 33 33 C35 32 35 30 33 30 C20 29 13 21 12 8 Z" fill="url(#' + a + ')" stroke="#B98A0E" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M7 9 L8 5 L12 6 L12 8 Z" fill="#6B5418"/><path d="M33 33 l2 0.6 l-0.6 -3" stroke="#6B5418" stroke-width="2" fill="none"/>' +
        '<path d="M10 12 C11 22 17 28 27 30" stroke="#FFF4B8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>';
      case 'grapes': return '<defs>' + rad(a, '.35', '.35', '.7', [[0, '#C9A6FF'], [0.55, '#7E4BD8'], [1, '#4D2398']]) + '</defs>' +
        [[14, 14], [22, 14], [30, 14], [10, 21], [18, 21], [26, 21], [14, 28], [22, 28], [18, 34]].map(function (p) {
          return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="url(#' + a + ')" stroke="#4D2398" stroke-width=".8"/><circle cx="' + (p[0] - 1.6) + '" cy="' + (p[1] - 1.8) + '" r="1.3" fill="#fff" opacity=".5"/>';
        }).join('') +
        '<path d="M22 9 C22 6 23 4 25 3" stroke="#6B4423" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M23 6 C27 2 33 4 33 6 C29 8 26 8 23 6Z" fill="#4FA34A"/>';
    }
    return '';
  }
  function fruit(id, size, label) { return svg('0 0 40 40', size || 36, fruitBody(id), label); }
  function blockBody(x, y, s) {
    s = s || 1;
    function t(px, py) { return (x + px * s) + ' ' + (y + py * s); }
    return '<path d="M' + t(0, 6) + ' L' + t(10, 0) + ' L' + t(22, 4) + ' L' + t(12, 10) + ' Z" fill="#F1C989"/>' +
      '<path d="M' + t(0, 6) + ' L' + t(12, 10) + ' L' + t(12, 24) + ' L' + t(0, 19) + ' Z" fill="#D49A50"/>' +
      '<path d="M' + t(12, 10) + ' L' + t(22, 4) + ' L' + t(22, 18) + ' L' + t(12, 24) + ' Z" fill="#B87A35"/>' +
      '<path d="M' + t(3, 11) + ' q4 2 6 1 M' + t(15, 14) + ' q3 -1 5 -3" stroke="#A86E2C" stroke-width="' + (0.8 * s) + '" fill="none" opacity=".7"/>';
  }
  function block(size) { return svg('0 0 24 26', size || 22, blockBody(1, 1, 1)); }

  // ---------------------------------------------------------------
  // Pets, snacks and sports (logic grid headers)
  // ---------------------------------------------------------------
  var ITEM = {
    dog: function () {
      var g = U('dg');
      return '<defs>' + rad(g, '.4', '.35', '.8', [[0, '#E9C08E'], [1, '#B9834B']]) + '</defs>' +
        '<ellipse cx="9" cy="17" rx="6" ry="11" fill="#7A4E2A" transform="rotate(18 9 17)"/><ellipse cx="31" cy="17" rx="6" ry="11" fill="#7A4E2A" transform="rotate(-18 31 17)"/>' +
        '<ellipse cx="20" cy="21" rx="12" ry="13" fill="url(#' + g + ')"/><ellipse cx="20" cy="28" rx="8" ry="6" fill="#F5DFC0"/>' +
        '<circle cx="15" cy="19" r="2.2" fill="#2A1A0E"/><circle cx="25" cy="19" r="2.2" fill="#2A1A0E"/><circle cx="14.4" cy="18.3" r=".7" fill="#fff"/><circle cx="24.4" cy="18.3" r=".7" fill="#fff"/>' +
        '<ellipse cx="20" cy="25" rx="3.2" ry="2.3" fill="#2A1A0E"/><path d="M20 27 v2.5 M17 30 q3 2 6 0" stroke="#2A1A0E" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M18.5 31 q1.5 3 3 0" fill="#E8687A"/>';
    },
    cat: function () {
      var g = U('ct');
      return '<defs>' + rad(g, '.4', '.35', '.8', [[0, '#B9BCC6'], [1, '#7C808E']]) + '</defs>' +
        '<path d="M7 18 L9 4 L17 11 Z M33 18 L31 4 L23 11 Z" fill="#7C808E"/><path d="M10 13 L10.5 7 L14.5 11 Z M30 13 L29.5 7 L25.5 11 Z" fill="#F2A7B5"/>' +
        '<ellipse cx="20" cy="22" rx="14" ry="12" fill="url(#' + g + ')"/>' +
        '<ellipse cx="14.5" cy="20" rx="2.4" ry="3" fill="#9BD34A"/><ellipse cx="25.5" cy="20" rx="2.4" ry="3" fill="#9BD34A"/><ellipse cx="14.5" cy="20" rx=".9" ry="2.6" fill="#1E2410"/><ellipse cx="25.5" cy="20" rx=".9" ry="2.6" fill="#1E2410"/>' +
        '<path d="M18.6 24.5 h2.8 l-1.4 1.6 Z" fill="#E8687A"/><path d="M20 26 q-2 2 -4 1 M20 26 q2 2 4 1" stroke="#3B3E48" stroke-width="1" fill="none"/>' +
        '<path d="M4 23 h8 M4 27 l8 -2 M36 23 h-8 M36 27 l-8 -2" stroke="#3B3E48" stroke-width=".8"/>';
    },
    fish: function () {
      var g = U('fs');
      return '<defs>' + lin(g, 0, 0, 0, 1, [[0, '#FFC067'], [1, '#F0711F']]) + '</defs>' +
        '<path d="M30 20 L39 12 L38 28 Z" fill="#E45E1A"/><ellipse cx="18" cy="20" rx="15" ry="10" fill="url(#' + g + ')"/>' +
        '<path d="M14 10.5 q5 -5 10 0" fill="#E45E1A"/><path d="M22 11 q-4 9 0 18" stroke="#fff" stroke-width="2.2" fill="none" opacity=".8"/>' +
        '<circle cx="10" cy="18" r="2.6" fill="#fff"/><circle cx="9.6" cy="18" r="1.4" fill="#1C1408"/><path d="M4 22 q2 1 4 0" stroke="#9E3B0B" stroke-width="1" fill="none"/>' +
        '<circle cx="4" cy="10" r="1.6" fill="none" stroke="#7FB8F0" stroke-width=".9"/><circle cx="7" cy="6" r="1" fill="none" stroke="#7FB8F0" stroke-width=".9"/>';
    },
    rabbit: function () {
      var g = U('rb');
      return '<defs>' + rad(g, '.4', '.35', '.8', [[0, '#FFFFFF'], [1, '#D9D4DE']]) + '</defs>' +
        '<ellipse cx="14" cy="10" rx="4" ry="10" fill="#E8E3EC" transform="rotate(-10 14 10)"/><ellipse cx="26" cy="10" rx="4" ry="10" fill="#E8E3EC" transform="rotate(10 26 10)"/>' +
        '<ellipse cx="14" cy="10" rx="2" ry="7" fill="#F2B3C1" transform="rotate(-10 14 10)"/><ellipse cx="26" cy="10" rx="2" ry="7" fill="#F2B3C1" transform="rotate(10 26 10)"/>' +
        '<ellipse cx="20" cy="26" rx="12" ry="11" fill="url(#' + g + ')" stroke="#C9C2CF" stroke-width=".8"/>' +
        '<circle cx="15.5" cy="24" r="2" fill="#2A1A2E"/><circle cx="24.5" cy="24" r="2" fill="#2A1A2E"/><circle cx="15" cy="23.4" r=".6" fill="#fff"/><circle cx="24" cy="23.4" r=".6" fill="#fff"/>' +
        '<path d="M18.6 28 h2.8 l-1.4 1.5 Z" fill="#E8687A"/><path d="M20 29.5 v2 M18.5 31.5 h3" stroke="#8A7F90" stroke-width=".9"/><circle cx="12" cy="29" r="2" fill="#F7C4CF" opacity=".7"/><circle cx="28" cy="29" r="2" fill="#F7C4CF" opacity=".7"/>';
    },
    bird: function () {
      var g = U('bd');
      return '<defs>' + lin(g, 0, 0, 0, 1, [[0, '#6FDB86'], [1, '#22994A']]) + '</defs>' +
        '<path d="M20 30 L14 39 L19 38 L22 31 Z" fill="#2B6FD6"/><path d="M22 30 L24 39 L27 36 L25 30 Z" fill="#E0435A"/>' +
        '<ellipse cx="21" cy="21" rx="11" ry="12" fill="url(#' + g + ')"/><circle cx="19" cy="12" r="8" fill="#E0435A"/>' +
        '<path d="M26 12 q6 1 5 7 q-3 -2 -6 -2 Z" fill="#F2C230" stroke="#B98200" stroke-width=".8"/><circle cx="20" cy="11" r="2.4" fill="#fff"/><circle cx="20.5" cy="11" r="1.3" fill="#111"/>' +
        '<path d="M13 22 q6 8 14 4 q-6 -2 -9 -8 Z" fill="#1B7A3C" opacity=".75"/>';
    },
    empanada: function () {
      var g = U('em');
      return '<defs>' + lin(g, 0, 0, 0, 1, [[0, '#F7C978'], [1, '#C98A34']]) + '</defs>' +
        '<path d="M4 28 C4 14 36 14 36 28 Z" fill="url(#' + g + ')" stroke="#A66E24" stroke-width="1"/>' +
        '<path d="M4 28 h32" stroke="#A66E24" stroke-width="2.4" stroke-linecap="round"/>' +
        [7, 11, 15, 19, 23, 27, 31].map(function (x) { return '<path d="M' + x + ' 27 q2 -3 4 0" stroke="#E7B565" stroke-width="1.6" fill="none"/>'; }).join('') +
        '<ellipse cx="15" cy="20" rx="4" ry="1.6" fill="#FFE6B0" opacity=".7"/>';
    },
    fruit: function () { return '<g transform="translate(-3 2) scale(.8)">' + fruitBody('apple') + '</g><g transform="translate(14 8) scale(.68)">' + fruitBody('banana') + '</g>'; },
    sandwich: function () {
      return '<path d="M4 26 L20 8 L36 26 Z" fill="#F3D9A4" stroke="#C79A52" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M5 26 q8 3 15 0 q8 3 15 0 L36 28 L4 28 Z" fill="#6CBF4A"/><path d="M4 28 h32 v3 h-32 Z" fill="#E86A5A"/><path d="M4 31 L36 31 L36 34 L4 34 Z" fill="#F6C94D"/>' +
        '<path d="M3 34 L37 34 L37 37 Q20 39 3 37 Z" fill="#E7BE7C" stroke="#C79A52" stroke-width="1"/>';
    },
    cookies: function () {
      var g = U('ck');
      return '<defs>' + rad(g, '.4', '.35', '.8', [[0, '#E9B873'], [1, '#B97C35']]) + '</defs>' +
        '<circle cx="15" cy="23" r="11" fill="url(#' + g + ')" stroke="#91591F" stroke-width="1"/><circle cx="26" cy="17" r="11" fill="url(#' + g + ')" stroke="#91591F" stroke-width="1"/>' +
        [[21, 13], [29, 12], [31, 20], [24, 21], [10, 22], [15, 28], [18, 20]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.7" fill="#4A2A12"/>'; }).join('');
    },
    yogurt: function () {
      return '<path d="M9 12 L31 12 L28 36 Q20 38 12 36 Z" fill="#FFFFFF" stroke="#B9B4C6" stroke-width="1.2"/>' +
        '<path d="M10.5 20 L29.5 20 L28.6 27 L11.4 27 Z" fill="#F28AA0"/><path d="M14 23.5 q3 -3 6 0 q3 3 6 0" stroke="#fff" stroke-width="1.4" fill="none"/>' +
        '<rect x="7" y="8" width="26" height="5" rx="2" fill="#C7C3D3"/><ellipse cx="20" cy="8.2" rx="12" ry="1.6" fill="#E2DFEA"/>';
    },
    soccer: function () {
      return '<circle cx="20" cy="20" r="15" fill="#fff" stroke="#2B2B33" stroke-width="1.4"/>' +
        '<path d="M20 13 l6 4.4 -2.3 7 h-7.4 l-2.3 -7 Z" fill="#2B2B33"/>' +
        '<path d="M20 13 V6 M26 17.4 l6.5 -2.2 M23.7 24.4 l4 5.6 M16.3 24.4 l-4 5.6 M14 17.4 l-6.5 -2.2" stroke="#2B2B33" stroke-width="1.4"/>' +
        '<path d="M14 6.6 l6 -1 6 1 M33 13 l1.6 6.5 -1.4 5.7 M29 32 l-9 2.5 -9 -2.5 M7 25 l-1.6 -5.6 1.5 -6.4" stroke="#2B2B33" stroke-width="1.4" fill="none"/>';
    },
    tennis: function () {
      var g = U('tn');
      return '<defs>' + rad(g, '.35', '.35', '.8', [[0, '#F4FF8A'], [1, '#B8D11C']]) + '</defs>' +
        '<circle cx="20" cy="20" r="14" fill="url(#' + g + ')"/><path d="M8 11 Q18 20 8 29 M32 11 Q22 20 32 29" stroke="#fff" stroke-width="2" fill="none"/>';
    },
    basket: function () {
      var g = U('bk');
      return '<defs>' + rad(g, '.35', '.35', '.8', [[0, '#FFA45C'], [1, '#D2600F']]) + '</defs>' +
        '<circle cx="20" cy="20" r="15" fill="url(#' + g + ')" stroke="#6B2F06" stroke-width="1.2"/>' +
        '<path d="M5 20 H35 M20 5 V35 M9 9 Q16 20 9 31 M31 9 Q24 20 31 31" stroke="#6B2F06" stroke-width="1.3" fill="none"/>';
    },
    chess: function () {
      return '<path d="M13 36 h14 l-1.5 -4 h-11 Z" fill="#2E2A3A"/><path d="M15 32 C15 25 17 23 17 20 h6 c0 3 2 5 2 12 Z" fill="#3E3850"/>' +
        '<rect x="14.5" y="17" width="11" height="3.4" rx="1.4" fill="#2E2A3A"/><circle cx="20" cy="11" r="5.4" fill="#3E3850"/><circle cx="18.2" cy="9.3" r="1.6" fill="#fff" opacity=".35"/>' +
        '<path d="M8 36 h24" stroke="#2E2A3A" stroke-width="2" stroke-linecap="round"/>';
    },
    volley: function () {
      return '<circle cx="20" cy="20" r="15" fill="#fff" stroke="#2F4C8C" stroke-width="1.3"/>' +
        '<path d="M20 5 C15 13 15 22 20 26 M20 26 C27 25 33 22 35 18 M20 26 C17 31 11 34 8 32" stroke="#2F6FE0" stroke-width="1.8" fill="none"/>' +
        '<path d="M14 7 C10 13 11 20 14 24 M33 25 C27 30 20 31 15 30" stroke="#F2B81F" stroke-width="1.8" fill="none"/>';
    }
  };
  function item(id, size, label) { return ITEM[id] ? svg('0 0 40 40', size || 32, ITEM[id](), label) : ''; }

  // ---------------------------------------------------------------
  // People: the river, the bridge and the islanders
  // ---------------------------------------------------------------
  var LOOKS = [
    { skin: '#F1C7A1', hair: '#4A2E1A', shirt: '#2F6FE0', pants: '#2B3A55' },
    { skin: '#E3AE84', hair: '#1F1712', shirt: '#E0435A', pants: '#3A3A44' },
    { skin: '#F6D2B4', hair: '#B26E2E', shirt: '#2FA35B', pants: '#344766' },
    { skin: '#D99A6C', hair: '#2B1C12', shirt: '#F2B81F', pants: '#4A3A2E' },
    { skin: '#F1C7A1', hair: '#7A4A22', shirt: '#8B5CF6', pants: '#2B3A55' },
    { skin: '#E8B892', hair: '#3A2516', shirt: '#F08A24', pants: '#2F3B4D' },
    { skin: '#F6D2B4', hair: '#D9A441', shirt: '#0E9F9A', pants: '#3A3A44' },
    { skin: '#DFA77B', hair: '#1F1712', shirt: '#C0398A', pants: '#2B3A55' }
  ];
  // A standing person in a 40x60 box. o: look, kid, long (longer hair),
  // hat ('chupalla' straw hat), num (a number on the shirt), lantern.
  function personBody(o) {
    var L = o.look || LOOKS[0], k = o.kid ? 0.82 : 1, sh = U('ps');
    var top = o.kid ? 14 : 6, s = '';
    s += '<defs>' + lin(sh, 0, 0, 0, 1, [[0, L.shirt], [1, shade(L.shirt, -0.25)]]) + '</defs>';
    s += '<ellipse cx="20" cy="58" rx="12" ry="2.4" fill="#000" opacity=".15"/>';
    s += '<g transform="translate(' + (20 - 20 * k) + ' ' + (60 - 60 * k) + ') scale(' + k + ')">';
    // legs and shoes
    s += '<path d="M14 40 L13 55 L18 55 L19.5 42 Z M26 40 L27 55 L22 55 L20.5 42 Z" fill="' + L.pants + '"/>';
    s += '<path d="M11 55 h8 v3 h-9 Z M21 55 h8 l1 3 h-9 Z" fill="#3B2A1E"/>';
    // body and arms
    s += '<path d="M11 26 Q11 21 16 21 L24 21 Q29 21 29 26 L29 42 L11 42 Z" fill="url(#' + sh + ')"/>';
    s += '<path d="M11 24 Q7 28 8 38" stroke="' + L.shirt + '" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M29 24 Q33 28 32 38" stroke="' + L.shirt + '" stroke-width="5" stroke-linecap="round" fill="none"/>';
    s += '<circle cx="8" cy="39" r="2.6" fill="' + L.skin + '"/><circle cx="32" cy="39" r="2.6" fill="' + L.skin + '"/>';
    if (o.num != null) s += '<circle cx="20" cy="31" r="6" fill="#fff" opacity=".92"/><text x="20" y="34.2" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="' + (String(o.num).length > 1 ? 7.5 : 9) + '" fill="#1c1b29">' + o.num + '</text>';
    // head
    if (o.long) s += '<path d="M10 14 Q10 4 20 4 Q30 4 30 14 L31 25 Q26 22 20 22 Q14 22 9 25 Z" fill="' + L.hair + '"/>';
    s += '<rect x="17" y="17" width="6" height="5" fill="' + L.skin + '"/>';
    s += '<circle cx="20" cy="12" r="8" fill="' + L.skin + '"/>';
    s += '<path d="M12 11 Q12 3.5 20 3.5 Q28 3.5 28 11 Q24 7.5 20 8.5 Q15 7 12 11 Z" fill="' + L.hair + '"/>';
    s += '<circle cx="17" cy="12.5" r="1.1" fill="#2A1A0E"/><circle cx="23" cy="12.5" r="1.1" fill="#2A1A0E"/>';
    s += '<path d="M17.4 15.6 Q20 17.6 22.6 15.6" stroke="#8A4A2A" stroke-width="1" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="15" cy="15" r="1.4" fill="#F28C8C" opacity=".45"/><circle cx="25" cy="15" r="1.4" fill="#F28C8C" opacity=".45"/>';
    if (o.hat) s += '<ellipse cx="20" cy="7.5" rx="14" ry="2.6" fill="#D8B26A" stroke="#A9823C" stroke-width=".8"/><path d="M13.5 7.5 Q14 0.5 20 0.5 Q26 0.5 26.5 7.5 Z" fill="#E6C47C" stroke="#A9823C" stroke-width=".8"/><path d="M13.7 5.6 h12.6" stroke="#7A2E1E" stroke-width="1.6"/>';
    if (o.lantern) s += '<path d="M32 38 v2" stroke="#4A3A2E" stroke-width="1"/><rect x="29" y="40" width="6" height="8" rx="1.5" fill="#FFD966" stroke="#8A6A2E" stroke-width="1"/><circle cx="32" cy="44" r="6" fill="#FFE58A" opacity=".35"/>';
    s += '</g>';
    return s;
  }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); }
    return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  function person(o, size, label) { return svg('0 0 40 60', [size * 40 / 60, size], personBody(o || {}), label); }

  function foxBody() {
    var g = U('fx');
    return '<defs>' + lin(g, 0, 0, 0, 1, [[0, '#FF9A45'], [1, '#D9620F']]) + '</defs>' +
      '<ellipse cx="20" cy="58" rx="14" ry="2.2" fill="#000" opacity=".15"/>' +
      '<path d="M28 46 Q42 40 37 26 Q34 36 26 40 Z" fill="url(#' + g + ')"/><path d="M37 26 Q39 30 36 33 Q34 29 37 26Z" fill="#fff"/>' +
      '<path d="M11 36 Q10 50 13 57 h4 l1 -10 h6 l1 10 h4 Q31 48 29 36 Z" fill="url(#' + g + ')"/>' +
      '<path d="M15 40 Q20 48 25 40 Q20 44 15 40Z" fill="#FFF2E2"/>' +
      '<path d="M8 22 L11 8 L18 17 Z M32 22 L29 8 L22 17 Z" fill="#D9620F"/><path d="M10.5 18 L12 11 L16 16Z M29.5 18 L28 11 L24 16Z" fill="#3A2416"/>' +
      '<path d="M7 22 Q8 14 20 14 Q32 14 33 22 Q31 30 20 37 Q9 30 7 22Z" fill="url(#' + g + ')"/>' +
      '<path d="M9 24 Q14 25 20 37 Q26 25 31 24 Q27 31 20 37 Q13 31 9 24Z" fill="#FFF2E2"/>' +
      '<ellipse cx="15" cy="22" rx="1.6" ry="2" fill="#2A1A0E"/><ellipse cx="25" cy="22" rx="1.6" ry="2" fill="#2A1A0E"/><circle cx="20" cy="33.5" r="2" fill="#2A1A0E"/>';
  }
  function henBody() {
    var g = U('hn');
    return '<defs>' + rad(g, '.4', '.35', '.8', [[0, '#FFFFFF'], [1, '#E2DCD2']]) + '</defs>' +
      '<ellipse cx="20" cy="58" rx="12" ry="2.2" fill="#000" opacity=".15"/>' +
      '<path d="M17 50 l-2 7 h5 M23 50 l2 7 h-5" stroke="#E6A23C" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M31 30 Q40 24 37 38 Q35 33 31 34Z" fill="#E2DCD2"/>' +
      '<ellipse cx="20" cy="39" rx="13" ry="12" fill="url(#' + g + ')" stroke="#C9C0B2" stroke-width=".8"/>' +
      '<path d="M12 37 Q20 46 28 38 Q22 41 12 37Z" fill="#D5CCBE"/>' +
      '<circle cx="15" cy="24" r="7.5" fill="url(#' + g + ')" stroke="#C9C0B2" stroke-width=".8"/>' +
      '<path d="M11 18 q1 -5 3 -2 q1 -4 3 -1 q2 -3 3 1 q-4 3 -9 2Z" fill="#E0303F"/>' +
      '<path d="M8 24 L3.5 25.5 L8 27 Z" fill="#F2A516"/><path d="M9 28 q-1.5 3 1 4 q1 -2 1 -4Z" fill="#E0303F"/>' +
      '<circle cx="13" cy="23" r="1.4" fill="#2A1A0E"/>';
  }
  function cornBody() {
    var g = U('cn');
    return '<defs>' + lin(g, 0, 0, 1, 0, [[0, '#D9B56E'], [0.5, '#EED39A'], [1, '#C99E4F']]) + '</defs>' +
      '<ellipse cx="20" cy="58" rx="13" ry="2.4" fill="#000" opacity=".15"/>' +
      '<path d="M9 30 Q7 46 9 57 Q20 60 31 57 Q33 46 31 30 Z" fill="url(#' + g + ')" stroke="#A47E3A" stroke-width="1"/>' +
      '<path d="M10 30 Q20 24 30 30 Q26 26 24 22 Q20 25 16 22 Q14 26 10 30Z" fill="#E2C27E" stroke="#A47E3A" stroke-width="1"/>' +
      '<path d="M15 25 Q20 29 25 25" stroke="#8A5A2A" stroke-width="2" fill="none"/>' +
      '<g transform="translate(13 10)"><ellipse cx="7" cy="9" rx="4.2" ry="9" fill="#F6CB2F"/>' +
      [2, 5, 8, 11, 14].map(function (y) { return '<path d="M3.4 ' + y + ' h7.2" stroke="#D9A40F" stroke-width=".8"/>'; }).join('') +
      '<path d="M7 18 Q0 12 1 4 Q4 12 7 14 Z M7 18 Q14 12 13 4 Q10 12 7 14Z" fill="#6CBF4A"/></g>' +
      '<text x="20" y="48" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="7" fill="#8A6A2E" opacity=".8">MAÍZ</text>';
  }
  // Characters of the crossing puzzles, by id
  function crosser(id, size, label) {
    var b;
    switch (id) {
      case 'farmer': b = personBody({ look: LOOKS[0], hat: 1 }); break;
      case 'fox': case 'fox1': case 'fox2': case 'fox3': b = foxBody(); break;
      case 'hen': case 'hen1': case 'hen2': case 'hen3': b = henBody(); break;
      case 'corn': b = cornBody(); break;
      case 'dad': b = personBody({ look: LOOKS[5] }); break;
      case 'mom': b = personBody({ look: LOOKS[4], long: 1 }); break;
      case 'kid1': b = personBody({ look: LOOKS[2], kid: 1 }); break;
      case 'kid2': b = personBody({ look: LOOKS[7], kid: 1, long: 1 }); break;
      case 'p1': b = personBody({ look: LOOKS[1], kid: 1, num: 1 }); break;
      case 'p2': b = personBody({ look: LOOKS[6], kid: 1, long: 1, num: 2 }); break;
      case 'p5': b = personBody({ look: LOOKS[3], kid: 1, num: 5 }); break;
      case 'p10': b = personBody({ look: LOOKS[4], kid: 1, long: 1, num: 10 }); break;
      default: b = '';
    }
    return svg('0 0 40 60', [size * 40 / 60, size], b, label);
  }
  function islander(i, size, label) {
    return svg('0 0 40 60', [size * 40 / 60, size], personBody({ look: LOOKS[i % LOOKS.length], long: i % 2 }), label);
  }
  function lantern(size, lit) {
    var g = U('ln');
    return svg('0 0 30 40', [size * 0.75, size],
      '<defs>' + rad(g, '.5', '.55', '.5', [[0, '#FFF6C2'], [1, '#FFC93D']]) + '</defs>' +
      (lit !== false ? '<circle cx="15" cy="24" r="14" fill="#FFE58A" opacity=".35"/>' : '') +
      '<path d="M10 6 Q15 0 20 6" stroke="#5A4630" stroke-width="2" fill="none"/><rect x="8" y="7" width="14" height="4" rx="1.5" fill="#5A4630"/>' +
      '<rect x="9" y="11" width="12" height="20" rx="3" fill="url(#' + g + ')" stroke="#5A4630" stroke-width="1.6"/>' +
      '<path d="M15 16 q3 4 0 8 q-3 -4 0 -8Z" fill="#F7891F"/><rect x="7" y="31" width="16" height="4" rx="1.5" fill="#5A4630"/>');
  }
  // The boat (drawn on its own, so CSS can slide it across the river)
  function boat(w) {
    var g = U('bt');
    return svg('0 0 120 50', [w, w * 50 / 120],
      '<defs>' + lin(g, 0, 0, 0, 1, [[0, '#B5763A'], [1, '#7A4A20']]) + '</defs>' +
      '<path d="M4 18 L116 18 Q108 44 90 46 L30 46 Q12 44 4 18Z" fill="url(#' + g + ')" stroke="#5A3414" stroke-width="2"/>' +
      '<path d="M8 24 H112 M14 32 H106" stroke="#5A3414" stroke-width="1.2" opacity=".6"/><path d="M4 18 L116 18" stroke="#D6A36A" stroke-width="3"/>' +
      '<path d="M96 14 L118 2" stroke="#6B4423" stroke-width="3" stroke-linecap="round"/><ellipse cx="118" cy="3" rx="3" ry="6" fill="#8A5A2A" transform="rotate(60 118 3)"/>');
  }
  // River backdrop (banks, water, reeds); the bridge variant draws a ravine and a rope bridge.
  function riverScene(kind) {
    var w = U('rw'), gr = U('rg'), sk = U('rs');
    var defs = '<defs>' + lin(sk, 0, 0, 0, 1, kind === 'bridge' ? [[0, '#1E2A55'], [1, '#41528C']] : [[0, '#BFE3FF'], [1, '#EAF6FF']]) +
      lin(w, 0, 0, 0, 1, [[0, '#4FA8E8'], [1, '#2470B8']]) + lin(gr, 0, 0, 0, 1, kind === 'bridge' ? [[0, '#5B6B4A'], [1, '#3C4A30']] : [[0, '#8BCB5A'], [1, '#5E9E3A']]) + '</defs>';
    var b = defs + '<rect width="400" height="220" fill="url(#' + sk + ')"/>';
    if (kind === 'bridge') {
      b += [[40, 30], [90, 18], [160, 40], [230, 22], [300, 36], [360, 14], [120, 60], [270, 64]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="#fff" opacity=".8"/>'; }).join('');
      b += '<circle cx="335" cy="44" r="14" fill="#F6F0C8"/><circle cx="341" cy="40" r="12" fill="url(#' + sk + ')"/>';
      b += '<path d="M0 130 L120 130 L132 220 L0 220Z M400 130 L280 130 L268 220 L400 220Z" fill="url(#' + gr + ')"/>';
      b += '<path d="M126 132 L140 220 L260 220 L274 132 Z" fill="#141B36"/>';
      b += '<path d="M118 128 Q200 158 282 128" stroke="#8A5A2A" stroke-width="4" fill="none"/>';
      for (var x = 126; x < 280; x += 10) { var y = 128 + 30 * (1 - Math.pow((x - 200) / 82, 2)) * 1; b += '<rect x="' + (x - 3) + '" y="' + (y - 2) + '" width="7" height="5" fill="#B5763A" stroke="#6B4423" stroke-width=".6"/>'; }
      b += '<path d="M118 110 Q200 140 282 110" stroke="#C9A06E" stroke-width="2" fill="none"/><path d="M118 110 V130 M282 110 V130" stroke="#6B4423" stroke-width="4"/>';
    } else {
      b += '<ellipse cx="70" cy="40" rx="30" ry="9" fill="#fff" opacity=".85"/><ellipse cx="300" cy="28" rx="36" ry="10" fill="#fff" opacity=".85"/>';
      b += '<path d="M0 100 L60 70 L120 96 L190 60 L260 98 L330 66 L400 92 L400 130 L0 130Z" fill="#9DB8C9" opacity=".7"/>';
      b += '<rect x="0" y="122" width="400" height="98" fill="url(#' + w + ')"/>';
      for (var i = 0; i < 9; i++) b += '<path d="M' + (130 + (i % 3) * 50) + ' ' + (140 + Math.floor(i / 3) * 24) + ' q8 -5 16 0 q8 5 16 0" stroke="#BFE3FF" stroke-width="2" fill="none" opacity=".6"/>';
      b += '<path d="M0 118 L118 118 Q128 170 112 220 L0 220Z M400 118 L282 118 Q272 170 288 220 L400 220Z" fill="url(#' + gr + ')"/>';
      b += '<path d="M0 118 L118 118 M282 118 L400 118" stroke="#4E8A30" stroke-width="3"/>';
      [[16, 118], [104, 120], [292, 120], [388, 118]].forEach(function (p) {
        b += '<path d="M' + p[0] + ' ' + p[1] + ' q-3 -16 -1 -24 M' + (p[0] + 4) + ' ' + p[1] + ' q2 -18 6 -22 M' + (p[0] + 2) + ' ' + p[1] + ' v-28" stroke="#3E7A2A" stroke-width="2" fill="none"/><ellipse cx="' + (p[0] + 2) + '" cy="' + (p[1] - 30) + '" rx="2.4" ry="6" fill="#7A4A22"/>';
      });
    }
    return svg('0 0 400 220', [400, 220], b).replace('width="400" height="220"', 'preserveAspectRatio="none" class="lg-scene-bg"');
  }

  // ---------------------------------------------------------------
  // The balance scale
  // ---------------------------------------------------------------
  // side: { o: [fruit ids], b: blocks }; tilt: -1 left down, 0 level, 1 right down
  function panItems(side, cx, baseY) {
    var list = [];
    (side.o || []).forEach(function (o) { list.push({ t: 'f', id: o }); });
    for (var i = 0; i < (side.b || 0); i++) list.push({ t: 'b' });
    (side.c || []).forEach(function (c) { list.push({ t: 'c', n: c + 1 }); });
    // stack in rows of up to 3 (fruit) / 4 (blocks)
    var out = '', perRow = list.length > 6 ? 4 : 3, size = list.length > 6 ? 24 : list.length > 3 ? 30 : 36;
    list.forEach(function (it, k) {
      var row = Math.floor(k / perRow), col = k % perRow;
      var inRow = Math.min(perRow, list.length - row * perRow);
      var x = cx - (inRow * size) / 2 + col * size, y = baseY - (row + 1) * (size - 3);
      if (it.t === 'f') out += '<g transform="translate(' + x + ' ' + (y - 2) + ') scale(' + (size / 40) + ')">' + fruitBody(it.id) + '</g>';
      else if (it.t === 'c') out += '<g transform="translate(' + x + ' ' + (y + 1) + ') scale(' + (size / 40) + ')">' + coinBody(it.n) + '</g>';
      else out += blockBody(x + 1, y + 2, size / 26);
    });
    return out;
  }
  function scale(sc, w, label) {
    var tilt = sc.tilt || 0, ang = tilt * 9, rad2 = ang * Math.PI / 180;
    var g = U('sc'), m = U('sm');
    var L = 92, cx = 150, cy = 58;
    var lx = cx - L * Math.cos(rad2), ly = cy - L * Math.sin(rad2) * -1;
    var rx = cx + L * Math.cos(rad2), ry = cy + L * Math.sin(rad2) * -1;
    // tilt -1: left down → left end lower (larger y)
    ly = cy + (tilt === -1 ? 1 : tilt === 1 ? -1 : 0) * L * Math.sin(Math.abs(rad2));
    ry = cy + (tilt === 1 ? 1 : tilt === -1 ? -1 : 0) * L * Math.sin(Math.abs(rad2));
    function pan(x, y, side) {
      var py = y + 66;
      return '<path d="M' + x + ' ' + y + ' L' + (x - 50) + ' ' + py + ' M' + x + ' ' + y + ' L' + (x + 50) + ' ' + py + '" stroke="#8A7560" stroke-width="1.6"/>' +
        panItems(side, x, py + 1) +
        '<path d="M' + (x - 56) + ' ' + py + ' L' + (x + 56) + ' ' + py + ' Q' + (x + 46) + ' ' + (py + 15) + ' ' + x + ' ' + (py + 15) + ' Q' + (x - 46) + ' ' + (py + 15) + ' ' + (x - 56) + ' ' + py + ' Z" fill="url(#' + m + ')" stroke="#8A6A2E" stroke-width="1.4"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="#6B5A44"/>';
    }
    var body = '<defs>' + lin(g, 0, 0, 1, 0, [[0, '#8A6A4A'], [0.5, '#C9A57C'], [1, '#8A6A4A']]) + lin(m, 0, 0, 0, 1, [[0, '#F7DE8E'], [1, '#C79A35']]) + '</defs>' +
      '<ellipse cx="150" cy="196" rx="70" ry="6" fill="#000" opacity=".1"/>' +
      '<path d="M112 196 L188 196 L176 184 L124 184 Z" fill="#6B4A2B"/><rect x="145" y="60" width="10" height="126" rx="3" fill="url(#' + g + ')"/>' +
      '<path d="M150 40 L141 60 H159 Z" fill="#7A5A3A"/>' +
      '<path d="M' + lx + ' ' + ly + ' L' + rx + ' ' + ry + '" stroke="#6B4A2B" stroke-width="7" stroke-linecap="round"/>' +
      '<circle cx="150" cy="58" r="7" fill="#C9A57C" stroke="#6B4A2B" stroke-width="2"/>' +
      '<path d="M150 58 L150 ' + (tilt ? 72 : 76) + '" stroke="#B23A2A" stroke-width="2.4" transform="rotate(' + (-ang) + ' 150 58)"/>' +
      pan(lx, ly, sc.left) + pan(rx, ry, sc.right);
    return svg('0 0 300 205', [w, w * 205 / 300], body, label);
  }

  // A gold coin with a number (the fake coin puzzle)
  function coin(n, size) { return svg('0 0 40 40', size || 40, coinBody(n)); }
  function coinBody(n) {
    var g = U('cg');
    return (
      '<defs>' + rad(g, '.35', '.3', '.8', [[0, '#FFF0A8'], [0.55, '#F2C230'], [1, '#B98200']]) + '</defs>' +
      '<circle cx="20" cy="21.5" r="17" fill="#8A6200"/><circle cx="20" cy="20" r="17" fill="url(#' + g + ')" stroke="#9C7000" stroke-width="1.2"/>' +
      '<circle cx="20" cy="20" r="12.5" fill="none" stroke="#C99A1A" stroke-width="1.4" stroke-dasharray="2 2"/>' +
      '<text x="20" y="25" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="' + (n > 9 ? 13 : 15) + '" fill="#6B4A00">' + n + '</text>');
  }

  // ---------------------------------------------------------------
  // Room icons (home screen tiles), 64x64
  // ---------------------------------------------------------------
  function room(id, size) {
    var g = U('rm'), b = '';
    var BG = { sudoku: ['#E8EEFF', '#C9D6FF'], nono: ['#FFE8EC', '#FFC9D2'], grid: ['#E6F7EC', '#BFE8CE'], pattern: ['#FFF4DA', '#FFE2A0'],
      balance: ['#F3EBDD', '#E3CFA8'], river: ['#E2F3FF', '#B6DEFA'], knights: ['#EFE8FF', '#D5C6FF'], think: ['#E3F7F6', '#B5E6E2'] }[id] || ['#eee', '#ddd'];
    b += '<defs>' + lin(g, 0, 0, 0, 1, [[0, BG[0]], [1, BG[1]]]) + '</defs><rect x="1" y="1" width="62" height="62" rx="16" fill="url(#' + g + ')"/>';
    switch (id) {
      case 'sudoku':
        b += '<rect x="12" y="12" width="40" height="40" rx="3" fill="#fff" stroke="#3B4C8C" stroke-width="2"/>';
        b += '<path d="M25.3 12 V52 M38.6 12 V52 M12 25.3 H52 M12 38.6 H52" stroke="#9AA8D8" stroke-width="1"/><path d="M32 12 V52 M12 32 H52" stroke="#3B4C8C" stroke-width="2"/>';
        b += '<text x="18.6" y="23.6" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="9" fill="#2F6FE0" text-anchor="middle">1</text><text x="45.3" y="23.6" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="9" fill="#1c1b29" text-anchor="middle">3</text>';
        b += '<text x="25.3" y="49" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="9" fill="#1c1b29" text-anchor="middle">4</text><text x="45.3" y="36" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="9" fill="#2F6FE0" text-anchor="middle">2</text>';
        break;
      case 'nono':
        var px = ['.#.#.', '#####', '#####', '.###.', '..#..'];
        b += '<rect x="20" y="20" width="35" height="35" fill="#fff" stroke="#B9506A" stroke-width="1.4"/>';
        px.forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c === '#') b += '<rect x="' + (20.6 + x * 6.8) + '" y="' + (20.6 + y * 6.8) + '" width="6.4" height="6.4" fill="#E0435A"/>'; }); });
        b += '<text x="13" y="27" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="5.6" fill="#7A2A3A" text-anchor="middle">1 1</text><text x="13" y="34" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="5.6" fill="#7A2A3A" text-anchor="middle">5</text><text x="13" y="41" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="5.6" fill="#7A2A3A" text-anchor="middle">5</text>';
        b += '<text x="27" y="16" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="5.6" fill="#7A2A3A" text-anchor="middle">2</text><text x="37.5" y="16" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="5.6" fill="#7A2A3A" text-anchor="middle">4</text><text x="48" y="16" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="5.6" fill="#7A2A3A" text-anchor="middle">2</text>';
        break;
      case 'grid':
        b += '<rect x="22" y="22" width="32" height="32" fill="#fff" stroke="#2F7D45" stroke-width="1.6"/><path d="M32.7 22 V54 M43.3 22 V54 M22 32.7 H54 M22 43.3 H54" stroke="#9CCFAE" stroke-width="1.2"/>';
        b += '<path d="M25 25 L30 30 M30 25 L25 30" stroke="#C0392B" stroke-width="2" stroke-linecap="round"/><path d="M35.5 38 l3 3 l5.5 -6" stroke="#2FA35B" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M46 46 L51 51 M51 46 L46 51" stroke="#C0392B" stroke-width="2" stroke-linecap="round"/>';
        b += '<g transform="translate(22 4) scale(.4)">' + ITEM.dog() + '</g><g transform="translate(37 4) scale(.4)">' + ITEM.cat() + '</g><g transform="translate(3 22) scale(.4)">' + ITEM.fish() + '</g><g transform="translate(3 37) scale(.4)">' + ITEM.bird() + '</g>';
        break;
      case 'pattern':
        b += '<g transform="translate(5 22) scale(.5)">' + shape('circle', 'red', 40).replace(/<\/?svg[^>]*>/g, '') + '</g>';
        b += '<g transform="translate(19 22) scale(.5)">' + shape('triangle', 'blue', 40).replace(/<\/?svg[^>]*>/g, '') + '</g>';
        b += '<g transform="translate(33 22) scale(.5)">' + shape('circle', 'red', 40).replace(/<\/?svg[^>]*>/g, '') + '</g>';
        b += '<rect x="47" y="22" width="13" height="20" rx="4" fill="#fff" stroke="#C99A1A" stroke-width="1.6" stroke-dasharray="3 2"/><text x="53.5" y="36" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="12" fill="#B45309" text-anchor="middle">?</text>';
        b += '<text x="32" y="56" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="9" fill="#8A5A0B" text-anchor="middle">2 4 8 16</text>';
        break;
      case 'balance':
        b += scale({ left: { o: ['apple'] }, right: { b: 2 }, tilt: 0 }, 64).replace(/^<svg[^>]*>/, '<g transform="translate(4 6) scale(.187)">').replace(/<\/svg>$/, '</g>');
        break;
      case 'river':
        b += '<path d="M1 40 H63 V47 Q63 63 47 63 H17 Q1 63 1 47 Z" fill="#3F93D6"/><path d="M8 50 q4 -3 8 0 q4 3 8 0 M34 55 q4 -3 8 0 q4 3 8 0" stroke="#BFE3FF" stroke-width="1.4" fill="none"/>';
        b += '<path d="M1 40 L14 40 Q18 52 10 63 L1 63Z M63 40 L50 40 Q46 52 54 63 L63 63Z" fill="#6CB04A"/>';
        b += '<g transform="translate(16 34) scale(.27)">' + boat(120).replace(/<\/?svg[^>]*>/g, '') + '</g>';
        b += '<g transform="translate(22 14) scale(.38)">' + personBody({ look: LOOKS[0], hat: 1 }) + '</g><g transform="translate(34 22) scale(.26)">' + henBody() + '</g>';
        b += '<g transform="translate(51 20) scale(.3)">' + foxBody() + '</g>';
        break;
      case 'knights':
        b += '<ellipse cx="32" cy="56" rx="28" ry="6" fill="#E9D49A"/>';
        b += '<g transform="translate(6 10) scale(.72)">' + personBody({ look: LOOKS[2] }) + '</g><g transform="translate(30 10) scale(.72)">' + personBody({ look: LOOKS[1], long: 1 }) + '</g>';
        b += '<path d="M12 4 h16 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -3 3 h-9 l-4 4 v-4 h-3 a3 3 0 0 1 -3 -3 v-6 a3 3 0 0 1 3 -3Z" fill="#fff" stroke="#6D28D9" stroke-width="1.2"/><text x="20" y="13.6" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="7" fill="#6D28D9" text-anchor="middle">¿V/F?</text>';
        break;
      case 'think':
        b += '<circle cx="28" cy="28" r="15" fill="#fff" stroke="#0E7490" stroke-width="4"/><path d="M39 39 L53 53" stroke="#0E7490" stroke-width="6" stroke-linecap="round"/><path d="M39 39 L53 53" stroke="#7FCFD8" stroke-width="2" stroke-linecap="round"/>';
        b += '<path d="M22 28 l4 4 l8 -9" stroke="#2FA35B" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="22" cy="21" rx="4" ry="2.4" fill="#E3F7F6" transform="rotate(-30 22 21)"/>';
        break;
    }
    return svg('0 0 64 64', size || 56, b);
  }

  return {
    owl: owl, star: star, flame: flame, shape: shape, shapeName: shapeName, fruit: fruit, block: block, item: item,
    person: person, crosser: crosser, islander: islander, lantern: lantern, boat: boat, riverScene: riverScene,
    scale: scale, coin: coin, room: room, PALETTE: PALETTE, LOOKS: LOOKS
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LogicaArt;
