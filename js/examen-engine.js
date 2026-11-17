/* ================================================================
   EXAMEN Y VIRTUDES — rules (js/examen-engine.js)
   Pure functions over the kid's saved journal, shared by the app,
   the star rule's test and the Sunday Report. No DOM.

   Saved per kid at zs_examen_<kid> (one JSON blob, synced):
     { v: 1, lang: 'es' | 'en',
       entries: {
         'YYYY-MM-DD': {
           done: true, t: <ms finished>,
           thanks: ['familia', …], thanksText: '…', draw: 'data:image/jpeg…',
           happy:  ['jugar', …],   happyText: '…',
           better: ['turno', …],   betterText: '…',
           virtue: 'paciencia', prayer: 'avemaria',
           did: 'yes' | 'little' | 'notyet', didOn: 'YYYY-MM-DD'
         } } }
   `did` is the answer, the next evening, to "did you get to practise
   it?". Only ever added fields; older blobs load as they are.

   Stars: one for each evening with a finished reflection (so at most
   one a day). The streak is gentle: it only ever counts up, a missed
   evening is never mentioned, and "not yet" is never a failure.
   ================================================================ */

var ExamenEngine = (function() {
  'use strict';

  var PREFIX = 'zs_examen_';
  var MAX_TEXT = 280;          // the longest answer an older kid can write
  var KEEP_DRAWINGS = 10;      // drawings kept (newest), to keep the synced blob small
  var MAX_DRAWING = 40000;     // characters in one stored drawing (a 240 × 144 JPEG is ~10 000)
  var CHECK_DAYS = 3;          // how far back "did you practise it?" looks
  var PRACTISED = { yes: true, little: true };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseDay(k) {
    var p = String(k).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function addDays(k, n) {
    var d = parseDay(k);
    return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
  }
  function isDay(k) { return /^\d{4}-\d\d-\d\d$/.test(String(k)); }

  // Monday of the week that holds day k (the Sunday Report's week).
  function mondayOf(k) {
    var d = parseDay(k), wd = d.getDay();
    return addDays(k, wd === 0 ? -6 : 1 - wd);
  }

  function clip(s, n) { return String(s == null ? '' : s).slice(0, n || MAX_TEXT); }
  function ids(a) {
    if (!Array.isArray(a)) return [];
    var out = [];
    a.forEach(function(x) { if (typeof x === 'string' && x && out.indexOf(x) === -1 && out.length < 10) out.push(x); });
    return out;
  }

  function migrate(raw) {
    var d = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
    if (!d.v) d.v = 1;
    if (d.lang !== 'es' && d.lang !== 'en') d.lang = 'es';
    if (!d.entries || typeof d.entries !== 'object' || Array.isArray(d.entries)) d.entries = {};
    Object.keys(d.entries).forEach(function(k) {
      var e = d.entries[k];
      if (!isDay(k) || !e || typeof e !== 'object') { delete d.entries[k]; return; }
      ['thanks', 'happy', 'better'].forEach(function(f) { if (e[f] !== undefined) e[f] = ids(e[f]); });
    });
    return d;
  }

  function days(d) { return Object.keys((d && d.entries) || {}).filter(isDay).sort(); }
  function entry(d, k) { return (d && d.entries && d.entries[k]) || null; }
  function isDone(d, k) { var e = entry(d, k); return !!(e && e.done); }

  // Store tonight's answers. Returns { first: true } the first time the
  // day is finished (that is the one star the day can give).
  function saveEntry(d, k, e, now) {
    var old = d.entries[k] || {};
    var first = !old.done;
    var out = {};
    for (var f in old) out[f] = old[f];
    out.done = true;
    out.t = old.t || (now || Date.now());
    out.thanks = ids(e.thanks); out.thanksText = clip(e.thanksText);
    out.happy = ids(e.happy);   out.happyText = clip(e.happyText);
    out.better = ids(e.better); out.betterText = clip(e.betterText);
    if (e.betterNone) out.betterNone = true; else delete out.betterNone;
    out.virtue = typeof e.virtue === 'string' ? e.virtue : '';
    out.prayer = typeof e.prayer === 'string' ? e.prayer : '';
    if (typeof e.draw === 'string' && /^data:image\/(png|jpeg);base64,/.test(e.draw) && e.draw.length <= MAX_DRAWING) out.draw = e.draw;
    else if (e.draw === null) delete out.draw;
    d.entries[k] = out;
    prune(d);
    return { first: first };
  }

  // Only the newest drawings are kept; the words always stay.
  function prune(d) {
    var withDraw = days(d).filter(function(k) { return d.entries[k].draw; });
    while (withDraw.length > KEEP_DRAWINGS) delete d.entries[withDraw.shift()].draw;
    return d;
  }

  // The latest virtue chosen in the last few evenings (before today)
  // whose "did you practise it?" has not been answered yet.
  function pendingCheck(d, today) {
    for (var i = 1; i <= CHECK_DAYS; i++) {
      var k = addDays(today, -i), e = entry(d, k);
      if (e && e.done) return (e.virtue && !e.did) ? { day: k, virtue: e.virtue } : null;
    }
    return null;
  }

  function answerCheck(d, k, did, today) {
    var e = entry(d, k);
    if (!e || ['yes', 'little', 'notyet'].indexOf(did) === -1) return false;
    e.did = did;
    e.didOn = today;
    return true;
  }

  // Evenings in a row up to today (or up to yesterday while tonight's
  // is still to do). Never negative, never "lost".
  function streak(d, today) {
    var k = isDone(d, today) ? today : addDays(today, -1), n = 0;
    while (isDone(d, k)) { n++; k = addDays(k, -1); }
    return n;
  }
  function total(d) { return days(d).filter(function(k) { return d.entries[k].done; }).length; }
  function stars(d) { return total(migrate(d)); }

  // One week, from `from` to `to` (day keys, inclusive).
  //   evenings   reflections finished
  //   chosen     { virtue: times chosen for the next day }
  //   practised  { virtue: times the kid said yes / a little }
  function week(d, from, to) {
    var out = { evenings: 0, chosen: {}, practised: {}, top: null };
    days(d).forEach(function(k) {
      var e = d.entries[k];
      if (k >= from && k <= to && e.done) {
        out.evenings++;
        if (e.virtue) out.chosen[e.virtue] = (out.chosen[e.virtue] || 0) + 1;
      }
      if (e.didOn && e.didOn >= from && e.didOn <= to && PRACTISED[e.did] && e.virtue) {
        out.practised[e.virtue] = (out.practised[e.virtue] || 0) + 1;
      }
    });
    var best = null;
    Object.keys(out.practised).sort().forEach(function(v) {
      if (!best || out.practised[v] > out.practised[best]) best = v;
    });
    if (best) out.top = { id: best, n: out.practised[best] };
    return out;
  }
  function thisWeek(d, today) { var m = mondayOf(today); return week(d, m, addDays(m, 6)); }

  // ── Sunday Report ──────────────────────────────────────────────
  // Counts only: what a kid wrote stays in their journal.
  function _virtueName(id, lang) {
    var v = (typeof ExamenData !== 'undefined') ? ExamenData.virtue(id) : null;
    return v ? v.name[lang === 'es' ? 0 : 1].toLowerCase() : id;
  }
  function insightFor(d, from, to) {
    var w = week(migrate(d), from, to), strong = [];
    if (!w.evenings && !w.top) return null;
    var parts = [];
    if (w.evenings) parts.push(w.evenings + (w.evenings === 1 ? ' evening' : ' evenings') + ' of reflection');
    if (w.top) parts.push('practised ' + _virtueName(w.top.id, 'en') + ' ' + w.top.n + (w.top.n === 1 ? ' time' : ' times') + ' 🌟');
    strong.push({ text: 'Examen y Virtudes — ' + parts.join('; ') });
    return { strong: strong, working: [] };
  }
  function _reportWeek() {
    var base = dayKey(new Date());
    try {
      var p = new URLSearchParams(window.location.search).get('week');
      if (p && isDay(p)) base = p;
    } catch (e) {}
    var m = mondayOf(base);
    return { from: m, to: addDays(m, 6) };
  }
  if (typeof SundayReport !== 'undefined' && SundayReport.addInsightSource) {
    SundayReport.addInsightSource(function(kidName) {
      var raw = null;
      try { raw = JSON.parse(localStorage.getItem(PREFIX + String(kidName).toLowerCase().replace(/\s+/g, '_'))); } catch (e) {}
      if (!raw) return null;
      var w = _reportWeek();
      return insightFor(raw, w.from, w.to);
    });
  }

  return {
    PREFIX: PREFIX, MAX_TEXT: MAX_TEXT, KEEP_DRAWINGS: KEEP_DRAWINGS, MAX_DRAWING: MAX_DRAWING,
    dayKey: dayKey, addDays: addDays, mondayOf: mondayOf,
    migrate: migrate, days: days, entry: entry, isDone: isDone, saveEntry: saveEntry, prune: prune,
    pendingCheck: pendingCheck, answerCheck: answerCheck,
    streak: streak, total: total, stars: stars, week: week, thisWeek: thisWeek, insightFor: insightFor
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ExamenEngine;
