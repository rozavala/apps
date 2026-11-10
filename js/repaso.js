/* ================================================================
   REPASO DEL DÍA — repaso.js
   The page for the daily review: up to 10 items the kid missed in
   other apps (5 for the youngest), one at a time. All the scheduling
   lives in review.js; this file only shows items and reports answers.
   Item text is plain text and is only ever put on the page as text.
   ================================================================ */

(function() {
  'use strict';

  var USER = (typeof getActiveUser === 'function') ? getActiveUser() : null;
  if (!USER) return; // nav.js sends a signed-out visitor to the hub

  var APP_NAMES = {
    math: 'Math Galaxy', vocab: 'Vocabulario Vivo', bible: 'Bible Explorer',
    atlas: 'World Atlas', chess: 'Chess Quest', patron: 'Patrón de Lancha', calculo: 'Cálculo Rápido'
  };

  var S = { queue: [], i: 0, right: 0, answered: 0, item: null, locked: false };

  function $(id) { return document.getElementById(id); }
  function T(es, en) { return (typeof zsT === 'function') ? zsT(es, en) : en; }
  function esc(s) { return (typeof escHtml === 'function') ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function sfx(n) { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} }
  function show(id) {
    ['rp-home', 'rp-quiz', 'rp-done'].forEach(function(s) { $(s).classList.toggle('active', s === id); });
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  function little() { return (typeof getAgeTier === 'function') && getAgeTier(USER.age) === 'beginner'; }
  function sessionSize() { return little() ? 5 : 10; }
  function appName(a) { return APP_NAMES[a] || a; }

  // ── art (hand-built SVG) ─────────────────────────────────────
  function boxArt() {
    return '<svg viewBox="0 0 120 96" width="100%" height="100%">' +
      '<defs><linearGradient id="rpw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C58A4B"/><stop offset="1" stop-color="#8F5A2A"/></linearGradient></defs>' +
      '<ellipse cx="60" cy="88" rx="46" ry="5" fill="#0f172a" opacity=".12"/>' +
      '<g transform="rotate(-7 38 40)"><rect x="22" y="14" width="38" height="46" rx="4" fill="#fff" stroke="#0D9488" stroke-width="2.5"/>' +
      '<path d="M29 26h24M29 34h24M29 42h14" stroke="#99d6cf" stroke-width="3" stroke-linecap="round"/></g>' +
      '<g transform="rotate(6 78 40)"><rect x="58" y="10" width="38" height="46" rx="4" fill="#fff" stroke="#F59E0B" stroke-width="2.5"/>' +
      '<path d="M65 22h24M65 30h24M65 38h14" stroke="#fcd9a0" stroke-width="3" stroke-linecap="round"/></g>' +
      '<path d="M16 52h88l-6 32a5 5 0 0 1-5 4H27a5 5 0 0 1-5-4z" fill="url(#rpw)"/>' +
      '<path d="M16 52h88" stroke="#6b4118" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="46" y="60" width="28" height="12" rx="3" fill="#fff8e6" stroke="#6b4118" stroke-width="1.5"/>' +
      '<path d="M52 66h16" stroke="#8F5A2A" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>';
  }
  function flameArt(lit) {
    var c1 = lit ? '#F97316' : '#CBD5E1', c2 = lit ? '#FBBF24' : '#E2E8F0';
    return '<svg viewBox="0 0 40 52" width="100%" height="100%" aria-hidden="true">' +
      '<path d="M20 2c2 9 12 13 12 26a12 12 0 0 1-24 0c0-6 3-9 5-12 1 4 3 5 5 5-2-7 0-13 2-19z" fill="' + c1 + '"/>' +
      '<path d="M20 22c1 5 6 7 6 14a6 6 0 0 1-12 0c0-4 2-5 3-7 1 2 2 2 3 2-1-3-1-6 0-9z" fill="' + c2 + '"/></svg>';
  }
  function flameHtml(n, big) {
    return '<span class="rp-flame-art' + (n > 0 ? ' lit' : '') + '">' + flameArt(n > 0) + '</span>' +
      '<span class="rp-flame-n"><b>' + n + '</b> ' + esc(n === 1 ? T('día seguido', 'day in a row') : T('días seguidos', 'days in a row')) + '</span>';
  }
  function doneArt() {
    return '<svg viewBox="0 0 80 80" width="100%" height="100%">' +
      '<circle cx="40" cy="40" r="34" fill="#CCFBF1" stroke="#0D9488" stroke-width="3"/>' +
      '<path d="M24 41l11 11 21-24" fill="none" stroke="#0D9488" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // A chess position from a FEN, drawn with the standard piece symbols.
  function boardSvg(fen) {
    var GL = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    var rows = fen.split(' ')[0].split('/'), cells = '', y, x, f, ch, side = fen.split(' ')[1] === 'b' ? T('Mueven las negras', 'Black to move') : T('Mueven las blancas', 'White to move');
    for (y = 0; y < 8; y++) {
      x = 0;
      for (f = 0; f < rows[y].length; f++) {
        ch = rows[y][f];
        if (/[1-8]/.test(ch)) { x += +ch; continue; }
        cells += '<text x="' + (x * 40 + 20) + '" y="' + (y * 40 + 31) + '" text-anchor="middle" font-size="34" class="' + (ch === ch.toUpperCase() ? 'w' : 'b') + '">' + GL[ch] + '</text>';
        x++;
      }
    }
    var sq = '';
    for (y = 0; y < 8; y++) for (x = 0; x < 8; x++) sq += '<rect x="' + x * 40 + '" y="' + y * 40 + '" width="40" height="40" fill="' + ((x + y) % 2 ? '#8FB8A8' : '#EAF3EE') + '"/>';
    return '<svg viewBox="0 0 320 320" role="img" aria-label="' + esc(side) + '">' + sq + cells + '</svg><div class="rp-side">' + esc(side) + '</div>';
  }

  // ── home ─────────────────────────────────────────────────────
  function renderHome() {
    var c = Review.counts(USER.name);
    $('rp-hero-art').innerHTML = boxArt();
    $('rp-title').textContent = T('Repaso del día', 'Daily review');
    $('rp-sub').textContent = T('Lo que se te escapó, otra vez, con calma.', 'What slipped by, once more, calmly.');
    $('rp-flame').innerHTML = flameHtml(c.streak);
    var due = c.due;
    $('rp-due').innerHTML = due > 0
      ? '<b>' + due + '</b> <span>' + esc(due === 1 ? T('por repasar', 'to review') : T('por repasar', 'to review')) + '</span>'
      : '<span class="rp-clear">' + esc(c.doneToday ? T('¡Listo por hoy!', 'All done for today!') : T('Nada por repasar hoy', 'Nothing to review today')) + '</span>';
    var go = $('rp-go');
    go.textContent = due > 0 ? T('Empezar', 'Start') : T('Volver al inicio', 'Back to home');
    go.onclick = due > 0 ? function() { start(false); } : function() { location.href = 'index.html'; };
    $('rp-note').textContent = due > 0
      ? T('Son unos 5 minutos.', 'It takes about 5 minutes.')
      : T('Cuando falles algo en otra app, aparecerá aquí mañana.', 'When you miss something in another app, it shows up here tomorrow.');
    $('rp-boxes-title').textContent = T('Tus cajas', 'Your boxes');
    var gaps = Review.GAPS, max = Math.max.apply(null, c.boxes.concat([1]));
    $('rp-boxes').innerHTML = c.boxes.map(function(n, i) {
      return '<div class="rp-box"><div class="rp-box-bar"><i style="height:' + Math.round(n / max * 100) + '%"></i></div>' +
        '<b>' + n + '</b><span>' + esc(T('Caja ', 'Box ')) + (i + 1) + '</span><small>' + gaps[i] + ' ' + esc(T('d', 'd')) + '</small></div>';
    }).join('') +
      '<div class="rp-box done"><div class="rp-box-bar"><i style="height:' + Math.round(Math.min(1, c.retired / Math.max(1, c.retired + c.total)) * 100) + '%"></i></div>' +
      '<b>' + c.retired + '</b><span>' + esc(T('Dominadas', 'Mastered')) + '</span><small>⭐</small></div>';
    show('rp-home');
  }

  // ── a session ────────────────────────────────────────────────
  function start(more) {
    S.queue = Review.due(USER.name, sessionSize());
    S.i = 0; S.right = 0; S.answered = 0; S.more = !!more;
    if (!S.queue.length) { renderHome(); return; }
    show('rp-quiz');
    showItem();
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function dots() {
    var n = S.queue.length, h = '';
    for (var k = 0; k < n; k++) h += '<i class="' + (k < S.i ? 'done' : (k === S.i ? 'now' : '')) + '"></i>';
    $('rp-dots').innerHTML = h;
    $('rp-dots').setAttribute('aria-label', T('Pregunta ', 'Question ') + (S.i + 1) + ' / ' + n);
  }

  function showItem() {
    var it = S.queue[S.i];
    S.item = it; S.locked = false;
    dots();
    $('rp-from').textContent = appName(it.app);
    $('rp-prompt').textContent = it.prompt;
    var bd = $('rp-board');
    if (it.fen) { bd.innerHTML = boardSvg(it.fen); bd.hidden = false; } else { bd.innerHTML = ''; bd.hidden = true; }
    $('rp-feedback').textContent = '';
    $('rp-feedback').className = 'rp-feedback';
    $('rp-next').hidden = true;
    $('rp-selfcheck').hidden = true;
    var box = $('rp-choices'), reveal = $('rp-reveal');
    box.innerHTML = '';
    if (it.choices && it.choices.length >= 2) {
      reveal.hidden = true;
      box.hidden = false;
      shuffle(it.choices).forEach(function(ch) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'rp-choice'; b.textContent = ch; b.dataset.v = ch;
        b.onclick = function() { choose(b, ch); };
        box.appendChild(b);
      });
    } else {
      box.hidden = true;
      reveal.hidden = false;
      $('rp-show').textContent = T('Mostrar la respuesta', 'Show the answer');
      $('rp-show').onclick = function() {
        reveal.hidden = true;
        $('rp-feedback').className = 'rp-feedback info';
        $('rp-feedback').textContent = T('Respuesta: ', 'Answer: ') + it.answer;
        $('rp-knew').textContent = T('Lo sabía', 'I knew it');
        $('rp-notyet').textContent = T('Todavía no', 'Not yet');
        $('rp-knew').onclick = function() { resolve(true); };
        $('rp-notyet').onclick = function() { resolve(false); };
        $('rp-selfcheck').hidden = false;
      };
    }
  }

  function correctChoice(it) { return it.answer.length > 80 ? it.answer.slice(0, 80) : it.answer; }

  function choose(btn, ch) {
    if (S.locked) return;
    S.locked = true;
    var it = S.item, ok = ch === correctChoice(it);
    Array.prototype.forEach.call($('rp-choices').querySelectorAll('.rp-choice'), function(b) {
      b.disabled = true;
      if (b.dataset.v === correctChoice(it)) b.classList.add('right');
    });
    if (!ok) btn.classList.add('wrong');
    $('rp-feedback').className = 'rp-feedback ' + (ok ? 'good' : 'info');
    $('rp-feedback').textContent = ok ? T('¡Eso es!', 'That\'s it!') : T('La respuesta: ', 'The answer: ') + it.answer;
    resolve(ok, true);
  }

  // `shown`: the feedback is already on screen (multiple choice).
  function resolve(ok, shown) {
    if (!shown && S.locked) return;
    S.locked = true;
    var it = S.item;
    if (ok) { Review.hit(USER.name, it.id); S.right++; sfx('correct'); }
    else { Review.miss(USER.name, it.id); sfx('wrong'); }
    S.answered++;
    $('rp-selfcheck').hidden = true;
    if (!shown) {
      $('rp-feedback').className = 'rp-feedback ' + (ok ? 'good' : 'info');
      $('rp-feedback').textContent = ok ? T('¡Muy bien!', 'Well done!') : T('Mañana lo vemos de nuevo.', 'We\'ll see it again tomorrow.');
    }
    var last = S.i + 1 >= S.queue.length;
    var nx = $('rp-next');
    nx.textContent = last ? T('Terminar', 'Finish') : T('Siguiente', 'Next');
    nx.hidden = false;
    nx.onclick = function() { if (last) finish(); else { S.i++; showItem(); } };
    try { nx.focus({ preventScroll: true }); } catch (e) {}
  }

  function finish() {
    var r = Review.complete(USER.name, S.answered);
    var left = Review.dueCount(USER.name);
    $('rp-done-art').innerHTML = doneArt();
    $('rp-done-title').textContent = T('¡Repaso listo!', 'Review done!');
    $('rp-done-sum').textContent = S.right + ' / ' + S.answered + ' ' + T('bien', 'right');
    $('rp-done-star').textContent = r.first ? T('⭐ ¡Ganaste 1 estrella!', '⭐ You earned 1 star!') : '';
    $('rp-done-flame').innerHTML = flameHtml(r.streak, true);
    var more = $('rp-more');
    more.hidden = left <= 0;
    more.textContent = T('Repasar más', 'Review more') + ' (' + left + ')';
    more.onclick = function() { start(true); };
    $('rp-back').textContent = T('Volver al inicio', 'Back to home');
    if (r.first) sfx('star');
    show('rp-done');
    try { if (typeof ActivityLog !== 'undefined' && ActivityLog.log) ActivityLog.log('Repaso', '🔁', 'Reviewed ' + S.answered + ' item' + (S.answered === 1 ? '' : 's') + ' — ' + S.right + ' right'); } catch (e) {}
  }

  // ── start ────────────────────────────────────────────────────
  function boot() {
    document.documentElement.lang = (typeof getKidLang === 'function' && getKidLang(USER.name) === 'en') ? 'en' : 'es';
    renderHome();
  }
  function begin() {
    try {
      var k = Review.PREFIX + USER.name.toLowerCase().replace(/\s+/g, '_');
      if (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pull) {
        var p = CloudSync.pull(k);
        if (p && p.then) { p.then(boot, boot); return; }
      }
    } catch (e) {}
    boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin); else begin();

  window.Repaso = { start: start, renderHome: renderHome };
})();
