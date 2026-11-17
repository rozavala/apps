/* ================================================================
   TRIVIA FAMILIAR — the game engine (js/trivia-engine.js)

   No DOM. Turns the question rows into questions, matches them to each
   player's age, and runs a game night: turns, the steal round, the final
   "everyone plays" round, the scoreboard with the age head start, and
   the history that keeps repeats rare. tests/unit/trivia.spec.js loads
   this file in Node.

   A question row (js/trivia-q-*.js and js/trivia-gen.js):
     [ id, tier, type, qEs, qEn, answer, factEs, factEn, extra ]
       id     'ci-07' — the part before the dash is the subject (CAT_OF)
       tier   1 ages 4–5 · 2 ages 6–8 · 3 ages 9–11 · 4 ages 12 and up
       type   'mc'  multiple choice: answer = [right, wrong, wrong, wrong]
              'tf'  true or false:   answer = true | false
              'ord' put in order:    answer = items in the right order
              'pic' a drawn picture: like 'mc', extra.art names the drawing
              'map' pick on the map: answer = [right, wrong…] map codes
              'snd' name that tune:  like 'mc', extra.tune is a song id
       An answer item is a string (the same in both languages), [es, en],
       or '@art-id' for a picture answer.
       extra  { art, tune, map, s: 'source', o: options for the map }
   ================================================================ */

