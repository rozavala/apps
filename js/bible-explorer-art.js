/* ================================================================
   BIBLE EXPLORER — ART (js/bible-explorer-art.js)
   Hand-built SVG storybook illustrations, one gentle scene per story,
   plus the bookshelf spines and small icons. No images, no network.

   BibleArt.scene(storyId, {thumb})  → <svg> 400×240 storybook scene
   BibleArt.icon(name)               → small <svg> icon
   Scenes are composed from a small kit (sky, land, water, robed
   figures, animals, props) so every story keeps one visual language:
   soft watercolour washes, warm ink outlines, paper grain.
   ================================================================ */

const BibleArt = (() => {
  'use strict';

  let _uid = 0, U = 'b';
  const INK = '#5a4130';
  const SKIN = '#efc7a0', SKIN2 = '#d9a77c';
  const f1 = n => (Math.round(n * 10) / 10);

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = Math.abs(amt), f = amt < 0 ? 0 : 255;
    r = Math.round((f - r) * t + r); g = Math.round((f - g) * t + g); b = Math.round((f - b) * t + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ── Shared defs per scene ─────────────────────────────────────
  function defs(thumb) {
    return '<defs>' +
      '<linearGradient id="' + U + 'lit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a2410" stop-opacity="0.2"/></linearGradient>' +
      '<linearGradient id="' + U + 'vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.25"/><stop offset="1" stop-color="#3a2410" stop-opacity="0.18"/></linearGradient>' +
      '<linearGradient id="' + U + 'haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.5"/></linearGradient>' +
      '<radialGradient id="' + U + 'glow"><stop offset="0" stop-color="#fffbe6" stop-opacity="1"/><stop offset="0.4" stop-color="#fde68a" stop-opacity="0.6"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + U + 'vig" cx="50%" cy="45%" r="72%"><stop offset="0.6" stop-color="#3a2410" stop-opacity="0"/><stop offset="1" stop-color="#3a2410" stop-opacity="0.32"/></radialGradient>' +
      (thumb ? '' : '<filter id="' + U + 'paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.6 0"/></filter>') +
      '</defs>';
  }
  function finish(thumb) {
    return (thumb ? '' : '<rect width="400" height="240" filter="url(#' + U + 'paper)" opacity="0.2"/>') +
      '<rect width="400" height="240" fill="url(#' + U + 'vig)"/>';
  }

  // ── Sky ──
  function sky(kind) {
    const k = {
      day: ['#8ec5ee', '#e9f4fb'], dawn: ['#f6c79a', '#fdf0dc'], dusk: ['#7f7ab8', '#f6c69a'],
      night: ['#14204a', '#3b4d86'], storm: ['#5f6f86', '#a9b4c2'], gold: ['#f8d98a', '#fff6dc'], soft: ['#b9d6ee', '#fbf3e4']
    }[kind] || ['#8ec5ee', '#e9f4fb'];
    const id = U + 'sky' + kind;
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k[0] + '"/><stop offset="1" stop-color="' + k[1] + '"/></linearGradient>' +
      '<rect width="400" height="240" fill="url(#' + id + ')"/>';
  }
  function sun(x, y, r, c) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 3) + '" fill="url(#' + U + 'glow)" opacity="0.7"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (c || '#fff3c4') + '"/>';
  }
  function moon(x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 2.4) + '" fill="#fff" opacity="0.08"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#f4efd8"/><circle cx="' + (x + r * 0.45) + '" cy="' + (y - r * 0.2) + '" r="' + r * 0.9 + '" fill="#1d2b5c" opacity="0.92"/>';
  }
  function stars(n, seed, yMax, big) {
    let s = '', r = seed || 1;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      const x = rnd() * 400, y = rnd() * (yMax || 140), sz = (big ? 1.4 : 0.8) + rnd() * 1.4;
      s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(sz) + '" fill="#fffbe0" opacity="' + f1(0.5 + rnd() * 0.5) + '"/>';
    }
    return s;
  }
  function star8(x, y, r, c) {
    let p = '';
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * 0.32 : (i % 4 ? r * 0.7 : r); p += (i ? 'L' : 'M') + f1(x + Math.cos(a) * rr) + ' ' + f1(y + Math.sin(a) * rr); }
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r * 2.6 + '" fill="url(#' + U + 'glow)"/><path d="' + p + 'Z" fill="' + (c || '#fff6c8') + '"/>';
  }
  function clouds(list, c) {
    return list.map(q => '<g opacity="0.92" transform="translate(' + q[0] + ' ' + q[1] + ') scale(' + (q[2] || 1) + ')">' +
      '<ellipse cx="0" cy="0" rx="26" ry="8" fill="' + (c || '#fff') + '"/><ellipse cx="-9" cy="-6" rx="12" ry="8" fill="' + (c || '#fff') + '"/><ellipse cx="8" cy="-8" rx="14" ry="10" fill="' + (c || '#fff') + '"/>' +
      '<ellipse cx="2" cy="4" rx="24" ry="3.5" fill="#000" opacity="0.06"/></g>').join('');
  }
  function rays(x, y, n, r, c, op) {
    let p = '';
    for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; p += 'M' + x + ' ' + y + ' L' + f1(x + Math.cos(a - 0.05) * r) + ' ' + f1(y + Math.sin(a - 0.05) * r) + ' L' + f1(x + Math.cos(a + 0.05) * r) + ' ' + f1(y + Math.sin(a + 0.05) * r) + ' Z '; }
    return '<path d="' + p + '" fill="' + (c || '#fff3c4') + '" opacity="' + (op || 0.35) + '"/>';
  }

  // ── Land & water ──
  function hills(y, c1, c2) {
    return '<path d="M0 ' + (y - 10) + ' Q70 ' + (y - 40) + ' 150 ' + (y - 18) + ' T300 ' + (y - 26) + ' T400 ' + (y - 20) + ' V240 H0 Z" fill="' + c1 + '"/>' +
      '<path d="M0 ' + (y - 10) + ' Q70 ' + (y - 40) + ' 150 ' + (y - 18) + ' T300 ' + (y - 26) + ' T400 ' + (y - 20) + ' V240 H0 Z" fill="url(#' + U + 'haze)"/>' +
      '<path d="M0 ' + y + ' Q100 ' + (y - 18) + ' 200 ' + (y - 4) + ' T400 ' + (y - 8) + ' V240 H0 Z" fill="' + c2 + '"/>' +
      '<path d="M0 ' + y + ' Q100 ' + (y - 18) + ' 200 ' + (y - 4) + ' T400 ' + (y - 8) + ' V240 H0 Z" fill="url(#' + U + 'vf)"/>';
  }
  function ground(y, c) {
    return '<rect y="' + y + '" width="400" height="' + (240 - y) + '" fill="' + c + '"/><rect y="' + y + '" width="400" height="' + (240 - y) + '" fill="url(#' + U + 'vf)"/>' +
      '<path d="M0 ' + (y + 0.5) + ' H400" stroke="' + shade(c, -0.2) + '" stroke-width="1.4" opacity="0.6"/>';
  }
  function grass(y, n, c) {
    let s = '';
    for (let i = 0; i < n; i++) { const x = (i * 397 % 400) + 4, h = 4 + (i * 7 % 5); s += 'M' + x + ' ' + y + ' q-1 -' + h + ' -3 -' + (h + 2) + ' M' + x + ' ' + y + ' q1 -' + h + ' 3 -' + (h + 1) + ' '; }
    return '<path d="' + s + '" stroke="' + (c || '#5f8a44') + '" stroke-width="1.2" fill="none" opacity="0.7"/>';
  }
  function sea(y, c1, c2, rough) {
    const id = U + 'sea' + y;
    let w = '';
    for (let row = 0; row < 4; row++) {
      const yy = y + 12 + row * 18;
      let d = 'M-10 ' + yy;
      for (let x = -10; x < 410; x += 24) d += ' q6 ' + (rough ? -7 : -3) + ' 12 0 t12 0';
      w += '<path d="' + d + '" stroke="#fff" stroke-width="' + (rough ? 1.8 : 1.2) + '" fill="none" opacity="' + (0.5 - row * 0.08) + '"/>';
    }
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<rect y="' + y + '" width="400" height="' + (240 - y) + '" fill="url(#' + id + ')"/>' + w;
  }
  function mountain(x, y, w, h, c, snow) {
    return '<path d="M' + (x - w / 2) + ' ' + y + ' L' + (x - w * 0.08) + ' ' + (y - h) + ' Q' + x + ' ' + (y - h - 6) + ' ' + (x + w * 0.08) + ' ' + (y - h) + ' L' + (x + w / 2) + ' ' + y + ' Z" fill="' + c + '"/>' +
      '<path d="M' + x + ' ' + (y - h - 3) + ' L' + (x + w * 0.08) + ' ' + (y - h) + ' L' + (x + w / 2) + ' ' + y + ' L' + (x + w * 0.1) + ' ' + y + ' Z" fill="#2a1a0a" opacity="0.14"/>' +
      (snow ? '<path d="M' + (x - w * 0.08) + ' ' + (y - h) + ' Q' + x + ' ' + (y - h - 6) + ' ' + (x + w * 0.08) + ' ' + (y - h) + ' L' + (x + w * 0.16) + ' ' + (y - h * 0.8) + ' L' + (x + w * 0.05) + ' ' + (y - h * 0.84) + ' L' + (x - w * 0.04) + ' ' + (y - h * 0.78) + ' L' + (x - w * 0.16) + ' ' + (y - h * 0.82) + ' Z" fill="#fff" opacity="0.9"/>' : '') +
      '<path d="M' + (x - w / 2) + ' ' + y + ' L' + (x - w * 0.08) + ' ' + (y - h) + ' Q' + x + ' ' + (y - h - 6) + ' ' + (x + w * 0.08) + ' ' + (y - h) + ' L' + (x + w / 2) + ' ' + y + ' Z" fill="url(#' + U + 'haze)"/>';
  }
  function tree(x, y, k, c) {
    c = c || '#5f8f4a';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')"><ellipse cx="3" cy="0" rx="16" ry="3" fill="#2a1a0a" opacity="0.18"/>' +
      '<path d="M-2 0 Q-1 -16 -3 -26 M2 0 Q2 -14 4 -24" stroke="#7a5236" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<circle cx="-10" cy="-30" r="12" fill="' + c + '"/><circle cx="8" cy="-34" r="14" fill="' + shade(c, 0.08) + '"/><circle cx="0" cy="-44" r="12" fill="' + shade(c, 0.15) + '"/>' +
      '<circle cx="-4" cy="-48" r="5" fill="#fff" opacity="0.15"/><path d="M8 -22 a14 14 0 0 0 14 -10" stroke="#2a1a0a" stroke-width="3" fill="none" opacity="0.1"/></g>';
  }
  function palm(x, y, k) {
    let s = '<g transform="translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')"><path d="M0 0 Q4 -30 0 -58" stroke="#8a6440" stroke-width="5" fill="none"/>';
    [-150, -110, -70, -30, 10, -180].forEach(a => { const r = a * Math.PI / 180; s += '<path d="M0 -58 q' + f1(Math.cos(r) * 14) + ' ' + f1(Math.sin(r) * 10 - 6) + ' ' + f1(Math.cos(r) * 28) + ' ' + f1(Math.sin(r) * 16 + 8) + '" stroke="#4f8a3c" stroke-width="4.5" fill="none" stroke-linecap="round"/>'; });
    return s + '</g>';
  }

  // ── Figures ──
  // Storybook robed figure standing at (x, y=feet), height h.
  function person(x, y, h, o) {
    o = o || {};
    const robe = o.robe || '#c98a52', mantle = o.mantle, skin = o.skin || SKIN;
    const hw = h * 0.17, sw = h * 0.11, top = y - h * 0.64, hy = y - h * 0.8, hr = h * 0.095;
    const lw = Math.max(1, h * 0.022);
    let s = '<g>';
    s += '<ellipse cx="' + f1(x + 3) + '" cy="' + f1(y + 1) + '" rx="' + f1(h * 0.24) + '" ry="' + f1(h * 0.05) + '" fill="#2a1a0a" opacity="0.2"/>';
    if (o.wings) s += '<path d="M' + f1(x - sw) + ' ' + f1(top + h * 0.06) + ' C' + f1(x - h * 0.55) + ' ' + f1(top - h * 0.25) + ' ' + f1(x - h * 0.6) + ' ' + f1(top + h * 0.35) + ' ' + f1(x - h * 0.2) + ' ' + f1(top + h * 0.45) + ' Z M' + f1(x + sw) + ' ' + f1(top + h * 0.06) + ' C' + f1(x + h * 0.55) + ' ' + f1(top - h * 0.25) + ' ' + f1(x + h * 0.6) + ' ' + f1(top + h * 0.35) + ' ' + f1(x + h * 0.2) + ' ' + f1(top + h * 0.45) + ' Z" fill="#fbf8f0" stroke="#cbbf9f" stroke-width="' + lw + '"/>' +
      '<path d="M' + f1(x - h * 0.22) + ' ' + f1(top + h * 0.08) + ' q-' + f1(h * 0.12) + ' ' + f1(h * 0.08) + ' -' + f1(h * 0.2) + ' ' + f1(h * 0.24) + ' M' + f1(x + h * 0.22) + ' ' + f1(top + h * 0.08) + ' q' + f1(h * 0.12) + ' ' + f1(h * 0.08) + ' ' + f1(h * 0.2) + ' ' + f1(h * 0.24) + '" stroke="#ddd2b6" stroke-width="' + lw + '" fill="none"/>';
    if (o.halo) s += '<circle cx="' + f1(x) + '" cy="' + f1(hy) + '" r="' + f1(hr * 1.9) + '" fill="url(#' + U + 'glow)" opacity="0.9"/><circle cx="' + f1(x) + '" cy="' + f1(hy) + '" r="' + f1(hr * 1.55) + '" fill="none" stroke="#e0a72e" stroke-width="' + f1(lw * 1.3) + '"/>';
    // robe
    const robeD = 'M' + f1(x - hw) + ' ' + y + ' L' + f1(x - sw) + ' ' + f1(top) + ' Q' + f1(x) + ' ' + f1(top - h * 0.06) + ' ' + f1(x + sw) + ' ' + f1(top) + ' L' + f1(x + hw) + ' ' + y + ' Z';
    s += '<path d="' + robeD + '" fill="' + robe + '" stroke="' + INK + '" stroke-width="' + lw + '" stroke-linejoin="round"/>';
    if (o.stripes) { let st = ''; o.stripes.forEach((c, i) => { const yy = top + (i + 1) * (y - top) / (o.stripes.length + 1); const t = (yy - top) / (y - top); const half = sw + (hw - sw) * t; st += '<path d="M' + f1(x - half) + ' ' + f1(yy) + ' H' + f1(x + half) + '" stroke="' + c + '" stroke-width="' + f1(h * 0.06) + '"/>'; }); s += st; }
    s += '<path d="' + robeD + '" fill="url(#' + U + 'lit)"/>';
    s += '<path d="M' + f1(x - h * 0.03) + ' ' + f1(top + h * 0.1) + ' Q' + f1(x - h * 0.05) + ' ' + f1(y - h * 0.2) + ' ' + f1(x - h * 0.06) + ' ' + f1(y) + ' M' + f1(x + h * 0.05) + ' ' + f1(top + h * 0.16) + ' Q' + f1(x + h * 0.07) + ' ' + f1(y - h * 0.2) + ' ' + f1(x + h * 0.09) + ' ' + f1(y) + '" stroke="' + shade(robe, -0.35) + '" stroke-width="' + f1(lw * 0.8) + '" fill="none" opacity="0.6"/>';
    if (mantle) {
      const mD = 'M' + f1(x - sw - h * 0.01) + ' ' + f1(top + h * 0.02) + ' Q' + f1(x) + ' ' + f1(top - h * 0.05) + ' ' + f1(x + sw + h * 0.01) + ' ' + f1(top + h * 0.02) + ' L' + f1(x + hw * 0.9) + ' ' + f1(y - h * 0.18) + ' Q' + f1(x) + ' ' + f1(y - h * 0.32) + ' ' + f1(x - hw * 0.7) + ' ' + f1(y - h * 0.06) + ' Z';
      s += '<path d="' + mD + '" fill="' + mantle + '" stroke="' + INK + '" stroke-width="' + lw + '" stroke-linejoin="round"/><path d="' + mD + '" fill="url(#' + U + 'lit)"/>';
    }
    if (o.belt) s += '<path d="M' + f1(x - sw * 1.2) + ' ' + f1(top + h * 0.22) + ' Q' + f1(x) + ' ' + f1(top + h * 0.26) + ' ' + f1(x + sw * 1.2) + ' ' + f1(top + h * 0.22) + '" stroke="' + o.belt + '" stroke-width="' + f1(h * 0.03) + '" fill="none"/>';
    // arms
    const arm = (x1, y1, x2, y2) => '<path d="M' + f1(x1) + ' ' + f1(y1) + ' L' + f1(x2) + ' ' + f1(y2) + '" stroke="' + (mantle || robe) + '" stroke-width="' + f1(h * 0.07) + '" stroke-linecap="round"/>' +
      '<circle cx="' + f1(x2) + '" cy="' + f1(y2) + '" r="' + f1(h * 0.04) + '" fill="' + skin + '" stroke="' + INK + '" stroke-width="' + f1(lw * 0.7) + '"/>';
    const sy = top + h * 0.05;
    const A = o.arms || 'down';
    if (A === 'up') s += arm(x - sw, sy, x - h * 0.24, top - h * 0.18) + arm(x + sw, sy, x + h * 0.24, top - h * 0.18);
    else if (A === 'pray') s += arm(x - sw, sy, x - h * 0.01, top + h * 0.2) + arm(x + sw, sy, x + h * 0.01, top + h * 0.2);
    else if (A === 'out') s += arm(x - sw, sy, x - h * 0.06, top + h * 0.3) + arm(x + sw, sy, x + h * 0.3, top + h * 0.06);
    else if (A === 'outL') s += arm(x + sw, sy, x + h * 0.06, top + h * 0.3) + arm(x - sw, sy, x - h * 0.3, top + h * 0.06);
    else if (A === 'hold') s += arm(x - sw, sy, x - h * 0.06, top + h * 0.24) + arm(x + sw, sy, x + h * 0.06, top + h * 0.24);
    else if (A === 'wide') s += arm(x - sw, sy, x - h * 0.3, top + h * 0.1) + arm(x + sw, sy, x + h * 0.3, top + h * 0.1);
    else if (A === 'staff') s += '<path d="M' + f1(x + h * 0.22) + ' ' + f1(y) + ' L' + f1(x + h * 0.2) + ' ' + f1(top - h * 0.22) + (o.crook ? ' q0 -' + f1(h * 0.12) + ' -' + f1(h * 0.08) + ' -' + f1(h * 0.08) : '') + '" stroke="#7a5236" stroke-width="' + f1(h * 0.03) + '" fill="none" stroke-linecap="round"/>' + arm(x + sw, sy, x + h * 0.2, top + h * 0.12) + arm(x - sw, sy, x - h * 0.05, top + h * 0.3);
    else s += arm(x - sw, sy, x - hw * 0.9, top + h * 0.34) + arm(x + sw, sy, x + hw * 0.9, top + h * 0.34);
    // neck + head
    s += '<circle cx="' + f1(x) + '" cy="' + f1(hy) + '" r="' + f1(hr) + '" fill="' + skin + '" stroke="' + INK + '" stroke-width="' + lw + '"/>';
    const hair = o.hair || '#6b4a2e';
    if (o.head === 'veil') s += '<path d="M' + f1(x - hr * 1.25) + ' ' + f1(hy + hr * 1.6) + ' Q' + f1(x - hr * 1.5) + ' ' + f1(hy - hr * 1.5) + ' ' + f1(x) + ' ' + f1(hy - hr * 1.35) + ' Q' + f1(x + hr * 1.5) + ' ' + f1(hy - hr * 1.5) + ' ' + f1(x + hr * 1.25) + ' ' + f1(hy + hr * 1.6) + ' L' + f1(x + hr * 0.85) + ' ' + f1(hy + hr * 0.3) + ' Q' + f1(x) + ' ' + f1(hy - hr * 1.3) + ' ' + f1(x - hr * 0.85) + ' ' + f1(hy + hr * 0.3) + ' Z" fill="' + (o.veil || mantle || '#3b6fb6') + '" stroke="' + INK + '" stroke-width="' + lw + '"/>';
    else if (o.head === 'hood') s += '<path d="M' + f1(x - hr * 1.2) + ' ' + f1(hy + hr * 1.2) + ' Q' + f1(x - hr * 1.4) + ' ' + f1(hy - hr * 1.6) + ' ' + f1(x) + ' ' + f1(hy - hr * 1.4) + ' Q' + f1(x + hr * 1.4) + ' ' + f1(hy - hr * 1.6) + ' ' + f1(x + hr * 1.2) + ' ' + f1(hy + hr * 1.2) + ' L' + f1(x + hr * 0.8) + ' ' + f1(hy) + ' Q' + f1(x) + ' ' + f1(hy - hr * 1.2) + ' ' + f1(x - hr * 0.8) + ' ' + f1(hy) + ' Z" fill="' + (o.veil || shade(robe, -0.1)) + '" stroke="' + INK + '" stroke-width="' + lw + '"/>';
    else if (o.head !== 'bald') s += '<path d="M' + f1(x - hr * 1.02) + ' ' + f1(hy + hr * 0.2) + ' Q' + f1(x - hr * 1.1) + ' ' + f1(hy - hr * 1.25) + ' ' + f1(x) + ' ' + f1(hy - hr * 1.12) + ' Q' + f1(x + hr * 1.1) + ' ' + f1(hy - hr * 1.25) + ' ' + f1(x + hr * 1.02) + ' ' + f1(hy + hr * 0.2) + ' Q' + f1(x + hr * 0.6) + ' ' + f1(hy - hr * 0.6) + ' ' + f1(x) + ' ' + f1(hy - hr * 0.62) + ' Q' + f1(x - hr * 0.6) + ' ' + f1(hy - hr * 0.6) + ' ' + f1(x - hr * 1.02) + ' ' + f1(hy + hr * 0.2) + ' Z" fill="' + hair + '" stroke="' + INK + '" stroke-width="' + f1(lw * 0.8) + '"/>' +
      (o.long ? '<path d="M' + f1(x - hr * 1.0) + ' ' + f1(hy) + ' Q' + f1(x - hr * 1.3) + ' ' + f1(hy + hr * 1.4) + ' ' + f1(x - hr * 0.7) + ' ' + f1(hy + hr * 1.8) + ' M' + f1(x + hr * 1.0) + ' ' + f1(hy) + ' Q' + f1(x + hr * 1.3) + ' ' + f1(hy + hr * 1.4) + ' ' + f1(x + hr * 0.7) + ' ' + f1(hy + hr * 1.8) + '" stroke="' + hair + '" stroke-width="' + f1(hr * 0.5) + '" stroke-linecap="round" fill="none"/>' : '');
    if (o.beard) s += '<path d="M' + f1(x - hr * 0.9) + ' ' + f1(hy + hr * 0.1) + ' Q' + f1(x - hr * 0.8) + ' ' + f1(hy + hr * (o.beard === 'long' ? 2.4 : 1.6)) + ' ' + f1(x) + ' ' + f1(hy + hr * (o.beard === 'long' ? 2.6 : 1.7)) + ' Q' + f1(x + hr * 0.8) + ' ' + f1(hy + hr * (o.beard === 'long' ? 2.4 : 1.6)) + ' ' + f1(x + hr * 0.9) + ' ' + f1(hy + hr * 0.1) + ' Q' + f1(x) + ' ' + f1(hy + hr * 0.75) + ' ' + f1(x - hr * 0.9) + ' ' + f1(hy + hr * 0.1) + ' Z" fill="' + (o.beardC || hair) + '" stroke="' + INK + '" stroke-width="' + f1(lw * 0.7) + '"/>';
    if (o.crown) s += '<path d="M' + f1(x - hr * 0.85) + ' ' + f1(hy - hr * 0.8) + ' L' + f1(x - hr * 0.95) + ' ' + f1(hy - hr * 1.7) + ' L' + f1(x - hr * 0.45) + ' ' + f1(hy - hr * 1.2) + ' L' + f1(x) + ' ' + f1(hy - hr * 1.9) + ' L' + f1(x + hr * 0.45) + ' ' + f1(hy - hr * 1.2) + ' L' + f1(x + hr * 0.95) + ' ' + f1(hy - hr * 1.7) + ' L' + f1(x + hr * 0.85) + ' ' + f1(hy - hr * 0.8) + ' Z" fill="#f2c14a" stroke="#9a6d14" stroke-width="' + f1(lw * 0.8) + '"/>';
    if (o.helmet) s += '<path d="M' + f1(x - hr * 1.1) + ' ' + f1(hy) + ' Q' + f1(x - hr * 1.1) + ' ' + f1(hy - hr * 1.5) + ' ' + f1(x) + ' ' + f1(hy - hr * 1.5) + ' Q' + f1(x + hr * 1.1) + ' ' + f1(hy - hr * 1.5) + ' ' + f1(x + hr * 1.1) + ' ' + f1(hy) + ' Z" fill="#b9a46a" stroke="' + INK + '" stroke-width="' + lw + '"/><path d="M' + f1(x) + ' ' + f1(hy - hr * 1.5) + ' v' + f1(-hr * 0.8) + '" stroke="#b3122e" stroke-width="' + f1(hr * 0.5) + '"/>';
    // gentle face: closed-eye arcs or dot eyes
    if (!o.back) {
      const ey = hy - hr * 0.05, ex = hr * 0.38, er = Math.max(0.5, hr * 0.11);
      s += '<circle cx="' + f1(x - ex) + '" cy="' + f1(ey) + '" r="' + f1(er) + '" fill="#3a2a1e"/><circle cx="' + f1(x + ex) + '" cy="' + f1(ey) + '" r="' + f1(er) + '" fill="#3a2a1e"/>' +
        '<circle cx="' + f1(x - ex * 1.5) + '" cy="' + f1(hy + hr * 0.35) + '" r="' + f1(hr * 0.2) + '" fill="#e88a7a" opacity="0.35"/><circle cx="' + f1(x + ex * 1.5) + '" cy="' + f1(hy + hr * 0.35) + '" r="' + f1(hr * 0.2) + '" fill="#e88a7a" opacity="0.35"/>' +
        (o.beard ? '' : '<path d="M' + f1(x - hr * 0.25) + ' ' + f1(hy + hr * 0.45) + ' Q' + f1(x) + ' ' + f1(hy + hr * 0.62) + ' ' + f1(x + hr * 0.25) + ' ' + f1(hy + hr * 0.45) + '" stroke="#8a4a3a" stroke-width="' + f1(Math.max(0.6, lw * 0.6)) + '" fill="none" stroke-linecap="round"/>');
    }
    return s + '</g>';
  }
  // Presets for recurring people
  const JESUS = { robe: '#f6f1e6', mantle: '#b3263a', hair: '#6b4426', beard: 'short', long: true, halo: true };
  const MARY = { robe: '#f1dcd2', mantle: '#3b6fb6', head: 'veil', halo: true };
  const ANGEL = { robe: '#fbf8f0', hair: '#e0b25a', wings: true, halo: true, long: true };
  const crowd = (list) => list.map(p => person(p[0], p[1], p[2], p[3] || {})).join('');

  // ── Animals & props ──
  function sheep(x, y, k, flip) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -k : k) + ' ' + k + ')"><ellipse cx="2" cy="1" rx="13" ry="2.5" fill="#2a1a0a" opacity="0.18"/>' +
      '<path d="M-6 0 v-6 M6 0 v-6" stroke="#4a3a2a" stroke-width="2.4"/>' +
      '<ellipse cx="0" cy="-10" rx="12" ry="8" fill="#f8f5ec" stroke="' + INK + '" stroke-width="1"/>' +
      '<circle cx="-7" cy="-15" r="4.5" fill="#f8f5ec"/><circle cx="2" cy="-17" r="5" fill="#f8f5ec"/><circle cx="8" cy="-14" r="4.5" fill="#f8f5ec"/>' +
      '<ellipse cx="13" cy="-11" rx="4.4" ry="3.6" fill="#4a3a2a"/><circle cx="14.2" cy="-12" r="0.8" fill="#fff"/></g>';
  }
  function lion(x, y, k, flip, calm) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -k : k) + ' ' + k + ')"><ellipse cx="0" cy="1" rx="30" ry="4" fill="#2a1a0a" opacity="0.2"/>' +
      '<path d="M-26 0 Q-28 -18 -10 -20 L14 -20 Q24 -18 24 -6 L24 0" fill="#d9a04a" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<path d="M-26 -12 q-12 -2 -10 -14" stroke="#d9a04a" stroke-width="3" fill="none"/><circle cx="-36" cy="-26" r="3" fill="#a8702a"/>' +
      '<path d="M-20 0 v-4 M-10 0 v-4 M12 0 v-4 M22 0 v-4" stroke="' + INK + '" stroke-width="1"/>' +
      '<circle cx="22" cy="-22" r="14" fill="#b8742e" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<circle cx="24" cy="-21" r="8.5" fill="#e2b062" stroke="' + INK + '" stroke-width="1"/>' +
      (calm ? '<path d="M20 -23 q2 1.6 4 0 M26 -23 q2 1.6 4 0" stroke="#3a2a1e" stroke-width="1" fill="none"/>' : '<circle cx="22" cy="-23" r="1.1" fill="#3a2a1e"/><circle cx="27" cy="-23" r="1.1" fill="#3a2a1e"/>') +
      '<path d="M24 -19 l-1.6 2 h3.2 Z" fill="#7a4a2a"/><path d="M22 -15 q2 1.4 4.4 0" stroke="#7a4a2a" stroke-width="0.9" fill="none"/></g>';
  }
  function dove(x, y, k, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ') rotate(' + (rot || 0) + ')">' +
      '<path d="M-14 0 C-8 -4 4 -4 10 -1 L16 -3 L13 1 C8 6 -6 6 -14 0 Z" fill="#fff" stroke="#c9bfa8" stroke-width="0.9"/>' +
      '<path d="M-4 -2 C-6 -14 2 -20 10 -18 C6 -12 4 -6 2 -2 Z" fill="#fff" stroke="#c9bfa8" stroke-width="0.9"/>' +
      '<path d="M-2 0 C-10 -8 -16 -10 -20 -6 C-14 -4 -8 -2 -4 2 Z" fill="#f4f1ea" stroke="#c9bfa8" stroke-width="0.9"/>' +
      '<circle cx="11" cy="-2" r="0.9" fill="#3a2a1e"/></g>';
  }
  function bird(x, y, k) { return '<path d="M' + x + ' ' + y + ' q' + (4 * k) + ' -' + (4 * k) + ' ' + (8 * k) + ' 0 q' + (4 * k) + ' -' + (4 * k) + ' ' + (8 * k) + ' 0" stroke="#3a3a4a" stroke-width="' + (1.2 * k) + '" fill="none"/>'; }
  function fish(x, y, k, c, flip) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -k : k) + ' ' + k + ')"><path d="M-10 0 Q0 -7 10 0 Q0 7 -10 0 Z M-10 0 L-16 -5 L-15 0 L-16 5 Z" fill="' + (c || '#8aa6c0') + '" stroke="' + INK + '" stroke-width="0.8"/><circle cx="5" cy="-1" r="1" fill="#2a2a2a"/></g>';
  }
  function bread(x, y, k) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><ellipse cx="0" cy="0" rx="10" ry="6" fill="#d9a35c" stroke="#8a5a22" stroke-width="1"/><path d="M-5 -3 l2 4 M0 -4 l1.5 4 M5 -3 l1 4" stroke="#b07a38" stroke-width="1"/><ellipse cx="-3" cy="-3" rx="4" ry="1.6" fill="#f2cf8e" opacity="0.6"/></g>';
  }
  function basket(x, y, k, contents) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><ellipse cx="2" cy="1" rx="22" ry="3.5" fill="#2a1a0a" opacity="0.2"/>' + (contents || '') +
      '<path d="M-20 -14 L-15 0 H15 L20 -14 Z" fill="#c08a4a" stroke="#7a5228" stroke-width="1.2"/>' +
      '<path d="M-18 -9 H18 M-16 -4 H16 M-10 -14 L-8 0 M0 -14 V0 M10 -14 L8 0" stroke="#8a5e2e" stroke-width="0.9"/><ellipse cx="0" cy="-14" rx="20" ry="3" fill="#d8a462" stroke="#7a5228" stroke-width="1"/></g>';
  }
  function jar(x, y, k, wine) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><ellipse cx="2" cy="1" rx="12" ry="2.5" fill="#2a1a0a" opacity="0.2"/>' +
      '<path d="M-7 -30 H7 L6 -26 Q14 -20 12 -8 Q10 0 0 0 Q-10 0 -12 -8 Q-14 -20 -6 -26 Z" fill="#cbbfae" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M-8 -18 Q0 -15 8 -18" stroke="#a89a86" stroke-width="1" fill="none"/><path d="M-9 -14 q-3 -8 1 -12" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.5"/>' +
      (wine ? '<ellipse cx="0" cy="-29" rx="6" ry="1.6" fill="#7a1a3a"/>' : '<ellipse cx="0" cy="-29" rx="6" ry="1.6" fill="#8ab8dc"/>') + '</g>';
  }
  function tent(x, y, k, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-30 0 L0 -32 L30 0 Z" fill="' + (c || '#d9c09a') + '" stroke="' + INK + '" stroke-width="1"/><path d="M0 -32 L10 0 H-6 Z" fill="#7a5a3a" opacity="0.6"/><path d="M0 -32 L30 0" stroke="#fff" stroke-width="1" opacity="0.3"/></g>';
  }
  function house(x, y, k, c) {
    c = c || '#e8d6b4';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-24 1 H40 L30 -4 H-22 Z" fill="#2a1a0a" opacity="0.15"/>' +
      '<path d="M22 0 V-30 L30 -34 V-4 Z" fill="' + shade(c, -0.2) + '"/><rect x="-22" y="-30" width="44" height="30" fill="' + c + '" stroke="' + INK + '" stroke-width="1"/><rect x="-22" y="-30" width="44" height="30" fill="url(#' + U + 'lit)"/>' +
      '<rect x="-24" y="-33" width="48" height="4" fill="' + shade(c, -0.1) + '" stroke="' + INK + '" stroke-width="0.8"/>' +
      '<path d="M-6 0 V-14 a6 6 0 0 1 12 0 V0 Z" fill="#6a4a2e"/><rect x="-17" y="-24" width="7" height="7" fill="#5a4a3a"/><rect x="10" y="-24" width="7" height="7" fill="#5a4a3a"/></g>';
  }
  function scroll(x, y, k, open) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
      '<rect x="-24" y="-14" width="48" height="28" fill="#f4e7c8" stroke="#9a7a4a" stroke-width="1"/>' +
      '<path d="M-16 -6 H16 M-16 0 H14 M-16 6 H10" stroke="#9a7a4a" stroke-width="1.2" opacity="0.7"/>' +
      '<rect x="-29" y="-17" width="7" height="34" rx="3.5" fill="#c9a46a" stroke="#7a5a2a" stroke-width="1"/><rect x="22" y="-17" width="7" height="34" rx="3.5" fill="#c9a46a" stroke="#7a5a2a" stroke-width="1"/></g>';
  }
  function tablets(x, y, k) {
    const t = (dx) => '<path d="M' + (dx - 11) + ' 0 V-26 A11 11 0 0 1 ' + (dx + 11) + ' -26 V0 Z" fill="#c9c2b4" stroke="' + INK + '" stroke-width="1.2"/><path d="M' + (dx - 6) + ' -24 H' + (dx + 6) + ' M' + (dx - 6) + ' -18 H' + (dx + 6) + ' M' + (dx - 6) + ' -12 H' + (dx + 6) + ' M' + (dx - 6) + ' -6 H' + (dx + 4) + '" stroke="#7a7060" stroke-width="1.2"/>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' + t(-12) + t(12) + '</g>';
  }
  function boat(x, y, k, o) {
    o = o || {};
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
      '<path d="M-44 -14 Q-40 6 -20 8 H22 Q42 6 46 -14 Z" fill="' + (o.hull || '#8a5a32') + '" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<path d="M-42 -8 Q0 -4 44 -8" stroke="' + shade(o.hull || '#8a5a32', -0.3) + '" stroke-width="1.2" fill="none"/><path d="M-40 -14 H44" stroke="#c99a62" stroke-width="2"/>' +
      (o.sail ? '<path d="M0 -14 V-74" stroke="#5a3a20" stroke-width="2.4"/><path d="M2 -72 Q28 -44 30 -20 H2 Z" fill="#f4ecd8" stroke="#9a8a6a" stroke-width="1"/><path d="M-2 -66 Q-22 -42 -22 -20 H-2 Z" fill="#ebe0c6" stroke="#9a8a6a" stroke-width="1"/>' : '') +
      '</g>';
  }

  // ── Scenes ────────────────────────────────────────────────────
  const SCENES = {
    creation: () => sky('dawn') + sun(300, 70, 26, '#fff1b0') + rays(300, 70, 22, 200, '#fff6d8', 0.25) +
      '<circle cx="86" cy="56" r="16" fill="#f4efd8" opacity="0.85"/>' + stars(10, 3, 80) +
      sea(160, '#4f8fc4', '#2f5f96') +
      '<path d="M0 150 Q60 124 130 140 T250 150 Q270 170 262 240 H0 Z" fill="#86b46a"/><path d="M0 150 Q60 124 130 140 T250 150 Q270 170 262 240 H0 Z" fill="url(#' + U + 'haze)"/>' +
      '<path d="M0 182 Q90 166 200 180 Q250 190 300 240 H0 Z" fill="#6aa050"/><path d="M0 182 Q90 166 200 180 Q250 190 300 240 H0 Z" fill="url(#' + U + 'vf)"/>' +
      tree(70, 196, 1.1, '#4f8a3c') + tree(340, 190, 0.9, '#5f9a44') + palm(118, 196, 0.8) +
      sheep(170, 214, 1.1) + sheep(196, 218, 0.9, true) + lion(236, 214, 0.9, true, true) +
      fish(330, 196, 1.2, '#e0a050') + fish(360, 214, 1, '#8ac0e0', true) + fish(300, 222, 0.9, '#f0c060') + bird(150, 70, 1.4) + bird(176, 84, 1) + bird(210, 60, 1.2) +
      grass(232, 30, '#3f7a34'),
    noah: () => sky('day') + clouds([[60, 50, 1], [300, 40, 1.2]], '#fdfdfd') +
      '<g opacity="0.85">' + ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#5e35b1'].map((c, i) => '<path d="M40 190 A170 150 0 0 1 380 190" stroke="' + c + '" stroke-width="7" fill="none" transform="translate(0 ' + (i * 7) + ') scale(1 ' + (1 - i * 0.02) + ')"/>').join('') + '</g>' +
      mountain(330, 196, 160, 60, '#8aa070') + sea(186, '#5f9fd0', '#2f6aa0') +
      '<g transform="translate(180 196)"><path d="M-80 -14 Q-74 12 -40 14 H48 Q80 12 86 -14 Z" fill="#8a5a32" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<path d="M-78 -6 H84 M-76 2 H80" stroke="#6a4224" stroke-width="1.2"/>' +
      '<rect x="-46" y="-44" width="86" height="30" fill="#b07a48" stroke="' + INK + '" stroke-width="1.2"/><path d="M-52 -44 L-4 -66 L46 -44 Z" fill="#7a4a2a" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<rect x="-30" y="-36" width="12" height="10" fill="#4a3020"/><rect x="18" y="-36" width="12" height="10" fill="#4a3020"/>' +
      '</g>' +
      // a giraffe looking out of the roof, pairs of animals on deck
      '<g transform="translate(150 152)"><path d="M0 0 C0 -14 2 -26 8 -36" stroke="#e0b25a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 -6 l3 -1 M2 -18 l3 -1 M5 -28 l3 -1" stroke="#a8702a" stroke-width="2"/>' +
      '<ellipse cx="12" cy="-38" rx="7" ry="4.5" fill="#e0b25a" stroke="' + INK + '" stroke-width="0.9"/><path d="M8 -42 v-5 M11 -42 v-5" stroke="' + INK + '" stroke-width="1.4"/><circle cx="13" cy="-39" r="0.9" fill="' + INK + '"/></g>' +
      sheep(110, 182, 0.55) + sheep(124, 183, 0.5, true) + lion(246, 183, 0.42, true, true) + lion(262, 183, 0.38, true, true) +
      dove(300, 90, 1.2, -10) + '<path d="M312 88 q6 -2 8 -6" stroke="#4f8a3c" stroke-width="2" fill="none"/>',
    abraham: () => sky('night') + stars(90, 11, 170, true) + moon(330, 50, 14) +
      hills(196, '#3b4466', '#4a4a5a') + tent(110, 206, 1.3, '#c9b08a') + tent(160, 210, 0.9, '#b9a07a') +
      person(250, 214, 64, { robe: '#a8845a', mantle: '#6a4a8a', hair: '#e0dcd2', beard: 'long', arms: 'up', back: false }) +
      sheep(60, 222, 0.8) + sheep(80, 226, 0.7, true) + palm(350, 214, 0.9),
    moses: () => sky('dawn') + sun(200, 60, 20) + rays(200, 60, 16, 160, '#fff3c4', 0.2) +
      '<rect y="130" width="400" height="110" fill="#d9c49a"/>' +
      '<path d="M0 120 Q60 110 120 120 L150 240 H0 Z" fill="#3f86c0"/><path d="M400 120 Q340 110 280 120 L250 240 H400 Z" fill="#3f86c0"/>' +
      '<path d="M120 120 Q130 170 150 240 M280 120 Q270 170 250 240" stroke="#bfe4f6" stroke-width="4" fill="none" opacity="0.8"/>' +
      '<path d="M0 140 q20 -6 40 0 t40 0 t40 0 M280 140 q20 -6 40 0 t40 0 t40 0 M0 170 q20 -6 40 0 t40 0 t40 0 M290 170 q20 -6 40 0 t40 0 t40 0" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.5"/>' +
      '<path d="M0 120 Q60 110 120 120 L150 240 H0 Z" fill="url(#' + U + 'lit)"/>' +
      '<rect y="130" width="400" height="110" fill="url(#' + U + 'vf)" opacity="0.5"/>' +
      crowd([[176, 176, 30, { robe: '#b88a5a', hair: '#4a3424' }], [196, 168, 26, { robe: '#7a8a5a', head: 'veil', veil: '#c9a46a' }], [214, 174, 28, { robe: '#a85a4a' }], [230, 166, 24, { robe: '#5a7aa0', head: 'veil', veil: '#e0d0b0' }]]) +
      person(200, 222, 62, { robe: '#c9a06a', mantle: '#8e2a2a', hair: '#e0dcd2', beard: 'long', arms: 'staff', crook: true }),
    david: () => sky('day') + clouds([[80, 46, 1], [320, 60, 0.8]]) + hills(178, '#a8b87a', '#c9b47a') + grass(236, 40, '#7a8a44') +
      person(110, 222, 56, { robe: '#d9b47a', belt: '#7a4a2a', hair: '#8a4a26', arms: 'up' }) +
      '<path d="M96 148 q-14 -20 -6 -30" stroke="#7a5236" stroke-width="1.6" fill="none"/><circle cx="90" cy="117" r="3.5" fill="#8a8a8a" stroke="' + INK + '" stroke-width="0.8"/>' +
      sheep(48, 226, 0.8) +
      person(290, 228, 150, { robe: '#7a6a4a', mantle: '#5a5f6a', hair: '#3a2a1e', beard: 'short', helmet: true, arms: 'staff' }) +
      '<path d="M320 100 l-6 -2 l6 -22 l6 22 Z" fill="#b9bec8" stroke="' + INK + '" stroke-width="1"/>' +
      '<ellipse cx="258" cy="168" rx="16" ry="22" fill="#b9a46a" stroke="' + INK + '" stroke-width="1.4"/><circle cx="258" cy="168" r="5" fill="#8a7a4a"/>',
    solomon: () => sky('gold') + '<rect width="400" height="240" fill="#e9d4a8"/>' +
      [60, 120, 280, 340].map(x => '<rect x="' + (x - 9) + '" y="40" width="18" height="170" fill="#efe2c4" stroke="#b9a47a" stroke-width="1"/><rect x="' + (x - 9) + '" y="40" width="18" height="170" fill="url(#' + U + 'lit)"/><rect x="' + (x - 13) + '" y="34" width="26" height="8" fill="#d9c49a"/><rect x="' + (x - 13) + '" y="206" width="26" height="8" fill="#d9c49a"/>').join('') +
      '<path d="M0 214 H400 V240 H0 Z" fill="#b98a5a"/><rect y="214" width="400" height="26" fill="url(#' + U + 'vf)"/>' +
      '<path d="M150 214 V120 Q200 96 250 120 V214 Z" fill="#8e1022" stroke="' + INK + '" stroke-width="1.2"/><path d="M160 214 V128 Q200 108 240 128 V214" fill="none" stroke="#f2c14a" stroke-width="3"/>' +
      '<rect x="168" y="182" width="64" height="12" fill="#c99a2a" stroke="' + INK + '" stroke-width="1"/>' +
      person(200, 206, 70, { robe: '#f2e6c8', mantle: '#6a2c91', hair: '#4a3020', beard: 'short', crown: true, arms: 'hold' }) +
      lion(140, 214, 0.5, false, true) + lion(260, 214, 0.5, true, true),
    daniel: () => sky('night') + '<rect width="400" height="240" fill="#5a4a3a"/>' +
      '<path d="M0 0 H400 V60 Q200 30 0 60 Z" fill="#3a2e26"/><circle cx="200" cy="30" r="30" fill="#3b5a9a"/><circle cx="214" cy="22" r="7" fill="#f4efd8"/><path d="M180 6 V56 M200 0 V60 M220 6 V56" stroke="#2a2018" stroke-width="3"/><circle cx="200" cy="30" r="30" fill="none" stroke="#2a2018" stroke-width="6"/>' +
      rays(200, 40, 14, 220, '#fff3c4', 0.18) +
      '<rect y="200" width="400" height="40" fill="#7a6650"/><rect y="200" width="400" height="40" fill="url(#' + U + 'vf)"/>' +
      '<path d="M0 60 Q40 120 20 200 M400 60 Q360 120 380 200" stroke="#3a2e26" stroke-width="40" fill="none"/>' +
      person(200, 214, 66, { robe: '#d9c4a0', mantle: '#4a6a9a', hair: '#3a2a1e', beard: 'short', arms: 'pray' }) +
      person(250, 150, 56, Object.assign({}, ANGEL, { arms: 'wide' })) +
      lion(108, 218, 0.95, false, true) + lion(310, 220, 0.9, true, true) + lion(70, 200, 0.6, false, true),
    jonah: () => sky('storm') + clouds([[80, 40, 1.4], [200, 30, 1.6], [330, 46, 1.3]], '#8a96a8') +
      '<path d="M120 20 l-10 30 h10 l-8 26" stroke="#fff3c4" stroke-width="2.4" fill="none"/>' +
      sea(120, '#3f6f96', '#1f3f66', true) + boat(300, 132, 0.8, { sail: true }) +
      '<g transform="translate(250 186) scale(0.85)"><path d="M-110 10 C-80 -40 40 -50 90 -10 C100 0 104 6 120 -8 L114 12 L124 30 C108 18 100 22 90 28 C40 60 -80 50 -110 10 Z" fill="#5a7a9a" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<path d="M-100 16 C-60 36 30 40 80 24" stroke="#c9d6e0" stroke-width="8" fill="none" opacity="0.6"/><circle cx="-80" cy="-4" r="3" fill="#1a2a3a"/><path d="M-110 10 Q-96 14 -86 10" stroke="' + INK + '" stroke-width="1.4" fill="none"/>' +
      '<path d="M-60 -34 q-6 -14 4 -22 M-56 -34 q4 -16 16 -18" stroke="#bfe4f6" stroke-width="2.4" fill="none"/></g>' +
      '<path d="M0 196 Q60 180 130 196 Q150 210 150 240 H0 Z" fill="#e2cc96"/><path d="M0 196 Q60 180 130 196 Q150 210 150 240 H0 Z" fill="url(#' + U + 'vf)"/>' +
      person(64, 226, 52, { robe: '#c9a06a', hair: '#4a3020', beard: 'short', arms: 'up' }),
    prophets: () => sky('soft') + hills(186, '#b9a87a', '#d9c49a') +
      '<g transform="translate(76 190)">' + '<path d="M-40 0 V-80 H40 V0 Z" fill="#e8d6b4" stroke="' + INK + '" stroke-width="1"/><path d="M-40 -80 L0 -98 L40 -80" fill="#c9a46a" stroke="' + INK + '" stroke-width="1"/><path d="M-10 0 V-26 a10 10 0 0 1 20 0 V0" fill="#6a4a2e"/></g>' +
      person(190, 222, 72, { robe: '#a8845a', mantle: '#4a6a3a', hair: '#d8d2c6', beard: 'long', arms: 'out' }) +
      scroll(290, 168, 1.6) + '<path d="M318 150 C330 130 344 120 352 112" stroke="#f4f1ea" stroke-width="4" stroke-linecap="round"/>' +
      person(350, 226, 44, { robe: '#7a5a8a', hair: '#3a2a1e', beard: 'short', arms: 'pray' }),
    annunciation: () => sky('gold') + '<rect width="400" height="240" fill="#f0e2c4"/>' +
      '<path d="M40 210 V60 Q120 20 200 60 V210" fill="#dcc79c" stroke="#b9a47a" stroke-width="2"/><path d="M60 210 V70 Q120 40 180 70 V210 Z" fill="#bcd6ee"/>' + clouds([[100, 120, 0.8]]) +
      rays(320, 30, 14, 200, '#fff3c4', 0.35) + dove(320, 46, 1, 30) +
      '<rect y="210" width="400" height="30" fill="#b98a5a"/><rect y="210" width="400" height="30" fill="url(#' + U + 'vf)"/>' +
      person(120, 222, 76, Object.assign({}, ANGEL, { arms: 'out', robe: '#f8f4ea', mantle: '#e8c46a' })) +
      person(272, 222, 70, Object.assign({}, MARY, { arms: 'pray' })) +
      '<g transform="translate(200 214)"><path d="M-10 0 Q-12 -16 -4 -20 H4 Q12 -16 10 0 Z" fill="#7d9fd0" stroke="' + INK + '" stroke-width="1"/><path d="M0 -20 V-64" stroke="#3f8a4a" stroke-width="2"/>' +
      [[-1, -66], [6, -54], [-6, -48]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' l-5 -6 l5 2 l5 -2 Z" fill="#fff" stroke="#c9bfa8" stroke-width="0.6"/>').join('') + '</g>',
    nativity: () => sky('night') + stars(70, 4, 120, true) + star8(300, 40, 14) + '<path d="M300 54 L250 150" stroke="#fff6c8" stroke-width="10" opacity="0.12"/>' +
      hills(188, '#2f3b5c', '#4a4a3a') +
      '<g transform="translate(200 214)"><path d="M-110 0 V-90 L0 -130 L110 -90 V0" fill="#6a4a30" stroke="' + INK + '" stroke-width="1.4"/><path d="M-96 0 V-84 L0 -118 L96 -84 V0 Z" fill="#3a2a1c"/>' +
      '<path d="M-118 -88 L0 -136 L118 -88" stroke="#8a6a40" stroke-width="8" fill="none"/>' +
      '<circle cx="0" cy="-40" r="70" fill="url(#' + U + 'glow)" opacity="0.6"/></g>' +
      '<g transform="translate(200 210)"><path d="M-26 0 L-20 -16 H20 L26 0 Z" fill="#9a6a3a" stroke="' + INK + '" stroke-width="1"/><path d="M-22 -16 Q0 -22 22 -16" fill="#e8c46a"/>' +
      '<ellipse cx="0" cy="-20" rx="12" ry="6" fill="#f8f4ea" stroke="#c9bfa8" stroke-width="0.8"/><circle cx="-8" cy="-22" r="4.5" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="0.6"/><circle cx="-8" cy="-22" r="8" fill="none" stroke="#e0a72e" stroke-width="1.2"/></g>' +
      person(150, 216, 64, Object.assign({}, MARY, { arms: 'pray' })) +
      person(252, 216, 70, { robe: '#a8845a', mantle: '#c98a28', hair: '#5b3b22', beard: 'short', halo: true, arms: 'staff' }) +
      sheep(70, 222, 0.9) + person(40, 224, 50, { robe: '#b9a07a', head: 'hood', veil: '#8a6a4a', beard: 'short', arms: 'staff', crook: true }) + sheep(340, 224, 0.8, true) +
      '<g transform="translate(330 196) scale(0.9)"><ellipse cx="0" cy="-8" rx="16" ry="9" fill="#8a7a6a" stroke="' + INK + '" stroke-width="1"/><path d="M14 -12 q10 -8 12 -20" stroke="#8a7a6a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-10 0 v6 M10 0 v6" stroke="' + INK + '" stroke-width="2"/></g>',
    baptism: () => sky('day') + rays(200, 0, 20, 160, '#fff6d8', 0.4) + dove(200, 40, 1.4) + clouds([[90, 40, 1], [320, 30, 1]]) +
      hills(170, '#9ab87a', '#86a86a') + palm(40, 176, 0.9) + palm(366, 172, 1) +
      sea(176, '#5fa6d0', '#3f7fae') +
      person(230, 212, 64, Object.assign({}, JESUS, { mantle: null, robe: '#f6f1e6', arms: 'pray' })) +
      '<path d="M190 212 Q230 200 270 212" stroke="#5fa6d0" stroke-width="10" fill="none" opacity="0.9"/>' +
      person(164, 206, 62, { robe: '#a8845a', mantle: '#7a5a3a', hair: '#4a3020', beard: 'short', long: true, arms: 'out' }) +
      '<path d="M199 148 q4 6 2 12 M203 152 q3 6 -1 12" stroke="#bfe4f6" stroke-width="2" fill="none"/>',
    sermon: () => sky('day') + clouds([[60, 40, 1], [330, 52, 0.9]]) +
      mountain(200, 210, 380, 120, '#8fb06a') + '<path d="M0 210 H400 V240 H0 Z" fill="#7aa058"/>' + grass(238, 40, '#4f7a34') +
      person(200, 108, 50, Object.assign({}, JESUS, { arms: 'wide' })) +
      crowd([[70, 210, 34, { robe: '#b88a5a', hair: '#4a3424' }], [100, 196, 30, { robe: '#7a8a5a', head: 'veil', veil: '#c9a46a' }], [130, 214, 34, { robe: '#a85a4a' }], [160, 190, 28, { robe: '#5a7aa0', head: 'veil', veil: '#e0d0b0' }],
        [240, 192, 28, { robe: '#c9a06a' }], [270, 212, 34, { robe: '#6a7a9a', head: 'veil', veil: '#d9c49a' }], [300, 198, 30, { robe: '#8a5a7a' }], [330, 214, 34, { robe: '#a8845a', beard: 'short' }], [214, 216, 26, { robe: '#e0b06a' }]]),
    passion: () => sky('dawn') + sun(300, 120, 22) + rays(300, 120, 22, 260, '#fff3c4', 0.28) +
      '<path d="M40 120 l0 -36 M30 96 h20 M70 118 l0 -30 M62 98 h16 M100 120 l0 -36 M90 96 h20" stroke="#6a5a5a" stroke-width="3" opacity="0.55"/>' +
      '<path d="M0 124 Q70 100 140 122 L160 240 H0 Z" fill="#a89a7a" opacity="0.7"/>' +
      hills(190, '#a8b07a', '#8aa060') +
      '<g transform="translate(250 210)"><path d="M-80 0 C-80 -70 -40 -100 10 -100 C60 -100 90 -70 90 0 Z" fill="#a89e8e" stroke="' + INK + '" stroke-width="1.4"/><path d="M-80 0 C-80 -70 -40 -100 10 -100 C60 -100 90 -70 90 0 Z" fill="url(#' + U + 'lit)"/>' +
      '<path d="M-24 0 V-44 A22 22 0 0 1 20 -44 V0 Z" fill="#2e2622"/><circle cx="-2" cy="-24" r="40" fill="url(#' + U + 'glow)" opacity="0.6"/>' +
      '<circle cx="54" cy="-20" r="22" fill="#9a9080" stroke="' + INK + '" stroke-width="1.4"/><path d="M40 -30 q14 -6 26 4" stroke="#bab0a0" stroke-width="2" fill="none"/></g>' +
      '<g transform="translate(244 206)"><path d="M-14 0 Q-16 -6 -8 -8 H14 Q20 -6 18 0 Z" fill="#f8f4ea" stroke="#c9bfa8" stroke-width="0.8"/></g>' +
      '<g fill="#fbf8f0">' + [[130, 222], [150, 228], [330, 226]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' l-5 -6 l5 2 l5 -2 Z" stroke="#c9bfa8" stroke-width="0.6"/>').join('') + '</g>',
    pentecost: () => '<rect width="400" height="240" fill="#e8d6b4"/><rect y="200" width="400" height="40" fill="#b98a5a"/><rect y="200" width="400" height="40" fill="url(#' + U + 'vf)"/>' +
      '<path d="M140 30 H260 V110 H140 Z" fill="#bcd6ee" stroke="#b9a47a" stroke-width="6"/>' + rays(200, 40, 18, 220, '#fff3c4', 0.3) + dove(200, 50, 1.1) +
      '<path d="M20 80 q60 -20 120 0 M260 70 q60 -20 120 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.5"/>' +
      (() => {
        const P = [[60, 212, 54, { robe: '#a85a4a', beard: 'short' }], [110, 206, 58, { robe: '#5a7aa0', beard: 'short', hair: '#e0dcd2' }], [160, 214, 56, { robe: '#7a8a5a' }], [200, 210, 60, Object.assign({}, MARY, { arms: 'pray' })], [240, 214, 56, { robe: '#c9a06a', beard: 'short' }], [290, 206, 58, { robe: '#8a5a7a', beard: 'short' }], [340, 212, 54, { robe: '#6a7a9a' }]];
        return P.map(p => person(p[0], p[1], p[2], Object.assign({ arms: 'up' }, p[3]))).join('') +
          P.map(p => { const y = p[1] - p[2] * 0.8 - p[2] * 0.22; return '<path d="M' + p[0] + ' ' + (y + 6) + ' C' + (p[0] - 6) + ' ' + (y - 2) + ' ' + (p[0] + 2) + ' ' + (y - 6) + ' ' + p[0] + ' ' + (y - 14) + ' C' + (p[0] + 8) + ' ' + (y - 6) + ' ' + (p[0] + 6) + ' ' + y + ' ' + p[0] + ' ' + (y + 6) + ' Z" fill="#f59e0b" stroke="#d9480f" stroke-width="0.8"/><path d="M' + p[0] + ' ' + (y + 4) + ' c-2 -3 0 -6 0 -9 c2 3 3 6 0 9 Z" fill="#fde68a"/>'; }).join('');
      })(),
    joseph: () => sky('day') + clouds([[70, 44, 1], [300, 36, 1.1]]) + '<path d="M0 150 Q100 130 200 146 T400 140 V240 H0 Z" fill="#e0c494"/>' + ground(196, '#d9b47a') +
      '<path d="M300 150 L330 104 L360 150 Z M330 150 L352 118 L376 150 Z" fill="#d9b47a" stroke="#b08a4a" stroke-width="1"/>' +
      person(190, 222, 80, { robe: '#e8d6b4', stripes: ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'], hair: '#5a3a20', arms: 'wide' }) +
      person(90, 220, 64, { robe: '#a8845a', mantle: '#6a4a8a', hair: '#e0dcd2', beard: 'long', arms: 'out', head: 'hood', veil: '#8a6a4a' }) +
      sheep(290, 222, 0.9) + sheep(320, 226, 0.8, true) + palm(370, 210, 0.9),
    joshua: () => sky('dawn') + sun(320, 60, 18) + ground(186, '#d9bf8a') +
      '<g transform="translate(220 186)"><path d="M-100 0 V-70 H100 V0 Z" fill="#c9a87a" stroke="' + INK + '" stroke-width="1.2"/>' +
      '<path d="M-100 -70 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h14 v10 h14 v-10 h16 v10" fill="none" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M-100 -50 H100 M-100 -30 H100 M-100 -10 H100 M-80 -70 V-50 M-40 -50 V-30 M0 -70 V-50 M40 -50 V-30 M60 -30 V-10 M-60 -30 V-10" stroke="#a8875a" stroke-width="1"/>' +
      '<path d="M-20 -70 L-10 -40 L-30 -20 L-6 0 M30 -60 L20 -36 L40 -14" stroke="#4a3020" stroke-width="2" fill="none"/>' +
      '<g fill="#c9a87a" stroke="' + INK + '" stroke-width="1"><rect x="-30" y="-96" width="16" height="12" transform="rotate(-20 -22 -90)"/><rect x="10" y="-88" width="14" height="10" transform="rotate(25 17 -83)"/><rect x="36" y="-100" width="12" height="9" transform="rotate(-35 42 -95)"/></g></g>' +
      '<path d="M120 100 q4 -10 2 -20 M300 96 q-2 -10 2 -20" stroke="#a8875a" stroke-width="2" fill="none" opacity="0.7"/>' +
      [60, 110, 160].map((x, i) => person(x, 222 + (i % 2) * 6, 50, { robe: ['#f4f1ea', '#d9c4a0', '#f4f1ea'][i], mantle: ['#5a7aa0', null, '#8e2a2a'][i], hair: '#4a3020', beard: 'short', arms: 'out' }) +
        '<path d="M' + (x + 14) + ' ' + (222 + (i % 2) * 6 - 38) + ' q12 -4 18 -14 l4 3 q-6 10 -18 15 Z" fill="#e8d4a8" stroke="' + INK + '" stroke-width="0.8"/>').join('') +
      person(250, 228, 46, { robe: '#a8845a', mantle: '#4a6a3a', beard: 'short', arms: 'up' }),
    ruth: () => sky('gold') + sun(80, 60, 18) + '<rect y="130" width="400" height="110" fill="#e8c66a"/>' +
      (() => { let s = ''; for (let r = 0; r < 6; r++) for (let i = 0; i < 26; i++) { const x = i * 16 + (r % 2) * 8, y = 140 + r * 18; s += '<path d="M' + x + ' ' + (y + 12) + ' q1 -8 0 -14" stroke="#b9862a" stroke-width="1.4" fill="none"/><ellipse cx="' + x + '" cy="' + (y - 3) + '" rx="1.8" ry="4" fill="#d9a03a"/>'; } return s; })() +
      '<rect y="130" width="400" height="110" fill="url(#' + U + 'vf)"/>' +
      '<g transform="translate(320 190)"><path d="M-8 0 L0 -40 L8 0 Z M-14 0 L-4 -34 L2 0 Z" fill="#d9a03a" stroke="#8a5e1a" stroke-width="1"/><path d="M-10 -14 H8" stroke="#8a5e1a" stroke-width="2"/></g>' +
      person(170, 224, 70, { robe: '#c9604a', head: 'veil', veil: '#f2e6c8', arms: 'hold' }) +
      '<g transform="translate(170 176)"><path d="M-10 0 L0 -18 L8 0 Z" fill="#d9a03a" stroke="#8a5e1a" stroke-width="0.8"/></g>' +
      person(250, 216, 62, { robe: '#5a7aa0', head: 'veil', veil: '#d9c49a', arms: 'out' }),
    esther: () => '<rect width="400" height="240" fill="#e2c8a0"/>' +
      [40, 100, 300, 360].map(x => '<rect x="' + (x - 8) + '" y="20" width="16" height="190" fill="#efe2c4" stroke="#b9a47a" stroke-width="1"/><rect x="' + (x - 8) + '" y="20" width="16" height="190" fill="url(#' + U + 'lit)"/>').join('') +
      '<path d="M0 20 H400 V36 H0 Z" fill="#8e1022"/><path d="M0 36 Q50 60 100 36 T200 36 T300 36 T400 36" fill="#8e1022"/>' +
      '<rect y="210" width="400" height="30" fill="#9a6a4a"/><rect y="210" width="400" height="30" fill="url(#' + U + 'vf)"/>' +
      '<path d="M230 210 V130 Q280 110 330 130 V210 Z" fill="#c99a2a" stroke="' + INK + '" stroke-width="1.2"/>' +
      person(280, 206, 70, { robe: '#f2e6c8', mantle: '#2457a8', hair: '#3a2a1e', beard: 'short', crown: true, arms: 'out' }) +
      '<path d="M300 158 L250 140" stroke="#f2c14a" stroke-width="3"/><circle cx="248" cy="139" r="4" fill="#f2c14a"/>' +
      person(150, 222, 72, { robe: '#b3263a', mantle: '#6a2c91', head: 'veil', veil: '#f2e6c8', crown: true, arms: 'pray' }),
    samuel: () => '<rect width="400" height="240" fill="#2a2440"/>' + '<rect width="400" height="240" fill="#1d2b5c" opacity="0.6"/>' +
      '<path d="M60 40 V200 M340 40 V200" stroke="#3a3458" stroke-width="20"/>' +
      '<g transform="translate(200 150)"><circle cx="0" cy="-26" r="80" fill="url(#' + U + 'glow)" opacity="0.55"/><path d="M-6 0 V-22 H6 V0" fill="#c99a2a"/><path d="M-14 -22 H14 L10 -28 H-10 Z" fill="#e0b84a" stroke="#8a5c0e" stroke-width="1"/><path d="M0 -28 C-4 -34 -2 -40 0 -46 C3 -40 5 -34 0 -28 Z" fill="#fbbf24"/><rect x="-20" y="0" width="40" height="40" fill="#5a4a3a"/></g>' +
      '<rect y="200" width="400" height="40" fill="#4a3e30"/>' +
      '<g transform="translate(110 206)"><rect x="-44" y="-10" width="88" height="10" rx="4" fill="#8a6a4a"/><path d="M-40 -10 Q-10 -26 30 -14 L40 -10 Z" fill="#c9b08a" stroke="' + INK + '" stroke-width="1"/></g>' +
      person(118, 200, 44, { robe: '#e8d6b4', hair: '#6b4426', arms: 'pray' }) +
      person(300, 210, 60, { robe: '#d9c4a0', mantle: '#4a5a7a', hair: '#e0dcd2', beard: 'long', arms: 'out' }) + stars(6, 2, 30),
    elijah: () => sky('storm') + clouds([[80, 40, 1.2], [320, 44, 1.2]], '#9aa4b4') + '<path d="M200 0 L220 110" stroke="#fde68a" stroke-width="22" opacity="0.4"/>' + rays(210, 120, 18, 160, '#fff3c4', 0.25) +
      mountain(200, 200, 460, 70, '#9a9a7a') + ground(200, '#b8a47a') +
      '<g transform="translate(210 196)"><path d="M-36 0 V-22 H36 V0 Z" fill="#a8a090" stroke="' + INK + '" stroke-width="1.2"/><path d="M-36 -11 H36 M-12 -22 V-11 M12 -22 V-11 M0 -11 V0 M-24 -11 V0 M24 -11 V0" stroke="#7a7060" stroke-width="1"/>' +
      '<path d="M-30 -22 L30 -22 L20 -30 L-20 -30 Z" fill="#7a5236"/>' +
      '<path d="M-28 -26 C-34 -50 -14 -60 -8 -84 C0 -64 6 -70 4 -96 C20 -72 34 -60 28 -26 Z" fill="#f59e0b" stroke="#d9480f" stroke-width="1"/><path d="M-14 -28 C-16 -44 -4 -50 0 -66 C10 -50 18 -44 14 -28 Z" fill="#fde68a"/></g>' +
      person(90, 224, 66, { robe: '#a8845a', mantle: '#5a3a2a', hair: '#3a2a1e', beard: 'long', arms: 'up' }) +
      crowd([[320, 226, 40, { robe: '#7a6a5a' }], [346, 222, 36, { robe: '#6a5a6a' }], [370, 228, 40, { robe: '#8a7a5a' }]]),
    job: () => sky('dawn') + sun(310, 110, 30) + rays(310, 110, 20, 240, '#fff3c4', 0.3) + hills(190, '#c9a87a', '#b8946a') +
      '<g transform="translate(160 214)"><ellipse cx="10" cy="2" rx="50" ry="6" fill="#2a1a0a" opacity="0.2"/><path d="M-40 0 Q-38 -24 -10 -28 Q30 -30 46 -6 L46 0 Z" fill="#9a9080" stroke="' + INK + '" stroke-width="1.2"/></g>' +
      person(166, 190, 64, { robe: '#a89a86', hair: '#d8d2c6', beard: 'long', arms: 'pray' }) +
      sheep(270, 222, 0.9) + sheep(300, 226, 0.8, true) + '<g transform="translate(340 200)"><path d="M0 0 C-4 -10 4 -16 0 -24" stroke="#4f8a3c" stroke-width="2" fill="none"/><circle cx="0" cy="-26" r="4" fill="#f4c94a"/></g>',
    maccabees: () => sky('dusk') + '<rect y="190" width="400" height="50" fill="#c9b08a"/><rect y="190" width="400" height="50" fill="url(#' + U + 'vf)"/>' +
      '<g transform="translate(200 192)"><path d="M-120 0 V-80 H120 V0 Z" fill="#efe2c4" stroke="#b9a47a" stroke-width="1.2"/><path d="M-130 -80 L0 -120 L130 -80 Z" fill="#e2d2ac" stroke="#b9a47a" stroke-width="1.2"/>' +
      [-100, -60, 60, 100].map(x => '<rect x="' + (x - 7) + '" y="-78" width="14" height="78" fill="#f6ecd4" stroke="#c9b48a" stroke-width="0.8"/>').join('') +
      '<path d="M-36 0 V-60 H36 V0 Z" fill="#6a4a2e"/><circle cx="0" cy="-30" r="44" fill="url(#' + U + 'glow)" opacity="0.8"/>' +
      '<g stroke="#d4a62a" stroke-width="3" fill="none"><path d="M0 -6 V-44"/><path d="M-24 -44 Q-24 -20 0 -20 Q24 -20 24 -44"/><path d="M-16 -44 Q-16 -26 0 -26 Q16 -26 16 -44"/><path d="M-8 -44 Q-8 -32 0 -32 Q8 -32 8 -44"/></g>' +
      '<path d="M-10 -6 H10" stroke="#d4a62a" stroke-width="4"/>' +
      [-24, -16, -8, 0, 8, 16, 24].map(x => '<path d="M' + x + ' -46 c-2 -3 0 -6 0 -8 c2 2 3 5 0 8 Z" fill="#fbbf24"/>').join('') + '</g>' +
      person(70, 228, 58, { robe: '#8a7a5a', mantle: '#4a5a3a', hair: '#3a2a1e', beard: 'short', helmet: true, arms: 'staff' }) +
      '<ellipse cx="54" cy="194" rx="11" ry="16" fill="#b9a46a" stroke="' + INK + '" stroke-width="1.2"/>' +
      person(330, 228, 54, { robe: '#d9c4a0', mantle: '#7a3a2a', hair: '#3a2a1e', beard: 'short', arms: 'up' }),
    cana: () => '<rect width="400" height="240" fill="#efdcb4"/><path d="M0 0 H400 V40 Q300 60 200 40 T0 40 Z" fill="#c9604a" opacity="0.6"/>' +
      '<path d="M20 40 q20 20 40 0 q20 20 40 0 q20 20 40 0 q20 20 40 0 q20 20 40 0 q20 20 40 0 q20 20 40 0 q20 20 40 0 q20 20 40 0" stroke="#4f8a3c" stroke-width="3" fill="none"/>' +
      '<rect y="206" width="400" height="34" fill="#b98a5a"/><rect y="206" width="400" height="34" fill="url(#' + U + 'vf)"/>' +
      person(110, 214, 74, Object.assign({}, JESUS, { arms: 'out' })) + person(56, 216, 64, Object.assign({}, MARY, { arms: 'pray' })) +
      [190, 222, 254, 286, 318, 350].map((x, i) => jar(x, 222 - (i % 2) * 4, 1.05, i < 4)).join('') +
      person(270, 176, 40, { robe: '#a85a4a', arms: 'hold' }),
    walking_water: () => sky('storm') + clouds([[90, 36, 1.4], [300, 30, 1.6]], '#8a96a8') + moon(340, 70, 10) +
      sea(132, '#2f5f86', '#173a5a', true) +
      boat(90, 156, 1.1) + crowd([[70, 140, 30, { robe: '#a85a4a', beard: 'short' }], [96, 136, 32, { robe: '#5a7aa0', beard: 'short' }], [120, 142, 28, { robe: '#7a8a5a' }]]) +
      person(300, 196, 70, Object.assign({}, JESUS, { arms: 'outL' })) +
      person(220, 214, 58, { robe: '#c9a06a', mantle: '#4a6a9a', hair: '#e0dcd2', beard: 'short', arms: 'out' }) +
      '<path d="M190 216 q15 -10 30 0 t30 0" stroke="#fff" stroke-width="2.4" fill="none"/><path d="M270 198 q15 -8 30 0 t30 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.8"/>',
    good_samaritan: () => sky('day') + clouds([[300, 40, 1]]) + hills(170, '#c9b07a', '#d9c08a') +
      '<path d="M180 240 Q200 200 250 170 T400 150" stroke="#e8d6a8" stroke-width="40" fill="none"/><path d="M180 240 Q200 200 250 170 T400 150" stroke="url(#' + U + 'vf)" stroke-width="40" fill="none"/>' +
      house(360, 156, 0.8) + tree(60, 190, 0.9, '#7a9a4a') +
      '<g transform="translate(250 214)"><ellipse cx="0" cy="-16" rx="26" ry="14" fill="#9a8a7a" stroke="' + INK + '" stroke-width="1"/><path d="M20 -20 q14 -12 12 -30 l6 -4 l2 10 q2 16 -12 28" fill="#9a8a7a" stroke="' + INK + '" stroke-width="1"/><path d="M-16 -4 v14 M-6 -4 v14 M10 -4 v14 M18 -4 v14" stroke="' + INK + '" stroke-width="2.4"/><rect x="-14" y="-34" width="24" height="10" rx="2" fill="#b3263a"/></g>' +
      '<g transform="translate(140 220)"><path d="M-36 0 Q-30 -12 -4 -12 Q20 -12 26 -4 L28 0 Z" fill="#d9c4a0" stroke="' + INK + '" stroke-width="1"/><circle cx="-30" cy="-12" r="7" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="1"/><path d="M-36 -14 h12" stroke="#f4f1ea" stroke-width="4"/></g>' +
      person(170, 224, 66, { robe: '#5a7aa0', mantle: '#c98a28', hair: '#3a2a1e', beard: 'short', head: 'hood', veil: '#e8d6b4', arms: 'out' }),
    prodigal_son: () => sky('dusk') + sun(80, 130, 20, '#ffe4b0') + hills(180, '#a89a7a', '#c9b07a') + house(290, 186, 1.5, '#e8d6b4') +
      '<g transform="translate(70 214) scale(0.9)"><ellipse cx="0" cy="-8" rx="14" ry="9" fill="#f0b8b0" stroke="' + INK + '" stroke-width="1"/><circle cx="12" cy="-10" r="5" fill="#f0b8b0" stroke="' + INK + '" stroke-width="1"/><path d="M-8 0 v4 M6 0 v4" stroke="' + INK + '" stroke-width="2"/></g>' +
      person(196, 222, 76, { robe: '#d9c4a0', mantle: '#8e2a2a', hair: '#e0dcd2', beard: 'long', arms: 'wide' }) +
      person(222, 224, 64, { robe: '#a89a7a', hair: '#5a3a20', arms: 'wide', back: true }) +
      '<path d="M200 168 Q210 176 222 168" stroke="#8e2a2a" stroke-width="5" fill="none"/>' + tree(360, 214, 0.8),
    loaves_fishes: () => sky('day') + clouds([[60, 40, 1], [340, 36, 1]]) + '<path d="M300 160 Q340 150 400 156 V240 H300 Z" fill="#5fa6d0"/>' +
      hills(182, '#8fb06a', '#7aa058') + grass(236, 40, '#4f7a34') +
      person(200, 200, 70, Object.assign({}, JESUS, { arms: 'up' })) +
      person(150, 214, 44, { robe: '#e0b06a', hair: '#6b4426', arms: 'hold' }) +
      basket(150, 228, 1, bread(-8, -16, 0.8) + bread(8, -16, 0.8) + bread(0, -20, 0.8) + fish(-6, -22, 0.8, '#8aa6c0') + fish(8, -24, 0.7, '#8aa6c0', true)) +
      basket(260, 228, 0.9, bread(-6, -16, 0.8) + bread(8, -17, 0.8)) +
      crowd([[50, 196, 28, { robe: '#b88a5a' }], [76, 204, 30, { robe: '#5a7aa0', head: 'veil', veil: '#e0d0b0' }], [100, 192, 24, { robe: '#a85a4a' }], [300, 196, 26, { robe: '#7a8a5a' }], [330, 204, 30, { robe: '#8a5a7a', head: 'veil', veil: '#d9c49a' }], [356, 194, 24, { robe: '#c9a06a' }]]),
    zacchaeus: () => sky('day') + clouds([[80, 40, 1]]) + ground(196, '#d9c08a') + house(70, 196, 1.1) +
      '<g transform="translate(270 214)"><ellipse cx="0" cy="2" rx="50" ry="6" fill="#2a1a0a" opacity="0.2"/><path d="M-10 0 Q-6 -50 -20 -80 M10 0 Q8 -50 30 -86 M0 -40 Q30 -60 60 -70" stroke="#7a5236" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<circle cx="-36" cy="-96" r="30" fill="#5f8f4a"/><circle cx="20" cy="-116" r="36" fill="#6a9a50"/><circle cx="62" cy="-86" r="26" fill="#5f8f4a"/><circle cx="0" cy="-80" r="24" fill="#6a9a50"/><circle cx="10" cy="-126" r="10" fill="#fff" opacity="0.12"/></g>' +
      person(286, 150, 36, { robe: '#5a7aa0', mantle: '#c98a28', hair: '#3a2a1e', beard: 'short', arms: 'wide' }) +
      person(190, 226, 72, Object.assign({}, JESUS, { arms: 'outL' })) +
      crowd([[120, 228, 50, { robe: '#a85a4a' }], [140, 222, 46, { robe: '#7a8a5a', head: 'veil', veil: '#e0d0b0' }], [350, 226, 50, { robe: '#8a5a7a' }]]),
    damascus: () => sky('day') + '<path d="M60 0 L140 210 L240 210 L320 0 Z" fill="#fff6c8" opacity="0.55"/>' + rays(190, 0, 24, 280, '#fff3c4', 0.35) +
      hills(186, '#c9b07a', '#d9c08a') +
      '<g transform="translate(340 172) scale(0.7)">' + house(0, 0, 1) + house(-40, 4, 0.8) + '</g>' +
      '<path d="M0 220 Q150 200 400 186" stroke="#e8d6a8" stroke-width="26" fill="none"/>' +
      '<g transform="translate(196 214)"><ellipse cx="4" cy="3" rx="46" ry="6" fill="#2a1a0a" opacity="0.22"/>' +
      '<path d="M40 0 Q20 -4 0 -6 L-6 0 Z" fill="#6a4a2e" stroke="' + INK + '" stroke-width="1"/>' +
      '<path d="M-30 -6 Q-28 -26 -12 -28 Q6 -26 10 -12 Q30 -8 44 -2 L40 2 Q10 2 -30 2 Z" fill="#8e2a2a" stroke="' + INK + '" stroke-width="1.2"/><path d="M-30 -6 Q-28 -26 -12 -28 Q6 -26 10 -12 Q30 -8 44 -2 L40 2 Q10 2 -30 2 Z" fill="url(#' + U + 'lit)"/>' +
      '<circle cx="-18" cy="-36" r="8" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="1"/><path d="M-25 -38 Q-24 -46 -16 -45 Q-10 -44 -11 -38" fill="#3a2a1e"/><path d="M-24 -32 Q-18 -26 -12 -32 Q-14 -26 -18 -25 Q-22 -26 -24 -32 Z" fill="#3a2a1e"/>' +
      '<path d="M-8 -24 L-14 -40" stroke="#8e2a2a" stroke-width="6" stroke-linecap="round"/><circle cx="-15" cy="-41" r="3.4" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="0.8"/>' +
      '<path d="M-26 -18 L-38 -4" stroke="#8e2a2a" stroke-width="6" stroke-linecap="round"/><circle cx="-39" cy="-3" r="3.4" fill="' + SKIN + '" stroke="' + INK + '" stroke-width="0.8"/></g>' +
      crowd([[90, 214, 46, { robe: '#7a6a5a', arms: 'up' }], [300, 210, 44, { robe: '#6a5a6a', arms: 'up' }]]),
    commandments: () => sky('storm') + clouds([[120, 60, 1.6], [280, 50, 1.6], [200, 40, 1.4]], '#7a8494') +
      mountain(200, 210, 420, 160, '#8a7a6a') + '<path d="M160 60 l-8 24 h8 l-6 20 M250 52 l-6 20 h8 l-6 18" stroke="#fde68a" stroke-width="2" fill="none"/>' +
      '<circle cx="200" cy="70" r="60" fill="url(#' + U + 'glow)" opacity="0.6"/>' +
      person(200, 128, 48, { robe: '#c9a06a', mantle: '#8e2a2a', hair: '#e0dcd2', beard: 'long', arms: 'up' }) + tablets(200, 70, 0.9) +
      ground(210, '#b8a47a') + tent(70, 228, 0.9) + tent(340, 230, 1) + crowd([[130, 232, 30, { robe: '#a85a4a' }], [270, 232, 30, { robe: '#5a7aa0' }]]),
    sheba: () => sky('gold') + sun(330, 60, 20) + '<path d="M0 160 Q100 140 200 156 T400 150 V240 H0 Z" fill="#e0c494"/>' + ground(200, '#d9b47a') +
      '<g transform="translate(90 214)"><ellipse cx="0" cy="2" rx="36" ry="5" fill="#2a1a0a" opacity="0.2"/><path d="M-24 0 v-26 M-14 0 v-26 M14 0 v-26 M24 0 v-26" stroke="#b08a5a" stroke-width="4"/><path d="M-30 -26 Q-30 -46 -10 -44 Q-4 -58 6 -44 Q26 -46 30 -26 Z" fill="#c9a06a" stroke="' + INK + '" stroke-width="1"/><path d="M26 -34 Q40 -50 38 -64 Q46 -66 48 -58 Q48 -44 34 -30" fill="#c9a06a" stroke="' + INK + '" stroke-width="1"/><rect x="-16" y="-58" width="20" height="12" fill="#8e1022" stroke="' + INK + '" stroke-width="0.8"/></g>' +
      person(190, 222, 72, { robe: '#e8a03a', mantle: '#6a2c91', head: 'veil', veil: '#f2e6c8', crown: true, arms: 'out' }) +
      person(300, 216, 72, { robe: '#f2e6c8', mantle: '#2457a8', hair: '#4a3020', beard: 'short', crown: true, arms: 'outL' }) +
      '<g transform="translate(244 214)"><rect x="-12" y="-14" width="24" height="14" fill="#c99a2a" stroke="#7a5a12" stroke-width="1"/><path d="M-12 -14 Q0 -24 12 -14" fill="#e0b84a" stroke="#7a5a12" stroke-width="1"/><circle cx="-4" cy="-18" r="2" fill="#2f9a5a"/><circle cx="4" cy="-19" r="2" fill="#b3122e"/></g>',
    sower: () => sky('day') + clouds([[300, 40, 1]]) + '<rect y="150" width="400" height="90" fill="#8a6a44"/>' +
      [0, 1, 2, 3, 4].map(i => '<path d="M0 ' + (166 + i * 16) + ' Q200 ' + (160 + i * 16) + ' 400 ' + (168 + i * 16) + '" stroke="#6a4a2a" stroke-width="2" fill="none"/>').join('') +
      '<rect y="150" width="400" height="90" fill="url(#' + U + 'vf)"/>' +
      '<path d="M300 150 Q350 148 400 152 V240 H330 Z" fill="#7aa058"/>' + (() => { let s = ''; for (let i = 0; i < 10; i++) s += '<path d="M' + (340 + (i % 5) * 12) + ' ' + (196 + Math.floor(i / 5) * 20) + ' q0 -14 2 -22" stroke="#4f8a3c" stroke-width="2" fill="none"/><ellipse cx="' + (342 + (i % 5) * 12) + '" cy="' + (172 + Math.floor(i / 5) * 20) + '" rx="2" ry="5" fill="#d9a03a"/>'; return s; })() +
      '<g fill="#9a9080">' + [[30, 176], [56, 180], [80, 172]].map(p => '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="9" ry="5"/>').join('') + '</g>' +
      person(170, 214, 74, { robe: '#d9c4a0', mantle: '#7a5a3a', hair: '#4a3020', beard: 'short', arms: 'out', head: 'hood', veil: '#a8845a' }) +
      '<g fill="#e8c66a">' + [[210, 150], [220, 158], [232, 150], [240, 164], [228, 168], [250, 156]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6"/>').join('') + '</g>' +
      bird(60, 120, 1.4) + bird(90, 104, 1.1) + bird(70, 150, 1),
    talents: () => '<rect width="400" height="240" fill="#e8d6b4"/>' + sky('soft') + hills(176, '#b9a87a', '#c9b48a') +
      '<g transform="translate(90 214)"><ellipse cx="0" cy="0" rx="36" ry="9" fill="#6a4a2a"/><ellipse cx="0" cy="-2" rx="30" ry="6" fill="#3a2a1a"/><path d="M30 -2 l30 -40" stroke="#8a6a44" stroke-width="4"/><path d="M58 -44 l10 -4 l-2 12 Z" fill="#9a9aa8"/></g>' +
      person(140, 220, 60, { robe: '#a89a7a', hair: '#3a2a1e', arms: 'down' }) +
      person(230, 216, 66, { robe: '#5a7aa0', hair: '#4a3020', beard: 'short', arms: 'hold' }) +
      person(310, 218, 64, { robe: '#8a5a7a', hair: '#3a2a1e', arms: 'hold' }) +
      (() => { let s = ''; [[230, 170, 5], [310, 172, 2]].forEach(g => { for (let i = 0; i < g[2]; i++) s += '<ellipse cx="' + (g[0] - (g[2] - 1) * 4 + i * 8) + '" cy="' + (g[1] - (i % 2) * 3) + '" rx="5" ry="3" fill="#f2c14a" stroke="#9a6d14" stroke-width="0.8"/>'; }); return s; })() +
      '<ellipse cx="90" cy="212" rx="5" ry="3" fill="#f2c14a" stroke="#9a6d14" stroke-width="0.8" opacity="0.8"/>',
    lazarus: () => sky('day') + sun(70, 50, 16) + hills(180, '#b8a47a', '#c9b48a') +
      '<g transform="translate(260 214)"><path d="M-90 0 C-90 -80 -40 -120 20 -120 C80 -120 110 -70 110 0 Z" fill="#a89e8e" stroke="' + INK + '" stroke-width="1.4"/><path d="M-90 0 C-90 -80 -40 -120 20 -120 C80 -120 110 -70 110 0 Z" fill="url(#' + U + 'lit)"/>' +
      '<path d="M-20 0 V-60 A26 26 0 0 1 32 -60 V0 Z" fill="#2e2622"/><circle cx="70" cy="-20" r="22" fill="#9a9080" stroke="' + INK + '" stroke-width="1.2"/></g>' +
      '<g transform="translate(266 214)"><path d="M-12 0 L-10 -54 Q0 -66 10 -54 L12 0 Z" fill="#f8f4ea" stroke="#c9bfa8" stroke-width="1"/><path d="M-10 -44 L10 -40 M-11 -32 L11 -28 M-11 -20 L11 -16 M-12 -8 L12 -4" stroke="#d9d0bc" stroke-width="1.4"/><circle cx="0" cy="-60" r="7" fill="#f8f4ea" stroke="#c9bfa8" stroke-width="1"/></g>' +
      person(140, 222, 74, Object.assign({}, JESUS, { arms: 'out' })) +
      person(70, 224, 60, { robe: '#a85a4a', head: 'veil', veil: '#e0d0b0', arms: 'pray' }) + person(40, 228, 56, { robe: '#5a7aa0', head: 'veil', veil: '#d9c49a', arms: 'pray' }),
    journeys: () => sky('day') + clouds([[90, 40, 1], [300, 50, 1.2]]) + sea(130, '#3f8fc0', '#1f5f90') +
      '<path d="M0 130 Q40 112 80 124 T150 120 L130 134 Q80 140 0 140 Z" fill="#c9b07a"/><path d="M300 128 Q340 112 400 118 V150 Q350 140 300 140 Z" fill="#b9a46a"/>' +
      house(40, 128, 0.5) + house(360, 124, 0.45) + '<g transform="translate(330 120) scale(0.5)"><path d="M-30 0 V-40 H30 V0 Z" fill="#efe2c4"/><path d="M-36 -40 L0 -56 L36 -40 Z" fill="#e2d2ac"/></g>' +
      boat(200, 196, 1.4, { sail: true, hull: '#8a5a32' }) + person(214, 180, 34, { robe: '#a8845a', mantle: '#8e2a2a', head: 'bald', hair: '#3a2a20', beard: 'long', arms: 'out' }) +
      '<path d="M60 180 q20 -10 40 0 t40 0" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.6"/>' + bird(280, 80, 1.2) + bird(300, 70, 1)
  };

  function scene(id, opts) {
    opts = opts || {};
    U = 'bx' + (++_uid);
    const fn = SCENES[id];
    const body = fn ? fn() : (sky('day') + hills(190, '#a8b87a', '#8aa060'));
    return '<svg class="bx-scene" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" ' + (opts.label ? 'role="img" aria-label="' + String(opts.label).replace(/"/g, '&quot;') + '"' : 'aria-hidden="true"') + ' xmlns="http://www.w3.org/2000/svg">' +
      defs(opts.thumb) + body + finish(opts.thumb) + '</svg>';
  }

  function icon(name) {
    const w = b => '<svg class="bx-ico" viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' + b + '</svg>';
    if (name === 'stories') return w('<path d="M4 12 Q14 8 24 12 V40 Q14 36 4 40 Z" fill="#fbf3e0" stroke="#7a4a1a" stroke-width="2"/><path d="M44 12 Q34 8 24 12 V40 Q34 36 44 40 Z" fill="#f4e7c8" stroke="#7a4a1a" stroke-width="2"/><path d="M8 18 Q14 16 20 18 M8 24 Q14 22 20 24 M28 18 Q34 16 40 18 M28 24 Q34 22 40 24" stroke="#c9a46a" stroke-width="1.6"/><path d="M33 8 V20 L36 17 L39 20 V8 Z" fill="#b3263a"/>');
    if (name === 'verses') return w('<rect x="10" y="8" width="28" height="32" fill="#f4e7c8" stroke="#9a7a4a" stroke-width="2"/><rect x="5" y="5" width="8" height="38" rx="4" fill="#c9a46a" stroke="#7a5a2a" stroke-width="2"/><rect x="35" y="5" width="8" height="38" rx="4" fill="#c9a46a" stroke="#7a5a2a" stroke-width="2"/><path d="M16 16 H32 M16 22 H30 M16 28 H26" stroke="#9a7a4a" stroke-width="2"/><path d="M33 26 l2 4 4 .5 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.5 Z" fill="#f2c14a" stroke="#9a6d14" stroke-width="1"/>');
    if (name === 'books') return w('<rect x="6" y="10" width="7" height="30" fill="#8e1022" stroke="#4a0a12" stroke-width="1.4"/><rect x="14" y="6" width="8" height="34" fill="#2457a8" stroke="#13306a" stroke-width="1.4"/><rect x="23" y="12" width="6" height="28" fill="#2f7a4a" stroke="#1a4a2a" stroke-width="1.4"/><rect x="30" y="8" width="8" height="32" fill="#c99a2a" stroke="#7a5a12" stroke-width="1.4" transform="rotate(8 34 24)"/><path d="M4 41 H44" stroke="#7a5236" stroke-width="3"/><path d="M8 16 h3 M16 12 h4 M24 18 h3" stroke="#f2c14a" stroke-width="1.4"/>');
    if (name === 'review') return w('<circle cx="24" cy="24" r="17" fill="#fff" stroke="#4338CA" stroke-width="3"/><path d="M24 13 V24 L31 28" stroke="#4338CA" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 10 L8 18 L16 18" stroke="#B45309" stroke-width="3" fill="none" stroke-linecap="round"/>');
    return '';
  }

  return { scene, icon, SCENE_IDS: Object.keys(SCENES) };
})();
