/* ================================================================
   MARINERO — hand-drawn graphics (js/marinero-art.js)

   Everything Marinero shows is drawn here in code: no images.
     • RopeKit  — a 3-strand laid rope renderer for <canvas>. A knot
       is a list of control points per rope; RopeKit splines them,
       finds every crossing, lifts the strand that goes OVER and sinks
       the one that goes UNDER, then paints the rope level by level
       (lowest first) with a cylinder shade, twisted strand grooves,
       glints on each strand, cast shadows and a whipped end.
     • Scenes   — teak deck, a dock piling, a horn cleat, harbour bokeh.
     • Compass  — gimballed marine compass card, bowl and glass dome.
     • Buoys    — IALA buoys floating on animated water.
     • Flags    — International Code of Signals flags as SVG.
     • Chart    — a practice nautical chart of a fictional bay.
   Exposes one global: MarineroArt.
   ================================================================ */

var MarineroArt = (function() {
  'use strict';

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mixC(c1, c2, t) {
    return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
  }
  function rgb(c, a) {
    var r = Math.round(clamp(c[0], 0, 255)), g = Math.round(clamp(c[1], 0, 255)), b = Math.round(clamp(c[2], 0, 255));
    return a == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function shadeC(c, k) {
    if (k <= 1) return [c[0] * k, c[1] * k, c[2] * k];
    var t = k - 1; // toward a warm white
    return mixC(c, [255, 250, 238], clamp(t, 0, 1));
  }
  // Deterministic pseudo-random (so textures never flicker)
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function() {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return (s % 100000) / 100000;
    };
  }

  // Canvas sized for the device's pixel ratio. Returns {ctx,w,h,dpr}.
  function fitCanvas(cv, cssW, cssH, maxDpr) {
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2.5);
    var w = Math.max(1, Math.round(cssW)), h = Math.max(1, Math.round(cssH));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    return { ctx: cv.getContext('2d'), w: w, h: h, dpr: dpr };
  }

  // Draw a blurred shadow of whatever path-building fn produces, without the
  // shape itself: the shape is drawn far off-canvas and only its shadow lands.
  // shadowOffset/shadowBlur ignore the transform, so they are given in device px.
  function castShadow(ctx, devScale, blur, dx, dy, color, buildAndPaint) {
    var FAR = 20000;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * devScale;
    ctx.shadowOffsetX = (FAR + dx) * devScale;
    ctx.shadowOffsetY = dy * devScale;
    ctx.translate(-FAR, 0);
    buildAndPaint(ctx);
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // ROPE KIT
  // ---------------------------------------------------------------
  var ROPE_COLORS = {
    manila: { base: [206, 166, 102], twine: [74, 50, 32],   label: 'Manila' },
    navy:   { base: [44, 66, 118],   twine: [236, 232, 220], label: 'Navy' },
    red:    { base: [176, 50, 42],   twine: [236, 232, 220], label: 'Red' },
    white:  { base: [226, 221, 206], twine: [40, 52, 86],    label: 'White' },
    green:  { base: [52, 118, 80],   twine: [236, 232, 220], label: 'Green' }
  };

  // Light from the upper left, a little in front.
  var LX = -0.48, LY = -0.72, LZ = 0.86;
  (function() { var m = Math.sqrt(LX * LX + LY * LY + LZ * LZ); LX /= m; LY /= m; LZ /= m; })();
  var HX = LX, HY = LY, HZ = LZ + 1;
  (function() { var m = Math.sqrt(HX * HX + HY * HY + HZ * HZ); HX /= m; HY /= m; HZ /= m; })();

  // Centripetal Catmull-Rom through control points [x,y,z?]; z is linear.
  function splineDense(pts, per) {
    var out = [], cps = [0];
    var P = pts.map(function(p) { return { x: p[0], y: p[1], z: p[2] || 0 }; });
    var n = P.length;
    function gp(i) {
      if (i < 0) return { x: 2 * P[0].x - P[1].x, y: 2 * P[0].y - P[1].y, z: P[0].z };
      if (i >= n) return { x: 2 * P[n - 1].x - P[n - 2].x, y: 2 * P[n - 1].y - P[n - 2].y, z: P[n - 1].z };
      return P[i];
    }
    function tj(ti, a, b) {
      var d = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
      return ti + Math.max(Math.sqrt(d), 1e-3);
    }
    for (var i = 0; i < n - 1; i++) {
      var p0 = gp(i - 1), p1 = gp(i), p2 = gp(i + 1), p3 = gp(i + 2);
      var t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
      for (var k = 0; k < per; k++) {
        var t = t1 + (t2 - t1) * (k / per);
        var a1x = (t1 - t) / (t1 - t0) * p0.x + (t - t0) / (t1 - t0) * p1.x;
        var a1y = (t1 - t) / (t1 - t0) * p0.y + (t - t0) / (t1 - t0) * p1.y;
        var a2x = (t2 - t) / (t2 - t1) * p1.x + (t - t1) / (t2 - t1) * p2.x;
        var a2y = (t2 - t) / (t2 - t1) * p1.y + (t - t1) / (t2 - t1) * p2.y;
        var a3x = (t3 - t) / (t3 - t2) * p2.x + (t - t2) / (t3 - t2) * p3.x;
        var a3y = (t3 - t) / (t3 - t2) * p2.y + (t - t2) / (t3 - t2) * p3.y;
        var b1x = (t2 - t) / (t2 - t0) * a1x + (t - t0) / (t2 - t0) * a2x;
        var b1y = (t2 - t) / (t2 - t0) * a1y + (t - t0) / (t2 - t0) * a2y;
        var b2x = (t3 - t) / (t3 - t1) * a2x + (t - t1) / (t3 - t1) * a3x;
        var b2y = (t3 - t) / (t3 - t1) * a2y + (t - t1) / (t3 - t1) * a3y;
        var cx = (t2 - t) / (t2 - t1) * b1x + (t - t1) / (t2 - t1) * b2x;
        var cy = (t2 - t) / (t2 - t1) * b1y + (t - t1) / (t2 - t1) * b2y;
        // smooth z (ease) between control points
        var f = k / per, e = f * f * (3 - 2 * f);
        out.push({ x: cx, y: cy, z: p1.z + (p2.z - p1.z) * e, cp: i + f });
      }
    }
    out.push({ x: P[n - 1].x, y: P[n - 1].y, z: P[n - 1].z, cp: n - 1 });
    return out;
  }

  // Resample a dense polyline to uniform spacing ds. Keeps the control
  // point parameter (cp) so a step can say "up to control point 7.5".
  function resample(dense, ds) {
    var acc = [0];
    for (var i = 1; i < dense.length; i++) {
      var dx = dense[i].x - dense[i - 1].x, dy = dense[i].y - dense[i - 1].y;
      acc.push(acc[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    var L = acc[acc.length - 1];
    var n = Math.max(2, Math.ceil(L / ds) + 1);
    var step = L / (n - 1);
    var X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), CP = new Float32Array(n);
    var j = 0;
    for (var k = 0; k < n; k++) {
      var s = k * step;
      while (j < dense.length - 2 && acc[j + 1] < s) j++;
      var seg = acc[j + 1] - acc[j] || 1;
      var f = clamp((s - acc[j]) / seg, 0, 1);
      X[k] = dense[j].x + (dense[j + 1].x - dense[j].x) * f;
      Y[k] = dense[j].y + (dense[j + 1].y - dense[j].y) * f;
      Z[k] = dense[j].z + (dense[j + 1].z - dense[j].z) * f;
      CP[k] = dense[j].cp + (dense[j + 1].cp - dense[j].cp) * f;
    }
    return { x: X, y: Y, z: Z, cp: CP, n: n, ds: step, L: L };
  }

  function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    var rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
    var den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-9) return null;
    var t = ((cx - ax) * sy - (cy - ay) * sx) / den;
    var u = ((cx - ax) * ry - (cy - ay) * rx) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { t: t, u: u, x: ax + rx * t, y: ay + ry * t };
  }

  /* Build a drawable model from a knot definition:
       def.W        rope diameter (design units)
       def.ropes[]  { pts:[[x,y,zHint]], color, start, end }
       def.ou       one letter per crossing, in the order the rope (or the
                    later rope) reaches it: 'O' over, 'U' under, '-' leave */
  function buildModel(def) {
    var W = def.W || 40;
    var ds = W / 6;
    var ropes = def.ropes.map(function(r, ri) {
      var dense = splineDense(r.pts, 28);
      var rs = resample(dense, ds);
      rs.idx = ri;
      rs.def = r;
      rs.bump = new Float32Array(rs.n);
      return rs;
    });

    // --- crossings ---
    var cr = [];
    var minGap = Math.ceil((W * 2.2) / ds);
    for (var a = 0; a < ropes.length; a++) {
      for (var b = a; b < ropes.length; b++) {
        var A = ropes[a], B = ropes[b];
        for (var i = 0; i < A.n - 1; i++) {
          var ax0 = A.x[i], ay0 = A.y[i], ax1 = A.x[i + 1], ay1 = A.y[i + 1];
          var minx = Math.min(ax0, ax1), maxx = Math.max(ax0, ax1), miny = Math.min(ay0, ay1), maxy = Math.max(ay0, ay1);
          for (var j = (a === b ? i + minGap : 0); j < B.n - 1; j++) {
            var bx0 = B.x[j], by0 = B.y[j], bx1 = B.x[j + 1], by1 = B.y[j + 1];
            if (Math.max(bx0, bx1) < minx || Math.min(bx0, bx1) > maxx || Math.max(by0, by1) < miny || Math.min(by0, by1) > maxy) continue;
            var hit = segIntersect(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1);
            if (!hit) continue;
            var sa = (i + hit.t) * A.ds, sb = (j + hit.u) * B.ds;
            var dup = false;
            for (var q = 0; q < cr.length; q++) {
              var c = cr[q];
              if (c.ra === a && c.rb === b && Math.abs(c.sa - sa) < W * 0.8 && Math.abs(c.sb - sb) < W * 0.8) { dup = true; break; }
            }
            if (dup) continue;
            var tax = ax1 - ax0, tay = ay1 - ay0, tbx = bx1 - bx0, tby = by1 - by0;
            var la = Math.sqrt(tax * tax + tay * tay) || 1, lb = Math.sqrt(tbx * tbx + tby * tby) || 1;
            var sin = Math.abs((tax * tby - tay * tbx) / (la * lb));
            cr.push({ ra: a, rb: b, sa: sa, sb: sb, x: hit.x, y: hit.y, sin: sin });
          }
        }
      }
    }
    // order by when the travelling strand gets there (later rope / later arclength)
    cr.forEach(function(c) { c.key = c.rb * 1e6 + c.sb; });
    cr.sort(function(p, q) { return p.key - q.key; });
    var ou = (def.ou || '').replace(/\s+/g, '');
    cr.forEach(function(c, k) {
      var ch = ou.charAt(k) || 'O';
      c.over = ch === 'O' ? 'b' : ch === 'U' ? 'a' : null;
      c.ch = ch;
      if (!c.over) return;
      var hw = Math.min(W * 3.4, (W * 0.52) / Math.max(c.sin, 0.18) + W * 0.45);
      var fall = W * 0.7;
      [['a', c.ra, c.sa], ['b', c.rb, c.sb]].forEach(function(e) {
        var R = ropes[e[1]], sc = e[2];
        var h = ((c.over === e[0]) ? 1 : -1) * (def.bump == null ? 0.5 : def.bump);
        for (var k2 = 0; k2 < R.n; k2++) {
          var d = Math.abs(k2 * R.ds - sc);
          if (d > hw + fall) continue;
          var w = d < hw ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * (d - hw) / fall);
          var v = h * w;
          if (Math.abs(v) > Math.abs(R.bump[k2])) R.bump[k2] = v;
        }
      });
    });

    // --- per-sample frames: normal, highlight offset, level ---
    ropes.forEach(function(R) {
      R.nx = new Float32Array(R.n); R.ny = new Float32Array(R.n);
      R.vl = new Float32Array(R.n); R.vs = new Float32Array(R.n);
      R.lev = new Int8Array(R.n);
      for (var k = 0; k < R.n; k++) {
        var k0 = Math.max(0, k - 1), k1 = Math.min(R.n - 1, k + 1);
        var tx = R.x[k1] - R.x[k0], ty = R.y[k1] - R.y[k0];
        var m = Math.sqrt(tx * tx + ty * ty) || 1;
        tx /= m; ty /= m;
        var nx = -ty, ny = tx;
        R.nx[k] = nx; R.ny[k] = ny;
        var al = nx * LX + ny * LY;
        R.vl[k] = al / Math.sqrt(al * al + LZ * LZ);
        var ah = nx * HX + ny * HY;
        R.vs[k] = ah / Math.sqrt(ah * ah + HZ * HZ);
        var z = R.z[k] + R.bump[k];
        R.lev[k] = Math.round(z * 2 + 1e-6);
      }
    });

    return { W: W, ropes: ropes, crossings: cr, def: def };
  }

  // arclength for a control-point parameter u (fractional index)
  function sAtCP(R, u) {
    if (u <= 0) return 0;
    var cp = R.cp;
    if (u >= cp[R.n - 1]) return R.L;
    var lo = 0, hi = R.n - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cp[mid] < u) lo = mid; else hi = mid; }
    var f = (u - cp[lo]) / ((cp[hi] - cp[lo]) || 1);
    return (lo + f) * R.ds;
  }

  // Interpolated frame at arclength s
  function frameAt(R, s) {
    var f = clamp(s / R.ds, 0, R.n - 1.0001);
    var i = Math.floor(f), t = f - i;
    var j = Math.min(R.n - 1, i + 1);
    var nx = R.nx[i] + (R.nx[j] - R.nx[i]) * t, ny = R.ny[i] + (R.ny[j] - R.ny[i]) * t;
    var m = Math.sqrt(nx * nx + ny * ny) || 1;
    return {
      x: R.x[i] + (R.x[j] - R.x[i]) * t, y: R.y[i] + (R.y[j] - R.y[i]) * t,
      nx: nx / m, ny: ny / m,
      vl: R.vl[i] + (R.vl[j] - R.vl[i]) * t, vs: R.vs[i] + (R.vs[j] - R.vs[i]) * t
    };
  }

  // Path along samples [i0..i1] (+ exact end point at sEnd), offset sideways by
  // `side` (in units of the radius, multiplied by each sample's light offset).
  function tracePath(ctx, R, i0, i1, sEnd, W, side) {
    var r = W / 2;
    for (var k = i0; k <= i1; k++) {
      var o = side ? R.vl[k] * r * side : 0;
      var px = R.x[k] + R.nx[k] * o, py = R.y[k] + R.ny[k] * o;
      if (k === i0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    if (sEnd != null) {
      var F = frameAt(R, sEnd);
      var o2 = side ? F.vl * r * side : 0;
      ctx.lineTo(F.x + F.nx * o2, F.y + F.ny * o2);
    }
  }

  var TUBE = (function() { // width fraction, shade, sideways shift (radius units)
    var t = [];
    for (var i = 0; i < 10; i++) {
      var f = i / 9;
      var wf = 1 - f * 0.9;
      t.push([wf, 0.34 + 0.9 * Math.pow(f, 0.8), 0.62 * Math.pow(f, 0.9)]);
    }
    return t;
  })();

  function drawTube(ctx, runs, W, base) {
    for (var L = 0; L < TUBE.length; L++) {
      var T = TUBE[L];
      ctx.beginPath();
      for (var q = 0; q < runs.length; q++) {
        var rn = runs[q];
        tracePath(ctx, rn.R, rn.i0, rn.i1, rn.sEnd, W, T[2]);
      }
      ctx.lineWidth = W * T[0];
      ctx.strokeStyle = rgb(shadeC(base, T[1]));
      ctx.stroke();
    }
  }

  // A helix line across the rope at strand phase s0 (a groove or a crown).
  function helixPts(R, s0, P, W, vFrom, vTo, sLo, sHi, steps) {
    var pts = [];
    var r = W / 2 * 0.97;
    var F0 = frameAt(R, s0);
    for (var k = 0; k <= steps; k++) {
      var v = vFrom + (vTo - vFrom) * (k / steps);
      var s = s0 + Math.asin(clamp(v, -1, 1)) * P / (2 * Math.PI);
      if (s < sLo || s > sHi) { pts.push(null); continue; }
      var F = frameAt(R, s);
      // in a tight hairpin the helix would jump across the bend: drop those bits
      if (F.nx * F0.nx + F.ny * F0.ny < 0.55) { pts.push(null); continue; }
      pts.push([F.x + F.nx * v * r, F.y + F.ny * v * r, F]);
    }
    return pts;
  }
  function strokePts(ctx, pts) {
    var started = false;
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      if (!p) { started = false; continue; }
      if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]);
    }
  }

  // Three twisted strands. Each strand is a rounded bundle of yarns, so it is
  // dark where it dives into the groove beside its neighbour and bright on its
  // crown; the crown is lit more on the side that faces the light.
  var STRAND_LINES = [ // phase across one strand (0..1), kind, weight
    [0.08, 'dark', 0.75], [0.92, 'dark', 0.75],
    [0.4, 'lite', 0.6], [0.6, 'lite', 0.6]
  ];

  // Offset copy of the run's centreline, `off` radii to one side.
  function traceOffset(ctx, R, i0, i1, sEnd, W, off) {
    var r = W / 2 * off;
    for (var k = i0; k <= i1; k++) {
      var px = R.x[k] + R.nx[k] * r, py = R.y[k] + R.ny[k] * r;
      if (k === i0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    if (sEnd != null) { var F = frameAt(R, sEnd); ctx.lineTo(F.x + F.nx * r, F.y + F.ny * r); }
  }

  // Strand texture. Drawn with source-atop on the rope layer, so nothing
  // needs to be trimmed to the rope here: lines may run past its edges.
  function drawStrands(ctx, runs, W, base) {
    var P = W * 3.3;          // lay length
    var sp = P / 3;           // one strand per third of a lay
    var dark = shadeC(base, 0.16);
    for (var q = 0; q < runs.length; q++) {
      var rn = runs[q], R = rn.R;
      var sLo = rn.i0 * R.ds - P, sHi = (rn.sEnd != null ? rn.sEnd : rn.i1 * R.ds) + P;
      var g0 = Math.floor(sLo / sp), g1 = Math.ceil(sHi / sp);
      // flanks and crowns of every strand; the flank facing the light is
      // brighter than the one facing away (alpha binned per strand so the
      // shading is the same whichever run draws it)
      STRAND_LINES.forEach(function(Ln) {
        var ph = Ln[0], kind = Ln[1], wt = Ln[2];
        if (kind === 'dark') {
          var bins = [[], [], []];
          for (var g = g0; g <= g1; g++) {
            var Fm = frameAt(R, g * sp + sp * ph);
            var lt = Fm.ny * LX - Fm.nx * LY;
            var fl = clamp(1 + (ph < 0.5 ? -1 : 1) * lt * 1.5, 0.3, 1.8);
            bins[Math.min(2, Math.floor((fl - 0.3) / 0.5))].push(g);
          }
          bins.forEach(function(list, bi) {
            if (!list.length) return;
            ctx.beginPath();
            list.forEach(function(g) { strokePts(ctx, helixPts(R, g * sp + sp * ph, P, W, -1.05, 1.05, sLo, sHi, 7)); });
            ctx.lineWidth = sp * 0.2;
            ctx.strokeStyle = rgb(dark, (0.3 * wt * (0.55 + bi * 0.5)).toFixed(3));
            ctx.stroke();
          });
        } else {
          ctx.beginPath();
          for (var g5 = g0; g5 <= g1; g5++) strokePts(ctx, helixPts(R, g5 * sp + sp * ph, P, W, -1.05, 1.05, sLo, sHi, 7));
          ctx.lineWidth = sp * 0.22;
          ctx.strokeStyle = 'rgba(255,247,228,' + (0.08 * wt).toFixed(3) + ')';
          ctx.stroke();
        }
      });
      // the groove itself
      ctx.beginPath();
      for (var g4 = g0; g4 <= g1; g4++) strokePts(ctx, helixPts(R, g4 * sp, P, W, -1.05, 1.05, sLo, sHi, 8));
      ctx.lineWidth = W * 0.1; ctx.strokeStyle = rgb(dark, 0.5); ctx.stroke();
      ctx.lineWidth = W * 0.038; ctx.strokeStyle = rgb(shadeC(base, 0.08), 0.9); ctx.stroke();
      // yarn / fibre texture: fine lines along each strand, slightly irregular
      ctx.beginPath();
      for (var g2 = g0; g2 <= g1; g2++) {
        var rr = rng(9301 + g2 * 7 + R.idx * 131);
        for (var f = 0; f < 3; f++) {
          var off = sp * (0.15 + rr() * 0.7);
          var vA = -0.95 + rr() * 0.6, vB = vA + 0.45 + rr() * 0.9;
          strokePts(ctx, helixPts(R, g2 * sp + off, P * (0.93 + rr() * 0.14), W, vA, Math.min(0.98, vB), sLo, sHi, 4));
        }
      }
      ctx.lineWidth = Math.max(0.5, W * 0.016); ctx.strokeStyle = rgb(dark, 0.3); ctx.stroke();
      // ambient occlusion along both edges (rounds the rope off)
      ctx.beginPath();
      traceOffset(ctx, R, rn.i0, rn.i1, rn.sEnd, W, 0.92);
      traceOffset(ctx, R, rn.i0, rn.i1, rn.sEnd, W, -0.92);
      ctx.lineWidth = W * 0.26; ctx.strokeStyle = rgb(dark, 0.16); ctx.stroke();
      ctx.lineWidth = W * 0.1; ctx.strokeStyle = rgb(dark, 0.26); ctx.stroke();
      // specular glints: a small soft highlight on each strand crown
      ctx.beginPath();
      for (var g3 = g0; g3 <= g1; g3++) {
        var s0 = g3 * sp + sp * 0.5;
        var F = frameAt(R, s0);
        var v = clamp(F.vs, -0.85, 0.85);
        strokePts(ctx, helixPts(R, s0, P, W, v - 0.17, v + 0.17, sLo, sHi, 3));
      }
      ctx.lineCap = 'round';
      ctx.lineWidth = W * 0.11; ctx.strokeStyle = 'rgba(255,250,236,0.16)'; ctx.stroke();
      ctx.lineWidth = W * 0.05; ctx.strokeStyle = 'rgba(255,253,245,0.45)'; ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }

  function drawFuzz(ctx, runs, W, base) {
    for (var q = 0; q < runs.length; q++) {
      var rn = runs[q], R = rn.R;
      // a little fuzz on the silhouette
      ctx.beginPath();
      for (var k = rn.o0 + (rn.o0 & 1); k < rn.o1; k += 2) {
        var fz = rng(77 + R.idx * 7919 + k * 2654435761);
        var side = fz() < 0.5 ? -1 : 1;
        if (fz() < 0.45) continue;
        var ex = R.x[k] + R.nx[k] * side * W * 0.49, ey = R.y[k] + R.ny[k] * side * W * 0.49;
        var ang = (fz() - 0.5) * 1.6, len = W * (0.04 + fz() * 0.09);
        var dx = R.nx[k] * side, dy = R.ny[k] * side;
        var ca = Math.cos(ang), sa = Math.sin(ang);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + (dx * ca - dy * sa) * len, ey + (dx * sa + dy * ca) * len);
      }
      ctx.lineWidth = Math.max(0.4, W * 0.014); ctx.strokeStyle = rgb(shadeC(base, 0.9), 0.55); ctx.stroke();
    }
  }

  // Whipping (tight turns of twine) near a rope end, plus the cut end.
  function drawEnd(ctx, R, sTip, dir, kind, W, col) {
    var base = col.base;
    if (kind === 'whip' || kind === 'tape') {
      var a = sTip - dir * W * 0.28, b = sTip - dir * W * (kind === 'whip' ? 1.55 : 1.25);
      var s0 = Math.min(a, b), s1 = Math.max(a, b);
      var tw = kind === 'whip' ? col.twine : [28, 30, 36];
      var i0 = Math.max(0, Math.ceil(s0 / R.ds)), i1 = Math.min(R.n - 1, Math.floor(s1 / R.ds));
      if (i1 > i0) {
        for (var L = 0; L < TUBE.length; L++) {
          var T = TUBE[L];
          ctx.beginPath();
          var F0 = frameAt(R, s0), r = W / 2;
          ctx.moveTo(F0.x + F0.nx * F0.vl * r * T[2], F0.y + F0.ny * F0.vl * r * T[2]);
          tracePath(ctx, R, i0, i1, s1, W, T[2]);
          ctx.lineWidth = W * T[0] * 1.06;
          ctx.strokeStyle = rgb(shadeC(tw, kind === 'tape' ? T[1] * 0.9 + (L === 5 ? 0.6 : 0) : T[1]));
          ctx.stroke();
        }
        if (kind === 'whip') {
          // individual turns
          ctx.beginPath();
          for (var s = s0 + W * 0.05; s < s1; s += W * 0.085) {
            var F = frameAt(R, s);
            var sk = W * 0.03;
            ctx.moveTo(F.x - F.nx * W * 0.53 + F.ny * sk, F.y - F.ny * W * 0.53 - F.nx * sk);
            ctx.lineTo(F.x + F.nx * W * 0.53 - F.ny * sk, F.y + F.ny * W * 0.53 + F.nx * sk);
          }
          ctx.lineWidth = Math.max(0.5, W * 0.022);
          ctx.strokeStyle = rgb(shadeC(tw, 0.35), 0.65);
          ctx.stroke();
        }
      }
    }
    // cut end: an end-on face seen slightly from the side
    var E = frameAt(R, sTip);
    var tx = E.ny, ty = -E.nx; // tangent
    if (dir < 0) { tx = -tx; ty = -ty; }
    ctx.save();
    ctx.translate(E.x, E.y);
    ctx.rotate(Math.atan2(ty, tx));
    ctx.beginPath();
    ctx.ellipse(0, 0, W * 0.13, W * 0.5, 0, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = rgb(shadeC(base, 0.78));
    ctx.fill();
    ctx.lineWidth = Math.max(0.5, W * 0.03);
    ctx.strokeStyle = rgb(shadeC(base, 0.4), 0.8);
    ctx.stroke();
    // three strand ends
    ctx.beginPath();
    ctx.moveTo(W * 0.02, -W * 0.18); ctx.quadraticCurveTo(W * 0.11, -W * 0.02, W * 0.02, W * 0.16);
    ctx.lineWidth = Math.max(0.5, W * 0.025);
    ctx.strokeStyle = rgb(shadeC(base, 0.45), 0.7);
    ctx.stroke();
    ctx.restore();
  }

  // ---- scratch layer used to clip strand texture to the rope ----
  var _layer = null;
  function layerFor(ctx, runs, W) {
    var cv = ctx.canvas;
    if (!_layer) _layer = document.createElement('canvas');
    if (_layer.width !== cv.width || _layer.height !== cv.height) { _layer.width = cv.width; _layer.height = cv.height; }
    var lc = _layer.getContext('2d');
    var m = ctx.getTransform ? ctx.getTransform() : null;
    // bounding box of the runs in device pixels
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    runs.forEach(function(rn) {
      var R = rn.R;
      for (var k = rn.i0; k <= rn.i1; k++) {
        if (R.x[k] < x0) x0 = R.x[k]; if (R.x[k] > x1) x1 = R.x[k];
        if (R.y[k] < y0) y0 = R.y[k]; if (R.y[k] > y1) y1 = R.y[k];
      }
    });
    var pad = W * 0.9;
    var a = m ? m.a : 1, d = m ? m.d : 1, e = m ? m.e : 0, f = m ? m.f : 0;
    var bx = Math.max(0, Math.floor((x0 - pad) * a + e)), by = Math.max(0, Math.floor((y0 - pad) * d + f));
    var bw = Math.min(cv.width, Math.ceil((x1 + pad) * a + e)) - bx, bh = Math.min(cv.height, Math.ceil((y1 + pad) * d + f)) - by;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.globalCompositeOperation = 'source-over';
    if (bw > 0 && bh > 0) lc.clearRect(bx, by, bw, bh);
    if (m) lc.setTransform(m); else lc.setTransform(1, 0, 0, 1, 0, 0);
    return { ctx: lc, cv: _layer, x: bx, y: by, w: bw, h: bh };
  }
  function stampLayer(ctx, L) {
    if (L.w <= 0 || L.h <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(L.cv, L.x, L.y, L.w, L.h, L.x, L.y, L.w, L.h);
    ctx.restore();
  }

  /* Paint a model.
     opts.vis[r]     visible arclength of rope r (default whole rope)
     opts.colors[r]  colour key per rope
     opts.devScale   device pixels per design unit (for shadows)
     opts.objects    [{level, draw(ctx)}] drawn among the rope levels
     opts.ground     false to skip the floor shadow */
  function drawModel(ctx, M, opts) {
    var W = M.W;
    var vis = opts.vis || [];
    var levels = {};
    var runsAll = [];
    M.ropes.forEach(function(R, ri) {
      var sv = vis[ri] == null ? R.L : clamp(vis[ri], 0, R.L);
      if (sv < W * 0.3) return;
      var iv = Math.floor(sv / R.ds);
      var start = 0;
      for (var k = 1; k <= iv + 1; k++) {
        if (k > iv || R.lev[k] !== R.lev[start]) {
          var i1 = Math.min(iv, k);
          var run = { R: R, ri: ri, i0: Math.max(0, start - 2), i1: i1, o0: start, o1: i1, sEnd: (k > iv) ? sv : null, lev: R.lev[start] };
          if (run.sEnd == null && i1 < iv) run.i1 = Math.min(iv, i1 + 2);
          if (run.i1 > run.i0 || run.sEnd != null) {
            (levels[run.lev] = levels[run.lev] || []).push(run);
            runsAll.push(run);
          }
          start = k;
        }
      }
      R._sv = sv;
    });
    var objs = (opts.objects || []).slice();
    var keys = Object.keys(levels).map(Number);
    objs.forEach(function(o) { if (keys.indexOf(o.level) < 0) keys.push(o.level); });
    keys.sort(function(a, b) { return a - b; });
    var minLev = keys.length ? keys[0] : 0;
    var dsc = opts.devScale || 1;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';

    // floor shadow
    if (opts.ground !== false && runsAll.length) {
      castShadow(ctx, dsc, W * 0.55, W * 0.22, W * 0.38, 'rgba(20,10,0,0.55)', function(c) {
        c.beginPath();
        runsAll.forEach(function(rn) { tracePath(c, rn.R, rn.i0, rn.i1, rn.sEnd, W, 0); });
        c.lineWidth = W * 0.92; c.lineJoin = 'round'; c.lineCap = 'round';
        c.strokeStyle = '#000'; c.stroke();
      });
    }

    // Shadows are cast only by the part of a strand that actually rides over
    // another one (the core of each crossing), so a strand never darkens its
    // own continuation where it steps down a level.
    var shadowBits = {};
    M.crossings.forEach(function(c) {
      if (!c.over) return;
      var ri = c.over === 'a' ? c.ra : c.rb, sc = c.over === 'a' ? c.sa : c.sb;
      var R = M.ropes[ri];
      if (R._sv == null || sc > R._sv) return;
      var span = Math.min(W * 2.4, (W * 0.55) / Math.max(c.sin, 0.25) + W * 0.2);
      var a = Math.max(0, sc - span), b = Math.min(R._sv, sc + span);
      var k = Math.round(sc / R.ds);
      var lv = R.lev[Math.min(R.n - 1, k)];
      (shadowBits[lv] = shadowBits[lv] || []).push({ R: R, a: a, b: b });
    });

    keys.forEach(function(lv) {
      var runs = levels[lv] || [];
      var sb = shadowBits[lv];
      if (sb && sb.length) {
        castShadow(ctx, dsc, W * 0.34, W * 0.16, W * 0.28, 'rgba(12,6,0,0.78)', function(c) {
          c.beginPath();
          sb.forEach(function(p) {
            var i0 = Math.ceil(p.a / p.R.ds), i1 = Math.floor(p.b / p.R.ds);
            if (i1 > i0) tracePath(c, p.R, i0, i1, null, W, 0);
          });
          c.lineWidth = W * 0.88; c.lineJoin = 'round'; c.lineCap = 'round';
          c.strokeStyle = '#000'; c.stroke();
        });
      }
      // group by rope colour
      var byRope = {};
      runs.forEach(function(rn) { (byRope[rn.ri] = byRope[rn.ri] || []).push(rn); });
      Object.keys(byRope).forEach(function(ri) {
        var col = ROPE_COLORS[(opts.colors && opts.colors[ri]) || M.ropes[ri].def.color || 'manila'] || ROPE_COLORS.manila;
        var group = byRope[ri];
        // Paint tube + strands on a scratch layer so the strand texture is
        // clipped exactly to the rope (source-atop), then stamp it down.
        var L = layerFor(ctx, group, W);
        var lc = L.ctx;
        lc.lineJoin = 'round'; lc.lineCap = 'butt';
        drawTube(lc, group, W, col.base);
        lc.globalCompositeOperation = 'source-atop';
        drawStrands(lc, group, W, col.base);
        lc.globalCompositeOperation = 'source-over';
        group.forEach(function(rn) {
          var R = rn.R, d = R.def;
          if (rn.sEnd != null && d.end !== 'none') {
            var kL = Math.max(0, Math.floor(rn.sEnd / R.ds) - 1);
            if (R.lev[kL] === lv) drawEnd(lc, R, rn.sEnd, 1, d.end || 'whip', W, col);
          }
          if (rn.i0 === 0 && d.start && d.start !== 'none') drawEnd(lc, R, 0, -1, d.start, W, col);
        });
        stampLayer(ctx, L);
        drawFuzz(ctx, group, W, col.base);
      });
      objs.forEach(function(o) {
        if (o.level !== lv) return;
        o.draw(ctx);
        // rope that lies on top of the object darkens it (clipped to its shape)
        if (o.clip) {
          var above = runsAll.filter(function(rn) { return rn.lev > lv; });
          if (!above.length) return;
          ctx.save();
          ctx.beginPath(); o.clip(ctx); ctx.clip();
          castShadow(ctx, dsc, W * 0.4, W * 0.18, W * 0.3, 'rgba(10,5,0,0.6)', function(c) {
            c.beginPath();
            above.forEach(function(rn) { tracePath(c, rn.R, rn.o0, rn.o1, rn.sEnd, W, 0); });
            c.lineWidth = W * 0.85; c.lineJoin = 'round'; c.lineCap = 'round';
            c.strokeStyle = '#000'; c.stroke();
          });
          ctx.restore();
        }
      });
    });

    if (opts.debug) drawDebug(ctx, M);
  }

  function drawDebug(ctx, M) {
    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    M.ropes.forEach(function(R) {
      R.def.pts.forEach(function(p, i) {
        ctx.fillStyle = 'rgba(0,80,255,0.85)';
        ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText(String(i), p[0] + 5, p[1] - 5); ctx.fillText(String(i), p[0] + 5, p[1] - 5);
      });
    });
    M.crossings.forEach(function(c, k) {
      ctx.fillStyle = c.ch === 'O' ? '#0a0' : c.ch === 'U' ? '#d00' : '#888';
      ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(k + c.ch, c.x - 9, c.y + 5);
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------
  // SCENES behind the knots (cached per size)
  // ---------------------------------------------------------------
  var _bgCache = {};

  function teakDeck(w, h, dpr) {
    var key = 'teak' + w + 'x' + h + '@' + dpr;
    if (_bgCache[key]) return _bgCache[key];
    var cv = document.createElement('canvas');
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var R = rng(7);
    var plank = Math.max(34, Math.round(h / 7.5));
    var seam = Math.max(2, plank * 0.07);
    c.fillStyle = '#1b130d';
    c.fillRect(0, 0, w, h);
    for (var y = -plank * 0.4, row = 0; y < h; y += plank, row++) {
      // planks are long; stagger the butt joints
      var x = -R() * w * 0.6;
      while (x < w) {
        var len = w * (0.7 + R() * 0.8);
        var hue = 0.85 + R() * 0.25;
        var g = c.createLinearGradient(0, y, 0, y + plank);
        var cBase = [150 * hue, 96 * hue, 52 * hue];
        g.addColorStop(0, rgb(shadeC(cBase, 1.1)));
        g.addColorStop(0.5, rgb(cBase));
        g.addColorStop(1, rgb(shadeC(cBase, 0.82)));
        c.fillStyle = g;
        c.fillRect(x + seam * 0.5, y + seam * 0.5, len - seam, plank - seam);
        // grain
        c.save();
        c.beginPath(); c.rect(x + seam * 0.5, y + seam * 0.5, len - seam, plank - seam); c.clip();
        var lines = 9 + Math.floor(R() * 6);
        for (var gI = 0; gI < lines; gI++) {
          var gy = y + plank * (0.08 + 0.84 * R());
          var amp = plank * (0.02 + R() * 0.07), fr = 0.004 + R() * 0.01, ph = R() * 6;
          c.beginPath();
          for (var gx = x; gx <= x + len; gx += 6) {
            var yy = gy + Math.sin(gx * fr + ph) * amp + Math.sin(gx * fr * 3.1 + ph) * amp * 0.3;
            if (gx === x) c.moveTo(gx, yy); else c.lineTo(gx, yy);
          }
          c.lineWidth = 0.6 + R() * 1.6;
          c.strokeStyle = R() < 0.6 ? 'rgba(70,38,16,' + (0.12 + R() * 0.22) + ')' : 'rgba(230,180,120,' + (0.06 + R() * 0.1) + ')';
          c.stroke();
        }
        // tiny pores
        c.fillStyle = 'rgba(60,30,10,0.18)';
        for (var pI = 0; pI < len / 9; pI++) c.fillRect(x + R() * len, y + R() * plank, 1.6, 0.7);
        c.restore();
        // butt joint
        c.fillStyle = '#1b130d';
        c.fillRect(x + len - seam * 0.5, y, seam, plank);
        x += len;
      }
      // caulking highlight line
      c.fillStyle = 'rgba(255,220,170,0.07)';
      c.fillRect(0, y + plank - seam * 0.5 + seam, w, 1);
    }
    // weathering: soft light from top-left, vignette
    var lg = c.createRadialGradient(w * 0.25, h * 0.1, 10, w * 0.4, h * 0.3, Math.max(w, h) * 0.95);
    lg.addColorStop(0, 'rgba(255,230,190,0.18)');
    lg.addColorStop(0.55, 'rgba(255,230,190,0)');
    lg.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = lg; c.fillRect(0, 0, w, h);
    _bgCache[key] = cv;
    return cv;
  }

  function harbourBokeh(w, h, dpr) {
    var key = 'harb' + w + 'x' + h + '@' + dpr;
    if (_bgCache[key]) return _bgCache[key];
    var cv = document.createElement('canvas');
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#9cc3dc');
    g.addColorStop(0.34, '#cfe0e6');
    g.addColorStop(0.36, '#6f9aa8');
    g.addColorStop(0.7, '#2f6276');
    g.addColorStop(1, '#173a4b');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // distant hills (out of focus)
    c.fillStyle = 'rgba(90,120,110,0.55)';
    c.beginPath(); c.moveTo(0, h * 0.35);
    for (var x = 0; x <= w; x += 20) c.lineTo(x, h * 0.35 - (Math.sin(x * 0.006) * 0.5 + 0.6) * h * 0.08 - Math.sin(x * 0.017) * h * 0.02);
    c.lineTo(w, h * 0.36); c.lineTo(0, h * 0.36); c.fill();
    var R = rng(11);
    // soft water sparkles (bokeh discs)
    for (var i = 0; i < 70; i++) {
      var bx = R() * w, by = h * (0.38 + R() * 0.6), br = 4 + R() * (h * 0.04);
      var rg = c.createRadialGradient(bx, by, 0, bx, by, br);
      rg.addColorStop(0, 'rgba(255,255,240,' + (0.08 + R() * 0.25) + ')');
      rg.addColorStop(1, 'rgba(255,255,240,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill();
    }
    for (var j = 0; j < 40; j++) {
      var wy = h * (0.4 + R() * 0.58);
      c.fillStyle = 'rgba(200,230,240,' + (0.04 + R() * 0.08) + ')';
      c.fillRect(R() * w, wy, 30 + R() * 120, 1.5 + R() * 2);
    }
    var v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,10,20,0.35)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
    _bgCache[key] = cv;
    return cv;
  }

  // A weathered wooden dock piling (front view), x = centre, r = radius.
  function drawPiling(ctx, x, top, bottom, r, devScale) {
    castShadow(ctx, devScale, r * 0.5, r * 0.25, r * 0.1, 'rgba(0,0,0,0.35)', function(c) {
      c.fillStyle = '#000'; c.fillRect(x - r, top, r * 2, bottom - top);
    });
    var g = ctx.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, '#3b2a1e');
    g.addColorStop(0.18, '#7a6048');
    g.addColorStop(0.42, '#a68a6a');
    g.addColorStop(0.62, '#8b7055');
    g.addColorStop(0.88, '#4d3a2a');
    g.addColorStop(1, '#2a1d14');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, top, r * 2, bottom - top);
    // grain and cracks
    var R = rng(3);
    ctx.save();
    ctx.beginPath(); ctx.rect(x - r, top, r * 2, bottom - top); ctx.clip();
    for (var i = 0; i < 26; i++) {
      var gx = x - r + R() * r * 2;
      var edge = Math.abs(gx - x) / r;
      ctx.beginPath();
      ctx.moveTo(gx, top);
      for (var yy = top; yy < bottom; yy += 30) ctx.lineTo(gx + Math.sin(yy * 0.01 + i) * 3 * (1 - edge), yy);
      ctx.lineWidth = 0.8 + R() * 2.2;
      ctx.strokeStyle = R() < 0.65 ? 'rgba(40,26,16,' + (0.18 + R() * 0.3) + ')' : 'rgba(220,200,170,' + (0.08 + R() * 0.12) + ')';
      ctx.stroke();
    }
    // a couple of deep checks (cracks)
    for (var k = 0; k < 3; k++) {
      var cx = x - r * 0.5 + R() * r, cy = top + R() * (bottom - top) * 0.7;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + 3, cy + 60, cx - 2, cy + 120, cx + 2, cy + 180);
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(20,12,6,0.55)'; ctx.stroke();
    }
    ctx.restore();
    // rounded, weathered top (end grain)
    ctx.beginPath();
    ctx.ellipse(x, top, r, r * 0.28, 0, 0, Math.PI * 2);
    var tg = ctx.createRadialGradient(x - r * 0.3, top - r * 0.1, 2, x, top, r);
    tg.addColorStop(0, '#c8b393'); tg.addColorStop(0.7, '#9a8064'); tg.addColorStop(1, '#5a4532');
    ctx.fillStyle = tg; ctx.fill();
    for (var ring = 1; ring < 6; ring++) {
      ctx.beginPath();
      ctx.ellipse(x + 2, top, r * ring / 6.5, r * 0.28 * ring / 6.5, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(80,55,35,0.35)'; ctx.stroke();
    }
    // light rim
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x - r * 0.35, top, r * 0.2, bottom - top);
  }

  // Shading strip that wraps rope contact shadows around the piling edges.
  function drawPilingEdgeShade(ctx, x, top, bottom, r) {
    var g = ctx.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(0.12, 'rgba(0,0,0,0)');
    g.addColorStop(0.88, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, top, r * 2, bottom - top);
  }

  // A cast-aluminium horn cleat seen from above. cx,cy centre; len along x.
  function cleatPath(ctx, cx, cy, len, wid) {
    var hl = len / 2, hw = wid / 2;
    ctx.beginPath();
    ctx.moveTo(cx - hl, cy);
    ctx.bezierCurveTo(cx - hl, cy - hw * 0.55, cx - hl * 0.7, cy - hw * 0.62, cx - hl * 0.42, cy - hw * 0.72);
    ctx.bezierCurveTo(cx - hl * 0.25, cy - hw * 1.15, cx + hl * 0.25, cy - hw * 1.15, cx + hl * 0.42, cy - hw * 0.72);
    ctx.bezierCurveTo(cx + hl * 0.7, cy - hw * 0.62, cx + hl, cy - hw * 0.55, cx + hl, cy);
    ctx.bezierCurveTo(cx + hl, cy + hw * 0.55, cx + hl * 0.7, cy + hw * 0.62, cx + hl * 0.42, cy + hw * 0.72);
    ctx.bezierCurveTo(cx + hl * 0.25, cy + hw * 1.15, cx - hl * 0.25, cy + hw * 1.15, cx - hl * 0.42, cy + hw * 0.72);
    ctx.bezierCurveTo(cx - hl * 0.7, cy + hw * 0.62, cx - hl, cy + hw * 0.55, cx - hl, cy);
    ctx.closePath();
  }
  function drawCleat(ctx, cx, cy, len, wid, devScale) {
    castShadow(ctx, devScale, wid * 0.4, wid * 0.25, wid * 0.42, 'rgba(10,5,0,0.6)', function(c) {
      cleatPath(c, cx, cy, len, wid); c.fillStyle = '#000'; c.fill();
    });
    // base plate (feet) under the body
    ctx.beginPath();
    ctx.ellipse(cx, cy, len * 0.22, wid * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5d646b'; ctx.fill();
    cleatPath(ctx, cx, cy, len, wid);
    var g = ctx.createLinearGradient(cx, cy - wid * 0.6, cx, cy + wid * 0.6);
    g.addColorStop(0, '#f4f6f7');
    g.addColorStop(0.28, '#c5cbd0');
    g.addColorStop(0.5, '#8e979e');
    g.addColorStop(0.72, '#b7bec4');
    g.addColorStop(1, '#5c646b');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(40,45,50,0.7)'; ctx.stroke();
    // ridge highlight along the top of the horns
    ctx.beginPath();
    ctx.moveTo(cx - len * 0.47, cy - wid * 0.05);
    ctx.bezierCurveTo(cx - len * 0.2, cy - wid * 0.22, cx + len * 0.2, cy - wid * 0.22, cx + len * 0.47, cy - wid * 0.05);
    ctx.lineWidth = wid * 0.12; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
    ctx.lineCap = 'butt';
    // two bolt heads
    [-1, 1].forEach(function(s) {
      var bx = cx + s * len * 0.13, by = cy;
      var bg = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, wid * 0.16);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#6b737a');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, wid * 0.15, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(30,30,30,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - wid * 0.09, by); ctx.lineTo(bx + wid * 0.09, by);
      ctx.strokeStyle = 'rgba(30,30,30,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    });
  }


  // ---------------------------------------------------------------
  // MARINE COMPASS
  // ---------------------------------------------------------------
  var POINTS16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  // The card: ivory, black graduations, red north. letters: 'all'|'cardinal'|'north'
  function compassCard(d, dpr, letters) {
    var key = 'card' + d + '@' + dpr + letters;
    if (_bgCache[key]) return _bgCache[key];
    var cv = document.createElement('canvas');
    cv.width = cv.height = Math.round(d * dpr);
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var r = d / 2;
    c.translate(r, r);
    // card face
    var g = c.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#fbf6e8'); g.addColorStop(0.75, '#efe5cb'); g.addColorStop(1, '#d9caa3');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    // outer graduation band
    c.strokeStyle = '#1b1b1b';
    c.lineWidth = Math.max(1, r * 0.012);
    c.beginPath(); c.arc(0, 0, r * 0.97, 0, 7); c.stroke();
    c.beginPath(); c.arc(0, 0, r * 0.8, 0, 7); c.stroke();
    for (var deg = 0; deg < 360; deg++) {
      var a = deg * Math.PI / 180;
      var len = deg % 10 === 0 ? 0.11 : deg % 5 === 0 ? 0.075 : 0.045;
      c.lineWidth = deg % 10 === 0 ? Math.max(1, r * 0.012) : Math.max(0.6, r * 0.006);
      c.beginPath();
      c.moveTo(Math.sin(a) * r * 0.97, -Math.cos(a) * r * 0.97);
      c.lineTo(Math.sin(a) * r * (0.97 - len), -Math.cos(a) * r * (0.97 - len));
      c.stroke();
    }
    // degree numbers every 30
    c.fillStyle = '#1b1b1b';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '700 ' + Math.round(r * 0.075) + 'px Nunito, system-ui, sans-serif';
    for (var dn = 0; dn < 360; dn += 30) {
      if (dn % 90 === 0) continue;
      c.save();
      c.rotate(dn * Math.PI / 180);
      c.fillText(String(dn).padStart(3, '0'), 0, -r * 0.765);
      c.restore();
    }
    // compass rose: 16-point star
    function starPoint(ang, len, wid, light, dark) {
      c.save(); c.rotate(ang);
      c.beginPath(); c.moveTo(0, -len); c.lineTo(wid, 0); c.lineTo(0, 0); c.closePath();
      c.fillStyle = light; c.fill();
      c.beginPath(); c.moveTo(0, -len); c.lineTo(-wid, 0); c.lineTo(0, 0); c.closePath();
      c.fillStyle = dark; c.fill();
      c.restore();
    }
    for (var i = 0; i < 16; i++) {
      if (i % 2) starPoint(i * Math.PI / 8, r * 0.38, r * 0.035, '#c9b27a', '#8c6f35');
    }
    for (var j = 0; j < 8; j++) {
      if (j % 2) starPoint(j * Math.PI / 4, r * 0.5, r * 0.06, '#2f4f86', '#16294f');
    }
    for (var k = 0; k < 4; k++) {
      starPoint(k * Math.PI / 2, r * 0.66, r * 0.09, k === 0 ? '#e0473a' : '#2a447a', k === 0 ? '#9c1f17' : '#0f1f3d');
    }
    c.beginPath(); c.arc(0, 0, r * 0.08, 0, 7);
    var hub = c.createRadialGradient(-r * 0.02, -r * 0.03, 1, 0, 0, r * 0.08);
    hub.addColorStop(0, '#fff3c4'); hub.addColorStop(0.6, '#c9a24a'); hub.addColorStop(1, '#7a5a1c');
    c.fillStyle = hub; c.fill();
    // letters
    var L = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
    var L2 = [['NE', 45], ['SE', 135], ['SW', 225], ['NW', 315]];
    if (letters !== 'none') {
      c.font = '800 ' + Math.round(r * 0.13) + 'px "Baloo 2", Nunito, sans-serif';
      L.forEach(function(l) {
        if (letters === 'north' && l[0] !== 'N') return;
        c.save(); c.rotate(l[1] * Math.PI / 180);
        c.fillStyle = l[0] === 'N' ? '#b3261e' : '#1b1b1b';
        c.fillText(l[0], 0, -r * 0.89 + r * 0.12 + r * 0.005);
        c.restore();
      });
      if (letters === 'all') {
        c.font = '800 ' + Math.round(r * 0.075) + 'px "Baloo 2", Nunito, sans-serif';
        L2.forEach(function(l) {
          c.save(); c.rotate(l[1] * Math.PI / 180);
          c.fillStyle = '#1b1b1b';
          c.fillText(l[0], 0, -r * 0.71);
          c.restore();
        });
      }
    }
    _bgCache[key] = cv;
    return cv;
  }

  /* drawCompass(ctx, cx, cy, R, heading, opts)
     heading in degrees: the card turns so this bearing sits under the lubber line.
     opts.tilt (0..1) small gimbal wobble, opts.letters, opts.pointer (deg, drawn
     over a north-up card), opts.target (deg, a brass course marker on the bezel),
     opts.dpr */
  function drawCompass(ctx, cx, cy, R, heading, opts) {
    opts = opts || {};
    var dpr = opts.dpr || 1;
    // drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = R * 0.12 * dpr;
    ctx.shadowOffsetY = R * 0.05 * dpr;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = '#6b4c16'; ctx.fill();
    ctx.restore();
    // gimbal ring (outer)
    var brass = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    brass.addColorStop(0, '#fff0b8'); brass.addColorStop(0.25, '#d9ab48'); brass.addColorStop(0.5, '#8f6420');
    brass.addColorStop(0.75, '#d6a443'); brass.addColorStop(1, '#5e3e10');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2, true);
    ctx.fillStyle = brass; ctx.fill();
    ctx.lineWidth = Math.max(1, R * 0.01); ctx.strokeStyle = 'rgba(60,35,5,0.7)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, 7); ctx.stroke();
    // gimbal pivots at 3 and 9 o'clock
    [-1, 1].forEach(function(sd) {
      var px = cx + sd * R * 0.95;
      var pg = ctx.createRadialGradient(px - R * 0.02, cy - R * 0.03, 1, px, cy, R * 0.07);
      pg.addColorStop(0, '#fff7d6'); pg.addColorStop(0.5, '#c99a3c'); pg.addColorStop(1, '#5a3b0e');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, cy, R * 0.065, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(50,30,5,0.8)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, cy, R * 0.02, 0, 7); ctx.fillStyle = '#3d2806'; ctx.fill();
    });
    // bowl rim (inner brass bezel)
    var rim = ctx.createLinearGradient(cx, cy - R * 0.9, cx, cy + R * 0.9);
    rim.addColorStop(0, '#f7dc8c'); rim.addColorStop(0.5, '#a87a2a'); rim.addColorStop(1, '#e7c066');
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2); ctx.arc(cx, cy, R * 0.79, 0, Math.PI * 2, true);
    ctx.fillStyle = rim; ctx.fill();
    // bezel graduations (fixed, every 10°)
    ctx.strokeStyle = 'rgba(70,40,5,0.75)';
    for (var b = 0; b < 360; b += 10) {
      var ba = b * Math.PI / 180;
      ctx.lineWidth = b % 90 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.sin(ba) * R * 0.85, cy - Math.cos(ba) * R * 0.85);
      ctx.lineTo(cx + Math.sin(ba) * R * (b % 90 === 0 ? 0.8 : 0.82), cy - Math.cos(ba) * R * (b % 90 === 0 ? 0.8 : 0.82));
      ctx.stroke();
    }
    // target marker on the bezel
    if (opts.target != null) {
      var ta = opts.target * Math.PI / 180;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ta - heading * Math.PI / 180);
      ctx.beginPath(); ctx.moveTo(0, -R * 0.795); ctx.lineTo(-R * 0.05, -R * 0.885); ctx.lineTo(R * 0.05, -R * 0.885); ctx.closePath();
      ctx.fillStyle = '#16a34a'; ctx.fill(); ctx.strokeStyle = '#064e1f'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    // bowl interior (dark, deep)
    var bowl = ctx.createRadialGradient(cx, cy - R * 0.1, R * 0.2, cx, cy, R * 0.79);
    bowl.addColorStop(0, '#1d2a36'); bowl.addColorStop(1, '#05080b');
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, 0, 7); ctx.fillStyle = bowl; ctx.fill();
    // card
    var cr = R * 0.72;
    var card = compassCard(Math.round(cr * 2), dpr, opts.letters || 'all');
    ctx.save();
    ctx.translate(cx, cy);
    var tilt = opts.tilt || 0;
    ctx.scale(1, 1 - Math.abs(tilt) * 0.06);
    ctx.translate(0, tilt * R * 0.02);
    ctx.rotate(-heading * Math.PI / 180);
    ctx.drawImage(card, -cr, -cr, cr * 2, cr * 2);
    ctx.restore();
    // shadow of the rim on the card
    var sh = ctx.createRadialGradient(cx, cy, cr * 0.82, cx, cy, R * 0.79);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.7, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, 0, 7); ctx.fillStyle = sh; ctx.fill();
    // pointer (for naming directions)
    if (opts.pointer != null) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(opts.pointer * Math.PI / 180);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = R * 0.04 * dpr; ctx.shadowOffsetY = R * 0.02 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, -cr * 0.93); ctx.lineTo(cr * 0.07, -cr * 0.2); ctx.lineTo(cr * 0.03, cr * 0.2);
      ctx.lineTo(-cr * 0.03, cr * 0.2); ctx.lineTo(-cr * 0.07, -cr * 0.2); ctx.closePath();
      var pg2 = ctx.createLinearGradient(-cr * 0.07, 0, cr * 0.07, 0);
      pg2.addColorStop(0, '#ff7a3d'); pg2.addColorStop(0.5, '#ffb14a'); pg2.addColorStop(1, '#b8420f');
      ctx.fillStyle = pg2; ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#6b2205'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, cr * 0.09, 0, 7);
      ctx.fillStyle = '#e8c15a'; ctx.fill(); ctx.strokeStyle = '#6b4a0e'; ctx.stroke();
      ctx.restore();
    }
    // lubber line (fixed, at the top = the boat's bow)
    if (opts.lubber !== false) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3 * dpr; ctx.shadowOffsetY = 1 * dpr;
      ctx.fillStyle = '#e23a2e';
      ctx.fillRect(cx - R * 0.012, cy - R * 0.8, R * 0.024, R * 0.17);
      ctx.beginPath(); ctx.moveTo(cx, cy - R * 0.6); ctx.lineTo(cx - R * 0.035, cy - R * 0.66); ctx.lineTo(cx + R * 0.035, cy - R * 0.66); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // glass dome: tint, reflections, glint
    var dome = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx, cy, R * 0.8);
    dome.addColorStop(0, 'rgba(255,255,255,0.10)'); dome.addColorStop(0.6, 'rgba(180,210,230,0.04)'); dome.addColorStop(1, 'rgba(120,160,190,0.18)');
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, 0, 7); ctx.fillStyle = dome; ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.79, 0, 7); ctx.clip();
    // big soft window reflection, upper left
    ctx.beginPath();
    ctx.ellipse(cx - R * 0.32, cy - R * 0.38, R * 0.36, R * 0.17, -0.6, 0, 7);
    var wr = ctx.createLinearGradient(cx - R * 0.6, cy - R * 0.6, cx - R * 0.1, cy - R * 0.2);
    wr.addColorStop(0, 'rgba(255,255,255,0.42)'); wr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wr; ctx.fill();
    // curved rim highlight
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, Math.PI * 1.08, Math.PI * 1.42);
    ctx.lineWidth = R * 0.025; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, Math.PI * 0.12, Math.PI * 0.28);
    ctx.lineWidth = R * 0.012; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
    // sharp glint
    var gl = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.45, 0, cx - R * 0.45, cy - R * 0.45, R * 0.06);
    gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - R * 0.55, cy - R * 0.55, R * 0.2, R * 0.2);
    ctx.restore();
    ctx.lineCap = 'butt';
  }

  // A teak ship's wheel with brass hub. angle in radians.
  function drawWheel(ctx, cx, cy, R, angle, dpr) {
    dpr = dpr || 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = R * 0.08 * dpr; ctx.shadowOffsetY = R * 0.05 * dpr;
    ctx.rotate(angle);
    var n = 8;
    // spokes with turned handles
    for (var i = 0; i < n; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI * 2 / n);
      var g = ctx.createLinearGradient(-R * 0.05, 0, R * 0.05, 0);
      g.addColorStop(0, '#3e2210'); g.addColorStop(0.4, '#b0723c'); g.addColorStop(0.6, '#c98a4c'); g.addColorStop(1, '#4a2a12');
      ctx.fillStyle = g;
      // spoke inside the rim
      ctx.beginPath();
      ctx.moveTo(-R * 0.035, -R * 0.12); ctx.lineTo(R * 0.035, -R * 0.12);
      ctx.lineTo(R * 0.028, -R * 0.74); ctx.lineTo(-R * 0.028, -R * 0.74); ctx.closePath(); ctx.fill();
      // handle beyond the rim: bulb shapes
      ctx.beginPath();
      ctx.moveTo(-R * 0.03, -R * 0.8);
      ctx.bezierCurveTo(-R * 0.06, -R * 0.86, -R * 0.065, -R * 0.93, -R * 0.04, -R * 0.97);
      ctx.quadraticCurveTo(0, -R * 1.02, R * 0.04, -R * 0.97);
      ctx.bezierCurveTo(R * 0.065, -R * 0.93, R * 0.06, -R * 0.86, R * 0.03, -R * 0.8);
      ctx.closePath(); ctx.fill();
      if (i === 0) { // king spoke: brass band
        ctx.fillStyle = '#e2b54e';
        ctx.fillRect(-R * 0.045, -R * 0.9, R * 0.09, R * 0.035);
      }
      ctx.restore();
    }
    ctx.shadowColor = 'transparent';
    // rim
    var rg = ctx.createRadialGradient(0, 0, R * 0.68, 0, 0, R * 0.82);
    rg.addColorStop(0, '#4a2810'); rg.addColorStop(0.35, '#b77840'); rg.addColorStop(0.6, '#8a5427'); rg.addColorStop(1, '#3a1e0a');
    ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2); ctx.arc(0, 0, R * 0.68, 0, Math.PI * 2, true);
    ctx.fillStyle = rg; ctx.fill();
    ctx.strokeStyle = 'rgba(25,12,3,0.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.68, 0, 7); ctx.stroke();
    // wood grain on the rim
    for (var k = 0; k < 3; k++) {
      ctx.beginPath(); ctx.arc(0, 0, R * (0.71 + k * 0.04), 0, 7);
      ctx.strokeStyle = 'rgba(40,20,5,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    }
    // brass hub
    var hg = ctx.createRadialGradient(-R * 0.04, -R * 0.05, 1, 0, 0, R * 0.16);
    hg.addColorStop(0, '#fff2bf'); hg.addColorStop(0.5, '#d4a640'); hg.addColorStop(1, '#6e4a10');
    ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, 7); ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,5,0.8)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.07, 0, 7); ctx.fillStyle = '#8a6118'; ctx.fill();
    ctx.restore();
  }


  // ---------------------------------------------------------------
  // SEA, HARBOUR AND BUOYS
  // ---------------------------------------------------------------
  var TAU = Math.PI * 2;

  // Static part of the harbour view (sky, clouds, coast, town, lighthouse).
  function harbourBackdrop(w, h, dpr, hz) {
    var key = 'hb' + w + 'x' + h + '@' + dpr + ':' + hz;
    if (_bgCache[key]) return _bgCache[key];
    var cv = document.createElement('canvas');
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var H = h * hz;
    var sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5f9cc9'); sky.addColorStop(0.7, '#b9d7e8'); sky.addColorStop(1, '#e4eef0');
    c.fillStyle = sky; c.fillRect(0, 0, w, H + 2);
    var R = rng(5);
    // clouds: clusters of soft puffs
    for (var cl = 0; cl < 5; cl++) {
      var cx = R() * w, cy = H * (0.15 + R() * 0.45), sz = w * (0.05 + R() * 0.06);
      for (var pf = 0; pf < 7; pf++) {
        var px = cx + (R() - 0.5) * sz * 2.4, py = cy + (R() - 0.5) * sz * 0.5, pr = sz * (0.4 + R() * 0.5);
        var g = c.createRadialGradient(px, py - pr * 0.3, pr * 0.1, px, py, pr);
        g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.6, 'rgba(250,252,255,0.45)'); g.addColorStop(1, 'rgba(240,246,250,0)');
        c.fillStyle = g; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
      }
    }
    // far mountains (Andes-blue haze)
    c.fillStyle = 'rgba(120,150,175,0.7)';
    c.beginPath(); c.moveTo(0, H);
    for (var x = 0; x <= w; x += 8) c.lineTo(x, H - h * 0.09 - Math.sin(x * 0.011) * h * 0.025 - Math.sin(x * 0.031 + 1) * h * 0.012);
    c.lineTo(w, H); c.fill();
    // nearer coastal hills (green-brown)
    var hills = c.createLinearGradient(0, H - h * 0.08, 0, H);
    hills.addColorStop(0, '#6f8a52'); hills.addColorStop(1, '#3f5a35');
    c.fillStyle = hills;
    c.beginPath(); c.moveTo(0, H);
    for (var x2 = 0; x2 <= w * 0.62; x2 += 6) c.lineTo(x2, H - h * 0.055 - Math.sin(x2 * 0.02) * h * 0.012 - (x2 < w * 0.1 ? (w * 0.1 - x2) * 0.15 : 0));
    c.lineTo(w * 0.62, H); c.fill();
    // headland with lighthouse on the right
    c.beginPath(); c.moveTo(w * 0.72, H);
    c.quadraticCurveTo(w * 0.8, H - h * 0.07, w * 0.9, H - h * 0.075);
    c.lineTo(w, H - h * 0.08); c.lineTo(w, H); c.fill();
    // rocks at the headland foot
    c.fillStyle = '#4a4740';
    for (var rk = 0; rk < 9; rk++) {
      var rx = w * (0.73 + rk * 0.03), rw = w * 0.025 * (0.6 + R());
      c.beginPath(); c.ellipse(rx, H, rw, h * 0.008 * (0.8 + R()), 0, Math.PI, 0); c.fill();
    }
    // lighthouse (white tower, red lantern room)
    var lx = w * 0.87, ly = H - h * 0.075, lh = h * 0.085, lw = w * 0.012;
    var lg = c.createLinearGradient(lx - lw, 0, lx + lw, 0);
    lg.addColorStop(0, '#bfc4c6'); lg.addColorStop(0.4, '#ffffff'); lg.addColorStop(1, '#9da3a6');
    c.fillStyle = lg;
    c.beginPath(); c.moveTo(lx - lw, ly); c.lineTo(lx - lw * 0.7, ly - lh); c.lineTo(lx + lw * 0.7, ly - lh); c.lineTo(lx + lw, ly); c.fill();
    c.fillStyle = '#b3261e'; c.fillRect(lx - lw * 0.75, ly - lh * 0.55, lw * 1.5, lh * 0.12);
    c.fillStyle = '#2b2b2b'; c.fillRect(lx - lw * 0.85, ly - lh - lw * 0.3, lw * 1.7, lw * 0.35);
    c.fillStyle = '#fff6b0'; c.fillRect(lx - lw * 0.5, ly - lh - lw * 1.1, lw, lw * 0.8);
    c.fillStyle = '#b3261e';
    c.beginPath(); c.moveTo(lx - lw * 0.7, ly - lh - lw * 1.1); c.lineTo(lx, ly - lh - lw * 1.9); c.lineTo(lx + lw * 0.7, ly - lh - lw * 1.1); c.fill();
    // little town: white houses with red/ochre roofs on the left hills
    for (var hs = 0; hs < 22; hs++) {
      var hx = w * (0.08 + R() * 0.4), hy = H - h * (0.012 + R() * 0.035), hw = w * (0.008 + R() * 0.008);
      c.fillStyle = R() < 0.7 ? '#f3f0e6' : '#e8d9b5';
      c.fillRect(hx, hy - hw * 0.7, hw, hw * 0.7);
      c.fillStyle = R() < 0.5 ? '#a8432c' : '#c27a3a';
      c.beginPath(); c.moveTo(hx - hw * 0.1, hy - hw * 0.7); c.lineTo(hx + hw * 0.5, hy - hw * 1.05); c.lineTo(hx + hw * 1.1, hy - hw * 0.7); c.fill();
    }
    // breakwater (stone) on the left at the waterline
    c.fillStyle = '#7d7a70';
    c.beginPath(); c.moveTo(0, H + 1); c.lineTo(0, H - h * 0.012); c.lineTo(w * 0.3, H - h * 0.008); c.lineTo(w * 0.32, H + 1); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, H - h * 0.012, w * 0.3, h * 0.003);
    _bgCache[key] = cv;
    return cv;
  }

  // Animated sea below the horizon at fraction hz of the height.
  function drawSea(ctx, w, h, t, hz) {
    var H = h * hz;
    var sea = ctx.createLinearGradient(0, H, 0, h);
    sea.addColorStop(0, '#8fb2c2'); sea.addColorStop(0.08, '#4f8299'); sea.addColorStop(0.5, '#215a73'); sea.addColorStop(1, '#0d3346');
    ctx.fillStyle = sea; ctx.fillRect(0, H, w, h - H);
    // sun glitter near the horizon
    var R = rng(19);
    ctx.fillStyle = 'rgba(255,255,240,0.5)';
    for (var gI = 0; gI < 60; gI++) {
      var gx = w * (0.45 + (R() - 0.5) * 0.5), gy = H + (h - H) * Math.pow(R(), 2.5) * 0.35;
      var on = Math.sin(t * 3 + gI * 1.7) > 0.4;
      if (on) ctx.fillRect(gx, gy, 2 + R() * 6, 1.2);
    }
    // wave rows in perspective: broken crests (light) over troughs (dark)
    var rows = 30;
    ctx.lineCap = 'round';
    for (var i = 1; i <= rows; i++) {
      var f = i / rows;
      var y = H + (h - H) * f * f;
      var amp = 0.6 + f * f * h * 0.012;
      var len = 30 + f * w * 0.12;
      var ph = t * (0.6 + f * 0.8) + i * 1.3;
      var dash = 8 + f * w * 0.09, gap = dash * (0.5 + ((i * 37) % 10) / 10);
      ctx.beginPath();
      for (var x = -20; x <= w + 20; x += 6) {
        var yy = y + Math.sin(x / len * TAU + ph) * amp + Math.sin(x / (len * 0.43) * TAU - ph * 1.3) * amp * 0.35;
        if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.setLineDash([dash, gap]);
      ctx.lineDashOffset = -(t * (6 + f * 30) + i * 53);
      ctx.lineWidth = 0.8 + f * 3.2;
      ctx.strokeStyle = 'rgba(5,30,45,' + (0.08 + f * 0.14) + ')';
      ctx.translate(0, amp * 1.4); ctx.stroke(); ctx.translate(0, -amp * 1.4);
      ctx.setLineDash([dash * 0.6, gap + dash * 0.4]);
      ctx.lineWidth = 0.5 + f * 1.8;
      ctx.strokeStyle = 'rgba(210,235,245,' + (0.10 + f * 0.16) + ')';
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
  }

  // Shaded vertical cylinder fill for colour c across [x0, x1].
  function cylGrad(ctx, x0, x1, c) {
    var g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, rgb(shadeC(c, 0.42)));
    g.addColorStop(0.22, rgb(shadeC(c, 1.0)));
    g.addColorStop(0.34, rgb(shadeC(c, 1.18)));
    g.addColorStop(0.5, rgb(shadeC(c, 0.95)));
    g.addColorStop(0.85, rgb(shadeC(c, 0.6)));
    g.addColorStop(1, rgb(shadeC(c, 0.38)));
    return g;
  }

  var BC = { red: [196, 34, 28], green: [24, 132, 60], black: [30, 30, 32], yellow: [242, 196, 20], white: [236, 236, 230] };

  // Light rhythm (true = lit) for each mark, t in seconds.
  function lightOn(type, t) {
    function q(n, period, dur) { // n quick flashes at 1 Hz, then dark
      var p = t % period;
      if (p < n) return (p % 1) < (dur || 0.35);
      return false;
    }
    switch (type) {
      case 'north': return (t % 1) < 0.35;
      case 'east': return q(3, 10);
      case 'south': var p = t % 15; return p < 6 ? (p % 1) < 0.35 : (p >= 6.3 && p < 8.3);
      case 'west': return q(9, 15);
      case 'danger': var d = t % 5; return d < 0.4 || (d > 1 && d < 1.4);
      case 'safe': return (t % 10) < 2;
      case 'special': return (t % 4) < 0.6;
      default: return (t % 4) < 0.6; // lateral: flashing
    }
  }
  var LIGHT_COL = { port: '#3dff7a', stbd: '#ff3b30', special: '#ffd21a' };

  function bandsFor(type) {
    switch (type) {
      case 'north': return [BC.black, BC.yellow];
      case 'south': return [BC.yellow, BC.black];
      case 'east': return [BC.black, BC.yellow, BC.black];
      case 'west': return [BC.yellow, BC.black, BC.yellow];
      case 'danger': return [BC.black, BC.red, BC.black];
      case 'special': return [BC.yellow];
      default: return [BC.red];
    }
  }

  function cone(ctx, x, y, w, h, up, col) {
    ctx.beginPath();
    if (up) { ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x - w / 2, y); }
    else { ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x, y); }
    ctx.closePath();
    ctx.fillStyle = cylGrad(ctx, x - w / 2, x + w / 2, col); ctx.fill();
  }
  function sphere(ctx, x, y, r, col) {
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, rgb(shadeC(col, 1.35))); g.addColorStop(0.5, rgb(col)); g.addColorStop(1, rgb(shadeC(col, 0.4)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  function drawTopmark(ctx, type, x, y, s) {
    // y = base of topmark. Shapes are about 0.32 s.
    var k = s * 0.32;
    switch (type) {
      case 'port':
        ctx.fillStyle = cylGrad(ctx, x - k * 0.45, x + k * 0.45, BC.green);
        ctx.fillRect(x - k * 0.45, y - k, k * 0.9, k);
        break;
      case 'stbd': cone(ctx, x, y, k, k, true, BC.red); break;
      case 'north': cone(ctx, x, y, k, k * 0.8, true, BC.black); cone(ctx, x, y - k * 0.95, k, k * 0.8, true, BC.black); break;
      case 'south': cone(ctx, x, y, k, k * 0.8, false, BC.black); cone(ctx, x, y - k * 0.95, k, k * 0.8, false, BC.black); break;
      case 'east': cone(ctx, x, y, k, k * 0.8, false, BC.black); cone(ctx, x, y - k * 0.85, k, k * 0.8, true, BC.black); break;
      case 'west': cone(ctx, x, y, k, k * 0.8, true, BC.black); cone(ctx, x, y - k * 0.85, k, k * 0.8, false, BC.black); break;
      case 'danger': sphere(ctx, x, y - k * 0.42, k * 0.42, BC.black); sphere(ctx, x, y - k * 1.4, k * 0.42, BC.black); break;
      case 'safe': sphere(ctx, x, y - k * 0.5, k * 0.5, BC.red); break;
      case 'special':
        ctx.save(); ctx.translate(x, y - k * 0.55);
        ctx.lineCap = 'butt'; ctx.lineWidth = k * 0.26;
        ctx.strokeStyle = rgb(shadeC(BC.yellow, 0.55));
        ctx.beginPath(); ctx.moveTo(-k * 0.45, -k * 0.45); ctx.lineTo(k * 0.45, k * 0.45); ctx.moveTo(k * 0.45, -k * 0.45); ctx.lineTo(-k * 0.45, k * 0.45); ctx.stroke();
        ctx.lineWidth = k * 0.16; ctx.strokeStyle = rgb(BC.yellow); ctx.stroke();
        ctx.restore();
        break;
    }
  }

  // The buoy body above the waterline, origin at the waterline centre.
  function buoyBody(ctx, type, s, t, lit) {
    var shape = type === 'port' ? 'can' : type === 'stbd' ? 'cone' : 'pillar';
    var mastTop;
    if (shape === 'can') {
      var cw = s * 0.95, ch = s * 1.2;
      ctx.fillStyle = cylGrad(ctx, -cw / 2, cw / 2, BC.green);
      ctx.fillRect(-cw / 2, -ch, cw, ch);
      ctx.beginPath(); ctx.ellipse(0, -ch, cw / 2, s * 0.1, 0, 0, TAU);
      ctx.fillStyle = rgb(shadeC(BC.green, 1.25)); ctx.fill();
      mastTop = -ch;
    } else if (shape === 'cone') {
      var bw = s * 1.05, th = s * 1.45, tw = s * 0.18;
      ctx.beginPath(); ctx.moveTo(-bw / 2, 0); ctx.lineTo(-tw / 2, -th); ctx.lineTo(tw / 2, -th); ctx.lineTo(bw / 2, 0); ctx.closePath();
      ctx.fillStyle = cylGrad(ctx, -bw / 2, bw / 2, BC.red); ctx.fill();
      mastTop = -th;
    } else {
      // float
      var fw = s * 1.3, fh = s * 0.34;
      var bands = bandsFor(type);
      var lowCol = type === 'safe' ? BC.red : bands[bands.length - 1];
      ctx.fillStyle = cylGrad(ctx, -fw / 2, fw / 2, lowCol);
      ctx.beginPath(); ctx.moveTo(-fw / 2, 0); ctx.lineTo(-fw / 2, -fh * 0.7);
      ctx.quadraticCurveTo(-fw / 2, -fh, -fw * 0.4, -fh); ctx.lineTo(fw * 0.4, -fh); ctx.quadraticCurveTo(fw / 2, -fh, fw / 2, -fh * 0.7); ctx.lineTo(fw / 2, 0); ctx.fill();
      // tower
      var b0 = s * 0.62, b1 = s * 0.34, tH = s * 1.55, y0 = -fh;
      var nb = type === 'safe' ? 1 : bands.length;
      for (var i = 0; i < nb; i++) {
        var ya = y0 - tH * (i / nb), yb = y0 - tH * ((i + 1) / nb);
        var wa = b0 + (b1 - b0) * (i / nb), wb = b0 + (b1 - b0) * ((i + 1) / nb);
        var col = type === 'safe' ? BC.red : bands[nb - 1 - i];
        ctx.beginPath(); ctx.moveTo(-wa / 2, ya); ctx.lineTo(-wb / 2, yb); ctx.lineTo(wb / 2, yb); ctx.lineTo(wa / 2, ya); ctx.closePath();
        ctx.fillStyle = cylGrad(ctx, -wa / 2, wa / 2, col); ctx.fill();
      }
      if (type === 'safe') { // white vertical stripes over red
        ctx.save();
        ctx.beginPath(); ctx.moveTo(-b0 / 2, y0); ctx.lineTo(-b1 / 2, y0 - tH); ctx.lineTo(b1 / 2, y0 - tH); ctx.lineTo(b0 / 2, y0); ctx.closePath(); ctx.clip();
        for (var st = -2; st <= 2; st += 2) {
          var sx0 = st * b0 * 0.16, sx1 = st * b1 * 0.16;
          ctx.beginPath();
          ctx.moveTo(sx0 - b0 * 0.08, y0); ctx.lineTo(sx1 - b1 * 0.08, y0 - tH); ctx.lineTo(sx1 + b1 * 0.08, y0 - tH); ctx.lineTo(sx0 + b0 * 0.08, y0); ctx.closePath();
          ctx.fillStyle = cylGrad(ctx, -b0 / 2, b0 / 2, BC.white); ctx.fill();
        }
        ctx.restore();
      }
      // cage rails at the top of the float
      ctx.strokeStyle = 'rgba(40,40,40,0.55)'; ctx.lineWidth = Math.max(1, s * 0.025);
      ctx.beginPath(); ctx.moveTo(-fw * 0.42, -fh); ctx.lineTo(-b0 * 0.45, y0 - tH * 0.25); ctx.moveTo(fw * 0.42, -fh); ctx.lineTo(b0 * 0.45, y0 - tH * 0.25); ctx.stroke();
      mastTop = y0 - tH;
    }
    // mast, lantern and topmark
    var mh = s * 0.32;
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-s * 0.025, mastTop - mh * 2.2, s * 0.05, mh * 2.2);
    // lantern
    var ly = mastTop - mh * 0.45, lr = s * 0.09;
    var lc = type === 'port' ? LIGHT_COL.port : type === 'stbd' ? LIGHT_COL.stbd : type === 'special' ? LIGHT_COL.special : '#ffffff';
    ctx.fillStyle = '#222'; ctx.fillRect(-lr * 1.1, ly + lr * 0.8, lr * 2.2, lr * 0.4);
    ctx.fillStyle = lit ? lc : 'rgba(200,210,215,0.85)';
    ctx.fillRect(-lr * 0.8, ly - lr * 0.8, lr * 1.6, lr * 1.6);
    if (lit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var gl = ctx.createRadialGradient(0, ly, 0, 0, ly, s * 0.5);
      gl.addColorStop(0, lc); gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.7; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, ly, s * 0.5, 0, TAU); ctx.fill();
      ctx.restore();
    }
    drawTopmark(ctx, type, 0, mastTop - mh * 1.25, s);
    // weathering: salt streaks
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (var k = -2; k <= 2; k++) ctx.fillRect(k * s * 0.12, -s * 0.5, s * 0.015, s * 0.45);
  }

  /* drawBuoy(ctx, type, x, y, s, t, opts) — y is the waterline.
     types: port, stbd, north, east, south, west, danger, safe, special */
  function drawBuoy(ctx, type, x, y, s, t, opts) {
    opts = opts || {};
    var seed = opts.seed || 0;
    var bob = Math.sin(t * 1.5 + seed) * s * 0.05;
    var tilt = Math.sin(t * 1.1 + seed * 1.7) * 0.05;
    var lit = opts.light === false ? false : lightOn(type, t + seed);
    // reflection (flipped, darker, rippled by slicing)
    ctx.save();
    ctx.beginPath(); ctx.rect(x - s * 1.5, y, s * 3, s * 2.2); ctx.clip();
    ctx.globalAlpha = 0.32;
    var nSl = s < 70 ? 4 : 7, slH = s * 2 / nSl;
    for (var sl = 0; sl < nSl; sl++) {
      var sy = y + sl * slH;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - s * 1.5, sy, s * 3, slH + 0.5); ctx.clip();
      ctx.translate(x + Math.sin(t * 2.4 + sl * 1.6) * s * 0.04 * (1 + sl * 0.35), y + bob * 0.5);
      ctx.scale(1, -0.8);
      ctx.rotate(-tilt);
      buoyBody(ctx, type, s, t, false);
      ctx.restore();
    }
    ctx.restore();
    // body
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(tilt);
    // waterline grime band
    buoyBody(ctx, type, s, t, lit);
    var wl = ctx.createLinearGradient(0, -s * 0.12, 0, 0);
    wl.addColorStop(0, 'rgba(60,70,40,0)'); wl.addColorStop(1, 'rgba(60,70,40,0.55)');
    ctx.fillStyle = wl; ctx.fillRect(-s * 0.7, -s * 0.12, s * 1.4, s * 0.12);
    ctx.restore();
    // foam ring at the waterline
    ctx.beginPath(); ctx.ellipse(x, y + bob * 0.3, s * 0.72, s * 0.09, 0, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + bob * 0.3 + s * 0.03, s * 0.9, s * 0.12, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = Math.max(1, s * 0.02); ctx.stroke();
  }

  // First-person bow of a small white motor boat (lancha) at the bottom.
  function drawBow(ctx, w, h, sway) {
    var cx = w / 2 + (sway || 0) * w * 0.01;
    var tipY = h * 0.72, base = h * 1.02;
    var g = ctx.createLinearGradient(cx - w * 0.35, 0, cx + w * 0.35, 0);
    g.addColorStop(0, '#9aa3a8'); g.addColorStop(0.35, '#f4f6f6'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.65, '#e9ecec'); g.addColorStop(1, '#8a9398');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, base);
    ctx.quadraticCurveTo(cx - w * 0.2, h * 0.8, cx, tipY);
    ctx.quadraticCurveTo(cx + w * 0.2, h * 0.8, cx + w * 0.42, base);
    ctx.closePath(); ctx.fill();
    // non-skid deck panel
    ctx.fillStyle = 'rgba(205,210,205,0.9)';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, base);
    ctx.quadraticCurveTo(cx - w * 0.13, h * 0.84, cx, h * 0.77);
    ctx.quadraticCurveTo(cx + w * 0.13, h * 0.84, cx + w * 0.3, base);
    ctx.closePath(); ctx.fill();
    // anchor locker hatch + cleat
    ctx.fillStyle = '#c9cdca'; ctx.strokeStyle = 'rgba(80,90,90,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, h * 0.9, w * 0.05, h * 0.025, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // stainless bow rail (pulpit)
    ctx.strokeStyle = '#dfe6ea'; ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.36, base); ctx.quadraticCurveTo(cx - w * 0.16, h * 0.74, cx, h * 0.69);
    ctx.quadraticCurveTo(cx + w * 0.16, h * 0.74, cx + w * 0.36, base); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,100,105,0.7)'; ctx.lineWidth = Math.max(1, w * 0.002); ctx.stroke();
    // navigation lights: red to port (left), green to starboard (right)
    [[-1, '#ff3b30'], [1, '#3dff7a']].forEach(function(p) {
      var lx = cx + p[0] * w * 0.075, ly = h * 0.765;
      ctx.fillStyle = '#333'; ctx.fillRect(lx - w * 0.012, ly - h * 0.008, w * 0.024, h * 0.016);
      ctx.fillStyle = p[1]; ctx.fillRect(lx - w * 0.009, ly - h * 0.006, w * 0.018, h * 0.012);
    });
  }


  // ---------------------------------------------------------------
  // SIGNAL FLAGS (International Code of Signals) as SVG
  // ---------------------------------------------------------------
  var FC = { r: '#d0202e', w: '#ffffff', b: '#1f4fa3', y: '#ffd400', k: '#111111' };
  // Each design: list of [shape, colour, ...] in a 150 × 100 box.
  function flagShapes(L) {
    var R = function(x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + FC[c] + '"/>'; };
    var P = function(pts, c) { return '<polygon points="' + pts + '" fill="' + FC[c] + '"/>'; };
    var i, out = '';
    switch (L) {
      case 'A': return R(0, 0, 75, 100, 'w') + R(75, 0, 75, 100, 'b');
      case 'B': return R(0, 0, 150, 100, 'r');
      case 'C': return R(0, 0, 150, 20, 'b') + R(0, 20, 150, 20, 'w') + R(0, 40, 150, 20, 'r') + R(0, 60, 150, 20, 'w') + R(0, 80, 150, 20, 'b');
      case 'D': return R(0, 0, 150, 25, 'y') + R(0, 25, 150, 50, 'b') + R(0, 75, 150, 25, 'y');
      case 'E': return R(0, 0, 150, 50, 'b') + R(0, 50, 150, 50, 'r');
      case 'F': return R(0, 0, 150, 100, 'w') + P('75,0 150,50 75,100 0,50', 'r');
      case 'G': for (i = 0; i < 6; i++) out += R(i * 25, 0, 25, 100, i % 2 ? 'b' : 'y'); return out;
      case 'H': return R(0, 0, 75, 100, 'w') + R(75, 0, 75, 100, 'r');
      case 'I': return R(0, 0, 150, 100, 'y') + '<circle cx="75" cy="50" r="25" fill="' + FC.k + '"/>';
      case 'J': return R(0, 0, 150, 33.4, 'b') + R(0, 33.3, 150, 33.4, 'w') + R(0, 66.6, 150, 33.4, 'b');
      case 'K': return R(0, 0, 75, 100, 'y') + R(75, 0, 75, 100, 'b');
      case 'L': return R(0, 0, 75, 50, 'y') + R(75, 0, 75, 50, 'k') + R(0, 50, 75, 50, 'k') + R(75, 50, 75, 50, 'y');
      case 'M': return R(0, 0, 150, 100, 'b') + P('0,0 22,0 150,85 150,100 128,100 0,15', 'w') + P('150,0 128,0 0,85 0,100 22,100 150,15', 'w');
      case 'N': for (i = 0; i < 16; i++) out += R((i % 4) * 37.5, Math.floor(i / 4) * 25, 37.6, 25.1, ((i % 4) + Math.floor(i / 4)) % 2 ? 'w' : 'b'); return out;
      case 'O': return P('0,0 150,100 0,100', 'y') + P('0,0 150,0 150,100', 'r');
      case 'P': return R(0, 0, 150, 100, 'b') + R(50, 33.3, 50, 33.4, 'w');
      case 'Q': return R(0, 0, 150, 100, 'y');
      case 'R': return R(0, 0, 150, 100, 'r') + R(0, 40, 150, 20, 'y') + R(65, 0, 20, 100, 'y');
      case 'S': return R(0, 0, 150, 100, 'w') + R(50, 33.3, 50, 33.4, 'b');
      case 'T': return R(0, 0, 50, 100, 'r') + R(50, 0, 50, 100, 'w') + R(100, 0, 50, 100, 'b');
      case 'U': return R(0, 0, 75, 50, 'r') + R(75, 0, 75, 50, 'w') + R(0, 50, 75, 50, 'w') + R(75, 50, 75, 50, 'r');
      case 'V': return R(0, 0, 150, 100, 'w') + P('0,0 22,0 150,85 150,100 128,100 0,15', 'r') + P('150,0 128,0 0,85 0,100 22,100 150,15', 'r');
      case 'W': return R(0, 0, 150, 100, 'b') + R(25, 16.7, 100, 66.6, 'w') + R(50, 33.3, 50, 33.4, 'r');
      case 'X': return R(0, 0, 150, 100, 'w') + R(0, 40, 150, 20, 'b') + R(65, 0, 20, 100, 'b');
      case 'Y':
        out = R(0, 0, 150, 100, 'y');
        for (i = -5; i < 11; i += 2) out += P((i * 20) + ',100 ' + (i * 20 + 20) + ',100 ' + (i * 20 + 120) + ',0 ' + (i * 20 + 100) + ',0', 'r');
        return out;
      case 'Z': return P('0,0 150,0 75,50', 'y') + P('150,0 150,100 75,50', 'b') + P('0,100 150,100 75,50', 'r') + P('0,0 75,50 0,100', 'k');
    }
    return '';
  }

  var _flagSeq = 0;
  // A flag on its halyard, gently waving. o.w = css width, o.still = no motion
  function flagSVG(L, o) {
    o = o || {};
    var id = 'mfl' + (++_flagSeq);
    var tail = (L === 'A' || L === 'B');
    // waving outline: the fly edge moves more than the hoist
    function edge(y0, sign) {
      var d = '';
      for (var x = 0; x <= 150; x += 10) {
        var a = (x / 150) * 4.5;
        d += (x === 0 ? '' : ' L') + x + ',' + (y0 + sign * 0 + Math.sin(x / 150 * Math.PI * 1.6 + 0.6) * a).toFixed(1);
      }
      return d;
    }
    var top = edge(0, 1), bot = edge(100, 1);
    var outline = 'M0,0 L' + top.replace(/^0,[^ ]+ ?L?/, '') +
      (tail ? ' L105,' + (50 + 3).toFixed(1) : '') +
      ' L' + bot.split(' L').reverse().join(' L') + ' Z';
    var folds = '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="75" y2="8" spreadMethod="repeat">' +
      '<stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="0.3" stop-color="#fff" stop-opacity="0.18"/>' +
      '<stop offset="0.55" stop-color="#fff" stop-opacity="0.02"/><stop offset="0.8" stop-color="#000" stop-opacity="0.12"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="0.22"/>' +
      (o.still ? '' : '<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="75 8" dur="2.6s" repeatCount="indefinite"/>') +
      '</linearGradient>';
    var hoistShade = '<linearGradient id="' + id + 'h" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="0.12" stop-color="#000" stop-opacity="0"/></linearGradient>';
    var w = o.w || 120;
    return '<svg class="mar-flag" viewBox="-14 -8 172 118" width="' + w + '" height="' + Math.round(w * 118 / 172) + '" role="img" aria-label="' + (o.label || ('Flag ' + L)) + '">' +
      '<defs><clipPath id="' + id + 'c"><path d="' + outline + '"/></clipPath>' + folds + hoistShade +
      '<filter id="' + id + 's" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="2" dy="3" stdDeviation="2.2" flood-opacity="0.35"/></filter></defs>' +
      // halyard
      '<line x1="-6" y1="-8" x2="-6" y2="110" stroke="#c9b48a" stroke-width="2.4"/>' +
      '<line x1="-6" y1="-8" x2="-6" y2="110" stroke="#7a6640" stroke-width="2.4" stroke-dasharray="1.5 2.5"/>' +
      '<rect x="-9" y="-4" width="6" height="8" rx="2" fill="#7b4a24"/><rect x="-9" y="96" width="6" height="8" rx="2" fill="#7b4a24"/>' +
      '<g filter="url(#' + id + 's)"><g clip-path="url(#' + id + 'c)">' + flagShapes(L) +
      '<rect x="0" y="-10" width="150" height="120" fill="url(#' + id + 'g)"/>' +
      '<rect x="0" y="-10" width="150" height="120" fill="url(#' + id + 'h)"/></g></g>' +
      '<rect x="-2" y="0" width="3" height="100" fill="#e9e2cf"/>' +
      '</svg>';
  }


  // ---------------------------------------------------------------
  // PRACTICE NAUTICAL CHART (fictional bay; 1' of latitude = 1 NM)
  // ---------------------------------------------------------------
  function chartLayout(w, h, C) {
    var scale = Math.max(22, Math.round(Math.min(w, h) * 0.07));
    var iw = w - scale * 2, ih = h - scale * 2;
    var ppn = Math.min(iw / C.wNM, ih / C.hNM);
    var ox = (w - C.wNM * ppn) / 2, oy = (h - C.hNM * ppn) / 2;
    return {
      w: w, h: h, ppn: ppn, ox: ox, oy: oy, band: scale,
      toPx: function(x, y) { return [ox + x * ppn, oy + y * ppn]; },
      toNM: function(px, py) { return [(px - ox) / ppn, (py - oy) / ppn]; },
      latScale: { x0: ox - scale * 0.62, x1: ox - scale * 0.18 }
    };
  }

  function pip(pt, poly) {
    var x = pt[0], y = pt[1], inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function distPoly(pt, poly) {
    var best = 1e9;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var ax = poly[j][0], ay = poly[j][1], bx = poly[i][0], by = poly[i][1];
      var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      var t = clamp(((pt[0] - ax) * dx + (pt[1] - ay) * dy) / L, 0, 1);
      var ex = ax + dx * t - pt[0], ey = ay + dy * t - pt[1];
      best = Math.min(best, Math.sqrt(ex * ex + ey * ey));
    }
    return best;
  }
  function smoothPoly(ctx, pts, map) {
    var P = pts.map(function(p) { return map(p[0], p[1]); });
    ctx.moveTo((P[0][0] + P[P.length - 1][0]) / 2, (P[0][1] + P[P.length - 1][1]) / 2);
    for (var i = 0; i < P.length; i++) {
      var n = P[(i + 1) % P.length];
      ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + n[0]) / 2, (P[i][1] + n[1]) / 2);
    }
    ctx.closePath();
  }

  function chartImage(w, h, dpr, C) {
    var key = 'chart' + w + 'x' + h + '@' + dpr;
    if (_bgCache[key]) return _bgCache[key];
    var Lc = chartLayout(w, h, C);
    var cv = document.createElement('canvas');
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var R = rng(23);
    // paper
    c.fillStyle = '#f7f3e6'; c.fillRect(0, 0, w, h);
    for (var n = 0; n < w * h / 60; n++) {
      c.fillStyle = R() < 0.5 ? 'rgba(120,100,60,0.05)' : 'rgba(255,255,255,0.25)';
      c.fillRect(R() * w, R() * h, 1, 1);
    }
    var x0 = Lc.ox, y0 = Lc.oy, cw = C.wNM * Lc.ppn, ch = C.hNM * Lc.ppn;
    c.save();
    c.beginPath(); c.rect(x0, y0, cw, ch); c.clip();
    var map = Lc.toPx;
    var lands = [C.land].concat(C.islands);
    // depth zones (20 m, 10 m, 5 m) as wide strokes around the coast
    var zones = [[3.0, '#ffffff', '#9ab8cf', []], [1.5, '#e3f0f6', '#6f9cbe', []], [0.7, '#c4dfec', '#3f78a6', []]];
    zones.forEach(function(z) {
      lands.forEach(function(poly) {
        c.beginPath(); smoothPoly(c, poly, map);
        c.lineJoin = 'round';
        c.setLineDash(z[3]);
        c.lineWidth = z[0] * 2 * Lc.ppn + 2.2; c.strokeStyle = z[2]; c.stroke();
        c.setLineDash([]);
        c.lineWidth = z[0] * 2 * Lc.ppn; c.strokeStyle = z[1]; c.stroke();
      });
    });
    // land
    lands.forEach(function(poly) {
      c.beginPath(); smoothPoly(c, poly, map);
      c.fillStyle = '#ecd9a6'; c.fill();
      c.lineWidth = 1.6; c.strokeStyle = '#5b4a26'; c.stroke();
      // contour hatching inland
      c.save(); c.clip();
      for (var k = 1; k < 6; k++) {
        c.beginPath(); smoothPoly(c, poly, map);
        c.lineWidth = k * Lc.ppn * 0.6; c.strokeStyle = 'rgba(150,120,60,0.12)'; c.stroke();
      }
      c.restore();
    });
    // drying rocks and shoals
    c.fillStyle = '#1d1d1d';
    C.rocks.forEach(function(r) {
      var p = map(r[0], r[1]);
      c.font = '700 ' + Math.round(Lc.ppn * 0.42) + 'px sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('+', p[0], p[1]);
      c.beginPath(); c.arc(p[0], p[1], Lc.ppn * 0.32, 0, TAU);
      c.setLineDash([2, 2]); c.lineWidth = 1; c.strokeStyle = '#1d1d1d'; c.stroke(); c.setLineDash([]);
    });
    // soundings (metres), deeper offshore
    c.fillStyle = '#26303a';
    c.font = 'italic 600 ' + Math.max(9, Math.round(Lc.ppn * 0.3)) + 'px Georgia, serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (var gy = 0.4; gy < C.hNM; gy += 0.85) {
      for (var gx = 0.4; gx < C.wNM; gx += 0.95) {
        var pt = [gx + (R() - 0.5) * 0.5, gy + (R() - 0.5) * 0.5];
        var onLand = lands.some(function(pl) { return pip(pt, pl); });
        if (onLand) continue;
        var d = Math.min.apply(null, lands.map(function(pl) { return distPoly(pt, pl); }));
        if (d < 0.25) continue;
        var tooClose = C.places.some(function(pc) { var dx = pc.x - pt[0], dy = pc.y - pt[1]; return dx * dx + dy * dy < 0.5; });
        if (tooClose) continue;
        var rdx = pt[0] - C.rose[0], rdy = pt[1] - C.rose[1];
        if (rdx * rdx + rdy * rdy < Math.pow(C.rose[2] * 1.2, 2)) continue;
        if (pt[1] > C.title[1] - 0.9 && pt[0] < C.title[0] + 8.5) continue;
        var depth = Math.round(2 + d * 5.2 + Math.pow(d, 1.4) * 0.9 + R() * 2);
        var pp = map(pt[0], pt[1]);
        c.fillText(String(depth), pp[0], pp[1]);
      }
    }
    // compass rose (true)
    var rp = map(C.rose[0], C.rose[1]), rr = Lc.ppn * C.rose[2];
    c.save(); c.translate(rp[0], rp[1]);
    c.strokeStyle = '#8a2a6e'; c.fillStyle = '#8a2a6e';
    c.lineWidth = 1; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, rr * 0.86, 0, TAU); c.stroke();
    for (var dg = 0; dg < 360; dg += 5) {
      var a = dg * Math.PI / 180, l = dg % 30 === 0 ? 0.14 : dg % 10 === 0 ? 0.09 : 0.05;
      c.beginPath(); c.moveTo(Math.sin(a) * rr, -Math.cos(a) * rr); c.lineTo(Math.sin(a) * rr * (1 - l), -Math.cos(a) * rr * (1 - l)); c.stroke();
    }
    c.font = '700 ' + Math.max(8, Math.round(rr * 0.13)) + 'px sans-serif';
    for (var dn = 0; dn < 360; dn += 30) {
      c.save(); c.rotate(dn * Math.PI / 180); c.fillText(String(dn).padStart(3, '0'), 0, -rr * 0.73); c.restore();
    }
    for (var q = 0; q < 8; q++) {
      c.save(); c.rotate(q * Math.PI / 4);
      var L2 = q % 2 ? rr * 0.38 : rr * 0.6, W2 = q % 2 ? rr * 0.05 : rr * 0.08;
      c.beginPath(); c.moveTo(0, -L2); c.lineTo(W2, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#8a2a6e'; c.fill();
      c.beginPath(); c.moveTo(0, -L2); c.lineTo(-W2, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#e8c9de'; c.fill(); c.stroke();
      c.restore();
    }
    c.fillStyle = '#8a2a6e'; c.font = '800 ' + Math.round(rr * 0.2) + 'px sans-serif'; c.fillText('N', 0, -rr * 1.14);
    c.restore();
    // places
    C.places.forEach(function(pc) {
      var p = map(pc.x, pc.y);
      var r = Math.max(5, Lc.ppn * 0.17);
      c.save(); c.translate(p[0], p[1]);
      if (pc.sym === 'light') {
        c.fillStyle = '#d13bb0'; c.globalAlpha = 0.85;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(r * 2.6, -r * 1.1); c.quadraticCurveTo(r * 2.9, 0, r * 2.6, r * 1.1); c.closePath(); c.fill();
        c.globalAlpha = 1; c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, r * 0.45, 0, TAU); c.fill();
        c.strokeStyle = '#111'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r * 0.9, 0, TAU); c.stroke();
      } else if (pc.sym === 'pier') {
        c.fillStyle = '#5b4a26'; c.fillRect(-r * 2.2, -r * 0.3, r * 2.2, r * 0.6);
        c.beginPath(); c.arc(0, 0, r * 0.55, 0, TAU); c.fillStyle = '#111'; c.fill();
      } else if (pc.sym === 'anchor') {
        c.strokeStyle = '#8a2a6e'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(0, -r); c.lineTo(0, r); c.moveTo(-r * 0.6, -r * 0.5); c.lineTo(r * 0.6, -r * 0.5);
        c.moveTo(-r * 0.9, r * 0.2); c.quadraticCurveTo(0, r * 1.5, r * 0.9, r * 0.2); c.stroke();
        c.beginPath(); c.arc(0, -r * 1.15, r * 0.25, 0, TAU); c.stroke();
      } else if (pc.sym === 'buoyR' || pc.sym === 'buoyG' || pc.sym === 'buoyS' || pc.sym === 'buoyD') {
        var col = pc.sym === 'buoyR' ? '#c8211b' : pc.sym === 'buoyG' ? '#14823c' : pc.sym === 'buoyS' ? '#c8211b' : '#111';
        c.beginPath(); c.moveTo(-r * 0.9, 0); c.quadraticCurveTo(-r * 0.6, -r * 1.6, 0, -r * 1.7); c.quadraticCurveTo(r * 0.6, -r * 1.6, r * 0.9, 0); c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = '#111'; c.lineWidth = 1; c.stroke();
        if (pc.sym === 'buoyD') { c.fillStyle = '#c8211b'; c.fillRect(-r * 0.75, -r * 1.0, r * 1.5, r * 0.4); }
        if (pc.sym === 'buoyS') { c.fillStyle = '#fff'; c.fillRect(-r * 0.15, -r * 1.6, r * 0.3, r * 1.6); }
        c.beginPath(); c.arc(0, 0, r * 0.22, 0, TAU); c.fillStyle = '#111'; c.fill();
      } else {
        c.beginPath(); c.arc(0, 0, r * 0.4, 0, TAU); c.fillStyle = '#111'; c.fill();
      }
      c.restore();
      // label
      c.font = '700 ' + Math.max(10, Math.round(Lc.ppn * 0.32)) + 'px Nunito, sans-serif';
      c.textAlign = pc.lx < 0 ? 'right' : 'left'; c.textBaseline = 'middle';
      c.lineWidth = 3; c.strokeStyle = 'rgba(247,243,230,0.9)';
      var tx = p[0] + (pc.lx || 0.4) * Lc.ppn, ty = p[1] + (pc.ly || 0) * Lc.ppn;
      c.strokeText(pc.name, tx, ty);
      c.fillStyle = '#1e2430'; c.fillText(pc.name, tx, ty);
    });
    // title cartouche
    c.font = '800 ' + Math.max(11, Math.round(Lc.ppn * 0.5)) + 'px "Baloo 2", Nunito, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    var tp = map(C.title[0], C.title[1]);
    c.fillStyle = '#1e2430'; c.fillText(C.titleText, tp[0], tp[1]);
    c.font = '600 ' + Math.max(9, Math.round(Lc.ppn * 0.3)) + 'px Nunito, sans-serif';
    c.fillText(C.subText, tp[0], tp[1] + Lc.ppn * 0.45);
    c.fillText(C.subText2, tp[0], tp[1] + Lc.ppn * 0.85);
    c.restore();
    // neat line + scales
    c.strokeStyle = '#1e2430'; c.lineWidth = 1.5; c.strokeRect(x0, y0, cw, ch);
    var b = Lc.band;
    c.lineWidth = 1; c.strokeRect(x0 - b * 0.62, y0 - b * 0.62, cw + b * 1.24, ch + b * 1.24);
    // latitude scale (both sides): alternate black/white per minute, ticks every 0.1'
    [[x0 - b * 0.62, x0 - b * 0.18], [x0 + cw + b * 0.18, x0 + cw + b * 0.62]].forEach(function(sx, side) {
      c.strokeRect(sx[0], y0, sx[1] - sx[0], ch);
      for (var m = 0; m < C.hNM; m++) {
        var ya = y0 + m * Lc.ppn;
        if (m % 2 === 0) { c.fillStyle = '#1e2430'; c.fillRect(sx[0], ya, (sx[1] - sx[0]) * 0.45, Lc.ppn); }
        for (var tk = 1; tk < 10; tk++) {
          var yt = ya + tk * Lc.ppn / 10;
          var tl = tk === 5 ? 0.55 : 0.3;
          c.beginPath();
          if (side === 0) { c.moveTo(sx[1], yt); c.lineTo(sx[1] - (sx[1] - sx[0]) * tl, yt); }
          else { c.moveTo(sx[0], yt); c.lineTo(sx[0] + (sx[1] - sx[0]) * tl, yt); }
          c.stroke();
        }
        c.beginPath(); c.moveTo(sx[0], ya); c.lineTo(sx[1], ya); c.stroke();
      }
      // labels every 2'
      c.save();
      c.fillStyle = '#1e2430'; c.font = '700 ' + Math.max(8, Math.round(b * 0.32)) + 'px Nunito, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (var m2 = 0; m2 <= C.hNM; m2 += 2) {
        var lat = C.lat0 + m2, ldeg = C.latDeg + Math.floor(lat / 60);
        var lbl = ldeg + '°' + String(lat % 60).padStart(2, '0') + "'S";
        var lx2 = side === 0 ? x0 - b * 0.82 : x0 + cw + b * 0.82;
        c.save(); c.translate(lx2, y0 + m2 * Lc.ppn); c.rotate(-Math.PI / 2); c.fillText(lbl, 0, 0); c.restore();
      }
      c.restore();
    });
    // longitude scale (top): minutes of longitude are shorter (× cos lat)
    var lonMinPx = Lc.ppn * Math.cos(C.latMid * Math.PI / 180);
    var nLon = Math.floor(cw / lonMinPx);
    c.fillStyle = '#1e2430';
    for (var lm = 0; lm < nLon; lm++) {
      var xa = x0 + cw - (lm + 1) * lonMinPx;
      if (lm % 2 === 0) c.fillRect(xa, y0 - b * 0.62, lonMinPx, b * 0.2);
    }
    c.font = '700 ' + Math.max(8, Math.round(b * 0.3)) + 'px Nunito, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (var lm2 = 0; lm2 <= nLon; lm2 += 4) {
      var lon = C.lon0 + lm2;
      var xl = x0 + cw - lm2 * lonMinPx;
      c.fillText(C.lonDeg + '°' + String(lon).padStart(2, '0') + "'W", xl, y0 + ch + b * 0.68);
    }
    var out = { canvas: cv, layout: Lc };
    _bgCache[key] = out;
    return out;
  }

  // Brass-hinged steel dividers. a, b = tip points; hinge = top point.
  function drawDividers(ctx, a, b, hinge, s, active) {
    ctx.save();
    ctx.lineCap = 'round';
    [a, b].forEach(function(t, i) {
      var dx = t[0] - hinge[0], dy = t[1] - hinge[1];
      var L = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / L, ny = dx / L;
      // shadow
      ctx.beginPath(); ctx.moveTo(hinge[0] + 6, hinge[1] + 8); ctx.lineTo(t[0] + 2, t[1] + 3);
      ctx.lineWidth = s * 0.16; ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.stroke();
      // leg: tapered steel
      ctx.beginPath();
      ctx.moveTo(hinge[0] + nx * s * 0.11, hinge[1] + ny * s * 0.11);
      ctx.lineTo(t[0] - dx / L * s * 0.25 + nx * s * 0.03, t[1] - dy / L * s * 0.25 + ny * s * 0.03);
      ctx.lineTo(t[0], t[1]);
      ctx.lineTo(t[0] - dx / L * s * 0.25 - nx * s * 0.03, t[1] - dy / L * s * 0.25 - ny * s * 0.03);
      ctx.lineTo(hinge[0] - nx * s * 0.11, hinge[1] - ny * s * 0.11);
      ctx.closePath();
      var g = ctx.createLinearGradient(hinge[0] + nx * s * 0.1, hinge[1] + ny * s * 0.1, hinge[0] - nx * s * 0.1, hinge[1] - ny * s * 0.1);
      g.addColorStop(0, '#5f6a72'); g.addColorStop(0.45, '#f2f5f7'); g.addColorStop(0.6, '#b9c2c8'); g.addColorStop(1, '#4b545a');
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(30,35,40,0.7)'; ctx.stroke();
      // tip marker
      ctx.beginPath(); ctx.arc(t[0], t[1], s * 0.07, 0, TAU);
      ctx.fillStyle = active === i ? 'rgba(234,88,12,0.9)' : 'rgba(20,20,20,0.85)'; ctx.fill();
    });
    // brass hinge with knurled finger grip
    var hg = ctx.createRadialGradient(hinge[0] - s * 0.05, hinge[1] - s * 0.06, 1, hinge[0], hinge[1], s * 0.2);
    hg.addColorStop(0, '#fff3c2'); hg.addColorStop(0.55, '#d1a23d'); hg.addColorStop(1, '#6b4810');
    ctx.beginPath(); ctx.arc(hinge[0], hinge[1], s * 0.19, 0, TAU); ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = active === 2 ? '#ea580c' : 'rgba(60,40,5,0.8)'; ctx.lineWidth = active === 2 ? 3 : 1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(hinge[0], hinge[1], s * 0.06, 0, TAU); ctx.fillStyle = '#5b3d0a'; ctx.fill();
    ctx.restore();
  }

  // Objects a knot is tied around, ready for drawModel's level ordering.
  function knotObjects(K, devScale) {
    var out = [];
    if (K.scene === 'post' && K.post) {
      var P = K.post;
      out.push({ level: -1,
        draw: function(c) { drawPiling(c, P.x, P.top, 900, P.r, devScale); },
        clip: function(c) { c.rect(P.x - P.r, P.top, P.r * 2, 900); } });
    }
    if (K.scene === 'cleat' && K.cleat) {
      var C = K.cleat;
      out.push({ level: -1,
        draw: function(c) { drawCleat(c, C.x, C.y, C.len, C.wid, devScale); },
        clip: function(c) { cleatPath(c, C.x, C.y, C.len, C.wid); } });
    }
    return out;
  }

  return {
    knotObjects: knotObjects, chartLayout: chartLayout, chartImage: chartImage, drawDividers: drawDividers, flagSVG: flagSVG, harbourBackdrop: harbourBackdrop, drawSea: drawSea, drawBuoy: drawBuoy, drawBow: drawBow, lightOn: lightOn, POINTS16: POINTS16, compassCard: compassCard, drawCompass: drawCompass, drawWheel: drawWheel,
    clamp: clamp, rgb: rgb, shadeC: shadeC, mixC: mixC, rng: rng,
    fitCanvas: fitCanvas, castShadow: castShadow,
    ROPE_COLORS: ROPE_COLORS,
    buildModel: buildModel, drawModel: drawModel, sAtCP: sAtCP, frameAt: frameAt,
    teakDeck: teakDeck, harbourBokeh: harbourBokeh,
    drawPiling: drawPiling, drawPilingEdgeShade: drawPilingEdgeShade, drawCleat: drawCleat
  };
})();
