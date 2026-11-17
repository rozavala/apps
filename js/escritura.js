/* ================================================================
   ESCRITURA ✍️ — handwriting practice: print, then cursive
   Trace each letter on the school lines with a finger or an Apple
   Pencil, stroke by stroke, in the order and direction it is written;
   then with less help; then on your own. Then words (greetings,
   family, prayers, rhymes, your own name) and a letter dictation that
   recognises what you wrote.

   Per-kid progress at zs_escritura_<kid> (one JSON blob):
     { v:1, style:'print'|'cursive',
       L:    { 'print:A': 0..3, 'cursive:a': 0..3, ... }    letters
       W:    { 'print:es:hola': 0..3, 'print:name': 0..3 }  words
       dict: { 'print:upper': 0..3, 'print:lower': 0..3, 'cursive:lower': 0..3 }
       rounds: n, last: 'YYYY-MM-DD' }
   Fields are only ever added (EscrituraEngine.migrate).

   Pieces: js/escritura-data.js (letters, sets, words),
   js/escritura-engine.js (geometry and checking),
   js/zs-handpad.js (the paper and the pencil), js/escritura-art.js.
   ================================================================ */

(function() {
  'use strict';

  var E = EscrituraEngine, D = EscrituraData, A = EscrituraArt;
  var PREFIX = 'zs_escritura_';
  var USER = (typeof getActiveUser === 'function') ? getActiveUser() : null;
  if (!USER) return;           // nav.js sends a signed-out visitor to the hub

  // ── tiny helpers ─────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function T(es, en) { return (typeof zsT === 'function') ? zsT(es, en) : en; }
  function kidLang() { return (typeof getKidLang === 'function' && getKidLang() === 'en') ? 'en' : 'es'; }
  function esc(s) { return (typeof escHtml === 'function') ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function sfx(n) { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} }
  function tier() { return (typeof getAgeTier === 'function') ? getAgeTier(USER.age) : 'intermediate'; }
  function little() { return tier() === 'beginner'; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

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
  function bump(map, k, n) { if ((map[k] | 0) < n) { map[k] = n; return true; } return false; }

  var d = null;
  var S = { style: 'print', view: 'home', wordLang: 'es', pad: null, anim: null, timers: [] };

  // ── voice ────────────────────────────────────────────────────
  function ttsMode() { try { return typeof ZsTTS !== 'undefined' ? ZsTTS.getSettings().mode : 'off'; } catch (e) { return 'off'; } }
  function say(text, lang, force) {
    if (typeof ZsTTS === 'undefined' || !ZsTTS.supported() || !text) return false;
    if (!force && ttsMode() === 'off') return false;
    var l = (lang || kidLang()) === 'es' ? 'es-CL' : 'en-US';
    if (ZsTTS.speak(text, { lang: l })) return true;
    try {                                   // read-aloud is off, but the kid pressed 🔊 or this is the dictation
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = l; u.rate = 0.85;
      var v = ZsTTS.pickVoice(l); if (v) u.voice = v;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function autoSay(text, lang) { if (ttsMode() === 'auto') say(text, lang); }
  function stopSpeech() { try { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); } catch (e) {} }
  function letterName(ch) { return D.letterName(ch, kidLang()); }

  // ── screen plumbing ──────────────────────────────────────────
  function root() { return $('es-wrap'); }
  function later(fn, ms) { var t = setTimeout(fn, ms); S.timers.push(t); return t; }
  function leave() {
    S.timers.forEach(clearTimeout); S.timers = [];
    stopAnim(); stopSpeech();
    if (S.pad) { S.pad.destroy(); S.pad = null; }
  }
  function show(html) {
    leave();
    root().innerHTML = html;
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function stars(n, label) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<span class="es-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="es-stars" role="img" aria-label="' + n + ' / 3 ' + esc(label || T('estrellas', 'stars')) + '">' + s + '</span>';
  }
  function feedback(msg, kind) {
    var el = $('es-fb');
    if (!el) return;
    el.className = 'es-fb' + (kind ? ' ' + kind : '');
    el.textContent = msg;
  }
  function styleName(s) { return s === 'cursive' ? T('Cursiva', 'Cursive') : T('Imprenta', 'Print'); }
  function tol() { return E.tolerance(tier()); }
  function totalStars() { return E.totalStars(d); }
  function lkey(ch) { return S.style + ':' + ch; }
  function topBar(backLabel, title, extra) {
    return '<div class="es-top">' +
      '<button type="button" class="es-back" id="es-back">' + A.icon('back') + '<span>' + esc(backLabel) + '</span></button>' +
      '<h2 class="es-title">' + title + '</h2>' + (extra || '') + '</div>';
  }

  // ── home ─────────────────────────────────────────────────────
  function renderHome() {
    S.view = 'home';
    var h = '<header class="es-hero">' +
      '<div class="es-hero-art">' + A.hero() + '</div>' +
      '<div class="es-hero-text"><h1>Escritura</h1><p>' + esc(T('Aprende a escribir con buena letra: imprenta y cursiva, con el dedo o con el lápiz.', 'Learn neat handwriting: print and cursive, with your finger or a pencil.')) + '</p></div>' +
      '<div class="es-total" id="es-total" title="' + esc(T('Tus estrellas', 'Your stars')) + '">★ ' + totalStars() + '</div>' +
      '</header>';

    h += '<section class="es-card"><h2 class="es-h2" id="es-l-style">' + esc(T('Tipo de letra', 'Handwriting style')) + '</h2>' +
      '<div class="es-styles" role="group" aria-labelledby="es-l-style">' +
      ['print', 'cursive'].map(function(s) {
        var on = S.style === s;
        return '<button type="button" class="es-style' + (on ? ' on' : '') + '" data-style="' + s + '" aria-pressed="' + on + '">' +
          '<span class="es-style-art">' + A.text(s === 'print' ? 'Aa' : 'ala', s, { lines: true, weight: 7 }) + '</span>' +
          '<b>' + esc(styleName(s)) + '</b><span>' + esc(s === 'print' ? T('Letra script, la primera', 'Ball-and-stick, first') : T('Letra ligada, unida', 'Joined-up letters')) + '</span></button>';
      }).join('') + '</div>' +
      (S.style === 'cursive' ? '<p class="es-note">' + esc(T(
        'La cursiva de esta app es parecida a la letra ligada de los cuadernos chilenos y a la cursiva de colegios de EE. UU.: cada letra empieza en la línea de abajo y se une a la siguiente. Cada colegio la enseña con pequeñas diferencias; por ahora están las minúsculas.',
        'This app’s cursive is close to the "letra ligada" in Chilean notebooks and to US school cursive: each letter starts on the baseline and joins the next. Schools teach it with small differences; for now it has the small letters.')) + '</p>' : '') +
      '</section>';

    h += '<section class="es-card es-more">' +
      '<button type="button" class="es-big" id="es-go-name"><span class="es-big-ic">' + A.text(firstLetterOfName(), 'print', { tight: true, weight: 8 }) + '</span>' +
        '<span><b>' + esc(T('Mi nombre', 'My name')) + '</b><span>' + esc(T('Escribe tu nombre', 'Write your own name')) + '</span></span>' + stars(d.W[S.style + ':name'] | 0) + '</button>' +
      '<button type="button" class="es-big" id="es-go-words"><span class="es-big-ic">' + A.text('sol', S.style, { tight: true, weight: 8 }) + '</span>' +
        '<span><b>' + esc(T('Palabras', 'Words')) + '</b><span>' + esc(T('Saludos, familia, oraciones y rimas', 'Greetings, family, prayers and rhymes')) + '</span></span></button>' +
      '<button type="button" class="es-big" id="es-go-dict"><span class="es-big-ic">' + A.icon('ear') + '</span>' +
        '<span><b>' + esc(T('Dictado de letras', 'Letter dictation')) + '</b><span>' + esc(T('Escucha una letra, escríbela y la app la reconoce', 'Hear a letter, write it, and the app reads it')) + '</span></span>' + stars(d.dict[dictKey()] | 0) + '</button>' +
      '</section>';

    var sets = D.SETS[S.style];
    h += '<section class="es-card"><div class="es-row-h"><h2 class="es-h2">' + esc(T('Letras', 'Letters')) + '</h2>' +
      '<span class="es-sub">' + esc(styleName(S.style)) + '</span></div>';
    var next = nextLetter();
    sets.forEach(function(set) {
      h += '<h3 class="es-h3">' + esc(T(set.t[0], set.t[1])) + '</h3><div class="es-tiles">';
      set.ch.split('').forEach(function(ch) {
        var n = d.L[lkey(ch)] | 0;
        h += '<button type="button" class="es-tile' + (n >= 3 ? ' done' : '') + (ch === next ? ' next' : '') + '" data-ch="' + esc(ch) + '" aria-label="' + esc(letterName(ch) + ', ' + n + ' / 3') + '">' +
          A.text(ch, S.style, { lines: true, tight: true, weight: 7 }) + stars(n) + '</button>';
      });
      h += '</div>';
    });
    h += '</section>';

    h += '<p class="es-foot">' + esc(T('Consejo: con el Apple Pencil puedes apoyar la mano en la pantalla.', 'Tip: with an Apple Pencil you can rest your hand on the screen.')) + '</p>';
    show(h);
    $all('.es-style').forEach(function(b) { b.onclick = function() { S.style = b.getAttribute('data-style'); d.style = S.style; save(); renderHome(); }; });
    $all('.es-tile').forEach(function(b) { b.onclick = function() { openLetter(b.getAttribute('data-ch'), 1); }; });
    $('es-go-words').onclick = renderWords;
    $('es-go-name').onclick = function() { openWord({ id: 'name', t: nameText(), l: kidLang() }, true); };
    $('es-go-dict').onclick = startDict;
  }

  // The first letter in the style's order that is not yet at 3 stars.
  function nextLetter() {
    var all = D.letters(S.style);
    for (var i = 0; i < all.length; i++) if ((d.L[lkey(all[i])] | 0) < 3) return all[i];
    return null;
  }
  function nameText() {
    var n = String(USER.name || '').trim().split(/\s+/)[0] || '';
    var f = D.font(S.style).glyphs;
    if (S.style === 'cursive') n = n.toLowerCase();
    return n.split('').filter(function(c) { return !!f[c]; }).join('');
  }
  function firstLetterOfName() { var n = nameText(); return n ? n.charAt(0).toUpperCase() : 'A'; }

  // ── a letter: watch, trace, trace with less help, write alone ─
  var LT = null;          // the letter on screen
  var STAGES = [
    null,
    { es: 'Repasa la letra', en: 'Trace the letter', hint: ['Sigue el camino gris desde el punto verde.', 'Follow the grey path from the green dot.'] },
    { es: 'Con poca ayuda', en: 'With a little help', hint: ['Sigue los puntitos, en orden.', 'Follow the dots, in order.'] },
    { es: 'Tú solo', en: 'On your own', hint: ['Escríbela tú solo y toca Listo.', 'Write it on your own, then press Done.'] }
  ];

  function openLetter(ch, stage) {
    S.view = 'letter';
    var font = D.font(S.style), g = font.glyphs[ch];
    // as wide as the card allows at full height, like a notebook page, with the letter in the middle
    var host = Math.max(280, (root().clientWidth || 360) - 26);
    var fill = host / padMaxH(1) * ZsHandPad.ROW_H - 20;
    var width = Math.max(150, g.w + (S.style === 'cursive' ? 66 : 50), Math.min(360, fill));
    var margin = (width - g.w - (S.style === 'cursive' ? 20 : 0)) / 2;
    var lay = E.layout(ch, font, { margin: margin });
    LT = { ch: ch, stage: stage, model: lay.strokes, width: width, idx: 0, fails: 0, misses: 0, nd: g.nd == null ? 99 : g.nd };
    var cur = d.L[lkey(ch)] | 0;
    var h = topBar(T('Letras', 'Letters'), '<span class="es-big-ch">' + esc(ch) + '</span> ' + esc(styleName(S.style)),
        '<button type="button" class="es-icon-btn" id="es-say" aria-label="' + esc(T('Escuchar', 'Listen')) + '">' + A.icon('speak') + '</button>') +
      '<div class="es-card es-practice">' +
        '<ol class="es-steps" aria-label="' + esc(T('Pasos', 'Steps')) + '">' +
          [1, 2, 3].map(function(n) {
            return '<li class="' + (n === stage ? 'on' : '') + (n <= cur ? ' got' : '') + '"><span>' + n + '</span>' + esc(T(STAGES[n].es, STAGES[n].en)) + '</li>';
          }).join('') + '</ol>' +
        '<div class="es-pad" id="es-pad"></div>' +
        '<p class="es-fb" id="es-fb" role="status" aria-live="polite"></p>' +
        '<div class="es-tools">' +
          '<button type="button" class="es-tool" id="es-watch">' + A.icon('play') + '<span>' + esc(T('Mira cómo', 'Watch')) + '</span></button>' +
          '<button type="button" class="es-tool" id="es-clear">' + A.icon('redo') + '<span>' + esc(T('Otra vez', 'Start over')) + '</span></button>' +
          (stage === 3 ? '<button type="button" class="es-tool go" id="es-done">' + A.icon('check') + '<span>' + esc(T('Listo', 'Done')) + '</span></button>' : '') +
        '</div>' +
      '</div>';
    show(h);
    $('es-back').onclick = renderHome;
    $('es-say').onclick = function() { say(letterName(ch), null, true); };
    S.pad = ZsHandPad.create($('es-pad'), {
      width: width, rows: 1, maxHeight: padMaxH(1),
      label: T('Escribe la letra aquí', 'Write the letter here'),
      onBegin: function() { stopAnim(); },
      onStroke: stage === 3 ? onFreeStroke : onTraceStroke
    });
    drawGuides();
    $('es-watch').onclick = function() { animate(LT.model, true); };
    $('es-clear').onclick = function() { S.pad.clear(); LT.idx = 0; LT.fails = 0; drawGuides(); feedback(''); };
    if ($('es-done')) $('es-done').onclick = checkLetterAlone;
    feedback(T(STAGES[stage].hint[0], STAGES[stage].hint[1]));
    autoSay(letterName(ch) + '. ' + T(STAGES[stage].hint[0], STAGES[stage].hint[1]));
    if (stage === 1 && cur === 0) later(function() { animate(LT.model, false); }, 500);
  }

  function padMaxH(rows) {
    var vh = window.innerHeight || 700;
    return Math.max(220, Math.min(rows === 1 ? 460 : 560, vh * (rows === 1 ? 0.5 : 0.58)));
  }

  // Guides for the current stage, drawn in the pad's own layer.
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clearLayer() { var L = S.pad.layer; while (L.firstChild) L.removeChild(L.firstChild); return L; }
  function isDot(st) { return E.length(st) < 4; }

  function drawGuides() {
    if (!S.pad || !LT) return;
    var L = clearLayer(), t = tol(), st = LT.stage;
    LT.model.forEach(function(m, i) {
      var done = i < LT.idx, now = i === LT.idx;
      if (st === 1) {
        if (isDot(m)) svgEl('circle', { cx: m[0].x, cy: -m[0].y, r: t * 0.7, fill: done ? '#cdeed8' : now ? '#cfe3f8' : '#e3e6ec' }, L);
        else {
          svgEl('path', { d: S.pad.path(m), fill: 'none', stroke: done ? '#cdeed8' : now ? '#cfe3f8' : '#e3e6ec', 'stroke-width': t * 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, L);
          svgEl('path', { d: S.pad.path(m), fill: 'none', stroke: done ? '#86c99c' : now ? '#4f86c6' : '#aab2c0', 'stroke-width': 2.2, 'stroke-dasharray': '5 6', 'stroke-linecap': 'round' }, L);
        }
      } else if (st === 2 && !done) {
        dottedLine(L, m, now ? '#7c95b8' : '#c3cad6');
      }
    });
    if (st < 3) {
      var cur = LT.model[LT.idx];
      if (cur) { startMark(L, cur, LT.idx + 1); if (st === 1 && !isDot(cur)) arrow(L, cur); }
    } else if (!S.pad.count()) {
      startMark(L, LT.model[0], 1, true);
    }
  }
  function dottedLine(L, m, col) {
    var pts = E.resample(m, 9);
    pts.forEach(function(p) { svgEl('circle', { cx: p.x, cy: -p.y, r: 2.2, fill: col }, L); });
  }
  function startMark(L, m, n, faint) {
    var p = m[0], g = svgEl('g', { 'class': 'es-start' + (faint ? ' faint' : '') }, L);
    svgEl('circle', { cx: p.x, cy: -p.y, r: 7.5, fill: faint ? '#9fd8b1' : '#16a34a', stroke: '#fff', 'stroke-width': 2 }, g);
    var tx = svgEl('text', { x: p.x, y: -p.y + 3.5, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: '#fff', 'font-family': 'Nunito, system-ui, sans-serif' }, g);
    tx.textContent = String(n);
  }
  // A little chevron a short way along the stroke, pointing the way to go.
  function arrow(L, m) {
    var total = E.length(m), want = Math.min(30, total * 0.35), acc = 0, i = 1;
    for (; i < m.length; i++) { acc += Math.hypot(m[i].x - m[i - 1].x, m[i].y - m[i - 1].y); if (acc >= want) break; }
    var a = m[Math.max(0, i - 2)], b = m[Math.min(m.length - 1, i)];
    var ang = Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI;
    var p = m[Math.min(m.length - 1, i - 1)];
    var g = svgEl('g', { transform: 'translate(' + p.x.toFixed(1) + ' ' + (-p.y).toFixed(1) + ') rotate(' + ang.toFixed(1) + ')' }, L);
    svgEl('path', { d: 'M-5 -6 L4 0 L-5 6', fill: 'none', stroke: '#16a34a', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  }

  // "Watch": a pencil tip draws each stroke in turn.
  function stopAnim() { if (S.anim) { cancelAnimationFrame(S.anim.raf); if (S.anim.g && S.anim.g.parentNode) S.anim.g.parentNode.removeChild(S.anim.g); S.anim = null; } }
  function animate(strokes, user) {
    if (!S.pad) return;
    stopAnim();
    var g = svgEl('g', { 'class': 'es-anim' }, S.pad.layer);
    var path = svgEl('path', { fill: 'none', stroke: '#ea580c', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var done = svgEl('path', { fill: 'none', stroke: '#fdba74', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var tip = svgEl('circle', { r: 6, fill: '#ea580c', stroke: '#fff', 'stroke-width': 2 }, g);
    var speed = little() ? 0.12 : 0.16;                // units per ms
    var si = 0, t0 = performance.now(), doneD = '';
    S.anim = { g: g, raf: 0 };
    if (user) feedback(T('Mira: así se escribe.', 'Watch: this is how it goes.'));
    function frame(now) {
      if (!S.anim) return;
      var st = strokes[si];
      if (!st) { later(stopAnim, 700); if (user) feedback(T(STAGES[LT ? LT.stage : 1].hint[0], STAGES[LT ? LT.stage : 1].hint[1])); return; }
      var len = Math.max(1, E.length(st)), dur = isDot(st) ? 250 : len / speed;
      var k = Math.min(1, (now - t0) / dur), n = Math.max(1, Math.round(k * (st.length - 1)));
      var part = st.slice(0, n + 1);
      path.setAttribute('d', S.pad.path(part));
      tip.setAttribute('cx', part[part.length - 1].x); tip.setAttribute('cy', -part[part.length - 1].y);
      if (k >= 1) { doneD += S.pad.path(st); done.setAttribute('d', doneD); path.setAttribute('d', ''); si++; t0 = now + 220; }
      S.anim.raf = requestAnimationFrame(frame);
    }
    S.anim.raf = requestAnimationFrame(frame);
  }

  var REASONS = {
    start: ['Empieza en el punto verde.', 'Start at the green dot.'],
    dir: ['Casi: va en el otro sentido. Sigue la flecha.', 'Nearly: it goes the other way. Follow the arrow.'],
    shape: ['Quédate en el camino. ¡Inténtalo otra vez!', 'Stay on the path. Try again!'],
    short: ['Sigue hasta el final del trazo.', 'Keep going to the end of the line.'],
    dot: ['Aquí va solo un puntito.', 'Just a little dot here.'],
    order: ['Ese trazo va después. Primero el número ', 'That line comes later. First number ']
  };

  function onTraceStroke(kid) {
    if (!LT) return;
    var m = LT.model[LT.idx];
    if (!m) return;
    var t = tol() * (LT.fails >= 3 ? 1.3 : 1) * (LT.stage === 2 ? 1.1 : 1);
    var r = E.checkStroke(kid, m, { tol: t, anyStart: LT.idx >= LT.nd, coverage: LT.stage === 2 ? 0.74 : 0.78 });
    if (LT.idx >= LT.nd && r.reason === 'dir') { r.pass = true; r.reason = ''; }   // accents and dots: any direction
    if (r.pass) {
      LT.idx++; LT.fails = 0;
      sfx('tap');
      if (LT.idx >= LT.model.length) { letterStagePassed(); return; }
      drawGuides();
      feedback(LT.model.length - LT.idx === 1 ? T('¡Bien! Ahora el último trazo.', 'Good! Now the last line.') : T('¡Bien! Ahora el trazo ', 'Good! Now line ') + (LT.idx + 1) + '.', 'good');
      return;
    }
    // Was it a later stroke, done too early?
    for (var j = LT.idx + 1; j < LT.model.length; j++) {
      if (E.checkStroke(kid, LT.model[j], { tol: t }).pass) { r.reason = 'order'; break; }
    }
    LT.fails++; LT.misses++;
    S.pad.fadeLast(500);
    var msg = REASONS[r.reason] || REASONS.shape;
    feedback(T(msg[0], msg[1]) + (r.reason === 'order' ? (LT.idx + 1) + '.' : ''), 'warn');
    if (LT.fails === 2 && LT.stage === 1) later(function() { animate([m], false); }, 500);
    if (LT.fails >= 3 && LT.stage === 2) { LT.stage = 2; flashLane(m); }
  }
  function flashLane(m) {
    var g = svgEl('path', { d: S.pad.path(m), fill: 'none', stroke: '#cfe3f8', 'stroke-width': tol() * 1.4, 'stroke-linecap': 'round', 'class': 'es-flash' }, null);
    S.pad.layer.insertBefore(g, S.pad.layer.firstChild);
    later(function() { if (g.parentNode) g.parentNode.removeChild(g); }, 1600);
  }

  function onFreeStroke() {
    var L = S.pad.layer;
    $all('.es-start', L).forEach(function(n) { n.parentNode.removeChild(n); });
    // the littlest are checked as soon as they have written enough strokes
    if (little() && S.pad.count() >= LT.model.length) later(checkLetterAlone, 600);
  }
  function checkLetterAlone() {
    if (!LT || !S.pad) return;
    var ink = S.pad.strokes();
    if (!ink.length) { feedback(T('Primero escribe la letra.', 'Write the letter first.'), 'warn'); return; }
    var r = E.checkFree(ink, LT.model, { tol: tol() });
    // show the model on top, thin, to compare
    var L = clearLayer();
    LT.model.forEach(function(m) {
      if (isDot(m)) svgEl('circle', { cx: m[0].x, cy: -m[0].y, r: 4, fill: r.pass ? '#16a34a' : '#ea580c', opacity: '.8' }, L);
      else svgEl('path', { d: S.pad.path(m), fill: 'none', stroke: r.pass ? '#16a34a' : '#ea580c', 'stroke-width': 3, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', opacity: '.85' }, L);
    });
    if (r.pass) { letterStagePassed(); return; }
    LT.misses++;
    feedback(T('Compara con la línea naranja y prueba de nuevo.', 'Compare with the orange line and try again.'), 'warn');
    later(function() { if (S.pad) { S.pad.clear(); drawGuides(); } }, 2200);
  }

  function letterStagePassed() {
    var st = LT.stage, k = lkey(LT.ch);
    var better = bump(d.L, k, E.starsForStage(st));
    d.rounds++;
    save();
    refreshTotal();
    sfx(st === 3 ? 'cheer' : 'star');
    $all('.es-steps li')[st - 1].className = 'got';
    if (st < 3) {
      feedback(st === 1 ? T('¡Muy bien! Ahora con menos ayuda.', 'Great! Now with less help.') : T('¡Excelente! Ahora tú solo.', 'Excellent! Now on your own.'), 'good');
      later(function() { openLetter(LT.ch, st + 1); }, 1100);
      return;
    }
    logActivity('letter ' + LT.ch + ' (' + S.style + ')');
    later(function() { letterDone(better); }, 700);
  }

  function letterDone(better) {
    var ch = LT.ch, n = d.L[lkey(ch)] | 0;
    var all = D.letters(S.style), nxt = all[all.indexOf(ch) + 1];
    var h = topBar(T('Letras', 'Letters'), esc(styleName(S.style))) +
      '<div class="es-card es-done">' +
        '<div class="es-medal">' + A.medal(n) + '</div>' +
        '<div class="es-done-ch">' + A.text(ch, S.style, { lines: true, tight: true, weight: 7 }) + '</div>' +
        '<h2 class="es-done-t">' + esc(T('¡Escribiste ', 'You wrote ') + letterName(ch) + '!') + '</h2>' +
        '<p class="es-done-s">' + stars(n) + '</p>' +
        '<div class="es-actions">' +
          (nxt ? '<button type="button" class="es-go" id="es-next">' + esc(T('Siguiente: ', 'Next: ')) + '<b>' + esc(nxt) + '</b>' + A.icon('next') + '</button>' : '') +
          '<button type="button" class="es-go alt" id="es-again">' + esc(T('Otra vez', 'Again')) + '</button>' +
          '<button type="button" class="es-go alt" id="es-home">' + esc(T('Todas las letras', 'All letters')) + '</button>' +
        '</div></div>';
    show(h);
    $('es-back').onclick = renderHome;
    if ($('es-next')) $('es-next').onclick = function() { openLetter(nxt, (d.L[lkey(nxt)] | 0) >= 1 ? Math.min(3, (d.L[lkey(nxt)] | 0) + 1) : 1); };
    $('es-again').onclick = function() { openLetter(ch, 1); };
    $('es-home').onclick = renderHome;
    autoSay(T('¡Muy bien!', 'Well done!'));
  }

  function refreshTotal() { var el = $('es-total'); if (el) el.textContent = '★ ' + totalStars(); }
  function logActivity(what) {
    try { if (typeof ActivityLog !== 'undefined' && ActivityLog.log) ActivityLog.log('Escritura', '✒️', 'Handwriting: ' + what); } catch (e) {}
  }

  // ── words ────────────────────────────────────────────────────
  function renderWords() {
    S.view = 'words';
    var lang = S.wordLang;
    var h = topBar(T('Inicio', 'Home'), esc(T('Palabras', 'Words')) + ' · ' + esc(styleName(S.style))) +
      '<div class="es-card"><div class="es-seg" role="group" aria-label="' + esc(T('Idioma', 'Language')) + '">' +
        ['es', 'en'].map(function(l) { return '<button type="button" class="es-segb' + (lang === l ? ' on' : '') + '" data-lang="' + l + '" aria-pressed="' + (lang === l) + '">' + (l === 'es' ? 'Español' : 'English') + '</button>'; }).join('') +
      '</div>';
    var shown = 0;
    D.GROUPS.forEach(function(g) {
      var items = D.WORDS.filter(function(w) {
        return w.l === lang && w.g === g.id && D.writable(w.t, S.style) && (!little() || w.t.length <= 7);
      });
      if (!items.length) return;
      h += '<h3 class="es-h3">' + esc(T(g.t[0], g.t[1])) + '</h3><div class="es-words">';
      items.forEach(function(w) {
        var n = d.W[S.style + ':' + w.l + ':' + w.id] | 0;
        shown++;
        h += '<button type="button" class="es-word' + (n >= 3 ? ' done' : '') + '" data-id="' + esc(w.id) + '">' +
          '<span class="es-word-art">' + A.text(w.t, S.style, { tight: true, weight: 7, label: w.t }) + '</span>' + stars(n) + '</button>';
      });
      h += '</div>';
    });
    if (S.style === 'cursive') h += '<p class="es-note">' + esc(T('En cursiva aparecen las palabras sin mayúsculas; las oraciones con mayúscula están en imprenta.', 'In cursive you see the words without capitals; prayers with capitals are in print.')) + '</p>';
    if (!shown) h += '<p class="es-note">' + esc(T('No hay palabras aquí todavía.', 'No words here yet.')) + '</p>';
    h += '</div>';
    show(h);
    $('es-back').onclick = renderHome;
    $all('.es-segb').forEach(function(b) { b.onclick = function() { S.wordLang = b.getAttribute('data-lang'); renderWords(); }; });
    $all('.es-word').forEach(function(b) { b.onclick = function() { openWord(D.word(b.getAttribute('data-id')), false); }; });
  }

  var WT = null;
  function wordKey(w) { return w.id === 'name' ? S.style + ':name' : S.style + ':' + w.l + ':' + w.id; }
  function openWord(w, isName, stage) {
    if (!w || !w.t) { toastMsg(T('Tu nombre tiene letras que todavía no están.', 'Your name has letters that are not here yet.')); return; }
    S.view = 'word';
    stage = stage || 1;
    var host = root().clientWidth || 360;
    var maxRow = Math.max(240, Math.min(900, (host - 40) / 0.62));
    var lay = E.layout(w.t, D.font(S.style), { margin: 16, maxRow: maxRow });
    WT = { w: w, isName: isName, stage: stage, lay: lay };
    var n = d.W[wordKey(w)] | 0;
    var title = isName ? T('Mi nombre', 'My name') : T('Palabras', 'Words');
    var h = topBar(isName ? T('Inicio', 'Home') : T('Palabras', 'Words'), esc(title) + ' · ' + esc(styleName(S.style)),
        '<button type="button" class="es-icon-btn" id="es-say" aria-label="' + esc(T('Escuchar', 'Listen')) + '">' + A.icon('speak') + '</button>') +
      '<div class="es-card es-practice">' +
        '<ol class="es-steps two">' +
          '<li class="' + (stage === 1 ? 'on' : '') + (n >= 1 ? ' got' : '') + '"><span>1</span>' + esc(T('Repasa', 'Trace')) + '</li>' +
          '<li class="' + (stage === 2 ? 'on' : '') + (n >= 2 ? ' got' : '') + '"><span>2</span>' + esc(T('Cópiala tú solo', 'Copy it yourself')) + '</li></ol>' +
        (stage === 2 ? '<div class="es-model" aria-hidden="true">' + A.text(w.t, S.style, { lines: true, weight: 6, maxRow: maxRow }) + '</div>' : '') +
        '<div class="es-pad" id="es-pad"></div>' +
        '<p class="es-fb" id="es-fb" role="status" aria-live="polite"></p>' +
        (isName && S.style === 'cursive' && /[A-ZÁÉÍÓÚÑ]/.test(String(USER.name || '')) ?
          '<p class="es-note es-name-note">' + esc(T('En cursiva tu nombre va con minúscula, porque las mayúsculas cursivas todavía no están en la app.', 'In cursive your name is in small letters, because cursive capitals are not in the app yet.')) + '</p>' : '') +
        '<div class="es-tools">' +
          (stage === 1 ? '<button type="button" class="es-tool" id="es-watch">' + A.icon('play') + '<span>' + esc(T('Mira cómo', 'Watch')) + '</span></button>' : '') +
          '<button type="button" class="es-tool" id="es-undo">' + A.icon('undo') + '<span>' + esc(T('Deshacer', 'Undo')) + '</span></button>' +
          '<button type="button" class="es-tool" id="es-clear">' + A.icon('redo') + '<span>' + esc(T('Borrar', 'Clear')) + '</span></button>' +
          '<button type="button" class="es-tool go" id="es-done">' + A.icon('check') + '<span>' + esc(T('Listo', 'Done')) + '</span></button>' +
        '</div></div>';
    show(h);
    $('es-back').onclick = isName ? renderHome : renderWords;
    $('es-say').onclick = function() { say(w.t, w.l, true); };
    S.pad = ZsHandPad.create($('es-pad'), {
      width: lay.width, rows: lay.rows, maxHeight: padMaxH(lay.rows),
      label: T('Escribe aquí', 'Write here'), onBegin: function() { stopAnim(); }
    });
    if (stage === 1) {
      var L = S.pad.layer, t = tol();
      lay.strokes.forEach(function(m) {
        if (isDot(m)) svgEl('circle', { cx: m[0].x, cy: -m[0].y, r: t * 0.8, fill: '#e3e6ec' }, L);
        else svgEl('path', { d: S.pad.path(m), fill: 'none', stroke: '#e3e6ec', 'stroke-width': t * 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, L);
      });
      lay.strokes.forEach(function(m) { if (!isDot(m)) svgEl('path', { d: S.pad.path(m), fill: 'none', stroke: '#aab2c0', 'stroke-width': 2, 'stroke-dasharray': '5 6', 'stroke-linecap': 'round' }, L); });
      lay.letters.forEach(function(l) { var m = lay.strokes[l.first]; if (m && (S.style === 'print' || l.first === 0 || isDot(m))) startMark(L, m, '', true); });
      $('es-watch').onclick = function() { animate(lay.strokes, true); };
    }
    $('es-undo').onclick = function() { S.pad.undo(); };
    $('es-clear').onclick = function() { S.pad.clear(); feedback(''); };
    $('es-done').onclick = checkWord;
    var hint = stage === 1 ? T('Repasa la palabra con cuidado y toca Listo.', 'Trace the word carefully, then press Done.')
                           : T('Ahora escríbela tú solo en las líneas y toca Listo.', 'Now write it yourself on the lines, then press Done.');
    feedback(hint);
    autoSay(w.t + '. ' + hint, null);
  }
  function toastMsg(m) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(m); else feedback(m, 'warn'); }

  function checkWord() {
    if (!WT || !S.pad) return;
    var ink = S.pad.strokes();
    if (!ink.length) { feedback(T('Primero escribe la palabra.', 'Write the word first.'), 'warn'); return; }
    var r = E.checkFree(ink, WT.lay.strokes, { tol: tol(), align: WT.stage === 2 });
    var k = wordKey(WT.w), n = E.wordStars(WT.stage >= 1, WT.stage === 2 && r.pass, r.quality);
    if (!r.pass) {
      feedback(r.coverage < 0.72 ? T('Faltan partes de la palabra. ¡Sigue!', 'Parts of the word are missing. Keep going!')
                                 : T('Casi. Escribe más cerca de las líneas y prueba otra vez.', 'Nearly. Write closer to the lines and try again.'), 'warn');
      return;
    }
    bump(d.W, k, WT.stage === 1 ? 1 : n);
    d.rounds++;
    save();
    sfx(WT.stage === 2 ? 'cheer' : 'star');
    if (WT.stage === 1) {
      feedback(T('¡Bien repasada! Ahora cópiala tú solo.', 'Well traced! Now copy it yourself.'), 'good');
      later(function() { openWord(WT.w, WT.isName, 2); }, 1100);
      return;
    }
    logActivity((WT.isName ? 'own name' : '"' + WT.w.t + '"') + ' (' + S.style + ')');
    var got = d.W[k] | 0, w = WT.w, isName = WT.isName;
    var h = topBar(isName ? T('Inicio', 'Home') : T('Palabras', 'Words'), esc(styleName(S.style))) +
      '<div class="es-card es-done">' +
        '<div class="es-medal">' + A.medal(got) + '</div>' +
        '<div class="es-done-word">' + A.text(w.t, S.style, { lines: true, weight: 6 }) + '</div>' +
        '<h2 class="es-done-t">' + esc(n === 3 ? T('¡Letra preciosa!', 'Beautiful handwriting!') : T('¡Muy bien escrita!', 'Nicely written!')) + '</h2>' +
        '<p class="es-done-s">' + stars(n) + '</p>' +
        (n < 3 ? '<p class="es-note">' + esc(T('Para la tercera estrella, escríbela todavía más cerca del modelo.', 'For the third star, write it even closer to the model.')) + '</p>' : '') +
        '<div class="es-actions">' +
          '<button type="button" class="es-go" id="es-again">' + esc(T('Otra vez', 'Again')) + '</button>' +
          (isName ? '' : '<button type="button" class="es-go alt" id="es-more">' + esc(T('Otra palabra', 'Another word')) + '</button>') +
          '<button type="button" class="es-go alt" id="es-home">' + esc(T('Inicio', 'Home')) + '</button>' +
        '</div></div>';
    later(function() {
      show(h);
      $('es-back').onclick = isName ? renderHome : renderWords;
      $('es-again').onclick = function() { openWord(w, isName, 2); };
      if ($('es-more')) $('es-more').onclick = renderWords;
      $('es-home').onclick = renderHome;
    }, 600);
  }

  // ── letter dictation (the app reads what you wrote) ──────────
  var DT = null;
  function dictKey() { return S.style + ':' + (S.style === 'print' && little() ? 'upper' : 'lower'); }
  function dictPool() {
    var all = D.letters(S.style).filter(function(c) { return /^[a-zA-ZñÑ]$/.test(c); });
    var upper = S.style === 'print' && little();
    return all.filter(function(c) { return upper ? c !== c.toLowerCase() : c === c.toLowerCase(); });
  }
  function startDict() {
    var pool = dictPool();
    var font = D.font(S.style);
    var cands = pool.map(function(c) { return { ch: c, strokes: E.layout(c, font, { margin: 0 }).strokes }; });
    DT = { items: shuffle(pool).slice(0, little() ? 6 : 10), i: 0, right: 0, cands: cands, tries: 0 };
    dictItem();
  }
  function dictItem() {
    S.view = 'dict';
    var ch = DT.items[DT.i];
    var h = topBar(T('Inicio', 'Home'), esc(T('Dictado de letras', 'Letter dictation')) + ' · ' + esc(styleName(S.style)),
        '<span class="es-count">' + (DT.i + 1) + ' / ' + DT.items.length + '</span>') +
      '<div class="es-card es-practice">' +
        '<div class="es-dict-q"><button type="button" class="es-go" id="es-hear">' + A.icon('speak') + '<span>' + esc(T('Escuchar la letra', 'Hear the letter')) + '</span></button></div>' +
        '<div class="es-pad" id="es-pad"></div>' +
        '<p class="es-fb" id="es-fb" role="status" aria-live="polite"></p>' +
        '<div class="es-tools">' +
          '<button type="button" class="es-tool" id="es-clear">' + A.icon('redo') + '<span>' + esc(T('Borrar', 'Clear')) + '</span></button>' +
          '<button type="button" class="es-tool go" id="es-done">' + A.icon('check') + '<span>' + esc(T('Listo', 'Done')) + '</span></button>' +
        '</div></div>';
    show(h);
    $('es-back').onclick = renderHome;
    S.pad = ZsHandPad.create($('es-pad'), { width: 240, rows: 1, maxHeight: padMaxH(1), label: T('Escribe la letra aquí', 'Write the letter here') });
    $('es-hear').onclick = function() { say(letterName(ch), null, true); };
    $('es-clear').onclick = function() { S.pad.clear(); feedback(''); };
    $('es-done').onclick = dictCheck;
    feedback(T('Escucha la letra y escríbela en las líneas.', 'Listen to the letter and write it on the lines.'));
    later(function() { say(letterName(ch), null, true); }, 300);
  }
  function dictCheck() {
    var ch = DT.items[DT.i], ink = S.pad.strokes();
    if (!ink.length) { feedback(T('Primero escribe la letra.', 'Write the letter first.'), 'warn'); return; }
    var ranked = E.recognize(ink, DT.cands);
    var best = ranked[0], mine = ranked.filter(function(r) { return r.ch === ch; })[0];
    var ok = best.ch === ch || (mine && mine.d <= best.d * 1.08 && mine.d < 16);
    var h = '<div class="es-dict-ans' + (ok ? ' good' : '') + '">' +
      '<span>' + A.text(ch, S.style, { lines: true, tight: true, weight: 7 }) + '</span>' +
      '<p>' + esc(ok ? T('¡Sí! Escribiste ', 'Yes! You wrote ') + letterName(ch) + '.'
                    : T('Eso parece ', 'That looks like ') + letterName(best.ch) + '. ' + T('Así es ', 'This is ') + letterName(ch) + '.') + '</p>' +
      '<button type="button" class="es-go" id="es-next">' + esc(DT.i + 1 < DT.items.length ? T('Siguiente', 'Next') : T('Terminar', 'Finish')) + A.icon('next') + '</button></div>';
    if (ok) DT.right++;
    var tools = root().querySelector('.es-tools');
    tools.outerHTML = h;
    feedback('', ok ? 'good' : 'warn');
    sfx(ok ? 'star' : 'tap');
    say(ok ? T('¡Sí!', 'Yes!') : letterName(ch));
    $('es-next').onclick = function() { DT.i++; if (DT.i < DT.items.length) dictItem(); else dictDone(); };
  }
  function dictDone() {
    var n = E.dictStars(DT.right, DT.items.length), k = dictKey();
    bump(d.dict, k, n);
    d.rounds++;
    save();
    logActivity('letter dictation ' + DT.right + '/' + DT.items.length + ' (' + S.style + ')');
    var h = topBar(T('Inicio', 'Home'), esc(T('Dictado de letras', 'Letter dictation'))) +
      '<div class="es-card es-done">' +
        '<div class="es-medal">' + A.medal(n) + '</div>' +
        '<h2 class="es-done-t">' + DT.right + ' / ' + DT.items.length + ' ' + esc(T('letras', 'letters')) + '</h2>' +
        '<p class="es-done-s">' + stars(n) + '</p>' +
        '<div class="es-actions"><button type="button" class="es-go" id="es-again">' + esc(T('Otra ronda', 'Another round')) + '</button>' +
        '<button type="button" class="es-go alt" id="es-home">' + esc(T('Inicio', 'Home')) + '</button></div></div>';
    show(h);
    $('es-back').onclick = renderHome;
    $('es-again').onclick = startDict;
    $('es-home').onclick = renderHome;
    if (n) sfx('cheer');
  }

  // ── start ────────────────────────────────────────────────────
  function boot() {
    d = load();
    var t = tier();
    S.style = d.style || (t === 'advanced' || t === 'expert' ? 'cursive' : 'print');
    S.wordLang = kidLang();
    document.documentElement.lang = kidLang();
    renderHome();
  }
  function begin() {
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
  window.Escritura = {
    state: function() { return S; },
    data: function() { return d; },
    letter: function() { return LT; },
    word: function() { return WT; },
    dict: function() { return DT; },
    pad: function() { return S.pad; }
  };
})();
