/* ================================================================
   MENSAJES SECRETOS 🔐 — codes & ciphers, learned by encoding and
   cracking. Tools: Caesar wheel, Atbash mirror, Pigpen, Morse
   telegraph, Polybius square, Scytale rod, frequency analysis.
   Missions ladder (stars 0–3) + factual history cards.

   Storage: one blob per kid at zs_secretos_<kid> holding progress
   only (mission stars, dates, tools tried, cards read). Text a kid
   types to encode stays on screen and is never saved or synced.
   ================================================================ */

var MensajesSecretos = (function() {
  'use strict';

  var D = MensajesSecretosData, ART = MensajesSecretosArt;
  var APP_NAME = 'Mensajes Secretos';

  // ---------------------------------------------------------------
  //  Storage
  // ---------------------------------------------------------------
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    return getUserAppKey('zs_secretos_');
  }
  function _load() {
    var key = _key();
    if (!key) return {};
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function _save(data) {
    var key = _key();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { return; }
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }
  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // Pure: stars in a saved blob (mirrors the APP_STAR_CONFIGS rule).
  function starsOf(d) {
    var n = 0, m = (d && d.missions) || {};
    for (var k in m) n += Math.min(3, (m[k] && m[k].stars) || 0);
    return n;
  }
  function _markTool(name) {
    var d = _load(); d.tools = d.tools || {};
    if (!d.tools[name]) { d.tools[name] = _today(); _save(d); }
  }

  // ---------------------------------------------------------------
  //  Helpers
  // ---------------------------------------------------------------
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function $(sel, el) { return (el || root()).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root()).querySelectorAll(sel)); }
  function root() { return document.getElementById('ms-wrap'); }
  function starRow(n, max) {
    var s = ''; for (var i = 0; i < (max || 3); i++) s += '<span class="ms-star' + (i < n ? ' on' : '') + '">★</span>';
    return '<span class="ms-stars" aria-label="' + n + ' of ' + (max || 3) + ' stars">' + s + '</span>';
  }
  function user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function age() { var u = user(); return (u && u.age) || 8; }
  function tier() { return typeof getAgeTier === 'function' ? getAgeTier(age()) : 'intermediate'; }
  function missionById(id) { for (var i = 0; i < D.MISSIONS.length; i++) if (D.MISSIONS[i].id === id) return D.MISSIONS[i]; return null; }
  function missionNo(id) { return D.MISSIONS.indexOf(missionById(id)) + 1; }

  var _cleanups = [];
  function cleanup() { while (_cleanups.length) { try { _cleanups.pop()(); } catch (e) {} } }
  function onCleanup(fn) { _cleanups.push(fn); }

  function topBar(label, backAct) {
    return '<div class="ms-top">' +
      '<button type="button" class="ms-back" data-act="' + (backAct || 'home') + '" aria-label="Back">←</button>' +
      '<div class="ms-top-label">' + label + '</div><span class="ms-top-sp"></span></div>';
  }

  // ---------------------------------------------------------------
  //  HOME
  // ---------------------------------------------------------------
  var _tab = 'missions';
  function sealSVG() {
    return '<svg class="ms-seal" viewBox="0 0 120 120" aria-hidden="true"><defs>' +
      '<radialGradient id="ms-wax" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#e2574a"/><stop offset="0.45" stop-color="#a8231a"/><stop offset="1" stop-color="#5e0d08"/></radialGradient>' +
      '<radialGradient id="ms-wax2" cx="0.6" cy="0.7" r="0.6"><stop offset="0" stop-color="#7a120c"/><stop offset="1" stop-color="#b52a1f"/></radialGradient>' +
      '<filter id="ms-wax-sh"><feGaussianBlur stdDeviation="2.5"/></filter></defs>' +
      '<ellipse cx="62" cy="66" rx="50" ry="48" fill="#000" opacity="0.45" filter="url(#ms-wax-sh)"/>' +
      '<path d="M60 6 C74 4 84 12 96 16 C108 24 112 36 114 50 C118 64 112 78 106 90 C96 104 82 112 66 114 C50 116 36 110 24 100 C12 90 6 76 6 60 C6 44 10 30 22 20 C34 10 46 8 60 6Z" fill="url(#ms-wax)"/>' +
      '<circle cx="60" cy="60" r="36" fill="url(#ms-wax2)"/>' +
      '<circle cx="60" cy="60" r="36" fill="none" stroke="#5e0d08" stroke-width="2" opacity="0.6"/>' +
      '<circle cx="60" cy="60" r="31" fill="none" stroke="#e66a5c" stroke-width="1" opacity="0.5"/>' +
      // embossed key
      '<g transform="translate(60 60) rotate(-35)"><circle cx="-14" cy="0" r="9" fill="none" stroke="#5e0d08" stroke-width="5"/>' +
      '<circle cx="-14" cy="0" r="9" fill="none" stroke="#e36b5d" stroke-width="1.4" transform="translate(-0.8 -0.8)"/>' +
      '<rect x="-5" y="-2.5" width="28" height="5" fill="#5e0d08"/><rect x="14" y="2" width="4" height="7" fill="#5e0d08"/><rect x="20" y="2" width="3" height="5" fill="#5e0d08"/></g>' +
      '<path d="M30 30 Q44 18 64 20" stroke="#fff" stroke-opacity="0.35" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  function renderHome(tab) {
    cleanup();
    _ms = null;
    if (tab) _tab = tab;
    var d = _load(), stars = starsOf(d), max = D.MISSIONS.length * 3;
    var u = user();
    var badges = D.BADGES.map(function(b) {
      var got = badgeEarned(b, d);
      return '<span class="ms-badge' + (got ? ' got' : '') + '" title="' + esc(b.es) + '">' + (got ? '🏅' : '🔒') + ' ' + esc(b.name) + '</span>';
    }).join('');
    var tabs = [['missions', '🗂️ Missions'], ['tools', '🧰 Tools'], ['history', '📜 History']].map(function(t) {
      return '<button type="button" class="ms-tab' + (_tab === t[0] ? ' on' : '') + '" data-act="tab" data-v="' + t[0] + '" aria-pressed="' + (_tab === t[0]) + '">' + t[1] + '</button>';
    }).join('');
    var body = _tab === 'tools' ? homeTools() : _tab === 'history' ? homeHistory(d) : homeMissions(d);
    var idea = D.PAPER_IDEAS[new Date().getDate() % D.PAPER_IDEAS.length];
    root().innerHTML =
      '<header class="ms-header">' + sealSVG() +
        '<div class="ms-title-wrap"><h1 class="ms-title">Mensajes Secretos</h1>' +
        '<p class="ms-sub">Codes &amp; ciphers · <i>Códigos y cifrados</i>' + (u ? ' — Agent ' + esc(u.name) : '') + '</p></div>' +
      '</header>' +
      '<div class="ms-progress ms-paper">' +
        '<div class="ms-prog-top"><b>★ ' + stars + '</b> <span>of ' + max + ' stars</span>' +
        '<div class="ms-bar"><i style="width:' + Math.round(stars / max * 100) + '%"></i></div></div>' +
        '<div class="ms-badges">' + badges + '</div>' +
      '</div>' +
      '<nav class="ms-tabs" aria-label="Sections">' + tabs + '</nav>' +
      body +
      '<aside class="ms-paper ms-note-card"><div class="ms-pin" aria-hidden="true"></div>' +
        '<b>✏️ Paper mission · Misión en papel</b><p>' + esc(idea) + '</p>' +
        '<p class="ms-small">Codes are best on real paper — pass a note to a brother or sister and see if they can crack it!</p></aside>';
  }

  function badgeEarned(b, d) {
    var m = (d && d.missions) || {}, n = 0;
    D.MISSIONS.forEach(function(x) {
      if ((m[x.id] && m[x.id].stars) && (!b.ciphers || b.ciphers.indexOf(x.cipher) >= 0)) n++;
    });
    return n >= b.need;
  }

  function missionCard(m, d) {
    var rec = ((d.missions || {})[m.id]) || null, no = missionNo(m.id), info = D.CIPHER_INFO[m.cipher];
    var chain = m.chainFrom ? '<span class="ms-chain">🔗 key in mission ' + missionNo(m.chainFrom) + '</span>' :
                m.chainTo ? '<span class="ms-chain">🔗 unlocks a key</span>' : '';
    return '<button type="button" class="ms-mission' + (rec && rec.stars ? ' done' : '') + '" data-act="mission" data-v="' + m.id + '">' +
      '<span class="ms-m-no">' + (no < 10 ? '0' : '') + no + '</span>' +
      '<span class="ms-m-main"><span class="ms-m-title">' + esc(m.title) + '</span>' +
      '<span class="ms-m-meta">' + info.icon + ' ' + esc(info.name) + ' · ' + esc(m.place) + '</span>' + chain + '</span>' +
      '<span class="ms-m-right">' + starRow(rec ? rec.stars : 0) + '<span class="ms-m-age">' + m.minAge + '+</span></span>' +
      (rec && rec.stars ? '<span class="ms-m-stamp" aria-hidden="true">DECODED</span>' : '') +
    '</button>';
  }
  function homeMissions(d) {
    var a = age();
    var rec = D.MISSIONS.filter(function(m) { return m.minAge <= a + 1; });
    var hard = D.MISSIONS.filter(function(m) { return m.minAge > a + 1; });
    var next = null;
    for (var i = 0; i < rec.length; i++) if (!((d.missions || {})[rec[i].id] || {}).stars) { next = rec[i]; break; }
    return '<section class="ms-section">' +
      (next ? '<button type="button" class="ms-next" data-act="mission" data-v="' + next.id + '"><span>Next mission</span><b>' + esc(next.title) + ' →</b></button>' : '') +
      '<h2 class="ms-h2">Your missions <small>for age ' + a + '</small></h2>' +
      '<div class="ms-mission-list">' + rec.map(function(m) { return missionCard(m, d); }).join('') + '</div>' +
      (hard.length ? '<h2 class="ms-h2">Expert missions <small>try them any time!</small></h2>' +
        '<div class="ms-mission-list">' + hard.map(function(m) { return missionCard(m, d); }).join('') + '</div>' : '') +
    '</section>';
  }
  var TOOLS = [
    { id: 'caesar', art: 'wheel', desc: 'Turn the brass ring to shift the alphabet.' },
    { id: 'atbash', art: 'atbash', desc: 'Fold the alphabet in half: A ↔ Z.' },
    { id: 'pigpen', art: 'pigpen', desc: 'Letters become shapes from a grid.' },
    { id: 'morse', art: 'morse', desc: 'Tap the telegraph key: dots and dashes.' },
    { id: 'polybius', art: 'polybius', desc: 'Every letter is a row and a column.' },
    { id: 'scytale', art: 'scytale', desc: 'Wrap a strip on a rod to read it.' },
    { id: 'sub', art: 'sub', desc: 'Crack any code by counting letters.', age: 10 }
  ];
  function homeTools() {
    return '<section class="ms-section"><div class="ms-tool-grid">' + TOOLS.map(function(t) {
      var info = D.CIPHER_INFO[t.id];
      return '<button type="button" class="ms-tool-card ms-paper" data-act="tool" data-v="' + t.id + '">' +
        '<span class="ms-tool-art">' + ART.art(t.art) + '</span>' +
        '<span class="ms-tool-name">' + esc(info.name) + '</span>' +
        '<span class="ms-tool-es">' + esc(info.es) + (t.age ? ' · ages ' + t.age + '+' : '') + '</span>' +
        '<span class="ms-tool-desc">' + esc(t.desc) + '</span></button>';
    }).join('') + '</div></section>';
  }
  function homeHistory(d) {
    var read = d.history || [];
    return '<section class="ms-section"><div class="ms-hist-grid">' + D.HISTORY.map(function(h) {
      return '<button type="button" class="ms-hist-card ms-paper" data-act="history" data-v="' + h.id + '">' +
        '<span class="ms-tool-art">' + ART.art(h.art) + '</span>' +
        '<span class="ms-hist-year">' + esc(h.year) + (read.indexOf(h.id) >= 0 ? ' · ✓ read' : '') + '</span>' +
        '<span class="ms-tool-name">' + esc(h.title) + '</span>' +
        '<span class="ms-tool-es">' + esc(h.es) + '</span></button>';
    }).join('') + '</div></section>';
  }

  // ---------------------------------------------------------------
  //  HISTORY DETAIL
  // ---------------------------------------------------------------
  var HIST_TOOL = { 'h-caesar': 'caesar', 'h-scytale': 'scytale', 'h-polybius': 'polybius', 'h-atbash': 'atbash', 'h-morse': 'morse', 'h-enigma': 'sub' };
  function renderHistory(id) {
    cleanup();
    var h = null; D.HISTORY.forEach(function(x) { if (x.id === id) h = x; });
    if (!h) return renderHome();
    var d = _load(); d.history = d.history || [];
    if (d.history.indexOf(id) < 0) { d.history.push(id); _save(d); }
    var tool = HIST_TOOL[id];
    root().innerHTML = '<div class="ms-screen">' + topBar('History · Historia', 'home-history') +
      '<article class="ms-paper ms-hist-detail">' +
        '<div class="ms-hist-art">' + ART.art(h.art) + '</div>' +
        '<div class="ms-hist-year">' + esc(h.year) + '</div>' +
        '<h2 class="ms-hist-title">' + esc(h.title) + '</h2><div class="ms-hist-es">' + esc(h.es) + '</div>' +
        h.text.map(function(p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        (tool ? '<button type="button" class="ms-btn brass" data-act="tool" data-v="' + tool + '">Try the ' + esc(D.CIPHER_INFO[tool].name) + ' →</button>' : '') +
      '</article></div>';
  }

  // ---------------------------------------------------------------
  //  TOOL SCREEN (free play) and embedded tools for missions
  // ---------------------------------------------------------------
  function renderTool(id) {
    cleanup();
    var info = D.CIPHER_INFO[id];
    _markTool(id);
    root().innerHTML = '<div class="ms-screen">' + topBar(info.icon + ' ' + esc(info.name) + ' · <i>' + esc(info.es) + '</i>', 'home-tools') +
      '<div class="ms-tool-host"></div>' +
      '<p class="ms-private">🔒 What you type here stays on this screen. It is never saved or sent anywhere.</p>' +
    '</div>';
    mountTool(id, $('.ms-tool-host'), { free: true });
  }

  function mountTool(id, host, ctx) {
    var fn = { caesar: toolCaesar, atbash: toolAtbash, pigpen: toolPigpen, morse: toolMorse,
               polybius: toolPolybius, scytale: toolScytale, sub: toolSub }[id];
    if (fn) fn(host, ctx || {});
  }

  function tryBox(label, placeholder) {
    var idn = 'ms-try-' + Math.random().toString(36).slice(2, 7);
    return '<div class="ms-try ms-paper">' +
      '<label for="' + idn + '" class="ms-label">' + label + '</label>' +
      '<textarea id="' + idn + '" class="ms-type ms-try-in" rows="2" maxlength="160" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + esc(placeholder) + '"></textarea>' +
      '<div class="ms-try-out ms-type" aria-live="polite"></div></div>';
  }
  function segBtns(name, opts, cur) {
    return '<div class="ms-seg" role="group" aria-label="' + esc(name) + '">' + opts.map(function(o) {
      return '<button type="button" class="ms-seg-b' + (o[0] === cur ? ' on' : '') + '" data-seg="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function bindSeg(host, fn) {
    $$('.ms-seg-b', host).forEach(function(b) {
      b.addEventListener('click', function() {
        $$('.ms-seg-b', b.parentNode).forEach(function(x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        sfx('click'); fn(b.getAttribute('data-seg'));
      });
    });
  }

  // ---- CAESAR ----------------------------------------------------
  function toolCaesar(host, ctx) {
    var m = ctx.mission, lang = (m && m.lang) || 'en', dir = 'enc';
    host.innerHTML = '<div class="ms-tool ms-caesar">' +
      '<div class="ms-row-center">' + segBtns('Alphabet', [['en', 'English · 26'], ['es', 'Español · 27 (Ñ)']], lang) + '</div>' +
      '<div class="ms-wheel-wrap"><canvas class="ms-wheel" aria-label="Caesar wheel. Drag the paper disc to turn it, or use the arrow buttons."></canvas></div>' +
      '<div class="ms-shift-ctl">' +
        '<button type="button" class="ms-round" data-cz="-1" aria-label="Shift one less">◀</button>' +
        '<div class="ms-shift-read" aria-live="polite"></div>' +
        '<button type="button" class="ms-round" data-cz="1" aria-label="Shift one more">▶</button></div>' +
      '<p class="ms-tip">Brass ring = <b>plain</b> letter · paper disc = <b class="ms-red">secret</b> letter. Drag the disc, or tap a letter to line it up.</p>' +
      '<div class="ms-map" aria-hidden="true"></div>' +
      (ctx.free ? '<div class="ms-row-center">' + segBtns('Direction', [['enc', '🔒 Encode'], ['dec', '🔓 Decode']], 'enc') + '</div>' +
        tryBox('Type a message', 'MEET ME AT THE PARK') : '') +
    '</div>';
    var canvas = $('.ms-wheel', host);
    var wheel = new ART.CaesarWheel(canvas, { alphabet: D.ALPHA[lang], onChange: update });
    onCleanup(function() { wheel.destroy(); });
    if (m && m.keyShown && age() <= 7) wheel.setShift(m.key, false);
    else if (ctx.free) wheel.setShift(3, false);
    function update(shift, sel) {
      var A = D.ALPHA[lang], n = A.length;
      $('.ms-shift-read', host).innerHTML = 'Shift <b>' + shift + '</b> · A → ' + A[shift % n] + (sel >= 0 ? ' · <span class="ms-red">' + A[sel] + ' → ' + A[(sel + shift) % n] + '</span>' : '');
      var top = '', bot = '';
      for (var i = 0; i < n; i++) {
        var on = i === sel ? ' on' : '';
        top += '<span class="' + on + '">' + A[i] + '</span>';
        bot += '<span class="' + on + '">' + A[(i + shift) % n] + '</span>';
      }
      var map = $('.ms-map', host);
      map.style.setProperty('--n', n);
      map.innerHTML = '<div class="ms-map-row plain">' + top + '</div><div class="ms-map-row secret">' + bot + '</div>';
      renderTry();
    }
    function renderTry() {
      var inp = $('.ms-try-in', host); if (!inp) return;
      var s = wheel.shift();
      $('.ms-try-out', host).textContent = inp.value ? D.caesar(inp.value, dir === 'enc' ? s : -s, lang) : '';
    }
    $$('[data-cz]', host).forEach(function(b) {
      b.addEventListener('click', function() { ART.audio(); wheel.setShift(wheel.shift() + (+b.getAttribute('data-cz')), true); });
    });
    bindSeg(host, function(v) {
      if (v === 'en' || v === 'es') { lang = v; wheel.setAlphabet(D.ALPHA[lang]); }
      else { dir = v; renderTry(); }
    });
    var inp = $('.ms-try-in', host); if (inp) inp.addEventListener('input', renderTry);
    update(wheel.shift(), -1);
    ctx.api = { setShift: function(k) { wheel.setShift(k, true); } };
  }

  // ---- ATBASH ----------------------------------------------------
  function toolAtbash(host, ctx) {
    var m = ctx.mission, lang = (m && m.lang) || 'en', sel = -1;
    host.innerHTML = '<div class="ms-tool ms-atbash">' +
      '<div class="ms-row-center">' + segBtns('Alphabet', [['en', 'English · 26'], ['es', 'Español · 27 (Ñ)']], lang) + '</div>' +
      '<div class="ms-strip-wrap"><div class="ms-strip"></div></div>' +
      '<p class="ms-tip">The alphabet is folded in half like a mirror. Tap a letter: it swaps with the one facing it.</p>' +
      '<div class="ms-pair-read ms-type" aria-live="polite"></div>' +
      (ctx.free ? tryBox('Type a message (Atbash works both ways!)', 'HELLO') : '') +
    '</div>';
    function draw() {
      var A = D.ALPHA[lang], n = A.length, half = Math.ceil(n / 2), s = '';
      for (var i = 0; i < half; i++) {
        var j = n - 1 - i;
        s += '<button type="button" class="ms-strip-col' + (i === sel ? ' on' : '') + '" data-i="' + i + '" aria-label="' + A[i] + ' swaps with ' + A[j] + '">' +
          '<span class="t">' + A[i] + '</span><span class="b">' + A[j] + '</span></button>';
      }
      var st = $('.ms-strip', host); st.style.setProperty('--n', half); st.innerHTML = s;
      $$('.ms-strip-col', host).forEach(function(b) {
        b.addEventListener('click', function() { sel = +b.getAttribute('data-i'); ART.tick(0.6); draw(); });
      });
      $('.ms-pair-read', host).innerHTML = sel >= 0 ? A[sel] + ' ⟷ <span class="ms-red">' + A[n - 1 - sel] + '</span>' : '&nbsp;';
      renderTry();
    }
    function renderTry() {
      var inp = $('.ms-try-in', host); if (!inp) return;
      $('.ms-try-out', host).textContent = inp.value ? D.atbash(inp.value, lang) : '';
    }
    bindSeg(host, function(v) { lang = v; sel = -1; draw(); });
    var inp = $('.ms-try-in', host); if (inp) inp.addEventListener('input', renderTry);
    draw();
  }

  // ---- PIGPEN ----------------------------------------------------
  function pigpenKeySVG(withN) {
    function grid(ox, letters, dot) {
      var s = '<g transform="translate(' + ox + ' 10)"><path class="ink" d="M40 0 L40 120 M80 0 L80 120 M0 40 L120 40 M0 80 L120 80"/>';
      for (var i = 0; i < 9; i++) {
        var cx = (i % 3) * 40 + 20, cy = Math.floor(i / 3) * 40 + 20;
        s += '<text x="' + (cx - (dot ? 7 : 0)) + '" y="' + (cy + 6) + '" class="k">' + letters[i] + '</text>';
        if (dot) s += '<circle cx="' + (cx + 9) + '" cy="' + cy + '" r="3.2" class="ink-dot"/>';
      }
      return s + '</g>';
    }
    function xs(ox, letters, dot) {
      var s = '<g transform="translate(' + ox + ' 10)"><path class="ink" d="M8 8 L112 112 M112 8 L8 112"/>';
      var p = [[60, 30], [26, 64], [94, 64], [60, 98]];
      for (var i = 0; i < 4; i++) {
        s += '<text x="' + (p[i][0] - (dot ? 6 : 0)) + '" y="' + (p[i][1] + 6) + '" class="k">' + letters[i] + '</text>';
        if (dot) s += '<circle cx="' + (p[i][0] + 9) + '" cy="' + p[i][1] + '" r="3.2" class="ink-dot"/>';
      }
      return s + '</g>';
    }
    return '<svg class="ms-pig-key" viewBox="0 0 560 140" role="img" aria-label="Pigpen key: two grids and two X shapes with letters">' +
      grid(0, 'ABCDEFGHI', false) + grid(146, 'JKLMNOPQR', true) + xs(292, 'STUV', false) + xs(438, 'WXYZ', true) + '</svg>' +
      (withN ? '<p class="ms-tip">Ñ is written as the N shape with a little ~ on top.</p>' : '');
  }
  function pigGlyphs(text, size) {
    return D.normalize(text, 'es').split(/\s+/).filter(Boolean).map(function(w, wi) {
      return '<span class="ms-pig-word">' + w.split('').map(function(ch, ci) {
        var info = D.PIGPEN[ch];
        return info ? ART.pigpenSVG(ch, info, size, wi * 131 + ci * 17 + ch.charCodeAt(0)) : '<span class="ms-pig-other">' + esc(ch) + '</span>';
      }).join('') + '</span>';
    }).join('');
  }
  function toolPigpen(host, ctx) {
    var m = ctx.mission, lang = (m && m.lang) || 'en', decoded = '';
    var letters = (lang === 'es' ? D.ALPHA.es : D.ALPHA.en).split('');
    host.innerHTML = '<div class="ms-tool ms-pigpen">' +
      '<div class="ms-paper ms-pig-keycard">' + pigpenKeySVG(lang === 'es') + '</div>' +
      '<p class="ms-tip">Each letter becomes the shape of its "pen". The second grid and X have a dot.</p>' +
      '<div class="ms-label">' + (ctx.insert ? 'Tap the matching shape to type its letter' : 'Shape keyboard — tap shapes to decode') + '</div>' +
      '<div class="ms-pig-kb">' + letters.map(function(ch) {
        return '<button type="button" class="ms-pig-k" data-ch="' + ch + '" aria-label="Pigpen ' + ch + '">' + ART.pigpenSVG(ch, D.PIGPEN[ch], 34, 999 + ch.charCodeAt(0)) + '<small>' + ch + '</small></button>';
      }).join('') +
        '<button type="button" class="ms-pig-k wide" data-ch=" " aria-label="Space">space</button>' +
        '<button type="button" class="ms-pig-k wide" data-ch="⌫" aria-label="Delete">⌫</button></div>' +
      (ctx.insert ? '' : '<div class="ms-paper ms-pig-dec"><span class="ms-label">Decoded</span><div class="ms-type ms-pig-dec-out" aria-live="polite">&nbsp;</div></div>') +
      (ctx.free ? tryBox('Write in pigpen — type a message', 'TREASURE') : '') +
    '</div>';
    $$('.ms-pig-k', host).forEach(function(b) {
      b.addEventListener('click', function() {
        var ch = b.getAttribute('data-ch'); ART.tick(0.5);
        if (ctx.insert) { ctx.insert(ch); return; }
        decoded = ch === '⌫' ? decoded.slice(0, -1) : (decoded + ch).slice(-60);
        $('.ms-pig-dec-out', host).innerHTML = decoded ? esc(decoded) : '&nbsp;';
      });
    });
    var inp = $('.ms-try-in', host);
    if (inp) inp.addEventListener('input', function() {
      $('.ms-try-out', host).innerHTML = pigGlyphs(inp.value, 34);
    });
  }

  // ---- POLYBIUS --------------------------------------------------
  function toolPolybius(host, ctx) {
    var built = [];
    var head = '<span class="ms-poly-h"></span>';
    for (var c = 1; c <= 5; c++) head += '<span class="ms-poly-h">' + c + '</span>';
    var cells = '';
    for (var r = 0; r < 5; r++) {
      cells += '<span class="ms-poly-h">' + (r + 1) + '</span>';
      for (var c2 = 0; c2 < 5; c2++) {
        var ch = D.POLY[r * 5 + c2];
        cells += '<button type="button" class="ms-poly-c" data-ch="' + ch + '" data-rc="' + (r + 1) + (c2 + 1) + '" aria-label="Row ' + (r + 1) + ', column ' + (c2 + 1) + ': ' + (ch === 'I' ? 'I or J' : ch) + '">' +
          ch + (ch === 'I' ? '<small>/J</small>' : '') + '</button>';
      }
    }
    host.innerHTML = '<div class="ms-tool ms-polybius">' +
      '<div class="ms-paper ms-poly-card"><div class="ms-poly-grid">' + head + cells + '</div></div>' +
      '<p class="ms-tip">Each letter is two numbers: <b>row</b> first, then <b>column</b>. C is 1 3. (I and J share a square; write Ñ as N.)</p>' +
      (ctx.insert ? '' : '<div class="ms-paper ms-poly-out"><span class="ms-label">Tapped</span><div class="ms-type ms-poly-built" aria-live="polite">&nbsp;</div></div>') +
      (ctx.free ? tryBox('Type a message to turn into numbers', 'CONDOR') : '') +
    '</div>';
    $$('.ms-poly-c', host).forEach(function(b) {
      b.addEventListener('click', function() {
        ART.tick(0.5);
        $$('.ms-poly-c', host).forEach(function(x) { x.classList.remove('on'); }); b.classList.add('on');
        var rc = b.getAttribute('data-rc');
        $$('.ms-poly-h', host).forEach(function(h, i) {
          h.classList.toggle('on', (i > 0 && i < 6 && +h.textContent === +rc[1]) || (i >= 6 && +h.textContent === +rc[0]));
        });
        if (ctx.insert) { ctx.insert(b.getAttribute('data-ch')); return; }
        built.push([b.getAttribute('data-ch'), rc]); if (built.length > 24) built.shift();
        $('.ms-poly-built', host).innerHTML = built.map(function(p) { return '<span class="ms-pair"><b>' + p[0] + '</b>' + p[1] + '</span>'; }).join('');
      });
    });
    var inp = $('.ms-try-in', host);
    if (inp) inp.addEventListener('input', function() { $('.ms-try-out', host).textContent = D.polybius(inp.value); });
  }

  // ---- SCYTALE ---------------------------------------------------
  function toolScytale(host, ctx) {
    var m = ctx.mission;
    var strip = m ? m.cipherText : D.scytale('SPARTA SENDS ITS GREETINGS', 4);
    var rows = m ? (age() <= 7 && m.keyShown ? m.key : 2) : 2;
    host.innerHTML = '<div class="ms-tool ms-scytale">' +
      '<div class="ms-rod-wrap"><canvas class="ms-rod" aria-label="Wooden rod with a strip of parchment wound around it. Drag up or down to turn the rod."></canvas></div>' +
      '<div class="ms-rod-ctl">' +
        '<div class="ms-ctl-group"><span class="ms-label">Rod size</span>' +
          '<button type="button" class="ms-round" data-rod="-1" aria-label="Thinner rod">−</button>' +
          '<span class="ms-rod-n" aria-live="polite"></span>' +
          '<button type="button" class="ms-round" data-rod="1" aria-label="Thicker rod">+</button></div>' +
        '<div class="ms-ctl-group"><span class="ms-label">Turn</span>' +
          '<button type="button" class="ms-round" data-turn="1" aria-label="Turn rod up">▲</button>' +
          '<button type="button" class="ms-round" data-turn="-1" aria-label="Turn rod down">▼</button></div>' +
      '</div>' +
      '<p class="ms-tip">A thicker rod fits more letters around it. When the size is right, each row along the rod reads as words.</p>' +
      '<div class="ms-paper ms-rod-rows"></div>' +
      '<div class="ms-label">The unwound strip</div><div class="ms-leather ms-type ms-strip-text"></div>' +
      (ctx.free ? '<div class="ms-try ms-paper"><label for="ms-scy-in" class="ms-label">Write your own message on the rod</label>' +
        '<textarea id="ms-scy-in" class="ms-type ms-try-in" rows="2" maxlength="60" autocomplete="off" spellcheck="false" placeholder="ATTACK AT DAWN"></textarea>' +
        '<button type="button" class="ms-btn brass ms-scy-write">Wrap it on this rod size</button></div>' : '') +
    '</div>';
    var rod = new ART.Scytale($('.ms-rod', host), { onRow: showRows });
    onCleanup(function() { rod.destroy(); });
    function showRows(front) {
      var list = D.scytaleRows(strip, rows);
      if (front == null) front = rod.frontRow();
      $('.ms-rod-n', host).textContent = rows + ' letters around';
      $('.ms-rod-rows', host).innerHTML = '<span class="ms-label">Reading along the rod</span>' + list.map(function(line, i) {
        return '<div class="ms-rod-row' + (i === front ? ' on' : '') + '"><span>Row ' + (i + 1) + '</span><b class="ms-type">' + esc(line) + '</b></div>';
      }).join('');
      $('.ms-strip-text', host).textContent = strip;
    }
    function apply() { rod.set(strip, rows); showRows(); }
    $$('[data-rod]', host).forEach(function(b) {
      b.addEventListener('click', function() { ART.audio(); rows = Math.max(2, Math.min(8, rows + (+b.getAttribute('data-rod')))); ART.tick(0.8); apply(); });
    });
    $$('[data-turn]', host).forEach(function(b) {
      b.addEventListener('click', function() { ART.audio(); rod.turn(+b.getAttribute('data-turn')); });
    });
    var wbtn = $('.ms-scy-write', host);
    if (wbtn) wbtn.addEventListener('click', function() {
      var v = D.scytaleLetters($('#ms-scy-in', host).value);
      if (!v) { ZsDialogToast('Type a message first'); return; }
      strip = D.scytale(v, rows); sfx('click'); apply();
    });
    apply();
  }
  function ZsDialogToast(msg) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg); }

  // ---- MORSE -----------------------------------------------------
  function toolMorse(host, ctx) {
    var m = ctx.mission, A = ART;
    var tone = new A.Tone(600), st = { code: '', tape: [], down: 0, dot: 170, dash: 500, timer: 0, wordTimer: 0, flash: false, slow: age() <= 8, play: 0 };
    host.innerHTML = '<div class="ms-tool ms-morse">' +
      '<div class="ms-telegraph">' +
        '<button type="button" class="ms-key-hit" aria-label="Telegraph key. Press and hold: short press is a dot, long press is a dash.">' + A.telegraphKeySVG() + '</button>' +
        '<div class="ms-lamp" aria-hidden="true">' + A.lampSVG() + '</div>' +
      '</div>' +
      '<p class="ms-tip">Press the key: a <b>short</b> press is a dot ·, a <b>long</b> press is a dash —. Pause and the letter appears. (Space bar works too.)</p>' +
      '<div class="ms-tape" aria-label="Paper tape"><div class="ms-tape-in"></div></div>' +
      '<div class="ms-morse-now ms-type" aria-live="polite">&nbsp;</div>' +
      '<div class="ms-morse-btns">' +
        '<button type="button" class="ms-btn" data-mo="done">✓ Letter done</button>' +
        '<button type="button" class="ms-btn" data-mo="space">␣ Space</button>' +
        '<button type="button" class="ms-btn" data-mo="clear">Clear tape</button>' +
        '<button type="button" class="ms-btn" data-mo="flash" aria-pressed="false">💡 Screen lamp: off</button>' +
        '<button type="button" class="ms-btn" data-mo="speed">' + (st.slow ? '🐢 Speed: slow' : '🐇 Speed: medium') + '</button>' +
      '</div>' +
      '<div class="ms-paper ms-tree-card">' + A.morseTreeSVG() + '<p class="ms-tip">Start at the top. Each dot goes <b>left</b>, each dash goes <b>right</b>. Ñ is — — · — —.</p></div>' +
      (m ? '<div class="ms-row-center"><button type="button" class="ms-btn brass" data-mo="playm">▶ Play the message</button></div>' :
        '<div class="ms-try ms-paper"><label for="ms-mo-in" class="ms-label">Type words to send in Morse</label>' +
        '<textarea id="ms-mo-in" class="ms-type ms-try-in" rows="2" maxlength="80" autocomplete="off" spellcheck="false" placeholder="SOS"></textarea>' +
        '<div class="ms-try-out ms-type" aria-live="polite"></div>' +
        '<button type="button" class="ms-btn brass" data-mo="play">▶ Send it</button></div>') +
      '<div class="ms-rhythm ms-small" aria-live="polite"></div>' +
    '</div>';
    var keyBtn = $('.ms-key-hit', host), svg = $('.ms-key-svg', host), lamp = $('.ms-lamp', host), tree = $('.ms-tree-svg', host);
    var flashEl = document.getElementById('ms-flash');

    function setKey(on) {
      svg.classList.toggle('down', on); lamp.classList.toggle('on', on);
      if (flashEl) flashEl.classList.toggle('on', on && st.flash);
      if (on) tone.on(); else tone.off();
    }
    function rhythm() {
      $('.ms-rhythm', host).textContent = 'Your rhythm: dot ≈ ' + Math.round(st.dot) + ' ms · dash ≈ ' + Math.round(st.dash) + ' ms (the key learns your speed)';
    }
    function threshold() { return Math.max(130, Math.min(650, (st.dot + st.dash) / 2)); }
    function letterGap() { return Math.max(650, Math.min(1600, st.dash * 1.7)); }
    function renderTape() {
      var html = st.tape.map(function(t) {
        if (t.sp) return '<span class="tp-sp"></span>';
        return '<span class="tp-l"><span class="tp-m">' + marks(t.code) + '</span><span class="tp-c">' + esc(t.ch || '') + '</span></span>';
      }).join('');
      if (!html && !st.code) html = '<span class="ms-tape-empty">Your dots and dashes print here…</span>';
      if (st.code) html += '<span class="tp-l cur"><span class="tp-m">' + marks(st.code) + '</span><span class="tp-c">…</span></span>';
      var tin = $('.ms-tape-in', host); tin.innerHTML = html;
      var tp = $('.ms-tape', host); tp.scrollLeft = tp.scrollWidth;
      var guess = st.code ? (D.MORSE_REV[st.code] || '?') : '';
      $('.ms-morse-now', host).innerHTML = st.code ? pretty(st.code) + ' → <b>' + esc(guess) + '</b>' : '&nbsp;';
      A.highlightTree(tree, st.code || null);
    }
    function marks(code) {
      return code.split('').map(function(s) { return s === '.' ? '<i class="d"></i>' : '<i class="h"></i>'; }).join('');
    }
    function pretty(code) { return code.replace(/\./g, '·').replace(/-/g, '—').split('').join(' '); }
    function commit() {
      clearTimeout(st.timer);
      if (!st.code) return;
      var ch = D.MORSE_REV[st.code] || '?';
      st.tape.push({ code: st.code, ch: ch }); st.code = '';
      if (st.tape.length > 40) st.tape.shift();
      ART.tick(0.3); renderTape();
      clearTimeout(st.wordTimer);
      st.wordTimer = setTimeout(function() {
        if (st.tape.length && !st.tape[st.tape.length - 1].sp) { st.tape.push({ sp: true }); renderTape(); }
      }, letterGap() * 2.2);
    }
    function press() {
      if (st.down || st.play) return;
      A.audio();
      clearTimeout(st.timer); clearTimeout(st.wordTimer);
      st.down = performance.now(); setKey(true);
    }
    function release() {
      if (!st.down) return;
      var dur = performance.now() - st.down; st.down = 0; setKey(false);
      if (dur < 25) return;
      var sym = dur < threshold() ? '.' : '-';
      if (sym === '.') st.dot = st.dot * 0.7 + Math.min(dur, 600) * 0.3;
      else st.dash = st.dash * 0.7 + Math.min(dur, 1500) * 0.3;
      if (st.dash < st.dot * 2.2) st.dash = st.dot * 2.2;
      if (st.code.length >= 6) st.code = '';
      st.code += sym; renderTape(); rhythm();
      st.timer = setTimeout(commit, letterGap());
    }
    keyBtn.addEventListener('pointerdown', function(e) { e.preventDefault(); keyBtn.setPointerCapture && keyBtn.setPointerCapture(e.pointerId); press(); });
    keyBtn.addEventListener('pointerup', release);
    keyBtn.addEventListener('pointercancel', release);
    keyBtn.addEventListener('lostpointercapture', release);
    keyBtn.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    function isTyping() { var t = document.activeElement; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'); }
    function kd(e) { if ((e.code === 'Space' || e.key === ' ') && !isTyping()) { e.preventDefault(); if (!e.repeat) press(); } }
    function ku(e) { if ((e.code === 'Space' || e.key === ' ') && !isTyping()) { e.preventDefault(); release(); } }
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);

    // ---- playback ----
    function playText(text, reveal) {
      stopPlay();
      var code = D.toMorse(text); if (!code) return;
      var token = ++st.playToken || (st.playToken = 1);
      st.play = token; st.tape = []; st.code = ''; renderTape();
      // with the screen lamp on, keep blinks under 3 per second
      var u = st.slow ? 150 : 100, seq = [], letters = code.split(' ');
      if (st.flash) u = Math.max(u, 180);
      letters.forEach(function(g) {
        if (g === '/') { seq.push({ gap: u * 5 }); seq.push({ sp: true }); return; }
        g.split('').forEach(function(s, i) {
          seq.push({ on: s === '.' ? u : u * 3, sym: s });
          if (i < g.length - 1) seq.push({ gap: u });
        });
        seq.push({ letter: g }); seq.push({ gap: u * 4 });
      });
      var i = 0, letterIdx = -1;
      function stepPlay() {
        if (st.play !== token) return;
        if (i >= seq.length) { st.play = 0; setKey(false); markPlaying(-1); A.highlightTree(tree, null); return; }
        var s = seq[i++];
        if (s.on) {
          if (!st.code) markPlaying(++letterIdx);
          st.code += s.sym; if (reveal) A.highlightTree(tree, st.code);
          renderTapeQuiet(reveal);
          svg.classList.add('down'); lamp.classList.add('on'); if (flashEl && st.flash) flashEl.classList.add('on'); tone.on();
          st.ptimer = setTimeout(function() { svg.classList.remove('down'); lamp.classList.remove('on'); if (flashEl) flashEl.classList.remove('on'); tone.off(); stepPlay(); }, s.on);
        } else if (s.gap) { st.ptimer = setTimeout(stepPlay, s.gap); }
        else if (s.letter) { st.tape.push({ code: st.code, ch: reveal ? (D.MORSE_REV[st.code] || '?') : '' }); st.code = ''; renderTapeQuiet(reveal); stepPlay(); }
        else if (s.sp) { st.tape.push({ sp: true }); stepPlay(); }
      }
      stepPlay();
    }
    function renderTapeQuiet(reveal) {
      var keep = A.highlightTree; if (!reveal) A.highlightTree = function() {};
      renderTape(); A.highlightTree = keep;
      if (!reveal) $('.ms-morse-now', host).innerHTML = st.code ? pretty(st.code) : '&nbsp;';
    }
    function markPlaying(idx) {
      var spans = $$('.ms-cipher .ms-mo-g');
      spans.forEach(function(sp, k) { sp.classList.toggle('on', k === idx); });
    }
    function stopPlay() {
      if (!st.play) return;
      st.play = 0; clearTimeout(st.ptimer); setKey(false); markPlaying(-1);
    }
    host.addEventListener('click', function(e) {
      var b = e.target.closest('[data-mo]'); if (!b) return;
      var act = b.getAttribute('data-mo'); A.audio();
      if (act === 'done') commit();
      else if (act === 'space') { commit(); st.tape.push({ sp: true }); renderTape(); }
      else if (act === 'clear') { stopPlay(); st.tape = []; st.code = ''; renderTape(); }
      else if (act === 'flash') { st.flash = !st.flash; b.textContent = '💡 Screen lamp: ' + (st.flash ? 'on' : 'off'); b.setAttribute('aria-pressed', st.flash); }
      else if (act === 'speed') { st.slow = !st.slow; b.textContent = (st.slow ? '🐢 Speed: slow' : '🐇 Speed: medium'); }
      else if (act === 'playm') playText(m.plain, false);
      else if (act === 'play') { var v = $('#ms-mo-in', host).value; if (!v.trim()) { ZsDialogToast('Type something to send'); return; } playText(v, true); }
    });
    var inp = $('#ms-mo-in', host);
    if (inp) inp.addEventListener('input', function() { $('.ms-try-out', host).textContent = pretty(D.toMorse(inp.value)).replace(/ {3}/g, '   '); });
    onCleanup(function() {
      stopPlay(); tone.off(); clearTimeout(st.timer); clearTimeout(st.wordTimer);
      if (flashEl) flashEl.classList.remove('on');
      document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku);
    });
    renderTape(); rhythm();
  }

  // ---- SUBSTITUTION + FREQUENCY ANALYSIS -------------------------
  var PRACTICE = {
    en: 'THE CONDOR IS ONE OF THE LARGEST FLYING BIRDS IN THE WORLD AND IT LIVES HIGH IN THE ANDES MOUNTAINS',
    es: 'EL CONDOR ES UNA DE LAS AVES VOLADORAS MAS GRANDES DEL MUNDO Y VIVE EN LO ALTO DE LA CORDILLERA DE LOS ANDES'
  };
  function toolSub(host, ctx) {
    var m = ctx.mission, lang = (m && m.lang) || 'en';
    var cipher = m ? m.cipherText : D.substitute(PRACTICE[lang], lang);
    var guess = {}, sel = null;
    host.innerHTML = '<div class="ms-tool ms-sub">' +
      (m ? '' : '<div class="ms-row-center">' + segBtns('Language', [['en', 'English text'], ['es', 'Texto en español']], lang) + '</div>') +
      '<div class="ms-paper ms-freq-card"><div class="ms-freq-head"><b>Letter counts</b>' +
        '<span class="ms-legend"><i class="sw c"></i>in this secret message <i class="sw t"></i>typical ' + (lang === 'es' ? 'Spanish' : 'English') + '</span></div>' +
        '<div class="ms-freq-chart"></div><div class="ms-freq-tip" role="status"></div>' +
        '<button type="button" class="ms-link ms-freq-table-btn" aria-expanded="false">Show as a table</button><div class="ms-freq-table" hidden></div></div>' +
      '<p class="ms-tip">Bars are lined up by rank: the most common secret letter sits next to the most common real letter. Tap a secret letter, then pick what you think it really is.</p>' +
      '<div class="ms-paper ms-crypto"></div>' +
      '<div class="ms-label">Pick a real letter for <b class="ms-sub-sel">—</b></div>' +
      '<div class="ms-sub-kb"></div>' +
      '<div class="ms-row-center"><button type="button" class="ms-btn" data-sb="clear">Clear all guesses</button>' +
        (ctx.setAnswer ? '<button type="button" class="ms-btn brass" data-sb="use">Use my decoding as the answer ↓</button>' : '') + '</div>' +
    '</div>';
    function draw() {
      var A = D.ALPHA[lang], lc = D.letterCounts(cipher, lang), total = lc.total || 1;
      var cRank = A.split('').filter(function(ch) { return lc.counts[ch] > 0; }).sort(function(a, b) { return lc.counts[b] - lc.counts[a] || (a < b ? -1 : 1); });
      var F = D.FREQ[lang], tRank = Object.keys(F).sort(function(a, b) { return F[b] - F[a]; });
      var nBars = Math.min(cRank.length, 14);
      var W = 640, H = 210, pad = 36, bw = (W - pad * 2) / nBars, maxV = Math.max(F[tRank[0]], lc.counts[cRank[0]] / total * 100) * 1.1;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="ms-freq-svg" role="img" aria-label="Letter frequency chart">';
      [5, 10].forEach(function(v) {
        var y = H - 40 - v / maxV * (H - 60);
        svg += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pad - 4) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + v + '%</text>';
      });
      for (var i = 0; i < nBars; i++) {
        var c = cRank[i], t = tRank[i], cv = lc.counts[c] / total * 100, tv = F[t];
        var x = pad + i * bw, inner = Math.min(16, bw / 2 - 3), hc = cv / maxV * (H - 60), ht = tv / maxV * (H - 60), base = H - 40;
        svg += '<g class="ms-fbar' + (sel === c ? ' sel' : '') + '" data-c="' + c + '" data-tip="Secret ' + c + ': ' + lc.counts[c] + ' times (' + cv.toFixed(1) + '%) · Typical #' + (i + 1) + ': ' + t + ' (' + tv + '%)">' +
          '<rect x="' + x + '" y="10" width="' + bw + '" height="' + (H - 10) + '" class="hit"/>' +
          barPath(x + bw / 2 - inner - 1, base, inner, hc, 'c') + barPath(x + bw / 2 + 1, base, inner, ht, 't') +
          '<text x="' + (x + bw / 2 - inner / 2 - 1) + '" y="' + (base + 16) + '" class="lc" text-anchor="middle">' + c + '</text>' +
          '<text x="' + (x + bw / 2 + inner / 2 + 1) + '" y="' + (base + 16) + '" class="lt" text-anchor="middle">' + t + '</text>' +
          (guess[c] ? '<text x="' + (x + bw / 2) + '" y="' + (base + 32) + '" class="lg" text-anchor="middle">=' + guess[c] + '</text>' : '') +
        '</g>';
      }
      svg += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - 40) + '" y2="' + (H - 40) + '" class="base"/></svg>';
      $('.ms-freq-chart', host).innerHTML = svg;
      $('.ms-freq-table', host).innerHTML = '<table><thead><tr><th>Rank</th><th>Secret letter</th><th>Count</th><th>Typical letter</th><th>%</th></tr></thead><tbody>' +
        cRank.map(function(c, i) { return '<tr><td>' + (i + 1) + '</td><td>' + c + '</td><td>' + lc.counts[c] + '</td><td>' + (tRank[i] || '') + '</td><td>' + (tRank[i] ? F[tRank[i]] : '') + '</td></tr>'; }).join('') + '</tbody></table>';
      $$('.ms-fbar', host).forEach(function(g) {
        g.addEventListener('pointerenter', function() { $('.ms-freq-tip', host).textContent = g.getAttribute('data-tip'); });
        g.addEventListener('click', function() { pick(g.getAttribute('data-c')); $('.ms-freq-tip', host).textContent = g.getAttribute('data-tip'); });
      });
      // interlinear cryptogram
      var used = {}; for (var k in guess) used[guess[k]] = k;
      $('.ms-crypto', host).innerHTML = cipher.split(' ').map(function(w) {
        return '<span class="ms-cw">' + w.split('').map(function(ch) {
          if (A.indexOf(ch) < 0) return '<span class="ms-cl"><b>' + esc(ch) + '</b><i>' + esc(ch) + '</i></span>';
          return '<button type="button" class="ms-cl' + (sel === ch ? ' sel' : '') + (guess[ch] ? ' got' : '') + '" data-c="' + ch + '" aria-label="Secret letter ' + ch + (guess[ch] ? ', guessed ' + guess[ch] : '') + '"><b>' + ch + '</b><i>' + (guess[ch] || '_') + '</i></button>';
        }).join('') + '</span>';
      }).join('');
      $$('.ms-crypto .ms-cl[data-c]', host).forEach(function(b) { b.addEventListener('click', function() { pick(b.getAttribute('data-c')); }); });
      $('.ms-sub-sel', host).textContent = sel || '—';
      $('.ms-sub-kb', host).innerHTML = A.split('').map(function(ch) {
        return '<button type="button" class="ms-kk' + (used[ch] ? ' used' : '') + (sel && guess[sel] === ch ? ' on' : '') + '" data-p="' + ch + '"' + (sel ? '' : ' disabled') + '>' + ch + '</button>';
      }).join('') + '<button type="button" class="ms-kk wide" data-p=""' + (sel ? '' : ' disabled') + '>erase</button>';
      $$('.ms-sub-kb .ms-kk', host).forEach(function(b) { b.addEventListener('click', function() { assign(b.getAttribute('data-p')); }); });
    }
    function barPath(x, base, w, h, cls) {
      if (h < 0.5) return '';
      var r = Math.min(4, w / 2, h);
      return '<path class="' + cls + '" d="M' + x + ' ' + base + ' L' + x + ' ' + (base - h + r) + ' Q' + x + ' ' + (base - h) + ' ' + (x + r) + ' ' + (base - h) +
        ' L' + (x + w - r) + ' ' + (base - h) + ' Q' + (x + w) + ' ' + (base - h) + ' ' + (x + w) + ' ' + (base - h + r) + ' L' + (x + w) + ' ' + base + 'Z"/>';
    }
    function pick(c) { sel = sel === c ? null : c; ART.tick(0.4); draw(); }
    function assign(p) {
      if (!sel) return;
      for (var k in guess) if (guess[k] === p && k !== sel) delete guess[k];
      if (p) guess[sel] = p; else delete guess[sel];
      sfx('click'); draw();
    }
    function decodedText() {
      var A = D.ALPHA[lang];
      return cipher.split('').map(function(ch) { return A.indexOf(ch) < 0 ? ch : (guess[ch] || '_'); }).join('');
    }
    host.addEventListener('click', function(e) {
      var b = e.target.closest('[data-sb]');
      if (b) {
        if (b.getAttribute('data-sb') === 'clear') { guess = {}; sel = null; draw(); }
        if (b.getAttribute('data-sb') === 'use' && ctx.setAnswer) ctx.setAnswer(decodedText().replace(/_/g, '?'));
      }
      var tb = e.target.closest('.ms-freq-table-btn');
      if (tb) {
        var t = $('.ms-freq-table', host), open = t.hasAttribute('hidden');
        if (open) t.removeAttribute('hidden'); else t.setAttribute('hidden', '');
        tb.setAttribute('aria-expanded', open); tb.textContent = open ? 'Hide the table' : 'Show as a table';
      }
    });
    bindSeg(host, function(v) { lang = v; cipher = D.substitute(PRACTICE[lang], lang); guess = {}; sel = null; draw(); });
    draw();
    ctx.api = {
      reveal: function(n) {
        // hint: fill in the n most common letters correctly
        var key = D.SUB_KEYS[lang], A = D.ALPHA[lang], lc = D.letterCounts(cipher, lang);
        var order = A.split('').filter(function(ch) { return lc.counts[ch] > 0; }).sort(function(a, b) { return lc.counts[b] - lc.counts[a]; });
        order.slice(0, n).forEach(function(c) { guess[c] = A[key.indexOf(c)]; });
        draw();
      }
    };
  }

  // ---------------------------------------------------------------
  //  MISSION SCREEN
  // ---------------------------------------------------------------
  function cipherDisplay(m) {
    var t = m.cipherText;
    switch (m.cipher) {
      case 'pigpen': return '<div class="ms-pig-msg">' + pigGlyphs(t, 44) + '</div>';
      case 'morse': return '<div class="ms-mo-msg ms-type">' + t.split(' / ').map(function(w) {
          return '<span class="ms-mo-w">' + w.split(' ').map(function(g) { return '<span class="ms-mo-g">' + g.replace(/\./g, '•').replace(/-/g, '—') + '</span>'; }).join('') + '</span>';
        }).join('<span class="ms-mo-slash">/</span>') + '</div>';
      case 'polybius': return '<div class="ms-type ms-big-type">' + esc(t).replace(/ \/ /g, '<span class="ms-mo-slash">/</span>') + '</div>';
      case 'scytale': return '<div class="ms-leather ms-type">' + esc(t) + '</div>';
      default: return '<div class="ms-type ms-big-type">' + esc(t) + '</div>';
    }
  }
  function keyLine(m) {
    if (m.cipher === 'sub') return 'Key: <b>unknown</b> — use frequency analysis!';
    if (!m.keyShown && m.chainFrom) return 'Key: 🔗 <b>hidden in mission ' + missionNo(m.chainFrom) + '</b>';
    if (!m.keyShown) return 'Key: <b>unknown</b> — try every shift!';
    if (m.cipher === 'caesar') return 'Key: <b>shift ' + m.key + '</b> · ' + (m.lang === 'es' ? 'Spanish alphabet (27)' : 'English alphabet (26)');
    if (m.cipher === 'scytale') return 'Key: <b>rod size ' + m.key + '</b>';
    return 'Key: <b>no key needed</b> — just the method';
  }

  var _ms = null;
  function renderMission(id) {
    cleanup();
    var m = missionById(id); if (!m) return renderHome();
    var d = _load(), rec = (d.missions || {})[id] || {}, info = D.CIPHER_INFO[m.cipher];
    var no = missionNo(id);
    _ms = { m: m, hints: 0, wrong: 0, solved: false };
    var young = age() <= 7;
    root().innerHTML = '<div class="ms-screen">' + topBar('Mission ' + no + ' of ' + D.MISSIONS.length, 'home-missions') +
      '<article class="ms-paper ms-dossier">' +
        '<div class="ms-clip" aria-hidden="true"></div>' +
        '<div class="ms-dos-head"><span class="ms-dos-place">' + esc(m.place) + '</span><span class="ms-dos-cls">TOP SECRET · ULTRA SECRETO</span></div>' +
        '<h2 class="ms-dos-title">' + esc(m.title) + '</h2>' +
        '<p class="ms-dos-brief">' + esc(m.brief) + '</p>' +
        '<div class="ms-cipher">' + cipherDisplay(m) + '</div>' +
        '<div class="ms-keyline">' + info.icon + ' ' + esc(info.name) + ' · ' + keyLine(m) + '</div>' +
        (rec.stars ? '<div class="ms-prev">Best so far: ' + starRow(rec.stars) + '</div>' : '') +
        '<div class="ms-stamp" aria-hidden="true">DESCIFRADO</div>' +
      '</article>' +
      '<div class="ms-tool-host"></div>' +
      '<section class="ms-paper ms-answer">' +
        '<label for="ms-ans" class="ms-label">Your decoded message · <i>tu mensaje descifrado</i></label>' +
        '<textarea id="ms-ans" class="ms-type ms-ans-in" rows="2" maxlength="200" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Type what it really says…"></textarea>' +
        '<div class="ms-ans-row">' +
          '<button type="button" class="ms-btn brass" data-act="check">Check ✓</button>' +
          '<button type="button" class="ms-btn" data-act="hint">💡 Hint <small>(−1 ★)</small></button>' +
          '<span class="ms-worth">Worth: <span class="ms-worth-stars">' + starRow(3) + '</span></span>' +
        '</div>' +
        '<div class="ms-hints" aria-live="polite"></div>' +
        '<div class="ms-result" aria-live="polite"></div>' +
      '</section>' +
    '</div>';
    var ctx = { mission: m };
    var ans = $('#ms-ans');
    if (m.cipher === 'pigpen' || m.cipher === 'polybius') {
      ctx.insert = function(ch) {
        if (ch === '⌫') ans.value = ans.value.slice(0, -1); else ans.value += ch;
        ans.dispatchEvent(new Event('input'));
      };
    }
    if (m.cipher === 'sub') ctx.setAnswer = function(t) { ans.value = t; sfx('click'); };
    mountTool(m.cipher, $('.ms-tool-host'), ctx);
    _ms.ctx = ctx;
    if (young && m.hints.length) showHint(true);
    ans.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); checkAnswer(); } });
  }
  function currentStars() {
    if (!_ms) return 0;
    return Math.max(1, 3 - _ms.hints - Math.floor(_ms.wrong / 2));
  }
  function showHint(free) {
    if (!_ms || _ms.solved) return;
    var m = _ms.m;
    if (_ms.hints >= m.hints.length) { ZsDialogToast('No more hints — you can do it!'); return; }
    var text = m.hints[_ms.hints];
    if (!free) _ms.hints++;
    else { _ms.freeHint = true; }
    // hints that also move the tool
    if (!free && m.cipher === 'caesar' && _ms.hints === 1 && _ms.ctx.api && m.key && (m.keyShown || m.chainFrom)) _ms.ctx.api.setShift(m.key);
    if (!free && m.cipher === 'sub' && _ms.ctx.api) _ms.ctx.api.reveal(_ms.hints === 1 ? 3 : _ms.hints === 2 ? 6 : 10);
    var list = m.hints.slice(0, Math.max(_ms.hints, free ? 1 : 0));
    $('.ms-hints').innerHTML = list.map(function(h, i) { return '<div class="ms-hint"><b>Hint ' + (i + 1) + ':</b> ' + esc(h) + (free && i === 0 && !_ms.hints ? ' <small>(free for new agents)</small>' : '') + '</div>'; }).join('');
    $('.ms-worth-stars').innerHTML = starRow(currentStars());
    sfx('click');
  }
  function checkAnswer() {
    if (!_ms || _ms.solved) return;
    var ans = $('#ms-ans'), v = ans.value;
    if (!D.answerKey(v)) { ZsDialogToast('Type your decoded message first'); return; }
    if (D.checkAnswer(v, _ms.m.plain)) return solved();
    _ms.wrong++;
    sfx('wrong');
    ans.classList.remove('shake'); void ans.offsetWidth; ans.classList.add('shake');
    // gentle feedback: how many letters already match in place
    var a = D.answerKey(v), b = D.answerKey(_ms.m.plain), ok = 0;
    for (var i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) ok++;
    $('.ms-result').innerHTML = '<div class="ms-miss">Not quite. ' + ok + ' of ' + b.length + ' letters are right so far' +
      (a.length !== b.length ? ' (the message has ' + b.length + ' letters, you typed ' + a.length + ')' : '') + '. Keep going!</div>';
    $('.ms-worth-stars').innerHTML = starRow(currentStars());
  }
  function solved() {
    var m = _ms.m, stars = currentStars();
    _ms.solved = true;
    var d = _load(); d.missions = d.missions || {};
    var prev = (d.missions[m.id] || {}).stars || 0;
    var before = D.BADGES.filter(function(b) { return badgeEarned(b, d); }).map(function(b) { return b.id; });
    d.missions[m.id] = { stars: Math.max(prev, stars), date: _today() };
    d.lastPlayed = _today();
    _save(d);
    var newBadges = D.BADGES.filter(function(b) { return badgeEarned(b, d) && before.indexOf(b.id) < 0; });
    sfx('cheer'); setTimeout(function() { sfx('star'); }, 450);
    if (typeof ActivityLog !== 'undefined') ActivityLog.log(APP_NAME, '🔐', 'Decoded mission ' + missionNo(m.id) + ' "' + m.title + '" (' + stars + '★)');
    $('.ms-dossier').classList.add('solved');
    var next = D.MISSIONS[D.MISSIONS.indexOf(m) + 1];
    var chainNote = m.chainTo ? '<p class="ms-chain-note">🔗 You found a key! Mission ' + missionNo(m.chainTo) + ' needs it.</p>' : '';
    var idea = D.PAPER_IDEAS[(D.MISSIONS.indexOf(m)) % D.PAPER_IDEAS.length];
    $('.ms-result').innerHTML = '<div class="ms-win">' +
      '<div class="ms-win-stars">' + starRow(stars).replace(/ms-star on/g, 'ms-star on pop') + '</div>' +
      '<div class="ms-win-plain ms-type">' + esc(m.plain) + '</div>' +
      (m.note ? '<p class="ms-fact">📜 ' + esc(m.note) + '</p>' : '') + chainNote +
      (newBadges.length ? '<p class="ms-new-badge">🏅 New badge: ' + newBadges.map(function(b) { return esc(b.name) + ' · <i>' + esc(b.es) + '</i>'; }).join(', ') + '</p>' : '') +
      '<p class="ms-small">✏️ Paper mission: ' + esc(idea) + '</p>' +
      '<div class="ms-ans-row">' + (next ? '<button type="button" class="ms-btn brass" data-act="mission" data-v="' + next.id + '">Next mission →</button>' : '') +
        '<button type="button" class="ms-btn" data-act="home-missions">All missions</button></div></div>';
    $$('.ms-answer .ms-ans-row')[0].style.display = 'none';
    var fb = document.getElementById('feedback'), fe = document.getElementById('feedbackEmoji');
    if (fb && fe) { fe.textContent = '🔓'; fb.classList.add('show'); setTimeout(function() { fb.classList.remove('show'); }, 1100); }
  }

  // ---------------------------------------------------------------
  //  Actions + init
  // ---------------------------------------------------------------
  function onClick(e) {
    var b = e.target.closest('[data-act]'); if (!b || !root().contains(b)) return;
    var act = b.getAttribute('data-act'), v = b.getAttribute('data-v');
    switch (act) {
      case 'home': sfx('click'); renderHome(); break;
      case 'home-missions': sfx('click'); renderHome('missions'); break;
      case 'home-tools': sfx('click'); renderHome('tools'); break;
      case 'home-history': sfx('click'); renderHome('history'); break;
      case 'tab': sfx('click'); renderHome(v); break;
      case 'tool': sfx('click'); renderTool(v); break;
      case 'history': sfx('click'); renderHistory(v); break;
      case 'mission': sfx('click'); renderMission(v); break;
      case 'check': checkAnswer(); break;
      case 'hint': showHint(false); break;
      default: return;
    }
    if (['home', 'home-missions', 'home-tools', 'home-history', 'tool', 'history', 'mission'].indexOf(act) >= 0) window.scrollTo(0, 0);
  }

  function init() {
    if (!root()) return;
    // desk + paper textures
    var desk = document.getElementById('ms-desk');
    if (desk) {
      ART.drawDesk(desk);
      var t = 0;
      window.addEventListener('resize', function() { clearTimeout(t); t = setTimeout(function() { ART.drawDesk(desk); }, 200); });
    }
    try {
      document.documentElement.style.setProperty('--ms-paper-tex', 'url(' + ART.paperTile(7) + ')');
      document.documentElement.style.setProperty('--ms-leather-tex', 'url(' + ART.paperTile(19, [196, 150, 100]) + ')');
    } catch (e) {}
    var defs = document.createElement('div'); defs.innerHTML = ART.inkDefs(); document.body.appendChild(defs.firstChild);
    root().addEventListener('click', onClick);
    renderHome();
    if (typeof CloudSync !== 'undefined' && CloudSync.online && _key()) {
      try {
        CloudSync.pull(_key()).then(function(changed) {
          if (changed && !_ms && $('.ms-header')) renderHome();
        });
      } catch (e) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { starsOf: starsOf, home: renderHome, tool: renderTool, mission: renderMission };
})();
