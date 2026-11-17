/* ================================================================
   TYPE QUEST ⌨️ — touch typing (ages 4 and up)

     Letter Hunt  find a key (the youngest start here)
     Lessons      17 key lessons: home row, top row, bottom row,
                  capitals, numbers, signs, and Spanish accents
     Words        real Spanish and English words (a minute for 9+)
     Passages     short texts from Story Explorer, Descubre Chile and
                  Fe Explorador
     Progress     typing rank, speed over time, a heatmap of the keys
                  missed most, and a drill made from them

   A real keyboard is best. On an iPad without one, the app says so
   kindly and offers keys on the screen to learn where everything is.

   Per kid, one JSON blob at zs_typing_<kid> (fields only added):
     { v:1, lay:'us'|'latam', acc:'exact'|'loose', kb:'hw'|'screen'|null, hints:1|0,
       ls:{ lessonId:{ s, w, a, n } },      // stars, best wpm, best accuracy, plays
       ps:{ passageId:{ s, w, a, n } },
       wd:{ es:{ w, a, n }, en:{…} },       // best words-per-minute at 90%+
       hunt:{ s, best, n },
       keys:{ char:[right, slips] },        // heatmap
       runs:[ { d, m, w, a, c, t } ],       // last 60 runs
       rk: rankIndex, last:'YYYY-MM-DD' }
   ================================================================ */

