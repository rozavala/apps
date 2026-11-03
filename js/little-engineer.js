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

  if (typeof document === 'undefined' || !D) return api;

  var A = LittleEngineerArt;
  var STORE_PREFIX = 'zs_engineer_';

  // ================================================================
  //  STORAGE
  // ================================================================
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    return getUserAppKey(STORE_PREFIX);
  }
  function _load() {
    var key = _key(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object') d = {};
    d.v = 1;
    if (!d.levels || typeof d.levels !== 'object') d.levels = {};
    if (!d.designs || typeof d.designs !== 'object') d.designs = {};
    if (d.realBuild === undefined) d.realBuild = null;
    return d;
  }
  function _save(data) {
    var key = _key();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) { try { CloudSync.push(key); } catch (e) {} }
  }
  // The star rule (mirrors the APP_STAR_CONFIGS entry): 0–3 per level + 1 for the real build.
  function starsOf(d) {
    var n = 0, L = (d && d.levels) || {};
    for (var k in L) n += Math.min(3, Math.max(0, (L[k] && L[k].stars) | 0));
    return n + (d && d.realBuild ? 1 : 0);
  }
  api.starsOf = starsOf;

  var _designTimer = null;
  function _saveDesignSoon() {
    if (_designTimer) clearTimeout(_designTimer);
    _designTimer = setTimeout(function() {
      _designTimer = null;
      if (!S.level) return;
      var d = _load();
      d.designs[S.level.id] = encodeDesign(S.members);
      _save(d);
    }, 900);
  }

  // ================================================================
  //  HELPERS
  // ================================================================
  function $(id) { return document.getElementById(id); }
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function clp(n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function sfx(name) { if (typeof SFX !== 'undefined' && SFX[name]) { try { SFX[name](); } catch (e) {} } }
  function toast(msg) { if (typeof ZsDialog !== 'undefined') ZsDialog.toast(msg, 2600); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function tier() { var u = user(); return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate'; }
  function young() { var t = tier(); return t === 'beginner' || t === 'intermediate'; }
  function starStr(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆'; return s; }
  function levelIndex(id) { for (var i = 0; i < D.LEVELS.length; i++) if (D.LEVELS[i].id === id) return i; return -1; }
  var VEH_ICON = { car: '🚗', pickup: '🛻', bus: '🚌', truck: '🚛' };

  // Small synthesized effects (crack, splash) — Web Audio, no files.
  var _ac = null;
  function _audio() {
    if (_ac) return _ac;
    try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _ac = null; }
    return _ac;
  }
  function noiseHit(dur, freq, q, vol, type) {
    var ac = _audio();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume();
      var len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, type === 'splash' ? 1.6 : 4);
      var src = ac.createBufferSource(); src.buffer = buf;
      var f = ac.createBiquadFilter(); f.type = type === 'splash' ? 'lowpass' : 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      var gn = ac.createGain(); gn.gain.value = vol;
      src.connect(f); f.connect(gn); gn.connect(ac.destination);
      src.start();
    } catch (e) {}
  }
  function crackSound(mat) { noiseHit(0.18, mat === 'wood' ? 1400 : mat === 'cable' ? 3200 : 2200, 1.2, 0.5, 'crack'); }
  function splashSound(big) { noiseHit(big ? 0.9 : 0.45, big ? 700 : 1100, 0.7, big ? 0.55 : 0.3, 'splash'); }

  // ================================================================
  //  STATE
  // ================================================================
  var S = {
    screen: 'home', level: null, members: [], undo: [], tool: 'road', mode: 'build',
    sim: null, drops: [], showHint: false, tipHidden: false, view: 'stress', paused: false, slow: false,
    selJoint: -1, sel: null, drag: null, hover: null, pointers: {}, pinch: null,
    zoom: 1, cx: 0, cy: 0, W: 0, H: 0, dpr: 1, cacheKey: '', back: null, front: null, scene: null,
    raf: 0, last: 0, acc: 0, t: 0, shake: 0, resultShown: false, startCost: 0
  };

  function _root() { return $('le-wrap'); }
  function _stop() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }

  // ================================================================
  //  HOME
  // ================================================================
  function home() {
    _stop();
    S.screen = 'home';
    var d = _load();
    var total = starsOf(d), max = D.LEVELS.length * 3 + 1;
    var done = 0;
    D.LEVELS.forEach(function(l) { if (d.levels[l.id] && d.levels[l.id].stars > 0) done++; });
    _root().innerHTML =
      '<div class="le-home">' +
        '<header class="le-header">' +
          '<h1>Little Engineer <span aria-hidden="true">🌉</span></h1>' +
          '<p class="le-sub">Pequeño Ingeniero · design bridges, then test them with real physics.</p>' +
        '</header>' +
        '<div class="le-hero"><canvas id="le-hero" aria-label="A truss bridge over a river gorge in the Andes" role="img"></canvas>' +
          '<div class="le-hero-stat"><b>' + total + '</b> / ' + max + ' ★ · ' + done + ' of ' + D.LEVELS.length + ' bridges built</div></div>' +
        '<div class="le-home-grid">' +
          '<button type="button" class="le-home-card le-c-build" data-go="levels">' +
            '<span class="le-home-icon" aria-hidden="true">🏗️</span><span class="le-home-name">Build bridges</span>' +
            '<span class="le-home-desc">12 gorges and rivers across Chile. Cars, pickups, a bus and a log truck must cross!</span></button>' +
          '<button type="button" class="le-home-card le-c-learn" data-go="learn">' +
            '<span class="le-home-icon" aria-hidden="true">📐</span><span class="le-home-name">Bridge school</span>' +
            '<span class="le-home-desc">Triangles, pulling vs squeezing, trusses, arches, suspension bridges and famous bridges.</span></button>' +
          '<button type="button" class="le-home-card le-c-real" data-go="real">' +
            '<span class="le-home-icon" aria-hidden="true">🍝</span><span class="le-home-name">Build it for real</span>' +
            '<span class="le-home-desc">The spaghetti-and-marshmallow bridge challenge.' + (d.realBuild ? ' ✅ Done!' : ' A parent marks it done.') + '</span></button>' +
        '</div>' +
      '</div>';
    _root().querySelectorAll('[data-go]').forEach(function(b) {
      b.addEventListener('click', function() { sfx('click'); var g = b.getAttribute('data-go'); if (g === 'levels') levels(); else if (g === 'learn') learn(); else realBuild(); });
    });
    requestAnimationFrame(function() { _drawHero($('le-hero')); });
  }

  function _drawHero(cv) {
    if (!cv) return;
    var lv = Object.assign({}, D.LEVELS[4], { id: 'hero', water: -4.6, anchors: [[0, 0], [12, 0]], time: 'morning' });
    var g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sc = A.buildScene(lv);
    var xm = -5, xM = lv.span + 5, ym = lv.water - 1.0, top = 3.6;
    var s = Math.min(W / (xM - xm), H / (top - ym));
    var cam = { s: s, ox: W / 2 - (xm + xM) / 2 * s, oy: H / 2 + (top + ym) / 2 * s };
    A.drawBack(g, sc, cam, W, H);
    A.drawSky(g, sc, cam, W, H, 5);
    A.drawWater(g, sc, cam, W, H, 1);
    A.drawFront(g, sc, cam, W, H);
    var mem = lv.hint;
    mem.forEach(function(m) { if (m[4] === 'road') A.drawMember(g, cam, m[0], m[1], m[2], m[3], m[4]); });
    var V = D.VEHICLES.pickup;
    A.drawVehicle(g, cam, 'pickup', { V: V, cx: 5.2, cy: V.r + V.rideH, ang: 0, wheels: [{ x: 5.2 - V.wheelbase / 2, y: V.r, rot: 0 }, { x: 5.2 + V.wheelbase / 2, y: V.r, rot: 0.6 }] });
    mem.forEach(function(m) { if (m[4] !== 'road') A.drawMember(g, cam, m[0], m[1], m[2], m[3], m[4]); });
    designJoints(lv, mem).forEach(function(j) { A.drawJoint(g, cam, j.x, j.y, j.anchor ? 'anchor' : 'joint'); });
  }

  // ================================================================
  //  LEVEL SELECT
  // ================================================================
  function levels() {
    _stop();
    S.screen = 'levels';
    var d = _load();
    var next = -1;
    D.LEVELS.forEach(function(l, i) { if (next < 0 && !(d.levels[l.id] && d.levels[l.id].stars > 0)) next = i; });
    var cards = D.LEVELS.map(function(l, i) {
      var rec = d.levels[l.id] || {};
      var V = D.VEHICLES[l.vehicle];
      var extra = l.pillars ? ' · pillar' : l.tower ? ' · tower' : l.clear ? ' · boat lane' : '';
      return '<button type="button" class="le-lvl' + (i === next ? ' next' : '') + (rec.stars ? ' done' : '') + '" data-lvl="' + l.id + '">' +
        '<span class="le-lvl-art"><canvas data-thumb="' + l.id + '" aria-hidden="true"></canvas><span class="le-lvl-num">' + (i + 1) + '</span>' +
          (i === next ? '<span class="le-lvl-next">Next</span>' : '') + '</span>' +
        '<span class="le-lvl-body"><span class="le-lvl-name">' + esc(l.name) + '</span>' +
          '<span class="le-lvl-es">' + esc(l.es) + '</span>' +
          '<span class="le-lvl-meta">' + l.span + ' m · ' + VEH_ICON[l.vehicle] + ' ' + esc(V.name) + extra + '</span>' +
          '<span class="le-lvl-stars" aria-label="' + (rec.stars || 0) + ' of 3 stars">' + starStr(rec.stars || 0) + '</span>' +
          (rec.best ? '<span class="le-lvl-best">Best ' + clp(rec.best) + '</span>' : '<span class="le-lvl-best">Budget ' + clp(l.budget) + '</span>') +
        '</span></button>';
    }).join('');
    _root().innerHTML =
      '<div class="le-page">' +
        _topBar('Choose a gorge · Elige un desafío') +
        '<p class="le-lead">★ the vehicle crosses · ★★ under budget · ★★★ under the tight budget. ' +
          (young() ? 'Easy levels start with part of the bridge built for you.' : 'Try any level — later ones carry heavier loads.') + '</p>' +
        '<div class="le-lvl-grid">' + cards + '</div>' +
      '</div>';
    _bindTop();
    _root().querySelectorAll('[data-lvl]').forEach(function(b) {
      b.addEventListener('click', function() { sfx('click'); play(b.getAttribute('data-lvl')); });
    });
    var thumbs = Array.prototype.slice.call(_root().querySelectorAll('[data-thumb]'));
    (function drawNext() {
      var cv = thumbs.shift();
      if (!cv || S.screen !== 'levels') return;
      var lv = D.LEVELS[levelIndex(cv.getAttribute('data-thumb'))];
      try { A.levelThumb(cv, lv); } catch (e) {}
      requestAnimationFrame(drawNext);
    })();
  }

  function _topBar(label, back) {
    return '<div class="le-top"><button type="button" class="le-backbtn" data-back="' + (back || 'home') + '" aria-label="Back">←</button>' +
      '<span class="le-top-label">' + label + '</span></div>';
  }
  function _bindTop() {
    _root().querySelectorAll('[data-back]').forEach(function(b) {
      b.addEventListener('click', function() {
        sfx('click');
        var t = b.getAttribute('data-back');
        if (t === 'levels') levels(); else if (t === 'learn') learn(); else home();
      });
    });
  }

  // ================================================================
  //  PLAY SCREEN
  // ================================================================
  function _availableMats(level) {
    if (!young()) return D.MATERIAL_ORDER.slice();
    var i = levelIndex(level.id);
    var mats = ['road', 'wood'];
    if (i >= 3 || level.hint.some(function(m) { return m[4] === 'steel'; })) mats.push('steel');
    if (i >= 5 || level.hint.some(function(m) { return m[4] === 'cable'; })) mats.push('cable');
    return mats;
  }

  function play(id) {
    _stop();
    var level = D.LEVELS[levelIndex(id)];
    if (!level) return levels();
    S.screen = 'play';
    S.level = level;
    S.mode = 'build';
    S.sim = null; S.drops = []; S.undo = []; S.sel = null; S.drag = null; S.selJoint = -1;
    S.zoom = 1; S.cacheKey = ''; S.resultShown = false; S.paused = false; S.slow = false; S.view = 'stress';
    S.scene = A.buildScene(level);
    var d = _load();
    var saved = decodeDesign(d.designs[level.id]);
    S.members = saved.length ? saved : (young() && level.preset ? level.preset.map(function(m) { return m.slice(); }) : []);
    S.showHint = young();
    S.tipHidden = false;
    S.tool = 'road';
    var mats = _availableMats(level);
    var idx = levelIndex(id);
    var V = D.VEHICLES[level.vehicle];
    var rec = d.levels[level.id] || {};
    var p2 = Math.min(100, level.budget / (level.budget * 1.25) * 100), p3 = level.tight / (level.budget * 1.25) * 100;

    _root().innerHTML =
      '<div class="le-play">' +
        '<div class="le-bar">' +
          '<button type="button" class="le-backbtn" id="le-back" aria-label="Back to levels">←</button>' +
          '<div class="le-title"><b>' + (idx + 1) + ' · ' + esc(level.name) + '</b>' +
            '<span>' + esc(level.es) + ' · ' + level.span + ' m · ' + VEH_ICON[level.vehicle] + ' ' + esc(V.name) + ' (' + (V.mass / 1000).toLocaleString('en') + ' t)' +
            (rec.stars ? ' · <span class="le-gold">' + starStr(rec.stars) + '</span>' : '') + '</span></div>' +
          '<div class="le-budget" aria-live="polite">' +
            '<div class="le-budget-top"><span id="le-cost">$0</span><span class="le-budget-of">of ' + clp(level.budget) + '</span></div>' +
            '<div class="le-meter"><i id="le-meter-fill"></i><b class="t3" style="left:' + p3 + '%" title="3 stars"></b><b class="t2" style="left:' + p2 + '%" title="2 stars"></b></div>' +
            '<div class="le-budget-key">★★★ ≤ ' + clp(level.tight) + ' · ★★ ≤ ' + clp(level.budget) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="le-stage" id="le-stage">' +
          '<canvas id="le-canvas" role="img" aria-label="Bridge building area. Drag from point to point to place a piece."></canvas>' +
          '<div class="le-tip" id="le-tip"><span>💡 ' + esc(level.tip) + '</span><button type="button" id="le-tip-x" aria-label="Hide tip">×</button></div>' +
          '<div class="le-zoom" id="le-zoom">' +
            '<button type="button" data-z="in" aria-label="Zoom in">+</button>' +
            '<button type="button" data-z="out" aria-label="Zoom out">−</button>' +
            '<button type="button" data-z="fit" aria-label="Fit the whole gorge">⤢</button>' +
          '</div>' +
          '<div class="le-testhud" id="le-testhud" hidden>' +
            '<button type="button" id="le-edit" class="le-hud-main">✏️ Edit</button>' +
            '<button type="button" id="le-pause" aria-label="Pause">⏸</button>' +
            '<button type="button" id="le-slow" aria-label="Slow motion" aria-pressed="false">🐢</button>' +
            '<div class="le-seg" role="group" aria-label="Colour the bridge by">' +
              '<button type="button" data-view="stress" class="on">Stress</button>' +
              '<button type="button" data-view="force">Pull / Squeeze</button>' +
            '</div>' +
          '</div>' +
          '<div class="le-legend" id="le-legend" hidden></div>' +
          '<div class="le-jinfo" id="le-jinfo" hidden></div>' +
          '<div class="le-chain" id="le-chain" hidden></div>' +
          '<div class="le-result" id="le-result" hidden></div>' +
        '</div>' +
        '<div class="le-tools" id="le-tools">' +
          '<div class="le-mats" role="group" aria-label="Building materials">' +
            mats.map(function(m) {
              var M = D.MATERIALS[m];
              return '<button type="button" class="le-mat" data-mat="' + m + '" aria-pressed="false">' + A.materialIcon(m) +
                '<span class="le-mat-name">' + esc(M.name.replace(' beam', '').replace('Road deck', 'Road')) + '</span><span class="le-mat-cost">' + clp(M.cost) + '/m</span></button>';
            }).join('') +
            '<button type="button" class="le-mat le-erase" data-mat="erase" aria-pressed="false">' + A.materialIcon('erase') + '<span class="le-mat-name">Delete</span><span class="le-mat-cost">tap / swipe</span></button>' +
          '</div>' +
          '<div class="le-acts">' +
            '<button type="button" class="le-act" id="le-undo" aria-label="Undo">↶<span>Undo</span></button>' +
            '<button type="button" class="le-act" id="le-clear" aria-label="Clear the bridge">🗑<span>Clear</span></button>' +
            '<button type="button" class="le-act" id="le-hint" aria-pressed="false" aria-label="Show a hint bridge">💡<span>Hint</span></button>' +
            '<button type="button" class="le-go" id="le-test">▶ Test<span>' + VEH_ICON[level.vehicle] + '</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="le-matinfo" id="le-matinfo"></div>' +
      '</div>';

    $('le-back').addEventListener('click', function() { sfx('click'); levels(); });
    $('le-tip-x').addEventListener('click', function() { S.tipHidden = true; $('le-tip').hidden = true; });
    _root().querySelectorAll('[data-mat]').forEach(function(b) {
      b.addEventListener('click', function() { sfx('click'); _setTool(b.getAttribute('data-mat')); });
    });
    _root().querySelectorAll('[data-z]').forEach(function(b) {
      b.addEventListener('click', function() { var z = b.getAttribute('data-z'); _zoomBy(z === 'in' ? 1.35 : z === 'out' ? 1 / 1.35 : 0); });
    });
    $('le-undo').addEventListener('click', undo);
    $('le-clear').addEventListener('click', clearAll);
    $('le-hint').addEventListener('click', function() { S.showHint = !S.showHint; sfx('click'); _syncTools(); });
    $('le-test').addEventListener('click', startTest);
    $('le-edit').addEventListener('click', stopTest);
    $('le-pause').addEventListener('click', function() { S.paused = !S.paused; this.textContent = S.paused ? '▶' : '⏸'; this.setAttribute('aria-label', S.paused ? 'Resume' : 'Pause'); });
    $('le-slow').addEventListener('click', function() { S.slow = !S.slow; this.classList.toggle('on', S.slow); this.setAttribute('aria-pressed', S.slow ? 'true' : 'false'); });
    _root().querySelectorAll('[data-view]').forEach(function(b) {
      b.addEventListener('click', function() {
        S.view = b.getAttribute('data-view');
        _root().querySelectorAll('[data-view]').forEach(function(o) { o.classList.toggle('on', o === b); });
        _legend();
      });
    });

    var cv = $('le-canvas');
    cv.addEventListener('pointerdown', _onDown);
    cv.addEventListener('pointermove', _onMove);
    cv.addEventListener('pointerup', _onUp);
    cv.addEventListener('pointercancel', _onCancel);
    cv.addEventListener('pointerleave', function() { S.hover = null; });
    cv.addEventListener('wheel', _onWheel, { passive: false });
    cv.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    _setTool('road');
    _resize();
    _updateCost();
    S.last = 0;
    S.raf = requestAnimationFrame(_frame);
  }

  function _setTool(t) {
    S.tool = t;
    S.sel = null;
    _syncTools();
  }
  function _syncTools() {
    _root().querySelectorAll('[data-mat]').forEach(function(b) {
      var on = b.getAttribute('data-mat') === S.tool;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var h = $('le-hint');
    if (h) { h.classList.toggle('on', S.showHint); h.setAttribute('aria-pressed', S.showHint ? 'true' : 'false'); }
    var info = $('le-matinfo');
    if (info) {
      if (S.tool === 'erase') info.innerHTML = '<b>Delete</b> — tap a piece or a joint to remove it, or swipe across pieces.';
      else {
        var M = D.MATERIALS[S.tool];
        info.innerHTML = '<b>' + esc(M.name) + '</b> · ' + esc(M.es) + ' — ' + clp(M.cost) + ' per metre · up to ' + M.maxLen + ' m long. ' + esc(M.note) +
          ' <span class="le-howto">Drag from a dot to a dot, or tap one point then another.</span>';
      }
    }
    var tip = $('le-tip');
    if (tip) tip.hidden = S.tipHidden || S.mode === 'test';
    _chainNote();
  }
  function _chainNote() {
    var el = $('le-chain');
    if (!el) return;
    if (S.sel && S.mode === 'build' && S.tool !== 'erase') {
      el.hidden = false;
      el.innerHTML = 'Tap another point to connect · tap the glowing point to stop';
    } else el.hidden = true;
  }

  // ---- camera / sizing ---------------------------------------------------
  function _view0() {
    var lv = S.level;
    var top = 4.5;
    if (lv.tower) top = Math.max(top, lv.tower.top + 1.4);
    (S.showHint ? lv.hint : []).concat(S.members).forEach(function(m) { top = Math.max(top, m[1] + 1.5, m[3] + 1.5); });
    top = Math.min(top, 11.5);
    return { xm: -3.2, xM: lv.span + 3.2, ym: lv.water - 1.7, top: top };
  }
  function _resize() {
    var stage = $('le-stage');
    if (!stage || !S.level) return;
    var W = stage.clientWidth;
    var v = _view0();
    S.v0 = v;
    var ideal = W * (v.top - v.ym) / (v.xM - v.xm);
    var maxH = Math.max(280, Math.min(window.innerHeight * 0.64, 660));
    var H = Math.round(Math.max(270, Math.min(maxH, ideal * 1.04)));
    stage.style.height = H + 'px';
    var cv = $('le-canvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    S.W = W; S.H = H; S.dpr = dpr;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    if (S.zoom === 1) { S.cx = (v.xm + v.xM) / 2; S.cy = (v.ym + v.top) / 2; }
    S.cacheKey = '';
  }
  function _cam() {
    var v = S.v0;
    var s0 = Math.min(S.W / (v.xM - v.xm), S.H / (v.top - v.ym));
    var s = s0 * S.zoom;
    var hw = S.W / 2 / s, hh = S.H / 2 / s;
    // keep the gorge in view
    S.cx = Math.max(v.xm + Math.min(hw, (v.xM - v.xm) / 2), Math.min(v.xM - Math.min(hw, (v.xM - v.xm) / 2), S.cx));
    S.cy = Math.max(v.ym + Math.min(hh, (v.top - v.ym) / 2), Math.min(v.top - Math.min(hh, (v.top - v.ym) / 2), S.cy));
    if (S.zoom <= 1) { S.cx = (v.xm + v.xM) / 2; S.cy = (v.ym + v.top) / 2; }
    return { s: s, ox: S.W / 2 - S.cx * s, oy: S.H / 2 + S.cy * s };
  }
  function _zoomBy(f, px, py) {
    if (!S.level) return;
    if (f === 0) { S.zoom = 1; S.cacheKey = ''; return; }
    var cam = _cam();
    var sx = px == null ? S.W / 2 : px, sy = py == null ? S.H / 2 : py;
    var wx = (sx - cam.ox) / cam.s, wy = (cam.oy - sy) / cam.s;
    S.zoom = Math.max(1, Math.min(4, S.zoom * f));
    var s0 = Math.min(S.W / (S.v0.xM - S.v0.xm), S.H / (S.v0.top - S.v0.ym)) * S.zoom;
    // keep the world point under the cursor fixed
    S.cx = wx - (sx - S.W / 2) / s0;
    S.cy = wy + (sy - S.H / 2) / s0;
    S.cacheKey = '';
  }

  function _ensureCaches(cam) {
    var key = [S.W, S.H, S.dpr, cam.s.toFixed(3), cam.ox.toFixed(1), cam.oy.toFixed(1)].join('|');
    if (key === S.cacheKey && S.back) return;
    S.cacheKey = key;
    function mk(c) {
      c = c || document.createElement('canvas');
      c.width = Math.round(S.W * S.dpr); c.height = Math.round(S.H * S.dpr);
      var g = c.getContext('2d'); g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); g.clearRect(0, 0, S.W, S.H);
      return c;
    }
    S.back = mk(S.back); S.front = mk(S.front);
    A.drawBack(S.back.getContext('2d'), S.scene, cam, S.W, S.H);
    A.drawFront(S.front.getContext('2d'), S.scene, cam, S.W, S.H);
  }

  window.addEventListener('resize', function() {
    if (S.screen === 'play') { _resize(); }
  });

  // ---- cost ----------------------------------------------------------------
  function _updateCost() {
    if (!S.level) return;
    var c = designCost(S.level, S.members);
    var el = $('le-cost'), fill = $('le-meter-fill');
    if (!el) return;
    el.textContent = clp(c);
    var lv = S.level, max = lv.budget * 1.25;
    fill.style.width = Math.min(100, c / max * 100) + '%';
    var cls = c <= lv.tight ? 'g3' : c <= lv.budget ? 'g2' : 'over';
    fill.className = cls;
    el.className = cls;
  }

  // ---- editing --------------------------------------------------------------
  function _snapshot() {
    S.undo.push(S.members.map(function(m) { return m.slice(); }));
    if (S.undo.length > 60) S.undo.shift();
  }
  function _changed() { _updateCost(); _saveDesignSoon(); var v = _view0(); if (v.top > S.v0.top + 0.01) _resize(); }
  function undo() {
    if (S.mode !== 'build') return;
    if (!S.undo.length) { toast('Nothing to undo'); return; }
    S.members = S.undo.pop();
    S.sel = null;
    sfx('click');
    _changed(); _chainNote();
  }
  function clearAll() {
    if (S.mode !== 'build' || !S.members.length) return;
    ZsDialog.confirm({ title: 'Clear the bridge?', message: 'This removes every piece you placed. You can undo it.', confirmLabel: 'Clear', danger: true })
      .then(function(ok) {
        if (!ok) return;
        _snapshot();
        S.members = [];
        S.sel = null;
        _changed(); _chainNote();
      });
  }

  function _jointSet() {
    var set = {};
    designJoints(S.level, S.members).forEach(function(j) { set[ptKey(j.x, j.y)] = j; });
    return set;
  }
  function _gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }

  // Build the list of pieces for a segment from p to q, or {error}.
  function _plan(p, q, mat) {
    var lv = S.level, M = D.MATERIALS[mat];
    if (p.x === q.x && p.y === q.y) return { error: '' };
    if (!jointAllowed(lv, q.x, q.y) && !_jointSet()[ptKey(q.x, q.y)]) return { error: _whyNot(q) };
    if (!jointAllowed(lv, p.x, p.y) && !_jointSet()[ptKey(p.x, p.y)]) return { error: _whyNot(p) };
    // split at existing joints on the line
    var js = _jointSet(), pts = [p, q];
    var dx = q.x - p.x, dy = q.y - p.y, L2 = dx * dx + dy * dy;
    for (var k in js) {
      var j = js[k];
      if ((j.x === p.x && j.y === p.y) || (j.x === q.x && j.y === q.y)) continue;
      var cr = (j.x - p.x) * dy - (j.y - p.y) * dx;
      if (Math.abs(cr) > 1e-9) continue;
      var t = ((j.x - p.x) * dx + (j.y - p.y) * dy) / L2;
      if (t > 0 && t < 1) pts.push({ x: j.x, y: j.y, t: t });
    }
    pts[0].t = 0; pts[1].t = 1;
    pts.sort(function(a, b) { return a.t - b.t; });
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var sdx = b.x - a.x, sdy = b.y - a.y, len = Math.sqrt(sdx * sdx + sdy * sdy);
      var pieces = 1;
      if (len > M.maxLen + 1e-9) {
        var g = _gcd(sdx, sdy), found = 0;
        for (var n = 2; n <= g; n++) if (g % n === 0 && len / n <= M.maxLen + 1e-9) { found = n; break; }
        if (!found) return { error: 'Too long for ' + M.name.toLowerCase() + ' — the most is ' + M.maxLen + ' m. Add a joint in between.' };
        pieces = found;
      }
      for (var s = 0; s < pieces; s++) {
        var m = [a.x + sdx * s / pieces, a.y + sdy * s / pieces, a.x + sdx * (s + 1) / pieces, a.y + sdy * (s + 1) / pieces, mat];
        if (!memberAllowed(lv, m)) return { error: lv.clear && _crossesClear(m) ? 'Keep the boat lane clear — build above the road here.' : 'That piece would go through rock.' };
        for (var e = 0; e < 4; e += 2) {
          if (!jointAllowed(lv, m[e], m[e + 1]) && !js[ptKey(m[e], m[e + 1])]) return { error: _whyNot({ x: m[e], y: m[e + 1] }) };
        }
        out.push(m);
      }
    }
    return { pieces: out };
  }
  function _crossesClear(m) {
    var c = S.level.clear;
    for (var i = 1; i < 20; i++) {
      var t = i / 20, x = m[0] + (m[2] - m[0]) * t, y = m[1] + (m[3] - m[1]) * t;
      if (x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1) return true;
    }
    return false;
  }
  function _whyNot(p) {
    var lv = S.level;
    if (p.y <= lv.water + 0.5) return 'That spot is in the river — build higher.';
    if (lv.clear && p.x > lv.clear.x0 && p.x < lv.clear.x1 && p.y > lv.clear.y0 && p.y < lv.clear.y1) return 'Keep the boat lane clear — build above the road here.';
    if (p.y > 11 || p.x < -3 || p.x > lv.span + 3) return 'That is too far from the gorge.';
    return 'You can only fix pieces to the gold anchor bolts on the rock.';
  }
  // A new end point landing in the middle of an existing piece joins it:
  // that piece is split in two there (same material).
  function _splitThrough(x, y) {
    for (var i = 0; i < S.members.length; i++) {
      var m = S.members[i];
      if ((m[0] === x && m[1] === y) || (m[2] === x && m[3] === y)) continue;
      var dx = m[2] - m[0], dy = m[3] - m[1];
      if (Math.abs((x - m[0]) * dy - (y - m[1]) * dx) > 1e-9) continue;
      var t = ((x - m[0]) * dx + (y - m[1]) * dy) / (dx * dx + dy * dy);
      if (t <= 0 || t >= 1) continue;
      S.members.splice(i, 1, [m[0], m[1], x, y, m[4]], [x, y, m[2], m[3], m[4]]);
      return;
    }
  }
  function _addPieces(pieces) {
    _snapshot();
    pieces.forEach(function(m) { _splitThrough(m[0], m[1]); _splitThrough(m[2], m[3]); });
    var byKey = {};
    S.members.forEach(function(m, i) { byKey[memberKey(m)] = i; });
    pieces.forEach(function(m) {
      var k = memberKey(m);
      if (byKey[k] != null) S.members[byKey[k]] = m;
      else { byKey[k] = S.members.length; S.members.push(m); }
    });
    sfx('click');
    _changed();
  }
  function _eraseAt(wx, wy, cam, allowJoint) {
    var tolJ = Math.max(0.45, 20 / cam.s), tolM = Math.max(0.3, 14 / cam.s);
    if (allowJoint) {
      var best = null, bd = tolJ;
      designJoints(S.level, S.members).forEach(function(j) {
        if (j.anchor) return;
        var d = Math.hypot(j.x - wx, j.y - wy);
        if (d < bd) { bd = d; best = j; }
      });
      if (best) {
        _snapshot();
        S.members = S.members.filter(function(m) { return !((m[0] === best.x && m[1] === best.y) || (m[2] === best.x && m[3] === best.y)); });
        sfx('click'); _changed();
        return true;
      }
    }
    var bi = -1, bm = tolM;
    S.members.forEach(function(m, i) {
      var d = _segDist(wx, wy, m[0], m[1], m[2], m[3]);
      if (d < bm) { bm = d; bi = i; }
    });
    if (bi >= 0) {
      if (allowJoint !== 'nosnap') _snapshot();
      S.members.splice(bi, 1);
      sfx('click'); _changed();
      return true;
    }
    return false;
  }
  function _segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    var t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  // ---- pointer input ---------------------------------------------------------
  function _pos(e) {
    var r = $('le-canvas').getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function _toWorld(p, cam) { return { x: (p.x - cam.ox) / cam.s, y: (cam.oy - p.y) / cam.s }; }
  function _snap(p, cam) {
    var w = _toWorld(p, cam);
    // prefer an existing joint near the finger
    var tol = Math.max(0.5, 22 / cam.s), best = null, bd = tol;
    designJoints(S.level, S.members).forEach(function(j) {
      var d = Math.hypot(j.x - w.x, j.y - w.y);
      if (d < bd) { bd = d; best = j; }
    });
    if (best) return { x: best.x, y: best.y };
    return { x: Math.round(w.x), y: Math.round(w.y) };
  }

  function _onDown(e) {
    e.preventDefault();
    var cv = $('le-canvas');
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    var p = _pos(e);
    S.pointers[e.pointerId] = p;
    var ids = Object.keys(S.pointers);
    var cam = _cam();
    if (ids.length === 2) {
      // two fingers: pinch zoom + pan; cancel any drag in progress
      S.drag = null;
      var a = S.pointers[ids[0]], b = S.pointers[ids[1]];
      S.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: S.zoom, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, w: _toWorld({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, cam) };
      return;
    }
    if (ids.length > 2) return;
    var pan = e.button === 1 || e.button === 2 || e.shiftKey || S.mode === 'test';
    S.drag = { id: e.pointerId, start: p, moved: false, pan: pan, from: S.mode === 'build' ? _snap(p, cam) : null, to: null, erased: false, cx: S.cx, cy: S.cy };
  }
  function _onMove(e) {
    var p = _pos(e);
    var cam = _cam();
    if (S.pointers[e.pointerId]) S.pointers[e.pointerId] = p;
    if (S.pinch) {
      var ids = Object.keys(S.pointers);
      if (ids.length < 2) return;
      var a = S.pointers[ids[0]], b = S.pointers[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      S.zoom = Math.max(1, Math.min(4, S.pinch.z0 * d / S.pinch.d0));
      var mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      var s0 = Math.min(S.W / (S.v0.xM - S.v0.xm), S.H / (S.v0.top - S.v0.ym)) * S.zoom;
      S.cx = S.pinch.w.x - (mid.x - S.W / 2) / s0;
      S.cy = S.pinch.w.y + (mid.y - S.H / 2) / s0;
      return;
    }
    if (!S.drag || S.drag.id !== e.pointerId) {
      if (e.pointerType === 'mouse' && S.mode === 'build') S.hover = _snap(p, cam);
      return;
    }
    var dr = S.drag;
    if (!dr.moved && Math.hypot(p.x - dr.start.x, p.y - dr.start.y) > 8) dr.moved = true;
    if (!dr.moved) return;
    if (dr.pan) {
      if (S.zoom > 1) {
        S.cx = dr.cx - (p.x - dr.start.x) / cam.s;
        S.cy = dr.cy + (p.y - dr.start.y) / cam.s;
      }
      return;
    }
    if (S.tool === 'erase') {
      var w = _toWorld(p, cam);
      if (!dr.erased) { _snapshot(); dr.erased = true; }
      _eraseAt(w.x, w.y, cam, 'nosnap');
      return;
    }
    dr.to = _snap(p, cam);
    S.hover = dr.to;
  }
  function _onUp(e) {
    var p = _pos(e);
    delete S.pointers[e.pointerId];
    if (S.pinch) {
      if (Object.keys(S.pointers).length < 2) S.pinch = null;
      S.drag = null;
      return;
    }
    var dr = S.drag;
    S.drag = null;
    if (!dr || dr.id !== e.pointerId) return;
    var cam = _cam();
    if (S.mode === 'test') { if (!dr.moved) _testTap(p, cam); return; }
    if (dr.pan) return;
    if (S.tool === 'erase') {
      if (!dr.moved) { var w = _toWorld(p, cam); if (!_eraseAt(w.x, w.y, cam, true)) toast('Tap right on a piece or a joint to delete it.'); }
      return;
    }
    var mat = S.tool;
    if (dr.moved && dr.to) {
      var plan = _plan(dr.from, dr.to, mat);
      if (plan.error) { if (plan.error) { toast(plan.error); sfx('wrong'); } }
      else { _addPieces(plan.pieces); S.sel = null; }
      _chainNote();
      return;
    }
    // a tap: select a start point, or connect from the selected one
    var q = dr.from;
    if (S.sel) {
      if (S.sel.x === q.x && S.sel.y === q.y) { S.sel = null; _chainNote(); return; }
      var plan2 = _plan(S.sel, q, mat);
      if (plan2.error) { toast(plan2.error); sfx('wrong'); return; }
      _addPieces(plan2.pieces);
      S.sel = q;
    } else {
      if (!jointAllowed(S.level, q.x, q.y) && !_jointSet()[ptKey(q.x, q.y)]) { toast(_whyNot(q)); return; }
      S.sel = q;
      sfx('click');
    }
    _chainNote();
  }
  function _onCancel(e) {
    delete S.pointers[e.pointerId];
    if (Object.keys(S.pointers).length < 2) S.pinch = null;
    S.drag = null;
  }
  function _onWheel(e) {
    e.preventDefault();
    var p = _pos(e);
    _zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y);
  }

  document.addEventListener('keydown', function(e) {
    if (S.screen !== 'play' || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    if (document.querySelector('.zsd-overlay')) return;
    var k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); undo(); return; }
    if (S.mode === 'build') {
      var mats = _availableMats(S.level);
      if (k >= '1' && k <= '4' && mats[+k - 1]) _setTool(mats[+k - 1]);
      else if (k === 'e' || k === 'Delete') _setTool('erase');
      else if (k === 'Escape') { S.sel = null; _chainNote(); }
      else if (k === 't' || k === 'Enter') startTest();
    } else if (k === 'Escape') stopTest();
  });

  // ================================================================
  //  TEST RUN
  // ================================================================
  function _roadConnected() {
    var lv = S.level, adj = {};
    S.members.forEach(function(m) {
      if (m[4] !== 'road') return;
      var a = ptKey(m[0], m[1]), b = ptKey(m[2], m[3]);
      (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a);
    });
    var start = ptKey(0, 0), goal = ptKey(lv.span, 0), seen = {}, q = [start];
    seen[start] = 1;
    while (q.length) {
      var c = q.shift();
      if (c === goal) return true;
      (adj[c] || []).forEach(function(n) { if (!seen[n]) { seen[n] = 1; q.push(n); } });
    }
    return false;
  }

  function startTest() {
    if (S.mode !== 'build') return;
    if (!_roadConnected()) {
      toast('The ' + D.VEHICLES[S.level.vehicle].name.toLowerCase() + ' needs a road deck from one cliff to the other. Use the Road piece!');
      sfx('wrong');
      if (S.tool !== 'road' && _availableMats(S.level).indexOf('road') >= 0) _setTool('road');
      return;
    }
    _audio();
    sfx('click');
    S.mode = 'test';
    S.sel = null; S.drag = null; S.selJoint = -1;
    S.sim = new Sim(S.level, S.members.map(function(m) { return m.slice(); }));
    S.startCost = designCost(S.level, S.members);
    S.drops = [];
    S.acc = 0;
    S.resultShown = false;
    S.paused = false;
    var pb = $('le-pause'); if (pb) { pb.textContent = '⏸'; pb.setAttribute('aria-label', 'Pause'); }
    $('le-testhud').hidden = false;
    $('le-tools').classList.add('testing');
    $('le-result').hidden = true;
    $('le-jinfo').hidden = true;
    _syncTools();
    _legend();
  }
  function stopTest() {
    if (S.mode !== 'test') return;
    S.mode = 'build';
    S.sim = null; S.drops = []; S.selJoint = -1;
    $('le-testhud').hidden = true;
    $('le-tools').classList.remove('testing');
    $('le-result').hidden = true;
    $('le-jinfo').hidden = true;
    $('le-legend').hidden = true;
    _syncTools();
  }
  function _legend() {
    var el = $('le-legend');
    if (!el) return;
    el.hidden = S.mode !== 'test';
    el.innerHTML = S.view === 'stress'
      ? '<span class="le-grad"></span><span>relaxed</span><span>→</span><span>about to break</span>'
      : '<span class="le-dot pull"></span><span>pulled · tracción</span><span class="le-dot push"></span><span>squeezed · compresión</span>';
    if (S.mode === 'test') el.innerHTML += '<span class="le-legend-tip">Tap a joint to inspect it</span>';
  }

  function _testTap(p, cam) {
    var sim = S.sim;
    if (!sim) return;
    var best = -1, bd = Math.max(26, cam.s * 0.5);
    for (var i = 0; i < sim.jointCount; i++) {
      var d = Math.hypot(A.X(cam, sim.px[i]) - p.x, A.Y(cam, sim.py[i]) - p.y);
      if (d < bd) { bd = d; best = i; }
    }
    S.selJoint = best;
    _jointInfo();
    if (best >= 0) sfx('click');
  }
  function _jointInfo() {
    var el = $('le-jinfo'), sim = S.sim;
    if (!el) return;
    if (!sim || S.selJoint < 0) { el.hidden = true; return; }
    var fs = sim.jointForces(S.selJoint);
    var older = !young();
    var rows = fs.map(function(f) {
      var pull = f.f >= 0, kn = Math.abs(f.f) / 1000;
      return '<li class="' + (pull ? 'pull' : 'push') + '"><span class="le-dot ' + (pull ? 'pull' : 'push') + '"></span>' +
        esc(D.MATERIALS[f.mat].name) + ': <b>' + (kn < 0.5 ? 'relaxed' : pull ? 'pulled' : 'squeezed') + '</b>' +
        (older && kn >= 0.5 ? ' · ' + kn.toFixed(kn < 10 ? 1 : 0) + ' kN' : '') +
        (kn >= 0.5 ? ' · ' + Math.round(Math.min(1.5, f.ratio) * 100) + '% of its limit' : '') + '</li>';
    }).join('');
    el.hidden = false;
    el.innerHTML = '<div class="le-jinfo-h">' + (sim.kind[S.selJoint] === 'anchor' ? 'Anchor bolt' : 'Joint') +
      ' <button type="button" id="le-jx" aria-label="Close">×</button></div>' +
      (rows ? '<ul>' + rows + '</ul>' : '<p>No pieces attached any more.</p>') +
      '<p class="le-jinfo-k"><span class="le-dot pull"></span> blue = being pulled · <span class="le-dot push"></span> red = being squeezed</p>';
    $('le-jx').addEventListener('click', function() { S.selJoint = -1; el.hidden = true; });
  }

  function _processEvents() {
    var sim = S.sim;
    if (!sim || !sim.events.length) return;
    var evs = sim.events.splice(0, sim.events.length);
    var cracks = 0, splashes = 0;
    evs.forEach(function(ev) {
      if (ev.type === 'break') {
        if (cracks++ < 3) crackSound(ev.mat);
        S.shake = Math.max(S.shake, 0.25);
        var col = ev.mat === 'wood' ? '#c8935a' : ev.mat === 'road' ? '#9a9890' : '#cfd8e2';
        for (var i = 0; i < 10; i++) S.drops.push({ kind: 'chip', x: ev.x, y: ev.y, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4, life: 1.2, col: col });
      } else if (ev.type === 'splash') {
        if (splashes++ < 2) splashSound(ev.big);
        var n = Math.min(26, 6 + Math.round(ev.v * (ev.big ? 3 : 1.5)));
        for (var k = 0; k < n; k++) {
          var a = Math.PI * (0.15 + Math.random() * 0.7);
          var sp = (1.5 + Math.random() * 3) * Math.min(2.2, 0.4 + ev.v / 5);
          S.drops.push({ kind: 'drop', x: ev.x + (Math.random() - 0.5) * 0.4, y: ev.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 1.4, r: 0.04 + Math.random() * 0.07, life: 1 });
        }
        S.drops.push({ kind: 'ring', x: ev.x, y: ev.y, r: 0.2, vr: ev.big ? 2.2 : 1.3, life: 1.2 });
      }
    });
  }
  function _stepDrops(dt) {
    var water = S.level.water;
    S.drops = S.drops.filter(function(d) {
      d.life -= dt * (d.kind === 'ring' ? 0.8 : 0.9);
      if (d.kind === 'ring') { d.r += d.vr * dt; return d.life > 0; }
      d.vy -= 9.81 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.kind === 'drop' && d.y < water && d.vy < 0) return false;
      if (d.kind === 'chip' && d.y < water) { d.vx *= 0.9; d.vy = Math.max(d.vy, -0.5); }
      return d.life > 0;
    });
  }

  function _showResult() {
    var sim = S.sim, lv = S.level, el = $('le-result');
    if (!sim || !el) return;
    S.resultShown = true;
    var ok = sim.state === 'success';
    var cost = S.startCost;
    var stars = ok ? (cost <= lv.tight ? 3 : cost <= lv.budget ? 2 : 1) : 0;
    var V = D.VEHICLES[lv.vehicle];
    var d = _load();
    var rec = d.levels[lv.id] || { stars: 0 };
    var improved = false;
    if (ok) {
      if (stars > (rec.stars || 0)) { rec.stars = stars; improved = true; }
      if (!rec.best || cost < rec.best) rec.best = cost;
      rec.date = today();
      d.levels[lv.id] = rec;
      d.designs[lv.id] = encodeDesign(S.members);
      _save(d);
      if (typeof ActivityLog !== 'undefined') {
        try { ActivityLog.log('Little Engineer', '🌉', 'Bridge held at ' + lv.name + ' (' + lv.span + ' m, ' + V.name.toLowerCase() + ') — ' + stars + '★ for ' + clp(cost)); } catch (e) {}
      }
      if (stars === 3) sfx('cheer'); else sfx('correct');
      for (var s = 0; s < stars; s++) setTimeout(function() { sfx('star'); }, 450 + s * 260);
    } else sfx('wrong');

    var idx = levelIndex(lv.id), nxt = D.LEVELS[idx + 1];
    var redTip = sim.breaks > 0
      ? 'Press ✏️ Edit and look at where it broke. Make those pieces steel, make the triangles taller, or add another triangle.'
      : sim.why === 'stuck' ? 'The ' + V.name.toLowerCase() + ' got stuck. Is the road smooth from cliff to cliff?' : 'The road bent too much. Add triangles under or over it.';
    el.hidden = false;
    el.className = 'le-result ' + (ok ? 'win' : 'lose');
    el.innerHTML =
      '<div class="le-result-card" role="dialog" aria-label="Test result">' +
        (ok
          ? '<div class="le-result-icon" aria-hidden="true">🎉</div><h2>It held! · ¡Resistió!</h2>' +
            '<div class="le-result-stars" aria-label="' + stars + ' of 3 stars">' + [0, 1, 2].map(function(i) { return '<span class="' + (i < stars ? 'on' : '') + '" style="animation-delay:' + (0.3 + i * 0.26) + 's">★</span>'; }).join('') + '</div>' +
            '<ul class="le-result-list"><li class="y">✓ The ' + esc(V.name.toLowerCase()) + ' crossed</li>' +
              '<li class="' + (cost <= lv.budget ? 'y' : 'n') + '">' + (cost <= lv.budget ? '✓' : '✗') + ' Under budget (' + clp(lv.budget) + ')</li>' +
              '<li class="' + (cost <= lv.tight ? 'y' : 'n') + '">' + (cost <= lv.tight ? '✓' : '✗') + ' Under the tight budget (' + clp(lv.tight) + ')</li></ul>' +
            '<p class="le-result-cost">Your bridge cost <b>' + clp(cost) + '</b>' + (improved ? ' · new best stars!' : '') + '</p>'
          : '<div class="le-result-icon" aria-hidden="true">💥</div><h2>' + (sim.breaks ? 'The bridge broke!' : 'It did not make it') + '</h2>' +
            '<p class="le-result-why">' + esc(redTip) + '</p>' +
            '<p class="le-result-cost">Red = about to break. Blue/red in “Pull / Squeeze” shows how each piece is working.</p>') +
        '<div class="le-result-btns">' +
          '<button type="button" class="le-btn ghost" id="le-r-edit">✏️ ' + (ok ? 'Improve it' : 'Fix it') + '</button>' +
          (ok ? '' : '<button type="button" class="le-btn ghost" id="le-r-replay">↻ Watch again</button>') +
          (ok && nxt ? '<button type="button" class="le-btn primary" id="le-r-next">Next: ' + esc(nxt.name) + ' ▶</button>' : '') +
          (ok && !nxt ? '<button type="button" class="le-btn primary" id="le-r-levels">All levels</button>' : '') +
          (!ok && !S.showHint ? '<button type="button" class="le-btn primary" id="le-r-hint">💡 Show a hint</button>' : '') +
        '</div>' +
      '</div>';
    $('le-r-edit').addEventListener('click', stopTest);
    if ($('le-r-replay')) $('le-r-replay').addEventListener('click', function() { stopTest(); startTest(); });
    if ($('le-r-next')) $('le-r-next').addEventListener('click', function() { play(nxt.id); });
    if ($('le-r-levels')) $('le-r-levels').addEventListener('click', levels);
    if ($('le-r-hint')) $('le-r-hint').addEventListener('click', function() { S.showHint = true; stopTest(); _syncTools(); _resize(); });
  }

  // ================================================================
  //  FRAME
  // ================================================================
  function _frame(ts) {
    if (S.screen !== 'play') { S.raf = 0; return; }
    S.raf = requestAnimationFrame(_frame);
    var cv = $('le-canvas');
    if (!cv) return;
    var dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 1 / 60;
    S.last = ts;
    S.t += dt;

    // physics at a fixed timestep
    if (S.mode === 'test' && S.sim && !S.paused) {
      if (S.slow) S.sim.step(FIXED_DT * 0.3);
      else {
        S.acc += dt;
        var n = 0;
        while (S.acc >= FIXED_DT && n < 3) { S.sim.step(FIXED_DT); S.acc -= FIXED_DT; n++; }
        if (n === 3) S.acc = 0;
      }
      _processEvents();
      if (!S.resultShown && S.sim.finished()) _showResult();
      if (S.selJoint >= 0 && Math.floor(S.t * 6) !== Math.floor((S.t - dt) * 6)) _jointInfo();
    }
    if (S.mode === 'test' && !S.paused) _stepDrops(S.slow ? dt * 0.3 : dt);
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt);

    var g = cv.getContext('2d');
    var cam = _cam();
    _ensureCaches(cam);
    g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    if (S.shake > 0) {
      var a = S.shake * 10;
      g.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
    }
    g.drawImage(S.back, 0, 0, S.W, S.H);
    A.drawSky(g, S.scene, cam, S.W, S.H, S.t);
    A.drawWater(g, S.scene, cam, S.W, S.H, S.t);
    if (S.level.clear) {
      var bx = S.mode === 'test' && S.sim ? S.level.span / 2 - 6 + Math.min(12, S.sim.t * 0.9) : S.level.span / 2;
      A.drawBoat(g, cam, bx, S.level.water, S.t);
    }
    g.drawImage(S.front, 0, 0, S.W, S.H);
    if (S.mode === 'build') _drawBuild(g, cam); else _drawTest(g, cam);
  }

  function _drawBuild(g, cam) {
    var lv = S.level;
    A.drawBlueprint(g, S.scene, cam, S.W, S.H);
    // valid build dots near the pointer / selection
    var focus = (S.drag && S.drag.to) || S.hover || S.sel;
    if (focus) {
      for (var x = focus.x - 4; x <= focus.x + 4; x++) for (var y = focus.y - 4; y <= focus.y + 4; y++) {
        if (!jointAllowed(lv, x, y)) continue;
        var d = Math.hypot(x - focus.x, y - focus.y);
        if (d > 4.2) continue;
        g.fillStyle = 'rgba(220,240,255,' + (0.6 - d * 0.12) + ')';
        g.beginPath(); g.arc(A.X(cam, x), A.Y(cam, y), Math.max(1.5, cam.s * 0.06), 0, 6.283); g.fill();
      }
    }
    if (S.showHint) {
      var have = {};
      S.members.forEach(function(m) { have[memberKey(m)] = 1; });
      lv.hint.forEach(function(m) { if (!have[memberKey(m)]) A.drawMember(g, cam, m[0], m[1], m[2], m[3], m[4], { ghost: true, ghostMat: true }); });
    }
    S.members.forEach(function(m) { if (m[4] === 'road') A.drawMember(g, cam, m[0], m[1], m[2], m[3], m[4]); });
    S.members.forEach(function(m) { if (m[4] !== 'road') A.drawMember(g, cam, m[0], m[1], m[2], m[3], m[4]); });
    // preview of the piece being placed
    var from = S.drag && S.drag.moved && !S.drag.pan && S.tool !== 'erase' ? S.drag.from : null;
    var to = from ? S.drag.to : null;
    if (!from && S.sel && S.hover && S.tool !== 'erase') { from = S.sel; to = S.hover; }
    if (from && to && (from.x !== to.x || from.y !== to.y)) {
      var plan = _plan(from, to, S.tool);
      if (plan.error) A.drawMember(g, cam, from.x, from.y, to.x, to.y, S.tool, { bad: true });
      else plan.pieces.forEach(function(m) { A.drawMember(g, cam, m[0], m[1], m[2], m[3], m[4], { tintA: 0.35, tint: '#ffffff' }); });
      var L = Math.hypot(to.x - from.x, to.y - from.y);
      var label = (Math.round(L * 10) / 10) + ' m' + (plan.error ? ' ✗' : ' · ' + clp(L * D.MATERIALS[S.tool].cost));
      _label(g, (A.X(cam, from.x) + A.X(cam, to.x)) / 2, (A.Y(cam, from.y) + A.Y(cam, to.y)) / 2 - 18, label, plan.error ? '#b91c1c' : 'rgba(14,52,112,0.92)');
    }
    designJoints(lv, S.members).forEach(function(j) {
      var st = S.sel && S.sel.x === j.x && S.sel.y === j.y ? 'sel' : (S.hover && S.hover.x === j.x && S.hover.y === j.y ? 'hot' : '');
      A.drawJoint(g, cam, j.x, j.y, j.anchor ? 'anchor' : 'joint', st);
    });
    if (S.sel && !_jointSet()[ptKey(S.sel.x, S.sel.y)]) A.drawJoint(g, cam, S.sel.x, S.sel.y, 'joint', 'sel');
    // the vehicle waiting on the left cliff
    var V = D.VEHICLES[lv.vehicle];
    var fx = -2.2, rx = fx - V.wheelbase;
    A.drawVehicle(g, cam, lv.vehicle, { V: V, cx: (fx + rx) / 2, cy: V.r + V.rideH, ang: 0, wheels: [{ x: rx, y: V.r, rot: 0 }, { x: fx, y: V.r, rot: 0 }] });
  }

  function _label(g, x, y, text, bg) {
    g.font = '800 13px Nunito, system-ui, sans-serif';
    var w = g.measureText(text).width + 14;
    x = Math.max(w / 2 + 4, Math.min(S.W - w / 2 - 4, x));
    y = Math.max(14, y);
    g.fillStyle = bg;
    A.roundRect(g, x - w / 2, y - 11, w, 22, 9); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y + 1);
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
  }

  function _memberTint(m) {
    if (m.debris) return null;
    if (S.view === 'force') {
      var k = Math.min(1, m.ratio * 1.4);
      if (Math.abs(m.f) < 300) return { tint: '#94a3b8', tintA: 0.35 };
      return { tint: m.f >= 0 ? '#2563eb' : '#dc2626', tintA: 0.35 + k * 0.65 };
    }
    if (m.ratio < 0.06) return { tint: '#22c55e', tintA: 0.18 };
    return { tint: A.stressColor(m.ratio), tintA: Math.min(1, 0.62 + m.ratio * 0.5) };
  }

  function _drawTest(g, cam) {
    var sim = S.sim;
    if (!sim) return;
    var px = sim.px, py = sim.py;
    var road = [], rest = [];
    sim.members.forEach(function(m) { if (m.broken) return; (m.road ? road : rest).push(m); });
    road.forEach(function(m) { A.drawMember(g, cam, px[m.a], py[m.a], px[m.b], py[m.b], m.mat.id, _memberTint(m)); });
    // vehicle
    var v = sim.veh, V = sim.V;
    A.drawVehicle(g, cam, S.level.vehicle, {
      V: V, cx: (px[v.cr] + px[v.cf]) / 2, cy: (py[v.cr] + py[v.cf]) / 2,
      ang: Math.atan2(py[v.cf] - py[v.cr], px[v.cf] - px[v.cr]),
      wheels: [{ x: px[v.wr], y: py[v.wr], rot: -v.rot[0] }, { x: px[v.wf], y: py[v.wf], rot: -v.rot[1] }]
    });
    rest.forEach(function(m) { A.drawMember(g, cam, px[m.a], py[m.a], px[m.b], py[m.b], m.mat.id, _memberTint(m)); });
    for (var i = 0; i < sim.jointCount; i++) {
      var attached = sim.kind[i] === 'anchor';
      A.drawJoint(g, cam, px[i], py[i], attached ? 'anchor' : 'joint', i === S.selJoint ? 'sel' : '');
    }
    A.drawDrops(g, cam, S.drops);
    A.drawWaterVeil(g, S.scene, cam, S.W, S.H, S.t);
    if (S.selJoint >= 0) _drawJointArrows(g, cam);
  }

  function _drawJointArrows(g, cam) {
    var sim = S.sim, j = S.selJoint;
    var jx = sim.px[j], jy = sim.py[j];
    sim.jointForces(j).forEach(function(f) {
      if (Math.abs(f.f) < 500) return;
      var ox = sim.px[f.other] - jx, oy = sim.py[f.other] - jy, L = Math.hypot(ox, oy) || 1;
      ox /= L; oy /= L;
      var len = Math.min(L * 0.8, 0.5 + Math.min(1, f.ratio) * 1.1);
      var pull = f.f >= 0;
      var col = pull ? '#2563eb' : '#dc2626';
      // pulled: arrow from the joint along the piece; squeezed: arrow pushing into the joint
      var sx = pull ? jx + ox * 0.25 : jx + ox * (0.25 + len), sy = pull ? jy + oy * 0.25 : jy + oy * (0.25 + len);
      var ex = pull ? jx + ox * (0.25 + len) : jx + ox * 0.3, ey = pull ? jy + oy * (0.25 + len) : jy + oy * 0.3;
      _arrow(g, A.X(cam, sx), A.Y(cam, sy), A.X(cam, ex), A.Y(cam, ey), col, Math.max(3, cam.s * 0.09));
    });
  }
  function _arrow(g, x1, y1, x2, y2, col, w) {
    var a = Math.atan2(y2 - y1, x2 - x1), h = w * 2.6;
    g.strokeStyle = '#fff'; g.lineWidth = w + 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6); g.stroke();
    g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6); g.stroke();
    g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x2, y2);
    g.lineTo(x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h);
    g.lineTo(x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h);
    g.closePath(); g.fill(); g.stroke();
  }

  // ================================================================
  //  BRIDGE SCHOOL (lessons)
  // ================================================================
  function learn() {
    _stop();
    S.screen = 'learn';
    var cards = D.LESSONS.map(function(l) {
      return '<button type="button" class="le-lesson-card" data-lesson="' + l.id + '">' +
        '<span class="le-lesson-icon" aria-hidden="true">' + l.icon + '</span>' +
        '<span class="le-lesson-t">' + esc(l.title) + '</span><span class="le-lesson-es">' + esc(l.es) + '</span></button>';
    }).join('');
    _root().innerHTML =
      '<div class="le-page">' + _topBar('Bridge school · Escuela de puentes') +
        '<p class="le-lead">How bridges really work — the same ideas engineers use.</p>' +
        '<div class="le-lesson-grid">' + cards + '</div></div>';
    _bindTop();
    _root().querySelectorAll('[data-lesson]').forEach(function(b) {
      b.addEventListener('click', function() { sfx('click'); lesson(b.getAttribute('data-lesson')); });
    });
  }
  function lesson(id) {
    var l = null;
    D.LESSONS.forEach(function(x) { if (x.id === id) l = x; });
    if (!l) return learn();
    var i = D.LESSONS.indexOf(l), nxt = D.LESSONS[i + 1];
    var canSpeak = typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled;
    _root().innerHTML =
      '<div class="le-page">' + _topBar(esc(l.title), 'learn') +
        '<article class="le-lesson">' +
          '<h2>' + l.icon + ' ' + esc(l.title) + ' <small>· ' + esc(l.es) + '</small></h2>' +
          '<div class="le-lesson-art">' + A.lessonSvg(l.art) + '</div>' +
          (l.interactive === 'shear' ? '<button type="button" class="le-btn primary le-push-btn" id="le-push">👉 Push the corners!</button>' : '') +
          l.body.map(function(p) { return '<p>' + esc(p) + '</p>'; }).join('') +
          '<div class="le-lesson-btns">' +
            (canSpeak ? '<button type="button" class="le-btn ghost" id="le-say">🔊 Read aloud</button>' : '') +
            (nxt ? '<button type="button" class="le-btn primary" id="le-nextl">Next: ' + esc(nxt.title) + ' ▶</button>' : '<button type="button" class="le-btn primary" id="le-tolevels">Go build! 🏗️</button>') +
          '</div>' +
        '</article></div>';
    _bindTop();
    if ($('le-push')) $('le-push').addEventListener('click', function() {
      var art = _root().querySelector('.le-lesson-art');
      art.classList.remove('pushing'); void art.offsetWidth; art.classList.add('pushing');
      sfx('click');
    });
    if ($('le-say')) $('le-say').addEventListener('click', function() {
      if (ZsTTS.isSpeaking()) { ZsTTS.stop(); return; }
      ZsTTS.speak(l.title + '. ' + l.body.join(' '), { lang: 'en-US' });
    });
    if ($('le-nextl')) $('le-nextl').addEventListener('click', function() { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); lesson(nxt.id); });
    if ($('le-tolevels')) $('le-tolevels').addEventListener('click', levels);
    window.scrollTo(0, 0);
  }

  // ================================================================
  //  BUILD IT FOR REAL (parent PIN)
  // ================================================================
  function realBuild() {
    _stop();
    S.screen = 'real';
    var d = _load(), R = D.REAL_BUILD, rb = d.realBuild;
    _root().innerHTML =
      '<div class="le-page">' + _topBar(esc(R.title)) +
        '<article class="le-lesson le-real">' +
          '<h2>🍝 ' + esc(R.title) + ' <small>· ' + esc(R.es) + '</small></h2>' +
          '<div class="le-lesson-art">' + _realSvg() + '</div>' +
          '<h3>You need</h3><ul class="le-need">' + R.need.map(function(n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
          '<h3>Steps</h3><ol class="le-steps">' + R.steps.map(function(n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ol>' +
          '<div class="le-real-status" id="le-real-status">' +
            (rb ? '<p class="le-real-done">✅ Built for real on ' + esc(rb.date) + (rb.coins ? ' — it held <b>' + (rb.coins | 0) + '</b> coins!' : '!') + ' (+1 ★)</p>' +
                  '<button type="button" class="le-btn ghost" id="le-real-mark">Update the record (parent)</button>'
               : '<p>When the bridge is built and tested, ask a parent to mark it done. It earns <b>1 ★</b>.</p>' +
                 '<button type="button" class="le-btn primary" id="le-real-mark">👨‍👩‍👧 Parent: mark as done</button>') +
          '</div>' +
        '</article></div>';
    _bindTop();
    $('le-real-mark').addEventListener('click', _markReal);
  }
  function _markReal() {
    if (typeof ZsDialog === 'undefined') return;
    ZsDialog.prompt({ title: 'Parent PIN', message: 'Enter the parent PIN to confirm the bridge was built.', inputType: 'password', inputMode: 'numeric', confirmLabel: 'Confirm' })
      .then(function(pin) {
        if (pin == null) return { ok: false };
        var want = typeof getParentPin === 'function' ? String(getParentPin()) : null;
        if (!want || String(pin).trim() !== want) {
          sfx('wrong');
          ZsDialog.alert({ title: 'Wrong PIN', message: 'That PIN did not match. Nothing was changed.' });
          return { ok: false };
        }
        return ZsDialog.prompt({ title: 'How many coins did it hold?', message: 'Optional — leave it empty to skip.', inputType: 'number', inputMode: 'numeric', confirmLabel: 'Save', cancelLabel: 'Skip' })
          .then(function(c) { return { ok: true, coins: c }; });
      })
      .then(function(r) {
        if (!r || !r.ok) return;
        var d = _load();
        var n = parseInt(r.coins, 10);
        var was = !!d.realBuild;
        var keep = was && !(isFinite(n) && n > 0) ? (d.realBuild.coins | 0) : 0;
        d.realBuild = { date: today(), coins: isFinite(n) && n > 0 && n < 100000 ? n : keep };
        _save(d);
        sfx('cheer');
        if (!was && typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Little Engineer', '🍝', 'Built a real spaghetti bridge' + (d.realBuild.coins ? ' that held ' + d.realBuild.coins + ' coins' : '')); } catch (e) {} }
        toast(was ? 'Record updated!' : 'Recorded! +1 ★');
        realBuild();
      });
  }
  function _realSvg() {
    var sp = '', pts = [[40, 120], [100, 120], [160, 120], [220, 120], [280, 120], [70, 72], [130, 72], [190, 72], [250, 72]];
    var bars = [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [0, 5], [5, 1], [1, 6], [6, 2], [2, 7], [7, 3], [3, 8], [8, 4]];
    bars.forEach(function(b) {
      var p = pts[b[0]], q = pts[b[1]];
      sp += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="#e9c46a" stroke-width="3.2" stroke-linecap="round"/>' +
        '<line x1="' + p[0] + '" y1="' + (p[1] - 0.8) + '" x2="' + q[0] + '" y2="' + (q[1] - 0.8) + '" stroke="#fff3c4" stroke-width="1" stroke-linecap="round" opacity=".8"/>';
    });
    pts.forEach(function(p) { sp += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6.5" fill="#fffaf2" stroke="#e8d9c7" stroke-width="1.5"/><circle cx="' + (p[0] - 2) + '" cy="' + (p[1] - 2) + '" r="2" fill="#fff"/>'; });
    return '<svg viewBox="0 0 320 170" class="le-lesson-svg" role="img" aria-hidden="true">' +
      '<defs><linearGradient id="rbT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efe6"/><stop offset="1" stop-color="#e7dccd"/></linearGradient>' +
      '<linearGradient id="rbB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f5d8a"/><stop offset="1" stop-color="#1e3f63"/></linearGradient>' +
      '<linearGradient id="rbR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a33b3b"/><stop offset="1" stop-color="#6e2222"/></linearGradient></defs>' +
      '<rect width="320" height="170" rx="14" fill="url(#rbT)"/><rect y="150" width="320" height="20" fill="#c8a77e"/>' +
      '<rect x="0" y="124" width="46" height="13" fill="url(#rbB)"/><rect x="2" y="137" width="44" height="13" fill="url(#rbR)"/>' +
      '<rect x="274" y="124" width="46" height="13" fill="url(#rbR)"/><rect x="276" y="137" width="44" height="13" fill="url(#rbB)"/>' +
      sp +
      '<path d="M160 120 L160 134" stroke="#8a6a3a" stroke-width="1.5"/><path d="M150 134 L170 134 L167 156 L153 156 Z" fill="#f4f4f4" stroke="#bbb"/>' +
      '<ellipse cx="160" cy="137" rx="7" ry="2" fill="#d4a017"/><text x="160" y="28" text-anchor="middle" font-size="13" font-weight="800" fill="#7c4a12">20 cm gap · how many coins?</text></svg>';
  }

  // ================================================================
  //  INIT
  // ================================================================
  function init() {
    if (!$('le-wrap')) return;
    if (typeof CloudSync !== 'undefined' && CloudSync.online && _key()) { try { CloudSync.pull(_key()); } catch (e) {} }
    home();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  api.home = home; api.levels = levels; api.play = play; api.learn = learn; api.realBuild = realBuild;
  api._state = S;
  api._cam = function() { return _cam(); };

  return api;
})();
