/* ================================================================
   TRIVIA FAMILIAR — questions built from the suite's own data
   (js/trivia-gen.js)

   So the apps agree, these come straight from other apps' data files,
   which the page loads before this one:
     WORLD_ATLAS_DATA (js/world-atlas-data.js)   capitals, continents, money
     WorldMap         (js/world-map-data.js)     flags and the world map
     DC_REGIONS       (js/descubre-chile-data.js) Chile's regions
     LM_SONGS         (js/lm-songs.js)           tunes to name by ear
   Any of them missing → that set is skipped. Rows use the same format as
   the hand-written ones (js/trivia-engine.js) and have stable ids.
   ================================================================ */

var TriviaGen = (function () {
  'use strict';

  function g(name) {
    if (typeof window !== 'undefined' && window[name]) return window[name];
    if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
    return null;
  }

  // ── Number words ────────────────────────────────────────────────
  function popPair(n) {
    if (!n) return null;
    if (n >= 1e9) { var b = Math.round(n / 1e8) / 10; return [String(b).replace('.', ',') + ' mil millones', b + ' billion']; }
    if (n >= 1e7) { var m = Math.round(n / 1e6); return [m + ' millones', m + ' million']; }
    if (n >= 1e6) { var m1 = Math.round(n / 1e5) / 10; return [String(m1).replace('.', ',') + ' millones', m1 + ' million']; }
    var k = Math.round(n / 1e3);
    return [k + ' mil', k + ' thousand'];
  }
  // "de Chile", "del Reino Unido", "de los Países Bajos"
  var ES_ART = { gbr: 'el Reino Unido', nld: 'los Países Bajos', usa: 'Estados Unidos', phl: 'Filipinas', ind: 'la India', chn: 'China' };
  function esName(c) { return ES_ART[c.id] || c.nameEs; }
  function deEs(c) { var n = esName(c); return n.indexOf('el ') === 0 ? 'del ' + n.slice(3) : 'de ' + n; }
  function capEs(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var CONT = {
    as: ['Asia', 'Asia'], eu: ['Europa', 'Europe'], af: ['África', 'Africa'], na: ['América del Norte', 'North America'],
    sa: ['América del Sur', 'South America'], oc: ['Oceanía', 'Oceania'], an: ['Antártida', 'Antarctica']
  };

  // ── Countries, by how well known they are ───────────────────────
  var CAP_TIERS = {
    2: ['arg', 'per', 'fra', 'esp', 'ita', 'gbr', 'jpn', 'mex', 'usa'],
    3: ['bra', 'col', 'ury', 'pry', 'ecu', 'ven', 'deu', 'prt', 'grc', 'egy', 'chn', 'can', 'aus', 'rus', 'irl', 'cub'],
    4: ['tur', 'ind', 'nzl', 'kor', 'nga', 'mar', 'che', 'aut', 'swe', 'nor', 'pol', 'bel', 'fin', 'dnk', 'phl', 'tha', 'vnm', 'ken', 'idn', 'mng', 'kaz', 'pak']
  };
  var FLAG_TIERS = {
    2: ['arg', 'usa', 'bra', 'jpn', 'can', 'ita', 'fra', 'esp', 'mex', 'gbr', 'per'],
    3: ['deu', 'ury', 'col', 'kor', 'ind', 'che', 'grc', 'swe', 'prt', 'aus', 'chn', 'irl'],
    4: ['nzl', 'nld', 'bel', 'zaf', 'tur', 'nor', 'fin', 'ecu', 'pry', 'ven', 'cub', 'egy', 'dnk', 'pol']
  };
  var MAP_TIERS = {
    2: ['bra', 'usa', 'aus', 'chn', 'rus', 'can', 'ind', 'arg', 'mex'],
    3: ['per', 'col', 'fra', 'esp', 'egy', 'zaf', 'jpn', 'deu', 'ita', 'bol', 'ven'],
    4: ['tur', 'irn', 'mng', 'kaz', 'nga', 'swe', 'nor', 'pol', 'ecu', 'pry', 'idn', 'sau', 'ken']
  };
  var CONT_TIERS = { 2: ['as', 'eu', 'af'], 3: ['na', 'sa', 'oc'] };
  var MONEY = [['jpn', 4], ['gbr', 4], ['bra', 4], ['mex', 3], ['usa', 3], ['fra', 3], ['chn', 4], ['ind', 4], ['che', 4], ['rus', 4], ['per', 4], ['arg', 3]];

  function atlas() {
    var A = g('WORLD_ATLAS_DATA'), out = {};
    (A || []).forEach(function (c) { out[c.id] = c; });
    return A ? out : null;
  }
  // "Su capital es X." — or the atlas's note for countries with more than
  // one capital (South Africa, Bolivia, the Netherlands). No ".." after "D.C.".
  function stop(t) { return /\.$/.test(t) ? t : t + '.'; }
  function capSentence(c) {
    if (c.capitalNote) return [stop(c.capitalNote.es), stop(c.capitalNote.en)];
    return [stop('Su capital es ' + c.capitalEs), stop('Its capital is ' + c.capital)];
  }
  function factOf(c) {
    var p = popPair(c.population);
    var es = capEs(esName(c)) + (p ? ' tiene unos ' + p[0] + ' de habitantes' : '') + ' y su moneda es el ' + c.currencyNameEs + '.';
    var en = c.name + (p ? ' has about ' + p[1] + ' people' : '') + ' and its money is the ' + c.currencyName + '.';
    return [es, en];
  }
  // Wrong answers: other countries from the same tier list, the same
  // continent first, picked by a fixed step so ids stay stable.
  function others(list, id, n, sameFirst) {
    var rest = list.filter(function (x) { return x !== id; });
    if (sameFirst) {
      var a = rest.filter(sameFirst), b = rest.filter(function (x) { return !sameFirst(x); });
      rest = a.concat(b);
    }
    var h = 0;
    for (var j = 0; j < id.length; j++) h += id.charCodeAt(j);
    var start = h % Math.max(1, Math.min(rest.length, 5));
    var out = [];
    for (var i = 0; out.length < n && i < rest.length; i++) out.push(rest[(start + i) % rest.length]);
    return out;
  }
  function allTier(T) { var o = []; Object.keys(T).forEach(function (k) { o = o.concat(T[k]); }); return o; }

  // ── Capitals ────────────────────────────────────────────────────
  function capitals(A, WM) {
    var rows = [], all = allTier(CAP_TIERS).filter(function (id) { return A[id] && !A[id].capitalNote; });
    Object.keys(CAP_TIERS).forEach(function (t) {
      CAP_TIERS[t].forEach(function (id) {
        var c = A[id];
        if (!c || c.capitalNote) return;
        var cont = WM ? WM.continentOf(id) : '';
        var wrong = others(all, id, 3, function (x) { return WM ? WM.continentOf(x) === cont : A[x].region === c.region; });
        var f = factOf(c);
        rows.push(['ge-cap-' + id, +t, 'mc', '¿Cuál es la capital ' + deEs(c) + '?', 'What is the capital of ' + c.name + '?',
          [[c.capitalEs, c.capital]].concat(wrong.map(function (x) { return [A[x].capitalEs, A[x].capital]; })),
          f[0], f[1], { s: 'World Atlas' }]);
      });
    });
    return rows;
  }

  // ── Flags ───────────────────────────────────────────────────────
  function flags(A, WM) {
    if (!WM) return [];
    var rows = [], all = allTier(FLAG_TIERS).filter(function (id) { return A[id] && WM.hasFlag(id); });
    Object.keys(FLAG_TIERS).forEach(function (t) {
      FLAG_TIERS[t].forEach(function (id) {
        var c = A[id];
        if (!c || !WM.hasFlag(id)) return;
        var cont = WM.continentOf(id);
        var wrong = others(all, id, 3, function (x) { return WM.continentOf(x) === cont; });
        rows.push(['ge-flag-' + id, +t, 'pic', '¿De qué país es esta bandera?', 'Which country does this flag belong to?',
          [[c.nameEs, c.name]].concat(wrong.map(function (x) { return [A[x].nameEs, A[x].name]; })),
          'Es la bandera ' + deEs(c) + ', en ' + CONT[cont][0] + '. ' + capSentence(c)[0],
          'It is the flag of ' + (id === 'usa' || id === 'gbr' || id === 'nld' || id === 'phl' ? 'the ' : '') + c.name + ', in ' + CONT[cont][1] + '. ' + capSentence(c)[1],
          { art: 'flag-' + id, s: 'World Atlas' }]);
      });
    });
    // The other way round, for the youngest: pick Chile's flag (in the
    // Chile questions) and these well-known ones by picture.
    return rows;
  }

  // ── Where is it? (the world map) ────────────────────────────────
  function mapCountries(A, WM) {
    if (!WM) return [];
    var rows = [];
    Object.keys(MAP_TIERS).forEach(function (t) {
      MAP_TIERS[t].forEach(function (id) {
        var c = A[id], inf = WM.info(id);
        if (!c || !inf) return;
        // Three neighbours (or, for islands, the nearest big countries of
        // the same continent) so the four sit together on one map.
        var home = WM.continentOf(id);
        var land = (inf.n || []).filter(function (x) { return WM.continentOf(x) === home; });
        var near = land.filter(function (x) { return A[x] && WM.info(x) && WM.info(x).a > 40; });
        if (near.length < 3) {
          var cont = home;
          var pool = WM.codes().filter(function (x) { return x !== id && near.indexOf(x) < 0 && A[x] && WM.continentOf(x) === cont && WM.info(x) && WM.info(x).a > 120; });
          pool.sort(function (a, b) { return dist(WM.info(a).c, inf.c) - dist(WM.info(b).c, inf.c); });
          near = near.concat(pool).slice(0, 3);
        } else {
          near.sort(function (a, b) { return WM.info(b).a - WM.info(a).a; });
          near = near.slice(0, 3);
        }
        if (near.length < 3) return;
        var codes = [id].concat(near), cont = CONT[WM.continentOf(id)] || ['', ''];
        // The map's neighbour lists are not complete, so a border fact
        // only ever says "countries such as", never the whole list.
        var bord = near.filter(function (x) { return land.indexOf(x) >= 0; });
        var en = id === 'usa' ? 'the United States' : c.name, cs = capSentence(c);
        var fEs = (bord.length ? capEs(esName(c)) + ' limita con países como ' + list(bord.map(function (x) { return esName(A[x]); }), 'y') + '. '
                               : capEs(esName(c)) + ' está en ' + cont[0] + '. ') + cs[0];
        var fEn = (bord.length ? capEs(en) + ' borders countries such as ' + list(bord.map(function (x) { return A[x].name; }), 'and') + '. '
                               : capEs(en) + ' is in ' + cont[1] + '. ') + cs[1];
        rows.push(['ge-map-' + id, +t, 'map', '¿Dónde está ' + esName(c) + '? Toca su letra.', 'Where is ' + en + '? Tap its letter.',
          codes.map(function (x) { return [A[x].nameEs, A[x].name]; }), fEs, fEn, { map: 'world', o: codes, s: 'World Atlas' }]);
      });
    });
    // For the little ones: find Chile, the long thin one.
    rows.push(['cl-map-chl', 1, 'map', '¿Cuál es Chile? Es largo y angosto.', 'Which one is Chile? It is long and thin.',
      [['Chile', 'Chile'], ['Argentina', 'Argentina'], ['Perú', 'Peru'], ['Bolivia', 'Bolivia']],
      'Chile es el país largo junto al mar, al lado de la cordillera de los Andes.', 'Chile is the long country by the sea, next to the Andes mountains.',
      { map: 'world', o: ['chl', 'arg', 'per', 'bol'] }]);
    return rows;
  }
  function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy; }
  function list(a, and) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + and + ' ' + a[a.length - 1]; }

  // ── Continents ──────────────────────────────────────────────────
  function continents(WM) {
    if (!WM) return [];
    var rows = [], ids = ['as', 'eu', 'af', 'na', 'sa', 'oc'];
    var FACT = {
      as: ['Es el continente más grande y donde vive más gente.', 'It is the largest continent and has the most people.'],
      eu: ['Es un continente pequeño, con muchos países, como España, Francia e Italia.', 'It is a small continent with many countries, like Spain, France and Italy.'],
      af: ['Allí están el desierto del Sahara y el río Nilo.', 'The Sahara Desert and the Nile River are there.'],
      na: ['Allí están Canadá, Estados Unidos y México.', 'Canada, the United States and Mexico are there.'],
      sa: ['Allí está Chile, junto con Argentina, Brasil, Perú y otros países.', 'Chile is there, with Argentina, Brazil, Peru and other countries.'],
      oc: ['Australia es la parte más grande de Oceanía; también hay miles de islas.', 'Australia is the biggest part of Oceania; there are thousands of islands too.']
    };
    Object.keys(CONT_TIERS).forEach(function (t) {
      CONT_TIERS[t].forEach(function (id) {
        var wrong = others(ids, id, 3);
        var o = [id].concat(wrong);
        rows.push(['ge-cont-' + id, +t, 'map', '¿Dónde está ' + CONT[id][0] + '? Toca su letra.', 'Where is ' + CONT[id][1] + '? Tap its letter.',
          o.map(function (x) { return CONT[x]; }), FACT[id][0], FACT[id][1], { map: 'cont', o: o }]);
      });
    });
    return rows;
  }

  // ── Which continent? and money ──────────────────────────────────
  function continentOf(A, WM) {
    if (!WM) return [];
    var rows = [];
    [['jpn', 2], ['egy', 2], ['fra', 2], ['aus', 2], ['can', 2], ['ind', 3], ['ken', 3], ['col', 3], ['nzl', 3], ['swe', 3], ['cub', 3],
     ['tha', 3], ['mar', 3], ['phl', 4], ['pol', 4], ['nga', 4], ['ecu', 4], ['vnm', 4]].forEach(function (p) {
      var c = A[p[0]], cont = WM.continentOf(p[0]);
      if (!c || !CONT[cont]) return;
      var wrong = others(['as', 'eu', 'af', 'na', 'sa', 'oc'], cont, 3);
      rows.push(['ge-in-' + p[0], p[1], 'mc', '¿En qué continente está ' + esName(c) + '?', 'Which continent is ' + (p[0] === 'phl' ? 'the Philippines' : c.name) + ' in?',
        [CONT[cont]].concat(wrong.map(function (x) { return CONT[x]; })),
        capSentence(c)[0], capSentence(c)[1], { s: 'World Atlas' }]);
    });
    var names = MONEY.map(function (m) { return A[m[0]]; }).filter(Boolean);
    MONEY.forEach(function (m) {
      var c = A[m[0]];
      if (!c) return;
      var wrong = names.filter(function (x) { return x.currencyNameEs !== c.currencyNameEs; });
      var k = (m[0].charCodeAt(1) + m[0].charCodeAt(2)) % wrong.length, pick = [];
      for (var i = 0; pick.length < 3 && i < wrong.length; i++) {
        var w = wrong[(k + i) % wrong.length];
        if (!pick.some(function (p) { return p.currencyNameEs === w.currencyNameEs; })) pick.push(w);
      }
      rows.push(['ge-money-' + m[0], m[1], 'mc', '¿Cómo se llama la moneda ' + deEs(c) + '?', 'What is the money of ' + (m[0] === 'usa' || m[0] === 'gbr' ? 'the ' : '') + c.name + ' called?',
        [[c.currencyNameEs, c.currencyName]].concat(pick.map(function (x) { return [x.currencyNameEs, x.currencyName]; })),
        'Su símbolo es ' + c.currencySymbol + ' y su código, ' + c.currency + '.', 'Its symbol is ' + c.currencySymbol + ' and its code is ' + c.currency + '.', { s: 'World Atlas' }]);
    });
    return rows;
  }

  // ── Chile's regions ─────────────────────────────────────────────
  var ZONE = { norte: ['el Norte de Chile', 'northern Chile'], centro: ['la zona central de Chile', 'central Chile'],
               sur: ['el Sur de Chile', 'southern Chile'], patagonia: ['la Patagonia chilena', 'Chilean Patagonia'] };
  var REG_TIER = { RM: 3, VS: 3, MA: 3, AN: 3, LL: 3, BI: 3, CO: 3, AR: 3, AP: 3 };
  function regionName(r) {
    if (r.id === 'RM') return ['la Región Metropolitana', 'the Metropolitan Region'];
    var n = r.short || r.name;
    return ['la región de ' + n, 'the ' + n + ' region'];
  }
  function chileRegions() {
    var R = g('DC_REGIONS');
    if (!R || !R.length) return [];
    var rows = [], ids = R.map(function (r) { return r.id; });
    R.forEach(function (r, i) {
      var nm = regionName(r), tier = REG_TIER[r.id] || 4, z = ZONE[r.zone] || ['', ''];
      // Map: the region and three near it (two above, one below, or the
      // other way at the ends).
      var near = [];
      [-1, 1, -2, 2, -3, 3].forEach(function (d) { var j = i + d; if (near.length < 3 && j >= 0 && j < R.length) near.push(R[j]); });
      var o = [r].concat(near);
      rows.push(['cl-reg-' + r.id.toLowerCase(), tier, 'map', '¿Dónde está ' + nm[0] + '? Toca su letra.', 'Where is ' + nm[1] + '? Tap its letter.',
        o.map(function (x) { var n = regionName(x); return [capEs(n[0]), capEs(n[1])]; }),
        capEs(nm[0]) + ' está en ' + z[0] + ' y su capital es ' + r.capital + '.',
        capEs(nm[1]) + ' is in ' + z[1] + ' and its capital is ' + r.capital + '.',
        { map: 'chile', o: o.map(function (x) { return x.id; }), s: 'Descubre Chile' }]);
      // Capital of the region (Santiago is too easy to ask about).
      if (r.id === 'RM') return;
      var wrong = [];
      [3, -3, 5, -5, 7, -7, 2, -2].forEach(function (d) { var j = i + d; if (wrong.length < 3 && j >= 0 && j < R.length && R[j].capital !== r.capital) wrong.push(R[j].capital); });
      rows.push(['cl-cap-' + r.id.toLowerCase(), tier === 3 ? 3 : 4, 'mc', '¿Cuál es la capital de ' + nm[0] + '?', 'What is the capital of ' + nm[1] + '?',
        [r.capital].concat(wrong),
        r.capital + ' es la capital de ' + nm[0] + ', en ' + z[0] + '.',
        r.capital + ' is the capital of ' + nm[1] + ', in ' + z[1] + '.', { s: 'Descubre Chile' }]);
    });
    return rows;
  }

  // ── Name that tune (Little Maestro's songs) ─────────────────────
  // [title in lm-songs.js, subject, tier, es title, en title, fact es, fact en, group]
  var TUNES = [
    ['Happy Birthday to You', 'mu', 1, 'Cumpleaños feliz', 'Happy Birthday', 'La melodía viene de "Good Morning to All", una canción para niños publicada en 1893 por las hermanas Hill.', 'The tune comes from "Good Morning to All", a children’s song published in 1893 by the Hill sisters.', 'kids'],
    ['Old MacDonald Had a Farm', 'mu', 1, 'El viejo MacDonald', 'Old MacDonald', 'En cada estrofa aparece un animal nuevo con su sonido: ¡i-a-i-a-o!', 'Every verse brings a new animal and its sound: E-I-E-I-O!', 'kids'],
    ['Row, Row, Row Your Boat', 'mu', 2, 'Rema, rema tu barquito', 'Row, Row, Row Your Boat', 'Se canta en canon: cada grupo empieza un poco después que el anterior.', 'It is sung as a round: each group starts a little after the one before.', 'kids'],
    ['Frère Jacques', 'mu', 2, 'Martinillo (Frère Jacques)', 'Frère Jacques (Are You Sleeping?)', 'Es un canon francés. En español se canta "Martinillo, ¿dónde estás?".', 'It is a French round. In English it is sung as "Are you sleeping, Brother John?".', 'kids'],
    ['London Bridge', 'mu', 2, 'El puente de Londres', 'London Bridge', 'Habla del Puente de Londres, sobre el río Támesis. Los niños lo juegan haciendo un puente con los brazos.', 'It is about London Bridge, over the River Thames. Children play it by making a bridge with their arms.', 'kids'],
    ['Merrily We Roll Along', 'mu', 2, 'Merrily We Roll Along', 'Merrily We Roll Along', 'Usa solo tres notas: mi, re y do. Es una de las primeras canciones que se aprenden en el piano.', 'It uses just three notes: E, D and C. It is one of the first songs learned on the piano.', 'kids'],
    ['Ode to Joy (Hands Together)', 'mu', 2, 'Himno de la alegría', 'Ode to Joy', 'Es de la Novena Sinfonía de Beethoven y hoy es el himno de Europa.', 'It is from Beethoven’s Ninth Symphony and is now the anthem of Europe.', 'classic'],
    ['Für Elise (Opening)', 'mu', 3, 'Para Elisa', 'Für Elise', 'Beethoven la escribió hacia 1810, pero se publicó en 1867, cuarenta años después de su muerte.', 'Beethoven wrote it around 1810, but it was published in 1867, forty years after his death.', 'classic'],
    ['Can-Can', 'mu', 3, 'El cancán', 'The Can-Can', 'Es de la opereta "Orfeo en los infiernos", de Jacques Offenbach (1858).', 'It is from the operetta "Orpheus in the Underworld", by Jacques Offenbach (1858).', 'classic'],
    ['In the Hall of the Mountain King', 'mu', 4, 'En la gruta del rey de la montaña', 'In the Hall of the Mountain King', 'Es de Edvard Grieg, para la obra "Peer Gynt" (1876). Empieza suave y lenta y termina muy rápida y fuerte.', 'It is by Edvard Grieg, for the play "Peer Gynt" (1876). It starts soft and slow and ends very fast and loud.', 'classic'],
    ['Largo (New World Symphony)', 'mu', 4, 'Largo de la Sinfonía del Nuevo Mundo', 'Largo from the New World Symphony', 'Antonín Dvořák la compuso en 1893, cuando vivía en Estados Unidos.', 'Antonín Dvořák composed it in 1893, while he was living in the United States.', 'classic'],
    ['Lullaby (Wiegenlied)', 'mu', 3, 'Canción de cuna de Brahms', 'Brahms’ Lullaby', 'Johannes Brahms la escribió en 1868 para el bebé de una amiga.', 'Johannes Brahms wrote it in 1868 for a friend’s new baby.', 'classic'],
    ['Greensleeves', 'mu', 4, 'Greensleeves', 'Greensleeves', 'Es una melodía inglesa del siglo XVI. Con otra letra es el villancico "What Child Is This?".', 'It is an English tune from the 1500s. With other words it is the carol "What Child Is This?".', 'classic'],
    ['Minuet in G (Theme)', 'mu', 4, 'Minueto en sol', 'Minuet in G', 'Está en el cuaderno de Ana Magdalena Bach (1725); hoy se cree que lo compuso Christian Petzold.', 'It is in Anna Magdalena Bach’s notebook (1725); today it is thought to be by Christian Petzold.', 'classic'],
    ['Au Clair de la Lune', 'mu', 3, 'Au clair de la lune', 'Au Clair de la Lune', 'En 1860 se grabó a alguien cantándola: es una de las grabaciones de una voz más antiguas que existen.', 'In 1860 someone was recorded singing it: one of the oldest recordings of a voice that exist.', 'folk'],
    ['Alouette', 'mu', 3, 'Alouette', 'Alouette', 'Es una canción de Canadá, en francés. "Alouette" quiere decir alondra, un pájaro.', 'It is a French-Canadian song. "Alouette" means lark, a bird.', 'folk'],
    ['Yankee Doodle', 'mu', 3, 'Yankee Doodle', 'Yankee Doodle', 'Se cantaba en los tiempos de la independencia de Estados Unidos.', 'It was sung in the days of American independence.', 'folk'],
    ['Oh! Susanna', 'mu', 4, 'Oh! Susanna', 'Oh! Susanna', 'La escribió Stephen Foster en 1848.', 'Stephen Foster wrote it in 1848.', 'folk'],
    ['Amazing Grace', 'mu', 4, 'Sublime gracia (Amazing Grace)', 'Amazing Grace', 'La letra es de John Newton y se publicó en 1779.', 'The words are by John Newton and were published in 1779.', 'folk'],
    ['Korobeiniki (the "Tetris" song)', 'mu', 4, 'Korobéiniki (la música del Tetris)', 'Korobeiniki (the Tetris tune)', 'Es una canción popular rusa del siglo XIX, famosa desde los años 80 por el juego Tetris.', 'It is a Russian folk song from the 1800s, famous since the 1980s from the game Tetris.', 'folk'],
    ['Jingle Bells', 'nv', 1, 'Cascabel', 'Jingle Bells', 'Se publicó en 1857. En 1965 dos astronautas la tocaron en el espacio con una armónica.', 'It was published in 1857. In 1965 two astronauts played it in space on a harmonica.', 'carol'],
    ['We Wish You a Merry Christmas', 'nv', 2, 'Les deseamos feliz Navidad', 'We Wish You a Merry Christmas', 'Es un villancico tradicional inglés; en la letra piden un pudín de higos.', 'It is a traditional English carol; in the words they ask for figgy pudding.', 'carol'],
    ['Silent Night (Noche de Paz)', 'nv', 2, 'Noche de paz', 'Silent Night', 'Se cantó por primera vez en Nochebuena de 1818, en Oberndorf (Austria), con una guitarra.', 'It was first sung on Christmas Eve 1818 in Oberndorf (Austria), with a guitar.', 'carol'],
    ['Joy to the World', 'nv', 3, 'Al mundo paz', 'Joy to the World', 'La letra la escribió Isaac Watts en 1719, basándose en el Salmo 98.', 'Isaac Watts wrote the words in 1719, based on Psalm 98.', 'carol'],
    ['O Come, All Ye Faithful', 'nv', 3, 'Venid, fieles todos (Adeste Fideles)', 'O Come, All Ye Faithful', 'Se escribió en latín en el siglo XVIII: "Adeste fideles, laeti triumphantes".', 'It was written in Latin in the 1700s: "Adeste fideles, laeti triumphantes".', 'carol'],
    ['Away in a Manger', 'nv', 3, 'Allá en el pesebre', 'Away in a Manger', 'Se publicó en Estados Unidos a fines del siglo XIX y es uno de los villancicos favoritos de los niños.', 'It was published in the United States in the late 1800s and is one of children’s favourite carols.', 'carol'],
    ['Deck the Halls', 'nv', 3, 'Deck the Halls (Adornen la casa)', 'Deck the Halls', 'La melodía es una antigua canción galesa de Año Nuevo llamada "Nos Galan".', 'The tune is an old Welsh New Year’s song called "Nos Galan".', 'carol'],
    ['O Little Town of Bethlehem', 'nv', 4, 'Oh, pueblecito de Belén', 'O Little Town of Bethlehem', 'Phillips Brooks escribió la letra en 1868, después de visitar Belén en Nochebuena.', 'Phillips Brooks wrote the words in 1868, after visiting Bethlehem on Christmas Eve.', 'carol'],
    ['The First Noel', 'nv', 4, 'El primer Noel', 'The First Noel', '"Noel" viene de la palabra francesa para Navidad, "Noël".', '"Noel" comes from the French word for Christmas, "Noël".', 'carol'],
    ['We Three Kings', 'nv', 4, 'Somos los Reyes de Oriente (We Three Kings)', 'We Three Kings', 'John Henry Hopkins Jr. escribió la letra y la música en 1857.', 'John Henry Hopkins Jr. wrote both the words and the tune in 1857.', 'carol'],
    ['God Rest Ye Merry, Gentlemen', 'nv', 4, 'God Rest Ye Merry, Gentlemen', 'God Rest Ye Merry, Gentlemen', 'Aparece en el cuento "Canción de Navidad" de Charles Dickens (1843).', 'It appears in Charles Dickens’s "A Christmas Carol" (1843).', 'carol'],
    ['Good King Wenceslas', 'nv', 4, 'El buen rey Wenceslao', 'Good King Wenceslas', 'Cuenta de San Wenceslao, duque de Bohemia, que salió a ayudar a un pobre el 26 de diciembre.', 'It tells of Saint Wenceslaus, Duke of Bohemia, going out to help a poor man on December 26.', 'carol']
  ];
  function findSong(S, title) { for (var i = 0; i < S.length; i++) if (S[i].title === title) return S[i]; return null; }
  function tunes() {
    var S = g('LM_SONGS');
    if (!S) return [];
    var ok = TUNES.filter(function (t) { return findSong(S, t[0]); });
    var rows = [];
    ok.forEach(function (t, i) {
      // Wrong titles from the same kind of song (a carol with carols).
      var same = ok.filter(function (u) { return u !== t && (u[7] === t[7] || (t[7] !== 'carol' && u[7] !== 'carol')); });
      var start = i % Math.max(1, same.length), wrong = [];
      for (var k = 0; wrong.length < 3 && k < same.length; k++) wrong.push(same[(start + k) % same.length]);
      var id = t[1] + '-tune-' + t[0].toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14);
      rows.push([id, t[2], 'snd', '¿Qué canción es esta? Escucha.', 'Which song is this? Listen.',
        [[t[3], t[4]]].concat(wrong.map(function (u) { return [u[3], u[4]]; })), t[5], t[6], { tune: t[0], s: 'Little Maestro' }]);
    });
    return rows;
  }

  // ── Counting, for the youngest ──────────────────────────────────
  var COUNT = [['apple', 3], ['star', 4], ['fish', 2], ['ladybug', 5], ['apple', 6], ['bell', 3], ['fish', 4], ['star', 7], ['ladybug', 2], ['bell', 5], ['apple', 8], ['fish', 6]];
  var COUNT_WORD = { apple: ['manzanas', 'apples'], star: ['estrellas', 'stars'], fish: ['peces', 'fish'], ladybug: ['chinitas', 'ladybugs'], bell: ['campanas', 'bells'] };
  var NUM_ES = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  var NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function counting() {
    return COUNT.map(function (c, i) {
      var n = c[1], w = COUNT_WORD[c[0]];
      var wrong = [n + 1, n - 1 > 0 ? n - 1 : n + 2, n + 2 === n + 1 ? n + 3 : (n - 1 > 0 ? n + 2 : n + 3)];
      var masc = c[0] === 'fish';
      return ['ma-count-' + (i + 1), 1, 'pic', '¿Cuánt' + (masc ? 'os ' : 'as ') + w[0] + ' hay?', 'How many ' + w[1] + ' are there?',
        [String(n)].concat(wrong.map(String)),
        'Hay ' + NUM_ES[n] + ' ' + w[0] + '. ¡Cuénta' + (masc ? 'los' : 'las') + ' con el dedo!', 'There are ' + NUM_EN[n] + ' ' + w[1] + '. Count them with your finger!',
        { art: 'count:' + c[0] + ':' + n }];
    });
  }

  function rows() {
    var A = atlas(), WM = g('WorldMap'), out = [];
    if (A) out = out.concat(capitals(A, WM), flags(A, WM), mapCountries(A, WM), continentOf(A, WM));
    out = out.concat(continents(WM), chileRegions(), tunes(), counting());
    return out;
  }

  return { rows: rows, TUNES: TUNES, CONT: CONT, popPair: popPair, findSong: findSong };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TriviaGen;
