/* ================================================================
   ÁRBOL FAMILIAR — the stored tree (js/arbol-store.js)

   The family tree is HOUSEHOLD data: one JSON blob at the localStorage key
   zs_family_tree, synced to the family server as household item
   "family_tree" (the server keeps one JSON document per item, 5 MB at most).
   It holds real people, living ones included, so it exists only on the
   family's devices and server. Never in this repository.

   Stored shape (v1), compact on purpose (a 5,000-person tree is about 1 MB):
     { v:1,
       imp: { ts, file, ver, software, people, fams, trim:0..3, notes, media },
       (trim: 0 everything, 1 shorter notes, 2 no notes and fewer events, 3 births, deaths and marriages only)
       P: { <id>: { g, s, x, k, z, lv, ft, e:[[type,date,place,lat,lon]], n:[text],
                    fc:['F1', 'F2|adop'], fs:['F3'], sc:<source count>,
                    a: { ... kid-added content ... }, gone:1 } },
       F: { <id>: { h, w, c:[ids], e:[[type,date,place]], n:[text] } },
       cfg: { map:{ <kidKey>: <personId> }, notes:0|1, living:0|1 } }

   The GEDCOM facts (everything but "a") are replaced on each import. "a" holds
   what the family adds later, keyed by person, and is never touched by an
   import: a photo (a.photo) and recorded voice notes (a.voice:[{id, url, ts}]).
   Those need the sync server to accept media uploads, which it does not yet,
   so v1 only keeps the place for them. See merge() for how a re-import matches
   people to the ones already stored.

   Privacy (kids only ever see the view() of a person):
     - a living person shows a first name, a birth YEAR and a country only;
       a parent can opt in to full names and exact dates (cfg.living = 1);
     - notes are shown only when cfg.notes = 1, and never for a living
       person unless cfg.living = 1 too.
   ================================================================ */
