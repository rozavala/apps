/* ================================================================
   MONEY MASTER — Coins, notes, counting and making change.
   CLP (Chilean peso) and USD. Per-kid storage at zs_money_<key>:
     { clp: { <mode>: { score, stars, ts } }, usd: { ... } }
   The suite's star rule (js/auth.js) sums `stars` across currencies
   and modes, so new modes simply add their own { score, stars } entry.
   Art: js/money-master-art.js · data: js/money-master-data.js
   ================================================================ */

(function () {
  'use strict';

  var D = window.MM_DATA, A = window.MMArt;
  var ROUND_LEN = 10;
  var STORAGE_PREFIX = 'zs_money_';
  var PREF_KEY = 'zs_money_pref';
  var RATE = D.EXAMPLE_RATE;

  // minTier: 0 beginner (≤5) · 1 intermediate (6–8) · 2 advanced (9–11) · 3 expert (12+)
  var MODES = [
    { id: 'identify', name: 'Identify', es: 'Identificar', desc: 'Look closely at a coin or note. What is it worth — and who is on it?', minTier: 0 },
    { id: 'count', name: 'Count Up', es: 'Contar', desc: 'Slide each piece across the counter and add it all up.', minTier: 0 },
    { id: 'change', name: 'Make Change', es: 'Dar vuelto', desc: 'Run the shop till: take the change from the drawer.', minTier: 0 },
    { id: 'challenge', name: 'Challenge', es: 'Desafío', desc: 'Harder mix: totals, discounts, fewest coins and word problems.', minTier: 0 },
    { id: 'fewest', name: 'Fewest Pieces', es: 'Menos piezas', desc: 'Make an amount with as few coins and notes as possible.', minTier: 1 },
    { id: 'budget', name: 'Shopping List', es: 'Lista de compras', desc: 'Fill the basket, stay on budget and work out what is left.', minTier: 1 },
    { id: 'compare', name: 'Pesos ↔ Dollars', es: 'Pesos ↔ Dólares', desc: 'Weigh pesos against dollars using an example rate.', minTier: 1, saveCur: 'clp' }
  ];
  var TIER_NAMES = ['Starter', 'Explorer', 'Advanced', 'Expert'];

  // ---------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function _userKey() {
    if (typeof getActiveUser === 'function') {
      var u = getActiveUser();
      if (u && u.name) return u.name.toLowerCase().replace(/\s+/g, '_');
    }
    return '_default';
  }
  function _load() {
    try { var raw = localStorage.getItem(STORAGE_PREFIX + _userKey()); return raw ? (JSON.parse(raw) || {}) : {}; }
    catch (e) { return {}; }
  }
  function _save(data) { try { localStorage.setItem(STORAGE_PREFIX + _userKey(), JSON.stringify(data)); } catch (e) {} }
  function _loadPref() { try { var raw = localStorage.getItem(PREF_KEY); return raw ? (JSON.parse(raw) || {}) : {}; } catch (e) { return {}; } }
  function _savePref(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {} }

  function _rand(n) { return Math.floor(Math.random() * n); }
  function _pick(arr) { return arr[_rand(arr.length)]; }
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = _rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function _range(a, b, step) { var o = []; for (var x = a; x <= b; x += step) o.push(x); return o; }

  function fmt(currency, v) {
    if (currency === 'USD') {
      if (v < 100) return v + '¢';
      var d = Math.floor(v / 100), r = v % 100;
      return '$' + d + (r ? '.' + (r < 10 ? '0' : '') + r : '');
    }
    return '$' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function fmtUsdFull(c) { var d = Math.floor(c / 100), r = c % 100; return '$' + d + '.' + (r < 10 ? '0' : '') + r; }
  function fmtCur(cur, v) { return cur === 'USD' ? 'US' + (v < 100 ? '$0.' + (v < 10 ? '0' : '') + v : fmt('USD', v)) : fmt('CLP', v); }

  function tierIdx() {
    var t = 'intermediate';
    try { var u = typeof getActiveUser === 'function' ? getActiveUser() : null; if (typeof getAgeTier === 'function') t = getAgeTier(u && u.age); } catch (e) {}
    return { beginner: 0, intermediate: 1, advanced: 2, expert: 3 }[t] != null ? { beginner: 0, intermediate: 1, advanced: 2, expert: 3 }[t] : 1;
  }

  function denoms(cur, opts) {
    opts = opts || {};
    return D.list(cur).filter(function (d) { return opts.rare || !d.rare; });
  }
  function vals(cur, opts) { return denoms(cur, opts).map(function (d) { return d.v; }); }
  function pname(d) { return d.fig === 'mapuche' ? 'A Mapuche woman' : d.person; }
  function kindWord(d) { return d.kind === 'coin' ? 'coin' : 'note'; }
  // "a pencil", "an apple", "crayons", "bread"
  var NO_ART = { bread: 1, milk: 1, crayons: 1, cookies: 1, stickers: 1 };
  function withArt(it) { return NO_ART[it.id] ? it.en : (/^[aeiou]/.test(it.en) ? 'an ' : 'a ') + it.en; }

  // Greedy breakdown (canonical sets) — used for showing amounts.
  function breakdown(cur, amount, maxV) {
    var vs = vals(cur).filter(function (v) { return !maxV || v <= maxV; }).sort(function (a, b) { return b - a; });
    var out = [], rem = amount;
    vs.forEach(function (v) { while (rem >= v) { out.push(v); rem -= v; } });
    return out;
  }
  // Exact minimum number of pieces (DP), returns list of values.
  function fewestSet(cur, amount, pool) {
    var vs = (pool || vals(cur)).slice().sort(function (a, b) { return a - b; });
    var unit = vs[0], n = Math.round(amount / unit), best = [0], from = [0];
    for (var i = 1; i <= n; i++) {
      best[i] = Infinity;
      for (var j = 0; j < vs.length; j++) {
        var u = vs[j] / unit;
        if (u <= i && best[i - u] + 1 < best[i]) { best[i] = best[i - u] + 1; from[i] = vs[j]; }
      }
    }
    var out = [], k = n;
    while (k > 0 && from[k]) { out.push(from[k]); k -= from[k] / unit; }
    return out.sort(function (a, b) { return b - a; });
  }

  // ---------------------------------------------------------------
  // sound — a light coin "clink" and register bell (own context)
  // ---------------------------------------------------------------
  var _ac = null;
  function ac() {
    try {
      if (!_ac) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; _ac = new C(); }
      if (_ac.state === 'suspended') _ac.resume();
      return _ac;
    } catch (e) { return null; }
  }
  function tone(f, t0, dur, vol, type) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(vol, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.02);
  }
  function clink(isNote) {
    if (isNote) { tone(420, 0, 0.06, 0.05, 'triangle'); tone(300, 0.03, 0.07, 0.04, 'triangle'); return; }
    var b = 2300 + Math.random() * 500;
    tone(b, 0, 0.18, 0.05); tone(b * 1.52, 0, 0.12, 0.03); tone(b * 2.7, 0.005, 0.07, 0.02);
  }
  function kaching() { tone(1568, 0, 0.5, 0.06); tone(2093, 0.09, 0.7, 0.06); tone(2637, 0.09, 0.6, 0.03); }
  function sfx(name) { try { if (typeof SFX !== 'undefined' && SFX[name]) SFX[name](); } catch (e) {} }

  // ---------------------------------------------------------------
  // sizes + piece art
  // ---------------------------------------------------------------
  function sz() {
    var w = window.innerWidth || 1024, small = w < 560;
    return {
      bankK: small ? 2.05 : 2.6, bankN: small ? 0.5 : 0.66,
      trayK: small ? 2.25 : 2.8, trayN: small ? 0.7 : 0.92,
      panK: small ? 1.5 : 2.0, panN: small ? 0.36 : 0.5,
      bigK: small ? 6.2 : 8, bigN: Math.min(small ? 2.3 : 2.6, (Math.min(w, 1060) - (small ? 64 : 520)) / 150)
    };
  }
  function art(cur, v, where, side) {
    var d = D.find(cur, v), S = sz();
    if (!d) return '';
    if (d.kind === 'coin') return A.coin(d, { px: Math.round(d.mm * S[where + 'K']), side: side || 'rev' });
    return A.note(d, { px: Math.round(d.wmm * S[where + 'N']), side: side || 'obv' });
  }
  function pieceDims(cur, v, where) {
    var d = D.find(cur, v), S = sz();
    if (d.kind === 'coin') { var p = Math.round(d.mm * S[where + 'K']); return { w: p, h: Math.round(p * 1.05) }; }
    var w = Math.round(d.wmm * S[where + 'N']); return { w: w, h: Math.round(w * d.hmm / d.wmm) };
  }
  function strip(cur, list, where) {
    return '<div class="mm-strip">' + list.map(function (v) { return '<span class="mm-strip-p">' + art(cur, v, where || 'pan') + '</span>'; }).join('') + '</div>';
  }
  function svgStar(on, px) {
    return '<svg viewBox="0 0 24 24" width="' + (px || 18) + '" height="' + (px || 18) + '" aria-hidden="true" class="mm-star' + (on ? ' on' : '') + '"><path d="M12 2.2l2.95 6.3 6.85.75-5.1 4.65 1.42 6.8L12 17.3l-6.12 3.4 1.42-6.8L2.2 9.25l6.85-.75z"/></svg>';
  }

  // ---------------------------------------------------------------
  // state
  // ---------------------------------------------------------------
  var state = { currency: 'CLP', mode: null, tier: 1, qIdx: 0, score: 0, correct: 0, q: null, seen: {}, locked: false, tries: 0, results: [] };
  var Z = {};          // drag zones of the current question
  var drag = null;
  function _root() { return document.getElementById('mm-wrap'); }
  function $(id) { return document.getElementById(id); }

  // ---------------------------------------------------------------
  // HOME
  // ---------------------------------------------------------------
  function open() {
    A.ensureDefs();
    var pref = _loadPref();
    state.currency = pref.currency === 'USD' ? 'USD' : 'CLP';
    _bindOnce();
    _renderHome();
  }

  function heroArt(cur) {
    var notes = cur === 'USD' ? [2000, 1000, 500, 100] : [20000, 10000, 5000, 2000, 1000];
    var coins = cur === 'USD' ? [25, 1, 10, 5] : [500, 100, 50, 10];
    var o = '<div class="mm-hero-fan">';
    notes.forEach(function (v, i) {
      var d = D.find(cur, v);
      o += '<span class="mm-hero-note" style="--i:' + i + ';--n:' + notes.length + '">' + A.note(d, { px: Math.round(d.wmm * 1.05), side: 'obv' }) + '</span>';
    });
    o += '</div><div class="mm-hero-coins">';
    coins.forEach(function (v, i) {
      var d = D.find(cur, v);
      o += '<span class="mm-hero-coin" style="--i:' + i + '">' + A.coin(d, { px: Math.round(d.mm * 2.7), side: i % 2 ? 'obv' : 'rev' }) + '</span>';
    });
    return o + '</div>';
  }

  function _renderHome() {
    state.mode = null; Z = {};
    var data = _load();
    var tier = state.tier = tierIdx();
    var cards = MODES.filter(function (m) {
      var ck = m.saveCur || state.currency.toLowerCase();
      return m.minTier <= tier || (data[ck] && data[ck][m.id]);
    }).map(function (m) {
      var ck = m.saveCur || state.currency.toLowerCase();
      var best = (data[ck] && data[ck][m.id]) || null;
      var st = best ? (best.stars || 0) : 0;
      var stars = svgStar(st >= 1) + svgStar(st >= 2) + svgStar(st >= 3);
      var bestText = best && best.score ? 'Best ' + best.score + '/' + ROUND_LEN : 'Not played yet';
      return '<button type="button" class="mm-mode-card" data-act="start" data-mode="' + m.id + '" aria-label="' + esc(m.name + ' — ' + m.desc) + '">' +
        '<span class="mm-mode-art" aria-hidden="true">' + A.modeIcon(m.id, state.currency, D) + '</span>' +
        '<span class="mm-mode-txt"><span class="mm-mode-name">' + m.name + '</span>' +
        '<span class="mm-mode-es">' + m.es + '</span>' +
        '<span class="mm-mode-desc">' + m.desc + '</span>' +
        '<span class="mm-mode-best"><span class="mm-stars">' + stars + '</span>' + bestText + '</span></span>' +
      '</button>';
    }).join('');
    cards += '<button type="button" class="mm-mode-card mm-mode-museum" data-act="museum" aria-label="Money Museum — fact cards about every coin and note">' +
      '<span class="mm-mode-art" aria-hidden="true">' + A.modeIcon('museum', state.currency, D) + '</span>' +
      '<span class="mm-mode-txt"><span class="mm-mode-name">Money Museum</span><span class="mm-mode-es">Museo del dinero</span>' +
      '<span class="mm-mode-desc">Who is on each coin and note, and what is on the back.</span>' +
      '<span class="mm-mode-best mm-muted">Fact cards · Fichas</span></span></button>';

    var cClp = D.find('CLP', 100), cUsd = D.find('USD', 25);
    _root().innerHTML =
      '<header class="mm-header">' +
        '<div class="mm-hero" aria-hidden="true">' + heroArt(state.currency) + '</div>' +
        '<h1>Money Master</h1>' +
        '<p class="mm-sub">Coins, notes and making change · <span lang="es">Monedas, billetes y vuelto</span></p>' +
      '</header>' +
      '<div class="mm-currency" role="group" aria-label="Choose currency">' +
        '<button type="button" data-act="cur" data-cur="CLP" aria-pressed="' + (state.currency === 'CLP') + '" class="' + (state.currency === 'CLP' ? 'active' : '') + '">' +
          '<span class="mm-cur-coin" aria-hidden="true">' + A.coin(cClp, { px: 34, side: 'rev' }) + '</span>Pesos <small>CLP</small></button>' +
        '<button type="button" data-act="cur" data-cur="USD" aria-pressed="' + (state.currency === 'USD') + '" class="' + (state.currency === 'USD' ? 'active' : '') + '">' +
          '<span class="mm-cur-coin" aria-hidden="true">' + A.coin(cUsd, { px: 34, side: 'obv' }) + '</span>Dollars <small>USD</small></button>' +
      '</div>' +
      '<p class="mm-tier">Puzzles set to <b>' + TIER_NAMES[tier] + '</b> for this player</p>' +
      '<div class="mm-mode-grid">' + cards + '</div>';
  }

  function setCurrency(c) {
    if (c !== 'CLP' && c !== 'USD') return;
    state.currency = c;
    _savePref({ currency: c });
    _renderHome();
  }

  // ---------------------------------------------------------------
  // MUSEUM (fact cards)
  // ---------------------------------------------------------------
  function _renderMuseum() {
    state.mode = null; Z = {};
    var cur = state.currency;
    var cards = D.list(cur).map(function (d) {
      var a = d.kind === 'coin' ? A.coin(d, { px: Math.round(d.mm * 3.4), side: 'obv' }) : A.note(d, { px: 168, side: 'obv' });
      return '<button type="button" class="mm-mus-card" data-act="card" data-v="' + d.v + '" aria-label="' + esc(d.label + ' ' + kindWord(d) + ' — ' + pname(d)) + '">' +
        '<span class="mm-mus-art">' + a + '</span>' +
        '<span class="mm-mus-name">' + d.label + ' <small>' + (d.kind === 'coin' ? 'coin · moneda' : 'note · billete') + '</small></span>' +
        '<span class="mm-mus-who">' + esc(pname(d)) + '</span></button>';
    }).join('');
    _root().innerHTML =
      '<div class="mm-game">' + topBar('Money Museum', 'Museo del dinero', false) +
      '<p class="mm-mus-intro">Tap a piece to see both sides. These drawings are simplified illustrations for learning — not real money.' +
      '<br><span lang="es">Toca una pieza para ver sus dos caras. Son ilustraciones simplificadas para aprender, no dinero real.</span></p>' +
      '<div class="mm-mus-grid">' + cards + '</div></div>' +
      '<div class="mm-overlay" id="mm-overlay" hidden></div>';
  }

  function _openCard(v, opener) {
    var d = D.find(state.currency, v); if (!d) return;
    var ov = $('mm-overlay'); if (!ov) return;
    var S = window.innerWidth < 560;
    var big = function (side) { return d.kind === 'coin' ? A.coin(d, { px: Math.round(d.mm * (S ? 5.4 : 7)), side: side }) : A.note(d, { px: Math.min(S ? 330 : 400, (window.innerWidth || 400) - 48), side: side }); };
    var row = function (label, es, f) { return f ? '<div class="mm-fact-row"><div class="mm-fact-k">' + label + ' <span lang="es">· ' + es + '</span></div><p>' + esc(f.en) + '</p><p class="mm-es" lang="es">' + esc(f.es) + '</p></div>' : ''; };
    ov.innerHTML = '<div class="mm-card-dlg" role="dialog" aria-modal="true" aria-labelledby="mm-card-title">' +
      '<button type="button" class="mm-x" data-act="closecard" aria-label="Close">×</button>' +
      '<h2 id="mm-card-title">' + d.label + ' <small>' + (d.kind === 'coin' ? 'coin · moneda' : 'note · billete') + '</small></h2>' +
      '<div class="mm-card-sides ' + d.kind + '"><figure>' + big('obv') + '<figcaption>Front · Anverso</figcaption></figure>' +
      '<figure>' + big('rev') + '<figcaption>Back · Reverso</figcaption></figure></div>' +
      (d.colour ? '<p class="mm-card-col"><span class="mm-swatch" style="background:' + d.tint + ';border-color:' + d.ink + '"></span>Main colour: <b>' + esc(d.colour.en) + '</b> · <span lang="es">' + esc(d.colour.es) + '</span></p>' : '') +
      row('Who is on it', 'Quién aparece', d.who) + row('On the back', 'En el reverso', d.back) + row('Did you know?', '¿Sabías que…?', d.more) +
      '<p class="mm-card-note">Illustration for learning, marked MUESTRA · SAMPLE — not an exact copy.</p>' +
      '</div>';
    ov.hidden = false;
    ov._opener = opener;
    var x = ov.querySelector('.mm-x'); if (x) x.focus();
  }
  function _closeCard() {
    var ov = $('mm-overlay'); if (!ov || ov.hidden) return;
    ov.hidden = true; ov.innerHTML = '';
    if (ov._opener && ov._opener.focus) ov._opener.focus();
  }

  // ---------------------------------------------------------------
  // GAME FRAME
  // ---------------------------------------------------------------
  function topBar(title, es, showScore) {
    return '<div class="mm-topbar">' +
      '<button type="button" class="mm-back-btn" data-act="back" aria-label="Back to modes">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="mm-title"><b>' + title + '</b><span lang="es">' + es + '</span></div>' +
      (showScore ? '<div class="mm-score" aria-label="Score">' + svgStar(true, 18) + '<span id="mm-score">' + state.score + '</span></div>' : '') +
    '</div>';
  }

  function start(mode) {
    var m = MODES.filter(function (x) { return x.id === mode; })[0];
    if (!m) return;
    state.mode = mode; state.qIdx = 0; state.score = 0; state.correct = 0; state.seen = {}; state.results = [];
    state.tier = tierIdx();
    _nextQuestion();
  }

  function _gen() {
    var fn = GEN[state.mode];
    var q = null;
    for (var k = 0; k < 40; k++) {
      q = fn(state.currency, state.tier);
      if (!state.seen[q.fp]) break;
    }
    state.seen[q.fp] = 1;
    return q;
  }

  function _nextQuestion() {
    if (state.qIdx >= ROUND_LEN) return _renderResults();
    state.q = _gen();
    state.locked = false; state.tries = 0;
    _renderQuestion();
  }

  function _renderQuestion() {
    var q = state.q, m = MODES.filter(function (x) { return x.id === state.mode; })[0];
    Z = {};
    var steps = '';
    for (var i = 0; i < ROUND_LEN; i++) {
      var r = state.results[i];
      steps += '<span class="' + (i === state.qIdx ? 'now' : r === true ? 'good' : r === false ? 'bad' : '') + '"></span>';
    }
    _root().innerHTML =
      '<div class="mm-game mm-g-' + state.mode + ' mm-ui-' + q.ui + '">' +
        topBar(m.name, m.es, true) +
        '<div class="mm-steps" aria-label="Question ' + (state.qIdx + 1) + ' of ' + ROUND_LEN + '">' + steps + '</div>' +
        '<div class="mm-play">' +
          '<div class="mm-stage" id="mm-stage">' + (q.stage || '') + '</div>' +
          '<div class="mm-side">' +
            '<div class="mm-prompt"><div class="mm-qn">Question ' + (state.qIdx + 1) + ' of ' + ROUND_LEN + '</div>' +
              '<h2 id="mm-prompt-text">' + q.prompt + '</h2>' + (q.promptEs ? '<p class="mm-es" lang="es">' + q.promptEs + '</p>' : '') + '</div>' +
            '<div id="mm-answer" class="mm-answer"></div>' +
            '<div id="mm-feedback" class="mm-feedback" aria-live="polite"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (UI[q.ui] && UI[q.ui].mount) UI[q.ui].mount(q);
  }

  function _setScore() { var el = $('mm-score'); if (el) { el.textContent = state.score; el.parentNode.classList.remove('bump'); void el.offsetWidth; el.parentNode.classList.add('bump'); } }

  var GOOD = ['Correct!', 'Exactly right!', 'Well done!', 'Spot on!', 'Great counting!'];
  var GOOD_ES = ['¡Correcto!', '¡Exacto!', '¡Bien hecho!', '¡Muy bien!', '¡Excelente!'];

  function finish(ok, html, fact) {
    if (state.locked) return;
    state.locked = true;
    state.results[state.qIdx] = ok;
    if (ok) { state.score++; state.correct++; _setScore(); }
    var stepEls = document.querySelectorAll('.mm-steps span');
    if (stepEls[state.qIdx]) stepEls[state.qIdx].className = ok ? 'good' : 'bad';
    var k = _rand(GOOD.length);
    var fb = $('mm-feedback');
    if (fb) {
      fb.innerHTML = '<div class="mm-fb ' + (ok ? 'good' : 'bad') + '">' +
        '<span class="mm-fb-icon" aria-hidden="true">' + (ok
          ? '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<svg viewBox="0 0 24 24"><path d="M12 6v7M12 17.5v.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>') + '</span>' +
        '<div class="mm-fb-body"><b>' + (ok ? GOOD[k] + ' <span lang="es">' + GOOD_ES[k] + '</span>' : 'Not quite · <span lang="es">Casi</span>') + '</b>' +
        (html ? '<p>' + html + '</p>' : '') + '</div></div>' +
        (fact ? '<div class="mm-fact"><span class="mm-fact-tag">Did you know? · ¿Sabías que…?</span><p>' + esc(fact.en) + '</p><p class="mm-es" lang="es">' + esc(fact.es) + '</p></div>' : '') +
        '<button type="button" class="mm-btn mm-btn-primary mm-next" data-act="next">' + (state.qIdx + 1 >= ROUND_LEN ? 'See results' : 'Next') +
        ' <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      var nb = fb.querySelector('.mm-next');
      if (nb) {
        try { nb.focus({ preventScroll: true }); } catch (e) { nb.focus(); }
        setTimeout(function () { try { fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }, 60);
      }
    }
    var ans = $('mm-answer'); if (ans) ans.classList.add('done');
    if (ok) { sfx('correct'); _burst(); } else sfx('wrong');
  }

  function _burst() {
    var st = $('mm-stage'); if (!st) return;
    var b = document.createElement('div');
    b.className = 'mm-burst'; b.setAttribute('aria-hidden', 'true');
    var h = '';
    for (var i = 0; i < 12; i++) h += '<i style="--a:' + (i * 30) + 'deg;--d:' + (60 + _rand(40)) + 'px"></i>';
    b.innerHTML = h;
    st.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 900);
  }

  function _next() { state.qIdx++; _nextQuestion(); }

  function _starsFor(score) {
    if (score >= ROUND_LEN) return 3;
    if (score >= Math.ceil(ROUND_LEN * 0.7)) return 2;
    if (score >= Math.ceil(ROUND_LEN * 0.4)) return 1;
    return 0;
  }

  function _renderResults() {
    var stars = _starsFor(state.score);
    var m = MODES.filter(function (x) { return x.id === state.mode; })[0] || {};
    var data = _load();
    var ck = m.saveCur || state.currency.toLowerCase();
    if (!data[ck] || typeof data[ck] !== 'object') data[ck] = {};
    var prev = data[ck][state.mode] || { score: 0, stars: 0 };
    var newRecord = state.score > (prev.score || 0);
    if (newRecord || stars > (prev.stars || 0)) {
      data[ck][state.mode] = {
        score: Math.max(prev.score || 0, state.score),
        stars: Math.max(prev.stars || 0, stars),
        ts: Date.now()
      };
      _save(data);
    }
    if (typeof ActivityLog !== 'undefined' && ActivityLog.push) {
      try {
        ActivityLog.push({ app: 'money', kind: 'round', meta: { mode: state.mode, currency: state.currency, score: state.score, stars: stars, newRecord: newRecord } });
      } catch (e) {}
    }
    var title = stars >= 3 ? 'Money Master!' : stars >= 2 ? 'Great work!' : stars >= 1 ? 'Nice try!' : 'Keep practising';
    var titleEs = stars >= 3 ? '¡Maestro del dinero!' : stars >= 2 ? '¡Muy buen trabajo!' : stars >= 1 ? '¡Buen intento!' : 'Sigue practicando';
    var big = '';
    for (var i = 0; i < 3; i++) big += '<span class="mm-rstar" style="--i:' + i + '">' + svgStar(i < stars, 64) + '</span>';
    _root().innerHTML =
      '<div class="mm-results">' +
        '<div class="mm-results-art" aria-hidden="true">' + heroArt(state.currency) + '</div>' +
        '<h2 class="mm-results-title">' + title + '</h2><p class="mm-es" lang="es">' + titleEs + '</p>' +
        '<div class="mm-stars-row" aria-label="' + stars + ' of 3 stars">' + big + '</div>' +
        '<p class="mm-results-sub">' + state.score + ' / ' + ROUND_LEN + ' correct' + (newRecord ? ' · New best!' : '') + '</p>' +
        '<div class="mm-results-btns">' +
          '<button type="button" class="mm-btn mm-btn-primary" data-act="start" data-mode="' + state.mode + '">Play again</button>' +
          '<button type="button" class="mm-btn mm-btn-secondary" data-act="back">Other modes</button>' +
        '</div>' +
      '</div>';
    if (stars > 0) for (var s = 0; s < stars; s++) setTimeout(function () { sfx('star'); }, 350 + s * 260);
    if (stars >= 3) setTimeout(function () { sfx('cheer'); }, 1200);
  }

  function back() { _closeCard(); _renderHome(); }

  // ---------------------------------------------------------------
  // ZONES — bank (endless supply), trays (lists of piece values)
  // ---------------------------------------------------------------
  function makeZone(name, el, cfg) {
    var z = { name: name, el: el, cfg: cfg, items: [] };
    Z[name] = z;
    renderZone(z);
    return z;
  }
  function zoneTotal(z) { return z.items.reduce(function (a, b) { return a + b; }, 0); }

  function renderZone(z, landIdx) {
    var cur = z.cfg.cur, el = z.el;
    if (!el) return;
    if (z.cfg.kind === 'bank') {
      var ds = z.cfg.denoms.map(function (v) { return D.find(cur, v); });
      var row = function (kind) {
        return '<div class="mm-bank-row ' + kind + '">' + ds.filter(function (d) { return d.kind === kind; }).map(function (d) {
          var dim = pieceDims(cur, d.v, 'bank');
          return '<button type="button" class="mm-slot mm-slot-' + d.kind + '" data-drag="1" data-zone="' + z.name + '" data-v="' + d.v + '" aria-label="Add ' + esc(d.label + ' ' + kindWord(d)) + '">' +
            '<span class="mm-slot-art" style="width:' + dim.w + 'px;height:' + dim.h + 'px">' +
              (d.kind === 'bill' ? '<span class="mm-slot-under">' + art(cur, d.v, 'bank') + '</span>' : '') + art(cur, d.v, 'bank') + '</span>' +
            (z.cfg.labels ? '<span class="mm-slot-lbl">' + d.label + '</span>' : '') + '</button>';
        }).join('') + '</div>';
      };
      el.innerHTML = row('bill') + row('coin');
      return;
    }
    // tray: group by value (largest first), pieces stacked in little piles
    var groups = {};
    z.items.forEach(function (v, i) { (groups[v] = groups[v] || []).push(i); });
    var keys = Object.keys(groups).map(Number).sort(function (a, b) { return b - a; });
    var h = '';
    keys.forEach(function (v) {
      var d = D.find(cur, v), idxs = groups[v], n = idxs.length, dim = pieceDims(cur, v, z.cfg.where || 'tray');
      var dx = d.kind === 'coin' ? Math.min(7, Math.max(3, 40 / n)) : Math.min(12, Math.max(4, 60 / n)), dy = d.kind === 'coin' ? 4 : 3;
      h += '<div class="mm-tg mm-tg-' + d.kind + '" style="width:' + (dim.w + (n - 1) * dx) + 'px;height:' + (dim.h + (n - 1) * dy) + 'px">';
      idxs.forEach(function (ix, k) {
        h += '<button type="button" class="mm-tp' + (ix === landIdx ? ' mm-land' : '') + '" data-drag="1" data-zone="' + z.name + '" data-i="' + ix + '" data-v="' + v + '"' +
          ' style="left:' + (k * dx) + 'px;top:' + ((n - 1 - k) * dy) + 'px;z-index:' + (k + 1) + '"' +
          ' aria-label="' + esc((z.cfg.tapLabel || 'Move') + ' ' + d.label + ' ' + kindWord(d)) + '">' + art(cur, v, z.cfg.where || 'tray') + '</button>';
      });
      if (z.cfg.badges && n > 1) h += '<span class="mm-tg-badge">×' + n + '</span>';
      if (z.cfg.badges) h += '<span class="mm-tg-lbl">' + d.label + '</span>';
      h += '</div>';
    });
    if (!keys.length) h = '<div class="mm-tray-empty">' + (z.cfg.empty || 'Drag or tap money here') + '</div>';
    el.innerHTML = '<div class="mm-tgroups">' + h + '</div>';
    if (z.cfg.onChange) z.cfg.onChange(z);
  }

  function flipFrom(el, fromRect) {
    if (!el || !fromRect) return;
    var svg = el.querySelector('svg') || el, r = svg.getBoundingClientRect();
    var dx = fromRect.left - r.left, dy = fromRect.top - r.top, s = fromRect.width / (r.width || 1);
    el.style.transition = 'none';
    el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    el.style.transformOrigin = '0 0';
    void el.offsetWidth;
    el.style.transition = 'transform .34s cubic-bezier(.2,.8,.25,1.08)';
    el.style.transform = '';
  }
  function ghostFly(svgEl, toRect, done) {
    if (!svgEl) { if (done) done(); return; }
    var r = svgEl.getBoundingClientRect();
    var g = document.createElement('div');
    g.className = 'mm-ghost';
    g.innerHTML = svgEl.outerHTML;
    g.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
    document.body.appendChild(g);
    void g.offsetWidth;
    g.style.transition = 'transform .3s ease-in, opacity .3s ease-in';
    if (toRect) g.style.transform = 'translate(' + toRect.left + 'px,' + toRect.top + 'px) scale(' + (toRect.width / (r.width || 1)) + ')';
    else { g.style.transform = 'translate(' + r.left + 'px,' + (r.top + 40) + 'px) scale(.6)'; }
    g.style.opacity = '0.1';
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); if (done) done(); }, 320);
  }

  function doMove(from, i, v, to, fromRect, srcEl) {
    if (state.locked || !from || !to || from === to) return;
    var d = D.find(from.cfg.cur, v);
    if (to.cfg.kind === 'tray' && to.cfg.max && to.items.length >= to.cfg.max) { _toast('The tray is full · La bandeja está llena'); return; }
    if (to.cfg.accept && !to.cfg.accept(v)) return;
    if (from.cfg.kind === 'tray') {
      from.items.splice(i, 1);
      renderZone(from);
    }
    if (to.cfg.kind === 'tray') {
      to.items.push(v);
      renderZone(to, to.items.length - 1);
      var ne = to.el.querySelector('.mm-tp[data-i="' + (to.items.length - 1) + '"]');
      flipFrom(ne, fromRect);
    } else {
      var slot = to.el.querySelector('.mm-slot[data-v="' + v + '"] .mm-slot-art svg:last-child');
      var tmp = document.createElement('div');
      tmp.innerHTML = art(from.cfg.cur, v, from.cfg.where || 'tray');
      var svg = tmp.firstChild;
      svg.style.position = 'fixed'; svg.style.left = fromRect.left + 'px'; svg.style.top = fromRect.top + 'px'; svg.style.visibility = 'hidden';
      document.body.appendChild(svg);
      ghostFly(svg, slot ? slot.getBoundingClientRect() : null);
      if (svg.parentNode) svg.parentNode.removeChild(svg);
    }
    clink(d && d.kind === 'bill');
  }

  function zoneAt(x, y) {
    var best = null;
    Object.keys(Z).forEach(function (k) {
      var z = Z[k]; if (!z.el || z.cfg.drop === false) return;
      var r = (z.cfg.dropEl || z.el).getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) best = z;
    });
    return best;
  }

  function _toast(msg) {
    var st = $('mm-stage'); if (!st) return;
    var t = document.createElement('div');
    t.className = 'mm-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    st.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1700);
  }

  // pointer drag & tap
  function onDown(e) {
    if (e.button > 0 || state.locked) return;
    var t = e.target.closest && e.target.closest('[data-drag]');
    if (!t || !_root().contains(t)) return;
    var z = Z[t.getAttribute('data-zone')]; if (!z) return;
    drag = { t: t, z: z, v: +t.getAttribute('data-v'), i: t.hasAttribute('data-i') ? +t.getAttribute('data-i') : -1, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, pid: e.pointerId, over: null };
    try { t.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && dx * dx + dy * dy > 64) {
      drag.moved = true;
      var svg = drag.t.querySelector('.mm-slot-art > svg:last-child') || drag.t.querySelector('svg');
      var r = svg.getBoundingClientRect();
      var g = document.createElement('div');
      g.className = 'mm-ghost dragging';
      g.innerHTML = svg.outerHTML;
      document.body.appendChild(g);
      drag.ghost = g; drag.off = { x: drag.x0 - r.left, y: drag.y0 - r.top };
      if (drag.z.cfg.kind === 'tray') drag.t.classList.add('mm-lifted');
    }
    if (drag.moved) {
      e.preventDefault();
      drag.ghost.style.transform = 'translate(' + (e.clientX - drag.off.x) + 'px,' + (e.clientY - drag.off.y) + 'px) rotate(-3deg) scale(1.08)';
      var zz = zoneAt(e.clientX, e.clientY);
      if (zz !== drag.over) {
        if (drag.over) drag.over.el.classList.remove('mm-over');
        if (zz && zz !== drag.z && zz.cfg.kind === 'tray') zz.el.classList.add('mm-over');
        drag.over = zz;
      }
    }
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var dg = drag; drag = null;
    if (dg.over) dg.over.el.classList.remove('mm-over');
    if (!dg.moved) {
      if (e.type === 'pointercancel') return;
      _lastTap = Date.now();
      tapMove(dg.z, dg.i, dg.v, dg.t);
      return;
    }
    _lastTap = Date.now();
    var target = e.type === 'pointercancel' ? null : zoneAt(e.clientX, e.clientY);
    var gr = dg.ghost.firstChild.getBoundingClientRect();
    if (target && target !== dg.z && !(dg.z.cfg.kind === 'bank' && target.cfg.kind === 'bank')) {
      if (target.cfg.kind === 'bank' || (dg.z.cfg.kind === 'tray' && target.cfg.kind !== 'tray')) {
        dg.ghost.parentNode.removeChild(dg.ghost);
        doMove(dg.z, dg.i, dg.v, target, gr);
      } else {
        dg.ghost.parentNode.removeChild(dg.ghost);
        doMove(dg.z, dg.i, dg.v, target, gr);
      }
    } else if (dg.z.cfg.kind === 'tray' && !target && dg.z.cfg.tapTo && Z[dg.z.cfg.tapTo] && Z[dg.z.cfg.tapTo].cfg.kind === 'bank') {
      // dragged a piece off the tray: put it back in the drawer / purse
      dg.ghost.parentNode.removeChild(dg.ghost);
      doMove(dg.z, dg.i, dg.v, Z[dg.z.cfg.tapTo], gr);
    } else {
      // snap back
      dg.t.classList.remove('mm-lifted');
      var src = (dg.t.querySelector('.mm-slot-art > svg:last-child') || dg.t.querySelector('svg')).getBoundingClientRect();
      var g = dg.ghost;
      g.style.transition = 'transform .25s ease-out';
      g.style.transform = 'translate(' + src.left + 'px,' + src.top + 'px)';
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 260);
    }
  }
  var _lastTap = 0;
  function tapMove(z, i, v, el) {
    var to = Z[z.cfg.tapTo]; if (!to) return;
    var svg = el.querySelector('.mm-slot-art > svg:last-child') || el.querySelector('svg');
    doMove(z, i, v, to, svg ? svg.getBoundingClientRect() : null, el);
  }

  function tally(el, cur, v, hidden) {
    if (!el) return;
    el.innerHTML = hidden ? '<span class="mm-tally-q">?</span>' : fmt(cur, v);
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  // Animate counting: highlight each piece in a tray, running total.
  function countAnim(z, startAt, order, tallyEl, done) {
    var cur = z.cfg.cur;
    var idxs = z.items.map(function (v, i) { return i; });
    idxs.sort(function (a, b) { return order === 'up' ? z.items[a] - z.items[b] : z.items[b] - z.items[a]; });
    var run = startAt, k = 0;
    if (tallyEl) tally(tallyEl, cur, run);
    function step() {
      if (k >= idxs.length || !z.el.isConnected) { if (done) done(run); return; }
      var ix = idxs[k++];
      run += z.items[ix];
      var el = z.el.querySelector('.mm-tp[data-i="' + ix + '"]');
      if (el) { el.classList.remove('mm-tick'); void el.offsetWidth; el.classList.add('mm-tick'); }
      if (tallyEl) tally(tallyEl, cur, run);
      clink(D.find(cur, z.items[ix]).kind === 'bill');
      setTimeout(step, idxs.length > 8 ? 220 : 340);
    }
    setTimeout(step, 250);
  }

  // ---------------------------------------------------------------
  // UI types
  // ---------------------------------------------------------------
  var UI = {};

  // -- multiple choice ------------------------------------------------
  UI.choice = {
    mount: function (q) {
      var ans = $('mm-answer');
      ans.innerHTML = '<div class="mm-options' + (q.optArt ? ' art' : '') + (q.options.length === 3 ? ' three' : '') + '" role="group" aria-label="Answers">' +
        q.options.map(function (o, i) {
          return '<button type="button" class="mm-option" data-act="opt" data-i="' + i + '"' + (o.aria ? ' aria-label="' + esc(o.aria) + '"' : '') + '>' + o.html + '</button>';
        }).join('') + '</div>';
      if (q.mount) q.mount(q);
    },
    pick: function (i, btn) {
      var q = state.q; if (state.locked) return;
      var o = q.options[i]; if (!o) return;
      var btns = document.querySelectorAll('#mm-answer .mm-option');
      for (var k = 0; k < btns.length; k++) {
        btns[k].disabled = true;
        if (q.options[k].correct) btns[k].classList.add('correct');
      }
      if (!o.correct) btn.classList.add('wrong');
      if (q.onAnswer) q.onAnswer(o.correct, o);
      finish(o.correct, o.correct ? (q.explainOk || q.explain) : q.explain, q.fact);
    }
  };

  // -- keypad (cash-register style entry) -----------------------------
  UI.keypad = {
    mount: function (q) {
      state.kp = '';
      var keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'del', '0', q.cur === 'CLP' ? '00' : 'clr'];
      $('mm-answer').innerHTML =
        '<div class="mm-kp" role="group" aria-label="Type your answer">' +
          '<div class="mm-kp-disp" id="mm-kp-disp" aria-live="polite">' + this.show(q) + '</div>' +
          '<div class="mm-kp-keys">' + keys.map(function (k) {
            var lbl = k === 'del' ? '⌫' : k === 'clr' ? 'C' : k;
            var aria = k === 'del' ? ' aria-label="Delete"' : k === 'clr' ? ' aria-label="Clear"' : '';
            return '<button type="button" class="mm-kp-key' + (k.length > 1 ? ' fn' : '') + '" data-act="kp" data-k="' + k + '"' + aria + '>' + lbl + '</button>';
          }).join('') + '</div>' +
          '<button type="button" class="mm-btn mm-btn-primary mm-kp-ok" data-act="kpok">Enter · Ingresar</button>' +
        '</div>';
      if (q.mount) q.mount(q);
    },
    show: function (q) {
      var n = parseInt(state.kp || '0', 10);
      return q.cur === 'USD' ? fmtUsdFull(n) : fmt('CLP', n);
    },
    key: function (k) {
      var q = state.q; if (state.locked) return;
      if (k === 'del') state.kp = state.kp.slice(0, -1);
      else if (k === 'clr') state.kp = '';
      else if (state.kp.length < 7) state.kp = (state.kp + k).replace(/^0+/, '');
      var d = $('mm-kp-disp'); if (d) d.textContent = this.show(q);
      clink(true);
    },
    ok: function () {
      var q = state.q; if (state.locked) return;
      var n = parseInt(state.kp || '0', 10);
      if (!state.kp) { _toast('Type an amount first · Escribe un monto'); return; }
      var ok = n === q.answer;
      if (q.onAnswer) q.onAnswer(ok);
      finish(ok, ok ? (q.explainOk || q.explain) : 'You typed ' + (q.cur === 'USD' ? fmt('USD', n) : fmt('CLP', n)) + '. ' + q.explain, q.fact);
    }
  };

  // -- build an amount on a tray from a bank --------------------------
  UI.build = {
    mount: function (q) {
      var self = this;
      var bank = makeZone('bank', $('mm-bank'), { kind: 'bank', cur: q.cur, denoms: q.bank, tapTo: 'tray', labels: state.tier <= 1, drop: true });
      bank.cfg.dropEl = $('mm-bank');
      makeZone('tray', $('mm-tray'), {
        kind: 'tray', cur: q.cur, tapTo: 'bank', badges: state.tier <= 1, max: 30, tapLabel: 'Put back',
        empty: q.empty || 'Drag or tap money here · Arrastra o toca',
        onChange: function (z) { self.update(q, z); }
      });
      $('mm-answer').innerHTML =
        '<div class="mm-build-btns">' +
          '<button type="button" class="mm-btn mm-btn-secondary" data-act="clear" aria-label="Clear the tray">Clear</button>' +
          '<button type="button" class="mm-btn mm-btn-primary" data-act="check">' + (q.checkLabel || 'Check') + '</button>' +
        '</div><p class="mm-hint" id="mm-hint">' + (q.hint || '') + '</p>';
      self.update(q, Z.tray);
      if (q.mount) q.mount(q);
    },
    update: function (q, z) {
      tally($('mm-tally'), q.cur, zoneTotal(z), !q.showTally);
      var pc = $('mm-pieces'); if (pc) pc.textContent = z.items.length;
    },
    clear: function () {
      if (state.locked || !Z.tray) return;
      Z.tray.items = []; renderZone(Z.tray);
    },
    check: function () {
      var q = state.q; if (state.locked || !Z.tray) return;
      var tot = zoneTotal(Z.tray), n = Z.tray.items.length;
      var res = q.judge(tot, n, Z.tray.items);
      if (res.ok) {
        finish(true, res.msg, q.fact);
        if (q.onWin) q.onWin(Z.tray);
        return;
      }
      state.tries++;
      var hint = $('mm-hint');
      if (state.tries < 2) {
        sfx('wrong');
        if (hint) { hint.innerHTML = res.msg + ' <b>Try again!</b> <span lang="es">¡Inténtalo otra vez!</span>'; hint.classList.add('warn'); }
        var tr = $('mm-tray'); if (tr) { tr.classList.remove('mm-shake'); void tr.offsetWidth; tr.classList.add('mm-shake'); }
        return;
      }
      if (hint) hint.textContent = '';
      finish(false, res.msg + ' ' + q.solution(), q.fact);
    }
  };

  // -- shopping (budget) ------------------------------------------------
  UI.shop = {
    mount: function (q) {
      q.basket = [];
      this.renderShelf(q);
      this.renderBasket(q);
      if (q.variant === 'best') {
        $('mm-answer').innerHTML = '<div class="mm-build-btns">' +
          '<button type="button" class="mm-btn mm-btn-secondary" data-act="shopclear">Empty basket</button>' +
          '<button type="button" class="mm-btn mm-btn-primary" data-act="shopcheck">Pay · Pagar</button></div><p class="mm-hint" id="mm-hint"></p>';
      } else {
        $('mm-answer').innerHTML = '<p class="mm-hint" id="mm-hint">Tap each item on your list · <span lang="es">Toca cada producto de tu lista</span></p>';
      }
    },
    renderShelf: function (q) {
      var el = $('mm-shelf'); if (!el) return;
      el.innerHTML = q.shelf.map(function (it, i) {
        var inB = q.basket.indexOf(i) >= 0;
        return '<button type="button" class="mm-shelf-item' + (inB ? ' taken' : '') + '" data-act="shelf" data-i="' + i + '" aria-label="' + esc(it.en + ', ' + fmt(q.cur, it.price)) + (inB ? ' (in basket)' : '') + '" aria-pressed="' + inB + '">' +
          '<span class="mm-shelf-art">' + A.item(it.id, 58) + '</span>' +
          '<span class="mm-tag"><span class="mm-tag-hole"></span>' + fmt(q.cur, it.price) + '</span>' +
          '<span class="mm-shelf-name">' + esc(it.en) + '</span></button>';
      }).join('');
    },
    renderBasket: function (q) {
      var el = $('mm-basket-items'); if (!el) return;
      el.innerHTML = q.basket.map(function (i, k) { return '<span class="mm-bi" style="--k:' + k + '">' + A.item(q.shelf[i].id, 56) + '</span>'; }).join('') ||
        '<span class="mm-basket-empty">Basket · Canasto</span>';
      var tot = q.basket.reduce(function (a, i) { return a + q.shelf[i].price; }, 0);
      var t = $('mm-basket-total');
      if (t) t.innerHTML = q.hideTotal ? 'Total: <b>?</b>' : 'Total: <b>' + fmt(q.cur, tot) + '</b>';
      var L = $('mm-list');
      if (L && q.list) L.innerHTML = q.list.map(function (i) {
        var done = q.basket.indexOf(i) >= 0;
        return '<li class="' + (done ? 'done' : '') + '"><span class="mm-box">' + (done ? '✓' : '') + '</span>' + esc(q.shelf[i].en) + ' <span class="mm-es" lang="es">' + esc(q.shelf[i].es) + '</span></li>';
      }).join('');
    },
    tap: function (i, btn) {
      var q = state.q; if (state.locked) return;
      var pos = q.basket.indexOf(i);
      if (q.variant === 'list') {
        if (q.phase === 2) return;
        if (q.list.indexOf(i) < 0) {
          btn.classList.remove('mm-shake'); void btn.offsetWidth; btn.classList.add('mm-shake');
          _toast('That is not on your list · No está en tu lista');
          return;
        }
        if (pos >= 0) return;
      }
      var from = btn.querySelector('svg').getBoundingClientRect();
      if (pos >= 0) q.basket.splice(pos, 1); else q.basket.push(i);
      this.renderShelf(q); this.renderBasket(q);
      if (pos < 0) {
        var bis = document.querySelectorAll('#mm-basket-items .mm-bi');
        flipFrom(bis[bis.length - 1], from);
      }
      clink(true);
      if (q.variant === 'list' && q.list.every(function (k) { return q.basket.indexOf(k) >= 0; })) {
        q.phase = 2;
        setTimeout(function () { if (state.q === q) UI.shop.phase2(q); }, 350);
      }
    },
    phase2: function (q) {
      var p = $('mm-prompt-text');
      if (p) p.innerHTML = q.prompt2;
      var es = p && p.parentNode.querySelector('.mm-es'); if (es) es.innerHTML = q.prompt2Es;
      UI.choice.mount(q);
      var t = $('mm-basket-total'); if (t && q.hideTotal) t.innerHTML = 'Total: <b>?</b>';
    },
    clear: function () { var q = state.q; if (state.locked) return; q.basket = []; this.renderShelf(q); this.renderBasket(q); },
    check: function () {
      var q = state.q; if (state.locked) return;
      var tot = q.basket.reduce(function (a, i) { return a + q.shelf[i].price; }, 0);
      var hint = $('mm-hint');
      if (!q.basket.length) { _toast('Pick some items first · Elige productos'); return; }
      if (tot === q.best) {
        finish(true, 'You spend ' + fmt(q.cur, tot) + ' and keep ' + fmt(q.cur, q.budget - tot) + '. That is the most you can spend without going over.', null);
        return;
      }
      state.tries++;
      var msg = tot > q.budget ? 'That costs ' + (q.hideTotal ? 'more than your money' : fmt(q.cur, tot)) + ' — over your ' + fmt(q.cur, q.budget) + '.' :
        'That works, but you can spend more and still stay within ' + fmt(q.cur, q.budget) + '.';
      if (state.tries < 2) {
        sfx('wrong');
        if (hint) { hint.innerHTML = msg + ' <b>Try again!</b>'; hint.classList.add('warn'); }
        return;
      }
      var names = q.bestSet.map(function (i) { return q.shelf[i].en + ' (' + fmt(q.cur, q.shelf[i].price) + ')'; }).join(' + ');
      if (hint) hint.textContent = '';
      finish(false, msg + ' Best basket: ' + esc(names) + ' = ' + fmt(q.cur, q.best) + '.', null);
    }
  };

  // ---------------------------------------------------------------
  // GENERATORS
  // ---------------------------------------------------------------
  var GEN = {};

  // ---- 1. Identify ----
  GEN.identify = function (cur, tier) {
    var pool = denoms(cur, { rare: tier >= 3 });
    var t = _pick(pool);
    var r = Math.random(), type = 'value';
    if (tier >= 2 && r < (tier === 3 ? 0.45 : 0.3)) type = 'who';
    else if (tier <= 1 && r < 0.28) type = 'find';
    var nOpt = tier === 0 ? 3 : 4;
    var others = _shuffle(pool.filter(function (d) { return d.v !== t.v; }));
    var q = { ui: 'choice', cur: cur, fp: type + t.v, fact: (type === 'who' ? t.back : t.who) };
    var side = type === 'who' ? 'obv' : (t.kind === 'coin' ? (tier === 0 ? 'rev' : (Math.random() < 0.5 ? 'obv' : 'rev')) : (Math.random() < 0.7 ? 'obv' : 'rev'));
    var flip = function (d, s) {
      var o = s === 'obv' ? 'rev' : 'obv';
      return '<button type="button" class="mm-flip ' + d.kind + '" data-act="flip" aria-label="Turn the ' + kindWord(d) + ' over">' +
        '<span class="mm-flip-in"><span class="mm-face front">' + art(cur, d.v, 'big', s) + '</span>' +
        '<span class="mm-face back">' + art(cur, d.v, 'big', o) + '</span></span></button>';
    };
    var mat = function (inner) { return '<div class="mm-mat">' + inner + '<p class="mm-mat-tip">Tap it to turn it over · <span lang="es">Tócala para darla vuelta</span></p></div>'; };
    if (type === 'value') {
      var opts = _shuffle([t].concat(others.slice(0, nOpt - 1)));
      q.prompt = 'How much is this ' + kindWord(t) + ' worth?';
      q.promptEs = '¿Cuánto vale ' + (t.kind === 'coin' ? 'esta moneda' : 'este billete') + '?';
      q.stage = mat(flip(t, side));
      q.options = opts.map(function (o) { return { html: '<span class="mm-opt-big">' + fmt(cur, o.v) + '</span>', correct: o.v === t.v }; });
      q.explain = 'This is the ' + t.label + ' ' + kindWord(t) + (cur === 'USD' && t.kind === 'coin' ? ' — a ' + t.name : '') + '.';
    } else if (type === 'who') {
      var names = [pname(t)];
      others.forEach(function (d) { if (names.length < 4 && names.indexOf(pname(d)) < 0) names.push(pname(d)); });
      q.prompt = 'Who is on this ' + kindWord(t) + '?';
      q.promptEs = '¿Quién aparece en ' + (t.kind === 'coin' ? 'esta moneda' : 'este billete') + '?';
      q.stage = mat(flip(t, 'obv'));
      q.options = _shuffle(names).map(function (n) { return { html: esc(n), correct: n === pname(t) }; });
      q.explain = esc(t.who.en);
      q.fact = t.back;
      q.fp = 'who' + pname(t);
    } else {
      var cands = _shuffle([t].concat(others.slice(0, nOpt - 1)));
      q.prompt = 'Find the ' + t.label + ' ' + kindWord(t) + '!';
      q.promptEs = '¡Encuentra ' + (t.kind === 'coin' ? 'la moneda' : 'el billete') + ' de ' + t.label + '!';
      q.stage = '<div class="mm-mat mm-mat-find"><p class="mm-find-big">' + t.label + '</p></div>';
      q.optArt = true;
      q.options = cands.map(function (o) {
        return { html: '<span class="mm-opt-art">' + art(cur, o.v, o.kind === 'coin' ? 'tray' : 'tray', o.kind === 'coin' ? (Math.random() < 0.5 ? 'obv' : 'rev') : 'obv') + '</span>', correct: o.v === t.v, aria: 'Option: a ' + kindWord(o) };
      });
      q.explain = 'The ' + t.label + ' ' + kindWord(t) + (t.colour ? ' is ' + t.colour.en + '.' : '.');
    }
    return q;
  };

  // ---- 2. Count Up ----
  GEN.count = function (cur, tier) {
    var V = vals(cur);
    var pool, nMin, nMax;
    if (cur === 'USD') {
      pool = [[1, 5, 10, 25], [1, 5, 10, 25, 100], [1, 5, 10, 25, 100, 500], V][tier];
    } else {
      pool = [[10, 50, 100, 500], [10, 50, 100, 500, 1000, 2000], [10, 50, 100, 500, 1000, 2000, 5000, 10000], V][tier];
    }
    nMin = [2, 3, 4, 5][tier]; nMax = [3, 5, 7, 8][tier];
    var n = nMin + _rand(nMax - nMin + 1), pile = [], total = 0;
    for (var i = 0; i < n; i++) { var v = _pick(pool); pile.push(v); total += v; }
    var useKp = tier >= 2;
    var q = { ui: useKp ? 'keypad' : 'choice', cur: cur, answer: total, fp: pile.slice().sort().join(','), pile: pile };
    q.prompt = 'How much money is on the counter?';
    q.promptEs = '¿Cuánto dinero hay en el mesón?';
    q.stage =
      '<div class="mm-counter">' +
        '<div class="mm-felt" id="mm-pile"></div>' +
        '<div class="mm-tray-wrap"><div class="mm-tray-head"><span>Counted · Contado</span>' +
          '<span class="mm-tally" id="mm-tally"></span></div><div class="mm-tray" id="mm-counted"></div></div>' +
        '<p class="mm-mat-tip">Tap or drag each piece into the tray to count it · <span lang="es">Toca o arrastra cada pieza a la bandeja</span></p>' +
      '</div>';
    q.mount = function () {
      var showT = tier <= 1;
      var pz = makeZone('pile', $('mm-pile'), { kind: 'tray', cur: cur, tapTo: 'counted', where: 'tray', tapLabel: 'Count', empty: 'All counted! · ¡Todo contado!' });
      pz.items = _shuffle(pile); renderZone(pz);
      makeZone('counted', $('mm-counted'), {
        kind: 'tray', cur: cur, tapTo: 'pile', badges: tier <= 1, tapLabel: 'Move back', empty: 'Counted pieces go here',
        onChange: function (z) { tally($('mm-tally'), cur, zoneTotal(z), !showT); }
      });
    };
    var d3 = [];
    if (!useKp) {
      var seen = {}; seen[total] = 1;
      var cand = [total - pile[0] + _pick(V), total + _pick(pool), total - _pick(pile), total + (cur === 'USD' ? 10 : 100), total - (cur === 'USD' ? 5 : 50), total + (cur === 'USD' ? 25 : 500)];
      _shuffle(cand).forEach(function (c) { if (d3.length < (tier === 0 ? 2 : 3) && c > 0 && !seen[c]) { seen[c] = 1; d3.push(c); } });
      var b = 1; while (d3.length < (tier === 0 ? 2 : 3)) { var c2 = total + b * (cur === 'USD' ? 5 : 10); if (!seen[c2]) { seen[c2] = 1; d3.push(c2); } b++; }
      q.options = _shuffle([total].concat(d3)).map(function (v) { return { html: '<span class="mm-opt-big">' + fmt(cur, v) + '</span>', correct: v === total }; });
    }
    var sorted = pile.slice().sort(function (a, b) { return b - a; });
    q.explain = 'Start with the biggest: ' + sorted.map(function (v) { return fmt(cur, v); }).join(' + ') + ' = <b>' + fmt(cur, total) + '</b>.';
    q.onAnswer = function () {
      var pz = Z.pile, cz = Z.counted;
      if (!pz || !cz) return;
      cz.items = cz.items.concat(pz.items); pz.items = [];
      renderZone(pz); renderZone(cz);
      countAnim(cz, 0, 'down', $('mm-tally'));
    };
    return q;
  };

  // ---- 3. Make Change (shop counter + cash register) ----
  function changeStage(q) {
    return '<div class="mm-shop">' +
      '<div class="mm-shop-top">' +
        '<div class="mm-reg">' + A.register('mmreg') + '</div>' +
        '<div class="mm-customer"><div class="mm-receipt"><span class="mm-receipt-item">' + A.item(q.item.id, 46) + '</span>' +
          '<span>' + (q.qty > 1 ? q.qty + ' × ' + fmt(q.cur, q.unitP) + '<br>' : '') + esc(q.item.en) + '</span><b>' + fmt(q.cur, q.price) + '</b></div>' +
          '<div class="mm-paid"><span class="mm-paid-lbl">Customer pays · Paga</span>' + strip(q.cur, q.paidPieces, 'pan') + '</div></div>' +
      '</div>' +
      '<div class="mm-tray-wrap mm-change-tray"><div class="mm-tray-head"><span>' + (q.trayLabel || 'Change · Vuelto') + '</span>' +
        (q.showPieces ? '<span class="mm-pcount">Pieces: <b id="mm-pieces">0</b></span>' : '') +
        '<span class="mm-tally" id="mm-tally"></span></div><div class="mm-tray" id="mm-tray"></div></div>' +
      '<div class="mm-drawer"><div class="mm-drawer-in" id="mm-bank"></div></div>' +
    '</div>';
  }
  GEN.change = function (cur, tier) {
    // A real item, maybe several of it: "3 × notebook". Prices get less round as kids get older.
    var maxPaid = cur === 'USD' ? [500, 1000, 2000, 2000][tier] : [1000, 5000, 10000, 20000][tier];
    var step = cur === 'USD' ? [100, 25, 5, 1][tier] : [100, 100, 10, 10][tier];
    var it, unitP, qty, price, tries = 0;
    do {
      it = _pick(D.ITEMS);
      unitP = cur === 'USD' ? it.usd : it.clp;
      if (tier >= 2 && Math.random() < 0.5) unitP = unitP * _pick([0.9, 1.1, 1.2]);
      unitP = Math.max(step, Math.round(unitP / step) * step);
      qty = 1 + _rand(tier === 0 ? 2 : tier === 1 ? 3 : 5);
      price = unitP * qty;
      tries++;
    } while ((price >= maxPaid || (tier >= 2 && price < maxPaid / 10)) && tries < 60);
    if (price >= maxPaid) { qty = 1; price = unitP = Math.min(unitP, maxPaid - step); }
    var notes = cur === 'USD' ? [100, 500, 1000, 2000] : [1000, 2000, 5000, 10000, 20000];
    var paid = notes.filter(function (n) { return n > price; })[0];
    if (tier >= 1 && Math.random() < 0.3) { var up = notes.filter(function (n) { return n > paid && n <= maxPaid; })[0]; if (up) paid = up; }
    if (price >= paid) price = paid - (cur === 'USD' ? 25 : 100);
    var change = paid - price;
    var bank = cur === 'USD' ? [1, 5, 10, 25, 100, 500, 1000] : [10, 50, 100, 500, 1000, 2000, 5000, 10000];
    var what = qty > 1 ? qty + ' × ' + it.en : withArt(it);
    var q = { ui: 'build', cur: cur, price: price, paid: paid, change: change, bank: bank, item: it, qty: qty, unitP: unitP, paidPieces: [paid], showTally: tier <= 1, fp: price + '/' + paid };
    q.prompt = tier === 0 ? 'Give back <b>' + fmt(cur, change) + '</b> in change.' : 'A customer buys ' + esc(what) + ' for ' + fmt(cur, price) + ' and pays with ' + fmt(cur, paid) + '. Give the change!';
    q.promptEs = tier === 0 ? 'Entrega <b>' + fmt(cur, change) + '</b> de vuelto.' : 'Cuesta ' + fmt(cur, price) + ' y pagan con ' + fmt(cur, paid) + '. ¡Da el vuelto!';
    q.hint = tier <= 1 ? 'Tip: count up from ' + fmt(cur, price) + ' to ' + fmt(cur, paid) + '.' : '';
    q.checkLabel = 'Give change';
    q.stage = changeStage(q);
    q.judge = function (tot) {
      if (tot === change) return { ok: true, msg: 'Count up from ' + fmt(cur, price) + ' to ' + fmt(cur, paid) + ': the change is <b>' + fmt(cur, change) + '</b>.' };
      return { ok: false, msg: tot < change ? 'That is ' + fmt(cur, tot) + ' — not enough change.' : 'That is ' + fmt(cur, tot) + ' — too much change.' };
    };
    q.solution = function () { return 'The change is <b>' + fmt(cur, change) + '</b>, for example ' + breakdown(cur, change).map(function (v) { return fmt(cur, v); }).join(' + ') + '.'; };
    q.mount = function () {
      setDisplay('TOTAL', fmtDisp(cur, price));
      setTimeout(function () { var dr = document.querySelector('.mm-drawer'); if (dr) dr.classList.add('open'); kaching(); }, 120);
      setTimeout(function () { setDisplay('PAID', fmtDisp(cur, paid)); }, 900);
    };
    q.onWin = function (z) {
      setDisplay('CHANGE', fmtDisp(cur, change));
      var t = $('mm-tally'); if (t) t.classList.add('show');
      countAnim(z, price, 'up', t, function () { kaching(); });
    };
    return q;
  };
  function fmtDisp(cur, v) { return cur === 'USD' ? fmtUsdFull(v) : fmt('CLP', v); }
  function setDisplay(a, b) { var d1 = $('mmreg-d1'), d2 = $('mmreg-d2'); if (d1) d1.textContent = a; if (d2) d2.textContent = b; }

  // ---- 4. Challenge (harder mix — multiple choice) ----
  function _numDistractors(currency, correct, candidates) {
    var step = currency === 'USD' ? 25 : 100, out = [], seen = {};
    seen[correct] = 1;
    function tryAdd(v) { v = Math.round(v); if (out.length >= 3) return; if (v > 0 && !seen[v]) { seen[v] = 1; out.push(v); } }
    (candidates || []).forEach(tryAdd);
    var bump = 1;
    while (out.length < 3) { tryAdd(correct + bump * step); if (out.length < 3) tryAdd(correct - bump * step); bump++; if (bump > 40) tryAdd(correct + out.length + 1); }
    return out;
  }
  function choiceOpts(cur, correct, distractors) {
    return _shuffle([correct].concat(distractors)).map(function (v) { return { html: '<span class="mm-opt-big">' + fmt(cur, v) + '</span>', correct: v === correct }; });
  }
  function shelfRow(cur, items) {
    return '<div class="mm-shelf static">' + items.map(function (it) {
      return '<div class="mm-shelf-item"><span class="mm-shelf-art">' + A.item(it.id, 56) + '</span><span class="mm-tag"><span class="mm-tag-hole"></span>' + fmt(cur, it.price) + '</span>' +
        '<span class="mm-shelf-name">' + esc(it.en) + '</span></div>';
    }).join('') + '</div>';
  }
  function genMultiItem(cur) {
    var n = 2 + _rand(2), items = _shuffle(D.ITEMS).slice(0, n).map(function (it) {
      var price = cur === 'USD' ? (1 + _rand(8)) * 100 + _rand(4) * 25 : (1 + _rand(18)) * 100;
      return { id: it.id, en: it.en, price: price };
    });
    var sum = items.reduce(function (a, b) { return a + b.price; }, 0);
    var payOpts = (cur === 'USD' ? [500, 1000, 2000, 5000] : [2000, 5000, 10000, 20000]).filter(function (p) { return p > sum; });
    var withChange = Math.random() < 0.5 && payOpts.length;
    var q = { ui: 'choice', cur: cur };
    if (withChange) {
      var paid = payOpts[0], correct = paid - sum;
      q.prompt = 'Buy these items and pay with ' + fmt(cur, paid) + '. How much change?';
      q.promptEs = 'Compras todo y pagas con ' + fmt(cur, paid) + '. ¿Cuánto es el vuelto?';
      q.stage = '<div class="mm-scene-shop">' + shelfRow(cur, items) + '<div class="mm-paybox">Pay · Pagas ' + strip(cur, breakdown(cur, paid), 'pan') + '</div></div>';
      q.options = choiceOpts(cur, correct, _numDistractors(cur, correct, [sum, paid - items[0].price, correct + (cur === 'USD' ? 100 : 1000), paid + sum]));
      q.explain = 'Total ' + items.map(function (i) { return fmt(cur, i.price); }).join(' + ') + ' = ' + fmt(cur, sum) + '; ' + fmt(cur, paid) + ' − ' + fmt(cur, sum) + ' = <b>' + fmt(cur, correct) + '</b>.';
      q.fp = 'mc' + sum + paid;
    } else {
      q.prompt = 'What is the total cost of these items?';
      q.promptEs = '¿Cuánto cuesta todo junto?';
      q.stage = '<div class="mm-scene-shop">' + shelfRow(cur, items) + '</div>';
      q.options = choiceOpts(cur, sum, _numDistractors(cur, sum, [sum - items[0].price, sum + items[_rand(n)].price, sum + (cur === 'USD' ? 100 : 1000), sum - (cur === 'USD' ? 25 : 100)]));
      q.explain = items.map(function (i) { return fmt(cur, i.price); }).join(' + ') + ' = <b>' + fmt(cur, sum) + '</b>.';
      q.fp = 'mt' + sum;
    }
    return q;
  }
  function genFewestChoice(cur) {
    var smallest = cur === 'USD' ? 1 : 10;
    var units = cur === 'USD' ? 2 + _rand(20) : 1 + _rand(40);
    var target = Math.max(smallest, Math.min(units * smallest, cur === 'USD' ? 1000 : 20000));
    if (cur === 'CLP') target = (1 + _rand(60)) * 10 * (Math.random() < 0.5 ? 1 : 10);
    var set = fewestSet(cur, target), count = set.length;
    var d = [], seen = {}; seen[count] = 1;
    [count + 1, count - 1, count + 2, count + 3, count + 4].forEach(function (c) { if (d.length < 3 && c > 0 && !seen[c]) { seen[c] = 1; d.push(c); } });
    return {
      ui: 'choice', cur: cur, fp: 'fc' + target,
      prompt: 'Make ' + fmt(cur, target) + ' using the fewest coins or notes. How many do you need?',
      promptEs: 'Forma ' + fmt(cur, target) + ' con la menor cantidad de monedas o billetes. ¿Cuántas piezas?',
      stage: '<div class="mm-scene-note"><div class="mm-sticky">Make · Forma<b>' + fmt(cur, target) + '</b></div>' +
        '<div class="mm-avail"><span>You can use · Puedes usar</span>' + strip(cur, vals(cur).filter(function (v) { return v <= Math.max(target, smallest); }), 'pan') + '</div></div>',
      options: _shuffle([count].concat(d)).map(function (v) { return { html: '<span class="mm-opt-big">' + v + '</span>', correct: v === count }; }),
      explain: set.map(function (v) { return fmt(cur, v); }).join(' + ') + ' → <b>' + count + '</b> piece' + (count === 1 ? '' : 's') + '.'
    };
  }
  function genDiscount(cur) {
    var pct = _pick([10, 20, 25, 50]), base;
    if (pct === 50) base = (1 + _rand(cur === 'USD' ? 20 : 40)) * 2;
    else if (pct === 25) base = (1 + _rand(cur === 'USD' ? 10 : 20)) * 4;
    else if (pct === 20) base = (1 + _rand(cur === 'USD' ? 10 : 20)) * 5;
    else base = (1 + _rand(cur === 'USD' ? 10 : 20)) * 10;
    var price = base * 100, discount = price * pct / 100, correct = price - discount;
    var it = _pick(D.ITEMS);
    return {
      ui: 'choice', cur: cur, fp: 'd' + price + pct,
      prompt: 'The price tag says ' + fmt(cur, price) + '. It is ' + pct + '% off. What is the new price?',
      promptEs: 'Cuesta ' + fmt(cur, price) + ' y tiene ' + pct + '% de descuento. ¿Cuál es el nuevo precio?',
      stage: '<div class="mm-scene-sale"><span class="mm-sale-item">' + A.item(it.id, 120) + '</span>' +
        '<span class="mm-tag big"><span class="mm-tag-hole"></span>' + fmt(cur, price) + '</span><span class="mm-burst-tag">−' + pct + '%</span></div>',
      options: choiceOpts(cur, correct, _numDistractors(cur, correct, [discount, price, price + discount, price - price * (100 - pct) / 100])),
      explain: pct + '% of ' + fmt(cur, price) + ' is ' + fmt(cur, discount) + '. ' + fmt(cur, price) + ' − ' + fmt(cur, discount) + ' = <b>' + fmt(cur, correct) + '</b>.'
    };
  }
  function genWord(cur) {
    var who = _pick(['Sofía', 'Diego', 'Mía', 'Lucas', 'Emma', 'Mateo', 'Tomás', 'Isidora']);
    var bag = _shuffle(D.ITEMS).slice(0, 3);
    var bills = denoms(cur).filter(function (d) { return d.kind === 'bill'; });
    var pieces = [], start = 0, np = 2 + _rand(2);
    for (var i = 0; i < np; i++) { var d = _pick(bills); pieces.push(d.v); start += d.v; }
    pieces.sort(function (a, b) { return b - a; });
    var step = cur === 'USD' ? 25 : 100, maxU = Math.max(1, Math.floor((start - step) / step));
    var cost = Math.max(step, Math.min(start - step, (1 + _rand(maxU)) * step)), correct = start - cost;
    return {
      ui: 'choice', cur: cur, fp: 'w' + start + cost,
      prompt: who + ' has this money and spends ' + fmt(cur, cost) + ' at the market. How much money is left?',
      promptEs: who + ' tiene este dinero y gasta ' + fmt(cur, cost) + ' en la feria. ¿Cuánto le queda?',
      stage: '<div class="mm-scene-word"><div class="mm-wallet-open">' + strip(cur, pieces, 'tray') + '</div>' +
        '<div class="mm-word-item">' + bag.map(function (b) { return A.item(b.id, 56); }).join('') + '<span class="mm-tag big"><span class="mm-tag-hole"></span>' + fmt(cur, cost) + '</span></div></div>',
      options: choiceOpts(cur, correct, _numDistractors(cur, correct, [start, cost, start + cost, correct + (cur === 'USD' ? 100 : 1000)])),
      explain: pieces.map(function (v) { return fmt(cur, v); }).join(' + ') + ' = ' + fmt(cur, start) + '; ' + fmt(cur, start) + ' − ' + fmt(cur, cost) + ' = <b>' + fmt(cur, correct) + '</b>.'
    };
  }
  GEN.challenge = function (cur) { return _pick([genMultiItem, genFewestChoice, genDiscount, genWord])(cur); };

  // ---- 5. Fewest Pieces (build) ----
  GEN.fewest = function (cur, tier) {
    var target;
    if (cur === 'USD') {
      if (tier <= 1) target = 5 + _rand(95);
      else if (tier === 2) target = 100 + _rand(900);
      else target = 500 + _rand(4500);
    } else {
      if (tier <= 1) target = 10 * (6 + _rand(195));
      else if (tier === 2) target = 10 * (100 + _rand(1900));
      else target = 10 * (500 + _rand(4500));
    }
    var bank = vals(cur);
    var best = fewestSet(cur, target, bank);
    var it = _pick(D.ITEMS);
    var q = { ui: 'build', cur: cur, bank: bank, showTally: tier <= 2, showPieces: true, fp: 'f' + target, empty: 'Build the amount here · Arma el monto aquí' };
    q.prompt = 'Pay exactly <b>' + fmt(cur, target) + '</b> using the <b>fewest</b> coins and notes.';
    q.promptEs = 'Paga exactamente ' + fmt(cur, target) + ' con la menor cantidad de monedas y billetes.';
    q.hint = 'Start with the biggest piece that fits · Empieza con la pieza más grande que quepa.';
    q.checkLabel = 'Pay · Pagar';
    q.trayLabel = 'Your payment · Tu pago';
    q.stage = '<div class="mm-shop mm-purse-scene">' +
      '<div class="mm-shop-top"><div class="mm-pricecard"><span class="mm-receipt-item">' + A.item(it.id, 56) + '</span><span>Price · Precio</span><b>' + fmt(cur, target) + '</b>' +
        '<span class="mm-par">Fewest possible: ' + (tier <= 1 ? best.length + ' pieces' : '?') + '</span></div></div>' +
      '<div class="mm-tray-wrap mm-change-tray"><div class="mm-tray-head"><span>' + q.trayLabel + '</span><span class="mm-pcount">Pieces: <b id="mm-pieces">0</b></span><span class="mm-tally" id="mm-tally"></span></div><div class="mm-tray" id="mm-tray"></div></div>' +
      '<div class="mm-purse"><div class="mm-purse-in" id="mm-bank"></div></div></div>';
    q.judge = function (tot, n) {
      if (tot !== target) return { ok: false, msg: 'That is ' + fmt(cur, tot) + (tot < target ? ' — a bit short of ' : ' — more than ') + fmt(cur, target) + '.' };
      if (n > best.length) return { ok: false, msg: 'Right amount, but it can be done with fewer than ' + n + ' pieces.' };
      return { ok: true, msg: '<b>' + n + '</b> piece' + (n === 1 ? '' : 's') + ' — the fewest possible!' };
    };
    q.solution = function () { return 'Fewest: ' + best.map(function (v) { return fmt(cur, v); }).join(' + ') + ' (<b>' + best.length + '</b> pieces).'; };
    return q;
  };

  // ---- 6. Shopping List (budget) ----
  function priceFor(it, cur, tier) {
    var p = cur === 'USD' ? it.usd : it.clp;
    if (tier <= 1) {
      var st = cur === 'USD' ? 25 : 100;
      return Math.max(st, Math.round(p / st) * st);
    }
    if (Math.random() < 0.5) {
      var f = _pick([0.9, 1.1, 1.2]), s2 = cur === 'USD' ? 5 : 10;
      p = Math.max(s2, Math.round(p * f / s2) * s2);
    }
    return p;
  }
  GEN.budget = function (cur, tier) {
    var variant = tier >= 2 && Math.random() < 0.4 ? 'best' : 'list';
    var nShelf = tier <= 1 ? 5 : 6;
    var shelf = _shuffle(D.ITEMS).slice(0, nShelf).map(function (it) { return { id: it.id, en: it.en, es: it.es, price: priceFor(it, cur, tier) }; });
    var notes = cur === 'USD' ? [500, 1000, 2000] : [1000, 2000, 5000, 10000, 20000];
    var q = { ui: 'shop', cur: cur, shelf: shelf, variant: variant, hideTotal: tier >= 3 };
    var stageTop = function (title, inner) {
      return '<div class="mm-market">' +
        '<div class="mm-shelf-wrap"><div class="mm-shelf" id="mm-shelf"></div><div class="mm-shelf-board"></div></div>' +
        '<div class="mm-market-row">' + inner +
          '<div class="mm-basket"><div class="mm-basket-items" id="mm-basket-items"></div><div class="mm-basket-body"></div><div class="mm-basket-total" id="mm-basket-total"></div></div>' +
        '</div></div>';
    };
    if (variant === 'list') {
      var k = tier <= 1 ? 2 : tier === 2 ? 3 : 3 + _rand(2);
      var list = _shuffle(shelf.map(function (s, i) { return i; })).slice(0, k);
      var sum = list.reduce(function (a, i) { return a + shelf[i].price; }, 0);
      var short = tier >= 2 && Math.random() < 0.3;
      var budget;
      if (short) {
        var unit = cur === 'USD' ? 100 : 1000;
        budget = Math.floor(sum / unit) * unit;
        if (budget >= sum) budget -= unit;
        if (budget <= 0) { short = false; }
      }
      if (!short) {
        var big = notes.filter(function (n) { return n > sum; })[0] || notes[notes.length - 1] * Math.ceil(sum / notes[notes.length - 1]);
        budget = big;
      }
      var left = budget - sum;
      q.list = list; q.budget = budget; q.phase = 1;
      q.fp = 'bl' + list.map(function (i) { return shelf[i].id; }).sort().join() + budget;
      q.prompt = 'Shopping list! Put everything on the list in your basket.';
      q.promptEs = '¡Lista de compras! Pon todo lo de la lista en el canasto.';
      q.prompt2 = 'You have <b>' + fmt(cur, budget) + '</b>. After paying for the basket, how much is left?';
      q.prompt2Es = 'Tienes ' + fmt(cur, budget) + '. Después de pagar, ¿cuánto te queda?';
      var walletPieces = breakdown(cur, budget);
      q.stage = stageTop('', '<div class="mm-listpaper"><h3>My list · Mi lista</h3><ul id="mm-list"></ul>' +
        '<div class="mm-wallet"><span>My money · Mi dinero</span>' + strip(cur, walletPieces, 'pan') + '<b>' + fmt(cur, budget) + '</b></div></div>');
      var mk = function (v, isShort) { return { html: isShort ? 'Not enough — <b>' + fmt(cur, v) + '</b> short' : '<span class="mm-opt-big">' + fmt(cur, v) + '</span> left', correct: isShort === (left < 0) && v === Math.abs(left), v: v, s: isShort }; };
      var opts = [mk(Math.abs(left), left < 0)];
      var seen = {}; seen[(left < 0 ? 's' : 'l') + Math.abs(left)] = 1;
      var cands = [[Math.abs(left), left >= 0], [sum, false], [Math.abs(left) + (cur === 'USD' ? 100 : 1000), left < 0], [Math.abs(left - shelf[list[0]].price), left - shelf[list[0]].price < 0],
        [Math.abs(budget - sum + shelf[list[0]].price), budget - sum + shelf[list[0]].price < 0], [Math.abs(left) + (cur === 'USD' ? 25 : 100), left < 0]];
      cands.forEach(function (c) {
        var key = (c[1] ? 's' : 'l') + c[0];
        if (opts.length < 4 && c[0] > 0 && !seen[key] && (tier >= 2 || !c[1])) { seen[key] = 1; opts.push(mk(c[0], c[1])); }
      });
      var bump = 2; while (opts.length < 4) { var cv = Math.abs(left) + bump * (cur === 'USD' ? 25 : 100); if (!seen['l' + cv]) { seen['l' + cv] = 1; opts.push(mk(cv, false)); } bump++; }
      q.options = _shuffle(opts);
      var calc = list.map(function (i) { return fmt(cur, shelf[i].price); }).join(' + ') + ' = ' + fmt(cur, sum) + '. ';
      q.explain = calc + (left >= 0 ? fmt(cur, budget) + ' − ' + fmt(cur, sum) + ' = <b>' + fmt(cur, left) + '</b> left.' : 'You only have ' + fmt(cur, budget) + ', so you are <b>' + fmt(cur, -left) + '</b> short.');
    } else {
      var total = shelf.reduce(function (a, s) { return a + s.price; }, 0);
      var unitB = cur === 'USD' ? 50 : 500;
      var B = Math.max(unitB * 2, Math.round(total * (0.45 + Math.random() * 0.25) / unitB) * unitB);
      var bestSum = 0, bestMask = 0;
      for (var m = 1; m < (1 << shelf.length); m++) {
        var s = 0; for (var j = 0; j < shelf.length; j++) if (m & (1 << j)) s += shelf[j].price;
        if (s <= B && s > bestSum) { bestSum = s; bestMask = m; }
      }
      q.budget = B; q.best = bestSum; q.bestSet = [];
      for (var j2 = 0; j2 < shelf.length; j2++) if (bestMask & (1 << j2)) q.bestSet.push(j2);
      q.fp = 'bb' + shelf.map(function (s) { return s.id; }).join() + B;
      q.prompt = 'You have <b>' + fmt(cur, B) + '</b>. Fill the basket to spend as much as you can <b>without going over</b>.';
      q.promptEs = 'Tienes ' + fmt(cur, B) + '. Llena el canasto gastando lo más posible <b>sin pasarte</b>.';
      q.stage = stageTop('', '<div class="mm-listpaper"><h3>Budget · Presupuesto</h3><div class="mm-wallet"><span>My money · Mi dinero</span>' + strip(cur, breakdown(cur, B), 'pan') + '<b>' + fmt(cur, B) + '</b></div>' +
        '<p class="mm-small">Tap an item again to take it out.</p></div>');
    }
    return q;
  };

  // ---- 7. Pesos ↔ Dollars (balance scale) ----
  function panPieces(cur, amount) {
    var b = breakdown(cur, amount);
    if (b.length > 7) {
      var g = {}; b.forEach(function (v) { g[v] = (g[v] || 0) + 1; });
      return '<div class="mm-pan-in">' + Object.keys(g).map(Number).sort(function (a, b2) { return b2 - a; }).map(function (v) {
        return '<span class="mm-pan-p">' + art(cur, v, 'pan') + (g[v] > 1 ? '<i>×' + g[v] + '</i>' : '') + '</span>';
      }).join('') + '</div>';
    }
    return '<div class="mm-pan-in">' + b.map(function (v) { return '<span class="mm-pan-p">' + art(cur, v, 'pan') + '</span>'; }).join('') + '</div>';
  }
  function scaleStage(left, right, lLbl, rLbl) {
    return '<div class="mm-balance">' +
      '<div class="mm-rate"><b>Example rate · Tasa de ejemplo</b> US$1 = $1.000 pesos<span>Only for practice — real rates change every day. · Solo para practicar: el valor real cambia cada día.</span></div>' +
      '<div class="mm-scale-box">' + A.scale('mmsc') +
        '<div class="mm-pan-load L" id="mm-panL">' + left + '<span class="mm-pan-lbl">' + lLbl + '</span></div>' +
        '<div class="mm-pan-load R" id="mm-panR">' + right + '<span class="mm-pan-lbl">' + rLbl + '</span></div>' +
      '</div></div>';
  }
  function tilt(dir) {
    // dir: -1 left side down, 1 right side down, 0 level
    var ang = dir * 9, rad = ang * Math.PI / 180, dy = 116 * Math.sin(rad);
    var beam = $('mmsc-beam'), pl = $('mmsc-panL'), pr = $('mmsc-panR');
    if (beam) beam.style.transform = 'rotate(' + ang + 'deg)';
    if (pl) pl.style.transform = 'translateY(' + (-dy) + 'px)';
    if (pr) pr.style.transform = 'translateY(' + dy + 'px)';
    var box = document.querySelector('.mm-scale-box svg'), k = box ? box.getBoundingClientRect().width / 320 : 1;
    var L = $('mm-panL'), R = $('mm-panR');
    if (L) L.style.transform = 'translate(-50%,' + (-dy * k) + 'px)';
    if (R) R.style.transform = 'translate(-50%,' + (dy * k) + 'px)';
  }
  GEN.compare = function (curIgnored, tier) {
    var types = ['more', 'toclp'];
    if (tier >= 2) types.push('tousd');
    if (tier >= 3) types.push('cheaper');
    var type = _pick(types);
    var q = { ui: 'choice', cur: 'CLP' };
    var usdAmt = tier <= 1 ? 100 * (1 + _rand(10)) : tier === 2 ? 50 * (2 + _rand(30)) : 25 * (4 + _rand(76));
    var clpOf = function (c) { return c * RATE / 100; };
    if (type === 'more') {
      var rel = _rand(3) - 1; // -1 pesos less, 0 same, 1 pesos more
      var delta = tier <= 1 ? 500 * (1 + _rand(3)) : 100 * (1 + _rand(9));
      var clp = clpOf(usdAmt) + rel * delta;
      if (clp <= 0) { clp = clpOf(usdAmt); rel = 0; }
      q.fp = 'm' + usdAmt + '/' + clp;
      q.prompt = 'Which side is worth more at the example rate?';
      q.promptEs = '¿Qué lado vale más con la tasa de ejemplo?';
      q.stage = scaleStage(panPieces('USD', usdAmt), panPieces('CLP', clp), fmtCur('USD', usdAmt), fmt('CLP', clp));
      q.options = [
        { html: 'The dollars · Los dólares', correct: rel < 0 },
        { html: 'They are equal · Valen lo mismo', correct: rel === 0 },
        { html: 'The pesos · Los pesos', correct: rel > 0 }
      ];
      q.explain = fmtCur('USD', usdAmt) + ' × 1.000 = ' + fmt('CLP', clpOf(usdAmt)) + ' pesos, ' + (rel === 0 ? 'the same as' : rel > 0 ? 'less than' : 'more than') + ' ' + fmt('CLP', clp) + '.';
      q.mount = function () { tilt(0); };
      q.onAnswer = function () { tilt(rel === 0 ? 0 : rel > 0 ? 1 : -1); };
    } else if (type === 'toclp') {
      var ans = clpOf(usdAmt);
      q.fp = 'c' + usdAmt;
      q.prompt = 'At the example rate, how many pesos is ' + fmtCur('USD', usdAmt) + '?';
      q.promptEs = 'Con la tasa de ejemplo, ¿cuántos pesos son ' + fmtCur('USD', usdAmt) + '?';
      q.stage = scaleStage(panPieces('USD', usdAmt), '<div class="mm-pan-in"><span class="mm-pan-q">?</span></div>', fmtCur('USD', usdAmt), '? pesos');
      var ds = _numDistractors('CLP', ans, [usdAmt, ans * 10, ans / 10, ans + 1000, ans - 500, ans + 500]);
      q.options = choiceOpts('CLP', ans, ds);
      q.explain = fmtCur('USD', usdAmt) + ' × 1.000 = <b>' + fmt('CLP', ans) + '</b> pesos.';
      q.mount = function () { tilt(-1); };
      q.onAnswer = function () {
        var R = $('mm-panR'); if (R) R.innerHTML = panPieces('CLP', ans) + '<span class="mm-pan-lbl">' + fmt('CLP', ans) + '</span>';
        setTimeout(function () { tilt(0); }, 60);
      };
    } else if (type === 'tousd') {
      var clp2 = tier === 2 ? 500 * (1 + _rand(30)) : 100 * (5 + _rand(150));
      var usd2 = clp2 / 10; // cents
      q.fp = 'u' + clp2;
      q.prompt = 'At the example rate, how many dollars is ' + fmt('CLP', clp2) + ' pesos?';
      q.promptEs = 'Con la tasa de ejemplo, ¿cuántos dólares son ' + fmt('CLP', clp2) + ' pesos?';
      q.stage = scaleStage('<div class="mm-pan-in"><span class="mm-pan-q">?</span></div>', panPieces('CLP', clp2), 'US$ ?', fmt('CLP', clp2));
      var dd = _numDistractors('USD', usd2, [usd2 * 10, usd2 / 10, usd2 + 100, usd2 - 50, clp2]);
      q.options = _shuffle([usd2].concat(dd)).map(function (v) { return { html: '<span class="mm-opt-big">' + fmtCur('USD', v) + '</span>', correct: v === usd2 }; });
      q.explain = fmt('CLP', clp2) + ' ÷ 1.000 = <b>' + fmtCur('USD', usd2) + '</b>.';
      q.mount = function () { tilt(1); };
      q.onAnswer = function () {
        var L = $('mm-panL'); if (L) L.innerHTML = panPieces('USD', usd2) + '<span class="mm-pan-lbl">' + fmtCur('USD', usd2) + '</span>';
        setTimeout(function () { tilt(0); }, 60);
      };
    } else {
      var it = _pick(D.ITEMS.filter(function (x) { return x.usd >= 249; }));
      var pu = Math.max(100, Math.round(it.usd / 100) * 100), pc = clpOf(pu) + (_rand(2) ? 1 : -1) * 500 * (1 + _rand(Math.max(1, pu / 100 - 1)));
      if (pc <= 0) pc = clpOf(pu) + 1000;
      var diff = Math.abs(pc - clpOf(pu)), chile = pc < clpOf(pu);
      q.fp = 'ch' + pu + '/' + pc;
      q.prompt = (NO_ART[it.id] ? 'The ' : 'One ') + esc(it.en) + (NO_ART[it.id] && it.id !== 'bread' && it.id !== 'milk' ? ' cost ' : ' costs ') + fmtCur('USD', pu) + ' in a U.S. shop and ' + fmt('CLP', pc) + ' in Chile. At the example rate, where is it cheaper, and by how much?';
      q.promptEs = 'Cuesta ' + fmtCur('USD', pu) + ' en EE. UU. y ' + fmt('CLP', pc) + ' en Chile. ¿Dónde es más barato y por cuánto?';
      q.stage = scaleStage(panPieces('USD', pu), panPieces('CLP', pc), fmtCur('USD', pu), fmt('CLP', pc));
      var o1 = { html: 'In Chile, by ' + fmt('CLP', diff), correct: chile };
      var o2 = { html: 'In the U.S., by ' + fmt('CLP', diff), correct: !chile };
      var o3 = { html: (chile ? 'In Chile' : 'In the U.S.') + ', by ' + fmt('CLP', diff + 1000), correct: false };
      var o4 = { html: 'Same price', correct: false };
      q.options = _shuffle([o1, o2, o3, o4]);
      q.explain = fmtCur('USD', pu) + ' = ' + fmt('CLP', clpOf(pu)) + '. ' + (chile ? 'Chile' : 'The U.S.') + ' is cheaper by <b>' + fmt('CLP', diff) + '</b>.';
      q.mount = function () { tilt(0); };
      q.onAnswer = function () { tilt(chile ? -1 : 1); };
    }
    return q;
  };

  // ---------------------------------------------------------------
  // events (delegated)
  // ---------------------------------------------------------------
  var _bound = false;
  function _bindOnce() {
    if (_bound) return; _bound = true;
    var root = _root();
    root.addEventListener('click', function (e) {
      var dragEl = e.target.closest('[data-drag]');
      if (dragEl) {
        // pointer taps are handled on pointerup; this is for keyboard (Enter/Space)
        if (e.detail === 0 && Date.now() - _lastTap > 400) {
          var z = Z[dragEl.getAttribute('data-zone')];
          if (z && !state.locked) tapMove(z, dragEl.hasAttribute('data-i') ? +dragEl.getAttribute('data-i') : -1, +dragEl.getAttribute('data-v'), dragEl);
        }
        return;
      }
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      switch (act) {
        case 'cur': setCurrency(b.getAttribute('data-cur')); break;
        case 'start': sfx('click'); start(b.getAttribute('data-mode')); break;
        case 'museum': sfx('click'); _renderMuseum(); break;
        case 'card': _openCard(+b.getAttribute('data-v'), b); break;
        case 'closecard': _closeCard(); break;
        case 'back': back(); break;
        case 'next': _next(); break;
        case 'opt': UI.choice.pick(+b.getAttribute('data-i'), b); break;
        case 'kp': UI.keypad.key(b.getAttribute('data-k')); break;
        case 'kpok': UI.keypad.ok(); break;
        case 'clear': UI.build.clear(); break;
        case 'check': UI.build.check(); break;
        case 'shelf': UI.shop.tap(+b.getAttribute('data-i'), b); break;
        case 'shopclear': UI.shop.clear(); break;
        case 'shopcheck': UI.shop.check(); break;
        case 'flip': b.classList.toggle('flipped'); clink(false); break;
      }
    });
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('lostpointercapture', function (e) { if (drag && e.pointerId === drag.pid) onUp(e); });
    document.addEventListener('keydown', function (e) {
      var ov = $('mm-overlay');
      if (e.key === 'Escape' && ov && !ov.hidden) { _closeCard(); return; }
      if (state.q && state.q.ui === 'keypad' && state.mode && !state.locked && $('mm-kp-disp')) {
        if (/^[0-9]$/.test(e.key)) { UI.keypad.key(e.key); e.preventDefault(); }
        else if (e.key === 'Backspace') { UI.keypad.key('del'); e.preventDefault(); }
        else if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) { UI.keypad.ok(); e.preventDefault(); }
      }
    });
    root.addEventListener('click', function (e) {
      var ov = $('mm-overlay');
      if (ov && !ov.hidden && e.target === ov) _closeCard();
    });
  }

  // ---- expose (keeps the original public API) ----
  window.MoneyMaster = {
    open: open,
    setCurrency: setCurrency,
    start: start,
    back: back,
    _answer: function (btn, idx) { UI.choice.pick(idx, btn); },
    _state: state,
    _fewestSet: fewestSet
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open);
  else open();
})();
