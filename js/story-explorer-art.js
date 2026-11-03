/* ================================================================
   STORY EXPLORER — illustrated storybook art (js/story-explorer-art.js)

   Every picture in Story Explorer is drawn here, in code, as SVG:
   no images, no network. Picture-book style — layered scenery with
   aerial perspective, a warm key light from the upper left, soft
   cast shadows and a painted vignette — and a small cast of
   characters drawn the same way on every page they appear on
   (Leo, Ciro the condor, Rayo, Pablito the pudú, Pipo the penguin…).

     StoryArt.page(storyId, pageIndex) → '<svg …>'  (4:3 scene)
     StoryArt.cover(storyId)           → '<svg …>'  (4:3 cover scene)
     StoryArt.portrait(charId)         → '<svg …>'  (1:1 character card)
     StoryArt.has(storyId)             → bool

   Each call gets its own id prefix, so any number of pictures can sit
   on one page without their gradients colliding.
   Exposes one global: StoryArt.
   ================================================================ */

var StoryArt = (function () {
  'use strict';

  // ── tiny helpers ────────────────────────────────────────────────
  let _seq = 0;
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hx(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  function mix(a, b, t) {
    const A = hx(a), B = hx(b);
    return '#' + [0, 1, 2].map(i => ('0' + Math.round(A[i] + (B[i] - A[i]) * t).toString(16)).slice(-2)).join('');
  }
  const dk = (c, t) => mix(c, '#1a1020', t);
  const lt = (c, t) => mix(c, '#fffaf0', t);
  const f1 = n => Math.round(n * 10) / 10;

  function Ctx() { this.u = 's' + (++_seq).toString(36) + '_'; this.d = []; this.k = {}; }
  Ctx.prototype._def = function (key, make) {
    let id = this.k[key];
    if (!id) { id = this.u + this.d.length; this.k[key] = id; this.d.push(make(id)); }
    return 'url(#' + id + ')';
  };
  function stops(s) {
    return s.map(x => '<stop offset="' + x[0] + '" stop-color="' + x[1] + '"' + (x[2] != null ? ' stop-opacity="' + x[2] + '"' : '') + '/>').join('');
  }
  // linear gradient, default top→bottom
  Ctx.prototype.lin = function (s, x1, y1, x2, y2) {
    x1 = x1 || 0; y1 = y1 || 0; x2 = x2 == null ? 0 : x2; y2 = y2 == null ? 1 : y2;
    return this._def('L' + JSON.stringify(s) + x1 + y1 + x2 + y2, id =>
      '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stops(s) + '</linearGradient>');
  };
  // horizontal convenience (light from the left)
  Ctx.prototype.side = function (c, k) { k = k || 0.22; return this.lin([[0, lt(c, k * 0.6)], [0.55, c], [1, dk(c, k)]], 0, 0, 1, 0); };
  Ctx.prototype.vert = function (c, k) { k = k || 0.22; return this.lin([[0, lt(c, k * 0.6)], [1, dk(c, k)]]); };
  Ctx.prototype.rad = function (s, cx, cy, r, fx, fy) {
    cx = cx == null ? 0.5 : cx; cy = cy == null ? 0.5 : cy; r = r == null ? 0.5 : r;
    return this._def('R' + JSON.stringify(s) + cx + cy + r + fx + fy, id =>
      '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' +
      (fx != null ? ' fx="' + fx + '" fy="' + fy + '"' : '') + '>' + stops(s) + '</radialGradient>');
  };
  Ctx.prototype.blur = function (sd) {
    return this._def('B' + sd, id => '<filter id="' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="' + sd + '"/></filter>');
  };

  const P = (d, fill, x) => '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (x ? ' ' + x : '') + '/>';
  const C = (cx, cy, r, fill, x) => '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r) + '" fill="' + fill + '"' + (x ? ' ' + x : '') + '/>';
  const E = (cx, cy, rx, ry, fill, x) => '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="' + fill + '"' + (x ? ' ' + x : '') + '/>';
  const Rc = (x, y, w, h, fill, xx) => '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + fill + '"' + (xx ? ' ' + xx : '') + '/>';
  const G = (t, inner, x) => '<g' + (t ? ' transform="' + t + '"' : '') + (x ? ' ' + x : '') + '>' + inner + '</g>';
  const L = (pts, col, w, x) => '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (x ? ' ' + x : '') + '/>';
  const S = (d, col, w, x) => '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (x ? ' ' + x : '') + '/>';
  const T = (x, y, s) => 'translate(' + f1(x) + ',' + f1(y) + ')' + (s != null && s !== 1 ? ' scale(' + s + ')' : '');
  const shadow = (c, x, y, rx, op) => E(x, y, rx, rx * 0.22, c.rad([[0, '#1a1020', op == null ? 0.32 : op], [1, '#1a1020', 0]]));

  function svg(c, body, vb) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '0 0 400 300') + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' +
      c.d.join('') + '</defs>' + body + '</svg>';
  }

  // ── sky, light, atmosphere ─────────────────────────────────────
  const SKY = {
    day:    [[0, '#4FA7E0'], [0.55, '#9FD3F2'], [1, '#FFF0D2']],
    morning:[[0, '#6FB3E3'], [0.6, '#BFE0F0'], [1, '#FFE2B8']],
    dawn:   [[0, '#4B5C9E'], [0.5, '#D99487'], [0.85, '#F7C08C'], [1, '#FFE0A6']],
    sunset: [[0, '#2E2C69'], [0.45, '#B4566D'], [0.75, '#EE8F56'], [1, '#FFCF86']],
    dusk:   [[0, '#1B1F4F'], [0.6, '#5B4C8A'], [1, '#D58B7F']],
    night:  [[0, '#060A24'], [0.6, '#152056'], [1, '#2E3A78']],
    storm:  [[0, '#38414F'], [0.6, '#6B7686'], [1, '#A3ADBA']],
    snow:   [[0, '#5E9FD8'], [0.6, '#B6DBF5'], [1, '#EEF7FF']],
    thin:   [[0, '#2F78C8'], [0.6, '#8CC2EC'], [1, '#E9F4FA']],
    desert: [[0, '#3F95D6'], [0.6, '#A3D2EE'], [1, '#FCE0AE']],
    space:  [[0, '#02030B'], [1, '#0D1236']],
    sea:    [[0, '#5AB0E4'], [1, '#E5F4FF']]
  };
  function sky(c, mode) { return Rc(-2, -2, 404, 304, c.lin(SKY[mode] || SKY.day)); }
  function sunDisc(c, x, y, r, col, glow) {
    col = col || '#FFE59A';
    return C(x, y, r * (glow || 5), c.rad([[0, col, 0.55], [0.3, col, 0.2], [1, col, 0]])) +
      C(x, y, r, c.rad([[0, '#FFFEF6'], [0.65, lt(col, 0.4)], [1, col]]));
  }
  function moon(c, x, y, r, phase) {
    const glow = C(x, y, r * 4, c.rad([[0, '#E8ECFF', 0.35], [1, '#E8ECFF', 0]]));
    if (phase === 'full') {
      return glow + C(x, y, r, c.rad([[0, '#FFFDF2'], [1, '#D9D6C8']], 0.4, 0.4, 0.7)) +
        C(x - r * 0.3, y - r * 0.2, r * 0.18, '#C9C4B2', 'opacity=".6"') + C(x + r * 0.25, y + r * 0.3, r * 0.24, '#C9C4B2', 'opacity=".5"') +
        C(x + r * 0.35, y - r * 0.35, r * 0.1, '#C9C4B2', 'opacity=".6"');
    }
    return glow + P('M' + x + ',' + (y - r) + ' A' + r + ',' + r + ' 0 1 0 ' + x + ',' + (y + r) + ' A' + (r * 0.72) + ',' + r + ' 0 1 1 ' + x + ',' + (y - r) + 'Z', '#FFF8DC');
  }
  function starsField(c, seed, n, y1, y2, big) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 400, y = y1 + r() * (y2 - y1), rr = 0.4 + r() * (big ? 1.4 : 0.9), o = 0.35 + r() * 0.65;
      s += C(x, y, rr, '#FFFFFF', 'opacity="' + o.toFixed(2) + '"');
    }
    for (let i = 0; i < Math.round(n / 14); i++) {
      const x = r() * 400, y = y1 + r() * (y2 - y1) * 0.8, k = 2.5 + r() * 3;
      s += P('M' + x + ',' + (y - k) + ' L' + (x + k * 0.22) + ',' + y + ' L' + x + ',' + (y + k) + ' L' + (x - k * 0.22) + ',' + y + 'Z M' + (x - k) + ',' + y + ' L' + x + ',' + (y + k * 0.22) + ' L' + (x + k) + ',' + y + ' L' + x + ',' + (y - k * 0.22) + 'Z', '#FFFFFF', 'opacity=".9"');
    }
    return s;
  }
  function milkyWay(c, seed) {
    const r = rng(seed); let s = G('rotate(-28 200 120)',
      E(200, 120, 260, 34, c.rad([[0, '#C9B8F0', 0.42], [0.5, '#7D74C4', 0.2], [1, '#3A3F8A', 0]])) +
      E(210, 118, 200, 12, c.rad([[0, '#FFF2DC', 0.35], [1, '#FFF2DC', 0]])) +
      E(150, 126, 60, 6, '#140F35', 'opacity=".35"') + E(260, 112, 70, 5, '#140F35', 'opacity=".3"'));
    for (let i = 0; i < 140; i++) {
      const t = r() * 2 - 1, off = (r() - 0.5) * 50;
      const x = 200 + t * 240, y = 120 + off;
      const a = -28 * Math.PI / 180, X = 200 + (x - 200) * Math.cos(a) - (y - 120) * Math.sin(a), Y = 120 + (x - 200) * Math.sin(a) + (y - 120) * Math.cos(a);
      s += C(X, Y, 0.3 + r() * 0.7, '#FFFFFF', 'opacity="' + (0.3 + r() * 0.6).toFixed(2) + '"');
    }
    return s;
  }
  const CLOUD = {
    day: ['#FFFFFF', '#CFE1F2'], morning: ['#FFFFFF', '#E9D6CC'], dawn: ['#FFE6D8', '#C98C93'], sunset: ['#FFD9B8', '#B9667A'],
    storm: ['#AEB7C3', '#5F6A7B'], night: ['#4E5790', '#222A5C'], snow: ['#FFFFFF', '#C4D9EE'], dusk: ['#B9A2C4', '#5B4C82']
  };
  function cloud(c, x, y, s, tone, v) {
    const k = CLOUD[tone] || CLOUD.day;
    const shapes = [
      'M-46,10 Q-50,-4 -32,-6 Q-30,-22 -10,-20 Q0,-36 18,-24 Q36,-30 38,-10 Q54,-8 50,10 Z',
      'M-36,8 Q-40,-6 -22,-8 Q-16,-22 2,-16 Q16,-26 26,-10 Q42,-10 38,8 Z',
      'M-60,8 Q-58,-2 -44,-3 Q-40,-14 -24,-11 Q-14,-22 4,-14 Q20,-20 30,-8 Q50,-10 56,0 Q62,8 52,8 Z'
    ];
    return G(T(x, y, s), P(shapes[(v || 0) % 3], c.lin([[0, k[0]], [0.65, k[0]], [1, k[1]]])) +
      P('M-30,-6 Q-20,-14 -8,-12', 'none', 'stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"'));
  }
  function haze(c, y, h, col, op) { return Rc(-2, y, 404, h, c.lin([[0, col, 0], [0.5, col, op == null ? 0.45 : op], [1, col, 0]])); }
  function rays(c, x, y, spread, col, op) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = (-0.9 + i * 0.45) * spread;
      const x2 = x + Math.sin(a) * 420, y2 = y + Math.cos(a) * 420;
      const x3 = x + Math.sin(a + 0.09) * 420, y3 = y + Math.cos(a + 0.09) * 420;
      s += P('M' + x + ',' + y + ' L' + f1(x2) + ',' + f1(y2) + ' L' + f1(x3) + ',' + f1(y3) + 'Z', c.lin([[0, col || '#FFFFFF', op || 0.35], [1, col || '#FFFFFF', 0]]));
    }
    return s;
  }
  function finish(c, warm) {
    // a warm key light from the upper left and a soft painted vignette
    return Rc(-2, -2, 404, 304, c.rad([[0, warm || '#FFF3D6', 0.22], [1, warm || '#FFF3D6', 0]], 0.18, 0.12, 0.7)) +
      Rc(-2, -2, 404, 304, c.lin([[0.72, '#2A1830', 0], [1, '#2A1830', 0.16]])) +
      Rc(-2, -2, 404, 304, c.rad([[0.62, '#2A1830', 0], [1, '#2A1830', 0.3]], 0.5, 0.5, 0.75));
  }

  // ── landforms ──────────────────────────────────────────────────
  // A mountain is a lit face and a shaded face split by a ridge line,
  // with an optional ragged snow cap.
  function peak(c, x, base, w, h, pal, snow, r) {
    r = r || Math.random;
    const ax = x + (r() - 0.5) * w * 0.12, ay = base - h;
    const lx = x - w / 2, rx = x + w / 2, mid = x + w * 0.1 + (r() - 0.5) * w * 0.08;
    const k1x = ax + w * 0.05, k1y = ay + h * 0.32;
    let s = P('M' + f1(lx) + ',' + base + ' L' + f1(ax) + ',' + f1(ay) + ' L' + f1(k1x) + ',' + f1(k1y) + ' L' + f1(mid) + ',' + base + 'Z', pal[0]) +
      P('M' + f1(ax) + ',' + f1(ay) + ' L' + f1(rx) + ',' + base + ' L' + f1(mid) + ',' + base + ' L' + f1(k1x) + ',' + f1(k1y) + 'Z', pal[1]);
    if (snow) {
      const sh = h * (typeof snow === 'number' ? snow : 0.3);
      const xl = ax - (ax - lx) * (sh / h), xr = ax + (rx - ax) * (sh / h);
      let pts = 'M' + f1(ax) + ',' + f1(ay) + ' L' + f1(xr) + ',' + f1(ay + sh);
      const n = 6;
      for (let i = 1; i < n; i++) {
        const t = i / n, X = xr + (xl - xr) * t, Y = ay + sh * (i % 2 ? 0.62 + r() * 0.2 : 0.95 + r() * 0.15);
        pts += ' L' + f1(X) + ',' + f1(Y);
      }
      pts += ' L' + f1(xl) + ',' + f1(ay + sh) + 'Z';
      s += P(pts, pal[2] || '#FBFDFF');
      const kx = ax + (k1x - ax) * Math.min(1, sh / (h * 0.32));
      s += P('M' + f1(ax) + ',' + f1(ay) + ' L' + f1(xr) + ',' + f1(ay + sh) + ' L' + f1(xr - (xr - kx) * 0.55) + ',' + f1(ay + sh * 0.8) + ' L' + f1(kx) + ',' + f1(ay + sh * 0.9) + 'Z', pal[3] || '#B9CCE6', 'opacity=".8"');
    }
    return s;
  }
  function range(c, seed, base, n, hMin, hMax, pal, snow, x0, x1) {
    const r = rng(seed); let s = '';
    x0 = x0 == null ? -30 : x0; x1 = x1 == null ? 430 : x1;
    const step = (x1 - x0) / (n - 1);
    for (let i = 0; i < n; i++) {
      const h = hMin + r() * (hMax - hMin);
      s += peak(c, x0 + i * step + (r() - 0.5) * step * 0.5, base, h * (1.5 + r() * 0.6), h, pal, snow, r);
    }
    return s;
  }
  // far → near mountain palettes (lit, shade, snow, snow-shade)
  const MT = {
    far:   ['#9DB6D8', '#86A0C8', '#F4F8FF', '#C7D6EE'],
    mid:   ['#7D8FB8', '#5F6F9C', '#F7FAFF', '#B4C4E2'],
    near:  ['#6A6F93', '#4D5175', '#FFFFFF', '#AFC0DE'],
    brown: ['#B88C6A', '#8E6650', '#F8F3EC', '#D5C3B6'],
    rust:  ['#C98A5E', '#9C6244', '#F6EFE6', '#D9C4B2'],
    dusk:  ['#7A5E8E', '#58456E', '#E9DDF0', '#B8A4C8'],
    night: ['#2C3566', '#1D2550', '#8C9AC8', '#5E6CA0'],
    green: ['#6E9A62', '#4F7A4E', '#F5FAF5', '#C4D8CA'],
    storm: ['#5D6778', '#454E5E', '#DDE3EA', '#A9B4C2']
  };
  function hills(c, seed, y, amp, top, bot, n) {
    const r = rng(seed); n = n || 5;
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([-20 + i * (440 / n), y - r() * amp]);
    let d = 'M-20,310 L' + pts[0][0] + ',' + f1(pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ' Q' + f1(pts[i][0]) + ',' + f1(pts[i][1]) + ' ' + f1(mx) + ',' + f1(my);
    }
    d += ' L420,' + f1(pts[n][1]) + ' L420,310Z';
    return P(d, c.lin([[0, top], [1, bot || dk(top, 0.25)]]));
  }
  function ground(c, y, top, bot) { return Rc(-2, y, 404, 304 - y, c.lin([[0, top], [1, bot || dk(top, 0.2)]])); }
  function sea(c, y, top, bot, seed) {
    const r = rng(seed || 3); let s = Rc(-2, y, 404, 304 - y, c.lin([[0, top || '#4A9FD0'], [1, bot || '#1D5E92']]));
    for (let i = 0; i < 16; i++) {
      const yy = y + 4 + Math.pow(r(), 1.6) * (300 - y), w = 8 + (yy - y) * 0.25 + r() * 16, xx = r() * 400;
      s += S('M' + f1(xx) + ',' + f1(yy) + ' q' + f1(w / 2) + ',-2 ' + f1(w) + ',0', '#FFFFFF', 1 + (yy - y) / 90, 'opacity="' + (0.25 + r() * 0.35).toFixed(2) + '"');
    }
    return s;
  }
  function rock(c, x, y, w, h, col) {
    col = col || '#8D8478';
    return shadow(c, x + w * 0.1, y, w * 0.62) +
      P('M' + f1(x - w / 2) + ',' + y + ' L' + f1(x - w * 0.42) + ',' + f1(y - h * 0.6) + ' L' + f1(x - w * 0.1) + ',' + f1(y - h) + ' L' + f1(x + w * 0.3) + ',' + f1(y - h * 0.85) + ' L' + f1(x + w / 2) + ',' + f1(y - h * 0.3) + ' L' + f1(x + w * 0.46) + ',' + y + 'Z', dk(col, 0.25)) +
      P('M' + f1(x - w / 2) + ',' + y + ' L' + f1(x - w * 0.42) + ',' + f1(y - h * 0.6) + ' L' + f1(x - w * 0.1) + ',' + f1(y - h) + ' L' + f1(x + w * 0.05) + ',' + f1(y - h * 0.55) + ' L' + f1(x - w * 0.05) + ',' + y + 'Z', col) +
      P('M' + f1(x - w * 0.42) + ',' + f1(y - h * 0.6) + ' L' + f1(x - w * 0.1) + ',' + f1(y - h) + ' L' + f1(x - w * 0.16) + ',' + f1(y - h * 0.7) + 'Z', lt(col, 0.35));
  }
  function grass(c, seed, y1, y2, n, col) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 400, y = y1 + r() * (y2 - y1), h = 4 + r() * 7 * (0.6 + (y - y1) / Math.max(1, y2 - y1));
      s += S('M' + f1(x - 2) + ',' + f1(y) + ' q1,-' + f1(h * 0.6) + ' -1,-' + f1(h) + ' M' + f1(x) + ',' + f1(y) + ' q0,-' + f1(h) + ' 2,-' + f1(h * 1.2) + ' M' + f1(x + 2) + ',' + f1(y) + ' q1,-' + f1(h * 0.5) + ' 3,-' + f1(h * 0.8), col || '#5C8A3E', 1.2);
    }
    return s;
  }

  // ── plants ─────────────────────────────────────────────────────
  function roundTree(c, x, y, s, col) {
    col = col || '#4E8A47';
    return G(T(x, y, s), shadow(c, 4, 0, 26) +
      P('M-4,0 L-3,-34 L3,-34 L4,0Z', c.side('#6B4A33')) +
      S('M0,-24 L-10,-38 M1,-28 L10,-40', '#5B3E2B', 3) +
      C(-14, -46, 17, dk(col, 0.25)) + C(14, -48, 18, dk(col, 0.3)) + C(0, -62, 21, col) + C(-12, -52, 15, col) +
      C(-8, -66, 11, lt(col, 0.25)) + C(-16, -54, 7, lt(col, 0.3)) + C(10, -54, 12, dk(col, 0.12)));
  }
  function araucaria(c, x, y, s, col) {
    col = col || '#2F5D3A';
    let br = '';
    const tiers = [[-78, 30], [-88, 26], [-97, 20], [-104, 13]];
    tiers.forEach((t, i) => {
      br += P('M0,' + t[0] + ' Q-' + t[1] * 0.6 + ',' + (t[0] - 8) + ' -' + t[1] + ',' + (t[0] + 4) + ' Q-' + t[1] * 0.5 + ',' + (t[0] - 2) + ' 0,' + (t[0] + 3) + 'Z', i % 2 ? col : dk(col, 0.15)) +
        P('M0,' + t[0] + ' Q' + t[1] * 0.6 + ',' + (t[0] - 8) + ' ' + t[1] + ',' + (t[0] + 4) + ' Q' + t[1] * 0.5 + ',' + (t[0] - 2) + ' 0,' + (t[0] + 3) + 'Z', dk(col, 0.28));
    });
    return G(T(x, y, s), shadow(c, 3, 0, 14) + P('M-3,0 L-1.6,-104 L1.6,-104 L3,0Z', c.side('#7A6656')) + br +
      P('M-30,-74 Q-15,-84 0,-80', 'none', 'stroke="' + lt(col, 0.35) + '" stroke-width="2"'));
  }
  function poplar(c, x, y, s, col) {
    col = col || '#5F8F3E';
    return G(T(x, y, s), shadow(c, 3, 0, 10) + Rc(-1.5, -14, 3, 14, '#6B4A33') +
      E(0, -48, 10, 40, c.side(col, 0.3)) + E(-3, -56, 4, 26, lt(col, 0.2), 'opacity=".7"'));
  }
  function pine(c, x, y, s, col) {
    col = col || '#2E5E46';
    return G(T(x, y, s), shadow(c, 3, 0, 12) + Rc(-2, -10, 4, 10, '#5B3E2B') +
      P('M0,-70 L-16,-30 L-8,-32 L-20,-8 L20,-8 L8,-32 L16,-30Z', dk(col, 0.2)) +
      P('M0,-70 L-16,-30 L-8,-32 L-20,-8 L0,-8Z', col));
  }
  function fern(c, x, y, s, col) {
    col = col || '#5E9A4A'; let f = '';
    [-60, -30, 0, 30, 60].forEach((a, i) => {
      f += G('rotate(' + a + ')', P('M0,0 Q-6,-14 0,-30 Q6,-14 0,0Z', i % 2 ? col : dk(col, 0.15)) + S('M0,0 L0,-28', dk(col, 0.3), 0.8));
    });
    return G(T(x, y, s), f);
  }
  function cactus(c, x, y, s) {
    const g = c.side('#5E8C4C', 0.35);
    return G(T(x, y, s), shadow(c, 6, 0, 16) +
      Rc(-5, -60, 10, 60, g, 'rx="5"') + P('M-4,-26 L-14,-26 Q-18,-26 -18,-32 L-18,-46 Q-18,-50 -14,-50 Q-11,-50 -11,-46 L-11,-33 L-4,-33Z', g) +
      P('M4,-36 L13,-36 Q17,-36 17,-42 L17,-54 Q17,-58 13,-58 Q10,-58 10,-54 L10,-43 L4,-43Z', g) +
      S('M-1,-56 L-1,-4 M2,-56 L2,-6', '#3E6A36', 0.7));
  }
  function bush(c, x, y, s, col) {
    col = col || '#5A8A48';
    return G(T(x, y, s), shadow(c, 2, 0, 16) + C(-9, -7, 9, dk(col, 0.2)) + C(8, -8, 10, dk(col, 0.25)) + C(0, -12, 11, col) + C(-4, -15, 5, lt(col, 0.3)));
  }

  // ── characters ─────────────────────────────────────────────────
  // People share one rig: origin at the feet, ~100 units tall, facing
  // right (flip for left), light from the upper left.
  const SKIN = ['#F1C7A1', '#E2AE85', '#C98F66', '#F4D2B4'];
  function limb(pts, w, col) { return L(pts, col, w); }
  function armAt(sx, sy, a, b, len) {
    const r = Math.PI / 180, l = len || 14;
    const ex = sx + Math.sin(a * r) * l, ey = sy + Math.cos(a * r) * l;
    const hxx = ex + Math.sin((a + b) * r) * l, hyy = ey + Math.cos((a + b) * r) * l;
    return { pts: f1(sx) + ',' + f1(sy) + ' ' + f1(ex) + ',' + f1(ey) + ' ' + f1(hxx) + ',' + f1(hyy), hx: hxx, hy: hyy };
  }
  function prop(c, kind, x, y) {
    switch (kind) {
      case 'compass': return G(T(x + 2, y - 1), C(0, 0, 6.5, c.rad([[0, '#F2D27A'], [1, '#A47A22']])) + C(0, 0, 4.8, '#FBF6E6') +
        P('M0,-4 L1.3,0 L0,4 L-1.3,0Z', '#C0392B') + P('M0,0 L1.3,0 L0,4 L-1.3,0Z', '#34495E') + C(-2, -2.4, 1.2, '#fff', 'opacity=".8"'));
      case 'map': return G(T(x + 4, y - 4) + ' rotate(-8)', Rc(-10, -8, 22, 16, '#EED9A8') + S('M-10,-8 l0,16 M12,-8 l0,16', '#B8955A', 1.2) +
        S('M-6,4 q4,-6 8,-2 t6,-6', '#B03A2E', 1, 'stroke-dasharray="1.5 1.5"') + P('M7,-5 l2,2 m0,-2 l-2,2', 'none', 'stroke="#B03A2E" stroke-width="1"'));
      case 'notebook': return G(T(x + 3, y - 2) + ' rotate(-12)', Rc(-7, -9, 13, 17, '#7A4B2E', 'rx="1.5"') + Rc(-5.5, -8, 10.5, 15, '#FBF5E4') + S('M-4,-4 h7 M-4,-1 h7 M-4,2 h5', '#9A8E7A', 0.8));
      case 'lantern': return G(T(x, y + 2), C(0, 8, 22, c.rad([[0, '#FFD98A', 0.6], [1, '#FFD98A', 0]])) + S('M0,-2 L0,2', '#333', 1) + Rc(-4, 2, 8, 11, '#FFE7A0', 'rx="2"') + Rc(-4.5, 1, 9, 2.5, '#5B4A3A') + Rc(-4.5, 12, 9, 2.5, '#5B4A3A'));
      case 'pole': return S('M' + x + ',' + (y - 14) + ' L' + (x + 4) + ',' + (y + 34), '#5A6470', 2);
      case 'magnifier': return G(T(x + 5, y - 5), S('M-4,4 L-9,9', '#5B3E2B', 2.6) + C(0, 0, 6, c.rad([[0, '#E6F4FF', 0.5], [1, '#9ACBEB', 0.7]]), 'stroke="#B08A3A" stroke-width="1.8"'));
      case 'spoon': return S('M' + x + ',' + y + ' l9,-6', '#9AA3AD', 1.8) + E(x + 10, y - 7, 3, 2, '#9AA3AD');
      case 'blueprint': return G(T(x + 6, y - 4) + ' rotate(-6)', Rc(-12, -8, 26, 17, '#2F6DB5') + S('M-9,-4 h18 M-9,0 h12 M-9,4 h16 M4,-6 v12', '#CFE4FF', 0.8));
      case 'flag': return S('M' + x + ',' + (y + 6) + ' L' + x + ',' + (y - 40), '#6B4A33', 2) + flagCL(c, x + 1, y - 40, 18);
      default: return '';
    }
  }
  function flagCL(c, x, y, w) {
    const h = w * 2 / 3;
    return G(T(x, y), P('M0,0 Q' + w * 0.5 + ',-2 ' + w + ',0 L' + w + ',' + h + ' Q' + w * 0.5 + ',' + (h - 2) + ' 0,' + h + 'Z', '#D52B1E') +
      P('M0,0 Q' + w * 0.5 + ',-2 ' + w + ',0 L' + w + ',' + h / 2 + ' Q' + w * 0.5 + ',' + (h / 2 - 2) + ' 0,' + h / 2 + 'Z', '#FFFFFF') +
      P('M0,0 L' + w / 3 + ',-0.6 L' + w / 3 + ',' + (h / 2 - 0.7) + ' L0,' + h / 2 + 'Z', '#0039A6') +
      P(starPath(w / 6, h / 4, w * 0.075), '#FFFFFF'));
  }
  function starPath(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r;
      d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rr) + ',' + f1(cy + Math.sin(a) * rr);
    }
    return d + 'Z';
  }

  function person(c, o) {
    o = Object.assign({
      x: 0, y: 0, s: 1, flip: false, skin: SKIN[0], hair: '#5A3A22', hairStyle: 'short', hat: null, hatCol: '#C8372D',
      top: '#3F8F5A', bottom: '#2D4A78', boots: '#4A2F1E', pack: null, legs: 'stand', la: 12, lb: 18, ra: -14, rb: -10,
      face: 'smile', prop: null, coat: null, beard: null, manta: null, scarf: null, apron: null, lamp: false
    }, o);
    const dy = o.legs === 'kneel' ? 15 : o.legs === 'sit' ? 18 : 0;
    const hipY = -40 + dy, shY = -68 + dy, hY = -81 + dy;
    const sk = o.skin, skD = dk(sk, 0.18);
    let out = o.legs === 'ride' ? '' : shadow(c, 2, 0, 20);
    // far arm
    const fa = armAt(-7, shY + 4, o.ra, o.rb);
    out += limb(fa.pts, 6.6, dk(o.coat || o.top, 0.22)) + C(fa.hx, fa.hy, 3.4, skD);
    if (o.pack) out += Rc(-19, shY + 1, 11, 25, c.side(o.pack, 0.3), 'rx="4"') + Rc(-20, shY + 15, 12, 4, dk(o.pack, 0.25), 'rx="2"');
    // legs
    const pc = o.bottom, bc = o.boots;
    if (o.legs === 'walk') {
      out += limb('-3,' + hipY + ' -9,-20 -14,-3', 8.5, dk(pc, 0.18)) + E(-13, -2.5, 6, 3.4, dk(bc, 0.1)) +
        limb('3,' + hipY + ' 7,-20 11,-3', 8.5, pc) + E(14, -2.5, 6.4, 3.6, bc);
    } else if (o.legs === 'kneel') {
      out += limb('3,' + hipY + ' 10,-4 22,-3', 8.5, dk(pc, 0.18)) + E(24, -2.5, 5, 3, dk(bc, 0.1)) +
        limb('-2,' + hipY + ' 13,-24 13,-3', 8.5, pc) + E(16, -2.5, 6.2, 3.4, bc);
    } else if (o.legs === 'sit') {
      out += limb('-2,' + hipY + ' 14,' + (hipY + 1) + ' 15,-3', 8.5, dk(pc, 0.18)) + E(17, -2.5, 6, 3.3, dk(bc, 0.1)) +
        limb('3,' + hipY + ' 19,' + (hipY - 1) + ' 21,-3', 8.5, pc) + E(23, -2.5, 6.2, 3.4, bc);
    } else if (o.legs === 'ride') {
      out += limb('2,' + hipY + ' 10,-27 8,-10', 8.5, pc) + P('M3,-14 L14,-12 Q15,-6 10,-5 L3,-6Z', bc) +
        C(3, -9, 3.4, 'none', 'stroke="#C9A43A" stroke-width="1.4"');
    } else {
      out += limb('-3,' + hipY + ' -4,-20 -5,-3', 8.5, dk(pc, 0.18)) + E(-3, -2.5, 6, 3.4, dk(bc, 0.1)) +
        limb('3,' + hipY + ' 4,-20 5,-3', 8.5, pc) + E(8, -2.5, 6.4, 3.6, bc);
    }
    // torso
    const tc = o.top;
    out += P('M-10,' + shY + ' Q-13,' + (shY + 14) + ' -10,' + (hipY + 3) + ' L10,' + (hipY + 3) + ' Q13,' + (shY + 14) + ' 10,' + shY + ' Q0,' + (shY - 4) + ' -10,' + shY + 'Z', c.side(tc, 0.28));
    if (o.coat) out += P('M-11,' + (shY + 1) + ' Q-14,' + (shY + 20) + ' -13,' + (hipY + 16) + ' L13,' + (hipY + 16) + ' Q14,' + (shY + 20) + ' 11,' + (shY + 1) + ' L6,' + (shY - 1) + ' L2,' + (hipY + 12) + ' L-2,' + (shY - 1) + 'Z', c.side(o.coat, 0.3)) +
      C(4, shY + 12, 1, lt(o.coat, 0.4)) + C(4, shY + 19, 1, lt(o.coat, 0.4));
    else out += S('M2,' + (shY + 2) + ' L2,' + (hipY + 2), dk(tc, 0.3), 1) + Rc(-10, hipY - 1, 20, 4, dk(tc, 0.35), 'rx="1"');
    if (o.apron) out += P('M-6,' + (shY + 8) + ' L8,' + (shY + 8) + ' L10,' + (hipY + 14) + ' L-7,' + (hipY + 14) + 'Z', o.apron) + S('M-6,' + (shY + 8) + ' L-8,' + shY + ' M8,' + (shY + 8) + ' L9,' + shY, o.apron, 1.2);
    if (o.manta) {
      const m = o.manta;
      out += P('M-14,' + (shY + 2) + ' Q0,' + (shY - 6) + ' 14,' + (shY + 2) + ' L17,' + (hipY + 4) + ' L-16,' + (hipY + 4) + 'Z', c.side(m[0], 0.25)) +
        S('M-15.4,' + (hipY - 2) + ' L16.4,' + (hipY - 2), m[1], 2.2) + S('M-15,' + (hipY - 6) + ' L16,' + (hipY - 6), m[2], 1.6) + S('M-14.5,' + (hipY - 9.5) + ' L15.5,' + (hipY - 9.5), m[1], 1.2) +
        S('M-14,' + (shY + 4) + ' Q0,' + (shY - 3) + ' 14,' + (shY + 4), m[2], 1.6);
    }
    if (o.scarf) out += P('M-7,' + (shY - 2) + ' Q0,' + (shY + 3) + ' 8,' + (shY - 2) + ' L8,' + (shY + 2) + ' Q0,' + (shY + 7) + ' -7,' + (shY + 2) + 'Z', o.scarf) + P('M-4,' + (shY + 2) + ' L-7,' + (shY + 14) + ' L-2,' + (shY + 13) + 'Z', dk(o.scarf, 0.15));
    // neck + head
    out += Rc(-3, shY - 7, 6, 8, skD);
    if (o.hat === 'hood') out += C(0, hY, 16, c.side(o.hatCol, 0.25)) + C(0, hY, 16, 'none', 'stroke="#EFE6D6" stroke-width="3.2"');
    if (o.hairStyle === 'long') out += P('M-12,' + (hY - 2) + ' Q-17,' + (hY + 16) + ' -8,' + (hY + 20) + ' L-1,' + (hY + 8) + 'Z', dk(o.hair, 0.1));
    if (o.hairStyle === 'bun') out += C(-10, hY - 9, 5.6, o.hair) + C(-11.5, hY - 10.5, 2, lt(o.hair, 0.3));
    if (o.hairStyle === 'pony') out += P('M-10,' + (hY - 6) + ' Q-22,' + (hY - 2) + ' -18,' + (hY + 14) + ' Q-14,' + (hY + 2) + ' -8,' + (hY - 1) + 'Z', o.hair);
    if (o.hat === 'astro') {
      out += C(1, hY, 16, c.rad([[0, '#FFFFFF'], [1, '#C9CED6']], 0.35, 0.3, 0.7)) + P('M-5,' + (hY - 9) + ' Q12,' + (hY - 12) + ' 15,' + (hY + 2) + ' Q12,' + (hY + 10) + ' -2,' + (hY + 8) + ' Q-7,' + hY + ' -5,' + (hY - 9) + 'Z', c.lin([[0, '#F7D774'], [0.5, '#C4892B'], [1, '#6B4317']], 0, 0, 1, 1)) +
        P('M-1,' + (hY - 7) + ' Q6,' + (hY - 9) + ' 9,' + (hY - 5), 'none', 'stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"');
    } else {
      out += C(1, hY, 12.5, c.rad([[0, lt(sk, 0.3)], [0.7, sk], [1, skD]], 0.4, 0.35, 0.7)) + C(-4, hY + 1, 3, skD);
      // hair
      if (o.hairStyle !== 'none' && o.hat !== 'hood') {
        if (o.hairStyle === 'bald') out += P('M-11.5,' + (hY + 1) + ' Q-12,' + (hY - 6) + ' -7,' + (hY - 8) + ' L-6,' + (hY - 4) + ' Q-8,' + (hY - 1) + ' -8,' + (hY + 3) + 'Z', o.hair);
        else out += P('M-12,' + (hY + 2) + ' Q-14,' + (hY - 14) + ' 1,' + (hY - 14) + ' Q14,' + (hY - 13) + ' 13.4,' + (hY - 3) + ' Q8,' + (hY - 9) + ' 0,' + (hY - 8.4) + ' Q-5,' + (hY - 7) + ' -7,' + (hY + 2) + 'Z', c.lin([[0, lt(o.hair, 0.2)], [1, o.hair]]));
      }
      // face
      const eyeC = '#2B1B12';
      if (o.goggles) out += Rc(2, hY - 5, 13, 6.5, c.lin([[0, '#9FE3FF'], [1, '#2D6FA5']]), 'rx="3" stroke="#333" stroke-width="1.2"') + S('M-11,' + (hY - 2) + ' L2,' + (hY - 2), '#333', 1.6);
      else out += E(5.5, hY - 1, 1.4, 1.9, eyeC) + E(10.6, hY - 1, 1.3, 1.8, eyeC) + C(6, hY - 1.7, 0.5, '#fff') + C(11, hY - 1.7, 0.5, '#fff') +
        S('M3.8,' + (hY - 4.6) + ' q1.8,-1 3.4,0 M9.4,' + (hY - 4.6) + ' q1.6,-1 3,0', dk(o.hair, 0.1), 0.9);
      out += S('M12.6,' + (hY - 0.5) + ' q2.6,2.8 -0.4,3.6', skD, 1.2) + C(11, hY + 3, 2.5, '#F08A80', 'opacity=".45"');
      if (o.face === 'wow') out += E(8.6, hY + 6.5, 1.8, 2.3, '#7A3B2A');
      else if (o.face === 'calm') out += S('M6,' + (hY + 6) + ' L10.5,' + (hY + 5.6), '#7A3B2A', 1.2);
      else if (o.face === 'big') out += P('M5,' + (hY + 4.6) + ' Q8.5,' + (hY + 10) + ' 12,' + (hY + 4.2) + 'Z', '#7A3B2A') + P('M6,' + (hY + 5) + ' Q8.5,' + (hY + 6.4) + ' 11,' + (hY + 4.8) + 'Z', '#fff');
      else out += S('M5,' + (hY + 5) + ' Q8,' + (hY + 8) + ' 11.4,' + (hY + 4.6), '#7A3B2A', 1.3);
      if (o.beard) out += P('M-6,' + (hY + 3) + ' Q-4,' + (hY + 15) + ' 6,' + (hY + 13) + ' Q13,' + (hY + 11) + ' 13,' + (hY + 6) + ' Q8,' + (hY + 9) + ' 4,' + (hY + 8) + ' Q-1,' + (hY + 7) + ' -6,' + (hY + 3) + 'Z', o.beard);
      if (o.glasses) out += C(6, hY - 1, 3, 'none', 'stroke="#3A3030" stroke-width="0.9"') + C(11.5, hY - 1, 2.8, 'none', 'stroke="#3A3030" stroke-width="0.9"');
    }
    // hats
    const hc = o.hatCol;
    if (o.hat === 'cap') out += P('M-12,' + (hY - 3) + ' Q-11.5,' + (hY - 17) + ' 1.5,' + (hY - 16.5) + ' Q13,' + (hY - 15.5) + ' 13.2,' + (hY - 5) + 'Z', c.side(hc, 0.3)) +
      P('M8,' + (hY - 6) + ' Q19,' + (hY - 8) + ' 23,' + (hY - 4.5) + ' Q16,' + (hY - 2.4) + ' 9,' + (hY - 3.4) + 'Z', dk(hc, 0.25)) + C(1, hY - 16.4, 1.5, dk(hc, 0.3));
    if (o.hat === 'brim') out += P('M-10,' + (hY - 7) + ' Q-9.5,' + (hY - 20) + ' 1,' + (hY - 20) + ' Q11.5,' + (hY - 20) + ' 11.5,' + (hY - 7) + 'Z', c.side(hc, 0.25)) +
      Rc(-10, hY - 10, 21.5, 3, dk(hc, 0.4)) + E(1, hY - 7.4, 20, 4, c.lin([[0, lt(hc, 0.2)], [1, dk(hc, 0.2)]]));
    if (o.hat === 'chupalla') out += E(1, hY - 8.6, 24, 4.6, c.lin([[0, '#F3D891'], [1, '#B99245']])) + Rc(-8.5, hY - 19, 19, 10.5, c.side('#E7C978', 0.25), 'rx="2"') +
      Rc(-8.5, hY - 12.4, 19, 3, '#2E2219') + E(1, hY - 19, 9.5, 1.6, '#F6E2A6');
    if (o.hat === 'helmet') out += P('M-12.5,' + (hY - 4) + ' Q-12,' + (hY - 19) + ' 1,' + (hY - 19) + ' Q14,' + (hY - 19) + ' 14,' + (hY - 4) + 'Z', c.side(hc, 0.25)) +
      E(1, hY - 4, 16, 2.6, dk(hc, 0.15)) + S('M1,' + (hY - 19) + ' L1,' + (hY - 5), lt(hc, 0.3), 2) +
      (o.lamp ? C(13, hY - 11, 16, c.rad([[0, '#FFF6C8', 0.55], [1, '#FFF6C8', 0]])) + Rc(9, hY - 14, 6, 6, '#565656', 'rx="1.5"') + C(13, hY - 11, 2.4, '#FFFBE0') : '');
    if (o.hat === 'beanie') out += P('M-12,' + (hY - 2) + ' Q-12,' + (hY - 17) + ' 1,' + (hY - 17) + ' Q14,' + (hY - 17) + ' 14,' + (hY - 2) + 'Z', c.side(hc, 0.25)) + Rc(-12.5, hY - 5, 27, 4.5, dk(hc, 0.2), 'rx="2"') + C(1, hY - 18, 3.6, lt(hc, 0.4));
    if (o.hat === 'bicorne') out += P('M-16,' + (hY - 6) + ' Q1,' + (hY - 30) + ' 18,' + (hY - 6) + ' Q1,' + (hY - 12) + ' -16,' + (hY - 6) + 'Z', c.side('#1E2433', 0.3)) + C(1, hY - 15, 2.4, '#C9A43A') + S('M-14,' + (hY - 7) + ' Q1,' + (hY - 12) + ' 16,' + (hY - 7), '#C9A43A', 1);
    if (o.hat === 'shako') out += P('M-9,' + (hY - 6) + ' L-8,' + (hY - 22) + ' L10,' + (hY - 22) + ' L11,' + (hY - 6) + 'Z', c.side('#1E2433', 0.3)) + Rc(-9, hY - 9, 20, 3, '#C9A43A') + P('M10,' + (hY - 6) + ' L18,' + (hY - 4) + ' L10,' + (hY - 3) + 'Z', '#111');
    // near arm, over the body
    const na = armAt(8, shY + 4, o.la, o.lb);
    const armCol = o.manta ? o.manta[0] : (o.coat || o.top);
    out += limb(na.pts, 6.8, armCol) + C(na.hx, na.hy, 3.6, sk);
    if (o.prop) out += prop(c, o.prop, na.hx, na.hy);
    return G(T(o.x, o.y, o.s) + (o.flip ? ' scale(-1,1)' : ''), out);
  }

  // The cast — one look each, reused on every page.
  const CAST = {
    leo:      { skin: SKIN[0], hair: '#5A3A22', hat: 'cap', hatCol: '#D2402F', top: '#3F8F5A', bottom: '#2D4A78', boots: '#5B3A22', pack: '#E08A2E' },
    tomas:    { skin: SKIN[1], hair: '#2E2018', hat: 'hood', hatCol: '#C9302C', top: '#C9302C', bottom: '#2B2F44', boots: '#3A2A20', pack: '#3B6EA8', beard: '#3A2A1E' },
    explorer: { skin: SKIN[3], hair: '#8A5A2E', hairStyle: 'pony', hat: 'brim', hatCol: '#B8945E', top: '#B9A06E', bottom: '#6E5B3E', boots: '#4A2F1E', pack: '#7A8A4E', scarf: '#C0392B' },
    darwin:   { skin: SKIN[0], hair: '#6E4A2E', hat: 'brim', hatCol: '#4A3B2E', top: '#F2EDE0', coat: '#3E4E3A', bottom: '#5B4A3A', boots: '#2A1E16', scarf: '#F8F4EA' },
    huaso:    { skin: SKIN[1], hair: '#2E2018', hat: 'chupalla', top: '#F4EFE6', bottom: '#2A2A2E', boots: '#1E1A18', manta: ['#A8262E', '#F2E3C6', '#1F5E3A'] },
    astro:    { skin: SKIN[0], hat: 'astro', top: '#F3F4F6', bottom: '#E6E8EC', boots: '#9AA1AA', pack: '#E9EBEF' },
    engineer: { skin: SKIN[2], hair: '#2E2018', hat: 'helmet', hatCol: '#F2B705', top: '#E86A1E', bottom: '#38485E', boots: '#3A2A20' },
    miner:    { skin: SKIN[1], hair: '#2E2018', hat: 'helmet', hatCol: '#F5F5F0', top: '#E8762A', bottom: '#3E4A5E', boots: '#2A2420', lamp: true },
    sanmartin:{ skin: SKIN[0], hair: '#2E2018', hat: 'bicorne', top: '#24345E', coat: '#1C2A4E', bottom: '#E9E2CF', boots: '#141414', scarf: '#F5EFE2' },
    ohiggins: { skin: SKIN[3], hair: '#B98A55', hat: 'bicorne', top: '#24345E', coat: '#2B3D6E', bottom: '#E9E2CF', boots: '#141414', scarf: '#B8262E' },
    soldier:  { skin: SKIN[1], hair: '#2E2018', hat: 'shako', top: '#2B3D6E', bottom: '#E9E2CF', boots: '#141414', pack: '#7A6040' },
    astronomer:{ skin: SKIN[3], hair: '#3A2A1E', hairStyle: 'bun', top: '#4A6FA5', bottom: '#2E3448', boots: '#2A2420', glasses: true, scarf: '#E0A43A' },
    sofia:    { skin: SKIN[0], hair: '#6A3E22', hairStyle: 'pony', top: '#E25B6A', bottom: '#3B5E9A', boots: '#E8E2D6', apron: '#FFFFFF' },
    abuela:   { skin: SKIN[1], hair: '#D9D6D0', hairStyle: 'bun', top: '#5E7FA8', bottom: '#4A4458', boots: '#3A2E2A', apron: '#F6EFE2', glasses: true },
    navigator:{ skin: SKIN[2], hair: '#1E1612', hairStyle: 'long', top: '#E2C79A', bottom: '#8A5A3A', boots: '#9C6A48', scarf: '#B5523A' },
    rescuer:  { skin: SKIN[0], hair: '#3A2A1E', hat: 'helmet', hatCol: '#E23B2E', top: '#F28C28', bottom: '#2B2F44', boots: '#2A2420' },
    climber:  { skin: SKIN[3], hair: '#6A3E22', hat: 'beanie', hatCol: '#2E6DB4', top: '#F2A41C', bottom: '#2B2F44', boots: '#3A2A20', pack: '#5A6A3A' },
    pilot:    { skin: SKIN[1], hair: '#2E2018', hat: 'helmet', hatCol: '#E8E8EA', top: '#3D5A80', bottom: '#2B2F44', boots: '#2A2420' },
    dad:      { skin: SKIN[1], hair: '#2E2018', top: '#3E6E9E', bottom: '#3A3A44', boots: '#3A2A20' },
    mom:      { skin: SKIN[0], hair: '#3A2418', hairStyle: 'long', top: '#3E9A7A', bottom: '#4A4458', boots: '#3A2A20' },
    boy:      { skin: SKIN[0], hair: '#6A3E22', top: '#F2B33D', bottom: '#2D4A78', boots: '#E8E2D6' }
  };
  function who(c, id, o) { return person(c, Object.assign({}, CAST[id], o)); }

  // ── animals ────────────────────────────────────────────────────
  function condorFly(c, x, y, s, o) {
    o = o || {};
    const body = o.young ? '#5E4636' : '#1D1C22', wingTop = o.young ? '#6B5240' : '#24232A';
    const patch = o.young ? '#8A6E58' : '#ECEBE6';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''),
      shadow(c, 0, 60, 60, 0.0) +
      // far wing (foreshortened, raised)
      P('M4,-4 C-6,-34 -24,-56 -44,-66 L-40,-58 -50,-60 -42,-52 -52,-50 -42,-45 -48,-40 -36,-38 C-24,-26 -10,-14 0,-2Z', dk(wingTop, 0.2)) +
      // near wing
      P('M-2,2 C-30,-10 -70,-12 -104,-2 L-98,2 -108,6 -97,9 -104,13 -92,14 -96,19 -82,17 C-58,15 -30,14 -2,10Z', c.lin([[0, lt(wingTop, 0.08)], [1, dk(wingTop, 0.2)]])) +
      P('M-8,4 C-30,-2 -52,-2 -70,4 C-50,8 -28,9 -8,9Z', patch, 'opacity="' + (o.young ? 0.5 : 0.95) + '"') +
      // tail + body
      P('M-18,0 L-40,-4 L-42,4 L-38,10 L-16,6Z', dk(body, 0.1)) +
      E(2, 2, 26, 9, c.lin([[0, lt(body, 0.12)], [1, dk(body, 0.2)]])) +
      (o.young ? E(26, -1, 7, 6, '#7A6452') : E(26, -1, 7.5, 6.5, '#F6F3EC') + E(24, 2, 6, 3, '#D9D5CC')) +
      E(34, -4, 6.2, 5, o.young ? '#4A3A30' : '#9C5A4E') + P('M39,-6 Q46,-5 44,1 Q42,-2 38,-1Z', o.young ? '#3A3030' : '#E8D8C0') +
      C(35.5, -5.5, 1, '#111') + (o.young ? '' : E(31, -8, 2.6, 1.6, '#B5655A')));
  }
  function condorChick(c, x, y, s, o) {
    o = o || {};
    let fluff = '';
    const r = rng(7);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2;
      fluff += C(Math.cos(a) * 16, -20 + Math.sin(a) * 19, 4 + r() * 2, i % 2 ? '#9E9AA4' : '#8E8A96');
    }
    const lookDown = o.look === 'down';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 20) + fluff +
      E(0, -20, 16, 19, c.rad([[0, '#B9B5BE'], [1, '#86828E']], 0.35, 0.3, 0.7)) +
      P('M-10,-24 Q-20,-16 -16,-4 Q-10,-12 -6,-16Z', '#7E7A86') +
      E(8, -12, 9, 10, '#A9A5B0', 'opacity=".6"') +
      G(lookDown ? 'rotate(18 6 -42)' : '', C(6, -42, 11, c.rad([[0, '#A7A3AE'], [1, '#77737E']], 0.35, 0.3, 0.7)) +
        E(11, -42, 6, 5.6, '#4E4144') + C(12, -44, 2.2, '#111') + C(12.6, -44.8, 0.8, '#fff') +
        P('M15,-42 Q22,-41 20,-35 Q18,-38 15,-38Z', '#2E2A2E')) +
      S('M-4,-1 L-6,3 M4,-1 L6,3', '#5A5260', 2.2));
  }
  function horse(c, x, y, s, o) {
    o = o || {};
    const col = o.col || '#9C5B32', d = dk(col, 0.25), mane = '#3A2416';
    const g = c.lin([[0, lt(col, 0.18)], [1, dk(col, 0.15)]]);
    const walk = o.walk;
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 44) +
      limb('-22,-42 ' + (walk ? '-14,-20 -18,-2' : '-20,-18 -24,-2'), 7, d) + limb('22,-42 ' + (walk ? '30,-22 36,-6' : '18,-14 20,-2'), 7, d) +
      E(walk ? -18 : -24, -1.5, 4, 2.4, '#2A1A12') + E(walk ? 37 : 20, walk ? -5 : -1.5, 4, 2.4, '#2A1A12') +
      P('M-36,-52 Q-52,-44 -50,-16 Q-44,-30 -38,-40Z', mane) +
      E(0, -48, 36, 15, g) +
      P('M22,-56 C28,-74 36,-86 46,-90 L56,-82 C50,-72 42,-60 34,-44Z', g) +
      P('M44,-92 C54,-96 64,-84 68,-74 C70,-68 66,-65 61,-66 C56,-70 50,-74 44,-78Z', g) +
      P('M47,-92 L46,-102 L52,-94Z', d) + P('M56,-86 C60,-80 64,-74 66,-70 L63,-69 C60,-74 57,-80 55,-85Z', '#F6F0E6') +
      C(55, -86, 1.6, '#1a1010') + C(66, -70, 1.1, '#3A2416') +
      P('M44,-92 C36,-86 28,-72 24,-58 L30,-56 C34,-70 40,-82 47,-88Z', mane) +
      limb('-30,-42 -32,-20 -28,-2', 7.6, col) + limb('26,-42 ' + (walk ? '18,-24 22,-3' : '28,-18 30,-2'), 7.6, col) +
      E(-28, -1.5, 4.4, 2.6, '#2A1A12') + E(walk ? 23 : 30, -1.5, 4.4, 2.6, '#2A1A12') +
      E(-6, -56, 22, 4, lt(col, 0.3), 'opacity=".45"') +
      (o.saddle ? P('M-14,-62 Q-2,-58 12,-62 L14,-54 Q0,-50 -14,-54Z', c.lin([[0, '#8A4E24'], [1, '#4A2810']])) + E(-1, -60, 10, 2, '#E9D9A0', 'opacity=".7"') + S('M0,-54 L1,-34', '#3A2416', 1.2) : ''));
  }
  function mule(c, x, y, s, o) {
    o = o || {};
    const col = o.col || '#6E5A4A', d = dk(col, 0.25);
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 30) +
      limb('-18,-30 -18,-2', 5.5, d) + limb('16,-30 18,-2', 5.5, d) +
      E(0, -34, 26, 11, c.vert(col)) + P('M16,-40 C22,-52 26,-58 32,-60 L38,-52 C34,-48 28,-40 24,-32Z', col) +
      P('M30,-62 C38,-64 44,-56 46,-50 C46,-46 42,-45 39,-46 C36,-50 32,-52 30,-54Z', col) +
      P('M32,-62 L28,-76 L35,-64Z M35,-62 L36,-76 L38,-62Z', d) + C(38, -57, 1.2, '#111') +
      limb('-22,-30 -24,-2', 5.5, col) + limb('20,-30 22,-2', 5.5, col) +
      S('M-26,-38 Q-34,-30 -32,-18', d, 2.4) +
      (o.pack ? Rc(-16, -52, 26, 14, c.side(o.pack, 0.3), 'rx="3"') + Rc(-18, -42, 30, 6, dk(o.pack, 0.2), 'rx="2"') : ''));
  }
  function pudu(c, x, y, s, o) {
    o = o || {};
    const col = '#8B5532';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 20) +
      limb('-12,-14 -13,-1', 3.4, dk(col, 0.3)) + limb('9,-14 11,-1', 3.4, dk(col, 0.3)) +
      E(0, -19, 17, 9.5, c.lin([[0, lt(col, 0.18)], [1, dk(col, 0.18)]])) +
      limb('-9,-14 -8,-1', 3.6, col) + limb('12,-14 13,-1', 3.6, col) +
      P('M-16,-22 Q-20,-24 -19,-18Z', dk(col, 0.2)) +
      G(o.up ? 'rotate(-22 14 -24)' : '',
        P('M10,-24 Q12,-32 16,-34 L20,-28 Q16,-24 14,-18Z', col) +
        E(19, -34, 7, 6, c.rad([[0, lt(col, 0.2)], [1, col]], 0.4, 0.35, 0.7)) + P('M23,-33 Q30,-32 29,-28 Q25,-27 22,-29Z', dk(col, 0.35)) + C(28.8, -30, 1.3, '#1a1010') +
        E(14, -41, 3.2, 5.6, dk(col, 0.15), 'transform="rotate(-25 14 -41)"') + E(14.6, -40.6, 1.6, 3.6, '#D9A383', 'transform="rotate(-25 14 -41)"') +
        S('M18,-39 L17,-45 M21,-39 L22,-45', '#5A3A22', 1.6) +
        (o.sleepy ? S('M20.5,-35 q2,1.6 3.6,0', '#1a1010', 1) : C(21.4, -35.2, 1.8, '#1a1010') + C(22, -35.8, 0.6, '#fff'))) +
      E(-2, -24, 10, 3, lt(col, 0.3), 'opacity=".4"'));
  }
  function guanaco(c, x, y, s, o) {
    o = o || {};
    const col = '#C68C55', belly = '#F3E6D2';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 22) +
      limb('-14,-26 -15,-1', 3.4, dk(col, 0.3)) + limb('12,-26 13,-1', 3.4, dk(col, 0.3)) +
      E(0, -30, 20, 9, c.vert(col, 0.2)) + E(0, -25, 14, 4, belly) +
      P('M14,-34 C16,-48 18,-58 22,-62 L28,-60 C24,-54 22,-42 22,-30Z', col) + P('M17,-34 C18,-44 20,-52 23,-58 L24,-50 C22,-44 21,-38 21,-32Z', belly, 'opacity=".7"') +
      E(27, -62, 6, 4, col) + E(31, -60, 3.2, 2.6, '#4A3A30') + C(27.5, -64, 1, '#111') + P('M23,-65 L22,-71 L25,-66Z', col) +
      limb('-10,-26 -9,-1', 3.6, col) + limb('15,-26 17,-1', 3.6, col) + P('M-20,-32 Q-24,-30 -22,-24Z', dk(col, 0.2)));
  }
  function rhea(c, x, y, s, o) {
    o = o || {};
    const col = '#8E8A80';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 16) +
      limb('-2,-24 -6,-12 -4,-1', 2.6, '#8A7A5A') + limb('4,-24 6,-12 10,-1', 2.6, '#A89670') +
      P('M-18,-34 Q-16,-48 0,-46 Q16,-46 16,-32 Q8,-22 -6,-24 Q-16,-26 -18,-34Z', c.vert(col, 0.25)) +
      P('M-16,-36 Q-6,-30 6,-34', 'none', 'stroke="' + lt(col, 0.3) + '" stroke-width="1.4"') +
      P('M10,-42 C12,-56 14,-64 18,-68 L22,-66 C18,-60 16,-50 16,-40Z', lt(col, 0.1)) +
      E(20, -68, 4.4, 3.2, lt(col, 0.1)) + P('M23,-69 L28,-67 L23,-66Z', '#5A4A3A') + C(20.5, -69, 0.9, '#111'));
  }
  function turtle(c, x, y, s, o) {
    o = o || {};
    const shell = c.rad([[0, '#B58B4C'], [0.7, '#7C5A2E'], [1, '#4E3A1E']], 0.4, 0.35, 0.7);
    let scutes = '';
    [[-12, -4], [2, -6], [16, -3], [-6, 6], [9, 6]].forEach(p => { scutes += P('M' + (p[0] - 6) + ',' + p[1] + ' l3,-5 h6 l3,5 l-3,5 h-6Z', 'none', 'stroke="#3E2C14" stroke-opacity=".55" stroke-width="1.2"'); });
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''),
      P('M8,10 Q22,26 40,24 Q30,14 18,6Z', c.vert('#6E9A6A')) + P('M-18,8 Q-26,18 -36,18 Q-28,8 -20,4Z', '#5E8A5A') +
      E(0, 0, 30, 17, shell) + scutes + E(-4, -7, 16, 5, '#E8D3A3', 'opacity=".25"') +
      P('M10,-8 Q24,-30 46,-32 Q36,-14 18,-4Z', c.vert('#7AA676')) + P('M-16,-8 Q-28,-20 -40,-20 Q-30,-8 -20,-3Z', '#6E9A6A') +
      E(36, -2, 10, 7.4, c.rad([[0, '#9CC594'], [1, '#5E8A5A']], 0.4, 0.4, 0.7)) + C(40, -4, 1.6, '#111') + C(40.5, -4.6, 0.5, '#fff') +
      S('M43,1 q2,1 3,-1', '#2E4A2E', 1));
  }
  function fish(c, x, y, s, col, col2, flip) {
    return G(T(x, y, s) + (flip ? ' scale(-1,1)' : ''),
      P('M-12,0 L-20,-7 L-19,0 L-20,7Z', dk(col, 0.15)) + P('M-14,0 Q-4,-10 10,-4 Q15,0 10,4 Q-4,10 -14,0Z', c.vert(col, 0.25)) +
      S('M-2,-6 Q0,0 -2,6', col2 || '#FFFFFF', 2.2) + C(7, -1.5, 1.4, '#111') + C(7.4, -1.9, 0.5, '#fff') + P('M-2,-7 Q2,-12 6,-6Z', dk(col, 0.1)));
  }
  function coral(c, x, y, s, col, kind) {
    let d = '';
    if (kind === 'fan') {
      d = P('M0,0 Q-26,-20 -18,-48 Q0,-60 18,-48 Q26,-20 0,0Z', c.vert(col, 0.3), 'opacity=".92"');
      for (let i = -3; i <= 3; i++) d += S('M0,0 Q' + i * 4 + ',-20 ' + i * 6 + ',-48', dk(col, 0.25), 1);
    } else if (kind === 'brain') {
      d = E(0, -10, 20, 12, c.rad([[0, lt(col, 0.3)], [1, dk(col, 0.2)]], 0.4, 0.3, 0.7)) + S('M-14,-10 q4,-6 8,0 t8,0 t8,0 M-10,-16 q4,-4 8,0 t8,0', dk(col, 0.3), 1.2);
    } else if (kind === 'anemone') {
      for (let i = -5; i <= 5; i++) d += S('M0,-6 q' + i * 2 + ',-10 ' + i * 3.4 + ',-18', i % 2 ? col : lt(col, 0.3), 3);
      d += E(0, -4, 10, 5, dk(col, 0.3));
    } else {
      d = L('0,0 0,-22 -10,-34 -10,-44', col, 6) + L('0,-22 10,-32 12,-44', col, 6) + L('-5,-28 -18,-34', col, 5) + L('6,-28 18,-30 22,-38', col, 5) +
        L('0,0 0,-22 -10,-34 -10,-44', lt(col, 0.35), 1.6, 'opacity=".7"');
    }
    return G(T(x, y, s), d);
  }
  function bubbles(seed, n, x, y, w, h) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) s += C(x + r() * w, y + r() * h, 1 + r() * 3.2, 'none', 'stroke="#E8F8FF" stroke-opacity=".7" stroke-width="1"');
    return s;
  }
  function diver(c, x, y, s, o) {
    o = o || {};
    const suit = o.suit || '#23272E', acc = o.acc || '#F28C28';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : '') + (o.rot ? ' rotate(' + o.rot + ')' : ''),
      // fins + legs (behind)
      limb('-10,2 -30,6 -46,2', 7.5, dk(suit, 0.1)) + P('M-46,2 L-62,-6 L-60,8Z', dk(acc, 0.2)) +
      limb('-10,-2 -28,-6 -44,-12', 7.5, suit) + P('M-44,-12 L-58,-24 L-62,-10Z', acc) +
      // tank
      Rc(-12, -14, 24, 9, c.lin([[0, '#FFE27A'], [1, '#C89A1E']]), 'rx="4.5"') +
      // torso
      P('M-12,-6 Q0,-10 14,-6 Q16,0 14,6 Q0,8 -12,4Z', c.vert(suit, 0.15)) + S('M-10,0 L12,0', acc, 1.8) +
      // arms
      limb('8,-2 20,4 30,0', 6, suit) + C(31, 0, 3, '#E2AE85') +
      // head + mask
      C(22, -6, 7.5, suit) + Rc(23, -10, 9, 6, c.lin([[0, '#BFF0FF'], [1, '#3A8FC2']]), 'rx="2.5" stroke="' + acc + '" stroke-width="1.4"') +
      S('M28,-1 q4,3 2,7 L14,-8', '#333', 1.4));
  }
  function penguin(c, x, y, s, o) {
    o = o || {};
    if (o.swim) {
      return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''),
        P('M-30,0 Q-10,-14 22,-6 Q34,-2 30,4 Q10,14 -30,0Z', c.vert('#22262C', 0.2)) + P('M-24,2 Q0,10 26,4 Q10,14 -24,2Z', '#F4F1EA') +
        P('M-4,-6 Q-14,-22 -26,-22 Q-16,-12 -10,-2Z', '#1B1E24') + C(22, -4, 1.4, '#fff') + P('M30,-2 L40,0 L30,2Z', '#2A2A2A') +
        S('M18,-7 Q22,2 16,6', '#F4F1EA', 1.6) + bubbles(31, 6, -50, -10, 18, 14));
    }
    const dw = o.waddle ? 'rotate(-6)' : '';
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), shadow(c, 0, 0, 16) + G(dw,
      E(-5, -1, 6, 2.6, '#E8A0A0') + E(6, -1, 6, 2.6, '#E8A0A0') +
      P('M0,-56 Q-16,-54 -16,-30 Q-16,-6 0,-2 Q16,-6 16,-30 Q16,-54 0,-56Z', '#1F2329') +
      P('M2,-46 Q-8,-40 -8,-24 Q-8,-6 3,-5 Q13,-8 13,-26 Q13,-42 2,-46Z', c.rad([[0, '#FFFFFF'], [1, '#E2DED6']], 0.4, 0.4, 0.7)) +
      P('M-7,-32 Q3,-24 13,-32 L13,-29 Q3,-21 -7,-29Z', '#1F2329') +
      P('M-15,-36 Q-24,-24 -20,-12 Q-14,-22 -12,-30Z', '#1B1E24') +
      C(4, -58, 11, '#1F2329') + P('M-3,-62 Q6,-70 14,-62 Q8,-66 2,-60 Q0,-54 4,-48 Q-4,-52 -3,-62Z', '#F4F1EA') +
      P('M12,-58 L24,-55 L13,-52Z', '#2A2A2A') + E(12, -55, 3, 2.6, '#E58C8C') + C(8, -60, 1.5, '#111') + C(8.4, -60.6, 0.5, '#fff')));
  }
  function helicopter(c, x, y, s, o) {
    o = o || {};
    return G(T(x, y, s) + (o.tilt ? ' rotate(' + o.tilt + ')' : ''),
      E(0, -28, 62, 4, '#55606E', 'opacity=".28"') + Rc(-2, -28, 4, 8, '#3A3F48') +
      P('M-60,-8 L-22,-10 L-22,-2 L-60,-4Z', c.vert('#D7322E')) + P('M-64,-20 L-56,-20 L-54,-4 L-62,-4Z', '#B82A27') +
      C(-62, -10, 9, '#55606E', 'opacity=".25"') +
      P('M-26,-14 Q-24,-22 -2,-22 Q24,-22 30,-8 Q32,4 18,6 L-22,6 Q-30,4 -26,-14Z', c.lin([[0, '#F0544C'], [1, '#A6201D']])) +
      S('M-24,-2 L28,-2', '#FFFFFF', 3) +
      P('M8,-20 Q24,-20 29,-8 L10,-6Z', c.lin([[0, '#CFEFFF'], [1, '#3D7FB0']], 0, 0, 1, 1)) + P('M12,-18 Q20,-18 24,-12', 'none', 'stroke="#fff" stroke-opacity=".8" stroke-width="1.4"') +
      (o.pilot ? C(16, -12, 3.6, '#E2AE85') + P('M12,-14 Q16,-19 20,-14Z', '#E8E8EA') : '') +
      Rc(-16, -16, 14, 12, '#8E1C1A', 'rx="2"') + (o.door ? Rc(-15, -15, 12, 10, '#2A2F38', 'rx="1"') : '') +
      S('M-18,10 L24,10 M-12,6 L-14,10 M16,6 L18,10', '#2A2F38', 2.2));
  }
  function tent(c, x, y, s, col) {
    col = col || '#D7322E';
    return G(T(x, y, s), shadow(c, 4, 0, 30) + P('M-26,0 L0,-30 L4,0Z', c.side(lt(col, 0.1), 0.15)) + P('M0,-30 L30,0 L4,0Z', dk(col, 0.25)) +
      P('M-6,0 L0,-14 L4,0Z', '#3A1410') + S('M0,-30 L-36,4 M0,-30 L38,4', '#555', 0.8));
  }
  function house(c, x, y, s, wall, roof, o) {
    o = o || {};
    return G(T(x, y, s), shadow(c, 6, 0, 28) +
      Rc(-22, -26, 44, 26, c.side(wall || '#F2EAD8', 0.18)) + P('M-27,-24 L0,-44 L27,-24Z', c.side(roof || '#B5523A', 0.25)) +
      Rc(-14, -18, 9, 9, o.lit ? '#FFD86E' : '#7FA7C6', 'stroke="#fff" stroke-width="1.4"') + Rc(6, -16, 8, 16, dk(wall || '#F2EAD8', 0.45)) +
      (o.lit ? C(-9.5, -13.5, 14, c.rad([[0, '#FFD86E', 0.5], [1, '#FFD86E', 0]])) : ''));
  }
  function ship(c, x, y, s, o) {
    o = o || {};
    const sail = c.side('#F3EAD4', 0.18), tilt = o.tilt || 0;
    const mast = (mx, h, w) => S('M' + mx + ',0 L' + mx + ',-' + h, '#5B3E2B', 2.2) +
      P('M' + (mx - w) + ',-' + (h - 8) + ' Q' + mx + ',-' + (h - 4) + ' ' + (mx + w) + ',-' + (h - 8) + ' L' + (mx + w + 2) + ',-' + (h - 26) + ' Q' + mx + ',-' + (h - 20) + ' ' + (mx - w - 2) + ',-' + (h - 26) + 'Z', sail) +
      P('M' + (mx - w - 2) + ',-' + (h - 30) + ' Q' + mx + ',-' + (h - 26) + ' ' + (mx + w + 2) + ',-' + (h - 30) + ' L' + (mx + w + 4) + ',-' + (h - 50) + ' Q' + mx + ',-' + (h - 44) + ' ' + (mx - w - 4) + ',-' + (h - 50) + 'Z', sail) +
      P('M' + (mx - w + 2) + ',-' + (h - 54) + ' L' + (mx + w - 2) + ',-' + (h - 54) + ' L' + (mx + w) + ',-' + (h - 66) + ' L' + (mx - w) + ',-' + (h - 66) + 'Z', sail);
    return G(T(x, y, s) + ' rotate(' + tilt + ')',
      S('M-70,-6 L-96,-40 M78,-8 L96,-20', '#5B3E2B', 1.4) +
      mast(-36, 92, 16) + mast(4, 104, 18) + mast(42, 84, 14) +
      S('M-96,-40 L-36,-92 M-36,-92 L4,-104 L42,-84 L96,-20', '#6B5A4A', 0.6) +
      P('M-34,-92 l0,-8 l10,4Z', '#D52B1E') + P('M4,-104 l0,-8 l10,4Z', '#F2F2F2') +
      P('M-72,-12 L80,-12 Q76,4 60,8 L-58,8 Q-70,4 -72,-12Z', c.lin([[0, '#3A322C'], [1, '#17120E']])) +
      S('M-70,-6 L78,-6', '#EADFC4', 2) + (() => { let g = ''; for (let i = -56; i < 70; i += 14) g += Rc(i, -8, 5, 3.6, '#17120E'); return g; })() +
      P('M-72,-12 L-78,-16 L-70,-14Z', '#3A322C'));
  }
  function moai(c, x, y, s, o) {
    o = o || {};
    const col = o.col || '#6E6258', g = c.lin([[0, lt(col, 0.2)], [0.5, col], [1, dk(col, 0.3)]], 0, 0, 1, 0);
    return G(T(x, y, s) + (o.flip ? ' scale(-1,1)' : ''), (o.noShadow ? '' : shadow(c, 4, 0, 18)) +
      P('M-14,0 L-15,-34 Q-16,-44 -14,-50 L-13,-78 Q-12,-90 0,-92 Q12,-90 13,-78 L14,-50 Q16,-44 15,-34 L14,0Z', g) +
      P('M-13,-70 L13,-70 L12,-66 L-12,-66Z', dk(col, 0.35)) +
      P('M-2,-66 L-4,-48 Q0,-44 4,-48 L2,-66Z', dk(col, 0.2)) + P('M-2,-66 L-4,-48 Q-1,-46 0,-47Z', lt(col, 0.15)) +
      S('M-6,-40 Q0,-38 6,-40', dk(col, 0.45), 1.6) + P('M-16,-70 L-19,-46 L-15,-46Z', dk(col, 0.2)) + P('M16,-70 L19,-46 L15,-46Z', dk(col, 0.35)) +
      S('M-10,-24 Q-4,-20 -2,-12 M10,-24 Q4,-20 2,-12', dk(col, 0.35), 1.4) +
      (o.pukao ? E(0, -94, 12, 6, c.vert('#A4553A', 0.25)) : ''));
  }
  function dome(c, x, y, s, open) {
    return G(T(x, y, s), shadow(c, 4, 0, 26) + Rc(-20, -20, 40, 20, c.side('#E8ECF2', 0.2)) +
      P('M-21,-20 A21,21 0 0 1 21,-20Z', c.side('#FFFFFF', 0.25)) + (open ? P('M-3,-40 L3,-40 L4,-20 L-4,-20Z', '#1B2236') : S('M-1,-40 L-1,-20', '#B8C0CC', 1)) +
      Rc(-6, -10, 6, 10, '#9AA3B0'));
  }
  function dish(c, x, y, s, a) {
    return G(T(x, y, s), shadow(c, 2, 0, 12) + P('M-4,0 L-2,-16 L2,-16 L4,0Z', '#D6DBE2') + Rc(-6, -20, 12, 6, '#C9CED6', 'rx="1.5"') +
      G('rotate(' + (a || -25) + ' 0 -22)', P('M-18,-26 Q0,-14 18,-26 L16,-28 Q0,-18 -16,-28Z', '#9AA3B0') + P('M-18,-26 Q0,-36 18,-26 Q0,-16 -18,-26Z', c.lin([[0, '#FFFFFF'], [1, '#C5CCD6']], 0, 0, 1, 1)) +
        S('M0,-24 L0,-38', '#A7AFBA', 1) + C(0, -38, 1.4, '#7A838F')));
  }
  function emp(c, x, y, s, col) {
    col = col || '#E0A04A';
    let crimp = '';
    for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; crimp += C(Math.cos(a) * 15, 2 + Math.sin(a) * 11, 1.6, dk(col, 0.25)); }
    return G(T(x, y, s), shadow(c, 0, 4, 16, 0.25) + P('M-16,3 Q-15,-12 0,-12 Q15,-12 16,3Z', c.rad([[0, lt(col, 0.35)], [1, dk(col, 0.15)]], 0.4, 0.3, 0.8)) + crimp +
      E(-3, -6, 6, 2, lt(col, 0.5), 'opacity=".6"'));
  }
  function garland(c, x1, y1, x2, y2, n) {
    let s = S('M' + x1 + ',' + y1 + ' Q' + (x1 + x2) / 2 + ',' + (Math.max(y1, y2) + 16) + ' ' + x2 + ',' + y2, '#6B5A4A', 0.8);
    const cols = ['#D52B1E', '#FFFFFF', '#0039A6'];
    for (let i = 1; i < n; i++) {
      const t = i / n, x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * (x1 + x2) / 2 + t * t * x2;
      const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + 16) + t * t * y2;
      s += P('M' + f1(x - 5) + ',' + f1(y) + ' L' + f1(x + 5) + ',' + f1(y) + ' L' + f1(x) + ',' + f1(y + 11) + 'Z', cols[i % 3], 'stroke="#00000022" stroke-width=".5"');
    }
    return s;
  }
  function windLines(seed, n, x, y, w, h, col) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const xx = x + r() * w, yy = y + r() * h, l = 30 + r() * 50;
      s += S('M' + f1(xx) + ',' + f1(yy) + ' q' + f1(l * 0.5) + ',-6 ' + f1(l) + ',0 q8,0 6,-6', col || '#FFFFFF', 1.6, 'opacity="' + (0.4 + r() * 0.4).toFixed(2) + '"');
    }
    return s;
  }
  function sparkle(x, y, k, col) {
    return P('M' + x + ',' + (y - k) + ' L' + (x + k * 0.2) + ',' + (y - k * 0.2) + ' L' + (x + k) + ',' + y + ' L' + (x + k * 0.2) + ',' + (y + k * 0.2) + ' L' + x + ',' + (y + k) + ' L' + (x - k * 0.2) + ',' + (y + k * 0.2) + ' L' + (x - k) + ',' + y + ' L' + (x - k * 0.2) + ',' + (y - k * 0.2) + 'Z', col || '#FFFFFF');
  }

  // ── shared backdrops ───────────────────────────────────────────
  function cone(c, x, base, w, h, pal, snow) {
    const ax = x, ay = base - h;
    let s = P('M' + (x - w / 2) + ',' + base + ' Q' + (x - w * 0.2) + ',' + (base - h * 0.45) + ' ' + (ax - w * 0.04) + ',' + ay + ' L' + (ax + w * 0.04) + ',' + ay + ' Q' + (x + w * 0.2) + ',' + (base - h * 0.45) + ' ' + (x + w / 2) + ',' + base + 'Z', c.side(pal[0], 0.25));
    s += P('M' + (ax + w * 0.04) + ',' + ay + ' Q' + (x + w * 0.2) + ',' + (base - h * 0.45) + ' ' + (x + w / 2) + ',' + base + ' L' + (x + w * 0.1) + ',' + base + ' Q' + (x + w * 0.05) + ',' + (base - h * 0.5) + ' ' + (ax + w * 0.01) + ',' + ay + 'Z', pal[1], 'opacity=".55"');
    if (snow) {
      const sh = h * snow, k = sh / h;
      const xl = ax - w * 0.04 - (w * 0.24) * k * 1.4, xr = ax + w * 0.04 + (w * 0.24) * k * 1.4, yy = ay + sh;
      s += P('M' + (ax - w * 0.04) + ',' + ay + ' L' + (ax + w * 0.04) + ',' + ay + ' Q' + (xr - 2) + ',' + (yy - sh * 0.4) + ' ' + xr + ',' + yy +
        ' L' + (xr - w * 0.05) + ',' + (yy - sh * 0.2) + ' L' + (xr - w * 0.1) + ',' + (yy + sh * 0.1) + ' L' + (ax + w * 0.02) + ',' + (yy - sh * 0.25) + ' L' + (xl + w * 0.12) + ',' + (yy + sh * 0.12) +
        ' L' + (xl + w * 0.05) + ',' + (yy - sh * 0.18) + ' L' + xl + ',' + yy + ' Q' + (xl + 2) + ',' + (yy - sh * 0.4) + ' ' + (ax - w * 0.04) + ',' + ay + 'Z', c.side('#FFFFFF', 0.12)) +
        P('M' + (ax + w * 0.04) + ',' + ay + ' Q' + (xr - 2) + ',' + (yy - sh * 0.4) + ' ' + xr + ',' + yy + ' L' + (xr - w * 0.05) + ',' + (yy - sh * 0.2) + ' L' + (ax + w * 0.03) + ',' + (ay + sh * 0.5) + 'Z', '#B9CCE6', 'opacity=".7"');
    }
    return s;
  }
  function under(c, seed) {
    return Rc(-2, -2, 404, 304, c.lin([[0, '#3FB8E2'], [0.45, '#1679B5'], [1, '#08355F']])) + rays(c, 120, -20, 0.55, '#E8FBFF', 0.2) +
      E(200, -10, 260, 40, c.rad([[0, '#BDF2FF', 0.5], [1, '#BDF2FF', 0]])) + bubbles(seed, 18, 0, 20, 400, 200);
  }
  function seaFloor(c, seed, y) {
    const r = rng(seed); let s = hills(c, seed, y, 14, '#E3C996', '#9C8358', 6);
    const cols = ['#F07A5A', '#F2B33D', '#E05A8A', '#8E6BC8', '#F59A6A'];
    for (let i = 0; i < 9; i++) {
      const kinds = ['branch', 'fan', 'brain', 'anemone'];
      s += coral(c, 10 + i * 46 + r() * 20, y + 18 + r() * 30, 0.6 + r() * 0.5, cols[i % 5], kinds[i % 4]);
    }
    return s;
  }
  function andesSky(c, mode, seed) {
    mode = mode || 'snow';
    return sky(c, mode) + range(c, seed || 11, 200, 6, 70, 120, MT.far, 0.35) + haze(c, 150, 70, '#EEF6FF', 0.5) + range(c, (seed || 11) + 1, 240, 5, 80, 130, MT.mid, 0.32) +
      hills(c, (seed || 11) + 5, 246, 8, '#DCE8F4', '#AFC3DA', 6) + haze(c, 226, 40, '#F4F8FF', 0.55);
  }
  function desertBack(c, mode) {
    return sky(c, mode || 'desert') + cone(c, 290, 200, 170, 92, ['#B98A72', '#8E6250'], 0.12) + cone(c, 175, 200, 130, 62, ['#C69A7E', '#9C7060']) +
      haze(c, 170, 50, '#FCE6C0', 0.6) + hills(c, 21, 214, 18, '#E9B983', '#D49A62', 4);
  }
  function forestBack(c, seed, light) {
    const r = rng(seed);
    let s = sky(c, 'morning') + Rc(-2, -2, 404, 304, c.lin([[0, '#9CCBB8', 0.7], [1, '#5E8F6E', 0.6]]));
    for (let i = 0; i < 9; i++) s += roundTree(c, i * 50 + r() * 20 - 10, 210 + r() * 10, 1.4 + r() * 0.4, mix('#5E8F72', '#9CC4B0', 0.45));
    s += haze(c, 130, 110, '#E8F4E6', 0.55);
    for (let i = 0; i < 6; i++) s += roundTree(c, i * 80 + r() * 30 - 20, 250 + r() * 10, 1.9 + r() * 0.4, '#3E7448');
    s += rays(c, light || 90, -30, 0.5, '#FFF6D8', 0.28);
    return s;
  }
  function farmBack(c, mode) {
    let s = sky(c, mode || 'morning') + range(c, 41, 170, 7, 40, 70, MT.far, 0.3) + haze(c, 120, 60, '#FFF4E2', 0.5) +
      hills(c, 42, 190, 16, '#9FBF6A', '#7FA052', 5);
    for (let i = 0; i < 8; i++) s += poplar(c, 20 + i * 52, 196, 0.6, '#6F9A48');
    s += hills(c, 43, 226, 10, '#B7C96E', '#8FA84E', 4);
    for (let i = 0; i < 7; i++) s += S('M' + (-10 + i * 18) + ',300 L' + (60 + i * 10) + ',230', '#6E8E3A', 3, 'opacity=".55"');
    return s;
  }
  function nightDesert(c, seed, moonOn) {
    return sky(c, 'night') + milkyWay(c, seed) + starsField(c, seed + 1, 90, 0, 200, true) + (moonOn ? moon(c, 330, 56, 14, 'full') : '') +
      cone(c, 300, 212, 180, 90, ['#2C3058', '#1A1D3C']) + cone(c, 170, 212, 140, 58, ['#353A66', '#22264A']) +
      hills(c, seed + 2, 226, 16, '#3B3550', '#26203A', 4);
  }
  function oceanCoast(c, mode) {
    return sky(c, mode || 'sea') + sea(c, 160, '#5AB4DC', '#2A78A8', 5) + range(c, 61, 168, 4, 30, 50, MT.brown, 0, 220, 430) + haze(c, 140, 40, '#FFF4E0', 0.4);
  }

  const SC = {};

  // ── The Ocean Dive ─────────────────────────────────────────────
  SC.ocean_dive = [
    c => sky(c, 'day') + sunDisc(c, 330, 40, 15) + cloud(c, 80, 44, 0.8, 'day') + cloud(c, 230, 30, 0.5, 'day', 1) +
      Rc(-2, 108, 404, 196, c.lin([[0, '#45C0E6'], [0.4, '#1A80BC'], [1, '#0A3C6E']])) + rays(c, 300, 108, 0.5, '#E8FBFF', 0.22) +
      P('M-2,108 Q25,103 50,108 T100,108 T150,108 T200,108 T250,108 T300,108 T350,108 T402,108 L402,114 Q375,118 350,114 T300,114 T250,114 T200,114 T150,114 T100,114 T50,114 T-2,114Z', '#B8EEFA', 'opacity=".85"') +
      G(T(278, 106), P('M-56,-8 L56,-8 L44,10 L-46,10Z', c.vert('#FFFFFF', 0.25)) + S('M-54,-2 L54,-2', '#D7322E', 3.4) + Rc(-26, -28, 30, 20, c.side('#F4F4F4'), 'rx="2"') + Rc(-21, -24, 10, 8, '#7FB8DA') + S('M10,-8 L10,-44', '#888', 1.6) + P('M10,-44 L26,-38 L10,-34Z', '#F2B33D')) +
      G(T(112, 106), E(0, 0, 30, 6, '#FFFFFF', 'opacity=".9"') + C(-14, -10, 3.4, '#fff') + C(10, -14, 2.6, '#fff') + C(20, -6, 2, '#fff') + C(-24, -4, 2, '#fff')) +
      diver(c, 128, 160, 1.15, { rot: 62, suit: '#23272E', acc: '#F28C28' }) + bubbles(3, 22, 100, 112, 50, 40) +
      diver(c, 250, 220, 1.0, { rot: 18, suit: '#1E2C3A', acc: '#1FB5A8' }) + bubbles(4, 10, 268, 160, 30, 40) +
      fish(c, 60, 250, 0.9, '#F2B33D') + fish(c, 80, 262, 0.7, '#F2B33D') + fish(c, 350, 260, 0.8, '#F07A5A', '#fff', true) +
      E(200, 300, 260, 30, '#0A2E52', 'opacity=".5"'),
    c => under(c, 5) + E(200, 316, 280, 60, '#0A2E52', 'opacity=".55"') +
      diver(c, 70, 90, 0.55, { rot: 8, suit: '#23272E', acc: '#F28C28' }) + diver(c, 40, 120, 0.5, { rot: 4, suit: '#1E2C3A', acc: '#1FB5A8' }) +
      (() => { let s = ''; const r = rng(9); const cols = [['#F2B33D', '#fff'], ['#2E86DE', '#F2E14C'], ['#F07A5A', '#fff'], ['#9B59B6', '#F2E14C']];
        for (let i = 0; i < 16; i++) { const k = cols[i % 4]; s += fish(c, 160 + r() * 220, 40 + r() * 110, 0.45 + r() * 0.4, k[0], k[1], r() > 0.7); } return s; })() +
      turtle(c, 230, 196, 2.0) + bubbles(12, 8, 300, 140, 30, 30),
    c => under(c, 7) + seaFloor(c, 13, 230) +
      coral(c, 70, 270, 1.6, '#F07A5A', 'fan') + coral(c, 330, 280, 1.7, '#E05A8A', 'branch') + coral(c, 210, 282, 1.3, '#F2B33D', 'brain') + coral(c, 150, 290, 1.4, '#8E6BC8', 'anemone') +
      fish(c, 160, 196, 0.8, '#F2B33D') + fish(c, 260, 176, 0.9, '#2E86DE', '#F2E14C', true) + fish(c, 300, 220, 0.6, '#F07A5A') + fish(c, 110, 214, 0.6, '#F07A5A', '#fff', true) +
      diver(c, 150, 110, 0.95, { rot: 14, suit: '#23272E', acc: '#F28C28' }) + diver(c, 280, 80, 0.8, { rot: 8, suit: '#1E2C3A', acc: '#1FB5A8', flip: true }) + bubbles(17, 14, 150, 40, 160, 60)
  ];
  SC.ocean_dive.cover = c => under(c, 21) + seaFloor(c, 22, 240) + coral(c, 60, 286, 1.7, '#F07A5A', 'fan') + coral(c, 340, 290, 1.6, '#E05A8A', 'branch') +
    turtle(c, 250, 150, 1.8) + diver(c, 110, 110, 1.1, { rot: 10 }) + bubbles(23, 12, 120, 40, 60, 60) + fish(c, 330, 70, 0.7, '#F2B33D') + fish(c, 350, 90, 0.6, '#F2B33D');

  // ── The Andes Rescue ───────────────────────────────────────────
  SC.andes_rescue = [
    c => andesSky(c, 'snow', 11) + cloud(c, 80, 70, 0.7, 'snow') + range(c, 13, 300, 4, 90, 140, MT.near, 0.4) +
      helicopter(c, 230, 100, 1.4, { pilot: true }) + cloud(c, 330, 150, 0.9, 'snow', 2),
    c => sky(c, 'storm') + range(c, 14, 220, 6, 70, 120, MT.storm, 0.35) + haze(c, 170, 80, '#DDE3EA', 0.5) + cloud(c, 90, 60, 1.1, 'storm') + cloud(c, 300, 50, 0.9, 'storm', 2) +
      range(c, 15, 300, 4, 80, 130, MT.near, 0.45) + helicopter(c, 200, 120, 1.5, { tilt: -12, pilot: true }) + windLines(16, 14, -20, 60, 420, 200),
    c => andesSky(c, 'snow', 17) + P('M-2,190 Q120,160 240,190 T402,180 L402,304 L-2,304Z', c.lin([[0, '#FFFFFF'], [1, '#CFE0F2']])) +
      S('M-2,214 Q100,196 200,214', '#BFD3EA', 3, 'opacity=".7"') + tent(c, 210, 238, 1.5) + who(c, 'climber', { x: 270, y: 250, s: 0.8, la: 160, lb: 10, face: 'big' }) +
      helicopter(c, 100, 70, 0.6, {}) + S('M268,250 l-8,4 M276,250 l8,4', '#9FB8D6', 1.2),
    c => andesSky(c, 'snow', 18) + P('M-2,200 Q140,180 260,206 T402,196 L402,304 L-2,304Z', c.lin([[0, '#FFFFFF'], [1, '#CFE0F2']])) + tent(c, 80, 250, 1.1) +
      helicopter(c, 240, 70, 1.3, { door: true }) + who(c, 'rescuer', { x: 222, y: 96, s: 0.42, la: 120, lb: 20, legs: 'sit' }) +
      S('M228,80 Q232,160 236,226', '#F2B33D', 2.2) + who(c, 'climber', { x: 236, y: 262, s: 0.9, la: 175, lb: 0, ra: 160, rb: 0, face: 'big' })
  ];
  SC.andes_rescue.cover = c => andesSky(c, 'snow', 19) + range(c, 20, 300, 3, 100, 150, MT.near, 0.45) + helicopter(c, 200, 130, 1.9, { pilot: true }) + cloud(c, 70, 200, 1, 'snow');

  // ── Leo's trail (Lost Compass) ─────────────────────────────────
  function trail(c, seed, mode) {
    return sky(c, mode || 'day') + range(c, seed, 190, 6, 60, 110, mode === 'sunset' ? MT.dusk : MT.far, 0.32) + haze(c, 140, 60, mode === 'sunset' ? '#FFD9B0' : '#F4FAFF', 0.5) +
      hills(c, seed + 1, 210, 26, mode === 'sunset' ? '#8E7A6A' : '#8DB070', mode === 'sunset' ? '#5E4E4A' : '#5E8A4E', 5) +
      araucaria(c, 40, 214, 0.75, mode === 'sunset' ? '#2C3A3A' : '#2F5D3A') + araucaria(c, 350, 210, 0.6, mode === 'sunset' ? '#2C3A3A' : '#3A6A44') +
      hills(c, seed + 2, 250, 14, mode === 'sunset' ? '#9C7E5E' : '#A9C27A', mode === 'sunset' ? '#6E5440' : '#7FA052', 4) +
      P('M150,304 Q190,268 230,250 T330,226 L344,228 Q280,250 250,268 T200,304Z', mode === 'sunset' ? '#C8A47E' : '#D9C49A', 'opacity=".9"');
  }
  SC.lost_compass = [
    c => trail(c, 31) + cloud(c, 100, 50, 0.7, 'day') + rock(c, 90, 280, 50, 30) + grass(c, 32, 262, 300, 40) +
      who(c, 'leo', { x: 220, y: 280, s: 1.25, la: 40, lb: -70, ra: -20, rb: 10, face: 'wow' }) + P('M250,180 q6,-14 14,-2 q4,8 -6,10 l0,6', 'none', 'stroke="#fff" stroke-width="3" stroke-linecap="round"') + C(258, 202, 2, '#fff'),
    c => trail(c, 33) + windLines(34, 10, -10, 60, 400, 160) + grass(c, 35, 262, 300, 50, '#6E9A4A') +
      (() => { let s = ''; const r = rng(36); for (let i = 0; i < 8; i++) s += E(r() * 400, 120 + r() * 120, 4, 2, '#E0A43A', 'transform="rotate(' + (r() * 90) + ' 200 150)"'); return s; })() +
      who(c, 'leo', { x: 230, y: 282, s: 1.2, flip: true, legs: 'walk', la: -20, lb: -20, ra: 30, rb: 10, face: 'calm' }) + P('M140,286 l10,-4 M160,290 l10,-4 M120,296 l10,-4', 'none', 'stroke="#8A7458" stroke-width="3" stroke-linecap="round" opacity=".5"'),
    c => trail(c, 37) + grass(c, 38, 262, 300, 30) + rock(c, 250, 288, 130, 72, '#948A7C') +
      C(212, 278, 26, c.rad([[0, '#FFF4C0', 0.9], [1, '#FFF4C0', 0]])) + prop(c, 'compass', 210, 280) + sparkle(222, 266, 9) + sparkle(200, 270, 5) +
      who(c, 'leo', { x: 150, y: 290, s: 1.2, legs: 'kneel', la: 70, lb: 10, ra: 40, rb: 20, face: 'big' }),
    c => trail(c, 39, 'sunset') + sunDisc(c, 300, 150, 20, '#FFC46B') + house(c, 330, 222, 0.7, '#E9DCC6', '#8E3A2A', { lit: true }) +
      who(c, 'leo', { x: 170, y: 286, s: 1.25, legs: 'walk', la: 80, lb: -30, ra: -10, rb: 10, prop: 'compass', face: 'big' }) + E(170, 290, 60, 6, '#000', 'opacity=".08"')
  ];
  SC.lost_compass.cover = c => trail(c, 40) + cloud(c, 90, 60, 0.8, 'day') + C(220, 166, 40, c.rad([[0, '#FFF4C0', 0.7], [1, '#FFF4C0', 0]])) +
    who(c, 'leo', { x: 200, y: 290, s: 1.6, la: 120, lb: 0, ra: -10, rb: 10, prop: 'compass', face: 'big' });

  // ── The Secret Inca Trail ──────────────────────────────────────
  SC.inca_trail = [
    c => desertBack(c) + sunDisc(c, 70, 50, 16) + hills(c, 51, 260, 12, '#EBC08C', '#D4A06A', 3) + cactus(c, 330, 270, 1.1) + cactus(c, 60, 250, 0.7) + rock(c, 290, 286, 40, 20, '#B98A62') +
      who(c, 'leo', { x: 190, y: 284, s: 1.3, la: 95, lb: -40, ra: 80, rb: -50, prop: 'map', face: 'wow' }),
    c => desertBack(c) + sunDisc(c, 330, 46, 14) + hills(c, 52, 258, 10, '#EBC08C', '#D4A06A', 3) + rock(c, 250, 284, 110, 40, '#C49A72') +
      G(T(230, 244), prop(c, 'compass', 0, 0)) + G(T(258, 236), Rc(-4, -14, 9, 18, c.side('#5FB6E8', 0.3), 'rx="3"') + Rc(-2.5, -18, 6, 5, '#2E6DB4')) +
      G(T(284, 242), Rc(-9, -6, 18, 9, '#E25B3A', 'rx="2"') + S('M-6,-2 h12', '#FBE3A8', 1.4)) +
      who(c, 'leo', { x: 130, y: 286, s: 1.25, la: 70, lb: -10, ra: -20, rb: 20, face: 'smile' }) + cactus(c, 360, 262, 0.8),
    c => sky(c, 'thin') + sunDisc(c, 320, 40, 13, '#FFFBEA', 7) + range(c, 53, 210, 6, 90, 150, MT.rust, 0.25) + haze(c, 160, 60, '#F4F7FB', 0.4) +
      P('M-2,230 L120,200 L260,226 L402,190 L402,304 L-2,304Z', c.lin([[0, '#C8956A'], [1, '#8E6248']])) +
      (() => { let s = ''; for (let i = 0; i < 12; i++) s += Rc(130 + i * 18, 250 - i * 4.2, 14, 7, i % 2 ? '#A88A70' : '#B89A80', 'rx="2"'); return s; })() +
      who(c, 'leo', { x: 170, y: 262, s: 1.15, legs: 'walk', la: 20, lb: 10, ra: -20, rb: 10, face: 'calm' }) + S('M196,170 q4,-4 8,0 M206,166 q4,-4 8,0', '#fff', 1.6, 'opacity=".8"'),
    c => sky(c, 'thin') + sunDisc(c, 60, 46, 13) + range(c, 54, 200, 5, 70, 120, MT.rust, 0.25) +
      P('M-2,250 L80,170 L320,170 L402,240 L402,304 L-2,304Z', c.lin([[0, '#B98A62'], [1, '#7E5A42']])) +
      (() => { let s = ''; for (let row = 0; row < 3; row++) for (let i = 0; i < 9 - row * 2; i++) { const x = 110 + row * 30 + i * 22, y = 168 - row * 18; s += Rc(x, y, 20, 16, c.side(row % 2 ? '#B7A48C' : '#A8957E', 0.2), 'rx="2" stroke="#6E5E4E" stroke-width="1"'); } return s; })() +
      Rc(186, 120, 28, 32, '#3A2E26', 'rx="2"') + P('M186,120 L200,108 L214,120Z', '#A8957E') +
      who(c, 'leo', { x: 120, y: 286, s: 1.3, la: 140, lb: 10, ra: -10, rb: 10, face: 'big' })
  ];
  SC.inca_trail.cover = c => SC.inca_trail[3](c);

  // ── The Condor's First Flight ──────────────────────────────────
  function cliffLedge(c, x, y) {
    return P('M' + (x - 200) + ',304 L' + (x - 200) + ',' + (y - 10) + ' Q' + (x - 120) + ',' + (y - 30) + ' ' + (x - 40) + ',' + (y - 6) + ' L' + (x + 70) + ',' + y + ' Q' + (x + 90) + ',' + (y + 6) + ' ' + (x + 80) + ',' + (y + 20) + ' L' + (x + 50) + ',304Z', c.lin([[0, '#9C8A7A'], [1, '#5E4E44']], 0, 0, 1, 1)) +
      P('M' + (x - 40) + ',' + (y - 6) + ' L' + (x + 70) + ',' + y + ' Q' + (x + 90) + ',' + (y + 6) + ' ' + (x + 80) + ',' + (y + 12) + ' L' + (x - 40) + ',' + (y + 6) + 'Z', '#B8A898') +
      S('M' + (x - 150) + ',' + (y + 40) + ' l40,10 M' + (x - 100) + ',' + (y + 80) + ' l30,-8 M' + (x + 10) + ',' + (y + 50) + ' l26,12', '#4E4038', 2, 'opacity=".5"');
  }
  SC.condor_flight = [
    c => andesSky(c, 'morning', 71) + cloud(c, 300, 170, 1.2, 'day') + cloud(c, 120, 200, 0.9, 'day', 1) + cliffLedge(c, 180, 220) + condorChick(c, 200, 226, 1.5),
    c => sky(c, 'morning') + range(c, 72, 140, 7, 50, 80, MT.far, 0.3) + haze(c, 110, 40, '#FFF', 0.5) +
      P('M-2,200 Q100,170 200,190 T402,180 L402,304 L-2,304Z', c.lin([[0, '#9CC27A'], [1, '#5E8A4E']])) + S('M60,304 Q120,240 200,226 T360,196', '#7FC4E8', 6) +
      house(c, 250, 222, 0.25) + house(c, 270, 226, 0.22) + cloud(c, 200, 150, 0.6, 'day') +
      P('M-2,304 L-2,110 Q60,96 130,120 L180,140 Q190,150 170,160 L120,190 L60,304Z', c.lin([[0, '#9C8A7A'], [1, '#4E4038']], 0, 0, 1, 1)) +
      condorChick(c, 120, 146, 1.3, { look: 'down' }) + P('M168,76 l2,22 M170,104 l0,4', 'none', 'stroke="#fff" stroke-width="4" stroke-linecap="round"'),
    c => andesSky(c, 'morning', 73) + cloud(c, 320, 210, 1, 'day') + condorFly(c, 230, 110, 1.35) + windLines(74, 6, 60, 150, 300, 60) + cliffLedge(c, 60, 240) + condorChick(c, 70, 244, 1.0),
    c => sky(c, 'day') + sunDisc(c, 70, 60, 16) + range(c, 75, 250, 7, 60, 120, MT.far, 0.35) + haze(c, 200, 70, '#FFF', 0.5) + range(c, 76, 300, 5, 60, 110, MT.mid, 0.3) +
      cloud(c, 300, 240, 1.2, 'day', 2) + condorFly(c, 280, 90, 0.9) + condorFly(c, 160, 150, 1.1, { young: true }) + windLines(77, 8, 40, 120, 360, 90)
  ];
  SC.condor_flight.cover = c => sky(c, 'dawn') + sunDisc(c, 300, 150, 22, '#FFC46B') + range(c, 78, 260, 7, 60, 130, MT.dusk, 0.3) + haze(c, 200, 70, '#FFD9B0', 0.5) +
    range(c, 79, 304, 5, 60, 110, MT.near, 0.3) + condorFly(c, 230, 90, 1.0) + condorFly(c, 140, 140, 1.15, { young: true });

  // ── The Brave Huaso Horse ──────────────────────────────────────
  function farmhouse(c, x, y, s) {
    return G(T(x, y, s), shadow(c, 8, 0, 60) + Rc(-50, -34, 100, 34, c.side('#F4ECDC', 0.15)) + P('M-58,-32 L-40,-52 L40,-52 L58,-32Z', c.side('#B5523A', 0.2)) +
      Rc(-50, -34, 100, 6, '#00000018') + Rc(-36, -24, 12, 12, '#6E8EA8', 'stroke="#7A5A3A" stroke-width="2"') + Rc(-6, -26, 14, 26, '#7A4A2A') + Rc(22, -24, 12, 12, '#6E8EA8', 'stroke="#7A5A3A" stroke-width="2"') +
      (() => { let s = ''; for (let i = -46; i <= 46; i += 13) s += S('M' + i + ',-28 L' + i + ',0', '#8A6A4A', 2.4); return s; })() + Rc(-52, -30, 104, 3, '#8A6A4A'));
  }
  function fence(c, y, x0, x1) {
    let s = S('M' + x0 + ',' + (y - 14) + ' L' + x1 + ',' + (y - 14) + ' M' + x0 + ',' + (y - 6) + ' L' + x1 + ',' + (y - 6), '#8A6A4A', 2.4);
    for (let x = x0; x <= x1; x += 26) s += Rc(x - 2, y - 20, 4, 20, '#6E5038');
    return s;
  }
  SC.huaso_horse = [
    c => farmBack(c, 'morning') + farmhouse(c, 290, 216, 0.8) + roundTree(c, 360, 236, 1.1, '#5E8A3E') + fence(c, 270, -10, 410) +
      horse(c, 150, 284, 1.25, {}) + grass(c, 81, 270, 300, 40, '#6E9A3A'),
    c => farmBack(c, 'dawn') + sunDisc(c, 330, 150, 20, '#FFD08A') + haze(c, 180, 60, '#FFE2B8', 0.5) +
      horse(c, 190, 284, 1.35, { saddle: true, walk: true }) + who(c, 'huaso', { x: 186, y: 258, s: 0.82, legs: 'ride', la: 70, lb: 10, ra: 60, rb: 10, face: 'smile' }) +
      sparkle(176, 214, 6, '#FFF6D0') + grass(c, 82, 272, 300, 50, '#7FA04A')
  ];
  SC.huaso_horse.cover = c => farmBack(c, 'dawn') + sunDisc(c, 320, 140, 22, '#FFD08A') + horse(c, 200, 290, 1.5, { saddle: true }) +
    who(c, 'huaso', { x: 196, y: 260, s: 0.92, legs: 'ride', la: 140, lb: 10, ra: 60, rb: 10, face: 'big' });

  // ── The Whispering Volcano ─────────────────────────────────────
  function lakeVolcano(c, mode) {
    const pal = mode === 'sunset' ? ['#8E6A8A', '#5E4468'] : ['#7E8FB8', '#5E6E9A'];
    let s = sky(c, mode) + (mode === 'sunset' ? sunDisc(c, 90, 140, 18, '#FFC46B') : sunDisc(c, 80, 50, 14)) +
      cone(c, 230, 170, 240, 130, pal, 0.34) + haze(c, 140, 40, mode === 'sunset' ? '#FFD9B0' : '#FFFFFF', 0.4) +
      hills(c, 91, 182, 22, mode === 'sunset' ? '#6E5A7A' : '#5E8A5A', mode === 'sunset' ? '#4A3E5A' : '#3E6A44', 6);
    // lake with reflection
    s += Rc(-2, 178, 404, 70, c.lin([[0, mode === 'sunset' ? '#C88A8A' : '#5FA8D8'], [1, mode === 'sunset' ? '#5E4A78' : '#2A6E9E']])) +
      G('translate(0,356) scale(1,-1)', cone(c, 230, 178, 240, 130, pal, 0.34), 'opacity=".35"') +
      S('M40,196 h60 M160,210 h90 M280,200 h70 M90,226 h50', '#FFFFFF', 1.4, 'opacity=".5"');
    s += hills(c, 92, 254, 14, '#4E7A4A', '#2E5634', 4);
    for (let i = 0; i < 6; i++) s += pine(c, 20 + i * 70, 270, 0.7, '#2E5E46');
    return s;
  }
  SC.volcano_legend = [
    c => lakeVolcano(c, 'day') + cloud(c, 320, 60, 0.6, 'day'),
    c => lakeVolcano(c, 'sunset') + S('M232,40 q-10,-10 0,-20 q10,-10 0,-20', '#F6E6E0', 3, 'opacity=".6"') +
      S('M250,70 q40,-20 80,0 t60,-10 M150,90 q-40,-20 -80,0 t-60,-6 M260,110 q30,-14 60,-4', '#FFF2E6', 2.4, 'opacity=".7" stroke-dasharray="2 6"') +
      sparkle(330, 60, 5, '#FFF4E0') + sparkle(70, 84, 4, '#FFF4E0') + sparkle(300, 106, 3, '#FFF4E0')
  ];
  SC.volcano_legend.cover = c => SC.volcano_legend[1](c);

  // ── The Little Pudu's Journey ──────────────────────────────────
  SC.pudu_journey = [
    c => forestBack(c, 101, 110) + ground(c, 250, '#6E8E4A', '#3E5E34') + fern(c, 90, 270, 1.6, '#4E8A44') + fern(c, 330, 276, 1.4) + fern(c, 250, 280, 1.1, '#6EA84E') +
      pudu(c, 190, 272, 1.7, {}) + bush(c, 120, 286, 1.2, '#4E8A44') + grass(c, 102, 262, 300, 40, '#4E7A3A'),
    c => forestBack(c, 103, 250) + ground(c, 250, '#6E8E4A', '#3E5E34') +
      G(T(260, 240), C(0, -40, 34, '#4E8A44') + C(-24, -26, 22, '#5E9A4A') + C(24, -24, 24, '#3E7A3E') + C(-8, -54, 14, '#7FB85A') +
        (() => { let s = ''; const r = rng(104); for (let i = 0; i < 10; i++) s += E(-30 + r() * 60, -60 + r() * 50, 5, 3, '#A8D86A', 'transform="rotate(' + (r() * 90) + ')"'); return s; })()) +
      pudu(c, 180, 276, 1.7, { up: true }) + fern(c, 60, 286, 1.4) + grass(c, 105, 264, 300, 40, '#4E7A3A')
  ];
  SC.pudu_journey.cover = c => forestBack(c, 106, 200) + ground(c, 250, '#6E8E4A', '#3E5E34') + fern(c, 80, 282, 1.8) + fern(c, 330, 286, 1.6, '#6EA84E') + pudu(c, 200, 280, 2.1, {});

  // ── The Great Glacier Explorer ─────────────────────────────────
  function glacier(c, seed) {
    const r = rng(seed);
    let s = sky(c, 'snow') + range(c, seed, 170, 6, 70, 120, MT.far, 0.5) +
      P('M-2,160 L60,120 L140,130 L220,110 L300,128 L402,116 L402,214 L-2,214Z', c.lin([[0, '#EAF6FF'], [0.5, '#9FD4F0'], [1, '#5AA8D8']]));
    for (let i = 0; i < 20; i++) { const x = r() * 400; s += S('M' + f1(x) + ',' + f1(130 + r() * 10) + ' l' + f1((r() - 0.5) * 10) + ',' + f1(40 + r() * 40), '#4A90C8', 1.2, 'opacity=".45"'); }
    s += Rc(-2, 212, 404, 92, c.lin([[0, '#6AAAD0'], [1, '#2E6E9E']])) + S('M20,230 h80 M150,246 h100 M300,236 h60', '#fff', 1.4, 'opacity=".5"');
    s += P('M60,226 L76,212 L96,222 L90,232Z', '#DDF2FF') + P('M300,250 L330,236 L352,250 L340,258Z', '#CBEAFF');
    return s;
  }
  SC.glacier_explorer = [
    c => glacier(c, 111) + P('M-2,258 Q120,236 260,256 Q320,266 402,286 L402,304 L-2,304Z', c.lin([[0, '#F4FAFF'], [1, '#C4D9EE']])) +
      who(c, 'tomas', { x: 130, y: 286, s: 1.2, la: 40, lb: 20, ra: -10, rb: 10, prop: 'pole', face: 'smile' }),
    c => glacier(c, 112) + P('M-2,240 Q200,226 402,246 L402,304 L-2,304Z', c.lin([[0, '#F4FAFF'], [1, '#B8D2EC']])) + windLines(113, 10, -10, 120, 420, 120) +
      (() => { let s = ''; const r = rng(114); for (let i = 0; i < 16; i++) s += sparkle(r() * 400, 120 + r() * 170, 3 + r() * 6, i % 3 ? '#FFFFFF' : '#CFF4FF'); return s; })() +
      who(c, 'tomas', { x: 250, y: 290, s: 1.3, flip: true, la: 120, lb: 20, ra: -10, rb: 10, goggles: true, face: 'big' })
  ];
  SC.glacier_explorer.cover = c => glacier(c, 115) + P('M-2,256 Q200,236 402,256 L402,304 L-2,304Z', c.lin([[0, '#F4FAFF'], [1, '#C4D9EE']])) +
    who(c, 'tomas', { x: 200, y: 292, s: 1.5, la: 150, lb: 10, ra: -10, rb: 10, prop: 'pole', face: 'big' }) + sparkle(110, 150, 7) + sparkle(300, 130, 6);

  // ── The Lost Map ───────────────────────────────────────────────
  function waterfall(c, x, top, bot, w) {
    let s = Rc(x - w / 2, top, w, bot - top, c.lin([[0, '#DFF4FF'], [1, '#9AD4EE']], 0, 0, 1, 0));
    for (let i = 0; i < 6; i++) s += S('M' + f1(x - w / 2 + 3 + i * (w - 6) / 5) + ',' + top + ' L' + f1(x - w / 2 + 3 + i * (w - 6) / 5) + ',' + bot, '#FFFFFF', 1.4, 'opacity=".7"');
    return s + E(x, bot, w * 0.9, 8, '#FFFFFF', 'opacity=".85"') + E(x, bot + 4, w * 1.4, 7, '#FFFFFF', 'opacity=".4"');
  }
  SC.lost_map = [
    c => Rc(-2, -2, 404, 304, '#2A2220') + E(300, 120, 80, 110, c.lin([[0, '#BFE3F5'], [1, '#7FB870']])) + roundTree(c, 300, 230, 1, '#5E9A4A') +
      P('M-2,-2 L402,-2 L402,304 L-2,304Z M380,240 Q390,40 300,20 Q210,30 220,240Z', c.lin([[0, '#5E4E44'], [1, '#2E2622']]), 'fill-rule="evenodd"') +
      P('M-2,250 Q200,230 402,252 L402,304 L-2,304Z', c.lin([[0, '#6E5E50'], [1, '#3A302A']])) +
      C(140, 190, 140, c.rad([[0, '#FFD98A', 0.42], [1, '#FFD98A', 0]])) +
      who(c, 'explorer', { x: 130, y: 280, s: 1.3, la: 95, lb: -40, ra: 60, rb: -20, prop: 'map', face: 'wow' }) + G(T(70, 240), prop(c, 'lantern', 0, 0)) +
      rock(c, 330, 290, 60, 30, '#6E5E50'),
    c => forestBack(c, 121, 300) + rock(c, 300, 190, 120, 110, '#7E7468') + waterfall(c, 300, 90, 214, 34) +
      Rc(-2, 212, 404, 30, c.lin([[0, '#7FC4E8'], [1, '#3E8EBE']])) + ground(c, 236, '#6E8E4A', '#3E5E34') +
      P('M80,304 Q120,270 200,256 T300,236 L312,240 Q240,262 200,276 T140,304Z', '#C8B08A', 'opacity=".9"') +
      who(c, 'explorer', { x: 150, y: 286, s: 1.2, legs: 'walk', la: 90, lb: -40, ra: -10, rb: 10, prop: 'map', face: 'smile' }) + fern(c, 40, 290, 1.4) + fern(c, 370, 296, 1.2)
  ];
  SC.lost_map.cover = c => forestBack(c, 125, 280) + rock(c, 290, 200, 130, 120, '#7E7468') + waterfall(c, 290, 90, 222, 38) +
    Rc(-2, 220, 404, 30, c.lin([[0, '#7FC4E8'], [1, '#3E8EBE']])) + ground(c, 244, '#6E8E4A', '#3E5E34') +
    who(c, 'explorer', { x: 130, y: 292, s: 1.55, la: 100, lb: -45, ra: 70, rb: -30, prop: 'map', face: 'big' }) + fern(c, 360, 296, 1.5);

  // ── The Atacama Desert ─────────────────────────────────────────
  SC.atacama_desert = [
    c => desertBack(c) + sunDisc(c, 330, 48, 18, '#FFE59A', 6) + P('M-2,226 L402,222 L402,240 L-2,244Z', '#F6F2EA', 'opacity=".9"') +
      ground(c, 240, '#E6B47C', '#B9824E') +
      (() => { let s = ''; const r = rng(131); for (let i = 0; i < 26; i++) { const x = r() * 400, y = 250 + r() * 50; s += S('M' + f1(x) + ',' + f1(y) + ' l' + f1(6 + r() * 10) + ',' + f1((r() - 0.5) * 6) + ' l' + f1(4 + r() * 8) + ',' + f1(4 + r() * 4), '#9C6A3E', 1, 'opacity=".55"'); } return s; })() +
      cactus(c, 90, 270, 1.2) + rock(c, 300, 284, 50, 26, '#B07E56') + haze(c, 212, 30, '#FFF0D0', 0.6),
    c => nightDesert(c, 141, true) + ground(c, 250, '#4A3E52', '#2A2236') + cactus(c, 100, 280, 1.3) + cactus(c, 330, 268, 0.8) + rock(c, 240, 286, 60, 26, '#4E4258')
  ];
  SC.atacama_desert.cover = c => sky(c, 'dusk') + starsField(c, 142, 60, 0, 160) + moon(c, 300, 60, 12) + cone(c, 260, 220, 200, 100, ['#5A4A78', '#3E3460']) +
    hills(c, 143, 230, 20, '#C98A6A', '#7E5A5A', 4) + cactus(c, 120, 286, 1.5) + ground(c, 276, '#9E6E5A', '#5E4048');

  // ── The Great Moon Landing ─────────────────────────────────────
  function rocket(c, x, y, s, flame) {
    const w = c.side('#FAFAFA', 0.25);
    return G(T(x, y, s), (flame ? P('M-14,0 Q-18,40 0,80 Q18,40 14,0Z', c.lin([[0, '#FFF6D0'], [0.4, '#FFB13B'], [1, '#E2472E', 0]])) + C(0, 18, 34, c.rad([[0, '#FFE2A0', 0.6], [1, '#FFE2A0', 0]])) : '') +
      P('M-16,0 L-26,6 L-26,-14 L-16,-24Z', '#2A2A2E') + P('M16,0 L26,6 L26,-14 L16,-24Z', '#1A1A1E') +
      Rc(-16, -110, 32, 110, w) + Rc(-16, -60, 32, 6, '#1E1E22') + Rc(-16, -96, 16, 14, '#1E1E22') + Rc(0, -40, 16, 14, '#1E1E22') +
      P('M-12,-110 L-10,-132 L10,-132 L12,-110Z', w) + P('M-10,-132 L0,-150 L10,-132Z', c.side('#E8E8EA')) + S('M0,-150 L0,-166', '#666', 1.6) + S('M-4,-160 L4,-160', '#B82A27', 2));
  }
  function smoke(c, seed, x, y, w) {
    const r = rng(seed); let s = '';
    for (let i = 0; i < 12; i++) s += C(x + (r() - 0.5) * w, y + r() * 30, 14 + r() * 18, c.rad([[0, '#FFFFFF'], [1, '#C9CDD4']], 0.4, 0.35, 0.7));
    return s;
  }
  SC.moon_landing = [
    c => sky(c, 'day') + cloud(c, 80, 60, 0.7, 'day') + ground(c, 250, '#8FA87A', '#5E7A52') + G(T(270, 250), Rc(-6, -190, 12, 190, '#C24A2A') + (() => { let s = ''; for (let i = 0; i < 10; i++) s += S('M-6,' + (-i * 19) + ' L6,' + (-i * 19 - 19), '#8E2E1A', 1.4); return s; })()) +
      rocket(c, 200, 190, 1.0, true) + smoke(c, 151, 200, 230, 200) + moon(c, 340, 50, 10),
    c => sky(c, 'space') + starsField(c, 152, 60, 0, 300) +
      C(200, 150, 140, c.rad([[0.78, '#9AA3AE', 0], [0.8, '#9AA3AE'], [0.9, '#6E7680'], [1, '#2E333A']])) + C(200, 150, 112, '#05060F') +
      C(200, 150, 50, c.rad([[0, '#7FC4F0'], [0.5, '#2E7AC4'], [1, '#0E3A7A']], 0.35, 0.35, 0.7)) +
      P('M180,120 q16,-10 24,4 q-4,14 -18,10 q-10,-4 -6,-14Z M214,150 q14,-6 18,10 q-8,16 -20,4Z M168,166 q10,-4 16,6 q-6,10 -14,4Z', '#5FA84E', 'opacity=".9"') +
      P('M160,112 q30,-10 60,2 M150,140 q40,-14 90,-4 M174,184 q30,8 54,-6', 'none', 'stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"') +
      E(170, 130, 24, 14, '#fff', 'opacity=".18"') + P('M120,90 L140,80 L132,120Z', '#fff', 'opacity=".06"') +
      who(c, 'astro', { x: 330, y: 340, s: 1.6, la: 140, lb: 10, flip: true }),
    c => sky(c, 'space') + starsField(c, 153, 60, 0, 180) + C(70, 60, 22, c.rad([[0, '#7FC4F0'], [1, '#1E5AA4']], 0.35, 0.35, 0.7)) + P('M60,52 q8,-6 14,2 q-4,10 -12,4Z', '#5FA84E') +
      P('M-2,200 Q100,186 200,196 T402,190 L402,304 L-2,304Z', c.lin([[0, '#C9C6BE'], [1, '#7E7B74']])) +
      E(90, 250, 30, 7, '#8E8A82') + E(320, 270, 40, 8, '#8E8A82') + E(250, 220, 18, 4, '#9E9A92') +
      G(T(110, 214), shadow(c, 10, 6, 50) + S('M-30,0 L-20,-20 M30,0 L20,-20 M-14,2 L-8,-20 M14,2 L8,-20', '#B8B4AA', 2) +
        P('M-24,-20 L24,-20 L20,-44 L-20,-44Z', c.lin([[0, '#F7D774'], [0.5, '#C4892B'], [1, '#8A5A1A']], 0, 0, 1, 0)) +
        P('M-16,-44 L16,-44 L20,-58 L8,-70 L-10,-70 L-20,-58Z', c.side('#D6D6D2')) + Rc(-6, -62, 10, 8, '#2A2F38')) +
      (() => { let s = ''; for (let i = 0; i < 6; i++) s += E(160 + i * 18, 262 - i * 4, 3.4, 1.8, '#6E6A62'); return s; })() +
      who(c, 'astro', { x: 280, y: 250, s: 1.05, legs: 'walk', la: 40, lb: 10, ra: -20, rb: 10 })
  ];
  SC.moon_landing.cover = c => sky(c, 'space') + starsField(c, 154, 80, 0, 300) + moon(c, 290, 90, 60, 'full') + rocket(c, 140, 240, 0.85, true);

  // ── Darwin in Patagonia ────────────────────────────────────────
  function cliffs(c, y, seed) {
    let s = P('M-2,' + y + ' L80,' + (y - 6) + ' L140,' + (y - 2) + ' L230,' + (y - 10) + ' L300,' + (y - 4) + ' L402,' + (y - 8) + ' L402,' + (y + 60) + ' L-2,' + (y + 60) + 'Z', c.lin([[0, '#E2C9A0'], [1, '#A88A62']]));
    for (let i = 0; i < 4; i++) s += S('M-2,' + (y + 10 + i * 12) + ' Q200,' + (y + 4 + i * 12) + ' 402,' + (y + 8 + i * 12), '#B8996E', 2, 'opacity=".7"');
    return s;
  }
  SC.darwin_patagonia = [
    c => sky(c, 'sea') + cloud(c, 90, 50, 0.9, 'day') + cloud(c, 300, 40, 0.6, 'day', 2) + sea(c, 200, '#4E9ACB', '#1E5A88', 7) +
      P('M260,200 L280,160 L330,150 L402,146 L402,206Z', c.lin([[0, '#D9BC8E'], [1, '#9E7E56']])) + S('M280,170 L402,162 M286,184 L402,178', '#B8996E', 2) +
      ship(c, 150, 222, 1.05) + S('M60,232 q20,-4 40,0 M200,240 q30,-4 60,0', '#fff', 1.6, 'opacity=".7"'),
    c => sky(c, 'day') + cliffs(c, 160) + ground(c, 220, '#D8BE86', '#B39A62') + grass(c, 161, 226, 300, 50, '#A89A5A') +
      G(T(240, 196), E(0, 0, 26, 14, '#F2E6C8', 'opacity=".95"') + C(-8, -2, 3, '#6E5A3A') + S('M16,-4 L34,-2 M18,2 L36,4 M20,6 L36,10', '#F2E6C8', 3.6) + S('M-30,10 L-60,16 M-28,14 L-56,24', '#F2E6C8', 3)) +
      who(c, 'darwin', { x: 140, y: 286, s: 1.3, la: 110, lb: -20, ra: -10, rb: 10, prop: 'magnifier', face: 'wow' }),
    c => sky(c, 'day') + range(c, 171, 200, 6, 30, 60, MT.far, 0) + ground(c, 196, '#C9B47A', '#9E8A5A') + grass(c, 172, 200, 300, 60, '#9E9A5A') +
      guanaco(c, 300, 226, 1.2, { flip: true }) + guanaco(c, 350, 220, 0.9) + rhea(c, 250, 220, 1.0) +
      rock(c, 150, 284, 70, 24, '#9E8E7A') + who(c, 'darwin', { x: 140, y: 270, s: 1.2, legs: 'sit', la: 70, lb: -40, ra: 50, rb: -30, prop: 'notebook', face: 'smile' }) +
      G(T(60, 280), Rc(-8, -20, 16, 20, '#CFE6EE', 'rx="3" opacity=".85"') + Rc(-9, -24, 18, 5, '#6E4A2E') + C(0, -8, 4, '#A86E3A')),
    c => sky(c, 'day') + ground(c, 200, '#C9B47A', '#9E8A5A') + grass(c, 173, 204, 300, 50, '#9E9A5A') +
      rhea(c, 280, 266, 1.6, { flip: true }) + rhea(c, 340, 230, 1.0) +
      who(c, 'darwin', { x: 140, y: 288, s: 1.35, la: 100, lb: -30, ra: -10, rb: 10, prop: 'magnifier', face: 'calm' }),
    c => sky(c, 'storm') + cloud(c, 100, 50, 1.2, 'storm') + cloud(c, 300, 40, 1, 'storm', 2) + range(c, 181, 190, 6, 70, 120, MT.storm, 0.4) +
      sea(c, 186, '#4E6E8A', '#1E3A52', 9) + ship(c, 200, 230, 1.0, { tilt: -8 }) +
      P('M-2,250 Q40,226 80,250 T160,250 T240,250 T320,250 T402,248 L402,304 L-2,304Z', c.lin([[0, '#3E5E7A'], [1, '#18304A']])) +
      S('M20,240 q14,-10 28,0 M240,244 q14,-10 28,0', '#E8F0F8', 2.4, 'opacity=".8"') +
      (() => { let s = ''; const r = rng(182); for (let i = 0; i < 40; i++) { const x = r() * 400, y = r() * 260; s += S('M' + f1(x) + ',' + f1(y) + ' l-4,12', '#DDE6F0', 1, 'opacity=".5"'); } return s; })(),
    c => Rc(-2, -2, 404, 304, c.lin([[0, '#6E4A32'], [1, '#3E2A1E']])) + Rc(250, 30, 110, 120, c.lin([[0, '#BFE0F0'], [1, '#FFF0D2']])) + S('M305,30 L305,150 M250,90 L360,90', '#4E321E', 5) +
      Rc(-2, 200, 404, 104, c.lin([[0, '#9A6A40'], [1, '#6E4826']])) + Rc(-2, 198, 404, 6, '#B88050') +
      G(T(180, 214) + ' rotate(-4)', Rc(-70, -36, 140, 64, '#FBF3DE', 'rx="2"') + S('M-50,10 L-30,-6 L-10,-10 M-30,-6 L-24,-24 M-10,-10 L4,-24 L20,-28 M4,-24 L10,-32 M-10,-10 L14,-6 L30,-14 M14,-6 L22,6', '#3E2E22', 1.6) +
        S('M30,16 h30 M30,22 h22', '#9A8E7A', 1.2)) +
      G(T(70, 200), Rc(-8, -34, 16, 34, '#F4ECDA') + C(0, -40, 14, c.rad([[0, '#FFD98A', 0.7], [1, '#FFD98A', 0]])) + P('M-2,-34 Q0,-44 2,-34Z', '#FFB13B')) +
      Rc(320, 170, 40, 30, '#5A3A2A') + Rc(326, 160, 40, 10, '#2E5E8A') + Rc(322, 150, 40, 10, '#8A2E2A') + C(110, 190, 50, c.rad([[0, '#FFE2A0', 0.3], [1, '#FFE2A0', 0]]))
  ];
  SC.darwin_patagonia.cover = c => sky(c, 'sea') + sea(c, 200, '#4E9ACB', '#1E5A88', 8) + ship(c, 270, 214, 0.8) + cliffs(c, 236, 1) +
    who(c, 'darwin', { x: 120, y: 290, s: 1.5, la: 90, lb: -40, ra: -10, rb: 10, prop: 'notebook', face: 'smile' });

  // ── The Great Valdivia Earthquake ──────────────────────────────
  function town(c, y, seed, shake) {
    const r = rng(seed); let s = '';
    const cols = ['#E9DCC6', '#F2C46B', '#8EC1D6', '#E89A7A', '#BFD7A6', '#F4ECDC'];
    for (let i = 0; i < 8; i++) {
      const x = 20 + i * 50 + r() * 10, sc = 0.7 + r() * 0.3, rot = shake ? (r() - 0.5) * 8 : 0;
      s += G('rotate(' + f1(rot) + ' ' + f1(x) + ' ' + y + ')', house(c, x, y, sc, cols[i % 6], i % 2 ? '#8E3A2A' : '#5E5A5A'));
    }
    return s;
  }
  SC.valdivia_1960 = [
    c => sky(c, 'day') + range(c, 191, 170, 6, 40, 80, MT.far, 0.3) + hills(c, 192, 190, 14, '#7FA86A', '#5E8A4E', 5) +
      Rc(-2, 226, 404, 30, c.lin([[0, '#6EB4DC'], [1, '#3E86B8']])) + town(c, 222, 193, true) + ground(c, 254, '#8E9A6A', '#5E6A4A') +
      (() => { let s = ''; for (let i = 0; i < 8; i++) s += S('M' + (30 + i * 50) + ',180 q-6,-6 0,-12 M' + (46 + i * 50) + ',180 q6,-6 0,-12', '#5E4E44', 1.6, 'opacity=".7"'); return s; })() +
      S('M60,262 l14,10 l-6,8 l16,10 M300,266 l-10,12 l8,6 l-12,12', '#3E3028', 2) +
      G(T(300, 40), Rc(-60, -20, 120, 44, '#FFFFFF', 'rx="6" opacity=".92"') + L('-54,2 -40,2 -36,-2 -32,4 -28,-14 -22,18 -16,-16 -10,14 -4,-10 2,8 8,-6 14,4 20,-2 54,2', '#C0392B', 1.6)),
    c => sky(c, 'day') + Rc(-2, 100, 230, 40, c.lin([[0, '#5AA8D8'], [1, '#2E6E9E']])) +
      P('M228,100 L280,70 L320,90 L360,60 L402,76 L402,140 L228,140Z', c.lin([[0, '#9C8A6E'], [1, '#6E5E48']])) +
      P('M-2,140 L230,140 L402,140 L402,300 L-2,300Z', '#C98A5A') +
      P('M-2,140 L210,140 L330,300 L-2,300Z', c.lin([[0, '#6E7A8E'], [1, '#3E4A5E']])) + P('M210,140 L402,140 L402,300 L330,300Z', c.lin([[0, '#B98A5A'], [1, '#7E5A3A']])) +
      P('M-2,140 L210,140 L218,152 L-2,152Z', '#8E9AAE') + P('M210,140 L402,140 L402,156 L222,156Z', '#D9A870') +
      C(270, 220, 30, c.rad([[0, '#FFE070', 0.9], [1, '#FFE070', 0]])) + sparkle(270, 220, 16, '#FFF6C8') +
      P('M80,210 L130,236 L122,222 L140,226Z', '#FFFFFF', 'opacity=".9"') + S('M60,200 L120,232', '#FFFFFF', 4) +
      P('M370,190 L340,200 L352,206 L330,214Z', '#FFFFFF', 'opacity=".9"') + S('M390,184 L344,204', '#FFFFFF', 4) +
      C(270, 220, 70, 'none', 'stroke="#FFE070" stroke-width="2" stroke-dasharray="3 6" opacity=".7"') + C(270, 220, 110, 'none', 'stroke="#FFE070" stroke-width="1.4" stroke-dasharray="3 8" opacity=".5"'),
    c => sky(c, 'storm') + cloud(c, 90, 50, 1, 'storm') + hills(c, 201, 170, 20, '#7A8A6A', '#5E6A52', 4) + town(c, 168, 202) +
      sea(c, 200, '#3E7EA8', '#1E4E78', 11) +
      P('M-2,200 L-2,96 Q60,70 120,100 Q150,120 140,150 Q128,130 110,132 Q130,150 150,200Z', c.lin([[0, '#7FC4E8'], [0.6, '#2E7AAE'], [1, '#1E4E78']])) +
      S('M-2,98 Q60,72 120,100 Q150,120 140,150', '#FFFFFF', 5, 'opacity=".85"') + bubbles(203, 20, 40, 90, 110, 40) +
      ground(c, 264, '#C9B48A', '#9E8A62'),
    c => Rc(-2, -2, 404, 304, c.lin([[0, '#2E7AB4'], [1, '#164A7A']])) +
      (() => { let s = ''; for (let i = 1; i <= 7; i++) s += P('M' + (380 - i * 50) + ',' + (230 - i * 26) + ' A' + (i * 56) + ',' + (i * 46) + ' 0 0 0 ' + (380 - i * 50) + ',' + (230 + i * 26), 'none', 'stroke="#BFE6FF" stroke-width="' + (3 - i * 0.3) + '" opacity="' + (0.9 - i * 0.1) + '"'); return s; })() +
      P('M376,150 L392,154 L398,200 L396,260 L388,300 L402,300 L402,140Z', '#C9A66E') + C(382, 230, 5, '#E23B2E') + C(382, 230, 10, 'none', 'stroke="#E23B2E" stroke-width="2"') +
      E(170, 110, 10, 5, '#5FA84E') + E(182, 116, 5, 3, '#5FA84E') + E(160, 106, 4, 2.4, '#5FA84E') +
      P('M10,40 Q24,46 30,64 Q24,80 16,90 L10,90 Q20,70 14,56Z', '#5FA84E') + P('M20,30 l6,4 l-4,6Z', '#5FA84E'),
    c => sky(c, 'day') + cloud(c, 300, 50, 0.7, 'day') + ground(c, 240, '#BFC9A8', '#8E9A7A') +
      G(T(280, 240), Rc(-50, -120, 100, 120, '#00000000', 'stroke="#7E8A9A" stroke-width="4"') + S('M-50,-120 L50,0 M50,-120 L-50,0 M-50,-60 L50,-60', '#7E8A9A', 3) + Rc(-52, -124, 104, 6, '#5E6A7A') + Rc(-56, -4, 112, 6, '#5E6A7A')) +
      G(T(80, 190), Rc(-3, 0, 6, 60, '#6E6E6E') + Rc(-30, -40, 60, 40, '#1F5FA8', 'rx="4"') + Rc(-26, -36, 52, 32, 'none', 'rx="2" stroke="#fff" stroke-width="2"') +
        S('M-20,-12 q6,-8 12,0 t12,0', '#fff', 2.4) + P('M6,-26 L18,-26 L18,-30 L24,-24 L18,-18 L18,-22 L6,-22Z', '#fff')) +
      who(c, 'engineer', { x: 170, y: 286, s: 1.2, la: 80, lb: -20, ra: 40, rb: 10, prop: 'blueprint', face: 'smile' }) +
      who(c, 'engineer', { x: 220, y: 290, s: 1.1, flip: true, skin: SKIN[0], hatCol: '#F5F5F0', top: '#3E7EB8', la: 120, lb: 10, face: 'smile' }),
    c => sky(c, 'morning') + sunDisc(c, 320, 60, 16) + range(c, 211, 170, 6, 40, 80, MT.far, 0.3) + hills(c, 212, 190, 14, '#7FA86A', '#5E8A4E', 5) +
      town(c, 222, 213) + Rc(-2, 224, 404, 40, c.lin([[0, '#6EB4DC'], [1, '#3E86B8']])) + S('M20,240 h60 M200,250 h80', '#fff', 1.4, 'opacity=".6"') +
      G(T(140, 244), P('M-20,0 L20,0 L14,8 L-14,8Z', '#B5523A') + S('M0,0 L0,-18', '#5B3E2B', 1.4) + P('M0,-18 L12,-6 L0,-6Z', '#F4ECDC')) +
      ground(c, 262, '#8EAA6A', '#5E7A4A') + who(c, 'dad', { x: 90, y: 292, s: 0.8, la: 140, lb: 10 }) + who(c, 'boy', { x: 120, y: 294, s: 0.6, la: 150, lb: 10, face: 'big' }) + who(c, 'mom', { x: 300, y: 292, s: 0.8, flip: true, la: 60, lb: 20 })
  ];
  SC.valdivia_1960.cover = c => SC.valdivia_1960[0](c);

  // ── Crossing the Andes ─────────────────────────────────────────
  function bannerAndes(c, x, y, s) {
    return G(T(x, y, s), S('M0,0 L0,-46', '#5B3E2B', 1.6) + P('M0,-46 Q10,-48 20,-44 L20,-30 Q10,-34 0,-32Z', '#FFFFFF') + P('M0,-46 Q10,-48 20,-44 L20,-39 Q10,-43 0,-41Z', '#4A8FD6') + P('M0,-37 Q10,-39 20,-35 L20,-30 Q10,-34 0,-32Z', '#4A8FD6'));
  }
  function column(c, seed, pts, s) {
    const r = rng(seed); let out = '';
    pts.forEach((p, i) => {
      out += i % 3 === 2 ? mule(c, p[0], p[1], s * 0.5, { pack: '#9A7A50' }) : who(c, 'soldier', { x: p[0], y: p[1], s: s * (0.36 + r() * 0.04), legs: 'walk', la: 20, lb: 10, ra: -20, rb: 10, pack: '#7A6040' });
    });
    return out;
  }
  SC.crossing_andes = [
    c => sky(c, 'dawn') + range(c, 221, 200, 6, 90, 140, MT.dusk, 0.35) + haze(c, 160, 60, '#FFD9B0', 0.5) + hills(c, 222, 230, 14, '#9E8A5A', '#6E5E3E', 5) +
      (() => { let s = ''; for (let i = 0; i < 7; i++) s += tent(c, 30 + i * 56, 236 + (i % 2) * 6, 0.45, '#E9DCC6'); return s; })() +
      bannerAndes(c, 330, 250, 1.4) + horse(c, 150, 292, 0.9, { col: '#E9E4DA', saddle: true }) + who(c, 'sanmartin', { x: 146, y: 272, s: 0.6, legs: 'ride', la: 110, lb: -10 }) +
      horse(c, 260, 296, 0.8, { col: '#6E4A32', saddle: true, flip: true }) + who(c, 'ohiggins', { x: 262, y: 278, s: 0.54, legs: 'ride', flip: true, la: 60, lb: 10 }),
    c => sky(c, 'snow') + range(c, 231, 190, 6, 80, 130, MT.far, 0.5) + range(c, 232, 260, 5, 100, 160, MT.mid, 0.45) + cloud(c, 320, 80, 0.9, 'snow') + windLines(233, 10, -10, 40, 420, 200) +
      P('M-2,304 L-2,250 Q120,230 200,250 T402,240 L402,304Z', c.lin([[0, '#FFFFFF'], [1, '#C4D6EC']])) +
      S('M20,290 Q120,260 160,240 T260,210 T340,170', '#AFC2DC', 5, 'opacity=".8"') +
      column(c, 234, [[40, 288], [70, 280], [100, 270], [130, 258], [160, 246], [190, 236], [220, 226], [250, 214], [280, 202], [306, 190]], 1.0),
    c => Rc(-2, -2, 404, 304, '#4E3A2A') + G(T(200, 152) + ' rotate(-1.5)', Rc(-180, -130, 360, 260, c.rad([[0, '#F7EBCB'], [1, '#D9C08C']]), 'rx="6"') +
      (() => { let s = ''; const r = rng(241); for (let i = 0; i < 14; i++) { const y = -110 + i * 16, x = -20 + (r() - 0.5) * 30; s += P('M' + (x - 14) + ',' + (y + 10) + ' L' + x + ',' + (y - 6) + ' L' + (x + 14) + ',' + (y + 10) + 'Z', '#9E8A6E') + P('M' + x + ',' + (y - 6) + ' L' + (x + 4) + ',' + (y - 1) + ' L' + (x - 3) + ',' + y + 'Z', '#fff'); } return s; })() +
      S('M-150,-120 Q-140,0 -160,120', '#5A9AC8', 3) + S('M140,-80 Q120,-40 150,20 T130,110', '#5A9AC8', 2) +
      [-80, -30, 20, 70].map((y, i) => S('M150,' + y + ' Q60,' + (y - 14 + i * 4) + ' -20,' + (y + 4) + ' T-130,' + (y + 10), '#B03A2E', 2.6, 'stroke-dasharray="7 5"') + P('M-130,' + (y + 4) + ' l10,-4 l0,12Z', '#B03A2E')).join('') +
      C(150, -10, 6, '#3E2E22') + C(-132, 6, 6, '#3E2E22') + P(starPath(-132, 6, 3), '#F2D27A') + S('M-170,-120 h340', '#C9AE7A', 1, 'opacity=".4"')) +
      G(T(340, 250), C(0, 0, 22, '#FBF3DE', 'stroke="#9E8A6E" stroke-width="2"') + P('M0,-18 L4,0 L0,18 L-4,0Z', '#B03A2E') + P('M-18,0 L0,-4 L18,0 L0,4Z', '#3E2E22')),
    c => sky(c, 'snow') + range(c, 251, 220, 5, 100, 150, MT.mid, 0.5) + windLines(252, 12, -10, 60, 420, 200) +
      P('M-2,304 L-2,200 L402,260 L402,304Z', c.lin([[0, '#FFFFFF'], [1, '#BFD2EA']])) +
      mule(c, 300, 270, 1.1, { pack: '#9A7A50', flip: true }) + who(c, 'soldier', { x: 230, y: 262, s: 1.0, flip: true, legs: 'walk', la: 70, lb: 10, ra: 40, rb: 10, face: 'calm', scarf: '#B8262E' }) +
      who(c, 'soldier', { x: 120, y: 244, s: 0.95, flip: true, legs: 'walk', la: 60, lb: 20, ra: -10, rb: 10, face: 'calm' }) + S('M236,236 L290,240', '#8A6A4A', 1.6) +
      who(c, 'soldier', { x: 60, y: 226, s: 0.7, flip: true, legs: 'walk', la: 20, lb: 10 }),
    c => sky(c, 'dawn') + sunDisc(c, 90, 120, 18, '#FFD08A') + range(c, 261, 180, 6, 60, 110, MT.dusk, 0.3) + haze(c, 150, 50, '#FFD9B0', 0.6) +
      hills(c, 262, 210, 24, '#B99A62', '#8E7448', 4) + smoke(c, 263, 260, 236, 180) +
      (() => { let s = ''; for (let i = 0; i < 6; i++) s += G(T(80 + i * 46, 270 - (i % 2) * 8), horse(c, 0, 0, 0.5, { walk: true }) + who(c, 'soldier', { x: -2, y: -12, s: 0.34, legs: 'ride', la: 120, lb: 0 })); return s; })() +
      bannerAndes(c, 120, 250, 1.2) + bannerAndes(c, 300, 246, 1.1) + ground(c, 280, '#8E7448', '#6E5638'),
    c => sky(c, 'dawn') + sunDisc(c, 200, 168, 30, '#FFD08A', 6) + range(c, 271, 230, 7, 80, 140, MT.dusk, 0.35) + haze(c, 200, 50, '#FFE2B8', 0.5) +
      hills(c, 272, 260, 20, '#6E5E7A', '#4A3E5A', 4) + G(T(200, 256), S('M0,0 L0,-90', '#5B3E2B', 2.4) + flagCL(c, 1, -90, 54))
  ];
  SC.crossing_andes.cover = c => sky(c, 'snow') + range(c, 281, 220, 6, 90, 150, MT.mid, 0.45) + P('M-2,304 L-2,240 Q200,220 402,250 L402,304Z', c.lin([[0, '#FFFFFF'], [1, '#C4D6EC']])) +
    mule(c, 210, 290, 1.5, { col: '#7E6A58' }) + who(c, 'sanmartin', { x: 206, y: 262, s: 0.95, legs: 'ride', la: 130, lb: -10, face: 'calm' }) + bannerAndes(c, 320, 280, 1.5);

  // ── Stargazing in the Atacama ──────────────────────────────────
  SC.atacama_stars = [
    c => desertBack(c) + sunDisc(c, 70, 44, 15) + G(T(290, 112), dome(c, -16, 0, 0.32) + dome(c, 4, -2, 0.36) + dome(c, 22, 0, 0.3)) +
      ground(c, 240, '#E2AE76', '#B07A4A') + (() => { let s = ''; const r = rng(291); for (let i = 0; i < 24; i++) { const x = r() * 400, y = 250 + r() * 50; s += S('M' + f1(x) + ',' + f1(y) + ' l10,2 l6,6', '#9C6A3E', 1, 'opacity=".5"'); } return s; })() +
      rock(c, 110, 284, 60, 26, '#B07E56') + haze(c, 220, 30, '#FFF0D0', 0.5),
    c => nightDesert(c, 301) + ground(c, 250, '#3A3050', '#221C34') +
      G(T(240, 268), S('M0,0 L-10,24 M0,0 L10,24 M0,0 L0,26', '#2A2A34', 2) + G('rotate(-35)', Rc(-4, -30, 8, 32, '#E8E8EA', 'rx="2"') + Rc(-5, -32, 10, 4, '#2A2A34'))) +
      who(c, 'astronomer', { x: 200, y: 292, s: 1.1, la: 100, lb: -40, ra: 60, rb: -30, top: '#3A4A78', face: 'smile' }) + Rc(-2, -2, 404, 304, '#060A24', 'opacity=".12"'),
    c => sky(c, 'thin') + cone(c, 320, 180, 200, 100, ['#A8846A', '#7E5E4A'], 0.15) + range(c, 311, 180, 5, 30, 50, MT.rust, 0) +
      ground(c, 176, '#C9A27A', '#9E7A58') + (() => { let s = ''; const r = rng(312); const pts = []; for (let i = 0; i < 18; i++) pts.push([20 + r() * 360, 186 + r() * 100]); pts.sort((a, b) => a[1] - b[1]); pts.forEach(p => s += dish(c, p[0], p[1], 0.5 + (p[1] - 186) / 140, -20 - r() * 15)); return s; })(),
    c => sky(c, 'space') + starsField(c, 321, 90, 0, 300, true) +
      E(150, 90, 150, 70, c.rad([[0, '#F28CB0', 0.55], [0.5, '#8E5AC8', 0.3], [1, '#3A2A8A', 0]])) + E(230, 110, 110, 50, c.rad([[0, '#FFC46B', 0.4], [1, '#FFC46B', 0]])) +
      E(120, 70, 60, 26, '#1A0E2A', 'opacity=".45" transform="rotate(-14 120 70)"') + C(200, 90, 4, '#FFFFFF') + C(200, 90, 16, c.rad([[0, '#FFFFFF', 0.8], [1, '#FFFFFF', 0]])) +
      [0, 1, 2, 3].map(i => S('M' + (160 + i * 30) + ',150 q8,10 0,20 t0,20 t0,20 t0,20', '#9FE8FF', 2, 'opacity="' + (0.9 - i * 0.15) + '"')).join('') +
      ground(c, 250, '#4A3E52', '#2A2236') + dish(c, 210, 290, 2.4, -10),
    c => Rc(-2, -2, 404, 304, c.lin([[0, '#1E2436'], [1, '#121624']])) + Rc(40, 40, 150, 100, '#05060F', 'rx="6" stroke="#4A5470" stroke-width="4"') +
      G(T(115, 90), E(0, 0, 50, 30, c.rad([[0, '#FFE6A0'], [0.3, '#E8955A'], [1, '#5E2A1E', 0]])) + E(0, 0, 36, 22, 'none', 'stroke="#2A0E0A" stroke-width="2.4" opacity=".8"') + E(0, 0, 24, 14, 'none', 'stroke="#2A0E0A" stroke-width="2" opacity=".8"') + C(0, 0, 4, '#FFFBEA')) +
      Rc(220, 50, 140, 90, '#05060F', 'rx="6" stroke="#4A5470" stroke-width="4"') +
      G(T(290, 95), (() => { let s = ''; for (let i = 0; i < 4; i++) s += G('rotate(' + i * 90 + ')', S('M0,0 Q20,-6 30,10 Q28,26 10,30', '#C9B8F0', 3, 'opacity=".8"')); return s; })() + C(0, 0, 6, '#FFF4D0') + G('translate(-66,-43) scale(0.33)', starsField(c, 331, 26, 0, 260))) +
      Rc(-2, 220, 404, 84, '#2E3448') + Rc(-2, 214, 404, 8, '#3E4660') +
      who(c, 'astronomer', { x: 190, y: 282, s: 1.1, legs: 'sit', la: 70, lb: -40, ra: 60, rb: -50, face: 'big' }),
    c => sky(c, 'dusk') + starsField(c, 341, 50, 0, 140) + range(c, 342, 230, 6, 40, 90, MT.dusk, 0) +
      P('M60,240 Q200,150 340,240Z', c.lin([[0, '#8E6E7A'], [1, '#4E3E54']])) +
      G(T(200, 176), Rc(-46, -10, 92, 18, c.side('#E8ECF2', 0.2)) + P('M-48,-10 A48,48 0 0 1 48,-10Z', c.side('#FFFFFF', 0.25)) + P('M-6,-58 L6,-58 L8,-10 L-8,-10Z', '#1B2236')) +
      G(T(280, 180), S('M0,0 L0,-110 L-80,-110', '#F2B33D', 3) + S('M-80,-110 L-80,-80', '#888', 1.2) + (() => { let s = ''; for (let i = 0; i < 10; i++) s += S('M-3,' + (-i * 11) + ' L3,' + (-i * 11 - 11), '#C98A1E', 1); return s; })()) +
      ground(c, 250, '#6E5468', '#3E2E44')
  ];
  SC.atacama_stars.cover = c => nightDesert(c, 351) + G(T(200, 222), dome(c, -60, 0, 0.8, true) + dome(c, 0, -6, 1.0, true) + dome(c, 60, 0, 0.8, true)) + ground(c, 250, '#3A3050', '#221C34');

  // ── New: Pipo the Humboldt Penguin ─────────────────────────────
  function rockyCoast(c, mode, seed) {
    return sky(c, mode || 'sea') + range(c, seed, 150, 6, 30, 60, MT.brown, 0) + haze(c, 120, 40, '#FFF4E0', 0.4) +
      sea(c, 150, '#4FA6D6', '#1E5E92', seed) + P('M-2,250 L40,210 L90,220 L130,196 L190,214 L230,236 L260,304 L-2,304Z', c.lin([[0, '#9C8676'], [1, '#5E4E44']])) +
      P('M40,210 L90,220 L130,196 L110,214 L80,226Z', '#B8A292') +
      S('M230,236 q20,-8 40,0 t40,0 t40,0 t40,0', '#FFFFFF', 3, 'opacity=".85"') + S('M250,256 q20,-6 40,0 t40,0 t40,0', '#FFFFFF', 2, 'opacity=".6"');
  }
  SC.penguin_coast = [
    c => rockyCoast(c, 'sea', 401) + sunDisc(c, 330, 50, 15) + cloud(c, 120, 50, 0.6, 'day') + penguin(c, 130, 204, 1.25) + penguin(c, 64, 222, 0.8, { flip: true }),
    c => sky(c, 'sea') + sea(c, 200, '#4FA6D6', '#1E5E92', 402) + P('M-2,304 L-2,250 Q200,230 402,250 L402,304Z', c.lin([[0, '#A8927E'], [1, '#6E5A4A']])) +
      penguin(c, 200, 280, 3.2) + sparkle(250, 170, 6, '#FFFFFF'),
    c => under(c, 403) + (() => { let s = ''; const r = rng(404); for (let i = 0; i < 26; i++) s += fish(c, 230 + r() * 160, 90 + r() * 90, 0.35 + r() * 0.15, '#9FB8C8', '#E8F0F8'); return s; })() +
      penguin(c, 150, 150, 1.8, { swim: true }) + seaFloor(c, 405, 270),
    c => sky(c, 'sunset') + sunDisc(c, 330, 170, 20, '#FFC46B') + sea(c, 176, '#C88A8A', '#5E4A78', 406) +
      P('M-2,304 L-2,190 Q100,170 220,200 L402,240 L402,304Z', c.lin([[0, '#C9A27A'], [1, '#8E6E52']])) +
      E(90, 224, 34, 22, '#3A2A22') + E(90, 230, 26, 14, '#1E1612') +
      penguin(c, 82, 236, 0.7) + G(T(102, 238), E(0, -8, 7, 8, '#8E8A96') + C(1, -18, 5, '#7E7A86') + C(3, -19, 1, '#111')) +
      penguin(c, 210, 252, 1.2, { waddle: true, flip: true }) + S('M240,256 l8,-2 M246,262 l8,-2', '#6E5A4A', 1.6)
  ];
  SC.penguin_coast.cover = c => rockyCoast(c, 'sea', 407) + sunDisc(c, 320, 50, 16) + penguin(c, 140, 210, 1.7) + fish(c, 300, 220, 0.6, '#9FB8C8') ;

  // ── New: Empanadas for the Fiesta ──────────────────────────────
  function kitchen(c) {
    return Rc(-2, -2, 404, 304, c.lin([[0, '#F7E6C8'], [1, '#EBCFA4']])) + Rc(-2, -2, 404, 304, c.rad([[0, '#FFF6E0', 0.6], [1, '#FFF6E0', 0]], 0.8, 0.3, 0.6)) +
      Rc(262, 40, 106, 88, c.lin([[0, '#9FD3F2'], [1, '#E9F4DA']])) + E(300, 132, 60, 26, '#8EB45E') + E(350, 136, 50, 22, '#7FA052') + roundTree(c, 340, 118, 0.5, '#5E8A3E') +
      Rc(262, 40, 106, 88, 'none', 'stroke="#8A5A3A" stroke-width="6"') + S('M315,40 L315,128', '#8A5A3A', 4) + Rc(254, 126, 122, 7, '#9A6A40', 'rx="2"') +
      garland(c, 10, 20, 240, 26, 12) + garland(c, 250, 22, 400, 18, 8) + Rc(-2, 236, 404, 70, '#C9A27A');
  }
  function counter(c, y) {
    return shadow(c, 200, y + 2, 230, 0.2) + Rc(-2, y, 404, 304 - y, c.lin([[0, '#B07A4A'], [1, '#6E4426']])) + Rc(-2, y - 6, 404, 9, c.lin([[0, '#D9A46A'], [1, '#B07A4A']])) +
      S('M-2,' + (y + 30) + ' L402,' + (y + 30) + ' M-2,' + (y + 62) + ' L402,' + (y + 62), '#5E3A20', 1.2, 'opacity=".5"');
  }
  SC.empanadas = [
    c => kitchen(c) + who(c, 'abuela', { x: 120, y: 252, s: 1.3, la: 100, lb: -20, ra: 30, rb: 10, face: 'smile' }) + who(c, 'sofia', { x: 276, y: 252, s: 1.0, flip: true, la: 150, lb: 10, ra: 30, rb: 10, face: 'big' }) +
      counter(c, 206) + G(T(200, 216), E(0, 0, 30, 8, '#F4ECDC') + E(0, -4, 22, 8, '#8A4A2A') + C(-6, -8, 2.4, '#3A5A2A') + C(4, -7, 2.6, '#F4E8B0')) +
      G(T(90, 218), E(0, 0, 16, 6, '#F6E2B4')) + G(T(310, 222), C(-6, -4, 5, '#F4F0E6') + C(6, -4, 5, '#F4F0E6') + E(0, -12, 6, 4, '#C9A27A')),
    c => kitchen(c) + who(c, 'abuela', { x: 110, y: 252, s: 1.3, la: 80, lb: 0, ra: 70, rb: 0, face: 'smile' }) +
      who(c, 'sofia', { x: 300, y: 252, s: 1.0, flip: true, la: 70, lb: 10, ra: 30, rb: 10, prop: 'spoon', face: 'smile' }) + counter(c, 206) + G(T(150, 200), Rc(-30, -4, 60, 8, c.side('#D9A66E', 0.3), 'rx="4"') + Rc(-40, -2, 10, 4, '#8A5A3A', 'rx="2"') + Rc(30, -2, 10, 4, '#8A5A3A', 'rx="2"')) +
      E(150, 214, 34, 7, '#F6E2B4') + E(230, 218, 18, 6, '#F6E2B4') + E(270, 220, 18, 6, '#F6E2B4') + G(T(230, 214), E(0, 0, 8, 3, '#8A4A2A')) +
G(T(340, 214), E(0, 0, 20, 7, '#F4ECDC') + E(0, -3, 15, 6, '#8A4A2A')),
    c => sky(c, 'day') + ground(c, 220, '#A9C27A', '#7FA052') + roundTree(c, 360, 230, 1.4, '#5E8A3E') + garland(c, 0, 40, 200, 50, 10) +
      G(T(240, 246), shadow(c, 10, 0, 70) + P('M-56,0 Q-60,-60 0,-70 Q60,-60 56,0Z', c.rad([[0, '#D9A070'], [1, '#9E6440']], 0.35, 0.3, 0.8)) +
        P('M-22,0 Q-22,-34 0,-34 Q22,-34 22,0Z', '#2A1810') + C(0, -10, 30, c.rad([[0, '#FFB13B', 0.8], [1, '#FF6A2E', 0]])) + P('M-10,0 q4,-16 8,-6 q4,-14 8,0Z', '#FFB13B')) +
      who(c, 'abuela', { x: 130, y: 286, s: 1.15, la: 90, lb: -10, ra: 80, rb: -10, face: 'smile' }) + G(T(172, 240), Rc(-20, -3, 44, 6, '#6E6E6E') + emp(c, -8, -3, 0.5) + emp(c, 8, -3, 0.5)) +
      who(c, 'sofia', { x: 60, y: 290, s: 0.9, la: 140, lb: 10, face: 'big' }),
    c => sky(c, 'morning') + ground(c, 210, '#A9C27A', '#7FA052') + roundTree(c, 60, 220, 1.6, '#5E8A3E') + roundTree(c, 360, 214, 1.3, '#6E9A4A') + garland(c, 0, 40, 400, 44, 18) +
      who(c, 'dad', { x: 90, y: 250, s: 0.95, la: 80, lb: -10 }) + who(c, 'mom', { x: 310, y: 250, s: 0.95, flip: true, la: 80, lb: -10 }) +
      who(c, 'abuela', { x: 230, y: 244, s: 0.9, flip: true, la: 70, lb: -10 }) + who(c, 'sofia', { x: 160, y: 246, s: 0.75, la: 150, lb: 10, face: 'big' }) +
      Rc(40, 230, 320, 14, '#F4ECDC') + Rc(40, 242, 320, 60, c.lin([[0, '#C9302C'], [1, '#8E1E1A']])) +
      emp(c, 120, 230, 0.8) + emp(c, 160, 226, 0.8) + emp(c, 200, 230, 0.8) + emp(c, 240, 226, 0.8) + emp(c, 280, 230, 0.8) +
      G(T(330, 226), C(-4, 0, 3, '#7E3A7A') + C(2, -2, 3, '#7E3A7A') + C(0, 3, 3, '#6E2A6A'))
  ];
  SC.empanadas.cover = c => Rc(-2, -2, 404, 304, c.lin([[0, '#F7E6C8'], [1, '#E9C694']])) + garland(c, 0, 20, 400, 22, 16) +
    who(c, 'abuela', { x: 90, y: 236, s: 1.25, la: 110, lb: -20 }) + who(c, 'sofia', { x: 320, y: 240, s: 1.0, flip: true, la: 150, lb: 10, face: 'big' }) +
    E(200, 250, 90, 22, '#F4F0E6') + E(200, 248, 80, 18, '#EAE2D2') + emp(c, 170, 240, 1.2) + emp(c, 225, 238, 1.2) + emp(c, 198, 222, 1.2) + Rc(-2, 270, 404, 34, '#B07A4A');

  // ── New: The 33 Miners ─────────────────────────────────────────
  function mineSection(c, extra) {
    return sky(c, 'desert') + cone(c, 300, 120, 220, 70, ['#C98A5E', '#9C6244']) + P('M-2,120 L402,112 L402,304 L-2,304Z', c.lin([[0, '#B98A62'], [0.3, '#8E6248'], [1, '#4E3428']])) +
      S('M-2,140 Q200,130 402,138 M-2,180 Q200,170 402,178 M-2,224 Q200,214 402,222', '#6E4A38', 2, 'opacity=".5"') +
      S('M40,120 Q80,160 60,200 Q40,240 120,250 Q200,262 260,262', '#2A1E18', 9, 'opacity=".9"') + (extra || '');
  }
  SC.miners_33 = [
    c => mineSection(c, G(T(270, 266), Rc(-40, -20, 80, 26, '#FFD98A', 'rx="10" opacity=".9"') + (() => { let s = ''; for (let i = 0; i < 8; i++) s += who(c, 'miner', { x: -32 + i * 9, y: 4, s: 0.16 }); return s; })())) +
      G(T(40, 120), Rc(-12, -20, 24, 20, '#2A1E18', 'rx="10"') + S('M-14,0 L-14,-18 Q0,-28 14,-18 L14,0', '#7A5A3A', 3)) + S('M60,190 l12,8 l-8,10 M80,170 l-10,10', '#2A1E18', 2) + sunDisc(c, 340, 30, 12),
    c => Rc(-2, -2, 404, 304, c.lin([[0, '#3A2A22'], [1, '#1E1612']])) + C(200, 160, 180, c.rad([[0, '#FFD98A', 0.35], [1, '#FFD98A', 0]])) +
      P('M-2,-2 L402,-2 L402,40 Q200,0 -2,40Z', '#2A1E18') + Rc(-2, 236, 404, 70, c.lin([[0, '#5E4638'], [1, '#2A1E18']])) +
      who(c, 'miner', { x: 110, y: 256, s: 1.0, legs: 'sit', la: 80, lb: -40, face: 'smile' }) + who(c, 'miner', { x: 290, y: 256, s: 1.0, legs: 'sit', flip: true, la: 80, lb: -40, face: 'smile', skin: SKIN[0] }) +
      who(c, 'miner', { x: 200, y: 262, s: 1.1, legs: 'sit', la: 100, lb: -30, ra: 60, rb: -30, face: 'calm', skin: SKIN[2] }) +
      G(T(200, 230), Rc(-6, -6, 12, 8, '#B8BCC4', 'rx="2"') + E(0, -6, 6, 2, '#D9DCE2')) + G(T(150, 238), Rc(-5, -5, 10, 7, '#B8BCC4', 'rx="2"')),
    c => sky(c, 'desert') + sunDisc(c, 70, 40, 14) + ground(c, 220, '#C9A27A', '#9E7A58') +
      G(T(250, 222), Rc(-6, -150, 12, 150, '#D9A030') + (() => { let s = ''; for (let i = 0; i < 12; i++) s += S('M-6,' + (-i * 12) + ' L6,' + (-i * 12 - 12) + ' M6,' + (-i * 12) + ' L-6,' + (-i * 12 - 12), '#9E6E1A', 1.2); return s; })() + Rc(-30, -10, 60, 14, '#5E6A7A') + Rc(40, -40, 50, 40, c.side('#E8762A'), 'rx="3"')) +
      who(c, 'engineer', { x: 130, y: 286, s: 1.25, la: 80, lb: -40, ra: 70, rb: -40, face: 'big' }) +
      G(T(172, 230) + ' rotate(-6)', Rc(-26, -18, 52, 34, '#FBF6E6', 'stroke="#C9B89A" stroke-width="1"') +
        '<text x="0" y="-5" font-family="Nunito, sans-serif" font-size="6.4" font-weight="800" fill="#C0302A" text-anchor="middle">ESTAMOS BIEN</text>' +
        '<text x="0" y="3" font-family="Nunito, sans-serif" font-size="5.2" font-weight="800" fill="#C0302A" text-anchor="middle">EN EL REFUGIO</text>' +
        '<text x="0" y="11" font-family="Nunito, sans-serif" font-size="6" font-weight="800" fill="#C0302A" text-anchor="middle">LOS 33</text>'),
    c => mineSection(c, S('M220,112 L220,256', '#1E1612', 2) + G(T(220, 180), Rc(-3, -12, 6, 24, '#E23B2E', 'rx="3"')) + G(T(270, 266), Rc(-40, -20, 80, 26, '#FFD98A', 'rx="10" opacity=".9"')) +
      G(T(140, 112), Rc(-6, -80, 12, 80, '#D9A030') + Rc(-30, -10, 60, 14, '#5E6A7A')) + S('M140,112 L150,190', '#1E1612', 6) + C(150, 194, 6, '#7A7A7A')) + sunDisc(c, 340, 30, 12),
    c => sky(c, 'night') + starsField(c, 421, 60, 0, 150) + ground(c, 230, '#5E4A40', '#2E221E') + C(200, 200, 140, c.rad([[0, '#FFF2C0', 0.4], [1, '#FFF2C0', 0]])) +
      G(T(200, 236), S('M-50,0 L0,-170 L50,0 M-30,-70 L30,-70 M-40,-30 L40,-30', '#C9CED6', 4) + C(0, -170, 14, 'none', 'stroke="#E8ECF2" stroke-width="4"') + S('M0,-156 L0,-120', '#999', 1.4) +
        Rc(-11, -120, 22, 70, c.lin([[0, '#FFFFFF'], [0.33, '#FFFFFF'], [0.33, '#D52B1E'], [0.66, '#D52B1E'], [0.66, '#0039A6'], [1, '#0039A6']]), 'rx="5"') + S('M-11,-110 L11,-60 M11,-110 L-11,-60', '#E8ECF2', 1, 'opacity=".6"')) +
      who(c, 'miner', { x: 290, y: 290, s: 1.1, flip: true, la: 160, lb: 0, face: 'big', glasses: true }) + who(c, 'rescuer', { x: 110, y: 290, s: 1.0, la: 140, lb: 10, face: 'big' }) +
      G(T(350, 120), C(0, 0, 30, c.rad([[0, '#FFFFFF', 0.5], [1, '#FFFFFF', 0]])) + C(0, 0, 6, '#FFFBEA')) + G(T(50, 110), C(0, 0, 26, c.rad([[0, '#FFFFFF', 0.4], [1, '#FFFFFF', 0]])) + C(0, 0, 5, '#FFFBEA')),
    c => sky(c, 'dawn') + sunDisc(c, 300, 170, 22, '#FFD08A') + ground(c, 220, '#A88A6A', '#6E5440') +
      (() => { let s = ''; for (let i = 0; i < 6; i++) s += tent(c, 20 + i * 70, 226, 0.55, ['#E25B3A', '#3E7EB8', '#F2B33D'][i % 3]); return s; })() +
      who(c, 'dad', { x: 80, y: 290, s: 1.0, la: 160, lb: 0, prop: 'flag', face: 'big' }) + who(c, 'mom', { x: 180, y: 292, s: 0.95, la: 150, lb: 10, face: 'big' }) +
      who(c, 'miner', { x: 250, y: 290, s: 1.0, flip: true, la: 150, lb: 10, face: 'big', glasses: true }) + who(c, 'rescuer', { x: 330, y: 292, s: 0.95, flip: true, la: 160, lb: 0, prop: 'flag', face: 'big' })
  ];
  SC.miners_33.cover = c => SC.miners_33[4](c);

  // ── New: The Moai of Rapa Nui ──────────────────────────────────
  function ahu(c, x, y, w) {
    let s = Rc(x - w / 2, y - 14, w, 14, c.vert('#7A7268', 0.25));
    for (let i = 0; i < w / 14; i++) s += S('M' + (x - w / 2 + i * 14) + ',' + (y - 14) + ' L' + (x - w / 2 + i * 14) + ',' + y, '#5E564E', 1);
    return s;
  }
  const ISLE = 'M-122,44 Q-120,30 -108,24 Q-60,-20 -24,-72 Q-14,-80 -4,-70 Q50,-30 116,-6 Q130,2 124,16 Q118,26 100,28 Q0,40 -100,58 Q-122,60 -122,44Z';
  SC.rapa_nui = [
    c => Rc(-2, -2, 404, 304, c.lin([[0, '#2E86C4'], [1, '#13507E']])) + (() => { let s = ''; const r = rng(601); for (let i = 0; i < 30; i++) { const x = r() * 400, y = r() * 300; s += S('M' + f1(x) + ',' + f1(y) + ' q6,-3 12,0', '#BFE6FF', 1.2, 'opacity=".4"'); } return s; })() +
      G(T(200, 150), E(6, 10, 120, 80, '#0E3E66', 'opacity=".35"') + P(ISLE, c.lin([[0, '#9CC27A'], [1, '#5E8A4E']])) + P(ISLE, 'none', 'stroke="#F2E6C8" stroke-width="4"') +
        C(-96, 34, 18, c.rad([[0, '#6E8A4E'], [1, '#4E6A3A']])) + C(-96, 34, 8, '#3E86B4') + C(-14, -54, 18, c.rad([[0, '#8EAA6A'], [1, '#5E7A4A']])) + C(104, 6, 14, c.rad([[0, '#7E9A5E'], [1, '#5E7A4A']])) +
        (() => { let s = ''; [[-40, 26], [10, -10], [60, 14], [86, 20], [-60, -4]].forEach(p => s += moai(c, p[0], p[1], 0.14, { noShadow: true })); return s; })()) +
      G(T(350, 60), C(0, 0, 22, '#FBF3DE', 'stroke="#9E8A6E" stroke-width="2" opacity=".9"') + P('M0,-18 L4,0 L0,18 L-4,0Z', '#B03A2E') + P('M-18,0 L0,-4 L18,0 L0,4Z', '#3E2E22')),
    c => sky(c, 'night') + starsField(c, 611, 110, 0, 200, true) + moon(c, 80, 60, 10) + sea(c, 210, '#24346A', '#0E1638', 612) +
      G(T(220, 236), P('M-70,0 Q-60,10 60,10 Q76,4 80,-6 L-74,-6Z', '#6E4A2E') + P('M-70,18 Q-60,26 60,26 Q76,20 80,10 L-74,10Z', '#5E3E26') + Rc(-50, -8, 100, 22, '#8A6A4A', 'opacity=".9"') +
        S('M0,-6 L-6,-90', '#5B3E2B', 2.6) + P('M-6,-90 Q30,-70 34,-16 Q10,-30 -4,-10Z', c.side('#D9C08C', 0.25)) +
        who(c, 'navigator', { x: -30, y: -6, s: 0.5, la: 160, lb: -10, face: 'smile' }) + who(c, 'navigator', { x: 40, y: -6, s: 0.46, flip: true, la: 70, lb: 10, skin: SKIN[1] })) +
      P('M300,110 l8,4 l8,-4 M330,90 l6,3 l6,-3', 'none', 'stroke="#E8ECF2" stroke-width="1.6" stroke-linecap="round"'),
    c => sky(c, 'day') + cloud(c, 300, 40, 0.7, 'day') + P('M-2,304 L-2,150 Q120,90 240,120 Q330,140 402,200 L402,304Z', c.lin([[0, '#8E9A6A'], [0.4, '#7A6E58'], [1, '#5E5244']])) +
      P('M60,150 Q120,110 200,126 L190,190 Q130,170 70,200Z', '#9E8A72', 'opacity=".6"') +
      G(T(140, 188) + ' rotate(-64)', moai(c, 0, 0, 0.9, { noShadow: true })) + moai(c, 260, 220, 0.9) + moai(c, 320, 232, 0.8, { flip: true }) +
      G('', moai(c, 210, 196, 0.6)) + who(c, 'navigator', { x: 110, y: 230, s: 0.6, la: 150, lb: -40, face: 'calm' }) + who(c, 'navigator', { x: 170, y: 236, s: 0.6, flip: true, la: 120, lb: -30, skin: SKIN[1] }) +
      grass(c, 613, 240, 300, 40, '#6E7A4A'),
    c => sky(c, 'sea') + cloud(c, 90, 60, 0.8, 'day') + sea(c, 176, '#3E9ACB', '#1E5E92', 621) + ground(c, 210, '#8EAA6A', '#5E7A4A') +
      ahu(c, 200, 230, 240) + [120, 165, 210, 255, 300].map((x, i) => moai(c, x, 216, 0.95 + (i % 2) * 0.08, { flip: true, pukao: i === 2 })).join('') +
      grass(c, 622, 236, 300, 40, '#6E8A4A'),
    c => sky(c, 'day') + hills(c, 631, 196, 26, '#7E9A5E', '#5E7A4A', 4) + ground(c, 206, '#9EAE6A', '#6E7E4A') +
      moai(c, 200, 270, 1.6) + S('M188,140 Q120,160 70,230 M212,140 Q280,160 330,230', '#C9A86E', 2.6) +
      who(c, 'navigator', { x: 70, y: 276, s: 0.9, flip: true, la: -60, lb: 20, ra: -50, rb: 20, legs: 'walk', face: 'calm' }) + who(c, 'navigator', { x: 40, y: 280, s: 0.85, flip: true, la: -60, lb: 20, legs: 'walk', skin: SKIN[1] }) +
      who(c, 'navigator', { x: 330, y: 276, s: 0.9, la: -60, lb: 20, ra: -50, rb: 20, legs: 'walk', face: 'calm', skin: SKIN[1] }) + who(c, 'navigator', { x: 362, y: 280, s: 0.85, la: -60, lb: 20, legs: 'walk' }) +
      S('M160,150 q-6,-6 0,-12 M240,150 q6,-6 0,-12', '#fff', 1.6, 'opacity=".8"'),
    c => sky(c, 'dawn') + sunDisc(c, 200, 160, 26, '#FFD08A', 6) + sea(c, 176, '#C88A7A', '#5E4A6A', 641) +
      ground(c, 214, '#6E5A50', '#3E2E2A') + ahu(c, 200, 240, 360) + (() => { let s = ''; for (let i = 0; i < 15; i++) s += moai(c, 34 + i * 23.5, 228, 0.62 + (i % 3) * 0.06, { col: '#4A3E3A', noShadow: true }); return s; })() +
      Rc(-2, 240, 404, 64, c.lin([[0, '#4E3E38'], [1, '#2A1E1C']]))
  ];
  SC.rapa_nui.cover = c => sky(c, 'sunset') + sunDisc(c, 120, 170, 24, '#FFC46B') + sea(c, 180, '#C88A7A', '#5E4A6A', 651) + ground(c, 220, '#6E5A50', '#3E2E2A') +
    ahu(c, 230, 246, 200) + moai(c, 190, 236, 1.3, { col: '#5A4A44' }) + moai(c, 270, 236, 1.45, { col: '#5A4A44', pukao: true });

  // ── public API ─────────────────────────────────────────────────
  function page(id, i) {
    const set = SC[id];
    if (!set || !set[i]) return '';
    const c = new Ctx();
    let body = '';
    try { body = set[i](c); } catch (e) { return ''; }
    return svg(c, body + finish(c));
  }
  function cover(id) {
    const set = SC[id];
    if (!set) return '';
    const c = new Ctx();
    let body = '';
    try { body = (set.cover || set[0])(c); } catch (e) { return ''; }
    return svg(c, body + finish(c));
  }
  // Portraits: the same characters, framed head-and-shoulders.
  const PORTRAIT = {
    leo:        c => who(c, 'leo', { x: 50, y: 150, s: 1.3, la: 10, lb: 10 }),
    tomas:      c => who(c, 'tomas', { x: 50, y: 150, s: 1.3 }),
    explorer:   c => who(c, 'explorer', { x: 50, y: 150, s: 1.3 }),
    darwin:     c => who(c, 'darwin', { x: 50, y: 150, s: 1.3 }),
    huaso:      c => who(c, 'huaso', { x: 50, y: 150, s: 1.3 }),
    astronaut:  c => who(c, 'astro', { x: 50, y: 150, s: 1.3 }),
    engineer:   c => who(c, 'engineer', { x: 50, y: 150, s: 1.3 }),
    miner:      c => who(c, 'miner', { x: 50, y: 150, s: 1.3 }),
    san_martin: c => who(c, 'sanmartin', { x: 50, y: 150, s: 1.3 }),
    ohiggins:   c => who(c, 'ohiggins', { x: 50, y: 150, s: 1.3 }),
    astronomer: c => who(c, 'astronomer', { x: 50, y: 150, s: 1.3 }),
    sofia:      c => who(c, 'sofia', { x: 50, y: 150, s: 1.3 }),
    abuela:     c => who(c, 'abuela', { x: 50, y: 150, s: 1.3 }),
    navigator:  c => who(c, 'navigator', { x: 50, y: 150, s: 1.3 }),
    rescuer:    c => who(c, 'rescuer', { x: 50, y: 150, s: 1.3 }),
    climber:    c => who(c, 'climber', { x: 50, y: 150, s: 1.3 }),
    pilot:      c => helicopter(c, 50, 64, 0.8, { pilot: true }),
    divers:     c => diver(c, 44, 54, 0.9, { rot: 10 }) + bubbles(5, 6, 70, 20, 20, 30),
    turtle:     c => turtle(c, 46, 56, 0.95),
    ciro:       c => condorChick(c, 46, 92, 1.55),
    condor_mom: c => condorFly(c, 62, 58, 0.58),
    rayo:       c => horse(c, -8, 150, 1.2),
    pablito:    c => pudu(c, 34, 90, 1.9),
    volcano:    c => cone(c, 50, 92, 96, 64, ['#7E8FB8', '#5E6E9A'], 0.34),
    guanaco:    c => guanaco(c, 40, 96, 1.2),
    pipo:       c => penguin(c, 46, 96, 1.35)
  };
  const PORTRAIT_BG = { divers: 'sea', turtle: 'sea', pipo: 'sea', pilot: 'snow', climber: 'snow', tomas: 'snow', astronaut: 'night', astronomer: 'night', miner: 'dusk', ciro: 'morning', condor_mom: 'day', volcano: 'day' };
  function portrait(id) {
    const f = PORTRAIT[id];
    if (!f) return '';
    const c = new Ctx();
    const bg = PORTRAIT_BG[id] || 'morning';
    let body = '';
    try {
      body = Rc(-2, -2, 104, 104, c.lin(SKY[bg] || SKY.morning)) + (bg === 'night' ? starsField(c, 9, 14, 0, 60).replace(/cx="(\d+(\.\d+)?)"/g, (m, n) => 'cx="' + f1(n / 4) + '"') : '') +
        E(50, 104, 60, 22, c.rad([[0, '#ffffff', 0.5], [1, '#ffffff', 0]])) + f(c) +
        Rc(-2, -2, 104, 104, c.rad([[0.6, '#2A1830', 0], [1, '#2A1830', 0.25]]));
    } catch (e) { return ''; }
    return svg(c, body, '0 0 100 100');
  }
  // Library banner: an open storybook with the Andes popping out of it.
  function hero() {
    const c = new Ctx();
    let lines = '';
    for (let i = 0; i < 5; i++) {
      lines += S('M' + (76 + i * 2) + ',' + (118 + i * 7) + ' Q130,' + (110 + i * 7) + ' 186,' + (124 + i * 7), '#C9B89A', 1.4, 'opacity=".7"') +
        S('M' + (214) + ',' + (124 + i * 7) + ' Q270,' + (110 + i * 7) + ' ' + (324 - i * 2) + ',' + (118 + i * 7), '#C9B89A', 1.4, 'opacity=".7"');
    }
    const body = sky(c, 'dawn') + sunDisc(c, 300, 58, 14, '#FFD08A', 5) + starsField(c, 5, 10, 0, 50) + cloud(c, 80, 40, 0.5, 'dawn') + cloud(c, 340, 96, 0.4, 'dawn', 1) +
      range(c, 7, 120, 6, 40, 72, MT.dusk, 0.32, 70, 330) + haze(c, 96, 30, '#FFE2C0', 0.5) +
      condorFly(c, 140, 48, 0.36) + condorFly(c, 214, 30, 0.26, { young: true }) +
      E(200, 168, 190, 14, c.rad([[0, '#2A1830', 0.35], [1, '#2A1830', 0]])) +
      P('M30,160 Q120,146 200,166 Q280,146 370,160 L370,168 Q280,154 200,172 Q120,154 30,168Z', '#7A2E2A') +
      P('M38,156 Q120,140 200,160 L200,166 Q120,148 38,162Z', '#E9DCC0') + P('M362,156 Q280,140 200,160 L200,166 Q280,148 362,162Z', '#DCCDB0') +
      P('M44,152 Q120,132 200,154 L200,104 Q130,86 56,102Z', c.lin([[0, '#FFFBF0'], [1, '#F1E4C8']], 0, 0, 1, 0)) +
      P('M356,152 Q280,132 200,154 L200,104 Q270,86 344,102Z', c.lin([[0, '#EADCBE'], [1, '#FFFBF0']], 0, 0, 1, 0)) +
      Rc(186, 100, 28, 60, c.lin([[0, '#000', 0], [0.5, '#000', 0.16], [1, '#000', 0]], 0, 0, 1, 0)) + lines;
    return svg(c, body + finish(c), '0 0 400 170');
  }

  return { page, cover, portrait, hero, has: id => !!SC[id], hasPortrait: id => !!PORTRAIT[id], _SC: SC };
})();
