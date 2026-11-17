/* ================================================================
   MISIONES DE MAPA 🧭 — using maps: mystery places found from clues,
   trips planned across time zones, map skills (compass, latitude and
   longitude, scale, cross-sections, contour lines) and a Chile pack
   (the 16 regions north to south, the Ruta 5, Rapa Nui, Antarctica).

   Per-kid progress at zs_mapa_<kid> (one JSON blob, fields only added):
     { v:1, best:{ missionKey: 0..3 }, found:{ iso3: 1 }, plans: n,
       last:'YYYY-MM-DD' }
   Stars (js/auth.js): the best of each mission (up to 3), one for every
   5 different mystery places found (up to 6) and one per trip planned
   in the free planner (up to 3).
   Content: misiones-mapa-data.js · maths: misiones-mapa-engine.js ·
   pictures: misiones-mapa-art.js · outlines: world-map-data.js
   ================================================================ */

var Misiones = (function () {
  'use strict';

  var D = MapaData, E = MapaEngine, A = MapaArt, WM = typeof WorldMap !== 'undefined' ? WorldMap : null;
  var PREFIX = 'zs_mapa_';

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function _load() {
    var key = _key(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    d.best = _obj(d.best); d.found = _obj(d.found); d.plans = Math.max(0, d.plans | 0); d.v = 1;
    return d;
  }
  function _save() {
    var key = _key();
    if (!key) return;
    data.last = _today();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) { try { CloudSync.push(key); } catch (e) {} }
  }
  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  var data = null, user = null, age = 0, tier = 'intermediate';
  function esc(s) { return typeof escHtml === 'function' ? escHtml(String(s)) : String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel, r) { return (r || document).querySelector(sel); }
  function $all(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function root() { return document.getElementById('mm-wrap'); }
  function _sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function isEs() { return lang() !== 'en'; }
  function bi(es, en) {
    var l = lang();
    return l === 'es' ? esc(es) : l === 'en' ? esc(en) : esc(es) + '<span class="mm-sub">' + esc(en) + '</span>';
  }
  function tx(es, en) { return lang() === 'en' ? en : es; }
  function pair(p) { return bi(p[0], p[1]); }
  function one(p) { return tx(p[0], p[1]); }
  function speakLang() { return lang() === 'en' ? 'en' : 'es'; }
  function num(n) { return Number(n).toLocaleString(isEs() ? 'es-CL' : 'en-US'); }
  function little() { return tier === 'beginner'; }
  function older() { return tier === 'advanced' || tier === 'expert'; }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function dirName(id) { var d = D.DIRS.filter(function (x) { return x.id === id; })[0]; return d ? one(d.n) : id; }
  function dirPair(id) { var d = D.DIRS.filter(function (x) { return x.id === id; })[0]; return d ? d.n : [id, id]; }
  function city(id) { return D.BY_CITY[id]; }
  function cityName(id) { return one(city(id).n); }
  function shortCity(id) { return one(city(id).short || city(id).n); }

  // Country names from World Atlas data, when it is loaded.
  var NAMES = {};
  (function () {
    if (typeof WORLD_ATLAS_DATA === 'undefined') return;
    WORLD_ATLAS_DATA.forEach(function (c) { NAMES[c.id] = [c.nameEs || c.name, c.name]; });
  })();
  function countryName(code) { return NAMES[code] ? one(NAMES[code]) : code.toUpperCase(); }
  function countryPair(code) { return NAMES[code] || [code.toUpperCase(), code.toUpperCase()]; }

  function starCount() { return typeof getAppStars === 'function' ? getAppStars('mapa', data) : localStars(); }
  function localStars() {
    var n = 0, k, f = 0;
    for (k in data.best) n += Math.min(3, Math.max(0, data.best[k] | 0));
    for (k in data.found) f++;
    return n + Math.min(6, Math.floor(f / 5)) + Math.min(3, data.plans | 0);
  }
  function refreshStars() {
    var el = document.getElementById('mm-total');
    if (el) el.textContent = starCount();
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }
  function addBest(key, stars) {
    var before = starCount();
    if ((data.best[key] | 0) < stars) { data.best[key] = stars; _save(); }
    refreshStars();
    return starCount() > before;
  }
  function bestOf(key) { return data.best[key] | 0; }
  function starsHtml(n, max) {
    max = max || 3;
    var s = '';
    for (var i = 0; i < max; i++) s += '<span class="mm-st' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="mm-stars" aria-label="' + esc(n + ' / ' + max + ' ' + tx('estrellas', 'stars')) + '">' + s + '</span>';
  }

  function logActivity(icon, text) {
    try { if (typeof ActivityLog !== 'undefined') ActivityLog.log('Misiones de Mapa', icon, text); } catch (e) {}
  }
  function reviewAdd(prompt, answer, choices) {
    try {
      if (typeof Review === 'undefined' || !prompt || !answer) return;
      if (prompt.length > 230) prompt = prompt.slice(0, 227) + '…';
      Review.add(null, { app: 'mapa', prompt: prompt, answer: answer, choices: choices });
    } catch (e) {}
  }
  function reviewHit(prompt, answer) {
    try {
      if (typeof Review === 'undefined') return;
      if (prompt.length > 230) prompt = prompt.slice(0, 227) + '…';
      var id = Review.idFor('mapa', prompt, answer);
      if (Review.get(null, id)) Review.hit(null, id);
    } catch (e) {}
  }

  var seedBase = null, seedCount = 0;
  (function () {
    try { var s = new URLSearchParams(location.search).get('seed'); if (s !== null && /^\d{1,9}$/.test(s)) seedBase = parseInt(s, 10); } catch (e) {}
  })();
  function nextRand() {
    if (seedBase !== null) return E.rng(seedBase * 1000 + (seedCount++));
    return E.rng((Math.random() * 4294967296) >>> 0);
  }
  function year() { return new Date().getFullYear(); }

  var cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function leaveView() { cleanup.forEach(function (f) { try { f(); } catch (e) {} }); cleanup = []; }

  var current = { view: 'home' };

  // ---------------------------------------------------------------
  // Shell
  // ---------------------------------------------------------------
  var TABS = [
    { id: 'home', es: 'Misiones', en: 'Missions', ic: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 5l2.4 7L12 19l-2.4-7z" fill="currentColor"/>' },
    { id: 'mystery', es: 'Misterio', en: 'Mystery', ic: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' },
    { id: 'trips', es: 'Viajes', en: 'Trips', ic: '<path d="M2.5 13.5l7-1.5 5-8h2.2l-2.4 7.6 5.2-.8 1.6-2.3h1.6l-1 4.2 1 4.2h-1.6l-1.6-2.3-5.2-.8 2.4 7.6h-2.2l-5-8-7-1.5z" fill="currentColor"/>' },
    { id: 'skills', es: 'Destrezas', en: 'Skills', ic: '<path d="M3 20l6-15 6 9 3-4 3 10z" fill="currentColor" opacity=".85"/><path d="M3 20h18" stroke="currentColor" stroke-width="2"/>' },
    { id: 'chile', es: 'Chile', en: 'Chile', ic: '<path d="M11 2c1 2 .2 4 1 6s-.6 4 .2 6-1 4 .2 6l-1 2c-1.4-2-.4-4-1-6s.4-4-.4-6 .8-4 0-6z" fill="currentColor"/><path d="M15 8h5M15 12h4M15 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>' }
  ];
  function tabOf(view) {
    if (view === 'mystery' || view === 'trips' || view === 'skills' || view === 'chile') return view;
    if (/^mystery/.test(view)) return 'mystery';
    if (/^trip|plan/.test(view)) return 'trips';
    if (/^sk_/.test(view)) return 'skills';
    if (/^cl_/.test(view)) return 'chile';
    return 'home';
  }
  function shell(view, inner) {
    var cur = tabOf(view);
    var tabs = TABS.map(function (t) {
      return '<button type="button" class="mm-tab' + (t.id === cur ? ' on' : '') + '" data-go="' + t.id + '"' + (t.id === cur ? ' aria-current="page"' : '') + '>' +
        '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' + t.ic + '</svg><span class="mm-tab-t">' + bi(t.es, t.en) + '</span></button>';
    }).join('');
    return '<header class="mm-head"><button type="button" class="mm-brand" data-go="home" aria-label="' + esc(tx('Misiones de Mapa, inicio', 'Map Missions home')) + '">' +
      '<span class="mm-brand-rose">' + A.rose({ es: isEs(), cls: 'mm-rose-mini' }) + '</span><span class="mm-brand-t">Misiones de Mapa</span></button>' +
      '<div class="mm-total" title="' + esc(tx('Estrellas', 'Stars')) + '">★ <span id="mm-total">' + starCount() + '</span></div></header>' +
      '<nav class="mm-tabs" aria-label="' + esc(tx('Secciones', 'Sections')) + '">' + tabs + '</nav>' +
      '<main class="mm-main" id="mm-main">' + inner + '</main>';
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
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function go(where, arg) {
    switch (where) {
      case 'home': return viewHome();
      case 'mystery': return viewMystery();
      case 'trips': return viewTrips();
      case 'trip': return viewTrip(arg);
      case 'plan': return viewPlanner();
      case 'skills': return viewSkills();
      case 'chile': return viewChile();
    }
    if (/^sk_|^cl_/.test(where)) return startRound(where);
    return viewHome();
  }
  function top(backTo, title, sub, say) {
    var sp = say && typeof ZsSpeak !== 'undefined' && ZsSpeak.button ? ZsSpeak.button(say, speakLang()) : '';
    return '<div class="mm-top">' + (backTo ? '<button type="button" class="mm-back" data-go="' + backTo + '" aria-label="' + esc(tx('Volver', 'Back')) + '">←</button>' : '') +
      '<div class="mm-top-t"><h1 class="mm-h1">' + title + '</h1>' + (sub ? '<p class="mm-lead">' + sub + sp + '</p>' : '') + '</div></div>';
  }
  function say(text) { try { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.say) ZsSpeak.say(text, speakLang()); } catch (e) {} }
  function autoSay(text) {
    try {
      if (typeof ZsTTS === 'undefined' || ZsTTS.getSettings().mode !== 'auto') return;
      say(text);
    } catch (e) {}
  }
  function appLink(k) {
    var l = D.APP_LINKS[k];
    return '<a class="mm-link" href="' + l.href + '">' + esc(isEs() ? l.es : l.en) + ' →</a>';
  }

  // ---------------------------------------------------------------
  // World map (SVG, Natural Earth outlines from world-map-data.js)
  // ---------------------------------------------------------------
  function regionBox(id) {
    var r = D.REGIONS.filter(function (x) { return x.id === id; })[0] || D.REGIONS[0];
    return lonLatBox(r.b);
  }
  function lonLatBox(b) {
    var bx = WM.box(b), px = bx[2] * 0.03, py = bx[3] * 0.03;
    return [bx[0] - px, bx[1] - py, bx[2] + 2 * px, bx[3] + 2 * py];
  }
  var countryPaths = null;
  function countriesSvg(cls) {
    if (!countryPaths) countryPaths = WM.codes().map(function (c) { return [c, WM.path(c)]; });
    return countryPaths.map(function (cp) {
      return '<path class="' + (cls || 'mm-c') + '" data-c="' + cp[0] + '" d="' + cp[1] + '"/>';
    }).join('');
  }
  function lineD(pts) {
    var d = '', prev = null;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      d += (prev && Math.abs(p[0] - prev[0]) < WM.W / 3 ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
      prev = p;
    }
    return d;
  }
  // opts: { box, cls, label, extra (svg string on top), grid: step, interactive }
  function worldMap(opts) {
    var b = opts.box || regionBox('world');
    var sw = b[2] / 400;
    var body = '<rect x="-50" y="-50" width="' + (WM.W + 100) + '" height="' + (WM.H + 100) + '" class="mm-sea"/>' +
      '<path class="mm-globe" d="' + WM.outline() + '"/>';
    if (opts.grid) body += '<path class="mm-grat" d="' + WM.graticule(opts.grid) + '" stroke-width="' + (sw * 0.9).toFixed(2) + '"/>' +
      '<path class="mm-eq" d="' + WM.parallel(0) + '" stroke-width="' + (sw * 1.8).toFixed(2) + '"/>';
    var quiet = !opts.cls || opts.cls.indexOf('mm-c-quiet') < 0 ? countriesSvg(opts.cls) : '<path class="' + opts.cls + '" d="' + WM.landPath() + '"/>';
    body += '<g class="mm-land" stroke-width="' + (sw * 0.7).toFixed(2) + '">' + quiet + '</g>';
    if (opts.extra) body += opts.extra;
    return '<svg class="mm-map ' + (opts.mapCls || '') + '" viewBox="' + b.map(function (v) { return v.toFixed(1); }).join(' ') + '" preserveAspectRatio="xMidYMid meet"' +
      (opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : '') + ' style="--sw:' + sw.toFixed(2) + '">' + body + '</svg>';
  }
  function dot(ll, r, cls, extra) {
    var p = WM.project(ll[0], ll[1]);
    return '<circle class="' + (cls || 'mm-dot') + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(2) + '"' + (extra || '') + '/>';
  }
  function label(ll, text, size, dx, dy, cls) {
    var p = WM.project(ll[0], ll[1]);
    return '<text class="' + (cls || 'mm-lbl') + '" x="' + (p[0] + (dx || 0)).toFixed(1) + '" y="' + (p[1] + (dy || 0)).toFixed(1) + '" font-size="' + size.toFixed(1) + '" stroke-width="' + (size / 3.5).toFixed(2) + '">' + esc(text) + '</text>';
  }
  function svgPoint(svg, evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : null;
  }
  // Which country was tapped: the shape under the finger, or the
  // nearest country centre within a small radius (for small countries).
  function countryAt(svg, evt, candidates) {
    var t = evt.target && evt.target.closest ? evt.target.closest('[data-c]') : null;
    if (t) return t.getAttribute('data-c');
    var p = svgPoint(svg, evt);
    if (!p) return null;
    var vb = svg.viewBox.baseVal, tol = vb.width / 22, best = null, bd = tol;
    (candidates || WM.codes()).forEach(function (c) {
      var inf = WM.info(c);
      if (!inf || !inf.c) return;
      var d = Math.hypot(inf.c[0] - p.x, inf.c[1] - p.y);
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  }

  // ---------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------
  var SECTIONS = [
    { id: 'mystery', t: ['Lugar misterioso', 'Mystery place'], d: ['Lee las pistas y toca el país en el mapa.', 'Read the clues and tap the country on the map.'], dl: ['Mira la bandera y escucha las pistas. ¿Qué país es?', 'Look at the flag and listen to the clues. Which country is it?'], art: 'mystery' },
    { id: 'trips', t: ['Planear un viaje', 'Plan a trip'], d: ['Distancias, horas de vuelo y la hora de llegada en otro huso horario.', 'Distances, flight times and the arrival time in another time zone.'], dl: ['Lleva el avión a otra ciudad del mundo.', 'Fly the plane to another city in the world.'], art: 'trips' },
    { id: 'skills', t: ['Destrezas de mapa', 'Map skills'], d: ['Brújula, latitud y longitud, escalas, perfiles y curvas de nivel.', 'Compass, latitude and longitude, scales, cross-sections and contour lines.'], dl: ['Norte, sur, este y oeste en el mapa del valle.', 'North, south, east and west on the valley map.'], art: 'skills' },
    { id: 'chile', t: ['Misión Chile', 'Mission Chile'], d: ['Las 16 regiones, la Ruta 5, Rapa Nui y la Antártica.', 'The 16 regions, the Ruta 5, Easter Island and Antarctica.'], dl: ['El norte, el centro, el sur y la isla.', 'The north, the centre, the south and the island.'], art: 'chile' }
  ];
  function sectionArt(id) {
    if (id === 'skills') return A.rose({ es: isEs(), cls: 'mm-sec-rose' });
    if (id === 'chile') return A.zone('glacier');
    if (id === 'trips') {
      var a = city('scl').ll, b = city('mad').ll;
      var extra = '<path class="mm-route" d="' + lineD(WM.greatCircle(a, b, 40)) + '" stroke-width="7"/>' + dot(a, 12, 'mm-dot mm-dot-home') + dot(b, 12, 'mm-dot mm-dot-to');
      return worldMap({ box: lonLatBox([-95, -45, 15, 55]), cls: 'mm-c mm-c-quiet', extra: extra, mapCls: 'mm-map-thumb' });
    }
    return worldMap({ box: lonLatBox([-20, -36, 54, 38]), cls: 'mm-c mm-c-quiet', extra: '<path class="mm-c mm-c-mys" d="' + WM.path('egy') + '"/>' + '<text x="' + WM.info('egy').c[0] + '" y="' + (WM.info('egy').c[1] + 60) + '" class="mm-q-mark" font-size="190">?</text>', mapCls: 'mm-map-thumb' });
  }
  function viewHome() {
    var cards = SECTIONS.map(function (s) {
      return '<button type="button" class="mm-sec mm-sec-' + s.id + '" data-go="' + s.id + '"><span class="mm-sec-art">' + sectionArt(s.id) + '</span>' +
        '<span class="mm-sec-txt"><span class="mm-sec-t">' + pair(s.t) + '</span><span class="mm-sec-d">' + pair(little() ? s.dl : s.d) + '</span></span></button>';
    }).join('');
    var intro = little() ? ['¡Hola, explorador! Elige una misión.', 'Hello, explorer! Pick a mission.'] : ['Los mapas sirven para encontrar lugares, planear viajes y calcular distancias. Elige una misión.', 'Maps help you find places, plan trips and work out distances. Pick a mission.'];
    var h = '<section class="mm-hero"><div class="mm-hero-rose">' + A.rose({ es: isEs(), label: tx('Rosa de los vientos', 'Compass rose') }) + '</div>' +
      '<div><h1 class="mm-h1">' + bi('Misiones de Mapa', 'Map Missions') + '</h1><p class="mm-lead">' + pair(intro) + (typeof ZsSpeak !== 'undefined' && ZsSpeak.button ? ZsSpeak.button(one(intro), speakLang()) : '') + '</p>' +
      '<p class="mm-star-line">★ <b>' + starCount() + '</b> ' + bi('estrellas', 'stars') + '</p></div></section>' +
      '<div class="mm-secs">' + cards + '</div>' +
      '<div class="mm-more"><h2 class="mm-h3">' + bi('Más mapas en la suite', 'More maps in the suite') + '</h2><div class="mm-links">' + appLink('explorer') + appLink('atlas') + appLink('chile') + '</div></div>';
    render('home', h);
    autoSay(one(intro));
  }

  // ---------------------------------------------------------------
  // Mystery place
  // ---------------------------------------------------------------
  var MY = null;
  function clueOrder(m) {
    var easy = ['fl', 'lm', 'cl', 'nb', 'rv', 'xx'], hard = ['rv', 'cl', 'xx', 'nb', 'lm', 'fl'];
    return (older() ? hard : easy).filter(function (k) { return k === 'nb' ? m.nb && m.nb.length : !!m[k]; }).slice(0, 5);
  }
  function clueHtml(m, k) {
    if (k === 'nb') {
      var names = m.nb.map(countryName);
      var txt = tx('Sus vecinos: ' + names.join(', ') + '.', 'Its neighbours: ' + names.join(', ') + '.');
      return { html: esc(txt), text: txt };
    }
    var p = m[k];
    var html = pair(p);
    if (k === 'fl' && WM.hasFlag(m.c)) html = '<span class="mm-clue-flag">' + WM.flag(m.c, { cls: 'mm-flag', wave: true }) + '</span>' + html;
    return { html: html, text: one(p) };
  }
  var CLUE_ICON = { fl: '🏳️', lm: '🏛️', cl: '🌦️', nb: '🧭', rv: '🌊', xx: '💡' };
  function viewMystery() {
    var r = nextRand(), n = little() ? 4 : 5;
    var pool = D.MYSTERY.filter(function (m) { return WM.info(m.c); });
    // little kids get the best-known places first
    if (little()) pool = pool.filter(function (m) { return ['arg', 'per', 'bra', 'mex', 'usa', 'can', 'esp', 'fra', 'ita', 'egy', 'chn', 'jpn', 'aus', 'ind'].indexOf(m.c) >= 0; });
    MY = { r: r, list: E.pickN(pool, n, r), i: 0, found: 0, results: [] };
    nextMystery();
  }
  function nextMystery() {
    if (MY.i >= MY.list.length) return mysteryDone();
    var m = MY.list[MY.i];
    MY.cur = { m: m, order: clueOrder(m), shown: 1, wrong: 0, done: false, tapped: {}, zoom: tier === 'intermediate' ? m.reg : 'world' };
    if (little()) {
      // three big choices: the place and two from other continents
      var others = D.MYSTERY.filter(function (x) { return x.reg !== m.reg && WM.info(x.c); });
      MY.cur.choices = E.shuffle([m.c].concat(E.pickN(others, 2, MY.r).map(function (x) { return x.c; })), MY.r);
    }
    drawMystery();
  }
  function drawMystery() {
    var c = MY.cur, m = c.m;
    var clues = c.order.slice(0, c.shown).map(function (k, i) {
      var ch = clueHtml(m, k);
      return '<li class="mm-clue' + (i === c.shown - 1 ? ' new' : '') + '"><span class="mm-clue-ic" aria-hidden="true">' + CLUE_ICON[k] + '</span><span class="mm-clue-t">' + ch.html + '</span></li>';
    }).join('');
    var more = !c.done && c.shown < c.order.length;
    var h = top('home', bi('Lugar misterioso', 'Mystery place'), bi('País ' + (MY.i + 1) + ' de ' + MY.list.length, 'Country ' + (MY.i + 1) + ' of ' + MY.list.length)) +
      '<div class="mm-mys">' +
      '<div class="mm-mys-clues"><ol class="mm-clues" aria-live="polite">' + clues + '</ol>' +
      '<div class="mm-actions">' + (more ? '<button type="button" class="mm-btn mm-btn-ghost" id="mm-more">' + bi('Otra pista', 'Another clue') + '</button>' : '') +
      (!c.done && !more ? '<button type="button" class="mm-btn mm-btn-ghost" id="mm-give">' + bi('Muéstrame', 'Show me') + '</button>' : '') + '</div>' +
      '<div id="mm-mys-fb"></div></div>';
    if (little()) {
      h += '<div class="mm-mys-pick" role="group" aria-label="' + esc(tx('Elige el país', 'Pick the country')) + '">' + c.choices.map(function (code) {
        var inf = WM.info(code), b = inf.b, pad = Math.max(b[2] - b[0], b[3] - b[1]) * 0.12;
        var vb = [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad];
        var wrongPick = c.tapped[code], rightPick = c.done && code === m.c;
        return '<button type="button" class="mm-pick' + (wrongPick ? ' wrong' : '') + (rightPick ? ' right' : '') + '" data-c="' + code + '"' + (c.done || wrongPick ? ' disabled' : '') + '>' +
          '<svg class="mm-sil" viewBox="' + vb.map(function (v) { return v.toFixed(1); }).join(' ') + '" aria-hidden="true"><path d="' + WM.path(code) + '"/></svg>' +
          '<span class="mm-pick-flag">' + WM.flag(code, { cls: 'mm-flag' }) + '</span><span class="mm-pick-n">' + esc(countryName(code)) + '</span></button>';
      }).join('') + '</div>';
    } else {
      var zooms = D.REGIONS.map(function (z) {
        return '<button type="button" class="mm-zbtn' + (z.id === c.zoom ? ' on' : '') + '" data-z="' + z.id + '"' + (z.id === c.zoom ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(one(z.n)) + '</button>';
      }).join('');
      var extra = '';
      Object.keys(c.tapped).forEach(function (code) { extra += '<path class="mm-c mm-c-wrong" d="' + WM.path(code) + '"/>'; });
      if (c.done) extra += '<path class="mm-c mm-c-right" d="' + WM.path(m.c) + '"/>';
      h += '<div class="mm-mys-map"><div class="mm-zooms" role="group" aria-label="' + esc(tx('Acercar el mapa', 'Zoom the map')) + '">' + zooms + '</div>' +
        '<div class="mm-mapbox" id="mm-mapbox">' + worldMap({ box: regionBox(c.zoom), extra: extra, label: tx('Mapa del mundo: toca un país', 'World map: tap a country'), mapCls: 'mm-map-tap' }) + '</div>' +
        '<p class="mm-hint">' + bi('Toca el país en el mapa. Los botones acercan cada continente.', 'Tap the country on the map. The buttons zoom to each continent.') + '</p></div>';
    }
    h += '</div>';
    render('mystery', h, function (rt) {
      var mb = $('#mm-more', rt); if (mb) mb.addEventListener('click', function () { _sound('click'); c.shown++; drawMystery(); });
      var gb = $('#mm-give', rt); if (gb) gb.addEventListener('click', function () { _sound('click'); finishPlace(false); });
      $all('.mm-zbtn', rt).forEach(function (b) { b.addEventListener('click', function () { _sound('click'); c.zoom = b.getAttribute('data-z'); drawMystery(); }); });
      $all('.mm-pick', rt).forEach(function (b) { b.addEventListener('click', function () { guessPlace(b.getAttribute('data-c')); }); });
      var svg = $('#mm-mapbox svg', rt);
      if (svg && !c.done) svg.addEventListener('click', function (e) { var code = countryAt(svg, e); if (code) guessPlace(code); });
      if (c.done) showMysteryFeedback();
    });
    autoSay(clueHtml(m, c.order[c.shown - 1]).text);
  }
  function guessPlace(code) {
    var c = MY.cur;
    if (c.done) return;
    if (code === c.m.c) { _sound('correct'); finishPlace(true); return; }
    _sound('wrong');
    c.wrong++;
    c.tapped[code] = 1;
    c.lastWrong = code;
    if (c.shown < c.order.length) c.shown++;
    else if (c.wrong >= 3 || little()) { finishPlace(false); return; }
    drawMystery();
    var fb = $('#mm-mys-fb');
    if (fb) fb.innerHTML = '<div class="mm-fb no" role="status">' + bi('Ese es ' + countryName(code) + '. Aquí va otra pista.', 'That is ' + countryName(code) + '. Here is another clue.') + '</div>';
  }
  function finishPlace(ok) {
    var c = MY.cur;
    c.done = true; c.ok = ok;
    if (ok) {
      MY.found++;
      var before = starCount();
      if (!data.found[c.m.c]) { data.found[c.m.c] = 1; _save(); }
      refreshStars();
      if (starCount() > before) _sound('star');
    } else {
      var m = c.m;
      reviewAdd(tx('Lugar misterioso: ', 'Mystery place: ') + clueHtml(m, c.order[0]).text + ' ' + (c.order[1] ? clueHtml(m, c.order[1]).text : ''), countryName(m.c),
        E.shuffle([m.c].concat(E.pickN(D.MYSTERY.filter(function (x) { return x.c !== m.c; }), 3, MY.r).map(function (x) { return x.c; })), MY.r).map(countryName));
    }
    MY.results.push({ c: c.m.c, ok: ok, clues: c.shown });
    drawMystery();
  }
  function showMysteryFeedback() {
    var c = MY.cur, fb = $('#mm-mys-fb');
    if (!fb) return;
    var name = countryName(c.m.c), last = MY.i >= MY.list.length - 1;
    fb.innerHTML = '<div class="mm-fb ' + (c.ok ? 'ok' : 'no') + '" role="status"><span class="mm-fb-flag">' + (WM.hasFlag(c.m.c) ? WM.flag(c.m.c, { cls: 'mm-flag' }) : '') + '</span><span>' +
      (c.ok ? bi('¡Lo encontraste! Es ' + name + '.', 'You found it! It is ' + name + '.') : bi('Era ' + name + '.', 'It was ' + name + '.')) +
      (c.ok ? '<span class="mm-fb-s">' + bi('Con ' + c.shown + (c.shown === 1 ? ' pista' : ' pistas'), 'With ' + c.shown + (c.shown === 1 ? ' clue' : ' clues')) + '</span>' : '') + '</span></div>' +
      '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" id="mm-next">' + bi(last ? 'Ver resultado' : 'Siguiente país', last ? 'See result' : 'Next country') + '</button></div>';
    $('#mm-next').addEventListener('click', function () { _sound('click'); MY.i++; nextMystery(); });
    try { fb.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }
  function mysteryDone() {
    var n = MY.list.length, f = MY.found, stars = E.roundStars(f, n);
    var gained = addBest('mys', stars);
    if (gained) _sound('star');
    logActivity('🔎', tx('Lugar misterioso', 'Mystery place') + ': ' + f + ' / ' + n);
    var foundAll = Object.keys(data.found).length;
    var list = MY.results.map(function (x) {
      return '<li class="mm-res ' + (x.ok ? 'ok' : 'no') + '"><span class="mm-res-flag">' + (WM.hasFlag(x.c) ? WM.flag(x.c, { cls: 'mm-flag' }) : '') + '</span><span>' + esc(countryName(x.c)) + '</span><span class="mm-res-m">' + (x.ok ? '✓' : '·') + '</span></li>';
    }).join('');
    var h = top('home', bi('Lugar misterioso', 'Mystery place')) +
      '<div class="mm-done"><div class="mm-done-stars">' + starsHtml(stars) + '</div><p class="mm-done-t">' + bi('Encontraste ' + f + ' de ' + n + ' países.', 'You found ' + f + ' of ' + n + ' countries.') + '</p>' +
      '<ul class="mm-res-list">' + list + '</ul>' +
      '<p class="mm-lead">' + bi('Lugares distintos encontrados: ' + foundAll + ' de ' + D.MYSTERY.length + '. Cada 5 lugares nuevos ganas una estrella.', 'Different places found: ' + foundAll + ' of ' + D.MYSTERY.length + '. Every 5 new places earn a star.') + '</p>' +
      '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" data-go="mystery">' + bi('Otra ronda', 'Another round') + '</button>' +
      '<button type="button" class="mm-btn mm-btn-ghost" data-go="home">' + bi('Misiones', 'Missions') + '</button></div>' +
      '<p class="mm-links">' + appLink('explorer') + appLink('atlas') + '</p></div>';
    render('mystery-done', h);
  }

  // ---------------------------------------------------------------
  // Trips
  // ---------------------------------------------------------------
  function tripsFor() {
    if (little()) return D.TRIPS.filter(function (t) { return D.LITTLE_CITIES.indexOf(t.to) >= 0; });
    return D.TRIPS;
  }
  function tripMap(t, opts) {
    opts = opts || {};
    var a = city(t.from), b = city(t.to), gc = WM.greatCircle(a.ll, b.ll, 80);
    var xs = gc.map(function (p) { return p[0]; }), ys = gc.map(function (p) { return p[1]; });
    var wraps = lineD(gc).indexOf('M', 1) > 0;
    var bx;
    if (wraps) bx = regionBox('world');
    else {
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var w = Math.max(x1 - x0, 260), hh = Math.max(y1 - y0, 160), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (w / hh < 1.5) w = hh * 1.5; else hh = w / 1.5;
      w *= 1.35; hh *= 1.35;
      bx = [cx - w / 2, cy - hh / 2, w, hh];
    }
    var sw = bx[2] / 400, r = sw * 5;
    var extra = '<path class="mm-route" id="mm-route" d="' + lineD(gc) + '" stroke-width="' + (sw * 3).toFixed(2) + '" stroke-dasharray="' + (sw * 8).toFixed(1) + ' ' + (sw * 5).toFixed(1) + '"/>' +
      dot(a.ll, r, 'mm-dot mm-dot-home') + dot(b.ll, r, 'mm-dot mm-dot-to') +
      label(a.ll, cityName(t.from), sw * 13, r * 1.6, r * 0.5) + label(b.ll, cityName(t.to), sw * 13, r * 1.6, r * 0.5) +
      '<g id="mm-plane" class="mm-plane" transform="translate(' + gc[0][0].toFixed(1) + ',' + gc[0][1].toFixed(1) + ') scale(' + (sw * 1.1).toFixed(2) + ')">' + A.planeShape('#fff') + '</g>';
    return { svg: worldMap({ box: bx, extra: extra, cls: 'mm-c mm-c-quiet', label: tx('Ruta de ', 'Route from ') + cityName(t.from) + ' → ' + cityName(t.to) }), pts: gc };
  }
  function flyPlane(pts, done) {
    var g = document.getElementById('mm-plane');
    if (!g || !pts || pts.length < 2) { if (done) done(); return; }
    var scale = (g.getAttribute('transform').match(/scale\(([^)]+)\)/) || [0, 1])[1];
    function place(i) {
      var p = pts[Math.min(i, pts.length - 1)], q = pts[Math.min(i + 1, pts.length - 1)];
      if (i >= pts.length - 1) q = p, p = pts[pts.length - 2];
      var ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
      if (Math.abs(q[0] - p[0]) > WM.W / 3) ang = 180;
      var at = pts[Math.min(i, pts.length - 1)];
      g.setAttribute('transform', 'translate(' + at[0].toFixed(1) + ',' + at[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + scale + ')');
    }
    if (reduced()) { place(pts.length - 1); if (done) done(); return; }
    var t0 = null, dur = 1800, raf;
    function step(ts) {
      if (!document.getElementById('mm-plane')) return;
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      place(Math.round(e * (pts.length - 1)));
      if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
    }
    raf = requestAnimationFrame(step);
    onLeave(function () { cancelAnimationFrame(raf); });
  }
  function viewTrips() {
    var list = tripsFor().map(function (t) {
      var b = bestOf('trip_' + t.id);
      return '<button type="button" class="mm-trip" data-go="trip" data-arg="' + t.id + '">' +
        '<span class="mm-trip-ic">' + A.plane() + '</span><span class="mm-trip-t"><b>' + esc(cityName(t.from)) + ' → ' + esc(cityName(t.to)) + '</b>' +
        '<span class="mm-trip-d">' + pair(t.why) + '</span></span>' + starsHtml(b) + '</button>';
    }).join('');
    var intro = little() ? ['Elige un viaje. Tú llevas el avión.', 'Pick a trip. You fly the plane.'] :
      tier === 'intermediate' ? ['Mira la ruta, di hacia dónde vuela el avión y cuántas horas tarda.', 'Look at the route, say which way the plane flies and how many hours it takes.'] :
      ['Calcula la hora de vuelo y la hora de llegada en el huso horario del destino.', 'Work out the flight time and the arrival time in the destination\'s time zone.'];
    var h = top('home', bi('Planear un viaje', 'Plan a trip'), pair(intro), one(intro)) +
      (little() ? '' : '<button type="button" class="mm-planner-cta" data-go="plan"><span class="mm-planner-ic">' + A.rose({ es: isEs(), cls: 'mm-rose-mini' }) + '</span><span><b>' + bi('Planificador libre', 'Free planner') + '</b><span class="mm-trip-d">' + bi('Toca ciudades para armar tu propio viaje con escalas.', 'Tap cities to build your own trip with stops.') + '</span></span>' + starsHtml(Math.min(3, data.plans), 3) + '</button>') +
      '<div class="mm-trips">' + list + '</div>' +
      (older() ? '<div class="mm-rule"><b>' + bi('La regla del piloto', 'The pilot\'s rule') + '</b><p>' + bi('Un avión de pasajeros vuela unos 800 km cada hora. Suma media hora para despegar y aterrizar, y redondea a la media hora.', 'A passenger jet flies about 800 km each hour. Add half an hour to take off and land, and round to the half hour.') + '</p></div>' : '') +
      '<p class="mm-links">' + appLink('vacation') + '</p>';
    render('trips', h);
    autoSay(one(intro));
  }

  // A trip mission is a short round: the steps depend on age.
  function tripQuestions(t, r) {
    var a = city(t.from), b = city(t.to), T = E.trip(a, b, t.dep, t.mon, year()), qs = [];
    // Direction as seen on the map; a route that crosses the date line
    // leaves one edge of the map and comes back on the other.
    var mapDir = (function () {
      var p = WM.project(a.ll[0], a.ll[1]), q = WM.project(b.ll[0], b.ll[1]), dx = q[0] - p[0];
      if (lineD(WM.greatCircle(a.ll, b.ll, 80)).indexOf('M', 1) > 0) dx = dx > 0 ? dx - WM.W : dx + WM.W;
      return E.degFromDelta(dx, q[1] - p[1]);
    })();
    var fromN = cityName(t.from), toN = cityName(t.to);
    var dateTxt = t.mon === 0 ? tx('15 de enero (verano en Chile)', '15 January (summer in Chile)') : tx('15 de julio (invierno en Chile)', '15 July (winter in Chile)');
    if (little()) {
      qs.push({ kind: 'tap', to: t.to, text: tx('Vamos de ' + fromN + ' a ' + toN + '. ¡Toca ' + toN + ' en el mapa!', 'We are going from ' + fromN + ' to ' + toN + '. Tap ' + toN + ' on the map!') });
      var d4 = E.dir4(mapDir), cs = E.choiceSet(d4, E.shuffle(E.DIR4.filter(function (x) { return x !== d4; }), r), r, 4);
      qs.push({ kind: 'dir', text: tx('¿Hacia dónde vuela el avión?', 'Which way does the plane fly?'), choices: cs.choices, answer: cs.answer, dirs: true });
      return { T: T, qs: qs };
    }
    var d8 = E.dir8(mapDir);
    if (tier === 'intermediate') {
      var cs8 = E.choiceSet(d8, [E.opposite(d8)].concat(E.shuffle(E.DIR8.filter(function (x) { return x !== d8 && x !== E.opposite(d8); }), r)), r, 4);
      qs.push({ kind: 'dir', text: tx('En el mapa, ¿hacia dónde vuela el avión de ' + fromN + ' a ' + toN + '?', 'On the map, which way does the plane fly from ' + fromN + ' to ' + toN + '?'), choices: cs8.choices, answer: cs8.answer, dirs: true });
      var th = Math.round(T.km / 1000) * 1000;
      var csK = E.choiceSet(th, [th + 1000, Math.max(1000, th - 1000), th * 2, th + 2000].filter(function (x) { return x !== th; }), r, 4);
      qs.push({ kind: 'num', text: tx('El viaje mide ' + num(T.kmR) + ' km. Redondeado a los miles, ¿cuánto es?', 'The trip is ' + num(T.kmR) + ' km. Rounded to the nearest thousand, how much is that?'), choices: csK.choices.map(function (x) { return num(x) + ' km'; }), answer: csK.answer });
      var hs = E.flightHoursSimple(T.km), csH = E.choiceSet(hs, [hs + 1, Math.max(1, hs - 1), hs + 3, hs * 2].filter(function (x) { return x !== hs; }), r, 4);
      qs.push({ kind: 'num', text: tx('El avión vuela unos 800 km cada hora. ¿Cuántas horas tarda en recorrer ' + num(T.kmR) + ' km, más o menos?', 'The plane flies about 800 km each hour. About how many hours does it take to fly ' + num(T.kmR) + ' km?'),
        choices: csH.choices.map(function (x) { return x + ' h'; }), answer: csH.answer, hint: tx(num(T.kmR) + ' ÷ 800', num(T.kmR) + ' ÷ 800') });
      return { T: T, qs: qs };
    }
    var csF = E.flightChoices(T.mins, r);
    qs.push({ kind: 'num', text: tx('De ' + fromN + ' a ' + toN + ' hay ' + num(T.kmR) + ' km. Con la regla del piloto, ¿cuánto dura el vuelo?', 'From ' + fromN + ' to ' + toN + ' is ' + num(T.kmR) + ' km. With the pilot\'s rule, how long is the flight?'),
      choices: csF.choices.map(function (m) { return E.fmtDuration(m); }), answer: csF.answer, hint: num(T.kmR) + ' ÷ 800 + ' + tx('0,5', '0.5') + ' h' });
    var diffH = T.diffMin / 60;
    function diffText(h) {
      if (!h) return tx('la misma hora', 'the same time');
      var a = Math.abs(h), u = a === 1 ? tx('hora', 'hour') : tx('horas', 'hours');
      return h > 0 ? tx(num(a) + ' ' + u + ' más', num(a) + ' ' + u + ' ahead') : tx(num(a) + ' ' + u + ' menos', num(a) + ' ' + u + ' behind');
    }
    if (tier === 'expert') {
      var wr = [-diffH, diffH + 1, diffH - 1, diffH + 2].filter(function (x) { return x !== diffH; });
      var csD = E.choiceSet(diffH, wr, r, 4);
      qs.push({ kind: 'num', text: tx('El ' + dateTxt + ', ' + fromN + ' está en ' + E.fmtOffset(T.offFrom) + ' y ' + toN + ' en ' + E.fmtOffset(T.offTo) + '. Comparado con ' + fromN + ', ¿qué hora es en ' + toN + '?',
        'On ' + dateTxt + ', ' + fromN + ' is on ' + E.fmtOffset(T.offFrom) + ' and ' + toN + ' on ' + E.fmtOffset(T.offTo) + '. Compared with ' + fromN + ', what time is it in ' + toN + '?'),
        choices: csD.choices.map(diffText), answer: csD.answer });
    }
    var csA = E.arrivalChoices(T, r);
    function arrText(k) {
      var p = k.split('|'), d = +p[1];
      return p[0] + (d === 1 ? tx(' del día siguiente', ' the next day') : d === 2 ? tx(' dos días después', ' two days later') : d === -1 ? tx(' del día anterior', ' the day before') : tx(' del mismo día', ' the same day'));
    }
    var zoneLine = tier === 'expert' ? '' : ' ' + tx('En ' + toN + ' es ' + diffText(diffH) + ' que en ' + fromN + '.', 'In ' + toN + ' it is ' + diffText(diffH) + ' than in ' + fromN + '.');
    qs.push({ kind: 'num', text: tx('Sales de ' + fromN + ' a las ' + T.dep + ' (hora de ' + fromN + ') el ' + dateTxt + '. El vuelo dura ' + E.fmtDuration(T.mins) + '.' + zoneLine + ' ¿A qué hora llegas, según los relojes de ' + toN + '?',
      'You leave ' + fromN + ' at ' + T.dep + ' (' + fromN + ' time) on ' + dateTxt + '. The flight takes ' + E.fmtDuration(T.mins) + '.' + zoneLine + ' What time do you land, by the clocks in ' + toN + '?'),
      choices: csA.choices.map(arrText), answer: csA.answer });
    return { T: T, qs: qs };
  }

  var TR = null;
  function viewTrip(id) {
    var t = D.BY_TRIP[id] || D.TRIPS[0], r = nextRand(), tq = tripQuestions(t, r);
    TR = { t: t, T: tq.T, qs: tq.qs, i: 0, right: 0, flown: false, r: r };
    drawTripQ();
  }
  function drawTripQ() {
    var t = TR.t, q = TR.qs[TR.i];
    var head = top('trips', esc(cityName(t.from)) + ' → ' + esc(cityName(t.to)), pair(t.why));
    var mapHtml;
    if (q && q.kind === 'tap') {
      // the picture map: big pins for the little cities
      var bx = regionBox('world'), sw = bx[2] / 400, extra = '';
      var LBL = { scl: [10, 2, 'start'], pnt: [10, 6, 'start'], ipc: [0, 16, 'middle'], nyc: [-8, -2, 'end'], mad: [-2, -27, 'middle'], cai: [8, 8, 'start'], tyo: [8, 4, 'start'], syd: [-8, 8, 'end'] };
      bx = lonLatBox([-125, -60, 165, 62]); sw = bx[2] / 400;
      D.LITTLE_CITIES.forEach(function (cid) {
        var c = city(cid), p = WM.project(c.ll[0], c.ll[1]), home = cid === t.from, o = LBL[cid] || [10, 4, 'start'];
        extra += '<g class="mm-cpin' + (home ? ' home' : '') + '" data-city="' + cid + '" role="button" tabindex="0" aria-label="' + esc(cityName(cid)) + '">' +
          '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (sw * 16).toFixed(1) + '" class="mm-cpin-hit"/>' +
          A.pin(p[0], p[1], sw * 1.1, home ? '#1d4ed8' : '#c0392b') + '</g>' +
          '<text class="mm-lbl mm-lbl-big" x="' + (p[0] + sw * o[0]).toFixed(1) + '" y="' + (p[1] + sw * o[1]).toFixed(1) + '" font-size="' + (sw * 14).toFixed(1) + '" stroke-width="' + (sw * 4).toFixed(1) + '" text-anchor="' + o[2] + '">' + esc(shortCity(cid)) + '</text>';
      });
      mapHtml = worldMap({ box: bx, extra: extra, cls: 'mm-c mm-c-quiet', label: tx('Mapa del mundo con ciudades', 'World map with cities') });
      TR.pts = null;
    } else {
      var tm = tripMap(t);
      mapHtml = tm.svg; TR.pts = tm.pts;
    }
    var facts = '';
    if (!little() && TR.i > 0) facts = '<div class="mm-facts"><span>📏 ' + num(TR.T.kmR) + ' km</span>' + (older() && TR.i > 0 ? '<span>⏱️ ' + E.fmtDuration(TR.T.mins) + '</span>' : '') + '</div>';
    var body = '<div class="mm-mapbox mm-trip-map" id="mm-mapbox">' + mapHtml + '</div>' + facts;
    if (!q) return tripDone();
    body += '<div class="mm-qbox"><div class="mm-prog">' + (TR.i + 1) + ' / ' + TR.qs.length + '</div><p class="mm-q">' + esc(q.text) + '</p>' + (q.hint ? '<p class="mm-hint">💡 ' + esc(q.hint) + '</p>' : '');
    if (q.kind !== 'tap') body += choicesHtml(q);
    else body += '<div class="mm-citybtns" role="group" aria-label="' + esc(tx('Ciudades', 'Cities')) + '">' + D.LITTLE_CITIES.filter(function (cid) { return cid !== t.from; }).map(function (cid) {
      return '<button type="button" class="mm-citybtn" data-city="' + cid + '"><span aria-hidden="true">📍</span> ' + esc(shortCity(cid)) + '</button>';
    }).join('') + '</div>';
    body += '<div id="mm-after"></div></div>';
    render('trip', head + body, function (rt) {
      if (q.kind === 'tap') {
        $all('.mm-cpin, .mm-citybtn', rt).forEach(function (g) {
          var act = function () { tapCity(g.getAttribute('data-city'), g); };
          g.addEventListener('click', act);
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
        });
      } else {
        bindChoices(rt, q, function (ok) { answerTrip(ok); });
        if (!TR.flown) { TR.flown = true; flyPlane(TR.pts); }
        else flyPlane(TR.pts.slice(-2));
      }
    });
    autoSay(q.text);
  }
  function tapCity(cid, g) {
    var q = TR.qs[TR.i];
    if (TR.locked) return;
    if (cid === TR.t.from) return;
    if (cid === q.to) {
      TR.locked = true; _sound('correct'); TR.right++;
      $('#mm-after').innerHTML = '<div class="mm-fb ok" role="status">' + bi('¡Muy bien! Allá vamos.', 'Well done! Off we go.') + '</div>';
      setTimeout(function () { TR.locked = false; TR.i++; drawTripQ(); }, reduced() ? 300 : 900);
    } else {
      _sound('wrong');
      TR.missedTap = true;
      $all('[data-city="' + cid + '"]').forEach(function (x) { x.classList.add('wrong'); });
      $('#mm-after').innerHTML = '<div class="mm-fb no" role="status">' + bi('Esa es ' + cityName(cid) + '. Busca ' + cityName(q.to) + '.', 'That is ' + cityName(cid) + '. Look for ' + cityName(q.to) + '.') + '</div>';
    }
  }
  function answerTrip(ok) {
    if (ok) TR.right++;
    var more = TR.i < TR.qs.length - 1;
    var after = $('#mm-after');
    after.insertAdjacentHTML('beforeend', '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" id="mm-next">' + bi(more ? 'Siguiente' : 'Ver resultado', more ? 'Next' : 'See result') + '</button></div>');
    $('#mm-next').addEventListener('click', function () { _sound('click'); TR.i++; drawTripQ(); });
  }
  function tripDone() {
    var t = TR.t, n = TR.qs.length, right = TR.right - (TR.missedTap ? 0.25 : 0), stars = E.roundStars(Math.max(0, right), n);
    if (addBest('trip_' + t.id, stars)) _sound('star');
    logActivity('✈️', cityName(t.from) + ' → ' + cityName(t.to) + ' ' + stars + '★');
    var T = TR.T, tm = tripMap(t);
    var facts = little() ? '' : '<ul class="mm-sum"><li>📏 <b>' + num(T.kmR) + ' km</b> ' + bi('en línea recta sobre la Tierra (círculo máximo)', 'in a straight line over the Earth (great circle)') + '</li>' +
      '<li>⏱️ <b>' + E.fmtDuration(T.mins) + '</b> ' + bi('de vuelo', 'of flying') + '</li>' +
      (older() ? '<li>🕘 ' + bi('Sale ' + T.dep + ' en ' + cityName(t.from) + ' (' + E.fmtOffset(T.offFrom) + '), llega ' + T.arr + ' en ' + cityName(t.to) + ' (' + E.fmtOffset(T.offTo) + ')' + (T.days ? ', ' + (T.days === 1 ? 'al día siguiente' : T.days + ' días después') : ''),
        'Leaves ' + T.dep + ' in ' + cityName(t.from) + ' (' + E.fmtOffset(T.offFrom) + '), lands ' + T.arr + ' in ' + cityName(t.to) + ' (' + E.fmtOffset(T.offTo) + ')' + (T.days ? ', ' + (T.days === 1 ? 'the next day' : T.days + ' days later') : '')) + '</li>' : '') + '</ul>';
    var h = top('trips', esc(cityName(t.from)) + ' → ' + esc(cityName(t.to))) +
      '<div class="mm-mapbox mm-trip-map" id="mm-mapbox">' + tm.svg + '</div>' +
      '<div class="mm-done"><div class="mm-done-stars">' + starsHtml(stars) + '</div>' + facts +
      (t.id === 'syd' && older() ? '<p class="mm-lead">' + bi('Cruzaste la línea internacional de cambio de fecha: al ir hacia el oeste por el Pacífico, el calendario salta un día.', 'You crossed the International Date Line: flying west over the Pacific, the calendar jumps a day.') + '</p>' : '') +
      '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" data-go="trips">' + bi('Otro viaje', 'Another trip') + '</button>' +
      (stars < 3 ? '<button type="button" class="mm-btn mm-btn-ghost" data-go="trip" data-arg="' + t.id + '">' + bi('Repetir', 'Try again') + '</button>' : '') + '</div></div>';
    TR.pts = tm.pts;
    render('trip-done', h, function () { flyPlane(TR.pts.slice(-2)); });
  }

  // ---------------------------------------------------------------
  // Free planner: tap cities to add stops; legs show distance, flight
  // time and the local arrival time (two hours between flights).
  // ---------------------------------------------------------------
  var PL = null;
  function viewPlanner() {
    PL = PL || { stops: ['scl'], dep: '09:00', saved: false };
    drawPlanner();
  }
  function plannerLegs() {
    var legs = [], now = new Date(), y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
    var p = E.hm(+PL.dep.split(':')[0], +PL.dep.split(':')[1]), utc = null;
    for (var i = 1; i < PL.stops.length; i++) {
      var a = city(PL.stops[i - 1]), b = city(PL.stops[i]), km = E.distanceKm(a.ll, b.ll), mins = E.flightMinutes(km);
      if (utc === null) { var hm = p.split(':'); utc = E.localToUtc({ y: y, mo: mo, d: d, h: +hm[0], mi: +hm[1] }, a.tz, a.off); }
      var depL = E.utcToLocal(utc, a.tz, a.off), arrUtc = utc + mins * 60000, arrL = E.utcToLocal(arrUtc, b.tz, b.off);
      legs.push({ a: a.id, b: b.id, km: km, mins: mins, dep: E.hm(depL.h, depL.mi), arr: E.hm(arrL.h, arrL.mi), offA: depL.off, offB: arrL.off,
        days: Math.floor(Date.UTC(arrL.y, arrL.mo, arrL.d) / 864e5) - Math.floor(Date.UTC(y, mo, d) / 864e5) });
      utc = arrUtc + 120 * 60000;
    }
    return legs;
  }
  function drawPlanner() {
    var legs = plannerLegs(), bx = regionBox('world'), sw = bx[2] / 400, extra = '';
    for (var i = 1; i < PL.stops.length; i++) extra += '<path class="mm-route" d="' + lineD(WM.greatCircle(city(PL.stops[i - 1]).ll, city(PL.stops[i]).ll, 64)) + '" stroke-width="' + (sw * 2.6).toFixed(2) + '"/>';
    D.CITIES.forEach(function (c) {
      var p = WM.project(c.ll[0], c.ll[1]), idx = PL.stops.lastIndexOf(c.id);
      extra += '<g class="mm-cdot' + (idx >= 0 ? ' on' : '') + '" data-city="' + c.id + '" role="button" tabindex="0" aria-label="' + esc(cityName(c.id)) + '">' +
        '<circle class="mm-cpin-hit" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (sw * 13).toFixed(1) + '"/>' +
        '<circle class="mm-cdot-c" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (sw * (idx >= 0 ? 5 : 3.6)).toFixed(1) + '"/>' +
        (idx >= 0 ? '<text class="mm-cdot-n" x="' + p[0].toFixed(1) + '" y="' + (p[1] + sw * 2.2).toFixed(1) + '" font-size="' + (sw * 6.5).toFixed(1) + '">' + (idx + 1) + '</text>' : '') + '</g>' +
        (idx >= 0 ? label(c.ll, cityName(c.id), sw * 11, sw * 7, sw * 3) : '');
    });
    var total = legs.reduce(function (s, l) { return s + l.km; }, 0);
    var legHtml = legs.map(function (l, i) {
      return '<li class="mm-leg"><span class="mm-leg-n">' + (i + 1) + '</span><span class="mm-leg-t"><b>' + esc(cityName(l.a)) + ' → ' + esc(cityName(l.b)) + '</b>' +
        '<span>' + num(E.round10(l.km)) + ' km · ' + E.fmtDuration(l.mins) + '</span>' +
        '<span>' + bi('Sale ' + l.dep + ' (' + E.fmtOffset(l.offA) + ') · llega ' + l.arr + ' (' + E.fmtOffset(l.offB) + ')' + (l.days > 0 ? ' +' + l.days + 'd' : ''),
          'Leaves ' + l.dep + ' (' + E.fmtOffset(l.offA) + ') · lands ' + l.arr + ' (' + E.fmtOffset(l.offB) + ')' + (l.days > 0 ? ' +' + l.days + 'd' : '')) + '</span></span></li>';
    }).join('');
    var hours = []; for (var hh = 0; hh < 24; hh++) hours.push(E.hm(hh, 0));
    var h = top('trips', bi('Planificador libre', 'Free planner'), bi('Toca ciudades en el mapa para agregar escalas (hasta 5). Entre vuelos hay 2 horas de espera.', 'Tap cities on the map to add stops (up to 5). There are 2 hours between flights.')) +
      '<div class="mm-mapbox" id="mm-mapbox">' + worldMap({ box: bx, extra: extra, cls: 'mm-c mm-c-quiet', label: tx('Mapa del mundo con ciudades', 'World map with cities') }) + '</div>' +
      '<div class="mm-plan-bar"><label for="mm-add">' + bi('Agregar ciudad', 'Add a city') + '</label><select id="mm-add" class="mm-select"><option value="">—</option>' +
      D.CITIES.slice().sort(function (x, y) { return cityName(x.id).localeCompare(cityName(y.id)); }).map(function (c) { return '<option value="' + c.id + '">' + esc(cityName(c.id)) + '</option>'; }).join('') + '</select>' +
      '<label for="mm-dep">' + bi('Salida (hoy)', 'Departure (today)') + '</label><select id="mm-dep" class="mm-select">' + hours.map(function (x) { return '<option' + (x === PL.dep ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="mm-btn mm-btn-ghost" id="mm-undo"' + (PL.stops.length < 2 ? ' disabled' : '') + '>' + bi('Quitar la última', 'Remove last') + '</button>' +
      '<button type="button" class="mm-btn mm-btn-ghost" id="mm-clear"' + (PL.stops.length < 2 ? ' disabled' : '') + '>' + bi('Empezar de nuevo', 'Start over') + '</button></div>' +
      (legs.length ? '<ol class="mm-legs">' + legHtml + '</ol><p class="mm-total-line">' + bi('Total: ' + num(E.round10(total)) + ' km', 'Total: ' + num(E.round10(total)) + ' km') + '</p>' : '<p class="mm-hint">' + bi('Empiezas en Santiago. Toca otra ciudad.', 'You start in Santiago. Tap another city.') + '</p>') +
      (legs.length ? '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" id="mm-save"' + (PL.saved ? ' disabled' : '') + '>' + bi(PL.saved ? 'Viaje guardado ✓' : '¡Listo, guardar el viaje!', PL.saved ? 'Trip saved ✓' : 'Done, save the trip!') + '</button></div>' : '');
    render('plan', h, function (rt) {
      $all('.mm-cdot', rt).forEach(function (g) {
        var act = function () {
          var cid = g.getAttribute('data-city');
          if (PL.stops[PL.stops.length - 1] === cid || PL.stops.length >= 6) return;
          _sound('click'); PL.stops.push(cid); PL.saved = false; drawPlanner();
        };
        g.addEventListener('click', act);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      });
      $('#mm-dep', rt).addEventListener('change', function (e) { PL.dep = e.target.value; drawPlanner(); });
      $('#mm-add', rt).addEventListener('change', function (e) {
        var cid = e.target.value;
        if (!cid || PL.stops[PL.stops.length - 1] === cid || PL.stops.length >= 6) return;
        PL.stops.push(cid); PL.saved = false; drawPlanner();
      });
      $('#mm-undo', rt).addEventListener('click', function () { if (PL.stops.length > 1) { PL.stops.pop(); PL.saved = false; drawPlanner(); } });
      $('#mm-clear', rt).addEventListener('click', function () { PL.stops = ['scl']; PL.saved = false; drawPlanner(); });
      var sv = $('#mm-save', rt);
      if (sv) sv.addEventListener('click', function () {
        if (PL.saved) return;
        PL.saved = true;
        var before = starCount();
        data.plans = (data.plans | 0) + 1; _save(); refreshStars();
        if (starCount() > before) _sound('star'); else _sound('correct');
        logActivity('🗺️', tx('Viaje planeado: ', 'Trip planned: ') + PL.stops.map(cityName).join(' → '));
        drawPlanner();
      });
    });
  }

  // ---------------------------------------------------------------
  // Generic question round (skills and Chile)
  // ---------------------------------------------------------------
  function choicesHtml(q) {
    var cls = q.pics ? ' mm-opts-pics' : q.dirs ? ' mm-opts-dirs' : '';
    return '<div class="mm-opts' + cls + '" role="group" aria-label="' + esc(tx('Respuestas', 'Answers')) + '">' + q.choices.map(function (c, i) {
      var html = q.choiceHtml ? q.choiceHtml[i] : q.dirs ? dirChoice(c) : esc(c);
      var lbl = q.choiceText ? q.choiceText[i] : q.dirs ? dirName(c) : String(c);
      return '<button type="button" class="mm-opt" data-i="' + i + '" aria-label="' + esc(lbl) + '">' + html + '</button>';
    }).join('') + '</div>';
  }
  function dirChoice(id) {
    var deg = E.dirDeg(id);
    return '<span class="mm-arrow" style="transform:rotate(' + deg + 'deg)" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l6 9h-4v11h-4V11H6z" fill="currentColor"/></svg></span><span class="mm-opt-t">' + pair(dirPair(id)) + '</span>';
  }
  function choiceTextOf(q, i) { return q.choiceText ? q.choiceText[i] : q.dirs ? dirName(q.choices[i]) : String(q.choices[i]); }
  function bindChoices(rt, q, after) {
    var locked = false;
    $all('.mm-opt', rt).forEach(function (b) {
      b.addEventListener('click', function () {
        if (locked) return;
        locked = true;
        var i = Number(b.getAttribute('data-i')), ok = i === q.answer;
        $all('.mm-opt', rt).forEach(function (x) { var k = Number(x.getAttribute('data-i')); x.classList.add(k === q.answer ? 'right' : (x === b ? 'wrong' : 'dim')); x.disabled = true; });
        _sound(ok ? 'correct' : 'wrong');
        var ans = choiceTextOf(q, q.answer);
        var all = q.choices.map(function (c, k) { return choiceTextOf(q, k); });
        if (ok) reviewHit(q.text, ans); else reviewAdd(q.text, ans, all);
        var fb = '<div class="mm-fb ' + (ok ? 'ok' : 'no') + '" role="status"><b>' + (ok ? bi('¡Correcto!', 'Correct!') : bi('Casi. Era: ' + ans, 'Not quite. It was: ' + ans)) + '</b>' +
          (q.explain ? '<span class="mm-fb-s">' + q.explain + '</span>' : '') + '</div>';
        $('#mm-after', rt).innerHTML = fb;
        after(ok);
        try { $('#mm-after', rt).scrollIntoView({ block: 'nearest' }); } catch (e) {}
      });
    });
  }

  var RD = null;
  var ROUND_INFO = {
    sk_compass: { t: ['La brújula', 'The compass'], back: 'skills' },
    sk_latlon: { t: ['Latitud y longitud', 'Latitude and longitude'], back: 'skills' },
    sk_scale: { t: ['La escala del mapa', 'Map scale'], back: 'skills' },
    sk_profile: { t: ['Perfil del terreno', 'Cross-section'], back: 'skills' },
    sk_contour: { t: ['Curvas de nivel', 'Contour lines'], back: 'skills' },
    cl_zones: { t: ['Norte, centro y sur', 'North, centre and south'], back: 'chile' },
    cl_order: { t: ['Las regiones en orden', 'The regions in order'], back: 'chile' },
    cl_caps: { t: ['Capitales regionales', 'Regional capitals'], back: 'chile' },
    cl_ruta5: { t: ['La Ruta 5', 'The Ruta 5'], back: 'chile' },
    cl_rapa: { t: ['Misión Rapa Nui', 'Mission Easter Island'], back: 'chile' },
    cl_ant: { t: ['Misión Antártica', 'Mission Antarctica'], back: 'chile' }
  };
  function startRound(key) {
    var r = nextRand(), qs = buildRound(key, r);
    if (!qs || !qs.length) return viewHome();
    RD = { key: key, qs: qs, i: 0, right: 0, r: r };
    drawRound();
  }
  function drawRound() {
    var info = ROUND_INFO[RD.key], q = RD.qs[RD.i];
    if (!q) return roundDone();
    var h = top(info.back, pair(info.t)) + '<div class="mm-prog">' + (RD.i + 1) + ' / ' + RD.qs.length + '</div>' +
      (q.art ? '<div class="mm-q-art' + (q.artCls ? ' ' + q.artCls : '') + '">' + q.art + '</div>' : '') +
      '<div class="mm-qbox"><p class="mm-q">' + (q.html || esc(q.text)) + '</p>' + (q.hint ? '<p class="mm-hint">💡 ' + esc(q.hint) + '</p>' : '');
    if (q.order) h += orderHtml(q);
    else h += choicesHtml(q);
    h += '<div id="mm-after"></div></div>';
    render(RD.key, h, function (rt) {
      if (q.order) bindOrder(rt, q);
      else bindChoices(rt, q, function (ok) { roundAnswered(ok); });
    });
    autoSay(q.text);
  }
  function roundAnswered(ok) {
    if (ok) RD.right++;
    var more = RD.i < RD.qs.length - 1;
    $('#mm-after').insertAdjacentHTML('beforeend', '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" id="mm-next">' + bi(more ? 'Siguiente' : 'Ver resultado', more ? 'Next' : 'See result') + '</button></div>');
    $('#mm-next').addEventListener('click', function () { _sound('click'); RD.i++; drawRound(); });
  }
  function roundDone() {
    var info = ROUND_INFO[RD.key], n = RD.qs.length, stars = E.roundStars(RD.right, n);
    if (addBest(RD.key, stars)) _sound('star');
    logActivity('🧭', one(info.t) + ': ' + RD.right + ' / ' + n);
    var links = RD.key === 'sk_compass' && older() ? appLink('marinero') : RD.key.indexOf('cl_') === 0 ? appLink('chile') : RD.key === 'sk_latlon' ? appLink('atlas') : '';
    var h = top(info.back, pair(info.t)) +
      '<div class="mm-done"><div class="mm-done-stars">' + starsHtml(stars) + '</div><p class="mm-done-t">' + bi(RD.right + ' de ' + n + ' correctas', RD.right + ' of ' + n + ' right') + '</p>' +
      '<div class="mm-actions"><button type="button" class="mm-btn mm-btn-big" data-go="' + RD.key + '">' + bi('Otra ronda', 'Another round') + '</button>' +
      '<button type="button" class="mm-btn mm-btn-ghost" data-go="' + info.back + '">' + bi('Volver', 'Back') + '</button></div>' + (links ? '<p class="mm-links">' + links + '</p>' : '') + '</div>';
    render(RD.key + '-done', h);
  }

  // Order puzzle: tap the cards in order, north to south.
  function orderHtml(q) {
    return '<div class="mm-order" id="mm-order">' + q.shown.map(function (id) {
      var reg = D.REGIONS_CL.filter(function (x) { return x.id === id; })[0];
      return '<button type="button" class="mm-ocard" data-id="' + id + '"><span class="mm-onum" aria-hidden="true"></span><span><b>' + esc(one(reg.short || reg.n)) + '</b><span class="mm-ocap">' + esc(reg.cap) + '</span></span></button>';
    }).join('') + '</div><div class="mm-actions"><button type="button" class="mm-btn mm-btn-ghost" id="mm-oreset">' + bi('Borrar', 'Clear') + '</button>' +
      '<button type="button" class="mm-btn mm-btn-big" id="mm-ocheck" disabled>' + bi('Revisar', 'Check') + '</button></div>';
  }
  function bindOrder(rt, q) {
    var seq = [];
    function paint() {
      $all('.mm-ocard', rt).forEach(function (b) {
        var k = seq.indexOf(b.getAttribute('data-id'));
        b.classList.toggle('on', k >= 0);
        b.querySelector('.mm-onum').textContent = k >= 0 ? String(k + 1) : '';
        b.setAttribute('aria-pressed', k >= 0 ? 'true' : 'false');
      });
      $('#mm-ocheck', rt).disabled = seq.length !== q.shown.length;
    }
    $all('.mm-ocard', rt).forEach(function (b) {
      b.addEventListener('click', function () {
        if (q.done) return;
        var id = b.getAttribute('data-id'), k = seq.indexOf(id);
        if (k >= 0) seq.splice(k); else seq.push(id);
        _sound('click'); paint();
      });
    });
    $('#mm-oreset', rt).addEventListener('click', function () { if (!q.done) { seq = []; paint(); } });
    $('#mm-ocheck', rt).addEventListener('click', function () {
      if (q.done) return;
      q.done = true;
      var ok = seq.join() === q.answer.join();
      _sound(ok ? 'correct' : 'wrong');
      $all('.mm-ocard', rt).forEach(function (b) {
        var id = b.getAttribute('data-id'), want = q.answer.indexOf(id);
        b.disabled = true;
        b.classList.add(seq.indexOf(id) === want ? 'right' : 'wrong');
        b.style.order = String(want);
        b.querySelector('.mm-onum').textContent = String(want + 1);
      });
      $('#mm-oreset', rt).disabled = true; $('#mm-ocheck', rt).disabled = true;
      var names = q.answer.map(function (id) { var g = D.REGIONS_CL.filter(function (x) { return x.id === id; })[0]; return one(g.short || g.n); });
      if (!ok) reviewAdd(q.text + ' ' + E.shuffle(names, RD.r).join(', '), names.join(' → '));
      $('#mm-after', rt).innerHTML = '<div class="mm-fb ' + (ok ? 'ok' : 'no') + '" role="status"><b>' + (ok ? bi('¡Perfecto!', 'Perfect!') : bi('De norte a sur van así:', 'North to south they go like this:')) + '</b><span class="mm-fb-s">' + esc(names.join(' → ')) + '</span></div>';
      roundAnswered(ok);
    });
  }

  // ---------------------------------------------------------------
  // Skills
  // ---------------------------------------------------------------
  var SKILLS = [
    { id: 'sk_compass', min: 'beginner', t: ['La brújula', 'The compass'], d: ['Norte, sur, este y oeste en el mapa del valle.', 'North, south, east and west on the valley map.'], d8: ['Los 8 puntos de la rosa de los vientos y los rumbos en grados.', 'The 8 points of the compass rose and bearings in degrees.'] },
    { id: 'sk_latlon', min: 'intermediate', t: ['Latitud y longitud', 'Latitude and longitude'], d: ['Hemisferios, coordenadas y ciudades en la cuadrícula.', 'Hemispheres, coordinates and cities on the grid.'] },
    { id: 'sk_scale', min: 'intermediate', t: ['La escala del mapa', 'Map scale'], d: ['«1 cm en el mapa = ? km»: mide y multiplica.', '"1 cm on the map = ? km": measure and multiply.'] },
    { id: 'sk_profile', min: 'intermediate', t: ['Perfil del terreno', 'Cross-section'], d: ['Los Andes y el desierto de Atacama vistos de lado.', 'The Andes and the Atacama Desert seen from the side.'] },
    { id: 'sk_contour', min: 'advanced', t: ['Curvas de nivel', 'Contour lines'], d: ['Leer la altura de un cerro y dónde es más empinado.', 'Read the height of a hill and where it is steepest.'] }
  ];
  var TIER_N = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
  function allowed(min) { return TIER_N[tier] >= TIER_N[min]; }
  function viewSkills() {
    var cards = SKILLS.filter(function (s) { return allowed(s.min); }).map(function (s) {
      var art = s.id === 'sk_compass' ? A.rose({ es: isEs(), cls: 'mm-card-rose' }) : s.id === 'sk_latlon' ? latlonThumb() : s.id === 'sk_scale' ? scaleThumb() : s.id === 'sk_profile' ? A.profileChart(D.PROFILES[0], { es: isEs(), showHeights: false, names: {} }) : A.contour({ n: 5, step: 100, steep: 'E' }, { labels: false });
      return '<button type="button" class="mm-card" data-go="' + s.id + '"><span class="mm-card-art">' + art + '</span><span class="mm-card-t"><b>' + pair(s.t) + '</b><span>' + pair(tier !== 'beginner' && s.d8 ? s.d8 : s.d) + '</span></span>' + starsHtml(bestOf(s.id)) + '</button>';
    }).join('');
    var h = top('home', bi('Destrezas de mapa', 'Map skills'), little() ? bi('Aprende a leer la rosa de los vientos.', 'Learn to read the compass rose.') : bi('Cada ronda tiene 6 preguntas. Todas bien: 3 estrellas.', 'Each round has 6 questions. All right: 3 stars.')) +
      '<div class="mm-cards">' + cards + '</div>' + (older() ? '<p class="mm-links">' + appLink('marinero') + '</p>' : '');
    render('skills', h);
  }
  function latlonThumb() {
    return worldMap({ box: regionBox('world'), grid: 30, cls: 'mm-c mm-c-quiet', mapCls: 'mm-map-thumb', extra: dot(city('scl').ll, 16, 'mm-dot mm-dot-to') });
  }
  function scaleThumb() {
    return A.svg('0 0 160 70', '<rect width="160" height="70" rx="8" fill="#f4efe1"/>' + A.scaleBar(16, 22, 4, 30, 10) + A.ruler(16, 38, 4, 30), null, 'mm-art');
  }

  // The picture map of the valley (also used on its own for little kids).
  function villageMap(hiFrom, hiTo, showRose) {
    var cells = D.VILLAGE.map(function (v) {
      var cls = 'mm-vcell' + (v.id === hiFrom ? ' from' : '') + (v.id === hiTo ? ' to' : '');
      return '<div class="' + cls + '" style="grid-column:' + (v.x + 1) + ';grid-row:' + (v.y + 1) + '"><span class="mm-vart">' + A.tile(v.art) + '</span><span class="mm-vname">' + esc(one(v.n)) + '</span></div>';
    }).join('');
    return '<div class="mm-village">' + (showRose !== false ? '<div class="mm-vtop"><span class="mm-vrose">' + A.rose({ es: isEs(), cls: 'mm-rose-mini' }) + '</span><span>' + bi('El norte está arriba', 'North is at the top') + '</span></div>' : '') +
      '<div class="mm-vgrid" role="img" aria-label="' + esc(tx('Mapa del valle: el mar al oeste y la cordillera al este', 'Valley map: the sea to the west and the mountains to the east')) + '">' + cells + '</div></div>';
  }
  function vName(id) { return one(D.VILLAGE.filter(function (v) { return v.id === id; })[0].n); }
  // "de" + name, with the Spanish contraction (de + el = del).
  function ofName(id) {
    var n = vName(id);
    if (!isEs()) return 'of ' + n;
    return /^el /.test(n) ? 'del ' + n.slice(3) : 'de ' + n;
  }
  function vPair(id) { return D.VILLAGE.filter(function (v) { return v.id === id; })[0].n; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function buildRound(key, r) {
    var qs = [], i, n = little() ? 5 : 6;
    if (key === 'sk_compass') {
      var level = little() ? 4 : 8;
      for (i = 0; i < n; i++) {
        if (tier === 'expert' && i >= 4) { qs.push(bearingQText(E.bearingQ(r))); continue; }
        var q = E.compassQ(D.VILLAGE, level, r);
        if (q.kind === 'which') {
          qs.push({ text: tx('Estás en ' + vName(q.from) + '. ¿Hacia dónde queda ' + vName(q.to) + '?', 'You are at ' + vName(q.from) + '. Which way is ' + vName(q.to) + '?'),
            art: villageMap(q.from, q.to), choices: q.choices, answer: q.answer, dirs: true });
        } else {
          qs.push({ text: tx('¿Qué está al ' + dirName(q.dir) + ' ' + ofName(q.from) + '?', 'What is ' + dirName(q.dir) + ' ' + ofName(q.from) + '?'),
            art: villageMap(q.from, null), choices: q.choices, answer: q.answer, pics: true,
            choiceHtml: q.choices.map(function (id) { var v = D.VILLAGE.filter(function (x) { return x.id === id; })[0]; return '<span class="mm-opt-art">' + A.tile(v.art) + '</span><span class="mm-opt-t">' + pair(v.n) + '</span>'; }),
            choiceText: q.choices.map(function (id) { return cap(vName(id)); }) });
        }
      }
      return qs;
    }
    if (key === 'sk_latlon') {
      var cities = D.CITIES.filter(function (c) { return c.id !== 'anf'; });
      for (i = 0; i < n; i++) {
        var lv = tier === 'intermediate' ? 'hemi' : tier === 'advanced' ? (i < 2 ? 'hemi' : 'read') : (i < 3 ? 'read' : 'find');
        var lq = E.latlonQ(cities, lv, r), c = city(lq.city), map;
        if (lq.kind === 'read') {
          // zoom around the city so the 15° lines and their labels are readable
          var lb = [Math.max(-180, c.ll[0] - 50), Math.max(-75, c.ll[1] - 32), Math.min(180, c.ll[0] + 50), Math.min(80, c.ll[1] + 32)];
          var zb = lonLatBox(lb), zs = zb[2] / 400;
          map = worldMap({ box: zb, grid: 15, cls: 'mm-c mm-c-quiet', extra: gridLabels(lb, zs, 15, 30) + dot(c.ll, zs * 5, 'mm-dot mm-dot-to') + label(c.ll, cityName(c.id), zs * 13, zs * 7, zs * 4) });
        } else {
          var wb = regionBox('world'), ws = wb[2] / 400;
          map = worldMap({ box: wb, grid: 30, cls: 'mm-c mm-c-quiet', extra: gridLabels([-180, -60, 180, 84], ws, 30) + (lq.kind === 'find' ? '' : dot(c.ll, ws * 5, 'mm-dot mm-dot-to') + label(c.ll, cityName(c.id), ws * 13, ws * 7, ws * 4)) });
        }
        if (lq.kind === 'ns') qs.push({ text: tx('¿' + cityName(c.id) + ' está al norte o al sur del ecuador?', 'Is ' + cityName(c.id) + ' north or south of the equator?'), art: map, choices: ['N', 'S'], answer: lq.answer, dirs: true });
        else if (lq.kind === 'ew') qs.push({ text: tx('¿' + cityName(c.id) + ' está al este o al oeste del meridiano de Greenwich (0°)?', 'Is ' + cityName(c.id) + ' east or west of the Greenwich meridian (0°)?'), art: map, choices: ['E', 'O'], answer: lq.answer, dirs: true });
        else if (lq.kind === 'read') qs.push({ text: tx('¿Cuáles son las coordenadas de ' + cityName(c.id) + '? (las líneas van cada 15°)', 'What are the coordinates of ' + cityName(c.id) + '? (the lines are every 15°)'), art: map,
          choices: lq.choices.map(function (ll) { return E.fmtLL(ll, isEs()); }), answer: lq.answer });
        else qs.push({ text: tx('¿Qué ciudad está cerca de ' + E.fmtLL(lq.ll, true) + '?', 'Which city is near ' + E.fmtLL(lq.ll, false) + '?'), art: map,
          choices: lq.choices.map(cityName), answer: lq.answer });
      }
      return qs;
    }
    if (key === 'sk_scale') {
      for (i = 0; i < n; i++) {
        var sl = tier === 'intermediate' ? 'blocks' : tier === 'advanced' ? (i < 3 ? 'cm' : 'two') : ['cm', 'two', 'ratio', 'ratio', 'back', 'back'][i];
        qs.push(scaleQText(E.scaleQ(sl, r), r));
      }
      return qs;
    }
    if (key === 'sk_profile') {
      for (i = 0; i < n; i++) {
        var p = D.PROFILES[i % 2 ? 1 : 0], pq;
        var tries = 0;
        do { pq = E.profileQ(p, r); } while (tier === 'intermediate' && ['highest', 'higher', 'height'].indexOf(pq.kind) < 0 && tries++ < 30);
        qs.push(profileQText(p, pq));
      }
      return qs;
    }
    if (key === 'sk_contour') {
      for (i = 0; i < n; i++) qs.push(contourQText(E.contourQ(r)));
      return qs;
    }
    if (key === 'cl_zones') return zonesRound(r, n);
    if (key === 'cl_order') {
      var k = tier === 'intermediate' ? 4 : tier === 'advanced' ? 5 : 6;
      for (i = 0; i < 3; i++) {
        var op = E.orderPuzzle(D.REGIONS_CL, k, r);
        qs.push({ order: true, shown: op.shown, answer: op.answer, text: tx('Toca las regiones en orden, de norte a sur.', 'Tap the regions in order, from north to south.'), art: chileMap({ dots: op.answer, names: false }), artCls: 'mm-q-art-chile' });
      }
      return qs;
    }
    if (key === 'cl_caps') {
      var regs = E.pickN(D.REGIONS_CL, n, r);
      regs.forEach(function (g, j) {
        var others = E.pickN(D.REGIONS_CL.filter(function (x) { return x !== g; }), 3, r);
        if (j % 2) {
          var cs = E.choiceSet(g.cap, others.map(function (x) { return x.cap; }), r, 4);
          qs.push({ text: tx('¿Cuál es la capital de la región de ' + one(g.short || g.n) + '?', 'What is the capital of the ' + one(g.short || g.n) + ' region?'), art: chileMap({ dots: [g.id], hi: g.id }), artCls: 'mm-q-art-chile', choices: cs.choices, answer: cs.answer, explain: esc(one(g.f)) });
        } else {
          var cs2 = E.choiceSet(g.id, others.map(function (x) { return x.id; }), r, 4);
          qs.push({ text: tx(g.cap + ' es la capital de la región de…', g.cap + ' is the capital of the region of…'), art: chileMap({ dots: [g.id], hi: g.id }), artCls: 'mm-q-art-chile',
            choices: cs2.choices, choiceText: cs2.choices.map(function (id) { var x = D.REGIONS_CL.filter(function (y) { return y.id === id; })[0]; return one(x.short || x.n); }), answer: cs2.answer, explain: esc(one(g.f)) });
        }
      });
      return qs;
    }
    if (key === 'cl_ruta5') {
      for (i = 0; i < n; i++) {
        if (tier === 'intermediate' || i < 2) {
          var nq = E.northQ(D.RUTA5, r), a = rutaCity(nq.choices[0]), b = rutaCity(nq.choices[1]);
          qs.push({ text: tx('¿Qué ciudad está más al norte?', 'Which city is farther north?'), art: ruta5Map([a.id, b.id]), artCls: 'mm-q-art-chile', choices: [a.n, b.n], answer: nq.answer,
            explain: esc(tx('En Chile, ir al norte es ir hacia Arica; ir al sur, hacia Chiloé.', 'In Chile, going north means towards Arica; going south, towards Chiloé.')) });
          continue;
        }
        var rq = E.ruta5Q(D.RUTA5, tier === 'expert' && i >= 4 ? 'time' : 'km', r), ra = rutaCity(rq.a), rb = rutaCity(rq.b);
        var kmTxt = function (c) { return c.km ? num(c.km) + ' km ' + tx(c.side === 'n' ? 'al norte de Santiago' : 'al sur de Santiago', c.side === 'n' ? 'north of Santiago' : 'south of Santiago') : tx('el kilómetro 0', 'kilometre 0'); };
        var info = tx(ra.n + ': ' + kmTxt(ra) + '. ' + rb.n + ': ' + kmTxt(rb) + '.', ra.n + ': ' + kmTxt(ra) + '. ' + rb.n + ': ' + kmTxt(rb) + '.');
        if (rq.kind === 'km') qs.push({ text: info + ' ' + tx('¿Cuántos km hay por la Ruta 5 entre ' + ra.n + ' y ' + rb.n + '?', 'How many km is it along the Ruta 5 from ' + ra.n + ' to ' + rb.n + '?'), art: ruta5Map([ra.id, rb.id]), artCls: 'mm-q-art-chile',
          choices: rq.choices.map(function (x) { return num(x) + ' km'; }), answer: rq.answer,
          hint: ra.side !== rb.side && ra.km && rb.km ? tx('Una está al norte y la otra al sur de Santiago: suma.', 'One is north and the other south of Santiago: add.') : tx('Las dos están del mismo lado de Santiago: resta.', 'Both are on the same side of Santiago: subtract.') });
        else qs.push({ text: tx('De ' + ra.n + ' a ' + rb.n + ' hay ' + num(rq.km) + ' km por la Ruta 5. Si vas a ' + rq.speed + ' km por hora, ¿cuántas horas manejas? (redondea a la media hora)', 'From ' + ra.n + ' to ' + rb.n + ' is ' + num(rq.km) + ' km along the Ruta 5. At ' + rq.speed + ' km an hour, how many hours do you drive? (round to the half hour)'),
          art: ruta5Map([ra.id, rb.id]), artCls: 'mm-q-art-chile', choices: rq.choices.map(function (x) { return E.fmtDuration(Math.round(x * 60)); }), answer: rq.answer });
      }
      return qs;
    }
    if (key === 'cl_rapa') return rapaRound(r);
    if (key === 'cl_ant') return antRound(r);
    return qs;
  }
  function bearingQText(q) {
    if (q.kind === 'deg2dir') return { text: tx('Un barco navega con rumbo ' + q.deg + '°. ¿Hacia dónde va?', 'A ship sails on a bearing of ' + q.deg + '°. Which way is it going?'), art: A.rose({ es: isEs(), cls: 'mm-rose-q' }), artCls: 'mm-q-art-rose', choices: q.choices, answer: q.answer, dirs: true,
      explain: esc(tx('El rumbo se mide desde el norte (0°) en el sentido del reloj: este 90°, sur 180°, oeste 270°.', 'Bearings are measured from north (0°) clockwise: east 90°, south 180°, west 270°.')) };
    return { text: tx('¿Qué rumbo en grados es el ' + dirName(q.dir) + '?', 'What bearing in degrees is ' + dirName(q.dir) + '?'), art: A.rose({ es: isEs(), cls: 'mm-rose-q' }), artCls: 'mm-q-art-rose', choices: q.choices.map(function (d) { return d + '°'; }), answer: q.answer };
  }
  // Labels for the grid lines inside a lon/lat box (on its west and south edges).
  function gridLabels(b, sw, step, lonStep) {
    var out = '', fs = sw * 10.5, lat, lon;
    lonStep = lonStep || step;
    for (lat = Math.ceil(b[1] / step) * step; lat <= b[3]; lat += step) {
      if (lat <= -90 || lat >= 90) continue;
      var p = WM.project(Math.max(-179.5, b[0] + (b[2] - b[0]) * 0.01), lat);
      out += '<text class="mm-glbl' + (lat === 0 ? ' eq' : '') + '" x="' + (p[0] + sw * 3).toFixed(1) + '" y="' + (p[1] - sw * 2).toFixed(1) + '" font-size="' + fs.toFixed(1) + '" stroke-width="' + (fs / 3.5).toFixed(1) + '">' +
        (lat ? Math.abs(lat) + '° ' + (lat < 0 ? 'S' : 'N') : (isEs() ? 'Ecuador 0°' : 'Equator 0°')) + '</text>';
    }
    for (lon = Math.ceil(b[0] / lonStep) * lonStep; lon <= b[2]; lon += lonStep) {
      if (lon <= -180 || lon >= 180 || lon === b[0]) continue;
      var q = WM.project(lon, b[1] + (b[3] - b[1]) * 0.04);
      out += '<text class="mm-glbl" x="' + q[0].toFixed(1) + '" y="' + q[1].toFixed(1) + '" font-size="' + fs.toFixed(1) + '" stroke-width="' + (fs / 3.5).toFixed(1) + '" text-anchor="middle">' +
        (lon ? Math.abs(lon) + '° ' + (lon < 0 ? (isEs() ? 'O' : 'W') : 'E') : '0°') + '</text>';
    }
    return out;
  }
  function scaleQText(q, r) {
    var U = 30, cm = q.cm + (q.cm2 || 0), W = Math.max(260, cm * U + 70), out = '<rect width="' + W + '" height="150" rx="10" fill="#f4efe1"/>';
    // a simple map: two towns on a road, a river and hills
    out += '<path d="M0,120Q' + (W * .3) + ',95 ' + (W * .55) + ',118T' + W + ',108" stroke="#7cb3d9" stroke-width="7" fill="none"/>';
    for (var i = 0; i < 5; i++) out += '<path d="M' + (20 + i * W / 5) + ',40l9,-14l9,14z" fill="#b9c79a"/>';
    var x0 = 30, y = 70, x1 = x0 + q.cm * U, x2 = x1 + (q.cm2 || 0) * U;
    if (q.cm2) out += '<path d="M' + x0 + ',' + y + 'L' + x1 + ',' + (y - 22) + 'L' + x2 + ',' + y + '" stroke="#c0392b" stroke-width="3" fill="none" stroke-dasharray="7 4"/>';
    else out += '<path d="M' + x0 + ',' + y + 'H' + x1 + '" stroke="#c0392b" stroke-width="3" stroke-dasharray="7 4"/>';
    out += '<circle cx="' + x0 + '" cy="' + y + '" r="6" fill="#1d4ed8" stroke="#fff" stroke-width="2"/><text x="' + x0 + '" y="' + (y - 10) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2937">A</text>';
    if (q.cm2) out += '<circle cx="' + x1 + '" cy="' + (y - 22) + '" r="5" fill="#f59e0b" stroke="#fff" stroke-width="2"/><text x="' + x1 + '" y="' + (y - 32) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2937">B</text>';
    var last = q.cm2 ? x2 : x1;
    out += '<circle cx="' + last + '" cy="' + y + '" r="6" fill="#c0392b" stroke="#fff" stroke-width="2"/><text x="' + last + '" y="' + (y - 10) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2937">' + (q.cm2 ? 'C' : 'B') + '</text>';
    if (q.kind === 'blocks') out += A.scaleBar(x0, y + 22, q.cm, U, q.per) + '<text x="' + (x0 + q.cm * U + 8) + '" y="' + (y + 28) + '" font-size="10" font-weight="700" fill="#1f2937">km</text>';
    else if (q.kind !== 'back') {
      if (!q.cm2) out += A.ruler(x0, y + 12, q.cm, U);
      else out += '<text x="' + ((x0 + x1) / 2) + '" y="' + (y - 18) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#8e1f14">' + q.cm + ' cm</text><text x="' + ((x1 + x2) / 2 + 8) + '" y="' + (y - 18) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#8e1f14">' + q.cm2 + ' cm</text>';
    }
    var art = A.svg('0 0 ' + W + ' 150', out, tx('Mapa con escala', 'Map with a scale'), 'mm-scale-art');
    var res = { art: art, answer: q.answer, artCls: 'mm-q-art-scale' };
    var kmC = q.choices.map(function (x) { return num(x) + ' km'; });
    if (q.kind === 'blocks') { res.text = tx('Cada cuadro de la barra de escala vale ' + q.per + ' km. ¿Cuántos km hay de A a B?', 'Each block of the scale bar is ' + q.per + ' km. How many km is it from A to B?'); res.choices = kmC; }
    else if (q.kind === 'cm') { res.text = tx('En este mapa, 1 cm = ' + q.per + ' km. Mide la línea de A a B con la regla. ¿Cuántos km son?', 'On this map, 1 cm = ' + q.per + ' km. Measure the line from A to B with the ruler. How many km is it?'); res.choices = kmC; }
    else if (q.kind === 'two') { res.text = tx('1 cm = ' + q.per + ' km. El camino va de A a B (' + q.cm + ' cm) y de B a C (' + q.cm2 + ' cm). ¿Cuántos km recorres en total?', '1 cm = ' + q.per + ' km. The road goes from A to B (' + q.cm + ' cm) and from B to C (' + q.cm2 + ' cm). How many km do you travel in all?'); res.choices = kmC; }
    else if (q.kind === 'ratio') { res.text = tx('La escala del mapa es 1:' + num(q.den) + '. La línea de A a B mide ' + q.cm + ' cm. ¿Cuántos km son en la realidad?', 'The map scale is 1:' + num(q.den) + '. The line from A to B measures ' + q.cm + ' cm. How many km is that in real life?'); res.choices = kmC; res.hint = tx('1 km = 100.000 cm', '1 km = 100,000 cm'); }
    else { res.text = tx('En este mapa, 1 cm = ' + q.per + ' km. Dos pueblos están a ' + num(q.km) + ' km. ¿Cuántos cm los separan en el mapa?', 'On this map, 1 cm = ' + q.per + ' km. Two towns are ' + num(q.km) + ' km apart. How many cm apart are they on the map?'); res.choices = q.choices.map(function (x) { return num(x) + ' cm'; }); }
    return res;
  }
  function profileQText(p, q) {
    var names = {};
    p.marks.forEach(function (m) { names[m.id] = one(m.n); });
    var mk = function (id) { return p.marks.filter(function (m) { return m.id === id; })[0]; };
    var hide = q.kind === 'height' ? q.mark : null;
    var art = '<p class="mm-cap"><b>' + pair(p.t) + '</b> · ' + pair(p.s) + '</p>' + A.profileChart(p, { es: isEs(), names: names, highlight: q.kind === 'height' ? [q.mark] : q.kind === 'diff' || q.kind === 'dist' ? [q.a, q.b] : [], hideHeight: hide, label: one(p.t) });
    var res = { art: art, artCls: 'mm-q-art-profile', answer: q.answer };
    var m2 = function (x) { return num(x) + ' m'; };
    if (q.kind === 'highest') { res.text = tx('¿Cuál es el punto más alto de este perfil?', 'What is the highest point on this cross-section?'); res.choices = q.choices.map(function (id) { return names[id]; }); }
    else if (q.kind === 'height') { res.text = tx('Mira la escala de metros. ¿A qué altura está ' + names[q.mark] + ', más o menos?', 'Look at the metres scale. About how high is ' + names[q.mark] + '?'); res.choices = q.choices.map(m2); res.explain = esc(names[q.mark] + ': ' + m2(mk(q.mark).m)); }
    else if (q.kind === 'diff') { res.text = tx('¿Cuántos metros más alto es ' + names[q.a] + ' que ' + names[q.b] + '?', 'How many metres higher is ' + names[q.a] + ' than ' + names[q.b] + '?'); res.choices = q.choices.map(m2); res.hint = m2(mk(q.a).m) + ' − ' + m2(mk(q.b).m); }
    else if (q.kind === 'higher') { res.text = tx('¿Qué lugar está más alto?', 'Which place is higher?'); res.choices = q.choices.map(function (id) { return names[id]; }); }
    else { res.text = tx('En el dibujo, ¿cuántos km hay entre ' + names[q.a] + ' y ' + names[q.b] + '?', 'In the drawing, how many km are there between ' + names[q.a] + ' and ' + names[q.b] + '?'); res.choices = q.choices.map(function (x) { return num(x) + ' km'; }); }
    return res;
  }
  function contourQText(q) {
    var art = A.contour(q, { label: tx('Mapa de curvas de nivel de un cerro', 'Contour map of a hill') });
    var res = { art: art, artCls: 'mm-q-art-contour', answer: q.answer };
    var intro = tx('Cada línea es ' + q.step + ' m más alta que la anterior; la orilla del mapa está a 0 m. ', 'Each line is ' + q.step + ' m higher than the one before; the edge of the map is at 0 m. ');
    if (q.kind === 'top') { res.text = intro + tx('¿A qué altura está la cumbre (el triángulo), más o menos?', 'About how high is the summit (the triangle)?'); res.choices = q.choices.map(function (x) { return num(x) + ' m'; }); res.hint = tx('Cuenta las líneas.', 'Count the lines.'); }
    else if (q.kind === 'steep') { res.text = tx('¿Por qué lado del cerro la subida es más empinada?', 'On which side of the hill is the climb steepest?'); res.choices = q.choices; res.dirs = true; res.explain = esc(tx('Donde las líneas están más juntas, el terreno sube más rápido.', 'Where the lines are closest together, the ground rises fastest.')); }
    else { res.text = intro + tx('¿A qué altura está el punto rojo?', 'How high is the red dot?'); res.choices = q.choices.map(function (x) { return num(x) + ' m'; }); }
    return res;
  }

  // ---------------------------------------------------------------
  // Chile
  // ---------------------------------------------------------------
  var CHILE_BOX = null;
  function chileBox() { return CHILE_BOX || (CHILE_BOX = lonLatBox([-78, -56, -62, -17])); }
  function chileBase(extra, box) {
    var b = box || chileBox(), sw = b[2] / 160;
    var neigh = ['arg', 'bol', 'per', 'pry', 'bra', 'ury'].map(function (c) { return '<path class="mm-c mm-c-quiet" d="' + WM.path(c) + '"/>'; }).join('');
    return '<svg class="mm-map mm-map-chile" viewBox="' + b.map(function (v) { return v.toFixed(1); }).join(' ') + '" preserveAspectRatio="xMidYMid meet" style="--sw:' + sw.toFixed(2) + '">' +
      '<rect x="' + (b[0] - 10) + '" y="' + (b[1] - 10) + '" width="' + (b[2] + 20) + '" height="' + (b[3] + 20) + '" class="mm-sea"/><g class="mm-land" stroke-width="' + (sw * .5).toFixed(2) + '">' + neigh +
      '<path class="mm-c mm-c-chile" d="' + WM.path('chl') + '"/></g>' + (extra || '') + '</svg>';
  }
  // opts: { dots:[regionIds], hi: id, names: bool }
  function chileMap(opts) {
    var sw = chileBox()[2] / 160, extra = '';
    (opts.dots || []).forEach(function (id) {
      var g = D.REGIONS_CL.filter(function (x) { return x.id === id; })[0];
      extra += dot(g.ll, sw * (opts.hi === id ? 3.4 : 2.4), 'mm-dot' + (opts.hi === id ? ' mm-dot-to' : ''));
      if (opts.names) extra += label(g.ll, g.cap, sw * 5, sw * 4, sw * 1.6);
    });
    extra += label([-76.5, -50], tx('Océano Pacífico', 'Pacific Ocean'), sw * 4.2, 0, 0, 'mm-lbl mm-lbl-sea');
    return chileBase(extra);
  }
  function rutaCity(id) { return D.RUTA5.filter(function (x) { return x.id === id; })[0]; }
  function ruta5Map(hi) {
    var b = lonLatBox([-78, -45, -62, -17]), sw = b[2] / 160, pts = D.RUTA5.map(function (c) { return WM.project(c.ll[0], c.ll[1]); });
    var extra = '<path class="mm-ruta" d="M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L') + '" stroke-width="' + (sw * 1.4).toFixed(2) + '"/>';
    D.RUTA5.forEach(function (c) {
      var on = hi.indexOf(c.id) >= 0;
      extra += dot(c.ll, sw * (on ? 2.6 : 1.4), 'mm-dot' + (on ? ' mm-dot-to' : ' mm-dot-small'));
      if (on || c.id === 'scl') extra += label(c.ll, c.n, sw * 4.6, sw * 3.4, sw * 1.4);
    });
    return chileBase(extra, b);
  }
  function zonesRound(r, n) {
    var qs = [], things = E.pickN(D.ZONE_THINGS, n, r);
    things.forEach(function (t) {
      var cs = E.choiceSet(t.z, E.shuffle(D.ZONES.map(function (z) { return z.id; }).filter(function (x) { return x !== t.z; }), r), r, 4);
      qs.push({ text: tx('¿En qué parte de Chile encuentras ' + one(t.n) + '?', 'Where in Chile do you find ' + one(t.n) + '?'), art: '<div class="mm-thing">' + A.thing(t.art, one(t.n)) + '</div>', artCls: 'mm-q-art-thing',
        choices: cs.choices, answer: cs.answer, pics: true,
        choiceHtml: cs.choices.map(function (id) { var z = D.ZONES.filter(function (x) { return x.id === id; })[0]; return '<span class="mm-opt-art">' + A.zone(z.art) + '</span><span class="mm-opt-t">' + pair(z.n) + '</span>'; }),
        choiceText: cs.choices.map(function (id) { return one(D.ZONES.filter(function (x) { return x.id === id; })[0].n); }),
        explain: esc(one(D.ZONES.filter(function (x) { return x.id === t.z; })[0].d)) });
    });
    return qs;
  }
  function placeLL(id) { return D.PLACES[id].ll; }
  function specialMap(ids, box, line) {
    var b = lonLatBox(box), sw = b[2] / 400, extra = '';
    if (line) extra += '<path class="mm-route" d="' + lineD(WM.greatCircle(placeLL(line[0]), placeLL(line[1]), 40)) + '" stroke-width="' + (sw * 3).toFixed(2) + '" stroke-dasharray="' + (sw * 8).toFixed(1) + ' ' + (sw * 5).toFixed(1) + '"/>';
    ids.forEach(function (id) { extra += dot(placeLL(id), sw * 5, 'mm-dot mm-dot-to') + label(placeLL(id), one(D.PLACES[id].n), sw * 13, sw * 7, sw * 4); });
    return worldMap({ box: b, extra: extra, cls: 'mm-c mm-c-quiet' });
  }
  function kmChoices(km, r) {
    var k = Math.round(km / 100) * 100;
    return E.choiceSet(k, [k + 1000, Math.max(100, k - 1000), k * 2, Math.round(k / 2 / 100) * 100].filter(function (x) { return x !== k; }), r, 4);
  }
  function rapaRound(r) {
    var qs = [], scl = placeLL('scl'), ipc = placeLL('ipc'), km = E.distanceKm(scl, ipc), box = [-115, -40, -62, -15];
    var easy = !older();
    var cs = E.choiceSet('O', ['N', 'S', 'E'], r, 4);
    qs.push({ text: tx('Rapa Nui es parte de Chile, en medio del océano Pacífico. Desde Santiago, ¿hacia dónde queda?', 'Easter Island belongs to Chile, in the middle of the Pacific Ocean. From Santiago, which way is it?'), art: specialMap(['scl', 'ipc'], box, ['scl', 'ipc']), choices: cs.choices, answer: cs.answer, dirs: true });
    if (little()) {
      var th = E.choiceSet('moai', ['penguin', 'llama', 'grapes'], r, 4), thN = {};
      D.ZONE_THINGS.forEach(function (z) { thN[z.art] = z.n; });
      qs.push({ text: tx('¿Qué encuentras en Rapa Nui?', 'What do you find on Easter Island?'), art: '<div class="mm-thing">' + A.zone('moai', tx('Rapa Nui', 'Easter Island')) + '</div>', artCls: 'mm-q-art-thing', pics: true,
        choices: th.choices, answer: th.answer, choiceHtml: th.choices.map(function (k) { return '<span class="mm-opt-art">' + A.thing(k) + '</span><span class="mm-opt-t">' + pair(thN[k]) + '</span>'; }),
        choiceText: th.choices.map(function (k) { return cap(one(thN[k])); }) });
      var isl = E.choiceSet('i', ['n', 'c', 's'], r, 4);
      qs.push({ text: tx('Rapa Nui está rodeada de mar por todos lados. ¿Qué es?', 'Easter Island has sea all around it. What is it?'), art: specialMap(['ipc'], box), pics: true,
        choices: isl.choices, answer: isl.answer, choiceHtml: isl.choices.map(function (id) { var z = D.ZONES.filter(function (x) { return x.id === id; })[0]; return '<span class="mm-opt-art">' + A.zone(z.art) + '</span><span class="mm-opt-t">' + (id === 'i' ? bi('Una isla', 'An island') : pair(z.n)) + '</span>'; }),
        choiceText: isl.choices.map(function (id) { return id === 'i' ? tx('Una isla', 'An island') : one(D.ZONES.filter(function (x) { return x.id === id; })[0].n); }) });
      return qs;
    }
    var ck = kmChoices(km, r);
    qs.push({ text: tx('¿Cuántos km hay en línea recta de Santiago a Hanga Roa, más o menos?', 'About how many km is it in a straight line from Santiago to Hanga Roa?'), art: specialMap(['scl', 'ipc'], box, ['scl', 'ipc']), choices: ck.choices.map(function (x) { return num(x) + ' km'; }), answer: ck.answer,
      explain: esc(tx('Son unos ' + num(E.round10(km)) + ' km: casi la misma distancia que de Arica a Punta Arenas.', 'It is about ' + num(E.round10(km)) + ' km: almost as far as from Arica to Punta Arenas.')) });
    var csz = E.choiceSet(2, [1, 3, 0], r, 4);
    qs.push({ text: tx('En Rapa Nui los relojes marcan menos que en Santiago. ¿Cuántas horas de diferencia hay?', 'On Easter Island the clocks are behind Santiago. How many hours behind?'), art: '<div class="mm-thing">' + A.zone('moai', tx('Moáis en Rapa Nui', 'Moai on Easter Island')) + '</div>', artCls: 'mm-q-art-thing',
      choices: csz.choices.map(function (x) { return x + ' h'; }), answer: csz.answer, explain: esc(tx('Todo el año, Rapa Nui va 2 horas detrás de Santiago: cuando en Santiago son las 12:00, allá son las 10:00.', 'All year, Easter Island is 2 hours behind Santiago: when it is 12:00 in Santiago, it is 10:00 there.')) });
    var mins = E.flightMinutes(km), cf = E.flightChoices(mins, r);
    qs.push({ text: easy ? tx('El avión vuela unos 800 km cada hora. ¿Cuántas horas tarda, más o menos, en llegar a Rapa Nui?', 'The plane flies about 800 km each hour. About how many hours does it take to reach Easter Island?') :
      tx('Con la regla del piloto (800 km por hora + media hora), ¿cuánto dura el vuelo de ' + num(E.round10(km)) + ' km?', 'With the pilot\'s rule (800 km an hour + half an hour), how long is the ' + num(E.round10(km)) + ' km flight?'),
      art: specialMap(['scl', 'ipc'], box, ['scl', 'ipc']), choices: cf.choices.map(function (m) { return E.fmtDuration(m); }), answer: cf.answer });
    var t = E.addClock('09:00', mins - 120), ca = E.choiceSet(t.t, [E.addClock('09:00', mins).t, E.addClock('09:00', mins - 60).t, E.addClock('09:00', mins + 120).t], r, 4);
    if (!easy) qs.push({ text: tx('Sales de Santiago a las 09:00 y el vuelo dura ' + E.fmtDuration(mins) + '. ¿Qué hora marcan los relojes de Rapa Nui cuando llegas?', 'You leave Santiago at 09:00 and the flight takes ' + E.fmtDuration(mins) + '. What time do the clocks on Easter Island show when you land?'),
      art: '<div class="mm-thing">' + A.zone('moai') + '</div>', artCls: 'mm-q-art-thing', choices: ca.choices, answer: ca.answer, hint: tx('Suma el vuelo y resta 2 horas.', 'Add the flight, then take away 2 hours.') });
    var cr = E.choiceSet('va', ['rm', 'at', 'mg'], r, 4);
    qs.push({ text: tx('¿De qué región de Chile es parte Rapa Nui?', 'Which region of Chile does Easter Island belong to?'), art: '<div class="mm-thing">' + A.zone('moai') + '</div>', artCls: 'mm-q-art-thing',
      choices: cr.choices, choiceText: cr.choices.map(function (id) { var g = D.REGIONS_CL.filter(function (x) { return x.id === id; })[0]; return one(g.short || g.n); }), answer: cr.answer,
      explain: esc(tx('Rapa Nui y el archipiélago de Juan Fernández son parte de la región de Valparaíso.', 'Easter Island and the Juan Fernández Islands are part of the Valparaíso region.')) });
    return qs;
  }
  function antRound(r) {
    var qs = [], box = [-84, -66, -38, -46], km = E.distanceKm(placeLL('pnt'), placeLL('vle'));
    var cs = E.choiceSet('SE', ['NE', 'SO', 'NO'], r, 4);
    qs.push({ text: tx('Villa Las Estrellas es un pueblo chileno en la Antártica, en la isla Rey Jorge. Desde Punta Arenas, ¿hacia dónde queda?', 'Villa Las Estrellas is a Chilean village in Antarctica, on King George Island. From Punta Arenas, which way is it?'),
      art: specialMap(['pnt', 'vle'], box, ['pnt', 'vle']), choices: cs.choices, answer: cs.answer, dirs: true });
    var ck = kmChoices(km, r);
    qs.push({ text: tx('¿Cuántos km hay en línea recta de Punta Arenas a Villa Las Estrellas, más o menos?', 'About how many km is it in a straight line from Punta Arenas to Villa Las Estrellas?'), art: specialMap(['pnt', 'vle'], box, ['pnt', 'vle']),
      choices: ck.choices.map(function (x) { return num(x) + ' km'; }), answer: ck.answer, explain: esc(tx('Son unos ' + num(E.round10(km)) + ' km.', 'It is about ' + num(E.round10(km)) + ' km.')) });
    var csea = E.choiceSet('drake', ['magallanes', 'beagle', 'panama'], r, 4), seaN = { drake: ['el paso Drake', 'the Drake Passage'], magallanes: ['el estrecho de Magallanes', 'the Strait of Magellan'], beagle: ['el canal Beagle', 'the Beagle Channel'], panama: ['el canal de Panamá', 'the Panama Canal'] };
    qs.push({ text: tx('Entre el cabo de Hornos y la Antártica hay un mar muy movido. ¿Cómo se llama?', 'Between Cape Horn and Antarctica there is a very rough sea. What is it called?'), art: specialMap(['horn', 'vle'], box, ['horn', 'vle']),
      choices: csea.choices, choiceText: csea.choices.map(function (k) { return cap(one(seaN[k])); }), answer: csea.answer });
    var cl = E.choiceSet('S', ['N', 'E', 'O'], r, 4);
    qs.push({ text: tx('El cabo de Hornos es la punta más austral de América. ¿Austral quiere decir…?', 'Cape Horn is the southernmost tip of the Americas. Southernmost means farthest…?'), art: specialMap(['horn'], box), choices: cl.choices, answer: cl.answer, dirs: true });
    if (older()) {
      var ll = placeLL('vle'), lq = E.choiceSet(E.fmtLL([Math.round(ll[0]), Math.round(ll[1])], isEs()), [E.fmtLL([59, -62], isEs()), E.fmtLL([-59, 62], isEs()), E.fmtLL([-70, -53], isEs())], r, 4);
      qs.push({ text: tx('¿Cuáles son las coordenadas aproximadas de Villa Las Estrellas?', 'What are the approximate coordinates of Villa Las Estrellas?'), art: specialMap(['vle'], box), choices: lq.choices, answer: lq.answer });
      var lat = Math.abs(ll[1]), csp = E.choiceSet(90 - Math.round(lat), [Math.round(lat), 90, 180 - Math.round(lat)], r, 4);
      qs.push({ text: tx('Villa Las Estrellas está a unos ' + Math.round(lat) + '° S. El polo sur está a 90° S. ¿Cuántos grados de latitud faltan para llegar al polo?', 'Villa Las Estrellas is at about ' + Math.round(lat) + '° S. The South Pole is at 90° S. How many degrees of latitude are left to reach the pole?'),
        art: specialMap(['vle'], box), choices: csp.choices.map(function (x) { return x + '°'; }), answer: csp.answer, explain: esc(tx('Cada grado de latitud son unos 111 km.', 'Each degree of latitude is about 111 km.')) });
    }
    return qs;
  }
  var CHILE_ITEMS = [
    { id: 'cl_zones', min: 'beginner', max: 'beginner', t: ['Norte, centro y sur', 'North, centre and south'], d: ['¿Dónde viven los pingüinos? ¿Y las llamas?', 'Where do the penguins live? And the llamas?'], art: function () { return A.zone('desert'); } },
    { id: 'cl_order', min: 'intermediate', t: ['Las regiones en orden', 'The regions in order'], d: ['Las 16 regiones, de Arica y Parinacota a Magallanes.', 'The 16 regions, from Arica y Parinacota to Magallanes.'], art: function () { return chileMap({ dots: D.REGIONS_CL.map(function (g) { return g.id; }) }); } },
    { id: 'cl_caps', min: 'intermediate', t: ['Capitales regionales', 'Regional capitals'], d: ['Cada región tiene su capital. ¿Cuál es cuál?', 'Each region has a capital. Which is which?'], art: function () { return chileMap({ dots: ['rm'], hi: 'rm' }); } },
    { id: 'cl_ruta5', min: 'intermediate', t: ['La Ruta 5', 'The Ruta 5'], d: ['La carretera que recorre Chile de norte a sur: distancias y horas de viaje.', 'The highway that runs the length of Chile: distances and driving times.'], art: function () { return ruta5Map(['scl']); } },
    { id: 'cl_rapa', min: 'beginner', t: ['Misión Rapa Nui', 'Mission Easter Island'], d: ['La isla de los moáis, en medio del Pacífico.', 'The island of the moai, in the middle of the Pacific.'], art: function () { return A.zone('moai'); } },
    { id: 'cl_ant', min: 'intermediate', t: ['Misión Antártica', 'Mission Antarctica'], d: ['De Punta Arenas a Villa Las Estrellas, cruzando el paso Drake.', 'From Punta Arenas to Villa Las Estrellas, across the Drake Passage.'], art: function () { return A.zone('glacier'); } }
  ];
  function viewChile() {
    var items = CHILE_ITEMS.filter(function (c) { return allowed(c.min) && (!c.max || TIER_N[tier] <= TIER_N[c.max]); });
    var cards = items.map(function (c) {
      return '<button type="button" class="mm-card" data-go="' + c.id + '"><span class="mm-card-art' + (/order|caps|ruta5/.test(c.id) ? ' mm-card-art-chile' : '') + '">' + c.art() + '</span><span class="mm-card-t"><b>' + pair(c.t) + '</b><span>' + pair(c.d) + '</span></span>' + starsHtml(bestOf(c.id)) + '</button>';
    }).join('');
    var regList = little() ? '' : '<details class="mm-reglist"><summary>' + bi('Las 16 regiones, de norte a sur', 'The 16 regions, north to south') + '</summary><ol>' + D.REGIONS_CL.map(function (g) {
      return '<li><b>' + esc(one(g.n)) + '</b> · ' + esc(g.cap) + '<span>' + esc(one(g.f)) + '</span></li>';
    }).join('') + '</ol></details>';
    var h = top('home', bi('Misión Chile', 'Mission Chile'), little() ? bi('Chile es largo y angosto: tiene norte, centro, sur y una isla lejana.', 'Chile is long and narrow: it has a north, a centre, a south and a faraway island.') : bi('Chile mide más de 4.000 km de norte a sur.', 'Chile is more than 4,000 km long from north to south.')) +
      '<div class="mm-cards">' + cards + '</div>' + regList + '<p class="mm-links">' + appLink('chile') + '</p>';
    render('chile', h);
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function init() {
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    age = user && user.age ? Number(user.age) : 0;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age || undefined) : 'intermediate';
    data = _load();
    if (!root()) return;
    if (!WM) { root().innerHTML = '<p class="mm-lead">' + esc(tx('No se pudo cargar el mapa.', 'The map could not be loaded.')) + '</p>'; return; }
    try {
      if (typeof ZsSpeak !== 'undefined' && ZsSpeak.watch) ZsSpeak.watch({ prompt: '.mm-q', group: '.mm-opts', choice: '.mm-opt', lang: speakLang() });
    } catch (e) {}
    var q = ''; try { q = new URLSearchParams(location.search).get('m') || ''; } catch (e) {}
    if (q) go(q, (function () { try { return new URLSearchParams(location.search).get('a') || undefined; } catch (e) { return undefined; } })());
    else viewHome();
  }
  function currentState() {
    return {
      view: current.view, tier: tier, data: data,
      mystery: MY && MY.cur ? { c: MY.cur.m.c, shown: MY.cur.shown, done: !!MY.cur.done, ok: !!MY.cur.ok, i: MY.i, n: MY.list.length, found: MY.found, choices: MY.cur.choices || null, zoom: MY.cur.zoom } : null,
      trip: TR ? { id: TR.t.id, i: TR.i, n: TR.qs.length, q: TR.qs[TR.i] ? { kind: TR.qs[TR.i].kind, answer: TR.qs[TR.i].answer, to: TR.qs[TR.i].to } : null, T: TR.T } : null,
      round: RD ? { key: RD.key, i: RD.i, n: RD.qs.length, right: RD.right, q: RD.qs[RD.i] ? { answer: RD.qs[RD.i].answer, order: RD.qs[RD.i].order ? RD.qs[RD.i].answer : null, text: RD.qs[RD.i].text } : null } : null,
      planner: PL ? { stops: PL.stops.slice(), legs: plannerLegs() } : null
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { go: go, state: currentState };
})();
