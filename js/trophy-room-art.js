/* ================================================================
   TROPHY ROOM — trophy-room-art.js
   Inline SVG for the Trophy Room: medals and trophy cups in bronze,
   silver and gold with the app's icon embossed in the metal, locked
   silhouettes, and the rank mountain. No images, no network.
   ================================================================ */

var TrophyArt = (function () {
  'use strict';

  var _n = 0;
  function uid(p) { _n++; return (p || 'ta') + _n; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // light, mid, dark, deep (for shadows)
  var METALS = {
    bronze: { l: '#f6cfa6', m: '#c47f45', d: '#7c461c', x: '#4a2a10', name: 'Bronze' },
    silver: { l: '#ffffff', m: '#c3cad4', d: '#7c8695', x: '#4a525e', name: 'Silver' },
    gold:   { l: '#fff3b8', m: '#e3b23c', d: '#93610c', x: '#5a3a05', name: 'Gold' }
  };

  function hex2(h) {
    return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  }

  function defs(u, m) {
    var x = hex2(m.x), d = hex2(m.d), md = hex2(m.m), l = hex2(m.l);
    function tv(i) { return [x[i], d[i], md[i], l[i], l[i]].map(function (v) { return v.toFixed(3); }).join(' '); }
    return '<defs>' +
      '<linearGradient id="' + u + 'rim" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + m.l + '"/><stop offset=".35" stop-color="' + m.m + '"/>' +
        '<stop offset=".6" stop-color="' + m.d + '"/><stop offset=".8" stop-color="' + m.m + '"/><stop offset="1" stop-color="' + m.l + '"/></linearGradient>' +
      '<radialGradient id="' + u + 'face" cx=".38" cy=".32" r=".8">' +
        '<stop offset="0" stop-color="' + m.l + '"/><stop offset=".55" stop-color="' + m.m + '"/><stop offset="1" stop-color="' + m.d + '"/></radialGradient>' +
      '<linearGradient id="' + u + 'cup" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="' + m.d + '"/><stop offset=".22" stop-color="' + m.m + '"/><stop offset=".38" stop-color="' + m.l + '"/>' +
        '<stop offset=".55" stop-color="' + m.m + '"/><stop offset="1" stop-color="' + m.d + '"/></linearGradient>' +
      // Icon pressed into the metal: greyscale → metal ramp, plus a bevel highlight and a dark lower edge.
      '<filter id="' + u + 'emb" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">' +
        '<feColorMatrix in="SourceGraphic" type="saturate" values="0" result="g"/>' +
        '<feComponentTransfer in="g" result="tint">' +
          '<feFuncR type="table" tableValues="' + tv(0) + '"/><feFuncG type="table" tableValues="' + tv(1) + '"/><feFuncB type="table" tableValues="' + tv(2) + '"/>' +
        '</feComponentTransfer>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation=".9" result="ab"/>' +
        '<feSpecularLighting in="ab" surfaceScale="2.6" specularConstant=".9" specularExponent="18" lighting-color="#ffffff" result="sp">' +
          '<feDistantLight azimuth="225" elevation="48"/></feSpecularLighting>' +
        '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>' +
        '<feOffset in="SourceAlpha" dx="-.6" dy="-.8" result="up"/>' +
        '<feFlood flood-color="' + m.x + '" flood-opacity=".55"/><feComposite in2="up" operator="in" result="edge"/>' +
        '<feComposite in="tint" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0" result="lit"/>' +
        '<feMerge><feMergeNode in="edge"/><feMergeNode in="lit"/></feMerge>' +
      '</filter>' +
      '<filter id="' + u + 'sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".45"/></filter>' +
      '</defs>';
  }

  function emoji(x, y, size, ch, filterId, extra) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-size="' + size + '"' +
      ' font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"' +
      (filterId ? ' filter="url(#' + filterId + ')"' : '') + (extra || '') + '>' + esc(ch) + '</text>';
  }

  // A medal on a ribbon (bronze / silver). viewBox 0 0 100 130.
  function medal(metal, icon, ribbon) {
    var m = METALS[metal] || METALS.bronze;
    var u = uid('md');
    var rc = /^#[0-9a-fA-F]{6}$/.test(ribbon) ? ribbon : '#7C3AED';
    var s = defs(u, m);
    // ribbon straps
    s += '<path d="M30,0 L46,0 L58,58 L42,62Z" fill="' + rc + '"/>';
    s += '<path d="M70,0 L54,0 L42,58 L58,62Z" fill="' + rc + '" style="filter:brightness(.82)"/>';
    s += '<path d="M35,0 L39,0 L50,52 L47,53Z" fill="#fff" opacity=".55"/>';
    s += '<path d="M65,0 L61,0 L50,52 L53,53Z" fill="#fff" opacity=".4"/>';
    // clasp
    s += '<rect x="40" y="54" width="20" height="9" rx="2.5" fill="url(#' + u + 'rim)" stroke="' + m.d + '" stroke-width=".8"/>';
    // disc
    s += '<g filter="url(#' + u + 'sh)">';
    s += '<circle cx="50" cy="92" r="34" fill="url(#' + u + 'rim)"/>';
    s += '</g>';
    s += '<circle cx="50" cy="92" r="28.5" fill="url(#' + u + 'face)" stroke="' + m.d + '" stroke-width="1.2"/>';
    // beaded edge
    for (var i = 0; i < 28; i++) {
      var a = i / 28 * Math.PI * 2;
      s += '<circle cx="' + (50 + 31.3 * Math.cos(a)).toFixed(2) + '" cy="' + (92 + 31.3 * Math.sin(a)).toFixed(2) + '" r="1.05" fill="' + m.l + '" opacity=".85"/>';
    }
    // laurel sprigs (silver gets them)
    if (metal === 'silver') {
      for (var k = 0; k < 5; k++) {
        var ang = Math.PI * (0.62 + k * 0.1);
        [1, -1].forEach(function (side) {
          var cx = 50 + side * 24 * Math.cos(ang), cy = 92 + 24 * Math.sin(ang);
          s += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="3.2" ry="1.4" fill="' + m.d + '" opacity=".55" transform="rotate(' + (side * (ang * 57.3 - 90)).toFixed(0) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>';
        });
      }
    }
    s += emoji(50, 92, 30, icon, u + 'emb');
    // shine
    s += '<path d="M28,78 a26,26 0 0 1 20,-13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>';
    return '<svg viewBox="0 0 100 130" class="tr-medal-svg" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  // A trophy cup (gold). viewBox 0 0 100 130.
  function cup(metal, icon) {
    var m = METALS[metal] || METALS.gold;
    var u = uid('cp');
    var s = defs(u, m);
    s += '<g filter="url(#' + u + 'sh)">';
    // handles
    s += '<path d="M24,34 C6,34 6,64 30,68" fill="none" stroke="url(#' + u + 'rim)" stroke-width="6" stroke-linecap="round"/>';
    s += '<path d="M76,34 C94,34 94,64 70,68" fill="none" stroke="url(#' + u + 'rim)" stroke-width="6" stroke-linecap="round"/>';
    // bowl
    s += '<path d="M20,22 H80 C80,58 70,76 50,80 C30,76 20,58 20,22Z" fill="url(#' + u + 'cup)"/>';
    s += '<ellipse cx="50" cy="22" rx="30" ry="5" fill="' + m.d + '"/>';
    s += '<ellipse cx="50" cy="21.4" rx="27" ry="3.6" fill="' + m.x + '" opacity=".55"/>';
    // stem + knot
    s += '<path d="M44,80 H56 L54,96 H46Z" fill="url(#' + u + 'cup)"/>';
    s += '<ellipse cx="50" cy="88" rx="8" ry="3.2" fill="url(#' + u + 'rim)"/>';
    // foot + plinth
    s += '<path d="M34,104 C36,98 64,98 66,104Z" fill="url(#' + u + 'cup)"/>';
    s += '<rect x="26" y="104" width="48" height="18" rx="2.5" fill="#3b2414"/>';
    s += '<rect x="26" y="104" width="48" height="4" rx="1.5" fill="#5a3a22"/>';
    s += '<rect x="36" y="110" width="28" height="8" rx="1.5" fill="url(#' + u + 'rim)"/>';
    s += '</g>';
    // embossed icon on the bowl
    s += '<circle cx="50" cy="46" r="15" fill="' + m.m + '" stroke="' + m.d + '" stroke-width="1"/>';
    s += emoji(50, 46, 20, icon, u + 'emb');
    // highlight streak
    s += '<path d="M31,28 C31,50 36,64 44,72" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".6"/>';
    return '<svg viewBox="0 0 100 130" class="tr-medal-svg" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  // Locked: the shape only, dark and faint.
  function silhouette(icon) {
    var u = uid('sl');
    var s = '<filter id="' + u + 'f"><feFlood flood-color="#1c1410"/><feComposite in2="SourceAlpha" operator="in"/></filter>';
    s += '<g fill="#1c1410">';
    s += '<path d="M30,0 L46,0 L58,58 L42,62Z M70,0 L54,0 L42,58 L58,62Z"/>';
    s += '<circle cx="50" cy="92" r="34"/>';
    s += '</g>';
    s += '<circle cx="50" cy="92" r="27" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>';
    s += emoji(50, 92, 28, icon, null, ' opacity=".18" style="filter:grayscale(1) brightness(2.2)"');
    return '<svg viewBox="0 0 100 130" class="tr-medal-svg tr-locked-svg" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  function badge(metal, icon, ribbon) {
    if (!metal) return silhouette(icon);
    if (metal === 'gold') return cup('gold', icon);
    return medal(metal, icon, ribbon);
  }

  // ── The rank mountain ──────────────────────────────────────────
  // ranks: [{minStars, icon, name}], cur: index, user: {avatar, color}
  function mountain(ranks, cur, user, progress, width) {
    var u = uid('mt');
    var W = Math.max(360, Math.round(width || 360)), H = 220, sx = W / 360;
    var n = ranks.length;
    var x0 = 30 * sx, x1 = 318 * sx, yb = 196, yt = 44;
    var pts = [];
    for (var i = 0; i < n; i++) pts.push([x0 + i * (x1 - x0) / (n - 1), yb - i * (yb - yt) / (n - 1)]);
    var color = /^#[0-9a-fA-F]{6}$/.test(user.color) ? user.color : '#7C3AED';
    var s = '<defs>' +
      '<linearGradient id="' + u + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd9f5"/><stop offset="1" stop-color="#f3f8fd"/></linearGradient>' +
      '<linearGradient id="' + u + 'rock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".55" stop-color="#7b8590"/><stop offset="1" stop-color="#5d6570"/></linearGradient>' +
      '<linearGradient id="' + u + 'far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7c6d8"/><stop offset="1" stop-color="#d7e1ec"/></linearGradient>' +
      '<linearGradient id="' + u + 'stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7e2d8"/><stop offset="1" stop-color="#b9b1a2"/></linearGradient>' +
      '<linearGradient id="' + u + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#d4a017"/><stop offset="1" stop-color="#a16207"/></linearGradient>' +
      '<filter id="' + u + 'sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".35"/></filter>' +
      '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#' + u + 'sky)"/>';
    s += '<circle cx="64" cy="46" r="16" fill="#fff4c2" opacity=".9"/><circle cx="64" cy="46" r="26" fill="#fff4c2" opacity=".25"/>';
    // far range + mountain, stretched to the width (text and steps are not)
    s += '<g transform="scale(' + sx.toFixed(3) + ',1)">';
    s += '<path d="M0,150 L40,112 L78,130 L128,84 L168,118 L210,92 L250,120 L300,96 L360,128 L360,220 L0,220Z" fill="url(#' + u + 'far)"/>';
    // main mountain
    s += '<path d="M0,220 L0,200 L60,170 L120,140 L190,98 L246,64 L300,26 L330,46 L360,70 L360,220Z" fill="url(#' + u + 'rock)"/>';
    s += '<path d="M300,26 L330,46 L360,70 L360,100 L330,74 L300,56Z" fill="#000" opacity=".12"/>';
    s += '<path d="M276,42 L300,26 L326,44 L314,48 L304,40 L294,50 L286,44Z" fill="#fbfdff"/>';
    s += '</g>';
    // grass foot
    s += '<path d="M0,220 L0,196 C60,186 120,200 190,206 C260,212 320,204 360,200 L360,220Z" fill="#8fb26f" transform="scale(' + sx.toFixed(3) + ',1)"/>';
    // stone staircase
    for (var k = 0; k < n; k++) {
      var p = pts[k], w = 34;
      s += '<g filter="url(#' + u + 'sh)"><rect x="' + (p[0] - w / 2) + '" y="' + p[1] + '" width="' + w + '" height="' + (H - p[1]) + '" fill="url(#' + u + 'stone)"/>';
      s += '<rect x="' + (p[0] - w / 2) + '" y="' + p[1] + '" width="' + w + '" height="4" fill="#f6f2ea"/></g>';
      for (var c = 1; c * 14 < H - p[1]; c++) s += '<line x1="' + (p[0] - w / 2) + '" y1="' + (p[1] + c * 14) + '" x2="' + (p[0] + w / 2) + '" y2="' + (p[1] + c * 14) + '" stroke="#a39a8a" stroke-width=".6" opacity=".6"/>';
    }
    // flags
    for (var f = 0; f < n; f++) {
      var q = pts[f], got = f <= cur;
      var fx = q[0] + 10, fy = q[1];
      s += '<line x1="' + fx + '" y1="' + fy + '" x2="' + fx + '" y2="' + (fy - 26) + '" stroke="#5b5146" stroke-width="1.3"/>';
      s += '<path d="M' + fx + ',' + (fy - 26) + ' L' + (fx + 15) + ',' + (fy - 21) + ' L' + fx + ',' + (fy - 16) + 'Z" fill="' + (got ? 'url(#' + u + 'gold)' : '#c9ccd2') + '"/>';
      s += '<text x="' + (q[0] - 4) + '" y="' + (fy - 9) + '" text-anchor="middle" font-size="12" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"' +
        (got ? '' : ' opacity=".4" style="filter:grayscale(1)"') + '>' + esc(ranks[f].icon) + '</text>';
    }
    // dotted route from current step to the next, filled by progress
    if (cur < n - 1) {
      var a = pts[cur], b = pts[cur + 1];
      s += '<line x1="' + a[0] + '" y1="' + (a[1] - 2) + '" x2="' + b[0] + '" y2="' + (b[1] - 2) + '" stroke="#fff" stroke-width="3" stroke-dasharray="2 4" stroke-linecap="round" opacity=".9"/>';
      var px = a[0] + (b[0] - a[0]) * progress, py = a[1] + (b[1] - a[1]) * progress;
      s += '<line x1="' + a[0] + '" y1="' + (a[1] - 2) + '" x2="' + px.toFixed(1) + '" y2="' + (py - 2).toFixed(1) + '" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>';
    }
    // avatar on the current step
    var ap = pts[cur];
    s += '<g class="tr-climber" transform="translate(' + ap[0] + ',' + (ap[1] - 20) + ')">' +
      '<ellipse cx="0" cy="19" rx="11" ry="3" fill="#000" opacity=".25"/>' +
      '<g class="tr-climber-bob"><circle r="15" fill="#fff" stroke="' + color + '" stroke-width="3.5" filter="url(#' + u + 'sh)"/>' +
      '<text y="1" text-anchor="middle" dominant-baseline="central" font-size="17" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">' + esc(user.avatar || '🙂') + '</text></g></g>';
    // name bubble
    var label = ranks[cur].name;
    var bw = label.length * 7 + 18;
    var bx = Math.min(W - bw / 2 - 4, Math.max(bw / 2 + 4, ap[0]));
    var by = ap[1] - 56;
    if (by < 14) { by = ap[1] - 20; bx = ap[0] - 22 - bw / 2; }
    s += '<g transform="translate(' + bx.toFixed(1) + ',' + by + ')"><rect x="' + (-bw / 2) + '" y="-11" width="' + bw + '" height="22" rx="11" fill="#312e81"/>' +
      '<text y="4.5" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="11.5" fill="#fff">' + esc(label) + '</text></g>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="tr-mountain-svg" role="img" aria-label="' +
      esc('Rank mountain: ' + label + ', step ' + (cur + 1) + ' of ' + n) + '">' + s + '</svg>';
  }

  return { badge: badge, mountain: mountain, METALS: METALS };
})();
