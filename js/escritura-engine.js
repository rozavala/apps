/* ================================================================
   ESCRITURA ENGINE — js/escritura-engine.js  (global EscrituraEngine)
   The geometry and the scoring behind Escritura. No DOM: the tests
   load it in Node, and any app that needs to check handwriting
   (Dictado could) can use it with js/zs-handpad.js.

   Units: the four-line school guide ("pauta"). Baseline y = 0,
   midline (x-height) y = 50, top line (capitals and tall letters)
   y = 100, descender line y = -50. y grows upwards here; the pad
   flips it for the screen.

   Paths are a small absolute subset of SVG, plus an elliptic arc:
     M x y                 start (first command of a stroke)
     L x y                 line
     Q cx cy x y           quadratic curve
     C ax ay bx by x y     cubic curve
     A cx cy rx ry a0 a1   arc of the ellipse centred on cx,cy, from
                           angle a0 to a1 in degrees (0 = east,
                           90 = up); a1 > a0 turns anticlockwise. When
                           the pen is already down it first draws a
                           line to the arc's start.
   A stroke whose path is a single point ("M x y") is a dot.

   API
     sample(path, step?)            -> [{x,y}] points along a path
     glyphStrokes(glyph, opts)      -> [[{x,y}]] strokes of one glyph
     layout(text, style, opts)      -> { strokes, rows, width, letters, missing }
     checkStroke(kid, model, opts)  -> { pass, coverage, precision, dir, start, quality, reason }
     checkFree(kidStrokes, modelStrokes, opts) -> { pass, coverage, precision, quality }
     recognize(kidStrokes, candidates, opts) -> [{ ch, d }] best first
     tolerance(tier)                -> lane half-width in units
     starsForStage(stage)           -> 0..3
   ================================================================ */

