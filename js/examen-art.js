/* ================================================================
   EXAMEN Y VIRTUDES — art (js/examen-art.js)
   Hand-built SVG: an evening window over the Andes, the night sky at
   the end, four candles that light up as the steps go by, the picture
   choices for each step and a medallion for each virtue.
   Everything is drawn here; no images, no network.
   ================================================================ */

var ExamenArt = (function() {
  'use strict';

  var OL = '#3b2a4a';                       // outline ink
  var SK = ['#f6d2b4', '#e9b48f', '#c98d64'];   // skin tones, varied per figure
  var _n = 0;
  function uid(p) { return (p || 'ex') + (++_n); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }

  function svg(vb, body, cls, label) {
    return '<svg viewBox="' + vb + '" class="' + (cls || '') + '" ' +
      (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true" focusable="false"') +
      ' xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }
  function lin(id, c1, c2, x2, y2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
  }
  function rad(id, c1, c2, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx || '40%') + '" cy="' + (cy || '35%') + '" r="' + (r || '70%') + '">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>';
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function(c) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))); };
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }
  var S = 'stroke="' + OL + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  var Sf = 'stroke="' + OL + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';

  // A small person: head at (x, y), r = head radius.
  function person(x, y, r, o) {
    o = o || {};
    var skin = o.skin || SK[0], shirt = o.shirt || '#5b7fc7', hair = o.hair || '#5a3a22';
    var id = uid('pp'), b = r * 2.3, w = r * 1.9;
    var s = '<defs>' + lin(id, shade(shirt, 0.18), shade(shirt, -0.18)) + '</defs>';
    // body
    s += '<path d="M' + (x - w / 2) + ' ' + (y + r * 3.6) + ' Q' + (x - w / 2) + ' ' + (y + r * 1.1) + ' ' + x + ' ' + (y + r * 1.1) +
      ' Q' + (x + w / 2) + ' ' + (y + r * 1.1) + ' ' + (x + w / 2) + ' ' + (y + r * 3.6) + ' Z" fill="url(#' + id + ')" ' + S + '/>';
    if (o.arms === 'up') {
      s += '<path d="M' + (x - w / 2 + 2) + ' ' + (y + r * 1.8) + ' L' + (x - w / 2 - r * 0.8) + ' ' + (y + r * 0.4) + '" ' + S + ' fill="none"/>' +
           '<path d="M' + (x + w / 2 - 2) + ' ' + (y + r * 1.8) + ' L' + (x + w / 2 + r * 0.8) + ' ' + (y + r * 0.4) + '" ' + S + ' fill="none"/>';
    }
    // head and hair
    s += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + skin + '" ' + S + '/>';
    if (o.long) s += '<path d="M' + (x - r * 1.05) + ' ' + (y + r * 0.9) + ' Q' + (x - r * 1.25) + ' ' + (y - r * 1.3) + ' ' + x + ' ' + (y - r * 1.12) +
      ' Q' + (x + r * 1.25) + ' ' + (y - r * 1.3) + ' ' + (x + r * 1.05) + ' ' + (y + r * 0.9) + ' Q' + (x + r * 0.6) + ' ' + (y - r * 0.5) + ' ' + x + ' ' + (y - r * 0.55) +
      ' Q' + (x - r * 0.6) + ' ' + (y - r * 0.5) + ' ' + (x - r * 1.05) + ' ' + (y + r * 0.9) + ' Z" fill="' + hair + '" ' + Sf + '/>';
    else s += '<path d="M' + (x - r * 0.98) + ' ' + (y - r * 0.15) + ' Q' + (x - r) + ' ' + (y - r * 1.15) + ' ' + x + ' ' + (y - r * 1.08) +
      ' Q' + (x + r) + ' ' + (y - r * 1.15) + ' ' + (x + r * 0.98) + ' ' + (y - r * 0.15) + ' Q' + (x + r * 0.3) + ' ' + (y - r * 0.62) + ' ' + (x - r * 0.98) + ' ' + (y - r * 0.15) + ' Z" fill="' + hair + '" ' + Sf + '/>';
    // face: closed happy eyes or dots, and a smile
    var ey = y + r * 0.08, ex = r * 0.36;
    if (o.closed) s += '<path d="M' + (x - ex - 2) + ' ' + ey + ' q2 2 4 0 M' + (x + ex - 2) + ' ' + ey + ' q2 2 4 0" stroke="' + OL + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    else s += '<circle cx="' + (x - ex) + '" cy="' + ey + '" r="' + Math.max(1.1, r * 0.11) + '" fill="' + OL + '"/><circle cx="' + (x + ex) + '" cy="' + ey + '" r="' + Math.max(1.1, r * 0.11) + '" fill="' + OL + '"/>';
    s += '<path d="M' + (x - r * 0.3) + ' ' + (y + r * 0.42) + ' Q' + x + ' ' + (y + r * 0.68) + ' ' + (x + r * 0.3) + ' ' + (y + r * 0.42) + '" stroke="' + OL + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="' + (x - r * 0.62) + '" cy="' + (y + r * 0.38) + '" r="' + r * 0.16 + '" fill="#f08a8a" opacity="0.45"/><circle cx="' + (x + r * 0.62) + '" cy="' + (y + r * 0.38) + '" r="' + r * 0.16 + '" fill="#f08a8a" opacity="0.45"/>';
    return s;
  }

  function heart(cx, cy, s, fill) {
    return '<path d="M' + cx + ' ' + (cy + s * 0.9) + ' C' + (cx - s * 1.4) + ' ' + (cy - s * 0.1) + ' ' + (cx - s * 0.9) + ' ' + (cy - s * 1.1) + ' ' + cx + ' ' + (cy - s * 0.45) +
      ' C' + (cx + s * 0.9) + ' ' + (cy - s * 1.1) + ' ' + (cx + s * 1.4) + ' ' + (cy - s * 0.1) + ' ' + cx + ' ' + (cy + s * 0.9) + ' Z" fill="' + (fill || '#e0526e') + '" ' + S + '/>';
  }
  function star5(cx, cy, R, r, fill, extra) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
      p.push((cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return '<path d="M' + p.join(' L') + ' Z" fill="' + fill + '" ' + (extra || S) + '/>';
  }
  function sparkle(x, y, s, c) {
    return '<path d="M' + x + ' ' + (y - s) + ' Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + ' Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + ' Z" fill="' + (c || '#fff6cf') + '"/>';
  }

  // ── Picture tiles (96 × 96) ─────────────────────────────────────
  var ICONS = {
    family: function() {
      return person(28, 34, 11, { shirt: '#4f78c4', hair: '#4a2f1d', skin: SK[1] }) +
        person(68, 34, 11, { shirt: '#c8507a', hair: '#7a4a24', long: true, skin: SK[0] }) +
        person(48, 56, 8.5, { shirt: '#e5a33a', hair: '#5a3a22', skin: SK[0] }) +
        heart(48, 20, 6);
    },
    food: function() {
      var a = uid('fd'), b = uid('fd');
      return '<defs>' + lin(a, '#f7f3ea', '#d9d2c3') + lin(b, '#e9a24b', '#b86c22') + '</defs>' +
        '<path d="M30 30 q-3 -7 1 -12 M40 28 q-3 -7 1 -12 M50 30 q-3 -7 1 -12" stroke="#b9b2a6" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="42" cy="44" rx="30" ry="8" fill="#e98a3c" ' + S + '/>' +
        '<path d="M12 44 Q14 72 42 72 Q70 72 72 44 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M20 52 Q42 58 64 52" stroke="#c7bca9" stroke-width="2" fill="none"/>' +
        '<circle cx="34" cy="42" r="3" fill="#f6c94c"/><circle cx="48" cy="44" r="2.6" fill="#7bb661"/><circle cx="55" cy="41" r="2.4" fill="#f6c94c"/>' +
        '<path d="M60 70 Q58 54 74 52 Q90 52 88 68 Q86 78 74 78 Q62 78 60 70 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<path d="M68 60 l4 4 M76 58 l4 4" stroke="#8a4a14" stroke-width="2" stroke-linecap="round"/>';
    },
    home: function() {
      var a = uid('hm'), b = uid('hm');
      return '<defs>' + lin(a, '#f7e6c4', '#e2c48f') + lin(b, '#c2503a', '#8f3322') + '</defs>' +
        '<rect x="22" y="44" width="52" height="34" rx="2" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M14 48 L48 18 L82 48 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<rect x="62" y="22" width="8" height="14" fill="#9b5a3a" ' + Sf + '/>' +
        '<rect x="42" y="56" width="13" height="22" rx="6" fill="#8a5a34" ' + Sf + '/>' +
        '<rect x="27" y="52" width="11" height="10" fill="#ffe08a" ' + Sf + '/><path d="M32.5 52 v10 M27 57 h11" stroke="' + OL + '" stroke-width="1.2"/>' +
        '<rect x="60" y="52" width="10" height="10" fill="#ffe08a" ' + Sf + '/>' +
        '<path d="M8 80 Q48 74 88 80" stroke="#6aa356" stroke-width="5" fill="none" stroke-linecap="round"/>';
    },
    friends: function() {
      return person(32, 36, 12, { shirt: '#3f9a7a', hair: '#2f2015', skin: SK[2] }) +
        person(64, 36, 12, { shirt: '#e07b3a', hair: '#c58a3c', long: true, skin: SK[0] }) +
        '<path d="M42 66 Q48 60 54 66" stroke="' + OL + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    },
    nature: function() {
      var a = uid('nt'), b = uid('nt');
      return '<defs>' + rad(a, '#fff3a6', '#f3b22e') + lin(b, '#6fbf5c', '#3d8a3a') + '</defs>' +
        '<circle cx="68" cy="26" r="11" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M6 74 Q30 50 52 64 Q70 52 90 66 L90 84 L6 84 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<rect x="27" y="46" width="6" height="22" fill="#8a5a34" ' + Sf + '/>' +
        '<circle cx="30" cy="38" r="15" fill="#4f9e48" ' + S + '/><circle cx="24" cy="34" r="5" fill="#7cc06a" opacity="0.7"/>' +
        '<path d="M58 72 q2 -6 4 0 q2 -6 4 0" stroke="#e85d8a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    },
    pet: function() {
      var a = uid('pt');
      return '<defs>' + rad(a, '#e8b27a', '#b9773d') + '</defs>' +
        '<path d="M26 78 Q22 52 48 50 Q74 52 70 78 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M70 66 q12 -4 10 -16" stroke="' + OL + '" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M70 66 q12 -4 10 -16" stroke="#c98a4e" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="48" cy="38" r="17" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M32 30 Q24 36 28 52 Q36 46 36 34 Z" fill="#7a4a24" ' + Sf + '/><path d="M64 30 Q72 36 68 52 Q60 46 60 34 Z" fill="#7a4a24" ' + Sf + '/>' +
        '<ellipse cx="48" cy="46" rx="8" ry="6" fill="#f3d6b4" ' + Sf + '/>' +
        '<circle cx="41" cy="36" r="2.2" fill="' + OL + '"/><circle cx="55" cy="36" r="2.2" fill="' + OL + '"/>' +
        '<ellipse cx="48" cy="43" rx="3" ry="2.2" fill="' + OL + '"/><path d="M48 46 v3 q-3 3 -5 0 M48 49 q3 3 5 0" stroke="' + OL + '" stroke-width="1.3" fill="none"/>' +
        '<rect x="38" y="54" width="20" height="4" rx="2" fill="#d23c4a" ' + Sf + '/>';
    },
    health: function() {
      var a = uid('hl');
      return '<defs>' + rad(a, '#ff8a8a', '#c9283c') + '</defs>' +
        '<path d="M48 82 C14 60 14 30 32 26 C40 24 46 30 48 36 C50 30 56 24 64 26 C82 30 82 60 48 82 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M36 34 q4 -4 9 -1" stroke="#ffd0d0" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 52 h14 l5 -9 l7 18 l6 -12 h24" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    school: function() {
      var a = uid('sc');
      return '<defs>' + lin(a, '#5d86d6', '#2f569e') + '</defs>' +
        '<path d="M12 30 Q30 24 48 32 L48 78 Q30 70 12 76 Z" fill="#fffaf0" ' + S + '/>' +
        '<path d="M84 30 Q66 24 48 32 L48 78 Q66 70 84 76 Z" fill="#fffaf0" ' + S + '/>' +
        '<path d="M18 40 q12 -4 24 2 M18 48 q12 -4 24 2 M18 56 q12 -4 24 2 M54 42 q12 -6 24 -2 M54 50 q12 -6 24 -2" stroke="#b8c4dc" stroke-width="2" fill="none"/>' +
        '<g transform="rotate(-35 66 60)"><rect x="60" y="34" width="10" height="38" fill="url(#' + a + ')" ' + Sf + '/><path d="M60 72 L65 82 L70 72 Z" fill="#f3d2a2" ' + Sf + '/><path d="M64 79 L65 82 L66 79 Z" fill="' + OL + '"/><rect x="60" y="30" width="10" height="5" fill="#e98aa0" ' + Sf + '/></g>';
    },
    toys: function() {
      var a = uid('ty'), b = uid('ty');
      return '<defs>' + rad(a, '#c99560', '#8a5a2e') + lin(b, '#f5c443', '#d98b1f') + '</defs>' +
        '<rect x="56" y="54" width="24" height="24" rx="3" fill="url(#' + b + ')" ' + S + '/><path d="M62 60 h12 M68 60 v12" stroke="#fff3c2" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="24" cy="26" r="7" fill="url(#' + a + ')" ' + S + '/><circle cx="48" cy="26" r="7" fill="url(#' + a + ')" ' + S + '/>' +
        '<ellipse cx="36" cy="62" rx="17" ry="18" fill="url(#' + a + ')" ' + S + '/>' +
        '<ellipse cx="36" cy="64" rx="9" ry="10" fill="#e8c59a"/>' +
        '<circle cx="36" cy="36" r="15" fill="url(#' + a + ')" ' + S + '/>' +
        '<ellipse cx="36" cy="41" rx="6.5" ry="5" fill="#e8c59a" ' + Sf + '/>' +
        '<circle cx="30" cy="33" r="2" fill="' + OL + '"/><circle cx="42" cy="33" r="2" fill="' + OL + '"/><ellipse cx="36" cy="39.5" rx="2.4" ry="1.7" fill="' + OL + '"/>' +
        '<path d="M28 48 L36 52 L44 48 L44 54 L36 50 L28 54 Z" fill="#d23c4a" ' + Sf + '/>';
    },
    church: function() {
      var a = uid('ch'), b = uid('ch');
      return '<defs>' + lin(a, '#fbf4e4', '#e2d2b0') + lin(b, '#5c84c9', '#2e4f8f') + '</defs>' +
        '<rect x="20" y="46" width="46" height="32" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M16 48 L43 30 L70 48 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<rect x="62" y="28" width="16" height="50" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M60 30 L70 14 L80 30 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<path d="M70 4 v10 M66 8 h8" stroke="#c99a2e" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M66 44 a4 4 0 0 1 8 0 v6 h-8 Z" fill="#3b2a4a"/><circle cx="70" cy="47" r="2" fill="#e5b84a"/>' +
        '<path d="M36 78 v-12 a7 7 0 0 1 14 0 v12 Z" fill="#8a5a34" ' + Sf + '/>' +
        '<circle cx="43" cy="40" r="4" fill="#ffd56a" ' + Sf + '/>' +
        '<path d="M10 80 H88" stroke="#7aa35f" stroke-width="4" stroke-linecap="round"/>';
    },
    // happy
    play: function() {
      var a = uid('pl');
      return '<defs>' + lin(a, '#ff8a5c', '#d9415c', 1, 1) + '</defs>' +
        '<path d="M50 10 L76 34 L52 62 L26 36 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M50 10 L52 62 M26 36 L76 34" stroke="#ffd3b8" stroke-width="1.6"/>' +
        '<path d="M52 62 Q46 72 54 76 Q62 80 56 88" stroke="' + OL + '" stroke-width="1.6" fill="none"/>' +
        '<path d="M50 70 l6 -3 l-1 6 Z M53 80 l6 -2 l-2 5 Z" fill="#5aa2e0" ' + Sf + '/>' +
        '<path d="M56 88 Q40 86 28 82" stroke="' + OL + '" stroke-width="1.3" fill="none" stroke-dasharray="2 3"/>' +
        person(24, 70, 7, { shirt: '#3f9a7a', hair: '#4a2f1d', arms: 'up', skin: SK[1] });
    },
    book: function() {
      var a = uid('bk');
      return '<defs>' + lin(a, '#8b5cc8', '#5a3594') + '</defs>' +
        '<path d="M10 72 L10 30 Q30 22 48 30 Q66 22 86 30 L86 72 Q66 64 48 72 Q30 64 10 72 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M14 68 L14 30 Q30 24 47 32 L47 70 Q30 62 14 68 Z" fill="#fffaf0" ' + Sf + '/>' +
        '<path d="M82 68 L82 30 Q66 24 49 32 L49 70 Q66 62 82 68 Z" fill="#fffaf0" ' + Sf + '/>' +
        '<path d="M20 40 q12 -4 22 1 M20 48 q12 -4 22 1 M20 56 q12 -4 22 1 M54 41 q12 -5 22 -1 M54 49 q12 -5 22 -1" stroke="#c9bfd8" stroke-width="2" fill="none"/>' +
        sparkle(70, 16, 6, '#f5c443') + sparkle(26, 14, 4, '#f5c443');
    },
    help: function() {
      var a = uid('hp');
      return '<defs>' + lin(a, '#d9a86c', '#a8733a') + '</defs>' +
        person(30, 30, 10, { shirt: '#c8507a', hair: '#7a4a24', long: true, skin: SK[0] }) +
        person(66, 30, 10, { shirt: '#4f78c4', hair: '#2f2015', skin: SK[2] }) +
        '<rect x="30" y="50" width="36" height="24" rx="2" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M30 58 h36 M48 50 v8" stroke="#8a5a2e" stroke-width="1.6"/>' +
        '<circle cx="30" cy="60" r="4" fill="' + SK[0] + '" ' + Sf + '/><circle cx="66" cy="60" r="4" fill="' + SK[2] + '" ' + Sf + '/>';
    },
    hug: function() {
      return person(38, 34, 13, { shirt: '#e07b3a', hair: '#5a3a22', closed: true, skin: SK[0] }) +
        person(60, 40, 10, { shirt: '#3f9a7a', hair: '#c58a3c', long: true, closed: true, skin: SK[1] }) +
        '<path d="M28 64 Q48 74 72 58" stroke="' + OL + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M28 64 Q48 74 72 58" stroke="#f0b48e" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        heart(74, 18, 6) + heart(20, 22, 4, '#f08aa0');
    },
    ball: function() {
      var a = uid('bl');
      return '<defs>' + rad(a, '#ffffff', '#d6d6d6') + '</defs>' +
        '<ellipse cx="48" cy="84" rx="22" ry="4" fill="#000" opacity="0.12"/>' +
        '<circle cx="48" cy="48" r="30" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M48 36 L59 44 L55 57 L41 57 L37 44 Z" fill="#2d2d38"/>' +
        '<path d="M48 36 V20 M59 44 L73 39 M55 57 L63 70 M41 57 L33 70 M37 44 L23 39" stroke="#2d2d38" stroke-width="2"/>' +
        '<path d="M44 19 Q48 17 52 19 L50 22 L46 22 Z M74 36 L77 44 L73 46 Z M20 44 L22 36 L24 46 Z" fill="#2d2d38"/>' +
        '<path d="M28 34 q6 -10 16 -12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>';
    },
    music: function() {
      var a = uid('mu'), b = uid('mu');
      return '<defs>' + rad(a, '#e9a85a', '#a8622a') + lin(b, '#6b3f1e', '#3e2210') + '</defs>' +
        '<g transform="rotate(-30 48 52)">' +
        '<rect x="44" y="6" width="8" height="40" fill="url(#' + b + ')" ' + Sf + '/>' +
        '<rect x="41" y="2" width="14" height="9" rx="2" fill="#3e2210" ' + Sf + '/>' +
        '<path d="M48 44 C30 44 30 60 38 64 C28 70 32 92 48 92 C64 92 68 70 58 64 C66 60 66 44 48 44 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<circle cx="48" cy="68" r="6" fill="#3e2210"/><rect x="42" y="80" width="12" height="4" fill="#3e2210"/>' +
        '<path d="M46 10 V82 M50 10 V82" stroke="#f2e6c8" stroke-width="0.8"/></g>' +
        '<path d="M74 18 v16 a4 4 0 1 1 -2 -3 V20 l8 -2 v12 a4 4 0 1 1 -2 -3 V18" fill="#5b5fb8" ' + Sf + '/>';
    },
    art: function() {
      var a = uid('ar');
      return '<defs>' + lin(a, '#efd3a2', '#c99c5e') + '</defs>' +
        '<path d="M48 14 C22 14 10 34 14 52 C18 72 40 80 52 74 C62 69 52 60 60 56 C70 52 84 60 84 44 C84 26 68 14 48 14 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<ellipse cx="36" cy="62" rx="6" ry="5" fill="#fff" ' + Sf + '/>' +
        '<circle cx="32" cy="34" r="6" fill="#e0526e" ' + Sf + '/><circle cx="50" cy="26" r="6" fill="#f5c443" ' + Sf + '/>' +
        '<circle cx="68" cy="34" r="6" fill="#4f9e48" ' + Sf + '/><circle cx="24" cy="50" r="6" fill="#4f78c4" ' + Sf + '/>' +
        '<g transform="rotate(35 70 66)"><rect x="67" y="44" width="6" height="34" rx="2" fill="#8a5a34" ' + Sf + '/><rect x="66" y="40" width="8" height="6" fill="#c0c4cc" ' + Sf + '/><path d="M66 40 Q70 28 74 40 Z" fill="#7c4ad1" ' + Sf + '/></g>';
    },
    outside: function() {
      var a = uid('ou');
      return '<defs>' + lin(a, '#bfe4f7', '#e9f6fb') + '</defs>' +
        '<circle cx="28" cy="64" r="14" fill="none" ' + S + ' stroke-width="3"/><circle cx="70" cy="64" r="14" fill="none" ' + S + ' stroke-width="3"/>' +
        '<circle cx="28" cy="64" r="2.5" fill="' + OL + '"/><circle cx="70" cy="64" r="2.5" fill="' + OL + '"/>' +
        '<path d="M28 64 L42 40 L62 40 L70 64 M42 40 L50 64 L62 40 M50 64 L28 64" stroke="#d23c4a" stroke-width="3.4" fill="none" stroke-linejoin="round"/>' +
        '<path d="M40 34 h8 M62 40 L60 30 h-6" stroke="' + OL + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="50" cy="64" r="3" fill="' + OL + '"/>' +
        '<path d="M8 82 H88" stroke="#6aa356" stroke-width="4" stroke-linecap="round"/>' +
        sparkle(80, 18, 5, '#f5c443');
    },
    star: function() {
      var a = uid('st');
      return '<defs>' + rad(a, '#fff3a6', '#e8a01e') + '</defs>' +
        star5(48, 50, 34, 15, 'url(#' + a + ')') +
        '<path d="M34 40 q6 -8 12 -6" stroke="#fffbe0" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        sparkle(80, 18, 5) + sparkle(16, 22, 4);
    },
    pray: function() {
      var a = uid('pr');
      return '<defs>' + lin(a, '#f6d2b4', '#dba27a') + rad(a + 'g', '#fff6cf', '#fff6cf00', '50%', '40%', '55%') + '</defs>' +
        '<circle cx="48" cy="42" r="36" fill="url(#' + a + 'g)"/>' +
        '<path d="M46 16 C40 26 34 44 34 60 L30 66 Q32 80 46 80 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M50 16 C56 26 62 44 62 60 L66 66 Q64 80 50 80 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M28 70 Q48 92 68 70 L68 84 L28 84 Z" fill="#5b7fc7" ' + S + '/>' +
        '<path d="M42 30 q2 6 2 12 M54 30 q-2 6 -2 12" stroke="#c98d64" stroke-width="1.4" fill="none"/>';
    },
    // better
    wait: function() {
      var a = uid('wt');
      return '<defs>' + rad(a, '#ffffff', '#e3e8f2') + '</defs>' +
        '<circle cx="48" cy="48" r="32" fill="url(#' + a + ')" ' + S + '/>' +
        '<circle cx="48" cy="48" r="26" fill="none" stroke="#c8d2e4" stroke-width="1.4"/>' +
        '<path d="M48 26 v4 M48 66 v4 M26 48 h4 M66 48 h4" stroke="' + OL + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M48 48 V34 M48 48 L58 54" stroke="' + OL + '" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="48" cy="48" r="3" fill="#d23c4a"/>' +
        '<path d="M70 18 a28 28 0 0 1 10 14" stroke="#5aa2e0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M80 32 l2 -7 l-7 2" stroke="#5aa2e0" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    share: function() {
      var a = uid('sh');
      return '<defs>' + rad(a, '#e9b26a', '#b87430') + '</defs>' +
        '<path d="M44 20 A28 28 0 1 0 44 76 L40 60 L46 50 L38 40 L46 30 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M54 20 A28 28 0 1 1 54 76 L50 60 L56 50 L48 40 L56 30 Z" fill="url(#' + a + ')" ' + S + ' transform="translate(6 0)"/>' +
        '<circle cx="26" cy="38" r="3" fill="#5a3218"/><circle cx="30" cy="58" r="3.4" fill="#5a3218"/><circle cx="22" cy="50" r="2.2" fill="#5a3218"/>' +
        '<circle cx="74" cy="36" r="3" fill="#5a3218"/><circle cx="76" cy="58" r="3.4" fill="#5a3218"/><circle cx="68" cy="48" r="2.2" fill="#5a3218"/>';
    },
    listen: function() {
      var a = uid('ls');
      return '<defs>' + lin(a, '#f6d2b4', '#e0a983') + '</defs>' +
        '<path d="M40 18 C22 18 16 34 18 46 C20 58 28 58 30 66 C32 76 38 82 46 80 C54 78 52 70 48 66 C42 60 54 52 56 40 C58 26 52 18 40 18 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M30 40 C30 30 44 28 46 38 C47 44 40 46 38 52" stroke="#c98d64" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M64 36 q6 10 0 20 M72 30 q10 16 0 32 M80 24 q14 22 0 44" stroke="#5aa2e0" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    words: function() {
      var a = uid('wd');
      return '<defs>' + lin(a, '#ffffff', '#e8eefb') + '</defs>' +
        '<path d="M14 20 H82 Q88 20 88 26 V58 Q88 64 82 64 H40 L26 78 L28 64 H14 Q8 64 8 58 V26 Q8 20 14 20 Z" fill="url(#' + a + ')" ' + S + '/>' +
        heart(48, 42, 10) + sparkle(72, 32, 4, '#f5c443') + sparkle(24, 32, 3, '#f5c443');
    },
    truth: function() {
      var a = uid('tr'), b = uid('tr');
      return '<defs>' + rad(a, '#fff8c8', '#f4c542') + lin(b, '#d7a44a', '#9e6b1f') + '</defs>' +
        '<circle cx="48" cy="38" r="26" fill="url(#' + a + ')" opacity="0.55"/>' +
        '<path d="M34 52 C24 40 30 18 48 18 C66 18 72 40 62 52 C58 57 58 60 58 64 H38 C38 60 38 57 34 52 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<rect x="38" y="64" width="20" height="6" rx="2" fill="url(#' + b + ')" ' + Sf + '/><rect x="40" y="70" width="16" height="6" rx="2" fill="url(#' + b + ')" ' + Sf + '/>' +
        '<path d="M40 40 l6 6 l12 -12" stroke="#3a7d44" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M14 22 l6 4 M82 22 l-6 4 M10 44 h8 M86 44 h-8" stroke="#e8a01e" stroke-width="3" stroke-linecap="round"/>';
    },
    calm: function() {
      var a = uid('cm');
      return '<defs>' + lin(a, '#ffffff', '#dfe9f7') + '</defs>' +
        '<path d="M22 66 Q8 66 10 52 Q12 40 26 42 Q28 24 46 24 Q62 24 66 38 Q84 36 86 52 Q88 66 72 66 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M36 48 q4 4 8 0 M54 48 q4 4 8 0" stroke="' + OL + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M44 56 q5 3 10 0" stroke="' + OL + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M18 78 q8 -4 16 0 t16 0 t16 0 t16 0" stroke="#5aa2e0" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    },
    tidy: function() {
      var a = uid('td'), b = uid('td');
      return '<defs>' + lin(a, '#d9a86c', '#a8733a') + lin(b, '#c08848', '#8a5a2e') + '</defs>' +
        '<circle cx="34" cy="36" r="9" fill="#e0526e" ' + Sf + '/><rect x="46" y="26" width="16" height="16" rx="2" fill="#f5c443" ' + Sf + '/>' +
        '<path d="M60 40 l10 -14 l8 6 Z" fill="#4f9e48" ' + Sf + '/>' +
        '<path d="M14 46 H82 L78 82 H18 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M10 46 H86 V54 H10 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<path d="M36 66 h24" stroke="#7a4a1e" stroke-width="3" stroke-linecap="round"/>';
    },
    sorry: function() {
      var a = uid('so'), b = uid('so');
      return '<defs>' + lin(a, '#f6d2b4', '#dba27a') + lin(b, '#e9b48f', '#c98d64') + '</defs>' +
        '<path d="M6 58 L24 46 L36 48 L50 40 Q56 38 56 44 L46 54" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M90 58 L72 46 L60 50 L44 52 Q38 54 42 58 L54 60 L46 66 Q42 70 48 72 L62 66 L72 64 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<path d="M6 58 L22 70 L38 70 L50 62" fill="url(#' + a + ')" ' + S + '/>' +
        '<rect x="0" y="50" width="8" height="22" fill="#5b7fc7" ' + Sf + '/><rect x="88" y="50" width="8" height="22" fill="#c8507a" ' + Sf + '/>' +
        heart(48, 22, 7);
    },
    brave: function() {
      var a = uid('bv'), b = uid('bv');
      return '<defs>' + lin(a, '#a7b3c6', '#6b7a93') + lin(b, '#e05a4a', '#a8322a') + '</defs>' +
        '<path d="M8 84 L36 34 L48 50 L60 30 L88 84 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M36 34 L30 46 L36 44 L40 50 Z M60 30 L54 42 L60 40 L64 46 Z" fill="#fff"/>' +
        '<path d="M60 30 V8" stroke="' + OL + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M60 8 L78 13 L60 19 Z" fill="url(#' + b + ')" ' + Sf + '/>';
    },
    thanks: function() {
      var a = uid('tk');
      return '<defs>' + lin(a, '#fff8ea', '#f1dfbd') + '</defs>' +
        '<path d="M12 30 H84 V76 H12 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M12 30 L48 56 L84 30" fill="none" ' + S + '/>' +
        heart(48, 58, 9) +
        sparkle(80, 20, 5, '#f5c443') + sparkle(16, 18, 4, '#f5c443');
    },
    // the next evening's answers
    sprout: function() {
      var a = uid('sp');
      return '<defs>' + lin(a, '#7cc06a', '#3d8a3a') + '</defs>' +
        '<path d="M48 78 V44" stroke="#3d8a3a" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M48 52 C30 52 20 40 22 26 C38 24 48 34 48 52 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M48 46 C62 46 74 36 72 22 C58 20 48 30 48 46 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M22 80 Q48 70 74 80 Z" fill="#9b6a3e" ' + S + '/>';
    },
    moon: function() {
      var a = uid('mn');
      return '<defs>' + rad(a, '#fff8d8', '#e6c45a') + '</defs>' +
        '<path d="M60 14 A34 34 0 1 0 82 66 A28 28 0 1 1 60 14 Z" fill="url(#' + a + ')" ' + S + '/>' +
        sparkle(72, 26, 5) + sparkle(84, 42, 3.5) + sparkle(24, 20, 3);
    },
    // little UI pictures
    journal: function() {
      var a = uid('jn');
      return '<defs>' + lin(a, '#8b5cc8', '#5a3594', 1, 1) + '</defs>' +
        '<rect x="18" y="10" width="58" height="76" rx="6" fill="url(#' + a + ')" ' + S + '/>' +
        '<rect x="26" y="10" width="6" height="76" fill="#4a2a80"/>' +
        '<rect x="38" y="24" width="30" height="16" rx="3" fill="#fff6e0" ' + Sf + '/>' +
        '<path d="M42 30 h22 M42 35 h14" stroke="#b9a8d8" stroke-width="2"/>' +
        '<path d="M62 86 V96 L67 92 L72 96 V86" fill="#e8a01e" ' + Sf + '/>' +
        star5(53, 62, 10, 4.5, '#f5c443', Sf);
    },
    pencil: function() {
      return '<g transform="rotate(40 48 48)"><rect x="40" y="10" width="16" height="58" fill="#f5c443" ' + S + '/><path d="M40 68 L48 86 L56 68 Z" fill="#f3d2a2" ' + S + '/>' +
        '<path d="M46 81 L48 86 L50 81 Z" fill="' + OL + '"/><rect x="40" y="4" width="16" height="8" fill="#e98aa0" ' + S + '/><path d="M45 12 V68 M51 12 V68" stroke="#d99a22" stroke-width="1.4"/></g>';
    },
    brush: function() {
      return '<g transform="rotate(35 48 48)"><rect x="43" y="6" width="10" height="50" rx="4" fill="#8a5a34" ' + S + '/><rect x="41" y="54" width="14" height="10" fill="#c0c4cc" ' + S + '/>' +
        '<path d="M41 64 Q40 80 48 90 Q56 80 55 64 Z" fill="#7c4ad1" ' + S + '/></g>';
    },
    lock: function() {
      return '<path d="M32 44 V32 a16 16 0 0 1 32 0 V44" fill="none" ' + S + ' stroke-width="5"/><rect x="24" y="44" width="48" height="38" rx="6" fill="#e8a01e" ' + S + '/>' +
        '<circle cx="48" cy="60" r="5" fill="' + OL + '"/><rect x="46" y="62" width="4" height="10" fill="' + OL + '"/>';
    }
  };

  // A picture tile: the drawing on a soft round backdrop.
  var BACKS = { thanks: ['#fff4d6', '#ffe1a3'], happy: ['#e6f6ee', '#bfe6cf'], better: ['#e9eefc', '#c9d5f7'], did: ['#fdf0e2', '#f5d3ad'], plain: ['#ffffff', '#f3eee6'] };
  function tile(name, kind, label) {
    var f = ICONS[name];
    if (!f) return '';
    var b = BACKS[kind] || BACKS.plain, id = uid('bk');
    var back = kind === 'none' ? '' : '<defs>' + rad(id, b[0], b[1], '45%', '35%', '72%') + '</defs><circle cx="48" cy="48" r="46" fill="url(#' + id + ')"/>';
    return svg('0 0 96 96', back + f(), 'ex-pic', label);
  }
  function icon(name, label) { return tile(name, 'none', label); }

  // ── Virtue medallions (120 × 120) ───────────────────────────────
  var EMBLEMS = {
    paciencia: function(c) {           // an hourglass
      var a = uid('vg');
      return '<defs>' + lin(a, '#fff3c8', '#e8c060') + '</defs>' +
        '<rect x="38" y="28" width="44" height="7" rx="3" fill="#8a5a34" ' + S + '/><rect x="38" y="85" width="44" height="7" rx="3" fill="#8a5a34" ' + S + '/>' +
        '<path d="M44 35 H76 C76 50 64 56 62 60 C64 64 76 70 76 85 H44 C44 70 56 64 58 60 C56 56 44 50 44 35 Z" fill="#eaf4fb" ' + S + '/>' +
        '<path d="M50 44 H70 C68 52 62 56 60 58 C58 56 52 52 50 44 Z" fill="url(#' + a + ')"/>' +
        '<path d="M60 60 V80 M48 82 Q60 72 72 82 Z" fill="url(#' + a + ')" stroke="#d6a23a" stroke-width="1.4"/>';
    },
    amabilidad: function(c) {          // two open hands holding a heart
      var a = uid('vg');
      var hand = function(flip) {
        return '<g' + (flip ? ' transform="translate(120 0) scale(-1 1)"' : '') + '>' +
          '<path d="M14 66 Q22 62 30 66 L52 80 Q58 84 60 88 L60 96 Q44 98 30 90 L14 82 Z" fill="url(#' + a + ')" ' + S + '/>' +
          '<path d="M30 66 Q34 56 42 60 L54 70 Q58 74 56 78" fill="url(#' + a + ')" ' + S + '/>' +
          '<path d="M36 72 l8 6 M32 78 l10 7" stroke="#c98d64" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path d="M6 64 L16 62 L18 86 L8 88 Z" fill="#5b7fc7" ' + Sf + '/></g>';
      };
      return '<defs>' + lin(a, '#f6d2b4', '#dba27a') + '</defs>' +
        hand(false) + hand(true) + heart(60, 52, 15, '#e0526e') +
        '<path d="M52 44 q4 -5 9 -2" stroke="#ffc2cc" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    },
    compartir: function(c) {           // a gift, given gladly
      var a = uid('vg'), b = uid('vg');
      return '<defs>' + lin(a, '#f0a43a', '#c4741a') + lin(b, '#d23c4a', '#9e2232') + '</defs>' +
        '<rect x="32" y="54" width="56" height="38" rx="3" fill="url(#' + a + ')" ' + S + '/>' +
        '<rect x="28" y="44" width="64" height="12" rx="3" fill="url(#' + a + ')" ' + S + '/>' +
        '<rect x="55" y="44" width="10" height="48" fill="url(#' + b + ')" ' + Sf + '/>' +
        '<path d="M60 44 C48 26 34 34 42 42 C46 46 56 44 60 44 C64 44 74 46 78 42 C86 34 72 26 60 44 Z" fill="url(#' + b + ')" ' + S + '/>';
    },
    honestidad: function(c) {          // a lamp that gives a clear light
      var a = uid('vg'), b = uid('vg');
      return '<defs>' + rad(a, '#fff8c8', '#fff8c800', '50%', '50%', '50%') + lin(b, '#e2b04a', '#a8761f') + '</defs>' +
        '<circle cx="60" cy="44" r="30" fill="url(#' + a + ')"/>' +
        '<path d="M60 26 C52 36 54 46 60 50 C66 46 68 36 60 26 Z" fill="#ffd24a" ' + Sf + '/><path d="M60 34 C57 40 58 45 60 47 C62 45 63 40 60 34 Z" fill="#fff6c0"/>' +
        '<path d="M28 66 Q30 56 44 56 H82 Q92 56 96 48 Q98 62 86 70 L80 82 H40 Q30 80 28 66 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<rect x="56" y="50" width="8" height="7" fill="#7a5a2a" ' + Sf + '/>' +
        '<path d="M28 66 Q16 66 18 56 Q22 50 30 56" fill="none" ' + S + '/>' +
        '<rect x="44" y="82" width="32" height="6" rx="2" fill="#a8761f" ' + Sf + '/>';
    },
    valentia: function(c) {            // a shield with a cross (Saint George)
      var a = uid('vg');
      return '<defs>' + lin(a, '#f7f7f7', '#c9ced8') + '</defs>' +
        '<path d="M60 22 L90 32 Q90 74 60 96 Q30 74 30 32 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M56 34 H64 V52 H82 V60 H64 V84 H56 V60 H38 V52 H56 Z" fill="#c8283a" ' + Sf + '/>' +
        '<path d="M38 36 Q48 32 56 30" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    gratitud: function(c) {            // the sun of the Canticle
      var a = uid('vg'), rays = '';
      for (var i = 0; i < 12; i++) {
        var ang = i * Math.PI / 6, x1 = 60 + Math.cos(ang) * 26, y1 = 58 + Math.sin(ang) * 26, x2 = 60 + Math.cos(ang) * 38, y2 = 58 + Math.sin(ang) * 38;
        rays += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="#e8a01e" stroke-width="5" stroke-linecap="round"/>';
      }
      return '<defs>' + rad(a, '#fff3a6', '#f0aa22') + '</defs>' + rays +
        '<circle cx="60" cy="58" r="22" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M51 55 q3 3 6 0 M63 55 q3 3 6 0" stroke="' + OL + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M52 64 q8 7 16 0" stroke="' + OL + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    },
    obediencia: function(c) {          // footsteps along a path, towards a star
      var steps = '';
      [[44, 92, 20], [60, 80, 40], [70, 64, 8], [58, 50, -24], [56, 34, 4]].forEach(function(p, i) {
        var sc = 1 - i * 0.1;
        steps += '<g transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ') scale(' + sc + ')">' +
          '<ellipse cx="0" cy="2" rx="4" ry="6.5" fill="#6e4220"/><ellipse cx="0" cy="-7" rx="3.2" ry="3" fill="#6e4220"/></g>';
      });
      return '<path d="M38 104 C60 92 82 78 70 62 C58 48 50 40 60 22" stroke="' + OL + '" stroke-width="17" fill="none" stroke-linecap="round"/>' +
        '<path d="M38 104 C60 92 82 78 70 62 C58 48 50 40 60 22" stroke="#efd8a6" stroke-width="13" fill="none" stroke-linecap="round"/>' +
        steps + star5(62, 18, 10, 4.2, '#f5c443', Sf) +
        '<path d="M30 40 q-6 -10 2 -18 q8 8 -2 18 Z M88 52 q8 -8 16 -2 q-8 8 -16 2 Z" fill="#5aa84e" ' + Sf + '/>';
    },
    humildad: function(c) {            // a violet, the little flower of humility
      var a = uid('vg'), petals = '';
      [[-90, 13], [-18, 12], [54, 12], [126, 12], [198, 12]].forEach(function(p) {
        var ang = p[0] * Math.PI / 180, x = 60 + Math.cos(ang) * p[1], y = 50 + Math.sin(ang) * p[1];
        petals += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="10" ry="12" transform="rotate(' + (p[0] + 90) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="url(#' + a + ')" ' + S + '/>';
      });
      return '<defs>' + rad(a, '#b79af0', '#6a3fb8') + '</defs>' +
        '<path d="M60 62 Q58 80 62 98" stroke="#3d8a3a" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M60 84 C46 84 38 76 38 66 C50 66 58 72 60 84 Z M62 90 C74 90 84 82 84 72 C72 72 64 78 62 90 Z" fill="#5aa84e" ' + S + '/>' +
        petals + '<circle cx="60" cy="50" r="5" fill="#f5c443" ' + Sf + '/>';
    },
    diligencia: function(c) {          // a bee at its honeycomb
      var a = uid('vg'), comb = '';
      [[42, 48], [58, 48], [50, 62], [34, 62], [66, 62], [42, 76], [58, 76]].forEach(function(p) {
        var h = [];
        for (var i = 0; i < 6; i++) { var ang = Math.PI / 6 + i * Math.PI / 3; h.push((p[0] + Math.cos(ang) * 9).toFixed(1) + ' ' + (p[1] + Math.sin(ang) * 9).toFixed(1)); }
        comb += '<path d="M' + h.join(' L') + ' Z" fill="url(#' + a + ')" ' + Sf + '/>';
      });
      return '<defs>' + lin(a, '#ffd45a', '#e09a1a') + '</defs>' + comb +
        '<g transform="translate(82 36) rotate(-20)">' +
        '<ellipse cx="-6" cy="-10" rx="8" ry="6" fill="#eaf4fb" ' + Sf + ' opacity="0.95"/><ellipse cx="6" cy="-10" rx="8" ry="6" fill="#eaf4fb" ' + Sf + ' opacity="0.95"/>' +
        '<ellipse cx="0" cy="0" rx="13" ry="9" fill="#f5c443" ' + S + '/>' +
        '<path d="M-4 -8 V8 M4 -8 V8" stroke="' + OL + '" stroke-width="3"/>' +
        '<circle cx="-14" cy="-1" r="5" fill="' + OL + '"/></g>';
    },
    dominio: function(c) {             // a still lake under the Andes
      var a = uid('vg'), b = uid('vg');
      return '<defs>' + lin(a, '#c7dbe9', '#7f9cb8') + lin(b, '#7cc0e0', '#3a7fae') + '</defs>' +
        '<path d="M20 72 L46 34 L58 50 L72 30 L100 72 Z" fill="url(#' + a + ')" ' + S + '/>' +
        '<path d="M46 34 L40 44 L46 42 L50 46 Z M72 30 L66 40 L72 38 L77 43 Z" fill="#fff"/>' +
        '<path d="M18 72 H102 Q100 92 60 94 Q20 92 18 72 Z" fill="url(#' + b + ')" ' + S + '/>' +
        '<path d="M34 80 h18 M62 84 h22 M44 88 h12" stroke="#d8f0fb" stroke-width="2.4" stroke-linecap="round"/>';
    }
  };

  function virtue(id, label, opts) {
    var f = EMBLEMS[id];
    if (!f) return '';
    var c = (typeof ExamenData !== 'undefined' && ExamenData.virtue(id)) ? ExamenData.virtue(id).color : '#7a6a4f';
    var a = uid('vm'), b = uid('vm');
    var body = '<defs>' + rad(a, shade(c, 0.86), shade(c, 0.62), '45%', '35%', '70%') + lin(b, '#f6d77a', '#b8861e') + '</defs>' +
      '<circle cx="60" cy="60" r="56" fill="url(#' + b + ')" stroke="' + OL + '" stroke-width="2"/>' +
      '<circle cx="60" cy="60" r="49" fill="url(#' + a + ')" stroke="' + shade(c, -0.25) + '" stroke-width="2"/>' +
      '<circle cx="60" cy="60" r="44" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.6" stroke-dasharray="2 4"/>' +
      '<g transform="translate(0 2)">' + f(c) + '</g>';
    return svg('0 0 120 120', body, 'ex-medal' + (opts && opts.cls ? ' ' + opts.cls : ''), label);
  }

  // ── Scenes ──────────────────────────────────────────────────────
  // Stars twinkle unless the kid's device asks for reduced motion (CSS).
  function _stars(list, cls) {
    return list.map(function(p, i) { return '<g class="' + (cls || 'ex-twinkle') + '" style="animation-delay:' + (i * 0.37 % 2.4).toFixed(2) + 's">' + sparkle(p[0], p[1], p[2], p[3]) + '</g>'; }).join('');
  }
  function _andes(y, c1, c2, snow) {
    var a = uid('an');
    return '<defs>' + lin(a, c1, c2) + '</defs>' +
      '<path d="M0 ' + y + ' L40 ' + (y - 34) + ' L62 ' + (y - 18) + ' L98 ' + (y - 58) + ' L128 ' + (y - 30) + ' L150 ' + (y - 44) + ' L196 ' + (y - 8) + ' L232 ' + (y - 50) + ' L270 ' + (y - 22) +
        ' L300 ' + (y - 40) + ' L360 ' + (y - 4) + ' L360 ' + (y + 60) + ' L0 ' + (y + 60) + ' Z" fill="url(#' + a + ')"/>' +
      (snow ? '<path d="M98 ' + (y - 58) + ' L86 ' + (y - 44) + ' L96 ' + (y - 46) + ' L102 ' + (y - 40) + ' L110 ' + (y - 46) + ' Z M232 ' + (y - 50) + ' L220 ' + (y - 36) + ' L230 ' + (y - 38) + ' L238 ' + (y - 32) + ' L246 ' + (y - 38) + ' Z" fill="' + snow + '"/>' : '');
  }

  // The evening window: dusk over the Andes, a candle and the journal on the sill.
  function hero(label) {
    var sky = uid('sk'), glow = uid('gl'), wood = uid('wd'), wall = uid('wl'), moon = uid('mo');
    var s = '<defs>' +
      '<linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2a6b"/><stop offset="0.45" stop-color="#7a4a9a"/><stop offset="0.75" stop-color="#e57b6a"/><stop offset="1" stop-color="#f6c06a"/></linearGradient>' +
      '<radialGradient id="' + glow + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2b0" stop-opacity="0.9"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient>' + lin(wood, '#a8703e', '#6e4220') + lin(wall, '#f4e9dc', '#e6d5c2') + rad(moon, '#fffbe6', '#efd98a') +
      '<clipPath id="' + sky + 'c"><rect x="70" y="18" width="220" height="132" rx="4"/></clipPath>' +
      '</defs>';
    s += '<rect x="0" y="0" width="360" height="200" fill="url(#' + wall + ')"/>';
    // curtains
    s += '<path d="M44 6 Q60 70 50 186 L30 186 Q20 90 30 6 Z" fill="#8a4f8f" ' + Sf + '/><path d="M316 6 Q300 70 310 186 L330 186 Q340 90 330 6 Z" fill="#8a4f8f" ' + Sf + '/>';
    s += '<path d="M10 4 H350" stroke="#6e4220" stroke-width="5" stroke-linecap="round"/>';
    // the window
    s += '<rect x="64" y="12" width="232" height="144" rx="6" fill="url(#' + wood + ')" ' + S + '/>';
    s += '<g clip-path="url(#' + sky + 'c)"><rect x="70" y="18" width="220" height="132" fill="url(#' + sky + ')"/>' +
      _stars([[96, 34, 3.5], [132, 52, 2.5], [170, 30, 3], [214, 46, 2.2], [262, 30, 3.2], [118, 70, 2], [246, 64, 2]]) +
      '<path d="M236 40 A16 16 0 1 0 252 62 A12 12 0 1 1 236 40 Z" fill="url(#' + moon + ')" ' + Sf + '/>' +
      _andes(150, '#4b3f78', '#2b2550', '#e9e4f5') +
      '<path d="M70 150 Q130 132 180 142 Q230 132 290 148 L290 150 L70 150 Z" fill="#231e44"/>' +
      '<rect x="120" y="124" width="7" height="6" fill="#ffd56a"/><rect x="150" y="130" width="6" height="5" fill="#ffd56a"/><rect x="214" y="126" width="6" height="5" fill="#ffd56a"/>' +
      '</g>';
    s += '<path d="M180 18 V150 M70 84 H290" stroke="#6e4220" stroke-width="6"/>';
    // sill
    s += '<rect x="52" y="152" width="256" height="14" rx="3" fill="url(#' + wood + ')" ' + S + '/>';
    // candle with glow
    s += '<circle cx="110" cy="128" r="34" fill="url(#' + glow + ')"/>' +
      '<rect x="102" y="126" width="16" height="28" rx="2" fill="#fbf4e4" ' + S + '/>' +
      '<path d="M110 126 v-5" stroke="' + OL + '" stroke-width="1.6"/>' +
      '<path class="ex-flame" d="M110 104 C104 112 104 120 110 122 C116 120 116 112 110 104 Z" fill="#ffb02e" stroke="#c96a12" stroke-width="1.2"/>' +
      '<path d="M110 111 C108 115 108 119 110 120 C112 119 112 115 110 111 Z" fill="#fff3b0"/>' +
      '<ellipse cx="110" cy="154" rx="14" ry="3" fill="#c9a24a" ' + Sf + '/>';
    // the open journal
    s += '<path d="M196 152 L198 132 Q220 126 238 134 Q256 126 278 132 L280 152 Q258 146 238 152 Q218 146 196 152 Z" fill="#fffaf0" ' + S + '/>' +
      '<path d="M238 134 V152" stroke="' + OL + '" stroke-width="1.4"/>' +
      '<path d="M204 138 q14 -3 28 1 M204 144 q14 -3 28 1 M244 139 q14 -4 28 -1" stroke="#c9bfd8" stroke-width="1.6" fill="none"/>' +
      heart(258, 145, 4) +
      '<g transform="rotate(-20 286 138)"><rect x="282" y="116" width="6" height="30" fill="#f5c443" ' + Sf + '/><path d="M282 146 L285 153 L288 146 Z" fill="#f3d2a2" ' + Sf + '/></g>';
    // a small rosary hanging from the window latch
    var beads = '';
    for (var i = 0; i < 9; i++) { var ang = Math.PI * (0.15 + i * 0.09); beads += '<circle cx="' + (180 + Math.cos(ang) * 20).toFixed(1) + '" cy="' + (88 + Math.sin(ang) * 20).toFixed(1) + '" r="2.3" fill="#8a4f2a" stroke="' + OL + '" stroke-width="0.8"/>'; }
    s += beads + '<path d="M178 110 v10 M174.5 113.5 h7" stroke="#c9a24a" stroke-width="2.4" stroke-linecap="round"/>';
    return svg('0 0 360 200', s, 'ex-scene', label);
  }

  // Good night: the moon over the hills, a house with one window lit.
  function night(label) {
    var sky = uid('nk'), moon = uid('nm'), hill = uid('nh'), halo = uid('nl');
    var s = '<defs>' + lin(sky, '#141a46', '#3b3778') + rad(moon, '#fffbe6', '#ecd27a') + lin(hill, '#2f4a3a', '#1c2e24') +
      '<radialGradient id="' + halo + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff1b8" stop-opacity="0.35"/><stop offset="1" stop-color="#fff1b8" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect x="0" y="0" width="360" height="200" fill="url(#' + sky + ')"/>';
    s += _stars([[30, 30, 3], [70, 60, 2], [110, 24, 3.4], [150, 50, 2.2], [196, 20, 2.6], [300, 34, 3], [330, 70, 2], [250, 70, 2.4], [20, 90, 2], [176, 84, 1.8]]);
    s += '<circle cx="270" cy="56" r="46" fill="url(#' + halo + ')"/>';
    s += '<path d="M262 24 A30 30 0 1 0 296 72 A24 24 0 1 1 262 24 Z" fill="url(#' + moon + ')" ' + Sf + '/>';
    s += _andes(150, '#3d3a6e', '#232048', '#cfcbe8');
    s += '<path d="M0 170 Q90 132 180 156 Q270 136 360 162 L360 200 L0 200 Z" fill="url(#' + hill + ')"/>';
    // house
    s += '<rect x="92" y="138" width="54" height="36" fill="#5a4a6a" ' + Sf + '/><path d="M84 142 L119 114 L154 142 Z" fill="#7a3a3a" ' + Sf + '/>' +
      '<rect x="104" y="148" width="12" height="12" fill="#ffd56a" ' + Sf + '/><path d="M110 148 v12 M104 154 h12" stroke="' + OL + '" stroke-width="1.1"/>' +
      '<rect x="126" y="152" width="11" height="22" fill="#3b2a3a" ' + Sf + '/>' +
      '<circle cx="110" cy="154" r="16" fill="#ffd56a" opacity="0.18"/>';
    // a cypress and a little cross on the hill (a chapel far away)
    s += '<path d="M220 156 Q212 130 222 104 Q232 130 224 156 Z" fill="#1c3a2a" ' + Sf + '/>' +
      '<path d="M306 140 v-14 M300 131 h12" stroke="#cfcbe8" stroke-width="2" stroke-linecap="round"/>';
    return svg('0 0 360 200', s, 'ex-scene', label);
  }

  // The four step candles: `lit` of them burning.
  function candles(lit, total, label) {
    total = total || 4;
    var s = '', w = 44, a = uid('cd'), g = uid('cg');
    s += '<defs>' + lin(a, '#fffaf0', '#e9dcc4', 1, 0) + '<radialGradient id="' + g + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff2b0" stop-opacity="0.9"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient>' + '</defs>';
    for (var i = 0; i < total; i++) {
      var x = 22 + i * w, on = i < lit;
      if (on) s += '<circle cx="' + x + '" cy="20" r="18" fill="url(#' + g + ')"/>';
      s += '<rect x="' + (x - 7) + '" y="26" width="14" height="' + (22 - i * 0) + '" rx="2" fill="url(#' + a + ')" ' + Sf + '/>';
      s += '<path d="M' + x + ' 26 v-4" stroke="' + OL + '" stroke-width="1.4"/>';
      s += on
        ? '<path class="ex-flame" d="M' + x + ' 6 C' + (x - 5) + ' 13 ' + (x - 5) + ' 19 ' + x + ' 21 C' + (x + 5) + ' 19 ' + (x + 5) + ' 13 ' + x + ' 6 Z" fill="#ffb02e" stroke="#c96a12" stroke-width="1"/><path d="M' + x + ' 12 C' + (x - 2) + ' 15 ' + (x - 2) + ' 18 ' + x + ' 19 C' + (x + 2) + ' 18 ' + (x + 2) + ' 15 ' + x + ' 12 Z" fill="#fff3b0"/>'
        : '<path d="M' + x + ' 20 q3 -5 0 -9 q-3 -4 1 -8" stroke="#b9b2c4" stroke-width="1.2" fill="none" opacity="0.7"/>';
      s += '<ellipse cx="' + x + '" cy="49" rx="11" ry="3" fill="#c9a24a" ' + Sf + '/>';
    }
    return svg('0 0 ' + (total * w) + ' 56', s, 'ex-candles', label);
  }

  return { tile: tile, icon: icon, virtue: virtue, hero: hero, night: night, candles: candles, ICONS: ICONS, EMBLEMS: EMBLEMS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ExamenArt;
