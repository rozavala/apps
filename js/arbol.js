/* ================================================================
   ÁRBOL FAMILIAR 🌳 — the family tree (js/arbol.js)

   The family's tree is imported by a parent from a GEDCOM file (Parents
   Corner, or the 🔒 button here) and stored as HOUSEHOLD data: see
   js/arbol-store.js. Kids explore it:

     Tree     pan/zoom portrait cards, starting from the kid, then parents,
              grandparents and further back
     Person   a portrait, a mini timeline, a map of the places, notes if allowed
     Related  "How are we related?" for any two people (js/arbol-kin.js)
     Map      "Where did our family come from?" (js/world-map-data.js)
     Quiz     "Who was Abuela's father?" (js/arbol-quiz.js)

   Age tiers (getAgeTier): the youngest see their grandparents on big
   cards and a "tap your grandmother" game; 6 to 8 see three generations;
   older kids see up to six, and can go further back.

   Per kid, one JSON blob at zs_arbol_<kid>, only ever extended:
     { v:1, q:{ grand|who|where|term|older: best score 0..5 }, seen:{ <personId>:1 },
       rel:<times asked>, map:0|1, last:'YYYY-MM-DD' }
   The tree itself is not per kid. It is never written here except by a
   parent (import, the kids' links, the two privacy switches).

   Everything the file says is UNTRUSTED text: it is only ever drawn through
   esc() or as SVG text, never as markup.
   ================================================================ */
