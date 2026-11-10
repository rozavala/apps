/* ================================================================
   CHALLENGE ENGINE — challenge-engine.js
   The rules behind Sibling Challenges, with no DOM, so the hub, the
   Parents Corner list and the tests all read a challenge the same way.

   Older kids set a small challenge for a younger sibling: a question
   with 2 to 4 answers, a word to spell (read aloud), or a country to
   find on the map. When it is solved, both kids earn a star.

   Storage is one household key, zs_challenges: { v: 1, events: [...] },
   an append-only log merged by id (see _mergeChallenges in sync.js),
   the same pattern as the bank. Events are never edited:
     create  { from, to, kind, text, options, answer, hint, lang }
               kind 'q'     text = the question, options = 2-4 answers,
                            answer = index of the right one
               kind 'spell' answer = the word, lang = 'es' | 'en'
               kind 'map'   answer = country id (ISO alpha-3, lowercase)
     miss    { ch, by }      a wrong try (the 3rd shows the hint)
     solve   { ch, by, tries }   id is 's_' + ch, so two devices that
                                 both saw it solved agree on one event
     remove  { ch }          a parent deleted it (id 'r_' + ch)
     config  { anyone }      a parent lets any kid challenge any sibling
   Every event also has id, type and ts = Date.now().

   Free text comes from kids, so it is untrusted: it is cut to 120
   characters when written AND when read, and the UI only ever puts it
   in the page as text.

   Stars are a per-kid record, zs_challenge_<kid> = { v: 1, stars:
   { <challenge id>: 'YYYY-MM-DD' } }, so the shared star code in auth.js
   (the 'challenge' entry of APP_STAR_CONFIGS: one star per solved
   challenge, at most 3 a day) can count them like any app's. It is only
   a cache of the log: starsByKid() says what it should hold, and the hub
   adds anything missing and never removes a star.
   ================================================================ */
