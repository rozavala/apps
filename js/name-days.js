/* ================================================================
   NAME DAYS — js/name-days.js  (global `NameDays`)
   "Día del santo": first names and nicknames → the saint in
   Fe Explorador (js/fe-explorador.js SAINTS) and the day the Church
   celebrates them in Chile. Used by Fe Explorador's "Mi santo" card
   and the hub banner. Tiny, dependency-free, ES5.

   NameDays.forName('Rorro')      → { saintId, saint, month, day } | null
   NameDays.forSaint('isabel')    → same shape, by saint id   | null
   NameDays.isToday(entry, date?) → true on the feast day (local date)
   NameDays.label(entry)          → "13 de marzo"
   Keep SAINTS in step with the feast fields in js/fe-explorador.js.
   ================================================================ */

var NameDays = (function () {
  'use strict';

  // saint id → [display name, month (1-12), day]
  var SAINTS = {
    benito: ['San Benito de Nursia', 7, 11],
    francisco: ['San Francisco de Asís', 10, 4],
    teresa_andes: ['Santa Teresa de los Andes', 7, 13],
    alberto_hurtado: ['San Alberto Hurtado', 8, 18],
    rosa_lima: ['Santa Rosa de Lima', 8, 30],
    martin_porres: ['San Martín de Porres', 11, 3],
    ignacio_loyola: ['San Ignacio de Loyola', 7, 31],
    teresa_avila: ['Santa Teresa de Ávila', 10, 15],
    juan_bosco: ['San Juan Bosco', 1, 31],
    jose: ['San José', 3, 19],
    juan_dios: ['San Juan de Dios', 3, 8],
    pablo: ['San Pablo', 6, 29],
    pedro: ['San Pedro', 6, 29],
    juan_cruz: ['San Juan de la Cruz', 12, 14],
    tomas_aquino: ['Santo Tomás de Aquino', 1, 28],
    agustin: ['San Agustín de Hipona', 8, 28],
    catalina_siena: ['Santa Catalina de Siena', 4, 29],
    jorge: ['San Jorge', 4, 23],
    ambrosio: ['San Ambrosio de Milán', 12, 7],
    monica: ['Santa Mónica', 8, 27],
    emilia: ['Santa Emilia', 5, 30],
    rodrigo: ['San Rodrigo de Córdoba', 3, 13],
    isabel: ['Santa Isabel', 11, 5],
    santiago: ['Santiago Apóstol', 7, 25],
    francisco_javier: ['San Francisco Javier', 12, 3],
    clara: ['Santa Clara de Asís', 8, 11],
    laura_vicuna: ['Beata Laura Vicuña', 1, 22],
    nicolas: ['San Nicolás de Bari', 12, 6],
    bernardita: ['Santa Bernardita Soubirous', 4, 16],
    juan_pablo: ['San Juan Pablo II', 10, 22],
    teresa_lisieux: ['Santa Teresa de Lisieux', 10, 1]
  };

  // normalised name (lower case, no accents) → saint id
  var NAMES = {
    // the family
    'emilia': 'emilia', 'emi': 'emilia',
    'ignacio': 'ignacio_loyola', 'nacho': 'ignacio_loyola', 'ignacia': 'ignacio_loyola',
    'pablo': 'pablo', 'pablito': 'pablo',
    'rodrigo': 'rodrigo', 'rorro': 'rodrigo', 'rodri': 'rodrigo',
    'rodrigo jr': 'rodrigo', 'rodrigo junior': 'rodrigo',
    'isabel': 'isabel', 'isa': 'isabel', 'isabela': 'isabel', 'isabella': 'isabel', 'isabelita': 'isabel',
    // other saints in Fe Explorador
    'santiago': 'santiago', 'santi': 'santiago',
    'francisco': 'francisco', 'pancho': 'francisco', 'panchito': 'francisco',
    'francisco javier': 'francisco_javier', 'javier': 'francisco_javier', 'javiera': 'francisco_javier',
    'clara': 'clara', 'clarita': 'clara',
    'laura': 'laura_vicuna',
    'nicolas': 'nicolas', 'nico': 'nicolas',
    'bernardita': 'bernardita', 'bernarda': 'bernardita',
    'juan pablo': 'juan_pablo',
    'teresa': 'teresa_avila', 'teresita': 'teresa_lisieux',
    'jose': 'jose', 'pepe': 'jose', 'josefa': 'jose',
    'pedro': 'pedro',
    'martin': 'martin_porres',
    'rosa': 'rosa_lima', 'rosita': 'rosa_lima',
    'catalina': 'catalina_siena', 'cata': 'catalina_siena',
    'monica': 'monica',
    'agustin': 'agustin', 'agustina': 'agustin',
    'tomas': 'tomas_aquino',
    'benito': 'benito',
    'jorge': 'jorge',
    'ambrosio': 'ambrosio',
    'alberto': 'alberto_hurtado'
  };

  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function forSaint(id) {
    var s = Object.prototype.hasOwnProperty.call(SAINTS, id) ? SAINTS[id] : null;
    return s ? { saintId: id, saint: s[0], month: s[1], day: s[2] } : null;
  }

  // Full name first ("juan pablo", "rodrigo jr"), then the first two
  // words, then the first word.
  function forName(name) {
    var n = norm(name);
    if (!n) return null;
    var w = n.split(' ');
    var tries = [n, w.slice(0, 2).join(' '), w[0]];
    for (var i = 0; i < tries.length; i++) {
      if (Object.prototype.hasOwnProperty.call(NAMES, tries[i])) return forSaint(NAMES[tries[i]]);
    }
    return null;
  }

  function isToday(entry, date) {
    if (!entry) return false;
    var d = date && typeof date.getMonth === 'function' ? date : new Date();
    return d.getMonth() + 1 === entry.month && d.getDate() === entry.day;
  }

  function label(entry) {
    return entry ? entry.day + ' de ' + MONTHS[entry.month - 1] : '';
  }

  return { forName: forName, forSaint: forSaint, isToday: isToday, label: label, _norm: norm };
})();
