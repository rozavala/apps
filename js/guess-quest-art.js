/* ================================================================
   GUESS QUEST — hand-built graphics (inline SVG, no images)
   The family car, the road-trip scene (sky, Andes, poplar fields,
   road, km posts, destination with billboard), the clue thermometer
   and small sign pictograms.
   Exposes one global: GuessQuestArt
   ================================================================ */

var GuessQuestArt = (function() {
  'use strict';

  // Scene geometry (viewBox units)
  var W = 600, H = 280;
  var ROAD_Y = 192;          // top of asphalt
  var ROAD_H = 44;
  var TRAVEL = 1400;         // road-layer distance at progress 1
  var CAR_X = 96;

  var uid = 0;
  function nextId(p) { uid++; return 'gq' + p + uid; }

  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function safeColor(c) {
    return (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)) ? c : '#C2410C';
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))); }
    return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }

  // ---------------------------------------------------------------
  //  The family car (side view, facing right). Origin = rear-bottom.
  //  ~192 x 84 units including roof luggage.
  // ---------------------------------------------------------------
  function car(color, opts) {
    opts = opts || {};
    var c = safeColor(color), id = nextId('car');
    var dark = shade(c, -0.35), light = shade(c, 0.35);
    var body = 'M2,58 C2,45 6,39 20,37 L35,11 Q37,7 43,7 L124,7 Q130,7 134,11 L158,35 L180,39 Q190,41 190,51 L190,58 Q190,64 184,64 L8,64 Q2,64 2,58 Z';
    function wheel(cx) {
      var spokes = '';
      for (var i = 0; i < 5; i++) {
        var a = i * Math.PI * 2 / 5;
        spokes += '<line x1="' + cx + '" y1="64" x2="' + (cx + Math.cos(a) * 8).toFixed(2) + '" y2="' + (64 + Math.sin(a) * 8).toFixed(2) + '" stroke="#7b8490" stroke-width="2" stroke-linecap="round"/>';
      }
      return '<circle cx="' + cx + '" cy="64" r="18" fill="' + shade(c, -0.6) + '"/>' +
        '<g class="gq-wheel">' +
          '<circle cx="' + cx + '" cy="64" r="15" fill="#1d1f24"/>' +
          '<circle cx="' + cx + '" cy="64" r="14" fill="none" stroke="#33363d" stroke-width="1.4" stroke-dasharray="2 2.2"/>' +
          '<circle cx="' + cx + '" cy="64" r="9.5" fill="url(#' + id + 'rim)"/>' +
          spokes +
          '<circle cx="' + cx + '" cy="64" r="3" fill="#59616c"/>' +
        '</g>';
    }
    function head(cx, cy, r) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#2b2f3a" opacity="0.62"/>' +
        '<path d="M' + (cx - r * 1.7) + ',33 Q' + cx + ',' + (cy + r * 0.6) + ' ' + (cx + r * 1.7) + ',33 Z" fill="#2b2f3a" opacity="0.62"/>';
    }
    return '<g class="gq-car">' +
      '<defs>' +
        '<linearGradient id="' + id + 'body" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + light + '"/><stop offset="0.45" stop-color="' + c + '"/><stop offset="1" stop-color="' + dark + '"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + id + 'glass" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#e3f1fb"/><stop offset="0.55" stop-color="#9dbdd3"/><stop offset="1" stop-color="#5d7a90"/>' +
        '</linearGradient>' +
        '<radialGradient id="' + id + 'rim" cx="0.4" cy="0.35" r="0.7">' +
          '<stop offset="0" stop-color="#f4f6f8"/><stop offset="0.7" stop-color="#b9c0c8"/><stop offset="1" stop-color="#8a929c"/>' +
        '</radialGradient>' +
        '<clipPath id="' + id + 'clip"><path d="' + body + '"/></clipPath>' +
      '</defs>' +
      '<ellipse cx="96" cy="80" rx="96" ry="6" fill="#000" opacity="0.22"/>' +
      '<g class="gq-car-body">' +
        // roof rack + luggage
        '<rect x="46" y="2" width="76" height="3" rx="1.5" fill="#3b3f46"/>' +
        '<rect x="54" y="-15" width="40" height="17" rx="3" fill="#8a5a2b"/>' +
        '<rect x="54" y="-15" width="40" height="5" rx="2.5" fill="#a06b36"/>' +
        '<rect x="66" y="-15" width="3" height="17" fill="#5b3a1a"/><rect x="80" y="-15" width="3" height="17" fill="#5b3a1a"/>' +
        '<rect x="96" y="-9" width="22" height="11" rx="5" fill="#2f6db0"/>' +
        '<path d="M99,-6 h16" stroke="#9cc4ee" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="' + body + '" fill="url(#' + id + 'body)"/>' +
        '<g clip-path="url(#' + id + 'clip)">' +
          '<rect x="0" y="44" width="192" height="3" fill="#fff" opacity="0.28"/>' +
          '<rect x="0" y="56" width="192" height="10" fill="#000" opacity="0.12"/>' +
        '</g>' +
        // windows
        '<path d="M28,34 L39,13 L72,13 L72,34 Z" fill="url(#' + id + 'glass)"/>' +
        '<path d="M77,13 L111,13 L111,34 L77,34 Z" fill="url(#' + id + 'glass)"/>' +
        '<path d="M116,13 L127,13 Q129,13 131,15 L151,34 L116,34 Z" fill="url(#' + id + 'glass)"/>' +
        head(55, 24, 5) + head(94, 23, 5.5) + head(127, 21, 6.5) +
        '<path d="M42,14 L36,30" stroke="#fff" stroke-width="3" opacity="0.35" stroke-linecap="round"/>' +
        '<path d="M86,14 L80,30" stroke="#fff" stroke-width="3" opacity="0.3" stroke-linecap="round"/>' +
        '<path d="M130,16 L124,30" stroke="#fff" stroke-width="3" opacity="0.35" stroke-linecap="round"/>' +
        '<path d="M72,13 L77,13 L77,34 L72,34 Z M111,13 L116,13 L116,34 L111,34 Z" fill="' + dark + '"/>' +
        // doors + handles
        '<path d="M74.5,36 L74.5,61 M113.5,36 L113.5,61" stroke="' + dark + '" stroke-width="1.2" opacity="0.8"/>' +
        '<rect x="80" y="40" width="9" height="2.6" rx="1.3" fill="' + shade(c, -0.5) + '"/>' +
        '<rect x="119" y="40" width="9" height="2.6" rx="1.3" fill="' + shade(c, -0.5) + '"/>' +
        // mirror
        '<path d="M150,30 l8,-2 l1,6 l-8,1 z" fill="' + dark + '"/>' +
        // lights + bumpers
        '<path d="M181,42 Q189,43 189,49 L182,49 Z" fill="#fff6c8" stroke="#d8c46b" stroke-width="0.8"/>' +
        '<rect x="2.5" y="41" width="5" height="9" rx="1.5" fill="#d63a2f"/>' +
        '<rect x="168" y="58" width="24" height="7" rx="3" fill="#3a3e45"/>' +
        '<rect x="0" y="58" width="22" height="7" rx="3" fill="#3a3e45"/>' +
        (opts.plate ? '<rect x="173" y="50" width="14" height="6" rx="1" fill="#f7f7f2" stroke="#555" stroke-width="0.5"/>' : '') +
      '</g>' +
      wheel(44) + wheel(150) +
    '</g>';
  }

  // ---------------------------------------------------------------
  //  Scene layers
  // ---------------------------------------------------------------
  function mountains(seed, width, baseY, minH, maxH, fill, snow) {
    var r = rng(seed), pts = [], x = -20, y;
    while (x < width + 40) {
      y = baseY - (minH + r() * (maxH - minH));
      pts.push([x, y]);
      x += 40 + r() * 70;
      pts.push([x, baseY - (minH * 0.35 + r() * minH * 0.6)]);
      x += 30 + r() * 50;
    }
    var d = 'M-20,' + (baseY + 40) + ' ';
    pts.forEach(function(p) { d += 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ' '; });
    d += 'L' + (width + 60) + ',' + (baseY + 40) + ' Z';
    var caps = '';
    if (snow) {
      for (var i = 0; i < pts.length - 1; i += 2) {
        var pk = pts[i], prev = pts[i - 1] || [pk[0] - 40, baseY], nx = pts[i + 1];
        var h = baseY - pk[1];
        if (h < maxH * 0.62) continue;
        var t = 0.3;
        var lx = pk[0] + (prev[0] - pk[0]) * t, ly = pk[1] + (prev[1] - pk[1]) * t;
        var rx = pk[0] + (nx[0] - pk[0]) * t, ry = pk[1] + (nx[1] - pk[1]) * t;
        var mx = (lx + rx) / 2;
        caps += '<path d="M' + pk[0].toFixed(1) + ',' + pk[1].toFixed(1) + ' L' + rx.toFixed(1) + ',' + ry.toFixed(1) +
          ' L' + (mx + 8).toFixed(1) + ',' + (ry - 4).toFixed(1) + ' L' + mx.toFixed(1) + ',' + (Math.max(ly, ry) + 2).toFixed(1) +
          ' L' + (mx - 7).toFixed(1) + ',' + (ly - 3).toFixed(1) + ' L' + lx.toFixed(1) + ',' + ly.toFixed(1) + ' Z" fill="#fbfdff"/>';
        // shadow side of the cap
        caps += '<path d="M' + pk[0].toFixed(1) + ',' + pk[1].toFixed(1) + ' L' + rx.toFixed(1) + ',' + ry.toFixed(1) +
          ' L' + (mx + 8).toFixed(1) + ',' + (ry - 4).toFixed(1) + ' Z" fill="#c9d8e8"/>';
      }
    }
    return '<path d="' + d + '" fill="' + fill + '"/>' + caps;
  }

  function hills(seed, width, baseY, amp, fill) {
    var d = 'M-20,' + (baseY + 80) + ' L-20,' + baseY + ' ';
    var r = rng(seed);
    for (var x = 0; x <= width + 40; x += 60) {
      var y = baseY - Math.sin(x / 170 + seed) * amp - r() * amp * 0.4;
      d += 'Q' + (x - 30) + ',' + (y - amp * 0.3).toFixed(1) + ' ' + x + ',' + y.toFixed(1) + ' ';
    }
    d += 'L' + (width + 60) + ',' + (baseY + 80) + ' Z';
    return '<path d="' + d + '" fill="' + fill + '"/>';
  }

  function poplar(x, y, h) {
    var w = h * 0.2;
    return '<rect x="' + (x - 1.2) + '" y="' + (y - h * 0.2) + '" width="2.4" height="' + (h * 0.2) + '" fill="#5a4630"/>' +
      '<ellipse cx="' + x + '" cy="' + (y - h * 0.58) + '" rx="' + w + '" ry="' + (h * 0.48) + '" fill="#2f5d2a"/>' +
      '<ellipse cx="' + (x - w * 0.3) + '" cy="' + (y - h * 0.62) + '" rx="' + (w * 0.55) + '" ry="' + (h * 0.4) + '" fill="#4b8a3c"/>';
  }
  function bush(x, y, s) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (9 * s) + '" ry="' + (6 * s) + '" fill="#3f7a35"/>' +
      '<ellipse cx="' + (x - 3 * s) + '" cy="' + (y - 2 * s) + '" rx="' + (5 * s) + '" ry="' + (3.5 * s) + '" fill="#5e9e48"/>';
  }

  function vineyard(x, y, w, rows) {
    var out = '<path d="M' + x + ',' + y + ' l' + w + ',0 l-14,' + (rows * 5 + 6) + ' l-' + (w - 28) + ',0 z" fill="#8fbf5a"/>';
    for (var i = 0; i < rows; i++) {
      var yy = y + 4 + i * 5;
      out += '<path d="M' + (x + 4 + i * 2) + ',' + yy + ' L' + (x + w - 4 - i * 2) + ',' + yy + '" stroke="#3d6e2c" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="5 2.5"/>';
    }
    return out;
  }

  function house(x, y) {
    // adobe farmhouse with clay-tile roof and a porch
    return '<g>' +
      '<rect x="' + x + '" y="' + (y - 34) + '" width="70" height="34" fill="#f3ead8"/>' +
      '<rect x="' + x + '" y="' + (y - 6) + '" width="70" height="6" fill="#d9ccb2"/>' +
      '<path d="M' + (x - 8) + ',' + (y - 32) + ' L' + (x + 35) + ',' + (y - 54) + ' L' + (x + 78) + ',' + (y - 32) + ' Z" fill="#b5532f"/>' +
      '<path d="M' + (x - 8) + ',' + (y - 32) + ' L' + (x + 78) + ',' + (y - 32) + '" stroke="#8a3a1e" stroke-width="3"/>' +
      '<path d="M' + (x + 4) + ',' + (y - 38) + ' L' + (x + 66) + ',' + (y - 38) + ' M' + (x + 12) + ',' + (y - 44) + ' L' + (x + 58) + ',' + (y - 44) + '" stroke="#9c4426" stroke-width="1.2" stroke-dasharray="3 2"/>' +
      '<rect x="' + (x + 29) + '" y="' + (y - 24) + '" width="13" height="24" fill="#6b4423"/>' +
      '<rect x="' + (x + 8) + '" y="' + (y - 24) + '" width="13" height="11" fill="#5d7a90"/>' +
      '<rect x="' + (x + 50) + '" y="' + (y - 24) + '" width="13" height="11" fill="#5d7a90"/>' +
      '<path d="M' + (x + 8) + ',' + (y - 18.5) + ' h13 M' + (x + 50) + ',' + (y - 18.5) + ' h13" stroke="#f3ead8" stroke-width="1"/>' +
    '</g>';
  }

  function kmPost(x, km) {
    return '<g>' +
      '<rect x="' + (x - 7) + '" y="' + (ROAD_Y - 26) + '" width="14" height="24" rx="2" fill="#fbfbf6" stroke="#9aa0a6" stroke-width="0.8"/>' +
      '<rect x="' + (x - 7) + '" y="' + (ROAD_Y - 26) + '" width="14" height="6" rx="2" fill="#d22f27"/>' +
      '<text x="' + x + '" y="' + (ROAD_Y - 9) + '" text-anchor="middle" font-size="8" font-weight="800" fill="#222" font-family="Nunito, Arial, sans-serif">' + km + '</text>' +
    '</g>';
  }

  // Billboard at the destination; `content` = emoji or "?"
  function billboard(x, content) {
    var y = ROAD_Y - 6;
    return '<g class="gq-billboard">' +
      '<rect x="' + (x + 12) + '" y="' + (y - 50) + '" width="5" height="50" fill="#6b5a48"/>' +
      '<rect x="' + (x + 63) + '" y="' + (y - 50) + '" width="5" height="50" fill="#6b5a48"/>' +
      '<rect x="' + x + '" y="' + (y - 112) + '" width="80" height="66" rx="5" fill="#fdfaf2" stroke="#6b5a48" stroke-width="4"/>' +
      '<rect x="' + (x + 6) + '" y="' + (y - 106) + '" width="68" height="54" rx="3" fill="#ffe7a8"/>' +
      '<text class="gq-bb-text" x="' + (x + 40) + '" y="' + (y - 66) + '" text-anchor="middle" font-size="' + (content === '?' ? 44 : 38) + '" font-weight="900" fill="#b45309" font-family="Baloo 2, Nunito, Arial, sans-serif">' + content + '</text>' +
    '</g>';
  }

  function flag(x, y) {
    var sq = '';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
      if ((r + c) % 2) sq += '<rect x="' + (x + 2 + c * 6) + '" y="' + (y - 40 + r * 6) + '" width="6" height="6" fill="#222"/>';
    }
    return '<rect x="' + x + '" y="' + (y - 42) + '" width="2.2" height="42" fill="#555"/>' +
      '<rect x="' + (x + 2) + '" y="' + (y - 40) + '" width="24" height="18" fill="#fff" stroke="#444" stroke-width="0.6"/>' + sq;
  }

  // ---------------------------------------------------------------
  //  Full scene. Returns { svg }. Progress is applied with setProgress.
  // ---------------------------------------------------------------
  function scene(opts) {
    opts = opts || {};
    var id = nextId('sc');
    var content = opts.billboard || '?';
    var r = rng(opts.seed || 11);

    // far mountains (Andes)
    var far = mountains(3, W + TRAVEL * 0.15 + 60, 150, 50, 112, 'url(#' + id + 'mtn)', true);
    var far2 = mountains(9, W + TRAVEL * 0.15 + 60, 160, 24, 60, '#8ea8be', false);

    // hills + poplars + vineyards
    var hw = W + TRAVEL * 0.45 + 80;
    var mid = hills(2, hw, 166, 14, '#9cc56a') + hills(5, hw, 177, 10, '#7fb04f');
    for (var x = 20; x < hw; x += 90 + Math.floor(r() * 80)) {
      var kind = r();
      if (kind < 0.45) {
        for (var k = 0; k < 4; k++) mid += poplar(x + k * 14, 176 - (k % 2) * 2, 38 + r() * 14);
      } else if (kind < 0.75) {
        mid += vineyard(x, 172, 70 + r() * 30, 3);
      } else {
        mid += bush(x, 177, 1.1) + bush(x + 18, 178, 0.8);
      }
    }
    // farmhouse near the destination (comes into view at the end)
    mid += house(CAR_X + TRAVEL * 0.45 + 330, 180);

    // road layer
    var rw = W + TRAVEL + 300;
    var road = '<rect x="-20" y="' + (ROAD_Y - 18) + '" width="' + (rw + 40) + '" height="20" fill="#86b24c"/>' +
      '<rect x="-20" y="' + (ROAD_Y - 4) + '" width="' + (rw + 40) + '" height="5" fill="#b9a27c"/>' +
      '<rect x="-20" y="' + ROAD_Y + '" width="' + (rw + 40) + '" height="' + ROAD_H + '" fill="url(#' + id + 'asph)"/>' +
      '<rect x="-20" y="' + (ROAD_Y + 3) + '" width="' + (rw + 40) + '" height="2" fill="#f4f1e6"/>' +
      '<rect x="-20" y="' + (ROAD_Y + ROAD_H - 5) + '" width="' + (rw + 40) + '" height="2" fill="#f4f1e6"/>' +
      '<path d="M-20,' + (ROAD_Y + ROAD_H / 2) + ' L' + (rw + 20) + ',' + (ROAD_Y + ROAD_H / 2) + '" stroke="#f2c230" stroke-width="2.6" stroke-dasharray="22 16"/>' +
      '<rect x="-20" y="' + (ROAD_Y + ROAD_H) + '" width="' + (rw + 40) + '" height="' + (H - ROAD_Y - ROAD_H + 4) + '" fill="#79a443"/>';
    // gravel speckle on the shoulder
    for (var g = 0; g < rw; g += 9) road += '<circle cx="' + (g + r() * 8).toFixed(1) + '" cy="' + (ROAD_Y - 2 + r() * 3).toFixed(1) + '" r="0.9" fill="#8b7656"/>';
    // grass tufts in front
    for (var t = 0; t < rw; t += 26) {
      var tx = t + r() * 20, ty = ROAD_Y + ROAD_H + 8 + r() * 10;
      road += '<path d="M' + tx.toFixed(1) + ',' + ty.toFixed(1) + ' l2,-7 l1.5,7 l2,-9 l1.5,9 l2,-6 l1,6 z" fill="#5d8d34"/>';
    }
    // km posts: every 200 units, counting down to the destination
    var destX = CAR_X + TRAVEL + 210;
    for (var kx = CAR_X + 230, n = 0; kx < destX - 40; kx += 200, n++) {
      road += kmPost(kx, Math.round((destX - kx) / 20));
    }
    road += billboard(destX, content) + flag(destX - 26, ROAD_Y - 2);

    var svg =
      '<svg class="gq-scene-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" role="img" aria-label="' + (opts.label || 'Road trip') + '">' +
        '<defs>' +
          '<linearGradient id="' + id + 'cold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2df"/><stop offset="1" stop-color="#e6f0f7"/></linearGradient>' +
          '<linearGradient id="' + id + 'warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a35c"/><stop offset="0.6" stop-color="#ffd59a"/><stop offset="1" stop-color="#fff1d6"/></linearGradient>' +
          '<linearGradient id="' + id + 'mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f86a3"/><stop offset="1" stop-color="#a7b9cb"/></linearGradient>' +
          '<linearGradient id="' + id + 'asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4d54"/><stop offset="0.5" stop-color="#5a5d64"/><stop offset="1" stop-color="#3e4147"/></linearGradient>' +
          '<radialGradient id="' + id + 'sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff7d1"/><stop offset="0.35" stop-color="#ffe08a"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'cold)"/>' +
        '<rect class="gq-warm" width="' + W + '" height="' + H + '" fill="url(#' + id + 'warm)" opacity="0"/>' +
        '<g class="gq-sun" style="transform:translate(0px,60px)">' +
          '<circle cx="470" cy="96" r="58" fill="url(#' + id + 'sun)"/>' +
          '<circle cx="470" cy="96" r="17" fill="#fff3c0"/>' +
        '</g>' +
        '<g class="gq-clouds">' +
          '<g class="gq-cloud" style="animation-delay:-4s"><ellipse cx="110" cy="52" rx="34" ry="10" fill="#fff" opacity="0.85"/><ellipse cx="124" cy="45" rx="18" ry="10" fill="#fff" opacity="0.85"/></g>' +
          '<g class="gq-cloud" style="animation-delay:-19s"><ellipse cx="330" cy="38" rx="40" ry="9" fill="#fff" opacity="0.7"/><ellipse cx="318" cy="32" rx="16" ry="8" fill="#fff" opacity="0.7"/></g>' +
        '</g>' +
        '<g class="gq-layer gq-far" data-k="0.15">' + far + far2 + '</g>' +
        '<g class="gq-layer gq-mid" data-k="0.45">' + mid + '</g>' +
        '<g class="gq-layer gq-road" data-k="1">' + road + '</g>' +
        '<g class="gq-car-pos" transform="translate(' + CAR_X + ',' + (ROAD_Y - 4) + ') scale(0.82)">' + car(opts.color, { plate: true }) + '</g>' +
      '</svg>';
    return svg;
  }

  // p in [0,1]
  function setProgress(root, p) {
    if (!root) return;
    p = Math.max(0, Math.min(1, p));
    root.querySelectorAll('.gq-layer').forEach(function(g) {
      var k = parseFloat(g.getAttribute('data-k')) || 1;
      g.style.transform = 'translateX(' + (-p * TRAVEL * k).toFixed(1) + 'px)';
    });
    var warm = root.querySelector('.gq-warm');
    if (warm) warm.style.opacity = (p * 0.95).toFixed(2);
    var sun = root.querySelector('.gq-sun');
    if (sun) sun.style.transform = 'translate(0px,' + (60 - p * 52).toFixed(1) + 'px)';
  }

  // Small thermometer for the hot/cold gauge. p in [0,1].
  function thermometer(p) {
    p = Math.max(0, Math.min(1, p));
    var hue = Math.round(210 - p * 205);
    var col = 'hsl(' + hue + ',80%,50%)';
    var h = 4 + p * 22;
    return '<svg viewBox="0 0 16 40" width="14" height="34" aria-hidden="true">' +
      '<rect x="5" y="2" width="6" height="30" rx="3" fill="#fff" stroke="#9aa3ad" stroke-width="1"/>' +
      '<rect x="6.5" y="' + (30 - h).toFixed(1) + '" width="3" height="' + h.toFixed(1) + '" rx="1.5" fill="' + col + '"/>' +
      '<circle cx="8" cy="33" r="5.5" fill="' + col + '" stroke="#9aa3ad" stroke-width="1"/>' +
    '</svg>';
  }

  // Pictograms for route signs (white strokes on the green sign)
  var PICTO = {
    all: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z" fill="#fff"/>',
    animal: '<ellipse cx="12" cy="15" rx="5" ry="4.2" fill="#fff"/><circle cx="6" cy="9" r="2.2" fill="#fff"/><circle cx="10" cy="6" r="2.2" fill="#fff"/><circle cx="14" cy="6" r="2.2" fill="#fff"/><circle cx="18" cy="9" r="2.2" fill="#fff"/>',
    food: '<path d="M4 9h16l-1.6 9.5a2 2 0 0 1-2 1.5H7.6a2 2 0 0 1-2-1.5z" fill="#fff"/><path d="M8 7c0-2 1.5-3 4-3s4 1 4 3" stroke="#fff" stroke-width="2" fill="none"/>',
    plant: '<path d="M12 21V11" stroke="#fff" stroke-width="2"/><path d="M12 12C7 12 4 9 4 4c5 0 8 3 8 8zM12 14c0-4 3-7 8-7 0 4-3 7-8 7z" fill="#fff"/>',
    vehicle: '<path d="M3 15l2-5c.4-1 1.2-1.5 2.2-1.5h9.6c1 0 1.8.5 2.2 1.5l2 5v3H3z" fill="#fff"/><circle cx="7.5" cy="18" r="2.2" fill="#0b6b3a" stroke="#fff" stroke-width="1.5"/><circle cx="16.5" cy="18" r="2.2" fill="#0b6b3a" stroke="#fff" stroke-width="1.5"/>',
    character: '<path d="M12 3l8 4v5c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V7z" fill="#fff"/>',
    place: '<path d="M2 20l7-12 4 6 3-4 6 10z" fill="#fff"/><circle cx="17" cy="6" r="2" fill="#fff"/>',
    object: '<path d="M5 19l9-9M14 4a4 4 0 0 0 5.5 5.5L16 13l-5-5z" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="#fff"/>'
  };
  function picto(id) {
    return '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' + (PICTO[id] || PICTO.all) + '</svg>';
  }

  // Drawn star (for results)
  function star(filled, size) {
    size = size || 40;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="' + (filled ? '#fbbf24' : '#e5e3ee') + '" stroke="' + (filled ? '#b45309' : '#c9c5d8') + '" stroke-width="1.3" stroke-linejoin="round"/>' +
      (filled ? '<path d="M9 8.5l1.5-3" stroke="#fff6cc" stroke-width="1.4" stroke-linecap="round"/>' : '') +
    '</svg>';
  }

  return {
    car: car, scene: scene, setProgress: setProgress, thermometer: thermometer,
    picto: picto, star: star, safeColor: safeColor
  };
})();
