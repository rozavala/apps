/* ================================================================
   ¿QUÉ HORA ES? — data & language helpers (que-hora-es-data.js)

   Pure data + pure functions, no DOM:
   - number words (EN / ES) and time-in-words for both languages
   - digital formatting (12 h / 24 h, a.m. / p.m.)
   - the level catalogue (modes × levels, tier recommendations)
   - My Day routines, "How long?" activities, calendar names,
     Chilean seasons (southern hemisphere) and the expert puzzles.

   Exposes one global: QheData
   ================================================================ */

var QheData = (function() {
  'use strict';

  // ---- number words ----------------------------------------------
  var EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
    'eighteen', 'nineteen'];
  var EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
  function enNum(n) {
    if (n < 20) return EN_ONES[n];
    var t = Math.floor(n / 10), o = n % 10;
    return EN_TENS[t] + (o ? '-' + EN_ONES[o] : '');
  }

  var ES_UNDER30 = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho',
    'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  var ES_TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta'];
  function esNum(n) {
    if (n < 30) return ES_UNDER30[n];
    var t = Math.floor(n / 10), o = n % 10;
    return ES_TENS[t] + (o ? ' y ' + ES_UNDER30[o] : '');
  }

  // ---- time helpers ----------------------------------------------
  // A time is "minutes since midnight" (0..1439). The analog clock
  // only cares about mod 720.
  function norm(t) { return ((Math.round(t) % 1440) + 1440) % 1440; }
  function h12(t) { var h = Math.floor(norm(t) / 60) % 12; return h === 0 ? 12 : h; }
  function h24(t) { return Math.floor(norm(t) / 60); }
  function mins(t) { return norm(t) % 60; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function digital12(t) { return h12(t) + ':' + pad(mins(t)); }
  function digital24(t) { return pad(h24(t)) + ':' + pad(mins(t)); }
  function ampm(t) { return h24(t) < 12 ? 'a.m.' : 'p.m.'; }

  // "half past three" / "las tres y media" (no leading verb)
  function phraseEn(t) {
    var m = mins(t), h = h12(t), next = h12(t + 60);
    if (m === 0) return enNum(h) + " o'clock";
    if (m === 30) return 'half past ' + enNum(h);
    if (m === 15) return 'quarter past ' + enNum(h);
    if (m === 45) return 'quarter to ' + enNum(next);
    if (m % 5 === 0) {
      return m < 30 ? enNum(m) + ' past ' + enNum(h) : enNum(60 - m) + ' to ' + enNum(next);
    }
    if (m < 30) return enNum(m) + (m === 1 ? ' minute' : ' minutes') + ' past ' + enNum(h);
    var left = 60 - m;
    return enNum(left) + (left === 1 ? ' minute' : ' minutes') + ' to ' + enNum(next);
  }

  function esHour(h) { return h === 1 ? 'la una' : 'las ' + ES_UNDER30[h]; }
  function phraseEs(t) {
    var m = mins(t), h = h12(t), next = h12(t + 60);
    if (m === 0) return esHour(h) + ' en punto';
    if (m === 30) return esHour(h) + ' y media';
    if (m === 15) return esHour(h) + ' y cuarto';
    if (m === 45) return esHour(next) + ' menos cuarto';
    if (m > 30 && m % 5 === 0) return esHour(next) + ' menos ' + esNum(60 - m);
    return esHour(h) + ' y ' + esNum(m);
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // Full sentences: "It's half past three." / "Son las tres y media."
  function sentenceEn(t) { return "It's " + phraseEn(t) + '.'; }
  function sentenceEs(t) {
    var p = phraseEs(t);
    // "Es la una…" but "Son las…" — the verb follows the hour named.
    return (p.indexOf('la una') === 0 ? 'Es ' : 'Son ') + p + '.';
  }

  function periodEn(t) {
    var h = h24(t);
    if (h === 12 && mins(t) === 0) return 'at midday';
    if (h < 5) return 'at night';
    if (h < 12) return 'in the morning';
    if (h < 18) return 'in the afternoon';
    if (h < 21) return 'in the evening';
    return 'at night';
  }
  function periodEs(t) {
    var h = h24(t);
    if (h === 12 && mins(t) === 0) return 'del mediodía';
    if (h < 6) return 'de la madrugada';
    if (h < 12) return 'de la mañana';
    if (h < 20) return 'de la tarde';
    return 'de la noche';
  }

  // "4:15" inside a Spanish sentence: "a las 4:15" / "a la 1:15"
  function esAt(t) { return (h12(t) === 1 ? 'a la ' : 'a las ') + digital12(t); }

  function durEn(d) {
    var h = Math.floor(d / 60), m = d % 60, out = [];
    if (h) out.push(h + (h === 1 ? ' hour' : ' hours'));
    if (m) out.push(m + (m === 1 ? ' minute' : ' minutes'));
    return out.join(' and ');
  }
  function durEs(d) {
    var h = Math.floor(d / 60), m = d % 60, out = [];
    if (h) out.push(h + (h === 1 ? ' hora' : ' horas'));
    if (m) out.push(m + (m === 1 ? ' minuto' : ' minutos'));
    return out.join(' y ');
  }
  function durShort(d) {
    var h = Math.floor(d / 60), m = d % 60;
    if (!h) return m + ' min';
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }

  // ---- levels ----------------------------------------------------
  var TIER_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

  // Clock-skill ladder shared by Set / Read / Match.
  var CLOCK_LEVELS = {
    oclock:  { en: "O'clock",              es: 'En punto',               tier: 'beginner',     step: 5, hint: { en: 'Minute hand on 12', es: 'Minutero en el 12' } },
    half:    { en: 'Half past',            es: 'Y media',                tier: 'beginner',     step: 5, hint: { en: 'Minute hand on 6', es: 'Minutero en el 6' } },
    quarter: { en: 'Quarter past & to',    es: 'Y cuarto · Menos cuarto', tier: 'intermediate', step: 5, hint: { en: '3 = quarter past, 9 = quarter to', es: '3 = y cuarto, 9 = menos cuarto' } },
    five:    { en: 'Five-minute steps',    es: 'De cinco en cinco',      tier: 'intermediate', step: 5, hint: { en: 'Count by fives around the dial', es: 'Cuenta de cinco en cinco' } },
    minute:  { en: 'Any minute',           es: 'Cualquier minuto',       tier: 'advanced',     step: 1, hint: { en: 'Fives, then count the small ticks', es: 'De cinco en cinco y luego las rayitas' } },
    h24:     { en: '24-hour time',         es: 'Hora de 24 horas',       tier: 'advanced',     step: 5, hint: { en: 'After midday, add 12 to the hour', es: 'Después del mediodía, suma 12 a la hora' } }
  };

  var OTHER_LEVELS = {
    day1:  { en: "O'clock & half past",  es: 'En punto y media',      tier: 'beginner' },
    day2:  { en: 'Quarter hours',        es: 'Cuartos de hora',       tier: 'intermediate' },
    day3:  { en: 'Five minutes & 24 h',  es: 'Cinco minutos y 24 h',  tier: 'advanced' },
    hl1:   { en: 'Hours later',          es: 'Horas después',         tier: 'intermediate' },
    hl2:   { en: 'Minutes later',        es: 'Minutos después',       tier: 'advanced' },
    hl3:   { en: 'How long did it last?', es: '¿Cuánto duró?',        tier: 'advanced' },
    hl4:   { en: 'Working backwards',    es: 'Hacia atrás',           tier: 'expert' },
    cal1:  { en: 'Days of the week',     es: 'Días de la semana',     tier: 'intermediate' },
    cal2:  { en: 'Months & seasons',     es: 'Meses y estaciones',    tier: 'intermediate' },
    cal3:  { en: 'Read the calendar',    es: 'Lee el calendario',     tier: 'advanced' },
    ampm:  { en: 'a.m. or p.m.?',        es: '¿a.m. o p.m.?',         tier: 'expert' },
    zones: { en: 'Chile & Spain',        es: 'Chile y España',        tier: 'expert' }
  };

  var MODES = [
    { id: 'set',      icon: '🎯', en: 'Set the Clock',  es: 'Pon la hora',
      desc: { en: 'Drag the hands to show the time.', es: 'Mueve las manecillas a la hora.' },
      levels: ['oclock', 'half', 'quarter', 'five', 'minute', 'h24'] },
    { id: 'read',     icon: '👀', en: 'Read the Clock', es: 'Lee la hora',
      desc: { en: 'Look at the clock and say the time.', es: 'Mira el reloj y di la hora.' },
      levels: ['oclock', 'half', 'quarter', 'five', 'minute', 'h24'] },
    { id: 'match',    icon: '🧩', en: 'Match',          es: 'Une',
      desc: { en: 'Pair clocks with digital times and words.', es: 'Une relojes con horas y palabras.' },
      levels: ['oclock', 'half', 'quarter', 'five', 'minute'] },
    { id: 'day',      icon: '🌅', en: 'My Day',         es: 'Mi día',
      desc: { en: 'Wake up to bedtime — set each moment.', es: 'De despertar a dormir, hora por hora.' },
      levels: ['day1', 'day2', 'day3'] },
    { id: 'howlong',  icon: '⏳', en: 'How Long?',      es: '¿Cuánto tiempo?', age: '8+',
      desc: { en: 'Start, end and how long things last.', es: 'Inicio, fin y cuánto dura.' },
      levels: ['hl1', 'hl2', 'hl3', 'hl4'] },
    { id: 'calendar', icon: '📅', en: 'Calendar',       es: 'Calendario', age: '7+',
      desc: { en: 'Days, months and Chile’s seasons.', es: 'Días, meses y estaciones de Chile.' },
      levels: ['cal1', 'cal2', 'cal3'] },
    { id: 'puzzles',  icon: '🌍', en: 'Time Puzzles',   es: 'Acertijos', age: '10+',
      desc: { en: 'a.m./p.m. riddles and Chile vs Spain.', es: 'a.m./p.m. y Chile frente a España.' },
      levels: ['ampm', 'zones'] }
  ];

  function levelInfo(mode, lvl) {
    return CLOCK_LEVELS[lvl] || OTHER_LEVELS[lvl] || { en: lvl, es: lvl, tier: 'intermediate' };
  }
  function modeById(id) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i];
    return null;
  }

  // ---- My Day ------------------------------------------------------
  // times[] = [day1, day2, day3] in minutes since midnight.
  var ROUTINE = [
    { id: 'wake',      en: 'Wake up',         es: 'Despertar',
      ask: { en: 'Good morning! Set the clock for when you wake up.', es: '¡Buenos días! Pon el reloj a la hora de despertar.' },
      times: [420, 420, 415] },
    { id: 'breakfast', en: 'Breakfast',       es: 'Desayuno',
      ask: { en: 'Time for breakfast! Set the clock.', es: '¡A tomar desayuno! Pon el reloj.' },
      times: [450, 435, 440] },
    { id: 'school',    en: 'School starts',   es: 'Empieza el colegio',
      ask: { en: 'The school bell rings. Set the clock.', es: 'Suena la campana del colegio. Pon el reloj.' },
      times: [480, 480, 485] },
    { id: 'lunch',     en: 'Lunch',           es: 'Almuerzo',
      ask: { en: 'Lunch time! Set the clock.', es: '¡Hora de almorzar! Pon el reloj.' },
      times: [780, 795, 815] },
    { id: 'piano',     en: 'Piano practice',  es: 'Práctica de piano',
      ask: { en: 'Piano practice begins. Set the clock.', es: 'Empieza la práctica de piano. Pon el reloj.' },
      times: [960, 975, 970] },
    { id: 'football',  en: 'Football',        es: 'Fútbol',
      ask: { en: 'Football with friends! Set the clock.', es: '¡Fútbol con los amigos! Pon el reloj.' },
      times: [1050, 1065, 1070] },
    { id: 'dinner',    en: 'Dinner',          es: 'Cena',
      ask: { en: 'The family sits down for dinner. Set the clock.', es: 'La familia se sienta a cenar. Pon el reloj.' },
      times: [1200, 1200, 1210] },
    { id: 'bedtime',   en: 'Bedtime',         es: 'Hora de dormir',
      ask: { en: 'Pyjamas on — bedtime! Set the clock.', es: '¡Pijama puesto, a dormir! Pon el reloj.' },
      times: [1230, 1245, 1285] }
  ];

  // ---- How long? activities -----------------------------------------
  // start = [earliest, latest] in hours; durs = allowed durations (min).
  var ACTIVITIES = [
    { en: 'Piano practice',          es: 'La práctica de piano',       start: [15, 18], durs: [15, 20, 25, 30, 40, 45, 60] },
    { en: 'The football match',      es: 'El partido de fútbol',       start: [10, 18], durs: [40, 45, 50, 60, 90, 120] },
    { en: 'Homework',                es: 'La tarea',                   start: [15, 18], durs: [20, 25, 30, 35, 40, 45, 60] },
    { en: 'The bread in the oven',   es: 'El pan amasado en el horno', start: [10, 18], durs: [20, 25, 30, 35, 40] },
    { en: 'The swimming lesson',     es: 'La clase de natación',       start: [9, 17],  durs: [30, 40, 45, 50, 60] },
    { en: 'The bike ride',           es: 'El paseo en bicicleta',      start: [9, 17],  durs: [25, 30, 45, 60, 90, 120] },
    { en: 'The film',                es: 'La película',                start: [15, 19], durs: [90, 100, 105, 110, 120] },
    { en: 'The car trip to the beach', es: 'El viaje en auto a la playa', start: [8, 12], durs: [60, 90, 105, 120, 150, 180] },
    { en: 'Reading time',            es: 'El rato de lectura',         start: [17, 20], durs: [10, 15, 20, 25, 30] },
    { en: 'Baking a cake',           es: 'Hornear un queque',          start: [10, 17], durs: [35, 40, 45, 50, 55, 60] }
  ];

  // ---- calendar --------------------------------------------------------
  // Weeks start on Monday, as on Chilean calendars.
  var DAYS = {
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    enShort: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    esShort: ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  };
  var MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
         'September', 'October', 'November', 'December'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre']
  };
  // Southern hemisphere (Chile): Dec–Feb summer, Mar–May autumn,
  // Jun–Aug winter, Sep–Nov spring.
  var SEASONS = {
    summer: { en: 'Summer', es: 'Verano',    months: [11, 0, 1],  color: '#F59E0B' },
    autumn: { en: 'Autumn', es: 'Otoño',     months: [2, 3, 4],   color: '#C2410C' },
    winter: { en: 'Winter', es: 'Invierno',  months: [5, 6, 7],   color: '#2563EB' },
    spring: { en: 'Spring', es: 'Primavera', months: [8, 9, 10],  color: '#16A34A' }
  };
  var SEASON_IDS = ['summer', 'autumn', 'winter', 'spring'];
  function seasonOfMonth(m) {
    for (var i = 0; i < SEASON_IDS.length; i++) {
      if (SEASONS[SEASON_IDS[i]].months.indexOf(m) >= 0) return SEASON_IDS[i];
    }
    return 'summer';
  }
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  // Monday = 0 … Sunday = 6
  function weekdayOf(y, m, d) { return (new Date(y, m, d).getDay() + 6) % 7; }

  // ---- expert puzzles ----------------------------------------------
  // Fixed facts. Each: q {en,es}, options [{en,es}], answer index.
  var ZONE_FACTS = [
    { q: { en: "Spain is several hours ahead of Chile. When it's 8:00 a.m. breakfast in Santiago, what time of day is it in Madrid?",
           es: 'España va varias horas adelantada respecto de Chile. Cuando son las 8:00 a.m. en Santiago, ¿qué momento del día es en Madrid?' },
      opts: [{ en: 'Around midday', es: 'Cerca del mediodía' }, { en: 'The middle of the night', es: 'Plena noche' }, { en: 'Also 8:00 a.m.', es: 'También las 8:00 a.m.' }], a: 0 },
    { q: { en: "When it's 9:00 p.m. bedtime in Chile, what is it in Spain?",
           es: 'Cuando son las 9:00 p.m. y es hora de dormir en Chile, ¿qué hora es en España?' },
      opts: [{ en: 'After midnight — already the next day', es: 'Pasada la medianoche, ya es el día siguiente' }, { en: 'Early evening', es: 'Temprano en la tarde' }, { en: 'Lunch time', es: 'Hora de almuerzo' }], a: 0 },
    { q: { en: 'Which country sees the sunrise first each day?', es: '¿Qué país ve salir el sol primero cada día?' },
      opts: [{ en: 'Spain', es: 'España' }, { en: 'Chile', es: 'Chile' }, { en: 'Both at the same moment', es: 'Los dos al mismo tiempo' }], a: 0 },
    { q: { en: 'Why is Spain ahead of Chile in time?', es: '¿Por qué España va adelantada respecto de Chile?' },
      opts: [{ en: 'It is farther east, so the Sun reaches it first', es: 'Está más al este y el sol llega primero' }, { en: 'It is a bigger country', es: 'Es un país más grande' }, { en: 'It has more clocks', es: 'Tiene más relojes' }], a: 0 },
    { q: { en: 'Is Spain ahead of or behind Chile in time?', es: '¿España va adelantada o atrasada respecto de Chile?' },
      opts: [{ en: 'Ahead', es: 'Adelantada' }, { en: 'Behind', es: 'Atrasada' }, { en: 'Exactly the same', es: 'Exactamente igual' }], a: 0 },
    { q: { en: "It's 12:00 midday in Madrid. What time of day is it in Santiago?", es: 'Son las 12:00 del mediodía en Madrid. ¿Qué momento del día es en Santiago?' },
      opts: [{ en: 'Early morning', es: 'Temprano en la mañana' }, { en: 'Late at night', es: 'Tarde en la noche' }, { en: 'The afternoon', es: 'La tarde' }], a: 0 },
    { q: { en: 'You want to call cousins in Spain after their school day. When is a good time in Chile?', es: 'Quieres llamar a tus primos en España después de su colegio. ¿Cuándo es buena hora en Chile?' },
      opts: [{ en: 'In the Chilean morning', es: 'En la mañana de Chile' }, { en: 'Late at night in Chile', es: 'Tarde en la noche en Chile' }, { en: 'At midnight in Chile', es: 'A medianoche en Chile' }], a: 0 },
    { q: { en: 'Rapa Nui (Easter Island) lies far west of mainland Chile. Is its clock ahead of or behind Santiago?', es: 'Rapa Nui está muy al oeste de Chile continental. ¿Su reloj va adelantado o atrasado respecto de Santiago?' },
      opts: [{ en: 'Behind', es: 'Atrasado' }, { en: 'Ahead', es: 'Adelantado' }, { en: 'The same', es: 'Igual' }], a: 0 },
    { q: { en: 'About how long does the Earth take to spin around once?', es: '¿Cuánto tarda la Tierra en dar una vuelta sobre sí misma?' },
      opts: [{ en: 'About 24 hours', es: 'Unas 24 horas' }, { en: 'About 1 hour', es: 'Una hora' }, { en: 'About a week', es: 'Una semana' }], a: 0 },
    { q: { en: 'In which direction does the Sun rise?', es: '¿Por dónde sale el sol?' },
      opts: [{ en: 'In the east', es: 'Por el este' }, { en: 'In the west', es: 'Por el oeste' }, { en: 'In the south', es: 'Por el sur' }], a: 0 },
    { q: { en: 'Train and flight times in Chile and Spain are usually written with…', es: 'En Chile y España, los horarios de trenes y vuelos se escriben normalmente con…' },
      opts: [{ en: 'The 24-hour clock', es: 'La hora de 24 horas' }, { en: 'Roman numerals', es: 'Números romanos' }, { en: 'Only words', es: 'Solo palabras' }], a: 0 }
  ];

  var AMPM_FACTS = [
    { q: { en: 'Midday (noon) is written as 12:00…', es: 'El mediodía se escribe 12:00…' },
      opts: [{ en: 'p.m.', es: 'p.m.' }, { en: 'a.m.', es: 'a.m.' }], a: 0 },
    { q: { en: 'Midnight is written as 12:00…', es: 'La medianoche se escribe 12:00…' },
      opts: [{ en: 'a.m.', es: 'a.m.' }, { en: 'p.m.', es: 'p.m.' }], a: 0 },
    { q: { en: '"a.m." comes from Latin "ante meridiem". It means…', es: '"a.m." viene del latín "ante meridiem". Significa…' },
      opts: [{ en: 'Before midday', es: 'Antes del mediodía' }, { en: 'After midday', es: 'Después del mediodía' }, { en: 'At night', es: 'De noche' }], a: 0 },
    { q: { en: '"p.m." comes from Latin "post meridiem". It means…', es: '"p.m." viene del latín "post meridiem". Significa…' },
      opts: [{ en: 'After midday', es: 'Después del mediodía' }, { en: 'Before midday', es: 'Antes del mediodía' }, { en: 'At breakfast', es: 'Al desayuno' }], a: 0 },
    { q: { en: 'How many hours are there in one whole day?', es: '¿Cuántas horas tiene un día completo?' },
      opts: [{ en: '24', es: '24' }, { en: '12', es: '12' }, { en: '60', es: '60' }], a: 0 },
    { q: { en: 'How many times does the hour hand go all the way around in one day?', es: '¿Cuántas vueltas completas da el horario en un día?' },
      opts: [{ en: '2', es: '2' }, { en: '1', es: '1' }, { en: '24', es: '24' }], a: 0 }
  ];

  // Scenes that pin a 12-hour time to a.m. or p.m.
  var AMPM_SCENES = [
    { t: 420,  en: 'The family is eating breakfast. The clock says 7:00.',            es: 'La familia toma desayuno. El reloj marca las 7:00.' },
    { t: 1200, en: 'The family is eating dinner. The clock says 8:00.',                es: 'La familia está cenando. El reloj marca las 8:00.' },
    { t: 1380, en: 'The stars are out and everyone is asleep. The clock says 11:00.',  es: 'Hay estrellas y todos duermen. El reloj marca las 11:00.' },
    { t: 480,  en: 'The school bell rings for the first class. The clock says 8:00.',  es: 'Suena la campana de la primera clase. El reloj marca las 8:00.' },
    { t: 930,  en: 'School is over and it is time for a snack. The clock says 3:30.',  es: 'Terminó el colegio y es hora de la colación. El reloj marca las 3:30.' },
    { t: 360,  en: 'The sky is getting light and the birds start to sing. The clock says 6:00.', es: 'Está amaneciendo y cantan los pájaros. El reloj marca las 6:00.' },
    { t: 1050, en: 'Football practice after school. The clock says 5:30.',              es: 'Entrenamiento de fútbol después del colegio. El reloj marca las 5:30.' },
    { t: 30,   en: 'Everyone is fast asleep in the middle of the night. The clock says 12:30.', es: 'Todos duermen en plena noche. El reloj marca las 12:30.' }
  ];

  return {
    enNum: enNum, esNum: esNum,
    norm: norm, h12: h12, h24: h24, mins: mins, pad: pad,
    digital12: digital12, digital24: digital24, ampm: ampm,
    phraseEn: phraseEn, phraseEs: phraseEs, sentenceEn: sentenceEn, sentenceEs: sentenceEs,
    periodEn: periodEn, periodEs: periodEs, esAt: esAt, cap: cap,
    durEn: durEn, durEs: durEs, durShort: durShort,
    TIER_ORDER: TIER_ORDER, CLOCK_LEVELS: CLOCK_LEVELS, OTHER_LEVELS: OTHER_LEVELS,
    MODES: MODES, levelInfo: levelInfo, modeById: modeById,
    ROUTINE: ROUTINE, ACTIVITIES: ACTIVITIES,
    DAYS: DAYS, MONTHS: MONTHS, SEASONS: SEASONS, SEASON_IDS: SEASON_IDS,
    seasonOfMonth: seasonOfMonth, daysInMonth: daysInMonth, weekdayOf: weekdayOf,
    ZONE_FACTS: ZONE_FACTS, AMPM_FACTS: AMPM_FACTS, AMPM_SCENES: AMPM_SCENES
  };
})();
