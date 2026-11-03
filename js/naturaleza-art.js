/* ================================================================
   EXPLORADOR DE NATURALEZA — field-guide plates  (js/naturaleza-art.js)

   Every species in the guide is drawn here, in code, as an inline
   SVG "plate" in the style of an old naturalist's field guide:
   layered gradients for volume, hundreds of seeded strokes for
   feathers / fur / bark, an eye highlight, a cast shadow and a small
   habitat vignette (branch, rock, grass, shore, forest floor).

   Each species registers   P.<id> = function(k) { return { wash, bg, fg, defs }; }
     wash : tint of the soft watercolour wash behind the subject
     bg   : habitat vignette (left out of the silhouette quiz)
     fg   : the animal or plant itself
     defs : its own gradients / clip paths
   All ids are written as "§name"; render() swaps § for a unique
   prefix so many plates can share one page without id clashes.

   Public API:
     NaturalezaArt.render(id, { silhouette: bool, label: string }) -> '<svg…>'
     NaturalezaArt.has(id) -> bool
   ================================================================ */

var NaturalezaArt = (function() {
  'use strict';

  var P = {};
  var cache = {};
  var uid = 0;
  var PI = Math.PI;

  // ---------- tiny utilities ----------------------------------------
  function n(v) { return Math.round(v * 10) / 10; }
  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function U(id) { return 'url(#§' + id + ')'; }
  function stops(a) {
    var s = '';
    for (var i = 0; i < a.length; i++) {
      s += '<stop offset="' + a[i][0] + '" stop-color="' + a[i][1] + '"' +
        (a[i][2] != null ? ' stop-opacity="' + a[i][2] + '"' : '') + '/>';
    }
    return s;
  }
  // linear gradient; coords are fractions of the shape's box unless ex says userSpaceOnUse
  function lg(id, x1, y1, x2, y2, st, ex) {
    return '<linearGradient id="§' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
      (ex || '') + '>' + stops(st) + '</linearGradient>';
  }
  function rg(id, cx, cy, r, st, ex) {
    return '<radialGradient id="§' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' +
      (ex || '') + '>' + stops(st) + '</radialGradient>';
  }
  function clip(id, d) { return '<clipPath id="§' + id + '"><path d="' + d + '"/></clipPath>'; }
  function p(d, fill, ex) { return '<path d="' + d + '" fill="' + fill + '"' + (ex ? ' ' + ex : '') + '/>'; }
  function sp(d, stroke, w, ex) {
    return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w +
      '" stroke-linecap="round" stroke-linejoin="round"' + (ex ? ' ' + ex : '') + '/>';
  }
  function el(cx, cy, rx, ry, fill, ex) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + (ex ? ' ' + ex : '') + '/>';
  }
  function circ(cx, cy, r, fill, ex) {
    return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" fill="' + fill + '"' + (ex ? ' ' + ex : '') + '/>';
  }
  function g(c, ex) { return '<g' + (ex ? ' ' + ex : '') + '>' + c + '</g>'; }
  function tr(x, y, rot, sc) {
    return 'transform="translate(' + n(x) + ' ' + n(y) + ')' + (rot ? ' rotate(' + n(rot) + ')' : '') +
      (sc ? ' scale(' + sc + ')' : '') + '"';
  }

  // Smooth closed/open path through points (quadratic through midpoints)
  function smooth(pts, closed) {
    var L = pts.length, d, i, m;
    if (closed) {
      m = [(pts[L - 1][0] + pts[0][0]) / 2, (pts[L - 1][1] + pts[0][1]) / 2];
      d = 'M' + n(m[0]) + ' ' + n(m[1]);
      for (i = 0; i < L; i++) {
        var nx = pts[(i + 1) % L];
        d += 'Q' + n(pts[i][0]) + ' ' + n(pts[i][1]) + ' ' + n((pts[i][0] + nx[0]) / 2) + ' ' + n((pts[i][1] + nx[1]) / 2);
      }
      return d + 'Z';
    }
    d = 'M' + n(pts[0][0]) + ' ' + n(pts[0][1]);
    for (i = 1; i < L - 1; i++) {
      d += 'Q' + n(pts[i][0]) + ' ' + n(pts[i][1]) + ' ' + n((pts[i][0] + pts[i + 1][0]) / 2) + ' ' + n((pts[i][1] + pts[i + 1][1]) / 2);
    }
    return d + 'L' + n(pts[L - 1][0]) + ' ' + n(pts[L - 1][1]);
  }

  // ---------- texture: seeded strokes inside an ellipse --------------
  // o = { cx, cy, rx, ry, n, len, ang (deg) | angFn(x,y), jit (deg), curve,
  //       cols: [..], w, op, cap }
  function hatch(rnd, o) {
    var groups = {}, i, cols = o.cols || ['#000'];
    for (i = 0; i < o.n; i++) {
      var t = rnd() * 2 * PI, r = Math.sqrt(rnd());
      var x = o.cx + Math.cos(t) * r * o.rx, y = o.cy + Math.sin(t) * r * o.ry;
      var base = o.angFn ? o.angFn(x, y) : o.ang;
      var a = (base + (rnd() - 0.5) * (o.jit || 0)) * PI / 180;
      var L = o.len * (0.6 + rnd() * 0.8);
      var x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
      var cv = (o.curve || 0) * L * (rnd() < 0.5 ? 1 : 0.6);
      var qx = (x + x2) / 2 - Math.sin(a) * cv, qy = (y + y2) / 2 + Math.cos(a) * cv;
      var c = cols[Math.floor(rnd() * cols.length)];
      groups[c] = (groups[c] || '') + 'M' + n(x) + ' ' + n(y) + 'Q' + n(qx) + ' ' + n(qy) + ' ' + n(x2) + ' ' + n(y2);
    }
    var s = '';
    for (var k in groups) s += '<path d="' + groups[k] + '" stroke="' + k + '"/>';
    return '<g fill="none" stroke-width="' + (o.w || 1) + '" stroke-linecap="round" opacity="' + (o.op == null ? 1 : o.op) + '">' + s + '</g>';
  }

  // Rows of little feather tips (scallops) — coverts, breast spots, scales
  // o = { x0, x1, y0, rows, dx, dy, r, fill, edge, jit, skew }
  function scallops(rnd, o) {
    var s = '', d = '', e = '';
    for (var row = 0; row < o.rows; row++) {
      var y = o.y0 + row * o.dy;
      var off = (row % 2) * o.dx / 2;
      var xs = o.x0 + (o.rowShift ? o.rowShift * row : 0);
      for (var x = xs + off; x < o.x1 + (o.rowShift ? o.rowShift * row : 0); x += o.dx) {
        var jx = (rnd() - 0.5) * (o.jit || 0), jy = (rnd() - 0.5) * (o.jit || 0);
        var X = x + jx, Y = y + jy, r = o.r * (0.85 + rnd() * 0.3);
        // a rounded feather tip pointing down/back
        d += 'M' + n(X - r) + ' ' + n(Y) + 'Q' + n(X - r) + ' ' + n(Y + r * 1.3) + ' ' + n(X + (o.skew || 0)) + ' ' + n(Y + r * 1.35) +
          'Q' + n(X + r) + ' ' + n(Y + r * 1.3) + ' ' + n(X + r) + ' ' + n(Y) + 'Z';
        e += 'M' + n(X - r * 0.9) + ' ' + n(Y + r * 0.5) + 'Q' + n(X) + ' ' + n(Y + r * 1.6) + ' ' + n(X + r * 0.9) + ' ' + n(Y + r * 0.5);
      }
    }
    s += '<path d="' + d + '" fill="' + o.fill + '"/>';
    if (o.edge) s += '<path d="' + e + '" fill="none" stroke="' + o.edge + '" stroke-width="' + (o.ew || 1) + '" opacity="' + (o.eop || 0.8) + '"/>';
    return s;
  }

  // A single pointed feather in local coords (base at 0,0 pointing +x)
  function feather(x, y, len, w, ang, fill, edge, ex) {
    var d = 'M0 0C' + n(len * 0.3) + ' ' + n(-w) + ' ' + n(len * 0.78) + ' ' + n(-w * 0.7) + ' ' + n(len) + ' 0C' +
      n(len * 0.78) + ' ' + n(w * 0.55) + ' ' + n(len * 0.3) + ' ' + n(w * 0.9) + ' 0 0Z';
    var s = p(d, fill, edge ? 'stroke="' + edge + '" stroke-width=".8"' : '');
    s += sp('M2 0L' + n(len * 0.92) + ' ' + n(-w * 0.05), 'rgba(255,255,255,.12)', 0.7);
    return '<g ' + tr(x, y, ang) + (ex ? ' ' + ex : '') + '>' + s + '</g>';
  }


  // A row of rounded-tip feathers (wing coverts, tertials, secondaries)
  // laid along the line (x0,y0)->(x1,y1), each pointing at angle ang (deg).
  function featherRow(rnd, x0, y0, x1, y1, count, len, w, ang, fill, edge, ew) {
    var s = '';
    for (var i = 0; i < count; i++) {
      var t = count > 1 ? i / (count - 1) : 0;
      var x = x0 + (x1 - x0) * t + (rnd() - 0.5) * 1.5, y = y0 + (y1 - y0) * t + (rnd() - 0.5) * 1.5;
      var L = len * (0.9 + rnd() * 0.2), W = w * (0.9 + rnd() * 0.2);
      var d = 'M0 ' + n(-W) + 'L' + n(L * 0.62) + ' ' + n(-W) + 'Q' + n(L) + ' ' + n(-W * 0.95) + ' ' + n(L) + ' 0Q' + n(L) + ' ' + n(W * 0.95) + ' ' +
        n(L * 0.62) + ' ' + n(W) + 'L0 ' + n(W) + 'Z';
      s += '<g ' + tr(x, y, ang + (rnd() - 0.5) * 4) + '>' + p(d, fill, edge ? 'stroke="' + edge + '" stroke-opacity=".7" stroke-width="' + n((ew || 1.1) * 0.75) + '"' : '') +
        sp('M0 0L' + n(L * 0.85) + ' 0', 'rgba(0,0,0,.25)', 0.6) + '</g>';
    }
    return s;
  }

  // A leaf in local coords: base at 0,0 pointing +x. o = {fill, vein, veins, edge, round, tooth}
  function leaf(x, y, len, w, ang, o) {
    o = o || {};
    var k = o.round || 1;
    var d = 'M0 0C' + n(len * 0.22) + ' ' + n(-w * k) + ' ' + n(len * 0.72) + ' ' + n(-w * 0.95) + ' ' + n(len) + ' 0C' +
      n(len * 0.72) + ' ' + n(w * 0.95) + ' ' + n(len * 0.22) + ' ' + n(w * k) + ' 0 0Z';
    var s = p(d, o.fill || '#4a7a3a', o.edge ? 'stroke="' + o.edge + '" stroke-width=".9"' : '');
    if (o.shade) s += p('M0 0C' + n(len * 0.22) + ' ' + n(w * k) + ' ' + n(len * 0.72) + ' ' + n(w * 0.95) + ' ' + n(len) + ' 0C' +
      n(len * 0.6) + ' ' + n(w * 0.25) + ' ' + n(len * 0.3) + ' ' + n(w * 0.2) + ' 0 0Z', o.shade, 'opacity=".55"');
    var vein = o.vein || 'rgba(230,240,200,.55)';
    s += sp('M0 0Q' + n(len * 0.5) + ' ' + n(-w * 0.08) + ' ' + n(len * 0.97) + ' 0', vein, Math.max(0.6, w * 0.07), 'opacity=".85"');
    var nv = o.veins == null ? 5 : o.veins, vd = '';
    for (var i = 1; i <= nv; i++) {
      var t = i / (nv + 1), vx = len * t, vw = w * Math.sin(PI * Math.min(0.98, t + 0.05)) * 0.8;
      vd += 'M' + n(vx) + ' 0Q' + n(vx + len * 0.06) + ' ' + n(-vw * 0.5) + ' ' + n(vx + len * 0.14) + ' ' + n(-vw);
      vd += 'M' + n(vx) + ' 0Q' + n(vx + len * 0.06) + ' ' + n(vw * 0.5) + ' ' + n(vx + len * 0.14) + ' ' + n(vw);
    }
    if (nv) s += sp(vd, vein, Math.max(0.35, w * 0.03), 'opacity=".45"');
    if (o.gloss) s += p('M' + n(len * 0.12) + ' ' + n(-w * 0.25) + 'Q' + n(len * 0.45) + ' ' + n(-w * 0.85) + ' ' + n(len * 0.8) + ' ' + n(-w * 0.35) +
      'Q' + n(len * 0.45) + ' ' + n(-w * 0.5) + ' ' + n(len * 0.12) + ' ' + n(-w * 0.25) + 'Z', '#fff', 'opacity="' + o.gloss + '"');
    return '<g ' + tr(x, y, ang) + '>' + s + '</g>';
  }

  // Grass blades along the ground
  function grass(rnd, x0, x1, y, count, h, cols, lean) {
    var groups = {};
    for (var i = 0; i < count; i++) {
      var x = x0 + rnd() * (x1 - x0), hh = h * (0.45 + rnd() * 0.75);
      var bend = (rnd() - 0.5 + (lean || 0)) * hh * 0.7, w = 1 + rnd() * 1.6;
      var tx = x + bend, ty = y - hh;
      var c = cols[Math.floor(rnd() * cols.length)];
      groups[c] = (groups[c] || '') + 'M' + n(x - w) + ' ' + n(y) + 'Q' + n(x + bend * 0.25) + ' ' + n(y - hh * 0.55) + ' ' + n(tx) + ' ' + n(ty) +
        'Q' + n(x + bend * 0.3 + w * 0.6) + ' ' + n(y - hh * 0.5) + ' ' + n(x + w) + ' ' + n(y) + 'Z';
    }
    var s = '';
    for (var k in groups) s += '<path d="' + groups[k] + '" fill="' + k + '"/>';
    return s;
  }

  // A boulder: irregular smooth outline, gradient, facets, lichen
  function rock(rnd, id, cx, top, w, h, tone) {
    tone = tone || ['#b9b1a3', '#8c8476', '#5d564c'];
    var pts = [], i, N = 9;
    for (i = 0; i <= N; i++) {
      var t = i / N, x = cx - w / 2 + t * w;
      var y = top + h * (1 - Math.sin(PI * t) * (0.85 + rnd() * 0.15)) * 0.9 + (rnd() - 0.5) * h * 0.08;
      pts.push([x, Math.min(y, top + h)]);
    }
    pts.push([cx + w / 2, top + h]); pts.push([cx - w / 2, top + h]);
    var d = smooth(pts, true);
    var s = '<defs>' + lg(id, 0, 0, 0.35, 1, [[0, tone[0]], [0.55, tone[1]], [1, tone[2]]]) + '</defs>';
    s += p(d, U(id));
    var f = '';
    for (i = 0; i < 4; i++) {
      var fx = cx - w * 0.35 + rnd() * w * 0.7, fy = top + h * (0.25 + rnd() * 0.5);
      f += 'M' + n(fx) + ' ' + n(fy) + 'q' + n((rnd() - 0.5) * w * 0.06) + ' ' + n(h * 0.08) + ' ' + n((rnd() - 0.3) * w * 0.1) + ' ' + n(h * (0.1 + rnd() * 0.12));
    }
    s += sp(f, 'rgba(50,42,34,.35)', 1.2);
    s += sp(smooth(pts.slice(1, N), false), 'rgba(255,255,245,.45)', 1.6, 'transform="translate(0 2)"');
    for (i = 0; i < 14; i++) {
      var lx = cx - w * 0.4 + rnd() * w * 0.8, ly = top + h * (0.15 + rnd() * 0.45);
      s += circ(lx, ly, 0.8 + rnd() * 2.2, rnd() < 0.5 ? 'rgba(214,170,74,.55)' : 'rgba(170,190,150,.6)');
    }
    return s;
  }

  // A branch drawn as stacked strokes (shadow, body, highlight, bark ticks)
  function branch(rnd, d, w, cols) {
    cols = cols || ['#3b2a1c', '#6b4c33', '#a07c5a'];
    var s = sp(d, 'rgba(30,20,10,.25)', w + 3, 'transform="translate(1.5 3)"');
    s += sp(d, cols[0], w);
    s += sp(d, cols[1], w * 0.72, 'transform="translate(0 -' + n(w * 0.1) + ')"');
    s += sp(d, cols[2], w * 0.22, 'transform="translate(0 -' + n(w * 0.28) + ')" opacity=".55"');
    s += sp(d, cols[0], w * 0.5, 'stroke-dasharray="2 7 1 11" opacity=".45" transform="translate(0 ' + n(w * 0.12) + ')"');
    return s;
  }

  // Cast shadow on the ground
  function shadow(cx, cy, rx, ry, op) {
    return el(cx, cy, rx, ry, U('shd'), op != null ? 'opacity="' + op + '"' : '');
  }

  // An eye with iris shading and catch-lights
  function eye(cx, cy, r, iris, o) {
    o = o || {};
    var s = '';
    if (o.ring) s += circ(cx, cy, r * (o.ringR || 1.4), o.ring);
    s += circ(cx, cy, r, iris || '#1a120c');
    s += circ(cx, cy, r, U('eyeShade'));
    if (o.pupil !== 0) s += circ(cx + (o.px || 0), cy + (o.py || 0), r * (o.pupil || 0.56), '#070504');
    s += circ(cx - r * 0.34, cy - r * 0.36, r * 0.32, '#fff', 'opacity=".95"');
    s += circ(cx + r * 0.32, cy + r * 0.3, r * 0.13, '#fff', 'opacity=".55"');
    return s;
  }

  // Bird foot gripping a perch: (x,y)= where tarsus meets perch top
  function foot(x, y, col, sz, dir) {
    dir = dir || -1; sz = sz || 1;
    var t = 'M' + n(x) + ' ' + n(y);
    var d = t + 'q' + n(dir * 5 * sz) + ' ' + n(1 * sz) + ' ' + n(dir * 9 * sz) + ' ' + n(5 * sz) +
      t + 'q' + n(dir * 3 * sz) + ' ' + n(3 * sz) + ' ' + n(dir * 5 * sz) + ' ' + n(8 * sz) +
      t + 'q' + n(-dir * 4 * sz) + ' ' + n(1 * sz) + ' ' + n(-dir * 7 * sz) + ' ' + n(5 * sz);
    return sp(d, col, 2 * sz) + sp(d, 'rgba(255,255,255,.25)', 0.6 * sz);
  }

  // Distant mountain ridge (optionally snow-capped)
  function ridge(rnd, id, y, amp, col, snow, op) {
    var pts = [[-10, y + 80]], x = -10;
    while (x < 410) {
      pts.push([x, y - rnd() * amp]);
      x += 18 + rnd() * 30;
    }
    pts.push([410, y - rnd() * amp]); pts.push([410, y + 80]);
    var d = 'M' + pts.map(function(q) { return n(q[0]) + ' ' + n(q[1]); }).join('L') + 'Z';
    var s = '<defs>' + clip(id, d) + lg(id + 'g', 0, 0, 0, 1, [[0, col], [1, col, 0]]) + '</defs>';
    s += p(d, U(id + 'g'), op ? 'opacity="' + op + '"' : '');
    if (snow) {
      var top = y - amp - 60, zx = 410, sd = 'M-10 ' + n(top) + 'L410 ' + n(top);
      while (zx > -10) { sd += 'L' + n(zx) + ' ' + n(y - amp * snow + (rnd() - 0.5) * amp * 0.35); zx -= 6 + rnd() * 9; }
      sd += 'L-10 ' + n(y - amp * snow) + 'Z';
      s += '<g clip-path="' + U(id) + '">' + p(sd, '#fbfbf8', 'opacity=".92"') + '</g>';
    }
    return s;
  }

  // Sea with soft wave strokes, from y down
  function sea(rnd, y, h) {
    var s = '<defs>' + lg('seaG', 0, 0, 0, 1, [[0, '#7fb3c9', 0.0], [0.15, '#7fb3c9', 0.7], [1, '#3d7a96', 0.85]]) + '</defs>';
    s += '<rect x="0" y="' + y + '" width="400" height="' + h + '" fill="' + U('seaG') + '"/>';
    var d = '';
    for (var i = 0; i < 26; i++) {
      var wy = y + 8 + rnd() * (h - 10), wx = rnd() * 380, wl = 14 + rnd() * 30;
      d += 'M' + n(wx) + ' ' + n(wy) + 'q' + n(wl / 2) + ' -3 ' + n(wl) + ' 0';
    }
    s += sp(d, '#e8f4f6', 1.2, 'opacity=".7"');
    return s;
  }

  // Fern frond (for forest floors). base (x,y), length, angle (deg), colour
  function fern(rnd, x, y, len, ang, col) {
    var s = '', k = 16, hi = '';
    for (var i = 1; i < k; i++) {
      var t = i / k, px = t * len, lw = len * 0.2 * Math.sin(PI * (0.12 + t * 0.88)) * (1 - t * 0.3) + 2;
      var a1 = -58 + t * 20;
      s += '<ellipse cx="' + n(px + Math.cos(a1 * PI / 180) * lw * 0.55) + '" cy="' + n(Math.sin(a1 * PI / 180) * lw * 0.55) + '" rx="' + n(lw * 0.58) + '" ry="' + n(Math.max(1.4, lw * 0.17)) + '" transform="rotate(' + n(a1) + ' ' + n(px + Math.cos(a1 * PI / 180) * lw * 0.55) + ' ' + n(Math.sin(a1 * PI / 180) * lw * 0.55) + ')"/>';
      s += '<ellipse cx="' + n(px + Math.cos(-a1 * PI / 180) * lw * 0.55) + '" cy="' + n(Math.sin(-a1 * PI / 180) * lw * 0.55) + '" rx="' + n(lw * 0.58) + '" ry="' + n(Math.max(1.4, lw * 0.17)) + '" transform="rotate(' + n(-a1) + ' ' + n(px + Math.cos(-a1 * PI / 180) * lw * 0.55) + ' ' + n(Math.sin(-a1 * PI / 180) * lw * 0.55) + ')"/>';
      hi += 'M' + n(px) + ' 0l' + n(Math.cos(a1 * PI / 180) * lw * 0.9) + ' ' + n(Math.sin(a1 * PI / 180) * lw * 0.9);
    }
    s = '<g fill="' + col + '">' + s + '</g>' + sp(hi, 'rgba(230,245,200,.35)', 0.6);
    s += sp('M0 0Q' + n(len * 0.5) + ' ' + n(-len * 0.04) + ' ' + n(len) + ' 0', 'rgba(40,60,20,.7)', 1.2);
    return '<g ' + tr(x, y, ang) + '>' + s + '</g>';
  }

  // Fluffy outline (ruffs, fur tufts, flower pompoms): bumpy ellipse path
  function fluff(rnd, cx, cy, rx, ry, rot, bumps, depth) {
    var pts = [], i, a0 = (rot || 0) * PI / 180, d = '';
    for (i = 0; i < bumps; i++) {
      var t = i / bumps * 2 * PI;
      var x = Math.cos(t) * rx, y = Math.sin(t) * ry;
      pts.push([cx + x * Math.cos(a0) - y * Math.sin(a0), cy + x * Math.sin(a0) + y * Math.cos(a0), t]);
    }
    d = 'M' + n(pts[0][0]) + ' ' + n(pts[0][1]);
    for (i = 0; i < bumps; i++) {
      var A = pts[i], B = pts[(i + 1) % bumps];
      var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
      var ox = mx - cx, oy = my - cy, L = Math.sqrt(ox * ox + oy * oy) || 1;
      var k = (depth || 0.18) * (0.7 + rnd() * 0.6) * Math.max(rx, ry) / 3;
      d += 'Q' + n(mx + ox / L * k * 3) + ' ' + n(my + oy / L * k * 3) + ' ' + n(B[0]) + ' ' + n(B[1]);
    }
    return d + 'Z';
  }

  // Common per-plate defs
  function commonDefs(wash) {
    return rg('shd', 0.5, 0.5, 0.5, [[0, '#2a2018', 0.42], [0.6, '#2a2018', 0.18], [1, '#2a2018', 0]]) +
      rg('eyeShade', 0.5, 0.5, 0.5, [[0.5, '#000', 0], [1, '#000', 0.6]]) +
      rg('wash', 0.5, 0.52, 0.55, [[0, wash, 0.55], [0.6, wash, 0.3], [1, wash, 0]]) +
      '<filter id="§sil" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .17  0 0 0 0 .13  0 0 0 1 0"/></filter>';
  }

  function build(id) {
    if (cache[id]) return cache[id];
    var fn = P[id];
    if (!fn) return null;
    var k = {
      rnd: rng(hash(id)), n: n, U: U, lg: lg, rg: rg, clip: clip, p: p, sp: sp, el: el, circ: circ, g: g, tr: tr,
      smooth: smooth, hatch: hatch, scallops: scallops, feather: feather, featherRow: featherRow, leaf: leaf, grass: grass, rock: rock,
      branch: branch, fluff: fluff, shadow: shadow, eye: eye, foot: foot, ridge: ridge, sea: sea, fern: fern
    };
    var out = fn(k);
    cache[id] = out;
    return out;
  }

  function render(id, opts) {
    opts = opts || {};
    var a = build(id);
    if (!a) return '';
    var pre = 'n' + (++uid) + '_';
    var body = '<defs>' + commonDefs(a.wash || '#cbbf9a') + (a.defs || '') + '</defs>';
    if (opts.silhouette) {
      body += el(200, 150, 175, 125, U('wash'), 'opacity=".5"');
      body += (a.shadow || '') + '<g filter="' + U('sil') + '">' + a.fg + '</g>';
    } else {
      body += el(200, 150, 190, 135, U('wash'));
      body += (a.bg || '') + (a.shadow || '') + a.fg + (a.front || '') + (a.inset || '');
    }
    var label = opts.label ? '<title>' + String(opts.label).replace(/[<>&"]/g, '') + '</title>' : '';
    return ('<svg class="nat-plate-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img"' +
      (opts.label ? '' : ' aria-hidden="true"') + '>' + label + body + '</svg>').replace(/§/g, pre);
  }


  // =================================================================
  //  BIRDS · AVES
  // =================================================================

  // ---- Andean condor · Cóndor andino (adult male, perched on a crag) ----
  P.condor = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M120 156C130 138 156 130 196 130C250 128 306 132 344 146C368 156 384 172 392 192L396 214C366 216 336 216 306 218C268 224 228 228 198 226C160 222 132 206 122 186C116 174 116 164 120 156Z';
    var wing = 'M146 146C186 130 246 130 298 138C338 144 370 160 392 184C400 194 404 204 404 214C378 214 340 212 300 210C250 208 206 204 180 196C160 188 148 174 146 160Z';
    var defs = k.lg('cBody', 0.3, 0, 0.5, 1, [[0, '#35312d'], [0.45, '#1a1816'], [1, '#070606']]) +
      k.lg('cWing', 0, 0, 0.6, 1, [[0, '#3a3530'], [0.35, '#1d1b18'], [1, '#0b0a09']]) +
      k.lg('cSheen', 0, 0, 0, 1, [[0, '#a8b8cc', 0.32], [0.28, '#a8b8cc', 0], [1, '#000', 0]]) +
      k.lg('cSec', 0, 0, 1, 1, [[0, '#ffffff'], [0.55, '#ebe8e1'], [1, '#a9a397']]) +
      k.rg('cRuff', 0.38, 0.35, 0.7, [[0, '#ffffff'], [0.65, '#f0ede6'], [1, '#bdb6aa']]) +
      k.rg('cHead', 0.45, 0.35, 0.75, [[0, '#7a5450'], [0.55, '#4a3432'], [1, '#241a19']]) +
      k.lg('cNeck', 0, 0, 1, 0, [[0, '#3e2c2a'], [0.5, '#6a4a46'], [1, '#4a3532']]) +
      k.lg('cBeak', 0, 0, 1, 0.5, [[0, '#f0e6cc'], [0.35, '#cbbf9f'], [0.7, '#5a524a'], [1, '#2a2624']]) +
      k.lg('cLeg', 0, 0, 1, 0, [[0, '#8a847c'], [0.5, '#6a655e'], [1, '#4a4640']]) +
      k.clip('cBodyC', body) + k.clip('cWingC', wing);

    // habitat: snowy Andes far behind, a big lichen-spotted crag below
    bg += k.ridge(r, 'cR1', 186, 74, '#a3b7c8', 0.6, 0.9);
    bg += k.ridge(r, 'cR2', 226, 40, '#93a68f', 0, 0.55);
    bg += k.rock(r, 'cRock', 214, 222, 330, 80, ['#cfc5b3', '#978d7c', '#5c544a']);
    bg += k.grass(r, 20, 70, 296, 22, 26, ['#7d8a4a', '#a3a35a', '#5e6b38']);
    var shadowS = k.shadow(222, 230, 150, 9, 0.95);
    var front = k.grass(r, 340, 398, 296, 22, 22, ['#7d8a4a', '#a3a35a', '#5e6b38']);

    // short wedge tail, mostly hidden under the primaries
    s += k.p('M336 204L404 230L398 240L384 238L372 243L322 220Z', '#100e0c');
    s += k.sp('M344 212L398 236M334 214L384 240', '#34302b', 1);
    // legs: black-feathered thighs, short heavy grey tarsi, long toes
    s += k.p('M196 226L212 238L222 238L226 228L250 230L256 240L266 240L268 228Z', '#0c0b0a');
    s += k.p('M208 222C208 230 207 236 206 242L220 242C221 236 222 230 222 222Z', k.U('cLeg'));
    s += k.p('M244 222C244 230 244 236 244 243L257 243C257 236 257 230 258 222Z', k.U('cLeg'));
    s += k.sp('M207 230h14M207 236h14M244 231h13M244 237h13', 'rgba(30,25,20,.45)', 0.8);
    var toes = function(x, y) {
      var d = 'M' + x + ' ' + y + 'q-8 1 -18 3M' + x + ' ' + y + 'q-6 3 -14 7M' + x + ' ' + y + 'q-2 3 -4 8M' + (x + 4) + ' ' + y + 'q5 2 9 4';
      return k.sp(d, '#5a554e', 4.2) + k.sp(d, '#8a847a', 1.2, 'transform="translate(0 -1)"') +
        k.circ(x - 18, y + 3, 1.8, '#1e1a16') + k.circ(x - 14, y + 7, 1.8, '#1e1a16') + k.circ(x - 4, y + 8, 1.8, '#1e1a16');
    };
    s += toes(212, 242) + toes(250, 243);
    // heavy body
    s += k.p(body, k.U('cBody'));
    s += k.g(k.hatch(r, { cx: 190, cy: 200, rx: 80, ry: 26, n: 200, len: 8, ang: 75, jit: 30, curve: 0.3, cols: ['#4a443e', '#2d2925', '#000'], w: 1, op: 0.75 }) +
      k.el(150, 176, 34, 30, '#5a544c', 'opacity=".18"'), 'clip-path="' + k.U('cBodyC') + '"');
    // massive folded wing, built in feather tracts
    s += k.p(wing, k.U('cWing'));
    var wf = '';
    // broad white panel: secondaries' upper surfaces, tips ragged along the lower edge
    wf += k.p('M166 150C210 144 262 148 306 158C318 170 320 186 314 198C282 201 240 200 206 195C186 191 172 180 166 166Z', k.U('cSec'));
    for (i = 0; i < 12; i++) {
      var t = i / 11, bx = 168 + t * 132, by = 154 + t * 8;
      wf += k.feather(bx, by, 50 + t * 10, 8.5, 38 - t * 14, k.U('cSec'), '#a39d91');
    }
    // greater coverts: white with grey-shaded tips, overlapping the secondaries
    wf += k.featherRow(r, 164, 150, 296, 158, 13, 22, 6, 24, '#f6f4ee', '#9d978b', 1);
    // median coverts (black) giving a feathery black/white border
    wf += k.featherRow(r, 154, 142, 292, 149, 14, 15, 5, 18, '#1d1b18', '#4c4740', 1);
    // lesser coverts: small black scallops along the top of the wing
    wf += k.scallops(r, { x0: 150, x1: 300, y0: 134, rows: 2, dx: 11, dy: 6, r: 5, fill: '#24211e', edge: '#55504a', ew: 0.8, eop: 0.45, jit: 2, rowShift: 5 });
    s += k.g(wf, 'clip-path="' + k.U('cWingC') + '"');
    // long black primaries crossing over the tail, tips splayed into "fingers"
    var prim = [[252, 192, 146, 7], [260, 195, 138, 11], [268, 198, 128, 15], [276, 201, 116, 19.5], [284, 204, 104, 24], [292, 206, 90, 29]];
    for (i = 0; i < prim.length; i++) {
      var q = prim[i];
      s += k.feather(q[0], q[1], q[2], 8.5, q[3], i % 2 ? '#121110' : '#191715', '#3a3630');
      s += '<g ' + k.tr(q[0], q[1], q[3]) + '>' + k.sp('M' + (q[2] * 0.55) + ' -3L' + (q[2] * 0.97) + ' -0.5', '#4e4943', 0.8, 'opacity=".7"') + '</g>';
    }
    s += k.p(wing, k.U('cSheen'));
    s += k.sp('M150 145C190 131 250 131 300 139C336 145 366 160 386 180', 'rgba(255,255,255,.16)', 2.4);
    s += k.p(body, k.U('cSheen'), 'opacity=".6"');
    // dense white ruff
    s += k.p(k.fluff(r, 134, 142, 34, 26, -28, 30, 0.24), k.U('cRuff'));
    var curls = '';
    for (i = 0; i < 70; i++) {
      var a = r() * Math.PI * 2, rr = 0.75 + r() * 0.35;
      var x0 = 134 + Math.cos(a) * 32 * rr, y0 = 142 + Math.sin(a) * 24 * rr;
      curls += 'M' + k.n(x0) + ' ' + k.n(y0) + 'q' + k.n(Math.cos(a + 1.4) * 3) + ' ' + k.n(Math.sin(a + 1.4) * 3) + ' ' + k.n(Math.cos(a) * 3.5) + ' ' + k.n(Math.sin(a) * 3.5);
    }
    s += k.sp(curls, '#ffffff', 3) + k.sp(curls, '#b4ada2', 0.7, 'opacity=".5" transform="translate(1 1.5)"');
    s += k.hatch(r, { cx: 140, cy: 150, rx: 22, ry: 14, n: 50, len: 5, ang: 0, angFn: function(x, y) { return Math.atan2(y - 142, x - 134) * 180 / Math.PI + 40; }, jit: 40, curve: 0.5, cols: ['#bcb5aa', '#d8d3ca'], w: 0.8, op: 0.8 });
    // bare, wrinkled neck and head
    s += k.p('M128 130C118 120 108 116 98 114L92 136C102 138 112 140 122 146Z', k.U('cNeck'));
    s += k.sp('M104 118q3 8 1 16M112 120q3 8 1 16M120 124q2 7 0 14', '#2a1c1a', 1, 'opacity=".55"');
    s += k.p('M104 116C100 108 90 104 80 106C70 108 64 114 62 120L62 132C68 138 80 140 92 138C102 136 108 128 104 116Z', k.U('cHead'));
    s += k.sp('M70 128q8 4 18 2M74 133q8 3 16 1M92 122q5 4 10 2M88 112q6 2 12 1', '#1c1312', 0.9, 'opacity=".55"');
    s += k.sp('M71 127q8 4 18 2M90 121q5 4 10 2', '#9a706a', 0.7, 'opacity=".5" transform="translate(0 -1.2)"');
    // wattle under the throat
    s += k.p('M80 138C82 146 88 150 94 146C92 142 90 139 88 137Z', '#3a2826');
    // male comb (caruncle): flat, fleshy, wavy-edged
    s += k.p('M62 116C62 104 68 98 76 98C80 92 88 92 92 97C97 93 104 96 104 102C106 106 104 110 100 111C88 110 74 112 62 120Z', '#2e2220');
    s += k.sp('M64 112C66 104 72 100 77 100C81 95 87 95 91 99C96 96 101 98 102 102', '#6a4a44', 1.4, 'opacity=".85"');
    // heavy hooked beak: dark base, pale ivory hook
    s += k.p('M66 114C58 114 50 116 45 121C41 125 40 131 42 136C44 139 46 138 46 135C47 131 50 129 54 129C60 129 66 128 68 126Z', k.U('cBeak'));
    s += k.p('M48 131C54 132 62 131 68 128L68 132C62 135 54 136 49 134Z', '#2e2a27');
    s += k.sp('M64 117C57 117 50 119 46 124', 'rgba(255,255,255,.55)', 0.9);
    s += k.el(58, 121, 2.4, 1.3, '#120c0b');
    s += k.eye(78, 118, 3.4, '#6a3a1e', { ring: '#1e1514', ringR: 1.5 });
    s = '<g transform="translate(225 236) scale(.92) translate(-225 -236)">' + s + '</g>';
    return { wash: '#b7c7cf', defs: defs, bg: bg, shadow: shadowS, fg: s, front: front };
  };


  // ---- shared perched-songbird body (facing left, local coords) ------
  // One silhouette for head + body; head colour is blended on top.
  // Head centre ≈ (-66,-68), eye (-71,-72), bill base (-89,-66);
  // feet at local y = 42 + legLen.
  var SB_BODY = 'M-90 -64C-92 -80 -82 -92 -66 -94C-52 -95 -42 -88 -34 -80C-12 -64 22 -44 46 -18C56 -6 62 6 58 14C50 28 34 36 14 42C-10 48 -40 42 -58 26C-74 12 -86 -10 -90 -32C-92 -44 -92 -56 -90 -64Z';
  var SB_WING = 'M-42 -46C-18 -56 18 -42 42 -18C60 0 80 22 94 40C70 32 42 22 16 14C-12 6 -34 -8 -44 -24C-48 -34 -48 -42 -42 -46Z';

  function songbird(k, o) {
    var r = k.rnd, c = o.c, id = o.id, s = '', i;
    var body = o.body || SB_BODY, wing = o.wing || SB_WING;
    var tail = o.tail || 'M40 2C70 26 104 52 132 72L122 84C94 66 60 44 30 28Z';
    var defs = k.lg(id + 'B', 0.8, 0.05, 0.3, 0.95, [[0, c.back], [0.38, c.back2 || c.back], [0.6, c.belly2 || c.belly], [1, c.belly]]) +
      k.rg(id + 'Bs', 0.78, 0.9, 0.62, [[0, '#000', 0.38], [1, '#000', 0]]) +
      k.rg(id + 'Bl', 0.22, 0.42, 0.42, [[0, '#fff', 0.32], [1, '#fff', 0]]) +
      k.rg(id + 'H', 0.42, 0.4, 0.5, [[0, c.headHi || c.head], [0.62, c.head], [0.82, c.head2 || c.head, 0.9], [1, c.head2 || c.head, 0]]) +
      k.lg(id + 'W', 0, 0, 1, 1, [[0, c.wing], [1, c.wingDark || c.wing]]) +
      k.lg(id + 'K', 0, 0, 1, 1, [[0, c.beak1], [1, c.beak2 || c.beak1]]) +
      k.lg(id + 'T', 0, 0, 1, 1, [[0, c.tail], [1, c.tail2 || c.tail]]) +
      k.clip(id + 'BC', body) + k.clip(id + 'WC', wing);
    // tail feathers (slightly splayed so the tips show)
    s += k.p(tail, k.U(id + 'T'));
    var tl = '';
    for (i = 0; i < 4; i++) tl += 'M' + (42 + i * 2) + ' ' + (10 + i * 4) + 'C' + (80 + i) + ' ' + (38 + i * 2) + ' ' + (104 + i) + ' ' + (56 + i * 2) + ' ' + (126 + i * 1.5) + ' ' + (74 + i * 2);
    s += k.sp(tl, c.edge || 'rgba(255,255,255,.3)', 0.8, 'opacity=".55"');
    s += k.sp('M132 72L127 80L122 84', 'rgba(255,255,255,.35)', 1);
    if (o.tailMarks) s += o.tailMarks;
    // legs
    var LL = o.legLen || 20;
    s += k.sp('M-14 38L-17 ' + (42 + LL) + 'M4 38L6 ' + (42 + LL), c.leg, 3.2);
    s += k.sp('M-14 44L-16 ' + (40 + LL) + 'M4 44L6 ' + (40 + LL), 'rgba(0,0,0,.25)', 3.4, 'stroke-dasharray=".6 3"');
    s += k.foot(-17, 42 + LL, c.leg, 1.4, -1) + k.foot(6, 42 + LL, c.leg, 1.4, -1);
    // body + head
    s += k.p(body, k.U(id + 'B'));
    var tex = k.hatch(r, { cx: -24, cy: -14, rx: 84, ry: 62, n: 300, len: 6.5, ang: 0,
      angFn: function(x, y) { return y < -54 + (x + 40) * 0.75 ? 34 : 80; }, jit: 24, curve: 0.35,
      cols: [c.texL || 'rgba(255,255,255,.5)', c.texD || 'rgba(60,40,20,.45)'], w: 0.75, op: 0.7 });
    s += k.g((o.underMarks || '') + k.el(-62, -68, 34, 32, k.U(id + 'H')) + tex + (o.marks || '') + (o.headMarks || '') +
      k.p(body, k.U(id + 'Bs')) + k.p(body, k.U(id + 'Bl')), 'clip-path="' + k.U(id + 'BC') + '"');
    s += k.sp('M-88 -78C-82 -90 -68 -94 -54 -90', 'rgba(255,255,255,.35)', 1.6);
    // wing: built feather by feather
    s += k.p(wing, k.U(id + 'W'));
    var wd = c.wingDark || c.wing, ed = c.edge || '#e8dcc0', wm = '';
    for (i = 0; i < 6; i++) {                       // primaries
      var fx = 10 + i * 5, fy = 4 + i * 3.2;
      wm += k.feather(fx, fy, 88 - i * 7, 6, Math.atan2(40 - fy, 94 - fx) * 180 / Math.PI - i * 1.2, c.prim || wd, ed);
    }
    wm += k.featherRow(r, -26, -14, 22, 6, 6, 34, 6, 32, c.sec || wd, ed, 1);          // secondaries
    wm += k.featherRow(r, 2, -36, 16, -26, 3, 40, 9, 38, c.tert || c.wing, ed, 1.3);   // tertials
    wm += k.featherRow(r, -34, -30, 12, -14, 7, 18, 5, 36, c.gcov || c.cov || c.wing, c.bar2 || ed, 1.2); // greater coverts
    wm += k.featherRow(r, -38, -40, 4, -30, 6, 12, 4, 38, c.mcov || c.cov || c.wing, c.bar1 || ed, 1.1);  // median coverts
    wm += k.hatch(r, { cx: -30, cy: -42, rx: 12, ry: 6, n: 30, len: 4, ang: 30, jit: 20, cols: [ed], w: 0.7, op: 0.6 }); // lesser coverts
    s += k.g(wm + (o.wingMarks || ''), 'clip-path="' + k.U(id + 'WC') + '"');
    s += k.p(wing, 'none', 'stroke="rgba(0,0,0,.25)" stroke-width="1"');
    s += k.sp('M-40 -45C-16 -54 18 -40 40 -18', 'rgba(255,255,255,.25)', 2);
    // beak
    var b = o.beak || { len: 18, depth: 8, curve: 1 }, bx = -88, by = -66;
    s += k.p('M' + (bx + 2) + ' ' + (by - b.depth) + 'Q' + n1(bx - b.len * 0.45) + ' ' + n1(by - b.depth * 0.75) + ' ' + (bx - b.len) + ' ' + (by + b.curve) +
      'Q' + n1(bx - b.len * 0.45) + ' ' + n1(by + b.depth * 0.7) + ' ' + (bx + 2) + ' ' + (by + b.depth) + 'Z', k.U(id + 'K'));
    s += k.sp('M' + (bx + 1) + ' ' + (by + 0.5) + 'Q' + n1(bx - b.len * 0.5) + ' ' + (by + 0.8) + ' ' + (bx - b.len + 1) + ' ' + (by + b.curve), 'rgba(0,0,0,.5)', 0.8);
    s += k.sp('M' + (bx - 2) + ' ' + n1(by - b.depth * 0.6) + 'Q' + n1(bx - b.len * 0.4) + ' ' + n1(by - b.depth * 0.55) + ' ' + n1(bx - b.len * 0.8) + ' ' + (by - 1), 'rgba(255,255,255,.5)', 0.8);
    s += k.circ(bx - 3, by - 2.5, 1, 'rgba(0,0,0,.5)');
    s += k.eye(-71, -72, o.eyeR || 4.6, c.iris || '#2a1a10', { ring: c.ring, ringR: c.ringR || 1.3 });
    if (o.over) s += o.over;
    return { defs: defs, s: s };
  }
  function n1(v) { return Math.round(v * 10) / 10; }

  // ---- Rufous-collared sparrow · Chincol ----
  P.chincol = function(k) {
    var r = k.rnd, bg = '', st = '';
    for (var i = 0; i < 8; i++) { var x = -36 + i * 10, y = -70 + i * 7.5; st += 'M' + x + ' ' + y + 'l8 4'; }
    var bird = songbird(k, {
      id: 'ch',
      body: 'M-90 -64C-92 -80 -84 -94 -72 -102C-64 -100 -52 -92 -42 -84C-14 -64 22 -44 46 -18C56 -6 62 6 58 14C50 28 34 36 14 42C-10 48 -40 42 -58 26C-74 12 -86 -10 -90 -32C-92 -44 -92 -56 -90 -64Z',
      c: { back: '#8a6a48', back2: '#b4aca0', belly: '#e9e5dc', belly2: '#d8d3c8', head: '#9d9c98', headHi: '#c6c5bf', head2: '#8a8984',
        wing: '#8b6640', wingDark: '#4e3622', cov: '#6a4a2c', tert: '#3e2a18', sec: '#6b4c30', prim: '#4a3523', edge: '#d6b98c', bar1: '#f3ecdc', bar2: '#efe4cc',
        tail: '#6a5038', tail2: '#4a3828', leg: '#b48f78', iris: '#3a2416', beak1: '#5d5a58', beak2: '#a39c94' },
      beak: { len: 15, depth: 7, curve: 1.5 },
      marks: k.p('M-50 -90C-36 -84 -28 -72 -26 -56C-30 -46 -42 -44 -56 -50C-46 -58 -48 -72 -58 -84Z', '#b5652f') +
        k.p('M-46 -84C-38 -78 -34 -70 -33 -60', 'none', 'stroke="#d98a4d" stroke-width="2" opacity=".6"') +
        k.p('M-86 -36C-80 -44 -68 -46 -60 -40C-62 -30 -72 -24 -84 -22Z', '#1d1a17') +
        k.sp(st, '#2f2418', 2.4, 'opacity=".75"'),
      headMarks: k.p('M-90 -76C-82 -86 -66 -92 -50 -88L-48 -83C-64 -87 -78 -84 -88 -72Z', '#151412') +
        k.p('M-88 -88C-80 -98 -66 -102 -54 -96L-55 -92C-66 -97 -78 -94 -86 -84Z', '#1b1a18') +
        k.p('M-66 -70C-60 -70 -54 -70 -46 -73L-46 -68C-54 -65 -60 -65 -66 -66Z', '#151412', 'opacity=".9"') +
        k.p('M-92 -54C-84 -48 -76 -46 -68 -48L-66 -44C-76 -42 -86 -44 -92 -48Z', '#f6f3ec') +
        k.p('M-70 -46L-60 -52L-56 -44L-66 -38Z', '#1d1a17', 'opacity=".85"'),
      wingMarks: ''
    });
    bg += k.branch(r, 'M10 228C110 222 200 220 268 214C320 210 360 196 392 178', 9, ['#3e2c1e', '#6e5038', '#a8865f']);
    bg += k.branch(r, 'M262 214C286 200 300 186 318 182', 4, ['#3e2c1e', '#6e5038', '#a8865f']);
    bg += k.leaf(318, 182, 34, 9, -20, { fill: '#5d7f3d', shade: '#2e4a1e' }) + k.leaf(300, 190, 28, 8, -60, { fill: '#6b8f45', shade: '#2e4a1e' });
    bg += k.leaf(60, 226, 30, 8, 160, { fill: '#5d7f3d', shade: '#2e4a1e' }) + k.leaf(44, 226, 24, 7, -150, { fill: '#6b8f45', shade: '#2e4a1e' });
    return { wash: '#cfc49a', defs: bird.defs, bg: bg, shadow: k.shadow(196, 222, 46, 4, 0.55), fg: '<g ' + k.tr(205, 143, 0, 1.25) + '>' + bird.s + '</g>' };
  };

  // ---- Austral thrush · Zorzal (on the lawn, with an earthworm) ----
  P.zorzal = function(k) {
    var r = k.rnd, bg = '', streaks = '';
    for (var i = 0; i < 16; i++) {
      var x = -88 + (i % 4) * 6 + r() * 3, y = -54 + Math.floor(i / 4) * 7 + r() * 2;
      streaks += 'M' + k.n(x) + ' ' + k.n(y) + 'l1.2 4.5';
    }
    var bird = songbird(k, {
      id: 'zo',
      body: 'M-90 -64C-92 -80 -82 -92 -66 -94C-52 -95 -42 -88 -34 -80C-14 -62 20 -42 44 -16C54 -4 60 8 56 16C48 30 32 38 12 44C-12 50 -42 44 -60 28C-76 12 -88 -10 -91 -32C-93 -44 -92 -56 -90 -64Z',
      c: { back: '#6a5c42', back2: '#857252', belly: '#efe2c6', belly2: '#d9a866', head: '#4a3e2e', headHi: '#655542', head2: '#3a3024',
        wing: '#6a5a40', wingDark: '#4a3d2a', cov: '#6e5d43', tert: '#5a4a34', edge: '#9c8a68', tail: '#4a3d2c', tail2: '#2f271c', leg: '#e0b42c',
        iris: '#2a1a10', beak1: '#f4c83e', beak2: '#c98a12', ring: '#e8b72a', ringR: 1.35,
        texL: 'rgba(255,240,210,.35)', texD: 'rgba(50,35,15,.4)' },
      beak: { len: 22, depth: 6.5, curve: 2 },
      legLen: 30,
      underMarks: k.el(-40, 30, 40, 18, '#f2e6cf', 'opacity=".6"'),
      marks: k.p('M-92 -56C-88 -46 -82 -40 -74 -38L-70 -46C-78 -48 -86 -52 -92 -58Z', '#ece2cf', 'opacity=".9"') + k.sp(streaks, '#4e3c2a', 1.6, 'opacity=".8"'),
      tail: 'M38 2C68 30 98 56 126 78L114 88C86 68 56 46 26 28Z'
    });
    bg += '<rect x="0" y="246" width="400" height="54" fill="#7c8f48" opacity=".3"/>';
    bg += k.grass(r, 0, 400, 262, 130, 30, ['#6f8a3c', '#8ea14b', '#577030', '#a4ad5c']);
    var worm = 'M96 212C90 220 92 232 102 236C112 240 120 248 116 260';
    var front = k.sp(worm, '#8f4740', 5.5) + k.sp(worm, '#d48a7c', 2, 'opacity=".8" transform="translate(-.8 -.8)"') + k.sp(worm, '#5e2622', 6, 'stroke-dasharray=".8 4.5" opacity=".5"');
    front += k.el(116, 262, 12, 3, '#5a4630', 'opacity=".6"');
    front += k.grass(r, 10, 390, 292, 120, 34, ['#5f7a33', '#7f9a44', '#4a6328', '#93a653'], 0.05);
    return { wash: '#c7c99a', defs: bird.defs, bg: bg, shadow: k.shadow(206, 252, 68, 6, 0.8), fg: '<g ' + k.tr(215, 158, 0, 1.3) + '>' + bird.s + '</g>', front: front };
  };

  // ---- Black-chinned siskin · Jilguero (male, on a thistle) ----
  P.jilguero = function(k) {
    var r = k.rnd, bg = '';
    var bird = songbird(k, {
      id: 'ji',
      c: { back: '#7d8c34', back2: '#a8ae3c', belly: '#f3dd4c', belly2: '#ead03a', head: '#d9c83c', headHi: '#f5e57e', head2: '#c4b032',
        wing: '#2a2a22', wingDark: '#141412', cov: '#2c2c26', tert: '#22221c', sec: '#1d1d1a', prim: '#1b1b18', edge: '#cdbf6a', bar1: '#f0d63e', bar2: '#f3da3e',
        tail: '#22221d', tail2: '#141412', leg: '#a8907e', iris: '#1e140c', beak1: '#c2b4a4', beak2: '#8c7c6e',
        texL: 'rgba(255,250,200,.45)', texD: 'rgba(80,80,20,.32)' },
      beak: { len: 14, depth: 7, curve: 1.2 },
      headMarks: k.p('M-94 -66C-92 -86 -76 -96 -58 -94C-46 -92 -38 -84 -36 -76C-54 -82 -76 -80 -94 -62Z', '#131311') +
        k.p('M-92 -58C-88 -48 -80 -42 -70 -42L-72 -56Z', '#151512'),
      wingMarks: k.p('M-30 -34C-4 -30 18 -16 34 0L28 6C14 -10 -6 -22 -32 -26Z', '#efd43c') +
        k.p('M14 12C36 20 56 30 72 40L66 44C50 36 30 26 8 18Z', '#e6c934', 'opacity=".95"'),
      tailMarks: k.p('M40 2C48 8 56 14 62 20L48 34L30 26Z', '#d9c235', 'opacity=".9"')
    });
    // thistle (cardo) stem with a purple flower head and a seed puff
    bg += k.sp('M300 300C296 250 300 210 296 180', '#6b7a45', 5) + k.sp('M300 300C296 250 300 210 296 180', '#9aa868', 1.6, 'transform="translate(-1 0)"');
    bg += k.branch(r, 'M30 234C110 226 200 228 290 222', 6, ['#4a5a2a', '#76884a', '#a9b878']);
    bg += k.leaf(296, 250, 46, 10, -150, { fill: '#7f9058', shade: '#45552a', veins: 6 }) + k.leaf(300, 232, 40, 9, -30, { fill: '#8a9a60', shade: '#45552a', veins: 6 });
    var spikes = '';
    for (var i = 0; i < 16; i++) { var a = -158 + i * 8.8; spikes += 'M296 176l' + k.n(Math.cos(a * Math.PI / 180) * 19) + ' ' + k.n(Math.sin(a * Math.PI / 180) * 17); }
    bg += k.sp(spikes, '#8e4ea6', 2.8) + k.sp(spikes, '#d7a6e0', 0.8);
    bg += k.el(296, 186, 15, 11, '#6f7f48') + k.scallops(r, { x0: 284, x1: 308, y0: 179, rows: 3, dx: 6, dy: 4, r: 3, fill: '#86975a', edge: '#4f5e30', ew: 0.6 });
    var puff = '';
    for (i = 0; i < 30; i++) { var b = r() * Math.PI * 2; puff += 'M352 132l' + k.n(Math.cos(b) * 18) + ' ' + k.n(Math.sin(b) * 18); }
    bg += k.sp('M352 132L350 196', '#7a8048', 1.5) + k.sp(puff, '#fffdf2', 0.8, 'opacity=".9"') + k.circ(352, 132, 3, '#c9bd94');
    return { wash: '#d4cf96', defs: bird.defs, bg: bg, shadow: k.shadow(186, 226, 40, 3, 0.5), fg: '<g ' + k.tr(190, 166, 0, 1.0) + '>' + bird.s + '</g>' };
  };

  // ---- Long-tailed meadowlark · Loica (male on a fence post) ----
  P.loica = function(k) {
    var r = k.rnd, bg = '', sc = '';
    for (var i = 0; i < 26; i++) {
      var x = -40 + (i % 7) * 13 + r() * 4, y = -66 + Math.floor(i / 7) * 12 + (i % 7) * 4;
      sc += 'M' + k.n(x) + ' ' + k.n(y) + 'q5 -2 9 3';
    }
    var bird = songbird(k, {
      id: 'lo',
      body: 'M-90 -64C-92 -80 -82 -92 -66 -94C-52 -95 -42 -88 -34 -80C-12 -64 22 -44 46 -18C56 -6 62 6 58 14C50 28 34 36 14 42C-10 48 -40 42 -58 26C-74 12 -86 -10 -90 -32C-92 -44 -92 -56 -90 -64Z',
      c: { back: '#5e4632', back2: '#7a5e42', belly: '#3a2b22', belly2: '#5a3a2a', head: '#5b4433', headHi: '#7d634b', head2: '#4a3828',
        wing: '#6b5038', wingDark: '#3f2d1f', cov: '#5a422c', tert: '#4a3524', edge: '#c9ad84', tail: '#4b3625', tail2: '#2e2016', leg: '#8a7a6a',
        iris: '#1e140c', beak1: '#e2dacd', beak2: '#7d756b', texL: 'rgba(255,230,200,.35)', texD: 'rgba(30,15,5,.5)' },
      beak: { len: 30, depth: 6.5, curve: 1 },
      legLen: 22,
      marks: k.p('M-93 -50C-92 -24 -82 -2 -64 14C-50 22 -34 22 -22 10C-28 -14 -40 -34 -60 -50C-72 -56 -86 -56 -93 -50Z', '#d4213a') +
        k.p('M-88 -44C-82 -28 -74 -14 -60 -4C-50 0 -42 -2 -38 -10C-44 -24 -56 -38 -72 -46Z', '#f04a5e', 'opacity=".5"') +
        k.sp(sc, '#c9a982', 1.4, 'opacity=".7"') +
        k.sp('M-50 26l8 4M-30 30l9 3M-14 32l9 2M-40 36l8 3M-2 30l8 2', '#1f160f', 2.2, 'opacity=".6"'),
      headMarks: k.p('M-90 -78C-82 -86 -68 -88 -52 -84L-52 -80C-68 -82 -80 -80 -88 -74Z', '#f1ebdf') +
        k.p('M-92 -76C-90 -80 -86 -82 -82 -81L-84 -75Z', '#e43a48') +
        k.sp('M-70 -96l4 10M-58 -94l3 9M-80 -94l4 8', '#2c2016', 2, 'opacity=".7"'),
      wingMarks: k.sp(sc, '#2e2014', 1.6, 'opacity=".45" transform="translate(10 30)"'),
      tail: 'M40 2C66 22 100 46 130 64L122 78C92 62 60 44 28 28Z',
      tailMarks: k.sp('M54 16l8 -3M70 27l8 -3M86 38l8 -3M102 49l8 -3', '#211710', 2, 'opacity=".7"')
    });
    bg += '<defs>' + k.lg('loPost', 0, 0, 1, 0, [[0, '#7a6450'], [0.4, '#a58c70'], [1, '#5a4636']]) + '</defs>';
    bg += k.p('M168 238L174 226L238 226L244 238L242 300L170 300Z', k.U('loPost'));
    bg += k.p('M174 226L238 226L244 238L168 238Z', '#c4ab8b');
    bg += k.sp('M190 244L188 296M212 250L214 298M228 242L230 280', '#4e3c2c', 1.2, 'opacity=".6"');
    bg += k.el(206, 232, 20, 3, 'none', 'stroke="#8a7258" stroke-width=".8" opacity=".7"');
    bg += k.sp('M0 250C60 254 120 256 168 252M244 252C300 256 350 254 400 248', '#5b5752', 1.3);
    bg += k.sp('M0 274C60 278 120 280 168 276M244 276C300 280 350 278 400 272', '#5b5752', 1.3);
    bg += k.grass(r, 0, 400, 300, 130, 42, ['#a8a05a', '#8e8a48', '#c2b673', '#6f7a3c']);
    return { wash: '#d6c79b', defs: bird.defs, bg: bg, shadow: k.shadow(206, 231, 32, 3.5, 0.7), fg: '<g ' + k.tr(212, 151, 0, 1.18) + '>' + bird.s + '</g>' };
  };

  // ---- Green-backed firecrown · Picaflor chico (male hovering at a chilco flower) ----
  P.picaflor = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.lg('pfB', 0.5, 0, 0.5, 1, [[0, '#4f7a2e'], [0.35, '#7fa046'], [0.55, '#cfd2c2'], [1, '#f2f0e8']]) +
      k.rg('pfH', 0.4, 0.35, 0.7, [[0, '#86a84a'], [1, '#3e5e24']]) +
      k.rg('pfCrown', 0.4, 0.5, 0.6, [[0, '#ffd24a'], [0.45, '#ff6a1f'], [1, '#c2261a']]) +
      k.lg('pfWing', 0, 1, 1, 0, [[0, '#4a4a3e', 0.75], [0.6, '#6a6a5a', 0.35], [1, '#8a8a7a', 0.08]]) +
      k.lg('pfSep', 0, 0, 1, 1, [[0, '#ff4a5e'], [1, '#b0102a']]) +
      k.lg('pfPet', 0, 0, 1, 1, [[0, '#8a4ab0'], [1, '#4a1e70']]) +
      k.clip('pfBC', 'M168 120C186 104 226 104 252 124C272 140 280 160 272 174C258 184 230 178 210 166C190 154 172 140 168 120Z');
    // chilco (Fuchsia magellanica) twig hanging from the top-left
    bg += k.branch(r, 'M-5 18C40 30 70 40 96 64C110 78 116 88 118 100', 3.5, ['#4a2a1e', '#7a4632', '#b07a5a']);
    bg += k.leaf(60, 36, 34, 9, 30, { fill: '#4e7a34', shade: '#25401a' }) + k.leaf(84, 56, 30, 8, -20, { fill: '#5d8a3c', shade: '#25401a' }) +
      k.leaf(30, 26, 30, 8, 80, { fill: '#5d8a3c', shade: '#25401a' }) + k.leaf(102, 80, 26, 7, 10, { fill: '#4e7a34', shade: '#25401a' });
    function chilco(x, y, rot, sc) {
      var f = '';
      f += k.sp('M0 -26L0 -6', '#b0283a', 2.2);
      f += k.el(0, -4, 4, 5, '#9a1c2c');
      // four flared red sepals
      f += k.p('M0 0C-10 6 -20 16 -26 30C-14 24 -6 16 0 8Z', k.U('pfSep'));
      f += k.p('M0 0C10 6 20 16 26 30C14 24 6 16 0 8Z', k.U('pfSep'));
      f += k.p('M0 0C-5 8 -9 20 -8 34C-2 24 0 14 0 6Z', '#d82a40');
      f += k.p('M0 0C5 8 9 20 8 34C2 24 0 14 0 6Z', '#e33a4e');
      // purple petal skirt
      f += k.p('M-8 8C-12 18 -10 28 -6 34L6 34C10 28 12 18 8 8Z', k.U('pfPet'));
      f += k.sp('M-3 12L-4 32M3 12L4 32', '#b07ad0', 0.8, 'opacity=".7"');
      // stamens and style
      f += k.sp('M-3 34L-6 50M0 34L0 54M3 34L6 50M1 34L2 60', '#c2203a', 0.9);
      f += k.circ(-6, 51, 1.4, '#7a3a6a') + k.circ(0, 55, 1.4, '#7a3a6a') + k.circ(6, 51, 1.4, '#7a3a6a') + k.circ(2, 61, 2, '#e8e0b0');
      return '<g ' + k.tr(x, y, rot, sc) + '>' + f + '</g>';
    }
    bg += chilco(118, 126, 20, 1.15) + chilco(70, 120, -8, 0.9);
    bg += k.sp('M118 100L118 98', '#7a4632', 2) + k.sp('M96 64C90 80 76 96 70 98', '#7a4632', 1.6);
    // ghosted wing beats behind
    s += k.p('M218 126C232 92 250 60 276 36C282 34 284 38 282 44C268 74 250 104 230 132Z', k.U('pfWing'), 'opacity=".55"');
    s += k.p('M222 132C246 148 272 166 300 190C302 196 298 198 292 196C266 176 242 160 220 146Z', k.U('pfWing'), 'opacity=".35"');
    // tail
    for (i = 0; i < 5; i++) s += k.feather(258, 166, 50 - Math.abs(i - 2) * 4, 6, 40 + i * 8, i % 2 ? '#3a4a22' : '#2e3a1c', '#55663a');
    // body
    s += k.p('M168 120C186 104 226 104 252 124C272 140 280 160 272 174C258 184 230 178 210 166C190 154 172 140 168 120Z', k.U('pfB'));
    var dots = '';
    for (i = 0; i < 46; i++) {
      var dx = 176 + r() * 70, dy = 132 + r() * 40;
      if (dy < 128 + (dx - 170) * 0.35) continue;
      dots += k.circ(dx, dy, 0.9 + r() * 1.2, r() < 0.6 ? '#6f8a3c' : '#8a7a3a', 'opacity=".75"');
    }
    s += k.g(k.hatch(r, { cx: 225, cy: 138, rx: 50, ry: 28, n: 160, len: 5, ang: 20, jit: 30, curve: 0.4, cols: ['rgba(255,255,220,.45)', 'rgba(30,50,10,.35)'], w: 0.7, op: 0.8 }) + dots +
      k.el(250, 170, 40, 16, '#000', 'opacity=".12"'), 'clip-path="' + k.U('pfBC') + '"');
    // tiny tucked feet
    s += k.sp('M226 172l-3 7M234 172l-2 7', '#2a2420', 1.6);
    // front wing (fully raised, the clearest beat)
    s += k.p('M214 124C224 86 238 52 258 22C263 18 267 21 266 27C258 60 244 96 228 130Z', k.U('pfWing'));
    s += k.sp('M224 118C232 88 244 58 258 30M220 120C228 92 236 70 248 46', '#2a2a22', 0.6, 'opacity=".5"');
    s += k.sp('M246 20q10 6 14 18M270 30q4 8 2 16', '#6a6a5a', 1, 'opacity=".35"');
    // head
    s += k.circ(186, 116, 17, k.U('pfH'));
    s += k.hatch(r, { cx: 186, cy: 116, rx: 14, ry: 14, n: 50, len: 4, ang: 15, jit: 30, cols: ['rgba(255,255,220,.4)', 'rgba(20,40,10,.4)'], w: 0.6, op: 0.8 });
    s += k.p('M172 108C178 98 192 96 202 104C196 104 184 106 172 112Z', k.U('pfCrown'));
    s += k.p('M176 104C182 100 190 99 196 101', 'none', 'stroke="#fff3b0" stroke-width="1.2" opacity=".8"');
    s += k.el(182, 128, 11, 5, '#ebe8dc');
    for (i = 0; i < 7; i++) s += k.circ(176 + r() * 14, 126 + r() * 6, 0.9, '#5f7a34');
    // long straight bill
    s += k.p('M172 116L98 125L98 126.6L172 121Z', '#1e1a16');
    s += k.sp('M170 116.8L104 124.6', 'rgba(255,255,255,.35)', 0.6);
    s += k.eye(181, 114, 3.6, '#1a120c');
    s += k.circ(189, 117, 1.6, '#fff');
    return { wash: '#c8d4a8', defs: defs, bg: bg, shadow: k.shadow(230, 268, 52, 5, 0.35), fg: s };
  };

  // ---- Southern lapwing · Queltehue ----
  P.queltehue = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M160 132C168 112 196 104 230 108C262 112 290 124 314 140C332 152 340 162 334 170C318 180 290 184 258 184C224 184 196 180 176 168C162 160 156 146 160 132Z';
    var defs = k.lg('qB', 0.5, 0, 0.5, 1, [[0, '#8a8270'], [0.45, '#9c9585'], [0.62, '#f4f2ec'], [1, '#e2ded4']]) +
      k.lg('qW', 0, 0, 1, 1, [[0, '#7c7462'], [0.5, '#5e584a'], [1, '#2a2622']]) +
      k.lg('qIri', 0, 0, 1, 1, [[0, '#4e7a5a'], [0.4, '#8a5a8a'], [0.7, '#b07a3a'], [1, '#4e6a4a']]) +
      k.rg('qH', 0.4, 0.35, 0.7, [[0, '#bdb8ad'], [1, '#8c877c']]) +
      k.clip('qBC', body) + k.clip('qWC', 'M188 122C222 110 270 118 310 136C330 146 344 156 350 164C320 166 282 164 250 160C220 156 198 148 188 138Z');
    bg += '<rect x="0" y="236" width="400" height="64" fill="#8a9a4a" opacity=".22"/>';
    bg += k.grass(r, 0, 400, 262, 130, 26, ['#7a9040', '#97a854', '#5d7432', '#b0b56a']);
    var shadowS = k.shadow(224, 252, 72, 6, 0.75);
    // legs (long, pinkish red), knees bending back
    var leg = function(x, kx) {
      return k.sp('M' + x + ' 178L' + kx + ' 214L' + (kx - 4) + ' 252', '#b65a5a', 3.4) + k.sp('M' + x + ' 178L' + kx + ' 214L' + (kx - 4) + ' 252', 'rgba(255,255,255,.25)', 0.9, 'transform="translate(-.8 0)"') +
        k.sp('M' + (kx - 4) + ' 252l-12 2M' + (kx - 4) + ' 252l-6 5M' + (kx - 4) + ' 252l8 1', '#a44c4c', 2.2);
    };
    s += leg(238, 246) + leg(222, 222);
    // tail (white with black band) under the wingtips
    s += k.p('M318 150L352 160L350 170L322 168Z', '#f4f2ec') + k.p('M336 156L352 160L350 170L336 168Z', '#1e1c1a');
    s += k.p(body, k.U('qB'));
    s += k.g(k.hatch(r, { cx: 240, cy: 140, rx: 80, ry: 30, n: 160, len: 6, ang: 10, jit: 20, curve: 0.3, cols: ['rgba(255,255,255,.4)', 'rgba(60,50,30,.35)'], w: 0.7, op: 0.8 }), 'clip-path="' + k.U('qBC') + '"');
    // black breast shield
    s += k.p('M160 116C156 134 158 156 172 168C184 162 194 148 196 130C190 120 178 112 166 110Z', '#151413');
    // folded wing with bronze shoulder
    var wing = 'M188 122C222 110 270 118 310 136C330 146 344 156 350 164C320 166 282 164 250 160C220 156 198 148 188 138Z';
    s += k.p(wing, k.U('qW'));
    s += k.p('M196 124C220 114 256 116 284 128C262 136 232 140 206 138Z', k.U('qIri'), 'opacity=".85"');
    s += k.g(k.scallops(r, { x0: 226, x1: 320, y0: 136, rows: 3, dx: 14, dy: 7, r: 6, fill: '#57514a', edge: '#b0a690', ew: 0.9, eop: 0.6, jit: 2, rowShift: 8 }), 'clip-path="url(#§qWC)"');
    for (i = 0; i < 4; i++) s += k.feather(268 + i * 6, 152 + i * 1.5, 82 - i * 8, 5, 8 + i, '#1a1816', '#3a3630');
    s += k.p(wing, 'none', 'stroke="rgba(0,0,0,.25)"');
    // red wing spur at the bend of the wing
    s += k.p('M194 128L180 126L193 132Z', '#c23a2a');
    // neck + head
    s += k.p('M168 104C176 112 184 124 186 132L162 136C158 124 158 112 160 104Z', '#a39e92');
    s += k.circ(160, 96, 21, k.U('qH'));
    s += k.hatch(r, { cx: 160, cy: 96, rx: 18, ry: 18, n: 50, len: 4, ang: 10, jit: 30, cols: ['rgba(255,255,255,.4)', 'rgba(60,50,30,.3)'], w: 0.6, op: 0.8 });
    // black forehead–throat stripe with white border, the thin crest
    s += k.p('M144 84C140 92 140 100 144 108C148 116 156 124 162 128L168 122C160 114 152 104 150 94C150 88 150 84 152 80Z', '#f3f1ea');
    s += k.p('M142 86C138 94 140 104 146 112C152 120 158 126 164 130L166 124C158 116 152 106 150 96Z', '#151413');
    s += k.sp('M172 82C188 72 204 70 214 76C208 72 196 74 186 80', '#151413', 2.2);
    s += k.sp('M172 84C186 76 200 75 208 79', '#151413', 1.4);
    // short pinkish bill with a dark tip
    s += k.p('M142 94L124 98L142 101Z', '#c96a6a');
    s += k.p('M130 96.6L123 98.2L130 99.6Z', '#1e1a16');
    s += k.eye(151, 92, 4, '#c0201a', { ring: '#d8443a', ringR: 1.35 });
    s = '<g transform="translate(-58 -66) scale(1.25)">' + s + '</g>';
    return { wash: '#c3cba0', defs: defs, bg: bg, shadow: shadowS, fg: s, front: k.grass(r, 120, 320, 268, 50, 20, ['#6a8236', '#8ea04c'], 0) };
  };

  // ---- Chimango caracara · Tiuque (perched on a stump by a ploughed field) ----
  P.tiuque = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M170 92C186 80 214 84 228 100C244 120 252 150 250 178C248 200 240 214 226 220C206 226 186 216 176 196C166 176 162 140 164 116C164 104 166 96 170 92Z';
    var defs = k.lg('tB', 0.3, 0, 0.7, 1, [[0, '#8a6a4a'], [0.5, '#7a5c3e'], [1, '#5a4430']]) +
      k.lg('tW', 0, 0, 1, 1, [[0, '#6e5236'], [1, '#3e2c1e']]) +
      k.rg('tH', 0.42, 0.38, 0.7, [[0, '#a08060'], [1, '#6a5038']]) +
      k.lg('tStump', 0, 0, 1, 0, [[0, '#5a4636'], [0.45, '#8a7058'], [1, '#4a382a']]) +
      k.clip('tBC', body) + k.clip('tWC', 'M206 104C228 108 244 130 248 160C250 170 238 172 214 170C200 148 198 120 206 104Z');
    // ploughed furrows behind
    bg += '<defs>' + k.lg('tSoil', 0, 0, 0, 1, [[0, '#a68a6a', 0], [0.3, '#9a7a58', 0.7], [1, '#6e523a', 0.9]]) + '</defs>';
    bg += '<rect x="0" y="200" width="400" height="100" fill="' + k.U('tSoil') + '"/>';
    var fur = '';
    for (i = 0; i < 7; i++) fur += 'M0 ' + (214 + i * 13) + 'C120 ' + (208 + i * 13) + ' 280 ' + (220 + i * 13) + ' 400 ' + (212 + i * 13);
    bg += k.sp(fur, '#5a4230', 2, 'opacity=".45"') + k.sp(fur, '#c9ad88', 1, 'opacity=".4" transform="translate(0 -3)"');
    bg += k.ridge(r, 'tR', 196, 22, '#9cab80', 0, 0.55);
    // stump
    bg += k.p('M160 230C158 260 156 284 150 300L262 300C256 284 252 260 252 230Z', k.U('tStump'));
    bg += k.el(206, 230, 46, 10, '#b89a78') + k.el(206, 230, 32, 6, 'none', 'stroke="#8a6e52" stroke-width="1"') + k.el(206, 230, 18, 3.5, 'none', 'stroke="#8a6e52" stroke-width=".9"');
    bg += k.sp('M172 244L168 296M196 246L194 298M226 244L230 298M244 240L248 290', '#3a2c20', 1.3, 'opacity=".5"');
    var shadowS = k.shadow(208, 231, 38, 5, 0.7);
    // long barred tail
    s += k.p('M214 196L248 276L232 282L198 204Z', '#7a5e44');
    var bars = '';
    for (i = 0; i < 6; i++) bars += 'M' + (204 + i * 6) + ' ' + (214 + i * 12) + 'l14 -5';
    s += k.sp(bars, '#4a3626', 2.2, 'opacity=".7"') + k.p('M240 268L248 276L232 282L228 274Z', '#e8dcc6');
    // legs (pale)
    s += k.sp('M198 210L196 230M212 212L214 230', '#c9c08a', 3.4) + k.foot(196, 230, '#b8ae7a', 1.5, -1) + k.foot(214, 230, '#b8ae7a', 1.5, -1);
    // body with mottled pale breast
    s += k.p(body, k.U('tB'));
    var mott = '';
    for (i = 0; i < 60; i++) { var mx = 168 + r() * 50, my = 110 + r() * 100; if (mx > 165 + (my - 100) * 0.35 + 20) continue; mott += k.el(mx, my, 2 + r() * 2.5, 1.2 + r(), r() < 0.5 ? '#c9b08a' : '#a88a66', 'opacity=".7"'); }
    s += k.g(k.el(186, 150, 30, 60, '#b8996f', 'opacity=".45"') + mott + k.hatch(r, { cx: 205, cy: 150, rx: 45, ry: 70, n: 220, len: 6, ang: 80, jit: 25, curve: 0.3, cols: ['rgba(255,240,210,.35)', 'rgba(40,25,10,.4)'], w: 0.8, op: 0.8 }), 'clip-path="' + k.U('tBC') + '"');
    // folded wing
    var wing = 'M206 104C228 108 244 130 248 160C252 190 246 214 236 236C226 220 214 196 206 170C200 148 198 120 206 104Z';
    s += k.p(wing, k.U('tW'));
    s += k.g(k.scallops(r, { x0: 206, x1: 246, y0: 112, rows: 6, dx: 9, dy: 8, r: 5, fill: '#6a4e34', edge: '#c4a47c', ew: 0.9, eop: 0.6, jit: 1.5, rowShift: 1.5 }), 'clip-path="url(#§tWC)"');
    for (i = 0; i < 4; i++) s += k.feather(222 + i * 3, 168 + i * 2, 70 - i * 6, 5, 76 - i * 2, '#3a2a1c', '#8a7050');
    s += k.p(wing, 'none', 'stroke="rgba(0,0,0,.25)"');
    // head
    s += k.circ(192, 92, 22, k.U('tH'));
    s += k.hatch(r, { cx: 192, cy: 92, rx: 19, ry: 19, n: 60, len: 4.5, ang: 20, jit: 30, cols: ['rgba(255,240,210,.35)', 'rgba(40,25,10,.4)'], w: 0.7, op: 0.8 });
    s += k.p('M176 98C182 104 192 108 202 106', 'none', 'stroke="#5a4230" stroke-width="2.4" opacity=".6"');
    // bare facial skin + pale hooked bill
    s += k.el(180, 88, 8, 6, '#e2c27a', 'opacity=".9"');
    s += k.p('M176 84C170 84 164 86 162 92C160 96 162 100 164 98C166 95 168 94 172 94Z', '#e9dcc0');
    s += k.p('M174 86C178 86 182 88 182 92C178 94 174 94 172 94Z', '#d9b870');
    s += k.p('M164 98C166 101 170 101 174 99L172 96Z', '#b8a888');
    s += k.eye(182, 86, 3.8, '#5a3a1e', { ring: '#e8c47a', ringR: 1.5 });
    s = '<g transform="translate(205 230) scale(1.28) translate(-205 -230)">' + s + '</g>';
    return { wash: '#d3c4a0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Magellanic woodpecker · Carpintero negro (male on a southern beech) ----
  P.carpintero = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.lg('cwT', 0, 0, 1, 0, [[0, '#4a4036'], [0.35, '#8a7e6e'], [0.7, '#6a5e50'], [1, '#3a3028']]) +
      k.lg('cwB', 0, 0, 1, 1, [[0, '#2e2c2a'], [0.5, '#161514'], [1, '#050505']]) +
      k.rg('cwH', 0.45, 0.4, 0.7, [[0, '#f04a32'], [0.6, '#c81e16'], [1, '#7e0c08']]) +
      k.lg('cwS', 0, 0, 0, 1, [[0, '#9fb0c4', 0.3], [0.4, '#9fb0c4', 0], [1, '#000', 0]]);
    // forest behind: misty trunks and a coigüe trunk
    bg += k.p('M40 0L58 0L62 300L36 300Z', '#9aa894', 'opacity=".35"') + k.p('M110 0L122 0L126 300L104 300Z', '#9aa894', 'opacity=".25"');
    bg += k.p('M370 0L388 0L392 300L366 300Z', '#9aa894', 'opacity=".3"');
    bg += k.p('M244 -5C240 80 238 200 232 305L334 305C330 200 326 80 330 -5Z', k.U('cwT'));
    var bark = '';
    for (i = 0; i < 40; i++) { var bx = 240 + r() * 88, by = r() * 300; bark += 'M' + k.n(bx) + ' ' + k.n(by) + 'q' + k.n((r() - 0.5) * 4) + ' ' + k.n(14 + r() * 20) + ' ' + k.n((r() - 0.5) * 3) + ' ' + k.n(28 + r() * 30); }
    bg += k.sp(bark, '#2e261e', 1.4, 'opacity=".55"') + k.sp(bark, '#b0a490', 0.8, 'opacity=".4" transform="translate(2 0)"');
    for (i = 0; i < 30; i++) bg += k.circ(250 + r() * 76, r() * 300, 1 + r() * 3, r() < 0.5 ? 'rgba(190,200,150,.6)' : 'rgba(220,210,170,.5)');
    // old-man's-beard lichen hanging from a stub
    bg += k.branch(r, 'M330 70C350 66 366 60 380 50', 5, ['#3a3028', '#6a5e50', '#9a8e7e']);
    var lich = '';
    for (i = 0; i < 18; i++) { var lx = 336 + r() * 40; lich += 'M' + k.n(lx) + ' ' + k.n(66 - (lx - 336) * 0.4) + 'q' + k.n((r() - 0.5) * 8) + ' 16 ' + k.n((r() - 0.5) * 6) + ' ' + k.n(24 + r() * 26); }
    bg += k.sp(lich, '#c9d2a8', 1, 'opacity=".9"');
    // excavation hole and chips
    bg += k.el(248, 168, 9, 14, '#2a1e14') + k.el(250, 166, 6, 10, '#120c08');
    for (i = 0; i < 8; i++) bg += k.p('M0 0l5 -1l1 3l-5 1Z', '#d8c4a0', k.tr(200 + r() * 40, 200 + r() * 90, r() * 180));
    // the woodpecker clinging on the left side of the trunk, facing left/up
    // tail braced against the bark
    s += k.p('M244 214L262 270L250 274L232 220Z', '#121110') + k.sp('M240 222L254 268M236 222L248 270', '#3a3632', 0.9);
    // body
    var body = 'M206 122C220 108 244 112 252 132C260 156 258 190 250 214C244 226 232 230 222 224C206 212 196 180 196 156C196 140 198 130 206 122Z';
    s += k.p(body, k.U('cwB'));
    s += k.hatch(r, { cx: 226, cy: 170, rx: 24, ry: 48, n: 120, len: 7, ang: 80, jit: 20, curve: 0.3, cols: ['#3e3a36', '#000'], w: 0.9, op: 0.7 });
    // folded wing with white patch at the rear edge
    var wing = 'M222 128C240 130 252 150 254 176C256 196 252 214 246 228C236 214 226 190 222 168C218 152 218 136 222 128Z';
    s += k.p(wing, '#1a1918');
    s += k.p('M236 164C246 172 252 188 251 206C246 202 240 194 237 184C234 176 234 170 236 164Z', '#f3f1ea') + k.sp('M240 176q5 8 6 20', '#bdb8ac', 0.8);
    s += k.sp('M226 140q8 4 12 14M224 152q8 4 12 14M228 130q8 2 14 10', '#4a4642', 1, 'opacity=".7"');
    s += k.p(wing, k.U('cwS'));
    // feet gripping the bark
    s += k.sp('M236 214l10 4M236 214l9 -3M232 200l12 2M232 200l10 -4', '#4a4642', 2.2);
    // neck + red head with curled crest
    s += k.p('M204 124C200 112 202 100 208 94L230 102C226 112 224 120 226 130Z', '#151413');
    s += k.p('M188 70C192 54 206 44 220 48C230 40 242 42 244 52C236 52 230 56 228 62C238 64 242 72 236 80C232 92 222 102 208 104C194 104 186 90 188 70Z', k.U('cwH'));
    s += k.hatch(r, { cx: 212, cy: 76, rx: 20, ry: 20, n: 80, len: 5, ang: 0, angFn: function(x, y) { return Math.atan2(y - 90, x - 200) * 180 / Math.PI; }, jit: 30, curve: 0.4, cols: ['#ff7a5a', '#8a0c08'], w: 0.8, op: 0.7 });
    s += k.sp('M222 50C232 42 242 44 244 52M226 58C236 54 242 58 240 64', '#ff8a6a', 1.2, 'opacity=".6"');
    // chisel bill
    s += k.p('M192 78L160 74L160 77L190 86Z', '#3a3836') + k.sp('M190 79L162 75.5', 'rgba(255,255,255,.3)', 0.7);
    s += k.eye(200, 76, 3.6, '#e8c62a', { ring: '#2a1410', ringR: 1.3 });
    return { wash: '#b7c4ab', defs: defs, bg: bg, fg: s };
  };

  // ---- Humboldt penguin · Pingüino de Humboldt ----
  P.pinguino = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M196 80C176 84 166 104 166 128C164 160 160 196 168 224C174 244 194 254 214 252C238 250 254 236 256 210C258 180 252 150 244 124C236 100 222 82 206 80Z';
    var defs = k.lg('pgB', 0, 0, 1, 0, [[0, '#f6f4ee'], [0.5, '#e8e5dc'], [1, '#c8c4b8']]) +
      k.lg('pgK', 0, 0, 1, 0.3, [[0, '#2a2c30'], [0.5, '#16181a'], [1, '#080909']]) +
      k.lg('pgF', 0, 0, 1, 1, [[0, '#2a2c30'], [1, '#08090a']]) +
      k.clip('pgBC', body) +
      k.lg('pgRock', 0, 0, 0, 1, [[0, '#a8a090'], [0.4, '#7a7266'], [1, '#4a443c']]);
    bg += k.sea(r, 150, 110);
    bg += k.p('M0 236C40 222 90 226 130 236C170 244 230 236 270 240C320 244 360 232 400 236L400 300L0 300Z', k.U('pgRock'));
    bg += k.p('M60 236C80 230 110 232 130 238C110 240 80 240 60 236Z', '#efece0', 'opacity=".8"');
    bg += k.p('M280 240C300 236 330 236 350 240C330 244 300 244 280 240Z', '#efece0', 'opacity=".7"');
    bg += k.rock(r, 'pgR2', 330, 196, 120, 50, ['#9a9284', '#6a6258', '#3e3832']);
    bg += k.sp('M300 210C312 206 330 206 344 212', '#f2efe4', 3, 'opacity=".75"');
    var shadowS = k.shadow(214, 252, 56, 6, 0.85);
    // feet
    s += k.p('M190 246C184 250 176 254 172 256C182 258 196 256 204 252Z', '#2a2224') + k.sp('M178 254l4 -3M186 255l3 -4', '#c99a9a', 1);
    s += k.p('M222 248C218 252 212 256 208 258C218 260 230 258 236 254Z', '#2a2224');
    // body: white front, black back
    s += k.p(body, k.U('pgB'));
    s += k.g(
      k.p('M206 80C222 82 236 100 244 124C252 150 258 180 256 210C254 236 238 250 214 252C232 238 240 210 236 180C232 150 222 124 214 104C210 94 206 86 200 82Z', k.U('pgK')) +
      // the black breast band (horseshoe) and the speckles
      k.p('M164 146C180 142 204 144 228 150L232 162C210 156 186 154 163 158Z', '#141516') +
      (function() { var sp = ''; for (var j = 0; j < 14; j++) sp += k.circ(172 + r() * 40, 172 + r() * 40, 0.9 + r() * 1.3, '#202224', 'opacity=".8"'); return sp; })() +
      k.hatch(r, { cx: 186, cy: 200, rx: 18, ry: 44, n: 80, len: 4, ang: 90, jit: 30, cols: ['rgba(0,0,0,.12)', 'rgba(255,255,255,.6)'], w: 0.7, op: 1 }) +
      k.hatch(r, { cx: 232, cy: 170, rx: 18, ry: 60, n: 120, len: 5, ang: 80, jit: 25, cols: ['#3a3d42', '#000'], w: 0.8, op: 0.7 }),
      'clip-path="' + k.U('pgBC') + '"');
    // flipper
    s += k.p('M226 136C236 150 242 176 240 204C238 214 232 216 230 208C226 186 222 162 218 144Z', k.U('pgF'));
    s += k.sp('M228 146C234 166 236 188 234 204', 'rgba(255,255,255,.18)', 1.2);
    // head: black, with the white stripe arching from the bill over the eye and down to the throat
    s += k.p('M168 64C168 44 184 32 202 34C220 36 230 52 228 70C226 86 222 98 216 108L168 120C165 102 167 82 168 64Z', '#141516');
    s += k.sp('M176 51C184 39 204 35 216 45C227 56 225 76 216 90C210 99 204 105 199 112', '#f6f4ee', 5.5);
    s += k.hatch(r, { cx: 196, cy: 70, rx: 22, ry: 26, n: 50, len: 3, ang: 20, jit: 40, cols: ['#3a3d42'], w: 0.6, op: 0.6 });
    // stout bill with pale band and pink bare skin at the base
    s += k.p('M172 60C164 60 152 62 144 66C150 70 162 72 172 70Z', '#1c1c1e');
    s += k.sp('M156 63L156 70', '#b8b4aa', 1.8);
    s += k.p('M176 54C170 56 168 64 172 72C178 74 184 68 184 62C182 56 180 54 176 54Z', '#e88a8a');
    s += k.eye(182, 60, 3.4, '#5a3020');
    return { wash: '#a9c6cf', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Peruvian pelican · Pelícano (on a fishing-cove piling) ----
  P.pelicano = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M196 150C220 132 270 130 304 146C332 160 350 182 352 204C352 222 336 234 312 236C278 238 240 230 216 214C198 202 188 182 188 168C188 160 190 154 196 150Z';
    var defs = k.lg('peB', 0.3, 0, 0.6, 1, [[0, '#a8a49c'], [0.5, '#6e6a64'], [1, '#3e3a36']]) +
      k.lg('peN', 0, 0, 1, 0, [[0, '#5a4636'], [1, '#3e3028']]) +
      k.lg('peBill', 0, 0, 1, 0, [[0, '#e8d8a8'], [0.6, '#d8b878'], [1, '#c46a4a']]) +
      k.lg('pePouch', 0, 0, 0, 1, [[0, '#6a5a50'], [1, '#3a2e2a']]) +
      k.lg('pePost', 0, 0, 1, 0, [[0, '#4a3a2c'], [0.4, '#7a6450'], [1, '#3a2c20']]) +
      k.clip('peBC', body) + k.clip('peWC', 'M220 160C256 146 300 150 330 170C350 184 362 206 366 228C340 222 304 214 270 206C244 198 226 184 220 170Z');
    bg += k.sea(r, 140, 160);
    bg += k.p('M0 142C30 130 70 126 110 134C130 138 140 140 150 142Z', '#8f9f98', 'opacity=".55"');
    bg += k.p('M232 236L236 300L300 300L304 236Z', k.U('pePost')) + k.el(268, 236, 36, 7, '#a08870');
    bg += k.sp('M246 246L244 296M268 244L270 298M288 246L290 292', '#2a2018', 1.3, 'opacity=".55"');
    bg += k.sp('M236 272L304 270', '#c9c2b0', 2.5, 'opacity=".5"');
    var shadowS = k.shadow(270, 236, 34, 5, 0.6);
    // tail
    s += k.p('M332 214L372 236L364 244L320 226Z', '#3e3a36');
    // grey webbed feet
    s += k.p('M254 228L250 238L262 240L266 230Z', '#3a3634') + k.p('M282 230L280 239L292 240L294 232Z', '#2e2a28');
    // body
    s += k.p(body, k.U('peB'));
    var str = '';
    for (i = 0; i < 70; i++) { var x = 210 + r() * 130, y = 145 + r() * 70; str += 'M' + k.n(x) + ' ' + k.n(y) + 'l' + k.n(12 + r() * 10) + ' ' + k.n(4 + r() * 3); }
    s += k.g(k.sp(str, '#d8d4ca', 1.2, 'opacity=".4"') + k.sp(str, '#2e2a26', 0.9, 'opacity=".3" transform="translate(0 2)"'), 'clip-path="' + k.U('peBC') + '"');
    // folded wing
    var wing = 'M220 160C256 146 300 150 330 170C350 184 362 206 366 228C340 222 304 214 270 206C244 198 226 184 220 170Z';
    s += k.p(wing, '#5a5650');
    s += k.g(k.scallops(r, { x0: 222, x1: 340, y0: 152, rows: 5, dx: 15, dy: 9, r: 7, fill: '#6e6a62', edge: '#d0cabe', ew: 1, eop: 0.6, jit: 2, rowShift: 6 }), 'clip-path="url(#§peWC)"');
    for (i = 0; i < 5; i++) s += k.feather(282 + i * 6, 196 + i * 2, 86 - i * 8, 6, 18 + i, '#2a2724', '#4a4640');
    s += k.p(wing, 'none', 'stroke="rgba(0,0,0,.25)"');
    // S-curved neck: dark brown hindneck, white stripe on the side
    var neck = 'M206 160C192 146 186 124 192 104C196 90 200 80 198 70L174 66C176 82 170 96 168 112C164 136 172 156 190 170Z';
    s += k.p(neck, k.U('peN'));
    s += k.p('M176 70C178 86 172 100 172 116C170 136 178 152 194 164L188 168C170 154 162 136 164 114C166 96 170 84 170 70Z', '#f2efe6');
    s += k.hatch(r, { cx: 186, cy: 118, rx: 12, ry: 40, n: 50, len: 5, ang: 90, jit: 30, cols: ['rgba(255,255,255,.3)', 'rgba(0,0,0,.3)'], w: 0.7, op: 0.8 });
    // head with pale crown; long bill resting down the front of the neck
    s += k.el(184, 62, 20, 15, '#efeadc');
    s += k.p('M176 50C184 42 198 44 204 52C196 50 186 50 176 54Z', '#f0d890');
    s += k.p('M170 66C160 90 150 116 140 146C150 140 162 120 172 98C176 86 178 76 178 68Z', k.U('pePouch'));
    s += k.p('M166 56C156 82 144 112 132 144C130 150 136 152 139 147C152 118 166 88 176 64Z', k.U('peBill'));
    s += k.sp('M168 58C158 84 146 114 134 144', 'rgba(255,255,255,.5)', 0.8);
    s += k.p('M132 144C130 151 135 154 139 148L136 142Z', '#b24a3a');
    s += k.eye(180, 60, 3.2, '#d8c08a', { ring: '#e0a8a0', ringR: 1.5 });
    return { wash: '#aec4c9', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Austral pygmy owl · Chuncho (front view on a branch) ----
  P.chuncho = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.rg('owB', 0.5, 0.35, 0.65, [[0, '#a07a56'], [0.7, '#7a5a3e'], [1, '#5a4230']]) +
      k.rg('owH', 0.5, 0.4, 0.6, [[0, '#9a7650'], [1, '#6a4c34']]) +
      k.rg('owIris', 0.5, 0.5, 0.5, [[0, '#ffe066'], [0.7, '#f2c21a'], [1, '#c8920a']]) +
      k.clip('owBC', 'M200 118C230 118 250 140 252 172C254 206 236 236 200 238C164 236 146 206 148 172C150 140 170 118 200 118Z') +
      '<clipPath id="§owHC"><circle cx="200" cy="96" r="44"/></clipPath>';
    bg += k.branch(r, 'M-5 246C80 240 160 236 230 238C300 240 350 230 405 214', 12, ['#3a2a1c', '#6a4e36', '#a08060']);
    bg += k.branch(r, 'M300 236C320 220 334 200 340 180', 5, ['#3a2a1c', '#6a4e36', '#a08060']);
    bg += k.leaf(340, 180, 30, 8, -70, { fill: '#5a7a3c', shade: '#2a4018' }) + k.leaf(334, 196, 26, 7, -20, { fill: '#6a8a46', shade: '#2a4018' });
    bg += k.leaf(60, 242, 30, 9, -140, { fill: '#5a7a3c', shade: '#2a4018' }) + k.leaf(40, 242, 26, 7, 160, { fill: '#6a8a46', shade: '#2a4018' });
    // long barred tail hanging below the branch
    s += k.p('M190 226L188 286L212 286L210 226Z', '#6e5038');
    s += k.sp('M190 240h20M190 252h20M189 264h22M189 276h22', '#e8dcc6', 2, 'opacity=".75"');
    // body
    s += k.p('M200 118C230 118 250 140 252 172C254 206 236 236 200 238C164 236 146 206 148 172C150 140 170 118 200 118Z', k.U('owB'));
    var streak = '';
    for (i = 0; i < 26; i++) { var x = 178 + r() * 44, y = 150 + r() * 70; streak += 'M' + k.n(x) + ' ' + k.n(y) + 'q1 4 0 8'; }
    s += k.g(k.el(200, 190, 30, 44, '#efe6d4') + k.sp(streak, '#7a5434', 2.4, 'opacity=".8"') +
      k.hatch(r, { cx: 200, cy: 180, rx: 50, ry: 60, n: 200, len: 5, ang: 90, jit: 40, curve: 0.4, cols: ['rgba(255,245,225,.45)', 'rgba(50,30,15,.35)'], w: 0.8, op: 0.8 }), 'clip-path="' + k.U('owBC') + '"');
    // wings at the sides with white spots
    var wl = 'M154 146C146 166 146 200 156 226C164 214 168 186 168 160Z', wr = 'M246 146C254 166 254 200 244 226C236 214 232 186 232 160Z';
    s += k.p(wl, '#5e4430') + k.p(wr, '#5e4430');
    for (i = 0; i < 6; i++) { s += k.circ(156 + r() * 8, 160 + i * 10, 1.8, '#efe4cc') + k.circ(236 + r() * 8, 160 + i * 10, 1.8, '#efe4cc'); }
    // feet gripping the branch
    s += k.sp('M186 234l-4 8M190 234l0 9M194 234l4 8M206 234l-4 8M210 234l0 9M214 234l4 8', '#e2c05a', 3) + k.sp('M182 242l-1 3M190 243l0 3M198 242l1 3M202 242l-1 3M210 243l0 3M218 242l1 3', '#1a1410', 2);
    // head
    s += k.circ(200, 96, 44, k.U('owH'));
    var spots = '';
    for (i = 0; i < 46; i++) { var a = r() * Math.PI * 2, rr = 20 + r() * 22; var sx = 200 + Math.cos(a) * rr, sy = 96 + Math.sin(a) * rr * 0.9; if (sy > 92 && Math.abs(sx - 200) < 30) continue; spots += k.circ(sx, sy, 1.2 + r() * 1.2, '#f2e8d4'); }
    s += k.g(spots + k.hatch(r, { cx: 200, cy: 96, rx: 42, ry: 42, n: 120, len: 4, ang: 90, jit: 60, cols: ['rgba(255,245,225,.35)', 'rgba(50,30,15,.35)'], w: 0.7, op: 0.8 }), 'clip-path="' + k.U('owHC') + '"');
    // facial disc, white brows, yellow eyes
    s += k.el(182, 104, 19, 17, '#a5825c') + k.el(218, 104, 19, 17, '#a5825c');
    s += k.hatch(r, { cx: 182, cy: 104, rx: 16, ry: 14, n: 40, len: 6, ang: 0, angFn: function(x, y) { return Math.atan2(y - 104, x - 182) * 180 / Math.PI; }, jit: 10, cols: ['#c9a27a', '#7a5a3a'], w: 0.6, op: 0.8 });
    s += k.hatch(r, { cx: 218, cy: 104, rx: 16, ry: 14, n: 40, len: 6, ang: 0, angFn: function(x, y) { return Math.atan2(y - 104, x - 218) * 180 / Math.PI; }, jit: 10, cols: ['#c9a27a', '#7a5a3a'], w: 0.6, op: 0.8 });
    s += k.p('M164 92C172 84 186 84 196 92C186 90 174 90 164 96Z', '#f6f0e2') + k.p('M236 92C228 84 214 84 204 92C214 90 226 90 236 96Z', '#f6f0e2');
    s += k.p('M196 116C198 108 202 108 204 116C202 124 198 124 196 116Z', '#e8dcc0');
    s += k.circ(182, 102, 10.5, k.U('owIris')) + k.circ(218, 102, 10.5, k.U('owIris'));
    s += k.eye(182, 102, 10.5, 'none', { pupil: 0.48 }).replace('fill="none"', 'fill="#f2c21a" fill-opacity="0"');
    s += k.eye(218, 102, 10.5, 'none', { pupil: 0.48 }).replace('fill="none"', 'fill="#f2c21a" fill-opacity="0"');
    s += k.circ(182, 102, 10.5, 'none', 'stroke="#1a120c" stroke-width="1.4"') + k.circ(218, 102, 10.5, 'none', 'stroke="#1a120c" stroke-width="1.4"');
    // small hooked bill
    s += k.p('M196 112C198 110 202 110 204 112C203 118 201 122 200 124C199 122 197 118 196 112Z', '#d8c890');
    return { wash: '#c9bfa0', defs: defs, bg: bg, shadow: k.shadow(200, 242, 40, 4, 0.5), fg: s };
  };

  // =================================================================
  //  TREES & PLANTS · ÁRBOLES Y PLANTAS
  //  Sprig plates (botanical style) carry a small round inset showing
  //  the whole plant in its habitat; whole-tree plates carry a detail.
  // =================================================================

  function inset(k, id, cx, cy, R, content) {
    return '<defs><clipPath id="§' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/></clipPath>' +
      k.lg(id + 'g', 0, 0, 0, 1, [[0, '#f3ead2'], [1, '#e6d9b8']]) + '</defs>' +
      k.circ(cx + 2, cy + 3, R, 'rgba(60,40,20,.18)') +
      k.circ(cx, cy, R, k.U(id + 'g')) +
      '<g clip-path="' + k.U(id) + '">' + content + '</g>' +
      k.circ(cx, cy, R, 'none', 'stroke="#7a6446" stroke-width="1.6"') +
      k.circ(cx, cy, R - 3, 'none', 'stroke="#7a6446" stroke-width=".6" opacity=".6"');
  }

  // a small tree: trunk + clumped crown of soft blobs
  function miniTree(k, x, y, h, cols, o) {
    o = o || {};
    var r = k.rnd, s = '', ins = '', i;
    var w = h * (o.wide || 0.75);
    s += k.p('M' + (x - h * 0.04) + ' ' + y + 'L' + (x - h * 0.02) + ' ' + (y - h * 0.5) + 'L' + (x + h * 0.02) + ' ' + (y - h * 0.5) + 'L' + (x + h * 0.04) + ' ' + y + 'Z', cols[3] || '#5a4432');
    for (i = 0; i < (o.n || 9); i++) {
      var bx = x + (r() - 0.5) * w * 0.8, by = y - h * (0.55 + r() * 0.35), br = h * (0.14 + r() * 0.1);
      s += k.circ(bx, by + br * 0.25, br, cols[0]);
      s += k.circ(bx - br * 0.2, by - br * 0.1, br * 0.75, cols[1]);
      s += k.circ(bx - br * 0.35, by - br * 0.3, br * 0.35, cols[2], 'opacity=".7"');
    }
    return s;
  }

  // a run of leaves along a smooth stem, alternating sides
  function leavesAlong(k, pts, o) {
    var s = '';
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      s += k.leaf(q[0], q[1], q[3] || o.len, q[4] || o.w, q[2], o);
    }
    return s;
  }

  // ---- Monkey-puzzle tree · Araucaria (pehuén) ----
  P.araucaria = function(k) {
    var r = k.rnd, s = '', ins = '', bg = '', i;
    var defs = k.lg('arT', 0, 0, 1, 0, [[0, '#3a3430'], [0.35, '#7a6e62'], [0.65, '#5a5048'], [1, '#2a2420']]) +
      k.lg('arV', 0, 0, 0, 1, [[0, '#c9d2d8'], [1, '#8c9ca8']]) +
      k.lg('arG', 0, 0, 0, 1, [[0, '#8a8a5a'], [1, '#5a5a38']]);
    // snowy volcano and slope
    bg += k.p('M60 220L170 96C178 88 190 88 198 96L320 220Z', k.U('arV'), 'opacity=".7"');
    bg += k.p('M150 120L170 96C178 88 190 88 198 96L218 120L206 116L196 126L186 114L174 124L164 116Z', '#fbfbf8', 'opacity=".95"');
    bg += k.sp('M184 92C182 80 190 72 186 60', '#d8d4cc', 4, 'opacity=".35"');
    bg += k.p('M0 236C80 222 160 226 240 236C300 244 360 238 400 230L400 300L0 300Z', k.U('arG'), 'opacity=".75"');
    bg += k.grass(r, 0, 400, 270, 70, 18, ['#7a7a48', '#9a9a5a', '#5e6038']);
    // a young araucaria in the distance
    bg += k.sp('M330 238L330 196', '#4a4038', 2) + k.sp('M318 204Q330 190 342 204M314 214Q330 198 346 214M312 224Q330 208 348 224', '#3c4a30', 3, 'opacity=".8"');
    var shadowS = k.shadow(200, 270, 70, 7, 0.7);
    // tall straight trunk with plated bark
    s += k.p('M190 272C192 220 192 140 194 70L206 70C208 140 210 220 214 272Z', k.U('arT'));
    var pl = '';
    for (i = 0; i < 26; i++) { var py = 84 + i * 7.2; for (var c2 = 0; c2 < 3; c2++) { var px = 192 + c2 * 6 + (i % 2) * 3; pl += 'M' + px + ' ' + k.n(py) + 'q3 -3 6 0q-3 4 -6 0'; } }
    s += k.sp(pl, '#22201c', 0.9, 'opacity=".5"') + k.sp('M198 76L197 270', '#a89a8a', 1.4, 'opacity=".35"');
    s += k.p('M182 272C186 264 194 262 200 262C208 262 214 264 220 272Z', '#3a3430');
    // umbrella crown: whorls of upturned rope-like branches covered in scale leaves
    function arm(x0, y0, x1, y1, up, w) {
      var d = 'M' + x0 + ' ' + y0 + 'Q' + ((x0 + x1) / 2) + ' ' + (y0 + 6) + ' ' + x1 + ' ' + y1 + 'q' + (x1 > x0 ? 6 : -6) + ' -4 ' + (x1 > x0 ? 4 : -4) + ' ' + (-up);
      return k.sp(d, '#22301c', w + 2) + k.sp(d, '#3e5430', w) + k.sp(d, '#6a8450', w * 0.45, 'stroke-dasharray="1.5 2" opacity=".9"') +
        k.sp(d, '#22301c', w * 0.9, 'stroke-dasharray="1 3" transform="translate(0 1.5)" opacity=".6"');
    }
    var whorls = [[66, 64, 10], [78, 84, 12], [92, 104, 13], [106, 120, 14], [120, 132, 12]];
    for (i = 0; i < whorls.length; i++) {
      var y = whorls[i][0], span = whorls[i][1], up = whorls[i][2];
      var jl = (r() - 0.5) * 16, jr = (r() - 0.5) * 16;
      s += arm(196, y, 196 - span + jl, y + 8 + r() * 6, up, 6) + arm(204, y, 204 + span + jr, y + 8 + r() * 6, up, 6);
      s += arm(197, y + 2, 196 - span * 0.6, y + 16, up * 0.7, 5) + arm(203, y + 2, 204 + span * 0.6, y + 16, up * 0.7, 5);
    }
    s += arm(198, 56, 166, 62, 10, 6) + arm(202, 56, 234, 62, 10, 6) + k.el(200, 56, 12, 10, '#3e5430') + k.el(200, 54, 8, 6, '#5a7442');
    // inset: a seed cone and piñones
    var cone = k.circ(70, 78, 20, '#8a8a4a');
    var sc = '';
    for (i = 0; i < 40; i++) { var a = r() * Math.PI * 2, rr = r() * 18; sc += 'M' + k.n(70 + Math.cos(a) * rr) + ' ' + k.n(78 + Math.sin(a) * rr) + 'l' + k.n(Math.cos(a) * 5) + ' ' + k.n(Math.sin(a) * 5); }
    cone += k.sp(sc, '#c9c27a', 1.6) + k.sp(sc, '#5a5a2a', 0.6, 'transform="translate(.8 .8)"') + k.circ(64, 72, 7, '#fff', 'opacity=".18"');
    cone += k.p('M84 96C88 92 96 94 98 100C96 108 88 110 84 104Z', '#b07a4a') + k.p('M92 102C96 98 104 100 104 106C102 112 94 112 92 108Z', '#9a6a3e') +
      k.sp('M86 98q4 2 10 2', '#e8c89a', 1);
    ins = inset(k, 'arI', 72, 82, 38, cone);
    return { wash: '#b9c7b6', defs: defs, bg: bg, shadow: shadowS, fg: s, inset: ins };
  };

  // ---- Soapbark tree · Quillay ----
  P.quillay = function(k) {
    var r = k.rnd, s = '', ins = '', i;
    var defs = k.lg('qyL', 0, 0, 0, 1, [[0, '#5e8a44'], [1, '#2f5228']]);
    s += k.branch(r, 'M40 280C90 240 150 200 210 170C260 146 310 124 360 92', 6, ['#4a3426', '#7a5a42', '#b08a6a']);
    s += k.branch(r, 'M200 176C214 150 232 128 254 112', 3.5, ['#4a3426', '#7a5a42', '#b08a6a']);
    s += k.branch(r, 'M120 226C116 200 122 178 134 160', 3, ['#4a3426', '#7a5a42', '#b08a6a']);
    var lo = { fill: k.U('qyL'), shade: '#1e3a18', gloss: 0.22, veins: 6, vein: 'rgba(220,235,190,.55)' };
    s += leavesAlong(k, [[86, 246, -150, 40, 13], [104, 234, 20, 44, 14], [150, 208, -130, 46, 14], [168, 196, 40, 42, 13], [236, 158, -120, 44, 14],
      [256, 148, 30, 46, 15], [300, 128, -110, 40, 13], [318, 116, 40, 42, 13], [350, 98, -80, 36, 12], [134, 160, -100, 36, 12], [128, 176, 170, 34, 11],
      [254, 112, -60, 38, 12], [240, 122, 200, 34, 11]], lo);
    // star-shaped flowers: 5 white petals, a green-yellow nectar disc
    function flower(x, y, sc, rot) {
      var f = '', j;
      for (j = 0; j < 5; j++) f += '<g transform="rotate(' + (j * 72) + ')">' + k.p('M0 0C3 -3 8 -6 14 -4C12 0 6 3 0 0Z', '#e8ecd6') + k.p('M0 0C4 -4 9 -14 0 -18C-9 -14 -4 -4 0 0Z', '#fbfaf2', 'stroke="#d8dcc2" stroke-width=".6"') + '</g>';
      f += k.p('M0 -6L1.8 -2L6 -2L2.8 1L4 5.5L0 3L-4 5.5L-2.8 1L-6 -2L-1.8 -2Z', '#c9d24a') + k.circ(0, 0, 2, '#9aa830');
      for (j = 0; j < 5; j++) { var a = (j * 72 + 36) * Math.PI / 180; f += k.circ(Math.cos(a) * 7, Math.sin(a) * 7, 1.1, '#e0b84a'); }
      return '<g ' + k.tr(x, y, rot, sc) + '>' + f + '</g>';
    }
    s += k.sp('M254 112L262 96M254 112L274 106M254 112L250 92', '#5a7a3a', 1.4);
    s += flower(262, 92, 1.0, 10) + flower(278, 104, 0.9, 40) + flower(248, 86, 0.8, -20);
    s += k.sp('M134 160L130 142M134 160L146 148', '#5a7a3a', 1.4) + flower(128, 136, 0.95, 0) + flower(150, 144, 0.8, 30);
    // dry star-shaped fruit (5 follicles)
    var fr = '';
    for (i = 0; i < 5; i++) fr += '<g transform="rotate(' + (i * 72) + ')">' + k.p('M0 0C4 -2 6 -10 0 -18C-6 -10 -4 -2 0 0Z', '#9a6a3e', 'stroke="#5a3a1e" stroke-width=".8"') + k.sp('M0 -2L0 -15', '#5a3a1e', 0.7) + '</g>';
    s += k.sp('M300 128L312 146', '#5a4a32', 1.4) + '<g ' + k.tr(316, 154, 15, 1) + '>' + fr + k.circ(0, 0, 2.5, '#6a4626') + '</g>';
    // inset: quillay trees on a dry central-Chile hillside
    var hab = k.p('M0 120L400 120L400 300L0 300Z', '#d8c89a') + k.p('M260 150C290 126 330 118 380 130L380 170L260 170Z', '#b8b48a') +
      miniTree(k, 312, 146, 34, ['#4a6a36', '#5e8244', '#8aa860', '#5a4432']) + miniTree(k, 290, 152, 22, ['#55743e', '#6a8a4a', '#94b06a', '#5a4432'], { n: 6 }) +
      k.grass(r, 250, 360, 160, 20, 8, ['#a89a5a', '#8a8a4a']);
    ins = '<g transform="translate(-232 -72)">' + inset(k, 'qyI', 316, 144, 36, hab) + '</g>';
    return { wash: '#cdd0a6', defs: defs, bg: '', shadow: '', fg: s, inset: ins };
  };

  // ---- Peumo ----
  P.peumo = function(k) {
    var r = k.rnd, s = '', ins = '', i;
    var defs = k.lg('pmL', 0, 0, 0, 1, [[0, '#4e8240'], [1, '#26502a']]) + k.rg('pmF', 0.35, 0.3, 0.7, [[0, '#ff8a8a'], [0.5, '#d4283a'], [1, '#7a0e1e']]);
    s += k.branch(r, 'M30 250C90 226 150 204 210 186C270 168 320 140 372 100', 6, ['#3e3026', '#6a5444', '#9a8270']);
    s += k.branch(r, 'M190 192C200 220 214 240 232 256', 3.5, ['#3e3026', '#6a5444', '#9a8270']);
    var lo = { fill: k.U('pmL'), shade: '#18361a', gloss: 0.3, veins: 5, round: 1.1 };
    s += leavesAlong(k, [[70, 236, -140, 50, 16], [96, 226, 30, 54, 17], [140, 210, -120, 52, 17], [164, 200, 50, 50, 16], [250, 176, -110, 54, 17],
      [276, 160, 40, 50, 16], [320, 136, -100, 48, 15], [344, 118, 30, 46, 15], [372, 100, -50, 40, 14], [232, 256, 60, 44, 14], [214, 240, 160, 42, 14]], lo);
    // cluster of oval red drupes
    var fruits = [[214, 200, 0], [228, 206, 20], [204, 214, -15], [222, 220, 10], [240, 196, 30], [196, 200, -30]];
    s += k.sp('M210 186L214 196M210 186L228 202M210 186L204 210M210 186L222 216M210 186L240 192M210 186L196 196', '#5a4a2a', 1.4);
    for (i = 0; i < fruits.length; i++) {
      var f = fruits[i];
      s += '<g ' + k.tr(f[0], f[1], f[2]) + '>' + k.el(0, 6, 6.5, 9, k.U('pmF')) + k.el(-2, 2, 2, 3, '#fff', 'opacity=".55"') + k.el(0, -2.5, 2, 1.2, '#5a3a1a') + '</g>';
    }
    var hab = k.p('M0 0L400 0L400 300L0 300Z', '#dcd0a6') + k.p('M60 120C90 104 120 102 150 112L150 150L60 150Z', '#b0b890', 'opacity=".7"') +
      k.sp('M60 140C80 134 110 136 150 132', '#7aa0b0', 3, 'opacity=".7"') +
      miniTree(k, 104, 132, 40, ['#2f5a2e', '#3f7038', '#6a9a5a', '#4a3a2c'], { wide: 0.9 });
    ins = inset(k, 'pmI', 92, 92, 38, hab);
    return { wash: '#c9cfa4', defs: defs, bg: '', fg: s, inset: ins };
  };

  // ---- Boldo ----
  P.boldo = function(k) {
    var r = k.rnd, s = '', ins = '', i;
    var defs = k.lg('boL', 0, 0, 0, 1, [[0, '#6a805a'], [1, '#3a5036']]);
    s += k.branch(r, 'M200 290C200 240 204 190 206 140C208 100 212 70 220 40', 5.5, ['#4a3a2e', '#7a6656', '#a8968a']);
    // opposite, rough, bumpy leaves with rolled edges
    function bleaf(x, y, ang, L, W) {
      var g0 = k.leaf(x, y, L, W, ang, { fill: k.U('boL'), shade: '#22361e', veins: 4, vein: 'rgba(220,230,200,.45)', edge: '#2a3a22' });
      var b = '';
      for (var j = 0; j < 22; j++) { var t = 0.12 + r() * 0.8, off = (r() - 0.5) * W * 1.3 * Math.sin(Math.PI * t); b += k.circ(t * L, off, 0.9 + r() * 0.6, 'rgba(220,226,190,.55)'); }
      return g0 + '<g ' + k.tr(x, y, ang) + '>' + b + '</g>';
    }
    var pairs = [[236, 202, 54], [186, 205, 50], [136, 208, 46], [90, 212, 40]];
    for (i = 0; i < pairs.length; i++) {
      var y = pairs[i][0], x = pairs[i][1], L = pairs[i][2];
      s += bleaf(x, y, -160 + i * 8, L, 17 - i) + bleaf(x + 2, y, -20 - i * 8, L, 17 - i);
    }
    // small cream flowers in a cluster at the tip
    function fl(x, y, sc) {
      var f = '';
      for (var j = 0; j < 6; j++) f += '<g transform="rotate(' + (j * 60) + ')">' + k.el(0, -5, 2.6, 4.6, '#f4efd8', 'stroke="#d8d0a8" stroke-width=".5"') + '</g>';
      return '<g ' + k.tr(x, y, 0, sc) + '>' + f + k.circ(0, 0, 2.6, '#d8c050') + k.circ(-0.6, -0.6, 1, '#f8e890') + '</g>';
    }
    s += k.sp('M220 40L206 22M220 40L232 24M220 40L222 18M220 40L240 38', '#6a5a3a', 1.1);
    s += fl(206, 20, 1.1) + fl(232, 22, 1) + fl(221, 14, 0.9) + fl(242, 36, 0.85);
    var hab = k.p('M0 0L400 0L400 300L0 300Z', '#e0d2a8') + k.p('M240 150C270 130 320 124 360 134L360 170L240 170Z', '#c2b88c') +
      miniTree(k, 300, 156, 30, ['#4e6448', '#5e7656', '#8ea07a', '#5a4a3a'], { wide: 1 }) + miniTree(k, 330, 160, 20, ['#4e6448', '#5e7656', '#8ea07a', '#5a4a3a'], { n: 5 });
    ins = inset(k, 'boI', 330, 220, 40, '<g transform="translate(30 70)">' + hab + '</g>');
    return { wash: '#cfcca4', defs: defs, bg: '', fg: s, inset: ins };
  };

  // ---- Winter's bark · Canelo ----
  P.canelo = function(k) {
    var r = k.rnd, s = '', ins = '', i;
    var defs = k.lg('caL', 0, 0, 0, 1, [[0, '#6aa04a'], [1, '#3a6a30']]) + k.lg('caU', 0, 0, 0, 1, [[0, '#c9d8c0'], [1, '#9ab09a']]);
    s += k.branch(r, 'M60 290C110 250 150 220 190 200', 6, ['#5a3426', '#8a5a42', '#c08a6a']);
    // whorl of long oblong leaves (some showing the whitish underside)
    var ang = [-170, -140, -110, -80, -50, -20, 10];
    for (i = 0; i < ang.length; i++) {
      var under = i % 3 === 1;
      s += k.leaf(190, 200, 96 - Math.abs(i - 3) * 6, 18, ang[i], { fill: under ? k.U('caU') : k.U('caL'), shade: under ? '#7a907a' : '#22441e', gloss: under ? 0 : 0.25, veins: 8, vein: under ? 'rgba(90,110,90,.5)' : 'rgba(220,240,200,.5)' });
    }
    // umbels of white flowers on long stalks
    function fl(x, y, sc) {
      var f = '';
      for (var j = 0; j < 8; j++) f += '<g transform="rotate(' + (j * 45 + 10) + ')">' + k.el(0, -8, 3.2, 7.5, '#fdfcf6', 'stroke="#dcdccc" stroke-width=".6"') + '</g>';
      f += k.circ(0, 0, 4.2, '#e8d040');
      for (j = 0; j < 9; j++) f += k.circ(Math.cos(j * 0.7) * 2.5, Math.sin(j * 0.7) * 2.5, 0.8, '#b89a20');
      return '<g ' + k.tr(x, y, 0, sc) + '>' + f + '</g>';
    }
    var fs = [[250, 210], [268, 230], [240, 238], [276, 204]];
    for (i = 0; i < fs.length; i++) s += k.sp('M196 204Q226 200 ' + fs[i][0] + ' ' + fs[i][1], '#7a5a3a', 1.1);
    for (i = 0; i < fs.length; i++) s += fl(fs[i][0], fs[i][1], 1.05);
    // inset: canelo by a southern stream
    var hab = k.p('M0 0L400 0L400 300L0 300Z', '#dbd8b8') + k.p('M0 150C30 146 60 152 90 148L90 170L0 170Z', '#8ab0b8') +
      k.sp('M10 156q10 -2 20 0M40 160q10 -2 20 0', '#e8f4f4', 1) +
      k.p('M44 150L46 90L50 90L52 150Z', '#7a5040') + miniTree(k, 48, 110, 46, ['#3e6a32', '#4e7e3e', '#80aa66', '#7a5040'], { wide: 0.5, n: 10 });
    ins = inset(k, 'caI', 90, 80, 40, '<g transform="translate(44 -40)">' + hab + '</g>');
    return { wash: '#c5d2a8', defs: defs, bg: '', fg: s, inset: ins };
  };

  // ---- Chilean wine palm · Palma chilena ----
  P.palma = function(k) {
    var r = k.rnd, s = '', ins = '', bg = '', i;
    var defs = k.lg('paT', 0, 0, 1, 0, [[0, '#5a5650'], [0.3, '#a49e94'], [0.6, '#8a847a'], [1, '#4a4640']]) +
      k.lg('paH', 0, 0, 0, 1, [[0, '#d2c290'], [1, '#a8986a']]);
    bg += k.p('M0 210C60 180 120 176 180 196C230 212 300 186 400 194L400 300L0 300Z', k.U('paH'), 'opacity=".75"');
    bg += miniTree(k, 70, 214, 24, ['#6a7a48', '#7a8a52', '#a0a870', '#5a4a3a'], { n: 6 }) + miniTree(k, 340, 210, 20, ['#6a7a48', '#7a8a52', '#a0a870', '#5a4a3a'], { n: 5 });
    bg += k.grass(r, 0, 400, 280, 70, 20, ['#b0a060', '#94884e', '#c8b878']);
    var shadowS = k.shadow(200, 272, 60, 6, 0.7);
    // massive bottle-shaped trunk
    var trunk = 'M162 274C150 230 154 180 162 140C168 112 176 96 182 88L218 88C224 96 232 112 238 140C246 180 250 230 238 274Z';
    s += k.p(trunk, k.U('paT'));
    s += '<defs>' + k.clip('paTC', trunk) + '</defs>';
    var scars = '';
    for (i = 0; i < 26; i++) { var y = 98 + i * 6.8; scars += 'M160 ' + k.n(y) + 'Q200 ' + k.n(y + 5) + ' 240 ' + k.n(y); }
    var dia = '';
    for (i = 0; i < 40; i++) { var dx = 166 + r() * 68, dy = 100 + r() * 170; dia += 'M' + k.n(dx) + ' ' + k.n(dy) + 'l4 2.5l4 -2.5l-4 -2.5Z'; }
    s += k.g(k.sp(scars, '#3e3a34', 1, 'opacity=".22"') + k.sp(scars, '#d8d2c6', 0.7, 'opacity=".25" transform="translate(0 2)"') + k.p(dia, '#4a463e', 'opacity=".3"') + k.p('M150 80L176 80L172 280L150 280Z', '#000', 'opacity=".12"'), 'clip-path="' + k.U('paTC') + '"');
    // crown of arching pinnate fronds
    function frond(ang, len, droop) {
      var a = ang * Math.PI / 180, ex = 200 + Math.cos(a) * len, ey = 86 + Math.sin(a) * len * 0.6 + droop;
      var cx = 200 + Math.cos(a) * len * 0.5, cy = 86 + Math.sin(a) * len * 0.5 - 20;
      var d = 'M200 86Q' + k.n(cx) + ' ' + k.n(cy) + ' ' + k.n(ex) + ' ' + k.n(ey);
      var f = k.sp(d, '#5a6a3a', 2.4), lf = '';
      for (var t = 0.1; t < 1; t += 0.05) {
        var x = (1 - t) * (1 - t) * 200 + 2 * (1 - t) * t * cx + t * t * ex, y = (1 - t) * (1 - t) * 86 + 2 * (1 - t) * t * cy + t * t * ey;
        var L = 22 * Math.sin(Math.PI * Math.min(1, t + 0.1));
        lf += 'M' + k.n(x) + ' ' + k.n(y) + 'l' + k.n(-L * 0.3) + ' ' + k.n(L) + 'M' + k.n(x) + ' ' + k.n(y) + 'l' + k.n(L * 0.3) + ' ' + k.n(L * 0.95);
      }
      return f + k.sp(lf, '#3e5a2e', 1.8) + k.sp(lf, '#7a9a5a', 0.7, 'transform="translate(-.6 -.6)"');
    }
    var fr = [[-178, 130, 70], [-160, 128, 40], [-140, 116, 14], [-120, 100, -6], [-100, 86, -16], [-80, 86, -16], [-60, 100, -6], [-40, 116, 14], [-20, 128, 40], [-2, 130, 70], [170, 110, 60], [10, 110, 60], [150, 80, 40], [30, 80, 40]];
    for (i = 0; i < fr.length; i++) s += frond(fr[i][0], fr[i][1], fr[i][2]);
    // clusters of coquitos
    s += k.sp('M192 96Q178 110 170 120M208 96Q222 110 230 120', '#a8823a', 2);
    for (i = 0; i < 14; i++) s += k.circ(166 + (i % 7) * 3 + r() * 4 + (i > 6 ? 56 : 0), 118 + r() * 12, 3.6, i % 3 ? '#e0a030' : '#c8841a', 'stroke="#8a5a1a" stroke-width=".5"');
    var coq = '';
    for (i = 0; i < 3; i++) {
      var cx2 = 56 + i * 22, cy2 = 82 + (i % 2) * 8;
      coq += k.el(cx2, cy2, 10, 9, '#8a6040') + k.el(cx2 - 2, cy2 - 3, 4, 3, '#b89070', 'opacity=".6"');
      coq += k.circ(cx2 - 3, cy2 + 1, 1.3, '#3a2414') + k.circ(cx2 + 2, cy2 + 2, 1.3, '#3a2414') + k.circ(cx2 - 0.5, cy2 + 5, 1.3, '#3a2414');
    }
    coq += k.el(78, 108, 12, 9, '#7a5034') + k.el(78, 108, 9, 6.5, '#f6f2e6');
    ins = inset(k, 'paI', 74, 92, 36, coq);
    return { wash: '#d4c9a0', defs: defs, bg: bg, shadow: shadowS, fg: s, inset: ins };
  };

  // ---- Patagonian cypress · Alerce ----
  P.alerce = function(k) {
    var r = k.rnd, s = '', ins = '', bg = '', i;
    var defs = k.lg('alT', 0, 0, 1, 0, [[0, '#5a2e20'], [0.35, '#a85a3e'], [0.6, '#8a4a32'], [1, '#4a2418']]) +
      k.lg('alM', 0, 0, 0, 1, [[0, '#e8ece6', 0], [0.6, '#e8ece6', 0.6], [1, '#e8ece6', 0.9]]);
    // misty rainforest behind
    for (i = 0; i < 7; i++) {
      var tx = 20 + i * 60 + r() * 20;
      bg += k.p('M' + (tx - 4) + ' 260L' + (tx - 2) + ' 80L' + (tx + 2) + ' 80L' + (tx + 4) + ' 260Z', '#7a8a78', 'opacity=".3"');
      bg += k.el(tx, 90 + r() * 30, 18, 40, '#6a8a62', 'opacity=".25"');
    }
    bg += '<rect x="0" y="180" width="400" height="120" fill="' + k.U('alM') + '"/>';
    var shadowS = k.shadow(200, 276, 70, 6, 0.6);
    // massive straight trunk with long fibrous strips
    s += k.p('M176 280C178 220 182 140 186 40L214 40C218 140 222 220 226 280Z', k.U('alT'));
    var fib = '';
    for (i = 0; i < 26; i++) { var fx = 180 + r() * 42; fib += 'M' + k.n(fx) + ' 280Q' + k.n(fx + (r() - 0.5) * 6) + ' 160 ' + k.n(200 + (fx - 200) * 0.6) + ' 40'; }
    s += k.sp(fib, '#3a1a10', 1, 'opacity=".5"') + k.sp(fib, '#d88a68', 0.6, 'opacity=".35" transform="translate(1.5 0)"');
    s += k.p('M164 282C172 270 184 266 200 266C216 266 228 270 236 282Z', '#5a2e20');
    // narrow, high crown of dark green scale-leaf sprays (many small upturned tufts)
    s += k.sp('M200 70L172 84M200 92L230 102M200 112L168 122M200 54L224 62', '#4a2418', 2.4);
    for (i = 0; i < 60; i++) {
      var cy = 10 + r() * 110, half = 16 + (cy - 10) * 0.32, cx = 200 + (r() - 0.5) * 2 * half;
      var tuft = '';
      for (var j = 0; j < 7; j++) { var a2 = -150 + j * 20 + (r() - 0.5) * 10; tuft += 'M' + k.n(cx) + ' ' + k.n(cy) + 'l' + k.n(Math.cos(a2 * Math.PI / 180) * 10) + ' ' + k.n(Math.sin(a2 * Math.PI / 180) * 8); }
      s += k.sp(tuft, i % 3 ? '#2a4626' : '#3e5e34', 3.2) + k.sp(tuft, '#6a8a52', 0.9, 'opacity=".55" transform="translate(-.5 -1)"');
    }
    // ferns at the foot (nalca-like greens)
    var front = k.fern(r, 150, 290, 80, -160, '#3e6a32') + k.fern(r, 160, 292, 74, -125, '#4e7e3a') + k.fern(r, 250, 292, 78, -25, '#3e6a32') + k.fern(r, 244, 294, 70, -60, '#4e7e3a') + k.fern(r, 120, 296, 60, -100, '#5a8a42');
    // inset: scale-like leaves in whorls of three
    var sc = k.sp('M40 110L100 60', '#5a3a2a', 2);
    for (i = 0; i < 12; i++) {
      var t = i / 12, x = 42 + t * 56, y = 108 - t * 46;
      sc += k.leaf(x, y, 12, 3.4, -100 + (i % 2) * 20, { fill: '#3e6a36', shade: '#1e3a1a', veins: 0 }) + k.leaf(x, y, 12, 3.4, -10 - (i % 2) * 20, { fill: '#4a7a40', shade: '#1e3a1a', veins: 0 });
    }
    ins = inset(k, 'alI', 76, 86, 36, sc);
    return { wash: '#b9c6b0', defs: defs, bg: bg, shadow: shadowS, fg: s, front: front, inset: ins };
  };

  // ---- Chilean bellflower · Copihue (national flower) ----
  P.copihue = function(k) {
    var r = k.rnd, s = '', ins = '', i;
    var defs = k.lg('cpL', 0, 0, 0, 1, [[0, '#3e7a3a'], [1, '#1e4a22']]) +
      k.lg('cpF', 0, 0, 1, 0, [[0, '#8a0a1e'], [0.35, '#e0283e'], [0.6, '#f04a5a'], [1, '#9a0e22']]) +
      k.lg('cpF2', 0, 0, 1, 0, [[0, '#a01228'], [0.5, '#d42038'], [1, '#7a0a18']]);
    // twining stem across a mossy branch
    s += k.branch(r, 'M0 70C80 64 160 76 240 70C300 66 350 60 400 52', 9, ['#3a3a2a', '#5a5a42', '#8a8a6a']);
    var moss = '';
    for (i = 0; i < 40; i++) moss += k.circ(r() * 400, 60 + r() * 14, 1.5 + r() * 2.5, r() < 0.5 ? '#6a8a3a' : '#8aa84a', 'opacity=".8"');
    s += moss;
    var vine = 'M30 300C40 250 80 230 100 200C120 170 110 140 130 110C150 84 170 80 190 70C220 60 240 90 260 100C290 116 320 104 340 80';
    s += k.sp(vine, '#2e4a22', 4) + k.sp(vine, '#5a8a42', 1.4, 'transform="translate(-1 -1)"');
    var lo = { fill: k.U('cpL'), shade: '#10301a', gloss: 0.3, veins: 0, vein: 'rgba(200,230,180,.5)' };
    s += leavesAlong(k, [[56, 244, -20, 46, 16], [92, 210, 170, 50, 17], [116, 160, -10, 48, 16], [134, 108, 190, 44, 15], [262, 102, 60, 46, 15], [320, 104, -40, 42, 14]], lo);
    // longitudinal veins typical of the copihue leaf
    // hanging waxy bells
    function bell(x, y, sc, rot) {
      var b = k.sp('M0 -30Q2 -16 0 0', '#3a5a2a', 2);
      b += k.p('M-4 0C-16 10 -20 34 -22 58C-12 62 -4 60 0 56C4 60 12 62 22 58C20 34 16 10 4 0Z', k.U('cpF'));
      b += k.p('M-4 2C-10 20 -12 40 -12 58C-6 60 -2 58 0 56C0 36 -2 18 -4 2Z', k.U('cpF2'), 'opacity=".7"');
      b += k.p('M4 2C10 20 12 40 12 58C6 60 2 58 0 56C0 36 2 18 4 2Z', '#f05a68', 'opacity=".35"');
      b += k.sp('M-14 20Q-10 40 -10 56M10 18Q12 40 12 56M0 6L0 54', '#7a0818', 0.8, 'opacity=".55"');
      for (var j = 0; j < 16; j++) b += k.circ((r() - 0.5) * 28, 20 + r() * 36, 0.7 + r() * 0.6, '#ffd8d8', 'opacity=".8"');
      b += k.sp('M-12 18Q-8 30 -8 46', '#fff', 1.6, 'opacity=".35"');
      b += k.p('M-4 -2L4 -2L6 4L-6 4Z', '#4a7a3a');
      return '<g ' + k.tr(x, y, rot, sc) + '>' + b + '</g>';
    }
    s += bell(200, 100, 1.25, 4) + bell(258, 130, 1.0, -8) + bell(160, 140, 0.9, 10);
    var hab = k.p('M0 0L400 0L400 300L0 300Z', '#cfd4b4');
    for (i = 0; i < 6; i++) hab += k.p('M' + (10 + i * 24) + ' 160L' + (12 + i * 24) + ' 40L' + (18 + i * 24) + ' 40L' + (20 + i * 24) + ' 160Z', '#6a7a5a', 'opacity=".6"') + k.el(15 + i * 24, 50, 16, 20, '#3e6a36', 'opacity=".7"');
    hab += k.sp('M70 160C60 120 76 90 72 60', '#2e4a22', 2) + k.p('M72 96c-3 4-4 10-3 14c2 1 4 1 5 0c1-4 0-10-2-14z', '#d42038');
    ins = inset(k, 'cpI', 330, 222, 38, '<g transform="translate(260 140)">' + hab + '</g>');
    return { wash: '#c7d0a6', defs: defs, bg: '', fg: s, inset: ins };
  };

  // ---- Espino ----
  P.espino = function(k) {
    var r = k.rnd, s = '', ins = '', i;
    // zig-zag thorny branch
    var pts = [[30, 260], [90, 230], [130, 214], [190, 180], [236, 166], [290, 128], [340, 112], [380, 80]];
    var d = k.smooth(pts, false);
    s += k.branch(r, d, 6, ['#3a2a20', '#6a4a36', '#9a7a62']);
    // paired white spines at each node
    for (i = 1; i < pts.length - 1; i++) {
      var q = pts[i];
      s += k.sp('M' + q[0] + ' ' + q[1] + 'l-6 -20M' + q[0] + ' ' + q[1] + 'l8 18', '#f2ece0', 2.6) + k.sp('M' + q[0] + ' ' + q[1] + 'l-6 -20M' + q[0] + ' ' + q[1] + 'l8 18', '#b8ae9a', 0.8, 'transform="translate(1 0)"');
    }
    // fern-like bipinnate leaves
    function bip(x, y, ang, len) {
      var f = k.sp('M0 0L' + len + ' 0', '#5a6a3a', 1.2), lf = '';
      for (var t = 6; t < len; t += 8) {
        lf += 'M' + t + ' 0l3 -10M' + t + ' 0l3 10';
      }
      f += k.sp(lf, '#5a6a3a', 0.8);
      for (t = 6; t < len; t += 8) {
        for (var u = 2; u < 10; u += 2.2) f += k.el(t + u * 0.3, -u, 1.6, 0.8, '#6a8a42') + k.el(t + u * 0.3, u, 1.6, 0.8, '#5e7e3a');
      }
      return '<g ' + k.tr(x, y, ang) + '>' + f + '</g>';
    }
    s += bip(130, 214, -70, 50) + bip(190, 180, -100, 46) + bip(236, 166, -60, 54) + bip(290, 128, -110, 44) + bip(90, 230, -120, 44) + bip(340, 112, -70, 40);
    // golden pompom flower heads
    function pom(x, y, R) {
      var f = k.circ(x, y, R, '#e0a818');
      var st = '';
      for (var j = 0; j < 40; j++) { var a = r() * Math.PI * 2, rr = R * (0.4 + r() * 0.7); st += 'M' + k.n(x + Math.cos(a) * rr * 0.5) + ' ' + k.n(y + Math.sin(a) * rr * 0.5) + 'L' + k.n(x + Math.cos(a) * (rr + 2)) + ' ' + k.n(y + Math.sin(a) * (rr + 2)); }
      f += k.sp(st, '#f6d23a', 1) + k.circ(x - R * 0.3, y - R * 0.3, R * 0.4, '#fff4a0', 'opacity=".45"');
      return f;
    }
    var poms = [[118, 196, 9], [140, 236, 8], [204, 160, 10], [182, 202, 8], [250, 146, 9], [300, 150, 8], [318, 100, 9], [356, 126, 7]];
    for (i = 0; i < poms.length; i++) s += pom(poms[i][0], poms[i][1], poms[i][2]);
    // dark woody pod
    s += k.sp('M66 246L70 262', '#4a3426', 1.6) + '<g ' + k.tr(70, 262, 20) + '>' + k.p('M-5 0C-7 14 -6 30 0 42C6 30 7 14 5 0Z', '#3a2418') + k.sp('M-2 4C-3 16 -2 28 0 38', '#7a5a40', 1.4, 'opacity=".7"') + '</g>';
    var hab = k.p('M0 0L400 0L400 300L0 300Z', '#e2d2a0') + k.p('M0 140L400 140L400 300L0 300Z', '#cdb880');
    hab += k.p('M58 140L60 118L64 118L66 140Z', '#5a4030') + k.p('M30 118C40 100 80 98 94 118C80 112 44 112 30 118Z', '#6a7a3a') + k.p('M36 116C46 104 76 104 88 116', 'none', 'stroke="#d8b030" stroke-width="2" stroke-dasharray="2 3"');
    ins = inset(k, 'esI', 88, 86, 36, '<g transform="translate(26 -30)">' + hab + '</g>');
    return { wash: '#d9cc98', defs: '', bg: '', fg: s, inset: ins };
  };

  // =================================================================
  //  MAMMALS · MAMÍFEROS
  // =================================================================

  // fur strokes clipped to a shape; flow angle given by fn(x,y)
  function fur(k, clipId, cx, cy, rx, ry, count, len, fn, cols, w, op) {
    return k.g(k.hatch(k.rnd, { cx: cx, cy: cy, rx: rx, ry: ry, n: count, len: len, ang: 0, angFn: fn, jit: 22, curve: 0.35, cols: cols, w: w || 0.9, op: op || 0.75 }),
      'clip-path="' + k.U(clipId) + '"');
  }
  function forestFloor(k, y) {
    var r = k.rnd, s = '';
    s += '<rect x="0" y="' + y + '" width="400" height="' + (300 - y) + '" fill="#6a5a3a" opacity=".28"/>';
    for (var i = 0; i < 40; i++) {
      var x = r() * 400, yy = y + 4 + r() * (300 - y - 6);
      s += k.leaf(x, yy, 9 + r() * 6, 3 + r() * 2, r() * 360, { fill: r() < 0.5 ? '#a8743a' : '#8a5a2a', veins: 0, vein: 'rgba(255,230,180,.4)' });
    }
    return s;
  }

  // a furry tail along cubic segments [[p0,p1,p2,p3],…]: core + hairs,
  // with a differently coloured brush from `tipFrom` (0–1) onwards
  function bushyTail(k, segs, w0, w1, cols, tipFrom, tipCols, tipW) {
    var r = k.rnd, core = '', hairs = {}, N = 70, i, j;
    function at(t) {
      var f = Math.min(segs.length - 1e-6, t * segs.length), si = Math.floor(f), u = f - si, q = segs[si], v = 1 - u;
      var x = v * v * v * q[0][0] + 3 * v * v * u * q[1][0] + 3 * v * u * u * q[2][0] + u * u * u * q[3][0];
      var y = v * v * v * q[0][1] + 3 * v * v * u * q[1][1] + 3 * v * u * u * q[2][1] + u * u * u * q[3][1];
      return [x, y];
    }
    var pts = [];
    for (i = 0; i <= N; i++) pts.push(at(i / N));
    for (i = 0; i <= N; i++) {
      var t = i / N, p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(N, i + 1)];
      var ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      var tip = t >= tipFrom, w = tip && tipW ? tipW * Math.sin(Math.PI * Math.min(1, (t - tipFrom) / (1 - tipFrom) * 0.8 + 0.2)) : w0 + (w1 - w0) * t;
      core += k.circ(pts[i][0], pts[i][1], Math.max(1.5, w * 0.42), tip ? tipCols[0] : cols[0]);
      for (j = 0; j < 5; j++) {
        var side = j % 2 ? 1 : -1, a = ang + side * (1.1 + r() * 0.5) - 0.35, L = w * (0.45 + r() * 0.45);
        var c = tip ? tipCols[Math.floor(r() * tipCols.length)] : cols[Math.floor(r() * cols.length)];
        hairs[c] = (hairs[c] || '') + 'M' + k.n(pts[i][0]) + ' ' + k.n(pts[i][1]) + 'q' + k.n(Math.cos(a + 0.4) * L * 0.5) + ' ' + k.n(Math.sin(a + 0.4) * L * 0.5) + ' ' + k.n(Math.cos(a) * L) + ' ' + k.n(Math.sin(a) * L);
      }
    }
    var s = core;
    for (var c2 in hairs) s += k.sp(hairs[c2], c2, 1.1);
    return s;
  }

  // ---- Mountain vizcacha · Vizcacha (sunning on a rock) ----
  P.vizcacha = function(k) {
    var r = k.rnd, s = '', bg = '';
    var body = 'M160 190C150 160 160 126 190 112C220 100 254 108 272 132C288 154 286 186 272 204C254 222 214 224 188 216C172 210 164 202 160 190Z';
    var head = 'M190 118C190 98 176 84 158 84C142 84 128 94 122 108C118 116 120 126 126 132C136 138 150 138 162 136C178 136 190 130 190 118Z';
    var defs = k.rg('vzB', 0.5, 0.35, 0.7, [[0, '#c9c0ae'], [0.7, '#a89e8a'], [1, '#7a7262']]) +
      k.rg('vzH', 0.45, 0.4, 0.7, [[0, '#cfc6b4'], [1, '#9a907e']]) +
      k.clip('vzBC', body) + k.clip('vzHC', head);
    bg += k.ridge(r, 'vzR', 170, 50, '#b4b8b0', 0.7, 0.6);
    bg += k.rock(r, 'vzRk', 210, 206, 300, 90, ['#c8bca8', '#9a8e7c', '#62584a']);
    bg += k.rock(r, 'vzRk2', 360, 230, 110, 70, ['#b8ac98', '#8a7e6c', '#5a5042']);
    bg += k.grass(r, 0, 80, 296, 30, 26, ['#a8a05a', '#8a8a4a']);
    var shadowS = k.shadow(222, 222, 74, 6, 0.85);
    // long tail curling up at the back
    s += bushyTail(k, [[[266, 198], [300, 206], [334, 194], [338, 166]], [[338, 166], [342, 144], [330, 128], [314, 130]]], 16, 20,
      ['#9a907e', '#c8beac', '#7a7060', '#b0a694'], 0.78, ['#2e2620', '#4a4036', '#1a1410'], 22);
    s += k.p(body, k.U('vzB'));
    s += fur(k, 'vzBC', 222, 166, 66, 60, 420, 6, function(x, y) { return 110 + (x - 220) * 0.5; }, ['#e8e0d0', '#6a6252', '#b8ae9a'], 0.8, 0.6);
    s += k.p('M240 110C250 120 256 150 254 180', 'none', 'stroke="#5a5244" stroke-width="3" opacity=".25"');
    // haunch and tucked paws
    s += k.el(244, 190, 32, 24, '#a89e8a', 'opacity=".55"');
    s += k.p('M206 210C226 212 250 214 264 212C268 214 268 219 262 220C244 222 222 222 204 218Z', '#8a8070') + k.sp('M212 216C230 218 248 218 262 217', '#c8beac', 1, 'opacity=".6"');
    s += k.p('M168 196C174 206 182 212 190 214L188 220C178 218 170 212 166 204Z', '#8a8070');
    // head
    s += k.p(head, k.U('vzH'));
    s += fur(k, 'vzHC', 156, 112, 36, 28, 140, 4.5, function() { return 200; }, ['#efe8dc', '#6a6252'], 0.6, 0.6);
    // long rabbit-like ears
    s += k.p('M168 90C166 64 172 40 182 30C190 34 190 60 182 92Z', '#9a907e') + k.p('M171 88C170 66 175 46 182 38C185 44 184 64 179 88Z', '#d8b8a8');
    s += k.p('M182 94C186 70 198 50 210 44C216 50 208 74 192 98Z', '#8a806e');
    // muzzle, long whiskers, eye
    s += k.el(126, 118, 5, 4, '#6a5a52') + k.p('M122 124C126 128 132 128 136 126', 'none', 'stroke="#4a3e36" stroke-width="1"');
    s += k.sp('M130 120C110 114 92 112 76 114M130 122C110 122 94 126 80 132M132 118C116 108 102 102 88 98M132 124C118 132 106 140 96 148', '#2a2420', 0.7, 'opacity=".8"');
    s += k.eye(150, 104, 5.2, '#1a100a');
    return { wash: '#c9c6b0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Degu · Degú ----
  P.degu = function(k) {
    var r = k.rnd, s = '', bg = '';
    var body = 'M150 200C140 176 150 148 178 136C206 124 244 128 264 148C282 166 284 192 272 210C258 226 222 230 194 226C172 222 156 214 150 200Z';
    var head = 'M170 154C168 134 154 120 136 120C120 120 106 130 100 144C96 152 98 162 104 168C114 174 128 174 140 172C156 172 170 166 170 154Z';
    var defs = k.rg('dgB', 0.5, 0.3, 0.7, [[0, '#b89a6a'], [0.65, '#9a7c50'], [1, '#6a5234']]) +
      k.rg('dgH', 0.45, 0.4, 0.7, [[0, '#bca070'], [1, '#8a6e46']]) +
      k.clip('dgBC', body) + k.clip('dgHC', head);
    // dry central-Chile matorral: soil, burrow, a shrub
    bg += '<rect x="0" y="216" width="400" height="84" fill="#b89a6a" opacity=".45"/>';
    bg += k.el(330, 236, 40, 16, '#3a2a1a') + k.el(330, 240, 30, 10, '#1a120a') + k.p('M286 236C300 222 360 222 374 236C360 230 300 230 286 236Z', '#c8aa7a');
    bg += miniTree(k, 70, 222, 60, ['#6a7a48', '#7a8a52', '#a8b070', '#5a4a3a'], { n: 10, wide: 1.1 });
    bg += k.grass(r, 0, 400, 296, 70, 18, ['#b0a060', '#94884e', '#c8b878']);
    for (var i = 0; i < 20; i++) bg += k.el(r() * 400, 240 + r() * 56, 2 + r() * 3, 1.4 + r() * 1.5, r() < 0.5 ? '#9a8058' : '#d0b88a');
    var shadowS = k.shadow(210, 232, 78, 6, 0.85);
    // tail with black brush tip
    s += bushyTail(k, [[[264, 202], [296, 214], [322, 224], [338, 214]], [[338, 214], [352, 204], [360, 190], [364, 172]]], 6, 4,
      ['#8a6a44', '#6a5032'], 0.72, ['#141010', '#2a2018', '#000'], 18);
    // hind foot
    s += k.p('M222 222C232 228 252 230 262 228L262 234C250 236 230 236 220 230Z', '#a88a62');
    s += k.p(body, k.U('dgB'));
    s += fur(k, 'dgBC', 212, 180, 68, 52, 380, 5.5, function(x, y) { return 170 + (y - 180) * 0.4; }, ['#d8c098', '#4a3820', '#b0925e'], 0.8, 0.65);
    s += k.p('M156 206C176 220 220 226 262 218L264 224C220 232 174 228 152 212Z', '#e8dcc0', 'opacity=".7"');
    s += k.el(240, 196, 30, 24, '#8a6c46', 'opacity=".35"');
    // front paws holding a seed
    s += k.p('M150 186C142 186 136 180 136 174L144 172C146 178 150 180 156 180Z', '#c8aa80') + k.el(132, 172, 6, 5, '#7a5a2a') + k.el(131, 170, 2.4, 1.6, '#c8a060');
    // head
    s += k.p(head, k.U('dgH'));
    s += fur(k, 'dgHC', 134, 146, 36, 28, 140, 4.5, function() { return 180; }, ['#e0c8a0', '#4a3820'], 0.6, 0.6);
    s += k.el(102, 150, 4.2, 3.4, '#4a3428');
    s += k.p('M100 156C104 162 112 164 118 162', 'none', 'stroke="#3a2a1e" stroke-width="1"');
    s += k.sp('M108 152C92 146 80 144 68 146M108 154C92 156 82 160 72 166M110 150C98 140 88 136 78 132', '#2a2018', 0.6, 'opacity=".7"');
    // round dark ears
    s += k.el(152, 122, 12, 13, '#4a3a2e', 'transform="rotate(-20 152 122)"') + k.el(152, 123, 7.5, 8.5, '#8a6a5a', 'transform="rotate(-20 152 122)"');
    s += k.eye(128, 138, 5.4, '#120c08', { ring: '#d8c49a', ringR: 1.3 });
    return { wash: '#d6c69e', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- jointed-leg toolkit for the hoofed and padded mammals ---------
  // limbPath: tapered outline along joints [[x, y, width], …] (shoulder → foot)
  function limbPath(k, pts) {
    var L = [], R = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len, w = pts[i][2] / 2;
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
      R.unshift([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    return { d: k.smooth(L.concat(R), true), front: k.smooth(L.slice(1), false), back: k.smooth(R.slice(0, -1), false) };
  }
  // a shaded leg: gradient fill (light from the top-left), lit front edge,
  // shadowed back edge and soft highlights on the knee / hock bumps
  function leg(k, pts, grad, o) {
    o = o || {};
    var lp = limbPath(k, pts), s = k.p(lp.d, k.U(grad));
    s += k.sp(lp.back, o.dark || 'rgba(0,0,0,.35)', 2.2, 'opacity=".6"');
    s += k.sp(lp.front, o.lite || 'rgba(255,240,220,.22)', 1.2);
    (o.joints || []).forEach(function(j) { var q = pts[j]; s += k.el(q[0] - q[2] * 0.12, q[1], q[2] * 0.42, q[2] * 0.36, '#fff', 'opacity=".14"'); });
    if (o.mask) {
      // fade the top of a near leg into the body so it reads as one animal
      var y0 = pts[0][1];
      s = '<defs>' + k.lg(o.mask + 'g', 0, y0 - 4, 0, y0 + 16, [[0, '#000'], [1, '#fff']], ' gradientUnits="userSpaceOnUse"') +
        '<mask id="§' + o.mask + '" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="300"><rect width="400" height="300" fill="' + k.U(o.mask + 'g') + '"/></mask></defs>' +
        '<g mask="' + k.U(o.mask) + '">' + s + '</g>';
    }
    return s;
  }
  // cloven deer hoof with dew claw; (x,y) = ground contact centre
  function hoof(k, x, y, w) {
    return k.p('M' + (x - w * 0.75) + ' ' + y + 'L' + (x - w * 0.45) + ' ' + (y - 8) + 'L' + (x + w * 0.5) + ' ' + (y - 8) + 'L' + (x + w * 0.6) + ' ' + y + 'Z', '#1c140e') +
      k.sp('M' + (x - w * 0.05) + ' ' + (y - 7) + 'L' + (x - w * 0.15) + ' ' + y, '#5a4a3a', 0.8) +
      k.sp('M' + (x - w * 0.45) + ' ' + (y - 7.5) + 'L' + (x + w * 0.45) + ' ' + (y - 7.5), '#6a5a48', 1, 'opacity=".7"') +
      k.el(x + w * 0.55, y - 12, 1.8, 2.6, '#2a1e14');
  }
  // soft, two-toed camelid foot
  function padFoot(k, x, y, col) {
    return k.p('M' + (x - 11) + ' ' + y + 'C' + (x - 12) + ' ' + (y - 6) + ' ' + (x - 4) + ' ' + (y - 8) + ' ' + (x + 4) + ' ' + (y - 7) + 'C' + (x + 7) + ' ' + (y - 5) + ' ' + (x + 6) + ' ' + y + ' ' + (x + 4) + ' ' + y + 'Z', col) +
      k.p('M' + (x - 12) + ' ' + y + 'l3 -4l2 4Z', '#2a2018') + k.p('M' + (x - 6) + ' ' + y + 'l3 -4l2 4Z', '#2a2018');
  }
  // dog paw seen from the side
  function paw(k, x, y, col) {
    return k.el(x, y - 4, 9, 5, col) + k.sp('M' + (x - 7) + ' ' + (y - 1) + 'v-3M' + (x - 3) + ' ' + y + 'v-3M' + (x + 1) + ' ' + y + 'v-3', '#2a1a10', 0.9, 'opacity=".7"') +
      k.el(x - 6, y - 0.5, 3, 1.2, '#1a120c');
  }
  // body volume: highlights on shoulder and haunch, creases, belly shadow
  function volume(k, id, o) {
    var s = '';
    s += k.el(o.sh[0], o.sh[1], o.sh[2], o.sh[3], k.U(id + 'Hi'));
    s += k.el(o.hp[0], o.hp[1], o.hp[2], o.hp[3], k.U(id + 'Hi'));
    s += k.el(o.belly[0], o.belly[1], o.belly[2], o.belly[3], '#120a04', 'opacity=".26"');
    (o.creases || []).forEach(function(d) { s += k.sp(d, '#1a0e06', 5, 'opacity=".16"') + k.sp(d, '#1a0e06', 1.4, 'opacity=".28"'); });
    (o.rims || []).forEach(function(d) { s += k.sp(d, '#fff6e0', 3, 'opacity=".22"'); });
    return s;
  }
  function hiGrad(k, id) { return k.rg(id + 'Hi', 0.38, 0.32, 0.6, [[0, '#fff2d8', 0.42], [0.6, '#fff2d8', 0.1], [1, '#fff2d8', 0]]); }

  // ---- Southern pudú · Pudú (male, three-quarter head) ----
  P.pudu = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M146 190C136 168 140 146 160 136C180 128 205 134 228 128C250 120 276 118 292 134C306 150 306 176 296 194C286 206 268 210 250 206C230 204 210 208 190 208C170 208 152 202 146 190Z';
    var neck = 'M170 140C158 132 144 136 136 146L130 168C138 182 154 190 172 190L184 158Z';
    var head = 'M146 148C144 132 132 122 116 122C100 122 90 132 86 144C82 152 80 160 84 166C90 172 100 172 108 168C120 168 134 166 142 160C145 156 146 152 146 148Z';
    var defs = k.lg('puB', 0.35, 0, 0.6, 1, [[0, '#9a6236'], [0.5, '#7e4a28'], [1, '#4e2e18']]) +
      k.lg('puL', 0, 0, 1, 0.2, [[0, '#6e4224'], [0.55, '#4e2e18'], [1, '#2e1a0c']]) +
      k.lg('puLF', 0, 0, 1, 0.2, [[0, '#4a2c18'], [1, '#22140a']]) +
      k.rg('puH', 0.55, 0.3, 0.75, [[0, '#9a6438'], [0.6, '#74462a'], [1, '#4a2c18']]) +
      hiGrad(k, 'pu') + k.clip('puBC', body) + k.clip('puNC', neck) + k.clip('puHC', head);
    bg += k.p('M30 0L44 0L46 260L28 260Z', '#6a6a50', 'opacity=".25"') + k.p('M340 0L360 0L364 260L336 260Z', '#6a6a50', 'opacity=".3"');
    bg += k.fern(r, 330, 250, 90, -120, '#4a7a3a') + k.fern(r, 352, 252, 80, -70, '#3e6a32') + k.fern(r, 40, 252, 80, -60, '#4a7a3a') + k.fern(r, 30, 254, 70, -110, '#5a8a42');
    bg += forestFloor(k, 240);
    var shadowS = k.shadow(222, 248, 96, 7, 0.9);
    // far legs
    s += leg(k, [[162, 182, 22], [164, 202, 15], [162, 222, 9], [163, 228, 10], [162, 240, 7], [160, 246, 7]], 'puLF') + hoof(k, 159, 248, 8);
    s += leg(k, [[258, 182, 28], [252, 204, 17], [268, 228, 9], [266, 240, 7], [263, 246, 7]], 'puLF') + hoof(k, 262, 248, 8);
    // tiny tail
    s += k.p('M296 136C306 134 310 142 304 148C300 148 296 142 296 136Z', '#5a3420');
    // body with layered fur and volume
    s += k.p(body, k.U('puB'));
    s += k.g(fur(k, 'puBC', 222, 166, 86, 46, 360, 7, function(x, y) { return y < 150 ? 172 : 194 - (x - 220) * 0.12; }, ['#b8804e', '#3e2210', '#9a643a'], 1, 0.7) +
      fur(k, 'puBC', 222, 166, 86, 46, 160, 4, function(x, y) { return 160 + (y - 160) * 0.3; }, ['#d0a070', '#5a3418'], 0.6, 0.6) +
      volume(k, 'pu', { sh: [176, 158, 30, 26], hp: [270, 150, 34, 30], belly: [226, 212, 76, 16],
        creases: ['M190 168C196 180 196 194 190 206', 'M248 172C250 186 252 198 256 206'], rims: ['M150 150C166 134 196 132 228 128C252 122 278 120 292 132'] }), 'clip-path="' + k.U('puBC') + '"');
    // near legs (drawn over the body), knee and hock defined
    s += leg(k, [[180, 182, 26], [180, 202, 18], [178, 222, 10], [179, 228, 11.5], [178, 240, 8], [176, 246, 8]], 'puL', { joints: [3], mask: 'nl1' }) + hoof(k, 175, 249, 9);
    s += leg(k, [[272, 180, 36], [266, 202, 22], [286, 228, 10], [284, 240, 8], [281, 246, 8]], 'puL', { joints: [2], mask: 'nl2' }) + hoof(k, 280, 249, 9);
    // short, thick neck
    s += k.p(neck, k.U('puB'));
    s += fur(k, 'puNC', 156, 162, 26, 30, 90, 6, function() { return 120; }, ['#b8804e', '#3e2210'], 0.9, 0.7);
    s += k.sp('M136 148C134 162 140 178 156 188', '#2a160a', 3, 'opacity=".25"');
    // head, three-quarter view: far ear, skull, dark muzzle, both eyes
    s += k.el(119, 120, 7, 13, '#5a3420', 'transform="rotate(-24 119 120)"') + k.el(119, 121, 3.5, 8, '#a87a60', 'transform="rotate(-24 119 121)"');
    s += k.p(head, k.U('puH'));
    s += k.g(fur(k, 'puHC', 116, 146, 34, 26, 140, 4.5, function(x, y) { return Math.atan2(y - 120, x - 150) * 180 / Math.PI; }, ['#c08a5a', '#2e1a0c'], 0.7, 0.65) +
      k.p('M80 150C86 140 96 136 104 142C106 154 100 166 90 172C84 172 80 166 80 150Z', '#2a1810', 'opacity=".8"') +
      k.el(128, 136, 16, 10, '#fff2d8', 'opacity=".12"'), 'clip-path="' + k.U('puHC') + '"');
    // near ear
    s += k.p('M134 138C130 120 138 106 150 104C158 108 156 124 146 138Z', '#6a3e22') + k.p('M138 134C136 122 141 112 148 110C152 116 150 126 144 134Z', '#c49a80');
    s += k.sp('M140 132C140 122 144 114 148 112', '#f0d8c8', 0.8, 'opacity=".6"');
    // spike antlers between the ears
    s += k.p('M117 126L112 104L116 103L122 125Z', '#3e3024') + k.p('M128 126L127 102L131 102L133 126Z', '#4a3a2a');
    s += k.sp('M118 122L114 106M129 122L128.5 105', 'rgba(255,235,210,.45)', 0.8);
    s += k.el(124, 126, 9, 4, '#5a3420');
    // eyes: near (large, dark) and far (small, beside the nose bridge)
    s += k.eye(110, 144, 5, '#1a0e08', { ring: '#2a160a', ringR: 1.25 }) + k.sp('M116 150C112 156 106 160 100 162', '#1a0e08', 1.4, 'opacity=".6"');
    s += k.el(91, 143, 3, 2.3, '#140a06') + k.circ(90.2, 142.2, 0.8, '#fff', 'opacity=".8"');
    // nose with nostrils
    s += k.el(84, 162, 7, 5.5, '#120a06') + k.el(82, 160, 2.6, 1.6, '#4a3a32', 'opacity=".8"') + k.el(80.5, 163, 1.6, 1.1, '#000') + k.el(86.5, 163.5, 1.6, 1.1, '#000');
    s += k.p('M86 170C90 172 96 172 100 170', 'none', 'stroke="#2a1a10" stroke-width="1"');
    return { wash: '#b9c4a4', defs: defs, bg: bg, shadow: shadowS, fg: s, front: k.fern(r, 120, 264, 60, -40, '#5a8a42') + k.fern(r, 306, 266, 50, -150, '#4a7a3a') };
  };

  // ---- South Andean deer · Huemul (male, forked antlers, three-quarter head) ----
  P.huemul = function(k) {
    var r = k.rnd, s = '', bg = '';
    var body = 'M124 150C126 124 150 112 184 110C220 106 262 104 288 112C312 120 322 146 316 170C310 188 292 194 270 192C236 194 200 194 172 190C146 186 126 172 124 150Z';
    var neck = 'M124 164C114 136 108 110 110 88L140 80C148 104 160 124 186 136L172 172Z';
    var head = 'M128 74C124 58 110 50 96 52C82 54 72 64 68 76C64 86 64 96 70 102C78 108 88 106 96 102C110 100 122 92 128 74Z';
    var defs = k.lg('huB', 0.35, 0, 0.6, 1, [[0, '#7e705c'], [0.5, '#62564a'], [1, '#3e352c']]) +
      k.lg('huL', 0, 0, 1, 0.2, [[0, '#5e5244'], [0.55, '#463c32'], [1, '#2a241e']]) +
      k.lg('huLF', 0, 0, 1, 0.2, [[0, '#3e352c'], [1, '#221c16']]) +
      k.lg('huN', 0, 0, 1, 0, [[0, '#6e6252'], [1, '#5a4e40']]) +
      k.rg('huH', 0.6, 0.35, 0.75, [[0, '#8a7c66'], [0.6, '#6a5e4c'], [1, '#4a4034']]) +
      k.lg('huA', 0, 0, 1, 0, [[0, '#d8ccb0'], [0.5, '#a8987a'], [1, '#6a5a44']]) +
      hiGrad(k, 'hu') + k.clip('huBC', body) + k.clip('huNC', neck) + k.clip('huHC', head);
    bg += k.ridge(r, 'huR', 170, 60, '#a8b4bc', 0.65, 0.7);
    bg += k.p('M0 236C80 226 160 232 240 240C300 246 350 240 400 236L400 300L0 300Z', '#8a8a62', 'opacity=".55"');
    bg += k.rock(r, 'huRk', 50, 232, 100, 40, ['#b8b0a0', '#8a8274', '#5a5448']) + k.rock(r, 'huRk2', 360, 240, 90, 30, ['#b8b0a0', '#8a8274', '#5a5448']);
    bg += miniTree(k, 364, 204, 56, ['#3e5a30', '#4e6e3a', '#7a9a5a', '#4a3a2a']);
    bg += k.grass(r, 0, 400, 292, 80, 22, ['#8a8a4a', '#a8a05a', '#6a7038']);
    var shadowS = k.shadow(222, 258, 112, 7, 0.85);
    // far legs
    s += leg(k, [[150, 182, 26], [152, 204, 18], [150, 228, 11], [151, 234, 12.5], [150, 248, 9], [148, 255, 9]], 'huLF') + hoof(k, 147, 258, 10);
    s += leg(k, [[268, 180, 32], [258, 206, 19], [278, 232, 11], [274, 248, 8.5], [271, 255, 8.5]], 'huLF') + hoof(k, 270, 258, 10);
    // tail (dark above)
    s += k.p('M312 124C322 122 326 132 320 140C316 140 312 134 312 124Z', '#3a3028');
    // body
    s += k.p(body, k.U('huB'));
    s += k.g(fur(k, 'huBC', 220, 150, 100, 46, 460, 8, function(x, y) { return y < 140 ? 172 : 196; }, ['#a89a80', '#2e271e', '#857868'], 1, 0.7) +
      fur(k, 'huBC', 220, 150, 100, 46, 180, 4, function() { return 170; }, ['#c8bca0'], 0.6, 0.45) +
      volume(k, 'hu', { sh: [168, 140, 38, 32], hp: [282, 138, 40, 36], belly: [222, 196, 90, 16],
        creases: ['M184 154C192 170 192 184 186 194', 'M246 158C250 172 252 186 256 194'], rims: ['M128 146C138 124 164 114 196 110C232 106 266 104 290 112'] }), 'clip-path="' + k.U('huBC') + '"');
    // near legs: sturdy, jointed
    s += leg(k, [[166, 180, 32], [168, 204, 22], [166, 228, 13], [167, 234, 14.5], [166, 248, 10], [163, 255, 10]], 'huL', { joints: [3], mask: 'nl3' }) + hoof(k, 162, 258, 11);
    s += leg(k, [[284, 176, 44], [272, 206, 26], [294, 232, 13], [290, 248, 9.5], [287, 255, 9.5]], 'huL', { joints: [2], mask: 'nl4' }) + hoof(k, 286, 258, 11);
    // thick neck, pale throat patch
    s += k.p(neck, k.U('huN'));
    s += fur(k, 'huNC', 140, 126, 34, 48, 140, 7, function() { return 250; }, ['#a89a80', '#2e271e'], 0.9, 0.65);
    s += k.p('M112 94C110 104 112 116 117 126C121 126 124 122 124 118C120 110 119 102 120 96Z', '#e6dcc6', 'opacity=".7"');
    s += k.sp('M140 80C148 102 160 122 186 136', '#2a2018', 3, 'opacity=".3"');
    // far ear and far antler (behind the head)
    s += k.p('M98 58C92 42 96 30 104 24C112 32 112 46 106 58Z', '#4e4438') + k.p('M100 54C97 42 100 34 104 30C108 38 107 48 104 54Z', '#a89a84');
    var antF = 'M96 54C94 42 92 30 92 16M93 36C88 30 84 24 82 16';
    s += k.sp(antF, '#5a4a36', 4) + k.sp(antF, '#a8987a', 1.2, 'transform="translate(-.6 -.4)"');
    // head
    s += k.p(head, k.U('huH'));
    s += k.g(fur(k, 'huHC', 98, 80, 32, 28, 120, 4.5, function(x, y) { return Math.atan2(y - 60, x - 120) * 180 / Math.PI; }, ['#a89a80', '#2e271e'], 0.7, 0.6) +
      // the dark "Y": down the nose bridge, forking above the eyes
      k.p('M70 98C78 86 88 74 96 64L103 66C96 77 86 90 78 102Z', '#1e1812', 'opacity=".9"') +
      k.p('M96 64C100 58 106 54 112 52L114 57C108 59 103 63 101 67Z', '#1e1812', 'opacity=".85"') +
      k.p('M96 64C92 59 88 56 84 55L84 60C88 61 92 64 95 68Z', '#1e1812', 'opacity=".8"') +
      k.el(76, 104, 10, 6, '#d8ceb8', 'opacity=".7"'), 'clip-path="' + k.U('huHC') + '"');
    // near ear (large) and near antler: main beam with a forward tine
    s += k.p('M118 68C120 48 134 36 150 36C150 52 138 66 124 74Z', '#5e5244') + k.p('M122 66C124 52 134 42 145 41C144 52 136 62 126 69Z', '#d8ccb8');
    s += k.sp('M126 64C130 54 136 47 142 44', '#fff', 0.8, 'opacity=".4"');
    var antN = 'M110 52C112 40 116 26 124 12M114 36C108 28 104 22 104 12';
    s += k.sp(antN, '#4a3c2c', 5.2) + k.sp(antN, k.U('huA'), 3.4) + k.sp(antN, '#fff', 0.9, 'opacity=".35" transform="translate(-.8 -.5)"');
    s += k.el(104, 54, 10, 4, '#4a4034');
    // eyes, nose
    s += k.eye(108, 72, 4.8, '#1a100a', { ring: '#2a2018', ringR: 1.25 });
    s += k.el(84, 70, 2.8, 2.2, '#120a06') + k.circ(83.3, 69.3, 0.8, '#fff', 'opacity=".8"');
    s += k.el(69, 100, 7, 5.5, '#0e0a08') + k.el(66.5, 101, 1.6, 1.2, '#000') + k.el(72.5, 101.5, 1.6, 1.2, '#000') + k.el(68, 98, 2.4, 1.3, '#4a4038', 'opacity=".8"');
    s = '<g transform="translate(212 258) scale(.94) translate(-212 -258)">' + s + '</g>';
    return { wash: '#bcc4b0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Guanaco (long neck, small grey three-quarter head) ----
  P.guanaco = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var body = 'M170 150C172 130 194 122 226 122C256 120 284 120 302 130C318 140 320 158 312 172C304 182 288 182 272 180C246 180 216 182 196 180C178 176 168 166 170 150Z';
    var neck = 'M172 162C160 140 148 110 142 82C140 72 140 64 142 58L166 60C166 76 170 100 182 122C188 132 196 138 206 142Z';
    var head = 'M168 60C166 46 156 38 144 38C132 38 122 46 118 56C114 64 114 72 118 76C126 80 136 80 144 76C156 74 166 70 168 60Z';
    var defs = k.lg('gB', 0.4, 0, 0.5, 1, [[0, '#c48c54'], [0.5, '#a8743f'], [0.66, '#c8a07a'], [0.74, '#f2ece0'], [1, '#ddd4c4']]) +
      k.lg('gL', 0, 0, 1, 0.15, [[0, '#d8a46a'], [0.45, '#b07a44'], [1, '#7a5028']]) +
      k.lg('gLF', 0, 0, 1, 0.15, [[0, '#9a6a3a'], [1, '#5e3e20']]) +
      k.lg('gN', 0, 0, 1, 0, [[0, '#f6f0e4'], [0.3, '#e8dcc8'], [0.5, '#c08850'], [1, '#a06a38']]) +
      k.rg('gH', 0.6, 0.35, 0.75, [[0, '#a8a298'], [0.6, '#827c72'], [1, '#5a564e']]) +
      k.lg('gS', 0, 0, 0, 1, [[0, '#d8c88a'], [1, '#b0a06a']]) +
      hiGrad(k, 'g') + k.clip('gBC', body) + k.clip('gNC', neck) + k.clip('gHC', head);
    // Patagonian steppe and granite towers far away
    bg += k.p('M250 200L262 120L272 118L278 200Z', '#9aa4b0', 'opacity=".55"') + k.p('M280 200L290 104L302 102L308 200Z', '#8a96a4', 'opacity=".6"') + k.p('M312 200L320 130L330 128L336 200Z', '#9aa4b0', 'opacity=".5"');
    bg += k.p('M262 120L272 118L270 134L264 136Z', '#fff', 'opacity=".7"') + k.p('M290 104L302 102L300 120L292 122Z', '#fff', 'opacity=".7"');
    bg += k.p('M0 200C80 190 160 196 240 200C300 204 350 198 400 194L400 300L0 300Z', k.U('gS'), 'opacity=".75"');
    bg += k.grass(r, 0, 400, 292, 90, 26, ['#c8b46a', '#a8984e', '#d8c88a', '#8a7e40']);
    for (i = 0; i < 6; i++) { var cx = 30 + i * 70 + r() * 20, cy = 236 + r() * 20; bg += k.grass(r, cx - 10, cx + 10, cy, 14, 16, ['#b0a058', '#8a8040']); }
    var shadowS = k.shadow(244, 264, 92, 6, 0.85);
    // far legs
    s += leg(k, [[184, 168, 20], [186, 186, 14], [184, 218, 9], [185, 224, 10], [184, 252, 6.5], [182, 258, 6.5]], 'gLF') + padFoot(k, 184, 263, '#6a4e34');
    s += leg(k, [[276, 164, 28], [268, 190, 16], [286, 224, 9], [282, 252, 6.5], [280, 258, 6.5]], 'gLF') + padFoot(k, 282, 263, '#6a4e34');
    // short tail held down
    s += k.p('M310 136C320 138 324 150 320 164C316 166 312 156 310 146Z', '#a06a38');
    // body: cinnamon above, sharply white below
    s += k.p(body, k.U('gB'));
    s += k.g(fur(k, 'gBC', 244, 146, 76, 30, 300, 7, function(x, y) { return y < 150 ? 176 : 192; }, ['#e2b07c', '#7a4e24', '#c48c54'], 0.9, 0.6) +
      volume(k, 'g', { sh: [194, 140, 26, 22], hp: [292, 138, 30, 26], belly: [244, 184, 70, 8],
        creases: ['M208 158C212 168 212 176 208 182', 'M262 156C264 166 266 174 268 180'], rims: ['M174 146C182 130 204 124 228 122C260 120 286 120 302 130'] }), 'clip-path="' + k.U('gBC') + '"');
    // near legs: long, slender, clearly jointed
    s += leg(k, [[198, 168, 24], [200, 186, 16], [198, 218, 10], [199, 224, 11.5], [198, 252, 7], [196, 258, 7]], 'gL', { joints: [3], mask: 'nl5' }) + padFoot(k, 198, 263, '#8a6a48');
    s += leg(k, [[290, 164, 34], [280, 190, 19], [300, 224, 10], [296, 252, 7], [294, 258, 7]], 'gL', { joints: [2], mask: 'nl6' }) + padFoot(k, 296, 263, '#8a6a48');
    // long neck: pale front, cinnamon back
    s += k.p(neck, k.U('gN'));
    s += fur(k, 'gNC', 170, 104, 30, 56, 170, 6, function() { return 250; }, ['#f8f2e8', '#8a5a30'], 0.8, 0.5);
    s += k.sp('M166 60C166 76 170 100 182 122C188 132 196 138 206 142', '#6a4220', 2.4, 'opacity=".3"');
    // far ear, head, near ear
    s += k.p('M144 42L142 14L150 18L152 42Z', '#6a645a') + k.p('M146 38L145 20L149 22L150 38Z', '#bcb4a8');
    s += k.p(head, k.U('gH'));
    s += k.g(fur(k, 'gHC', 142, 58, 28, 20, 80, 4, function(x, y) { return Math.atan2(y - 40, x - 170) * 180 / Math.PI; }, ['#c8c2b8', '#3e3a34'], 0.6, 0.6) +
      k.p('M114 62C118 70 124 76 132 78L134 70C126 68 120 64 116 58Z', '#3a3632', 'opacity=".55"') +
      k.el(150, 50, 14, 8, '#fff', 'opacity=".12"'), 'clip-path="' + k.U('gHC') + '"');
    s += k.p('M156 44L166 14L174 22L164 48Z', '#7a746a') + k.p('M158 42L166 22L170 26L162 44Z', '#d0c8bc');
    // split lip, nostrils, both eyes
    s += k.p('M116 70C120 74 126 76 132 76', 'none', 'stroke="#2a2622" stroke-width="1.2"') + k.sp('M118 72L117 76', '#2a2622', 1);
    s += k.el(119, 62, 2.6, 1.3, '#1e1a16', 'transform="rotate(-30 119 62)"') + k.el(125, 64, 2.2, 1.1, '#1e1a16', 'transform="rotate(-10 125 64)"');
    s += k.eye(146, 52, 4.6, '#1a120c', { ring: '#3a3632', ringR: 1.25 }) + k.sp('M140 47C144 44 150 44 153 47', '#1e1a16', 1.2);
    s += k.el(128, 50, 2.6, 2, '#120c08') + k.circ(127.3, 49.4, 0.7, '#fff', 'opacity=".8"');
    return { wash: '#d3c7a0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Culpeo fox · Zorro culpeo (three-quarter head) ----
  P.culpeo = function(k) {
    var r = k.rnd, s = '', bg = '';
    var body = 'M150 152C154 132 176 124 206 124C238 122 266 124 282 134C298 144 300 162 290 174C278 184 256 182 234 180C206 180 182 182 166 178C152 172 146 164 150 152Z';
    var tail = 'M280 140C306 140 338 156 360 182C372 198 376 218 368 228C354 232 340 220 328 206C312 190 296 172 282 162Z';
    var neck = 'M152 160C146 142 150 128 160 120L188 128C178 138 174 150 174 166Z';
    var head = 'M162 116C160 98 146 88 128 88C114 88 104 96 98 106L74 120C68 124 70 132 76 134C88 138 104 138 116 136C134 138 152 132 162 116Z';
    var defs = k.lg('cuB', 0.45, 0, 0.5, 1, [[0, '#9a9284'], [0.4, '#8a8274'], [0.62, '#c08048'], [0.8, '#d8a670'], [1, '#ece2cc']]) +
      k.lg('cuT', 0, 0, 1, 1, [[0, '#a89a86'], [0.65, '#6a5e50'], [0.85, '#2a2420'], [1, '#141210']]) +
      k.lg('cuL', 0, 0, 1, 0.2, [[0, '#d8844a'], [0.5, '#b8622a'], [1, '#7a3a14']]) +
      k.lg('cuLF', 0, 0, 1, 0.2, [[0, '#8a4a22'], [1, '#5a2e12']]) +
      k.rg('cuH', 0.6, 0.35, 0.75, [[0, '#e08a48'], [0.6, '#c06a30'], [1, '#8a4a22']]) +
      hiGrad(k, 'cu') + k.clip('cuBC', body) + k.clip('cuTC', tail) + k.clip('cuHC', head) + k.clip('cuNC', neck);
    bg += k.ridge(r, 'cuR', 180, 50, '#b0b8b8', 0.7, 0.6);
    bg += k.p('M0 236C80 228 160 232 240 238C300 242 350 238 400 234L400 300L0 300Z', '#a89a70', 'opacity=".5"');
    bg += k.rock(r, 'cuRk', 340, 226, 110, 46) + miniTree(k, 50, 240, 30, ['#6a7a48', '#7a8a52', '#a8b070', '#5a4a3a'], { n: 6, wide: 1.2 });
    bg += k.grass(r, 0, 400, 292, 70, 22, ['#a8a05a', '#8a8a4a', '#c0b070']);
    var shadowS = k.shadow(220, 252, 96, 6, 0.85);
    // far legs
    s += leg(k, [[166, 170, 18], [170, 188, 13], [168, 222, 8], [169, 228, 9], [168, 244, 7]], 'cuLF') + paw(k, 166, 251, '#4a2a14');
    s += leg(k, [[258, 166, 26], [250, 190, 15], [270, 220, 8], [268, 244, 7]], 'cuLF') + paw(k, 266, 251, '#4a2a14');
    // big bushy tail with a dark tip
    s += k.p(tail, k.U('cuT'));
    s += fur(k, 'cuTC', 328, 186, 52, 46, 220, 9, function() { return 48; }, ['#d0c4b0', '#2a2420', '#8a7c6a'], 1, 0.7);
    s += k.p(k.fluff(r, 350, 214, 18, 14, 40, 12, 0.3), '#181412', 'opacity=".55"');
    // body
    s += k.p(body, k.U('cuB'));
    s += k.g(fur(k, 'cuBC', 220, 150, 78, 34, 340, 7, function(x, y) { return y < 148 ? 178 : 200; }, ['#e0d8c8', '#3a342c', '#a89a84'], 0.9, 0.7) +
      volume(k, 'cu', { sh: [178, 144, 28, 24], hp: [270, 142, 32, 28], belly: [222, 184, 70, 10],
        creases: ['M190 156C196 166 196 176 192 182'], rims: ['M154 148C162 132 184 126 210 124C240 122 266 124 282 134'] }), 'clip-path="' + k.U('cuBC') + '"');
    // near legs: rufous, slim, jointed (hock bends back)
    s += leg(k, [[182, 170, 22], [184, 188, 15], [182, 222, 9], [183, 228, 10], [182, 244, 8]], 'cuL', { joints: [3], mask: 'nl7' }) + paw(k, 180, 251, '#5a3018');
    s += leg(k, [[272, 164, 32], [262, 190, 18], [284, 220, 9], [282, 244, 8]], 'cuL', { joints: [2], mask: 'nl8' }) + paw(k, 280, 251, '#5a3018');
    s += k.sp('M184 196L183 222', '#3a1a08', 2.4, 'opacity=".35"');
    // neck: rufous behind, white throat in front
    s += k.p(neck, '#c07040');
    s += fur(k, 'cuNC', 166, 142, 22, 26, 70, 5, function() { return 110; }, ['#e0a070', '#6a3414'], 0.8, 0.6);
    s += k.p('M152 160C146 146 148 134 154 126L166 132C162 140 162 150 166 164Z', '#f4eee2');
    // far ear, head, near ear
    s += k.p('M118 96L120 60L138 92Z', '#9a5022') + k.p('M122 92L122 68L133 90Z', '#2a1810', 'opacity=".55"');
    s += k.p(head, k.U('cuH'));
    s += k.g(fur(k, 'cuHC', 120, 114, 46, 24, 150, 5, function(x, y) { return Math.atan2(y - 100, x - 170) * 180 / Math.PI; }, ['#f2aa6a', '#6a3010'], 0.7, 0.6) +
      // white lip line and cheek, darker muzzle top
      k.p('M72 126C84 132 104 134 122 132C134 132 148 130 158 124L160 134C140 140 110 142 86 140C78 138 72 132 72 126Z', '#f4eee2') +
      k.p('M78 118C90 112 102 106 112 102L114 106C102 110 90 116 80 122Z', '#8a4a22', 'opacity=".5"') +
      k.el(136, 104, 20, 10, '#fff2d8', 'opacity=".14"'), 'clip-path="' + k.U('cuHC') + '"');
    s += k.p('M134 98L148 60L162 104Z', '#b0602a') + k.p('M140 98L148 70L156 100Z', '#f0e0cc') + k.sp('M148 60L162 104', '#2a1810', 2, 'opacity=".6"');
    s += k.sp('M142 96L147 76M146 98L149 80', '#c8a080', 0.7);
    // nose, eyes
    s += k.el(72, 124, 5.4, 4.4, '#120c08') + k.el(70, 122.5, 2, 1.1, '#4a4038', 'opacity=".8"') + k.el(69.5, 125.5, 1.2, 0.9, '#000') + k.el(74, 126, 1.2, 0.9, '#000');
    s += k.p('M76 130C82 134 88 134 92 132', 'none', 'stroke="#3a1a08" stroke-width="1"');
    s += k.eye(120, 106, 4.4, '#d08a28', { pupil: 0.42, ring: '#2a1408', ringR: 1.2 });
    s += k.el(100, 106, 2.6, 2, '#2a1408') + k.circ(99.4, 105.4, 0.7, '#fff', 'opacity=".8"');
    s += k.sp('M112 112C108 118 100 120 94 120', '#3a1a08', 1, 'opacity=".5"');
    return { wash: '#cdc1a0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // =================================================================
  //  INSECTS & OTHERS · INSECTOS Y OTROS  (dorsal views, field-guide style)
  // =================================================================

  // jointed leg along points; widths taper w0 -> w1; optional hairs
  function jleg(k, pts, w0, w1, col, hair, hairLen) {
    var s = '', r = k.rnd, i, hs = '';
    for (i = 0; i < pts.length - 1; i++) {
      var t = i / Math.max(1, pts.length - 2), w = w0 + (w1 - w0) * t;
      var a = pts[i], b = pts[i + 1];
      s += k.sp('M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1], col, w);
      s += k.sp('M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1], 'rgba(255,255,255,.22)', w * 0.3, 'transform="translate(-' + (w * 0.18) + ' -' + (w * 0.18) + ')"');
      if (hair) {
        var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L, ny = dx / L;
        for (var j = 0; j < L / 2.2; j++) {
          var u = r(), x = a[0] + dx * u, y = a[1] + dy * u, side = r() < 0.5 ? -1 : 1, hl = (hairLen || 5) * (0.5 + r());
          hs += 'M' + k.n(x + nx * side * w * 0.4) + ' ' + k.n(y + ny * side * w * 0.4) + 'l' + k.n(nx * side * hl + dx / L * hl * 0.6) + ' ' + k.n(ny * side * hl + dy / L * hl * 0.6);
        }
      }
    }
    if (hair) s += k.sp(hs, hair, 0.7, 'opacity=".85"');
    return s;
  }

  // ---- Ladybird · Chinita ----
  P.chinita = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.rg('lbE', 0.38, 0.3, 0.75, [[0, '#ff7a5a'], [0.35, '#e8301e'], [0.8, '#a8140c'], [1, '#6a0a06']]) +
      k.rg('lbG', 0.35, 0.25, 0.5, [[0, '#fff', 0.9], [0.4, '#fff', 0.25], [1, '#fff', 0]]) +
      k.lg('lbLeaf', 0, 0, 1, 1, [[0, '#7ab04a'], [0.5, '#5a9038'], [1, '#3a6a28']]);
    // a big leaf as the stage, with aphids
    bg += '<g transform="translate(20 268) rotate(-28)">' + k.p('M0 0C80 -120 300 -150 400 -40C300 30 100 60 0 0Z', k.U('lbLeaf')) +
      k.sp('M0 0C120 -50 260 -70 400 -40', '#c8e0a0', 2.4, 'opacity=".7"') +
      k.sp('M80 -24l30 -50M150 -40l34 -54M220 -52l34 -52M290 -56l30 -40M110 -32l40 30M180 -46l44 30M250 -56l40 26', '#c8e0a0', 1.2, 'opacity=".5"') + '</g>';
    for (i = 0; i < 6; i++) {
      var ax = 300 + r() * 60, ay = 80 + r() * 50;
      bg += k.el(ax, ay, 5, 3.4, '#9ac85a', 'transform="rotate(' + k.n(r() * 180) + ' ' + k.n(ax) + ' ' + k.n(ay) + ')"') + k.circ(ax - 1.5, ay - 1, 1.2, '#e8f8c0', 'opacity=".7"');
    }
    var shadowS = k.el(206, 166, 64, 62, '#1e3a12', 'opacity=".28"');
    var g2 = '';
    // legs and antennae (black), peeking out
    var legs = [[[-40, -30], [-62, -42], [-74, -30]], [[-44, 0], [-70, 4], [-80, 22]], [[-40, 30], [-60, 46], [-66, 66]]];
    for (i = 0; i < 3; i++) {
      g2 += jleg(k, legs[i], 4, 2.6, '#141210') + jleg(k, legs[i].map(function(q) { return [-q[0], q[1]]; }), 4, 2.6, '#141210');
    }
    g2 += k.sp('M-10 -90C-16 -102 -24 -106 -30 -104M10 -90C16 -102 24 -106 30 -104', '#141210', 2);
    g2 += k.circ(-30, -104, 2.4, '#141210') + k.circ(30, -104, 2.4, '#141210');
    // elytra
    g2 += k.p('M0 -60C-30 -62 -58 -44 -60 -6C-62 34 -36 66 0 68C36 66 62 34 60 -6C58 -44 30 -62 0 -60Z', k.U('lbE'));
    var spots = [[-30, -32, 9], [-38, 14, 11], [-18, 40, 9], [30, -32, 9], [38, 14, 11], [18, 40, 9], [0, -54, 9]];
    for (i = 0; i < spots.length; i++) g2 += k.el(spots[i][0], spots[i][1], spots[i][2], spots[i][2] * 0.92, '#140e0c');
    g2 += k.sp('M0 -60L0 68', '#4a0a06', 1.6);
    g2 += k.p('M0 -60C-30 -62 -58 -44 -60 -6C-62 34 -36 66 0 68C36 66 62 34 60 -6C58 -44 30 -62 0 -60Z', k.U('lbG'));
    g2 += k.p('M-40 -40C-34 -52 -20 -56 -12 -56C-18 -48 -28 -40 -40 -34Z', '#fff', 'opacity=".75"');
    g2 += k.circ(30, 40, 3, '#fff', 'opacity=".35"');
    // pronotum (black, cream side patches) and head, overlapping the elytra
    g2 += k.p('M-42 -54C-40 -74 -20 -82 0 -82C20 -82 40 -74 42 -54C28 -58 -28 -58 -42 -54Z', '#16130f');
    g2 += k.el(-30, -64, 8, 6, '#f2ecd8', 'transform="rotate(-25 -30 -64)"') + k.el(30, -64, 8, 6, '#f2ecd8', 'transform="rotate(25 30 -64)"');
    g2 += k.el(0, -82, 18, 11, '#141210') + k.el(-8, -86, 3.6, 2.6, '#f2ecd8') + k.el(8, -86, 3.6, 2.6, '#f2ecd8');
    g2 += k.p('M-20 -76C-10 -80 10 -80 20 -76', 'none', 'stroke="#fff" stroke-width="1.2" opacity=".35"');
    s += '<g transform="translate(200 150) rotate(-24) scale(1.1)">' + g2 + '</g>';
    return { wash: '#c6d3a0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Chilean stag beetle · Ciervo volante (male) ----
  P.ciervo = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.lg('svE', 0, 0, 1, 1, [[0, '#c8a040'], [0.3, '#8a7a2a'], [0.55, '#4a6a2a'], [0.8, '#8a4a1e'], [1, '#4a2410']]) +
      k.lg('svP', 0, 0, 1, 0, [[0, '#6a4a1e'], [0.5, '#b89a3a'], [1, '#5a3a18']]) +
      k.lg('svM', 0, 0, 0, 1, [[0, '#8a5a2a'], [0.6, '#c8902e'], [1, '#6a3e18']]) +
      k.rg('svG', 0.4, 0.3, 0.6, [[0, '#fff', 0.45], [1, '#fff', 0]]) +
      k.lg('svLog', 0, 0, 0, 1, [[0, '#8a7458'], [0.5, '#6a5440'], [1, '#4a3828']]);
    // mossy log underneath
    bg += k.p('M-10 180C80 170 300 168 410 178L410 290C300 296 80 296 -10 290Z', k.U('svLog'));
    var lines = '';
    for (i = 0; i < 12; i++) lines += 'M-10 ' + (186 + i * 9) + 'C120 ' + (180 + i * 9 + r() * 6) + ' 280 ' + (182 + i * 9) + ' 410 ' + (188 + i * 9);
    bg += k.sp(lines, '#3a2a1c', 1.2, 'opacity=".4"');
    for (i = 0; i < 50; i++) bg += k.circ(r() * 400, 172 + r() * 20, 2 + r() * 3, r() < 0.5 ? '#6a8a3a' : '#8aa84a', 'opacity=".85"');
    var g2 = '';
    // legs: long and slender, front pair longest
    var L = [
      [[-18, -26], [-60, -60], [-86, -96], [-96, -130]],
      [[-22, 10], [-64, 0], [-98, 20], [-120, 30]],
      [[-20, 44], [-56, 72], [-80, 110], [-92, 140]]
    ];
    for (i = 0; i < 3; i++) g2 += jleg(k, L[i], 6, 3, '#3a2410') + jleg(k, L[i].map(function(q) { return [-q[0], q[1]]; }), 6, 3, '#3a2410');
    // elytra
    g2 += k.p('M-36 -6C-42 40 -40 96 -16 110C-6 114 6 114 16 110C40 96 42 40 36 -6Z', k.U('svE'));
    g2 += k.sp('M0 -4L0 112', '#2a1a0a', 1.4) + k.p('M-36 -6C-42 40 -40 96 -16 110C-6 114 6 114 16 110C40 96 42 40 36 -6Z', k.U('svG'));
    g2 += k.sp('M-20 6C-24 40 -18 80 -6 100M20 6C24 40 18 80 6 100', '#e8d080', 1, 'opacity=".35"');
    // pronotum and head
    g2 += k.p('M-40 -12C-44 -36 -30 -50 0 -50C30 -50 44 -36 40 -12C24 -6 -24 -6 -40 -12Z', k.U('svP'));
    g2 += k.p('M-22 -48C-26 -60 -16 -68 0 -68C16 -68 26 -60 22 -48Z', '#5a3a18') + k.circ(-22, -56, 3.6, '#1a120a') + k.circ(22, -56, 3.6, '#1a120a');
    // huge upturned mandibles with inner teeth and fine hairs
    var mL = 'M-14 -64C-30 -90 -46 -126 -40 -164C-36 -184 -20 -194 -6 -188C-18 -180 -28 -166 -28 -146C-28 -116 -16 -90 -4 -66Z';
    g2 += k.p(mL, k.U('svM')) + k.p(mL, k.U('svM'), 'transform="scale(-1 1)"');
    var teeth = '';
    for (i = 0; i < 9; i++) { var ty = -80 - i * 11, tx = -14 - i * 1.6 - (i > 5 ? (i - 5) * 3 : 0); teeth += 'M' + k.n(tx) + ' ' + ty + 'l5 -2'; }
    g2 += k.sp(teeth, '#5a3a18', 1.6) + k.sp(teeth, '#5a3a18', 1.6, 'transform="scale(-1 1)"');
    var hairs = '';
    for (i = 0; i < 30; i++) { var hy = -70 - r() * 90; hairs += 'M' + k.n(-30 - (hy + 70) * 0.12 + r() * 6) + ' ' + k.n(hy) + 'l-5 -3'; }
    g2 += k.sp(hairs, '#d8b878', 0.6, 'opacity=".7"') + k.sp(hairs, '#d8b878', 0.6, 'opacity=".7" transform="scale(-1 1)"');
    g2 += k.sp('M-36 -150C-34 -170 -24 -182 -12 -186', '#ffe8a0', 1.2, 'opacity=".55"') + k.sp('M36 -150C34 -170 24 -182 12 -186', '#ffe8a0', 1.2, 'opacity=".4"');
    // short elbowed antennae
    g2 += k.sp('M-20 -62L-34 -70L-44 -64M20 -62L34 -70L44 -64', '#3a2410', 1.6);
    s += '<g transform="translate(206 178) rotate(14) scale(.78)">' + g2 + '</g>';
    var shadowS = k.el(216, 200, 44, 52, k.U('shd'));
    return { wash: '#c1c7a2', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Madre de la culebra (female longhorn beetle) ----
  P.madreculebra = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.lg('mcE', 0, 0, 1, 1, [[0, '#4a3a30'], [0.4, '#1e1814'], [1, '#0a0806']]) +
      k.rg('mcG', 0.35, 0.3, 0.6, [[0, '#fff', 0.38], [1, '#fff', 0]]) +
      k.lg('mcBark', 0, 0, 1, 0, [[0, '#8a7a64'], [0.5, '#a8987e'], [1, '#7a6a54']]);
    // on bark of an old native tree
    bg += '<rect x="0" y="0" width="400" height="300" fill="' + k.U('mcBark') + '" opacity=".55"/>';
    var bk = '';
    for (i = 0; i < 40; i++) { var bx = r() * 400; bk += 'M' + k.n(bx) + ' 0Q' + k.n(bx + (r() - 0.5) * 30) + ' 150 ' + k.n(bx + (r() - 0.5) * 20) + ' 300'; }
    bg += k.sp(bk, '#4a3a2a', 1.6, 'opacity=".35"') + k.sp(bk, '#d8c8a8', 0.8, 'opacity=".3" transform="translate(3 0)"');
    for (i = 0; i < 24; i++) bg += k.circ(r() * 400, r() * 300, 2 + r() * 5, r() < 0.5 ? 'rgba(200,200,150,.5)' : 'rgba(150,170,120,.45)');
    var g2 = '';
    // stout legs
    var L = [[[-22, -24], [-52, -40], [-70, -70], [-78, -96]], [[-24, 6], [-58, 4], [-84, 24], [-98, 34]], [[-22, 36], [-52, 62], [-66, 98], [-74, 126]]];
    for (i = 0; i < 3; i++) g2 += jleg(k, L[i], 6, 3, '#1a1410') + jleg(k, L[i].map(function(q) { return [-q[0], q[1]]; }), 6, 3, '#1a1410');
    // thick segmented antennae (shortish for a longhorn)
    var ant = [[-12, -66], [-26, -86], [-40, -100], [-52, -118], [-58, -138], [-60, -156]];
    for (i = 0; i < ant.length - 1; i++) {
      g2 += k.sp('M' + ant[i][0] + ' ' + ant[i][1] + 'L' + ant[i + 1][0] + ' ' + ant[i + 1][1], '#1a1410', 5 - i * 0.5) + k.sp('M' + -ant[i][0] + ' ' + ant[i][1] + 'L' + -ant[i + 1][0] + ' ' + ant[i + 1][1], '#1a1410', 5 - i * 0.5);
      g2 += k.circ(ant[i + 1][0], ant[i + 1][1], 3 - i * 0.3, '#2a2018') + k.circ(-ant[i + 1][0], ant[i + 1][1], 3 - i * 0.3, '#2a2018');
    }
    // elytra: long, glossy black, finely wrinkled
    var el2 = 'M-40 -10C-46 40 -44 104 -18 120C-8 125 8 125 18 120C44 104 46 40 40 -10Z';
    g2 += k.p(el2, k.U('mcE'));
    var wr = '';
    for (i = 0; i < 70; i++) { var wx = (r() - 0.5) * 70, wy = -4 + r() * 120; if (Math.abs(wx) > 40 - (wy > 90 ? (wy - 90) : 0)) continue; wr += 'M' + k.n(wx) + ' ' + k.n(wy) + 'q3 -1 5 1'; }
    g2 += k.sp(wr, '#5a4a3e', 0.8, 'opacity=".6"');
    g2 += k.sp('M0 -8L0 122', '#000', 1.6) + k.p(el2, k.U('mcG'));
    g2 += k.p('M-30 0C-34 30 -30 70 -18 96C-26 70 -28 30 -24 0Z', '#fff', 'opacity=".2"');
    // pronotum with spiny side margins
    g2 += k.p('M-34 -12L-44 -20L-38 -26L-48 -34L-38 -40L-44 -50L-30 -54C-16 -60 16 -60 30 -54L44 -50L38 -40L48 -34L38 -26L44 -20L34 -12C20 -8 -20 -8 -34 -12Z', '#1e1814');
    g2 += k.sp('M-24 -48C-10 -54 10 -54 24 -48', '#6a5a4e', 1.2, 'opacity=".6"');
    // head with big mandibles
    g2 += k.p('M-22 -56C-26 -70 -14 -78 0 -78C14 -78 26 -70 22 -56Z', '#16120e') + k.circ(-18, -66, 3.4, '#3a2e24') + k.circ(18, -66, 3.4, '#3a2e24');
    g2 += k.p('M-10 -76C-16 -86 -10 -94 -2 -92C-6 -88 -6 -82 -4 -78Z', '#2a2018') + k.p('M10 -76C16 -86 10 -94 2 -92C6 -88 6 -82 4 -78Z', '#2a2018');
    s += '<g transform="translate(200 148) rotate(-8) scale(.92)">' + g2 + '</g>';
    var shadowS = k.el(210, 168, 54, 72, k.U('shd'));
    return { wash: '#c9bc9a', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  // ---- Chilean rose tarantula · Araña pollito ----
  P.arana = function(k) {
    var r = k.rnd, s = '', bg = '', i;
    var defs = k.rg('arC', 0.45, 0.4, 0.6, [[0, '#d8a08a'], [0.6, '#a8705e'], [1, '#6a4436']]) +
      k.rg('arA', 0.45, 0.35, 0.6, [[0, '#7a5a48'], [0.7, '#4a3428'], [1, '#2a1c16']]) +
      k.lg('arSoil', 0, 0, 0, 1, [[0, '#d8c09a'], [1, '#b89a72']]);
    bg += '<rect x="0" y="0" width="400" height="300" fill="' + k.U('arSoil') + '" opacity=".55"/>';
    for (i = 0; i < 40; i++) bg += k.el(r() * 400, r() * 300, 2 + r() * 4, 1.5 + r() * 3, r() < 0.5 ? '#9a8058' : '#e0caa0', 'opacity=".8"');
    bg += k.rock(r, 'aR1', 340, 210, 110, 60) + k.rock(r, 'aR2', 60, 56, 90, 40);
    bg += k.grass(r, 290, 380, 220, 16, 22, ['#a8a05a', '#8a8a4a']);
    var shadowS = k.el(206, 170, 120, 90, k.U('shd'));
    var g2 = '';
    // eight hairy legs (4 per side), banded at the joints, plus two pedipalps
    var legs = [
      [[-18, -24], [-52, -58], [-74, -92], [-82, -128]],
      [[-24, -10], [-66, -26], [-102, -30], [-132, -40]],
      [[-24, 8], [-66, 22], [-100, 44], [-126, 62]],
      [[-18, 22], [-46, 54], [-60, 92], [-62, 128]]
    ];
    for (i = 0; i < 4; i++) {
      var Ls = legs[i], Rs = Ls.map(function(q) { return [-q[0], q[1]]; });
      g2 += jleg(k, Ls, 13, 8, '#3e2a20', '#c8a890', 8) + jleg(k, Ls, 13, 8, '#3e2a20', '#8a6a58', 5) + jleg(k, Rs, 13, 8, '#3e2a20', '#c8a890', 8) + jleg(k, Rs, 13, 8, '#3e2a20', '#8a6a58', 5);
      for (var j = 1; j < Ls.length - 1; j++) g2 += k.circ(Ls[j][0], Ls[j][1], 6, '#7a5a48', 'opacity=".7"') + k.circ(Rs[j][0], Rs[j][1], 6, '#7a5a48', 'opacity=".7"');
    }
    g2 += jleg(k, [[-10, -36], [-24, -60], [-28, -76]], 7, 5, '#4a3226', '#c8a890', 4) + jleg(k, [[10, -36], [24, -60], [28, -76]], 7, 5, '#4a3226', '#c8a890', 4);
    // abdomen with long pale hairs
    g2 += k.el(0, 62, 40, 46, k.U('arA'));
    g2 += k.hatch(r, { cx: 0, cy: 62, rx: 38, ry: 44, n: 260, len: 7, ang: 90, angFn: function(x, y) { return Math.atan2(y - 40, x) * 180 / Math.PI; }, jit: 30, curve: 0.3, cols: ['#c8a890', '#e8d0b8', '#6a4a3a'], w: 0.7, op: 0.75 });
    g2 += k.el(-12, 46, 12, 10, '#fff', 'opacity=".08"');
    // carapace with rosy hairs radiating from the centre
    g2 += k.el(0, -6, 34, 30, k.U('arC'));
    g2 += k.hatch(r, { cx: 0, cy: -6, rx: 32, ry: 28, n: 200, len: 6, ang: 0, angFn: function(x, y) { return Math.atan2(y + 6, x) * 180 / Math.PI; }, jit: 20, cols: ['#f0c0a8', '#e8b098', '#7a4e40'], w: 0.7, op: 0.8 });
    g2 += k.sp('M0 -30L0 -2M-20 -18L0 -6M20 -18L0 -6M-24 4L0 -6M24 4L0 -6', '#5a3428', 1, 'opacity=".4"');
    // small cluster of eyes on a tubercle
    g2 += k.el(0, -26, 6, 4, '#3a2420') + k.circ(-2, -27, 1.3, '#1a100c') + k.circ(2, -27, 1.3, '#1a100c') + k.circ(-1.6, -27.6, 0.4, '#fff') + k.circ(2.4, -27.6, 0.4, '#fff');
    s += '<g transform="translate(200 150) rotate(-12) scale(.95)">' + g2 + '</g>';
    return { wash: '#d8c4a0', defs: defs, bg: bg, shadow: shadowS, fg: s };
  };

  return {
    render: render,
    has: function(id) { return !!P[id]; },
    ids: function() { return Object.keys(P); }
  };
})();