(function (root) {
  'use strict';

  var KEY = 'zs_challenges';
  var STARS_PREFIX = 'zs_challenge_';
  var MAX_TEXT = 120;        // every free-text field
  var MAX_WORD = 30;         // a spelling word
  var MIN_OPTIONS = 2, MAX_OPTIONS = 4;
  var TRIES_BEFORE_HINT = 2;
  var KINDS = ['q', 'spell', 'map'];

  // ── text ──
  // Control characters, line/paragraph separators, zero-width and direction marks.
  var HIDDEN = new RegExp('[\\x00-\\x1f\\x7f-\\x9f' + [[0x2028, 0x2029], [0x200b, 0x200f], [0x202a, 0x202e], [0x2066, 0x2069]].map(function (r) {
    return String.fromCharCode(r[0]) + '-' + String.fromCharCode(r[1]);
  }).join('') + ']', 'g');
  // Code points, not UTF-16 units, so an emoji is never cut in half.
  function clean(s, max) {
    var t = String(s == null ? '' : s)
      .replace(HIDDEN, ' ')
      .replace(/\s+/g, ' ').trim();
    var cps = Array.from(t);
    return cps.length > max ? cps.slice(0, max).join('').trim() : t;
  }
  function normWord(s) {
    return String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/\s+/g, '').trim();
  }
  function kidKey(name) { return String(name || '').toLowerCase().replace(/\s+/g, '_'); }
  function sameName(a, b) { return !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase(); }
  function uid(prefix) {
    return (prefix || 'c') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function dateOf(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ── making events ──
  // fields: { from, to, kind, text, options: [..], answer, hint, lang }
  // -> { ok: true, event } or { ok: false, error: 'who' | 'kind' | 'text' |
  //      'options' | 'answer' | 'word' | 'country' }
  function make(fields) {
    var f = fields || {};
    var from = clean(f.from, 40), to = clean(f.to, 40);
    if (!from || !to || sameName(from, to)) return { ok: false, error: 'who' };
    if (KINDS.indexOf(f.kind) < 0) return { ok: false, error: 'kind' };
    var ev = { id: uid('c'), type: 'create', ts: Date.now(), from: from, to: to, kind: f.kind };
    var hint = clean(f.hint, MAX_TEXT);
    if (hint) ev.hint = hint;

    if (f.kind === 'q') {
      var text = clean(f.text, MAX_TEXT);
      if (!text) return { ok: false, error: 'text' };
      var opts = (Array.isArray(f.options) ? f.options : []).map(function (o, i) {
        return { t: clean(o, MAX_TEXT), i: i };
      });
      // An empty box is not an answer; the right answer's place is kept.
      var right = opts[Number(f.answer)];
      opts = opts.filter(function (o) { return o.t; });
      if (opts.length < MIN_OPTIONS || opts.length > MAX_OPTIONS) return { ok: false, error: 'options' };
      if (!right || !right.t) return { ok: false, error: 'answer' };
      var seen = {};
      for (var i = 0; i < opts.length; i++) {
        var k = opts[i].t.toLowerCase();
        if (seen[k]) return { ok: false, error: 'options' };
        seen[k] = true;
      }
      ev.text = text;
      ev.options = opts.map(function (o) { return o.t; });
      ev.answer = opts.indexOf(opts.filter(function (o) { return o.i === right.i; })[0]);
    } else if (f.kind === 'spell') {
      var word = clean(f.answer, MAX_WORD);
      if (!/^[^\s\d]{2,30}$/u.test(word)) return { ok: false, error: 'word' };
      ev.answer = word;
      ev.lang = f.lang === 'es' ? 'es' : 'en';
    } else {
      var code = String(f.answer || '').toLowerCase();
      if (!/^[a-z]{3}$/.test(code)) return { ok: false, error: 'country' };
      ev.answer = code;
    }
    return { ok: true, event: ev };
  }

  function makeMiss(ch, by) { return { id: uid('m'), type: 'miss', ts: Date.now(), ch: ch, by: clean(by, 40) }; }
  function makeSolve(ch, by, tries) {
    return { id: 's_' + ch, type: 'solve', ts: Date.now(), ch: ch, by: clean(by, 40), tries: Math.max(0, Math.min(99, tries | 0)) };
  }
  function makeRemove(ch) { return { id: 'r_' + ch, type: 'remove', ts: Date.now(), ch: ch }; }
  function makeConfig(anyone) { return { id: uid('g'), type: 'config', ts: Date.now(), anyone: !!anyone }; }

  // ── reading the log ──
  // A create event, checked and cut down again: the log can hold events
  // from another device or an older build, and kids wrote the words.
  function readCreate(e) {
    if (!e || e.type !== 'create' || !e.id || typeof e.id !== 'string') return null;
    var from = clean(e.from, 40), to = clean(e.to, 40);
    if (!from || !to || sameName(from, to) || KINDS.indexOf(e.kind) < 0) return null;
    var c = { id: e.id, from: from, to: to, kind: e.kind, ts: Number(e.ts) || 0, gone: !!e.gone, hint: clean(e.hint, MAX_TEXT) };
    if (e.gone) return c;           // removed by a parent: the words are gone
    if (e.kind === 'q') {
      var opts = (Array.isArray(e.options) ? e.options : []).map(function (o) { return clean(o, MAX_TEXT); });
      var ans = Number(e.answer);
      c.text = clean(e.text, MAX_TEXT);
      c.options = opts;
      c.answer = ans;
      if (!c.text || opts.length < MIN_OPTIONS || opts.length > MAX_OPTIONS || opts.some(function (o) { return !o; }) ||
          !(ans >= 0 && ans < opts.length && ans % 1 === 0)) return null;
    } else if (e.kind === 'spell') {
      c.answer = clean(e.answer, MAX_WORD);
      c.lang = e.lang === 'es' ? 'es' : 'en';
      if (c.answer.length < 2) return null;
    } else {
      c.answer = String(e.answer || '').toLowerCase();
      if (!/^[a-z]{3}$/.test(c.answer)) return null;
    }
    return c;
  }

  // The whole picture from the events:
  // { challenges: [...every readable challenge, oldest first, with misses,
  //   solved ({ ts, by, tries } or null) and removed],  anyone: bool }
  function view(events) {
    var list = Array.isArray(events) ? events : [];
    var byId = {}, order = [];
    var removed = {}, solves = {}, misses = {};
    var anyone = false, anyoneTs = -1;
    list.forEach(function (e) {
      if (!e || !e.id) return;
      if (e.type === 'create') {
        var c = readCreate(e);
        if (c && !byId[c.id]) { byId[c.id] = c; order.push(c.id); }
      } else if (e.type === 'remove' && e.ch) removed[e.ch] = true;
      else if (e.type === 'solve' && e.ch) {
        var prev = solves[e.ch];
        if (!prev || (Number(e.ts) || 0) < prev.ts) solves[e.ch] = { ts: Number(e.ts) || 0, by: clean(e.by, 40), tries: Number(e.tries) || 0 };
      } else if (e.type === 'miss' && e.ch) {
        (misses[e.ch] = misses[e.ch] || {})[e.id] = clean(e.by, 40);
      } else if (e.type === 'config') {
        var t = Number(e.ts) || 0;
        if (t >= anyoneTs) { anyoneTs = t; anyone = !!e.anyone; }
      }
    });
    var challenges = order.map(function (id) { return byId[id]; })
      .sort(function (a, b) { return (a.ts - b.ts) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); })
      .map(function (c) {
        var s = solves[c.id];
        // Only the receiver can solve it, and only the receiver's misses count.
        if (s && !sameName(s.by, c.to)) s = null;
        var m = 0, mm = misses[c.id] || {};
        for (var k in mm) if (sameName(mm[k], c.to)) m++;
        c.removed = !!removed[c.id] || c.gone;
        c.solved = s || null;
        c.misses = m;
        return c;
      });
    return { challenges: challenges, anyone: anyone };
  }

  // The log with the words of every removed challenge taken out (the
  // same rule as _mergeChallenges in sync.js). Who, kind and time stay, so
  // stars already earned still add up.
  function scrub(events) {
    var removed = {};
    (events || []).forEach(function (e) { if (e && e.type === 'remove' && e.ch) removed[e.ch] = true; });
    return (events || []).map(function (e) {
      if (!e || e.type !== 'create' || !removed[e.id]) return e;
      return { id: e.id, type: 'create', ts: e.ts, from: e.from, to: e.to, kind: e.kind, gone: true };
    });
  }

  // ── who can challenge whom ──
  // profiles: [{ name, age }] (no guests). Younger siblings only, unless a
  // parent allowed any sibling.
  function receivers(profiles, creator, anyone) {
    if (!creator) return [];
    return (profiles || []).filter(function (p) {
      if (!p || !p.name || p.isGuest || sameName(p.name, creator.name)) return false;
      if (anyone) return true;
      return Number(creator.age) > 0 && Number(p.age) > 0 && Number(p.age) < Number(creator.age);
    });
  }

  // ── what a kid sees ──
  function inbox(v, name) {
    return v.challenges.filter(function (c) { return !c.removed && !c.solved && sameName(c.to, name); });
  }
  // Challenges this kid sent that were solved lately (to show the star).
  function solvedSent(v, name, sinceTs) {
    return v.challenges.filter(function (c) {
      return !c.removed && c.solved && sameName(c.from, name) && c.solved.ts >= (sinceTs || 0);
    });
  }
  function sent(v, name) { return v.challenges.filter(function (c) { return !c.removed && sameName(c.from, name); }); }

  // ── answering ──
  // q: response is the option index; spell: the typed word; map: country id.
  function check(c, response) {
    if (!c || c.removed) return false;
    if (c.kind === 'q') return Number(response) === c.answer && response !== '' && response !== null;
    if (c.kind === 'spell') return normWord(response) === normWord(c.answer);
    if (c.kind === 'map') return String(response || '').toLowerCase() === c.answer;
    return false;
  }
  // After this many wrong tries the hint shows.
  function hintOpen(c) { return !!c && c.misses >= TRIES_BEFORE_HINT; }

  // The same order every time for one challenge, different between challenges.
  function shuffled(c) {
    var idx = c.options.map(function (_, i) { return i; });
    var h = 0;
    for (var i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) | 0;
    for (var j = idx.length - 1; j > 0; j--) {
      h = (Math.imul(h, 1103515245) + 12345) | 0;
      var r = Math.abs(h >> 8) % (j + 1);
      var tmp = idx[j]; idx[j] = idx[r]; idx[r] = tmp;
    }
    return idx;
  }

  // ── stars ──
  // { kidKey: { challengeId: 'YYYY-MM-DD' } }: both kids of a solved
  // challenge get one, even if a parent removed it afterwards.
  function starsByKid(events) {
    var v = view(events), out = {};
    v.challenges.forEach(function (c) {
      if (!c.solved) return;
      var day = dateOf(c.solved.ts);
      [c.from, c.to].forEach(function (n) {
        var k = kidKey(n);
        (out[k] = out[k] || {})[c.id] = day;
      });
    });
    return out;
  }
  var api = {
    KEY: KEY, STARS_PREFIX: STARS_PREFIX, MAX_TEXT: MAX_TEXT, MAX_WORD: MAX_WORD,
    MIN_OPTIONS: MIN_OPTIONS, MAX_OPTIONS: MAX_OPTIONS, TRIES_BEFORE_HINT: TRIES_BEFORE_HINT,
    KINDS: KINDS,
    clean: clean, normWord: normWord, kidKey: kidKey, sameName: sameName, uid: uid,
    make: make, makeMiss: makeMiss, makeSolve: makeSolve, makeRemove: makeRemove, makeConfig: makeConfig,
    view: view, scrub: scrub, receivers: receivers, inbox: inbox, solvedSent: solvedSent, sent: sent,
    check: check, hintOpen: hintOpen, shuffled: shuffled, starsByKid: starsByKid
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ChallengeEngine = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : {}));
