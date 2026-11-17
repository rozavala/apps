/* ================================================================
   ZS HANDPAD — js/zs-handpad.js  (global ZsHandPad, ES5)
   A sheet of school handwriting paper to write on with a finger, an
   Apple Pencil or a mouse. Shared, so any app can use it: Escritura
   traces letters on it; Dictado can use it for "write it by hand".

   What it draws
     the paper: off-white with a faint grain, a red margin, and per row
     the four school lines (top, dashed midline, red baseline,
     descender line)                                         -> SVG
     the ink: a graphite pencil line, thicker when the Pencil presses
     harder (or, for a finger, when it moves slowly)         -> one canvas
     a layer for the app's own drawings (guides, arrows)     -> SVG <g>

   Input: Pointer Events. One pointer writes at a time. Once a Pencil
   has been used, finger touches are ignored (the palm rests on the
   glass), and so are very wide touches. touch-action: none stops the
   page from scrolling while writing.

   Units: the same as js/escritura-engine.js (baseline 0, midline 50,
   top line 100, descender -50, y up), with rows stacked ROW_H apart.

   var pad = ZsHandPad.create(el, {
     width: 300,           // sheet width in units
     rows: 1,
     maxHeight: 420,       // px; the sheet scales to fit el's width and this
     onStroke: fn(stroke), // stroke = [{x, y, p}] in units, when the pen lifts
     onBegin: fn(),        // pen down
     label: 'Escribe aquí' // aria-label of the writing area
   });
   pad.layer              SVG <g> in unit space for the app's drawings
   pad.path(pts)          'M..L..' for an SVG path in that space
   pad.strokes()          everything written so far
   pad.undo()  pad.clear()  pad.fadeLast()
   pad.resize()           after the container changes size
   pad.destroy()          frees the canvas (iPad canvas memory)
   ================================================================ */

