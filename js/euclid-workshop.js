/* ================================================================
   EUCLID'S WORKSHOP · Taller de Euclides
   Classical compass-and-straightedge geometry, learned by building.

   Engine: points, lines / segments / rays and circles with exact
   intersection math (line–line, line–circle, circle–circle). Every
   crossing becomes a point you can use. Goals are checked
   geometrically with a tiny tolerance, so a construction only counts
   when it is exact — eyeballing a point never passes.

   Solving a challenge replays YOUR construction step by step with a
   "why it works" note, and some constructions then become shortcut
   tools for later challenges (the classical way: once proved, use it).

   Per-kid storage: getUserAppKey('zs_euclid_') →
     { v:1, levels: { <id>: { stars, best, at } }, guided?, last? }
   ================================================================ */

var EuclidWorkshop = (function() {
  'use strict';

  var D = EuclidData, ART = EuclidArt;
  var LEVELS = D.LEVELS;
  var PREFIX = 'zs_euclid_';
  var MERGE = 1e-5;        // two points closer than this are the same point
  var GOAL_TOL = 1e-3;     // goal tolerance (drawing units; ~1/1000 of a pixel at 1×)
  var TAU = Math.PI * 2;
  var APP_NAME = "Euclid's Workshop";

  // ================================================================
  // Storage
  // ================================================================
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    return getUserAppKey(PREFIX);
  }
  function _load() {
    var key = _key();
    if (!key) return { v: 1, levels: {} };
    try {
      var d = JSON.parse(localStorage.getItem(key)) || {};
      if (!d.levels || typeof d.levels !== 'object') d.levels = {};
      d.v = 1;
      return d;
    } catch (e) { return { v: 1, levels: {} }; }
  }
  function _save(d) {
    var key = _key();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }

  var data = { v: 1, levels: {} };
  var user = null, age = 8;

  function levelById(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return null;
  }
  function levelIndex(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return i;
    return -1;
  }
  function solved(id) { return !!(data.levels[id] && data.levels[id].stars > 0); }
  function starsOf(id) { return (data.levels[id] && data.levels[id].stars) || 0; }
  function totalStars() {
    var n = 0;
    for (var k in data.levels) n += (data.levels[k] && data.levels[k].stars) || 0;
    return n;
  }
  function unlockedSet() {
    var u = {};
    for (var k in D.SHORTCUTS) u[k] = solved(D.SHORTCUTS[k].teach);
    return u;
  }
  function allUnlocked() {
    var u = {};
    for (var k in D.SHORTCUTS) u[k] = true;
    return u;
  }
  function guidedPref() {
    if (typeof data.guided === 'boolean') return data.guided;
    return age <= 7;
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''); }
  function sfx(name) { try { if (typeof SFX !== 'undefined' && SFX[name]) SFX[name](); } catch (e) {} }
  function toast(msg) {
    if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg);
  }

  // ================================================================
  // Geometry
  // ================================================================
  function lin(type, x0, y0, dx, dy, len) {
    var l = Math.hypot(dx, dy) || 1;
    return { type: type, x0: x0, y0: y0, dx: dx / l, dy: dy / l,
             tmin: type === 'line' ? -Infinity : 0,
             tmax: type === 'segment' ? len : Infinity };
  }
  function linThrough(type, a, b) {
    return lin(type, a.x, a.y, b.x - a.x, b.y - a.y, Math.hypot(b.x - a.x, b.y - a.y));
  }
  function circ(cx, cy, r) { return { type: 'circle', cx: cx, cy: cy, r: r }; }
  function isLin(o) { return o.type !== 'circle'; }
  function tOn(o, x, y) { return (x - o.x0) * o.dx + (y - o.y0) * o.dy; }
  function distLine(o, x, y) { return Math.abs((x - o.x0) * o.dy - (y - o.y0) * o.dx); }
  function inR(o, t, tol) { tol = tol || 1e-7; return t >= o.tmin - tol && t <= o.tmax + tol; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function intersect(a, b) {
    var out = [], t, i;
    if (isLin(a) && isLin(b)) {
      var den = a.dx * b.dy - a.dy * b.dx;
      if (Math.abs(den) < 1e-12) return out;
      var wx = b.x0 - a.x0, wy = b.y0 - a.y0;
      t = (wx * b.dy - wy * b.dx) / den;
      var u = (wx * a.dy - wy * a.dx) / den;
      if (inR(a, t) && inR(b, u)) out.push({ x: a.x0 + a.dx * t, y: a.y0 + a.dy * t });
      return out;
    }
    if (!isLin(a)) { var tmp = a; a = b; b = tmp; }
    if (isLin(a)) {                              // a: line-ish, b: circle
      var fx = a.x0 - b.cx, fy = a.y0 - b.cy;
      var bb = fx * a.dx + fy * a.dy, cc = fx * fx + fy * fy - b.r * b.r;
      var disc = bb * bb - cc, tol = 1e-9 * Math.max(1, b.r * b.r);
      if (disc < -tol) return out;
      var ts = disc <= tol ? [-bb] : [-bb - Math.sqrt(disc), -bb + Math.sqrt(disc)];
      for (i = 0; i < ts.length; i++) if (inR(a, ts[i])) out.push({ x: a.x0 + a.dx * ts[i], y: a.y0 + a.dy * ts[i] });
      return out;
    }
    var dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy);   // circle–circle
    if (d < 1e-9) return out;
    var A = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
    var h2 = a.r * a.r - A * A, tol2 = 1e-9 * Math.max(1, a.r * a.r, b.r * b.r);
    if (h2 < -tol2) return out;
    var mx = a.cx + dx * A / d, my = a.cy + dy * A / d;
    if (h2 <= tol2) { out.push({ x: mx, y: my }); return out; }
    var h = Math.sqrt(h2), ox = -dy * h / d, oy = dx * h / d;
    out.push({ x: mx + ox, y: my + oy }, { x: mx - ox, y: my - oy });
    return out;
  }

  // ================================================================
  // Scene: points + objects, intersections created automatically
  // ================================================================
  function Scene() { this.pts = []; this.objs = []; this.seq = 1; }
  Scene.prototype.ptAt = function(x, y, tol, filter) {
    var best = null, bd = tol || MERGE;
    for (var i = 0; i < this.pts.length; i++) {
      var p = this.pts[i];
      if (filter && !filter(p)) continue;
      var d = Math.hypot(p.x - x, p.y - y);
      if (d <= bd) { bd = d; best = p; }
    }
    return best;
  };
  Scene.prototype.addPt = function(x, y, kind, meta) {
    var ex = this.ptAt(x, y);
    if (ex) return { p: ex, fresh: false };
    meta = meta || {};
    var p = { id: this.seq++, x: x, y: y, kind: kind, label: meta.label || '',
              parents: meta.parents || null, inPts: meta.inPts || null, onObj: meta.onObj || null,
              tool: meta.tool || null, lp: meta.lp };
    this.pts.push(p);
    return { p: p, fresh: true };
  };
  Scene.prototype.same = function(a, b) {
    if (a.type === 'circle' || b.type === 'circle') {
      return a.type === b.type && Math.abs(a.cx - b.cx) < MERGE && Math.abs(a.cy - b.cy) < MERGE && Math.abs(a.r - b.r) < MERGE;
    }
    if (a.type !== b.type) return false;
    if (Math.abs(a.dx * b.dy - a.dy * b.dx) > 1e-9 || distLine(a, b.x0, b.y0) > MERGE) return false;
    if (a.type === 'line') return true;
    if (a.type === 'ray') return Math.hypot(a.x0 - b.x0, a.y0 - b.y0) < MERGE && (a.dx * b.dx + a.dy * b.dy) > 0;
    var a1x = a.x0 + a.dx * a.tmax, a1y = a.y0 + a.dy * a.tmax, b1x = b.x0 + b.dx * b.tmax, b1y = b.y0 + b.dy * b.tmax;
    return (Math.hypot(a.x0 - b.x0, a.y0 - b.y0) < MERGE && Math.hypot(a1x - b1x, a1y - b1y) < MERGE) ||
           (Math.hypot(a.x0 - b1x, a.y0 - b1y) < MERGE && Math.hypot(a1x - b.x0, a1y - b.y0) < MERGE);
  };
  Scene.prototype.addObj = function(o) {
    var i;
    for (i = 0; i < this.objs.length; i++) if (this.same(this.objs[i], o)) return { o: this.objs[i], dup: true, fresh: [] };
    o.id = this.seq++;
    var fresh = [], self = this;
    for (i = 0; i < this.objs.length; i++) {
      var q = this.objs[i];
      intersect(o, q).forEach(function(x) {
        var r = self.addPt(x.x, x.y, 'isect', { parents: [q.id, o.id] });
        if (r.fresh) fresh.push(r.p);
      });
    }
    this.objs.push(o);
    return { o: o, dup: false, fresh: fresh };
  };
  Scene.prototype.obj = function(id) {
    for (var i = 0; i < this.objs.length; i++) if (this.objs[i].id === id) return this.objs[i];
    return null;
  };
  Scene.prototype.pt = function(id) {
    for (var i = 0; i < this.pts.length; i++) if (this.pts[i].id === id) return this.pts[i];
    return null;
  };
  Scene.prototype.removeIds = function(ids) {
    var set = {};
    ids.forEach(function(id) { set[id] = true; });
    this.objs = this.objs.filter(function(o) { return !set[o.id]; });
    this.pts = this.pts.filter(function(p) { return !set[p.id]; });
  };
  Scene.prototype.linThrough = function(a, b) {
    var best = null;
    for (var i = 0; i < this.objs.length; i++) {
      var o = this.objs[i];
      if (!isLin(o)) continue;
      if (distLine(o, a.x, a.y) < 1e-5 && distLine(o, b.x, b.y) < 1e-5) {
        if (!best || o.type === 'line') best = o;
      }
    }
    return best;
  };

  // ---- construction operations (shared by play, hints and replays) ----
  function opCircle(sc, c, p) {
    var o = circ(c.x, c.y, dist(c, p));
    o.inPts = [c.id, p.id]; o.tool = 'circle'; o.start = Math.atan2(p.y - c.y, p.x - c.x);
    return sc.addObj(o);
  }
  function opTransfer(sc, a, b, c) {
    var o = circ(c.x, c.y, dist(a, b));
    o.inPts = [a.id, b.id, c.id]; o.tool = 'transfer'; o.start = Math.atan2(b.y - a.y, b.x - a.x);
    return sc.addObj(o);
  }
  function opLine(sc, a, b, type) {
    var o = linThrough(type, a, b);
    o.inPts = [a.id, b.id]; o.tool = type;
    return sc.addObj(o);
  }
  function opPerpBis(sc, a, b) {
    var o = lin('line', (a.x + b.x) / 2, (a.y + b.y) / 2, -(b.y - a.y), b.x - a.x);
    o.inPts = [a.id, b.id]; o.tool = 'perpbis';
    return sc.addObj(o);
  }
  function opMidpoint(sc, a, b) {
    var r = sc.addPt((a.x + b.x) / 2, (a.y + b.y) / 2, 'derived', { inPts: [a.id, b.id], tool: 'midpoint' });
    return { p: r.p, dup: !r.fresh, fresh: r.fresh ? [r.p] : [] };
  }
  function opPerp(sc, l, p) {
    var o = lin('line', p.x, p.y, -l.dy, l.dx);
    o.inPts = [p.id]; o.inObjs = [l.id]; o.tool = 'perp';
    return sc.addObj(o);
  }
  function opParallel(sc, l, p) {
    var o = lin('line', p.x, p.y, l.dx, l.dy);
    o.inPts = [p.id]; o.inObjs = [l.id]; o.tool = 'parallel';
    return sc.addObj(o);
  }
  function opAngleBis(sc, a, v, b) {
    var la = dist(a, v) || 1, lb = dist(b, v) || 1;
    var ux = (a.x - v.x) / la + (b.x - v.x) / lb, uy = (a.y - v.y) / la + (b.y - v.y) / lb;
    if (Math.hypot(ux, uy) < 1e-9) { ux = -(a.y - v.y); uy = a.x - v.x; }
    var o = lin('line', v.x, v.y, ux, uy);
    o.inPts = [a.id, v.id, b.id]; o.tool = 'anglebis';
    return sc.addObj(o);
  }
  function runOp(sc, tool, args) {
    switch (tool) {
      case 'circle':   return opCircle(sc, args[0], args[1]);
      case 'transfer': return opTransfer(sc, args[0], args[1], args[2]);
      case 'line':     return opLine(sc, args[0], args[1], 'line');
      case 'segment':  return opLine(sc, args[0], args[1], 'segment');
      case 'perpbis':  return opPerpBis(sc, args[0], args[1]);
      case 'midpoint': return opMidpoint(sc, args[0], args[1]);
      case 'perp':     return opPerp(sc, args[0], args[1]);
      case 'parallel': return opParallel(sc, args[0], args[1]);
      case 'anglebis': return opAngleBis(sc, args[0], args[1], args[2]);
    }
    return null;
  }

  // ---- a level's starting sheet ----
  function buildScene(L) {
    var sc = new Scene(), P = {}, byLabel = {};
    L.givens.points.forEach(function(g) {
      var r = sc.addPt(g[1], g[2], 'given', { label: g[0], lp: g[3] });
      byLabel[g[0]] = r.p; P[g[0]] = [g[1], g[2]];
    });
    L.givens.objs.forEach(function(g) {
      var o;
      if (g.t === 'circle') {
        var c = Array.isArray(g.c) ? { x: g.c[0], y: g.c[1] } : byLabel[g.c];
        o = circ(c.x, c.y, g.r != null ? g.r : dist(c, byLabel[g.p]));
        o.start = -Math.PI / 2;
      } else if (g.dir) {
        o = lin(g.t, byLabel[g.a].x, byLabel[g.a].y, g.dir[0], g.dir[1], 0);
      } else {
        o = linThrough(g.t, byLabel[g.a], byLabel[g.b]);
      }
      o.given = true; o.inPts = [];
      sc.addObj(o);
    });
    return { sc: sc, P: P, byLabel: byLabel };
  }

  // ---- goals ----
  function exactPt(p) { return p.kind === 'isect' || p.kind === 'derived'; }
  function matchGoal(sc, g) {
    var i;
    if (g.k === 'pt') {
      for (i = 0; i < sc.pts.length; i++) {
        var p = sc.pts[i];
        if (exactPt(p) && Math.hypot(p.x - g.x, p.y - g.y) < GOAL_TOL) return { pt: p };
      }
      return null;
    }
    for (i = 0; i < sc.objs.length; i++) {
      var o = sc.objs[i];
      if (o.given) continue;
      if (g.k === 'circle') {
        if (o.type === 'circle' && Math.abs(o.cx - g.cx) < GOAL_TOL && Math.abs(o.cy - g.cy) < GOAL_TOL && Math.abs(o.r - g.r) < GOAL_TOL) return { obj: o };
      } else if (isLin(o)) {
        if (g.k === 'line') {
          if (Math.abs(o.dx * g.dy - o.dy * g.dx) < 1e-6 && distLine(o, g.x, g.y) < GOAL_TOL) return { obj: o };
        } else if (g.k === 'seg') {
          if (distLine(o, g.ax, g.ay) < GOAL_TOL && distLine(o, g.bx, g.by) < GOAL_TOL &&
              inR(o, tOn(o, g.ax, g.ay), GOAL_TOL) && inR(o, tOn(o, g.bx, g.by), GOAL_TOL)) return { obj: o };
        }
      }
    }
    return null;
  }
  function goalStatus(sc, alts) {
    var best = null;
    alts.forEach(function(alt, i) {
      var m = alt.map(function(g) { return matchGoal(sc, g); });
      var n = m.filter(Boolean).length;
      if (!best || n > best.n) best = { i: i, n: n, total: alt.length, m: m, alt: alt };
    });
    best.done = best.n === best.total;
    return best;
  }

  // ================================================================
  // Model solutions: resolve a level's script into concrete moves.
  // Locked shortcuts are expanded into compass/straightedge moves.
  // ================================================================
  function resolve(L, unlocked) {
    var b = buildScene(L), sc = b.sc, names = {}, moves = [];
    var k;
    for (k in b.byLabel) names[k] = b.byLabel[k];

    function need(x, what) {
      if (!x) throw new Error('Euclid script: cannot find ' + what + ' in ' + L.id);
      return x;
    }
    function find(x, y) { return need(sc.ptAt(x, y, 1e-4), 'point ' + x.toFixed(2) + ',' + y.toFixed(2)); }
    function doOp(tool, args) {
      var r = runOp(sc, tool, args);
      if (!r.dup) moves.push({ tool: tool, args: args, res: r.o || r.p });
      return r.o || r.p;
    }
    function perpbis(a, c) {
      if (unlocked.perpbis) return doOp('perpbis', [a, c]);
      var r = dist(a, c);
      doOp('circle', [a, c]); doOp('circle', [c, a]);
      var xs = intersect(circ(a.x, a.y, r), circ(c.x, c.y, r));
      return doOp('line', [find(xs[0].x, xs[0].y), find(xs[1].x, xs[1].y)]);
    }
    function midpoint(a, c) {
      if (unlocked.midpoint) return doOp('midpoint', [a, c]);
      perpbis(a, c);
      var mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2;
      var has = sc.objs.some(function(o) {
        return isLin(o) && distLine(o, a.x, a.y) < 1e-5 && distLine(o, c.x, c.y) < 1e-5 && inR(o, tOn(o, mx, my), 1e-5);
      });
      if (!has) doOp('segment', [a, c]);
      return find(mx, my);
    }
    function perp(l, p) {
      if (unlocked.perp) return doOp('perp', [l, p]);
      var t = tOn(l, p.x, p.y), fx = l.x0 + l.dx * t, fy = l.y0 + l.dy * t;
      var q = null, qs = -Infinity;
      sc.pts.forEach(function(c) {
        if (distLine(l, c.x, c.y) > 1e-5 || !inR(l, tOn(l, c.x, c.y), 1e-5)) return;
        var df = Math.hypot(c.x - fx, c.y - fy);
        if (Math.hypot(c.x - p.x, c.y - p.y) < 1 || df < 1) return;
        var rx = 2 * fx - c.x, ry = 2 * fy - c.y;
        if (!inR(l, tOn(l, rx, ry), 1e-5)) return;
        var score = (c.label ? 1000 : 0) - df;
        if (score > qs) { qs = score; q = c; }
      });
      if (!q && l.type !== 'line') {
        // a segment ends too soon: extend it into a full line first
        var on = sc.pts.filter(function(c) { return distLine(l, c.x, c.y) < 1e-5 && inR(l, tOn(l, c.x, c.y), 1e-5); });
        if (on.length >= 2) return perp(doOp('line', [on[0], on[1]]), p);
      }
      need(q, 'a point on the line for a perpendicular');
      doOp('circle', [p, q]);
      return perpbis(q, find(2 * fx - q.x, 2 * fy - q.y));
    }
    function parallel(l, p) {
      if (unlocked.parallel) return doOp('parallel', [l, p]);
      return perp(perp(l, p), p);
    }
    function anglebis(a, v, c) {
      if (unlocked.anglebis) return doOp('anglebis', [a, v, c]);
      var da = dist(v, a), dc = dist(v, c);
      var near = da <= dc ? a : c, far = da <= dc ? c : a, r = Math.min(da, dc);
      doOp('circle', [v, near]);
      var df = dist(v, far);
      var x = find(v.x + (far.x - v.x) / df * r, v.y + (far.y - v.y) / df * r);
      return perpbis(near, x);
    }

    L.script.forEach(function(s) {
      var op = s[0];
      function N(lbl) { return need(names[lbl], 'label ' + lbl); }
      if (op === 'name') {
        var p = sc.ptAt(s[2], s[3], 6, function(q) { return q.kind !== 'given' && q.kind !== 'free'; });
        need(p, 'named point ' + s[1]);
        p.label = s[1]; names[s[1]] = p;
        return;
      }
      if (op === 'circle') doOp('circle', [N(s[1]), N(s[2])]);
      else if (op === 'transfer') doOp('transfer', [N(s[1]), N(s[2]), N(s[3])]);
      else if (op === 'line' || op === 'segment') doOp(op, [N(s[1]), N(s[2])]);
      else if (op === 'perpbis') perpbis(N(s[1]), N(s[2]));
      else if (op === 'midpoint') midpoint(N(s[1]), N(s[2]));
      else if (op === 'perp') perp(need(sc.linThrough(N(s[1][0]), N(s[1][1])), 'line ' + s[1]), N(s[2]));
      else if (op === 'parallel') parallel(need(sc.linThrough(N(s[1][0]), N(s[1][1])), 'line ' + s[1]), N(s[2]));
      else if (op === 'anglebis') anglebis(N(s[1]), N(s[2]), N(s[3]));
    });

    // give a letter to every unnamed point a move uses, so guidance can name it
    var used = {};
    sc.pts.forEach(function(p) { if (p.label) used[p.label] = true; });
    var pool = 'CDEFGHJKLMNPQRSTUVWXYZ'.split('').filter(function(c) { return !used[c]; });
    moves.forEach(function(m) {
      m.args.forEach(function(a) {
        if (a && a.x != null && !a.label && pool.length) a.label = pool.shift();
      });
    });
    return { sc: sc, moves: moves };
  }

  // ---- is a model move already present in the player's sheet? ----
  function moveDone(sc, mv) {
    var r = mv.res;
    if (mv.tool === 'midpoint') return !!sc.ptAt(r.x, r.y, 1e-4, exactPt);
    if (r.type === 'circle') {
      return sc.objs.some(function(o) {
        return o.type === 'circle' && Math.abs(o.cx - r.cx) < 1e-4 && Math.abs(o.cy - r.cy) < 1e-4 && Math.abs(o.r - r.r) < 1e-4;
      });
    }
    var ex = r.x0 + r.dx * r.tmax, ey = r.y0 + r.dy * r.tmax;
    return sc.objs.some(function(o) {
      if (!isLin(o) || Math.abs(o.dx * r.dy - o.dy * r.dx) > 1e-6 || distLine(o, r.x0, r.y0) > 1e-4) return false;
      if (r.type === 'line') return o.type === 'line';      // a short segment does not replace a full line
      if (r.type !== 'segment') return true;
      return inR(o, tOn(o, r.x0, r.y0), 1e-4) && inR(o, tOn(o, ex, ey), 1e-4);
    });
  }

  // ================================================================
  // Words: tool names, step descriptions, guided instructions
  // ================================================================
  var TOOLS = {
    point:    { name: 'Point',         es: 'Punto' },
    line:     { name: 'Straight\u00ADedge', es: 'Regla', long: 'Straightedge' },
    segment:  { name: 'Segment',       es: 'Segmento' },
    circle:   { name: 'Compass',       es: 'Compás' },
    transfer: { name: 'Fixed compass', es: 'Compás fijo' },
    perpbis:  { name: '⊥ Bisector',    es: 'Mediatriz', long: 'Perpendicular bisector' },
    midpoint: { name: 'Midpoint',      es: 'Punto medio' },
    perp:     { name: 'Perpendicular', es: 'Perpendicular' },
    parallel: { name: 'Parallel',      es: 'Paralela' },
    anglebis: { name: 'Angle bisector', es: 'Bisectriz' }
  };
  var TOOL_SEQ = {
    point: [], line: ['pt', 'pt'], segment: ['pt', 'pt'], circle: ['pt', 'pt'], transfer: ['pt', 'pt', 'pt'],
    perpbis: ['pt', 'pt'], midpoint: ['pt', 'pt'], perp: ['lin', 'pt'], parallel: ['lin', 'pt'], anglebis: ['pt', 'pt', 'pt']
  };
  function toolLong(t) { return TOOLS[t].long || TOOLS[t].name; }

  function describe(tool, args, lbl, lineLbl) {
    var a = args[0], b = args[1], c = args[2];
    switch (tool) {
      case 'circle':   return 'Compass: centre ' + lbl(a) + ', through ' + lbl(b) + '.';
      case 'transfer': return 'Fixed compass: copy the length ' + lbl(a) + lbl(b) + ' to centre ' + lbl(c) + '.';
      case 'line':     return 'Straightedge: line through ' + lbl(a) + ' and ' + lbl(b) + '.';
      case 'segment':  return 'Segment from ' + lbl(a) + ' to ' + lbl(b) + '.';
      case 'perpbis':  return 'Perpendicular bisector of ' + lbl(a) + lbl(b) + '.';
      case 'midpoint': return 'Midpoint of ' + lbl(a) + lbl(b) + '.';
      case 'perp':     return 'Perpendicular to ' + lineLbl(a) + ' through ' + lbl(b) + '.';
      case 'parallel': return 'Parallel to ' + lineLbl(a) + ' through ' + lbl(b) + '.';
      case 'anglebis': return 'Bisect the angle ' + lbl(a) + lbl(b) + lbl(c) + '.';
    }
    return '';
  }
  function guideTaps(tool, args, lbl, lineLbl) {
    var a = args[0], b = args[1], c = args[2];
    switch (tool) {
      case 'circle':   return ['Put the compass needle on ' + lbl(a) + '.', 'Now open the pencil to ' + lbl(b) + ' — the compass swings a full circle.'];
      case 'transfer': return ['Measure first: tap ' + lbl(a) + '…', '…then ' + lbl(b) + ' to set the opening.', 'Now put the needle on ' + lbl(c) + '.'];
      case 'line':     return ['Lay the straightedge on ' + lbl(a) + '…', '…and on ' + lbl(b) + '.'];
      case 'segment':  return ['Start the segment at ' + lbl(a) + '…', '…and finish it at ' + lbl(b) + '.'];
      case 'perpbis':
      case 'midpoint': return ['Tap ' + lbl(a) + '…', '…then ' + lbl(b) + '.'];
      case 'perp':
      case 'parallel': return ['Tap ' + lineLbl(a) + '…', '…then the point ' + lbl(b) + '.'];
      case 'anglebis': return ['Tap ' + lbl(a) + ' on one arm…', '…then the corner ' + lbl(b) + '…', '…then ' + lbl(c) + ' on the other arm.'];
    }
    return [];
  }
  function resLbl(p) { return p && p.label ? p.label : 'the glowing point'; }
  function resLineLbl(sc) {
    return function(l) {
      var on = sc.pts.filter(function(p) { return p.label && distLine(l, p.x, p.y) < 1e-5 && inR(l, tOn(l, p.x, p.y), 1e-5); });
      return on.length >= 2 ? 'line ' + on[0].label + on[1].label : 'the glowing line';
    };
  }

  // ================================================================
  // State
  // ================================================================
  var G = null;                         // the challenge being played
  var V = { cx: 0, cy: 0, z: 1 };       // view: centre (world) and zoom
  var cv = null, ctx = null, W = 0, H = 0, DPR = 1;
  var paperImg = null, graphite = null, paperKey = '';
  var rafId = 0, dirty = true, running = false;
  var hero = null;
  var reduceMotion = false;
  var frozen = null;          // test hook: hold animations at a fixed fraction

  function toolsFor(idx) {
    var list = ['point', 'line', 'segment', 'circle'];
    if (idx >= levelIndex('copy-segment')) list.push('transfer');
    ['perpbis', 'midpoint', 'perp', 'anglebis', 'parallel'].forEach(function(k) {
      if (levelIndex(D.SHORTCUTS[k].teach) < idx) list.push(k);
    });
    return list;
  }

  // ================================================================
  // HOME
  // ================================================================
  function root() { return document.getElementById('ew-root'); }

  function recommendedChapters() {
    if (age <= 7) return [1];
    if (age <= 9) return [1, 2];
    if (age <= 11) return [2, 3];
    return [3, 4];
  }

  function badgeEarned(b) {
    if (b.needAll) return LEVELS.every(function(L) { return solved(L.id); });
    if (b.needCh) return LEVELS.filter(function(L) { return L.ch === b.needCh; }).every(function(L) { return solved(L.id); });
    return b.need.every(solved);
  }

  function starRow(n, size) {
    var s = '';
    for (var i = 0; i < 3; i++) {
      s += '<svg class="ew-star' + (i < n ? ' on' : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
    }
    return '<span class="ew-stars" aria-label="' + n + ' of 3 stars">' + s + '</span>';
  }

  function showHome() {
    stopLoop();
    G = null;
    var r = root();
    if (!r) return;
    var rec = recommendedChapters();
    var nSolved = LEVELS.filter(function(L) { return solved(L.id); }).length;
    var firstOpen = null;
    for (var i = 0; i < LEVELS.length; i++) {
      if (!solved(LEVELS[i].id) && rec.indexOf(LEVELS[i].ch) >= 0) { firstOpen = LEVELS[i].id; break; }
    }
    if (!firstOpen) for (i = 0; i < LEVELS.length; i++) if (!solved(LEVELS[i].id)) { firstOpen = LEVELS[i].id; break; }
    var guided = guidedPref();

    var h = '';
    h += '<header class="ew-hero">' +
           '<div class="ew-hero-art"><canvas id="ew-hero" aria-hidden="true"></canvas><span class="ew-pin ew-pin-tl"></span><span class="ew-pin ew-pin-tr"></span></div>' +
           '<h1 class="ew-title">Euclid\'s Workshop</h1>' +
           '<p class="ew-sub">Taller de Euclides · Build geometry with only a compass and a straightedge, the way the ancient Greeks did.</p>' +
           '<p class="ew-home-stat"><span class="ew-star-ico" aria-hidden="true">★</span> ' + totalStars() + ' / ' + (LEVELS.length * 3) + ' stars · ' + nSolved + ' of ' + LEVELS.length + ' constructions</p>' +
         '</header>';

    h += '<div class="ew-home-actions">' +
           (firstOpen ? '<button type="button" class="ew-btn ew-btn-primary" data-act="play" data-id="' + firstOpen + '">▶ ' + (nSolved ? 'Continue' : 'Start building') + '</button>' : '') +
           '<button type="button" class="ew-switch" role="switch" aria-checked="' + guided + '" data-act="guided">' +
             '<span class="ew-switch-track"><span class="ew-switch-knob"></span></span>' +
             '<span class="ew-switch-text"><b>Guided mode</b><small>Step-by-step help · Ayuda paso a paso</small></span>' +
           '</button>' +
         '</div>';

    D.CHAPTERS.forEach(function(ch) {
      var lv = LEVELS.filter(function(L) { return L.ch === ch.n; });
      var isRec = rec.indexOf(ch.n) >= 0;
      h += '<section class="ew-chapter">' +
             '<div class="ew-ch-head"><h2>Chapter ' + ch.n + ' · ' + esc(ch.name) + ' <span class="ew-es">· ' + esc(ch.es) + '</span></h2>' +
             (isRec ? '<span class="ew-rec">Recommended</span>' : '') + '</div>' +
             '<p class="ew-ch-note">' + esc(ch.note) + '</p>' +
             '<div class="ew-level-grid">';
      lv.forEach(function(L) {
        var n = levelIndex(L.id) + 1, st = starsOf(L.id);
        h += '<button type="button" class="ew-level' + (st ? ' done' : '') + (L.id === firstOpen ? ' next' : '') + '" data-act="play" data-id="' + L.id + '">' +
               '<canvas class="ew-thumb" data-thumb="' + L.id + '" aria-hidden="true"></canvas>' +
               '<span class="ew-level-n">' + n + '</span>' +
               '<span class="ew-level-name">' + esc(L.name) + '</span>' +
               '<span class="ew-level-es">' + esc(L.es) + '</span>' +
               starRow(st, 16) +
               (L.id === firstOpen ? '<span class="ew-next-tag">Next</span>' : '') +
             '</button>';
      });
      h += '</div></section>';
    });

    // toolbox
    h += '<section class="ew-panel"><h2>Your toolbox <span class="ew-es">· Tu caja de herramientas</span></h2>' +
         '<p class="ew-ch-note">Every proved construction becomes a tool you may use in later challenges.</p><div class="ew-toolbox">';
    ['circle', 'line', 'transfer', 'perpbis', 'midpoint', 'perp', 'anglebis', 'parallel'].forEach(function(t) {
      var sc = D.SHORTCUTS[t];
      var have = !sc || solved(sc.teach);
      var sub = have ? TOOLS[t].es + (t === 'transfer' ? ' · from challenge 2' : '') : 'Solve “' + levelById(sc.teach).name + '”';
      h += '<div class="ew-tb-item' + (have ? '' : ' locked') + '">' + ART.icon(t, 34) +
           '<span><b>' + esc(toolLong(t)) + '</b><small>' + esc(sub) + '</small></span></div>';
    });
    h += '</div></section>';

    // badges
    h += '<section class="ew-panel"><h2>Skill badges <span class="ew-es">· Insignias</span></h2><div class="ew-badges">';
    D.BADGES.forEach(function(b) {
      var on = badgeEarned(b);
      h += '<div class="ew-badge' + (on ? ' on' : '') + '"><span class="ew-badge-ico" aria-hidden="true">' + b.icon + '</span>' +
           '<span><b>' + esc(b.name) + '</b><small>' + esc(b.es) + (on ? ' · earned' : '') + '</small></span></div>';
    });
    h += '</div></section>';

    // history
    h += '<section class="ew-panel ew-library"><h2>From the library <span class="ew-es">· De la biblioteca</span></h2><div class="ew-cards">';
    D.HISTORY.forEach(function(c) {
      h += '<article class="ew-card">' +
             '<div class="ew-card-top"><span class="ew-card-ico" aria-hidden="true">' + c.icon + '</span><span class="ew-when">' + esc(c.when) + '</span></div>' +
             '<h3>' + esc(c.title) + '</h3><p class="ew-card-es">' + esc(c.es) + '</p>' +
             '<p>' + esc(c.text) + '</p>' +
             '<p class="ew-more" id="ew-more-' + c.id + '" hidden>' + esc(c.more) + '</p>' +
             '<button type="button" class="ew-link" data-act="more" data-id="' + c.id + '" aria-expanded="false" aria-controls="ew-more-' + c.id + '">Read more</button>' +
           '</article>';
    });
    h += '</div></section>';

    r.innerHTML = '<div class="ew-home">' + h + '</div>';
    drawThumbs();
    startHero();
    window.scrollTo(0, 0);
  }

  // ---- level thumbnails ----
  var thumbPaper = null;
  function drawThumbs() {
    var list = document.querySelectorAll('canvas[data-thumb]');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    Array.prototype.forEach.call(list, function(c) {
      var L = levelById(c.getAttribute('data-thumb'));
      var w = c.clientWidth || 140, h = c.clientHeight || 92;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      var g = c.getContext('2d');
      if (!thumbPaper) thumbPaper = ART.makePaper(280, 184, 1);
      g.drawImage(thumbPaper, 0, 0, c.width, c.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var b = buildScene(L), alts = L.goal(b.P);
      var xs = [], ys = [];
      b.sc.pts.forEach(function(p) { xs.push(p.x); ys.push(p.y); });
      b.sc.objs.forEach(function(o) { if (o.type === 'circle') { xs.push(o.cx - o.r, o.cx + o.r); ys.push(o.cy - o.r, o.cy + o.r); } });
      alts[0].forEach(function(t) {
        if (t.k === 'pt' || t.k === 'line') { xs.push(t.x); ys.push(t.y); }
        if (t.k === 'seg') { xs.push(t.ax, t.bx); ys.push(t.ay, t.by); }
        if (t.k === 'circle') { xs.push(t.cx - t.r, t.cx + t.r); ys.push(t.cy - t.r, t.cy + t.r); }
      });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var z = Math.min((w - 18) / Math.max(x1 - x0, 1), (h - 18) / Math.max(y1 - y0, 1));
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      function S(x, y) { return [(x - cx) * z + w / 2, (y - cy) * z + h / 2]; }
      g.lineCap = 'round';
      function drawO(o, style) {
        g.beginPath();
        if (o.type === 'circle') { var c0 = S(o.cx, o.cy); g.arc(c0[0], c0[1], o.r * z, 0, TAU); }
        else {
          var t0 = isFinite(o.tmin) ? o.tmin : -400, t1 = isFinite(o.tmax) ? o.tmax : 400;
          var a = S(o.x0 + o.dx * t0, o.y0 + o.dy * t0), e = S(o.x0 + o.dx * t1, o.y0 + o.dy * t1);
          g.moveTo(a[0], a[1]); g.lineTo(e[0], e[1]);
        }
        g.strokeStyle = style; g.stroke();
      }
      g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
      g.setLineDash([3, 3]); g.lineWidth = 1.3;
      alts[0].forEach(function(t) {
        if (t.k === 'seg') drawO(linThrough('segment', { x: t.ax, y: t.ay }, { x: t.bx, y: t.by }), 'rgba(164,50,28,0.85)');
        if (t.k === 'line') drawO(lin('line', t.x, t.y, t.dx, t.dy), 'rgba(164,50,28,0.85)');
        if (t.k === 'circle') drawO(circ(t.cx, t.cy, t.r), 'rgba(164,50,28,0.85)');
      });
      g.setLineDash([]); g.lineWidth = 1.5;
      b.sc.objs.forEach(function(o) { drawO(o, '#2a2018'); });
      b.sc.pts.forEach(function(p) {
        var s = S(p.x, p.y);
        g.fillStyle = '#2a2018'; g.beginPath(); g.arc(s[0], s[1], 2.2, 0, TAU); g.fill();
      });
      alts[0].forEach(function(t) {
        if (t.k !== 'pt') return;
        var s = S(t.x, t.y);
        g.strokeStyle = '#a4321c'; g.lineWidth = 1.4; g.beginPath(); g.arc(s[0], s[1], 4, 0, TAU); g.stroke();
      });
      g.restore();
    });
  }

  // ---- animated hero: the compass drawing Proposition 1 ----
  function startHero() {
    var c = document.getElementById('ew-hero');
    if (!c) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = c.clientWidth, h = c.clientHeight;
    if (w < 20 || h < 20) return;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    var g = c.getContext('2d');
    var paper = ART.makePaper(c.width, c.height, dpr);
    var pat = ART.graphitePattern(g);
    var s = Math.min(w / 520, h / 230);
    var ox = w * 0.5, oy = h * 0.62;
    var r = 82 * s;
    var A = [ox - r / 2, oy], B = [ox + r / 2, oy], C = [ox, oy - r * Math.sqrt(3) / 2];
    hero = { t0: performance.now(), id: 0 };
    function frame(now) {
      if (!hero || !document.getElementById('ew-hero')) { hero = null; return; }
      var t = ((now - hero.t0) / 1000) % 6.5;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(paper, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineCap = 'round';
      // circle around A, already drawn in pencil
      g.strokeStyle = pat; g.lineWidth = 1.5;
      g.beginPath(); g.arc(A[0], A[1], r, 0, TAU); g.stroke();
      // circle around B being drawn
      var sweep = reduceMotion ? 1 : Math.min(1, Math.max(0, (t - 0.4) / 3.2));
      var fade = reduceMotion ? 1 : (t > 5.6 ? Math.max(0, 1 - (t - 5.6) / 0.8) : 1);
      var th0 = Math.PI;
      g.globalAlpha = fade;
      g.beginPath(); g.arc(B[0], B[1], r, th0, th0 + TAU * sweep); g.stroke();
      g.globalAlpha = 1;
      // ink triangle
      g.strokeStyle = 'rgba(42,30,20,0.13)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.closePath(); g.stroke();
      g.strokeStyle = '#2a2018'; g.lineWidth = 2;
      g.stroke();
      [[A, 'A', -18, 16], [B, 'B', 8, 16], [C, 'C', -5, -10]].forEach(function(p) {
        g.fillStyle = '#2a2018'; g.beginPath(); g.arc(p[0][0], p[0][1], 3.3, 0, TAU); g.fill();
        g.font = 'italic 600 16px Georgia, "Times New Roman", serif';
        g.fillText(p[1], p[0][0] + p[2], p[0][1] + p[3]);
      });
      // compass
      var th = th0 + TAU * sweep;
      var lift = reduceMotion ? 0 : (t < 0.4 ? (0.4 - t) * 60 : (t > 3.6 && t < 4.4 ? Math.min(1, (t - 3.6) / 0.4) * 18 : (t >= 4.4 ? 18 : 0)));
      var alpha = reduceMotion ? 1 : (t >= 4.4 ? Math.max(0, 1 - (t - 4.4) / 0.6) : (t < 0.4 ? t / 0.4 : 1));
      ART.drawCompass(g, B[0], B[1], B[0] + Math.cos(th) * r, B[1] + Math.sin(th) * r, { alpha: alpha, lift: lift, minLeg: 118 * Math.min(1, s * 1.15) });
      // straightedge and pencil resting on the sheet
      ART.drawStraightedge(g, w * 0.06, h * 0.86, w * 0.42, h * 0.97, { dpr: dpr, pad: 0 });
      ART.drawPencil(g, w * 0.78, h * 0.86, { angle: -0.4 });
      if (!reduceMotion) hero.id = requestAnimationFrame(frame);
    }
    hero.id = requestAnimationFrame(frame);
  }
  function stopHero() {
    if (hero && hero.id) cancelAnimationFrame(hero.id);
    hero = null;
  }

  // ================================================================
  // PLAY
  // ================================================================
  function startLevel(id) {
    var L = levelById(id);
    if (!L) return;
    stopHero();
    var idx = levelIndex(id);
    var b = buildScene(L);
    var unlocked = unlockedSet();
    G = {
      L: L, idx: idx, sc: b.sc, P: b.P, alts: L.goal(b.P),
      unlocked: unlocked,
      res: resolve(L, unlocked),
      ideal: resolve(L, allUnlocked()),
      tools: toolsFor(idx),
      tool: 'circle', sel: [], actions: [],
      guided: guidedPref(),
      hintUsed: guidedPref(), hint: 0, hintFor: -1,
      solved: false, anim: null, hover: null, replay: null, inkT0: 0, pending: false,
      status: null, step: 0
    };
    G.par = G.res.moves.length;
    if (L.introduces === 'transfer') G.tool = 'transfer';
    data.last = id;
    renderPlay();
    refreshStatus();
    setupCanvas();
    fitView();
    startLoop();
    window.scrollTo(0, 0);
  }

  function restartLevel() {
    if (!G) return;
    var keepHint = G.hintUsed, keepGuided = G.guided, L = G.L;
    startLevel(L.id);
    G.hintUsed = keepHint || keepGuided; G.guided = keepGuided;
    refreshStatus();
  }

  function renderPlay() {
    var L = G.L, r = root();
    var h = '<section class="ew-play">' +
      '<div class="ew-bar">' +
        '<button type="button" class="ew-iconbtn" data-act="home" aria-label="Back to the challenge map">' + ART.icon('back', 24) + '</button>' +
        '<div class="ew-bar-title"><span class="ew-lvl-num">Challenge ' + (G.idx + 1) + ' of ' + LEVELS.length + '<span class="ew-ref"> · ' + esc(L.ref) + '</span></span>' +
        '<h1>' + esc(L.name) + ' <span class="ew-es">· ' + esc(L.es) + '</span></h1></div>' +
        '<div class="ew-bar-stats"><span class="ew-chip" id="ew-moves"></span>' + starRow(starsOf(L.id), 15) + '</div>' +
      '</div>' +
      '<div class="ew-task">' +
        '<p class="ew-goal"><b>Goal:</b> ' + esc(L.task) + ' <span class="ew-progress" id="ew-progress"></span></p>' +
        '<div class="ew-guide" id="ew-guide" aria-live="polite"></div>' +
      '</div>' +
      '<div class="ew-main">' +
        '<div class="ew-table">' +
          '<div class="ew-paper" id="ew-paper">' +
            '<canvas id="ew-canvas" role="img" aria-label="Drawing sheet for ' + esc(L.name) + '"></canvas>' +
            '<span class="ew-pin ew-pin-tl"></span><span class="ew-pin ew-pin-tr"></span><span class="ew-pin ew-pin-bl"></span><span class="ew-pin ew-pin-br"></span>' +
            '<div class="ew-zoom">' +
              '<button type="button" class="ew-zbtn" data-act="zin" aria-label="Zoom in">' + ART.icon('zoomin', 20) + '</button>' +
              '<button type="button" class="ew-zbtn" data-act="zout" aria-label="Zoom out">' + ART.icon('zoomout', 20) + '</button>' +
              '<button type="button" class="ew-zbtn" data-act="fit" aria-label="Fit the drawing to the sheet">' + ART.icon('fit', 20) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<aside class="ew-side" id="ew-side"></aside>' +
      '</div>' +
    '</section>';
    r.innerHTML = h;
    renderSide();
  }

  function renderSide() {
    var side = document.getElementById('ew-side');
    if (!side || !G) return;
    var h = '<div class="ew-tools" role="toolbar" aria-label="Construction tools">';
    G.tools.forEach(function(t) {
      var sc = D.SHORTCUTS[t];
      var locked = sc && !G.unlocked[t];
      h += '<button type="button" class="ew-tool' + (G.tool === t ? ' active' : '') + (locked ? ' locked' : '') + (sc ? ' shortcut' : '') +
           '" data-act="tool" data-tool="' + t + '" aria-pressed="' + (G.tool === t) + '"' +
           (locked ? ' aria-disabled="true" aria-label="' + esc(toolLong(t)) + ' (locked)"' : ' aria-label="' + esc(toolLong(t)) + '"') + '>' +
           ART.icon(t, 30) + '<span>' + esc(TOOLS[t].name) + '</span>' +
           (locked ? '<i class="ew-lock" aria-hidden="true">' + ART.icon('lock', 12) + '</i>' : '') + '</button>';
    });
    h += '</div>' +
      '<div class="ew-actions">' +
        '<button type="button" class="ew-act" data-act="undo">' + ART.icon('undo', 22) + '<span>Undo</span></button>' +
        '<button type="button" class="ew-act ew-act-hint" data-act="hint">' + ART.icon('hint', 22) + '<span>Hint</span></button>' +
        '<button type="button" class="ew-act" data-act="restart">' + ART.icon('restart', 22) + '<span>Clear</span></button>' +
      '</div>' +
      '<button type="button" class="ew-switch ew-switch-sm" role="switch" aria-checked="' + G.guided + '" data-act="guided">' +
        '<span class="ew-switch-track"><span class="ew-switch-knob"></span></span>' +
        '<span class="ew-switch-text"><b>Guided mode</b><small>Shows every step</small></span>' +
      '</button>' +
      '<p class="ew-side-note">Tap points to use a tool. Drag to move the sheet; pinch or scroll to zoom.</p>';
    side.innerHTML = h;
  }

  // ---- status line, guidance, progress ----
  function moveCount() {
    if (!G) return 0;
    var n = 0;
    G.sc.objs.forEach(function(o) { if (!o.given) n++; });
    G.sc.pts.forEach(function(p) { if (p.kind === 'derived') n++; });
    return n;
  }
  function currentStep() {
    if (!G) return -1;
    for (var i = 0; i < G.res.moves.length; i++) if (!moveDone(G.sc, G.res.moves[i])) return i;
    return -1;
  }

  function refreshStatus() {
    if (!G) return;
    G.status = goalStatus(G.sc, G.alts);
    G.step = currentStep();
    if (G.hintFor !== G.step) { G.hint = 0; G.hintFor = -1; }
    var mv = document.getElementById('ew-moves');
    if (mv) mv.textContent = 'Moves ' + moveCount() + ' · ideal ' + G.par;
    var pr = document.getElementById('ew-progress');
    if (pr) {
      pr.textContent = G.status.total > 1 ? '(' + G.status.n + ' of ' + G.status.total + ' done)' : '';
    }
    renderGuide();
    dirty = true;
  }

  function showingStep() { return !G.solved && G.step >= 0 && (G.guided || G.hint > 0); }

  function renderGuide() {
    var el = document.getElementById('ew-guide');
    if (!el || !G) return;
    Array.prototype.forEach.call(document.querySelectorAll('.ew-tool.pulse'), function(b) { b.classList.remove('pulse'); });
    if (G.solved || !showingStep()) { el.innerHTML = ''; el.classList.remove('on'); return; }
    var mv = G.res.moves[G.step];
    var lineLbl = resLineLbl(G.res.sc);
    var text;
    if (G.tool !== mv.tool) {
      text = 'Pick the <b>' + esc(toolLong(mv.tool)) + '</b> tool.';
      var btn = document.querySelector('.ew-tool[data-tool="' + mv.tool + '"]');
      if (btn) btn.classList.add('pulse');
    } else {
      var taps = guideTaps(mv.tool, mv.args, resLbl, lineLbl);
      text = esc(taps[Math.min(G.sel.length, taps.length - 1)] || '');
    }
    var plain = text.replace(/<[^>]+>/g, '');
    var head = G.guided ? 'Step ' + (G.step + 1) + ' of ' + G.res.moves.length : 'Hint';
    var desc = describe(mv.tool, mv.args, resLbl, lineLbl);
    el.classList.add('on');
    el.innerHTML = '<span class="ew-guide-head">' + head + '</span>' +
      '<span class="ew-guide-text">' + text + (G.guided ? '' : ' <small>(' + esc(desc) + ')</small>') + '</span>' +
      (ttsOn() ? '<button type="button" class="ew-iconbtn ew-say" data-act="say" data-say="' + esc(plain) + '" aria-label="Read the step aloud">' + ART.icon('speak', 20) + '</button>' : '');
  }
  function ttsOn() {
    try { return typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled; } catch (e) { return false; }
  }

  // ================================================================
  // Canvas, view, rendering
  // ================================================================
  function setupCanvas() {
    cv = document.getElementById('ew-canvas');
    if (!cv) return;
    ctx = cv.getContext('2d');
    sizeCanvas();
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function() { if (cv && document.body.contains(cv)) { sizeCanvas(); dirty = true; } else ro.disconnect(); });
      ro.observe(cv.parentNode);
    }
    bindPointer(cv);
  }

  function sizeCanvas() {
    var box = cv.parentNode.getBoundingClientRect();
    var oldW = W, oldH = H;
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = Math.max(50, Math.round(box.width)); H = Math.max(50, Math.round(box.height));
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var key = cv.width + 'x' + cv.height;
    if (key !== paperKey) {
      paperKey = key;
      paperImg = ART.makePaper(cv.width, cv.height, DPR);
    }
    graphite = ART.graphitePattern(ctx);
    if (oldW && oldH && G && !G.userMovedView) fitView();
  }

  function w2s(x, y) { return [(x - V.cx) * V.z + W / 2, (y - V.cy) * V.z + H / 2]; }
  function s2w(sx, sy) { return [(sx - W / 2) / V.z + V.cx, (sy - H / 2) / V.z + V.cy]; }

  function levelBox() {
    var xs = [], ys = [];
    var sc = G.ideal.sc;
    sc.pts.forEach(function(p) { xs.push(p.x); ys.push(p.y); });
    sc.objs.forEach(function(o) { if (o.type === 'circle') { xs.push(o.cx - o.r, o.cx + o.r); ys.push(o.cy - o.r, o.cy + o.r); } });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return [x0, y0, x1, y1];
  }
  function fitView() {
    if (!G || !W) return;
    var b = levelBox();
    var m = W < 500 ? 20 : 36, mr = m + 44;      // keep clear of the zoom buttons on the right
    V.z = Math.min((W - m - mr) / Math.max(b[2] - b[0], 1), (H - m * 2) / Math.max(b[3] - b[1], 1));
    V.z = Math.max(0.15, Math.min(V.z, 4));
    V.cx = (b[0] + b[2]) / 2 + (mr - m) / 2 / V.z; V.cy = (b[1] + b[3]) / 2;
    dirty = true;
  }
  function zoomAt(sx, sy, f) {
    var w = s2w(sx, sy);
    var nz = Math.max(0.12, Math.min(V.z * f, 12));
    V.z = nz;
    V.cx = w[0] - (sx - W / 2) / V.z; V.cy = w[1] - (sy - H / 2) / V.z;
    if (G) G.userMovedView = true;
    dirty = true;
  }

  function startLoop() {
    if (running) return;
    running = true;
    var tick = function(now) {
      if (!running) return;
      if (!cv || !document.body.contains(cv)) { running = false; return; }
      var active = stepAnim(now);
      if (dirty || active || (G && (showingStep() || G.sel.length || G.replay))) { draw(now); dirty = false; }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }
  function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }

  // param range of a line-ish object within the view
  function visRange(o) {
    var m = 60 / V.z, a = s2w(0, 0), b = s2w(W, H);
    var xmin = a[0] - m, xmax = b[0] + m, ymin = a[1] - m, ymax = b[1] + m;
    var t0 = o.tmin, t1 = o.tmax;
    function clip(p, q) {
      if (Math.abs(p) < 1e-12) return q >= 0;
      var r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
      return true;
    }
    if (!clip(-o.dx, o.x0 - xmin) || !clip(o.dx, xmax - o.x0) || !clip(-o.dy, o.y0 - ymin) || !clip(o.dy, ymax - o.y0)) return null;
    if (!(t0 <= t1)) return null;
    return [t0, t1];
  }

  // trace an object's path (optionally only the first `prog` of it)
  function tracePath(o, prog) {
    prog = prog == null ? 1 : prog;
    ctx.beginPath();
    if (o.type === 'circle') {
      var c = w2s(o.cx, o.cy), st = o.start || 0;
      ctx.arc(c[0], c[1], o.r * V.z, st, st + TAU * prog);
      return true;
    }
    var rg = visRange(o);
    if (!rg) return false;
    var t0 = rg[0], t1 = rg[0] + (rg[1] - rg[0]) * prog;
    if (o.animFrom === 'end') { t1 = rg[1]; t0 = rg[1] - (rg[1] - rg[0]) * prog; }
    var a = w2s(o.x0 + o.dx * t0, o.y0 + o.dy * t0), b = w2s(o.x0 + o.dx * t1, o.y0 + o.dy * t1);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    return true;
  }
  var STYLE = {
    ink:    [[3.6, 'rgba(42,30,20,0.12)'], [1.9, '#2a2018']],
    red:    [[5, 'rgba(164,50,28,0.15)'], [2.6, '#a4321c']],
    pencil: [[1.8, 'GRAPHITE'], [0.8, 'rgba(45,45,52,0.42)']]
  };
  function strokeWith(o, style, prog) {
    if (!tracePath(o, prog)) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    STYLE[style].forEach(function(s) {
      ctx.lineWidth = s[0];
      ctx.strokeStyle = s[1] === 'GRAPHITE' ? graphite : s[1];
      ctx.stroke();
    });
  }
  function strokeDashed(o, color, width, dash, offset) {
    if (!tracePath(o, 1)) return;
    ctx.save();
    ctx.setLineDash(dash); ctx.lineDashOffset = offset || 0;
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }
  function goalObj(t) {
    if (t.k === 'seg') return linThrough('segment', { x: t.ax, y: t.ay }, { x: t.bx, y: t.by });
    if (t.k === 'line') return lin('line', t.x, t.y, t.dx, t.dy);
    if (t.k === 'circle') { var c = circ(t.cx, t.cy, t.r); c.start = -Math.PI / 2; return c; }
    return null;
  }

  function drawGrid() {
    var s = 20;
    while (s * V.z < 16) s *= 5;
    while (s * V.z > 110) s /= 5;
    var a = s2w(0, 0), b = s2w(W, H);
    ctx.lineWidth = 0.6;
    for (var x = Math.floor(a[0] / s) * s; x <= b[0]; x += s) {
      var major = Math.round(x / s) % 5 === 0;
      ctx.strokeStyle = major ? 'rgba(125,90,50,0.13)' : 'rgba(125,90,50,0.065)';
      var sx = w2s(x, 0)[0];
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
    }
    for (var y = Math.floor(a[1] / s) * s; y <= b[1]; y += s) {
      var major2 = Math.round(y / s) % 5 === 0;
      ctx.strokeStyle = major2 ? 'rgba(125,90,50,0.13)' : 'rgba(125,90,50,0.065)';
      var sy = w2s(0, y)[1];
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    }
  }

  function drawDot(p, kind, label, lp, labelStyle) {
    var s = w2s(p.x, p.y);
    if (s[0] < -30 || s[1] < -30 || s[0] > W + 30 || s[1] > H + 30) return;
    if (kind === 'given') {
      ctx.fillStyle = 'rgba(42,30,20,0.18)'; ctx.beginPath(); ctx.arc(s[0], s[1], 5.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.arc(s[0], s[1], 3.6, 0, TAU); ctx.fill();
    } else if (kind === 'free') {
      ctx.fillStyle = 'rgba(60,60,66,0.25)'; ctx.beginPath(); ctx.arc(s[0], s[1], 4.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#38383e'; ctx.beginPath(); ctx.arc(s[0], s[1], 2.6, 0, TAU); ctx.fill();
    } else if (kind === 'red') {
      ctx.fillStyle = 'rgba(164,50,28,0.2)'; ctx.beginPath(); ctx.arc(s[0], s[1], 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a4321c'; ctx.beginPath(); ctx.arc(s[0], s[1], 3.8, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(40,40,46,0.16)'; ctx.beginPath(); ctx.arc(s[0], s[1], kind === 'derived' ? 5 : 4.4, 0, TAU); ctx.fill();
      ctx.fillStyle = graphite; ctx.beginPath(); ctx.arc(s[0], s[1], kind === 'derived' ? 3.4 : 2.9, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(36,36,42,0.7)'; ctx.beginPath(); ctx.arc(s[0], s[1], kind === 'derived' ? 2.3 : 1.9, 0, TAU); ctx.fill();
    }
    if (label) {
      var ang = (lp == null ? 135 : lp) * Math.PI / 180;
      var lx = s[0] + Math.cos(ang) * 15, ly = s[1] - Math.sin(ang) * 15;
      ctx.font = 'italic 600 ' + (labelStyle === 'pencil' ? 15 : 17) + 'px Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(246,236,212,0.9)'; ctx.lineJoin = 'round';
      ctx.strokeText(label, lx, ly);
      ctx.fillStyle = labelStyle === 'pencil' ? '#55524c' : (labelStyle === 'red' ? '#8c2a17' : '#2a2018');
      ctx.fillText(label, lx, ly);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
  }
  // a label angle pointing away from the middle of the drawing
  function autoLp(p) {
    var a = Math.atan2(-(p.y - V.cy), p.x - V.cx) * 180 / Math.PI;
    return Math.round(a / 45) * 45 + 20;
  }

  function ring(x, y, r, color, w) {
    var s = w2s(x, y);
    ctx.lineWidth = w || 2; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, TAU); ctx.stroke();
  }

  function draw(now) {
    if (!ctx || !G) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (paperImg) ctx.drawImage(paperImg, 0, 0); else { ctx.fillStyle = '#f0e2c1'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawGrid();
    if (G.replay) { drawReplay(now); return; }

    var sc = G.sc, anim = G.anim;
    var st = G.status || goalStatus(sc, G.alts);
    var goalIds = {};
    st.m.forEach(function(m) { if (m && m.obj) goalIds[m.obj.id] = true; });

    // faint goal marks
    if (!G.solved) {
      st.alt.forEach(function(t, i) {
        if (st.m[i]) return;
        var o = goalObj(t);
        if (o) strokeDashed(o, 'rgba(164,50,28,0.36)', 1.6, [2, 7]);
        else ring(t.x, t.y, 9, 'rgba(164,50,28,0.4)', 1.4);
      });
    }

    // objects
    sc.objs.forEach(function(o) {
      if (anim && anim.obj === o) return;
      if (o.given) strokeWith(o, 'ink');
      else strokeWith(o, 'pencil');
    });
    if (anim && anim.obj) strokeWith(anim.obj, 'pencil', anim.prog);

    // ink over solved goals
    if (G.solved) {
      var ip = Math.min(1, (now - G.inkT0) / 900);
      sc.objs.forEach(function(o) { if (goalIds[o.id]) strokeWith(o, 'red', ip); });
    }

    // hint ghost
    if (showingStep() && (G.guided || G.hint >= 2)) {
      var mv = G.res.moves[G.step];
      var off = -(now / 40) % 28;
      if (mv.res.x != null) ring(mv.res.x, mv.res.y, 10, 'rgba(37,99,190,0.75)', 2);
      else strokeDashed(mv.res, 'rgba(37,99,190,0.72)', 2.2, [9, 5], off);
      if (G.tool === mv.tool) {
        var nextArg = mv.args[G.sel.length];
        if (nextArg && nextArg.x == null) strokeDashed(nextArg, 'rgba(37,99,190,0.55)', 6, [], 0);
        if (nextArg && nextArg.x != null) {
          var pulse = 10 + 4 * Math.sin(now / 180);
          ring(nextArg.x, nextArg.y, pulse, 'rgba(37,99,190,0.9)', 2.6);
          ring(nextArg.x, nextArg.y, pulse + 7, 'rgba(37,99,190,0.25)', 5);
        }
      }
    }

    // points (hidden while the object that makes them is still being drawn)
    var showNames = G.guided || G.hintUsed;
    sc.pts.forEach(function(p) {
      if (anim && anim.obj && p.parents && p.parents.indexOf(anim.obj.id) >= 0) return;
      if (anim && anim.pt === p && anim.prog < 0.5) return;
      var label = p.label, lp = p.lp, lstyle = 'ink';
      if (!label && showNames) {
        var rp = G.res.sc.ptAt(p.x, p.y, 1e-3, function(q) { return q.label && q.kind !== 'given'; });
        if (rp) { label = rp.label; lp = autoLp(p); lstyle = 'pencil'; }
      }
      var kind = p.kind === 'given' ? 'given' : (p.kind === 'free' || p.kind === 'onobj') ? 'free' : p.kind;
      if (G.solved && st.m.some(function(m) { return m && m.pt === p; })) kind = 'red';
      drawDot(p, kind, label, lp, lstyle);
    });

    // selections
    G.sel.forEach(function(s) {
      if (s.x != null) { ring(s.x, s.y, 9, '#c0392b', 2.2); }
      else strokeDashed(s, 'rgba(192,57,43,0.5)', 5, [], 0);
    });
    // hover target
    if (G.hover && G.hover.target && !G.solved) {
      var ht = G.hover.target;
      if (ht.x != null) ring(ht.x, ht.y, 8, 'rgba(60,40,20,0.45)', 1.6);
      else strokeDashed(ht, 'rgba(192,57,43,0.28)', 4, [], 0);
    }

    drawToolOverlay(now);
  }

  // instruments: animations and hover previews
  function drawToolOverlay(now) {
    var anim = G.anim;
    if (anim) { drawAnimTools(anim); return; }
    if (G.solved) return;
    var hv = G.hover, sel = G.sel, t = G.tool;
    var hp = hv ? (hv.target && hv.target.x != null ? w2s(hv.target.x, hv.target.y) : [hv.sx, hv.sy]) : null;
    if ((t === 'circle') && sel.length === 1) {
      var c = w2s(sel[0].x, sel[0].y);
      var p = hp || [c[0] + 44, c[1] - 10];
      var rr = Math.hypot(p[0] - c[0], p[1] - c[1]);
      if (hp) {
        ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(60,60,66,0.35)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ART.drawCompass(ctx, c[0], c[1], p[0], p[1], { alpha: hp ? 0.95 : 0.85 });
    } else if (t === 'transfer' && sel.length >= 1) {
      var a = w2s(sel[0].x, sel[0].y);
      if (sel.length === 1) {
        if (hp) ART.drawCompass(ctx, a[0], a[1], hp[0], hp[1], { alpha: 0.8 });
      } else {
        var b = w2s(sel[1].x, sel[1].y), r2 = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (hp) {
          ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(60,60,66,0.35)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(hp[0], hp[1], r2, 0, TAU); ctx.stroke(); ctx.restore();
          var ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          ART.drawCompass(ctx, hp[0], hp[1], hp[0] + Math.cos(ang) * r2, hp[1] + Math.sin(ang) * r2, { alpha: 0.9 });
        } else {
          ART.drawCompass(ctx, a[0], a[1], b[0], b[1], { alpha: 0.9, lift: 6 });
        }
      }
    } else if ((t === 'line' || t === 'segment') && sel.length === 1 && hp) {
      var s0 = w2s(sel[0].x, sel[0].y);
      if (Math.hypot(hp[0] - s0[0], hp[1] - s0[1]) > 12) {
        ART.drawStraightedge(ctx, s0[0], s0[1], hp[0], hp[1], { alpha: 0.75, dpr: DPR, pad: 30, offset: 0 });
      }
    } else if ((t === 'perpbis' || t === 'midpoint' || t === 'anglebis') && sel.length >= 1 && hp) {
      var last = w2s(sel[sel.length - 1].x, sel[sel.length - 1].y);
      ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(60,60,66,0.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(hp[0], hp[1]); ctx.stroke(); ctx.restore();
    } else if ((t === 'perp' || t === 'parallel') && sel.length === 1 && hp) {
      var l = sel[0], w = s2w(hp[0], hp[1]);
      var o = t === 'perp' ? lin('line', w[0], w[1], -l.dy, l.dx) : lin('line', w[0], w[1], l.dx, l.dy);
      strokeDashed(o, 'rgba(60,60,66,0.35)', 1.2, [4, 6]);
    }
  }

  // ================================================================
  // Animations
  // ================================================================
  function startAnim(item, isPoint) {
    finishAnim();
    var now = performance.now();
    if (isPoint) { G.anim = { pt: item, t0: now, dur: reduceMotion ? 1 : 420, prog: 0 }; return; }
    var o = item;
    var dur = o.type === 'circle' ? 1350 : 950;
    if (reduceMotion) dur = 1;
    G.anim = { obj: o, t0: now, dur: dur, prog: 0, phase: 0 };
    if (isLin(o)) {
      // draw from the end nearest the first chosen point
      var rg = visRange(o);
      var first = o.inPts && o.inPts[0] && G.sc.pt(o.inPts[0]);
      o.animFrom = 'start';
      if (rg && first && o.type === 'line') {
        var tf = tOn(o, first.x, first.y);
        if (Math.abs(tf - rg[1]) < Math.abs(tf - rg[0])) o.animFrom = 'end';
      }
    }
  }
  function finishAnim() {
    if (G && G.anim) {
      var a = G.anim;
      G.anim = null;
      if (a.obj) a.obj.animFrom = null;
      if (a.onDone) a.onDone();
      animEnded();
    }
  }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function stepAnim(now) {
    if (!G || !G.anim) return false;
    var a = G.anim, t = Math.min(1, (now - a.t0) / a.dur);
    if (frozen != null) t = frozen;
    a.t = t;
    if (a.pt) a.prog = t;
    else if (a.obj.type === 'circle') a.prog = t < 0.16 ? 0 : Math.min(1, ease((t - 0.16) / 0.68));
    else a.prog = t < 0.2 ? 0 : Math.min(1, ease((t - 0.2) / 0.6));
    if (t >= 1) { finishAnim(); dirty = true; }
    return true;
  }

  function drawAnimTools(a) {
    var t = a.t || 0;
    if (a.pt) {
      var s = w2s(a.pt.x, a.pt.y);
      ctx.strokeStyle = 'rgba(164,50,28,' + (1 - t).toFixed(3) + ')'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(s[0], s[1], 6 + t * 22, 0, TAU); ctx.stroke();
      return;
    }
    var o = a.obj;
    if (o.type === 'circle') {
      var c = w2s(o.cx, o.cy), R = o.r * V.z, st = o.start || 0;
      var th = st + TAU * a.prog;
      var open = t < 0.16 ? ease(t / 0.16) : 1;
      var rr = R * (0.25 + 0.75 * open);
      var alpha = t < 0.08 ? t / 0.08 : (t > 0.88 ? Math.max(0, 1 - (t - 0.88) / 0.12) : 1);
      var lift = t > 0.88 ? (t - 0.88) / 0.12 * 20 : (t < 0.08 ? (1 - t / 0.08) * 16 : 0);
      if (R > 4) ART.drawCompass(ctx, c[0], c[1], c[0] + Math.cos(th) * rr, c[1] + Math.sin(th) * rr, { alpha: alpha, lift: lift });
      return;
    }
    var rg = visRange(o);
    if (!rg) return;
    var A, B;
    if (o.type === 'segment') {
      A = w2s(o.x0, o.y0); B = w2s(o.x0 + o.dx * o.tmax, o.y0 + o.dy * o.tmax);
    } else {
      var span = rg[1] - rg[0];
      var p0 = rg[0] + span * 0.12, p1 = rg[1] - span * 0.12;
      A = w2s(o.x0 + o.dx * p0, o.y0 + o.dy * p0); B = w2s(o.x0 + o.dx * p1, o.y0 + o.dy * p1);
    }
    var inA = t < 0.2 ? ease(t / 0.2) : 1;
    var outA = t > 0.82 ? Math.max(0, 1 - (t - 0.82) / 0.18) : 1;
    ART.drawStraightedge(ctx, A[0], A[1], B[0], B[1], { alpha: inA * outA, dpr: DPR, pad: o.type === 'segment' ? 34 : 20, offset: (1 - inA) * 16 });
    // pencil at the drawing front
    var tf;
    if (o.animFrom === 'end') tf = rg[1] - (rg[1] - rg[0]) * a.prog;
    else tf = rg[0] + (rg[1] - rg[0]) * a.prog;
    var P = w2s(o.x0 + o.dx * tf, o.y0 + o.dy * tf);
    if (t > 0.12) ART.drawPencil(ctx, P[0], P[1], { alpha: outA * Math.min(1, (t - 0.12) / 0.1), lift: t > 0.82 ? (t - 0.82) * 60 : 0 });
  }

  // ================================================================
  // Input: taps use tools; drag pans; pinch / wheel zoom
  // ================================================================
  var pointers = {}, gesture = null;

  function snapRadius(type) {
    var base = age <= 8 ? 30 : 22;
    return type === 'touch' ? base + 6 : base;
  }
  function localXY(e) {
    var r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  function pickPt(sx, sy, rad) {
    var best = null, bd = rad;
    G.sc.pts.forEach(function(p) {
      var s = w2s(p.x, p.y), d = Math.hypot(s[0] - sx, s[1] - sy);
      // favour exact points slightly over free ones
      if (p.kind === 'free' || p.kind === 'onobj') d += 2;
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }
  function objScreenDist(o, sx, sy) {
    var w = s2w(sx, sy);
    if (o.type === 'circle') return Math.abs(Math.hypot(w[0] - o.cx, w[1] - o.cy) - o.r) * V.z;
    var t = Math.max(o.tmin, Math.min(o.tmax, tOn(o, w[0], w[1])));
    return Math.hypot(o.x0 + o.dx * t - w[0], o.y0 + o.dy * t - w[1]) * V.z;
  }
  function pickObj(sx, sy, rad, linOnly) {
    var best = null, bd = rad;
    G.sc.objs.forEach(function(o) {
      if (linOnly && !isLin(o)) return;
      var d = objScreenDist(o, sx, sy);
      if (d < bd) { bd = d; best = o; }
    });
    return best;
  }

  function bindPointer(el) {
    el.addEventListener('pointerdown', function(e) {
      if (!G) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (er) {}
      var p = localXY(e);
      pointers[e.pointerId] = { x: p[0], y: p[1], type: e.pointerType };
      var ids = Object.keys(pointers);
      if (ids.length === 1) {
        gesture = { mode: 'pending', sx: p[0], sy: p[1], cx: V.cx, cy: V.cy, type: e.pointerType };
      } else if (ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var mid = [(a.x + b.x) / 2, (a.y + b.y) / 2];
        gesture = { mode: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: V.z, w0: s2w(mid[0], mid[1]) };
      }
    });
    el.addEventListener('pointermove', function(e) {
      if (!G) return;
      var p = localXY(e);
      if (pointers[e.pointerId]) { pointers[e.pointerId].x = p[0]; pointers[e.pointerId].y = p[1]; }
      if (gesture && gesture.mode === 'pinch') {
        var ids = Object.keys(pointers);
        if (ids.length >= 2) {
          var a = pointers[ids[0]], b = pointers[ids[1]];
          var d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mid = [(a.x + b.x) / 2, (a.y + b.y) / 2];
          V.z = Math.max(0.12, Math.min(12, gesture.z0 * d / gesture.d0));
          V.cx = gesture.w0[0] - (mid[0] - W / 2) / V.z; V.cy = gesture.w0[1] - (mid[1] - H / 2) / V.z;
          G.userMovedView = true; dirty = true;
        }
        return;
      }
      if (gesture && pointers[e.pointerId]) {
        var moved = Math.hypot(p[0] - gesture.sx, p[1] - gesture.sy);
        if (gesture.mode === 'pending' && moved > (gesture.type === 'touch' ? 10 : 6)) gesture.mode = 'pan';
        if (gesture.mode === 'pan') {
          V.cx = gesture.cx - (p[0] - gesture.sx) / V.z; V.cy = gesture.cy - (p[1] - gesture.sy) / V.z;
          G.userMovedView = true; dirty = true;
        }
        return;
      }
      if (e.pointerType === 'mouse') updateHover(p[0], p[1]);
    });
    function end(e) {
      if (!G) return;
      var info = pointers[e.pointerId];
      delete pointers[e.pointerId];
      var left = Object.keys(pointers).length;
      if (gesture && gesture.mode === 'pending' && left === 0 && info && e.type === 'pointerup') {
        onTap(info.x, info.y, info.type);
      }
      if (left === 0) gesture = null;
      else if (gesture && gesture.mode === 'pinch') gesture = { mode: 'none' };
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', function(e) { if (e.pointerType === 'mouse' && G) { G.hover = null; dirty = true; } });
    el.addEventListener('wheel', function(e) {
      if (!G) return;
      e.preventDefault();
      var p = localXY(e);
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(p[0], p[1], Math.exp(-dy * 0.0016));
    }, { passive: false });
  }

  function updateHover(sx, sy) {
    if (!G || G.solved) return;
    var kind = TOOL_SEQ[G.tool][G.sel.length];
    var rad = snapRadius('mouse');
    var target = null;
    if (kind === 'lin') target = pickObj(sx, sy, rad, true);
    else target = pickPt(sx, sy, rad);
    G.hover = { sx: sx, sy: sy, target: target };
    dirty = true;
  }

  function makePointAt(sx, sy, type) {
    var w = s2w(sx, sy);
    var o = pickObj(sx, sy, snapRadius(type) * 0.6, false);
    var x = w[0], y = w[1], kind = 'free', onObj = null;
    if (o) {
      if (o.type === 'circle') {
        var a = Math.atan2(y - o.cy, x - o.cx);
        x = o.cx + Math.cos(a) * o.r; y = o.cy + Math.sin(a) * o.r;
      } else {
        var t = Math.max(o.tmin, Math.min(o.tmax, tOn(o, x, y)));
        x = o.x0 + o.dx * t; y = o.y0 + o.dy * t;
      }
      kind = 'onobj'; onObj = o.id;
    }
    var r = G.sc.addPt(x, y, kind, { onObj: onObj });
    if (r.fresh) G.actions.push({ ids: [r.p.id], kind: 'point' });
    return r.p;
  }

  function onTap(sx, sy, type) {
    if (!G || G.solved || G.replay) return;
    finishAnim();
    var tool = G.tool, seq = TOOL_SEQ[tool], rad = snapRadius(type);
    var tr = D.SHORTCUTS[tool];
    if (tr && !G.unlocked[tool]) { lockedToast(tool); return; }
    if (tool === 'point') {
      var ex = pickPt(sx, sy, rad * 0.7);
      if (ex) { sfx('click'); return; }
      makePointAt(sx, sy, type);
      sfx('click');
      refreshStatus();
      return;
    }
    var kind = seq[G.sel.length];
    if (kind === 'lin') {
      var o = pickObj(sx, sy, rad, true);
      if (!o) { toast('Tap a line first, then a point.'); sfx('wrong'); return; }
      G.sel.push(o);
    } else {
      var p = pickPt(sx, sy, rad);
      if (p && G.sel.length && G.sel[G.sel.length - 1] === p) {   // tap again to deselect
        G.sel.pop(); sfx('click'); refreshStatus(); return;
      }
      if (!p) p = makePointAt(sx, sy, type);
      if (G.sel.indexOf(p) >= 0 && tool !== 'transfer') { sfx('wrong'); toast('Pick a different point.'); return; }
      if (tool === 'transfer' && G.sel.length === 1 && G.sel[0] === p) { sfx('wrong'); return; }
      G.sel.push(p);
    }
    sfx('click');
    if (G.sel.length < seq.length) { refreshStatus(); return; }

    // all inputs chosen: build
    var args = G.sel.slice();
    G.sel = [];
    if (tool === 'anglebis' && (dist(args[0], args[1]) < 1e-9 || dist(args[2], args[1]) < 1e-9)) { refreshStatus(); return; }
    var r = runOp(G.sc, tool, args);
    if (!r || r.dup) {
      sfx('wrong');
      toast(tool === 'midpoint' ? 'That point is already there.' : 'That is already drawn.');
      refreshStatus();
      return;
    }
    var ids = [];
    if (r.o) ids.push(r.o.id);
    if (r.p) ids.push(r.p.id);
    r.fresh.forEach(function(p2) { if (ids.indexOf(p2.id) < 0) ids.push(p2.id); });
    G.actions.push({ ids: ids, kind: 'move' });
    if (r.o) startAnim(r.o); else startAnim(r.p, true);
    afterMove();
  }

  function afterMove() {
    var before = G.step;
    refreshStatus();
    if (G.status.done) { G.pending = true; if (!G.anim) animEnded(); return; }
    if (G.guided && G.step !== before && G.step >= 0) sfx('star');
  }
  function animEnded() {
    if (G && G.pending && !G.solved) { G.pending = false; onSolved(); }
    if (G && G.replay) replayNext();
  }

  function lockedToast(tool) {
    var L = levelById(D.SHORTCUTS[tool].teach);
    sfx('wrong');
    toast('Solve “' + L.name + '” to unlock the ' + toolLong(tool) + ' tool.');
  }

  function undo() {
    if (!G || G.solved) return;
    finishAnim();
    if (G.solved) return;
    if (G.sel.length) { G.sel = []; refreshStatus(); return; }
    var a = G.actions.pop();
    if (!a) { toast('Nothing to undo.'); return; }
    G.sc.removeIds(a.ids);
    sfx('click');
    refreshStatus();
  }

  function hint() {
    if (!G || G.solved) return;
    if (G.step < 0) return;
    G.hintUsed = true;
    G.hint = age >= 10 ? Math.min(2, G.hint + 1) : 2;
    G.hintFor = G.step;
    sfx('click');
    renderGuide();
    dirty = true;
  }

  function setTool(t) {
    if (!G) return;
    if (D.SHORTCUTS[t] && !G.unlocked[t]) { lockedToast(t); return; }
    finishAnim();
    G.tool = t; G.sel = [];
    sfx('click');
    Array.prototype.forEach.call(document.querySelectorAll('.ew-tool'), function(b) {
      var on = b.getAttribute('data-tool') === t;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    renderGuide();
    dirty = true;
  }

  // ================================================================
  // Solving, results and the replay
  // ================================================================
  function onSolved() {
    var L = G.L;
    G.solved = true;
    G.inkT0 = performance.now();
    var moves = moveCount();
    var stars = 1 + (moves <= G.par ? 1 : 0) + (G.hintUsed ? 0 : 1);
    var rec = data.levels[L.id] || {};
    var first = !rec.stars;
    rec.stars = Math.max(rec.stars || 0, stars);
    rec.best = rec.best ? Math.min(rec.best, moves) : moves;
    rec.at = today();
    data.levels[L.id] = rec;
    data.last = L.id;
    _save(data);
    sfx('cheer');
    try {
      if (typeof ActivityLog !== 'undefined') ActivityLog.log(APP_NAME, '📐', 'Constructed ' + L.name + ' (' + stars + '★, ' + moves + ' moves)');
    } catch (e) {}
    var unlocked = null;
    for (var k in D.SHORTCUTS) if (D.SHORTCUTS[k].teach === L.id && first) unlocked = k;
    G.result = { stars: stars, moves: moves, first: first, unlocked: unlocked };
    var bs = document.querySelector('.ew-bar-stats .ew-stars');
    if (bs) bs.outerHTML = starRow(rec.stars, 15);
    renderResult();
    refreshStatus();
    setTimeout(function() { if (G && G.solved && G.L === L && !G.replay) startReplay(); }, reduceMotion ? 300 : 1500);
  }

  function renderResult() {
    var side = document.getElementById('ew-side');
    if (!side) return;
    var R = G.result, L = G.L, nextL = LEVELS[G.idx + 1];
    var crit = [
      ['Solved', true],
      ['Ideal moves (' + R.moves + ' / ' + G.par + ')', R.moves <= G.par],
      ['No hints', !G.hintUsed]
    ];
    var h = '<div class="ew-result" role="status">' +
      '<div class="ew-result-head"><span class="ew-burst" aria-hidden="true"></span>' +
        '<h2>Constructed! <span class="ew-es">· ¡Construido!</span></h2>' + starRow(R.stars, 30) + '</div>' +
      '<ul class="ew-crit">' + crit.map(function(c) {
        return '<li class="' + (c[1] ? 'ok' : '') + '"><span aria-hidden="true">' + (c[1] ? '★' : '☆') + '</span> ' + esc(c[0]) + '</li>';
      }).join('') + '</ul>' +
      (G.guided && G.hintUsed ? '<p class="ew-tipline">Try it again without guided mode to earn the third star.</p>' : '') +
      (R.unlocked ? '<div class="ew-unlock">' + ART.icon(R.unlocked, 34) + '<span><b>New tool unlocked!</b> ' + esc(toolLong(R.unlocked)) + ' · ' + esc(TOOLS[R.unlocked].es) + '<small>You can use it in later challenges.</small></span></div>' : '') +
      '<h3 class="ew-steps-title">Your construction <span class="ew-es">· Tu construcción</span></h3>' +
      '<ol class="ew-steps" id="ew-steps"></ol>' +
      '<div class="ew-why"><b>Why it works · Por qué funciona</b><p>' + esc(L.why) + '</p><small>' + esc(L.ref) + '</small></div>' +
      '<div class="ew-result-btns">' +
        '<button type="button" class="ew-btn" data-act="replay">' + ART.icon('play', 16) + ' Replay</button>' +
        '<button type="button" class="ew-btn" data-act="again">' + ART.icon('restart', 16) + ' Try again</button>' +
        (nextL ? '<button type="button" class="ew-btn ew-btn-primary" data-act="play" data-id="' + nextL.id + '">Next challenge →</button>'
               : '<button type="button" class="ew-btn ew-btn-primary" data-act="home">All challenges</button>') +
      '</div></div>';
    side.innerHTML = h;

  }

  function buildReplay() {
    var sc = G.sc, st = goalStatus(sc, G.alts);
    var needO = {}, needP = {};
    function o(id) {
      var ob = sc.obj(id);
      if (!ob || ob.given || needO[id]) return;
      needO[id] = true;
      (ob.inPts || []).forEach(p);
      (ob.inObjs || []).forEach(o);
    }
    function p(id) {
      var pt = sc.pt(id);
      if (!pt || pt.kind === 'given' || needP[id]) return;
      needP[id] = true;
      if (pt.parents) pt.parents.forEach(o);
      if (pt.inPts) pt.inPts.forEach(p);
      if (pt.onObj) o(pt.onObj);
    }
    var goalSet = {};
    st.m.forEach(function(m) {
      if (!m) return;
      if (m.obj) { o(m.obj.id); goalSet[m.obj.id] = true; }
      if (m.pt) { p(m.pt.id); goalSet[m.pt.id] = true; }
    });
    var steps = [];
    sc.objs.forEach(function(ob) { if (needO[ob.id]) steps.push({ obj: ob, id: ob.id }); });
    sc.pts.forEach(function(pt) { if (pt.kind === 'derived' && needP[pt.id]) steps.push({ pt: pt, id: pt.id }); });
    steps.sort(function(a, b) { return a.id - b.id; });
    var stepOf = {};
    steps.forEach(function(s, i) { stepOf[s.id] = i; });

    // when each needed point appears, and its letter
    var reveal = {}, labels = {};
    var used = {};
    sc.pts.forEach(function(q) { if (q.label) used[q.label] = true; });
    var named = [];
    G.ideal.sc.pts.forEach(function(q) { if (q.label && q.kind !== 'given') named.push(q); });
    G.res.sc.pts.forEach(function(q) { if (q.label && q.kind !== 'given') named.push(q); });
    var pool = 'CDEFGHJKLMNPQRSTUVWXYZ'.split('');
    var inputs = {};
    steps.forEach(function(s, i) {
      var ins = s.obj ? (s.obj.inPts || []) : (s.pt.inPts || []);
      ins.forEach(function(id) { if (inputs[id] == null) inputs[id] = i; });
    });
    Object.keys(needP).forEach(function(k) {
      var id = +k, pt = sc.pt(id);
      if (!pt) return;
      if (pt.kind === 'isect') {
        reveal[id] = Math.max(stepOf[pt.parents[0]] == null ? -1 : stepOf[pt.parents[0]], stepOf[pt.parents[1]] == null ? -1 : stepOf[pt.parents[1]]) + 1;
      } else if (pt.kind === 'derived') reveal[id] = stepOf[id] + 1;
      else reveal[id] = inputs[id] != null ? inputs[id] : 0;
    });
    // letters: model-solution names first, then free letters in order of appearance
    var order = Object.keys(needP).map(Number).sort(function(a, b) { return (reveal[a] - reveal[b]) || (a - b); });
    order.forEach(function(id) {
      var pt = sc.pt(id);
      if (!pt || pt.label) return;
      for (var i = 0; i < named.length; i++) {
        if (Math.hypot(named[i].x - pt.x, named[i].y - pt.y) < 1e-3 && !used[named[i].label]) {
          labels[id] = named[i].label; used[named[i].label] = true; return;
        }
      }
    });
    order.forEach(function(id) {
      var pt = sc.pt(id);
      if (!pt || pt.label || labels[id]) return;
      while (pool.length && used[pool[0]]) pool.shift();
      if (pool.length) { labels[id] = pool.shift(); used[labels[id]] = true; }
    });
    function lbl(pt) { return pt ? (pt.label || labels[pt.id] || '?') : '?'; }
    function lineLbl(l) {
      if (l.given) {
        var on = sc.pts.filter(function(q) { return q.kind === 'given' && distLine(l, q.x, q.y) < 1e-5; });
        if (on.length >= 2) return 'line ' + on[0].label + on[1].label;
        if (on.length === 1) return 'the line through ' + on[0].label;
        return 'the given line';
      }
      var ins = (l.inPts || []).map(function(id) { return sc.pt(id); }).filter(Boolean);
      if (ins.length >= 2) return 'line ' + lbl(ins[0]) + lbl(ins[1]);
      return 'step ' + ((stepOf[l.id] || 0) + 1) + '’s line';
    }
    steps.forEach(function(s) {
      var item = s.obj || s.pt;
      var args = [];
      (item.inObjs || []).forEach(function(id) { args.push(sc.obj(id)); });
      (item.inPts || []).forEach(function(id) { args.push(sc.pt(id)); });
      s.text = describe(item.tool, args, lbl, lineLbl);
      s.goal = !!goalSet[item.id];
    });
    return { steps: steps, reveal: reveal, labels: labels, needP: needP, goalSet: goalSet, done: 0, i: -1, waiting: false };
  }

  function startReplay() {
    if (!G || !G.solved) return;
    finishAnim();
    G.replay = buildReplay();
    var ol = document.getElementById('ew-steps');
    if (ol) {
      ol.innerHTML = G.replay.steps.map(function(s, i) {
        return '<li data-i="' + i + '"' + (s.goal ? ' class="goal"' : '') + '><span class="ew-step-n">' + (i + 1) + '</span><span>' + esc(s.text) + '</span></li>';
      }).join('');
    }
    replayNext();
  }

  function replayNext() {
    var R = G && G.replay;
    if (!R) return;
    if (R.i >= 0) R.done = R.i + 1;
    if (R.done >= R.steps.length) {
      R.i = R.steps.length; markStep(-1); dirty = true;
      if (!R.scrolled && window.innerWidth < 900) {
        // on narrow screens the result card sits below the sheet: bring it up once the replay ends
        R.scrolled = true;
        var el = document.querySelector('.ew-result');
        if (el && el.scrollIntoView) setTimeout(function() { el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }, 700);
      }
      return;
    }
    if (R.waiting) return;
    R.waiting = true;
    setTimeout(function() {
      if (!G || G.replay !== R) return;
      R.waiting = false;
      R.i = R.done;
      markStep(R.i);
      var s = R.steps[R.i];
      if (s.obj) startAnim(s.obj); else startAnim(s.pt, true);
      dirty = true;
    }, R.i < 0 ? 200 : (reduceMotion ? 120 : 420));
  }
  function markStep(i) {
    Array.prototype.forEach.call(document.querySelectorAll('#ew-steps li'), function(li) {
      var k = +li.getAttribute('data-i');
      li.classList.toggle('now', k === i);
      li.classList.toggle('past', i < 0 ? true : k < i);
    });
  }

  function drawReplay(now) {
    var R = G.replay, sc = G.sc, anim = G.anim;
    var visO = {};
    R.steps.forEach(function(s, i) { if (s.obj && i < R.done) visO[s.obj.id] = true; });
    sc.objs.forEach(function(o) {
      if (o.given) { strokeWith(o, 'ink'); return; }
      if (!visO[o.id]) return;
      strokeWith(o, R.goalSet[o.id] ? 'red' : 'pencil');
    });
    if (anim && anim.obj) strokeWith(anim.obj, R.goalSet[anim.obj.id] ? 'red' : 'pencil', anim.prog);
    // step numbers
    R.steps.forEach(function(s, i) {
      if (i > R.done || (i === R.done && !(anim && (anim.obj === s.obj || anim.pt === s.pt)))) return;
      var pos = badgePos(s);
      if (!pos) return;
      ctx.fillStyle = s.goal ? '#a4321c' : '#5b4630';
      ctx.beginPath(); ctx.arc(pos[0], pos[1], 9.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(250,240,215,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#fff8e6'; ctx.font = '800 11px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), pos[0], pos[1] + 0.5);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    });
    // points
    sc.pts.forEach(function(p) {
      if (p.kind === 'given') { drawDot(p, 'given', p.label, p.lp); return; }
      if (!R.needP[p.id]) return;
      var rv = R.reveal[p.id];
      var stepNow = anim ? R.done : R.done;
      if (rv > stepNow || (rv === stepNow && anim && anim.obj && p.parents && p.parents.indexOf(anim.obj.id) >= 0)) return;
      if (p.kind === 'derived' && anim && anim.pt === p && anim.prog < 0.5) return;
      drawDot(p, R.goalSet[p.id] ? 'red' : (p.kind === 'free' || p.kind === 'onobj' ? 'free' : p.kind), R.labels[p.id] || p.label, autoLp(p), R.goalSet[p.id] ? 'red' : 'pencil');
    });
    if (anim) drawAnimTools(anim);
  }
  function badgePos(s) {
    if (s.pt) { var q = w2s(s.pt.x, s.pt.y); return [q[0] + 14, q[1] + 14]; }
    var o = s.obj;
    if (o.type === 'circle') {
      var a = (o.start || 0) - 0.5;
      var c = w2s(o.cx + Math.cos(a) * o.r, o.cy + Math.sin(a) * o.r);
      return [c[0], c[1]];
    }
    var rg = visRange(o);
    if (!rg) return null;
    var t = o.type === 'segment' ? o.tmax * 0.5 : rg[0] + (rg[1] - rg[0]) * 0.86;
    var p = w2s(o.x0 + o.dx * t, o.y0 + o.dy * t);
    return [p[0] - o.dy * 13, p[1] + o.dx * 13];
  }

  // ================================================================
  // Events
  // ================================================================
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || !root().contains(b)) return;
    var act = b.getAttribute('data-act');
    switch (act) {
      case 'play': sfx('click'); startLevel(b.getAttribute('data-id')); break;
      case 'home': sfx('click'); if (G && G.replay) G.replay = null; showHome(); break;
      case 'tool': setTool(b.getAttribute('data-tool')); break;
      case 'undo': undo(); break;
      case 'hint': hint(); break;
      case 'restart':
        if (!G) break;
        if (moveCount() === 0 && !G.solved) { restartLevel(); break; }
        if (typeof ZsDialog !== 'undefined') {
          ZsDialog.confirm({ title: 'Clear the sheet?', message: 'This rubs out everything you drew in this challenge.', confirmLabel: 'Clear', cancelLabel: 'Keep drawing' })
            .then(function(ok) { if (ok) restartLevel(); });
        }
        break;
      case 'again': sfx('click'); restartLevel(); break;
      case 'replay':
        if (G && G.solved) { G.replay = null; finishAnim(); startReplay(); }
        break;
      case 'guided':
        var on = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', String(on));
        data.guided = on; _save(data);
        sfx('click');
        if (G) {
          G.guided = on;
          if (on) G.hintUsed = true;
          refreshStatus();
        }
        break;
      case 'zin': zoomAt(W / 2, H / 2, 1.3); break;
      case 'zout': zoomAt(W / 2, H / 2, 1 / 1.3); break;
      case 'fit': if (G) { G.userMovedView = false; fitView(); } break;
      case 'say':
        try { ZsTTS.speak(b.getAttribute('data-say'), { lang: 'en-US' }); } catch (er) {}
        break;
      case 'more':
        var id = b.getAttribute('data-id'), p = document.getElementById('ew-more-' + id);
        if (p) {
          var open = p.hasAttribute('hidden');
          if (open) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
          b.setAttribute('aria-expanded', String(open));
          b.textContent = open ? 'Show less' : 'Read more';
        }
        break;
    }
  }
  function onKey(e) {
    if (!G || e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); }
    else if (e.key === 'Escape') { G.sel = []; refreshStatus(); }
  }

  // ================================================================
  // Init
  // ================================================================
  function init() {
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;
    age = +user.age || 8;
    try { reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    data = _load();
    if (!document.getElementById('ew-defs')) {
      var d = document.createElement('div');
      d.id = 'ew-defs'; d.innerHTML = ART.DEFS;
      document.body.appendChild(d);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', function() { if (!G && document.getElementById('ew-hero')) { stopHero(); startHero(); drawThumbs(); } });
    showHome();
    if (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pull) {
      CloudSync.pull(_key()).then(function(changed) {
        if (changed) { data = _load(); if (!G) showHome(); }
      }).catch(function() {});
    }
  }

  // ---- test hooks (used by local Playwright checks) ----
  function autoSolve() {
    if (!G) return false;
    G.res.moves.forEach(function(mv) {
      if (moveDone(G.sc, mv)) return;
      var args = mv.args.map(function(a) {
        if (a.x != null) return G.sc.ptAt(a.x, a.y, 1e-4);
        return G.sc.objs.filter(function(o) {
          return isLin(o) && Math.abs(o.dx * a.dy - o.dy * a.dx) < 1e-6 && distLine(o, a.x0, a.y0) < 1e-4;
        })[0];
      });
      if (args.some(function(x) { return !x; })) throw new Error('autoSolve: missing input in ' + G.L.id);
      var r = runOp(G.sc, mv.tool, args);
      var ids = [];
      if (r.o) ids.push(r.o.id);
      if (r.p) ids.push(r.p.id);
      r.fresh.forEach(function(p) { ids.push(p.id); });
      G.actions.push({ ids: ids, kind: 'move' });
    });
    refreshStatus();
    if (G.status.done && !G.solved) onSolved();
    return G.status.done;
  }
  function verifyAll() {
    // every level's model solution (with and without shortcuts) must meet its goal
    var out = [];
    LEVELS.forEach(function(L) {
      var none = {};
      [allUnlocked(), none].forEach(function(u, k) {
        try {
          var r = resolve(L, u);
          var st = goalStatus(r.sc, L.goal(buildScene(L).P));
          out.push({ id: L.id, shortcuts: k === 0, moves: r.moves.length, ok: st.done, met: st.n + '/' + st.total });
        } catch (e) { out.push({ id: L.id, shortcuts: k === 0, ok: false, err: e.message }); }
      });
    });
    return out;
  }
  function tapWorld(x, y) { var s = w2s(x, y); onTap(s[0], s[1], 'mouse'); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    start: startLevel, home: showHome,
    _test: {
      autoSolve: autoSolve, verifyAll: verifyAll, tapWorld: tapWorld, setTool: setTool, hint: hint, undo: undo,
      state: function() { return G ? { id: G.L.id, moves: moveCount(), par: G.par, step: G.step, solved: G.solved, status: G.status && (G.status.n + '/' + G.status.total), sel: G.sel.length, replay: !!G.replay, replayDone: G.replay ? G.replay.done + '/' + G.replay.steps.length : null } : null; },
      data: function() { return data; },
      freeze: function(f) { frozen = f; dirty = true; },
      view: function() { return { cx: V.cx, cy: V.cy, z: V.z, W: W, H: H }; }
    }
  };
})();
