/* ================================================================
   DICTADO — dictado-art.js
   Hand-built SVG for Dictado: a ruled notebook with a pencil, the
   speaker and turtle buttons, keyboard and paper icons, a medal.
   Every function returns an SVG string; nothing here touches the DOM.
   ================================================================ */

var DictadoArt = (function() {
  'use strict';

  var uid = 0;
  function id(p) { return 'dk-' + p + (++uid); }

  // The notebook page with a pencil across it and sound waves leaving
  // a speaker: "listen, then write".
  function hero() {
    var g = id('pg'), w = id('wd');
    var lines = '';
    for (var y = 34; y <= 94; y += 12) lines += '<path d="M52 ' + y + 'h82" stroke="#b9d2ee" stroke-width="1.6"/>';
    return '<svg viewBox="0 0 170 120" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffefa"/><stop offset="1" stop-color="#f6f0df"/></linearGradient>' +
        '<linearGradient id="' + w + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7bd34"/><stop offset=".5" stop-color="#ffd35a"/><stop offset="1" stop-color="#e8a117"/></linearGradient>' +
      '</defs>' +
      '<ellipse cx="88" cy="110" rx="62" ry="6" fill="#1e1b4b" opacity=".10"/>' +
      '<g transform="rotate(-4 90 62)">' +
        '<rect x="40" y="12" width="104" height="94" rx="7" fill="url(#' + g + ')" stroke="#cfc7b0" stroke-width="2"/>' +
        lines +
        '<path d="M64 14v90" stroke="#ef9a9a" stroke-width="1.8"/>' +
        '<g fill="#8b93a7"><circle cx="40" cy="26" r="3.4"/><circle cx="40" cy="48" r="3.4"/><circle cx="40" cy="70" r="3.4"/><circle cx="40" cy="92" r="3.4"/></g>' +
        '<path d="M70 32q4-6 8 0t8 0 8 0 8 0" fill="none" stroke="#3b3f8f" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M70 56q4-6 8 0t8 0 8 0" fill="none" stroke="#3b3f8f" stroke-width="2.6" stroke-linecap="round"/>' +
      '</g>' +
      // pencil
      '<g transform="translate(118 70) rotate(-38)">' +
        '<rect x="-6" y="-48" width="12" height="62" rx="2" fill="url(#' + w + ')"/>' +
        '<path d="M-2 -48v62" stroke="#e8a117" stroke-width="1.2" opacity=".7"/>' +
        '<rect x="-6" y="-56" width="12" height="9" rx="3" fill="#f08ca0"/>' +
        '<rect x="-6" y="-48" width="12" height="5" fill="#c9ced6"/>' +
        '<path d="M-6 14L0 30L6 14z" fill="#f1d1a0"/>' +
        '<path d="M-2.2 24.5L0 30L2.2 24.5z" fill="#3d3d4a"/>' +
      '</g>' +
      // speaker with waves
      '<g transform="translate(6 26)">' +
        '<path d="M2 18h9l12-10v38L11 36H2z" fill="#6366f1"/>' +
        '<path d="M2 18h9l12-10v38L11 36H2z" fill="none" stroke="#4338ca" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M30 17q9 10 0 20" fill="none" stroke="#818cf8" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M36 10q15 17 0 34" fill="none" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      '</svg>';
  }

  // Small icons: drawn with currentColor so a button can set the colour.
  function speaker() {
    return '<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<path d="M5 12h6l8-7v22l-8-7H5z" fill="currentColor"/>' +
      '<path d="M23 11q5 5 0 10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M26.5 7q8 9 0 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity=".6"/></svg>';
  }
  function turtle() {
    return '<svg viewBox="0 0 36 32" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<ellipse cx="9" cy="26" rx="3.6" ry="2.4" fill="#3f8a4f"/><ellipse cx="24" cy="26" rx="3.6" ry="2.4" fill="#3f8a4f"/>' +
      '<path d="M29 21q5 1 6 4q-4 0-6-1z" fill="#3f8a4f"/>' +
      '<path d="M5 23q0-13 14-13t14 13z" fill="#4fa860" stroke="#2f7040" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M12 22l2-6h8l2 6M14 16l-1.5-4M22 16l1.5-4M18 16v6" fill="none" stroke="#2f7040" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="3.6" cy="19.5" rx="3.6" ry="3.2" fill="#6bc17b" stroke="#2f7040" stroke-width="1.2"/>' +
      '<circle cx="2.7" cy="18.7" r=".9" fill="#1f3d28"/></svg>';
  }
  function keyboard() {
    var keys = '';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) keys += '<rect x="' + (5 + c * 4.4) + '" y="' + (9 + r * 4.6) + '" width="3.2" height="3" rx=".7"/>';
    return '<svg viewBox="0 0 36 28" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<rect x="1.5" y="4" width="33" height="20" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<g fill="currentColor">' + keys + '</g></svg>';
  }
  function paper() {
    return '<svg viewBox="0 0 36 32" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<rect x="4" y="3" width="22" height="26" rx="2.6" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M9 11h12M9 16h12M9 21h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M32 9l-13 13-1 4 4-1 13-13z" fill="#f5b82e" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  function backspace() {
    return '<svg viewBox="0 0 32 24" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<path d="M10 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H10L2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M16 8l8 8M24 8l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function shift(on) {
    return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<path d="M12 3l9 10h-5.5v7h-7v-7H3z" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  }
  function tick() {
    return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function bulb() {
    return '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.7.6 1.1 1.4 1.1 2.2V18h5.4v-1.5c0-.8.4-1.6 1.1-2.2A6.5 6.5 0 0 0 12 2.5z" fill="#fde68a" stroke="#d97706" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M9.5 20.5h5M10.5 22.5h3" stroke="#d97706" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }

  // The medal at the end of a round: n of 3 stars lit.
  function medal(n) {
    var star = function(cx, cy, r, on) {
      var p = '';
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
        p += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
      }
      return '<path d="' + p + 'Z" fill="' + (on ? '#f5b82e' : '#e5e7eb') + '" stroke="' + (on ? '#c98a0b' : '#cbd5e1') + '" stroke-width="1.4" stroke-linejoin="round"/>';
    };
    var g = id('md');
    return '<svg viewBox="0 0 150 120" width="100%" height="100%" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="' + g + '" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff3c4"/><stop offset=".6" stop-color="#f7cf62"/><stop offset="1" stop-color="#d9a21f"/></radialGradient></defs>' +
      '<path d="M52 8l14 40h18L98 8z" fill="#6366f1"/><path d="M66 48l9 14 9-14z" fill="#4338ca"/>' +
      '<circle cx="75" cy="76" r="34" fill="url(#' + g + ')" stroke="#c98a0b" stroke-width="2.4"/>' +
      '<circle cx="75" cy="76" r="27" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>' +
      star(57, 80, 9, n >= 1) + star(75, 69, 12, n >= 2) + star(93, 80, 9, n >= 3) +
      '</svg>';
  }

  var api = { hero: hero, speaker: speaker, turtle: turtle, keyboard: keyboard, paper: paper, backspace: backspace, shift: shift, tick: tick, bulb: bulb, medal: medal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DictadoArt = api;
  return api;
})();
