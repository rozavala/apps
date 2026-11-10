/* ================================================================
   ÁRBOL FAMILIAR — hand-built SVG art (js/arbol-art.js)

   ArbolArt.person(kind, tone)     a head-and-shoulders portrait on a 100x100 grid, as
                                   SVG markup for inside an <svg viewBox="0 0 100 100">
                                   kind 'child' | 'adult' | 'elder' | 'unknown'
   ArbolArt.portrait(kind, tone, px)   the same, as a complete <svg> string
   ArbolArt.hero(w)                the big tree for the home screen (a trunk with roots,
                                   a leafy crown and little family portraits in the branches)
   ArbolArt.icon(px)               a small tree for the header
   ArbolArt.TONES                  one soft colour pair per generation, nearest first

   No photos and no text from the tree are used here, so nothing needs escaping.
   Portraits are silhouettes: neutral on purpose (they say nothing about who a person is),
   with a different build for a child, an adult and an elder.
   ================================================================ */
var ArbolArt = (function() {
  'use strict';

  // [card fill, silhouette fill, edge] by generation: you, parents, grandparents...
  var TONES = [
    ['#fff3d6', '#c9892b', '#e0b25e'],
    ['#e3f4e6', '#3f8f5a', '#8ec9a0'],
    ['#dcf1ef', '#1f8a85', '#7cc7c2'],
    ['#e1ecfa', '#3d6fb3', '#92b4e0'],
    ['#ebe4f7', '#6b52a8', '#b5a3de'],
    ['#f8e3ea', '#b0476b', '#e3a5bb'],
    ['#efe9de', '#8a6b43', '#cdb893']
  ];

  function hairFill(kind) { return kind === 'elder' ? '#d9d6d0' : '#4a3a2e'; }

  // Markup for the portrait inside a 100x100 box. The background disc is the caller's.
  function person(kind, tone) {
    var c = tone || '#3f8f5a', s = '';
    if (kind === 'unknown') {
      return '<path d="M26 100 C26 74 38 64 50 64 C62 64 74 74 74 100 Z" fill="none" stroke="' + c + '" stroke-width="3" stroke-dasharray="5 5" opacity=".55"/>' +
             '<circle cx="50" cy="40" r="17" fill="none" stroke="' + c + '" stroke-width="3" stroke-dasharray="5 5" opacity=".55"/>' +
             '<text x="50" y="48" text-anchor="middle" font-size="24" font-weight="800" fill="' + c + '" opacity=".6">?</text>';
    }
    if (kind === 'child') {
      s = '<path d="M24 100 C24 78 36 70 50 70 C64 70 76 78 76 100 Z" fill="' + c + '"/>' +
          '<circle cx="50" cy="46" r="20" fill="' + c + '"/>' +
          '<path d="M30 42 C30 26 42 22 50 22 C60 22 70 28 70 42 C64 34 56 32 50 32 C42 32 36 34 30 42 Z" fill="' + hairFill(kind) + '"/>';
      return s;
    }
    s = '<path d="M16 100 C16 72 34 62 50 62 C66 62 84 72 84 100 Z" fill="' + c + '"/>' +
        '<circle cx="50" cy="38" r="18" fill="' + c + '"/>';
    if (kind === 'elder') {
      s += '<path d="M31 36 C31 20 41 18 50 18 C59 18 69 22 69 36 C64 28 57 26 50 26 C43 26 36 28 31 36 Z" fill="' + hairFill(kind) + '"/>' +
           '<path d="M42 40 h6 M52 40 h6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>';
    } else {
      s += '<path d="M31 36 C31 19 42 17 50 17 C60 17 69 21 69 36 C64 27 57 25 50 25 C43 25 36 27 31 36 Z" fill="' + hairFill(kind) + '"/>';
    }
    return s;
  }

  function portrait(kind, tone, px) {
    var t = TONES[0], bg = '#fff3d6';
    var fill = tone || '#3f8f5a';
    return '<svg class="ar-portrait" viewBox="0 0 100 100" width="' + (px || 64) + '" height="' + (px || 64) + '" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="48" fill="' + bg + '"/>' +
      '<clipPath id="arp' + (++uid) + '"><circle cx="50" cy="50" r="48"/></clipPath>' +
      '<g clip-path="url(#arp' + uid + ')">' + person(kind, fill) + '</g></svg>';
  }
  var uid = 0;

  function icon(px) {
    px = px || 34;
    return '<svg viewBox="0 0 48 48" width="' + px + '" height="' + px + '" aria-hidden="true">' +
      '<path d="M22 44 L22 30 Q22 26 19 24 L14 20 M26 44 L26 28 Q26 25 30 23 L35 19 M24 44 L24 18" stroke="#7a5535" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="24" cy="14" r="9" fill="#4aa56a"/><circle cx="13" cy="19" r="7" fill="#3f8f5a"/><circle cx="35" cy="18" r="7.5" fill="#56b176"/>' +
      '<circle cx="19" cy="11" r="2.4" fill="#d99a2b"/><circle cx="30" cy="14" r="2.2" fill="#d99a2b"/><circle cx="12" cy="20" r="2" fill="#d99a2b"/>' +
      '<path d="M10 44 H38" stroke="#7a5535" stroke-width="2.6" stroke-linecap="round"/></svg>';
  }

  // The home screen's tree. A fixed picture: roots, trunk, crown, a small family in the branches.
  function hero(w) {
    var cards = [
      [78, 74, 'elder', 4], [214, 58, 'adult', 2], [352, 74, 'elder', 3],
      [136, 128, 'adult', 1], [296, 128, 'adult', 1], [216, 170, 'child', 0]
    ];
    var out = '<svg class="ar-hero" viewBox="0 0 430 300" width="' + (w || 430) + '" role="img" aria-label="A family tree with portraits in its branches">';
    out += '<defs><linearGradient id="arSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3d8"/><stop offset="1" stop-color="#eaf5e3"/></linearGradient>' +
           '<linearGradient id="arHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcf93"/><stop offset="1" stop-color="#5eaa72"/></linearGradient></defs>';
    out += '<rect width="430" height="300" rx="22" fill="url(#arSky)"/>';
    out += '<circle cx="372" cy="46" r="24" fill="#f7cf63" opacity=".9"/><circle cx="372" cy="46" r="34" fill="#f7cf63" opacity=".22"/>';
    out += '<path d="M0 252 C70 226 140 238 215 246 C300 254 360 230 430 244 V300 H0 Z" fill="url(#arHill)"/>';
    // roots and trunk
    out += '<path d="M196 262 C186 270 168 270 152 276 M234 262 C246 270 266 270 284 276 M215 264 C214 274 210 282 206 290" stroke="#6f4d2f" stroke-width="7" fill="none" stroke-linecap="round"/>';
    out += '<path d="M192 266 C198 240 202 214 200 184 C198 168 190 154 176 140 L184 134 C200 146 208 156 212 168 C214 150 216 134 216 112 L226 112 C226 134 228 150 230 168 C236 154 246 142 262 132 L268 140 C250 154 240 168 238 188 C236 214 240 242 246 266 Z" fill="#8a6540"/>';
    out += '<path d="M205 180 C206 210 204 240 200 262" stroke="#6f4d2f" stroke-width="3" fill="none" opacity=".5"/>';
    // crown: layered leafy blobs
    var crown = [[215, 92, 70, '#4aa56a'], [140, 108, 52, '#3f8f5a'], [292, 108, 54, '#3f8f5a'], [88, 124, 36, '#56b176'], [342, 126, 38, '#56b176'],
                 [180, 64, 48, '#56b176'], [256, 62, 50, '#4aa56a'], [215, 40, 40, '#5fbb7e'], [120, 78, 34, '#4aa56a'], [316, 80, 34, '#4aa56a']];
    crown.forEach(function(c) { out += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + c[3] + '"/>'; });
    // leaves' highlights
    [[160, 70], [250, 52], [300, 100], [110, 108], [215, 118], [190, 100], [330, 130]].forEach(function(p) {
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#7fd09a" opacity=".5"/>';
    });
    // little portraits hanging in the crown
    cards.forEach(function(c) {
      var x = c[0], y = c[1], tone = TONES[c[3]];
      out += '<g transform="translate(' + (x - 29) + ' ' + (y - 34) + ')">' +
        '<rect width="58" height="68" rx="10" fill="' + tone[0] + '" stroke="' + tone[2] + '" stroke-width="2"/>' +
        '<g transform="translate(5 3) scale(.48)">' + person(c[2], tone[1]) + '</g>' +
        '<rect x="9" y="52" width="40" height="5" rx="2.5" fill="' + tone[1] + '" opacity=".45"/>' +
        '<rect x="14" y="60" width="30" height="3.5" rx="1.75" fill="' + tone[1] + '" opacity=".25"/></g>';
    });
    // a few birds and fallen leaves
    out += '<path d="M60 30 q6 -6 12 0 q6 -6 12 0" stroke="#5b5a6a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
           '<path d="M330 22 q5 -5 10 0 q5 -5 10 0" stroke="#5b5a6a" stroke-width="2" fill="none" stroke-linecap="round"/>';
    out += '<ellipse cx="130" cy="262" rx="7" ry="3.5" fill="#d99a2b" opacity=".8"/><ellipse cx="318" cy="268" rx="6" ry="3" fill="#c9892b" opacity=".8"/>';
    return out + '</svg>';
  }

  return { person: person, portrait: portrait, hero: hero, icon: icon, TONES: TONES };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ArbolArt;
