/* ================================================================
   ART STUDIO — Copy the Master
   Simplified colour studies of public-domain paintings and prints,
   re-drawn here by hand as SVG (no photographs, no external images),
   shown beside the kid's own paper. "Grid" lays the same grid over
   both so a kid can copy square by square (the grid method); "Trace"
   shows the study's outline faintly under the paper.

   The studies are intentionally simple compositional reductions to
   learn from — not reproductions.
   ================================================================ */

var CopyMaster = (function () {
  'use strict';

  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''); }
  function rng(seed) { return ArtBrush.rng(seed); }
  function f1(n) { return Math.round(n * 10) / 10; }

  // Many dabs of one colour as a single path of zero-length segments
  // with round caps: thousands of dots stay light for the browser.
  function dotPath(pts, col, w, op) {
    if (!pts.length) return '';
    var d = '';
    for (var i = 0; i < pts.length; i++) d += 'M' + f1(pts[i][0]) + ' ' + f1(pts[i][1]) + 'h0.01';
    return '<path d="' + d + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"' + (op ? ' opacity="' + op + '"' : '') + '/>';
  }
  // Short brush dabs following a direction field.
  function dabs(R, n, area, colours, w, len, angleFn, op) {
    var by = {};
    for (var i = 0; i < n; i++) {
      var x = area[0] + R() * area[2], y = area[1] + R() * area[3];
      if (area[4] && !area[4](x, y)) continue;
      var a = angleFn(x, y) + (R() - 0.5) * 0.35, L = len * (0.6 + R() * 0.8);
      var c = colours[(R() * colours.length) | 0];
      (by[c] = by[c] || []).push('M' + f1(x) + ' ' + f1(y) + 'l' + f1(Math.cos(a) * L) + ' ' + f1(Math.sin(a) * L));
    }
    var out = '';
    for (var k in by) out += '<path d="' + by[k].join('') + '" stroke="' + k + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"' + (op ? ' opacity="' + op + '"' : '') + '/>';
    return out;
  }

  // ── The studies (800 x 600) ────────────────────────────────────
  var STUDY = {};

  STUDY.starry_night = function () {
    var R = rng(1889), s = '';
    s += '<defs><linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1f55"/><stop offset="0.55" stop-color="#22479a"/><stop offset="1" stop-color="#4a76bd"/></linearGradient>' +
      '<radialGradient id="sn-glow"><stop offset="0" stop-color="#fff6c4"/><stop offset="0.35" stop-color="#f6dc6a" stop-opacity="0.9"/><stop offset="1" stop-color="#f6dc6a" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="800" height="600" fill="url(#sn-sky)"/>';
    // the flowing sky: dabs following a swirling field
    var swirls = [[400, 235, 120], [250, 175, 70], [560, 170, 60]];
    var field = function (x, y) {
      var a = Math.sin(x / 90) * 0.35 + Math.cos(y / 70) * 0.2;
      for (var i = 0; i < swirls.length; i++) {
        var w = swirls[i], dx = x - w[0], dy = y - w[1], d = Math.sqrt(dx * dx + dy * dy);
        if (d < w[2] * 1.4) { var k = Math.max(0, 1 - d / (w[2] * 1.4)); a = a * (1 - k) + (Math.atan2(dy, dx) + Math.PI / 2) * k; }
      }
      return a;
    };
    s += dabs(R, 1300, [0, 0, 800, 470], ['#2c5aa8', '#4a7cc9', '#1d3f86', '#6f9bd8', '#a9c8ef', '#16337a'], 7, 22, field, 0.9);
    s += dabs(R, 260, [250, 150, 330, 170], ['#cfe0f5', '#a9c8ef', '#e8f0e0'], 5, 18, field, 0.85);
    // stars with halos and rings
    [[120, 80, 26], [250, 175, 22], [395, 60, 20], [500, 120, 18], [560, 300, 16], [300, 330, 14], [80, 260, 18], [640, 250, 15], [730, 330, 13]].forEach(function (st) {
      s += '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="' + st[2] * 2.2 + '" fill="url(#sn-glow)" opacity="0.85"/>';
      s += '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="' + st[2] * 1.3 + '" fill="none" stroke="#fff3a8" stroke-width="4" stroke-dasharray="9 5" opacity="0.8"/>';
      s += '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="' + st[2] * 0.55 + '" fill="#fffbe0"/>';
    });
    // crescent moon with rings
    s += '<circle cx="690" cy="95" r="95" fill="url(#sn-glow)" opacity="0.9"/>';
    s += '<circle cx="690" cy="95" r="62" fill="none" stroke="#f7d65a" stroke-width="7" stroke-dasharray="14 6"/>';
    s += '<circle cx="690" cy="95" r="38" fill="#f5c93a"/><circle cx="706" cy="84" r="30" fill="#f9e7a0"/><circle cx="712" cy="80" r="26" fill="#e9a62a" opacity="0.55"/>';
    // rolling hills
    s += '<path d="M0 455 C120 410 220 400 330 430 C430 455 520 400 640 405 C720 408 770 425 800 430 L800 600 L0 600Z" fill="#20407c"/>';
    s += dabs(R, 220, [0, 410, 800, 80], ['#3a62a6', '#152f63', '#5a86c6'], 6, 20, function () { return -0.15; }, 0.8);
    // village
    s += '<path d="M180 600 L180 520 L800 505 L800 600Z" fill="#1a2c55"/>';
    var houses = [[230, 520, 36, 26], [275, 512, 30, 30], [318, 522, 40, 22], [370, 508, 34, 30], [420, 516, 44, 26], [480, 506, 30, 32], [520, 518, 40, 24], [570, 510, 34, 28], [620, 518, 42, 24], [675, 508, 36, 30], [725, 516, 40, 26]];
    houses.forEach(function (h, i) {
      s += '<rect x="' + h[0] + '" y="' + h[1] + '" width="' + h[2] + '" height="' + h[3] + '" fill="' + (i % 2 ? '#2d3f6e' : '#3a4a74') + '"/>';
      s += '<path d="M' + (h[0] - 3) + ' ' + h[1] + ' L' + (h[0] + h[2] / 2) + ' ' + (h[1] - 14) + ' L' + (h[0] + h[2] + 3) + ' ' + h[1] + 'Z" fill="#1c2a4f"/>';
      if (i % 3 !== 1) s += '<rect x="' + (h[0] + h[2] * 0.3) + '" y="' + (h[1] + 8) + '" width="7" height="7" fill="#f3d35b"/>';
    });
    s += '<path d="M440 516 L440 440 L448 400 L456 440 L456 516Z" fill="#26375f"/><rect x="438" y="470" width="20" height="46" fill="#33466f"/>';
    s += '<rect x="586" y="522" width="6" height="6" fill="#f3d35b"/><rect x="300" y="530" width="6" height="6" fill="#f3d35b"/>';
    // the cypress, flame-like
    s += '<path d="M60 600 C40 500 70 420 95 330 C110 260 120 170 150 70 C165 160 180 250 190 340 C205 450 230 520 225 600Z" fill="#17241a"/>';
    s += dabs(R, 160, [60, 80, 170, 520], ['#2f4a2a', '#4a3b22', '#22361f', '#5b5a2a'], 6, 26, function () { return -Math.PI / 2 + 0.1; }, 0.9);
    return s;
  };

  STUDY.water_lilies = function () {
    var R = rng(1919), s = '';
    s += '<defs><linearGradient id="wl-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6f79"/><stop offset="0.5" stop-color="#5c7fa0"/><stop offset="1" stop-color="#7470a8"/></linearGradient></defs>';
    s += '<rect width="800" height="600" fill="url(#wl-w)"/>';
    s += dabs(R, 1100, [0, 0, 800, 600], ['#7fa8b8', '#4f7f8c', '#8d86c2', '#a7b9d6', '#3f6a5a', '#6a96a2', '#9aa0d0'], 8, 30, function () { return 0; }, 0.75);
    // willow reflections
    s += dabs(R, 200, [0, 0, 160, 420], ['#2d4a3a', '#3f6248', '#1f3a30'], 7, 40, function () { return Math.PI / 2; }, 0.7);
    s += dabs(R, 200, [640, 0, 160, 420], ['#2d4a3a', '#3f6248', '#1f3a30'], 7, 40, function () { return Math.PI / 2; }, 0.7);
    // pale sky reflection
    s += dabs(R, 160, [250, 60, 300, 140], ['#d9e1ef', '#c4cfe6', '#e8e2f0'], 8, 34, function () { return 0; }, 0.7);
    // lily pads, each with a notch
    [[180, 200, 70, 20], [262, 232, 46, 14], [500, 312, 84, 24], [618, 342, 54, 16], [300, 430, 92, 26], [620, 474, 70, 20], [120, 520, 60, 18], [450, 548, 64, 18], [700, 210, 50, 14]].forEach(function (p, i) {
      var cx = p[0], cy = p[1], rx = p[2], ry = p[3];
      s += '<path d="M' + cx + ' ' + cy + ' L' + (cx + rx * 0.95) + ' ' + (cy - ry * 0.3) + ' A' + rx + ' ' + ry + ' 0 1 0 ' + (cx + rx * 0.95) + ' ' + (cy + ry * 0.3) + 'Z" fill="' + (i % 2 ? '#4f8a3e' : '#6aa04a') + '"/>';
      s += '<ellipse cx="' + (cx - rx * 0.25) + '" cy="' + (cy - ry * 0.3) + '" rx="' + rx * 0.45 + '" ry="' + ry * 0.3 + '" fill="#9cc66a" opacity="0.5"/>';
    });
    // flowers
    [[178, 192], [500, 300], [302, 420], [624, 464], [700, 204]].forEach(function (f, i) {
      var col = i % 2 ? '#f6c9d4' : '#fff4f6';
      for (var k = 0; k < 7; k++) {
        var a = -Math.PI / 2 + (k - 3) * 0.42;
        s += '<ellipse cx="' + f1(f[0] + Math.cos(a) * 9) + '" cy="' + f1(f[1] + Math.sin(a) * 6) + '" rx="9" ry="4" transform="rotate(' + f1(a * 57.3) + ' ' + f1(f[0] + Math.cos(a) * 9) + ' ' + f1(f[1] + Math.sin(a) * 6) + ')" fill="' + col + '"/>';
      }
      s += '<circle cx="' + f[0] + '" cy="' + (f[1] - 2) + '" r="4" fill="#f2c64a"/>';
    });
    return s;
  };

  STUDY.sunflowers = function () {
    var R = rng(1888), s = '';
    s += '<defs><linearGradient id="sf-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dc8a"/><stop offset="1" stop-color="#e3bd52"/></linearGradient>' +
      '<linearGradient id="sf-vase" x1="0" x2="1"><stop offset="0" stop-color="#c98d22"/><stop offset="0.35" stop-color="#f3cf63"/><stop offset="1" stop-color="#b47a1c"/></linearGradient>' +
      '<radialGradient id="sf-disc" cx="0.4" cy="0.4"><stop offset="0" stop-color="#b9782a"/><stop offset="1" stop-color="#6a3c14"/></radialGradient></defs>';
    s += '<rect width="800" height="600" fill="url(#sf-bg)"/>';
    s += dabs(R, 500, [0, 0, 800, 455], ['#f0d27a', '#e8c65e', '#f6e2a0', '#dcb64c'], 9, 26, function (x, y) { return (x + y) / 300; }, 0.6);
    s += '<rect y="455" width="800" height="145" fill="#d79e33"/>';
    s += dabs(R, 240, [0, 460, 800, 140], ['#c98a2a', '#e6b04a', '#b8781e'], 8, 34, function () { return 0; }, 0.7);
    s += '<path d="M0 455 H800" stroke="#a96a1a" stroke-width="5"/>';
    // vase
    s += '<path d="M300 455 C285 420 292 380 318 360 L482 360 C508 380 515 420 500 455 C495 500 480 540 470 560 L330 560 C320 540 305 500 300 455Z" fill="url(#sf-vase)"/>';
    s += '<path d="M296 430 C380 444 420 444 504 430" stroke="#3a5aa0" stroke-width="7" fill="none"/>';
    s += '<path d="M318 360 L482 360" stroke="#a46d16" stroke-width="5"/>';
    // stems and leaves
    var heads = [[250, 210, 62, 1], [400, 150, 70, 1], [545, 205, 60, 1], [320, 300, 52, 0.7], [480, 300, 54, 1], [180, 330, 46, 0.6], [620, 330, 48, 0.75], [400, 270, 44, 0.55]];
    heads.forEach(function (h) {
      s += '<path d="M' + (360 + (h[0] - 400) * 0.25) + ' 362 Q' + f1((h[0] + 400) / 2) + ' ' + f1((h[1] + 360) / 2 + 30) + ' ' + h[0] + ' ' + (h[1] + h[2] * 0.4) + '" stroke="#6b8a2a" stroke-width="6" fill="none"/>';
    });
    s += '<path d="M330 360 C280 330 240 350 220 380 C260 380 300 372 330 360Z" fill="#7a9a32"/><path d="M470 360 C520 320 570 330 590 360 C550 368 510 368 470 360Z" fill="#6b8a2a"/>';
    // flower heads: petals in several yellows around a dark disc
    heads.forEach(function (h, i) {
      var cx = h[0], cy = h[1], r = h[2], squash = h[3], n = 18 + (i % 3) * 2, k, out = '';
      for (k = 0; k < n; k++) {
        var a = k / n * Math.PI * 2 + R() * 0.2, pr = r * (0.9 + R() * 0.25);
        var px = cx + Math.cos(a) * pr * 0.62, py = cy + Math.sin(a) * pr * 0.62 * squash;
        var col = ['#f2b51e', '#e9961b', '#f7d24a', '#e3a92a'][(R() * 4) | 0];
        out += '<ellipse cx="' + f1(px) + '" cy="' + f1(py) + '" rx="' + f1(r * 0.42) + '" ry="' + f1(r * 0.12) + '" transform="rotate(' + f1(Math.atan2(Math.sin(a) * squash, Math.cos(a)) * 57.3) + ' ' + f1(px) + ' ' + f1(py) + ')" fill="' + col + '" stroke="#b9741a" stroke-width="1"/>';
      }
      s += out;
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r * 0.38 + '" ry="' + r * 0.38 * squash + '" fill="url(#sf-disc)"/>';
      var dots = [];
      for (k = 0; k < 26; k++) { var a2 = R() * 6.283, d2 = Math.sqrt(R()) * r * 0.33; dots.push([cx + Math.cos(a2) * d2, cy + Math.sin(a2) * d2 * squash]); }
      s += dotPath(dots, '#3e2208', 3.2, 0.8);
    });
    return s;
  };

  STUDY.cordillera_sunset = function () {
    var R = rng(1810), s = '';
    s += '<defs><linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2766"/><stop offset="0.35" stop-color="#8a3f73"/><stop offset="0.62" stop-color="#ec7f3c"/><stop offset="0.8" stop-color="#fbcf74"/></linearGradient>' +
      '<radialGradient id="cs-sun"><stop offset="0" stop-color="#fff3c8"/><stop offset="0.4" stop-color="#ffd47a" stop-opacity="0.8"/><stop offset="1" stop-color="#ffb05a" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="800" height="600" fill="url(#cs-sky)"/>';
    s += '<circle cx="520" cy="330" r="150" fill="url(#cs-sun)"/><circle cx="520" cy="330" r="40" fill="#fff0c0"/>';
    // streaky clouds
    s += dabs(R, 70, [0, 60, 800, 200], ['#f2a1a8', '#d9738f', '#f7c19a'], 6, 70, function () { return 0; }, 0.55);
    // far ridge, mid ridge with alpenglow snow, dark valley
    s += '<path d="M0 360 L120 300 L230 340 L340 280 L460 330 L580 262 L700 320 L800 290 L800 600 L0 600Z" fill="#8a5a92" opacity="0.85"/>';
    s += '<path d="M0 440 L100 360 L180 400 L260 330 L340 390 L430 318 L520 380 L600 340 L700 400 L800 368 L800 600 L0 600Z" fill="#4a3470"/>';
    s += '<path d="M232 352 L260 330 L290 356 L272 350 L262 362 L250 350Z M400 342 L430 318 L462 344 L444 340 L432 352 L418 340Z M576 356 L600 340 L626 360 L610 356 L600 366 L590 356Z" fill="#f6cfe0"/>';
    s += '<path d="M0 520 C200 500 400 520 600 535 C700 540 760 525 800 515 L800 600 L0 600Z" fill="#1d1830"/>';
    // poplars of the central valley
    [[110, 520, 14, 70], [140, 522, 12, 60], [168, 520, 13, 74], [640, 528, 12, 62], [666, 526, 14, 76], [694, 528, 11, 58]].forEach(function (t) {
      s += '<ellipse cx="' + t[0] + '" cy="' + (t[1] - t[3] / 2) + '" rx="' + t[2] / 2 + '" ry="' + t[3] / 2 + '" fill="#13101f"/>';
    });
    return s;
  };

  STUDY.great_wave = function () {
    var R = rng(1831), s = '';
    s += '<defs><linearGradient id="gw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfb59a"/><stop offset="0.25" stop-color="#e6dcc0"/><stop offset="1" stop-color="#efe6cc"/></linearGradient>' +
      '<linearGradient id="gw-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b3b6a"/><stop offset="1" stop-color="#2f5d92"/></linearGradient></defs>';
    s += '<rect width="800" height="600" fill="url(#gw-sky)"/>';
    // Mount Fuji, small and far
    s += '<path d="M450 470 L560 380 L590 372 L700 470Z" fill="#4c6788"/><path d="M528 405 L560 380 L590 372 L622 405 L604 398 L590 410 L575 398 L560 410 L545 400Z" fill="#f4efe0"/>';
    // the far swell on the right
    s += '<path d="M380 470 C470 400 560 380 640 420 C700 450 760 440 800 420 L800 600 L380 600Z" fill="#2c5a8c"/>';
    s += '<path d="M470 420 C540 392 600 395 640 420" stroke="#f4efe0" stroke-width="6" fill="none"/>';
    // the great wave body
    s += '<path d="M0 600 L0 430 C40 330 110 230 220 170 C320 120 440 120 500 190 C530 230 520 280 480 300 C470 250 430 222 380 230 C320 240 290 300 300 360 C310 420 360 470 420 500 C470 525 520 540 560 600Z" fill="url(#gw-blue)"/>';
    s += '<path d="M40 560 C80 420 150 320 240 260 C300 225 360 220 400 250" stroke="#5f8fc0" stroke-width="10" fill="none" opacity="0.75"/>';
    s += '<path d="M60 590 C100 470 160 380 250 320" stroke="#8fb4da" stroke-width="5" fill="none" opacity="0.7"/>';
    // claw-like foam along the crest
    var crest = [[220, 170], [270, 140], [330, 125], [390, 126], [440, 145], [480, 175], [505, 205], [512, 240], [500, 272]];
    crest.forEach(function (c, i) {
      for (var k = 0; k < 3; k++) {
        var a = -Math.PI / 2 + i * 0.32 + k * 0.5, len = 26 + R() * 14;
        var x2 = c[0] + Math.cos(a) * len, y2 = c[1] + Math.sin(a) * len;
        s += '<path d="M' + c[0] + ' ' + c[1] + ' Q' + f1((c[0] + x2) / 2 + 8) + ' ' + f1((c[1] + y2) / 2 - 4) + ' ' + f1(x2) + ' ' + f1(y2) + '" stroke="#f6f1e2" stroke-width="7" stroke-linecap="round" fill="none"/>';
        s += '<circle cx="' + f1(x2) + '" cy="' + f1(y2) + '" r="5" fill="#f6f1e2"/>';
      }
    });
    s += '<path d="M220 170 C300 118 420 112 490 180 C515 210 515 255 490 285" stroke="#f6f1e2" stroke-width="12" fill="none" stroke-linecap="round"/>';
    // flying spray
    var spray = [];
    for (var i = 0; i < 70; i++) spray.push([300 + R() * 260, 60 + R() * 120]);
    s += dotPath(spray, '#f6f1e2', 6);
    // the trough wave in front
    s += '<path d="M120 600 C200 520 300 500 380 530 C440 552 470 580 480 600Z" fill="#244b7c"/>';
    s += '<path d="M150 590 C220 530 300 516 370 540" stroke="#f6f1e2" stroke-width="6" fill="none"/>';
    // boats with rowers
    [[110, 470, 18], [330, 555, 10]].forEach(function (b) {
      s += '<path d="M' + (b[0] - 100) + ' ' + b[1] + ' C' + (b[0] - 40) + ' ' + (b[1] + 40) + ' ' + (b[0] + 80) + ' ' + (b[1] + 30) + ' ' + (b[0] + 150) + ' ' + (b[1] - 20) + ' L' + (b[0] + 140) + ' ' + (b[1] - 6) + ' C' + (b[0] + 70) + ' ' + (b[1] + 34) + ' ' + (b[0] - 40) + ' ' + (b[1] + 30) + ' ' + (b[0] - 100) + ' ' + b[1] + 'Z" fill="#e8d7a8" stroke="#3a3122" stroke-width="2"/>';
      var row = [];
      for (var k = 0; k < 8; k++) row.push([b[0] - 60 + k * 22, b[1] + 8 + Math.sin(k / 2) * 3]);
      s += dotPath(row, '#2b2a33', 9);
    });
    // the title cartouche of the print
    s += '<rect x="24" y="22" width="44" height="110" fill="#eadfbf" stroke="#9a8a62" stroke-width="2"/><rect x="72" y="22" width="30" height="60" fill="#eadfbf" stroke="#9a8a62" stroke-width="2"/>';
    return s;
  };

  STUDY.mona_lisa = function () {
    var R = rng(1503), s = '';
    s += '<defs><linearGradient id="ml-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb2a2"/><stop offset="0.45" stop-color="#7d8a6c"/><stop offset="1" stop-color="#4c4630"/></linearGradient>' +
      '<radialGradient id="ml-face" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#e6c48c"/><stop offset="0.7" stop-color="#c79a5c"/><stop offset="1" stop-color="#8a6234"/></radialGradient>' +
      '<linearGradient id="ml-dress" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3220"/><stop offset="1" stop-color="#1c180e"/></linearGradient>' +
      '<radialGradient id="ml-skin" cx="0.5" cy="0.2" r="0.9"><stop offset="0" stop-color="#e2bd84"/><stop offset="1" stop-color="#a57a42"/></radialGradient></defs>';
    s += '<rect width="800" height="600" fill="url(#ml-bg)"/>';
    // hazy landscape: winding road, water, rocks
    s += '<path d="M0 210 C80 190 150 220 230 200 L230 330 L0 330Z" fill="#6f826e" opacity="0.8"/><path d="M570 190 C650 170 720 200 800 180 L800 320 L570 320Z" fill="#6f826e" opacity="0.8"/>';
    s += '<path d="M20 260 C80 250 120 270 190 262" stroke="#b9c7b8" stroke-width="10" fill="none" opacity="0.8"/><path d="M600 240 C660 230 720 248 790 236" stroke="#b9c7b8" stroke-width="10" fill="none" opacity="0.8"/>';
    s += '<path d="M40 330 C90 300 140 320 180 300 C200 292 220 300 236 296" stroke="#b59a62" stroke-width="8" fill="none"/>';
    s += dabs(R, 260, [0, 140, 800, 300], ['#8d9c7c', '#6d7c5c', '#a9b49a', '#5f6a4c'], 9, 26, function () { return 0.1; }, 0.35);
    // parapet
    s += '<rect x="0" y="470" width="800" height="130" fill="#5b4a2e"/><rect x="0" y="470" width="800" height="10" fill="#7b6440"/>';
    // the figure: a calm triangle
    s += '<path d="M400 140 C300 160 250 300 230 420 C200 480 160 560 150 600 L650 600 C640 560 600 480 570 420 C550 300 500 160 400 140Z" fill="url(#ml-dress)"/>';
    // neck and chest
    s += '<path d="M362 280 C365 320 330 345 300 360 C350 392 450 392 500 360 C470 345 436 320 438 280Z" fill="url(#ml-skin)"/>';
    s += '<path d="M300 360 C350 392 450 392 500 360" stroke="#5a4520" stroke-width="3" fill="none"/>';
    // hair falling each side, veil
    s += '<path d="M330 170 C300 210 300 300 286 360 L330 360 C340 300 340 230 360 190Z" fill="#2b1d10"/><path d="M470 170 C500 210 500 300 514 360 L470 360 C460 300 460 230 440 190Z" fill="#2b1d10"/>';
    // the face
    s += '<ellipse cx="400" cy="215" rx="70" ry="88" fill="url(#ml-face)"/>';
    s += '<path d="M332 190 C340 120 460 120 468 190 C450 150 350 150 332 190Z" fill="#2b1d10"/>';
    s += '<path d="M358 205 Q372 198 386 205 Q372 210 358 205Z M414 205 Q428 198 442 205 Q428 210 414 205Z" fill="#3a2614"/>';
    s += '<path d="M400 210 C396 230 392 245 398 250 Q404 252 408 248" stroke="#8a6234" stroke-width="2.5" fill="none"/>';
    s += '<path d="M378 266 Q400 274 422 264" stroke="#7a4a2a" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += '<ellipse cx="372" cy="240" rx="16" ry="10" fill="#e9b88a" opacity="0.35"/><ellipse cx="428" cy="240" rx="16" ry="10" fill="#e9b88a" opacity="0.35"/>';
    // folded hands at the base
    s += '<path d="M300 520 C330 488 380 480 420 492 C460 500 500 510 520 532 C480 548 420 550 380 544 C340 540 312 536 300 520Z" fill="url(#ml-skin)"/>';
    s += '<path d="M330 512 C370 500 420 504 470 520 M350 528 C390 520 430 524 480 534" stroke="#8a6234" stroke-width="2" fill="none"/>';
    // sleeve folds
    s += dabs(R, 60, [230, 400, 340, 110], ['#5a4a28', '#2a2414'], 6, 30, function () { return 0.4; }, 0.6);
    return s;
  };

  STUDY.the_scream = function () {
    var R = rng(1893), s = '';
    s += '<rect width="800" height="600" fill="#e3743a"/>';
    // wavy sky bands
    var bands = [['#c8402a', 0], ['#e96a2c', 60], ['#f2a33a', 115], ['#f6c650', 165], ['#e98438', 215], ['#d9532c', 262]];
    bands.forEach(function (b) {
      var y = b[1];
      s += '<path d="M0 ' + y + ' C150 ' + (y - 30) + ' 260 ' + (y + 40) + ' 420 ' + (y + 5) + ' C560 ' + (y - 25) + ' 680 ' + (y + 35) + ' 800 ' + y + ' L800 ' + (y + 70) + ' C680 ' + (y + 100) + ' 560 ' + (y + 40) + ' 420 ' + (y + 75) + ' C260 ' + (y + 110) + ' 150 ' + (y + 40) + ' 0 ' + (y + 70) + 'Z" fill="' + b[0] + '"/>';
    });
    // fjord swirls and the land
    s += '<path d="M0 300 C120 280 220 320 300 360 C380 400 420 460 400 520 L0 520Z" fill="#2c4f8a"/>';
    s += dabs(R, 160, [0, 300, 380, 220], ['#4d6fa8', '#1f3b66', '#6a88bc'], 7, 34, function (x, y) { return Math.sin(x / 60 + y / 40) * 0.8; }, 0.85);
    s += '<path d="M380 330 C460 300 560 320 640 300 C700 290 760 300 800 296 L800 600 L420 600 C430 520 420 440 380 330Z" fill="#3b4a2a"/>';
    s += dabs(R, 120, [440, 320, 360, 260], ['#5a6a34', '#2a3420', '#6a5a2a'], 8, 34, function () { return -0.6; }, 0.75);
    // the bridge: a strong diagonal
    s += '<path d="M0 600 L0 520 L800 240 L800 300 L180 600Z" fill="#9a6a34"/>';
    s += '<path d="M0 470 L800 210" stroke="#5a3a1c" stroke-width="10"/><path d="M0 505 L800 232" stroke="#c58a4a" stroke-width="5"/>';
    s += dabs(R, 90, [0, 300, 800, 300], ['#b07a3e', '#7a4f24'], 6, 40, function () { return -0.335; }, 0.6);
    // two walkers far along the bridge
    s += '<path d="M600 286 L600 240 M640 274 L640 226" stroke="#1d1a22" stroke-width="12" stroke-linecap="round"/><circle cx="600" cy="232" r="8" fill="#1d1a22"/><circle cx="640" cy="218" r="8" fill="#1d1a22"/>';
    // the front figure
    s += '<path d="M190 600 C170 540 210 480 200 430 C196 400 220 380 250 382 C280 386 296 410 290 440 C282 490 320 540 300 600Z" fill="#2a2a3a"/>';
    s += '<ellipse cx="250" cy="340" rx="44" ry="58" fill="#e6d7a8"/>';
    s += '<ellipse cx="234" cy="330" rx="8" ry="11" fill="#3a2f2a"/><ellipse cx="266" cy="330" rx="8" ry="11" fill="#3a2f2a"/><ellipse cx="250" cy="372" rx="8" ry="13" fill="#3a2f2a"/>';
    s += '<path d="M208 330 C196 360 204 392 224 404 M292 330 C304 360 296 392 276 404" stroke="#e6d7a8" stroke-width="12" stroke-linecap="round" fill="none"/>';
    return s;
  };

  STUDY.pointillist_park = function () {
    var R = rng(1886), s = '';
    // base colours first (the "underpainting")
    s += '<rect width="800" height="600" fill="#7da55a"/>';
    s += '<rect width="800" height="150" fill="#cfe0c8"/>';
    s += '<path d="M0 150 L520 150 L420 260 L0 300Z" fill="#6c97b8"/>';
    s += '<path d="M0 300 L420 260 L800 300 L800 600 L0 600Z" fill="#9bbd56"/>';
    s += '<path d="M0 420 C200 400 380 440 560 470 L560 600 L0 600Z" fill="#3e6b34"/>';
    s += '<path d="M560 60 C610 30 720 40 760 90 C790 150 720 190 650 180 C600 175 560 140 560 60Z" fill="#2e5a2e"/>';
    s += '<rect x="646" y="170" width="14" height="300" fill="#4a3a26"/>';
    s += '<circle cx="150" cy="230" r="58" fill="#2e5a2e"/><rect x="144" y="270" width="10" height="160" fill="#4a3a26"/>';
    // figures
    s += '<path d="M440 330 C420 360 405 430 395 470 L485 470 C478 430 462 360 445 330Z" fill="#2a2834"/><circle cx="442" cy="315" r="16" fill="#2a2834"/>';
    s += '<path d="M380 285 C410 255 470 255 500 285Z" fill="#6a3a5a"/><path d="M440 285 L440 312" stroke="#2a2834" stroke-width="3"/>';
    s += '<path d="M270 400 C250 420 250 470 248 480 L320 480 C316 450 300 418 285 400Z" fill="#c9a24a"/><circle cx="278" cy="388" r="14" fill="#2a2834"/>';
    s += '<path d="M560 488 L620 488 L592 454Z" fill="#f1efe6"/><path d="M590 456 V490" stroke="#4a3a26" stroke-width="2"/>';
    // the dots on top: each region gets pure colours side by side
    function region(test, n, cols, w) {
      var by = {};
      for (var i = 0; i < n; i++) {
        var x = R() * 800, y = R() * 600;
        if (!test(x, y)) continue;
        var c = cols[(R() * cols.length) | 0];
        (by[c] = by[c] || []).push([x, y]);
      }
      var out = '';
      for (var k in by) out += dotPath(by[k], k, w);
      return out;
    }
    s += region(function (x, y) { return y < 150; }, 1300, ['#e8efe0', '#c9dde6', '#f1e9c8', '#b8d0d8'], 6);
    s += region(function (x, y) { return y >= 150 && y < 300 && x < 480 - (y - 150) * 0.6; }, 900, ['#4f86b8', '#8ab4d4', '#e3eef2', '#3a6c9a'], 6);
    s += region(function (x, y) { return y > 270 && y < 430 && !(x > 380 && x < 500 && y > 250); }, 1700, ['#b9d35a', '#e2d86a', '#86b04a', '#f0e08a'], 6);
    s += region(function (x, y) { return y > 420 && x < 560 && y > 420 + (x / 560) * 40; }, 1300, ['#2f5a2e', '#4a7a3a', '#2a3f6a', '#5a3a6a'], 6);
    s += region(function (x, y) { return x > 560 && y < 180 && y > 40 + Math.abs(x - 660) * 0.4; }, 500, ['#1f4a26', '#3a6a2e', '#5a7a3a', '#2a3a5a'], 6);
    s += region(function (x, y) { var dx = x - 150, dy = y - 230; return dx * dx + dy * dy < 3300; }, 400, ['#1f4a26', '#3a6a2e', '#5a7a3a'], 6);
    s += region(function (x, y) { return y > 440 && x > 560; }, 600, ['#7aa04a', '#a8c45a', '#4a7a3a', '#d8d070'], 6);
    return s;
  };

  STUDY.mondrian_composition = function () {
    var s = '';
    s += '<rect width="800" height="600" fill="#e7e4dc"/>';
    s += '<rect x="148" y="48" width="520" height="520" fill="#00000022"/>';
    var X = 140, Y = 40, S = 520;
    function r(x0, y0, x1, y1, c) { return '<rect x="' + (X + x0 * S) + '" y="' + (Y + y0 * S) + '" width="' + ((x1 - x0) * S) + '" height="' + ((y1 - y0) * S) + '" fill="' + c + '"/>'; }
    s += r(0, 0, 1, 1, '#f3f0e7');
    s += r(0.22, 0, 1, 0.68, '#d2232a');
    s += r(0, 0.68, 0.22, 1, '#1b3f95');
    s += r(0.92, 0.85, 1, 1, '#f2cb1f');
    s += r(0, 0, 0.22, 0.33, '#f6f4ee') + r(0, 0.33, 0.22, 0.68, '#eeebe2');
    var lw = 0.022;
    function lv(x, y0, y1) { return r(x - lw / 2, y0, x + lw / 2, y1, '#141414'); }
    function lh(y, x0, x1) { return r(x0, y - lw / 2, x1, y + lw / 2, '#141414'); }
    s += lv(0.22, 0, 1) + lh(0.33, 0, 0.22) + lh(0.68, 0, 1) + lv(0.92, 0.68, 1) + lh(0.85, 0.92, 1);
    return s;
  };

  // ── Compositions ───────────────────────────────────────────────
  // `guideSvg` holds the outline used by "Trace".
  var COMPOSITIONS = [
    {
      id: 'starry_night',
      title: 'Starry Night',
      artist: 'Vincent van Gogh',
      year: 1889,
      note: 'Vincent van Gogh (1853–1890) painted The Starry Night in June 1889 from his window at the asylum in Saint-Rémy-de-Provence, France. It is oil on canvas and hangs in the Museum of Modern Art in New York. Tip: paint the sky in short curving dabs that follow the swirls.',
      tools: 'oil',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M110 600 Q90 450 140 320 Q170 230 150 120"/>' +
          '<path d="M110 600 Q135 470 110 380 Q80 280 130 170"/>' +
          '<path d="M250 520 L250 470 L290 440 L290 490 L340 490 L340 460 L370 430 L400 460 L400 520 Z"/>' +
          '<path d="M400 520 L400 480 L430 450 L470 450 L470 520 Z"/>' +
          '<path d="M470 520 L470 470 L510 440 L550 470 L550 520 Z"/>' +
          '<path d="M550 520 L550 490 L600 460 L630 490 L630 520 Z"/>' +
          '<path d="M250 520 L700 520"/>' +
          '<path d="M420 520 L420 430 L440 410 L440 520 Z"/>' +
          '<path d="M440 410 L430 395 L450 395 Z"/>' +
          '<circle cx="650" cy="140" r="38"/>' +
          '<circle cx="650" cy="140" r="58"/>' +
          '<path d="M200 180 Q180 160 200 140 Q240 130 240 170 Q220 210 180 200"/>' +
          '<path d="M370 110 Q350 90 370 70 Q410 60 410 100 Q390 140 350 130"/>' +
          '<path d="M240 240 Q330 200 420 260 Q510 320 600 260 Q690 200 740 260"/>' +
          '<path d="M240 280 Q330 240 420 300 Q510 360 600 300 Q690 240 740 300"/>' +
          '<path d="M0 500 Q200 460 400 490 Q600 520 800 480"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'water_lilies',
      title: 'Water Lilies',
      artist: 'Claude Monet',
      year: 1919,
      note: 'Claude Monet (1840–1926) painted about 250 pictures of the water lilies in the pond of his garden at Giverny, France. Tip: no hard lines — lay soft sideways strokes of blue, green and violet first, then float the lily pads on top.',
      tools: 'watercolour',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round">' +
          '<path d="M20 160 Q200 140 400 160 Q600 180 780 160"/>' +
          '<path d="M20 260 Q200 240 400 260 Q600 280 780 260"/>' +
          '<path d="M20 360 Q200 340 400 360 Q600 380 780 360"/>' +
          '<path d="M20 460 Q200 440 400 460 Q600 480 780 460"/>' +
          '<ellipse cx="180" cy="200" rx="70" ry="22"/>' +
          '<ellipse cx="260" cy="230" rx="50" ry="16"/>' +
          '<ellipse cx="500" cy="310" rx="85" ry="26"/>' +
          '<ellipse cx="620" cy="340" rx="55" ry="18"/>' +
          '<ellipse cx="300" cy="430" rx="90" ry="28"/>' +
          '<ellipse cx="620" cy="470" rx="70" ry="22"/>' +
          '<circle cx="180" cy="198" r="10"/>' +
          '<circle cx="500" cy="308" r="14"/>' +
          '<circle cx="300" cy="428" r="12"/>' +
          '<path d="M80 60 Q120 130 80 260 Q60 330 90 430"/>' +
          '<path d="M720 60 Q700 130 740 260 Q760 330 710 430"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'sunflowers',
      title: 'Sunflowers',
      artist: 'Vincent van Gogh',
      year: 1888,
      note: 'Van Gogh painted his series of sunflowers in a vase in Arles, France, in 1888 and 1889, using many different yellows. Tip: change the yellows, not the shapes — thick strokes tell the petals apart.',
      tools: 'oil',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round">' +
          '<path d="M300 455 C285 420 292 380 318 360 L482 360 C508 380 515 420 500 455 C495 500 480 540 470 560 L330 560 C320 540 305 500 300 455Z"/>' +
          '<path d="M0 455 H800"/>' +
          '<circle cx="250" cy="210" r="62"/><circle cx="400" cy="150" r="70"/><circle cx="545" cy="205" r="60"/>' +
          '<circle cx="320" cy="300" r="50"/><circle cx="480" cy="300" r="54"/><circle cx="180" cy="330" r="40"/><circle cx="620" cy="330" r="44"/>' +
          '<circle cx="250" cy="210" r="24"/><circle cx="400" cy="150" r="27"/><circle cx="545" cy="205" r="23"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'cordillera_sunset',
      title: 'Cordillera al Atardecer',
      artist: 'Paisaje chileno',
      year: null,
      note: 'La cordillera de los Andes recorre Chile de norte a sur. Al atardecer, la luz baja del sol puede teñir de rosado la nieve de las cumbres. Cielo cálido arriba, nieve en las cumbres, valle oscuro abajo. Empieza por el cielo.',
      tools: 'watercolour',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M0 80 L800 80"/>' +
          '<path d="M0 180 L800 180"/>' +
          '<path d="M0 280 L800 280"/>' +
          '<circle cx="520" cy="330" r="42"/>' +
          '<path d="M0 360 L120 300 L230 340 L340 280 L460 330 L580 260 L700 320 L800 290 L800 360 Z"/>' +
          '<path d="M0 440 L100 360 L180 400 L260 330 L340 390 L430 320 L520 380 L600 340 L700 400 L800 370 L800 440 Z"/>' +
          '<path d="M260 330 L275 345 L290 332"/>' +
          '<path d="M430 320 L445 335 L460 323"/>' +
          '<path d="M0 520 Q200 500 400 520 Q600 540 800 510"/>' +
          '<path d="M120 520 L125 495 L118 498 Z"/>' +
          '<path d="M150 520 L156 490 L148 494 Z"/>' +
          '<path d="M665 520 L672 490 L660 495 Z"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'great_wave',
      title: 'The Great Wave off Kanagawa',
      artist: 'Katsushika Hokusai',
      year: 1831,
      note: 'Katsushika Hokusai (1760–1849) made The Great Wave off Kanagawa around 1831 as a colour woodblock print, part of his series Thirty-six Views of Mount Fuji. Many copies were printed from the carved wooden blocks. Tip: draw the big curling wave first, then the claw-like foam, then the boats and little Mount Fuji.',
      tools: 'marker',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M0 430 C40 330 110 230 220 170 C320 120 440 120 500 190 C530 230 520 280 480 300 C470 250 430 222 380 230 C320 240 290 300 300 360 C310 420 360 470 420 500 C470 525 520 540 560 600"/>' +
          '<path d="M220 170 C300 118 420 112 490 180"/>' +
          '<path d="M380 470 C470 400 560 380 640 420 C700 450 760 440 800 420"/>' +
          '<path d="M450 470 L560 380 L590 372 L700 470"/>' +
          '<path d="M528 405 L560 380 L590 372 L622 405"/>' +
          '<path d="M120 600 C200 520 300 500 380 530 C440 552 470 580 480 600"/>' +
          '<path d="M10 470 C70 510 190 500 260 450"/>' +
          '<path d="M230 555 C290 595 410 585 480 535"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'mona_lisa',
      title: 'Mona Lisa',
      artist: 'Leonardo da Vinci',
      year: 1503,
      note: 'Leonardo da Vinci began the Mona Lisa around 1503. It is oil paint on a wooden panel of poplar and hangs in the Louvre in Paris. Leonardo blended light into shadow so softly that the edges disappear — a way of painting called sfumato, Italian for “smoky”. Tip: block in the calm triangle of the pose and the oval face before any detail.',
      tools: 'oil',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M400 140 L230 560 L570 560 Z"/>' +
          '<ellipse cx="400" cy="215" rx="70" ry="88"/>' +
          '<path d="M332 190 C340 120 460 120 468 190"/>' +
          '<path d="M358 205 Q372 198 386 205"/><path d="M414 205 Q428 198 442 205"/>' +
          '<path d="M400 210 C396 230 392 245 398 250"/>' +
          '<path d="M378 266 Q400 274 422 264"/>' +
          '<path d="M300 360 C350 392 450 392 500 360"/>' +
          '<path d="M300 520 C330 488 380 480 420 492 C460 500 500 510 520 532 C480 548 420 550 380 544 C340 540 312 536 300 520Z"/>' +
          '<path d="M0 470 H800"/>' +
          '<path d="M40 330 C90 300 140 320 180 300"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'the_scream',
      title: 'The Scream',
      artist: 'Edvard Munch',
      year: 1893,
      note: 'Edvard Munch (1863–1944) was a Norwegian painter. He made several versions of The Scream; the first painted one is from 1893 and is kept in the National Museum in Oslo. Tip: the bridge rail is a strong diagonal — draw it first, then the wavy bands of the sky.',
      tools: 'oil',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M0 60 C150 30 260 100 420 65 C560 35 680 95 800 60"/>' +
          '<path d="M0 165 C150 135 260 205 420 170 C560 140 680 200 800 165"/>' +
          '<path d="M0 262 C150 232 260 302 420 267 C560 237 680 297 800 262"/>' +
          '<path d="M0 300 C120 280 220 320 300 360 C380 400 420 460 400 520"/>' +
          '<path d="M0 470 L800 210"/><path d="M0 520 L800 240"/>' +
          '<ellipse cx="250" cy="340" rx="44" ry="58"/>' +
          '<path d="M190 600 C170 540 210 480 200 430 M300 600 C320 540 282 490 290 440"/>' +
          '<path d="M600 286 L600 240 M640 274 L640 226"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'pointillist_park',
      title: 'A Sunday on La Grande Jatte',
      artist: 'Georges Seurat',
      year: 1886,
      yearText: '1884–1886',
      note: 'Georges Seurat (1859–1891) spent about two years on this painting of people relaxing on an island in the River Seine near Paris. It is made of tiny dots of pure colour and hangs in the Art Institute of Chicago. Tip: use the Dot brush and put different colours side by side — do not blend them.',
      tools: 'dots',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M0 150 H800"/><path d="M0 300 L420 260 L800 300"/>' +
          '<path d="M0 420 C200 400 380 440 560 470"/>' +
          '<path d="M650 470 L650 180"/><path d="M560 60 C610 30 720 40 760 90 C790 150 720 190 650 180 C600 175 560 140 560 60Z"/>' +
          '<path d="M150 430 L150 288"/><circle cx="150" cy="230" r="58"/>' +
          '<circle cx="442" cy="315" r="16"/><path d="M440 330 C420 360 405 430 395 470 L485 470 C478 430 462 360 445 330"/>' +
          '<path d="M380 285 C410 255 470 255 500 285Z"/>' +
          '<circle cx="278" cy="388" r="14"/><path d="M270 400 C250 420 250 470 248 480 L320 480 C316 450 300 418 285 400"/>' +
          '<path d="M560 488 L620 488 L592 454Z"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'mondrian_composition',
      title: 'Composition with Red, Blue and Yellow',
      artist: 'Piet Mondrian',
      year: 1930,
      note: 'Piet Mondrian (1872–1944) painted this composition in Paris in 1930; it is in the Kunsthaus Zürich. He used only straight black lines, white and the three primary colours. Tip: draw the black lines with the set square, then pour in the colours with the paint pot.',
      tools: 'shapes',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2">' +
          '<rect x="140" y="40" width="520" height="520"/>' +
          '<path d="M254.4 40 V560 M140 211.6 H254.4 M140 393.6 H660 M618.4 393.6 V560 M618.4 482 H660"/>' +
        '</g>' +
        '</svg>'
    }
  ];

  var _studyCache = {};
  function studySvg(c, cls) {
    if (!_studyCache[c.id]) _studyCache[c.id] = STUDY[c.id] ? STUDY[c.id]() : '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + _studyCache[c.id] + '</svg>';
  }
  function gridSvg() {
    var d = '', i, lab = '';
    for (i = 1; i < 4; i++) d += 'M' + i * 200 + ' 0 V600 ';
    for (i = 1; i < 3; i++) d += 'M0 ' + i * 200 + ' H800 ';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) lab += '<text x="' + (c * 200 + 10) + '" y="' + (r * 200 + 26) + '">' + 'ABCD'[c] + (r + 1) + '</text>';
    return '<svg class="cm-grid-svg" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '"/>' + lab + '</svg>';
  }

  // ── State and screens ─────────────────────────────────────────
  var wrap = null, state = null;

  function show() {
    wrap = document.getElementById('cm-wrap');
    if (!wrap) return;
    if (state && state.kit) { state.kit.surface.fit(); return; }
    _renderPicker();
  }
  // Older pages opened the studio's Copy the Master screen directly.
  function open() { if (typeof ArtStudio !== 'undefined') ArtStudio.showTab('master'); else show(); }
  function close() { _backToPicker(); }

  function _copied() {
    try { return (ArtStudio.getProgress().mastersCopied || []); } catch (e) { return []; }
  }

  function _renderPicker() {
    if (!wrap) return;
    var done = _copied();
    wrap.innerHTML =
      '<div class="cm-hall">' +
        '<div class="cm-hall-head"><h2>Copy the Master <span class="es">Copia al maestro</span></h2>' +
        '<p>Painters have always learned by copying great pictures. Pick one, look closely and paint your own version — square by square with the grid.</p></div>' +
        '<div class="cm-hall-grid">' + COMPOSITIONS.map(function (c, i) {
          var fr = ['gold', 'walnut', 'black', 'gold', 'oak', 'gold', 'walnut', 'silver', 'white'][i % 9];
          return '<button type="button" class="cm-card" data-cm="' + c.id + '" aria-label="' + esc(c.title + ', ' + c.artist) + '">' +
            '<span class="fr fr-' + fr + '"><span class="fr-mould"><span class="fr-mat">' + studySvg(c, 'cm-thumb-svg') + '</span></span></span>' +
            '<span class="fr-plaque"><b>' + esc(c.title) + '</b><span>' + esc(c.artist) + (c.year ? ' · ' + esc(c.yearText || c.year) : '') + '</span></span>' +
            (done.indexOf(c.id) !== -1 ? '<span class="cm-copied">Copied</span>' : '') +
          '</button>';
        }).join('') + '</div>' +
      '</div>';
    wrap.onclick = function (e) {
      var b = e.target.closest('[data-cm]');
      if (b) start(b.dataset.cm);
    };
  }

  function start(id) {
    var comp = null;
    for (var i = 0; i < COMPOSITIONS.length; i++) if (COMPOSITIONS[i].id === id) comp = COMPOSITIONS[i];
    if (!comp || !wrap) return;
    if (state && state.kit) state.kit.destroy();
    state = { comp: comp, grid: false, trace: false };
    wrap.onclick = null;
    wrap.innerHTML =
      '<div class="cm-play">' +
        '<div class="cm-head">' +
          '<button type="button" class="kbtn" data-cmact="back" aria-label="Back to the paintings">' + ArtArt.icon('back') + '</button>' +
          '<div class="cm-title"><b>' + esc(comp.title) + '</b><span>' + esc(comp.artist) + (comp.year ? ' · ' + esc(comp.yearText || comp.year) : '') + '</span></div>' +
          '<div class="cm-toggles">' +
            '<button type="button" class="cm-tog" data-cmact="grid" aria-pressed="false">' + ArtArt.icon('grid') + '<span>Grid</span></button>' +
            '<button type="button" class="cm-tog" data-cmact="trace" aria-pressed="false">' + ArtArt.icon('trace') + '<span>Trace</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="cm-body">' +
          '<div class="cm-ref">' +
            '<div class="fr fr-gold cm-ref-frame"><span class="fr-mould"><span class="fr-mat"><span class="cm-ref-art">' + studySvg(comp, 'cm-ref-svg') + '<span class="cm-ref-grid"></span></span></span></span></div>' +
            '<details class="cm-note" open><summary>About this picture</summary><p>' + esc(comp.note) + '</p></details>' +
          '</div>' +
          '<div class="cm-kit"></div>' +
        '</div>' +
      '</div>';
    var self = state;
    requestAnimationFrame(function () {
      if (state !== self) return;
      var host = wrap.querySelector('.cm-kit');
      state.kit = new ArtStudio.Kit(host, {
        landscape: true,
        onSave: function (k) {
          ArtStudio.openSaveDialog(k.surface, ('Copy: ' + comp.title).slice(0, 20), function () {
            var p = ArtStudio.getProgress(), list = (p.mastersCopied || []).slice();
            if (list.indexOf(comp.id) === -1) { list.push(comp.id); ArtStudio.saveProgress({ mastersCopied: list }); }
            if (typeof ActivityLog !== 'undefined' && ActivityLog.log) ActivityLog.log('Art Studio', '🖼', 'Copied "' + comp.title + '"');
          });
        },
        saveShort: 'Save'
      });
      var t = comp.tools;
      if (t === 'shapes') state.kit.useShape('line', 'oil');
      else if (t) state.kit.setTool(t);
    });
    wrap.querySelector('.cm-play').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cmact]');
      if (!b) return;
      var a = b.dataset.cmact;
      if (a === 'back') _backToPicker();
      else if (a === 'grid') { state.grid = !state.grid; b.setAttribute('aria-pressed', state.grid); _overlays(); }
      else if (a === 'trace') { state.trace = !state.trace; b.setAttribute('aria-pressed', state.trace); _overlays(); }
    });
  }

  function _overlays() {
    if (!state || !state.kit) return;
    var S = state.kit.surface;
    S.over.innerHTML = state.grid ? gridSvg() : '';
    S.under.innerHTML = state.trace ? '<div class="cm-trace">' + state.comp.guideSvg + '</div>' : '';
    var rg = wrap.querySelector('.cm-ref-grid');
    if (rg) rg.innerHTML = state.grid ? gridSvg() : '';
  }

  function _backToPicker() {
    if (state && state.kit) state.kit.destroy();
    state = null;
    _renderPicker();
  }

  return { open: open, close: close, show: show, start: start, COMPOSITIONS: COMPOSITIONS, _backToPicker: _backToPicker };
})();
