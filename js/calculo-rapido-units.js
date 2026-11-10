/* ================================================================
   CÁLCULO RÁPIDO — units, conversions and time zones
   (calculo-rapido-units.js). No DOM, no storage.

   Conversions: every pair is "1 x = f y" with an exact factor. Money uses
   a round practice rate (1 USD = 950 CLP) that is NOT today's rate and is
   always labelled so. Nothing here fetches a rate.

   Time zones are computed from the two sets of rules, not from a table of
   offsets:
     California (US Pacific)  UTC-8; UTC-7 from the second Sunday of March,
                              2:00 am, to the first Sunday of November, 2:00 am.
     Santiago (Chile)         UTC-4; UTC-3 ("summer time") from the first
                              Saturday of September, midnight, to the first
                              Saturday of April, midnight (rules in force
                              since 2023).
   The tests check both against the browser's own time-zone database.
   ================================================================ */
(function (root) {
  'use strict';
  var E = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
    ? require('./calculo-rapido-engine.js') : root.CalculoEngine;

  var USD_CLP = 950;      // practice rate: CLP per USD (not today's rate)

  // ── names ────────────────────────────────────────────────────
  var NAMES = {
    km:  { es: 'kilómetros', en: 'kilometres' }, mi: { es: 'millas', en: 'miles' },
    m:   { es: 'metros', en: 'metres' },         ft: { es: 'pies', en: 'feet' },
    cm:  { es: 'centímetros', en: 'centimetres' }, 'in': { es: 'pulgadas', en: 'inches' },
    kg:  { es: 'kilos', en: 'kilograms' },       lb: { es: 'libras', en: 'pounds' },
    g:   { es: 'gramos', en: 'grams' },          oz: { es: 'onzas', en: 'ounces' },
    L:   { es: 'litros', en: 'litres' },         gal: { es: 'galones (EE. UU.)', en: 'US gallons' },
    mL:  { es: 'mililitros', en: 'millilitres' }, floz: { es: 'onzas líquidas', en: 'fluid ounces' },
    'km/h': { es: 'kilómetros por hora', en: 'kilometres per hour' },
    mph: { es: 'millas por hora', en: 'miles per hour' }, 'm/s': { es: 'metros por segundo', en: 'metres per second' },
    USD: { es: 'dólares', en: 'US dollars' },    CLP: { es: 'pesos chilenos', en: 'Chilean pesos' },
    C:   { es: 'grados Celsius', en: 'degrees Celsius' }, F: { es: 'grados Fahrenheit', en: 'degrees Fahrenheit' }
  };
  var SYMBOL = { floz: 'fl oz', C: '°C', F: '°F' };
  function sym(u) { return SYMBOL[u] || u; }
  function withUnit(n, u, es) { var s = E.fmtNum(n, es); return u === 'C' || u === 'F' ? s + sym(u) : s + ' ' + sym(u); }

  // ── pairs: 1 x = f y ─────────────────────────────────────────
  // vals: friendly inputs for each direction; dec: the decimals the
  // answer is rounded to in a quiz.
  var PAIRS = [
    { id: 'mi-km', topic: 'length', x: 'mi', y: 'km', f: 1.609344,
      thumb: ['Una milla son un poco más de 1½ km.', 'A mile is a little more than 1½ km.'],
      xy: { vals: [2, 3, 5, 10, 15, 26, 50], dec: 1 }, yx: { vals: [5, 10, 20, 40, 100, 150], dec: 1 } },
    { id: 'ft-m', topic: 'length', x: 'ft', y: 'm', f: 0.3048,
      thumb: ['Tres pies son casi un metro (un poco menos).', 'Three feet is almost a metre (a little less).'],
      xy: { vals: [3, 6, 10, 30, 100], dec: 1 }, yx: { vals: [1, 2, 5, 10, 50, 100], dec: 1 } },
    { id: 'in-cm', topic: 'length', x: 'in', y: 'cm', f: 2.54,
      thumb: ['Una pulgada son unos 2½ cm.', 'An inch is about 2½ cm.'],
      xy: { vals: [1, 2, 5, 10, 12, 20], dec: 1 }, yx: { vals: [5, 10, 20, 30, 50, 100], dec: 1 } },
    { id: 'lb-kg', topic: 'mass', x: 'lb', y: 'kg', f: 0.45359237,
      thumb: ['Un kilo son unas 2,2 libras.', 'A kilogram is about 2.2 pounds.'],
      xy: { vals: [2, 5, 10, 25, 50, 100], dec: 1 }, yx: { vals: [1, 2, 5, 10, 20, 50, 70], dec: 1 } },
    { id: 'oz-g', topic: 'mass', x: 'oz', y: 'g', f: 28.349523125,
      thumb: ['Una onza son unos 30 gramos.', 'An ounce is about 30 grams.'],
      xy: { vals: [1, 2, 4, 8, 16], dec: 0 }, yx: { vals: [30, 100, 250, 500, 1000], dec: 1 } },
    { id: 'gal-L', topic: 'volume', x: 'gal', y: 'L', f: 3.785411784,
      thumb: ['Un galón son casi 4 litros.', 'A US gallon is almost 4 litres.'],
      xy: { vals: [1, 2, 5, 10, 15], dec: 1 }, yx: { vals: [4, 10, 20, 40, 100], dec: 1 } },
    { id: 'floz-mL', topic: 'volume', x: 'floz', y: 'mL', f: 29.5735295625,
      thumb: ['Una onza líquida son unos 30 mL.', 'A fluid ounce is about 30 mL.'],
      xy: { vals: [1, 4, 8, 12, 16], dec: 0 }, yx: { vals: [250, 330, 500, 1000], dec: 1 } },
    { id: 'C-F', topic: 'temp', x: 'C', y: 'F', temp: true,
      thumb: ['Para temperaturas de todos los días: duplica los °C y suma 30 (aproximado).', 'For everyday weather: double the °C and add 30 (approximate).'],
      xy: { vals: [0, 5, 10, 15, 20, 25, 30, 35, 40], dec: 0 }, yx: { vals: [32, 41, 50, 59, 68, 77, 86, 95, 104], dec: 0 } },
    { id: 'mph-kmh', topic: 'speed', x: 'mph', y: 'km/h', f: 1.609344,
      thumb: ['Multiplica las mph por 1½ para tener los km/h (aproximado).', 'Multiply mph by 1½ to get km/h (approximate).'],
      xy: { vals: [20, 25, 30, 45, 55, 65, 70], dec: 0 }, yx: { vals: [30, 50, 60, 80, 100, 110, 120], dec: 0 } },
    { id: 'ms-kmh', topic: 'speed', x: 'm/s', y: 'km/h', f: 3.6,
      thumb: ['1 m/s son 3,6 km/h: ¡exacto!', '1 m/s is 3.6 km/h: exact!'],
      xy: { vals: [5, 10, 15, 20, 25, 30], dec: 0 }, yx: { vals: [18, 36, 54, 72, 90, 108, 126], dec: 0 } },
    { id: 'usd-clp', topic: 'money', x: 'USD', y: 'CLP', f: USD_CLP,
      thumb: ['Para practicar usamos 1 USD = 950 CLP. No es el valor de hoy: pídele a un adulto el valor del día.',
              'For practice we use 1 USD = 950 CLP. That is not today\'s rate: ask a grown-up for the rate of the day.'],
      xy: { vals: [2, 5, 10, 20, 50, 100], dec: 0 }, yx: { vals: [1900, 4750, 9500, 19000, 47500, 95000], dec: 0 } }
  ];

  var TOPICS = [
    { id: 'length', icon: 'ruler', es: 'Largo y distancia', en: 'Length and distance' },
    { id: 'mass', icon: 'scale', es: 'Peso', en: 'Weight' },
    { id: 'volume', icon: 'cup', es: 'Líquidos', en: 'Liquids' },
    { id: 'temp', icon: 'thermo', es: 'Temperatura', en: 'Temperature' },
    { id: 'speed', icon: 'gauge', es: 'Velocidad', en: 'Speed' },
    { id: 'money', icon: 'coin', es: 'Dinero (aproximado)', en: 'Money (approximate)' },
    { id: 'zones', icon: 'globe', es: 'Husos horarios', en: 'Time zones' }
  ];

  function pairsOf(topic) { return PAIRS.filter(function (p) { return p.topic === topic; }); }
  function pairById(id) { for (var i = 0; i < PAIRS.length; i++) if (PAIRS[i].id === id) return PAIRS[i]; return null; }

  // The exact conversion. dir 'xy' goes from x to y, 'yx' back.
  function convert(pair, value, dir) {
    if (pair.temp) return dir === 'xy' ? value * 9 / 5 + 32 : (value - 32) * 5 / 9;
    return dir === 'xy' ? value * pair.f : value / pair.f;
  }

  // The same rule worded for people.
  function factText(pair, es) {
    if (pair.temp) return es ? '°F = °C × 9 ÷ 5 + 32' : '°F = °C × 9 ÷ 5 + 32';
    return '1 ' + sym(pair.x) + ' = ' + E.fmtNum(E.round(pair.f, 6), es) + ' ' + sym(pair.y);
  }

  // ── quiz questions (multiple choice) ─────────────────────────
  // How close the unrounded answer is to a rounding boundary. A value near
  // .5 of the last place could round either way, so those are skipped.
  function _nearBoundary(x, dec) {
    var s = x * Math.pow(10, dec), fr = s - Math.floor(s);
    return Math.abs(fr - 0.5) < 0.03;
  }

  function _slips(pair, v, dir, answer, dec) {
    var out;
    if (pair.temp && dir === 'xy') out = [v * 9 / 5, (v + 32) * 9 / 5, v * 2 + 30, answer + 9, answer - 9];   // forgot +32, added first, the rule of thumb
    else if (pair.temp) out = [(v - 32) / 2, v * 5 / 9, (v - 32) * 9 / 5, answer + 5, answer - 5];           // halved, forgot -32, wrong fraction
    else {
      var back = convert(pair, v, dir === 'xy' ? 'yx' : 'xy');        // used the rule backwards
      out = [back, v, answer * 10, answer / 10, answer * 2, answer / 2, answer * 1.1, answer * 0.9];
    }
    return out.map(function (x) { return E.round(x, dec); });
  }

  function unitQuestion(topic, r) {
    var pairs = pairsOf(topic), pair = r.pick(pairs), dir = r.pick(['xy', 'yx']);
    var spec = pair[dir], v, answer, tries = 0;
    do {
      v = r.pick(spec.vals);
      answer = E.round(convert(pair, v, dir), spec.dec);
    } while (_nearBoundary(convert(pair, v, dir), spec.dec) && tries++ < 20);

    var from = dir === 'xy' ? pair.x : pair.y, to = dir === 'xy' ? pair.y : pair.x;
    var wrong = [];
    r.shuffle(_slips(pair, v, dir, answer, spec.dec)).forEach(function (c) {
      if (c > 0 && c !== answer && wrong.indexOf(c) < 0 && wrong.length < 3) wrong.push(c);
    });
    var k = 1;
    while (wrong.length < 3) { var extra = E.round(answer + k * Math.pow(10, -spec.dec) * 5, spec.dec); if (extra > 0 && extra !== answer && wrong.indexOf(extra) < 0) wrong.push(extra); k++; }
    var values = r.shuffle([answer].concat(wrong));
    var roundTxt = spec.dec === 0
      ? ['Redondea al número entero más cercano.', 'Round to the nearest whole number.']
      : ['Redondea a un decimal.', 'Round to one decimal.'];
    var verb = dir === 'xy';
    var mulText = pair.temp ? null : (verb ? ['multiplica', 'multiply'] : ['divide', 'divide']);
    var steps = [];
    steps.push({ es: 'Regla: ' + factText(pair, true), en: 'The rule: ' + factText(pair, false) });
    if (pair.temp) {
      if (dir === 'xy') {
        steps.push({ es: v + ' × 9 ÷ 5 = ' + E.fmtNum(v * 9 / 5, true), en: v + ' × 9 ÷ 5 = ' + E.fmtNum(v * 9 / 5, false) });
        steps.push({ es: E.fmtNum(v * 9 / 5, true) + ' + 32 = ' + E.fmtNum(answer, true), en: E.fmtNum(v * 9 / 5, false) + ' + 32 = ' + E.fmtNum(answer, false) });
      } else {
        steps.push({ es: v + ' − 32 = ' + (v - 32), en: v + ' − 32 = ' + (v - 32) });
        steps.push({ es: (v - 32) + ' × 5 ÷ 9 = ' + E.fmtNum(answer, true), en: (v - 32) + ' × 5 ÷ 9 = ' + E.fmtNum(answer, false) });
      }
    } else {
      steps.push({
        es: 'De ' + sym(from) + ' a ' + sym(to) + ' hay que ' + mulText[0] + ' por ' + E.fmtNum(E.round(pair.f, 6), true) + '.',
        en: 'From ' + sym(from) + ' to ' + sym(to) + ' you ' + mulText[1] + ' by ' + E.fmtNum(E.round(pair.f, 6), false) + '.'
      });
      var raw = convert(pair, v, dir);
      steps.push({
        es: E.fmtNum(v, true) + ' ' + (verb ? '×' : '÷') + ' ' + E.fmtNum(E.round(pair.f, 6), true) + ' = ' + E.fmtNum(E.round(raw, 4), true),
        en: E.fmtNum(v, false) + ' ' + (verb ? '×' : '÷') + ' ' + E.fmtNum(E.round(pair.f, 6), false) + ' = ' + E.fmtNum(E.round(raw, 4), false)
      });
    }
    steps.push({ es: 'Respuesta: ' + withUnit(answer, to, true), en: 'Answer: ' + withUnit(answer, to, false) });

    var note = topic === 'money'
      ? ['Para practicar: 1 USD = 950 CLP. Es un valor aproximado, no el de hoy.', 'For practice: 1 USD = 950 CLP. It is approximate, not today\'s rate.']
      : null;
    return {
      topic: topic, pair: pair.id, dir: dir, value: v, answer: answer, dec: spec.dec, from: from, to: to,
      text: {
        es: 'Convierte ' + withUnit(v, from, true) + ' a ' + sym(to) + '. ' + roundTxt[0],
        en: 'Convert ' + withUnit(v, from, false) + ' to ' + sym(to) + '. ' + roundTxt[1]
      },
      note: note ? { es: note[0], en: note[1] } : null,
      choices: values.map(function (x) { return { v: x, es: withUnit(x, to, true), en: withUnit(x, to, false) }; }),
      correct: values.indexOf(answer),
      steps: steps
    };
  }

  // ── time zones ───────────────────────────────────────────────
  var ZONES = {
    LA:  { id: 'LA',  es: 'California (hora del Pacífico)', en: 'California (Pacific time)', short: { es: 'California', en: 'California' } },
    SCL: { id: 'SCL', es: 'Santiago de Chile', en: 'Santiago, Chile', short: { es: 'Santiago', en: 'Santiago' } }
  };
  var DAYS = {
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  var MONTHS = {
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  function _sundayOnOrAfter(y, m0, d) {
    var dow = new Date(Date.UTC(y, m0, d)).getUTCDay();
    return d + (7 - dow) % 7;
  }

  // The instants (UTC ms) when each zone changes its clocks, for a year.
  function transitions(year) {
    return {
      laStart: Date.UTC(year, 2, _sundayOnOrAfter(year, 2, 8), 10, 0),     // 2:00 PST = 10:00 UTC
      laEnd: Date.UTC(year, 10, _sundayOnOrAfter(year, 10, 1), 9, 0),      // 2:00 PDT = 09:00 UTC
      sclEnd: Date.UTC(year, 3, _sundayOnOrAfter(year, 3, 2), 3, 0),       // 0:00 on Sunday, UTC-3 = 03:00 UTC
      sclStart: Date.UTC(year, 8, _sundayOnOrAfter(year, 8, 2), 4, 0)      // 0:00 on Sunday, UTC-4 = 04:00 UTC
    };
  }

  // Minutes from UTC for a zone at an instant. Valid for 2023 on.
  function offsetMinutes(zone, utcMs) {
    var y = new Date(utcMs).getUTCFullYear(), t = transitions(y);
    if (zone === 'LA') return utcMs >= t.laStart && utcMs < t.laEnd ? -420 : -480;
    return (utcMs < t.sclEnd || utcMs >= t.sclStart) ? -180 : -240;
  }
  function isDst(zone, utcMs) { return offsetMinutes(zone, utcMs) === (zone === 'LA' ? -420 : -180); }

  function utcToLocal(zone, utcMs) {
    var off = offsetMinutes(zone, utcMs), d = new Date(utcMs + off * 60000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes(),
             dow: d.getUTCDay(), off: off, dst: isDst(zone, utcMs) };
  }

  // The instant a wall-clock time happens in a zone, or null when that
  // time does not exist (clocks jump over it) or happens twice.
  function localToUtc(zone, y, m, d, hh, mm) {
    var naive = Date.UTC(y, m - 1, d, hh, mm), cands = zone === 'LA' ? [-480, -420] : [-240, -180], found = [];
    cands.forEach(function (o) {
      var u = naive - o * 60000;
      if (offsetMinutes(zone, u) === o) found.push(u);
    });
    return found.length === 1 ? found[0] : null;
  }

  function convertZone(from, to, y, m, d, hh, mm) {
    var u = localToUtc(from, y, m, d, hh, mm);
    if (u === null) return null;
    return { utc: u, from: utcToLocal(from, u), to: utcToLocal(to, u) };
  }

  // Hours Santiago is ahead of California at an instant.
  function hoursAhead(utcMs) { return (offsetMinutes('SCL', utcMs) - offsetMinutes('LA', utcMs)) / 60; }

  // For each month of a year, the hours Santiago is ahead on the 15th.
  function aheadByMonth(year) {
    var out = [];
    for (var m = 0; m < 12; m++) out.push(hoursAhead(Date.UTC(year, m, 15, 18, 0)));
    return out;
  }

  function fmtClock(hh, mm, es) {
    var m = (mm < 10 ? '0' : '') + mm;
    if (es) return (hh < 10 ? '0' : '') + hh + ':' + m;
    var h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + ':' + m + ' ' + (hh < 12 ? 'AM' : 'PM');
  }
  function fmtDate(t, es, withYear) {
    var lang = es ? 'es' : 'en', day = DAYS[lang][t.dow], mon = MONTHS[lang][t.m - 1];
    return es ? day + ' ' + t.d + ' de ' + mon + (withYear ? ' de ' + t.y : '')
              : day + ', ' + mon + ' ' + t.d + (withYear ? ', ' + t.y : '');
  }
  function fmtShort(t, es) { return DAYS[es ? 'es' : 'en'][t.dow].slice(0, 3) + ' ' + fmtClock(t.hh, t.mm, es); }

  // True when no clock change in either zone is within two days of the
  // instant, so the question has one clear answer.
  function _calm(utcMs) {
    var DAY = 86400000;
    return ['LA', 'SCL'].every(function (z) {
      var o = offsetMinutes(z, utcMs);
      return offsetMinutes(z, utcMs - 2 * DAY) === o && offsetMinutes(z, utcMs + 2 * DAY) === o;
    });
  }

  function zoneQuestion(r) {
    for (var n = 0; n < 400; n++) {
      var y = r.int(2026, 2032), m = r.int(1, 12), d = r.int(1, 28), hh = r.int(7, 21), mm = r.pick([0, 30]);
      var fromZ = r.pick(['LA', 'SCL']), toZ = fromZ === 'LA' ? 'SCL' : 'LA';
      var res = convertZone(fromZ, toZ, y, m, d, hh, mm);
      if (!res || !_calm(res.utc)) continue;
      var u = res.utc, ahead = hoursAhead(u);            // Santiago ahead of California by this many hours
      var diff = fromZ === 'LA' ? ahead : -ahead;         // hours to add to the start time
      // Wrong answers: the other two possible gaps (3, 4 or 5 hours), and
      // adding when you should subtract.
      var gaps = [3, 4, 5].filter(function (g) { return g !== ahead; });
      var sign = fromZ === 'LA' ? 1 : -1;
      var wrongs = gaps.map(function (g) { return utcToLocal(toZ, u + (g - ahead) * sign * 3600000); });
      wrongs.push(utcToLocal(toZ, u - 2 * ahead * sign * 3600000));
      var right = res.to, seen = {}, pool = [];
      seen[fmtShort(right, false)] = 1;
      wrongs.forEach(function (w) {
        var k = fmtShort(w, false);
        if (!seen[k]) { seen[k] = 1; pool.push(w); }
      });
      if (pool.length < 3) continue;
      var picked = r.shuffle(pool).slice(0, 3), all = r.shuffle([right].concat(picked));
      var fromName = ZONES[fromZ], toName = ZONES[toZ];
      var f = res.from;
      var dayShift = Math.round((Date.UTC(right.y, right.m - 1, right.d) - Date.UTC(f.y, f.m - 1, f.d)) / 86400000);
      var offTxt = function (zone, t, es) {
        var h = t.off / 60;
        return 'UTC' + (h < 0 ? '−' : '+') + Math.abs(h) + (zone === 'LA' ? (t.dst ? (es ? ' (hora de verano)' : ' (daylight time)') : (es ? ' (hora estándar)' : ' (standard time)'))
          : (t.dst ? (es ? ' (hora de verano de Chile)' : ' (Chile summer time)') : (es ? ' (hora de invierno de Chile)' : ' (Chile winter time)')));
      };
      var calcEs = fmtClock(f.hh, f.mm, true) + (diff >= 0 ? ' + ' : ' − ') + Math.abs(diff) + ' h = ' + fmtClock(right.hh, right.mm, true);
      var calcEn = fmtClock(f.hh, f.mm, false) + (diff >= 0 ? ' + ' : ' − ') + Math.abs(diff) + ' h = ' + fmtClock(right.hh, right.mm, false);
      var dayEs = dayShift === 0 ? 'Es el mismo día.' : dayShift > 0 ? 'Pasa la medianoche: es el día siguiente.' : 'Se vuelve atrás de la medianoche: es el día anterior.';
      var dayEn = dayShift === 0 ? 'It is the same day.' : dayShift > 0 ? 'That passes midnight: it is the next day.' : 'That goes back past midnight: it is the day before.';
      var steps = [
        { es: ZONES.LA.short.es + ': ' + offTxt('LA', fromZ === 'LA' ? f : right, true) + '.', en: ZONES.LA.short.en + ': ' + offTxt('LA', fromZ === 'LA' ? f : right, false) + '.' },
        { es: ZONES.SCL.short.es + ': ' + offTxt('SCL', fromZ === 'LA' ? right : f, true) + '.', en: ZONES.SCL.short.en + ': ' + offTxt('SCL', fromZ === 'LA' ? right : f, false) + '.' },
        { es: 'En esa fecha Santiago está ' + ahead + ' horas adelante de California.', en: 'On that date Santiago is ' + ahead + ' hours ahead of California.' },
        { es: (diff >= 0 ? 'Hacia Santiago se suma: ' : 'Hacia California se resta: ') + calcEs + '. ' + dayEs, en: (diff >= 0 ? 'Going to Santiago you add: ' : 'Going to California you subtract: ') + calcEn + '. ' + dayEn },
        { es: 'Respuesta: ' + fmtShort(right, true), en: 'Answer: ' + fmtShort(right, false) }
      ];
      return {
        topic: 'zones', from: fromZ, to: toZ, y: y, m: m, d: d, hh: hh, mm: mm,
        answerTime: { y: right.y, m: right.m, d: right.d, hh: right.hh, mm: right.mm },
        ahead: ahead, dayShift: dayShift,
        text: {
          es: 'En ' + fromName.es + ' son las ' + fmtClock(hh, mm, true) + ' del ' + fmtDate(res.from, true, true) + '. ¿Qué día y hora es en ' + toName.es + '?',
          en: 'In ' + fromName.en + ' it is ' + fmtClock(hh, mm, false) + ' on ' + fmtDate(res.from, false, true) + '. What day and time is it in ' + toName.en + '?'
        },
        note: { es: 'Reglas de 2026: los gobiernos pueden cambiar las horas, y otras zonas de Chile (la Isla de Pascua, Magallanes) son distintas.',
                en: 'Rules as of 2026: governments can change clock rules, and some other parts of Chile (Easter Island, Magallanes) differ.' },
        choices: all.map(function (t) { return { es: fmtShort(t, true), en: fmtShort(t, false) }; }),
        correct: all.indexOf(right),
        steps: steps
      };
    }
    return null;
  }

  // A quiz question for a topic (the time-zone topic has its own).
  function question(topic, r) { return topic === 'zones' ? zoneQuestion(r) : unitQuestion(topic, r); }

  // Plain, self-contained Repaso item (text only) for a missed question.
  function reviewItem(q, es) {
    var lang = es ? 'es' : 'en';
    return { prompt: q.text[lang] + (q.note ? ' ' + q.note[lang] : ''), answer: q.choices[q.correct][lang],
             choices: q.choices.map(function (c) { return c[lang]; }) };
  }

  var api = {
    USD_CLP: USD_CLP, NAMES: NAMES, PAIRS: PAIRS, TOPICS: TOPICS, ZONES: ZONES, DAYS: DAYS, MONTHS: MONTHS,
    sym: sym, withUnit: withUnit, pairsOf: pairsOf, pairById: pairById, convert: convert, factText: factText,
    unitQuestion: unitQuestion, zoneQuestion: zoneQuestion, question: question, reviewItem: reviewItem,
    transitions: transitions, offsetMinutes: offsetMinutes, isDst: isDst, utcToLocal: utcToLocal, localToUtc: localToUtc,
    convertZone: convertZone, hoursAhead: hoursAhead, aheadByMonth: aheadByMonth,
    fmtClock: fmtClock, fmtDate: fmtDate, fmtShort: fmtShort
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CalculoUnits = api;
})(typeof window !== 'undefined' ? window : this);