var EscrituraEngine = (function() {
  'use strict';

  var ROW_H = 200;          // one row of the sheet, in units
  var ROW_TOP = 130;        // the top of row 0 (room for accents above the top line)
  var SLANT = 0.2;          // cursive leans right: x += y * SLANT

  // ── paths ────────────────────────────────────────────────────
  function tokens(path) {
    var out = [], re = /([MLQCA])|(-?\d*\.?\d+)/g, m;
    while ((m = re.exec(path))) out.push(m[1] || parseFloat(m[2]));
    return out;
  }

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  // Points every `step` units (default 1.5) along one path.
  function sample(path, step) {
    step = step || 1.5;
    var t = tokens(path), i = 0, pts = [], cur = null;
    function num() { return t[i++]; }
    function push(p) { pts.push({ x: p.x, y: p.y }); cur = p; }
    function lineTo(p) {
      if (!cur) { push(p); return; }
      var n = Math.max(1, Math.ceil(dist(cur, p) / step)), a = cur;
      for (var k = 1; k <= n; k++) push({ x: a.x + (p.x - a.x) * k / n, y: a.y + (p.y - a.y) * k / n });
    }
    function curve(fn, approxLen) {
      var n = Math.max(2, Math.ceil(approxLen / step));
      for (var k = 1; k <= n; k++) push(fn(k / n));
    }
    while (i < t.length) {
      var c = t[i++];
      if (c === 'M') { var p0 = { x: num(), y: num() }; if (!cur) push(p0); else lineTo(p0); }
      else if (c === 'L') lineTo({ x: num(), y: num() });
      else if (c === 'Q') {
        var q0 = cur, q1 = { x: num(), y: num() }, q2 = { x: num(), y: num() };
        curve(function(u) {
          var v = 1 - u;
          return { x: v * v * q0.x + 2 * v * u * q1.x + u * u * q2.x, y: v * v * q0.y + 2 * v * u * q1.y + u * u * q2.y };
        }, dist(q0, q1) + dist(q1, q2));
      } else if (c === 'C') {
        var c0 = cur, c1 = { x: num(), y: num() }, c2 = { x: num(), y: num() }, c3 = { x: num(), y: num() };
        curve(function(u) {
          var v = 1 - u;
          return {
            x: v * v * v * c0.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * c3.x,
            y: v * v * v * c0.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * c3.y
          };
        }, dist(c0, c1) + dist(c1, c2) + dist(c2, c3));
      } else if (c === 'A') {
        var cx = num(), cy = num(), rx = num(), ry = num(), a0 = num() * Math.PI / 180, a1 = num() * Math.PI / 180;
        var start = { x: cx + rx * Math.cos(a0), y: cy + ry * Math.sin(a0) };
        if (!cur) push(start); else lineTo(start);
        curve(function(u) {
          var a = a0 + (a1 - a0) * u;
          return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
        }, Math.abs(a1 - a0) * Math.max(rx, ry));
      }
    }
    return pts;
  }

  function length(pts) {
    var L = 0;
    for (var i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
    return L;
  }

  // Even spacing along a polyline (n points, or every `step` units).
  function resample(pts, step) {
    if (!pts.length) return [];
    if (pts.length === 1) return [{ x: pts[0].x, y: pts[0].y }];
    var out = [{ x: pts[0].x, y: pts[0].y }], acc = 0, prev = pts[0];
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], d = dist(prev, p);
      while (acc + d >= step && d > 0) {
        var r = (step - acc) / d;
        var q = { x: prev.x + (p.x - prev.x) * r, y: prev.y + (p.y - prev.y) * r };
        out.push(q);
        prev = q; d = dist(prev, p); acc = 0;
      }
      acc += d; prev = p;
    }
    var last = pts[pts.length - 1];
    if (dist(out[out.length - 1], last) > step * 0.3) out.push({ x: last.x, y: last.y });
    return out;
  }

  function moved(pts, dx, dy, slant) {
    return pts.map(function(p) { return { x: p.x + dx + (slant ? p.y * slant : 0), y: p.y + dy }; });
  }

  // ── glyphs and layout ────────────────────────────────────────
  // A glyph: { w, s: [paths] }   (print)
  //          { w, b: 'main path from its first point B', x: [extra paths] }   (cursive)
  // A cursive letter on its own starts with a lead-in from the baseline;
  // inside a word the lead-in is replaced by a join from the letter before.
  function join(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    return 'M' + a.x + ' ' + a.y + ' C' + (a.x + dx * 0.55) + ' ' + (a.y + (dy > 0 ? dy * 0.05 : dy * 0.4)) + ' ' +
           (b.x - dx * 0.18) + ' ' + (b.y - dy * 0.35) + ' ' + b.x + ' ' + b.y;
  }
  // The way into a letter from point a: a smooth join to its first point,
  // or, for oval letters (g.i), a join to the foot of the oval and then
  // up its right side.
  function leadIn(a, g, step) {
    if (!g.i) return sample(join(a, firstPoint(g.b)), step);
    var m = firstPoint(g.i), dx = m.x - a.x;
    var j = 'M' + a.x + ' ' + a.y + ' C' + (a.x + dx * 0.4) + ' ' + a.y + ' ' + (m.x - dx * 0.3) + ' ' + m.y + ' ' + m.x + ' ' + m.y;
    return sample(j, step).concat(sample(g.i, step).slice(1));
  }

  function firstPoint(path) { var t = tokens(path); return { x: t[1], y: t[2] }; }

  function glyphStrokes(g, opts) {
    opts = opts || {};
    var step = opts.step || 1.5;
    if (g.s) return g.s.map(function(p) { return sample(p, step); });
    var B = firstPoint(g.b);
    var from = opts.from || { x: 0, y: 0 };
    var lead = (opts.from === null) ? [] : leadIn(from, g, step);
    var main = sample(g.b, step);
    var first = lead.length ? lead.concat(main.slice(1)) : main;
    return [first].concat((g.x || []).map(function(p) { return sample(p, step); }));
  }

  // Lay text out on the sheet, wrapping at spaces so a row is at most
  // maxRow units wide. Returns every stroke in sheet units (rows stack
  // downwards ROW_H apart), and per letter where it went.
  function layout(text, font, opts) {
    opts = opts || {};
    var cursive = !!font.cursive, gap = font.gap == null ? 10 : font.gap, space = font.space || 36;
    var maxRow = opts.maxRow || 1e9, step = opts.step || 1.5, margin = opts.margin == null ? 14 : opts.margin;
    var words = String(text).split(/\s+/).filter(Boolean);
    var missing = [];
    function wordWidth(w) {
      var x = 0;
      for (var i = 0; i < w.length; i++) { var g = font.glyphs[w[i]]; x += g ? g.w + (cursive ? 0 : gap) : 0; }
      return x - (cursive ? 0 : gap);
    }
    var rows = [[]], rowW = [0];
    words.forEach(function(w) {
      for (var i = 0; i < w.length; i++) if (!font.glyphs[w[i]] && missing.indexOf(w[i]) < 0) missing.push(w[i]);
      var ww = wordWidth(w), r = rows.length - 1;
      var add = rows[r].length ? space + ww : ww;
      if (rows[r].length && rowW[r] + add > maxRow) { rows.push([w]); rowW.push(ww); }
      else { rows[r].push(w); rowW[r] += add; }
    });
    var strokes = [], letters = [], width = 0;
    rows.forEach(function(rw, r) {
      var x = margin, dy = -r * ROW_H;
      rw.forEach(function(w, wi) {
        if (wi) x += space;
        var exit = null;
        for (var i = 0; i < w.length; i++) {
          var g = font.glyphs[w[i]];
          if (!g) continue;
          var from = cursive ? (exit ? { x: exit.x - x, y: exit.y } : { x: 0, y: 0 }) : null;
          var ss = glyphStrokes(g, { step: step, from: from });
          var placed = ss.map(function(s) { return moved(s, x, dy, cursive ? SLANT : 0); });
          var unslanted = ss.map(function(s) { return moved(s, x, 0, 0); });
          letters.push({ ch: w[i], row: r, x: x, w: g.w, first: strokes.length, n: placed.length });
          placed.forEach(function(s) { strokes.push(s); });
          if (cursive) {
            var main = unslanted[0];
            exit = { x: main[main.length - 1].x, y: main[main.length - 1].y };
          }
          x += g.w + (cursive ? 0 : gap);
        }
      });
      width = Math.max(width, x + margin + (cursive ? 30 : 0));
    });
    return { strokes: strokes, rows: rows.length, width: width, letters: letters, missing: missing };
  }

  // ── checking a stroke ────────────────────────────────────────
  // Distance from p to the nearest segment of a polyline.
  function toLine(p, line) {
    if (line.length === 1) return dist(p, line[0]);
    var best = Infinity;
    for (var i = 1; i < line.length; i++) {
      var a = line[i - 1], b = line[i], vx = b.x - a.x, vy = b.y - a.y, L = vx * vx + vy * vy;
      var u = L ? ((p.x - a.x) * vx + (p.y - a.y) * vy) / L : 0;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      var dx = a.x + vx * u - p.x, dy = a.y + vy * u - p.y, d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  function share(pts, line, tol) {
    if (!pts.length) return 0;
    var n = 0;
    for (var i = 0; i < pts.length; i++) if (toLine(pts[i], line) <= tol) n++;
    return n / pts.length;
  }
  // Positive when a closed-ish loop runs anticlockwise (y up).
  function turning(pts) {
    var a = 0;
    for (var i = 1; i < pts.length; i++) a += (pts[i - 1].x * pts[i].y - pts[i].x * pts[i - 1].y);
    return a / 2;
  }

  // The lane half-width (units) by age tier: the youngest get the widest.
  function tolerance(tier) {
    return { beginner: 17, intermediate: 13, advanced: 11, expert: 10 }[tier] || 13;
  }

  // Did this stroke follow that model stroke?
  //   kid, model: [{x,y}] in the same units. opts.tol = lane half-width.
  function checkStroke(kid, model, opts) {
    opts = opts || {};
    var tol = opts.tol || 13;
    var out = { pass: false, coverage: 0, precision: 0, dir: true, start: true, quality: 0, reason: '' };
    if (!kid || !kid.length) { out.reason = 'short'; return out; }
    var mLen = length(model), kLen = length(kid);
    if (mLen < 4) {                                   // a dot
      var c = { x: 0, y: 0 };
      kid.forEach(function(p) { c.x += p.x; c.y += p.y; });
      c.x /= kid.length; c.y /= kid.length;
      var off = dist(c, model[0]);
      out.coverage = out.precision = off <= tol * 1.6 ? 1 : 0;
      out.pass = off <= tol * 1.6 && kLen <= tol * 3;
      out.reason = out.pass ? '' : (kLen > tol * 3 ? 'dot' : 'shape');
      out.quality = out.pass ? Math.max(0.6, 1 - off / (tol * 3)) : 0;
      return out;
    }
    var m = resample(model, 2), k = resample(kid, 2);
    out.coverage = share(m, k, tol);
    out.precision = share(k, model, tol * 1.25);
    var m0 = model[0], m1 = model[model.length - 1], k0 = kid[0];
    var closed = dist(m0, m1) < mLen * 0.15;
    if (closed) {
      var tm = turning(model), tk = turning(kid);
      out.dir = (tm >= 0) === (tk >= 0) || Math.abs(tk) < mLen * tol * 0.2;
      out.start = dist(k0, m0) <= tol * 2.6;
    } else {
      out.dir = dist(k0, m0) <= dist(k0, m1) || kLen < mLen * 0.3;
      out.start = dist(k0, m0) <= tol * 2.6;
    }
    var covMin = opts.coverage || 0.78, precMin = opts.precision || 0.72;
    var shapeOk = out.coverage >= covMin && out.precision >= precMin;
    if (!out.dir) out.reason = 'dir';
    else if (kLen < mLen * 0.45) out.reason = 'short';
    else if (!shapeOk) out.reason = 'shape';
    else if (!out.start && !opts.anyStart) out.reason = 'start';
    out.pass = !out.reason;
    out.quality = Math.max(0, Math.min(1, (out.coverage + out.precision) / 2 - (out.start ? 0 : 0.1)));
    return out;
  }

  // ── checking a whole letter or word written freely ───────────
  // The kid may write a little to the side, or a little wider: each row
  // of ink is slid and stretched onto its row of the model first.
  function bbox(list) {
    var b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    list.forEach(function(s) { s.forEach(function(p) {
      if (p.x < b.x0) b.x0 = p.x; if (p.x > b.x1) b.x1 = p.x;
      if (p.y < b.y0) b.y0 = p.y; if (p.y > b.y1) b.y1 = p.y;
    }); });
    return b;
  }
  function rowOf(y) { return Math.max(0, Math.floor((ROW_TOP - y) / ROW_H)); }

  function checkFree(kidStrokes, modelStrokes, opts) {
    opts = opts || {};
    var tol = (opts.tol || 13) * 1.25;
    var res = { pass: false, coverage: 0, precision: 0, quality: 0, fitted: [] };
    var ink = (kidStrokes || []).filter(function(s) { return s && s.length; });
    if (!ink.length) return res;
    var byRow = {}, modelRow = {};
    ink.forEach(function(s) { var r = rowOf(s[0].y); (byRow[r] = byRow[r] || []).push(s); });
    modelStrokes.forEach(function(s) { var r = rowOf(s[0].y); (modelRow[r] = modelRow[r] || []).push(s); });
    var fitted = [];
    Object.keys(byRow).forEach(function(r) {
      var ks = byRow[r], ms = modelRow[r];
      if (!ms || opts.align === false) { ks.forEach(function(s) { fitted.push(s); }); return; }
      var kb = bbox(ks), mb = bbox(ms);
      var kw = Math.max(1, kb.x1 - kb.x0), mw = Math.max(1, mb.x1 - mb.x0);
      var sx = Math.max(0.75, Math.min(1.33, mw / kw));
      ks.forEach(function(s) { fitted.push(s.map(function(p) { return { x: mb.x0 + (p.x - kb.x0) * sx, y: p.y }; })); });
    });
    var mPts = [], kPts = [];
    modelStrokes.forEach(function(s) { mPts = mPts.concat(resample(s, 3)); });
    fitted.forEach(function(s) { kPts = kPts.concat(resample(s, 3)); });
    function nearAny(p, lines, t) { for (var i = 0; i < lines.length; i++) if (toLine(p, lines[i]) <= t) return true; return false; }
    var c = 0, q = 0;
    mPts.forEach(function(p) { if (nearAny(p, fitted, tol)) c++; });
    kPts.forEach(function(p) { if (nearAny(p, modelStrokes, tol * 0.9)) q++; });
    res.coverage = mPts.length ? c / mPts.length : 0;
    res.precision = kPts.length ? q / kPts.length : 0;
    res.quality = (res.coverage + res.precision) / 2;
    // Scribbling over the whole word is not writing it: the ink may be at
    // most about 1.7 times as long as the letters themselves.
    var mLen = 0, kLen = 0;
    modelStrokes.forEach(function(s) { mLen += length(s); });
    fitted.forEach(function(s) { kLen += length(s); });
    res.ratio = mLen ? kLen / mLen : 0;
    res.pass = res.coverage >= (opts.coverage || 0.72) && res.precision >= (opts.precision || 0.7) && res.ratio <= 1.7;
    res.fitted = fitted;
    return res;
  }

  // ── which letter is this? ────────────────────────────────────
  // Compares the ink with each candidate letter as clouds of points.
  // The guide lines fix the height, so b, d, p and q stay apart; only a
  // sideways slide and a little growing or shrinking are tried.
  function cloud(strokes, n) {
    var all = [];
    strokes.forEach(function(s) { all = all.concat(s); });
    var L = 0, i;
    var segs = [];
    strokes.forEach(function(s) { segs.push(s); L += Math.max(length(s), 0.5); });
    var step = Math.max(0.5, L / n), out = [];
    segs.forEach(function(s) { out = out.concat(s.length > 1 ? resample(s, step) : [s[0]]); });
    if (!out.length) return all;
    return out;
  }
  function chamfer(a, b) {
    var s = 0, i, j, d, best;
    for (i = 0; i < a.length; i++) {
      best = Infinity;
      for (j = 0; j < b.length; j++) { d = (a[i].x - b[j].x) * (a[i].x - b[j].x) + (a[i].y - b[j].y) * (a[i].y - b[j].y); if (d < best) best = d; }
      s += Math.sqrt(best);
    }
    return s / a.length;
  }
  function recognize(kidStrokes, candidates, opts) {
    opts = opts || {};
    var ink = (kidStrokes || []).filter(function(s) { return s && s.length; });
    if (!ink.length) return [];
    var kc = cloud(ink, 48), kb = bbox(ink), kcx = (kb.x0 + kb.x1) / 2;
    var scales = opts.scales || [0.8, 0.9, 1, 1.12, 1.25];
    return candidates.map(function(c) {
      var mc = cloud(c.strokes, 48), mb = bbox(c.strokes), mcx = (mb.x0 + mb.x1) / 2;
      var best = Infinity;
      scales.forEach(function(sc) {
        var moved2 = mc.map(function(p) { return { x: kcx + (p.x - mcx) * sc, y: p.y * sc }; });
        var d = (chamfer(kc, moved2) + chamfer(moved2, kc)) / 2;
        if (d < best) best = d;
      });
      return { ch: c.ch, d: best };
    }).sort(function(a, b) { return a.d - b.d; });
  }

  // ── stars ────────────────────────────────────────────────────
  // A letter has three steps: trace it on the grey lane (1 star), trace
  // it with only a dotted hint (2), write it on your own (3).
  function starsForStage(stage) { return Math.max(0, Math.min(3, stage | 0)); }
  // A word: trace it (1), copy it on your own (2), copy it well (3).
  function wordStars(traced, copied, quality) {
    if (copied) return quality >= 0.85 ? 3 : 2;
    return traced ? 1 : 0;
  }
  function dictStars(right, total) {
    if (!total) return 0;
    var r = right / total;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0;
  }

  // Saved progress, upgraded in place: fields are only ever added.
  function migrate(raw) {
    var d = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    if (!d.L || typeof d.L !== 'object') d.L = {};
    if (!d.W || typeof d.W !== 'object') d.W = {};
    if (!d.dict || typeof d.dict !== 'object') d.dict = {};
    if (typeof d.rounds !== 'number') d.rounds = 0;
    d.v = 1;
    return d;
  }
  function totalStars(d) {
    var n = 0, k;
    d = d || {};
    for (k in (d.L || {})) n += Math.min(3, Math.max(0, Number(d.L[k]) || 0));
    for (k in (d.W || {})) n += Math.min(3, Math.max(0, Number(d.W[k]) || 0));
    for (k in (d.dict || {})) n += Math.min(3, Math.max(0, Number(d.dict[k]) || 0));
    return n;
  }

  return {
    ROW_H: ROW_H, ROW_TOP: ROW_TOP, SLANT: SLANT,
    sample: sample, resample: resample, length: length, glyphStrokes: glyphStrokes, layout: layout,
    toLine: toLine, checkStroke: checkStroke, checkFree: checkFree, recognize: recognize,
    tolerance: tolerance, starsForStage: starsForStage, wordStars: wordStars, dictStars: dictStars,
    migrate: migrate, totalStars: totalStars, rowOf: rowOf
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = EscrituraEngine;
