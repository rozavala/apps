/* ================================================================
   MENSAJES SECRETOS — data + cipher engine
   Pure functions and hand-written content only. No storage here.
   Exposes one global: MensajesSecretosData
   ================================================================ */

var MensajesSecretosData = (function() {
  'use strict';

  var ALPHA = {
    en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    es: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'
  };

  // Upper-case, drop accents. Ñ survives in Spanish mode, becomes N in English.
  function normalize(s, lang) {
    s = String(s || '').toUpperCase().replace(/Ñ/g, '\u0001');
    s = s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s;
    return s.replace(/\u0001/g, lang === 'es' ? 'Ñ' : 'N');
  }

  // For answer checks: letters + digits only, Ñ = N, no accents, no spaces.
  function answerKey(s) {
    return normalize(s, 'en').replace(/[^A-Z0-9]/g, '');
  }
  function checkAnswer(typed, plain) {
    var a = answerKey(typed), b = answerKey(plain);
    return a.length > 0 && a === b;
  }

  function _mod(n, m) { return ((n % m) + m) % m; }

  function caesar(text, shift, lang) {
    var A = ALPHA[lang] || ALPHA.en, n = A.length;
    return normalize(text, lang).split('').map(function(ch) {
      var i = A.indexOf(ch);
      return i < 0 ? ch : A[_mod(i + shift, n)];
    }).join('');
  }

  function atbash(text, lang) {
    var A = ALPHA[lang] || ALPHA.en, n = A.length;
    return normalize(text, lang).split('').map(function(ch) {
      var i = A.indexOf(ch);
      return i < 0 ? ch : A[n - 1 - i];
    }).join('');
  }

  // ---- Substitution: fixed cipher alphabets (no letter maps to itself) ----
  function _seeded(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function _derangement(alpha, seed) {
    var rnd = _seeded(seed);
    for (var tries = 0; tries < 200; tries++) {
      var a = alpha.split('');
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      var ok = true;
      for (var k = 0; k < a.length; k++) if (a[k] === alpha[k]) { ok = false; break; }
      if (ok) return a.join('');
    }
    return alpha.slice(1) + alpha[0];
  }
  var SUB_KEYS = {
    en: 'QWERTYUIOPASDFGHJKLZXCVBNM',
    es: _derangement(ALPHA.es, 1520)
  };
  function substitute(text, lang, key) {
    var A = ALPHA[lang] || ALPHA.en; key = key || SUB_KEYS[lang];
    return normalize(text, lang).split('').map(function(ch) {
      var i = A.indexOf(ch);
      return i < 0 ? ch : key[i];
    }).join('');
  }

  // ---- Morse (International; Ñ as used in Spanish) ----
  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', 'Ñ': '--.--', O: '---',
    P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--',
    X: '-..-', Y: '-.--', Z: '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };
  var MORSE_REV = {};
  Object.keys(MORSE).forEach(function(k) { MORSE_REV[MORSE[k]] = k; });

  function toMorse(text) {
    return normalize(text, 'es').split(/\s+/).filter(Boolean).map(function(w) {
      return w.split('').map(function(ch) { return MORSE[ch] || ''; })
        .filter(Boolean).join(' ');
    }).join(' / ');
  }
  function fromMorse(code) {
    return String(code || '').trim().split(/\s*\/\s*/).map(function(w) {
      return w.split(/\s+/).map(function(g) { return MORSE_REV[g] || (g ? '?' : ''); }).join('');
    }).join(' ');
  }

  // ---- Pigpen ----
  // kind: 'grid' (tic-tac-toe cell r,c) or 'x' (S/T/U/V region), dot: bool
  var PIGPEN = {};
  (function() {
    var g1 = 'ABCDEFGHI', g2 = 'JKLMNOPQR';
    for (var i = 0; i < 9; i++) {
      PIGPEN[g1[i]] = { kind: 'grid', r: Math.floor(i / 3), c: i % 3, dot: false };
      PIGPEN[g2[i]] = { kind: 'grid', r: Math.floor(i / 3), c: i % 3, dot: true };
    }
    var regions = ['top', 'left', 'right', 'bottom'];
    'STUV'.split('').forEach(function(ch, k) { PIGPEN[ch] = { kind: 'x', region: regions[k], dot: false }; });
    'WXYZ'.split('').forEach(function(ch, k) { PIGPEN[ch] = { kind: 'x', region: regions[k], dot: true }; });
    PIGPEN['Ñ'] = { kind: 'grid', r: 1, c: 1, dot: true, tilde: true };
  })();

  // ---- Polybius (5×5, I and J share a square; Ñ is written as N) ----
  var POLY = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
  function polybius(text) {
    return normalize(text, 'en').replace(/J/g, 'I').split(/\s+/).filter(Boolean).map(function(w) {
      return w.split('').map(function(ch) {
        var i = POLY.indexOf(ch);
        return i < 0 ? '' : String(Math.floor(i / 5) + 1) + String(i % 5 + 1);
      }).filter(Boolean).join(' ');
    }).join(' / ');
  }
  function fromPolybius(code) {
    return String(code || '').split('/').map(function(w) {
      return (w.match(/[1-5][1-5]/g) || []).map(function(p) {
        return POLY[(+p[0] - 1) * 5 + (+p[1] - 1)];
      }).join('');
    }).join(' ');
  }

  // ---- Scytale: R letters around the rod. Write along rows, unwind down columns. ----
  function scytaleLetters(text) { return normalize(text, 'en').replace(/[^A-Z]/g, ''); }
  function scytale(text, rows) {
    var s = scytaleLetters(text);
    var cols = Math.ceil(s.length / rows);
    while (s.length < rows * cols) s += 'X';
    var out = '';
    for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++) out += s[r * cols + c];
    return out;
  }
  // Wrap a strip on a rod of `rows` letters around: returns array of row strings.
  function scytaleRows(strip, rows) {
    var cols = Math.ceil(strip.length / rows), out = [];
    for (var r = 0; r < rows; r++) {
      var line = '';
      for (var c = 0; c < cols; c++) { var k = c * rows + r; line += k < strip.length ? strip[k] : ' '; }
      out.push(line);
    }
    return out;
  }

  // ---- Letter frequencies (%), typical running text ----
  var FREQ = {
    en: { E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0, D: 4.3,
          L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0, P: 1.9, B: 1.5,
          V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07 },
    es: { E: 13.7, A: 12.5, O: 8.7, S: 8.0, R: 6.9, N: 6.7, I: 6.3, D: 5.9, L: 5.0, C: 4.7,
          T: 4.6, U: 3.9, M: 3.2, P: 2.5, B: 1.4, G: 1.0, V: 0.9, Y: 0.9, Q: 0.9, H: 0.7,
          F: 0.7, Z: 0.5, J: 0.4, 'Ñ': 0.3, X: 0.2, W: 0.02, K: 0.01 }
  };
  function letterCounts(text, lang) {
    var A = ALPHA[lang] || ALPHA.en, counts = {}, total = 0;
    A.split('').forEach(function(ch) { counts[ch] = 0; });
    normalize(text, lang).split('').forEach(function(ch) {
      if (counts[ch] != null) { counts[ch]++; total++; }
    });
    return { counts: counts, total: total };
  }

  // ---- Encode any mission ----
  function encode(m) {
    switch (m.cipher) {
      case 'caesar': return caesar(m.plain, m.key, m.lang);
      case 'atbash': return atbash(m.plain, m.lang);
      case 'pigpen': return normalize(m.plain, m.lang);
      case 'morse': return toMorse(m.plain);
      case 'polybius': return polybius(m.plain);
      case 'scytale': return scytale(m.plain, m.key);
      case 'sub': return substitute(m.plain, m.lang);
    }
    return m.plain;
  }

  // ================================================================
  //  MISSIONS — ordered by difficulty. minAge = recommended from.
  //  keyShown:false means the key is found in the mission it chains from.
  // ================================================================
  var MISSIONS = [
    { id: 'm01', cipher: 'caesar', lang: 'en', key: 3, minAge: 6, keyShown: true,
      title: 'Hello, Agent', place: 'Training room',
      brief: 'Your first message uses the shift Julius Caesar liked best: every letter moved 3 places.',
      plain: 'HELLO AGENT',
      hints: ['Set the wheel to shift 3. Find each secret letter on the paper disc and read the brass letter above it.',
              'K on the paper disc sits under H on the brass ring.',
              'The first word is HELLO.'] },
    { id: 'm02', cipher: 'atbash', lang: 'en', minAge: 6, keyShown: true,
      title: 'The Mirror Map', place: 'Old sea chest',
      brief: 'A torn map note, written in the mirror code Atbash. A becomes Z, B becomes Y…',
      plain: 'THE MAP IS IN THE BLUE BOX',
      hints: ['Every letter swaps with its partner on the mirror strip. Tap a letter to see its partner.',
              'G swaps with T, S swaps with H, V swaps with E.',
              'It starts: THE MAP IS…'] },
    { id: 'm03', cipher: 'morse', minAge: 6, keyShown: true,
      title: 'Ship in Trouble', place: 'Radio room',
      brief: 'A ship at sea is tapping a famous signal. Listen, or read the dots and dashes.',
      plain: 'SOS',
      note: 'SOS became the international distress signal in 1908. It was chosen because it is easy to send and hard to mistake.',
      hints: ['Three dots ( . . . ) is the letter S.', 'Three dashes ( — — — ) is the letter O.', 'S, then O, then S.'] },
    { id: 'm04', cipher: 'pigpen', lang: 'en', minAge: 6, keyShown: true,
      title: 'Garden Gate Sign', place: 'Back garden',
      brief: 'Someone scratched pigpen shapes on the gate. Match each shape to its pen on the key.',
      plain: 'TREASURE',
      hints: ['Shapes without a dot come from the first grid and the first X.', 'The shape like ">" is T. A full square is E.', 'It starts with TREA…'] },
    { id: 'm05', cipher: 'polybius', minAge: 7, keyShown: true,
      title: 'Andes Lookout', place: 'Mountain hut',
      brief: 'Two numbers for each letter: first the ROW, then the COLUMN of the Polybius square.',
      plain: 'CONDOR',
      hints: ['13 means row 1, column 3.', '13 is C and 34 is O.', 'It is a great bird of the Andes.'] },
    { id: 'm06', cipher: 'caesar', lang: 'es', key: 3, minAge: 7, keyShown: true,
      title: 'La Isla del Tesoro', place: 'Mapa del pirata',
      brief: 'Un mensaje en español. Use the Spanish wheel (27 letters, with Ñ) and shift 3.',
      plain: 'EL TESORO ESTA EN LA ISLA',
      hints: ['Switch the wheel to Español (27 letters) and shift 3.', 'With Ñ in the alphabet, the letter after N is Ñ — so shifts land differently!', 'Empieza: EL TESORO…'] },
    { id: 'm07', cipher: 'morse', minAge: 8, keyShown: true,
      title: 'Washington to Baltimore', place: 'U.S. Capitol, 1844',
      brief: 'The very first long-distance telegraph message. Play it on the key and decode it.',
      plain: 'WHAT HATH GOD WROUGHT',
      note: 'Samuel Morse sent these words on 24 May 1844 to Alfred Vail in Baltimore. The phrase comes from the Bible (Numbers 23:23).',
      hints: ['Use the Morse tree: a dot goes left, a dash goes right.', '.-- is W and .... is H.', 'The first word is WHAT.'] },
    { id: 'm08', cipher: 'caesar', lang: 'en', key: 5, minAge: 8, keyShown: true, chainTo: 'm09',
      title: 'Key in the Envelope', place: 'Sealed envelope',
      brief: 'This message hides the key for the NEXT mission. Shift 5.',
      plain: 'THE KEY TO THE NEXT MESSAGE IS EIGHT',
      hints: ['Set the wheel to shift 5.', 'Y on the paper disc is T on the brass ring.', 'It starts: THE KEY TO…'] },
    { id: 'm09', cipher: 'caesar', lang: 'en', key: 8, minAge: 8, keyShown: false, chainFrom: 'm08',
      title: "Caesar's Report", place: 'Rome, 47 BC',
      brief: 'A short report by Julius Caesar himself, in Latin. The shift is hidden in mission 8.',
      plain: 'VENI VIDI VICI',
      note: '"I came, I saw, I conquered" — Caesar\'s report of a quick victory in 47 BC, recorded by Suetonius and Plutarch.',
      hints: ['Mission 8 tells you the shift: eight.', 'D on the paper disc is V on the brass ring.', 'The first word is VENI.'] },
    { id: 'm10', cipher: 'scytale', key: 3, minAge: 9, keyShown: true,
      title: 'Spartan Belt', place: 'Sparta, Greece',
      brief: 'A leather strip arrived. Wrap it on a rod 3 letters thick and read along the rod.',
      plain: 'MEET AT THE NORTH GATE',
      hints: ['Set the rod size to 3.', 'Turn the rod to read each row: the rows join into one message.', 'It starts: MEET AT…'] },
    { id: 'm11', cipher: 'pigpen', lang: 'es', minAge: 9, keyShown: true,
      title: 'La Llave Dorada', place: 'Cofre antiguo',
      brief: 'Pigpen en español. Find every shape on the key.',
      plain: 'BUSCA LA LLAVE DORADA',
      hints: ['Shapes with a dot come from the second grid and the second X.', 'A square open at the top (no dot) is B. Look carefully at every side.', 'Empieza: BUSCA…'] },
    { id: 'm12', cipher: 'atbash', lang: 'en', minAge: 9, keyShown: true,
      title: 'An Old Motto', place: 'Library shelf',
      brief: 'A famous short saying, written in Atbash.',
      plain: 'KNOWLEDGE IS POWER',
      note: 'The idea "knowledge is power" is linked to Francis Bacon, who wrote it in Latin in 1597.',
      hints: ['A↔Z, B↔Y, C↔X… tap the strip.', 'P swaps with K, M swaps with N.', 'The first word is KNOWLEDGE.'] },
    { id: 'm13', cipher: 'caesar', lang: 'en', key: 11, minAge: 10, keyShown: false,
      title: 'Unknown Shift', place: 'Moon base radio, 1969',
      brief: 'No key this time! Turn the wheel through every shift until the words make sense.',
      plain: 'THE EAGLE HAS LANDED',
      note: 'Neil Armstrong radioed these words on 20 July 1969 when the Apollo 11 lunar module landed on the Moon.',
      hints: ['Short words help: a 3-letter word is often THE.', 'The shift is 11.', 'It starts: THE EAGLE…'] },
    { id: 'm14', cipher: 'polybius', minAge: 10, keyShown: true,
      title: 'Greek Wisdom', place: 'Athens',
      brief: 'A saying from ancient Greece, in Polybius numbers.',
      plain: 'WELL BEGUN IS HALF DONE',
      note: 'Aristotle quoted this proverb in his book Politics.',
      hints: ['Row first, then column.', '52 is W and 15 is E.', 'It starts: WELL BEGUN…'] },
    { id: 'm15', cipher: 'morse', minAge: 10, keyShown: true,
      title: 'Lanterns in the Tower', place: 'Boston, 1775',
      brief: 'A lantern signal plan, sent as Morse. Turn on the signal lamp and watch it blink!',
      plain: 'ONE IF BY LAND TWO IF BY SEA',
      note: 'On 18 April 1775, lanterns in Boston\'s Old North Church signalled which way troops were moving. Longfellow\'s 1860 poem made the line famous.',
      hints: ['--- is O, -. is N, . is E.', 'Every slash ( / ) is a space between words.', 'It starts: ONE IF BY…'] },
    { id: 'm16', cipher: 'caesar', lang: 'es', key: 10, minAge: 11, keyShown: true, chainTo: 'm17',
      title: 'La Vara Secreta', place: 'Cuartel general',
      brief: 'Spanish alphabet, shift 10. It tells you the rod size for the next mission.',
      plain: 'LA VARA DEL PROXIMO MENSAJE TIENE CUATRO LADOS',
      hints: ['Use the Español wheel (27 letters) at shift 10.', 'U on the paper disc is L on the brass ring.', 'Empieza: LA VARA…'] },
    { id: 'm17', cipher: 'scytale', key: 4, minAge: 11, keyShown: false, chainFrom: 'm16',
      title: 'Crossing the Rubicon', place: 'Northern Italy, 49 BC',
      brief: 'A Latin saying and its English meaning. The rod size is hidden in mission 16.',
      plain: 'ALEA IACTA EST THE DIE IS CAST',
      note: 'Suetonius wrote that Caesar said "Alea iacta est" when he crossed the Rubicon river in 49 BC.',
      hints: ['Mission 16 says the rod has four sides: size 4.', 'Read row 1, then row 2, row 3, row 4.', 'It starts: ALEA IACTA…'] },
    { id: 'm18', cipher: 'sub', lang: 'en', minAge: 11, keyShown: false,
      title: 'The Telegraph Fact', place: 'Codebreakers\' hut',
      brief: 'Every letter was swapped for another — no pattern! Count the letters and compare with normal English.',
      plain: 'IN EIGHTEEN FORTY FOUR SAMUEL MORSE SENT THE FIRST LONG DISTANCE TELEGRAPH MESSAGE FROM WASHINGTON TO BALTIMORE',
      hints: ['The tallest bar is probably E. Then try T, A, O.', 'A 3-letter word that appears twice is probably THE.', 'It starts: IN EIGHTEEN FORTY FOUR…'] },
    { id: 'm19', cipher: 'sub', lang: 'es', minAge: 12, keyShown: false,
      title: 'El Estrecho', place: 'Sur de Chile, 1520',
      brief: 'Sustitución en español. In Spanish, E and A are the most common letters.',
      plain: 'EL ESTRECHO DE MAGALLANES FUE CRUZADO POR PRIMERA VEZ EN EL AÑO MIL QUINIENTOS VEINTE',
      note: 'Fernando de Magallanes sailed through the strait at the south of Chile in 1520, from the Atlantic to the Pacific.',
      hints: ['Compare the tallest bars with E, A, O, S.', 'Two-letter words in Spanish: EL, DE, EN…', 'Empieza: EL ESTRECHO DE…'] }
  ];
  MISSIONS.forEach(function(m) { m.cipherText = encode(m); });

  var CIPHER_INFO = {
    caesar:   { name: 'Caesar Wheel',  es: 'Rueda César',    icon: '🛞' },
    atbash:   { name: 'Atbash Mirror', es: 'Espejo Atbash',  icon: '🪞' },
    pigpen:   { name: 'Pigpen',        es: 'Código Masón',   icon: '#️⃣' },
    morse:    { name: 'Morse Telegraph', es: 'Telégrafo Morse', icon: '📡' },
    polybius: { name: 'Polybius Square', es: 'Cuadro de Polibio', icon: '🔢' },
    scytale:  { name: 'Scytale Rod',   es: 'Escítala',       icon: '🪵' },
    sub:      { name: 'Frequency Lab', es: 'Análisis de frecuencias', icon: '📊' }
  };

  // Skill badges — earned by solving missions of a cipher.
  var BADGES = [
    { id: 'caesar',   name: 'Caesar Cracker',     es: 'Descifrador César', ciphers: ['caesar'],   need: 3 },
    { id: 'mirror',   name: 'Mirror Reader',      es: 'Lector de Espejos', ciphers: ['atbash'],   need: 2 },
    { id: 'pigpen',   name: 'Pigpen Scribe',      es: 'Escriba Masón',     ciphers: ['pigpen'],   need: 2 },
    { id: 'morse',    name: 'Telegraph Operator', es: 'Telegrafista',      ciphers: ['morse'],    need: 3 },
    { id: 'grid',     name: 'Grid Navigator',     es: 'Navegante de Cuadros', ciphers: ['polybius', 'scytale'], need: 3 },
    { id: 'freq',     name: 'Frequency Analyst',  es: 'Analista de Frecuencias', ciphers: ['sub'], need: 1 },
    { id: 'master',   name: 'Master Codebreaker', es: 'Maestro Descifrador', ciphers: null,       need: 19 }
  ];

  // ================================================================
  //  HISTORY CARDS — factual, neutral.
  // ================================================================
  var HISTORY = [
    { id: 'h-caesar', art: 'caesar', year: 'c. 50 BC',
      title: "Julius Caesar's Shift", es: 'El cifrado de César',
      text: [
        'The Roman historian Suetonius, writing about 120 AD in "The Twelve Caesars", says Julius Caesar wrote private letters in a code: each letter was replaced by the one three places later in the alphabet — D for A, E for B, and so on.',
        'Suetonius also says Caesar\'s adopted son Augustus used a shift of just one.',
        'Today any code that slides the alphabet by a fixed number is called a Caesar cipher. With only 25 possible shifts in English, it can be broken by trying them all.'
      ] },
    { id: 'h-scytale', art: 'scytale', year: 'c. 400 BC',
      title: 'The Scytale of Sparta', es: 'La escítala espartana',
      text: [
        'The Greek writer Plutarch describes the scytale (σκυτάλη) used by the leaders of Sparta. A strip of leather or parchment was wound around a wooden staff, and the message was written along its length.',
        'Unwound, the strip showed only a jumble of letters. The general receiving it had a staff of exactly the same thickness, so he could wrap the strip again and read it.',
        'It is one of the oldest known transposition ciphers: the letters stay the same, only their order changes.'
      ] },
    { id: 'h-polybius', art: 'polybius', year: 'c. 150 BC',
      title: 'Polybius and the Torches', es: 'Polibio y las antorchas',
      text: [
        'The Greek historian Polybius described a way to signal letters over long distances with torches. The alphabet was set out in a 5 × 5 square.',
        'The signaller raised torches in one hand for the row and in the other hand for the column. Each letter became a pair of numbers.',
        'The same square is used today for tapping codes and as a building block of other ciphers.'
      ] },
    { id: 'h-atbash', art: 'atbash', year: 'c. 600 BC',
      title: 'Atbash, the Mirror Code', es: 'Atbash, el código espejo',
      text: [
        'Atbash comes from the Hebrew alphabet: the first letter (aleph) swaps with the last (tav), the second (bet) with the second-to-last (shin) — "a-t-b-sh".',
        'The Book of Jeremiah uses the word "Sheshach" (25:26 and 51:41). Scholars note it is "Babel" written in Atbash.',
        'Atbash needs no key at all: encoding and decoding are the very same step.'
      ] },
    { id: 'h-morse', art: 'morse', year: '1844',
      title: 'Morse, Vail and the Telegraph', es: 'Morse, Vail y el telégrafo',
      text: [
        'Samuel F. B. Morse, a painter and inventor, and the machinist Alfred Vail built an electric telegraph and a code of short and long signals in the late 1830s.',
        'On 24 May 1844 Morse sent the first message on the line from the U.S. Capitol in Washington, D.C. to Vail at the Mount Clare station in Baltimore: "What hath God wrought" — words from the Book of Numbers (23:23).',
        'Operators soon learned to read the code by ear from the clicks. Morse code was used on ships and radios for more than 150 years.'
      ] },
    { id: 'h-enigma', art: 'enigma', year: '1932–1945',
      title: 'Enigma and Bletchley Park', es: 'Enigma y Bletchley Park',
      text: [
        'Enigma was a German cipher machine with rotating wheels (rotors). Each key press moved the rotors, so the same letter was encoded differently every time.',
        'The Polish mathematician Marian Rejewski first broke Enigma in 1932. With his colleagues Jerzy Różycki and Henryk Zygalski, the Polish Cipher Bureau shared this work with Britain and France in July 1939.',
        'At Bletchley Park in England, thousands of codebreakers, including Alan Turing and Gordon Welchman, built electromechanical "Bombe" machines to find the daily settings. Tommy Flowers built Colossus, an early electronic computer, in 1944 to break a different German cipher.'
      ] },
    { id: 'h-navajo', art: 'radio', year: '1942–1945',
      title: 'The Navajo Code Talkers', es: 'Los code talkers navajos',
      text: [
        'In 1942 the United States Marine Corps recruited 29 Navajo men to create a code based on the Navajo language, which had no written alphabet in common use and was spoken by very few outsiders.',
        'Words were given code meanings — for example the Navajo word for "turtle" meant a tank. Code talkers could send a message by radio in seconds that took machines much longer.',
        'Several hundred Navajo code talkers served in the Pacific, including at the Battle of Iwo Jima in 1945. The code was never broken. It was kept secret until 1968.'
      ] }
  ];

  var PAPER_IDEAS = [
    'Write a Caesar note for a brother or sister. Tell them the shift — or hide it in a riddle!',
    'Draw the pigpen key on paper, then write a pigpen message under a pillow or in a lunchbox.',
    'Wrap a strip of paper around a pencil, write along it, unwrap it — and give it to someone with the same pencil.',
    'Tap a Morse message on the table with a spoon. Can your family decode it?',
    'Make a paper Caesar wheel: two circles of card, letters around the edge, a pin in the middle.'
  ];

  return {
    ALPHA: ALPHA, normalize: normalize, answerKey: answerKey, checkAnswer: checkAnswer,
    caesar: caesar, atbash: atbash, substitute: substitute, SUB_KEYS: SUB_KEYS,
    MORSE: MORSE, MORSE_REV: MORSE_REV, toMorse: toMorse, fromMorse: fromMorse,
    PIGPEN: PIGPEN, POLY: POLY, polybius: polybius, fromPolybius: fromPolybius,
    scytale: scytale, scytaleRows: scytaleRows, scytaleLetters: scytaleLetters,
    FREQ: FREQ, letterCounts: letterCounts,
    MISSIONS: MISSIONS, CIPHER_INFO: CIPHER_INFO, BADGES: BADGES,
    HISTORY: HISTORY, PAPER_IDEAS: PAPER_IDEAS
  };
})();
