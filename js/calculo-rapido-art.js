/* ================================================================
   CÁLCULO RÁPIDO — art (calculo-rapido-art.js)
   Hand-built SVG for the app, drawn from the numbers of each problem:
   the notebook hero, ten-frames and counters for beginners, topic
   icons, the Estimate number line, the personal-best graph, and an
   engineer's diagram for every kind of problem. Strings in, strings
   out; no storage, no network.
   ================================================================ */
var CalculoArt = (function () {
  'use strict';

  var INK = '#17324d', TEAL = '#0f766e', TEAL_L = '#99f6e4', TEAL_D = '#115e59', AMBER = '#f59e0b', ORANGE = '#ea580c',
      BLUE = '#2563eb', PAPER = '#fffdf5', GRID = '#cfe0ec', RED = '#c2410c', GREEN = '#15803d', WOOD = '#d9a867', WATER = '#7dd3fc';
  var FONT = "'Baloo 2','Nunito',system-ui,sans-serif";
  var _uid = 0;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(x, es) { return (typeof CalculoEngine !== 'undefined') ? CalculoEngine.fmtNum(x, es) : String(x); }

  function svg(vb, inner, label, cls) {
    return '<svg class="' + (cls || 'cr-art') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(label || '') + '" focusable="false">' + inner + '</svg>';
  }
  function T(x, y, txt, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-family="' + FONT + '" font-weight="' + (o.w || 800) + '" font-size="' + (o.s || 13) +
      '" fill="' + (o.c || INK) + '" text-anchor="' + (o.a || 'middle') + '"' + (o.rot ? ' transform="rotate(' + o.rot + ' ' + x + ' ' + y + ')"' : '') + '>' + esc(txt) + '</text>';
  }
  function line(x1, y1, x2, y2, c, w, dash) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || INK) + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  }
  function rect(x, y, w, h, fill, stroke, sw, rx) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 2) + '"' : '') + '/>';
  }
  function circ(cx, cy, r, fill, stroke, sw) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 2) + '"' : '') + '/>';
  }
  function path(d, fill, stroke, sw) {
    return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 2) + '" stroke-linejoin="round" stroke-linecap="round"' : '') + '/>';
  }
  // A dimension line with end ticks and a label.
  function dim(x1, y1, x2, y2, label, o) {
    o = o || {};
    var horiz = y1 === y2, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var s = line(x1, y1, x2, y2, TEAL_D, 1.6);
    if (horiz) { s += line(x1, y1 - 4, x1, y1 + 4, TEAL_D, 1.6) + line(x2, y2 - 4, x2, y2 + 4, TEAL_D, 1.6); }
    else { s += line(x1 - 4, y1, x1 + 4, y1, TEAL_D, 1.6) + line(x2 - 4, y2, x2 + 4, y2, TEAL_D, 1.6); }
    var tw = Math.max(26, String(label).length * 7 + 10);
    s += rect(horiz ? mx - tw / 2 : mx - tw / 2 + (o.dx || 0), horiz ? my - 9 + (o.dy || 0) : my - 9, tw, 18, PAPER, null, 0, 6);
    s += T(horiz ? mx : mx + (o.dx || 0), (horiz ? my : my) + 4.5 + (o.dy || 0), label, { s: 12, c: TEAL_D });
    return s;
  }

  // ── the notebook hero ────────────────────────────────────────
  function hero() {
    var id = 'h' + (++_uid), g = '';
    for (var i = 20; i < 340; i += 20) g += line(i, 6, i, 126, GRID, 1);
    for (var j = 20; j < 126; j += 20) g += line(6, j, 334, j, GRID, 1);
    var ticks = '';
    for (var t = 0; t <= 14; t++) ticks += line(34 + t * 16, 112, 34 + t * 16, t % 5 === 0 ? 100 : 105, INK, 1.4);
    return svg('0 0 340 132',
      '<defs><linearGradient id="' + id + 'p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#eef6fb"/></linearGradient>' +
      '<linearGradient id="' + id + 'w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2c885"/><stop offset="1" stop-color="#d9a867"/></linearGradient></defs>' +
      rect(4, 4, 332, 124, 'url(#' + id + 'p)', INK, 2.5, 14) + g +
      // ruler along the bottom
      rect(28, 98, 246, 22, 'url(#' + id + 'w)', '#9a6b2f', 1.6, 3) + ticks + T(250, 114, 'cm', { s: 9, c: '#6b4a1d' }) +
      // set square
      path('M286 24 L322 24 L322 78 Z', 'rgba(15,118,110,.18)', TEAL, 2.2) + circ(312, 40, 5, 'none', TEAL, 1.6) +
      // the sum
      T(110, 50, '12 × 8', { s: 30, c: INK }) + T(110, 78, '≈ 100', { s: 18, c: TEAL }) +
      path('M26 62 q6 -7 12 0 t12 0', 'none', ORANGE, 2.4) +
      // pencil
      '<g transform="rotate(-24 230 60)">' + rect(190, 50, 78, 12, AMBER, '#b45309', 1.6, 2) + path('M268 50 L286 56 L268 62 Z', '#f5d7a3', '#b45309', 1.6) +
      path('M280 54.4 L286 56 L280 57.6 Z', INK) + rect(190, 50, 10, 12, '#fb7185', '#9f1239', 1.4, 2) + '</g>',
      'A notebook page with a ruler, a set square, a pencil and the sum 12 times 8', 'cr-hero');
  }

  // ── ten-frames and counters for beginners ─────────────────────
  function _frame(x, y, filled, mark) {
    // a ten-frame: 2 rows of 5; filled[i] = 0 empty, 1 first colour, 2 second colour, 3 crossed out
    var s = rect(x, y, 5 * 26 + 6, 2 * 26 + 6, '#fff', INK, 2.2, 6);
    for (var i = 0; i < 10; i++) {
      var cx = x + 3 + (i % 5) * 26 + 13, cy = y + 3 + Math.floor(i / 5) * 26 + 13, k = filled[i];
      s += circ(cx, cy, 11, 'none', '#e2e8f0', 1);
      if (k === 1) s += circ(cx, cy, 10, TEAL, TEAL_D, 1.5);
      else if (k === 2) s += circ(cx, cy, 10, AMBER, '#b45309', 1.5);
      else if (k === 3) s += circ(cx, cy, 10, '#e2e8f0', '#94a3b8', 1.5) + line(cx - 6, cy - 6, cx + 6, cy + 6, RED, 2.4) + line(cx + 6, cy - 6, cx - 6, cy + 6, RED, 2.4);
    }
    return s;
  }

  // q: a sprint question {a, b, op, answer}; pictures for + and -.
  function dots(q) {
    var total = q.op === '+' ? q.a + q.b : q.a, cells = [];
    for (var i = 0; i < Math.max(total, 10); i++) cells.push(0);
    if (q.op === '+') { for (var a = 0; a < q.a; a++) cells[a] = 1; for (var b = 0; b < q.b; b++) cells[q.a + b] = 2; }
    else { for (var c = 0; c < q.a; c++) cells[c] = c >= q.a - q.b ? 3 : 1; }
    var frames = cells.length > 10 ? 2 : 1, w = frames === 2 ? 300 : 150, x0 = frames === 2 ? 4 : 0;
    var inner = _frame(x0, 4, cells.slice(0, 10)) + (frames === 2 ? _frame(x0 + 150, 4, cells.slice(10, 20)) : '');
    return svg('0 0 ' + (w + 8) + ' 66', inner, q.op === '+' ? q.a + ' and ' + q.b + ' counters' : q.a + ' counters, ' + q.b + ' crossed out', 'cr-dots');
  }

  // ── icons ────────────────────────────────────────────────────
  var ICONS = {
    ruler: function () { return rect(6, 18, 36, 14, WOOD, '#9a6b2f', 2, 2) + line(12, 18, 12, 25, INK, 1.5) + line(19, 18, 19, 23, INK, 1.5) + line(26, 18, 26, 25, INK, 1.5) + line(33, 18, 33, 23, INK, 1.5); },
    clock: function () { return circ(24, 24, 17, '#fff', INK, 3) + line(24, 24, 24, 13, INK, 3) + line(24, 24, 32, 28, TEAL, 3) + circ(24, 24, 2, INK) + line(24, 4, 24, 8, INK, 3); },
    scale: function () { return path('M10 38 H38', 'none', INK, 3) + path('M24 38 V12', 'none', INK, 3) + path('M8 18 H40', 'none', INK, 3) + path('M8 18 L3 30 H13 Z', TEAL_L, INK, 2) + path('M40 18 L35 30 H45 Z', TEAL_L, INK, 2) + circ(24, 11, 3, AMBER, INK, 1.5); },
    drop: function () { return path('M24 6 C24 6 10 22 10 31 a14 14 0 0 0 28 0 C38 22 24 6 24 6 Z', WATER, '#0369a1', 2.4) + path('M18 30 a6 6 0 0 0 5 6', 'none', '#fff', 2.4); },
    dots: function () { return circ(14, 14, 5, TEAL, TEAL_D, 1.5) + circ(26, 14, 5, TEAL, TEAL_D, 1.5) + circ(38, 14, 5, TEAL, TEAL_D, 1.5) + circ(14, 27, 5, AMBER, '#b45309', 1.5) + circ(26, 27, 5, AMBER, '#b45309', 1.5) + circ(20, 39, 5, BLUE, '#1e3a8a', 1.5); },
    gauge: function () { return path('M6 34 A18 18 0 0 1 42 34', '#fff', INK, 3) + line(24, 34, 33, 21, RED, 3) + circ(24, 34, 3, INK) + line(10, 30, 13, 29, INK, 2) + line(24, 18, 24, 21, INK, 2) + line(38, 30, 35, 29, INK, 2); },
    mountain: function () { return path('M3 38 L19 12 L28 26 L34 18 L45 38 Z', '#94a3b8', INK, 2.4) + path('M19 12 L14 21 L19 19 L23 21 Z', '#fff', INK, 1.5); },
    cup: function () { return path('M11 10 H37 L33 40 H15 Z', 'rgba(125,211,252,.35)', INK, 2.6) + path('M13 22 H35 L33 40 H15 Z', WATER, '#0369a1', 1.5) + line(18, 16, 18, 16, INK, 1); },
    thermo: function () { return rect(20, 5, 9, 28, '#fff', INK, 2.6, 4.5) + circ(24.5, 37, 7, RED, INK, 2.6) + rect(23, 16, 3, 20, RED) + line(32, 12, 36, 12, INK, 2) + line(32, 20, 36, 20, INK, 2) + line(32, 28, 36, 28, INK, 2); },
    coin: function () { return circ(24, 24, 17, AMBER, '#b45309', 3) + circ(24, 24, 11, 'none', '#b45309', 1.8) + T(24, 30, '$', { s: 17, c: '#7c2d12' }); },
    globe: function () { return circ(24, 24, 17, '#bae6fd', INK, 2.6) + path('M24 7 C14 15 14 33 24 41 C34 33 34 15 24 7', 'none', INK, 1.8) + line(7, 24, 41, 24, INK, 1.8) + path('M10 14 H38 M10 34 H38', 'none', INK, 1.4); },
    area: function () { return rect(8, 12, 32, 24, '#d1fae5', TEAL_D, 2.6) + line(8, 24, 40, 24, TEAL, 1.4, '3 3') + line(24, 12, 24, 36, TEAL, 1.4, '3 3'); },
    volume: function () { return path('M10 18 L24 10 L38 18 L24 26 Z', '#bae6fd', INK, 2.2) + path('M10 18 V34 L24 42 V26', '#7dd3fc', INK, 2.2) + path('M38 18 V34 L24 42', '#38bdf8', INK, 2.2); },
    rates: function () { return rect(8, 20, 24, 20, WATER, '#0369a1', 2.4, 3) + path('M32 26 H42 M38 22 L42 26 L38 30', 'none', INK, 2.4) + rect(10, 6, 8, 14, '#cbd5e1', INK, 2, 2); },
    ratio: function () { return rect(5, 14, 12, 20, TEAL, TEAL_D, 2) + rect(17, 14, 12, 20, AMBER, '#b45309', 2) + rect(29, 14, 12, 20, BLUE, '#1e3a8a', 2) + T(24, 44, '1:2:3', { s: 9 }); },
    percent: function () { return circ(14, 14, 6, 'none', INK, 3) + circ(34, 34, 6, 'none', INK, 3) + line(36, 10, 12, 38, TEAL, 3.4); },
    speed: function () { return path('M6 30 H42', 'none', INK, 2) + path('M10 30 V24 L16 18 H30 L36 24 V30', '#fed7aa', INK, 2.4) + circ(16, 32, 4, INK) + circ(32, 32, 4, INK) + line(2, 16, 10, 16, TEAL, 2.4) + line(2, 22, 8, 22, TEAL, 2.4); },
    ohm: function () { return path('M4 24 H12 L15 14 L21 34 L27 14 L33 34 L36 24 H44', 'none', INK, 3) + circ(24, 24, 20, 'none', 'rgba(245,158,11,.6)', 2); },
    bolt: function () { return path('M27 4 L11 28 H22 L19 44 L37 18 H26 Z', AMBER, '#b45309', 2.2); },
    sprint: function () { return path('M24 4 L10 26 H21 L18 44 L38 18 H26 Z', AMBER, '#b45309', 2.2); },
    target: function () { return circ(24, 24, 18, '#fff', INK, 2.6) + circ(24, 24, 11, 'none', RED, 3) + circ(24, 24, 4, RED) + line(24, 24, 40, 8, INK, 2.2); },
    convert: function () { return path('M8 18 H36 M30 10 L38 18 L30 26', 'none', TEAL, 3.2) + path('M40 32 H12 M18 24 L10 32 L18 40', 'none', ORANGE, 3.2); },
    pencil: function () { return '<g transform="rotate(-40 24 24)">' + rect(8, 19, 28, 10, AMBER, '#b45309', 2, 2) + path('M36 19 L45 24 L36 29 Z', '#f5d7a3', '#b45309', 2) + rect(8, 19, 6, 10, '#fb7185', '#9f1239', 1.6, 2) + '</g>'; },
    eraser: function () { return '<g transform="rotate(-30 24 24)">' + rect(8, 15, 32, 18, '#fbcfe8', '#9d174d', 2, 4) + rect(8, 15, 12, 18, '#60a5fa', '#1e3a8a', 2, 4) + '</g>'; }
  };
  function icon(kind, size, cls) {
    var f = ICONS[kind] || ICONS.dots;
    return svg('0 0 48 48', f(), kind, cls || 'cr-icon');
  }

  // ── stars ────────────────────────────────────────────────────
  function stars(n, max) {
    var out = '';
    for (var i = 0; i < (max || 3); i++) out += '<span class="cr-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="cr-stars" role="img" aria-label="' + n + ' / ' + (max || 3) + '">' + out + '</span>';
  }

  // ── Estimate: a log number line with the guess and the answer ──
  function numberLine(min, max, guess, truth, es, labels) {
    var X0 = 24, X1 = 296, y = 52;
    var pos = function (v) { return X0 + (X1 - X0) * Math.log(Math.max(min, Math.min(max, v)) / min) / Math.log(max / min); };
    var s = line(X0, y, X1, y, INK, 3) + line(X0, y - 7, X0, y + 7, INK, 3) + line(X1, y - 7, X1, y + 7, INK, 3);
    s += T(X0, y + 24, fmt(min, es), { s: 11, c: '#475569', w: 700 }) + T(X1, y + 24, fmt(max, es), { s: 11, c: '#475569', w: 700 });
    var gx = pos(guess), tx = pos(truth), close = Math.abs(gx - tx) < 30;
    // the band within "double or half" of the answer
    var lo = pos(truth / 2), hi = pos(truth * 2);
    s = rect(lo, y - 11, Math.max(2, hi - lo), 22, 'rgba(15,118,110,.18)', null, 0, 6) + s;
    s += circ(tx, y, 9, GREEN, '#fff', 3) + T(tx, y - 16, labels.truth + ' ' + fmt(truth, es), { s: 12, c: GREEN });
    s += path('M' + gx + ' ' + (y + 2) + ' l-8 15 h16 Z', ORANGE, '#fff', 1.6) + T(gx + (close ? (gx < tx ? -2 : 2) : 0), y + 36 - (close ? 0 : 6), labels.guess + ' ' + fmt(guess, es), { s: 12, c: ORANGE, a: close ? (gx < tx ? 'end' : 'start') : 'middle' });
    return svg('0 0 320 100', s, labels.truth + ' ' + fmt(truth, es) + ', ' + labels.guess + ' ' + fmt(guess, es), 'cr-nline');
  }

  // ── personal-best graph: points per round ────────────────────
  // rounds: [{p, d}] (latest last); best: the personal best in points.
  function barChart(rounds, best, labels) {
    var W = 320, H = 156, L = 30, R = 8, Tp = 26, Bt = 22;
    var list = (rounds || []).slice(-12), n = list.length;
    var top = Math.max(10, best || 0, Math.max.apply(null, [0].concat(list.map(function (r) { return r.p; }))));
    top = Math.ceil(top / 10) * 10;
    var bw = n ? Math.min(22, (W - L - R) / n - 4) : 18, ph = H - Tp - Bt, s = '';
    var y = function (v) { return Tp + ph * (1 - v / top); };
    [0, 0.5, 1].forEach(function (f) {
      var v = Math.round(top * f);
      s += line(L, y(v), W - R, y(v), '#d8e4ee', 1) + T(L - 4, y(v) + 4, v, { s: 10, c: '#64748b', a: 'end', w: 700 });
    });
    if (n === 0) return svg('0 0 ' + W + ' ' + H, s + T(W / 2, H / 2, labels.none, { s: 13, c: '#64748b' }), labels.title, 'cr-chart');
    // the personal-best line
    s += line(L, y(best), W - R, y(best), AMBER, 2, '5 4') + T(W - R, 11, '★ ' + labels.best + ' ' + best, { s: 11, c: '#b45309', a: 'end' });
    list.forEach(function (r, i) {
      var x = L + 6 + i * ((W - L - R - 6) / n), h = Math.max(2, ph * r.p / top), isBest = r.p === best, isLast = i === n - 1;
      s += rect(x, Tp + ph - h, bw, h, isBest ? AMBER : (isLast ? TEAL_D : TEAL), isBest ? '#b45309' : null, 1.6, 4);
      s += T(x + bw / 2, Tp + ph - h - 3, r.p, { s: 10, c: INK, w: 700 });
    });
    s += line(L, Tp + ph, W - R, Tp + ph, INK, 2) + T(W - R, H - 6, labels.axis, { s: 10, c: '#64748b', a: 'end', w: 700 });
    return svg('0 0 ' + W + ' ' + H, s, labels.title + ': ' + list.map(function (r) { return r.p; }).join(', '), 'cr-chart');
  }

  // ── time zones ───────────────────────────────────────────────
  function clockFace(hh, mm, label) {
    var id = 'c' + (++_uid), s = circ(50, 50, 44, '#fff', INK, 4), a;
    for (var i = 0; i < 12; i++) {
      a = i * Math.PI / 6;
      s += line(50 + 36 * Math.sin(a), 50 - 36 * Math.cos(a), 50 + 41 * Math.sin(a), 50 - 41 * Math.cos(a), INK, i % 3 === 0 ? 3 : 1.6);
    }
    var ha = ((hh % 12) + mm / 60) * Math.PI / 6, ma = mm * Math.PI / 30;
    s += line(50, 50, 50 + 22 * Math.sin(ha), 50 - 22 * Math.cos(ha), INK, 5) + line(50, 50, 50 + 33 * Math.sin(ma), 50 - 33 * Math.cos(ma), TEAL, 3.4) + circ(50, 50, 3.5, ORANGE);
    s += T(50, 112, label, { s: 11, c: INK });
    return svg('0 0 100 118', s, label, 'cr-clock');
  }

  // Hours Santiago is ahead of California, month by month.
  function aheadChart(list, nowMonth, es) {
    var names = es ? ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] : ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    var s = '';
    [3, 4, 5].forEach(function (h) {
      var y = 100 - h * 16;
      s += line(26, y, 316, y, '#d8e4ee', 1) + T(20, y + 4, h, { s: 11, c: '#64748b', a: 'end', w: 700 });
    });
    list.forEach(function (h, i) {
      var x = 32 + i * 24, bh = h * 16, cur = i === nowMonth;
      s += rect(x, 100 - bh, 18, bh, cur ? ORANGE : TEAL, cur ? '#9a3412' : null, 1.6, 4) + T(x + 9, 100 - bh - 3, h, { s: 10, w: 700 }) + T(x + 9, 116, names[i], { s: 11, c: '#475569', w: 700 });
    });
    return svg('0 0 324 124', s, (es ? 'Horas de diferencia por mes' : 'Hours ahead, month by month'), 'cr-chart');
  }

  // ── engineer's diagrams ──────────────────────────────────────
  function _fit(w, h, maxW, maxH) { var k = Math.min(maxW / w, maxH / h); return { w: w * k, h: h * k, k: k }; }

  function diagram(a, es) {
    if (!a) return '';
    var id = 'd' + (++_uid), s = '', f, u = a.unit || 'm', cx = 150, cy = 80;
    switch (a.kind) {
      case 'rect': {
        f = _fit(a.w, a.h, 180, 96);
        var x = cx - f.w / 2, y = 22 + (96 - f.h) / 2;
        s += rect(x, y, f.w, f.h, '#fde9c4', '#9a6b2f', 2.6);
        if (a.grid) {
          var step = (a.grid / 100) * (f.w / a.w), tiles = (a.w * 100 / a.grid) * (a.h * 100 / a.grid);
          if (tiles <= 400) for (var gx = step; gx < f.w - 0.5; gx += step) s += line(x + gx, y, x + gx, y + f.h, '#c58a4b', 1);
          if (tiles <= 400) for (var gy = step; gy < f.h - 0.5; gy += step) s += line(x, y + gy, x + f.w, y + gy, '#c58a4b', 1);
        }
        s += dim(x, y + f.h + 16, x + f.w, y + f.h + 16, fmt(a.w, es) + ' ' + u) + dim(x + f.w + 16, y, x + f.w + 16, y + f.h, fmt(a.h, es) + ' ' + u, { dx: -2 });
        return svg('0 0 300 160', s, 'rectangle ' + a.w + ' by ' + a.h);
      }
      case 'lshape': {
        f = _fit(a.W, a.H, 170, 96);
        var X = 70, Y = 24, cwp = a.cw * f.k, chp = a.ch * f.k;
        s += path('M' + X + ' ' + Y + ' H' + (X + f.w - cwp) + ' V' + (Y + chp) + ' H' + (X + f.w) + ' V' + (Y + f.h) + ' H' + X + ' Z', '#d1fae5', TEAL_D, 2.6);
        s += rect(X + f.w - cwp, Y, cwp, chp, 'none', '#94a3b8', 1.6) + '<rect x="' + (X + f.w - cwp) + '" y="' + Y + '" width="' + cwp + '" height="' + chp + '" fill="none" stroke="#94a3b8" stroke-dasharray="4 3"/>';
        s += dim(X, Y + f.h + 16, X + f.w, Y + f.h + 16, fmt(a.W, es) + ' m') + dim(X - 16, Y, X - 16, Y + f.h, fmt(a.H, es) + ' m', { dx: 2 });
        s += T(X + f.w - cwp / 2, Y + chp / 2 + 4, fmt(a.cw, es) + '×' + fmt(a.ch, es), { s: 11, c: '#64748b' });
        return svg('0 0 300 160', s, 'L-shaped plot');
      }
      case 'tri': {
        f = _fit(a.b, a.h, 190, 92);
        var tx = cx - f.w / 2, ty = 26, by = ty + f.h;
        s += path('M' + tx + ' ' + by + ' H' + (tx + f.w) + ' L' + (tx + f.w * 0.35) + ' ' + ty + ' Z', '#bfdbfe', INK, 2.6);
        s += line(tx + f.w * 0.35, ty, tx + f.w * 0.35, by, RED, 1.8, '5 4') + path('M' + (tx + f.w * 0.35) + ' ' + (by - 9) + ' h9 v9', 'none', RED, 1.6);
        s += dim(tx, by + 16, tx + f.w, by + 16, fmt(a.b, es) + ' m') + T(tx + f.w * 0.35 - 8, ty + f.h / 2 + 4, fmt(a.h, es) + ' m', { s: 12, c: RED, a: 'end' });
        return svg('0 0 300 160', s, 'triangle');
      }
      case 'circle': {
        var r = 50;
        s += circ(cx, 80, r, '#bae6fd', INK, 2.6) + circ(cx, 80, r - 8, 'none', 'rgba(255,255,255,.7)', 3) + line(cx, 80, cx + r, 80, RED, 2.6) + circ(cx, 80, 3.5, INK) + T(cx + r / 2, 72, 'r = ' + fmt(a.r, es) + ' m', { s: 12, c: RED });
        return svg('0 0 300 160', s, 'circle with radius ' + a.r);
      }
      case 'box': {
        var bw = 120, bh = 62, dx = 44, dy = 28, x0 = 60, y0 = 56;
        s += path('M' + x0 + ' ' + y0 + ' h' + bw + ' v' + bh + ' h-' + bw + ' Z', a.water ? 'rgba(125,211,252,.55)' : '#fde9c4', INK, 2.4);
        s += path('M' + x0 + ' ' + y0 + ' l' + dx + ' -' + dy + ' h' + bw + ' l-' + dx + ' ' + dy + ' Z', a.water ? 'rgba(186,230,253,.7)' : '#fff3d6', INK, 2.4);
        s += path('M' + (x0 + bw) + ' ' + y0 + ' l' + dx + ' -' + dy + ' v' + bh + ' l-' + dx + ' ' + dy + ' Z', a.water ? 'rgba(56,189,248,.45)' : '#f2cf93', INK, 2.4);
        s += dim(x0, y0 + bh + 16, x0 + bw, y0 + bh + 16, fmt(a.l, es) + ' ' + u) + dim(x0 - 16, y0, x0 - 16, y0 + bh, fmt(a.h, es) + ' ' + u, { dx: 0 }) +
          T(x0 + bw + dx + 8, y0 - dy / 2 + 4, fmt(a.w, es) + ' ' + u, { s: 12, c: TEAL_D, a: 'start' });
        return svg('0 0 300 160', s, 'box');
      }
      case 'cyl': {
        var rx = 44, ry = 12, top = 36, hh = 72;
        s += path('M' + (cx - rx) + ' ' + top + ' v' + hh + ' a' + rx + ' ' + ry + ' 0 0 0 ' + (2 * rx) + ' 0 v-' + hh, 'rgba(125,211,252,.5)', INK, 2.4);
        s += '<ellipse cx="' + cx + '" cy="' + top + '" rx="' + rx + '" ry="' + ry + '" fill="#e0f2fe" stroke="' + INK + '" stroke-width="2.4"/>' + line(cx, top, cx + rx, top, RED, 2.4) + T(cx + rx / 2, top - 5, 'r = ' + fmt(a.r, es) + ' dm', { s: 11, c: RED });
        s += dim(cx + rx + 18, top, cx + rx + 18, top + hh, fmt(a.h, es) + ' dm', { dx: -2 });
        return svg('0 0 300 160', s, 'cylinder');
      }
      case 'scalebar': {
        s += rect(20, 20, 260, 70, '#ecfccb', '#65a30d', 2.4, 6);
        s += path('M40 70 q40 -40 80 -10 t110 -20', 'none', '#86efac', 5) + circ(70, 62, 6, RED, '#fff', 2) + circ(210, 44, 6, RED, '#fff', 2) + line(70, 62, 210, 44, INK, 2, '5 4');
        s += rect(26, 106, 248, 24, WOOD, '#9a6b2f', 1.8, 3);
        for (var i = 0; i <= 12; i++) s += line(34 + i * 19, 106, 34 + i * 19, i % 5 === 0 ? 120 : 114, INK, 1.4);
        s += T(150, 150, '1 : ' + fmt(a.scale, es), { s: 14, c: TEAL_D });
        return svg('0 0 300 160', s, 'scale 1 to ' + a.scale);
      }
      case 'pump': {
        s += rect(112, 22, 120, 90, '#f1f5f9', INK, 2.6, 6) + rect(115, 60, 114, 49, WATER, null, 0, 4) + T(172, 90, fmt(a.V, es) + ' L', { s: 17, c: '#075985' });
        (a.pumps || []).forEach(function (q, i) {
          var yy = (a.pumps.length > 1 ? 36 : 56) + i * 52;
          s += rect(14, yy - 12, 52, 24, '#cbd5e1', INK, 2.2, 5) + circ(40, yy, 6, ORANGE, INK, 1.6) + path('M66 ' + yy + ' H106 M98 ' + (yy - 5) + ' L106 ' + yy + ' L98 ' + (yy + 5), 'none', BLUE, 2.8) + T(40, yy + 25, fmt(q, es) + ' L/min', { s: 10, c: '#334155' });
        });
        if (a.tap) s += rect(22, 10, 40, 14, '#94a3b8', INK, 2, 3) + path('M62 17 H100 V40', 'none', '#94a3b8', 6);
        if (a.leak) s += path('M232 100 H266 M258 94 L266 100 L258 106', 'none', RED, 2.8) + T(262, 122, '−' + fmt(a.leak, es) + ' L/min', { s: 10, c: RED });
        return svg('0 0 300 160', s, 'tank and pumps');
      }
      case 'parts': {
        var parts = a.parts, tot = parts.reduce(function (p, c) { return p + c; }, 0), colors = a.colors || [TEAL, AMBER, BLUE], x2 = 24, W = 252, acc = 0;
        parts.forEach(function (p, i) {
          var w = W * p / tot;
          s += rect(x2 + acc, 38, w, 46, colors[i % colors.length], a.hi === i ? INK : '#fff', a.hi === i ? 4 : 2, 4) + T(x2 + acc + w / 2, 66, p, { s: 22, c: '#fff' });
          acc += w;
        });
        s += dim(x2, 112, x2 + W, 112, parts.join(' : ')) + T(150, 150, '1 ' + (es ? 'parte' : 'part') + ' = ?', { s: 12, c: '#475569' });
        return svg('0 0 300 160', s, 'ratio ' + parts.join(' to '));
      }
      case 'gears': {
        var gear = function (cx2, cy2, r2, n, c) {
          var d = '';
          for (var i = 0; i < n; i++) {
            var a0 = i * 2 * Math.PI / n, a1 = a0 + Math.PI / n * 0.5, a2 = a0 + Math.PI / n, a3 = a0 + Math.PI / n * 1.5;
            var ro = r2 + 7, ri = r2;
            d += (i ? 'L' : 'M') + (cx2 + ri * Math.cos(a0)) + ' ' + (cy2 + ri * Math.sin(a0)) + ' L' + (cx2 + ro * Math.cos(a1)) + ' ' + (cy2 + ro * Math.sin(a1)) + ' L' + (cx2 + ro * Math.cos(a2)) + ' ' + (cy2 + ro * Math.sin(a2)) + ' L' + (cx2 + ri * Math.cos(a3)) + ' ' + (cy2 + ri * Math.sin(a3)) + ' ';
          }
          return path(d + 'Z', c, INK, 2.2) + circ(cx2, cy2, r2 * 0.28, '#fff', INK, 2);
        };
        s += gear(92, 78, 50, 16, '#cbd5e1') + gear(214, 90, 25, 8, '#fde68a');
        s += T(92, 82, fmt(a.big, es), { s: 18 }) + T(214, 95, fmt(a.small, es), { s: 14 }) + T(92, 148, (es ? 'dientes' : 'teeth'), { s: 11, c: '#475569' });
        return svg('0 0 300 160', s, 'two gears');
      }
      case 'cover': {
        s += rect(20, 28, 170, 90, '#fde68a', '#b45309', 2.4, 4) + T(105, 78, fmt(a.area, es) + ' m²', { s: 22, c: '#7c2d12' });
        s += path('M214 52 h44 v56 a22 8 0 0 1 -44 0 Z', '#e2e8f0', INK, 2.4) + '<ellipse cx="236" cy="52" rx="22" ry="8" fill="#f8fafc" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="236" cy="52" rx="16" ry="5" fill="' + ORANGE + '"/>';
        s += T(236, 132, fmt(a.cover, es) + ' m²', { s: 12, c: '#334155' });
        return svg('0 0 300 160', s, 'wall and a paint can');
      }
      case 'pct': {
        var bx = 24, bwid = 252, p = Math.min(a.pct, 100), total = a.over ? 100 + a.over : 100;
        var unit = bwid / total;
        s += rect(bx, 54, bwid, 40, '#fff', INK, 2.6, 6);
        if (a.over) s += rect(bx, 54, unit * 100, 40, TEAL, null, 0, 6) + rect(bx + unit * 100, 54, unit * a.over, 40, AMBER, null, 0, 0);
        else s += rect(bx, 54, unit * p, 40, TEAL, null, 0, 6);
        if (a.cut) s += rect(bx + unit * p, 54, unit * a.cut, 40, 'rgba(194,65,12,.28)', null, 0, 0);
        for (var k = 1; k < 10; k++) s += line(bx + unit * 10 * k, 54, bx + unit * 10 * k, 94, 'rgba(255,255,255,.85)', 1.4);
        s += rect(bx, 54, bwid, 40, 'none', INK, 2.6, 6) + T(bx, 112, '0', { s: 11, c: '#64748b' }) + T(bx + unit * 100, 112, '100 %', { s: 11, c: '#64748b' });
        s += T(a.over ? bx + unit * (100 + a.over / 2) : bx + unit * p / 2, 80, a.over ? '+' + fmt(a.over, es) + ' %' : (a.cut ? fmt(100 - a.cut, es) + ' %' : fmt(a.pct, es) + ' %'), { s: 15, c: '#fff' });
        if (a.cut) s += T(bx + unit * (p + a.cut / 2), 80, '−' + fmt(a.cut, es) + ' %', { s: 13, c: RED });
        return svg('0 0 300 160', s, 'a percent bar');
      }
      case 'road': {
        s += rect(10, 92, 280, 26, '#475569', null, 0, 4) + line(14, 105, 286, 105, '#fde68a', 3, '14 10');
        s += circ(26, 80, 6, GREEN, '#fff', 2) + circ(274, 80, 6, RED, '#fff', 2);
        s += path('M120 88 v-14 l8 -8 h40 l8 8 v14 Z', '#fb923c', INK, 2.2) + circ(134, 90, 6, INK) + circ(166, 90, 6, INK);
        s += dim(26, 50, 274, 50, fmt(a.d, es) + ' ' + (a.unit || 'km')) + T(150, 142, fmt(a.t, es) + ' ' + (a.secs ? (es ? 's' : 's') : (es ? 'h' : 'h')), { s: 14, c: ORANGE });
        return svg('0 0 300 160', s, 'a road');
      }
      case 'circuit': {
        var resistor = function (x, y, label) {
          return path('M' + x + ' ' + y + ' l6 0 l5 -9 l9 18 l9 -18 l9 18 l9 -18 l5 9 l6 0', 'none', INK, 3) + T(x + 30, y - 16, label, { s: 14, c: RED });
        };
        var two = a.R && a.R.length === 2;
        s += line(60, 40, 60, 66, INK, 3) + line(60, 94, 60, 120, INK, 3) + line(60, 40, two ? 74 : 110, 40, INK, 3);
        s += line(48, 66, 72, 66, INK, 4) + line(54, 80, 66, 80, INK, 4) + line(48, 94, 72, 94, INK, 4) + line(60, 120, 250, 120, INK, 3);
        s += T(36, 84, a.V === null ? 'V = ?' : (fmt(a.V, es) + ' V'), { s: 13, c: a.V === null ? ORANGE : BLUE, a: 'end' });
        if (two) {
          s += resistor(74, 40, fmt(a.R[0], es) + ' Ω') + line(150, 40, 164, 40, INK, 3) + resistor(164, 40, fmt(a.R[1], es) + ' Ω') + line(244, 40, 250, 40, INK, 3);
        } else {
          s += resistor(110, 40, a.R ? fmt(a.R[0], es) + ' Ω' : 'R = ?') + line(180, 40, 250, 40, INK, 3);
        }
        s += line(250, 40, 250, 120, INK, 3) + path('M150 130 h22 m-6 -5 l6 5 l-6 5', 'none', ORANGE, 2.6) +
          T(196, 146, a.I === null ? 'I = ?' : (a.ask === 'R' || a.ask === 'P' ? fmt(a.I, es) + ' A' : fmt(a.I, es) + ' A'), { s: 13, c: a.I === null ? ORANGE : BLUE });
        if (a.ask === 'P') s += T(150, 22, 'P = ?', { s: 13, c: ORANGE });
        return svg('0 0 300 160', s, 'a circuit');
      }
    }
    return '';
  }

  return { hero: hero, dots: dots, icon: icon, stars: stars, numberLine: numberLine, barChart: barChart,
           clockFace: clockFace, aheadChart: aheadChart, diagram: diagram };
})();