var TypeQuest = (function() {
  'use strict';

  var D = TypeQuestData, E = TypeQuestEngine, A = TypeQuestArt, P = (typeof TypeQuestPassages !== 'undefined' ? TypeQuestPassages : []);
  var PREFIX = 'zs_typing_';
  var MAX_RUNS = 60;
  var WORDS_SECONDS = 60;
  var HUNT_LEN = 10;

  var data = null, user = null, age = 0, tier = 'intermediate';
  var view = 'home', run = null, tick = null;

  // ── Storage ─────────────────────────────────────────────────────
  function key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function load() {
    var k = key(), d = {};
    if (k) { try { d = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { d = {}; } }
    d = obj(d);
    d.ls = obj(d.ls); d.ps = obj(d.ps); d.wd = obj(d.wd); d.hunt = obj(d.hunt); d.keys = obj(d.keys);
    if (!Array.isArray(d.runs)) d.runs = [];
    if (d.lay !== 'us' && d.lay !== 'latam') d.lay = 'us';
    if (d.acc !== 'exact' && d.acc !== 'loose') d.acc = 'exact';
    if (d.kb !== 'hw' && d.kb !== 'screen') d.kb = null;
    d.hints = d.hints === 0 ? 0 : 1;
    d.rk = Math.max(0, d.rk | 0);
    d.v = 1;
    return d;
  }
  function save() {
    var k = key();
    if (!k) return;
    data.last = today();
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) { try { CloudSync.push(k); } catch (e) {} }
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel, r) { return (r || document).querySelector(sel); }
  function $all(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function root() { return document.getElementById('tq-wrap'); }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function bi(es, en) {
    var l = lang();
    return l === 'es' ? esc(es) : l === 'en' ? esc(en) : esc(es) + '<span class="tq-sub">' + esc(en) + '</span>';
  }
  function biP(p) { return bi(p[0], p[1]); }
  function tx(es, en) { return lang() === 'en' ? en : es; }
  function txP(p) { return tx(p[0], p[1]); }
  function log(msg) { if (typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Type Quest', '⌨️', msg); } catch (e) {} } }
  function starCount() { return typeof getAppStars === 'function' ? getAppStars('typing', data) : 0; }
  function stars(n, of) {
    var s = '';
    for (var i = 0; i < (of || 3); i++) s += '<span class="tq-star' + (i < n ? ' on' : '') + '">★</span>';
    return '<span class="tq-stars" aria-label="' + esc(n + ' ' + tx('de', 'of') + ' ' + (of || 3) + ' ' + tx('estrellas', 'stars')) + '">' + s + '</span>';
  }
  function finger(id) { for (var i = 0; i < D.FINGERS.length; i++) if (D.FINGERS[i].id === id) return D.FINGERS[i]; return null; }
  function pct(a) { return Math.round((a || 0) * 100) + '%'; }
  function wpmText(w) { return String(Math.round(w || 0)); }

  var seedBase = null, seedCount = 0;
  try { var sq = new URLSearchParams(location.search).get('seed'); if (sq !== null && /^\d{1,9}$/.test(sq)) seedBase = parseInt(sq, 10); } catch (e) {}
  function nextRnd() { return E.rng(seedBase !== null ? seedBase * 1000 + (seedCount++) : (Math.random() * 4294967296) >>> 0); }

  function isTouchOnly() {
    try {
      var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      var fine = window.matchMedia && window.matchMedia('(any-pointer: fine)').matches;
      return !!coarse && !fine;
    } catch (e) { return false; }
  }
  function screenMode() { return data.kb === 'screen'; }
  function contentLang() { return lang() === 'en' ? 'en' : 'es'; }

  // Lessons a tier sees: the youngest get the home row.
  function lessonList() {
    return D.LESSONS.map(function(l, i) { return { l: l, i: i }; }).filter(function(x) { return tier !== 'beginner' || x.l.grp === 'home'; });
  }
  function lessonStarsOf(id) { var r = data.ls[id]; return r ? Math.max(0, Math.min(3, r.s | 0)) : 0; }
  function unlocked(i) { return i === 0 || lessonStarsOf(D.LESSONS[i - 1].id) > 0 || lessonStarsOf(D.LESSONS[i].id) > 0; }
  function nextLessonIndex() {
    for (var i = 0; i < D.LESSONS.length; i++) if (!lessonStarsOf(D.LESSONS[i].id)) return i;
    return D.LESSONS.length - 1;
  }
  function passagesForTier() {
    var max = tier === 'beginner' ? 0 : tier === 'intermediate' ? 1 : tier === 'advanced' ? 2 : 3;
    return P.filter(function(p) { return p.lvl <= max; });
  }
  var SRC = { story: 'Story Explorer', chile: 'Descubre Chile', faith: 'Fe Explorador' };

  // ── Shell ───────────────────────────────────────────────────────
  var SECTIONS = [
    { id: 'home', icon: 'keyboard', t: ['Inicio', 'Home'] },
    { id: 'lessons', icon: 'lessons', t: ['Lecciones', 'Lessons'] },
    { id: 'words', icon: 'words', t: ['Palabras', 'Words'] },
    { id: 'passages', icon: 'passage', t: ['Textos', 'Passages'] },
    { id: 'stats', icon: 'stats', t: ['Progreso', 'Progress'] }
  ];
  function shell(section, inner) {
    var tabs = SECTIONS.filter(function(s) { return !(tier === 'beginner' && (s.id === 'passages')); }).map(function(s) {
      var on = s.id === section;
      return '<button type="button" class="tq-tab' + (on ? ' on' : '') + '" data-go="' + s.id + '"' + (on ? ' aria-current="page"' : '') + '>' +
        A.icon(s.icon, 30) + '<span class="tq-tab-t">' + biP(s.t) + '</span></button>';
    }).join('');
    return '<header class="tq-head"><button type="button" class="tq-brand" data-go="home" aria-label="' + esc(tx('Type Quest, inicio', 'Type Quest home')) + '">Type Quest</button>' +
      '<span class="tq-total" aria-label="' + esc(tx('Estrellas en Type Quest', 'Stars in Type Quest')) + '">★ <span id="tq-total">' + starCount() + '</span></span></header>' +
      '<nav class="tq-tabs" aria-label="' + esc(tx('Secciones', 'Sections')) + '">' + tabs + '</nav>' +
      '<main class="tq-main" id="tq-main">' + inner + '</main>';
  }
  function render(section, inner, after) {
    stopRun();
    view = section;
    root().innerHTML = shell(section, inner);
    wireGo(root());
    if (after) after(root());
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function wireGo(scope) {
    $all('[data-go]', scope).forEach(function(b) {
      if (b._tqWired) return;
      b._tqWired = true;
      b.addEventListener('click', function() { sfx('click'); go(b.getAttribute('data-go'), b.getAttribute('data-arg')); });
    });
  }
  function go(where, arg) {
    switch (where) {
      case 'lessons': return viewLessons();
      case 'lesson': return startLesson(+arg);
      case 'words': return viewWords();
      case 'wordrun': return startWords(arg);
      case 'passages': return viewPassages(arg);
      case 'passage': return startPassage(arg);
      case 'hunt': return startHunt();
      case 'focus': return startFocus();
      case 'stats': return viewStats();
      case 'settings': return viewSettings();
    }
    return viewHome();
  }

  // ── Keyboard check ──────────────────────────────────────────────
  function kbBanner() {
    if (data.kb === 'hw' || (!data.kb && !isTouchOnly())) return '';
    if (data.kb === 'screen') {
      return '<div class="tq-kbnote" id="tq-kbnote"><div class="tq-kbnote-ic">' + A.icon('keyboard', 44) + '</div><div>' +
        '<p><b>' + bi('Estás usando las teclas de la pantalla.', 'You are using the keys on the screen.') + '</b></p>' +
        '<p>' + bi('Si conectas un teclado, presiona cualquier tecla y lo usaremos.', 'If you connect a keyboard, press any key and we will use it.') + '</p></div></div>';
    }
    return '<div class="tq-kbnote ask" id="tq-kbnote" role="region" aria-label="' + esc(tx('Revisar el teclado', 'Keyboard check')) + '"><div class="tq-kbnote-ic">' + A.icon('keyboard', 44) + '</div><div>' +
      '<p><b>' + bi('¿Tienes un teclado conectado?', 'Do you have a keyboard connected?') + '</b></p>' +
      '<p>' + bi('Para escribir con los diez dedos se necesita un teclado de verdad. Si tienes uno, presiona cualquier tecla.',
        'Typing with all ten fingers needs a real keyboard. If you have one, press any key on it.') + '</p>' +
      '<p class="tq-muted">' + bi('Sin teclado también puedes aprender dónde está cada tecla, con las teclas en la pantalla.',
        'No keyboard? You can still learn where every key lives, with keys on the screen.') + '</p>' +
      '<button type="button" class="tq-btn tq-btn-ghost" id="tq-use-screen">' + bi('Usar las teclas de la pantalla', 'Use the keys on the screen') + '</button></div></div>';
  }
  function foundKeyboard() {
    if (data.kb === 'hw') return;
    var quiet = data.kb === null && !isTouchOnly();
    data.kb = 'hw';
    save();
    if (!quiet) toast(tx('¡Teclado encontrado! ⌨️', 'Keyboard found! ⌨️'));
    var n = $('#tq-kbnote'); if (n) n.parentNode.removeChild(n);
    if (run && run.active && run.pad) { run.pad = false; drawBoard(); focusSink(); }
  }
  function detectLayout(e) {
    if (e.code === 'Semicolon' && (e.key === 'ñ' || e.key === 'Ñ') && data.lay !== 'latam') { data.lay = 'latam'; save(); toast(tx('Teclado en español detectado', 'Spanish keyboard detected')); if (run) drawBoard(); }
    else if (e.code === 'Semicolon' && (e.key === ';' || e.key === ':') && data.lay !== 'us') { data.lay = 'us'; save(); toast(tx('Teclado de EE. UU. detectado', 'US keyboard detected')); if (run) drawBoard(); }
  }
  function toast(msg) {
    var t = document.getElementById('tq-toast');
    if (!t) { t = document.createElement('div'); t.id = 'tq-toast'; t.className = 'tq-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(function() { t.classList.remove('on'); }, 2200);
  }

  // ── Home ────────────────────────────────────────────────────────
  function viewHome() {
    var rk = D.RANKS[data.rk], ni = nextLessonIndex(), nl = D.LESSONS[ni];
    var cards = [];
    if (tier === 'beginner' || tier === 'intermediate') cards.push(card('hunt', 'hunt', ['Busca la tecla', 'Letter Hunt'], ['Encuentra cada letra en el teclado.', 'Find each letter on the keyboard.'], data.hunt.s ? stars(data.hunt.s) : ''));
    cards.push(card('lesson', 'lessons', ['Siguiente lección', 'Next lesson'], nl.t, stars(lessonStarsOf(nl.id)), ni));
    cards.push(card('words', 'words', ['Palabras', 'Words'], ['Palabras de verdad, en español e inglés.', 'Real words, in Spanish and English.'], ''));
    if (tier !== 'beginner') cards.push(card('passages', 'passage', ['Textos', 'Passages'], ['Historias de Chile, de la fe y de Story Explorer.', 'Stories from Chile, the faith and Story Explorer.'], ''));
    cards.push(card('stats', 'stats', ['Mi progreso', 'My progress'], ['Velocidad, rango y las teclas para practicar.', 'Speed, rank and the keys to practise.'], ''));
    var inner = kbBanner() +
      '<section class="tq-hero">' + A.keyboard({ layout: data.lay, zones: true, label: tx('Teclado con los colores de cada dedo', 'Keyboard coloured by the finger for each key') }) +
        '<div class="tq-hero-rank">' + A.medal(data.rk, 56) + '<div><div class="tq-muted small">' + bi('Tu rango', 'Your rank') + '</div><div class="tq-rank-name">' + esc(tx(rk.es, rk.en)) + '</div></div></div>' +
      '</section>' +
      '<p class="tq-lead">' + bi('Cada color es un dedo. Pon los índices en F y J: tienen una rayita que se siente.', 'Each colour is a finger. Rest your pointer fingers on F and J: they have a bump you can feel.') + '</p>' +
      '<div class="tq-cards">' + cards.join('') + '</div>' +
      '<div class="tq-row-end"><button type="button" class="tq-btn tq-btn-ghost" data-go="settings">⚙️ ' + bi('Teclado y ajustes', 'Keyboard and settings') + '</button></div>';
    render('home', inner, function(r) {
      var b = $('#tq-use-screen', r);
      if (b) b.addEventListener('click', function() { data.kb = 'screen'; save(); sfx('click'); viewHome(); });
    });
  }
  function card(go, icon, title, desc, extra, arg) {
    return '<button type="button" class="tq-card" data-go="' + go + '"' + (arg !== undefined ? ' data-arg="' + arg + '"' : '') + '>' +
      '<span class="tq-card-ic">' + A.icon(icon, 52) + '</span><span class="tq-card-body"><span class="tq-card-t">' + biP(title) + '</span>' +
      '<span class="tq-card-d">' + biP(desc) + '</span></span>' + (extra ? '<span class="tq-card-x">' + extra + '</span>' : '') + '</button>';
  }

  // ── Settings ────────────────────────────────────────────────────
  function viewSettings() {
    function opt(name, val, cur, label) {
      return '<button type="button" class="tq-chip' + (val === cur ? ' on' : '') + '" data-set="' + name + '" data-val="' + val + '" aria-pressed="' + (val === cur) + '">' + label + '</button>';
    }
    var kbNow = data.kb || (isTouchOnly() ? 'screen' : 'hw');
    var inner = '<h1 class="tq-h1">' + bi('Teclado y ajustes', 'Keyboard and settings') + '</h1>' +
      '<section class="tq-panel"><h2 class="tq-h2">' + bi('Mi teclado', 'My keyboard') + '</h2><div class="tq-chips">' +
        opt('lay', 'us', data.lay, bi('EE. UU. (inglés)', 'US (English)')) + opt('lay', 'latam', data.lay, bi('Latinoamérica (con ñ)', 'Latin America (with ñ)')) + '</div>' +
        '<p class="tq-muted">' + bi('Si tu teclado tiene la tecla Ñ, elige Latinoamérica. Lo detectamos solo cuando presionas esa tecla.', 'If your keyboard has an Ñ key, choose Latin America. We notice it by ourselves when you press that key.') + '</p>' +
        '<div class="tq-mini">' + A.keyboard({ layout: data.lay, zones: true, label: txP(D.LAYOUTS[data.lay].name) }) + '</div>' +
      '</section>' +
      '<section class="tq-panel"><h2 class="tq-h2">' + bi('Escribir con', 'Type with') + '</h2><div class="tq-chips">' +
        opt('kb', 'hw', kbNow, bi('Un teclado de verdad', 'A real keyboard')) + opt('kb', 'screen', kbNow, bi('Las teclas de la pantalla', 'The keys on the screen')) + '</div></section>' +
      '<section class="tq-panel"><h2 class="tq-h2">' + bi('Tildes y ñ', 'Accents and ñ') + '</h2><div class="tq-chips">' +
        opt('acc', 'exact', data.acc, bi('Exactas', 'Exact')) + opt('acc', 'loose', data.acc, bi('Sin tildes (á vale como a)', 'Relaxed (a counts for á)')) + '</div>' +
        '<div class="tq-howto"><h3 class="tq-h3">' + bi('Cómo escribir á, ñ, ¿ y ¡', 'How to type á, ñ, ¿ and ¡') + '</h3>' + accentHowTo() + '</div></section>' +
      '<section class="tq-panel"><h2 class="tq-h2">' + bi('Ayudas', 'Hints') + '</h2><div class="tq-chips">' +
        opt('hints', '1', String(data.hints), bi('Mostrar el teclado y las manos', 'Show the keyboard and hands')) + opt('hints', '0', String(data.hints), bi('Sin ayuda (sin mirar)', 'No help (no peeking)')) + '</div></section>' +
      '<div class="tq-row-end"><button type="button" class="tq-btn" data-go="home">' + bi('Listo', 'Done') + '</button></div>';
    render('home', inner, function(r) {
      $all('[data-set]', r).forEach(function(b) {
        b.addEventListener('click', function() {
          var n = b.getAttribute('data-set'), v = b.getAttribute('data-val');
          data[n] = n === 'hints' ? +v : v;
          save(); sfx('click'); viewSettings();
        });
      });
    });
  }
  function accentHowTo() {
    if (data.lay === 'latam') {
      return '<ul class="tq-list"><li>' + bi('á é í ó ú: presiona ´ (al lado de la P), suéltala y luego la vocal.', 'á é í ó ú: press ´ (next to P), let go, then the vowel.') + '</li>' +
        '<li>' + bi('ñ tiene su propia tecla, al lado de la L.', 'ñ has its own key, next to L.') + '</li>' +
        '<li>' + bi('¿ y ¡ están en la tecla al lado del 0 (¡ con Shift).', '¿ and ¡ are on the key after 0 (¡ with Shift).') + '</li></ul>';
    }
    return '<ul class="tq-list"><li>' + bi('En iPad y Mac: ⌥ Option + E, suelta, y luego la vocal → á.', 'On iPad and Mac: ⌥ Option + E, let go, then the vowel → á.') + '</li>' +
      '<li>' + bi('⌥ Option + N, suelta, y luego N → ñ.', '⌥ Option + N, let go, then N → ñ.') + '</li>' +
      '<li>' + bi('¿ = ⌥ Option + Shift + ?    ¡ = ⌥ Option + 1', '¿ = ⌥ Option + Shift + ?    ¡ = ⌥ Option + 1') + '</li>' +
      '<li class="tq-muted">' + bi('En otros computadores puede no funcionar; entonces elige "Sin tildes".', 'On other computers this may not work; then choose "Relaxed".') + '</li></ul>';
  }

  // ── Lessons map ─────────────────────────────────────────────────
  function viewLessons() {
    var list = lessonList(), html = '';
    D.GROUPS.forEach(function(g) {
      var items = list.filter(function(x) { return x.l.grp === g.id; });
      if (!items.length) return;
      html += '<section class="tq-group"><h2 class="tq-h2">' + biP(g.t) + '</h2><div class="tq-lessons">';
      items.forEach(function(x) {
        var open = unlocked(x.i), s = lessonStarsOf(x.l.id), rec = data.ls[x.l.id];
        var ch = E.lessonChars(x.i, data.lay).fresh.slice(0, 8);
        html += '<button type="button" class="tq-lesson' + (open ? '' : ' locked') + (s ? ' done' : '') + '"' + (open ? ' data-go="lesson" data-arg="' + x.i + '"' : ' disabled aria-disabled="true"') +
          ' aria-label="' + esc((x.i + 1) + '. ' + txP(x.l.t) + (open ? '' : ' — ' + tx('bloqueada', 'locked'))) + '">' +
          '<span class="tq-lesson-n">' + (x.i + 1) + '</span>' +
          '<span class="tq-lesson-keys">' + (open ? ch.map(function(c) { return '<kbd>' + esc(c === ' ' ? '␣' : c) + '</kbd>'; }).join('') : A.icon('lock', 28)) + '</span>' +
          '<span class="tq-lesson-t">' + biP(x.l.t) + '</span>' +
          '<span class="tq-lesson-s">' + stars(s) + (rec && rec.w ? '<small>' + wpmText(rec.w) + ' ' + tx('ppm', 'wpm') + '</small>' : '') + '</span></button>';
      });
      html += '</div></section>';
    });
    var goal = D.GOALS[tier];
    render('lessons', '<h1 class="tq-h1">' + bi('Lecciones', 'Lessons') + '</h1>' +
      '<p class="tq-lead">' + bi('★ 80% bien · ★★ 90% · ★★★ 95% y ' + goal + ' palabras por minuto.', '★ 80% right · ★★ 90% · ★★★ 95% and ' + goal + ' words per minute.') + '</p>' + html);
  }

  // ── Words and passages lists ────────────────────────────────────
  function viewWords() {
    var timed = tier === 'advanced' || tier === 'expert';
    function wcard(l, name) {
      var r = data.wd[l] || {};
      return '<button type="button" class="tq-card" data-go="wordrun" data-arg="' + l + '"><span class="tq-card-ic">' + A.icon('words', 52) + '</span>' +
        '<span class="tq-card-body"><span class="tq-card-t">' + name + '</span><span class="tq-card-d">' +
        (timed ? bi('Un minuto: ¿cuántas alcanzas?', 'One minute: how many can you type?') : bi('Diez palabras cortas.', 'Ten short words.')) + '</span></span>' +
        '<span class="tq-card-x">' + (r.w ? '<b>' + wpmText(r.w) + '</b> ' + tx('ppm', 'wpm') : '') + '</span></button>';
    }
    render('words', '<h1 class="tq-h1">' + bi('Palabras', 'Words') + '</h1>' +
      '<p class="tq-lead">' + bi('Palabras que se usan todos los días. Tu mejor marca cuenta con 90% bien o más.', 'Everyday words. Your best counts at 90% right or better.') + '</p>' +
      '<div class="tq-cards">' + wcard('es', 'Español') + wcard('en', 'English') + '</div>');
  }

  function viewPassages(l) {
    l = l === 'en' || l === 'es' ? l : contentLang();
    var list = passagesForTier().filter(function(p) { return p.lang === l; });
    var tabs = '<div class="tq-chips" role="group" aria-label="' + esc(tx('Idioma', 'Language')) + '">' +
      ['es', 'en'].map(function(x) { return '<button type="button" class="tq-chip' + (x === l ? ' on' : '') + '" data-go="passages" data-arg="' + x + '" aria-pressed="' + (x === l) + '">' + (x === 'es' ? 'Español' : 'English') + '</button>'; }).join('') + '</div>';
    var body = list.length ? '<div class="tq-passages">' + list.map(function(p) {
      var r = data.ps[p.id] || {};
      return '<button type="button" class="tq-passage" data-go="passage" data-arg="' + esc(p.id) + '">' +
        '<span class="tq-passage-src src-' + esc(p.src) + '">' + esc(SRC[p.src] || p.src) + '</span>' +
        '<span class="tq-passage-t">' + esc(p.title) + '</span>' +
        '<span class="tq-passage-p">' + esc(p.text.slice(0, 70)) + '…</span>' +
        '<span class="tq-passage-s">' + stars(Math.min(3, r.s | 0)) + '<small>' + p.text.length + ' ' + tx('letras', 'characters') + '</small></span></button>';
    }).join('') + '</div>' : '<p class="tq-lead">' + bi('Los textos llegan cuando seas un poco más grande. ¡Practica las lecciones!', 'Passages come when you are a little older. Practise the lessons!') + '</p>';
    render('passages', '<h1 class="tq-h1">' + bi('Textos', 'Passages') + '</h1>' +
      '<p class="tq-lead">' + bi('Párrafos de Story Explorer, Descubre Chile y Fe Explorador.', 'Paragraphs from Story Explorer, Descubre Chile and Fe Explorador.') + '</p>' + tabs + body);
  }

  // ── Runs ────────────────────────────────────────────────────────
  function startLesson(i) {
    if (!(i >= 0 && i < D.LESSONS.length)) i = 0;
    if (!unlocked(i)) return viewLessons();
    var L = D.LESSONS[i];
    var text = E.makeDrill(i, data.lay, L.spanish ? 'es' : contentLang(), tier, nextRnd());
    begin({ mode: 'lesson', id: L.id, index: i, text: text, title: biP(L.t), back: 'lessons', intro: lessonIntro(i) });
  }
  function lessonIntro(i) {
    var fresh = E.lessonChars(i, data.lay).fresh.slice(0, 10);
    var parts = fresh.map(function(c) {
      var st = D.stepsFor(c, data.lay), f = st ? finger(D.FINGER_OF[st[st.length - 1].code]) : null;
      return '<span class="tq-intro-k"><kbd>' + esc(c) + '</kbd> ' + (f ? '<span class="tq-dot" style="background:' + f.color + '"></span>' + esc(tx(f.es, f.en)) : '') + '</span>';
    });
    return parts.join('');
  }
  function startWords(l) {
    l = l === 'en' ? 'en' : 'es';
    var timed = tier === 'advanced' || tier === 'expert';
    var text = E.makeWords(l, tier, nextRnd(), timed ? 90 : (tier === 'beginner' ? 6 : 10));
    begin({ mode: 'words', id: l, text: text, title: bi('Palabras', 'Words') + ' · ' + (l === 'es' ? 'Español' : 'English'), back: 'words', limit: timed ? WORDS_SECONDS : 0 });
  }
  function startPassage(id) {
    var p = null;
    P.forEach(function(x) { if (x.id === id) p = x; });
    if (!p) return viewPassages();
    begin({ mode: 'passage', id: p.id, text: p.text, title: esc(p.title), back: 'passages', backArg: p.lang, src: SRC[p.src] });
  }
  function startFocus() {
    var weak = E.weakest(data.keys, 5).map(function(w) { return w.ch; });
    var text = E.makeFocus(weak, data.lay, contentLang(), tier, nextRnd());
    begin({ mode: 'focus', id: 'focus', text: text, title: bi('Mis teclas difíciles', 'My tricky keys'), back: 'stats' });
  }
  function startHunt() {
    var rnd = nextRnd(), pool = 'fjdkslaghrueiwotyqpcmvnbxz'.split('');
    if (tier === 'beginner') pool = 'fjdkslagh'.split('');
    var seq = [];
    while (seq.length < HUNT_LEN) { var c = pool[Math.floor(rnd() * pool.length)]; if (c !== seq[seq.length - 1]) seq.push(c); }
    begin({ mode: 'hunt', id: 'hunt', text: seq.join(''), title: bi('Busca la tecla', 'Letter Hunt'), back: 'home', hunt: true });
  }

  function begin(cfg) {
    stopRun();
    run = cfg;
    run.session = new E.Session(cfg.text, { loose: data.acc === 'loose' });
    run.pad = screenMode() || (data.kb === null && isTouchOnly());
    run.shift = false; run.dead = null;
    var showStats = tier !== 'beginner' && !cfg.hunt;
    var inner = '<div class="tq-runhead"><button type="button" class="tq-back" data-go="' + cfg.back + '"' + (cfg.backArg ? ' data-arg="' + cfg.backArg + '"' : '') + ' aria-label="' + esc(tx('Volver', 'Back')) + '">←</button>' +
      '<div><h1 class="tq-h1 small">' + cfg.title + '</h1>' + (cfg.src ? '<div class="tq-muted small">' + esc(tx('De ', 'From ') + cfg.src) + '</div>' : '') + '</div></div>' +
      (cfg.intro ? '<div class="tq-intro">' + cfg.intro + '</div>' : '') +
      (showStats ? '<div class="tq-live" aria-hidden="true"><span><b id="tq-wpm">0</b> ' + tx('ppm', 'wpm') + '</span><span><b id="tq-acc">100%</b> ' + tx('bien', 'right') + '</span>' +
        (cfg.limit ? '<span class="tq-clock"><b id="tq-time">' + cfg.limit + '</b> s</span>' : '<span><b id="tq-prog">0%</b> ' + tx('hecho', 'done') + '</span>') + '</div>' : '') +
      (cfg.hunt ? '<div class="tq-hunt" id="tq-hunt" aria-live="polite"></div>' : '<div class="tq-text' + (cfg.mode === 'passage' ? ' long' : '') + '" id="tq-text" aria-live="off"></div>') +
      '<p class="tq-hint" id="tq-hint" aria-live="polite"></p>' +
      '<div class="tq-tapstart" id="tq-tap" hidden><button type="button" class="tq-btn">' + bi('Toca aquí y escribe', 'Tap here and type') + '</button></div>' +
      '<div class="tq-board" id="tq-board"></div>' +
      '<textarea id="tq-sink" class="tq-sink" aria-label="' + esc(tx('Escribe aquí', 'Type here')) + '" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" inputmode="none"></textarea>';
    render(cfg.mode === 'lesson' ? 'lessons' : cfg.mode === 'words' ? 'words' : cfg.mode === 'passage' ? 'passages' : cfg.mode === 'focus' ? 'stats' : 'home', inner, function(r) {
      var tap = $('#tq-tap', r);
      tap.querySelector('button').addEventListener('click', focusSink);
      var area = $('#tq-text', r) || $('#tq-hunt', r);
      area.addEventListener('click', focusSink);
    });
    view = 'run';
    run.active = true;
    drawText(); drawBoard();
    if (!run.pad) focusSink();
    if (cfg.hunt) sayHunt();
    if (cfg.limit || tier !== 'beginner') tick = setInterval(updateLive, 250);
  }
  function stopRun() {
    if (tick) { clearInterval(tick); tick = null; }
    if (run) run.active = false;
  }
  function focusSink() {
    var s = $('#tq-sink');
    if (!s) return;
    s.setAttribute('inputmode', 'none');
    try { s.focus({ preventScroll: true }); } catch (e) { s.focus(); }
    var tap = $('#tq-tap'); if (tap) tap.hidden = true;
  }

  // The text, with what is done in green, the next letter lit and slips marked.
  function drawText() {
    var S = run.session;
    if (run.hunt) {
      var el = $('#tq-hunt');
      var c = S.expected() || '';
      el.innerHTML = '<div class="tq-hunt-big' + (S.slips[S.pos] ? ' slip' : '') + '">' + esc(c.toUpperCase()) + '</div>' +
        '<div class="tq-hunt-prog">' + S.text.split('').map(function(x, i) { return '<span class="' + (i < S.pos ? 'done' : i === S.pos ? 'now' : '') + '"></span>'; }).join('') + '</div>';
      updateHint();
      return;
    }
    var t = S.text, html = '', pos = S.pos;
    // whole words stay together so lines wrap between words
    var words = t.split(/( )/), at = 0;
    words.forEach(function(w) {
      if (w === '') return;
      var cls = w === ' ' ? 'tq-sp' : 'tq-w';
      html += '<span class="' + cls + '">';
      for (var i = 0; i < w.length; i++, at++) {
        var k = at < pos ? 'd' : at === pos ? 'c' : 't';
        if (S.slips[at]) k += ' x';
        html += '<span class="' + k + '">' + esc(w[i]) + '</span>';
      }
      html += '</span>';
    });
    var box = $('#tq-text');
    box.innerHTML = html;
    var cur = $('.c', box);
    if (cur && box.scrollHeight > box.clientHeight) {
      var top = cur.offsetTop - box.offsetTop;
      if (top > box.scrollTop + box.clientHeight - 60 || top < box.scrollTop) box.scrollTop = Math.max(0, top - 40);
    }
    updateHint();
  }

  function nextSteps() {
    var c = run.session.expected();
    if (c === undefined) return [];
    return D.stepsFor(c, data.lay) || [];
  }
  function fingersFor(steps) {
    var out = [];
    steps.forEach(function(s, i) {
      if (i > 0) return;
      var f = D.FINGER_OF[s.code];
      if (f) out.push(f);
      if (s.shift) out.push(f && f.charAt(0) === 'l' ? 'rp' : 'lp');
    });
    return out;
  }
  function updateHint() {
    var el = $('#tq-hint');
    if (!el) return;
    var c = run.session.expected();
    if (c === undefined) { el.textContent = ''; return; }
    var steps = nextSteps(), f = steps.length ? finger(D.FINGER_OF[steps[0].code]) : null;
    var show = data.hints || run.hunt || tier === 'beginner';
    if (!show && !run.session.slips[run.session.pos]) { el.innerHTML = ''; return; }
    var name = c === ' ' ? tx('espacio', 'space') : c;
    var h = '<kbd>' + esc(name) + '</kbd> ';
    if (steps.length > 1) {
      var first = steps[0], k = D.LAYOUTS[data.lay].keys[first.code];
      var press = first.alt ? '⌥ Option + ' + (k.base || '').toUpperCase() : (k.base || '');
      h += bi('primero ' + press + ', suelta, y luego ' + (D.LAYOUTS[data.lay].keys[steps[1].code].base || '').toUpperCase(),
        'first ' + press + ', let go, then ' + (D.LAYOUTS[data.lay].keys[steps[1].code].base || '').toUpperCase());
    } else if (f) {
      h += '<span class="tq-dot" style="background:' + f.color + '"></span>' + esc(tx('con el ' + f.es, 'with your ' + f.en));
      if (steps[0].shift) { var sf = finger(f.hand === 'l' ? 'rp' : 'lp'); h += ' + Shift (' + esc(tx(sf.es, sf.en)) + ')' + (steps[0].alt ? ' + ⌥' : ''); }
      else if (steps[0].alt) h += ' + ⌥ Option';
    } else if (!steps.length) {
      h += bi('(no está en este teclado: elige "Sin tildes" en ajustes)', '(not on this keyboard: choose "Relaxed" in settings)');
    }
    el.innerHTML = h;
  }

  // Keyboard picture (real keyboard) or the keys on the screen.
  function drawBoard() {
    var host = $('#tq-board');
    if (!host || !run) return;
    var steps = nextSteps();
    if (run.pad) { drawPad(host, steps); return; }
    var show = data.hints || run.hunt || tier === 'beginner' || run.session.slips[run.session.pos];
    if (!show) { host.innerHTML = ''; return; }
    host.innerHTML = '<div class="tq-kbwrap">' + A.keyboard({ layout: data.lay, zones: true, next: steps, label: tx('Teclado: la tecla que sigue está marcada', 'Keyboard: the next key is marked') }) + '</div>' +
      (tier !== 'expert' ? '<div class="tq-handswrap">' + A.hands({ active: fingersFor(steps), label: tx('Manos: el dedo que sigue está marcado', 'Hands: the next finger is marked') }) + '</div>' : '');
  }

  // The on-screen keys: one board on a wide screen, a board per hand on a phone.
  function drawPad(host, steps) {
    var L = D.LAYOUTS[data.lay], want = steps[0] || null, text = run.session.text;
    var needNums = /[0-9!"#$%&\/()=@^*]/.test(text) || (data.lay === 'latam' && /[¿¡']/.test(text));
    var needExtra = data.lay === 'us' && /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(text);
    var rows = [[], [], [], [], []];
    L.list.forEach(function(k) {
      if (k.row === 0 && !needNums) return;
      if (!k.base && !/^Shift/.test(k.code)) return;
      // letters and space always; other keys only when this text uses them
      if (k.base && !/^[a-zñ ]$/.test(k.base) && text.indexOf(k.base) < 0 && text.indexOf(k.shift) < 0 && !(k.dead && /[áéíóúÁÉÍÓÚ]/.test(text))) return;
      rows[k.row].push(k);
    });
    function btn(k) {
      var f = finger(k.finger), label, aria;
      if (/^Shift/.test(k.code)) { label = '⇧'; aria = 'Shift'; }
      else if (k.code === 'Space') { label = tx('espacio', 'space'); aria = label; }
      else { label = run.shift && k.shift ? k.shift : (/^[a-zñ]$/.test(k.base) ? (run.shift ? k.base.toUpperCase() : k.base) : k.base); aria = label; }
      var isNext = want && want.code === k.code, isShiftNext = want && want.shift && /^Shift/.test(k.code) && ((D.FINGER_OF[want.code] || 'l').charAt(0) === 'l' ? k.code === 'ShiftRight' : k.code === 'ShiftLeft');
      var on = (/^Shift/.test(k.code) && run.shift) || (k.dead && run.dead);
      return '<button type="button" class="tq-pk' + (isNext ? ' next' : '') + (isShiftNext ? ' next-shift' : '') + (on ? ' held' : '') + (k.code === 'Space' ? ' space' : '') + '" data-code="' + k.code + '"' +
        ' style="--fc:' + (f ? f.color : '#e5e7eb') + ';--fi:' + (f ? f.ink : '#374151') + ';flex-grow:' + (k.code === 'Space' ? 6 : /^Shift/.test(k.code) ? 1.6 : 1) + '"' +
        ' aria-label="' + esc(aria) + '"' + (on ? ' aria-pressed="true"' : '') + '>' + esc(label) + '</button>';
    }
    function board(filter, cls) {
      return '<div class="tq-pad ' + cls + '">' + rows.map(function(r) {
        var ks = r.filter(filter);
        return ks.length ? '<div class="tq-pad-row">' + ks.map(btn).join('') + '</div>' : '';
      }).join('') + '</div>';
    }
    var extra = '';
    if (needExtra) {
      extra = '<div class="tq-pad-row extra">' + [['´', 'acc'], ['ñ', 'n'], ['¿', 'q'], ['¡', 'e']].map(function(x) {
        var isNext = want && ((x[0] === '´' && want.dead && want.code === 'KeyE') || (x[0] === 'ñ' && want.code === 'KeyN' && want.dead) || (want.alt && !want.dead && ((x[0] === '¿' && want.code === 'Slash') || (x[0] === '¡' && want.code === 'Digit1'))));
        return '<button type="button" class="tq-pk' + (isNext ? ' next' : '') + (x[0] === '´' && run.dead ? ' held' : '') + '" data-extra="' + esc(x[0]) + '" style="--fc:#FCA5A5;--fi:#991B1B" aria-label="' + esc(x[0]) + '">' + esc(x[0]) + '</button>';
      }).join('') + '</div>';
    }
    var wide = (root().clientWidth || window.innerWidth) >= 680;
    var spaceRow = function(k) { return k.code === 'Space'; };
    if (wide) host.innerHTML = '<div class="tq-padwrap">' + board(function() { return true; }, 'full') + extra + '</div>';
    else {
      host.innerHTML = '<div class="tq-padwrap split">' +
        '<div class="tq-pad-label">' + bi('Mano izquierda', 'Left hand') + '</div>' + board(function(k) { return k.code !== 'Space' && (finger(k.finger) || {}).hand === 'l'; }, 'half') +
        '<div class="tq-pad-label">' + bi('Mano derecha', 'Right hand') + '</div>' + board(function(k) { return k.code !== 'Space' && (finger(k.finger) || {}).hand === 'r'; }, 'half') +
        board(spaceRow, 'half') + extra + '</div>';
    }
    $all('[data-code]', host).forEach(function(b) {
      b.addEventListener('pointerdown', function(e) { e.preventDefault(); padPress(b.getAttribute('data-code')); });
      b.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); padPress(b.getAttribute('data-code')); } });
    });
    $all('[data-extra]', host).forEach(function(b) {
      b.addEventListener('pointerdown', function(e) { e.preventDefault(); padExtra(b.getAttribute('data-extra')); });
    });
  }
  var COMPOSE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' };
  function padPress(code) {
    var k = D.LAYOUTS[data.lay].keys[code];
    if (!k || !run || !run.active) return;
    if (/^Shift/.test(code)) { run.shift = !run.shift; drawBoard(); return; }
    if (k.dead) { run.dead = run.dead ? null : '´'; drawBoard(); return; }
    var ch = run.shift ? k.shift : k.base;
    run.shift = false;
    if (run.dead) { ch = COMPOSE[ch] || ch; run.dead = null; }
    feed(ch);
  }
  function padExtra(x) {
    if (!run || !run.active) return;
    if (x === '´') { run.dead = run.dead ? null : '´'; drawBoard(); return; }
    var ch = x === 'ñ' && run.shift ? 'Ñ' : x;
    run.shift = false; run.dead = null;
    feed(ch);
  }

  // One character typed, from any source.
  function feed(ch) {
    if (!run || !run.active) return;
    if (run.limit && run.session.t0 !== null && run.session.elapsed() >= run.limit * 1000) return finish();
    var r = run.session.type(ch);
    if (!r.ok) {
      sfx('wrong');
      var cur = $('#tq-text .c') || $('.tq-hunt-big');
      if (cur) { cur.classList.remove('shake'); void cur.offsetWidth; cur.classList.add('shake'); }
    } else if (run.hunt) { sfx('correct'); }
    drawText(); drawBoard(); updateLive();
    if (run.hunt && r.ok && !r.done) sayHunt();
    if (r.done) finish();
  }
  function sayHunt() {
    var c = run.session.expected();
    if (c && typeof ZsSpeak !== 'undefined' && ZsSpeak.say) { try { ZsSpeak.say(c.toUpperCase(), contentLang()); } catch (e) {} }
  }
  function updateLive() {
    if (!run || !run.active) return;
    var S = run.session, res = S.result();
    var w = $('#tq-wpm'), a = $('#tq-acc'), t = $('#tq-time'), p = $('#tq-prog');
    if (w) w.textContent = S.t0 === null ? '0' : wpmText(res.wpm);
    if (a) a.textContent = S.pos + S.errors ? pct(res.acc) : '100%';
    if (p) p.textContent = Math.round(S.pos / S.text.length * 100) + '%';
    if (t && run.limit) {
      var left = S.t0 === null ? run.limit : Math.max(0, Math.ceil(run.limit - S.elapsed() / 1000));
      t.textContent = left;
      if (left <= 0 && S.t0 !== null) finish();
    }
  }

  // ── Finish and save ─────────────────────────────────────────────
  function finish() {
    if (!run || !run.active) return;
    var cfg = run, S = run.session;
    stopRun();
    var res = S.result(cfg.limit && !S.done() ? S.t0 + cfg.limit * 1000 : undefined);
    var prevStars = starCount(), prevRank = data.rk, earned = 0, best = false;
    data.keys = E.mergeKeys(data.keys, res.keys);
    if (cfg.mode !== 'hunt') {
      data.runs.push({ d: today(), m: cfg.mode, w: res.wpm, a: res.acc, c: res.chars, t: res.secs });
      if (data.runs.length > MAX_RUNS) data.runs = data.runs.slice(-MAX_RUNS);
    }
    if (cfg.mode === 'lesson') {
      var r = data.ls[cfg.id] || (data.ls[cfg.id] = { s: 0, w: 0, a: 0, n: 0 });
      earned = E.lessonStars(res.wpm, res.acc, tier);
      r.n = (r.n | 0) + 1;
      if (earned > (r.s | 0)) r.s = earned;
      if (res.wpm > (r.w || 0) && res.acc >= 0.8) { r.w = res.wpm; best = true; }
      if (res.acc > (r.a || 0)) r.a = res.acc;
    } else if (cfg.mode === 'passage') {
      var q = data.ps[cfg.id] || (data.ps[cfg.id] = { s: 0, w: 0, a: 0, n: 0 });
      earned = S.done() ? E.passageStars(res.acc) : 0;
      q.n = (q.n | 0) + 1;
      if (earned > (q.s | 0)) q.s = earned;
      if (res.wpm > (q.w || 0) && res.acc >= 0.85) { q.w = res.wpm; best = true; }
      if (res.acc > (q.a || 0)) q.a = res.acc;
    } else if (cfg.mode === 'words') {
      var w = data.wd[cfg.id] || (data.wd[cfg.id] = { w: 0, a: 0, n: 0 });
      w.n = (w.n | 0) + 1;
      if (res.acc >= 0.9 && res.wpm > (w.w || 0)) { w.w = res.wpm; w.a = res.acc; best = true; }
    } else if (cfg.mode === 'hunt') {
      var right = S.text.length, slipsAt = Object.keys(S.slips).length, clean = right - slipsAt;
      earned = clean >= HUNT_LEN ? 3 : clean >= 8 ? 2 : clean >= 5 ? 1 : 0;
      data.hunt.n = (data.hunt.n | 0) + 1;
      if (earned > (data.hunt.s | 0)) data.hunt.s = earned;
      if (clean > (data.hunt.best | 0)) data.hunt.best = clean;
      res.clean = clean;
    }
    data.rk = E.rankIndex(data.runs, data.rk);
    save();
    var gained = starCount() - prevStars;
    if (gained > 0) sfx('star'); else sfx(earned || cfg.mode === 'words' ? 'correct' : 'click');
    log((cfg.mode === 'hunt' ? 'Letter Hunt ' + res.clean + '/' + HUNT_LEN : cfg.mode + ' ' + cfg.id + ': ' + wpmText(res.wpm) + ' wpm, ' + pct(res.acc)));
    showResult(cfg, res, earned, gained, best, data.rk > prevRank);
  }

  function showResult(cfg, res, earned, gained, best, rankUp) {
    var again = cfg.mode === 'lesson' ? ['lesson', cfg.index] : cfg.mode === 'words' ? ['wordrun', cfg.id] : cfg.mode === 'passage' ? ['passage', cfg.id] : cfg.mode === 'focus' ? ['focus', ''] : ['hunt', ''];
    var nextBtn = '';
    if (cfg.mode === 'lesson' && earned > 0 && cfg.index + 1 < D.LESSONS.length && (tier !== 'beginner' || D.LESSONS[cfg.index + 1].grp === 'home')) {
      nextBtn = '<button type="button" class="tq-btn tq-btn-big" data-go="lesson" data-arg="' + (cfg.index + 1) + '">' + bi('Siguiente lección →', 'Next lesson →') + '</button>';
    }
    var head, body;
    if (cfg.mode === 'hunt') {
      head = res.clean >= HUNT_LEN ? bi('¡Todas a la primera!', 'All at the first try!') : bi('¡Las encontraste todas!', 'You found them all!');
      body = '<p class="tq-big">' + res.clean + ' / ' + HUNT_LEN + '</p><p class="tq-muted">' + bi('a la primera', 'at the first try') + '</p>';
    } else {
      head = earned >= 3 ? bi('¡Excelente!', 'Excellent!') : earned >= 1 || cfg.mode === 'words' || cfg.mode === 'focus' ? bi('¡Bien hecho!', 'Well done!') : bi('¡Casi! Ve más despacio y con cuidado.', 'Nearly! Go slower and carefully.');
      body = '<div class="tq-res-grid"><div><b>' + wpmText(res.wpm) + '</b><span>' + bi('palabras por minuto', 'words per minute') + '</span></div>' +
        '<div><b>' + pct(res.acc) + '</b><span>' + bi('bien', 'right') + '</span></div>' +
        '<div><b>' + res.secs + ' s</b><span>' + bi('tiempo', 'time') + '</span></div></div>';
      if (cfg.mode === 'lesson' && earned < 3 && earned >= 2) body += '<p class="tq-muted">' + bi('Para la 3.ª estrella: 95% bien y ' + D.GOALS[tier] + ' palabras por minuto.', 'For the 3rd star: 95% right and ' + D.GOALS[tier] + ' words per minute.') + '</p>';
    }
    var weak = [];
    for (var k in res.keys) if (res.keys[k][1] > 0 && k !== ' ') weak.push(k);
    var inner = '<section class="tq-result" aria-live="polite">' + (rankUp ? '' : '<div class="tq-res-medal">' + A.medal(data.rk, 60) + '</div>') + '<h1 class="tq-h1">' + head + '</h1>' +
      (cfg.mode === 'lesson' || cfg.mode === 'passage' || cfg.mode === 'hunt' ? '<div class="tq-res-stars">' + stars(earned) + '</div>' : '') +
      body +
      (gained > 0 ? '<p class="tq-good">⭐ ' + bi('¡Ganaste ' + gained + (gained === 1 ? ' estrella' : ' estrellas') + '!', 'You earned ' + gained + (gained === 1 ? ' star' : ' stars') + '!') + '</p>' : '') +
      (best && cfg.mode !== 'hunt' ? '<p class="tq-good">🏁 ' + bi('¡Tu mejor marca!', 'Your best yet!') + '</p>' : '') +
      (rankUp ? '<div class="tq-rankup">' + A.medal(data.rk, 72) + '<p>' + bi('¡Nuevo rango: ' + D.RANKS[data.rk].es + '!', 'New rank: ' + D.RANKS[data.rk].en + '!') + '</p></div>' : '') +
      (weak.length ? '<p class="tq-muted">' + bi('Teclas para repasar: ', 'Keys to practise: ') + weak.slice(0, 6).map(function(c) { return '<kbd>' + esc(c) + '</kbd>'; }).join(' ') + '</p>' : '') +
      '<div class="tq-actions">' + nextBtn +
        '<button type="button" class="tq-btn' + (nextBtn ? ' tq-btn-ghost' : ' tq-btn-big') + '" data-go="' + again[0] + '" data-arg="' + esc(again[1]) + '">' + bi('Otra vez', 'Again') + '</button>' +
        '<button type="button" class="tq-btn tq-btn-ghost" data-go="' + cfg.back + '"' + (cfg.backArg ? ' data-arg="' + cfg.backArg + '"' : '') + '>' + bi('Volver', 'Back') + '</button></div></section>';
    render(view === 'run' ? (cfg.mode === 'lesson' ? 'lessons' : cfg.mode === 'words' ? 'words' : cfg.mode === 'passage' ? 'passages' : cfg.mode === 'focus' ? 'stats' : 'home') : view, inner);
    view = 'result';
    var tot = $('#tq-total'); if (tot) tot.textContent = starCount();
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }

  // ── Progress ────────────────────────────────────────────────────
  function viewStats() {
    var rk = data.rk, next = D.RANKS[rk + 1];
    var have = next ? data.runs.filter(function(r) { return E.qualifies(r) && r.w >= next.wpm; }).length : 0;
    var ladder = D.RANKS.map(function(r, i) {
      return '<li class="tq-rung' + (i <= rk ? ' got' : '') + (i === rk ? ' me' : '') + '">' + A.medal(i, 44) + '<span class="tq-rung-n">' + esc(tx(r.es, r.en)) + '</span><span class="tq-rung-w">' + r.wpm + ' ' + tx('ppm', 'wpm') + '</span></li>';
    }).join('');
    var weak = E.weakest(data.keys, 6), heat = {};
    E.weakest(data.keys, 40).forEach(function(w) {
      var st = D.stepsFor(w.ch, data.lay);
      if (st) { var code = st[st.length - 1].code; heat[code] = Math.max(heat[code] || 0, w.rate); }
    });
    var best = 0; data.runs.forEach(function(r) { if (r.a >= 0.9 && r.w > best) best = r.w; });
    var inner = '<h1 class="tq-h1">' + bi('Mi progreso', 'My progress') + '</h1>' +
      '<section class="tq-panel tq-rankpanel"><div class="tq-rank-now">' + A.medal(rk, 80) + '<div><div class="tq-muted small">' + bi('Rango de escritura', 'Typing rank') + '</div>' +
        '<div class="tq-rank-name big">' + esc(tx(D.RANKS[rk].es, D.RANKS[rk].en)) + '</div>' +
        (next ? '<p class="tq-muted">' + bi('Para ' + next.es + ': 3 textos o ejercicios a ' + next.wpm + ' palabras por minuto, con 95% bien y al menos 60 letras. Llevas ' + have + ' de 3.',
          'For ' + next.en + ': 3 runs at ' + next.wpm + ' words per minute, 95% right and at least 60 characters. You have ' + have + ' of 3.') + '</p>' : '<p>' + bi('¡El rango más alto!', 'The highest rank!') + '</p>') +
        '</div></div><ol class="tq-ladder">' + ladder + '</ol></section>' +
      '<section class="tq-panel"><h2 class="tq-h2">' + bi('Velocidad', 'Speed') + '</h2>' + chart() +
        '<p class="tq-muted">' + bi('Mejor con 90% bien o más: ', 'Best at 90% right or better: ') + '<b>' + wpmText(best) + '</b> ' + tx('palabras por minuto', 'words per minute') + '</p></section>' +
      '<section class="tq-panel"><h2 class="tq-h2">' + bi('Teclas más difíciles', 'Trickiest keys') + '</h2>' +
        (weak.length ? '<div class="tq-mini">' + A.keyboard({ layout: data.lay, zones: false, heat: heat, label: tx('Mapa de calor: en rojo las teclas que más fallas', 'Heatmap: the keys you miss most are red') }) + '</div>' +
          '<ul class="tq-weak">' + weak.map(function(w) { return '<li><kbd>' + esc(w.ch) + '</kbd> ' + pct(w.rate) + ' ' + tx('fallos', 'slips') + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="tq-btn" data-go="focus">' + bi('Practicar estas teclas', 'Practise these keys') + '</button>'
          : '<p class="tq-muted">' + bi('Escribe un poco más y aquí verás qué teclas practicar.', 'Type a little more and you will see here which keys to practise.') + '</p>') +
      '</section>';
    render('stats', inner);
  }
  function chart() {
    var runs = data.runs.slice(-20);
    if (runs.length < 2) return '<p class="tq-muted">' + bi('Después de dos ejercicios verás tu gráfico.', 'After two runs you will see your graph.') + '</p>';
    var W = 320, H = 130, max = 10;
    runs.forEach(function(r) { if (r.w > max) max = Math.ceil(r.w / 10) * 10; });
    var pts = runs.map(function(r, i) { return [24 + i * (W - 34) / (runs.length - 1), H - 18 - (r.w / max) * (H - 30)]; });
    var grid = '';
    for (var g = 0; g <= max; g += max / 2) { var y = H - 18 - (g / max) * (H - 30); grid += '<line x1="24" x2="' + (W - 6) + '" y1="' + y + '" y2="' + y + '" stroke="#e5e7eb"/><text x="18" y="' + (y + 4) + '" font-size="10" text-anchor="end" fill="#6b7280">' + g + '</text>'; }
    var dots = pts.map(function(p, i) { var ok = runs[i].a >= 0.95; return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="' + (ok ? '#16a34a' : '#f59e0b') + '" stroke="#fff" stroke-width="1.5"/>'; }).join('');
    return '<svg class="tq-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(tx('Palabras por minuto en los últimos ejercicios', 'Words per minute in the latest runs')) + '">' + grid +
      '<polyline points="' + pts.map(function(p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>' + dots + '</svg>' +
      '<p class="tq-legend"><span class="tq-dot" style="background:#16a34a"></span>' + bi('95% bien o más', '95% right or better') + ' <span class="tq-dot" style="background:#f59e0b"></span>' + bi('menos', 'less') + '</p>';
  }

  // ── Keyboard input ──────────────────────────────────────────────
  function sinkInput(e) {
    var s = e.target;
    if (s.id !== 'tq-sink') return;
    if (e.isComposing || s._composing) return;
    flushSink(s);
  }
  function flushSink(s) {
    var v = s.value;
    s.value = '';
    if (!v) return;
    // a lone accent from a dead key followed by a vowel arrives as one letter; take each character in order
    Array.from(v.normalize ? v.normalize('NFC') : v).forEach(function(ch) { if (ch !== '\n' && ch !== '\r' && ch !== '\t') feed(ch); });
  }
  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey) return;
    var real = e.key && (e.key.length === 1 || e.key === 'Dead' || e.key === 'Shift' || e.key === 'Enter');
    var fromPad = e.target && e.target.classList && e.target.classList.contains('tq-pk');
    if (real && !fromPad) {
      // A key press that no on-screen key made: a real keyboard is connected
      // (the iPad's own keyboard never opens here, the typing box asks for none).
      if (data.kb !== 'hw') foundKeyboard();
      detectLayout(e);
    }
    if (view !== 'run' || !run || !run.active) return;
    var sink = $('#tq-sink');
    if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') { if (e.key !== 'Tab' || document.activeElement === sink) e.preventDefault(); return; }
    if (e.key === ' ' && document.activeElement !== sink) { e.preventDefault(); feed(' '); focusSink(); return; }
    if (sink && document.activeElement !== sink && e.key && e.key.length === 1 && !e.altKey) {
      e.preventDefault();
      feed(e.key);
      focusSink();
    }
  }

  // ── Boot ────────────────────────────────────────────────────────
  function init() {
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    age = user && user.age ? Number(user.age) : 0;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age || undefined) : 'intermediate';
    data = load();
    document.body.classList.add('tq-tier-' + tier);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('input', sinkInput, true);
    document.addEventListener('compositionstart', function(e) { if (e.target.id === 'tq-sink') e.target._composing = true; }, true);
    document.addEventListener('compositionend', function(e) {
      if (e.target.id !== 'tq-sink') return;
      e.target._composing = false;
      var s = e.target; setTimeout(function() { flushSink(s); }, 0);
    }, true);
    document.addEventListener('focusout', function(e) {
      if (e.target.id === 'tq-sink' && run && run.active && !run.pad) { var t = $('#tq-tap'); if (t) setTimeout(function() { if (document.activeElement !== e.target && run && run.active) t.hidden = false; }, 150); }
    }, true);
    var resizeT = null;
    window.addEventListener('resize', function() { clearTimeout(resizeT); resizeT = setTimeout(function() { if (run && run.active && run.pad) drawBoard(); }, 150); });
    viewHome();
  }

  function state() {
    return {
      view: view, tier: tier, kb: data.kb, lay: data.lay,
      run: run ? { mode: run.mode, id: run.id, text: run.session.text, pos: run.session.pos, errors: run.session.errors, active: !!run.active, pad: !!run.pad } : null,
      data: data
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { go: go, state: state, feed: feed, finish: finish };
})();
