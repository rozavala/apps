/* ================================================================
   CIRCUIT LAB ⚡ — build real circuits on a workbench and watch them work.
   - DC network solver: nodal analysis (batteries as Norton sources
     with internal resistance, bulbs/motor/buzzer/resistors as
     resistors, LED as an ideal-diode + Vf + Ron model iterated to a
     consistent on/off state, switches open/closed) solved with
     Gaussian elimination.
   - 16 challenges with solver-driven goal checks, stars 0–3.
   - Free Build sandbox.
   - Per-kid storage at getUserAppKey('zs_circuit_'):
       { v:1, levels:{<id>:{stars,date}}, facts:[ids], electrons, mute }
   Content: js/circuit-lab-data.js · Drawing: js/circuit-lab-art.js
   ================================================================ */

var CircuitLab = (function() {
  'use strict';

  var D = CircuitLabData, A = CircuitLabArt, DIR = D.DIR;
  var PREFIX = 'zs_circuit_';
  var G_WIRE = 100;      // 0.01 Ω copper wire
  var G_OFF = 1e-9;
  var GMIN = 1e-8;       // tiny leak to ground keeps floating nodes solvable
  var BULB_LIT = 0.15;
  var LEAD_INSET = { aa: 0.13, nine: 0.06, bulb: 0.26, switch: 0.13, buzzer: 0.17, motor: 0.3, resistor: 0.28, led: 0.36, tester: 0.24 };

  // ---------------- storage ----------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _load() {
    var k = _key();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; }
  }
  function _save(d) {
    var k = _key();
    if (!k) return;
    d.v = 1;
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) { return; }
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }
  function _sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function _toast(m) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(m); }
  function _today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function _esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''); }
  function _user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function _tier() { var u = _user(); return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate'; }
  function _young() { var t = _tier(); return t === 'beginner' || t === 'intermediate'; }

  function totalStars(d) {
    var n = 0, L = (d && d.levels) || {};
    for (var k in L) n += Math.min(3, (L[k] && L[k].stars) || 0);
    return n;
  }
  function unlockFact(id) {
    if (!D.FACTS[id]) return false;
    var d = _load();
    d.facts = d.facts || [];
    if (d.facts.indexOf(id) >= 0) return false;
    d.facts.push(id);
    _save(d);
    return true;
  }

  // ---------------- circuit model ----------------
  function terminals(p) {
    var d = DIR[p.dir];
    if (p.type === 'spdt') {
      var n = DIR[(p.dir + 1) % 4];
      return [[p.x, p.y], [p.x + d[0] + n[0], p.y + d[1] + n[1]], [p.x + d[0] - n[0], p.y + d[1] - n[1]]];
    }
    return [[p.x, p.y], [p.x + d[0], p.y + d[1]]];
  }
  function partCenter(p) {
    var d = DIR[p.dir];
    var k = p.type === 'spdt' ? 0.55 : 0.5;
    return [p.x + d[0] * k, p.y + d[1] * k];
  }
  function partRadius(p) { return p.type === 'spdt' ? 0.95 : 0.5; }
  function inBounds(c, x, y) { return x >= 0 && y >= 0 && x < c.cols && y < c.rows; }
  function canPlace(c, p, ignoreId) {
    var t = terminals(p), i;
    for (i = 0; i < t.length; i++) if (!inBounds(c, t[i][0], t[i][1])) return false;
    var pc = partCenter(p), pr = partRadius(p);
    for (i = 0; i < c.parts.length; i++) {
      var q = c.parts[i];
      if (q.id === ignoreId) continue;
      var qc = partCenter(q);
      if (Math.hypot(pc[0] - qc[0], pc[1] - qc[1]) < Math.max(pr, partRadius(q)) - 1e-6) return false;
    }
    return true;
  }
  function material(id) {
    for (var i = 0; i < D.MATERIALS.length; i++) if (D.MATERIALS[i].id === id) return D.MATERIALS[i];
    return null;
  }
  function resInfo(ohms) {
    for (var i = 0; i < D.RES_VALUES.length; i++) if (D.RES_VALUES[i].ohms === ohms) return D.RES_VALUES[i];
    return D.RES_VALUES[0];
  }

  // ---------------- the solver ----------------
  function gauss(M, b, n) {
    var r, c, k;
    for (c = 0; c < n; c++) {
      var piv = c, mx = Math.abs(M[c][c]);
      for (r = c + 1; r < n; r++) { var v = Math.abs(M[r][c]); if (v > mx) { mx = v; piv = r; } }
      if (mx < 1e-18) continue;
      if (piv !== c) { var tr = M[c]; M[c] = M[piv]; M[piv] = tr; var tb = b[c]; b[c] = b[piv]; b[piv] = tb; }
      var rc = M[c], inv = 1 / rc[c];
      for (r = c + 1; r < n; r++) {
        var row = M[r], f = row[c] * inv;
        if (f === 0) continue;
        for (k = c; k < n; k++) row[k] -= f * rc[k];
        b[r] -= f * b[c];
      }
    }
    var x = new Float64Array(n);
    for (r = n - 1; r >= 0; r--) {
      var s = b[r];
      for (k = r + 1; k < n; k++) s -= M[r][k] * x[k];
      x[r] = Math.abs(M[r][r]) < 1e-18 ? 0 : s / M[r][r];
    }
    return x;
  }

  // ov: { <partId>: {closed, state, obj} , shortTester: bool }
  function solve(c, ov) {
    ov = ov || {};
    var idx = {}, N = 0, els = [];
    function nid(t) { var k = t[0] + ',' + t[1]; if (idx[k] === undefined) idx[k] = N++; return idx[k]; }
    c.wires.forEach(function(w) {
      els.push({ kind: 'wire', ref: w, a: nid([w.x1, w.y1]), b: nid([w.x2, w.y2]), g: w.broken ? 0 : G_WIRE, e: 0 });
    });
    c.parts.forEach(function(p) {
      var t = terminals(p), P = D.PARTS[p.type], o = ov[p.id] || {};
      var a = nid(t[0]), b = nid(t[1]);
      var el = { kind: p.type, ref: p, a: a, b: b, g: 0, e: 0 };
      switch (p.type) {
        case 'aa': case 'nine': el.g = 1 / P.rInt; el.e = P.volts; break;
        case 'bulb': el.g = p.burnt ? 0 : 1 / P.ohms; break;
        case 'switch': el.g = (o.closed !== undefined ? o.closed : p.closed) ? 1 / P.ohms : 0; break;
        case 'spdt': {
          var c3 = nid(t[2]);
          var s = o.state !== undefined ? o.state : (p.state || 0);
          if (s) el.b = c3;
          el.g = 1 / P.ohms;
          break;
        }
        case 'buzzer': case 'motor': el.g = 1 / P.ohms; break;
        case 'resistor': el.g = 1 / (p.ohms || P.ohms); break;
        case 'led': el.g = p.burnt ? 0 : G_OFF; el.on = false; break;
        case 'tester': {
          var obj = o.obj !== undefined ? o.obj : p.obj, m = obj ? material(obj) : null;
          el.g = ov.shortTester ? G_WIRE : (m && m.ohms ? 1 / m.ohms : 0);
          break;
        }
      }
      els.push(el);
    });
    var V = new Float64Array(N), iter, i;
    var leds = els.filter(function(e) { return e.kind === 'led' && !e.ref.burnt; });
    for (iter = 0; iter < 24; iter++) {
      var M = [], rhs = new Float64Array(N);
      for (i = 0; i < N; i++) { M.push(new Float64Array(N)); M[i][i] = GMIN; }
      for (i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.g <= 0 || e.a === e.b) continue;
        M[e.a][e.a] += e.g; M[e.b][e.b] += e.g; M[e.a][e.b] -= e.g; M[e.b][e.a] -= e.g;
        if (e.e) { rhs[e.a] += e.g * e.e; rhs[e.b] -= e.g * e.e; }
      }
      V = N ? gauss(M, rhs, N) : V;
      var changed = false;
      for (i = 0; i < leds.length; i++) {
        var L = leds[i], vd = V[L.a] - V[L.b], LP = D.PARTS.led;
        if (!L.on && vd > LP.vf + 1e-6) { L.on = true; L.g = 1 / LP.rOn; L.e = LP.vf; changed = true; }
        else if (L.on && L.g * (vd - L.e) < -1e-7) { L.on = false; L.g = G_OFF; L.e = 0; changed = true; }
      }
      if (!changed) break;
    }
    var res = { V: V, idx: idx, part: {}, wire: {}, short: false, batI: 0 };
    els.forEach(function(e) {
      e.i = e.g > 0 && e.a !== e.b ? e.g * (V[e.a] - V[e.b] - e.e) : 0;
      e.v = V[e.a] - V[e.b];
      if (e.kind === 'wire') { res.wire[e.ref.id] = { i: e.i }; return; }
      var p = e.ref, P = D.PARTS[p.type], r = { i: e.i, v: e.v };
      switch (p.type) {
        case 'aa': case 'nine': {
          var isc = P.volts / P.rInt, out = -e.i;
          r.out = out;
          r.short = Math.abs(e.i) > 0.5 * isc;
          if (r.short) res.short = true;
          res.batI = Math.max(res.batI, Math.abs(e.i));
          break;
        }
        case 'bulb': {
          r.p = e.g * e.v * e.v;
          r.glow = Math.min(1.6, Math.sqrt(r.p / P.ratedW));
          r.lit = !p.burnt && r.glow >= BULB_LIT;
          r.overload = r.p > P.burnW;
          break;
        }
        case 'led': {
          var cur = Math.max(0, e.i);
          r.i = cur;
          r.glow = Math.min(1.5, cur / P.ratedA);
          r.lit = !p.burnt && cur >= 0.002;
          r.overload = cur > P.burnA;
          break;
        }
        case 'motor': r.spin = Math.abs(e.i) > 0.05; r.speed = e.i / 0.35 * 5; break;
        case 'buzzer': r.on = Math.abs(e.i) > 0.01; r.vol = Math.min(1, Math.abs(e.i) / 0.08); break;
        case 'resistor': r.p = e.g * e.v * e.v; break;
      }
      res.part[p.id] = r;
    });
    return res;
  }

  // ---------------- goal checks ----------------
  function partsOf(c, type) { return c.parts.filter(function(p) { return p.type === type; }); }
  function anyLit(c, r) { return partsOf(c, 'bulb').some(function(b) { return r.part[b.id] && r.part[b.id].lit; }); }
  function shortMsg() { return 'Short circuit! Give the current a path through a part.'; }

  var GOALS = {
    lit: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      if (anyLit(c, r)) return { ok: true, msg: 'The bulb is shining!' };
      return { ok: false, msg: partsOf(c, 'bulb').some(function(b) { return b.burnt; }) ? 'That bulb burnt out — tap it to fit a new one.' : 'The bulb is still dark.' };
    },
    switchControls: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var sws = partsOf(c, 'switch');
      if (!sws.length) return { ok: false, msg: 'Add a switch to the loop.' };
      for (var i = 0; i < sws.length; i++) {
        var s = sws[i], ov = {};
        ov[s.id] = { closed: !s.closed };
        var other = solve(c, ov);
        var onNow = anyLit(c, r), onOther = anyLit(c, other);
        if (onNow !== onOther) {
          if (s.closed && onNow) return { ok: true, msg: 'The switch controls the bulb!' };
          return { ok: false, msg: 'The switch is in! Tap it to close it and light the bulb.' };
        }
      }
      return { ok: false, msg: anyLit(c, r) ? 'The bulb is on, but the switch is not in its loop.' : 'Put the switch in the gap so it completes the loop.' };
    },
    buzz: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var on = partsOf(c, 'buzzer').some(function(b) { return r.part[b.id].on; });
      return on ? { ok: true, msg: 'Bzzzz!' } : { ok: false, msg: 'The buzzer is quiet.' };
    },
    series: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var bs = partsOf(c, 'bulb');
      if (bs.length < 2) return { ok: false, msg: '' };
      var r1 = r.part[bs[0].id], r2 = r.part[bs[1].id];
      if (!r1.lit || !r2.lit) return { ok: false, msg: (r1.lit || r2.lit) ? 'Only one bulb is glowing. Put both in the same loop.' : 'Both bulbs are dark.' };
      var ib = r.batI;
      var same = Math.abs(Math.abs(r1.i) - ib) < 0.03 * ib && Math.abs(Math.abs(r2.i) - ib) < 0.03 * ib;
      return same ? { ok: true, msg: 'Same current through both — that is series!' }
        : { ok: false, msg: 'Both glow, but each has its own path (that is parallel). Make ONE loop through both.' };
    },
    parallel: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var bs = partsOf(c, 'bulb');
      var g = bs.map(function(b) { return r.part[b.id].glow || 0; });
      var lit = bs.filter(function(b) { return r.part[b.id].lit; }).length;
      if (lit < 2) return { ok: false, msg: lit ? 'Only one bulb is glowing.' : 'Both bulbs are dark.' };
      if (Math.min(g[0], g[1]) < 0.85) return { ok: false, msg: 'Both glow, but dimly — they are sharing the push (series). Give each its own path.' };
      return { ok: true, msg: 'Both bulbs are bright!' };
    },
    materials: function() {
      var n = Object.keys(st.tested).length;
      return n >= D.MATERIALS.length ? { ok: true, msg: 'All 8 objects tested!' } : { ok: false, msg: 'Tested ' + n + ' of 8 objects.' };
    },
    bright: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var g = 0;
      partsOf(c, 'bulb').forEach(function(b) { g = Math.max(g, r.part[b.id].glow || 0); });
      if (g >= 0.95) return { ok: true, msg: 'Bright! 1.5 V + 1.5 V = 3 V.' };
      return { ok: false, msg: g >= BULB_LIT ? 'Glowing, but not bright yet.' : 'The bulb is dark. Are both batteries pointing the same way?' };
    },
    spin: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      return partsOf(c, 'motor').some(function(m) { return r.part[m.id].spin; }) ? { ok: true, msg: 'Whirr!' } : { ok: false, msg: 'The motor is still.' };
    },
    reverse: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var m = partsOf(c, 'motor')[0];
      if (!m) return { ok: false, msg: '' };
      var i = r.part[m.id].i;
      if (Math.abs(i) < 0.05) return { ok: false, msg: 'The motor has stopped.' };
      // Current a→b through the motor sets its spin; flipping the motor or the battery reverses it.
      return i * st.initSign < 0 ? { ok: true, msg: 'It spins the other way!' } : { ok: false, msg: 'Still spinning the same way.' };
    },
    ledOn: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var leds = partsOf(c, 'led');
      if (leds.some(function(l) { return r.part[l.id].lit; })) return { ok: true, msg: 'The LED is glowing!' };
      if (leds.some(function(l) { return l.burnt; })) return { ok: false, msg: 'The LED burnt out — too much current. Tap it to fit a new one.' };
      return { ok: false, msg: 'The LED is dark.' };
    },
    dim: function(c, r) {
      if (r.short) return { ok: false, msg: shortMsg() };
      var b = partsOf(c, 'bulb')[0], rs = partsOf(c, 'resistor');
      var g = b ? r.part[b.id].glow || 0 : 0;
      var inLoop = rs.some(function(x) { return Math.abs(r.part[x.id].i) > 0.001; });
      if (!inLoop) return { ok: false, msg: g >= BULB_LIT ? 'Bright! Now slow the current with a resistor.' : 'Put the resistor in the gap.' };
      if (g > 0.45) return { ok: false, msg: 'Still quite bright — tap the resistor for more ohms.' };
      if (g < BULB_LIT) return { ok: false, msg: 'Too dark to see — try fewer ohms.' };
      return { ok: true, msg: 'A soft glow!' };
    },
    oneEach: function(c, r) {
      var sws = partsOf(c, 'switch'), bs = partsOf(c, 'bulb');
      if (sws.length < 2) return { ok: false, msg: 'Add both switches.' };
      if (r.short) return { ok: false, msg: shortMsg() };
      var table = [], combo, k;
      for (combo = 0; combo < 4; combo++) {
        var ov = {};
        ov[sws[0].id] = { closed: !!(combo & 1) };
        ov[sws[1].id] = { closed: !!(combo & 2) };
        var rr = solve(c, ov);
        if (rr.short) return { ok: false, msg: 'Careful: one switch setting makes a short circuit.' };
        table.push(bs.map(function(b) { return rr.part[b.id].lit; }));
      }
      function follows(bi, si) {
        for (var cb = 0; cb < 4; cb++) if (table[cb][bi] !== !!(cb & (si + 1))) return false;
        return true;
      }
      for (k = 0; k < 2; k++) {
        if (follows(0, k) && follows(1, 1 - k)) return { ok: true, msg: 'Each switch has its own bulb!' };
      }
      return { ok: false, msg: 'Try each switch: right now one switch changes the wrong bulb (or both).' };
    },
    doorbell: function(c, r) {
      var s = partsOf(c, 'switch')[0], bz = partsOf(c, 'buzzer')[0], b = partsOf(c, 'bulb')[0];
      if (!s) return { ok: false, msg: 'Add the switch.' };
      if (r.short) return { ok: false, msg: shortMsg() };
      var on = {}, off = {};
      on[s.id] = { closed: true }; off[s.id] = { closed: false };
      var ron = solve(c, on), roff = solve(c, off);
      var good = ron.part[bz.id].on && (ron.part[b.id].glow || 0) >= 0.8 && !roff.part[bz.id].on && !roff.part[b.id].lit && !ron.short;
      if (good && s.closed) return { ok: true, msg: 'Ding-dong — and the light is on!' };
      if (good) return { ok: false, msg: 'Looks right! Close the switch to try it.' };
      if (ron.part[bz.id].on && ron.part[b.id].lit) return { ok: false, msg: 'Both work, but the bulb is dim. Put them side by side (parallel).' };
      return { ok: false, msg: 'The switch must control both the buzzer and the bulb.' };
    },
    twoWay: function(c, r) {
      var sw = partsOf(c, 'spdt'), b = partsOf(c, 'bulb')[0];
      if (sw.length < 2 || !b) return { ok: false, msg: '' };
      var lit = [], combo;
      for (combo = 0; combo < 4; combo++) {
        var ov = {};
        ov[sw[0].id] = { state: combo & 1 }; ov[sw[1].id] = { state: (combo >> 1) & 1 };
        var rr = solve(c, ov);
        if (rr.short) return { ok: false, msg: 'Careful: one switch setting makes a short circuit.' };
        lit.push(rr.part[b.id].lit);
      }
      var toggles = lit[0] !== lit[1] && lit[0] !== lit[2] && lit[3] !== lit[1] && lit[3] !== lit[2];
      if (!toggles) return { ok: false, msg: 'Flip each switch: both must be able to change the light.' };
      if (!r.part[b.id].lit) return { ok: false, msg: 'It works! Now flip a switch to leave the light on.' };
      return { ok: true, msg: 'Either switch turns the light on and off!' };
    }
  };

  // ---------------- session state ----------------
  var st = {
    screen: 'home', mode: null, lvl: null, li: -1, circ: null, nextId: 1, hist: [],
    hints: 0, freeHints: 0, hintShown: 0, sel: null, sim: null, won: false, pendingWin: null,
    tested: {}, anim: {}, fx: [], wireColor: 0, electrons: false, mute: false,
    initSign: 1, initMotorDir: 1, goalRes: null, lastShort: false, discovered: {}
  };

  // ---------------- view / layout ----------------
  var V = { canvas: null, ctx: null, w: 0, h: 0, dpr: 1, S: 60, ox: 0, oy: 0, rot: false, board: null, geo: {}, raf: 0, last: 0, t: 0 };

  function toScreen(gx, gy) {
    if (!V.rot) return { x: V.ox + gx * V.S, y: V.oy + gy * V.S };
    return { x: V.ox + (st.circ.rows - 1 - gy) * V.S, y: V.oy + gx * V.S };
  }
  function fromScreen(sx, sy) {
    if (!V.rot) return { x: (sx - V.ox) / V.S, y: (sy - V.oy) / V.S };
    return { x: (sy - V.oy) / V.S, y: st.circ.rows - 1 - (sx - V.ox) / V.S };
  }

  function layout() {
    if (!V.canvas || !st.circ) return;
    var stage = V.canvas.parentNode;
    var w = stage.clientWidth, h = stage.clientHeight;
    if (w < 10 || h < 10) return;
    V.dpr = ZsCanvas.dpr();
    V.w = w; V.h = h;
    V.canvas.width = Math.round(w * V.dpr); V.canvas.height = Math.round(h * V.dpr);
    V.canvas.style.width = w + 'px'; V.canvas.style.height = h + 'px';
    A.setDpr(V.dpr);
    var gw = st.circ.cols - 1, gh = st.circ.rows - 1, m = 0.62;
    var s1 = Math.min(w / (gw + 2 * m), h / (gh + 2 * m));
    var s2 = Math.min(w / (gh + 2 * m), h / (gw + 2 * m));
    V.rot = s2 > s1 * 1.08;
    V.S = Math.min(140, V.rot ? s2 : s1);
    var vw = (V.rot ? gh : gw) * V.S, vh = (V.rot ? gw : gh) * V.S;
    V.ox = (w - vw) / 2; V.oy = (h - vh) / 2;
    var posts = [], edges = [], x, y;
    for (x = 0; x < st.circ.cols; x++) for (y = 0; y < st.circ.rows; y++) {
      var p = toScreen(x, y);
      posts.push(p);
      if (x + 1 < st.circ.cols) { var q = toScreen(x + 1, y); edges.push([p.x, p.y, q.x, q.y]); }
      if (y + 1 < st.circ.rows) { var q2 = toScreen(x, y + 1); edges.push([p.x, p.y, q2.x, q2.y]); }
    }
    var mpx = m * V.S;
    ZsCanvas.release(V.board); // free the previous board image now
    V.board = A.makeBoard(w, h, { x: V.ox - mpx, y: V.oy - mpx, w: vw + 2 * mpx, h: vh + 2 * mpx }, posts, edges, V.S);
    V.ctx = ZsCanvas.get2d(V.canvas);
    rebuildGeo();
  }

  function edgeHasPart(x1, y1, x2, y2) {
    return st.circ.parts.some(function(p) {
      if (p.type === 'spdt') return false;
      var t = terminals(p);
      return (t[0][0] === x1 && t[0][1] === y1 && t[1][0] === x2 && t[1][1] === y2) ||
             (t[0][0] === x2 && t[0][1] === y2 && t[1][0] === x1 && t[1][1] === y1);
    });
  }
  function wireGeo(w) {
    var a = toScreen(w.x1, w.y1), b = toScreen(w.x2, w.y2);
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L, ny = dx / L;
    var bow = Math.min(L * 0.2, V.S * 0.28) + (edgeHasPart(w.x1, w.y1, w.x2, w.y2) ? V.S * 0.36 : 0);
    bow *= (w.bow || 1);
    var c1x = a.x + dx * 0.25 + nx * bow, c1y = a.y + dy * 0.25 + ny * bow;
    var c2x = a.x + dx * 0.75 + nx * bow, c2y = a.y + dy * 0.75 + ny * bow;
    var pts = [], cum = [0], n = 28;
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      var px = u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x;
      var py = u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y;
      pts.push(px, py);
      if (i) cum.push(cum[i - 1] + Math.hypot(px - pts[i * 2 - 2], py - pts[i * 2 - 1]));
    }
    return { pts: pts, cum: cum, L: cum[n] };
  }
  function rebuildGeo() {
    V.geo = {};
    st.circ.wires.forEach(function(w) { V.geo[w.id] = wireGeo(w); });
  }
  function partFrame(p) {
    var t = terminals(p);
    if (p.type === 'spdt') {
      var o = toScreen(t[0][0], t[0][1]), d = DIR[p.dir], e = toScreen(p.x + d[0], p.y + d[1]);
      return { x: o.x, y: o.y, ang: Math.atan2(e.y - o.y, e.x - o.x) };
    }
    var a = toScreen(t[0][0], t[0][1]), b = toScreen(t[1][0], t[1][1]);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function toLocal(p, sx, sy) {
    var f = partFrame(p), dx = sx - f.x, dy = sy - f.y, c = Math.cos(-f.ang), s = Math.sin(-f.ang);
    return { x: (dx * c - dy * s) / V.S, y: (dx * s + dy * c) / V.S };
  }

  // ---------------- per-part animation state ----------------
  function an(id) {
    if (!st.anim[id]) st.anim[id] = { open: 0, lever: 0, glow: 0, angle: Math.random() * 6, speed: 0, heat: 0, phase: 0, flash: 0, inited: false };
    return st.anim[id];
  }
  function renderState(p) {
    var a = an(p.id), r = st.sim ? st.sim.part[p.id] : null;
    switch (p.type) {
      case 'bulb': case 'led': return { glow: p.burnt ? 0 : a.glow, burnt: p.burnt };
      case 'switch': return { open: a.open };
      case 'spdt': return { lever: a.lever };
      case 'motor': return { angle: a.angle, speed: a.speed };
      case 'buzzer': return { buzz: r && r.on ? r.vol : 0, t: V.t };
      case 'aa': case 'nine': return { heat: a.heat };
      case 'resistor': {
        var ri = resInfo(p.ohms || D.PARTS.resistor.ohms);
        return { bands: ri.bands, label: (!_young() || isSel(p)) ? ri.ohms + ' Ω' : '', warm: r ? Math.max(0, (r.p - 0.5) / 2) : 0 };
      }
      case 'tester': return { obj: p.obj, hint: true };
    }
    return {};
  }
  function isSel(p) { return st.sel && st.sel.kind === 'part' && st.sel.id === p.id; }

  // ---------------- drawing ----------------
  function frame(ts) {
    V.raf = 0;
    if (st.screen !== 'play') return;
    if (!V.ctx && V.canvas) V.ctx = ZsCanvas.get2d(V.canvas);
    if (!V.ctx) { if (V.canvas) V.raf = requestAnimationFrame(frame); return; } // no canvas memory yet
    var dt = V.last ? Math.min(0.05, (ts - V.last) / 1000) : 0.016;
    V.last = ts; V.t += dt;
    step(dt);
    draw();
    audioUpdate();
    V.raf = requestAnimationFrame(frame);
  }
  function startLoop() { if (!V.raf) { V.last = 0; V.raf = requestAnimationFrame(frame); } }
  function stopLoop() { if (V.raf) cancelAnimationFrame(V.raf); V.raf = 0; }

  function step(dt) {
    var sim = st.sim;
    st.circ.parts.forEach(function(p) {
      var a = an(p.id), r = sim ? sim.part[p.id] : null;
      if (p.type === 'switch') {
        var tg = p.closed ? 0 : 1;
        if (!a.inited) a.open = tg;
        a.open += (tg - a.open) * Math.min(1, dt * 12);
      } else if (p.type === 'spdt') {
        var tl = p.state ? 1 : 0;
        if (!a.inited) a.lever = tl;
        a.lever += (tl - a.lever) * Math.min(1, dt * 12);
      } else if (p.type === 'bulb' || p.type === 'led') {
        var tgl = r && !p.burnt ? r.glow : 0;
        a.glow += (tgl - a.glow) * Math.min(1, dt * (tgl > a.glow ? 16 : 9));
      } else if (p.type === 'motor') {
        var ts = r ? r.speed : 0;
        a.speed += (ts - a.speed) * Math.min(1, dt * 2.2);
        a.angle += a.speed * Math.PI * 2 * dt;
      } else if (p.type === 'aa' || p.type === 'nine') {
        var hot = r && r.short;
        a.heat = hot ? Math.min(1, a.heat + dt * 0.45) : Math.max(0, a.heat - dt * 0.2);
      }
      a.inited = true;
      if (a.flash > 0) a.flash = Math.max(0, a.flash - dt * 2.2);
    });
    if (sim) {
      var spd = function(i) {
        var m = Math.log(1 + Math.abs(i) * 1000) / Math.log(1001);
        return (i < 0 ? -1 : 1) * Math.min(1.25, m) * 2.0 * V.S * (st.electrons ? -1 : 1);
      };
      st.circ.wires.forEach(function(w) { var r = sim.wire[w.id]; var a = an(w.id); a.phase += (r ? spd(r.i) : 0) * dt; });
      st.circ.parts.forEach(function(p) { var r = sim.part[p.id]; var a = an(p.id); a.phase += (r ? spd(r.i) : 0) * dt; });
    }
    for (var i = st.fx.length - 1; i >= 0; i--) {
      var f = st.fx[i];
      f.t += dt;
      f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt;
      if (f.t > f.life) st.fx.splice(i, 1);
    }
  }

  function usedPosts() {
    var used = {};
    st.circ.wires.forEach(function(w) { used[w.x1 + ',' + w.y1] = 1; used[w.x2 + ',' + w.y2] = 1; });
    st.circ.parts.forEach(function(p) { terminals(p).forEach(function(t) { used[t[0] + ',' + t[1]] = 1; }); });
    return used;
  }

  function drawPartAt(ctx, p, alpha, stOverride) {
    var f = partFrame(p);
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y); ctx.rotate(f.ang);
    A.drawPart(ctx, p.type, V.S, stOverride || renderState(p));
    ctx.restore();
  }

  function draw() {
    var ctx = V.ctx, S = V.S;
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (V.board) ctx.drawImage(V.board, 0, 0, V.w, V.h);
    var hiKink = st.lvl && st.lvl.randomBreak && st.hintShown >= 2;

    // hint ghosts
    if (st.showGhost && st.lvl && st.lvl.ghost) {
      var gh = st.lvl.ghost;
      (gh.wires || []).forEach(function(g) {
        var a = toScreen(g[0], g[1]), b = toScreen(g[2], g[3]);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(3, S * 0.05);
        ctx.setLineDash([S * 0.1, S * 0.08]); ctx.lineDashOffset = -V.t * S * 0.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
      });
      (gh.parts || []).forEach(function(g) {
        var gp = { type: g.type, x: g.x, y: g.y, dir: g.dir, id: -1 };
        drawPartAt(ctx, gp, 0.35 + 0.15 * Math.sin(V.t * 4), { open: 0 });
      });
    }

    // wires
    st.circ.wires.forEach(function(w) {
      var g = V.geo[w.id];
      if (!g) return;
      if (drag && drag.mode === 'wireEnd' && drag.wire === w) return;
      A.drawWire(ctx, g.pts, g.cum, w.color, S, { selected: st.sel && st.sel.kind === 'wire' && st.sel.id === w.id, kink: w.broken, kinkHi: hiKink && w.broken });
    });

    // parts
    st.circ.parts.forEach(function(p) {
      if (drag && drag.mode === 'movePart' && drag.part === p) return;
      if (isSel(p)) {
        var f = partFrame(p);
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.ang);
        ctx.strokeStyle = 'rgba(70,160,255,0.9)'; ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]); ctx.lineDashOffset = -V.t * 20;
        if (p.type === 'spdt') roundRect(ctx, S * 0.02, -S * 0.6, S * 0.82, S * 1.2, S * 0.08);
        else roundRect(ctx, -S * 0.43, -S * 0.26, S * 0.86, S * 0.52, S * 0.1);
        ctx.stroke();
        ctx.restore();
      }
      drawPartAt(ctx, p, 1);
    });

    // current dots
    if (st.sim) drawDots(ctx);

    // nuts on every post that holds something
    var used = usedPosts();
    var heatAt = {};
    st.circ.parts.forEach(function(p) {
      if ((p.type === 'aa' || p.type === 'nine') && an(p.id).heat > 0.05) terminals(p).forEach(function(t) { heatAt[t[0] + ',' + t[1]] = an(p.id).heat; });
    });
    Object.keys(used).forEach(function(k) {
      var xy = k.split(','), s = toScreen(+xy[0], +xy[1]);
      A.nut(ctx, s.x, s.y, S, heatAt[k] || 0);
    });

    // dragging previews
    if (drag) drawDrag(ctx);

    // selected wire handles
    if (st.sel && st.sel.kind === 'wire') {
      var sw = findWire(st.sel.id);
      if (sw && !(drag && drag.mode === 'wireEnd')) {
        [[sw.x1, sw.y1], [sw.x2, sw.y2]].forEach(function(e) {
          var s = toScreen(e[0], e[1]);
          ctx.save();
          ctx.strokeStyle = 'rgba(70,160,255,0.95)'; ctx.lineWidth = 3;
          ctx.fillStyle = 'rgba(70,160,255,0.18)';
          ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(16, S * 0.2), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.restore();
        });
      }
    }

    // light, heat and sound
    ctx.globalCompositeOperation = 'lighter';
    st.circ.parts.forEach(function(p) {
      var f = partFrame(p), a = an(p.id);
      if (p.type === 'bulb' && !p.burnt) A.glowBulb(ctx, f.x, f.y, S, a.glow);
      if (p.type === 'led' && !p.burnt) A.glowLed(ctx, f.x, f.y, S, a.glow);
      if (p.type === 'aa' || p.type === 'nine') A.glowHeat(ctx, f.x, f.y, S, a.heat, V.t);
      if (a.flash > 0) A.flash(ctx, f.x, f.y, S, a.flash);
    });
    ctx.globalCompositeOperation = 'source-over';
    st.circ.parts.forEach(function(p) {
      if (p.type !== 'buzzer' || !st.sim) return;
      var r = st.sim.part[p.id];
      if (r && r.on) { var f = partFrame(p); A.soundWaves(ctx, f.x, f.y, S, r.vol, V.t, f.ang); }
    });
    st.fx.forEach(function(f) {
      var k = f.t / f.life;
      if (f.kind === 'smoke') A.smoke(ctx, f.x, f.y, f.r * (1 + k * 2), 0.45 * (1 - k));
      else if (f.kind === 'spark') {
        ctx.fillStyle = 'rgba(255,' + Math.round(220 - 120 * k) + ',80,' + (1 - k) + ')';
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - k * 0.6), 0, Math.PI * 2); ctx.fill();
      }
    });

    // long-press ring
    if (press && press.lpStart && !press.moved) {
      var el = (performance.now() - press.lpStart) / LONG_MS;
      if (el > 0.25) {
        ctx.save();
        ctx.strokeStyle = 'rgba(230,57,70,0.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(press.x, press.y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, (el - 0.25) / 0.75)); ctx.stroke();
        ctx.restore();
      }
    }
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawDots(ctx) {
    var S = V.S, sp = S * 0.3, r = Math.max(2.2, S * 0.032), elec = st.electrons;
    st.circ.wires.forEach(function(w) {
      var res = st.sim.wire[w.id], g = V.geo[w.id];
      if (!res || !g || Math.abs(res.i) < 0.0005) return;
      var ph = ((an(w.id).phase % sp) + sp) % sp;
      for (var d = ph; d < g.L; d += sp) {
        var p = A.pointAt(g.pts, g.cum, d);
        A.dot(ctx, p.x, p.y, r, elec);
      }
    });
    st.circ.parts.forEach(function(p) {
      if (p.type === 'spdt') return;
      var res = st.sim.part[p.id];
      if (!res || Math.abs(res.i) < 0.0005) return;
      var inset = LEAD_INSET[p.type] || 0.2;
      var t = terminals(p), a = toScreen(t[0][0], t[0][1]), b = toScreen(t[1][0], t[1][1]);
      var ph = ((an(p.id).phase % sp) + sp) % sp;
      for (var d = ph; d < S; d += sp) {
        var k = d / S;
        if (k > inset && k < 1 - inset) continue;
        A.dot(ctx, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, r * 0.9, elec);
      }
    });
  }

  function drawDrag(ctx) {
    var S = V.S;
    if (drag.mode === 'newWire' || drag.mode === 'wireEnd') {
      var from = drag.mode === 'newWire' ? toScreen(drag.from[0], drag.from[1]) : drag.fixedEnd;
      var to = drag.target ? toScreen(drag.target[0], drag.target[1]) : { x: drag.x, y: drag.y };
      var dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy);
      if (L < 4) return;
      var nx = -dy / L, ny = dx / L, bow = Math.min(L * 0.2, S * 0.28);
      var pts = [], cum = [0];
      for (var i = 0; i <= 20; i++) {
        var t = i / 20, u = 1 - t;
        var c1x = from.x + dx * 0.25 + nx * bow, c1y = from.y + dy * 0.25 + ny * bow, c2x = from.x + dx * 0.75 + nx * bow, c2y = from.y + dy * 0.75 + ny * bow;
        var px = u * u * u * from.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * to.x;
        var py = u * u * u * from.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * to.y;
        pts.push(px, py);
        if (i) cum.push(cum[i - 1] + Math.hypot(px - pts[i * 2 - 2], py - pts[i * 2 - 1]));
      }
      A.drawWire(ctx, pts, cum, drag.color, S, { ghost: !drag.target });
      if (drag.target) {
        ctx.save();
        ctx.strokeStyle = 'rgba(80,220,120,0.95)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(to.x, to.y, Math.max(14, S * 0.16), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    } else if ((drag.mode === 'movePart' || drag.mode === 'tray') && drag.cand) {
      var ok = drag.candOk;
      drawPartAt(ctx, drag.cand, 0.8, drag.mode === 'movePart' ? renderState(drag.part) : { open: 0 });
      var f = partFrame(drag.cand);
      ctx.save();
      ctx.translate(f.x, f.y); ctx.rotate(f.ang);
      ctx.strokeStyle = ok ? 'rgba(80,220,120,0.95)' : 'rgba(230,57,70,0.95)'; ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      if (drag.cand.type === 'spdt') roundRect(ctx, S * 0.02, -S * 0.6, S * 0.82, S * 1.2, S * 0.08);
      else roundRect(ctx, -S * 0.45, -S * 0.27, S * 0.9, S * 0.54, S * 0.1);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------------- audio (buzzer + motor hum) ----------------
  var AU = { ctx: null };
  function audioInit() {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      var ac = new C();
      AU.ctx = ac;
      AU.master = ac.createGain(); AU.master.gain.value = 1; AU.master.connect(ac.destination);
      AU.bo = ac.createOscillator(); AU.bo.type = 'square'; AU.bo.frequency.value = 400;
      AU.bf = ac.createBiquadFilter(); AU.bf.type = 'lowpass'; AU.bf.frequency.value = 2200;
      AU.bg = ac.createGain(); AU.bg.gain.value = 0;
      AU.bo.connect(AU.bf); AU.bf.connect(AU.bg); AU.bg.connect(AU.master); AU.bo.start();
      AU.mo = ac.createOscillator(); AU.mo.type = 'sawtooth'; AU.mo.frequency.value = 60;
      AU.mf = ac.createBiquadFilter(); AU.mf.type = 'lowpass'; AU.mf.frequency.value = 520;
      AU.mg = ac.createGain(); AU.mg.gain.value = 0;
      AU.mo.connect(AU.mf); AU.mf.connect(AU.mg); AU.mg.connect(AU.master); AU.mo.start();
    } catch (e) { AU.ctx = null; }
  }
  function audioUpdate() {
    if (!AU.ctx) return;
    var t = AU.ctx.currentTime, bi = 0, ms = 0;
    if (st.screen === 'play' && st.sim && !st.mute && !document.hidden) {
      st.circ.parts.forEach(function(p) {
        var r = st.sim.part[p.id];
        if (!r) return;
        if (p.type === 'buzzer' && r.on) bi = Math.max(bi, Math.abs(r.i));
        if (p.type === 'motor') ms = Math.max(ms, Math.abs(an(p.id).speed));
      });
    }
    var bv = bi > 0 ? Math.min(1, bi / 0.08) : 0;
    AU.bg.gain.setTargetAtTime(0.045 * bv, t, 0.02);
    AU.bo.frequency.setTargetAtTime(320 + 900 * Math.min(1, bi / 0.15), t, 0.03);
    AU.mg.gain.setTargetAtTime(ms > 0.2 ? 0.03 * Math.min(1, ms / 6) : 0, t, 0.05);
    AU.mo.frequency.setTargetAtTime(28 + 14 * ms, t, 0.05);
  }
  function audioSilence() {
    if (!AU.ctx) return;
    var t = AU.ctx.currentTime;
    AU.bg.gain.setTargetAtTime(0, t, 0.01); AU.mg.gain.setTargetAtTime(0, t, 0.01);
  }

  // ---------------- circuit edits ----------------
  function findPart(id) { for (var i = 0; i < st.circ.parts.length; i++) if (st.circ.parts[i].id === id) return st.circ.parts[i]; return null; }
  function findWire(id) { for (var i = 0; i < st.circ.wires.length; i++) if (st.circ.wires[i].id === id) return st.circ.wires[i]; return null; }
  function snapshot() { return JSON.stringify({ parts: st.circ.parts, wires: st.circ.wires, nextId: st.nextId }); }
  function pushHist() { st.hist.push(snapshot()); if (st.hist.length > 60) st.hist.shift(); }
  function undo() {
    if (!st.hist.length) { _toast('Nothing to undo'); return; }
    var s = JSON.parse(st.hist.pop());
    st.circ.parts = s.parts; st.circ.wires = s.wires; st.nextId = s.nextId;
    st.sel = null;
    _sound('click');
    changed();
  }
  function remaining(type) {
    if (st.mode === 'free') return Infinity;
    var cap = (st.lvl.tray || {})[type] || 0;
    var used = 0;
    if (type === 'wire') st.circ.wires.forEach(function(w) { if (!w.pre) used++; });
    else st.circ.parts.forEach(function(p) { if (!p.pre && p.type === type) used++; });
    return cap - used;
  }
  function addedCount() {
    var n = 0;
    st.circ.wires.forEach(function(w) { if (!w.pre) n++; });
    st.circ.parts.forEach(function(p) { if (!p.pre) n++; });
    return n;
  }
  function newPart(type, x, y, dir) {
    var p = { id: st.nextId++, type: type, x: x, y: y, dir: dir };
    if (type === 'switch') p.closed = false;
    if (type === 'spdt') p.state = 0;
    if (type === 'resistor') p.ohms = D.PARTS.resistor.ohms;
    return p;
  }
  function addWire(a, b) {
    if (a[0] === b[0] && a[1] === b[1]) return false;
    var dup = st.circ.wires.some(function(w) {
      return (w.x1 === a[0] && w.y1 === a[1] && w.x2 === b[0] && w.y2 === b[1]) || (w.x1 === b[0] && w.y1 === b[1] && w.x2 === a[0] && w.y2 === a[1]);
    });
    if (dup) { _toast('There is already a wire there.'); return false; }
    if (remaining('wire') <= 0) { _toast('No wires left — remove one first.'); _sound('wrong'); return false; }
    pushHist();
    var w = { id: st.nextId++, x1: a[0], y1: a[1], x2: b[0], y2: b[1], color: A.WIRE_COLORS[st.wireColor % A.WIRE_COLORS.length], bow: (st.nextId % 2) ? 1 : -1 };
    st.wireColor++;
    st.circ.wires.push(w);
    _sound('click');
    changed();
    return true;
  }
  function removeItem(kind, id, silent) {
    if (kind === 'part') {
      var p = findPart(id);
      if (!p) return;
      if (p.fixed) { _toast('This part is fixed to the board for this challenge.'); return; }
      pushHist();
      st.circ.parts = st.circ.parts.filter(function(q) { return q.id !== id; });
      puff(partFrame(p));
    } else {
      var w = findWire(id);
      if (!w) return;
      pushHist();
      st.circ.wires = st.circ.wires.filter(function(q) { return q.id !== id; });
      var g = V.geo[w.id];
      if (g) puff(A.pointAt(g.pts, g.cum, g.L / 2));
    }
    if (st.sel && st.sel.id === id) st.sel = null;
    if (!silent) _sound('click');
    if (navigator.vibrate) { try { navigator.vibrate(25); } catch (e) {} }
    changed();
  }
  function puff(pt) {
    for (var i = 0; i < 6; i++) st.fx.push({ kind: 'smoke', x: pt.x + (Math.random() - 0.5) * 20, y: pt.y + (Math.random() - 0.5) * 12, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, r: V.S * 0.08, t: 0, life: 0.7 + Math.random() * 0.3 });
  }
  function sparks(pt, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 160;
      st.fx.push({ kind: 'spark', x: pt.x, y: pt.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, g: 260, r: 2 + Math.random() * 2.5, t: 0, life: 0.5 + Math.random() * 0.5 });
    }
  }
  function canFlip(p) { return !p.fixed || p.flip; }
  function flipPart(p) {
    if (!canFlip(p)) { _toast('This part is fixed for this challenge.'); return; }
    if (p.type === 'spdt') { togglePart(p); return; }
    var t = terminals(p);
    var np = { type: p.type, x: t[1][0], y: t[1][1], dir: (p.dir + 2) % 4 };
    pushHist();
    p.x = np.x; p.y = np.y; p.dir = np.dir;
    _sound('click');
    changed();
  }
  function turnPart(p) {
    if (p.fixed) { _toast('This part is fixed for this challenge.'); return; }
    for (var k = 1; k < 4; k++) {
      var cand = { type: p.type, x: p.x, y: p.y, dir: (p.dir + k) % 4 };
      if (canPlace(st.circ, cand, p.id)) {
        pushHist();
        p.dir = cand.dir;
        _sound('click');
        changed();
        return;
      }
    }
    _toast('No room to turn it here.');
  }
  function togglePart(p) {
    if (p.type === 'switch') { pushHist(); p.closed = !p.closed; }
    else if (p.type === 'spdt') { pushHist(); p.state = p.state ? 0 : 1; }
    else return;
    _sound('click');
    if (st.sim && p.type === 'switch' && p.closed) {
      var f = partFrame(p);
      setTimeout(function() { if (st.sim && st.sim.part[p.id] && Math.abs(st.sim.part[p.id].i) > 0.05) sparks({ x: f.x + V.S * 0.1, y: f.y }, 5); }, 90);
    }
    changed();
  }
  function cycleValue(p) {
    if (p.fixed) { _toast('This resistor is fixed for this challenge.'); return; }
    var vals = D.RES_VALUES.map(function(v) { return v.ohms; });
    var i = vals.indexOf(p.ohms || D.PARTS.resistor.ohms);
    pushHist();
    p.ohms = vals[(i + 1) % vals.length];
    _sound('click');
    changed();
  }
  function replacePart(p) {
    pushHist();
    p.burnt = false;
    _sound('click');
    _toast('Fitted a new ' + (p.type === 'led' ? 'LED' : 'bulb') + '.');
    changed();
  }
  function placeObject(obj, tester) {
    if (!tester) {
      var ts = partsOf(st.circ, 'tester');
      tester = (st.sel && st.sel.kind === 'part' && findPart(st.sel.id) && findPart(st.sel.id).type === 'tester') ? findPart(st.sel.id) : ts[0];
    }
    if (!tester) { _toast('Add a material tester first.'); return; }
    st.circ.parts.forEach(function(p) { if (p.type === 'tester' && p.obj === obj) p.obj = null; });
    tester.obj = obj;
    _sound('click');
    changed();
  }

  // Everything that must happen after the circuit changes.
  function changed() {
    rebuildGeo();
    st.sim = solve(st.circ);
    var burnt = null;
    st.circ.parts.forEach(function(p) {
      var r = st.sim.part[p.id];
      if (r && r.overload && !p.burnt) {
        p.burnt = true; burnt = p;
        an(p.id).flash = 1;
        var f = partFrame(p);
        sparks(f, 14); puff(f);
      }
    });
    if (burnt) {
      st.sim = solve(st.circ);
      _sound('wrong');
      _toast(burnt.type === 'led'
        ? 'Pop! Too much current burnt out the LED. LEDs need a resistor. Tap it to fit a new one.'
        : 'Pop! Too many volts melted the filament. Tap the bulb to fit a new one.');
    }
    discoveries();
    // material testing
    partsOf(st.circ, 'tester').forEach(function(tp) {
      if (!tp.obj) return;
      var ready = anyLit(st.circ, solve(st.circ, { shortTester: true }));
      if (ready && !st.tested[tp.obj]) {
        var m = material(tp.obj);
        st.tested[tp.obj] = m.kind;
        _sound(m.kind === 'insulator' ? 'click' : 'correct');
        _toast(m.name + ': ' + (m.kind === 'conductor' ? 'conductor ✓ — ' : m.kind === 'partial' ? 'conducts a little — ' : 'insulator ✗ — ') + m.why);
      }
    });
    if (st.mode === 'free' && Object.keys(st.tested).length >= 3 && !st.discovered.conductors) {
      st.discovered.conductors = 1;
      if (unlockFact('conductors')) _toast('New fact card: Conductors and insulators');
    }
    if (st.sim.short && !st.lastShort) { _sound('wrong'); if (unlockFact('short') && st.mode === 'free') _toast('New fact card: Short circuits'); }
    st.lastShort = st.sim.short;
    refreshUI();
    checkGoal();
  }

  function discoveries() {
    if (st.mode !== 'free') return;
    var c = st.circ, r = st.sim;
    function disc(id, cond, label) {
      if (cond && !st.discovered[id]) { st.discovered[id] = 1; if (unlockFact(id)) _toast('New fact card: ' + label); }
    }
    disc('bulb', anyLit(c, r), 'The light bulb');
    disc('faraday', partsOf(c, 'motor').some(function(m) { return r.part[m.id].spin; }), 'Faraday’s motor');
    disc('led', partsOf(c, 'led').some(function(l) { return r.part[l.id].lit; }), 'LEDs');
    disc('buzzer', partsOf(c, 'buzzer').some(function(b) { return r.part[b.id].on; }), 'Buzzers and bells');
  }

  // ---------------- goals, hints, winning ----------------
  function checkGoal() {
    if (st.mode !== 'level' || st.won) return;
    var res = GOALS[st.lvl.goal](st.circ, st.sim);
    st.goalRes = res;
    var el = document.getElementById('cl-status');
    if (el) {
      el.textContent = res.msg || '';
      el.className = 'cl-status' + (res.ok ? ' ok' : (st.sim.short ? ' warn' : ''));
    }
    if (res.ok && !st.pendingWin) {
      st.pendingWin = setTimeout(function() {
        st.pendingWin = null;
        if (st.won || st.screen !== 'play') return;
        var again = GOALS[st.lvl.goal](st.circ, st.sim);
        if (again.ok) win();
      }, 1100);
    } else if (!res.ok && st.pendingWin) {
      clearTimeout(st.pendingWin); st.pendingWin = null;
    }
  }

  function hintCost() {
    var t = _tier();
    if (t === 'beginner') return 0;
    return 1;
  }
  function showHint() {
    if (st.mode !== 'level') {
      _toast('Drag parts from the tray. Drag from post to post for wires. Tap a part to select it; long-press to remove.');
      return;
    }
    var hs = st.lvl.hints || [];
    if (st.hintShown >= hs.length) {
      st.showGhost = !!st.lvl.ghost;
      renderGoalHint();
      return;
    }
    st.hintShown++;
    var free = _tier() === 'intermediate' && st.hintShown === 1;
    if (!free && hintCost()) st.hints++;
    if (st.hintShown >= hs.length && st.lvl.ghost) st.showGhost = true;
    _sound('click');
    renderGoalHint();
  }
  function renderGoalHint() {
    var el = document.getElementById('cl-hint');
    if (!el) return;
    var hs = st.lvl ? st.lvl.hints || [] : [];
    var html = '';
    for (var i = 0; i < st.hintShown && i < hs.length; i++) html += '<div class="cl-hint-line">💡 ' + _esc(hs[i]) + '</div>';
    if (st.showGhost) html += '<div class="cl-hint-line cl-hint-ghost">The dashed lines on the board show one way to do it.</div>';
    el.innerHTML = html;
    el.hidden = !html;
    var hb = document.getElementById('cl-hintbtn');
    if (hb) hb.classList.toggle('used', st.hintShown > 0);
  }

  function win() {
    st.won = true;
    var lvl = st.lvl;
    var added = addedCount();
    var s1 = 1, s2 = added <= lvl.ideal ? 1 : 0, s3 = st.hints === 0 ? 1 : 0;
    var stars = s1 + s2 + s3;
    var d = _load();
    d.levels = d.levels || {};
    var prev = (d.levels[lvl.id] && d.levels[lvl.id].stars) || 0;
    d.levels[lvl.id] = { stars: Math.max(prev, stars), date: _today() };
    d.facts = d.facts || [];
    var newFact = lvl.fact && d.facts.indexOf(lvl.fact) < 0;
    if (newFact) d.facts.push(lvl.fact);
    _save(d);
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Circuit Lab', '⚡', 'Solved "' + lvl.title + '" — ' + stars + '★');
    }
    _sound('cheer');
    var cx = V.w / 2, cy = V.h / 2;
    sparks({ x: cx, y: cy }, 40);
    setTimeout(function() { showWin(stars, [s1, s2, s3], added, newFact); }, 650);
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }

  function showWin(stars, parts, added, newFact) {
    var lvl = st.lvl, f = D.FACTS[lvl.fact];
    var next = D.LEVELS[st.li + 1];
    var ov = document.createElement('div');
    ov.className = 'cl-modal';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Challenge complete');
    var starHtml = '';
    for (var i = 0; i < 3; i++) starHtml += '<span class="cl-bigstar' + (i < stars ? ' on' : '') + '" style="animation-delay:' + (0.15 + i * 0.22) + 's">★</span>';
    ov.innerHTML =
      '<div class="cl-modal-card">' +
        '<div class="cl-win-stars">' + starHtml + '</div>' +
        '<h2>' + _esc(lvl.title) + ' — solved!</h2>' +
        '<ul class="cl-star-why">' +
          '<li class="on">★ The circuit works</li>' +
          '<li class="' + (parts[1] ? 'on' : '') + '">★ ' + (parts[1] ? 'Used few parts' : 'Try again with ' + lvl.ideal + ' new part' + (lvl.ideal === 1 ? '' : 's') + ' or fewer') + ' (' + added + ' added)</li>' +
          '<li class="' + (parts[2] ? 'on' : '') + '">★ ' + (parts[2] ? 'No hints needed' : 'Solve it without hints') + '</li>' +
        '</ul>' +
        (f ? '<div class="cl-fact"><div class="cl-fact-h">' + (newFact ? '<span class="cl-new">New fact card</span>' : '') + f.icon + ' ' + _esc(f.title) + '</div><p>' + _esc(f.text) + '</p></div>' : '') +
        '<div class="cl-modal-btns">' +
          '<button type="button" class="cl-btn ghost" data-act="stay">Keep playing</button>' +
          '<button type="button" class="cl-btn ghost" data-act="levels">All challenges</button>' +
          (next ? '<button type="button" class="cl-btn primary" data-act="next">Next challenge →</button>' : '<button type="button" class="cl-btn primary" data-act="free">Free Build →</button>') +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    var first = ov.querySelector('[data-act="next"],[data-act="free"]');
    if (first) first.focus();
    setTimeout(function() { for (var k = 0; k < stars; k++) setTimeout(function() { _sound('star'); }, k * 220); }, 150);
    ov.addEventListener('click', function(e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      ov.parentNode.removeChild(ov);
      if (act === 'next') startLevel(st.li + 1);
      else if (act === 'levels') showLevels();
      else if (act === 'free') startFree();
    });
  }

  // ---------------- input ----------------
  var drag = null, press = null, LONG_MS = 650;

  function evPos(e) {
    var r = V.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function nearestPost(x, y, maxD, exclude) {
    var g = fromScreen(x, y);
    var gx = Math.round(g.x), gy = Math.round(g.y);
    if (!inBounds(st.circ, gx, gy)) return null;
    if (exclude && exclude[0] === gx && exclude[1] === gy) return null;
    var s = toScreen(gx, gy);
    return Math.hypot(s.x - x, s.y - y) <= maxD ? [gx, gy] : null;
  }
  function hitPart(x, y) {
    for (var i = st.circ.parts.length - 1; i >= 0; i--) {
      var p = st.circ.parts[i], l = toLocal(p, x, y);
      var pad = Math.max(0, 22 / V.S - 0.2);
      if (p.type === 'spdt') { if (l.x > 0.05 && l.x < 0.82 && Math.abs(l.y) < 0.55) return p; continue; }
      if (p.type === 'motor') { if (Math.hypot(l.x, l.y) < 0.42) return p; continue; }
      if (Math.abs(l.x) < 0.34 && Math.abs(l.y) < 0.2 + pad) return p;
    }
    return null;
  }
  function distToPoly(pts, x, y) {
    var best = Infinity;
    for (var i = 0; i < pts.length - 2; i += 2) {
      var ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3];
      var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      var t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
      best = Math.min(best, Math.hypot(ax + dx * t - x, ay + dy * t - y));
    }
    return best;
  }
  function hitWire(x, y) {
    var best = null, bd = Math.max(12, V.S * 0.11);
    st.circ.wires.forEach(function(w) {
      var g = V.geo[w.id];
      if (!g) return;
      var d = distToPoly(g.pts, x, y);
      if (d < bd) { bd = d; best = w; }
    });
    return best;
  }

  // Snap a part (keeping its polarity sense) to the edge nearest a screen point.
  function snapPart(type, dir, x, y) {
    var g = fromScreen(x, y);
    if (type === 'spdt') {
      var d = DIR[dir];
      return { type: type, x: Math.round(g.x - 0.55 * d[0]), y: Math.round(g.y - 0.55 * d[1]), dir: dir };
    }
    var cols = st.circ.cols, rows = st.circ.rows;
    var hx = Math.max(0, Math.min(cols - 2, Math.floor(g.x))), hy = Math.max(0, Math.min(rows - 1, Math.round(g.y)));
    var vx = Math.max(0, Math.min(cols - 1, Math.round(g.x))), vy = Math.max(0, Math.min(rows - 2, Math.floor(g.y)));
    var dh = Math.hypot(hx + 0.5 - g.x, hy - g.y), dv = Math.hypot(vx - g.x, vy + 0.5 - g.y);
    var pos = dir === 0 || dir === 1;
    if (dh <= dv) return pos ? { type: type, x: hx, y: hy, dir: 0 } : { type: type, x: hx + 1, y: hy, dir: 2 };
    return pos ? { type: type, x: vx, y: vy, dir: 1 } : { type: type, x: vx, y: vy + 1, dir: 3 };
  }
  function overBoard(x, y) {
    var g = fromScreen(x, y);
    return g.x > -0.6 && g.y > -0.6 && g.x < st.circ.cols - 0.4 && g.y < st.circ.rows - 0.4;
  }
  function overBin(cx, cy) {
    var bin = document.getElementById('cl-bin');
    if (!bin) return false;
    var r = bin.getBoundingClientRect();
    return cx >= r.left - 6 && cx <= r.right + 6 && cy >= r.top - 6 && cy <= r.bottom + 6;
  }

  function onDown(e) {
    if (press || drag) return;
    audioInit();
    var p = evPos(e);
    try { V.canvas.setPointerCapture(e.pointerId); } catch (er) {}
    press = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
    var S = V.S;
    // 1. ends of the selected wire
    if (st.sel && st.sel.kind === 'wire') {
      var sw = findWire(st.sel.id);
      if (sw) {
        var e1 = toScreen(sw.x1, sw.y1), e2 = toScreen(sw.x2, sw.y2), hr = Math.max(18, S * 0.22);
        var d1 = Math.hypot(e1.x - p.x, e1.y - p.y), d2 = Math.hypot(e2.x - p.x, e2.y - p.y);
        if (Math.min(d1, d2) < hr) {
          var end = d1 <= d2 ? 1 : 2;
          press.kind = 'wireEnd'; press.wire = sw; press.end = end;
          press.fixedEnd = end === 1 ? e2 : e1;
          return;
        }
      }
    }
    // 2. posts start new wires
    var post = nearestPost(p.x, p.y, Math.max(16, S * 0.24));
    if (post) { press.kind = 'post'; press.post = post; return; }
    // 3. parts
    var part = hitPart(p.x, p.y);
    if (part) {
      press.kind = 'part'; press.part = part;
      if (!part.fixed) press.lpStart = performance.now();
      press.lp = part.fixed ? 0 : setTimeout(longPress, LONG_MS);
      return;
    }
    // 4. wires
    var w = hitWire(p.x, p.y);
    if (w) {
      press.kind = 'wire'; press.wire = w;
      press.lpStart = performance.now();
      press.lp = setTimeout(longPress, LONG_MS);
      return;
    }
    press.kind = 'empty';
  }
  function longPress() {
    if (!press || press.moved) return;
    var k = press.kind, target = k === 'part' ? press.part : press.wire;
    press.lp = 0; press.lpStart = 0;
    press.kind = 'done';
    if (target) removeItem(k === 'part' ? 'part' : 'wire', target.id);
  }
  function onMove(e) {
    if (!press || e.pointerId !== press.id) return;
    var p = evPos(e);
    press.x = p.x; press.y = p.y;
    if (!press.moved && Math.hypot(p.x - press.sx, p.y - press.sy) > 8) {
      press.moved = true;
      if (press.lp) { clearTimeout(press.lp); press.lp = 0; press.lpStart = 0; }
      if (press.kind === 'post') drag = { mode: 'newWire', from: press.post, color: A.WIRE_COLORS[st.wireColor % A.WIRE_COLORS.length] };
      else if (press.kind === 'wireEnd') drag = { mode: 'wireEnd', wire: press.wire, end: press.end, fixedEnd: press.fixedEnd, color: press.wire.color };
      else if (press.kind === 'part') {
        if (press.part.fixed) { if (!press.warned) { press.warned = 1; _toast('This part is fixed to the board for this challenge.'); } }
        else { drag = { mode: 'movePart', part: press.part }; st.sel = { kind: 'part', id: press.part.id }; refreshToolbar(); }
      }
    }
    if (!drag) return;
    drag.x = p.x; drag.y = p.y;
    if (drag.mode === 'newWire') drag.target = nearestPost(p.x, p.y, Math.max(20, V.S * 0.36), drag.from);
    else if (drag.mode === 'wireEnd') {
      var w = drag.wire, other = drag.end === 1 ? [w.x2, w.y2] : [w.x1, w.y1];
      drag.target = nearestPost(p.x, p.y, Math.max(20, V.S * 0.36), other);
    } else if (drag.mode === 'movePart') {
      var bin = overBin(e.clientX, e.clientY);
      setBinHot(bin);
      if (bin || !overBoard(p.x, p.y)) { drag.cand = null; return; }
      drag.cand = snapPart(drag.part.type, drag.part.dir, p.x, p.y);
      drag.candOk = canPlace(st.circ, drag.cand, drag.part.id);
    }
  }
  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    if (press.lp) clearTimeout(press.lp);
    var pr = press, dg = drag;
    press = null; drag = null;
    setBinHot(false);
    if (dg) {
      if (dg.mode === 'newWire') { if (dg.target) addWire(dg.from, dg.target); }
      else if (dg.mode === 'wireEnd') {
        if (dg.target) {
          pushHist();
          if (dg.end === 1) { dg.wire.x1 = dg.target[0]; dg.wire.y1 = dg.target[1]; }
          else { dg.wire.x2 = dg.target[0]; dg.wire.y2 = dg.target[1]; }
          _sound('click');
          changed();
        }
      } else if (dg.mode === 'movePart') {
        if (overBin(e.clientX, e.clientY)) removeItem('part', dg.part.id);
        else if (dg.cand && dg.candOk) {
          pushHist();
          dg.part.x = dg.cand.x; dg.part.y = dg.cand.y; dg.part.dir = dg.cand.dir;
          _sound('click');
          changed();
        } else if (dg.cand) { _toast('No room there.'); }
      }
      return;
    }
    if (pr.moved || pr.kind === 'done') return;
    // taps
    if (pr.kind === 'part') tapPart(pr.part);
    else if (pr.kind === 'wire') { st.sel = { kind: 'wire', id: pr.wire.id }; _sound('click'); refreshToolbar(); }
    else if (pr.kind === 'post' || pr.kind === 'empty' || pr.kind === 'wireEnd') {
      if (st.sel) { st.sel = null; refreshToolbar(); }
      else if (pr.kind === 'post' && !st.toldWire) { st.toldWire = 1; _toast('Drag from this brass post to another post to lay a wire.'); }
    }
  }
  function onCancel(e) {
    if (!press || e.pointerId !== press.id) return;
    if (press.lp) clearTimeout(press.lp);
    press = null; drag = null; setBinHot(false);
  }
  function tapPart(p) {
    var wasSel = isSel(p);
    st.sel = { kind: 'part', id: p.id };
    if (p.burnt) { replacePart(p); return; }
    if (p.type === 'switch' || p.type === 'spdt') togglePart(p);
    else if (p.type === 'resistor' && !p.fixed && wasSel) cycleValue(p);
    else if (p.type === 'tester' && p.obj) { p.obj = null; _sound('click'); changed(); }
    else if (wasSel && canFlip(p) && ['aa', 'nine', 'led', 'motor', 'buzzer'].indexOf(p.type) >= 0) flipPart(p);
    else _sound('click');
    refreshToolbar();
  }
  function setBinHot(on) {
    var b = document.getElementById('cl-bin');
    if (b) b.classList.toggle('hot', !!on);
  }

  // tray + shelf drags (DOM → board)
  var tdrag = null;
  function trayDown(e, item, isObj) {
    if (tdrag) return;
    audioInit();
    var btn = e.currentTarget;
    if (btn.disabled) return;
    try { btn.setPointerCapture(e.pointerId); } catch (er) {}
    tdrag = { id: e.pointerId, item: item, obj: isObj, btn: btn, sx: e.clientX, sy: e.clientY, moved: false, ghost: null };
  }
  function trayMove(e) {
    if (!tdrag || e.pointerId !== tdrag.id) return;
    if (!tdrag.moved && Math.hypot(e.clientX - tdrag.sx, e.clientY - tdrag.sy) > 8) {
      tdrag.moved = true;
      if (tdrag.item === 'wire') { tdrag.moved = false; return; }
      var g = document.createElement('canvas');
      g.className = 'cl-float';
      g.style.width = '84px'; g.style.height = '60px';
      document.body.appendChild(g);
      A.thumb(g, tdrag.obj ? 'obj:' + tdrag.item : tdrag.item);
      tdrag.ghost = g;
    }
    if (!tdrag.moved) return;
    tdrag.ghost.style.transform = 'translate(' + (e.clientX - 42) + 'px,' + (e.clientY - 70) + 'px)';
    var r = V.canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (!tdrag.obj && overBoard(x, y) && x >= 0 && y >= 0 && x <= r.width && y <= r.height) {
      var dir = tdrag.lastDir || 0;
      var cand = snapPart(tdrag.item, dir, x, y);
      drag = { mode: 'tray', cand: cand, candOk: canPlace(st.circ, cand, -1) };
      tdrag.ghost.style.opacity = '0.35';
    } else {
      if (drag && drag.mode === 'tray') drag = null;
      tdrag.ghost.style.opacity = '1';
    }
  }
  function trayUp(e) {
    if (!tdrag || e.pointerId !== tdrag.id) return;
    var td = tdrag;
    tdrag = null;
    if (td.ghost && td.ghost.parentNode) { td.ghost.parentNode.removeChild(td.ghost); ZsCanvas.release(td.ghost); }
    var dg = drag && drag.mode === 'tray' ? drag : null;
    if (drag && drag.mode === 'tray') drag = null;
    if (td.obj) {
      if (!td.moved) { placeObject(td.item); return; }
      var r = V.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var hit = hitPart(x, y);
      if (!hit || hit.type !== 'tester') {
        var best = null, bd = V.S * 0.7;
        partsOf(st.circ, 'tester').forEach(function(tp) { var f = partFrame(tp), d = Math.hypot(f.x - x, f.y - y); if (d < bd) { bd = d; best = tp; } });
        hit = best;
      }
      if (hit) placeObject(td.item, hit); else _toast('Drop it on the brass plates of the tester.');
      return;
    }
    if (td.item === 'wire') {
      st.wireColor++;
      refreshTray();
      _toast('To lay a wire, drag from one brass post to another.');
      return;
    }
    if (remaining(td.item) <= 0) { _toast('None left in the tray.'); return; }
    if (!td.moved) { autoPlace(td.item); return; }
    if (dg && dg.cand && dg.candOk) {
      pushHist();
      var p = newPart(td.item, dg.cand.x, dg.cand.y, dg.cand.dir);
      st.circ.parts.push(p);
      st.sel = { kind: 'part', id: p.id };
      _sound('click');
      changed();
    } else if (dg && dg.cand) _toast('No room there — try a free spot between two posts.');
  }
  function autoPlace(type) {
    var c = st.circ, cands = [], used = usedPosts(), x, y, dir;
    var cx = (c.cols - 1) / 2, cy = (c.rows - 1) / 2;
    for (x = 0; x < c.cols; x++) for (y = 0; y < c.rows; y++) for (dir = 0; dir < 2; dir++) {
      var p = { type: type, x: x, y: y, dir: dir };
      if (!canPlace(c, p, -1)) continue;
      var t = terminals(p), free = t.every(function(q) { return !used[q[0] + ',' + q[1]]; });
      var pc = partCenter(p);
      cands.push({ p: p, score: (free ? 0 : 100) + Math.hypot(pc[0] - cx, pc[1] - cy) + dir * 0.01 });
    }
    if (!cands.length) { _toast('The board is full.'); return; }
    cands.sort(function(a, b) { return a.score - b.score; });
    var best = cands[0].p;
    pushHist();
    var np = newPart(type, best.x, best.y, best.dir);
    st.circ.parts.push(np);
    st.sel = { kind: 'part', id: np.id };
    _sound('click');
    changed();
  }

  // ---------------- screens ----------------
  function root() { return document.getElementById('cl-wrap'); }
  function setPlaying(on) { document.body.classList.toggle('cl-playing', !!on); }
  function leavePlay() {
    stopLoop(); audioSilence();
    if (st.pendingWin) { clearTimeout(st.pendingWin); st.pendingWin = null; }
    setPlaying(false);
    st.screen = 'menu';
    if (V.ro) { try { V.ro.disconnect(); } catch (e) {} V.ro = null; }
    ZsCanvas.release(V.board); V.board = null;
    V.canvas = null; V.ctx = null;
  }

  function showHome() {
    if (st.screen === 'play') leavePlay();
    st.screen = 'home';
    var d = _load(), u = _user();
    if (!d.facts || d.facts.indexOf('safety') < 0) { unlockFact('safety'); unlockFact('volta'); d = _load(); }
    var done = Object.keys(d.levels || {}).length;
    ZsCanvas.releaseIn(root()); // free the old screen's canvases now
    root().innerHTML =
      '<header class="cl-header">' +
        '<canvas class="cl-hero" id="cl-hero" aria-hidden="true"></canvas>' +
        '<h1>Circuit Lab</h1>' +
        '<p class="cl-sub">Laboratorio de circuitos · Build real circuits and watch them work' + (u ? ', ' + _esc(u.name) : '') + '!</p>' +
        '<div class="cl-home-stat">★ ' + totalStars(d) + ' / ' + (D.LEVELS.length * 3) + ' stars · ' + done + ' of ' + D.LEVELS.length + ' challenges · ' + (d.facts || []).length + ' fact cards</div>' +
      '</header>' +
      '<div class="cl-home-grid">' +
        '<button type="button" class="cl-mode" data-go="levels"><span class="cl-mode-ic">🏆</span><span class="cl-mode-t">Challenges</span><span class="cl-mode-d">16 circuit puzzles, from "light a bulb" to a two-way stair switch.</span></button>' +
        '<button type="button" class="cl-mode" data-go="free"><span class="cl-mode-ic">🛠️</span><span class="cl-mode-t">Free Build</span><span class="cl-mode-d">Every part on the bench. Build anything and see what happens.</span></button>' +
        '<button type="button" class="cl-mode" data-go="facts"><span class="cl-mode-ic">📇</span><span class="cl-mode-t">Fact cards</span><span class="cl-mode-d">Volta, Edison, Faraday — and what volts, amps and ohms mean.</span></button>' +
      '</div>' +
      '<div class="cl-safety"><b>🏠 Safety first.</b> These little batteries are safe to play with. Wall sockets are not: in Chile they carry 220 volts. Never put anything into a socket, and keep electrical things away from water.</div>';
    root().querySelectorAll('[data-go]').forEach(function(b) {
      b.addEventListener('click', function() {
        _sound('click');
        var g = b.getAttribute('data-go');
        if (g === 'levels') showLevels(); else if (g === 'free') startFree(); else showFacts();
      });
    });
    drawHero();
    window.scrollTo(0, 0);
  }

  function drawHero() {
    var c = document.getElementById('cl-hero');
    if (!c) return;
    var w = c.clientWidth || 300, h = c.clientHeight || 150, dpr = ZsCanvas.dpr();
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    var ctx = ZsCanvas.get2d(c);
    if (!ctx) return;
    A.setDpr(dpr);
    var u = Math.min(h * 0.72, w * 0.3);
    var x0 = w / 2 - u * 1.1, y0 = h / 2 - u * 0.5;
    var posts = [{ x: x0, y: y0 }, { x: x0, y: y0 + u }, { x: x0 + u * 2.2, y: y0 }, { x: x0 + u * 2.2, y: y0 + u }];
    var board = A.makeBoard(w, h, { x: x0 - u * 0.5, y: y0 - u * 0.45, w: u * 3.2, h: u * 1.9 }, posts, [], u);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(board, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    function wire(a, b, col, bow) {
      var pts = [], cum = [0], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      for (var i = 0; i <= 24; i++) {
        var t = i / 24, s = Math.sin(t * Math.PI) * bow;
        pts.push(a.x + dx * t + nx * s, a.y + dy * t + ny * s);
        if (i) cum.push(cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]));
      }
      A.drawWire(ctx, pts, cum, col, u);
      return { pts: pts, cum: cum };
    }
    var w1 = wire(posts[0], posts[2], '#d62828', -u * 0.22), w2 = wire(posts[1], posts[3], '#222831', u * 0.22);
    ctx.save(); ctx.translate(x0, y0 + u / 2); ctx.rotate(Math.PI / 2); A.drawPart(ctx, 'aa', u, {}); ctx.restore();
    ctx.save(); ctx.translate(x0 + u * 2.2, y0 + u / 2); ctx.rotate(Math.PI / 2); A.drawPart(ctx, 'bulb', u, { glow: 1.05 }); ctx.restore();
    [w1, w2].forEach(function(g) { for (var d = 6; d < g.cum[g.cum.length - 1]; d += u * 0.3) { var p = A.pointAt(g.pts, g.cum, d); A.dot(ctx, p.x, p.y, Math.max(2, u * 0.032)); } });
    posts.forEach(function(p) { A.nut(ctx, p.x, p.y, u); });
    ctx.globalCompositeOperation = 'lighter';
    A.glowBulb(ctx, x0 + u * 2.2, y0 + u / 2, u, 1.05);
    ctx.globalCompositeOperation = 'source-over';
  }

  function showLevels() {
    if (st.screen === 'play') leavePlay();
    st.screen = 'levels';
    var d = _load(), L = d.levels || {};
    var young = _young();
    var firstOpen = -1;
    D.LEVELS.forEach(function(l, i) { if (firstOpen < 0 && !L[l.id]) firstOpen = i; });
    var tiers = [
      { t: 1, h: 'Start here · Para empezar', n: 'Loops, switches, series and parallel.' },
      { t: 2, h: 'Next steps · Siguiente nivel', n: 'Batteries, faults, motors and short circuits.' },
      { t: 3, h: 'Big challenges · Grandes desafíos', n: young ? 'For older kids — but anyone can try!' : 'LEDs, resistors and real house wiring.' }
    ];
    var html = '<div class="cl-sechead"><button type="button" class="cl-back" data-act="home" aria-label="Back to Circuit Lab home">←</button><h2>Challenges</h2><span class="cl-total">★ ' + totalStars(d) + ' / ' + D.LEVELS.length * 3 + '</span></div>';
    tiers.forEach(function(t) {
      html += '<section class="cl-tier"><h3>' + t.h + '</h3><p>' + t.n + '</p><div class="cl-level-grid">';
      D.LEVELS.forEach(function(l, i) {
        if (l.tier !== t.t) return;
        var s = (L[l.id] && L[l.id].stars) || 0;
        var stars = '';
        for (var k = 0; k < 3; k++) stars += '<span class="' + (k < s ? 'on' : '') + '">★</span>';
        html += '<button type="button" class="cl-level' + (i === firstOpen ? ' next' : '') + (L[l.id] ? ' done' : '') + '" data-li="' + i + '">' +
          '<canvas class="cl-level-ic" data-ic="' + l.icon + '" aria-hidden="true"></canvas>' +
          '<span class="cl-level-num">' + (i + 1) + '</span>' +
          '<span class="cl-level-t">' + _esc(l.title) + '</span>' +
          '<span class="cl-level-es">' + _esc(l.es) + '</span>' +
          '<span class="cl-level-stars" aria-label="' + s + ' of 3 stars">' + stars + '</span>' +
          (i === firstOpen ? '<span class="cl-level-next">Next up</span>' : '') +
        '</button>';
      });
      html += '</div></section>';
    });
    ZsCanvas.releaseIn(root()); // free the old screen's canvases now
    root().innerHTML = html;
    root().querySelector('[data-act="home"]').addEventListener('click', function() { _sound('click'); showHome(); });
    root().querySelectorAll('[data-li]').forEach(function(b) {
      b.addEventListener('click', function() { _sound('click'); startLevel(+b.getAttribute('data-li')); });
    });
    root().querySelectorAll('canvas[data-ic]').forEach(function(c) {
      var ic = c.getAttribute('data-ic');
      A.thumb(c, ic, ic === 'bulb' ? { glow: 0.9 } : ic === 'led' ? { glow: 0.8 } : ic === 'tester' ? { obj: 'coin' } : ic === 'switch' ? { open: 0.6 } : {});
    });
    window.scrollTo(0, 0);
  }

  function showFacts() {
    if (st.screen === 'play') leavePlay();
    st.screen = 'facts';
    var d = _load(), have = d.facts || [];
    var html = '<div class="cl-sechead"><button type="button" class="cl-back" data-act="home" aria-label="Back to Circuit Lab home">←</button><h2>Fact cards</h2><span class="cl-total">' + have.length + ' / ' + D.FACT_ORDER.length + '</span></div><div class="cl-facts">';
    D.FACT_ORDER.forEach(function(id) {
      var f = D.FACTS[id], open = have.indexOf(id) >= 0;
      var from = '';
      if (!open) {
        var lv = D.LEVELS.filter(function(l) { return l.fact === id; })[0];
        from = lv ? 'Solve “' + lv.title + '” to unlock.' : 'Discover it in Free Build.';
      }
      html += '<article class="cl-factcard' + (open ? '' : ' locked') + '">' +
        '<div class="cl-fact-h">' + (open ? f.icon : '🔒') + ' ' + _esc(open ? f.title : '???') + '</div>' +
        '<p>' + _esc(open ? f.text : from) + '</p></article>';
    });
    html += '</div>';
    ZsCanvas.releaseIn(root()); // free the old screen's canvases now
    root().innerHTML = html;
    root().querySelector('[data-act="home"]').addEventListener('click', function() { _sound('click'); showHome(); });
    window.scrollTo(0, 0);
  }

  function buildCircuit(lvl) {
    var c = { cols: lvl.cols, rows: lvl.rows, parts: [], wires: [] }, ci = 0;
    st.nextId = 1;
    (lvl.parts || []).forEach(function(p) {
      var np = { id: st.nextId++, type: p.type, x: p.x, y: p.y, dir: p.dir, pre: true, fixed: !!p.fixed, flip: !!p.flip };
      if (p.type === 'switch') np.closed = !!p.closed;
      if (p.type === 'spdt') np.state = p.state || 0;
      if (p.type === 'resistor') np.ohms = p.ohms || D.PARTS.resistor.ohms;
      c.parts.push(np);
    });
    (lvl.wires || []).forEach(function(w, i) {
      c.wires.push({ id: st.nextId++, x1: w[0], y1: w[1], x2: w[2], y2: w[3], pre: true, color: A.WIRE_COLORS[ci++ % 5], bow: i % 2 ? -1 : 1 });
    });
    if (lvl.randomBreak && c.wires.length) c.wires[Math.floor(Math.random() * c.wires.length)].broken = true;
    st.wireColor = ci;
    return c;
  }

  function startLevel(i) {
    var lvl = D.LEVELS[i];
    if (!lvl) { showLevels(); return; }
    st.mode = 'level'; st.lvl = lvl; st.li = i;
    st.circ = buildCircuit(lvl);
    resetSession();
    if (_young() && lvl.hints && lvl.hints.length) st.hintShown = 0;
    openPlay();
    if (lvl.goal === 'reverse') {
      var m = partsOf(st.circ, 'motor')[0];
      st.initSign = st.sim.part[m.id].i >= 0 ? 1 : -1;
      st.initMotorDir = m.dir;
    }
  }
  function startFree() {
    st.mode = 'free'; st.lvl = null; st.li = -1;
    if (!st.freeCirc) {
      st.nextId = 1;
      var c = { cols: D.FREE.cols, rows: D.FREE.rows, parts: [], wires: [] };
      st.freeCirc = c;
      st.freeNext = st.nextId;
    }
    st.circ = st.freeCirc;
    st.nextId = st.freeNext || st.nextId;
    resetSession();
    openPlay();
  }
  function resetSession() {
    st.hist = []; st.hints = 0; st.hintShown = 0; st.showGhost = false; st.sel = null; st.won = false;
    if (st.pendingWin) { clearTimeout(st.pendingWin); st.pendingWin = null; }
    st.tested = {}; st.anim = {}; st.fx = []; st.lastShort = false; st.goalRes = null;
    var d = _load();
    st.electrons = !!d.electrons; st.mute = !!d.mute;
  }

  function trayItems() {
    if (st.mode === 'free') return D.FREE_TRAY.slice();
    var t = st.lvl.tray || {}, out = [];
    D.FREE_TRAY.forEach(function(k) { if (t[k]) out.push(k); });
    return out;
  }

  function openPlay() {
    st.screen = 'play';
    setPlaying(true);
    var lvl = st.lvl, young = _young();
    var head = lvl
      ? '<div class="cl-goal-title"><span class="cl-chip">Challenge ' + (st.li + 1) + '</span> ' + _esc(lvl.title) + ' <span class="cl-es">· ' + _esc(lvl.es) + '</span></div>' +
        '<div class="cl-goal-text">' + _esc(young && lvl.young ? lvl.young : lvl.text) + '</div>'
      : '<div class="cl-goal-title"><span class="cl-chip">Free Build</span> Construcción libre</div>' +
        '<div class="cl-goal-text">Drag parts onto the board, drag from post to post for wires. Try series, parallel, a short circuit — or the 9 V battery on a bulb!</div>';
    ZsCanvas.releaseIn(root()); // free the old screen's canvases now
    root().innerHTML =
      '<div class="cl-play">' +
        '<div class="cl-topbar">' +
          '<button type="button" class="cl-ibtn" id="cl-back" aria-label="Back">←</button>' +
          '<div class="cl-topbar-sp"></div>' +
          '<button type="button" class="cl-ibtn cl-hintbtn" id="cl-hintbtn" aria-label="Show a hint">💡<span class="cl-ilabel">Hint</span></button>' +
          '<button type="button" class="cl-ibtn" id="cl-undo" aria-label="Undo">↶<span class="cl-ilabel">Undo</span></button>' +
          '<button type="button" class="cl-ibtn" id="cl-reset" aria-label="Start over">↺<span class="cl-ilabel">Reset</span></button>' +
          '<button type="button" class="cl-ibtn cl-flow" id="cl-flow" aria-label="Switch between conventional current and electron flow"></button>' +
          '<button type="button" class="cl-ibtn" id="cl-mute" aria-label="Sound on or off"></button>' +
        '</div>' +
        '<div class="cl-goal">' + head +
          (lvl ? '<div class="cl-status" id="cl-status" aria-live="polite"></div>' : '<div class="cl-status" id="cl-status" aria-live="polite"></div>') +
          '<div class="cl-hint" id="cl-hint" hidden></div>' +
        '</div>' +
        '<div class="cl-stage" id="cl-stage">' +
          '<canvas id="cl-canvas" aria-label="Circuit board. Drag parts from the tray and drag between posts to lay wires." role="img"></canvas>' +
          '<div class="cl-toolbar" id="cl-toolbar" hidden></div>' +
          '<div class="cl-banner" id="cl-banner" hidden></div>' +
        '</div>' +
        '<div class="cl-shelf" id="cl-shelf" hidden></div>' +
        '<div class="cl-tray" id="cl-tray"></div>' +
      '</div>';
    V.canvas = document.getElementById('cl-canvas');
    V.canvas.addEventListener('pointerdown', onDown);
    V.canvas.addEventListener('pointermove', onMove);
    V.canvas.addEventListener('pointerup', onUp);
    V.canvas.addEventListener('pointercancel', onCancel);
    V.canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    document.getElementById('cl-back').addEventListener('click', function() { _sound('click'); if (st.mode === 'free') { st.freeNext = st.nextId; showHome(); } else showLevels(); });
    document.getElementById('cl-hintbtn').addEventListener('click', showHint);
    document.getElementById('cl-undo').addEventListener('click', undo);
    document.getElementById('cl-reset').addEventListener('click', resetBoard);
    document.getElementById('cl-flow').addEventListener('click', toggleFlow);
    document.getElementById('cl-mute').addEventListener('click', toggleMute);
    if (lvl && young && lvl.hints && lvl.hints.length) { st.hintShown = 1; }
    renderGoalHint();
    if (typeof ResizeObserver !== 'undefined') {
      V.ro = new ResizeObserver(function() { layout(); });
      V.ro.observe(document.getElementById('cl-stage'));
    }
    layout();
    changed();
    buildTray();
    startLoop();
    window.scrollTo(0, 0);
  }

  function resetBoard() {
    var go = function() {
      if (st.mode === 'level') startLevel(st.li);
      else { st.freeCirc = null; startFree(); }
    };
    if (typeof ZsDialog !== 'undefined' && ZsDialog.confirm) {
      ZsDialog.confirm({ title: 'Start over?', message: st.mode === 'level' ? 'Put the board back the way the challenge started?' : 'Clear the whole board?', confirmText: 'Start over', cancelText: 'Keep it' })
        .then(function(ok) { if (ok) go(); });
    } else go();
  }
  function toggleFlow() {
    st.electrons = !st.electrons;
    var d = _load(); d.electrons = st.electrons; _save(d);
    _sound('click');
    if (st.electrons) {
      _toast('Electron flow: blue dots are electrons drifting from − to +.');
      if (unlockFact('electrons')) setTimeout(function() { _toast('New fact card: Which way does current flow?'); }, 2600);
    } else _toast('Conventional current: gold dots flow from + to −, the way engineers draw it.');
    refreshTopbar();
  }
  function toggleMute() {
    st.mute = !st.mute;
    var d = _load(); d.mute = st.mute; _save(d);
    if (!st.mute) audioInit();
    refreshTopbar();
  }
  function refreshTopbar() {
    var f = document.getElementById('cl-flow'), m = document.getElementById('cl-mute');
    if (f) { f.innerHTML = st.electrons ? '<span class="cl-dotic e"></span><span class="cl-ilabel">e⁻ flow</span>' : '<span class="cl-dotic"></span><span class="cl-ilabel">+ → −</span>'; f.setAttribute('aria-pressed', st.electrons ? 'true' : 'false'); }
    if (m) { m.textContent = st.mute ? '🔇' : '🔊'; m.setAttribute('aria-pressed', st.mute ? 'true' : 'false'); }
  }

  var LABEL = { wire: 'Wire', aa: 'AA', nine: '9 V', bulb: 'Bulb', switch: 'Switch', spdt: '2-way', buzzer: 'Buzzer', motor: 'Motor', resistor: 'Resistor', led: 'LED', tester: 'Tester' };
  function buildTray() {
    var tray = document.getElementById('cl-tray');
    if (!tray) return;
    var items = trayItems(), html = '';
    items.forEach(function(k) {
      var P = D.PARTS[k];
      var nm = k === 'wire' ? 'Wire · Cable' : P.name + ' · ' + P.es;
      html += '<button type="button" class="cl-titem" data-item="' + k + '" aria-label="' + _esc(nm) + '" title="' + _esc(nm) + '">' +
        '<canvas class="cl-tthumb" data-th="' + k + '"></canvas><span class="cl-tlabel">' + LABEL[k] + '</span><span class="cl-tcount" data-count="' + k + '"></span></button>';
    });
    html += '<button type="button" class="cl-titem cl-bin" id="cl-bin" aria-label="Bin: drag a part here, or tap to remove the selected part"><span class="cl-bin-ic" aria-hidden="true"></span><span class="cl-tlabel">Bin</span></button>';
    ZsCanvas.releaseIn(tray);
    tray.innerHTML = html;
    tray.querySelectorAll('.cl-titem[data-item]').forEach(function(b) {
      var k = b.getAttribute('data-item');
      b.addEventListener('pointerdown', function(e) { trayDown(e, k, false); });
      b.addEventListener('pointermove', trayMove);
      b.addEventListener('pointerup', trayUp);
      b.addEventListener('pointercancel', function() { if (tdrag && tdrag.ghost && tdrag.ghost.parentNode) tdrag.ghost.parentNode.removeChild(tdrag.ghost); tdrag = null; if (drag && drag.mode === 'tray') drag = null; });
      b.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (k === 'wire') _toast('Drag from one brass post to another to lay a wire.'); else if (remaining(k) > 0) autoPlace(k); } });
    });
    document.getElementById('cl-bin').addEventListener('click', function() {
      if (st.sel) removeItem(st.sel.kind, st.sel.id); else _toast('Drag a part here to throw it away, or select something first.');
    });
    refreshTray();
    refreshShelf();
  }
  function refreshTray() {
    var tray = document.getElementById('cl-tray');
    if (!tray) return;
    tray.querySelectorAll('canvas[data-th]').forEach(function(c) {
      var k = c.getAttribute('data-th');
      A.thumb(c, k, k === 'wire' ? { color: A.WIRE_COLORS[st.wireColor % A.WIRE_COLORS.length] } : k === 'switch' ? { open: 0.7 } : {});
    });
    A.setDpr(V.dpr);
    tray.querySelectorAll('[data-count]').forEach(function(el) {
      var k = el.getAttribute('data-count'), n = remaining(k);
      el.textContent = n === Infinity ? '' : '×' + Math.max(0, n);
      el.hidden = n === Infinity;
      var btn = el.parentNode;
      btn.classList.toggle('empty', n <= 0);
    });
  }
  function refreshShelf() {
    var sh = document.getElementById('cl-shelf');
    if (!sh) return;
    var has = partsOf(st.circ, 'tester').length > 0;
    sh.hidden = !has;
    if (!has) { sh.innerHTML = ''; return; }
    var onBoard = {};
    partsOf(st.circ, 'tester').forEach(function(t) { if (t.obj) onBoard[t.obj] = 1; });
    if (!sh.firstChild) {
      var html = '<span class="cl-shelf-h">Test objects</span>';
      D.MATERIALS.forEach(function(m) {
        html += '<button type="button" class="cl-obj" data-obj="' + m.id + '" aria-label="' + _esc(m.name + ' · ' + m.es) + '" title="' + _esc(m.name + ' · ' + m.es) + '"><canvas data-oth="' + m.id + '"></canvas><span class="cl-obj-n">' + _esc(m.name) + '</span><span class="cl-obj-r" data-res="' + m.id + '"></span></button>';
      });
      ZsCanvas.releaseIn(sh);
      sh.innerHTML = html;
      sh.querySelectorAll('[data-obj]').forEach(function(b) {
        var id = b.getAttribute('data-obj');
        b.addEventListener('pointerdown', function(e) { trayDown(e, id, true); });
        b.addEventListener('pointermove', trayMove);
        b.addEventListener('pointerup', trayUp);
        b.addEventListener('pointercancel', function() { if (tdrag && tdrag.ghost && tdrag.ghost.parentNode) tdrag.ghost.parentNode.removeChild(tdrag.ghost); tdrag = null; });
        b.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); placeObject(id); } });
      });
      sh.querySelectorAll('canvas[data-oth]').forEach(function(c) { A.thumb(c, 'obj:' + c.getAttribute('data-oth')); });
      A.setDpr(V.dpr);
    }
    sh.querySelectorAll('[data-obj]').forEach(function(b) {
      var id = b.getAttribute('data-obj'), r = st.tested[id];
      b.classList.toggle('placed', !!onBoard[id]);
      var res = b.querySelector('[data-res]');
      res.textContent = r === 'conductor' ? '✓' : r === 'partial' ? '≈' : r === 'insulator' ? '✗' : '';
      res.className = 'cl-obj-r ' + (r || '');
    });
  }

  function fmtI(i) { i = Math.abs(i); return i < 0.1 ? (i * 1000).toFixed(i < 0.01 ? 1 : 0) + ' mA' : i.toFixed(2) + ' A'; }
  function fmtV(v) { return Math.abs(v).toFixed(2) + ' V'; }
  function reading(p) {
    var r = st.sim && st.sim.part[p.id];
    if (!r) return '';
    var young = _young(), num = '', word = '';
    switch (p.type) {
      case 'aa': case 'nine': {
        var out = Math.max(0, r.out || 0);
        word = r.short ? 'Short circuit — getting hot!' : out > 0.001 ? 'Pushing current round the loop' : 'Not in a complete loop';
        num = fmtV(r.v) + ' · ' + fmtI(r.i);
        break;
      }
      case 'bulb':
        word = p.burnt ? 'Burnt out — tap to replace' : r.glow > 0.9 ? 'Shining brightly' : r.lit ? 'Glowing softly' : 'Off — no current';
        num = fmtV(r.v) + ' · ' + fmtI(r.i) + ' · ' + (r.p || 0).toFixed(2) + ' W';
        break;
      case 'led':
        word = p.burnt ? 'Burnt out — tap to replace' : r.lit ? 'Lit!' : (r.v < -0.5 ? 'Backwards — no current can pass' : 'Off');
        num = fmtV(r.v) + ' · ' + fmtI(r.i);
        break;
      case 'motor': word = r.spin ? (r.i > 0 ? 'Spinning clockwise' : 'Spinning anticlockwise') : 'Still'; num = fmtV(r.v) + ' · ' + fmtI(r.i); break;
      case 'buzzer': word = r.on ? 'Buzzing' : 'Quiet'; num = fmtV(r.v) + ' · ' + fmtI(r.i); break;
      case 'resistor': word = (p.ohms || 10) + ' Ω' + (p.fixed ? '' : ' — tap again to change'); num = fmtV(r.v) + ' · ' + fmtI(r.i) + ' · V = I × R'; break;
      case 'switch': word = p.closed ? 'Closed (ON) — current can pass' : 'Open (OFF) — gap in the loop'; num = fmtI(r.i); break;
      case 'spdt': word = 'Blade on side ' + (p.state ? 'B' : 'A') + ' — tap to flip'; num = fmtI(r.i); break;
      case 'tester': {
        var m = p.obj ? material(p.obj) : null;
        word = m ? m.name + ': ' + (m.kind === 'conductor' ? 'conductor' : m.kind === 'partial' ? 'conducts a little' : 'insulator') : 'Empty — drop an object across the plates';
        num = fmtI(r.i);
        break;
      }
    }
    return '<span class="cl-read-w">' + word + '</span>' + (young ? '' : '<span class="cl-read-n">' + num + '</span>');
  }
  function refreshToolbar() {
    var tb = document.getElementById('cl-toolbar');
    if (!tb) return;
    var sel = st.sel, html = '';
    if (sel && sel.kind === 'part') {
      var p = findPart(sel.id);
      if (!p) { st.sel = null; tb.hidden = true; return; }
      var P = D.PARTS[p.type];
      html = '<div class="cl-tb-info"><b>' + P.name + '</b> <span class="cl-es">· ' + P.es + '</span><div class="cl-read">' + reading(p) + '</div></div><div class="cl-tb-btns">';
      if (p.burnt) html += '<button type="button" class="cl-tbtn" data-tb="replace">New ' + (p.type === 'led' ? 'LED' : 'bulb') + '</button>';
      if (p.type === 'switch' || p.type === 'spdt') html += '<button type="button" class="cl-tbtn" data-tb="toggle">' + (p.type === 'switch' ? (p.closed ? 'Open' : 'Close') : 'Flip blade') + '</button>';
      if (p.type === 'resistor' && !p.fixed) html += '<button type="button" class="cl-tbtn" data-tb="value">Ω ' + (p.ohms || 10) + ' →</button>';
      if (p.type !== 'spdt' && canFlip(p) && p.type !== 'bulb' && p.type !== 'resistor' && p.type !== 'switch' && p.type !== 'tester') html += '<button type="button" class="cl-tbtn" data-tb="flip">⇄ Flip</button>';
      if (!p.fixed) html += '<button type="button" class="cl-tbtn" data-tb="turn">↻ Turn</button><button type="button" class="cl-tbtn danger" data-tb="del" aria-label="Remove part">🗑</button>';
      else html += '<span class="cl-fixed">📌 fixed</span>';
      html += '<button type="button" class="cl-tbtn ghost" data-tb="close" aria-label="Close">✕</button></div>';
    } else if (sel && sel.kind === 'wire') {
      var w = findWire(sel.id);
      if (!w) { st.sel = null; tb.hidden = true; return; }
      var r = st.sim && st.sim.wire[w.id];
      html = '<div class="cl-tb-info"><b>Wire</b> <span class="cl-es">· Cable</span><div class="cl-read"><span class="cl-read-w">' + (r && Math.abs(r.i) > 0.0005 ? 'Current flowing' : 'No current') + ' · drag a blue end to move it</span>' + (_young() || !r ? '' : '<span class="cl-read-n">' + fmtI(r.i) + '</span>') + '</div></div>' +
        '<div class="cl-tb-btns"><button type="button" class="cl-tbtn" data-tb="color">🎨 Colour</button><button type="button" class="cl-tbtn danger" data-tb="del" aria-label="Remove wire">🗑</button><button type="button" class="cl-tbtn ghost" data-tb="close" aria-label="Close">✕</button></div>';
    }
    tb.innerHTML = html;
    tb.hidden = !html;
    if (html) {
      var fy = 0;
      if (sel.kind === 'part' && findPart(sel.id)) fy = partFrame(findPart(sel.id)).y;
      else if (sel.kind === 'wire' && V.geo[sel.id]) fy = A.pointAt(V.geo[sel.id].pts, V.geo[sel.id].cum, V.geo[sel.id].L / 2).y;
      var banner = document.getElementById('cl-banner');
      tb.classList.toggle('bottom', fy < V.h * 0.5 || !!(banner && !banner.hidden));
    }
    tb.querySelectorAll('[data-tb]').forEach(function(b) {
      b.addEventListener('click', function() {
        var a = b.getAttribute('data-tb'), it = st.sel;
        if (!it) return;
        var p2 = it.kind === 'part' ? findPart(it.id) : null, w2 = it.kind === 'wire' ? findWire(it.id) : null;
        if (a === 'close') { st.sel = null; refreshToolbar(); return; }
        if (a === 'del') removeItem(it.kind, it.id);
        else if (a === 'flip' && p2) flipPart(p2);
        else if (a === 'turn' && p2) turnPart(p2);
        else if (a === 'toggle' && p2) togglePart(p2);
        else if (a === 'value' && p2) cycleValue(p2);
        else if (a === 'replace' && p2) replacePart(p2);
        else if (a === 'color' && w2) { var i = A.WIRE_COLORS.indexOf(w2.color); w2.color = A.WIRE_COLORS[(i + 1) % A.WIRE_COLORS.length]; _sound('click'); }
        refreshToolbar();
      });
    });
  }
  function refreshUI() {
    refreshToolbar();
    refreshTray();
    refreshShelf();
    refreshTopbar();
    var bn = document.getElementById('cl-banner');
    if (bn) {
      if (st.sim && st.sim.short) {
        bn.innerHTML = '<b>⚠️ Short circuit</b> — the battery drains fast and gets hot. Give the current a path through a bulb or other part, or open the switch.';
        bn.hidden = false;
      } else bn.hidden = true;
    }
    if (st.mode === 'free') {
      var s = document.getElementById('cl-status');
      if (s) {
        var lit = partsOf(st.circ, 'bulb').filter(function(b) { return st.sim.part[b.id].lit; }).length;
        var amps = st.sim.batI;
        s.textContent = st.circ.parts.length ? (lit ? lit + ' bulb' + (lit > 1 ? 's' : '') + ' lit · ' : '') + (amps > 0.0005 ? 'battery current ' + fmtI(amps) : 'no current flowing yet') : '';
        s.className = 'cl-status' + (st.sim.short ? ' warn' : '');
      }
    }
  }

  // ---------------- boot ----------------
  function open() {
    if (!root()) return;
    showHome();
    document.addEventListener('visibilitychange', function() { if (document.hidden) audioSilence(); });
    window.addEventListener('resize', function() {
      if (st.screen === 'play' && typeof ResizeObserver === 'undefined') layout();
      if (st.screen === 'home') drawHero();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open);
  else open();

  return {
    open: open,
    // Pure helpers + hooks for tests / debugging.
    _t: {
      solve: solve, goals: GOALS, levels: D.LEVELS, totalStars: totalStars,
      state: function() { return st; },
      startLevel: startLevel, startFree: startFree,
      addWire: function(x1, y1, x2, y2) { return addWire([x1, y1], [x2, y2]); },
      addPart: function(type, x, y, dir) {
        var p = newPart(type, x, y, dir || 0);
        if (!canPlace(st.circ, p, -1)) return null;
        pushHist(); st.circ.parts.push(p); changed(); return p.id;
      },
      tap: function(id) { var p = findPart(id); if (p) tapPart(p); },
      flip: function(id) { var p = findPart(id); if (p) flipPart(p); },
      setOhms: function(id, o) { var p = findPart(id); if (p) { p.ohms = o; changed(); } },
      place: function(obj) { placeObject(obj); },
      remove: function(kind, id) { removeItem(kind, id); },
      select: function(kind, id) { st.sel = { kind: kind, id: id }; refreshToolbar(); },
      screen: function(x, y) { return toScreen(x, y); },
      hint: showHint
    }
  };
})();
