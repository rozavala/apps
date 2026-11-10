/* ================================================================
   LÍNEA DEL TIEMPO 🏛️ — a zoomable history timeline with three lanes
   (Chile, the world, the Church), big eras for the youngest, and four
   games: put in order, who lived at the same time, before or after,
   and time-travel trivia.

   Per-kid progress at zs_linea_<kid> (one JSON blob, fields only added):
     { v:1, seen:{ eventId:1 }, g:{ 'order3':stars, 'same':stars, 'ba':stars,
       't_all':stars, 't_<era>':stars }, last:'YYYY-MM-DD' }
   Stars: one for every 10 events opened (up to 15) and the best round
   of each game (up to 3). Content: linea-data.js · maths and games:
   linea-engine.js · pictures: linea-art.js
   ================================================================ */

var Linea = (function () {
  'use strict';

  var D = LineaData, E = LineaEngine, A = LineaArt;
  var PREFIX = 'zs_linea_';
  var HEAD = 54, LANE_H = 186, ROW_H = 78, THUMB = 46;

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function _load() {
    var key = _key(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    d.seen = _obj(d.seen); d.g = _obj(d.g); d.v = 1;
    return d;
  }
  function _save() {
    var key = _key();
    if (!key) return;
    data.last = _today();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }
  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  var data = null, user = null, age = 0, tier = 'intermediate';

  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel, r) { return (r || document).querySelector(sel); }
  function $all(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function root() { return document.getElementById('ln-wrap'); }
  function _sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }

  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function isEs() { return lang() !== 'en'; }
  function bi(es, en) {
    var l = lang();
    return l === 'es' ? esc(es) : l === 'en' ? esc(en) : esc(es) + '<span class="ln-sub">' + esc(en) + '</span>';
  }
  function tx(es, en) { return lang() === 'en' ? en : es; }          // one language
  function pair(p) { return bi(p[0], p[1]); }
  function one(p) { return tx(p[0], p[1]); }
  function speakLang() { return lang() === 'en' ? 'en' : 'es'; }
  function now() { return new Date().getFullYear(); }
  function dateOf(ev) { return E.dateText(ev, isEs()); }
  function laneOf(id) { return D.LANES.filter(function (l) { return l.id === id; })[0]; }

  function starCount() { return typeof getAppStars === 'function' ? getAppStars('linea', data) : 0; }
  function refreshStars() {
    var el = document.getElementById('ln-total');
    if (el) el.textContent = starCount();
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }

  var seedBase = null, seedCount = 0;
  (function () {
    try { var s = new URLSearchParams(location.search).get('seed'); if (s !== null && /^\d{1,9}$/.test(s)) seedBase = parseInt(s, 10); } catch (e) {}
  })();
  function nextRand() {
    if (seedBase !== null) return E.rng(seedBase * 1000 + (seedCount++));
    return E.rng((Math.random() * 4294967296) >>> 0);
  }

  var cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function leaveView() { cleanup.forEach(function (f) { try { f(); } catch (e) {} }); cleanup = []; closeCard(); }

  var current = { view: 'line' };

  // What a kid of this age sees on the timeline.
  function shownTier() { return E.maxTier(tier); }
  function shownEvents() { return D.EVENTS.filter(function (e) { return e.tier <= shownTier(); }); }

  function markSeen(id) {
    if (data.seen[id]) return;
    var before = starCount();
    data.seen[id] = 1;
    _save();
    refreshStars();
    if (starCount() > before) _sound('star');
  }
  function addBest(key, stars) {
    var before = starCount();
    if ((data.g[key] | 0) < stars) { data.g[key] = stars; _save(); }
    refreshStars();
    return starCount() > before;
  }

  function reviewAdd(prompt, answer, choices) {
    try {
      if (typeof Review === 'undefined') return;
      Review.add(null, { app: 'linea', prompt: prompt, answer: answer, choices: choices });
    } catch (e) {}
  }
  function reviewHit(prompt, answer) {
    try {
      if (typeof Review === 'undefined') return;
      var id = Review.idFor('linea', prompt, answer);
      if (Review.get(null, id)) Review.hit(null, id);
    } catch (e) {}
  }

  function art(ev, label) { return A.scene(ev.art, ev.id, label || one(ev.t)); }

  // ---------------------------------------------------------------
  // Shell
  // ---------------------------------------------------------------
  var TABS = [
    { id: 'line', es: 'Línea', en: 'Timeline', ic: '<path d="M3 12h18M7 8v8M12 6v12M17 9v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>' },
    { id: 'eras', es: 'Épocas', en: 'Eras', ic: '<rect x="3" y="4" width="8" height="7" rx="1.5" fill="currentColor"/><rect x="13" y="4" width="8" height="7" rx="1.5" fill="currentColor" opacity=".6"/><rect x="3" y="13" width="8" height="7" rx="1.5" fill="currentColor" opacity=".6"/><rect x="13" y="13" width="8" height="7" rx="1.5" fill="currentColor"/>' },
    { id: 'games', es: 'Juegos', en: 'Games', ic: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.7 6.7 19.6l1.1-6L3.4 9.4l6-.8z" fill="currentColor"/>' }
  ];
  function tabId(view) { return view === 'line' || view === 'eras' ? view : 'games'; }

  function shell(view, inner) {
    var cur = tabId(view);
    var tabs = TABS.map(function (t) {
      return '<button type="button" class="ln-tab' + (t.id === cur ? ' on' : '') + '" data-go="' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : '') + '>' +
        '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" class="ln-tab-ic">' + t.ic + '</svg><span class="ln-tab-t">' + bi(t.es, t.en) + '</span></button>';
    }).join('');
    return '<header class="ln-head"><button type="button" class="ln-brand" data-go="' + (tier === 'beginner' ? 'eras' : 'line') + '" aria-label="' + esc(tx('Línea del Tiempo, inicio', 'Timeline home')) + '"><span class="ln-brand-t">Línea del Tiempo</span></button>' +
      '<div class="ln-total" title="' + esc(tx('Estrellas', 'Stars')) + '">★ <span id="ln-total">' + starCount() + '</span></div></header>' +
      '<nav class="ln-tabs" aria-label="' + esc(tx('Secciones', 'Sections')) + '">' + tabs + '</nav>' +
      '<main class="ln-main" id="ln-main">' + inner + '</main>';
  }

  function render(view, inner, after) {
    leaveView();
    current.view = view;
    root().innerHTML = shell(view, inner);
    $all('[data-go]', root()).forEach(function (b) {
      b.addEventListener('click', function () { _sound('click'); go(b.getAttribute('data-go'), b.getAttribute('data-arg') || undefined); });
    });
    if (after) after(root());
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.scan) { try { ZsSpeak.scan(); } catch (e) {} }
    if (view !== 'line') { try { window.scrollTo(0, 0); } catch (e) {} }
  }

  function go(where, arg) {
    switch (where) {
      case 'line': return viewTimeline();
      case 'eras': return viewEras();
      case 'games': return viewGames();
      case 'order': return viewOrder();
      case 'same': return viewSame();
      case 'ba': return viewBA();
      case 'trivia': return viewTriviaPick();
      case 'trivia-go': return viewTrivia(arg);
    }
    return viewTimeline();
  }

  function top(backTo, title, sub) {
    return '<div class="ln-top">' + (backTo ? '<button type="button" class="ln-back" data-go="' + backTo + '" aria-label="' + esc(tx('Volver', 'Back')) + '">←</button>' : '') +
      '<div><h1 class="ln-h1">' + title + '</h1>' + (sub ? '<p class="ln-lead">' + sub + '</p>' : '') + '</div></div>';
  }

  // ---------------------------------------------------------------
  // The event card
  // ---------------------------------------------------------------
  var cardEl = null, cardReturn = null;

  function laneChip(ev) {
    var l = laneOf(ev.lane);
    return '<span class="ln-chip" style="--c:' + l.color + '">' + bi(l.es, l.en) + '</span>';
  }
  function linkHtml(l) {
    var app = D.APP_LINKS[l.app];
    if (!app) return '';
    var lbl = app[isEs() ? 'es' : 'en'] + (l.es ? ': ' + (isEs() ? l.es : l.en) : '');
    return '<a class="ln-link" href="' + app.href + '"><span>' + esc(lbl) + '</span></a>';
  }

  // "hace 485 años"; approximate dates say "unos" / "about" and round.
  function agoText(ev, ago, es) {
    var n = ago, about = '';
    if (ev.c || ev.dt) { n = ago >= 1000 ? Math.round(ago / 100) * 100 : ago >= 100 ? Math.round(ago / 50) * 50 : ago; about = n === ago ? '' : 'x'; if (ev.c) about = 'x'; }
    return about ? tx('hace unos ' + E.fmtNum(n, es) + ' años', 'about ' + E.fmtNum(n, es) + ' years ago') : tx('hace ' + E.fmtNum(n, es) + ' años', E.fmtNum(n, es) + ' years ago');
  }

  function cardHtml(ev) {
    var es = isEs(), ago = E.agoYears(ev, now()), era = E.eraOf(ev), small = tier === 'beginner';
    var neighbours = shownEvents().filter(function (e) { return e.lane === ev.lane; });
    var i = neighbours.indexOf(ev), prev = neighbours[i - 1], next = neighbours[i + 1];
    var speakText = one(ev.t) + '. ' + one(ev.d);
    var h = '<div class="ln-sheet" id="ln-sheet"><div class="ln-scrim" data-close></div>' +
      '<section class="ln-card" role="dialog" aria-modal="true" aria-labelledby="ln-card-t">' +
      '<button type="button" class="ln-x" data-close aria-label="' + esc(tx('Cerrar', 'Close')) + '">×</button>' +
      '<div class="ln-card-art">' + art(ev) + '</div><div class="ln-card-body">' +
      '<div class="ln-card-meta">' + laneChip(ev) + '<span class="ln-era">' + bi(era.es, era.en) + '</span></div>' +
      '<h2 class="ln-card-t" id="ln-card-t">' + pair(ev.t) + '</h2>' +
      '<p class="ln-date"><b>' + esc(dateOf(ev)) + '</b>' + (ago > 0 ? ' · <span class="ln-ago">' + esc(agoText(ev, ago, es)) + '</span>' : '') + '</p>' +
      '<p class="ln-desc" data-speak="' + esc(speakText) + '">' + pair(ev.d) + '</p>';
    if (!small) h += '<div class="ln-why"><h3 class="ln-h3">' + bi('Por qué importa', 'Why it matters') + '</h3><p>' + pair(ev.w) + '</p></div>';
    if (tier === 'advanced' || tier === 'expert') {
      if (ev.x && (ev.x.c || ev.x.e)) {
        h += '<div class="ln-cause">' +
          (ev.x.c ? '<div><h3 class="ln-h3">' + bi('Antes', 'Before') + '</h3><p>' + pair(ev.x.c) + '</p></div>' : '') +
          (ev.x.e ? '<div><h3 class="ln-h3">' + bi('Después', 'After') + '</h3><p>' + pair(ev.x.e) + '</p></div>' : '') + '</div>';
      }
      var at = shownEvents().filter(function (e) { return e.lane !== ev.lane && !e.person && Math.abs(E.astro(e.y) - E.astro(ev.y)) <= 40; })
        .sort(function (a, b) { return Math.abs(E.astro(a.y) - E.astro(ev.y)) - Math.abs(E.astro(b.y) - E.astro(ev.y)); }).slice(0, 3);
      if (at.length) {
        h += '<div class="ln-same"><h3 class="ln-h3">' + bi('Al mismo tiempo', 'At the same time') + '</h3><div class="ln-same-list">' +
          at.map(function (e) { return '<button type="button" class="ln-chip-btn" data-open="' + e.id + '" style="--c:' + laneOf(e.lane).color + '"><b>' + esc(dateOf(e)) + '</b> ' + esc(one(e.t)) + '</button>'; }).join('') + '</div></div>';
      }
    }
    if (ev.person && !small) h += '<p class="ln-life">' + bi('Vivió', 'Lived') + ': ' + esc(E.dateText(ev, es)) + '</p>';
    if (ev.ln.length) h += '<div class="ln-links"><h3 class="ln-h3">' + bi('Sigue explorando', 'Keep exploring') + '</h3>' + ev.ln.map(linkHtml).join('') + '</div>';
    if (!small) h += '<p class="ln-src">' + esc(tx('Fuente: ', 'Source: ') + ev.src) + '</p>';
    h += '<div class="ln-card-nav">' +
      '<button type="button" class="ln-btn ln-btn-ghost" data-open="' + (prev ? prev.id : '') + '"' + (prev ? '' : ' disabled') + ' aria-label="' + esc(tx('Evento anterior', 'Previous event')) + '">‹</button>' +
      '<button type="button" class="ln-btn" data-find="' + ev.id + '">' + bi('Ver en la línea', 'Show on the timeline') + '</button>' +
      '<button type="button" class="ln-btn ln-btn-ghost" data-open="' + (next ? next.id : '') + '"' + (next ? '' : ' disabled') + ' aria-label="' + esc(tx('Evento siguiente', 'Next event')) + '">›</button></div>' +
      '</div></section></div>';
    return h;
  }

  function openCard(id, fromEl) {
    var ev = D.BY_ID[id];
    if (!ev) return;
    var keep = cardEl ? null : (fromEl || document.activeElement);
    closeCard(true);
    cardReturn = keep || cardReturn;
    var wrap = document.createElement('div');
    wrap.innerHTML = cardHtml(ev);
    cardEl = wrap.firstChild;
    document.body.appendChild(cardEl);
    document.body.classList.add('ln-noscroll');
    $all('[data-close]', cardEl).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); closeCard(); }); });
    $all('[data-open]', cardEl).forEach(function (b) { b.addEventListener('click', function () { var t = b.getAttribute('data-open'); if (t) { _sound('click'); openCard(t); } }); });
    $all('[data-find]', cardEl).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); var t = b.getAttribute('data-find'); closeCard(); showOnTimeline(t); }); });
    markSeen(id);
    var x = $('.ln-x', cardEl);
    if (x) { try { x.focus(); } catch (e) {} }
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.scan) { try { ZsSpeak.scan(); } catch (e) {} }
    current.card = id;
  }
  function closeCard(keepReturn) {
    if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
    cardEl = null; current.card = null;
    document.body.classList.remove('ln-noscroll');
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.stop) { try { ZsSpeak.stop(); } catch (e) {} }
    if (!keepReturn && cardReturn && cardReturn.focus && document.contains(cardReturn)) { try { cardReturn.focus(); } catch (e) {} }
    if (!keepReturn) cardReturn = null;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cardEl) closeCard(); });

  // ---------------------------------------------------------------
  // The timeline
  // ---------------------------------------------------------------
  var TL = null;
  var reduce = false;
  try { reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  function markerDate(ev) {
    if (ev.person) return (ev.c ? 'c. ' : '') + E.yearLabel(ev.sp[0], isEs());
    return dateOf(ev);
  }

  function viewTimeline() {
    var html = '<div class="ln-tl">' +
      '<div class="ln-toolbar">' +
        '<button type="button" class="ln-tbtn" id="ln-out" aria-label="' + esc(tx('Alejar', 'Zoom out')) + '"><svg viewBox="0 0 24 24" width="22" height="22"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 10h6M15 15l5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
        '<input type="range" id="ln-zoom" min="0" max="1000" step="1" value="500" aria-label="' + esc(tx('Zoom', 'Zoom')) + '">' +
        '<button type="button" class="ln-tbtn" id="ln-in" aria-label="' + esc(tx('Acercar', 'Zoom in')) + '"><svg viewBox="0 0 24 24" width="22" height="22"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 10h6M10 7v6M15 15l5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
        '<button type="button" class="ln-tbtn ln-tbtn-t" id="ln-all">' + esc(tx('Todo', 'All')) + '</button>' +
        '<button type="button" class="ln-tbtn ln-tbtn-t" id="ln-today">' + esc(tx('Hoy', 'Today')) + '</button>' +
      '</div>' +
      '<div class="ln-range" id="ln-range" aria-live="polite"></div>' +
      '<div class="ln-stage" id="ln-stage" tabindex="0" role="group" aria-label="' + esc(tx('Línea del tiempo: arrastra para moverte, pellizca para acercar', 'Timeline: drag to move, pinch to zoom')) + '"></div>' +
      '<p class="ln-hint">' + bi('Arrastra para moverte, pellizca (o usa + y −) para acercar. Toca un dibujo para saber más.', 'Drag to move, pinch (or use + and −) to zoom. Tap a picture to learn more.') + '</p>' +
      '</div>';
    render('line', html, function () { buildStage(); });
  }

  function buildStage() {
    var stage = $('#ln-stage');
    var evs = shownEvents(), W = stage.clientWidth || 358;
    TL = { stage: stage, W: W, cx: 1000, ppy: 0.12, mk: {}, bars: {}, lay: null, layKey: null, drag: false, anim: 0, evs: evs };
    var small = tier === 'beginner';
    var h = '<div class="ln-eras-strip" id="ln-eras"></div><div class="ln-axis" id="ln-axis"></div><div class="ln-grid" id="ln-grid"></div>';
    D.LANES.forEach(function (l, i) {
      h += '<div class="ln-lane" style="top:' + (HEAD + i * LANE_H) + 'px;height:' + LANE_H + 'px;--c:' + l.color + '"></div>' +
        '<div class="ln-lane-tag" style="top:' + (HEAD + i * LANE_H + 4) + 'px;--c:' + l.color + '">' + esc(tx(l.es, l.en)) + '</div>';
    });
    h += '<div class="ln-split" id="ln-split"><span>' + esc(tx('a. C.', 'BC')) + '</span><span>' + esc(tx('d. C.', 'AD')) + '</span></div>';
    evs.forEach(function (ev) {
      var l = laneOf(ev.lane);
      var b = '<button type="button" class="ln-mk' + (small ? ' big' : '') + (ev.person ? ' person' : '') + '" data-id="' + ev.id + '" style="--c:' + l.color + '" aria-label="' + esc(one(ev.t) + ', ' + dateOf(ev)) + '">' +
        '<span class="ln-thumb"></span>' + (small ? '' : '<span class="ln-badge">' + esc(markerDate(ev)) + '</span>') + '<span class="ln-lbl">' + esc(one(ev.t)) + '</span></button>';
      stage.insertAdjacentHTML('beforeend', '');
      h += b;
      if (ev.person && !small) h += '<i class="ln-bar" data-bar="' + ev.id + '" style="--c:' + l.color + '"></i>';
    });
    stage.style.height = (HEAD + D.LANES.length * LANE_H) + 'px';
    stage.innerHTML = h;
    evs.forEach(function (ev) {
      TL.mk[ev.id] = $('.ln-mk[data-id="' + ev.id + '"]', stage);
      if (ev.person && !small) TL.bars[ev.id] = $('.ln-bar[data-bar="' + ev.id + '"]', stage);
      TL.mk[ev.id].addEventListener('click', function (e) {
        if (TL.suppress) { e.preventDefault(); return; }
        _sound('click'); openCard(ev.id, TL.mk[ev.id]);
      });
    });
    TL.minPpy = W / 7800; TL.maxPpy = W / 24;
    setView(1000, W / 3000, 0);
    wireStage();
    wireToolbar();
    var onResize = function () { TL.W = stage.clientWidth || TL.W; draw(); };
    window.addEventListener('resize', onResize);
    onLeave(function () { window.removeEventListener('resize', onResize); if (TL && TL.anim) cancelAnimationFrame(TL.anim); TL = null; });
  }

  function clampView(cx, ppy) {
    ppy = Math.max(TL.minPpy, Math.min(TL.maxPpy, ppy));
    var half = TL.W / 2 / ppy, lo = D.START + half * 0.25, hi = D.END - half * 0.25;
    cx = Math.max(lo, Math.min(hi, cx));
    return [cx, ppy];
  }
  function setView(cx, ppy, ms) {
    if (!TL) return;
    var v = clampView(cx, ppy);
    if (!ms || reduce) { if (TL.anim) cancelAnimationFrame(TL.anim); TL.anim = 0; TL.cx = v[0]; TL.ppy = v[1]; draw(); return; }
    var c0 = TL.cx, p0 = TL.ppy, t0 = null;
    if (TL.anim) cancelAnimationFrame(TL.anim);
    var step = function (t) {
      if (!TL) return;
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      TL.cx = c0 + (v[0] - c0) * e;
      TL.ppy = Math.exp(Math.log(p0) + (Math.log(v[1]) - Math.log(p0)) * e);
      draw();
      TL.anim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    TL.anim = requestAnimationFrame(step);
  }
  function zoomBy(f, px) {
    if (!TL) return;
    var rect = TL.stage.getBoundingClientRect(), mx = (px === undefined ? rect.left + TL.W / 2 : px) - rect.left;
    var anchor = TL.cx + (mx - TL.W / 2) / TL.ppy, ppy = Math.max(TL.minPpy, Math.min(TL.maxPpy, TL.ppy * f));
    setView(anchor - (mx - TL.W / 2) / ppy, ppy, 0);
  }

  function showOnTimeline(id) {
    var ev = D.BY_ID[id];
    if (!ev) return;
    var go_ = function () {
      if (!TL) return;
      var a = E.astro(ev.y) + (ev.sp ? (E.astro(ev.sp[1]) - E.astro(ev.sp[0])) / 2 : 0);
      TL.flash = id;
      setView(a, Math.min(TL.maxPpy, Math.max(TL.ppy, TL.W / 260)), 450);
      setTimeout(function () { var m = TL && TL.mk[id]; if (m) { m.classList.add('flash'); setTimeout(function () { m.classList.remove('flash'); }, 1800); try { m.focus({ preventScroll: true }); } catch (e) {} } }, reduce ? 0 : 480);
    };
    if (current.view !== 'line') { viewTimeline(); setTimeout(go_, 0); } else go_();
  }

  function layoutNow() {
    var key = Math.round(TL.ppy * 10000) + ':' + tier;
    if (TL.layKey !== key) {
      TL.layKey = key;
      TL.lay = E.layout(TL.ppy, { rows: 2, width: tier === 'beginner' ? 96 : 88, maxTier: shownTier() });
    }
    return TL.lay;
  }

  function draw() {
    if (!TL) return;
    var W = TL.W, cx = TL.cx, ppy = TL.ppy, lay = layoutNow(), es = isEs();
    var fromA = cx - W / 2 / ppy, toA = cx + W / 2 / ppy;
    TL.evs.forEach(function (ev) {
      var m = TL.mk[ev.id], row = lay[ev.id];
      var x = (E.astro(ev.y) - cx) * ppy + W / 2;
      var laneIdx = D.LANES.map(function (l) { return l.id; }).indexOf(ev.lane);
      var vis = row !== undefined && x > -50 && x < W + 50;
      if (!vis) { if (m.style.display !== 'none') m.style.display = 'none'; var b0 = TL.bars[ev.id]; if (b0) b0.style.display = 'none'; return; }
      if (!m.__built) { m.firstChild.innerHTML = art(ev); m.__built = 1; }
      var y = HEAD + laneIdx * LANE_H + 24 + row * ROW_H;
      m.style.display = '';
      m.style.transform = 'translate(' + (x - 45).toFixed(1) + 'px,' + y + 'px)';
      var bar = TL.bars[ev.id];
      if (bar) {
        var w = (E.astro(ev.sp[1]) - E.astro(ev.sp[0])) * ppy;
        if (w >= 12) { bar.style.display = ''; bar.style.width = w.toFixed(1) + 'px'; bar.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y + THUMB + 1) + 'px)'; }
        else bar.style.display = 'none';
      }
    });
    // era strip
    var h = '';
    D.ERAS.forEach(function (e, i) {
      var a = E.astro(i === 0 ? D.START : e.from), b = E.astro(Math.min(e.to, D.END));
      var l = (a - cx) * ppy + W / 2, r = (b - cx) * ppy + W / 2;
      if (r < 0 || l > W) return;
      h += '<button type="button" class="ln-era-seg e' + i + '" data-era="' + e.id + '" style="left:' + l.toFixed(1) + 'px;width:' + Math.max(0, r - l).toFixed(1) + 'px" title="' + esc(tx(e.es, e.en)) + '"><span>' + esc(tx(e.es, e.en)) + '</span></button>';
    });
    $('#ln-eras', TL.stage).innerHTML = h;
    // axis ticks
    var tk = E.ticks(fromA, toA, ppy, es), ax = '', gr = '';
    tk.forEach(function (t) {
      var x = (t.a - cx) * ppy + W / 2;
      if (x < -40 || x > W + 40) return;
      ax += '<span class="ln-tick" style="left:' + x.toFixed(1) + 'px">' + esc(t.text) + '</span>';
      gr += '<i style="left:' + x.toFixed(1) + 'px"></i>';
    });
    $('#ln-axis', TL.stage).innerHTML = ax;
    $('#ln-grid', TL.stage).innerHTML = gr;
    var sp = $('#ln-split', TL.stage), sx = (0.5 - cx) * ppy + W / 2;
    sp.style.display = sx > -30 && sx < W + 30 ? '' : 'none';
    sp.style.left = sx.toFixed(1) + 'px';
    // range text + slider
    var rng = $('#ln-range');
    if (rng) {
      var f0 = E.fromAstro(Math.round(fromA)), t0 = E.fromAstro(Math.round(toA));
      rng.textContent = E.yearLabel(Math.max(D.START, f0), es) + ' – ' + E.yearLabel(Math.min(D.END, t0), es);
    }
    var z = $('#ln-zoom');
    if (z) z.value = String(Math.round(1000 * Math.log(ppy / TL.minPpy) / Math.log(TL.maxPpy / TL.minPpy)));
    $all('.ln-era-seg', TL.stage).forEach(function (b) { b.onclick = function (e) { if (TL.suppress) return; _sound('click'); zoomToEra(b.getAttribute('data-era')); }; });
  }

  function zoomToEra(id) {
    var e = D.ERAS.filter(function (x) { return x.id === id; })[0];
    if (!e || !TL) return;
    var a = E.astro(e.from === D.ERAS[0].from ? -3300 : e.from), b = E.astro(Math.min(e.to, 2030));
    setView((a + b) / 2, TL.W / ((b - a) * 1.1), 450);
  }

  function wireToolbar() {
    $('#ln-in').addEventListener('click', function () { _sound('click'); setView(TL.cx, TL.ppy * 1.8, 220); });
    $('#ln-out').addEventListener('click', function () { _sound('click'); setView(TL.cx, TL.ppy / 1.8, 220); });
    $('#ln-all').addEventListener('click', function () { _sound('click'); setView(-1700, TL.W / 7800 * 1.0, 450); });
    $('#ln-today').addEventListener('click', function () { _sound('click'); setView(2000, TL.W / 60, 450); });
    $('#ln-zoom').addEventListener('input', function (e) {
      var k = Number(e.target.value) / 1000, ppy = TL.minPpy * Math.pow(TL.maxPpy / TL.minPpy, k);
      setView(TL.cx, ppy, 0);
    });
  }

  function wireStage() {
    var stage = TL.stage, ptrs = {}, g = null;
    function pts() { return Object.keys(ptrs).map(function (k) { return ptrs[k]; }); }
    function beginPinch() {
      var p = pts(); if (p.length < 2) return;
      var rect = stage.getBoundingClientRect(), mx = (p[0].x + p[1].x) / 2 - rect.left;
      g = { mode: 'pinch', d0: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, ppy0: TL.ppy, anchor: TL.cx + (mx - TL.W / 2) / TL.ppy };
    }
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (TL.anim) { cancelAnimationFrame(TL.anim); TL.anim = 0; }
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(ptrs).length;
      if (n === 1) g = { mode: 'drag', x: e.clientX, moved: 0 };
      else if (n === 2) { beginPinch(); TL.suppress = true; }
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
    function mv(e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (!g || !TL) return;
      if (g.mode === 'drag') {
        var dx = e.clientX - g.x;
        g.moved += Math.abs(dx); g.x = e.clientX;
        if (g.moved > 7) { TL.suppress = true; stage.classList.add('dragging'); }
        if (TL.suppress) { var v = clampView(TL.cx - dx / TL.ppy, TL.ppy); TL.cx = v[0]; requestDraw(); }
      } else if (g.mode === 'pinch') {
        var p = pts(); if (p.length < 2) return;
        var rect = stage.getBoundingClientRect(), mx = (p[0].x + p[1].x) / 2 - rect.left;
        var ppy = Math.max(TL.minPpy, Math.min(TL.maxPpy, g.ppy0 * (Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / g.d0)));
        var v2 = clampView(g.anchor - (mx - TL.W / 2) / ppy, ppy); TL.cx = v2[0]; TL.ppy = v2[1]; requestDraw();
      }
    }
    function up(e) {
      delete ptrs[e.pointerId];
      var n = Object.keys(ptrs).length;
      if (n === 1 && g) { var p = pts()[0]; g = { mode: 'drag', x: p.x, moved: 99 }; }
      if (n === 0) {
        g = null; stage.classList.remove('dragging');
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        setTimeout(function () { if (TL) TL.suppress = false; }, 60);
      }
    }
    var queued = false;
    function requestDraw() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; draw(); }); }
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0016)), e.clientX);
      else { var v = clampView(TL.cx + e.deltaX / TL.ppy, TL.ppy); TL.cx = v[0]; requestDraw(); }
    }, { passive: false });
    stage.addEventListener('keydown', function (e) {
      if (e.target !== stage) return;
      var step = TL.W * 0.2 / TL.ppy;
      if (e.key === 'ArrowLeft') { setView(TL.cx - step, TL.ppy, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setView(TL.cx + step, TL.ppy, 0); e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') { setView(TL.cx, TL.ppy * 1.4, 0); e.preventDefault(); }
      else if (e.key === '-') { setView(TL.cx, TL.ppy / 1.4, 0); e.preventDefault(); }
    });
  }

  // ---------------------------------------------------------------
  // Eras
  // ---------------------------------------------------------------
  function viewEras() {
    var small = tier === 'beginner', es = isEs();
    var h = top(null, bi('Épocas', 'Eras'), bi('Toca una época para ver sus historias.', 'Tap an era to see its stories.')) + '<div class="ln-eras">';
    D.ERAS.forEach(function (e) {
      var list = D.EVENTS.filter(function (ev) { return E.eraOf(ev).id === e.id && ev.tier <= shownTier() && !ev.person; });
      var head = list.filter(function (ev) { return ev.tier === 1; });
      if (head.length < 3) head = head.concat(list.filter(function (ev) { return ev.tier > 1; })).slice(0, 3);
      head = head.slice(0, 3);
      var ago = Math.max(0, now() - E.astro(e.id === 'anc' ? -3000 : e.from));
      h += '<section class="ln-era-card" aria-labelledby="ln-e-' + e.id + '"><div class="ln-era-art">' + A.scene(e.art, e.id, one([e.es, e.en])) + '</div>' +
        '<div class="ln-era-body"><h2 class="ln-h2" id="ln-e-' + e.id + '">' + bi(e.es, e.en) + '</h2>' +
        '<p class="ln-era-r">' + (small ? esc(tx(e.id === 'now' ? 'Ahora' : 'Hace más de ' + E.fmtNum(Math.floor(ago / 100) * 100, es) + ' años', e.id === 'now' ? 'Now' : 'More than ' + E.fmtNum(Math.floor(ago / 100) * 100, es) + ' years ago')) : pair(e.r)) + '</p>' +
        '<div class="ln-era-evs">' + head.map(function (ev) {
          return '<button type="button" class="ln-era-ev" data-open="' + ev.id + '" style="--c:' + laneOf(ev.lane).color + '"><span class="ln-era-th">' + art(ev) + '</span><span>' + esc(one(ev.t)) + '</span></button>';
        }).join('') + '</div>' +
        '<button type="button" class="ln-btn ln-btn-ghost ln-era-go" data-zoom="' + e.id + '">' + bi('Ver en la línea', 'Show on the timeline') + '</button></div></section>';
    });
    h += '</div>';
    render('eras', h, function (r) {
      $all('[data-open]', r).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); openCard(b.getAttribute('data-open'), b); }); });
      $all('[data-zoom]', r).forEach(function (b) {
        b.addEventListener('click', function () { _sound('click'); var id = b.getAttribute('data-zoom'); viewTimeline(); setTimeout(function () { zoomToEra(id); }, 0); });
      });
    });
  }

  // ---------------------------------------------------------------
  // Games home
  // ---------------------------------------------------------------
  function gameStars(keys) { var n = 0; keys.forEach(function (k) { n += Math.max(0, Math.min(3, data.g[k] | 0)); }); return n; }

  function viewGames() {
    var nOrder = E.ORDER_N[E.TIERS.indexOf(tier)];
    var list = [
      { id: 'order', es: 'Ponlos en orden', en: 'Put them in order', d: ['Arrastra las tarjetas: de la más antigua a la más nueva.', 'Drag the cards: oldest first, newest last.'], ic: 'order', best: gameStars(['order' + nOrder]) },
      { id: 'same', es: '¿Quién vivió en la misma época?', en: 'Who lived at the same time?', d: ['Busca a quien vivió en la misma época.', 'Find who lived in the same time.'], ic: 'same', best: gameStars(['same']) },
      { id: 'ba', es: '¿Antes o después?', en: 'Before or after?', d: ['¿Pasó antes o después?', 'Did it happen before or after?'], ic: 'ba', best: gameStars(['ba']) },
      { id: 'trivia', es: 'Viaje en el tiempo', en: 'Time-travel trivia', d: ['Elige una época y contesta preguntas.', 'Pick an era and answer questions.'], ic: 'trivia', best: gameStars(['t_all'].concat(D.ERAS.map(function (e) { return 't_' + e.id; }))) }
    ];
    var icons = {
      order: '<path d="M6 6h12M6 12h12M6 18h12M3 5l2 1-2 1zM3 17l2 1-2 1z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
      same: '<circle cx="8" cy="9" r="3.4" fill="currentColor"/><circle cx="16" cy="9" r="3.4" fill="currentColor" opacity=".6"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M10 20c0-4 3-6 6-6s6 2 6 6" stroke="currentColor" stroke-width="2" fill="none"/>',
      ba: '<path d="M3 12h18M7 7l-4 5 4 5M17 7l4 5-4 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
      trivia: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 6v6l4 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>'
    };
    var h = top(null, bi('Juegos', 'Games'), bi('Practica quién fue antes y quién después.', 'Practice what came first and what came after.')) + '<div class="ln-cards">' +
      list.map(function (g) {
        return '<button type="button" class="ln-gcard" data-go="' + g.id + '"><svg viewBox="0 0 24 24" class="ln-gic" aria-hidden="true">' + icons[g.ic] + '</svg><span class="ln-gbody"><b class="ln-gt">' + bi(g.es, g.en) + '</b><span class="ln-gd">' + pair(g.d) + '</span></span>' +
          '<span class="ln-gstat">' + g.best + ' ★</span></button>';
      }).join('') + '</div>';
    render('games', h);
  }

  // A small card showing one event's picture and title (for games).
  function evCard(ev, o) {
    o = o || {};
    return '<span class="ln-gc-art">' + art(ev) + '</span><span class="ln-gc-t">' + esc(one(ev.t)) + '</span>' + (o.date ? '<span class="ln-gc-d">' + esc(dateOf(ev)) + '</span>' : '');
  }

  function roundResult(stars, right, total, key, again, newStar) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<span class="ln-star' + (i < stars ? ' on' : '') + '">★</span>';
    return '<div class="ln-result" id="ln-result"><div class="ln-rstars" aria-label="' + stars + ' / 3">' + s + '</div>' +
      '<h2 class="ln-h2">' + bi(stars >= 3 ? '¡Excelente!' : stars >= 2 ? '¡Muy bien!' : '¡Sigue practicando!', stars >= 3 ? 'Excellent!' : stars >= 2 ? 'Very good!' : 'Keep practising!') + '</h2>' +
      '<p class="ln-big">' + right + ' / ' + total + '</p>' + (newStar ? '<p class="ln-star-note">⭐ ' + bi('¡Ganaste una estrella!', 'You earned a star!') + '</p>' : '') +
      '<div class="ln-actions"><button type="button" class="ln-btn ln-btn-big" data-go="' + again + '">' + bi('Otra ronda', 'Another round') + '</button><button type="button" class="ln-btn ln-btn-ghost" data-go="games">' + bi('Juegos', 'Games') + '</button></div></div>';
  }

  // ---------------------------------------------------------------
  // Game 1: put in order
  // ---------------------------------------------------------------
  var OR = null;
  function viewOrder() {
    var rand = nextRand();
    OR = { rand: rand, i: 0, total: 5, right: 0, n: E.ORDER_N[E.TIERS.indexOf(tier)] };
    nextOrder();
  }
  function nextOrder() {
    var p = E.genOrder(OR.rand, tier);
    OR.p = p; OR.tries = 0; OR.done = false;
    var rows = p.shown.map(function (id) { return orderRow(D.BY_ID[id]); }).join('');
    var h = top('games', bi('Ponlos en orden', 'Put them in order'), bi('Arrastra (o usa las flechas): arriba lo más antiguo, abajo lo más nuevo.', 'Drag (or use the arrows): oldest at the top, newest at the bottom.')) +
      '<div class="ln-prog">' + (OR.i + 1) + ' / ' + OR.total + '</div>' +
      '<div class="ln-order-wrap"><span class="ln-order-end">' + bi('Más antiguo', 'Oldest') + '</span><ol class="ln-order" id="ln-order">' + rows + '</ol><span class="ln-order-end">' + bi('Más nuevo', 'Newest') + '</span></div>' +
      '<div class="ln-flash" id="ln-flash" aria-live="polite"></div>' +
      '<div class="ln-actions"><button type="button" class="ln-btn ln-btn-big" id="ln-check">' + bi('Revisar', 'Check') + '</button></div><div id="ln-after"></div>';
    render('order', h, function (r) { wireOrder(r); });
  }
  function orderRow(ev) {
    return '<li class="ln-orow" data-id="' + ev.id + '"><span class="ln-drag" role="img" aria-label="' + esc(tx('Arrastrar', 'Drag')) + '"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></span>' +
      '<span class="ln-orow-body">' + evCard(ev) + '</span><span class="ln-orow-date"></span>' +
      '<span class="ln-arrows"><button type="button" class="ln-arrow" data-dir="-1" aria-label="' + esc(tx('Subir', 'Move up')) + '">▲</button><button type="button" class="ln-arrow" data-dir="1" aria-label="' + esc(tx('Bajar', 'Move down')) + '">▼</button></span></li>';
  }
  function orderIds() { return $all('#ln-order .ln-orow').map(function (li) { return li.getAttribute('data-id'); }); }
  function wireOrder(r) {
    var list = $('#ln-order', r);
    $all('.ln-arrow', list).forEach(function (b) {
      b.addEventListener('click', function () {
        if (OR.done) return;
        var li = b.closest('.ln-orow'), dir = Number(b.getAttribute('data-dir')), sib = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
        if (!sib) return;
        _sound('click');
        if (dir < 0) list.insertBefore(li, sib); else list.insertBefore(sib, li);
        $all('.ln-orow', list).forEach(function (x) { x.classList.remove('bad', 'good'); });
        b.focus();
      });
    });
    $all('.ln-drag', list).forEach(function (hd) {
      hd.addEventListener('pointerdown', function (e) {
        if (OR.done) return;
        e.preventDefault();
        var li = hd.closest('.ln-orow'), id = e.pointerId;
        li.classList.add('lift');
        function mv(ev) {
          if (ev.pointerId !== id) return;
          var rows = $all('.ln-orow', list).filter(function (x) { return x !== li; }), y = ev.clientY, placed = false;
          for (var i = 0; i < rows.length; i++) {
            var rc = rows[i].getBoundingClientRect();
            if (y < rc.top + rc.height / 2) { if (li.nextElementSibling !== rows[i]) list.insertBefore(li, rows[i]); placed = true; break; }
          }
          if (!placed && list.lastElementChild !== li) list.appendChild(li);
        }
        function up(ev) {
          if (ev.pointerId !== id) return;
          li.classList.remove('lift');
          window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
          $all('.ln-orow', list).forEach(function (x) { x.classList.remove('bad', 'good'); });
        }
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      });
    });
    $('#ln-check', r).addEventListener('click', checkOrder);
  }
  function checkOrder() {
    if (OR.done) return;
    var ids = orderIds(), ans = OR.p.answer, ok = ids.every(function (id, i) { return id === ans[i]; }), list = $('#ln-order');
    OR.tries++;
    var flash = $('#ln-flash');
    if (ok) {
      _sound('correct'); OR.done = true;
      if (OR.tries === 1) OR.right++;
      showOrderDates(list, ids, true);
      flash.textContent = tx('¡Correcto!', 'Correct!'); flash.className = 'ln-flash show good';
      finishOrder(OR.tries === 1);
    } else if (OR.tries >= 2) {
      _sound('wrong'); OR.done = true;
      var li = {}; $all('.ln-orow', list).forEach(function (x) { li[x.getAttribute('data-id')] = x; });
      ans.forEach(function (id) { list.appendChild(li[id]); });
      showOrderDates(list, ans, false);
      flash.textContent = tx('Este es el orden correcto.', 'This is the right order.'); flash.className = 'ln-flash show';
      var A0 = D.BY_ID[ans[0]], B0 = D.BY_ID[ans[1]];
      reviewAdd(tx('¿Qué pasó primero: ', 'Which came first: ') + one(A0.t) + tx(' o ', ' or ') + one(B0.t) + '?', one(A0.t), [one(A0.t), one(B0.t)]);
      finishOrder(false);
    } else {
      _sound('wrong');
      $all('.ln-orow', list).forEach(function (x, i) { x.classList.toggle('bad', x.getAttribute('data-id') !== ans[i]); x.classList.toggle('good', x.getAttribute('data-id') === ans[i]); });
      flash.textContent = tx('Casi. Las que se ven en rojo no van ahí. Prueba otra vez.', 'Almost. The red ones do not go there. Try again.'); flash.className = 'ln-flash show';
    }
  }
  function showOrderDates(list, ids, good) {
    $all('.ln-orow', list).forEach(function (x, i) {
      var ev = D.BY_ID[x.getAttribute('data-id')];
      x.classList.remove('bad'); x.classList.add('good', 'revealed');
      $('.ln-orow-date', x).textContent = tier === 'beginner' ? tx('hace ' + E.fmtNum(E.agoYears(ev, now()), isEs()) + ' años', E.fmtNum(E.agoYears(ev, now()), false) + ' years ago') : dateOf(ev);
      $all('.ln-arrow', x).forEach(function (b) { b.disabled = true; });
    });
  }
  function finishOrder(first) {
    var after = $('#ln-after'), chk = $('#ln-check');
    if (chk) chk.style.display = 'none';
    OR.i++;
    if (OR.i < OR.total) {
      after.innerHTML = '<div class="ln-actions"><button type="button" class="ln-btn ln-btn-big" id="ln-next">' + bi('Siguiente', 'Next') + '</button></div>';
      $('#ln-next').addEventListener('click', function () { _sound('click'); nextOrder(); });
    } else {
      var stars = E.starsFor(OR.right, OR.total), ns = addBest('order' + OR.n, stars);
      after.innerHTML = roundResult(stars, OR.right, OR.total, 'order' + OR.n, 'order', ns);
      $all('[data-go]', after).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); go(b.getAttribute('data-go')); }); });
      try { $('#ln-result').scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
  }

  // ---------------------------------------------------------------
  // Game 2: who lived at the same time?
  // ---------------------------------------------------------------
  var SM = null;
  function viewSame() {
    SM = { rand: nextRand(), i: 0, total: 5, right: 0 };
    nextSame();
  }
  function nextSame() {
    var q = E.genSame(SM.rand, tier);
    SM.q = q; SM.locked = false;
    var A0 = D.BY_ID[q.a], during = q.kind === 'during', small = tier === 'beginner';
    var prompt = during
      ? bi('¿Qué pasó mientras vivía ' + one(A0.t) + '?', 'What happened while ' + one(A0.t) + ' was alive?')
      : bi('¿Quién vivió en la misma época que ' + one(A0.t) + '?', 'Who lived at the same time as ' + one(A0.t) + '?');
    var h = top('games', bi('¿Quién vivió en la misma época?', 'Who lived at the same time?')) + '<div class="ln-prog">' + (SM.i + 1) + ' / ' + SM.total + '</div>' +
      '<div class="ln-qwrap"><div class="ln-q-art">' + art(A0) + '</div>' +
      (small ? '' : '<p class="ln-q-life">' + esc(tx('Vivió: ', 'Lived: ') + dateOf(A0)) + '</p>') +
      '<p class="ln-q">' + prompt + '</p></div>' +
      '<div class="ln-opts ln-opts-cards" id="ln-opts">' + q.options.map(function (id) {
        return '<button type="button" class="ln-opt ln-opt-card" data-id="' + id + '">' + evCard(D.BY_ID[id]) + '</button>';
      }).join('') + '</div><div id="ln-after"></div>';
    render('same', h, function (r) {
      $all('.ln-opt', r).forEach(function (b) { b.addEventListener('click', function () { answerSame(b); }); });
    });
  }
  function answerSame(b) {
    if (SM.locked) return;
    SM.locked = true;
    var q = SM.q, id = b.getAttribute('data-id'), ok = id === q.answer, A0 = D.BY_ID[q.a];
    $all('.ln-opt').forEach(function (x) {
      var ev = D.BY_ID[x.getAttribute('data-id')];
      x.classList.add(x.getAttribute('data-id') === q.answer ? 'right' : (x === b ? 'wrong' : 'dim'));
      x.disabled = true;
      if (tier !== 'beginner') x.insertAdjacentHTML('beforeend', '<span class="ln-gc-d">' + esc(dateOf(ev)) + '</span>');
    });
    _sound(ok ? 'correct' : 'wrong');
    var prompt = q.kind === 'during' ? tx('¿Qué pasó mientras vivía ', 'What happened while ') + one(A0.t) + tx('?', ' was alive?') : tx('¿Quién vivió en la misma época que ', 'Who lived at the same time as ') + one(A0.t) + '?';
    var right = D.BY_ID[q.answer];
    if (ok) { SM.right++; reviewHit(prompt, one(right.t)); }
    else reviewAdd(prompt, one(right.t), q.options.map(function (o) { return one(D.BY_ID[o].t); }));
    var fb = ok ? bi('¡Correcto!', 'Correct!') : bi('Era ' + one(right.t) + '.', 'It was ' + one(right.t) + '.');
    SM.i++;
    var more = SM.i < SM.total;
    $('#ln-after').innerHTML = '<div class="ln-fb ' + (ok ? 'ok' : 'no') + '" aria-live="polite"><b>' + fb + '</b>' + (tier === 'beginner' ? '' : '<p>' + esc(dateOf(A0)) + ' · ' + esc(dateOf(right)) + '</p>') + '</div>' +
      '<div class="ln-actions"><button type="button" class="ln-btn ln-btn-big" id="ln-next">' + bi(more ? 'Siguiente' : 'Ver resultado', more ? 'Next' : 'See result') + '</button></div>';
    $('#ln-next').addEventListener('click', function () {
      _sound('click');
      if (more) nextSame(); else endRound('same', SM.right, SM.total, 'same');
    });
    try { $('#ln-after').scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }
  function endRound(key, right, total, again) {
    var stars = E.starsFor(right, total), ns = addBest(key, stars);
    render('result', top('games', bi('Resultado', 'Result')) + roundResult(stars, right, total, key, again, ns));
    $all('#ln-result [data-go]').forEach(function (b) { b.addEventListener('click', function () { _sound('click'); go(b.getAttribute('data-go')); }); });
  }

  // ---------------------------------------------------------------
  // Game 3: before or after?
  // ---------------------------------------------------------------
  var BA = null;
  function viewBA() { BA = { rand: nextRand(), i: 0, total: 6, right: 0 }; nextBA(); }
  function nextBA() {
    var q = E.genBA(BA.rand, tier);
    BA.q = q; BA.locked = false;
    var a = D.BY_ID[q.a], b = D.BY_ID[q.b];
    var h = top('games', bi('¿Antes o después?', 'Before or after?')) + '<div class="ln-prog">' + (BA.i + 1) + ' / ' + BA.total + '</div>' +
      '<div class="ln-ba"><div class="ln-ba-card ln-ba-a"><span class="ln-ba-k">' + bi('Mira', 'Look at') + '</span>' + '<span class="ln-gc-art">' + art(a) + '</span><span class="ln-gc-t">' + esc(one(a.t)) + '</span>' + (tier === 'beginner' ? '' : '<span class="ln-gc-d">' + esc(dateOf(a)) + '</span>') + '</div>' +
      '<div class="ln-ba-card ln-ba-b"><span class="ln-ba-k">' + bi('Esto', 'This one') + '</span>' + '<span class="ln-gc-art">' + art(b) + '</span><span class="ln-gc-t">' + esc(one(b.t)) + '</span></div></div>' +
      '<p class="ln-q">' + bi('¿«' + one(b.t) + '» pasó antes o después de «' + one(a.t) + '»?', 'Did “' + one(b.t) + '” happen before or after “' + one(a.t) + '”?') + '</p>' +
      '<div class="ln-opts ln-opts-2" id="ln-opts"><button type="button" class="ln-opt ln-opt-big" data-v="before">← ' + bi('Antes', 'Before') + '</button><button type="button" class="ln-opt ln-opt-big" data-v="after">' + bi('Después', 'After') + ' →</button></div><div id="ln-after"></div>';
    render('ba', h, function (r) { $all('.ln-opt', r).forEach(function (bt) { bt.addEventListener('click', function () { answerBA(bt); }); }); });
  }
  function answerBA(bt) {
    if (BA.locked) return;
    BA.locked = true;
    var q = BA.q, ok = bt.getAttribute('data-v') === q.answer, a = D.BY_ID[q.a], b = D.BY_ID[q.b];
    $all('.ln-opt').forEach(function (x) { x.classList.add(x.getAttribute('data-v') === q.answer ? 'right' : (x === bt ? 'wrong' : 'dim')); x.disabled = true; });
    _sound(ok ? 'correct' : 'wrong');
    var first = q.answer === 'before' ? b : a, second = q.answer === 'before' ? a : b;
    var prompt = tx('¿Qué pasó primero: ', 'Which came first: ') + one(a.t) + tx(' o ', ' or ') + one(b.t) + '?';
    if (ok) { BA.right++; reviewHit(prompt, one(first.t)); } else reviewAdd(prompt, one(first.t), [one(a.t), one(b.t)]);
    BA.i++;
    var more = BA.i < BA.total;
    $('#ln-after').innerHTML = '<div class="ln-fb ' + (ok ? 'ok' : 'no') + '" aria-live="polite"><b>' + (ok ? bi('¡Correcto!', 'Correct!') : bi('Casi.', 'Not quite.')) + '</b><p>' +
      esc(one(first.t) + (tier === 'beginner' ? '' : ' (' + dateOf(first) + ')') + tx(' fue antes que ', ' came before ') + one(second.t) + (tier === 'beginner' ? '' : ' (' + dateOf(second) + ')') + '.') + '</p></div>' +
      '<div class="ln-actions"><button type="button" class="ln-btn ln-btn-big" id="ln-next">' + bi(more ? 'Siguiente' : 'Ver resultado', more ? 'Next' : 'See result') + '</button></div>';
    $('#ln-next').addEventListener('click', function () { _sound('click'); if (more) nextBA(); else endRound('ba', BA.right, BA.total, 'ba'); });
    try { $('#ln-after').scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }

  // ---------------------------------------------------------------
  // Game 4: time-travel trivia
  // ---------------------------------------------------------------
  function viewTriviaPick() {
    var dests = [{ id: 'all', es: 'Cualquier época', en: 'Any era', art: 'globe' }].concat(D.ERAS.map(function (e) { return { id: e.id, es: e.es, en: e.en, art: e.art }; }));
    var h = top('games', bi('Viaje en el tiempo', 'Time-travel trivia'), bi('¿A qué época viajamos?', 'Which era shall we travel to?')) + '<div class="ln-dests">' +
      dests.map(function (d) {
        return '<button type="button" class="ln-dest" data-go="trivia-go" data-arg="' + d.id + '"><span class="ln-dest-art">' + A.scene(d.art, d.id, d.es) + '</span><span class="ln-dest-t">' + bi(d.es, d.en) + '</span><span class="ln-gstat">' + (data.g['t_' + d.id] | 0) + ' ★</span></button>';
      }).join('') + '</div>';
    render('trivia', h);
  }
  var TV = null;
  function viewTrivia(era) {
    var rand = nextRand();
    TV = { era: era || 'all', qs: E.genTrivia(rand, tier, era || 'all', 6, now()), i: 0, right: 0 };
    nextTrivia();
  }
  function qText(q) {
    var ev = D.BY_ID[q.ev], es = isEs();
    switch (q.kind) {
      case 'year': return tx('¿En qué año ocurrió: ' + ev.t[0] + '?', 'In which year did this happen: ' + ev.t[1] + '?');
      case 'what': return tx('¿Qué pasó en ' + E.dateText(ev, true) + '?', 'What happened in ' + E.dateText(ev, false) + '?');
      case 'why': return tx('¿De qué evento se dice: «' + ev.w[0] + '»?', 'Which event is this about: “' + ev.w[1] + '”?');
      case 'last3': return tx('¿Cuál pasó más tarde?', 'Which happened last?');
      default: return tx('¿Cuál pasó primero?', 'Which happened first?');
    }
  }
  function qHtml(q) {
    var ev = D.BY_ID[q.ev];
    switch (q.kind) {
      case 'year': return bi('¿En qué año ocurrió: ' + ev.t[0] + '?', 'In which year did this happen: ' + ev.t[1] + '?');
      case 'what': return bi('¿Qué pasó en ' + E.dateText(ev, true) + '?', 'What happened in ' + E.dateText(ev, false) + '?');
      case 'why': return bi('¿De qué evento se dice: «' + ev.w[0] + '»?', 'Which event is this about: “' + ev.w[1] + '”?');
      case 'last3': return bi('¿Cuál pasó más tarde?', 'Which happened last?');
      default: return bi('¿Cuál pasó primero?', 'Which happened first?');
    }
  }
  function nextTrivia() {
    var q = TV.qs[TV.i];
    if (!q) { endRound('t_' + TV.era, TV.right, TV.qs.length || 1, 'trivia'); return; }
    TV.locked = false;
    var ev = D.BY_ID[q.ev], withArt = q.kind === 'year', cardOpts = q.kind === 'first2' || q.kind === 'first3' || q.kind === 'last3';
    var h = top('trivia', bi('Viaje en el tiempo', 'Time-travel trivia')) + '<div class="ln-prog">' + (TV.i + 1) + ' / ' + TV.qs.length + '</div>' +
      '<div class="ln-qwrap">' + (withArt ? '<div class="ln-q-art">' + art(ev) + '</div>' : '') + '<p class="ln-q">' + qHtml(q) + '</p></div>' +
      '<div class="ln-opts' + (cardOpts ? ' ln-opts-cards' : '') + '" id="ln-opts">' + q.choices.map(function (c, i) {
        if (cardOpts) return '<button type="button" class="ln-opt ln-opt-card" data-i="' + i + '">' + evCard(D.BY_ID[c.id]) + '</button>';
        return '<button type="button" class="ln-opt" data-i="' + i + '">' + esc(isEs() ? c.es : c.en) + (lang() === 'both' ? '<span class="ln-sub">' + esc(c.en) + '</span>' : '') + '</button>';
      }).join('') + '</div><div id="ln-after"></div>';
    render('trivia-go', h, function (r) { $all('.ln-opt', r).forEach(function (b) { b.addEventListener('click', function () { answerTrivia(b); }); }); });
  }
  function answerTrivia(b) {
    if (TV.locked) return;
    TV.locked = true;
    var q = TV.qs[TV.i], i = Number(b.getAttribute('data-i')), ok = i === q.answer, ev = D.BY_ID[q.ev];
    $all('.ln-opt').forEach(function (x) { var k = Number(x.getAttribute('data-i')); x.classList.add(k === q.answer ? 'right' : (x === b ? 'wrong' : 'dim')); x.disabled = true; });
    _sound(ok ? 'correct' : 'wrong');
    var txt = function (c) { return isEs() ? c.es : c.en; }, plainChoices = q.choices.map(txt), answer = txt(q.choices[q.answer]);
    var prompt = qText(q);
    if (prompt.length > 230) prompt = prompt.slice(0, 227) + '…';
    if (ok) { TV.right++; reviewHit(prompt, answer); } else reviewAdd(prompt, answer, plainChoices);
    TV.i++;
    var more = TV.i < TV.qs.length;
    var detail = '<div class="ln-fb-ev"><span class="ln-fb-art">' + art(ev) + '</span><span><b>' + esc(one(ev.t)) + '</b> · ' + esc(dateOf(ev)) + '<br>' + esc(one(ev.d)) + '</span></div>';
    $('#ln-after').innerHTML = '<div class="ln-fb ' + (ok ? 'ok' : 'no') + '" aria-live="polite"><b>' + (ok ? bi('¡Correcto!', 'Correct!') : bi('Casi. Era: ' + answer, 'Not quite. It was: ' + answer)) + '</b>' + (tier === 'beginner' ? '' : detail) + '</div>' +
      '<div class="ln-actions"><button type="button" class="ln-btn ln-btn-big" id="ln-next">' + bi(more ? 'Siguiente' : 'Ver resultado', more ? 'Next' : 'See result') + '</button>' +
      '<button type="button" class="ln-btn ln-btn-ghost" data-open="' + ev.id + '">' + bi('Ver el evento', 'See the event') + '</button></div>';
    $('#ln-next').addEventListener('click', function () { _sound('click'); nextTrivia(); });
    $('#ln-after [data-open]').addEventListener('click', function (e) { _sound('click'); openCard(ev.id, e.currentTarget); });
    try { $('#ln-after').scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function init() {
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    age = user && user.age ? Number(user.age) : 0;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age || undefined) : 'intermediate';
    data = _load();
    try {
      if (typeof ZsSpeak !== 'undefined' && ZsSpeak.watch) ZsSpeak.watch({ prompt: '.ln-q', group: '.ln-opts', choice: '.ln-opt', lang: speakLang() });
    } catch (e) {}
    var q = ''; try { q = new URLSearchParams(location.search).get('tab') || ''; } catch (e) {}
    if (q === 'games') viewGames(); else if (q === 'eras' || (tier === 'beginner' && q !== 'line')) viewEras(); else viewTimeline();
  }

  function currentState() {
    return {
      view: current.view, tier: tier, card: current.card || null,
      tl: TL ? { cx: TL.cx, ppy: TL.ppy, W: TL.W, minPpy: TL.minPpy, maxPpy: TL.maxPpy, visible: TL.evs.filter(function (e) { return TL.mk[e.id].style.display !== 'none'; }).map(function (e) { return e.id; }) } : null,
      order: OR && OR.p ? { shown: OR.p.shown, answer: OR.p.answer, i: OR.i } : null,
      same: SM && SM.q ? SM.q : null,
      ba: BA && BA.q ? BA.q : null,
      trivia: TV && TV.qs[TV.i] ? { kind: TV.qs[TV.i].kind, answer: TV.qs[TV.i].answer, i: TV.i, n: TV.qs.length } : null,
      data: data
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { go: go, state: currentState, open: openCard, show: showOnTimeline, zoomBy: zoomBy };
})();
