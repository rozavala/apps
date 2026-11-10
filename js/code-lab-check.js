/* ================================================================
   CODE LAB — goal checks (js/code-lab-check.js)

   Decides whether a finished run reaches a mission's goal, with no DOM
   so the page and the tests judge a program the same way.

   A mission's `goal` can ask for any of these (all must hold):
     out:    ['line', ...]   the printed lines, exactly
     outMin: n               at least n non-empty printed lines
     vars:   { name: value } final values of global variables
     draw:   { tol, colors, inv }  the drawn lines match the picture the
             mission's reference solution draws, within `tol` units, in
             both directions (nothing missing, nothing extra). `inv` is
             null (same place), 'translate' or 'similar'.
     fills:  { spec?, tol }  the filled shapes match (as painted on a
             grid). `spec` is a list of shapes written out by hand;
             without it the reference solution's fills are used.
     sym:    { n, min }      the drawing looks the same turned 1/n of a
             turn about the start point, with at least `min` lines
     uses:   ['loop', ...]   features the code must use (see FEATURES)
     maxLines: n
     custom: function(run) -> true | [es, en]

   Everything is judged from the run: its printed lines, global
   variables, the turtle's segments and fills, and the features found in
   the code. Messages are [es, en] pairs, kind, with no content details.
   ================================================================ */

