/* ================================================================
   ¿QUÉ HORA ES? — learn to tell time by moving a real-looking clock.

   Modes: Explore (free play), Set the Clock, Read the Clock, Match,
   My Day (a family day with a live sky), How Long? (elapsed time),
   Calendar (days, months, Chile's seasons, month grid) and Time
   Puzzles (a.m./p.m., Chile vs Spain).

   Every round is scored 0–3 stars per level. Bilingual EN / ES with
   a persisted language toggle and read-aloud (ZsTTS) in that language.

   Storage: one blob per kid at getUserAppKey('zs_clock_'):
     { lang, helper, digital,
       levels: { '<mode>-<level>': { stars, best, of, plays, last } },
       rounds }
   Requires: auth.js, sounds.js, activity-log.js, tts.js (optional),
             que-hora-es-data.js, que-hora-es-art.js
   ================================================================ */

var QueHoraEs = (function() {
  'use strict';

  var D = QheData, A = QheArt;
  var PREFIX = 'zs_clock_';
  var APP_NAME = '¿Qué Hora Es?';

  // ---- storage -----------------------------------------------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _load() {
    var k = _key();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; }
  }
  function _save() {
    var k = _key();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) { return; }
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }

  var data = {};
  var user = null, age = 7, tier = 'intermediate';
  var lang = 'en';

  // ---- small helpers -------------------------------------------------
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''); }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rand(a.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function tx(o) { return o ? (o[lang] != null ? o[lang] : o.en) : ''; }
  function txOther(o) { return o ? (lang === 'es' ? o.en : o.es) : ''; }
  function bi(en, es) { return { en: en, es: es }; }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function tierIdx(t) { return Math.max(0, D.TIER_ORDER.indexOf(t)); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + D.pad(d.getMonth() + 1) + '-' + D.pad(d.getDate());
  }
  function starsFor(score, total) {
    var r = total ? score / total : 0;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0;
  }
  function levelStars(key) { var l = (data.levels || {})[key]; return l ? (l.stars || 0) : 0; }
  function totalStars() {
    var n = 0, L = data.levels || {};
    for (var k in L) n += Math.min(3, (L[k] && L[k].stars) || 0);
    return n;
  }
  function starRow(n, of) {
    var s = '';
    for (var i = 0; i < (of || 3); i++) s += '<span class="qhe-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="qhe-stars" aria-label="' + n + ' of ' + (of || 3) + ' stars">' + s + '</span>';
  }

  // ---- speech ---------------------------------------------------------
  function ttsOn() { return typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled; }
  function say(text) {
    if (!ttsOn() || !text) return;
    ZsTTS.speak(String(text).replace(/—/g, ','), { lang: lang === 'es' ? 'es-CL' : 'en-US' });
  }
  function hush() { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); }

  // A soft gear "tick" while hands are dragged.
  var _actx = null, _lastTick = 0;
  function tick() {
    var now = performance.now();
    if (now - _lastTick < 45) return;
    _lastTick = now;
    try {
      if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
      if (_actx.state === 'suspended') _actx.resume();
      var len = Math.floor(_actx.sampleRate * 0.012);
      var buf = _actx.createBuffer(1, len, _actx.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
      var src = _actx.createBufferSource(); src.buffer = buf;
      var f = _actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 2;
      var g = _actx.createGain(); g.gain.value = 0.18;
      src.connect(f); f.connect(g); g.connect(_actx.destination);
      src.start();
    } catch (e) {}
  }

  // ---- view lifecycle -------------------------------------------------
  var view = { clocks: [], timers: [], ro: null, keyHandler: null, onLang: null };
  function later(fn, ms) { var t = setTimeout(fn, ms); view.timers.push(t); return t; }
  function teardown() {
    hush();
    view.clocks.forEach(function(c) { c.destroy(); });
    view.timers.forEach(function(t) { clearTimeout(t); clearInterval(t); });
    if (view.ro) view.ro.disconnect();
    if (view.keyHandler) document.removeEventListener('keydown', view.keyHandler);
    view = { clocks: [], timers: [], ro: null, keyHandler: null, onLang: null };
  }
  function root() { return document.getElementById('qhe-wrap'); }
  function $(sel) { return root().querySelector(sel); }

  function toolbar() {
    return '<div class="qhe-tools" role="group" aria-label="Settings">' +
      '<div class="qhe-lang" role="group" aria-label="Language · Idioma">' +
        '<button type="button" data-act="lang" data-v="en" class="' + (lang === 'en' ? 'on' : '') + '" aria-pressed="' + (lang === 'en') + '">EN</button>' +
        '<button type="button" data-act="lang" data-v="es" class="' + (lang === 'es' ? 'on' : '') + '" aria-pressed="' + (lang === 'es') + '">ES</button>' +
      '</div>' +
      '<button type="button" class="qhe-chip' + (data.helper ? ' on' : '') + '" data-act="helper" aria-pressed="' + !!data.helper + '">🎨 ' + (lang === 'es' ? 'Ayuda' : 'Helper') + '</button>' +
      '<button type="button" class="qhe-chip' + (data.digital ? ' on' : '') + '" data-act="digital" aria-pressed="' + !!data.digital + '">🔢 ' + (lang === 'es' ? 'Digital' : 'Digital') + '</button>' +
    '</div>';
  }
  function refreshToolbar() {
    var t = $('.qhe-tools');
    if (t) t.outerHTML = toolbar();
  }

  function setLang(v) {
    if (v !== 'en' && v !== 'es') return;
    lang = v; data.lang = v; _save();
    hush();
    view.clocks.forEach(function(c) { c.setOptions({ lang: lang }); });
    refreshToolbar();
    if (view.onLang) view.onLang();
  }
  function toggleHelper() {
    data.helper = !data.helper; _save();
    view.clocks.forEach(function(c) { c.setOptions({ helper: !!data.helper }); });
    refreshToolbar();
    if (view.onHelper) view.onHelper();
  }
  function toggleDigital() {
    data.digital = !data.digital; _save();
    var f = $('.qhe-flipwrap');
    if (f) f.classList.toggle('hide', !data.digital);
    refreshToolbar();
    if (view.onDigital) view.onDigital();
  }

  // Fit the clock to the space available.
  function clockSizeFor(el, maxS) {
    var w = el ? el.clientWidth : 320;
    var vh = window.innerHeight || 800;
    var wide = window.innerWidth >= 860;
    var byH = wide ? vh - 250 : vh * 0.40;
    return Math.max(180, Math.floor(Math.min(w - 8, byH, maxS || 440)));
  }
  function watchSize(el, clock, maxS) {
    if (typeof ResizeObserver === 'undefined') return;
    view.ro = new ResizeObserver(function() { clock.resize(clockSizeFor(el, maxS)); });
    view.ro.observe(el);
  }

  // ---- digital helpers -------------------------------------------
  function flipShow(flip, t, fmt, animate) {
    if (!flip) return;
    if (t == null) { flip.set('--:--', '', animate); return; }
    if (fmt === '24') flip.set(D.digital24(t), '', animate);
    else if (fmt === '12p') flip.set(D.digital12(t), D.ampm(t), animate);
    else flip.set(D.digital12(t), '', animate);
  }
  function words(t) { return bi(D.sentenceEn(t), D.sentenceEs(t)); }
  function phrase(t) { return bi(D.cap(D.phraseEn(t)), D.cap(D.phraseEs(t))); }

  // =====================================================================
  // HOME
  // =====================================================================
  var BADGES = [
    { id: 'oclock',  icon: '🕐', en: "O'clock Pro",          es: 'Experto en punto',     test: function() { return best3(['set-oclock', 'read-oclock', 'match-oclock']); } },
    { id: 'half',    icon: '🕧', en: 'Half-Past Pro',        es: 'Experto en y media',   test: function() { return best3(['set-half', 'read-half', 'match-half']); } },
    { id: 'quarter', icon: '🕒', en: 'Quarter Master',       es: 'Maestro del cuarto',   test: function() { return best3(['set-quarter', 'read-quarter', 'match-quarter']); } },
    { id: 'five',    icon: '🖐️', en: 'Five-Minute Counter',  es: 'Contador de cinco',    test: function() { return best3(['set-five', 'read-five', 'match-five']); } },
    { id: 'minute',  icon: '⏱️', en: 'Minute Reader',        es: 'Lector de minutos',    test: function() { return best3(['set-minute', 'read-minute', 'match-minute']); } },
    { id: 'h24',     icon: '🚆', en: '24-Hour Navigator',    es: 'Navegante de 24 horas', test: function() { return best3(['set-h24', 'read-h24']); } },
    { id: 'day',     icon: '🌅', en: 'Day Planner',          es: 'Planificador del día', test: function() { return best3(['day-day1', 'day-day2', 'day-day3']); } },
    { id: 'elapsed', icon: '⏳', en: 'Time Keeper',          es: 'Guardián del tiempo',  test: function() { return best3(['howlong-hl1', 'howlong-hl2', 'howlong-hl3', 'howlong-hl4']); } },
    { id: 'cal',     icon: '📅', en: 'Calendar Keeper',      es: 'Guardián del calendario', test: function() { return best3(['calendar-cal1', 'calendar-cal2', 'calendar-cal3']); } },
    { id: 'world',   icon: '🌍', en: 'World Clock',          es: 'Reloj del mundo',      test: function() { return best3(['puzzles-ampm', 'puzzles-zones']); } }
  ];
  function best3(keys) { for (var i = 0; i < keys.length; i++) if (levelStars(keys[i]) >= 3) return true; return false; }

  function modeStars(m) {
    var n = 0;
    m.levels.forEach(function(l) { n += levelStars(m.id + '-' + l); });
    return n;
  }

  function home() {
    teardown();
    var name = user ? esc(user.name) : '';
    var cards = '<button type="button" class="qhe-mode qhe-mode-explore" data-act="explore">' +
        '<span class="qhe-mode-icon" aria-hidden="true">🖐️</span>' +
        '<span class="qhe-mode-name">' + (lang === 'es' ? 'Explora' : 'Explore') + ' <small>· ' + (lang === 'es' ? 'Explore' : 'Explora') + '</small></span>' +
        '<span class="qhe-mode-desc">' + (lang === 'es' ? 'Mueve las manecillas libremente.' : 'Move the hands freely and hear the time.') + '</span>' +
      '</button>';
    D.MODES.forEach(function(m) {
      var got = modeStars(m), max = m.levels.length * 3;
      cards += '<button type="button" class="qhe-mode qhe-mode-' + m.id + '" data-act="mode" data-v="' + m.id + '">' +
        '<span class="qhe-mode-icon" aria-hidden="true">' + m.icon + '</span>' +
        (m.age ? '<span class="qhe-mode-age">' + (lang === 'es' ? 'Edad ' : 'Ages ') + m.age + '</span>' : '') +
        '<span class="qhe-mode-name">' + (lang === 'es' ? m.es : m.en) + ' <small>· ' + (lang === 'es' ? m.en : m.es) + '</small></span>' +
        '<span class="qhe-mode-desc">' + tx(m.desc) + '</span>' +
        '<span class="qhe-mode-stars">★ ' + got + ' / ' + max + '</span>' +
      '</button>';
    });
    var badges = BADGES.map(function(b) {
      var on = b.test();
      return '<span class="qhe-badge' + (on ? ' on' : '') + '" title="' + esc(tx(b)) + '">' +
        '<span class="qhe-badge-medal" aria-hidden="true">' + b.icon + '</span>' +
        '<span class="qhe-badge-name">' + tx(b) + '</span></span>';
    }).join('');

    root().innerHTML =
      '<div class="qhe-home">' +
        '<div class="qhe-hero">' +
          '<div class="qhe-hero-clock"><canvas id="qhe-hero-canvas"></canvas></div>' +
          '<div class="qhe-hero-text">' +
            '<h1>¿Qué Hora Es?</h1>' +
            '<p class="qhe-sub">' + (lang === 'es' ? 'Aprende a leer la hora · What time is it?' : 'What time is it? · Learn to tell time') + '</p>' +
            '<div class="qhe-flipwrap' + (data.digital ? '' : ' hide') + '" id="qhe-hero-flip"></div>' +
            '<p class="qhe-now" id="qhe-hero-words"></p>' +
            '<button type="button" class="qhe-say-btn" data-act="sayNow" aria-label="Read the time aloud">🔊 ' + (lang === 'es' ? 'Dime la hora' : 'Say the time') + '</button>' +
          '</div>' +
        '</div>' +
        toolbar() +
        '<div class="qhe-totals">' + (name ? name + ' · ' : '') + '★ ' + totalStars() + '</div>' +
        '<div class="qhe-modes">' + cards + '</div>' +
        '<h2 class="qhe-h2">' + (lang === 'es' ? 'Insignias' : 'Badges') + '</h2>' +
        '<div class="qhe-badges">' + badges + '</div>' +
      '</div>';

    var cv = document.getElementById('qhe-hero-canvas');
    var wrap = cv.parentNode;
    var size = Math.max(200, Math.min(wrap.clientWidth || 260, window.innerWidth >= 860 ? 340 : 270));
    var clock = A.createClock(cv, { size: size, live: true, helper: !!data.helper, lang: lang, label: 'Clock showing the time now' });
    view.clocks.push(clock);
    var flip = A.createFlip(document.getElementById('qhe-hero-flip'));
    function upd(animate) {
      var d = new Date(), t = d.getHours() * 60 + d.getMinutes();
      flipShow(flip, t, '12p', animate);
      var w = document.getElementById('qhe-hero-words');
      if (w) w.innerHTML = '<b>' + esc(tx(words(t))) + '</b><span>' + esc(txOther(words(t))) + '</span>';
    }
    upd(false);
    view.timers.push(setInterval(function() { upd(true); }, 2000));
    view.onLang = home;
    view.onHelper = null;
  }

  // =====================================================================
  // LEVEL PICKER
  // =====================================================================
  function recommended(m) {
    var ti = tierIdx(tier), best = null;
    for (var i = 0; i < m.levels.length; i++) {
      var info = D.levelInfo(m.id, m.levels[i]);
      if (tierIdx(info.tier) <= ti && levelStars(m.id + '-' + m.levels[i]) < 3) return m.levels[i];
    }
    for (var j = 0; j < m.levels.length; j++) if (levelStars(m.id + '-' + m.levels[j]) < 3) { best = m.levels[j]; break; }
    return best || m.levels[m.levels.length - 1];
  }

  function openMode(id) {
    teardown();
    var m = D.modeById(id);
    if (!m) return home();
    var rec = recommended(m);
    var rows = m.levels.map(function(l, i) {
      var info = D.levelInfo(m.id, l), key = m.id + '-' + l, st = (data.levels || {})[key];
      return '<button type="button" class="qhe-level' + (l === rec ? ' rec' : '') + '" data-act="start" data-m="' + m.id + '" data-l="' + l + '">' +
        '<span class="qhe-level-n">' + (i + 1) + '</span>' +
        '<span class="qhe-level-text"><b>' + tx(info) + '</b><small>' + txOther(info) + '</small>' +
          (info.hint ? '<em>' + tx(info.hint) + '</em>' : '') + '</span>' +
        '<span class="qhe-level-side">' + starRow(st ? st.stars : 0) +
          (l === rec ? '<span class="qhe-rec">' + (lang === 'es' ? 'Para ti' : 'For you') + '</span>' : '') +
          (st && st.best != null ? '<small>' + (lang === 'es' ? 'Mejor ' : 'Best ') + st.best + '/' + st.of + '</small>' : '') + '</span>' +
      '</button>';
    }).join('');
    root().innerHTML =
      '<div class="qhe-levels">' +
        topBar(m.icon + ' ' + (lang === 'es' ? m.es : m.en), 'home') +
        toolbar() +
        '<p class="qhe-lead">' + tx(m.desc) + ' <span>' + txOther(m.desc) + '</span></p>' +
        '<div class="qhe-level-list">' + rows + '</div>' +
      '</div>';
    view.onLang = function() { openMode(id); };
  }

  function topBar(title, back) {
    return '<div class="qhe-top">' +
      '<button type="button" class="qhe-back" data-act="back" data-v="' + back + '" aria-label="Back">←</button>' +
      '<div class="qhe-top-title">' + title + '</div>' +
      '<span class="qhe-top-pad"></span></div>';
  }

  // =====================================================================
  // EXPLORE
  // =====================================================================
  function explore(keepT) {
    teardown();
    var d = new Date(), start = keepT != null ? keepT : d.getHours() * 60 + d.getMinutes();
    var step = 1;
    root().innerHTML =
      '<div class="qhe-play">' +
        topBar('🖐️ ' + (lang === 'es' ? 'Explora' : 'Explore'), 'home') +
        toolbar() +
        '<div class="qhe-stage">' +
          '<div class="qhe-area-clock"><div class="qhe-clockwrap"><canvas id="qhe-canvas"></canvas></div>' +
            '<div class="qhe-flipwrap' + (data.digital ? '' : ' hide') + '" id="qhe-flip"></div></div>' +
          '<div class="qhe-area-prompt"><div class="qhe-prompt" id="qhe-prompt"></div></div>' +
          '<div class="qhe-area-ctl"><div class="qhe-row">' +
            '<button type="button" class="qhe-btn" data-act="exNow">🕰️ ' + (lang === 'es' ? 'Ahora' : 'Now') + '</button>' +
            '<button type="button" class="qhe-btn" data-act="exRand">🎲 ' + (lang === 'es' ? 'Al azar' : 'Random') + '</button>' +
            '<button type="button" class="qhe-btn" data-act="exStep" id="qhe-step">' + stepLabel() + '</button>' +
            '<button type="button" class="qhe-btn primary" data-act="exSay">🔊 ' + (lang === 'es' ? 'Dime la hora' : 'Say it') + '</button>' +
          '</div>' +
          '<div class="qhe-tip">' + (lang === 'es'
            ? 'El <b class="qhe-blue">horario</b> es corto y marca la hora. El <b class="qhe-red">minutero</b> es largo y marca los minutos. Al mover el minutero, el horario avanza solo.'
            : 'The <b class="qhe-blue">hour hand</b> is short and points to the hour. The <b class="qhe-red">minute hand</b> is long and counts minutes. Move the minute hand and the hour hand follows, like real clock gears.') +
          '</div></div>' +
        '</div>' +
      '</div>';
    function stepLabel() { return step === 1 ? (lang === 'es' ? '1 min' : '1 min') : (lang === 'es' ? '5 min' : '5 min'); }
    var cv = document.getElementById('qhe-canvas');
    var area = $('.qhe-area-clock');
    var flip = A.createFlip(document.getElementById('qhe-flip'));
    var clock = A.createClock(cv, {
      size: clockSizeFor(area), interactive: true, helper: !!data.helper, lang: lang, step: step, time: start,
      label: 'Clock — drag the hands', onTick: tick,
      onChange: function(t) { show(t, false); }, onRelease: function(t) { show(t, true); }
    });
    view.clocks.push(clock);
    watchSize(area, clock);
    function show(t, animate) {
      var n = D.norm(t);
      flipShow(flip, n, '12p', animate !== false);
      var w = words(n);
      var p = document.getElementById('qhe-prompt');
      if (p) p.innerHTML = '<div class="qhe-p1">' + esc(tx(w)) + '</div><div class="qhe-p2">' + esc(txOther(w)) + '</div>' +
        '<div class="qhe-p3">' + esc(lang === 'es' ? D.periodEs(n) : D.periodEn(n)) + ' · ' + D.digital24(n) + '</div>';
    }
    show(start, false);
    view.explore = {
      now: function() { var d2 = new Date(), t = d2.getHours() * 60 + d2.getMinutes(); clock.setTime(t, 900, function() { show(t); }); },
      rand: function() { var t = rand(1440 / step) * step; clock.setTime(t, 900, function() { show(t); }); },
      step: function() { step = step === 1 ? 5 : 1; clock.setOptions({ step: step }); var b = document.getElementById('qhe-step'); if (b) b.textContent = stepLabel(); },
      say: function() { say(tx(words(D.norm(clock.getTime())))); }
    };
    view.onLang = function() { explore(clock.getTime()); };
  }

  // =====================================================================
  // QUESTION GENERATORS
  // =====================================================================
  function clockTime(lvl) {
    var h = 1 + rand(12), m = 0;
    if (lvl === 'oclock') m = 0;
    else if (lvl === 'half') m = Math.random() < 0.7 ? 30 : 0;
    else if (lvl === 'quarter') m = pick([15, 45, 15, 45, 30]);
    else if (lvl === 'five') m = pick([5, 10, 20, 25, 35, 40, 50, 55, 15, 45]);
    else if (lvl === 'minute') { m = rand(60); if (m % 5 === 0) m = (m + 1 + rand(4)) % 60; }
    else if (lvl === 'h24') return rand(24) * 60 + rand(12) * 5;
    return (h % 12) * 60 + m;
  }
  function uniqueTimes(lvl, n) {
    var out = [], seen = {}, guard = 0;
    while (out.length < n && guard++ < 400) {
      var t = clockTime(lvl), k = lvl === 'h24' ? t : t % 720;
      if (seen[k]) continue;
      seen[k] = 1; out.push(t);
    }
    return out;
  }
  // Plausible mistakes for "read the clock".
  function distractors(t, lvl, n) {
    var h = D.h12(t), m = D.mins(t), out = [], seen = {};
    seen[lvl === 'h24' ? t : t % 720] = 1;
    function add(hh, mm) {
      if (mm < 0 || mm > 59) return;
      hh = ((hh - 1 + 120) % 12) + 1;
      var v = (hh % 12) * 60 + mm;
      if (lvl === 'h24') v = (D.h24(t) >= 12 ? 720 : 0) + v;
      var k = lvl === 'h24' ? v : v % 720;
      if (seen[k]) return;
      seen[k] = 1; out.push(v);
    }
    if (lvl === 'h24') {
      // classic 24 h slips: forgetting to add 12, adding 12 twice-ish, off-by-one hour
      var flip12 = (t + 720) % 1440;
      [flip12, (t + 60) % 1440, (t + 1380) % 1440, (t + 600) % 1440, (t + 30) % 1440].forEach(function(v) {
        if (!seen[v]) { seen[v] = 1; out.push(v); }
      });
      return shuffle(out).slice(0, n);
    }
    var swapH = m === 0 ? 12 : Math.round(m / 5), swapM = (h % 12) * 5;
    var cands = [];
    if (lvl === 'oclock') cands = [[h + 1, 0], [h - 1, 0], [swapH, 0], [h + 6, 0], [h + 2, 0]];
    else if (lvl === 'half') cands = [[h + 1, m], [h, m === 30 ? 0 : 30], [h - 1, m], [6, (h % 12) * 5], [h + 1, m === 30 ? 0 : 30]];
    else if (lvl === 'quarter') cands = [[h, 60 - m || 30], [h + 1, m], [h - 1, m], [swapH, swapM], [h, (m + 30) % 60]];
    else if (lvl === 'five') cands = [[h, (m + 5) % 60], [h, (m + 55) % 60], [h + 1, m], [swapH, swapM], [h, 60 - m]];
    else cands = [[h, (m + 1) % 60], [h, (m + 59) % 60], [h, (m + 10) % 60], [h + 1, m], [h, (m + 5) % 60], [swapH, swapM]];
    shuffle(cands).forEach(function(c) { add(c[0], c[1]); });
    while (out.length < n) add(1 + rand(12), lvl === 'oclock' ? 0 : lvl === 'half' ? pick([0, 30]) : rand(12) * 5);
    return out.slice(0, n);
  }
  function nChoices() { return tier === 'beginner' ? 3 : 4; }

  // ---- mode definitions --------------------------------------------
  var MODES = {};

  // ---------------- SET THE CLOCK ----------------
  MODES.set = {
    layout: 'clock',
    make: function(lvl) { return uniqueTimes(lvl, 10).map(function(t) { return { t: t }; }); },
    begin: function(q, first) {
      var c = R.clock;
      c.setOptions({ interactive: true, step: D.CLOCK_LEVELS[R.lvl].step });
      var start = first ? (tier === 'beginner' ? 0 : clockTime(R.lvl === 'h24' ? 'five' : R.lvl)) : c.getTime();
      if (first && start % 720 === q.t % 720) start += 180;
      c.setTime(start, first ? 0 : 400);
      flipShow(R.flip, q.t, R.lvl === 'h24' ? '24' : '12', true);
    },
    prompt: function(q) {
      if (R.lvl === 'h24') {
        return { en: 'Set the clock to ' + D.digital24(q.t) + '.', es: 'Pon el reloj a las ' + D.digital24(q.t) + '.',
          sub: bi('That is ' + D.phraseEn(q.t) + ' ' + D.periodEn(q.t) + '.', 'Son ' + D.phraseEs(q.t) + ' ' + D.periodEs(q.t) + '.') };
      }
      return { en: 'Set the clock to ' + D.phraseEn(q.t) + '.', es: 'Pon el reloj: ' + D.phraseEs(q.t) + '.' };
    },
    controls: function() {
      return '<button type="button" class="qhe-btn primary big" data-act="check">✔ ' + (lang === 'es' ? 'Listo' : 'Check') + '</button>';
    },
    check: function(q) { return D.norm(R.clock.getTime()) % 720 === q.t % 720; },
    reveal: function(q, cb) { animateToTarget(q.t, 720, cb); },
    answerText: function(q) { return R.lvl === 'h24' ? bi(D.digital24(q.t) + ' — ' + D.phraseEn(q.t), D.digital24(q.t) + ' — ' + D.phraseEs(q.t)) : phrase(q.t); },
    retry: true
  };

  // Move the clock to t by the shortest way round (mod period).
  function animateToTarget(t, period, cb) {
    var c = R.clock, cur = c.getTime();
    var target = t + period * Math.round((cur - t) / period);
    var dist = Math.abs(target - cur);
    c.setTime(target, Math.min(2200, 700 + dist * 4), cb);
  }

  // ---------------- READ THE CLOCK ----------------
  MODES.read = {
    layout: 'clock',
    make: function(lvl) {
      return uniqueTimes(lvl, 10).map(function(t, i) {
        var typed = (tier === 'advanced' || tier === 'expert') && (lvl === 'five' || lvl === 'minute' || lvl === 'h24');
        var opts = typed ? null : shuffle([t].concat(distractors(t, lvl, nChoices() - 1)));
        var style = (lvl === 'h24' || tier === 'beginner') ? 'digital' : (i % 2 ? 'words' : 'digital');
        return { t: t, typed: typed, opts: opts, style: style };
      });
    },
    begin: function(q, first) {
      var c = R.clock;
      c.setOptions({ interactive: false });
      var target = q.t + 720 * Math.round((c.getTime() - q.t) / 720);
      if (R.lvl === 'h24') target = q.t;
      c.setTime(first ? q.t : target, first ? 0 : 900);
      flipShow(R.flip, null, '', false);
      var fw = $('.qhe-flipwrap'); if (fw) fw.classList.add('pending');
      R.typed = '';
    },
    prompt: function(q) {
      if (R.lvl === 'h24') {
        var pe = D.periodEn(q.t), ps = D.periodEs(q.t);
        return { en: 'What time is it in 24-hour time? It is ' + pe + '.', es: '¿Qué hora es en formato de 24 horas? Es ' + ps.replace('de la ', 'en la ').replace('del ', 'al ') + '.',
          badge: periodBadge(q.t) };
      }
      return { en: 'What time is it?', es: '¿Qué hora es?' };
    },
    controls: function(q) {
      if (q.typed) return keypad();
      return '<div class="qhe-opts n' + q.opts.length + '">' + q.opts.map(function(o, i) {
        var label = q.style === 'words' ? tx(phrase(o)) : (R.lvl === 'h24' ? D.digital24(o) : D.digital12(o));
        return '<button type="button" class="qhe-opt' + (q.style === 'words' ? ' words' : '') + '" data-act="opt" data-i="' + i + '">' + esc(label) + '</button>';
      }).join('') + '</div>';
    },
    checkOpt: function(q, i) { return q.opts[i] === q.t; },
    checkTyped: function(q, raw) {
      var p = parseTyped(raw);
      if (!p) return null;
      if (R.lvl === 'h24') return p.h === D.h24(q.t) && p.m === D.mins(q.t);
      return (p.h % 12) === (D.h24(q.t) % 12) && p.m === D.mins(q.t);
    },
    reveal: function(q, cb) {
      var fw = $('.qhe-flipwrap'); if (fw) fw.classList.remove('pending');
      flipShow(R.flip, q.t, R.lvl === 'h24' ? '24' : '12', true);
      markOptions(function(o) { return o === q.t; }, q.opts);
      if (cb) later(cb, 300);
    },
    answerText: function(q) { return R.lvl === 'h24' ? bi(D.digital24(q.t), D.digital24(q.t)) : bi(D.digital12(q.t) + ' — ' + D.phraseEn(q.t), D.digital12(q.t) + ' — ' + D.phraseEs(q.t)); },
    retry: false
  };
  function periodBadge(t) {
    var h = D.h24(t), icon = h < 6 || h >= 21 ? '🌙' : h < 12 ? '🌅' : h < 18 ? '☀️' : '🌇';
    return '<span class="qhe-period">' + icon + ' ' + esc(lang === 'es' ? D.periodEs(t) : D.periodEn(t)) + '</span>';
  }
  function markOptions(isRight, opts, chosen) {
    var btns = root().querySelectorAll('.qhe-opt');
    for (var i = 0; i < btns.length; i++) {
      var v = opts ? opts[i] : i;
      if (isRight(v, i)) btns[i].classList.add('right');
      else if (chosen === i) btns[i].classList.add('wrong');
      btns[i].disabled = true;
    }
  }

  // keypad for typed answers
  function keypad() {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✔'];
    return '<div class="qhe-kp">' +
      '<label class="qhe-kp-label" for="qhe-kp-out">' + (lang === 'es' ? 'Escribe la hora' : 'Type the time') + '</label>' +
      '<output class="qhe-kp-out" id="qhe-kp-out" aria-live="polite">' + fmtTyped('') + '</output>' +
      '<div class="qhe-kp-keys">' + keys.map(function(k) {
        var act = k === '⌫' ? 'kpDel' : k === '✔' ? 'kpOk' : 'kp';
        var lab = k === '⌫' ? ' aria-label="Delete"' : k === '✔' ? ' aria-label="Check"' : '';
        return '<button type="button" class="qhe-key' + (k === '✔' ? ' ok' : '') + '" data-act="' + act + '" data-v="' + k + '"' + lab + '>' + k + '</button>';
      }).join('') + '</div></div>';
  }
  function fmtTyped(raw) {
    if (!raw) return '<span class="ph">_:__</span>';
    if (raw.length === 1) return raw + '<span class="ph">:__</span>';
    if (raw.length === 2) return raw[0] + ':' + raw[1] + '<span class="ph">_</span>';
    if (raw.length === 3) return raw[0] + ':' + raw.substr(1);
    return raw.substr(0, 2) + ':' + raw.substr(2);
  }
  function parseTyped(raw) {
    if (raw.length < 3) return null;
    var h = raw.length === 3 ? +raw[0] : +raw.substr(0, 2), m = +raw.substr(raw.length - 2);
    if (m > 59 || h > 23) return null;
    return { h: h, m: m };
  }

  // ---------------- MATCH ----------------
  MODES.match = {
    layout: 'board',
    make: function(lvl) {
      var size = tier === 'beginner' ? 3 : tier === 'intermediate' ? 4 : 5;
      var boards = [], left = 10, bi2 = 0;
      while (left > 0) {
        var n = Math.min(size, left);
        if (left - n > 0 && left - n < 3) n = left - 3 > 0 ? left - 3 : n;
        var times = uniqueTimes(lvl, n);
        var kind = tier === 'beginner' ? 'digital' : (bi2 % 2 ? 'words' : 'digital');
        boards.push({ times: times, kind: kind, order: shuffle(times.map(function(t, i) { return i; })) });
        left -= n; bi2++;
      }
      return boards;
    }
  };

  // ---------------- MY DAY ----------------
  MODES.day = {
    layout: 'scene',
    make: function(lvl) {
      var col = lvl === 'day1' ? 0 : lvl === 'day2' ? 1 : 2;
      return D.ROUTINE.map(function(r) { return { r: r, t: r.times[col] }; });
    },
    begin: function(q, first) {
      var c = R.clock;
      c.setOptions({ interactive: true, step: 5 });
      if (first) c.setTime(360, 0);
      var sc = $('#qhe-scene');
      sc.classList.remove('in'); void sc.offsetWidth;
      sc.innerHTML = A.sceneSVG(q.r.id) + '<div class="qhe-scene-cap"><b>' + esc(tx(q.r)) + '</b><span>' + esc(txOther(q.r)) + '</span></div>';
      sc.classList.add('in');
      A.updateSky(sc, D.norm(c.getTime()));
      flipShow(R.flip, q.t, R.lvl === 'day3' ? '24' : '12p', true);
    },
    onChange: function(t) { A.updateSky($('#qhe-scene'), D.norm(t)); },
    prompt: function(q) {
      var at = R.lvl === 'day3' ? D.digital24(q.t) : D.digital12(q.t) + ' ' + D.ampm(q.t);
      return { en: q.r.ask.en + ' (' + at + ')', es: q.r.ask.es + ' (' + at + ')',
        sub: bi(D.cap(D.phraseEn(q.t)) + ' ' + D.periodEn(q.t) + '.', D.cap(D.phraseEs(q.t)) + ' ' + D.periodEs(q.t) + '.') };
    },
    controls: MODES.set.controls,
    check: function(q) { return D.norm(R.clock.getTime()) % 720 === q.t % 720; },
    after: function(q, cb) { animateToTarget(q.t, 1440, cb); },
    reveal: function(q, cb) { animateToTarget(q.t, 1440, cb); },
    answerText: function(q) { return bi(D.digital12(q.t) + ' ' + D.ampm(q.t) + ' — ' + D.phraseEn(q.t), D.digital12(q.t) + ' ' + D.ampm(q.t) + ' — ' + D.phraseEs(q.t)); },
    retry: true
  };

  // ---------------- HOW LONG? ----------------
  var HL_SETS = {
    hl1: [30, 60, 90, 120, 150, 180],
    hl2: [5, 10, 15, 20, 25, 35, 40, 45, 50, 55],
    hl3: null, hl4: null
  };
  MODES.howlong = {
    layout: 'clock',
    make: function(lvl) {
      var qs = [], guard = 0, seen = {};
      while (qs.length < 10 && guard++ < 300) {
        var a = pick(D.ACTIVITIES);
        var allowed = HL_SETS[lvl] ? a.durs.filter(function(d) { return HL_SETS[lvl].indexOf(d) >= 0; }) : a.durs;
        if (lvl === 'hl2') {
          var lo = Math.min.apply(null, a.durs) - 10, hi = Math.max.apply(null, a.durs);
          allowed = HL_SETS.hl2.filter(function(d) { return d >= lo && d <= hi; });
        }
        if (!allowed.length) continue;
        var dur = pick(allowed);
        var h = a.start[0] + rand(a.start[1] - a.start[0] + 1);
        var m = lvl === 'hl1' ? pick([0, 15, 30, 45]) : rand(12) * 5;
        if (lvl === 'hl2' && m + dur < 60 && Math.random() < 0.6) m = 60 - 5 * (1 + rand(Math.max(1, Math.floor(dur / 5))));
        var s = h * 60 + m, k = a.en + s + dur;
        if (seen[k]) continue;
        seen[k] = 1;
        var kind = lvl === 'hl3' ? 'dur' : lvl === 'hl4' ? 'start' : 'end';
        var q = { a: a, s: s, d: dur, e: s + dur, kind: kind };
        if (kind === 'dur') {
          var ds = [dur], cand = shuffle([dur + 5, dur - 5, dur + 10, dur - 10, dur + 15, dur + 60, dur - 15, dur + 30]);
          cand.forEach(function(x) { if (x > 0 && ds.indexOf(x) < 0 && ds.length < 4) ds.push(x); });
          q.opts = shuffle(ds);
        } else if (kind === 'start') {
          var ss = [s], c2 = shuffle([s + 60, s - 60, s + 15, s - 15, s + 30, s + dur, s - 5, s + 5]);
          c2.forEach(function(x) { if (ss.indexOf(x) < 0 && ss.length < 4) ss.push(x); });
          q.opts = shuffle(ss);
        }
        qs.push(q);
      }
      return qs;
    },
    begin: function(q) {
      var c = R.clock;
      c.setElapsed(null);
      if (q.kind === 'end') {
        c.setOptions({ interactive: true, step: 5 });
        c.setTime(q.s, 500, function() { c.setElapsed(q.s); });
        c.setMarker(q.s);
        flipShow(R.flip, q.s, '12', true);
      } else if (q.kind === 'dur') {
        c.setOptions({ interactive: false });
        c.setTime(q.s, 500);
        c.setMarker(q.e);
        flipShow(R.flip, q.s, '12', true);
      } else {
        c.setOptions({ interactive: false });
        c.setTime(q.e, 500);
        c.setMarker(q.e);
        flipShow(R.flip, q.e, '12', true);
      }
    },
    prompt: function(q) {
      var A1 = q.a.en, A2 = q.a.es;
      if (q.kind === 'end') return {
        en: A1 + ' starts at ' + D.digital12(q.s) + ' and lasts ' + D.durEn(q.d) + '. When does it end? Move the hands forward.',
        es: A2 + ' empieza ' + D.esAt(q.s) + ' y dura ' + D.durEs(q.d) + '. ¿A qué hora termina? Avanza las manecillas.' };
      if (q.kind === 'dur') return {
        en: A1 + ' starts at ' + D.digital12(q.s) + ' and ends at ' + D.digital12(q.e) + '. How long does it last?',
        es: A2 + ' empieza ' + D.esAt(q.s) + ' y termina ' + D.esAt(q.e) + '. ¿Cuánto dura?' };
      return {
        en: A1 + ' ended at ' + D.digital12(q.e) + ' and lasted ' + D.durEn(q.d) + '. When did it start?',
        es: A2 + ' terminó ' + D.esAt(q.e) + ' y duró ' + D.durEs(q.d) + '. ¿A qué hora empezó?' };
    },
    controls: function(q) {
      if (q.kind === 'end') return MODES.set.controls();
      return '<div class="qhe-opts n4">' + q.opts.map(function(o, i) {
        var label = q.kind === 'dur' ? D.durShort(o) : D.digital12(o);
        return '<button type="button" class="qhe-opt" data-act="opt" data-i="' + i + '">' + esc(label) + '</button>';
      }).join('') + '</div>';
    },
    check: function(q) { return D.norm(R.clock.getTime()) % 720 === D.norm(q.e) % 720; },
    checkOpt: function(q, i) { return q.kind === 'dur' ? q.opts[i] === q.d : q.opts[i] === q.s; },
    reveal: function(q, cb, ok) {
      var c = R.clock;
      if (q.opts) markOptions(function(o) { return q.kind === 'dur' ? o === q.d : o === q.s; }, q.opts);
      // Sweep the minute hand from start to end so the elapsed time shows.
      c.setTime(q.s, q.kind === 'end' ? 500 : 600, function() {
        c.setElapsed(q.s); c.setMarker(q.s);
        c.setTime(q.e, Math.min(2600, 900 + q.d * 12), function() { flipShow(R.flip, q.e, '12', true); if (cb) cb(); });
      });
      if (q.kind === 'start') flipShow(R.flip, q.s, '12', true);
      void ok;
    },
    answerText: function(q) {
      if (q.kind === 'dur') return bi(D.durEn(q.d), D.durEs(q.d));
      if (q.kind === 'start') return bi(D.digital12(q.s), D.digital12(q.s));
      return bi(D.digital12(q.e) + ' — ' + D.phraseEn(q.e), D.digital12(q.e) + ' — ' + D.phraseEs(q.e));
    },
    retry: false
  };

  // ---------------- CALENDAR ----------------
  function dayBi(i) { return bi(D.DAYS.en[((i % 7) + 7) % 7], D.cap(D.DAYS.es[((i % 7) + 7) % 7])); }
  function monthBi(i) { return bi(D.MONTHS.en[((i % 12) + 12) % 12], D.cap(D.MONTHS.es[((i % 12) + 12) % 12])); }
  function seasonBi(id) { return bi(D.SEASONS[id].en, D.SEASONS[id].es); }
  function ordEn(n) { var s = (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'); return n + s; }
  function pluralDayEs(i) { var n = D.DAYS.es[i]; return /s$/.test(n) ? n : n + 's'; }
  // Build options from a correct {en,es} plus distractor pool.
  function optsFrom(correct, pool, n) {
    var out = [correct], seen = {}; seen[correct.en] = 1;
    shuffle(pool.slice()).forEach(function(p) { if (out.length < n && !seen[p.en]) { seen[p.en] = 1; out.push(p); } });
    out = shuffle(out);
    return { opts: out, a: out.indexOf(correct) };
  }
  var ALL_DAYS = [0, 1, 2, 3, 4, 5, 6].map(dayBi);
  var ALL_MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(monthBi);
  var ALL_SEASONS = D.SEASON_IDS.map(seasonBi);
  function numOpts(ans, pool) { return optsFrom(bi(String(ans), String(ans)), pool.map(function(v) { return bi(String(v), String(v)); }), nChoices()); }

  var CAL_GEN = {
    cal1: [
      function() { var d = rand(7), o = optsFrom(dayBi(d + 1), ALL_DAYS, nChoices());
        return { vis: { week: d }, q: bi('What day comes after ' + D.DAYS.en[d] + '?', '¿Qué día viene después del ' + D.DAYS.es[d] + '?'), opts: o.opts, a: o.a, focus: (d + 1) % 7 }; },
      function() { var d = rand(7), o = optsFrom(dayBi(d + 6), ALL_DAYS, nChoices());
        return { vis: { week: d }, q: bi('What day comes before ' + D.DAYS.en[d] + '?', '¿Qué día viene antes del ' + D.DAYS.es[d] + '?'), opts: o.opts, a: o.a, focus: (d + 6) % 7 }; },
      function() { var d = rand(7), n = 2 + rand(3), o = optsFrom(dayBi(d + n), ALL_DAYS, nChoices());
        return { vis: { week: d }, q: bi('Today is ' + D.DAYS.en[d] + '. What day will it be in ' + n + ' days?', 'Hoy es ' + D.DAYS.es[d] + '. ¿Qué día será en ' + n + ' días?'), opts: o.opts, a: o.a, focus: (d + n) % 7 }; },
      function() { var o = numOpts(7, [5, 6, 8, 10, 12]);
        return { vis: { week: -1 }, q: bi('How many days are in one week?', '¿Cuántos días tiene una semana?'), opts: o.opts, a: o.a }; },
      function() { var c = bi('Saturday & Sunday', 'Sábado y domingo');
        var o = optsFrom(c, [bi('Monday & Tuesday', 'Lunes y martes'), bi('Friday & Monday', 'Viernes y lunes'), bi('Wednesday & Thursday', 'Miércoles y jueves')], nChoices());
        return { vis: { week: -1 }, q: bi('Which two days make the weekend?', '¿Qué dos días forman el fin de semana?'), opts: o.opts, a: o.a, focus: 5 }; },
      function() { var d = rand(7);
        var correct = lang === 'es' ? bi(D.DAYS.en[d], D.DAYS.en[d]) : bi(D.DAYS.es[d], D.DAYS.es[d]);
        var pool = [0, 1, 2, 3, 4, 5, 6].map(function(i) { var w = lang === 'es' ? D.DAYS.en[i] : D.DAYS.es[i]; return bi(w, w); });
        var o = optsFrom(correct, pool, nChoices());
        return { vis: { week: d }, q: lang === 'es' ? bi('In English, "' + D.DAYS.es[d] + '" is…', 'En inglés, "' + D.DAYS.es[d] + '" se dice…') : bi('In Spanish, ' + D.DAYS.en[d] + ' is…', 'En español, "' + D.DAYS.en[d] + '" se dice…'), opts: o.opts, a: o.a, focus: d }; },
      function() { var o = optsFrom(dayBi(0), ALL_DAYS, nChoices());
        return { vis: { week: -1 }, q: bi('On a Chilean calendar, which day starts the week?', 'En un calendario chileno, ¿qué día empieza la semana?'), opts: o.opts, a: o.a, focus: 0 }; }
    ],
    cal2: [
      function() { var m = rand(12), o = optsFrom(monthBi(m + 1), ALL_MONTHS, nChoices());
        return { vis: { wheel: m }, q: bi('Which month comes after ' + D.MONTHS.en[m] + '?', '¿Qué mes viene después de ' + D.MONTHS.es[m] + '?'), opts: o.opts, a: o.a }; },
      function() { var m = rand(12), o = optsFrom(monthBi(m + 11), ALL_MONTHS, nChoices());
        return { vis: { wheel: m }, q: bi('Which month comes before ' + D.MONTHS.en[m] + '?', '¿Qué mes viene antes de ' + D.MONTHS.es[m] + '?'), opts: o.opts, a: o.a }; },
      function() { var m = rand(12), o = optsFrom(seasonBi(D.seasonOfMonth(m)), ALL_SEASONS, 4);
        return { vis: { wheel: m, plain: true }, q: bi('In Chile, which season is ' + D.MONTHS.en[m] + '?', 'En Chile, ¿en qué estación está ' + D.MONTHS.es[m] + '?'), opts: o.opts, a: o.a }; },
      function() { var m = rand(12), o = optsFrom(seasonBi(D.seasonOfMonth(m)), ALL_SEASONS, 4);
        return { vis: { wheel: m, plain: true }, q: bi('In Chile, which season is ' + D.MONTHS.en[m] + '?', 'En Chile, ¿en qué estación está ' + D.MONTHS.es[m] + '?'), opts: o.opts, a: o.a }; },
      function() { var o = optsFrom(seasonBi('summer'), ALL_SEASONS, 4);
        return { vis: { wheel: 11, plain: true }, q: bi('Christmas is on 25 December. Which season is that in Chile?', 'La Navidad es el 25 de diciembre. ¿Qué estación es en Chile?'), opts: o.opts, a: o.a }; },
      function() { var o = optsFrom(seasonBi('spring'), ALL_SEASONS, 4);
        return { vis: { wheel: 8, plain: true }, q: bi('Chile celebrates Fiestas Patrias on 18 September. Which season is that?', 'Chile celebra las Fiestas Patrias el 18 de septiembre. ¿Qué estación es?'), opts: o.opts, a: o.a }; },
      function() { var c = bi('June, July, August', 'Junio, julio, agosto');
        var o = optsFrom(c, [bi('December, January, February', 'Diciembre, enero, febrero'), bi('March, April, May', 'Marzo, abril, mayo'), bi('September, October, November', 'Septiembre, octubre, noviembre')], 4);
        return { vis: { wheel: 6, plain: true }, q: bi('Which months are winter in Chile?', '¿Qué meses son invierno en Chile?'), opts: o.opts, a: o.a }; },
      function() { var o = numOpts(12, [10, 7, 24, 52]);
        return { vis: { wheel: -1 }, q: bi('How many months are in a year?', '¿Cuántos meses tiene un año?'), opts: o.opts, a: o.a }; },
      function() { var o = numOpts(28, [30, 31, 27]);
        return { vis: { wheel: 1 }, q: bi('How many days does February have in most years?', '¿Cuántos días tiene febrero casi todos los años?'), opts: o.opts, a: o.a }; },
      function() { var t30 = pick([3, 5, 8, 10]), o = optsFrom(monthBi(t30), [0, 2, 4, 6, 7, 9, 11].map(monthBi), nChoices());
        return { vis: { wheel: -1 }, q: bi('Which of these months has 30 days?', '¿Cuál de estos meses tiene 30 días?'), opts: o.opts, a: o.a }; },
      function() { var m = rand(12);
        var correct = lang === 'es' ? bi(D.MONTHS.en[m], D.MONTHS.en[m]) : bi(D.MONTHS.es[m], D.MONTHS.es[m]);
        var pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function(i) { var w = lang === 'es' ? D.MONTHS.en[i] : D.MONTHS.es[i]; return bi(w, w); });
        var o = optsFrom(correct, pool, nChoices());
        return { vis: { wheel: m }, q: lang === 'es' ? bi('In English, "' + D.MONTHS.es[m] + '" is…', 'En inglés, "' + D.MONTHS.es[m] + '" se dice…') : bi('In Spanish, ' + D.MONTHS.en[m] + ' is…', 'En español, "' + D.MONTHS.en[m] + '" se dice…'), opts: o.opts, a: o.a }; },
      function() { var c = bi('January & February', 'Enero y febrero');
        var o = optsFrom(c, [bi('June & July', 'Junio y julio'), bi('April & May', 'Abril y mayo'), bi('September & October', 'Septiembre y octubre')], 4);
        return { vis: { wheel: 0 }, q: bi('The long summer school holidays in Chile are mostly in…', 'Las vacaciones largas de verano en Chile son sobre todo en…'), opts: o.opts, a: o.a }; }
    ],
    cal3: [
      function(c) { var d = 1 + rand(c.dim), w = D.weekdayOf(c.y, c.m, d), o = optsFrom(dayBi(w), ALL_DAYS, nChoices());
        return { vis: { cal: c, focus: d }, q: bi('What day of the week is the ' + ordEn(d) + '?', '¿Qué día de la semana es el ' + d + '?'), opts: o.opts, a: o.a, mark: d }; },
      function(c) { var d = 3 + rand(c.dim - 3), w = D.weekdayOf(c.y, c.m, d), o = optsFrom(dayBi(w), ALL_DAYS, nChoices());
        return { vis: { cal: c, focus: d }, q: bi('What day of the week is the ' + ordEn(d) + '?', '¿Qué día de la semana es el ' + d + '?'), opts: o.opts, a: o.a, mark: d }; },
      function(c) { var w = rand(7), first = 1 + ((w - c.first + 7) % 7);
        return { vis: { cal: c, tap: true }, q: bi('Tap the first ' + D.DAYS.en[w] + ' of the month.', 'Toca el primer ' + D.DAYS.es[w] + ' del mes.'), tap: first }; },
      function(c) { var d = 1 + rand(c.dim - 7);
        return { vis: { cal: c, tap: true, focus: d }, q: bi('Tap the date one week after the ' + ordEn(d) + '.', 'Toca la fecha una semana después del ' + d + '.'), tap: d + 7 }; },
      function(c) {
        return { vis: { cal: c, tap: true }, q: bi('Tap the last day of the month.', 'Toca el último día del mes.'), tap: c.dim }; },
      function(c) { var d = 2 + rand(c.dim - 2);
        return { vis: { cal: c, tap: true, focus: d }, q: bi('Tap the day before the ' + ordEn(d) + '.', 'Toca el día antes del ' + d + '.'), tap: d - 1 }; },
      function(c) { var w = rand(7), n = 0;
        for (var d = 1; d <= c.dim; d++) if (D.weekdayOf(c.y, c.m, d) === w) n++;
        var o = numOpts(n, [3, 4, 5, 6].filter(function(v) { return v !== n; }));
        return { vis: { cal: c }, q: bi('How many ' + D.DAYS.en[w] + 's are in this month?', '¿Cuántos ' + pluralDayEs(w) + ' tiene este mes?'), opts: o.opts, a: o.a, countDay: w }; },
      function(c) { var o = numOpts(c.dim, [28, 29, 30, 31].filter(function(v) { return v !== c.dim; }));
        return { vis: { cal: c }, q: bi('How many days does ' + D.MONTHS.en[c.m] + ' ' + c.y + ' have?', '¿Cuántos días tiene ' + D.MONTHS.es[c.m] + ' de ' + c.y + '?'), opts: o.opts, a: o.a, all: true }; }
    ]
  };
  function pickMonth() {
    var y = new Date().getFullYear() + rand(2), m = rand(12);
    return { y: y, m: m, dim: D.daysInMonth(y, m), first: D.weekdayOf(y, m, 1) };
  }
  MODES.calendar = {
    layout: 'visual',
    make: function(lvl) {
      var gens = CAL_GEN[lvl], qs = [], used = {}, guard = 0;
      var month = pickMonth();
      while (qs.length < 10 && guard++ < 200) {
        if (lvl === 'cal3' && qs.length === 5) month = pickMonth();
        var gi = rand(gens.length);
        var q = gens[gi](month);
        var k = q.q.en;
        if (used[k]) continue;
        used[k] = 1; qs.push(q);
      }
      return qs;
    },
    begin: function(q) { renderCalVisual(q, null); },
    prompt: function(q) { return { en: q.q.en, es: q.q.es }; },
    controls: function(q) {
      if (q.tap != null) return '<p class="qhe-tap-hint">👆 ' + (lang === 'es' ? 'Toca una fecha del calendario.' : 'Tap a date on the calendar.') + '</p>';
      return optButtons(q.opts);
    },
    checkOpt: function(q, i) { return i === q.a; },
    checkTap: function(q, d) { return d === q.tap; },
    reveal: function(q, cb, ok, chosen) {
      if (q.opts) markOptions(function(o, i) { return i === q.a; }, null, chosen);
      renderCalVisual(q, ok ? 'good' : 'bad', chosen);
      if (cb) later(cb, 200);
    },
    answerText: function(q) {
      if (q.tap != null) return bi('The ' + ordEn(q.tap), 'El ' + q.tap);
      return q.opts[q.a];
    },
    retry: false
  };
  function optButtons(opts) {
    return '<div class="qhe-opts n' + opts.length + (opts.some(function(o) { return tx(o).length > 14; }) ? ' long' : '') + '">' + opts.map(function(o, i) {
      return '<button type="button" class="qhe-opt words" data-act="opt" data-i="' + i + '">' + esc(tx(o)) +
        (txOther(o) && txOther(o) !== tx(o) ? '<small>' + esc(txOther(o)) + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function renderCalVisual(q, state, chosen) {
    var box = $('#qhe-visual');
    if (!box) return;
    var v = q.vis, html = '';
    if (v.week != null) {
      html = '<div class="qhe-week">' + [0, 1, 2, 3, 4, 5, 6].map(function(i) {
        var cls = (i === v.week ? ' today' : '') + (i >= 5 ? ' wkend' : '') + (state && q.focus === i ? ' reveal' : '');
        var full = D.cap(D.DAYS[lang][i]);
        return '<div class="qhe-wday' + cls + '"><span class="qhe-wday-ring" aria-hidden="true"></span>' +
          '<span class="qhe-wday-band"></span>' +
          '<b>' + esc(full.substr(0, 3)) + '</b><small>' + esc(full) + '</small>' +
          (i === v.week ? '<em>' + (lang === 'es' ? 'Hoy' : 'Today') + '</em>' : '') + '</div>';
      }).join('') + '</div>';
    } else if (v.wheel != null) {
      var showColors = !v.plain || state;
      html = '<div class="qhe-wheel' + (showColors ? '' : ' plain') + '">' + A.seasonWheelSVG(lang, v.wheel >= 0 ? v.wheel : null) +
        (showColors ? '<div class="qhe-legend">' + D.SEASON_IDS.map(function(s) {
          return '<span><i style="background:' + D.SEASONS[s].color + '"></i>' + esc(tx(seasonBi(s))) + '</span>';
        }).join('') + '</div>' : '') + '</div>';
    } else if (v.cal) {
      var hl = {};
      if (v.focus) hl[v.focus] = 'focus';
      if (state) {
        if (q.tap != null) { hl[q.tap] = 'good'; if (chosen && chosen !== q.tap) hl[chosen] = 'bad'; }
        else if (q.mark) hl[q.mark] = 'good';
        else if (q.countDay != null) { for (var d = 1; d <= v.cal.dim; d++) if (D.weekdayOf(v.cal.y, v.cal.m, d) === q.countDay) hl[d] = 'good'; }
        else if (q.all) hl[v.cal.dim] = 'good';
      }
      html = '<div class="qhe-calwrap">' + A.calendarSVG(v.cal.y, v.cal.m, { lang: lang, highlight: hl, tappable: v.tap && !state }) + '</div>';
    }
    box.innerHTML = html;
  }

  // ---------------- TIME PUZZLES ----------------
  function fmt12p(t) { return D.digital12(t) + ' ' + D.ampm(t); }
  var AMPM_GEN = [
    function() { var s = pick(D.AMPM_SCENES), c = bi(D.ampm(s.t), D.ampm(s.t));
      var opts = [bi('a.m.', 'a.m.'), bi('p.m.', 'p.m.')];
      return { t: s.t, q: bi(s.en + ' Is it a.m. or p.m.?', s.es + ' ¿Es a.m. o p.m.?'), opts: opts, a: c.en === 'a.m.' ? 0 : 1, key: s.en }; },
    function() { var start = pick([8, 9, 10, 11]) * 60 + pick([0, 30]), n = 2 + rand(4), end = (start + n * 60) % 1440;
      var c = bi(fmt12p(end), fmt12p(end));
      var pool = [fmt12p((end + 720) % 1440), fmt12p((start + (n - 1) * 60) % 1440), fmt12p((start + (n + 1) * 60) % 1440)].map(function(s) { return bi(s, s); });
      var o = optsFrom(c, pool, 4);
      return { t: start, q: bi("It's " + fmt12p(start) + '. What time will it be in ' + n + ' hours?', 'Son las ' + fmt12p(start) + '. ¿Qué hora será en ' + n + ' horas?'), opts: o.opts, a: o.a, key: 'later' + start + n }; },
    function() { var start = pick([20, 21, 22, 23]) * 60 + pick([0, 30]), n = 2 + rand(4), end = (start + n * 60) % 1440;
      var c = bi(fmt12p(end), fmt12p(end));
      var pool = [fmt12p((end + 720) % 1440), fmt12p((start + (n + 1) * 60) % 1440), fmt12p((start + (n - 1) * 60) % 1440)].map(function(s) { return bi(s, s); });
      var o = optsFrom(c, pool, 4);
      return { t: start, q: bi("It's " + fmt12p(start) + '. What time will it be in ' + n + ' hours?', 'Son las ' + fmt12p(start) + '. ¿Qué hora será en ' + n + ' horas?'), opts: o.opts, a: o.a, key: 'late' + start + n }; },
    function() { var t = (13 + rand(10)) * 60 + rand(12) * 5, c = bi(D.digital24(t), D.digital24(t));
      var pool = [D.digital24(t - 720), D.digital24(t + 60), D.digital24(t - 60), D.digital24(t - 120)].map(function(s) { return bi(s, s); });
      var o = optsFrom(c, pool, 4);
      return { t: t, q: bi('What is ' + fmt12p(t) + ' in 24-hour time?', '¿Cómo se escribe ' + fmt12p(t) + ' en formato de 24 horas?'), opts: o.opts, a: o.a, key: 'to24' + t }; },
    function() { var t = (13 + rand(10)) * 60 + rand(12) * 5, c = bi(fmt12p(t), fmt12p(t));
      var pool = [fmt12p(t - 720), fmt12p(t + 120), fmt12p(t - 120)].map(function(s) { return bi(s, s); });
      var o = optsFrom(c, pool, 4);
      return { t: t, q: bi('What is ' + D.digital24(t) + ' in 12-hour time?', '¿Qué hora es ' + D.digital24(t) + ' en formato de 12 horas?'), opts: o.opts, a: o.a, key: 'from24' + t }; },
    function() { var f = pick(D.AMPM_FACTS), o = optsFrom(f.opts[f.a], f.opts, f.opts.length);
      return { t: 720, q: f.q, opts: o.opts, a: o.a, key: f.q.en }; }
  ];
  MODES.puzzles = {
    layout: 'clock',
    make: function(lvl) {
      var qs = [], used = {}, guard = 0;
      if (lvl === 'zones') {
        return shuffle(D.ZONE_FACTS.slice()).slice(0, 10).map(function(f) {
          var o = optsFrom(f.opts[f.a], f.opts, f.opts.length);
          return { zone: true, q: f.q, opts: o.opts, a: o.a };
        });
      }
      while (qs.length < 10 && guard++ < 300) {
        var q = AMPM_GEN[qs.length < 6 ? qs.length % 5 : rand(AMPM_GEN.length)]();
        if (used[q.key]) continue;
        used[q.key] = 1; qs.push(q);
      }
      return shuffle(qs);
    },
    begin: function(q) {
      var c = R.clock;
      c.setOptions({ interactive: false });
      var wrap = $('.qhe-clockwrap'), zone = $('#qhe-zone');
      if (q.zone) {
        if (wrap) wrap.classList.add('hide');
        if (zone) { zone.classList.remove('hide'); zone.innerHTML = zoneCard(); }
        flipShow(R.flip, null, '', false);
        var fw = $('.qhe-flipwrap'); if (fw) fw.classList.add('hide');
      } else {
        if (wrap) wrap.classList.remove('hide');
        if (zone) zone.classList.add('hide');
        var fw2 = $('.qhe-flipwrap'); if (fw2) fw2.classList.toggle('hide', !data.digital);
        c.setTime(q.t, 800);
        flipShow(R.flip, null, '', true);
      }
    },
    prompt: function(q) { return { en: q.q.en, es: q.q.es }; },
    controls: function(q) { return optButtons(q.opts); },
    checkOpt: function(q, i) { return i === q.a; },
    reveal: function(q, cb, ok, chosen) {
      markOptions(function(o, i) { return i === q.a; }, null, chosen);
      if (!q.zone) flipShow(R.flip, q.t, '12p', true);
      if (cb) later(cb, 200);
    },
    answerText: function(q) { return q.opts[q.a]; },
    retry: false
  };
  function zoneCard() {
    // A simple globe with the day/night line: Spain (east) already in
    // afternoon light while Chile (west) is in the morning.
    return '<svg class="qhe-globe" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Earth: Spain is east of Chile">' +
      '<defs><radialGradient id="qz-sea" cx="0.4" cy="0.35"><stop offset="0" stop-color="#5fb0ef"/><stop offset="1" stop-color="#1e4f8f"/></radialGradient>' +
      '<linearGradient id="qz-night" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050a24" stop-opacity="0.72"/><stop offset="0.42" stop-color="#050a24" stop-opacity="0.6"/><stop offset="0.52" stop-color="#050a24" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="qz-sun"><stop offset="0" stop-color="#fff7d6"/><stop offset="0.4" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="qz-clip"><circle cx="150" cy="100" r="84"/></clipPath></defs>' +
      '<rect width="320" height="200" rx="18" fill="#0d1636"/>' +
      '<circle cx="292" cy="40" r="40" fill="url(#qz-sun)"/><circle cx="292" cy="40" r="12" fill="#fff6c9"/>' +
      '<circle cx="150" cy="100" r="84" fill="url(#qz-sea)"/>' +
      '<g clip-path="url(#qz-clip)" fill="#6fae4a" stroke="#4f8a36" stroke-width="1">' +
        '<path d="M70 40 q20 -8 34 4 q8 16 -4 30 q-8 12 -2 26 q8 18 4 40 q-4 20 -14 34 q-6 -24 -10 -44 q-6 -20 -16 -30 q-10 -14 -4 -34 q4 -18 12 -26Z"/>' +
        '<path d="M188 46 q22 -6 40 6 q6 12 -2 20 q-10 4 -12 14 q8 12 4 30 q-8 22 -22 30 q-8 -16 -8 -34 q-6 -12 -14 -18 q-6 -18 2 -30 q4 -12 12 -18Z"/>' +
        '<path d="M176 38 q10 -6 18 0 q-2 8 -10 10 q-8 -2 -8 -10Z"/></g>' +
      '<rect x="66" y="16" width="168" height="168" fill="url(#qz-night)" clip-path="url(#qz-clip)"/>' +
      '<circle cx="150" cy="100" r="84" fill="none" stroke="#9cc8f2" stroke-opacity="0.5" stroke-width="2"/>' +
      '<circle cx="104" cy="130" r="4.5" fill="#ef4444" stroke="#fff" stroke-width="1.5"/><text x="96" y="152" text-anchor="end" font-family="Nunito, sans-serif" font-weight="800" font-size="13" fill="#fff">Santiago</text>' +
      '<circle cx="192" cy="58" r="4.5" fill="#facc15" stroke="#fff" stroke-width="1.5"/><text x="200" y="52" font-family="Nunito, sans-serif" font-weight="800" font-size="13" fill="#fff">Madrid</text>' +
      '<path d="M40 186 h240" stroke="#9cc8f2" stroke-opacity="0.35"/><text x="40" y="180" font-family="Nunito, sans-serif" font-size="10" font-weight="700" fill="#9cc8f2">W · ' + (lang === 'es' ? 'oeste' : 'west') + '</text>' +
      '<text x="280" y="180" text-anchor="end" font-family="Nunito, sans-serif" font-size="10" font-weight="700" fill="#9cc8f2">' + (lang === 'es' ? 'este' : 'east') + ' · E</text>' +
      '</svg>';
  }

  // =====================================================================
  // ROUND ENGINE
  // =====================================================================
  var R = null;
  var GOOD = [bi('Great job!', '¡Muy bien!'), bi('You got it!', '¡Lo lograste!'), bi('Perfect!', '¡Perfecto!'), bi('Spot on!', '¡Exacto!'), bi('Super!', '¡Súper!')];

  function start(modeId, lvl) {
    teardown();
    var M = MODES[modeId];
    if (!M) return home();
    sfx('click');
    var qs = M.make(lvl);
    R = { mode: modeId, M: M, lvl: lvl, key: modeId + '-' + lvl, qs: qs, idx: 0, score: 0,
          total: modeId === 'match' ? 10 : qs.length, answered: false, tries: 0 };
    var m = D.modeById(modeId), info = D.levelInfo(modeId, lvl);
    var layout = M.layout;
    root().innerHTML =
      '<div class="qhe-play qhe-mode--' + modeId + '">' +
        topBar(m.icon + ' ' + (lang === 'es' ? m.es : m.en) + ' <small>· ' + esc(tx(info)) + '</small>', 'mode:' + modeId) +
        toolbar() +
        '<div class="qhe-progress" aria-label="Progress"><div class="qhe-dots" id="qhe-dots"></div><div class="qhe-score" id="qhe-score">★ 0</div></div>' +
        '<div class="qhe-stage qhe-stage--' + layout + '">' +
          (layout === 'scene' ? '<div class="qhe-area-vis"><div class="qhe-scene" id="qhe-scene"></div></div>' : '') +
          (layout === 'visual' ? '<div class="qhe-area-clock"><div class="qhe-visual" id="qhe-visual"></div></div>'
            : layout === 'board' ? '<div class="qhe-area-clock"><div class="qhe-board" id="qhe-board"></div></div>'
            : '<div class="qhe-area-clock"><div class="qhe-clockwrap"><canvas id="qhe-canvas"></canvas></div>' +
              '<div class="qhe-zone hide" id="qhe-zone"></div>' +
              '<div class="qhe-flipwrap' + (data.digital ? '' : ' hide') + '" id="qhe-flip"></div></div>') +
          '<div class="qhe-area-prompt"><div class="qhe-prompt" id="qhe-prompt"></div></div>' +
          '<div class="qhe-area-ctl"><div id="qhe-ctl"></div><div class="qhe-fb" id="qhe-fb" aria-live="polite"></div></div>' +
        '</div>' +
      '</div>';
    if (layout === 'clock' || layout === 'scene') {
      var area = $('.qhe-area-clock');
      R.clock = A.createClock(document.getElementById('qhe-canvas'), {
        size: clockSizeFor(area, layout === 'scene' ? 360 : 440), helper: !!data.helper, lang: lang, step: 5,
        label: 'Clock — drag the hands to set the time', onTick: tick,
        onChange: function(t) { if (R && R.M.onChange) R.M.onChange(t); }
      });
      view.clocks.push(R.clock);
      watchSize(area, R.clock, layout === 'scene' ? 360 : 440);
      R.flip = A.createFlip(document.getElementById('qhe-flip'));
    }
    view.onLang = function() {
      var tt = $('.qhe-top-title');
      if (tt) tt.innerHTML = m.icon + ' ' + (lang === 'es' ? m.es : m.en) + ' <small>· ' + esc(tx(info)) + '</small>';
      renderQ(true);
    };
    view.keyHandler = onKey;
    document.addEventListener('keydown', onKey);
    renderDots();
    if (modeId === 'match') renderBoard(true);
    else beginQ(true);
  }

  function renderDots() {
    var el = document.getElementById('qhe-dots');
    if (!el) return;
    var s = '';
    for (var i = 0; i < R.total; i++) {
      var st = R.results && R.results[i];
      s += '<i class="' + (st === true ? 'ok' : st === false ? 'miss' : (i === R.idx ? 'cur' : '')) + '"></i>';
    }
    el.innerHTML = s;
    var sc = document.getElementById('qhe-score');
    if (sc) sc.textContent = '★ ' + R.score;
  }

  function beginQ(first) {
    R.answered = false; R.tries = 0; R.typed = '';
    var q = R.qs[R.idx];
    if (R.clock) { R.clock.setElapsed(null); R.clock.setMarker(null); }
    R.M.begin(q, first);
    renderQ(false);
    if (tier === 'beginner') later(function() { sayPrompt(); }, 500);
  }

  function promptObj() { return R.M.prompt(R.qs[R.idx]); }
  function sayPrompt() { var p = promptObj(); say(tx(p)); }

  function renderQ(langChange) {
    var q = R.qs[R.idx];
    if (R.mode === 'match') { renderBoard(false); return; }
    var p = promptObj();
    var pr = document.getElementById('qhe-prompt');
    pr.innerHTML =
      '<button type="button" class="qhe-say" data-act="say" aria-label="Read aloud">🔊</button>' +
      (p.badge || '') +
      '<div class="qhe-p1">' + esc(tx(p)) + '</div>' +
      '<div class="qhe-p2">' + esc(txOther(p)) + '</div>' +
      (p.sub && data.digital ? '<div class="qhe-p3">' + esc(tx(p.sub)) + '</div>' : '');
    if (!langChange || !R.answered) {
      document.getElementById('qhe-ctl').innerHTML = R.M.controls(q) + tipFor(q);
      if (!R.answered) document.getElementById('qhe-fb').innerHTML = '';
    }
    if (langChange && R.mode === 'calendar') renderCalVisual(q, R.answered ? (R.lastOk ? 'good' : 'bad') : null, R.lastChosen);
    if (langChange && R.mode === 'day') {
      var cap = $('.qhe-scene-cap');
      if (cap) cap.innerHTML = '<b>' + esc(tx(q.r)) + '</b><span>' + esc(txOther(q.r)) + '</span>';
    }
    if (langChange && R.answered) showFeedback(R.lastOk, true);
  }

  // A short strategy tip under the controls (never the answer itself).
  function tipFor(q) {
    var info = D.levelInfo(R.mode, R.lvl), t = null;
    if (R.mode === 'set' || R.mode === 'day') t = bi('Drag the long minute hand — the short hour hand follows, like real clock gears.', 'Mueve el minutero largo: el horario corto lo sigue, como los engranajes de un reloj.');
    else if (R.mode === 'read') t = bi('Short hand = hour. Long hand = minutes.', 'Manecilla corta = hora. Manecilla larga = minutos.');
    else if (R.mode === 'howlong') t = q.kind === 'end'
      ? bi('Every full turn of the minute hand is 1 hour. Half a turn is 30 minutes.', 'Cada vuelta completa del minutero es 1 hora. Media vuelta son 30 minutos.')
      : bi('Count from the start to the end: hours first, then the minutes.', 'Cuenta desde el inicio hasta el final: primero las horas, luego los minutos.');
    else if (R.mode === 'calendar' && R.lvl === 'cal2') t = bi('In Chile: summer Dec–Feb, autumn Mar–May, winter Jun–Aug, spring Sep–Nov.', 'En Chile: verano dic–feb, otoño mar–may, invierno jun–ago, primavera sep–nov.');
    else if (R.mode === 'calendar' && R.lvl === 'cal3') t = bi('Chilean calendars start the week on Monday. Sundays are in red.', 'Los calendarios chilenos empiezan la semana el lunes. Los domingos van en rojo.');
    else if (R.mode === 'puzzles' && R.lvl === 'zones') t = bi('The Sun rises in the east. Spain is far to the east of Chile, so its clocks are several hours ahead.', 'El sol sale por el este. España está muy al este de Chile, por eso sus relojes van varias horas adelantados.');
    else if (R.mode === 'puzzles') t = bi('a.m. = midnight to midday. p.m. = midday to midnight.', 'a.m. = de medianoche a mediodía. p.m. = de mediodía a medianoche.');
    if (!t) return '';
    var lv = info.hint ? ' <b>' + esc(tx(info.hint)) + '.</b>' : '';
    return '<div class="qhe-tip small">💡 ' + esc(tx(t)) + (R.mode === 'set' || R.mode === 'read' ? lv : '') + '</div>';
  }

  function onKey(e) {
    if (!R || R.answered) {
      var ae = document.activeElement;
      if (R && R.answered && e.key === 'Enter' && !(ae && ae.tagName === 'BUTTON')) { var nb = $('[data-act="next"]'); if (nb) { e.preventDefault(); nb.click(); } }
      return;
    }
    var q = R.qs[R.idx];
    if (q && q.typed) {
      if (/^[0-9]$/.test(e.key)) { kpPress(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { kpDel(); e.preventDefault(); }
      else if (e.key === 'Enter') { kpOk(); e.preventDefault(); }
    }
  }
  function kpPress(k) {
    if (R.answered || R.typed.length >= 4) return;
    R.typed += k; sfx('click');
    var o = document.getElementById('qhe-kp-out'); if (o) o.innerHTML = fmtTyped(R.typed);
  }
  function kpDel() {
    R.typed = R.typed.slice(0, -1);
    var o = document.getElementById('qhe-kp-out'); if (o) o.innerHTML = fmtTyped(R.typed);
  }
  function kpOk() {
    var q = R.qs[R.idx], res = R.M.checkTyped(q, R.typed);
    if (res === null) {
      var o = document.getElementById('qhe-kp-out');
      if (o) { o.classList.remove('shake'); void o.offsetWidth; o.classList.add('shake'); }
      return;
    }
    judge(res);
  }

  function judge(ok, chosen) {
    if (R.answered) return;
    var q = R.qs[R.idx];
    if (!ok && R.M.retry && tier === 'beginner' && R.tries === 0) {
      R.tries = 1;
      sfx('wrong');
      if (R.clock) R.clock.flash('bad');
      var info = D.levelInfo(R.mode, R.lvl);
      var hint = info.hint || bi('Look at the short hand first.', 'Mira primero la manecilla corta.');
      document.getElementById('qhe-fb').innerHTML = '<div class="qhe-fb-box try"><b>' + esc(lang === 'es' ? '¡Casi! Inténtalo otra vez.' : 'Almost! Try once more.') + '</b><span>' + esc(tx(hint)) + '</span></div>';
      if (chosen != null) { var b = root().querySelectorAll('.qhe-opt')[chosen]; if (b) { b.classList.add('wrong'); b.disabled = true; } }
      say(lang === 'es' ? '¡Casi! Inténtalo otra vez.' : 'Almost! Try once more.');
      return;
    }
    R.answered = true; R.lastOk = ok; R.lastChosen = chosen;
    R.results = R.results || [];
    R.results[R.idx] = ok;
    if (ok) { R.score++; sfx('correct'); if (R.clock) R.clock.flash('good'); }
    else { sfx('wrong'); if (R.clock) R.clock.flash('bad'); }
    renderDots();
    if (R.clock) R.clock.setOptions({ interactive: false });
    var done = function() {};
    if (ok) {
      if (R.M.after) R.M.after(q, done);
      else if (R.mode === 'howlong') R.M.reveal(q, done, ok);
      else if (R.M.reveal && (R.mode === 'read' || R.mode === 'calendar' || R.mode === 'puzzles')) R.M.reveal(q, done, ok, chosen);
    } else {
      R.M.reveal(q, done, ok, chosen);
    }
    R.goodMsg = null;
    showFeedback(ok, false);
    if (ok) say(tx(R.goodMsg) + ' ' + tx(R.M.answerText(q)));
    else say(tx(R.M.answerText(q)));
  }

  function showFeedback(ok, quiet) {
    var q = R.qs[R.idx];
    var ans = R.M.answerText(q);
    var last = R.idx >= R.total - 1;
    var clockQ = R.clock && (R.mode === 'set' || R.mode === 'read' || R.mode === 'day' || R.mode === 'howlong');
    var head = ok ? (R.goodMsg && quiet ? R.goodMsg : (R.goodMsg = pick(GOOD))) : (clockQ
      ? bi('Not quite — watch the hands.', 'Casi — mira las manecillas.')
      : bi('Not quite — here is the answer.', 'Casi — esta es la respuesta.'));
    document.getElementById('qhe-fb').innerHTML =
      '<div class="qhe-fb-box ' + (ok ? 'good' : 'miss') + '">' +
        '<b>' + (ok ? '✅ ' : '💡 ') + esc(tx(head)) + '</b>' +
        '<span>' + esc(tx(ans)) + '</span>' +
        (txOther(ans) !== tx(ans) ? '<span class="alt">' + esc(txOther(ans)) + '</span>' : '') +
        '<button type="button" class="qhe-btn primary" data-act="next">' + (last ? (lang === 'es' ? 'Ver estrellas ★' : 'See stars ★') : (lang === 'es' ? 'Siguiente ▶' : 'Next ▶')) + '</button>' +
      '</div>';
    if (!quiet) {
      var fbEl = document.getElementById('qhe-fb');
      if (fbEl && fbEl.scrollIntoView) later(function() { try { fbEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }, 250);
    }
    if (!quiet && R.mode !== 'set' && R.mode !== 'day') {
      // keep focus near the action for keyboard users
      var nb = $('[data-act="next"]'); if (nb && document.activeElement && document.activeElement.classList.contains('qhe-opt')) nb.focus();
    }
  }

  function next() {
    hush();
    if (R.idx >= R.total - 1) return finish();
    R.idx++;
    renderDots();
    beginQ(false);
  }

  // ---- Match board -------------------------------------------------
  function renderBoard(fresh) {
    var b = R.qs[R.board || 0];
    if (fresh) { R.board = R.board || 0; R.sel = null; R.matched = {}; R.boardMiss = 0; }
    var box = document.getElementById('qhe-board');
    var pr = document.getElementById('qhe-prompt');
    pr.innerHTML = '<button type="button" class="qhe-say" data-act="say" aria-label="Read aloud">🔊</button>' +
      '<div class="qhe-p1">' + esc(lang === 'es' ? 'Une cada reloj con su hora.' : 'Match each clock to its time.') + '</div>' +
      '<div class="qhe-p2">' + esc(lang === 'es' ? 'Match each clock to its time.' : 'Une cada reloj con su hora.') + '</div>';
    R.M.prompt = function() { return bi('Match each clock to its time.', 'Une cada reloj con su hora.'); };
    if (!fresh && box.querySelector('canvas')) {
      // language change: only the word cards change
      var cards = box.querySelectorAll('.qhe-mcard');
      for (var i = 0; i < cards.length; i++) cards[i].querySelector('span').textContent = cardLabel(b, +cards[i].getAttribute('data-i'));
      return;
    }
    view.clocks.forEach(function(c) { c.destroy(); });
    view.clocks = [];
    var w = box.clientWidth || 340;
    var per = w < 420 ? 3 : 5;
    var size = Math.max(84, Math.min(130, Math.floor((w - (per - 1) * 10) / per) - 14));
    box.innerHTML =
      '<div class="qhe-mclocks">' + b.times.map(function(t, i) {
        return '<button type="button" class="qhe-mclock" data-act="mL" data-i="' + i + '" aria-label="Clock ' + (i + 1) + '"><canvas></canvas><i class="qhe-pin"></i></button>';
      }).join('') + '</div>' +
      '<div class="qhe-mcards">' + b.order.map(function(i) {
        return '<button type="button" class="qhe-mcard ' + b.kind + '" data-act="mR" data-i="' + i + '"><span>' + esc(cardLabel(b, i)) + '</span><i class="qhe-pin"></i></button>';
      }).join('') + '</div>';
    var cvs = box.querySelectorAll('.qhe-mclock canvas');
    for (var j = 0; j < cvs.length; j++) {
      view.clocks.push(A.createClock(cvs[j], { size: size, time: b.times[j], helper: !!data.helper, lang: lang, brand: false, label: 'Clock ' + (j + 1) }));
    }
    document.getElementById('qhe-ctl').innerHTML = '';
    document.getElementById('qhe-fb').innerHTML = '';
  }
  function cardLabel(b, i) { return b.kind === 'words' ? tx(phrase(b.times[i])) : D.digital12(b.times[i]); }
  var PAIR_COLORS = ['#2563EB', '#DB2777', '#059669', '#D97706', '#7C3AED'];
  function matchTap(side, i) {
    var el = root().querySelector('[data-act="m' + side + '"][data-i="' + i + '"]');
    if (!el || el.classList.contains('done')) return;
    sfx('click');
    if (!R.sel || R.sel.side === side) {
      root().querySelectorAll('.qhe-mclock.sel, .qhe-mcard.sel').forEach(function(x) { x.classList.remove('sel'); });
      R.sel = { side: side, i: i };
      el.classList.add('sel');
      if (side === 'R') say(el.textContent);
      return;
    }
    var other = root().querySelector('[data-act="m' + R.sel.side + '"][data-i="' + R.sel.i + '"]');
    if (R.sel.i === i) {
      var n = Object.keys(R.matched).length;
      R.matched[i] = true;
      var col = PAIR_COLORS[n % PAIR_COLORS.length];
      [el, other].forEach(function(x) { x.classList.remove('sel'); x.classList.add('done'); x.style.setProperty('--pair', col); x.disabled = true; });
      R.results = R.results || [];
      var okFirst = !R.pairMiss || !R.pairMiss[R.board + ':' + i];
      R.results[R.idx] = okFirst;
      if (okFirst) R.score++;
      R.idx++;
      sfx('correct');
      renderDots();
      var b = R.qs[R.board];
      if (Object.keys(R.matched).length === b.times.length) {
        if (R.board >= R.qs.length - 1) {
          later(finish, 900);
        } else {
          document.getElementById('qhe-fb').innerHTML = '<div class="qhe-fb-box good"><b>✅ ' + esc(tx(pick(GOOD))) + '</b>' +
            '<button type="button" class="qhe-btn primary" data-act="nextBoard">' + (lang === 'es' ? 'Siguiente ▶' : 'Next ▶') + '</button></div>';
        }
      }
    } else {
      R.pairMiss = R.pairMiss || {};
      R.pairMiss[R.board + ':' + (side === 'L' ? i : R.sel.i)] = true;
      sfx('wrong');
      [el, other].forEach(function(x) { x.classList.remove('sel'); x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); });
    }
    R.sel = null;
  }
  function nextBoard() {
    R.board++;
    R.sel = null; R.matched = {};
    renderBoard(true);
  }

  // ---- results -----------------------------------------------------
  function finish() {
    hush();
    var stars = starsFor(R.score, R.total);
    data.levels = data.levels || {};
    var prev = data.levels[R.key] || {};
    var rec = {
      stars: Math.max(prev.stars || 0, stars),
      best: Math.max(prev.best || 0, R.score),
      of: R.total,
      plays: (prev.plays || 0) + 1,
      last: today()
    };
    data.levels[R.key] = rec;
    data.rounds = (data.rounds || 0) + 1;
    _save();
    var m = D.modeById(R.mode), info = D.levelInfo(R.mode, R.lvl);
    if (typeof ActivityLog !== 'undefined') {
      try { ActivityLog.log(APP_NAME, '🕰️', m.en + ' · ' + info.en + ' — ' + R.score + '/' + R.total + ' (' + stars + '★)'); } catch (e) {}
    }
    var idx = m.levels.indexOf(R.lvl), nextLvl = m.levels[idx + 1];
    var msg = stars === 3 ? bi('Brilliant timekeeping!', '¡Excelente con la hora!')
      : stars === 2 ? bi('Great work — nearly perfect!', '¡Muy buen trabajo, casi perfecto!')
      : stars === 1 ? bi('Good start — practice makes perfect.', 'Buen comienzo. ¡La práctica hace al maestro!')
      : bi('Keep practising — you will get there!', '¡Sigue practicando, lo lograrás!');
    teardown();
    var mode = R.mode, lvl = R.lvl, score = R.score, total = R.total;
    root().innerHTML =
      '<div class="qhe-done">' +
        topBar(m.icon + ' ' + (lang === 'es' ? m.es : m.en), 'mode:' + mode) +
        '<div class="qhe-done-card">' +
          '<canvas class="qhe-confetti" id="qhe-confetti" aria-hidden="true"></canvas>' +
          '<div class="qhe-done-level">' + esc(tx(info)) + ' <small>· ' + esc(txOther(info)) + '</small></div>' +
          '<div class="qhe-bigstars">' + [0, 1, 2].map(function(i) {
            return '<svg class="qhe-bigstar' + (i < stars ? ' on' : '') + '" style="animation-delay:' + (0.25 + i * 0.25) + 's" viewBox="0 0 100 100" aria-hidden="true">' +
              '<defs><linearGradient id="qbs' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset="0.5" stop-color="#f6c33b"/><stop offset="1" stop-color="#d48a0c"/></linearGradient></defs>' +
              '<path d="M50 6 L62 37 L95 38 L69 58 L78 91 L50 72 L22 91 L31 58 L5 38 L38 37Z" fill="' + (i < stars ? 'url(#qbs' + i + ')' : '#e7e2d6') + '" stroke="' + (i < stars ? '#b7740a' : '#cfc8b8') + '" stroke-width="3" stroke-linejoin="round"/>' +
              (i < stars ? '<path d="M50 14 L58 37 L40 38Z" fill="#fff" opacity="0.5"/>' : '') + '</svg>';
          }).join('') + '</div>' +
          '<div class="qhe-done-score">' + score + ' / ' + total + '</div>' +
          '<p class="qhe-done-msg">' + esc(tx(msg)) + '<span>' + esc(txOther(msg)) + '</span></p>' +
          '<div class="qhe-row center">' +
            '<button type="button" class="qhe-btn" data-act="start" data-m="' + mode + '" data-l="' + lvl + '">🔁 ' + (lang === 'es' ? 'Otra vez' : 'Play again') + '</button>' +
            (nextLvl ? '<button type="button" class="qhe-btn primary" data-act="start" data-m="' + mode + '" data-l="' + nextLvl + '">' + (lang === 'es' ? 'Siguiente nivel ▶' : 'Next level ▶') + '</button>' : '') +
            '<button type="button" class="qhe-btn" data-act="back" data-v="mode:' + mode + '">' + (lang === 'es' ? 'Niveles' : 'Levels') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (stars >= 2) { sfx('cheer'); confetti(document.getElementById('qhe-confetti')); }
    else sfx('star');
    say(tx(msg));
    R = null;
  }

  function confetti(cv) {
    if (!cv) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth || 300, h = cv.clientHeight || 300;
    cv.width = w * dpr; cv.height = h * dpr;
    var x = cv.getContext('2d'); x.scale(dpr, dpr);
    var cols = ['#f6c33b', '#2563eb', '#dc2626', '#16a34a', '#db2777', '#f97316'];
    var bits = [];
    for (var i = 0; i < 90; i++) bits.push({ x: w / 2 + (Math.random() - 0.5) * 60, y: h * 0.35, vx: (Math.random() - 0.5) * 9, vy: -4 - Math.random() * 7,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: pick(cols), s: 4 + Math.random() * 5 });
    var t0 = performance.now();
    (function frame(now) {
      if (!cv.isConnected) return;
      var age2 = now - t0;
      x.clearRect(0, 0, w, h);
      bits.forEach(function(b) {
        b.vy += 0.22; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        x.save(); x.translate(b.x, b.y); x.rotate(b.r);
        x.globalAlpha = Math.max(0, 1 - age2 / 2800);
        x.fillStyle = b.c; x.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        x.restore();
      });
      if (age2 < 2800) requestAnimationFrame(frame);
    })(t0);
  }

  // =====================================================================
  // EVENTS
  // =====================================================================
  function onClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b || !root().contains(b) || b.disabled) return;
    var act = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    switch (act) {
      case 'lang': setLang(v); break;
      case 'helper': toggleHelper(); break;
      case 'digital': toggleDigital(); break;
      case 'explore': sfx('click'); explore(null); break;
      case 'mode': sfx('click'); openMode(v); break;
      case 'start': start(b.getAttribute('data-m'), b.getAttribute('data-l')); break;
      case 'back':
        sfx('click');
        if (v && v.indexOf('mode:') === 0) openMode(v.substr(5)); else home();
        break;
      case 'sayNow': var d = new Date(); say(tx(words(d.getHours() * 60 + d.getMinutes()))); break;
      case 'exNow': view.explore && view.explore.now(); break;
      case 'exRand': view.explore && view.explore.rand(); break;
      case 'exStep': view.explore && view.explore.step(); break;
      case 'exSay': view.explore && view.explore.say(); break;
      case 'say': if (R) sayPrompt(); break;
      case 'check': if (R && !R.answered) judge(R.M.check(R.qs[R.idx])); break;
      case 'opt': if (R && !R.answered) { var i = +b.getAttribute('data-i'); judge(R.M.checkOpt(R.qs[R.idx], i), i); } break;
      case 'kp': if (R) kpPress(v); break;
      case 'kpDel': if (R) kpDel(); break;
      case 'kpOk': if (R && !R.answered) kpOk(); break;
      case 'next': if (R) next(); break;
      case 'mL': if (R) matchTap('L', +b.getAttribute('data-i')); break;
      case 'mR': if (R) matchTap('R', +b.getAttribute('data-i')); break;
      case 'nextBoard': if (R) nextBoard(); break;
    }
  }
  // Calendar dates are SVG groups, not buttons.
  function onCalTap(e) {
    var g = e.target.closest && e.target.closest('.qc-tap');
    if (!g || !R || R.answered || R.mode !== 'calendar') return;
    var d = +g.getAttribute('data-d'), q = R.qs[R.idx];
    if (q.tap == null) return;
    judge(R.M.checkTap(q, d), d);
  }

  function init() {
    var wrap = root();
    if (!wrap) return;
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    age = user && user.age ? user.age : 7;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age) : 'intermediate';
    data = _load();
    if (data.lang !== 'en' && data.lang !== 'es') data.lang = 'en';
    if (typeof data.helper !== 'boolean') data.helper = tier === 'beginner';
    if (typeof data.digital !== 'boolean') data.digital = true;
    if (!data.levels || typeof data.levels !== 'object') data.levels = {};
    lang = data.lang;
    wrap.addEventListener('click', onClick);
    wrap.addEventListener('click', onCalTap);
    home();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    // Pure: how many stars a saved blob is worth (mirrors auth.js).
    starsOf: function(d) {
      var n = 0, L = (d && d.levels) || {};
      for (var k in L) n += Math.min(3, (L[k] && L[k].stars) || 0);
      return n;
    },
    home: home
  };
})();
