/* ================================================================
   MATH GALAXY — learn-by-doing visual models (js/math-galaxy-visuals.js)
   Inline-SVG manipulatives drawn on a dark "holo console":
     tenframe · numberline · blocks (base ten) · array · share (division)
     fraction (bar / pizza) · grid (area) · areamodel · hundred · balance
     tape (bar model) · steps (mission plan) · towers (data) · shape
   MGVis.render(host, spec, opts) → { value(), hint(), reveal(), lock() }
     spec.type picks the model; opts.interactive enables taps/drags;
     opts.onChange(value) fires after the kid changes a build model.
   Every build model also has an HTML button pad so it works with a
   keyboard and with big fingers.
   ================================================================ */

var MGVis = (function() {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var uidN = 0;

  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, str, attrs) {
    var a = { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'class': 'mgv-t' };
    if (attrs) for (var k in attrs) a[k] = attrs[k];
    var t = S('text', a, parent);
    t.textContent = String(str);
    return t;
  }
  function H(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function btn(label, onClick, aria) {
    var b = H('button', 'mgv-btn', label);
    b.type = 'button';
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', function(e) { e.preventDefault(); onClick(); });
    return b;
  }
  function fmt(n) {
    var neg = n < 0; n = Math.abs(n);
    var s = (Math.round(n * 100) / 100).toString();
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + parts.join('.');
  }
  function svgPoint(svg, e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function defs(svg, u) {
    var d = S('defs', null, svg);
    function radial(id, stops) {
      var g = S('radialGradient', { id: u + id, cx: '35%', cy: '30%', r: '75%' }, d);
      stops.forEach(function(s) { S('stop', { offset: s[0], 'stop-color': s[1] }, g); });
    }
    function linear(id, stops, x2, y2) {
      var g = S('linearGradient', { id: u + id, x1: 0, y1: 0, x2: x2 === undefined ? 0 : x2, y2: y2 === undefined ? 1 : y2 }, d);
      stops.forEach(function(s) { S('stop', { offset: s[0], 'stop-color': s[1] }, g); });
    }
    radial('gold', [[0, '#FFF7CC'], [0.35, '#FCD34D'], [0.75, '#F59E0B'], [1, '#B45309']]);
    radial('cyan', [[0, '#E0FBFF'], [0.35, '#67E8F9'], [0.75, '#06B6D4'], [1, '#0E7490']]);
    radial('pink', [[0, '#FFE4F1'], [0.35, '#F9A8D4'], [0.75, '#EC4899'], [1, '#9D174D']]);
    radial('lime', [[0, '#ECFCCB'], [0.35, '#A3E635'], [0.75, '#65A30D'], [1, '#3F6212']]);
    linear('panel', [[0, '#151C45'], [1, '#0A0F2E']]);
    linear('cell', [[0, '#070B22'], [1, '#1A2252']]);
    linear('metal', [[0, '#F4F6FA'], [0.5, '#C9CFDB'], [1, '#7D879A']]);
    linear('metalD', [[0, '#9AA3B5'], [1, '#4B5366']]);
    linear('energy', [[0, '#A7F3D0'], [0.45, '#34D399'], [1, '#047857']]);
    linear('energyB', [[0, '#BFDBFE'], [0.45, '#60A5FA'], [1, '#1D4ED8']]);
    linear('energyP', [[0, '#FBCFE8'], [0.45, '#F472B6'], [1, '#BE185D']]);
    linear('crate', [[0, '#C084FC'], [1, '#6D28D9']]);
    linear('weight', [[0, '#E2E8F0'], [0.5, '#94A3B8'], [1, '#475569']]);
    linear('solar', [[0, '#1E40AF'], [1, '#0B1E5B']]);
    linear('crust', [[0, '#E4A15B'], [1, '#9A5A1D']]);
    var f = S('filter', { id: u + 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
    S('feGaussianBlur', { stdDeviation: 3, result: 'b' }, f);
    var m = S('feMerge', null, f);
    S('feMergeNode', { 'in': 'b' }, m); S('feMergeNode', { 'in': 'SourceGraphic' }, m);
    return d;
  }

  function shell(host, w, h, label, opts) {
    var u = 'mgv' + (++uidN) + '_';
    var wrap = H('div', 'mgv');
    var svg = S('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'mgv-svg', role: 'img', 'aria-label': label, preserveAspectRatio: 'xMidYMid meet' });
    defs(svg, u);
    S('rect', { x: 1, y: 1, width: w - 2, height: h - 2, rx: 18, fill: 'url(#' + u + 'panel)', stroke: '#2B3576', 'stroke-width': 2 }, svg);
    var layer = S('g', null, svg);
    wrap.appendChild(svg);
    var cap = H('div', 'mgv-cap'); cap.setAttribute('aria-live', 'polite');
    wrap.appendChild(cap);
    var ctrl = H('div', 'mgv-ctrl');
    wrap.appendChild(ctrl);
    host.appendChild(wrap);
    if (opts && opts.interactive) svg.classList.add('mgv-live');
    var panel = svg.querySelector('rect');
    return {
      u: u, wrap: wrap, svg: svg, g: layer, cap: cap, ctrl: ctrl,
      url: function(id) { return 'url(#' + u + id + ')'; },
      setView: function(x, y, vw, vh) {
        svg.setAttribute('viewBox', x + ' ' + y + ' ' + vw + ' ' + vh);
        panel.setAttribute('x', x + 1); panel.setAttribute('y', y + 1);
        panel.setAttribute('width', vw - 2); panel.setAttribute('height', vh - 2);
      }
    };
  }

  function orb(g, x, y, r, fill, extra) {
    var grp = S('g', extra || null, g);
    S('circle', { cx: x, cy: y + r * 0.12, r: r, fill: 'rgba(0,0,0,0.35)' }, grp);
    S('circle', { cx: x, cy: y, r: r, fill: fill }, grp);
    S('ellipse', { cx: x - r * 0.3, cy: y - r * 0.38, rx: r * 0.42, ry: r * 0.24, fill: 'rgba(255,255,255,0.55)' }, grp);
    return grp;
  }

  function starPath(x, y, ro, ri) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * r).toFixed(1) + ' ' + (y + Math.sin(a) * r).toFixed(1);
    }
    return d + 'Z';
  }

  /* ============================================================
     TEN-FRAME
     ============================================================ */
  function tenframe(host, spec, opts) {
    var mode = spec.mode || 'count';
    var a = spec.a || 0, b = spec.b || 0;
    var total = mode === 'compare' ? Math.max(a, b) : a + b;
    var frames = spec.frames || ((mode === 'compare' || total > 10 || (mode === 'build' && spec.target > 10)) ? 2 : 1);
    var CELL = 60, GAP = 6, PAD = 12, LBL = mode === 'compare' ? 60 : 0;
    var fw = 5 * CELL + 4 * GAP + 2 * PAD, fh = 2 * CELL + GAP + 2 * PAD;
    var W = fw + LBL + 24, Hh = frames * fh + (frames - 1) * 14 + 24;
    var sh = shell(host, W, Hh, spec.label || 'Ten-frame', opts);
    var live = !!opts.interactive;
    var cells = [];
    for (var f = 0; f < frames; f++) {
      var fx = 12 + LBL, fy = 12 + f * (fh + 14);
      S('rect', { x: fx, y: fy, width: fw, height: fh, rx: 14, fill: '#0B1238', stroke: '#3B4A9A', 'stroke-width': 2 }, sh.g);
      if (LBL) T(sh.g, 12 + LBL / 2, fy + fh / 2, f === 0 ? 'A' : 'B', { 'class': 'mgv-t big' });
      for (var i = 0; i < 10; i++) {
        var cx = fx + PAD + (i % 5) * (CELL + GAP), cy = fy + PAD + Math.floor(i / 5) * (CELL + GAP);
        var rect = S('rect', { x: cx, y: cy, width: CELL, height: CELL, rx: 10, fill: sh.url('cell'), stroke: '#24306E', 'stroke-width': 1.5 }, sh.g);
        cells.push({ x: cx + CELL / 2, y: cy + CELL / 2, rect: rect, frame: f, node: null, kind: null, gone: false, num: 0 });
      }
    }
    var counters = [];
    function put(idx, kind) {
      var c = cells[idx]; if (!c) return;
      c.kind = kind;
      var fill = kind === 'b' ? sh.url('cyan') : sh.url('gold');
      c.node = orb(sh.g, c.x, c.y, 23, fill, { 'class': 'mgv-orb' });
      S('path', { d: starPath(c.x, c.y, 10, 4.2), fill: 'rgba(255,255,255,0.55)', 'pointer-events': 'none' }, c.node);
      c.label = T(c.node, c.x, c.y + 1, '', { 'class': 'mgv-t num' });
      counters.push(c);
      if (live && mode !== 'build') {
        c.node.addEventListener('click', function() { tap(c); });
        c.node.style.cursor = 'pointer';
      }
    }
    function unput(c) { if (c.node) c.node.remove(); c.node = null; c.kind = null; counters.splice(counters.indexOf(c), 1); }
    if (mode === 'compare') {
      for (var i1 = 0; i1 < a; i1++) put(i1, 'a');
      for (var i2 = 0; i2 < b; i2++) put(10 + i2, 'b');
    } else if (mode !== 'build') {
      for (var j = 0; j < a; j++) put(j, 'a');
      for (var k = 0; k < b; k++) put(a + k, 'b');
    }
    var marked = 0;
    function tap(c) {
      if (sh.locked) return;
      if (mode === 'sub') {
        c.gone = !c.gone;
        c.node.classList.toggle('mgv-gone', c.gone);
        var left = counters.filter(function(x) { return !x.gone; }).length;
        var away = counters.length - left;
        sh.cap.textContent = away ? away + ' sent away' : '';
      } else if (!c.num) {
        c.num = ++marked;
        c.label.textContent = c.num;
        c.node.classList.add('mgv-marked');
      }
      if (opts.onChange) opts.onChange(value());
    }
    if (mode === 'build') {
      cells.forEach(function(c, idx) {
        if (!live) return;
        c.rect.style.cursor = 'pointer';
        c.rect.addEventListener('click', function() { if (sh.locked) return; if (c.node) unput(c); else put(idx, 'a'); upd(); });
      });
      if (live) {
        sh.ctrl.appendChild(btn('− Star', function() { var last = counters[counters.length - 1]; if (last && !sh.locked) { unput(last); upd(); } }, 'Remove a star'));
        sh.ctrl.appendChild(btn('+ Star', function() {
          if (sh.locked) return;
          for (var q = 0; q < cells.length; q++) if (!cells[q].node) { put(q, 'a'); break; }
          upd();
        }, 'Add a star'));
      }
    }
    function upd() {
      sh.cap.textContent = mode === 'build' ? counters.length + (counters.length === 1 ? ' star' : ' stars') : '';
      if (opts.onChange) opts.onChange(value());
    }
    if (live && mode === 'sub' && spec.take) sh.cap.textContent = 'Tap ' + spec.take + ' to send them away';
    if (live && (mode === 'count' || mode === 'add')) sh.cap.textContent = 'Tap each star to count it';
    function numberAll() {
      var list = counters.slice().sort(function(p, q) { return cells.indexOf(p) - cells.indexOf(q); });
      if (mode === 'compare') {
        var na = 0, nb = 0;
        list.forEach(function(c) { c.label.textContent = c.frame === 0 ? ++na : ++nb; });
        return;
      }
      var n = 0;
      list.forEach(function(c) { if (!c.gone) c.label.textContent = ++n; else c.label.textContent = ''; });
    }
    function hint() {
      if (mode === 'sub') {
        var need = (spec.take || 0) - counters.filter(function(x) { return x.gone; }).length;
        for (var q = counters.length - 1; q >= 0 && need > 0; q--) if (!counters[q].gone) { counters[q].gone = true; counters[q].node.classList.add('mgv-gone'); need--; }
        numberAll();
        sh.cap.textContent = (spec.a - spec.take) + ' left';
      } else if (mode === 'build') {
        cells.forEach(function(c, idx) { if (idx < spec.target) c.rect.classList.add('mgv-ghost'); });
        sh.cap.textContent = spec.target > 5 ? 'A full row is 5. Then ' + (spec.target - 5) + ' more.' : 'Fill ' + spec.target + ' boxes in the top row.';
      } else if (mode === 'compare') {
        numberAll();
        sh.cap.textContent = 'A has ' + a + ', B has ' + b;
      } else {
        numberAll();
        if (mode === 'add') sh.cap.textContent = spec.frames === 2 || a + b > 10 ? 'Fill the first frame to make 10, then count on.' : a + ' gold and ' + b + ' blue';
      }
    }
    function reveal() {
      if (mode === 'build') {
        while (counters.length) unput(counters[counters.length - 1]);
        for (var q = 0; q < spec.target; q++) put(q, 'a');
        numberAll();
        sh.cap.textContent = spec.target + ' stars';
      } else hint();
    }
    function value() { return mode === 'build' ? counters.length : counters.filter(function(x) { return !x.gone; }).length; }
    return { value: value, hint: hint, reveal: reveal, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); } };
  }

  /* ============================================================
     NUMBER LINE
     ============================================================ */
  function numberline(host, spec, opts) {
    var min = spec.min, max = spec.max, range = max - min;
    var W = opts.narrow ? 400 : 540, Hh = 204, X0 = 30, X1 = W - 30, LY = 132;
    var sh = shell(host, W, Hh, spec.label || 'Number line', opts);
    var live = !!opts.interactive && spec.mode === 'build';
    function X(v) { return X0 + (v - min) / range * (X1 - X0); }
    var lblEvery = spec.labelEvery || (range <= 12 ? 1 : range <= 24 ? 2 : range <= 50 ? 5 : 10);
    var tickEvery = range <= 50 ? 1 : (range <= 120 ? 5 : 10);
    // track
    if (min < 0) {
      S('rect', { x: X0, y: LY - 4, width: X(0) - X0, height: 8, rx: 4, fill: '#60A5FA', opacity: 0.55 }, sh.g);
      S('rect', { x: X(0), y: LY - 4, width: X1 - X(0), height: 8, rx: 4, fill: '#FBBF24', opacity: 0.55 }, sh.g);
    } else {
      S('rect', { x: X0, y: LY - 4, width: X1 - X0, height: 8, rx: 4, fill: '#8B9BE8', opacity: 0.5 }, sh.g);
    }
    for (var v = min; v <= max; v += tickEvery) {
      var major = (v % lblEvery === 0);
      S('line', { x1: X(v), y1: LY - (major ? 12 : 7), x2: X(v), y2: LY + (major ? 12 : 7), stroke: v === 0 ? '#FFFFFF' : '#C7D2FE', 'stroke-width': v === 0 ? 3 : (major ? 2 : 1.2) }, sh.g);
      if (major) T(sh.g, X(v), LY + 30, fmt(v), { 'class': 'mgv-t' + (v === 0 ? ' zero' : '') });
    }
    var hopLayer = S('g', null, sh.g);
    var markLayer = S('g', null, sh.g);
    (spec.markers || []).forEach(function(m, i) {
      var ly = LY - 30 - i * 34;
      S('line', { x1: X(m.v), y1: LY, x2: X(m.v), y2: ly + 12, stroke: m.color || '#F472B6', 'stroke-width': 2 }, markLayer);
      S('circle', { cx: X(m.v), cy: LY, r: 9, fill: m.color || '#F472B6', stroke: '#fff', 'stroke-width': 2 }, markLayer);
      S('rect', { x: X(m.v) - 24, y: ly - 13, width: 48, height: 26, rx: 13, fill: m.color || '#F472B6' }, markLayer);
      T(markLayer, X(m.v), ly, m.label, { 'class': 'mgv-t small', fill: '#0B1033' });
    });
    if (spec.start !== undefined && spec.start !== null) {
      S('circle', { cx: X(spec.start), cy: LY, r: 10, fill: '#34D399', stroke: '#ECFDF5', 'stroke-width': 3 }, markLayer);
      T(markLayer, X(spec.start), LY + 52, 'start', { 'class': 'mgv-t small', fill: '#6EE7B7' });
    }
    function arc(from, to, label, color) {
      var x1 = X(from), x2 = X(to), mid = (x1 + x2) / 2, hgt = Math.min(70, 18 + Math.abs(x2 - x1) * 0.35);
      S('path', { d: 'M' + x1 + ' ' + (LY - 8) + ' Q ' + mid + ' ' + (LY - 8 - hgt * 2) + ' ' + x2 + ' ' + (LY - 8), fill: 'none', stroke: color || '#F472B6', 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }, hopLayer);
      S('path', { d: 'M' + (x2 - 6) + ' ' + (LY - 20) + ' L' + x2 + ' ' + (LY - 8) + ' L' + (x2 + 6) + ' ' + (LY - 20), fill: 'none', stroke: color || '#F472B6', 'stroke-width': 3, 'stroke-linecap': 'round', transform: to < from ? 'rotate(' + 25 + ' ' + x2 + ' ' + (LY - 8) + ')' : 'rotate(-25 ' + x2 + ' ' + (LY - 8) + ')' }, hopLayer);
      var lbl = T(hopLayer, mid, LY - 14 - hgt, label, { 'class': 'mgv-t hop' });
      return lbl;
    }
    function drawHops(list) { clear(hopLayer); (list || []).forEach(function(h, i) { arc(h.from, h.to, h.label || ((h.to > h.from ? '+' : '−') + fmt(Math.abs(h.to - h.from))), ['#F472B6', '#FBBF24', '#67E8F9'][i % 3]); }); }

    var pos = spec.markerStart !== undefined ? spec.markerStart : (spec.start !== undefined ? spec.start : min);
    var pin = null;
    if (live) {
      sh.svg.classList.add('mgv-drag');
      pin = S('g', { 'class': 'mgv-pin', tabindex: 0, role: 'slider', 'aria-label': 'Rocket marker', 'aria-valuemin': min, 'aria-valuemax': max }, sh.g);
      S('path', { d: 'M0 0 L-9 -22 L9 -22 Z', fill: '#E0E7FF' }, pin);
      S('circle', { cx: 0, cy: -40, r: 22, fill: sh.url('gold'), stroke: '#FFF7CC', 'stroke-width': 2 }, pin);
      var pinTxt = T(pin, 0, -39, '', { 'class': 'mgv-t pinnum' });
      var dragging = false;
      function setPos(v) {
        v = Math.max(min, Math.min(max, Math.round(v)));
        pos = v;
        pin.setAttribute('transform', 'translate(' + X(v) + ' ' + (LY - 8) + ')');
        pinTxt.textContent = fmt(v);
        pin.setAttribute('aria-valuenow', v);
        if (spec.start !== undefined && spec.start !== null && v !== spec.start && !sh.hinted) drawHops([{ from: spec.start, to: v }]);
        else if (!sh.hinted) clear(hopLayer);
        if (opts.onChange) opts.onChange(v);
      }
      function fromEvt(e) { var p = svgPoint(sh.svg, e); return min + (p.x - X0) / (X1 - X0) * range; }
      sh.svg.addEventListener('pointerdown', function(e) { if (sh.locked) return; dragging = true; try { sh.svg.setPointerCapture(e.pointerId); } catch (er) {} setPos(fromEvt(e)); e.preventDefault(); });
      sh.svg.addEventListener('pointermove', function(e) { if (dragging && !sh.locked) setPos(fromEvt(e)); });
      sh.svg.addEventListener('pointerup', function() { dragging = false; });
      sh.svg.addEventListener('pointercancel', function() { dragging = false; });
      pin.addEventListener('keydown', function(e) {
        if (sh.locked) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setPos(pos - 1); e.preventDefault(); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setPos(pos + 1); e.preventDefault(); }
      });
      sh.ctrl.appendChild(btn('◀ 1', function() { if (!sh.locked) setPos(pos - 1); }, 'Move left one'));
      sh.ctrl.appendChild(btn('1 ▶', function() { if (!sh.locked) setPos(pos + 1); }, 'Move right one'));
      setPos(pos);
      sh.cap.textContent = 'Drag the rocket pin along the line';
    }
    function hint() { sh.hinted = true; drawHops(spec.hops); if (spec.hintText) sh.cap.textContent = spec.hintText; }
    function reveal() {
      sh.hinted = true; drawHops(spec.hops);
      if (spec.answer !== undefined) {
        if (pin) { pin.setAttribute('transform', 'translate(' + X(spec.answer) + ' ' + (LY - 8) + ')'); pin.querySelector('text').textContent = fmt(spec.answer); }
        else { S('circle', { cx: X(spec.answer), cy: LY, r: 11, fill: '#FBBF24', stroke: '#fff', 'stroke-width': 3, filter: sh.url('glow') }, markLayer); T(markLayer, X(spec.answer), LY - 28, fmt(spec.answer), { 'class': 'mgv-t big', fill: '#FDE68A' }); }
      }
    }
    return { value: function() { return pos; }, hint: hint, reveal: reveal, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); } };
  }

  /* ============================================================
     BASE-TEN BLOCKS
     ============================================================ */
  var CUBE = 15, DEP = 6;
  var BLOCK_COL = {
    a: ['#FDE68A', '#F59E0B', '#B45309'],
    b: ['#A5F3FC', '#06B6D4', '#0E7490'],
    n: ['#BBF7D0', '#22C55E', '#15803D']
  };
  function cubeAt(g, x, y, c, hgt) {
    hgt = hgt || CUBE;
    S('path', { d: 'M' + x + ' ' + y + ' l' + DEP + ' ' + (-DEP) + ' h' + CUBE + ' l' + (-DEP) + ' ' + DEP + ' z', fill: c[0], stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 0.8 }, g);
    S('path', { d: 'M' + (x + CUBE) + ' ' + y + ' l' + DEP + ' ' + (-DEP) + ' v' + hgt + ' l' + (-DEP) + ' ' + DEP + ' z', fill: c[2], stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 0.8 }, g);
    S('rect', { x: x, y: y, width: CUBE, height: hgt, fill: c[1], stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 0.8 }, g);
  }
  function rodAt(g, x, y, c) {
    cubeAt(g, x, y, c, CUBE * 10);
    for (var i = 1; i < 10; i++) S('line', { x1: x, y1: y + i * CUBE, x2: x + CUBE, y2: y + i * CUBE, stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 0.9 }, g);
    S('line', { x1: x + 3, y1: y + 3, x2: x + 3, y2: y + CUBE * 10 - 3, stroke: 'rgba(255,255,255,0.45)', 'stroke-width': 1.5 }, g);
  }

  function blocks(host, spec, opts) {
    var mode = spec.mode || 'show';
    var live = !!opts.interactive;
    var items = [];
    function addNum(n, col) {
      for (var i = 0; i < Math.floor(n / 10); i++) items.push({ t: 'rod', c: col });
      for (var j = 0; j < n % 10; j++) items.push({ t: 'one', c: col });
    }
    if (mode !== 'build') addNum(spec.groups[0], 'a');
    if (mode === 'add' && spec.groups[1] !== undefined) addNum(spec.groups[1], 'b');
    var W = opts.narrow ? 380 : 560, Hh = 230;
    var sh = shell(host, W, Hh, spec.label || 'Base-ten blocks', opts);
    var labels = false;

    function render() {
      clear(sh.g);
      var rods = items.filter(function(i) { return i.t === 'rod'; });
      var ones = items.filter(function(i) { return i.t === 'one'; });
      var x = 24, top = 34;
      var rodGap = rods.length > 12 ? 4 : 9;
      rods.forEach(function(it) {
        var g = S('g', { 'class': 'mgv-blk' + (it.gone ? ' mgv-gone' : '') }, sh.g);
        rodAt(g, x, top, BLOCK_COL[it.c]);
        it.x = x;
        if (live && mode === 'sub') { g.style.cursor = 'pointer'; g.addEventListener('click', function() { if (sh.locked) return; it.gone = !it.gone; render(); changed(); }); }
        x += CUBE + DEP + rodGap;
      });
      var onesX = x + (rods.length ? 16 : 0);
      ones.forEach(function(it, i) {
        var col = Math.floor(i / 5), row = i % 5;
        var ox = onesX + col * (CUBE + DEP + 8), oy = top + 150 - CUBE - row * (CUBE + 9);
        var g = S('g', { 'class': 'mgv-blk' + (it.gone ? ' mgv-gone' : '') }, sh.g);
        cubeAt(g, ox, oy, BLOCK_COL[it.c]);
        if (live && mode === 'sub') { g.style.cursor = 'pointer'; g.addEventListener('click', function() { if (sh.locked) return; it.gone = !it.gone; render(); changed(); }); }
      });
      var tens = rods.filter(function(i) { return !i.gone; }).length, on = ones.filter(function(i) { return !i.gone; }).length;
      var endX = onesX + Math.ceil(ones.length / 5) * (CUBE + DEP + 8);
      var vbW = Math.max(mode === 'build' ? W : 300, endX + 24);
      sh.setView(0, 0, vbW, Hh);
      if (labels || mode === 'build') {
        if (rods.length) T(sh.g, 24 + (x - 24) / 2, Hh - 22, tens + (tens === 1 ? ' ten' : ' tens'), { 'class': 'mgv-t', fill: '#FDE68A' });
        if (ones.length) T(sh.g, onesX + (endX - onesX) / 2, Hh - 22, on + (on === 1 ? ' one' : ' ones'), { 'class': 'mgv-t', fill: '#A5F3FC' });
      }
      return { tens: tens, ones: on };
    }
    function value() { var r = 0; items.forEach(function(i) { if (!i.gone) r += i.t === 'rod' ? 10 : 1; }); return r; }
    function changed() {
      var v = value();
      if (mode === 'build') sh.cap.textContent = 'You built ' + v;
      if (mode === 'sub') { var away = 0; items.forEach(function(i) { if (i.gone) away += i.t === 'rod' ? 10 : 1; }); sh.cap.textContent = away ? 'Taken away: ' + away : ''; }
      if (bundleBtn) bundleBtn.disabled = items.filter(function(i) { return i.t === 'one' && !i.gone; }).length < 10;
      if (breakBtn) breakBtn.disabled = !items.some(function(i) { return i.t === 'rod' && !i.gone; });
      if (opts.onChange) opts.onChange(v);
    }
    function bundle() {
      var loose = items.filter(function(i) { return i.t === 'one' && !i.gone; });
      if (loose.length < 10) return false;
      loose.slice(0, 10).forEach(function(i) { items.splice(items.indexOf(i), 1); });
      items.unshift({ t: 'rod', c: 'n' });
      render(); changed();
      sh.cap.textContent = '10 ones make 1 ten!';
      return true;
    }
    function breakTen() {
      var rod = null;
      for (var i = items.length - 1; i >= 0; i--) if (items[i].t === 'rod' && !items[i].gone) { rod = items[i]; break; }
      if (!rod) return false;
      var at = items.indexOf(rod);
      items.splice(at, 1);
      for (var k = 0; k < 10; k++) items.push({ t: 'one', c: rod.c });
      render(); changed();
      sh.cap.textContent = '1 ten breaks into 10 ones';
      return true;
    }
    var bundleBtn = null, breakBtn = null;
    if (live && mode === 'add') { bundleBtn = btn('Bundle 10 ones → 1 ten', function() { if (!sh.locked) bundle(); }); sh.ctrl.appendChild(bundleBtn); }
    if (live && mode === 'sub') {
      breakBtn = btn('Break a ten into ones', function() { if (!sh.locked) breakTen(); });
      sh.ctrl.appendChild(breakBtn);
      sh.cap.textContent = 'Tap blocks to take ' + spec.take + ' away';
    }
    if (live && mode === 'build') {
      function addOne() { items.push({ t: 'one', c: 'a' }); render(); if (items.filter(function(i) { return i.t === 'one'; }).length >= 10) bundle(); else changed(); }
      sh.ctrl.appendChild(btn('− ten', function() { if (sh.locked) return; for (var i = items.length - 1; i >= 0; i--) if (items[i].t === 'rod') { items.splice(i, 1); break; } render(); changed(); }, 'Remove a ten'));
      sh.ctrl.appendChild(btn('+ ten', function() { if (sh.locked) return; if (items.filter(function(i) { return i.t === 'rod'; }).length < 9) items.unshift({ t: 'rod', c: 'a' }); render(); changed(); }, 'Add a ten'));
      sh.ctrl.appendChild(btn('− one', function() { if (sh.locked) return; for (var i = items.length - 1; i >= 0; i--) if (items[i].t === 'one') { items.splice(i, 1); break; } render(); changed(); }, 'Remove a one'));
      sh.ctrl.appendChild(btn('+ one', function() { if (!sh.locked) addOne(); }, 'Add a one'));
    }
    render(); if (live) changed();
    function hint() {
      labels = true;
      if (mode === 'add') { while (bundle()) {} }
      if (mode === 'sub') {
        var takeT = Math.floor(spec.take / 10), takeO = spec.take % 10;
        var avail = items.filter(function(i) { return i.t === 'one' && !i.gone; }).length;
        if (avail < takeO) breakTen();
      }
      var r = render();
      if (mode === 'build') sh.cap.textContent = spec.target + ' = ' + Math.floor(spec.target / 10) + ' tens and ' + (spec.target % 10) + ' ones';
      else if (mode === 'sub') sh.cap.textContent = 'Take away ' + Math.floor(spec.take / 10) + ' tens and ' + (spec.take % 10) + ' ones';
      else sh.cap.textContent = r.tens + ' tens + ' + r.ones + ' ones';
    }
    function reveal() {
      if (mode === 'build') { items = []; addNum(spec.target, 'a'); labels = true; render(); sh.cap.textContent = spec.target + ' = ' + Math.floor(spec.target / 10) + ' tens and ' + (spec.target % 10) + ' ones'; return; }
      if (mode === 'sub') {
        labels = true;
        items.forEach(function(i) { i.gone = false; });
        var takeT = Math.floor(spec.take / 10), takeO = spec.take % 10;
        while (items.filter(function(i) { return i.t === 'one'; }).length < takeO) breakTen();
        items.forEach(function(i) { i.gone = false; });
        var rs = items.filter(function(i) { return i.t === 'rod'; }), os = items.filter(function(i) { return i.t === 'one'; });
        rs.slice(rs.length - takeT).forEach(function(i) { i.gone = true; });
        os.slice(os.length - takeO).forEach(function(i) { i.gone = true; });
        var r = render(); sh.cap.textContent = r.tens + ' tens + ' + r.ones + ' ones left = ' + (r.tens * 10 + r.ones);
        return;
      }
      hint();
    }
    return { value: value, hint: hint, reveal: reveal, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); } };
  }

  /* ============================================================
     ARRAY (rows × columns)
     ============================================================ */
  function array(host, spec, opts) {
    var build = spec.mode === 'build';
    var big = Math.min(10, Math.max(spec.rows, spec.cols) + 1);
    var maxR = build ? big : spec.rows, maxC = build ? big : spec.cols;
    var SP = maxC > 10 ? 30 : 36, R0 = SP * 0.36, PAD = 26, LAB = build ? 4 : 74;
    var W = PAD * 2 + maxC * SP + LAB, Hh = PAD * 2 + maxR * SP + 8;
    var sh = shell(host, W, Hh, spec.label || 'Array', opts);
    var rows = build ? (spec.startR || 1) : spec.rows, cols = build ? (spec.startC || 1) : spec.cols;
    var skip = false;
    var live = !!opts.interactive && build;
    function render() {
      clear(sh.g);
      if (build) {
        for (var r = 0; r < maxR; r++) for (var c = 0; c < maxC; c++)
          S('circle', { cx: PAD + c * SP + SP / 2, cy: PAD + r * SP + SP / 2, r: R0 * 0.55, fill: 'none', stroke: '#2E3A80', 'stroke-width': 1.5 }, sh.g);
        S('rect', { x: PAD + 2, y: PAD + 2, width: cols * SP - 4, height: rows * SP - 4, rx: 12, fill: 'rgba(103,232,249,0.08)', stroke: '#67E8F9', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, sh.g);
      }
      for (var rr = 0; rr < rows; rr++) {
        for (var cc = 0; cc < cols; cc++) orb(sh.g, PAD + cc * SP + SP / 2, PAD + rr * SP + SP / 2, R0, sh.url(rr % 2 ? 'cyan' : 'gold'));
        if (skip) T(sh.g, PAD + maxC * SP + LAB / 2, PAD + rr * SP + SP / 2, fmt((rr + 1) * cols), { 'class': 'mgv-t', fill: rr === rows - 1 ? '#FDE68A' : '#C7D2FE' });
      }
      if (build) {
        var hx = PAD + cols * SP, hy = PAD + rows * SP;
        S('circle', { cx: hx - 2, cy: hy - 2, r: 13, fill: '#F472B6', stroke: '#fff', 'stroke-width': 3, 'class': 'mgv-handle' }, sh.g);
        sh.cap.textContent = rows + (rows === 1 ? ' row' : ' rows') + ' of ' + cols + '  →  ' + rows * cols + ' in all';
      }
    }
    if (live) {
      sh.svg.classList.add('mgv-drag');
      var dragging = false;
      function at(e) {
        var p = svgPoint(sh.svg, e);
        var c = Math.max(1, Math.min(maxC, Math.ceil((p.x - PAD) / SP)));
        var r = Math.max(1, Math.min(maxR, Math.ceil((p.y - PAD) / SP)));
        if (r !== rows || c !== cols) { rows = r; cols = c; render(); if (opts.onChange) opts.onChange(value()); }
      }
      sh.svg.addEventListener('pointerdown', function(e) { if (sh.locked) return; dragging = true; try { sh.svg.setPointerCapture(e.pointerId); } catch (er) {} at(e); e.preventDefault(); });
      sh.svg.addEventListener('pointermove', function(e) { if (dragging && !sh.locked) at(e); });
      sh.svg.addEventListener('pointerup', function() { dragging = false; });
      sh.svg.addEventListener('pointercancel', function() { dragging = false; });
      function nudge(dr, dc) { if (sh.locked) return; rows = Math.max(1, Math.min(maxR, rows + dr)); cols = Math.max(1, Math.min(maxC, cols + dc)); render(); if (opts.onChange) opts.onChange(value()); }
      sh.ctrl.appendChild(btn('− row', function() { nudge(-1, 0); }, 'One row fewer'));
      sh.ctrl.appendChild(btn('+ row', function() { nudge(1, 0); }, 'One row more'));
      sh.ctrl.appendChild(btn('− col', function() { nudge(0, -1); }, 'One column fewer'));
      sh.ctrl.appendChild(btn('+ col', function() { nudge(0, 1); }, 'One column more'));
    }
    render();
    function value() { return { rows: rows, cols: cols }; }
    function hint() {
      skip = true; render();
      if (build) sh.cap.textContent = 'Drag the pink handle: ' + spec.rows + ' rows, ' + spec.cols + ' in each row';
      else sh.cap.textContent = 'Skip-count each row of ' + cols + ': ' + [1, 2, 3].filter(function(k) { return k <= rows; }).map(function(k) { return k * cols; }).join(', ') + (rows > 3 ? ' …' : '');
    }
    function reveal() {
      if (build) { rows = spec.rows; cols = spec.cols; }
      skip = true; render();
      sh.cap.textContent = rows + ' × ' + cols + ' = ' + rows * cols;
    }
    return { value: value, hint: hint, reveal: reveal, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); } };
  }

  /* ============================================================
     SHARE (division by dealing into cargo pods)
     ============================================================ */
  function share(host, spec, opts) {
    var g = spec.groups, total = spec.total;
    var perRow = (opts.narrow ? g <= 3 : g <= 5) ? g : Math.ceil(g / 2), rowsN = Math.ceil(g / perRow);
    var PW = 96, PH = 116, GAP = 14;
    var W = Math.max(420, perRow * (PW + GAP) + 40), Hh = 110 + rowsN * (PH + 16) + 10;
    var sh = shell(host, W, Hh, spec.label || 'Sharing into pods', opts);
    var supply = total, pods = [];
    for (var i = 0; i < g; i++) pods.push(0);
    function render() {
      clear(sh.g);
      // supply tray
      S('rect', { x: 20, y: 16, width: W - 40, height: 70, rx: 14, fill: '#0B1238', stroke: '#3B4A9A', 'stroke-width': 2 }, sh.g);
      T(sh.g, 64, 51, supply, { 'class': 'mgv-t big', fill: '#FDE68A' });
      var perLine = Math.floor((W - 150) / 22), maxShow = Math.min(supply, perLine * 3);
      for (var s = 0; s < maxShow; s++) {
        var col = s % perLine, row = Math.floor(s / perLine);
        orb(sh.g, 114 + col * 22, 30 + row * 21, 9, sh.url('gold'));
      }
      pods.forEach(function(n, p) {
        var r = Math.floor(p / perRow), c = p % perRow;
        var rowCount = Math.min(perRow, g - r * perRow);
        var x0 = (W - rowCount * (PW + GAP) + GAP) / 2 + c * (PW + GAP), y0 = 104 + r * (PH + 16);
        S('rect', { x: x0, y: y0, width: PW, height: PH, rx: 22, fill: sh.url('metalD'), stroke: '#CBD5E1', 'stroke-width': 2 }, sh.g);
        S('rect', { x: x0 + 7, y: y0 + 7, width: PW - 14, height: PH - 14, rx: 16, fill: '#0A1030' }, sh.g);
        S('rect', { x: x0 + PW / 2 - 14, y: y0 - 6, width: 28, height: 8, rx: 3, fill: '#94A3B8' }, sh.g);
        for (var k = 0; k < n; k++) orb(sh.g, x0 + 22 + (k % 3) * 26, y0 + PH - 24 - Math.floor(k / 3) * 24, 10, sh.url('cyan'));
        if (sh.counts) T(sh.g, x0 + PW / 2, y0 + 18, n, { 'class': 'mgv-t', fill: '#FDE68A' });
      });
    }
    function deal() {
      if (supply < g) return false;
      for (var i = 0; i < g; i++) pods[i]++;
      supply -= g;
      render();
      sh.cap.textContent = supply ? 'Each pod has ' + pods[0] + '. ' + supply + ' left to share.' : 'All shared! Count one pod.';
      if (dealBtn) dealBtn.disabled = supply < g;
      return true;
    }
    var dealBtn = null;
    if (opts.interactive) {
      dealBtn = btn('Deal one to each pod', function() { if (!sh.locked) deal(); });
      sh.ctrl.appendChild(dealBtn);
      sh.cap.textContent = 'Share ' + total + ' orbs equally into ' + g + ' pods';
    }
    render();
    function finish() { while (deal()) {} sh.counts = true; render(); sh.cap.textContent = total + ' ÷ ' + g + ' = ' + pods[0] + ' in each pod'; }
    return { value: function() { return pods[0]; }, hint: function() { while (deal()) {} sh.cap.textContent = 'All shared! Count one pod.'; }, reveal: finish, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); if (dealBtn) dealBtn.disabled = true; } };
  }

  /* ============================================================
     FRACTIONS — energy bar and pizza
     ============================================================ */
  function fraction(host, spec, opts) {
    var mode = spec.mode || 'show';
    if (spec.style === 'pizza') return pizza(host, spec, opts);
    var live = !!opts.interactive;
    var BX = opts.narrow ? 74 : 96, BW = opts.narrow ? 330 : 400, BH = 58;
    var bars = [];
    if (mode === 'compare') bars = [{ num: spec.num, den: spec.den, fill: 'energy', label: spec.num + '/' + spec.den }, { num: spec.b.num, den: spec.b.den, fill: 'energyB', label: spec.b.num + '/' + spec.b.den }];
    else if (mode === 'add') bars = [{ num: spec.num, den: spec.den, fill: 'energy', label: spec.num + '/' + spec.den }, { num: spec.b.num, den: spec.b.den, fill: 'energyB', label: spec.b.num + '/' + spec.b.den }];
    else if (mode === 'equiv') bars = [{ num: spec.ref.num, den: spec.ref.den, fill: 'energy', label: spec.ref.num + '/' + spec.ref.den }, { num: 0, den: spec.fixedDen, fill: 'energyB', label: '?/' + spec.fixedDen, editable: true }];
    else if (mode === 'build') bars = [{ num: 0, den: 1, fill: 'energy', label: '', editable: true, cut: true }];
    else bars = [{ num: spec.num, den: spec.den, fill: 'energy', label: '' }];
    var extra = mode === 'add' ? 1 : 0;
    var W = BX + BW + 44, Hh = 34 + (bars.length + extra) * (BH + 40);
    var sh = shell(host, W, Hh, spec.label || 'Fraction bar', opts);
    var showLabels = mode === 'compare' || mode === 'add' || mode === 'equiv';
    var hinted = false;
    function drawBar(b, y, idx, shadedSet) {
      var gap = b.den > 8 ? 3 : 5, pw = (BW - gap * (b.den - 1)) / b.den;
      S('rect', { x: BX - 8, y: y - 8, width: BW + 16, height: BH + 16, rx: 14, fill: sh.url('metalD'), stroke: '#CBD5E1', 'stroke-width': 1.5 }, sh.g);
      S('rect', { x: BX + BW + 8, y: y + BH / 2 - 12, width: 10, height: 24, rx: 3, fill: '#94A3B8' }, sh.g);
      for (var i = 0; i < b.den; i++) {
        var on = shadedSet ? shadedSet[i] : i < b.num;
        var r = S('rect', { x: BX + i * (pw + gap), y: y, width: pw, height: BH, rx: 7, fill: on ? sh.url(b.fill) : '#151B44', stroke: on ? 'rgba(255,255,255,0.5)' : '#2E3A80', 'stroke-width': 1.5, 'class': 'mgv-part' + (on ? ' on' : '') }, sh.g);
        if (on) S('rect', { x: BX + i * (pw + gap) + 4, y: y + 5, width: Math.max(2, pw - 8), height: 8, rx: 4, fill: 'rgba(255,255,255,0.35)' }, sh.g);
        if (b.editable && live) (function(ii) {
          r.style.cursor = 'pointer';
          r.addEventListener('click', function() { if (sh.locked) return; b.set[ii] = !b.set[ii]; b.num = b.set.filter(Boolean).length; render(); changed(); });
        })(i);
      }
      if (showLabels || hinted) T(sh.g, BX / 2 - 4, y + BH / 2, b.label || (b.num + '/' + b.den), { 'class': 'mgv-t big', fill: b.fill === 'energyB' ? '#BFDBFE' : '#A7F3D0' });
      if (hinted && (mode === 'compare' || mode === 'equiv') && b.num) {
        var ex = BX + b.num * (pw + gap) - gap / 2;
        S('line', { x1: ex, y1: 14, x2: ex, y2: Hh - 14, stroke: b.fill === 'energyB' ? '#93C5FD' : '#6EE7B7', 'stroke-width': 2, 'stroke-dasharray': '5 5' }, sh.g);
      }
    }
    bars.forEach(function(b) { if (b.editable) { b.set = []; for (var i = 0; i < b.den; i++) b.set.push(false); } });
    function render() {
      clear(sh.g);
      bars.forEach(function(b, i) { drawBar(b, 30 + i * (BH + 40), i, b.editable ? b.set : null); });
      if (mode === 'add' && !hinted) {
        var py = 30 + 2 * (BH + 40);
        S('rect', { x: BX - 8, y: py - 8, width: BW + 16, height: BH + 16, rx: 14, fill: 'none', stroke: '#4B5BA8', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, sh.g);
        T(sh.g, BX + BW / 2, py + BH / 2, 'together = ?', { 'class': 'mgv-t', fill: '#A5B4FC' });
      }
      if (mode === 'add' && hinted) {
        var d = spec.den, sum = spec.num + spec.b.num;
        var set = [];
        for (var k = 0; k < d; k++) set.push(k < sum);
        var y = 30 + 2 * (BH + 40);
        var tmp = { num: sum, den: d, fill: 'energyP', label: sum + '/' + d };
        drawBar(tmp, y, 2, set);
      }
    }
    function changed() {
      var b = bars[bars.length - 1];
      if (mode === 'build') sh.cap.textContent = 'Cut into ' + b.den + (b.den === 1 ? ' part' : ' equal parts') + ' · ' + b.num + ' lit';
      if (mode === 'equiv') sh.cap.textContent = b.num + ' of ' + b.den + ' lit';
      if (opts.onChange) opts.onChange(value());
    }
    if (live && mode === 'build') {
      var b0 = bars[0];
      function recut(d) { if (sh.locked) return; b0.den = Math.max(1, Math.min(12, d)); b0.set = []; for (var i = 0; i < b0.den; i++) b0.set.push(false); b0.num = 0; render(); changed(); }
      sh.ctrl.appendChild(btn('− cut', function() { recut(b0.den - 1); }, 'Fewer parts'));
      sh.ctrl.appendChild(btn('+ cut', function() { recut(b0.den + 1); }, 'More parts'));
    }
    if (live && (mode === 'build' || mode === 'equiv')) {
      var be = bars[bars.length - 1];
      sh.ctrl.appendChild(btn('− light', function() { if (sh.locked) return; for (var i = be.den - 1; i >= 0; i--) if (be.set[i]) { be.set[i] = false; break; } be.num = be.set.filter(Boolean).length; render(); changed(); }, 'Light one part fewer'));
      sh.ctrl.appendChild(btn('+ light', function() { if (sh.locked) return; for (var i = 0; i < be.den; i++) if (!be.set[i]) { be.set[i] = true; break; } be.num = be.set.filter(Boolean).length; render(); changed(); }, 'Light one part more'));
    }
    render();
    if (live && (mode === 'build' || mode === 'equiv')) changed();
    function value() { var b = bars[bars.length - 1]; return { num: b.num, den: b.den }; }
    function hint() {
      hinted = true;
      if (mode === 'build') sh.cap.textContent = 'Press + cut until there are ' + spec.target.den + ' equal parts, then tap ' + spec.target.num + ' of them.';
      if (mode === 'equiv') sh.cap.textContent = 'Light parts until the blue bar reaches the green line.';
      if (mode === 'add') sh.cap.textContent = 'Same-size parts: put them together.';
      if (mode === 'compare') sh.cap.textContent = 'The longer glow is the bigger fraction.';
      if (mode === 'show') sh.cap.textContent = spec.den + ' equal parts, ' + spec.num + ' lit';
      render();
    }
    function reveal() {
      var b = bars[bars.length - 1];
      if (mode === 'build') { b.den = spec.target.den; b.set = []; for (var i = 0; i < b.den; i++) b.set.push(i < spec.target.num); b.num = spec.target.num; b.label = b.num + '/' + b.den; }
      if (mode === 'equiv') { b.set = b.set.map(function(_, i) { return i < spec.answer; }); b.num = spec.answer; b.label = b.num + '/' + b.den; }
      hint();
      if (mode === 'build' || mode === 'equiv') sh.cap.textContent = b.num + '/' + b.den;
      if (mode === 'add') sh.cap.textContent = spec.num + '/' + spec.den + ' + ' + spec.b.num + '/' + spec.den + ' = ' + (spec.num + spec.b.num) + '/' + spec.den;
    }
    return { value: value, hint: hint, reveal: reveal, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); } };
  }

  function pizza(host, spec, opts) {
    var W = 360, Hh = 300, cx = 180, cy = 150, R = 124;
    var sh = shell(host, W, Hh, spec.label || 'Pizza', opts);
    var d = spec.den, n = spec.num;
    // plate
    S('circle', { cx: cx, cy: cy + 4, r: R + 14, fill: 'rgba(0,0,0,0.35)' }, sh.g);
    S('circle', { cx: cx, cy: cy, r: R + 12, fill: '#E2E8F0', stroke: '#94A3B8', 'stroke-width': 2 }, sh.g);
    S('circle', { cx: cx, cy: cy, r: R - 4, fill: '#CBD5E1' }, sh.g);
    var lab = null;
    function wedge(i) {
      var a0 = -Math.PI / 2 + i / d * Math.PI * 2, a1 = -Math.PI / 2 + (i + 1) / d * Math.PI * 2;
      if (d === 1) return 'M' + (cx - R) + ' ' + cy + ' a' + R + ' ' + R + ' 0 1 0 ' + 2 * R + ' 0 a' + R + ' ' + R + ' 0 1 0 ' + (-2 * R) + ' 0';
      var large = (a1 - a0) > Math.PI ? 1 : 0;
      return 'M' + cx + ' ' + cy + ' L' + (cx + Math.cos(a0) * R) + ' ' + (cy + Math.sin(a0) * R) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + (cx + Math.cos(a1) * R) + ' ' + (cy + Math.sin(a1) * R) + ' Z';
    }
    for (var i = 0; i < d; i++) {
      if (i >= n) {
        S('path', { d: wedge(i), fill: 'none', stroke: '#94A3B8', 'stroke-width': 2, 'stroke-dasharray': '6 6' }, sh.g);
        continue;
      }
      var g = S('g', { 'class': 'mgv-slice' }, sh.g);
      S('path', { d: wedge(i), fill: sh.url('crust') }, g);
      var am = -Math.PI / 2 + (i + 0.5) / d * Math.PI * 2;
      var inner = S('path', { d: wedge(i), fill: '#FCD34D', transform: 'translate(' + cx + ' ' + cy + ') scale(0.86) translate(' + (-cx) + ' ' + (-cy) + ')' }, g);
      S('path', { d: wedge(i), fill: 'none', stroke: '#DC2626', 'stroke-width': 3, opacity: 0.55, transform: 'translate(' + cx + ' ' + cy + ') scale(0.86) translate(' + (-cx) + ' ' + (-cy) + ')' }, g);
      var pep = Math.max(1, Math.round(6 / d * 2));
      for (var p = 0; p < pep; p++) {
        var rr = R * (0.32 + (p % 2) * 0.3), aa = am + ((p % 3) - 1) * (Math.PI / d) * 0.45;
        S('circle', { cx: cx + Math.cos(aa) * rr, cy: cy + Math.sin(aa) * rr, r: d > 6 ? 8 : 11, fill: '#B91C1C', stroke: '#7F1D1D', 'stroke-width': 1.5 }, g);
      }
      S('path', { d: wedge(i), fill: 'none', stroke: '#7C2D12', 'stroke-width': 2 }, g);
    }
    lab = S('g', null, sh.g);
    function hint() {
      clear(lab);
      for (var i = 0; i < d; i++) {
        var am = -Math.PI / 2 + (i + 0.5) / d * Math.PI * 2;
        S('circle', { cx: cx + Math.cos(am) * R * 0.62, cy: cy + Math.sin(am) * R * 0.62, r: 15, fill: i < n ? '#1E1B4B' : '#475569', opacity: 0.85 }, lab);
        T(lab, cx + Math.cos(am) * R * 0.62, cy + Math.sin(am) * R * 0.62, i + 1, { 'class': 'mgv-t small', fill: '#fff' });
      }
      sh.cap.textContent = d + ' equal slices · ' + n + ' left on the plate';
    }
    return { value: function() { return null; }, hint: hint, reveal: function() { hint(); sh.cap.textContent = n + ' of ' + d + ' slices = ' + n + '/' + d; }, lock: function() { sh.locked = true; } };
  }

  /* ============================================================
     GRID — area & perimeter (solar-panel tiles)
     ============================================================ */
  function grid(host, spec, opts) {
    var w = spec.w, h = spec.h, TS = Math.min(44, Math.floor(400 / Math.max(w, h * 1.1)));
    var PAD = 46, LAB = 70;
    var W = PAD + w * TS + LAB, Hh = PAD + h * TS + 34;
    var sh = shell(host, Math.max(W, 300), Hh, spec.label || 'Area grid', opts);
    var ox = PAD + (Math.max(W, 300) - W) / 2, oy = PAD - 8;
    var marks = 0, tiles = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) {
      var g = S('g', { 'class': 'mgv-tile' }, sh.g);
      S('rect', { x: ox + c * TS + 1, y: oy + r * TS + 1, width: TS - 2, height: TS - 2, rx: 3, fill: sh.url('solar'), stroke: '#60A5FA', 'stroke-width': 1 }, g);
      S('path', { d: 'M' + (ox + c * TS + 4) + ' ' + (oy + r * TS + TS * 0.55) + ' l' + TS * 0.45 + ' ' + (-TS * 0.45), stroke: 'rgba(255,255,255,0.25)', 'stroke-width': 2 }, g);
      var lbl = T(g, ox + c * TS + TS / 2, oy + r * TS + TS / 2, '', { 'class': 'mgv-t small' });
      var tile = { g: g, lbl: lbl, n: 0 };
      tiles.push(tile);
      if (opts.interactive && spec.mode === 'area') (function(t) { t.g.style.cursor = 'pointer'; t.g.addEventListener('click', function() { if (sh.locked || t.n) return; t.n = ++marks; t.lbl.textContent = t.n; t.g.classList.add('on'); }); })(tile);
    }
    S('rect', { x: ox, y: oy, width: w * TS, height: h * TS, fill: 'none', stroke: '#CBD5E1', 'stroke-width': 3, rx: 3 }, sh.g);
    T(sh.g, ox + w * TS / 2, oy - 18, w, { 'class': 'mgv-t big', fill: '#FDE68A' });
    T(sh.g, ox - 22, oy + h * TS / 2, h, { 'class': 'mgv-t big', fill: '#FDE68A' });
    var hl = S('g', null, sh.g);
    if (opts.interactive && spec.mode === 'area') sh.cap.textContent = 'Tap tiles to count them';
    function hint() {
      clear(hl);
      if (spec.mode === 'perimeter') {
        S('rect', { x: ox, y: oy, width: w * TS, height: h * TS, fill: 'none', stroke: '#F97316', 'stroke-width': 6, rx: 3, filter: sh.url('glow') }, hl);
        T(hl, ox + w * TS / 2, oy + h * TS + 18, w, { 'class': 'mgv-t', fill: '#FDBA74' });
        T(hl, ox + w * TS + 18, oy + h * TS / 2, h, { 'class': 'mgv-t', fill: '#FDBA74' });
        sh.cap.textContent = 'Walk all the way round: ' + w + ' + ' + h + ' + ' + w + ' + ' + h;
      } else {
        for (var r = 0; r < h; r++) T(hl, ox + w * TS + LAB / 2, oy + r * TS + TS / 2, (r + 1) * w, { 'class': 'mgv-t', fill: r === h - 1 ? '#FDE68A' : '#C7D2FE' });
        sh.cap.textContent = h + ' rows of ' + w + ' tiles';
      }
    }
    function reveal() {
      hint();
      sh.cap.textContent = spec.mode === 'perimeter' ? w + ' + ' + h + ' + ' + w + ' + ' + h + ' = ' + 2 * (w + h) : w + ' × ' + h + ' = ' + w * h + ' square units';
    }
    return { value: function() { return marks; }, hint: hint, reveal: reveal, lock: function() { sh.locked = true; } };
  }

  /* ============================================================
     AREA MODEL — partial products for 2-digit × 1-digit
     ============================================================ */
  function areamodel(host, spec, opts) {
    var a = spec.a, b = spec.b;
    var tens = Math.floor(a / 10) * 10, ones = a % 10;
    var W = 560, Hh = 250, X0 = 70, Y0 = 50, TW = 440, HH = 150;
    var owid = ones ? Math.max(130, TW * ones / a) : 0, tw = TW - owid;
    var sh = shell(host, W, Hh, spec.label || 'Area model', opts);
    var parts = [{ x: X0, w: tw, label: tens, prod: tens * b, fill: '#7C3AED' }];
    if (ones) parts.push({ x: X0 + tw, w: owid, label: ones, prod: ones * b, fill: '#0D9488' });
    var shown = 0;
    T(sh.g, X0 - 30, Y0 + HH / 2, b, { 'class': 'mgv-t big', fill: '#FDE68A' });
    parts.forEach(function(p) {
      var g = S('g', { 'class': 'mgv-region' }, sh.g);
      S('rect', { x: p.x + 2, y: Y0, width: p.w - 4, height: HH, rx: 10, fill: p.fill, stroke: 'rgba(255,255,255,0.6)', 'stroke-width': 2 }, g);
      S('rect', { x: p.x + 8, y: Y0 + 6, width: p.w - 16, height: 10, rx: 5, fill: 'rgba(255,255,255,0.18)' }, g);
      T(sh.g, p.x + p.w / 2, Y0 - 20, p.label, { 'class': 'mgv-t big', fill: '#FDE68A' });
      p.txt = T(g, p.x + p.w / 2, Y0 + HH / 2, 'tap', { 'class': 'mgv-t' + (p.w < 120 ? ' small' : ''), fill: 'rgba(255,255,255,0.65)' });
      if (opts.interactive) { g.style.cursor = 'pointer'; g.addEventListener('click', function() { if (!sh.locked) open(p); }); }
    });
    function open(p) {
      if (p.open) return;
      p.open = true; shown++;
      p.txt.textContent = (p.w < 120 ? '' : p.label + ' × ' + b + ' = ') + fmt(p.prod);
      p.txt.setAttribute('fill', '#FFFFFF');
      if (shown === parts.length) sh.cap.textContent = parts.map(function(q) { return fmt(q.prod); }).join(' + ') + ' = ?';
      else sh.cap.textContent = p.label + ' × ' + b + ' = ' + fmt(p.prod);
    }
    if (opts.interactive) sh.cap.textContent = 'Split ' + a + ' into ' + tens + (ones ? ' + ' + ones : '') + '. Tap each part.';
    function hint() { parts.forEach(open); }
    function reveal() { parts.forEach(open); sh.cap.textContent = parts.map(function(q) { return fmt(q.prod); }).join(' + ') + ' = ' + fmt(a * b); }
    return { value: function() { return null; }, hint: hint, reveal: reveal, lock: function() { sh.locked = true; } };
  }

  /* ============================================================
     HUNDRED GRID — percents and decimals
     ============================================================ */
  function hundred(host, spec, opts) {
    var C = 27, PAD = 24, W = PAD * 2 + C * 10, Hh = PAD * 2 + C * 10;
    var sh = shell(host, W, Hh, spec.label || 'Hundred grid', opts);
    var build = spec.mode === 'build' && opts.interactive;
    var on = [];
    for (var i = 0; i < 100; i++) on.push(!build && i < (spec.shaded || 0));
    var rects = [];
    for (var k = 0; k < 100; k++) {
      var r = Math.floor(k / 10), c = k % 10;
      rects.push(S('rect', { x: PAD + c * C + 1, y: PAD + r * C + 1, width: C - 2, height: C - 2, rx: 4, 'data-i': k }, sh.g));
    }
    S('line', { x1: PAD + 5 * C, y1: PAD, x2: PAD + 5 * C, y2: PAD + 10 * C, stroke: '#64748B', 'stroke-width': 1.5, opacity: 0.6 }, sh.g);
    S('line', { x1: PAD, y1: PAD + 5 * C, x2: PAD + 10 * C, y2: PAD + 5 * C, stroke: '#64748B', 'stroke-width': 1.5, opacity: 0.6 }, sh.g);
    function paint() {
      rects.forEach(function(rc, i) { rc.setAttribute('fill', on[i] ? sh.url('energyB') : '#151B44'); rc.setAttribute('stroke', on[i] ? '#BFDBFE' : '#2E3A80'); });
      var n = count();
      if (build || sh.hinted) sh.cap.textContent = n + ' of 100 = ' + n + '%';
      if (opts.onChange) opts.onChange(n);
    }
    function count() { return on.filter(Boolean).length; }
    if (build) {
      sh.svg.classList.add('mgv-drag');
      var painting = null;
      function cellAt(e) { var p = svgPoint(sh.svg, e); var c = Math.floor((p.x - PAD) / C), r = Math.floor((p.y - PAD) / C); return (c < 0 || c > 9 || r < 0 || r > 9) ? -1 : r * 10 + c; }
      sh.svg.addEventListener('pointerdown', function(e) { if (sh.locked) return; var i = cellAt(e); if (i < 0) return; painting = !on[i]; on[i] = painting; try { sh.svg.setPointerCapture(e.pointerId); } catch (er) {} paint(); e.preventDefault(); });
      sh.svg.addEventListener('pointermove', function(e) { if (painting === null || sh.locked) return; var i = cellAt(e); if (i >= 0 && on[i] !== painting) { on[i] = painting; paint(); } });
      sh.svg.addEventListener('pointerup', function() { painting = null; });
      sh.svg.addEventListener('pointercancel', function() { painting = null; });
      function setN(n) { if (sh.locked) return; n = Math.max(0, Math.min(100, n)); for (var i = 0; i < 100; i++) on[i] = i < n; paint(); }
      sh.ctrl.appendChild(btn('− 10', function() { setN(count() - 10); }, 'Ten fewer'));
      sh.ctrl.appendChild(btn('− 1', function() { setN(count() - 1); }, 'One fewer'));
      sh.ctrl.appendChild(btn('+ 1', function() { setN(count() + 1); }, 'One more'));
      sh.ctrl.appendChild(btn('+ 10', function() { setN(count() + 10); }, 'Ten more'));
    }
    paint();
    if (build) sh.cap.textContent = 'Drag or tap to light squares · 0 of 100';
    function hint() {
      sh.hinted = true;
      if (build) sh.cap.textContent = 'Each full row is 10%. ' + spec.target + '% = ' + Math.floor(spec.target / 10) + ' rows and ' + (spec.target % 10) + ' more.';
      else { paint(); if (spec.caption) sh.cap.textContent = spec.caption; }
    }
    function reveal() {
      sh.hinted = true;
      if (build) { for (var i = 0; i < 100; i++) on[i] = i < spec.target; }
      paint();
      if (spec.caption) sh.cap.textContent = spec.caption;
    }
    return { value: count, hint: hint, reveal: reveal, lock: function() { sh.locked = true; sh.wrap.classList.add('mgv-locked'); } };
  }

  /* ============================================================
     BALANCE — solving a·x + b = c by doing the same to both sides
     ============================================================ */
  function balance(host, spec, opts) {
    var W = 560, Hh = 290;
    var sh = shell(host, W, Hh, spec.label || 'Balance scale', opts);
    var st = { x: spec.a, b: spec.b, r: spec.c, split: false };
    var sym = spec.sym || 'x';
    var tilt = 0;
    function crate(g, x, y, s) {
      S('rect', { x: x, y: y, width: s, height: s, rx: 6, fill: sh.url('crate'), stroke: '#F5F3FF', 'stroke-width': 1.5 }, g);
      S('rect', { x: x + 4, y: y + 4, width: s - 8, height: s * 0.2, rx: 3, fill: 'rgba(255,255,255,0.25)' }, g);
      T(g, x + s / 2, y + s / 2 + 2, sym, { 'class': 'mgv-t' + (s < 34 ? ' small' : ''), fill: '#fff' });
    }
    function weight(g, x, y, val) {
      var s = String(val).length > 2 ? 64 : 52;
      S('path', { d: 'M' + (x + 8) + ' ' + y + ' h' + (s - 16) + ' l8 40 h' + (-s) + ' z', fill: sh.url('weight'), stroke: '#E2E8F0', 'stroke-width': 1.5 }, g);
      S('rect', { x: x + s / 2 - 8, y: y - 8, width: 16, height: 10, rx: 4, fill: '#94A3B8' }, g);
      T(g, x + s / 2, y + 22, val, { 'class': 'mgv-t', fill: '#0F172A' });
      return s;
    }
    function pan(g, cx, cy, fill) {
      S('line', { x1: cx - 70, y1: cy, x2: cx, y2: cy - 70, stroke: '#CBD5E1', 'stroke-width': 1.5 }, g);
      S('line', { x1: cx + 70, y1: cy, x2: cx, y2: cy - 70, stroke: '#CBD5E1', 'stroke-width': 1.5 }, g);
      fill(g);
      S('path', { d: 'M' + (cx - 82) + ' ' + cy + ' h164 q-10 18 -30 18 h-104 q-20 0 -30 -18z', fill: sh.url('metal'), stroke: '#64748B', 'stroke-width': 1.5 }, g);
    }
    function render() {
      clear(sh.g);
      S('path', { d: 'M220 270 h120 l-20 -16 h-80 z', fill: sh.url('metalD') }, sh.g);
      S('rect', { x: 272, y: 96, width: 16, height: 160, rx: 6, fill: sh.url('metal') }, sh.g);
      var beam = S('g', { transform: 'rotate(' + tilt + ' 280 92)' }, sh.g);
      S('rect', { x: 70, y: 86, width: 420, height: 12, rx: 6, fill: sh.url('metal'), stroke: '#475569', 'stroke-width': 1 }, beam);
      S('circle', { cx: 280, cy: 92, r: 11, fill: '#FBBF24', stroke: '#92400E', 'stroke-width': 2 }, beam);
      var left = S('g', null, sh.g), right = S('g', null, sh.g);
      pan(left, 130, 170, function(g) {
        var n = st.x, s = n > 6 ? 30 : 40, perRow = Math.min(n, Math.floor(150 / (s + 4)));
        var xs = 130 - (st.b ? 36 : 0) - (perRow * (s + 4)) / 2;
        for (var i = 0; i < n; i++) crate(g, xs + (i % perRow) * (s + 4), 166 - s - Math.floor(i / perRow) * (s + 4), s);
        if (st.b) weight(g, xs + perRow * (s + 4) + 6, 126, st.b);
      });
      pan(right, 430, 170, function(g) {
        if (st.split) {
          var n = spec.a, wv = st.r / spec.a, ww = String(wv).length > 2 ? 64 : 52;
          var per = Math.min(n, 3), sc = n > 3 ? 0.8 : 1;
          for (var i = 0; i < n; i++) {
            var gx = 430 - (per * (ww * sc + 4)) / 2 + (i % per) * (ww * sc + 4), gy = 126 - Math.floor(i / per) * 44 * sc;
            var sub = S('g', { transform: 'translate(' + gx + ' ' + gy + ') scale(' + sc + ') translate(' + (-gx) + ' ' + (-gy) + ')' }, g);
            weight(sub, gx, gy, wv);
          }
        } else weight(g, 430 - (String(st.r).length > 2 ? 32 : 26), 126, st.r);
      });
      T(sh.g, 130, 220, (st.x > 1 ? st.x : '') + sym + (st.b ? ' + ' + st.b : ''), { 'class': 'mgv-t big', fill: '#E9D5FF' });
      T(sh.g, 430, 220, st.split ? spec.a + ' × ' + st.r / spec.a : st.r, { 'class': 'mgv-t big', fill: '#E2E8F0' });
    }
    var b1 = null, b2 = null;
    function stepTake() {
      if (!st.b) return false;
      var b = st.b; st.b = 0; st.r -= b;
      sh.cap.textContent = 'Took ' + b + ' off both sides → ' + (st.x > 1 ? st.x : '') + sym + ' = ' + st.r;
      render(); sync(); return true;
    }
    function stepSplit() {
      if (st.b || st.x <= 1 || st.split) return false;
      st.split = true;
      sh.cap.textContent = 'Split both sides into ' + st.x + ' equal groups → one ' + sym + ' balances ' + st.r / st.x;
      render(); sync(); return true;
    }
    function sync() {
      if (b1) b1.disabled = !st.b || sh.locked;
      if (b2) b2.disabled = !!st.b || st.x <= 1 || st.split || sh.locked;
    }
    if (opts.interactive) {
      if (spec.b) { b1 = btn('Take ' + spec.b + ' off both sides', function() { stepTake(); }); sh.ctrl.appendChild(b1); }
      if (spec.a > 1) { b2 = btn('Split both sides into ' + spec.a + ' groups', function() { stepSplit(); }); sh.ctrl.appendChild(b2); }
      sh.cap.textContent = 'Keep it balanced: do the same to both sides.';
    }
    render(); sync();
    sh.setView(36, 0, 488, 290);
    return {
      value: function() { return null; },
      hint: function() { if (!stepTake()) stepSplit(); },
      reveal: function() { stepTake(); stepSplit(); var x = (spec.c - spec.b) / spec.a; sh.cap.textContent = sym + ' = ' + x; },
      lock: function() { sh.locked = true; sync(); }
    };
  }

  /* ============================================================
     TAPE / BAR MODEL — ratios, percents
     ============================================================ */
  function tape(host, spec, opts) {
    var units = [];
    spec.parts.forEach(function(p, pi) { for (var i = 0; i < p.n; i++) units.push({ part: pi, color: p.color }); });
    var N = units.length, BX = 24, BW = opts.narrow ? 392 : 500, UH = 56, Y = 64;
    var uw = BW / N;
    var W = BW + 48, Hh = 200;
    var sh = shell(host, W, Hh, spec.label || 'Bar model', opts);
    var shown = false;
    var COLS = { blue: ['#93C5FD', '#2563EB'], white: ['#F8FAFC', '#94A3B8'], red: ['#FCA5A5', '#DC2626'], green: ['#86EFAC', '#16A34A'], gold: ['#FDE68A', '#D97706'], grey: ['#475569', '#1E293B'], purple: ['#D8B4FE', '#7C3AED'] };
    function money(v) { return (spec.pre || '') + fmt(v) + (spec.suf || ''); }
    function render() {
      clear(sh.g);
      // total brace
      S('path', { d: 'M' + BX + ' 44 v-10 h' + BW + ' v10', fill: 'none', stroke: '#FDE68A', 'stroke-width': 2.5 }, sh.g);
      T(sh.g, BX + BW / 2, 22, spec.totalLabel || money(spec.total), { 'class': 'mgv-t', fill: '#FDE68A' });
      units.forEach(function(u, i) {
        var c = COLS[u.color] || COLS.blue;
        var g = S('g', { 'class': 'mgv-unit' }, sh.g);
        S('rect', { x: BX + i * uw + 2, y: Y, width: uw - 4, height: UH, rx: 6, fill: c[0], stroke: c[1], 'stroke-width': 2 }, g);
        if (shown) T(g, BX + i * uw + uw / 2, Y + UH / 2, money(spec.total / N), { 'class': 'mgv-t' + (uw < 70 ? ' tiny' : ' small'), fill: '#0F172A' });
        else T(g, BX + i * uw + uw / 2, Y + UH / 2, '?', { 'class': 'mgv-t small', fill: '#334155' });
        if (opts.interactive) { g.style.cursor = 'pointer'; g.addEventListener('click', function() { if (!sh.locked) { shown = true; render(); sh.cap.textContent = money(spec.total) + ' ÷ ' + N + ' parts = ' + money(spec.total / N) + ' per part'; } }); }
      });
      var x = BX;
      spec.parts.forEach(function(p) {
        var w = p.n * uw;
        S('path', { d: 'M' + (x + 3) + ' ' + (Y + UH + 8) + ' v8 h' + (w - 6) + ' v-8', fill: 'none', stroke: '#C7D2FE', 'stroke-width': 2 }, sh.g);
        T(sh.g, x + w / 2, Y + UH + 32, p.label + (shown && p.showSum !== false ? ': ' + money(p.n * spec.total / N) : ''), { 'class': 'mgv-t small', fill: '#E0E7FF' });
        x += w;
      });
    }
    render();
    if (opts.interactive) sh.cap.textContent = 'Tap a part to find what one part is worth';
    return { value: function() { return null; }, hint: function() { shown = true; render(); sh.cap.textContent = money(spec.total) + ' ÷ ' + N + ' equal parts = ' + money(spec.total / N) + ' each'; }, reveal: function() { shown = true; render(); }, lock: function() { sh.locked = true; } };
  }

  /* ============================================================
     STEPS — a mission plan for multi-step problems (HTML)
     ============================================================ */
  function steps(host, spec, opts) {
    var wrap = H('div', 'mgv mgv-steps');
    var ol = H('ol', 'mgv-plan');
    var rows = spec.steps.map(function(s, i) {
      var li = H('li', 'mgv-step');
      var n = H('span', 'mgv-step-n', String(i + 1));
      var q = H('span', 'mgv-step-q', s.q);
      var a = H('button', 'mgv-step-a', 'Tap to work it out');
      a.type = 'button';
      a.addEventListener('click', function() { if (!locked || shownAll) open(i); });
      li.appendChild(n); li.appendChild(q); li.appendChild(a);
      ol.appendChild(li);
      return { li: li, a: a, open: false };
    });
    var locked = false, shownAll = false;
    function open(i) { var r = rows[i]; if (r.open) return; r.open = true; r.a.textContent = spec.steps[i].a; r.a.classList.add('open'); r.li.classList.add('open'); }
    wrap.appendChild(H('div', 'mgv-plan-title', 'Mission plan'));
    wrap.appendChild(ol);
    host.appendChild(wrap);
    return {
      value: function() { return null; },
      hint: function() { for (var i = 0; i < rows.length - 1; i++) open(i); },
      reveal: function() { shownAll = true; rows.forEach(function(_, i) { open(i); }); },
      lock: function() { locked = true; }
    };
  }

  /* ============================================================
     TOWERS — mean (levelling), median (sorting), mode
     ============================================================ */
  function towers(host, spec, opts) {
    var vals = spec.values.slice();
    var n = vals.length, maxV = Math.max.apply(null, vals);
    var CS = Math.min(22, Math.floor(200 / Math.max(10, maxV))), TW = 56, GAP = 18;
    var W = Math.max(420, n * (TW + GAP) + 60), Hh = 60 + Math.max(10, maxV) * CS + 60;
    var sh = shell(host, W, Hh, spec.label || 'Data towers', opts);
    var base = Hh - 48;
    var order = vals.map(function(v, i) { return i; });
    var highlight = {};
    var meanLine = false;
    function render() {
      clear(sh.g);
      var x0 = (W - n * (TW + GAP) + GAP) / 2;
      order.forEach(function(idx, pos) {
        var v = vals[idx], x = x0 + pos * (TW + GAP);
        var hl = highlight[idx];
        for (var k = 0; k < v; k++) {
          var y = base - (k + 1) * CS;
          S('rect', { x: x, y: y + 1, width: TW, height: CS - 2, rx: 4, fill: hl ? sh.url('gold') : sh.url('energyB'), stroke: hl ? '#FEF3C7' : '#BFDBFE', 'stroke-width': 1 }, sh.g);
        }
        T(sh.g, x + TW / 2, base + 22, v, { 'class': 'mgv-t', fill: hl ? '#FDE68A' : '#E0E7FF' });
      });
      S('line', { x1: 20, y1: base, x2: W - 20, y2: base, stroke: '#94A3B8', 'stroke-width': 2 }, sh.g);
      if (meanLine) {
        var m = spec.values.reduce(function(a, b) { return a + b; }, 0) / n;
        S('line', { x1: 20, y1: base - m * CS, x2: W - 20, y2: base - m * CS, stroke: '#F472B6', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, sh.g);
      }
    }
    function levelOne() {
      var hi = 0, lo = 0;
      for (var i = 1; i < n; i++) { if (vals[i] > vals[hi]) hi = i; if (vals[i] < vals[lo]) lo = i; }
      if (vals[hi] - vals[lo] <= (spec.mode === 'mean' ? 0 : 1)) return false;
      if (vals[hi] - vals[lo] < 2 && spec.mode === 'mean') return false;
      vals[hi]--; vals[lo]++;
      render();
      var even = vals.every(function(v) { return v === vals[0]; });
      sh.cap.textContent = even ? 'All towers are ' + vals[0] + ' tall: the mean is ' + vals[0] + '.' : 'Moved a cube from the tallest to the shortest tower.';
      return true;
    }
    function sortIt() {
      order.sort(function(a, b) { return spec.values[a] - spec.values[b] || a - b; });
      highlight = {}; highlight[order[Math.floor(n / 2)]] = true;
      render();
      sh.cap.textContent = 'Sorted. The middle tower is ' + spec.values[order[Math.floor(n / 2)]] + '.';
    }
    function markMode() {
      var cnt = {};
      spec.values.forEach(function(v) { cnt[v] = (cnt[v] || 0) + 1; });
      var best = null; for (var k in cnt) if (best === null || cnt[k] > cnt[best]) best = k;
      highlight = {}; spec.values.forEach(function(v, i) { if (String(v) === best) highlight[i] = true; });
      render();
      sh.cap.textContent = best + ' appears ' + cnt[best] + ' times — more than any other value.';
    }
    if (opts.interactive) {
      if (spec.mode === 'mean') {
        sh.ctrl.appendChild(btn('Move one cube', function() { if (!sh.locked) levelOne(); }));
        sh.ctrl.appendChild(btn('Level them all', function() { if (sh.locked) return; var g = 0; while (levelOne() && g++ < 200) {} }));
        sh.cap.textContent = 'Level the towers: move cubes until all are the same height.';
      } else if (spec.mode === 'median') {
        sh.ctrl.appendChild(btn('Sort by height', function() { if (!sh.locked) sortIt(); }));
        sh.cap.textContent = 'Line the towers up from shortest to tallest.';
      } else {
        sh.ctrl.appendChild(btn('Find matching towers', function() { if (!sh.locked) markMode(); }));
      }
    }
    render();
    function hint() {
      if (spec.mode === 'mean') { meanLine = true; render(); sh.cap.textContent = 'Total ' + spec.values.reduce(function(a, b) { return a + b; }, 0) + ' cubes shared by ' + n + ' towers.'; }
      else if (spec.mode === 'median') sortIt();
      else markMode();
    }
    function reveal() {
      if (spec.mode === 'mean') { var g = 0; while (levelOne() && g++ < 300) {} meanLine = true; render(); sh.cap.textContent = 'Mean = ' + spec.values.reduce(function(a, b) { return a + b; }, 0) + ' ÷ ' + n + ' = ' + vals[0]; }
      else hint();
    }
    return { value: function() { return null; }, hint: hint, reveal: reveal, lock: function() { sh.locked = true; } };
  }

  /* ============================================================
     SHAPE — corners and names
     ============================================================ */
  var SHAPES = {
    triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, circle: 0
  };
  function shape(host, spec, opts) {
    var W = 360, Hh = 260, cx = 180, cy = 136;
    var sh = shell(host, W, Hh, spec.label || 'Shape', opts);
    var pts = [];
    var k = spec.shape;
    if (k === 'rectangle') pts = [[cx - 120, cy - 66], [cx + 120, cy - 66], [cx + 120, cy + 66], [cx - 120, cy + 66]];
    else if (k === 'square') pts = [[cx - 86, cy - 86], [cx + 86, cy - 86], [cx + 86, cy + 86], [cx - 86, cy + 86]];
    else if (k !== 'circle') {
      var n = SHAPES[k], r = 104;
      for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + 10 + Math.sin(a) * r]); }
    }
    if (k === 'circle') {
      S('circle', { cx: cx, cy: cy, r: 100, fill: sh.url('metal'), stroke: '#334155', 'stroke-width': 3 }, sh.g);
      S('circle', { cx: cx, cy: cy, r: 84, fill: 'none', stroke: 'rgba(51,65,85,0.35)', 'stroke-width': 2, 'stroke-dasharray': '3 7' }, sh.g);
    } else {
      S('polygon', { points: pts.map(function(p) { return p.join(','); }).join(' '), fill: sh.url('metal'), stroke: '#334155', 'stroke-width': 3, 'stroke-linejoin': 'round' }, sh.g);
      var inner = pts.map(function(p) { return [cx + (p[0] - cx) * 0.82, (cy + (k === 'square' || k === 'rectangle' ? 0 : 10)) + (p[1] - cy - (k === 'square' || k === 'rectangle' ? 0 : 10)) * 0.82]; });
      S('polygon', { points: inner.map(function(p) { return p.join(','); }).join(' '), fill: 'none', stroke: 'rgba(51,65,85,0.35)', 'stroke-width': 2, 'stroke-dasharray': '3 7' }, sh.g);
    }
    var count = 0;
    var dots = pts.map(function(p) {
      var g = S('g', { 'class': 'mgv-corner' }, sh.g);
      S('circle', { cx: p[0], cy: p[1], r: 17, fill: 'rgba(15,23,42,0.001)' }, g);
      var c = S('circle', { cx: p[0], cy: p[1], r: 9, fill: '#475569', stroke: '#E2E8F0', 'stroke-width': 2 }, g);
      var t = T(g, p[0], p[1] - 26, '', { 'class': 'mgv-t', fill: '#FDE68A' });
      var d = { c: c, t: t, on: false };
      if (opts.interactive) { g.style.cursor = 'pointer'; g.addEventListener('click', function() { if (sh.locked || d.on) return; light(d); }); }
      return d;
    });
    function light(d) { d.on = true; d.t.textContent = ++count; d.c.setAttribute('fill', '#FBBF24'); d.c.setAttribute('filter', sh.url('glow')); }
    if (opts.interactive && pts.length) sh.cap.textContent = 'Tap each corner to count it';
    function hint() { dots.forEach(function(d) { if (!d.on) light(d); }); sh.cap.textContent = k === 'circle' ? 'A circle is one curved line — no corners.' : pts.length + ' corners and ' + pts.length + ' straight sides'; }
    return { value: function() { return count; }, hint: hint, reveal: hint, lock: function() { sh.locked = true; } };
  }

  var TYPES = { tenframe: tenframe, numberline: numberline, blocks: blocks, array: array, share: share, fraction: fraction, grid: grid, areamodel: areamodel, hundred: hundred, balance: balance, tape: tape, steps: steps, towers: towers, shape: shape };

  function render(host, spec, opts) {
    var fn = TYPES[spec.type];
    if (!fn) return null;
    opts = opts || {};
    if (opts.narrow === undefined) opts.narrow = (host.clientWidth || 600) < 480;
    return fn(host, spec, opts);
  }

  return { render: render, fmt: fmt };
})();