var CodeLabCheck = (function() {
  'use strict';

  var Lang = (typeof CodeLabLang !== 'undefined') ? CodeLabLang : (typeof require === 'function' ? require('./code-lab-lang.js') : null);

  var FEATURES = {
    loop: ['un ciclo (repeat, for o while)', 'a loop (repeat, for or while)'],
    repeat: ['repeat', 'repeat'],
    'for': ['for', 'for'],
    'while': ['while', 'while'],
    'if': ['if', 'if'],
    elif: ['elif', 'elif'],
    def: ['una función (def)', 'a function (def)'],
    params: ['una función con parámetros', 'a function with parameters'],
    'return': ['return', 'return'],
    list: ['una lista [ ]', 'a list [ ]'],
    index: ['un lugar de la lista, como lista[0]', 'a list spot, like list[0]'],
    recursion: ['una función que se llama a sí misma', 'a function that calls itself'],
    string: ['palabras entre comillas', 'words in quotes'],
    assign: ['una variable (nombre = valor)', 'a variable (name = value)'],
    math: ['una cuenta, como 2 * 3', 'a calculation, like 2 * 3']
  };
  function featureLabel(f) {
    if (FEATURES[f]) return FEATURES[f];
    if (f.indexOf('call:') === 0) return [f.slice(5) + '(...)', f.slice(5) + '(...)'];
    if (f.indexOf('method:') === 0) return ['.' + f.slice(7) + '(...)', '.' + f.slice(7) + '(...)'];
    return [f, f];
  }

  // ---------------------------------------------------------------
  // Colours: compared by name when close, so "red" and a nearby hex agree
  // ---------------------------------------------------------------
  function rgbOf(c) {
    var h = Lang.resolveColor(c) || '#000000';
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  function sameColor(a, b) {
    if (a === b) return true;
    var x = rgbOf(a), y = rgbOf(b);
    return Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) + Math.abs(x[2] - y[2]) < 90;
  }

  // ---------------------------------------------------------------
  // Line pictures
  // ---------------------------------------------------------------
  function segLen(s) { return Math.sqrt((s.x2 - s.x1) * (s.x2 - s.x1) + (s.y2 - s.y1) * (s.y2 - s.y1)); }

  function totalLen(segs) { var t = 0; for (var i = 0; i < segs.length; i++) t += segLen(segs[i]); return t; }

  // Points along the lines, about `step` apart (always the two ends).
  function samples(segs, step) {
    var out = [], i, j, s, L, n, t;
    for (i = 0; i < segs.length; i++) {
      s = segs[i]; L = segLen(s); n = Math.max(1, Math.ceil(L / step));
      for (j = 0; j <= n; j++) {
        t = j / n;
        out.push({ x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t, c: s.c });
      }
    }
    return out;
  }

  function distToSeg(px, py, s) {
    var dx = s.x2 - s.x1, dy = s.y2 - s.y1, l2 = dx * dx + dy * dy, t;
    if (l2 === 0) { dx = px - s.x1; dy = py - s.y1; return Math.sqrt(dx * dx + dy * dy); }
    t = ((px - s.x1) * dx + (py - s.y1) * dy) / l2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    dx = px - (s.x1 + t * dx); dy = py - (s.y1 + t * dy);
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Index lines by grid cell so a point only looks at the lines nearby.
  function buildGrid(segs, cell, pad) {
    var grid = Object.create(null), i, s, x0, x1, y0, y1, gx, gy, k;
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      x0 = Math.floor((Math.min(s.x1, s.x2) - pad) / cell); x1 = Math.floor((Math.max(s.x1, s.x2) + pad) / cell);
      y0 = Math.floor((Math.min(s.y1, s.y2) - pad) / cell); y1 = Math.floor((Math.max(s.y1, s.y2) + pad) / cell);
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > 400) { x0 = x1 = y0 = y1 = 0; k = '*'; (grid[k] = grid[k] || []).push(s); continue; }
      for (gx = x0; gx <= x1; gx++) for (gy = y0; gy <= y1; gy++) { k = gx + ',' + gy; (grid[k] = grid[k] || []).push(s); }
    }
    return { cell: cell, cells: grid };
  }
  function near(grid, p, tol, colors) {
    var k = Math.floor(p.x / grid.cell) + ',' + Math.floor(p.y / grid.cell), list = grid.cells[k], i, long = grid.cells['*'];
    if (list) for (i = 0; i < list.length; i++) if (distToSeg(p.x, p.y, list[i]) <= tol && (!colors || sameColor(list[i].c, p.c))) return true;
    if (long) for (i = 0; i < long.length; i++) if (distToSeg(p.x, p.y, long[i]) <= tol && (!colors || sameColor(long[i].c, p.c))) return true;
    return false;
  }

  // How much of `from` lies on `onto` (0..1).
  function coverage(from, onto, tol, colors, step) {
    if (!from.length) return 1;
    if (!onto.length) return 0;
    var pts = samples(from, step), grid = buildGrid(onto, Math.max(20, tol * 2), tol), hit = 0, i;
    for (i = 0; i < pts.length; i++) if (near(grid, pts[i], tol, colors)) hit++;
    return hit / pts.length;
  }

  function bbox(segs) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, i, s;
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      b.x0 = Math.min(b.x0, s.x1, s.x2); b.x1 = Math.max(b.x1, s.x1, s.x2);
      b.y0 = Math.min(b.y0, s.y1, s.y2); b.y1 = Math.max(b.y1, s.y1, s.y2);
    }
    return b;
  }
  function moved(segs, f) {
    return segs.map(function(s) { var a = f(s.x1, s.y1), b = f(s.x2, s.y2); return { x1: a[0], y1: a[1], x2: b[0], y2: b[1], c: s.c, w: s.w }; });
  }

  // A drawing against a reference: { covered, clean, ok }. `covered` is how
  // much of the reference is drawn, `clean` how much of the drawing belongs.
  function compareDrawing(kid, ref, opts) {
    opts = opts || {};
    var tol = opts.tol || 5, colors = !!opts.colors, inv = opts.inv || null;
    var total = totalLen(ref), step = Math.max(2.5, Math.max(total, totalLen(kid)) / 1500);
    if (inv && kid.length && ref.length) {
      var kb = bbox(kid), rb = bbox(ref), sx = 1, sy = 1;
      if (inv === 'similar') {
        var kw = Math.max(kb.x1 - kb.x0, kb.y1 - kb.y0), rw = Math.max(rb.x1 - rb.x0, rb.y1 - rb.y0);
        var f = kw > 0 ? rw / kw : 1; sx = sy = f;
      }
      kid = moved(kid, function(x, y) { return [rb.x0 + (x - kb.x0) * sx, rb.y0 + (y - kb.y0) * sy]; });
    }
    var covered = coverage(ref, kid, tol, colors, step), clean = coverage(kid, ref, tol, colors, step);
    return { covered: covered, clean: clean, ok: covered >= 0.97 && clean >= 0.97 };
  }

  // ---------------------------------------------------------------
  // Filled shapes
  // ---------------------------------------------------------------
  function inPoly(x, y, pts) {
    // non-zero winding, like the canvas does when it fills
    var wn = 0, i, a, b, n = pts.length, cross;
    for (i = 0; i < n; i++) {
      a = pts[i]; b = pts[(i + 1) % n];
      cross = (b.x - a.x) * (y - a.y) - (x - a.x) * (b.y - a.y);
      if (a.y <= y) { if (b.y > y && cross > 0) wn++; }
      else if (b.y <= y && cross < 0) wn--;
    }
    return wn !== 0;
  }
  function paintAt(fills, x, y) {
    for (var i = fills.length - 1; i >= 0; i--) if (inPoly(x, y, fills[i].pts)) return fills[i].c;
    return null;
  }
  function fillBox(fills) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, i, j, p;
    for (i = 0; i < fills.length; i++) for (j = 0; j < fills[i].pts.length; j++) {
      p = fills[i].pts[j];
      b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x); b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y);
    }
    return b;
  }
  // Two things, both read off a grid laid over the pictures: the share of
  // points (where either picture has paint) painted alike, and, for each
  // separate patch of colour in the reference (the star, a stripe, one
  // light), how much of it the kid painted right. The second keeps a
  // missing star from hiding inside a flag that is otherwise right.
  function compareFills(kid, ref) {
    if (!ref.length) return { match: kid.length ? 0 : 1, worst: kid.length ? 0 : 1, ok: !kid.length };
    var rb = fillBox(ref), kb = kid.length ? fillBox(kid) : rb;
    var x0 = Math.min(rb.x0, kb.x0), x1 = Math.max(rb.x1, kb.x1), y0 = Math.min(rb.y0, kb.y0), y1 = Math.max(rb.y1, kb.y1);
    var step = Math.max(1, Math.max(x1 - x0, y1 - y0) / 120);
    var nx = Math.ceil((x1 - x0) / step), ny = Math.ceil((y1 - y0) / step), i, j, a, b;
    var R = [], K = [], both = 0, same = 0;
    for (i = 0; i < nx; i++) {
      R[i] = []; K[i] = [];
      for (j = 0; j < ny; j++) {
        a = paintAt(ref, x0 + (i + 0.5) * step, y0 + (j + 0.5) * step);
        b = paintAt(kid, x0 + (i + 0.5) * step, y0 + (j + 0.5) * step);
        R[i][j] = a; K[i][j] = b;
        if (a === null && b === null) continue;
        both++;
        if (a !== null && b !== null && sameColor(a, b)) same++;
      }
    }
    // patches of the reference: connected points of one colour
    var seen = Object.create(null), worst = 1, stack, p, cnt, ok, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], d, ni, nj, key;
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      if (R[i][j] === null || seen[i + ',' + j]) continue;
      stack = [[i, j]]; seen[i + ',' + j] = 1; cnt = 0; ok = 0;
      while (stack.length) {
        p = stack.pop(); cnt++;
        if (K[p[0]][p[1]] !== null && sameColor(K[p[0]][p[1]], R[i][j])) ok++;
        for (d = 0; d < 4; d++) {
          ni = p[0] + dirs[d][0]; nj = p[1] + dirs[d][1]; key = ni + ',' + nj;
          if (ni < 0 || nj < 0 || ni >= nx || nj >= ny || seen[key] || R[ni][nj] === null || !sameColor(R[ni][nj], R[i][j])) continue;
          seen[key] = 1; stack.push([ni, nj]);
        }
      }
      if (cnt >= 8) worst = Math.min(worst, ok / cnt);
    }
    var match = both ? same / both : 1;
    return { match: match, worst: worst, ok: match >= 0.97 && worst >= 0.8 };
  }

  // ---------------------------------------------------------------
  // Turning symmetry
  // ---------------------------------------------------------------
  function symmetric(segs, n, tol) {
    if (!segs.length) return 0;
    var step = Math.max(2.5, totalLen(segs) / 1200), worst = 1, k, a, ca, sa, rot;
    var grid = buildGrid(segs, Math.max(20, tol * 2), tol);
    var pts = samples(segs, step);
    for (k = 1; k < n; k++) {
      a = k * 2 * Math.PI / n; ca = Math.cos(a); sa = Math.sin(a);
      var hit = 0, i, p;
      for (i = 0; i < pts.length; i++) {
        p = { x: pts[i].x * ca - pts[i].y * sa, y: pts[i].x * sa + pts[i].y * ca };
        if (near(grid, p, tol, false)) hit++;
      }
      worst = Math.min(worst, hit / pts.length);
    }
    return worst;
  }

  // ---------------------------------------------------------------
  // Judging a run
  // ---------------------------------------------------------------
  var refCache = {};
  // The run of a mission's reference solution (kept for the session).
  function reference(mission) {
    if (!refCache[mission.id]) refCache[mission.id] = Lang.run(mission.solution);
    return refCache[mission.id];
  }

  function trimEnd(s) { return String(s).replace(/\s+$/, ''); }

  // -> { ok, notes: [[es, en], ...] } (notes say what is missing, kindly)
  function evaluate(mission, run) {
    var g = mission.goal || {}, notes = [], i, key;
    if (!run || run.error) return { ok: false, notes: [] };

    if (g.out) {
      var got = run.output.map(trimEnd), want = g.out.map(trimEnd);
      if (!got.length) notes.push(['Tu programa no escribió nada. Usa print(...).', 'Your program did not print anything. Use print(...).']);
      else {
        var bad = -1;
        for (i = 0; i < Math.max(got.length, want.length); i++) if (got[i] !== want[i]) { bad = i; break; }
        if (bad >= 0) {
          if (bad >= got.length) notes.push(['Faltan líneas: escribiste ' + got.length + ' y se esperan ' + want.length + '.', 'Some lines are missing: you printed ' + got.length + ' and ' + want.length + ' are needed.']);
          else if (bad >= want.length) notes.push(['Escribiste líneas de más: se esperan ' + want.length + '.', 'You printed too many lines: ' + want.length + ' are needed.']);
          else notes.push(['La línea ' + (bad + 1) + ' debería decir "' + want[bad] + '" pero dice "' + clip(got[bad]) + '".', 'Line ' + (bad + 1) + ' should say "' + want[bad] + '" but says "' + clip(got[bad]) + '".']);
        }
      }
    }
    if (g.outMin) {
      var filled = run.output.filter(function(l) { return String(l).trim() !== ''; }).length;
      if (filled < g.outMin) notes.push(['Escribe al menos ' + g.outMin + (g.outMin === 1 ? ' línea' : ' líneas') + ' con print(...).', 'Print at least ' + g.outMin + (g.outMin === 1 ? ' line' : ' lines') + ' with print(...).']);
    }
    if (g.vars) {
      for (key in g.vars) {
        if (!(key in run.vars)) notes.push(['Crea una variable llamada ' + key + '.', 'Make a variable called ' + key + '.']);
        else if (Lang.fmt(run.vars[key]) !== Lang.fmt(g.vars[key])) {
          notes.push(['La variable ' + key + ' debería valer ' + Lang.fmt(g.vars[key]) + '.', 'The variable ' + key + ' should be ' + Lang.fmt(g.vars[key]) + '.']);
        }
      }
    }
    var ref = null;
    if (g.draw) {
      ref = reference(mission);
      var kidSegs = run.turtle ? run.turtle.segs : [];
      if (!kidSegs.length) notes.push(['Todavía no dibujaste nada. Prueba con forward(...).', 'You have not drawn anything yet. Try forward(...).']);
      else {
        var cmp = compareDrawing(kidSegs, ref.turtle.segs, g.draw);
        if (!cmp.ok) {
          if (cmp.covered < 0.97) notes.push(['Falta una parte del dibujo. Mira la guía punteada.', 'Part of the picture is missing. Look at the dotted guide.']);
          if (cmp.clean < 0.97) notes.push(['Hay líneas que no están en el dibujo de la meta.', 'There are lines that are not in the goal picture.']);
        }
      }
    }
    if (g.fills) {
      var refFills = g.fills.spec || (ref || reference(mission)).turtle.fills;
      var kidFills = run.turtle ? run.turtle.fills : [];
      if (!kidFills.length) notes.push(['Todavía no rellenaste ninguna figura. Usa begin_fill() y end_fill().', 'You have not filled any shape yet. Use begin_fill() and end_fill().']);
      else if (!compareFills(kidFills, refFills).ok) notes.push(['Los colores o las formas rellenas todavía no coinciden con la meta.', 'The filled colours or shapes do not match the goal yet.']);
    }
    if (g.sym) {
      var segs = run.turtle ? run.turtle.segs : [];
      if (segs.length < (g.sym.min || 1)) notes.push(['Dibuja un poco más: aún faltan líneas.', 'Draw a little more: it needs more lines.']);
      else if (symmetric(segs, g.sym.n, g.sym.tol || 6) < 0.9) notes.push(['El dibujo debe verse igual al girarlo ' + g.sym.n + ' veces alrededor del centro.', 'The picture should look the same when you turn it round the centre ' + g.sym.n + ' times.']);
    }
    if (g.uses) {
      g.uses.forEach(function(f) {
        var opts = f.split('|'), ok = opts.some(function(o) { return !!run.features[o]; });
        if (!ok) { var l = featureLabel(opts[0]); notes.push(['Esta misión pide usar ' + l[0] + '.', 'This mission asks you to use ' + l[1] + '.']); }
      });
    }
    if (g.maxLines && run.lines > g.maxLines) notes.push(['Intenta hacerlo en ' + g.maxLines + ' líneas o menos.', 'Try to do it in ' + g.maxLines + ' lines or fewer.']);
    if (g.custom) {
      var r = g.custom(run);
      if (r !== true) notes.push(r);
    }
    return { ok: notes.length === 0, notes: notes };
  }

  function clip(s) { s = String(s == null ? '' : s); return s.length > 30 ? s.slice(0, 30) + '...' : s; }

  // 0..3 stars for a solved mission: solved, no hints, short program.
  function starsFor(mission, run, hintsUsed) {
    var par = mission.par || reference(mission).lines;
    var s = 1;
    if (!hintsUsed) s++;
    if (run.lines <= par) s++;
    return s;
  }

  return {
    evaluate: evaluate, starsFor: starsFor, reference: reference, compareDrawing: compareDrawing, compareFills: compareFills,
    symmetric: symmetric, samples: samples, sameColor: sameColor, inPoly: inPoly, paintAt: paintAt, featureLabel: featureLabel
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CodeLabCheck;
