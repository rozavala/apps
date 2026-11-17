/* ================================================================
   LÓGICA — puzzle generators and solvers (js/logica-engine.js)
   No DOM, so every puzzle can be generated with a seed and checked
   in tests/unit/logica.spec.js.

   The rule for every generated puzzle: it has exactly one solution.
   Each generator builds a puzzle from a hidden answer and then asks
   its own solver to count solutions (stopping at 2); a puzzle is only
   handed out when the count is 1.

     sudoku     4x4 (2x2 boxes), 6x6 (2x3), 9x9 (3x3)
     nonogram   clues from a hand-drawn picture (pictures in logica-data.js)
     grid       "who has the dog?" logic grids
     knights    truth-tellers and fibbers
     balance    which is heaviest / how many blocks is one apple?
     coins      the fake coin, found with a limited number of weighings
                (an adversary answers, so only a real strategy wins)
     river      river crossings and the night bridge (a search finds the
                fewest crossings; any correct crossing counts)
     pattern    what comes next (pictures, numbers, 3x3 matrices)

   Age tiers are those of getAgeTier(): beginner (<=5),
   intermediate (6-8), advanced (9-11), expert (12+).
   ================================================================ */

var LogicaEngine = (function (D) {
  'use strict';

  var TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];
  function tierIdx(t) { var i = TIERS.indexOf(t); return i < 0 ? 2 : i; }

  // ---------------------------------------------------------------
  // Seeded randomness
  // ---------------------------------------------------------------
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    var h = 2166136261 >>> 0;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function randInt(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function shuffle(r, a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function permutations(n) {
    var out = [];
    (function go(p, used) {
      if (p.length === n) { out.push(p.slice()); return; }
      for (var i = 0; i < n; i++) if (!used[i]) { used[i] = 1; p.push(i); go(p, used); p.pop(); used[i] = 0; }
    })([], []);
    return out;
  }

  // ---------------------------------------------------------------
  // Sudoku
  // ---------------------------------------------------------------
  function sudokuBox(n) { return n === 4 ? [2, 2] : n === 6 ? [2, 3] : [3, 3]; }
  function boxOf(n, r, c) { var b = sudokuBox(n); return Math.floor(r / b[0]) * (n / b[1]) + Math.floor(c / b[1]); }
  function popcount(x) { var c = 0; while (x) { x &= x - 1; c++; } return c; }

  // Counts solutions of a grid (array of n*n, 0 = empty), stopping at
  // `limit`. Returns { count, solution } (solution: the first one found).
  // With `r`, candidates are tried in random order (used to fill a grid).
  function sudokuSolve(grid, n, limit, r) {
    limit = limit || 2;
    var g = grid.slice(), full = (1 << n) - 1;
    var rows = [], cols = [], boxes = [], i;
    for (i = 0; i < n; i++) { rows[i] = 0; cols[i] = 0; boxes[i] = 0; }
    for (i = 0; i < n * n; i++) {
      var v = g[i];
      if (!v) continue;
      var rr = Math.floor(i / n), cc = i % n, bb = boxOf(n, rr, cc), bit = 1 << (v - 1);
      if ((rows[rr] | cols[cc] | boxes[bb]) & bit) return { count: 0, solution: null };
      rows[rr] |= bit; cols[cc] |= bit; boxes[bb] |= bit;
    }
    var count = 0, solution = null;
    function go() {
      if (count >= limit) return;
      var best = -1, bestMask = 0, bestN = 99;
      for (var k = 0; k < n * n; k++) {
        if (g[k]) continue;
        var r0 = Math.floor(k / n), c0 = k % n;
        var m = full & ~(rows[r0] | cols[c0] | boxes[boxOf(n, r0, c0)]);
        var pc = popcount(m);
        if (pc === 0) return;
        if (pc < bestN) { bestN = pc; best = k; bestMask = m; if (pc === 1) break; }
      }
      if (best < 0) { count++; if (!solution) solution = g.slice(); return; }
      var br = Math.floor(best / n), bc = best % n, bx = boxOf(n, br, bc);
      var cands = [];
      for (var d = 0; d < n; d++) if (bestMask & (1 << d)) cands.push(d + 1);
      if (r) cands = shuffle(r, cands);
      for (var j = 0; j < cands.length && count < limit; j++) {
        var bit2 = 1 << (cands[j] - 1);
        g[best] = cands[j]; rows[br] |= bit2; cols[bc] |= bit2; boxes[bx] |= bit2;
        go();
        g[best] = 0; rows[br] &= ~bit2; cols[bc] &= ~bit2; boxes[bx] &= ~bit2;
      }
    }
    go();
    return { count: count, solution: solution };
  }

  // Clues left in the grid, by size and level (fewer = harder).
  var SUDOKU_CLUES = { 4: [8, 6, 5], 6: [20, 16, 13], 9: [38, 32, 27] };

  function sudokuMake(n, level, seed) {
    var r = rng(seed);
    var full = sudokuSolve(new Array(n * n).fill(0), n, 1, r).solution;
    var target = SUDOKU_CLUES[n][Math.max(0, Math.min(2, level | 0))];
    var puzzle = full.slice(), clues = n * n;
    var order = shuffle(r, range(n * n));
    for (var i = 0; i < order.length && clues > target; i++) {
      var k = order[i], keep = puzzle[k];
      puzzle[k] = 0;
      if (sudokuSolve(puzzle, n, 2).count !== 1) puzzle[k] = keep; else clues--;
    }
    return { n: n, box: sudokuBox(n), puzzle: puzzle, solution: full };
  }

  // Candidates for one empty cell given the current entries.
  function sudokuCands(grid, n, k) {
    var r0 = Math.floor(k / n), c0 = k % n, b0 = boxOf(n, r0, c0), used = {};
    for (var i = 0; i < n * n; i++) {
      if (!grid[i] || i === k) continue;
      var r1 = Math.floor(i / n), c1 = i % n;
      if (r1 === r0 || c1 === c0 || boxOf(n, r1, c1) === b0) used[grid[i]] = 1;
    }
    var out = [];
    for (var d = 1; d <= n; d++) if (!used[d]) out.push(d);
    return out;
  }

  // Next helpful cell for a hint: a cell with only one possible value
  // (counting only correct entries), else any empty cell.
  function sudokuHint(p, cur) {
    var n = p.n, good = cur.map(function (v, i) { return v === p.solution[i] ? v : 0; });
    var empty = [];
    for (var i = 0; i < n * n; i++) if (cur[i] !== p.solution[i]) empty.push(i);
    if (!empty.length) return null;
    for (var j = 0; j < empty.length; j++) if (sudokuCands(good, n, empty[j]).length === 1) return { cell: empty[j], value: p.solution[empty[j]], single: true };
    return { cell: empty[0], value: p.solution[empty[0]], single: false };
  }

  // ---------------------------------------------------------------
  // Nonograms
  // ---------------------------------------------------------------
  function lineClue(cells) {
    var out = [], run = 0;
    for (var i = 0; i < cells.length; i++) {
      if (cells[i]) run++; else if (run) { out.push(run); run = 0; }
    }
    if (run) out.push(run);
    return out;
  }
  function parsePicture(rows) {
    return rows.map(function (s) { return s.split('').map(function (ch) { return ch === '#' ? 1 : 0; }); });
  }
  function nonoClues(grid) {
    var h = grid.length, w = grid[0].length, rows = [], cols = [], c, rr;
    for (rr = 0; rr < h; rr++) rows.push(lineClue(grid[rr]));
    for (c = 0; c < w; c++) { var col = []; for (rr = 0; rr < h; rr++) col.push(grid[rr][c]); cols.push(lineClue(col)); }
    return { rows: rows, cols: cols };
  }

  // Every placement of `clue` in a line of length len that agrees with
  // `known` (-1 unknown, 0 empty, 1 filled); returns the cells that are
  // the same in all of them (-1 where they differ), or null if none fit.
  function lineSolve(clue, known) {
    var len = known.length, acc = null, cur = new Array(len).fill(0), any = false;
    function fits(from, to, val) { for (var i = from; i < to; i++) if (known[i] !== -1 && known[i] !== val) return false; return true; }
    function go(ci, pos) {
      if (ci === clue.length) {
        if (!fits(pos, len, 0)) return;
        for (var z = pos; z < len; z++) cur[z] = 0;
        any = true;
        if (!acc) acc = cur.slice();
        else for (var q = 0; q < len; q++) if (acc[q] !== cur[q]) acc[q] = -1;
        return;
      }
      var rest = 0;
      for (var k = ci + 1; k < clue.length; k++) rest += clue[k] + 1;
      for (var s = pos; s + clue[ci] + rest <= len; s++) {
        if (!fits(pos, s, 0)) break;
        if (!fits(s, s + clue[ci], 1)) continue;
        var end = s + clue[ci];
        if (end < len && known[end] === 1) continue;
        for (var a = pos; a < s; a++) cur[a] = 0;
        for (var b = s; b < end; b++) cur[b] = 1;
        if (end < len) cur[end] = 0;
        go(ci + 1, Math.min(len, end + 1));
      }
    }
    go(0, 0);
    return any ? acc : null;
  }

  // Counts solutions (up to limit) by line logic plus guessing.
  function nonoSolve(rowClues, colClues, limit) {
    limit = limit || 2;
    var h = rowClues.length, w = colClues.length, count = 0, solution = null;
    function propagate(g) {
      var changed = true;
      while (changed) {
        changed = false;
        for (var r0 = 0; r0 < h; r0++) {
          var res = lineSolve(rowClues[r0], g[r0]);
          if (!res) return false;
          for (var c0 = 0; c0 < w; c0++) if (g[r0][c0] === -1 && res[c0] !== -1) { g[r0][c0] = res[c0]; changed = true; }
        }
        for (var c1 = 0; c1 < w; c1++) {
          var col = [];
          for (var r1 = 0; r1 < h; r1++) col.push(g[r1][c1]);
          var res2 = lineSolve(colClues[c1], col);
          if (!res2) return false;
          for (var r2 = 0; r2 < h; r2++) if (g[r2][c1] === -1 && res2[r2] !== -1) { g[r2][c1] = res2[r2]; changed = true; }
        }
      }
      return true;
    }
    function go(g) {
      if (count >= limit) return;
      if (!propagate(g)) return;
      for (var r0 = 0; r0 < h; r0++) for (var c0 = 0; c0 < w; c0++) if (g[r0][c0] === -1) {
        [1, 0].forEach(function (v) {
          if (count >= limit) return;
          var g2 = g.map(function (row) { return row.slice(); });
          g2[r0][c0] = v;
          go(g2);
        });
        return;
      }
      count++;
      if (!solution) solution = g.map(function (row) { return row.slice(); });
    }
    var start = [];
    for (var i = 0; i < h; i++) start.push(new Array(w).fill(-1));
    go(start);
    return { count: count, solution: solution };
  }

  // A picture from the data file, ready to play.
  function nonoMake(pic) {
    var grid = parsePicture(pic.rows), cl = nonoClues(grid);
    return { id: pic.id, name: pic.name, color: pic.color, w: grid[0].length, h: grid.length, solution: grid, rows: cl.rows, cols: cl.cols };
  }
  function nonoPictures(size) { return (D.NONOGRAMS || []).filter(function (p) { return p.rows.length === size; }); }

  // A hint: the row or column whose line logic (from the kid's correct
  // cells only) reveals the most new cells.
  function nonoHint(p, cur) {
    var best = null, bestN = 0, i, j, line, known, res, n;
    function knownOf(cells, sol) { return cells.map(function (v, k) { return v === 1 && sol[k] === 1 ? 1 : (v === 2 && sol[k] === 0 ? 0 : -1); }); }
    for (i = 0; i < p.h; i++) {
      known = knownOf(cur[i], p.solution[i]);
      res = lineSolve(p.rows[i], known);
      n = 0; for (j = 0; j < p.w; j++) if (known[j] === -1 && res && res[j] !== -1) n++;
      if (n > bestN) { bestN = n; best = { kind: 'row', i: i }; }
    }
    for (j = 0; j < p.w; j++) {
      line = []; var sol = [];
      for (i = 0; i < p.h; i++) { line.push(cur[i][j]); sol.push(p.solution[i][j]); }
      known = knownOf(line, sol);
      res = lineSolve(p.cols[j], known);
      n = 0; for (i = 0; i < p.h; i++) if (known[i] === -1 && res && res[i] !== -1) n++;
      if (n > bestN) { bestN = n; best = { kind: 'col', i: j }; }
    }
    if (!best) {                                   // nothing by logic alone: reveal the first wrong row
      for (i = 0; i < p.h; i++) for (j = 0; j < p.w; j++) if ((cur[i][j] === 1) !== (p.solution[i][j] === 1)) return { kind: 'row', i: i };
    }
    return best;
  }

  // ---------------------------------------------------------------
  // Logic grids
  // ---------------------------------------------------------------
  // levels: [people, categories, allow 'is' clues, allow 'either']
  var GRID_LEVELS = {
    0: { n: 3, cats: ['pet'], is: 1, either: 0 },
    1: { n: 3, cats: ['pet', 'snack'], is: 1, either: 0 },
    2: { n: 4, cats: ['pet', 'snack'], is: 1, either: 1 },
    3: { n: 4, cats: ['pet', 'snack', 'sport'], is: 0, either: 1 }
  };

  function gridTruth(clue, sol) {
    // sol[c][p] = item index for person p in category c
    var pOf = function (c, i) { return sol[c].indexOf(i); };
    switch (clue.t) {
      case 'is': return sol[clue.c][clue.p] === clue.i;
      case 'not': return sol[clue.c][clue.p] !== clue.i;
      case 'either': return sol[clue.c][clue.p] === clue.i || sol[clue.c][clue.p] === clue.j;
      case 'link': return pOf(clue.c1, clue.i1) === pOf(clue.c2, clue.i2);
      case 'unlink': return pOf(clue.c1, clue.i1) !== pOf(clue.c2, clue.i2);
    }
    return false;
  }

  function gridCount(n, m, clues, limit) {
    var perms = permutations(n), count = 0, solution = null, sol = [];
    (function go(c) {
      if (count >= limit) return;
      if (c === m) {
        for (var k = 0; k < clues.length; k++) if (!gridTruth(clues[k], sol)) return;
        count++; if (!solution) solution = sol.map(function (a) { return a.slice(); });
        return;
      }
      for (var i = 0; i < perms.length && count < limit; i++) {
        sol[c] = perms[i];
        // early check: clues that only use categories already placed
        var ok = true;
        for (var q = 0; q < clues.length && ok; q++) {
          var cl = clues[q], need = Math.max(cl.c != null ? cl.c : -1, cl.c1 != null ? cl.c1 : -1, cl.c2 != null ? cl.c2 : -1);
          if (need <= c && !gridTruth(cl, sol)) ok = false;
        }
        if (ok) go(c + 1);
      }
    })(0);
    return { count: count, solution: solution };
  }

  function gridMake(level, seed) {
    var r = rng(seed), L = GRID_LEVELS[Math.max(0, Math.min(3, level | 0))];
    var n = L.n, people = shuffle(r, D.GRID_PEOPLE).slice(0, n);
    var cats = L.cats.map(function (id) {
      var src = D.GRID_CATS[id];
      return { id: id, verb: src.verb, items: shuffle(r, src.items).slice(0, n) };
    });
    var m = cats.length;
    var sol = cats.map(function () { return shuffle(r, range(n)); });
    var pool = [], c, p, i, c2, i2;
    for (c = 0; c < m; c++) for (p = 0; p < n; p++) for (i = 0; i < n; i++) {
      if (sol[c][p] === i) pool.push({ t: 'is', p: p, c: c, i: i }); else pool.push({ t: 'not', p: p, c: c, i: i });
    }
    for (c = 0; c < m; c++) for (c2 = c + 1; c2 < m; c2++) for (i = 0; i < n; i++) for (i2 = 0; i2 < n; i2++) {
      var same = sol[c].indexOf(i) === sol[c2].indexOf(i2);
      pool.push({ t: same ? 'link' : 'unlink', c1: c, i1: i, c2: c2, i2: i2 });
    }
    if (L.either) for (c = 0; c < m; c++) for (p = 0; p < n; p++) {
      var other = pick(r, range(n).filter(function (x) { return x !== sol[c][p]; }));
      pool.push({ t: 'either', p: p, c: c, i: Math.min(sol[c][p], other), j: Math.max(sol[c][p], other) });
    }
    pool = shuffle(r, pool);
    // Prefer the thinking clues: 'is' goes last (or not at all).
    var isClues = pool.filter(function (x) { return x.t === 'is'; });
    var rest = pool.filter(function (x) { return x.t !== 'is'; });
    pool = L.is ? rest.concat(isClues.slice(0, 1)).concat(rest.length ? [] : isClues) : rest;
    var clues = [];
    for (var k = 0; k < pool.length; k++) {
      clues.push(pool[k]);
      if (gridCount(n, m, clues, 2).count === 1) break;
    }
    // drop clues the puzzle does not need
    for (var d = clues.length - 1; d >= 0; d--) {
      var trial = clues.slice(0, d).concat(clues.slice(d + 1));
      if (gridCount(n, m, trial, 2).count === 1) clues = trial;
    }
    // easy levels: start with a direct clue so there is a way in
    if (L.is && level <= 1 && !clues.some(function (x) { return x.t === 'is'; })) {
      clues.unshift(isClues[0]);
      for (var d2 = clues.length - 1; d2 >= 1; d2--) {
        var t2 = clues.slice(0, d2).concat(clues.slice(d2 + 1));
        if (gridCount(n, m, t2, 2).count === 1) clues = t2;
      }
    }
    return { level: level, n: n, people: people, cats: cats, clues: clues, solution: sol };
  }

  function L2(pair, lang) { return lang === 'es' ? pair[0] : pair[1]; }
  function gridClueText(pz, cl, lang) {
    var es = lang === 'es';
    function item(c, i) { return L2(pz.cats[c].items[i].a, lang); }
    function verb(c, neg) { var v = pz.cats[c].verb; return neg ? (es ? 'no ' + v.es : v.enNeg) : (es ? v.es : v.en); }
    var who = function (p) { return pz.people[p]; };
    var s;
    switch (cl.t) {
      case 'is': s = who(cl.p) + ' ' + verb(cl.c) + ' ' + item(cl.c, cl.i); break;
      case 'not': s = who(cl.p) + ' ' + verb(cl.c, true) + ' ' + item(cl.c, cl.i); break;
      case 'either': s = who(cl.p) + ' ' + verb(cl.c) + ' ' + item(cl.c, cl.i) + (es ? ' o ' : ' or ') + item(cl.c, cl.j); break;
      case 'link': s = (es ? 'Quien ' : 'The kid who ') + verb(cl.c1) + ' ' + item(cl.c1, cl.i1) + ' ' + verb(cl.c2) + ' ' + item(cl.c2, cl.i2); break;
      case 'unlink': s = (es ? 'Quien ' : 'The kid who ') + verb(cl.c1) + ' ' + item(cl.c1, cl.i1) + ' ' + verb(cl.c2, true) + ' ' + item(cl.c2, cl.i2); break;
    }
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }

  // ---------------------------------------------------------------
  // Knights and knaves (truth-tellers and fibbers)
  // ---------------------------------------------------------------
  // A statement is said by `s`; types:
  //   kind  {who, k}   "who always tells the truth" (k=1) / "always lies" (k=0)
  //   same  {who}      "who and I are the same kind"
  //   diff  {who}      "who and I are different kinds"
  //   some  {}         "at least one of us lies"
  //   all   {}         "all of us tell the truth"
  //   one   {}         "exactly one of us tells the truth"
  //   both  {a, b}     "a and b both lie"      (3 islanders)
  function kkTruth(st, kinds) {
    var n = kinds.length, i, t = 0;
    switch (st.t) {
      case 'kind': return kinds[st.who] === st.k;
      case 'same': return kinds[st.who] === kinds[st.s];
      case 'diff': return kinds[st.who] !== kinds[st.s];
      case 'some': for (i = 0; i < n; i++) if (!kinds[i]) return true; return false;
      case 'all': for (i = 0; i < n; i++) if (!kinds[i]) return false; return true;
      case 'one': for (i = 0; i < n; i++) t += kinds[i]; return t === 1;
      case 'both': return !kinds[st.a] && !kinds[st.b];
    }
    return false;
  }
  function kkCount(n, statements) {
    var count = 0, solution = null;
    for (var mask = 0; mask < (1 << n); mask++) {
      var kinds = [];
      for (var i = 0; i < n; i++) kinds.push((mask >> i) & 1);
      var ok = statements.every(function (st) { return kkTruth(st, kinds) === (kinds[st.s] === 1); });
      if (ok) { count++; if (!solution) solution = kinds; }
    }
    return { count: count, solution: solution };
  }
  var KK_LEVELS = {
    0: { n: 2, types: ['kind', 'same', 'diff', 'some', 'all'] },
    1: { n: 3, types: ['kind', 'same', 'diff', 'some', 'all'] },
    2: { n: 3, types: ['kind', 'same', 'diff', 'some', 'all', 'one', 'both'] }
  };
  function kkMake(level, seed) {
    var r = rng(seed), L = KK_LEVELS[Math.max(0, Math.min(2, level | 0))], n = L.n;
    for (var tries = 0; tries < 2000; tries++) {
      var kinds = range(n).map(function () { return r() < 0.5 ? 1 : 0; });
      var sts = [];
      for (var s = 0; s < n; s++) {
        var st = null;
        for (var g = 0; g < 50 && !st; g++) {
          var t = pick(r, L.types), others = range(n).filter(function (x) { return x !== s; });
          var c = { s: s, t: t };
          if (t === 'kind') { c.who = pick(r, others); c.k = r() < 0.5 ? 1 : 0; }
          else if (t === 'same' || t === 'diff') c.who = pick(r, others);
          else if (t === 'both') { if (n < 3) continue; var o = shuffle(r, others); c.a = Math.min(o[0], o[1]); c.b = Math.max(o[0], o[1]); }
          if (kkTruth(c, kinds) === (kinds[s] === 1)) st = c;
        }
        if (!st) break;
        sts.push(st);
      }
      if (sts.length !== n) continue;
      // no two islanders say the very same kind of thing on the 3-person levels
      if (n === 3 && new Set(sts.map(function (x) { return x.t; })).size < 2) continue;
      // nobody repeats a statement someone else made
      var said = sts.map(function (x) { return x.t + (x.who != null ? x.who : '') + (x.k != null ? x.k : '') + (x.a != null ? x.a + '' + x.b : ''); });
      if (new Set(said.filter(function (x, i) { return sts[i].t === 'some' || sts[i].t === 'all' || sts[i].t === 'one' || sts[i].t === 'both'; })).size <
          said.filter(function (x, i) { return sts[i].t === 'some' || sts[i].t === 'all' || sts[i].t === 'one' || sts[i].t === 'both'; }).length) continue;
      if (kkCount(n, sts).count !== 1) continue;
      var names = shuffle(r, D.ISLANDERS).slice(0, n);
      return { level: level, n: n, names: names, statements: sts, solution: kinds };
    }
    throw new Error('kkMake: no puzzle');
  }
  function kkText(pz, st, lang) {
    var es = lang === 'es', nm = function (i) { return pz.names[i]; };
    switch (st.t) {
      case 'kind': return st.k ? (es ? nm(st.who) + ' siempre dice la verdad.' : nm(st.who) + ' always tells the truth.')
                              : (es ? nm(st.who) + ' siempre miente.' : nm(st.who) + ' always lies.');
      case 'same': return es ? nm(st.who) + ' y yo somos del mismo tipo.' : nm(st.who) + ' and I are the same kind.';
      case 'diff': return es ? nm(st.who) + ' y yo somos de distinto tipo.' : nm(st.who) + ' and I are different kinds.';
      case 'some': return es ? 'Al menos uno de nosotros miente.' : 'At least one of us lies.';
      case 'all': return es ? 'Todos nosotros decimos la verdad.' : 'All of us tell the truth.';
      case 'one': return es ? 'Exactamente uno de nosotros dice la verdad.' : 'Exactly one of us tells the truth.';
      case 'both': return es ? nm(st.a) + ' y ' + nm(st.b) + ' mienten los dos.' : nm(st.a) + ' and ' + nm(st.b) + ' both lie.';
    }
    return '';
  }

  // ---------------------------------------------------------------
  // Balance scales
  // ---------------------------------------------------------------
  // level 0: three objects, two tipped scales -> which is heaviest?
  // level 1: two objects + blocks, how many blocks is one X?
  // level 2: three objects + blocks
  var BAL_MAX = 9;
  function sideWeight(side, w) { var s = side.b || 0; (side.o || []).forEach(function (o) { s += w[o]; }); return s; }
  function balOrderMake(seed) {
    var r = rng(seed), objs = shuffle(r, D.BAL_OBJECTS).slice(0, 3).map(function (o) { return o.id; });
    // objs[0] < objs[1] < objs[2]; show the two neighbouring comparisons, shuffled
    var scales = shuffle(r, [{ heavy: objs[1], light: objs[0] }, { heavy: objs[2], light: objs[1] }]).map(function (s) {
      var flip = r() < 0.5;
      return { left: { o: [flip ? s.light : s.heavy] }, right: { o: [flip ? s.heavy : s.light] }, tilt: flip ? 1 : -1 }; // tilt -1: left side down
    });
    var choices = shuffle(r, objs.slice());
    return { kind: 'order', objs: objs, scales: scales, ask: 'heaviest', answer: objs[2], choices: choices };
  }
  function balCount(objs, scales, limit) {
    var count = 0, solution = null, w = {};
    (function go(i) {
      if (count >= limit) return;
      if (i === objs.length) {
        for (var k = 0; k < scales.length; k++) if (sideWeight(scales[k].left, w) !== sideWeight(scales[k].right, w)) return;
        count++; if (!solution) solution = JSON.parse(JSON.stringify(w));
        return;
      }
      for (var v = 1; v <= BAL_MAX; v++) { w[objs[i]] = v; go(i + 1); }
      delete w[objs[i]];
    })(0);
    return { count: count, solution: solution };
  }
  function balEqMake(nObj, seed) {
    var r = rng(seed);
    for (var tries = 0; tries < 500; tries++) {
      var objs = shuffle(r, D.BAL_OBJECTS).slice(0, nObj).map(function (o) { return o.id; });
      var w = {};
      objs.forEach(function (o) { w[o] = randInt(r, 1, nObj === 2 ? 5 : 4); });
      var scales = [];
      for (var g = 0; g < 60 && scales.length < nObj + 1; g++) {
        // left: 1-3 objects; right: objects of other kinds and/or blocks
        var left = { o: [] }, right = { o: [] };
        var nl = randInt(r, 1, 3);
        for (var a = 0; a < nl; a++) left.o.push(pick(r, objs));
        var others = objs.filter(function (o) { return left.o.indexOf(o) < 0; });
        if (others.length && r() < 0.5) { var nr = randInt(r, 1, 2); for (var b = 0; b < nr; b++) right.o.push(pick(r, others)); }
        var diff = sideWeight(left, w) - sideWeight(right, w);
        if (diff < 0) continue;
        if (diff === 0 && !right.o.length) continue;
        right.b = diff;
        if (right.b > 8 || right.o.length + (right.b ? 1 : 0) > 4) continue;
        left.o.sort(); right.o.sort();
        var key = JSON.stringify([left, right]);
        if (scales.some(function (s) { return JSON.stringify([s.left, s.right]) === key; })) continue;
        scales.push({ left: left, right: right, tilt: 0 });
        if (scales.length >= nObj && balCount(objs, scales, 2).count === 1) break;
      }
      if (balCount(objs, scales, 2).count !== 1) continue;
      // drop scales that are not needed
      for (var d = scales.length - 1; d >= 0 && scales.length > nObj; d--) {
        var t = scales.slice(0, d).concat(scales.slice(d + 1));
        if (balCount(objs, t, 2).count === 1) scales = t;
      }
      var ask = pick(r, objs), ans = w[ask];
      var choices = [ans];
      while (choices.length < 4) { var c = randInt(r, 1, 9); if (choices.indexOf(c) < 0) choices.push(c); }
      return { kind: 'eq', objs: objs, weights: w, scales: shuffle(r, scales), ask: ask, answer: ans, choices: shuffle(r, choices) };
    }
    throw new Error('balEqMake: no puzzle');
  }
  function balMake(level, seed) { return level <= 0 ? balOrderMake(seed) : balEqMake(level === 1 ? 2 : 3, seed); }

  // ---------------------------------------------------------------
  // The fake coin
  // ---------------------------------------------------------------
  // Hypotheses are {c: coin, d: +1 heavier / -1 lighter}. A weighing's
  // outcome is 'L' (left side down), 'R', or '=' (balanced). The
  // adversary keeps the largest group of hypotheses still possible, so
  // a lucky guess never wins: only a real strategy does.
  var COIN_LEVELS = {
    0: { n: 3, w: 1, either: 0 },
    1: { n: 9, w: 2, either: 0 },
    2: { n: 8, w: 2, either: 0 },
    3: { n: 12, w: 3, either: 1 }
  };
  function coinsNew(level) {
    var L = COIN_LEVELS[Math.max(0, Math.min(3, level | 0))], hyps = [];
    for (var c = 0; c < L.n; c++) { hyps.push({ c: c, d: 1 }); if (L.either) hyps.push({ c: c, d: -1 }); }
    return { level: level, n: L.n, weighings: L.w, either: L.either, hyps: hyps, log: [] };
  }
  function coinOutcome(h, left, right) {
    if (left.indexOf(h.c) >= 0) return h.d > 0 ? 'L' : 'R';
    if (right.indexOf(h.c) >= 0) return h.d > 0 ? 'R' : 'L';
    return '=';
  }
  // How many hypotheses could a perfect player still tell apart in k
  // more weighings? Used to break ties: the adversary prefers the
  // outcome that leaves the hardest position.
  function coinsHard(hyps, k) {
    var coins = {}, any = 0;
    hyps.forEach(function (h) { coins[h.c] = 1; });
    for (var x in coins) any++;
    return any > Math.pow(3, k) ? 2 : (any > 1 ? 1 : 0);
  }
  function coinsWeigh(st, left, right, r) {
    if (left.length !== right.length || !left.length) return { error: 'equal' };
    if (st.log.length >= st.weighings) return { error: 'used' };
    var groups = { L: [], R: [], '=': [] };
    st.hyps.forEach(function (h) { groups[coinOutcome(h, left, right)].push(h); });
    var left2 = st.weighings - st.log.length - 1;
    var keys = ['L', 'R', '='].filter(function (k) { return groups[k].length; });
    keys.sort(function (a, b) {
      var ca = coinsOf(groups[a]).length, cb = coinsOf(groups[b]).length;
      if (cb !== ca) return cb - ca;
      var ha = coinsHard(groups[a], left2), hb = coinsHard(groups[b], left2);
      if (hb !== ha) return hb - ha;
      return groups[b].length - groups[a].length;
    });
    var best = keys.filter(function (k) {
      return coinsOf(groups[k]).length === coinsOf(groups[keys[0]]).length && groups[k].length === groups[keys[0]].length;
    });
    var out = best.length > 1 && r ? pick(r, best) : keys[0];
    st.hyps = groups[out];
    st.log.push({ left: left.slice(), right: right.slice(), out: out });
    return { out: out };
  }
  function coinsOf(hyps) { var s = {}; hyps.forEach(function (h) { s[h.c] = 1; }); return Object.keys(s).map(Number); }
  // The kid names a coin: right only if no other coin is still possible.
  function coinsGuess(st, coin) {
    var left = coinsOf(st.hyps);
    if (left.length === 1 && left[0] === coin) {
      var h = st.hyps[0];
      return { ok: true, coin: coin, d: st.hyps.length === 1 ? h.d : null };
    }
    var other = left.filter(function (c) { return c !== coin; });
    return { ok: false, coin: other.length ? other[0] : coin, could: left };
  }

  // ---------------------------------------------------------------
  // River crossings and the night bridge
  // ---------------------------------------------------------------
  // A crossing puzzle: `who` is everyone (ids); a state is the set on
  // the far bank and where the boat is. `boat(group)` says if a group
  // may travel together; `safe(bank)` says if a bank left with that
  // group (without the boat crew) is fine. The bridge counts minutes.
  function has(a, x) { return a.indexOf(x) >= 0; }
  var RIVERS = {
    fox: {
      who: ['farmer', 'fox', 'hen', 'corn'],
      boat: function (g) { return g.length >= 1 && g.length <= 2 && has(g, 'farmer'); },
      safe: function (bank) {
        if (has(bank, 'farmer')) return null;
        if (has(bank, 'fox') && has(bank, 'hen')) return 'foxhen';
        if (has(bank, 'hen') && has(bank, 'corn')) return 'hencorn';
        return null;
      }
    },
    family: {
      who: ['dad', 'mom', 'kid1', 'kid2'],
      boat: function (g) {
        var w = 0; g.forEach(function (x) { w += (x === 'dad' || x === 'mom') ? 2 : 1; });
        return g.length >= 1 && w <= 2;
      },
      safe: function () { return null; }
    },
    hens: {
      who: ['hen1', 'hen2', 'hen3', 'fox1', 'fox2', 'fox3'],
      boat: function (g) { return g.length >= 1 && g.length <= 2; },
      safe: function (bank) {
        var h = bank.filter(function (x) { return x.indexOf('hen') === 0; }).length;
        var f = bank.length - h;
        return h > 0 && f > h ? 'outnumber' : null;
      }
    },
    bridge: {
      who: ['p1', 'p2', 'p5', 'p10'],
      time: { p1: 1, p2: 2, p5: 5, p10: 10 },
      limit: 17,
      boat: function (g) { return g.length >= 1 && g.length <= 2; },
      safe: function () { return null; }
    }
  };
  function riverStart(id) { return { far: [], boat: 0, moves: 0, minutes: 0 }; }   // boat 0 = near bank
  function riverBanks(P, st) {
    var near = P.who.filter(function (x) { return !has(st.far, x); });
    return { near: near, far: st.far.slice() };
  }
  // Tries a crossing; returns { ok, state } or { ok:false, why }.
  function riverMove(id, st, group) {
    var P = RIVERS[id], banks = riverBanks(P, st), from = st.boat === 0 ? banks.near : banks.far;
    if (!group.length) return { ok: false, why: 'empty' };
    for (var i = 0; i < group.length; i++) if (!has(from, group[i])) return { ok: false, why: 'side' };
    if (!P.boat(group)) return { ok: false, why: id === 'fox' && !has(group, 'farmer') && group.length <= 2 ? 'rower' : 'boat' };
    var far = st.boat === 0 ? st.far.concat(group) : st.far.filter(function (x) { return !has(group, x); });
    far = P.who.filter(function (x) { return has(far, x); });
    var near = P.who.filter(function (x) { return !has(far, x); });
    var bad = P.safe(st.boat === 0 ? near : far) || P.safe(st.boat === 0 ? far : near);
    var mins = st.minutes;
    if (P.time) { var t = 0; group.forEach(function (x) { t = Math.max(t, P.time[x]); }); mins += t; }
    var ns = { far: far, boat: 1 - st.boat, moves: st.moves + 1, minutes: mins };
    if (bad) return { ok: false, why: bad, state: ns };
    return { ok: true, state: ns };
  }
  function riverDone(id, st) { return st.far.length === RIVERS[id].who.length; }
  function riverKey(st) { return st.boat + ':' + st.far.join(','); }
  function subsets(a, max) {
    var out = [];
    (function go(i, cur) {
      if (cur.length && cur.length <= max) out.push(cur.slice());
      if (cur.length === max) return;
      for (var j = i; j < a.length; j++) { cur.push(a[j]); go(j + 1, cur); cur.pop(); }
    })(0, []);
    return out;
  }
  // Fewest crossings (or, for the bridge, fewest minutes) from `st`;
  // returns { cost, path: [group, …] } or null if stuck.
  function riverSolve(id, st) {
    var P = RIVERS[id];
    st = st || riverStart(id);
    var start = { far: st.far.slice(), boat: st.boat, moves: 0, minutes: 0 };
    var best = {}, queue = [{ s: start, path: [], cost: 0 }];
    best[riverKey(start)] = 0;
    while (queue.length) {
      // smallest cost first (minutes for the bridge, crossings otherwise)
      var bi = 0;
      for (var q = 1; q < queue.length; q++) if (queue[q].cost < queue[bi].cost) bi = q;
      var cur = queue.splice(bi, 1)[0];
      if (riverDone(id, cur.s)) return { cost: cur.cost, path: cur.path };
      var b = riverBanks(P, cur.s), from = cur.s.boat === 0 ? b.near : b.far;
      subsets(from, 2).forEach(function (g) {
        var res = riverMove(id, cur.s, g);
        if (!res.ok) return;
        var cost = P.time ? res.state.minutes : res.state.moves;
        var k = riverKey(res.state);
        if (best[k] != null && best[k] <= cost) return;
        best[k] = cost;
        queue.push({ s: res.state, path: cur.path.concat([g]), cost: cost });
      });
    }
    return null;
  }

  // ---------------------------------------------------------------
  // Patterns and sequences
  // ---------------------------------------------------------------
  var SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
  var COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
  var UNITS = ['AB', 'AAB', 'ABB', 'ABC', 'AABB', 'ABAC'];
  function tokKey(t) { return t.s + '/' + t.c; }
  function minPeriod(keys) {
    for (var p = 1; p <= keys.length; p++) {
      var ok = true;
      for (var i = p; i < keys.length && ok; i++) if (keys[i] !== keys[i - p]) ok = false;
      if (ok) return p;
    }
    return keys.length;
  }
  function picMake(r) {
    var unit = pick(r, UNITS), letters = [];
    unit.split('').forEach(function (ch) { if (letters.indexOf(ch) < 0) letters.push(ch); });
    var byColor = r() < 0.5, toks = {};
    var shapes = shuffle(r, SHAPES), colors = shuffle(r, COLORS);
    letters.forEach(function (ch, i) {
      toks[ch] = byColor ? { s: shapes[0], c: colors[i] } : { s: shapes[i], c: colors[i] };
    });
    var len = Math.max(6, unit.length * 2 + randInt(r, 0, unit.length - 1));
    var seq = [];
    for (var i = 0; i < len; i++) seq.push(toks[unit.charAt(i % unit.length)]);
    var answer = toks[unit.charAt(len % unit.length)];
    var choices = [answer];
    letters.forEach(function (ch) { if (tokKey(toks[ch]) !== tokKey(answer) && choices.length < 3) choices.push(toks[ch]); });
    while (choices.length < 3) {
      var t = { s: byColor ? shapes[0] : pick(r, shapes), c: pick(r, colors) };
      if (!choices.some(function (x) { return tokKey(x) === tokKey(t); })) choices.push(t);
    }
    return { kind: 'pic', seq: seq, answer: 0, choices: choices, unit: unit, shuffled: true };
  }

  // Number rule families (used both to make and to check sequences).
  var FAMILIES = {
    arith: function (a) { var d = a[1] - a[0]; for (var i = 2; i < a.length; i++) if (a[i] - a[i - 1] !== d) return null; return a[a.length - 1] + d; },
    geom: function (a) {
      if (!a[0] || a[1] % a[0]) return null;
      var q = a[1] / a[0]; if (q === 1) return null;
      for (var i = 2; i < a.length; i++) if (a[i] !== a[i - 1] * q) return null;
      return a[a.length - 1] * q;
    },
    alt: function (a) {
      if (a.length < 5) return null;
      var d1 = a[1] - a[0], d2 = a[2] - a[1];
      for (var i = 1; i < a.length; i++) if (a[i] - a[i - 1] !== (i % 2 ? d1 : d2)) return null;
      return a[a.length - 1] + (a.length % 2 ? d1 : d2);
    },
    quad: function (a) {
      if (a.length < 4) return null;
      var d = [];
      for (var i = 1; i < a.length; i++) d.push(a[i] - a[i - 1]);
      var s = d[1] - d[0];
      for (var j = 2; j < d.length; j++) if (d[j] - d[j - 1] !== s) return null;
      return a[a.length - 1] + d[d.length - 1] + s;
    },
    fib: function (a) {
      for (var i = 2; i < a.length; i++) if (a[i] !== a[i - 1] + a[i - 2]) return null;
      return a[a.length - 1] + a[a.length - 2];
    }
  };
  function predictions(seq) {
    var out = [];
    for (var f in FAMILIES) { var p = FAMILIES[f](seq); if (p != null && out.indexOf(p) < 0) out.push(p); }
    return out;
  }
  function numMake(r, hard) {
    for (var tries = 0; tries < 200; tries++) {
      var kind = hard ? pick(r, ['arith', 'geom', 'alt', 'quad', 'fib', 'arith']) : pick(r, ['arith', 'arith', 'down']);
      var seq = [], len = 5, i;
      if (kind === 'arith') { var a0 = randInt(r, 1, hard ? 40 : 12), d = randInt(r, hard ? 3 : 1, hard ? 12 : 5); for (i = 0; i < len; i++) seq.push(a0 + d * i); }
      else if (kind === 'down') { var b0 = randInt(r, 20, 40), e = randInt(r, 1, 4); for (i = 0; i < len; i++) seq.push(b0 - e * i); }
      else if (kind === 'geom') { var g0 = randInt(r, 1, 4), q = randInt(r, 2, 3); len = 5; for (i = 0; i < len; i++) seq.push(g0 * Math.pow(q, i)); }
      else if (kind === 'alt') { var c0 = randInt(r, 1, 10), u = randInt(r, 2, 6), v = randInt(r, -3, 9); if (u === v || v === 0) continue; len = 6; seq.push(c0); for (i = 1; i < len; i++) seq.push(seq[i - 1] + (i % 2 ? u : v)); }
      else if (kind === 'quad') { var s0 = randInt(r, 1, 3); len = 5; for (i = 0; i < len; i++) seq.push((i + s0) * (i + s0)); }
      else if (kind === 'fib') { var f0 = randInt(r, 1, 3), f1 = randInt(r, f0, f0 + 3); seq = [f0, f1]; for (i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]); }
      var preds = predictions(seq);
      if (preds.length !== 1) continue;                 // two rules fit: ambiguous, try again
      var ans = preds[0];
      if (ans < 0) continue;
      var choices = [ans], last = seq[seq.length - 1], diff = Math.abs(seq[seq.length - 1] - seq[seq.length - 2]) || 2;
      var cands = shuffle(r, [ans + 1, ans - 1, ans + 2, ans - 2, last + diff * 2, ans + diff, ans - diff, last, ans + 10, ans - 10]);
      for (var k = 0; k < cands.length && choices.length < 4; k++) {
        var cv = cands[k];
        if (cv < 0 || choices.indexOf(cv) >= 0 || seq.indexOf(cv) >= 0) continue;
        if (predictions(seq).indexOf(cv) >= 0) continue;
        choices.push(cv);
      }
      if (choices.length < 4) continue;
      return { kind: 'num', seq: seq, rule: kind, answer: 0, choices: choices, shuffled: true };
    }
    throw new Error('numMake: no sequence');
  }
  // 3x3 grid: each row has the three shapes once, each column the three
  // colours once, and the number of shapes grows along the row (1, 2, 3).
  function matMake(r) {
    var sh = shuffle(r, SHAPES).slice(0, 3), co = shuffle(r, COLORS).slice(0, 3);
    var ps = shuffle(r, [0, 1, 2]), pc = shuffle(r, [0, 1, 2]);
    var cells = [];
    for (var y = 0; y < 3; y++) for (var x = 0; x < 3; x++) {
      cells.push({ s: sh[(ps[y] + x) % 3], c: co[(pc[x] + 2 * y) % 3], n: x + 1 });
    }
    var answer = cells[8];
    var wrongS = sh.filter(function (s) { return s !== answer.s; })[0];
    var wrongC = co.filter(function (c) { return c !== answer.c; })[0];
    var choices = [
      answer,
      { s: wrongS, c: answer.c, n: 3 },
      { s: answer.s, c: wrongC, n: 3 },
      { s: answer.s, c: answer.c, n: 2 }
    ];
    return { kind: 'mat', cells: cells.slice(0, 8), answer: 0, choices: choices, shuffled: true };
  }
  function matFits(cells9) {
    for (var y = 0; y < 3; y++) {
      var s = {}, c = {};
      for (var x = 0; x < 3; x++) { var k = cells9[y * 3 + x]; s[k.s] = 1; if (k.n !== x + 1) return false; }
      if (Object.keys(s).length !== 3) return false;
    }
    for (var x2 = 0; x2 < 3; x2++) {
      var cc = {};
      for (var y2 = 0; y2 < 3; y2++) cc[cells9[y2 * 3 + x2].c] = 1;
      if (Object.keys(cc).length !== 3) return false;
    }
    return true;
  }
  // A round of patterns: level 0 pictures, 1 easy numbers, 2 hard numbers, 3 matrices.
  function patternRound(level, seed, count) {
    var r = rng(seed), out = [];
    for (var i = 0; i < (count || 6); i++) {
      var q = level <= 0 ? picMake(r) : level === 1 ? numMake(r, false) : level === 2 ? numMake(r, true) : (i % 2 ? matMake(r) : numMake(r, true));
      // put the answer in a random place
      var order = shuffle(r, range(q.choices.length));
      q.choices = order.map(function (j) { return q.choices[j]; });
      q.answer = order.indexOf(0);
      out.push(q);
    }
    return out;
  }

  // ---------------------------------------------------------------
  // Clear thinking rounds
  // ---------------------------------------------------------------
  function thinkRound(set, seed, count) {
    var r = rng(seed), src = (D.THINK && D.THINK[set]) || [];
    return shuffle(r, src).slice(0, count || 6).map(function (it) {
      var order = shuffle(r, range(it.o.length));
      return { id: it.id, q: it.q, o: order.map(function (j) { return it.o[j]; }), a: order.indexOf(it.a), why: it.why, k: it.k };
    });
  }

  // ---------------------------------------------------------------
  // Levels, stars and the daily puzzle
  // ---------------------------------------------------------------
  // min: lowest age tier the level is offered to (0 beginner … 3 expert)
  var ROOMS = [
    { id: 'sudoku', levels: [
      { id: 'su4p', n: 4, lv: 0, pics: 1, min: 0 }, { id: 'su4', n: 4, lv: 1, min: 1 }, { id: 'su4h', n: 4, lv: 2, min: 1 },
      { id: 'su6a', n: 6, lv: 0, min: 1 }, { id: 'su6b', n: 6, lv: 2, min: 2 },
      { id: 'su9a', n: 9, lv: 0, min: 2 }, { id: 'su9b', n: 9, lv: 1, min: 2 }, { id: 'su9c', n: 9, lv: 2, min: 3 }] },
    { id: 'nono', levels: [
      { id: 'no5', size: 5, min: 0 }, { id: 'no7', size: 7, min: 1 }, { id: 'no10', size: 10, min: 2 }] },
    { id: 'grid', levels: [
      { id: 'lg3p', lv: 0, min: 0 }, { id: 'lg3', lv: 1, min: 1 }, { id: 'lg4', lv: 2, min: 2 }, { id: 'lg4x3', lv: 3, min: 3 }] },
    { id: 'pattern', levels: [
      { id: 'pa_pic', lv: 0, min: 0 }, { id: 'pa_num1', lv: 1, min: 1 }, { id: 'pa_num2', lv: 2, min: 2 }, { id: 'pa_mat', lv: 3, min: 2 }] },
    { id: 'balance', levels: [
      { id: 'ba_order', lv: 0, min: 0 }, { id: 'ba_eq2', lv: 1, min: 1 }, { id: 'ba_eq3', lv: 2, min: 2 },
      { id: 'co3', coins: 0, min: 1 }, { id: 'co9', coins: 1, min: 2 }, { id: 'co8', coins: 2, min: 2 }, { id: 'co12', coins: 3, min: 3 }] },
    { id: 'river', levels: [
      { id: 'rv_fox', river: 'fox', min: 1 }, { id: 'rv_family', river: 'family', min: 1 },
      { id: 'rv_bridge', river: 'bridge', min: 2 }, { id: 'rv_hens', river: 'hens', min: 2 }] },
    { id: 'knights', levels: [
      { id: 'kk2', lv: 0, min: 1 }, { id: 'kk3', lv: 1, min: 2 }, { id: 'kk3h', lv: 2, min: 3 }] },
    { id: 'think', levels: [
      { id: 'ct_fo', set: 'fo', min: 1 }, { id: 'ct_need', set: 'need', min: 2 }, { id: 'ct_arg', set: 'arg', min: 2 }] }
  ];
  var LEVEL_BY_ID = {};
  ROOMS.forEach(function (rm) { rm.levels.forEach(function (l) { l.room = rm.id; LEVEL_BY_ID[l.id] = l; }); });

  // Levels a kid sees: their own tier and one above (so there is always
  // something harder to try), and every easier one.
  function levelsFor(roomId, tier) {
    var t = tierIdx(tier), rm = ROOMS.filter(function (x) { return x.id === roomId; })[0];
    return rm ? rm.levels.filter(function (l) { return l.min <= t + 1; }) : [];
  }
  function roomsFor(tier) { return ROOMS.filter(function (rm) { return levelsFor(rm.id, tier).length; }).map(function (rm) { return rm.id; }); }

  // Stars for one solved puzzle from the hints and mistakes it took.
  function puzzleStars(hints, mistakes) {
    var p = (hints | 0) + (mistakes | 0);
    return p === 0 ? 3 : p <= 2 ? 2 : 1;
  }
  // Stars for a round of questions.
  function roundStars(right, total) {
    if (!total) return 0;
    var f = right / total;
    return f >= 0.99 ? 3 : f >= 0.66 ? 2 : f >= 0.33 ? 1 : 0;
  }
  // River: fewest crossings = 3 stars, a few more = 2, any = 1.
  function riverStars(id, st, hints) {
    var P = RIVERS[id], s;
    if (P.time) s = st.minutes <= P.limit ? 3 : st.minutes <= P.limit + 4 ? 2 : 1;
    else { var min = riverSolve(id).cost; s = st.moves <= min ? 3 : st.moves <= min + 4 ? 2 : 1; }
    return Math.max(1, s - (hints | 0));
  }

  // The daily puzzle: the same one all day for a tier, a new kind each day.
  var DAILY = {
    beginner:     ['su4p', 'no5', 'pa_pic', 'lg3p', 'ba_order'],
    intermediate: ['su4', 'no5', 'lg3', 'kk2', 'ba_eq2', 'su6a', 'no7'],
    advanced:     ['su6b', 'no7', 'lg4', 'kk3', 'ba_eq3', 'su9a', 'no10'],
    expert:       ['su9b', 'no10', 'lg4x3', 'kk3h', 'ba_eq3', 'su9c', 'kk3']
  };
  function dayNumber(dateStr) {
    var p = String(dateStr).split('-').map(Number);
    return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
  }
  function dailyPick(dateStr, tier) {
    var list = DAILY[TIERS[tierIdx(tier)]], n = dayNumber(dateStr);
    return { level: list[((n % list.length) + list.length) % list.length], seed: hashStr('logica-daily-' + dateStr + '-' + tier) };
  }
  function prevDay(dateStr) {
    var d = new Date(dayNumber(dateStr) * 86400000 - 86400000);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  // Streak after solving today's puzzle (daily = {last, streak, best, n}).
  function dailySolve(daily, today) {
    daily = daily || {};
    if (daily.last === today) return daily;
    var streak = daily.last === prevDay(today) ? (daily.streak | 0) + 1 : 1;
    return { last: today, streak: streak, best: Math.max(daily.best | 0, streak), n: (daily.n | 0) + 1 };
  }
  // The streak to show today (it is broken once a whole day is missed).
  function dailyStreak(daily, today) {
    if (!daily || !daily.last) return 0;
    return daily.last === today || daily.last === prevDay(today) ? (daily.streak | 0) : 0;
  }

  return {
    TIERS: TIERS, ROOMS: ROOMS, LEVEL_BY_ID: LEVEL_BY_ID, RIVERS: RIVERS, SHAPES: SHAPES, COLORS: COLORS,
    COIN_LEVELS: COIN_LEVELS, GRID_LEVELS: GRID_LEVELS, KK_LEVELS: KK_LEVELS, FAMILIES: FAMILIES, DAILY: DAILY,
    rng: rng, hashStr: hashStr, shuffle: shuffle, tierIdx: tierIdx,
    sudokuSolve: sudokuSolve, sudokuMake: sudokuMake, sudokuCands: sudokuCands, sudokuHint: sudokuHint, sudokuBox: sudokuBox, boxOf: boxOf,
    lineClue: lineClue, lineSolve: lineSolve, nonoClues: nonoClues, nonoSolve: nonoSolve, nonoMake: nonoMake, nonoPictures: nonoPictures, nonoHint: nonoHint, parsePicture: parsePicture,
    gridMake: gridMake, gridCount: gridCount, gridTruth: gridTruth, gridClueText: gridClueText,
    kkMake: kkMake, kkCount: kkCount, kkTruth: kkTruth, kkText: kkText,
    balMake: balMake, balCount: balCount, sideWeight: sideWeight,
    coinsNew: coinsNew, coinsWeigh: coinsWeigh, coinsGuess: coinsGuess, coinsOf: coinsOf, coinOutcome: coinOutcome,
    riverStart: riverStart, riverMove: riverMove, riverDone: riverDone, riverSolve: riverSolve, riverBanks: riverBanks,
    patternRound: patternRound, predictions: predictions, minPeriod: minPeriod, tokKey: tokKey, matFits: matFits,
    thinkRound: thinkRound,
    levelsFor: levelsFor, roomsFor: roomsFor, puzzleStars: puzzleStars, roundStars: roundStars, riverStars: riverStars,
    dailyPick: dailyPick, dailySolve: dailySolve, dailyStreak: dailyStreak, prevDay: prevDay
  };
})(typeof LogicaData !== 'undefined' ? LogicaData : require('./logica-data.js'));

if (typeof module !== 'undefined' && module.exports) module.exports = LogicaEngine;
