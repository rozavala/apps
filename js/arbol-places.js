/* ================================================================
   ÁRBOL FAMILIAR — place names to countries (js/arbol-places.js)

   A GEDCOM place is free text: "Santiago, Región Metropolitana, Chile",
   "Springfield, Example County, Illinois, USA", "Prusia". The family map
   needs a country, and this module finds it with no network: the last
   part of the name, matched against the 195 countries of
   js/world-atlas-data.js (English and Spanish names) plus a short list of
   old and informal names (Prussia, England, Holland...) and the US states.

   ArbolPlaces.country(place)            -> 'chl' | null  (WorldMap / atlas ids)
   ArbolPlaces.name(code, lang)          -> 'Chile'
   ArbolPlaces.setCountries(list)        (tests, or when the atlas script is not loaded)
   ================================================================ */
(function(root) {
  'use strict';

  var table = null;

  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  var ALIASES = {
    usa: 'usa', us: 'usa', 'u s a': 'usa', 'u s': 'usa', 'united states of america': 'usa', america: 'usa', eeuu: 'usa', 'ee uu': 'usa', 'estados unidos de america': 'usa',
    uk: 'gbr', 'u k': 'gbr', england: 'gbr', scotland: 'gbr', wales: 'gbr', 'northern ireland': 'gbr', 'great britain': 'gbr', britain: 'gbr',
    inglaterra: 'gbr', escocia: 'gbr', gales: 'gbr', 'irlanda del norte': 'gbr', 'gran bretana': 'gbr',
    holland: 'nld', netherlands: 'nld', 'the netherlands': 'nld', 'paises bajos': 'nld', holanda: 'nld',
    'republic of ireland': 'irl', eire: 'irl',
    russia: 'rus', 'russian empire': 'rus', 'soviet union': 'rus', ussr: 'rus', urss: 'rus', 'imperio ruso': 'rus', 'union sovietica': 'rus',
    prussia: 'deu', prusia: 'deu', bavaria: 'deu', baviera: 'deu', saxony: 'deu', sajonia: 'deu', westphalia: 'deu', westfalia: 'deu', deutschland: 'deu', germany: 'deu',
    bohemia: 'cze', moravia: 'cze', 'czech republic': 'cze', 'republica checa': 'cze',
    'ottoman empire': 'tur', 'imperio otomano': 'tur', turkey: 'tur', turquia: 'tur', turkiye: 'tur',
    castile: 'esp', castilla: 'esp', catalonia: 'esp', cataluna: 'esp', 'basque country': 'esp', 'pais vasco': 'esp', andalusia: 'esp', andalucia: 'esp', galicia: 'esp', navarra: 'esp', aragon: 'esp', asturias: 'esp', spain: 'esp',
    sicily: 'ita', sicilia: 'ita', lombardy: 'ita', lombardia: 'ita', tuscany: 'ita', toscana: 'ita', piedmont: 'ita', piamonte: 'ita', liguria: 'ita', veneto: 'ita', italy: 'ita',
    brittany: 'fra', bretana: 'fra', normandy: 'fra', normandia: 'fra', alsace: 'fra', alsacia: 'fra', provence: 'fra', provenza: 'fra',
    'south korea': 'kor', 'republic of korea': 'kor', 'north korea': 'prk',
    ontario: 'can', quebec: 'can', 'british columbia': 'can', alberta: 'can', manitoba: 'can', 'nova scotia': 'can', 'new brunswick': 'can', saskatchewan: 'can',
    'new south wales': 'aus', queensland: 'aus', tasmania: 'aus',
    'nueva york': 'usa', 'new york': 'usa'
  };

  var US_NAMES = ['new hampshire', 'new jersey', 'new mexico', 'north dakota', 'south dakota', 'north carolina', 'south carolina', 'rhode island',
    'west virginia', 'new york', 'district of columbia', 'florida', 'texas', 'california', 'nevada', 'utah', 'ohio', 'iowa', 'maine', 'idaho', 'alaska',
    'hawaii', 'alabama', 'arizona', 'arkansas', 'colorado', 'connecticut', 'delaware', 'georgia', 'illinois', 'indiana', 'kansas', 'kentucky', 'louisiana',
    'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'oklahoma', 'oregon', 'pennsylvania',
    'tennessee', 'vermont', 'virginia', 'washington', 'wisconsin', 'wyoming'];
  var US_ABBR = 'al ak az ar ca co ct de fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy dc'.split(' ');

  function build(list) {
    var t = { byName: {}, byId: {} };
    (list || []).forEach(function(c) {
      t.byId[c.id] = c;
      [c.name, c.nameEs, c.iso2].forEach(function(n) { if (n) t.byName[norm(n)] = c.id; });
    });
    // a few common short forms
    t.byName['congo'] = t.byName['congo'] || 'cog';
    return t;
  }
  function T() {
    if (!table) table = build(typeof WORLD_ATLAS_DATA !== 'undefined' ? WORLD_ATLAS_DATA : []);
    return table;
  }
  function setCountries(list) { table = build(list); }

  function lookup(token) {
    var n = norm(token), t = T();
    if (!n) return null;
    if (ALIASES[n]) return ALIASES[n];
    // two-letter codes are only trusted when written in capitals ("CL", "CA" is a US state)
    if (n.length === 2) return null;
    if (t.byName[n]) return t.byName[n];
    return null;
  }

  // The country of a place string, or null
  function country(place) {
    var raw = String(place || '').trim();
    if (!raw) return null;
    var parts = raw.split(/\s*,\s*/).filter(Boolean), last = parts[parts.length - 1] || '', n = norm(last), prev, words, id;
    if (n === 'georgia' && parts.length > 1) return 'usa';      // Atlanta, Georgia (the state, far likelier in a family tree)
    id = lookup(last);
    if (id) return id;
    // "Santiago de Chile", "Lima Peru": the last word or the last two
    words = n.split(' ');
    if (words.length > 1) {
      id = lookup(words.slice(-2).join(' ')) || lookup(words[words.length - 1]);
      if (id) return id;
    }
    // a US state, written out or as the two letters ("Austin, TX")
    if (US_NAMES.indexOf(n) >= 0) return 'usa';
    if (/^[A-Z]{2}$/.test(last.trim()) && US_ABBR.indexOf(last.trim().toLowerCase()) >= 0 && parts.length > 1) return 'usa';
    // "Paris, Francia, Europa": look one part back
    if (parts.length > 1) {
      prev = parts[parts.length - 2];
      id = lookup(prev);
      if (id && /^(europa|europe|asia|africa|america|oceania|south america|north america|sudamerica)$/.test(n)) return id;
    }
    // a bare two-letter ISO code in capitals
    if (/^[A-Z]{2}$/.test(last.trim())) {
      var c, up = last.trim();
      for (c in T().byId) if (T().byId[c].iso2 === up) return c;
    }
    return null;
  }

  function name(code, lang) {
    var c = T().byId[code];
    if (!c) return '';
    return lang === 'es' ? (c.nameEs || c.name) : c.name;
  }

  var api = { country: country, name: name, setCountries: setCountries, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArbolPlaces = api;
})(typeof window !== 'undefined' ? window : this);
