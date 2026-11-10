/* ================================================================
   CÁLCULO RÁPIDO — engine (calculo-rapido-engine.js)
   The maths of the Sprint and Estimate sections, with no DOM and no
   storage, so the page and the tests compute the same things.

     rng(seed)                   seeded random numbers (the same seed
                                 always gives the same questions)
     sprintQuestion(level, r)    one fact for a level 1..12
     newAdapt / adaptStep        the speed-and-accuracy level ladder
     summarizeRound / pushRound  points and the personal-best list
     estimateStars(guess, truth) how close a Fermi estimate was
     sliderValue / sliderPos     the log scale of the estimate slider
     fmtNum / parseAnswer        numbers for the two languages

   Works in the browser (window.CalculoEngine) and in Node (require).
   ================================================================ */
(function (root) {
  'use strict';

  // ── seeded random numbers (mulberry32) ───────────────────────
  function hashSeed(str) {
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function rng(seed) {
    var a = (typeof seed === 'string' ? hashSeed(seed) : seed) >>> 0;
    var f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = function (lo, hi) { return lo + Math.floor(f() * (hi - lo + 1)); };
    f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
    f.shuffle = function (arr) {
      var o = arr.slice();
      for (var i = o.length - 1; i > 0; i--) {
        var j = Math.floor(f() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t;
      }
      return o;
    };
    return f;
  }

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  // ── numbers ──────────────────────────────────────────────────
  // Rounds to `dec` decimals without the usual 1.005 surprises.
  function round(x, dec) {
    var m = Math.pow(10, dec || 0);
    return Math.round((x + (x >= 0 ? 1 : -1) * 1e-9) * m) / m;
  }

  // 1234.5 -> "1,234.5" (en) or "1.234,5" (es). Numbers under 1000 have no
  // separators. `es` is true for Spanish.
  function fmtNum(x, es) {
    if (!isFinite(x)) return '';
    var neg = x < 0, s = String(Math.abs(round(x, 6)));
    var parts = s.split('.');
    var int = parts[0], dec = parts[1] || '';
    if (int.length > 3) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, es ? '.' : ',');
    return (neg ? '−' : '') + int + (dec ? (es ? ',' : '.') + dec : '');
  }

  // What a kid typed -> a number, or null. Accepts a comma or a point as
  // the decimal mark and ignores spaces.
  function parseAnswer(str) {
    var s = String(str == null ? '' : str).replace(/\s+/g, '').replace(',', '.');
    if (!/^\d+(\.\d+)?$|^\.\d+$/.test(s)) return null;
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  // An answer is right when it is within a hundredth (answers in this app
  // are exact to at most two decimals).
  function checkNumber(guess, truth, tol) {
    if (guess === null || guess === undefined || !isFinite(guess)) return false;
    return Math.abs(guess - truth) <= (tol === undefined ? 0.0101 : tol);
  }

  // ── Sprint ───────────────────────────────────────────────────
  var SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  var MAX_LEVEL = 12;

  // The levels a kid of each age tier can reach, and where they start.
  var TIER_BOUNDS = {
    beginner:     { min: 1, max: 4,  start: 1 },
    intermediate: { min: 2, max: 8,  start: 3 },
    advanced:     { min: 5, max: 12, start: 7 },
    expert:       { min: 7, max: 12, start: 9 }
  };

  // Seconds a quick answer takes, by level (index = level).
  var TARGET_SEC = [0, 8, 8, 8, 9, 9, 7, 7, 7, 8, 9, 12, 14];

  var LEVEL_NAMES = [
    '',
    ['Sumas hasta 5', 'Adding to 5'],
    ['Sumas hasta 10', 'Adding to 10'],
    ['Sumas y restas hasta 10', 'Adding and taking away to 10'],
    ['Sumas y restas hasta 20', 'Adding and taking away to 20'],
    ['Sumas y restas hasta 100', 'Adding and taking away to 100'],
    ['Tablas del 2, 5 y 10', 'Tables of 2, 5 and 10'],
    ['Tablas del 2 al 5 y decenas', 'Tables 2 to 5 and tens'],
    ['Tablas del 2 al 9 y divisiones', 'Tables 2 to 9 and division'],
    ['Tablas hasta 12 y sumas de 2 cifras', 'Tables to 12 and two-digit sums'],
    ['Cálculo con centenas', 'Hundreds and mixed facts'],
    ['Multiplicar por una cifra', 'Times a one-digit number'],
    ['Cálculo mental avanzado', 'Advanced mental maths']
  ];

  function _mk(level, a, op, b, answer) {
    return { level: level, a: a, op: op, b: b, answer: answer,
             text: a + ' ' + SYM[op] + ' ' + b + ' = ?' };
  }
  function _add(level, a, b) { return _mk(level, a, '+', b, a + b); }
  function _sub(level, a, b) { return _mk(level, a, '-', b, a - b); }
  function _mul(level, a, b, r) {
    // the order is shuffled, the product is not
    return (r && r() < 0.5) ? _mk(level, b, '*', a, a * b) : _mk(level, a, '*', b, a * b);
  }
  function _div(level, d, q) { return _mk(level, d * q, '/', d, q); }

  function _twoDigit(level, r) {
    if (r() < 0.5) { var a = r.int(11, 89); return _add(level, a, r.int(11, 100 - a)); }
    var c = r.int(30, 99); return _sub(level, c, r.int(11, c - 1));
  }
  function _threeRound(level, r) {
    var step = r() < 0.5 ? 10 : 100;
    if (r() < 0.5) { var a = r.int(101, 899); return _add(level, a, step * r.int(1, Math.floor((999 - a) / step))); }
    var c = r.int(150, 999); return _sub(level, c, step * r.int(1, Math.floor((c - 1) / step)));
  }

  // One fact. `r` is a seeded generator; `level` 1..12.
  function sprintQuestion(level, r) {
    level = clamp(Math.round(level) || 1, 1, MAX_LEVEL);
    var a, b, x = r();
    switch (level) {
      case 1:
        a = r.int(1, 4); return _add(1, a, r.int(1, 5 - a));
      case 2:
        a = r.int(1, 9); return _add(2, a, r.int(1, 10 - a));
      case 3:
        if (x < 0.5) { a = r.int(2, 8); return _add(3, a, r.int(1, 10 - a)); }
        a = r.int(3, 10); return _sub(3, a, r.int(1, a - 1));
      case 4:
        if (x < 0.5) { a = r.int(2, 18); return _add(4, a, r.int(2, 20 - a)); }
        a = r.int(11, 20); return _sub(4, a, r.int(2, a - 1));
      case 5:
        if (x < 0.5) return _add(5, r.int(11, 91), r.int(2, 9));
        return _sub(5, r.int(20, 99), r.int(2, 9));
      case 6:
        return _mul(6, r.pick([2, 5, 10]), r.int(1, 10), r);
      case 7:
        if (x < 0.5) return _mul(7, r.pick([2, 3, 4, 5]), r.int(2, 10), r);
        if (r() < 0.5) { a = r.int(11, 89); return _add(7, a, 10 * r.int(1, Math.floor((100 - a) / 10))); }
        a = r.int(31, 99); return _sub(7, a, 10 * r.int(1, Math.floor((a - 1) / 10)));
      case 8:
        if (x < 0.6) return _mul(8, r.int(2, 9), r.int(2, 9), r);
        return _div(8, r.int(2, 9), r.int(2, 9));
      case 9:
        if (x < 0.4) return _mul(9, r.int(2, 12), r.int(2, 12), r);
        if (x < 0.7) return _div(9, r.int(2, 12), r.int(2, 12));
        return _twoDigit(9, r);
      case 10:
        if (x < 0.35) return _threeRound(10, r);
        if (x < 0.55) return _mul(10, r.int(6, 12), r.int(6, 12), r);
        if (x < 0.7) return _div(10, r.int(6, 12), r.int(6, 12));
        return _twoDigit(10, r);
      case 11:
        if (x < 0.4) return _mul(11, r.int(12, 49), r.int(2, 9), r);
        if (x < 0.7) return _div(11, r.int(2, 9), r.int(11, 49));
        if (r() < 0.5) return _add(11, r.int(101, 899), r.int(11, 99));
        return _sub(11, r.int(120, 999), r.int(11, 99));
      default:
        if (x < 0.35) return _mul(12, r.int(12, 30), r.pick([11, 12, 15, 20, 25]), r);
        if (x < 0.65) {
          if (r() < 0.5) { a = r.int(101, 890); return _add(12, a, r.int(101, 999 - a)); }
          a = r.int(250, 999); return _sub(12, a, r.int(101, a - 1));
        }
        return _div(12, r.pick([11, 12, 15, 25]), r.int(11, 30));
    }
  }

  // A different fact from the last one.
  function nextQuestion(level, r, prevText) {
    var q = sprintQuestion(level, r), n = 0;
    while (q.text === prevText && n++ < 8) q = sprintQuestion(level, r);
    return q;
  }

  // Four answers to pick from (for kids who do not type yet): the right
  // one and three close to it, never below zero, never the same twice.
  function choicesFor(answer, r) {
    var pool = [];
    for (var d = 1; d <= 4; d++) {
      if (answer - d >= 0) pool.push(answer - d);
      pool.push(answer + d);
    }
    var picked = [answer], shuffled = r.shuffle(pool);
    for (var i = 0; i < shuffled.length && picked.length < 4; i++) {
      if (picked.indexOf(shuffled[i]) < 0) picked.push(shuffled[i]);
    }
    return picked.sort(function (x, y) { return x - y; });
  }

  // ── the level ladder ─────────────────────────────────────────
  // Four quick right answers in a row move the kid up (the level they
  // left counts as mastered); two wrong in a row move them down.
  function boundsFor(tier) { return TIER_BOUNDS[tier] || TIER_BOUNDS.intermediate; }

  function newAdapt(tier, savedLevel) {
    var b = boundsFor(tier);
    var lvl = savedLevel > 0 ? savedLevel : b.start;
    return { level: clamp(Math.round(lvl), b.min, b.max), min: b.min, max: b.max,
             fast: 0, miss: 0, mastered: 0 };
  }

  // Returns +1, -1 or 0 (the level change this answer caused).
  function adaptStep(st, correct, ms) {
    if (correct) {
      st.miss = 0;
      if (ms <= TARGET_SEC[st.level] * 1000) st.fast++;
    } else {
      st.fast = 0;
      st.miss++;
    }
    if (st.fast >= 4) {
      st.mastered = Math.max(st.mastered, st.level);
      st.fast = 0;
      if (st.level < st.max) { st.level++; return 1; }
      return 0;
    }
    if (st.miss >= 2) {
      st.miss = 0;
      if (st.level > st.min) { st.level--; return -1; }
    }
    return 0;
  }

  // ── rounds and the personal best ─────────────────────────────
  // Each right answer is worth its level in points, so harder facts score
  // more and the score can be compared round to round.
  function pointsFor(level) { return level; }

  // answers: [{ level, correct }] -> the round's totals
  function summarizeRound(answers) {
    var s = { right: 0, wrong: 0, points: 0, maxLevel: 0, accuracy: 0 };
    answers.forEach(function (a) {
      if (a.correct) { s.right++; s.points += pointsFor(a.level); s.maxLevel = Math.max(s.maxLevel, a.level); }
      else s.wrong++;
    });
    var n = s.right + s.wrong;
    s.accuracy = n ? Math.round(100 * s.right / n) : 0;
    return s;
  }

  var KEEP_ROUNDS = 30;

  // Adds a round ({ d: 'YYYY-MM-DD', p: points, c: right, w: wrong, l: level })
  // and keeps the latest KEEP_ROUNDS.
  function pushRound(list, round) {
    var out = (Array.isArray(list) ? list : []).concat([round]);
    return out.slice(-KEEP_ROUNDS);
  }

  // The best score in the list (0 when empty). `best` is a stored record that
  // may be higher than anything still in the list.
  function personalBest(list, best) {
    var b = best | 0;
    (list || []).forEach(function (r) { if (r && r.p > b) b = r.p; });
    return b;
  }

  // ── Estimate it ──────────────────────────────────────────────
  // How far off, as a factor: 1 is perfect, 2 means double or half.
  function estimateFactor(guess, truth) {
    if (!(guess > 0) || !(truth > 0)) return Infinity;
    return Math.max(guess / truth, truth / guess);
  }

  // Forgiving on purpose: within half again 3 stars, within double or half
  // 2 stars, within four times 1 star.
  function estimateStars(guess, truth) {
    var f = estimateFactor(guess, truth);
    return f <= 1.5 ? 3 : f <= 2 ? 2 : f <= 4 ? 1 : 0;
  }

  // The slider is a log scale: every step is the same factor, so the same
  // slider works for 2 minutes and for 4,300 kilometres.
  var SLIDER_STEPS = 1000;

  function _nice(v) {
    // two significant figures, so the number on the slider is easy to say
    if (v <= 0) return 0;
    var mag = Math.pow(10, Math.floor(Math.log(v) / Math.LN10) - 1);
    return Math.round(v / mag) * mag;
  }

  function sliderValue(pos, min, max) {
    pos = clamp(pos, 0, SLIDER_STEPS);
    if (pos <= 0) return min;
    if (pos >= SLIDER_STEPS) return max;
    return clamp(_nice(min * Math.pow(max / min, pos / SLIDER_STEPS)), min, max);
  }

  function sliderPos(value, min, max) {
    value = clamp(value, min, max);
    return Math.round(SLIDER_STEPS * Math.log(value / min) / Math.log(max / min));
  }

  // ── reply choices for a missed numeric item (Repaso) ─────────
  // Plain text, deterministic from the answer: the answer and three others
  // that a slip of the mind would give (off by one, by ten, or doubled).
  function numericChoices(answer, seed) {
    var r = rng(seed || String(answer));
    var cands = [answer + 1, answer - 1, answer + 10, answer - 10, answer * 2, answer / 2, answer + 2, answer - 2]
      .map(function (c) { return round(c, 2); });
    cands = r.shuffle(cands.filter(function (c) { return c > 0 && c !== answer; }));
    var out = [answer];
    cands.forEach(function (c) { if (out.length < 4 && out.indexOf(c) < 0) out.push(c); });
    var k = 3;
    while (out.length < 4) { if (out.indexOf(round(answer + k, 2)) < 0) out.push(round(answer + k, 2)); k++; }
    return r.shuffle(out);
  }

  var api = {
    hashSeed: hashSeed, rng: rng, clamp: clamp, round: round,
    fmtNum: fmtNum, parseAnswer: parseAnswer, checkNumber: checkNumber,
    SYM: SYM, MAX_LEVEL: MAX_LEVEL, TIER_BOUNDS: TIER_BOUNDS, TARGET_SEC: TARGET_SEC, LEVEL_NAMES: LEVEL_NAMES,
    sprintQuestion: sprintQuestion, nextQuestion: nextQuestion, choicesFor: choicesFor,
    boundsFor: boundsFor, newAdapt: newAdapt, adaptStep: adaptStep,
    pointsFor: pointsFor, summarizeRound: summarizeRound, pushRound: pushRound, personalBest: personalBest,
    KEEP_ROUNDS: KEEP_ROUNDS,
    estimateFactor: estimateFactor, estimateStars: estimateStars,
    SLIDER_STEPS: SLIDER_STEPS, sliderValue: sliderValue, sliderPos: sliderPos,
    numericChoices: numericChoices
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CalculoEngine = api;
})(typeof window !== 'undefined' ? window : this);
