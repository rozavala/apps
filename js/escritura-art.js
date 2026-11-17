/* ================================================================
   ESCRITURA ART — js/escritura-art.js  (global EscrituraArt)
   Hand-built SVG: a school notebook and a yellow pencil, medals, and
   small pictures of letters and words drawn from the same stroke data
   the kid traces (js/escritura-data.js), so a tile always matches the
   practice sheet.
   ================================================================ */

var EscrituraArt = (function() {
  'use strict';

  var E = EscrituraEngine, D = EscrituraData;
  var uid = 0;
  function id(p) { uid++; return p + uid; }

  function poly(pts, dy) {
    var s = '';
    for (var i = 0; i < pts.length; i++) s += (i ? 'L' : 'M') + pts[i].x.toFixed(1) + ' ' + (-(pts[i].y) + (dy || 0)).toFixed(1);
    return s;
  }

  // The four school lines behind a letter, in unit space.
  function lines(x0, x1, dy) {
    dy = dy || 0;
    return '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + (-100 + dy) + '" y2="' + (-100 + dy) + '" stroke="#9fc1e3" stroke-width="2"/>' +
      '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + (-50 + dy) + '" y2="' + (-50 + dy) + '" stroke="#9fc1e3" stroke-width="1.6" stroke-dasharray="7 6"/>' +
      '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + dy + '" y2="' + dy + '" stroke="#e07a7a" stroke-width="2.4"/>' +
      '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + (50 + dy) + '" y2="' + (50 + dy) + '" stroke="#c9dbee" stroke-width="1.4"/>';
  }

  // Text in a style, as an SVG (strokes in graphite), sized to fit.
  //   o.lines: draw the school lines; o.color; o.weight (unit stroke width)
  function text(t, style, o) {
    o = o || {};
    var L = E.layout(t, D.font(style), { margin: 10, maxRow: o.maxRow || 1e9 });
    var W = Math.max(L.width, 40), H = L.rows * E.ROW_H;
    var top = o.tight ? 128 : E.ROW_TOP, h = o.tight ? 196 : H;
    var s = '<svg class="es-txt" viewBox="0 ' + (-top) + ' ' + W + ' ' + (o.tight ? h : H) + '" role="img" aria-label="' + String(o.label || t).replace(/"/g, '') + '">';
    if (o.lines) for (var r = 0; r < L.rows; r++) s += lines(0, W, r * E.ROW_H);
    var col = o.color || '#3a3d48', wt = o.weight || 6;
    L.strokes.forEach(function(st) {
      if (st.length < 3 && E.length(st) < 4) s += '<circle cx="' + st[0].x.toFixed(1) + '" cy="' + (-st[0].y).toFixed(1) + '" r="' + (wt * 0.8) + '" fill="' + col + '"/>';
      else s += '<path d="' + poly(st) + '" fill="none" stroke="' + col + '" stroke-width="' + wt + '" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    return s + '</svg>';
  }

  // A yellow school pencil, pointing down-left, in a 120 x 120 box.
  function pencil(x, y, sc, rot) {
    var g = id('pg');
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || -38) + ') scale(' + (sc || 1) + ')">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffd84d"/><stop offset=".45" stop-color="#f6b81c"/><stop offset="1" stop-color="#d98d0b"/></linearGradient></defs>' +
      // eraser and ferrule
      '<rect x="92" y="-8" width="16" height="16" rx="4" fill="#ef8f9b"/>' +
      '<rect x="80" y="-8.5" width="14" height="17" fill="#b9bcc4"/>' +
      '<path d="M83 -8.5v17M87 -8.5v17M91 -8.5v17" stroke="#8d919b" stroke-width="1"/>' +
      // body with its hexagon facets
      '<rect x="14" y="-8" width="67" height="16" fill="url(#' + g + ')"/>' +
      '<path d="M14 -2.5h67M14 2.5h67" stroke="#c98409" stroke-width=".8" opacity=".55"/>' +
      // sharpened wood and the graphite tip
      '<path d="M14 -8 L-6 0 L14 8 Z" fill="#f1cf9c"/>' +
      '<path d="M14 -8 Q10 -4 14 0 Q10 4 14 8" fill="none" stroke="#d9a964" stroke-width="1"/>' +
      '<path d="M-1.5 -1.9 L-6 0 L-1.5 1.9 Z" fill="#34363f"/>' +
    '</g>';
  }

  // The app's picture: an open notebook page with "Aa" written on the
  // school lines, and a pencil resting on it.
  function hero() {
    var A = E.layout('A', D.font('print'), { margin: 0 }), a = E.layout('a', D.font('cursive'), { margin: 0 });
    var ink = '';
    A.strokes.forEach(function(st) { ink += '<path d="' + poly(st) + '"/>'; });
    a.strokes.forEach(function(st) { ink += '<path d="' + poly(st.map(function(p) { return { x: p.x + 92, y: p.y }; })) + '"/>'; });
    var sh = id('sh');
    return '<svg viewBox="0 0 132 100" role="img" aria-label="Cuaderno y lápiz">' +
      '<defs><filter id="' + sh + '" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#1c1b29" flood-opacity=".18"/></filter></defs>' +
      '<g transform="rotate(-4 66 50)">' +
        '<rect x="8" y="10" width="112" height="80" rx="5" fill="#fffdf6" stroke="#e6e1d4" filter="url(#' + sh + ')"/>' +
        '<path d="M8 16h112" stroke="#e6e1d4"/>' +
        // spiral rings
        (function() { var s = ''; for (var i = 0; i < 9; i++) s += '<circle cx="' + (18 + i * 12) + '" cy="11" r="2.4" fill="none" stroke="#9aa0ab" stroke-width="1.4"/>'; return s; })() +
        '<line x1="22" y1="16" x2="22" y2="90" stroke="#f0a3a3" stroke-width="1"/>' +
        '<g transform="translate(30 70) scale(.38)">' + lines(-20, 230, 0) +
          '<g fill="none" stroke="#3a3d48" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">' + ink + '</g></g>' +
      '</g>' +
      pencil(100, 74, 0.62, -32) +
    '</svg>';
  }

  // Bronze, silver or gold for 1, 2 or 3 stars; a grey ring for none.
  function medal(n) {
    var c = [['#cbd5e1', '#94a3b8'], ['#e7b98a', '#b7793f'], ['#e5e7eb', '#9ca3af'], ['#fde68a', '#d29a12']][Math.max(0, Math.min(3, n))];
    var g = id('md');
    return '<svg viewBox="0 0 80 96" role="img" aria-label="' + n + ' / 3">' +
      '<defs><radialGradient id="' + g + '" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></radialGradient></defs>' +
      '<path d="M22 4h14l6 30h-14z" fill="#2563eb"/><path d="M44 4h14l-6 30h-14z" fill="#b91c1c"/>' +
      '<circle cx="40" cy="60" r="30" fill="url(#' + g + ')" stroke="' + c[1] + '" stroke-width="2"/>' +
      '<circle cx="40" cy="60" r="22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>' +
      '<g transform="translate(40 60) scale(.5)">' + pencilMark() + '</g>' +
    '</svg>';
  }
  function pencilMark() {
    return '<path d="M-20 18 L14 -16 L22 -8 L-12 26 Z" fill="#fff" fill-opacity=".85"/><path d="M-20 18 L-24 30 L-12 26" fill="#fff" fill-opacity=".85"/>';
  }

  // Small icons (24 x 24)
  function icon(name) {
    var p = {
      play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
      redo: '<path d="M5 12a7 7 0 1 0 2.3-5.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4 4.5v5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      undo: '<path d="M9 7 4 12l5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 12H14a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
      check: '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
      speak: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      back: '<path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      next: '<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      ear: '<path d="M8 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M11 9.5a2 2 0 0 1 4 0c0 1.2-1.4 1.6-1.4 2.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    }[name] || '';
    return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' + p + '</svg>';
  }

  return { hero: hero, medal: medal, text: text, lines: lines, pencil: pencil, icon: icon, poly: poly };
})();
