/* ================================================================
   COCINA LAB — art (js/cocina-lab-art.js)

   1) dish(id)   → inline SVG illustration for each recipe card
   2) icon(name) → small SVG safety / helper icons
   3) Canvas primitives for the Measuring Lab: marble counter and
      tiled wall, glass measuring jug with liquid + meniscus, pour
      sources and stream, stainless measuring cups, flour sack,
      mixing bowl, butter knife, digital and dial kitchen scales.

   Everything is drawn in code. No images, no network.
   ================================================================ */

var CocinaArt = (function() {
  'use strict';

  var _uid = 0;

  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f1(n) { return Math.round(n * 10) / 10; }

  // =================================================================
  // 1) DISH ART (SVG, viewBox 240 × 160)
  // =================================================================

  function _defs(u) {
    return '' +
      '<linearGradient id="' + u + 'wood" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#B9844F"/><stop offset=".45" stop-color="#A26E3D"/><stop offset="1" stop-color="#7E5129"/></linearGradient>' +
      '<radialGradient id="' + u + 'light" cx=".28" cy=".18" r=".9">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>' +
      '<radialGradient id="' + u + 'plate" cx=".42" cy=".36" r=".7">' +
        '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F2F0EC"/><stop offset="1" stop-color="#D8D3CB"/></radialGradient>' +
      '<radialGradient id="' + u + 'well" cx=".5" cy=".4" r=".65">' +
        '<stop offset="0" stop-color="#FBFAF8"/><stop offset=".8" stop-color="#ECE8E2"/><stop offset="1" stop-color="#DCD6CD"/></radialGradient>' +
      '<filter id="' + u + 'blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<filter id="' + u + 'soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter>';
  }

  function _table(u, r) {
    var s = '<rect width="240" height="160" fill="url(#' + u + 'wood)"/>';
    // planks
    s += '<path d="M0 54 H240 M0 108 H240" stroke="#5E3B1C" stroke-opacity=".45" stroke-width="1.2"/>';
    // grain
    for (var i = 0; i < 26; i++) {
      var y = r() * 160, a = 1 + r() * 3, p = r() * 6;
      var d = 'M0 ' + f1(y);
      for (var x = 20; x <= 240; x += 20) d += ' Q' + f1(x - 10) + ' ' + f1(y + Math.sin(x / 30 + p) * a) + ' ' + x + ' ' + f1(y + Math.sin(x / 22 + p) * a * 0.6);
      s += '<path d="' + d + '" fill="none" stroke="' + (r() > .5 ? '#5A3519' : '#D2A06A') + '" stroke-opacity="' + f1(0.12 + r() * 0.18) + '" stroke-width="' + f1(0.5 + r() * 1.1) + '"/>';
    }
    // a knot
    s += '<ellipse cx="' + f1(30 + r() * 170) + '" cy="' + f1(20 + r() * 120) + '" rx="7" ry="3" fill="none" stroke="#5A3519" stroke-opacity=".3"/>';
    return s;
  }

  function _plate(u, cx, cy, rx, ry) {
    return '<ellipse cx="' + (cx + 6) + '" cy="' + (cy + 9) + '" rx="' + rx + '" ry="' + ry + '" fill="#2B1608" opacity=".45" filter="url(#' + u + 'blur)"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + u + 'plate)" stroke="#C9C2B7" stroke-width=".8"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + 2) + '" rx="' + f1(rx * 0.72) + '" ry="' + f1(ry * 0.7) + '" fill="url(#' + u + 'well)"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + 1) + '" rx="' + f1(rx * 0.72) + '" ry="' + f1(ry * 0.7) + '" fill="none" stroke="#CFC8BE" stroke-width=".8"/>' +
      '<path d="M' + f1(cx - rx * 0.86) + ' ' + f1(cy - ry * 0.3) + ' A' + rx + ' ' + ry + ' 0 0 1 ' + f1(cx - rx * 0.2) + ' ' + f1(cy - ry * 0.97) + '" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>';
  }

  function _shadow(u, cx, cy, rx, ry, op) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1E0F05" opacity="' + (op || .45) + '" filter="url(#' + u + 'blur)"/>';
  }

  function _sprinkle(r, n, x0, y0, w, h, col, rmax, op) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<circle cx="' + f1(x0 + r() * w) + '" cy="' + f1(y0 + r() * h) + '" r="' + f1(0.3 + r() * rmax) + '" fill="' + col + '" opacity="' + f1(op * (0.5 + r() * 0.5)) + '"/>';
    }
    return s;
  }

  function _leaf(x, y, a, sz) {
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + f1(a) + ') scale(' + f1(sz) + ')">' +
      '<path d="M0 0 C3 -4 8 -4 10 0 C8 4 3 4 0 0Z" fill="#3D8B37"/>' +
      '<path d="M1 0 C4 -1.5 7 -1.5 9.5 0" stroke="#8CCB6E" stroke-width=".5" fill="none"/>' +
      '<path d="M2 0.4 C3 -2.6 6 -2.6 7 0" fill="#56A845" opacity=".6"/></g>';
  }

  var DISH = {};

  DISH['panqueques'] = function(u, r) {
    var s = _defs(u) +
      '<linearGradient id="' + u + 'crepe" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#F7DCA6"/><stop offset=".35" stop-color="#EDB872"/><stop offset=".75" stop-color="#D08F45"/><stop offset="1" stop-color="#A66A2C"/></linearGradient>' +
      '<radialGradient id="' + u + 'end" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#7A3A0E"/><stop offset=".5" stop-color="#E9BE7E"/><stop offset="1" stop-color="#C98942"/></radialGradient>';
    s = '<defs>' + s + '</defs>' + _table(u, r) + _plate(u, 120, 88, 104, 62);
    var rolls = [[70, 70, -14], [92, 92, -14], [114, 114, -14]];
    rolls.forEach(function(p, k) {
      var g = '<g transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')">';
      g += '<ellipse cx="55" cy="16" rx="58" ry="9" fill="#5A3416" opacity=".35" filter="url(#' + u + 'soft)"/>';
      g += '<rect x="0" y="-12" width="104" height="26" rx="13" fill="url(#' + u + 'crepe)"/>';
      // lacy browned spots
      g += '<clipPath id="' + u + 'rc' + k + '"><rect x="0" y="-12" width="104" height="26" rx="13"/></clipPath><g clip-path="url(#' + u + 'rc' + k + ')">';
      for (var i = 0; i < 26; i++) g += '<ellipse cx="' + f1(r() * 104) + '" cy="' + f1(-12 + r() * 26) + '" rx="' + f1(1 + r() * 4) + '" ry="' + f1(0.6 + r() * 2) + '" fill="#9A561C" opacity="' + f1(0.15 + r() * 0.3) + '"/>';
      g += '<path d="M6 -8 H98" stroke="#FFF3D6" stroke-width="3" stroke-linecap="round" opacity=".55"/></g>';
      // end cap with manjar spiral
      g += '<ellipse cx="101" cy="1" rx="7" ry="13" fill="url(#' + u + 'end)"/>';
      g += '<path d="M101 1 m0 -2 a2 3 0 1 1 -1 4 a4 6 0 1 1 3 -9 a5.5 10 0 1 1 -4 16" fill="none" stroke="#6E3510" stroke-width="1.6"/>';
      g += '</g>';
      s += g;
    });
    // manjar drizzle with gloss
    var d = 'M58 64 C80 98, 96 58, 118 96 S150 78, 170 118';
    s += '<path d="' + d + '" fill="none" stroke="#5E2B0B" stroke-width="5.5" stroke-linecap="round" opacity=".5" transform="translate(1.5 2.5)" filter="url(#' + u + 'soft)"/>';
    s += '<path d="' + d + '" fill="none" stroke="#83420F" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="' + d + '" fill="none" stroke="#D99A56" stroke-width="1.3" stroke-linecap="round" transform="translate(-1 -1.4)" opacity=".85"/>';
    s += _sprinkle(r, 70, 60, 60, 130, 70, '#FFFFFF', 0.9, .85);
    s += _leaf(178, 66, -30, 1.3) + _leaf(186, 70, 30, 1.1);
    return s;
  };

  DISH['queque'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<linearGradient id="' + u + 'crust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D99A4A"/><stop offset=".5" stop-color="#B26E2B"/><stop offset="1" stop-color="#7C4518"/></linearGradient>' +
      '<linearGradient id="' + u + 'top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2C27A"/><stop offset="1" stop-color="#B8742E"/></linearGradient>' +
      '<linearGradient id="' + u + 'crumb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBE6A8"/><stop offset="1" stop-color="#EBC86F"/></linearGradient>' +
      '<linearGradient id="' + u + 'board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2B983"/><stop offset="1" stop-color="#B98650"/></linearGradient>' +
      '</defs>' + _table(u, r);
    // cutting board
    s += _shadow(u, 124, 128, 104, 18);
    s += '<rect x="18" y="96" width="206" height="40" rx="12" fill="#8E5D2F"/><rect x="18" y="92" width="206" height="38" rx="12" fill="url(#' + u + 'board)"/>';
    for (var i = 0; i < 7; i++) s += '<path d="M24 ' + (98 + i * 4.5) + ' Q120 ' + (96 + i * 4.5 + r() * 3) + ' 218 ' + (98 + i * 4.5) + '" stroke="#9C6B3A" stroke-opacity=".25" fill="none"/>';
    // loaf
    s += _shadow(u, 108, 112, 70, 8, .5);
    s += '<path d="M40 112 L46 62 Q50 54 60 54 L160 54 Q170 54 172 62 L178 112 Z" fill="url(#' + u + 'crust)"/>';
    s += '<path d="M44 66 Q108 18 174 66 Q108 52 44 66Z" fill="url(#' + u + 'top)"/>';
    s += '<path d="M62 54 Q108 34 156 54" stroke="#7A4216" stroke-width="2.2" fill="none"/>';
    s += '<path d="M66 53 Q108 38 152 53" stroke="#FCE3A4" stroke-width="2.6" fill="none" opacity=".9"/>';
    s += '<path d="M50 70 Q60 64 70 72" stroke="#FFE7B5" stroke-width="2" fill="none" opacity=".45"/>';
    // cut face on the right end
    s += '<path d="M150 64 Q164 58 176 66 L182 110 L152 112 Z" fill="url(#' + u + 'crumb)" stroke="#9C5C22" stroke-width="2.2"/>';
    for (i = 0; i < 26; i++) s += '<ellipse cx="' + f1(156 + r() * 22) + '" cy="' + f1(68 + r() * 40) + '" rx="' + f1(0.5 + r() * 1.3) + '" ry="' + f1(0.4 + r() * 0.9) + '" fill="#D9AE52" opacity=".8"/>';
    // slice lying in front
    s += _shadow(u, 196, 120, 26, 6, .45);
    s += '<path d="M176 116 L184 86 Q200 80 214 88 L220 116 Z" fill="#9C5C22"/>';
    s += '<path d="M179 114 L186 89 Q200 84 211 90 L216 114 Z" fill="url(#' + u + 'crumb)"/>';
    for (i = 0; i < 14; i++) s += '<ellipse cx="' + f1(186 + r() * 26) + '" cy="' + f1(92 + r() * 20) + '" rx="' + f1(0.5 + r() * 1.2) + '" ry=".7" fill="#D9AE52"/>';
    s += _sprinkle(r, 60, 56, 40, 110, 22, '#FFFFFF', 0.9, .9);
    return s;
  };

  DISH['pan-amasado'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<pattern id="' + u + 'chk" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">' +
        '<rect width="20" height="20" fill="#F7F1E7"/><rect width="10" height="20" fill="#C7322B" opacity=".55"/><rect width="20" height="10" fill="#C7322B" opacity=".55"/></pattern>' +
      '<radialGradient id="' + u + 'bun" cx=".42" cy=".35" r=".7"><stop offset="0" stop-color="#F6CF8C"/><stop offset=".55" stop-color="#D99A4C"/><stop offset=".9" stop-color="#A9662A"/><stop offset="1" stop-color="#8C511F"/></radialGradient>' +
      '</defs>' + _table(u, r);
    s += _shadow(u, 126, 108, 108, 40);
    s += '<path d="M14 66 Q30 40 120 34 Q206 30 230 64 L226 140 Q120 156 12 140 Z" fill="url(#' + u + 'chk)"/>';
    s += '<path d="M14 66 Q30 40 120 34 Q206 30 230 64 L226 140 Q120 156 12 140 Z" fill="url(#' + u + 'light)"/>';
    s += '<path d="M40 50 Q90 66 70 100 M180 44 Q170 80 208 96" stroke="#7B5A3A" stroke-opacity=".18" stroke-width="5" fill="none"/>';
    var buns = [[78, 76, 1], [160, 72, 1], [120, 112, 1.08], [56, 118, .92], [190, 116, .92]];
    buns.forEach(function(b) {
      var x = b[0], y = b[1], k = b[2], rx = 36 * k, ry = 24 * k;
      s += '<ellipse cx="' + (x + 4) + '" cy="' + (y + 10) + '" rx="' + rx + '" ry="' + f1(ry * .8) + '" fill="#2A160A" opacity=".45" filter="url(#' + u + 'soft)"/>';
      s += '<ellipse cx="' + x + '" cy="' + (y + 5) + '" rx="' + rx + '" ry="' + ry + '" fill="#8A4E1D"/>';
      s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + u + 'bun)"/>';
      // flour dust
      s += _sprinkle(r, 26, x - rx * .6, y - ry * .7, rx * 1.2, ry * 1.2, '#FFF8EC', 1.1, .55);
      // fork pricks
      for (var row = -1; row <= 1; row++) for (var c = -1; c <= 1; c++) {
        var px = x + c * 11 * k + row * 2, py = y + row * 7 * k;
        s += '<circle cx="' + f1(px) + '" cy="' + f1(py) + '" r="1.2" fill="#6B3A12"/><circle cx="' + f1(px + 2.6) + '" cy="' + f1(py) + '" r="1.2" fill="#6B3A12"/>';
      }
      s += '<path d="M' + f1(x - rx * .7) + ' ' + f1(y - ry * .3) + ' Q' + f1(x - rx * .4) + ' ' + f1(y - ry * .9) + ' ' + f1(x + rx * .1) + ' ' + f1(y - ry * .85) + '" stroke="#FFE9C0" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>';
    });
    return s;
  };

  DISH['galletas-avena'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<radialGradient id="' + u + 'ck" cx=".45" cy=".4" r=".62"><stop offset="0" stop-color="#E9BE77"/><stop offset=".7" stop-color="#C98A40"/><stop offset="1" stop-color="#8E5320"/></radialGradient>' +
      '<linearGradient id="' + u + 'milk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E7E8E6"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5D7D6"/></linearGradient>' +
      '</defs>' + _table(u, r);
    // glass of milk
    s += _shadow(u, 196, 104, 26, 8);
    s += '<path d="M174 20 L178 102 Q196 110 214 102 L218 20 Z" fill="url(#' + u + 'milk)"/>';
    s += '<ellipse cx="196" cy="22" rx="22" ry="5" fill="#FAFAF8" stroke="#D9DADB"/>';
    s += '<path d="M174 16 L178 104 M218 16 L214 104" stroke="#fff" stroke-opacity=".7"/>';
    s += '<rect x="182" y="26" width="5" height="70" rx="2.5" fill="#fff" opacity=".8"/>';
    s += _plate(u, 106, 96, 96, 56);
    function cookie(x, y, rad) {
      var c = '<ellipse cx="' + (x + 3) + '" cy="' + (y + 6) + '" rx="' + rad + '" ry="' + f1(rad * .6) + '" fill="#3B2210" opacity=".35" filter="url(#' + u + 'soft)"/>';
      c += '<ellipse cx="' + x + '" cy="' + (y + 3) + '" rx="' + rad + '" ry="' + f1(rad * .62) + '" fill="#8E5320"/>';
      c += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rad + '" ry="' + f1(rad * .62) + '" fill="url(#' + u + 'ck)"/>';
      for (var i = 0; i < 22; i++) {
        var a = r() * 6.28, d = Math.sqrt(r()) * rad * .82;
        c += '<ellipse cx="' + f1(x + Math.cos(a) * d) + '" cy="' + f1(y + Math.sin(a) * d * .62) + '" rx="' + f1(1.6 + r() * 1.8) + '" ry="' + f1(0.9 + r() * .8) + '" transform="rotate(' + Math.round(r() * 180) + ' ' + f1(x + Math.cos(a) * d) + ' ' + f1(y + Math.sin(a) * d * .62) + ')" fill="' + (r() > .5 ? '#F4DEA9' : '#B9772F') + '" opacity=".9"/>';
      }
      c += '<path d="M' + (x - rad * .5) + ' ' + (y - 2) + ' l6 3 l5 -2" stroke="#7E461A" fill="none" stroke-width=".9" opacity=".7"/>';
      return c;
    }
    s += cookie(70, 96, 28) + cookie(124, 108, 28) + cookie(140, 76, 26);
    // stack at left
    s += cookie(46, 76, 22) + cookie(46, 68, 22) + cookie(48, 60, 22);
    s += _sprinkle(r, 14, 70, 110, 70, 18, '#B57A3A', 1, .7);
    return s;
  };

  DISH['ensalada-chilena'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<radialGradient id="' + u + 'tom" cx=".5" cy=".8" r=".9"><stop offset="0" stop-color="#F26A4B"/><stop offset=".7" stop-color="#E03A22"/><stop offset="1" stop-color="#A81B10"/></radialGradient>' +
      '<radialGradient id="' + u + 'bowl" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#EEF1F2"/><stop offset="1" stop-color="#C9D2D6"/></radialGradient>' +
      '</defs>' + _table(u, r);
    s += _shadow(u, 126, 100, 108, 56);
    s += '<ellipse cx="120" cy="84" rx="110" ry="68" fill="url(#' + u + 'bowl)" stroke="#B7C3C8"/>';
    s += '<ellipse cx="120" cy="84" rx="98" ry="58" fill="none" stroke="#2F5D8A" stroke-width="2.5" opacity=".8"/>';
    s += '<ellipse cx="120" cy="87" rx="88" ry="50" fill="#E4E9EA"/>';
    function slice(x, y, a, sz) {
      var g = '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + f1(a) + ') scale(' + f1(sz) + ')">';
      g += '<path d="M-20 0 A20 20 0 0 1 20 0 Z" fill="#7E140B" transform="translate(1.2 2)" opacity=".5"/>';
      g += '<path d="M-20 0 A20 20 0 0 1 20 0 Z" fill="url(#' + u + 'tom)"/>';
      g += '<path d="M-16 0 A16 16 0 0 1 16 0 Z" fill="#F0573A"/>';
      [-9, 0, 9].forEach(function(cx) {
        g += '<ellipse cx="' + cx + '" cy="-7" rx="4.2" ry="5.5" fill="#F7B04A" opacity=".85"/>';
        g += '<ellipse cx="' + cx + '" cy="-7" rx="2.6" ry="3.8" fill="#E9D76B" opacity=".7"/>';
        for (var i = 0; i < 3; i++) g += '<ellipse cx="' + f1(cx - 1.5 + i * 1.5) + '" cy="' + f1(-9 + i * 2) + '" rx=".9" ry=".55" fill="#FFF4B8"/>';
      });
      g += '<path d="M-14 -2 A14 14 0 0 1 -4 -13" stroke="#fff" stroke-width="1.4" opacity=".6" fill="none"/>';
      return g + '</g>';
    }
    var sl = [[70, 72, -20], [106, 62, 10], [146, 66, -6], [176, 90, 24], [90, 104, 170], [130, 100, -170], [60, 96, 160], [150, 116, 190], [112, 82, 4]];
    sl.forEach(function(p) { s += slice(p[0], p[1], p[2], 0.95 + r() * .2); });
    // onion feathers
    for (var i = 0; i < 16; i++) {
      var x = 50 + r() * 140, y = 60 + r() * 54, a = r() * 180, w = 12 + r() * 10;
      s += '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + f1(a) + ')"><path d="M0 0 Q' + f1(w / 2) + ' -6 ' + f1(w) + ' 0 Q' + f1(w / 2) + ' -3.5 0 0Z" fill="#F7F1F8" stroke="#C6A7D2" stroke-width=".6"/></g>';
    }
    for (i = 0; i < 18; i++) s += _leaf(48 + r() * 144, 58 + r() * 56, r() * 360, 0.6 + r() * .4);
    s += _sprinkle(r, 30, 50, 56, 140, 56, '#FFFFFF', 1, .6);
    return s;
  };

  DISH['leche-asada'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<radialGradient id="' + u + 'top" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#F3CF7E"/><stop offset=".7" stop-color="#DDA24C"/><stop offset="1" stop-color="#A9662A"/></radialGradient>' +
      '<linearGradient id="' + u + 'dish" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E2DDD3"/><stop offset=".3" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F3EFE7"/><stop offset="1" stop-color="#C9C1B4"/></linearGradient>' +
      '<linearGradient id="' + u + 'car" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8651D"/><stop offset="1" stop-color="#6A2E0A"/></linearGradient>' +
      '</defs>' + _table(u, r);
    // ramekin
    s += _shadow(u, 92, 132, 70, 14);
    s += '<path d="M24 64 L32 124 Q92 146 152 124 L160 64 Z" fill="url(#' + u + 'dish)"/>';
    for (var i = 0; i < 16; i++) { var x = 30 + i * 8.2; s += '<path d="M' + f1(x) + ' 72 L' + f1(x + (x - 92) * .05) + ' 128" stroke="#C9C1B4" stroke-width="1.3" opacity=".6"/>'; }
    s += '<ellipse cx="92" cy="64" rx="68" ry="20" fill="#F7F3EC" stroke="#CFC6B8"/>';
    s += '<ellipse cx="92" cy="66" rx="61" ry="16" fill="url(#' + u + 'top)"/>';
    for (i = 0; i < 18; i++) s += '<ellipse cx="' + f1(44 + r() * 96) + '" cy="' + f1(58 + r() * 16) + '" rx="' + f1(3 + r() * 7) + '" ry="' + f1(1.5 + r() * 3) + '" fill="#8E4A16" opacity="' + f1(.2 + r() * .35) + '" filter="url(#' + u + 'soft)"/>';
    s += '<path d="M48 60 Q70 52 96 54" stroke="#FFF1C9" stroke-width="2" fill="none" opacity=".6"/>';
    // portion on a small plate
    s += _plate(u, 186, 118, 50, 28);
    s += '<path d="M160 120 Q186 132 212 120 L208 102 Q186 110 164 102Z" fill="url(#' + u + 'car)"/>';
    s += '<path d="M164 102 Q186 110 208 102 L204 88 Q186 94 168 88Z" fill="#F7E2A4"/>';
    s += '<path d="M168 88 Q186 94 204 88 Q186 80 168 88Z" fill="url(#' + u + 'top)"/>';
    s += '<ellipse cx="186" cy="126" rx="30" ry="6" fill="#7A3510" opacity=".8"/>';
    s += '<path d="M170 125 Q186 129 200 124" stroke="#E5A465" stroke-width="1.2" fill="none" opacity=".8"/>';
    return s;
  };

  DISH['sopaipillas'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<radialGradient id="' + u + 'sp" cx=".45" cy=".38" r=".65"><stop offset="0" stop-color="#F7B95D"/><stop offset=".6" stop-color="#E08A2C"/><stop offset=".95" stop-color="#B2591A"/><stop offset="1" stop-color="#8E4413"/></radialGradient>' +
      '</defs>' + _table(u, r);
    // paper
    s += _shadow(u, 120, 96, 104, 50, .35);
    s += '<path d="M20 30 L220 22 L228 140 L14 146 Z" fill="#F6F1E6"/><path d="M20 30 L220 22 L228 140 L14 146 Z" fill="url(#' + u + 'light)"/>';
    s += '<path d="M120 26 L122 144" stroke="#D8D0C0" stroke-width="1.2"/>';
    s += _sprinkle(r, 40, 30, 40, 180, 100, '#E6A85A', 2.2, .18);
    var discs = [[66, 70], [124, 58], [178, 76], [92, 112], [154, 116]];
    discs.forEach(function(d) {
      var x = d[0], y = d[1];
      s += '<ellipse cx="' + (x + 3) + '" cy="' + (y + 8) + '" rx="34" ry="20" fill="#5A2A0A" opacity=".4" filter="url(#' + u + 'soft)"/>';
      s += '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="34" ry="21" fill="#8E4413"/>';
      s += '<ellipse cx="' + x + '" cy="' + y + '" rx="34" ry="21" fill="url(#' + u + 'sp)"/>';
      for (var i = 0; i < 6; i++) s += '<ellipse cx="' + f1(x - 22 + r() * 44) + '" cy="' + f1(y - 12 + r() * 24) + '" rx="' + f1(3 + r() * 4) + '" ry="' + f1(2 + r() * 2) + '" fill="#FFD48F" opacity=".38"/>';
      [[-8, -4], [6, -6], [-2, 6], [12, 4]].forEach(function(o) {
        s += '<ellipse cx="' + (x + o[0]) + '" cy="' + (y + o[1]) + '" rx="1.6" ry="1.1" fill="#5E2A08"/>';
      });
      s += '<path d="M' + (x - 24) + ' ' + (y - 6) + ' Q' + (x - 12) + ' ' + (y - 18) + ' ' + (x + 6) + ' ' + (y - 17) + '" stroke="#FFF0CF" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>';
    });
    return s;
  };

  DISH['huevos-revueltos'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<radialGradient id="' + u + 'egg" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".55" stop-color="#FFD84E"/><stop offset="1" stop-color="#E9A91C"/></radialGradient>' +
      '<linearGradient id="' + u + 'toast" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E7B56E"/><stop offset="1" stop-color="#B9752F"/></linearGradient>' +
      '</defs>' + _table(u, r);
    s += _plate(u, 124, 90, 104, 62);
    // toast
    s += '<g transform="rotate(-12 60 70)"><rect x="30" y="44" width="62" height="54" rx="10" fill="#8C4F1D"/><rect x="34" y="48" width="54" height="46" rx="8" fill="url(#' + u + 'toast)"/>' +
      _sprinkle(r, 30, 36, 50, 50, 42, '#8C4F1D', 0.9, .5) + '</g>';
    // curds
    for (var i = 0; i < 34; i++) {
      var a = r() * 6.28, d = Math.sqrt(r()) * 46;
      var x = 136 + Math.cos(a) * d * 1.2, y = 92 + Math.sin(a) * d * .55;
      var rr = 7 + r() * 9;
      s += '<ellipse cx="' + f1(x + 1.5) + '" cy="' + f1(y + 3) + '" rx="' + f1(rr) + '" ry="' + f1(rr * .7) + '" fill="#B9810F" opacity=".35"/>';
      s += '<path d="M' + f1(x - rr) + ' ' + f1(y) + ' Q' + f1(x - rr * .6) + ' ' + f1(y - rr * .9) + ' ' + f1(x) + ' ' + f1(y - rr * .7) + ' Q' + f1(x + rr * .9) + ' ' + f1(y - rr * .8) + ' ' + f1(x + rr) + ' ' + f1(y) + ' Q' + f1(x + rr * .5) + ' ' + f1(y + rr * .75) + ' ' + f1(x) + ' ' + f1(y + rr * .6) + ' Q' + f1(x - rr * .7) + ' ' + f1(y + rr * .7) + ' ' + f1(x - rr) + ' ' + f1(y) + 'Z" fill="url(#' + u + 'egg)"/>';
      s += '<ellipse cx="' + f1(x - rr * .3) + '" cy="' + f1(y - rr * .35) + '" rx="' + f1(rr * .32) + '" ry="' + f1(rr * .16) + '" fill="#FFFBE0" opacity=".75"/>';
    }
    for (i = 0; i < 16; i++) { var cx = 96 + r() * 84, cy = 72 + r() * 40; s += '<path d="M' + f1(cx) + ' ' + f1(cy) + ' l' + f1(3 + r() * 3) + ' ' + f1(r() * 2 - 1) + '" stroke="#2F7D32" stroke-width="1.6" stroke-linecap="round"/>'; }
    s += _sprinkle(r, 24, 100, 70, 80, 44, '#3A2A1A', 0.6, .8);
    return s;
  };

  DISH['arroz-graneado'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<linearGradient id="' + u + 'bw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1E3A5F"/><stop offset=".35" stop-color="#3E6A9A"/><stop offset=".55" stop-color="#6E97C2"/><stop offset="1" stop-color="#1B3150"/></linearGradient>' +
      '<radialGradient id="' + u + 'rice" cx=".45" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#EDE9DF"/><stop offset="1" stop-color="#CFC8B8"/></radialGradient>' +
      '<clipPath id="' + u + 'mound"><path d="M40 78 Q120 4 200 78 Q120 98 40 78Z"/></clipPath>' +
      '</defs>' + _table(u, r);
    s += _shadow(u, 124, 140, 90, 14);
    s += '<path d="M28 78 Q36 140 120 146 Q204 140 212 78 Z" fill="url(#' + u + 'bw)"/>';
    s += '<path d="M40 100 Q120 132 200 100" stroke="#E7EEF6" stroke-width="2" fill="none" opacity=".55"/>';
    s += '<path d="M50 110 Q120 138 190 110" stroke="#E7EEF6" stroke-width="1" fill="none" opacity=".35"/>';
    s += '<ellipse cx="120" cy="78" rx="92" ry="20" fill="#16304F"/>';
    s += '<ellipse cx="120" cy="78" rx="86" ry="17" fill="#C9C2B2"/>';
    s += '<path d="M40 78 Q120 4 200 78 Q120 98 40 78Z" fill="url(#' + u + 'rice)"/>';
    s += '<g clip-path="url(#' + u + 'mound)">';
    for (var i = 0; i < 330; i++) {
      var x = 40 + r() * 160, y = 22 + r() * 70, a = Math.round(r() * 180);
      var tone = r();
      s += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="3.1" ry="1.15" transform="rotate(' + a + ' ' + f1(x) + ' ' + f1(y) + ')" fill="' + (tone > .7 ? '#FFFFFF' : tone > .3 ? '#F4F1EA' : '#E2DDD0') + '" stroke="#BDB5A3" stroke-width=".25"/>';
    }
    for (i = 0; i < 26; i++) { x = 56 + r() * 130; y = 40 + r() * 46; s += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="2.6" height="1.4" rx=".4" fill="#F07A1E" transform="rotate(' + Math.round(r() * 180) + ' ' + f1(x) + ' ' + f1(y) + ')"/>'; }
    s += '</g>';
    s += '<path d="M64 52 Q100 26 132 30" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>';
    s += _leaf(168, 46, -40, 1.2) + _leaf(176, 50, 20, 1);
    return s;
  };

  DISH['smoothie-platano'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<linearGradient id="' + u + 'sm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9CF7E"/><stop offset=".4" stop-color="#FBEBB0"/><stop offset="1" stop-color="#D9B85E"/></linearGradient>' +
      '<linearGradient id="' + u + 'ban" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE873"/><stop offset=".6" stop-color="#F2C735"/><stop offset="1" stop-color="#B98A12"/></linearGradient>' +
      '</defs>' + _table(u, r);
    s += _shadow(u, 120, 140, 40, 8, .5);
    // glass + smoothie
    s += '<path d="M86 16 L94 138 Q120 146 146 138 L154 16 Z" fill="#E8F2F4" opacity=".45"/>';
    s += '<path d="M88 34 L95 136 Q120 144 145 136 L152 34 Z" fill="url(#' + u + 'sm)"/>';
    s += '<ellipse cx="120" cy="34" rx="32" ry="6" fill="#FFF6D2"/>';
    s += _sprinkle(r, 18, 92, 30, 56, 8, '#FFFFFF', 1.4, .8);
    // straw
    s += '<g transform="rotate(14 130 30)"><rect x="126" y="-6" width="8" height="90" rx="3" fill="#fff"/>';
    for (var i = 0; i < 7; i++) s += '<rect x="126" y="' + (-6 + i * 13) + '" width="8" height="6" fill="#D2322D"/>';
    s += '</g>';
    // glass highlights + condensation
    s += '<path d="M94 22 L100 132" stroke="#fff" stroke-width="5" opacity=".55" stroke-linecap="round"/>';
    s += '<path d="M146 22 L141 132" stroke="#fff" stroke-width="2" opacity=".5"/>';
    s += '<ellipse cx="120" cy="16" rx="34" ry="6" fill="none" stroke="#fff" stroke-width="1.5" opacity=".9"/>';
    for (i = 0; i < 24; i++) { var x = 96 + r() * 46, y = 50 + r() * 80; s += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(.8 + r() * 1.2) + '" ry="' + f1(1 + r() * 1.6) + '" fill="#fff" opacity=".55"/>'; }
    // banana slice on rim
    s += '<circle cx="92" cy="22" r="11" fill="#F3E9B8" stroke="#E3D48A" stroke-width="2"/><circle cx="92" cy="22" r="3" fill="#E7D58C"/>';
    for (i = 0; i < 6; i++) s += '<circle cx="' + f1(92 + Math.cos(i) * 2) + '" cy="' + f1(22 + Math.sin(i) * 2) + '" r=".6" fill="#6B5A2A"/>';
    // whole banana in front
    s += _shadow(u, 190, 136, 40, 7, .4);
    s += '<path d="M150 118 Q192 146 228 108 Q230 104 226 104 Q194 132 154 112 Z" fill="url(#' + u + 'ban)"/>';
    s += '<path d="M154 114 Q192 136 224 106" stroke="#FFF6B0" stroke-width="1.6" fill="none" opacity=".8"/>';
    s += '<path d="M150 118 l-5 -4 l3 -2 l6 3Z M226 104 l3 -6 l2 1 l-2 6Z" fill="#4E3B14"/>';
    return s;
  };

  DISH['pebre'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<linearGradient id="' + u + 'greda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A140B"/><stop offset=".35" stop-color="#6E3B22"/><stop offset=".55" stop-color="#8B4E2D"/><stop offset="1" stop-color="#2A140B"/></linearGradient>' +
      '<radialGradient id="' + u + 'mix" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#D9452C"/><stop offset="1" stop-color="#A3261A"/></radialGradient>' +
      '</defs>' + _table(u, r);
    // bread slices
    s += '<g transform="rotate(-10 50 120)">' + _shadow(u, 56, 132, 40, 8, .4) +
      '<path d="M18 120 Q22 100 52 98 Q86 100 90 120 Q86 136 54 138 Q22 136 18 120Z" fill="#B8762E"/>' +
      '<path d="M24 120 Q28 105 52 104 Q80 105 84 120 Q80 132 54 133 Q28 132 24 120Z" fill="#F4E2B8"/>' +
      _sprinkle(r, 30, 30, 108, 50, 22, '#D9BE85', 1, .8) + '</g>';
    // greda bowl from Pomaire
    s += _shadow(u, 140, 128, 80, 14);
    s += '<path d="M64 66 Q70 126 140 132 Q210 126 216 66 Z" fill="url(#' + u + 'greda)"/>';
    s += '<path d="M78 86 Q140 110 202 86" stroke="#B87048" stroke-width="2" fill="none" opacity=".5"/>';
    s += '<ellipse cx="140" cy="66" rx="76" ry="20" fill="#3A1C0F"/>';
    s += '<ellipse cx="140" cy="68" rx="69" ry="16" fill="url(#' + u + 'mix)"/>';
    for (var i = 0; i < 120; i++) {
      var a = r() * 6.28, d = Math.sqrt(r());
      var x = 140 + Math.cos(a) * d * 64, y = 68 + Math.sin(a) * d * 14;
      var t = r(), sz = 2 + r() * 3;
      var col = t < .5 ? (r() > .5 ? '#E5452E' : '#C42A1A') : t < .72 ? '#F6F2EC' : (r() > .5 ? '#2F8A2E' : '#4CAF3F');
      s += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(sz) + '" height="' + f1(sz * .7) + '" rx=".5" fill="' + col + '" transform="rotate(' + Math.round(r() * 90) + ' ' + f1(x) + ' ' + f1(y) + ')"/>';
    }
    s += _sprinkle(r, 22, 80, 56, 120, 24, '#FFF8C8', 1, .7);
    s += '<path d="M76 60 Q110 50 150 50" stroke="#C88A60" stroke-width="2" fill="none" opacity=".55"/>';
    return s;
  };

  DISH['empanadas-queso'] = function(u, r) {
    var s = '<defs>' + _defs(u) +
      '<radialGradient id="' + u + 'emp" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#F6C57C"/><stop offset=".6" stop-color="#DD9440"/><stop offset="1" stop-color="#A75F1F"/></radialGradient>' +
      '<linearGradient id="' + u + 'tray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B5F66"/><stop offset="1" stop-color="#2D3035"/></linearGradient>' +
      '</defs>' + _table(u, r);
    function emp(x, y, a, k, open) {
      var g = '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ') scale(' + k + ')">';
      g += '<path d="M-44 8 A44 34 0 0 1 44 8 Z" fill="#3A1C08" opacity=".45" transform="translate(3 8)" filter="url(#' + u + 'soft)"/>';
      g += '<path d="M-44 8 A44 34 0 0 1 44 8 Q0 16 -44 8Z" fill="url(#' + u + 'emp)"/>';
      // repulgue: twisted edge along the arc
      for (var i = 0; i <= 16; i++) {
        var t = Math.PI + (i / 16) * Math.PI, px = Math.cos(t) * 42, py = 8 + Math.sin(t) * 32;
        g += '<ellipse cx="' + f1(px) + '" cy="' + f1(py) + '" rx="5" ry="3.2" transform="rotate(' + f1(t * 57.3 + 90) + ' ' + f1(px) + ' ' + f1(py) + ')" fill="#C27A30" stroke="#8E4E17" stroke-width=".7"/>';
        g += '<ellipse cx="' + f1(px - 1) + '" cy="' + f1(py - 1) + '" rx="2" ry="1" fill="#FBD9A0" opacity=".7"/>';
      }
      g += '<path d="M-26 -8 Q-6 -22 18 -16" stroke="#FFE6B8" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>';
      g += _sprinkle(r, 10, -24, -10, 46, 16, '#8E4E17', .8, .4);
      if (open) g += '<path d="M-10 9 Q0 30 12 9 Q2 18 -10 9Z" fill="#FCE7A6"/><path d="M-4 10 Q0 24 5 10" stroke="#F3C85A" stroke-width="1.5" fill="none"/>';
      return g + '</g>';
    }
    s += _shadow(u, 124, 120, 110, 26, .35);
    s += '<rect x="10" y="40" width="222" height="112" rx="10" fill="url(#' + u + 'tray)"/>';
    s += '<rect x="16" y="46" width="210" height="100" rx="7" fill="#43474E"/>';
    s += '<path d="M20 50 H220" stroke="#8A9099" stroke-width="1.2" opacity=".6"/>';
    s += emp(66, 84, -8, .95) + emp(170, 80, 10, .95) + emp(118, 120, 0, 1.05, true);
    return s;
  };

  function dish(id) {
    var u = 'ckd' + (++_uid);
    var seed = 0;
    for (var i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
    var r = rng(seed);
    var fn = DISH[id];
    var body = fn ? fn(u, r) : '<rect width="240" height="160" fill="#E8D9C3"/>';
    // the warm overhead light over every scene
    body += '<rect width="240" height="160" fill="url(#' + u + 'light)"/>';
    return '<svg class="ck-dish-svg" viewBox="0 0 240 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  // =================================================================
  // 2) ICONS (24 × 24, stroked)
  // =================================================================
  var ICONS = {
    wash: '<path d="M12 3 C9 7 7 9.5 7 12.5 a5 5 0 0 0 10 0 C17 9.5 15 7 12 3Z" fill="#38BDF8" stroke="#0369A1" stroke-width="1.4"/><path d="M9.6 12.5 a2.4 2.4 0 0 0 2.4 2.4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    knife: '<path d="M3 17 L15 5 Q18 3 19.5 4.5 Q21 6 19 9 L9 19 Z" fill="#E2E8F0" stroke="#475569" stroke-width="1.3"/><path d="M9 19 L5.5 22.5 L1.5 18.5 L5 15" fill="#7C4A1E" stroke="#4A2A10" stroke-width="1.2"/>',
    hot: '<path d="M12 2.5 C13 7 17 8.5 17 13.5 a5 5 0 0 1 -10 0 C7 10.5 9 9.5 9.5 7 C11 9 11.5 10 11.5 11 C13 9 12.5 5.5 12 2.5Z" fill="#F97316" stroke="#9A3412" stroke-width="1.3"/><path d="M12 12.5 c1 1.5 2.2 2.2 2.2 3.4 a2.2 2.2 0 0 1 -4.4 0 c0 -1.2 1.2 -2 2.2 -3.4Z" fill="#FDE047"/>',
    oven: '<rect x="3" y="4" width="18" height="17" rx="2.5" fill="#E5E7EB" stroke="#374151" stroke-width="1.3"/><rect x="5.5" y="9" width="13" height="9" rx="1.5" fill="#1F2937"/><path d="M8 15 q2 -3 4 0 q2 3 4 0" stroke="#F97316" stroke-width="1.4" fill="none"/><circle cx="7" cy="6.5" r="1" fill="#374151"/><circle cx="10.5" cy="6.5" r="1" fill="#374151"/>',
    oil: '<path d="M12 3 C9 8 6.5 10.5 6.5 14 a5.5 5.5 0 0 0 11 0 C17.5 10.5 15 8 12 3Z" fill="#EAB308" stroke="#854D0E" stroke-width="1.3"/><path d="M12 11 c1 1.6 2.4 2.4 2.4 3.8 a2.4 2.4 0 0 1 -4.8 0 c0 -1.4 1.4 -2.2 2.4 -3.8Z" fill="#DC2626"/>',
    blade: '<circle cx="12" cy="12" r="8.5" fill="#E2E8F0" stroke="#475569" stroke-width="1.3"/><path d="M12 12 L12 4.5 Q15 7 12 12 L19 14 Q16 16.5 12 12 L6 16.5 Q5.5 12.5 12 12Z" fill="#94A3B8" stroke="#334155" stroke-width="1"/><circle cx="12" cy="12" r="1.6" fill="#334155"/>',
    egg: '<path d="M12 3 C8 3 5.5 9 5.5 13.5 a6.5 6.5 0 0 0 13 0 C18.5 9 16 3 12 3Z" fill="#FFF7ED" stroke="#9A7B5B" stroke-width="1.3"/><path d="M8.5 10 q1.2 -3 3 -4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    kid: '<circle cx="12" cy="7" r="3.6" fill="#FCD34D" stroke="#92400E" stroke-width="1.2"/><path d="M5.5 21 q0.5 -7 6.5 -7 q6 0 6.5 7Z" fill="#22C55E" stroke="#166534" stroke-width="1.2"/>',
    help: '<circle cx="8" cy="8.5" r="2.8" fill="#FCD34D" stroke="#92400E" stroke-width="1.1"/><path d="M3 20 q.4 -6 5 -6 q4.6 0 5 6Z" fill="#F59E0B" stroke="#92400E" stroke-width="1.1"/><circle cx="16.5" cy="6.5" r="3.2" fill="#FBBF24" stroke="#92400E" stroke-width="1.1"/><path d="M11.5 20 q.5 -8 5 -8 q4.5 0 5 8Z" fill="#B45309" stroke="#78350F" stroke-width="1.1"/>',
    adult: '<circle cx="12" cy="6.5" r="3.6" fill="#FCD34D" stroke="#7F1D1D" stroke-width="1.2"/><path d="M5 21.5 q.5 -10 7 -10 q6.5 0 7 10Z" fill="#DC2626" stroke="#7F1D1D" stroke-width="1.2"/><path d="M9 3.5 h6 l-.8 -2 h-4.4Z" fill="#fff" stroke="#7F1D1D" stroke-width=".8"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5" fill="#fff" stroke="#334155" stroke-width="1.5"/><path d="M12 13.5 V9 M10 2.5 h4 M12 2.5 v3" stroke="#334155" stroke-width="1.5" stroke-linecap="round"/><path d="M12 13.5 L15.5 15" stroke="#DC2626" stroke-width="1.6" stroke-linecap="round"/>',
    speak: '<path d="M4 9.5 h3.5 L12 5.5 v13 L7.5 14.5 H4Z" fill="#6D28D9" stroke="#4C1D95" stroke-width="1.2" stroke-linejoin="round"/><path d="M15 9 q2 3 0 6 M17.5 6.5 q4 5.5 0 11" stroke="#6D28D9" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
  };
  function icon(name, cls) {
    var g = ICONS[name];
    if (!g) return '';
    return '<svg class="ck-ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + g + '</svg>';
  }

  // Skill badges: a round medal with an engraved symbol.
  function medal(kind, earned) {
    var u = 'ckm' + (++_uid);
    var rim = earned ? ['#FDE68A', '#D97706', '#92400E'] : ['#E5E7EB', '#9CA3AF', '#6B7280'];
    var face = earned ? ({ measure: '#2563EB', eggs: '#F59E0B', safety: '#DC2626' }[kind]) : '#CBD5E1';
    var sym = {
      measure: '<path d="M-10 -12 h20 l-2 24 h-16Z" fill="#fff" opacity=".92"/><path d="M-7 -4 h5 M-7 2 h7 M-7 8 h5" stroke="' + face + '" stroke-width="1.8"/>',
      eggs: '<path d="M0 -14 C-7 -14 -10 -3 -10 3 a10 10 0 0 0 20 0 C10 -3 7 -14 0 -14Z" fill="#FFF7ED"/><path d="M-9 1 l4 -3 l3 3 l3 -3 l3 3 l4 -3" stroke="' + face + '" stroke-width="1.6" fill="none"/>',
      safety: '<path d="M0 -14 L11 -9 V0 C11 7 6 11 0 14 C-6 11 -11 7 -11 0 V-9Z" fill="#fff" opacity=".95"/><path d="M-5 0 l3.5 4 l7 -8" stroke="' + face + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
    }[kind];
    return '<svg viewBox="-30 -30 60 60" class="ck-medal' + (earned ? ' on' : '') + '" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + u + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + rim[0] + '"/><stop offset=".5" stop-color="' + rim[1] + '"/><stop offset="1" stop-color="' + rim[2] + '"/></linearGradient>' +
      '<radialGradient id="' + u + 'f" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle r="27" fill="url(#' + u + 'r)"/><circle r="21.5" fill="' + face + '"/><circle r="21.5" fill="url(#' + u + 'f)"/>' +
      '<circle r="21.5" fill="none" stroke="' + rim[2] + '" stroke-width="1" opacity=".6"/>' + sym + '</svg>';
  }

  // =================================================================
  // 3) CANVAS PRIMITIVES
  // =================================================================

  function _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function _steel(ctx, x0, x1, y, dark) {
    var g = ctx.createLinearGradient(x0, y, x1, y);
    var k = dark ? 0.82 : 1;
    function c(v) { v = Math.round(v * k); return 'rgb(' + v + ',' + (v + 4) + ',' + (v + 9) + ')'; }
    g.addColorStop(0, c(92)); g.addColorStop(0.12, c(150)); g.addColorStop(0.28, c(232));
    g.addColorStop(0.4, c(176)); g.addColorStop(0.55, c(120)); g.addColorStop(0.72, c(206));
    g.addColorStop(0.86, c(245)); g.addColorStop(1, c(110));
    return g;
  }

  // ---- backdrop: tiled wall + marble counter (cached offscreen) ----
  function makeBackdrop(W, H, counterY, dpr) {
    var c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    var x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = rng(7 + Math.round(W));

    // wall
    var g = x.createLinearGradient(0, 0, 0, counterY);
    g.addColorStop(0, '#E9E5DF'); g.addColorStop(1, '#F7F4EF');
    x.fillStyle = g; x.fillRect(0, 0, W, counterY);
    var tw = Math.max(46, W / 9), th = tw / 2.6;
    for (var row = 0, yy = counterY - th; yy > -th; yy -= th, row++) {
      for (var xx = (row % 2) ? -tw / 2 : 0; xx < W; xx += tw) {
        var tg = x.createLinearGradient(xx, yy, xx, yy + th);
        var v = 246 - Math.round(r() * 8);
        tg.addColorStop(0, 'rgb(' + (v + 6) + ',' + (v + 6) + ',' + (v + 4) + ')');
        tg.addColorStop(0.5, 'rgb(' + v + ',' + v + ',' + (v - 3) + ')');
        tg.addColorStop(1, 'rgb(' + (v - 14) + ',' + (v - 15) + ',' + (v - 18) + ')');
        x.fillStyle = tg;
        _rr(x, xx + 1.2, yy + 1.2, tw - 2.4, th - 2.4, 3);
        x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(xx + 4, yy + 2.2); x.lineTo(xx + tw - 4, yy + 2.2); x.stroke();
      }
    }
    // grout tint + window light from the upper left
    var lg = x.createRadialGradient(W * 0.12, -H * 0.1, 10, W * 0.2, 0, W * 1.1);
    lg.addColorStop(0, 'rgba(255,248,230,0.55)'); lg.addColorStop(0.5, 'rgba(255,248,230,0.08)'); lg.addColorStop(1, 'rgba(60,50,40,0.22)');
    x.fillStyle = lg; x.fillRect(0, 0, W, counterY);

    // counter: marble
    var mg = x.createLinearGradient(0, counterY, 0, H);
    mg.addColorStop(0, '#E9E6E1'); mg.addColorStop(0.08, '#F6F4F0'); mg.addColorStop(1, '#DCD7D0');
    x.fillStyle = mg; x.fillRect(0, counterY, W, H - counterY);
    x.save();
    x.beginPath(); x.rect(0, counterY, W, H - counterY); x.clip();
    for (var i = 0; i < 16; i++) {
      var sx = -40 + r() * (W + 80), sy = counterY + r() * (H - counterY);
      var pts = [[sx, sy]];
      var ang = (r() - 0.5) * 0.7, len = 0;
      while (len < W * 0.9) {
        ang += (r() - 0.5) * 0.9;
        var step = 14 + r() * 24;
        var p = pts[pts.length - 1];
        pts.push([p[0] + Math.cos(ang) * step, p[1] + Math.sin(ang) * step * 0.35]);
        len += step;
      }
      var widths = [5, 3, 1.6, 0.7], alphas = [0.025, 0.04, 0.07, 0.16];
      var tone = r() > 0.4 ? '120,116,110' : '150,140,120';
      for (var w = 0; w < widths.length; w++) {
        x.strokeStyle = 'rgba(' + tone + ',' + alphas[w] * (0.5 + r()) + ')';
        x.lineWidth = widths[w] * (0.6 + r() * 0.8);
        x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for (var k = 1; k < pts.length - 1; k++) {
          var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
          x.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
        }
        x.stroke();
      }
    }
    // soft reflection of the window on the polished stone
    var rg = x.createLinearGradient(0, counterY, W, counterY);
    rg.addColorStop(0, 'rgba(255,255,255,0.35)'); rg.addColorStop(0.35, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.05)');
    x.fillStyle = rg; x.fillRect(0, counterY, W, H - counterY);
    x.restore();
    // where wall meets counter
    var eg = x.createLinearGradient(0, counterY - 10, 0, counterY + 8);
    eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(0.55, 'rgba(60,50,40,0.18)'); eg.addColorStop(0.6, 'rgba(255,255,255,0.6)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = eg; x.fillRect(0, counterY - 10, W, 18);
    // vignette
    var vg = x.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,30,20,0.25)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    return c;
  }

  function contactShadow(ctx, cx, y, rx, ry, a) {
    ctx.save();
    ctx.translate(cx, y); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
    g.addColorStop(0, 'rgba(30,20,10,' + (a || 0.38) + ')'); g.addColorStop(0.6, 'rgba(30,20,10,' + (a || 0.38) * 0.4 + ')'); g.addColorStop(1, 'rgba(30,20,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ---- liquids -------------------------------------------------------
  var LIQ = {
    water: { body: [150, 200, 225], a: 0.30, edge: 0.55, top: 'rgba(225,244,252,0.75)', men: 'rgba(255,255,255,0.85)', dark: 'rgba(20,70,100,0.35)', stream: [190, 225, 240], sa: 0.55, refract: true, label: 'Water · Agua' },
    milk:  { body: [250, 249, 244], a: 0.97, edge: 0.0, top: 'rgba(255,255,255,1)', men: 'rgba(255,255,255,1)', dark: 'rgba(120,120,110,0.45)', stream: [252, 252, 248], sa: 0.98, refract: false, label: 'Milk · Leche' },
    oil:   { body: [222, 170, 30], a: 0.72, edge: 0.4, top: 'rgba(255,226,120,0.85)', men: 'rgba(255,240,170,0.9)', dark: 'rgba(120,70,0,0.45)', stream: [238, 196, 60], sa: 0.82, refract: true, label: 'Oil · Aceite' }
  };

  // Jug geometry: inner height h, radii rBot/rTop, perspective k.
  function jugGeom(o) {
    var J = {
      cx: o.cx, bottom: o.bottom, h: o.h, rB: o.rBot, rT: o.rTop, k: o.k || 0.2,
      base: o.base || Math.max(6, o.h * 0.04), cap: o.cap, markFrac: 0.86
    };
    J.floor = J.bottom - J.base;
    J.top = J.floor - J.h;
    J.r = function(y) { return J.rB + (J.rT - J.rB) * (J.floor - y) / J.h; };
    // volume ∝ ∫ r² dh, so a tapered jug's marks get closer together as it widens
    var N = 240, lut = [0];
    for (var i = 1; i <= N; i++) {
      var y0 = J.floor - (i - 1) / N * J.h, y1 = J.floor - i / N * J.h;
      var ra = J.r(y0), rb = J.r(y1);
      lut.push(lut[i - 1] + (ra * ra + ra * rb + rb * rb) / 3 * (J.h / N));
    }
    var capIdx = Math.round(J.markFrac * N), scale = J.cap / lut[capIdx];
    J.yFor = function(ml) {
      var v = ml / scale;
      if (v <= 0) return J.floor;
      for (var i = 1; i <= N; i++) {
        if (lut[i] >= v) {
          var t = (v - lut[i - 1]) / (lut[i] - lut[i - 1]);
          return J.floor - ((i - 1 + t) / N) * J.h;
        }
      }
      return J.top;
    };
    J.maxMl = lut[N] * scale;
    return J;
  }

  function _bodyPath(ctx, J, yTop, inset) {
    var rT = J.r(yTop) - inset, rB = J.rB - inset, kT = rT * J.k, kB = rB * J.k;
    ctx.beginPath();
    ctx.moveTo(J.cx + rT, yTop);
    ctx.ellipse(J.cx, yTop, rT, kT, 0, 0, Math.PI, false);
    ctx.lineTo(J.cx - rB, J.floor);
    ctx.ellipse(J.cx, J.floor, rB, kB, 0, Math.PI, 0, true);
    ctx.closePath();
  }

  // o: { J, vol, liquid, t, marks:[{v,label,side:'l'|'r',major}], marker, ripples:[{x,r,a}], backdrop, W, H, pourX, spout }
  function drawJug(ctx, o) {
    var J = o.J, cx = J.cx, L = LIQ[o.liquid] || LIQ.water;
    var gl = Math.max(2.5, J.rB * 0.035);           // glass thickness
    var rimY = J.top, rT = J.rT, kT = rT * J.k;

    contactShadow(ctx, cx + 6, J.bottom + 2, J.rB * 1.35, J.rB * J.k * 1.6, 0.34);

    var level = o.vol > 0.05 ? J.yFor(o.vol) : null;
    // light passing through the liquid lands on the counter
    if (level !== null && L.a < 0.9) {
      ctx.save();
      ctx.translate(cx + J.rB * 1.15, J.bottom + 1);
      ctx.scale(1, 0.22);
      var cg = ctx.createRadialGradient(0, 0, 2, 0, 0, J.rB * 1.1);
      cg.addColorStop(0, 'rgba(' + L.body.join(',') + ',0.45)'); cg.addColorStop(0.5, 'rgba(255,255,255,0.18)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, J.rB * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // handle (behind the right wall)
    var hx = cx + J.r(rimY + J.h * 0.18), hy0 = rimY + J.h * 0.12, hy1 = J.floor - J.h * 0.2;
    var hw = J.rB * 0.55;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy0);
    ctx.bezierCurveTo(hx + hw * 1.25, hy0 - 4, hx + hw * 1.1, hy1 + 6, J.cx + J.r(hy1) - 4, hy1);
    var hwid = Math.max(10, J.rB * 0.17);
    ctx.strokeStyle = 'rgba(70,95,105,0.35)'; ctx.lineWidth = hwid + 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(225,240,244,0.55)'; ctx.lineWidth = hwid; ctx.stroke();
    ctx.strokeStyle = 'rgba(150,180,190,0.35)'; ctx.lineWidth = hwid * 0.45; ctx.stroke();
    ctx.translate(-hwid * 0.22, -hwid * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    // back of the glass
    ctx.save();
    _bodyPath(ctx, J, rimY, 0);
    ctx.fillStyle = 'rgba(220,236,240,0.16)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, rimY, rT - gl, kT - gl * 0.4, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = 'rgba(70,95,105,0.30)'; ctx.lineWidth = 1.2; ctx.stroke();
    // back markings, seen faintly through the glass (mirrored)
    ctx.restore();

    // ---- liquid ----
    if (level !== null) {
      var rL = J.r(level) - gl, kL = rL * J.k;
      ctx.save();
      // clip: body below surface + the surface ellipse
      ctx.beginPath();
      _bodyPath(ctx, J, level, gl);
      ctx.ellipse(cx, level, rL, kL, 0, 0, Math.PI * 2);
      ctx.clip('nonzero');
      if (L.refract && o.backdrop) {
        // a filled cylinder works like a lens: the wall behind looks wider
        var mag = 1.35, sw = (J.rT * 2.2), sx = cx - sw / 2 / mag;
        var dpr = o.backdrop.width / o.W;
        ctx.globalAlpha = 0.95;
        ctx.drawImage(o.backdrop, sx * dpr, (J.top - 10) * dpr, (sw / mag) * dpr, (J.bottom - J.top + 20) * dpr,
          cx - sw / 2, J.top - 10 - (J.bottom - J.top) * 0.03, sw, J.bottom - J.top + 20);
        ctx.globalAlpha = 1;
      }
      // body colour, darker at the edges (light bends away there)
      var bg = ctx.createLinearGradient(cx - rL, 0, cx + rL, 0);
      var b = L.body, a = L.a;
      bg.addColorStop(0, 'rgba(' + Math.round(b[0] * 0.55) + ',' + Math.round(b[1] * 0.6) + ',' + Math.round(b[2] * 0.62) + ',' + Math.min(1, a + L.edge) + ')');
      bg.addColorStop(0.14, 'rgba(' + b.join(',') + ',' + a + ')');
      bg.addColorStop(0.38, 'rgba(' + Math.min(255, b[0] + 30) + ',' + Math.min(255, b[1] + 25) + ',' + Math.min(255, b[2] + 18) + ',' + a * 0.85 + ')');
      bg.addColorStop(0.75, 'rgba(' + b.join(',') + ',' + a + ')');
      bg.addColorStop(1, 'rgba(' + Math.round(b[0] * 0.5) + ',' + Math.round(b[1] * 0.55) + ',' + Math.round(b[2] * 0.6) + ',' + Math.min(1, a + L.edge) + ')');
      ctx.fillStyle = bg;
      ctx.fillRect(cx - rL - 2, level - kL - 2, rL * 2 + 4, J.floor - level + kL + J.rB * J.k + 6);
      var vg = ctx.createLinearGradient(0, level, 0, J.floor + J.rB * J.k);
      vg.addColorStop(0, 'rgba(255,255,255,0)');
      vg.addColorStop(1, o.liquid === 'milk' ? 'rgba(170,170,160,0.25)' : 'rgba(0,30,50,0.18)');
      ctx.fillStyle = vg;
      ctx.fillRect(cx - rL - 2, level, rL * 2 + 4, J.floor - level + J.rB * J.k + 6);
      // tiny rising bubbles
      if (o.bubbles) {
        for (var i = 0; i < o.bubbles.length; i++) {
          var bb = o.bubbles[i];
          if (bb.y < level + 2) continue;
          ctx.beginPath(); ctx.arc(bb.x, bb.y, bb.r, 0, Math.PI * 2);
          ctx.strokeStyle = o.liquid === 'milk' ? 'rgba(220,220,210,0.7)' : 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      ctx.restore();

      // surface: reflects the bright wall; back part brighter
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, level, rL, kL, 0, 0, Math.PI * 2);
      var sg = ctx.createLinearGradient(0, level - kL, 0, level + kL);
      sg.addColorStop(0, L.top);
      sg.addColorStop(1, o.liquid === 'milk' ? 'rgba(236,236,230,1)' : 'rgba(' + b.join(',') + ',' + Math.min(1, a + 0.2) + ')');
      ctx.fillStyle = sg; ctx.fill();
      ctx.clip();
      // ripples from the pour
      if (o.ripples) {
        for (var q = 0; q < o.ripples.length; q++) {
          var rp = o.ripples[q];
          ctx.beginPath(); ctx.ellipse(rp.x, level, rp.r, rp.r * J.k, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,' + (rp.a * 0.7) + ')'; ctx.lineWidth = 1.3; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(rp.x, level + 1, rp.r * 0.96, rp.r * J.k * 0.96, 0, 0, Math.PI);
          ctx.strokeStyle = 'rgba(0,40,60,' + (rp.a * 0.25) + ')'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      ctx.restore();
      // meniscus: the liquid climbs the glass a little, all round the edge
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, level - 1.2, rL, kL, 0, 0, Math.PI * 2);
      ctx.strokeStyle = L.men; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, level + 0.9, rL - 1, kL, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.strokeStyle = L.dark; ctx.lineWidth = 1.3; ctx.stroke();
      // curl up at the two side walls
      ctx.beginPath();
      ctx.moveTo(cx - rL, level - 4.5); ctx.quadraticCurveTo(cx - rL + 2, level - 0.5, cx - rL + 7, level + 0.5);
      ctx.moveTo(cx + rL, level - 4.5); ctx.quadraticCurveTo(cx + rL - 2, level - 0.5, cx + rL - 7, level + 0.5);
      ctx.strokeStyle = L.men; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    }

    // ---- printed markings (on the front of the glass) ----
    if (o.marks) {
      ctx.save();
      ctx.textBaseline = 'middle';
      for (var m = 0; m < o.marks.length; m++) {
        var mk = o.marks[m], y = J.yFor(mk.v), rr = J.r(y) + 0.5, kk = rr * J.k;
        var a0, a1;
        if (mk.side === 'l') { a0 = Math.PI * (mk.major ? 0.70 : 0.75); a1 = Math.PI * 0.83; }
        else { a0 = Math.PI * 0.17; a1 = Math.PI * (mk.major ? 0.30 : 0.25); }
        ctx.beginPath(); ctx.ellipse(cx, y, rr, kk, 0, a0, a1);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = mk.major ? 3.4 : 2.4; ctx.stroke();
        ctx.strokeStyle = '#B4231F'; ctx.lineWidth = mk.major ? 2 : 1.2; ctx.stroke();
        if (mk.label) {
          var aa = mk.side === 'l' ? a0 : a1;
          var tx = cx + Math.cos(aa) * rr, ty = y + Math.sin(aa) * kk;
          var fs = Math.max(10, Math.round(J.rB * 0.13));
          ctx.font = '800 ' + fs + 'px Nunito, system-ui, sans-serif';
          ctx.textAlign = mk.side === 'l' ? 'left' : 'right';
          var lx = tx + (mk.side === 'l' ? 4 : -4);
          ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText(mk.label, lx + 0.8, ty + 0.8);
          ctx.fillStyle = '#B4231F'; ctx.fillText(mk.label, lx, ty);
        }
      }
      if (o.unitL || o.unitR) {
        var uy = J.yFor(J.cap) - J.h * 0.08;
        ctx.font = '900 ' + Math.max(10, Math.round(J.rB * 0.12)) + 'px Nunito, system-ui, sans-serif';
        ctx.fillStyle = '#B4231F';
        if (o.unitL) { ctx.textAlign = 'left'; ctx.fillText(o.unitL, cx - J.r(uy) * 0.82, uy); }
        if (o.unitR) { ctx.textAlign = 'right'; ctx.fillText(o.unitR, cx + J.r(uy) * 0.82, uy); }
      }
      ctx.restore();
    }

    // target band for the youngest cooks
    if (o.marker) {
      var my = J.yFor(o.marker), mr = J.r(my) + 1.5;
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, my, mr, mr * J.k, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(225,29,72,0.25)'; ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = '#E11D48'; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, my - 1.3, mr, mr * J.k, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.restore();
    }

    // ---- front glass ----
    ctx.save();
    // wall thickness lines
    var rB = J.rB;
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(40,65,75,0.55)';
    ctx.beginPath(); ctx.moveTo(cx - rT, rimY); ctx.lineTo(cx - rB, J.floor); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rT, rimY); ctx.lineTo(cx + rB, J.floor); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.moveTo(cx - rT + gl, rimY + 3); ctx.lineTo(cx - rB + gl, J.floor - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rT - gl, rimY + 3); ctx.lineTo(cx + rB - gl, J.floor - 2); ctx.stroke();
    // thick base
    var kB = rB * J.k;
    ctx.beginPath();
    ctx.moveTo(cx - rB, J.floor); ctx.ellipse(cx, J.floor, rB, kB, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rB, J.bottom); ctx.ellipse(cx, J.bottom, rB, kB, 0, 0, Math.PI, false);
    ctx.closePath();
    var bgr = ctx.createLinearGradient(cx - rB, 0, cx + rB, 0);
    bgr.addColorStop(0, 'rgba(120,150,160,0.45)'); bgr.addColorStop(0.3, 'rgba(235,248,250,0.55)'); bgr.addColorStop(0.7, 'rgba(200,225,230,0.35)'); bgr.addColorStop(1, 'rgba(100,130,140,0.5)');
    ctx.fillStyle = bgr; ctx.fill();
    ctx.strokeStyle = 'rgba(40,65,75,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, J.floor + 1, rB - 3, kB - 1, 0, Math.PI * 0.1, Math.PI * 0.9);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
    // long specular streaks (window reflection)
    function streak(fx, wfrac, alpha) {
      var yT = rimY + J.h * 0.05, yB = J.floor - J.h * 0.04;
      var xT = cx + J.r(yT) * fx, xB = cx + J.r(yB) * fx, wT = J.r(yT) * wfrac, wB = J.r(yB) * wfrac;
      var sg2 = ctx.createLinearGradient(xT - wT, 0, xT + wT, 0);
      sg2.addColorStop(0, 'rgba(255,255,255,0)'); sg2.addColorStop(0.45, 'rgba(255,255,255,' + alpha + ')'); sg2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg2;
      ctx.beginPath(); ctx.moveTo(xT - wT, yT); ctx.lineTo(xT + wT, yT); ctx.lineTo(xB + wB, yB); ctx.lineTo(xB - wB, yB); ctx.closePath(); ctx.fill();
    }
    streak(-0.62, 0.13, 0.62);
    streak(-0.38, 0.05, 0.35);
    streak(0.7, 0.06, 0.4);
    // rim with spout on the left
    var sp = o.spout !== false;
    ctx.beginPath();
    ctx.ellipse(cx, rimY, rT, kT, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(40,65,75,0.6)'; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, rimY + 0.5, rT - gl, kT - gl * 0.35, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.4; ctx.stroke();
    if (sp) {
      ctx.beginPath();
      ctx.moveTo(cx - rT * 0.82, rimY - kT * 0.55);
      ctx.quadraticCurveTo(cx - rT - rT * 0.22, rimY - kT * 0.3, cx - rT - rT * 0.12, rimY + kT * 0.05);
      ctx.quadraticCurveTo(cx - rT - 2, rimY + kT * 0.55, cx - rT * 0.82, rimY + kT * 0.6);
      ctx.fillStyle = 'rgba(225,240,244,0.5)'; ctx.fill();
      ctx.strokeStyle = 'rgba(40,65,75,0.6)'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - rT * 0.9, rimY - kT * 0.35); ctx.quadraticCurveTo(cx - rT - rT * 0.14, rimY - kT * 0.2, cx - rT - rT * 0.08, rimY + kT * 0.1);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
  }

  // ---- pour sources: drawn around the mouth (0,0), body along +y ----
  function _bottleShape(ctx, kind, s) {
    ctx.beginPath();
    if (kind === 'milk') {
      // brick carton with a screw cap near one corner
      ctx.moveTo(-9 * s, -4 * s); ctx.lineTo(9 * s, -4 * s); ctx.lineTo(9 * s, 8 * s);
      ctx.lineTo(32 * s, 18 * s); ctx.lineTo(32 * s, 150 * s); ctx.lineTo(-32 * s, 150 * s);
      ctx.lineTo(-32 * s, 18 * s); ctx.lineTo(-9 * s, 8 * s); ctx.closePath();
    } else {
      var nw = kind === 'oil' ? 7 : 9, bw = kind === 'oil' ? 26 : 30;
      ctx.moveTo(-nw * s, 0); ctx.lineTo(nw * s, 0);
      ctx.lineTo(nw * s, 26 * s);
      ctx.bezierCurveTo(nw * s, 40 * s, bw * s, 42 * s, bw * s, 60 * s);
      ctx.lineTo(bw * s, 150 * s); ctx.quadraticCurveTo(bw * s, 158 * s, (bw - 8) * s, 158 * s);
      ctx.lineTo(-(bw - 8) * s, 158 * s); ctx.quadraticCurveTo(-bw * s, 158 * s, -bw * s, 150 * s);
      ctx.lineTo(-bw * s, 60 * s);
      ctx.bezierCurveTo(-bw * s, 42 * s, -nw * s, 40 * s, -nw * s, 26 * s);
      ctx.closePath();
    }
  }

  // Bottle at mouth (mx,my) rotated by ang (0 = mouth straight up; body hangs below).
  function drawSource(ctx, kind, mx, my, ang, s) {
    var L = LIQ[kind] || LIQ.water;
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(ang);
    // shapes are authored mouth-up with the body along +y; flip so body is "behind" the mouth
    ctx.scale(1, 1);
    if (kind === 'milk') {
      _bottleShape(ctx, kind, s);
      var g = ctx.createLinearGradient(-32 * s, 0, 32 * s, 0);
      g.addColorStop(0, '#C9CFD6'); g.addColorStop(0.3, '#FFFFFF'); g.addColorStop(0.75, '#F0F3F6'); g.addColorStop(1, '#B6BEC8');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(60,70,90,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); _bottleShape(ctx, kind, s); ctx.clip();
      // printed design
      ctx.fillStyle = '#1D4ED8'; ctx.fillRect(-32 * s, 70 * s, 64 * s, 46 * s);
      ctx.fillStyle = '#93C5FD'; ctx.fillRect(-32 * s, 116 * s, 64 * s, 6 * s);
      ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(15 * s) + 'px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.save(); ctx.translate(0, 98 * s); ctx.rotate(Math.PI / 2 * 0); ctx.fillText('LECHE', 0, 0); ctx.restore();
      ctx.font = '700 ' + Math.round(8 * s) + 'px Nunito, sans-serif'; ctx.fillText('1 L · entera', 0, 110 * s);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-32 * s, 18 * s, 64 * s, 2 * s);
      var sh = ctx.createLinearGradient(-32 * s, 0, 32 * s, 0);
      sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(0.3, 'rgba(255,255,255,0.25)'); sh.addColorStop(0.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = sh; ctx.fillRect(-32 * s, -6 * s, 64 * s, 160 * s);
      ctx.restore();
      // cap
      ctx.fillStyle = '#2563EB'; _rr(ctx, -10 * s, -6 * s, 20 * s, 6 * s, 2 * s); ctx.fill();
      ctx.restore();
      return;
    }
    // glass / plastic bottle
    _bottleShape(ctx, kind, s);
    var bgl = ctx.createLinearGradient(-30 * s, 0, 30 * s, 0);
    if (kind === 'oil') {
      bgl.addColorStop(0, 'rgba(150,170,150,0.55)'); bgl.addColorStop(0.3, 'rgba(235,245,235,0.35)'); bgl.addColorStop(1, 'rgba(120,140,120,0.55)');
    } else {
      bgl.addColorStop(0, 'rgba(140,180,200,0.45)'); bgl.addColorStop(0.3, 'rgba(240,250,255,0.3)'); bgl.addColorStop(1, 'rgba(120,160,180,0.5)');
    }
    ctx.fillStyle = bgl; ctx.fill();
    ctx.restore();

    // liquid inside stays level with gravity: clip to bottle, fill below a world-space line
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(ang);
    _bottleShape(ctx, kind, s);
    ctx.restore();
    ctx.save();
    ctx.clip();
    var pts = [[-30, 150], [30, 150], [-9, 0], [9, 0], [-30, 60], [30, 60]], ys = [];
    for (var i = 0; i < pts.length; i++) {
      var px = pts[i][0] * s, py = pts[i][1] * s;
      ys.push(my + px * Math.sin(ang) + py * Math.cos(ang));
    }
    var maxY = Math.max.apply(null, ys), minY = Math.min.apply(null, ys);
    var lineY = maxY - (maxY - minY) * 0.55;
    ctx.fillStyle = 'rgba(' + L.body.join(',') + ',' + (kind === 'oil' ? 0.85 : 0.45) + ')';
    ctx.fillRect(mx - 200 * s, lineY, 400 * s, 400 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(mx - 200 * s, lineY - 1, 400 * s, 2);
    ctx.restore();

    ctx.save();
    ctx.translate(mx, my); ctx.rotate(ang);
    _bottleShape(ctx, kind, s);
    ctx.strokeStyle = kind === 'oil' ? 'rgba(60,80,50,0.6)' : 'rgba(50,80,100,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
    // label
    if (kind === 'oil') {
      ctx.fillStyle = '#14532D'; ctx.fillRect(-26 * s, 82 * s, 52 * s, 44 * s);
      ctx.fillStyle = '#FDE68A'; ctx.fillRect(-26 * s, 86 * s, 52 * s, 2 * s); ctx.fillRect(-26 * s, 120 * s, 52 * s, 2 * s);
      ctx.fillStyle = '#FEF3C7'; ctx.font = '900 ' + Math.round(11 * s) + 'px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ACEITE', 0, 106 * s);
    } else {
      ctx.fillStyle = 'rgba(14,116,144,0.85)'; ctx.fillRect(-30 * s, 88 * s, 60 * s, 30 * s);
      ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(10 * s) + 'px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('AGUA', 0, 107 * s);
    }
    // glass highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-18 * s, 66 * s); ctx.lineTo(-18 * s, 146 * s); ctx.stroke();
    ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(-4 * s, 6 * s); ctx.lineTo(-4 * s, 28 * s); ctx.stroke();
    // lip
    ctx.fillStyle = 'rgba(210,225,230,0.9)'; _rr(ctx, -11 * s, -3 * s, 22 * s, 6 * s, 2 * s); ctx.fill();
    ctx.restore();
  }

  // Stream from (x0,y0) with launch dir (dx,dy) to the surface yEnd. width w.
  function drawStream(ctx, kind, x0, y0, vx, yEnd, w, t, topY) {
    var L = LIQ[kind] || LIQ.water;
    var g = 900;
    var pts = [], n = 22;
    var yStart = topY != null ? Math.max(y0, topY) : y0;
    // parabola: x = x0 + vx*τ, y = y0 + ½gτ²  (initial vertical speed ~ 0)
    var tauEnd = Math.sqrt(Math.max(0, 2 * (yEnd - y0) / g));
    var tauStart = Math.sqrt(Math.max(0, 2 * (yStart - y0) / g));
    if (tauEnd <= tauStart) return null;
    for (var i = 0; i <= n; i++) {
      var tau = tauStart + (tauEnd - tauStart) * i / n;
      var x = x0 + vx * tau + Math.sin(t * 22 + i * 0.9) * 0.5 * (i / n);
      var y = y0 + 0.5 * g * tau * tau;
      pts.push([x, y, w * (1 - 0.45 * (tau / (tauEnd || 1)))]);
    }
    ctx.save();
    ctx.beginPath();
    for (i = 0; i < pts.length; i++) ctx[i ? 'lineTo' : 'moveTo'](pts[i][0] - pts[i][2] / 2, pts[i][1]);
    for (i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + pts[i][2] / 2, pts[i][1]);
    ctx.closePath();
    var sc = L.stream;
    var gr = ctx.createLinearGradient(pts[0][0] - w, 0, pts[0][0] + w, 0);
    gr.addColorStop(0, 'rgba(' + Math.round(sc[0] * 0.7) + ',' + Math.round(sc[1] * 0.75) + ',' + Math.round(sc[2] * 0.8) + ',' + L.sa + ')');
    gr.addColorStop(0.45, 'rgba(' + sc.join(',') + ',' + L.sa * 0.9 + ')');
    gr.addColorStop(1, 'rgba(' + Math.round(sc[0] * 0.75) + ',' + Math.round(sc[1] * 0.8) + ',' + Math.round(sc[2] * 0.85) + ',' + L.sa + ')');
    ctx.fillStyle = gr; ctx.fill();
    ctx.beginPath();
    for (i = 0; i < pts.length; i++) ctx[i ? 'lineTo' : 'moveTo'](pts[i][0] - pts[i][2] * 0.18, pts[i][1]);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(0.8, w * 0.16); ctx.stroke();
    ctx.restore();
    return pts[pts.length - 1];
  }

  function drawDrops(ctx, drops, kind) {
    var L = LIQ[kind] || LIQ.water;
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + L.stream.join(',') + ',' + Math.min(1, L.sa + 0.1) * d.life + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + 0.8 * d.life + ')'; ctx.fill();
    }
  }

  // ---- dry goods ---------------------------------------------------------
  var FOOD = {
    flour: { base: [248, 244, 234], shade: [214, 204, 186], speck: 'rgba(190,175,150,0.5)', name: 'HARINA', sub: 'flour' },
    sugar: { base: [252, 252, 250], shade: [214, 214, 210], speck: 'rgba(255,255,255,0.95)', name: 'AZÚCAR', sub: 'sugar', sparkle: true },
    oats:  { base: [228, 204, 156], shade: [176, 140, 86], speck: 'rgba(130,95,45,0.55)', name: 'AVENA', sub: 'oats', flakes: true }
  };

  function _foodFill(ctx, food, x0, y0, x1, y1) {
    var F = FOOD[food] || FOOD.flour;
    var g = ctx.createLinearGradient(x0, y0, x1 * 0.2 + x0 * 0.8, y1);
    g.addColorStop(0, 'rgb(' + F.base.join(',') + ')');
    g.addColorStop(1, 'rgb(' + F.shade.join(',') + ')');
    return g;
  }

  function _texture(ctx, food, x, y, w, h, seed, n) {
    var F = FOOD[food] || FOOD.flour, r = rng(seed);
    for (var i = 0; i < n; i++) {
      var px = x + r() * w, py = y + r() * h;
      if (F.flakes) {
        ctx.save(); ctx.translate(px, py); ctx.rotate(r() * 3.14);
        ctx.fillStyle = r() > 0.5 ? 'rgba(244,226,180,0.95)' : 'rgba(170,128,70,0.7)';
        ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else {
        ctx.fillStyle = F.sparkle && r() > 0.7 ? 'rgba(255,255,255,1)' : F.speck;
        ctx.fillRect(px, py, F.sparkle ? 1.4 : 1, F.sparkle ? 1.4 : 1);
      }
    }
  }

  // Heaped or level contents for a cup whose rim is the ellipse (cx, y, rx, ry).
  // heap 0..1, levelX = x up to which the knife has scraped (or null).
  function _cupContents(ctx, food, cx, y, rx, ry, heap, levelX, seed) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, y, rx * 0.94, ry * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = _foodFill(ctx, food, cx - rx, y - ry, cx + rx, y + ry); ctx.fill();
    ctx.clip(); _texture(ctx, food, cx - rx, y - ry, rx * 2, ry * 2, seed, 60);
    ctx.restore();
    if (heap > 0.01) {
      var hh = rx * 0.75 * heap;
      ctx.save();
      if (levelX != null) { ctx.beginPath(); ctx.rect(levelX, y - hh - 20, cx + rx * 2 - levelX, hh + ry + 40); ctx.clip(); }
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.95, y);
      ctx.bezierCurveTo(cx - rx * 0.8, y - hh * 0.5, cx - rx * 0.55, y - hh * 1.02, cx - rx * 0.1, y - hh);
      ctx.bezierCurveTo(cx + rx * 0.2, y - hh * 1.05, cx + rx * 0.45, y - hh * 0.95, cx + rx * 0.7, y - hh * 0.45);
      ctx.quadraticCurveTo(cx + rx * 0.9, y - hh * 0.15, cx + rx * 0.95, y);
      ctx.ellipse(cx, y, rx * 0.95, ry * 0.9, 0, 0, Math.PI, false);
      ctx.closePath();
      var g = ctx.createRadialGradient(cx - rx * 0.35, y - hh * 0.8, 2, cx, y - hh * 0.3, rx * 1.1);
      var F = FOOD[food] || FOOD.flour;
      g.addColorStop(0, 'rgb(' + Math.min(255, F.base[0] + 6) + ',' + Math.min(255, F.base[1] + 6) + ',' + Math.min(255, F.base[2] + 8) + ')');
      g.addColorStop(0.6, 'rgb(' + F.base.join(',') + ')');
      g.addColorStop(1, 'rgb(' + F.shade.join(',') + ')');
      ctx.fillStyle = g; ctx.fill();
      ctx.clip(); _texture(ctx, food, cx - rx, y - hh, rx * 2, hh + ry, seed + 3, 120);
      ctx.restore();
    }
  }

  // Stainless measuring cup. Rim ellipse centre (cx, y), radius rx; handle to the right.
  // fill: { food, frac 0..1 (0 = empty, 1 = to the rim), heap, levelX }
  function drawCup(ctx, cx, y, rx, label, fill, opts) {
    opts = opts || {};
    var ry = rx * 0.32, depth = rx * (opts.spoon ? 0.55 : 0.95), rb = rx * (opts.spoon ? 0.55 : 0.78);
    ctx.save();
    if (!opts.noShadow) contactShadow(ctx, cx + 4, y + depth + 2, rx * 1.15, rx * 0.22, 0.3);
    // handle (flat, slightly raised to the right)
    var hl = rx * (opts.spoon ? 2.4 : 1.55), hw = rx * (opts.spoon ? 0.22 : 0.3);
    ctx.save();
    ctx.translate(cx + rx * 0.9, y);
    ctx.rotate(-0.08);
    ctx.beginPath();
    ctx.moveTo(0, -hw * 0.5); ctx.lineTo(hl - hw, -hw * 0.6);
    ctx.arc(hl - hw, 0, hw * 0.6, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, hw * 0.5); ctx.closePath();
    var hg = ctx.createLinearGradient(0, -hw, 0, hw);
    hg.addColorStop(0, '#F4F7F9'); hg.addColorStop(0.35, '#B9C1C8'); hg.addColorStop(0.6, '#E6EBEE'); hg.addColorStop(1, '#6E767E');
    ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = 'rgba(40,48,56,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    // hang hole
    ctx.beginPath(); ctx.arc(hl - hw * 1.05, 0, hw * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,40,40,0.55)'; ctx.fill();
    // engraved label
    if (label) {
      var fs = Math.max(8, Math.round(hw * 0.72));
      ctx.font = '900 ' + fs + 'px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(label, hl * 0.45 + 0.6, 0.8);
      ctx.fillStyle = 'rgba(40,46,52,0.85)'; ctx.fillText(label, hl * 0.45, 0);
    }
    ctx.restore();

    // body
    ctx.beginPath();
    ctx.moveTo(cx - rx, y);
    ctx.bezierCurveTo(cx - rx, y + depth * 0.7, cx - rb, y + depth, cx, y + depth);
    ctx.bezierCurveTo(cx + rb, y + depth, cx + rx, y + depth * 0.7, cx + rx, y);
    ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = _steel(ctx, cx - rx, cx + rx, y); ctx.fill();
    // brushed lines
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.6;
    for (var i = -10; i < 10; i++) { ctx.beginPath(); ctx.ellipse(cx, y + depth * 0.3 + i * 2.2, rx * 1.02, ry * 1.1, 0, 0, Math.PI); ctx.stroke(); }
    var rf = ctx.createLinearGradient(0, y, 0, y + depth);
    rf.addColorStop(0, 'rgba(255,255,255,0.0)'); rf.addColorStop(0.75, 'rgba(0,0,0,0.0)'); rf.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = rf; ctx.fillRect(cx - rx, y, rx * 2, depth + 2);
    // the warm counter reflected low on the bowl
    var cr = ctx.createLinearGradient(0, y + depth * 0.55, 0, y + depth);
    cr.addColorStop(0, 'rgba(230,220,205,0)'); cr.addColorStop(1, 'rgba(230,220,205,0.35)');
    ctx.fillStyle = cr; ctx.fillRect(cx - rx, y + depth * 0.5, rx * 2, depth * 0.55);
    ctx.restore();

    // interior
    ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
    var ig = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    ig.addColorStop(0, '#5E666E'); ig.addColorStop(0.5, '#A9B1B8'); ig.addColorStop(1, '#E7ECEF');
    ctx.fillStyle = ig; ctx.fill();
    if (fill && fill.frac > 0.01) {
      // contents seen inside the rim (shallower when partly full)
      var fy = y + ry * 0.55 * (1 - fill.frac);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, y, rx * 0.97, ry * 0.95, 0, 0, Math.PI * 2); ctx.clip();
      _cupContents(ctx, fill.food, cx, fy, rx * (0.8 + 0.2 * fill.frac), ry * (0.8 + 0.2 * fill.frac), 0, null, 11);
      ctx.restore();
    }
    // rim
    ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#EEF2F4'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(40,48,56,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, y + 1.4, rx, ry, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.strokeStyle = 'rgba(70,78,86,0.55)'; ctx.lineWidth = 1; ctx.stroke();
    if (fill && fill.heap > 0.01 && fill.frac >= 0.99) {
      _cupContents(ctx, fill.food, cx, y, rx, ry, fill.heap, fill.levelX, 17);
    }
    ctx.restore();
  }

  // Paper sack with the food showing at the top.
  function drawSack(ctx, x, y, w, h, food) {
    var F = FOOD[food] || FOOD.flour;
    contactShadow(ctx, x + w * 0.55, y + h, w * 0.7, w * 0.12, 0.35);
    ctx.save();
    // back fold
    ctx.beginPath();
    ctx.moveTo(x + w * 0.04, y + h * 0.12); ctx.lineTo(x + w * 0.96, y + h * 0.1);
    ctx.lineTo(x + w * 0.98, y + h * 0.22); ctx.lineTo(x + w * 0.02, y + h * 0.24); ctx.closePath();
    ctx.fillStyle = '#8B6A3E'; ctx.fill();
    // contents at the mouth
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.2, w * 0.45, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fillStyle = _foodFill(ctx, food, x, y + h * 0.13, x + w, y + h * 0.27); ctx.fill();
    ctx.save(); ctx.clip(); _texture(ctx, food, x, y + h * 0.12, w, h * 0.16, 5, 80); ctx.restore();
    // little scoop mark
    ctx.beginPath(); ctx.ellipse(x + w * 0.58, y + h * 0.21, w * 0.12, h * 0.03, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fill();
    // front of sack
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.22);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.3, x + w, y + h * 0.21);
    ctx.lineTo(x + w * 0.97, y + h); ctx.lineTo(x + w * 0.03, y + h); ctx.closePath();
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#A9844F'); g.addColorStop(0.3, '#D9B985'); g.addColorStop(0.65, '#CBA672'); g.addColorStop(1, '#8F6B3B');
    ctx.fillStyle = g; ctx.fill();
    // rolled-down cuff
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h * 0.22); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.31, x + w + 2, y + h * 0.21);
    ctx.lineTo(x + w + 1, y + h * 0.32); ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.41, x - 1, y + h * 0.33); ctx.closePath();
    var cg = ctx.createLinearGradient(0, y + h * 0.22, 0, y + h * 0.4);
    cg.addColorStop(0, '#E7CC9C'); cg.addColorStop(1, '#B08A55');
    ctx.fillStyle = cg; ctx.fill();
    // creases
    ctx.strokeStyle = 'rgba(90,60,25,0.25)'; ctx.lineWidth = 1;
    [[0.18, 0.4, 0.14, 0.95], [0.8, 0.42, 0.86, 0.96], [0.5, 0.75, 0.62, 0.98]].forEach(function(c) {
      ctx.beginPath(); ctx.moveTo(x + w * c[0], y + h * c[1]); ctx.lineTo(x + w * c[2], y + h * c[3]); ctx.stroke();
    });
    // label
    var lx = x + w * 0.16, ly = y + h * 0.5, lw = w * 0.68, lh = h * 0.3;
    _rr(ctx, lx, ly, lw, lh, 6); ctx.fillStyle = '#FBF6EA'; ctx.fill();
    ctx.strokeStyle = '#1E3A8A'; ctx.lineWidth = 1.6; _rr(ctx, lx + 3, ly + 3, lw - 6, lh - 6, 4); ctx.stroke();
    ctx.fillStyle = '#1E3A8A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 ' + Math.round(lh * 0.32) + 'px "Baloo 2", Nunito, sans-serif';
    ctx.fillText(F.name, lx + lw / 2, ly + lh * 0.42);
    ctx.font = '700 ' + Math.round(lh * 0.18) + 'px Nunito, sans-serif';
    ctx.fillText(F.sub, lx + lw / 2, ly + lh * 0.74);
    ctx.restore();
  }

  // Ceramic mixing bowl. rim centre (cx,y), radius r. amount 0..1 fills it.
  function drawBowl(ctx, cx, y, r, amount, food, opts) {
    opts = opts || {};
    var ry = r * 0.28, d = r * 0.72;
    contactShadow(ctx, cx + 6, y + d, r * 0.95, r * 0.16, 0.38);
    ctx.save();
    // inside
    ctx.beginPath(); ctx.ellipse(cx, y, r, ry, 0, 0, Math.PI * 2);
    var ig = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    if (opts.glass) { ig.addColorStop(0, 'rgba(160,190,200,0.5)'); ig.addColorStop(1, 'rgba(235,245,248,0.5)'); }
    else { ig.addColorStop(0, '#C9CDD0'); ig.addColorStop(1, '#FBFBFA'); }
    ctx.fillStyle = ig; ctx.fill();
    if (amount > 0.005) {
      var a = Math.min(1, amount);
      var top = y + ry * 0.2 - r * 0.18 * a;
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, y, r * 0.97, ry * 0.95, 0, 0, Math.PI * 2); ctx.rect(cx - r, y, r * 2, r);
      ctx.clip();
      var pr = r * (0.45 + 0.5 * Math.sqrt(a));
      ctx.beginPath();
      ctx.moveTo(cx - pr, y + ry * 0.6);
      ctx.quadraticCurveTo(cx - pr * 0.5, top - r * 0.05 * a, cx, top - r * 0.08 * a);
      ctx.quadraticCurveTo(cx + pr * 0.5, top - r * 0.05 * a, cx + pr, y + ry * 0.6);
      ctx.closePath();
      var F = FOOD[food] || FOOD.flour;
      var g = ctx.createRadialGradient(cx - pr * 0.3, top - 4, 2, cx, top + 8, pr);
      g.addColorStop(0, 'rgb(' + F.base.join(',') + ')'); g.addColorStop(1, 'rgb(' + F.shade.join(',') + ')');
      ctx.fillStyle = g; ctx.fill();
      ctx.clip(); _texture(ctx, food, cx - pr, top - 10, pr * 2, ry * 2 + 20, 23, 110);
      ctx.restore();
    }
    // outside
    ctx.beginPath();
    ctx.moveTo(cx - r, y);
    ctx.bezierCurveTo(cx - r, y + d * 0.75, cx - r * 0.55, y + d, cx, y + d);
    ctx.bezierCurveTo(cx + r * 0.55, y + d, cx + r, y + d * 0.75, cx + r, y);
    ctx.ellipse(cx, y, r, ry, 0, 0, Math.PI, false);
    ctx.closePath();
    var og = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
    if (opts.glass) {
      og.addColorStop(0, 'rgba(120,150,160,0.5)'); og.addColorStop(0.3, 'rgba(240,250,252,0.35)'); og.addColorStop(1, 'rgba(110,140,150,0.55)');
    } else {
      og.addColorStop(0, '#B7BEC4'); og.addColorStop(0.25, '#FFFFFF'); og.addColorStop(0.55, '#F1F2F2'); og.addColorStop(1, '#9AA2A8');
    }
    ctx.fillStyle = og; ctx.fill();
    if (!opts.glass) {
      ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.ellipse(cx, y + d * 0.28, r * 1.02, ry * 1.05, 0, 0, Math.PI);
      ctx.strokeStyle = '#2B5C93'; ctx.lineWidth = Math.max(3, r * 0.07); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, y + d * 0.4, r * 1.02, ry * 1.05, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(43,92,147,0.6)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
    }
    // glaze highlight
    ctx.beginPath(); ctx.moveTo(cx - r * 0.72, y + d * 0.15); ctx.quadraticCurveTo(cx - r * 0.66, y + d * 0.6, cx - r * 0.3, y + d * 0.85);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(2, r * 0.05); ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, y, r, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = opts.glass ? 'rgba(40,70,80,0.5)' : '#E9ECEE'; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(60,70,80,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  }

  // Butter knife lying with its edge at (x,y), blade pointing left.
  function drawKnife(ctx, x, y, len, ang) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang || 0);
    var bl = len * 0.6, hl = len * 0.4, bw = len * 0.07;
    // shadow
    ctx.save(); ctx.translate(4, 7); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
    _rr(ctx, -bl, -bw * 0.5, len, bw, bw * 0.5); ctx.fill(); ctx.restore();
    // blade
    ctx.beginPath();
    ctx.moveTo(0, -bw * 0.55); ctx.lineTo(-bl * 0.88, -bw * 0.5);
    ctx.quadraticCurveTo(-bl * 1.02, -bw * 0.3, -bl, bw * 0.15);
    ctx.lineTo(-bl * 0.9, bw * 0.5); ctx.lineTo(0, bw * 0.45); ctx.closePath();
    var g = ctx.createLinearGradient(0, -bw, 0, bw);
    g.addColorStop(0, '#FBFCFD'); g.addColorStop(0.4, '#B8C0C7'); g.addColorStop(0.55, '#E8ECEF'); g.addColorStop(1, '#69717A');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(40,48,56,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
    // bolster
    ctx.fillStyle = '#9AA3AB'; _rr(ctx, -2, -bw * 0.62, 6, bw * 1.24, 2); ctx.fill();
    // wooden handle with rivets
    ctx.beginPath(); _rr(ctx, 3, -bw * 0.7, hl, bw * 1.4, bw * 0.65);
    var hg = ctx.createLinearGradient(0, -bw, 0, bw);
    hg.addColorStop(0, '#9C6332'); hg.addColorStop(0.45, '#6E3F1C'); hg.addColorStop(1, '#3D2210');
    ctx.fillStyle = hg; ctx.fill();
    ctx.fillStyle = '#D9DEE2';
    [0.3, 0.65].forEach(function(p) { ctx.beginPath(); ctx.arc(3 + hl * p, 0, bw * 0.16, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // ---- 7-segment digits -------------------------------------------------
  var SEG = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': '' };
  function _digit(ctx, ch, x, y, w, h, on, off) {
    var t = w * 0.18, s = SEG[ch] || '';
    function seg(id, horiz, sx, sy, len) {
      ctx.fillStyle = s.indexOf(id) >= 0 ? on : off;
      ctx.beginPath();
      if (horiz) {
        ctx.moveTo(sx, sy); ctx.lineTo(sx + t / 2, sy - t / 2); ctx.lineTo(sx + len - t / 2, sy - t / 2);
        ctx.lineTo(sx + len, sy); ctx.lineTo(sx + len - t / 2, sy + t / 2); ctx.lineTo(sx + t / 2, sy + t / 2);
      } else {
        ctx.moveTo(sx, sy); ctx.lineTo(sx + t / 2, sy + t / 2); ctx.lineTo(sx + t / 2, sy + len - t / 2);
        ctx.lineTo(sx, sy + len); ctx.lineTo(sx - t / 2, sy + len - t / 2); ctx.lineTo(sx - t / 2, sy + t / 2);
      }
      ctx.closePath(); ctx.fill();
    }
    var sk = w * 0.12; // italic skew
    ctx.save(); ctx.transform(1, 0, -sk / h, 1, sk * 0.5, 0);
    seg('a', true, x + t * 0.6, y, w - t * 1.2);
    seg('g', true, x + t * 0.6, y + h / 2, w - t * 1.2);
    seg('d', true, x + t * 0.6, y + h, w - t * 1.2);
    seg('f', false, x, y + t * 0.6, h / 2 - t * 1.2);
    seg('e', false, x, y + h / 2 + t * 0.6, h / 2 - t * 1.2);
    seg('b', false, x + w, y + t * 0.6, h / 2 - t * 1.2);
    seg('c', false, x + w, y + h / 2 + t * 0.6, h / 2 - t * 1.2);
    ctx.restore();
  }

  // Digital scale: platform centre cx, top surface at y, width w.
  function drawDigitalScale(ctx, cx, y, w, reading, on, tarePressed) {
    var h = w * 0.13, fh = w * 0.2, x = cx - w / 2;
    contactShadow(ctx, cx + 6, y + h + fh, w * 0.62, w * 0.07, 0.4);
    ctx.save();
    // front face (glossy black)
    _rr(ctx, x, y + h * 0.5, w, fh + h * 0.5, w * 0.05);
    var fg = ctx.createLinearGradient(0, y + h, 0, y + h + fh);
    fg.addColorStop(0, '#3A3F46'); fg.addColorStop(0.15, '#16191D'); fg.addColorStop(1, '#0B0C0E');
    ctx.fillStyle = fg; ctx.fill();
    // top surface (brushed steel in perspective)
    ctx.beginPath();
    ctx.moveTo(x + w * 0.06, y); ctx.lineTo(x + w * 0.94, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.7); ctx.lineTo(x, y + h * 0.7);
    ctx.quadraticCurveTo(x, y, x + w * 0.06, y); ctx.closePath();
    ctx.fillStyle = _steel(ctx, x, x + w, y); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.6;
    for (var i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(x, y + i * h * 0.06); ctx.lineTo(x + w, y + i * h * 0.06); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x + w * 0.05, y + h * 0.68, w * 0.9, 1.2);
    // LCD window
    var lw = w * 0.42, lh = fh * 0.58, lx = cx - lw / 2 - w * 0.08, ly = y + h + fh * 0.12;
    _rr(ctx, lx - 3, ly - 3, lw + 6, lh + 6, 6); ctx.fillStyle = '#05070A'; ctx.fill();
    _rr(ctx, lx, ly, lw, lh, 4);
    var lg = ctx.createLinearGradient(0, ly, 0, ly + lh);
    if (on) { lg.addColorStop(0, '#BFE4EF'); lg.addColorStop(1, '#8CC6D9'); }
    else { lg.addColorStop(0, '#59666B'); lg.addColorStop(1, '#3F4A4F'); }
    ctx.fillStyle = lg; ctx.fill();
    if (on) {
      var txt = String(Math.max(-999, Math.min(9999, Math.round(reading))));
      while (txt.length < 4) txt = ' ' + txt;
      var dw = lw * 0.14, dh = lh * 0.62, gap = lw * 0.05, sx0 = lx + lw * 0.08;
      for (var d = 0; d < 4; d++) {
        _digit(ctx, txt.charAt(d), sx0 + d * (dw + gap), ly + lh * 0.18, dw, dh, '#0E2A36', 'rgba(14,42,54,0.07)');
      }
      ctx.fillStyle = '#0E2A36'; ctx.font = '900 ' + Math.round(lh * 0.34) + 'px Nunito, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('g', lx + lw * 0.86, ly + lh * 0.8);
    }
    // glare on the LCD glass
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + lw * 0.55, ly); ctx.lineTo(lx + lw * 0.3, ly + lh); ctx.lineTo(lx, ly + lh); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
    // buttons
    var bx = cx + w * 0.3, by = ly + lh * 0.5, br = fh * 0.2;
    [['TARE', bx, tarePressed], ['ON', bx + br * 2.6, false]].forEach(function(b) {
      ctx.beginPath(); ctx.arc(b[1], by + (b[2] ? 1 : 0), br, 0, Math.PI * 2);
      var bg = ctx.createRadialGradient(b[1] - br * 0.3, by - br * 0.4, 1, b[1], by, br);
      bg.addColorStop(0, b[2] ? '#7DD3FC' : '#5B636C'); bg.addColorStop(1, b[2] ? '#0369A1' : '#24282D');
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#E5E7EB'; ctx.font = '800 ' + Math.max(7, Math.round(br * 0.55)) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b[0], b[1], by + br * 1.6);
    });
    ctx.restore();
  }

  // Dial (needle) scale: top platform at y, body below with the dial.
  // needle: angle in grams already offset by the dial's zero.
  function drawDialScale(ctx, cx, y, w, grams, maxG) {
    var bodyH = w * 0.78, x = cx - w / 2, top = y + w * 0.06;
    contactShadow(ctx, cx + 8, top + bodyH, w * 0.6, w * 0.07, 0.42);
    ctx.save();
    // body (cream enamel)
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, top); ctx.lineTo(x + w * 0.9, top);
    ctx.quadraticCurveTo(x + w, top + bodyH * 0.3, x + w * 0.97, top + bodyH);
    ctx.lineTo(x + w * 0.03, top + bodyH);
    ctx.quadraticCurveTo(x, top + bodyH * 0.3, x + w * 0.1, top);
    ctx.closePath();
    var bg = ctx.createLinearGradient(x, 0, x + w, 0);
    bg.addColorStop(0, '#9F2A24'); bg.addColorStop(0.25, '#E24B3F'); bg.addColorStop(0.55, '#C8352B'); bg.addColorStop(1, '#7E1F1A');
    ctx.fillStyle = bg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w * 0.16, top + 6); ctx.quadraticCurveTo(x + w * 0.08, top + bodyH * 0.5, x + w * 0.12, top + bodyH - 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    // feet
    ctx.fillStyle = '#2A1A16'; _rr(ctx, x + w * 0.1, top + bodyH - 2, w * 0.14, 7, 3); ctx.fill(); _rr(ctx, x + w * 0.76, top + bodyH - 2, w * 0.14, 7, 3); ctx.fill();
    // dial
    var dr = w * 0.3, dcx = cx, dcy = top + bodyH * 0.55;
    ctx.beginPath(); ctx.arc(dcx, dcy, dr + 7, 0, Math.PI * 2);
    var rg = ctx.createLinearGradient(dcx - dr, dcy - dr, dcx + dr, dcy + dr);
    rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(0.4, '#9DA5AD'); rg.addColorStop(0.6, '#E7EBEE'); rg.addColorStop(1, '#5E666E');
    ctx.fillStyle = rg; ctx.fill();
    ctx.beginPath(); ctx.arc(dcx, dcy, dr, 0, Math.PI * 2);
    var fg = ctx.createRadialGradient(dcx - dr * 0.2, dcy - dr * 0.3, 2, dcx, dcy, dr);
    fg.addColorStop(0, '#FFFDF6'); fg.addColorStop(1, '#EDE4CF');
    ctx.fillStyle = fg; ctx.fill();
    // ticks: 0..maxG over 300°
    var a0 = -Math.PI / 2 - Math.PI * 5 / 6, sweep = Math.PI * 5 / 3;
    ctx.strokeStyle = '#1F2937'; ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var stepMinor = maxG / 100, i;
    for (i = 0; i <= 100; i++) {
      var a = a0 + sweep * i / 100, major = i % 10 === 0, mid = i % 5 === 0;
      var r0 = dr * (major ? 0.78 : mid ? 0.84 : 0.88), r1 = dr * 0.94;
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(dcx + Math.cos(a) * r0, dcy + Math.sin(a) * r0); ctx.lineTo(dcx + Math.cos(a) * r1, dcy + Math.sin(a) * r1); ctx.stroke();
      if (major) {
        ctx.font = '800 ' + Math.max(8, Math.round(dr * 0.12)) + 'px Nunito, sans-serif';
        ctx.fillText(String(Math.round(i * stepMinor)), dcx + Math.cos(a) * dr * 0.64, dcy + Math.sin(a) * dr * 0.64);
      }
    }
    ctx.font = '900 ' + Math.round(dr * 0.16) + 'px Nunito, sans-serif'; ctx.fillStyle = '#B91C1C';
    ctx.fillText('g', dcx, dcy + dr * 0.42);
    ctx.font = '700 ' + Math.round(dr * 0.09) + 'px Nunito, sans-serif'; ctx.fillStyle = '#6B7280';
    ctx.fillText('COCINA', dcx, dcy - dr * 0.36);
    // needle
    var na = a0 + sweep * Math.max(-0.03, Math.min(1.03, grams / maxG));
    ctx.save(); ctx.translate(dcx, dcy); ctx.rotate(na);
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.moveTo(-dr * 0.16, -2.2); ctx.lineTo(dr * 0.9, -0.6); ctx.lineTo(dr * 0.9, 0.6); ctx.lineTo(-dr * 0.16, 2.2); ctx.closePath();
    ctx.fillStyle = '#DC2626'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(dcx, dcy, dr * 0.07, 0, Math.PI * 2);
    var cg = ctx.createRadialGradient(dcx - 2, dcy - 2, 1, dcx, dcy, dr * 0.07);
    cg.addColorStop(0, '#F3F4F6'); cg.addColorStop(1, '#4B5563'); ctx.fillStyle = cg; ctx.fill();
    // glass glare
    ctx.beginPath(); ctx.arc(dcx, dcy, dr, Math.PI * 1.05, Math.PI * 1.65);
    ctx.arc(dcx + dr * 0.15, dcy + dr * 0.15, dr * 0.92, Math.PI * 1.62, Math.PI * 1.08, true); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    // zero knob on the side
    ctx.beginPath(); ctx.arc(x + w * 0.92, dcy + dr * 0.7, w * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = '#E5E7EB'; ctx.fill(); ctx.strokeStyle = '#6B7280'; ctx.lineWidth = 1; ctx.stroke();
    // platform plate
    var pw = w * 0.9, ph = w * 0.09;
    ctx.fillStyle = '#4B5563'; ctx.fillRect(cx - w * 0.06, y + ph * 0.6, w * 0.12, top - y);
    ctx.beginPath(); ctx.ellipse(cx, y + ph * 0.55, pw / 2, ph * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6B7280'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, y, pw / 2, ph * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = _steel(ctx, cx - pw / 2, cx + pw / 2, y); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function drawGrains(ctx, grains, food) {
    var F = FOOD[food] || FOOD.flour;
    for (var i = 0; i < grains.length; i++) {
      var g = grains[i];
      ctx.fillStyle = F.flakes ? (i % 2 ? 'rgba(240,220,170,0.95)' : 'rgba(180,140,80,0.9)') :
        'rgba(' + F.base.join(',') + ',' + (0.65 + 0.35 * g.life) + ')';
      if (F.flakes) { ctx.beginPath(); ctx.ellipse(g.x, g.y, 2.2, 1.2, g.a || 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(g.x, g.y, g.s, g.s); }
    }
  }

  // Sugar / flour packet held at its corner spout (mx,my), tilted ang.
  function drawPacket(ctx, food, mx, my, ang, s) {
    var F = FOOD[food] || FOOD.flour;
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-10 * s, 0); ctx.lineTo(10 * s, 0); ctx.lineTo(34 * s, 22 * s); ctx.lineTo(34 * s, 130 * s);
    ctx.lineTo(-34 * s, 130 * s); ctx.lineTo(-34 * s, 22 * s); ctx.closePath();
    var g = ctx.createLinearGradient(-34 * s, 0, 34 * s, 0);
    var col = food === 'sugar' ? ['#C5D3E8', '#FFFFFF', '#E9EEF6', '#9FB1CC'] : ['#A9844F', '#E1C493', '#CBA672', '#8F6B3B'];
    g.addColorStop(0, col[0]); g.addColorStop(0.3, col[1]); g.addColorStop(0.7, col[2]); g.addColorStop(1, col[3]);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,60,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = food === 'sugar' ? '#1D4ED8' : '#7C2D12';
    ctx.fillRect(-34 * s, 56 * s, 68 * s, 40 * s);
    ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(12 * s) + 'px "Baloo 2", Nunito, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(F.name, 0, 76 * s);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-34 * s, 20 * s, 68 * s, 3 * s);
    ctx.restore();
  }

  return {
    dish: dish, icon: icon, medal: medal,
    rng: rng, rr: _rr,
    makeBackdrop: makeBackdrop, contactShadow: contactShadow,
    jugGeom: jugGeom, drawJug: drawJug, drawSource: drawSource, drawStream: drawStream, drawDrops: drawDrops,
    drawCup: drawCup, drawSack: drawSack, drawBowl: drawBowl, drawKnife: drawKnife,
    drawDigitalScale: drawDigitalScale, drawDialScale: drawDialScale, drawGrains: drawGrains, drawPacket: drawPacket,
    LIQ: LIQ, FOOD: FOOD
  };
})();