(function(root) {
  'use strict';

  var G = (typeof require === 'function' && typeof module !== 'undefined') ? require('./gedcom.js') : root.Gedcom;

  var KEY = 'zs_family_tree';
  // The binding limit is the device: localStorage holds about 5 million characters per site on an iPad,
  // and the whole suite shares it. 1.8 million characters (about 2.5 MB on the wire, half the server's
  // 5 MB limit) holds roughly 5,000 richly annotated people or 10,000 bare ones.
  var BUDGET = 1800000;
  var NOTE_CAP = [1200, 300], NOTES_PER = [8, 3];
  var LIVING_YEARS = 100;          // born within this many years and no death record: treated as living

  var CORE_EVENTS = { BIRT: 1, CHR: 1, BAPM: 1, DEAT: 1, BURI: 1, CREM: 1, MARR: 1, DIV: 1 };

  function empty() { return { v: 1, imp: null, P: {}, F: {}, cfg: { map: {}, notes: 0, living: 0 } }; }

  // ---------------------------------------------------------------
  // Parsed GEDCOM -> compact records
  // ---------------------------------------------------------------
  function trimEvents(list, level) {
    if (!list) return [];
    var out = [];
    list.forEach(function(e) {
      var t = String(e[0]).split(':')[0];
      if (level >= 3 && !(t === 'BIRT' || t === 'DEAT' || t === 'MARR')) return;
      if (level === 2 && !CORE_EVENTS[t] && t !== 'OCCU' && t !== 'EMIG' && t !== 'IMMI' && t !== 'RESI') return;
      var c = e.slice(0, level >= 3 ? 3 : e.length);
      while (c.length > 2 && (c[c.length - 1] === '' || c[c.length - 1] == null)) c.pop();
      out.push(c);
    });
    // a long list of censuses or residences would crowd out the rest
    if (level >= 1 && out.length > 24) out = out.slice(0, 24);
    return out;
  }

  function compactPerson(p, level, idMap) {
    var o = {}, fc = p.fc.map(function(x) { return (idMap ? idMap.f(x.f) : x.f) + (x.p && x.p !== 'birth' ? '|' + x.p.slice(0, 8) : ''); });
    if (p.g) o.g = p.g;
    if (p.s) o.s = p.s;
    if (p.x) o.x = p.x;
    if (p.k) o.k = p.k;
    if (p.z) o.z = p.z;
    if (p.lv) o.lv = 1;
    if (p.ft) o.ft = p.ft;
    var ev = trimEvents(p.e, level);
    if (ev.length) o.e = ev;
    if (level <= 1 && p.n.length) {
      o.n = p.n.slice(0, NOTES_PER[level]).map(function(t) { return t.length > NOTE_CAP[level] ? t.slice(0, NOTE_CAP[level] - 1) + '…' : t; });
    }
    if (fc.length) o.fc = fc;
    if (p.fs.length) o.fs = p.fs.map(function(f) { return idMap ? idMap.f(f) : f; });
    if (p.src) o.sc = p.src;
    return o;
  }

  function compactFamily(f, level, idMap) {
    var o = {}, m = idMap ? idMap.p : function(x) { return x; };
    if (f.h) o.h = m(f.h);
    if (f.w) o.w = m(f.w);
    if (f.c.length) o.c = f.c.map(m);
    var ev = trimEvents(f.e, level);
    if (ev.length) o.e = ev;
    if (level <= 1 && f.n.length) o.n = f.n.slice(0, 3).map(function(t) { return t.length > NOTE_CAP[level] ? t.slice(0, NOTE_CAP[level] - 1) + '…' : t; });
    return o;
  }

  function size(store) { return JSON.stringify(store).length; }

  // ---------------------------------------------------------------
  // Build a store from a parsed file (no earlier tree)
  // ---------------------------------------------------------------
  function build(parsed, opts) {
    return merge(null, parsed, opts).store;
  }

  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function sameEnough(old, p) {
    var g1 = norm(old.g).split(' ')[0], g2 = norm(p.g).split(' ')[0], s1 = norm(old.s), s2 = norm(p.s);
    if (norm(old.g + ' ' + old.s) === norm(p.g + ' ' + p.s)) return true;
    if (g1 && g1 === g2) return true;
    if (s1 && s1 === s2) return true;
    var by1 = birthYear(old), by2 = G.yearOf(birthDateOf(p.e));
    if (by1 != null && by1 === by2) return true;
    return !norm(old.g + old.s) || !norm(p.g + p.s);
  }

  function birthDateOf(events) {
    var i, t;
    for (i = 0; i < (events || []).length; i++) { t = events[i][0]; if (t === 'BIRT') return events[i][1]; }
    for (i = 0; i < (events || []).length; i++) { t = events[i][0]; if (t === 'CHR' || t === 'BAPM') return events[i][1]; }
    return '';
  }
  function birthYear(p) { return G.yearOf(birthDateOf(p.e)); }

  // Merge a parsed GEDCOM into an existing store (or null). Returns { store, report, error }.
  //   - the same person keeps the same stored id (matched by FamilySearch tree id,
  //     then by the file's own id when the name still agrees), so kid-added
  //     content ("a"), the kids' links and the settings survive;
  //   - everything that comes from the GEDCOM is replaced;
  //   - a stored person who is no longer in the file is dropped, unless they carry
  //     kid-added content: then they stay (marked gone) so nothing is lost.
  function merge(existing, parsed, opts) {
    opts = opts || {};
    var budget = opts.budget || BUDGET, old = existing && existing.P ? existing : empty();
    var report = { added: 0, updated: 0, unchanged: 0, removed: 0, kept: 0, renamed: 0, trim: 0, size: 0 };
    var byFt = {}, claimed = {}, idMap = {}, id, x, p, target, n, fidMap = {};

    for (id in old.P) if (old.P[id].ft && !byFt[old.P[id].ft]) byFt[old.P[id].ft] = id;

    var xrefs = Object.keys(parsed.people);
    xrefs.forEach(function(xr) {
      p = parsed.people[xr];
      target = null;
      if (p.ft && byFt[p.ft] && !claimed[byFt[p.ft]]) target = byFt[p.ft];
      else if (old.P[xr] && !claimed[xr] && !(p.ft && old.P[xr].ft && p.ft !== old.P[xr].ft) && sameEnough(old.P[xr], p)) target = xr;
      if (!target) {
        target = xr; n = 1;
        while (old.P[target] || claimed[target]) target = xr + '~' + (n++);
      }
      claimed[target] = 1;
      idMap[xr] = target;
    });
    var m = { p: function(x) { return idMap[x] || x; }, f: function(x) { return x; } };

    var store = { v: 1, imp: null, P: {}, F: {}, cfg: old.cfg || empty().cfg };
    var level, out, tooBig = true;
    for (level = 0; level <= 3 && tooBig; level++) {
      out = { P: {}, F: {} };
      xrefs.forEach(function(xr) { out.P[idMap[xr]] = compactPerson(parsed.people[xr], level, m); });
      Object.keys(parsed.families).forEach(function(fid) { out.F[fid] = compactFamily(parsed.families[fid], level, m); });
      tooBig = size(out) > budget;
      report.trim = level;
    }
    if (tooBig) return { store: null, report: report, error: 'too-big', size: size(out) };

    store.P = out.P; store.F = out.F;
    xrefs.forEach(function(xr) {
      var t = idMap[xr], was = old.P[t], now = store.P[t];
      if (was && was.a) now.a = was.a;
      if (!was) report.added++;
      else {
        var a = JSON.stringify(strip(was)), b = JSON.stringify(strip(now));
        if (a === b) report.unchanged++; else report.updated++;
        if (norm(was.g + ' ' + was.s) !== norm(now.g + ' ' + now.s)) report.renamed++;
      }
    });
    for (id in old.P) {
      if (claimed[id]) continue;
      if (old.P[id].a) { store.P[id] = { g: old.P[id].g, s: old.P[id].s, z: old.P[id].z, lv: old.P[id].lv, e: old.P[id].e, a: old.P[id].a, gone: 1 }; report.kept++; }
      else report.removed++;
    }
    store.imp = {
      ts: opts.now || Date.now(), file: String(opts.file || '').slice(0, 80), ver: parsed.version || '', software: String(parsed.software || '').slice(0, 40),
      people: Object.keys(parsed.people).length, fams: Object.keys(parsed.families).length, trim: report.trim,
      notes: parsed.stats ? parsed.stats.notes : 0, media: parsed.stats ? parsed.stats.media : 0
    };
    report.size = size(store);
    return { store: store, report: report };
  }
  function strip(p) { var c = {}, k; for (k in p) if (k !== 'a' && k !== 'gone') c[k] = p[k]; return c; }

  // ---------------------------------------------------------------
  // Who is living?
  // ---------------------------------------------------------------
  function hasDeath(p) {
    return (p.e || []).some(function(e) { var t = e[0]; return t === 'DEAT' || t === 'BURI' || t === 'CREM'; });
  }

  // Set of living ids (an object used as a set). nowYear defaults to this year.
  function livingSet(store, nowYear) {
    var yr = nowYear || new Date().getFullYear(), out = {}, id, p;
    function est(id) {
      var q = store.P[id], by = birthYear(q), fams, i, j, f, ys = [], c, pp;
      if (by != null) return by;
      fams = q.fs || [];
      for (i = 0; i < fams.length; i++) {
        f = store.F[fams[i]];
        if (!f) continue;
        for (j = 0; j < (f.c || []).length; j++) { c = store.P[f.c[j]]; if (c && birthYear(c) != null) ys.push(birthYear(c) - 22); }
      }
      if (ys.length) return Math.min.apply(null, ys);
      (q.fc || []).forEach(function(x) {
        var f2 = store.F[x.split('|')[0]];
        if (!f2) return;
        [f2.h, f2.w].forEach(function(par) { pp = par && store.P[par]; if (pp && birthYear(pp) != null) ys.push(birthYear(pp) + 28); });
      });
      if (ys.length) return Math.max.apply(null, ys);
      return null;
    }
    for (id in store.P) {
      p = store.P[id];
      if (p.gone) continue;
      if (hasDeath(p)) continue;
      if (p.lv) { out[id] = 1; continue; }
      var b = est(id);
      if (b == null || yr - b <= LIVING_YEARS) out[id] = 1;   // no sign they are gone: treat as living
    }
    return out;
  }

  // ---------------------------------------------------------------
  // What a kid may see
  // ---------------------------------------------------------------
  function firstName(p) {
    var g = String(p.g || '').trim().split(/\s+/)[0] || '';
    return g;
  }

  function countryPart(place) {
    var parts = String(place || '').split(',');
    return parts[parts.length - 1].trim();
  }

  function eventOf(p, types) {
    var i, e, j;
    for (j = 0; j < types.length; j++) for (i = 0; i < (p.e || []).length; i++) { e = p.e[i]; if (e[0] === types[j]) return e; }
    return null;
  }

  // v = view(store, id, { cfg, living (livingSet), lang, nowYear })
  function view(store, id, o) {
    o = o || {};
    var p = store.P[id];
    if (!p) return null;
    var cfg = o.cfg || store.cfg || {}, full = !!cfg.living, lang = o.lang === 'es' ? 'es' : 'en';
    var live = o.living ? !!o.living[id] : false;
    var hidden = live && !full;
    var b = eventOf(p, ['BIRT', 'CHR', 'BAPM']), d = eventOf(p, ['DEAT', 'BURI', 'CREM']);
    var by = b ? G.yearOf(b[1]) : null, dy = d ? G.yearOf(d[1]) : null;
    var first = firstName(p);
    var v = {
      id: id, z: p.z || '', living: live, gone: !!p.gone,
      first: first || (p.s ? p.s.split(' ')[0] : '?'),
      name: hidden ? (first || '?') : ([p.g, p.s, p.x].filter(Boolean).join(' ') || '?'),
      surname: hidden ? '' : (p.s || ''),
      nick: hidden ? '' : (p.k || ''),
      birthYear: by, deathYear: dy,
      born: b ? (hidden ? (by != null ? String(by) : '') : G.formatDate(b[1], lang, true)) : '',
      died: d && !live ? G.formatDate(d[1], lang, !hidden) : '',
      birthPlace: b ? (hidden ? countryPart(b[2]) : b[2]) : '',
      deathPlace: d && !hidden ? d[2] : '',
      ll: b && b[3] != null && !hidden ? [b[3], b[4]] : null,
      hidden: hidden
    };
    v.years = live ? (by != null ? (lang === 'es' ? 'n. ' : 'b. ') + by : '') : (by != null || dy != null ? (by != null ? by : '?') + '–' + (dy != null ? dy : '?') : '');
    v.notes = (cfg.notes && !hidden && p.n) ? p.n.slice() : [];
    v.events = hidden ? [] : (p.e || []).map(function(e) {
      var t = String(e[0]), c = t.indexOf(':');
      return { type: c < 0 ? t : t.slice(0, c), label: c < 0 ? '' : t.slice(c + 1), date: e[1] || '', year: G.yearOf(e[1]), place: e[2] || '' };
    });
    return v;
  }

  // Name search over people the kid may see (first names for the living, unless opted in).
  function search(store, text, o) {
    o = o || {};
    var q = norm(text), out = [], id, v, hay;
    if (!q) return out;
    var words = q.split(' ');
    for (id in store.P) {
      if (store.P[id].gone) continue;
      v = view(store, id, o);
      hay = norm(v.name + ' ' + (v.nick || ''));
      if (words.every(function(w) { return hay.indexOf(w) >= 0; })) out.push(v);
      if (out.length >= (o.limit || 30)) break;
    }
    return out;
  }

  var api = {
    KEY: KEY, BUDGET: BUDGET, LIVING_YEARS: LIVING_YEARS, empty: empty, build: build, merge: merge, size: size,
    livingSet: livingSet, view: view, search: search, norm: norm, birthYear: birthYear, birthDateOf: birthDateOf,
    countryPart: countryPart, firstName: firstName, hasDeath: hasDeath
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArbolStore = api;
})(typeof window !== 'undefined' ? window : this);
