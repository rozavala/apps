/* ================================================================
   ART STUDIO — drawn art (inline SVG, no images)
   Tool rack icons (real-looking pencils, crayons, brushes...), tab
   icons, the studio logo and lesson thumbnails built from a lesson's
   own guide lines.
   ================================================================ */

var ArtArt = (function () {
  'use strict';

  var _id = 0;
  function uid(p) { _id++; return (p || 'a') + _id; }

  function rgb(hex) { return ArtBrush.hexToRgb(hex); }
  function hx(c) { return ArtBrush.rgbToHex(c); }
  function lighten(hex, f) { return hx(ArtBrush.shade(rgb(hex), f)); }
  function darken(hex, f) { return hx(ArtBrush.shade(rgb(hex), -f)); }
  function safeHex(h) { return /^#[0-9a-f]{6}$/i.test(h) ? h : '#333333'; }

  // A vertical cylinder gradient for a coloured body.
  function cyl(id, hex) {
    return '<linearGradient id="' + id + '" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="' + darken(hex, 0.32) + '"/>' +
      '<stop offset="0.22" stop-color="' + lighten(hex, 0.28) + '"/>' +
      '<stop offset="0.42" stop-color="' + hex + '"/>' +
      '<stop offset="0.85" stop-color="' + darken(hex, 0.22) + '"/>' +
      '<stop offset="1" stop-color="' + darken(hex, 0.4) + '"/></linearGradient>';
  }
  function metal(id) {
    return '<linearGradient id="' + id + '" x1="0" x2="1">' +
      '<stop offset="0" stop-color="#7d8288"/><stop offset="0.25" stop-color="#f4f6f8"/>' +
      '<stop offset="0.5" stop-color="#b9bec4"/><stop offset="0.8" stop-color="#8b9096"/><stop offset="1" stop-color="#5d6166"/></linearGradient>';
  }
  function wood(id, a, b) {
    return '<linearGradient id="' + id + '" x1="0" x2="1">' +
      '<stop offset="0" stop-color="' + darken(a, 0.25) + '"/><stop offset="0.3" stop-color="' + lighten(a, 0.15) + '"/>' +
      '<stop offset="0.7" stop-color="' + a + '"/><stop offset="1" stop-color="' + (b || darken(a, 0.35)) + '"/></linearGradient>';
  }

  // Tools stand tip-up in a 48 x 140 box.
  var TOOLS = {
    pencil: function (c) {
      var g = uid('pb'), w = uid('pw');
      return '<defs>' + cyl(g, c) + wood(w, '#f0cf9e', '#c99a5d') + '</defs>' +
        // painted hexagonal barrel with three facets
        '<rect x="14" y="44" width="20" height="100" fill="url(#' + g + ')"/>' +
        '<rect x="19.5" y="44" width="1.1" height="100" fill="' + darken(c, 0.35) + '" opacity="0.35"/>' +
        '<rect x="27.4" y="44" width="1.1" height="100" fill="' + darken(c, 0.35) + '" opacity="0.35"/>' +
        // sharpened wood with the scalloped paint edge
        '<path d="M14 46 L24 8 L34 46 Q31.5 41 29 46 Q26.5 41 24 46 Q21.5 41 19 46 Q16.5 41 14 46Z" fill="url(#' + w + ')"/>' +
        '<path d="M24 8 L21 19 Q24 21 27 19Z" fill="' + darken(c, 0.15) + '"/>' +
        '<path d="M24 8 L22.6 13.2 Q24 14 25.4 13.2Z" fill="' + darken(c, 0.45) + '"/>' +
        '<path d="M15.5 44 L22 18" stroke="#fff" stroke-opacity="0.35" stroke-width="1"/>';
    },
    crayon: function (c) {
      var g = uid('cb'), p = uid('cp');
      var paper = lighten(c, 0.62);
      return '<defs>' + cyl(g, c) + cyl(p, paper) + '</defs>' +
        '<path d="M12 40 Q13 22 19 14 Q24 9 29 14 Q35 22 36 40Z" fill="url(#' + g + ')"/>' +
        '<path d="M19 14 Q24 9 29 14 Q26 12.5 24 12.6 Q21 12.6 19 14Z" fill="' + darken(c, 0.3) + '" opacity="0.5"/>' +
        '<rect x="12" y="38" width="24" height="106" fill="url(#' + g + ')"/>' +
        // paper wrapper with printed bands
        '<rect x="12" y="56" width="24" height="88" fill="url(#' + p + ')"/>' +
        '<rect x="12" y="62" width="24" height="3" fill="' + darken(c, 0.1) + '"/>' +
        '<rect x="12" y="68" width="24" height="1.2" fill="' + darken(c, 0.1) + '"/>' +
        '<path d="M12 84 Q18 80 24 84 T36 84" stroke="' + c + '" stroke-width="2" fill="none"/>' +
        '<rect x="12" y="124" width="24" height="1.2" fill="' + darken(c, 0.1) + '"/>' +
        '<rect x="12" y="128" width="24" height="3" fill="' + darken(c, 0.1) + '"/>' +
        '<path d="M12 56 L14 54 L16 56 L18 54 L20 56 L22 54 L24 56 L26 54 L28 56 L30 54 L32 56 L34 54 L36 56" fill="none" stroke="' + darken(paper, 0.15) + '" stroke-width="0.8"/>';
    },
    chalk: function (c) {
      var g = uid('kb');
      var specks = '';
      var r = ArtBrush.rng(9);
      for (var i = 0; i < 26; i++) specks += '<circle cx="' + (14 + r() * 20).toFixed(1) + '" cy="' + (22 + r() * 118).toFixed(1) + '" r="' + (0.3 + r() * 0.7).toFixed(2) + '" fill="#fff" opacity="' + (0.2 + r() * 0.4).toFixed(2) + '"/>';
      return '<defs>' + cyl(g, lighten(c, 0.12)) + '</defs>' +
        '<path d="M13 144 L13 30 Q13 18 20 15 Q25 13 30 16 Q35 20 35 30 L35 144Z" fill="url(#' + g + ')"/>' +
        '<path d="M20 15 Q25 13 30 16 Q27 19 22 18Z" fill="#fff" opacity="0.35"/>' + specks +
        '<path d="M13 70 L35 72 M13 108 L35 106" stroke="' + darken(c, 0.15) + '" stroke-opacity="0.25" stroke-width="0.8"/>';
    },
    marker: function (c) {
      var b = uid('mb'), m = uid('mm'), cap = uid('mc');
      return '<defs>' + cyl(b, '#f3f3f5') + cyl(m, '#9a9ca3') + cyl(cap, c) + '</defs>' +
        '<rect x="11" y="52" width="26" height="92" rx="4" fill="url(#' + b + ')"/>' +
        '<rect x="11" y="70" width="26" height="22" fill="url(#' + cap + ')"/>' +
        '<rect x="11" y="128" width="26" height="16" fill="url(#' + cap + ')"/>' +
        '<path d="M13 54 L18 30 L30 30 L35 54Z" fill="url(#' + m + ')"/>' +
        '<path d="M20 30 L21 16 Q24 8 27 16 L28 30Z" fill="' + c + '"/>' +
        '<path d="M21.5 28 L22 17 Q23 13 24 12" stroke="#fff" stroke-opacity="0.5" stroke-width="0.9" fill="none"/>';
    },
    watercolour: function (c) {
      var h = uid('wh'), f = uid('wf'), hair = uid('wr');
      return '<defs>' + wood(h, '#9b2424', '#4d0c0c') + metal(f) +
        '<linearGradient id="' + hair + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b8844a"/><stop offset="0.45" stop-color="#8d5c2e"/><stop offset="0.6" stop-color="' + darken(c, 0.1) + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient></defs>' +
        '<path d="M19.5 66 L28.5 66 L27 144 L21 144Z" fill="url(#' + h + ')"/>' +
        '<rect x="18" y="42" width="12" height="25" rx="1.5" fill="url(#' + f + ')"/>' +
        '<path d="M18 50 H30 M18 53 H30" stroke="#6c7075" stroke-width="0.6"/>' +
        '<path d="M18 43 Q14 30 24 4 Q34 30 30 43Z" fill="url(#' + hair + ')"/>' +
        '<path d="M21 36 Q20 24 24 8" stroke="#fff" stroke-opacity="0.45" stroke-width="1" fill="none"/>' +
        '<ellipse cx="24" cy="5" rx="1.6" ry="2.4" fill="' + c + '" opacity="0.8"/>';
    },
    oil: function (c) {
      var h = uid('oh'), f = uid('of'), paint = uid('op');
      return '<defs>' + wood(h, '#dcb37c', '#9a7446') + metal(f) +
        '<linearGradient id="' + paint + '" x1="0" x2="1"><stop offset="0" stop-color="' + darken(c, 0.25) + '"/><stop offset="0.35" stop-color="' + lighten(c, 0.3) + '"/><stop offset="1" stop-color="' + darken(c, 0.2) + '"/></linearGradient></defs>' +
        '<path d="M19 66 L29 66 L28 144 L20 144Z" fill="url(#' + h + ')"/>' +
        '<path d="M14 42 L34 42 L31 67 L17 67Z" fill="url(#' + f + ')"/>' +
        '<path d="M16 50 H32 M16.5 54 H31.5" stroke="#6c7075" stroke-width="0.6"/>' +
        // flat hog-bristle head
        '<path d="M14 43 L15 14 Q24 9 33 14 L34 43Z" fill="#e9dcbd"/>' +
        '<path d="M17 42 L17.5 16 M20 42 L20.5 14 M23 42 L23.5 13 M26 42 L26.5 13 M29 42 L29.5 14 M32 42 L32 16" stroke="#bfae86" stroke-width="0.6"/>' +
        // thick paint loaded on the tip
        '<path d="M14.6 26 L15 14 Q24 9 33 14 L33.4 26 Q30 29 27 26 Q24 30 21 26 Q18 29 14.6 26Z" fill="url(#' + paint + ')"/>' +
        '<path d="M18 16 Q22 13 27 14" stroke="#fff" stroke-opacity="0.55" stroke-width="1.2" fill="none"/>';
    },
    dots: function (c) {
      var h = uid('dh'), f = uid('df');
      return '<defs>' + wood(h, '#2c2b30', '#0e0e10') + metal(f) + '</defs>' +
        '<path d="M20 60 L28 60 L27 144 L21 144Z" fill="url(#' + h + ')"/>' +
        '<rect x="19" y="40" width="10" height="21" rx="1.5" fill="url(#' + f + ')"/>' +
        '<path d="M19 41 Q17 30 24 20 Q31 30 29 41Z" fill="#a2753f"/>' +
        '<path d="M19.6 33 Q19 26 24 20 Q29 26 28.4 33 Q24 35 19.6 33Z" fill="' + c + '"/>' +
        '<circle cx="10" cy="14" r="3.2" fill="' + c + '"/><circle cx="38" cy="10" r="2.6" fill="' + lighten(c, 0.2) + '"/>' +
        '<circle cx="35" cy="24" r="2" fill="' + darken(c, 0.15) + '"/><circle cx="12" cy="28" r="1.8" fill="' + lighten(c, 0.1) + '"/>';
    },
    eraser: function () {
      var s = uid('es'), b = uid('eb');
      return '<defs><linearGradient id="' + b + '" x1="0" x2="1"><stop offset="0" stop-color="#e7e2da"/><stop offset="0.3" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d3c9"/></linearGradient>' +
        cyl(s, '#2f6fb7') + '</defs>' +
        '<path d="M9 62 L9 34 Q9 26 17 26 L39 26 L39 62Z" fill="url(#' + b + ')"/>' +
        '<path d="M9 34 Q9 26 17 26 L22 26 Q12 28 11 40Z" fill="#fff"/>' +
        '<rect x="8" y="58" width="32" height="86" rx="2" fill="url(#' + s + ')"/>' +
        '<rect x="8" y="78" width="32" height="10" fill="#f2c230"/>' +
        '<rect x="8" y="94" width="32" height="1.6" fill="#fff" opacity="0.6"/>' +
        '<circle cx="12" cy="20" r="1.4" fill="#d9d3c9"/><circle cx="34" cy="17" r="1" fill="#d9d3c9"/><circle cx="26" cy="14" r="1.2" fill="#e5e0d8"/>';
    },
    fill: function (c) {
      var can = uid('fc');
      return '<defs>' + metal(can) + '</defs>' +
        '<path d="M7 64 L41 64 L39 140 Q24 146 9 140Z" fill="url(#' + can + ')"/>' +
        '<path d="M9 88 L39 88 L38.4 118 L9.6 118Z" fill="' + c + '"/>' +
        '<path d="M9 88 L39 88 L38.4 118 L9.6 118Z" fill="#fff" opacity="0.12"/>' +
        '<ellipse cx="24" cy="64" rx="17" ry="5" fill="' + darken(c, 0.2) + '" stroke="#8b9096" stroke-width="1.5"/>' +
        '<ellipse cx="22" cy="63" rx="9" ry="2" fill="' + lighten(c, 0.35) + '" opacity="0.6"/>' +
        '<path d="M34 66 Q36 76 34.5 84 Q33 88 31.6 84 Q30.8 76 31 67Z" fill="' + c + '"/>' +
        '<path d="M8 64 Q24 36 40 64" fill="none" stroke="#5d6166" stroke-width="1.6"/>';
    },
    shapes: function () {
      return '<path d="M7 142 L7 22 L43 142Z" fill="#7cc4f2" fill-opacity="0.45" stroke="#2f7fb8" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M14 128 L14 62 L33 128Z" fill="#fff" fill-opacity="0.75" stroke="#2f7fb8" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M7 40 h5 M7 50 h3 M7 60 h5 M7 70 h3 M7 80 h5 M7 90 h3 M7 100 h5 M7 110 h3 M7 120 h5 M7 130 h3" stroke="#1f5f8c" stroke-width="0.8"/>' +
        '<path d="M16 26 Q22 30 26 26" stroke="#fff" stroke-opacity="0.8" stroke-width="1.2" fill="none"/>';
    }
  };

  function tool(kind, hex) {
    var fn = TOOLS[kind] || TOOLS.pencil;
    return '<svg class="tool-svg" viewBox="0 0 48 144" aria-hidden="true" focusable="false">' + fn(safeHex(hex || '#333333')) + '</svg>';
  }

  // Small line icons (24 x 24) for tabs and buttons.
  var ICONS = {
    draw: '<path d="M4 20 L5.5 15 L16 4.5 a2 2 0 0 1 3 0 l0.5 0.5 a2 2 0 0 1 0 3 L9 18.5Z"/><path d="M14 6.5 l3.5 3.5"/>',
    learn: '<path d="M5 21 L9 9 M19 21 L15 9 M12 9 V21"/><rect x="5.5" y="3" width="13" height="7" rx="1"/><path d="M8.5 6.5 l2 -1.5 l2 1.5 l2.5 -2"/>',
    gallery: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><rect x="6.5" y="7.5" width="11" height="9"/><path d="M7 16 l3.5 -4 l2.5 2.5 l1.5 -1.5 l3 3"/>',
    master: '<path d="M7 20 h10 M9 20 v-2.5 c0 -1.5 -1.5 -2.5 -2 -4 c-0.6 -2 0.2 -4.5 1.5 -5.5 c0.5 -2.5 2 -4 3.8 -4 c2.6 0 4.2 2 4.2 4.6 c0 1.4 -0.5 2.2 -0.4 3.2 l1.4 2.2 h-1.5 v2 c0 1 -0.8 1.6 -2 1.6 h-1.2 v2.4"/>',
    undo: '<path d="M9 7 L4 11 L9 15"/><path d="M4 11 H14 a5.5 5.5 0 0 1 0 11 H10"/>',
    redo: '<path d="M15 7 L20 11 L15 15"/><path d="M20 11 H10 a5.5 5.5 0 0 0 0 11 H14"/>',
    trash: '<path d="M4 7 H20 M9 7 V4.5 h6 V7 M6.5 7 l1 13 h9 l1 -13 M10 10.5 v6.5 M14 10.5 v6.5"/>',
    save: '<rect x="3" y="3" width="18" height="18" rx="1.2"/><rect x="6.5" y="6.5" width="11" height="11"/><path d="M12 1 v2 M9 1 h6"/>',
    zoomIn: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M7.5 10.5h6M10.5 7.5v6M15.5 15.5l5 5"/>',
    zoomOut: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M7.5 10.5h6M15.5 15.5l5 5"/>',
    hand: '<path d="M8 13 V5.5 a1.5 1.5 0 0 1 3 0 V11 M11 10.5 V4 a1.5 1.5 0 0 1 3 0 V11 M14 10.5 V5.5 a1.5 1.5 0 0 1 3 0 V13 c0 5 -2 8 -6 8 c-3 0 -4.5 -1.5 -6.5 -5 l-1.5 -3 a1.5 1.5 0 0 1 2.6 -1.4 L8 14"/>',
    mirror: '<path d="M12 3 V21" stroke-dasharray="2 2"/><path d="M10 6 L4 18 H10Z M14 6 L20 18 H14Z"/>',
    grid: '<rect x="3" y="3" width="18" height="18"/><path d="M9 3 V21 M15 3 V21 M3 9 H21 M3 15 H21"/>',
    trace: '<path d="M4 19 C8 6 16 6 20 19" stroke-dasharray="2.2 2"/><path d="M8 20 l3 -3 l2 2"/>',
    play: '<path d="M8 5 L19 12 L8 19Z"/>',
    line: '<path d="M4 20 L20 4"/>',
    rect: '<rect x="4" y="6" width="16" height="12"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
    check: '<path d="M4 12.5 L9.5 18 L20 6"/>',
    back: '<path d="M15 5 L8 12 L15 19"/>',
    close: '<path d="M6 6 L18 18 M18 6 L6 18"/>',
    mix: '<path d="M12 3 C6 3 2.5 7 2.5 11.5 C2.5 16 6 18 8.5 18 c1.6 0 1.6 -1.5 1.2 -2.5 c-0.6 -1.6 0.5 -2.8 2.2 -2.6 l3.2 0.3 C19 13.8 21.5 11.5 21.5 9 C21.5 5.5 17.5 3 12 3Z"/><circle cx="7" cy="10" r="1.3"/><circle cx="11" cy="7" r="1.3"/><circle cx="16" cy="7.5" r="1.3"/>',
    star: '<path d="M12 3 l2.7 5.6 6.1 0.8 -4.5 4.2 1.1 6.1 L12 16.8 6.6 19.7 7.7 13.6 3.2 9.4 9.3 8.6Z"/>'
  };
  function icon(name, cls) {
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  // Studio logo: a wooden palette with paint dabs and a brush.
  function logo() {
    var w = uid('lw');
    return '<svg class="as-logo" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="' + w + '" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#e9c48d"/><stop offset="1" stop-color="#b27a3e"/></radialGradient></defs>' +
      '<path d="M32 6 C15 6 4 17 4 31 C4 45 15 56 26 56 C31 56 32 52 30 48 C28 44 30 40 35 40 L42 40 C52 40 60 34 60 25 C60 14 48 6 32 6Z" fill="url(#' + w + ')" stroke="#8a5a2b" stroke-width="1.5"/>' +
      '<ellipse cx="20" cy="45" rx="5" ry="4" fill="#f1f1f4"/>' +
      '<circle cx="17" cy="25" r="5" fill="#D93A2B"/><circle cx="29" cy="16" r="5" fill="#F4D22B"/><circle cx="43" cy="17" r="5" fill="#2B3FA8"/><circle cx="50" cy="28" r="4.5" fill="#3F7D3A"/>' +
      '<circle cx="15.5" cy="23.5" r="1.5" fill="#fff" opacity="0.5"/><circle cx="27.5" cy="14.5" r="1.5" fill="#fff" opacity="0.5"/><circle cx="41.5" cy="15.5" r="1.5" fill="#fff" opacity="0.5"/>' +
      '<path d="M36 60 L56 34" stroke="#6b3b1b" stroke-width="3.5" stroke-linecap="round"/><path d="M55 35 L59 30" stroke="#c0c4c8" stroke-width="4" stroke-linecap="round"/><path d="M58.5 30.5 L62 25" stroke="#7a1f6b" stroke-width="3" stroke-linecap="round"/></svg>';
  }

  // Lesson thumbnail: the lesson's own guide lines inked in each
  // step's colour on a little sheet of paper.
  function lessonThumb(lesson) {
    var out = '';
    var steps = lesson.steps || [];
    if (lesson.id === 'mixing') {
      return '<svg viewBox="0 0 100 100" aria-hidden="true">' + _blob(30, 38, '#D93A2B') + _blob(70, 38, '#F4D22B') + _blob(50, 72, '#EE7A1E') +
        '<path d="M44 40 h12 M50 34 v12" stroke="#6b6878" stroke-width="2.4" stroke-linecap="round"/><path d="M50 52 v8" stroke="#6b6878" stroke-width="2.4" stroke-linecap="round"/></svg>';
    }
    steps.forEach(function (s) {
      if (s.type === 'pixelgrid') {
        var px = '';
        var heart = ['0011011000', '0111111100', '0111111100', '0011111000', '0001110000', '0000100000'];
        heart.forEach(function (row, y) { for (var x = 0; x < row.length; x++) if (row[x] === '1') px += '<rect x="' + (25 + x * 5) + '" y="' + (58 + y * 5) + '" width="5" height="5" fill="#D93A2B"/>'; });
        out += px;
      }
      if (!s.guide) return;
      var col = safeHex(s.color || '#3a3632');
      if (s.type === 'dots' || s.tool === 'dots') {
        out += '<path d="' + s.guide + '" fill="none" stroke="' + col + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 4.2"/>';
      } else if (s.check === 'fill' || s.tool === 'fill') {
        out += '<path d="' + s.guide + '" fill="' + col + '" stroke="none" opacity="0.9"/>';
      } else {
        var wdt = s.tool === 'oil' || s.tool === 'watercolour' || s.tool === 'line' ? 2.6 : 1.8;
        out += '<path d="' + s.guide + '" fill="none" stroke="' + col + '" stroke-width="' + wdt + '" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>';
      }
    });
    return '<svg viewBox="-4 -4 108 108" aria-hidden="true">' + out + '</svg>';
  }
  function _blob(x, y, c) {
    return '<path d="M' + (x - 13) + ' ' + y + ' C' + (x - 13) + ' ' + (y - 11) + ' ' + (x - 3) + ' ' + (y - 14) + ' ' + (x + 3) + ' ' + (y - 12) +
      ' C' + (x + 12) + ' ' + (y - 10) + ' ' + (x + 15) + ' ' + (y - 2) + ' ' + (x + 12) + ' ' + (y + 6) +
      ' C' + (x + 9) + ' ' + (y + 13) + ' ' + (x - 9) + ' ' + (y + 13) + ' ' + (x - 13) + ' ' + y + 'Z" fill="' + c + '"/>' +
      '<ellipse cx="' + (x - 4) + '" cy="' + (y - 5) + '" rx="4" ry="2.4" fill="#fff" opacity="0.45"/>';
  }

  return { tool: tool, icon: icon, logo: logo, lessonThumb: lessonThumb, uid: uid };
})();
