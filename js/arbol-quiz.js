/* ================================================================
   ÁRBOL FAMILIAR — the quiz questions (js/arbol-quiz.js)

   Pure: no DOM and no storage, so the tests can check that every
   question has exactly one right answer drawn from the tree.

   ArbolQuiz.kindsFor(tier)              -> ['who', 'where', ...] by age tier
   ArbolQuiz.round(kind, ctx, n, seed)   -> up to n questions of one kind
   ArbolQuiz.TERMS                       -> relationship words used as wrong answers

   ctx = { store, idx, me, tier, view(id), country(id) -> 'chl'|null,
           countryName(code, lang), alsoCountries: ['chl', ...] }

   A question: { kind, subject, prompt:{es,en}, opts:[{ id?, code?, label:{es,en},
                 sub?, correct }], answer }  (answer = index of the correct option)

   Names shown are the kid-safe view of each person (a living relative is a
   first name only, unless a parent opted in), and a question never uses a
   person the kid is not allowed to see.
   ================================================================ */
(function(root) {
  'use strict';

  var K = (typeof require === 'function' && typeof module !== 'undefined') ? require('./arbol-kin.js') : root.ArbolKin;

  function rngOf(seed) {            // mulberry32
    var a = (seed >>> 0) || 1;
    return function() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pickN(a, n, r) { return shuffle(a, r).slice(0, n); }

  function kindsFor(tier) {
    if (tier === 'beginner') return ['grand'];
    if (tier === 'intermediate') return ['who', 'where', 'term'];
    return ['who', 'where', 'term', 'older'];
  }

  // a label for a person that tells two people with the same first name apart
  function labelOf(v) { return v.name + (v.years ? ' (' + v.years + ')' : ''); }
  function personOpt(v, correct) { return { id: v.id, label: { es: v.name, en: v.name }, sub: v.years || '', correct: !!correct }; }

  function ancestorsOf(ctx, gensMin, gensMax) {
    var d = K.up(ctx.idx, ctx.me, gensMax), out = [], id;
    for (id in d) if (d[id] >= gensMin && d[id] <= gensMax) out.push(id);
    return out;
  }

  // ---- grandparents (the youngest) ------------------------------------
  function qGrand(ctx, r, used) {
    var gps = ancestorsOf(ctx, 2, 2).filter(function(id) { return ctx.idx.P[id].z && !used[id]; });
    if (!gps.length) return null;
    var id = gps[Math.floor(r() * gps.length)], p = ctx.idx.P[id], sex = p.z;
    var near = ancestorsOf(ctx, 1, 3).concat(K.siblings(ctx.idx, ctx.me));
    (ctx.idx.par[ctx.me] || []).forEach(function(pp) { K.siblings(ctx.idx, pp).forEach(function(s) { near.push(s); }); });
    var gSet = {}; ancestorsOf(ctx, 2, 2).forEach(function(g) { gSet[g] = 1; });
    var seen = {}, pool = near.filter(function(x) {
      if (gSet[x] || x === ctx.me || seen[x] || !ctx.idx.P[x] || ctx.idx.P[x].gone) return false;
      seen[x] = 1; return true;
    });
    var v = ctx.view(id), wrong = pickN(pool, 3, r).map(ctx.view);
    if (wrong.length < 1) return null;
    var opts = shuffle([personOpt(v, true)].concat(wrong.map(function(w) { return personOpt(w, false); })), r);
    return {
      kind: 'grand', subject: id,
      prompt: sex === 'M' ? { es: 'Toca a tu abuelo', en: 'Tap your grandfather' } : { es: 'Toca a tu abuela', en: 'Tap your grandmother' },
      opts: opts, answer: opts.findIndex(function(o) { return o.correct; })
    };
  }

  // ---- who was X's father / mother ------------------------------------
  function qWho(ctx, r, used) {
    var cands = ancestorsOf(ctx, 0, 3).concat(K.siblings(ctx.idx, ctx.me)).filter(function(id) {
      if (used[id]) return false;
      var ps = K.parentsOf(ctx.idx, id);
      return ps.some(function(pp) { return pp && ctx.idx.P[pp].z; });
    });
    if (!cands.length) return null;
    var x = cands[Math.floor(r() * cands.length)], ps = K.parentsOf(ctx.idx, x).filter(function(pp) { return pp && ctx.idx.P[pp].z; });
    var ans = ps[Math.floor(r() * ps.length)], sex = ctx.idx.P[ans].z, vx = ctx.view(x), va = ctx.view(ans);
    // wrong answers: others of the same sex, close in age to the right one when we know it
    var skip = {}; skip[x] = 1; skip[ans] = 1;
    (ctx.idx.par[x] || []).forEach(function(pp) { skip[pp] = 1; });
    var down = {}; (function walk(id, d) { if (d > 4) return; (ctx.idx.kids[id] || []).forEach(function(c) { down[c] = 1; walk(c, d + 1); }); })(x, 0);
    var by = va.birthYear, pool = [], id;
    for (id in ctx.idx.P) {
      if (skip[id] || down[id] || ctx.idx.P[id].gone || ctx.idx.P[id].z !== sex) continue;
      pool.push(id);
    }
    if (by != null) {
      // people of about the same age as the right answer, so a child is never a choice for "the father of Rosa"
      var ranked = pool.map(function(id) { var v = ctx.view(id); return { id: id, d: v.birthYear == null ? 999 : Math.abs(v.birthYear - by) }; })
                       .sort(function(a, b) { return a.d - b.d; });
      var near = ranked.filter(function(o) { return o.d <= 40; });
      pool = (near.length >= 3 ? near : ranked.slice(0, 3)).slice(0, 40).map(function(o) { return o.id; });
    } else pool = pool.slice(0, 200);
    var chosen = [], labels = {}; labels[labelOf(va)] = 1;
    shuffle(pool, r).forEach(function(id) {
      if (chosen.length >= 3) return;
      var v = ctx.view(id), lab = labelOf(v);
      if (labels[lab]) return;
      labels[lab] = 1; chosen.push(v);
    });
    if (chosen.length < 2) return null;
    var opts = shuffle([personOpt(va, true)].concat(chosen.map(function(v) { return personOpt(v, false); })), r);
    var me = x === ctx.me, word = sex === 'M' ? { es: 'papá', en: 'father' } : { es: 'mamá', en: 'mother' };
    var past = !vx.living;
    return {
      kind: 'who', subject: x,
      prompt: me ? { es: '¿Quién es tu ' + word.es + '?', en: 'Who is your ' + word.en + '?' }
                 : { es: '¿Quién ' + (past ? 'fue ' : 'es ') + (sex === 'M' ? 'el ' : 'la ') + word.es + ' de ' + vx.first + '?', en: 'Who ' + (past ? 'was ' : 'is ') + vx.first + '’s ' + word.en + '?' },
      opts: opts, answer: opts.findIndex(function(o) { return o.correct; })
    };
  }

  // ---- where was X born -------------------------------------------------
  var COMMON = ['chl', 'usa', 'esp', 'ita', 'arg', 'fra', 'deu', 'gbr', 'mex', 'per', 'bra', 'jpn', 'col', 'irl'];
  function qWhere(ctx, r, used) {
    var cands = ancestorsOf(ctx, 0, 4).filter(function(id) { return !used[id] && ctx.country(id); });
    if (!cands.length) return null;
    var x = cands[Math.floor(r() * cands.length)], code = ctx.country(x), vx = ctx.view(x);
    var others = [], seen = {}; seen[code] = 1;
    (ctx.alsoCountries || []).concat(COMMON).forEach(function(c) { if (!seen[c]) { seen[c] = 1; others.push(c); } });
    var inTree = others.filter(function(c) { return (ctx.alsoCountries || []).indexOf(c) >= 0; });
    var rest = others.filter(function(c) { return inTree.indexOf(c) < 0; });
    var wrong = pickN(inTree, 2, r);
    wrong = wrong.concat(pickN(rest, 3 - wrong.length, r)).slice(0, 3);
    function opt(c, ok) { return { code: c, label: { es: ctx.countryName(c, 'es'), en: ctx.countryName(c, 'en') }, correct: ok }; }
    var opts = shuffle([opt(code, true)].concat(wrong.map(function(c) { return opt(c, false); })), r);
    var me = x === ctx.me;
    return {
      kind: 'where', subject: x,
      prompt: me ? { es: '¿En qué país naciste?', en: 'Which country were you born in?' }
                 : { es: '¿En qué país nació ' + vx.first + '?', en: 'Which country was ' + vx.first + ' born in?' },
      opts: opts, answer: opts.findIndex(function(o) { return o.correct; })
    };
  }

  // ---- what is X to you -------------------------------------------------
  var TERMS = [
    { kind: 'blood', key: 'anc', n: 1 }, { kind: 'blood', key: 'anc', n: 2 }, { kind: 'blood', key: 'anc', n: 3 }, { kind: 'blood', key: 'anc', n: 4 },
    { kind: 'blood', key: 'desc', n: 1 }, { kind: 'blood', key: 'desc', n: 2 },
    { kind: 'blood', key: 'sib', half: false }, { kind: 'blood', key: 'uncle', n: 0 }, { kind: 'blood', key: 'uncle', n: 1 },
    { kind: 'blood', key: 'nibling', n: 0 }, { kind: 'blood', key: 'cousin', k: 1, r: 0 }, { kind: 'blood', key: 'cousin', k: 2, r: 0 }
  ];
  function qTerm(ctx, r, used) {
    var cands = K.nearby(ctx.idx, ctx.me, 80).filter(function(id) {
      if (used[id]) return false;
      var x = K.relate(ctx.idx, id, ctx.me);
      if (x.kind !== 'blood') return false;
      // keep the near family: a plain fact every kid can read from the tree
      return x.key === 'anc' ? x.n <= 4 : x.key === 'desc' ? x.n <= 2 : x.key === 'cousin' ? x.k <= 2 && !x.r : x.key === 'uncle' ? x.n <= 1 : true;
    });
    if (!cands.length) return null;
    var x = cands[Math.floor(r() * cands.length)], rl = K.relate(ctx.idx, x, ctx.me), sex = ctx.idx.P[x].z || '';
    var right = { es: K.term(rl, 'es', sex), en: K.term(rl, 'en', sex) };
    var seen = {}; seen[right.en] = 1;
    var pool = TERMS.map(function(t) { return { es: K.term(t, 'es', sex), en: K.term(t, 'en', sex) }; })
      .filter(function(t) { if (seen[t.en]) return false; seen[t.en] = 1; return true; });
    var wrong = pickN(pool, 3, r);
    var opts = shuffle([{ label: right, correct: true }].concat(wrong.map(function(t) { return { label: t, correct: false }; })), r);
    var vx = ctx.view(x);
    return {
      kind: 'term', subject: x,
      prompt: { es: '¿Qué es ' + vx.first + ' para ti?', en: 'What is ' + vx.first + ' to you?' },
      portrait: x, opts: opts, answer: opts.findIndex(function(o) { return o.correct; })
    };
  }

  // ---- who was born first -----------------------------------------------
  function qOlder(ctx, r, used) {
    var pool = ancestorsOf(ctx, 0, 4).concat(K.siblings(ctx.idx, ctx.me)).filter(function(id) { return ctx.view(id).birthYear != null; });
    if (pool.length < 2) return null;
    for (var tries = 0; tries < 40; tries++) {
      var a = pool[Math.floor(r() * pool.length)], b = pool[Math.floor(r() * pool.length)];
      if (a === b || used[a + '|' + b] || used[b + '|' + a]) continue;
      var va = ctx.view(a), vb = ctx.view(b);
      if (Math.abs(va.birthYear - vb.birthYear) < 5 || va.name === vb.name) continue;
      var first = va.birthYear < vb.birthYear ? va : vb;
      var opts = shuffle([personOpt(va, va === first), personOpt(vb, vb === first)], r);
      return {
        kind: 'older', subject: a + '|' + b,
        prompt: { es: '¿Quién nació primero?', en: 'Who was born first?' },
        opts: opts, answer: opts.findIndex(function(o) { return o.correct; })
      };
    }
    return null;
  }

  var MAKERS = { grand: qGrand, who: qWho, where: qWhere, term: qTerm, older: qOlder };

  function round(kind, ctx, n, seed) {
    var r = rngOf(seed == null ? Date.now() : seed), used = {}, out = [], tries = 0, q;
    while (out.length < (n || 5) && tries++ < 60) {
      q = MAKERS[kind](ctx, r, used);
      if (!q) continue;
      used[q.subject] = 1;
      out.push(q);
    }
    return out;
  }

  var api = { kindsFor: kindsFor, round: round, TERMS: TERMS, rngOf: rngOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArbolQuiz = api;
})(typeof window !== 'undefined' ? window : this);
