/* ================================================================
   ART STUDIO — brush engine and drawing surface
   ----------------------------------------------------------------
   One ArtBrush.Surface is a sheet of paper on the desk: a fixed-size
   paint canvas (1440 x 1080, landscape or portrait) shown scaled to
   fit, over a generated paper texture. The brushes imitate real
   media by working WITH the paper's tooth:

     pencil      small stamps filled with a tooth pattern; pressure
                 (pen pressure, or speed for finger and mouse) sets
                 how deep into the grain the graphite reaches
     crayon      the same idea on a coarse tooth: wax only catches
                 the paper's peaks
     chalk       a speckled tooth plus loose dust
     marker      a transparent wash that is even inside one stroke
                 and darkens where strokes overlap (multiply)
     watercolour a wet buffer that, when the stroke ends, becomes a
                 soft bloom, a thin wash, a darker dried rim, pools
                 where the brush rested and granulation in the grain
     oil         a row of bristles, each with its own paint load and
                 shade, ridged highlights, pick-up of wet paint under
                 the brush, and dry-brush break-up as paint runs out
     dots        pointillist dabs
     eraser      soft-edged rubber

   No ctx.filter (Safari on iPad lacks it); blurs are done by scaling
   down and up. Everything is generated in code — no images.
   ================================================================ */

