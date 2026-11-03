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
    s += sp('M0 0Q' + n(len * 0.5) + ' ' + n(-w * 0.08) + ' ' + n(len * 0.97) + ' 0', vein, Math.max(0.6, w * 0.08));
    var nv = o.veins == null ? 5 : o.veins, vd = '';
    for (var i = 1; i <= nv; i++) {
      var t = i / (nv + 1), vx = len * t, vw = w * Math.sin(PI * Math.min(0.98, t + 0.05)) * 0.8;
      vd += 'M' + n(vx) + ' 0Q' + n(vx + len * 0.06) + ' ' + n(-vw * 0.5) + ' ' + n(vx + len * 0.14) + ' ' + n(-vw);
      vd += 'M' + n(vx) + ' 0Q' + n(vx + len * 0.06) + ' ' + n(vw * 0.5) + ' ' + n(vx + len * 0.14) + ' ' + n(vw);
    }
    if (nv) s += sp(vd, vein, Math.max(0.4, w * 0.04), 'opacity=".8"');
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
    var s = '', d = '', k = 14;
    for (var i = 1; i < k; i++) {
      var t = i / k, px = t * len, lw = len * 0.22 * Math.sin(PI * (0.15 + t * 0.85)) * (1 - t * 0.35);
      d += 'M' + n(px) + ' 0q' + n(lw * 0.4) + ' ' + n(-lw * 0.3) + ' ' + n(lw * 0.5) + ' ' + n(-lw) +
        'q' + n(-lw * 0.05) + ' ' + n(lw * 0.6) + ' ' + n(-lw * 0.5) + ' ' + n(lw) + 'Z';
      d += 'M' + n(px) + ' 0q' + n(lw * 0.4) + ' ' + n(lw * 0.3) + ' ' + n(lw * 0.5) + ' ' + n(lw) +
        'q' + n(-lw * 0.05) + ' ' + n(-lw * 0.6) + ' ' + n(-lw * 0.5) + ' ' + n(-lw) + 'Z';
    }
    s += p(d, col);
    s += sp('M0 0Q' + n(len * 0.5) + ' ' + n(-len * 0.04) + ' ' + n(len) + ' 0', 'rgba(40,60,20,.6)', 1.1);
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
      body += (a.bg || '') + (a.shadow || '') + a.fg + (a.front || '');
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
    var body = 'M140 122C170 100 240 98 296 120C330 134 352 160 362 190L368 214C340 210 310 208 290 212C262 220 222 226 196 222C160 216 134 196 128 168C125 152 130 134 140 122Z';
    var wing = 'M152 116C208 98 282 106 328 138C352 156 368 190 376 228C352 218 312 208 272 204C226 198 186 190 166 174C152 162 146 136 152 116Z';
    var panel = 'M176 150C214 136 272 140 322 164C336 176 342 190 336 199C308 197 264 195 230 189C202 184 182 175 176 165Z';
    var defs = k.lg('cBody', 0.2, 0, 0.5, 1, [[0, '#3a3632'], [0.45, '#1c1a17'], [1, '#090807']]) +
      k.lg('cWing', 0, 0, 0.7, 1, [[0, '#3b3631'], [0.5, '#181614'], [1, '#0a0908']]) +
      k.lg('cSheen', 0, 0, 0, 1, [[0, '#9fb0c4', 0.35], [0.3, '#9fb0c4', 0], [1, '#000', 0]]) +
      k.lg('cPanel', 0, 0, 0.25, 1, [[0, '#fbfaf6'], [0.55, '#e9e5dc'], [1, '#aaa496']]) +
      k.rg('cRuff', 0.42, 0.38, 0.7, [[0, '#ffffff'], [0.7, '#f1eee8'], [1, '#c9c3b8']]) +
      k.rg('cHead', 0.4, 0.35, 0.75, [[0, '#94625a'], [0.55, '#5e3e3a'], [1, '#2a1d1b']]) +
      k.lg('cNeck', 0, 0, 1, 0, [[0, '#4a302c'], [0.5, '#6e4a44'], [1, '#3a2724']]) +
      k.lg('cBeak', 0, 0, 1, 0.4, [[0, '#2c2826'], [0.5, '#6d655c'], [1, '#ece3cc']]) +
      k.clip('cBodyC', body) + k.clip('cWingC', wing) + k.clip('cPanelC', panel);

    // habitat: snowy Andes far behind, a lichen-spotted crag below
    bg += k.ridge(r, 'cR1', 196, 72, '#a3b7c8', 0.6, 0.9);
    bg += k.ridge(r, 'cR2', 232, 38, '#93a68f', 0, 0.55);
    bg += k.rock(r, 'cRock', 236, 230, 300, 70, ['#cfc5b3', '#978d7c', '#5c544a']);
    bg += k.grass(r, 70, 130, 292, 26, 26, ['#7d8a4a', '#a3a35a', '#5e6b38']);
    var shadowS = k.shadow(250, 238, 118, 8, 0.95);
    var front = k.grass(r, 318, 390, 294, 26, 22, ['#7d8a4a', '#a3a35a', '#5e6b38']);

    // tail (short, dark, slightly fanned) peeking past the wing tips
    s += k.p('M330 200L384 236L372 243L360 238L346 241L304 216Z', '#12100e');
    s += k.sp('M340 212L378 238M330 210L362 240', '#34302b', 1);
    // legs (thick, grey) mostly hidden by belly feathers
    s += k.p('M198 214C198 224 197 232 196 238L210 238C211 230 212 222 212 214Z', '#6f6a64');
    s += k.p('M226 214C227 224 228 231 228 239L240 239C240 231 240 223 240 214Z', '#5c5853');
    s += k.sp('M197 224h14M197 231h14M227 226h12M227 233h12', 'rgba(30,25,20,.4)', 0.8);
    s += k.foot(203, 238, '#56514c', 1.7, -1) + k.foot(233, 239, '#4c4843', 1.6, -1);
    // body + plumage strokes
    s += k.p(body, k.U('cBody'));
    s += k.g(k.hatch(r, { cx: 200, cy: 196, rx: 80, ry: 30, n: 160, len: 9, ang: 70, jit: 30, curve: 0.3, cols: ['#4a443e', '#2d2925', '#000'], w: 1, op: 0.7 }), 'clip-path="' + k.U('cBodyC') + '"');
    // folded wing
    s += k.p(wing, k.U('cWing'));
    s += k.g(k.scallops(r, { x0: 164, x1: 310, y0: 112, rows: 4, dx: 14, dy: 9, r: 7, fill: '#221f1c', edge: '#57504a', ew: 0.9, eop: 0.45, jit: 3, rowShift: 7 }), 'clip-path="' + k.U('cWingC') + '"');
    // the white wing panel (upper side of the secondaries)
    s += k.p(panel, k.U('cPanel'));
    var pf = '';
    for (i = 0; i < 10; i++) {
      var x = 186 + i * 15;
      pf += 'M' + x + ' ' + (146 + i * 2) + 'C' + (x + 9) + ' ' + (160 + i * 1.5) + ' ' + (x + 18) + ' ' + (176 + i) + ' ' + (x + 24) + ' ' + (196 + i * 0.3);
    }
    s += k.g(k.sp(pf, '#9d978b', 1, 'opacity=".7"') + k.hatch(r, { cx: 255, cy: 172, rx: 80, ry: 20, n: 110, len: 7, ang: 30, jit: 16, cols: ['#c4beb2', '#fff'], w: 0.7, op: 0.7 }), 'clip-path="' + k.U('cPanelC') + '"');
    // ragged lower edge of the panel: tips of the dark feathers below
    var tips = '';
    for (i = 0; i < 9; i++) {
      var tx = 200 + i * 15, ty = 186 + i * 1.6;
      tips += 'M' + tx + ' ' + (ty + 8) + 'Q' + (tx + 4) + ' ' + (ty - 2) + ' ' + (tx + 14) + ' ' + (ty + 2) + 'L' + (tx + 16) + ' ' + (ty + 10) + 'Z';
    }
    s += k.p(tips, '#1a1816');
    // primaries: long black flight feathers crossing over the tail
    for (i = 0; i < 6; i++) {
      s += k.feather(244 + i * 9, 190 + i * 2.5, 128 - i * 11, 9, 16 - i * 1.5, i % 2 ? '#121110' : '#1a1715', '#2c2824');
    }
    s += k.p(wing, k.U('cSheen'));
    s += k.p(body, k.U('cSheen'), 'opacity=".7"');
    // fluffy white ruff
    s += k.p(k.fluff(r, 140, 124, 31, 22, -28, 26, 0.22), k.U('cRuff'));
    s += k.hatch(r, { cx: 140, cy: 124, rx: 26, ry: 18, n: 70, len: 6, ang: 0, angFn: function(x, y) { return Math.atan2(y - 124, x - 140) * 180 / Math.PI + 30; }, jit: 40, curve: 0.5, cols: ['#bdb7ac', '#d8d3ca'], w: 0.8, op: 0.8 });
    s += k.p(k.fluff(r, 150, 136, 20, 7, -25, 12, 0.2), '#a29c90', 'opacity=".35"');
    // bare wrinkled neck and head
    s += k.p('M134 116C124 104 114 96 106 92L90 106C100 114 110 124 122 132Z', k.U('cNeck'));
    s += k.sp('M108 100q5 6 4 13M116 104q4 6 3 12M100 106q5 4 6 9M124 110q3 5 1 10', '#93685f', 1, 'opacity=".7"');
    s += k.el(94, 95, 23, 16, k.U('cHead'), 'transform="rotate(-10 94 95)"');
    // comb (caruncle) of the male
    s += k.p('M70 90C72 79 80 74 89 76C93 69 102 69 106 76C112 75 116 81 112 87C100 85 86 87 70 92Z', '#382624');
    s += k.sp('M75 87C79 81 86 79 92 80C96 76 102 76 106 81', '#6b4a44', 1.3, 'opacity=".8"');
    s += k.sp('M86 103q6 3 13 1M90 109q6 2 13-1M102 88q4 3 9 2', '#2a1c1a', 0.9, 'opacity=".55"');
    // hooked beak
    s += k.p('M76 91C69 91 62 94 57 100C55 104 57 108 60 106C61 103 63 102 66 102C72 102 77 101 80 99Z', k.U('cBeak'));
    s += k.p('M63 103C67 104 74 104 79 101L79 104C74 107 66 107 62 106Z', '#3b3531');
    s += k.sp('M65 95q6-2 12-2', 'rgba(255,255,255,.45)', 0.8);
    s += k.circ(76, 96, 1.3, '#120c0b');
    s += k.eye(91, 92, 3.3, '#6a3a1e', { ring: '#2b1c1a', ringR: 1.5 });
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
    var shadowS = k.shadow(208, 230, 30, 4, 0.7);
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

  return {
    render: render,
    has: function(id) { return !!P[id]; },
    ids: function() { return Object.keys(P); }
  };
})();
