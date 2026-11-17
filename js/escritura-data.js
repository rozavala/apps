/* ================================================================
   ESCRITURA DATA — js/escritura-data.js  (global EscrituraData)
   The letters (as strokes, in the order and direction they are
   written), the letter sets in teaching order, and the practice words.
   Path syntax and units: see js/escritura-engine.js.

   Two styles:
     print    "imprenta" / "letra script": ball-and-stick letters, as
              taught in Chilean and US schools before cursive. The two
              mostly agree; where schools differ (I with or without
              bars, a in one or two strokes) one common form is used.
     cursive  "letra ligada" / cursive: lowercase only for now, joined
              letters, leaning right. It follows the general shape of
              the "ligada" in Chilean notebooks and of US school cursive
              (both start each letter from the baseline); details vary
              by school and workbook, and the app says so.
   ================================================================ */

var EscrituraData = (function() {
  'use strict';

  // ── print (imprenta) ─────────────────────────────────────────
  var P = {
    // capitals: top line 100, baseline 0
    'A': { w: 80, s: ['M40 100 L4 0', 'M40 100 L76 0', 'M17 34 L63 34'] },
    'B': { w: 66, s: ['M8 100 L8 0', 'M8 100 L36 100 C66 100 66 52 36 52 L8 52 L40 52 C72 52 72 0 40 0 L8 0'] },
    'C': { w: 78, s: ['A44 50 38 50 42 318'] },
    'D': { w: 74, s: ['M8 100 L8 0', 'M8 100 L30 100 C78 100 78 0 30 0 L8 0'] },
    'E': { w: 60, s: ['M8 100 L8 0', 'M8 100 L56 100', 'M8 52 L48 52', 'M8 0 L56 0'] },
    'F': { w: 58, s: ['M8 100 L8 0', 'M8 100 L54 100', 'M8 52 L46 52'] },
    'G': { w: 84, s: ['A44 50 38 50 42 335 L80 46 L56 46'] },
    'H': { w: 70, s: ['M8 100 L8 0', 'M62 100 L62 0', 'M8 52 L62 52'] },
    'I': { w: 44, s: ['M22 100 L22 0', 'M4 100 L40 100', 'M4 0 L40 0'] },
    'J': { w: 56, s: ['M44 100 L44 26 C44 -8 6 -8 4 22'] },
    'K': { w: 64, s: ['M8 100 L8 0', 'M58 100 L9 46', 'M24 62 L60 0'] },
    'L': { w: 56, s: ['M8 100 L8 0 L52 0'] },
    'M': { w: 86, s: ['M8 100 L8 0', 'M8 100 L43 28 L78 100 L78 0'] },
    'N': { w: 72, s: ['M8 100 L8 0', 'M8 100 L64 0 L64 100'] },
    'O': { w: 86, s: ['A43 50 38 50 90 450'] },
    'P': { w: 62, s: ['M8 100 L8 0', 'M8 100 L34 100 C66 100 66 48 34 48 L8 48'] },
    'Q': { w: 88, s: ['A43 50 38 50 90 450', 'M52 22 L84 -6'] },
    'R': { w: 66, s: ['M8 100 L8 0', 'M8 100 L34 100 C66 100 66 50 34 50 L8 50', 'M30 50 L62 0'] },
    'S': { w: 64, s: ['M56 86 C48 102 10 102 9 76 C8 52 58 54 58 26 C58 -4 12 -4 4 14'] },
    'T': { w: 64, s: ['M32 100 L32 0', 'M4 100 L60 100'] },
    'U': { w: 72, s: ['M8 100 L8 32 C8 -10 64 -10 64 32 L64 100'] },
    'V': { w: 76, s: ['M4 100 L38 0 L72 100'] },
    'W': { w: 106, s: ['M4 100 L28 0 L53 100 L78 0 L102 100'] },
    'X': { w: 70, s: ['M6 100 L64 0', 'M64 100 L6 0'] },
    'Y': { w: 72, s: ['M6 100 L36 50', 'M66 100 L36 50 L36 0'] },
    'Z': { w: 64, s: ['M6 100 L58 100 L6 0 L58 0'] },

    // small letters: midline 50, descender -50
    'a': { w: 54, s: ['A27 25 23 25 35 395', 'M50 50 L50 0'] },
    'b': { w: 56, s: ['M6 100 L6 0', 'A30 25 24 25 180 -180'] },
    'c': { w: 50, s: ['A27 25 23 25 42 318'] },
    'd': { w: 56, s: ['A27 25 23 25 35 395', 'M50 100 L50 0'] },
    'e': { w: 54, s: ['M4 25 L50 25 A27 25 23 25 0 318'] },
    'f': { w: 42, s: ['A30 84 12 16 25 180 L18 0', 'M4 50 L36 50'] },
    'g': { w: 54, s: ['A27 25 23 25 35 395', 'M50 50 L50 -26 C50 -58 12 -58 6 -34'] },
    'h': { w: 56, s: ['M6 100 L6 0', 'M6 28 C8 58 50 60 50 28 L50 0'] },
    'i': { w: 22, s: ['M11 50 L11 0', 'M11 74'] },
    'j': { w: 36, s: ['M26 50 L26 -30 C26 -58 2 -56 0 -40', 'M26 74'] },
    'k': { w: 50, s: ['M6 100 L6 0', 'M44 52 L7 22', 'M18 30 L46 0'] },
    'l': { w: 22, s: ['M11 100 L11 0'] },
    'm': { w: 82, s: ['M6 50 L6 0', 'M6 28 C8 58 42 60 42 28 L42 0', 'M42 28 C44 58 78 60 78 28 L78 0'] },
    'n': { w: 56, s: ['M6 50 L6 0', 'M6 28 C8 58 50 60 50 28 L50 0'] },
    'o': { w: 54, s: ['A27 25 23 25 90 450'] },
    'p': { w: 56, s: ['M6 50 L6 -50', 'A30 25 24 25 180 -180'] },
    'q': { w: 56, s: ['A27 25 23 25 35 395', 'M50 50 L50 -50'] },
    'r': { w: 42, s: ['M6 50 L6 0', 'M6 28 C10 54 28 58 40 46'] },
    's': { w: 44, s: ['M38 42 C32 54 6 54 6 38 C6 24 38 28 38 12 C38 -4 8 -4 4 8'] },
    't': { w: 38, s: ['M18 88 L18 0', 'M4 52 L34 52'] },
    'u': { w: 56, s: ['M6 50 L6 22 C6 -8 50 -8 50 22', 'M50 50 L50 0'] },
    'v': { w: 52, s: ['M4 50 L26 0 L48 50'] },
    'w': { w: 78, s: ['M4 50 L20 0 L39 50 L58 0 L74 50'] },
    'x': { w: 50, s: ['M6 50 L44 0', 'M44 50 L6 0'] },
    'y': { w: 52, s: ['M4 50 L26 2', 'M48 50 L14 -50'] },
    'z': { w: 46, s: ['M6 50 L40 50 L6 0 L42 0'] }
  };

  // ── cursive (letra ligada), drawn upright; the engine leans it ─
  // b: the main stroke from its first point (where the lead-in arrives),
  // ending where the join to the next letter leaves. x: strokes added
  // after (dots, crosses, tildes). i: for oval letters, the last part of
  // the way in (along the bottom and up the right side of the oval).
  var C = {
    'a': { i: 'M20 0 C34 -2 44 12 42 30 C41 36 40 40 38 44', w: 52, b: 'M38 44 C30 54 6 50 6 26 C6 2 30 0 38 22 L40 48 L40 10 C40 0 46 0 52 8' },
    'b': { w: 46, b: 'M4 10 C14 40 24 70 24 88 C24 102 10 102 10 86 L10 10 C12 0 32 0 34 22 C35 38 32 48 28 46 C34 46 40 46 46 44' },
    'c': { w: 42, i: 'M5 12 C4 30 12 46 22 50', b: 'M22 50 C30 54 38 50 34 44 C28 52 6 46 6 26 C6 4 28 -2 42 8' },
    'd': { i: 'M20 0 C34 -2 44 12 42 30 C41 36 40 40 38 44', w: 54, b: 'M38 44 C30 54 6 50 6 26 C6 2 30 0 38 22 L42 100 L42 10 C42 0 48 0 54 8' },
    'e': { w: 42, b: 'M4 14 C20 18 36 30 34 42 C32 54 8 50 6 30 C4 8 24 -2 42 8' },
    'f': { w: 42, b: 'M4 10 C16 40 30 70 30 88 C30 102 16 102 16 86 L16 -36 C16 -54 30 -40 32 -24 C34 -8 22 0 16 2 C26 2 34 4 42 10' },
    'g': { i: 'M20 0 C34 -2 44 12 42 30 C41 36 40 40 38 44', w: 52, b: 'M38 44 C30 54 6 50 6 26 C6 2 30 0 38 22 L40 48 L40 -34 C40 -56 16 -54 16 -38 C16 -24 34 -8 52 6' },
    'h': { w: 52, b: 'M4 10 C14 40 24 70 24 88 C24 102 10 102 10 86 L10 0 L10 20 C12 46 40 52 40 30 L40 10 C40 0 46 0 52 8' },
    'i': { w: 26, b: 'M14 50 L14 10 C14 0 20 0 26 8', x: ['M14 72'] },
    'j': { w: 32, b: 'M14 50 L14 -34 C14 -56 -6 -52 -4 -38 C-2 -24 16 -8 32 6', x: ['M14 72'] },
    'k': { w: 52, b: 'M4 10 C14 40 24 70 24 88 C24 102 10 102 10 86 L10 0 L10 20 C14 44 42 48 38 32 C34 22 20 24 16 24 C26 22 34 16 36 8 C38 0 44 0 52 8' },
    'l': { w: 32, b: 'M4 10 C14 40 24 70 24 88 C24 102 10 102 10 86 L10 10 C10 0 18 0 32 8' },
    'm': { w: 74, b: 'M6 44 C10 50 14 48 14 40 L14 0 L14 22 C16 46 38 52 38 30 L38 0 L38 22 C40 46 62 52 62 30 L62 10 C62 0 68 0 74 8' },
    'n': { w: 50, b: 'M6 44 C10 50 14 48 14 40 L14 0 L14 22 C16 46 38 52 38 30 L38 10 C38 0 44 0 50 8' },
    'o': { w: 50, i: 'M22 -1 C36 -1 46 14 44 28 C43 36 41 42 38 46', b: 'M38 46 C30 54 4 50 4 26 C4 4 24 -2 36 8 C44 16 44 38 38 46 C42 47 46 46 50 46' },
    'p': { w: 50, b: 'M8 48 L8 -50 L8 20 C10 46 40 52 40 26 C40 4 20 0 10 10 C22 4 36 4 50 8' },
    'q': { i: 'M20 0 C34 -2 44 12 42 30 C41 36 40 40 38 44', w: 52, b: 'M38 44 C30 54 6 50 6 26 C6 2 30 0 38 22 L40 48 L40 -44 C44 -30 46 -10 52 6' },
    'r': { w: 42, b: 'M14 52 C18 46 24 48 26 44 L26 10 C26 0 34 0 42 8' },
    's': { w: 40, b: 'M14 50 C26 34 34 22 28 10 C22 0 10 2 6 8 C14 2 30 2 40 8' },
    't': { w: 36, b: 'M16 84 L16 10 C16 0 24 0 36 8', x: ['M4 54 L34 54'] },
    'u': { w: 52, b: 'M14 50 L14 14 C14 0 36 0 38 22 L38 50 L38 10 C38 0 44 0 52 8' },
    'v': { w: 48, b: 'M6 44 C10 52 16 48 18 40 C20 26 22 10 26 2 C32 14 40 34 40 46 C36 46 40 44 48 44' },
    'w': { w: 66, b: 'M8 50 L10 14 C12 0 30 0 32 22 L32 48 L34 14 C36 0 52 2 52 26 C52 40 50 48 48 46 C52 44 58 44 66 44' },
    'x': { w: 46, b: 'M6 44 C14 52 20 48 22 36 L26 12 C28 2 36 0 46 8', x: ['M38 48 L12 0'] },
    'y': { w: 50, b: 'M14 50 L14 14 C14 0 36 0 38 22 L38 50 L38 -34 C38 -56 14 -54 14 -38 C14 -24 32 -8 50 6' },
    'z': { w: 46, b: 'M6 44 C14 52 34 52 36 44 C30 30 16 16 10 2 C22 4 34 6 34 -12 C34 -40 20 -54 14 -38 C10 -24 32 -6 46 6' }
  };

  // ── Spanish letters built from the plain ones ────────────────
  function acute(x, y) { y = y || 62; return 'M' + (x + 6) + ' ' + (y + 18) + ' L' + (x - 5) + ' ' + y; }
  function tilde(x, y) { return 'M' + (x - 13) + ' ' + y + ' C' + (x - 7) + ' ' + (y + 12) + ' ' + (x - 2) + ' ' + (y - 2) + ' ' + (x + 3) + ' ' + (y + 4) + ' C' + (x + 7) + ' ' + (y + 9) + ' ' + (x + 11) + ' ' + (y + 6) + ' ' + (x + 14) + ' ' + (y + 2); }
  function addP(ch, base, extra, drop) {
    var g = P[base], s = g.s.slice();
    if (drop != null) s.splice(drop, 1);
    P[ch] = { w: g.w, s: s.concat(extra), nd: s.length };
  }
  function addC(ch, base, extra, drop) {
    var g = C[base], x = (g.x || []).slice();
    if (drop != null) x.splice(drop, 1);
    C[ch] = { w: g.w, b: g.b, i: g.i, x: x.concat(extra), nd: 1 + x.length };
  }
  addP('á', 'a', [acute(27)]); addP('é', 'e', [acute(27)]); addP('í', 'i', [acute(11)], 1);
  addP('ó', 'o', [acute(27)]); addP('ú', 'u', [acute(28)]); addP('ü', 'u', ['M18 70', 'M38 70']);
  addP('ñ', 'n', [tilde(28, 64)]); addP('Ñ', 'N', [tilde(36, 112)]);
  addP('Á', 'A', [acute(42, 108)]); addP('É', 'E', [acute(32, 108)]); addP('Í', 'I', [acute(24, 108)]);
  addP('Ó', 'O', [acute(45, 108)]); addP('Ú', 'U', [acute(38, 108)]);
  addC('á', 'a', [acute(26)]); addC('é', 'e', [acute(22)]); addC('í', 'i', [acute(15)], 0);
  addC('ó', 'o', [acute(20)]); addC('ú', 'u', [acute(28)]); addC('ü', 'u', ['M18 68', 'M36 68']);
  addC('ñ', 'n', [tilde(28, 62)]);

  var FONTS = {
    print:   { id: 'print', cursive: false, gap: 12, space: 42, glyphs: P },
    cursive: { id: 'cursive', cursive: true, gap: 0, space: 44, glyphs: C }
  };

  // ── letter sets, in teaching order (vowels first, as in Chile) ─
  var SETS = {
    print: [
      { id: 'p1', t: ['Vocales mayúsculas', 'Capital vowels'], ch: 'AEIOU' },
      { id: 'p2', t: ['Mayúsculas con rectas', 'Straight-line capitals'], ch: 'LTFHKNMVWXYZ' },
      { id: 'p3', t: ['Mayúsculas con curvas', 'Curvy capitals'], ch: 'CGSJDPBRQÑ' },
      { id: 'p4', t: ['Vocales minúsculas', 'Small vowels'], ch: 'aeiou' },
      { id: 'p5', t: ['La familia de la c', 'The c family'], ch: 'cdgqs' },
      { id: 'p6', t: ['Palitos y puentes', 'Sticks and bridges'], ch: 'ltfkhnmrñ' },
      { id: 'p7', t: ['Más minúsculas', 'More small letters'], ch: 'bpjvwxyz' },
      { id: 'p8', t: ['Tildes y diéresis', 'Accents'], ch: 'áéíóúü' }
    ],
    cursive: [
      { id: 'c1', t: ['Vocales ligadas', 'Cursive vowels'], ch: 'aeiou' },
      { id: 'c2', t: ['Óvalos', 'Ovals'], ch: 'cdgqs' },
      { id: 'c3', t: ['Lazos altos', 'Tall loops'], ch: 'ltfkhb' },
      { id: 'c4', t: ['Puentes y picos', 'Humps and peaks'], ch: 'nmrñvwx' },
      { id: 'c5', t: ['Lazos abajo', 'Low loops'], ch: 'pjyz' },
      { id: 'c6', t: ['Tildes y diéresis', 'Accents'], ch: 'áéíóúü' }
    ]
  };

  // ── letter names, for the voice ──────────────────────────────
  var NAMES_ES = { a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'efe', g: 'ge', h: 'hache', i: 'i', j: 'jota', k: 'ka', l: 'ele',
    m: 'eme', n: 'ene', 'ñ': 'eñe', o: 'o', p: 'pe', q: 'cu', r: 'erre', s: 'ese', t: 'te', u: 'u', v: 've', w: 'doble ve',
    x: 'equis', y: 'i griega', z: 'zeta', 'á': 'a con tilde', 'é': 'e con tilde', 'í': 'i con tilde', 'ó': 'o con tilde',
    'ú': 'u con tilde', 'ü': 'u con diéresis' };
  var NAMES_EN = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G', h: 'H', i: 'I', j: 'J', k: 'K', l: 'L', m: 'M', n: 'N',
    'ñ': 'Spanish eñe', o: 'O', p: 'P', q: 'Q', r: 'R', s: 'S', t: 'T', u: 'U', v: 'V', w: 'W', x: 'X', y: 'Y', z: 'Z',
    'á': 'A with an accent', 'é': 'E with an accent', 'í': 'I with an accent', 'ó': 'O with an accent', 'ú': 'U with an accent', 'ü': 'U with two dots' };
  function letterName(ch, lang) {
    var low = ch.toLowerCase(), cap = ch !== low;
    if (lang === 'es') return (cap ? 'la ' + NAMES_ES[low] + ' mayúscula' : 'la ' + NAMES_ES[low] + (low === ch && /[a-zñ]/.test(ch) ? ' minúscula' : ''));
    return (cap ? 'capital ' : 'small ') + NAMES_EN[low];
  }

  // ── practice words ───────────────────────────────────────────
  // Everyday words, greetings, the opening words of common prayers and
  // traditional rhymes (public domain). `g`: group. No family names:
  // "My name" uses the kid's own profile name, on the device only.
  var GROUPS = [
    { id: 'saludos', t: ['Saludos', 'Greetings'] },
    { id: 'familia', t: ['Familia', 'Family'] },
    { id: 'cosas', t: ['Cosas que veo', 'Things I see'] },
    { id: 'fe', t: ['Oraciones', 'Prayers'] },
    { id: 'rimas', t: ['Rimas y canciones', 'Rhymes and songs'] }
  ];
  var WORDS = [
    // español
    { id: 'hola', l: 'es', g: 'saludos', t: 'hola' },
    { id: 'chao', l: 'es', g: 'saludos', t: 'chao' },
    { id: 'gracias', l: 'es', g: 'saludos', t: 'gracias' },
    { id: 'porfavor', l: 'es', g: 'saludos', t: 'por favor' },
    { id: 'buenosdias', l: 'es', g: 'saludos', t: 'buenos días' },
    { id: 'mama', l: 'es', g: 'familia', t: 'mamá' },
    { id: 'papa', l: 'es', g: 'familia', t: 'papá' },
    { id: 'abuela', l: 'es', g: 'familia', t: 'abuela' },
    { id: 'abuelo', l: 'es', g: 'familia', t: 'abuelo' },
    { id: 'hermano', l: 'es', g: 'familia', t: 'hermano' },
    { id: 'hermana', l: 'es', g: 'familia', t: 'hermana' },
    { id: 'sol', l: 'es', g: 'cosas', t: 'sol' },
    { id: 'luna', l: 'es', g: 'cosas', t: 'luna' },
    { id: 'casa', l: 'es', g: 'cosas', t: 'casa' },
    { id: 'pan', l: 'es', g: 'cosas', t: 'pan' },
    { id: 'uva', l: 'es', g: 'cosas', t: 'uva' },
    { id: 'nino', l: 'es', g: 'cosas', t: 'niño' },
    { id: 'arbol', l: 'es', g: 'cosas', t: 'árbol' },
    { id: 'flor', l: 'es', g: 'cosas', t: 'flor' },
    { id: 'cordillera', l: 'es', g: 'cosas', t: 'cordillera' },
    { id: 'jesus', l: 'es', g: 'fe', t: 'Jesús' },
    { id: 'amen', l: 'es', g: 'fe', t: 'amén' },
    { id: 'avemaria', l: 'es', g: 'fe', t: 'Ave María' },
    { id: 'padrenuestro', l: 'es', g: 'fe', t: 'Padre nuestro' },
    { id: 'gloria', l: 'es', g: 'fe', t: 'Gloria al Padre' },
    { id: 'angel', l: 'es', g: 'fe', t: 'Ángel de mi guarda' },
    { id: 'piopio', l: 'es', g: 'rimas', t: 'pío pío pío' },
    { id: 'arroz', l: 'es', g: 'rimas', t: 'arroz con leche' },
    { id: 'rueda', l: 'es', g: 'rimas', t: 'a la rueda rueda' },
    // English
    { id: 'hello', l: 'en', g: 'saludos', t: 'hello' },
    { id: 'hi', l: 'en', g: 'saludos', t: 'hi' },
    { id: 'thankyou', l: 'en', g: 'saludos', t: 'thank you' },
    { id: 'please', l: 'en', g: 'saludos', t: 'please' },
    { id: 'goodmorning', l: 'en', g: 'saludos', t: 'good morning' },
    { id: 'mom', l: 'en', g: 'familia', t: 'mom' },
    { id: 'dad', l: 'en', g: 'familia', t: 'dad' },
    { id: 'grandma', l: 'en', g: 'familia', t: 'grandma' },
    { id: 'brother', l: 'en', g: 'familia', t: 'brother' },
    { id: 'sister', l: 'en', g: 'familia', t: 'sister' },
    { id: 'sun', l: 'en', g: 'cosas', t: 'sun' },
    { id: 'moon', l: 'en', g: 'cosas', t: 'moon' },
    { id: 'cat', l: 'en', g: 'cosas', t: 'cat' },
    { id: 'dog', l: 'en', g: 'cosas', t: 'dog' },
    { id: 'tree', l: 'en', g: 'cosas', t: 'tree' },
    { id: 'house', l: 'en', g: 'cosas', t: 'house' },
    { id: 'god', l: 'en', g: 'fe', t: 'God' },
    { id: 'amen-en', l: 'en', g: 'fe', t: 'amen' },
    { id: 'hailmary', l: 'en', g: 'fe', t: 'Hail Mary' },
    { id: 'ourfather', l: 'en', g: 'fe', t: 'Our Father' },
    { id: 'glorybe', l: 'en', g: 'fe', t: 'Glory be' },
    { id: 'twinkle', l: 'en', g: 'rimas', t: 'twinkle twinkle' },
    { id: 'littlestar', l: 'en', g: 'rimas', t: 'little star' },
    { id: 'rowrow', l: 'en', g: 'rimas', t: 'row row row' }
  ];

  function font(style) { return FONTS[style] || FONTS.print; }
  // Can this text be written in that style with the letters we have?
  function writable(text, style) {
    var g = font(style).glyphs;
    return String(text).split('').every(function(c) { return c === ' ' || !!g[c]; });
  }
  function letters(style) {
    var out = [];
    (SETS[style] || []).forEach(function(s) { s.ch.split('').forEach(function(c) { out.push(c); }); });
    return out;
  }
  function setOf(style, ch) {
    var list = SETS[style] || [];
    for (var i = 0; i < list.length; i++) if (list[i].ch.indexOf(ch) >= 0) return list[i];
    return null;
  }
  function word(id) { for (var i = 0; i < WORDS.length; i++) if (WORDS[i].id === id) return WORDS[i]; return null; }

  return {
    FONTS: FONTS, SETS: SETS, WORDS: WORDS, GROUPS: GROUPS,
    font: font, writable: writable, letters: letters, setOf: setOf, word: word, letterName: letterName
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = EscrituraData;
