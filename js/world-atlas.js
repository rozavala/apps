/* ================================================================
   WORLD ATLAS — world-atlas.js
   Capitals, currencies and populations of all 195 countries.

   Three modes:
     1. All Countries — searchable, filterable, sortable reference list
     2. Study Cards   — flip cards with per-country mastery tracking
     3. Quizzes       — 10-question rounds, five question types

   Data: js/world-atlas-data.js (WORLD_ATLAS_DATA), loaded first.
   Storage key: zs_atlas_[username] via getUserAppKey('zs_atlas_')

   Requires: auth.js, sounds.js, activity-log.js
   ================================================================ */

var WorldAtlas = (function() {
  'use strict';

  var STORE_PREFIX = 'zs_atlas_';
  var CARDS_PER_SESSION = 15;
  var QUESTIONS_PER_QUIZ = 10;

  var COUNTRIES = (typeof WORLD_ATLAS_DATA !== 'undefined') ? WORLD_ATLAS_DATA : [];

  var REGIONS = [
    { id: 'all',      icon: '🌍', en: 'All',      es: 'Todos' },
    { id: 'Africa',   icon: '🌍', en: 'Africa',   es: 'África' },
    { id: 'Americas', icon: '🌎', en: 'Americas', es: 'América' },
    { id: 'Asia',     icon: '🌏', en: 'Asia',     es: 'Asia' },
    { id: 'Europe',   icon: '🏰', en: 'Europe',   es: 'Europa' },
    { id: 'Oceania',  icon: '🏝️', en: 'Oceania',  es: 'Oceanía' }
  ];

  var QUIZ_TYPES = [
    { id: 'capital',    icon: '🏛️', en: 'Capitals',        es: 'Capitales',
      dEn: 'Which city is the capital?',    dEs: '¿Cuál es la capital?' },
    { id: 'country',    icon: '📍', en: 'Find the Country', es: 'Encuentra el País',
      dEn: 'A capital is shown — name the country.', dEs: 'Se muestra una capital: nombra el país.' },
    { id: 'currency',   icon: '💰', en: 'Currencies',      es: 'Monedas',
      dEn: 'Which money do they use?',      dEs: '¿Qué moneda usan?' },
    { id: 'population', icon: '👥', en: 'Population',      es: 'Población',
      dEn: 'Which country has the most people?', dEs: '¿Qué país tiene más habitantes?' },
    { id: 'flag',       icon: '🚩', en: 'Flags',           es: 'Banderas',
      dEn: 'Which country owns this flag?', dEs: '¿De qué país es esta bandera?' },
    { id: 'mixed',      icon: '🎲', en: 'Mixed',           es: 'Mezclado',
      dEn: 'A bit of everything.',          dEs: 'Un poco de todo.' }
  ];

  // ── State ────────────────────────────────────────────────────────
  var lang = 'en';
  var browse = { search: '', region: 'all', sort: 'name' };
  var study = { deck: [], index: 0, deckName: '', right: 0, again: 0 };
  var quiz = { type: 'capital', region: 'all', questions: [], index: 0,
               score: 0, missed: [], answered: false };

  // ── Storage ──────────────────────────────────────────────────────
  function _key() {
    return (typeof getUserAppKey === 'function') ? getUserAppKey(STORE_PREFIX) : null;
  }

  function _load() {
    var k = _key();
    if (!k) return _blank();
    try {
      var d = JSON.parse(localStorage.getItem(k));
      if (!d || typeof d !== 'object') return _blank();
      d.totalStars = d.totalStars || 0;
      d.countries = d.countries || {};
      d.quizzes = d.quizzes || {};
      d.cardsStudied = d.cardsStudied || 0;
      return d;
    } catch (e) { return _blank(); }
  }

  function _blank() {
    return { totalStars: 0, countries: {}, quizzes: {}, cardsStudied: 0, lang: 'en' };
  }

  function _save(data) {
    var k = _key();
    if (!k) return;
    try {
      localStorage.setItem(k, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    } catch (e) { console.warn('[WorldAtlas] save failed', e); }
  }

  // Per-country record: { r: timesKnown, w: timesMissed, m: mastered }
  function _record(iso, known) {
    var data = _load();
    var rec = data.countries[iso] || { r: 0, w: 0, m: false };
    if (known) rec.r++; else rec.w++;
    rec.m = rec.r >= 2 && rec.r > rec.w;
    data.countries[iso] = rec;
    _save(data);
    return rec;
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function t(en, es) { return lang === 'es' ? es : en; }

  function cName(c)    { return lang === 'es' ? c.nameEs : c.name; }
  function cCapital(c) { return lang === 'es' ? c.capitalEs : c.capital; }
  function cRegion(c)  { return lang === 'es' ? c.regionEs : c.region; }
  function cCurrency(c) {
    return lang === 'es' ? (c.currencyNameEs || c.currencyName) : c.currencyName;
  }

  function $(id) { return document.getElementById(id); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Population as a friendly phrase plus the exact number.
  function popShort(n) {
    if (n == null) return '—';
    if (n >= 1e9) {
      return (n / 1e9).toFixed(2) + t(' billion', ' mil millones');
    }
    if (n >= 1e6) {
      var m = n / 1e6;
      return (m >= 10 ? Math.round(m) : m.toFixed(1)) + t(' million', ' millones');
    }
    if (n >= 1e3) {
      return Math.round(n / 1e3) + t(' thousand', ' mil');
    }
    return String(n);
  }

  function popExact(n) {
    if (n == null) return '—';
    try { return n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US'); }
    catch (e) { return String(n); }
  }

  function areaFmt(a) {
    if (a == null) return '—';
    try { return Math.round(a).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US') + ' km²'; }
    catch (e) { return a + ' km²'; }
  }

  function inRegion(c, region) { return region === 'all' || c.region === region; }

  function sound(name) {
    if (typeof Sounds !== 'undefined' && typeof Sounds[name] === 'function') {
      try { Sounds[name](); } catch (e) { /* audio is optional */ }
    }
  }

  function flash(emoji) {
    var el = $('wa-feedback');
    if (!el) return;
    $('wa-feedback-emoji').textContent = emoji;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 750);
  }

  function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    var el = $(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  // ── Language ─────────────────────────────────────────────────────
  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    var data = _load();
    data.lang = lang;
    _save(data);
    sound('click');
    _applyLanguage();
  }

  function _applyLanguage() {
    document.documentElement.lang = lang;
    $('wa-lang-label').textContent = lang === 'en' ? 'EN' : 'ES';
    $('wa-title').textContent = t('World Atlas', 'Atlas Mundial');
    $('wa-subtitle').textContent = t(
      'Capitals, currencies and populations of all 195 countries.',
      'Capitales, monedas y población de los 195 países del mundo.');

    $('wa-mode-browse-title').textContent = t('All Countries', 'Todos los Países');
    $('wa-mode-browse-desc').textContent  = t('Look up any country — search, filter and sort.',
                                              'Busca cualquier país: buscador, filtros y orden.');
    $('wa-mode-study-title').textContent  = t('Study Cards', 'Tarjetas de Estudio');
    $('wa-mode-study-desc').textContent   = t('Flip cards and mark what you know.',
                                              'Da vuelta las tarjetas y marca lo que ya sabes.');
    $('wa-mode-quiz-title').textContent   = t('Quizzes', 'Concursos');
    $('wa-mode-quiz-desc').textContent    = t('10 questions — earn stars for each round.',
                                              '10 preguntas: gana estrellas en cada ronda.');

    $('wa-browse-title').textContent = t('All Countries', 'Todos los Países');
    $('wa-search').placeholder = t('Search country or capital…', 'Busca un país o capital…');
    $('wa-search-label').textContent = t('Search countries', 'Buscar países');
    $('wa-sort-label').textContent = t('Sort:', 'Orden:');
    $('wa-study-title').textContent = t('Study Cards', 'Tarjetas de Estudio');
    $('wa-study-lead').textContent = t('Pick a deck to study.', 'Elige un mazo para estudiar.');
    $('wa-fliphint').textContent = t('Tap the card to see the answer',
                                     'Toca la tarjeta para ver la respuesta');
    $('wa-card-again-label').textContent = t('Practice again', 'Practicar de nuevo');
    $('wa-card-know-label').textContent = t('I know it', 'Ya lo sé');
    $('wa-quiz-title').textContent = t('Quizzes', 'Concursos');
    $('wa-quiz-lead-type').textContent = t('Choose what to practise.', 'Elige qué practicar.');
    $('wa-quiz-lead-region').textContent = t('Choose a region.', 'Elige una región.');
    $('wa-quiz-start-label').textContent = t('Start quiz', 'Comenzar');
    $('wa-datanote').textContent = t(
      'Population figures are 2025 estimates, rounded — they teach scale, not exact head counts. ' +
      'Includes the 193 UN member states plus Vatican City and Palestine.',
      'Las cifras de población son estimaciones de 2025, redondeadas: enseñan el orden de magnitud, ' +
      'no el conteo exacto. Incluye los 193 Estados miembros de la ONU más el Vaticano y Palestina.');

    _renderSummary();
    _renderRegionChips();
    _renderSortChips();
    _renderList();
    _renderDecks();
    _renderQuizSetup();
  }

  // ── Home ─────────────────────────────────────────────────────────
  function goHome() {
    sound('click');
    _renderSummary();
    showScreen('wa-screen-home');
  }

  function _renderSummary() {
    var data = _load();
    var mastered = 0;
    for (var iso in data.countries) {
      if (data.countries[iso] && data.countries[iso].m) mastered++;
    }
    var stats = [
      { value: mastered + '/' + COUNTRIES.length, label: t('Mastered', 'Dominados') },
      { value: String(data.totalStars || 0) + ' ⭐',   label: t('Stars', 'Estrellas') },
      { value: String(data.cardsStudied || 0),    label: t('Cards', 'Tarjetas') }
    ];
    $('wa-summary').innerHTML = stats.map(function(s) {
      return '<div class="wa-stat">' +
             '<div class="wa-stat-value">' + escHtml(s.value) + '</div>' +
             '<div class="wa-stat-label">' + escHtml(s.label) + '</div></div>';
    }).join('');
  }

  // ── Mode 1: browse all countries ─────────────────────────────────
  function openBrowse() {
    sound('click');
    _renderRegionChips();
    _renderSortChips();
    _renderList();
    showScreen('wa-screen-browse');
  }

  function _renderRegionChips() {
    var host = $('wa-region-chips');
    if (!host) return;
    host.innerHTML = REGIONS.map(function(r) {
      return '<button class="wa-chip' + (browse.region === r.id ? ' active' : '') +
             '" data-region="' + escHtml(r.id) + '">' +
             r.icon + ' ' + escHtml(lang === 'es' ? r.es : r.en) + '</button>';
    }).join('');
    Array.prototype.forEach.call(host.querySelectorAll('.wa-chip'), function(btn) {
      btn.onclick = function() {
        browse.region = btn.dataset.region;
        sound('click');
        _renderRegionChips();
        _renderList();
      };
    });
  }

  function _renderSortChips() {
    var host = $('wa-sort-chips');
    if (!host) return;
    var sorts = [
      { id: 'name', label: t('A–Z', 'A–Z') },
      { id: 'pop',  label: t('Most people', 'Más habitantes') },
      { id: 'area', label: t('Biggest', 'Más grande') }
    ];
    host.innerHTML = sorts.map(function(s) {
      return '<button class="wa-chip' + (browse.sort === s.id ? ' active' : '') +
             '" data-sort="' + escHtml(s.id) + '">' + escHtml(s.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(host.querySelectorAll('.wa-chip'), function(btn) {
      btn.onclick = function() {
        browse.sort = btn.dataset.sort;
        sound('click');
        _renderSortChips();
        _renderList();
      };
    });
  }

  function _filtered() {
    var q = browse.search.trim().toLowerCase();
    var list = COUNTRIES.filter(function(c) {
      if (!inRegion(c, browse.region)) return false;
      if (!q) return true;
      return (c.name + ' ' + c.nameEs + ' ' + c.capital + ' ' + c.capitalEs + ' ' +
              (c.currency || '') + ' ' + (c.currencyName || '')).toLowerCase().indexOf(q) !== -1;
    });
    if (browse.sort === 'pop') {
      list.sort(function(a, b) { return (b.population || 0) - (a.population || 0); });
    } else if (browse.sort === 'area') {
      list.sort(function(a, b) { return (b.area || 0) - (a.area || 0); });
    } else {
      list.sort(function(a, b) { return cName(a).localeCompare(cName(b)); });
    }
    return list;
  }

  function _renderList() {
    var host = $('wa-list');
    if (!host) return;
    var list = _filtered();
    var data = _load();

    $('wa-browse-count').textContent = list.length + ' ' + t('countries', 'países');

    var empty = $('wa-empty');
    if (!list.length) {
      host.innerHTML = '';
      empty.hidden = false;
      empty.textContent = t('No countries match that search.',
                            'Ningún país coincide con esa búsqueda.');
      return;
    }
    empty.hidden = true;

    host.innerHTML = list.map(function(c) {
      var rec = data.countries[c.id];
      var known = rec && rec.m ? '<span class="wa-row-known" title="' +
        escHtml(t('Mastered', 'Dominado')) + '">✅</span>' : '';
      return '<button class="wa-row" data-id="' + escHtml(c.id) + '">' +
             '<span class="wa-row-flag">' + escHtml(c.flag) + '</span>' +
             '<span class="wa-row-main">' +
               '<span class="wa-row-name">' + escHtml(cName(c)) + '</span>' +
               '<span class="wa-row-sub">' + escHtml(cCapital(c)) + ' · ' +
                 escHtml(c.currency || '—') + '</span>' +
             '</span>' +
             '<span class="wa-row-pop">' + escHtml(popShort(c.population)) + '</span>' +
             known + '</button>';
    }).join('');

    Array.prototype.forEach.call(host.querySelectorAll('.wa-row'), function(btn) {
      btn.onclick = function() { openCountry(btn.dataset.id); };
    });
  }

  function openCountry(id) {
    var c = COUNTRIES.filter(function(x) { return x.id === id; })[0];
    if (!c) return;
    sound('click');

    var other = lang === 'es' ? c.name : c.nameEs;
    var facts = [
      { label: t('Capital', 'Capital'),   value: cCapital(c),
        extra: c.capital !== c.capitalEs ? (lang === 'es' ? c.capital : c.capitalEs) : '' },
      { label: t('Currency', 'Moneda'),   value: cCurrency(c),
        extra: (c.currency || '') + (c.currencySymbol ? '  ' + c.currencySymbol : '') },
      { label: t('Population', 'Población'), value: popShort(c.population),
        extra: popExact(c.population) + ' · ' + t('2025 estimate', 'estimación 2025') },
      { label: t('Area', 'Superficie'),   value: areaFmt(c.area),
        extra: c.landlocked ? t('Landlocked — no sea coast', 'Sin salida al mar') : '' }
    ];

    var html =
      '<div class="wa-detail-flag">' + escHtml(c.flag) + '</div>' +
      '<div class="wa-detail-name">' + escHtml(cName(c)) + '</div>' +
      '<div class="wa-detail-region">' + escHtml(other) + ' · ' + escHtml(cRegion(c)) +
        ' · ' + escHtml(c.subregion) + '</div>' +
      '<div class="wa-facts">' + facts.map(function(f) {
        return '<div class="wa-fact">' +
               '<div class="wa-fact-label">' + escHtml(f.label) + '</div>' +
               '<div class="wa-fact-value">' + escHtml(f.value) + '</div>' +
               (f.extra ? '<div class="wa-fact-extra">' + escHtml(f.extra) + '</div>' : '') +
               '</div>';
      }).join('') + '</div>';

    if (c.capitalNote) {
      html += '<div class="wa-note">ℹ️ ' + escHtml(lang === 'es' ? c.capitalNote.es : c.capitalNote.en) + '</div>';
    }
    if (!c.un) {
      html += '<div class="wa-note">🕊️ ' + escHtml(t(
        'A United Nations observer state rather than a member state.',
        'Estado observador de las Naciones Unidas, no Estado miembro.')) + '</div>';
    }

    $('wa-detail').innerHTML = html;
    $('wa-country-bartitle').textContent = cName(c);
    showScreen('wa-screen-country');
    // Browsing is not logged: the shared activity log keeps only the last
    // 100 entries, and flicking through the list would evict real progress.
  }

  // ── Mode 2: study cards ──────────────────────────────────────────
  function openStudy() {
    sound('click');
    _renderDecks();
    showScreen('wa-screen-study-setup');
  }

  function _needsPractice() {
    var data = _load();
    return COUNTRIES.filter(function(c) {
      var rec = data.countries[c.id];
      return rec && !rec.m && (rec.w > 0 || rec.r > 0);
    });
  }

  function _renderDecks() {
    var host = $('wa-decks');
    if (!host) return;
    var data = _load();

    var decks = REGIONS.map(function(r) {
      var pool = r.id === 'all' ? COUNTRIES : COUNTRIES.filter(function(c) { return c.region === r.id; });
      var mastered = pool.filter(function(c) {
        var rec = data.countries[c.id]; return rec && rec.m;
      }).length;
      return {
        id: r.id, icon: r.icon,
        name: r.id === 'all' ? t('Whole World', 'Todo el Mundo') : (lang === 'es' ? r.es : r.en),
        desc: mastered + '/' + pool.length + ' ' + t('mastered', 'dominados'),
        count: pool.length
      };
    });

    var practice = _needsPractice();
    if (practice.length) {
      decks.push({
        id: 'practice', icon: '🔁',
        name: t('Needs Practice', 'Para Practicar'),
        desc: t('Countries you missed before', 'Países que fallaste antes'),
        count: practice.length
      });
    }

    host.innerHTML = decks.map(function(d) {
      return '<button class="wa-deck" data-deck="' + escHtml(d.id) + '">' +
             '<span class="wa-deck-icon">' + d.icon + '</span>' +
             '<span class="wa-deck-main">' +
               '<span class="wa-deck-name">' + escHtml(d.name) + '</span>' +
               '<span class="wa-deck-desc">' + escHtml(d.desc) + '</span>' +
             '</span>' +
             '<span class="wa-deck-count">' + d.count + '</span></button>';
    }).join('');

    Array.prototype.forEach.call(host.querySelectorAll('.wa-deck'), function(btn) {
      btn.onclick = function() { startStudy(btn.dataset.deck); };
    });
  }

  function startStudy(deckId) {
    var data = _load();
    var pool;
    if (deckId === 'practice') {
      pool = _needsPractice();
      study.deckName = t('Needs Practice', 'Para Practicar');
    } else if (deckId === 'all') {
      pool = COUNTRIES.slice();
      study.deckName = t('Whole World', 'Todo el Mundo');
    } else {
      pool = COUNTRIES.filter(function(c) { return c.region === deckId; });
      var r = REGIONS.filter(function(x) { return x.id === deckId; })[0];
      study.deckName = r ? (lang === 'es' ? r.es : r.en) : deckId;
    }
    if (!pool.length) return;

    // Unmastered countries come first so a session teaches what is still weak.
    var fresh = shuffle(pool.filter(function(c) {
      var rec = data.countries[c.id]; return !rec || !rec.m;
    }));
    var done = shuffle(pool.filter(function(c) {
      var rec = data.countries[c.id]; return rec && rec.m;
    }));
    study.deck = fresh.concat(done).slice(0, CARDS_PER_SESSION);
    study.index = 0;
    study.right = 0;
    study.again = 0;

    sound('click');
    _showCard();
    showScreen('wa-screen-study');
  }

  function _showCard() {
    var c = study.deck[study.index];
    if (!c) { _finishStudy(); return; }

    $('wa-card-deckname').textContent = study.deckName;
    $('wa-card-progress').textContent = (study.index + 1) + '/' + study.deck.length;
    $('wa-card-fill').style.width = ((study.index) / study.deck.length * 100) + '%';

    $('wa-card-front').innerHTML =
      '<div class="wa-card-flag">' + escHtml(c.flag) + '</div>' +
      '<div class="wa-card-name">' + escHtml(cName(c)) + '</div>' +
      '<div class="wa-card-region">' + escHtml(cRegion(c)) + '</div>';

    var rows = [
      { label: t('Capital', 'Capital'),     value: cCapital(c) },
      { label: t('Currency', 'Moneda'),     value: cCurrency(c) + ' (' + (c.currency || '—') + ')' },
      { label: t('Population', 'Población'), value: popShort(c.population) }
    ];
    $('wa-card-backface').innerHTML =
      '<div class="wa-card-name">' + escHtml(cName(c)) + '</div>' +
      '<div class="wa-card-rows">' + rows.map(function(r) {
        return '<div class="wa-card-row">' +
               '<span class="wa-card-row-label">' + escHtml(r.label) + '</span>' +
               '<span class="wa-card-row-value">' + escHtml(r.value) + '</span></div>';
      }).join('') + '</div>';

    $('wa-card').classList.remove('flipped');
    $('wa-card-btns').hidden = true;
    $('wa-fliphint').hidden = false;
  }

  function flipCard() {
    var card = $('wa-card');
    if (!card) return;
    var flipped = card.classList.toggle('flipped');
    sound('click');
    $('wa-card-btns').hidden = !flipped;
    $('wa-fliphint').hidden = flipped;
  }

  function answerCard(known) {
    var c = study.deck[study.index];
    if (!c) return;
    _record(c.id, known);

    var data = _load();
    data.cardsStudied = (data.cardsStudied || 0) + 1;
    _save(data);

    if (known) { study.right++; sound('correct'); flash('✅'); }
    else { study.again++; sound('click'); flash('🔁'); }

    study.index++;
    setTimeout(function() {
      if (study.index >= study.deck.length) _finishStudy();
      else _showCard();
    }, 350);
  }

  function _finishStudy() {
    sound('cheer');
    var total = study.right + study.again;
    $('wa-results').innerHTML =
      '<div class="wa-results-emoji">🎴</div>' +
      '<div class="wa-results-title">' + escHtml(t('Deck complete!', '¡Mazo completo!')) + '</div>' +
      '<div class="wa-results-score">' +
        escHtml(t('You knew ', 'Sabías ') + study.right + t(' of ', ' de ') + total +
                t(' cards.', ' tarjetas.')) + '</div>' +
      '<div class="wa-results-btns">' +
        '<button class="wa-btn" id="wa-res-again">🔁 ' + escHtml(t('Study more', 'Estudiar más')) + '</button>' +
        '<button class="wa-btn" id="wa-res-home">🏠 ' + escHtml(t('Home', 'Inicio')) + '</button>' +
      '</div>';
    $('wa-res-again').onclick = openStudy;
    $('wa-res-home').onclick = goHome;
    showScreen('wa-screen-results');

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('World Atlas', '🗺️',
        t('Studied ', 'Estudió ') + total + t(' country cards', ' tarjetas de países'));
    }
  }

  // ── Mode 3: quizzes ──────────────────────────────────────────────
  function openQuizSetup() {
    sound('click');
    _renderQuizSetup();
    showScreen('wa-screen-quiz-setup');
  }

  function _renderQuizSetup() {
    var typeHost = $('wa-quiz-types');
    var regionHost = $('wa-quiz-regions');
    if (!typeHost || !regionHost) return;
    var data = _load();

    typeHost.innerHTML = QUIZ_TYPES.map(function(q) {
      var best = data.quizzes[q.id];
      var bestTxt = best ? t('Best: ', 'Mejor: ') + best + '/' + QUESTIONS_PER_QUIZ : '';
      return '<button class="wa-deck' + (quiz.type === q.id ? ' active' : '') +
             '" data-type="' + escHtml(q.id) + '">' +
             '<span class="wa-deck-icon">' + q.icon + '</span>' +
             '<span class="wa-deck-main">' +
               '<span class="wa-deck-name">' + escHtml(lang === 'es' ? q.es : q.en) + '</span>' +
               '<span class="wa-deck-desc">' + escHtml(lang === 'es' ? q.dEs : q.dEn) + '</span>' +
             '</span>' +
             '<span class="wa-deck-count">' + escHtml(bestTxt) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(typeHost.querySelectorAll('.wa-deck'), function(btn) {
      btn.onclick = function() {
        quiz.type = btn.dataset.type;
        sound('click');
        _renderQuizSetup();
      };
    });

    regionHost.innerHTML = REGIONS.map(function(r) {
      return '<button class="wa-chip' + (quiz.region === r.id ? ' active' : '') +
             '" data-region="' + escHtml(r.id) + '">' +
             r.icon + ' ' + escHtml(lang === 'es' ? r.es : r.en) + '</button>';
    }).join('');
    Array.prototype.forEach.call(regionHost.querySelectorAll('.wa-chip'), function(btn) {
      btn.onclick = function() {
        quiz.region = btn.dataset.region;
        sound('click');
        _renderQuizSetup();
      };
    });
  }

  // Distractors are drawn from the same region first so questions stay fair.
  function _distractors(pool, answer, valueOf, count) {
    var used = [String(valueOf(answer)).toLowerCase()];
    var out = [];
    var candidates = shuffle(pool);
    for (var i = 0; i < candidates.length && out.length < count; i++) {
      var v = String(valueOf(candidates[i])).toLowerCase();
      if (used.indexOf(v) !== -1) continue;
      used.push(v);
      out.push(candidates[i]);
    }
    // Fall back to the whole world if the region was too small or repetitive.
    if (out.length < count) {
      var all = shuffle(COUNTRIES);
      for (var j = 0; j < all.length && out.length < count; j++) {
        var w = String(valueOf(all[j])).toLowerCase();
        if (used.indexOf(w) !== -1) continue;
        used.push(w);
        out.push(all[j]);
      }
    }
    return out;
  }

  function _buildQuestion(type, pool) {
    var answer = pick(pool);
    var q = { country: answer, type: type };

    if (type === 'capital') {
      q.text = t('What is the capital of ' + cName(answer) + '?',
                 '¿Cuál es la capital de ' + cName(answer) + '?');
      q.flag = answer.flag;
      q.options = [answer].concat(_distractors(pool, answer, cCapital, 3));
      q.labelOf = cCapital;
      q.explain = t(cCapital(answer) + ' is the capital of ' + cName(answer) + '.',
                    cCapital(answer) + ' es la capital de ' + cName(answer) + '.');
      if (answer.capitalNote) {
        q.explain += ' ' + (lang === 'es' ? answer.capitalNote.es : answer.capitalNote.en);
      }
    } else if (type === 'country') {
      q.text = t(cCapital(answer) + ' is the capital of which country?',
                 '¿' + cCapital(answer) + ' es la capital de qué país?');
      q.options = [answer].concat(_distractors(pool, answer, cName, 3));
      q.labelOf = function(c) { return c.flag + '  ' + cName(c); };
      q.explain = t(cCapital(answer) + ' is the capital of ' + cName(answer) + '.',
                    cCapital(answer) + ' es la capital de ' + cName(answer) + '.');
    } else if (type === 'currency') {
      q.text = t('Which money is used in ' + cName(answer) + '?',
                 '¿Qué moneda se usa en ' + cName(answer) + '?');
      q.flag = answer.flag;
      q.options = [answer].concat(_distractors(pool, answer, cCurrency, 3));
      q.labelOf = function(c) { return cCurrency(c) + ' (' + (c.currency || '—') + ')'; };
      q.explain = t(cName(answer) + ' uses the ' + cCurrency(answer) + ' (' + answer.currency + ').',
                    cName(answer) + ' usa el ' + cCurrency(answer) + ' (' + answer.currency + ').');
    } else if (type === 'population') {
      // Four countries with distinct sizes — the biggest one wins, so no ties.
      var four = [];
      var seenPop = [];
      var candidates = shuffle(pool).concat(shuffle(COUNTRIES));
      for (var k = 0; k < candidates.length && four.length < 4; k++) {
        var p = candidates[k].population;
        if (seenPop.indexOf(p) !== -1) continue;
        seenPop.push(p);
        four.push(candidates[k]);
      }
      four.sort(function(a, b) { return (b.population || 0) - (a.population || 0); });
      answer = four[0];
      q.country = answer;
      q.text = t('Which country has the most people?', '¿Qué país tiene más habitantes?');
      q.options = four;
      q.labelOf = function(c) { return c.flag + '  ' + cName(c); };
      q.explain = t(cName(answer) + ' has about ' + popShort(answer.population) + ' people.',
                    cName(answer) + ' tiene unos ' + popShort(answer.population) + ' de habitantes.');
    } else { // flag
      q.text = t('Which country owns this flag?', '¿De qué país es esta bandera?');
      q.flag = answer.flag;
      q.options = [answer].concat(_distractors(pool, answer, cName, 3));
      q.labelOf = cName;
      q.explain = t('That is the flag of ' + cName(answer) + ', in ' + cRegion(answer) + '.',
                    'Esa es la bandera de ' + cName(answer) + ', en ' + cRegion(answer) + '.');
    }

    q.answer = answer;
    q.options = shuffle(q.options);
    return q;
  }

  function _makeQuestions(type, region) {
    var pool = COUNTRIES.filter(function(c) { return inRegion(c, region); });
    if (pool.length < 4) pool = COUNTRIES.slice();

    var types = type === 'mixed'
      ? ['capital', 'country', 'currency', 'population', 'flag']
      : [type];

    var questions = [];
    for (var i = 0; i < QUESTIONS_PER_QUIZ; i++) {
      questions.push(_buildQuestion(types[i % types.length], pool));
    }
    return type === 'mixed' ? shuffle(questions) : questions;
  }

  function startQuiz() {
    quiz.questions = _makeQuestions(quiz.type, quiz.region);
    quiz.index = 0;
    quiz.score = 0;
    quiz.missed = [];
    sound('click');
    _showQuestion();
    showScreen('wa-screen-quiz');
  }

  function _showQuestion() {
    var q = quiz.questions[quiz.index];
    if (!q) { _finishQuiz(); return; }
    quiz.answered = false;
    window.__waCurrentQuestion = q;  // read by the end-to-end tests

    $('wa-quiz-qnum').textContent = t('Question ', 'Pregunta ') +
      (quiz.index + 1) + '/' + quiz.questions.length;
    $('wa-quiz-score').textContent = quiz.score + ' ✅';
    $('wa-quiz-fill').style.width = (quiz.index / quiz.questions.length * 100) + '%';

    var html =
      '<div class="wa-q">' +
        (q.flag ? '<div class="wa-q-flag">' + escHtml(q.flag) + '</div>' : '') +
        '<div class="wa-q-text">' + escHtml(q.text) + '</div>' +
      '</div>' +
      '<div class="wa-options">' + q.options.map(function(o, i) {
        return '<button class="wa-option" data-i="' + i + '">' +
               escHtml(q.labelOf(o)) + '</button>';
      }).join('') + '</div>' +
      '<div id="wa-after"></div>';

    $('wa-quiz').innerHTML = html;
    Array.prototype.forEach.call($('wa-quiz').querySelectorAll('.wa-option'), function(btn) {
      btn.onclick = function() { _answerQuestion(parseInt(btn.dataset.i, 10)); };
    });
  }

  function _answerQuestion(index) {
    if (quiz.answered) return;
    quiz.answered = true;

    var q = quiz.questions[quiz.index];
    var chosen = q.options[index];
    var correct = chosen === q.answer;

    var buttons = $('wa-quiz').querySelectorAll('.wa-option');
    Array.prototype.forEach.call(buttons, function(btn, i) {
      btn.disabled = true;
      if (q.options[i] === q.answer) btn.classList.add('correct');
      else if (i === index) btn.classList.add('wrong');
    });

    if (correct) {
      quiz.score++;
      sound('correct');
      flash('🎉');
    } else {
      sound('wrong');
      flash('💭');
      quiz.missed.push(q);
    }
    _record(q.answer.id, correct);
    $('wa-quiz-score').textContent = quiz.score + ' ✅';

    $('wa-after').innerHTML =
      '<div class="wa-explain">' + (correct ? '✅ ' : 'ℹ️ ') + escHtml(q.explain) + '</div>' +
      '<button class="wa-btn wa-btn-start wa-next" id="wa-next">' +
        escHtml(quiz.index + 1 >= quiz.questions.length
          ? t('See results', 'Ver resultados') : t('Next', 'Siguiente')) + ' →</button>';
    $('wa-next').onclick = function() {
      quiz.index++;
      if (quiz.index >= quiz.questions.length) _finishQuiz();
      else _showQuestion();
    };
  }

  function _finishQuiz() {
    var score = quiz.score;
    var total = quiz.questions.length;
    var stars = score === total ? 3 : (score >= 8 ? 2 : (score >= 6 ? 1 : 0));

    var data = _load();
    data.totalStars = (data.totalStars || 0) + stars;
    if (!data.quizzes[quiz.type] || score > data.quizzes[quiz.type]) {
      data.quizzes[quiz.type] = score;
    }
    _save(data);

    if (stars > 0) sound('cheer'); else sound('click');

    var emoji = stars === 3 ? '🏆' : (stars === 2 ? '🌟' : (stars === 1 ? '👍' : '📚'));
    var title = stars === 3 ? t('Perfect round!', '¡Ronda perfecta!')
              : stars === 2 ? t('Great work!', '¡Muy bien!')
              : stars === 1 ? t('Nice going!', '¡Buen trabajo!')
              : t('Keep practising!', '¡Sigue practicando!');

    var html =
      '<div class="wa-results-emoji">' + emoji + '</div>' +
      '<div class="wa-results-title">' + escHtml(title) + '</div>' +
      '<div class="wa-results-score">' + escHtml(score + ' / ' + total) + '</div>' +
      '<div class="wa-results-stars">' +
        (stars ? new Array(stars + 1).join('⭐') : '☆☆☆') + '</div>';

    if (quiz.missed.length) {
      html += '<div class="wa-missed">' +
        '<div class="wa-missed-title">' + escHtml(t('Worth reviewing', 'Para repasar')) + '</div>' +
        quiz.missed.map(function(m) {
          return '<div class="wa-missed-item">' + escHtml(m.answer.flag + ' ' + m.explain) + '</div>';
        }).join('') + '</div>';
    }

    html += '<div class="wa-results-btns">' +
      '<button class="wa-btn" id="wa-res-retry">🔁 ' + escHtml(t('Play again', 'Jugar otra vez')) + '</button>' +
      '<button class="wa-btn" id="wa-res-home2">🏠 ' + escHtml(t('Home', 'Inicio')) + '</button></div>';

    $('wa-results').innerHTML = html;
    $('wa-res-retry').onclick = startQuiz;
    $('wa-res-home2').onclick = goHome;
    showScreen('wa-screen-results');

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      var typeDef = QUIZ_TYPES.filter(function(x) { return x.id === quiz.type; })[0];
      var typeName = typeDef ? (lang === 'es' ? typeDef.es : typeDef.en) : quiz.type;
      ActivityLog.log('World Atlas', '🗺️',
        typeName + ' ' + t('quiz: ', 'concurso: ') + score + '/' + total);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    if (!COUNTRIES.length) {
      console.warn('[WorldAtlas] country data missing');
      return;
    }
    var user = (typeof getActiveUser === 'function') ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.pull(_key()); } catch (e) { /* offline is fine */ }
    }

    var data = _load();
    lang = data.lang === 'es' ? 'es' : 'en';

    $('wa-lang-toggle').onclick = toggleLanguage;
    $('wa-mode-browse').onclick = openBrowse;
    $('wa-mode-study').onclick = openStudy;
    $('wa-mode-quiz').onclick = openQuizSetup;

    $('wa-browse-back').onclick = goHome;
    $('wa-country-back').onclick = openBrowse;
    $('wa-study-back').onclick = goHome;
    $('wa-quiz-back').onclick = goHome;
    $('wa-card-back').onclick = openStudy;
    $('wa-quizplay-back').onclick = openQuizSetup;

    $('wa-search').oninput = function(e) {
      browse.search = e.target.value;
      _renderList();
    };

    $('wa-card').onclick = flipCard;
    $('wa-card-know').onclick = function(e) { e.stopPropagation(); answerCard(true); };
    $('wa-card-again').onclick = function(e) { e.stopPropagation(); answerCard(false); };
    $('wa-quiz-start').onclick = startQuiz;

    _applyLanguage();
  }

  return {
    init: init,
    goHome: goHome,
    toggleLanguage: toggleLanguage,
    openBrowse: openBrowse,
    openCountry: openCountry,
    openStudy: openStudy,
    startStudy: startStudy,
    flipCard: flipCard,
    answerCard: answerCard,
    openQuizSetup: openQuizSetup,
    startQuiz: startQuiz,
    _countries: COUNTRIES,
    _debugBuildQuiz: _makeQuestions
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  if (typeof WorldAtlas !== 'undefined') WorldAtlas.init();
});