var ZsHandPad = (function() {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var ROW_H = 200, ROW_TOP = 130, PAD_X = 10;
  var penSeen = false;          // a Pencil was used on this page: ignore palms

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function dpr() { return typeof ZsCanvas !== 'undefined' ? ZsCanvas.dpr() : Math.min(window.devicePixelRatio || 1, 2); }
  function ctx2d(c) { return typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(c) : c.getContext('2d'); }

  // A small tile of graphite grain, shared by every pad on the page.
  var grain = null;
  function grainTile() {
    if (grain) return grain;
    var c = document.createElement('canvas');
    c.width = c.height = 48;
    var x = ctx2d(c);
    if (!x) return null;
    var img = x.createImageData(48, 48), d = img.data, seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < d.length; i += 4) {
      var g = rnd();
      d[i] = 46 + g * 18; d[i + 1] = 48 + g * 18; d[i + 2] = 58 + g * 18;
      d[i + 3] = rnd() < 0.12 ? 60 + Math.floor(rnd() * 60) : 170 + Math.floor(rnd() * 85);
    }
    x.putImageData(img, 0, 0);
    grain = c;
    return grain;
  }
  if (typeof ZsCanvas !== 'undefined') ZsCanvas.onPressure(function() { if (grain) { ZsCanvas.release(grain); grain = null; } });

  function create(host, o) {
    o = o || {};
    var width = o.width || 300, rows = o.rows || 1;
    var wrap = document.createElement('div');
    wrap.className = 'zhp';
    wrap.style.position = 'relative';
    wrap.style.margin = '0 auto';
    var svg = el('svg', { 'class': 'zhp-paper', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
    svg.style.position = 'absolute'; svg.style.left = svg.style.top = '0'; svg.style.width = svg.style.height = '100%';
    var defs = el('defs', {}, svg);
    var fid = 'zhp-f' + Math.floor(Math.random() * 1e6);
    var f = el('filter', { id: fid, x: '0', y: '0', width: '100%', height: '100%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '2', seed: '3', result: 'n' }, f);
    el('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.55  0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0.05 0' }, f);
    var paper = el('g', {}, svg);
    var layer = el('g', { 'class': 'zhp-layer' }, svg);
    var canvas = document.createElement('canvas');
    canvas.className = 'zhp-ink';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', o.label || 'Writing area');
    canvas.style.position = 'absolute'; canvas.style.left = canvas.style.top = '0';
    canvas.style.width = canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    wrap.style.touchAction = 'none';
    wrap.style.webkitUserSelect = wrap.style.userSelect = 'none';
    wrap.style.webkitTouchCallout = 'none';
    wrap.appendChild(svg); wrap.appendChild(canvas);
    host.appendChild(wrap);

    var S = { scale: 1, w: 0, h: 0, ctx: null, strokes: [], live: null, pid: null, last: null, lw: 0, dead: false };

    function sheetH() { return rows * ROW_H; }
    function vb() { return (-PAD_X) + ' ' + (-ROW_TOP) + ' ' + (width + 2 * PAD_X) + ' ' + sheetH(); }
    // units -> SVG coordinates (y flipped)
    function sx(x) { return x; }
    function sy(y) { return -y; }

    function drawPaper() {
      while (paper.firstChild) paper.removeChild(paper.firstChild);
      var W = width + 2 * PAD_X, x0 = -PAD_X;
      el('rect', { x: x0, y: -ROW_TOP, width: W, height: sheetH(), fill: '#fffdf6' }, paper);
      el('rect', { x: x0, y: -ROW_TOP, width: W, height: sheetH(), filter: 'url(#' + fid + ')', opacity: '1' }, paper);
      for (var r = 0; r < rows; r++) {
        var o2 = r * ROW_H;
        // the writing band between the top line and the baseline is very faintly tinted
        el('rect', { x: x0, y: -100 + o2, width: W, height: 100, fill: '#eef5fc', opacity: '0.55' }, paper);
        el('line', { x1: x0, x2: x0 + W, y1: -100 + o2, y2: -100 + o2, stroke: '#8fb6dd', 'stroke-width': 1.6 }, paper);
        el('line', { x1: x0, x2: x0 + W, y1: -50 + o2, y2: -50 + o2, stroke: '#8fb6dd', 'stroke-width': 1.3, 'stroke-dasharray': '7 6' }, paper);
        el('line', { x1: x0, x2: x0 + W, y1: o2, y2: o2, stroke: '#de6b6b', 'stroke-width': 2 }, paper);
        el('line', { x1: x0, x2: x0 + W, y1: 50 + o2, y2: 50 + o2, stroke: '#bcd3ea', 'stroke-width': 1.2 }, paper);
      }
      el('line', { x1: -PAD_X + 6, x2: -PAD_X + 6, y1: -ROW_TOP, y2: sheetH() - ROW_TOP, stroke: '#f0a3a3', 'stroke-width': 1.4, opacity: '0.8' }, paper);
    }

    function resize() {
      if (S.dead) return;
      var avail = Math.max(120, host.clientWidth || 320);
      var maxH = o.maxHeight || 9999;
      var W = width + 2 * PAD_X, H = sheetH();
      var s = Math.min(avail / W, maxH / H);
      S.scale = s; S.w = Math.round(W * s); S.h = Math.round(H * s);
      wrap.style.width = S.w + 'px'; wrap.style.height = S.h + 'px';
      svg.setAttribute('viewBox', vb());
      var r = dpr();
      if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(canvas);
      canvas.width = Math.round(S.w * r); canvas.height = Math.round(S.h * r);
      S.ctx = ctx2d(canvas);
      if (S.ctx) S.ctx.setTransform(r, 0, 0, r, 0, 0);
      redraw();
    }

    // units <-> css px inside the pad
    function toPx(p) { return { x: (p.x + PAD_X) * S.scale, y: (ROW_TOP - p.y) * S.scale }; }
    function toUnits(px, py) { return { x: px / S.scale - PAD_X, y: ROW_TOP - py / S.scale }; }

    function inkStyle() {
      var t = grainTile(), c = S.ctx;
      if (t && c) { try { var pat = c.createPattern(t, 'repeat'); if (pat) return pat; } catch (e) {} }
      return '#3a3d48';
    }
    function baseWidth() { return Math.max(2.2, Math.min(7, S.scale * 3.6)); }
    function seg(a, b, w) {
      var c = S.ctx;
      if (!c) return;
      c.strokeStyle = inkStyle();
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = w;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    function dot(a, w) {
      var c = S.ctx;
      if (!c) return;
      c.fillStyle = inkStyle();
      c.beginPath(); c.arc(a.x, a.y, w / 2, 0, Math.PI * 2); c.fill();
    }
    function widthFor(p, pen, speed) {
      var b = baseWidth();
      if (pen && p > 0) return b * (0.55 + Math.min(1, p) * 0.85);
      // a finger: a slow, careful line is a little darker and thicker
      return b * Math.max(0.75, Math.min(1.15, 1.15 - speed * 0.12));
    }
    function paintStroke(st, alpha) {
      var c = S.ctx;
      if (!c || !st.length) return;
      c.globalAlpha = alpha == null ? 1 : alpha;
      if (st.length === 1) dot(toPx(st[0]), st[0].w || baseWidth());
      for (var i = 1; i < st.length; i++) seg(toPx(st[i - 1]), toPx(st[i]), st[i].w || baseWidth());
      c.globalAlpha = 1;
    }
    function redraw() {
      if (!S.ctx) return;
      S.ctx.clearRect(0, 0, S.w, S.h);
      S.strokes.forEach(function(st) { paintStroke(st); });
      if (S.live) paintStroke(S.live);
    }

    // ── pointer input ──────────────────────────────────────────
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function isPalm(e) {
      if (e.pointerType === 'pen') { penSeen = true; return false; }
      if (e.pointerType === 'touch') {
        if (penSeen) return true;
        if ((e.width || 0) > 60 && (e.height || 0) > 60) return true;
      }
      return false;
    }
    function addPoint(e, pen) {
      var q = local(e), u = toUnits(q.x, q.y);
      var now = e.timeStamp || Date.now(), speed = 0;
      if (S.last) {
        var dt = Math.max(1, now - S.last.t), dx = q.x - S.last.x, dy = q.y - S.last.y;
        if (dx * dx + dy * dy < 0.6) return;               // ignore jitter
        speed = Math.sqrt(dx * dx + dy * dy) / dt;
      }
      var w = widthFor(e.pressure, pen, speed);
      // ease the width so the line swells and thins smoothly
      S.lw = S.lw ? S.lw * 0.7 + w * 0.3 : w;
      var pt = { x: u.x, y: u.y, p: pen ? e.pressure : 0, w: S.lw };
      var prev = S.live[S.live.length - 1];
      S.live.push(pt);
      if (prev) seg(toPx(prev), toPx(pt), S.lw); else dot(toPx(pt), S.lw);
      S.last = { x: q.x, y: q.y, t: now };
    }
    function down(e) {
      if (S.dead || S.pid != null || isPalm(e)) return;
      if (e.button != null && e.button > 0) return;
      e.preventDefault();
      S.pid = e.pointerId; S.pen = e.pointerType === 'pen';
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      S.live = []; S.last = null; S.lw = 0;
      if (o.onBegin) o.onBegin();
      addPoint(e, S.pen);
    }
    function move(e) {
      if (e.pointerId !== S.pid || !S.live) return;
      e.preventDefault();
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!list.length) list = [e];
      for (var i = 0; i < list.length; i++) addPoint(list[i], S.pen);
    }
    function up(e) {
      if (e.pointerId !== S.pid) return;
      S.pid = null;
      var st = S.live;
      S.live = null;
      if (!st || !st.length) return;
      S.strokes.push(st);
      if (o.onStroke) o.onStroke(st.map(function(p) { return { x: p.x, y: p.y, p: p.p }; }));
    }
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    // old iOS: keep the page still under the pencil
    var stop = function(e) { if (e.touches && e.touches.length === 1) e.preventDefault(); };
    canvas.addEventListener('touchstart', stop, { passive: false });
    canvas.addEventListener('touchmove', stop, { passive: false });

    var onWin = function() { resize(); };
    window.addEventListener('resize', onWin);

    drawPaper();
    resize();

    var api = {
      el: wrap, layer: layer, svg: svg, canvas: canvas,
      path: function(pts) {
        if (!pts || !pts.length) return '';
        var s = 'M' + sx(pts[0].x).toFixed(1) + ' ' + sy(pts[0].y).toFixed(1);
        for (var i = 1; i < pts.length; i++) s += 'L' + sx(pts[i].x).toFixed(1) + ' ' + sy(pts[i].y).toFixed(1);
        return s;
      },
      toPx: toPx, toUnits: toUnits,
      scale: function() { return S.scale; },
      strokes: function() { return S.strokes.map(function(st) { return st.map(function(p) { return { x: p.x, y: p.y, p: p.p }; }); }); },
      count: function() { return S.strokes.length; },
      undo: function() { S.strokes.pop(); redraw(); },
      clear: function() { S.strokes = []; S.live = null; S.pid = null; redraw(); },
      // A stroke that missed fades away instead of vanishing.
      fadeLast: function(ms) {
        var st = S.strokes.pop();
        if (!st) return;
        var t0 = Date.now(), dur = ms || 450;
        (function step() {
          if (S.dead) return;
          var a = 1 - (Date.now() - t0) / dur;
          redraw();
          if (a > 0) { paintStroke(st, a); requestAnimationFrame(step); }
        })();
      },
      setSheet: function(w, r) { width = w || width; rows = r || rows; drawPaper(); resize(); },
      resize: resize,
      destroy: function() {
        S.dead = true;
        window.removeEventListener('resize', onWin);
        if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(canvas);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }
    };
    return api;
  }

  return { create: create, ROW_H: ROW_H, ROW_TOP: ROW_TOP };
})();
