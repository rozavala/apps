/* ================================================================
   TYPE QUEST — engine (js/type-quest-engine.js)

   No DOM. Builds the lines to type, scores a run and works out stars
   and the typing rank. Loadable by Node for the unit tests.

     TypeQuestEngine.rng(seed)                     a seeded random()
     TypeQuestEngine.lessonChars(i, layout)        {all, fresh} for lesson i
     TypeQuestEngine.makeDrill(i, layout, lang, tier, rnd)
     TypeQuestEngine.makeWords(lang, tier, rnd, n)
     TypeQuestEngine.makeFocus(chars, layout, lang, tier, rnd)
     TypeQuestEngine.Session(text, {loose})        one run: type(ch), result()
     TypeQuestEngine.lessonStars(wpm, acc, tier)   0..3
     TypeQuestEngine.passageStars(acc)             0..3
     TypeQuestEngine.rankIndex(runs, prev)         index into RANKS
     TypeQuestEngine.mergeKeys(store, keys)        heatmap counts
     TypeQuestEngine.weakest(store, n)             the keys missed most
   ================================================================ */

var TypeQuestEngine = (function() {
  'use strict';

  var D = (typeof TypeQuestData !== 'undefined') ? TypeQuestData
    : (typeof require === 'function' ? require('./type-quest-data.js') : null);

  // mulberry32
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function() {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }
  function shuffle(arr, rnd) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var LENGTH = { beginner: 22, intermediate: 60, advanced: 90, expert: 130 };
  function targetLength(tier) { return LENGTH[tier] || LENGTH.intermediate; }

  // The plain letter under an accented one (loose mode, word filters).
  var FOLD = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'ñ': 'n', 'Ñ': 'N' };
  function fold(ch) { return FOLD[ch] || ch; }
  var SKIP_LOOSE = { '¿': 1, '¡': 1 };

  function keyChar(code, layoutId) {
    var k = D.LAYOUTS[layoutId].keys[code];
    return k && k.base && !k.dead ? k.base : null;
  }

  // Every character lessons 0..i teach, and the ones lesson i adds.
  function lessonChars(i, layoutId) {
    var all = {}, fresh = {}, caps = false, n, L, j;
    for (n = 0; n <= i && n < D.LESSONS.length; n++) {
      L = D.LESSONS[n];
      var add = [];
      (L.keys || []).forEach(function(code) { var c = keyChar(code, layoutId); if (c) add.push(c); });
      (L.chars || []).forEach(function(c) { if (D.stepsFor(c, layoutId)) add.push(c); });
      if (L.caps) {
        caps = true;
        for (var c in all) if (/^[a-z]$/.test(c)) add.push(c.toUpperCase());
      }
      for (j = 0; j < add.length; j++) {
        all[add[j]] = 1;
        if (n === i) fresh[add[j]] = 1;
      }
    }
    // capitals of letters learned after Shift come with them
    if (caps) for (var k in all) if (/^[a-z]$/.test(k)) all[k.toUpperCase()] = 1;
    return { all: all, fresh: Object.keys(fresh).filter(function(c) { return c !== ' '; }), caps: caps };
  }

  function wordsFor(lang) { return (D.WORDS[lang] || D.WORDS.en).slice(); }
  function fits(word, allowed) {
    for (var i = 0; i < word.length; i++) if (!allowed[word[i]]) return false;
    return true;
  }
  function hasAny(word, chars) {
    for (var i = 0; i < chars.length; i++) if (word.indexOf(chars[i]) >= 0) return true;
    return false;
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  // Fill up to `len` characters from a supply of chunks, single spaces.
  function fill(chunks, len) {
    var out = [], size = 0;
    for (var i = 0; i < chunks.length; i++) {
      var c = chunks[i];
      if (!c) continue;
      if (size && size + 1 + c.length > len) break;
      out.push(c);
      size += (size ? 1 : 0) + c.length;
    }
    return out.join(' ');
  }

  function letterGroups(fresh, known, rnd, count) {
    var out = [], i, g, n;
    for (i = 0; i < count; i++) {
      n = 2 + Math.floor(rnd() * 3);
      g = '';
      while (g.length < n) g += rnd() < 0.55 && fresh.length ? pick(fresh, rnd) : pick(known, rnd);
      if (fresh.length && !hasAny(g, fresh)) g = g.slice(0, -1) + pick(fresh, rnd);
      out.push(g);
    }
    return out;
  }

  function repeatGroups(fresh) {
    var out = [];
    fresh.forEach(function(c) { out.push(c + c + c); });
    for (var a = 0; a < fresh.length; a++) for (var b = 0; b < fresh.length; b++) if (a !== b) out.push(fresh[a] + fresh[b]);
    return out;
  }

  // The lines for key lesson i.
  function makeDrill(i, layoutId, lang, tier, rnd) {
    var L = D.LESSONS[i];
    if (!L) return '';
    if (L.spanish) lang = 'es';
    var ch = lessonChars(i, layoutId), allowed = ch.all, fresh = ch.fresh;
    var known = Object.keys(allowed).filter(function(c) { return c !== ' ' && /[a-zñ]/.test(c); });
    if (!known.length) known = fresh.slice();
    var len = targetLength(tier), chunks = [];
    var lower = {}; for (var c in allowed) lower[c] = 1;

    // words this lesson can already spell (either language helps early on)
    var pool = wordsFor(lang).filter(function(w) { return fits(w, lower); });
    if (pool.length < 4) pool = pool.concat(wordsFor(lang === 'es' ? 'en' : 'es').filter(function(w) { return fits(w, lower) && pool.indexOf(w) < 0; }));
    var withFresh = pool.filter(function(w) { return hasAny(w, fresh); });

    if (L.caps) {
      var cw = shuffle(pool.filter(function(w) { return w.length > 1; }), rnd).slice(0, 14);
      chunks = cw.map(function(w, n) { return n % 2 ? w : cap(w); });
    } else if (L.id === 'nums') {
      var ws = shuffle(pool.filter(function(w) { return w.length > 2; }), rnd);
      for (var n = 0; n < 12; n++) {
        if (n % 3 === 2 && ws.length) chunks.push(String(1 + Math.floor(rnd() * 20)) + ' ' + ws[n % ws.length]);
        else chunks.push(String(Math.floor(rnd() * 10)) + String(Math.floor(rnd() * 10)) + (rnd() < 0.5 ? String(Math.floor(rnd() * 10)) : ''));
      }
    } else if (L.id === 'punct') {
      var pw = shuffle(pool.filter(function(w) { return w.length > 1; }), rnd);
      var marks = ['?', '!', ':', ';'].filter(function(m) { return allowed[m]; });
      for (var p = 0; p < 12 && pw.length; p++) {
        var w = pw[p % pw.length], r = p % 4;
        if (r === 0 && allowed['"']) chunks.push('"' + w + '"');
        else if (r === 1 && allowed['-']) chunks.push(w + '-' + pw[(p + 1) % pw.length]);
        else if (r === 2 && allowed['\'']) chunks.push('\'' + w + '\'');
        else chunks.push(w + pick(marks, rnd));
      }
    } else if (L.spanish) {
      var acc = wordsFor('es').filter(function(w) { return /[áéíóúñ]/.test(w) && fits(w, lower); });
      acc = shuffle(acc, rnd);
      for (var s = 0; s < 14 && acc.length; s++) {
        var a = acc[s % acc.length];
        chunks.push(s % 5 === 1 && allowed['¿'] ? '¿' + a + '?' : s % 5 === 3 && allowed['¡'] ? '¡' + a + '!' : a);
      }
    } else {
      // new keys alone, then mixed with known ones, then real words
      var rep = repeatGroups(fresh);
      chunks = chunks.concat(rep.slice(0, Math.max(3, Math.min(rep.length, Math.round(len / 14)))));
      var groups = letterGroups(fresh, known, rnd, 12);
      var words = shuffle(withFresh.length ? withFresh : pool, rnd);
      var mixed = [];
      for (var m = 0; m < 10; m++) {
        if (words.length && (m % 2 === 1 || !groups.length)) mixed.push(words[m % words.length]);
        else mixed.push(groups.shift() || letterGroups(fresh, known, rnd, 1)[0]);
      }
      chunks = chunks.concat(mixed);
    }
    var text = fill(chunks, len);
    return text || fill(repeatGroups(fresh.length ? fresh : known), len);
  }

  // Real words, shortest for the youngest.
  function makeWords(lang, tier, rnd, n) {
    var list = wordsFor(lang);
    var max = tier === 'beginner' ? 4 : tier === 'intermediate' ? 5 : tier === 'advanced' ? 8 : 12;
    var pool = list.filter(function(w) { return w.length > 1 && w.length <= max; });
    var out = [], last = null;
    while (out.length < n) {
      var w = pick(pool, rnd);
      if (w === last && pool.length > 1) continue;
      out.push(w); last = w;
    }
    return out.join(' ');
  }

  // A drill for the keys a kid misses most.
  function makeFocus(chars, layoutId, lang, tier, rnd) {
    var fresh = chars.filter(function(c) { return D.stepsFor(c, layoutId); });
    if (!fresh.length) return makeWords(lang, tier, rnd, 12);
    var words = shuffle(wordsFor(lang).filter(function(w) { return hasAny(w, fresh); }), rnd);
    var groups = letterGroups(fresh, fresh, rnd, 6), chunks = [];
    for (var i = 0; i < 14; i++) chunks.push(i % 2 && words.length ? words[i % words.length] : (groups.shift() || pick(fresh, rnd) + pick(fresh, rnd)));
    return fill(chunks, targetLength(tier) + 20);
  }

  // ── One run ──────────────────────────────────────────────────────
  // The cursor only moves on the right key, so the kid fixes a slip at
  // once and never has to delete. Every slip is counted.
  function Session(text, opts) {
    this.text = String(text || '');
    this.loose = !!(opts && opts.loose);
    this.pos = 0;
    this.errors = 0;
    this.slips = {};         // positions where a slip happened
    this.keys = {};          // char -> [right, slips]
    this.t0 = null; this.t1 = null;
    this.skip();
  }
  Session.prototype.skip = function() {
    if (!this.loose) return;
    while (this.pos < this.text.length && SKIP_LOOSE[this.text[this.pos]]) this.pos++;
  };
  Session.prototype.expected = function() { return this.text[this.pos]; };
  Session.prototype.done = function() { return this.pos >= this.text.length; };
  Session.prototype.matches = function(ch, want) {
    if (ch === want) return true;
    return this.loose && fold(ch) === fold(want);
  };
  Session.prototype._count = function(ch, ok) {
    var k = String(ch).toLowerCase();
    var r = this.keys[k] || (this.keys[k] = [0, 0]);
    r[ok ? 0 : 1]++;
  };
  Session.prototype.type = function(ch, now) {
    if (this.done()) return { ok: false, done: true };
    if (now === undefined) now = Date.now();
    if (this.t0 === null) this.t0 = now;
    var want = this.expected();
    var ok = this.matches(ch, want);
    if (ok) {
      this._count(want, true);
      this.pos++;
      this.skip();
      this.t1 = now;
    } else {
      this._count(want, false);
      this.errors++;
      this.slips[this.pos] = 1;
    }
    return { ok: ok, done: this.done(), want: want };
  };
  Session.prototype.elapsed = function(now) {
    if (this.t0 === null) return 0;
    var end = this.done() ? this.t1 : (now === undefined ? Date.now() : now);
    return Math.max(0, end - this.t0);
  };
  Session.prototype.result = function(now) {
    var ms = Math.max(1000, this.elapsed(now));
    var right = this.pos, typed = right + this.errors;
    return {
      chars: right, errors: this.errors,
      secs: Math.round(ms / 100) / 10,
      wpm: Math.round((right / 5) / (ms / 60000) * 10) / 10,
      acc: typed ? Math.round(right / typed * 1000) / 1000 : 0,
      keys: this.keys
    };
  };

  // ── Stars and rank ───────────────────────────────────────────────
  function lessonStars(wpm, acc, tier) {
    var goal = D.GOALS[tier] || D.GOALS.intermediate;
    if (acc >= 0.95 && wpm >= goal) return 3;
    if (acc >= 0.9) return 2;
    if (acc >= 0.8) return 1;
    return 0;
  }
  function passageStars(acc) { return acc >= 0.96 ? 3 : acc >= 0.92 ? 2 : acc >= 0.85 ? 1 : 0; }

  var MIN_RUN = 60;      // characters in a run that counts toward the rank
  function qualifies(r) { return r && (+r.a || 0) >= 0.95 && (r.c | 0) >= MIN_RUN; }
  function rankIndex(runs, prev) {
    var best = Math.max(0, prev | 0);
    for (var i = D.RANKS.length - 1; i > best; i--) {
      var need = D.RANKS[i].wpm, n = 0;
      (runs || []).forEach(function(r) { if (qualifies(r) && (+r.w || 0) >= need) n++; });
      if (n >= 3) return i;
    }
    return Math.min(best, D.RANKS.length - 1);
  }

  // ── Heatmap ──────────────────────────────────────────────────────
  var KEY_CAP = 400;   // past this many tries a key's counts are halved, so recent practice weighs more
  function mergeKeys(store, keys) {
    store = store && typeof store === 'object' ? store : {};
    for (var k in keys) {
      if (!keys.hasOwnProperty(k) || k === ' ' || k.length !== 1) continue;
      var s = Array.isArray(store[k]) ? store[k] : [0, 0];
      s = [(s[0] | 0) + (keys[k][0] | 0), (s[1] | 0) + (keys[k][1] | 0)];
      if (s[0] + s[1] > KEY_CAP) s = [Math.round(s[0] / 2), Math.round(s[1] / 2)];
      store[k] = s;
    }
    return store;
  }
  function missRate(s) { var n = (s[0] | 0) + (s[1] | 0); return n ? (s[1] | 0) / n : 0; }
  function weakest(store, n) {
    var list = [];
    for (var k in (store || {})) {
      var s = store[k];
      if (!Array.isArray(s) || (s[0] | 0) + (s[1] | 0) < 8) continue;
      var r = missRate(s);
      if (r > 0.04) list.push({ ch: k, rate: r, tries: (s[0] | 0) + (s[1] | 0) });
    }
    list.sort(function(a, b) { return b.rate - a.rate || b.tries - a.tries; });
    return list.slice(0, n || 5);
  }

  return {
    rng: rng, fold: fold, lessonChars: lessonChars, makeDrill: makeDrill, makeWords: makeWords, makeFocus: makeFocus,
    Session: Session, lessonStars: lessonStars, passageStars: passageStars, rankIndex: rankIndex, qualifies: qualifies,
    mergeKeys: mergeKeys, missRate: missRate, weakest: weakest, targetLength: targetLength
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TypeQuestEngine;
