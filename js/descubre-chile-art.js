/* ================================================================
   DESCUBRE CHILE — hand-built SVG/canvas art
   • DCArt.mapSVG(opts)   – the relief map of Chile (from DC_GEO)
   • DCArt.relief(svg)    – paints the procedural hillshade into a map
   • DCArt.regionThumb()  – silhouette of one region
   • DCArt.banner(id)     – illustrated topic banners
   • DCArt.vignette(kind) – timeline / card vignettes
   Needs js/descubre-chile-data.js first. No network, no images.
   ================================================================ */
var DCArt = (function () {
  'use strict';
  var G = DC_GEO, K = G.K, W = G.W, H = G.H;
  var RAD = Math.PI / 180;
  var uid = 0;

  function P(lat, lon) {
    return [((lon - G.LON0) * Math.cos(lat * RAD) - G.X0) * K, (G.LATTOP - lat) * K];
  }
  function yOf(lat) { return (G.LATTOP - lat) * K; }
  function latOf(y) { return G.LATTOP - y / K; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function regionById(id) { for (var i = 0; i < DC_REGIONS.length; i++) if (DC_REGIONS[i].id === id) return DC_REGIONS[i]; return null; }
  function geoById(id) { for (var i = 0; i < G.regions.length; i++) if (G.regions[i].id === id) return G.regions[i]; return null; }

  // ── biome colours by latitude (natural-colour map) ──
  var BIOME = [
    [-17.2, '#ead3a4'], [-22, '#ebcf98'], [-26, '#e4c690'], [-29, '#d6c38e'], [-31.5, '#c2bd86'],
    [-33.5, '#aeb87b'], [-36, '#93b06d'], [-38.5, '#729e5d'], [-41, '#5c8f54'], [-44, '#578b57'],
    [-47, '#6b9568'], [-50, '#87a17d'], [-52.5, '#a3ab87'], [-56.2, '#a9af96']
  ];

  function stopsLat(list) {
    var span = G.LATTOP - (G.LATTOP - H / K);
    return list.map(function (s) {
      return '<stop offset="' + ((G.LATTOP - s[0]) / span).toFixed(4) + '" stop-color="' + s[1] + '"/>';
    }).join('');
  }

  // ── small symbol library (map POIs) ──
  function poiSymbol(k) {
    switch (k) {
      case 'volcano': return '<path d="M-7 5L-1.6-5.5h3.2L7 5z" fill="#8a5a3c" stroke="#4a2d1b" stroke-width=".8"/><path d="M-2.9-3 -1.6-5.5h3.2L2.9-3 1.4-2 0-3.1-1.3-2z" fill="#fff"/>';
      case 'lake': return '<ellipse rx="6" ry="3.6" fill="#5aa9d6" stroke="#1f6aa0" stroke-width=".9"/><path d="M-3-.6h3.5" stroke="#d6f0ff" stroke-width=".9" stroke-linecap="round"/>';
      case 'star': return '<path d="M0-6.5 1.7-2 6.4-2 2.6.9 4 5.6 0 2.8-4 5.6-2.6.9-6.4-2-1.7-2z" fill="#ffd54a" stroke="#8a5a00" stroke-width=".7"/>';
      case 'geyser': return '<path d="M-3 4c-2-3 2-4 0-7M1 4c-2-3 2-4 0-7M5 4c-2-3 2-4 0-7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M-4 4h10" stroke="#7a5a3a" stroke-width="1.4"/>';
      case 'salt': return '<path d="M-6 0-3-4h6l3 4-3 4h-6z" fill="#fbfbf6" stroke="#9aa0a6" stroke-width=".8"/>';
      case 'park': return '<path d="M-7 5-3.5-5-1-.5 1.6-6.5 4.2-.5 7 5z" fill="#6b6f7a" stroke="#2f3238" stroke-width=".8"/><path d="M1.6-6.5.5-4 1.6-4.6 2.6-4z" fill="#fff"/>';
      case 'cape': return '<rect x="-1.8" y="-6" width="3.6" height="10" rx=".8" fill="#fff" stroke="#b22" stroke-width="1"/><path d="M-1.8-2.5h3.6M-1.8 1h3.6" stroke="#b22" stroke-width="1.4"/>';
    }
    return '';
  }

  // ── the main map ──
  // opts: {id, labels:true, insets:true, poi:true, title:''}
  function mapSVG(o) {
    o = o || {};
    var p = (o.id || ('dcm' + (++uid))) + '-';
    var s = [];
    s.push('<svg class="dc-map-svg" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(o.title || 'Mapa de Chile con sus 16 regiones') + '">');
    // defs
    s.push('<defs>');
    s.push('<linearGradient id="' + p + 'ocean" x1="0" y1="0" x2="' + W + '" y2="0" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#1f5f8f"/><stop offset=".38" stop-color="#3f86b6"/><stop offset=".58" stop-color="#6eb0d3"/><stop offset=".7" stop-color="#9fd0e6"/><stop offset="1" stop-color="#b9def0"/></linearGradient>');
    s.push('<linearGradient id="' + p + 'oceanV" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0a2a44" stop-opacity=".22"/></linearGradient>');
    s.push('<linearGradient id="' + p + 'biome" x1="0" y1="0" x2="0" y2="' + H + '" gradientUnits="userSpaceOnUse">' + stopsLat(BIOME) + '</linearGradient>');
    s.push('<pattern id="' + p + 'waves" width="46" height="26" patternUnits="userSpaceOnUse"><path d="M2 8q5-4 10 0t10 0M25 21q5-4 10 0t10 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.1" stroke-linecap="round"/></pattern>');
    s.push('<filter id="' + p + 'blur6" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6"/></filter>');
    s.push('<filter id="' + p + 'shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#0b2e4a" flood-opacity=".35"/></filter>');
    G.regions.forEach(function (r) { s.push('<path id="' + p + 'r-' + r.id + '" d="' + r.d + '"/>'); });
    G.neighbours.forEach(function (n) { s.push('<path id="' + p + 'n-' + n.id + '" d="' + n.d + '"/>'); });
    s.push('<clipPath id="' + p + 'land">');
    G.regions.forEach(function (r) { s.push('<use href="#' + p + 'r-' + r.id + '"/>'); });
    G.neighbours.forEach(function (n) { s.push('<use href="#' + p + 'n-' + n.id + '"/>'); });
    s.push('</clipPath>');
    s.push('<clipPath id="' + p + 'frame"><rect width="' + W + '" height="' + H + '" rx="18"/></clipPath>');
    s.push('</defs>');

    s.push('<g clip-path="url(#' + p + 'frame)">');
    // ocean
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#' + p + 'ocean)"/>');
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#' + p + 'oceanV)"/>');
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#' + p + 'waves)"/>');
    // Atacama trench: a darker band offshore
    var tr = [];
    for (var i = 0; i < G.rows.length; i += 3) { var rw = G.rows[i]; if (rw[1] == null || i * 10 > 1480) continue; tr.push([rw[1] - 42, i * 10]); }
    s.push('<path d="M' + tr.map(function (q) { return q[0] + ' ' + q[1]; }).join('L') + '" fill="none" stroke="#123f66" stroke-opacity=".42" stroke-width="16" stroke-linecap="round" filter="url(#' + p + 'blur6)"/>');
    // graticule
    s.push('<g class="dc-grat" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1">');
    G.graticule.forEach(function (g) { s.push('<path d="' + g.d + '"/>'); });
    var tcY = f1(yOf(-23.44));
    s.push('<path d="M0 ' + tcY + 'H' + W + '" stroke="#ffe08a" stroke-opacity=".7" stroke-dasharray="8 6" stroke-width="1.4"/>');
    s.push('</g>');
    // coastal shallows
    s.push('<g fill="none" stroke="#e6f6fb" stroke-linejoin="round">');
    s.push('<g stroke-width="11" stroke-opacity=".16">' + useAll(p) + '</g>');
    s.push('<g stroke-width="5" stroke-opacity=".38">' + useAll(p) + '</g>');
    s.push('</g>');
    // land
    G.neighbours.forEach(function (n) { s.push('<use href="#' + p + 'n-' + n.id + '" fill="#efe8d6"/>'); });
    s.push('<g class="dc-land">');
    G.regions.forEach(function (r) { s.push('<use href="#' + p + 'r-' + r.id + '" fill="url(#' + p + 'biome)"/>'); });
    s.push('</g>');
    // relief (painted later by DCArt.relief)
    s.push('<image class="dc-relief" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="none" clip-path="url(#' + p + 'land)" style="pointer-events:none" opacity="0"/>');
    // neighbours wash (keeps Chile the hero)
    s.push('<g fill="#f7f2e6" fill-opacity=".52" stroke="#bfb39a" stroke-width="1">');
    G.neighbours.forEach(function (n) { s.push('<use href="#' + p + 'n-' + n.id + '"/>'); });
    s.push('</g>');
    // coastline ink
    s.push('<g fill="none" stroke="#3b6f86" stroke-opacity=".55" stroke-width=".9" stroke-linejoin="round">');
    G.regions.forEach(function (r) { s.push('<use href="#' + p + 'r-' + r.id + '"/>'); });
    s.push('</g>');
    // borders
    s.push('<path d="' + G.inner + '" fill="none" stroke="#3a2a1a" stroke-opacity=".22" stroke-width="3.4" stroke-linejoin="round"/>');
    s.push('<path d="' + G.inner + '" fill="none" stroke="#fffdf5" stroke-opacity=".95" stroke-width="1.3" stroke-linejoin="round"/>');
    s.push('<path d="' + G.border + '" fill="none" stroke="#7a3b2a" stroke-width="2.2" stroke-dasharray="7 3 2 3" stroke-linejoin="round" stroke-opacity=".8"/>');
    // interactive overlay (one per region)
    s.push('<g class="dc-hit">');
    G.regions.forEach(function (r) {
      var info = regionById(r.id);
      s.push('<use href="#' + p + 'r-' + r.id + '" class="dc-reg" data-id="' + r.id + '" data-zone="' + r.zone + '"><title>' + esc(info ? info.name : r.name) + '</title></use>');
    });
    s.push('</g>');

    // points of interest + capitals (detail level 2)
    if (o.poi !== false) {
      s.push('<g class="dc-poi lod2" pointer-events="none">');
      DC_POI.forEach(function (q) {
        var c = P(q.p[0], q.p[1]);
        s.push('<g transform="translate(' + f1(c[0]) + ' ' + f1(c[1]) + ')">' + poiSymbol(q.k) +
          (q.left ? '<text x="-9" y="4" text-anchor="end" class="dc-poi-t">' : '<text x="9" y="' + (q.dy || 4) + '" class="dc-poi-t">') + esc(q.n) + '</text></g>');
      });
      s.push('</g>');
    }
    s.push('<g class="dc-caps" pointer-events="none">');
    DC_REGIONS.forEach(function (r) {
      var c = P(r.cap[0], r.cap[1]);
      var isSantiago = r.id === 'RM';
      s.push('<g class="dc-cap" data-id="' + r.id + '" transform="translate(' + f1(c[0]) + ' ' + f1(c[1]) + ')">' +
        (isSantiago ? '<path d="M0-8 2.3-2.6 8-2.4 3.6 1.2 5 7 0 3.7-5 7-3.6 1.2-8-2.4-2.3-2.6z" fill="#c8102e" stroke="#fff" stroke-width="1.6"/>'
          : '<circle r="4.2" fill="#fff" stroke="#1c1b29" stroke-width="2"/>') +
        '<text class="dc-cap-t lod2" x="' + (r.capLab ? r.capLab[0] : isSantiago ? 10 : 8) + '" y="' + (r.capLab ? r.capLab[1] : 4) + '">' + esc(r.capital) + '</text></g>');
    });
    s.push('</g>');

    // region labels in the Pacific, with a leader to the coast
    if (o.labels !== false) {
      s.push('<g class="dc-lbls">');
      G.regions.forEach(function (r) {
        var info = regionById(r.id); var nm = info ? (info.short || info.name) : r.name;
        var y = r.c[1] + 7, x = r.w - 14;
        if (r.id === 'MA') { x = r.w + 4; y = r.c[1] + 120; }
        if (r.id === 'AI') { x = r.w - 10; }
        s.push('<g class="dc-lbl" data-id="' + r.id + '">' +
          '<path d="M' + (x + 3) + ' ' + (y - 6) + 'H' + (r.w + 2) + '" stroke="#fff" stroke-opacity=".8" stroke-width="1.3"/>' +
          '<text x="' + x + '" y="' + y + '" text-anchor="end">' + esc(nm) + '</text></g>');
      });
      s.push('</g>');
    }

    // context labels
    s.push('<g class="dc-ctx" pointer-events="none">');
    s.push(ctxText(P(-19.6, -66.4), 'BOLIVIA', 0, 'dc-cty'));
    s.push(ctxText(P(-36.5, -67.2), 'ARGENTINA', 90, 'dc-cty dc-cty-big'));
    s.push(ctxText([W - 52, 16], 'PERÚ', 0, 'dc-cty'));
    s.push(ctxText([210, 1180], 'OCÉANO PACÍFICO', -90, 'dc-sea'));
    s.push(ctxText([668, 1650], 'OCÉANO', 0, 'dc-sea dc-sea-s'));
    s.push(ctxText([668, 1672], 'ATLÁNTICO', 0, 'dc-sea dc-sea-s'));
    s.push(ctxText([tr[Math.floor(tr.length * .38)][0] - 14, tr[Math.floor(tr.length * .38)][1]], 'Fosa de Atacama', -90, 'dc-trench lod2'));
    s.push(ctxText(P(-29.4, -68.85), 'CORDILLERA DE LOS ANDES', -88, 'dc-andes'));
    s.push(ctxText([300, tcY - 6], 'Trópico de Capricornio', 0, 'dc-tropic'));
    G.graticule.forEach(function (g) { if (g.lat) s.push('<text class="dc-latlbl" x="8" y="' + f1(yOf(g.lat) - 4) + '">' + (-g.lat) + '°S</text>'); });
    var em = P(-52.75, -70.2);
    s.push(ctxText(em, 'Estrecho de Magallanes', -12, 'dc-strait lod2'));
    s.push(ctxText(P(-53.9, -68.9), 'Tierra del Fuego', 0, 'dc-strait lod2'));
    s.push('</g>');

    if (o.insets !== false) s.push(insets(p));
    // compass + scale
    s.push(compass(84, 1560));
    s.push(scaleBar(36, 1680));
    s.push('</g>');
    s.push('<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="18" fill="none" stroke="#0f3a5a" stroke-opacity=".35" stroke-width="2"/>');
    s.push('</svg>');
    return s.join('');
  }
  function useAll(p) {
    var t = '';
    G.regions.forEach(function (r) { t += '<use href="#' + p + 'r-' + r.id + '"/>'; });
    G.neighbours.forEach(function (n) { t += '<use href="#' + p + 'n-' + n.id + '"/>'; });
    return t;
  }
  function ctxText(c, t, rot, cls) {
    return '<text class="' + cls + '" x="' + f1(c[0]) + '" y="' + f1(c[1]) + '" text-anchor="middle"' + (rot ? ' transform="rotate(' + rot + ' ' + f1(c[0]) + ' ' + f1(c[1]) + ')"' : '') + '>' + esc(t) + '</text>';
  }

  function compass(x, y) {
    return '<g class="dc-compass" transform="translate(' + x + ' ' + y + ')" pointer-events="none">' +
      '<circle r="34" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<circle r="25" fill="none" stroke="#fff" stroke-opacity=".45" stroke-dasharray="2 3"/>' +
      '<path d="M0-30 6-6 30 0 6 6 0 30-6 6-30 0-6-6z" fill="#fff" fill-opacity=".85"/>' +
      '<path d="M0-30 6-6 0 0z M30 0 6 6 0 0z M0 30-6 6 0 0z M-30 0-6-6 0 0z" fill="#0f3a5a" fill-opacity=".7"/>' +
      '<path d="M0-30 6-6 0 0-6-6z" fill="#c8102e"/>' +
      '<text y="-38" text-anchor="middle" class="dc-n">N</text></g>';
  }
  function scaleBar(x, y) {
    var u = 100 / 111.2 * K; // 100 km in units
    return '<g class="dc-scale" transform="translate(' + x + ' ' + y + ')" pointer-events="none">' +
      '<rect width="' + f1(u) + '" height="7" fill="#fff"/><rect x="' + f1(u) + '" width="' + f1(u) + '" height="7" fill="#0f3a5a" stroke="#fff" stroke-width="1"/>' +
      '<rect width="' + f1(2 * u) + '" height="7" fill="none" stroke="#fff" stroke-width="1"/>' +
      '<text y="22" class="dc-sc-t">0</text><text x="' + f1(u) + '" y="22" text-anchor="middle" class="dc-sc-t">100</text><text x="' + f1(2 * u) + '" y="22" text-anchor="middle" class="dc-sc-t">200 km</text></g>';
  }

  // insets: South America locator, Rapa Nui, Juan Fernández, Desventuradas
  function insets(p) {
    var s = [];
    // locator
    s.push('<g class="dc-inset dc-locator" transform="translate(16 40)" pointer-events="none">');
    s.push('<rect width="168" height="232" rx="14" fill="#fffdf7" stroke="#0f3a5a" stroke-opacity=".3" filter="url(#' + p + 'shadow)"/>');
    s.push('<rect x="8" y="8" width="152" height="196" rx="9" fill="#cfe7f2"/>');
    s.push('<g transform="translate(10 10) scale(1.38)">');
    G.locator.forEach(function (c) {
      s.push('<path d="' + c.d + '" fill="' + (c.id === 'CL' ? '#c8102e' : '#ece4cf') + '" stroke="' + (c.id === 'CL' ? '#7a0a1c' : '#b9ab8c') + '" stroke-width="' + (c.id === 'CL' ? .7 : .45) + '" stroke-linejoin="round"/>');
    });
    s.push('</g>');
    s.push('<text x="84" y="222" text-anchor="middle" class="dc-inset-t">América del Sur</text>');
    s.push('</g>');

    // Rapa Nui (box drawn at 5 units per km)
    var rnx = 16, rny = 520, sc = 5.2;
    s.push('<g class="dc-inset dc-island" data-island="RN" transform="translate(' + rnx + ' ' + rny + ')" role="button" aria-label="Rapa Nui">');
    s.push('<rect width="176" height="150" rx="14" fill="#fffdf7" stroke="#0f3a5a" stroke-opacity=".3" filter="url(#' + p + 'shadow)"/>');
    s.push('<rect x="8" y="26" width="160" height="116" rx="9" fill="url(#' + p + 'ocean)"/>');
    s.push('<text x="14" y="19" class="dc-inset-t dc-inset-tl">Rapa Nui</text><text x="164" y="19" text-anchor="end" class="dc-inset-s">3.700 km →</text>');
    s.push('<g transform="translate(90 86) scale(' + sc + ')"><path d="' + G.rapanui + '" fill="#b8b07a" stroke="#4d5a3a" stroke-width=".25" stroke-linejoin="round"/>' +
      '<path d="' + G.rapanui + '" fill="none" stroke="#e6f6fb" stroke-opacity=".5" stroke-width="1.4" transform="" style="mix-blend-mode:screen"/></g>');
    // Hanga Roa + moai icon
    s.push('<g transform="translate(' + f1(90 - 7.9 * sc) + ' ' + f1(86 + 3.3 * sc) + ')"><circle r="3.4" fill="#fff" stroke="#1c1b29" stroke-width="1.6"/><text x="-6" y="16" class="dc-inset-s" text-anchor="start">Hanga Roa</text></g>');
    s.push('<g transform="translate(122 60) scale(.62)">' + moaiGlyph() + '</g>');
    s.push('<rect class="dc-island-hit" width="176" height="150" rx="14" fill="transparent"/>');
    s.push('</g>');

    // Juan Fernández: both main islands enlarged (3.4 units per km), 180 km apart in reality
    var jfx = 16, jfy = 870, js = 3.4, cs = G.jf.cs, cc = G.jf.cc;
    s.push('<g class="dc-inset dc-island" data-island="JF" transform="translate(' + jfx + ' ' + jfy + ')" role="button" aria-label="Archipiélago Juan Fernández">');
    s.push('<rect width="200" height="132" rx="14" fill="#fffdf7" stroke="#0f3a5a" stroke-opacity=".3" filter="url(#' + p + 'shadow)"/>');
    s.push('<rect x="8" y="26" width="184" height="98" rx="9" fill="url(#' + p + 'ocean)"/>');
    s.push('<text x="14" y="19" class="dc-inset-t dc-inset-tl">Juan Fernández</text><text x="186" y="19" text-anchor="end" class="dc-inset-s">670 km →</text>');
    s.push('<g transform="translate(46 66) scale(' + js + ') translate(' + (-cs[0]) + ' ' + (-cs[1]) + ')"><path d="' + G.jf.selkirk + '" fill="#9fb07c" stroke="#3d4a2e" stroke-width=".25" stroke-linejoin="round"/></g>');
    s.push('<g transform="translate(138 64) scale(' + js + ') translate(' + (-cc[0]) + ' ' + (-cc[1]) + ')"><path d="' + G.jf.crusoe + '" fill="#9fb07c" stroke="#3d4a2e" stroke-width=".25" stroke-linejoin="round"/></g>');
    s.push('<path d="M70 66h34" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 3"/><text x="87" y="60" text-anchor="middle" class="dc-inset-s dc-on-sea">180 km</text>');
    s.push('<text x="46" y="114" text-anchor="middle" class="dc-inset-s dc-on-sea">A. Selkirk</text><text x="138" y="114" text-anchor="middle" class="dc-inset-s dc-on-sea">Robinson Crusoe</text>');
    s.push('<rect class="dc-island-hit" width="200" height="132" rx="14" fill="transparent"/>');
    s.push('</g>');
    // leader from the inset to the real islands
    var jm = G.jfMain;
    s.push('<path d="M' + (jfx + 98) + ' ' + jfy + 'L' + f1((jm[0][0] + jm[1][0]) / 2) + ' ' + (jm[0][1] + 8) + '" stroke="#fff" stroke-opacity=".75" stroke-dasharray="4 4" stroke-width="1.4" fill="none" pointer-events="none"/>');
    jm.forEach(function (c) { s.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.2" fill="#9fb07c" stroke="#fff" stroke-width="1.2" pointer-events="none"/>'); });
    G.desventuradas.forEach(function (c) { s.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="2.4" fill="#c8b98a" stroke="#fff" stroke-width="1" pointer-events="none"/>'); });
    var d0 = G.desventuradas[0];
    s.push('<text x="' + (d0[0] + 8) + '" y="' + (d0[1] - 10) + '" class="dc-inset-s dc-on-sea" pointer-events="none">Islas Desventuradas</text>');
    return s.join('');
  }

  function moaiGlyph() {
    return '<path d="M-10 30V-6c0-12 3-20 10-20s10 8 10 20v36z" fill="#6d665c" stroke="#2f2a24" stroke-width="1.5"/>' +
      '<path d="M-10-8h20" stroke="#2f2a24" stroke-width="2.4"/><path d="M-1-8v14l-3 3h7" fill="none" stroke="#2f2a24" stroke-width="1.6"/>' +
      '<path d="M-5 16h9" stroke="#2f2a24" stroke-width="1.6"/><path d="M-12 30h24" stroke="#2f2a24" stroke-width="2"/>' +
      '<path d="M-6-24c2-4 10-4 12 0" fill="#b2462e" stroke="#2f2a24" stroke-width="1"/>';
  }

  // ── procedural relief (hillshade + snow + ice) ──
  var reliefURL = null, reliefWaiters = [];
  function interp(tbl, lat) { // tbl: [[lat, v], ...] sorted north→south
    if (lat >= tbl[0][0]) return tbl[0][1];
    for (var i = 1; i < tbl.length; i++) if (lat >= tbl[i][0]) { var a = tbl[i - 1], b = tbl[i], t = (lat - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; }
    return tbl[tbl.length - 1][1];
  }
  var T_WA = [[-17, 1.6], [-22, 1.7], [-26.5, 1.15], [-30, .9], [-33, .85], [-36, .78], [-39, .7], [-42, .62], [-46, .7], [-50, .6], [-54, .55], [-56.5, .45]];
  var T_HA = [[-17, 1.0], [-22, 1.0], [-27, 1.05], [-30, .9], [-33, 1.0], [-35, .9], [-37, .66], [-40, .55], [-44, .58], [-48, .7], [-51, .62], [-54, .5], [-56.5, .35]];
  var T_PW = [[-17, 6], [-25, 5], [-28, 3], [-56.5, 2.4]];
  var T_HC = [[-17, .42], [-24, .48], [-28, .36], [-33, .3], [-36.5, .26], [-38, .34], [-41, .22], [-42.5, .05], [-56.5, .0]];
  var T_SNOW = [[-17, 1.25], [-26, 1.15], [-30, .95], [-34, .8], [-37, .62], [-41, .5], [-46, .42], [-56.5, .36]];
  // Andes crest south of 51.5°S (the border turns east there): lat, lon
  var CREST_S = [[-51.3, -73.2], [-52.2, -73.1], [-53, -72.6], [-53.8, -71.8], [-54.4, -70.6], [-54.6, -69.4], [-54.8, -68.3], [-55.2, -67.5]];
  var ICE = [[-47.0, -73.5, .62, .36], [-49.9, -73.4, 1.65, .4], [-54.6, -69.7, .22, .9]];
  var SALT = [[-23.5, -68.25, .45, .2]];

  function hash(ix, iy) { var h = (ix * 374761393 + iy * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, o) { var s = 0, a = .5, f = 1, n = 0; for (var i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); n += a; a *= .5; f *= 2.03; } return s / n; }
  function ridged(x, y, o) { var s = 0, a = .5, f = 1, n = 0; for (var i = 0; i < o; i++) { var v = 1 - Math.abs(2 * vnoise(x * f + 17, y * f - 9) - 1); s += a * v * v; n += a; a *= .5; f *= 2.1; } return s / n; }

  function buildRelief(done) {
    var S = 1; // canvas px per unit
    var cw = Math.round(W * S), ch = Math.round(H * S);
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var ctx = cv.getContext('2d'); if (!ctx) return done(null);
    var hgt = new Float32Array(cw * ch);
    var span = new Int16Array(ch * 2);
    var volc = DC_POI.filter(function (q) { return q.k === 'volcano'; }).map(function (q) { return P(q.p[0], q.p[1]); });
    var ice = ICE.map(function (e) { return [P(e[0], e[1]), e[2] * K, e[3] * K * Math.cos(e[0] * RAD)]; });
    var salt = SALT.map(function (e) { return [P(e[0], e[1]), e[2] * K, e[3] * K * Math.cos(e[0] * RAD)]; });
    var crestS = CREST_S.map(function (c) { return P(c[0], c[1]); });
    // per-unit-row profiles, interpolated between the 10-unit samples and smoothed
    function profile(col, radius) {
      var n = H + 1, raw = new Float32Array(n), has = new Uint8Array(n), out = new Float32Array(n);
      var R = G.rows, last = -1;
      for (var i = 0; i < R.length; i++) if (R[i][col] != null) {
        var yy = i * 10;
        if (last >= 0) { var a = R[last][col], b = R[i][col], y0 = last * 10; for (var k = y0; k <= yy && k < n; k++) { raw[k] = a + (b - a) * (k - y0) / (yy - y0); has[k] = 1; } }
        else if (yy < n) { raw[yy] = R[i][col]; has[yy] = 1; }
        last = i;
      }
      for (var y = 0; y < n; y++) {
        if (!has[y]) { out[y] = NaN; continue; }
        var s2 = 0, c2 = 0; for (var d = -radius; d <= radius; d++) { var q = y + d; if (q >= 0 && q < n && has[q]) { s2 += raw[q]; c2++; } }
        out[y] = s2 / c2;
      }
      return out;
    }
    var EAST = profile(0, 28), WEST = profile(1, 10);
    function crestX(y, lat) {
      if (lat < -51.3) {
        for (var i = 1; i < crestS.length; i++) if (y <= crestS[i][1]) { var a = crestS[i - 1], b = crestS[i], t = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * t; }
        return crestS[crestS.length - 1][0];
      }
      var e = EAST[Math.min(H, Math.max(0, Math.round(y)))];
      if (lat < -50.6) { var tt = (lat + 50.6) / -0.7; var cs = crestS[0][0]; return isNaN(e) ? cs : (e - .12 * K) * (1 - tt) + cs * tt; }
      return isNaN(e) ? null : e - .12 * K;
    }
    var EF = 2.2 * K; // how far east of the crest we paint
    for (var y = 0; y < ch; y++) {
      var uy = y / S, lat = latOf(uy);
      var wx0 = WEST[Math.min(H, Math.round(uy))], ex0 = EAST[Math.min(H, Math.round(uy))];
      var cx = crestX(uy, lat);
      var x0 = isNaN(wx0) ? 0 : Math.max(0, Math.floor((wx0 - 30) * S));
      var xe = cx == null ? (isNaN(ex0) ? -1 : ex0 + 10) : cx + EF;
      if (lat < -51.3 && !isNaN(ex0)) xe = Math.max(xe, ex0 + 10);
      var x1 = Math.min(cw - 1, Math.ceil(xe * S));
      span[y * 2] = x0; span[y * 2 + 1] = x1;
      var wa = interp(T_WA, lat) * K, ha = interp(T_HA, lat), pw = interp(T_PW, lat), hc = interp(T_HC, lat);
      for (var x = x0; x <= x1; x++) {
        var ux = x / S, h = 0;
        if (cx != null) {
          var d = cx - ux;
          var f = d >= 0 ? 1 / (1 + Math.pow(d / wa, pw)) : 1 / (1 + Math.pow(-d / (.5 * K), 2.4));
          if (d < 0) { var fe = 1 + d / EF; f *= fe < 0 ? 0 : fe * fe * (3 - 2 * fe); }
          h += ha * f * (.5 + .5 * ridged(ux / 16, uy / 16, 4));
        }
        if (!isNaN(wx0) && hc > 0) { var dw = (ux - wx0) / K - .3; h += hc * Math.exp(-(dw * dw) / .03) * (.55 + .45 * fbm(ux / 22, uy / 22, 3)); }
        for (var v = 0; v < volc.length; v++) { var vx = ux - volc[v][0], vy = uy - volc[v][1], dd = vx * vx + vy * vy; if (dd < 900) h += .42 * Math.exp(-dd / 60); }
        h += .07 * fbm(ux / 7, uy / 7, 3);
        // fade the noise floor out at the ends of the painted span
        var ed = Math.min(x - x0, x1 - x) / (12 * S); if (ed < 1) h *= ed;
        hgt[y * cw + x] = h;
      }
    }
    var img = ctx.createImageData(cw, ch), px = img.data;
    var Lx = -.62, Ly = -.62, Lz = .48, Ll = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz); Lx /= Ll; Ly /= Ll; Lz /= Ll;
    var ZF = 26 * S;
    for (y = 1; y < ch - 1; y++) {
      var lat2 = latOf(y / S), snow = interp(T_SNOW, lat2);
      for (x = Math.max(1, span[y * 2]); x <= Math.min(cw - 2, span[y * 2 + 1]); x++) {
        var i0 = y * cw + x, hh = hgt[i0];
        var dzx = (hgt[i0 + 1] - hgt[i0 - 1]) * ZF, dzy = (hgt[i0 + cw] - hgt[i0 - cw]) * ZF;
        var nl = Math.sqrt(dzx * dzx + dzy * dzy + 1);
        var sh = (-dzx * Lx - dzy * Ly + Lz) / nl - Lz;
        // tint layer
        var tr = 0, tg = 0, tb = 0, ta = 0;
        if (hh > .42) { ta = Math.min(.42, (hh - .42) * .9); tr = 139; tg = 112; tb = 86; }
        if (hh > snow) { var sa = Math.min(.9, (hh - snow) * 3.2); tr = tr * (1 - sa) + 255 * sa; tg = tg * (1 - sa) + 255 * sa; tb = tb * (1 - sa) + 255 * sa; ta = ta + sa * (1 - ta); }
        var ux2 = x / S, uy2 = y / S;
        for (var e = 0; e < ice.length; e++) {
          var ex = (ux2 - ice[e][0][0]) / ice[e][2], ey = (uy2 - ice[e][0][1]) / ice[e][1];
          var q = ex * ex + ey * ey + (fbm(ux2 / 9, uy2 / 9, 2) - .5) * .9;
          if (q < 1) { var ia = Math.min(.95, (1 - q) * 3.2); tr = tr * (1 - ia) + 240 * ia; tg = tg * (1 - ia) + 248 * ia; tb = tb * (1 - ia) + 255 * ia; ta = ta + ia * (1 - ta); }
        }
        for (e = 0; e < salt.length; e++) {
          ex = (ux2 - salt[e][0][0]) / salt[e][2]; ey = (uy2 - salt[e][0][1]) / salt[e][1];
          q = ex * ex + ey * ey + (fbm(ux2 / 5, uy2 / 5, 2) - .5) * .8;
          if (q < 1) { ia = Math.min(.75, (1 - q) * 2); tr = tr * (1 - ia) + 250 * ia; tg = tg * (1 - ia) + 248 * ia; tb = tb * (1 - ia) + 238 * ia; ta = ta + ia * (1 - ta); }
        }
        // shade layer over the tint
        var sr, sg, sb, sa2;
        if (sh < 0) { sr = 52; sg = 38; sb = 60; sa2 = Math.min(.5, -sh * 1.25); }
        else { sr = 255; sg = 251; sb = 236; sa2 = Math.min(.38, sh * 1.2); }
        var oa = sa2 + ta * (1 - sa2);
        if (oa <= 0.003) continue;
        var j = i0 * 4;
        px[j] = (sr * sa2 + tr * ta * (1 - sa2)) / oa;
        px[j + 1] = (sg * sa2 + tg * ta * (1 - sa2)) / oa;
        px[j + 2] = (sb * sa2 + tb * ta * (1 - sa2)) / oa;
        px[j + 3] = oa * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (cv.toBlob) cv.toBlob(function (b) { done(b ? URL.createObjectURL(b) : cv.toDataURL()); }, 'image/png');
    else done(cv.toDataURL());
  }

  function relief(svg) {
    if (!svg) return;
    var im = svg.querySelector('.dc-relief'); if (!im) return;
    function apply(url) {
      if (!url) return;
      im.setAttribute('href', url);
      im.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
      im.style.transition = 'opacity .6s'; im.setAttribute('opacity', '1');
    }
    if (reliefURL) return apply(reliefURL);
    reliefWaiters.push(apply);
    if (reliefWaiters.length > 1) return;
    setTimeout(function () {
      try {
        buildRelief(function (u) { reliefURL = u; var w = reliefWaiters; reliefWaiters = []; w.forEach(function (f) { f(u); }); });
      } catch (e) { console.warn('[Chile] relief failed', e); }
    }, 30);
  }

  // silhouette of one region (for the detail panel)
  function regionThumb(id, size) {
    var g = geoById(id); if (!g) return '';
    var b = g.bb, pad = 6, w = b[2] - b[0], h = b[3] - b[1];
    var info = regionById(id), c = info ? P(info.cap[0], info.cap[1]) : null;
    var r = Math.max(w, h) / 40;
    return '<svg class="dc-thumb" viewBox="' + (b[0] - pad) + ' ' + (b[1] - pad) + ' ' + (w + 2 * pad) + ' ' + (h + 2 * pad) + '" aria-hidden="true" style="max-height:' + (size || 140) + 'px">' +
      '<defs><linearGradient id="th-' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d27a"/><stop offset="1" stop-color="#d98b3a"/></linearGradient></defs>' +
      '<path d="' + g.d + '" fill="url(#th-' + id + ')" stroke="#7a3b10" stroke-width="' + f1(Math.max(1, r * .5)) + '" stroke-linejoin="round"/>' +
      (c ? '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + f1(Math.max(3, r * 1.6)) + '" fill="#fff" stroke="#1c1b29" stroke-width="' + f1(Math.max(1.2, r * .6)) + '"/>' : '') +
      '</svg>';
  }


  // ================================================================
  //  ILLUSTRATIONS
  // ================================================================
  var gid = 0;
  function nid(k) { return 'dca' + k + (++gid); }
  function lin(id, x2, y2, stops) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>'; }
  function rad(id, stops, cx, cy, r) { return '<radialGradient id="' + id + '" cx="' + (cx || .5) + '" cy="' + (cy || .5) + '" r="' + (r || .5) + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>'; }

  // ── small line icons (24×24) ──
  var ICONS = {
    geo: '<path d="M2 20 9 8l4 6 3-4 6 10z" fill="#9fc6a0" stroke="#2f6b3a" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8 7.2 11l1.8-.8 1.4 1z" fill="#fff"/>',
    places: '<path d="M12 22s-7-6.6-7-12a7 7 0 0 1 14 0c0 5.4-7 12-7 12z" fill="#f4a259" stroke="#8a4b12" stroke-width="1.6"/><circle cx="12" cy="10" r="2.8" fill="#fff"/>',
    products: '<path d="M4 10h16l-2 10H6z" fill="#e9b872" stroke="#7a4f1d" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 10 11 4M16 10l-3-6M7 14h10M7.6 17h8.8" stroke="#7a4f1d" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    history: '<path d="M6 4h11a3 3 0 0 1 3 3v12H9a3 3 0 0 1-3-3z" fill="#f3e3bf" stroke="#7a5a2a" stroke-width="1.6"/><path d="M6 16a3 3 0 0 0 3 3 3 3 0 0 0 0-6H4a2 2 0 0 0 2 3z" fill="#e6cf9c" stroke="#7a5a2a" stroke-width="1.4"/><path d="M10 8h7M10 11h6" stroke="#7a5a2a" stroke-width="1.3" stroke-linecap="round"/>',
    capital: '<circle cx="12" cy="12" r="9" fill="#fff" stroke="#1c1b29" stroke-width="1.6"/><path d="M12 6.5l1.7 3.6 3.9.4-2.9 2.6.8 3.9L12 15l-3.5 2 .8-3.9-2.9-2.6 3.9-.4z" fill="#c8102e"/>',
    pin: '<path d="M12 22s-7-6.6-7-12a7 7 0 0 1 14 0c0 5.4-7 12-7 12z" fill="#c8102e" stroke="#7a0a1c" stroke-width="1.4"/><circle cx="12" cy="10" r="2.8" fill="#fff"/>',
    compass: '<circle cx="12" cy="12" r="10" fill="#fff" stroke="#0f3a5a" stroke-width="1.6"/><path d="M12 3.5 14.4 12 12 20.5 9.6 12z" fill="#0f3a5a"/><path d="M12 3.5 14.4 12H9.6z" fill="#c8102e"/>',
    bulb: '<path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="#ffd54a" stroke="#8a5a00" stroke-width="1.5"/><path d="M9.8 18.5h4.4M10.5 21h3" stroke="#8a5a00" stroke-width="1.5" stroke-linecap="round"/>',
    laurel: '<path d="M12 21c-5-2-8-6-8-12M12 21c5-2 8-6 8-12" fill="none" stroke="#8a6a1a" stroke-width="1.5" stroke-linecap="round"/>' +
      [[5, 10, -40], [5.6, 13.6, -60], [7.4, 16.8, -75], [19, 10, 40], [18.4, 13.6, 60], [16.6, 16.8, 75]].map(function (l) { return '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="1.4" ry="2.8" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')" fill="#d4a72c"/>'; }).join('') +
      '<path d="M12 5l1.3 2.7 3 .4-2.2 2 .5 3L12 11.7 9.4 13l.5-3-2.2-2 3-.4z" fill="#d4a72c"/>'
  };
  function icon(k) { return '<svg class="dc-ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[k] || '') + '</svg>'; }

  function star(on) {
    return '<svg class="dc-star' + (on ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z" fill="' + (on ? '#f5b91a' : '#e8e4f0') + '" stroke="' + (on ? '#a86b00' : '#c9c3d8') + '" stroke-width="1.4" stroke-linejoin="round"/>' + (on ? '<path d="M8.5 9.6 12 4.8l1.6 3.4" fill="none" stroke="#fff3c4" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>' : '') + '</svg>';
  }
  function medal(n) {
    var c = n >= 3 ? ['#ffe9a3', '#f5b91a', '#a86b00'] : n === 2 ? ['#f4f6f8', '#b9c2cc', '#6b7582'] : ['#f6d2b0', '#d08b52', '#7a4320'];
    var g = nid('md');
    return '<svg class="dc-medal" viewBox="0 0 80 96" aria-hidden="true"><defs>' + rad(g, [[0, c[0]], [.7, c[1]], [1, c[2]]], .38, .32, .7) + '</defs>' +
      '<path d="M22 2h14l6 26-12 4zM58 2H44l-6 26 12 4z" fill="#c8102e"/><path d="M36 2h8l-4 26z" fill="#0039a6"/>' +
      '<circle cx="40" cy="60" r="30" fill="url(#' + g + ')" stroke="' + c[2] + '" stroke-width="2.5"/><circle cx="40" cy="60" r="22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<path d="M40 44l4.6 9.5 10.4 1.4-7.6 7.2 1.9 10.3L40 67.5l-9.3 4.9 1.9-10.3-7.6-7.2 10.4-1.4z" fill="#fff" fill-opacity=".9" stroke="' + c[2] + '" stroke-width="1.2"/></svg>';
  }

  // ── zone icons (56×56) ──
  function zoneIcon(z) {
    var g = nid('z'), s = '<svg class="dc-zic" viewBox="0 0 56 56" aria-hidden="true"><defs>';
    if (z === 'norte') {
      s += lin(g, 0, 1, [[0, '#ffd27a'], [1, '#ffb15c']]) + '</defs><rect width="56" height="56" rx="14" fill="url(#' + g + ')"/><circle cx="38" cy="16" r="7" fill="#fff5c9"/>' +
        '<path d="M0 42q14-12 28-4t28-2v20H0z" fill="#e0a25a"/><path d="M0 48q18-8 34 0t22-2v10H0z" fill="#c98544"/>' +
        '<path d="M16 46V24a3 3 0 0 1 6 0v22M22 34h4a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v3h-2M16 31h-3v-3a2 2 0 0 0-4 0v4a3 3 0 0 0 3 3h4" fill="#3f8f4e" stroke="#245a2e" stroke-width="1.4"/>';
    } else if (z === 'centro') {
      s += lin(g, 0, 1, [[0, '#9fd3f5'], [1, '#e6f4ff']]) + '</defs><rect width="56" height="56" rx="14" fill="url(#' + g + ')"/>' +
        '<path d="M0 34 12 16l8 10 10-16 12 14 14-8v40H0z" fill="#8a9bb3"/><path d="M10 19l2-3 3 4-2-.5zM28 13l2-3 3 4-2-1z" fill="#fff"/>' +
        '<path d="M0 40q28-10 56 0v16H0z" fill="#86b05a"/>' +
        [[16, 44], [21, 44], [18.5, 48.5], [26, 44], [23.5, 48.5], [21, 53]].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3" fill="#6b2d73" stroke="#3d1442" stroke-width=".8"/>'; }).join('') +
        '<path d="M21 41q2-5 7-5" stroke="#3f6b2a" stroke-width="1.6" fill="none"/><path d="M28 36q6-1 6 5-5 0-6-5z" fill="#4e8a35"/>';
    } else if (z === 'sur') {
      s += lin(g, 0, 1, [[0, '#bfe3f2'], [1, '#e9f6fb']]) + '</defs><rect width="56" height="56" rx="14" fill="url(#' + g + ')"/>' +
        '<path d="M10 40 25 14h6l15 26z" fill="#7d8796"/><path d="M22.6 19 25 14h6l2.4 5-3 2-2.4-2-2.6 2z" fill="#fff"/><path d="M27 12q-3-5 2-8 4 3 1 8" fill="#d9dde3" opacity=".9"/>' +
        '<path d="M0 44q28-8 56 0v12H0z" fill="#4f9fd6"/><path d="M0 48h56v8H0z" fill="#2f7a3f"/>' +
        '<path d="M44 48V30M38 34q6-3 12 0M37 39q7-3 14 0M39 30q5-3 10 0" stroke="#24502b" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    } else if (z === 'patagonia') {
      s += lin(g, 0, 1, [[0, '#8ec5ff'], [1, '#e8f3ff']]) + '</defs><rect width="56" height="56" rx="14" fill="url(#' + g + ')"/>' +
        '<path d="M4 40 14 16l4 8 5-14 5 14 4-10 8 26z" fill="#5b6272"/><path d="M12 21l2-5 2 4zM21 15l2-5 2 5-2-1zM30 18l2-4 2 5z" fill="#fff"/>' +
        '<path d="M0 38h56v18H0z" fill="#58b6d6"/><path d="M6 38h26l-4 6H10z" fill="#e9f7ff" stroke="#9bd0ea"/>' +
        '<ellipse cx="44" cy="44" rx="5" ry="7" fill="#1c1b29"/><ellipse cx="44" cy="46" rx="3" ry="5" fill="#fff"/><circle cx="44" cy="36.5" r="3.4" fill="#1c1b29"/><path d="M46.8 36.5l2.6 1-2.6.8z" fill="#f4a259"/>';
    } else {
      s += lin(g, 0, 1, [[0, '#ffc48a'], [1, '#ffe7c4']]) + '</defs><rect width="56" height="56" rx="14" fill="url(#' + g + ')"/>' +
        '<path d="M0 44q28-6 56 0v12H0z" fill="#3b8fc4"/><path d="M6 46q20-14 44 0z" fill="#7fa65a"/>' +
        '<g transform="translate(28 30) scale(.5)">' + moaiGlyph() + '</g>';
    }
    return s + '</svg>';
  }

  function islandThumb(id) {
    if (id === 'RN') return '<svg class="dc-thumb" viewBox="-14 -10 28 20" aria-hidden="true"><path d="' + G.rapanui + '" fill="#d7b46a" stroke="#6b4a1a" stroke-width=".3" stroke-linejoin="round"/></svg>';
    return '<svg class="dc-thumb" viewBox="-96 -12 200 24" aria-hidden="true"><path d="' + G.jf.selkirk + G.jf.crusoe + '" fill="#9fb07c" stroke="#3d4a2e" stroke-width=".8"/></svg>';
  }

  // ── topic banners (320×110 scenes) ──
  function mtn(pts, fill, extra) { return '<path d="M' + pts + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function banner(topic) {
    var a = nid('b'), b = nid('b'), c = nid('b');
    var s = '<svg class="dc-banner" viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>';
    switch (topic) {
      case 'geography':
        s += lin(a, 0, 1, [[0, '#7cc4f0'], [1, '#e3f4ff']]) + lin(b, 0, 1, [[0, '#8191a8'], [1, '#5f6e86']]) + lin(c, 1, 0, [[0, '#2f7fb4'], [1, '#73bde0']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/><circle cx="262" cy="26" r="13" fill="#fff6cf"/>' +
          mtn('70 110 120 30 140 48 170 14 200 46 222 26 260 60 290 34 320 58V110z', 'url(#' + b + ')') +
          mtn('112 43 120 30 128 42 122 39zM162 26 170 14 178 27 171 24zM216 34 222 26 229 35 223 33zM284 42 290 34 297 43 291 40z', '#fff') +
          mtn('60 110q40-34 90-30t90 4 80 6V110z', '#8db86a') + mtn('0 70q30-4 60 6t40 34H0z', 'url(#' + c + ')') +
          '<path d="M8 84q8-4 16 0t16 0M14 96q8-4 16 0t16 0" stroke="#fff" stroke-opacity=".6" fill="none" stroke-width="1.6" stroke-linecap="round"/>';
        break;
      case 'antartica':
        s += lin(a, 0, 1, [[0, '#cfe8ff'], [1, '#f4fbff']]) + lin(b, 0, 1, [[0, '#2a6f9f'], [1, '#174a70']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          mtn('0 72 40 40 70 52 104 28 150 64 190 46 230 66H0z', '#ffffff', ' stroke="#b7d8ee" stroke-width="1.5"') +
          mtn('104 28 120 60 92 66 80 50z', '#d6ebf8') +
          '<rect y="66" width="320" height="44" fill="url(#' + b + ')"/><path d="M220 66h70l-10 12h-48z" fill="#fff" stroke="#b7d8ee"/>' +
          '<g transform="translate(262 46)"><ellipse rx="9" ry="14" fill="#1c1b29"/><ellipse cy="3" rx="6" ry="10" fill="#fff"/><circle cy="-15" r="6.5" fill="#1c1b29"/><path d="M5-15l6 2-6 1.6z" fill="#f4a259"/><circle cx="2.5" cy="-16" r="1.1" fill="#fff"/><path d="M-4 13l-5 3h7zM4 13l5 3h-7z" fill="#f4a259"/></g>' +
          '<g transform="translate(240 52) scale(.7)"><ellipse rx="9" ry="14" fill="#1c1b29"/><ellipse cy="3" rx="6" ry="10" fill="#fff"/><circle cy="-15" r="6.5" fill="#1c1b29"/><path d="M5-15l6 2-6 1.6z" fill="#f4a259"/></g>';
        break;
      case 'indigenous':
        s += lin(a, 0, 1, [[0, '#ffb36b'], [.6, '#ffd9a3'], [1, '#fff0d4']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/><circle cx="160" cy="80" r="34" fill="#fff1c7" opacity=".8"/>' +
          mtn('0 110 0 80q80-20 160 0t160 0V110z', '#9a7a4a') +
          araucaria(70, 96, 1.1) + araucaria(112, 100, .7) +
          '<g transform="translate(244 72) scale(1.05)">' + moaiGlyph() + '</g><g transform="translate(276 78) scale(.8)">' + moaiGlyph() + '</g>' +
          '<path d="M206 104h100" stroke="#6b5434" stroke-width="5" stroke-linecap="round"/>';
        break;
      case 'history':
        s += lin(a, 0, 1, [[0, '#f6e7c4'], [1, '#e8d19e']]) + lin(b, 0, 1, [[0, '#4f8fb8'], [1, '#2a5f86']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' + compassRose(270, 40, 26) +
          '<rect y="80" width="320" height="30" fill="url(#' + b + ')"/>' + ship(120, 84, 1.25) +
          '<path d="M20 90q10-4 20 0t20 0M200 98q10-4 20 0t20 0" stroke="#fff" stroke-opacity=".6" fill="none" stroke-width="1.6"/>';
        break;
      case 'culture':
        s += '<pattern id="' + b + '" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#fff"/><rect width="10" height="10" fill="#e6474f" opacity=".85"/><rect x="10" y="10" width="10" height="10" fill="#e6474f" opacity=".85"/></pattern>' +
          rad(a, [[0, '#f7c66b'], [.8, '#d98b2f'], [1, '#b8681c']], .45, .35, .7) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + b + ')"/><rect width="320" height="110" fill="#fff" opacity=".35"/>' +
          '<ellipse cx="150" cy="78" rx="78" ry="20" fill="#fff" stroke="#e0d6c8" stroke-width="2"/>' +
          '<path d="M96 76q54-62 108 0z" fill="url(#' + a + ')" stroke="#9a5512" stroke-width="2"/>' +
          '<path d="M98 75q52 6 104 0" fill="none" stroke="#9a5512" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/>' +
          '<path d="M128 52q8-3 14 1M150 46q8-2 14 3" stroke="#fff2cc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>' +
          '<path d="M246 98h40l-6-30h-28z" fill="#3a2a22"/><path d="M250 68h32" stroke="#5a4232" stroke-width="5" stroke-linecap="round"/><ellipse cx="266" cy="66" rx="18" ry="5" fill="#2a1c16"/>' +
          '<path d="M40 30q12-10 22 0t22 0l-6 26q-10 6-22 0z" fill="#fff" stroke="#cfcfcf"/>';
        break;
      case 'nature':
        s += lin(a, 0, 1, [[0, '#86c9f2'], [1, '#e8f6ff']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          mtn('0 110 50 44 90 76 140 30 190 70 240 40 320 84V110z', '#7f8ea6') + mtn('132 40 140 30 148 41 141 38zM232 50 240 40 248 51 241 48z', '#fff') +
          mtn('0 110q80-26 160-10t160 0V110z', '#5d9b50') + condor(150, 26, 1) +
          '<g transform="translate(272 76)"><path d="M0-22q-2 10 0 22" stroke="#2f6b2a" stroke-width="2" fill="none"/><path d="M-9 0q9-14 18 0l-3 12q-6 4-12 0z" fill="#c8102e" stroke="#7a0a1c" stroke-width="1.4"/><path d="M-4 2q4-6 8 0" stroke="#ff8a8a" stroke-width="1.4" fill="none"/><path d="M0-14q8-6 14-2-6 6-14 2z" fill="#3f8f4e"/></g>';
        break;
      case 'famous':
        s += lin(a, 0, 1, [[0, '#26215a'], [1, '#4a3a8a']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' + starsField(28, 320, 70) +
          '<path d="M100 86q30-14 60 0V38q-30-14-60 0z" fill="#fffaf0" stroke="#d8cfbd" stroke-width="1.5"/><path d="M160 86q30-14 60 0V38q-30-14-60 0z" fill="#fff4e0" stroke="#d8cfbd" stroke-width="1.5"/>' +
          '<path d="M110 50q20-8 42 0M110 58q20-8 42 0M110 66q20-8 42 0M168 50q20-8 42 0M168 58q20-8 34 0" stroke="#b8ab94" stroke-width="1.6" fill="none"/>' +
          '<path d="M232 22q30 6 38 40l-6 2q-12-24-32-42z" fill="#f2f2f2" stroke="#c9c9c9"/><path d="M262 62l-12 26" stroke="#3a2a6a" stroke-width="2.4" stroke-linecap="round"/>';
        break;
      case 'inventors':
        s += lin(a, 0, 1, [[0, '#0d1b3d'], [1, '#2b3f7a']]) + lin(b, 1, 0, [[0, '#ffffff', 0], [.5, '#cfd8ff', .35], [1, '#ffffff', 0]]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/><path d="M-20 90 340 6v34L-20 110z" fill="url(#' + b + ')"/>' + starsField(40, 320, 80) +
          mtn('0 110 60 82 120 92 200 70 320 90V110z', '#c78a52') +
          '<g transform="translate(176 72)"><path d="M-26 0a26 24 0 0 1 52 0z" fill="#eef1f6" stroke="#8a94a6" stroke-width="1.6"/><path d="M-4-23h8V0h-8z" fill="#2b3f7a"/><rect x="-30" y="0" width="60" height="16" fill="#dfe4ec" stroke="#8a94a6" stroke-width="1.6"/></g>' +
          '<g transform="translate(92 86)"><path d="M-14 0a14 12 0 0 1 28 0z" fill="#eef1f6" stroke="#8a94a6" stroke-width="1.4"/><rect x="-16" y="0" width="32" height="8" fill="#dfe4ec" stroke="#8a94a6"/></g>' +
          '<g transform="translate(260 80) rotate(-20)"><ellipse rx="12" ry="5" fill="#fff" stroke="#8a94a6"/><path d="M0 0v14" stroke="#8a94a6" stroke-width="2.4"/></g>';
        break;
      case 'volcanes':
        s += lin(a, 0, 1, [[0, '#ffb98a'], [1, '#ffe8d4']]) + lin(b, 0, 1, [[0, '#6f6a74'], [1, '#4e4954']]) + lin(c, 0, 1, [[0, '#4ea3d3'], [1, '#2e7bb0']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          '<path d="M150 20q-16-10-4-18 14-6 22 4 16-4 18 10 12 4 2 12-18 6-28-2-12 4-10-6z" fill="#cfc9cf" opacity=".9"/>' +
          mtn('70 84 146 26h18l76 58z', 'url(#' + b + ')') + mtn('140 34 146 26h18l7 9-8 4-6-4-7 4z', '#fff') +
          '<path d="M155 26q-4 10 2 18" stroke="#ff7a3d" stroke-width="3" fill="none" opacity=".7"/>' +
          '<rect y="84" width="320" height="26" fill="url(#' + c + ')"/>' + mtn('100 84 150 100h10l50-16z', '#4e4954', ' opacity=".25"') +
          '<path d="M0 84q30-10 60 0zM250 84q30-12 70-2v2z" fill="#3f7f3a"/>';
        break;
      case 'animales':
        s += lin(a, 0, 1, [[0, '#a9d8f5'], [1, '#f3fbff']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          mtn('150 86 176 30 186 46 198 18 210 46 222 34 250 86z', '#6a6f7c') + mtn('193 30 198 18 203 31 198 28zM172 38 176 30 180 38z', '#fff') +
          mtn('0 110 0 80q160-22 320 0V110z', '#c9b27a') + mtn('0 110q160-30 320-8V110z', '#b39b62', ' opacity=".6"') +
          guanaco(84, 86, 1) + guanaco(124, 92, .7);
        break;
      case 'folk':
        s += lin(a, 0, 1, [[0, '#ffd6a8'], [1, '#ffeedd']]) + rad(b, [[0, '#d99a52'], [1, '#9a5a24']], .4, .4, .7) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          '<g transform="translate(150 60) rotate(-28)"><ellipse cx="-30" cy="0" rx="34" ry="28" fill="url(#' + b + ')" stroke="#6b3a12" stroke-width="2"/><ellipse cx="10" cy="0" rx="24" ry="20" fill="url(#' + b + ')" stroke="#6b3a12" stroke-width="2"/><circle cx="-6" cy="0" r="9" fill="#3a1e08"/>' +
          '<rect x="22" y="-5" width="86" height="10" rx="2" fill="#4a2a10"/><rect x="104" y="-8" width="20" height="16" rx="3" fill="#3a1e08"/>' +
          '<path d="M-44-3h150M-44 0h150M-44 3h150" stroke="#f3e8d0" stroke-width=".8"/></g>' +
          '<path d="M250 30v34a6 5 0 1 1-3-4V36l22-6v28a6 5 0 1 1-3-4V30z" fill="#6b2d73"/><path d="M60 26v24a6 5 0 1 1-3-4V26z" fill="#c8102e"/>';
        break;
      case 'fiestas_patrias':
        s += lin(a, 0, 1, [[0, '#7cc4f0'], [1, '#e6f5ff']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          '<path d="M0 10q160 40 320 0" fill="none" stroke="#7a5a3a" stroke-width="1.2"/>' +
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) { var x = 12 + i * 24.5, y = 10 + 40 * (x / 320) * (1 - x / 320) * 1.0; var col = ['#c8102e', '#fff', '#0039a6'][i % 3]; return '<path d="M' + (x - 8) + ' ' + f1(y) + 'h16l-8 14z" fill="' + col + '" stroke="#d6d6d6" stroke-width=".6"/>'; }).join('') +
          kite(80, 48, '#c8102e', '#ffffff', -12) + kite(196, 36, '#0039a6', '#ffd54a', 10) + kite(262, 60, '#2e9e62', '#ffffff', -6) +
          mtn('0 110q160-36 320 0z', '#7fb85a');
        break;
      case 'timeline':
        s += lin(a, 0, 1, [[0, '#f6e7c4'], [1, '#ead6a8']]) + lin(b, 0, 1, [[0, '#ffe08a'], [1, '#e0a52a']]) + '</defs>' +
          '<rect width="320" height="110" fill="url(#' + a + ')"/>' +
          '<path d="M20 40h200" stroke="#7a5a2a" stroke-width="3" stroke-linecap="round"/><path d="M222 40l-10-6v12z" fill="#7a5a2a"/>' +
          [36, 78, 120, 162, 200].map(function (x, i) { return '<circle cx="' + x + '" cy="40" r="7" fill="' + ['#c8102e', '#0039a6', '#2e9e62', '#b7791f', '#6b2d73'][i] + '" stroke="#fff" stroke-width="2"/>'; }).join('') +
          '<g transform="translate(262 40) scale(.8)"><path d="M-16-24h32M-16 24h32" stroke="#6b4a1a" stroke-width="4" stroke-linecap="round"/><path d="M-12-22q0 14 12 22-12 8-12 22h24q0-14-12-22 12-8 12-22z" fill="#fff8e6" stroke="#6b4a1a" stroke-width="2"/><path d="M-7-14h14L0-4zM-8 20q8-10 16 0z" fill="url(#' + b + ')"/></g>';
        break;
      default:
        s += lin(a, 0, 1, [[0, '#cfe8ff'], [1, '#fff']]) + '</defs><rect width="320" height="110" fill="url(#' + a + ')"/>';
    }
    return s + '</svg>';
  }
  function araucaria(x, y, k) {
    var t = '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-2 0V-62h4V0z" fill="#4a3424"/>';
    [[-62, 18], [-52, 26], [-42, 32], [-32, 36]].forEach(function (b) { t += '<path d="M0 ' + b[0] + 'q' + (-b[1]) + ' 0 ' + (-b[1]) + ' 8M0 ' + b[0] + 'q' + b[1] + ' 0 ' + b[1] + ' 8" stroke="#2f5a2c" stroke-width="4" fill="none" stroke-linecap="round"/>'; });
    return t + '<path d="M-22-58q22-14 44 0q-22-6-44 0z" fill="#2f5a2c"/></g>';
  }
  function ship(x, y, k) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-40 0h80l-10 14h-62z" fill="#7a4a24" stroke="#4a2a10" stroke-width="1.5"/><path d="M-36 0h72" stroke="#c9a05a" stroke-width="2"/>' +
      '<path d="M-14 0v-52M12 0v-46" stroke="#4a2a10" stroke-width="2.4"/>' +
      '<path d="M-14-50q16 12 0 24zM-14-24q18 10 0 22zM12-44q14 10 0 20zM12-22q16 9 0 20z" fill="#fffaf0" stroke="#bfb6a0" stroke-width="1.2"/>' +
      '<path d="M-14-52l10 3-10 3z" fill="#c8102e"/></g>';
  }
  function compassRose(x, y, r) {
    return '<g transform="translate(' + x + ' ' + y + ')" opacity=".75"><circle r="' + r + '" fill="none" stroke="#7a5a2a" stroke-width="1.2"/><path d="M0-' + r + ' 5-5 ' + r + ' 0 5 5 0 ' + r + '-5 5-' + r + ' 0-5-5z" fill="#7a5a2a"/><path d="M0-' + r + ' 5-5H-5z" fill="#c8102e"/></g>';
  }
  function condor(x, y, k) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M0 0q-20-10-48-4 10 2 14 6-10 0-18 6 16-2 24 2q14 2 28-4zM0 0q20-10 48-4-10 2-14 6 10 0 18 6-16-2-24 2Q14 14 0 8z" fill="#1c1b29"/>' +
      '<path d="M-30 2q10 2 18 4M30 2q-10 2-18 4" stroke="#fff" stroke-width="2.4" opacity=".85"/><ellipse cx="0" cy="5" rx="5" ry="7" fill="#1c1b29"/><circle cx="0" cy="-3" r="3.4" fill="#e6b8a0"/><path d="M-4 1h8" stroke="#fff" stroke-width="2.6"/></g>';
  }
  function guanaco(x, y, k) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-22-20q0-8 10-8h18q8 0 10 6l4-22q1-5 5-5 5 0 6 4l2 3-5 2-6 22q-1 8-8 10v16h-4V-6h-14V8h-4V-8q-6-2-8-6z" fill="#b5652e" stroke="#6b3412" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M-16-6V8M-8-6V8M4-6v14M10-6v14" stroke="#6b3412" stroke-width="2.6" stroke-linecap="round"/><path d="M-18-14q8 6 26 2" stroke="#f3e2c8" stroke-width="3" fill="none" opacity=".8"/><circle cx="21" cy="-47" r="1.2" fill="#1c1b29"/></g>';
  }
  function kite(x, y, c1, c2, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><path d="M0-22 16 0 0 22-16 0z" fill="' + c1 + '" stroke="#5a4a3a" stroke-width="1"/><path d="M0-22V22M-16 0h32" stroke="' + c2 + '" stroke-width="2"/><path d="M0 22q-6 12 4 20t-2 22" stroke="#5a4a3a" fill="none" stroke-width="1"/>' +
      '<path d="M-2 32l4 2-4 2zM-1 44l4 2-4 2z" fill="' + c1 + '"/></g>';
  }
  function starsField(n, w, h) {
    var t = '', seed = 7;
    for (var i = 0; i < n; i++) { seed = (seed * 9301 + 49297) % 233280; var x = seed / 233280 * w; seed = (seed * 9301 + 49297) % 233280; var y = seed / 233280 * h; t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (i % 5 === 0 ? 1.6 : .9) + '" fill="#fff" opacity="' + (i % 3 ? .7 : 1) + '"/>'; }
    return t;
  }

  // ── timeline vignettes (64×64 badges) ──
  function vignette(kind) {
    var a = nid('v'), cl = nid('vc'), s = '<svg class="dc-vig" viewBox="0 0 64 64" aria-hidden="true"><defs>';
    var bg = function (c1, c2) { return lin(a, 0, 1, [[0, c1], [1, c2]]) + '<clipPath id="' + cl + '"><circle cx="32" cy="32" r="31"/></clipPath></defs><g clip-path="url(#' + cl + ')"><circle cx="32" cy="32" r="31" fill="url(#' + a + ')"/>'; };
    switch (kind) {
      case 'chinchorro':
        s += bg('#f6dcae', '#d9a868') + '<path d="M0 48q32-8 64 0v16H0z" fill="#c98f4c"/><path d="M8 50q24-6 48 0" stroke="#3b8fc4" stroke-width="3" fill="none"/>' +
          '<ellipse cx="32" cy="30" rx="11" ry="14" fill="#2a2420" stroke="#120f0d" stroke-width="1.5"/><ellipse cx="27.5" cy="27" rx="2.6" ry="1.6" fill="#d9a868"/><ellipse cx="36.5" cy="27" rx="2.6" ry="1.6" fill="#d9a868"/><ellipse cx="32" cy="36" rx="3" ry="1.4" fill="#d9a868"/><path d="M21 22q11-10 22 0" stroke="#7a3a1a" stroke-width="3" fill="none"/>';
        break;
      case 'moai':
        s += bg('#ffc48a', '#ffe7c4') + '<path d="M0 46q32-6 64 0v18H0z" fill="#3b8fc4"/><path d="M8 48q24-12 48 0z" fill="#7fa65a"/><g transform="translate(32 34) scale(.62)">' + moaiGlyph() + '</g>';
        break;
      case 'ship':
        s += bg('#cfe8ff', '#7fbbe0') + '<path d="M0 44h64v20H0z" fill="#2e6f9e"/>' + ship(32, 44, .55);
        break;
      case 'helmet':
        s += bg('#f3e3bf', '#d9bf86') + '<path d="M14 40q0-18 18-20 18 2 18 20z" fill="#b9c2cc" stroke="#5a636e" stroke-width="2"/><path d="M8 40h48q-4 6-24 6T8 40z" fill="#9aa4b0" stroke="#5a636e" stroke-width="2"/><path d="M32 20q-2-8 6-10" stroke="#c8102e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M20 32q12-6 24 0" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>';
        break;
      case 'city':
        s += bg('#bfe3ff', '#eef8ff') + mtn('0 46 14 24 22 34 34 16 46 32 64 22V64H0z', '#9aa7ba') + mtn('30 21 34 16 38 22z', '#fff') +
          '<path d="M14 54V40l6-4 6 4v14z" fill="#e9dcc0" stroke="#7a5a2a" stroke-width="1.2"/><path d="M28 54V30h8v24z" fill="#f3ead6" stroke="#7a5a2a" stroke-width="1.2"/><path d="M32 22v8M29 25h6" stroke="#7a5a2a" stroke-width="1.6"/><path d="M38 54V42h12v12z" fill="#e9dcc0" stroke="#7a5a2a" stroke-width="1.2"/><path d="M0 54h64v10H0z" fill="#7fa65a"/>';
        break;
      case 'araucaria':
        s += bg('#d7efd2', '#a8d3a0') + '<path d="M0 50h64v14H0z" fill="#6b8f4a"/>' + araucaria(32, 54, .62);
        break;
      case 'flag':
        s += bg('#e6f2ff', '#bcd6f2') + '<path d="M16 12v44" stroke="#5a4a3a" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M17 14q12-4 22 0t18 0v24q-8 4-18 0t-22 0z" fill="#fff" stroke="#c9c9c9"/><path d="M17 26q12-4 22 0t18 0v12q-8 4-18 0t-22 0z" fill="#c8102e"/><path d="M17 14q6-2 12-1v13q-6-1-12 0z" fill="#0039a6"/><path d="M23 16.5l1 2.4 2.6.2-2 1.6.7 2.5-2.3-1.4-2.2 1.4.6-2.5-2-1.6 2.6-.2z" fill="#fff"/>';
        break;
      case 'andes':
        s += bg('#9fd3f5', '#e6f4ff') + mtn('0 52 16 22 26 34 38 12 52 34 64 26V64H0z', '#7d8796') + mtn('34 18 38 12 42 19 38 17zM13 28l3-6 3 6z', '#fff') +
          '<path d="M0 52h64v12H0z" fill="#9a8a5a"/><path d="M40 40v12" stroke="#5a4a3a" stroke-width="1.6"/><path d="M40 40h8l-2 3 2 3h-8z" fill="#c8102e"/><path d="M12 52l3-6 3 6M22 52l3-6 3 6" stroke="#3a2a1a" stroke-width="2" fill="none"/>';
        break;
      case 'fort':
        s += bg('#cfe8ff', '#9fc6e0') + '<path d="M0 50h64v14H0z" fill="#4f7f9a"/><path d="M10 50V32h6v4h6v-4h6v4h6v-4h6v4h6v-4h6v18z" fill="#a08a6a" stroke="#5a4a3a" stroke-width="1.4"/><path d="M28 50v-8a4 4 0 0 1 8 0v8z" fill="#3a2a1a"/><path d="M32 32V16" stroke="#5a4a3a" stroke-width="1.6"/><path d="M32 16h10v4H32z" fill="#c8102e"/><path d="M32 16h4v2h-4z" fill="#0039a6"/>';
        break;
      case 'train':
        s += bg('#ffe3b8', '#f3c27e') + '<path d="M0 50h64v14H0z" fill="#b08a5a"/><path d="M4 52h56" stroke="#5a4a3a" stroke-width="2"/>' +
          '<rect x="14" y="30" width="26" height="16" rx="2" fill="#2f3b4a"/><rect x="38" y="22" width="14" height="24" rx="2" fill="#c8102e"/><rect x="41" y="26" width="8" height="7" fill="#cfe8ff"/><path d="M18 30V20h6v10" fill="#2f3b4a"/><path d="M8 46h48" stroke="#2f3b4a" stroke-width="3"/>' +
          '<circle cx="20" cy="48" r="4" fill="#1c1b29" stroke="#c9a05a" stroke-width="1.5"/><circle cx="32" cy="48" r="4" fill="#1c1b29" stroke="#c9a05a" stroke-width="1.5"/><circle cx="46" cy="48" r="5" fill="#1c1b29" stroke="#c9a05a" stroke-width="1.5"/>' +
          '<path d="M21 16q-6-6 0-10 6-2 8 3 6-1 6 5" fill="#fff" opacity=".85"/>';
        break;
      case 'book':
        s += bg('#e9e3ff', '#c3b6f2') + '<path d="M10 46q11-6 22 0V20q-11-6-22 0z" fill="#fffaf0" stroke="#6b5aa8" stroke-width="1.6"/><path d="M32 46q11-6 22 0V20q-11-6-22 0z" fill="#fff4e0" stroke="#6b5aa8" stroke-width="1.6"/><path d="M14 26q8-3 14 0M14 31q8-3 14 0M36 26q8-3 14 0M36 31q8-3 14 0" stroke="#b8ab94" stroke-width="1.3" fill="none"/>' +
          '<g transform="translate(32 12)"><path d="M0-6 1.8-1.6 6.6-1.4 2.8 1.6 4 6.2 0 3.6-4 6.2-2.8 1.6-6.6-1.4-1.8-1.6z" fill="#f5b91a" stroke="#a86b00" stroke-width=".8"/></g>';
        break;
      case 'quake':
        s += bg('#ffe0d6', '#f6b8a6') + '<path d="M0 46h64v18H0z" fill="#8a6a4a"/><path d="M30 46l4 6-3 4 4 8" stroke="#3a2a1a" stroke-width="2" fill="none"/>' +
          '<path d="M4 30h10l3-8 4 18 4-26 4 30 4-20 4 12 3-6h20" fill="none" stroke="#c8102e" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
        break;
      case 'capsule':
        s += bg('#f6dcae', '#d9a868') + '<path d="M0 50q32-6 64 0v14H0z" fill="#b07a40"/><path d="M32 4v12" stroke="#5a4a3a" stroke-width="2"/>' +
          '<rect x="24" y="16" width="16" height="34" rx="8" fill="#fff" stroke="#5a636e" stroke-width="1.6"/><path d="M24 26h16M24 40h16" stroke="#c8102e" stroke-width="3"/><path d="M24 33h16" stroke="#0039a6" stroke-width="3"/><rect x="29" y="20" width="6" height="4" rx="1" fill="#9fd3f5"/>';
        break;
      default:
        s += bg('#eee', '#ccc');
    }
    return s + '</g><circle cx="32" cy="32" r="31" fill="none" stroke="#fff" stroke-width="2"/><circle cx="32" cy="32" r="31.5" fill="none" stroke="#000" stroke-opacity=".12"/></svg>';
  }

  // ── memory cards ──
  var backCache = null;
  function cardBack() {
    if (backCache) return backCache;
    var a = nid('cb');
    backCache = '<svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + lin(a, 0, 1, [[0, '#1d3f8f'], [1, '#0c2560']]) + '</defs>' +
      '<rect width="60" height="80" fill="url(#' + a + ')"/><rect x="4" y="4" width="52" height="72" rx="5" fill="none" stroke="#e8c25a" stroke-width="1.4"/>' +
      '<path d="M4 62 16 44l6 8 10-16 10 14 6-6 8 18v14H4z" fill="#5b7bc0" opacity=".55"/><path d="M28 39l4-3 4 5-4-1z" fill="#fff" opacity=".8"/>' +
      '<path d="M30 16l3.5 7.2 7.9.9-5.8 5.4 1.5 7.8L30 33.5l-7.1 3.8 1.5-7.8-5.8-5.4 7.9-.9z" fill="#fff"/>' +
      '<path d="M4 70h52v6H4z" fill="#c8102e" opacity=".9"/></svg>';
    return backCache;
  }
  var CAT_COL = { his: ['#c8102e', '#ffe3e3'], pue: ['#9a5a24', '#fbe8d2'], art: ['#6b2d73', '#f2e3f6'], dep: ['#047857', '#dcf5ea'], nat: ['#1d4ed8', '#e0eaff'], sci: ['#0e7490', '#dcf4f8'] };
  function medallion(name, cat) {
    var c = CAT_COL[cat] || CAT_COL.his;
    var ini = String(name).replace(/^(Pueblo|Terremoto de|Observatorio)\s+/, '').split(/\s+/).filter(function (w) { return /^[A-ZÁÉÍÓÚÑ]/.test(w); }).slice(0, 2).map(function (w) { return w.charAt(0); }).join('') || name.charAt(0);
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="' + c[1] + '" stroke="' + c[0] + '" stroke-width="2.5"/><circle cx="24" cy="24" r="17" fill="none" stroke="' + c[0] + '" stroke-opacity=".35" stroke-dasharray="2 2.4"/>' +
      '<text x="24" y="30.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="17" fill="' + c[0] + '">' + esc(ini) + '</text></svg>';
  }

  return { mapSVG: mapSVG, relief: relief, regionThumb: regionThumb, islandThumb: islandThumb, P: P, regionById: regionById, geoById: geoById, moaiGlyph: moaiGlyph, esc: esc,
    icon: icon, star: star, medal: medal, zoneIcon: zoneIcon, banner: banner, vignette: vignette, cardBack: cardBack, medallion: medallion };
})();
