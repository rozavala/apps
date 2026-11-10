/* ================================================================
   CODE LAB 🐢 — text coding after Code Cadet (ages 9 and up)

   A tiny Python-like language (js/code-lab-lang.js) run by our own
   interpreter, never by the browser: nothing a kid types is evaluated
   as JavaScript. 40 missions in 7 chapters (js/code-lab-missions.js),
   each with an automatic goal check (js/code-lab-check.js).

   Per kid, one JSON blob at zs_codelab_<kid>:
     { v:1,
       m:    { '<missionId>': { s:0..3, code:'…', h:hintsShown, ex:'…', t:'YYYY-MM-DD', n:tries } },
       free: [ { id, name, code, t } ],       // the workshop's saved programs
       draft:'…',                              // the workshop's unsaved code
       speed:'slow'|'normal'|'fast'|'instant', kb:1|0, last:'YYYY-MM-DD' }
   Stars: a mission is worth up to 3 (solved; solved without hints;
   a short program). Fields are only ever added, so older saves keep
   working, and a kid's code is only ever put on the page with
   textContent, never innerHTML.
   ================================================================ */

var CodeLab = (function() {
  'use strict';

  var Lang = CodeLabLang, Check = CodeLabCheck, Data = CodeLabMissions, Art = CodeLabArt;
  var PREFIX = 'zs_codelab_';
  var MAX_FREE = 20, MAX_CODE = 8000, MAX_NOTE = 400;
  var WORLD = 400;                       // the canvas shows -200..200 both ways
  var SPEEDS = { slow: 140, normal: 480, fast: 1800, instant: Infinity };

  var data = null, user = null, tier = 'advanced', age = 10, root = null;
  var view = { screen: 'map', mission: null, free: null, pane: 'code', ghost: true, palTab: 'words' };
  var ed = null, stage = null, runCtl = null;

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function load() {
    var k = key(), d = {};
    if (k) { try { d = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    if (!d.m || typeof d.m !== 'object' || Array.isArray(d.m)) d.m = {};
    if (!Array.isArray(d.free)) d.free = [];
    d.free = d.free.filter(function(f) { return f && typeof f.code === 'string'; }).slice(0, MAX_FREE);
    if (typeof d.draft !== 'string') d.draft = '';
    if (!SPEEDS.hasOwnProperty(d.speed)) d.speed = 'normal';
    d.kb = d.kb === 0 ? 0 : 1;
    d.v = 1;
    return d;
  }
  var saveTimer = null;
  function save() {
    var k = key();
    if (!k) return;
    data.last = today();
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) { try { CloudSync.push(k); } catch (e) {} }
  }
  function saveSoon() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function() { saveTimer = null; save(); }, 900);
  }
  function flushSave() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; save(); } }
  function rec(id) {
    var r = data.m[id];
    if (!r || typeof r !== 'object') r = data.m[id] = { s: 0 };
    return r;
  }
  function starsOf(id) { var r = data.m[id]; return r ? Math.max(0, Math.min(3, r.s | 0)) : 0; }
  function totalStars() { var n = 0; Data.MISSIONS.forEach(function(m) { n += starsOf(m.id); }); return n; }
  function solvedCount() { return Data.MISSIONS.filter(function(m) { return starsOf(m.id) > 0; }).length; }

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function T(es, en) { return typeof zsT === 'function' ? zsT(es, en) : en; }
  function pair(p) { return T(p[0], p[1]); }
  function lang2() { var l = typeof getKidLang === 'function' ? getKidLang() : 'en'; return l === 'es' || l === 'both' ? 'es' : 'en'; }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function log(msg) { if (typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Code Lab', '🐢', msg); } catch (e) {} } }

  function h(tag, attrs, kids) {
    var el = document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;          // only ever our own SVG/static strings
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function(c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function clear(el) { if (typeof ZsCanvas !== 'undefined') ZsCanvas.releaseIn(el); while (el.firstChild) el.removeChild(el.firstChild); }

  // "*word*" in a message is shown in bold; the rest is plain text.
  function boldMsg(text, into) {
    String(text).split('*').forEach(function(part, i) {
      if (!part) return;
      into.appendChild(i % 2 ? h('b', { text: part }) : document.createTextNode(part));
    });
    return into;
  }

  function mTitle(m) { return pair(m.t); }

  // ---------------------------------------------------------------
  // Syntax colours (an overlay under the textarea; display only)
  // ---------------------------------------------------------------
  var KW_SET = Object.create(null); Lang.KEYWORDS.forEach(function(k) { if (k !== 'times') KW_SET[k] = 1; });
  var FN_SET = Object.create(null); Lang.BUILTIN_NAMES.forEach(function(k) { FN_SET[k] = 1; });
  var HL_RE = /(#[^\n]*)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|\u201c[^\u201d\n]*\u201d?|\u2018[^\u2019\n]*\u2019?)|(\b\d+(?:\.\d+)?\b)|(_{3,})|([A-Za-z_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F][A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]*)/g;

  function highlightInto(el, src) {
    clear(el);
    var last = 0, m, frag = document.createDocumentFragment(), cls;
    HL_RE.lastIndex = 0;
    while ((m = HL_RE.exec(src))) {
      if (m.index > last) frag.appendChild(document.createTextNode(src.slice(last, m.index)));
      if (m[1]) cls = 'cl-t-cm'; else if (m[2]) cls = 'cl-t-str'; else if (m[3]) cls = 'cl-t-num'; else if (m[4]) cls = 'cl-t-blank';
      else cls = KW_SET[m[5]] ? 'cl-t-kw' : FN_SET[m[5]] ? 'cl-t-fn' : null;
      if (cls) frag.appendChild(h('span', { class: cls, text: m[0] })); else frag.appendChild(document.createTextNode(m[0]));
      last = m.index + m[0].length;
      if (m[0].length === 0) HL_RE.lastIndex++;
    }
    if (last < src.length) frag.appendChild(document.createTextNode(src.slice(last)));
    frag.appendChild(document.createTextNode('\n'));      // keeps the last empty line's height
    el.appendChild(frag);
  }

  // ---------------------------------------------------------------
  // The editor
  // ---------------------------------------------------------------
  var PAIRS = { '(': ')', '[': ']', '"': '"', '\'': '\'' };
  var CLOSERS = { ')': 1, ']': 1, '"': 1, '\'': 1 };

  function Editor(opts) {
    var self = this;
    this.onChange = opts.onChange || function() {};
    this.onRun = opts.onRun || function() {};
    this.busy = false;
    this.errLine = 0;
    this.gutter = h('div', { class: 'cl-gutter', 'aria-hidden': 'true' });
    this.hl = h('pre', { class: 'cl-hl', 'aria-hidden': 'true' });
    this.errBar = h('div', { class: 'cl-errbar', 'aria-hidden': 'true' });
    this.ta = h('textarea', {
      class: 'cl-ta', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off', wrap: 'off',
      'aria-label': T('Escribe tu código aquí', 'Type your code here'), placeholder: opts.placeholder || '', enterkeyhint: 'enter'
    });
    this.code = h('div', { class: 'cl-code' }, [this.errBar, this.hl, this.ta]);
    this.scroll = h('div', { class: 'cl-scroll' }, [this.gutter, this.code]);
    this.el = h('div', { class: 'cl-editor' }, [this.scroll]);
    this.ta.value = opts.value || '';
    this.ta.addEventListener('input', function() { self.refresh(); self.onChange(self.ta.value); });
    this.ta.addEventListener('beforeinput', function(e) { self.beforeInput(e); });
    this.ta.addEventListener('keydown', function(e) { self.keyDown(e); });
    this.ta.addEventListener('keyup', function() { self.reveal(); });
    this.ta.addEventListener('click', function() { self.reveal(); });
    this.setKeyboard(opts.keyboard !== false);
    this.refresh();
  }
  Editor.prototype.value = function() { return this.ta.value; };
  Editor.prototype.set = function(text) {
    this.ta.value = text;
    this.errLine = 0;
    this.refresh();
    this.onChange(text);
  };
  Editor.prototype.setKeyboard = function(on) {
    this.kb = !!on;
    if (on) this.ta.removeAttribute('inputmode'); else this.ta.setAttribute('inputmode', 'none');
  };
  Editor.prototype.metrics = function() {
    if (this._m) return this._m;
    var probe = h('span', { class: 'cl-probe', text: 'MMMMMMMMMM' });
    this.code.appendChild(probe);
    var w = probe.getBoundingClientRect().width / 10;
    this.code.removeChild(probe);
    var cs = getComputedStyle(this.ta);
    this._m = { ch: w || 9.6, lh: parseFloat(cs.lineHeight) || 24, pad: parseFloat(cs.paddingTop) || 10 };
    return this._m;
  };
  Editor.prototype.refresh = function() {
    var v = this.ta.value, lines = v.split('\n'), n = lines.length, i, widest = 0, mt = this.metrics();
    for (i = 0; i < n; i++) if (lines[i].length > widest) widest = lines[i].length;
    var height = Math.max(n + 1, 8) * mt.lh + mt.pad * 2;
    this.code.style.height = height + 'px';
    this.code.style.minWidth = Math.ceil((widest + 4) * mt.ch + mt.pad * 2) + 'px';
    if (this._lines !== n) {
      this._lines = n;
      clear(this.gutter);
      var frag = document.createDocumentFragment();
      for (i = 1; i <= Math.max(n + 1, 8); i++) frag.appendChild(h('div', { class: 'cl-ln', text: String(i) }));
      this.gutter.appendChild(frag);
    }
    highlightInto(this.hl, v);
    this.markError(this.errLine);
    this.reveal();
  };
  Editor.prototype.markError = function(line) {
    this.errLine = line || 0;
    var mt = this.metrics(), rows = this.gutter.children, i;
    for (i = 0; i < rows.length; i++) rows[i].classList.toggle('cl-ln-err', i + 1 === this.errLine);
    this.errBar.style.display = this.errLine ? 'block' : 'none';
    if (this.errLine) this.errBar.style.top = (mt.pad + (this.errLine - 1) * mt.lh) + 'px';
  };
  Editor.prototype.showLine = function(line) {
    var mt = this.metrics(), top = mt.pad + (line - 1) * mt.lh, sc = this.scroll;
    if (top < sc.scrollTop || top + mt.lh > sc.scrollTop + sc.clientHeight) sc.scrollTop = Math.max(0, top - sc.clientHeight / 3);
  };
  // Keep the caret on screen inside the scroller.
  Editor.prototype.reveal = function() {
    if (document.activeElement !== this.ta) return;
    var mt = this.metrics(), v = this.ta.value, s = this.ta.selectionEnd, before = v.slice(0, s), line = before.split('\n').length - 1;
    var col = s - (before.lastIndexOf('\n') + 1), sc = this.scroll;
    var top = mt.pad + line * mt.lh, left = this.gutter.offsetWidth + mt.pad + col * mt.ch;
    if (top < sc.scrollTop) sc.scrollTop = top;
    else if (top + mt.lh + 4 > sc.scrollTop + sc.clientHeight) sc.scrollTop = top + mt.lh + 4 - sc.clientHeight;
    if (left < sc.scrollLeft + this.gutter.offsetWidth) sc.scrollLeft = Math.max(0, left - this.gutter.offsetWidth - 20);
    else if (left + mt.ch * 2 > sc.scrollLeft + sc.clientWidth) sc.scrollLeft = left + mt.ch * 2 - sc.clientWidth;
  };

  // Insert text at the caret through the browser's own editing command,
  // so undo keeps working; fall back to setRangeText.
  Editor.prototype.insert = function(text) {
    var ta = this.ta, ok = false;
    this.busy = true;
    try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); }
    try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.busy = false;
  };
  Editor.prototype.replaceRange = function(from, to, text, caret) {
    this.ta.setSelectionRange(from, to);
    this.insert(text);
    var c = caret === undefined ? from + text.length : caret;
    this.ta.setSelectionRange(c, c);
    this.reveal();
  };
  Editor.prototype.lineInfo = function(pos) {
    var v = this.ta.value, start = v.lastIndexOf('\n', pos - 1) + 1, end = v.indexOf('\n', pos);
    if (end < 0) end = v.length;
    var text = v.slice(start, end);
    return { start: start, end: end, text: text, indent: /^ */.exec(text)[0] };
  };

  Editor.prototype.beforeInput = function(e) {
    if (this.busy) return;
    var ta = this.ta, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd, t = e.inputType, ch = e.data, next, prev;
    if (t === 'insertText' && ch && ch.length === 1) {
      next = v.charAt(s); prev = v.charAt(s - 1);
      if (s === en) {
        if (CLOSERS[ch] && next === ch) { e.preventDefault(); ta.setSelectionRange(s + 1, s + 1); return; }
        if (PAIRS[ch]) {
          var quote = ch === '"' || ch === '\'';
          if (quote && (/[A-Za-z0-9_]/.test(prev) || /[A-Za-z0-9_]/.test(next))) return;
          if (!quote && /[A-Za-z0-9_]/.test(next)) return;
          e.preventDefault();
          this.insert(ch + PAIRS[ch]);
          ta.setSelectionRange(s + 1, s + 1);
          return;
        }
      } else if (PAIRS[ch]) {
        e.preventDefault();
        var sel = v.slice(s, en);
        this.insert(ch + sel + PAIRS[ch]);
        return;
      }
    } else if (t === 'insertLineBreak' || t === 'insertParagraph') {
      e.preventDefault();
      var li = this.lineInfo(s), before = v.slice(li.start, s).replace(/#.*$/, '').replace(/\s+$/, ''), extra = /:$/.test(before) ? '  ' : '';
      var ind = li.indent;
      if (s - li.start < ind.length) ind = ind.slice(0, s - li.start);
      // Enter between a pair of brackets opens up a line in the middle
      if (PAIRS[v.charAt(s - 1)] && PAIRS[v.charAt(s - 1)] === v.charAt(s) && v.charAt(s) !== '"' && v.charAt(s) !== '\'') {
        this.insert('\n' + ind + '  \n' + ind);
        var c = s + 1 + ind.length + 2;
        ta.setSelectionRange(c, c);
      } else {
        this.insert('\n' + ind + extra);
      }
      this.reveal();
      return;
    } else if (t === 'deleteContentBackward' && s === en && s > 0) {
      if (PAIRS[v.charAt(s - 1)] && PAIRS[v.charAt(s - 1)] === v.charAt(s)) {
        e.preventDefault();
        this.replaceRange(s - 1, s + 1, '', s - 1);
        return;
      }
      var li2 = this.lineInfo(s), col = s - li2.start;
      if (col > 0 && /^ +$/.test(li2.text.slice(0, col)) && col >= 2) {
        e.preventDefault();
        var cut = col % 2 === 0 ? 2 : 1;
        this.replaceRange(s - cut, s, '', s - cut);
      }
    }
  };

  Editor.prototype.indentLines = function(dir) {
    var ta = this.ta, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    var a = this.lineInfo(s).start, b = this.lineInfo(en > s && v.charAt(en - 1) === '\n' ? en - 1 : en).end;
    var block = v.slice(a, b), out;
    if (dir > 0) out = block.split('\n').map(function(l) { return '  ' + l; }).join('\n');
    else out = block.split('\n').map(function(l) { return l.replace(/^ {1,2}/, ''); }).join('\n');
    if (out === block) return;
    ta.setSelectionRange(a, b);
    this.insert(out);
    var shift = out.length - block.length;
    if (s === en) { var c = Math.max(a, s + (dir > 0 ? 2 : shift)); ta.setSelectionRange(c, c); }
    else ta.setSelectionRange(a, a + out.length);
  };

  Editor.prototype.keyDown = function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var ta = this.ta;
      if (ta.selectionStart !== ta.selectionEnd || e.shiftKey) this.indentLines(e.shiftKey ? -1 : 1);
      else this.insert('  ');
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.onRun(); }
  };

  // Palette snippet: kind 'tok' goes in at the caret; 'stmt' starts its own line.
  Editor.prototype.snippet = function(sn, kind) {
    var ta = this.ta, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd, MARK = '\u0001', text = sn.replace('|', MARK);
    var li = this.lineInfo(s), caretAt;
    if (kind === 'stmt') {
      var blankLine = li.text.trim() === '', ind = li.indent;
      var prefix = '';
      if (!blankLine) {
        var code = li.text.replace(/#.*$/, '').replace(/\s+$/, '');
        prefix = '\n' + ind + (/:$/.test(code) ? '  ' : '');
        ind = ind + (/:$/.test(code) ? '  ' : '');
        ta.setSelectionRange(li.end, li.end);
      } else if (s - li.start < ind.length) {
        ind = ind.slice(0, s - li.start);
      }
      text = prefix + text.split('\n').join('\n' + ind);
    }
    caretAt = text.indexOf(MARK);
    text = text.replace(MARK, '');
    var from = ta.selectionStart;
    this.insert(text);
    var c = caretAt >= 0 ? from + caretAt : from + text.length;
    ta.setSelectionRange(c, c);
    this.reveal();
  };
  Editor.prototype.backspace = function() {
    var ta = this.ta, s = ta.selectionStart, en = ta.selectionEnd;
    if (s !== en) { this.replaceRange(s, en, '', s); return; }
    if (s > 0) this.replaceRange(s - 1, s, '', s - 1);
  };

  // ---------------------------------------------------------------
  // The turtle canvas
  // ---------------------------------------------------------------
  function Stage(canvas) {
    this.canvas = canvas;
    this.events = [];
    this.i = 0;                // events fully shown
    this.f = 0;                // how far into event i (0..1)
    this.ghost = null;
    this.showGhost = true;
    this.pose = { x: 0, y: 0, h: 0, pen: true };
    this.k = 1;
    this.fit();
  }
  Stage.prototype.fit = function() {
    var c = this.canvas, wrap = c.parentNode, css = Math.max(220, Math.min(wrap ? wrap.clientWidth || 360 : 360, 460)), d = typeof ZsCanvas !== 'undefined' ? ZsCanvas.dpr() : 1;
    if (this._css === css && this._dpr === d) return;
    this._css = css; this._dpr = d;
    c.style.width = css + 'px'; c.style.height = css + 'px';
    c.width = Math.round(css * d); c.height = Math.round(css * d);
    this.k = c.width / WORLD;
    this.ctx = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(c) : c.getContext('2d');
    this.draw();
  };
  Stage.prototype.setGhost = function(g) { this.ghost = g; this.draw(); };
  Stage.prototype.reset = function(events) {
    this.events = events || [];
    this.i = 0; this.f = 0;
    this.pose = { x: 0, y: 0, h: 0, pen: true };
    this.draw();
  };
  function evCost(ev) {
    switch (ev.t) {
      case 'line': case 'move': return Math.sqrt((ev.x2 - ev.x1) * (ev.x2 - ev.x1) + (ev.y2 - ev.y1) * (ev.y2 - ev.y1)) + 3;
      case 'turn': return 4 + Math.abs(ev.h1 - ev.h0) / 6;
      case 'circle': return 30 + ev.r * 2;
      default: return 0;
    }
  }
  // Move the picture forward by `units` of drawing. Returns true when it has caught up.
  Stage.prototype.advance = function(units) {
    var ev, cost, left;
    while (this.i < this.events.length) {
      ev = this.events[this.i]; cost = evCost(ev);
      if (cost === 0) { this.i++; this.f = 0; continue; }
      left = cost * (1 - this.f);
      if (units >= left) { units -= left; this.i++; this.f = 0; } else { this.f += units / cost; units = 0; break; }
    }
    this.draw();
    return this.i >= this.events.length;
  };
  Stage.prototype.finish = function() { this.i = this.events.length; this.f = 0; this.draw(); };
  Stage.prototype.caughtUp = function() { return this.i >= this.events.length; };

  Stage.prototype.paintEvent = function(ctx, ev, frac) {
    var k = this.k, i, n;
    if (ev.t === 'line') {
      ctx.strokeStyle = ev.c; ctx.lineWidth = ev.w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ev.x1, ev.y1);
      ctx.lineTo(ev.x1 + (ev.x2 - ev.x1) * frac, ev.y1 + (ev.y2 - ev.y1) * frac);
      ctx.stroke();
    } else if (ev.t === 'circle') {
      if (!ev.pen) return;
      ctx.strokeStyle = ev.c; ctx.lineWidth = ev.w; ctx.lineJoin = 'round';
      n = Math.max(2, Math.round(ev.pts.length * frac) + 1);
      ctx.beginPath(); ctx.moveTo(ev.pts[0].x, ev.pts[0].y);
      for (i = 1; i < n && i <= ev.pts.length; i++) ctx.lineTo(ev.pts[i % ev.pts.length].x, ev.pts[i % ev.pts.length].y);
      ctx.stroke();
    } else if (ev.t === 'fill') {
      ctx.fillStyle = ev.c; ctx.beginPath();
      ctx.moveTo(ev.pts[0].x, ev.pts[0].y);
      for (i = 1; i < ev.pts.length; i++) ctx.lineTo(ev.pts[i].x, ev.pts[i].y);
      ctx.closePath(); ctx.fill('nonzero');
      ctx.strokeStyle = 'rgba(28,35,48,0.22)'; ctx.lineWidth = 1 / k; ctx.stroke();
    }
  };

  Stage.prototype.drawGrid = function(ctx) {
    var k = this.k, W = this.canvas.width, v;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, W);
    ctx.lineWidth = 1;
    for (v = -200; v <= 200; v += 50) {
      ctx.strokeStyle = v === 0 ? 'rgba(28,35,48,0.35)' : 'rgba(28,35,48,0.09)';
      ctx.beginPath(); ctx.moveTo((v + 200) * k, 0); ctx.lineTo((v + 200) * k, W); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (v + 200) * k); ctx.lineTo(W, (v + 200) * k); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(28,35,48,0.5)';
    ctx.font = Math.round(10 * k) + 'px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    for (v = -150; v <= 150; v += 50) {
      if (v === 0) continue;
      ctx.fillText(String(v), (v + 200) * k + 2 * k, 202 * k);
      ctx.fillText(String(v), 203 * k, (200 - v) * k + 2 * k);
    }
  };

  Stage.prototype.drawGhost = function(ctx) {
    var g = this.ghost, k = this.k, i, j, s;
    if (!g || !this.showGhost) return;
    ctx.save();
    if (g.fills) {
      g.fills.forEach(function(f) {
        ctx.globalAlpha = 0.28; ctx.fillStyle = Lang.resolveColor(f.c) || '#888';
        ctx.beginPath(); ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for (j = 1; j < f.pts.length; j++) ctx.lineTo(f.pts[j].x, f.pts[j].y);
        ctx.closePath(); ctx.fill('nonzero');
        ctx.globalAlpha = 0.5; ctx.strokeStyle = '#2b6cb0'; ctx.lineWidth = 1.5 / k; ctx.setLineDash([4 / k, 4 / k]); ctx.stroke();
      });
    }
    if (g.segs && g.segs.length) {
      ctx.globalAlpha = 0.65; ctx.strokeStyle = '#2b6cb0'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineCap = 'butt';
      ctx.beginPath();
      for (i = 0; i < g.segs.length; i++) { s = g.segs[i]; ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
      ctx.stroke();
    }
    ctx.restore();
  };

  Stage.prototype.drawTurtle = function(ctx, x, y, hd, pen) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-hd * Math.PI / 180);
    ctx.globalAlpha = pen ? 1 : 0.55;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#9ad37a'; ctx.strokeStyle = '#16692a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 15, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();                 // head
    [[-9, 7], [9, 7], [-9, -7], [9, -7]].forEach(function(p) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#2a9d3f';
    ctx.beginPath(); ctx.ellipse(0, 0, 9.5, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();      // shell
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.stroke();
    ctx.restore();
  };

  Stage.prototype.draw = function() {
    var ctx = this.ctx, k = this.k, i, n = this.events.length, shown = this.i, ev, frac, pose, list = [], fillsAt = {}, upto;
    if (!ctx) return;
    this.drawGrid(ctx);
    ctx.setTransform(k, 0, 0, -k, 200 * k, 200 * k);
    this.drawGhost(ctx);
    upto = Math.min(n, shown + (this.f > 0 ? 1 : 0));
    // a filled shape sits under the lines drawn while it was traced
    for (i = 0; i < upto; i++) {
      ev = this.events[i];
      if (ev.t === 'fill') (fillsAt[ev.at] = fillsAt[ev.at] || []).push(ev);
    }
    for (i = 0; i < upto; i++) {
      if (fillsAt[i]) fillsAt[i].forEach(function(f) { list.push([f, 1]); });
      ev = this.events[i];
      if (ev.t !== 'fill') list.push([ev, i === shown && this.f > 0 ? this.f : 1]);
    }
    for (i = 0; i < list.length; i++) this.paintEvent(ctx, list[i][0], list[i][1]);
    // the turtle
    pose = this.pose;
    if (shown > 0 || this.f > 0) {
      var cur = this.events[shown], prev = this.events[Math.min(shown, n) - 1];
      if (cur && this.f > 0 && (cur.t === 'line' || cur.t === 'move')) {
        pose = { x: cur.x1 + (cur.x2 - cur.x1) * this.f, y: cur.y1 + (cur.y2 - cur.y1) * this.f, h: cur.ph, pen: cur.t === 'line' };
      } else if (cur && this.f > 0 && cur.t === 'turn') {
        pose = { x: cur.px, y: cur.py, h: cur.h0 + (cur.h1 - cur.h0) * this.f, pen: prev ? prev.t !== 'move' : true };
      } else if (prev) {
        pose = { x: prev.px, y: prev.py, h: prev.ph, pen: prev.t !== 'move' };
      }
    }
    this.drawTurtle(ctx, pose.x, pose.y, pose.h, pose.pen);
  };

  // ---------------------------------------------------------------
  // Running a program
  // ---------------------------------------------------------------
  function Runctl(ui) {
    this.ui = ui;
    this.runner = null;
    this.raf = null;
    this.pending = [];
    this.running = false;
  }
  Runctl.prototype.start = function(src) {
    var self = this, ui = this.ui;
    this.cancel();
    ui.clearResult();
    ui.stage.reset([]);
    this.pending = [];
    this.runner = new Lang.Runner(src, { onPrint: function(l) { self.pending.push(l); } });
    if (this.runner.error) { ui.finished(this.runner, src); return; }
    ui.stage.reset(this.runner.machine.turtle.events);
    this.running = true;
    this.last = performance.now();
    ui.setRunning(true);
    this.loop();
  };
  Runctl.prototype.loop = function() {
    var self = this;
    this.raf = requestAnimationFrame(function() { self.tick(); });
  };
  Runctl.prototype.tick = function() {
    var ui = this.ui, r = this.runner, now = performance.now(), dt = Math.min(now - this.last, 100) / 1000, speed = SPEEDS[data.speed] || SPEEDS.normal;
    this.last = now;
    if (!r.done) r.step(7);
    if (this.pending.length) { ui.addOutput(this.pending); this.pending = []; }
    if (r.done && r.error && ui.stage.events.length - ui.stage.i > 400) speed = Infinity;   // a runaway: don't make the kid watch it
    var caught = ui.stage.advance(speed === Infinity ? 1e12 : speed * dt);
    if (r.done && caught) { this.running = false; this.raf = null; ui.setRunning(false); ui.finished(r, ui.editor.value()); return; }
    this.loop();
  };
  Runctl.prototype.cancel = function() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.runner) this.runner.stop();
    if (this.running) { this.running = false; this.ui.setRunning(false); }
  };
  // Stop: if the program has finished and only the drawing is catching up, jump to the end.
  Runctl.prototype.stop = function() {
    var r = this.runner;
    if (!this.running) return;
    if (r && r.done) {
      this.ui.stage.finish();
      if (this.pending.length) { this.ui.addOutput(this.pending); this.pending = []; }
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null; this.running = false; this.ui.setRunning(false);
      this.ui.finished(r, this.ui.editor.value());
    } else {
      this.cancel();
      this.ui.addOutput([T('(detenido)', '(stopped)')]);
    }
  };

  // ---------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------
  function leaveScreen() {
    if (runCtl) runCtl.cancel();
    flushSave();
    ed = null; stage = null; runCtl = null;
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.stop) { try { ZsSpeak.stop(); } catch (e) {} }
  }

  function header(title, sub) {
    return h('div', { class: 'cl-head' }, [
      h('div', { class: 'cl-brand' }, [h('span', { class: 'cl-brand-ico', html: Art.turtle(38) }), h('span', { text: title || 'Code Lab' })]),
      sub ? h('span', { class: 'cl-total', text: sub }) : null
    ]);
  }

  function starRow(n, size) {
    var row = h('span', { class: 'cl-stars', role: 'img', 'aria-label': n + ' / 3' });
    for (var i = 1; i <= 3; i++) row.appendChild(h('span', { class: 'cl-star' + (i <= n ? ' on' : ''), html: Art.star(i <= n, size || 16) }));
    return row;
  }

  function showMap() {
    leaveScreen();
    view.screen = 'map';
    clear(root);
    var next = Data.MISSIONS.filter(function(m) { return starsOf(m.id) === 0; })[0];
    root.appendChild(header('Code Lab', '★ ' + totalStars() + ' / ' + Data.MISSIONS.length * 3));
    root.appendChild(h('div', { class: 'cl-hero' }, [
      h('div', { class: 'cl-hero-art', html: Art.turtle(84) }),
      h('div', { class: 'cl-hero-txt' }, [
        h('p', { class: 'cl-lead', text: T('Escribe código de verdad y mira cómo una tortuga lo dibuja. Viene después de Code Cadet: los bloques ahora son palabras.', 'Write real code and watch a turtle draw it. It comes after Code Cadet: the blocks are now words.') }),
        h('p', { class: 'cl-sub', text: solvedCount() + ' / ' + Data.MISSIONS.length + ' ' + T('misiones', 'missions') })
      ])
    ]));
    var bar = h('div', { class: 'cl-bar' }, [
      next ? h('button', { type: 'button', class: 'cl-btn cl-primary', id: 'cl-next', onclick: function() { openMission(next.id); } }, [T('Siguiente misión: ', 'Next mission: ') + mTitle(next)]) : null,
      h('button', { type: 'button', class: 'cl-btn', id: 'cl-open-workshop', onclick: function() { openWorkshop(); } }, ['🛠 ' + T('Taller libre', 'Free workshop')])
    ]);
    root.appendChild(bar);
    Data.CHAPTERS.forEach(function(ch) {
      var list = Data.inChapter(ch.id), done = list.filter(function(m) { return starsOf(m.id) > 0; }).length;
      var grid = h('div', { class: 'cl-grid' });
      list.forEach(function(m) {
        var n = Data.MISSIONS.indexOf(m) + 1, s = starsOf(m.id);
        grid.appendChild(h('button', {
          type: 'button', class: 'cl-tile' + (s ? ' done' : '') + (next && next.id === m.id ? ' next' : ''), 'data-mission': m.id,
          'aria-label': n + '. ' + mTitle(m) + ' — ' + s + '/3',
          onclick: function() { openMission(m.id); }
        }, [h('span', { class: 'cl-tile-n', text: String(n) }), h('span', { class: 'cl-tile-t', text: mTitle(m) }), starRow(s, 14)]));
      });
      root.appendChild(h('section', { class: 'cl-chapter', style: '--ch:' + ch.color }, [
        h('div', { class: 'cl-ch-head' }, [
          h('span', { class: 'cl-ch-ico', html: Art.chapter(ch.id, 44) }),
          h('div', { class: 'cl-ch-txt' }, [h('h2', { text: pair(ch.t) }), h('p', { text: pair(ch.d) })]),
          h('span', { class: 'cl-ch-count', text: done + '/' + list.length })
        ]),
        grid
      ]));
    });
    window.scrollTo(0, 0);
  }

  // --- the work screen shared by missions and the workshop -----------
  function buildWork(opts) {
    var m = opts.mission, ui = {};
    var wrap = h('div', { class: 'cl-work', 'data-pane': view.pane });

    // goal and bridge
    var top = h('div', { class: 'cl-top' });
    if (m) {
      var idx = Data.MISSIONS.indexOf(m) + 1, ch = Data.CHAPTERS.filter(function(c) { return c.id === m.ch; })[0];
      top.appendChild(h('div', { class: 'cl-goal', style: '--ch:' + ch.color }, [
        h('div', { class: 'cl-goal-tag', text: pair(ch.t) + ' · ' + idx + '/' + Data.MISSIONS.length }),
        h('h2', { class: 'cl-goal-title', text: mTitle(m) }),
        h('p', { class: 'cl-goal-text', 'data-speak': pair(m.g), text: pair(m.g) })
      ]));
      if (m.bridge) top.appendChild(bridgeCard(m));
    } else {
      top.appendChild(h('div', { class: 'cl-goal', style: '--ch:#2a9d3f' }, [
        h('h2', { class: 'cl-goal-title', text: T('Taller libre', 'Free workshop') }),
        h('p', { class: 'cl-goal-text', text: T('Aquí no hay meta: inventa lo que quieras. Guarda tus programas para volver a ellos.', 'There is no goal here: invent anything you like. Save your programs to come back to them.') })
      ]));
    }
    wrap.appendChild(top);

    // phone tabs
    var tabs = h('div', { class: 'cl-tabs', role: 'tablist' }, [
      h('button', { type: 'button', role: 'tab', class: 'cl-tab', id: 'cl-tab-code', 'data-pane': 'code', onclick: function() { setPane('code'); } }, ['✏️ ' + T('Código', 'Code')]),
      h('button', { type: 'button', role: 'tab', class: 'cl-tab', id: 'cl-tab-result', 'data-pane': 'result', onclick: function() { setPane('result'); } }, ['🎨 ' + T('Resultado', 'Result')])
    ]);
    wrap.appendChild(tabs);
    function setPane(p) {
      view.pane = p; wrap.setAttribute('data-pane', p);
      [].forEach.call(tabs.children, function(b) { var on = b.getAttribute('data-pane') === p; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      if (p === 'result' && stage) stage.fit();
      if (p === 'code' && ed) ed.refresh();
    }
    ui.setPane = setPane;

    // --- code pane
    var codePane = h('div', { class: 'cl-pane cl-pane-code' });
    var startCode = opts.code;
    ed = new Editor({
      value: startCode, keyboard: data.kb !== 0, placeholder: T('# Escribe tu código aquí', '# Type your code here'),
      onChange: function(v) { if (ui.onCode) ui.onCode(v); }, onRun: function() { ui.run(); }
    });
    ui.editor = ed;
    codePane.appendChild(ed.el);

    var hintBox = h('div', { class: 'cl-hintbox', id: 'cl-hints', hidden: true, 'aria-live': 'polite' });
    codePane.appendChild(hintBox);

    // palette
    codePane.appendChild(buildPalette(ed));

    // run bar
    var runBtn = h('button', { type: 'button', class: 'cl-btn cl-primary cl-run', id: 'cl-run', onclick: function() { ui.run(); } }, [h('span', { 'aria-hidden': 'true', text: '▶' }), ' ' + T('Correr', 'Run')]);
    var stopBtn = h('button', { type: 'button', class: 'cl-btn cl-stop', id: 'cl-stop', hidden: true, onclick: function() { runCtl.stop(); } }, [h('span', { 'aria-hidden': 'true', text: '■' }), ' ' + T('Parar', 'Stop')]);
    var speed = h('div', { class: 'cl-speed', role: 'group', 'aria-label': T('Velocidad', 'Speed') });
    [['slow', '🐢', T('Lento', 'Slow')], ['normal', '🐇', T('Normal', 'Normal')], ['fast', '⚡', T('Rápido', 'Fast')], ['instant', '⏩', T('Al instante', 'Instant')]].forEach(function(s) {
      speed.appendChild(h('button', {
        type: 'button', 'data-speed': s[0], 'aria-label': s[2], title: s[2], class: data.speed === s[0] ? 'on' : '',
        onclick: function() { data.speed = s[0]; saveSoon(); [].forEach.call(speed.children, function(b) { b.classList.toggle('on', b.getAttribute('data-speed') === s[0]); }); }
      }, [s[1]]));
    });
    var kbBtn = h('button', {
      type: 'button', class: 'cl-btn cl-sm' + (data.kb !== 0 ? ' on' : ''), id: 'cl-kb', 'aria-pressed': data.kb !== 0 ? 'true' : 'false',
      title: T('Teclado del dispositivo', 'Device keyboard'), onclick: function() {
        data.kb = data.kb === 0 ? 1 : 0; ed.setKeyboard(data.kb !== 0); saveSoon();
        kbBtn.classList.toggle('on', data.kb !== 0); kbBtn.setAttribute('aria-pressed', data.kb !== 0 ? 'true' : 'false');
        if (data.kb !== 0) ed.ta.focus();
      }
    }, ['⌨ ' + T('Teclado', 'Keyboard')]);
    var runbar = h('div', { class: 'cl-runbar' }, [runBtn, stopBtn, speed, kbBtn]);
    codePane.appendChild(runbar);

    var tools = h('div', { class: 'cl-tools' });
    if (m) {
      tools.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-hint-btn', onclick: function() { ui.hint(); } }, ['💡 ' + T('Pista', 'Hint')]));
      tools.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-peek', hidden: true, onclick: function() { ui.peek(); } }, ['👀 ' + T('Ver una solución', 'See a solution')]));
    }
    tools.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-startover', onclick: function() { ui.startOver(); } }, ['↺ ' + (m ? T('Empezar de nuevo', 'Start over') : T('Borrar todo', 'Clear all'))]));
    codePane.appendChild(tools);
    wrap.appendChild(codePane);

    // --- result pane
    var resPane = h('div', { class: 'cl-pane cl-pane-result' });
    var banner = h('div', { class: 'cl-banner', id: 'cl-banner', hidden: true, role: 'status', 'aria-live': 'polite' });
    var stopBtn2 = h('button', { type: 'button', class: 'cl-btn cl-stop cl-stop-res', id: 'cl-stop2', hidden: true, onclick: function() { runCtl.stop(); } }, [h('span', { 'aria-hidden': 'true', text: '■' }), ' ' + T('Parar', 'Stop')]);
    resPane.appendChild(stopBtn2);
    resPane.appendChild(banner);
    var showTurtle = !m || m.turtle;
    var canvas = h('canvas', { id: 'cl-canvas', class: 'cl-canvas', width: 360, height: 360, role: 'img', 'aria-label': T('Dibujo de la tortuga', 'The turtle\'s drawing') });
    var canvasWrap = h('div', { class: 'cl-canvas-wrap', hidden: !showTurtle }, [canvas]);
    resPane.appendChild(canvasWrap);
    if (m && m.turtle && m.goal && (m.goal.draw || m.goal.fills)) {
      var gb = h('button', { type: 'button', class: 'cl-btn cl-sm on', id: 'cl-ghost', 'aria-pressed': view.ghost ? 'true' : 'false', onclick: function() {
        view.ghost = !view.ghost; stage.showGhost = view.ghost; stage.draw();
        gb.classList.toggle('on', view.ghost); gb.setAttribute('aria-pressed', view.ghost ? 'true' : 'false');
      } }, ['👁 ' + T('Mostrar la meta', 'Show the goal')]);
      if (!view.ghost) gb.classList.remove('on');
      canvasWrap.appendChild(gb);
    }
    var consoleEl = h('div', { class: 'cl-console', id: 'cl-console', role: 'log', 'aria-live': 'polite', 'aria-label': T('Lo que escribió tu programa', 'What your program printed') });
    consoleEl.appendChild(h('div', { class: 'cl-console-empty', text: T('Aquí aparece lo que escribe print(...)', 'What print(...) writes shows up here') }));
    resPane.appendChild(h('div', { class: 'cl-console-wrap' }, [h('div', { class: 'cl-console-head', text: T('Salida', 'Output') }), consoleEl]));
    var errBox = h('div', { class: 'cl-err', id: 'cl-err', hidden: true, role: 'alert' });
    resPane.appendChild(errBox);
    wrap.appendChild(resPane);

    stage = new Stage(canvas);
    stage.showGhost = view.ghost;
    if (m && m.turtle && m.goal && (m.goal.draw || m.goal.fills)) {
      var refRun = Check.reference(m);
      stage.setGhost({ segs: m.goal.draw ? refRun.turtle.segs : null, fills: m.goal.fills ? (m.goal.fills.spec || refRun.turtle.fills) : null });
    }

    // --- behaviours
    ui.stage = stage;
    ui.clearResult = function() {
      banner.hidden = true; clear(banner); errBox.hidden = true; clear(errBox); ed.markError(0);
      clear(consoleEl); consoleEl.appendChild(h('div', { class: 'cl-console-empty', text: T('(sin salida todavía)', '(no output yet)') }));
      ui.outCount = 0;
    };
    ui.addOutput = function(lines) {
      var empty = consoleEl.querySelector('.cl-console-empty');
      if (empty) consoleEl.removeChild(empty);
      lines.forEach(function(l) {
        if (ui.outCount === 300) consoleEl.appendChild(h('div', { class: 'cl-out-more', text: '…' }));
        if (ui.outCount >= 300) { ui.outCount++; return; }
        consoleEl.appendChild(h('div', { class: 'cl-out', text: l === '' ? ' ' : l }));
        ui.outCount++;
      });
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };
    ui.setRunning = function(on) {
      runBtn.hidden = on; stopBtn.hidden = !on; stopBtn2.hidden = !on;
      wrap.classList.toggle('running', on);
    };
    ui.run = function() {
      if (!runCtl) return;
      if (runCtl.running) return;
      try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}   // closes the on-screen keyboard
      setPane('result');
      runCtl.start(ed.value());
    };
    ui.showError = function(err) {
      errBox.hidden = false; clear(errBox);
      errBox.appendChild(h('div', { class: 'cl-err-title', text: '🙈 ' + T('Algo no encaja todavía', 'Something does not fit yet') }));
      var p = h('p', { class: 'cl-err-msg' });
      boldMsg(Lang.formatError(err, lang2()), p);
      errBox.appendChild(p);
      if (lang2() === 'es' && typeof getKidLang === 'function' && getKidLang() === 'both') {
        var p2 = h('p', { class: 'cl-err-msg cl-sub-lang' });
        boldMsg(Lang.formatError(err, 'en'), p2);
        errBox.appendChild(p2);
      }
      if (err.line) { ed.markError(err.line); ed.showLine(err.line); }
      errBox.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-back-to-code', onclick: function() { setPane('code'); try { ed.ta.focus(); } catch (e) {} } }, ['✏️ ' + T('Volver al código', 'Back to the code')]));
    };
    ui.banner = banner;
    ui.finished = function(runner, src) {
      var run = runner.result();
      if (runner.error) {
        // keep whatever was drawn, and say what went wrong
        ui.showError(runner.error);
        if (opts.onRun) opts.onRun(run, false, null);
        return;
      }
      if (opts.onFinish) opts.onFinish(run, ui, src);
    };
    ui.onCode = opts.onCode;
    ui.hint = opts.hint ? function() { opts.hint(ui, hintBox); } : null;
    ui.peek = opts.peek ? function() { opts.peek(ui, hintBox); } : null;
    ui.startOver = function() { opts.startOver(ui); };
    ui.hintBox = hintBox;
    ui.resPane = resPane;
    ui.wrap = wrap;

    runCtl = new Runctl(ui);
    setPane(view.pane);
    return { el: wrap, ui: ui };
  }

  // The palette of snippets
  var WORDS = [
    ['print', 'print(|)', 'tok'], ['repeat', 'repeat |:\n  ', 'stmt'], ['for', 'for i in range(|):\n  ', 'stmt'], ['while', 'while |:\n  ', 'stmt'],
    ['if', 'if |:\n  ', 'stmt'], ['elif', 'elif |:\n  ', 'stmt'], ['else', 'else:\n  ', 'stmt'], ['def', 'def |():\n  ', 'stmt'],
    ['return', 'return |', 'stmt'], ['break', 'break', 'stmt'], ['continue', 'continue', 'stmt'], ['range(', 'range(|)', 'tok'],
    ['True', 'True', 'tok'], ['False', 'False', 'tok'], ['and', ' and ', 'tok'], ['or', ' or ', 'tok'], ['not', 'not ', 'tok'], ['in', ' in ', 'tok']
  ];
  var DRAW = [
    ['forward', 'forward(|)', 'stmt'], ['back', 'back(|)', 'stmt'], ['turn', 'turn(|)', 'stmt'], ['left', 'left(|)', 'stmt'], ['right', 'right(|)', 'stmt'],
    ['penup', 'penup()', 'stmt'], ['pendown', 'pendown()', 'stmt'], ['color', 'color("|")', 'stmt'], ['circle', 'circle(|)', 'stmt'], ['goto', 'goto(|, )', 'stmt'],
    ['setheading', 'setheading(|)', 'stmt'], ['home', 'home()', 'stmt'], ['width', 'width(|)', 'stmt'], ['begin_fill', 'begin_fill()', 'stmt'], ['end_fill', 'end_fill()', 'stmt']
  ];
  var MORE = [
    ['len(', 'len(|)', 'tok'], ['str(', 'str(|)', 'tok'], ['int(', 'int(|)', 'tok'], ['round(', 'round(|)', 'tok'], ['abs(', 'abs(|)', 'tok'],
    ['min(', 'min(|)', 'tok'], ['max(', 'max(|)', 'tok'], ['sum(', 'sum(|)', 'tok'], ['sqrt(', 'sqrt(|)', 'tok'], ['randint(', 'randint(1, |)', 'tok'],
    ['.append()', '.append(|)', 'tok'], ['.pop()', '.pop()', 'tok'], ['.sort()', '.sort()', 'tok'], ['global', 'global |', 'stmt'], ['None', 'None', 'tok'], ['rgb(', 'rgb(|, , )', 'tok']
  ];
  var SYMS = [
    ['( )', '(|)'], ['[ ]', '[|]'], ['" "', '"|"'], [':', ':'], [',', ', '], ['=', ' = '], ['==', ' == '], ['!=', ' != '], ['<', ' < '], ['>', ' > '],
    ['+', ' + '], ['-', ' - '], ['*', ' * '], ['/', ' / '], ['%', ' % '], ['+=', ' += '], ['.', '.'], ['#', '# ']
  ];

  function buildPalette(editor) {
    var box = h('div', { class: 'cl-palette', id: 'cl-palette' });
    var tabs = h('div', { class: 'cl-pal-tabs', role: 'tablist' });
    var body = h('div', { class: 'cl-pal-body', id: 'cl-pal-body' });
    var syms = h('div', { class: 'cl-pal-syms', id: 'cl-pal-syms' });
    function chip(label, fn, cls, aria) {
      var b = h('button', { type: 'button', class: 'cl-chip ' + (cls || ''), 'aria-label': aria || false, onclick: fn }, [label]);
      // keep the caret and the keyboard state: don't let the tap steal focus
      b.addEventListener('mousedown', function(e) { e.preventDefault(); });
      b.addEventListener('touchstart', function(e) { if (document.activeElement === editor.ta) e.preventDefault(); }, { passive: false });
      return b;
    }
    function fillBody() {
      clear(body);
      var list = view.palTab === 'draw' ? DRAW : view.palTab === 'more' ? MORE : WORDS;
      list.forEach(function(w) {
        body.appendChild(chip(w[0], function() { editor.snippet(w[1], w[2]); }, view.palTab === 'draw' ? 'cl-chip-draw' : 'cl-chip-word'));
      });
    }
    [['words', T('Palabras', 'Words')], ['draw', T('Tortuga', 'Turtle')], ['more', T('Más', 'More')]].forEach(function(t) {
      var b = h('button', { type: 'button', role: 'tab', class: 'cl-pal-tab' + (view.palTab === t[0] ? ' on' : ''), 'data-tab': t[0], 'aria-selected': view.palTab === t[0] ? 'true' : 'false', onclick: function() {
        view.palTab = t[0]; [].forEach.call(tabs.children, function(x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); }); fillBody();
      } }, [t[1]]);
      tabs.appendChild(b);
    });
    SYMS.forEach(function(s) { syms.appendChild(chip(s[0], function() { editor.snippet(s[1], 'tok'); }, 'cl-chip-sym')); });
    syms.appendChild(chip('⇥', function() { editor.insert('  '); }, 'cl-chip-key', T('Sangría', 'Indent')));
    syms.appendChild(chip('⇤', function() { editor.indentLines(-1); }, 'cl-chip-key', T('Quitar sangría', 'Outdent')));
    syms.appendChild(chip('↵', function() { editor.beforeInputEnter(); }, 'cl-chip-key', T('Línea nueva', 'New line')));
    syms.appendChild(chip('⌫', function() { editor.backspace(); }, 'cl-chip-key', T('Borrar', 'Delete')));
    fillBody();
    box.appendChild(tabs); box.appendChild(body); box.appendChild(syms);
    return box;
  }
  // the ↵ chip behaves like Enter does in the editor (keeps the indent)
  Editor.prototype.beforeInputEnter = function() {
    var ta = this.ta, v = ta.value, s = ta.selectionStart, li = this.lineInfo(s);
    var before = v.slice(li.start, s).replace(/#.*$/, '').replace(/\s+$/, '');
    var ind = li.indent;
    if (s - li.start < ind.length) ind = ind.slice(0, s - li.start);
    this.insert('\n' + ind + (/:$/.test(before) ? '  ' : ''));
    this.reveal();
  };

  function bridgeCard(m) {
    var b = m.bridge;
    function blk(spec) {
      var def = ({ move: ['Move', 'motion'], turnRight: ['Turn right', 'turn'], turnLeft: ['Turn left', 'turn'], repeat: ['Repeat', 'loop'], forLoop: ['Count i: 1 →', 'counter'], callF1: ['Call F1', 'func'] })[spec.t] || [spec.t, 'motion'];
      var label = def[0] + (spec.n ? ' ' + spec.n : '');
      var chip = h('div', { class: 'cl-blk cl-cat-' + def[1] }, [
        h('div', { class: 'cl-blk-row' }, [h('span', { class: 'cl-blk-ico', html: Art.block(spec.t, 18) }), h('span', { text: label })])
      ]);
      if (spec.body) {
        chip.classList.add('cl-c');
        var mouth = h('div', { class: 'cl-mouth' }, spec.body.map(blk));
        if (!spec.body.length) mouth.appendChild(h('div', { class: 'cl-blk-dots', text: '…' }));
        chip.appendChild(mouth);
      }
      return chip;
    }
    var blocks = h('div', { class: 'cl-bridge-blocks' }, b.blocks.map(blk));
    if (b.f1) {
      blocks.appendChild(h('div', { class: 'cl-blk-f1' }, [h('div', { class: 'cl-blk-hat', text: 'F1' })].concat(b.f1.map(blk))));
    }
    var code = h('pre', { class: 'cl-bridge-code', text: m.solution });
    return h('details', { class: 'cl-bridge', open: true }, [
      h('summary', { text: '🤖 ' + T('Con bloques (Code Cadet) y con texto', 'In blocks (Code Cadet) and in text') }),
      h('div', { class: 'cl-bridge-body' }, [
        h('div', { class: 'cl-bridge-col' }, [h('div', { class: 'cl-bridge-cap', text: T('Bloques', 'Blocks') }), blocks]),
        h('div', { class: 'cl-bridge-arrow', 'aria-hidden': 'true', text: '→' }),
        h('div', { class: 'cl-bridge-col' }, [h('div', { class: 'cl-bridge-cap', text: T('Texto', 'Text') }), code])
      ]),
      h('p', { class: 'cl-bridge-note', text: pair(b.note) })
    ]);
  }

  // --- mission screen -------------------------------------------------
  function openMission(id) {
    var m = Data.get(id);
    if (!m) { showMap(); return; }
    leaveScreen();
    view.screen = 'mission'; view.mission = id; view.pane = 'code';
    clear(root);
    var r = rec(id), startCode = typeof r.code === 'string' && r.code !== '' ? r.code : Data.starterFor(m, lang2());
    var idx = Data.MISSIONS.indexOf(m);
    var shownHints = r.h | 0;

    root.appendChild(header('Code Lab', '★ ' + totalStars()));
    var nav = h('div', { class: 'cl-nav' }, [
      h('button', { type: 'button', class: 'cl-back', id: 'cl-back', onclick: function() { showMap(); } }, ['← ' + T('Misiones', 'Missions')]),
      h('span', { class: 'cl-nav-stars' }, [starRow(starsOf(id), 18)])
    ]);
    root.appendChild(nav);

    var built = buildWork({
      mission: m, code: startCode,
      onCode: function(v) { var q = rec(id); q.code = v.slice(0, MAX_CODE); saveSoon(); },
      onFinish: function(run, ui, src) { missionFinished(m, run, ui, src); },
      hint: function(ui, box) { showHint(m, ui, box); },
      peek: function(ui, box) { peekSolution(m, ui, box); },
      startOver: function(ui) {
        ZsDialog.confirm({ title: T('¿Empezar de nuevo?', 'Start over?'), message: T('Tu código de esta misión se cambiará por el inicial.', 'Your code for this mission will be replaced by the starting code.'), confirmLabel: T('Sí, empezar', 'Yes, start over'), cancelLabel: T('No', 'No') }).then(function(ok) {
          if (!ok) return;
          ed.set(Data.starterFor(m, lang2())); ui.clearResult();
        });
      }
    });
    root.appendChild(built.el);
    // restore hints already shown
    if (shownHints > 0) renderHints(m, built.ui, built.ui.hintBox, shownHints);
    updateHintButtons(m, built.ui, shownHints);
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.refresh) { try { ZsSpeak.refresh(); } catch (e) {} }
    window.scrollTo(0, 0);
  }

  function renderHints(m, ui, box, n) {
    clear(box);
    if (n <= 0) { box.hidden = true; return; }
    box.hidden = false;
    for (var i = 0; i < Math.min(n, m.h.length); i++) {
      box.appendChild(h('div', { class: 'cl-hint' }, [h('span', { class: 'cl-hint-n', text: String(i + 1) }), h('span', { class: 'cl-hint-t', 'data-speak': pair(m.h[i]), text: pair(m.h[i]) })]));
    }
  }
  function updateHintButtons(m, ui, n) {
    var hb = document.getElementById('cl-hint-btn'), pk = document.getElementById('cl-peek');
    if (hb) {
      hb.disabled = n >= m.h.length;
      clear(hb);
      hb.appendChild(document.createTextNode('💡 ' + T('Pista', 'Hint') + ' ' + Math.min(n + (n < m.h.length ? 1 : 0), m.h.length) + '/' + m.h.length));
    }
    if (pk) pk.hidden = !(n >= m.h.length);
  }
  function showHint(m, ui, box) {
    var r = rec(m.id), n = Math.min((r.h | 0) + 1, m.h.length);
    r.h = n; saveSoon();
    renderHints(m, ui, box, n);
    updateHintButtons(m, ui, n);
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.refresh) { try { ZsSpeak.refresh(); } catch (e) {} }
    ui.setPane('code');
  }
  function peekSolution(m, ui, box) {
    var r = rec(m.id);
    r.peek = 1; saveSoon();
    var pre = h('pre', { class: 'cl-peek-code', id: 'cl-peek-code', text: m.solution });
    var existing = box.querySelector('.cl-peek-card');
    if (existing) box.removeChild(existing);
    box.hidden = false;
    box.appendChild(h('div', { class: 'cl-peek-card' }, [
      h('div', { class: 'cl-peek-title', text: '👀 ' + T('Una forma de resolverlo', 'One way to solve it') }),
      pre,
      h('p', { class: 'cl-peek-note', text: T('Léela, entiéndela y escríbela con tus palabras. Con una solución a la vista, la misión vale 1 estrella.', 'Read it, understand it, and write it in your own way. With a solution in view, the mission is worth 1 star.') })
    ]));
  }

  function missionFinished(m, run, ui, src) {
    var res = Check.evaluate(m, run), r = rec(m.id), banner = ui.banner;
    r.n = (r.n | 0) + 1;
    r.code = String(src).slice(0, MAX_CODE);
    clear(banner); banner.hidden = false; banner.classList.toggle('ok', res.ok); banner.classList.toggle('almost', !res.ok);
    if (res.ok) {
      var stars = Check.starsFor(m, run, r.h | 0);
      if (r.peek) stars = 1;
      var before = starsOf(m.id), first = before === 0;
      if (stars > before) r.s = stars;
      r.t = today();
      save();
      sfx('success');
      log('"' + mTitle(m) + '" ' + T('resuelta', 'solved') + ' — ' + starsOf(m.id) + '/3 ★');
      banner.appendChild(h('div', { class: 'cl-banner-title', text: '🎉 ' + T('¡Misión cumplida!', 'Mission complete!') }));
      banner.appendChild(h('div', { class: 'cl-banner-stars' }, [starRow(stars, 30)]));
      var why = [];
      why.push(T('★ Resolviste la misión', '★ You solved the mission'));
      why.push((r.h | 0) === 0 && !r.peek ? T('★ Sin usar pistas', '★ No hints used') : T('☆ Sin pistas da una estrella más', '☆ No hints earns one more star'));
      why.push(run.lines <= (m.par || Check.reference(m).lines) ? T('★ Programa corto: ' + run.lines + ' líneas', '★ A short program: ' + run.lines + ' lines') : T('☆ En ' + (m.par || Check.reference(m).lines) + ' líneas o menos da otra estrella', '☆ In ' + (m.par || Check.reference(m).lines) + ' lines or fewer earns another star'));
      banner.appendChild(h('ul', { class: 'cl-why' }, why.map(function(t) { return h('li', { text: t }); })));
      var acts = h('div', { class: 'cl-banner-acts' });
      var nextM = Data.MISSIONS[Data.MISSIONS.indexOf(m) + 1];
      if (nextM) acts.appendChild(h('button', { type: 'button', class: 'cl-btn cl-primary', id: 'cl-next-mission', onclick: function() { openMission(nextM.id); } }, [T('Siguiente', 'Next') + ' →']));
      acts.appendChild(h('button', { type: 'button', class: 'cl-btn', id: 'cl-to-map', onclick: function() { showMap(); } }, [T('Mapa', 'Map')]));
      acts.appendChild(h('button', { type: 'button', class: 'cl-btn', id: 'cl-again', onclick: function() { ui.setPane('code'); } }, ['✏️ ' + T('Seguir editando', 'Keep editing')]));
      banner.appendChild(acts);
      if (age >= 12 || tier === 'expert') banner.appendChild(explainCard(m, r));
      if (first && solvedCount() === Data.MISSIONS.length) banner.appendChild(h('p', { class: 'cl-all', text: T('¡Terminaste todas las misiones de Code Lab!', 'You finished every Code Lab mission!') }));
    } else {
      save();
      banner.appendChild(h('div', { class: 'cl-banner-title', text: '🤏 ' + T('¡Casi!', 'Almost!') }));
      banner.appendChild(h('p', { class: 'cl-almost-t', text: T('Tu programa corrió bien, pero todavía no llega a la meta:', 'Your program ran fine, but it does not reach the goal yet:') }));
      var ul = h('ul', { class: 'cl-notes' });
      res.notes.forEach(function(n) { ul.appendChild(h('li', { text: pair(n) })); });
      banner.appendChild(ul);
      banner.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-retry', onclick: function() { ui.setPane('code'); } }, ['✏️ ' + T('Volver al código', 'Back to the code')]));
    }
    var navStars = document.querySelector('.cl-nav-stars');
    if (navStars) { clear(navStars); navStars.appendChild(starRow(starsOf(m.id), 18)); }
    var tot = document.querySelector('.cl-total'); if (tot) tot.textContent = '★ ' + totalStars();
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.refresh) { try { ZsSpeak.refresh(); } catch (e) {} }
  }

  function explainCard(m, r) {
    var ta = h('textarea', { class: 'cl-explain-ta', id: 'cl-explain', maxlength: String(MAX_NOTE), rows: '3', 'aria-label': T('Explica tu código', 'Explain your code'), spellcheck: 'true' });
    ta.value = typeof r.ex === 'string' ? r.ex : '';
    var saved = h('span', { class: 'cl-explain-saved', 'aria-live': 'polite' });
    var btn = h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-explain-save', onclick: function() {
      r.ex = ta.value.slice(0, MAX_NOTE); save(); saved.textContent = '✓ ' + T('Guardado', 'Saved');
    } }, [T('Guardar', 'Save')]);
    return h('div', { class: 'cl-explain' }, [
      h('div', { class: 'cl-explain-title', text: '🗣 ' + T('Explica tu código', 'Explain your code') }),
      h('p', { class: 'cl-explain-q', 'data-speak': pair(m.x), text: pair(m.x) }),
      ta, h('div', { class: 'cl-explain-row' }, [btn, saved])
    ]);
  }

  // --- the free workshop ----------------------------------------------
  function openWorkshop(id) {
    leaveScreen();
    view.screen = 'workshop'; view.pane = 'code';
    clear(root);
    var cur = id ? data.free.filter(function(f) { return f.id === id; })[0] : null;
    view.free = cur ? cur.id : null;
    root.appendChild(header('Code Lab', '★ ' + totalStars()));
    root.appendChild(h('div', { class: 'cl-nav' }, [h('button', { type: 'button', class: 'cl-back', id: 'cl-back', onclick: function() { showMap(); } }, ['← ' + T('Misiones', 'Missions')])]));
    var listEl = h('div', { class: 'cl-saved', id: 'cl-saved' });
    var built = buildWork({
      mission: null, code: cur ? cur.code : data.draft,
      onCode: function(v) { data.draft = v.slice(0, MAX_CODE); saveSoon(); },
      onFinish: function(run, ui) { /* free play: the picture and the output are the result */ },
      startOver: function(ui) {
        ZsDialog.confirm({ title: T('¿Borrar todo?', 'Clear all?'), message: T('Se borra el código de esta pantalla. Los programas guardados no cambian.', 'The code on this screen is cleared. Saved programs stay as they are.'), confirmLabel: T('Sí, borrar', 'Yes, clear'), cancelLabel: T('No', 'No') }).then(function(ok) {
          if (!ok) return; view.free = null; ed.set(''); ui.clearResult(); renderSaved();
        });
      }
    });
    function renderSaved() {
      clear(listEl);
      listEl.appendChild(h('div', { class: 'cl-saved-head', text: T('Mis programas', 'My programs') + ' (' + data.free.length + '/' + MAX_FREE + ')' }));
      var row = h('div', { class: 'cl-saved-row' });
      row.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-ws-new', onclick: function() { openWorkshop(); } }, ['＋ ' + T('Nuevo', 'New')]));
      data.free.forEach(function(f) {
        row.appendChild(h('button', { type: 'button', class: 'cl-btn cl-sm cl-saved-item' + (f.id === view.free ? ' on' : ''), 'data-id': f.id, onclick: function() { openWorkshop(f.id); } }, ['📄 ' + f.name]));
      });
      listEl.appendChild(row);
      var acts = h('div', { class: 'cl-saved-acts' }, [
        h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-ws-save', onclick: function() { saveFree(false); } }, ['💾 ' + T('Guardar', 'Save')]),
        h('button', { type: 'button', class: 'cl-btn cl-sm', id: 'cl-ws-saveas', onclick: function() { saveFree(true); } }, [T('Guardar como…', 'Save as…')]),
        view.free ? h('button', { type: 'button', class: 'cl-btn cl-sm cl-danger', id: 'cl-ws-del', onclick: function() { delFree(); } }, ['🗑 ' + T('Borrar', 'Delete')]) : null
      ]);
      listEl.appendChild(acts);
    }
    function saveFree(asNew) {
      var code = ed.value().slice(0, MAX_CODE), existing = !asNew && view.free ? data.free.filter(function(f) { return f.id === view.free; })[0] : null;
      if (existing) { existing.code = code; existing.t = today(); save(); renderSaved(); ZsDialog.toast(T('Guardado', 'Saved')); return; }
      if (data.free.length >= MAX_FREE) { ZsDialog.alert({ title: T('Hay muchos programas', 'Lots of programs'), message: T('Borra uno para guardar otro nuevo.', 'Delete one to save a new one.') }); return; }
      ZsDialog.prompt({ title: T('Nombre del programa', 'Name of your program'), defaultValue: T('Mi dibujo', 'My drawing') + ' ' + (data.free.length + 1), confirmLabel: T('Guardar', 'Save'), cancelLabel: T('Cancelar', 'Cancel') }).then(function(name) {
        if (name === null) return;
        name = String(name).trim().slice(0, 24) || T('Sin nombre', 'Untitled');
        var f = { id: 'p' + Date.now().toString(36), name: name, code: code, t: today() };
        data.free.push(f); view.free = f.id; save(); renderSaved(); ZsDialog.toast(T('Guardado', 'Saved'));
      });
    }
    function delFree() {
      var f = data.free.filter(function(x) { return x.id === view.free; })[0];
      if (!f) return;
      ZsDialog.confirm({ title: T('¿Borrar este programa?', 'Delete this program?'), message: f.name, confirmLabel: T('Borrar', 'Delete'), cancelLabel: T('No', 'No'), danger: true }).then(function(ok) {
        if (!ok) return;
        data.free = data.free.filter(function(x) { return x.id !== f.id; }); save(); openWorkshop();
      });
    }
    root.appendChild(listEl);
    root.appendChild(built.el);
    renderSaved();
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function init() {
    root = document.getElementById('cl-wrap');
    if (!root || typeof getActiveUser !== 'function') return;
    user = getActiveUser();
    if (!user) return;
    age = user.age || 10;
    tier = typeof getAgeTier === 'function' ? getAgeTier(user.age) : 'advanced';
    data = load();
    showMap();
    window.addEventListener('resize', function() { if (stage) stage.fit(); });
    window.addEventListener('orientationchange', function() { if (stage) setTimeout(function() { stage.fit(); }, 200); });
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', function() { if (document.hidden) flushSave(); });
    if (typeof ZsCanvas !== 'undefined') ZsCanvas.onPressure(function() { /* the only canvas is on screen */ });
  }

  // For the tests: read and drive the app without typing.
  var _t = {
    data: function() { return data; },
    open: openMission, map: showMap, workshop: openWorkshop,
    setCode: function(c) { if (ed) ed.set(c); },
    editor: function() { return ed; },
    run: function() { if (runCtl) runCtl.ui.run(); },
    stars: totalStars, solved: solvedCount
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { _t: _t, init: init };
})();
