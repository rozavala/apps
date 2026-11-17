/* ================================================================
   HUERTO 🌱 — a real garden and a plant science journal

   The kids grow real plants (a bean in a cup, herbs, a vegetable bed)
   and keep a journal of them: when they planted, watered and measured,
   a photo or a drawing, and notes. A growth chart, "predict, then
   measure", a watering checklist, three experiments (sun or shade,
   water or no water, seeds in a bag) and a planting calendar for
   California and for Chile, with why their seasons are opposite.

   Views (hash-routed, so the back button works):
     #home  #guide  #plant/<sp>  #add/<sp>  #p/<id>  #entry/<id>
     #exp  #exp/<id>  #seasons

   Per-kid storage: zs_huerto_<kid> (see js/huerto-engine.js for the
   fields; only ever added to). Photos are not kept here: they go to
   the family server's file store (the same one Árbol familiar uses,
   vps/family-files.js, 25 MB a file) through js/arbol-files.js, and an
   entry keeps only the photo's id. Drawings are kept as strokes.

   Ages (getAgeTier): 'beginner' (5 and under) gets big "I watered it"
   and "It sprouted!" buttons, drawing first and picture charts;
   'intermediate' measures in half centimetres and guesses next week's
   height; 'advanced' and 'expert' get tenths, a line chart, the growth
   per day and their own words for experiments.
   ================================================================ */

