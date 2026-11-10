/* ================================================================
   LECTOR 📖 — a reading buddy for the youngest kids (about 4 to 7)
   Spanish and English. Letters and sounds, then syllables or blending,
   then building words, then short read-along books.

   Per kid, one JSON blob at zs_lector_<kid>:
     { v:1, lang:'es'|'en',
       lv:    { es2: { sounds:0..3, syll:0..3, build:0..3, read:0..3 }, ... },
       books: { 'es-mi-mama': { l:0|1, r:0|1, p:0|1 }, ... },
       last:'YYYY-MM-DD' }
   Stars: each level activity is starred out of 3 (first-try answers);
   each book earns up to 3: listened to it (l), read it by tapping every
   word (r), and read it aloud to a grown-up who confirmed with the PIN (p).
   Fields are only ever added, so older saves keep working.

   Words are said with the device's own voice (js/tts.js picks the voice
   and the rate); there is no speech recognition. Content: js/lector-data.js,
   pictures: js/lector-art*.js.
   ================================================================ */

var Lector = (function() {
  'use strict';

  var D = LectorData, A = LectorArt;
  var PREFIX = 'zs_lector_';

  var data = null, user = null, tier = 'intermediate', age = 7, track = 'en', root = null;
  var st = { tab: 'map' };

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function _load() {
    var key = _key(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    if (!d.lv || typeof d.lv !== 'object') d.lv = {};
    if (!d.books || typeof d.books !== 'object') d.books = {};
    d.v = 1;
    return d;
  }
  function _save() {
    var key = _key();
    if (!key) return;
    data.last = _today();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function T(es, en) { return typeof zsT === 'function' ? zsT(es, en) : en; }          // the kid's own language
  function TL(es, en) { return track === 'es' ? es : en; }                              // the language being learned
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function toast(m) { if (typeof ZsDialog !== 'undefined') ZsDialog.toast(m); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function slug(s) { return String(s).toLowerCase().replace(/[áéíóú]/g, function(m) { return 'aeiou'['áéíóú'.indexOf(m)]; }).replace(/[^a-z0-9]+/g, ''); }
  function isLittle() { return tier === 'beginner'; }
  function rounds() { return isLittle() ? 5 : 6; }

  var pending = [];                       // timers that belong to the screen on show
  function vlater(fn, ms) { var id = setTimeout(fn, ms); pending.push(id); return id; }
  function clearView() { pending.forEach(clearTimeout); pending = []; stopSpeech(); }

  // ---------------------------------------------------------------
  // Voice: the device's own, via ZsTTS for the voice and the pace
  // ---------------------------------------------------------------
  var spk = { tok: 0, fb: [], safety: null };
  function canSpeak() { return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined'; }
  function voiceLang(l) { return l === 'es' ? 'es-CL' : 'en-US'; }
  function paceRate() {
    var r = 0.85;
    try { if (typeof ZsTTS !== 'undefined') r = ZsTTS.getSettings().rate || r; } catch (e) {}
    return r * (isLittle() ? 0.92 : 1);
  }
  function clearFb() { spk.fb.forEach(clearTimeout); spk.fb = []; }
  function stopSpeech() {
    spk.tok++; clearFb(); clearTimeout(spk.safety);
    try { if (canSpeak()) window.speechSynthesis.cancel(); } catch (e) {}
  }
  function spans(text) {
    var out = [], re = /\S+/g, m;
    while ((m = re.exec(text))) out.push({ s: m.index, e: m.index + m[0].length });
    return out;
  }

  // Say text. o: { onWord(i) as each word is reached, onEnd(), rate }.
  // Words light up from the voice's word-boundary events; when a voice
  // sends none, the same words are lit by timing instead.
  function say(text, lang, o) {
    o = o || {};
    var tok = ++spk.tok;
    clearFb(); clearTimeout(spk.safety);
    var ws = o.onWord ? spans(text) : null;
    var gotB = false, fired = false, len = Math.max(1, text.length);
    var est = Math.max(700, len * 85 / (o.rate || paceRate()));
    function done() {
      if (fired || tok !== spk.tok) return;
      fired = true; clearFb(); clearTimeout(spk.safety);
      if (o.onEnd) o.onEnd();
    }
    function byTime(from) {                       // light words by the clock
      ws.forEach(function(w, i) {
        var at = 250 + est * (w.s / len) - from;
        spk.fb.push(setTimeout(function() { if (tok === spk.tok && !gotB) o.onWord(i); }, Math.max(0, at)));
      });
    }
    if (!canSpeak()) {
      if (ws) byTime(0);
      spk.safety = setTimeout(done, ws ? est + 400 : 0);
      return false;
    }
    var u;
    try {
      u = new window.SpeechSynthesisUtterance(text);
      u.lang = voiceLang(lang);
      var v = typeof ZsTTS !== 'undefined' ? ZsTTS.pickVoice(u.lang) : null;
      if (v) u.voice = v;
      u.rate = o.rate || paceRate();
      u.pitch = 1;
      if (ws) {
        u.onboundary = function(ev) {
          if (tok !== spk.tok || (ev.name && ev.name !== 'word')) return;
          if (!gotB) { gotB = true; clearFb(); }
          var ci = ev.charIndex | 0;
          for (var i = 0; i < ws.length; i++) if (ci >= ws[i].s && ci < ws[i].e) { o.onWord(i); return; }
        };
      }
      u.onend = done; u.onerror = done;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { spk.safety = setTimeout(done, 0); return false; }
    if (ws) spk.fb.push(setTimeout(function() { if (tok === spk.tok && !gotB) byTime(650); }, 650));
    spk.safety = setTimeout(done, est * 2 + 3000);     // some voices never say they are finished
    return true;
  }

  // A list of things said one after another, with a short pause.
  function sayList(items, lang, gap, o) {
    o = o || {};
    var i = 0, mine = null;
    function next() {
      if (mine !== null && spk.tok !== mine) return;          // something else spoke or stopped
      if (i >= items.length) { if (o.onEnd) o.onEnd(); return; }
      var k = i++;
      if (o.onEach) o.onEach(k);
      say(items[k], lang, { onEnd: function() { var t = spk.tok; setTimeout(function() { if (spk.tok === t) next(); }, gap || 350); } });
      mine = spk.tok;
    }
    next();
  }

  function sayLetter(g, lang) {
    var L = D.LETTERS[lang || track][g];
    if (!L) return;
    say(L.snd, lang || track, { onEnd: function() { setTimeout(function() { say(L.ex, lang || track); }, 220); } });
  }

  // ---------------------------------------------------------------
  // Progress
  // ---------------------------------------------------------------
  function actStars(id, act) { var L = data.lv[id]; return L ? Math.min(3, L[act] | 0) : 0; }
  function levelDone(l, min) { return l.acts.every(function(a) { return actStars(l.id, a) >= min; }); }
  function levelUnlocked(l) {
    if (l.n === 1) return true;
    return levelDone(D.levels(l.lang)[l.n - 2], 2);
  }
  function booksOpen(l) { return levelUnlocked(l) && levelDone(l, 1); }
  function levelStars(l) { return l.acts.reduce(function(n, a) { return n + actStars(l.id, a); }, 0); }
  function bookState(id) { var b = data.books[id] || {}; return { l: b.l ? 1 : 0, r: b.r ? 1 : 0, p: b.p ? 1 : 0 }; }
  function bookStars(id) { var b = bookState(id); return b.l + b.r + b.p; }
  function totalStars() {
    if (typeof getAppStars === 'function') return getAppStars('lector', data);
    var n = 0, k;
    for (k in data.lv) n += (data.lv[k].sounds | 0) + (data.lv[k].syll | 0) + (data.lv[k].blend | 0) + (data.lv[k].build | 0) + (data.lv[k].read | 0);
    for (k in data.books) n += bookStars(k);
    return n;
  }
  function refreshStars() {
    var el = document.getElementById('zs-star-count');
    if (el && typeof getTotalStars === 'function') el.textContent = '⭐ ' + getTotalStars();
    var t = $('#lx-total'); if (t) t.textContent = '★ ' + totalStars();
  }
  function starsFor(right, total) { var r = right / total; return r >= 0.8 ? 3 : r >= 0.6 ? 2 : r >= 0.3 ? 1 : 0; }
  function log(msg) { if (typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Lector', '📖', msg); } catch (e) {} } }

  // Misses go to the daily review as plain-text questions.
  function reviewAdd(id, prompt, answer, choices) {
    try { if (typeof Review !== 'undefined') Review.add(null, { app: 'lector', id: id, prompt: prompt, answer: answer, choices: choices }); } catch (e) {}
  }
  function reviewHit(id) { try { if (typeof Review !== 'undefined') Review.hit(null, 'lector:' + id); } catch (e) {} }

  // ---------------------------------------------------------------
  // Pieces of markup
  // ---------------------------------------------------------------
  var ACT = {
    sounds: ['Sonidos', 'Sounds'], syll: ['Sílabas', 'Syllables'], blend: ['Mezclar', 'Blend'],
    build: ['Armar', 'Build'], read: ['Leer', 'Read']
  };
  var ACT_ICON = {
    sounds: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 24h12l14-12v40L20 40H8z" fill="#F4B63F" stroke="#B9801A" stroke-width="2" stroke-linejoin="round"/><path d="M42 22q8 10 0 20M48 14q14 18 0 36" fill="none" stroke="#0E8F86" stroke-width="4" stroke-linecap="round"/></svg>',
    syll: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="5" y="20" width="26" height="26" rx="6" fill="#7FC8F8" stroke="#2D7FB8" stroke-width="2"/><rect x="33" y="20" width="26" height="26" rx="6" fill="#F6A5C0" stroke="#C45A83" stroke-width="2"/><path d="M14 33h8M41 33h8" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    blend: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="18" cy="32" r="12" fill="#7FC8F8" stroke="#2D7FB8" stroke-width="2"/><circle cx="46" cy="32" r="12" fill="#F6A5C0" stroke="#C45A83" stroke-width="2"/><path d="M26 32h12" stroke="#B9801A" stroke-width="4" stroke-linecap="round"/><path d="M30 26l8 6-8 6" fill="none" stroke="#B9801A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    build: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="22" width="18" height="22" rx="5" fill="#F4B63F" stroke="#B9801A" stroke-width="2"/><rect x="24" y="22" width="18" height="22" rx="5" fill="#8BD3A0" stroke="#3A9A5C" stroke-width="2"/><rect x="44" y="22" width="16" height="22" rx="5" fill="none" stroke="#9AA0AD" stroke-width="3" stroke-dasharray="4 4"/><path d="M12 52h40" stroke="#CFC3A8" stroke-width="3" stroke-linecap="round"/></svg>',
    read: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 14q14-4 26 4v34q-12-8-26-4z" fill="#FFF4D6" stroke="#B9801A" stroke-width="2" stroke-linejoin="round"/><path d="M58 14q-14-4-26 4v34q12-8 26-4z" fill="#FFFBEF" stroke="#B9801A" stroke-width="2" stroke-linejoin="round"/><path d="M12 24q8-2 14 2M12 32q8-2 14 2M38 26q6-4 14-2M38 34q6-4 14-2" fill="none" stroke="#0E8F86" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  var ICON = {
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="#8A8F9C"/><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke="#6F7480" stroke-width="2.4"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
    speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M15.5 8.5q3 3.5 0 7M18.5 5.5q6 6.5 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    adult: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="7" r="3" fill="currentColor"/><circle cx="17" cy="9.5" r="2.2" fill="currentColor"/><path d="M2.5 20v-4.5A4.5 4.5 0 017 11h2a4.5 4.5 0 014.5 4.5V20zM14.5 20v-3.5a3.5 3.5 0 013.5-3.5h.5a3.5 3.5 0 013.5 3.5V20z" fill="currentColor"/></svg>'
  };
  function starRow(n, max, cls) {
    var s = '';
    for (var i = 0; i < (max || 3); i++) s += '<span class="lx-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="' + (cls || 'lx-stars') + '" role="img" aria-label="' + n + ' / ' + (max || 3) + '">' + s + '</span>';
  }
  function head() {
    return '<div class="lx-head"><div class="lx-brand">' + A.obj('lector-mark', 34, '') + '<span>Lector</span></div></div>';
  }
  function backBtn(label) {
    return '<button type="button" class="lx-back" data-act="back">' + ICON.prev + '<span>' + esc(label) + '</span></button>';
  }
  function levelTitle(l) { return T('Nivel ' + l.n, 'Level ' + l.n); }
  function gName(g) { return g.length > 1 ? cap(g) + ' ' + g : g.toUpperCase() + ' ' + g; }
  function cardOf(g) { return D.LETTERS[track][g]; }

  // ---------------------------------------------------------------
  // Home: the map and the library
  // ---------------------------------------------------------------
  function viewHome() {
    clearView();
    st.view = 'home';
    var levels = D.levels(track);
    var h = head() +
      '<div class="lx-bar"><div class="lx-seg" role="group" aria-label="' + esc(T('Idioma', 'Language')) + '">' +
        '<button type="button" class="lx-seg-b' + (track === 'es' ? ' on' : '') + '" data-lang="es" aria-pressed="' + (track === 'es') + '">Español</button>' +
        '<button type="button" class="lx-seg-b' + (track === 'en' ? ' on' : '') + '" data-lang="en" aria-pressed="' + (track === 'en') + '">English</button></div></div>' +
      '<div class="lx-bar"><div class="lx-seg" role="group">' +
        '<button type="button" class="lx-seg-b' + (st.tab === 'map' ? ' on' : '') + '" data-tab="map" aria-pressed="' + (st.tab === 'map') + '">' + esc(T('Mapa', 'Map')) + '</button>' +
        '<button type="button" class="lx-seg-b' + (st.tab === 'books' ? ' on' : '') + '" data-tab="books" aria-pressed="' + (st.tab === 'books') + '">' + esc(T('Libros', 'Books')) + '</button></div>' +
      '<div class="lx-total" id="lx-total" aria-label="' + esc(T('Estrellas', 'Stars')) + '">★ ' + totalStars() + '</div></div>';
    h += st.tab === 'map' ? mapHtml(levels) : libraryHtml();
    root.innerHTML = h;

    $all('[data-lang]', root).forEach(function(b) {
      b.addEventListener('click', function() {
        track = b.getAttribute('data-lang'); data.lang = track; _save(); viewHome();
      });
    });
    $all('[data-tab]', root).forEach(function(b) { b.addEventListener('click', function() { st.tab = b.getAttribute('data-tab'); viewHome(); }); });
    $all('.lx-node', root).forEach(function(b) {
      b.addEventListener('click', function() {
        var l = D.level(b.getAttribute('data-level'));
        if (!levelUnlocked(l)) { sfx('wrong'); toast(T('Termina el nivel anterior para abrir este.', 'Finish the level before to open this one.')); return; }
        viewLevel(l.id);
      });
    });
    $all('.lx-book-card', root).forEach(function(b) { b.addEventListener('click', function() { openBook(b.getAttribute('data-book')); }); });
  }

  function mapHtml(levels) {
    var gap = 150, H = levels.length * gap + 30, xs = [30, 70, 32, 70, 34, 68];
    var pts = levels.map(function(l, i) { return { x: xs[i % xs.length], y: 70 + i * gap }; });
    var d = 'M' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      d += ' C' + a.x + ' ' + (a.y + gap * 0.55) + ' ' + b.x + ' ' + (b.y - gap * 0.55) + ' ' + b.x + ' ' + b.y;
    }
    var s = '<div class="lx-map" style="height:' + H + 'px"><svg class="lx-trail" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" class="lx-trail-bg"/><path d="' + d + '" class="lx-trail-dots"/></svg>';
    levels.forEach(function(l, i) {
      var open = levelUnlocked(l), done = levelDone(l, 2), max = l.acts.length * 3;
      s += '<button type="button" class="lx-node' + (open ? '' : ' locked') + (done ? ' done' : '') + '" data-level="' + l.id + '" style="left:' + pts[i].x + '%;top:' + pts[i].y + 'px"' +
        ' aria-label="' + esc(levelTitle(l) + ': ' + l.title[track === 'es' ? 0 : 1]) + (open ? '' : ' (' + T('bloqueado', 'locked') + ')') + '">' +
        '<span class="lx-node-art">' + A.obj(l.icon, 64, '') + (open ? '' : '<span class="lx-node-lock">' + ICON.lock + '</span>') + (done ? '<span class="lx-node-ok">' + ICON.check + '</span>' : '') + '</span>' +
        '<span class="lx-node-n">' + esc(levelTitle(l)) + '</span>' +
        '<span class="lx-node-t">' + esc(l.title[track === 'es' ? 0 : 1]) + '</span>' +
        (open ? '<span class="lx-node-s">★ ' + levelStars(l) + '/' + max + '</span>' : '') + '</button>';
    });
    return s + '</div>';
  }

  function coverOf(b) { var p = b.pages[b.cover || 0]; return A.scene(p[1], p[2], ''); }
  function libraryHtml() {
    var books = D.books(track), levels = D.levels(track);
    var s = '<p class="lx-lead">' + esc(T('Libros para leer contigo. Se abren al terminar las prácticas de cada nivel.', 'Books to read with you. They open when you finish the practice in each level.')) + '</p><div class="lx-shelf">';
    books.forEach(function(b) {
      var l = levels[b.lv - 1], open = booksOpen(l);
      s += '<button type="button" class="lx-book-card' + (open ? '' : ' locked') + '" data-book="' + b.id + '" aria-label="' + esc(b.title) + (open ? '' : ' (' + T('bloqueado', 'locked') + ')') + '">' +
        '<span class="lx-cover">' + coverOf(b) + (open ? '' : '<span class="lx-cover-lock">' + ICON.lock + '</span>') + '</span>' +
        '<span class="lx-book-title" lang="' + track + '">' + esc(b.title) + '</span>' +
        '<span class="lx-book-meta">' + esc(levelTitle(l)) + ' · ' + b.pages.length + ' ' + esc(T('páginas', 'pages')) + '</span>' +
        (open ? starRow(bookStars(b.id), 3, 'lx-stars small') : '') + '</button>';
    });
    return s + '</div>';
  }

  // ---------------------------------------------------------------
  // A level: its letters, its practice and its books
  // ---------------------------------------------------------------
  function viewLevel(id) {
    clearView();
    st.view = 'level'; st.level = id;
    var l = D.level(id), open = booksOpen(l), sights = Object.keys(D.SIGHT[l.lang]).filter(function(w) { return D.SIGHT[l.lang][w] === l.n; });
    var h = head() + backBtn(T('Mapa', 'Map')) +
      '<div class="lx-card lx-level-card"><div class="lx-level-title"><span class="lx-level-n">' + esc(levelTitle(l)) + '</span>' +
      '<span class="lx-level-t" lang="' + l.lang + '">' + esc(l.title[l.lang === 'es' ? 0 : 1]) + '</span></div>' +
      '<p class="lx-hint">' + esc(T('Toca una letra para escuchar su sonido.', 'Tap a letter to hear its sound.')) + '</p><div class="lx-chips">';
    l.letters.forEach(function(g) {
      h += '<button type="button" class="lx-chip" data-g="' + g + '" lang="' + l.lang + '" aria-label="' + esc(g) + '">' + esc(g.length > 1 ? g : g + ' ' + g.toUpperCase()) + '</button>';
    });
    h += '</div>';
    if (sights.length) {
      h += '<p class="lx-hint">' + esc(T('Palabras mágicas: se leen de memoria.', 'Magic words: learn these by heart.')) + '</p><div class="lx-chips">';
      sights.forEach(function(w) { h += '<button type="button" class="lx-chip magic" data-word="' + esc(w) + '" lang="' + l.lang + '">' + esc(w) + '</button>'; });
      h += '</div>';
    }
    h += '</div><div class="lx-acts">';
    l.acts.forEach(function(a) {
      h += '<button type="button" class="lx-act" data-act-id="' + a + '"><span class="lx-act-ic">' + ACT_ICON[a] + '</span>' +
        '<span class="lx-act-n">' + esc(T(ACT[a][0], ACT[a][1])) + '</span>' + starRow(actStars(id, a), 3, 'lx-stars small') + '</button>';
    });
    h += '</div>';
    var books = D.booksOf(id);
    if (books.length) {
      h += '<h2 class="lx-h2">' + esc(T('Libros', 'Books')) + '</h2>';
      if (!open) h += '<p class="lx-hint">' + esc(T('Los libros se abren cuando haces cada práctica al menos una vez.', 'Books open when you have tried every practice at least once.')) + '</p>';
      h += '<div class="lx-shelf">';
      books.forEach(function(b) {
        h += '<button type="button" class="lx-book-card' + (open ? '' : ' locked') + '" data-book="' + b.id + '" aria-label="' + esc(b.title) + '">' +
          '<span class="lx-cover">' + coverOf(b) + (open ? '' : '<span class="lx-cover-lock">' + ICON.lock + '</span>') + '</span>' +
          '<span class="lx-book-title" lang="' + b.lang + '">' + esc(b.title) + '</span>' + (open ? starRow(bookStars(b.id), 3, 'lx-stars small') : '') + '</button>';
      });
      h += '</div>';
    }
    root.innerHTML = h;
    $('[data-act="back"]', root).addEventListener('click', viewHome);
    $all('.lx-chip[data-g]', root).forEach(function(b) { b.addEventListener('click', function() { sayLetter(b.getAttribute('data-g'), l.lang); }); });
    $all('.lx-chip[data-word]', root).forEach(function(b) { b.addEventListener('click', function() { say(b.getAttribute('data-word'), l.lang); }); });
    $all('.lx-act', root).forEach(function(b) { b.addEventListener('click', function() { startAct(l, b.getAttribute('data-act-id')); }); });
    $all('.lx-book-card', root).forEach(function(b) { b.addEventListener('click', function() { openBook(b.getAttribute('data-book')); }); });
  }

  function startAct(l, act) {
    if (act === 'sounds') viewLetters(l);
    else if (act === 'syll') viewSyllables(l);
    else if (act === 'blend') viewBlend(l);
    else if (act === 'build') viewBuild(l);
    else if (act === 'read') viewRead(l);
  }

  // ---------------------------------------------------------------
  // Games share one frame: a few rounds, first-try answers count
  // ---------------------------------------------------------------
  function pictured(l) {                       // pictured words taught up to level l
    var out = [];
    D.levels(l.lang).forEach(function(x) { if (x.n <= l.n) x.pics.forEach(function(p) { out.push({ w: p.w, t: p.t, o: p.o, lv: x.n }); }); });
    return out;
  }
  // n distinct items, newer ones twice as likely, never two with the same picture
  function sample(items, n, l, key) {
    var bag = [];
    items.forEach(function(it) { bag.push(it); if (it.lv === l.n) bag.push(it); });
    bag = shuffle(bag);
    var out = [], seen = {};
    bag.forEach(function(it) { var k = key ? key(it) : it.o; if (out.length < n && !seen[k]) { seen[k] = 1; out.push(it); } });
    return out;
  }

  var G = null;      // the game on show
  function gameFrame(l, act, title, instr) {
    clearView();
    st.view = 'game';
    G.instr = instr;
    root.innerHTML = head() + backBtn(T('Nivel', 'Level') + ' ' + l.n) +
      '<div class="lx-card lx-game"><div class="lx-game-top"><div class="lx-game-t">' + esc(T(ACT[act][0], ACT[act][1])) + '</div>' +
      '<div class="lx-dots" aria-hidden="true">' + new Array(G.total + 1).join('<i></i>') + '</div></div>' +
      '<div id="lx-round"></div></div>';
    $('[data-act="back"]', root).addEventListener('click', function() { viewLevel(l.id); });
    refreshDots();
  }
  function refreshDots() {
    $all('.lx-dots i', root).forEach(function(d, i) { d.className = i < G.i ? (G.marks[i] ? 'ok' : 'miss') : i === G.i ? 'cur' : ''; });
  }
  function newGame(l, act, items) {
    G = { l: l, act: act, items: items, total: items.length, i: 0, right: 0, first: true, marks: [], done: false };
  }
  function nextRound() {
    if (G.i >= G.total) return finishGame();
    G.first = true;
    refreshDots();
    var box = $('#lx-round', root);
    box.className = '';
    G.render(box, G.items[G.i]);
  }
  // Called by a round when it is answered. ok: right answer.
  function answered(ok, info) {
    if (ok) {
      if (G.first) { G.right++; G.marks[G.i] = 1; if (info.hitId) reviewHit(info.hitId); }
      else G.marks[G.i] = 0;
      sfx('correct');
      var i = G.i;
      vlater(function() { if (G.i === i) { G.i++; nextRound(); } }, info.delay || 1300);
    } else {
      if (G.first && info.review) reviewAdd(info.review.id, info.review.prompt, info.review.answer, info.review.choices);
      G.first = false;
      sfx('wrong');
    }
  }
  function shakeEl(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  function finishGame() {
    var l = G.l, act = G.act, stars = starsFor(G.right, G.total);
    var wasOpen = {}, levels = D.levels(l.lang);
    levels.forEach(function(x) { wasOpen[x.id] = levelUnlocked(x); });
    var prev = actStars(l.id, act), L = data.lv[l.id] = data.lv[l.id] || {};
    if (stars > prev) L[act] = stars;
    _save(); refreshStars();
    log((l.title[l.lang === 'es' ? 0 : 1]) + ' · ' + ACT[act][1] + ' — ' + stars + '★');
    var fresh = levels.filter(function(x) { return !wasOpen[x.id] && levelUnlocked(x); })[0];
    sfx(stars >= 2 ? 'cheer' : 'correct');
    var msg = stars === 3 ? T('¡Excelente!', 'Excellent!') : stars === 2 ? T('¡Muy bien!', 'Very good!') : stars === 1 ? T('¡Bien! Practica otra vez.', 'Good! Practice again.') : T('¡Sigue intentando!', 'Keep trying!');
    var nextAct = l.acts[l.acts.indexOf(act) + 1];
    root.innerHTML = head() + backBtn(T('Nivel', 'Level') + ' ' + l.n) +
      '<div class="lx-card lx-result"><div class="lx-result-stars">' + starRow(stars, 3, 'lx-stars big') + '</div>' +
      '<div class="lx-result-t">' + esc(msg) + '</div>' +
      '<div class="lx-result-s">' + G.right + ' / ' + G.total + ' ' + esc(T('a la primera', 'on the first try')) + '</div>' +
      (fresh ? '<div class="lx-unlock">' + esc(T('¡Nivel nuevo abierto!', 'New level open!')) + ' ' + esc(levelTitle(fresh)) + '</div>' : '') +
      '<div class="lx-result-btns"><button type="button" class="lx-btn" id="lx-again">' + esc(T('Otra vez', 'Again')) + '</button>' +
      (nextAct ? '<button type="button" class="lx-btn primary" id="lx-nextact">' + esc(T(ACT[nextAct][0], ACT[nextAct][1])) + ICON.next + '</button>' :
        '<button type="button" class="lx-btn primary" id="lx-lvl">' + esc(T('Seguir', 'Continue')) + ICON.next + '</button>') + '</div></div>';
    $('[data-act="back"]', root).addEventListener('click', function() { viewLevel(l.id); });
    $('#lx-again').addEventListener('click', function() { startAct(l, act); });
    var nb = $('#lx-nextact') || $('#lx-lvl');
    nb.addEventListener('click', function() { if (nextAct) startAct(l, nextAct); else viewLevel(l.id); });
    G.done = true;
  }

  // Picture choices: n pictures; tapping one says its name and answers.
  function picChoicesHtml(opts) {
    return '<div class="lx-choices">' + opts.map(function(o, i) {
      return '<button type="button" class="lx-pic" data-i="' + i + '" aria-label="' + esc(o.label) + '">' + A.obj(o.o, 110, '') + '</button>';
    }).join('') + '</div>';
  }
  function bindPics(box, opts, rightIdx, say_, review) {
    $all('.lx-pic', box).forEach(function(b) {
      b.addEventListener('click', function() {
        if (b.disabled || box.classList.contains('settled')) return;
        var i = +b.getAttribute('data-i'), o = opts[i];
        stopSpeech(); say(o.label, track);
        if (i === rightIdx) {
          box.classList.add('settled'); b.classList.add('ok'); $all('.lx-pic', box).forEach(function(x) { if (x !== b) x.classList.add('dim'); });
          answered(true, { hitId: review.id });
        } else {
          b.classList.add('bad'); b.disabled = true; shakeEl(b);
          answered(false, { review: review });
        }
      });
    });
  }
  function instrBar(text, hearBtn) {
    return '<div class="lx-instr"><button type="button" class="lx-say" id="lx-hear" aria-label="' + esc(T('Escuchar', 'Listen')) + '">' + ICON.speak + '</button><p>' + esc(text) + '</p>' + (hearBtn || '') + '</div>';
  }

  // ---------------------------------------------------------------
  // Sounds: meet the letters, then match a letter to a picture
  // ---------------------------------------------------------------
  function viewLetters(l) {
    clearView();
    st.view = 'learn';
    var i = 0, list = l.letters, lang = l.lang;
    function paint() {
      clearView();
      var g = list[i], c = D.LETTERS[lang][g], last = i === list.length - 1;
      var ex = c.ex, exHtml;
      var plain = ex.toLowerCase().replace(/[áéíóú]/g, function(m) { return 'aeiou'['áéíóú'.indexOf(m)]; });
      var at = c.end ? plain.lastIndexOf(g) : plain.indexOf(g);
      exHtml = at >= 0 ? esc(ex.slice(0, at)) + '<b>' + esc(ex.slice(at, at + g.length)) + '</b>' + esc(ex.slice(at + g.length)) : esc(ex);
      root.innerHTML = head() + backBtn(T('Nivel', 'Level') + ' ' + l.n) +
        '<div class="lx-card lx-learn"><div class="lx-learn-dots" aria-hidden="true">' + list.map(function(_, k) { return '<i class="' + (k === i ? 'cur' : k < i ? 'ok' : '') + '"></i>'; }).join('') + '</div>' +
        '<button type="button" class="lx-bigletter" id="lx-bl" lang="' + lang + '" aria-label="' + esc(g) + '"><span>' + esc(g.length > 1 ? g : g.toUpperCase()) + '</span><span>' + esc(g) + '</span></button>' +
        '<button type="button" class="lx-learn-pic" id="lx-lp" aria-label="' + esc(ex) + '">' + A.obj(c.o, 150, '') + '</button>' +
        '<div class="lx-learn-word" lang="' + lang + '">' + exHtml + '</div>' +
        '<div class="lx-learn-nav"><button type="button" class="lx-round-btn" id="lx-pv" aria-label="' + esc(T('Anterior', 'Previous')) + '"' + (i === 0 ? ' disabled' : '') + '>' + ICON.prev + '</button>' +
        (last ? '<button type="button" class="lx-btn primary" id="lx-go">' + esc(T('¡A jugar!', "Let's play!")) + ICON.next + '</button>' :
          '<button type="button" class="lx-round-btn big" id="lx-nx" aria-label="' + esc(T('Siguiente', 'Next')) + '">' + ICON.next + '</button>') + '</div></div>';
      $('[data-act="back"]', root).addEventListener('click', function() { viewLevel(l.id); });
      $('#lx-bl').addEventListener('click', function() { say(c.snd, lang); });
      $('#lx-lp').addEventListener('click', function() { say(c.ex, lang); });
      $('#lx-pv').addEventListener('click', function() { i = Math.max(0, i - 1); paint(); });
      var nx = $('#lx-nx'); if (nx) nx.addEventListener('click', function() { i++; paint(); });
      var go = $('#lx-go'); if (go) go.addEventListener('click', function() { stopSpeech(); playSounds(l); });
      vlater(function() { sayLetter(g, lang); }, 250);
    }
    paint();
  }

  function playSounds(l) {
    var lang = l.lang, pool = D.taught(l.id).filter(function(g) { return D.LETTERS[lang][g]; });
    var items = [];
    var bag = [];
    l.letters.forEach(function(g) { bag.push(g, g); });
    pool.forEach(function(g) { bag.push(g); });
    shuffle(bag).forEach(function(g) { if (items.length < rounds() && items.indexOf(g) < 0) items.push(g); });
    var cardsOf = function(g) { return D.LETTERS[lang][g]; };
    var rs = items.map(function(g) {
      var c = cardsOf(g);
      var others = shuffle(pool.filter(function(x) {
        var d = cardsOf(x);
        return x !== g && d.o !== c.o && !(d.ex.indexOf(g) === 0 && !c.end) && !(c.ex.indexOf(x) === 0 && !d.end);
      })).slice(0, 2);
      var opts = shuffle([g].concat(others)).map(function(x) { return { g: x, o: cardsOf(x).o, label: cardsOf(x).ex }; });
      return { g: g, opts: opts, right: opts.map(function(o) { return o.g; }).indexOf(g), letters: opts.map(function(o) { return o.g; }) };
    });
    newGame(l, 'sounds', rs);
    var instr = c0 => c0 ? TL('¿Qué dibujo termina con este sonido?', 'Which picture ends with this sound?') : TL('¿Qué dibujo empieza con este sonido?', 'Which picture starts with this sound?');
    gameFrame(l, 'sounds');
    G.render = function(box, r) {
      var c = cardsOf(r.g), end = !!c.end;
      box.innerHTML = '<div class="lx-prompt"><button type="button" class="lx-bigletter small" id="lx-bl" lang="' + lang + '" aria-label="' + esc(r.g) + '"><span>' + esc(r.g.length > 1 ? r.g : r.g.toUpperCase()) + '</span><span>' + esc(r.g) + '</span></button>' +
        '<p class="lx-instr-t">' + esc(end ? T('¿Qué dibujo termina con este sonido?', 'Which picture ends with this sound?') : T('¿Qué dibujo empieza con este sonido?', 'Which picture starts with this sound?')) + '</p></div>' + picChoicesHtml(r.opts);
      $('#lx-bl', box).addEventListener('click', function() { say(c.snd, lang); });
      var verb = instr(end);
      var play = function() { say(c.snd, lang, { onEnd: function() { setTimeout(function() { say(verb, lang); }, 150); } }); };
      vlater(play, 350);
      var prompt = end ? TL('¿Con qué letra termina «' + c.ex + '»?', 'Which letter does “' + c.ex + '” end with?') : TL('¿Con qué letra empieza «' + c.ex + '»?', 'Which letter does “' + c.ex + '” start with?');
      bindPics(box, r.opts, r.right, null, { id: 'snd-' + lang + '-' + slug(r.g), prompt: prompt, answer: r.g, choices: r.letters });
    };
    nextRound();
  }

  // ---------------------------------------------------------------
  // Syllables (Spanish): hear one, pick it
  // ---------------------------------------------------------------
  function viewSyllables(l) {
    clearView();
    st.view = 'learn';
    var lang = l.lang, rows = {};
    l.syl.forEach(function(s) { (rows[s.charAt(0)] = rows[s.charAt(0)] || []).push(s); });
    var h = head() + backBtn(T('Nivel', 'Level') + ' ' + l.n) +
      '<div class="lx-card lx-learn"><p class="lx-hint">' + esc(T('Toca cada sílaba para escucharla.', 'Tap each syllable to hear it.')) + '</p><div class="lx-sylchart">';
    Object.keys(rows).forEach(function(k) {
      h += '<div class="lx-sylrow">' + rows[k].map(function(s) { return '<button type="button" class="lx-syl" lang="' + lang + '" data-s="' + s + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    });
    h += '</div><div class="lx-learn-nav"><button type="button" class="lx-btn primary" id="lx-go">' + esc(T('¡A jugar!', "Let's play!")) + ICON.next + '</button></div></div>';
    root.innerHTML = h;
    $('[data-act="back"]', root).addEventListener('click', function() { viewLevel(l.id); });
    $all('.lx-syl', root).forEach(function(b) { b.addEventListener('click', function() { say(b.getAttribute('data-s'), lang, { rate: 0.7 }); }); });
    $('#lx-go').addEventListener('click', function() { stopSpeech(); playSyllables(l); });
  }
  function playSyllables(l) {
    var lang = l.lang, all = [], mine = l.syl.slice();
    D.levels(lang).forEach(function(x) { if (x.n <= l.n) all = all.concat(x.syl || []); });
    var bag = [];
    mine.forEach(function(s) { bag.push(s, s); });
    all.forEach(function(s) { bag.push(s); });
    var items = [];
    shuffle(bag).forEach(function(s) { if (items.length < rounds() && items.indexOf(s) < 0) items.push(s); });
    var rs = items.map(function(s) {
      var near = shuffle(all.filter(function(x) { return x !== s && (x.charAt(0) === s.charAt(0) || x.charAt(1) === s.charAt(1)); }));
      var far = shuffle(all.filter(function(x) { return x !== s && near.indexOf(x) < 0; }));
      var opts = shuffle([s].concat(near.concat(far).slice(0, 2)));
      return { s: s, opts: opts, right: opts.indexOf(s) };
    });
    newGame(l, 'syll', rs);
    gameFrame(l, 'syll');
    G.render = function(box, r) {
      box.innerHTML = instrBar(T('Escucha y toca la sílaba.', 'Listen and tap the syllable.')) +
        '<div class="lx-choices syl">' + r.opts.map(function(s, i) { return '<button type="button" class="lx-opt" lang="' + lang + '" data-i="' + i + '">' + esc(s) + '</button>'; }).join('') + '</div>';
      var hear = function() { say(r.s, lang, { rate: 0.7 }); };
      $('#lx-hear', box).addEventListener('click', hear);
      vlater(hear, 350);
      $all('.lx-opt', box).forEach(function(b) {
        b.addEventListener('click', function() {
          if (b.disabled || box.classList.contains('settled')) return;
          var i = +b.getAttribute('data-i');
          say(r.opts[i], lang, { rate: 0.7 });
          if (i === r.right) { box.classList.add('settled'); b.classList.add('ok'); $all('.lx-opt', box).forEach(function(x) { if (x !== b) x.classList.add('dim'); }); answered(true, { hitId: 'syl-' + lang + '-' + slug(r.s) }); }
          else { b.classList.add('bad'); b.disabled = true; shakeEl(b); answered(false, { review: { id: 'syl-' + lang + '-' + slug(r.s), prompt: TL('¿Cuál dice «' + r.s + '»?', 'Which one says “' + r.s + '”?'), answer: r.s, choices: r.opts } }); }
        });
      });
    };
    nextRound();
  }

  // ---------------------------------------------------------------
  // Blend (English): hear the sounds one by one, then pick the picture
  // ---------------------------------------------------------------
  function viewBlend(l) {
    var lang = l.lang, pool = pictured(l);
    var items = sample(pool, rounds(), l);
    var rs = items.map(function(w) {
      var others = shuffle(pool.filter(function(x) { return x.o !== w.o; })).slice(0, 2);
      var opts = shuffle([w].concat(others)).map(function(x) { return { w: x.w, o: x.o, label: x.w }; });
      return { w: w, opts: opts, right: opts.map(function(o) { return o.w; }).indexOf(w.w) };
    });
    newGame(l, 'blend', rs);
    gameFrame(l, 'blend');
    G.render = function(box, r) {
      var tiles = r.w.t;
      box.innerHTML = instrBar(T('Escucha los sonidos y junta la palabra.', 'Listen to the sounds and blend the word.')) +
        '<div class="lx-tiles-row" aria-hidden="false">' + tiles.map(function(t, i) { return '<button type="button" class="lx-tile" data-k="' + i + '" lang="' + lang + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        picChoicesHtml(r.opts);
      function lit(k) { $all('.lx-tile', box).forEach(function(t, j) { t.classList.toggle('lit', j === k); }); }
      var play = function() {
        sayList(tiles.map(function(t) { return D.LETTERS[lang][t] ? D.LETTERS[lang][t].snd : t; }), lang, 380, {
          onEach: lit, onEnd: function() { lit(-1); setTimeout(function() { say(r.w.w, lang, { rate: 0.7 }); }, 200); } });
      };
      $('#lx-hear', box).addEventListener('click', play);
      vlater(play, 400);
      $all('.lx-tile', box).forEach(function(t) { t.addEventListener('click', function() { var k = +t.getAttribute('data-k'); lit(k); say(D.LETTERS[lang][tiles[k]].snd, lang); }); });
      var words = r.opts.map(function(o) { return o.w; });
      bindPics(box, r.opts, r.right, null, { id: 'blend-' + lang + '-' + slug(r.w.w), prompt: 'Sounds: ' + tiles.join(' · ') + '. Which word is it?', answer: r.w.w, choices: words });
    };
    nextRound();
  }

  // ---------------------------------------------------------------
  // Build a word: tap or drag tiles into the boxes
  // ---------------------------------------------------------------
  function viewBuild(l) {
    var lang = l.lang, pool = pictured(l).filter(function(p) { return p.t.length >= 2; });
    var items = sample(pool, isLittle() ? 4 : 5, l, function(p) { return p.w; });
    var tilePool;
    if (lang === 'en') tilePool = D.taught(l.id).filter(function(g) { return g.length <= 2; });
    else { tilePool = []; D.levels(lang).forEach(function(x) { if (x.n <= l.n) tilePool = tilePool.concat(x.syl || []); }); }
    var rs = items.map(function(w) {
      var like = w.t.map(slug);
      var extra = shuffle(tilePool.filter(function(t) { return w.t.indexOf(t) < 0 && like.indexOf(slug(t)) < 0; })).slice(0, isLittle() ? 1 : 2);
      var tiles = shuffle(w.t.concat(extra)).map(function(t, i) { return { id: i, t: t }; });
      return { w: w, tiles: tiles };
    });
    newGame(l, 'build', rs);
    gameFrame(l, 'build');
    G.render = function(box, r) { renderBuild(box, r, lang); };
    nextRound();
  }

  // near misses of a word: tiles swapped or one tile changed (for the review item)
  function nearMisses(r, lang) {
    var w = r.w, outs = [], seen = {}; seen[w.w] = 1;
    function add(s) { if (s && !seen[s]) { seen[s] = 1; outs.push(s); } }
    if (w.t.length >= 2) { var sw = w.t.slice(); var t0 = sw[0]; sw[0] = sw[1]; sw[1] = t0; add(sw.join('')); }
    r.tiles.forEach(function(x) { if (w.t.indexOf(x.t) < 0) { var c = w.t.slice(); c[c.length - 1] = x.t; add(c.join('')); } });
    return outs.slice(0, 2);
  }

  function renderBuild(box, r, lang) {
    var n = r.w.t.length, slot = new Array(n), used = {};
    for (var i = 0; i < n; i++) slot[i] = -1;
    box.innerHTML = instrBar(T('Arma la palabra con las fichas.', 'Build the word with the tiles.')) +
      '<div class="lx-build-pic">' + A.obj(r.w.o, 120, r.w.w) + '</div>' +
      '<div class="lx-slots" id="lx-slots">' + r.w.t.map(function(_, k) { return '<button type="button" class="lx-slot" data-s="' + k + '" aria-label="' + esc(T('Casilla', 'Box')) + ' ' + (k + 1) + '"></button>'; }).join('') + '</div>' +
      '<div class="lx-tray" id="lx-tray">' + r.tiles.map(function(t) { return '<button type="button" class="lx-tile pick" data-id="' + t.id + '" lang="' + lang + '">' + esc(t.t) + '</button>'; }).join('') + '</div>';
    var slotEls = $all('.lx-slot', box), tileEls = $all('.lx-tile.pick', box), locked = false;
    function txt(id) { return r.tiles[id].t; }
    function paint() {
      slotEls.forEach(function(s, k) { s.textContent = slot[k] >= 0 ? txt(slot[k]) : ''; s.classList.toggle('filled', slot[k] >= 0); });
      tileEls.forEach(function(t) { t.classList.toggle('used', !!used[+t.getAttribute('data-id')]); });
    }
    function put(id, k) {
      if (locked) return;
      if (k == null) { for (var j = 0; j < n; j++) if (slot[j] < 0) { k = j; break; } }
      if (k == null) return;
      if (slot[k] >= 0) used[slot[k]] = false;
      slot[k] = id; used[id] = true;
      sfx('click'); paint();
      if (slot.every(function(x) { return x >= 0; })) check();
    }
    function take(k) {
      if (locked || slot[k] < 0) return;
      used[slot[k]] = false; slot[k] = -1; paint();
    }
    function check() {
      locked = true;
      var made = slot.map(txt).join('|'), want = r.w.t.join('|');
      if (made === want) {
        slotEls.forEach(function(s) { s.classList.add('ok'); });
        say(r.w.w, lang, { rate: 0.75 });
        answered(true, { hitId: 'build-' + lang + '-' + slug(r.w.w), delay: 1600 });
      } else {
        slotEls.forEach(function(s) { s.classList.add('bad'); });
        shakeEl($('#lx-slots', box));
        var near = nearMisses(r, lang);
        answered(false, { review: { id: 'build-' + lang + '-' + slug(r.w.w), prompt: TL('¿Cómo se escribe «' + r.w.w + '»?', 'Which one spells “' + r.w.w + '”?'), answer: r.w.w, choices: [r.w.w].concat(near) } });
        setTimeout(function() {
          if (!box.isConnected) return;
          for (var j = 0; j < n; j++) slot[j] = -1;
          used = {}; locked = false;
          slotEls.forEach(function(s) { s.classList.remove('bad'); });
          paint();
        }, 800);
      }
    }
    slotEls.forEach(function(s, k) { s.addEventListener('click', function() { take(k); }); });
    $('#lx-hear', box).addEventListener('click', function() { say(r.w.w, lang, { rate: 0.75 }); });
    vlater(function() { say(r.w.w, lang, { rate: 0.75 }); }, 350);

    // tiles: a tap fills the next box; a drag drops on a box
    tileEls.forEach(function(t) {
      var id = +t.getAttribute('data-id'), drag = null;
      t.addEventListener('pointerdown', function(e) {
        if (t.classList.contains('used') || locked) return;
        drag = { x: e.clientX, y: e.clientY, ghost: null, pid: e.pointerId };
        try { t.setPointerCapture(e.pointerId); } catch (x) {}
      });
      t.addEventListener('pointermove', function(e) {
        if (!drag) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.ghost && Math.abs(dx) + Math.abs(dy) > 10) {
          var g = document.createElement('div');
          g.className = 'lx-ghost'; g.textContent = txt(id); g.setAttribute('lang', lang);
          document.body.appendChild(g); drag.ghost = g;
        }
        if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; }
      });
      function end(e, cancel) {
        if (!drag) return;
        var d = drag; drag = null;
        if (d.ghost) {
          d.ghost.parentNode.removeChild(d.ghost);
          if (!cancel) {
            var el = document.elementFromPoint(e.clientX, e.clientY), sEl = el && el.closest ? el.closest('.lx-slot') : null;
            if (sEl && box.contains(sEl)) put(id, +sEl.getAttribute('data-s'));
          }
        } else if (!cancel) put(id);
      }
      t.addEventListener('pointerup', function(e) { end(e, false); });
      t.addEventListener('pointercancel', function(e) { end(e, true); });
      t.addEventListener('click', function(e) { if (e.detail === 0) put(id); });        // keyboard
    });
  }

  // ---------------------------------------------------------------
  // Read the word: see a word, tap its picture
  // ---------------------------------------------------------------
  function viewRead(l) {
    var lang = l.lang, pool = pictured(l);
    var items = sample(pool, rounds(), l, function(p) { return p.w; });
    var rs = items.map(function(w) {
      var others = shuffle(pool.filter(function(x) { return x.o !== w.o; }));
      var picks = [];
      others.forEach(function(x) { if (picks.length < 2 && !picks.some(function(y) { return y.o === x.o; })) picks.push(x); });
      var opts = shuffle([w].concat(picks)).map(function(x) { return { w: x.w, o: x.o, label: x.w }; });
      return { w: w, opts: opts, right: opts.map(function(o) { return o.w; }).indexOf(w.w) };
    });
    newGame(l, 'read', rs);
    gameFrame(l, 'read');
    G.render = function(box, r) {
      box.innerHTML = instrBar(T('Lee la palabra y toca su dibujo.', 'Read the word and tap its picture.')) +
        '<button type="button" class="lx-bigword" id="lx-bw" lang="' + lang + '" aria-label="' + esc(r.w.w) + '">' + esc(r.w.w) + '</button>' + picChoicesHtml(r.opts);
      var hear = function() { say(r.w.w, lang, { rate: 0.75 }); };
      $('#lx-hear', box).addEventListener('click', hear);
      $('#lx-bw', box).addEventListener('click', hear);
      // the word is not said at the start: reading it is the point; the kid can tap it for help
      var others = r.opts.map(function(o) { return o.w; });
      bindPics(box, r.opts, r.right, null, { id: 'read-' + lang + '-' + slug(r.w.w), prompt: TL('¿Cuál palabra dice «' + r.w.w + '»?', 'Which word says “' + r.w.w + '”?'), answer: r.w.w, choices: others });
    };
    nextRound();
  }

  // ---------------------------------------------------------------
  // Books: read it to me, I read it, and a grown-up's confirmation
  // ---------------------------------------------------------------
  var B = null;      // the open book: { b, page, mode, heard, readPg, exp, auto, playing }

  function openBook(id) {
    var b = D.book(id), l = D.levels(b.lang)[b.lv - 1];
    if (!booksOpen(l)) { sfx('wrong'); toast(T('Termina las prácticas del nivel para abrir este libro.', 'Try every practice in the level to open this book.')); return; }
    var from = st.view === 'level' ? 'level' : 'home';
    clearView();
    st.view = 'book';
    B = { from: from, b: b, page: 0, mode: isLittle() ? 'listen' : 'read', heard: {}, readPg: {}, exp: 0, auto: false, playing: false, l: l };
    paintBook();
  }

  function paintBook() {
    var b = B.b, pg = b.pages[B.page], last = B.page === b.pages.length - 1;
    var ws = spans(pg[0]), words = ws.map(function(w) { return pg[0].slice(w.s, w.e); });
    var done = !!B.readPg[B.page];
    var wordsHtml = words.map(function(w, i) {
      var cls = 'lx-w';
      if (B.mode === 'read') cls += done || i < B.exp ? ' done' : i === B.exp ? ' next' : '';
      return '<button type="button" class="' + cls + '" data-i="' + i + '">' + esc(w) + '</button>';
    }).join(' ');
    var st_ = bookState(b.id);
    root.innerHTML = head() +
      '<div class="lx-bk-bar">' + backBtn(T('Libros', 'Books')) +
      '<button type="button" class="lx-adult" id="lx-adult" aria-label="' + esc(T('Para un adulto', 'For a grown-up')) + '">' + ICON.adult + '</button></div>' +
      '<div class="lx-book"><div class="lx-bk-title" lang="' + b.lang + '">' + esc(b.title) + '</div>' +
      '<div class="lx-bk-art">' + A.scene(pg[1], pg[2], '') + '</div>' +
      '<div class="lx-bk-text" lang="' + b.lang + '" id="lx-text">' + wordsHtml + '</div>' +
      '<div class="lx-bk-dots" aria-label="' + (B.page + 1) + ' / ' + b.pages.length + '">' + b.pages.map(function(_, k) { return '<i class="' + (k === B.page ? 'cur' : (B.heard[k] || B.readPg[k]) ? 'ok' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="lx-modes" role="group"><button type="button" class="lx-mode' + (B.mode === 'listen' ? ' on' : '') + '" data-mode="listen" aria-pressed="' + (B.mode === 'listen') + '">' + ICON.speak + '<span>' + esc(T('Léeme', 'Read it to me')) + '</span></button>' +
      '<button type="button" class="lx-mode' + (B.mode === 'read' ? ' on' : '') + '" data-mode="read" aria-pressed="' + (B.mode === 'read') + '">' + ICON.check + '<span>' + esc(T('Yo leo', 'I read it')) + '</span></button></div>' +
      '<div class="lx-bk-ctl"><button type="button" class="lx-round-btn" id="lx-bp" aria-label="' + esc(T('Página anterior', 'Previous page')) + '"' + (B.page === 0 ? ' disabled' : '') + '>' + ICON.prev + '</button>' +
      (B.mode === 'listen' ?
        '<button type="button" class="lx-play" id="lx-play" aria-label="' + esc(T('Escuchar la página', 'Listen to the page')) + '">' + ICON.play + '<span>' + esc(T('Escuchar', 'Listen')) + '</span></button>' +
        '<button type="button" class="lx-play alt" id="lx-all" aria-label="' + esc(T('Todo el libro', 'The whole book')) + '">' + ICON.play + ICON.play + '</button>' :
        '<button type="button" class="lx-play alt" id="lx-help" aria-label="' + esc(T('Ayuda con la palabra', 'Help with the word')) + '">' + ICON.speak + '<span>' + esc(T('Ayuda', 'Help')) + '</span></button>') +
      '<button type="button" class="lx-round-btn big" id="lx-bn" aria-label="' + esc(last ? T('Terminar', 'Finish') : T('Página siguiente', 'Next page')) + '">' + (last ? ICON.check : ICON.next) + '</button></div>' +
      '<div class="lx-bk-stars">' + starRow(st_.l + st_.r + st_.p, 3, 'lx-stars small') + '</div></div>';

    $('[data-act="back"]', root).addEventListener('click', function() { leaveBook(); });
    $('#lx-adult').addEventListener('click', function() { confirmAdult(); });
    $all('.lx-mode', root).forEach(function(m) {
      m.addEventListener('click', function() { stopSpeech(); B.auto = false; B.playing = false; B.mode = m.getAttribute('data-mode'); B.exp = 0; paintBook(); });
    });
    $('#lx-bp').addEventListener('click', function() { goPage(B.page - 1); });
    $('#lx-bn').addEventListener('click', function() { if (last) finishBook(); else goPage(B.page + 1); });
    var play = $('#lx-play'); if (play) play.addEventListener('click', function() { if (B.playing) { stopPlay(); } else { B.auto = false; playPage(); } });
    var all = $('#lx-all'); if (all) all.addEventListener('click', function() { B.auto = true; playPage(); });
    var help = $('#lx-help'); if (help) help.addEventListener('click', function() { var w = words[Math.min(B.exp, words.length - 1)]; say(w.replace(/[¡¿.,;:!?"“”]/g, ''), b.lang, { rate: 0.7 }); });
    $all('.lx-w', root).forEach(function(w) { w.addEventListener('click', function() { onWord(+w.getAttribute('data-i'), words, w); }); });
    if (B.mode === 'read' && !done) markPlayStyle();
    refreshStars();
  }
  function markPlayStyle() { var p = $('#lx-play'); if (p) p.classList.remove('on'); }

  function leaveBook() { var from = B.from; clearView(); B = null; if (from === 'level') viewLevel(st.level); else { st.tab = 'books'; viewHome(); } }

  function goPage(n) {
    stopSpeech(); B.playing = false;
    B.page = Math.max(0, Math.min(B.b.pages.length - 1, n)); B.exp = 0;
    paintBook();
  }
  function stopPlay() { stopSpeech(); B.auto = false; B.playing = false; litWord(-1); var p = $('#lx-play'); if (p) p.classList.remove('on'); }
  function litWord(i) { $all('.lx-w', root).forEach(function(w, k) { w.classList.toggle('lit', k === i); }); }

  function playPage() {
    var b = B.b, pg = b.pages[B.page], page = B.page;
    stopSpeech(); B.playing = true;
    var p = $('#lx-play'); if (p) p.classList.add('on');
    say(pg[0], b.lang, {
      onWord: function(i) { if (B && B.page === page) litWord(i); },
      onEnd: function() {
        if (!B || B.page !== page) return;
        B.playing = false; litWord(-1);
        var pp = $('#lx-play'); if (pp) pp.classList.remove('on');
        B.heard[page] = 1;
        var dots = $all('.lx-bk-dots i', root); if (dots[page]) dots[page].classList.add('ok');
        if (b.pages.every(function(_, k) { return B.heard[k]; })) bookStar('l');
        if (B.auto) {
          if (page < b.pages.length - 1) vlater(function() { if (B && B.auto) { goPage(page + 1); playPage(); } }, 900);
          else { B.auto = false; vlater(finishBook, 600); }
        }
      }
    });
  }

  function onWord(i, words, el) {
    var b = B.b;
    if (B.mode === 'read' && !B.readPg[B.page]) {
      if (i === B.exp) {
        B.exp++; sfx('click');
        el.classList.remove('next'); el.classList.add('done');
        var nxt = $all('.lx-w', root)[B.exp];
        if (nxt) nxt.classList.add('next');
        if (B.exp >= words.length) pageRead();
        return;
      }
      if (i > B.exp) { shakeEl(el); sfx('wrong'); return; }
    }
    stopSpeech(); B.auto = false; B.playing = false;
    say(words[i].replace(/[¡¿.,;:!?"“”]/g, ''), b.lang, { rate: 0.7 });
    el.classList.add('lit'); setTimeout(function() { el.classList.remove('lit'); }, 700);
  }
  function pageRead() {
    B.readPg[B.page] = 1;
    sfx('correct');
    var dots = $all('.lx-bk-dots i', root); if (dots[B.page]) dots[B.page].classList.add('ok');
    if (B.b.pages.every(function(_, k) { return B.readPg[k]; })) bookStar('r');
    var nb = $('#lx-bn'); if (nb) nb.classList.add('pulse');
  }

  function bookStar(part) {
    var id = B.b.id, cur = data.books[id] = data.books[id] || {};
    if (cur[part]) return false;
    cur[part] = 1; _save(); sfx('star');
    log('Book “' + B.b.title + '” — ' + (part === 'l' ? 'listened' : part === 'r' ? 'read it' : 'read aloud to a grown-up'));
    var stEl = $('.lx-bk-stars', root); if (stEl) stEl.innerHTML = starRow(bookStars(id), 3, 'lx-stars small');
    toast(part === 'l' ? T('¡Escuchaste todo el libro! ⭐', 'You listened to the whole book! ⭐') : part === 'r' ? T('¡Leíste todo el libro! ⭐', 'You read the whole book! ⭐') : T('¡Lectura en voz alta! ⭐', 'Read aloud! ⭐'));
    refreshStars();
    return true;
  }

  function confirmAdult() {
    if (typeof ZsDialog === 'undefined') return;
    var b = B.b;
    ZsDialog.prompt({
      title: T('Para un adulto', 'For a grown-up'),
      message: T('Adulto: ¿te leyó este libro en voz alta? Si es así, ingresa tu PIN.', 'Grown-up: did they read this book aloud to you? If so, enter your parent PIN.'),
      inputType: 'password', inputMode: 'numeric', placeholder: 'PIN', label: 'PIN',
      confirmLabel: T('Dar estrella ⭐', 'Award star ⭐'), cancelLabel: T('Todavía no', 'Not yet')
    }).then(function(v) {
      if (v == null || !B || B.b.id !== b.id) return;
      var pin = typeof getParentPin === 'function' ? getParentPin() : null;
      if (pin && String(v).trim() === String(pin)) {
        if (!bookState(b.id).p) bookStar('p'); else toast(T('Ya tiene esta estrella.', 'Already has this star.'));
        if ($('.lx-finish')) finishBook();
      } else { sfx('wrong'); toast(T('Ese PIN no es correcto.', 'That PIN is not right.')); }
    });
  }

  function finishBook() {
    stopSpeech(); B.auto = false; B.playing = false;
    var b = B.b, s = bookState(b.id);
    var old = $('.lx-finish'); if (old) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.className = 'lx-finish'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="lx-finish-card"><div class="lx-finish-t">' + esc(T('¡Terminaste el libro!', 'You finished the book!')) + '</div>' +
      '<div class="lx-finish-b" lang="' + b.lang + '">' + esc(b.title) + '</div>' +
      '<ul class="lx-finish-l"><li class="' + (s.l ? 'on' : '') + '"><span>★</span>' + esc(T('Lo escuché', 'I listened to it')) + '</li>' +
      '<li class="' + (s.r ? 'on' : '') + '"><span>★</span>' + esc(T('Lo leí yo', 'I read it myself')) + '</li>' +
      '<li class="' + (s.p ? 'on' : '') + '"><span>★</span>' + esc(T('Se lo leí en voz alta a un adulto', 'I read it aloud to a grown-up')) + '</li></ul>' +
      '<div class="lx-finish-btns"><button type="button" class="lx-btn" id="lx-fa">' + ICON.adult + '<span>' + esc(T('Para un adulto', 'For a grown-up')) + '</span></button>' +
      '<button type="button" class="lx-btn" id="lx-fr">' + esc(T('Otra vez', 'Read again')) + '</button>' +
      '<button type="button" class="lx-btn primary" id="lx-fb">' + esc(T('Más libros', 'More books')) + ICON.next + '</button></div></div>';
    document.body.appendChild(ov);
    sfx('cheer');
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    $('#lx-fa').addEventListener('click', function() { confirmAdult(); });
    $('#lx-fr').addEventListener('click', function() { close(); B.heard = {}; B.readPg = {}; B.page = 0; B.exp = 0; paintBook(); });
    $('#lx-fb').addEventListener('click', function() { close(); leaveBook(); });
  }

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  function init() {
    root = document.getElementById('lx-wrap');
    if (!root || typeof getActiveUser !== 'function') return;
    user = getActiveUser();
    if (!user) return;
    age = Number(user.age) || 7;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age) : 'intermediate';
    data = _load();
    var kl = typeof getKidLang === 'function' ? getKidLang() : 'en';
    var saved = data.lang === 'es' || data.lang === 'en' ? data.lang : (kl === 'en' ? 'en' : 'es');
    track = typeof zsAppLang === 'function' ? zsAppLang(saved) : saved;
    if (track !== 'es' && track !== 'en') track = 'en';
    window.addEventListener('pagehide', stopSpeech);
    document.addEventListener('visibilitychange', function() { if (document.hidden) stopSpeech(); });
    viewHome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { _say: say };
})();
