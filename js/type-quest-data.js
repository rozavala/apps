/* ================================================================
   TYPE QUEST — data (js/type-quest-data.js)

   Pure data, no DOM, loadable by Node (tests, the progress catalog).

   Keys are named by their physical position (KeyboardEvent.code:
   KeyF, Semicolon, …), so one lesson works on any keyboard: the key
   under the right little finger is ";" on a US keyboard and "ñ" on a
   Latin-American one, and the lesson teaches whichever it is.

   LAYOUTS  the characters each key gives, with and without Shift,
            and how its keycap is drawn (row, width, ISO/ANSI shape)
   FINGERS  which finger presses each key (standard touch typing)
   LESSONS  the ordered ladder of key lessons
   WORDS    everyday words in Spanish and English, short to long
   ================================================================ */

var TypeQuestData = (function() {
  'use strict';

  // ── Fingers ──────────────────────────────────────────────────────
  // l/r = left/right hand; p r m i = pinky, ring, middle, index; th = thumbs
  var FINGERS = [
    { id: 'lp', hand: 'l', es: 'meñique izquierdo', en: 'left little finger',  color: '#F9A8D4', ink: '#9D174D' },
    { id: 'lr', hand: 'l', es: 'anular izquierdo',  en: 'left ring finger',    color: '#FDBA74', ink: '#9A3412' },
    { id: 'lm', hand: 'l', es: 'medio izquierdo',   en: 'left middle finger',  color: '#FDE047', ink: '#854D0E' },
    { id: 'li', hand: 'l', es: 'índice izquierdo',  en: 'left pointer finger', color: '#86EFAC', ink: '#166534' },
    { id: 'ri', hand: 'r', es: 'índice derecho',    en: 'right pointer finger', color: '#7DD3FC', ink: '#075985' },
    { id: 'rm', hand: 'r', es: 'medio derecho',     en: 'right middle finger', color: '#A5B4FC', ink: '#3730A3' },
    { id: 'rr', hand: 'r', es: 'anular derecho',    en: 'right ring finger',   color: '#D8B4FE', ink: '#6B21A8' },
    { id: 'rp', hand: 'r', es: 'meñique derecho',   en: 'right little finger', color: '#FCA5A5', ink: '#991B1B' },
    { id: 'th', hand: 'b', es: 'pulgar',            en: 'thumb',               color: '#E5E7EB', ink: '#374151' }
  ];

  var FINGER_OF = {
    Backquote: 'lp', Digit1: 'lp', Digit2: 'lr', Digit3: 'lm', Digit4: 'li', Digit5: 'li', Digit6: 'li',
    Digit7: 'ri', Digit8: 'rm', Digit9: 'rr', Digit0: 'rp', Minus: 'rp', Equal: 'rp', Backspace: 'rp',
    Tab: 'lp', KeyQ: 'lp', KeyW: 'lr', KeyE: 'lm', KeyR: 'li', KeyT: 'li',
    KeyY: 'ri', KeyU: 'ri', KeyI: 'rm', KeyO: 'rr', KeyP: 'rp', BracketLeft: 'rp', BracketRight: 'rp', Backslash: 'rp',
    CapsLock: 'lp', KeyA: 'lp', KeyS: 'lr', KeyD: 'lm', KeyF: 'li', KeyG: 'li',
    KeyH: 'ri', KeyJ: 'ri', KeyK: 'rm', KeyL: 'rr', Semicolon: 'rp', Quote: 'rp', Enter: 'rp',
    ShiftLeft: 'lp', IntlBackslash: 'lp', KeyZ: 'lp', KeyX: 'lr', KeyC: 'lm', KeyV: 'li', KeyB: 'li',
    KeyN: 'ri', KeyM: 'ri', Comma: 'rm', Period: 'rr', Slash: 'rp', ShiftRight: 'rp',
    Space: 'th', AltLeft: 'lp', AltRight: 'rp'
  };

  // The eight keys the fingers rest on, left little finger to right.
  var HOME = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

  // ── Layouts ──────────────────────────────────────────────────────
  // Each row: [code, base, shifted, width-in-key-units]. A missing
  // base means a control key (label instead). `dead` marks the accent
  // key that waits for the next letter.
  function row() { return Array.prototype.slice.call(arguments); }

  var US_ROWS = [
    row(['Backquote', '`', '~'], ['Digit1', '1', '!'], ['Digit2', '2', '@'], ['Digit3', '3', '#'], ['Digit4', '4', '$'],
        ['Digit5', '5', '%'], ['Digit6', '6', '^'], ['Digit7', '7', '&'], ['Digit8', '8', '*'], ['Digit9', '9', '('],
        ['Digit0', '0', ')'], ['Minus', '-', '_'], ['Equal', '=', '+'], ['Backspace', null, null, 2]),
    row(['Tab', null, null, 1.5], ['KeyQ', 'q', 'Q'], ['KeyW', 'w', 'W'], ['KeyE', 'e', 'E'], ['KeyR', 'r', 'R'], ['KeyT', 't', 'T'],
        ['KeyY', 'y', 'Y'], ['KeyU', 'u', 'U'], ['KeyI', 'i', 'I'], ['KeyO', 'o', 'O'], ['KeyP', 'p', 'P'],
        ['BracketLeft', '[', '{'], ['BracketRight', ']', '}'], ['Backslash', '\\', '|', 1.5]),
    row(['CapsLock', null, null, 1.75], ['KeyA', 'a', 'A'], ['KeyS', 's', 'S'], ['KeyD', 'd', 'D'], ['KeyF', 'f', 'F'], ['KeyG', 'g', 'G'],
        ['KeyH', 'h', 'H'], ['KeyJ', 'j', 'J'], ['KeyK', 'k', 'K'], ['KeyL', 'l', 'L'], ['Semicolon', ';', ':'],
        ['Quote', '\'', '"'], ['Enter', null, null, 2.25]),
    row(['ShiftLeft', null, null, 2.25], ['KeyZ', 'z', 'Z'], ['KeyX', 'x', 'X'], ['KeyC', 'c', 'C'], ['KeyV', 'v', 'V'], ['KeyB', 'b', 'B'],
        ['KeyN', 'n', 'N'], ['KeyM', 'm', 'M'], ['Comma', ',', '<'], ['Period', '.', '>'], ['Slash', '/', '?'],
        ['ShiftRight', null, null, 2.75]),
    row(['ControlLeft', null, null, 1.5], ['AltLeft', null, null, 1.5], ['MetaLeft', null, null, 1.5], ['Space', ' ', ' ', 6],
        ['MetaRight', null, null, 1.5], ['AltRight', null, null, 1.5], ['ControlRight', null, null, 1.5])
  ];

  // Latin-American Spanish (the layout sold in Chile): ñ on the home
  // row, the accent key ´ next to P, ¿ ¡ after 0, an extra < key by Z
  // and the tall ISO Enter.
  var LATAM_ROWS = [
    row(['Backquote', '|', '°'], ['Digit1', '1', '!'], ['Digit2', '2', '"'], ['Digit3', '3', '#'], ['Digit4', '4', '$'],
        ['Digit5', '5', '%'], ['Digit6', '6', '&'], ['Digit7', '7', '/'], ['Digit8', '8', '('], ['Digit9', '9', ')'],
        ['Digit0', '0', '='], ['Minus', '\'', '?'], ['Equal', '¿', '¡'], ['Backspace', null, null, 2]),
    row(['Tab', null, null, 1.5], ['KeyQ', 'q', 'Q'], ['KeyW', 'w', 'W'], ['KeyE', 'e', 'E'], ['KeyR', 'r', 'R'], ['KeyT', 't', 'T'],
        ['KeyY', 'y', 'Y'], ['KeyU', 'u', 'U'], ['KeyI', 'i', 'I'], ['KeyO', 'o', 'O'], ['KeyP', 'p', 'P'],
        ['BracketLeft', '´', '¨', 1, true], ['BracketRight', '+', '*'], ['Enter', null, null, 1.5]),
    row(['CapsLock', null, null, 1.75], ['KeyA', 'a', 'A'], ['KeyS', 's', 'S'], ['KeyD', 'd', 'D'], ['KeyF', 'f', 'F'], ['KeyG', 'g', 'G'],
        ['KeyH', 'h', 'H'], ['KeyJ', 'j', 'J'], ['KeyK', 'k', 'K'], ['KeyL', 'l', 'L'], ['Semicolon', 'ñ', 'Ñ'],
        ['Quote', '{', '['], ['Backslash', '}', ']'], ['EnterLow', null, null, 1.25]),
    row(['ShiftLeft', null, null, 1.25], ['IntlBackslash', '<', '>'], ['KeyZ', 'z', 'Z'], ['KeyX', 'x', 'X'], ['KeyC', 'c', 'C'], ['KeyV', 'v', 'V'], ['KeyB', 'b', 'B'],
        ['KeyN', 'n', 'N'], ['KeyM', 'm', 'M'], ['Comma', ',', ';'], ['Period', '.', ':'], ['Slash', '-', '_'],
        ['ShiftRight', null, null, 2.75]),
    row(['ControlLeft', null, null, 1.5], ['AltLeft', null, null, 1.5], ['MetaLeft', null, null, 1.5], ['Space', ' ', ' ', 6],
        ['MetaRight', null, null, 1.5], ['AltRight', null, null, 1.5], ['ControlRight', null, null, 1.5])
  ];

  var CONTROL_LABELS = {
    Backspace: ['borrar', 'delete'], Tab: ['tab', 'tab'], CapsLock: ['mayús', 'caps'], Enter: ['enter', 'return'],
    EnterLow: ['', ''], ShiftLeft: ['shift', 'shift'], ShiftRight: ['shift', 'shift'],
    ControlLeft: ['ctrl', 'ctrl'], ControlRight: ['ctrl', 'ctrl'], AltLeft: ['⌥', '⌥'], AltRight: ['⌥', '⌥'],
    MetaLeft: ['⌘', '⌘'], MetaRight: ['⌘', '⌘'], Space: ['', '']
  };

  function buildLayout(id, rows, names) {
    var keys = {}, byChar = {}, list = [];
    rows.forEach(function(r, ri) {
      var x = 0;
      r.forEach(function(k) {
        var w = k[3] || 1;
        var key = { code: k[0], base: k[1], shift: k[2], w: w, x: x, row: ri, dead: !!k[4], finger: FINGER_OF[k[0]] || null };
        x += w;
        keys[k[0]] = key;
        list.push(key);
        if (k[1] && !k[4] && !(k[1] in byChar)) byChar[k[1]] = { code: k[0], shift: false };
        if (k[2] && !k[4] && !(k[2] in byChar)) byChar[k[2]] = { code: k[0], shift: true };
      });
    });
    return { id: id, name: names, keys: keys, list: list, byChar: byChar, rows: rows.length };
  }

  var LAYOUTS = {
    us: buildLayout('us', US_ROWS, ['Inglés (EE. UU.)', 'US English']),
    latam: buildLayout('latam', LATAM_ROWS, ['Español (Latinoamérica)', 'Spanish (Latin America)'])
  };

  // Accented letters: on the Latin-American keyboard, the ´ key then the
  // vowel; on a US keyboard (iPad and Mac), Option+E then the vowel, and
  // Option+N then N for ñ.
  var ACCENTS = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'ñ': 'n', 'Ñ': 'N' };
  var US_EXTRA = { '¿': { code: 'Slash', shift: true, alt: true }, '¡': { code: 'Digit1', alt: true } };

  // The steps to type one character: [{code, shift, alt}], or null when
  // this keyboard has no way to type it.
  function stepsFor(ch, layoutId) {
    var L = LAYOUTS[layoutId] || LAYOUTS.us, hit = L.byChar[ch];
    if (hit) return [{ code: hit.code, shift: hit.shift }];
    if (ACCENTS[ch]) {
      var plain = ACCENTS[ch], p = L.byChar[plain];
      if (!p) return null;
      var isN = plain === 'n' || plain === 'N';
      if (layoutId === 'latam') return isN ? null : [{ code: 'BracketLeft', shift: false, dead: true }, { code: p.code, shift: p.shift }];
      return [isN ? { code: 'KeyN', shift: false, alt: true, dead: true } : { code: 'KeyE', shift: false, alt: true, dead: true }, { code: p.code, shift: p.shift }];
    }
    if (layoutId !== 'latam' && US_EXTRA[ch]) return [US_EXTRA[ch]];
    return null;
  }

  // ── Lessons ──────────────────────────────────────────────────────
  // `keys` are new physical keys; `chars` are new characters that are
  // not one key each (capitals, accents). A lesson also uses everything
  // the lessons before it taught. `grp` groups them on the map.
  var LESSONS = [
    { id: 'fj',    grp: 'home',   keys: ['KeyF', 'KeyJ', 'Space'], t: ['F y J: las teclas con rayita', 'F and J: the keys with bumps'] },
    { id: 'dk',    grp: 'home',   keys: ['KeyD', 'KeyK'], t: ['D y K: los dedos medios', 'D and K: middle fingers'] },
    { id: 'sl',    grp: 'home',   keys: ['KeyS', 'KeyL'], t: ['S y L: los anulares', 'S and L: ring fingers'] },
    { id: 'apin',  grp: 'home',   keys: ['KeyA', 'Semicolon'], t: ['A y el meñique derecho', 'A and the right little finger'] },
    { id: 'gh',    grp: 'home',   keys: ['KeyG', 'KeyH'], t: ['G y H: los índices se estiran', 'G and H: pointer fingers reach'] },
    { id: 'ei',    grp: 'top',    keys: ['KeyE', 'KeyI'], t: ['E e I: subir una fila', 'E and I: up one row'] },
    { id: 'ru',    grp: 'top',    keys: ['KeyR', 'KeyU'], t: ['R y U', 'R and U'] },
    { id: 'ty',    grp: 'top',    keys: ['KeyT', 'KeyY'], t: ['T e Y', 'T and Y'] },
    { id: 'wo',    grp: 'top',    keys: ['KeyW', 'KeyO'], t: ['W y O', 'W and O'] },
    { id: 'qp',    grp: 'top',    keys: ['KeyQ', 'KeyP'], t: ['Q y P: los meñiques arriba', 'Q and P: little fingers up'] },
    { id: 'cm',    grp: 'bottom', keys: ['KeyC', 'KeyM', 'Comma'], t: ['C, M y la coma', 'C, M and the comma'] },
    { id: 'vn',    grp: 'bottom', keys: ['KeyV', 'KeyN', 'KeyB'], t: ['V, B y N', 'V, B and N'] },
    { id: 'xz',    grp: 'bottom', keys: ['KeyX', 'KeyZ', 'Period'], t: ['X, Z y el punto', 'X, Z and the period'] },
    { id: 'caps',  grp: 'more',   keys: ['ShiftLeft', 'ShiftRight'], caps: true, t: ['Mayúsculas con Shift', 'Capitals with Shift'] },
    { id: 'nums',  grp: 'more',   keys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'], t: ['Los números', 'Numbers'] },
    { id: 'punct', grp: 'more',   chars: ['?', '!', ':', ';', '"', '\'', '-'], t: ['Signos: ? ! : ; " \' -', 'Punctuation: ? ! : ; " \' -'] },
    { id: 'acc',   grp: 'spanish', chars: ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'], spanish: true, t: ['Tildes, ñ, ¿ y ¡', 'Accents, ñ, ¿ and ¡'] }
  ];

  var GROUPS = [
    { id: 'home',    t: ['Fila guía', 'Home row'] },
    { id: 'top',     t: ['Fila de arriba', 'Top row'] },
    { id: 'bottom',  t: ['Fila de abajo', 'Bottom row'] },
    { id: 'more',    t: ['Mayúsculas, números y signos', 'Capitals, numbers and signs'] },
    { id: 'spanish', t: ['Español', 'Spanish'] }
  ];

  // ── Words ────────────────────────────────────────────────────────
  // Everyday words a kid reads in the suite, grouped short → long.
  var WORDS = {
    es: [
      // 1–3 letters
      'a', 'al', 'da', 'de', 'el', 'en', 'es', 'ha', 'la', 'las', 'le', 'lo', 'los', 'mi', 'no', 'por', 'que', 'se', 'si', 'sal', 'sol', 'su', 'te', 'tu', 'un', 'una', 'ya', 'yo', 'mar', 'pan', 'pez', 'luz', 'voy', 'dos', 'tres', 'ojo', 'oso', 'rey', 'red', 'mes', 'hoy', 'fue', 'van',
      // 4–5 letters
      'sala', 'hada', 'gala', 'alas', 'casa', 'mesa', 'mamá', 'papá', 'gato', 'perro', 'agua', 'luna', 'nube', 'flor', 'árbol', 'lago', 'río', 'isla', 'playa', 'mano', 'pie', 'jugar', 'leer', 'saltar', 'feliz', 'libro', 'lápiz', 'tarde', 'noche', 'día', 'cielo', 'campo', 'pato', 'vaca', 'lobo', 'puma', 'león', 'niño', 'niña', 'año', 'sueño', 'piña', 'uva', 'pera', 'kilo', 'falda', 'salsa', 'gasa', 'daña', 'llama', 'calle', 'fuego', 'tierra', 'verde', 'rojo', 'azul', 'blanco', 'negro', 'grande', 'chico', 'nieve', 'viento', 'barco', 'tren', 'auto', 'mapa', 'globo',
      // 6+ letters
      'familia', 'escuela', 'abuela', 'abuelo', 'hermano', 'hermana', 'montaña', 'volcán', 'desierto', 'glaciar', 'cordillera', 'cóndor', 'huemul', 'copihue', 'araucaria', 'empanada', 'domingo', 'iglesia', 'oración', 'estrella', 'ventana', 'mañana', 'pájaro', 'mariposa', 'tortuga', 'ballena', 'delfín', 'caballo', 'manzana', 'naranja', 'chocolate', 'canción', 'guitarra', 'aventura', 'explorar', 'descubrir', 'aprender', 'escribir', 'teclado', 'pantalla', 'número', 'pregunta', 'respuesta'
    ],
    en: [
      'a', 'add', 'as', 'all', 'ask', 'dad', 'had', 'has', 'lad', 'sad', 'gas', 'jag', 'the', 'and', 'to', 'of', 'in', 'is', 'it', 'he', 'she', 'we', 'you', 'go', 'up', 'on', 'at', 'my', 'me', 'run', 'sun', 'cat', 'dog', 'hat', 'red', 'big', 'sit', 'yes', 'see', 'sea', 'tree', 'fish', 'fox', 'cow', 'owl', 'jam', 'key',
      'fall', 'hall', 'glad', 'flag', 'flask', 'glass', 'salad', 'shall', 'half', 'dash', 'lake', 'ride', 'kite', 'home', 'jump', 'play', 'read', 'book', 'moon', 'star', 'rain', 'snow', 'wind', 'bird', 'frog', 'duck', 'boat', 'ship', 'road', 'hill', 'farm', 'milk', 'cake', 'bread', 'apple', 'grape', 'lemon', 'happy', 'sunny', 'water', 'house', 'horse', 'zebra', 'quiet', 'quick', 'light', 'night', 'green', 'black', 'white', 'brown', 'river', 'beach', 'cloud', 'train', 'plant', 'smile', 'write', 'type', 'keys',
      'family', 'school', 'mother', 'father', 'sister', 'brother', 'garden', 'mountain', 'volcano', 'desert', 'glacier', 'penguin', 'condor', 'island', 'ocean', 'forest', 'church', 'prayer', 'window', 'morning', 'evening', 'kitchen', 'butterfly', 'turtle', 'whale', 'dolphin', 'orange', 'banana', 'chocolate', 'guitar', 'adventure', 'explore', 'discover', 'learn', 'keyboard', 'screen', 'number', 'question', 'answer', 'yesterday', 'tomorrow'
    ]
  };

  // ── Typing ranks ─────────────────────────────────────────────────
  // Reached with three runs at that speed or faster, each at 95% or
  // better and at least 60 characters long.
  var RANKS = [
    { id: 'cadet',      wpm: 0,  icon: '🛸', es: 'Cadete',      en: 'Cadet' },
    { id: 'apprentice', wpm: 5,  icon: '🌟', es: 'Aprendiz',    en: 'Apprentice' },
    { id: 'veteran',    wpm: 10, icon: '🛡️', es: 'Veterano',    en: 'Veteran' },
    { id: 'explorer',   wpm: 15, icon: '🌍', es: 'Explorador',  en: 'Explorer' },
    { id: 'pilot',      wpm: 20, icon: '🚀', es: 'Piloto',      en: 'Pilot' },
    { id: 'astronaut',  wpm: 25, icon: '🌌', es: 'Astronauta',  en: 'Astronaut' },
    { id: 'elite',      wpm: 32, icon: '💎', es: 'Élite',       en: 'Elite' },
    { id: 'grandmaster', wpm: 40, icon: '👑', es: 'Gran Maestro', en: 'Grand Master' }
  ];

  // Speed goal for a lesson's third star, by age tier (words per minute).
  var GOALS = { beginner: 3, intermediate: 7, advanced: 12, expert: 18 };

  return {
    FINGERS: FINGERS, FINGER_OF: FINGER_OF, HOME: HOME, LAYOUTS: LAYOUTS, CONTROL_LABELS: CONTROL_LABELS,
    ACCENTS: ACCENTS, stepsFor: stepsFor, LESSONS: LESSONS, GROUPS: GROUPS, WORDS: WORDS, RANKS: RANKS, GOALS: GOALS
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TypeQuestData;