var Huerto = (function() {
  'use strict';

  var D = HuertoData, E = HuertoEngine, A = HuertoArt;
  var PREFIX = 'zs_huerto_', APP = 'Huerto';
  var data = null, user = null, tier = 'intermediate', root = null;
  var cleanup = [];

  // ---------------- storage ----------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _load() {
    var k = _key(), d = null;
    if (k) { try { d = JSON.parse(localStorage.getItem(k)); } catch (e) { d = null; } }
    return E.clean(d, D);
  }
  function _save() {
    var k = _key();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) { toast(tx('No se pudo guardar (memoria llena).', 'Could not save (storage is full).')); }
    if (typeof CloudSync !== 'undefined' && CloudSync.online) { try { CloudSync.push(k); } catch (e) {} }
  }

  // ---------------- helpers ----------------
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function isEs() { return lang() !== 'en'; }
  function bi(es, en) {
    var l = lang();
    return l === 'es' ? esc(es) : l === 'en' ? esc(en) : esc(es) + '<span class="hu-sub">' + esc(en) + '</span>';
  }
  function tx(es, en) { return lang() === 'en' ? en : es; }
  // Small labels (a day count, a pill): one language, Spanish first for 'both'.
  function sh(es, en) { return esc(lang() === 'en' ? en : es); }
  function pair(p) { return p ? bi(p[0], p[1]) : ''; }
  function one(p) { return p ? tx(p[0], p[1]) : ''; }
  function obi(o) { return o ? bi(o.es, o.en) : ''; }
  function ot(o) { return o ? tx(o.es, o.en) : ''; }
  function sayBtn(text) { return typeof ZsSpeak !== 'undefined' && ZsSpeak.button ? ZsSpeak.button(text, isEs() ? 'es' : 'en') : ''; }
  function sayNow(text) { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.little && ZsSpeak.little()) { try { ZsSpeak.say(text, isEs() ? 'es' : 'en'); } catch (e) {} } }
  function sfx(name) { if (typeof SFX !== 'undefined' && SFX[name]) { try { SFX[name](); } catch (e) {} } }
  function toast(msg) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg); }
  function logAct(icon, text) { if (typeof ActivityLog !== 'undefined' && ActivityLog.log) { try { ActivityLog.log(APP, icon, text); } catch (e) {} } }
  function confirmBox(es, en) {
    if (typeof ZsDialog !== 'undefined' && ZsDialog.confirm) return ZsDialog.confirm({ message: tx(es, en), danger: true });
    return Promise.resolve(window.confirm(tx(es, en)));
  }
  function little() { return tier === 'beginner'; }
  function older() { return tier === 'advanced' || tier === 'expert'; }
  function today() { return E.today(); }
  function fmtDate(s, long) {
    var d = E.parse(s);
    if (!d) return '';
    var m = isEs() ? (long ? D.MONTHS.esLong : D.MONTHS.es) : (long ? D.MONTHS.enLong : D.MONTHS.en);
    return isEs() ? d.getDate() + ' ' + m[d.getMonth()] : m[d.getMonth()] + ' ' + d.getDate();
  }
  function cm(h) {
    if (typeof h !== 'number') return '';
    var s = (Math.round(h * 10) / 10).toString();
    return (isEs() ? s.replace('.', ',') : s) + ' cm';
  }
  function plantOf(sp) { return D.plant(sp); }
  function plants() { return E.known(data, D); }       // kinds this copy knows; others are kept, not shown
  function mine(id) { var l = plants(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function nameOf(pl) { var p = plantOf(pl.sp); return pl.name || (p ? ot(p) : ''); }
  function region() { return data.region === 'cl' ? 'cl' : 'ca'; }
  function monthsFor(p, r) { return r === 'cl' ? D.chileMonths(p) : p.months.slice(); }
  function nowMonth() { return new Date().getMonth() + 1; }
  function starCount() { return typeof getAppStars === 'function' ? getAppStars('huerto', data) : E.stars(data); }
  function refreshStars() {
    var el = document.getElementById('hu-stars');
    if (el) el.textContent = starCount();
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }
  // Save, and cheer when a star was earned.
  function commit() {
    var before = data.__stars == null ? starCount() : data.__stars;
    delete data.__stars;
    _save();
    var after = starCount();
    refreshStars();
    if (after > before) { sfx('star'); toast('⭐ ' + tx('¡Ganaste una estrella!', 'You earned a star!')); }
  }
  function mark() { data.__stars = starCount(); }
  function stars(n) { return '<span class="hu-starline" aria-label="' + n + ' ' + tx('estrellas', 'stars') + '">⭐ <b id="hu-stars">' + n + '</b></span>'; }

  function head(title, sub, back, extra) {
    return '<header class="hu-head">' +
      (back ? '<a class="hu-back" href="#' + back + '" aria-label="' + esc(tx('Volver', 'Back')) + '">‹</a>' : '') +
      '<div class="hu-head-txt"><h1 tabindex="-1">' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (extra || '') + '</header>';
  }
  function sunIcon(p) { return A.icon(p.sun === 'full' ? 'sun' : 'part'); }
  function drops(n) {
    var s = '';
    for (var i = 1; i <= 3; i++) s += A.icon(i <= n ? 'drop' : 'dropoff');
    return '<span class="hu-drops" aria-label="' + esc(tx('Agua', 'Water') + ' ' + n + '/3') + '">' + s + '</span>';
  }

  // ---------------- home ----------------
  function viewHome() {
    var active = plants().filter(function(pl) { return !pl.done; });
    var due = active.filter(function(pl) { return E.needsWater(pl); });
    var t = today(), streak = E.waterStreak(data);
    var h = head(A.icon('sprout') + ' Huerto', bi('Mi diario de plantas', 'My plant journal'), '', stars(starCount()));

    // Today: the watering checklist
    h += '<section class="hu-today" aria-labelledby="hu-today-h"><h2 id="hu-today-h">' + A.icon('drop') + ' ' + bi('Hoy en el huerto', 'Today in the garden') + '</h2>';
    if (!active.length) {
      h += '<p class="hu-muted" data-speak="' + esc(tx('Elige una planta de la guía y siémbrala.', 'Pick a plant from the guide and plant it.')) + '">' + bi('Todavía no tienes plantas. Elige una de la guía y siémbrala.', 'No plants yet. Pick one from the guide and plant it.') + '</p>';
      h += '<a class="hu-btn hu-btn-go" href="#guide">🌱 ' + bi('Elegir una planta', 'Pick a plant') + '</a>';
    } else {
      h += '<ul class="hu-check">';
      active.forEach(function(pl) {
        var p = plantOf(pl.sp), done = E.wateredOn(pl, t), need = !done && E.needsWater(pl);
        h += '<li class="hu-check-row' + (done ? ' is-done' : need ? ' is-due' : '') + '">' +
          '<a class="hu-check-pic" href="#p/' + esc(pl.id) + '" aria-label="' + esc(nameOf(pl)) + '">' + A.plant(pl.sp, E.stage(pl, p), { where: pl.where, seed: pl.id, fit: true }) + '</a>' +
          '<div class="hu-check-txt"><b>' + esc(nameOf(pl)) + '</b><span>' + (done ? bi('Regada hoy ✓', 'Watered today ✓') : need ? bi('Revisa la tierra: si está seca, riégala', 'Check the soil: if it is dry, water it') : bi('No necesita agua hoy', 'No water needed today')) + '</span></div>' +
          (done ? '<span class="hu-check-ok" aria-hidden="true">✓</span>' :
            '<button type="button" class="hu-water' + (need ? ' is-due' : '') + '" data-act="water" data-id="' + esc(pl.id) + '">' + A.icon('drop') + '<span>' + bi('Lo regué', 'I watered it') + '</span></button>') +
          '</li>';
      });
      h += '</ul>';
      h += '<p class="hu-muted hu-streak">' + (due.length ? bi(due.length + (due.length === 1 ? ' planta para revisar' : ' plantas para revisar'), due.length + (due.length === 1 ? ' plant to check' : ' plants to check')) : bi('¡Todo listo por hoy!', 'All done for today!')) +
        (streak > 1 ? ' · 🔥 ' + bi(streak + ' días seguidos', streak + ' days in a row') : '') + '</p>';
    }
    h += '</section>';

    // My plants
    if (plants().length) {
      h += '<section aria-labelledby="hu-mine-h"><h2 id="hu-mine-h" class="hu-h2">' + bi('Mis plantas', 'My plants') + '</h2><div class="hu-grid">';
      plants().slice().sort(function(a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.planted > a.planted ? 1 : -1); }).forEach(function(pl) {
        var p = plantOf(pl.sp), st = E.stage(pl, p), age = E.days(pl.planted, t), news = E.sproutNews(pl, p);
        h += '<a class="hu-card' + (pl.done ? ' is-done' : '') + '" href="#p/' + esc(pl.id) + '">' +
          '<div class="hu-card-art">' + A.plant(pl.sp, st, { where: pl.where, seed: pl.id, fit: true }) + '</div>' +
          '<div class="hu-card-txt"><b>' + esc(nameOf(pl)) + '</b>' +
          '<span>' + (pl.name ? esc(ot(p)) + ' · ' : '') + sh('día ' + age, 'day ' + age) + ' · ' + sh(D.STAGES[st].es, D.STAGES[st].en) + '</span>' +
          (news === 'window' ? '<em class="hu-pill">' + sh('¡Puede brotar ya!', 'Could sprout any day!') + '</em>' : '') +
          (pl.done ? '<em class="hu-pill hu-pill-grey">' + sh('Terminada', 'Finished') + '</em>' : '') +
          '</div></a>';
      });
      h += '<a class="hu-card hu-card-add" href="#guide"><span class="hu-plus" aria-hidden="true">+</span><b>' + bi('Plantar otra', 'Plant another') + '</b></a>';
      h += '</div></section>';
    }

    // More to do
    h += '<section aria-label="' + esc(tx('Más', 'More')) + '"><div class="hu-tiles">' +
      tile('#guide', 'leafbook', bi('Guía de plantas', 'Plant guide'), bi('20 plantas fáciles', '20 easy plants')) +
      tile('#exp', 'lab', bi('Experimentos', 'Experiments'), bi('Sol, agua y semillas', 'Sun, water and seeds')) +
      tile('#seasons', 'globe', bi('¿Qué sembrar este mes?', 'What to plant this month?'), bi('California y Chile', 'California and Chile')) +
      '</div>';
    h += '<p class="hu-links">' + sh('También:', 'Also:') + ' <a href="naturaleza.html#guide/plants">🦅 ' + sh('Árboles y plantas de Chile', 'Trees and plants of Chile') + '</a> · <a href="lab-explorer.html">🔬 ' + sh('Lab Explorer: crecen las plantas', 'Lab Explorer: plant growth') + '</a></p></section>';
    root.innerHTML = h;
    sayNow(active.length ? tx('Hoy en el huerto. Toca la gota cuando riegues tu planta.', 'Today in the garden. Tap the drop when you water your plant.') : tx('Elige una planta y siémbrala.', 'Pick a plant and plant it.'));
  }
  function tile(href, ic, title, sub) {
    return '<a class="hu-tile" href="' + href + '">' + A.icon(ic) + '<b>' + title + '</b><span>' + sub + '</span></a>';
  }

  function water(id) {
    var pl = mine(id);
    if (!pl) return;
    mark();
    E.addWater(pl, today());
    logAct('💧', 'Watered ' + nameOf(pl));
    sfx('correct');
    commit();
    route();
  }

  // ---------------- guide ----------------
  var guideFilter = 'all';
  function viewGuide() {
    var r = region(), m = nowMonth();
    var filters = [['all', 'Todas', 'All'], ['month', 'Para este mes', 'For this month'], ['easy', 'Las más fáciles', 'The easiest'], ['cup', 'En un vaso', 'In a cup'],
      ['veg', 'Verduras', 'Vegetables'], ['herb', 'Hierbas', 'Herbs'], ['flower', 'Flores', 'Flowers'], ['fruit', 'Frutas', 'Fruit']];
    var h = head(bi('Guía de plantas', 'Plant guide'), bi('Elige una para ver cómo crece', 'Pick one to see how it grows'), 'home');
    h += regionSwitch();
    h += '<div class="hu-chips" role="group" aria-label="' + esc(tx('Filtro', 'Filter')) + '">';
    filters.forEach(function(f) { h += '<button type="button" class="hu-chip' + (guideFilter === f[0] ? ' on' : '') + '" aria-pressed="' + (guideFilter === f[0]) + '" data-act="filter" data-id="' + f[0] + '">' + bi(f[1], f[2]) + '</button>'; });
    h += '</div><div class="hu-grid hu-guide">';
    D.PLANTS.filter(function(p) {
      if (guideFilter === 'month') return monthsFor(p, r).indexOf(m) >= 0 || p.indoor;
      if (guideFilter === 'easy') return p.easy === 1;
      if (guideFilter === 'cup') return p.where.indexOf('cup') >= 0;
      if (['veg', 'herb', 'flower', 'fruit'].indexOf(guideFilter) >= 0) return p.kind === guideFilter;
      return true;
    }).forEach(function(p) {
      var now = monthsFor(p, r).indexOf(m) >= 0;
      h += '<a class="hu-card hu-gcard" href="#plant/' + p.id + '">' +
        '<div class="hu-card-art">' + A.plant(p.id, p.from === 'seed' && (p.kind === 'flower' || p.kind === 'herb') ? 4 : 5, { where: p.where.indexOf('bed') >= 0 && p.where.length === 1 ? 'bed' : 'pot' }) + '</div>' +
        '<div class="hu-card-txt"><b>' + obi(p) + '</b>' +
        '<span class="hu-gicons">' + sunIcon(p) + drops(p.water) + '</span>' +
        (now ? '<em class="hu-pill">' + sh('Se siembra ahora', 'Plant it now') + '</em>' : p.indoor ? '<em class="hu-pill hu-pill-in">' + sh('Adentro, todo el año', 'Indoors, all year') + '</em>' : '') +
        '</div></a>';
    });
    h += '</div>';
    root.innerHTML = h;
  }
  function regionSwitch() {
    var r = region();
    return '<div class="hu-region" role="group" aria-label="' + esc(tx('¿Dónde está tu huerto?', 'Where is your garden?')) + '"><span>' + bi('Mi huerto está en', 'My garden is in') + '</span>' +
      '<button type="button" class="hu-chip' + (r === 'ca' ? ' on' : '') + '" aria-pressed="' + (r === 'ca') + '" data-act="region" data-id="ca">🇺🇸 California</button>' +
      '<button type="button" class="hu-chip' + (r === 'cl' ? ' on' : '') + '" aria-pressed="' + (r === 'cl') + '" data-act="region" data-id="cl">🇨🇱 Chile</button></div>';
  }

  // One plant of the guide: its stages, numbers and calendar.
  var infoStage = {};
  function viewPlant(sp) {
    var p = plantOf(sp);
    if (!p) { location.hash = 'guide'; return; }
    var st = infoStage[sp] == null ? 5 : infoStage[sp];
    var where = p.where.indexOf('cup') >= 0 && st <= 2 ? 'cup' : p.where.indexOf('pot') >= 0 ? 'pot' : 'bed';
    var h = head(obi(p), older() ? '<i>' + esc(p.sci) + '</i>' : '', 'guide');
    h += '<div class="hu-two"><div class="hu-stagebox"><div class="hu-bigart" id="hu-info-art">' + A.plant(sp, st, { where: where, label: ot(p) + ' — ' + ot(D.STAGES[st]) }) + '</div>' +
      '<div class="hu-stages" role="group" aria-label="' + esc(tx('Etapas', 'Stages')) + '">';
    D.STAGES.forEach(function(s) {
      h += '<button type="button" class="hu-stage' + (s.id === st ? ' on' : '') + '" aria-pressed="' + (s.id === st) + '" data-act="istage" data-id="' + s.id + '">' + esc(tx(s.es, s.en)) + '</button>';
    });
    h += '</div></div><div class="hu-facts">';
    var sproutWord = p.from === 'seed' ? bi('Brota en', 'Sprouts in') : bi('Hojas nuevas en', 'New leaves in');
    h += fact(A.icon('sprout'), sproutWord, bi(p.sprout[0] + ' a ' + p.sprout[1] + ' días', p.sprout[0] + ' to ' + p.sprout[1] + ' days'));
    h += fact(A.icon(p.kind === 'flower' ? 'flower' : 'basket'), p.kind === 'flower' ? bi('Florece en', 'Flowers in') : bi('Se cosecha en', 'Harvest in'),
      bi(p.harvest[0] + ' a ' + p.harvest[1] + ' días', p.harvest[0] + ' to ' + p.harvest[1] + ' days') + ' <small>(' + sh(p.what[0], p.what[1]) + ')</small>' + (p.note ? '<small class="hu-note">' + pair(p.note) + '</small>' : ''));
    h += fact(sunIcon(p), bi('Sol', 'Sun'), obi(D.SUN[p.sun]));
    h += fact(drops(p.water), bi('Agua', 'Water'), obi(D.WATER[p.water]));
    h += fact(p.where.map(function(w) { return A.icon(w); }).join(''), bi('Dónde', 'Where'), p.where.map(function(w) { return sh(D.WHERE[w].es, D.WHERE[w].en); }).join(', ') + (p.indoor ? ' · ' + sh('también adentro, en una ventana con sol', 'also indoors, on a sunny windowsill') : ''));
    h += '</div></div>';
    h += calendar(p);
    h += '<div class="hu-cards2"><div class="hu-box"><h3>💡 ' + bi('Consejo', 'Tip') + ' ' + sayBtn(one(p.tip)) + '</h3><p>' + pair(p.tip) + '</p></div>' +
      '<div class="hu-box"><h3>🔎 ' + bi('¿Sabías que…?', 'Did you know?') + ' ' + sayBtn(one(p.fact)) + '</h3><p>' + pair(p.fact) + '</p></div></div>';
    h += '<div class="hu-actions"><a class="hu-btn hu-btn-go" href="#add/' + p.id + '">🌱 ' + bi('Plantar ' + (p.from === 'seed' ? 'una' : 'una') + ' ' + p.es.toLowerCase(), 'Plant a ' + p.en.toLowerCase()) + '</a></div>';
    root.innerHTML = h;
    sayNow(ot(p) + '. ' + one(p.tip));
  }
  function fact(ic, label, val) {
    return '<div class="hu-fact"><span class="hu-fact-ic">' + ic + '</span><div><b>' + label + '</b><span>' + val + '</span></div></div>';
  }
  function calendar(p) {
    var mo = isEs() ? D.MONTHS.es : D.MONTHS.en, m = nowMonth();
    function row(label, months, start, cls) {
      var s = '<div class="hu-cal-row"><span class="hu-cal-name">' + label + '</span><div class="hu-cal-months">';
      for (var i = 1; i <= 12; i++) {
        var on = months.indexOf(i) >= 0, st = start && start.indexOf(i) >= 0;
        s += '<span class="hu-cal-m' + (on ? ' on ' + cls : '') + (st ? ' start' : '') + (i === m ? ' now' : '') + '" title="' + esc(mo[i - 1]) + '"' + (on ? ' aria-label="' + esc(mo[i - 1]) + ': ' + esc(tx('sembrar', 'plant')) + '"' : st ? ' aria-label="' + esc(mo[i - 1]) + ': ' + esc(tx('almácigo adentro', 'start indoors')) + '"' : ' aria-hidden="true"') + '>' + esc(mo[i - 1].charAt(0).toUpperCase() + (older() ? mo[i - 1].slice(1, 3) : '')) + '</span>';
      }
      return s + '</div></div>';
    }
    var shift = function(arr) { return (arr || []).map(function(x) { return ((x - 1 + D.CHILE_SHIFT) % 12) + 1; }); };
    var h = '<section class="hu-box hu-cal"><h3>📅 ' + bi('Cuándo sembrar', 'When to plant') + '</h3>';
    h += row('🇺🇸 California', p.months, p.start, 'ca') + row('🇨🇱 Chile', D.chileMonths(p), shift(p.start), 'cl');
    h += '<p class="hu-legend"><span class="hu-cal-m on ca"></span> ' + bi('sembrar afuera', 'plant outdoors') + (p.start ? ' <span class="hu-cal-m start"></span> ' + bi('almácigo adentro', 'start indoors') : '') + '</p>';
    h += '<p class="hu-muted">' + bi('En Chile se siembra seis meses después que en California, porque las estaciones están al revés.', 'In Chile you plant six months after California, because the seasons are the other way round.') + ' <a href="#seasons">' + bi('¿Por qué?', 'Why?') + '</a></p></section>';
    return h;
  }

  // ---------------- add a plant ----------------
  function viewAdd(sp) {
    var p = plantOf(sp);
    if (!p) { location.hash = 'guide'; return; }
    var w = p.where.indexOf('cup') >= 0 ? 'cup' : p.where[0];
    var h = head(bi('Plantar: ' + p.es, 'Plant: ' + p.en), bi('Escribe cuándo y dónde lo sembraste', 'Say when and where you planted it'), 'plant/' + sp);
    h += '<form class="hu-form" id="hu-add" novalidate>';
    h += '<div class="hu-field"><span class="hu-label" id="hu-where-l">' + bi('¿Dónde?', 'Where?') + '</span><div class="hu-opts" role="radiogroup" aria-labelledby="hu-where-l">';
    p.where.forEach(function(x) {
      h += '<button type="button" role="radio" class="hu-opt' + (x === w ? ' on' : '') + '" aria-checked="' + (x === w) + '" data-act="where" data-id="' + x + '">' + A.icon(x) + '<span>' + obi(D.WHERE[x]) + '</span></button>';
    });
    h += '</div></div>';
    h += '<div class="hu-field"><label class="hu-label" for="hu-name">' + bi('Nombre (si quieres)', 'Name (if you like)') + '</label><input id="hu-name" class="hu-input" maxlength="30" autocomplete="off" placeholder="' + esc(tx('Ej.: Frijolito', 'E.g. Jack')) + '"></div>';
    h += '<div class="hu-field"><label class="hu-label" for="hu-date">' + bi('¿Cuándo lo sembraste?', 'When did you plant it?') + '</label><input id="hu-date" class="hu-input" type="date" value="' + today() + '" max="' + today() + '"></div>';
    h += '<input type="hidden" id="hu-where" value="' + w + '">';
    h += '<div class="hu-preview">' + A.plant(sp, 0, { where: w }) + '<p>' + bi('Debería brotar en ' + p.sprout[0] + ' a ' + p.sprout[1] + ' días.', 'It should sprout in ' + p.sprout[0] + ' to ' + p.sprout[1] + ' days.') + '</p></div>';
    h += '<button type="submit" class="hu-btn hu-btn-go">🌱 ' + bi('¡Lo planté!', 'I planted it!') + '</button></form>';
    root.innerHTML = h;
    document.getElementById('hu-add').addEventListener('submit', function(e) {
      e.preventDefault();
      if (data.plants.filter(function(x) { return !x.done; }).length >= E.MAX_PLANTS) { toast(tx('Ya cuidas ' + E.MAX_PLANTS + ' plantas: termina o borra alguna primero.', 'You are caring for ' + E.MAX_PLANTS + ' plants: finish or delete one first.')); return; }
      var d = document.getElementById('hu-date').value;
      if (!E.isDate(d) || d > today()) d = today();
      var where = document.getElementById('hu-where').value;
      var pl = { id: E.newId(), sp: sp, name: document.getElementById('hu-name').value.replace(/\s+/g, ' ').trim().slice(0, 30), where: where, planted: d,
        ev: E.everyDays(p, where), sprouted: '', flowered: '', harvested: '', done: 0, water: [d], log: [], pred: [] };
      data.plants.push(pl);
      mark();
      logAct('🌱', 'Planted ' + (pl.name ? pl.name + ' (' + p.en + ')' : 'a ' + p.en.toLowerCase()));
      sfx('correct');
      commit();
      location.hash = 'p/' + pl.id;
    });
    sayNow(tx('¿Dónde lo plantaste? Toca el vaso, la maceta o el huerto.', 'Where did you plant it? Tap the cup, the pot or the garden bed.'));
  }

  // ---------------- one of my plants ----------------
  function viewMine(id) {
    var pl = mine(id);
    if (!pl) { location.hash = 'home'; return; }
    var p = plantOf(pl.sp), st = E.stage(pl, p), t = today(), age = E.days(pl.planted, t), ex = E.expect(pl, p);
    var h = head(esc(nameOf(pl)), (pl.name ? sh(p.es, p.en) + ' · ' : '') + sh(D.WHERE[pl.where].es, D.WHERE[pl.where].en) + ' · ' + sh('sembrada el ' + fmtDate(pl.planted, true), 'planted ' + fmtDate(pl.planted, true)), 'home', stars(starCount()));
    h += '<div class="hu-two"><div class="hu-bigart">' + A.plant(pl.sp, st, { where: pl.where, seed: pl.id, label: nameOf(pl) + ' — ' + ot(D.STAGES[st]) }) +
      '<p class="hu-day"><b>' + sh('Día ' + age, 'Day ' + age) + '</b> · ' + sh(D.STAGES[st].es, D.STAGES[st].en) + '</p></div><div>';
    // what to expect
    var news = E.sproutNews(pl, p);
    h += '<div class="hu-box hu-expect">';
    if (!pl.sprouted && !pl.done) {
      h += '<p>' + (news === 'soon' ? bi('Debería brotar entre el ' + fmtDate(ex.sprout[0]) + ' y el ' + fmtDate(ex.sprout[1]) + '.', 'It should sprout between ' + fmtDate(ex.sprout[0]) + ' and ' + fmtDate(ex.sprout[1]) + '.') :
        news === 'window' ? bi('¡Ya puede brotar cualquier día! Mira la tierra con cuidado.', 'It could sprout any day now! Look closely at the soil.') :
          bi('Ya pasaron los días en que suele brotar. A veces tarda más con frío; si no sale en una semana más, prueba con una semilla nueva.', 'The usual sprouting days have passed. Cold can slow it down; if nothing shows in another week, try a new seed.')) + '</p>';
    } else if (!pl.harvested && !pl.done) {
      h += '<p>' + bi((p.kind === 'flower' ? 'Las primeras flores, ' : 'La primera cosecha, ') + 'más o menos entre el ' + fmtDate(ex.harvest[0]) + ' y el ' + fmtDate(ex.harvest[1]) + '.', (p.kind === 'flower' ? 'First flowers ' : 'First harvest ') + 'around ' + fmtDate(ex.harvest[0]) + ' to ' + fmtDate(ex.harvest[1]) + '.') + '</p>';
    } else if (pl.harvested) h += '<p>🧺 ' + bi('Cosechada el ' + fmtDate(pl.harvested, true) + ', al día ' + E.days(pl.planted, pl.harvested) + '.', 'Harvested ' + fmtDate(pl.harvested, true) + ', on day ' + E.days(pl.planted, pl.harvested) + '.') + '</p>';
    h += '</div>';
    // buttons: water, milestones, new entry
    if (!pl.done) {
      var watered = E.wateredOn(pl, t);
      h += '<div class="hu-bigbtns">' +
        (watered ? '<span class="hu-water is-done">' + A.icon('drop') + '<span>' + bi('Regada hoy ✓', 'Watered today ✓') + '</span></span>' : '<button type="button" class="hu-water is-due" data-act="water" data-id="' + esc(pl.id) + '">' + A.icon('drop') + '<span>' + bi('Lo regué', 'I watered it') + '</span></button>') +
        '<a class="hu-btn hu-btn-go" href="#entry/' + esc(pl.id) + '">' + A.icon(little() ? 'pencil' : 'ruler') + ' ' + (little() ? bi('Dibujar y anotar', 'Draw and note') : bi('Nueva entrada', 'New entry')) + '</a></div>';
      h += '<div class="hu-miles" role="group" aria-label="' + esc(tx('Lo que pasó', 'What happened')) + '">' +
        mile('sprouted', 'sprout', p.from === 'seed' ? ['¡Brotó!', 'It sprouted!'] : ['¡Hojas nuevas!', 'New leaves!'], pl) +
        mile('flowered', 'flower', ['Tiene flores', 'It has flowers'], pl) +
        mile('harvested', 'basket', p.kind === 'flower' ? ['Corté flores', 'I picked flowers'] : ['¡Cosechamos!', 'We harvested!'], pl) + '</div>';
    }
    h += '</div></div>';
    // the chart and the guess
    h += chartBox(pl);
    if (!little() && !pl.done) h += predictBox(pl);
    // the journal
    h += '<section class="hu-box"><h3>📔 ' + bi('Diario', 'Journal') + '</h3>';
    var log = E.entries(pl).sort(function(a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
    if (!log.length) h += '<p class="hu-muted">' + bi('Todavía no hay entradas.', 'No entries yet.') + '</p>';
    h += '<ol class="hu-log">';
    log.forEach(function(e) { h += entryRow(pl, e); });
    h += '</ol></section>';
    h += '<div class="hu-actions hu-actions-end">' + (pl.done ? '<button type="button" class="hu-btn" data-act="undone" data-id="' + esc(pl.id) + '">↩ ' + bi('Volver a cuidarla', 'Care for it again') + '</button>' :
      '<button type="button" class="hu-btn" data-act="done" data-id="' + esc(pl.id) + '">🏁 ' + bi('Terminar (guardar en el diario)', 'Finish (keep in the journal)') + '</button>') +
      '<button type="button" class="hu-btn hu-btn-danger" data-act="delplant" data-id="' + esc(pl.id) + '">🗑 ' + bi('Borrar', 'Delete') + '</button></div>';
    root.innerHTML = h;
    sayNow(nameOf(pl) + '. ' + tx('Día ', 'Day ') + age + '.');
  }
  function mile(key, ic, label, pl) {
    var on = !!pl[key];
    return '<button type="button" class="hu-mile' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="mile" data-id="' + esc(pl.id) + '" data-k="' + key + '">' + A.icon(ic) + '<span>' + pair(label) + (on ? '<small>' + esc(fmtDate(pl[key])) + '</small>' : '') + '</span></button>';
  }
  function setMile(id, key) {
    var pl = mine(id);
    if (!pl) return;
    mark();
    if (pl[key]) { pl[key] = ''; }
    else {
      pl[key] = today();
      if (key === 'flowered' && !pl.sprouted) pl.sprouted = pl.sprouted || today();
      if (key === 'harvested') { if (!pl.sprouted) pl.sprouted = today(); }
      var p = plantOf(pl.sp);
      logAct(key === 'sprouted' ? '🌱' : key === 'flowered' ? '🌼' : '🧺', (key === 'sprouted' ? 'Sprouted: ' : key === 'flowered' ? 'Flowers on ' : 'Harvested ') + nameOf(pl) + ' (day ' + E.days(pl.planted, today()) + ', ' + p.en + ')');
      sfx('correct');
    }
    commit();
    route();
  }

  function entryRow(pl, e) {
    var bits = [];
    if (e.w) bits.push('💧 ' + sh('regada', 'watered'));
    if (typeof e.h === 'number') bits.push('📏 ' + esc(cm(e.h)));
    if (e.lv) bits.push('🍃 ' + e.lv + ' ' + sh('hojas', 'leaves'));
    var media = '';
    if (e.ph && typeof ArbolFiles !== 'undefined') media += '<button type="button" class="hu-thumb" data-act="photo" data-id="' + esc(e.ph.id) + '" aria-label="' + esc(tx('Ver la foto', 'See the photo')) + '"><img alt="" loading="lazy" src="' + esc(ArbolFiles.url(e.ph.th || e.ph.id)) + '" onerror="this.parentNode.classList.add(\'is-off\')"></button>';
    if (e.dr) media += '<span class="hu-thumb hu-thumb-dr">' + drawingSvg(e.dr) + '</span>';
    return '<li class="hu-log-row"><div class="hu-log-date"><b>' + esc(fmtDate(e.d)) + '</b><span>' + sh('día ' + E.days(pl.planted, e.d), 'day ' + E.days(pl.planted, e.d)) + '</span></div>' +
      '<div class="hu-log-body">' + (bits.length ? '<p class="hu-log-bits">' + bits.join(' · ') + '</p>' : '') + (e.n ? '<p class="hu-log-note">' + esc(e.n) + '</p>' : '') + (media ? '<div class="hu-log-media">' + media + '</div>' : '') + '</div>' +
      '<button type="button" class="hu-x" data-act="delentry" data-id="' + esc(pl.id) + '" data-e="' + esc(e.id) + '" aria-label="' + esc(tx('Borrar esta entrada', 'Delete this entry')) + '">×</button></li>';
  }

  // ---------------- the growth chart ----------------
  function chartBox(pl) {
    var s = E.series(pl);
    var h = '<section class="hu-box"><h3>' + A.icon('chart') + ' ' + bi('Cuánto ha crecido', 'How much it has grown') + '</h3>';
    if (!s.length) return h + '<p class="hu-muted">' + bi('Mide tu planta con una regla, desde la tierra hasta la punta, y anótalo en una entrada.', 'Measure your plant with a ruler, from the soil to the tip, and write it in an entry.') + '</p></section>';
    h += little() || tier === 'intermediate' ? barChart(pl, s) : lineChart(pl, s);
    var r = E.rate(pl);
    if (older() && r !== null && s.length >= 2) {
      h += '<p class="hu-rate">' + bi('Crece más o menos ' + cm(r) + ' por día (del día ' + s[0].day + ' al ' + s[s.length - 1].day + ').', 'It grows about ' + cm(r) + ' a day (from day ' + s[0].day + ' to ' + s[s.length - 1].day + ').') + '</p>';
      if (tier === 'expert' && r > 0) h += '<p class="hu-rate hu-muted">' + bi('Si siguiera igual, en 7 días más mediría unos ' + cm(E.projection(pl, E.addDays(s[s.length - 1].d, 7))) + '. Las plantas no crecen siempre igual: crecen rápido de jóvenes y más lento después.', 'If it kept the same pace, in 7 more days it would be about ' + cm(E.projection(pl, E.addDays(s[s.length - 1].d, 7))) + '. Plants do not always grow at the same pace: fast when young, slower later.') + '</p>';
    }
    return h + '</section>';
  }
  function barChart(pl, s) {
    var last = s.slice(-8), max = Math.max.apply(null, last.map(function(x) { return x.h; }).concat([1]));
    var W = 320, H = 170, bw = Math.min(34, (W - 20) / last.length - 8), h = '<svg class="hu-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(tx('Altura en cada medición', 'Height at each measurement')) + '">';
    h += '<defs><linearGradient id="hu-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc550"/><stop offset="1" stop-color="#3f8a2c"/></linearGradient></defs>';
    h += '<path d="M10 ' + (H - 24) + 'H' + (W - 6) + '" stroke="#8a6a44" stroke-width="3"/>';
    last.forEach(function(x, i) {
      var bh = Math.max(3, (H - 52) * x.h / max), bx = 16 + i * ((W - 24) / last.length);
      h += '<rect x="' + bx + '" y="' + (H - 24 - bh) + '" width="' + bw + '" height="' + bh + '" rx="5" fill="url(#hu-bar)"/>';
      h += '<path d="M' + (bx + bw / 2) + ' ' + (H - 24 - bh) + 'q-7 -6 -10 -1q5 4 10 1q7 -6 10 -1q-5 4 -10 1" fill="#8fd157" stroke="#3f7a2c" stroke-width=".6"/>';
      if (!little()) h += '<text x="' + (bx + bw / 2) + '" y="' + (H - 30 - bh - 6) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#2f4a1f">' + esc(cm(x.h).replace(' cm', '')) + '</text>';
      h += '<text x="' + (bx + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#6b5a44">' + esc((isEs() ? 'd' : 'd') + x.day) + '</text>';
    });
    return h + '</svg>' + (little() ? '' : '<p class="hu-muted hu-small">' + bi('Cada barra es una medición, en centímetros. "d" es el día.', 'Each bar is one measurement, in centimetres. "d" is the day.') + '</p>');
  }
  function lineChart(pl, s) {
    var W = 340, H = 200, L = 38, B = 28, T = 14, R = 12;
    var preds = (pl.pred || []).filter(function(p) { return typeof p.h === 'number' && E.isDate(p['for']); });
    var maxD = Math.max(7, s[s.length - 1].day, preds.reduce(function(m, p) { return Math.max(m, E.days(pl.planted, p['for'])); }, 0));
    var maxH = Math.max(2, Math.max.apply(null, s.map(function(x) { return x.h; }).concat(preds.map(function(p) { return p.h; }))));
    var stepH = maxH <= 5 ? 1 : maxH <= 12 ? 2 : maxH <= 30 ? 5 : maxH <= 60 ? 10 : 20;
    maxH = Math.ceil(maxH / stepH) * stepH;
    var stepD = maxD <= 14 ? 2 : maxD <= 35 ? 7 : maxD <= 90 ? 14 : 30;
    function X(d) { return L + (W - L - R) * d / maxD; }
    function Y(v) { return H - B - (H - B - T) * v / maxH; }
    var h = '<svg class="hu-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(tx('Gráfico de altura por día', 'Chart of height by day')) + '">';
    for (var v = 0; v <= maxH; v += stepH) h += '<path d="M' + L + ' ' + n1(Y(v)) + 'H' + (W - R) + '" stroke="#e7dfcc" stroke-width="1"/><text x="' + (L - 6) + '" y="' + n1(Y(v) + 4) + '" text-anchor="end" font-size="10" fill="#6b5a44">' + v + '</text>';
    for (var d = 0; d <= maxD; d += stepD) h += '<text x="' + n1(X(d)) + '" y="' + (H - B + 16) + '" text-anchor="middle" font-size="10" fill="#6b5a44">' + d + '</text>';
    h += '<path d="M' + L + ' ' + T + 'V' + (H - B) + 'H' + (W - R) + '" stroke="#8a6a44" stroke-width="1.4" fill="none"/>';
    h += '<text x="' + (W - R) + '" y="' + (H - 2) + '" text-anchor="end" font-size="10" font-weight="700" fill="#4a3b2a">' + esc(tx('días', 'days')) + '</text>';
    h += '<text x="4" y="' + (T - 2) + '" font-size="10" font-weight="700" fill="#4a3b2a">cm</text>';
    var path = s.map(function(x, i) { return (i ? 'L' : 'M') + n1(X(x.day)) + ' ' + n1(Y(x.h)); }).join('');
    h += '<path d="' + path + '" stroke="#2f8a2c" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>';
    s.forEach(function(x) { h += '<circle cx="' + n1(X(x.day)) + '" cy="' + n1(Y(x.h)) + '" r="4" fill="#2f8a2c" stroke="#fff" stroke-width="1.5"><title>' + esc(tx('día ', 'day ') + x.day + ': ' + cm(x.h)) + '</title></circle>'; });
    preds.forEach(function(p) {
      var dd = E.days(pl.planted, p['for']);
      h += '<circle cx="' + n1(X(dd)) + '" cy="' + n1(Y(p.h)) + '" r="5" fill="#fff" stroke="#d97706" stroke-width="2" stroke-dasharray="2 1.6"><title>' + esc(tx('tu predicción: ', 'your guess: ') + cm(p.h)) + '</title></circle>';
    });
    h += '</svg><p class="hu-legend"><span class="hu-dot"></span> ' + bi('medido', 'measured') + (preds.length ? ' <span class="hu-dot hu-dot-guess"></span> ' + bi('tu predicción', 'your guess') : '') + '</p>';
    return h;
  }
  function n1(v) { return Math.round(v * 10) / 10; }

  // ---------------- predict, then measure ----------------
  function predictBox(pl) {
    var s = E.series(pl), open = E.openPred(pl);
    var h = '<section class="hu-box hu-predict"><h3>🔮 ' + bi('Predice y mide', 'Predict, then measure') + '</h3>';
    if (open) {
      var left = E.days(today(), open['for']);
      h += '<p>' + bi('Dijiste que el ' + fmtDate(open['for'], true) + ' mediría ' + cm(open.h) + '.', 'You said that on ' + fmtDate(open['for'], true) + ' it would be ' + cm(open.h) + '.') + ' ' +
        (left > 0 ? bi('Faltan ' + left + (left === 1 ? ' día.' : ' días.'), left + (left === 1 ? ' day to go.' : ' days to go.')) : bi('¡Hoy toca medir!', 'Time to measure!')) + '</p>';
      if (left <= 3) h += '<a class="hu-btn" href="#entry/' + esc(pl.id) + '">📏 ' + bi('Medir ahora', 'Measure now') + '</a>';
    } else if (!s.length) {
      h += '<p class="hu-muted">' + bi('Cuando la midas por primera vez podrás adivinar cuánto medirá en una semana.', 'Once you have measured it, you can guess how tall it will be in a week.') + '</p>';
    } else {
      var last = s[s.length - 1], step = older() ? 0.1 : 0.5, start = Math.max(0, Math.round((last.h + 1) / step) * step);
      h += '<p>' + bi('La última vez midió ' + cm(last.h) + '. ¿Cuánto medirá en 7 días?', 'Last time it was ' + cm(last.h) + '. How tall will it be in 7 days?') + '</p>' +
        '<div class="hu-guess"><input type="range" id="hu-pred-r" min="0" max="' + Math.max(20, Math.ceil(last.h * 3)) + '" step="' + step + '" value="' + start + '" aria-label="' + esc(tx('Tu predicción en cm', 'Your guess in cm')) + '">' +
        '<output id="hu-pred-o" for="hu-pred-r">' + esc(cm(start)) + '</output>' +
        '<button type="button" class="hu-btn hu-btn-go" data-act="predict" data-id="' + esc(pl.id) + '">' + bi('Guardar mi predicción', 'Save my guess') + '</button></div>';
    }
    var past = (pl.pred || []).filter(function(p) { return typeof p.got === 'number' && p.got >= 0; }).slice(-4).reverse();
    if (past.length) {
      h += '<ul class="hu-past">';
      past.forEach(function(p) { var ok = E.close(p.h, p.got); h += '<li class="' + (ok ? 'ok' : '') + '">' + (ok ? '🎯 ' : '📏 ') + bi('Dijiste ' + cm(p.h) + ', midió ' + cm(p.got), 'You said ' + cm(p.h) + ', it was ' + cm(p.got)) + (ok ? ' — ' + bi('¡muy cerca!', 'very close!') : '') + '</li>'; });
      h += '</ul>';
    }
    return h + '</section>';
  }

  // ---------------- a new journal entry ----------------
  var draft = null;
  function viewEntry(id) {
    var pl = mine(id);
    if (!pl) { location.hash = 'home'; return; }
    var s = E.series(pl), last = s.length ? s[s.length - 1].h : 0, step = older() ? 0.1 : 0.5;
    draft = { pl: pl.id, strokes: [], file: null, h: null };
    var canPhoto = typeof ArbolFiles !== 'undefined' && typeof CloudSync !== 'undefined' && CloudSync.online;
    var h = head(bi('Nueva entrada', 'New entry'), esc(nameOf(pl)), 'p/' + pl.id);
    h += '<form class="hu-form" id="hu-entry" novalidate>';
    h += '<div class="hu-field hu-row2"><label class="hu-label" for="hu-edate">' + bi('Fecha', 'Date') + '</label><input id="hu-edate" class="hu-input" type="date" value="' + today() + '" min="' + pl.planted + '" max="' + today() + '"></div>';
    h += '<button type="button" class="hu-toggle" id="hu-ew" aria-pressed="' + E.wateredOn(pl, today()) + '" data-act="toggle">' + A.icon('drop') + '<span>' + bi('La regué', 'I watered it') + '</span></button>';
    var drawBlock = '<div class="hu-field"><span class="hu-label">' + A.icon('pencil') + ' ' + bi('Dibuja tu planta', 'Draw your plant') + '</span>' +
      '<div class="hu-draw"><canvas id="hu-canvas" width="600" height="420" aria-label="' + esc(tx('Hoja para dibujar', 'Drawing sheet')) + '"></canvas>' +
      '<div class="hu-colors" role="group" aria-label="' + esc(tx('Colores', 'Colours')) + '">' + COLORS.map(function(c, i) { return '<button type="button" class="hu-color' + (i === 0 ? ' on' : '') + '" style="background:' + c + '" data-act="color" data-id="' + i + '" aria-label="' + esc(tx(COLOR_NAMES[i][0], COLOR_NAMES[i][1])) + '" aria-pressed="' + (i === 0) + '"></button>'; }).join('') +
      '<button type="button" class="hu-mini" data-act="undo" aria-label="' + esc(tx('Deshacer', 'Undo')) + '">↶</button><button type="button" class="hu-mini" data-act="clear" aria-label="' + esc(tx('Borrar el dibujo', 'Clear the drawing')) + '">🧽</button></div></div></div>';
    var measure = '<div class="hu-field"><label class="hu-label" for="hu-eh">' + A.icon('ruler') + ' ' + bi('¿Cuánto mide? (desde la tierra hasta la punta)', 'How tall is it? (from the soil to the tip)') + '</label>' +
      rulerSvg() +
      '<div class="hu-num"><button type="button" class="hu-mini" data-act="hstep" data-id="-1" aria-label="' + esc(tx('Menos', 'Less')) + '">−</button><input id="hu-eh" class="hu-input" type="number" inputmode="decimal" min="0" max="400" step="' + step + '" placeholder="' + esc(last ? cm(last).replace(' cm', '') : '0') + '"><span>cm</span><button type="button" class="hu-mini" data-act="hstep" data-id="1" aria-label="' + esc(tx('Más', 'More')) + '">+</button></div></div>';
    if (little()) h += drawBlock + '<details class="hu-more"><summary>📏 ' + bi('Medir con una regla', 'Measure with a ruler') + '</summary>' + measure + '</details>';
    else h += measure + '<div class="hu-field"><label class="hu-label" for="hu-elv">🍃 ' + bi('¿Cuántas hojas tiene?', 'How many leaves?') + '</label><input id="hu-elv" class="hu-input hu-input-s" type="number" min="0" max="999" inputmode="numeric"></div>';
    h += '<div class="hu-field"><label class="hu-label" for="hu-en">📝 ' + bi('¿Qué ves? (colores, hojas nuevas, bichitos…)', 'What do you see? (colours, new leaves, bugs…)') + '</label><textarea id="hu-en" class="hu-input" rows="3" maxlength="' + E.MAX_NOTE + '"></textarea></div>';
    h += '<div class="hu-field"><span class="hu-label">' + A.icon('camera') + ' ' + bi('Foto (si quieres)', 'Photo (if you like)') + '</span>' +
      (canPhoto ? '<label class="hu-btn hu-file"><input type="file" id="hu-ephoto" accept="image/*" capture="environment">' + bi('Tomar o elegir una foto', 'Take or choose a photo') + '</label><span id="hu-ephoto-name" class="hu-muted" role="status"></span>' +
        '<p class="hu-muted hu-small">' + bi('La foto se guarda en el servidor de la familia, no en este aparato.', 'The photo is kept on the family server, not on this device.') + '</p>'
        : '<p class="hu-muted hu-small">' + bi('Las fotos se guardan en el servidor de la familia: se pueden agregar cuando este aparato está conectado en casa.', 'Photos are kept on the family server: you can add them when this device is connected at home.') + '</p>') + '</div>';
    if (!little()) h += '<details class="hu-more"><summary>' + A.icon('pencil') + ' ' + bi('Dibujar también', 'Draw too') + '</summary>' + drawBlock + '</details>';
    h += '<p class="hu-status" id="hu-estatus" role="status"></p><button type="submit" class="hu-btn hu-btn-go" id="hu-esave">✅ ' + bi('Guardar entrada', 'Save entry') + '</button></form>';
    root.innerHTML = h;
    setupCanvas();
    var f = document.getElementById('hu-ephoto');
    if (f) f.addEventListener('change', function() {
      draft.file = f.files && f.files[0] || null;
      document.getElementById('hu-ephoto-name').textContent = draft.file ? '📷 ' + draft.file.name : '';
    });
    var hin = document.getElementById('hu-eh');
    hin.addEventListener('input', function() { setRuler(parseFloat(hin.value)); });
    if (last) setRuler(last);
    document.getElementById('hu-entry').addEventListener('submit', function(e) { e.preventDefault(); saveEntry(pl); });
    sayNow(little() ? tx('Dibuja tu planta. Si la regaste, toca la gota.', 'Draw your plant. If you watered it, tap the drop.') : tx('Mide tu planta con una regla.', 'Measure your plant with a ruler.'));
  }

  // An on-screen ruler that follows the number (and can be dragged).
  function rulerSvg() {
    var h = '<div class="hu-ruler" id="hu-ruler" role="slider" tabindex="0" aria-label="' + esc(tx('Regla', 'Ruler')) + '" aria-valuemin="0" aria-valuemax="30" aria-valuenow="0"><svg viewBox="0 0 330 56" aria-hidden="true">';
    h += '<defs><linearGradient id="hu-rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe7a1"/><stop offset="1" stop-color="#eac65a"/></linearGradient></defs>';
    h += '<rect x="1" y="6" width="328" height="44" rx="5" fill="url(#hu-rw)" stroke="#b8901c"/>';
    for (var i = 0; i <= 300; i++) {
      var x = 15 + i, mm = i % 10;
      if (i % 5) continue;
      h += '<path d="M' + x + ' 6v' + (mm === 0 ? 16 : 9) + '" stroke="#5b4510" stroke-width="' + (mm === 0 ? 1.2 : 0.8) + '"/>';
      if (mm === 0 && (i / 10) % 5 === 0) h += '<text x="' + x + '" y="38" text-anchor="middle" font-size="13" font-weight="800" fill="#5b4510">' + (i / 10) + '</text>';
      else if (mm === 0) h += '<text x="' + x + '" y="34" text-anchor="middle" font-size="7" fill="#7a6420">' + (i / 10) + '</text>';
    }
    h += '<rect id="hu-rfill" x="15" y="40" width="0" height="7" rx="3" fill="#4f9a31"/><g id="hu-rmark"><path d="M15 2v50" stroke="#c2410c" stroke-width="2.4"/><circle cx="15" cy="52" r="4" fill="#c2410c"/></g>';
    return h + '</svg><span class="hu-muted hu-small">' + bi('La regla muestra hasta 30 cm; escribe el número si mide más.', 'The ruler shows up to 30 cm; type the number if it is taller.') + '</span></div>';
  }
  function setRuler(v) {
    var el = document.getElementById('hu-ruler');
    if (!el) return;
    v = isFinite(v) ? Math.max(0, v) : 0;
    var x = Math.min(30, v) * 10;
    var mk = document.getElementById('hu-rmark'), fl = document.getElementById('hu-rfill');
    if (mk) mk.setAttribute('transform', 'translate(' + x + ' 0)');
    if (fl) fl.setAttribute('width', x);
    el.setAttribute('aria-valuenow', String(Math.round(v * 10) / 10));
  }
  function rulerDrag() {
    var el = document.getElementById('hu-ruler'), hin = document.getElementById('hu-eh');
    if (!el || !hin) return;
    var step = older() ? 0.1 : 0.5;
    function at(e) {
      var r = el.querySelector('svg').getBoundingClientRect(), k = r.width / 330;
      var v = ((e.clientX - r.left) / k - 15) / 10;
      v = Math.max(0, Math.min(30, Math.round(v / step) * step));
      hin.value = String(Math.round(v * 10) / 10);
      setRuler(v);
    }
    var down = false;
    el.addEventListener('pointerdown', function(e) { down = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} at(e); });
    el.addEventListener('pointermove', function(e) { if (down) at(e); });
    el.addEventListener('pointerup', function() { down = false; });
    el.addEventListener('pointercancel', function() { down = false; });
    el.addEventListener('keydown', function(e) {
      var v = parseFloat(hin.value) || 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step; else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = Math.max(0, v - step); else return;
      e.preventDefault();
      hin.value = String(Math.round(v * 10) / 10);
      setRuler(v);
    });
  }

  function saveEntry(pl) {
    var d = document.getElementById('hu-edate').value;
    if (!E.isDate(d) || d > today()) d = today();
    if (d < pl.planted) d = pl.planted;
    var hv = parseFloat(String(document.getElementById('hu-eh').value).replace(',', '.'));
    var lvIn = document.getElementById('hu-elv');
    var lv = lvIn ? parseInt(lvIn.value, 10) : NaN;
    var e = { id: E.newId(), d: d, h: isFinite(hv) && hv >= 0 && hv <= 400 ? Math.round(hv * 10) / 10 : null,
      lv: isFinite(lv) && lv > 0 ? Math.min(999, lv) : 0, n: document.getElementById('hu-en').value.trim().slice(0, E.MAX_NOTE),
      w: document.getElementById('hu-ew').getAttribute('aria-pressed') === 'true' ? 1 : 0 };
    var dr = packDrawing();
    if (dr) e.dr = dr;
    if (e.h === null && !e.n && !e.w && !e.dr && !e.lv && !draft.file) { toast(tx('Escribe, mide o dibuja algo primero.', 'Write, measure or draw something first.')); return; }
    var btn = document.getElementById('hu-esave'), status = document.getElementById('hu-estatus');
    btn.disabled = true;
    var go = function() {
      mark();
      pl.log.push(e);
      if (pl.log.length > E.MAX_LOG) {
        pl.log.slice(0, pl.log.length - E.MAX_LOG).forEach(function(x) { if (x && x.ph) forgetPhoto(x.ph); });
        pl.log = pl.log.slice(-E.MAX_LOG);
      }
      if (e.w) E.addWater(pl, d);
      var res = e.h !== null ? E.settle(pl, d, e.h) : null;
      logAct('📔', 'Journal: ' + nameOf(pl) + (e.h !== null ? ', ' + e.h + ' cm' : '') + (e.ph ? ' (photo)' : ''));
      commit();
      if (res) {
        var msg = res.close ? tx('🎯 ¡Muy cerca! Dijiste ' + cm(res.guess) + ' y midió ' + cm(res.got) + '.', '🎯 Very close! You said ' + cm(res.guess) + ' and it was ' + cm(res.got) + '.') :
          tx('Dijiste ' + cm(res.guess) + ' y midió ' + cm(res.got) + '. ¡Así se aprende a predecir!', 'You said ' + cm(res.guess) + ' and it was ' + cm(res.got) + '. That is how you learn to predict!');
        if (typeof ZsDialog !== 'undefined' && ZsDialog.alert) ZsDialog.alert({ message: msg }); else toast(msg);
      }
      location.hash = 'p/' + pl.id;
    };
    if (draft.file && typeof ArbolFiles !== 'undefined') {
      status.textContent = tx('Subiendo la foto…', 'Uploading the photo…');
      ArbolFiles.upload(draft.file, nameOf(pl) + ' ' + d, 1).then(function(entry) {
        e.ph = { id: entry.id };
        if (entry.th) e.ph.th = entry.th;
        go();
      }, function(err) {
        var why = err && err.message === 'type' ? tx('Ese archivo no es una foto.', 'That file is not a photo.') : err && err.message === 'size' ? tx('La foto es muy grande (más de 25 MB).', 'The photo is too big (over 25 MB).') : tx('No se pudo subir la foto (¿estás conectado en casa?).', 'Could not upload the photo (are you connected at home?).');
        status.textContent = why;
        btn.disabled = false;
        draft.file = null;
        var f = document.getElementById('hu-ephoto'); if (f) f.value = '';
        var nm = document.getElementById('hu-ephoto-name'); if (nm) nm.textContent = '';
        toast(why + ' ' + tx('Puedes guardar sin foto.', 'You can save without it.'));
      });
    } else go();
  }

  // ---------------- drawing ----------------
  var COLORS = ['#3f8a2c', '#8fd157', '#6b4a2e', '#f2c230', '#e0301e', '#2f7fd6', '#1c1b29'];
  var COLOR_NAMES = [['verde', 'green'], ['verde claro', 'light green'], ['café', 'brown'], ['amarillo', 'yellow'], ['rojo', 'red'], ['azul', 'blue'], ['negro', 'black']];
  var canvasState = null;
  function setupCanvas() {
    var cv = document.getElementById('hu-canvas');
    if (!cv) return;
    var g = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(cv) : cv.getContext('2d');
    if (!g) { cv.replaceWith(document.createTextNode(tx('No se puede dibujar en este aparato ahora.', 'Drawing is not available on this device now.'))); return; }
    canvasState = { cv: cv, g: g, color: 0, cur: null };
    onLeave(function() { if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(cv); canvasState = null; });
    paper();
    function at(e) { var r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * 300 / r.width), Math.round((e.clientY - r.top) * 210 / r.height)]; }
    cv.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      var p = at(e);
      canvasState.cur = { c: canvasState.color, p: [p[0], p[1]] };
      draft.strokes.push(canvasState.cur);
      redraw();
    });
    cv.addEventListener('pointermove', function(e) {
      if (!canvasState || !canvasState.cur) return;
      var p = at(e), s = canvasState.cur.p, lx = s[s.length - 2], ly = s[s.length - 1];
      if (Math.abs(p[0] - lx) + Math.abs(p[1] - ly) < 3) return;
      if (totalPoints() > 6000) return;
      s.push(p[0], p[1]);
      redraw();
    });
    function end() { if (canvasState) canvasState.cur = null; }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }
  function totalPoints() { return draft.strokes.reduce(function(n, s) { return n + s.p.length / 2; }, 0); }
  function paper() {
    var g = canvasState.g, cv = canvasState.cv;
    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = 'rgba(140,170,200,.35)'; g.lineWidth = 1;
    for (var y = 40; y < cv.height; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(cv.width, y); g.stroke(); }
  }
  function redraw() {
    if (!canvasState) return;
    paper();
    var g = canvasState.g, k = canvasState.cv.width / 300;
    draft.strokes.forEach(function(s) {
      g.strokeStyle = COLORS[s.c] || COLORS[0]; g.lineWidth = 3.2 * k; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(s.p[0] * k, s.p[1] * k);
      if (s.p.length === 2) g.lineTo(s.p[0] * k + 0.1, s.p[1] * k);
      for (var i = 2; i < s.p.length; i += 2) g.lineTo(s.p[i] * k, s.p[i + 1] * k);
      g.stroke();
    });
  }
  function packDrawing() {
    if (!draft || !draft.strokes.length) return null;
    return draft.strokes.slice(0, 200).map(function(s) { return { c: s.c, p: s.p.slice(0, 4000) }; });
  }
  function drawingSvg(dr) {
    var s = '<svg viewBox="0 0 300 210" aria-label="' + esc(tx('Dibujo', 'Drawing')) + '" role="img"><rect width="300" height="210" fill="#fffdf6"/>';
    (Array.isArray(dr) ? dr : []).forEach(function(st) {
      if (!st || !Array.isArray(st.p) || st.p.length < 2) return;
      var d = '';
      for (var i = 0; i + 1 < st.p.length; i += 2) d += (i ? 'L' : 'M') + (st.p[i] | 0) + ' ' + (st.p[i + 1] | 0);
      if (st.p.length === 2) d += 'l0.1 0';
      s += '<path d="' + d + '" stroke="' + (COLORS[st.c | 0] || COLORS[0]) + '" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    return s + '</svg>';
  }

  // ---------------- photos ----------------
  function showPhoto(id) {
    if (typeof ArbolFiles === 'undefined') return;
    var ov = document.createElement('div');
    ov.className = 'hu-lightbox';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', tx('Foto', 'Photo'));
    ov.innerHTML = '<button type="button" class="hu-lb-x" aria-label="' + esc(tx('Cerrar', 'Close')) + '">×</button><img alt="' + esc(tx('Foto de la planta', 'Photo of the plant')) + '" src="' + esc(ArbolFiles.url(id)) + '">';
    function close() { ov.remove(); document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', function(e) { if (e.target === ov || e.target.classList.contains('hu-lb-x')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(ov);
    ov.querySelector('.hu-lb-x').focus();
  }
  // A photo whose entry is gone: delete it on the family server. Kept on a
  // to-delete list in the kid's data until the server says it is gone, so a
  // delete made offline (or with a dropped connection) happens later.
  function forgetPhoto(ph) {
    if (!ph) return;
    [ph.id, ph.th].forEach(function(id) { if (/^[a-f0-9]{32}$/.test(String(id)) && data.trash.indexOf(id) < 0) data.trash.push(id); });
    flushTrash();
  }
  var flushing = false;
  function flushTrash() {
    if (flushing || !data || !data.trash.length || typeof ArbolFiles === 'undefined' || typeof fetch !== 'function') return;
    flushing = true;
    var ids = data.trash.slice();
    Promise.all(ids.map(function(id) {
      var u = ArbolFiles.url(id);
      if (!u) return id;
      return fetch(u, { method: 'DELETE' }).then(function(r) { return r.ok || r.status === 404 ? id : null; }, function() { return null; });
    })).then(function(done) {
      flushing = false;
      done = done.filter(Boolean);
      if (!done.length) return;
      data.trash = data.trash.filter(function(id) { return done.indexOf(id) < 0; });
      _save();
    });
  }

  // ---------------- experiments ----------------
  function viewExpList() {
    var h = head(bi('Experimentos', 'Experiments'), bi('Adivina, observa y descubre', 'Guess, watch and find out'), 'home', stars(starCount()));
    h += '<p class="hu-intro" data-speak="' + esc(tx('Un experimento compara dos cosas que son iguales en todo menos en una. Primero adivinas qué pasará, después miras y anotas, y al final ves si tenías razón.', 'An experiment compares two things that are the same in every way but one. First you guess what will happen, then you watch and write it down, and at the end you see if you were right.')) + '">' +
      bi('Un experimento compara dos cosas que son iguales en todo menos en una. Primero adivinas (tu hipótesis), después observas y anotas, y al final ves qué aprendiste.', 'An experiment compares two things that are the same in every way but one. First you guess (your hypothesis), then you watch and write it down, and at the end you see what you learned.') + '</p><div class="hu-grid hu-explist">';
    D.EXPERIMENTS.forEach(function(x) {
      var st = E.expStatus(data.exp[x.id]), e = data.exp[x.id] || {};
      var n = (e.guess ? 1 : 0) + ((e.obs || []).length >= 3 ? 1 : 0) + (e.done ? 1 : 0);
      h += '<a class="hu-card hu-xcard" href="#exp/' + x.id + '">' + A.icon(x.icon === 'sun' ? 'sun' : x.icon === 'drop' ? 'drop' : 'bag') +
        '<div class="hu-card-txt"><b>' + obi(x) + '</b><span>' + pair(x.q) + '</span><em class="hu-pill' + (st === 'done' ? '' : ' hu-pill-grey') + '">' +
        (st === 'done' ? sh('Terminado', 'Done') : st === 'run' ? sh('Observando', 'Watching') : st === 'guess' ? sh('Hipótesis lista', 'Guess made') : sh('Nuevo', 'New')) + ' · ' + '⭐'.repeat(n) + '<span class="hu-dim">' + '☆'.repeat(3 - n) + '</span></em></div></a>';
    });
    h += '</div><p class="hu-links">' + bi('Más ciencia de plantas:', 'More plant science:') + ' <a href="lab-explorer.html">🔬 Lab Explorer</a> · <a href="naturaleza.html#guide/plants">🦅 ' + bi('Explorador de Naturaleza', 'Nature Explorer') + '</a></p>';
    root.innerHTML = h;
  }

  function viewExp(id) {
    var x = D.experiment(id);
    if (!x) { location.hash = 'exp'; return; }
    var e = data.exp[id] || {}, st = E.expStatus(data.exp[id]);
    var h = head(obi(x), pair(x.q), 'exp', stars(starCount()));
    // 1. what you need and what to do
    h += '<section class="hu-box"><h3>🧰 ' + bi('Necesitas', 'You need') + '</h3><ul class="hu-list">' + x.materials.map(function(m) { return '<li>' + pair(m) + '</li>'; }).join('') + '</ul>' +
      '<h3>👣 ' + bi('Cómo se hace', 'What to do') + '</h3><ol class="hu-list">' + x.steps.map(function(m) { return '<li data-speak="' + esc(one(m)) + '">' + pair(m) + '</li>'; }).join('') + '</ol></section>';
    // 2. the guess
    h += '<section class="hu-box"><h3>🤔 1. ' + bi('Tu hipótesis: ¿qué crees que pasará?', 'Your hypothesis: what do you think will happen?') + '</h3><div class="hu-opts hu-opts-col" role="radiogroup" aria-label="' + esc(tx('Tu hipótesis', 'Your hypothesis')) + '">';
    x.guesses.forEach(function(g) {
      var on = e.guess === g.id;
      h += '<button type="button" role="radio" aria-checked="' + on + '" class="hu-opt hu-opt-wide' + (on ? ' on' : '') + '" data-act="guess" data-id="' + g.id + '"' + (e.done ? ' disabled' : '') + '>' + obi(g) + '</button>';
    });
    h += '</div>';
    if (older() && e.guess) h += '<label class="hu-label" for="hu-why">' + bi('¿Por qué lo crees?', 'Why do you think so?') + '</label><textarea id="hu-why" class="hu-input" rows="2" maxlength="240"' + (e.done ? ' disabled' : '') + '>' + esc(e.why || '') + '</textarea>';
    h += '</section>';
    // 3. observations
    if (e.guess) {
      h += '<section class="hu-box"><h3>👀 2. ' + bi('Observa y anota', 'Watch and write it down') + '</h3>';
      if (e.start) h += '<p class="hu-muted">' + bi('Empezaste el ' + fmtDate(e.start, true) + ' (día ' + E.days(e.start, today()) + '). Obsérvalo unos ' + x.days + ' días.', 'You started on ' + fmtDate(e.start, true) + ' (day ' + E.days(e.start, today()) + '). Watch it for about ' + x.days + ' days.') + '</p>';
      h += obsTable(x, e);
      if (!e.done) h += obsForm(x);
      h += '</section>';
    }
    // 4. the result
    if ((e.obs || []).length >= 1) {
      h += '<section class="hu-box"><h3>💡 3. ' + bi('¿Qué pasó?', 'What happened?') + '</h3>';
      if (!e.done) {
        h += '<div class="hu-opts hu-opts-col" role="radiogroup" aria-label="' + esc(tx('Lo que pasó', 'What happened')) + '">';
        x.guesses.forEach(function(g) { h += '<button type="button" role="radio" aria-checked="' + (e.result === g.id) + '" class="hu-opt hu-opt-wide' + (e.result === g.id ? ' on' : '') + '" data-act="result" data-id="' + g.id + '">' + obi(g) + '</button>'; });
        h += '</div>';
        if (!little()) h += '<label class="hu-label" for="hu-learn">' + bi('¿Qué aprendiste? (con tus palabras)', 'What did you learn? (in your own words)') + '</label><textarea id="hu-learn" class="hu-input" rows="3" maxlength="400">' + esc(e.learned || '') + '</textarea>';
        h += '<button type="button" class="hu-btn hu-btn-go" data-act="finish">🏁 ' + bi('Terminar el experimento', 'Finish the experiment') + '</button>';
        if ((e.obs || []).length < 3) h += '<p class="hu-muted hu-small">' + bi('Consejo: anota al menos 3 observaciones antes de terminar.', 'Tip: write down at least 3 observations before you finish.') + '</p>';
      } else {
        var g1 = x.guesses.filter(function(g) { return g.id === e.guess; })[0], g2 = x.guesses.filter(function(g) { return g.id === e.result; })[0];
        h += '<p>' + bi('Tu hipótesis: ', 'Your hypothesis: ') + '<b>' + obi(g1) + '</b><br>' + bi('Lo que pasó: ', 'What happened: ') + '<b>' + obi(g2) + '</b></p>';
        h += '<p class="hu-verdict">' + (e.guess === e.result ? '🎯 ' + bi('¡Tu hipótesis se cumplió!', 'Your hypothesis was right!') : '🔬 ' + bi('Pasó algo distinto de lo que pensabas. ¡Así trabajan los científicos: cambian de idea cuando ven los datos!', 'Something different happened. That is how scientists work: they change their minds when they see the data!')) + '</p>';
        if (e.learned) h += '<blockquote class="hu-quote">' + esc(e.learned) + '</blockquote>';
        h += '<button type="button" class="hu-btn" data-act="reopen">↩ ' + bi('Seguir observando', 'Keep watching') + '</button>';
      }
      h += '</section>';
    }
    if (e.done) h += '<section class="hu-box hu-science"><h3>📚 ' + bi('Lo que dice la ciencia', 'What science says') + ' ' + sayBtn(one(x.learned)) + '</h3><p>' + pair(x.learned) + '</p></section>';
    h += '<p class="hu-links"><a href="lab-explorer.html">🔬 ' + bi('Lab Explorer: crecen las plantas', 'Lab Explorer: plant growth') + '</a> · <a href="naturaleza.html#guide/plants">🦅 ' + bi('Plantas de Chile', 'Plants of Chile') + '</a></p>';
    root.innerHTML = h;
    var why = document.getElementById('hu-why');
    if (why) why.addEventListener('change', function() { exp(id).why = why.value.trim().slice(0, 240); _save(); });
    var learn = document.getElementById('hu-learn');
    if (learn) learn.addEventListener('change', function() { exp(id).learned = learn.value.trim().slice(0, 400); _save(); });
    sayNow(one(x.q));
  }
  function exp(id) { if (!data.exp[id] || typeof data.exp[id] !== 'object') data.exp[id] = {}; return data.exp[id]; }
  function obsTable(x, e) {
    var obs = (e.obs || []).slice().sort(function(a, b) { return a.d < b.d ? -1 : 1; });
    if (!obs.length) return '<p class="hu-muted">' + bi('Todavía no hay observaciones.', 'No observations yet.') + '</p>';
    var h = '<div class="hu-tablewrap"><table class="hu-table"><thead><tr><th>' + bi('Día', 'Day') + '</th>';
    if (x.measure === 'checks') h += '<th>' + bi('Lo que viste', 'What you saw') + '</th>';
    else h += '<th>' + pair(x.a) + '</th><th>' + pair(x.b) + '</th>';
    h += '</tr></thead><tbody>';
    obs.forEach(function(o) {
      h += '<tr><td>' + esc(fmtDate(o.d)) + (e.start ? '<small> · ' + bi('día ' + E.days(e.start, o.d), 'day ' + E.days(e.start, o.d)) + '</small>' : '') + '</td>';
      if (x.measure === 'checks') h += '<td>' + (o.ck || []).map(function(c) { var k = x.checks.filter(function(q) { return q.id === c; })[0]; return k ? '✓ ' + obi(k) : ''; }).join('<br>') + '</td>';
      else h += '<td>' + side(o, 'a', x) + '</td><td>' + side(o, 'b', x) + '</td>';
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    if (x.measure === 'height' && obs.filter(function(o) { return typeof o.a === 'number' || typeof o.b === 'number'; }).length >= 2 && !little()) h += twoLines(obs, e, x);
    return h;
  }
  function side(o, k, x) {
    var bits = [];
    if (typeof o[k] === 'number') bits.push(esc(cm(o[k])));
    if (x.count && typeof o['n' + k] === 'number') bits.push(o['n' + k] + ' ' + bi('brotaron', 'sprouted'));
    if (x.colors && o['c' + k]) bits.push(o['c' + k] === 'green' ? '🟢 ' + bi('verde', 'green') : '🟡 ' + bi('pálida', 'pale'));
    if (o.tall) bits.push(o.tall === k ? '⬆ ' + bi('más alta', 'taller') : o.tall === 'same' ? '= ' : '');
    return bits.join('<br>') || '—';
  }
  function twoLines(obs, e, x) {
    var W = 320, H = 160, L = 30, B = 22, T = 10, R = 10, start = e.start || obs[0].d;
    var pts = obs.map(function(o) { return { d: E.days(start, o.d), a: o.a, b: o.b }; });
    var maxD = Math.max(1, pts[pts.length - 1].d), maxH = Math.max(2, Math.max.apply(null, pts.map(function(p) { return Math.max(p.a || 0, p.b || 0); })));
    function X(d) { return L + (W - L - R) * d / maxD; }
    function Y(v) { return H - B - (H - B - T) * v / maxH; }
    function line(k, col) {
      var q = pts.filter(function(p) { return typeof p[k] === 'number'; });
      if (!q.length) return '';
      return '<path d="' + q.map(function(p, i) { return (i ? 'L' : 'M') + n1(X(p.d)) + ' ' + n1(Y(p[k])); }).join('') + '" stroke="' + col + '" stroke-width="2.4" fill="none"/>' + q.map(function(p) { return '<circle cx="' + n1(X(p.d)) + '" cy="' + n1(Y(p[k])) + '" r="3.2" fill="' + col + '"/>'; }).join('');
    }
    return '<svg class="hu-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(tx('Gráfico de los dos lados', 'Chart of both sides')) + '"><path d="M' + L + ' ' + T + 'V' + (H - B) + 'H' + (W - R) + '" stroke="#8a6a44" fill="none"/>' +
      '<text x="' + (L - 4) + '" y="' + (T + 8) + '" text-anchor="end" font-size="9" fill="#6b5a44">' + n1(maxH) + '</text><text x="' + (L - 4) + '" y="' + (H - B) + '" text-anchor="end" font-size="9" fill="#6b5a44">0</text>' +
      '<text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="9" fill="#6b5a44">' + esc(tx('días', 'days')) + ' (' + maxD + ')</text>' +
      line('a', '#d97706') + line('b', '#4b5563') + '</svg><p class="hu-legend"><span class="hu-dot" style="background:#d97706"></span> ' + pair(x.a) + ' <span class="hu-dot" style="background:#4b5563"></span> ' + pair(x.b) + '</p>';
  }
  function obsForm(x) {
    var step = older() ? 0.1 : 0.5, h = '<form class="hu-obs" id="hu-obs" novalidate><h4>' + bi('Nueva observación', 'New observation') + ' · ' + esc(fmtDate(today())) + '</h4>';
    if (x.measure === 'checks') {
      h += '<div class="hu-checks">' + x.checks.map(function(c) { return '<label class="hu-checkbox"><input type="checkbox" value="' + c.id + '"><span>' + obi(c) + '</span></label>'; }).join('') + '</div>';
    } else if (little()) {
      h += '<p class="hu-label">' + bi('¿Cuál está más alta?', 'Which one is taller?') + '</p><div class="hu-opts" role="radiogroup" aria-label="' + esc(tx('¿Cuál está más alta?', 'Which one is taller?')) + '">' +
        [['a', x.a], ['b', x.b], ['same', ['Iguales', 'The same']]].map(function(o) { return '<button type="button" role="radio" aria-checked="false" class="hu-opt" data-act="tall" data-id="' + o[0] + '">' + pair(o[1]) + '</button>'; }).join('') + '</div>';
    } else {
      ['a', 'b'].forEach(function(k) {
        h += '<fieldset class="hu-side"><legend>' + pair(x[k]) + '</legend>' +
          '<label>' + bi('Altura', 'Height') + ' <input class="hu-input hu-input-s" type="number" inputmode="decimal" min="0" max="200" step="' + step + '" data-k="' + k + '"> cm</label>' +
          (x.count ? '<label>' + bi('Brotaron', 'Sprouted') + ' <input class="hu-input hu-input-s" type="number" inputmode="numeric" min="0" max="20" data-k="n' + k + '"></label>' : '') +
          (x.colors ? '<label>' + bi('Color', 'Colour') + ' <select class="hu-input" data-k="c' + k + '"><option value=""></option><option value="green">' + esc(tx('verde', 'green')) + '</option><option value="pale">' + esc(tx('pálida o amarilla', 'pale or yellow')) + '</option></select></label>' : '') +
          '</fieldset>';
      });
    }
    return h + '<button type="submit" class="hu-btn hu-btn-go">➕ ' + bi('Anotar', 'Write it down') + '</button></form>';
  }
  function addObs(id) {
    var x = D.experiment(id), f = document.getElementById('hu-obs');
    if (!x || !f) return;
    var o = { d: today() };
    if (x.measure === 'checks') o.ck = Array.prototype.slice.call(f.querySelectorAll('input[type=checkbox]:checked')).map(function(i) { return i.value; });
    else if (little()) { var on = f.querySelector('.hu-opt.on'); if (on) o.tall = on.getAttribute('data-id'); }
    else Array.prototype.forEach.call(f.querySelectorAll('[data-k]'), function(i) {
      var k = i.getAttribute('data-k'), v = i.value;
      if (i.tagName === 'SELECT') { if (v) o[k] = v; return; }
      var num = parseFloat(String(v).replace(',', '.'));
      if (isFinite(num) && num >= 0) o[k] = k.charAt(0) === 'n' ? Math.round(num) : Math.round(num * 10) / 10;
    });
    if (Object.keys(o).length < 2 || (o.ck && !o.ck.length)) { toast(tx('Anota algo primero.', 'Write something down first.')); return; }
    var e = exp(id);
    mark();
    if (!Array.isArray(e.obs)) e.obs = [];
    e.obs = e.obs.filter(function(p) { return p.d !== o.d; });     // one a day: today's replaces today's
    e.obs.push(o);
    if (e.obs.length > 60) e.obs = e.obs.slice(-60);
    if (!e.start) e.start = o.d;
    commit();
    route();
  }

  // ---------------- seasons ----------------
  function viewSeasons() {
    var m = nowMonth();
    var h = head(bi('¿Por qué las estaciones están al revés?', 'Why are the seasons the other way round?'), bi('California y Chile', 'California and Chile'), 'home');
    h += '<div class="hu-two"><div class="hu-box hu-dark">' + A.seasons(isEs()) + '</div><div class="hu-box"><p data-speak="' + esc(tx(SEASON_TEXT[0][0], SEASON_TEXT[0][1])) + '">' + pair(SEASON_TEXT[0]) + '</p>' +
      (little() ? '' : '<p>' + pair(SEASON_TEXT[1]) + '</p><p>' + pair(SEASON_TEXT[2]) + '</p>') + '</div></div>';
    h += '<h2 class="hu-h2">' + bi('Para sembrar en ' + D.MONTHS.esLong[m - 1], 'To plant in ' + D.MONTHS.enLong[m - 1]) + '</h2><div class="hu-two">';
    [['ca', '🇺🇸 California'], ['cl', '🇨🇱 Chile']].forEach(function(r) {
      var list = D.PLANTS.filter(function(p) { return monthsFor(p, r[0]).indexOf(m) >= 0; });
      h += '<div class="hu-box"><h3>' + r[1] + '</h3>' + (list.length ? '<div class="hu-mini-grid">' + list.map(function(p) { return '<a class="hu-mini-card" href="#plant/' + p.id + '">' + A.plant(p.id, 5, { where: 'pot' }) + '<span>' + esc(ot(p)) + '</span></a>'; }).join('') + '</div>' : '<p class="hu-muted">' + bi('Este mes casi no se siembra afuera; es buen momento para preparar la tierra.', 'Little goes outdoors this month; a good time to get the soil ready.') + '</p>') + '</div>';
    });
    h += '</div><p class="hu-muted hu-small">' + bi('Donde hiela en invierno, espera a que terminen las heladas antes de sembrar lo que necesita calor (poroto, tomate, choclo, zapallo, ají).', 'Where it freezes in winter, wait until the frosts are over before sowing the warm-weather plants (beans, tomato, corn, squash, chili).') + '</p>';
    root.innerHTML = h;
    sayNow(tx(SEASON_TEXT[0][0], SEASON_TEXT[0][1]));
  }
  var SEASON_TEXT = [
    ['La Tierra da una vuelta al Sol en un año, con su eje siempre inclinado hacia el mismo lado. En junio la mitad norte, donde está California, mira más hacia el Sol: allá es verano. En diciembre es la mitad sur, donde está Chile, la que mira hacia el Sol: allá es verano y en California es invierno.',
     'The Earth goes around the Sun once a year, with its axis always tilted the same way. In June the northern half, where California is, leans toward the Sun: it is summer there. In December the southern half, where Chile is, leans toward the Sun: it is summer there and winter in California.'],
    ['Cuando tu mitad mira hacia el Sol, los rayos llegan más derechos y los días son más largos, así que hace más calor. Las plantas de verano (poroto, tomate, choclo) se siembran en primavera, cuando ya no hiela.',
     'When your half leans toward the Sun, its rays come down more directly and the days are longer, so it is warmer. Summer plants (beans, tomatoes, corn) are sown in spring, once the frosts are over.'],
    ['El valle de Santa Clara y Santiago tienen un clima parecido, llamado mediterráneo: veranos secos y calurosos e inviernos suaves con lluvia. Por eso se siembra casi lo mismo, pero con seis meses de diferencia.',
     'The Santa Clara Valley and Santiago have a similar climate, called Mediterranean: dry, warm summers and mild, rainy winters. So almost the same things are planted, six months apart.']
  ];

  // ---------------- routing and events ----------------
  function onLeave(fn) { cleanup.push(fn); }
  function leave() { cleanup.forEach(function(f) { try { f(); } catch (e) {} }); cleanup = []; }

  var current = { view: 'home', id: '' };
  function route() {
    leave();
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.stop) { try { ZsSpeak.stop(); } catch (e) {} }
    var parts = (location.hash || '#home').slice(1).split('/'), v = parts[0] || 'home', id = decodeURIComponent(parts[1] || '');
    current = { view: v, id: id };
    if (v === 'guide') viewGuide();
    else if (v === 'plant') viewPlant(id);
    else if (v === 'add') viewAdd(id);
    else if (v === 'p') viewMine(id);
    else if (v === 'entry') { viewEntry(id); rulerDrag(); }
    else if (v === 'exp' && id) viewExp(id);
    else if (v === 'exp') viewExpList();
    else if (v === 'seasons') viewSeasons();
    else { current.view = 'home'; viewHome(); }
    var h1 = root.querySelector('h1');
    if (h1 && route.moved) { try { h1.focus({ preventScroll: true }); } catch (e) {} }
    route.moved = true;
    window.scrollTo(0, 0);
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.scan) { try { ZsSpeak.scan(); } catch (e) {} }
  }

  function onClick(e) {
    var b = e.target.closest('[data-act]');
    if (!b || !root.contains(b) || b.disabled) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    switch (act) {
      case 'water': water(id); break;
      case 'filter': guideFilter = id; viewGuide(); break;
      case 'region': data.region = id; _save(); route(); break;
      case 'istage': infoStage[current.id] = +id; viewPlant(current.id); break;
      case 'where':
        Array.prototype.forEach.call(root.querySelectorAll('[data-act=where]'), function(x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
        document.getElementById('hu-where').value = id;
        var prev = root.querySelector('.hu-preview svg');
        if (prev) prev.outerHTML = A.plant(current.id, 0, { where: id });
        break;
      case 'mile': setMile(id, b.getAttribute('data-k')); break;
      case 'toggle': b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); break;
      case 'hstep': {
        var hin = document.getElementById('hu-eh'), step = older() ? 0.1 : 0.5, v = (parseFloat(hin.value) || 0) + step * (+id);
        v = Math.max(0, Math.round(v * 10) / 10);
        hin.value = String(v); setRuler(v); break;
      }
      case 'color':
        if (canvasState) canvasState.color = +id;
        Array.prototype.forEach.call(root.querySelectorAll('.hu-color'), function(x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        break;
      case 'undo': if (draft) { draft.strokes.pop(); redraw(); } break;
      case 'clear': if (draft) { draft.strokes = []; redraw(); } break;
      case 'photo': showPhoto(id); break;
      case 'predict': {
        var pl = mine(id), r = document.getElementById('hu-pred-r');
        if (!pl || !r) return;
        pl.pred.push({ made: today(), 'for': E.addDays(today(), 7), h: Math.round(parseFloat(r.value) * 10) / 10 });
        if (pl.pred.length > 30) pl.pred = pl.pred.slice(-30);
        logAct('🔮', 'Guessed ' + r.value + ' cm in a week for ' + nameOf(pl));
        _save(); route(); break;
      }
      case 'delentry': {
        var p2 = mine(id), eid = b.getAttribute('data-e');
        confirmBox('¿Borrar esta entrada del diario?', 'Delete this journal entry?').then(function(ok) {
          if (!ok || !p2) return;
          var gone = p2.log.filter(function(x) { return x && x.id === eid; })[0];
          if (gone && gone.ph) forgetPhoto(gone.ph);
          p2.log = p2.log.filter(function(x) { return !x || x.id !== eid; });
          _save(); refreshStars(); route();
        });
        break;
      }
      case 'done': case 'undone': { var p3 = mine(id); if (p3) { p3.done = act === 'done' ? 1 : 0; if (p3.done) logAct('🏁', 'Finished the journal of ' + nameOf(p3)); _save(); route(); } break; }
      case 'delplant': {
        var p4 = mine(id);
        confirmBox('¿Borrar esta planta y todo su diario? No se puede deshacer.', 'Delete this plant and its whole journal? This cannot be undone.').then(function(ok) {
          if (!ok || !p4) return;
          p4.log.forEach(function(x) { if (x && x.ph) forgetPhoto(x.ph); });
          data.plants = data.plants.filter(function(x) { return x.id !== p4.id; });
          _save(); refreshStars(); location.hash = 'home';
        });
        break;
      }
      case 'guess': {
        var ex = exp(current.id);
        mark();
        ex.guess = id;
        if (!ex.start) ex.start = '';
        logAct('🤔', 'Hypothesis for the ' + D.experiment(current.id).en.toLowerCase() + ' experiment');
        commit(); viewExp(current.id); break;
      }
      case 'tall':
        Array.prototype.forEach.call(b.parentNode.querySelectorAll('.hu-opt'), function(x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
        break;
      case 'result': exp(current.id).result = id; _save(); viewExp(current.id); break;
      case 'finish': {
        var ex2 = exp(current.id);
        if (!ex2.result) { toast(tx('Primero elige lo que pasó.', 'First pick what happened.')); return; }
        var ln = document.getElementById('hu-learn');
        if (ln) ex2.learned = ln.value.trim().slice(0, 400);
        mark();
        ex2.done = today();
        logAct('🔬', 'Finished the ' + D.experiment(current.id).en.toLowerCase() + ' experiment');
        sfx('correct');
        commit(); viewExp(current.id); break;
      }
      case 'reopen': exp(current.id).done = ''; _save(); refreshStars(); viewExp(current.id); break;
    }
  }
  function onSubmit(e) {
    if (e.target && e.target.id === 'hu-obs') { e.preventDefault(); addObs(current.id); }
  }
  function onInput(e) {
    if (e.target && e.target.id === 'hu-pred-r') { var o = document.getElementById('hu-pred-o'); if (o) o.textContent = cm(parseFloat(e.target.value)); }
  }

  function init() {
    root = document.getElementById('hu-wrap');
    if (!root) return;
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    tier = typeof getAgeTier === 'function' ? getAgeTier(user && user.age) : 'intermediate';
    data = _load();
    document.documentElement.lang = isEs() ? 'es' : 'en';
    flushTrash();
    if (typeof CloudSync !== 'undefined') setTimeout(flushTrash, 15000);   // once the sync has had a chance to connect
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    root.addEventListener('input', onInput);
    window.addEventListener('hashchange', route);
    // the sync may bring a newer copy from another device
    window.addEventListener('storage', function(ev) { if (ev.key === _key()) { data = _load(); route(); } });
    route.moved = false;
    route();
  }
  function reload() { data = _load(); route(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return {
    reload: reload,
    state: function() { return { view: current.view, id: current.id, tier: tier, data: JSON.parse(JSON.stringify(data)), stars: starCount() }; }
  };
})();
if (typeof window !== 'undefined') window.Huerto = Huerto;
