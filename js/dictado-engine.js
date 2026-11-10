/* ================================================================
   DICTADO — dictado-engine.js
   The rules of the game, with no DOM, so the page and the tests read
   a dictation the same way:

     isRight(expected, typed, level)   is it right?
     diff(expected, typed, level)      letter by letter, kindly
     focusWord(expected, cells)        the word to practise again
     choicesFor(...)                   spellings to pick from (Repaso)
     starsFor(right, total, paper)     0-3 stars for a round
     pickRound(items, n, stats, rnd)   which items to dictate
     migrate(raw)                      saved progress, fields only added

   Levels: 1 words, 2 phrases, 3 sentences. At levels 1 and 2 capital
   letters and punctuation do not count (accents and letters do). At
   level 3 everything counts: capitals, accents and punctuation.
   ================================================================ */

(function(root) {
  'use strict';

  var PUNCT = /[¿?¡!.,;:]/g;

  function nfc(s) {
    s = String(s == null ? '' : s);
    return s.normalize ? s.normalize('NFC') : s;
  }
  // Same text a kid sees: one space between words, none at the ends.
  function tidy(s) { return nfc(s).replace(/\s+/g, ' ').replace(/^ | $/g, ''); }

  // The text that is compared. Level 3 keeps everything; below it the
  // capitals and the punctuation are set aside.
  function norm(s, level) {
    s = tidy(s);
    if ((level | 0) < 3) s = tidy(s.toLowerCase().replace(PUNCT, ''));
    return s;
  }

  // Letters without their accent marks (ñ is a letter of its own, it stays).
  function plain(s) {
    var t = nfc(s).replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002');
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ');
  }

  function isRight(expected, typed, level) {
    return norm(expected, level) === norm(typed, level);
  }

  // What kind of mistake: 'case' only the capitals, 'punct' only the
  // signs, 'accent' only the accent marks, 'letters' anything else.
  function kindOf(e, t) {
    if (e === t) return 'ok';
    if (e.toLowerCase() === t.toLowerCase()) return 'case';
    var a = tidy(e.toLowerCase().replace(PUNCT, '')), b = tidy(t.toLowerCase().replace(PUNCT, ''));
    if (a === b) return 'punct';
    if (plain(a) === plain(b)) return 'accent';
    return 'letters';
  }

  // Letter by letter. `cells` follows the right text:
  //   { c, s:'ok' }                  the letter was there
  //   { c, s:'sub', t }              another letter (t) was written
  //   { c, s:'miss' }                the letter was left out
  //   { c:'', s:'extra', t }         a letter that is not in the word
  function diff(expected, typed, level) {
    var e = norm(expected, level), t = norm(typed, level);
    var kind = kindOf(e, t);
    var m = e.length, n = t.length, i, j;
    var dp = [];
    for (i = 0; i <= m; i++) { dp[i] = []; for (j = 0; j <= n; j++) dp[i][j] = i === 0 ? j : j === 0 ? i : 0; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + (e.charAt(i - 1) === t.charAt(j - 1) ? 0 : 1), dp[i - 1][j] + 1, dp[i][j - 1] + 1);
      }
    }
    var cells = [];
    i = m; j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && e.charAt(i - 1) === t.charAt(j - 1) && dp[i][j] === dp[i - 1][j - 1]) {
        cells.push({ c: e.charAt(i - 1), s: 'ok' }); i--; j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        cells.push({ c: e.charAt(i - 1), s: 'sub', t: t.charAt(j - 1) }); i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        cells.push({ c: e.charAt(i - 1), s: 'miss' }); i--;
      } else {
        cells.push({ c: '', s: 'extra', t: t.charAt(j - 1) }); j--;
      }
    }
    cells.reverse();
    var wrong = cells.filter(function(c) { return c.s !== 'ok'; }).length;
    return { ok: e === t, kind: kind, cells: cells, wrong: wrong, expected: e, typed: t };
  }

  // The first word that was not right: { word, start, end, typed } where
  // start/end are positions in diff.expected and `typed` is what the kid
  // wrote for that word. null when only capitals or signs were off.
  function focusWord(d) {
    if (d.ok || d.kind === 'case' || d.kind === 'punct') return null;
    var e = d.expected, pos = 0, bad = -1, k, c;
    for (k = 0; k < d.cells.length; k++) {
      c = d.cells[k];
      if (c.s === 'extra') { if (bad < 0) bad = Math.max(0, pos - 1); continue; }
      if (c.s !== 'ok' && bad < 0) bad = pos;
      pos++;
    }
    if (bad < 0) return null;
    if (bad >= e.length) bad = e.length - 1;
    var start = bad, end = bad;
    while (start > 0 && e.charAt(start - 1) !== ' ') start--;
    while (end < e.length && e.charAt(end) !== ' ') end++;
    // What was written for those letters.
    var typed = '';
    pos = 0;
    for (k = 0; k < d.cells.length; k++) {
      c = d.cells[k];
      if (c.s === 'extra') { if (pos > start && pos <= end) typed += c.t; continue; }
      if (pos >= start && pos < end) typed += c.s === 'ok' ? c.c : c.s === 'sub' ? c.t : '';
      pos++;
    }
    var clean = function(w) { return w.replace(PUNCT, '').toLowerCase(); };
    var word = clean(e.slice(start, end));
    if (!word) return null;
    return { word: word, start: start, end: end, typed: clean(typed) };
  }

  // The words of a text with their place in it: [{ start, end, raw }].
  function tokens(e) {
    var out = [], re = /\S+/g, m;
    while ((m = re.exec(e))) out.push({ start: m.index, end: m.index + m[0].length, raw: m[0] });
    return out;
  }
  function cleanWord(w) { return String(w).replace(PUNCT, '').toLowerCase(); }

  // The sentence with that word hidden: "Mi hermano _____ un libro nuevo."
  function blank(d, f) {
    var e = d.expected, token = e.slice(f.start, f.end);
    var lead = (/^[¿¡]+/.exec(token) || [''])[0], tail = (/[?!.,;:]+$/.exec(token) || [''])[0];
    return e.slice(0, f.start) + lead + '_____' + tail + e.slice(f.end);
  }

  // ── Wrong spellings that look like the right one ───────────────
  // Pairs that sound alike, so they are the usual slips. A pair is tried
  // at every place it fits; the word itself is never one of its own wrong
  // spellings.
  var SWAPS = {
    es: [['b', 'v'], ['v', 'b'], ['ll', 'y'], ['y', 'll'], ['g', 'j'], ['j', 'g'], ['z', 's'], ['s', 'z'], ['c', 's'],
         ['s', 'c'], ['mb', 'nb'], ['mp', 'np'], ['nv', 'mv'], ['h', ''], ['', 'h'], ['gue', 'ge'], ['gui', 'gi'], ['ción', 'sión'], ['qu', 'k']],
    en: [['ck', 'k'], ['kn', 'n'], ['wr', 'r'], ['ai', 'ay'], ['ay', 'ai'], ['ee', 'ea'], ['ea', 'ee'], ['oa', 'ow'], ['ow', 'oa'],
         ['sh', 's'], ['ch', 'tch'], ['th', 't'], ['tion', 'shun'], ['sion', 'tion'], ['ies', 'ys'], ['es', 's'], ['mb', 'm'], ['ie', 'ei']]
  };
  var VOWELS = /[aeiouáéíóú]/;

  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  function variants(word, lang) {
    var out = [], rest = [], seen = {}, w = nfc(word);
    seen[w] = true;
    // First the slips that sound alike (b/v, a missing accent...), then the
    // plain typos, which only fill in when a word has few of the first.
    function add(v, typo) { if (v && !seen[v] && v.length > 1) { seen[v] = true; (typo ? rest : out).push(v); } }
    (SWAPS[lang] || SWAPS.es).forEach(function(p) {
      var from = p[0], to = p[1], at = 0, idx;
      if (!from) {                      // add a letter at the start of a word that starts with a vowel
        if (VOWELS.test(w.charAt(0))) add(to + w);
        return;
      }
      while ((idx = w.indexOf(from, at)) >= 0) {
        if (from === 'c' && !/[eiéí]/.test(w.charAt(idx + 1))) { at = idx + 1; continue; }
        if (from === 's' && to === 'c' && !/[eiéí]/.test(w.charAt(idx + 1))) { at = idx + 1; continue; }
        add(w.slice(0, idx) + to + w.slice(idx + from.length));
        at = idx + 1;
      }
    });
    // Accents: left off, or on the wrong vowel.
    var bare = plain(w);
    if (bare !== w) {
      add(bare);
      var m = /[áéíóú]/.exec(w);
      if (m) {
        for (var k = 0; k < bare.length; k++) {
          if (k !== m.index && /[aeiou]/.test(bare.charAt(k))) {
            add(bare.slice(0, k) + ({ a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' })[bare.charAt(k)] + bare.slice(k + 1));
          }
        }
      }
    }
    // A doubled or dropped letter, then a swap of two neighbours: always possible.
    for (var q = 1; q < w.length - 1; q++) {
      if (w.charAt(q) === w.charAt(q + 1)) add(w.slice(0, q) + w.slice(q + 1), true);
      else if (/[a-z]/.test(w.charAt(q)) && !/[aeiou]/.test(w.charAt(q))) add(w.slice(0, q + 1) + w.charAt(q) + w.slice(q + 1), true);
    }
    for (var r = 1; r < w.length - 1; r++) {
      if (w.charAt(r) !== w.charAt(r + 1)) add(w.slice(0, r) + w.charAt(r + 1) + w.charAt(r) + w.slice(r + 2), true);
    }
    // A stable order that is different for each word.
    var byHash = function(a, b) { return (hash(w + a) - hash(w + b)) || (a < b ? -1 : 1); };
    return out.sort(byHash).concat(rest.sort(byHash));
  }

  // Up to four spellings, the right one among them. What the kid wrote
  // comes first when it is a different spelling (it is the likeliest slip).
  function choicesFor(word, lang, kidTyped, max) {
    max = Math.max(2, Math.min(4, max || 3));
    var out = [word], seen = {};
    seen[word] = true;
    var t = nfc(kidTyped || '').toLowerCase();
    if (t && !seen[t] && t.length <= 40 && t.indexOf(' ') < 0) { seen[t] = true; out.push(t); }
    variants(word, lang).forEach(function(v) {
      if (out.length < max && !seen[v]) { seen[v] = true; out.push(v); }
    });
    return out;
  }

  // ── Stars ─────────────────────────────────────────────────────
  // Everything right is 3, three quarters 2, half 1. A round written on
  // paper is checked by the kid, so it stops at 2; the third star is for
  // typing it.
  function starsFor(right, total, paper) {
    if (!total) return 0;
    var r = right / total, s = r >= 1 ? 3 : r >= 0.75 ? 2 : r >= 0.5 ? 1 : 0;
    return paper ? Math.min(2, s) : s;
  }

  // ── Choosing a round ─────────────────────────────────────────
  // stats: { 'text': [hits, misses] }. Words missed more than hit come
  // first, then words never seen, then the rest in a random order.
  function pickRound(items, n, stats, rnd) {
    rnd = rnd || Math.random;
    stats = stats || {};
    var scored = items.map(function(it) {
      var st = stats[it.t.toLowerCase()] || [0, 0];
      var need = (st[1] | 0) > (st[0] | 0) ? 1 : 0, fresh = (st[0] | 0) + (st[1] | 0) === 0 ? 0.3 : 0;
      return { it: it, score: need + fresh + rnd() };
    });
    scored.sort(function(a, b) { return b.score - a.score; });
    var out = scored.slice(0, Math.max(0, n)).map(function(x) { return x.it; });
    // Shuffle the pick so the hard ones do not all come first.
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  // How many to dictate in a round: shorter for the little ones, and
  // long sentences are many keys.
  function roundSize(tier, level) {
    var n = tier === 'beginner' ? 4 : tier === 'intermediate' ? 6 : 8;
    return level === 3 ? Math.min(n, 6) : n;
  }

  // ── Saved progress ───────────────────────────────────────────
  // zs_dictado_<kid>:
  //   { v:1, lang, mode:'keys'|'paper', level, best:{ 'es-bv:1': 0..3 },
  //     words:{ 'escribir':[hits,misses] }, rv:{ 'escribir': reviewId },
  //     rounds:n, last:'YYYY-MM-DD' }
  // Only ever adds fields; whatever was saved is kept.
  function migrate(raw) {
    var d = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    if (!d.best || typeof d.best !== 'object' || Array.isArray(d.best)) d.best = {};
    if (!d.words || typeof d.words !== 'object' || Array.isArray(d.words)) d.words = {};
    if (!d.rv || typeof d.rv !== 'object' || Array.isArray(d.rv)) d.rv = {};
    if (typeof d.rounds !== 'number') d.rounds = 0;
    if (d.mode !== 'keys' && d.mode !== 'paper') d.mode = 'keys';
    if (d.lang !== 'es' && d.lang !== 'en') delete d.lang;
    if ([1, 2, 3].indexOf(d.level) < 0) delete d.level;
    d.v = 1;
    return d;
  }

  // The star rule (the same one auth.js uses): the best round for every
  // list and level, up to 3 each.
  function totalStars(d) {
    var n = 0, k, b = d && d.best;
    for (k in (b || {})) n += Math.min(3, Math.max(0, Number(b[k]) || 0));
    return n;
  }

  var api = {
    PUNCT: PUNCT, nfc: nfc, tidy: tidy, norm: norm, plain: plain, isRight: isRight, kindOf: kindOf, diff: diff,
    focusWord: focusWord, tokens: tokens, cleanWord: cleanWord, blank: blank, variants: variants, choicesFor: choicesFor, starsFor: starsFor,
    pickRound: pickRound, roundSize: roundSize, migrate: migrate, totalStars: totalStars
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DictadoEngine = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {}));
