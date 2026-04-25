/* ================================================================
   WORLD EXPLORER — extras: currencies + national anthems (#171 v1)
   Renders into the country card via openCountry(). Loaded after
   world-explorer.js so it can hook into WorldExplorer.

   Trace-the-borders is intentionally deferred to a follow-up — it
   needs hand-authored SVG paths per country to be useful.
   ================================================================ */

var WorldExplorerExtras = (function() {
  'use strict';

  // Currencies — symbol + ISO code + readable name + a sample bill
  // denomination kids will encounter. Keep it factual and stable.
  var CURRENCIES = {
    chile:     { code: 'CLP', symbol: '$',   name: 'Chilean peso',     sample: '$10.000' },
    argentina: { code: 'ARS', symbol: '$',   name: 'Argentine peso',   sample: '$1.000' },
    brazil:    { code: 'BRL', symbol: 'R$',  name: 'Brazilian real',   sample: 'R$50' },
    peru:      { code: 'PEN', symbol: 'S/',  name: 'Peruvian sol',     sample: 'S/100' },
    colombia:  { code: 'COP', symbol: '$',   name: 'Colombian peso',   sample: '$20.000' },
    venezuela: { code: 'VES', symbol: 'Bs.', name: 'Venezuelan bolívar', sample: 'Bs. 100' },
    ecuador:   { code: 'USD', symbol: '$',   name: 'US dollar (since 2000)', sample: '$20' },
    bolivia:   { code: 'BOB', symbol: 'Bs',  name: 'Bolivian boliviano', sample: 'Bs 100' },
    paraguay:  { code: 'PYG', symbol: '₲',   name: 'Paraguayan guaraní', sample: '₲50.000' },
    uruguay:   { code: 'UYU', symbol: '$U',  name: 'Uruguayan peso',   sample: '$U 500' },
    guyana:    { code: 'GYD', symbol: '$',   name: 'Guyanese dollar',  sample: '$1.000' },
    suriname:  { code: 'SRD', symbol: '$',   name: 'Surinamese dollar', sample: '$50' },
    canada:    { code: 'CAD', symbol: '$',   name: 'Canadian dollar',  sample: '$20' },
    mexico:    { code: 'MXN', symbol: '$',   name: 'Mexican peso',     sample: '$200' },
    france:    { code: 'EUR', symbol: '€',   name: 'Euro',             sample: '€20' },
    egypt:     { code: 'EGP', symbol: 'E£',  name: 'Egyptian pound',   sample: 'E£100' },
    japan:     { code: 'JPY', symbol: '¥',   name: 'Japanese yen',     sample: '¥1.000' },
    china:     { code: 'CNY', symbol: '¥',   name: 'Chinese yuan',     sample: '¥100' },
    australia: { code: 'AUD', symbol: '$',   name: 'Australian dollar', sample: '$20' }
  };

  // National anthems — title, composer, lyricist, year adopted, and
  // a famous opening line (no audio bundled for v1; this is text only).
  // All adoption years are when the work officially became the anthem.
  var ANTHEMS = {
    chile: {
      title: 'Himno Nacional de Chile',
      composer: 'Ramón Carnicer',
      lyricist: 'Eusebio Lillo',
      year: 1828,
      openingEs: '"Puro, Chile, es tu cielo azulado…"',
      openingEn: '"Pure, Chile, is your blue sky…"'
    },
    argentina: {
      title: 'Himno Nacional Argentino',
      composer: 'Blas Parera',
      lyricist: 'Vicente López y Planes',
      year: 1813,
      openingEs: '"¡Oíd, mortales, el grito sagrado: libertad, libertad, libertad!"',
      openingEn: '"Hear, mortals, the sacred cry: freedom, freedom, freedom!"'
    },
    brazil: {
      title: 'Hino Nacional Brasileiro',
      composer: 'Francisco Manuel da Silva',
      lyricist: 'Joaquim Osório Duque-Estrada',
      year: 1922,
      openingEs: '"Ouviram do Ipiranga as margens plácidas…" (en portugués)',
      openingEn: '"They heard from the Ipiranga\'s placid banks…" (in Portuguese)'
    },
    peru: {
      title: 'Himno Nacional del Perú',
      composer: 'José Bernardo Alcedo',
      lyricist: 'José de la Torre Ugarte',
      year: 1821,
      openingEs: '"Somos libres, seámoslo siempre…"',
      openingEn: '"We are free, let us always be so…"'
    },
    colombia: {
      title: 'Himno Nacional de la República de Colombia',
      composer: 'Oreste Síndici',
      lyricist: 'Rafael Núñez',
      year: 1920,
      openingEs: '"¡Oh gloria inmarcesible, oh júbilo inmortal!"',
      openingEn: '"Oh unfading glory, oh immortal joy!"'
    },
    venezuela: {
      title: 'Gloria al Bravo Pueblo',
      composer: 'Juan José Landaeta',
      lyricist: 'Vicente Salias',
      year: 1881,
      openingEs: '"Gloria al bravo pueblo que el yugo lanzó…"',
      openingEn: '"Glory to the brave people who threw off the yoke…"'
    },
    ecuador: {
      title: 'Salve, Oh Patria',
      composer: 'Antonio Neumane',
      lyricist: 'Juan León Mera',
      year: 1948,
      openingEs: '"¡Salve, Oh Patria, mil veces! ¡Oh Patria, gloria a ti!"',
      openingEn: '"Hail, Oh Homeland, a thousand times! Glory to you!"'
    },
    bolivia: {
      title: 'Himno Nacional de Bolivia',
      composer: 'Leopoldo Benedetto Vincenti',
      lyricist: 'José Ignacio de Sanjinés',
      year: 1851,
      openingEs: '"Bolivianos: el hado propicio coronó nuestros votos y anhelo…"',
      openingEn: '"Bolivians: a favorable fate has crowned our vows and longing…"'
    },
    paraguay: {
      title: 'Paraguayos, República o Muerte',
      composer: 'Francisco José Debali',
      lyricist: 'Francisco Acuña de Figueroa',
      year: 1846,
      openingEs: '"Paraguayos, ¡República o Muerte!"',
      openingEn: '"Paraguayans: the Republic or Death!"'
    },
    uruguay: {
      title: 'Himno Nacional de Uruguay',
      composer: 'Francisco José Debali',
      lyricist: 'Francisco Acuña de Figueroa',
      year: 1848,
      openingEs: '"¡Orientales, la patria o la tumba! ¡Libertad o con gloria morir!"',
      openingEn: '"Easterners, the homeland or the grave! Freedom or to die with glory!"'
    },
    guyana: {
      title: 'Dear Land of Guyana, of Rivers and Plains',
      composer: 'Robert Cyril Gladstone Potter',
      lyricist: 'Archibald Leonard Luker',
      year: 1966,
      openingEs: '"Querida tierra de Guyana, de ríos y llanuras…"',
      openingEn: '"Dear Land of Guyana, of rivers and plains…"'
    },
    suriname: {
      title: 'God zij met ons Suriname',
      composer: 'Johannes Corstianus de Puy',
      lyricist: 'Cornelis Atses Hoekstra & Henry de Ziel',
      year: 1959,
      openingEs: '"God zij met ons Suriname…" (en holandés)',
      openingEn: '"God be with our Suriname…" (in Dutch)'
    },
    canada: {
      title: 'O Canada',
      composer: 'Calixa Lavallée',
      lyricist: 'Adolphe-Basile Routhier (FR), Robert Stanley Weir (EN)',
      year: 1980,
      openingEs: '"O Canada, hogar de nuestros antepasados…"',
      openingEn: '"O Canada! Our home and native land!"'
    },
    mexico: {
      title: 'Himno Nacional Mexicano',
      composer: 'Jaime Nunó',
      lyricist: 'Francisco González Bocanegra',
      year: 1854,
      openingEs: '"Mexicanos, al grito de guerra…"',
      openingEn: '"Mexicans, at the cry of war…"'
    },
    france: {
      title: 'La Marseillaise',
      composer: 'Claude Joseph Rouget de Lisle',
      lyricist: 'Claude Joseph Rouget de Lisle',
      year: 1795,
      openingEs: '"Allons enfants de la Patrie…" (¡Vamos, hijos de la Patria!)',
      openingEn: '"Allons enfants de la Patrie…" (Let us go, children of the Fatherland!)'
    },
    egypt: {
      title: 'Bilady, Bilady, Bilady',
      composer: 'Sayed Darwish',
      lyricist: 'Mohamed Younis al-Qady',
      year: 1979,
      openingEs: '"Mi patria, mi patria, mi patria, tienes mi amor y mi corazón."',
      openingEn: '"My homeland, my homeland, my homeland, you have my love and my heart."'
    },
    japan: {
      title: 'Kimigayo (君が代)',
      composer: 'Hayashi Hiromori, arr. Franz Eckert',
      lyricist: 'Anonymous (Heian-era waka poem)',
      year: 1999,
      openingEs: '"Kimigayo wa…" — "Que el reinado del soberano dure mil generaciones."',
      openingEn: '"Kimigayo wa…" — "May your reign continue for a thousand generations."'
    },
    china: {
      title: 'March of the Volunteers (义勇军进行曲)',
      composer: 'Nie Er',
      lyricist: 'Tian Han',
      year: 1949,
      openingEs: '"¡Levantaos, los que no queréis ser esclavos!"',
      openingEn: '"Arise, those who refuse to be slaves!"'
    },
    australia: {
      title: 'Advance Australia Fair',
      composer: 'Peter Dodds McCormick',
      lyricist: 'Peter Dodds McCormick',
      year: 1984,
      openingEs: '"Australians all let us rejoice…" (¡Australianos, alegrémonos todos!)',
      openingEn: '"Australians all let us rejoice, for we are one and free."'
    }
  };

  function getCurrency(countryId) { return CURRENCIES[countryId] || null; }
  function getAnthem(countryId)   { return ANTHEMS[countryId] || null; }

  // Render the extras block for the country detail card. Returns
  // safe HTML or empty string if no data exists for this country.
  function renderExtras(countryId, lang) {
    var c = getCurrency(countryId);
    var a = getAnthem(countryId);
    if (!c && !a) return '';

    var es = lang === 'es';
    var html = '<div class="we-extras">';

    if (c) {
      html += '<div class="we-extra-card we-currency">' +
        '<div class="we-extra-head">' +
          '<span class="we-extra-icon">💵</span>' +
          '<div class="we-extra-title">' + (es ? 'Moneda' : 'Currency') + '</div>' +
        '</div>' +
        '<div class="we-currency-body">' +
          '<span class="we-currency-symbol">' + _esc(c.symbol) + '</span>' +
          '<div>' +
            '<div class="we-currency-name">' + _esc(c.name) + ' (' + _esc(c.code) + ')</div>' +
            '<div class="we-currency-sample">' + (es ? 'Billete típico:' : 'Common bill:') + ' ' + _esc(c.sample) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    if (a) {
      var opening = es ? a.openingEs : a.openingEn;
      html += '<div class="we-extra-card we-anthem">' +
        '<div class="we-extra-head">' +
          '<span class="we-extra-icon">🎵</span>' +
          '<div class="we-extra-title">' + (es ? 'Himno Nacional' : 'National Anthem') + '</div>' +
        '</div>' +
        '<div class="we-anthem-name">' + _esc(a.title) + '</div>' +
        '<div class="we-anthem-meta">' +
          (es ? 'Música: ' : 'Music: ') + _esc(a.composer) +
          ' · ' + (es ? 'Letra: ' : 'Lyrics: ') + _esc(a.lyricist) +
          ' · ' + a.year +
        '</div>' +
        '<div class="we-anthem-opening">' + _esc(opening) + '</div>' +
      '</div>';
    }

    html += '</div>';
    return html;
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    getCurrency: getCurrency,
    getAnthem: getAnthem,
    renderExtras: renderExtras
  };
})();