var Arbol = (function() {
  'use strict';

  var Store = ArbolStore, Kin = ArbolKin, Art = ArbolArt, Quiz = ArbolQuiz, Places = ArbolPlaces, G = Gedcom, Files = ArbolFiles;
  var PREFIX = 'zs_arbol_';

  var root = null, user = null, age = 8, tier = 'intermediate', kidKey = '';
  var tree = null, treeTs = 0, idx = null, livingSet = null, vcache = {}, ccache = {};
  var ready = false, staleTree = false, syncing = null;
  var data = null;
  var st = { view: 'home', pid: null, root: null, depth: 0, hist: [], q: null, rel: { a: null, b: null, pick: null, text: '' }, map: { gen: 0, sel: null }, par: null, imp: null, pq: {}, fail: false };
  var pan = null, panMoved = false;

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function T(es, en) { return typeof zsT === 'function' ? zsT(es, en) : en; }
  function kl() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function dl() { var l = kl(); return l === 'es' || l === 'both' ? 'es' : 'en'; }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function cut(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function toast(m) { if (typeof ZsDialog !== 'undefined') ZsDialog.toast(m); }
  function log(m) { if (typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Árbol familiar', '🌳', m); } catch (e) {} } }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function isLittle() { return tier === 'beginner'; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nowYear() { return new Date().getFullYear(); }
  function say(text) {
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.say) { try { ZsSpeak.say(text, dl()); } catch (e) {} }
  }
  function sayBtn(text) { return typeof ZsSpeak !== 'undefined' && ZsSpeak.button ? ZsSpeak.button(text, dl()) : ''; }

  // ---------------------------------------------------------------
  // Storage: the household tree, and this kid's progress
  // ---------------------------------------------------------------
  // The tree lives in IndexedDB (js/arbol-db.js): a big one does not fit in localStorage.
  function loadTree() {
    return ArbolDB.get().then(function(rec) {
      treeTs = rec ? rec.ts : 0;
      applyTree(rec ? rec.tree : null);
      ready = true;
      return tree;
    }, function() { ready = true; applyTree(null); return null; });
  }
  function applyTree(t) {
    if (!t || typeof t !== 'object' || !t.P || typeof t.P !== 'object' || !Object.keys(t.P).length) t = null;
    if (t) {
      if (!t.F || typeof t.F !== 'object') t.F = {};
      if (!t.cfg || typeof t.cfg !== 'object') t.cfg = {};
      if (!t.cfg.map || typeof t.cfg.map !== 'object') t.cfg.map = {};
      t.cfg.notes = t.cfg.notes ? 1 : 0;
      t.cfg.living = t.cfg.living ? 1 : 0;
    }
    tree = t;
    vcache = {}; ccache = {};
    idx = t ? Kin.index(t) : null;
    livingSet = t ? Store.livingSet(t, nowYear()) : {};
    return t;
  }
  // Resolves true once saved on this device; the upload to the family server follows on its own.
  function saveTree() {
    var ts = Date.now();
    vcache = {}; ccache = {};
    return ArbolDB.put(tree, ts).then(function() {
      treeTs = ts;
      ArbolSync.push(tree, ts).catch(function(e) { if (typeof Debug !== 'undefined') Debug.error('[Arbol] upload failed', e && e.message); });
      return true;
    }, function() { return false; });
  }

  // Bring this device and the family server in line: the newer tree wins.
  function syncTree() {
    if (syncing || !ArbolSync.online()) return syncing || Promise.resolve();
    syncing = ArbolSync.pull(treeTs).then(function(r) {
      if (!r) { if (tree) return ArbolSync.push(tree, treeTs || Date.now()); return; }
      if (r.same) { if (tree && r.ts < treeTs) return ArbolSync.push(tree, treeTs); return; }
      if (r.empty) {
        if (!tree || treeTs >= r.ts) return;
        return ArbolDB.clear().then(function() { treeTs = 0; refreshFromStore(null); });
      }
      return ArbolDB.put(r.tree, r.ts).then(function() { treeTs = r.ts; refreshFromStore(r.tree); });
    }).catch(function(e) {
      if (typeof Debug !== 'undefined') Debug.error('[Arbol] sync failed', e && e.message);
    }).then(function() { syncing = null; });
    return syncing;
  }
  function refreshFromStore(t) {
    // never swap the tree out from under a parent's screen or a quiz in progress
    if (st.view === 'parents' || st.q) { staleTree = true; return; }
    applyTree(t); render();
  }

  function dataKey() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function loadData() {
    var key = dataKey(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    if (!d.q || typeof d.q !== 'object') d.q = {};
    if (!d.seen || typeof d.seen !== 'object') d.seen = {};
    d.rel = d.rel | 0; d.map = d.map ? 1 : 0; d.v = 1;
    return d;
  }
  function saveData() {
    var key = dataKey();
    if (!key || !data) return;
    data.last = today();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }
  function starsNow() { return typeof getAppStars === 'function' ? getAppStars('arbol', data || {}) : 0; }

  // ---------------------------------------------------------------
  // People, as a kid may see them
  // ---------------------------------------------------------------
  function V(id) {
    if (!tree || !tree.P[id]) return null;
    if (!vcache[id]) vcache[id] = Store.view(tree, id, { cfg: tree.cfg, living: livingSet, lang: dl() });
    return vcache[id];
  }
  function VP(id) {          // a parent's view: real names
    return Store.view(tree, id, { cfg: { living: 1, notes: 0 }, living: livingSet, lang: dl() });
  }
  function kindOf(v) {
    if (!v || v.birthYear == null) return 'adult';
    var end = v.deathYear != null ? v.deathYear : nowYear(), a = end - v.birthYear;
    return a < 13 ? 'child' : a >= 65 ? 'elder' : 'adult';
  }
  function cc(id) {          // the country of a person's birthplace, if it can be told
    if (ccache[id] === undefined) {
      var v = V(id);
      ccache[id] = v && v.birthPlace && Places ? (Places.country(v.birthPlace) || null) : null;
    }
    return ccache[id];
  }
  function countryName(code) { return Places.name(code, dl()) || String(code || '').toUpperCase(); }
  function countryNameKid(code) { return T(Places.name(code, 'es') || code, Places.name(code, 'en') || code); }
  function hasFlag(code) { return typeof WorldMap !== 'undefined' && code && WorldMap.hasFlag && WorldMap.hasFlag(code); }
  function flagInline(code, x, y, w) {
    if (!hasFlag(code)) return '';
    var h = Math.round(w * (WorldMap.flagRatio ? (WorldMap.flagRatio(code) || 0.667) : 0.667));
    return WorldMap.flag(code).replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" ');
  }
  function flagHtml(code, w) {
    if (!hasFlag(code)) return '';
    return '<span class="ar-flag" style="width:' + w + 'px">' + WorldMap.flag(code) + '</span>';
  }
  function meId() {
    var m = tree && tree.cfg.map[kidKey];
    return m && tree.P[m] && !tree.P[m].gone ? m : null;
  }
  function fullName(id) { var v = V(id); return v ? v.name : ''; }

  function termPair(a, b) {      // what a is to b, in each language
    var rel = Kin.relate(idx, a, b), sex = tree.P[a].z || '';
    if (rel.kind === 'none') return null;
    return { es: Kin.term(rel, 'es', sex), en: Kin.term(rel, 'en', sex) };
  }
  function termFor(a, b) { var p = termPair(a, b); return p ? T(p.es, p.en) : ''; }

  // ---------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------
  function snap() { return { view: st.view, pid: st.pid, depth: st.depth, root: st.root }; }
  function go(view, o) {
    stopSpeech();
    if (st.view !== view || (o && o.pid && o.pid !== st.pid)) {
      if (!(o && o.noHist)) { st.hist.push(snap()); if (st.hist.length > 40) st.hist.shift(); }
    }
    st.view = view;
    st.fview = null; st.fup = null;
    if (o && o.pid !== undefined) st.pid = o.pid;
    if (o && o.depth !== undefined) st.depth = o.depth;
    render();
    window.scrollTo(0, 0);
  }
  function back() {
    var h = st.hist.pop();
    if (!h) { st.view = 'home'; render(); return; }
    st.view = h.view; st.pid = h.pid; st.depth = h.depth; st.root = h.root;
    render();
  }
  function stopSpeech() { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.stop) { try { ZsSpeak.stop(); } catch (e) {} } }

  // ---------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------
  function head(title, sub) {
    var stars = starsNow();
    return '<header class="ar-head"><div class="ar-brand">' + Art.icon(36) + '<span>' + esc(title || T('Árbol familiar', 'Family Tree')) + '</span></div>' +
      (user && stars ? '<span class="ar-stars" aria-label="' + esc(T('Estrellas', 'Stars')) + '">⭐ ' + stars + '</span>' : '') + '</header>' +
      (sub ? '<p class="ar-lead">' + sub + '</p>' : '');
  }
  function backBar(label) {
    return '<div class="ar-bar"><button class="ar-back" data-act="back" aria-label="' + esc(T('Volver', 'Back')) + '">← ' + esc(label || T('Volver', 'Back')) + '</button></div>';
  }
  function parentBtn() {
    return '<div class="ar-foot"><button class="ar-lock" data-act="parent">🔒 ' + esc(T('Para papás', 'For parents')) + '</button></div>';
  }

  function render() {
    if (!root) return;
    if (staleTree && st.view !== 'parents' && !st.q) { staleTree = false; loadTree().then(render); return; }
    clearPan();
    var html = '';
    if (st.view === 'parents') html = viewParents();
    else if (!ready) html = '<div class="ar-empty"><p>' + esc(T('Cargando el árbol…', 'Loading the tree…')) + '</p></div>';
    else if (!user) html = viewNoUser();
    else if (!tree) html = viewEmpty();
    else if (!meId() && st.view !== 'person') html = viewUnlinked();
    else {
      switch (st.view) {
        case 'tree': html = viewTree(); break;
        case 'person': html = viewPerson(); break;
        case 'related': html = viewRelated(); break;
        case 'map': html = viewMap(); break;
        case 'quiz': html = viewQuiz(); break;
        default: html = viewHome();
      }
    }
    root.innerHTML = html;
    after();
  }

  function after() {
    if (st.view === 'tree' && tree && meId()) mountTree();
    if (st.view === 'parents') mountParents();
  }

  // ---------------------------------------------------------------
  // Home and the empty states
  // ---------------------------------------------------------------
  function viewNoUser() {
    return head() + '<div class="ar-empty">' + Art.hero(380) +
      '<p>' + esc(T('Entra con tu perfil desde el inicio para ver el árbol de tu familia.', 'Sign in from the home page to see your family tree.')) + '</p></div>' + parentBtn();
  }
  function viewEmpty() {
    return head() + '<div class="ar-empty">' + Art.hero(380) +
      '<h2>' + esc(T('Muy pronto: ¡el árbol de tu familia!', 'Coming soon: your family tree!')) + '</h2>' +
      '<p>' + esc(T('Pídele a un adulto que prepare el árbol. Después podrás conocer a tus abuelos y a toda la familia.', 'Ask a grown-up to set up the tree. Then you can meet your grandparents and the whole family.')) + '</p></div>' + parentBtn();
  }
  function viewUnlinked() {
    return head() + '<div class="ar-empty">' + Art.hero(380) +
      '<h2>' + esc(T('¿Dónde estás tú en el árbol?', 'Where are you in the tree?')) + '</h2>' +
      '<p>' + esc(T('Un adulto tiene que decir cuál eres tú en el árbol. ¡Pídeselo!', 'A grown-up needs to say which one is you in the tree. Ask them!')) + '</p></div>' + parentBtn();
  }

  function ancestorStats() {
    var d = Kin.up(idx, meId(), 14), n = 0, gens = 0, id, codes = {};
    for (id in d) { if (d[id] > 0) { n++; gens = Math.max(gens, d[id]); if (cc(id)) codes[cc(id)] = 1; } }
    return { n: n, gens: gens, countries: Object.keys(codes).length };
  }

  function viewHome() {
    var me = V(meId()), s = ancestorStats(), little = isLittle();
    var cards = [];
    cards.push(card('tree', '🌳', little ? T('Mi familia', 'My family') : T('Mi árbol', 'My tree'), little ? T('Conoce a tus abuelos', 'Meet your grandparents') : T('Papás, abuelos y más atrás', 'Parents, grandparents and further back'), '#3f8f5a'));
    if (!little) {
      cards.push(card('related', '🔗', T('¿Cómo somos parientes?', 'How are we related?'), T('Elige a dos personas', 'Pick any two people'), '#3d6fb3'));
      cards.push(card('map', '🗺️', T('¿De dónde venimos?', 'Where did we come from?'), T('Los lugares de la familia', 'The places of our family'), '#1f8a85'));
    }
    cards.push(card('quiz', '⭐', T('Juego de la familia', 'Family game'), little ? T('Toca a tu abuela', 'Tap your grandmother') : T('Preguntas sobre tu familia', 'Questions about your family'), '#c9892b'));
    return head() + '<section class="ar-hello">' + Art.hero(420) +
      '<h2>' + esc(T('Hola, ' + me.first + '. Este es el árbol de tu familia.', 'Hi, ' + me.first + '. This is your family tree.')) + '</h2>' +
      (s.n ? '<p class="ar-facts">' + esc(T('Ya encontramos ' + s.n + ' antepasados en ' + s.gens + ' generaciones' + (s.countries ? ' y ' + s.countries + (s.countries === 1 ? ' país' : ' países') : '') + '.',
                                             'We found ' + s.n + ' ancestors across ' + s.gens + ' generations' + (s.countries ? ' in ' + s.countries + (s.countries === 1 ? ' country' : ' countries') : '') + '.')) + '</p>' : '') +
      '</section><div class="ar-cards">' + cards.join('') + '</div>' + parentBtn();
  }
  function card(act, icon, title, sub, color) {
    return '<button class="ar-card-btn" data-act="open" data-to="' + act + '" style="--c:' + color + '"><span class="ar-card-ico">' + icon + '</span>' +
      '<span class="ar-card-tx"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span></button>';
  }

  // ---------------------------------------------------------------
  // The tree: pedigree cards you can drag and zoom
  // ---------------------------------------------------------------
  var CW = 124, CH = 118, GX = 12, GY = 46;

  function maxDepth() { return tier === 'beginner' ? 2 : tier === 'intermediate' ? 3 : tier === 'advanced' ? 4 : 5; }
  // A pedigree is as wide as its oldest row (2 to the power of the depth, cards side by side),
  // so on a phone it starts at grandparents and a parent can go deeper with the chips or by zooming.
  function startDepth() {
    if (st.depth) return st.depth;
    var narrow = (window.innerWidth || 800) < 600;
    return Math.min(maxDepth(), narrow ? 2 : 3);
  }

  function cardSvg(id, g, x, y, w, h) {
    var v = V(id), tone = Art.TONES[Math.min(g, Art.TONES.length - 1)], code = cc(id);
    var label = v.name + (v.years ? ', ' + v.years : '');
    var s = '<g class="ar-pcard" data-act="person" data-id="' + esc(id) + '" tabindex="0" role="button" aria-label="' + esc(label) + '" transform="translate(' + x + ' ' + y + ')">' +
      '<rect width="' + w + '" height="' + h + '" rx="14" fill="' + tone[0] + '" stroke="' + tone[2] + '" stroke-width="2.4"/>' +
      '<g transform="translate(' + (w / 2 - 26) + ' 8) scale(.52)" clip-path="url(#arClip)"><circle cx="50" cy="50" r="48" fill="#fff" opacity=".75"/>' + Art.person(kindOf(v), tone[1]) + '</g>' +
      '<text x="' + w / 2 + '" y="76" text-anchor="middle" class="ar-t1">' + esc(cut(v.first, 13)) + '</text>' +
      '<text x="' + w / 2 + '" y="92" text-anchor="middle" class="ar-t2">' + esc(cut(v.surname, 17)) + '</text>' +
      '<text x="' + w / 2 + '" y="108" text-anchor="middle" class="ar-t3">' + esc(v.years) + '</text>';
    if (code) s += '<g class="ar-cflag">' + flagInline(code, w - 31, 7, 24) + '</g>';
    return s + '</g>';
  }
  function ghostSvg(x, y, w, h) {
    return '<g transform="translate(' + x + ' ' + y + ')" aria-hidden="true"><rect width="' + w + '" height="' + h + '" rx="14" fill="none" stroke="#c9c2b0" stroke-width="2" stroke-dasharray="6 6"/>' +
      '<g transform="translate(' + (w / 2 - 26) + ' 8) scale(.52)" clip-path="url(#arClip)">' + Art.person('unknown', '#9a917c') + '</g>' +
      '<text x="' + w / 2 + '" y="84" text-anchor="middle" class="ar-t2">?</text></g>';
  }

  function buildPedigree(rootId, depth) {
    var rows = Kin.pedigree(idx, rootId, depth), G_ = depth, unit = CW + GX, total = Math.pow(2, G_) * unit;
    var out = '', conn = '', cards = '', g, i, id, x, y, block, n, cx, parents, cxp, yTop;
    var maxG = 0;
    for (g = 0; g <= G_; g++) {
      n = rows[g].length; block = total / n; y = (G_ - g) * (CH + GY);
      for (i = 0; i < n; i++) {
        id = rows[g][i];
        x = i * block + block / 2 - CW / 2;
        var childId = g > 0 ? rows[g - 1][i >> 1] : null;
        if (id) {
          cards += cardSvg(id, g, x.toFixed(1), y, CW, CH); maxG = g;
        } else if (g > 0 && childId) {
          // one parent is known and the other is not: show a dashed "?" for the missing one
          var sib = rows[g][i ^ 1];
          if (sib) cards += ghostSvg(x.toFixed(1), y, CW, CH);
          else continue;
        } else continue;
        if (g > 0 && childId) {
          var bx = (i >> 1) * (total / rows[g - 1].length) + (total / rows[g - 1].length) / 2;
          var cyTop = (G_ - (g - 1)) * (CH + GY);
          var px = x + CW / 2, py = y + CH, mid = cyTop - GY / 2;
          conn += '<path d="M' + bx.toFixed(1) + ' ' + cyTop + ' V' + mid.toFixed(1) + ' H' + px.toFixed(1) + ' V' + py + '" />';
        }
      }
    }
    return { svg: '<g class="ar-conn">' + conn + '</g>' + cards, w: total, h: (G_ + 1) * CH + G_ * GY, depth: G_, maxG: maxG };
  }

  function viewTree() {
    var me = meId(), rootId = st.root && tree.P[st.root] ? st.root : me;
    if (isLittle()) return viewLittleFamily(me);
    var depth = startDepth();
    var ped = buildPedigree(rootId, depth);
    st.ped = ped;
    return head() + backBar(T('Inicio', 'Home')) +
      '<h2 class="ar-h2">' + esc(T('El árbol de ' + V(rootId).first, V(rootId).first + '’s tree')) + '</h2>' +
      '<div class="ar-treebox"><svg id="ar-tree" class="ar-svg" role="group" aria-label="' + esc(T('Árbol familiar. Arrastra para moverte y usa + y − para acercar.', 'Family tree. Drag to move around and use + and − to zoom.')) + '">' +
      '<defs><clipPath id="arClip"><circle cx="50" cy="50" r="48"/></clipPath></defs><g id="ar-tree-g">' + ped.svg + '</g></svg>' +
      '<div class="ar-zoom" role="group" aria-label="' + esc(T('Zoom', 'Zoom')) + '">' +
      '<button data-act="zoom" data-f="1.35" aria-label="' + esc(T('Acercar', 'Zoom in')) + '">+</button>' +
      '<button data-act="zoom" data-f="0.74" aria-label="' + esc(T('Alejar', 'Zoom out')) + '">−</button>' +
      '<button data-act="fit" aria-label="' + esc(T('Ver todo', 'See everything')) + '">⤢</button></div></div>' +
      '<div class="ar-gens"><span>' + esc(T('Generaciones', 'Generations')) + '</span>' +
      [2, 3, 4, 5, 6, 7].filter(function(n) { return n <= 7; }).map(function(n) {
        return '<button class="ar-chip' + (n === depth ? ' on' : '') + '" data-act="depth" data-n="' + n + '">' + n + '</button>';
      }).join('') + '</div>' +
      '<p class="ar-hint">' + esc(T('Toca una tarjeta para conocer a esa persona.', 'Tap a card to meet that person.')) + '</p>' + parentBtn();
  }

  function viewLittleFamily(me) {
    var rows = Kin.pedigree(idx, me, 2), parents = rows[1], gps = rows[2];
    function big(id, ph) {
      if (!id) return ph ? '<div class="ar-big ghost" aria-hidden="true">' + Art.portrait('unknown', '#9a917c', 84) + '<b>?</b></div>' : '';
      var v = V(id), code = cc(id);
      return '<button class="ar-big" data-act="person" data-id="' + esc(id) + '" aria-label="' + esc(v.name) + '">' +
        Art.portrait(kindOf(v), '#3f8f5a', 96) + '<b>' + esc(v.first) + '</b>' +
        '<small>' + esc(id === me ? T('Yo', 'Me') : termFor(id, me)) + '</small>' + (code ? '<span class="ar-bigflag">' + flagHtml(code, 34) + '</span>' : '') + '</button>';
    }
    return head() + backBar(T('Inicio', 'Home')) + '<h2 class="ar-h2">' + esc(T('Mi familia', 'My family')) + '</h2>' +
      '<div class="ar-me">' + big(me, false) + '</div>' +
      '<h3 class="ar-h3">' + esc(T('Mis papás', 'My parents')) + '</h3><div class="ar-bigrow">' + parents.map(function(id) { return big(id, true); }).join('') + '</div>' +
      '<h3 class="ar-h3">' + esc(T('Mis abuelos', 'My grandparents')) + '</h3><div class="ar-bigrow four">' + gps.map(function(id) { return big(id, true); }).join('') + '</div>' + parentBtn();
  }

  // ---- pan and zoom ------------------------------------------------
  function clearPan() { if (pan && pan.off) pan.off(); pan = null; }

  function mountTree() {
    var svg = $('#ar-tree');
    if (!svg || !st.ped) return;
    var b = { x: -20, y: -20, w: st.ped.w + 40, h: st.ped.h + 40 };
    pan = attachPan(svg, b);
    pan.home();
  }

  function attachPan(svg, b) {
    var vb = { x: b.x, y: b.y, w: b.w, h: b.h }, ptrs = {}, last = null, pinch0 = null, wasPan = false;
    function size() { var r = svg.getBoundingClientRect(); return { w: r.width || 1, h: r.height || 1, l: r.left, t: r.top }; }
    function clamp() {
      var mx = vb.w * 0.4, my = vb.h * 0.4;
      vb.x = Math.max(b.x - mx, Math.min(b.x + b.w - vb.w + mx, vb.x));
      vb.y = Math.max(b.y - my, Math.min(b.y + b.h - vb.h + my, vb.y));
    }
    function apply() {
      var s = size(); vb.h = vb.w * s.h / s.w;
      clamp();
      svg.setAttribute('viewBox', vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1));
    }
    function zoomAt(f, px, py) {   // px, py in client px
      var s = size(), nw = Math.max(150, Math.min(b.w * 1.6 + 200, vb.w / f));
      var ux = vb.x + (px - s.l) / s.w * vb.w, uy = vb.y + (py - s.t) / s.w * vb.w;
      var k = nw / vb.w;
      vb.x = ux - (ux - vb.x) * k; vb.y = uy - (uy - vb.y) * k; vb.w = nw;
      apply();
    }
    function onDown(e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      panMoved = false;
      if (Object.keys(ptrs).length === 1) last = { x: e.clientX, y: e.clientY };
      if (Object.keys(ptrs).length === 2) { var p = pts(); pinch0 = dist(p[0], p[1]); }
    }
    function pts() { return Object.keys(ptrs).map(function(k) { return ptrs[k]; }); }
    function dist(a, c) { return Math.sqrt((a.x - c.x) * (a.x - c.x) + (a.y - c.y) * (a.y - c.y)); }
    function onMove(e) {
      if (!ptrs[e.pointerId]) return;
      var prev = ptrs[e.pointerId];
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(ptrs).length, s = size();
      if (n === 1) {
        var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        if (!panMoved && Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) < 7) return;
        panMoved = true;
        vb.x -= dx * vb.w / s.w; vb.y -= dy * vb.w / s.w;
        apply();
      } else if (n === 2) {
        var p = pts(), d = dist(p[0], p[1]);
        if (pinch0) { panMoved = true; zoomAt(d / pinch0, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2); }
        pinch0 = d;
      }
    }
    function onUp(e) { delete ptrs[e.pointerId]; pinch0 = null; if (Object.keys(ptrs).length === 1) last = pts()[0]; }
    function onWheel(e) { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX, e.clientY); }
    svg.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    svg.addEventListener('wheel', onWheel, { passive: false });
    function onResize() { apply(); }
    window.addEventListener('resize', onResize);
    return {
      vb: vb,
      zoom: function(f) { var s = size(); zoomAt(f, s.l + s.w / 2, s.t + s.h / 2); },
      fit: function() { vb.x = b.x; vb.y = b.y; vb.w = b.w; apply(); var s = size(); if (vb.h > b.h) vb.y = b.y - (vb.h - b.h) / 2; apply(); },
      home: function() {            // the person, the parents and the grandparents, big enough to read
        var s = size(), depth = st.ped ? st.ped.depth : 2, total = st.ped ? st.ped.w : b.w - 40, rows = Math.min(depth, 2);
        function ext(r) { return (r === 0 ? CW : total - total / Math.pow(2, r) + CW) + 60; }
        while (rows < depth && ext(rows + 1) <= s.w / 0.5) rows++;     // as many rows as stay readable (cards at half size or more)
        var w = Math.min(b.w, Math.max(ext(rows), 300), s.w / 0.5);
        vb.w = w; vb.x = b.x + b.w / 2 - w / 2; apply();
        vb.y = vb.h > b.h ? b.y - (vb.h - b.h) / 2 : b.y + b.h - vb.h + 6; apply();
      },
      off: function() {
        svg.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
        svg.removeEventListener('wheel', onWheel); window.removeEventListener('resize', onResize);
      }
    };
  }

  // ---------------------------------------------------------------
  // A person
  // ---------------------------------------------------------------
  var EVL = {
    BIRT: ['Nació', 'Born'], CHR: ['Bautizo', 'Baptised'], BAPM: ['Bautizo', 'Baptised'], DEAT: ['Falleció', 'Died'], BURI: ['Sepultura', 'Buried'],
    MARR: ['Se casó', 'Married'], OCCU: ['Trabajó como', 'Worked as'], RESI: ['Vivió en', 'Lived in'], EMIG: ['Salió de su tierra', 'Left home'],
    IMMI: ['Llegó a un nuevo país', 'Arrived in a new country'], NATU: ['Se hizo ciudadano', 'Became a citizen'], EDUC: ['Estudió', 'Studied'],
    GRAD: ['Se graduó', 'Graduated'], MILI: ['Servicio militar', 'Military service'], RETI: ['Se jubiló', 'Retired']
  };

  function lifeEvents(id) {
    var v = V(id), out = [];
    if (!v || v.hidden) return out;
    var seen = {};
    v.events.forEach(function(e) {
      var lab = EVL[e.type];
      if (!lab) return;
      var key = e.type + '|' + e.date + '|' + e.place;
      if (seen[key]) return; seen[key] = 1;
      var extra = e.label ? ' ' + cut(e.label, 50) : '';
      out.push({ y: e.year, date: e.date, es: lab[0], en: lab[1], extra: extra, place: e.place, type: e.type });
    });
    // marriages and children, from the families
    (tree.P[id].fs || []).forEach(function(fid) {
      var f = tree.F[fid]; if (!f) return;
      var spouse = f.h === id ? f.w : f.h;
      (f.e || []).forEach(function(e) {
        if (e[0] !== 'MARR') return;
        var y = G.yearOf(e[1]);
        out.push({ y: y, date: e[1], es: 'Se casó', en: 'Married', extra: spouse && V(spouse) ? ' ' + V(spouse).first : '', place: e[2] || '', type: 'MARR' });
      });
      (f.c || []).forEach(function(c) {
        var cv = V(c); if (!cv || tree.P[c].gone || cv.birthYear == null) return;
        out.push({ y: cv.birthYear, date: String(cv.birthYear), es: 'Nació su hij@', en: 'Child born', extra: ' ' + cv.first, place: '', type: 'CHILD', sex: tree.P[c].z });
      });
    });
    out.sort(function(a, b) { return (a.y == null ? 9999 : a.y) - (b.y == null ? 9999 : b.y); });
    return out;
  }

  function childWord(sex) { return sex === 'M' ? T('Nació su hijo', 'Child born') : sex === 'F' ? T('Nació su hija', 'Child born') : T('Nació su hijo/a', 'Child born'); }

  function viewPerson() {
    var id = st.pid, v = V(id);
    if (!v) return head() + backBar() + '<p class="ar-empty">?</p>';
    var me = meId();
    if (data && !data.seen[id]) { data.seen[id] = 1; saveData(); }
    var code = cc(id), relP = me && id !== me ? termPair(id, me) : null, kind = kindOf(v);
    var events = lifeEvents(id);
    var tl = events.map(function(e) {
      var what = e.type === 'CHILD' ? childWord(e.sex) : T(e.es, e.en);
      return '<li><span class="ar-tl-y">' + (e.y != null ? esc(String(e.y < 0 ? Math.abs(e.y) + ' a. C.' : e.y)) : '') + '</span><span class="ar-tl-dot" aria-hidden="true"></span>' +
        '<div class="ar-tl-b"><b>' + esc(what) + '</b>' + (e.extra ? '<span> ' + esc(e.extra.trim()) + '</span>' : '') + (e.place ? '<small>' + esc(e.place) + '</small>' : '') + '</div></li>';
    }).join('');
    var spk = v.name + (relP ? T(', es tu ' + relP.es, ', is your ' + relP.en) : '') + (v.born ? T('. Nació en ', '. Born ') + v.born : '') + (v.birthPlace ? ', ' + v.birthPlace : '') + '.';
    var notes = (v.notes || []).map(function(n) { return '<p>' + esc(n).replace(/\n/g, '<br>') + '</p>'; }).join('');
    var map = personMap(id);
    return head() + backBar() +
      '<section class="ar-person"><div class="ar-pp">' + Art.portrait(kind, Art.TONES[relP ? 1 : 0][1], isLittle() ? 130 : 104) + '</div>' +
      '<div class="ar-pinfo"><h2>' + esc(v.name) + ' ' + sayBtn(spk) + '</h2>' +
      (v.nick ? '<p class="ar-nick">“' + esc(v.nick) + '”</p>' : '') +
      (v.years ? '<p class="ar-yrs">' + esc(v.years) + (v.born && v.born !== String(v.birthYear) ? ' · ' + esc(v.born) : '') + '</p>' : '') +
      (relP ? '<p class="ar-rel">' + esc(T('Es tu ' + relP.es, 'Is your ' + relP.en)) + '</p>' : (id === me ? '<p class="ar-rel"><b>' + esc(T('¡Eres tú!', 'This is you!')) + '</b></p>' : '')) +
      (code || v.birthPlace ? '<p class="ar-born">' + flagHtml(code, 30) + '<span>' + esc(T('Nació en ', 'Born in ')) + esc(v.birthPlace || countryName(code)) + '</span></p>' : '') +
      '</div></section>' +
      '<div class="ar-actions"><button class="ar-btn" data-act="treefrom" data-id="' + esc(id) + '">🌳 ' + esc(T('Ver su árbol', 'See their tree')) + '</button>' +
      (!isLittle() && me && id !== me ? '<button class="ar-btn alt" data-act="relwith" data-id="' + esc(id) + '">🔗 ' + esc(T('¿Cómo somos parientes?', 'How are we related?')) + '</button>' : '') + '</div>' +
      (isLittle() ? '' : (tl ? '<h3 class="ar-h3">' + esc(T('Su vida', 'Their life')) + '</h3><ol class="ar-tl">' + tl + '</ol>' : '')) +
      (!isLittle() && map ? '<h3 class="ar-h3">' + esc(T('Sus lugares', 'Their places')) + '</h3>' + map : '') +
      (notes ? '<h3 class="ar-h3">' + esc(T('Historias', 'Stories')) + '</h3><div class="ar-notes">' + notes + '</div>' : '') +
      filesSection(id) + familyChips(id) + parentFiles(id) + parentBtn() + lightbox(id);
  }

  // ---------------------------------------------------------------
  // Photos and documents (js/arbol-files.js; stored on the family server)
  // ---------------------------------------------------------------
  // What the kids may see: files a parent marked for them, and none of a living
  // person's unless the parent opted in to showing living relatives in full.
  function kidFiles(id) {
    var hideLiving = livingSet[id] && !(tree.cfg && tree.cfg.living);
    return Files.list(tree, id).filter(function(f) { return f.kids && !hideLiving; });
  }
  function filesSection(id) {
    var list = parentOk ? Files.list(tree, id) : kidFiles(id);
    if (!list.length) return '';
    var tiles = list.map(function(f) {
      var title = f.t || (Files.isImage(f) ? T('Foto', 'Photo') : T('Documento', 'Document'));
      var lock = parentOk && !kidFiles(id).some(function(k) { return k.id === f.id; }) ? '<i class="ar-flock" title="' + esc(T('Solo papás', 'Parents only')) + '">🔒</i>' : '';
      if (Files.isImage(f)) {
        return '<button class="ar-ftile" data-act="fileview" data-fid="' + esc(f.id) + '"><img src="' + esc(Files.url(f.th || f.id)) + '" alt="' + esc(title) + '" loading="lazy" onerror="this.classList.add(\'ar-fbroken\')">' + lock + '<span>' + esc(title) + '</span></button>';
      }
      return '<a class="ar-ftile doc" href="' + esc(Files.url(f.id)) + '" target="_blank" rel="noopener"><b aria-hidden="true">📄</b>' + lock + '<span>' + esc(title) + '</span></a>';
    }).join('');
    return '<h3 class="ar-h3">' + esc(T('Fotos y documentos', 'Photos and documents')) + '</h3><div class="ar-files">' + tiles + '</div>';
  }
  function lightbox(id) {
    if (!st.fview) return '';
    var f = Files.list(tree, id).filter(function(x) { return x.id === st.fview; })[0];
    if (!f || !(parentOk || kidFiles(id).indexOf(f) >= 0)) return '';
    return '<div class="ar-lightbox" role="dialog" aria-modal="true" aria-label="' + esc(f.t || T('Foto', 'Photo')) + '">' +
      '<button class="ar-lbx" data-act="fileclose" aria-label="' + esc(T('Cerrar', 'Close')) + '">✕</button>' +
      '<img src="' + esc(Files.url(f.id)) + '" alt="' + esc(f.t || '') + '">' + (f.t ? '<p>' + esc(f.t) + '</p>' : '') + '</div>';
  }
  function parentFiles(id) {
    if (!parentOk) return '<div class="ar-fadd"><button class="ar-btn alt" data-act="fileunlock">🔒 ' + esc(T('Agregar fotos o documentos', 'Add photos or documents')) + '</button></div>';
    var U = st.fup || {}, list = Files.list(tree, id);
    var rows = list.map(function(f) {
      return '<li><span class="ar-fname">' + (Files.isImage(f) ? '🖼️ ' : '📄 ') + esc(f.t || T('(sin título)', '(no title)')) + ' <small>' + Math.max(1, Math.round((f.size || 0) / 1024)) + ' KB</small></span>' +
        '<label class="ar-chk sm"><input type="checkbox" class="ar-fkids" data-fid="' + esc(f.id) + '"' + (f.kids ? ' checked' : '') + '> <span>' + esc(T('Los niños lo ven', 'Kids can see it')) + '</span></label>' +
        '<button class="ar-link" data-act="filedel" data-fid="' + esc(f.id) + '">' + esc(T('Borrar', 'Delete')) + '</button></li>';
    }).join('');
    return '<section class="ar-psec ar-fpanel"><h3>🔒 ' + esc(T('Fotos y documentos (papás)', 'Photos and documents (parents)')) + '</h3>' +
      (rows ? '<ul class="ar-flist">' + rows + '</ul>' : '') +
      '<label class="ar-lbl" for="ar-ftitle">' + esc(T('Título (por ejemplo: Acta de matrimonio, Bautizo 1932)', 'Title (for example: Marriage record, Baptism 1932)')) + '</label>' +
      '<input id="ar-ftitle" type="text" maxlength="80" autocomplete="off">' +
      '<label class="ar-chk"><input type="checkbox" id="ar-fkidsnew" checked> <span>' + esc(T('Los niños pueden verlo', 'Kids can see it')) + '</span></label>' +
      (livingSet[id] && !(tree.cfg && tree.cfg.living) ? '<p class="ar-note">' + esc(T('Esta persona parece estar viva: los niños no ven sus archivos mientras los datos de personas vivas estén protegidos.', 'This person looks to be living: the kids do not see their files while living relatives are protected.')) + '</p>' : '') +
      '<label class="ar-file"><span class="ar-btn"' + (U.busy ? ' aria-disabled="true"' : '') + '>📎 ' + esc(T('Elegir fotos o PDF', 'Choose photos or PDFs')) + '</span>' +
      '<input id="ar-fup" type="file" multiple accept="image/*,.heic,.heif,application/pdf,.pdf"' + (U.busy ? ' disabled' : '') + ' aria-label="' + esc(T('Elegir fotos o PDF', 'Choose photos or PDFs')) + '"></label>' +
      (U.msg ? '<p class="' + (U.err ? 'ar-warn' : 'ar-ok') + '" role="status">' + esc(U.msg) + '</p>' : '') +
      '<p class="ar-note">' + esc(T('Fotos (JPEG, PNG, HEIC) y documentos PDF, hasta 25 MB cada uno. Se guardan en el servidor de la familia.', 'Photos (JPEG, PNG, HEIC) and PDF documents, up to 25 MB each. They are kept on the family server.')) + '</p>' +
      '<button class="ar-link" data-act="parentdone">🔓 ' + esc(T('Listo: salir del modo papás', 'Done: leave parent mode')) + '</button>' +
      '</section>';
  }
  function uploadFiles(id, fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    if (!ArbolSync.online()) { st.fup = { err: 1, msg: T('Para subir archivos hay que estar conectado al servidor de la familia.', 'To upload files this device must be connected to the family server.') }; render(); return; }
    var titleEl = $('#ar-ftitle'), kidsEl = $('#ar-fkidsnew');
    var title = titleEl ? titleEl.value : '', kids = kidsEl ? kidsEl.checked : true;
    var done = 0, failed = [];
    st.fup = { busy: 1, msg: T('Subiendo 1 de ' + files.length + '…', 'Uploading 1 of ' + files.length + '…') }; render();
    var chain = Promise.resolve();
    files.forEach(function(file, i) {
      chain = chain.then(function() {
        st.fup = { busy: 1, msg: T('Subiendo ' + (i + 1) + ' de ' + files.length + '…', 'Uploading ' + (i + 1) + ' of ' + files.length + '…') }; render();
        var t = title ? (files.length > 1 ? title + ' (' + (i + 1) + ')' : title) : String(file.name || '').replace(/\.[a-z0-9]{2,5}$/i, '');
        return Files.upload(file, t, kids).then(function(entry) {
          var p = tree.P[id];
          if (!p) return;
          if (!p.a || typeof p.a !== 'object') p.a = {};
          if (!Array.isArray(p.a.files)) p.a.files = [];
          p.a.files.push(entry);
          done++;
        }, function(e) {
          var why = e && e.message === 'type' ? T('no es una foto ni un PDF', 'not a photo or a PDF') : e && e.message === 'size' ? T('más de 25 MB', 'over 25 MB') : T('no se pudo subir', 'could not be uploaded');
          failed.push(String(file.name || '?').slice(0, 40) + ': ' + why);
        });
      });
    });
    chain.then(function() { return done ? saveTree() : true; }).then(function() {
      st.fup = failed.length ? { err: 1, msg: (done ? T(done + ' guardados. ', done + ' saved. ') : '') + failed.join(' · ') } : { msg: T(done + ' guardado' + (done > 1 ? 's' : '') + '.', done + ' saved.') };
      if (done) log('Family files added');
      render();
    });
  }
  function deleteFile(id, fid) {
    var p = tree.P[id], list = p && p.a && Array.isArray(p.a.files) ? p.a.files : [], f = list.filter(function(x) { return x.id === fid; })[0];
    if (!f || typeof ZsDialog === 'undefined') return;
    ZsDialog.confirm({ title: T('¿Borrar este archivo?', 'Delete this file?'), message: (f.t ? f.t + ' · ' : '') + T('Se borra del servidor de la familia.', 'It is deleted from the family server.'), confirmLabel: T('Borrar', 'Delete') }).then(function(yes) {
      if (!yes) return;
      Files.remove(f).then(function() {
        p.a.files = p.a.files.filter(function(x) { return x.id !== fid; });
        if (st.fview === fid) st.fview = null;
        saveTree().then(render);
      });
    });
  }

  function chip(id, label) {
    var v = V(id); if (!v) return '';
    return '<button class="ar-pchip" data-act="person" data-id="' + esc(id) + '">' + Art.portrait(kindOf(v), '#3f8f5a', 34) + '<span>' + esc(v.first) + (label ? '<small>' + esc(label) + '</small>' : '') + '</span></button>';
  }
  function familyChips(id) {
    var out = '', ps = Kin.parentsOf(idx, id).filter(Boolean), sp = (idx.sp[id] || []).concat(idx.ex[id] || []), sib = Kin.siblings(idx, id), kids = idx.kids[id] || [];
    function sec(title, ids, lab) {
      ids = ids.filter(function(x) { return V(x) && !tree.P[x].gone; });
      if (!ids.length) return '';
      return '<h4 class="ar-h4">' + esc(title) + '</h4><div class="ar-chips">' + ids.slice(0, 24).map(function(x) { return chip(x, lab ? lab(x) : ''); }).join('') + '</div>';
    }
    out += sec(T('Papás', 'Parents'), ps);
    out += sec(T('Esposo/a', 'Spouse'), idx.sp[id] || []);
    out += sec(T('Hermanos', 'Brothers and sisters'), sib);
    out += sec(T('Hijos', 'Children'), kids);
    return out ? '<div class="ar-fam"><h3 class="ar-h3">' + esc(T('Su familia', 'Their family')) + '</h3>' + out + '</div>' : '';
  }

  // ---------------------------------------------------------------
  // Maps
  // ---------------------------------------------------------------
  function mapSvg(points, arcs, opts) {
    opts = opts || {};
    if (typeof WorldMap === 'undefined') return '';
    var W_ = WorldMap.W || 2000, H_ = WorldMap.H || 973, i, p, info, bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    var land = WorldMap.landPath(), out = '';
    points.forEach(function(pt) {
      info = WorldMap.info(pt.code);
      if (!info) return;
      var b = info.b;
      bx0 = Math.min(bx0, info.c[0] - 60); by0 = Math.min(by0, info.c[1] - 60); bx1 = Math.max(bx1, info.c[0] + 60); by1 = Math.max(by1, info.c[1] + 60);
    });
    var box = { x: 0, y: 0, w: W_, h: H_ };
    if (!opts.world && bx0 < 1e9) {
      var pad = 160, w = Math.max(520, bx1 - bx0 + 2 * pad), h = w / 2.05;
      if (by1 - by0 + 2 * pad > h) { h = by1 - by0 + 2 * pad; w = h * 2.05; }
      var cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
      box = { x: Math.max(0, Math.min(W_ - w, cx - w / 2)), y: Math.max(0, Math.min(H_ - h, cy - h / 2)), w: Math.min(w, W_), h: Math.min(h, H_) };
      if (w >= W_) box = { x: 0, y: 0, w: W_, h: H_ };
    }
    var scale = box.w / 900;                // sizes in screen-ish units
    out += '<svg class="ar-map" viewBox="' + [box.x, box.y, box.w, box.h].map(function(n) { return n.toFixed(0); }).join(' ') + '" role="img" aria-label="' + esc(opts.label || T('Mapa del mundo', 'World map')) + '">';
    out += '<rect x="0" y="0" width="' + W_ + '" height="' + H_ + '" fill="#dcecf5"/>';
    out += '<path d="' + land + '" fill="#efe8d6" stroke="#d6cdb4" stroke-width="' + (0.8 * scale).toFixed(2) + '"/>';
    points.forEach(function(pt) {
      if (WorldMap.path(pt.code)) out += '<path d="' + WorldMap.path(pt.code) + '" fill="' + (pt.fill || '#9fd3a8') + '" stroke="#5fa772" stroke-width="' + (1 * scale).toFixed(2) + '"/>';
    });
    (arcs || []).forEach(function(a) {
      var ia = WorldMap.info(a.from), ib = WorldMap.info(a.to);
      if (!ia || !ib) return;
      var la = WorldMap.invert(ia.c[0], ia.c[1]), lb = WorldMap.invert(ib.c[0], ib.c[1]);
      if (!la || !lb) return;
      var gc = WorldMap.greatCircle(la, lb, 40);
      var d = 'M' + gc.map(function(q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('L');
      out += '<path d="' + d + '" fill="none" stroke="#c9892b" stroke-width="' + ((2 + Math.min(a.n, 6)) * scale).toFixed(2) + '" stroke-dasharray="' + (8 * scale).toFixed(1) + ' ' + (6 * scale).toFixed(1) + '" stroke-linecap="round" opacity=".85"/>';
      out += '<circle cx="' + gc[gc.length - 1][0].toFixed(1) + '" cy="' + gc[gc.length - 1][1].toFixed(1) + '" r="' + (6 * scale).toFixed(1) + '" fill="#c9892b"/>';
    });
    points.forEach(function(pt) {
      info = WorldMap.info(pt.code);
      if (!info) return;
      var r = (11 + Math.min(pt.n || 1, 12) * 1.6) * scale;
      out += '<g class="ar-dot' + (pt.sel ? ' sel' : '') + '"' + (pt.act ? ' data-act="mapsel" data-code="' + esc(pt.code) + '" tabindex="0" role="button" aria-label="' + esc(pt.aria || pt.code) + '"' : '') + '>' +
        '<circle cx="' + info.c[0] + '" cy="' + info.c[1] + '" r="' + r.toFixed(1) + '" fill="#d1473b" stroke="#fff" stroke-width="' + (3 * scale).toFixed(1) + '"/>' +
        (pt.n > 1 ? '<text x="' + info.c[0] + '" y="' + (info.c[1] + 5 * scale).toFixed(1) + '" text-anchor="middle" font-size="' + (15 * scale).toFixed(1) + '" font-weight="800" fill="#fff">' + pt.n + '</text>' : '') + '</g>';
    });
    return out + '</svg>';
  }

  function personMap(id) {
    var v = V(id), seen = {}, pts = [];
    function add(place) { var c = place && Places.country(place); if (c && !seen[c]) { seen[c] = 1; pts.push({ code: c, n: 1 }); } }
    if (v.hidden) { if (cc(id)) pts.push({ code: cc(id), n: 1 }); }
    else { add(v.birthPlace); v.events.forEach(function(e) { add(e.place); }); }
    if (!pts.length) return '';
    return '<div class="ar-mapbox">' + mapSvg(pts, [], {}) + '</div><p class="ar-places">' + pts.map(function(p) { return flagHtml(p.code, 22) + '<span>' + esc(countryNameKid(p.code)) + '</span>'; }).join('') + '</p>';
  }

  function viewMap() {
    var me = meId(), d = Kin.up(idx, me, 14), byCode = {}, gens = 0, id, arcs = {};
    if (data && !data.map) { data.map = 1; saveData(); }
    for (id in d) gens = Math.max(gens, d[id]);
    var gsel = st.map.gen; // 0 = everyone
    for (id in d) {
      if (gsel && d[id] !== gsel) continue;
      var c = cc(id); if (!c) continue;
      (byCode[c] = byCode[c] || []).push(id);
    }
    // arrows: where a parent was born -> where the child was born, when they differ
    for (id in d) {
      var cc1 = cc(id); if (!cc1) continue;
      Kin.parentsOf(idx, id).forEach(function(pp) {
        if (!pp) return;
        var pc = cc(pp); if (!pc || pc === cc1) return;
        if (gsel && d[pp] !== gsel && d[id] !== gsel) return;
        var k = pc + '>' + cc1; arcs[k] = arcs[k] || { from: pc, to: cc1, n: 0 }; arcs[k].n++;
      });
    }
    var codes = Object.keys(byCode).sort(function(a, b) { return byCode[b].length - byCode[a].length; });
    var sel = st.map.sel && byCode[st.map.sel] ? st.map.sel : null;
    var pts = codes.map(function(c) { return { code: c, n: byCode[c].length, act: true, sel: c === sel, aria: countryNameKid(c) + ', ' + byCode[c].length }; });
    var genLabels = [T('Todos', 'Everyone'), T('Papás', 'Parents'), T('Abuelos', 'Grandparents'), T('Bisabuelos', 'Great-grandparents'), T('Tatarabuelos', 'Great-great-grandparents')];
    var chips = '';
    for (var g = 0; g <= Math.min(gens, 5); g++) {
      chips += '<button class="ar-chip' + (g === gsel ? ' on' : '') + '" data-act="mapgen" data-n="' + g + '">' + esc(genLabels[g] || (T('Generación ', 'Generation ') + g)) + '</button>';
    }
    var list = codes.map(function(c) {
      var open = c === sel;
      return '<li><button class="ar-crow' + (open ? ' on' : '') + '" data-act="mapsel" data-code="' + esc(c) + '">' + flagHtml(c, 30) + '<span class="ar-cname">' + esc(countryNameKid(c)) + '</span><span class="ar-cn">' + byCode[c].length + '</span></button>' +
        (open ? '<div class="ar-chips">' + byCode[c].slice(0, 30).map(function(pid) { return chip(pid, ''); }).join('') + '</div>' : '') + '</li>';
    }).join('');
    return head() + backBar(T('Inicio', 'Home')) + '<h2 class="ar-h2">' + esc(T('¿De dónde venimos?', 'Where did our family come from?')) + '</h2>' +
      '<div class="ar-gens">' + chips + '</div>' +
      (codes.length ? '<div class="ar-mapbox">' + mapSvg(pts, Object.keys(arcs).map(function(k) { return arcs[k]; }), { label: T('Dónde nació la familia', 'Where the family was born') }) + '</div>' +
        '<p class="ar-hint">' + esc(T('Cada punto rojo es un país donde nació alguien de tu familia. Las líneas punteadas muestran el viaje de un papá a su hijo.', 'Each red dot is a country where someone in your family was born. Dotted lines show the move from a parent to a child.')) + '</p>' +
        '<ul class="ar-clist">' + list + '</ul>'
        : '<p class="ar-empty">' + esc(T('Todavía no sabemos dónde nacieron.', 'We do not know where they were born yet.')) + '</p>') + parentBtn();
  }

  // ---------------------------------------------------------------
  // How are we related?
  // ---------------------------------------------------------------
  function viewRelated() {
    var me = meId(), R = st.rel;
    if (!R.a || !tree.P[R.a]) R.a = me;
    var a = R.a, b = R.b && tree.P[R.b] ? R.b : null;
    function pickCard(who, id) {
      var v = id ? V(id) : null;
      return '<button class="ar-pick' + (R.pick === who ? ' on' : '') + '" data-act="pick" data-who="' + who + '" aria-label="' + esc(T('Elegir persona', 'Choose a person')) + '">' +
        (v ? Art.portrait(kindOf(v), '#3f8f5a', 56) + '<b>' + esc(v.id === me ? T('Tú', 'You') : v.first) + '</b>' : Art.portrait('unknown', '#9a917c', 56) + '<b>' + esc(T('Elige…', 'Pick…')) + '</b>') + '</button>';
    }
    var body = '';
    if (R.pick) {
      var list = R.text ? Store.search(tree, R.text, { cfg: tree.cfg, living: livingSet, lang: dl(), limit: 12 }).map(function(v) { return v.id; })
                        : (R.pick === 'a' ? [me] : []).concat(Kin.nearby(idx, a === me ? me : a, 40));
      list = list.filter(function(x, i) { return x && V(x) && !tree.P[x].gone && list.indexOf(x) === i; }).slice(0, 24);
      body = '<div class="ar-picker"><label for="ar-q" class="ar-lbl">' + esc(T('Busca un nombre', 'Search for a name')) + '</label>' +
        '<input id="ar-q" type="search" autocomplete="off" value="' + esc(R.text) + '" placeholder="' + esc(T('Escribe un nombre…', 'Type a name…')) + '">' +
        '<div class="ar-chips">' + list.map(function(x) { return chip(x, '').replace('data-act="person"', 'data-act="choose"'); }).join('') + '</div></div>';
    } else if (b) {
      body = relResult(a, b);
    } else {
      body = '<p class="ar-hint">' + esc(T('Elige a otra persona para ver qué parentesco tienen.', 'Pick another person to see how they are related.')) + '</p>';
    }
    return head() + backBar(T('Inicio', 'Home')) + '<h2 class="ar-h2">' + esc(T('¿Cómo somos parientes?', 'How are we related?')) + '</h2>' +
      '<div class="ar-picks">' + pickCard('a', a) + '<span class="ar-and">+</span>' + pickCard('b', b) + '</div>' + body + parentBtn();
  }

  function relResult(a, b) {
    var me = meId(), va = V(a), vb = V(b);
    if (a === b) return '<div class="ar-result"><p class="ar-big-sentence">' + esc(T('¡Es la misma persona!', 'That is the same person!')) + '</p></div>';
    var rel = Kin.relate(idx, b, a), rel2 = Kin.relate(idx, a, b);
    if (rel.kind === 'none') {
      return '<div class="ar-result"><p class="ar-big-sentence">' + esc(T('No encontramos un parentesco en este árbol.', 'We could not find how these two are related in this tree.')) + '</p></div>';
    }
    var sb = tree.P[b].z || '', sa = tree.P[a].z || '';
    var b1 = { es: Kin.term(rel, 'es', sb), en: Kin.term(rel, 'en', sb) }, a1 = { es: Kin.term(rel2, 'es', sa), en: Kin.term(rel2, 'en', sa) };
    var s1 = a === me ? T(vb.first + ' es tu ' + b1.es + '.', vb.first + ' is your ' + b1.en + '.')
                      : T(vb.first + ' es ' + artEs(b1.es, sb) + ' de ' + va.first + '.', vb.first + ' is ' + va.first + '’s ' + b1.en + '.');
    var s2 = a === me ? T('Tú eres ' + artEs(a1.es, sa) + ' de ' + vb.first + '.', 'You are ' + vb.first + '’s ' + a1.en + '.')
                      : T(va.first + ' es ' + artEs(a1.es, sa) + ' de ' + vb.first + '.', va.first + ' is ' + vb.first + '’s ' + a1.en + '.');
    var pth = Kin.path(idx, a, b, rel2), diagram = '', shared = '';
    if (pth) {
      var seq = pth.left.concat(pth.right.slice(0, -1).reverse()), upTo = pth.left.length - 1;
      diagram = '<div class="ar-path" role="group" aria-label="' + esc(T('El camino entre los dos', 'The path between the two')) + '">' + seq.map(function(id, i) {
        var v = V(id);
        return (i ? '<span class="ar-arrow" aria-hidden="true">' + (i <= upTo ? '↑' : '↓') + '</span>' : '') +
          '<span class="ar-step' + (i === upTo ? ' top' : '') + '">' + Art.portrait(kindOf(v), '#3f8f5a', 40) + '<b>' + esc(id === me ? T('Tú', 'You') : v.first) + '</b></span>';
      }).join('') + '</div>';
      if (rel2.key !== 'anc' && rel2.key !== 'desc') {
        var names = rel2.common.map(function(c) { return V(c) ? V(c).first : ''; }).filter(Boolean);
        if (names.length) shared = '<p class="ar-hint">' + esc(T('Comparten a ' + names.join(' y '), 'They share ' + names.join(' and '))) + '.</p>';
      }
    }
    return '<div class="ar-result"><p class="ar-big-sentence">' + esc(s1) + ' ' + sayBtn(s1) + '</p><p class="ar-sentence2">' + esc(s2) + '</p>' + diagram + shared + '</div>';
  }
  function artEs(term, sex) {      // "la abuela", "el tío"
    if (!term) return '';
    return (sex === 'F' ? 'la ' : sex === 'M' ? 'el ' : 'el/la ') + term;
  }

  // ---------------------------------------------------------------
  // Quiz
  // ---------------------------------------------------------------
  var QNAMES = { grand: ['Mis abuelos', 'My grandparents'], who: ['¿Quién fue?', 'Who was it?'], where: ['¿Dónde nació?', 'Where born?'], term: ['¿Qué es para ti?', 'What are they to you?'], older: ['¿Quién nació antes?', 'Who was first?'] };

  function quizCtx() {
    var codes = {};
    var d = Kin.up(idx, meId(), 10), id;
    for (id in d) if (cc(id)) codes[cc(id)] = 1;
    return { store: tree, idx: idx, me: meId(), tier: tier, view: V, country: cc, countryName: function(c, l) { return Places.name(c, l); }, alsoCountries: Object.keys(codes) };
  }

  function viewQuiz() {
    var Q = st.q;
    if (!Q) {
      var kinds = Quiz.kindsFor(tier);
      return head() + backBar(T('Inicio', 'Home')) + '<h2 class="ar-h2">' + esc(T('Juego de la familia', 'Family game')) + '</h2>' +
        '<div class="ar-cards">' + kinds.map(function(k) {
          var best = data.q[k] | 0;
          return '<button class="ar-card-btn" data-act="qstart" data-kind="' + k + '" style="--c:#c9892b"><span class="ar-card-ico">⭐</span><span class="ar-card-tx"><b>' + esc(T(QNAMES[k][0], QNAMES[k][1])) + '</b>' +
            '<small>' + esc(T('Mejor: ', 'Best: ') + best + '/5') + '</small></span></button>';
        }).join('') + '</div>' + parentBtn();
    }
    if (Q.done) {
      var score = Q.score, stars = Math.max(0, Math.min(3, score - 2));
      return head() + '<div class="ar-qdone"><h2>' + esc(score >= 4 ? T('¡Muy bien!', 'Well done!') : T('¡Buen intento!', 'Good try!')) + '</h2>' +
        '<p class="ar-qscore">' + score + '/' + Q.list.length + '</p><p class="ar-qstars" aria-label="' + stars + ' ' + esc(T('estrellas', 'stars')) + '">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</p>' +
        '<div class="ar-actions"><button class="ar-btn" data-act="qstart" data-kind="' + Q.kind + '">' + esc(T('Otra vez', 'Again')) + '</button><button class="ar-btn alt" data-act="qexit">' + esc(T('Salir', 'Done')) + '</button></div></div>';
    }
    var q = Q.list[Q.i], prompt = T(q.prompt.es, q.prompt.en);
    var opts = q.opts.map(function(o, i) {
      var cls = 'ar-opt' + (Q.picked != null ? (o.correct ? ' right' : i === Q.picked ? ' wrong' : '') : '');
      var inner;
      if (o.id) { var v = V(o.id); inner = Art.portrait(kindOf(v), '#3f8f5a', isLittle() ? 84 : 56) + '<b>' + esc(o.label.es && (isLittle() ? v.first : v.name)) + '</b>' + (!isLittle() && o.sub ? '<small>' + esc(o.sub) + '</small>' : ''); }
      else if (o.code) inner = flagHtml(o.code, 44) + '<b>' + esc(T(o.label.es, o.label.en)) + '</b>';
      else inner = '<b>' + esc(T(o.label.es, o.label.en)) + '</b>';
      return '<button class="' + cls + (o.id ? ' person' : '') + '" data-act="qpick" data-i="' + i + '"' + (Q.picked != null ? ' disabled' : '') + '>' + inner + '</button>';
    }).join('');
    return head() + '<div class="ar-qbar"><button class="ar-back" data-act="qexit" aria-label="' + esc(T('Salir', 'Quit')) + '">✕</button><span>' + (Q.i + 1) + ' / ' + Q.list.length + '</span></div>' +
      '<div class="ar-q"><h2 class="ar-qtext">' + esc(prompt) + ' ' + sayBtn(prompt) + '</h2>' +
      (q.portrait ? '<div class="ar-qpp">' + Art.portrait(kindOf(V(q.portrait)), '#3f8f5a', 76) + '</div>' : '') +
      '<div class="ar-opts' + (isLittle() ? ' big' : '') + '">' + opts + '</div>' +
      (Q.picked != null ? '<p class="ar-fb ' + (q.opts[Q.picked].correct ? 'ok' : 'no') + '">' + esc(q.opts[Q.picked].correct ? T('¡Correcto!', 'Correct!') : T('Casi. La respuesta era: ', 'Almost. The answer was: ') + answerText(q)) + '</p>' +
        '<div class="ar-actions"><button class="ar-btn" data-act="qnext">' + esc(Q.i + 1 < Q.list.length ? T('Siguiente', 'Next') : T('Ver resultado', 'See result')) + '</button></div>' : '') + '</div>';
  }
  function answerText(q) {
    var o = q.opts[q.answer];
    if (o.id) return V(o.id).name;
    return T(o.label.es, o.label.en);
  }

  function startQuiz(kind) {
    var list = Quiz.round(kind, quizCtx(), 5, qseed());
    if (list.length < 2) { toast(T('Todavía faltan datos en el árbol para este juego.', 'The tree needs a few more details for this game.')); st.q = null; return; }
    st.q = { kind: kind, list: list, i: 0, score: 0, picked: null, done: false };
    render();
    var q = list[0]; say(T(q.prompt.es, q.prompt.en));
  }
  var _seedN = 0;
  function qseed() {
    var m = /[?&]seed=(\d+)/.exec(location.search);
    return m ? (+m[1] + (_seedN++)) : (Date.now() & 0xffffff) + (_seedN++);
  }
  function pickAnswer(i) {
    var Q = st.q; if (!Q || Q.picked != null) return;
    var q = Q.list[Q.i];
    Q.picked = i;
    if (q.opts[i].correct) { Q.score++; sfx('correct'); } else sfx('wrong');
    render();
  }
  function nextQ() {
    var Q = st.q; if (!Q) return;
    if (Q.i + 1 < Q.list.length) { Q.i++; Q.picked = null; render(); var q = Q.list[Q.i]; say(T(q.prompt.es, q.prompt.en)); return; }
    Q.done = true;
    if (Q.score > (data.q[Q.kind] | 0)) data.q[Q.kind] = Q.score;
    saveData();
    log('Family game: ' + Q.score + '/' + Q.list.length);
    sfx(Q.score >= 4 ? 'levelUp' : 'correct');
    render();
  }

  // ---------------------------------------------------------------
  // Parents: import, link the kids, privacy, help
  // ---------------------------------------------------------------
  var parentOk = false;
  function askParent(then) {
    if (parentOk) { then(); return; }
    var pin = typeof getParentPin === 'function' ? getParentPin() : null;
    if (!pin || typeof ZsDialog === 'undefined') { parentOk = true; then(); return; }
    ZsDialog.prompt({ title: '🔑 ' + T('Para papás', 'For parents'), message: T('PIN de los papás', 'Parent PIN'), inputType: 'password', inputMode: 'numeric', confirmLabel: T('Entrar', 'Unlock') }).then(function(v) {
      if (v == null) return;
      if (String(v) === String(pin)) { parentOk = true; then(); } else toast(T('PIN incorrecto.', 'Wrong PIN.'));
    });
  }

  var FS_EXPORT = 'https://www.familysearch.org/innovate/export';
  var FS_GALLERY = 'https://www.familysearch.org/en/innovate/solutions-gallery/';
  var FS_WIKI = 'https://www.familysearch.org/en/wiki/GEDCOM';

  function helpHtml() {
    return '<details class="ar-help"><summary>' + esc(T('¿Cómo saco el archivo GEDCOM de mi árbol?', 'How do I get a GEDCOM file out of my tree?')) + '</summary><div class="ar-helpb">' +
      '<h4>FamilySearch Family Tree</h4><ol>' +
      '<li>' + esc(T('FamilySearch ya no exporta un archivo GEDCOM directamente desde su sitio web. Su página de exportación dice que la exportación GEDCOM «ya no es compatible» ahí, y su wiki dice que un GEDCOM «no se puede exportar directamente» de Family Tree.', 'FamilySearch no longer exports a GEDCOM file straight from its website. Its export page says GEDCOM export is “no longer supported” there, and its wiki says a GEDCOM “cannot be exported directly” from Family Tree.')) + ' <span class="ar-url">' + esc(FS_EXPORT) + '</span> <span class="ar-url">' + esc(FS_WIKI) + '</span></li>' +
      '<li>' + esc(T('Usa un programa de árbol genealógico compatible con FamilySearch (por ejemplo RootsMagic, Family Tree Maker o Legacy; la lista está en la Galería de soluciones). Conéctalo a tu cuenta, baja tu árbol al programa y luego guarda un archivo GEDCOM con su opción de exportar.', 'Use a family-tree program that works with FamilySearch (for example RootsMagic, Family Tree Maker or Legacy; the list is in the Solutions Gallery). Connect it to your account, bring your tree down into the program, then save a GEDCOM file with its export option.')) + ' <span class="ar-url">' + esc(FS_GALLERY) + '</span></li>' +
      '<li>' + esc(T('Se aceptan archivos GEDCOM 5.5.1 y 7.0. Las fotos no vienen en el archivo. FamilySearch puede cambiar estos pasos.', 'GEDCOM 5.5.1 and 7.0 files both work. Photos are not included in the file. FamilySearch can change these steps.')) + '</li></ol>' +
      '<h4>Ancestry, MyHeritage ' + esc(T('y otros', 'and others')) + '</h4><p>' + esc(T('Exporta un archivo GEDCOM desde la configuración del árbol.', 'Export a GEDCOM file from the tree’s settings.')) + '</p>' +
      '<p class="ar-note">' + esc(T('El archivo se lee en este aparato. Solo el árbol se guarda en el servidor de la familia. Las fotos y documentos de cada persona (actas, bautizos, retratos) se agregan desde su página, con el botón 🔒.', 'The file is read on this device. Only the tree is saved to the family server. Photos and documents for each person (records, baptisms, portraits) are added from their page, with the 🔒 button.')) + '</p>' +
      '</div></details>';
  }

  function viewParents() {
    var html = head(T('Árbol familiar · Para papás', 'Family Tree · For parents')) + backBar(T('Volver', 'Back'));
    if (!parentOk) return html + '<div class="ar-empty"><p>' + esc(T('Escribe el PIN de los papás.', 'Enter the parent PIN.')) + '</p><button class="ar-btn" data-act="parent">🔒 ' + esc(T('Entrar', 'Unlock')) + '</button></div>';
    var P = st.par || (st.par = {});
    var info = tree ? tree.imp : null, n = tree ? Object.keys(tree.P).filter(function(i) { return !tree.P[i].gone; }).length : 0;
    html += '<section class="ar-psec"><h3>' + esc(T('1. El árbol', '1. The tree')) + '</h3>';
    if (tree) {
      var kb = Math.round(JSON.stringify(tree).length / 1024), sz = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';
      html += '<p>' + esc(T(n + ' personas guardadas', n + ' people saved')) + (info ? ' · ' + esc(info.file || 'GEDCOM') + ' · ' + esc(new Date(info.ts).toLocaleDateString(dl() === 'es' ? 'es-CL' : 'en-US')) : '') + ' · ' + sz + '</p>';
      if (info && info.trim) html += '<p class="ar-warn">' + esc(T('El árbol era muy grande: se guardó una versión reducida (' + ['', 'historias más cortas', 'sin las historias y con menos datos', 'solo nacimientos, fallecimientos y matrimonios'][info.trim] + ').', 'The tree was very large, so a smaller version was saved (' + ['', 'shorter stories', 'no stories and fewer details', 'births, deaths and marriages only'][info.trim] + ').')) + '</p>';
    } else html += '<p>' + esc(T('Todavía no hay un árbol.', 'There is no tree yet.')) + '</p>';
    html += '<label class="ar-file"><span class="ar-btn">' + esc(tree ? T('Actualizar con un archivo nuevo', 'Update with a newer file') : T('Elegir archivo GEDCOM (.ged)', 'Choose a GEDCOM file (.ged)')) + '</span>' +
      '<input id="ar-file" type="file" accept=".ged,.gedcom,.txt,text/plain" aria-label="' + esc(T('Elegir archivo GEDCOM', 'Choose a GEDCOM file')) + '"></label>';
    html += importPreview();
    html += helpHtml() + '</section>';
    if (tree) {
      html += '<section class="ar-psec"><h3>' + esc(T('2. ¿Quién es cada niño en el árbol?', '2. Who is each kid in the tree?')) + '</h3>' + kidsRows() + '</section>';
      html += '<section class="ar-psec"><h3>' + esc(T('3. Privacidad', '3. Privacy')) + '</h3>' +
        '<label class="ar-chk"><input type="checkbox" id="ar-live" ' + (tree.cfg.living ? 'checked' : '') + '> <span><b>' + esc(T('Mostrar nombres completos y fechas exactas de personas vivas', 'Show full names and exact dates of living relatives')) + '</b><small>' + esc(T('Apagado: los niños ven solo el primer nombre, el año de nacimiento y el país.', 'Off: kids see a first name, the birth year and the country only.')) + '</small></span></label>' +
        '<label class="ar-chk"><input type="checkbox" id="ar-notes" ' + (tree.cfg.notes ? 'checked' : '') + '> <span><b>' + esc(T('Mostrar las notas e historias del archivo a los niños', 'Show the file’s notes and stories to the kids')) + '</b><small>' + esc(T('Apagado por defecto: las notas pueden decir cualquier cosa. Nunca se muestran las de personas vivas, salvo que muestres también sus nombres.', 'Off by default: notes can say anything. Notes about living people are never shown unless their full names are shown too.')) + '</small></span></label>' +
        '</section>';
      html += '<section class="ar-psec"><h3>' + esc(T('4. Quitar el árbol', '4. Remove the tree')) + '</h3><button class="ar-btn danger" data-act="removetree">' + esc(T('Borrar el árbol de este aparato y del servidor', 'Delete the tree from this device and the server')) + '</button></section>';
    }
    return html;
  }

  function importPreview() {
    var I = st.imp;
    if (!I) return '';
    if (I.error) return '<p class="ar-warn" role="alert">' + esc(I.error) + '</p>';
    if (I.saving) return '<p class="ar-preview" role="status">' + esc(T('Guardando el árbol…', 'Saving the tree…')) + '</p>';
    var s = I.parsed.stats, live = I.liveCount;
    var li = '<li>' + esc(T(s.individuals + ' personas y ' + s.families + ' familias', s.individuals + ' people and ' + s.families + ' families')) + '</li>' +
      '<li>' + esc(T('Versión GEDCOM ' + (I.parsed.version || '?') + (I.parsed.software ? ' · ' + I.parsed.software : ''), 'GEDCOM version ' + (I.parsed.version || '?') + (I.parsed.software ? ' · ' + I.parsed.software : ''))) + '</li>' +
      '<li>' + esc(T(live + ' parecen estar vivas (se protegen)', live + ' look to be living (protected)')) + '</li>' +
      (s.media ? '<li>' + esc(T(s.media + ' archivos de fotos o medios no se importan', s.media + ' photo or media records are not imported')) + '</li>' : '') +
      (I.parsed.warnings || []).slice(0, 5).map(function(w) { return '<li class="ar-warn">' + esc(w) + '</li>'; }).join('');
    var rep = I.report ? '<p>' + esc(T(I.report.added + ' nuevas, ' + I.report.updated + ' actualizadas, ' + I.report.unchanged + ' iguales, ' + I.report.removed + ' quitadas' + (I.report.kept ? ', ' + I.report.kept + ' conservadas' : ''),
                                      I.report.added + ' new, ' + I.report.updated + ' updated, ' + I.report.unchanged + ' unchanged, ' + I.report.removed + ' removed' + (I.report.kept ? ', ' + I.report.kept + ' kept' : ''))) + '</p>' : '';
    return '<div class="ar-preview"><b>' + esc(I.name) + '</b><ul>' + li + '</ul>' + rep +
      '<button class="ar-btn" data-act="doimport">' + esc(tree ? T('Actualizar el árbol', 'Update the tree') : T('Importar el árbol', 'Import the tree')) + '</button></div>';
  }

  function kidsRows() {
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    if (!profiles.length) return '<p>' + esc(T('No hay perfiles de niños.', 'There are no kid profiles.')) + '</p>';
    return profiles.map(function(p) {
      var key = p.name.toLowerCase().replace(/\s+/g, '_'), pid = tree.cfg.map[key], ok = pid && tree.P[pid] && !tree.P[pid].gone, v = ok ? VP(pid) : null;
      var q = st.pq[key] || '';
      var results = '';
      if (q) results = Store.search(tree, q, { cfg: { living: 1, notes: 0 }, living: livingSet, lang: dl(), limit: 8 }).map(function(r) { return personPick(key, r); }).join('');
      else if (!ok) results = suggestFor(p, key);
      return '<div class="ar-krow"><div class="ar-khead"><span class="ar-kav">' + esc(p.avatar || '🙂') + '</span><b>' + esc(p.name) + '</b></div>' +
        (v ? '<p class="ar-klinked">✔ ' + esc(v.name) + (v.years ? ' (' + esc(v.years) + ')' : '') + ' <button class="ar-link" data-act="unlink" data-key="' + esc(key) + '">' + esc(T('Quitar', 'Unlink')) + '</button></p>'
           : (pid ? '<p class="ar-warn">' + esc(T('La persona guardada ya no está en el árbol.', 'The saved person is no longer in the tree.')) + '</p>' : '<p class="ar-kno">' + esc(T('Sin elegir todavía', 'Not chosen yet')) + '</p>')) +
        '<label class="ar-lbl" for="ar-kq-' + esc(key) + '">' + esc(T('Buscar en el árbol', 'Search the tree')) + '</label>' +
        '<input id="ar-kq-' + esc(key) + '" class="ar-kq" data-key="' + esc(key) + '" type="search" autocomplete="off" value="' + esc(q) + '" placeholder="' + esc(T('Nombre…', 'Name…')) + '">' +
        '<div class="ar-kres">' + results + '</div></div>';
    }).join('');
  }
  function personPick(key, r) {
    return '<button class="ar-kpick" data-act="link" data-key="' + esc(key) + '" data-id="' + esc(r.id) + '"><b>' + esc(r.name) + '</b><small>' + esc((r.years ? r.years + ' · ' : '') + (r.birthPlace || '')) + '</small></button>';
  }
  function suggestFor(p, key) {
    var first = Store.norm(p.name).split(' ')[0], out = [], id, v;
    for (id in tree.P) {
      if (tree.P[id].gone || !livingSet[id]) continue;
      v = VP(id);
      if (Store.norm(v.first) !== first) continue;
      if (v.birthYear != null && nowYear() - v.birthYear > 25) continue;
      out.push(v);
      if (out.length >= 4) break;
    }
    if (!out.length) return '';
    return '<p class="ar-hint">' + esc(T('¿Es uno de estos?', 'Is it one of these?')) + '</p>' + out.map(function(r) { return personPick(key, r); }).join('');
  }

  function mountParents() {
    var f = $('#ar-file');
    if (f) f.addEventListener('change', onFile);
    var lv = $('#ar-live'), nt = $('#ar-notes');
    if (lv) lv.addEventListener('change', function() { tree.cfg.living = lv.checked ? 1 : 0; if (!tree.cfg.living) tree.cfg.notes = tree.cfg.notes; saveTree(); loadTreeKeep(); toast(T('Guardado', 'Saved')); });
    if (nt) nt.addEventListener('change', function() { tree.cfg.notes = nt.checked ? 1 : 0; saveTree(); loadTreeKeep(); toast(T('Guardado', 'Saved')); });
    $all('.ar-kq').forEach(function(inp) {
      inp.addEventListener('input', function() {
        st.pq[inp.getAttribute('data-key')] = inp.value;
        var key = inp.getAttribute('data-key'), res = inp.parentNode.querySelector('.ar-kres');
        var q = inp.value;
        res.innerHTML = q ? Store.search(tree, q, { cfg: { living: 1, notes: 0 }, living: livingSet, lang: dl(), limit: 8 }).map(function(r) { return personPick(key, r); }).join('') : '';
      });
    });
  }
  function loadTreeKeep() { vcache = {}; ccache = {}; livingSet = Store.livingSet(tree, nowYear()); }

  function onFile(ev) {
    var f = ev.target.files && ev.target.files[0];
    if (!f) return;
    if (f.size > 80 * 1024 * 1024) { st.imp = { error: T('El archivo es demasiado grande (más de 80 MB).', 'The file is too large (over 80 MB).') }; render(); return; }
    readFile(f, function(buf, err) {
      if (err) { st.imp = { error: T('No se pudo leer el archivo.', 'The file could not be read.') }; render(); return; }
      var parsed;
      try { parsed = G.parse(G.decode(buf)); }
      catch (e) { st.imp = { error: T('Este archivo no parece un GEDCOM.', 'This does not look like a GEDCOM file.') }; render(); return; }
      if (!parsed.stats || !parsed.stats.individuals) { st.imp = { error: T('No se encontraron personas en el archivo. ¿Es un archivo GEDCOM?', 'No people were found in this file. Is it a GEDCOM file?') }; render(); return; }
      var tmp = Store.merge(tree, parsed, { file: f.name });
      if (tmp.error) { st.imp = { error: T('El árbol es demasiado grande para guardarlo (' + Math.round(tmp.size / 1048576) + ' MB incluso reducido).', 'The tree is too big to save (' + Math.round(tmp.size / 1048576) + ' MB even when trimmed).') }; render(); return; }
      var tmpLive = Store.livingSet(tmp.store, nowYear());
      st.imp = { name: f.name, parsed: parsed, report: tree ? tmp.report : null, liveCount: Object.keys(tmpLive).length };
      render();
    });
  }
  function readFile(f, cb) {
    if (f.arrayBuffer) { f.arrayBuffer().then(function(b) { cb(b); }, function(e) { cb(null, e); }); return; }
    var r = new FileReader();
    r.onload = function() { cb(r.result); }; r.onerror = function() { cb(null, r.error); };
    r.readAsArrayBuffer(f);
  }

  function doImport() {
    var I = st.imp; if (!I || !I.parsed) return;
    var res = Store.merge(tree, I.parsed, { file: I.name });
    if (res.error) { toast(T('El árbol es demasiado grande.', 'The tree is too big.')); return; }
    var prev = tree;
    tree = res.store;
    if (prev && prev.cfg) tree.cfg = prev.cfg;
    st.imp = { name: I.name, parsed: I.parsed, report: res.report, liveCount: I.liveCount, saving: true };
    render();
    saveTree().then(function(ok) {
      if (!ok) { tree = prev; st.imp = null; render(); toast(T('No hay espacio en este aparato para guardar el árbol.', 'There is not enough space on this device to save the tree.')); return; }
      applyTree(tree);
      st.imp = null;
      toast(T('Árbol guardado: ' + res.report.added + ' nuevas, ' + res.report.updated + ' actualizadas.', 'Tree saved: ' + res.report.added + ' new, ' + res.report.updated + ' updated.'));
      log('Family tree imported');
      render();
    });
  }

  // ---------------------------------------------------------------
  // Clicks
  // ---------------------------------------------------------------
  function onClick(ev) {
    var el = ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!el || !root.contains(el)) return;
    if (panMoved && el.classList.contains('ar-pcard')) { panMoved = false; return; }
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (act) {
      case 'back': back(); break;
      case 'open': {
        var to = el.getAttribute('data-to');
        if (to === 'quiz') st.q = null;
        if (to === 'related') st.rel = { a: meId(), b: null, pick: 'b', text: '' };
        if (to === 'map') st.map = { gen: 0, sel: null };
        if (to === 'tree') { st.depth = 0; st.root = null; }
        go(to);
        break;
      }
      case 'person': go('person', { pid: id }); { var v = V(id); if (v && isLittle() && typeof ZsSpeak !== 'undefined' && ZsSpeak.little && ZsSpeak.little()) say(v.name); } break;
      case 'treefrom': st.depth = 0; st.root = id; go('tree'); break;
      case 'zoom': if (pan) pan.zoom(parseFloat(el.getAttribute('data-f'))); break;
      case 'fit': if (pan) pan.fit(); break;
      case 'depth': st.depth = parseInt(el.getAttribute('data-n'), 10); render(); break;
      case 'relwith': st.rel = { a: meId(), b: id, pick: null, text: '' }; data.rel++; saveData(); go('related'); break;
      case 'pick': st.rel.pick = el.getAttribute('data-who'); st.rel.text = ''; render(); break;
      case 'choose': {
        st.rel[st.rel.pick] = id; st.rel.pick = null; st.rel.text = '';
        if (st.rel.b) { data.rel++; saveData(); }
        render(); break;
      }
      case 'mapgen': st.map.gen = parseInt(el.getAttribute('data-n'), 10); st.map.sel = null; render(); break;
      case 'mapsel': { var c = el.getAttribute('data-code'); st.map.sel = st.map.sel === c ? null : c; render(); break; }
      case 'qstart': startQuiz(el.getAttribute('data-kind')); break;
      case 'qpick': pickAnswer(parseInt(el.getAttribute('data-i'), 10)); break;
      case 'qnext': nextQ(); break;
      case 'qexit': st.q = null; render(); break;
      case 'parent': askParent(function() { st.imp = null; go('parents'); }); break;
      case 'link': tree.cfg.map[el.getAttribute('data-key')] = id; st.pq[el.getAttribute('data-key')] = ''; saveTree(); render(); toast(T('Guardado', 'Saved')); break;
      case 'unlink': delete tree.cfg.map[el.getAttribute('data-key')]; saveTree(); render(); break;
      case 'doimport': doImport(); break;
      case 'fileview': st.fview = el.getAttribute('data-fid'); render(); break;
      case 'fileclose': st.fview = null; render(); break;
      case 'parentdone': parentOk = false; st.fup = null; st.fview = null; render(); break;
      case 'fileunlock': askParent(function() { st.fup = null; render(); }); break;
      case 'filedel': deleteFile(st.pid, el.getAttribute('data-fid')); break;
      case 'removetree':
        if (typeof ZsDialog === 'undefined') break;
        ZsDialog.confirm({ title: T('¿Borrar el árbol?', 'Delete the tree?'), message: T('Se borra de este aparato y del servidor de la familia. Se puede volver a importar el archivo.', 'It is deleted from this device and the family server. You can import the file again.'), confirmLabel: T('Borrar', 'Delete') }).then(function(yes) {
          if (!yes) return;
          removeTree();
        });
        break;
    }
  }

  function removeTree() {
    // the server has no delete for household items: an "empty" manifest replaces the tree there
    var ts = Date.now();
    ArbolDB.clear().then(function() {
      treeTs = 0;
      ArbolSync.push(null, ts).catch(function() {});
      applyTree(null);
      render();
      toast(T('Árbol borrado.', 'Tree deleted.'));
    });
  }

  function onKey(ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.classList && (ev.target.classList.contains('ar-pcard') || ev.target.classList.contains('ar-dot'))) {
      ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }
  function onInput(ev) {
    if (ev.target && ev.target.id === 'ar-q') {
      st.rel.text = ev.target.value;
      var pos = ev.target.selectionStart;
      render();
      var inp = $('#ar-q'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) {} }
    }
  }

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  function init() {
    root = document.getElementById('ar-wrap');
    if (!root) return;
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (user) {
      age = Number(user.age) || 8;
      tier = typeof getAgeTier === 'function' ? getAgeTier(age) : 'intermediate';
      kidKey = user.name.toLowerCase().replace(/\s+/g, '_');
      data = loadData();
    }
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    root.addEventListener('input', onInput);
    root.addEventListener('change', function(ev) {
      var t = ev.target;
      if (!t || !tree || st.view !== 'person' || !parentOk) return;
      if (t.id === 'ar-fup') uploadFiles(st.pid, t.files);
      else if (t.classList && t.classList.contains('ar-fkids')) {
        var f = Files.list(tree, st.pid).filter(function(x) { return x.id === t.getAttribute('data-fid'); })[0];
        if (f) { f.kids = t.checked ? 1 : 0; saveTree(); toast(T('Guardado', 'Saved')); }
      }
    });
    window.addEventListener('pagehide', stopSpeech);
    window.addEventListener('zs:household-synced', function() { if (ready) syncTree(); });
    render();
    loadTree().then(function() {
      render();
      syncTree();
      if (/[?&]parent=1/.test(location.search)) { askParent(function() { st.view = 'parents'; render(); }); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return {
    state: function() { return { view: st.view, pid: st.pid, tier: tier, me: tree ? meId() : null, depth: st.depth, quiz: st.q ? { kind: st.q.kind, i: st.q.i, score: st.q.score, list: st.q.list } : null }; },
    data: function() { return data; },
    reload: function() { return loadTree().then(function() { render(); }); },
    tree: function() { return tree; },
    sync: function() { return syncTree(); },
    _V: V
  };
})();
