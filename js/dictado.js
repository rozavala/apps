/* ================================================================
   DICTADO ✍️ — spelling dictation, Spanish and English
   The app says a word, a phrase or a sentence; the kid writes it on
   the on-screen keyboard (with ñ and the accented vowels) or on paper
   and then checks it. A mistake is shown letter by letter, kindly, with
   the rule that explains it; the word comes back in Repaso.

   Levels (by age): 1 words (6-7), 2 phrases (8-9), 3 sentences (10+).
   Lists: one per spelling rule family (js/dictado-data.js).
   The rules of the game live in js/dictado-engine.js.

   Per-kid progress at zs_dictado_<kid> (one JSON blob):
     { v:1, lang, mode, level, best:{ 'es-bv:1': 0..3 },
       words:{ 'escribir':[hits,misses] }, rv:{ 'escribir': reviewId }, rounds:n, last }
   ================================================================ */

(function() {
  'use strict';

  var E = DictadoEngine, D = DictadoData, A = DictadoArt;
  var PREFIX = 'zs_dictado_';
  var USER = (typeof getActiveUser === 'function') ? getActiveUser() : null;
  if (!USER) return;           // nav.js sends a signed-out visitor to the hub

  // ── tiny helpers ─────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function T(es, en) { return (typeof zsT === 'function') ? zsT(es, en) : en; }
  function esc(s) { return (typeof escHtml === 'function') ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function sfx(n) { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} }
  function pick(a, i) { return a[i % a.length]; }
  function tier() { return (typeof getAgeTier === 'function') ? getAgeTier(USER.age) : 'intermediate'; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ── storage ──────────────────────────────────────────────────
  function key() { return (typeof getUserAppKey === 'function') ? getUserAppKey(PREFIX) : null; }
  function load() {
    var k = key(), raw = null;
    if (k) { try { raw = JSON.parse(localStorage.getItem(k)); } catch (e) { raw = null; } }
    return E.migrate(raw);
  }
  function save() {
    var k = key();
    if (!k) return;
    d.last = today();
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {}
    try { if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k); } catch (e) {}
  }

  // ── state ────────────────────────────────────────────────────
  var d = null;                // saved progress
  var S = {                    // this visit
    lang: 'es', level: 2, mode: 'keys',
    listId: null, items: [], i: 0, right: 0, results: [], reviewed: 0,
    typed: '', shift: false, locked: false, phase: 'type', picked: -1, spoken: false
  };

  function defaultLang() {
    var saved = d.lang || 'es';
    return (typeof zsAppLang === 'function') ? zsAppLang(saved) : saved;
  }

  // ── read-aloud ───────────────────────────────────────────────
  // Dictation IS the activity, so it speaks even when a parent has turned
  // the quiz read-aloud buttons Off for this kid.
  function canSpeak() { return typeof ZsTTS !== 'undefined' && ZsTTS.supported(); }
  function say(text, slow) {
    if (!canSpeak() || !text) return false;
    var lang = S.lang === 'es' ? 'es-CL' : 'en-US';
    var rate = slow ? 0.5 : Math.min(0.85, (ZsTTS.getSettings().rate || 0.85));
    if (ZsTTS.speak(text, { lang: lang, rate: rate })) return true;
    try {
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = rate;
      var v = ZsTTS.pickVoice(lang); if (v) u.voice = v;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function stopSpeech() { try { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); } catch (e) {} }
  function spell(word) {
    var names = S.lang === 'es' ? { 'ñ': 'eñe', 'ü': 'u con diéresis' } : {};
    var letters = word.split('').filter(function(c) { return c !== ' '; }).map(function(c) {
      return names[c] || (/[a-záéíóúü]/i.test(c) ? c.toUpperCase() : c);
    });
    say(letters.join(', '), true);
  }

  // ── common bits ──────────────────────────────────────────────
  function root() { return $('dk-wrap'); }
  function listName(id) {
    if (D.isMix(id)) return T('Mezcla', 'Mix');
    var l = D.list(id);
    return l ? T(l.name[0], l.name[1]) : id;
  }
  function stars(n, label) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<span class="dk-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="dk-stars" role="img" aria-label="' + n + ' / 3 ' + esc(label || T('estrellas', 'stars')) + '">' + s + '</span>';
  }
  function levelName(n) { var l = D.LEVELS[n - 1]; return T(l.t[0], l.t[1]); }
  function totalStars() { return E.totalStars(d); }
  function refreshTotal() { var el = $('dk-total'); if (el) el.textContent = '★ ' + totalStars(); }

  // ── home ─────────────────────────────────────────────────────
  function renderHome() {
    stopSpeech();
    S.listId = null;
    var rec = D.levelForAge(USER.age);
    var lists = D.listsFor(S.lang);
    var h = '';
    h += '<header class="dk-hero">' +
           '<div class="dk-hero-art">' + A.hero() + '</div>' +
           '<div class="dk-hero-text"><h1>Dictado</h1><p>' + esc(T('Escucha, escribe y descubre cómo se escribe cada palabra.', 'Listen, write, and find out how each word is spelled.')) + '</p></div>' +
           '<div class="dk-total" id="dk-total" title="' + esc(T('Tus estrellas', 'Your stars')) + '">★ ' + totalStars() + '</div>' +
         '</header>';

    h += '<section class="dk-card dk-opts">' +
           '<div class="dk-opt"><span class="dk-opt-l" id="dk-l-lang">' + esc(T('Idioma del dictado', 'Dictation language')) + '</span>' +
             '<div class="dk-seg" role="group" aria-labelledby="dk-l-lang">' +
               ['es', 'en'].map(function(l) {
                 return '<button type="button" class="dk-segb' + (S.lang === l ? ' on' : '') + '" data-lang="' + l + '" aria-pressed="' + (S.lang === l) + '">' + (l === 'es' ? 'Español' : 'English') + '</button>';
               }).join('') + '</div></div>' +
           '<div class="dk-opt"><span class="dk-opt-l" id="dk-l-mode">' + esc(T('Cómo escribes', 'How you write')) + '</span>' +
             '<div class="dk-seg" role="group" aria-labelledby="dk-l-mode">' +
               '<button type="button" class="dk-segb' + (S.mode === 'keys' ? ' on' : '') + '" data-mode="keys" aria-pressed="' + (S.mode === 'keys') + '"><span class="dk-ic">' + A.keyboard() + '</span>' + esc(T('Teclado', 'Keyboard')) + '</button>' +
               '<button type="button" class="dk-segb' + (S.mode === 'paper' ? ' on' : '') + '" data-mode="paper" aria-pressed="' + (S.mode === 'paper') + '"><span class="dk-ic">' + A.paper() + '</span>' + esc(T('Papel', 'Paper')) + '</button>' +
             '</div></div>' +
         '</section>';

    h += '<section class="dk-card"><h2 class="dk-h2" id="dk-l-level">' + esc(T('Nivel', 'Level')) + '</h2>' +
           '<div class="dk-levels" role="group" aria-labelledby="dk-l-level">' +
           D.LEVELS.map(function(L) {
             return '<button type="button" class="dk-lvl' + (S.level === L.n ? ' on' : '') + '" data-level="' + L.n + '" aria-pressed="' + (S.level === L.n) + '">' +
               '<b>' + esc(T(L.t[0], L.t[1])) + '</b><span>' + esc(L.ages + ' ' + T('años', 'years')) + '</span>' +
               (rec === L.n ? '<i class="dk-rec">' + esc(T('Para ti', 'For you')) + '</i>' : '') + '</button>';
           }).join('') + '</div>' +
           '<p class="dk-note">' + esc(S.level === 1 ? T('Una palabra cada vez.', 'One word at a time.')
              : S.level === 2 ? T('Frases cortas, sin mayúsculas ni signos.', 'Short phrases, no capitals or punctuation.')
              : T('Oraciones con mayúsculas, tildes y signos de puntuación.', 'Sentences with capitals, accents and punctuation.')) + '</p></section>';

    h += '<section aria-label="' + esc(T('Listas', 'Lists')) + '"><h2 class="dk-h2 dk-h2-pad">' + esc(T('Elige una lista', 'Pick a list')) + '</h2><div class="dk-lists">';
    var all = [D.mixId(S.lang)].concat(lists.map(function(l) { return l.id; }));
    all.forEach(function(id) {
      var mix = D.isMix(id), l = mix ? null : D.list(id);
      var n = D.items(id, S.level).length, best = d.best[id + ':' + S.level] || 0;
      h += '<button type="button" class="dk-list' + (mix ? ' mix' : '') + '" data-list="' + esc(id) + '"' + (n ? '' : ' disabled') + '>' +
             '<span class="dk-badge">' + esc(mix ? 'a b c' : l.badge) + '</span>' +
             '<span class="dk-list-t"><b>' + esc(listName(id)) + '</b><small>' + n + ' ' + esc(S.level === 1 ? T('palabras', 'words') : S.level === 2 ? T('frases', 'phrases') : T('oraciones', 'sentences')) + '</small></span>' +
             stars(best) + '</button>';
    });
    h += '</div></section>';
    root().innerHTML = h;
    wireHome();
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function wireHome() {
    $all('[data-lang]').forEach(function(b) { b.onclick = function() { S.lang = b.getAttribute('data-lang'); d.lang = S.lang; save(); renderHome(); }; });
    $all('[data-mode]').forEach(function(b) { b.onclick = function() { S.mode = b.getAttribute('data-mode'); d.mode = S.mode; save(); renderHome(); }; });
    $all('[data-level]').forEach(function(b) { b.onclick = function() { S.level = +b.getAttribute('data-level'); d.level = S.level; save(); renderHome(); }; });
    $all('[data-list]').forEach(function(b) { b.onclick = function() { start(b.getAttribute('data-list')); }; });
  }

  // ── a round ──────────────────────────────────────────────────
  function start(listId) {
    var pool = D.items(listId, S.level);
    if (!pool.length) return;
    var n = Math.min(E.roundSize(tier(), S.level), pool.length);
    S.listId = listId;
    S.items = E.pickRound(pool, n, d.words);
    S.i = 0; S.right = 0; S.results = []; S.reviewed = 0;
    renderPlay();
    renderItem();
  }

  function renderPlay() {
    root().innerHTML =
      '<div class="dk-qhead">' +
        '<div class="dk-dots" id="dk-dots" role="img"></div>' +
        '<span class="dk-from">' + esc(listName(S.listId)) + ' · ' + esc(levelName(S.level)) + '</span>' +
        '<button type="button" class="dk-exit" id="dk-exit">' + esc(T('Salir', 'Leave')) + '</button>' +
      '</div>' +
      '<div class="dk-card dk-play" id="dk-stage"></div>';
    $('dk-exit').onclick = function() { renderHome(); };
  }

  function dots() {
    var h = '';
    S.items.forEach(function(it, k) {
      var r = S.results[k];
      h += '<i class="' + (r ? (r.ok ? 'ok' : 'miss') : (k === S.i ? 'now' : '')) + '"></i>';
    });
    var el = $('dk-dots');
    el.innerHTML = h;
    el.setAttribute('aria-label', T('Ejercicio ', 'Item ') + (S.i + 1) + ' / ' + S.items.length);
  }

  function cur() { return S.items[S.i]; }

  function renderItem() {
    var it = cur();
    S.typed = ''; S.shift = false; S.locked = false; S.picked = -1;
    S.phase = S.mode === 'paper' ? 'hear' : 'type';
    dots();
    var HINT = {
      1: { keys: ['Escucha la palabra y escríbela.', 'Listen to the word and type it.'], paper: ['Escucha la palabra y escríbela en tu papel.', 'Listen to the word and write it on your paper.'] },
      2: { keys: ['Escucha la frase y escríbela.', 'Listen to the phrase and type it.'], paper: ['Escucha la frase y escríbela en tu papel.', 'Listen to the phrase and write it on your paper.'] },
      3: { keys: ['Escucha la oración y escríbela, con mayúsculas, tildes y signos.', 'Listen to the sentence and type it, with capitals, accents and punctuation.'],
           paper: ['Escucha la oración y escríbela en tu papel, con mayúsculas, tildes y signos.', 'Listen to the sentence and write it on your paper, with capitals, accents and punctuation.'] }
    };
    var hint = HINT[S.level][S.mode === 'paper' ? 'paper' : 'keys'];
    var h = '<p class="dk-hint" id="dk-hint">' + esc(T(hint[0], hint[1])) + '</p>';
    h += '<div class="dk-listen">' +
           '<button type="button" class="dk-big" id="dk-hear"><span class="dk-ic">' + A.speaker() + '</span><span>' + esc(T('Escuchar', 'Listen')) + '</span></button>' +
           '<button type="button" class="dk-big slow" id="dk-slow"><span class="dk-ic">' + A.turtle() + '</span><span>' + esc(T('Más despacio', 'Slower')) + '</span></button>' +
         '</div>';
    if (!canSpeak()) {
      h += '<p class="dk-nospeech">' + esc(T('Este aparato no puede leer en voz alta. Un adulto puede dictarte, o toca «Ver» para copiarla.', 'This device cannot read aloud. A grown-up can dictate it, or tap "Show" to copy it.')) +
           ' <button type="button" class="dk-link" id="dk-peek">' + esc(T('Ver', 'Show')) + '</button><span class="dk-peeked" id="dk-peeked" hidden></span></p>';
    }
    if (S.mode === 'keys') {
      if (S.level === 1) h += '<div class="dk-len" aria-label="' + esc(T('Letras: ', 'Letters: ') + it.t.length) + '">' + it.t.split('').map(function() { return '<i></i>'; }).join('') + '</div>';
      h += '<div class="dk-line" id="dk-line" role="textbox" aria-readonly="true" aria-label="' + esc(T('Lo que escribes', 'What you are writing')) + '"></div>';
      h += '<div class="dk-kb" id="dk-kb">' + keyboardHtml() + '</div>';
      h += '<button type="button" class="dk-go" id="dk-check" disabled>' + esc(T('Comprobar', 'Check')) + '</button>';
    } else {
      h += '<button type="button" class="dk-go" id="dk-written">' + esc(T('Ya lo escribí', 'I wrote it')) + '</button>';
    }
    h += '<div class="dk-fb" id="dk-fb" aria-live="polite"></div>';
    $('dk-stage').innerHTML = h;
    $('dk-stage').classList.remove('checked');
    $('dk-stage').classList.toggle('l3', S.level === 3);
    wireItem();
    if (S.mode === 'keys') updateLine();
    try { window.scrollTo(0, 0); } catch (e) {}
    // Say it once as it appears (a tap on "start" already counts as a touch).
    setTimeout(function() { if (cur() === it && !S.locked && S.phase !== 'done') say(it.t, false); }, 350);
  }

  // ── the on-screen keyboard ───────────────────────────────────
  function keyboardHtml() {
    var es = S.lang === 'es', L = S.level, up = S.shift;
    function k(ch, cls) {
      return '<button type="button" class="dk-key dk-l' + (cls ? ' ' + cls : '') + '" data-k="' + esc(ch) + '">' + esc(up ? ch.toUpperCase() : ch) + '</button>';
    }
    function p(ch) { return '<button type="button" class="dk-key" data-k="' + esc(ch) + '" data-p="1">' + esc(ch) + '</button>'; }
    var rows = [];
    rows.push('qwertyuiop'.split('').map(function(c) { return k(c); }).join(''));
    rows.push(('asdfghjkl' + (es ? 'ñ' : '')).split('').map(function(c) { return k(c); }).join(''));
    rows.push((L === 3 ? '<button type="button" class="dk-key wide" data-act="shift" aria-label="' + esc(T('Mayúscula', 'Capital letter')) + '" aria-pressed="' + up + '"><span class="dk-ic">' + A.shift(up) + '</span></button>' : '') +
      'zxcvbnm'.split('').map(function(c) { return k(c); }).join('') +
      '<button type="button" class="dk-key wide" data-act="back" aria-label="' + esc(T('Borrar', 'Delete')) + '"><span class="dk-ic">' + A.backspace() + '</span></button>');
    var last = '';
    if (es) last += 'áéíóúü'.split('').map(function(c) { return k(c, 'acc'); }).join('');
    if (L >= 2) last += '<button type="button" class="dk-key space" data-act="space" aria-label="' + esc(T('Espacio', 'Space')) + '">' + esc(T('espacio', 'space')) + '</button>';
    if (!es && L === 3) last += ['?', '!', ',', '.'].map(p).join('');
    if (last) rows.push(last);
    if (es && L === 3) rows.push(['¿', '?', '¡', '!', ',', '.'].map(p).join(''));
    return rows.map(function(r) { return '<div class="dk-krow">' + r + '</div>'; }).join('');
  }

  function refreshKeys() {
    $all('.dk-key.dk-l').forEach(function(b) { var c = b.getAttribute('data-k'); b.textContent = S.shift ? c.toUpperCase() : c; });
    var sh = document.querySelector('[data-act="shift"]');
    if (sh) { sh.setAttribute('aria-pressed', String(S.shift)); sh.classList.toggle('on', S.shift); sh.querySelector('.dk-ic').innerHTML = A.shift(S.shift); }
  }

  function updateLine() {
    var line = $('dk-line');
    if (!line) return;
    line.innerHTML = (S.typed ? esc(S.typed) : '<span class="dk-ph">' + esc(T('Escribe aquí…', 'Write here…')) + '</span>') + '<span class="dk-caret"></span>';
    var ck = $('dk-check');
    if (ck) ck.disabled = !E.tidy(S.typed);
  }

  function typeChar(ch) {
    if (S.locked || S.phase !== 'type' || S.typed.length >= 140) return;
    S.typed += ch;
    if (S.shift) { S.shift = false; refreshKeys(); }
    updateLine();
  }
  function backspace() {
    if (S.locked || S.phase !== 'type') return;
    S.typed = S.typed.slice(0, -1);
    updateLine();
  }

  function onKbClick(e) {
    var b = e.target.closest ? e.target.closest('.dk-key') : null;
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (e.detail > 0) { try { b.blur(); } catch (x) {} }   // a touch or click: keep the real keyboard free
    if (act === 'back') return backspace();
    if (act === 'space') { if (S.typed && S.typed.slice(-1) !== ' ') typeChar(' '); return; }
    if (act === 'shift') { S.shift = !S.shift; refreshKeys(); return; }
    var c = b.getAttribute('data-k');
    if (!c) return;
    typeChar(b.hasAttribute('data-p') ? c : (S.shift ? c.toUpperCase() : c));
  }

  // A real keyboard works too (an iPad with one, a laptop). Accented
  // letters arrive as ordinary characters after the dead key.
  var ALLOWED = /^[a-zA-ZñÑáéíóúüÁÉÍÓÚÜ¿¡?!,.;: ]$/;
  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!S.listId) return;
    if (S.phase === 'done' || (S.locked && e.key !== 'Enter')) return;
    var t = e.target, tag = t && t.tagName ? t.tagName : '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (e.key === 'Enter') {
      if (/^(BUTTON|A)$/.test(tag)) return;        // the button does its own click
      var go = S.locked ? $('dk-next') : (S.mode === 'keys' ? $('dk-check') : null);
      if (go && !go.disabled) { e.preventDefault(); go.click(); }
      return;
    }
    if (S.mode !== 'keys' || S.locked || S.phase !== 'type') return;
    if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
    if (e.key && e.key.length === 1 && ALLOWED.test(e.key)) {
      e.preventDefault();
      if (e.key === ' ' && (!S.typed || S.level === 1)) return;
      typeChar(e.key);
    }
  }

  function wireItem() {
    var it = cur();
    $('dk-hear').onclick = function() { say(it.t, false); };
    $('dk-slow').onclick = function() { say(it.t, true); };
    var peek = $('dk-peek');
    if (peek) peek.onclick = function() {
      var el = $('dk-peeked'); el.textContent = ' ' + it.t; el.hidden = false;
      setTimeout(function() { el.hidden = true; }, 4000);
    };
    var kb = $('dk-kb');
    if (kb) kb.addEventListener('click', onKbClick);
    var ck = $('dk-check');
    if (ck) ck.onclick = checkTyped;
    var wr = $('dk-written');
    if (wr) wr.onclick = showPaperAnswer;
  }

  // ── checking ─────────────────────────────────────────────────
  function checkTyped() {
    if (S.locked || !E.tidy(S.typed)) return;
    S.locked = true;
    var it = cur(), df = E.diff(it.t, S.typed, S.level);
    finishItem(it, df.ok, df, null);
  }

  function showPaperAnswer() {
    var it = cur();
    S.phase = 'reveal';
    var df = E.diff(it.t, it.t, S.level);
    $('dk-stage').classList.add('checked');
    $('dk-fb').innerHTML =
      '<p class="dk-fb-msg info">' + esc(T('Compáralo con tu papel, letra por letra.', 'Compare it with your paper, letter by letter.')) + '</p>' +
      '<div class="dk-tiles" aria-label="' + esc(it.t) + '">' + tilesHtml(df.cells) + '</div>' +
      '<div class="dk-fb-actions">' +
        '<button type="button" class="dk-go good" id="dk-pright">' + esc(T('¡Lo escribí bien!', 'I wrote it right!')) + '</button>' +
        '<button type="button" class="dk-go alt" id="dk-pwrong">' + esc(T('Quiero corregir algo', 'I want to fix something')) + '</button>' +
      '</div>';
    $('dk-pright').onclick = function() { S.locked = true; finishItem(it, true, df, { paper: true }); };
    $('dk-pwrong').onclick = function() {
      var toks = E.tokens(df.expected);
      if (toks.length <= 1) { S.locked = true; finishItem(it, false, df, { paper: true, token: 0 }); return; }
      showWordPicker(it, df, toks);
    };
  }

  function showWordPicker(it, df, toks) {
    S.phase = 'pick'; S.picked = -1;
    $('dk-fb').innerHTML =
      '<p class="dk-fb-msg info">' + esc(T('Toca la palabra que quieres practicar.', 'Tap the word you want to practise.')) + '</p>' +
      '<div class="dk-chips">' + toks.map(function(t, i) { return '<button type="button" class="dk-chip" data-i="' + i + '">' + esc(t.raw) + '</button>'; }).join('') + '</div>' +
      '<div class="dk-fb-actions"><button type="button" class="dk-go" id="dk-pdone" disabled>' + esc(T('Listo', 'Done')) + '</button></div>';
    $all('.dk-chip').forEach(function(b) {
      b.onclick = function() {
        S.picked = +b.getAttribute('data-i');
        $all('.dk-chip').forEach(function(x) { x.classList.toggle('on', x === b); });
        $('dk-pdone').disabled = false;
      };
    });
    $('dk-pdone').onclick = function() { S.locked = true; finishItem(it, false, df, { paper: true, token: S.picked }); };
  }

  // The letters of the right text, coloured by how they went. A word's
  // letters stay together, so a long sentence breaks between words.
  function tileHtml(c) {
    if (c.s === 'extra') return '<span class="dk-t extra" title="' + esc(T('Sobra', 'Extra')) + '"><s>' + esc(c.t === ' ' ? '␣' : c.t) + '</s></span>';
    var sp = c.c === ' ';
    var you = c.s === 'sub' ? '<small>' + esc(c.t === ' ' ? '␣' : c.t) + '</small>' : '';
    return '<span class="dk-t ' + c.s + (sp ? ' sp' : '') + '">' + you + '<b>' + (sp ? '&nbsp;' : esc(c.c)) + '</b></span>';
  }
  function tilesHtml(cells) {
    var out = '', word = '';
    function flush() { if (word) { out += '<span class="dk-w">' + word + '</span>'; word = ''; } }
    cells.forEach(function(c) {
      if (c.c === ' ' && c.s !== 'extra') { flush(); out += tileHtml(c); }
      else word += tileHtml(c);
    });
    flush();
    return out;
  }

  function message(df) {
    if (df.ok) return pick([T('¡Perfecto!', 'Perfect!'), T('¡Muy bien!', 'Well done!'), T('¡Eso es!', 'That is it!')], S.i);
    if (df.kind === 'accent') return T('¡Muy cerca! Solo hay que revisar las tildes.', 'So close! Just check the accent marks.');
    if (df.kind === 'case') return T('¡Muy cerca! Revisa las mayúsculas.', 'So close! Check the capital letters.');
    if (df.kind === 'punct') return T('¡Muy cerca! Revisa los signos de puntuación.', 'So close! Check the punctuation.');
    return df.wrong <= 2 ? T('¡Casi! Mira las letras de colores.', 'Almost! Look at the coloured letters.')
                         : T('Vamos a mirarla juntos, letra por letra.', 'Let us look at it together, letter by letter.');
  }

  function ruleCardHtml(it, df) {
    var r = null, title = '', tip = '';
    if (df && (df.kind === 'case' || df.kind === 'punct')) {
      var g = D.GENERIC[df.kind];
      title = T(g.t[0], g.t[1]); tip = T(g.tip[0], g.tip[1]);
    } else {
      r = D.rule(it.list, it.rule);
      if (r) { title = T(r.t[0], r.t[1]); tip = T(r.tip[0], r.tip[1]); }
    }
    if (!title) return '';
    return '<div class="dk-rule"><div class="dk-rule-h"><span class="dk-ic">' + A.bulb() + '</span><b>' + esc(title) + '</b></div><p>' + esc(tip) + '</p></div>';
  }

  // ── Repaso: a missed word comes back tomorrow ────────────────
  function toReview(it, df, token) {
    if (typeof Review === 'undefined') return false;
    var f = null, ctx = null;
    if (token != null) {            // paper: the kid chose the word
      var toks = E.tokens(df.expected), t = toks[token];
      if (!t) return false;
      f = { word: E.cleanWord(t.raw), start: t.start, end: t.end, typed: '' };
    } else {
      f = E.focusWord(df);
    }
    if (!f || !f.word) return false;
    var multi = df.expected.indexOf(' ') >= 0;
    if (multi) ctx = E.blank(df, f);
    var r = D.rule(it.list, it.rule);
    var q = T('¿Cuál está bien escrita?', 'Which one is spelled correctly?');
    var prompt = q + (ctx ? ' ' + ctx : '') + (r ? ' (' + T(r.t[0], r.t[1]) + ')' : '');
    var max = (tier() === 'advanced' || tier() === 'expert') ? 4 : 3;
    var item = { app: 'dictado', prompt: prompt, answer: f.word, choices: E.choicesFor(f.word, S.lang, f.typed, max) };
    var added = Review.add(null, item);
    if (!added) return false;
    d.rv[it.t.toLowerCase()] = added.id;
    var ks = Object.keys(d.rv);
    if (ks.length > 80) ks.slice(0, ks.length - 80).forEach(function(x) { delete d.rv[x]; });
    return true;
  }
  function fromReview(it) {
    if (typeof Review === 'undefined') return;
    var k = it.t.toLowerCase(), id = d.rv[k];
    if (!id) return;
    try {
      Review.hit(null, id);
      if (!Review.get(null, id)) delete d.rv[k];     // retired: nothing left to track
    } catch (e) {}
  }

  function finishItem(it, ok, df, paper) {
    var k = it.t.toLowerCase(), st = d.words[k] || [0, 0];
    d.words[k] = ok ? [st[0] + 1, st[1]] : [st[0], st[1] + 1];
    var sent = false;
    if (ok) { S.right++; fromReview(it); sfx('correct'); }
    else {
      try { sent = toReview(it, df, paper && paper.token != null ? paper.token : null); } catch (e) { sent = false; }
      if (sent) S.reviewed++;
    }
    S.results[S.i] = { t: it.t, ok: ok };
    save();
    dots();
    showFeedback(it, ok, df, sent);
  }

  function showFeedback(it, ok, df, sent) {
    S.phase = 'fb';
    var last = S.i + 1 >= S.items.length;
    var h = '';
    var typedShown = S.mode === 'keys' && !ok && E.tidy(S.typed) ? E.tidy(S.typed) : '';
    if (ok) {
      h += '<p class="dk-fb-msg good"><span class="dk-ic">' + A.tick() + '</span>' + esc(message(df || { ok: true })) + '</p>';
      h += '<div class="dk-tiles ok" aria-label="' + esc(it.t) + '">' + tilesHtml(E.diff(it.t, it.t, S.level).cells) + '</div>';
    } else {
      h += '<p class="dk-fb-msg">' + esc(S.mode === 'paper' ? T('¡Bien por revisar! Mira la regla y las letras.', 'Good for checking! Look at the rule and the letters.') : message(df)) + '</p>';
      h += '<div class="dk-tiles" aria-label="' + esc(df.expected) + '">' + tilesHtml(df.cells) + '</div>';
      if (typedShown) h += '<p class="dk-you">' + esc(T('Tú escribiste: ', 'You wrote: ')) + '<span id="dk-you-text"></span></p>';
      h += ruleCardHtml(it, S.mode === 'keys' ? df : null);
      if (sent) h += '<p class="dk-rv">' + esc(T('Esta palabra volverá mañana en tu Repaso.', 'This word will come back tomorrow in your Review.')) + '</p>';
    }
    h += '<div class="dk-fb-actions">';
    if (!ok) h += '<button type="button" class="dk-sm" id="dk-spell"><span class="dk-ic">' + A.speaker() + '</span>' + esc(T('Deletrear', 'Spell it')) + '</button>';
    h += '<button type="button" class="dk-sm" id="dk-again"><span class="dk-ic">' + A.turtle() + '</span>' + esc(T('Escuchar', 'Listen')) + '</button>';
    h += '<button type="button" class="dk-go" id="dk-next">' + esc(last ? T('Terminar', 'Finish') : T('Siguiente', 'Next')) + '</button>';
    h += '</div>';
    $('dk-stage').classList.add('checked');
    $('dk-fb').innerHTML = h;
    if (typedShown) $('dk-you-text').textContent = typedShown;
    var sp = $('dk-spell');
    if (sp) sp.onclick = function() { spell(df ? df.expected.replace(/[¿?¡!.,;:]/g, '') : it.t); };
    $('dk-again').onclick = function() { say(it.t, true); };
    var nx = $('dk-next');
    nx.onclick = function() { if (last) finishRound(); else { S.i++; renderItem(); } };
    try { nx.focus({ preventScroll: true }); nx.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }

  // ── the end of a round ───────────────────────────────────────
  function finishRound() {
    S.phase = 'done';
    stopSpeech();
    var total = S.items.length, n = E.starsFor(S.right, total, S.mode === 'paper');
    var bkey = S.listId + ':' + S.level, prev = d.best[bkey] || 0, better = n > prev;
    if (better) d.best[bkey] = n;
    d.rounds = (d.rounds | 0) + 1;
    save();
    try {
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Dictado', '✍️', (S.lang === 'es' ? 'Spanish' : 'English') + ' dictation (' + listName(S.listId) + ') — ' + S.right + '/' + total + ' right, ' + n + '★');
      }
    } catch (e) {}
    var missed = S.results.filter(function(r) { return r && !r.ok; });
    var title = n === 3 ? T('¡Dictado perfecto!', 'Perfect dictation!') : n === 2 ? T('¡Muy bien!', 'Well done!')
              : n === 1 ? T('¡Buen intento!', 'Good try!') : T('¡Sigue practicando!', 'Keep practising!');
    var h = '<div class="dk-card dk-done">' +
      '<div class="dk-medal">' + A.medal(n) + '</div>' +
      '<h2 class="dk-done-t">' + esc(title) + '</h2>' +
      '<p class="dk-done-s">' + S.right + ' / ' + total + ' ' + esc(T('bien', 'right')) + ' · ' + stars(n) + '</p>' +
      (better && n > 0 ? '<p class="dk-newbest">' + esc(T('¡Nuevo mejor resultado en esta lista!', 'A new best on this list!')) + '</p>' : '') +
      (S.mode === 'paper' && S.right === total ? '<p class="dk-note">' + esc(T('Escribiendo en papel ganas hasta 2 estrellas. Con el teclado puedes ganar 3.', 'Writing on paper earns up to 2 stars. With the keyboard you can earn 3.')) + '</p>' : '');
    if (missed.length) {
      h += '<div class="dk-missed"><h3>' + esc(T('Para practicar', 'To practise')) + '</h3><ul>' +
           missed.map(function(r) { return '<li>' + esc(r.t) + '</li>'; }).join('') + '</ul>' +
           (S.reviewed ? '<p class="dk-rv">' + esc(T('Las palabras difíciles volverán mañana en tu Repaso.', 'The tricky words will come back tomorrow in your Review.')) + '</p>' : '') + '</div>';
    }
    h += '<div class="dk-fb-actions col">' +
         '<button type="button" class="dk-go" id="dk-more">' + esc(T('Otra ronda', 'Another round')) + '</button>' +
         '<button type="button" class="dk-go alt" id="dk-lists">' + esc(T('Elegir otra lista', 'Pick another list')) + '</button>' +
         '<a class="dk-back" href="index.html">' + esc(T('Volver al inicio', 'Back to home')) + '</a></div></div>';
    root().innerHTML = h;
    $('dk-more').onclick = function() { start(S.listId); };
    $('dk-lists').onclick = renderHome;
    if (n >= 1) sfx(n >= 2 ? 'cheer' : 'star');
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  // ── start ────────────────────────────────────────────────────
  function boot() {
    d = load();
    S.lang = defaultLang();
    S.mode = d.mode;
    S.level = d.level || D.levelForAge(USER.age);
    document.documentElement.lang = (typeof getKidLang === 'function' && getKidLang() === 'en') ? 'en' : 'es';
    document.addEventListener('keydown', onKeyDown);
    renderHome();
  }
  function begin() {
    // Another device may have played since this one last synced.
    try {
      var k = key();
      if (k && typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pull) {
        var p = CloudSync.pull(k);
        if (p && p.then) { p.then(boot, boot); return; }
      }
    } catch (e) {}
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin); else begin();

  // A small handle for the tests.
  window.Dictado = {
    state: function() { return S; },
    current: function() { return cur() || null; },
    data: function() { return d; }
  };
})();