var ArtBrush = (function () {
  'use strict';

  // ── Colour helpers ─────────────────────────────────────────────
  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ''));
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
  }
  function rgbToHex(c) {
    function h(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + h(c.r) + h(c.g) + h(c.b);
  }
  function rgbStr(c, a) {
    return a == null ? 'rgb(' + (c.r | 0) + ',' + (c.g | 0) + ',' + (c.b | 0) + ')'
                     : 'rgba(' + (c.r | 0) + ',' + (c.g | 0) + ',' + (c.b | 0) + ',' + a + ')';
  }
  function lerpRgb(a, b, t) {
    return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
  }
  // f > 0 lightens toward white, f < 0 darkens toward black.
  function shade(c, f) {
    return f >= 0 ? lerpRgb(c, { r: 255, g: 255, b: 255 }, f) : lerpRgb(c, { r: 0, g: 0, b: 0 }, -f);
  }

  // Paint mixing. Averaging RGB turns blue + yellow into grey, which
  // is not what paint does. Instead each colour is turned into a
  // smooth reflectance curve over the visible spectrum (a sigmoid of a
  // quadratic, fitted so it shows exactly that colour), the two curves
  // are mixed per wavelength with the Kubelka-Munk equations (light
  // paints like white and yellow tint more strongly), and the result is
  // turned back into a colour with fitted CIE 1931 matching functions
  // (Wyman, Sloan & Shirley 2013). Blue + yellow gives green,
  // red + white gives pink.
  var SPEC = (function () {
    var L = [], X = [], Y = [], Z = [], U = [], l, i;
    function g(x, m, a, b) { var t = (x - m) / (x < m ? a : b); return Math.exp(-0.5 * t * t); }
    for (l = 380; l <= 730; l += 10) {
      L.push(l);
      X.push(1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2));
      Y.push(0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1));
      Z.push(1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8));
      U.push((l - 555) / 175);
    }
    var M = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]];
    function raw(R) {
      var x = 0, y = 0, z = 0;
      for (i = 0; i < L.length; i++) { x += R[i] * X[i]; y += R[i] * Y[i]; z += R[i] * Z[i]; }
      return [M[0][0] * x + M[0][1] * y + M[0][2] * z, M[1][0] * x + M[1][1] * y + M[1][2] * z, M[2][0] * x + M[2][1] * y + M[2][2] * z];
    }
    var ones = L.map(function () { return 1; }), WH = raw(ones);
    function fwd(R) { var v = raw(R); return [v[0] / WH[0], v[1] / WH[1], v[2] / WH[2]]; }
    function sig(z) { return 0.5 + z / (2 * Math.sqrt(1 + z * z)); }
    function spec(c) { return U.map(function (u) { return sig(c[0] + c[1] * u + c[2] * u * u); }); }
    function solve(A, b) {
      var m = A.map(function (r, k) { return r.concat([b[k]]); }), r, j, k, p;
      for (r = 0; r < 3; r++) {
        p = r; for (j = r + 1; j < 3; j++) if (Math.abs(m[j][r]) > Math.abs(m[p][r])) p = j;
        var tmp = m[r]; m[r] = m[p]; m[p] = tmp;
        if (Math.abs(m[r][r]) < 1e-12) return null;
        for (j = 0; j < 3; j++) if (j !== r) { var f = m[j][r] / m[r][r]; for (k = r; k < 4; k++) m[j][k] -= f * m[r][k]; }
      }
      return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
    }
    var cache = {};
    function curve(hex) {
      if (cache[hex]) return cache[hex];
      var c0 = hexToRgb(hex), t = [c0.r, c0.g, c0.b].map(function (v) { return Math.min(0.995, Math.max(0.003, toLin(v / 255))); });
      var c = [0, 0, 0];
      for (var it = 0; it < 50; it++) {
        var f = fwd(spec(c)), res = [f[0] - t[0], f[1] - t[1], f[2] - t[2]];
        if (Math.abs(res[0]) + Math.abs(res[1]) + Math.abs(res[2]) < 1e-5) break;
        var J = [0, 1, 2].map(function (k) { var cc = c.slice(); cc[k] += 1e-4; var f2 = fwd(spec(cc)); return [(f2[0] - f[0]) / 1e-4, (f2[1] - f[1]) / 1e-4, (f2[2] - f[2]) / 1e-4]; });
        var d = solve([[J[0][0], J[1][0], J[2][0]], [J[0][1], J[1][1], J[2][1]], [J[0][2], J[1][2], J[2][2]]], [-res[0], -res[1], -res[2]]);
        if (!d) break;
        c = [c[0] + Math.max(-5, Math.min(5, d[0])), c[1] + Math.max(-5, Math.min(5, d[1])), c[2] + Math.max(-5, Math.min(5, d[2]))];
      }
      var keys = Object.keys(cache); if (keys.length > 200) delete cache[keys[0]];
      return (cache[hex] = spec(c));
    }
    return { curve: curve, fwd: fwd };
  })();
  function toLin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function toSrgb(v) { v = Math.max(0, Math.min(1, v)); return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; }
  function _ks(r) { r = Math.max(0.001, Math.min(0.999, r)); return (1 - r) * (1 - r) / (2 * r); }
  function _rf(ks) { return 1 + ks - Math.sqrt(ks * ks + 2 * ks); }
  function _lum(hex) { var c = hexToRgb(hex); return 0.2126 * toLin(c.r / 255) + 0.7152 * toLin(c.g / 255) + 0.0722 * toLin(c.b / 255); }
  // t = share of colour B (0..1)
  function mixPaint(hexA, hexB, t) {
    if (t <= 0) return hexA; if (t >= 1) return hexB;
    var A = SPEC.curve(hexA), B = SPEC.curve(hexB);
    var fa = (0.4 + 4 * _lum(hexA)) * (1 - t), fb = (0.4 + 4 * _lum(hexB)) * t;
    var R = A.map(function (v, i) { return _rf((fa * _ks(v) + fb * _ks(B[i])) / (fa + fb)); });
    var o = SPEC.fwd(R);
    return rgbToHex({ r: toSrgb(o[0]) * 255, g: toSrgb(o[1]) * 255, b: toSrgb(o[2]) * 255 });
  }
  // Perceptual-ish distance (weighted RGB, "redmean").
  function colourDistance(hexA, hexB) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    var rm = (a.r + b.r) / 2, dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db) / 3;
  }

  // ── Seeded random + periodic value noise ───────────────────────
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var TILE = 512;
  function _noise(size, cells, rand, out, w) {
    var g = new Float32Array(cells * cells), i, x, y;
    for (i = 0; i < g.length; i++) g[i] = rand();
    var k = cells / size;
    for (y = 0; y < size; y++) {
      var gy = y * k, y0 = Math.floor(gy), fy = gy - y0, y1 = (y0 + 1) % cells;
      fy = fy * fy * (3 - 2 * fy);
      for (x = 0; x < size; x++) {
        var gx = x * k, x0 = Math.floor(gx), fx = gx - x0, x1 = (x0 + 1) % cells;
        fx = fx * fx * (3 - 2 * fx);
        var a = g[y0 * cells + x0], b = g[y0 * cells + x1], c = g[y1 * cells + x0], d = g[y1 * cells + x1];
        out[y * size + x] += w * ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy);
      }
    }
  }
  // Rank-equalise so a threshold of 0.6 means "40% of the paper".
  function _equalise(arr) {
    var n = arr.length, min = Infinity, max = -Infinity, i;
    for (i = 0; i < n; i++) { if (arr[i] < min) min = arr[i]; if (arr[i] > max) max = arr[i]; }
    var bins = new Uint32Array(1024), span = (max - min) || 1;
    for (i = 0; i < n; i++) bins[Math.min(1023, ((arr[i] - min) / span * 1024) | 0)]++;
    var cdf = new Float32Array(1024), acc = 0;
    for (i = 0; i < 1024; i++) { acc += bins[i]; cdf[i] = acc / n; }
    for (i = 0; i < n; i++) arr[i] = cdf[Math.min(1023, ((arr[i] - min) / span * 1024) | 0)];
    return arr;
  }
  var _teeth = {};
  function tooth(kind) {
    if (_teeth[kind]) return _teeth[kind];
    var a = new Float32Array(TILE * TILE);
    var r = rng(kind === 'fine' ? 11 : kind === 'coarse' ? 23 : kind === 'chalk' ? 37 : 51);
    if (kind === 'fine') {        // drawing paper: 2-4 px grain
      _noise(TILE, 256, r, a, 0.42); _noise(TILE, 128, r, a, 0.36); _noise(TILE, 64, r, a, 0.22);
    } else if (kind === 'coarse') { // crayon on cartridge paper: 6-10 px bumps
      _noise(TILE, 128, r, a, 0.44); _noise(TILE, 64, r, a, 0.36); _noise(TILE, 256, r, a, 0.20);
    } else if (kind === 'chalk') {  // pastel paper: sharp speckle
      _noise(TILE, 256, r, a, 0.50); _noise(TILE, 128, r, a, 0.28); _noise(TILE, 48, r, a, 0.22);
    } else {                        // watercolour granulation
      _noise(TILE, 128, r, a, 0.5); _noise(TILE, 64, r, a, 0.25); _noise(TILE, 256, r, a, 0.25);
    }
    _teeth[kind] = _equalise(a);
    return _teeth[kind];
  }

  // A tile coloured with `hex` whose alpha is the tooth above a
  // threshold. Used as a fillStyle pattern: patterns are anchored to
  // the canvas, so the grain stays fixed to the paper as you draw.
  var _tileCache = [];
  function toothTile(kind, hex, lo, hi, invert) {
    var key = kind + hex + lo + hi + (invert ? 'i' : '');
    for (var i = 0; i < _tileCache.length; i++) if (_tileCache[i].key === key) return _tileCache[i].c;
    var t = tooth(kind), c = document.createElement('canvas');
    c.width = c.height = TILE;
    var ctx = c.getContext('2d'), img = ctx.createImageData(TILE, TILE), d = img.data, rgb = hexToRgb(hex);
    for (var p = 0, q = 0; p < t.length; p++, q += 4) {
      var v = invert ? 1 - t[p] : t[p];
      var a = v <= lo ? 0 : v >= hi ? 1 : (v - lo) / (hi - lo);
      a = a * a * (3 - 2 * a);
      d[q] = rgb.r; d[q + 1] = rgb.g; d[q + 2] = rgb.b; d[q + 3] = a * 255;
    }
    ctx.putImageData(img, 0, 0);
    _tileCache.unshift({ key: key, c: c });
    if (_tileCache.length > 36) _tileCache.pop();
    return c;
  }

  // The sheet itself: warm off-white with fine grain, a little
  // mottling and a few fibres. Returned as a data URL for CSS.
  var _paperUrl = null;
  var PAPER_RGB = { r: 251, g: 248, b: 240 };
  function paperDataUrl() {
    if (_paperUrl) return _paperUrl;
    var t = tooth('fine'), co = tooth('coarse');
    var c = document.createElement('canvas'); c.width = c.height = TILE;
    var ctx = c.getContext('2d'), img = ctx.createImageData(TILE, TILE), d = img.data;
    var mot = new Float32Array(TILE * TILE); _noise(TILE, 8, rng(5), mot, 1);
    for (var p = 0, q = 0; p < t.length; p++, q += 4) {
      var s = (1 - t[p]) * 9 + (1 - co[p]) * 3 + mot[p] * 3;
      d[q] = PAPER_RGB.r - s; d[q + 1] = PAPER_RGB.g - s * 1.02; d[q + 2] = PAPER_RGB.b - s * 1.1; d[q + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var r = rng(77);
    ctx.lineCap = 'round';
    for (var f = 0; f < 90; f++) {
      var x = r() * TILE, y = r() * TILE, a = r() * Math.PI * 2, len = 6 + r() * 22;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(120,100,70,0.07)' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.6 + r() * 0.6;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * len * 0.5 + (r() - 0.5) * 6,
        x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    _paperUrl = c.toDataURL('image/png');
    return _paperUrl;
  }

  // Soft round sprite (for the eraser and watercolour pools).
  var _soft = null;
  function softSprite() {
    if (_soft) return _soft;
    _soft = document.createElement('canvas'); _soft.width = _soft.height = 128;
    var x = _soft.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return _soft;
  }

  // ── Media table ────────────────────────────────────────────────
  // widths are in paper pixels for size levels 1..5
  var MEDIA = {
    pencil:      { label: 'Pencil',      widths: [2.4, 3.6, 5.5, 8, 12] },
    crayon:      { label: 'Wax crayon',  widths: [8, 12, 17, 25, 36] },
    chalk:       { label: 'Chalk',       widths: [9, 15, 22, 32, 46] },
    marker:      { label: 'Marker',      widths: [5, 9, 14, 21, 32] },
    watercolour: { label: 'Watercolour', widths: [11, 19, 30, 46, 66] },
    oil:         { label: 'Oil paint',   widths: [10, 17, 27, 40, 58] },
    dots:        { label: 'Dot brush',   widths: [5, 8, 12, 17, 24] },
    eraser:      { label: 'Eraser',      widths: [9, 17, 28, 44, 66] }
  };

  function _work(n, w, h) {
    var c = _work.pool[n] || (_work.pool[n] = document.createElement('canvas'));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    else c.getContext('2d').clearRect(0, 0, w, h);
    return c;
  }
  _work.pool = [];

  // Blur by shrinking and growing again (bilinear) — no ctx.filter.
  function _blurInto(dst, src, k) {
    var w = src.width, h = src.height;
    var sw = Math.max(1, Math.round(w / k)), sh = Math.max(1, Math.round(h / k));
    var s = _work(9, sw, sh), sx = s.getContext('2d');
    sx.imageSmoothingEnabled = true;
    sx.drawImage(src, 0, 0, sw, sh);
    var dx = dst.getContext('2d');
    dx.imageSmoothingEnabled = true;
    dx.drawImage(s, 0, 0, sw, sh, 0, 0, w, h);
  }

  // Each medium: begin(S, B, p), seg(S, B, a, b), end(S, B).
  // S = the shared stroke, B = one copy's own state (mirror mode
  // draws a second, reflected copy with its own state).
  function _walk(B, a, b, step, fn) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.0001) return;
    var t = B.rem;
    while (t <= len) {
      var u = t / len;
      fn(a.x + dx * u, a.y + dy * u, a.p + (b.p - a.p) * u, dx / len, dy / len);
      t += step(a.p + (b.p - a.p) * u);
    }
    B.rem = t - len;
  }

  var ENGINE = {
    pencil: {
      begin: function (S, B, p) {
        var ctx = S.paint;
        B.light = ctx.createPattern(toothTile('fine', S.hex, 0.50, 0.92), 'repeat');
        B.heavy = ctx.createPattern(toothTile('fine', S.hex, 0.16, 0.62), 'repeat');
        B.rem = 0;
        this._stamp(S, B, p.x, p.y, p.p);
      },
      _stamp: function (S, B, x, y, p) {
        var ctx = S.paint, r = S.w * (0.32 + 0.42 * p);
        ctx.globalAlpha = 0.16 + 0.56 * p;
        ctx.fillStyle = p > 0.62 ? B.heavy : B.light;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
        S.mark(x, y, r + 1);
      },
      seg: function (S, B, a, b) {
        var self = this;
        _walk(B, a, b, function () { return Math.max(0.5, S.w * 0.2); }, function (x, y, p) { self._stamp(S, B, x, y, p); });
      },
      end: function (S) { S.paint.globalAlpha = 1; }
    },

    crayon: {
      begin: function (S, B, p) {
        var ctx = S.paint;
        B.light = ctx.createPattern(toothTile('coarse', S.hex, 0.40, 0.56), 'repeat');
        B.heavy = ctx.createPattern(toothTile('coarse', S.hex, 0.16, 0.36), 'repeat');
        B.rem = 0; B.r = S.rand;
        this._stamp(S, B, p.x, p.y, p.p, 1, 0);
      },
      _stamp: function (S, B, x, y, p, dx, dy) {
        var ctx = S.paint, r = S.w * 0.5 * (0.82 + 0.25 * p) * (0.92 + B.r() * 0.12);
        ctx.globalAlpha = 0.6 + 0.4 * p;
        ctx.fillStyle = p > 0.58 ? B.heavy : B.light;
        ctx.beginPath();
        // a crayon tip is a worn, slightly flattened oval
        var ang = Math.atan2(dy, dx);
        if (ctx.ellipse) ctx.ellipse(x, y, r, r * 0.78, ang + Math.PI / 2, 0, 6.2832);
        else ctx.arc(x, y, r, 0, 6.2832);
        ctx.fill();
        S.mark(x, y, r + 1);
      },
      seg: function (S, B, a, b) {
        var self = this;
        _walk(B, a, b, function () { return Math.max(0.8, S.w * 0.12); }, function (x, y, p, dx, dy) { self._stamp(S, B, x, y, p, dx, dy); });
      },
      end: function (S) { S.paint.globalAlpha = 1; }
    },

    chalk: {
      begin: function (S, B, p) {
        var ctx = S.paint;
        B.light = ctx.createPattern(toothTile('chalk', S.hex, 0.52, 0.64), 'repeat');
        B.heavy = ctx.createPattern(toothTile('chalk', S.hex, 0.30, 0.48), 'repeat');
        B.rem = 0; B.r = S.rand;
        this._stamp(S, B, p.x, p.y, p.p);
      },
      _stamp: function (S, B, x, y, p) {
        var ctx = S.paint, r = S.w * 0.5 * (0.85 + 0.2 * p), R = B.r;
        ctx.globalAlpha = 0.42 + 0.4 * p;
        ctx.fillStyle = p > 0.6 ? B.heavy : B.light;
        ctx.beginPath(); ctx.arc(x + (R() - 0.5) * 2, y + (R() - 0.5) * 2, r, 0, 6.2832); ctx.fill();
        // loose dust beyond the stick's edge
        ctx.fillStyle = S.hex;
        for (var i = 0; i < 3; i++) {
          var a = R() * 6.2832, d = r * (0.85 + R() * 0.5), s = 0.8 + R() * 1.6;
          ctx.globalAlpha = 0.25 + R() * 0.35;
          ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s);
        }
        S.mark(x, y, r * 1.4 + 2);
      },
      seg: function (S, B, a, b) {
        var self = this;
        _walk(B, a, b, function () { return Math.max(0.8, S.w * 0.14); }, function (x, y, p) { self._stamp(S, B, x, y, p); });
      },
      end: function (S) { S.paint.globalAlpha = 1; }
    },

    marker: {
      begin: function (S, B, p) {
        var w = S.wetCtx();
        w.lineCap = 'round'; w.lineJoin = 'round';
        w.strokeStyle = S.hex; w.fillStyle = S.hex; w.globalAlpha = 1;
        w.beginPath(); w.arc(p.x, p.y, S.w / 2, 0, 6.2832); w.fill();
        S.mark(p.x, p.y, S.w);
        B.start = { x: p.x, y: p.y }; B.last = p;
      },
      seg: function (S, B, a, b) {
        var w = S.wetCtx();
        w.lineWidth = S.w;
        w.beginPath(); w.moveTo(a.x, a.y); w.lineTo(b.x, b.y); w.stroke();
        S.mark(b.x, b.y, S.w);
        B.last = b;
      },
      end: function (S, B) {
        // a felt tip leaves a little more ink where it lands and lifts
        var w = S.wetCtx(), dark = rgbStr(shade(S.rgb, -0.18), 0.5);
        w.fillStyle = dark;
        [B.start, B.last].forEach(function (q) {
          if (!q) return;
          w.beginPath(); w.arc(q.x, q.y, S.w * 0.42, 0, 6.2832); w.fill();
        });
      },
      commit: function (S, R) {
        var ctx = S.paint;
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.82;
        ctx.drawImage(S.wet, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      },
      wetStyle: { opacity: 0.82, blend: 'multiply' }
    },

    watercolour: {
      begin: function (S, B, p) {
        var w = S.wetCtx();
        w.lineCap = 'round'; w.lineJoin = 'round'; w.strokeStyle = S.hex; w.fillStyle = S.hex; w.globalAlpha = 1;
        B.d = 0; B.r = S.rand; B.pools = S.pools || (S.pools = []);
        B.wob = new Float32Array(16); for (var i = 0; i < 16; i++) B.wob[i] = B.r();
        w.beginPath(); w.arc(p.x, p.y, S.w * 0.45, 0, 6.2832); w.fill();
        S.mark(p.x, p.y, S.w * 1.6);
        B.last = p; B.still = 0;
      },
      seg: function (S, B, a, b) {
        var w = S.wetCtx();
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
        B.d += len;
        // the loaded brush swells and narrows as it travels
        var k = B.d / (S.w * 3), i0 = Math.floor(k) & 15, f = k - Math.floor(k);
        var wob = B.wob[i0] + (B.wob[(i0 + 1) & 15] - B.wob[i0]) * f;
        w.lineWidth = S.w * (0.7 + 0.45 * b.p) * (0.8 + 0.4 * wob);
        w.beginPath(); w.moveTo(a.x, a.y); w.lineTo(b.x, b.y); w.stroke();
        S.mark(b.x, b.y, S.w * 1.6);
        // slow brush = more water and pigment settles there
        if (len < S.w * 0.05) { B.still++; if (B.still === 6) B.pools.push({ x: b.x, y: b.y, r: S.w * 0.7 }); }
        else B.still = 0;
        B.last = b;
      },
      end: function (S, B) {
        if (B.last) B.pools.push({ x: B.last.x, y: B.last.y, r: S.w * 0.55 });
      },
      commit: function (S, R) {
        var W = R.w, H = R.h;
        if (W < 2 || H < 2) return;
        var m = _work(0, W, H), mx = m.getContext('2d');
        mx.drawImage(S.wet, R.x, R.y, W, H, 0, 0, W, H);

        var soft = _work(1, W, H); _blurInto(soft, m, Math.max(4, S.w / 3));
        var inner = _work(2, W, H); _blurInto(inner, m, Math.max(2, S.w / 9));

        var f = _work(3, W, H), fx = f.getContext('2d');
        // 1. soft bloom where the water spread into the paper
        fx.globalAlpha = 0.20; fx.drawImage(soft, 0, 0);
        // 2. the thin wash itself
        fx.globalAlpha = 0.30; fx.drawImage(m, 0, 0);
        // 3. pigment drying darker at the edge of the wet area
        var rim = _work(4, W, H), rx = rim.getContext('2d');
        rx.drawImage(m, 0, 0);
        rx.globalCompositeOperation = 'destination-out'; rx.drawImage(inner, 0, 0);
        rx.globalCompositeOperation = 'source-in'; rx.fillStyle = rgbStr(shade(S.rgb, -0.22)); rx.fillRect(0, 0, W, H);
        rx.globalCompositeOperation = 'source-over';
        fx.globalAlpha = 0.75; fx.drawImage(rim, 0, 0);
        // 4. pools where the brush rested
        var pools = S.pools || [];
        if (pools.length) {
          var pc = _work(5, W, H), px = pc.getContext('2d');
          pools.forEach(function (q) {
            var g = px.createRadialGradient(q.x - R.x, q.y - R.y, 0, q.x - R.x, q.y - R.y, q.r);
            g.addColorStop(0, rgbStr(shade(S.rgb, -0.12), 0.5)); g.addColorStop(1, rgbStr(S.rgb, 0));
            px.fillStyle = g; px.fillRect(q.x - R.x - q.r, q.y - R.y - q.r, q.r * 2, q.r * 2);
          });
          px.globalCompositeOperation = 'destination-in'; px.drawImage(m, 0, 0); px.globalCompositeOperation = 'source-over';
          fx.globalAlpha = 1; fx.drawImage(pc, 0, 0);
        }
        // 5. granulation: pigment settles in the paper's valleys
        fx.globalAlpha = 0.3;
        fx.globalCompositeOperation = 'destination-out';
        var gp = fx.createPattern(toothTile('gran', '#000000', 0.45, 0.95), 'repeat');
        fx.save(); fx.translate(-R.x, -R.y); fx.fillStyle = gp; fx.fillRect(R.x, R.y, W, H); fx.restore();
        fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = 1;

        var ctx = S.paint;
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(f, R.x, R.y);
        ctx.globalCompositeOperation = 'source-over';
        S.pools = [];
      },
      wetStyle: { opacity: 0.38, blend: 'multiply' }
    },

    oil: {
      begin: function (S, B, p) {
        var R = S.rand, n = Math.max(7, Math.min(30, Math.round(S.w / 2)));
        // wet paint under the brush gets picked up and mixed in
        var pick = S.sample(p.x, p.y, Math.max(2, S.w * 0.25));
        B.pick = pick; B.pickK = pick ? 0.42 : 0;
        B.br = [];
        for (var i = 0; i < n; i++) {
          var c = shade(S.rgb, (R() - 0.5) * 0.24);
          B.br.push({
            o: ((i + 0.5) / n - 0.5) + (R() - 0.5) * 1.1 / n,
            t: Math.max(1, S.w / n * (1.3 + R() * 0.9)),
            c: c, load: 0.85 + R() * 0.3, rate: 0.7 + R() * 0.7, ridge: R() < 0.28, a: 0.7 + R() * 0.3
          });
        }
        B.nx = 0; B.ny = -1; B.has = false; B.dist = 0;
        B.reach = (S.w * 45 + 500) * (0.75 + 0.5 * p.p);
        S.mark(p.x, p.y, S.w);
      },
      seg: function (S, B, a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.3) return;
        var nx = -dy / len, ny = dx / len;
        if (!B.has) { B.nx = nx; B.ny = ny; B.has = true; }
        // keep the brush from flipping over on tight turns
        if (nx * B.nx + ny * B.ny < 0) { nx = -nx; ny = -ny; }
        var pnx = B.nx, pny = B.ny;
        B.nx = B.nx * 0.6 + nx * 0.4; B.ny = B.ny * 0.6 + ny * 0.4;
        var nl = Math.sqrt(B.nx * B.nx + B.ny * B.ny) || 1; B.nx /= nl; B.ny /= nl;
        B.dist += len;
        var ctx = S.paint, R = S.rand;
        var spreadA = S.w * (0.62 + 0.42 * a.p), spreadB = S.w * (0.62 + 0.42 * b.p);
        var pk = B.pickK * Math.max(0, 1 - B.dist / (S.w * 8));
        // light comes from the upper left
        var lightSide = (B.nx * -0.7 + B.ny * -0.7) > 0 ? 1 : -1;
        ctx.lineCap = 'round';
        for (var i = 0; i < B.br.length; i++) {
          var q = B.br[i];
          q.load -= len / B.reach * q.rate;
          var ld = q.load;
          if (ld <= 0.05) continue;
          if (ld < 0.4 && R() > ld / 0.4) continue;   // dry brush skips
          var c = pk > 0 ? lerpRgb(q.c, B.pick, pk) : q.c;
          var x0 = a.x + pnx * q.o * spreadA, y0 = a.y + pny * q.o * spreadA;
          var x1 = b.x + B.nx * q.o * spreadB, y1 = b.y + B.ny * q.o * spreadB;
          ctx.globalAlpha = Math.min(1, (0.55 + ld * 0.5) * q.a);
          ctx.strokeStyle = rgbStr(c);
          ctx.lineWidth = q.t * (ld < 0.4 ? 0.7 : 1);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          if (q.ridge && ld > 0.3) {          // ridge highlight + shadow
            var off = q.t * 0.35 * lightSide;
            ctx.globalAlpha = 0.26;
            ctx.strokeStyle = rgbStr(shade(c, 0.45));
            ctx.lineWidth = Math.max(0.6, q.t * 0.3);
            ctx.beginPath(); ctx.moveTo(x0 + pnx * off, y0 + pny * off); ctx.lineTo(x1 + B.nx * off, y1 + B.ny * off); ctx.stroke();
            ctx.globalAlpha = 0.18;
            ctx.strokeStyle = rgbStr(shade(c, -0.35));
            ctx.beginPath(); ctx.moveTo(x0 - pnx * off, y0 - pny * off); ctx.lineTo(x1 - B.nx * off, y1 - B.ny * off); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        S.mark(b.x, b.y, S.w);
      },
      end: function (S) { S.paint.globalAlpha = 1; }
    },

    dots: {
      begin: function (S, B, p) { B.rem = 0; B.r = S.rand; this._dot(S, B, p.x, p.y); B.rem = 0; },
      _dot: function (S, B, x, y) {
        var ctx = S.paint, R = B.r, r = S.w * 0.5 * (0.8 + R() * 0.35);
        var c = shade(S.rgb, (R() - 0.5) * 0.14);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = rgbStr(c);
        ctx.beginPath();
        if (ctx.ellipse) ctx.ellipse(x, y, r, r * (0.72 + R() * 0.28), R() * 3.14, 0, 6.2832);
        else ctx.arc(x, y, r, 0, 6.2832);
        ctx.fill();
        // a touch of paint thickness
        ctx.globalAlpha = 0.25; ctx.fillStyle = rgbStr(shade(c, 0.5));
        ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        S.mark(x, y, r + 1);
      },
      seg: function (S, B, a, b) {
        var self = this;
        _walk(B, a, b, function () { return S.w * 1.75; }, function (x, y) {
          self._dot(S, B, x + (B.r() - 0.5) * S.w * 0.5, y + (B.r() - 0.5) * S.w * 0.5);
        });
      },
      end: function () {}
    },

    eraser: {
      begin: function (S, B, p) { B.rem = 0; this._rub(S, p.x, p.y); },
      _rub: function (S, x, y) {
        var ctx = S.paint, r = S.w / 2;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 0.9;
        ctx.drawImage(softSprite(), x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        S.mark(x, y, r * 1.3);
      },
      seg: function (S, B, a, b) {
        var self = this;
        _walk(B, a, b, function () { return Math.max(1, S.w * 0.15); }, function (x, y) { self._rub(S, x, y); });
      },
      end: function () {}
    },

    // Lesson tool: colour the cells of a 16 x 16 grid in the centre square.
    pixel: {
      begin: function (S, B, p) { B.done = {}; this._cell(S, B, p.x, p.y); },
      _cell: function (S, B, x, y) {
        var g = S.surface.squareGrid(16), col = Math.floor((x - g.x) / g.cell), row = Math.floor((y - g.y) / g.cell);
        if (col < 0 || row < 0 || col >= 16 || row >= 16) return;
        var k = col + ',' + row;
        if (B.done[k]) return;
        B.done[k] = 1;
        var ctx = S.paint;
        ctx.fillStyle = S.hex;
        ctx.fillRect(Math.floor(g.x + col * g.cell), Math.floor(g.y + row * g.cell), Math.ceil(g.cell), Math.ceil(g.cell));
        S.mark(g.x + (col + 0.5) * g.cell, g.y + (row + 0.5) * g.cell, g.cell);
      },
      seg: function (S, B, a, b) {
        var self = this, B2 = { rem: 0 };
        _walk(B2, a, b, function () { return 3; }, function (x, y) { self._cell(S, B, x, y); });
        self._cell(S, B, b.x, b.y);
      },
      end: function () {}
    }
  };

  // ── Surface ────────────────────────────────────────────────────
  var LONG = 1440, SHORT = 1080;
  var UNDO_LIMIT = 30, UNDO_BYTES = 90 * 1024 * 1024;

  function Surface(host, opts) {
    opts = opts || {};
    this.host = host;
    this.opts = opts;
    var stageW = host.clientWidth || 800, stageH = host.clientHeight || 600;
    this.landscape = opts.landscape != null ? !!opts.landscape : stageW >= stageH * 0.9;
    this.W = this.landscape ? LONG : SHORT;
    this.H = this.landscape ? SHORT : LONG;

    host.innerHTML =
      '<div class="as-stage">' +
        '<div class="as-sheet">' +
          '<div class="as-under"></div>' +
          '<canvas class="as-c-paint"></canvas>' +
          '<canvas class="as-c-wet"></canvas>' +
          '<div class="as-over"></div>' +
          '<div class="as-shape-layer"></div>' +
        '</div>' +
      '</div>';
    this.stage = host.querySelector('.as-stage');
    this.sheet = host.querySelector('.as-sheet');
    this.under = host.querySelector('.as-under');
    this.over = host.querySelector('.as-over');
    this.shapeLayer = host.querySelector('.as-shape-layer');
    this.paintC = host.querySelector('.as-c-paint');
    this.wetC = host.querySelector('.as-c-wet');
    this.paintC.width = this.wetC.width = this.W;
    this.paintC.height = this.wetC.height = this.H;
    this.paint = this.paintC.getContext('2d', { willReadFrequently: false });
    this.wet = null;
    this.before = document.createElement('canvas');
    this.before.width = this.W; this.before.height = this.H;
    this.sheet.style.backgroundImage = 'url(' + paperDataUrl() + ')';

    this.media = 'pencil';
    this.hex = '#2B2A28';
    this.level = 2;
    this.smoothing = opts.smoothing != null ? opts.smoothing : 0.45;
    this.mirror = false;
    this.shape = null;          // 'line' | 'rect' | 'ellipse' when the shape tool is on
    this.snap = false;          // straight horizontal/vertical lines (Mondrian)
    this.zoom = 1; this.panX = 0; this.panY = 0;
    this.undoStack = []; this.redoStack = []; this.undoBytes = 0;
    this.penSeen = false;
    this.pointers = {};
    this.stroke = null;
    this.gesture = null;
    this.hand = false;
    this.listeners = {};
    this._seed = 1;

    this._bind();
    this.fit();
    var self = this;
    if (typeof ResizeObserver === 'function') {
      this._ro = new ResizeObserver(function () { self.fit(); });
      this._ro.observe(host);
    } else {
      this._onWin = function () { self.fit(); };
      window.addEventListener('resize', this._onWin);
    }
  }

  Surface.prototype.on = function (ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); };
  Surface.prototype.emit = function (ev, arg) { (this.listeners[ev] || []).forEach(function (f) { try { f(arg); } catch (e) { setTimeout(function () { throw e; }); } }); };

  Surface.prototype.destroy = function () {
    if (this._ro) this._ro.disconnect();
    if (this._onWin) window.removeEventListener('resize', this._onWin);
    window.removeEventListener('keydown', this._key);
    window.removeEventListener('keyup', this._keyUp);
    this.paintC.width = this.wetC.width = this.before.width = 1;
    this.undoStack = []; this.redoStack = [];
    this.host.innerHTML = '';
    this.destroyed = true;
  };

  Surface.prototype.fit = function () {
    if (this.destroyed) return;
    var r = this.stage.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    var pad = r.width < 500 ? 6 : 14;
    var s = Math.min((r.width - pad * 2) / this.W, (r.height - pad * 2) / this.H);
    this.cssW = Math.max(40, Math.floor(this.W * s));
    this.cssH = Math.max(30, Math.floor(this.H * s));
    this.sheet.style.width = this.cssW + 'px';
    this.sheet.style.height = this.cssH + 'px';
    this.sheet.style.left = Math.round((r.width - this.cssW) / 2) + 'px';
    this.sheet.style.top = Math.round((r.height - this.cssH) / 2) + 'px';
    this.sheet.style.backgroundSize = (TILE * s).toFixed(1) + 'px';
    this._applyView();
  };

  Surface.prototype._applyView = function () {
    var maxX = this.cssW * (this.zoom - 1) / 2 + this.cssW * 0.25, maxY = this.cssH * (this.zoom - 1) / 2 + this.cssH * 0.25;
    if (this.zoom <= 1.001) { this.panX = 0; this.panY = 0; }
    this.panX = Math.max(-maxX, Math.min(maxX, this.panX));
    this.panY = Math.max(-maxY, Math.min(maxY, this.panY));
    this.sheet.style.transform = 'translate(' + this.panX.toFixed(1) + 'px,' + this.panY.toFixed(1) + 'px) scale(' + this.zoom.toFixed(3) + ')';
    this.stage.classList.toggle('zoomed', this.zoom > 1.001);
    this.emit('view', this.zoom);
  };

  Surface.prototype.zoomAt = function (factor, cx, cy) {
    var r = this.stage.getBoundingClientRect();
    if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
    var z0 = this.zoom, z1 = Math.max(1, Math.min(6, z0 * factor));
    // keep the point under (cx, cy) still
    var ox = r.left + parseFloat(this.sheet.style.left) + this.cssW / 2 + this.panX;
    var oy = r.top + parseFloat(this.sheet.style.top) + this.cssH / 2 + this.panY;
    var ux = (cx - ox) / z0, uy = (cy - oy) / z0;
    this.panX += (cx - ox) - ux * z1; this.panY += (cy - oy) - uy * z1;
    this.zoom = z1;
    this._applyView();
  };
  Surface.prototype.resetView = function () { this.zoom = 1; this.panX = this.panY = 0; this._applyView(); };

  Surface.prototype.toPaper = function (e) {
    var r = this.paintC.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H };
  };
  // paper px per CSS px at the current zoom
  Surface.prototype.paperScale = function () { return this.W / (this.cssW * this.zoom); };

  Surface.prototype.wetCtx = function () {
    if (!this.wet) this.wet = this.wetC.getContext('2d');
    return this.wet;
  };

  Surface.prototype.squareGrid = function (n) {
    var s = Math.min(this.W, this.H) * 100 / 108;
    return { x: (this.W - s) / 2, y: (this.H - s) / 2, size: s, cell: s / n };
  };

  Surface.prototype.setMedia = function (m) { if (ENGINE[m]) { this.media = m; this.shape = null; this.fillMode = false; this._cursor(); } };
  Surface.prototype.setColour = function (hex) { this.hex = hex; };
  Surface.prototype.setLevel = function (n) { this.level = Math.max(1, Math.min(5, n | 0)); };
  Surface.prototype.setShape = function (kind) { this.shape = kind || null; if (kind) this.fillMode = false; this._cursor(); };
  // Lesson guides use a 0..100 square in the middle of the sheet.
  Surface.prototype.guideToPaper = function (u, v) { var g = this.squareGrid(1); return { x: g.x + u * g.size / 100, y: g.y + v * g.size / 100 }; };
  Surface.prototype.guideUnit = function () { return this.squareGrid(1).size / 100; };
  Surface.prototype.setFill = function (on) { this.fillMode = !!on; if (on) this.shape = null; };
  Surface.prototype.setHand = function (on) { this.hand = !!on; this._cursor(); };
  Surface.prototype._cursor = function () {
    this.stage.classList.toggle('hand', this.hand);
  };
  Surface.prototype.width = function () {
    var m = MEDIA[this.media] || MEDIA.pencil;
    return m.widths[this.level - 1];
  };

  // ── Input ──────────────────────────────────────────────────────
  Surface.prototype._bind = function () {
    var self = this, st = this.stage;
    st.addEventListener('pointerdown', function (e) { self._down(e); });
    st.addEventListener('pointermove', function (e) { self._move(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) { st.addEventListener(t, function (e) { self._up(e, t === 'pointercancel'); }); });
    st.addEventListener('lostpointercapture', function (e) { if (self.pointers[e.pointerId]) self._up(e, false); });
    st.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); self.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }
      else if (self.zoom > 1.001) { e.preventDefault(); self.panX -= e.deltaX; self.panY -= e.deltaY; self._applyView(); }
    }, { passive: false });
    // Safari's own pinch gestures would zoom the whole page
    ['gesturestart', 'gesturechange'].forEach(function (t) { st.addEventListener(t, function (e) { e.preventDefault(); }); });
    this._space = false;
    this._key = function (e) {
      if (e.code === 'Space' && !/input|textarea/i.test((e.target && e.target.tagName) || '')) {
        if (!self._space && self.host.offsetParent) { self._space = true; self.stage.classList.add('hand'); }
        if (self.host.offsetParent) e.preventDefault();
      }
    };
    this._keyUp = function (e) { if (e.code === 'Space') { self._space = false; self._cursor(); } };
    window.addEventListener('keydown', this._key);
    window.addEventListener('keyup', this._keyUp);
  };

  Surface.prototype._pressure = function (e, P) {
    if (e.pointerType === 'pen' && e.pressure > 0) return Math.max(0.05, Math.min(1, e.pressure));
    // finger and mouse: fast strokes press lighter
    var now = e.timeStamp || Date.now();
    var dt = Math.max(1, now - (P.t || now - 16)), dx = e.clientX - (P.cx || e.clientX), dy = e.clientY - (P.cy || e.clientY);
    var v = Math.sqrt(dx * dx + dy * dy) / dt;          // CSS px per ms
    var target = Math.max(0.3, Math.min(0.85, 0.85 - v * 0.22));
    P.t = now; P.cx = e.clientX; P.cy = e.clientY;
    P.p = P.p == null ? 0.55 : P.p + (target - P.p) * 0.18;
    return P.p;
  };

  Surface.prototype._down = function (e) {
    if (e.button > 0) return;
    e.preventDefault();
    try { this.stage.setPointerCapture(e.pointerId); } catch (_) {}
    if (e.pointerType === 'pen') this.penSeen = true;
    this.pointers[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
    var ids = Object.keys(this.pointers);
    if (ids.length >= 2) {
      if (this.stroke) this._cancelStroke();
      this._startPinch();
      return;
    }
    var panOnly = this.hand || this._space || (this.penSeen && e.pointerType === 'touch');
    if (panOnly) {
      this.gesture = { kind: 'pan', id: e.pointerId, x: e.clientX, y: e.clientY, px: this.panX, py: this.panY };
      return;
    }
    if (this.locked) { this.emit('locked'); return; }
    if (this.fillMode) { delete this.pointers[e.pointerId]; this.fillAt(e.clientX, e.clientY, this.hex); return; }
    this._beginStroke(e);
  };

  Surface.prototype._move = function (e) {
    var P = this.pointers[e.pointerId];
    if (!P) return;
    P.x = e.clientX; P.y = e.clientY;
    if (this.gesture) {
      e.preventDefault();
      if (this.gesture.kind === 'pinch') this._updatePinch();
      else if (this.gesture.id === e.pointerId) {
        this.panX = this.gesture.px + (e.clientX - this.gesture.x);
        this.panY = this.gesture.py + (e.clientY - this.gesture.y);
        this._applyView();
      }
      return;
    }
    if (!this.stroke || this.stroke.id !== e.pointerId) return;
    e.preventDefault();
    var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (!list.length) list = [e];
    for (var i = 0; i < list.length; i++) this._addPoint(list[i]);
  };

  Surface.prototype._up = function (e, cancelled) {
    if (!this.pointers[e.pointerId]) return;
    delete this.pointers[e.pointerId];
    if (this.gesture) {
      if (!Object.keys(this.pointers).length) this.gesture = null;
      else if (this.gesture.kind === 'pinch') this.gesture = null;
      return;
    }
    if (this.stroke && this.stroke.id === e.pointerId) {
      if (cancelled && e.pointerType === 'touch' && this.stroke.n < 3) this._cancelStroke();
      else this._endStroke(e);
    }
  };

  Surface.prototype._startPinch = function () {
    var ids = Object.keys(this.pointers), a = this.pointers[ids[0]], b = this.pointers[ids[1]];
    this.gesture = {
      kind: 'pinch', a: ids[0], b: ids[1],
      d0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), z0: this.zoom,
      mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, px: this.panX, py: this.panY
    };
  };
  Surface.prototype._updatePinch = function () {
    var g = this.gesture, a = this.pointers[g.a], b = this.pointers[g.b];
    if (!a || !b) return;
    var d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var z1 = Math.max(1, Math.min(6, g.z0 * d / g.d0));
    var r = this.stage.getBoundingClientRect();
    var cx = r.left + parseFloat(this.sheet.style.left) + this.cssW / 2, cy = r.top + parseFloat(this.sheet.style.top) + this.cssH / 2;
    var ux = (g.mx - cx - g.px) / g.z0, uy = (g.my - cy - g.py) / g.z0;
    this.zoom = z1;
    this.panX = mx - cx - ux * z1;
    this.panY = my - cy - uy * z1;
    this._applyView();
  };

  // ── Strokes ────────────────────────────────────────────────────
  Surface.prototype._beginStroke = function (e) {
    var self = this;
    var bx = this.before.getContext('2d');
    bx.clearRect(0, 0, this.W, this.H);
    bx.drawImage(this.paintC, 0, 0);
    var p0 = this.toPaper(e);
    var P = {};
    var pr = this._pressure(e, P);
    var seed = (this._seed = (this._seed * 16807) % 2147483647);
    var S = {
      surface: this, id: e.pointerId, n: 0,
      media: this.media, hex: this.hex, rgb: hexToRgb(this.hex), w: this.width(),
      paint: this.paint, wet: this.wetC, rand: rng(seed),
      bbox: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
      P: P, raw: p0, sm: { x: p0.x, y: p0.y, p: pr }, start: p0,
      wetCtx: function () { return self.wetCtx(); },
      mark: function (x, y, r) {
        var b = S.bbox;
        if (x - r < b.x0) b.x0 = x - r; if (y - r < b.y0) b.y0 = y - r;
        if (x + r > b.x1) b.x1 = x + r; if (y + r > b.y1) b.y1 = y + r;
      },
      sample: function (x, y, r) { return self._sample(x, y, r); }
    };
    this.stroke = S;
    if (this.shape) {
      S.shape = this.shape; S.end = p0;
      this._drawShapePreview();
      return;
    }
    var eng = ENGINE[S.media];
    var ws = eng.wetStyle;
    this.wetC.style.opacity = ws ? ws.opacity : 1;
    this.wetC.style.mixBlendMode = ws ? ws.blend : 'normal';
    S.copies = [{ B: {}, tf: null }];
    if (this.mirror) S.copies.push({ B: {}, tf: this.W });
    S.copies.forEach(function (cp) { eng.begin(S, cp.B, self._tf(cp, { x: p0.x, y: p0.y, p: pr })); });
    this.emit('strokestart');
  };

  Surface.prototype._tf = function (cp, p) { return cp.tf == null ? p : { x: cp.tf - p.x, y: p.y, p: p.p }; };

  Surface.prototype._addPoint = function (e) {
    var S = this.stroke, raw = this.toPaper(e), pr = this._pressure(e, S.P);
    S.raw = raw; S.n++;
    if (S.shape) { S.end = raw; this._drawShapePreview(); return; }
    var k = 1 - this.smoothing * 0.85;
    var q = { x: S.sm.x + (raw.x - S.sm.x) * k, y: S.sm.y + (raw.y - S.sm.y) * k, p: pr };
    this._segment(S.sm, q);
    S.sm = q;
  };

  Surface.prototype._segment = function (a, b) {
    var S = this.stroke, eng = ENGINE[S.media], self = this;
    S.copies.forEach(function (cp) { eng.seg(S, cp.B, self._tf(cp, a), self._tf(cp, b)); });
  };

  Surface.prototype._endStroke = function () {
    var S = this.stroke, self = this;
    if (S.shape) { this._commitShape(); return; }
    // catch the smoothed tip up with the pen
    for (var i = 0; i < 6; i++) {
      var q = { x: S.sm.x + (S.raw.x - S.sm.x) * 0.5, y: S.sm.y + (S.raw.y - S.sm.y) * 0.5, p: S.sm.p };
      this._segment(S.sm, q); S.sm = q;
    }
    var eng = ENGINE[S.media];
    S.copies.forEach(function (cp) { eng.end(S, cp.B); });
    var R = this._bboxRect(S.bbox, eng.commit ? S.w * 1.5 : 2);
    if (R && eng.commit) {
      eng.commit(S, R);
      this.wetCtx().clearRect(R.x, R.y, R.w, R.h);
    }
    this.paint.globalAlpha = 1;
    this.paint.globalCompositeOperation = 'source-over';
    this.stroke = null;
    if (R) this._pushUndo(R);
    this.emit('stroke', { media: S.media, rect: R });
    this.emit('change');
  };

  Surface.prototype._cancelStroke = function () {
    var S = this.stroke;
    if (!S) return;
    this.stroke = null;
    this.shapeLayer.innerHTML = '';
    if (S.shape) return;
    var R = this._bboxRect(S.bbox, S.w * 2);
    if (R) {
      this.paint.globalCompositeOperation = 'copy';
      this.paint.drawImage(this.before, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h);
      this.paint.globalCompositeOperation = 'source-over';
      if (this.wet) this.wet.clearRect(R.x, R.y, R.w, R.h);
    }
    this.paint.globalAlpha = 1;
  };

  Surface.prototype._bboxRect = function (b, pad) {
    if (!isFinite(b.x0)) return null;
    var x = Math.max(0, Math.floor(b.x0 - pad)), y = Math.max(0, Math.floor(b.y0 - pad));
    var x1 = Math.min(this.W, Math.ceil(b.x1 + pad)), y1 = Math.min(this.H, Math.ceil(b.y1 + pad));
    if (x1 <= x || y1 <= y) return null;
    return { x: x, y: y, w: x1 - x, h: y1 - y };
  };

  // Average wet colour under the brush (for oil pick-up), or null.
  Surface.prototype._sample = function (x, y, r) {
    var x0 = Math.max(0, Math.floor(x - r)), y0 = Math.max(0, Math.floor(y - r));
    var w = Math.min(this.W - x0, Math.ceil(r * 2)), h = Math.min(this.H - y0, Math.ceil(r * 2));
    if (w < 1 || h < 1) return null;
    var d;
    try { d = this.paint.getImageData(x0, y0, w, h).data; } catch (e) { return null; }
    var R = 0, G = 0, B = 0, A = 0;
    for (var i = 0; i < d.length; i += 4) { var a = d[i + 3] / 255; R += d[i] * a; G += d[i + 1] * a; B += d[i + 2] * a; A += a; }
    if (A / (d.length / 4) < 0.45) return null;
    return { r: R / A, g: G / A, b: B / A };
  };

  // ── Shapes (drawn with the current medium) ─────────────────────
  Surface.prototype._shapeEnd = function () {
    var S = this.stroke, a = S.start, b = S.end;
    if (S.shape === 'line' && this.snap) {
      if (Math.abs(b.x - a.x) > Math.abs(b.y - a.y)) b = { x: b.x, y: a.y }; else b = { x: a.x, y: b.y };
    }
    return b;
  };
  Surface.prototype._drawShapePreview = function () {
    var S = this.stroke, a = S.start, b = this._shapeEnd();
    var sw = Math.max(2, this.width() * 0.6);
    var col = escAttr(this.hex);
    var body;
    if (S.shape === 'line') body = '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    else if (S.shape === 'rect') body = '<rect x="' + Math.min(a.x, b.x) + '" y="' + Math.min(a.y, b.y) + '" width="' + Math.abs(b.x - a.x) + '" height="' + Math.abs(b.y - a.y) + '"/>';
    else body = '<ellipse cx="' + (a.x + b.x) / 2 + '" cy="' + (a.y + b.y) / 2 + '" rx="' + Math.abs(b.x - a.x) / 2 + '" ry="' + Math.abs(b.y - a.y) / 2 + '"/>';
    this.shapeLayer.innerHTML = '<svg viewBox="0 0 ' + this.W + ' ' + this.H + '" preserveAspectRatio="none"><g fill="none" stroke="' + col +
      '" stroke-width="' + sw + '" stroke-dasharray="' + sw * 3 + ' ' + sw * 2 + '" stroke-linecap="round" opacity="0.7">' + body + '</g></svg>';
  };
  Surface.prototype._commitShape = function () {
    var S = this.stroke, a = S.start, b = this._shapeEnd(), pts = [], i, n;
    this.shapeLayer.innerHTML = '';
    this.stroke = null;
    var dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    if (S.shape === 'line') {
      n = Math.max(2, Math.ceil(Math.hypot(dx, dy) / 3));
      for (i = 0; i <= n; i++) pts.push({ x: a.x + dx * i / n, y: a.y + dy * i / n });
    } else if (S.shape === 'rect') {
      var c = [[a.x, a.y], [b.x, a.y], [b.x, b.y], [a.x, b.y], [a.x, a.y]];
      for (var k = 0; k < 4; k++) {
        var p = c[k], q = c[k + 1], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
        n = Math.max(1, Math.ceil(L / 3));
        for (i = 0; i < n; i++) pts.push({ x: p[0] + (q[0] - p[0]) * i / n, y: p[1] + (q[1] - p[1]) * i / n });
      }
      pts.push({ x: a.x, y: a.y });
    } else {
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, rx = Math.abs(dx) / 2, ry = Math.abs(dy) / 2;
      n = Math.max(24, Math.ceil(Math.PI * (rx + ry) / 3));
      for (i = 0; i <= n; i++) { var t = i / n * Math.PI * 2 - Math.PI / 2; pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry }); }
    }
    this.drawPath(pts, 0.62);
  };

  // Draw a list of points as one stroke of the current medium.
  // Used for shapes, lesson demonstrations and tests.
  Surface.prototype.drawPath = function (pts, pressure) {
    if (!pts.length) return;
    var shape = this.shape, sm = this.smoothing;
    this.shape = null; this.smoothing = 0;
    var fake = function (p) { return { clientX: 0, clientY: 0, pointerId: -7, pointerType: 'pen', pressure: pressure || 0.6, _p: p }; };
    var self = this, toPaper = this.toPaper;
    this.toPaper = function (e) { return e._p ? { x: e._p.x, y: e._p.y } : toPaper.call(self, e); };
    try {
      this._beginStroke(fake(pts[0]));
      for (var i = 1; i < pts.length; i++) this._addPoint(fake(pts[i]));
      this._endStroke();
    } finally {
      this.toPaper = toPaper; this.shape = shape; this.smoothing = sm;
    }
  };

  // ── Fill (paint bucket) ────────────────────────────────────────
  // Lines drawn with grainy media have gaps, so the boundary is grown
  // by two pixels before flooding, and the fill is tucked a few pixels
  // under the lines so no white halo is left between them.
  Surface.prototype.fillAt = function (clientX, clientY, hex) {
    var p = this.toPaper({ clientX: clientX, clientY: clientY });
    return this.fillPaper(p.x, p.y, hex);
  };
  Surface.prototype.fillPaper = function (px, py, hex) {
    var W = this.W, H = this.H, sx = Math.floor(px), sy = Math.floor(py);
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return false;
    var img = this.paint.getImageData(0, 0, W, H), d = img.data, N = W * H, i;
    var region = new Uint8Array(N);
    var seed = sy * W + sx, sa = d[seed * 4 + 3];
    var x, y, k;
    if (sa < 70) {
      var wall = new Uint8Array(N);
      for (i = 0; i < N; i++) wall[i] = d[i * 4 + 3] >= 70 ? 1 : 0;
      for (var pass = 0; pass < 2; pass++) wall = _dilate(wall, W, H);
      if (wall[seed]) return false;
      _flood(region, W, H, seed, function (j) { return !wall[j]; });
    } else {
      var r0 = d[seed * 4], g0 = d[seed * 4 + 1], b0 = d[seed * 4 + 2];
      _flood(region, W, H, seed, function (j) {
        var q = j * 4;
        return d[q + 3] >= 70 && Math.abs(d[q] - r0) + Math.abs(d[q + 1] - g0) + Math.abs(d[q + 2] - b0) < 90;
      });
    }
    var grown = _dilate(_dilate(_dilate(region, W, H), W, H), W, H);
    var x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (y = 0; y < H; y++) for (x = 0, k = y * W; x < W; x++, k++) if (grown[k]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return false;
    var R = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    var bx = this.before.getContext('2d');
    bx.clearRect(0, 0, W, H); bx.drawImage(this.paintC, 0, 0);

    var fc = _work(6, R.w, R.h), fx = fc.getContext('2d'), fi = fx.createImageData(R.w, R.h), fd = fi.data;
    var rgb = hexToRgb(hex), t = tooth('fine');
    for (y = 0; y < R.h; y++) for (x = 0; x < R.w; x++) {
      var gi = (y + R.y) * W + x + R.x;
      if (!grown[gi]) continue;
      var q = (y * R.w + x) * 4;
      // poster paint is never perfectly flat on paper
      var tv = t[((y + R.y) % TILE) * TILE + ((x + R.x) % TILE)], s = (0.5 - tv) * 16;
      fd[q] = rgb.r + s; fd[q + 1] = rgb.g + s; fd[q + 2] = rgb.b + s; fd[q + 3] = 245;
    }
    fx.putImageData(fi, 0, 0);
    var ctx = this.paint;
    ctx.globalCompositeOperation = sa < 70 ? 'destination-over' : 'source-over';
    ctx.drawImage(fc, R.x, R.y);
    ctx.globalCompositeOperation = 'source-over';
    this._pushUndo(R);
    this._flash(R, px, py, hex);
    this.emit('stroke', { media: 'fill', rect: R });
    this.emit('change');
    return true;
  };
  function _dilate(m, W, H) {
    var o = new Uint8Array(m.length), x, y, k;
    for (y = 0; y < H; y++) {
      for (x = 0, k = y * W; x < W; x++, k++) {
        if (m[k] || (x > 0 && m[k - 1]) || (x < W - 1 && m[k + 1]) || (y > 0 && m[k - W]) || (y < H - 1 && m[k + W])) o[k] = 1;
      }
    }
    return o;
  }
  function _flood(region, W, H, seed, ok) {
    var stack = [seed];
    while (stack.length) {
      var j = stack.pop();
      var y = (j / W) | 0, x = j - y * W, l = x, r = x;
      while (l > 0 && !region[y * W + l - 1] && ok(y * W + l - 1)) l--;
      while (r < W - 1 && !region[y * W + r + 1] && ok(y * W + r + 1)) r++;
      var up = false, dn = false;
      for (var xi = l; xi <= r; xi++) {
        var k = y * W + xi;
        region[k] = 1;
        if (y > 0) { var u = k - W; if (!region[u] && ok(u)) { if (!up) { stack.push(u); up = true; } } else up = false; }
        if (y < H - 1) { var dd = k + W; if (!region[dd] && ok(dd)) { if (!dn) { stack.push(dd); dn = true; } } else dn = false; }
      }
    }
  }
  // A ripple where the paint pours in.
  Surface.prototype._flash = function (R, px, py, hex) {
    var el = document.createElement('div');
    el.className = 'as-pour';
    el.style.left = (px / this.W * 100) + '%';
    el.style.top = (py / this.H * 100) + '%';
    el.style.background = hex;
    this.sheet.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
  };

  // ── Undo / redo (stores only the changed rectangle) ────────────
  Surface.prototype._pushUndo = function (R) {
    var before;
    try { before = this.before.getContext('2d').getImageData(R.x, R.y, R.w, R.h); } catch (e) { return; }
    this.undoStack.push({ R: R, img: before });
    this.undoBytes += R.w * R.h * 4;
    this.redoStack = [];
    while (this.undoStack.length > UNDO_LIMIT || (this.undoBytes > UNDO_BYTES && this.undoStack.length > 1)) {
      var old = this.undoStack.shift();
      this.undoBytes -= old.R.w * old.R.h * 4;
    }
    this.emit('history');
  };
  Surface.prototype._swap = function (from, to) {
    var u = from.pop();
    if (!u) return false;
    var now = this.paint.getImageData(u.R.x, u.R.y, u.R.w, u.R.h);
    this.paint.putImageData(u.img, u.R.x, u.R.y);
    to.push({ R: u.R, img: now });
    this.emit('history');
    this.emit('change');
    return true;
  };
  Surface.prototype.undo = function () {
    if (!this._swap(this.undoStack, this.redoStack)) return false;
    this.undoBytes = this.undoStack.reduce(function (n, u) { return n + u.R.w * u.R.h * 4; }, 0);
    return true;
  };
  Surface.prototype.redo = function () { return this._swap(this.redoStack, this.undoStack); };
  Surface.prototype.canUndo = function () { return this.undoStack.length > 0; };
  Surface.prototype.canRedo = function () { return this.redoStack.length > 0; };

  Surface.prototype.clear = function () {
    var bx = this.before.getContext('2d');
    bx.clearRect(0, 0, this.W, this.H); bx.drawImage(this.paintC, 0, 0);
    this.paint.clearRect(0, 0, this.W, this.H);
    this._pushUndo({ x: 0, y: 0, w: this.W, h: this.H });
    this.emit('change');
  };

  // ── Reading the picture ────────────────────────────────────────
  Surface.prototype.inkStats = function () {
    var d = this.paint.getImageData(0, 0, this.W, this.H).data, n = 0;
    for (var i = 3; i < d.length; i += 16) if (d[i] > 30) n++;
    return { coverage: n / (d.length / 16) };
  };
  Surface.prototype.isBlank = function () { return this.inkStats().coverage < 0.0005; };
  // Fraction of the given paper points that have paint within `tol` px.
  Surface.prototype.hitFraction = function (pts, tol) {
    if (!pts.length) return 0;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, i;
    for (i = 0; i < pts.length; i++) {
      if (pts[i].x < x0) x0 = pts[i].x; if (pts[i].x > x1) x1 = pts[i].x;
      if (pts[i].y < y0) y0 = pts[i].y; if (pts[i].y > y1) y1 = pts[i].y;
    }
    var R = this._bboxRect({ x0: x0, y0: y0, x1: x1, y1: y1 }, tol + 1);
    if (!R) return 0;
    var d = this.paint.getImageData(R.x, R.y, R.w, R.h).data, hit = 0, st = Math.max(1, Math.round(tol / 4));
    for (i = 0; i < pts.length; i++) {
      var px = Math.round(pts[i].x - R.x), py = Math.round(pts[i].y - R.y), found = false;
      for (var yy = -tol; yy <= tol && !found; yy += st) {
        for (var xx = -tol; xx <= tol; xx += st) {
          if (xx * xx + yy * yy > tol * tol) continue;
          var X = px + xx, Y = py + yy;
          if (X < 0 || Y < 0 || X >= R.w || Y >= R.h) continue;
          if (d[(Y * R.w + X) * 4 + 3] > 40) { found = true; break; }
        }
      }
      if (found) hit++;
    }
    return hit / pts.length;
  };

  // The finished picture on plain paper (no transparency — the
  // gallery stores JPEG). maxDim keeps saved art small.
  Surface.prototype.exportCanvas = function (maxDim) {
    var w = this.W, h = this.H;
    if (maxDim && (w > maxDim || h > maxDim)) {
      if (w >= h) { h = Math.round(maxDim / w * h); w = maxDim; } else { w = Math.round(maxDim / h * w); h = maxDim; }
    }
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.fillStyle = rgbStr(PAPER_RGB); x.fillRect(0, 0, w, h);
    x.imageSmoothingEnabled = true;
    if (x.imageSmoothingQuality) x.imageSmoothingQuality = 'high';
    x.drawImage(this.paintC, 0, 0, w, h);
    return c;
  };

  // Put an existing image (e.g. reopened art) onto the paper.
  Surface.prototype.loadImage = function (img) {
    var bx = this.before.getContext('2d');
    bx.clearRect(0, 0, this.W, this.H); bx.drawImage(this.paintC, 0, 0);
    this.paint.drawImage(img, 0, 0, this.W, this.H);
    this._pushUndo({ x: 0, y: 0, w: this.W, h: this.H });
    this.emit('change');
  };

  function escAttr(s) { return String(s).replace(/[^#a-zA-Z0-9(),.\s]/g, ''); }

  return {
    Surface: Surface,
    MEDIA: MEDIA,
    hexToRgb: hexToRgb, rgbToHex: rgbToHex, shade: shade, lerpRgb: lerpRgb,
    mixPaint: mixPaint, colourDistance: colourDistance,
    paperDataUrl: paperDataUrl, rng: rng
  };
})();
