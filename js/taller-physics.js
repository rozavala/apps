/* ================================================================
   TALLER DE MÁQUINAS — physics (js/taller-physics.js)

   Pure maths, no DOM, so the numbers a kid sees are unit-tested
   (tests/unit/taller.spec.js loads this file in Node).

   1. Simple machines, ideal (no friction, light parts). Every model
      returns the same shape:
        { load, effort, ma, effortDist, loadDist }
      load / effort in kilograms-force (the weight of that many kg);
      newtons = kgf × 9.81. effortDist / loadDist: how far the effort
      and the load move for one "go" (metres). Work in = work out:
      effort × effortDist = load × loadDist.

   2. Gear trains: tooth counts, meshing, compound axles, speed and
      direction of every gear, the overall ratio, and a bicycle.

   3. A small XPBD world ("small steps", as in Little Engineer) for
      the chain-reaction builder: balls, rigid boxes (dominoes,
      crates, a seesaw on a pivot) and fixed planks, with contact
      friction. Fixed 1/60 s step, 20 sub-steps; deterministic.
   ================================================================ */

var TallerPhysics = (function() {
  'use strict';

  var G = 9.81;

  function round(v, d) { var p = Math.pow(10, d == null ? 2 : d); return Math.round(v * p) / p; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function N(kgf) { return kgf * G; }

  // ================================================================
  //  1. SIMPLE MACHINES
  // ================================================================

  // LEVER. Positions are metres along the bar from its left end.
  //  class 1: fulcrum between effort and load (seesaw, crowbar)
  //  class 2: load between fulcrum and effort (wheelbarrow, nutcracker)
  //  class 3: effort between fulcrum and load (tweezers, fishing rod)
  // Balance of moments about the fulcrum: E × dE = L × dL.
  function lever(p) {
    var dL = Math.abs(p.loadPos - p.fulcrum);
    var dE = Math.abs(p.effortPos - p.fulcrum);
    var cls = leverClass(p.fulcrum, p.loadPos, p.effortPos);
    var lift = p.lift == null ? 0.2 : p.lift;               // load rises this much
    var effort = dE > 0 ? p.mass * dL / dE : Infinity;
    return {
      kind: 'lever', cls: cls, load: p.mass, effort: effort,
      ma: dL > 0 ? dE / dL : Infinity,
      armLoad: dL, armEffort: dE,
      loadDist: lift, effortDist: dL > 0 ? lift * dE / dL : 0
    };
  }
  function leverClass(f, l, e) {
    var lo = Math.min(l, e), hi = Math.max(l, e);
    if (f > lo && f < hi) return 1;
    var dl = Math.abs(l - f), de = Math.abs(e - f);
    return de >= dl ? 2 : 3;
  }

  // PULLEYS. n = rope segments holding up the load (1 = one fixed
  // pulley: same force, the pull just changes direction).
  function pulley(p) {
    var n = Math.max(1, p.n | 0);
    var lift = p.lift == null ? 1 : p.lift;
    return { kind: 'pulley', n: n, load: p.mass, effort: p.mass / n, ma: n,
             loadDist: lift, effortDist: lift * n, fixedOnly: n === 1 };
  }

  // INCLINED PLANE (ramp). Push along the ramp (no friction):
  // E = W × height / length = W sin(angle).
  function incline(p) {
    var L = p.length, H = p.height;
    var ang = Math.asin(Math.min(1, H / L));
    return { kind: 'incline', load: p.mass, effort: p.mass * H / L, ma: L / H,
             angle: ang * 180 / Math.PI, run: Math.sqrt(Math.max(0, L * L - H * H)),
             loadDist: H, effortDist: L };
  }

  // WEDGE. Driven in by its full length, it pushes the sides apart by
  // its thickness: spreading force = push × length / thickness.
  // "load" is the force needed to split the wood.
  function wedge(p) {
    var L = p.length, T = p.thickness;
    return { kind: 'wedge', load: p.resist, effort: p.resist * T / L, ma: L / T,
             loadDist: T, effortDist: L,
             spread: function(push) { return push * L / T; } };
  }

  // WHEEL AND AXLE (a well winch / crank). One turn: the hand goes
  // round the big circle, the rope winds round the axle.
  function wheelAxle(p) {
    var R = p.wheelR, r = p.axleR, turns = p.turns == null ? 1 : p.turns;
    return { kind: 'wheel', load: p.mass, effort: p.mass * r / R, ma: R / r,
             loadDist: 2 * Math.PI * r * turns, effortDist: 2 * Math.PI * R * turns };
  }

  // SCREW (a screw jack). One turn of the handle lifts the load by
  // one pitch: E = W × pitch / (2π × handle radius).
  function screw(p) {
    var P = p.pitch, R = p.handleR, turns = p.turns == null ? 1 : p.turns;
    return { kind: 'screw', load: p.mass, effort: p.mass * P / (2 * Math.PI * R), ma: 2 * Math.PI * R / P,
             loadDist: P * turns, effortDist: 2 * Math.PI * R * turns };
  }

  var MACHINES = { lever: lever, pulley: pulley, incline: incline, wedge: wedge, wheel: wheelAxle, screw: screw };
  function machine(kind, p) { return MACHINES[kind](p); }

  // ================================================================
  //  2. GEARS
  // ================================================================
  // A train is a list of gears; each one either meshes with the one
  // before it ("mesh") or is fixed to the same axle ("axle", turns
  // with it at the same speed). Gear 0 is the driver.
  //   speed(k) = speed(k-1) × −teeth(k-1)/teeth(k)  (mesh)
  //   speed(k) = speed(k-1)                         (axle)
  // Only the meshing pairs change the ratio; a gear that both receives
  // and passes on the turn (an idler) flips direction and nothing else.
  function gearTrain(gears, driverRpm) {
    var rpm = driverRpm == null ? 30 : driverRpm;
    var out = [], num = 1, den = 1;
    for (var k = 0; k < gears.length; k++) {
      var g = gears[k], r;
      if (k === 0) r = rpm;
      else if (g.link === 'axle') r = out[k - 1].rpm;
      else {
        r = -out[k - 1].rpm * gears[k - 1].teeth / g.teeth;
        num *= gears[k - 1].teeth; den *= g.teeth;
      }
      out.push({ teeth: g.teeth, link: k ? (g.link || 'mesh') : 'driver', rpm: r, dir: r > 0 ? 1 : r < 0 ? -1 : 0 });
    }
    var last = out[out.length - 1];
    var c = gcd(num, den);
    return {
      gears: out,
      ratio: last ? last.rpm / rpm : 1,                       // signed output/input speed
      speedUp: last ? Math.abs(last.rpm / rpm) : 1,
      sameDir: last ? last.dir === out[0].dir : true,
      frac: [num / c, den / c]                                 // speed ratio as a fraction out:in = num:den
    };
  }

  // Positions for drawing: radius = module × teeth / 2, and each
  // meshing gear sits at (r1 + r2) along a gently zig-zagging line.
  function gearLayout(gears, module, angles) {
    var m = module || 0.01;
    var pos = [];
    for (var k = 0; k < gears.length; k++) {
      var r = m * gears[k].teeth / 2;
      if (k === 0) { pos.push({ x: 0, y: 0, r: r, phi: 0 }); continue; }
      var prev = pos[k - 1];
      if (gears[k].link === 'axle') { pos.push({ x: prev.x, y: prev.y, r: r, phi: 0 }); continue; }
      var phi = angles ? angles[k] : (k % 2 ? -0.26 : 0.26);
      var d = prev.r + r;
      pos.push({ x: prev.x + d * Math.cos(phi), y: prev.y + d * Math.sin(phi), r: r, phi: phi });
    }
    return pos;
  }

  // Starting angle of every gear so the teeth interlock: if gear i has
  // a tooth pointing along the line of centres, gear j has a gap there.
  function gearPhases(gears, layout) {
    var th = [];
    for (var k = 0; k < gears.length; k++) {
      if (k === 0) { th.push(0); continue; }
      if (gears[k].link === 'axle') { th.push(th[k - 1]); continue; }
      var phi = layout[k].phi, zi = gears[k - 1].teeth, zj = gears[k].teeth;
      var pitchI = 2 * Math.PI / zi, pitchJ = 2 * Math.PI / zj;
      var fi = (((phi - th[k - 1]) / pitchI) % 1 + 1) % 1;
      th.push(phi + Math.PI - (0.5 - fi) * pitchJ);
    }
    return th;
  }

  // BICYCLE. Chain: both sprockets turn the same way and the chain
  // moves the same number of teeth past each. Wheel turns per pedal
  // turn = front teeth / rear teeth.
  function bike(front, rear, wheelDiameter) {
    var D = wheelDiameter || 0.66;
    var turns = front / rear;
    return { front: front, rear: rear, wheelTurns: turns, metres: turns * Math.PI * D,
             circumference: Math.PI * D, sameDir: true };
  }

  // ================================================================
  //  3. XPBD WORLD (chain reactions)
  // ================================================================
  var SUB = 20, ITER = 2, DT = 1 / 60;
  var MATS = {
    wood:   { mu: 0.55, density: 600 },
    steel:  { mu: 0.25, density: 7800 },
    rubber: { mu: 0.9,  density: 1100 },
    crate:  { mu: 0.6,  density: 300 },
    // a rolling ball barely rubs: rolling is drawn, the contact is
    // nearly frictionless
    ball:   { mu: 0.004, density: 7800 },
    // a rubber ball: rolls like the steel one, but bounces
    bouncy: { mu: 0.004, density: 1100, e: 0.65 }
  };

  function World() {
    this.x = []; this.y = []; this.px = []; this.py = []; this.vx = []; this.vy = []; this.w = [];
    this.cons = [];          // [i, j, rest]
    this.balls = [];         // {p, r, mu, id, tag}
    this.boxes = [];         // {c, k:[4], hw, hh, mu, id, tag, kind}
    this.statics = [];       // {pts:[[x,y]×4], mu, tag, id}
    this.t = 0;
    this.touched = {};       // tag → first time something dynamic touched it
    this.hits = [];          // contact events this frame [{x,y,v}]
  }

  World.prototype.addParticle = function(x, y, mass) {
    var i = this.x.length;
    this.x.push(x); this.y.push(y); this.px.push(x); this.py.push(y);
    this.vx.push(0); this.vy.push(0); this.w.push(mass > 0 ? 1 / mass : 0);
    return i;
  };
  World.prototype.link = function(i, j) {
    var dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i];
    this.cons.push([i, j, Math.sqrt(dx * dx + dy * dy)]);
  };

  World.prototype.addBall = function(x, y, r, mat, opts) {
    var M = MATS[mat] || MATS.steel;
    var mass = (opts && opts.mass) || M.density * Math.PI * r * r * 0.05;   // a 5 cm-thick disc
    var p = this.addParticle(x, y, mass);
    var b = { p: p, r: r, mu: M.mu, mat: mat, id: opts && opts.id, tag: opts && opts.tag, mass: mass, roll: 0, e: M.e || 0 };
    if (b.e > 0) { this._bouncy = this._bouncy || {}; this._bouncy[p] = b; }
    this.balls.push(b);
    return b;
  };

  // A rigid box: four corner particles (1/12 of the mass each) and a
  // centre particle (2/3), linked by ten distance constraints. That
  // split gives the box the moment of inertia of a solid block, so a
  // domino topples at the speed a real one does.
  World.prototype.addBox = function(x, y, w, h, ang, mat, opts) {
    var M = MATS[mat] || MATS.wood;
    var mass = (opts && opts.mass) || M.density * w * h * 0.05;
    var c = this.addParticle(x, y, mass * 2 / 3);
    var ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), hw = w / 2, hh = h / 2;
    var loc = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    var k = [], s = this;
    loc.forEach(function(l) { k.push(s.addParticle(x + l[0] * ca - l[1] * sa, y + l[0] * sa + l[1] * ca, mass / 12)); });
    for (var a = 0; a < 4; a++) {
      this.link(k[a], k[(a + 1) % 4]);
      this.link(c, k[a]);
    }
    this.link(k[0], k[2]); this.link(k[1], k[3]);
    var bx = { c: c, k: k, hw: hw, hh: hh, mu: M.mu, mat: mat, mass: mass, id: opts && opts.id, tag: opts && opts.tag, kind: (opts && opts.kind) || 'box' };
    if (opts && opts.pivot) {
      // pinned through its middle to a fixed point: a seesaw
      var pv = this.addParticle(opts.pivot[0], opts.pivot[1], 0);
      for (var q = 0; q < 4; q++) this.link(pv, k[q]);
      bx.pivot = pv;
    }
    this.boxes.push(bx);
    return bx;
  };

  World.prototype.addStatic = function(x, y, w, h, ang, mat, opts) {
    var ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), hw = w / 2, hh = h / 2;
    var pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function(l) {
      return [x + l[0] * ca - l[1] * sa, y + l[0] * sa + l[1] * ca];
    });
    var M = MATS[mat] || MATS.wood;
    var st = { pts: pts, mu: M.mu, mat: mat, tag: opts && opts.tag, id: opts && opts.id, x: x, y: y, w: w, h: h, ang: ang || 0 };
    st.aabb = aabbOf(pts, 0);
    this.statics.push(st);
    return st;
  };

  function aabbOf(pts, pad) {
    var a = [Infinity, Infinity, -Infinity, -Infinity];
    for (var i = 0; i < pts.length; i++) {
      if (pts[i][0] < a[0]) a[0] = pts[i][0]; if (pts[i][1] < a[1]) a[1] = pts[i][1];
      if (pts[i][0] > a[2]) a[2] = pts[i][0]; if (pts[i][1] > a[3]) a[3] = pts[i][1];
    }
    a[0] -= pad; a[1] -= pad; a[2] += pad; a[3] += pad;
    return a;
  }

  // Closest point on the boundary of a convex CCW quad to (px,py).
  // Returns {d (signed: <0 inside), nx, ny (outward), e (edge), t}.
  function quadQuery(P, px, py) {
    var inside = true, best = null, bestIn = null;
    for (var e = 0; e < 4; e++) {
      var a = P[e], b = P[(e + 1) % 4];
      var ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey || 1e-12;
      var L = Math.sqrt(L2), nx = ey / L, ny = -ex / L;        // outward for CCW
      var sd = (px - a[0]) * nx + (py - a[1]) * ny;
      if (sd > 0) inside = false;
      var t = ((px - a[0]) * ex + (py - a[1]) * ey) / L2;
      if (bestIn === null || sd > bestIn.d) bestIn = { d: sd, nx: nx, ny: ny, e: e, t: Math.max(0, Math.min(1, t)) };
      var tc = Math.max(0, Math.min(1, t));
      var qx = a[0] + ex * tc, qy = a[1] + ey * tc, dx = px - qx, dy = py - qy, dd = Math.sqrt(dx * dx + dy * dy);
      if (best === null || dd < best.d) best = { d: dd, qx: qx, qy: qy, dx: dx, dy: dy, e: e, t: tc, nx: nx, ny: ny };
    }
    if (inside) return bestIn;
    var n = best.d > 1e-9 ? [best.dx / best.d, best.dy / best.d] : [best.nx, best.ny];
    return { d: best.d, nx: n[0], ny: n[1], e: best.e, t: best.t };
  }

  World.prototype._quadOf = function(bx) {
    var s = this;
    return bx.k.map(function(i) { return [s.x[i], s.y[i]]; });
  };

  // Push particle p (radius r) out of a quad. Dynamic quads pass the
  // corner particle indices in `ids` so the push is shared.
  World.prototype._contact = function(p, r, mu, quad, ids, tag, mu2) {
    var q = quadQuery(quad, this.x[p], this.y[p]);
    if (!q) return false;
    var pen = r - q.d;
    if (pen <= 0) return false;
    var nx = q.nx, ny = q.ny;
    var wp = this.w[p], ia = -1, ib = -1, wa = 0, wb = 0, t = q.t;
    if (ids) { ia = ids[q.e]; ib = ids[(q.e + 1) % 4]; wa = this.w[ia]; wb = this.w[ib]; }
    var W = wp + (1 - t) * (1 - t) * wa + t * t * wb;
    if (W <= 0) return false;
    var lam = pen / W;
    this.x[p] += wp * lam * nx; this.y[p] += wp * lam * ny;
    if (ids) {
      this.x[ia] -= wa * lam * (1 - t) * nx; this.y[ia] -= wa * lam * (1 - t) * ny;
      this.x[ib] -= wb * lam * t * nx; this.y[ib] -= wb * lam * t * ny;
    }
    if (this._bouncy && this._bouncy[p]) { this._bouncy[p].nx += nx; this._bouncy[p].ny += ny; }
    // friction: cancel (some of) the sliding along the surface this sub-step
    var m = Math.sqrt(mu * (mu2 == null ? mu : mu2));
    var dx = this.x[p] - this.px[p], dy = this.y[p] - this.py[p];
    if (ids) {
      dx -= (1 - t) * (this.x[ia] - this.px[ia]) + t * (this.x[ib] - this.px[ib]);
      dy -= (1 - t) * (this.y[ia] - this.py[ia]) + t * (this.y[ib] - this.py[ib]);
    }
    var dn = dx * nx + dy * ny, tx = dx - dn * nx, ty = dy - dn * ny, tl = Math.sqrt(tx * tx + ty * ty);
    if (tl > 1e-12) {
      var k = tl < m * pen * 1.2 ? 1 : Math.min(1, m * pen / tl);
      var fl = k / W;
      this.x[p] -= wp * fl * tx; this.y[p] -= wp * fl * ty;
      if (ids) {
        this.x[ia] += wa * fl * (1 - t) * tx; this.y[ia] += wa * fl * (1 - t) * ty;
        this.x[ib] += wb * fl * t * tx; this.y[ib] += wb * fl * t * ty;
      }
    }
    // a goal counts as touched only by something on the move (a part
    // set down leaning on the bell does not ring it)
    if (tag && !this.touched[tag] && this._h) {
      var mx = (this.x[p] - this.px[p]) / this._h, my = (this.y[p] - this.py[p]) / this._h;
      if (mx * mx + my * my > 0.04) this.touched[tag] = this.t || 1e-6;
    }
    return true;
  };

  World.prototype._solveCons = function() {
    var x = this.x, y = this.y, w = this.w;
    for (var c = 0; c < this.cons.length; c++) {
      var C = this.cons[c], i = C[0], j = C[1];
      var dx = x[j] - x[i], dy = y[j] - y[i], d = Math.sqrt(dx * dx + dy * dy);
      var W = w[i] + w[j];
      if (d < 1e-12 || W <= 0) continue;
      var lam = (d - C[2]) / (d * W);
      x[i] += w[i] * lam * dx; y[i] += w[i] * lam * dy;
      x[j] -= w[j] * lam * dx; y[j] -= w[j] * lam * dy;
    }
  };

  var CORNER_R = 0.004;
  World.prototype._solveContacts = function() {
    var s = this, i, j, k;
    var quads = this.boxes.map(function(b) { var q = s._quadOf(b); return { q: q, bb: aabbOf(q, 0.06) }; });
    // balls
    for (i = 0; i < this.balls.length; i++) {
      var B = this.balls[i], p = B.p, bx = this.x[p], by = this.y[p];
      for (k = 0; k < this.statics.length; k++) {
        var S = this.statics[k], a = S.aabb;
        if (bx < a[0] - B.r || bx > a[2] + B.r || by < a[1] - B.r || by > a[3] + B.r) continue;
        this._contact(p, B.r, B.mu, S.pts, null, S.tag, S.mu);
      }
      for (k = 0; k < this.boxes.length; k++) {
        var bb = quads[k].bb;
        if (bx < bb[0] - B.r || bx > bb[2] + B.r || by < bb[1] - B.r || by > bb[3] + B.r) continue;
        this._contact(p, B.r, B.mu, quads[k].q, this.boxes[k].k, this.boxes[k].tag, this.boxes[k].mu);
      }
      for (j = i + 1; j < this.balls.length; j++) {
        var C = this.balls[j], q = C.p;
        var dx = this.x[q] - this.x[p], dy = this.y[q] - this.y[p], d = Math.sqrt(dx * dx + dy * dy), rr = B.r + C.r;
        if (d >= rr) continue;
        // two balls on exactly the same spot: push the later one straight up
        if (d < 1e-9) { dx = 0; dy = 1e-9; d = 1e-9; }
        var W = this.w[p] + this.w[q], lam = (rr - d) / (d * W);
        this.x[p] -= this.w[p] * lam * dx; this.y[p] -= this.w[p] * lam * dy;
        this.x[q] += this.w[q] * lam * dx; this.y[q] += this.w[q] * lam * dy;
      }
    }
    // box corners against statics and against the other boxes
    for (i = 0; i < this.boxes.length; i++) {
      var X = this.boxes[i];
      for (var c = 0; c < 4; c++) {
        var pc = X.k[c], cx = this.x[pc], cy = this.y[pc];
        for (k = 0; k < this.statics.length; k++) {
          var S2 = this.statics[k], a2 = S2.aabb;
          if (cx < a2[0] - 0.01 || cx > a2[2] + 0.01 || cy < a2[1] - 0.01 || cy > a2[3] + 0.01) continue;
          this._contact(pc, CORNER_R, X.mu, S2.pts, null, S2.tag, S2.mu);
        }
        for (j = 0; j < this.boxes.length; j++) {
          if (j === i) continue;
          var bb2 = quads[j].bb;
          if (cx < bb2[0] || cx > bb2[2] || cy < bb2[1] || cy > bb2[3]) continue;
          this._contact(pc, CORNER_R, X.mu, quads[j].q, this.boxes[j].k, this.boxes[j].tag, this.boxes[j].mu);
        }
      }
    }
  };

  // Nothing on a 1.8 m wall falls faster than about 6 m/s, so a speed
  // well above that can only come from a bad overlap: cap it.
  var MAX_V = 10;
  World.prototype.step = function(dt) {
    var h = (dt || DT) / SUB, n = this.x.length, i, it, k;
    this._h = h;
    var bouncy = this.balls.filter(function(b) { return b.e > 0; });
    for (var s = 0; s < SUB; s++) {
      for (k = 0; k < bouncy.length; k++) { var bb = bouncy[k]; bb.v0x = this.vx[bb.p]; bb.v0y = this.vy[bb.p]; bb.nx = 0; bb.ny = 0; }
      for (i = 0; i < n; i++) {
        if (this.w[i] === 0) continue;
        this.vy[i] -= G * h;
        this.px[i] = this.x[i]; this.py[i] = this.y[i];
        this.x[i] += this.vx[i] * h; this.y[i] += this.vy[i] * h;
      }
      for (it = 0; it < ITER; it++) { this._solveCons(); this._solveContacts(); }
      for (i = 0; i < n; i++) {
        if (this.w[i] === 0) continue;
        var vx = (this.x[i] - this.px[i]) / h, vy = (this.y[i] - this.py[i]) / h, sp = vx * vx + vy * vy;
        if (sp > MAX_V * MAX_V) { var f = MAX_V / Math.sqrt(sp); vx *= f; vy *= f; }
        this.vx[i] = vx; this.vy[i] = vy;
      }
      // a rubber ball bounces: give back part of the speed it hit with
      for (k = 0; k < bouncy.length; k++) {
        var b = bouncy[k], nl = Math.sqrt(b.nx * b.nx + b.ny * b.ny);
        if (nl < 1e-9) continue;
        var nx = b.nx / nl, ny = b.ny / nl, vin = b.v0x * nx + b.v0y * ny;
        if (vin > -0.4) continue;
        var vn = this.vx[b.p] * nx + this.vy[b.p] * ny, add = -b.e * vin - vn;
        if (add > 0) { this.vx[b.p] += add * nx; this.vy[b.p] += add * ny; }
      }
      this.t += h;
    }
    // balls show a turn as they roll
    for (i = 0; i < this.balls.length; i++) { var B = this.balls[i]; B.roll -= this.vx[B.p] * (dt || DT) / B.r; }
  };

  // Resolve any overlap the parts were placed with, without turning the
  // push-apart into speed (otherwise a domino set down touching the
  // floor would hop).
  World.prototype.settle = function() {
    for (var k = 0; k < 40; k++) {
      for (var i = 0; i < this.x.length; i++) { this.px[i] = this.x[i]; this.py[i] = this.y[i]; }
      this._solveCons();
      this._solveContacts();
      var moved = 0;
      for (i = 0; i < this.x.length; i++) moved = Math.max(moved, Math.abs(this.x[i] - this.px[i]), Math.abs(this.y[i] - this.py[i]));
      if (moved < 1e-6) break;
    }
    for (var j = 0; j < this.x.length; j++) { this.vx[j] = 0; this.vy[j] = 0; this.px[j] = this.x[j]; this.py[j] = this.y[j]; }
    this.touched = {};
    this._h = 0;
  };

  World.prototype.boxPose = function(bx) {
    var a = bx.k[0], b = bx.k[1];
    return { x: this.x[bx.c], y: this.y[bx.c], ang: Math.atan2(this.y[b] - this.y[a], this.x[b] - this.x[a]) };
  };
  World.prototype.kinetic = function() {
    var e = 0;
    for (var i = 0; i < this.x.length; i++) if (this.w[i] > 0) e += (this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]) / this.w[i];
    return e / 2;
  };

  // ── Build a contraption from a level and the kid's placed parts ──
  // Part sizes are a tabletop toy: a 3 m × 1.8 m wall, 10 cm balls.
  var PARTS = {
    plank:  { w: 0.60, h: 0.04, static: true,  mat: 'wood' },
    long:   { w: 1.00, h: 0.04, static: true,  mat: 'wood' },
    domino: { w: 0.045, h: 0.20, mat: 'wood', mass: 0.12 },
    ball:   { r: 0.05, mat: 'ball', mass: 0.5 },
    rubber: { r: 0.06, mat: 'bouncy', mass: 0.12 },
    crate:  { w: 0.20, h: 0.20, mat: 'crate', mass: 2.0 },
    seesaw: { w: 0.90, h: 0.04, mat: 'wood', mass: 0.5 },
    block:  { w: 0.30, h: 0.30, static: true, mat: 'wood' }
  };

  var SEESAW_OFF = 0.05;
  function buildWorld(level, placed) {
    var W = new World();
    W.level = level;
    var all = (level.fixed || []).concat(placed || []);
    // room: floor and walls (off-screen side walls keep parts in view)
    W.addStatic(level.w / 2, -0.1, level.w + 2, 0.2, 0, 'wood', { tag: 'floor' });
    W.addStatic(-0.1, level.h / 2, 0.2, level.h * 3, 0, 'wood', { tag: 'wall' });
    W.addStatic(level.w + 0.1, level.h / 2, 0.2, level.h * 3, 0, 'wood', { tag: 'wall' });
    (level.statics || []).forEach(function(s) { W.addStatic(s.x, s.y, s.w, s.h, (s.a || 0) * Math.PI / 180, s.mat || 'wood', { tag: s.tag, id: s.id }); });
    if (level.goal && level.goal.type === 'cup') {
      var g = level.goal, t = 0.03;
      W.addStatic(g.x, g.y + t / 2, g.w + 2 * t, t, 0, 'steel', { tag: 'cup' });
      W.addStatic(g.x - g.w / 2 - t / 2, g.y + g.h / 2, t, g.h, 0, 'steel', { tag: 'cup' });
      W.addStatic(g.x + g.w / 2 + t / 2, g.y + g.h / 2, t, g.h, 0, 'steel', { tag: 'cup' });
    }
    if (level.goal && level.goal.type === 'bell') {
      var b = level.goal;
      W.addStatic(b.x, b.y, 0.12, 0.14, 0, 'steel', { tag: 'bell' });
    }
    W.parts = [];
    all.forEach(function(p, idx) {
      var P = PARTS[p.type], ang = (p.a || 0) * Math.PI / 180, ref;
      if (!P) return;
      if (P.static) ref = W.addStatic(p.x, p.y, P.w, P.h, ang, P.mat, { tag: p.type, id: idx });
      else if (P.r) ref = W.addBall(p.x, p.y, P.r, P.mat, { mass: P.mass, tag: p.type, id: idx });
      else if (p.type === 'seesaw') {
        // the pin sits a little toward the raised end, so the board rests
        // on its low end (as a real seesaw with a kid on it would) instead
        // of hanging perfectly balanced
        var off = ang < 0 ? SEESAW_OFF : ang > 0 ? -SEESAW_OFF : 0;
        ref = W.addBox(p.x + off * Math.cos(ang), p.y + off * Math.sin(ang), P.w, P.h, ang, P.mat,
                       { mass: P.mass, tag: 'seesaw', kind: 'seesaw', id: idx, pivot: [p.x, p.y] });
      }
      else ref = W.addBox(p.x, p.y, P.w, P.h, ang, P.mat, { mass: P.mass, tag: p.type, kind: p.type, id: idx });
      W.parts.push({ def: p, ref: ref, fixed: idx < (level.fixed || []).length });
    });
    W.settle();
    // a starting nudge (the "go" push) for the parts that have one
    W.parts.forEach(function(pt) {
      var v = pt.def.v;
      if (!v) return;
      var ids = pt.ref.p != null ? [pt.ref.p] : pt.ref.k.concat([pt.ref.c]);
      ids.forEach(function(i) { W.vx[i] = v[0]; W.vy[i] = v[1]; });
    });
    return W;
  }

  // Has the level's goal happened? cup: a ball's centre sits inside the
  // cup; bell: something moving touched the bell.
  function goalMet(W) {
    var g = W.level.goal;
    if (!g) return false;
    if (g.type === 'bell') return !!W.touched.bell;
    if (g.type === 'cup') {
      for (var i = 0; i < W.balls.length; i++) {
        var p = W.balls[i].p, x = W.x[p], y = W.y[p];
        if (Math.abs(x - g.x) < g.w / 2 && y > g.y && y < g.y + g.h) return true;
      }
    }
    return false;
  }

  // Run a level headless (tests, and checking reference answers).
  function runLevel(level, placed, maxT) {
    var W = buildWorld(level, placed), T = maxT || 10, frames = Math.round(T / DT), held = 0;
    for (var f = 0; f < frames; f++) {
      W.step(DT);
      if (goalMet(W)) { held++; if (held >= 12) return { ok: true, t: W.t, world: W }; }
      else held = 0;
    }
    return { ok: false, t: W.t, world: W };
  }

  // Where a dropped part comes to rest: the highest surface under x —
  // a shelf, a plank, or (when halfW is given) the top of a ball, domino
  // or crate already placed there, so parts dropped on one spot stack.
  // `skip` is the index in `placed` of the part being dropped.
  function surfaceBelow(level, placed, x, yTop, skip, halfW) {
    var best = 0;
    function test(s) {
      var ang = (s.a || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
      var dx = x - s.x;
      // top edge as a line through the box: centre + (hh normal)
      var u = dx / (ca || 1e-9);
      if (Math.abs(u) > s.w / 2) return;
      var top = s.y + u * sa + (s.h / 2) / (ca || 1e-9);
      if (top <= yTop + 1e-6 && top > best) best = top;
    }
    (level.statics || []).forEach(test);
    var nFixed = (level.fixed || []).length;
    (level.fixed || []).concat(placed || []).forEach(function(p, i) {
      if (i - nFixed === skip) return;
      var P = PARTS[p.type];
      if (!P) return;
      if (P.static) { test({ x: p.x, y: p.y, w: P.w, h: P.h, a: p.a }); return; }
      if (halfW == null || p.y >= yTop) return;
      var qw = P.r || P.w / 2, qtop = p.y + (P.r || P.h / 2);
      if (Math.abs(x - p.x) < qw + halfW && qtop > best) best = qtop;
    });
    return best;
  }

  return {
    G: G, N: N, round: round, gcd: gcd,
    lever: lever, leverClass: leverClass, pulley: pulley, incline: incline, wedge: wedge,
    wheelAxle: wheelAxle, screw: screw, machine: machine,
    gearTrain: gearTrain, gearLayout: gearLayout, gearPhases: gearPhases, bike: bike,
    World: World, PARTS: PARTS, MATS: MATS, buildWorld: buildWorld, goalMet: goalMet, runLevel: runLevel,
    surfaceBelow: surfaceBelow, quadQuery: quadQuery, DT: DT
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TallerPhysics;
