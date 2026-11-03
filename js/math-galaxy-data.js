/* ================================================================
   MATH GALAXY — ranks, sectors, skills and question generators
   (js/math-galaxy-data.js)

   Each rank is one world on the route. Each world has four sectors
   (levels) and a boss round that mixes every skill of that world.
   A generator returns one question:
     { skill, label, text, answer, options?, mode:'choice'|'build',
       vis:{type,…}, check?(value), explain }
   Facts shown about the worlds are plain astronomy facts.
   ================================================================ */

var MGData = (function() {
  'use strict';

  /* ---------- helpers ---------- */
  function R(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[R(0, a.length - 1)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = R(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
  var MINUS = '−';
  function sn(n) { return n < 0 ? MINUS + Math.abs(n) : String(n); }          // signed number
  function pn(n) { return n < 0 ? '(' + MINUS + Math.abs(n) + ')' : String(n); } // parenthesised negative
  function fmt(n) {
    var neg = n < 0; n = Math.abs(n);
    var s = (Math.round(n * 100) / 100).toString().split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? MINUS : '') + s.join('.');
  }
  function money(n) { return '$' + fmt(n); }

  // Numeric options near the answer (unique, within [lo,hi]), shuffled.
  function near(ans, lo, hi, extra, show) {
    show = show || String;
    var set = [ans];
    (extra || []).forEach(function(e) { if (typeof e === 'number' && e === Math.round(e) && e !== ans && e >= lo && e <= hi && set.indexOf(e) < 0 && set.length < 4) set.push(e); });
    var spread = Math.max(2, Math.round(Math.abs(ans) * 0.2));
    var guard = 0;
    while (set.length < 4 && guard++ < 200) {
      var d = ans + (R(0, 1) ? 1 : -1) * R(1, spread + (guard > 40 ? 5 : 0));
      if (d >= lo && d <= hi && set.indexOf(d) < 0) set.push(d);
    }
    var f = lo;
    while (set.length < 4) { if (set.indexOf(f) < 0) set.push(f); f++; }
    return shuffle(set).map(show);
  }
  function strOpts(ans, list) {
    var out = [ans];
    list.forEach(function(x) { if (out.indexOf(x) < 0 && out.length < 4) out.push(x); });
    return shuffle(out);
  }

  /* ================================================================
     SKILLS
     ================================================================ */
  var SK = {};
  function skill(id, rank, name, es, gen) { SK[id] = { id: id, rank: rank, name: name, es: es, gen: gen }; }

  /* ---------------- CADET · The Moon ---------------- */
  skill('count10', 'cadet', 'Counting to 10', 'Contar hasta 10', function(h) {
    var n = R(h ? 5 : 1, h ? 10 : 8);
    if (R(0, 1) || h) {
      return { label: 'Load the stars', text: 'Put ' + n + ' stars in the frame.', answer: n, mode: 'build',
        vis: { type: 'tenframe', mode: 'build', target: n, frames: 1 }, check: function(v) { return v === n; },
        explain: n > 5 ? 'One full row is 5, and ' + (n - 5) + ' more makes ' + n + '.' : n + ' stars in the top row.', say: 'Put ' + n + ' stars in the frame.' };
    }
    return { label: 'Count the stars', text: 'How many stars?', answer: n, options: near(n, 1, 10), mode: 'choice',
      vis: { type: 'tenframe', mode: 'count', a: n }, explain: 'Count them one by one: there are ' + n + '.', say: 'How many stars?' };
  });
  skill('add10', 'cadet', 'Adding to 10', 'Sumar hasta 10', function(h) {
    var a = R(1, h ? 7 : 5), b = R(1, Math.max(1, Math.min(5, 10 - a)));
    return { label: 'Star addition', text: a + ' + ' + b + ' = ?', answer: a + b, options: near(a + b, 1, 10), mode: 'choice',
      vis: { type: 'tenframe', mode: 'add', a: a, b: b }, explain: a + ' gold and ' + b + ' blue make ' + (a + b) + '.', say: a + ' plus ' + b };
  });
  skill('sub10', 'cadet', 'Taking away', 'Restar', function(h) {
    var a = R(h ? 6 : 3, 10), b = R(1, a - 1);
    return { label: 'Send stars away', text: a + ' ' + MINUS + ' ' + b + ' = ?', answer: a - b, options: near(a - b, 0, 10), mode: 'choice',
      vis: { type: 'tenframe', mode: 'sub', a: a, take: b }, explain: a + ' stars, ' + b + ' fly away, ' + (a - b) + ' stay.', say: a + ' take away ' + b };
  });
  skill('compare10', 'cadet', 'More or fewer', 'Más o menos', function() {
    var a = R(1, 10), b = R(1, 10); while (b === a) b = R(1, 10);
    return { label: 'Which ship has more?', text: 'Ship A or ship B?', answer: a > b ? 'A' : 'B', options: ['A', 'B'], mode: 'choice',
      vis: { type: 'tenframe', mode: 'compare', a: a, b: b }, explain: 'A has ' + a + ', B has ' + b + '. ' + Math.max(a, b) + ' is more.', say: 'Which ship has more stars?' };
  });
  var SHAPE_LIST = [
    { id: 'triangle', name: 'Triangle', c: 3 }, { id: 'square', name: 'Square', c: 4 }, { id: 'rectangle', name: 'Rectangle', c: 4 },
    { id: 'pentagon', name: 'Pentagon', c: 5 }, { id: 'hexagon', name: 'Hexagon', c: 6 }, { id: 'circle', name: 'Circle', c: 0 }
  ];
  skill('shapes', 'cadet', 'Shapes', 'Figuras', function(h) {
    var s = pick(h ? SHAPE_LIST : SHAPE_LIST.slice(0, 4).concat([SHAPE_LIST[5]]));
    if (s.id !== 'circle' && R(0, 1)) {
      return { label: 'Space panel', text: 'How many corners?', answer: s.c, options: near(s.c, 0, 8, [s.c + 1, s.c - 1]), mode: 'choice',
        vis: { type: 'shape', shape: s.id }, explain: 'A ' + s.name.toLowerCase() + ' has ' + s.c + ' corners.', say: 'How many corners does this shape have?' };
    }
    var names = SHAPE_LIST.map(function(x) { return x.name; }).filter(function(n) { return n !== s.name && !(s.id === 'square' && n === 'Rectangle') && !(s.id === 'rectangle' && n === 'Square'); });
    return { label: 'Space panel', text: 'What is this shape called?', answer: s.name, options: strOpts(s.name, shuffle(names)), mode: 'choice',
      vis: { type: 'shape', shape: s.id }, explain: s.id === 'circle' ? 'A circle is round with no corners.' : 'It has ' + s.c + ' corners: a ' + s.name.toLowerCase() + '.', say: 'What is this shape called?' };
  });

  /* ---------------- EXPLORER · Mars ---------------- */
  skill('add20', 'explorer', 'Adding to 20', 'Sumar hasta 20', function(h) {
    var a = R(6, 9), b = R(11 - a, 9);
    var fill = 10 - a;
    return { label: 'Make ten', text: a + ' + ' + b + ' = ?', answer: a + b, options: near(a + b, 10, 20, [a + b - 1, a + b + 1, a + b - 10]), mode: 'choice',
      vis: { type: 'tenframe', mode: 'add', a: a, b: b, frames: 2 },
      explain: 'Make ten: ' + a + ' + ' + fill + ' = 10, then ' + (b - fill) + ' more is ' + (a + b) + '.' };
  });
  skill('sub20', 'explorer', 'Subtracting to 20', 'Restar hasta 20', function(h) {
    var a = R(11, 20), b = R(2, 9); if (a - b < 1) b = a - 1;
    var ans = a - b;
    var hops = (ans < 10 && a > 10) ? [{ from: a, to: 10 }, { from: 10, to: ans }] : [{ from: a, to: ans }];
    var ex = (ans < 10 && a > 10) ? a + ' ' + MINUS + ' ' + (a - 10) + ' = 10, then ' + MINUS + ' ' + (b - (a - 10)) + ' more is ' + ans + '.' : 'Hop back ' + b + ' from ' + a + ' to land on ' + ans + '.';
    if (R(0, 1) || h) {
      return { label: 'Hop back', text: 'Start at ' + a + '. Hop back ' + b + '. Where do you land?', answer: ans, mode: 'build',
        vis: { type: 'numberline', min: 0, max: 20, start: a, hops: hops, answer: ans, mode: 'build' }, check: function(v) { return v === ans; }, explain: ex };
    }
    return { label: 'Subtraction', text: a + ' ' + MINUS + ' ' + b + ' = ?', answer: ans, options: near(ans, 0, 20, [ans + 1, ans - 1, a + b > 20 ? ans + 2 : a + b]), mode: 'choice',
      vis: { type: 'numberline', min: 0, max: 20, start: a, hops: hops, answer: ans }, explain: ex };
  });
  skill('place2', 'explorer', 'Tens and ones', 'Decenas y unidades', function(h) {
    var n = R(11, 99), t = Math.floor(n / 10), o = n % 10;
    if (o === 0) { n += 3; o = 3; }
    if (R(0, 1) || h) {
      return { label: 'Build the number', text: 'Build ' + n + ' with rods and cubes.', answer: n, mode: 'build',
        vis: { type: 'blocks', mode: 'build', target: n, groups: [0] }, check: function(v) { return v === n; },
        explain: n + ' = ' + t + ' tens and ' + o + ' ones.' };
    }
    var flip = o * 10 + t;
    return { label: 'Read the blocks', text: 'What number do the blocks show?', answer: n, options: near(n, 10, 99, [flip !== n && o > 0 ? flip : n + 10, n + 10, n - 1]), mode: 'choice',
      vis: { type: 'blocks', mode: 'show', groups: [n] }, explain: t + ' tens = ' + t * 10 + ', and ' + o + ' ones: ' + n + '.' };
  });
  skill('add2d', 'explorer', 'Two-digit adding', 'Sumar con dos cifras', function(h) {
    var a, b, guard = 0;
    do { a = R(12, 58); b = R(11, 39); } while (h && (a % 10 + b % 10 < 10) && guard++ < 50);
    var ta = Math.floor(a / 10) + Math.floor(b / 10), oa = a % 10 + b % 10;
    return { label: 'Cargo count', text: a + ' + ' + b + ' = ?', answer: a + b, options: near(a + b, 20, 120, [a + b - 10, a + b + 10, ta * 10 + (oa % 10)]), mode: 'choice',
      vis: { type: 'blocks', mode: 'add', groups: [a, b] },
      explain: ta + ' tens + ' + oa + ' ones' + (oa >= 10 ? ' → bundle 10 ones into a ten' : '') + ' = ' + (a + b) + '.' };
  });
  skill('skip', 'explorer', 'Skip counting', 'Contar de a saltos', function(h) {
    var step = pick(h ? [2, 3, 4, 5, 10] : [2, 5, 10]), start = step * R(0, 3);
    var seq = [0, 1, 2, 3, 4].map(function(i) { return start + i * step; });
    var miss = R(2, 4), ans = seq[miss];
    var shown = seq.map(function(v, i) { return i === miss ? '?' : v; }).join(', ');
    var hops = []; for (var i = 0; i < 4; i++) hops.push({ from: seq[i], to: seq[i + 1], label: '+' + step });
    var max = Math.max(20, Math.ceil(seq[4] / 10) * 10);
    return { label: 'Beacon pattern', text: shown, answer: ans, options: near(ans, 0, max + 10, [ans + 1, ans - 1, ans + step]), mode: 'choice',
      vis: { type: 'numberline', min: 0, max: max, hops: hops, start: seq[0], answer: ans, labelEvery: max > 40 ? 10 : (max > 24 ? 5 : 2) },
      explain: 'Each hop adds ' + step + ': ' + seq.join(', ') + '.' };
  });
  skill('compare100', 'explorer', 'Comparing numbers', 'Comparar números', function() {
    var a = R(10, 99), b = R(10, 99);
    if (R(0, 3) === 0) b = a; else if (R(0, 1)) b = Math.floor(a / 10) * 10 + R(0, 9);
    var sym = a > b ? '>' : a < b ? '<' : '=';
    var markers = a === b ? [{ v: a, label: String(a), color: '#F472B6' }] : [{ v: a, label: String(a), color: '#F472B6' }, { v: b, label: String(b), color: '#67E8F9' }];
    return { label: 'Which sign?', text: a + '  ◻  ' + b, answer: sym, options: ['<', '=', '>'], mode: 'choice',
      vis: { type: 'numberline', min: 0, max: 100, markers: markers, labelEvery: 10 },
      explain: a === b ? 'They are the same: ' + a + ' = ' + b + '.' : (a > b ? a + ' is further right, so ' + a + ' > ' + b + '.' : a + ' is further left, so ' + a + ' < ' + b + '.') };
  });
  skill('missing', 'explorer', 'Missing number', 'Número que falta', function(h) {
    var a = R(3, h ? 15 : 10), x = R(2, 9);
    return { label: 'Balance the scale', text: a + ' + ? = ' + (a + x), answer: x, options: near(x, 0, 20, [a + x, x + 1, x - 1]), mode: 'choice',
      vis: { type: 'balance', a: 1, b: a, c: a + x, sym: '?' }, explain: 'Take ' + a + ' off both sides: ? = ' + (a + x) + ' ' + MINUS + ' ' + a + ' = ' + x + '.' };
  });

  /* ---------------- PILOT · Jupiter ---------------- */
  skill('mult', 'pilot', 'Times tables', 'Tablas de multiplicar', function(h) {
    var a = R(2, h ? 10 : 9), b = R(2, h ? 10 : 9);
    var sk = [1, 2, 3].map(function(k) { return k * b; }).join(', ');
    if (R(0, 2) === 0) {
      return { label: 'Build an array', text: 'Make an array for ' + a + ' × ' + b + '.', answer: a * b, mode: 'build',
        vis: { type: 'array', mode: 'build', rows: a, cols: b, maxR: 10, maxC: 10 }, check: function(v) { return (v.rows === a && v.cols === b) || (v.rows === b && v.cols === a); },
        explain: a + ' rows of ' + b + ' = ' + a * b + '.' };
    }
    return { label: 'Multiplication', text: a + ' × ' + b + ' = ?', answer: a * b, options: near(a * b, 1, 120, [a * b + b, a * b - b, a + b]), mode: 'choice',
      vis: { type: 'array', rows: a, cols: b }, explain: a + ' rows of ' + b + ': skip-count ' + sk + (a > 3 ? '… ' : ', ') + a * b + '.' };
  });
  skill('div', 'pilot', 'Division', 'División', function(h) {
    var g = R(2, 6), each = R(2, h ? 9 : 7), total = g * each;
    return { label: 'Share the cargo', text: total + ' ÷ ' + g + ' = ?', answer: each, options: near(each, 1, 12, [each + 1, each - 1, g]), mode: 'choice',
      vis: { type: 'share', total: total, groups: g }, explain: total + ' shared into ' + g + ' pods is ' + each + ' each, because ' + g + ' × ' + each + ' = ' + total + '.' };
  });
  skill('fracname', 'pilot', 'Naming fractions', 'Nombrar fracciones', function(h) {
    var d = pick([2, 3, 4, 6, 8]), n = R(1, d - 1);
    var ans = n + '/' + d;
    return { label: 'Space pizza', text: 'What fraction of the pizza is left?', answer: ans,
      options: strOpts(ans, shuffle([(d - n) + '/' + d, n + '/' + (d + 1), d + '/' + n, (n + 1) + '/' + d, n + '/' + (d * 2)]).filter(function(x) { return x !== ans; })),
      mode: 'choice', vis: { type: 'fraction', style: 'pizza', num: n, den: d },
      explain: 'The pizza has ' + d + ' equal slices and ' + n + ' are left: ' + ans + '.' };
  });
  skill('fracbuild', 'pilot', 'Making fractions', 'Construir fracciones', function(h) {
    var d = pick([2, 3, 4, 5, 6, 8]), n = R(1, d - 1);
    return { label: 'Charge the energy cell', text: 'Cut the bar into ' + d + ' equal parts and light up ' + n + '. (' + n + '/' + d + ')', answer: n + '/' + d, mode: 'build',
      vis: { type: 'fraction', mode: 'build', target: { num: n, den: d } }, check: function(v) { return v.den === d && v.num === n; },
      explain: 'The bottom number ' + d + ' tells how many equal parts; the top number ' + n + ' tells how many are lit.' };
  });
  skill('fraccompare', 'pilot', 'Comparing fractions', 'Comparar fracciones', function() {
    var A, B;
    if (R(0, 1)) { var x = R(2, 8), y = R(2, 8); while (y === x) y = R(2, 8); A = { num: 1, den: x }; B = { num: 1, den: y }; }
    else { var d = pick([3, 4, 5, 6, 8]), p = R(1, d - 1), q = R(1, d - 1); while (q === p) q = R(1, d - 1); A = { num: p, den: d }; B = { num: q, den: d }; }
    var fa = A.num / A.den, fb = B.num / B.den;
    var sa = A.num + '/' + A.den, sb = B.num + '/' + B.den, ans = fa > fb ? sa : sb;
    var ex = A.num === 1 && B.num === 1 ? 'More parts means smaller parts, so ' + ans + ' is bigger.' : 'Same-size parts: more lit parts is bigger, so ' + ans + ' is bigger.';
    return { label: 'Which is bigger?', text: sa + '  or  ' + sb + '?', answer: ans, options: [sa, sb], mode: 'choice',
      vis: { type: 'fraction', mode: 'compare', num: A.num, den: A.den, b: B }, explain: ex };
  });
  skill('area', 'pilot', 'Area and perimeter', 'Área y perímetro', function(h) {
    var w = R(3, h ? 9 : 7), ht = R(2, h ? 6 : 5);
    if (R(0, 1)) {
      return { label: 'Solar panel area', text: 'How many square tiles cover this ' + w + ' by ' + ht + ' panel?', answer: w * ht, options: near(w * ht, 4, 100, [2 * (w + ht), w + ht, w * ht + w]), mode: 'choice',
        vis: { type: 'grid', w: w, h: ht, mode: 'area' }, explain: 'Area = ' + ht + ' rows of ' + w + ' = ' + w * ht + ' square units.' };
    }
    return { label: 'Fence the panel', text: 'What is the perimeter (the distance all the way round) of a ' + w + ' by ' + ht + ' panel?', answer: 2 * (w + ht), options: near(2 * (w + ht), 4, 60, [w * ht, w + ht, 2 * w + ht]), mode: 'choice',
      vis: { type: 'grid', w: w, h: ht, mode: 'perimeter' }, explain: 'Perimeter = ' + w + ' + ' + ht + ' + ' + w + ' + ' + ht + ' = ' + 2 * (w + ht) + '.' };
  });
  skill('multword', 'pilot', 'Word problems', 'Problemas', function(h) {
    var t = R(0, 2);
    if (t === 0) {
      var a = R(3, 8), b = R(3, 9);
      return { label: 'Cargo bay', text: 'A cargo bay has ' + a + ' rows of ' + b + ' crates. How many crates are there?', answer: a * b, options: near(a * b, 1, 100, [a + b, a * b + a]), mode: 'choice',
        vis: { type: 'array', rows: a, cols: b }, explain: a + ' rows × ' + b + ' crates = ' + a * b + '.' };
    }
    if (t === 1) {
      var g = R(3, 6), each = R(3, 8), tot = g * each;
      return { label: 'Space snacks', text: tot + ' snacks are shared equally by ' + g + ' astronauts. How many does each get?', answer: each, options: near(each, 1, 15, [g, each + 1]), mode: 'choice',
        vis: { type: 'share', total: tot, groups: g }, explain: tot + ' ÷ ' + g + ' = ' + each + '.' };
    }
    var w = R(4, 9), n = R(3, 6);
    return { label: 'Rocket windows', text: 'Each rocket has ' + w + ' windows. How many windows do ' + n + ' rockets have?', answer: w * n, options: near(w * n, 1, 80, [w + n, w * n - w]), mode: 'choice',
      vis: { type: 'array', rows: n, cols: w }, explain: n + ' groups of ' + w + ' = ' + w * n + '.' };
  });

  /* ---------------- COMMANDER · Saturn ---------------- */
  skill('bigmult', 'commander', 'Bigger multiplication', 'Multiplicación grande', function(h) {
    var a = R(12, h ? 99 : 49), b = R(3, 9);
    if (a % 10 === 0) a += R(1, 9);
    var t = Math.floor(a / 10) * 10, o = a % 10;
    return { label: 'Area model', text: a + ' × ' + b + ' = ?', answer: a * b, options: near(a * b, 10, 1000, [t * b + o, t * b, a * b + 10]), mode: 'choice',
      vis: { type: 'areamodel', a: a, b: b }, explain: t + ' × ' + b + ' = ' + t * b + ' and ' + o + ' × ' + b + ' = ' + o * b + '; ' + t * b + ' + ' + o * b + ' = ' + a * b + '.' };
  });
  skill('fracadd', 'commander', 'Adding fractions', 'Sumar fracciones', function(h) {
    if (R(0, 4) < 3) {
      var d = pick([4, 5, 6, 8, 10]), a = R(1, d - 2), b = R(1, d - a);
      var ans = (a + b) + '/' + d;
      return { label: 'Fuel cells', text: a + '/' + d + ' + ' + b + '/' + d + ' = ?', answer: ans,
        options: strOpts(ans, [(a + b) + '/' + (2 * d), (a + b + 1) + '/' + d, (a * b) + '/' + d, (a + b - 1) + '/' + d].filter(function(x) { return x !== ans && x.indexOf('0/') !== 0; })),
        mode: 'choice', vis: { type: 'fraction', mode: 'add', num: a, den: d, b: { num: b, den: d } },
        explain: 'Same-size parts: add the tops and keep the bottom. ' + a + ' + ' + b + ' = ' + (a + b) + ', so ' + ans + (a + b === d ? ' = 1 whole.' : '.') };
    }
    var base = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]]), k = R(2, base[1] > 3 ? 2 : 4);
    var D = base[1] * k, N = base[0] * k;
    return { label: 'Equal fractions', text: base[0] + '/' + base[1] + ' = ?/' + D + '  (light the blue bar to match)', answer: N, mode: 'build',
      vis: { type: 'fraction', mode: 'equiv', ref: { num: base[0], den: base[1] }, fixedDen: D, answer: N }, check: function(v) { return v.num === N; },
      explain: 'Each part of ' + base[1] + ' splits into ' + k + ', so ' + base[0] + '/' + base[1] + ' = ' + N + '/' + D + '.' };
  });
  var DEC_PAIRS = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [1, 25], [6, 25]];
  function dec(n, d) { return String(Math.round(n / d * 1000) / 1000); }
  skill('fracdec', 'commander', 'Fractions to decimals', 'Fracciones a decimales', function() {
    var p = pick(DEC_PAIRS), n = p[0], d = p[1], ans = dec(n, d), hund = Math.round(n / d * 100);
    var wrong = [n < 10 ? String(n / 10) : String(n / 100), String(Math.round(d / n * 100) / 100)];
    DEC_PAIRS.forEach(function(q) { wrong.push(dec(q[0], q[1])); });
    wrong = wrong.filter(function(x) { return x !== ans && !/^0\.\d{4,}/.test(x); });
    return { label: 'Fraction to decimal', text: n + '/' + d + ' = ? (as a decimal)', answer: ans, options: strOpts(ans, [wrong[0]].concat(shuffle(wrong.slice(1)))), mode: 'choice',
      vis: { type: 'hundred', shaded: hund, caption: n + '/' + d + ' = ' + hund + '/100 = ' + ans },
      explain: n + '/' + d + ' = ' + hund + ' hundredths = ' + ans + '.' };
  });
  skill('percent', 'commander', 'Percentages', 'Porcentajes', function(h) {
    var t = R(0, 2);
    if (t === 0) {
      var p = h ? R(3, 97) : R(1, 19) * 5;
      return { label: 'Light the grid', text: 'Light up ' + p + '% of the grid.', answer: p, mode: 'build',
        vis: { type: 'hundred', mode: 'build', target: p }, check: function(v) { return v === p; },
        explain: 'Per cent means "out of 100": ' + p + '% is ' + p + ' squares out of 100.' };
    }
    if (t === 1) {
      var pc = pick([10, 20, 25, 50, 75]), parts = { 10: 10, 20: 5, 25: 4, 50: 2, 75: 4 }[pc], k = R(2, 12), base = parts * k * (pc === 75 ? 1 : 1);
      if (parts === 10) base = 10 * R(2, 20);
      var unit = base / parts, take = pc === 75 ? 3 : 1, ans = unit * take;
      return { label: 'Bar model', text: pc + '% of ' + base + ' = ?', answer: ans, options: near(ans, 1, base, [base - ans, unit, ans * 2]), mode: 'choice',
        vis: { type: 'tape', total: base, parts: [{ n: take, color: 'gold', label: pc + '%' }, { n: parts - take, color: 'grey', label: (100 - pc) + '%', showSum: false }].filter(function(x) { return x.n > 0; }) },
        explain: '100% = ' + base + ' split into ' + parts + ' equal parts of ' + unit + '. ' + pc + '% is ' + take + ' part' + (take > 1 ? 's' : '') + ' = ' + ans + '.' };
    }
    var dv = R(1, 19) * 5, ds = String(dv / 100), ansP = dv + '%';
    return { label: 'Decimal to percent', text: ds + ' = ?%', answer: ansP, options: strOpts(ansP, [(dv / 10) + '%', (dv * 10) + '%', (dv + 5) + '%', (100 - dv) + '%']), mode: 'choice',
      vis: { type: 'hundred', shaded: dv, caption: ds + ' = ' + dv + ' hundredths = ' + dv + '%' }, explain: 'Multiply by 100: ' + ds + ' = ' + dv + '%.' };
  });
  skill('ops', 'commander', 'Order of operations', 'Orden de operaciones', function(h) {
    var t = R(0, 3);
    if (t === 0) {
      var a = R(2, 20), b = R(2, 9), c = R(2, 9), ans = a + b * c;
      return { label: 'Order of operations', text: a + ' + ' + b + ' × ' + c + ' = ?', answer: ans, options: near(ans, 1, 300, [(a + b) * c, ans + c]), mode: 'choice',
        vis: { type: 'steps', steps: [{ q: 'Multiply first: ' + b + ' × ' + c, a: b + ' × ' + c + ' = ' + b * c }, { q: 'Then add ' + a, a: a + ' + ' + b * c + ' = ' + ans }] },
        explain: 'Multiply before adding: ' + b + ' × ' + c + ' = ' + b * c + ', then ' + a + ' + ' + b * c + ' = ' + ans + '.' };
    }
    if (t === 1) {
      var x = R(2, 9), y = R(2, 9), z = R(2, 6), an = (x + y) * z;
      return { label: 'Brackets first', text: '(' + x + ' + ' + y + ') × ' + z + ' = ?', answer: an, options: near(an, 1, 200, [x + y * z, an + z]), mode: 'choice',
        vis: { type: 'steps', steps: [{ q: 'Brackets first: ' + x + ' + ' + y, a: x + ' + ' + y + ' = ' + (x + y) }, { q: 'Then multiply by ' + z, a: (x + y) + ' × ' + z + ' = ' + an }] },
        explain: 'Brackets first: ' + (x + y) + ', then × ' + z + ' = ' + an + '.' };
    }
    if (t === 2) {
      var n = R(2, 10);
      return { label: 'Square numbers', text: n + '² = ?', answer: n * n, options: near(n * n, 1, 150, [2 * n, n * n + n, (n + 1) * (n + 1)]), mode: 'choice',
        vis: { type: 'array', rows: n, cols: n }, explain: n + '² means ' + n + ' × ' + n + ' = ' + n * n + ' — a square array.' };
    }
    var primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37], comps = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 25, 27, 33];
    var p = pick(primes), opts = [p]; while (opts.length < 4) { var cc = pick(comps); if (opts.indexOf(cc) < 0) opts.push(cc); }
    var fac = opts.filter(function(o) { return o !== p; }).map(function(o) { for (var f = 2; f < o; f++) if (o % f === 0) return o + ' = ' + f + ' × ' + o / f; return ''; });
    return { label: 'Prime scan', text: 'Which number is prime?', answer: p, options: shuffle(opts), mode: 'choice',
      vis: { type: 'steps', steps: fac.map(function(s) { var nn = s.split(' ')[0]; return { q: 'Can ' + nn + ' be split into a product?', a: s }; }).concat([{ q: 'What about ' + p + '?', a: p + ' = 1 × ' + p + ' only' }]) },
      explain: 'A prime has exactly two factors, 1 and itself. ' + p + ' = 1 × ' + p + ' only.' };
  });
  skill('data', 'commander', 'Mean, median, mode', 'Media, mediana, moda', function() {
    var t = R(0, 2);
    if (t === 0) {
      var c = R(3, 5), m = R(3, 8), vals = [], rem = m * c;
      for (var i = 0; i < c - 1; i++) { var v = R(Math.max(1, m - 4), Math.min(12, m + 4)); vals.push(v); rem -= v; }
      if (rem < 1 || rem > 12) return SK.data.gen();
      vals.push(rem); shuffle(vals);
      return { label: 'Level the towers', text: 'Mean (average) of ' + vals.join(', ') + '?', answer: m, options: near(m, 1, 20, [m + 1, Math.max.apply(null, vals)]), mode: 'choice',
        vis: { type: 'towers', values: vals, mode: 'mean' }, explain: 'Total ' + m * c + ' ÷ ' + c + ' values = ' + m + '. Levelled towers are all ' + m + ' tall.' };
    }
    if (t === 1) {
      var vs = []; while (vs.length < 5) { var q = R(1, 12); if (vs.indexOf(q) < 0) vs.push(q); }
      var sorted = vs.slice().sort(function(a, b) { return a - b; }), md = sorted[2];
      return { label: 'Find the middle', text: 'Median of ' + vs.join(', ') + '?', answer: md, options: near(md, 1, 12, [vs[2], sorted[1], sorted[3]]), mode: 'choice',
        vis: { type: 'towers', values: vs, mode: 'median' }, explain: 'Sorted: ' + sorted.join(', ') + '. The middle value is ' + md + '.' };
    }
    var ans = R(2, 9), o = []; while (o.length < 2) { var w = R(2, 9); if (w !== ans && o.indexOf(w) < 0) o.push(w); }
    var list = shuffle([ans, ans, ans, o[0], o[1]]);
    return { label: 'Most common', text: 'Mode of ' + list.join(', ') + '?', answer: ans, options: near(ans, 1, 12, o), mode: 'choice',
      vis: { type: 'towers', values: list, mode: 'mode' }, explain: ans + ' appears three times — more than any other value.' };
  });

  /* ---------------- ELITE · Neptune ---------------- */
  function negLine(start, ans, extra) {
    var lo = Math.min(start, ans), hi = Math.max(start, ans);
    var min = Math.min(-10, Math.floor((lo - 2) / 5) * 5), max = Math.max(10, Math.ceil((hi + 2) / 5) * 5);
    if (max - min > 40) { min = Math.max(min, -20); max = Math.min(max, 20); }
    var v = { type: 'numberline', min: min, max: max, start: start, answer: ans, hops: [{ from: start, to: ans }] };
    for (var k in extra) v[k] = extra[k];
    return v;
  }
  skill('neg', 'elite', 'Negative numbers', 'Números negativos', function(h) {
    var t = R(0, h ? 4 : 3);
    if (t === 0) {
      var temp = R(-5, 9), drop = R(3, 14), ans = temp - drop;
      return { label: 'Night on Neptune’s moon', text: 'A thermometer reads ' + sn(temp) + '°C. The temperature drops ' + drop + '°C. What does it read now?', answer: ans, mode: 'build',
        vis: negLine(temp, ans, { mode: 'build' }), check: function(v) { return v === ans; }, explain: sn(temp) + ' ' + MINUS + ' ' + drop + ' = ' + sn(ans) + '°C. Below zero the numbers get more negative.' };
    }
    if (t === 1) {
      var a = R(-15, -1), b = R(2, 20), an = a + b;
      return { label: 'Climb from below zero', text: pn(a) + ' + ' + b + ' = ?', answer: an, mode: 'build',
        vis: negLine(a, an, { mode: 'build' }), check: function(v) { return v === an; }, explain: 'Start at ' + sn(a) + ' and move ' + b + ' to the right: ' + sn(an) + '.' };
    }
    if (t === 2) {
      var x = R(1, 9), y = R(x + 2, x + 14), r = x - y;
      return { label: 'Below zero', text: x + ' ' + MINUS + ' ' + y + ' = ?', answer: sn(r), options: near(r, -30, 30, [y - x, r - 1, r + 1], sn), mode: 'choice',
        vis: negLine(x, r), explain: 'Go ' + x + ' down to 0, then ' + (y - x) + ' more: ' + sn(r) + '.' };
    }
    if (t === 3) {
      var m = R(2, 6), n = R(2, 5), pr = -m * n;
      return { label: 'Negative times', text: pn(-m) + ' × ' + n + ' = ?', answer: sn(pr), options: near(pr, -60, 60, [-pr, pr - m, pr + m], sn), mode: 'choice',
        vis: Math.abs(pr) <= 20 ? { type: 'numberline', min: -20, max: 5, start: 0, answer: pr, hops: Array.apply(null, Array(n)).map(function(_, i) { return { from: -m * i, to: -m * (i + 1), label: MINUS + m }; }) } : null,
        explain: n + ' jumps of ' + sn(-m) + ' = ' + sn(pr) + '. Negative × positive is negative.' };
    }
    var p = R(-10, 8), q = R(1, 9), res = p + q;
    return { label: 'Minus a negative', text: pn(p) + ' ' + MINUS + ' ' + pn(-q) + ' = ?', answer: sn(res), options: near(res, -30, 30, [p - q, -res, res + 1], sn), mode: 'choice',
      vis: negLine(p, res), explain: 'Subtracting a negative is the same as adding: ' + pn(p) + ' + ' + q + ' = ' + sn(res) + '.' };
  });
  skill('ratio', 'elite', 'Ratios', 'Razones', function(h) {
    var t = R(0, 2);
    if (t === 0) {
      var p, q; do { p = R(1, 5); q = R(1, 6); } while (p === q || gcd(p, q) !== 1);
      var k = R(2, h ? 9 : 6), tot = (p + q) * k;
      return { label: 'Fuel mix', text: 'Rocket fuel is mixed blue to white in the ratio ' + p + ':' + q + '. A tank holds ' + tot + ' L of the mix. How many litres are blue?', answer: p * k,
        options: near(p * k, 1, tot, [q * k, tot / p, p + q, k]), mode: 'choice',
        vis: { type: 'tape', total: tot, suf: ' L', parts: [{ n: p, color: 'blue', label: 'blue' }, { n: q, color: 'white', label: 'white' }] },
        explain: p + ' + ' + q + ' = ' + (p + q) + ' parts. ' + tot + ' ÷ ' + (p + q) + ' = ' + k + ' L per part. Blue: ' + p + ' × ' + k + ' = ' + p * k + ' L.' };
    }
    if (t === 1) {
      var r = R(2, 5), f = R(3, 9), m = R(2, 6);
      return { label: 'Scale it up', text: r + ' rockets need ' + f + ' fuel tanks. How many tanks do ' + r * m + ' rockets need?', answer: f * m, options: near(f * m, 1, 200, [f + (r * m - r), r * m, f * m + f]), mode: 'choice',
        vis: { type: 'steps', steps: [{ q: 'How many groups of ' + r + ' rockets?', a: r * m + ' ÷ ' + r + ' = ' + m }, { q: 'Tanks for ' + m + ' groups', a: m + ' × ' + f + ' = ' + f * m }] },
        explain: r * m + ' is ' + m + ' times ' + r + ', so the tanks are ' + m + ' × ' + f + ' = ' + f * m + '.' };
    }
    var kg = R(2, 5), per = R(8, 30) * 100, want = R(2, 7); while (want === kg) want = R(2, 7);
    return { label: 'Unit price', text: kg + ' kg of apples cost ' + money(kg * per) + '. What do ' + want + ' kg cost?', answer: money(want * per),
      options: near(want * per, 100, 100000, [kg * per + (want - kg) * 100, per, want * per + per], money), mode: 'choice',
      vis: { type: 'steps', steps: [{ q: 'Price of 1 kg', a: money(kg * per) + ' ÷ ' + kg + ' = ' + money(per) }, { q: 'Price of ' + want + ' kg', a: want + ' × ' + money(per) + ' = ' + money(want * per) }] },
      explain: 'Find 1 kg first: ' + money(per) + '. Then ' + want + ' × ' + money(per) + ' = ' + money(want * per) + '.' };
  });
  skill('pctchange', 'elite', 'Percent problems', 'Problemas de porcentaje', function(h) {
    var t = R(0, h ? 3 : 2);
    var PARTS = { 10: 10, 20: 5, 25: 4, 50: 2 };
    if (t === 0) {
      var p = pick([10, 20, 25, 50]), parts = PARTS[p], price = parts * R(2, 12) * 500, off = price * p / 100, sale = price - off;
      return { label: 'Sale price', text: 'A jacket costs ' + money(price) + '. It is ' + p + '% off. What is the sale price?', answer: money(sale),
        options: near(sale, 0, price * 2, [off, price + off, price - p * 100], money), mode: 'choice',
        vis: { type: 'tape', total: price, pre: '$', parts: [{ n: parts - 1, color: 'green', label: 'you pay' }, { n: 1, color: 'red', label: p + '% off' }] },
        explain: p + '% of ' + money(price) + ' = ' + money(off) + '. ' + money(price) + ' ' + MINUS + ' ' + money(off) + ' = ' + money(sale) + '.' };
    }
    if (t === 1) {
      var pc = pick([5, 15, 30, 35, 40, 45, 60, 65, 70]), base = R(2, 20) * 20, five = base / 20, ans = five * pc / 5;
      return { label: 'Percent of a number', text: pc + '% of ' + base + ' = ?', answer: ans, options: near(ans, 1, base, [base / 10 * Math.floor(pc / 10), ans + five, pc]), mode: 'choice',
        vis: { type: 'steps', steps: [{ q: 'First find 5% of ' + base, a: base + ' ÷ 20 = ' + five }, { q: pc + '% is ' + pc / 5 + ' lots of 5%', a: pc / 5 + ' × ' + five + ' = ' + ans }] },
        explain: '5% of ' + base + ' is ' + five + ', and ' + pc + '% = ' + pc / 5 + ' × ' + five + ' = ' + ans + '.' };
    }
    if (t === 2) {
      var sv = R(5, 60) * 1000, pr = pick([10, 20, 50]), gain = sv * pr / 100;
      return { label: 'Savings grow', text: 'Sofía has ' + money(sv) + ' saved. Her savings grow by ' + pr + '%. How much does she have now?', answer: money(sv + gain),
        options: near(sv + gain, 0, sv * 3, [gain, sv + pr, sv * 2], money), mode: 'choice',
        vis: { type: 'tape', total: sv, pre: '$', parts: [{ n: 100 / pr, color: 'blue', label: '100% = ' + money(sv), showSum: false }] },
        explain: pr + '% of ' + money(sv) + ' = ' + money(gain) + '. ' + money(sv) + ' + ' + money(gain) + ' = ' + money(sv + gain) + '.' };
    }
    var unit = R(2, 9) * 500, orig = unit * 5, paid = unit * 4;
    return { label: 'Work backwards', text: 'After a 20% discount a toy costs ' + money(paid) + '. What was the original price?', answer: money(orig),
      options: near(orig, 0, orig * 2, [paid + paid / 5, paid * 1.2, paid + 2000], money), mode: 'choice',
      vis: { type: 'tape', total: orig, pre: '$', totalLabel: 'original = ?', parts: [{ n: 4, color: 'green', label: '80% = ' + money(paid), showSum: false }, { n: 1, color: 'red', label: '20% off', showSum: false }] },
      explain: '80% is ' + money(paid) + ', so each 20% part is ' + money(unit) + '. 5 parts = ' + money(orig) + '.' };
  });
  skill('eq', 'elite', 'Equations', 'Ecuaciones', function(h) {
    var a = R(2, h ? 9 : 6), x = R(2, h ? 12 : 9), b = R(0, h ? 20 : 12);
    if (R(0, 3) === 0) b = 0;
    var c = a * x + b;
    var lhs = a + 'x' + (b ? ' + ' + b : '');
    return { label: 'Balance the equation', text: 'Solve for x:  ' + lhs + ' = ' + c, answer: x, options: near(x, 1, 30, [c - b, (c + b) / a === Math.round((c + b) / a) ? (c + b) / a : x + 2, c / a === Math.round(c / a) ? c / a : x - 1]), mode: 'choice',
      vis: { type: 'balance', a: a, b: b, c: c }, explain: (b ? 'Take ' + b + ' off both sides: ' + a + 'x = ' + (c - b) + '. ' : '') + 'Split into ' + a + ' equal groups: x = ' + x + '.' };
  });
  var MULTI = [
    function() {
      var n = R(2, 4), p = R(6, 15) * 100, cost = n * p, bill = [5000, 10000, 20000].filter(function(b) { return b > cost; })[0], ch = bill - cost;
      return { text: 'Ana buys ' + n + ' notebooks at ' + money(p) + ' each and pays with a ' + money(bill) + ' bill. How much change does she get?', answer: ch, show: money, wrong: [cost, bill - p, ch + p],
        steps: [{ q: 'Cost of ' + n + ' notebooks', a: n + ' × ' + money(p) + ' = ' + money(cost) }, { q: 'Change from ' + money(bill), a: money(bill) + ' ' + MINUS + ' ' + money(cost) + ' = ' + money(ch) }] };
    },
    function() {
      var g = R(2, 5), each = R(3, 9), give = R(2, 10), tot = g * each + give;
      return { text: 'A club has ' + tot + ' model rockets. They give ' + give + ' to a school and pack the rest equally into ' + g + ' crates. How many rockets go in each crate?', answer: each, wrong: [tot - give, Math.floor(tot / g), each + 1],
        steps: [{ q: 'Rockets left after giving ' + give, a: tot + ' ' + MINUS + ' ' + give + ' = ' + (tot - give) }, { q: 'Shared into ' + g + ' crates', a: (tot - give) + ' ÷ ' + g + ' = ' + each }] };
    },
    function() {
      var s1 = R(5, 9) * 10, t1 = R(2, 3), s2 = R(4, 8) * 10, t2 = R(1, 2), d = s1 * t1 + s2 * t2;
      return { text: 'A train travels at ' + s1 + ' km/h for ' + t1 + ' hours, then at ' + s2 + ' km/h for ' + t2 + (t2 === 1 ? ' hour' : ' hours') + '. How far does it go in total (km)?', answer: d, wrong: [s1 * t1, s1 + s2, (s1 + s2) * (t1 + t2)],
        steps: [{ q: 'First part', a: s1 + ' × ' + t1 + ' = ' + s1 * t1 + ' km' }, { q: 'Second part', a: s2 + ' × ' + t2 + ' = ' + s2 * t2 + ' km' }, { q: 'Total', a: s1 * t1 + ' + ' + s2 * t2 + ' = ' + d + ' km' }] };
    },
    function() {
      var ad = R(4, 9) * 500, ki = R(2, 6) * 500, na = R(1, 3), nk = R(2, 4), tot = ad * na + ki * nk;
      return { text: 'Planetarium tickets cost ' + money(ad) + ' for adults and ' + money(ki) + ' for children. What do ' + na + (na === 1 ? ' adult' : ' adults') + ' and ' + nk + ' children pay together?', answer: tot, show: money, wrong: [ad + ki, ad * na, (ad + ki) * (na + nk)],
        steps: [{ q: 'Adults', a: na + ' × ' + money(ad) + ' = ' + money(ad * na) }, { q: 'Children', a: nk + ' × ' + money(ki) + ' = ' + money(ki * nk) }, { q: 'Together', a: money(ad * na) + ' + ' + money(ki * nk) + ' = ' + money(tot) }] };
    },
    function() {
      var k = R(2, 4), avg = R(70, 85), d = R(2, 4), need = (avg + d) * (k + 1) - avg * k;
      if (need > 100) return MULTI[0]();
      return { text: 'Your first ' + k + ' test scores average ' + avg + '. What score on the next test makes the average ' + (avg + d) + '?', answer: need, wrong: [avg + d, avg + 2 * d, need - d],
        steps: [{ q: 'Points so far', a: k + ' × ' + avg + ' = ' + k * avg }, { q: 'Points needed for ' + (k + 1) + ' tests', a: (k + 1) + ' × ' + (avg + d) + ' = ' + (k + 1) * (avg + d) }, { q: 'Score on the next test', a: (k + 1) * (avg + d) + ' ' + MINUS + ' ' + k * avg + ' = ' + need }] };
    },
    function() {
      var s = pick([2, 4]), q = R(2, 5) * 100, m = R(2, 4), have = R(1, q * m / 100 - 1) * 100, need = q * m - have;
      return { text: 'A bread recipe for ' + s + ' people uses ' + q + ' g of flour. You cook for ' + s * m + ' people and have ' + have + ' g of flour. How many more grams do you need?', answer: need, wrong: [q * m, q - have > 0 ? q - have : q * m + have, need + q],
        steps: [{ q: 'Flour for ' + s * m + ' people', a: m + ' × ' + q + ' g = ' + q * m + ' g' }, { q: 'Still needed', a: q * m + ' ' + MINUS + ' ' + have + ' = ' + need + ' g' }] };
    },
    function() {
      var w = R(2, 6) * 1000, hv = R(2, 10) * 1000, n = R(3, 9), cost = hv + w * n;
      return { text: 'Tomás saves ' + money(w) + ' a week. He already has ' + money(hv) + '. A telescope costs ' + money(cost) + '. How many weeks until he can buy it?', answer: n, wrong: [cost / w === Math.round(cost / w) ? cost / w : n + 2, n + 1, n - 1],
        steps: [{ q: 'Money still needed', a: money(cost) + ' ' + MINUS + ' ' + money(hv) + ' = ' + money(cost - hv) }, { q: 'Weeks of saving', a: money(cost - hv) + ' ÷ ' + money(w) + ' = ' + n }] };
    },
    function() {
      var L = R(6, 14), W = R(4, 9), path = R(4, 15), left = L * W - path;
      return { text: 'A garden is ' + L + ' m long and ' + W + ' m wide. A path covers ' + path + ' m² of it. How many square metres are left for plants?', answer: left, wrong: [L * W, 2 * (L + W) - path, left + W],
        steps: [{ q: 'Area of the garden', a: L + ' × ' + W + ' = ' + L * W + ' m²' }, { q: 'Minus the path', a: L * W + ' ' + MINUS + ' ' + path + ' = ' + left + ' m²' }] };
    }
  ];
  skill('multistep', 'elite', 'Multi-step problems', 'Problemas de varios pasos', function() {
    var m = pick(MULTI)();
    var show = m.show || String;
    var opts = [m.answer];
    m.wrong.forEach(function(w) { if (w > 0 && opts.indexOf(w) < 0 && w === Math.round(w)) opts.push(w); });
    var g = 1; while (opts.length < 4) { var c = m.answer + g * (m.answer > 50 ? 100 : 1); if (c > 0 && opts.indexOf(c) < 0) opts.push(c); g = g > 0 ? -g : -g + 1; }
    return { label: 'Mission problem', text: m.text, answer: show(m.answer), options: shuffle(opts.slice(0, 4)).map(show), mode: 'choice',
      vis: { type: 'steps', steps: m.steps }, explain: m.steps.map(function(s) { return s.a; }).join('  →  ') };
  });

  /* ================================================================
     RANKS (worlds) and their sectors
     ================================================================ */
  var RANKS = [
    { id: 'cadet', name: 'Cadet', es: 'Cadete', ages: '4–6', planet: 'moon', world: 'The Moon', from: 'earth', color: '#0E7490',
      topics: 'Counting · Adding to 10 · Shapes',
      fact: 'Astronauts first walked on the Moon in July 1969, on the Apollo 11 mission.',
      sectors: [
        { id: '1', name: 'Count the stars', es: 'Cuenta las estrellas', skills: ['count10'] },
        { id: '2', name: 'Add to 10', es: 'Suma hasta 10', skills: ['add10', 'count10'] },
        { id: '3', name: 'Take away', es: 'Quita', skills: ['sub10', 'add10'] },
        { id: '4', name: 'Shapes & more', es: 'Figuras y comparar', skills: ['shapes', 'compare10'] },
        { id: 'boss', name: 'Moon Base Gate', es: 'Puerta de la base lunar', skills: ['count10', 'add10', 'sub10', 'compare10', 'shapes'], boss: true }
      ] },
    { id: 'explorer', name: 'Explorer', es: 'Explorador', ages: '6–8', planet: 'mars', world: 'Mars', from: 'moon', color: '#B45309',
      topics: 'Add & subtract to 20 · Tens & ones · Patterns',
      fact: 'Mars looks red because its dust contains iron oxide — rust. It has two small moons, Phobos and Deimos.',
      sectors: [
        { id: '1', name: 'Make ten', es: 'Forma diez', skills: ['add20'] },
        { id: '2', name: 'Hop back', es: 'Salta hacia atrás', skills: ['sub20', 'add20'] },
        { id: '3', name: 'Tens & ones', es: 'Decenas y unidades', skills: ['place2', 'add2d'] },
        { id: '4', name: 'Patterns & signs', es: 'Patrones y signos', skills: ['skip', 'compare100', 'missing'] },
        { id: 'boss', name: 'Dust Storm Run', es: 'Tormenta de polvo', skills: ['add20', 'sub20', 'place2', 'add2d', 'skip', 'compare100', 'missing'], boss: true }
      ] },
    { id: 'pilot', name: 'Pilot', es: 'Piloto', ages: '8–10', planet: 'jupiter', world: 'Jupiter', from: 'mars', color: '#9A3412',
      topics: 'Multiply · Divide · Fractions · Area',
      fact: 'Jupiter is the largest planet in our Solar System. Its Great Red Spot is a storm wider than Earth.',
      sectors: [
        { id: '1', name: 'Arrays', es: 'Arreglos', skills: ['mult'] },
        { id: '2', name: 'Share the cargo', es: 'Reparte la carga', skills: ['div', 'mult'] },
        { id: '3', name: 'Fractions', es: 'Fracciones', skills: ['fracname', 'fracbuild', 'fraccompare'] },
        { id: '4', name: 'Area & word problems', es: 'Área y problemas', skills: ['area', 'multword'] },
        { id: 'boss', name: 'Storm Belt', es: 'Cinturón de tormentas', skills: ['mult', 'div', 'fracname', 'fracbuild', 'fraccompare', 'area', 'multword'], boss: true }
      ] },
    { id: 'commander', name: 'Commander', es: 'Comandante', ages: '10–12', planet: 'saturn', world: 'Saturn', from: 'jupiter', color: '#6D28D9',
      topics: 'Big numbers · Fractions · Decimals · %',
      fact: 'Saturn’s rings are made mostly of pieces of ice, from tiny grains to chunks as big as a house.',
      sectors: [
        { id: '1', name: 'Area models', es: 'Modelos de área', skills: ['bigmult'] },
        { id: '2', name: 'Fractions & decimals', es: 'Fracciones y decimales', skills: ['fracadd', 'fracdec'] },
        { id: '3', name: 'Percentages', es: 'Porcentajes', skills: ['percent'] },
        { id: '4', name: 'Operations & data', es: 'Operaciones y datos', skills: ['ops', 'data'] },
        { id: 'boss', name: 'Ring Crossing', es: 'Cruce de los anillos', skills: ['bigmult', 'fracadd', 'fracdec', 'percent', 'ops', 'data'], boss: true }
      ] },
    { id: 'elite', name: 'Elite', es: 'Élite', ages: '11–13', planet: 'neptune', world: 'Neptune', from: 'saturn', color: '#1D4ED8',
      topics: 'Negatives · Ratios · % change · Equations · Multi-step',
      fact: 'Neptune is the eighth and farthest planet from the Sun. One Neptune year lasts about 165 Earth years.',
      sectors: [
        { id: '1', name: 'Below zero', es: 'Bajo cero', skills: ['neg'] },
        { id: '2', name: 'Ratios & percent', es: 'Razones y porcentajes', skills: ['ratio', 'pctchange'] },
        { id: '3', name: 'Equations', es: 'Ecuaciones', skills: ['eq'] },
        { id: '4', name: 'Multi-step missions', es: 'Misiones de varios pasos', skills: ['multistep'] },
        { id: 'boss', name: 'The Deep Blue', es: 'El azul profundo', skills: ['neg', 'ratio', 'pctchange', 'eq', 'multistep'], boss: true }
      ] }
  ];

  function rankById(id) { for (var i = 0; i < RANKS.length; i++) if (RANKS[i].id === id) return RANKS[i]; return null; }

  // Build a mission: a list of questions for one sector of one rank.
  function mission(rankId, sectorId, count) {
    var rk = rankById(rankId); if (!rk) return [];
    var sec = rk.sectors.filter(function(s) { return s.id === sectorId; })[0] || rk.sectors[0];
    var h = sec.boss ? 1 : 0;
    var out = [], lastText = {};
    for (var i = 0; i < count; i++) {
      // first skill of a sector is its focus: it gets about half the questions
      var sid = (!sec.boss && i % 2 === 0) ? sec.skills[0] : pick(sec.skills);
      var q = null, guard = 0;
      do { q = SK[sid].gen(h || (i >= count - 2 && !sec.boss ? 1 : 0)); guard++; } while (q && lastText[q.text] && guard < 6);
      lastText[q.text] = 1;
      q.skill = sid;
      out.push(q);
    }
    return out;
  }

  return { RANKS: RANKS, SKILLS: SK, rankById: rankById, mission: mission, fmt: fmt, R: R, shuffle: shuffle };
})();
