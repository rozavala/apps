/* ================================================================
   TRIVIA FAMILIAR — the drawings (js/trivia-art.js)

   Hand-built SVG, drawn in code: the pictures in the questions and in
   the picture answers, the subject icons, the counting cards, the
   podium, and the maps (from WorldMap and Descubre Chile's geometry).
   Every drawing has a 120×120 viewBox and its own gradient ids, so
   several can sit on one screen.

     TriviaArt.draw(id)            → '<svg…>' ('' when unknown)
     TriviaArt.label(id)           → { es, en } for aria labels / speech
     TriviaArt.has(id)
     TriviaArt.map(kind, codes, opts) → '<svg…>' for a map question
        kind 'world' | 'cont' | 'chile'; opts { state: 'ask'|'done', right, picked }
   ================================================================ */

var TriviaArt = (function () {
  'use strict';

  var uid = 0, P = '';
  function u(n) { return P + n; }
  function svg(body, label, vb) {
    return '<svg class="tv-art" viewBox="' + (vb || '0 0 120 120') + '" xmlns="http://www.w3.org/2000/svg"' +
      (label ? ' role="img" aria-label="' + String(label).replace(/[&<>"]/g, '') + '"' : ' aria-hidden="true"') + '>' + body + '</svg>';
  }
  function lin(id, x1, y1, x2, y2, stops) {
    return '<linearGradient id="' + u(id) + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>';
  }
  function rad(id, cx, cy, r, stops, fx, fy) {
    return '<radialGradient id="' + u(id) + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + (fx != null ? ' fx="' + fx + '" fy="' + fy + '"' : '') + '>' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>';
  }
  function url(id) { return 'url(#' + u(id) + ')'; }
  function shadow(cx, cy, rx, ry) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (ry || rx * 0.18) + '" fill="#1c1b29" opacity=".13"/>'; }
  function shine(cx, cy, rx, ry, rot) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity=".45"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>'; }
  function star(cx, cy, R, r, n, rot) {
    var pts = [], i, a;
    for (i = 0; i < n * 2; i++) {
      a = (rot || -90) * Math.PI / 180 + i * Math.PI / n;
      var rr = i % 2 ? r : R;
      pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  function poly(n, cx, cy, R, rot) {
    var pts = [];
    for (var i = 0; i < n; i++) { var a = (rot || -90) * Math.PI / 180 + i * 2 * Math.PI / n; pts.push((cx + R * Math.cos(a)).toFixed(1) + ',' + (cy + R * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  }

  // ── The drawings ────────────────────────────────────────────────
  var D = {};
  var L = {};   // labels

  // Space
  L.sun = ['el Sol', 'the Sun'];
  D.sun = function () {
    var rays = '';
    for (var i = 0; i < 12; i++) {
      rays += '<polygon points="60,6 66,24 54,24" fill="' + url('r') + '" transform="rotate(' + (i * 30) + ' 60 60)"/>';
    }
    return '<defs>' + rad('g', .5, .5, .5, [[0, '#FFE58A', .9], [1, '#FFB703', 0]]) + rad('b', .4, .38, .62, [[0, '#FFF6B0'], [.55, '#FFC530'], [1, '#F08A00']]) +
      lin('r', 0, 0, 0, 1, [[0, '#FFB703'], [1, '#FFD24D']]) + '</defs>' +
      '<circle cx="60" cy="60" r="56" fill="' + url('g') + '"/>' + rays +
      '<circle cx="60" cy="60" r="30" fill="' + url('b') + '"/>' + shine(50, 48, 10, 6, -30);
  };
  L.moon = ['la Luna', 'the Moon'];
  D.moon = function () {
    return '<defs>' + rad('m', .4, .35, .7, [[0, '#FFFBEA'], [.6, '#EAE2C2'], [1, '#B9AE88']]) + '<mask id="' + u('k') + '"><rect width="120" height="120" fill="#fff"/><circle cx="80" cy="46" r="40" fill="#000"/></mask></defs>' +
      '<circle cx="60" cy="60" r="46" fill="#1E293B" opacity=".08"/>' +
      '<g mask="url(#' + u('k') + ')"><circle cx="56" cy="60" r="44" fill="' + url('m') + '"/>' +
      '<circle cx="34" cy="70" r="6" fill="#B9AE88" opacity=".6"/><circle cx="44" cy="88" r="4" fill="#B9AE88" opacity=".55"/><circle cx="28" cy="50" r="3.5" fill="#B9AE88" opacity=".5"/></g>' +
      '<polygon points="' + star(98, 86, 5, 2, 4) + '" fill="#FACC15"/><polygon points="' + star(104, 24, 4, 1.6, 4) + '" fill="#FACC15"/>';
  };
  L.earth = ['la Tierra', 'the Earth'];
  D.earth = function () {
    return '<defs>' + rad('o', .38, .34, .72, [[0, '#7DD3FC'], [.55, '#2563EB'], [1, '#1E3A8A']]) + rad('a', .5, .5, .5, [[.86, '#93C5FD', 0], [.95, '#93C5FD', .55], [1, '#93C5FD', 0]]) +
      '<clipPath id="' + u('c') + '"><circle cx="60" cy="60" r="44"/></clipPath></defs>' +
      '<circle cx="60" cy="60" r="52" fill="' + url('a') + '"/><circle cx="60" cy="60" r="44" fill="' + url('o') + '"/>' +
      '<g clip-path="url(#' + u('c') + ')" fill="#22A355" stroke="#15803D" stroke-width="1">' +
      // the Americas
      '<path d="M30 22c8-4 18-2 22 4 3 5-2 9 2 14 3 4 9 4 9 10 0 5-6 6-8 10-2 3 1 6 4 9 4 4 8 9 7 15-1 7-6 14-10 18-3 3-6 1-6-3 0-6 2-12-1-17-3-5-9-7-10-13-1-5 3-9 1-14-2-4-8-5-11-9-3-5-3-10 1-14z"/>' +
      '<path d="M76 30c6-3 14 0 18 6 3 5 0 10 4 14 3 3 8 5 7 10-1 6-8 6-11 10-2 4 0 9-4 11-5 2-8-3-10-7-3-5-1-11-5-15-4-4-3-10-1-15 1-6 0-11 2-14z" fill="#2FB866"/>' +
      '</g>' +
      '<ellipse cx="44" cy="38" rx="12" ry="5" fill="#fff" opacity=".7" transform="rotate(-20 44 38)"/><ellipse cx="80" cy="84" rx="14" ry="4" fill="#fff" opacity=".55" transform="rotate(-12 80 84)"/>' +
      shine(44, 34, 14, 8, -35);
  };
  L.saturn = ['Saturno', 'Saturn'];
  D.saturn = function () {
    return '<defs>' + lin('p', 0, 0, 0, 1, [[0, '#FDE68A'], [.3, '#E9C46A'], [.5, '#D4A256'], [.7, '#E9C46A'], [1, '#B07D3A']]) +
      lin('r', 0, 0, 1, 0, [[0, '#C8B08A', .5], [.5, '#F3E3C0'], [1, '#C8B08A', .5]]) + '</defs>' +
      '<g transform="rotate(-18 60 60)">' +
      '<ellipse cx="60" cy="60" rx="54" ry="15" fill="none" stroke="' + url('r') + '" stroke-width="7"/>' +
      '<circle cx="60" cy="60" r="30" fill="' + url('p') + '"/>' +
      '<path d="M32 52h56M30 62h60M34 71h52" stroke="#C99A55" stroke-width="2.5" opacity=".55"/>' +
      '<path d="M6 60a54 15 0 0 0 108 0" fill="none" stroke="' + url('r') + '" stroke-width="7"/>' +
      '<path d="M10 62a50 12 0 0 0 100 0" fill="none" stroke="#8C7552" stroke-width="1.2" opacity=".6"/>' +
      '</g>' + shine(50, 46, 9, 5, -30);
  };
  L.rocket = ['un cohete', 'a rocket'];
  D.rocket = function () {
    return '<defs>' + lin('b', 0, 0, 1, 0, [[0, '#CBD5E1'], [.45, '#FFFFFF'], [1, '#94A3B8']]) + lin('f', 0, 0, 0, 1, [[0, '#FDE047'], [.5, '#FB923C'], [1, '#EF4444', 0]]) + '</defs>' +
      '<path d="M60 98c-8 6-9 14 0 20 9-6 8-14 0-20z" fill="' + url('f') + '"/>' +
      '<path d="M44 76l-12 18 14-4zM76 76l12 18-14-4z" fill="#DC2626"/>' +
      '<path d="M60 8c-14 12-18 32-18 52v32h36V60c0-20-4-40-18-52z" fill="' + url('b') + '" stroke="#64748B" stroke-width="1.5"/>' +
      '<path d="M60 8c-7 6-11 14-14 22h28c-3-8-7-16-14-22z" fill="#DC2626"/>' +
      '<circle cx="60" cy="50" r="9" fill="#38BDF8" stroke="#475569" stroke-width="3"/>' + shine(57, 47, 3, 2) +
      '<rect x="42" y="88" width="36" height="6" rx="2" fill="#64748B"/>' + '<path d="M56 94h8v8h-8z" fill="#475569"/>';
  };
  // Science things
  L.magnet = ['un imán', 'a magnet'];
  D.magnet = function () {
    return '<defs>' + lin('m', 0, 0, 1, 0, [[0, '#B91C1C'], [.5, '#EF4444'], [1, '#991B1B']]) + lin('s', 0, 0, 1, 0, [[0, '#94A3B8'], [.5, '#F1F5F9'], [1, '#64748B']]) + '</defs>' +
      shadow(60, 108, 40) +
      '<path d="M26 20v42a34 34 0 0 0 68 0V20H74v42a14 14 0 0 1-28 0V20z" fill="' + url('m') + '"/>' +
      '<rect x="26" y="14" width="20" height="16" rx="2" fill="' + url('s') + '"/><rect x="74" y="14" width="20" height="16" rx="2" fill="' + url('s') + '"/>' +
      '<path d="M30 8c0-6 10-6 10 0M80 8c0-6 10-6 10 0" stroke="#7C3AED" stroke-width="2" fill="none" opacity=".5"/>' +
      '<path d="M36 40c8 30 40 30 48 0" fill="none" stroke="#fff" stroke-width="3" opacity=".25"/>';
  };
  L.bulb = ['una ampolleta', 'a light bulb'];
  D.bulb = function () {
    return '<defs>' + rad('g', .5, .42, .55, [[0, '#FFF7C2'], [.6, '#FDE047', .7], [1, '#FDE047', 0]]) + lin('s', 0, 0, 1, 0, [[0, '#94A3B8'], [.5, '#E2E8F0'], [1, '#64748B']]) + '</defs>' +
      '<circle cx="60" cy="48" r="48" fill="' + url('g') + '"/>' +
      '<path d="M60 12a32 32 0 0 0-20 57c4 4 6 8 6 14h28c0-6 2-10 6-14a32 32 0 0 0-20-57z" fill="#FFFBEB" stroke="#F59E0B" stroke-width="2" opacity=".95"/>' +
      '<path d="M50 80V60l5-8 5 8 5-8 5 8v20" fill="none" stroke="#B45309" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<rect x="45" y="82" width="30" height="20" rx="3" fill="' + url('s') + '"/><path d="M45 88h30M45 94h30" stroke="#64748B" stroke-width="1.6"/>' +
      '<path d="M53 102h14l-3 6h-8z" fill="#475569"/>' + shine(48, 30, 6, 10, 25);
  };
  L.feather = ['una pluma', 'a feather'];
  D.feather = function () {
    var barbs = '';
    for (var i = 0; i < 14; i++) {
      var t = i / 13, x = 34 + 50 * t, y = 96 - 78 * t;
      barbs += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'q' + (-14 + 4 * t).toFixed(1) + ' ' + (-2).toFixed(1) + ' ' + (-20 + 8 * t).toFixed(1) + ' ' + (-14 + 4 * t).toFixed(1) + '" stroke="#7C9CC9" stroke-width="2" fill="none" opacity=".7"/>';
      barbs += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'q' + (12 - 2 * t).toFixed(1) + ' ' + (6).toFixed(1) + ' ' + (22 - 8 * t).toFixed(1) + ' ' + (4).toFixed(1) + '" stroke="#7C9CC9" stroke-width="2" fill="none" opacity=".7"/>';
    }
    return '<defs>' + lin('f', 0, 1, 1, 0, [[0, '#DBEAFE'], [1, '#A5B4FC']]) + '</defs>' +
      '<path d="M30 104C20 70 50 24 92 12 96 40 70 86 30 104z" fill="' + url('f') + '"/>' + barbs +
      '<path d="M26 112C40 80 64 44 90 14" stroke="#475569" stroke-width="2.4" fill="none"/>';
  };
  L.apple = ['una manzana', 'an apple'];
  D.apple = function () {
    return '<defs>' + rad('a', .35, .35, .75, [[0, '#FF8A80'], [.5, '#E53935'], [1, '#8E1B1B']]) + lin('l', 0, 0, 1, 1, [[0, '#86EFAC'], [1, '#16A34A']]) + '</defs>' +
      shadow(60, 110, 34) +
      '<path d="M60 34c-10-8-36-8-40 18-4 28 16 56 32 56 4 0 6-2 8-2s4 2 8 2c16 0 36-28 32-56-4-26-30-26-40-18z" fill="' + url('a') + '"/>' +
      '<path d="M60 36c0-10 2-18 8-24" stroke="#6B3E1E" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<path d="M66 22c8-10 22-10 26-6-6 10-18 12-26 6z" fill="' + url('l') + '"/>' + shine(40, 52, 7, 12, 20);
  };
  // Shapes
  function shapeDef(c1, c2) { return '<defs>' + lin('s', 0, 0, 1, 1, [[0, c1], [1, c2]]) + '</defs>'; }
  L['sh-triangle'] = ['un triángulo', 'a triangle'];
  D['sh-triangle'] = function () { return shapeDef('#FB923C', '#C2410C') + shadow(60, 108, 42) + '<polygon points="60,14 108,100 12,100" fill="' + url('s') + '" stroke="#9A3412" stroke-width="3" stroke-linejoin="round"/>' + shine(52, 50, 6, 14, 30); };
  L['sh-square'] = ['un cuadrado', 'a square'];
  D['sh-square'] = function () { return shapeDef('#60A5FA', '#1D4ED8') + shadow(60, 108, 42) + '<rect x="18" y="16" width="84" height="84" rx="4" fill="' + url('s') + '" stroke="#1E3A8A" stroke-width="3"/>' + shine(36, 32, 10, 5, -30); };
  L['sh-circle'] = ['un círculo', 'a circle'];
  D['sh-circle'] = function () { return '<defs>' + rad('s', .38, .35, .7, [[0, '#86EFAC'], [1, '#15803D']]) + '</defs>' + shadow(60, 110, 38) + '<circle cx="60" cy="58" r="44" fill="' + url('s') + '" stroke="#14532D" stroke-width="3"/>' + shine(44, 40, 12, 7, -35); };
  L['sh-star'] = ['una estrella', 'a star'];
  D['sh-star'] = function () { return shapeDef('#FDE047', '#EAB308') + shadow(60, 108, 40) + '<polygon points="' + star(60, 60, 50, 21, 5) + '" fill="' + url('s') + '" stroke="#A16207" stroke-width="3" stroke-linejoin="round"/>' + shine(52, 44, 5, 9, 20); };
  L['sh-hexagon'] = ['un hexágono', 'a hexagon'];
  D['sh-hexagon'] = function () { return shapeDef('#C4B5FD', '#6D28D9') + shadow(60, 110, 40) + '<polygon points="' + poly(6, 60, 58, 48, 0) + '" fill="' + url('s') + '" stroke="#4C1D95" stroke-width="3" stroke-linejoin="round"/>' + shine(44, 40, 10, 6, -30); };
  // Paint swatches
  var SW = { red: ['#EF4444', '#B91C1C', 'rojo', 'red'], blue: ['#3B82F6', '#1D4ED8', 'azul', 'blue'], green: ['#22C55E', '#15803D', 'verde', 'green'],
             orange: ['#FB923C', '#EA580C', 'naranjo', 'orange'], purple: ['#A855F7', '#6B21A8', 'morado', 'purple'], pink: ['#F9A8D4', '#EC4899', 'rosado', 'pink'] };
  Object.keys(SW).forEach(function (k) {
    var c = SW[k];
    L['sw-' + k] = [c[2], c[3]];
    D['sw-' + k] = function () {
      return '<defs>' + rad('p', .4, .35, .7, [[0, c[0]], [1, c[1]]]) + '</defs>' + shadow(60, 108, 40) +
        '<path d="M60 14c14 0 22 10 32 10 12 0 18 14 12 26-5 10 4 18 0 30-5 14-22 12-30 20-8 7-20 8-30 0-8-6-24-6-28-20-4-12 6-20 2-32-4-14 6-24 18-24 10 0 14-10 24-10z" fill="' + url('p') + '"/>' +
        '<circle cx="104" cy="98" r="5" fill="' + c[0] + '"/><circle cx="14" cy="22" r="4" fill="' + c[0] + '"/>' + shine(42, 38, 12, 6, -25);
    };
  });

  // Animals
  L.penguin = ['un pingüino', 'a penguin'];
  D.penguin = function () {
    return '<defs>' + lin('b', 0, 0, 1, 0, [[0, '#111827'], [1, '#374151']]) + rad('w', .5, .4, .7, [[0, '#FFFFFF'], [1, '#E5E7EB']]) + '</defs>' + shadow(60, 112, 28) +
      '<path d="M60 10c-18 0-26 18-26 40 0 10-8 26-8 40 0 16 14 22 34 22s34-6 34-22c0-14-8-30-8-40 0-22-8-40-26-40z" fill="' + url('b') + '"/>' +
      '<path d="M60 40c-12 0-18 16-18 34 0 18 8 30 18 30s18-12 18-30c0-18-6-34-18-34z" fill="' + url('w') + '"/>' +
      '<path d="M44 52c10 6 22 6 32 0" stroke="#111827" stroke-width="5" fill="none"/>' +
      '<path d="M42 30c4-6 12-8 18-8s14 2 18 8c-4 6-10 8-18 8s-14-2-18-8z" fill="#fff"/>' +
      '<ellipse cx="48" cy="30" rx="5" ry="3" fill="#F9A8D4"/><ellipse cx="72" cy="30" rx="5" ry="3" fill="#F9A8D4"/>' +
      '<circle cx="52" cy="29" r="2.4" fill="#111"/><circle cx="68" cy="29" r="2.4" fill="#111"/>' +
      '<path d="M55 36l5 6 5-6z" fill="#1F2937"/><path d="M28 60c-8 8-10 20-6 28 6-4 10-14 10-22z" fill="#1F2937"/><path d="M92 60c8 8 10 20 6 28-6-4-10-14-10-22z" fill="#1F2937"/>' +
      '<path d="M44 110l-8 4h16zM76 110l8 4H68z" fill="#F59E0B"/>';
  };
  L.condor = ['un cóndor', 'a condor'];
  D.condor = function () {
    return '<defs>' + lin('w', 0, 0, 0, 1, [[0, '#374151'], [1, '#0F172A']]) + '</defs>' +
      '<path d="M60 52C44 40 22 34 2 38c10 4 16 8 20 12-6 0-12 2-16 6 10 0 20 2 26 6-4 2-8 6-8 10 12-4 26-6 36-10z" fill="' + url('w') + '"/>' +
      '<path d="M60 52c16-12 38-18 58-14-10 4-16 8-20 12 6 0 12 2 16 6-10 0-20 2-26 6 4 2 8 6 8 10-12-4-26-6-36-10z" fill="' + url('w') + '"/>' +
      '<path d="M22 50c10 0 22 4 30 8M98 50c-10 0-22 4-30 8" stroke="#F3F4F6" stroke-width="4" opacity=".85" fill="none"/>' +
      '<ellipse cx="60" cy="66" rx="12" ry="20" fill="#111827"/>' +
      '<path d="M48 48c4 4 20 4 24 0-2 6-6 8-12 8s-10-2-12-8z" fill="#F9FAFB"/>' +
      '<circle cx="60" cy="38" r="9" fill="#9F4A3C"/><path d="M56 28c2-4 6-4 8 0z" fill="#7F1D1D"/>' +
      '<circle cx="63" cy="36" r="1.8" fill="#111"/><path d="M66 38l8 2-8 3z" fill="#E5E7EB"/>' +
      '<path d="M54 86l-4 10M66 86l4 10" stroke="#57534E" stroke-width="3"/>';
  };
  L.cat = ['un gato', 'a cat'];
  D.cat = function () {
    return '<defs>' + rad('f', .45, .4, .7, [[0, '#FDBA74'], [1, '#EA580C']]) + '</defs>' + shadow(60, 112, 32) +
      '<path d="M86 104c18 0 22-20 10-24" stroke="#EA580C" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="86" rx="30" ry="24" fill="' + url('f') + '"/>' +
      '<path d="M32 44L30 14l20 14zM88 44l2-30-20 14z" fill="#EA580C"/><path d="M35 36l-1-14 10 8zM85 36l1-14-10 8z" fill="#FBCFE8"/>' +
      '<circle cx="60" cy="48" r="28" fill="' + url('f') + '"/>' +
      '<path d="M46 26c4 6 4 10 2 14M60 22v14M74 26c-4 6-4 10-2 14" stroke="#C2410C" stroke-width="3" fill="none" opacity=".6"/>' +
      '<ellipse cx="49" cy="48" rx="5" ry="6" fill="#4ADE80"/><ellipse cx="71" cy="48" rx="5" ry="6" fill="#4ADE80"/>' +
      '<ellipse cx="49" cy="48" rx="1.6" ry="5" fill="#111"/><ellipse cx="71" cy="48" rx="1.6" ry="5" fill="#111"/>' +
      '<path d="M57 58h6l-3 4z" fill="#BE185D"/><path d="M60 62q-4 5-8 3M60 62q4 5 8 3" stroke="#7C2D12" stroke-width="1.6" fill="none"/>' +
      '<path d="M40 60H22M40 64l-16 4M80 60h18M80 64l16 4" stroke="#7C2D12" stroke-width="1.2"/>' +
      '<ellipse cx="46" cy="108" rx="9" ry="5" fill="#FED7AA"/><ellipse cx="74" cy="108" rx="9" ry="5" fill="#FED7AA"/>';
  };
  L.dog = ['un perro', 'a dog'];
  D.dog = function () {
    return '<defs>' + rad('f', .45, .4, .7, [[0, '#E7C08F'], [1, '#A16207']]) + '</defs>' + shadow(60, 112, 34) +
      '<ellipse cx="60" cy="90" rx="30" ry="22" fill="' + url('f') + '"/>' +
      '<circle cx="60" cy="50" r="30" fill="' + url('f') + '"/>' +
      '<path d="M32 34c-10 4-12 30-4 36 6-4 10-18 12-30z" fill="#78350F"/><path d="M88 34c10 4 12 30 4 36-6-4-10-18-12-30z" fill="#78350F"/>' +
      '<ellipse cx="60" cy="64" rx="16" ry="12" fill="#FDE6C4"/>' +
      '<circle cx="49" cy="46" r="4.5" fill="#1F2937"/><circle cx="71" cy="46" r="4.5" fill="#1F2937"/><circle cx="50.5" cy="44.5" r="1.4" fill="#fff"/><circle cx="72.5" cy="44.5" r="1.4" fill="#fff"/>' +
      '<ellipse cx="60" cy="58" rx="6" ry="4.5" fill="#1F2937"/>' +
      '<path d="M60 62v4M60 66q-6 4-10 0M60 66q6 4 10 0" stroke="#1F2937" stroke-width="2" fill="none"/>' +
      '<path d="M56 70q4 8 8 0z" fill="#F472B6"/>' +
      '<rect x="42" y="74" width="36" height="6" rx="3" fill="#DC2626"/><circle cx="60" cy="82" r="3.5" fill="#FACC15"/>';
  };
  L.cow = ['una vaca', 'a cow'];
  D.cow = function () {
    return '<defs>' + lin('h', 0, 0, 0, 1, [[0, '#FFFFFF'], [1, '#E5E7EB']]) + '</defs>' + shadow(60, 112, 34) +
      '<path d="M36 28c-8-6-14-6-18-2 4 2 8 6 14 8zM84 28c8-6 14-6 18-2-4 2-8 6-14 8z" fill="#E5E7EB" stroke="#9CA3AF"/>' +
      '<path d="M40 22c-2-8 0-14 4-16 0 6 0 10 2 14zM80 22c2-8 0-14-4-16 0 6 0 10-2 14z" fill="#F5F5F4" stroke="#A8A29E"/>' +
      '<path d="M60 18c-18 0-26 12-26 30 0 14 4 22 6 30h40c2-8 6-16 6-30 0-18-8-30-26-30z" fill="' + url('h') + '" stroke="#9CA3AF"/>' +
      '<path d="M40 30c6-4 12 0 12 6s-8 10-14 6c-2-4-1-9 2-12zM74 52c6-2 10 4 8 10-4 2-10 0-10-4 0-3 0-5 2-6z" fill="#1F2937"/>' +
      '<circle cx="48" cy="46" r="3.6" fill="#111"/><circle cx="72" cy="46" r="3.6" fill="#111"/>' +
      '<ellipse cx="60" cy="84" rx="24" ry="18" fill="#F9A8D4"/><ellipse cx="51" cy="84" rx="4" ry="5" fill="#9D174D"/><ellipse cx="69" cy="84" rx="4" ry="5" fill="#9D174D"/>' +
      '<path d="M50 96q10 6 20 0" stroke="#9D174D" stroke-width="2" fill="none"/>';
  };
  L.sheep = ['una oveja', 'a sheep'];
  D.sheep = function () {
    var wool = '', pts = [[34, 54], [48, 42], [64, 40], [80, 44], [92, 56], [94, 72], [84, 84], [66, 88], [48, 86], [34, 78], [28, 66], [56, 60], [72, 64], [50, 72], [68, 76]];
    pts.forEach(function (p) { wool += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="' + url('w') + '"/>'; });
    return '<defs>' + rad('w', .4, .35, .7, [[0, '#FFFFFF'], [1, '#E7E5E4']]) + '</defs>' + shadow(62, 112, 34) +
      '<path d="M44 86v22M56 88v22M72 88v22M84 84v22" stroke="#292524" stroke-width="5" stroke-linecap="round"/>' + wool +
      '<ellipse cx="26" cy="52" rx="13" ry="16" fill="#292524"/><ellipse cx="14" cy="44" rx="8" ry="4" fill="#292524" transform="rotate(-20 14 44)"/>' +
      '<circle cx="22" cy="48" r="2.6" fill="#fff"/><circle cx="22" cy="48" r="1.3" fill="#111"/>' +
      '<circle cx="30" cy="40" r="7" fill="' + url('w') + '"/>';
  };
  L.whale = ['una ballena', 'a whale'];
  D.whale = function () {
    return '<defs>' + lin('b', 0, 0, 0, 1, [[0, '#3B82F6'], [1, '#1E3A8A']]) + lin('s', 0, 0, 0, 1, [[0, '#BAE6FD', 0], [1, '#7DD3FC']]) + '</defs>' +
      '<path d="M0 96q15-6 30 0t30 0 30 0 30 0v24H0z" fill="' + url('s') + '"/>' +
      '<path d="M44 26c-4-10-12-14-16-12 6 2 10 8 12 14M44 26c4-12 12-14 16-12-6 2-10 8-12 14" stroke="#7DD3FC" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M12 64c0-18 20-30 46-30 30 0 46 16 52 30 2-8 8-14 8-14s-2 14-4 22c-4 14-26 24-56 24-28 0-46-14-46-32z" fill="' + url('b') + '"/>' +
      '<path d="M14 72c10 14 30 20 50 20 18 0 34-4 42-12-6 12-26 18-46 18-22 0-40-8-46-26z" fill="#DBEAFE"/>' +
      '<path d="M22 76h30M24 82h28" stroke="#93C5FD" stroke-width="1.6"/>' +
      '<circle cx="30" cy="60" r="3" fill="#0F172A"/><path d="M50 78c6 8 14 10 18 8-4-6-10-8-18-8z" fill="#1E40AF"/>';
  };
  L.butterfly = ['una mariposa', 'a butterfly'];
  D.butterfly = function () {
    function wing(sx) {
      return '<g transform="translate(60 0) scale(' + sx + ' 1)">' +
        '<path d="M2 56C10 20 40 6 54 14c10 6 4 30-10 40C34 60 14 62 2 56z" fill="' + url('w') + '" stroke="#111" stroke-width="3"/>' +
        '<path d="M2 62c16-2 36 2 40 18 4 16-12 26-24 20C8 96 2 80 2 62z" fill="' + url('w') + '" stroke="#111" stroke-width="3"/>' +
        '<path d="M8 54C20 40 34 30 46 22M8 64c12 6 22 14 28 26" stroke="#111" stroke-width="2.2" fill="none"/>' +
        '<circle cx="48" cy="20" r="2.6" fill="#fff"/><circle cx="52" cy="30" r="2.2" fill="#fff"/><circle cx="30" cy="94" r="2.4" fill="#fff"/></g>';
    }
    return '<defs>' + lin('w', 0, 0, 1, 1, [[0, '#FDBA74'], [1, '#EA580C']]) + '</defs>' + wing(1) + wing(-1) +
      '<ellipse cx="60" cy="62" rx="4" ry="26" fill="#1F2937"/><circle cx="60" cy="34" r="5" fill="#1F2937"/>' +
      '<path d="M58 30q-6-12-12-14M62 30q6-12 12-14" stroke="#1F2937" stroke-width="1.8" fill="none"/><circle cx="46" cy="16" r="2" fill="#1F2937"/><circle cx="74" cy="16" r="2" fill="#1F2937"/>';
  };
  L.bee = ['una abeja', 'a bee'];
  D.bee = function () {
    return '<defs>' + lin('b', 0, 0, 1, 0, [[0, '#FDE047'], [1, '#EAB308']]) + '<clipPath id="' + u('c') + '"><ellipse cx="62" cy="68" rx="34" ry="24"/></clipPath></defs>' +
      '<ellipse cx="52" cy="34" rx="16" ry="22" fill="#E0F2FE" stroke="#7DD3FC" stroke-width="2" opacity=".9" transform="rotate(-20 52 34)"/>' +
      '<ellipse cx="76" cy="34" rx="14" ry="20" fill="#E0F2FE" stroke="#7DD3FC" stroke-width="2" opacity=".9" transform="rotate(20 76 34)"/>' +
      '<ellipse cx="62" cy="68" rx="34" ry="24" fill="' + url('b') + '"/>' +
      '<g clip-path="url(#' + u('c') + ')" fill="#1F2937"><rect x="50" y="40" width="9" height="60"/><rect x="68" y="40" width="9" height="60"/><rect x="86" y="40" width="12" height="60"/></g>' +
      '<path d="M96 68l12 2-12 3z" fill="#1F2937"/>' +
      '<circle cx="28" cy="64" r="15" fill="#1F2937"/><circle cx="23" cy="60" r="4" fill="#fff"/><circle cx="22" cy="60" r="2" fill="#111"/>' +
      '<path d="M22 72q5 4 10 0" stroke="#fff" stroke-width="2" fill="none"/><path d="M24 50q-4-10-10-12M32 50q2-10 8-14" stroke="#1F2937" stroke-width="2.4" fill="none"/>';
  };
  L.ladybug = ['una chinita', 'a ladybug'];
  D.ladybug = function () {
    return '<defs>' + rad('r', .38, .3, .75, [[0, '#FCA5A5'], [.5, '#EF4444'], [1, '#991B1B']]) + '</defs>' + shadow(60, 110, 36) +
      '<path d="M30 92l-12 8M28 72H14M32 54l-12-6M90 92l12 8M92 72h14M88 54l12-6" stroke="#111" stroke-width="3.4" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="72" rx="34" ry="34" fill="' + url('r') + '"/>' +
      '<path d="M60 40v66" stroke="#111" stroke-width="3"/>' +
      '<circle cx="44" cy="60" r="7" fill="#111"/><circle cx="76" cy="60" r="7" fill="#111"/><circle cx="42" cy="86" r="6" fill="#111"/><circle cx="78" cy="86" r="6" fill="#111"/><circle cx="60" cy="98" r="4" fill="#111"/>' +
      '<path d="M32 46a28 18 0 0 1 56 0z" fill="#111"/><circle cx="50" cy="36" r="4" fill="#fff"/><circle cx="70" cy="36" r="4" fill="#fff"/>' +
      '<path d="M52 28q-4-12-10-14M68 28q4-12 10-14" stroke="#111" stroke-width="2.4" fill="none"/>' + shine(46, 54, 8, 5, -30);
  };
  L.frog = ['una rana', 'a frog'];
  D.frog = function () {
    return '<defs>' + rad('g', .45, .35, .75, [[0, '#86EFAC'], [1, '#15803D']]) + '</defs>' + shadow(60, 112, 40) +
      '<path d="M22 100c-10 0-14 8-8 10h20M98 100c10 0 14 8 8 10H86" stroke="#15803D" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="76" rx="40" ry="30" fill="' + url('g') + '"/>' +
      '<ellipse cx="60" cy="86" rx="24" ry="16" fill="#D9F99D"/>' +
      '<circle cx="40" cy="44" r="15" fill="' + url('g') + '"/><circle cx="80" cy="44" r="15" fill="' + url('g') + '"/>' +
      '<circle cx="40" cy="42" r="9" fill="#fff"/><circle cx="80" cy="42" r="9" fill="#fff"/><circle cx="42" cy="43" r="5" fill="#111"/><circle cx="78" cy="43" r="5" fill="#111"/>' +
      '<path d="M40 66q20 12 40 0" stroke="#14532D" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="34" cy="62" r="3" fill="#F9A8D4" opacity=".8"/><circle cx="86" cy="62" r="3" fill="#F9A8D4" opacity=".8"/>';
  };
  L.elephant = ['un elefante', 'an elephant'];
  D.elephant = function () {
    return '<defs>' + rad('e', .45, .35, .75, [[0, '#CBD5E1'], [1, '#64748B']]) + '</defs>' + shadow(60, 114, 40) +
      '<path d="M40 86v22h12V92M68 92v16h12V86" fill="#94A3B8"/>' +
      '<ellipse cx="62" cy="76" rx="38" ry="28" fill="' + url('e') + '"/>' +
      '<path d="M30 26c-16 0-24 18-18 34 4 12 16 16 22 12z" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>' +
      '<circle cx="38" cy="48" r="22" fill="' + url('e') + '"/>' +
      '<path d="M22 56c-6 10-6 26 0 36 3 6 10 8 12 4-6-6-8-16-4-28z" fill="#94A3B8" stroke="#64748B" stroke-width="2"/>' +
      '<path d="M28 64q-10 4-12-2" stroke="#F8FAFC" stroke-width="3" fill="none"/>' +
      '<circle cx="42" cy="44" r="3.4" fill="#111"/><circle cx="43" cy="43" r="1" fill="#fff"/>' +
      '<path d="M98 72q10 4 8 16" stroke="#64748B" stroke-width="3" fill="none"/>';
  };
  L.huemul = ['un huemul', 'a huemul'];
  D.huemul = function () {
    return '<defs>' + lin('h', 0, 0, 0, 1, [[0, '#B07A35'], [1, '#6B4317']]) + lin('d', 0, 0, 0, 1, [[0, '#8A5A1C'], [1, '#5B3A12']]) + '</defs>' + shadow(62, 114, 40) +
      '<path d="M42 84l-3 28M52 86l1 26M80 86l-1 26M90 82l3 30" stroke="#4A2E0C" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M38 112h4M50 112h5M78 112h4M90 112h5" stroke="#1C1917" stroke-width="4"/>' +
      '<path d="M34 70c0-12 12-20 32-20 18 0 28 8 28 20 0 12-12 20-30 20S34 82 34 70z" fill="' + url('h') + '"/>' +
      '<path d="M40 76c8 8 36 10 50 2" stroke="#E7D3A8" stroke-width="3" fill="none" opacity=".5"/>' +
      '<path d="M36 70c-6-10-8-24-4-32l16 2c2 10 2 20 2 28z" fill="' + url('h') + '"/>' +
      '<path d="M22 34c2-8 14-12 24-8l4 12c-6 6-18 8-26 4z" fill="' + url('d') + '"/>' +
      '<path d="M22 36c-2 4 0 8 4 8l-2-8z" fill="#1C1917"/><path d="M28 32l8 6 6-8" stroke="#1C1917" stroke-width="2.6" fill="none" stroke-linejoin="round"/>' +
      '<path d="M44 24l10-6-2 10z" fill="' + url('d') + '"/><circle cx="34" cy="32" r="2.2" fill="#111"/>' +
      '<path d="M40 24c-2-8 0-16 6-20M44 14l10-4M46 8l4-6M36 24c-8-4-12-12-10-18M30 14l-8-2" stroke="#EADBB8" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M92 64q8-4 8 4" stroke="#6B4317" stroke-width="5" fill="none" stroke-linecap="round"/>';
  };
  L.fish = ['un pez', 'a fish'];
  D.fish = function () {
    return '<defs>' + lin('f', 0, 0, 0, 1, [[0, '#FDBA74'], [1, '#F97316']]) + '</defs>' +
      '<path d="M84 60l28-20v40z" fill="#EA580C"/>' +
      '<ellipse cx="54" cy="60" rx="38" ry="26" fill="' + url('f') + '"/>' +
      '<path d="M40 36c8-10 20-12 28-8-8 2-14 6-18 12z" fill="#EA580C"/>' +
      '<path d="M50 40q-8 20 0 40M64 38q-8 22 0 44" stroke="#fff" stroke-width="5" fill="none" opacity=".75"/>' +
      '<circle cx="30" cy="54" r="6" fill="#fff"/><circle cx="29" cy="54" r="3.2" fill="#111"/>' +
      '<path d="M18 66q4 3 8 0" stroke="#9A3412" stroke-width="2" fill="none"/>';
  };
  // Plants and Chile
  L.copihue = ['un copihue', 'a copihue'];
  D.copihue = function () {
    function bell(x, y, rot, s) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')">' +
        '<path d="M0 0c-10 4-14 20-14 34 6 4 22 4 28 0 0-14-4-30-14-34z" fill="' + url('r') + '"/>' +
        '<path d="M-14 34c2 4 8 6 14 6s12-2 14-6" fill="#9F1239"/>' +
        '<path d="M-6 8q-2 12 0 26M6 8q2 12 0 26" stroke="#FDA4AF" stroke-width="1.4" fill="none" opacity=".7"/>' +
        '<path d="M-2 38l-1 8M2 38l1 8" stroke="#FEF3C7" stroke-width="1.6"/></g>';
    }
    return '<defs>' + lin('r', 0, 0, 1, 0, [[0, '#E11D48'], [.5, '#FB7185'], [1, '#BE123C']]) + lin('l', 0, 0, 1, 1, [[0, '#4ADE80'], [1, '#166534']]) + '</defs>' +
      '<path d="M8 14C30 8 50 16 64 10s34-6 48 2" stroke="#3F6212" stroke-width="3.5" fill="none"/>' +
      '<path d="M26 12c-8 10-6 22 2 26 4-8 4-18-2-26zM82 8c10 6 12 18 6 24-6-6-8-16-6-24zM104 12c-2 10 2 18 8 20 0-8-2-16-8-20z" fill="' + url('l') + '"/>' +
      '<path d="M44 14v12M68 10v18" stroke="#3F6212" stroke-width="2.4"/>' +
      bell(44, 26, 6, 1.4) + bell(68, 28, -8, 1.2);
  };
  L.araucaria = ['una araucaria', 'a monkey-puzzle tree'];
  D.araucaria = function () {
    // A tall bare trunk and, at the top, whorls of branches that curve up
    // at the tips, each ending in a dark spiky tuft: the "umbrella".
    var out = '', i;
    var arms = [[-44, 40, 8], [-30, 30, 4], [-16, 22, 0], [16, 22, 0], [30, 30, 4], [44, 40, 8], [-38, 54, 18], [38, 54, 18], [-22, 48, 14], [22, 48, 14]];
    arms.forEach(function (a) {
      var x = 60 + a[0], y = a[1], sy = 60 + a[2];
      out += '<path d="M60 ' + sy + 'Q' + (60 + a[0] * 0.6).toFixed(1) + ' ' + (sy + 4) + ' ' + x + ' ' + y + '" stroke="#57534E" stroke-width="3" fill="none" stroke-linecap="round"/>';
    });
    arms.forEach(function (a) {
      var x = 60 + a[0], y = a[1];
      out += '<ellipse cx="' + x + '" cy="' + (y - 2) + '" rx="13" ry="7" fill="' + url('c') + '" transform="rotate(' + (a[0] < 0 ? -18 : 18) + ' ' + x + ' ' + y + ')"/>';
      for (i = -2; i <= 2; i++) out += '<path d="M' + (x + i * 4) + ' ' + (y - 6) + 'l' + (i * 1.5) + ' -6" stroke="#14532D" stroke-width="2" stroke-linecap="round"/>';
    });
    return '<defs>' + lin('t', 0, 0, 1, 0, [[0, '#44403C'], [.5, '#A8A29E'], [1, '#3F3A36']]) + lin('c', 0, 0, 0, 1, [[0, '#4D7C0F'], [1, '#14532D']]) + '</defs>' + shadow(60, 114, 30) +
      '<path d="M55 114V56h10v58z" fill="' + url('t') + '"/><path d="M57 70l6 4M57 86l6 4M57 100l6 4" stroke="#292524" stroke-width="1.2" opacity=".6"/>' + out +
      '<ellipse cx="60" cy="18" rx="12" ry="7" fill="' + url('c') + '"/><path d="M60 58V20" stroke="#57534E" stroke-width="3"/>';
  };
  L.volcano = ['un volcán', 'a volcano'];
  D.volcano = function () {
    return '<defs>' + lin('m', 0, 0, 0, 1, [[0, '#78716C'], [1, '#44403C']]) + lin('s', 0, 0, 0, 1, [[0, '#E0F2FE'], [1, '#BAE6FD']]) + '</defs>' +
      '<rect width="120" height="120" rx="14" fill="' + url('s') + '"/>' +
      '<circle cx="50" cy="20" r="10" fill="#E7E5E4"/><circle cx="62" cy="14" r="12" fill="#F5F5F4"/><circle cx="74" cy="22" r="9" fill="#E7E5E4"/>' +
      '<path d="M-2 112L48 38h24l50 74z" fill="' + url('m') + '"/>' +
      '<path d="M48 38h24l10 15c-6 4-10-2-14 2-4 4-8-2-12 2-4 3-8-2-12 0l-6-4z" fill="#fff"/>' +
      '<path d="M-2 112c30-10 90-10 124 0v8H-2z" fill="#65A30D"/>' +
      '<path d="M58 38q-2-6 2-10" stroke="#A8A29E" stroke-width="3" fill="none"/>';
  };
  L.pyramid = ['las pirámides', 'the pyramids'];
  D.pyramid = function () {
    return '<defs>' + lin('s', 0, 0, 0, 1, [[0, '#BFDBFE'], [1, '#FEF3C7']]) + lin('a', 0, 0, 1, 0, [[0, '#F5D08A'], [1, '#D4A256']]) + lin('b', 0, 0, 1, 0, [[0, '#C8913F'], [1, '#A16207']]) + '</defs>' +
      '<rect width="120" height="120" rx="14" fill="' + url('s') + '"/><circle cx="96" cy="24" r="10" fill="#FDE047"/>' +
      '<path d="M0 98h120v22H0z" fill="#F2C879"/>' +
      '<path d="M4 98l28-40 28 40z" fill="' + url('a') + '"/><path d="M32 58l28 40H42z" fill="' + url('b') + '"/>' +
      '<path d="M40 98l34-52 34 52z" fill="' + url('a') + '"/><path d="M74 46l34 52H86z" fill="' + url('b') + '"/>' +
      '<path d="M84 98l14-20 14 20z" fill="' + url('a') + '"/><path d="M98 78l14 20h-8z" fill="' + url('b') + '"/>' +
      '<path d="M50 84h44M58 72h28M66 60h14" stroke="#B9853E" stroke-width="1" opacity=".5"/>';
  };
  L.castle = ['un castillo', 'a castle'];
  D.castle = function () {
    function tower(x, w, top) {
      return '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (108 - top) + '" fill="' + url('w') + '" stroke="#78716C" stroke-width="1.5"/>' +
        '<path d="M' + x + ' ' + top + 'h' + w / 5 + 'v-6h' + w / 5 + 'v6h' + w / 5 + 'v-6h' + w / 5 + 'v6h' + w / 5 + '" fill="' + url('w') + '" stroke="#78716C" stroke-width="1.5"/>';
    }
    return '<defs>' + lin('w', 0, 0, 1, 0, [[0, '#D6D3D1'], [.5, '#F5F5F4'], [1, '#A8A29E']]) + '</defs>' + shadow(60, 110, 50) +
      tower(28, 64, 50) + tower(12, 22, 30) + tower(86, 22, 30) +
      '<path d="M12 30l11-20 11 20zM86 30l11-20 11 20z" fill="#B91C1C"/><path d="M23 10V2l10 4-10 4M97 10V2l10 4-10 4" fill="#2563EB" stroke="#57534E" stroke-width="1"/>' +
      '<path d="M48 108V84a12 12 0 0 1 24 0v24z" fill="#78350F"/><path d="M60 72v36" stroke="#5B3A12"/>' +
      '<rect x="20" y="44" width="6" height="10" rx="3" fill="#44403C"/><rect x="94" y="44" width="6" height="10" rx="3" fill="#44403C"/><rect x="40" y="60" width="6" height="10" rx="3" fill="#44403C"/><rect x="74" y="60" width="6" height="10" rx="3" fill="#44403C"/>';
  };
  L.church = ['una iglesia', 'a church'];
  D.church = function () {
    return '<defs>' + lin('w', 0, 0, 1, 0, [[0, '#FDE68A'], [1, '#F59E0B']]) + lin('r', 0, 0, 0, 1, [[0, '#3B82F6'], [1, '#1E40AF']]) + '</defs>' + shadow(60, 112, 52) +
      '<path d="M14 62l46-20 46 20z" fill="' + url('r') + '"/>' +
      '<rect x="18" y="62" width="84" height="48" fill="' + url('w') + '" stroke="#B45309" stroke-width="1.5"/>' +
      '<path d="M18 70h84M18 80h84M18 90h84M18 100h84" stroke="#D97706" stroke-width=".8" opacity=".6"/>' +
      '<rect x="46" y="30" width="28" height="34" fill="' + url('w') + '" stroke="#B45309" stroke-width="1.5"/>' +
      '<path d="M42 32l18-18 18 18z" fill="' + url('r') + '"/><path d="M60 14V2M54 7h12" stroke="#57534E" stroke-width="2.6"/>' +
      '<path d="M54 46a6 6 0 0 1 12 0v8H54z" fill="#1E3A8A"/>' +
      '<path d="M50 110V88a10 10 0 0 1 20 0v22z" fill="#7C2D12"/>' +
      '<rect x="26" y="76" width="10" height="14" rx="5" fill="#1E3A8A"/><rect x="84" y="76" width="10" height="14" rx="5" fill="#1E3A8A"/>';
  };
  L.moai = ['un moái', 'a moai'];
  D.moai = function () {
    return '<defs>' + lin('s', 0, 0, 0, 1, [[0, '#BAE6FD'], [1, '#E0F2FE']]) + lin('m', 0, 0, 1, 0, [[0, '#57534E'], [.5, '#8B8178'], [1, '#44403C']]) + '</defs>' +
      '<rect width="120" height="120" rx="14" fill="' + url('s') + '"/>' +
      '<path d="M0 84h120v36H0z" fill="#2563EB" opacity=".7"/><path d="M0 92c20 6 40-6 60 0s40 6 60 0v28H0z" fill="#65A30D"/>' +
      '<rect x="30" y="98" width="60" height="10" fill="#78716C"/>' +
      '<path d="M44 98V34c0-14 8-22 18-22s16 8 16 22v12l4 6-4 4v42z" fill="' + url('m') + '"/>' +
      '<path d="M46 34h28" stroke="#292524" stroke-width="5"/><path d="M70 36l6 20-6 2" fill="none" stroke="#3F3A36" stroke-width="2.4"/>' +
      '<path d="M54 66h18" stroke="#292524" stroke-width="3"/><path d="M48 74c6 2 18 2 24 0" stroke="#3F3A36" stroke-width="2"/>' +
      '<path d="M44 40c-4 0-6 10-2 14" stroke="#3F3A36" stroke-width="3" fill="none"/>';
  };
  // Music
  L.guitar = ['una guitarra', 'a guitar'];
  D.guitar = function () {
    return '<defs>' + rad('b', .45, .45, .7, [[0, '#FBBF24'], [.7, '#C2410C'], [1, '#7C2D12']]) + lin('n', 0, 0, 1, 0, [[0, '#57340F'], [1, '#8B5E34']]) + '</defs>' +
      '<g transform="rotate(30 60 60)">' +
      '<rect x="56" y="4" width="8" height="58" fill="' + url('n') + '"/>' +
      '<path d="M54 2h12l2 12H52z" fill="#3B2508"/><circle cx="51" cy="6" r="2" fill="#E5E7EB"/><circle cx="69" cy="6" r="2" fill="#E5E7EB"/><circle cx="51" cy="12" r="2" fill="#E5E7EB"/><circle cx="69" cy="12" r="2" fill="#E5E7EB"/>' +
      '<path d="M60 52c-14 0-22 8-20 18 2 6-8 10-8 22 0 14 12 24 28 24s28-10 28-24c0-12-10-16-8-22 2-10-6-18-20-18z" fill="' + url('b') + '" stroke="#7C2D12" stroke-width="1.5"/>' +
      '<circle cx="60" cy="76" r="8" fill="#1C1917"/><circle cx="60" cy="76" r="10" fill="none" stroke="#FDE68A" stroke-width="1.4"/>' +
      '<rect x="50" y="96" width="20" height="5" rx="1" fill="#3B2508"/>' +
      '<path d="M57.5 14v84M59 14v84M60.5 14v84M62 14v84" stroke="#F5F5F4" stroke-width=".6"/>' +
      '<path d="M56 20h8M56 28h8M56 36h8M56 44h8" stroke="#D4D4D8" stroke-width=".9"/></g>';
  };
  L.drum = ['un tambor', 'a drum'];
  D.drum = function () {
    var lace = '';
    for (var i = 0; i < 7; i++) { var x = 22 + i * 13; lace += '<path d="M' + x + ' 46l' + 6.5 + ' 44l' + 6.5 + '-44" stroke="#FDE68A" stroke-width="2" fill="none"/>'; }
    return '<defs>' + lin('d', 0, 0, 1, 0, [[0, '#991B1B'], [.45, '#EF4444'], [1, '#7F1D1D']]) + '</defs>' + shadow(60, 108, 46) +
      '<path d="M18 44v46c0 8 18 14 42 14s42-6 42-14V44z" fill="' + url('d') + '"/>' + lace +
      '<path d="M18 90c0 8 18 14 42 14s42-6 42-14" stroke="#FDE68A" stroke-width="4" fill="none"/>' +
      '<ellipse cx="60" cy="44" rx="42" ry="13" fill="#FAFAF9" stroke="#FDE68A" stroke-width="4"/>' +
      '<path d="M30 10l30 30M92 8L66 40" stroke="#B45309" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="10" r="4" fill="#FDE68A"/><circle cx="92" cy="8" r="4" fill="#FDE68A"/>';
  };
  L.piano = ['un piano', 'a piano'];
  D.piano = function () {
    var keys = '', blacks = '', i;
    for (i = 0; i < 10; i++) keys += '<rect x="' + (12 + i * 9.6) + '" y="62" width="9.6" height="34" fill="#fff" stroke="#9CA3AF" stroke-width=".8"/>';
    [1, 2, 4, 5, 6, 8, 9].forEach(function (k) { blacks += '<rect x="' + (12 + k * 9.6 - 3).toFixed(1) + '" y="62" width="6" height="20" rx="1" fill="#111827"/>'; });
    return '<defs>' + lin('w', 0, 0, 0, 1, [[0, '#3F2A1C'], [1, '#1C120B']]) + '</defs>' + shadow(60, 112, 50) +
      '<rect x="8" y="14" width="104" height="52" rx="6" fill="' + url('w') + '"/>' +
      '<rect x="18" y="22" width="84" height="22" rx="3" fill="#2A1C12" stroke="#5B3F2B"/>' +
      '<path d="M40 28c4 0 4 12 8 12M56 26v12M70 28c4 0 4 10 8 10" stroke="#FDE68A" stroke-width="1.2" fill="none" opacity=".6"/>' +
      '<rect x="6" y="58" width="108" height="42" rx="4" fill="' + url('w') + '"/>' + keys + blacks +
      '<rect x="14" y="100" width="6" height="12" fill="#1C120B"/><rect x="100" y="100" width="6" height="12" fill="#1C120B"/>';
  };
  L.violin = ['un violín', 'a violin'];
  D.violin = function () {
    return '<defs>' + rad('b', .45, .4, .7, [[0, '#F59E0B'], [.7, '#B45309'], [1, '#78350F']]) + '</defs>' +
      '<g transform="rotate(-28 60 60)">' +
      '<rect x="57" y="6" width="6" height="40" fill="#1C1917"/><circle cx="60" cy="6" r="5" fill="#57340F"/>' +
      '<path d="M60 40c-12 0-18 6-16 14 1 6-6 8-6 16 0 6 4 8 4 12 0 4-6 8-6 16 0 10 10 18 24 18s24-8 24-18c0-8-6-12-6-16 0-4 4-6 4-12 0-8-7-10-6-16 2-8-4-14-16-14z" fill="' + url('b') + '" stroke="#78350F" stroke-width="1.4"/>' +
      '<path d="M50 76c-4 4-4 10 0 14M70 76c4 4 4 10 0 14" stroke="#1C1917" stroke-width="2.2" fill="none"/>' +
      '<rect x="54" y="96" width="12" height="4" fill="#1C1917"/><path d="M58 10v86M62 10v86" stroke="#E7E5E4" stroke-width=".7"/></g>' +
      '<path d="M18 98L104 30" stroke="#78350F" stroke-width="3" stroke-linecap="round"/><path d="M20 102L106 34" stroke="#F5F5F4" stroke-width="1.2"/>';
  };
  L.trumpet = ['una trompeta', 'a trumpet'];
  D.trumpet = function () {
    return '<defs>' + lin('g', 0, 0, 0, 1, [[0, '#FEF3C7'], [.4, '#FBBF24'], [1, '#B45309']]) + '</defs>' +
      '<path d="M8 56h70l24-20v48l-24-20H8z" fill="' + url('g') + '" stroke="#92400E" stroke-width="1.5"/>' +
      '<ellipse cx="102" cy="60" rx="6" ry="24" fill="#B45309"/><ellipse cx="102" cy="60" rx="3" ry="18" fill="#78350F"/>' +
      '<path d="M26 64v16c0 6 6 8 10 8h30c4 0 8-2 8-8V64" fill="none" stroke="' + url('g') + '" stroke-width="7"/>' +
      '<rect x="36" y="38" width="7" height="18" rx="2" fill="' + url('g') + '" stroke="#92400E"/><rect x="48" y="38" width="7" height="18" rx="2" fill="' + url('g') + '" stroke="#92400E"/><rect x="60" y="38" width="7" height="18" rx="2" fill="' + url('g') + '" stroke="#92400E"/>' +
      '<ellipse cx="39.5" cy="36" rx="5" ry="2" fill="#F5F5F4"/><ellipse cx="51.5" cy="36" rx="5" ry="2" fill="#F5F5F4"/><ellipse cx="63.5" cy="36" rx="5" ry="2" fill="#F5F5F4"/>' +
      '<path d="M2 54h8v8H2z" fill="#92400E"/>';
  };
  // Art
  L.palette = ['una paleta de pintor', 'a painter’s palette'];
  D.palette = function () {
    return '<defs>' + lin('w', 0, 0, 1, 1, [[0, '#F3D9A4'], [1, '#C8955A']]) + '</defs>' + shadow(60, 108, 46) +
      '<path d="M60 12C28 12 8 32 8 58c0 24 20 42 44 42 12 0 12-10 8-16-4-6 0-12 8-12h14c18 0 30-10 30-26 0-20-22-34-52-34z" fill="' + url('w') + '" stroke="#A16207" stroke-width="2"/>' +
      '<ellipse cx="74" cy="70" rx="8" ry="6" fill="#FAFAF9" stroke="#A16207" stroke-width="1.5"/>' +
      '<circle cx="34" cy="38" r="8" fill="#EF4444"/><circle cx="56" cy="28" r="8" fill="#FACC15"/><circle cx="80" cy="32" r="8" fill="#3B82F6"/><circle cx="98" cy="48" r="7" fill="#22C55E"/><circle cx="26" cy="62" r="7" fill="#A855F7"/><circle cx="36" cy="84" r="7" fill="#fff" stroke="#E5E7EB"/>';
  };
  L.brush = ['un pincel', 'a paintbrush'];
  D.brush = function () {
    return '<defs>' + lin('h', 0, 0, 1, 0, [[0, '#B45309'], [.5, '#F59E0B'], [1, '#92400E']]) + lin('f', 0, 0, 1, 0, [[0, '#94A3B8'], [.5, '#F1F5F9'], [1, '#64748B']]) + '</defs>' +
      '<g transform="rotate(40 60 60)"><rect x="54" y="4" width="12" height="60" rx="6" fill="' + url('h') + '"/>' +
      '<rect x="52" y="60" width="16" height="16" fill="' + url('f') + '"/><path d="M52 64h16M52 70h16" stroke="#64748B"/>' +
      '<path d="M52 76c0 14 4 26 8 36 4-10 8-22 8-36z" fill="#2563EB"/><path d="M56 80c0 10 2 18 4 26" stroke="#93C5FD" stroke-width="1.6" fill="none"/></g>' +
      '<path d="M6 108c14-6 26 4 40-2" stroke="#2563EB" stroke-width="5" fill="none" stroke-linecap="round"/>';
  };
  // Sports
  L.ball = ['una pelota de fútbol', 'a soccer ball'];
  D.ball = function () {
    var pent = poly(5, 60, 60, 14), around = '';
    for (var i = 0; i < 5; i++) {
      var a = (-90 + i * 72) * Math.PI / 180, cx = 60 + 34 * Math.cos(a), cy = 60 + 34 * Math.sin(a);
      around += '<polygon points="' + poly(5, cx, cy, 11, -90 + i * 72 + 36) + '" fill="#1F2937"/>';
      around += '<path d="M' + (60 + 14 * Math.cos(a)).toFixed(1) + ' ' + (60 + 14 * Math.sin(a)).toFixed(1) + 'L' + (60 + 24 * Math.cos(a)).toFixed(1) + ' ' + (60 + 24 * Math.sin(a)).toFixed(1) + '" stroke="#475569" stroke-width="1.6"/>';
    }
    return '<defs>' + rad('b', .38, .35, .75, [[0, '#FFFFFF'], [.7, '#E5E7EB'], [1, '#9CA3AF']]) + '<clipPath id="' + u('c') + '"><circle cx="60" cy="60" r="44"/></clipPath></defs>' + shadow(60, 112, 34) +
      '<circle cx="60" cy="60" r="44" fill="' + url('b') + '"/>' +
      '<g clip-path="url(#' + u('c') + ')"><polygon points="' + pent + '" fill="#1F2937"/>' + around + '</g>' +
      '<circle cx="60" cy="60" r="44" fill="none" stroke="#6B7280" stroke-width="1.5"/>' + shine(44, 40, 10, 6, -35);
  };
  L.basketball = ['una pelota de básquetbol', 'a basketball'];
  D.basketball = function () {
    return '<defs>' + rad('b', .38, .35, .75, [[0, '#FDBA74'], [.6, '#F97316'], [1, '#9A3412']]) + '</defs>' + shadow(60, 112, 34) +
      '<circle cx="60" cy="60" r="44" fill="' + url('b') + '"/>' +
      '<path d="M16 60h88M60 16v88M28 28c14 14 14 50 0 64M92 28c-14 14-14 50 0 64" stroke="#3B1A08" stroke-width="2.6" fill="none"/>' + shine(42, 40, 9, 5, -35);
  };
  L.tennis = ['una raqueta y una pelota de tenis', 'a tennis racket and ball'];
  D.tennis = function () {
    var str = '';
    for (var i = -3; i <= 3; i++) { str += '<path d="M' + (46 + i * 6) + ' 14v64M20 ' + (46 + i * 6) + 'h52" stroke="#E5E7EB" stroke-width="1.1"/>'; }
    return '<defs>' + rad('t', .38, .35, .75, [[0, '#ECFCCB'], [.6, '#BEF264'], [1, '#65A30D']]) + '<clipPath id="' + u('c') + '"><ellipse cx="46" cy="46" rx="24" ry="32"/></clipPath></defs>' +
      '<g transform="rotate(-30 46 46)"><g clip-path="url(#' + u('c') + ')">' + str + '</g><ellipse cx="46" cy="46" rx="25" ry="33" fill="none" stroke="#1D4ED8" stroke-width="5"/>' +
      '<path d="M46 79v34" stroke="#1E3A8A" stroke-width="7" stroke-linecap="round"/></g>' +
      '<circle cx="90" cy="88" r="18" fill="' + url('t') + '"/><path d="M74 80c10 4 12 14 6 22M106 96c-10-4-12-14-6-22" stroke="#fff" stroke-width="2.4" fill="none"/>';
  };
  L.bike = ['una bicicleta', 'a bicycle'];
  D.bike = function () {
    function wheel(cx) {
      var sp = '';
      for (var i = 0; i < 8; i++) { var a = i * Math.PI / 8; sp += '<path d="M' + (cx - 20 * Math.cos(a)).toFixed(1) + ' ' + (80 - 20 * Math.sin(a)).toFixed(1) + 'L' + (cx + 20 * Math.cos(a)).toFixed(1) + ' ' + (80 + 20 * Math.sin(a)).toFixed(1) + '" stroke="#9CA3AF" stroke-width="1"/>'; }
      return sp + '<circle cx="' + cx + '" cy="80" r="22" fill="none" stroke="#1F2937" stroke-width="5"/><circle cx="' + cx + '" cy="80" r="3" fill="#6B7280"/>';
    }
    return shadow(60, 106, 52) + wheel(28) + wheel(92) +
      '<path d="M28 80l20-34h34L92 80M48 46l14 34 20-34M62 80H28" stroke="#DC2626" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
      '<path d="M46 46l-4-10" stroke="#1F2937" stroke-width="4"/><path d="M34 34h16" stroke="#1F2937" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M82 46l-4-14h12" stroke="#1F2937" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="62" cy="80" r="6" fill="none" stroke="#1F2937" stroke-width="3"/>';
  };
  L['chess-knight'] = ['el caballo del ajedrez', 'the chess knight'];
  D['chess-knight'] = function () {
    return '<defs>' + lin('k', 0, 0, 1, 1, [[0, '#57534E'], [1, '#1C1917']]) + '</defs>' + shadow(60, 112, 36) +
      '<path d="M30 108h60v-10H30z" fill="' + url('k') + '"/><path d="M36 98h48l-4-10H40z" fill="' + url('k') + '"/>' +
      '<path d="M42 88c0-16 10-24 12-34-8 4-16 4-20-2-2-6 6-10 10-16 6-8 10-18 18-22l2 8c14 2 26 16 26 40 0 10-2 18-6 26z" fill="' + url('k') + '"/>' +
      '<circle cx="56" cy="34" r="3" fill="#E7E5E4"/><path d="M62 18c10 2 18 10 20 22" stroke="#A8A29E" stroke-width="2" fill="none" opacity=".6"/>' +
      '<path d="M34 50c4 2 8 2 10 0" stroke="#A8A29E" stroke-width="1.6" fill="none"/>';
  };
  // Faith
  L.cross = ['una cruz', 'a cross'];
  D.cross = function () {
    return '<defs>' + lin('c', 0, 0, 1, 0, [[0, '#92400E'], [.5, '#D97706'], [1, '#78350F']]) + rad('g', .5, .38, .5, [[0, '#FEF3C7'], [1, '#FEF3C7', 0]]) + '</defs>' +
      '<circle cx="60" cy="42" r="48" fill="' + url('g') + '"/>' + shadow(60, 112, 26) +
      '<path d="M52 10h16v26h24v16H68v58H52V52H28V36h24z" fill="' + url('c') + '" stroke="#78350F" stroke-width="1.5"/>' +
      '<path d="M56 16v90M34 42h52" stroke="#FCD34D" stroke-width="1.2" opacity=".5"/>';
  };
  L.rosary = ['un rosario', 'a rosary'];
  D.rosary = function () {
    var beads = '', i, n = 30;
    for (i = 0; i < n; i++) {
      var a = Math.PI / 2 + (i + 0.5) * 2 * Math.PI / n, x = 60 + 36 * Math.cos(a) * 1.05, y = 44 + 32 * Math.sin(a);
      beads += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 11 === 5 ? 4.6 : 3.4) + '" fill="' + url('b') + '"/>';
    }
    return '<defs>' + rad('b', .35, .3, .7, [[0, '#E0E7FF'], [1, '#4F46E5']]) + lin('c', 0, 0, 1, 0, [[0, '#A16207'], [.5, '#FDE047'], [1, '#A16207']]) + '</defs>' +
      '<ellipse cx="60" cy="44" rx="38" ry="32" fill="none" stroke="#A5B4FC" stroke-width="1"/>' + beads +
      '<path d="M60 76v10" stroke="#A5B4FC"/><circle cx="60" cy="82" r="4" fill="' + url('b') + '"/><circle cx="60" cy="90" r="3.4" fill="' + url('b') + '"/>' +
      '<path d="M57 94h6v8h8v6h-8v12h-6v-12h-8v-6h8z" fill="' + url('c') + '"/>';
  };
  L.dove = ['una paloma', 'a dove'];
  D.dove = function () {
    return '<defs>' + lin('w', 0, 0, 0, 1, [[0, '#FFFFFF'], [1, '#CBD5E1']]) + '</defs>' +
      '<path d="M58 52C48 30 30 18 10 18c10 10 14 22 18 34z" fill="' + url('w') + '" stroke="#94A3B8" stroke-width="1.2"/>' +
      '<path d="M18 30h14M22 40h14" stroke="#CBD5E1" stroke-width="1.4"/>' +
      '<path d="M26 60c10-10 30-14 48-10 10 2 18-4 22-10 6 0 10 4 10 8l-10 4c-4 18-20 28-38 28-6 4-14 10-24 12 4-6 6-12 6-16-8-4-14-10-14-16z" fill="' + url('w') + '" stroke="#94A3B8" stroke-width="1.2"/>' +
      '<path d="M60 52c4-18 18-34 40-40-4 12-10 24-18 32z" fill="' + url('w') + '" stroke="#94A3B8" stroke-width="1.2"/>' +
      '<circle cx="98" cy="44" r="1.8" fill="#111"/><path d="M106 46l8 1-8 3z" fill="#F59E0B"/>' +
      '<path d="M110 50c-4 10-14 14-22 14" stroke="#4D7C0F" stroke-width="2" fill="none"/><ellipse cx="96" cy="60" rx="5" ry="2.4" fill="#65A30D" transform="rotate(-30 96 60)"/><ellipse cx="104" cy="56" rx="5" ry="2.4" fill="#65A30D" transform="rotate(20 104 56)"/>';
  };
  L.ark = ['el arca de Noé', 'Noah’s ark'];
  D.ark = function () {
    return '<defs>' + lin('h', 0, 0, 0, 1, [[0, '#B45309'], [1, '#78350F']]) + lin('s', 0, 0, 0, 1, [[0, '#93C5FD'], [1, '#2563EB']]) + '</defs>' +
      '<path d="M0 92q15-6 30 0t30 0 30 0 30 0v28H0z" fill="' + url('s') + '"/>' +
      '<rect x="36" y="40" width="48" height="26" fill="#D6A35C" stroke="#78350F" stroke-width="1.5"/><path d="M30 42l30-16 30 16z" fill="#92400E"/>' +
      '<rect x="44" y="48" width="9" height="9" fill="#1C1917"/><rect x="67" y="48" width="9" height="9" fill="#1C1917"/>' +
      '<path d="M8 64h104l-12 26H20z" fill="' + url('h') + '"/><path d="M12 72h96M16 80h88" stroke="#5B3A12" stroke-width="1.2"/>' +
      '<path d="M88 64V30l4-6h6l-2 6v34" fill="#F5C26B"/><circle cx="96" cy="28" r="1.4" fill="#111"/><path d="M90 40h4M90 50h4" stroke="#B45309" stroke-width="2"/>' +
      '<circle cx="26" cy="58" r="6" fill="#A8A29E"/><circle cx="24" cy="56" r="1.2" fill="#111"/><path d="M20 54l-4-4" stroke="#A8A29E" stroke-width="3"/>' +
      '<path d="M60 10q14 -4 20 8" stroke="#EF4444" stroke-width="2" fill="none"/><path d="M58 12q16 -6 24 8" stroke="#FACC15" stroke-width="2" fill="none"/><path d="M56 14q18 -8 28 8" stroke="#22C55E" stroke-width="2" fill="none"/>';
  };
  // Christmas
  L['xmas-tree'] = ['un árbol de Navidad', 'a Christmas tree'];
  D['xmas-tree'] = function () {
    return '<defs>' + lin('t', 0, 0, 1, 0, [[0, '#166534'], [.5, '#22C55E'], [1, '#14532D']]) + '</defs>' + shadow(60, 112, 40) +
      '<rect x="54" y="96" width="12" height="14" fill="#78350F"/>' +
      '<path d="M60 18L34 52h12L26 76h14L16 100h88L80 76h14L74 52h12z" fill="' + url('t') + '"/>' +
      '<path d="M40 60q20 10 40 -2M34 84q26 12 52 -2" stroke="#FDE68A" stroke-width="2" fill="none"/>' +
      '<circle cx="48" cy="62" r="4" fill="#EF4444"/><circle cx="72" cy="58" r="4" fill="#3B82F6"/><circle cx="60" cy="74" r="4" fill="#FACC15"/><circle cx="40" cy="88" r="4" fill="#A855F7"/><circle cx="78" cy="88" r="4" fill="#EF4444"/><circle cx="58" cy="44" r="3.4" fill="#F97316"/>' +
      '<polygon points="' + star(60, 16, 11, 4.6, 5) + '" fill="#FACC15" stroke="#CA8A04" stroke-width="1"/>' +
      '<rect x="82" y="98" width="18" height="14" fill="#DC2626"/><path d="M91 98v14M82 104h18" stroke="#FDE68A" stroke-width="2"/>' +
      '<rect x="18" y="100" width="16" height="12" fill="#2563EB"/><path d="M26 100v12M18 106h16" stroke="#F5F5F4" stroke-width="2"/>';
  };
  L.nativity = ['el pesebre', 'the nativity scene'];
  D.nativity = function () {
    return '<defs>' + lin('n', 0, 0, 0, 1, [[0, '#1E3A8A'], [1, '#4338CA']]) + rad('l', .5, .7, .5, [[0, '#FEF3C7'], [1, '#FDE68A', 0]]) + lin('w', 0, 0, 1, 0, [[0, '#92400E'], [1, '#B45309']]) + '</defs>' +
      '<rect width="120" height="120" rx="14" fill="' + url('n') + '"/>' +
      '<polygon points="' + star(96, 16, 8, 3, 4) + '" fill="#FEF9C3"/><path d="M96 24L76 44" stroke="#FEF9C3" stroke-width="1.5" opacity=".7"/>' +
      '<circle cx="18" cy="20" r="1.4" fill="#fff"/><circle cx="40" cy="12" r="1" fill="#fff"/><circle cx="64" cy="22" r="1.2" fill="#fff"/>' +
      '<path d="M0 104h120v16H0z" fill="#3F2A1C"/>' +
      '<path d="M14 50L60 26l46 24v54H14z" fill="#5B3A1A"/><path d="M8 52L60 24l52 28" stroke="' + url('w') + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<rect x="22" y="54" width="76" height="50" fill="' + url('l') + '"/>' +
      '<path d="M36 104V78c0-8 4-12 8-12s8 4 8 12v26z" fill="#2563EB"/><circle cx="44" cy="62" r="6" fill="#F5D0A9"/><path d="M36 64c0-10 16-10 16 0v6H36z" fill="#93C5FD"/>' +
      '<path d="M70 104V74c0-8 4-12 8-12s8 4 8 12v30z" fill="#92400E"/><circle cx="78" cy="58" r="6" fill="#F5D0A9"/><path d="M71 56c2-6 12-6 14 0" fill="#57340F"/><path d="M88 60v44" stroke="#78350F" stroke-width="2.4"/>' +
      '<path d="M50 96h22l-4 8H54z" fill="#A16207"/><path d="M50 94q11-6 22 0" fill="#FDE68A"/><circle cx="61" cy="91" r="4" fill="#F5D0A9"/>' +
      '<circle cx="61" cy="90" r="8" fill="#FEF3C7" opacity=".35"/>';
  };
  L['star-bethlehem'] = ['la estrella de Belén', 'the star of Bethlehem'];
  D['star-bethlehem'] = function () {
    return '<defs>' + rad('g', .5, .5, .5, [[0, '#FEF9C3'], [1, '#FEF9C3', 0]]) + lin('t', 1, 0, 0, 1, [[0, '#FDE047'], [1, '#FDE047', 0]]) + '</defs>' +
      '<rect width="120" height="120" rx="14" fill="#1E293B"/>' +
      '<path d="M70 44L10 110l12 2 54-62z" fill="' + url('t') + '" opacity=".8"/>' +
      '<circle cx="72" cy="42" r="30" fill="' + url('g') + '"/>' +
      '<polygon points="' + star(72, 42, 22, 5, 4) + '" fill="#FEF08A"/><polygon points="' + star(72, 42, 13, 4, 4, -45) + '" fill="#FDE047"/>' +
      '<circle cx="20" cy="22" r="1.4" fill="#fff"/><circle cx="104" cy="90" r="1.2" fill="#fff"/><circle cx="102" cy="14" r="1" fill="#fff"/><circle cx="40" cy="60" r="1" fill="#fff"/>';
  };
  L.star = ['una estrella', 'a star'];
  D.star = function () { return '<defs>' + lin('s', 0, 0, 1, 1, [[0, '#FEF08A'], [1, '#EAB308']]) + '</defs><polygon points="' + star(60, 62, 50, 21, 5) + '" fill="' + url('s') + '" stroke="#A16207" stroke-width="3" stroke-linejoin="round"/>'; };
  L.bell = ['una campana', 'a bell'];
  D.bell = function () {
    return '<defs>' + lin('g', 0, 0, 1, 0, [[0, '#B45309'], [.4, '#FDE68A'], [1, '#A16207']]) + '</defs>' + shadow(60, 112, 30) +
      '<path d="M60 20c-18 0-26 14-26 34 0 18-6 26-14 34h80c-8-8-14-16-14-34 0-20-8-34-26-34z" fill="' + url('g') + '" stroke="#92400E" stroke-width="1.5"/>' +
      '<rect x="18" y="86" width="84" height="8" rx="4" fill="#B45309"/><circle cx="60" cy="100" r="7" fill="#92400E"/>' +
      '<path d="M44 12c6 8 26 8 32 0-6-6-26-6-32 0z" fill="#DC2626"/><path d="M60 12l-14 14M60 12l14 14" stroke="#DC2626" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M86 22c8-4 18 0 16 8-8 2-14-2-16-8zM34 22c-8-4-18 0-16 8 8 2 14-2 16-8z" fill="#15803D"/><circle cx="60" cy="18" r="3" fill="#B91C1C"/>' + shine(48, 46, 4, 14, 8);
  };
  L['candy-cane'] = ['un bastón de caramelo', 'a candy cane'];
  D['candy-cane'] = function () {
    var stripes = '';
    for (var i = -10; i < 16; i++) stripes += '<path d="M' + (i * 10) + ' 120L' + (i * 10 + 60) + ' 0" stroke="#DC2626" stroke-width="6"/>';
    return '<defs><clipPath id="' + u('c') + '"><path d="M50 112V44a20 20 0 0 1 40 0v6h-12v-6a8 8 0 0 0-16 0v68z"/></clipPath></defs>' + shadow(58, 114, 16) +
      '<path d="M50 112V44a20 20 0 0 1 40 0v6h-12v-6a8 8 0 0 0-16 0v68z" fill="#fff" stroke="#E5E7EB"/>' +
      '<g clip-path="url(#' + u('c') + ')">' + stripes + '</g>' +
      '<path d="M53 106V46" stroke="#fff" stroke-width="2" opacity=".6"/>' +
      '<path d="M48 78c-10-6-22-2-24 6 10 4 20 2 24-6zM64 78c10-6 22-2 24 6-10 4-20 2-24-6z" fill="#15803D"/><circle cx="56" cy="80" r="4" fill="#B91C1C"/>';
  };
  L.gift = ['un regalo', 'a present'];
  D.gift = function () {
    return '<defs>' + lin('b', 0, 0, 1, 1, [[0, '#F87171'], [1, '#B91C1C']]) + lin('r', 0, 0, 1, 0, [[0, '#FDE68A'], [1, '#EAB308']]) + '</defs>' + shadow(60, 112, 44) +
      '<rect x="18" y="50" width="84" height="58" rx="3" fill="' + url('b') + '"/><rect x="12" y="38" width="96" height="18" rx="3" fill="#EF4444"/>' +
      '<rect x="52" y="38" width="16" height="70" fill="' + url('r') + '"/>' +
      '<path d="M60 38c-10-20-34-22-30-8 4 10 22 8 30 8zM60 38c10-20 34-22 30-8-4 10-22 8-30 8z" fill="' + url('r') + '" stroke="#CA8A04" stroke-width="1.5"/>' +
      '<circle cx="60" cy="38" r="6" fill="#EAB308"/>' + shine(32, 62, 4, 10, 10);
  };
  L['advent-wreath'] = ['una corona de Adviento', 'an Advent wreath'];
  D['advent-wreath'] = function () {
    var leaves = '', i;
    for (i = 0; i < 22; i++) { var a = i * 2 * Math.PI / 22, x = 60 + 42 * Math.cos(a), y = 88 + 14 * Math.sin(a); leaves += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="9" ry="4" fill="' + (i % 2 ? '#166534' : '#22C55E') + '" transform="rotate(' + (a * 180 / Math.PI + 90).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'; }
    function candle(x, h, col, lit) {
      return '<rect x="' + (x - 5) + '" y="' + (84 - h) + '" width="10" height="' + h + '" rx="2" fill="' + col + '"/><path d="M' + x + ' ' + (84 - h) + 'v-4" stroke="#1C1917" stroke-width="1.4"/>' +
        (lit ? '<ellipse cx="' + x + '" cy="' + (84 - h - 10) + '" rx="4" ry="8" fill="' + url('fl') + '"/><circle cx="' + x + '" cy="' + (84 - h - 8) + '" r="12" fill="#FEF3C7" opacity=".35"/>' : '');
    }
    return '<defs>' + lin('fl', 0, 0, 0, 1, [[0, '#FEF9C3'], [.6, '#FB923C'], [1, '#EA580C']]) + '</defs>' + shadow(60, 108, 50) +
      '<ellipse cx="60" cy="88" rx="44" ry="16" fill="#14532D"/>' + leaves +
      candle(30, 36, '#7E22CE', true) + candle(50, 42, '#7E22CE', false) + candle(70, 42, '#F472B6', false) + candle(90, 36, '#7E22CE', false) +
      '<circle cx="40" cy="98" r="3" fill="#DC2626"/><circle cx="80" cy="100" r="3" fill="#DC2626"/><circle cx="60" cy="104" r="3" fill="#DC2626"/>';
  };
  L.poinsettia = ['una flor de Pascua', 'a poinsettia'];
  D.poinsettia = function () {
    var p = '', i;
    for (i = 0; i < 8; i++) p += '<path d="M60 60C52 44 54 22 60 10c6 12 8 34 0 50z" fill="' + url(i % 2 ? 'r2' : 'r') + '" transform="rotate(' + (i * 45 + 22) + ' 60 60)"/>';
    var g = '';
    for (i = 0; i < 4; i++) g += '<path d="M60 60C50 46 52 26 60 14c8 12 10 32 0 46z" fill="#15803D" transform="rotate(' + (i * 90) + ' 60 60) scale(1.1) translate(-5 -5)"/>';
    return '<defs>' + lin('r', 0, 0, 1, 1, [[0, '#F87171'], [1, '#B91C1C']]) + lin('r2', 0, 0, 1, 1, [[0, '#EF4444'], [1, '#991B1B']]) + '</defs>' + g + p +
      '<circle cx="60" cy="60" r="6" fill="#FACC15"/><circle cx="56" cy="57" r="2" fill="#84CC16"/><circle cx="64" cy="58" r="2" fill="#84CC16"/><circle cx="60" cy="64" r="2" fill="#84CC16"/>';
  };
  // Subject icons (small, for the setup chips and the question badge)
  L['cat-ciencia'] = ['Ciencia', 'Science'];
  D['cat-ciencia'] = function () {
    return '<defs>' + lin('l', 0, 0, 0, 1, [[0, '#67E8F9'], [1, '#0891B2']]) + '</defs>' +
      '<path d="M48 12h24M52 12v34L26 96c-4 8 2 14 10 14h48c8 0 14-6 10-14L68 46V12" fill="#F0FDFA" stroke="#0E7490" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M34 80h52l8 16c2 6-2 10-8 10H34c-6 0-10-4-8-10z" fill="' + url('l') + '"/>' +
      '<circle cx="50" cy="88" r="4" fill="#fff" opacity=".8"/><circle cx="66" cy="94" r="3" fill="#fff" opacity=".8"/><circle cx="58" cy="70" r="3" fill="#67E8F9"/><circle cx="64" cy="58" r="2" fill="#67E8F9"/>';
  };
  L['cat-mate'] = ['Matemáticas', 'Math'];
  D['cat-mate'] = function () {
    return '<rect x="14" y="14" width="92" height="92" rx="18" fill="#EEF2FF" stroke="#4338CA" stroke-width="4"/>' +
      '<path d="M36 40h16M44 32v16M70 40h16M36 78l14 14M50 78L36 92M70 80h16M70 90h16" stroke="#4338CA" stroke-width="6" stroke-linecap="round"/>';
  };
  L['cat-historia'] = ['Historia', 'History'];
  D['cat-historia'] = function () {
    return '<defs>' + lin('c', 0, 0, 1, 0, [[0, '#D6C3A1'], [.5, '#FFF8E7'], [1, '#C4A97E']]) + '</defs>' +
      '<path d="M14 30L60 8l46 22z" fill="' + url('c') + '" stroke="#92400E" stroke-width="3" stroke-linejoin="round"/><rect x="14" y="30" width="92" height="8" fill="' + url('c') + '" stroke="#92400E" stroke-width="3"/>' +
      '<path d="M24 40v54M40 40v54M56 40v54M72 40v54M88 40v54" stroke="' + url('c') + '" stroke-width="10"/>' +
      '<path d="M24 40v54M40 40v54M56 40v54M72 40v54M88 40v54" stroke="#C4A97E" stroke-width="1.5" opacity=".7"/>' +
      '<rect x="10" y="94" width="100" height="10" fill="' + url('c') + '" stroke="#92400E" stroke-width="3"/>';
  };
  L['cat-biblia'] = ['La Biblia', 'The Bible'];
  D['cat-biblia'] = function () {
    return '<defs>' + lin('b', 0, 0, 1, 1, [[0, '#B45309'], [1, '#7C2D12']]) + '</defs>' + shadow(60, 110, 40) +
      '<path d="M16 22c16-6 32-6 44 4v80c-12-10-28-10-44-4z" fill="#FFFBEB" stroke="' + url('b') + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M104 22c-16-6-32-6-44 4v80c12-10 28-10 44-4z" fill="#FFFBEB" stroke="' + url('b') + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M26 40h24M26 50h24M26 60h20M70 40h24M70 50h24M74 60h20" stroke="#D6D3D1" stroke-width="3"/>' +
      '<path d="M82 66v24M74 74h16" stroke="#B45309" stroke-width="4"/><path d="M60 26v80" stroke="#7C2D12" stroke-width="3"/>';
  };
  L['cat-musica'] = ['Música', 'Music'];
  D['cat-musica'] = function () {
    return '<defs>' + lin('n', 0, 0, 1, 1, [[0, '#F472B6'], [1, '#9D174D']]) + '</defs>' +
      '<path d="M44 26l52-12v62" stroke="' + url('n') + '" stroke-width="8" fill="none" stroke-linejoin="round"/><path d="M44 26v64" stroke="' + url('n') + '" stroke-width="8"/>' +
      '<path d="M44 34l52-12" stroke="' + url('n') + '" stroke-width="10"/>' +
      '<ellipse cx="32" cy="92" rx="16" ry="12" fill="' + url('n') + '" transform="rotate(-20 32 92)"/><ellipse cx="84" cy="80" rx="16" ry="12" fill="' + url('n') + '" transform="rotate(-20 84 80)"/>';
  };
  L['cat-deportes'] = L.ball; D['cat-deportes'] = function () { return D.ball(); };
  L['cat-navidad'] = L['xmas-tree']; D['cat-navidad'] = function () { return D['xmas-tree'](); };
  L['cat-geo'] = L.earth; D['cat-geo'] = function () { return D.earth(); };
  L['cat-fe'] = L.cross; D['cat-fe'] = function () { return D.cross(); };
  L['cat-arte'] = L.palette; D['cat-arte'] = function () { return D.palette(); };
  L['cat-naturaleza'] = L.araucaria; D['cat-naturaleza'] = function () { return D.araucaria(); };
  L['cat-chile'] = ['Chile', 'Chile'];
  D['cat-chile'] = function () {
    return '<rect x="6" y="22" width="108" height="76" rx="8" fill="#fff" stroke="#D6D3D1" stroke-width="2"/>' +
      '<path d="M6 60h108v30a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z" fill="#D52B1E"/><path d="M14 22h28v38H6V30a8 8 0 0 1 8-8z" fill="#0039A6"/>' +
      '<polygon points="' + star(24, 41, 10, 4, 5) + '" fill="#fff"/>';
  };
  // The podium and the trophy, for the end of the game
  L.trophy = ['un trofeo', 'a trophy'];
  D.trophy = function () {
    return '<defs>' + lin('g', 0, 0, 1, 0, [[0, '#B45309'], [.45, '#FDE68A'], [1, '#A16207']]) + '</defs>' + shadow(60, 112, 30) +
      '<path d="M34 14h52v20c0 20-12 34-26 34S34 54 34 34z" fill="' + url('g') + '" stroke="#92400E" stroke-width="2"/>' +
      '<path d="M34 22H18c0 18 8 26 18 26M86 22h16c0 18-8 26-18 26" stroke="' + url('g') + '" stroke-width="6" fill="none"/>' +
      '<rect x="54" y="66" width="12" height="18" fill="' + url('g') + '"/><rect x="38" y="84" width="44" height="10" rx="2" fill="' + url('g') + '"/>' +
      '<rect x="32" y="94" width="56" height="14" rx="3" fill="#57340F"/><rect x="46" y="98" width="28" height="6" rx="1" fill="#FDE68A"/>' +
      '<polygon points="' + star(60, 36, 10, 4, 5) + '" fill="#FEF9C3"/>' + shine(44, 30, 4, 12, 10);
  };

  // ── Counting cards ('count:apple:5') ────────────────────────────
  var COUNT_ITEM = { apple: 'apple', star: 'star', fish: 'fish', ladybug: 'ladybug', bell: 'bell' };
  function counting(spec) {
    var p = spec.split(':'), item = COUNT_ITEM[p[1]], n = Math.max(1, Math.min(10, p[2] | 0));
    if (!item) return '';
    var cols = n <= 4 ? n : n <= 6 ? 3 : 4, rows = Math.ceil(n / cols), s = Math.min(240 / cols, 160 / rows), out = '';
    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
      var x = 120 - inRow * s / 2 + c * s, y = 80 - rows * s / 2 + r * s;
      P = 'tv' + (++uid) + '-';
      out += '<svg x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (s * 0.92).toFixed(1) + '" height="' + (s * 0.92).toFixed(1) + '" viewBox="0 0 120 120">' + D[item]() + '</svg>';
    }
    return out;
  }

  // ── Public: draw ────────────────────────────────────────────────
  function has(id) {
    if (!id) return false;
    if (id.indexOf('flag-') === 0) return typeof WorldMap !== 'undefined' && WorldMap.hasFlag(id.slice(5));
    if (id.indexOf('count:') === 0) return !!COUNT_ITEM[id.split(':')[1]];
    return !!D[id];
  }
  function label(id) {
    if (!id) return { es: '', en: '' };
    if (id.indexOf('flag-') === 0) {
      var code = id.slice(5), c = null;
      if (typeof WORLD_ATLAS_DATA !== 'undefined') WORLD_ATLAS_DATA.forEach(function (x) { if (x.id === code) c = x; });
      return c ? { es: 'la bandera de ' + c.nameEs, en: 'the flag of ' + c.name } : { es: 'una bandera', en: 'a flag' };
    }
    if (id.indexOf('count:') === 0) return { es: 'un dibujo para contar', en: 'a picture to count' };
    var l = L[id];
    return l ? { es: l[0], en: l[1] } : { es: '', en: '' };
  }
  function draw(id, opts) {
    opts = opts || {};
    if (!has(id)) return '';
    var lab = opts.label === false ? '' : (opts.label || '');
    if (id.indexOf('flag-') === 0) {
      var code = id.slice(5), ratio = WorldMap.flagRatio(code), w = 108, h = w / ratio;
      if (h > 80) { h = 80; w = h * ratio; }
      var inner = WorldMap.flag(code, { wave: true });
      return svg('<rect x="' + (60 - w / 2 - 3).toFixed(1) + '" y="' + (60 - h / 2 - 3).toFixed(1) + '" width="' + (w + 6).toFixed(1) + '" height="' + (h + 6).toFixed(1) + '" rx="4" fill="#E7E5E4"/>' +
        inner.replace('<svg ', '<svg x="' + (60 - w / 2).toFixed(1) + '" y="' + (60 - h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" '), lab);
    }
    if (id.indexOf('count:') === 0) return svg(counting(id), lab, '0 0 240 160');
    P = 'tv' + (++uid) + '-';
    return svg(D[id](), lab);
  }

  // ── Maps ────────────────────────────────────────────────────────
  var PIN = ['#2563EB', '#DC2626', '#059669', '#D97706'];
  var LETTERS = ['A', 'B', 'C', 'D'];
  function f1(n) { return Math.round(n * 10) / 10; }
  function badge(x, y, i, r, dim) {
    return '<g class="tv-pin" opacity="' + (dim ? .35 : 1) + '"><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + PIN[i] + '" stroke="#fff" stroke-width="' + f1(r * .22) + '"/>' +
      '<text x="' + f1(x) + '" y="' + f1(y + r * .38) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="' + f1(r * 1.1) + '" fill="#fff">' + LETTERS[i] + '</text></g>';
  }
  // codes: in the order the letters are shown. opts.right (index in codes)
  // and opts.picked once answered.
  function map(kind, codes, opts) {
    opts = opts || {};
    var done = opts.state === 'done';
    if (kind === 'chile') return chileMap(codes, opts, done);
    if (typeof WorldMap === 'undefined') return '';
    var WM = WorldMap, body = '', pins = '';
    if (kind === 'cont') {
      var all = WM.codes(), cx = {}, cy = {}, ca = {};
      all.forEach(function (c) {
        var k = WM.continentOf(c), inf = WM.info(c), i = codes.indexOf(k);
        var fill = i >= 0 ? (done && i !== opts.right ? '#CBD5E1' : PIN[i]) : '#E7E5E4';
        body += '<path d="' + WM.path(c) + '" fill="' + fill + '" stroke="#fff" stroke-width="0.6"/>';
        if (inf && k) { ca[k] = (ca[k] || 0) + inf.a; cx[k] = (cx[k] || 0) + inf.c[0] * inf.a; cy[k] = (cy[k] || 0) + inf.c[1] * inf.a; }
      });
      var NUDGE = { na: [60, 60], oc: [-10, -10], eu: [-20, 80], as: [60, 20], sa: [10, -20], af: [0, -20] };
      codes.forEach(function (k, i) {
        if (!ca[k]) return;
        var n = NUDGE[k] || [0, 0];
        pins += badge(cx[k] / ca[k] + n[0], cy[k] / ca[k] + n[1], i, 62, done && i !== opts.right);
      });
      return '<svg class="tv-map" viewBox="40 60 ' + (WM.W - 80) + ' ' + (WM.H - 150) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.aria || '') + '">' +
        '<path d="' + WM.outline() + '" fill="#E0F2FE"/>' + body + pins + '</svg>';
    }
    // world: zoom to the four countries
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    codes.forEach(function (c) { var b = (WM.info(c) || {}).b; if (!b) return; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); });
    var w = x1 - x0, h = y1 - y0, pad = Math.max(w, h) * 0.12 + 12;
    x0 -= pad; y0 -= pad; w += pad * 2; h += pad * 2;
    // Not too tall or too wide for the screen.
    if (w < h * 0.9) { var dx = (h * 0.9 - w) / 2; x0 -= dx; w = h * 0.9; }
    if (h < w * 0.6) { var dy = (w * 0.6 - h) / 2; y0 -= dy; h = w * 0.6; }
    WM.codes().forEach(function (c) {
      var b = (WM.info(c) || {}).b, i = codes.indexOf(c);
      if (b && (b[2] < x0 || b[0] > x0 + w || b[3] < y0 || b[1] > y0 + h)) return;
      var fill = i >= 0 ? (done && i !== opts.right ? '#CBD5E1' : PIN[i]) : '#EDEAE4';
      body += '<path d="' + WM.path(c) + '" fill="' + fill + '" fill-opacity="' + (i >= 0 ? .85 : 1) + '" stroke="#fff" stroke-width="' + f1(Math.max(w, h) / 400) + '"' + (i >= 0 ? ' data-pick="' + i + '"' : '') + '/>';
    });
    var r = Math.max(w, h) * 0.045;
    codes.forEach(function (c, i) {
      var inf = WM.info(c);
      if (inf) pins += badge(inf.c[0], inf.c[1], i, r, done && i !== opts.right);
    });
    return '<svg class="tv-map" viewBox="' + [x0, y0, w, h].map(f1).join(' ') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.aria || '') + '">' +
      '<rect x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="#DBEAFE"/>' + body + pins + '</svg>';
  }
  function chileMap(codes, opts, done) {
    if (typeof DC_GEO === 'undefined') return '';
    var G = DC_GEO, body = '', pins = '', x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    G.regions.forEach(function (r) {
      if (codes.indexOf(r.id) < 0) return;
      x0 = Math.min(x0, r.bb[0]); y0 = Math.min(y0, r.bb[1]); x1 = Math.max(x1, r.bb[2]); y1 = Math.max(y1, r.bb[3]);
    });
    var h = y1 - y0, pad = h * 0.1 + 20;
    y0 = Math.max(0, y0 - pad); h = Math.min(G.H - y0, h + pad * 2);
    var w = Math.max(h * 0.55, x1 - x0 + 80), cxm = (x0 + x1) / 2;
    x0 = cxm - w / 2;
    (G.neighbours || []).forEach(function (n) { body += '<path d="' + n.d + '" fill="#EDEAE4" stroke="#fff" stroke-width="2"/>'; });
    G.regions.forEach(function (r) {
      var i = codes.indexOf(r.id);
      var fill = i >= 0 ? (done && i !== opts.right ? '#CBD5E1' : PIN[i]) : '#F5F0E6';
      body += '<path d="' + r.d + '" fill="' + fill + '" fill-opacity="' + (i >= 0 ? .85 : 1) + '" stroke="#A8A29E" stroke-width="1.6"' + (i >= 0 ? ' data-pick="' + i + '"' : '') + '/>';
    });
    var rr = Math.max(16, h * 0.035);
    codes.forEach(function (id, i) {
      G.regions.forEach(function (r) { if (r.id === id) pins += badge(r.c[0] + (r.id === 'MA' ? 30 : 0), r.c[1], i, rr, done && i !== opts.right); });
    });
    return '<svg class="tv-map tv-map-chile" viewBox="' + [x0, y0, w, h].map(f1).join(' ') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.aria || '') + '">' +
      '<rect x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="#DBEAFE"/>' + body + pins + '</svg>';
  }

  // A podium for the final scores: places [1st, 2nd, 3rd] as HTML-safe
  // names are drawn by the page; this is just the steps.
  function podium() {
    P = 'tv' + (++uid) + '-';
    return svg('<defs>' + lin('a', 0, 0, 0, 1, [[0, '#FDE68A'], [1, '#D97706']]) + lin('b', 0, 0, 0, 1, [[0, '#E5E7EB'], [1, '#9CA3AF']]) + lin('c', 0, 0, 0, 1, [[0, '#FDBA74'], [1, '#B45309']]) + '</defs>' +
      '<rect x="8" y="64" width="72" height="56" rx="6" fill="' + url('b') + '"/><rect x="84" y="36" width="72" height="84" rx="6" fill="' + url('a') + '"/><rect x="160" y="80" width="72" height="40" rx="6" fill="' + url('c') + '"/>' +
      '<text x="44" y="100" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="30" fill="#fff">2</text>' +
      '<text x="120" y="88" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="38" fill="#fff">1</text>' +
      '<text x="196" y="110" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="26" fill="#fff">3</text>', '', '0 0 240 120');
  }

  return { draw: draw, label: label, has: has, map: map, podium: podium, PIN: PIN, LETTERS: LETTERS, ids: function () { return Object.keys(D); } };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TriviaArt;
