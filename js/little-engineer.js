/* ================================================================
   LITTLE ENGINEER 🌉 · Pequeño Ingeniero
   Design a bridge on a snap grid, then test it with a real vehicle.

   Physics: XPBD ("small steps") — every member is a distance
   constraint with a compliance from its material stiffness. The
   Lagrange multiplier of each solve gives the real axial force, so
   members colour by stress and break when over their limit. Long
   members buckle (snap) at a lower squeeze. Fixed 60 Hz timestep with
   32 sub-steps; stable on phones.

   Per-kid storage: zs_engineer_<name>
   { v:1, levels:{ l1:{stars,best,date} }, realBuild:{date,coins}|null,
     designs:{ l1:"x1,y1,x2,y2,m;..." } }
   ================================================================ */

var LittleEngineer = (function() {
  'use strict';

  var D = (typeof LittleEngineerData !== 'undefined') ? LittleEngineerData : null;
  var G = 9.81;
  var FIXED_DT = 1 / 60;
  var SUBSTEPS = 32;
  var MAT_CHAR = { road: 'r', wood: 'w', steel: 's', cable: 'c' };
  var CHAR_MAT = { r: 'road', w: 'wood', s: 'steel', c: 'cable' };

  // ================================================================
  //  DESIGN HELPERS (pure)
  // ================================================================
  function ptKey(x, y) { return x + ',' + y; }
  function memberKey(m) {
    var a = ptKey(m[0], m[1]), b = ptKey(m[2], m[3]);
    return a < b ? a + '|' + b : b + '|' + a;
  }
  function memLen(m) { return Math.sqrt((m[2] - m[0]) * (m[2] - m[0]) + (m[3] - m[1]) * (m[3] - m[1])); }

  function isAnchor(level, x, y) {
    for (var i = 0; i < level.anchors.length; i++) {
      if (level.anchors[i][0] === x && level.anchors[i][1] === y) return true;
    }
    return false;
  }

  function designJoints(level, members) {
    var seen = {}, out = [];
    function add(x, y) {
      var k = ptKey(x, y);
      if (seen[k]) return;
      seen[k] = true;
      out.push({ x: x, y: y, anchor: isAnchor(level, x, y) });
    }
    level.anchors.forEach(function(a) { add(a[0], a[1]); });
    members.forEach(function(m) { add(m[0], m[1]); add(m[2], m[3]); });
    return out;
  }

  function designCost(level, members) {
    var cost = 0;
    members.forEach(function(m) { cost += memLen(m) * D.MATERIALS[m[4]].cost; });
    var js = designJoints(level, members);
    js.forEach(function(j) { if (!j.anchor) cost += D.JOINT_COST; });
    return Math.round(cost / 100) * 100;
  }

  function encodeDesign(members) {
    return members.map(function(m) { return m[0] + ',' + m[1] + ',' + m[2] + ',' + m[3] + ',' + MAT_CHAR[m[4]]; }).join(';');
  }
  function decodeDesign(str) {
    if (typeof str !== 'string' || !str) return [];
    var out = [];
    str.split(';').forEach(function(p) {
      var f = p.split(',');
      if (f.length !== 5 || !CHAR_MAT[f[4]]) return;
      var n = f.slice(0, 4).map(Number);
      if (n.some(function(v) { return !isFinite(v) || Math.abs(v) > 60; })) return;
      out.push([n[0], n[1], n[2], n[3], CHAR_MAT[f[4]]]);
    });
    return out;
  }

  // Rock: cliffs, pillars, towers. Strict interior (anchors sit on edges).
  function rockAt(level, x, y) {
    if (y < 0 && (x < 0 || x > level.span)) return true;
    var piers = level.pillars || [];
    for (var i = 0; i < piers.length; i++) {
      var p = piers[i];
      if (Math.abs(x - p.x) < p.w / 2 && y < p.top) return true;
    }
    return false;
  }
  function jointAllowed(level, x, y) {
    if (isAnchor(level, x, y)) return true;
    if (y <= level.water + 0.5) return false;
    if (y > 11 || x < -3 || x > level.span + 3) return false;
    if (y <= 0 && (x <= 0 || x >= level.span)) return false;
    if (rockAt(level, x, y)) return false;
    var piers = level.pillars || [];
    for (var i = 0; i < piers.length; i++) {
      var p = piers[i];
      if (Math.abs(x - p.x) <= p.w / 2 && y <= p.top) return false;
    }
    if (level.clear && inClear(level.clear, x, y)) return false;
    return true;
  }
  function inClear(c, x, y) { return x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1; }
  function memberAllowed(level, m) {
    var L = memLen(m), n = Math.max(2, Math.ceil(L / 0.1));
    for (var i = 1; i < n; i++) {
      var t = i / n, x = m[0] + (m[2] - m[0]) * t, y = m[1] + (m[3] - m[1]) * t;
      if (rockAt(level, x, y)) return false;
      if (level.clear && inClear(level.clear, x, y)) return false;
    }
    return true;
  }

  // ================================================================
  //  PHYSICS — XPBD sim
  // ================================================================
  function Sim(level, members, vehicleId) {
    var s = this;
    s.level = level;
    s.t = 0;
    s.state = 'run';         // run | success | fail
    s.doneAt = 0;
    s.events = [];           // {type:'break'|'splash', x, y, v}
    s.breaks = 0;
    // particles
    s.px = []; s.py = []; s.ox = []; s.oy = []; s.vx = []; s.vy = [];
    s.w = []; s.mass = []; s.wet = []; s.kind = [];
    s.members = [];
    s.vlinks = [];
    var index = {};

    function addP(x, y, mass, fixed, kind) {
      var i = s.px.length;
      s.px.push(x); s.py.push(y); s.ox.push(x); s.oy.push(y); s.vx.push(0); s.vy.push(0);
      s.mass.push(mass); s.w.push(fixed ? 0 : 1 / mass); s.wet.push(false); s.kind.push(kind || 'joint');
      return i;
    }
    var joints = designJoints(level, members);
    joints.forEach(function(j) {
      index[ptKey(j.x, j.y)] = addP(j.x, j.y, 1, j.anchor, j.anchor ? 'anchor' : 'joint');
    });
    var jm = s.mass.map(function() { return 6; });
    members.forEach(function(m) {
      var mat = D.MATERIALS[m[4]];
      var a = index[ptKey(m[0], m[1])], b = index[ptKey(m[2], m[3])];
      if (a === b) return;
      var L = memLen(m);
      var mm = L * mat.density;
      jm[a] += mm / 2; jm[b] += mm / 2;
      s.members.push(s._mkMember(a, b, L, mat, false));
    });
    for (var i = 0; i < jm.length; i++) {
      s.mass[i] = jm[i];
      if (s.w[i] !== 0) s.w[i] = 1 / jm[i];
    }
    s.jointCount = s.px.length;

    // ---- vehicle: two wheels + two chassis points, a soft box ----
    var V = D.VEHICLES[vehicleId || level.vehicle];
    s.V = V;
    var fx = -2.2, rx = fx - V.wheelbase;
    var mW = V.mass * 0.16, mC = V.mass * 0.34;
    var wr = addP(rx, V.r, mW, false, 'wheel');
    var wf = addP(fx, V.r, mW, false, 'wheel');
    var cr = addP(rx, V.r + V.rideH, mC, false, 'body');
    var cf = addP(fx, V.r + V.rideH, mC, false, 'body');
    s.veh = { wr: wr, wf: wf, cr: cr, cf: cf, rot: [0, 0], contact: [null, null], started: false, x0: rx, airTime: 0 };
    var kS = V.mass * G / (2 * 0.06);
    function link(a, b, k) {
      var dx = s.px[b] - s.px[a], dy = s.py[b] - s.py[a];
      s.vlinks.push({ a: a, b: b, L0: Math.sqrt(dx * dx + dy * dy), c: k ? 1 / k : 0 });
    }
    link(wr, wf, 0); link(cr, cf, 0);
    link(wr, cr, kS); link(wf, cf, kS);
    link(wr, cf, kS * 1.4); link(wf, cr, kS * 1.4);
    s.wheels = [wr, wf];

    s.ground = [[-80, 0, 0, 0], [level.span, 0, level.span + 80, 0]];
    s.bed = level.water - 3;
    s.piers = level.pillars || [];   // the cable tower stands beside the road
  }

  Sim.prototype._mkMember = function(a, b, L, mat, debris) {
    return {
      a: a, b: b, L0: L, mat: mat, c: L / mat.EA, road: mat.id === 'road', cable: !!mat.tensionOnly,
      limitT: mat.strength,
      limitC: mat.tensionOnly ? 0 : mat.strength * Math.min(1, Math.pow(mat.buckle / L, 2)),
      broken: false, debris: !!debris, f: 0, acc: 0, ratio: 0, over: 0
    };
  };

  Sim.prototype.step = function(dt) {
    var s = this, n = SUBSTEPS, h = dt / n, h2 = h * h;
    var i, k, m;
    var np = s.px.length;
    var px = s.px, py = s.py, ox = s.ox, oy = s.oy, vx = s.vx, vy = s.vy, w = s.w;
    var members = s.members, nm = members.length;
    var level = s.level, water = level.water;
    var veh = s.veh;
    var ramp = Math.min(1, 0.35 + s.t / 0.5);           // ease gravity in
    var driving = s.t > 0.9;
    if (driving) veh.started = true;
    for (k = 0; k < nm; k++) members[k].acc = 0;

    for (var sub = 0; sub < n; sub++) {
      // integrate
      for (i = 0; i < np; i++) {
        if (w[i] === 0) continue;
        vy[i] -= G * ramp * h;
        ox[i] = px[i]; oy[i] = py[i];
        px[i] += vx[i] * h; py[i] += vy[i] * h;
      }
      // members
      for (k = 0; k < nm; k++) {
        m = members[k];
        if (m.broken) continue;
        var a = m.a, b = m.b, wa = w[a], wb = w[b], ws = wa + wb;
        if (ws === 0) continue;
        var dx = px[a] - px[b], dy = py[a] - py[b];
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-9) continue;
        var C = len - m.L0;
        if (m.cable && C < 0) continue;
        var alpha = m.c / h2;
        var dl = -C / (ws + alpha);
        var nx = dx / len, ny = dy / len;
        px[a] += wa * dl * nx; py[a] += wa * dl * ny;
        px[b] -= wb * dl * nx; py[b] -= wb * dl * ny;
        if (!m.debris) m.acc += -dl / h2;
      }
      // vehicle internal links
      for (k = 0; k < s.vlinks.length; k++) {
        var L = s.vlinks[k];
        var dx2 = px[L.a] - px[L.b], dy2 = py[L.a] - py[L.b];
        var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (len2 < 1e-9) continue;
        var dl2 = -(len2 - L.L0) / (w[L.a] + w[L.b] + L.c / h2);
        px[L.a] += w[L.a] * dl2 * dx2 / len2; py[L.a] += w[L.a] * dl2 * dy2 / len2;
        px[L.b] -= w[L.b] * dl2 * dx2 / len2; py[L.b] -= w[L.b] * dl2 * dy2 / len2;
      }
      // wheel contacts
      for (var wi = 0; wi < 2; wi++) s._wheelContact(wi);
      // static world
      for (i = 0; i < np; i++) if (w[i] !== 0) s._collideStatic(i);

      // velocities
      for (i = 0; i < np; i++) {
        if (w[i] === 0) continue;
        vx[i] = (px[i] - ox[i]) / h; vy[i] = (py[i] - oy[i]) / h;
      }
      // member dashpots (damp wobble along each member)
      for (k = 0; k < nm; k++) {
        m = members[k];
        if (m.broken) continue;
        s._damp(m.a, m.b, 0.04);
      }
      for (k = 0; k < s.vlinks.length; k++) s._damp(s.vlinks[k].a, s.vlinks[k].b, k < 2 ? 0.05 : 0.012);
      // water
      for (i = 0; i < np; i++) {
        if (w[i] === 0) continue;
        if (py[i] < water) {
          if (!s.wet[i]) {
            s.wet[i] = true;
            if (vy[i] < -1.2) s.events.push({ type: 'splash', x: px[i], y: water, v: -vy[i], big: s.kind[i] !== 'joint' });
          }
          var drag = Math.max(0, 1 - 5 * h);
          vx[i] *= drag; vy[i] *= drag;
          vy[i] += G * 0.9 * h;
        } else if (s.wet[i] && py[i] > water + 0.3) s.wet[i] = false;
      }
      // drive
      if (driving) s._drive(h);
    }

    // forces, colours, breaking
    for (k = 0; k < nm; k++) {
      m = members[k];
      if (m.broken || m.debris) continue;
      var fInst = m.acc / n;
      if (m.cable && fInst < 0) fInst = 0;
      m.f += (fInst - m.f) * 0.35;
      m.ratio = m.f >= 0 ? m.f / m.limitT : (m.limitC > 0 ? -m.f / m.limitC : 0);
      if (m.ratio > 1) {
        m.over++;
        if (m.over >= 2 && s.t > 0.15) s._break(k);
      } else m.over = 0;
    }

    // wheel rotation for drawing
    for (var q = 0; q < 2; q++) {
      var wid = s.wheels[q];
      var dxw = vx[wid] * dt;
      s.veh.rot[q] += dxw / s.V.r;
    }

    s.t += dt;
    s._judge();
  };

  Sim.prototype._damp = function(a, b, beta) {
    var s = this, w = s.w, ws = w[a] + w[b];
    if (ws === 0) return;
    var dx = s.px[b] - s.px[a], dy = s.py[b] - s.py[a];
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-9) return;
    dx /= len; dy /= len;
    var rv = (s.vx[b] - s.vx[a]) * dx + (s.vy[b] - s.vy[a]) * dy;
    var imp = rv * beta / ws;
    s.vx[a] += w[a] * imp * dx; s.vy[a] += w[a] * imp * dy;
    s.vx[b] -= w[b] * imp * dx; s.vy[b] -= w[b] * imp * dy;
  };

  Sim.prototype._collideStatic = function(i) {
    var s = this, x = s.px[i], y = s.py[i], span = s.level.span;
    var fr = 0.5;
    if (y < 0 && (x < 0 || x > span)) {
      var penX = x < 0 ? -x : x - span, penY = -y;
      if (penX < penY) {
        s.px[i] = x < 0 ? 0 : span;
        s.py[i] = s.oy[i] + (y - s.oy[i]) * fr;
      } else {
        s.py[i] = 0;
        s.px[i] = s.ox[i] + (x - s.ox[i]) * fr;
      }
      x = s.px[i]; y = s.py[i];
    }
    for (var k = 0; k < s.piers.length; k++) {
      var p = s.piers[k], hw = p.w / 2;
      if (Math.abs(x - p.x) < hw && y < p.top && y > s.bed) {
        var pl = x - (p.x - hw), pr = (p.x + hw) - x, pt = p.top - y;
        if (pt <= pl && pt <= pr) { s.py[i] = p.top; s.px[i] = s.ox[i] + (x - s.ox[i]) * fr; }
        else if (pl < pr) { s.px[i] = p.x - hw; s.py[i] = s.oy[i] + (y - s.oy[i]) * fr; }
        else { s.px[i] = p.x + hw; s.py[i] = s.oy[i] + (y - s.oy[i]) * fr; }
        x = s.px[i]; y = s.py[i];
      }
    }
    if (y < s.bed) {
      s.py[i] = s.bed;
      s.px[i] = s.ox[i] + (x - s.ox[i]) * 0.2;
    }
  };

  // Wheel vs road members and the cliff roads. One-sided: a wheel that
  // has dropped below a road piece falls through instead of sticking.
  Sim.prototype._wheelContact = function(wi) {
    var s = this, id = s.wheels[wi], r = s.V.r;
    var best = null;
    var segs = s.ground, k, m;
    for (k = 0; k < segs.length; k++) {
      var g = segs[k];
      var c = s._contactSeg(id, r, g[0], g[1], g[2], g[3], -1, -1, 0);
      if (c) best = c;
    }
    for (k = 0; k < s.members.length; k++) {
      m = s.members[k];
      if (m.broken || !m.road) continue;
      var c2 = s._contactSeg(id, r, s.px[m.a], s.py[m.a], s.px[m.b], s.py[m.b], m.a, m.b, 1);
      if (c2) best = c2;
    }
    s.veh.contact[wi] = best;
  };

  Sim.prototype._contactSeg = function(id, r, ax, ay, bx, by, ia, ib) {
    var s = this;
    var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    if (L2 < 1e-6) return null;
    var L = Math.sqrt(L2);
    var nx = -dy / L, ny = dx / L;
    if (ny < 0) { nx = -nx; ny = -ny; }
    var x = s.px[id], y = s.py[id];
    var t = ((x - ax) * dx + (y - ay) * dy) / L2;
    var sd = (x - ax) * nx + (y - ay) * ny;
    if (sd < -0.35 * r) return null;
    var pen, cx, cy;
    if (t >= 0 && t <= 1) {
      if (sd >= r) return null;
      pen = r - sd; cx = nx; cy = ny;
    } else {
      var tc = t < 0 ? 0 : 1;
      var qx = ax + dx * tc, qy = ay + dy * tc;
      var ex = x - qx, ey = y - qy, d = Math.sqrt(ex * ex + ey * ey);
      if (d >= r || d < 1e-6) return null;
      pen = r - d; cx = ex / d; cy = ey / d;
      if (cy < 0.2) return null;
      t = tc;
    }
    var wp = s.w[id];
    var wa = ia >= 0 ? s.w[ia] : 0, wb = ib >= 0 ? s.w[ib] : 0;
    var ta = 1 - t, tb = t;
    var denom = wp + wa * ta * ta + wb * tb * tb;
    if (denom <= 0) return null;
    var lam = pen / denom;
    s.px[id] += wp * lam * cx; s.py[id] += wp * lam * cy;
    if (wa) { s.px[ia] -= wa * ta * lam * cx; s.py[ia] -= wa * ta * lam * cy; }
    if (wb) { s.px[ib] -= wb * tb * lam * cx; s.py[ib] -= wb * tb * lam * cy; }
    return { nx: nx, ny: ny };
  };

  Sim.prototype._drive = function(h) {
    var s = this, V = s.V;
    for (var q = 0; q < 2; q++) {
      var c = s.veh.contact[q];
      if (!c) continue;
      var id = s.wheels[q];
      var tx = c.ny, ty = -c.nx;                      // tangent pointing +x
      if (tx < 0) { tx = -tx; ty = -ty; }
      var vt = s.vx[id] * tx + s.vy[id] * ty;
      var target = s.state === 'fail' ? 0 : V.speed;
      var dv = target - vt, lim = 3.2 * h;
      if (dv > lim) dv = lim; else if (dv < -lim * 2) dv = -lim * 2;
      s.vx[id] += dv * tx; s.vy[id] += dv * ty;
    }
  };

  Sim.prototype._break = function(k) {
    var s = this, m = s.members[k];
    m.broken = true;
    s.breaks++;
    var ax = s.px[m.a], ay = s.py[m.a], bx = s.px[m.b], by = s.py[m.b];
    var mx = (ax + bx) / 2, my = (ay + by) / 2;
    var ux = (bx - ax), uy = (by - ay), ul = Math.sqrt(ux * ux + uy * uy) || 1;
    ux /= ul; uy /= ul;
    var gap = Math.min(0.08, m.L0 * 0.03);
    var vxm = (s.vx[m.a] + s.vx[m.b]) / 2, vym = (s.vy[m.a] + s.vy[m.b]) / 2;
    var pm = Math.max(4, m.L0 * m.mat.density * 0.25);
    var self = this;
    function addP(x, y) {
      var i = self.px.length;
      self.px.push(x); self.py.push(y); self.ox.push(x); self.oy.push(y);
      self.vx.push(vxm + (Math.random() - 0.5) * 0.6); self.vy.push(vym + Math.random() * 0.4);
      self.mass.push(pm); self.w.push(1 / pm); self.wet.push(false); self.kind.push('debris');
      return i;
    }
    var p1 = addP(mx - ux * gap, my - uy * gap);
    var p2 = addP(mx + ux * gap, my + uy * gap);
    var h1 = s._mkMember(m.a, p1, m.L0 / 2 - gap, m.mat, true);
    var h2 = s._mkMember(p2, m.b, m.L0 / 2 - gap, m.mat, true);
    h1.c = h2.c = 0; h1.from = h2.from = k;
    h1.f = h2.f = 0;
    h1.ratio = h2.ratio = 1;
    s.members.push(h1, h2);
    s.events.push({ type: 'break', x: mx, y: my, v: Math.abs(m.f), mat: m.mat.id });
  };

  Sim.prototype._judge = function() {
    var s = this, veh = s.veh;
    var yr = s.py[veh.wr], yf = s.py[veh.wf];
    var xr = s.px[veh.wr];
    if (s.state === 'run') {
      if (Math.min(yr, yf) < -1.6) { s.state = 'fail'; s.doneAt = s.t + 2.6; s.why = 'fell'; }
      else if (xr > s.level.span + 1.2) { s.state = 'success'; s.doneAt = s.t + 1.2; }
      else if (s.t > 45) { s.state = 'fail'; s.doneAt = s.t + 0.5; s.why = 'stuck'; }
    }
  };
  Sim.prototype.finished = function() { return this.state !== 'run' && this.t >= this.doneAt; };

  // Joint forces for the tap-to-inspect lesson: per member at joint j.
  Sim.prototype.jointForces = function(j) {
    var s = this, out = [];
    s.members.forEach(function(m) {
      if (m.broken || m.debris) return;
      if (m.a !== j && m.b !== j) return;
      var o = m.a === j ? m.b : m.a;
      out.push({ other: o, f: m.f, ratio: m.ratio, mat: m.mat.id });
    });
    return out;
  };

  // Run a whole test without drawing (unit tests / calibration).
  function simulate(level, members, maxT) {
    var sim = new Sim(level, members);
    var lim = maxT || 50;
    while (!sim.finished() && sim.t < lim) sim.step(FIXED_DT);
    var peak = 0;
    sim.members.forEach(function(m) { if (!m.debris) peak = Math.max(peak, m.ratio); });
    return { state: sim.state, t: sim.t, breaks: sim.breaks, cost: designCost(level, members), sim: sim };
  }

  var api = {
    Sim: Sim, simulate: simulate, designCost: designCost, designJoints: designJoints,
    encodeDesign: encodeDesign, decodeDesign: decodeDesign, jointAllowed: jointAllowed,
    memberAllowed: memberAllowed, rockAt: rockAt, memLen: memLen, memberKey: memberKey
  };

  //@@UI@@

  return api;
})();
