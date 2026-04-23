/* ================================================================
   CHILEAN + LITURGICAL CALENDAR — chilean-calendar.js

   A small, bundled-only calendar module that surfaces the feast day
   or Chilean civic/cultural date for any given day. No external
   network calls. Data is hand-authored, Catholic + Chilean proper
   where relevant.

   Public API:
     ChileanCalendar.getFactsForDate(date?) → Array<Fact>
     ChileanCalendar.getTodayFact()        → Fact | null
     ChileanCalendar.renderHubWidget(elId) → void

   Fact shape:
     { kind: 'liturgical'|'civic', icon, title, titleEn, href?, color? }
   ================================================================ */

var ChileanCalendar = (function() {
  'use strict';

  // ── Easter (Anonymous Gregorian algorithm) ───────────────────────
  function _easterSunday(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var L = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * L) / 451);
    var month = Math.floor((h + L - 7 * m + 114) / 31); // 3 = March, 4 = April
    var day = ((h + L - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function _addDaysUTC(d, n) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
  }

  function _sameMonthDay(d, month, day) {
    return (d.getMonth() + 1) === month && d.getDate() === day;
  }

  function _sameDateUTC(d, utcDate) {
    return d.getFullYear() === utcDate.getUTCFullYear()
        && d.getMonth() === utcDate.getUTCMonth()
        && d.getDate() === utcDate.getUTCDate();
  }

  // ── Fixed liturgical feasts ──────────────────────────────────────
  // Catholic calendar, with Chilean proper highlights. Bilingual.
  // Href is optional — links into Fe Explorador or Descubre Chile.
  var LITURGICAL_FIXED = [
    { m: 1,  d: 1,  icon: '🕊️', title: 'Santa María, Madre de Dios',          titleEn: 'Mary, Mother of God',              href: 'fe-explorador.html' },
    { m: 1,  d: 6,  icon: '⭐',  title: 'Epifanía del Señor',                 titleEn: 'Epiphany',                          href: 'fe-explorador.html' },
    { m: 1,  d: 17, icon: '🏜️', title: 'San Antonio Abad',                    titleEn: 'Saint Anthony the Abbot',           href: 'fe-explorador.html' },
    { m: 2,  d: 2,  icon: '🕯️', title: 'Presentación del Señor (Candelaria)',titleEn: 'Presentation of the Lord',          href: 'fe-explorador.html' },
    { m: 3,  d: 19, icon: '🪚',  title: 'San José, Esposo de María',          titleEn: 'Saint Joseph',                      href: 'fe-explorador.html' },
    { m: 3,  d: 25, icon: '👼',  title: 'Anunciación del Señor',              titleEn: 'Annunciation of the Lord',           href: 'fe-explorador.html' },
    { m: 5,  d: 1,  icon: '🛠️', title: 'San José Obrero',                    titleEn: 'Saint Joseph the Worker',           href: 'fe-explorador.html' },
    { m: 5,  d: 13, icon: '🌹',  title: 'Nuestra Señora de Fátima',           titleEn: 'Our Lady of Fátima',                 href: 'fe-explorador.html' },
    { m: 5,  d: 31, icon: '🤲',  title: 'Visitación de la Virgen María',      titleEn: 'Visitation of Mary',                 href: 'fe-explorador.html' },
    { m: 6,  d: 13, icon: '📖',  title: 'San Antonio de Padua',               titleEn: 'Saint Anthony of Padua',             href: 'fe-explorador.html' },
    { m: 6,  d: 24, icon: '💧',  title: 'Natividad de San Juan Bautista',     titleEn: 'Nativity of John the Baptist',       href: 'fe-explorador.html' },
    { m: 6,  d: 29, icon: '🗝️', title: 'San Pedro y San Pablo',              titleEn: 'Saints Peter and Paul',              href: 'fe-explorador.html' },
    { m: 7,  d: 16, icon: '⚓',  title: 'Virgen del Carmen (Patrona de Chile)',titleEn: 'Our Lady of Mount Carmel — Patroness of Chile', href: 'fe-explorador.html' },
    { m: 7,  d: 25, icon: '🛡️', title: 'Santiago Apóstol',                   titleEn: 'Saint James the Apostle',            href: 'fe-explorador.html' },
    { m: 7,  d: 31, icon: '✝️',  title: 'San Ignacio de Loyola',              titleEn: 'Saint Ignatius of Loyola',           href: 'fe-explorador.html' },
    { m: 8,  d: 15, icon: '👑',  title: 'Asunción de la Virgen María',        titleEn: 'Assumption of Mary',                 href: 'fe-explorador.html' },
    { m: 9,  d: 8,  icon: '🌸',  title: 'Natividad de la Virgen María',       titleEn: 'Nativity of the Virgin Mary',        href: 'fe-explorador.html' },
    { m: 9,  d: 14, icon: '✝️',  title: 'Exaltación de la Santa Cruz',        titleEn: 'Exaltation of the Holy Cross',       href: 'fe-explorador.html' },
    { m: 9,  d: 29, icon: '⚔️',  title: 'Arcángeles Miguel, Gabriel y Rafael',titleEn: 'Archangels Michael, Gabriel & Raphael', href: 'fe-explorador.html' },
    { m: 10, d: 1,  icon: '🌹',  title: 'Santa Teresita del Niño Jesús',      titleEn: 'Saint Thérèse of Lisieux',           href: 'fe-explorador.html' },
    { m: 10, d: 4,  icon: '🐦',  title: 'San Francisco de Asís',              titleEn: 'Saint Francis of Assisi',             href: 'fe-explorador.html' },
    { m: 10, d: 7,  icon: '📿',  title: 'Nuestra Señora del Rosario',         titleEn: 'Our Lady of the Rosary',              href: 'fe-explorador.html' },
    { m: 10, d: 15, icon: '✝️',  title: 'Santa Teresa de Ávila',              titleEn: 'Saint Teresa of Ávila',              href: 'fe-explorador.html' },
    { m: 11, d: 1,  icon: '😇',  title: 'Todos los Santos',                   titleEn: 'All Saints',                         href: 'fe-explorador.html' },
    { m: 11, d: 2,  icon: '🕯️', title: 'Todos los Fieles Difuntos',          titleEn: 'All Souls',                          href: 'fe-explorador.html' },
    { m: 11, d: 22, icon: '🎶',  title: 'Santa Cecilia, Patrona de la Música',titleEn: 'Saint Cecilia, Patron of Music',     href: 'fe-explorador.html' },
    { m: 12, d: 8,  icon: '🌟',  title: 'Inmaculada Concepción',              titleEn: 'Immaculate Conception',               href: 'fe-explorador.html' },
    { m: 12, d: 12, icon: '🌺',  title: 'Nuestra Señora de Guadalupe',        titleEn: 'Our Lady of Guadalupe',               href: 'fe-explorador.html' },
    { m: 12, d: 24, icon: '🌌',  title: 'Nochebuena',                         titleEn: 'Christmas Eve',                       href: 'fe-explorador.html' },
    { m: 12, d: 25, icon: '🎄',  title: 'Natividad del Señor',                titleEn: 'Christmas Day',                       href: 'fe-explorador.html' },
    { m: 12, d: 26, icon: '✝️',  title: 'San Esteban, Protomártir',           titleEn: 'Saint Stephen',                       href: 'fe-explorador.html' },
    { m: 12, d: 28, icon: '👶',  title: 'Santos Inocentes',                   titleEn: 'Holy Innocents',                      href: 'fe-explorador.html' }
  ];

  // ── Movable feasts (computed from Easter) ────────────────────────
  // offsetFromEaster is in days. Some adjustments for Chile specifically:
  //   - Corpus Christi & Ascension transferred to Sunday in Chile.
  function _movableFeastsForYear(year) {
    var easter = _easterSunday(year);
    var ashWed = _addDaysUTC(easter, -46);
    var palmSun = _addDaysUTC(easter, -7);
    var holyThu = _addDaysUTC(easter, -3);
    var goodFri = _addDaysUTC(easter, -2);
    var holySat = _addDaysUTC(easter, -1);
    var ascension = _addDaysUTC(easter, 42); // Ascension Sunday (transferred in Chile)
    var pentecost = _addDaysUTC(easter, 49);
    var trinity = _addDaysUTC(easter, 56);
    var corpus = _addDaysUTC(easter, 63);    // Corpus Christi — Sunday after Trinity in Chile
    var sacredHeart = _addDaysUTC(easter, 68);

    return [
      { date: ashWed,    icon: '✝️',  title: 'Miércoles de Ceniza',           titleEn: 'Ash Wednesday',         href: 'fe-explorador.html' },
      { date: palmSun,   icon: '🌿',  title: 'Domingo de Ramos',              titleEn: 'Palm Sunday',           href: 'fe-explorador.html' },
      { date: holyThu,   icon: '🍞',  title: 'Jueves Santo',                  titleEn: 'Holy Thursday',         href: 'fe-explorador.html' },
      { date: goodFri,   icon: '✝️',  title: 'Viernes Santo',                 titleEn: 'Good Friday',           href: 'fe-explorador.html' },
      { date: holySat,   icon: '🕯️', title: 'Sábado Santo',                  titleEn: 'Holy Saturday',         href: 'fe-explorador.html' },
      { date: easter,    icon: '🐣',  title: 'Domingo de Resurrección',       titleEn: 'Easter Sunday',         href: 'fe-explorador.html' },
      { date: ascension, icon: '☁️',  title: 'Ascensión del Señor',           titleEn: 'Ascension of the Lord', href: 'fe-explorador.html' },
      { date: pentecost, icon: '🔥',  title: 'Pentecostés',                   titleEn: 'Pentecost',             href: 'fe-explorador.html' },
      { date: trinity,   icon: '🔺',  title: 'Santísima Trinidad',            titleEn: 'Holy Trinity',          href: 'fe-explorador.html' },
      { date: corpus,    icon: '🌾',  title: 'Corpus Christi',                titleEn: 'Corpus Christi',        href: 'fe-explorador.html' },
      { date: sacredHeart,icon: '❤️', title: 'Sagrado Corazón de Jesús',      titleEn: 'Sacred Heart of Jesus', href: 'fe-explorador.html' }
    ];
  }

  // ── Chilean civic / cultural days ────────────────────────────────
  var CIVIC_FIXED = [
    { m: 2,  d: 12, icon: '🏛️', title: 'Fundación de Santiago (1541)',        titleEn: 'Founding of Santiago',               href: 'descubre-chile.html' },
    { m: 4,  d: 3,  icon: '⚓',  title: 'Nacimiento de Arturo Prat (1848)',    titleEn: 'Birth of Arturo Prat',               href: 'descubre-chile.html' },
    { m: 5,  d: 1,  icon: '🛠️', title: 'Día del Trabajador',                  titleEn: "Workers' Day",                        href: 'descubre-chile.html' },
    { m: 5,  d: 21, icon: '⚓',  title: 'Día de las Glorias Navales',          titleEn: 'Day of Naval Glories (Iquique)',      href: 'descubre-chile.html' },
    { m: 6,  d: 7,  icon: '🏰',  title: 'Asalto y Toma del Morro de Arica (1880)', titleEn: 'Assault on the Morro of Arica', href: 'descubre-chile.html' },
    { m: 8,  d: 20, icon: '🇨🇱', title: 'Nacimiento de Bernardo O\'Higgins',   titleEn: "Bernardo O'Higgins' Birthday",        href: 'descubre-chile.html' },
    { m: 9,  d: 4,  icon: '🗳️', title: 'Día de la Democracia',                titleEn: 'Day of Democracy',                   href: 'descubre-chile.html' },
    { m: 9,  d: 18, icon: '🎉',  title: 'Fiestas Patrias · Primera Junta Nacional (1810)', titleEn: 'Chilean Independence Day', href: 'descubre-chile.html' },
    { m: 9,  d: 19, icon: '🎖️', title: 'Día de las Glorias del Ejército',     titleEn: 'Day of the Glories of the Army',     href: 'descubre-chile.html' },
    { m: 10, d: 12, icon: '🌎',  title: 'Encuentro de Dos Mundos',             titleEn: 'Day of the Meeting of Two Worlds',   href: 'descubre-chile.html' },
    { m: 10, d: 31, icon: '📖',  title: 'Día Nacional de las Iglesias Evangélicas y Protestantes', titleEn: 'National Evangelical Churches Day', href: 'descubre-chile.html' },
    { m: 11, d: 25, icon: '🎼',  title: 'Día del Músico Chileno',              titleEn: 'Chilean Musician\'s Day',            href: 'descubre-chile.html' }
  ];

  // Poet / cultural anniversaries worth surfacing
  var CULTURAL_FIXED = [
    { m: 4,  d: 7,  icon: '📜', title: 'Nacimiento de Gabriela Mistral (1889)', titleEn: 'Gabriela Mistral was born',          href: 'descubre-chile.html' },
    { m: 7,  d: 12, icon: '📜', title: 'Nacimiento de Pablo Neruda (1904)',     titleEn: 'Pablo Neruda was born',              href: 'descubre-chile.html' },
    { m: 9,  d: 5,  icon: '📜', title: 'Nacimiento de Nicanor Parra (1914)',    titleEn: 'Nicanor Parra was born',             href: 'descubre-chile.html' },
    { m: 9,  d: 23, icon: '🕯️', title: 'Fallecimiento de Pablo Neruda (1973)',  titleEn: 'Pablo Neruda died',                  href: 'descubre-chile.html' },
    { m: 1,  d: 10, icon: '🕯️', title: 'Fallecimiento de Gabriela Mistral (1957)', titleEn: 'Gabriela Mistral died',         href: 'descubre-chile.html' }
  ];

  // ── Public query ─────────────────────────────────────────────────
  function getFactsForDate(d) {
    var date = d || new Date();
    var year = date.getFullYear();
    var facts = [];

    // Fixed liturgical
    LITURGICAL_FIXED.forEach(function(f) {
      if (_sameMonthDay(date, f.m, f.d)) {
        facts.push({ kind: 'liturgical', icon: f.icon, title: f.title, titleEn: f.titleEn, href: f.href });
      }
    });

    // Movable liturgical
    _movableFeastsForYear(year).forEach(function(f) {
      if (_sameDateUTC(date, f.date)) {
        facts.push({ kind: 'liturgical', icon: f.icon, title: f.title, titleEn: f.titleEn, href: f.href });
      }
    });

    // Chilean civic
    CIVIC_FIXED.forEach(function(f) {
      if (_sameMonthDay(date, f.m, f.d)) {
        facts.push({ kind: 'civic', icon: f.icon, title: f.title, titleEn: f.titleEn, href: f.href });
      }
    });

    // Cultural anniversaries
    CULTURAL_FIXED.forEach(function(f) {
      if (_sameMonthDay(date, f.m, f.d)) {
        facts.push({ kind: 'cultural', icon: f.icon, title: f.title, titleEn: f.titleEn, href: f.href });
      }
    });

    return facts;
  }

  function getTodayFact() {
    var facts = getFactsForDate(new Date());
    return facts.length > 0 ? facts[0] : null;
  }

  // ── Hub widget ──────────────────────────────────────────────────
  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderHubWidget(containerId) {
    var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) return;
    var facts = getFactsForDate(new Date());
    if (facts.length === 0) { el.innerHTML = ''; return; }

    // Build a single card that stacks multiple facts if they coincide.
    var body = facts.map(function(f) {
      var kindLabel = f.kind === 'liturgical' ? 'Hoy en la Iglesia'
                    : f.kind === 'civic' ? 'Hoy en Chile'
                    : 'Efemérides';
      var inner =
        '<span class="cc-icon">' + _esc(f.icon) + '</span>' +
        '<div class="cc-body">' +
          '<div class="cc-kind">' + _esc(kindLabel) + '</div>' +
          '<div class="cc-title">' + _esc(f.title) + '</div>' +
          '<div class="cc-title-en">' + _esc(f.titleEn) + '</div>' +
        '</div>' +
        '<span class="cc-arrow">→</span>';
      if (f.href) {
        return '<a class="cc-row" href="' + _esc(f.href) + '">' + inner + '</a>';
      }
      return '<div class="cc-row">' + inner + '</div>';
    }).join('');

    el.innerHTML = '<div class="cc-card" role="region" aria-label="Today\'s calendar">' + body + '</div>';
  }

  return {
    getFactsForDate: getFactsForDate,
    getTodayFact: getTodayFact,
    renderHubWidget: renderHubWidget,
    _easterSunday: _easterSunday // exposed for tests
  };
})();
