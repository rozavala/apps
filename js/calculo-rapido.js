/* ================================================================
   CÁLCULO RÁPIDO 🧮 — mental maths, estimation and engineering calculations
   (ages 5+; the Engineer's desk opens at 10). Four sections:
     1. Sprint    (Carrera)    60-second rounds that adapt to speed and accuracy
     2. Estimate  (Estima)     Fermi questions with a slider, scored by closeness
     3. Units     (Unidades)   metric / US, temperature, speed, money, time zones
     4. Engineer  (Ingeniería) area, volume, scale, rates, ratios, percent, speed, Ohm
   Per-kid progress at zs_calculo_<kid> (one JSON blob, fields only added):
     { v:1,
       sprint:{ level, mastered, best, plays, rounds:[{d,p,c,w,l}] },
       est:{ id: bestStars }, units:{ topic: bestStars }, eng:{ topic: solved },
       last:'YYYY-MM-DD' }
   Maths: calculo-rapido-engine / -units / -problems (no DOM, tested).
   Art: calculo-rapido-art.js · questions: calculo-rapido-data.js
   ================================================================ */

var Calculo = (function () {
  'use strict';

  var E = CalculoEngine, U = CalculoUnits, P = CalculoProblems, D = CalculoData, A = CalculoArt;
  var PREFIX = 'zs_calculo_';
  var ROUND_SECONDS = 60;
  var QUIZ_LEN = 5;

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function _load() {
    var key = _key(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    d.sprint = _obj(d.sprint);
    d.sprint.level = d.sprint.level | 0;
    d.sprint.mastered = d.sprint.mastered | 0;
    d.sprint.best = d.sprint.best | 0;
    d.sprint.plays = d.sprint.plays | 0;
    if (!Array.isArray(d.sprint.rounds)) d.sprint.rounds = [];
    d.est = _obj(d.est); d.units = _obj(d.units); d.eng = _obj(d.eng);
    d.v = 1;
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
  function $(sel, rootEl) { return (rootEl || document).querySelector(sel); }
  function $all(sel, rootEl) { return Array.prototype.slice.call((rootEl || document).querySelectorAll(sel)); }
  function root() { return document.getElementById('cr-wrap'); }
  function _sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }

  // The kid's language: 'es', 'en' or 'both' (Spanish first, English under it).
  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function isEs() { return lang() !== 'en'; }                 // number style: Spanish for es and both
  function bi(es, en) {
    var l = lang();
    return l === 'es' ? esc(es) : l === 'en' ? esc(en) : esc(es) + '<span class="cr-sub">' + esc(en) + '</span>';
  }
  function biO(o) { return bi(o.es, o.en); }                  // an {es,en} object
  function tx(es, en) { return lang() === 'en' ? en : es; }   // one language, for speech and labels
  function txO(o) { return tx(o.es, o.en); }
  function speakLang() { return lang() === 'en' ? 'en' : 'es'; }
  function unitText(u) { return !u ? '' : typeof u === 'string' ? u : txO(u); }
  function num(x) { return E.fmtNum(x, isEs()); }

  function starCount() { return typeof getAppStars === 'function' ? getAppStars('calculo', data) : 0; }
  function _refreshStars() {
    var el = document.getElementById('cr-total');
    if (el) el.textContent = starCount();
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }

  var seedBase = null, seedCount = 0;
  (function () {
    try { var s = new URLSearchParams(location.search).get('seed'); if (s !== null && /^\d{1,9}$/.test(s)) seedBase = parseInt(s, 10); } catch (e) {}
  })();
  // A fresh seed. With ?seed=N in the address every seed follows from N, so a
  // session can be replayed (the tests do).
  function nextSeed() {
    if (seedBase !== null) return seedBase * 1000 + (seedCount++);
    return (Math.random() * 4294967296) >>> 0;
  }

  var cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function leaveView() {
    cleanup.forEach(function (f) { try { f(); } catch (e) {} });
    cleanup = [];
  }

  var current = { view: 'home' };

  // ---------------------------------------------------------------
  // Shell: header + section tabs
  // ---------------------------------------------------------------
  var SECTIONS = [
    { id: 'sprint', icon: 'sprint', es: 'Carrera', en: 'Sprint' },
    { id: 'estimate', icon: 'target', es: 'Estima', en: 'Estimate' },
    { id: 'units', icon: 'convert', es: 'Unidades', en: 'Units' },
    { id: 'engineer', icon: 'ohm', es: 'Ingeniería', en: 'Engineer' }
  ];

  function shell(section, inner) {
    var tabs = SECTIONS.map(function (s) {
      return '<button type="button" class="cr-tab' + (s.id === section ? ' on' : '') + '" data-go="' + s.id + '"' + (s.id === section ? ' aria-current="page"' : '') + '>' +
        A.icon(s.icon, 28, 'cr-tab-ic') + '<span class="cr-tab-t">' + bi(s.es, s.en) + '</span></button>';
    }).join('');
    return '<header class="cr-head">' +
        '<button type="button" class="cr-brand" data-go="home" aria-label="' + esc(tx('Cálculo Rápido, inicio', 'Cálculo Rápido home')) + '">' +
          '<span class="cr-brand-t">Cálculo Rápido</span></button>' +
        '<div class="cr-total" title="' + esc(tx('Estrellas', 'Stars')) + '">★ <span id="cr-total">' + starCount() + '</span></div>' +
      '</header>' +
      '<nav class="cr-tabs" aria-label="' + esc(tx('Secciones', 'Sections')) + '">' + tabs + '</nav>' +
      '<main class="cr-main" id="cr-main">' + inner + '</main>';
  }

  function render(section, inner, after) {
    leaveView();
    current.view = section;
    if (typeof ZsCanvas !== 'undefined') ZsCanvas.releaseIn(root());
    root().innerHTML = shell(section, inner);
    $all('[data-go]', root()).forEach(function (b) {
      b.addEventListener('click', function () { _sound('click'); go(b.getAttribute('data-go'), b.getAttribute('data-arg') || undefined); });
    });
    if (after) after(root());
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function go(where, arg) {
    switch (where) {
      case 'home': return viewHome();
      case 'sprint': return viewSprint();
      case 'estimate': return viewEstimateList();
      case 'ask': return viewAsk(arg);
      case 'units': return viewUnits();
      case 'topic': return viewTopic(arg);
      case 'quiz': return viewQuiz(arg);
      case 'engineer': return viewEngineer();
      case 'solve': return viewSolve(arg);
    }
    return viewHome();
  }

  // A back link and a title.
  function top(backTo, title, sub) {
    var arg = '';
    if (backTo && backTo.indexOf(':') > 0) { arg = ' data-arg="' + backTo.split(':')[1] + '"'; backTo = backTo.split(':')[0]; }
    return '<div class="cr-top">' + (backTo ? '<button type="button" class="cr-back" data-go="' + backTo + '"' + arg + ' aria-label="' + esc(tx('Volver', 'Back')) + '">←</button>' : '') +
      '<div><h1 class="cr-h1">' + title + '</h1>' + (sub ? '<p class="cr-lead">' + sub + '</p>' : '') + '</div></div>';
  }

  // ---------------------------------------------------------------
  // The scratchpad (optional): a small drawing canvas, freed when closed
  // ---------------------------------------------------------------
  function padButton() {
    return '<button type="button" class="cr-btn cr-btn-ghost cr-pad-btn" data-pad aria-expanded="false">' + A.icon('pencil', 22, 'cr-btn-ic') + '<span>' + bi('Borrador', 'Scratchpad') + '</span></button>' +
      '<div class="cr-pad-host" data-pad-host></div>';
  }

  function wirePad(scope) {
    var btn = $('[data-pad]', scope), host = $('[data-pad-host]', scope);
    if (!btn || !host) return;
    btn.addEventListener('click', function () {
      if (host.firstChild) { closePad(host); btn.setAttribute('aria-expanded', 'false'); return; }
      openPad(host);
      btn.setAttribute('aria-expanded', 'true');
    });
    onLeave(function () { closePad(host); });
  }

  function closePad(host) {
    if (typeof ZsCanvas !== 'undefined') ZsCanvas.releaseIn(host);
    host.innerHTML = '';
  }

  function openPad(host) {
    host.innerHTML = '<div class="cr-pad"><canvas class="cr-pad-canvas" aria-label="' + esc(tx('Borrador para dibujar', 'Scratchpad to draw on')) + '"></canvas>' +
      '<div class="cr-pad-tools">' +
        '<button type="button" class="cr-chip on" data-tool="pen">' + A.icon('pencil', 20, 'cr-btn-ic') + '<span>' + esc(tx('Lápiz', 'Pen')) + '</span></button>' +
        '<button type="button" class="cr-chip" data-tool="eraser">' + A.icon('eraser', 20, 'cr-btn-ic') + '<span>' + esc(tx('Goma', 'Eraser')) + '</span></button>' +
        '<button type="button" class="cr-chip" data-tool="clear">' + esc(tx('Borrar todo', 'Clear')) + '</button>' +
      '</div></div>';
    var c = $('canvas', host), pad = $('.cr-pad', host);
    var dpr = typeof ZsCanvas !== 'undefined' ? ZsCanvas.dpr() : 1;
    var w = Math.max(220, Math.round(pad.clientWidth || 300)), h = 190;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.height = h + 'px';
    var ctx = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(c) : c.getContext('2d');
    if (!ctx) { host.innerHTML = '<p class="cr-note">' + esc(tx('No hay memoria para el borrador. Usa papel y lápiz.', 'Not enough memory for the scratchpad. Use paper and pencil.')) + '</p>'; return; }
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var tool = 'pen', drawing = false, lx = 0, ly = 0;
    function pos(e) { var r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (w / r.width), (e.clientY - r.top) * (h / r.height)]; }
    c.addEventListener('pointerdown', function (e) {
      drawing = true; var p = pos(e); lx = p[0]; ly = p[1];
      try { c.setPointerCapture(e.pointerId); } catch (x) {}
      ctx.beginPath(); ctx.arc(lx, ly, tool === 'pen' ? 1.4 : 9, 0, 6.3); ctx.fillStyle = '#17324d';
      ctx.globalCompositeOperation = tool === 'pen' ? 'source-over' : 'destination-out'; ctx.fill();
      e.preventDefault();
    });
    c.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.globalCompositeOperation = tool === 'pen' ? 'source-over' : 'destination-out';
      ctx.strokeStyle = '#17324d'; ctx.lineWidth = tool === 'pen' ? 3 : 18;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p[0], p[1]); ctx.stroke();
      lx = p[0]; ly = p[1];
      e.preventDefault();
    });
    function up() { drawing = false; }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); c.addEventListener('pointerleave', up);
    $all('[data-tool]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-tool');
        if (t === 'clear') { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore(); return; }
        tool = t;
        $all('[data-tool]', host).forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }

  // ---------------------------------------------------------------
  // The number pad (Sprint and Engineer)
  // ---------------------------------------------------------------
  var K = { text: '', onSubmit: null, decimal: false };

  function keypad(decimal, withEnter) {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', decimal ? '.' : '⌫', '0', decimal ? '⌫' : (withEnter ? '✓' : '')];
    return '<div class="cr-keys" role="group" aria-label="' + esc(tx('Teclado de números', 'Number pad')) + '">' + keys.map(function (k) {
      if (!k) return '<span></span>';
      var lab = k === '⌫' ? tx('Borrar', 'Delete') : k === '✓' ? tx('Listo', 'Done') : k === '.' ? tx('Coma decimal', 'Decimal point') : k;
      return '<button type="button" class="cr-key' + (k === '✓' ? ' go' : '') + '" data-key="' + k + '" aria-label="' + esc(lab) + '">' + k + '</button>';
    }).join('') + '</div>';
  }

  function keyInput(k) {
    if (k === '⌫') K.text = K.text.slice(0, -1);
    else if (k === '✓') { if (K.onSubmit) K.onSubmit(); return; }
    else if (k === '.') { if (!K.decimal || K.text.indexOf('.') >= 0) return; K.text = (K.text || '0') + '.'; }
    else if (/^\d$/.test(k)) { if (K.text.replace('.', '').length >= 9) return; K.text = K.text === '0' ? k : K.text + k; }
    var el = document.getElementById('cr-entry');
    if (el) { el.textContent = K.text ? K.text.replace('.', isEs() ? ',' : '.') : '?'; el.classList.toggle('empty', !K.text); }
    if (K.onChange) K.onChange();
  }

  function wireKeys(scope, decimal, onChange, onSubmit) {
    K.text = ''; K.decimal = !!decimal; K.onSubmit = onSubmit; K.onChange = onChange;
    scope.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-key]') : null;
      if (!b || !scope.contains(b)) return;
      _sound('click');
      keyInput(b.getAttribute('data-key'));
    });
    function onKey(e) {
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) keyInput(e.key);
      else if (e.key === '.' || e.key === ',') keyInput('.');
      else if (e.key === 'Backspace') { keyInput('⌫'); e.preventDefault(); }
      else if (e.key === 'Enter') { if (K.onSubmit) { K.onSubmit(); e.preventDefault(); } }
    }
    document.addEventListener('keydown', onKey);
    onLeave(function () { document.removeEventListener('keydown', onKey); K.onSubmit = null; K.onChange = null; });
  }

  // ---------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------
  var LEARN = [
    { href: 'math-galaxy.html', name: 'Math Galaxy', icon: 'dots', es: 'Aprende las operaciones paso a paso', en: 'Learn the operations step by step' },
    { href: 'euclid-workshop.html', name: "Euclid's Workshop", icon: 'area', es: 'Geometría con compás y regla', en: 'Geometry with compass and straightedge' },
    { href: 'circuit-lab.html', name: 'Circuit Lab', icon: 'ohm', es: 'Construye circuitos y mira la ley de Ohm', en: 'Build circuits and see Ohm\'s law' },
    { href: 'little-engineer.html', name: 'Little Engineer', icon: 'volume', es: 'Puentes, fuerzas y escala', en: 'Bridges, forces and scale' }
  ];

  function viewHome() {
    var sp = data.sprint, level = levelNow();
    var cards = [
      { id: 'sprint', icon: 'sprint', es: 'Carrera de cálculo', en: 'Sprint',
        esD: '60 segundos de sumas, restas, multiplicaciones y divisiones.', enD: '60 seconds of adding, taking away, times and dividing.',
        stat: sp.best ? tx('Récord: ', 'Best: ') + sp.best + ' ★' : tx('Nivel ', 'Level ') + level },
      { id: 'estimate', icon: 'target', es: 'Estima', en: 'Estimate it',
        esD: '¿Cuántos litros hay en una tina? Mueve la barra y acércate.', enD: 'How many litres in a bathtub? Slide and get close.',
        stat: estimateDone() + ' / ' + estimateAllowed().length },
      { id: 'units', icon: 'convert', es: 'Unidades y conversiones', en: 'Units and conversions',
        esD: 'Millas y km, grados, dólares y pesos, y la hora en Santiago y California.', enD: 'Miles and km, degrees, dollars and pesos, and the time in Santiago and California.',
        stat: Object.keys(data.units).filter(function (k) { return data.units[k] > 0; }).length + ' / ' + U.TOPICS.length },
      { id: 'engineer', icon: 'ohm', es: 'Escritorio del ingeniero', en: 'Engineer\'s desk',
        esD: 'Áreas, volúmenes, escalas, tasas, porcentajes y la ley de Ohm.', enD: 'Areas, volumes, scales, rates, percentages and Ohm\'s law.',
        stat: engineerOpen() ? Object.keys(data.eng).filter(function (k) { return data.eng[k] > 0; }).length + ' / ' + P.TOPICS.length : tx('Desde los 10 años', 'From age 10') }
    ];
    var inner = '<div class="cr-homehero">' + A.hero() + '</div>' +
      '<p class="cr-lead cr-center">' + bi('Calcula como un ingeniero: rápido, estimando y con las unidades correctas.', 'Calculate like an engineer: fast, by estimating, and with the right units.') + '</p>' +
      '<p class="cr-center"><span class="cr-mystars">★ ' + starCount() + ' ' + esc(tx('estrellas aquí', 'stars here')) + '</span></p>' +
      '<div class="cr-cards">' + cards.map(function (c) {
        return '<button type="button" class="cr-card" data-go="' + c.id + '">' + A.icon(c.icon, 54, 'cr-card-ic') +
          '<span class="cr-card-body"><span class="cr-card-t">' + bi(c.es, c.en) + '</span><span class="cr-card-d">' + bi(c.esD, c.enD) + '</span></span>' +
          '<span class="cr-card-stat">' + esc(c.stat) + '</span></button>';
      }).join('') + '</div>' +
      '<section class="cr-learn" aria-labelledby="cr-learn-h"><h2 id="cr-learn-h" class="cr-h2">' + bi('¿Quieres aprender la idea primero?', 'Want to learn the idea first?') + '</h2><div class="cr-learn-row">' +
      LEARN.map(function (l) {
        return '<a class="cr-learn-a" href="' + l.href + '">' + A.icon(l.icon, 34, 'cr-learn-ic') + '<span><b>' + esc(l.name) + '</b><small>' + esc(tx(l.es, l.en)) + '</small></span></a>';
      }).join('') + '</div></section>';
    render('home', inner);
  }

  function engineerOpen() {
    if (age >= 10) return true;
    try { return sessionStorage.getItem('zs_calculo_pin_ok') === '1'; } catch (e) { return false; }
  }

  // ---------------------------------------------------------------
  // Sprint
  // ---------------------------------------------------------------
  var S = null;                                    // the round being played

  function levelNow() { return E.newAdapt(tier, data.sprint.level).level; }
  function beginnerLooks() { return tier === 'beginner'; }

  function viewSprint() {
    var sp = data.sprint, lvl = levelNow(), nm = E.LEVEL_NAMES[lvl];
    var chartLabels = { title: tx('Tus últimas carreras', 'Your latest sprints'), none: tx('Aún no hay carreras', 'No sprints yet'), best: tx('récord', 'best'), axis: tx('puntos por carrera', 'points per round') };
    var inner = top('home', bi('Carrera de cálculo', 'Sprint'),
        bi('60 segundos: contesta lo más que puedas. Cada respuesta vale su nivel en puntos.', '60 seconds: answer as many as you can. Each answer is worth its level in points.')) +
      '<section class="cr-panel cr-sprint-intro">' +
        '<div class="cr-level"><span class="cr-level-n">' + lvl + '</span><span class="cr-level-t"><b>' + bi('Nivel', 'Level') + '</b><small>' + bi(nm[0], nm[1]) + '</small></span></div>' +
        '<p class="cr-note">' + bi('El nivel sube solo cuando contestas rápido y bien, y baja si fallas dos seguidas.', 'The level goes up when you answer fast and right, and down after two misses in a row.') + '</p>' +
        (beginnerLooks() ? '<p class="cr-note">' + bi('Con dibujos y 🔊 para escuchar cada pregunta.', 'With pictures and 🔊 to hear each question.') + '</p>' : '') +
        '<button type="button" class="cr-btn cr-btn-big" id="cr-start">' + A.icon('sprint', 30, 'cr-btn-ic') + '<span>' + bi('¡Empezar! (60 s)', 'Start! (60 s)') + '</span></button>' +
      '</section>' +
      '<section class="cr-panel"><h2 class="cr-h2">' + bi('Tu récord', 'Your personal best') + '</h2>' +
        '<p class="cr-best">' + (sp.best ? '★ <b>' + sp.best + '</b> ' + bi('puntos', 'points') : bi('Juega una carrera para fijar tu primer récord.', 'Play a sprint to set your first record.')) + '</p>' +
        A.barChart(sp.rounds, E.personalBest(sp.rounds, sp.best), chartLabels) + '</section>';
    render('sprint', inner, function (scope) {
      $('#cr-start', scope).addEventListener('click', function () { _sound('click'); startRound(); });
    });
  }

  function startRound() {
    S = { r: E.rng(nextSeed()), ad: E.newAdapt(tier, data.sprint.level), answers: [], q: null, deadline: 0, qStart: 0, timer: null, locked: false, start: 0 };
    S.startLevel = S.ad.level;
    var inner = '<section class="cr-play" aria-label="' + esc(tx('Carrera', 'Sprint')) + '">' +
      '<div class="cr-hud"><div class="cr-time"><div class="cr-timebar"><i id="cr-timebar"></i></div><b id="cr-secs">' + ROUND_SECONDS + '</b></div>' +
      '<div class="cr-hud-r"><span class="cr-chip static" id="cr-lvl"></span><span class="cr-chip static ok" id="cr-got">✓ 0</span></div></div>' +
      '<div class="cr-qwrap" id="cr-qwrap" aria-live="polite"></div>' +
      '<div class="cr-flash" id="cr-flash" aria-hidden="true"></div>' +
      (beginnerLooks() ? '' : '<div class="cr-entry empty" id="cr-entry" aria-live="polite">?</div>' + keypad(false, true)) +
      '</section>';
    render('sprint', inner, function (scope) {
      if (!beginnerLooks()) {
        wireKeys($('.cr-play', scope), false, function () {
          // submit by itself once as many digits as the answer has
          if (S && S.q && !S.locked && K.text.length >= String(S.q.answer).length) submitTyped();
        }, submitTyped);
      }
      S.start = Date.now();
      S.deadline = S.start + ROUND_SECONDS * 1000;
      S.timer = setInterval(tickRound, 200);
      onLeave(function () { if (S && S.timer) clearInterval(S.timer); if (S && S.next) clearTimeout(S.next); S = null; });
      nextQuestion();
    });
  }

  function tickRound() {
    if (!S) return;
    var left = S.deadline - Date.now();
    if (left <= 0) { finishRound(); return; }
    var bar = document.getElementById('cr-timebar'), secs = document.getElementById('cr-secs');
    if (bar) bar.style.width = (100 * left / (ROUND_SECONDS * 1000)).toFixed(1) + '%';
    if (secs) secs.textContent = Math.ceil(left / 1000);
    if (bar) bar.parentNode.classList.toggle('low', left < 10000);
  }

  function nextQuestion() {
    if (!S) return;
    var prev = S.q ? S.q.text : '';
    S.q = E.nextQuestion(S.ad.level, S.r, prev);
    S.qStart = Date.now();
    S.locked = false;
    K.text = '';
    var q = S.q, wrap = document.getElementById('cr-qwrap'), lvl = document.getElementById('cr-lvl'), got = document.getElementById('cr-got');
    if (lvl) lvl.textContent = tx('Nivel ', 'Level ') + S.ad.level;
    if (got) got.textContent = '✓ ' + S.answers.filter(function (a) { return a.correct; }).length;
    var html = '<div class="cr-q-text" data-speak="' + esc(q.text.replace(/ = \?$/, '')) + '">' + esc(q.text) + '</div>';
    if (beginnerLooks()) {
      var ch = E.choicesFor(q.answer, S.r);
      html += '<div class="cr-dotswrap">' + (q.op === '+' || q.op === '-' ? A.dots(q) : '') + '</div>' +
        '<div class="cr-opts cr-opts-4">' + ch.map(function (v) {
          return '<button type="button" class="cr-opt" data-v="' + v + '">' + v + '</button>';
        }).join('') + '</div>';
    }
    wrap.innerHTML = html;
    var entry = document.getElementById('cr-entry');
    if (entry) { entry.textContent = '?'; entry.className = 'cr-entry empty'; }
    if (beginnerLooks()) {
      $all('.cr-opt', wrap).forEach(function (b) {
        b.addEventListener('click', function () { if (S && !S.locked) answerRound(parseInt(b.getAttribute('data-v'), 10), b); });
      });
    }
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.scan) { try { ZsSpeak.scan(); } catch (e) {} }
  }

  function submitTyped() {
    if (!S || S.locked || !S.q || K.text === '') return;
    answerRound(parseInt(K.text, 10));
  }

  function answerRound(val, btn) {
    if (!S || S.locked) return;
    S.locked = true;
    var q = S.q, ok = val === q.answer, ms = Date.now() - S.qStart;
    S.answers.push({ level: q.level, correct: ok, ms: ms, text: q.text, answer: q.answer, op: q.op });
    var change = E.adaptStep(S.ad, ok, ms);
    var flash = document.getElementById('cr-flash'), entry = document.getElementById('cr-entry');
    _sound(ok ? 'correct' : 'wrong');
    if (btn) btn.classList.add(ok ? 'right' : 'wrong');
    if (entry) entry.classList.add(ok ? 'right' : 'wrong');
    if (!ok) {
      var cor = $('.cr-opt[data-v="' + q.answer + '"]', root());
      if (cor) cor.classList.add('right');
      if (entry) entry.textContent = String(q.answer);
    }
    if (flash) {
      flash.textContent = change > 0 ? '⬆ ' + tx('¡Nivel ', 'Level ') + S.ad.level + '!' : change < 0 ? '⬇ ' + tx('Nivel ', 'Level ') + S.ad.level : (ok ? '' : q.text.replace('?', q.answer));
      flash.className = 'cr-flash show' + (change > 0 ? ' up' : ok ? '' : ' miss');
    }
    S.next = setTimeout(function () {
      if (flash) flash.className = 'cr-flash';
      if (S) nextQuestion();
    }, ok ? 140 : 800);
  }

  function finishRound() {
    if (!S) return;
    clearInterval(S.timer);
    if (S.next) clearTimeout(S.next);
    var round = S, sum = E.summarizeRound(round.answers), sp = data.sprint;
    var starsBefore = starCount(), prevBest = E.personalBest(sp.rounds, sp.best);
    var played = round.answers.length > 0;
    if (played) {
      sp.rounds = E.pushRound(sp.rounds, { d: _today(), p: sum.points, c: sum.right, w: sum.wrong, l: round.ad.level });
      sp.plays++;
      sp.level = round.ad.level;
      sp.mastered = Math.max(sp.mastered, Math.min(E.MAX_LEVEL, round.ad.mastered));
      if (sum.points > sp.best) sp.best = sum.points;
      _save();
      logActivity('⚡', tx('Carrera', 'Sprint') + ': ' + sum.right + ' ✓ · ' + sum.points + ' ' + tx('puntos', 'points'));
      feedReview(round);
    }
    S = null;
    var isRecord = played && sum.points > prevBest && prevBest > 0, first = played && prevBest === 0 && sum.points > 0;
    var newStar = starCount() > starsBefore;
    if (isRecord || newStar) _sound('cheer'); else if (played) _sound('star');
    _refreshStars();
    var missed = [], seen = {};
    round.answers.forEach(function (a) { if (!a.correct && !seen[a.text]) { seen[a.text] = 1; missed.push(a); } });
    var chartLabels = { title: tx('Tus últimas carreras', 'Your latest sprints'), none: '', best: tx('récord', 'best'), axis: tx('puntos por carrera', 'points per round') };
    var inner = top('', bi('¡Tiempo!', 'Time!')) +
      '<section class="cr-panel cr-result" aria-live="polite">' +
        (isRecord ? '<div class="cr-badge">🏆 ' + bi('¡Nuevo récord!', 'New personal best!') + '</div>' : first ? '<div class="cr-badge">★ ' + bi('¡Tu primer récord!', 'Your first record!') + '</div>' : '') +
        '<div class="cr-bignum" id="cr-score">' + sum.points + '</div><div class="cr-bigcap">' + bi('puntos', 'points') + '</div>' +
        '<p class="cr-stats"><b id="cr-right">' + sum.right + '</b> ' + bi('correctas', 'right') + ' · <b>' + sum.wrong + '</b> ' + bi('por repasar', 'to practise') + ' · ' + sum.accuracy + ' % · ' + tx('Nivel ', 'Level ') + round.ad.level + '</p>' +
        (newStar ? '<p class="cr-star-note">⭐ ' + bi('¡Ganaste una estrella!', 'You earned a star!') + '</p>' : '') +
        (prevBest > 0 && !isRecord ? '<p class="cr-note">' + bi('Tu récord: ', 'Your best: ') + prevBest + '</p>' : '') +
        A.barChart(sp.rounds, E.personalBest(sp.rounds, sp.best), chartLabels) +
        (missed.length ? '<h2 class="cr-h2">' + bi('Para repasar', 'To practise') + '</h2><ul class="cr-missed">' + missed.slice(0, 6).map(function (a) {
          return '<li>' + esc(a.text.replace('?', a.answer)) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-again">' + bi('Otra carrera', 'Another sprint') + '</button>' +
        '<button type="button" class="cr-btn cr-btn-ghost" data-go="home">' + bi('Inicio', 'Home') + '</button></div>' +
      '</section>';
    render('sprint', inner, function (scope) {
      $('#cr-again', scope).addEventListener('click', function () { _sound('click'); startRound(); });
    });
  }

  // Missed facts go to the daily review (Repaso); facts already there that were
  // answered right this round move up its schedule.
  function feedReview(round) {
    if (typeof Review === 'undefined') return;
    var misses = 0, done = {};
    round.answers.forEach(function (a) {
      var prompt = a.text, ans = String(a.answer), id = Review.idFor('calculo', prompt, ans);
      if (done[id]) return;
      done[id] = 1;
      try {
        if (a.correct) { if (Review.get(null, id)) Review.hit(null, id); }
        else if (misses < 3) {
          misses++;
          Review.add(null, { app: 'calculo', prompt: prompt, answer: ans, choices: E.numericChoices(a.answer, prompt).map(String) });
        }
      } catch (e) {}
    });
  }

  function logActivity(icon, text) {
    try { if (typeof ActivityLog !== 'undefined') ActivityLog.log('Cálculo Rápido', icon, text); } catch (e) {}
  }

  // ---------------------------------------------------------------
  // Estimate it
  // ---------------------------------------------------------------
  function estimateAllowed() {
    var maxTier = tier === 'beginner' ? 1 : tier === 'intermediate' ? 2 : 3;
    return D.ESTIMATES.filter(function (q) { return q.tier <= maxTier; });
  }
  function estimateDone() { return estimateAllowed().filter(function (q) { return (data.est[q.id] | 0) >= 2; }).length; }
  function estimateById(id) { for (var i = 0; i < D.ESTIMATES.length; i++) if (D.ESTIMATES[i].id === id) return D.ESTIMATES[i]; return null; }

  function viewEstimateList() {
    var list = estimateAllowed();
    var inner = top('home', bi('Estima', 'Estimate it'),
        bi('Nadie sabe la respuesta exacta de memoria. Piensa, compara y mueve la barra: ¡acércate!', 'Nobody knows the exact answer by heart. Think, compare and slide: get close!')) +
      '<div class="cr-grid">' + list.map(function (q) {
        var st = data.est[q.id] | 0;
        return '<button type="button" class="cr-tile" data-ask="' + q.id + '">' + A.icon(q.icon, 40, 'cr-tile-ic') +
          '<span class="cr-tile-t">' + biO(q.q) + '</span>' + A.stars(st) + '</button>';
      }).join('') + '</div>' +
      '<div class="cr-actions"><button type="button" class="cr-btn" id="cr-surprise">' + A.icon('dots', 24, 'cr-btn-ic') + '<span>' + bi('Sorpresa', 'Surprise me') + '</span></button></div>' +
      '<p class="cr-note">' + bi('3 estrellas si te acercas hasta la mitad más o menos; 2 si estás entre la mitad y el doble; 1 si estás dentro de 4 veces.', '3 stars if you land within half again of the answer; 2 within double or half; 1 within four times.') + '</p>';
    render('estimate', inner, function (scope) {
      $all('[data-ask]', scope).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); go('ask', b.getAttribute('data-ask')); }); });
      $('#cr-surprise', scope).addEventListener('click', function () {
        _sound('click');
        var pool = list.filter(function (q) { return (data.est[q.id] | 0) < 3; });
        if (!pool.length) pool = list;
        go('ask', E.rng(nextSeed()).pick(pool).id);
      });
    });
  }

  var EST = null;

  function viewAsk(id) {
    var q = estimateById(id);
    if (!q) return viewEstimateList();
    var mid = Math.round(E.SLIDER_STEPS / 2);
    EST = { q: q, pos: mid, guess: null };
    var inner = top('estimate', bi('Estima', 'Estimate it')) +
      '<section class="cr-panel cr-ask">' + A.icon(q.icon, 64, 'cr-ask-ic') +
        '<h2 class="cr-q-text" data-speak="' + esc(txO(q.q)) + '">' + biO(q.q) + '</h2>' +
        '<div class="cr-readout" aria-live="polite"><b id="cr-readout"></b> <span id="cr-ru">' + esc(unitText(q.unit)) + '</span></div>' +
        '<div class="cr-sliderrow"><button type="button" class="cr-step" id="cr-minus" aria-label="' + esc(tx('Menos', 'Less')) + '">−</button>' +
        '<input type="range" id="cr-slider" min="0" max="' + E.SLIDER_STEPS + '" step="1" value="' + mid + '" aria-label="' + esc(txO(q.q)) + '">' +
        '<button type="button" class="cr-step" id="cr-plus" aria-label="' + esc(tx('Más', 'More')) + '">+</button></div>' +
        '<div class="cr-sliderends"><span id="cr-lo">' + num(q.min) + '</span><span id="cr-hi">' + num(q.max) + '</span></div>' +
        '<details class="cr-hint"><summary>' + bi('Una pista', 'A hint') + '</summary><p>' + biO(q.hint) + '</p></details>' +
        '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-lock">' + bi('Elegir esta respuesta', 'Lock it in') + '</button></div>' +
        padButton() +
      '</section>';
    render('estimate', inner, function (scope) {
      var sl = $('#cr-slider', scope), out = $('#cr-readout', scope);
      function upd() { EST.pos = parseInt(sl.value, 10); EST.guess = E.sliderValue(EST.pos, q.min, q.max); out.textContent = num(EST.guess); }
      sl.addEventListener('input', upd);
      $('#cr-minus', scope).addEventListener('click', function () { sl.value = Math.max(0, parseInt(sl.value, 10) - 15); upd(); });
      $('#cr-plus', scope).addEventListener('click', function () { sl.value = Math.min(E.SLIDER_STEPS, parseInt(sl.value, 10) + 15); upd(); });
      $('#cr-lock', scope).addEventListener('click', function () { _sound('click'); upd(); lockEstimate(); });
      upd();
      wirePad(scope);
    });
  }

  function lockEstimate() {
    var q = EST.q, guess = EST.guess, stars = E.estimateStars(guess, q.truth), factor = E.estimateFactor(guess, q.truth);
    var before = starCount(), prev = data.est[q.id] | 0;
    if (stars > prev) data.est[q.id] = stars;
    _save();
    logActivity('🎯', txO(q.q) + ' — ' + stars + '★');
    var newStar = starCount() > before;
    _refreshStars();
    _sound(stars >= 2 ? 'cheer' : stars === 1 ? 'correct' : 'wrong');
    var verdict = stars === 3 ? bi('¡Casi exacto!', 'Nearly spot on!') : stars === 2 ? bi('¡Muy cerca!', 'Very close!') : stars === 1 ? bi('Estás en el barrio.', 'In the neighbourhood.') : bi('Lejos esta vez: mira cómo se calcula.', 'Far off this time: see how it works out.');
    var how = guess === q.truth ? bi('Justo.', 'Exactly.') : guess > q.truth ? bi(num(E.round(factor, 1)) + ' veces más grande que la referencia.', num(E.round(factor, 1)) + ' times bigger than the reference.')
                                                                                  : bi(num(E.round(factor, 1)) + ' veces más chica que la referencia.', num(E.round(factor, 1)) + ' times smaller than the reference.');
    var u = unitText(q.unit);
    var inner = top('estimate', bi('Estima', 'Estimate it')) +
      '<section class="cr-panel cr-answer" aria-live="polite">' + A.stars(stars) +
        '<h2 class="cr-verdict">' + verdict + '</h2>' +
        A.numberLine(q.min, q.max, guess, q.truth, isEs(), { truth: tx('Referencia', 'Reference'), guess: tx('Tú', 'You') }) +
        '<p class="cr-stats">' + tx('Tú', 'You') + ': <b>' + num(guess) + '</b> ' + esc(u) + ' · ' + tx('Referencia', 'Reference') + ': <b>' + num(q.truth) + '</b> ' + esc(u) + '</p>' +
        '<p class="cr-note">' + how + '</p>' +
        (newStar ? '<p class="cr-star-note">⭐ ' + bi('¡Ganaste una estrella!', 'You earned a star!') + '</p>' : '') +
        '<div class="cr-ref"><b>' + bi('De dónde sale', 'Where it comes from') + '</b><p>' + biO(q.ref) + '</p></div>' +
        '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-next">' + bi('Otra pregunta', 'Another question') + '</button>' +
        '<button type="button" class="cr-btn cr-btn-ghost" data-go="estimate">' + bi('Todas', 'All questions') + '</button></div>' +
      '</section>';
    render('estimate', inner, function (scope) {
      $('#cr-next', scope).addEventListener('click', function () {
        _sound('click');
        var pool = estimateAllowed().filter(function (x) { return x.id !== q.id && (data.est[x.id] | 0) < 3; });
        if (!pool.length) pool = estimateAllowed().filter(function (x) { return x.id !== q.id; });
        go('ask', E.rng(nextSeed()).pick(pool).id);
      });
    });
  }

  // ---------------------------------------------------------------
  // Units and conversions
  // ---------------------------------------------------------------
  function topicById(id) { for (var i = 0; i < U.TOPICS.length; i++) if (U.TOPICS[i].id === id) return U.TOPICS[i]; return null; }

  function viewUnits() {
    var inner = top('home', bi('Unidades y conversiones', 'Units and conversions'),
        bi('Tu familia vive entre dos sistemas: métrico y de EE. UU. Aprende a pasar de uno a otro.', 'Your family lives between two systems: metric and US. Learn to move from one to the other.')) +
      '<div class="cr-grid">' + U.TOPICS.map(function (t) {
        return '<button type="button" class="cr-tile" data-topic="' + t.id + '">' + A.icon(t.icon, 40, 'cr-tile-ic') + '<span class="cr-tile-t">' + bi(t.es, t.en) + '</span>' + A.stars(data.units[t.id] | 0) + '</button>';
      }).join('') + '</div>';
    render('units', inner, function (scope) {
      $all('[data-topic]', scope).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); go('topic', b.getAttribute('data-topic')); }); });
    });
  }

  var CV = null;

  function viewTopic(id) {
    var t = topicById(id);
    if (!t) return viewUnits();
    var inner = top('units', bi(t.es, t.en)) +
      '<div id="cr-conv"></div>' +
      '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-quizgo">' + A.icon('target', 28, 'cr-btn-ic') + '<span>' + bi('Prueba de 5 preguntas', '5-question quiz') + '</span></button></div>' +
      '<p class="cr-note">' + A.stars(data.units[id] | 0) + '</p>';
    render('units', inner, function (scope) {
      $('#cr-quizgo', scope).addEventListener('click', function () { _sound('click'); go('quiz', id); });
      if (id === 'zones') zonesConverter($('#cr-conv', scope)); else converter($('#cr-conv', scope), id);
    });
  }

  function converter(host, topic) {
    var pairs = U.pairsOf(topic);
    CV = CV && CV.topic === topic ? CV : { topic: topic, pair: pairs[0], dir: 'xy', value: '10' };
    function draw() {
      var pr = CV.pair, from = CV.dir === 'xy' ? pr.x : pr.y, to = CV.dir === 'xy' ? pr.y : pr.x;
      var n = E.parseAnswer(CV.value), res = n === null ? null : E.round(U.convert(pr, n, CV.dir), 2);
      var vals = pr[CV.dir].vals;
      host.innerHTML = '<section class="cr-panel cr-conv">' +
        (pairs.length > 1 ? '<div class="cr-chips" role="group" aria-label="' + esc(tx('Elige la conversión', 'Pick a conversion')) + '">' + pairs.map(function (p) {
          return '<button type="button" class="cr-chip' + (p === pr ? ' on' : '') + '" data-pair="' + p.id + '">' + esc(U.sym(p.x) + ' ⇄ ' + U.sym(p.y)) + '</button>'; }).join('') + '</div>' : '') +
        (topic === 'money' ? '<div class="cr-warn" role="note"><b>' + bi('Valor aproximado, no el de hoy.', 'Approximate, not today\'s rate.') + '</b> ' + bi('Aquí usamos 1 USD = 950 CLP para practicar. Pídele a un adulto el valor del día.', 'Here we use 1 USD = 950 CLP for practice. Ask a grown-up for the rate of the day.') + '</div>' : '') +
        '<div class="cr-convrow">' +
          '<label class="cr-field"><span>' + esc(U.sym(from)) + '</span><input id="cr-cvin" type="text" inputmode="decimal" autocomplete="off" value="' + esc(CV.value) + '" aria-label="' + esc(tx('Número en ', 'Number in ') + U.sym(from)) + '"></label>' +
          '<button type="button" class="cr-swap" id="cr-swap" aria-label="' + esc(tx('Cambiar el sentido', 'Swap direction')) + '">⇄</button>' +
          '<div class="cr-field out"><span>' + esc(U.sym(to)) + '</span><output id="cr-cvout" aria-live="polite">' + (res === null ? '?' : num(res)) + '</output></div>' +
        '</div>' +
        '<p class="cr-rule"><b>' + esc(U.factText(pr, isEs())) + '</b></p>' +
        '<p class="cr-note">' + biO({ es: pr.thumb[0], en: pr.thumb[1] }) + '</p>' +
        '<div class="cr-table" role="table" aria-label="' + esc(tx('Ejemplos', 'Examples')) + '">' + vals.slice(0, 6).map(function (v) {
          return '<span role="row"><b>' + esc(U.withUnit(v, from, isEs())) + '</b> ≈ ' + esc(U.withUnit(E.round(U.convert(pr, v, CV.dir), pr[CV.dir].dec + 1), to, isEs())) + '</span>'; }).join('') + '</div>' +
        '<div class="cr-actions">' + padButton() + '</div>' +
      '</section>';
      $all('[data-pair]', host).forEach(function (b) { b.addEventListener('click', function () { CV.pair = U.pairById(b.getAttribute('data-pair')); CV.dir = 'xy'; CV.value = String(CV.pair.xy.vals[1]); draw(); }); });
      $('#cr-swap', host).addEventListener('click', function () { CV.dir = CV.dir === 'xy' ? 'yx' : 'xy'; CV.value = String(CV.pair[CV.dir].vals[1]); draw(); });
      var inp = $('#cr-cvin', host);
      inp.addEventListener('input', function () {
        CV.value = inp.value;
        var m = E.parseAnswer(inp.value);
        $('#cr-cvout', host).textContent = m === null ? '?' : num(E.round(U.convert(CV.pair, m, CV.dir), 2));
      });
      wirePad(host);
    }
    draw();
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function zonesConverter(host) {
    var now = new Date();
    var st = { from: 'LA', date: now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()), time: pad2(now.getHours()) + ':' + pad2(Math.floor(now.getMinutes() / 30) * 30) };
    function draw() {
      var dp = st.date.split('-').map(Number), tp = st.time.split(':').map(Number), to = st.from === 'LA' ? 'SCL' : 'LA', res = null;
      if (dp.length === 3 && tp.length === 2 && dp[0] >= 2023 && dp[0] <= 2099 && !dp.some(isNaN) && !tp.some(isNaN)) res = U.convertZone(st.from, to, dp[0], dp[1], dp[2], tp[0], tp[1]);
      var body;
      if (!res) {
        body = '<p class="cr-note">' + bi('Esa hora no existe o se repite por el cambio de hora. Prueba con otra.', 'That time does not exist, or happens twice, because of a clock change. Try another one.') + '</p>';
      } else {
        var f = res.from, tt = res.to, ahead = U.hoursAhead(res.utc), laT = st.from === 'LA' ? f : tt, sclT = st.from === 'LA' ? tt : f;
        body = '<div class="cr-clocks">' + A.clockFace(laT.hh, laT.mm, 'California') + A.clockFace(sclT.hh, sclT.mm, 'Santiago') + '</div>' +
          '<p class="cr-zoneans" id="cr-zoneans"><b>' + esc(U.fmtShort(tt, isEs())) + '</b> ' + esc(tx('en ', 'in ') + U.ZONES[to].short[isEs() ? 'es' : 'en']) + '</p>' +
          '<p class="cr-note">' + bi('Ese día Santiago va ' + ahead + ' horas adelante de California.', 'On that day Santiago is ' + ahead + ' hours ahead of California.') + '</p>' +
          '<ul class="cr-zonelist"><li>California: UTC' + (laT.off / 60) + ' ' + (laT.dst ? '(' + tx('hora de verano', 'daylight time') + ')' : '(' + tx('hora estándar', 'standard time') + ')') + '</li>' +
          '<li>Santiago: UTC' + (sclT.off / 60) + ' ' + (sclT.dst ? '(' + tx('hora de verano', 'summer time') + ')' : '(' + tx('hora de invierno', 'winter time') + ')') + '</li></ul>' +
          '<h3 class="cr-h3">' + bi('Horas de diferencia durante el año', 'Hours of difference through the year') + ' ' + dp[0] + '</h3>' + A.aheadChart(U.aheadByMonth(dp[0]), dp[1] - 1, isEs());
      }
      host.innerHTML = '<section class="cr-panel cr-conv">' +
        '<div class="cr-chips" role="group"><button type="button" class="cr-chip' + (st.from === 'LA' ? ' on' : '') + '" data-from="LA">' + esc(tx('Sé la hora de California', 'I know the California time')) + '</button>' +
        '<button type="button" class="cr-chip' + (st.from === 'SCL' ? ' on' : '') + '" data-from="SCL">' + esc(tx('Sé la hora de Santiago', 'I know the Santiago time')) + '</button></div>' +
        '<div class="cr-convrow cr-zonerow"><label class="cr-field"><span>' + esc(tx('Día', 'Date')) + '</span><input id="cr-zd" type="date" value="' + esc(st.date) + '" min="2023-01-01" max="2099-12-31"></label>' +
        '<label class="cr-field"><span>' + esc(tx('Hora', 'Time')) + '</span><input id="cr-zt" type="time" step="900" value="' + esc(st.time) + '"></label></div>' +
        '<div id="cr-zbody">' + body + '</div>' +
        '<p class="cr-note small">' + bi('Reglas de 2026. California cambia la hora el 2.º domingo de marzo y el 1.º de noviembre; Chile, el 1.º sábado de septiembre y el 1.º de abril. Los gobiernos pueden cambiarlas.', 'Rules as of 2026. California changes its clocks on the 2nd Sunday of March and the 1st of November; Chile on the 1st Saturday of September and April. Governments can change them.') + '</p>' +
      '</section>';
      $all('[data-from]', host).forEach(function (b) { b.addEventListener('click', function () { st.from = b.getAttribute('data-from'); draw(); }); });
      $('#cr-zd', host).addEventListener('change', function (e) { if (e.target.value) { st.date = e.target.value; draw(); } });
      $('#cr-zt', host).addEventListener('change', function (e) { if (e.target.value) { st.time = e.target.value; draw(); } });
    }
    draw();
  }

  // ── multiple-choice quiz (units and time zones) ──────────────
  var QZ = null;

  function viewQuiz(topic) {
    var base = nextSeed(), qs = [], seen = {};
    for (var i = 0; qs.length < QUIZ_LEN && i < 40; i++) {
      var q = U.question(topic, E.rng(base + i * 7919));
      if (q && !seen[q.text.en]) { seen[q.text.en] = 1; qs.push(q); }
    }
    QZ = { topic: topic, qs: qs, i: 0, right: 0, answered: false };
    quizQuestion();
  }

  function quizQuestion() {
    var z = QZ, q = z.qs[z.i], t = topicById(z.topic);
    z.answered = false;
    var inner = top('topic:' + z.topic, bi(t.es, t.en), (z.i + 1) + ' / ' + z.qs.length) +
      '<section class="cr-panel cr-quiz">' +
        (z.topic === 'zones' ? '' : '') +
        '<h2 class="cr-q-text" data-speak="' + esc(txO(q.text)) + '">' + biO(q.text) + '</h2>' +
        (q.note ? '<div class="cr-warn" role="note">' + biO(q.note) + '</div>' : '') +
        '<div class="cr-opts cr-opts-2">' + q.choices.map(function (c, k) {
          return '<button type="button" class="cr-opt" data-k="' + k + '">' + biO(c) + '</button>'; }).join('') + '</div>' +
        '<div id="cr-steps"></div>' +
        padButton() +
      '</section>';
    render('units', inner, function (scope) {
      $all('.cr-opt', scope).forEach(function (b) {
        b.addEventListener('click', function () { if (!z.answered) answerQuiz(parseInt(b.getAttribute('data-k'), 10), scope); });
      });
      wirePad(scope);
    });
  }

  function answerQuiz(k, scope) {
    var z = QZ, q = z.qs[z.i], ok = k === q.correct;
    z.answered = true;
    if (ok) z.right++;
    _sound(ok ? 'correct' : 'wrong');
    $all('.cr-opt', scope).forEach(function (b, i) { b.classList.add('locked'); if (i === q.correct) b.classList.add('right'); else if (i === k) b.classList.add('wrong'); });
    try {
      if (typeof Review !== 'undefined') {
        var it = U.reviewItem(q, isEs());
        if (ok) Review.hit(null, Review.idFor('calculo', it.prompt, it.answer));
        else Review.add(null, { app: 'calculo', prompt: it.prompt, answer: it.answer, choices: it.choices });
      }
    } catch (e) {}
    var last = z.i === z.qs.length - 1;
    $('#cr-steps', scope).innerHTML = '<div class="cr-worked ' + (ok ? 'ok' : 'no') + '" aria-live="polite"><h3 class="cr-h3">' + (ok ? bi('¡Correcto!', 'Correct!') : bi('Así se hace:', 'Here is how:')) + '</h3><ol>' +
      q.steps.map(function (s) { return '<li>' + biO(s) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-qnext">' + (last ? bi('Ver mi resultado', 'See my result') : bi('Siguiente', 'Next')) + '</button></div>';
    $('#cr-qnext', scope).addEventListener('click', function () {
      _sound('click');
      if (last) finishQuiz(); else { z.i++; quizQuestion(); }
    });
    try { $('#cr-qnext', scope).scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }

  function quizStars(right, total) { return right >= total ? 3 : right >= total - 1 ? 2 : right >= total - 2 ? 1 : 0; }

  function finishQuiz() {
    var z = QZ, t = topicById(z.topic), stars = quizStars(z.right, z.qs.length), before = starCount();
    if (stars > (data.units[z.topic] | 0)) data.units[z.topic] = stars;
    _save();
    logActivity('🔄', tx(t.es, t.en) + ': ' + z.right + ' / ' + z.qs.length);
    var newStar = starCount() > before;
    _refreshStars();
    _sound(stars >= 2 ? 'cheer' : 'star');
    var inner = top('units', bi(t.es, t.en)) +
      '<section class="cr-panel cr-result">' + A.stars(stars) +
        '<div class="cr-bignum">' + z.right + ' / ' + z.qs.length + '</div>' +
        (newStar ? '<p class="cr-star-note">⭐ ' + bi('¡Ganaste una estrella!', 'You earned a star!') + '</p>' : '') +
        '<p class="cr-note">' + bi('3 estrellas con todo bien, 2 con una falla, 1 con dos.', '3 stars for all right, 2 for one miss, 1 for two.') + '</p>' +
        '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-qagain">' + bi('Otra prueba', 'Another quiz') + '</button>' +
        '<button type="button" class="cr-btn cr-btn-ghost" data-go="units">' + bi('Todos los temas', 'All topics') + '</button></div>' +
      '</section>';
    render('units', inner, function (scope) {
      $('#cr-qagain', scope).addEventListener('click', function () { _sound('click'); go('quiz', z.topic); });
    });
  }

  // ---------------------------------------------------------------
  // Engineer's desk
  // ---------------------------------------------------------------
  function viewEngineer() {
    if (!engineerOpen()) {
      var lock = top('home', bi('Escritorio del ingeniero', 'Engineer\'s desk')) +
        '<section class="cr-panel cr-locked">' + A.icon('ohm', 72, 'cr-ask-ic') +
          '<p class="cr-lead">' + bi('El escritorio del ingeniero se abre a los 10 años. Mientras tanto, prueba la Carrera, Estima y Unidades.', 'The engineer\'s desk opens at age 10. Until then, try Sprint, Estimate and Units.') + '</p>' +
          '<div class="cr-actions"><button type="button" class="cr-btn" data-go="sprint">' + bi('Ir a la Carrera', 'Go to Sprint') + '</button>' +
          '<a class="cr-btn cr-btn-ghost" href="math-galaxy.html">Math Galaxy</a>' +
          '<button type="button" class="cr-btn cr-btn-ghost" id="cr-pin">' + bi('Abrir con un adulto', 'A grown-up can open it') + '</button></div>' +
        '</section>';
      return render('engineer', lock, function (scope) {
        $('#cr-pin', scope).addEventListener('click', function () {
          if (typeof ZsDialog === 'undefined') return;
          ZsDialog.prompt({ title: tx('Para adultos', 'Grown-ups'), message: tx('Escribe el PIN de un adulto para abrir los problemas de ingeniería.', 'Enter a parent PIN to open the engineer\'s problems.'),
            inputType: 'password', inputMode: 'numeric', placeholder: 'PIN', label: 'PIN', confirmLabel: 'OK', cancelLabel: tx('Cancelar', 'Cancel') }).then(function (v) {
            if (v == null) return;
            var pin = typeof getParentPin === 'function' ? getParentPin() : null;
            if (pin && String(v).trim() === String(pin)) { try { sessionStorage.setItem('zs_calculo_pin_ok', '1'); } catch (e) {} viewEngineer(); }
            else if (ZsDialog.toast) ZsDialog.toast(tx('PIN incorrecto', 'Wrong PIN'));
          });
        });
      });
    }
    var inner = top('home', bi('Escritorio del ingeniero', 'Engineer\'s desk'),
        bi('Problemas de verdad, con la solución paso a paso después de tu intento.', 'Real problems, with the worked solution after your attempt.')) +
      '<div class="cr-grid">' + P.TOPICS.map(function (t) {
        var n = data.eng[t.id] | 0;
        return '<button type="button" class="cr-tile" data-solve="' + t.id + '">' + A.icon(t.icon, 40, 'cr-tile-ic') + '<span class="cr-tile-t">' + bi(t.es, t.en) + '</span>' +
          A.stars(engStars(n)) + '<small class="cr-tile-n">' + n + ' ' + esc(tx('resueltos', 'solved')) + '</small></button>';
      }).join('') + '</div>' +
      '<p class="cr-note">' + bi('1 estrella con 1 problema resuelto, 2 con 3 y 3 con 6, en cada tema.', '1 star for 1 problem solved, 2 for 3 and 3 for 6, in each topic.') + '</p>';
    render('engineer', inner, function (scope) {
      $all('[data-solve]', scope).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); go('solve', b.getAttribute('data-solve')); }); });
    });
  }

  function engStars(n) { return n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0; }

  var PR = null;                                   // the problem on screen

  function viewSolve(topic) {
    var t = null;
    P.TOPICS.forEach(function (x) { if (x.id === topic) t = x; });
    if (!t) return viewEngineer();
    var seed = nextSeed(), pr = P.problem(topic, seed);
    PR = { topic: topic, seed: seed, p: pr, done: false, peeked: false, hinted: false, tries: 0 };
    var u = unitText(pr.unit);
    var inner = top('engineer', bi(t.es, t.en)) +
      '<section class="cr-panel cr-solve">' +
        '<div class="cr-diagram">' + A.diagram(pr.art, isEs()) + '</div>' +
        '<h2 class="cr-q-text" data-speak="' + esc(txO(pr.text)) + '">' + biO(pr.text) + '</h2>' +
        '<div class="cr-answerrow"><div class="cr-entry empty" id="cr-entry" aria-live="polite">?</div><span class="cr-unit">' + esc(u) + '</span></div>' +
        '<div id="cr-hintbox" class="cr-hintbox" hidden></div>' +
        keypad(true, false) +
        '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-check">' + bi('Comprobar', 'Check') + '</button>' +
        '<button type="button" class="cr-btn cr-btn-ghost" id="cr-hintbtn">' + bi('Pista', 'Hint') + '</button>' +
        '<button type="button" class="cr-btn cr-btn-ghost" id="cr-peek">' + bi('Ver los pasos', 'Show the steps') + '</button></div>' +
        padButton() +
        '<div id="cr-solution"></div>' +
      '</section>';
    render('engineer', inner, function (scope) {
      wireKeys($('.cr-solve', scope), true, null, checkSolve);
      $('#cr-check', scope).addEventListener('click', function () { _sound('click'); checkSolve(); });
      $('#cr-hintbtn', scope).addEventListener('click', function () {
        _sound('click'); PR.hinted = true;
        var hb = $('#cr-hintbox', scope); hb.hidden = false; hb.innerHTML = '<b>' + bi('Pista:', 'Hint:') + '</b> ' + biO(pr.hint);
      });
      $('#cr-peek', scope).addEventListener('click', function () { _sound('click'); if (!PR.done) { PR.peeked = true; showSolution(null); } });
      wirePad(scope);
    });
  }

  function checkSolve() {
    if (!PR || PR.done) return;
    var n = E.parseAnswer(K.text);
    if (n === null) return;
    PR.tries++;
    var ok = E.checkNumber(n, PR.p.answer);
    showSolution(ok, n);
  }

  function showSolution(ok, typed) {
    var pr = PR.p, scope = root(), before = starCount();
    PR.done = true;
    $all('.cr-key,#cr-check,#cr-peek,#cr-hintbtn', scope).forEach(function (b) { b.disabled = true; });
    var credited = ok === true && !PR.peeked;
    if (credited) {
      data.eng[PR.topic] = (data.eng[PR.topic] | 0) + 1;
      _save();
      logActivity('🛠️', tx(topicLabel(PR.topic).es, topicLabel(PR.topic).en) + ' ✓');
    }
    try {
      if (typeof Review !== 'undefined') {
        var it = P.reviewItem(pr, isEs());
        if (ok === true) Review.hit(null, Review.idFor('calculo', it.prompt, it.answer));
        else Review.add(null, { app: 'calculo', prompt: it.prompt, answer: it.answer, choices: it.choices });
      }
    } catch (e) {}
    _sound(ok === true ? 'correct' : 'wrong');
    var newStar = starCount() > before;
    _refreshStars();
    var u = unitText(pr.unit), ans = num(pr.answer) + (u ? ' ' + u : '');
    var entry = document.getElementById('cr-entry');
    if (entry && ok !== null) entry.classList.add(ok === true ? 'right' : 'wrong');
    var head = ok === true ? (credited ? bi('¡Correcto!', 'Correct!') : bi('Correcto, pero viste los pasos.', 'Right, but you looked at the steps.'))
      : ok === false ? bi('Casi. La respuesta es ' + ans + '.', 'Not quite. The answer is ' + ans + '.') : bi('Los pasos. La respuesta es ' + ans + '.', 'The steps. The answer is ' + ans + '.');
    var linkNames = { 'euclid-workshop.html': "Euclid's Workshop", 'little-engineer.html': 'Little Engineer', 'math-galaxy.html': 'Math Galaxy', 'circuit-lab.html': 'Circuit Lab' };
    $('#cr-solution', scope).innerHTML = '<div class="cr-worked ' + (ok === true ? 'ok' : 'no') + '" aria-live="polite" id="cr-worked"><h3 class="cr-h3">' + head + '</h3>' +
      (newStar ? '<p class="cr-star-note">⭐ ' + bi('¡Ganaste una estrella!', 'You earned a star!') + '</p>' : '') +
      '<h4 class="cr-h4">' + bi('Solución paso a paso', 'Worked solution') + '</h4><ol>' + pr.steps.map(function (s) { return '<li>' + biO(s) + '</li>'; }).join('') + '</ol>' +
      '<a class="cr-learn-a slim" href="' + pr.link + '"><span>' + esc(tx('Practica la idea en ', 'Practise the idea in ')) + '<b>' + esc(linkNames[pr.link] || pr.link) + '</b></span></a></div>' +
      '<div class="cr-actions"><button type="button" class="cr-btn cr-btn-big" id="cr-nextp">' + bi('Otro problema', 'Another problem') + '</button>' +
      '<button type="button" class="cr-btn cr-btn-ghost" data-go="engineer">' + bi('Todos los temas', 'All topics') + '</button></div>';
    $('#cr-nextp', scope).addEventListener('click', function () { _sound('click'); go('solve', PR.topic); });
    $all('#cr-solution [data-go]', scope).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); go(b.getAttribute('data-go')); }); });
    try { $('#cr-worked', scope).scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }
  function topicLabel(id) { var o = { es: id, en: id }; P.TOPICS.forEach(function (t) { if (t.id === id) o = t; }); return o; }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function init() {
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    age = user && user.age ? Number(user.age) : 0;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age || undefined) : 'intermediate';
    data = _load();
    // Read-aloud for the questions and the answers that are buttons.
    try {
      if (typeof ZsSpeak !== 'undefined' && ZsSpeak.watch) ZsSpeak.watch({ prompt: '.cr-q-text', group: '.cr-opts', choice: '.cr-opt', lang: speakLang() });
    } catch (e) {}
    viewHome();
  }

  function currentState() {
    return {
      view: current.view,
      sprint: S ? { text: S.q && S.q.text, answer: S.q && S.q.answer, level: S.ad.level, answered: S.answers.length } : null,
      estimate: EST ? { id: EST.q.id, truth: EST.q.truth, min: EST.q.min, max: EST.q.max } : null,
      problem: PR ? { topic: PR.topic, seed: PR.seed, answer: PR.p.answer, kind: PR.p.kind, done: PR.done } : null,
      quiz: QZ && QZ.qs[QZ.i] ? { topic: QZ.topic, i: QZ.i, correct: QZ.qs[QZ.i].correct } : null,
      data: data
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { go: go, state: currentState, quizStars: quizStars, engStars: engStars };
})();