var TriviaEngine = (function () {
  'use strict';

  var CATS = [
    { id: 'ciencia',   es: 'Ciencia e ingeniería', en: 'Science & engineering', short: ['Ciencia', 'Science'], icon: 'cat-ciencia',  color: '#0E7490' },
    { id: 'mate',      es: 'Matemáticas',          en: 'Math',                  short: ['Mate', 'Math'],       icon: 'cat-mate',     color: '#4338CA' },
    { id: 'geo',       es: 'Geografía',            en: 'Geography',             short: ['Geografía', 'Geography'], icon: 'cat-geo',  color: '#047857' },
    { id: 'historia',  es: 'Historia',             en: 'History',               short: ['Historia', 'History'], icon: 'cat-historia', color: '#92400E' },
    { id: 'chile',     es: 'Chile',                en: 'Chile',                 short: ['Chile', 'Chile'],     icon: 'cat-chile',    color: '#B91C1C' },
    { id: 'fe',        es: 'La fe',                en: 'The faith',             short: ['Fe', 'Faith'],        icon: 'cat-fe',       color: '#A16207' },
    { id: 'biblia',    es: 'La Biblia',            en: 'The Bible',             short: ['Biblia', 'Bible'],    icon: 'cat-biblia',   color: '#7C2D12' },
    { id: 'musica',    es: 'Música',               en: 'Music',                 short: ['Música', 'Music'],    icon: 'cat-musica',   color: '#BE185D' },
    { id: 'arte',      es: 'Arte',                 en: 'Art',                   short: ['Arte', 'Art'],        icon: 'cat-arte',     color: '#C2410C' },
    { id: 'naturaleza', es: 'Naturaleza',          en: 'Nature',                short: ['Naturaleza', 'Nature'], icon: 'cat-naturaleza', color: '#15803D' },
    { id: 'deportes',  es: 'Deportes',             en: 'Sports',                short: ['Deportes', 'Sports'], icon: 'cat-deportes', color: '#1D4ED8' },
    { id: 'navidad',   es: 'Navidad',              en: 'Christmas',             short: ['Navidad', 'Christmas'], icon: 'cat-navidad', color: '#166534' }
  ];
  var CAT_OF = { ci: 'ciencia', ma: 'mate', ge: 'geo', hi: 'historia', cl: 'chile', fe: 'fe', bi: 'biblia',
                 mu: 'musica', ar: 'arte', na: 'naturaleza', de: 'deportes', nv: 'navidad' };
  var TYPES = ['mc', 'tf', 'ord', 'pic', 'map', 'snd'];

  // Points. Every player gets questions for their own age, so a right
  // answer is worth the same to everyone; the head start (on by default)
  // gives the youngest a few points before the first question.
  var POINTS = { right: 10, steal: 5, final: 20 };
  var HEAD_START = { 1: 15, 2: 10, 3: 5, 4: 0 };
  // Gentle timers, in seconds. None for the little ones.
  var TIMER = { 1: 0, 2: 60, 3: 45, 4: 30 };
  var HISTORY_MAX = 700;
  var FINAL_QUESTIONS = 3;

  // ── Helpers ──────────────────────────────────────────────────────
  function pair(x) {
    if (Array.isArray(x)) return { es: String(x[0]), en: String(x[1]) };
    return { es: String(x), en: String(x) };
  }
  function item(x) {
    if (typeof x === 'string' && x.charAt(0) === '@') return { art: x.slice(1) };
    return pair(x);
  }
  function catOf(id) { return CAT_OF[String(id).split('-')[0]] || null; }
  function catById(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return null; }

  // A small seeded random (mulberry32) so a test can replay a game.
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ── Questions ────────────────────────────────────────────────────
  function normalize(row) {
    var x = row[8] || {};
    var q = {
      id: row[0], cat: catOf(row[0]), tier: row[1], type: row[2],
      q: { es: row[3], en: row[4] },
      fact: { es: row[6], en: row[7] },
      src: x.s || '', art: x.art || '', tune: x.tune || null, map: x.map || '', mapOpts: x.o || null
    };
    if (q.type === 'tf') q.truth = row[5] === true;
    else q.items = (row[5] || []).map(item);
    return q;
  }
  function build(rows) {
    var out = [], seen = {};
    (rows || []).forEach(function (r) {
      if (!r || seen[r[0]]) return;
      seen[r[0]] = 1;
      out.push(normalize(r));
    });
    return out;
  }

  // Age → tier. Grown-ups (no age, or 13+) play tier 4.
  function tierOfAge(age) {
    var a = Number(age) || 0;
    if (!a || a >= 12) return 4;
    if (a <= 5) return 1;
    if (a <= 8) return 2;
    return 3;
  }

  // The answer buttons for one question, shuffled. Little ones see three
  // choices instead of four. 'ord' items come back shuffled for sorting.
  function choices(q, tier, rand) {
    rand = rand || Math.random;
    if (q.type === 'tf') return [{ es: 'Verdadero', en: 'True', value: true }, { es: 'Falso', en: 'False', value: false }];
    var items = q.items.map(function (it, i) { var o = {}; for (var k in it) o[k] = it[k]; o.value = i; return o; });
    if (q.type === 'ord') {
      var s = shuffle(items, rand), guard = 0;
      while (guard++ < 8 && s.every(function (it, i) { return it.value === i; })) s = shuffle(items, rand);
      return s;
    }
    var n = tier <= 1 ? 3 : 4;
    return shuffle(items.slice(0, Math.min(n, items.length)), rand);
  }
  function isRight(q, value) {
    if (q.type === 'tf') return value === q.truth;
    if (q.type === 'ord') {
      if (!Array.isArray(value) || value.length !== q.items.length) return false;
      for (var i = 0; i < value.length; i++) if (value[i] !== i) return false;
      return true;
    }
    return value === 0;
  }

  // ── History (so repeats are rare) ───────────────────────────────
  // hist = { id: counter } where counter grows by one per question asked.
  function remember(hist, id) {
    hist = hist && typeof hist === 'object' ? hist : {};
    var top = 0, k;
    for (k in hist) if (hist[k] > top) top = hist[k];
    hist[id] = top + 1;
    var keys = Object.keys(hist);
    if (keys.length > HISTORY_MAX) {
      keys.sort(function (a, b) { return hist[a] - hist[b]; });
      for (var i = 0; i < keys.length - HISTORY_MAX; i++) delete hist[keys[i]];
    }
    return hist;
  }

  // Pick one question for a side: their tier first (then the next tier
  // down, then up), a subject they have had least this game, never one
  // used tonight, and the ones they saw longest ago (or never) first.
  function pick(bank, o) {
    var cats = o.cats && o.cats.length ? o.cats : CATS.map(function (c) { return c.id; });
    var used = o.used || {}, hist = o.hist || {}, rand = o.rand || Math.random;
    var catCount = o.catCount || {}, types = o.types || null, exclude = o.exclude || null;
    var tiers = [o.tier, o.tier - 1, o.tier + 1, o.tier - 2, o.tier + 2, o.tier - 3, o.tier + 3].filter(function (t) { return t >= 1 && t <= 4; });
    for (var ti = 0; ti < tiers.length; ti++) {
      var pool = bank.filter(function (q) {
        return q.tier === tiers[ti] && cats.indexOf(q.cat) >= 0 && !used[q.id] &&
          (!types || types.indexOf(q.type) >= 0) && (!exclude || exclude.indexOf(q.type) < 0) &&
          (!o.canPlay || o.canPlay(q));
      });
      if (!pool.length) continue;
      // Questions nobody here has seen come first, from any chosen subject.
      var unseen = pool.filter(function (q) { return !hist[q.id]; });
      if (unseen.length) pool = unseen;
      // Subject with the fewest questions so far tonight.
      var have = {};
      pool.forEach(function (q) { have[q.cat] = 1; });
      var best = Infinity, low = [];
      Object.keys(have).forEach(function (c) {
        var n = catCount[c] || 0;
        if (n < best) { best = n; low = [c]; } else if (n === best) low.push(c);
      });
      var cat = low[Math.floor(rand() * low.length)];
      pool = pool.filter(function (q) { return q.cat === cat; });
      // Never seen, or seen longest ago.
      var fresh = pool.filter(function (q) { return !hist[q.id]; });
      if (fresh.length) return fresh[Math.floor(rand() * fresh.length)];
      pool.sort(function (a, b) { return hist[a.id] - hist[b.id]; });
      var oldest = pool.slice(0, Math.max(1, Math.ceil(pool.length / 4)));
      return oldest[Math.floor(rand() * oldest.length)];
    }
    return null;
  }

  // ── A game night ────────────────────────────────────────────────
  // players: [{ id, name, age, kid:true|false, team:'A'|'B'|'' }]
  // opts: { cats, rounds (3–10), teams, headStart, timers, seed }
  // A "side" is a team, or one player when teams are off. Rounds:
  // 1 … R-2 normal, R-1 the steal round, R the final "everyone plays".
  function createGame(bank, players, opts) {
    opts = opts || {};
    var rounds = Math.max(3, Math.min(10, opts.rounds | 0 || 5));
    var sides = [];
    if (opts.teams) {
      ['A', 'B'].forEach(function (t) {
        var m = players.filter(function (p) { return p.team === t; });
        if (m.length) sides.push({ id: 'team' + t, team: t, members: m.map(function (p) { return p.id; }) });
      });
      // A player without a team plays alone.
      players.forEach(function (p) { if (p.team !== 'A' && p.team !== 'B') sides.push({ id: 'p-' + p.id, members: [p.id] }); });
    } else {
      players.forEach(function (p) { sides.push({ id: 'p-' + p.id, members: [p.id] }); });
    }
    var byId = {};
    players.forEach(function (p) { byId[p.id] = p; });
    sides.forEach(function (s) {
      // A team answers at the level of its youngest member (the older
      // ones help).
      s.tier = Math.min.apply(null, s.members.map(function (id) { return tierOfAge(byId[id].age); }));
      s.score = opts.headStart === false ? 0 : HEAD_START[s.tier];
      s.headStart = s.score;
      s.right = 0; s.asked = 0; s.steals = 0; s.finals = 0;
    });
    return {
      bank: bank, players: players, byId: byId, sides: sides,
      cats: opts.cats && opts.cats.length ? opts.cats.slice() : CATS.map(function (c) { return c.id; }),
      rounds: rounds, round: 1, turn: 0, timers: opts.timers !== false,
      rand: rng(opts.seed || Date.now()), used: {}, catCount: {}, hist: opts.hist || {},
      canPlay: opts.canPlay || null,
      current: null, finalI: 0, finalQs: [], log: [], done: false
    };
  }
  function roundKind(g, r) {
    r = r || g.round;
    if (r === g.rounds) return 'final';
    if (r === g.rounds - 1) return 'steal';
    return 'normal';
  }
  function sideHist(g, side) {
    // The members' own histories, merged (oldest wins), so a team avoids
    // what any member has already seen.
    var h = {};
    side.members.forEach(function (id) {
      var src = g.hist[id] || {};
      for (var k in src) if (!h[k] || src[k] > h[k]) h[k] = src[k];
    });
    return h;
  }
  function seen(g, side, q) {
    side.members.forEach(function (id) { g.hist[id] = remember(g.hist[id], q.id); });
    g.used[q.id] = 1;
    g.catCount[q.cat] = (g.catCount[q.cat] || 0) + 1;
  }

  // The next question for whoever's turn it is (normal and steal rounds).
  function next(g) {
    if (g.done || roundKind(g) === 'final') return null;
    var side = g.sides[g.turn];
    var q = pick(g.bank, { tier: side.tier, cats: g.cats, used: g.used, hist: sideHist(g, side), rand: g.rand, catCount: g.catCount, canPlay: g.canPlay });
    if (!q) return null;
    seen(g, side, q);
    g.current = { side: side, q: q, choices: choices(q, side.tier, g.rand), answered: false, stolen: false };
    return g.current;
  }
  function timerFor(g, side) { return g.timers ? TIMER[side.tier] : 0; }

  // Answer the current question. value: the chosen item's value (0 is
  // right), true/false, an order (array of values), or null when time
  // ran out.
  function answer(g, value) {
    var c = g.current;
    if (!c || c.answered) return null;
    c.answered = true;
    var ok = value !== null && isRight(c.q, value);
    c.side.asked++;
    if (ok) { c.side.right++; c.side.score += POINTS.right; }
    c.ok = ok; c.value = value;
    c.canSteal = !ok && roundKind(g) === 'steal' && g.sides.length > 1 && c.q.type !== 'tf';
    g.log.push({ round: g.round, side: c.side.id, q: c.q.id, ok: ok });
    return { ok: ok, points: ok ? POINTS.right : 0, canSteal: c.canSteal };
  }
  // In the steal round, after a miss, another side can try the same
  // question (the wrong choice is taken away).
  function steal(g, sideId, value) {
    var c = g.current;
    if (!c || !c.canSteal || c.stolen) return null;
    var s = null;
    g.sides.forEach(function (x) { if (x.id === sideId && x !== c.side) s = x; });
    if (!s) return null;
    c.stolen = true;
    var ok = isRight(c.q, value);
    if (ok) { s.score += POINTS.steal; s.steals++; }
    g.log.push({ round: g.round, side: s.id, q: c.q.id, ok: ok, steal: true });
    return { ok: ok, points: ok ? POINTS.steal : 0, side: s };
  }
  // Move on: next side, next round.
  function advance(g) {
    g.current = null;
    g.turn++;
    if (g.turn >= g.sides.length) { g.turn = 0; g.round++; }
    if (g.round > g.rounds) g.done = true;
    if (roundKind(g) === 'final' && !g.finalQs.length) startFinal(g);
    return g;
  }

  // The final round: FINAL_QUESTIONS questions everyone answers at once
  // (they call it out or show fingers; a grown-up taps who got it).
  // Picked for the youngest side so everyone can play, with pictures,
  // maps and tunes first.
  function startFinal(g) {
    var tier = Math.min.apply(null, g.sides.map(function (s) { return s.tier; }));
    var hist = {};
    g.sides.forEach(function (s) { var h = sideHist(g, s); for (var k in h) if (!hist[k] || h[k] > hist[k]) hist[k] = h[k]; });
    g.finalQs = [];
    for (var i = 0; i < FINAL_QUESTIONS; i++) {
      var q = pick(g.bank, { tier: tier, cats: g.cats, used: g.used, hist: hist, rand: g.rand, catCount: g.catCount, types: ['pic', 'map', 'snd', 'mc'], canPlay: g.canPlay }) ||
              pick(g.bank, { tier: tier, cats: g.cats, used: g.used, hist: hist, rand: g.rand, catCount: g.catCount, exclude: ['ord'], canPlay: g.canPlay });
      if (!q) break;
      g.used[q.id] = 1;
      g.catCount[q.cat] = (g.catCount[q.cat] || 0) + 1;
      g.players.forEach(function (p) { g.hist[p.id] = remember(g.hist[p.id], q.id); });
      g.finalQs.push({ q: q, choices: choices(q, Math.max(2, tier), g.rand), winners: null });
    }
    g.finalI = 0;
    g.finalTier = tier;
    return g.finalQs;
  }
  function finalQuestion(g) { return g.finalQs[g.finalI] || null; }
  // Mark who got the final question right, then move to the next one.
  function finalMark(g, sideIds) {
    var f = finalQuestion(g);
    if (!f || f.winners) return null;
    f.winners = (sideIds || []).slice();
    g.sides.forEach(function (s) {
      if (f.winners.indexOf(s.id) >= 0) { s.score += POINTS.final; s.finals++; }
    });
    g.log.push({ round: g.round, q: f.q.id, final: true, winners: f.winners });
    g.finalI++;
    if (g.finalI >= g.finalQs.length) g.done = true;
    return f;
  }

  // Scoreboard, highest first; ties share a place.
  function standings(g) {
    var list = g.sides.slice().sort(function (a, b) { return b.score - a.score || b.right - a.right; });
    var place = 0, last = null;
    list.forEach(function (s, i) {
      if (s.score !== last) { place = i + 1; last = s.score; }
      s.place = place;
    });
    return list;
  }

  return {
    CATS: CATS, CAT_OF: CAT_OF, TYPES: TYPES, POINTS: POINTS, HEAD_START: HEAD_START, TIMER: TIMER,
    FINAL_QUESTIONS: FINAL_QUESTIONS, HISTORY_MAX: HISTORY_MAX,
    pair: pair, item: item, catOf: catOf, catById: catById, rng: rng, shuffle: shuffle,
    normalize: normalize, build: build, tierOfAge: tierOfAge, choices: choices, isRight: isRight,
    remember: remember, pick: pick,
    createGame: createGame, roundKind: roundKind, next: next, timerFor: timerFor, answer: answer,
    steal: steal, advance: advance, startFinal: startFinal, finalQuestion: finalQuestion,
    finalMark: finalMark, standings: standings
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TriviaEngine;
