/* ================================================================
   REVIEW — review.js
   One daily review of what each kid missed, across apps (Repaso).

   Apps call, when a kid misses something:
     Review.add(kid, { app, id?, prompt, answer, choices? })
   and, when the same thing comes back and is answered:
     Review.hit(kid, id)   /   Review.miss(kid, id)
   `kid` is the profile name, or omit it (pass null) for the active kid.

   Each item stands on its own: plain text for the prompt, the right
   answer and (optionally) up to four choices that include it. No app
   screens are needed to show it again.

   Schedule: a Leitner box. A missed item is in box 1 and due the next
   day. Answering it right when it is due moves it up a box, with the
   gaps 1, 2, 4, 8 and 16 days; a right answer in box 5 retires it.
   A miss puts it back in box 1. Answering right before it is due
   changes nothing, so extra practice cannot skip the schedule.

   Storage: zs_review_<kid>, one JSON blob (synced like any app key):
     { v:1, items:{ id:{ id, app, prompt, answer, choices?, box, due,
       added, misses, hits } }, done:{ 'YYYY-MM-DD': n }, retired: n }
   Days are local calendar days, so a late evening review still counts
   for that evening.
   ================================================================ */

var Review = (function() {
  'use strict';

  var PREFIX = 'zs_review_';
  var GAPS = [1, 2, 4, 8, 16];            // days until due, by box 1..5
  var MAX_ITEMS = 200;                      // per kid; oldest retired-soon first
  var LIM = { app: 24, id: 80, prompt: 240, answer: 120, choice: 80, choices: 4 };

  // ── time ────────────────────────────────────────────────────
  function _two(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { d = d || new Date(); return d.getFullYear() + '-' + _two(d.getMonth() + 1) + '-' + _two(d.getDate()); }
  // Day number of the LOCAL calendar day (DST-safe: built from the date parts).
  function dayNum(d) { d = d || new Date(); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }

  // ── storage ─────────────────────────────────────────────────
  function _kidName(kid) {
    if (kid) return String(kid);
    try { var u = (typeof getActiveUser === 'function') ? getActiveUser() : null; return u ? u.name : null; } catch (e) { return null; }
  }
  function _key(kid) {
    var n = _kidName(kid);
    return n ? PREFIX + n.toLowerCase().replace(/\s+/g, '_') : null;
  }
  function _load(kid) {
    var blank = { v: 1, items: {}, done: {}, retired: 0 };
    var k = _key(kid);
    if (!k) return blank;
    try {
      var raw = localStorage.getItem(k);
      if (!raw) return blank;
      var d = JSON.parse(raw);
      if (!d || typeof d !== 'object') return blank;
      if (!d.items || typeof d.items !== 'object' || Array.isArray(d.items)) d.items = {};
      if (!d.done || typeof d.done !== 'object' || Array.isArray(d.done)) d.done = {};
      d.retired = d.retired | 0;
      d.v = 1;
      return d;
    } catch (e) { return blank; }
  }
  function _save(kid, d) {
    var k = _key(kid);
    if (!k) return false;
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) { return false; }
    try { if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k); } catch (e) {}
    return true;
  }

  // ── cleaning (items are plain text; nothing here is ever HTML) ──
  function _txt(v, max) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function _hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function _clean(item) {
    if (!item || typeof item !== 'object') return null;
    var app = _txt(item.app, LIM.app).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    var prompt = _txt(item.prompt, LIM.prompt);
    var answer = _txt(item.answer, LIM.answer);
    if (!app || !prompt || !answer) return null;
    var id = _txt(item.id, LIM.id).replace(/[^A-Za-z0-9_.:-]/g, '');
    if (!id) id = _hash(prompt + '|' + answer);
    if (id.indexOf(app + ':') !== 0) id = app + ':' + id;
    var out = { id: id.slice(0, LIM.id), app: app, prompt: prompt, answer: answer };
    // A chess position to draw above the question (Forsyth-Edwards notation).
    var fen = _txt(item.fen, 90);
    if (/^[1-8pnbrqkPNBRQK]+(\/[1-8pnbrqkPNBRQK]+){7} [wb] [-KQkq]+ [-a-h1-8]+ \d+ \d+$/.test(fen)) out.fen = fen;
    if (Array.isArray(item.choices)) {
      var ch = [];
      item.choices.forEach(function(c) {
        c = _txt(c, LIM.choice);
        if (c && ch.indexOf(c) < 0 && ch.length < LIM.choices) ch.push(c);
      });
      // The right answer must always be one of the choices.
      if (ch.indexOf(answer.slice(0, LIM.choice)) < 0) {
        ch = ch.slice(0, LIM.choices - 1);
        ch.push(answer.slice(0, LIM.choice));
      }
      if (ch.length >= 2) out.choices = ch;
    }
    return out;
  }

  // ── core ────────────────────────────────────────────────────
  function add(kid, item) {
    var c = _clean(item);
    if (!c) return null;
    var d = _load(kid), td = dayNum();
    var cur = d.items[c.id];
    if (cur) {
      cur.misses = (cur.misses | 0) + 1;
      cur.box = 1;
      cur.due = td + GAPS[0];
      // Newer wording/choices from the app win; keep the history.
      cur.prompt = c.prompt; cur.answer = c.answer;
      if (c.choices) cur.choices = c.choices; else delete cur.choices;
      if (c.fen) cur.fen = c.fen; else delete cur.fen;
    } else {
      c.box = 1; c.due = td + GAPS[0]; c.added = td; c.misses = 1; c.hits = 0;
      d.items[c.id] = c;
      _trim(d);
    }
    _save(kid, d);
    return d.items[c.id] || null;
  }

  // Keep the list bounded: drop the items that are furthest along.
  function _trim(d) {
    var ids = Object.keys(d.items);
    if (ids.length <= MAX_ITEMS) return;
    ids.sort(function(a, b) {
      var A = d.items[a], B = d.items[b];
      return (B.box - A.box) || (A.added - B.added);
    });
    ids.slice(0, ids.length - MAX_ITEMS).forEach(function(id) { delete d.items[id]; });
  }

  // Returns { was, now, retired } or null when the item is unknown.
  function hit(kid, id) {
    var d = _load(kid), it = d.items[id];
    if (!it) return null;
    var td = dayNum(), was = it.box;
    if (it.due > td) return { was: was, now: was, retired: false, early: true };
    it.hits = (it.hits | 0) + 1;
    if (it.box >= GAPS.length) {
      delete d.items[id];
      d.retired = (d.retired | 0) + 1;
      _save(kid, d);
      return { was: was, now: 0, retired: true };
    }
    it.box += 1;
    it.due = td + GAPS[it.box - 1];
    _save(kid, d);
    return { was: was, now: it.box, retired: false };
  }

  function miss(kid, id) {
    var d = _load(kid), it = d.items[id];
    if (!it) return null;
    var was = it.box;
    it.misses = (it.misses | 0) + 1;
    it.box = 1;
    it.due = dayNum() + GAPS[0];
    _save(kid, d);
    return { was: was, now: 1, retired: false };
  }

  // The id add() gives an item with no id of its own, so an app can find it again.
  function idFor(app, prompt, answer) {
    app = _txt(app, LIM.app).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return app + ':' + _hash(_txt(prompt, LIM.prompt) + '|' + _txt(answer, LIM.answer));
  }

  function get(kid, id) { return _load(kid).items[id] || null; }
  function all(kid) { var d = _load(kid); return Object.keys(d.items).map(function(k) { return d.items[k]; }); }

  // Items due today or earlier, mixed across apps (round-robin, the
  // longest-waiting first inside each app), at most `max`.
  function due(kid, max) {
    var td = dayNum();
    var list = all(kid).filter(function(it) { return it.due <= td; });
    list.sort(function(a, b) { return (a.due - b.due) || (a.box - b.box) || (a.id < b.id ? -1 : 1); });
    var byApp = {}, order = [];
    list.forEach(function(it) { if (!byApp[it.app]) { byApp[it.app] = []; order.push(it.app); } byApp[it.app].push(it); });
    var out = [];
    while (out.length < (max || list.length) && order.length) {
      for (var i = 0; i < order.length && out.length < (max || list.length); i++) {
        var q = byApp[order[i]];
        if (q.length) out.push(q.shift());
      }
      order = order.filter(function(a) { return byApp[a].length; });
    }
    return out;
  }
  function dueCount(kid) {
    var td = dayNum();
    return all(kid).filter(function(it) { return it.due <= td; }).length;
  }

  // ── the day's review ────────────────────────────────────────
  function doneToday(kid) { return !!_load(kid).done[dateKey()]; }

  // Marks today's review as finished. Returns { first, streak }; `first`
  // is true only the first time today (that is when the star is earned).
  function complete(kid, answered) {
    var d = _load(kid), k = dateKey(), first = !d.done[k];
    d.done[k] = (d.done[k] | 0) + Math.max(1, answered | 0);
    // Keep about a year of days; the star rule counts these.
    var keys = Object.keys(d.done).sort();
    if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(function(x) { delete d.done[x]; });
    _save(kid, d);
    return { first: first, streak: streak(kid) };
  }

  // Days in a row with a finished review, ending today (or yesterday,
  // so the flame is still lit until the day is over).
  function streak(kid) {
    var done = _load(kid).done, n = 0, d = new Date();
    if (!done[dateKey(d)]) d.setDate(d.getDate() - 1);
    while (done[dateKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function counts(kid) {
    var d = _load(kid), td = dayNum(), boxes = [0, 0, 0, 0, 0], dueN = 0, total = 0;
    Object.keys(d.items).forEach(function(k) {
      var it = d.items[k]; total++;
      boxes[Math.min(4, Math.max(0, (it.box | 0) - 1))]++;
      if (it.due <= td) dueN++;
    });
    return { due: dueN, total: total, boxes: boxes, retired: d.retired | 0, streak: streak(kid), doneToday: !!d.done[dateKey()] };
  }

  return {
    add: add, idFor: idFor, hit: hit, miss: miss, get: get, all: all, due: due, dueCount: dueCount,
    complete: complete, doneToday: doneToday, streak: streak, counts: counts,
    GAPS: GAPS, dayNum: dayNum, dateKey: dateKey, PREFIX: PREFIX
  };
})();

if (typeof window !== 'undefined') window.Review = Review;
