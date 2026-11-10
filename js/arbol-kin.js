/* ================================================================
   ÁRBOL FAMILIAR — who is who (js/arbol-kin.js)

   Pure functions over the stored tree (see arbol-store.js): no DOM, no
   storage, so the tests can check every kinship term.

   index(store)                       -> idx (parents, children, spouses of everyone)
   pedigree(idx, id, gens)            -> rows of 1, 2, 4, 8... slots (null = unknown)
   relate(idx, a, b)                  -> what a is to b: { kind, key, up, down, k, r, half, common }
   term(rel, lang, sex)               -> 'abuela', 'primo hermano', 'great-grandfather'...
   path(idx, a, b, rel)               -> the people between them, up through the common ancestor

   "What a is to b" reads: relate(idx, grandmaId, kidId) is a 'grandparent', and
   term() of it is 'abuela' (so: "Rosa es la abuela de Ana").
   Counting: up = generations from a to the nearest shared ancestor,
   down = generations from b to that ancestor. a = grandmother of b is up 0, down 2.
   ================================================================ */
(function(root) {
  'use strict';

  var MAXGEN = 14;

  // ---------------------------------------------------------------
  // Index
  // ---------------------------------------------------------------
  function index(store) {
    var P = store.P || {}, F = store.F || {}, par = {}, kids = {}, sp = {}, ex = {}, id, fid, f;
    for (id in P) { par[id] = []; kids[id] = []; sp[id] = []; ex[id] = []; }
    function add(map, id, v) { if (map[id] && v && map[id].indexOf(v) < 0) map[id].push(v); }
    for (id in P) {
      (P[id].fc || []).forEach(function(x) {
        var fm = F[x.split('|')[0]];
        if (!fm) return;
        [fm.h, fm.w].forEach(function(pp) { if (pp && P[pp] && !P[pp].gone && pp !== id) add(par, id, pp); });
      });
    }
    for (fid in F) {
      f = F[fid];
      (f.c || []).forEach(function(c) {
        [f.h, f.w].forEach(function(pp) { if (pp && P[pp] && P[c] && pp !== c) add(kids, pp, c); });
      });
      if (f.h && f.w && P[f.h] && P[f.w] && f.h !== f.w) {
        // a divorced or annulled marriage makes them "former" spouses, not relatives by marriage
        var gone = (f.e || []).some(function(e) { return e[0] === 'DIV' || e[0] === 'ANUL'; });
        if (gone) { add(ex, f.h, f.w); add(ex, f.w, f.h); } else { add(sp, f.h, f.w); add(sp, f.w, f.h); }
      }
    }
    return { P: P, F: F, par: par, kids: kids, sp: sp, ex: ex };
  }

  // The family a person grew up in first: a birth family before an adoptive one
  function primaryFamily(idx, id) {
    var p = idx.P[id], best = null, i, parts, fm;
    if (!p) return null;
    for (i = 0; i < (p.fc || []).length; i++) {
      parts = p.fc[i].split('|');
      fm = idx.F[parts[0]];
      if (!fm) continue;
      if (!parts[1] || parts[1] === 'birth') return fm;
      if (!best) best = fm;
    }
    return best;
  }

  function parentsOf(idx, id) {
    var fm = primaryFamily(idx, id), out = [];
    if (!fm) return [null, null];
    out = [fm.h && idx.P[fm.h] && !idx.P[fm.h].gone && fm.h !== id ? fm.h : null,
           fm.w && idx.P[fm.w] && !idx.P[fm.w].gone && fm.w !== id ? fm.w : null];
    return out;
  }

  function pedigree(idx, id, gens) {
    var rows = [[id]], g, row, next, i, pp;
    for (g = 1; g <= gens; g++) {
      row = rows[g - 1]; next = [];
      for (i = 0; i < row.length; i++) {
        pp = row[i] ? parentsOf(idx, row[i]) : [null, null];
        next.push(pp[0], pp[1]);
      }
      rows.push(next);
    }
    return rows;
  }

  function siblings(idx, id) {
    var out = [], seen = {};
    seen[id] = 1;
    (idx.par[id] || []).forEach(function(pp) {
      (idx.kids[pp] || []).forEach(function(c) { if (!seen[c]) { seen[c] = 1; out.push(c); } });
    });
    return out;
  }

  // Ancestors of id with their distance: { <id>: n }, id itself at 0
  function up(idx, id, maxGen) {
    var dist = {}, queue = [id], i, cur, ps;
    dist[id] = 0;
    for (i = 0; i < queue.length; i++) {
      cur = queue[i];
      if (dist[cur] >= (maxGen || MAXGEN)) continue;
      ps = idx.par[cur] || [];
      ps.forEach(function(pp) { if (dist[pp] == null) { dist[pp] = dist[cur] + 1; queue.push(pp); } });
    }
    return dist;
  }

  // Chain from id up to ancestor (inclusive), nearest route
  function chain(idx, id, anc) {
    var prev = {}, queue = [id], i, cur, found = id === anc;
    prev[id] = null;
    for (i = 0; i < queue.length && !found; i++) {
      cur = queue[i];
      (idx.par[cur] || []).forEach(function(pp) {
        if (prev[pp] === undefined) { prev[pp] = cur; queue.push(pp); if (pp === anc) found = true; }
      });
    }
    if (!found) return [];
    var out = [], c = anc;
    while (c != null) { out.unshift(c); c = prev[c]; }
    return out;
  }

  // ---------------------------------------------------------------
  // Relationship
  // ---------------------------------------------------------------
  function blood(idx, a, b) {
    if (a === b) return { kind: 'self', key: 'self', up: 0, down: 0 };
    var A = up(idx, a), B = up(idx, b), best = null, id, s, common = [];
    for (id in A) {
      if (B[id] == null) continue;
      s = A[id] + B[id];
      if (!best || s < best.s || (s === best.s && Math.max(A[id], B[id]) < Math.max(best.da, best.db))) best = { s: s, da: A[id], db: B[id] };
    }
    if (!best) return null;
    for (id in A) if (B[id] != null && A[id] + B[id] === best.s) common.push(id);
    var da = best.da, db = best.db, rel = { kind: 'blood', up: da, down: db, common: common, half: false };
    if (da === 0) { rel.key = 'anc'; rel.n = db; }
    else if (db === 0) { rel.key = 'desc'; rel.n = da; }
    else if (da === 1 && db === 1) {
      rel.key = 'sib';
      // half only when both are known to have two parents and they differ in one
      var pa = (idx.par[a] || []), pb = (idx.par[b] || []);
      if (pa.length >= 2 && pb.length >= 2 && common.length === 1) rel.half = true;
    }
    else if (da === 1) { rel.key = 'uncle'; rel.n = db - 2; }
    else if (db === 1) { rel.key = 'nibling'; rel.n = da - 2; }
    else { rel.key = 'cousin'; rel.k = Math.min(da, db) - 1; rel.r = Math.abs(da - db); }
    return rel;
  }

  function relate(idx, a, b) {
    if (!idx.P[a] || !idx.P[b]) return { kind: 'none', key: 'none' };
    var r = blood(idx, a, b);
    if (r) return r;
    if ((idx.sp[a] || []).indexOf(b) >= 0) return { kind: 'spouse', key: 'spouse' };
    if ((idx.ex[a] || []).indexOf(b) >= 0) return { kind: 'ex', key: 'ex' };
    var i, s, x;
    // a's spouse is b's blood relative: a is a relative by marriage
    for (i = 0; i < (idx.sp[a] || []).length; i++) {
      s = idx.sp[a][i]; x = blood(idx, s, b);
      if (x && x.kind === 'blood') return { kind: 'marriage', via: s, side: 'spouse-of-relative', of: x };
    }
    // a is a blood relative of b's spouse
    for (i = 0; i < (idx.sp[b] || []).length; i++) {
      s = idx.sp[b][i]; x = blood(idx, a, s);
      if (x && x.kind === 'blood') return { kind: 'marriage', via: s, side: 'relative-of-spouse', of: x };
    }
    return { kind: 'none', key: 'none' };
  }

  // ---------------------------------------------------------------
  // Words
  // ---------------------------------------------------------------
  // [Spanish m, Spanish f, Spanish neutral, English m, English f, English neutral]
  function T(esm, esf, esn, enm, enf, enn) { return [esm, esf, esn, enm, enf, enn]; }
  function pick(t, lang, sex) {
    var o = lang === 'es' ? 0 : 3;
    return sex === 'M' ? t[o] : sex === 'F' ? t[o + 1] : t[o + 2];
  }

  var ANC = [null,
    T('padre', 'madre', 'padre o madre', 'father', 'mother', 'parent'),
    T('abuelo', 'abuela', 'abuelo/a', 'grandfather', 'grandmother', 'grandparent'),
    T('bisabuelo', 'bisabuela', 'bisabuelo/a', 'great-grandfather', 'great-grandmother', 'great-grandparent'),
    T('tatarabuelo', 'tatarabuela', 'tatarabuelo/a', 'great-great-grandfather', 'great-great-grandmother', 'great-great-grandparent'),
    T('trastatarabuelo', 'trastatarabuela', 'trastatarabuelo/a', '3rd great-grandfather', '3rd great-grandmother', '3rd great-grandparent')];
  var DESC = [null,
    T('hijo', 'hija', 'hijo/a', 'son', 'daughter', 'child'),
    T('nieto', 'nieta', 'nieto/a', 'grandson', 'granddaughter', 'grandchild'),
    T('bisnieto', 'bisnieta', 'bisnieto/a', 'great-grandson', 'great-granddaughter', 'great-grandchild'),
    T('tataranieto', 'tataranieta', 'tataranieto/a', 'great-great-grandson', 'great-great-granddaughter', 'great-great-grandchild'),
    T('trastataranieto', 'trastataranieta', 'trastataranieto/a', '3rd great-grandson', '3rd great-granddaughter', '3rd great-grandchild')];

  function ordinalEn(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function ancTerm(n, lang, sex) {
    if (n < ANC.length) return pick(ANC[n], lang, sex);
    var g = n - 2;        // grandparent = 0 greats... 3rd great-grandparent = n 5
    if (lang === 'es') return (sex === 'M' ? 'antepasado' : sex === 'F' ? 'antepasada' : 'antepasado/a') + ' de ' + n + ' generaciones atrás';
    return ordinalEn(g) + ' great-' + (sex === 'M' ? 'grandfather' : sex === 'F' ? 'grandmother' : 'grandparent');
  }
  function descTerm(n, lang, sex) {
    if (n < DESC.length) return pick(DESC[n], lang, sex);
    if (lang === 'es') return 'descendiente de ' + n + ' generaciones';
    return ordinalEn(n - 2) + ' great-' + (sex === 'M' ? 'grandson' : sex === 'F' ? 'granddaughter' : 'grandchild');
  }

  function uncleTerm(n, lang, sex) {
    if (lang === 'es') {
      var base = sex === 'M' ? 'tío' : sex === 'F' ? 'tía' : 'tío/a';
      if (n === 0) return base;
      var g = ['', 'abuel', 'bisabuel', 'tatarabuel'][n];
      if (!g) return base + (sex === 'M' ? ' lejano' : sex === 'F' ? ' lejana' : ' lejano/a');
      return base + ' ' + g + (sex === 'M' ? 'o' : sex === 'F' ? 'a' : 'o/a');
    }
    var b = sex === 'M' ? 'uncle' : sex === 'F' ? 'aunt' : 'aunt or uncle';
    if (n === 0) return b;
    if (n === 1) return 'great-' + b;
    return (n === 2 ? 'great-great-' : ordinalEn(n) + ' great-') + b;
  }
  function niblingTerm(n, lang, sex) {
    if (lang === 'es') {
      var base = sex === 'M' ? 'sobrino' : sex === 'F' ? 'sobrina' : 'sobrino/a';
      if (n === 0) return base;
      var tail = n === 1 ? ['nieto', 'nieta', 'nieto/a'] : n === 2 ? ['bisnieto', 'bisnieta', 'bisnieto/a'] : ['tataranieto', 'tataranieta', 'tataranieto/a'];
      return base + ' ' + (sex === 'M' ? tail[0] : sex === 'F' ? tail[1] : tail[2]);
    }
    var b = sex === 'M' ? 'nephew' : sex === 'F' ? 'niece' : 'niece or nephew';
    if (n === 0) return b;
    if (n === 1) return 'grand-' + b;
    return (n === 2 ? 'great-grand-' : ordinalEn(n) + ' great-grand-') + b;
  }
  function cousinTerm(k, r, lang, sex) {
    var out;
    if (lang === 'es') {
      var pr = sex === 'M' ? 'primo' : sex === 'F' ? 'prima' : 'primo/a', last = sex === 'M' ? 'o' : sex === 'F' ? 'a' : 'o/a';
      var hermano = sex === 'M' ? 'hermano' : sex === 'F' ? 'hermana' : 'hermano/a';
      if (k === 1) out = pr + ' ' + hermano;
      else if (k === 2) out = pr + ' segund' + last;
      else if (k === 3) out = pr + ' tercer' + (sex === 'F' ? 'a' : sex === 'M' ? 'o' : 'o/a');
      else out = pr + ' de ' + k + '.º grado';
      if (r) out += ' (' + (r === 1 ? 'una generación de diferencia' : r + ' generaciones de diferencia') + ')';
      return out;
    }
    out = (k === 1 ? '1st' : ordinalEn(k)) + ' cousin';
    if (r) out += ' ' + (r === 1 ? 'once' : r === 2 ? 'twice' : r + ' times') + ' removed';
    return out;
  }

  // 'by marriage' words
  var MARRIAGE = {
    stepparent: T('padrastro', 'madrastra', 'padrastro/madrastra', 'stepfather', 'stepmother', 'stepparent'),
    stepchild: T('hijastro', 'hijastra', 'hijastro/a', 'stepson', 'stepdaughter', 'stepchild'),
    inlawParent: T('suegro', 'suegra', 'suegro/a', 'father-in-law', 'mother-in-law', 'parent-in-law'),
    inlawChild: T('yerno', 'nuera', 'yerno/nuera', 'son-in-law', 'daughter-in-law', 'child-in-law'),
    inlawSib: T('cuñado', 'cuñada', 'cuñado/a', 'brother-in-law', 'sister-in-law', 'brother- or sister-in-law'),
    spouse: T('esposo', 'esposa', 'esposo/a', 'husband', 'wife', 'spouse'),
    ex: T('ex esposo', 'ex esposa', 'ex esposo/a', 'former husband', 'former wife', 'former spouse')
  };

  function blTerm(x, lang, sex) {
    switch (x.key) {
      case 'self': return lang === 'es' ? 'la misma persona' : 'the same person';
      case 'anc': return ancTerm(x.n, lang, sex);
      case 'desc': return descTerm(x.n, lang, sex);
      case 'sib':
        if (lang === 'es') return (x.half ? 'medio ' : '') + (sex === 'M' ? 'hermano' : sex === 'F' ? 'hermana' : 'hermano/a');
        return (x.half ? 'half-' : '') + (sex === 'M' ? 'brother' : sex === 'F' ? 'sister' : 'sibling');
      case 'uncle': return uncleTerm(x.n, lang, sex);
      case 'nibling': return niblingTerm(x.n, lang, sex);
      case 'cousin': return cousinTerm(x.k, x.r, lang, sex);
    }
    return '';
  }

  function polit(base, lang, sex) {
    if (lang === 'es') return base + (sex === 'F' ? ' política' : sex === 'M' ? ' político' : ' político/a');
    return base + ' by marriage';
  }

  // the word for "a is ___ of b" (sex is a's: 'M' | 'F' | '')
  function term(rel, lang, sex) {
    lang = lang === 'es' ? 'es' : 'en';
    if (!rel) return '';
    if (rel.kind === 'blood' || rel.kind === 'self') return blTerm(rel, lang, sex);
    if (rel.kind === 'spouse') return pick(MARRIAGE.spouse, lang, sex);
    if (rel.kind === 'ex') return pick(MARRIAGE.ex, lang, sex);
    if (rel.kind === 'marriage') {
      var x = rel.of;
      if (rel.side === 'spouse-of-relative') {
        // a is married to someone who is b's relative
        if (x.key === 'anc' && x.n === 1) return pick(MARRIAGE.stepparent, lang, sex);
        if (x.key === 'desc' && x.n === 1) return pick(MARRIAGE.inlawChild, lang, sex);
        if (x.key === 'sib') return pick(MARRIAGE.inlawSib, lang, sex);
        return polit(blTerm(x, lang, sex), lang, sex);
      }
      // a is a relative of b's spouse
      if (x.key === 'anc' && x.n === 1) return pick(MARRIAGE.inlawParent, lang, sex);
      if (x.key === 'desc' && x.n === 1) return pick(MARRIAGE.stepchild, lang, sex);
      if (x.key === 'sib') return pick(MARRIAGE.inlawSib, lang, sex);
      return polit(blTerm(x, lang, sex), lang, sex);
    }
    return '';
  }

  // The two chains for a picture: a up to the shared ancestor, and b up to it.
  function path(idx, a, b, rel) {
    rel = rel || relate(idx, a, b);
    if (rel.kind !== 'blood' || !rel.common || !rel.common.length) return null;
    var anc = rel.common[0];
    return { anc: anc, left: chain(idx, a, anc), right: chain(idx, b, anc) };
  }

  // Everyone who is some blood relation of id (ancestors, descendants and their
  // descendants), nearest first. Used to offer a short list for "How are we related?".
  function nearby(idx, id, limit) {
    var A = up(idx, id, 6), out = [], seen = {}, a, queue, i, cur, depth = {};
    for (a in A) {
      if (a === id) continue;
      queue = [a]; depth[a] = A[a];
      if (!seen[a]) { seen[a] = 1; out.push([a, A[a]]); }
      for (i = 0; i < queue.length; i++) {
        cur = queue[i];
        if (depth[cur] - A[a] >= 3) continue;
        (idx.kids[cur] || []).forEach(function(c) {
          if (!seen[c] && c !== id) { seen[c] = 1; depth[c] = depth[cur] + 1; out.push([c, A[a] + (depth[c] - A[a])]); queue.push(c); }
        });
      }
    }
    out.sort(function(x, y) { return x[1] - y[1]; });
    return out.slice(0, limit || 60).map(function(x) { return x[0]; });
  }

  var api = {
    index: index, pedigree: pedigree, parentsOf: parentsOf, siblings: siblings, up: up, chain: chain,
    relate: relate, term: term, path: path, nearby: nearby, primaryFamily: primaryFamily
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArbolKin = api;
})(typeof window !== 'undefined' ? window : this);
