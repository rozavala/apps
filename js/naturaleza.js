/* ================================================================
   EXPLORADOR DE NATURALEZA 🦅 — an offline field guide to Chilean
   nature, plus real outdoor spotting.

   Views (hash-routed so the back button works):
     #home              menu
     #guide[/group]     browse the field guide by group
     #sp/<id>           species page with the large plate
     #spot[/season]     "Spot it!" seasonal bingo cards
     #notebook          field notebook of every sighting + badges
     #quiz              "Who am I?" menu  →  #quiz/play

   Per-kid storage: getUserAppKey('zs_naturaleza_') → one JSON blob
     { v:1,
       sightings: [{ s:'zorzal', d:'2026-11-03', p:'garden', c:'2026-spring' }],
       cards:     { '2026-spring': { found:['zorzal',…], done:'2026-11-20' } },
       quiz:      { 'clues_birds': 3, 'tap_all': 2 },     // best stars 0–3
       seen:      ['condor', …] }                          // pages opened (not scored)

   Stars (pure, see starsFor): each season card gives 1★ at 3 finds,
   2★ at 6, 3★ when all 9 are found; each quiz mode × group gives its
   best 0–3★.
   ================================================================ */

var Naturaleza = (function() {
  'use strict';

  var D = NaturalezaData, A = NaturalezaArt;
  var PREFIX = 'zs_naturaleza_';
  var APP = 'Explorador de Naturaleza';
  var root = null, data = null, tier = 'intermediate', userName = '';
  var quiz = null, sheet = null;

  // ---------------- storage ----------------
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _load() {
    var k = _key(), d = null;
    if (k) { try { d = JSON.parse(localStorage.getItem(k)); } catch (e) { d = null; } }
    d = (d && typeof d === 'object') ? d : {};
    if (!Array.isArray(d.sightings)) d.sightings = [];
    if (!d.cards || typeof d.cards !== 'object') d.cards = {};
    if (!d.quiz || typeof d.quiz !== 'object') d.quiz = {};
    if (!Array.isArray(d.seen)) d.seen = [];
    d.v = 1;
    return d;
  }
  function _save() {
    var k = _key();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }

  // The star rule (mirrors the APP_STAR_CONFIGS entry handed to the integrator)
  function starsFor(d) {
    var n = 0, c, f;
    for (c in (d.cards || {})) {
      f = ((d.cards[c] || {}).found || []).length;
      n += f >= 9 ? 3 : f >= 6 ? 2 : f >= 3 ? 1 : 0;
    }
    for (c in (d.quiz || {})) n += Math.max(0, Math.min(3, d.quiz[c] || 0));
    return n;
  }

  // ---------------- helpers ----------------
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function sfx(name) { if (typeof SFX !== 'undefined' && SFX[name]) { try { SFX[name](); } catch (e) {} } }
  function logAct(icon, text) { if (typeof ActivityLog !== 'undefined' && ActivityLog.log) { try { ActivityLog.log(APP, icon, text); } catch (e) {} } }
  function toast(msg) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function parseIso(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function nice(s) { var d = parseIso(s); return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() : ''; }
  function stars(n, max) { var s = ''; for (var i = 0; i < (max || 3); i++) s += '<span class="nat-star' + (i < n ? ' on' : '') + '">★</span>'; return '<span class="nat-stars" aria-label="' + n + ' of ' + (max || 3) + ' stars">' + s + '</span>'; }
  function group(id) { for (var i = 0; i < D.GROUPS.length; i++) if (D.GROUPS[i].id === id) return D.GROUPS[i]; return null; }
  function season(id) { for (var i = 0; i < D.SEASONS.length; i++) if (D.SEASONS[i].id === id) return D.SEASONS[i]; return null; }
  function place(id) { for (var i = 0; i < D.PLACES.length; i++) if (D.PLACES[i].id === id) return D.PLACES[i]; return null; }
  function plateNo(id) { for (var i = 0; i < D.SPECIES.length; i++) if (D.SPECIES[i].id === id) return i + 1; return 0; }
  function plate(id, o) { var s = D.get(id); return A.render(id, { silhouette: o && o.sil, label: o && o.label ? (s.en + ' · ' + s.es) : '' }); }

  // Chilean seasons: summer 21 Dec – 20 Mar, autumn 21 Mar – 20 Jun, winter 21 Jun – 20 Sep, spring 21 Sep – 20 Dec.
  function seasonFor(dt) {
    var y = dt.getFullYear(), md = (dt.getMonth() + 1) * 100 + dt.getDate(), id, sy, st, en;
    if (md >= 1221 || md < 321) { id = 'summer'; sy = md >= 1221 ? y : y - 1; st = new Date(sy, 11, 21); en = new Date(sy + 1, 2, 20); }
    else if (md < 621) { id = 'autumn'; sy = y; st = new Date(y, 2, 21); en = new Date(y, 5, 20); }
    else if (md < 921) { id = 'winter'; sy = y; st = new Date(y, 5, 21); en = new Date(y, 8, 20); }
    else { id = 'spring'; sy = y; st = new Date(y, 8, 21); en = new Date(y, 11, 20); }
    return { id: id, year: sy, cardId: sy + '-' + id, start: st, end: en };
  }
  function cardLabel(cardId) {
    var p = cardId.split('-'), s = season(p[1]), y = +p[0];
    if (!s) return cardId;
    return s.en + ' · ' + s.es + ' ' + (s.id === 'summer' ? y + '–' + String(y + 1).slice(2) : y);
  }
  function now() { return seasonFor(new Date()); }

  function speak(parts) {
    if (typeof ZsTTS === 'undefined' || !ZsTTS.supported()) return;
    var i = 0;
    (function next() {
      if (i >= parts.length) return;
      var p = parts[i++];
      ZsTTS.speak(p.text, { lang: p.lang, onEnd: next, onError: function() {} });
    })();
  }
  function ttsOn() { return typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled; }

  // ---------------- frame ----------------
  function header(title, sub, back) {
    return '<header class="nat-head">' +
      (back ? '<a class="nat-back" href="#' + back + '" aria-label="Back">‹</a>' : '') +
      '<div class="nat-head-txt"><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      '<div class="nat-total" title="Stars earned in this app">★ ' + starsFor(data) + '</div></header>';
  }
  function setView(html, cls) {
    root.className = 'nat-root ' + (cls || '');
    root.innerHTML = html;
    window.scrollTo(0, 0);
    var h = root.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) {} }
    var tab = root.querySelector('.nat-tab.on');
    if (tab && tab.parentNode.scrollWidth > tab.parentNode.clientWidth) {
      tab.parentNode.scrollLeft = Math.max(0, tab.offsetLeft - (tab.parentNode.clientWidth - tab.offsetWidth) / 2);
    }
  }

  // ---------------- HOME ----------------
  function viewHome() {
    var s = now(), card = data.cards[s.cardId] || { found: [] }, se = season(s.id);
    var lifeIds = {};
    data.sightings.forEach(function(x) { lifeIds[x.s] = 1; });
    var life = Object.keys(lifeIds).length;
    var hi = userName ? 'Hola, ' + esc(userName) + '! ' : '';
    var html = '<header class="nat-hero">' +
      '<div class="nat-hero-plate">' + plate('condor') + '</div>' +
      '<div class="nat-hero-txt"><p class="nat-pencil">' + hi + 'Field journal of Chilean nature</p>' +
      '<h1>Explorador de Naturaleza</h1>' +
      '<p class="nat-hero-sub">31 hand-drawn plates · go outside and spot them</p>' +
      '<div class="nat-total nat-total-hero">★ ' + starsFor(data) + '</div></div></header>';
    html += '<a class="nat-season-band" href="#spot" style="--tint:' + se.tint + '">' +
      '<span class="nat-season-ico" aria-hidden="true">' + se.icon + '</span>' +
      '<span><b>Now: ' + se.en + ' · ' + se.es + '</b><small>' + se.range + ' · ' + card.found.length + ' of 9 found on your Spot it! card</small></span>' +
      '<span class="nat-go" aria-hidden="true">›</span></a>';
    html += '<nav class="nat-menu">' +
      menuCard('#guide', 'Field Guide', 'Guía de campo', 'Browse all 31 species by group, with big detailed plates.', plate('picaflor')) +
      menuCard('#spot', 'Spot it!', '¡Encuéntralo!', 'Seasonal nature bingo — go outside and tick what you find.', spotMini(s)) +
      menuCard('#quiz', 'Who am I?', '¿Quién soy?', 'Clues, silhouettes and picture games. Earn stars!', plate('chuncho', { sil: true })) +
      menuCard('#notebook', 'Field Notebook', 'Libreta de campo', life + ' species spotted · ' + data.sightings.length + ' sightings logged.', notebookMini()) +
      '</nav>';
    html += '<p class="nat-foot">Look, listen and take notes — but leave nests, plants and animals just as you found them.</p>';
    setView(html, 'is-home');
  }
  function menuCard(href, en, es, desc, art) {
    return '<a class="nat-mcard" href="' + href + '"><div class="nat-mcard-art">' + art + '</div>' +
      '<div class="nat-mcard-txt"><b>' + en + '</b><span class="nat-pencil">' + es + '</span><small>' + desc + '</small></div></a>';
  }
  function spotMini(s) {
    var se = season(s.id), card = data.cards[s.cardId] || { found: [] }, h = '<div class="nat-spotmini">';
    for (var i = 0; i < 9; i++) h += '<span class="' + (card.found.indexOf(se.card[i]) >= 0 ? 'on' : '') + '"></span>';
    return h + '</div>';
  }
  function notebookMini() {
    return '<svg viewBox="0 0 120 90" class="nat-nbmini" aria-hidden="true"><rect x="22" y="8" width="76" height="76" rx="4" fill="#7a5a3a"/><rect x="26" y="10" width="70" height="72" rx="3" fill="#f6eed8"/>' +
      '<path d="M34 26h50M34 36h50M34 46h44M34 56h50M34 66h36" stroke="#b8a888" stroke-width="1.4"/><circle cx="74" cy="58" r="9" fill="none" stroke="#a8322a" stroke-width="2"/>' +
      '<path d="M69 58l4 4 7-8" fill="none" stroke="#a8322a" stroke-width="2.4" stroke-linecap="round"/><rect x="18" y="16" width="8" height="6" rx="2" fill="#c9a878"/><rect x="18" y="40" width="8" height="6" rx="2" fill="#c9a878"/><rect x="18" y="64" width="8" height="6" rx="2" fill="#c9a878"/>' +
      '<path d="M100 20l8 50-4 2-8-50z" fill="#e0b040"/><path d="M104 72l-1 8 4-6z" fill="#3a2a1a"/></svg>';
  }

  // ---------------- GUIDE ----------------
  function viewGuide(gid) {
    var g = group(gid) || D.GROUPS[0];
    var tabs = '<div class="nat-tabs" role="tablist">' + D.GROUPS.map(function(x) {
      return '<a role="tab" aria-selected="' + (x.id === g.id) + '" class="nat-tab' + (x.id === g.id ? ' on' : '') + '" href="#guide/' + x.id + '">' +
        '<span aria-hidden="true">' + x.icon + '</span> ' + x.en + '</a>';
    }).join('') + '</div>';
    var list = D.SPECIES.filter(function(s) { return s.group === g.id; });
    var spotted = {};
    data.sightings.forEach(function(x) { spotted[x.s] = 1; });
    var cards = '<div class="nat-grid">' + list.map(function(s) {
      return '<a class="nat-card" href="#sp/' + s.id + '">' +
        '<span class="nat-card-no">No. ' + pad(plateNo(s.id)) + '</span>' +
        (spotted[s.id] ? '<span class="nat-card-stamp" title="You have spotted this one">✓ spotted</span>' : '') +
        '<div class="nat-card-plate">' + plate(s.id) + '</div>' +
        '<div class="nat-card-lbl"><b class="nat-pencil">' + s.es + '</b><span>' + s.en + '</span><i>' + s.sci + '</i></div></a>';
    }).join('') + '</div>';
    setView(header('Field Guide', g.es + ' · ' + list.length + ' species', 'home') + tabs + cards, 'is-guide');
  }

  // ---------------- SPECIES PAGE ----------------
  function viewSpecies(id) {
    var s = D.get(id);
    if (!s) { viewGuide(); return; }
    if (data.seen.indexOf(id) < 0) { data.seen.push(id); _save(); }
    var list = D.SPECIES.filter(function(x) { return x.group === s.group; });
    var ix = list.indexOf(s), prev = list[(ix - 1 + list.length) % list.length], next = list[(ix + 1) % list.length];
    var mine = data.sightings.filter(function(x) { return x.s === id; });
    var isPlant = s.group === 'plants';
    var rows = [
      ['📏', 'Size', s.size], ['📍', 'Where in Chile', s.where], [isPlant ? '🌱' : '🍽️', isPlant ? 'Where it grows' : 'What it eats', s.food],
      ['🔎', 'How to recognise it', s.look], ['📅', 'When to see it', s.when]
    ];
    var facts = rows.map(function(r) {
      return '<div class="nat-fact"><span class="nat-fact-ico" aria-hidden="true">' + r[0] + '</span><div><b class="nat-pencil">' + r[1] + '</b><p>' + r[2] + '</p></div></div>';
    }).join('');
    var g = group(s.group);
    var html = header(s.es, s.en, 'guide/' + s.group) +
      '<article class="nat-sp">' +
      '<figure class="nat-sp-plate"><span class="nat-card-no">Plate ' + pad(plateNo(id)) + ' · ' + g.en + '</span>' + plate(id, { label: 1 }) +
      '<figcaption><b class="nat-pencil">' + s.es + '</b> · ' + s.en + ' · <i>' + s.sci + '</i></figcaption></figure>' +
      '<div class="nat-sp-actions">' +
      (ttsOn() ? '<button type="button" class="nat-btn nat-btn-soft" data-act="read" data-id="' + id + '">🔊 Read aloud</button>' : '') +
      '<button type="button" class="nat-btn" data-act="log" data-id="' + id + '">✓ I spotted it!</button></div>' +
      (mine.length ? '<p class="nat-sp-mine nat-pencil">In your notebook: ' + mine.length + ' sighting' + (mine.length > 1 ? 's' : '') + ' · last on ' + nice(mine[mine.length - 1].d) + '</p>' : '') +
      '<div class="nat-facts">' + facts + '</div>' +
      '<div class="nat-funfact"><b class="nat-pencil">✨ Fun fact</b><p>' + s.fun + '</p></div>' +
      (s.status ? '<p class="nat-status">' + s.status + '</p>' : '') +
      '<nav class="nat-pn"><a class="nat-btn nat-btn-soft" href="#sp/' + prev.id + '">‹ ' + prev.es + '</a><a class="nat-btn nat-btn-soft" href="#sp/' + next.id + '">' + next.es + ' ›</a></nav>' +
      '</article>';
    setView(html, 'is-species');
  }
  function readSpecies(id) {
    var s = D.get(id);
    if (!s) return;
    speak([{ text: s.es, lang: 'es-CL' }, { text: s.en + '. ' + s.look + ' ' + s.fun, lang: 'en-US' }]);
  }

  // ---------------- SPOT IT! ----------------
  function viewSpot(sid) {
    var cur = now(), se = season(sid) || season(cur.id), isNow = se.id === cur.id;
    var cardId = isNow ? cur.cardId : null;
    var card = (cardId && data.cards[cardId]) || { found: [] };
    var tabs = '<div class="nat-tabs nat-stabs" role="tablist">' + D.SEASONS.map(function(x) {
      return '<a role="tab" aria-selected="' + (x.id === se.id) + '" class="nat-tab' + (x.id === se.id ? ' on' : '') + '" href="#spot/' + x.id + '" style="--tint:' + x.tint + '">' +
        '<span aria-hidden="true">' + x.icon + '</span> ' + x.en + (x.id === cur.id ? ' <em>now</em>' : '') + '</a>';
    }).join('') + '</div>';
    var n = card.found.length, st = n >= 9 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0;
    var info = isNow ?
      '<div class="nat-spot-info"><div><b>' + se.en + ' · ' + se.es + '</b> <span class="nat-pencil">' + se.range + '</span><small>' +
        (tier === 'beginner' ? 'Go outside with a grown-up. Tap a picture when you find it!' : 'Go outside and look for these around central Chile. Tap a square when you find one.') +
        '</small></div><div class="nat-spot-score"><b>' + n + '/9</b>' + stars(st) + '<small>★ at 3 · 6 · 9</small></div></div>' :
      '<div class="nat-spot-info is-later"><div><b>' + se.en + ' · ' + se.es + '</b> <span class="nat-pencil">' + se.range + '</span><small>This card opens when ' + se.en.toLowerCase() + ' begins. For now it is a preview of what to look for.</small></div></div>';
    var grid = '<div class="nat-bingo' + (isNow ? '' : ' is-locked') + '" style="--tint:' + se.tint + '">';
    se.card.forEach(function(id) {
      var s = D.get(id), got = card.found.indexOf(id) >= 0;
      var when = '';
      if (got) { for (var i = data.sightings.length - 1; i >= 0; i--) if (data.sightings[i].s === id && data.sightings[i].c === cardId) { when = nice(data.sightings[i].d); break; } }
      grid += '<button type="button" class="nat-sq' + (got ? ' got' : '') + '" ' + (isNow ? 'data-act="log" data-id="' + id + '"' : 'data-act="peek" data-id="' + id + '"') +
        ' aria-label="' + esc(s.en + ' · ' + s.es + (got ? ' — found' : '')) + '">' +
        '<span class="nat-sq-plate">' + plate(id) + '</span><span class="nat-sq-name nat-pencil">' + s.es + '</span>' +
        (got ? '<span class="nat-sq-stamp" aria-hidden="true"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="1"/><path d="M18 31l8 8 16-18" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><small>' + when + '</small></span>' : '') +
        '</button>';
    });
    grid += '</div>';
    var badge = isNow && n >= 9 ? '<div class="nat-fullcard">' + badgeSvg(se) + '<p><b>Full card!</b> You are a ' + se.en + ' Naturalist · Naturalista de ' + se.es + '.</p></div>' : '';
    setView(header('Spot it!', '¡Encuéntralo! · seasonal nature bingo', 'home') + tabs + info + grid + badge +
      '<p class="nat-foot">Squares are species often seen around central Chile in this season. Found something else? Log it from its page in the Field Guide.</p>', 'is-spot');
  }
  function badgeSvg(se) {
    return '<svg class="nat-badge-svg" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="nbg-' + se.id + '" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="' + se.tint + '"/></radialGradient></defs>' +
      '<path d="M50 4l10 9 13-3 4 13 13 4-3 13 9 10-9 10 3 13-13 4-4 13-13-3-10 9-10-9-13 3-4-13-13-4 3-13-9-10 9-10-3-13 13-4 4-13 13 3z" fill="url(#nbg-' + se.id + ')" stroke="#5a4430" stroke-width="2"/>' +
      '<circle cx="50" cy="50" r="30" fill="none" stroke="#5a4430" stroke-width="1.5" stroke-dasharray="3 3"/><text x="50" y="60" text-anchor="middle" font-size="30">' + se.icon + '</text></svg>';
  }

  // ---------------- LOG SHEET (modal) ----------------
  function openLog(id) {
    var s = D.get(id);
    if (!s) return;
    var cur = now(), today = iso(new Date()), min = iso(cur.start);
    var se = season(cur.id), onCard = se.card.indexOf(id) >= 0;
    var already = (data.cards[cur.cardId] || { found: [] }).found.indexOf(id) >= 0;
    sheet = { id: id, place: null };
    var places = D.PLACES.map(function(p) {
      return '<button type="button" class="nat-place" data-act="place" data-place="' + p.id + '" aria-pressed="false"><span aria-hidden="true">' + p.icon + '</span><b>' + p.en + '</b><small>' + p.es + '</small></button>';
    }).join('');
    var ov = document.createElement('div');
    ov.className = 'nat-sheet-ov';
    ov.innerHTML = '<div class="nat-sheet" role="dialog" aria-modal="true" aria-labelledby="natSheetT">' +
      '<button type="button" class="nat-x" data-act="close" aria-label="Close">×</button>' +
      '<div class="nat-sheet-head"><div class="nat-sheet-plate">' + plate(id) + '</div><div><p class="nat-pencil">Field note</p><h2 id="natSheetT">' + s.es + '</h2><small>' + s.en + '</small></div></div>' +
      (already ? '<p class="nat-sheet-note">Already on your ' + se.en.toLowerCase() + ' card — this adds another sighting to your notebook.</p>' :
        onCard ? '' : '<p class="nat-sheet-note">Not on this season’s card, but it goes into your notebook.</p>') +
      '<p class="nat-sheet-q">Where did you see it?</p><div class="nat-places">' + places + '</div>' +
      '<div class="nat-when"><label for="natDate">When?</label><input id="natDate" type="date" value="' + today + '" min="' + min + '" max="' + today + '">' +
      '<span class="nat-when-quick"><button type="button" class="nat-chip on" data-act="day" data-off="0">Today</button><button type="button" class="nat-chip" data-act="day" data-off="1">Yesterday</button></span></div>' +
      '<button type="button" class="nat-btn nat-btn-big" data-act="save" disabled>Pick a place first</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', onClick);
    ov.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLog(); });
    requestAnimationFrame(function() { ov.classList.add('on'); var b = ov.querySelector('.nat-place'); if (b) b.focus(); });
    sheet.el = ov;
    sheet.lastFocus = document.activeElement;
  }
  function closeLog() {
    if (!sheet) return;
    var ov = sheet.el;
    ov.classList.remove('on');
    setTimeout(function() { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
    sheet = null;
  }
  function pickPlace(pid) {
    if (!sheet) return;
    sheet.place = pid;
    var bs = sheet.el.querySelectorAll('.nat-place');
    for (var i = 0; i < bs.length; i++) { var on = bs[i].getAttribute('data-place') === pid; bs[i].classList.toggle('on', on); bs[i].setAttribute('aria-pressed', on ? 'true' : 'false'); }
    var sv = sheet.el.querySelector('[data-act="save"]');
    sv.disabled = false; sv.textContent = '✓ Add to my notebook';
    sfx('click');
  }
  function pickDay(off) {
    if (!sheet) return;
    var d = new Date(); d.setDate(d.getDate() - off);
    var inp = sheet.el.querySelector('#natDate');
    var v = iso(d);
    if (v < inp.min) v = inp.min;
    inp.value = v;
    var cs = sheet.el.querySelectorAll('.nat-chip');
    for (var i = 0; i < cs.length; i++) cs[i].classList.toggle('on', +cs[i].getAttribute('data-off') === off);
  }
  function saveLog() {
    if (!sheet || !sheet.place) return;
    var id = sheet.id, pid = sheet.place, inp = sheet.el.querySelector('#natDate');
    var cur = now(), d = inp && parseIso(inp.value) ? inp.value : iso(new Date());
    if (d > iso(new Date())) d = iso(new Date());
    if (d < iso(cur.start)) d = iso(cur.start);
    var se = season(cur.id);
    data.sightings.push({ s: id, d: d, p: pid, c: cur.cardId });
    var card = data.cards[cur.cardId] || (data.cards[cur.cardId] = { found: [] });
    var newOnCard = se.card.indexOf(id) >= 0 && card.found.indexOf(id) < 0;
    var before = card.found.length;
    if (newOnCard) card.found.push(id);
    var after = card.found.length, full = false;
    if (after >= 9 && !card.done) { card.done = d; full = true; }
    _save();
    closeLog();
    var s = D.get(id);
    sfx('correct');
    logAct('🔭', 'Spotted ' + s.es + ' (' + s.en + ') — ' + (place(pid) || D.PLACES[0]).en.toLowerCase());
    var crossed = newOnCard && ((before < 3 && after >= 3) || (before < 6 && after >= 6));
    if (full) {
      logAct('🏅', 'Completed the ' + cardLabel(cur.cardId) + ' Spot it! card — 3 stars');
      celebrate('Full card!', 'You found all 9 on your ' + se.en.toLowerCase() + ' card. ' + se.en + ' Naturalist · Naturalista de ' + se.es + '!', 3);
    } else if (crossed) {
      celebrate('New star!', after + ' of 9 found on your ' + se.en.toLowerCase() + ' card.', after >= 6 ? 2 : 1);
    } else {
      toast('✓ ' + s.es + ' added to your notebook');
    }
    route();
  }

  function celebrate(title, msg, n) {
    sfx(n >= 3 ? 'cheer' : 'star');
    var ov = document.createElement('div');
    ov.className = 'nat-cele';
    var conf = '';
    for (var i = 0; i < 26; i++) {
      var leaf = ['#6a9a3a', '#c8902e', '#a8322a', '#e0b040', '#4a7a9a'][i % 5];
      conf += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;background:' + leaf + ';transform:rotate(' + Math.round(Math.random() * 360) + 'deg)"></i>';
    }
    ov.innerHTML = '<div class="nat-cele-conf" aria-hidden="true">' + conf + '</div><div class="nat-cele-card" role="alertdialog" aria-labelledby="natCeleT"><h2 id="natCeleT">' + esc(title) + '</h2>' + stars(n) + '<p>' + esc(msg) + '</p><button type="button" class="nat-btn nat-btn-big">Great!</button></div>';
    document.body.appendChild(ov);
    var close = function() { ov.classList.remove('on'); setTimeout(function() { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 250); };
    ov.querySelector('button').addEventListener('click', close);
    requestAnimationFrame(function() { ov.classList.add('on'); ov.querySelector('button').focus(); });
  }

  // ---------------- NOTEBOOK ----------------
  function viewNotebook() {
    var sights = data.sightings.map(function(x, i) { return { x: x, i: i }; }).sort(function(a, b) { return a.x.d < b.x.d ? 1 : a.x.d > b.x.d ? -1 : b.i - a.i; });
    var life = {};
    data.sightings.forEach(function(x) { life[x.s] = (life[x.s] || 0) + 1; });
    var nLife = Object.keys(life).length;
    var html = header('Field Notebook', 'Libreta de campo', 'home');
    html += '<section class="nat-nb-stats"><div><b>' + nLife + '<small>/31</small></b><span>species spotted</span></div><div><b>' + data.sightings.length + '</b><span>sightings</span></div><div><b>' + starsFor(data) + '</b><span>stars</span></div></section>';
    // badges
    var badges = earnedBadges();
    html += '<h2 class="nat-h2 nat-pencil">Badges · Insignias</h2><div class="nat-badges">' + badges.map(function(b) {
      return '<div class="nat-badge' + (b.got ? ' got' : '') + '"><span class="nat-badge-ico" aria-hidden="true">' + b.icon + '</span><b>' + b.name + '</b><small>' + b.how + '</small></div>';
    }).join('') + '</div>';
    // life list
    html += '<h2 class="nat-h2 nat-pencil">Life list · Lista de especies</h2><div class="nat-life">' + D.SPECIES.map(function(s) {
      return '<a href="#sp/' + s.id + '" class="nat-life-it' + (life[s.id] ? ' got' : '') + '" aria-label="' + esc(s.en + (life[s.id] ? ' — spotted' : ' — not yet')) + '">' + plate(s.id, { sil: !life[s.id] }) + '</a>';
    }).join('') + '</div>';
    // entries
    html += '<h2 class="nat-h2 nat-pencil">Sightings · Avistamientos</h2>';
    if (!sights.length) {
      html += '<div class="nat-empty"><p>No sightings yet. Open <a href="#spot">Spot it!</a>, go outside and tick your first find.</p></div>';
    } else {
      html += '<ol class="nat-entries">' + sights.map(function(o) {
        var s = D.get(o.x.s), p = place(o.x.p) || D.PLACES[0];
        if (!s) return '';
        return '<li class="nat-entry"><a href="#sp/' + s.id + '" class="nat-entry-plate" aria-label="' + esc(s.en) + '">' + plate(s.id) + '</a>' +
          '<div class="nat-entry-txt"><b class="nat-pencil">' + s.es + '</b><span>' + s.en + '</span><small>' + nice(o.x.d) + ' · ' + p.icon + ' ' + p.en + ' · ' + cardLabel(o.x.c || '') + '</small></div>' +
          '<button type="button" class="nat-del" data-act="del" data-ix="' + o.i + '" aria-label="Remove this sighting of ' + esc(s.en) + '">✕</button></li>';
      }).join('') + '</ol>';
    }
    setView(html, 'is-notebook');
  }
  function earnedBadges() {
    var out = [], c;
    D.SEASONS.forEach(function(se) {
      var got = false, when = '';
      for (c in data.cards) if (c.split('-')[1] === se.id && (data.cards[c].found || []).length >= 9) { got = true; when = cardLabel(c); }
      out.push({ icon: se.icon, name: se.en + ' Naturalist', how: got ? 'Full card · ' + when : 'Find all 9 on the ' + se.en.toLowerCase() + ' card', got: got });
    });
    var gb = { birds: ['🐦', 'Bird Spotter'], plants: ['🌿', 'Young Botanist'], mammals: ['🐾', 'Mammal Tracker'], bugs: ['🐞', 'Bug Expert'] };
    for (var g in gb) {
      var best = 0;
      for (c in data.quiz) if (c.split('_')[1] === g) best = Math.max(best, data.quiz[c] || 0);
      out.push({ icon: gb[g][0], name: gb[g][1], how: best >= 3 ? 'Got 3★ in a ' + group(g).en.toLowerCase() + ' quiz' : '3★ in any ' + group(g).en.toLowerCase() + ' quiz', got: best >= 3 });
    }
    var shadows = 0;
    for (c in data.quiz) if (c.split('_')[0] === 'shadow' && data.quiz[c] >= 3) shadows++;
    out.push({ icon: '👁️', name: 'Sharp Eyes', how: '3★ in a silhouette round', got: shadows > 0 });
    var life = {};
    data.sightings.forEach(function(x) { life[x.s] = 1; });
    out.push({ icon: '🧭', name: 'Explorer 20', how: 'Spot 20 different species', got: Object.keys(life).length >= 20 });
    return out;
  }
  function delSighting(ix) {
    var x = data.sightings[ix];
    if (!x) return;
    var s = D.get(x.s);
    var go = function(ok) {
      if (!ok) return;
      data.sightings.splice(ix, 1);
      var card = data.cards[x.c];
      if (card) {
        var still = data.sightings.some(function(y) { return y.c === x.c && y.s === x.s; });
        if (!still) {
          card.found = card.found.filter(function(f) { return f !== x.s; });
          if (card.found.length < 9) delete card.done;
          if (!card.found.length) delete data.cards[x.c];
        }
      }
      _save();
      route();
    };
    if (typeof ZsDialog !== 'undefined' && ZsDialog.confirm) {
      ZsDialog.confirm({ title: 'Remove this sighting?', message: (s ? s.es + ' · ' : '') + nice(x.d), confirmLabel: 'Remove', cancelLabel: 'Keep', danger: true }).then(go);
    }
  }

  // ---------------- QUIZ: WHO AM I? ----------------
  var MODES = [
    { id: 'tap', icon: '👆', en: 'Find it!', es: '¡Encuéntralo!', desc: 'Hear a name and tap the right picture.', best: 'beginner' },
    { id: 'shadow', icon: '🌑', en: 'Silhouettes', es: 'Siluetas', desc: 'Name the species from its shadow shape.', best: 'intermediate' },
    { id: 'clues', icon: '🔍', en: 'Who am I?', es: '¿Quién soy?', desc: 'Clues appear one by one. Fewer clues = more points.', best: 'advanced' }
  ];
  var LOOKALIKE = ['chincol', 'zorzal', 'jilguero', 'loica'];
  function recMode() { return tier === 'beginner' ? 'tap' : tier === 'intermediate' ? 'shadow' : 'clues'; }
  function viewQuizMenu() {
    var sel = (quiz && quiz.pick) || { mode: recMode(), group: 'all' };
    quiz = { pick: sel };
    var modes = MODES.map(function(m) {
      var best = 0;
      for (var c in data.quiz) if (c.split('_')[0] === m.id) best = Math.max(best, data.quiz[c] || 0);
      return '<button type="button" class="nat-mode' + (sel.mode === m.id ? ' on' : '') + '" data-act="qmode" data-mode="' + m.id + '" aria-pressed="' + (sel.mode === m.id) + '">' +
        '<span class="nat-mode-ico" aria-hidden="true">' + m.icon + '</span><b>' + m.en + '</b><span class="nat-pencil">' + m.es + '</span><small>' + m.desc + '</small>' +
        (m.id === recMode() ? '<em class="nat-rec">Best for you</em>' : '') + '</button>';
    }).join('');
    var groups = [{ id: 'all', icon: '🌎', en: 'Everything' }].concat(D.GROUPS).map(function(g) {
      var b = data.quiz[sel.mode + '_' + g.id] || 0;
      return '<button type="button" class="nat-chip' + (sel.group === g.id ? ' on' : '') + '" data-act="qgroup" data-group="' + g.id + '" aria-pressed="' + (sel.group === g.id) + '">' +
        '<span aria-hidden="true">' + g.icon + '</span> ' + g.en + ' <span class="nat-chip-st">' + (b ? '★' + b : '') + '</span></button>';
    }).join('');
    var html = header('Who am I?', '¿Quién soy? · nature quiz', 'home') +
      '<h2 class="nat-h2 nat-pencil">1 · Choose a game</h2><div class="nat-modes">' + modes + '</div>' +
      '<h2 class="nat-h2 nat-pencil">2 · Choose a group</h2><div class="nat-chips">' + groups + '</div>' +
      '<div class="nat-qstart"><button type="button" class="nat-btn nat-btn-big" data-act="qstart">Start ›</button><p>Best so far: ' + stars(data.quiz[sel.mode + '_' + sel.group] || 0) + '</p></div>';
    setView(html, 'is-quiz');
  }
  function startQuiz() {
    var sel = quiz.pick, pool = D.SPECIES.filter(function(s) { return sel.group === 'all' || s.group === sel.group; });
    var nQ = sel.mode === 'clues' ? 5 : tier === 'beginner' ? 5 : 6;
    var nC = sel.mode === 'tap' ? (tier === 'beginner' ? 3 : 4) : (tier === 'expert' ? 5 : tier === 'beginner' ? 3 : 4);
    var answers = shuffle(pool).slice(0, Math.min(nQ, pool.length));
    var qs = answers.map(function(a) {
      // in the silhouette game, never offer two of the look-alike perched songbirds together
      var ok = function(s) { return s.id !== a.id && !(sel.mode === 'shadow' && LOOKALIKE.indexOf(a.id) >= 0 && LOOKALIKE.indexOf(s.id) >= 0); };
      var same = shuffle(pool.filter(ok));
      var other = shuffle(D.SPECIES.filter(function(s) { return ok(s) && pool.indexOf(s) < 0; }));
      var ch = same.concat(other).slice(0, nC - 1).concat([a]);
      return { a: a.id, ch: shuffle(ch.map(function(s) { return s.id; })), clue: 1, tries: 0, done: false, pts: 0, wrong: [] };
    });
    quiz = { pick: sel, mode: sel.mode, group: sel.group, qs: qs, i: 0, score: 0, per: sel.mode === 'clues' ? 3 : 1 };
    location.hash = 'quiz/play';
  }
  function clueList(s) {
    var names = [s.es, s.en].concat(s.es.split(/[ ·]+/)).concat(s.en.split(/\s+/)).filter(function(w) { return w && w.length > 3 && !/^(chilean|southern|andean|tree|green|black|long|mountain|south|austral)$/i.test(w); });
    var mask = function(t) {
      names.forEach(function(w) { t = t.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-záéíóúñ]*', 'gi'), '▢▢▢'); });
      return t;
    };
    var isPlant = s.group === 'plants';
    return [
      { ico: '📍', t: mask(s.where) },
      { ico: isPlant ? '🌱' : '🍽️', t: mask(s.food) },
      { ico: '🔎', t: mask(s.look) }
    ];
  }
  function viewQuizPlay() {
    if (!quiz || !quiz.qs) { viewQuizMenu(); return; }
    var q = quiz.qs[quiz.i], a = D.get(q.a), m = quiz.mode;
    var dots = quiz.qs.map(function(x, j) { return '<span class="' + (j < quiz.i ? (x.pts ? 'ok' : 'no') : j === quiz.i ? 'cur' : '') + '"></span>'; }).join('');
    var body = '';
    if (m === 'tap') {
      body = '<div class="nat-qprompt"><p class="nat-pencil">Find the…</p><h2>' + a.es + '</h2><p>' + a.en + '</p>' +
        (ttsOn() ? '<button type="button" class="nat-btn nat-btn-soft" data-act="say">🔊 Hear it again</button>' : '') + '</div>' +
        '<div class="nat-qpics n' + q.ch.length + '">' + q.ch.map(function(id) {
          var st = q.done && id === q.a ? ' right' : q.wrong.indexOf(id) >= 0 ? ' wrong' : '';
          return '<button type="button" class="nat-qpic' + st + '" data-act="ans" data-id="' + id + '"' + (q.done || q.wrong.indexOf(id) >= 0 ? ' disabled' : '') + ' aria-label="Picture ' + (q.ch.indexOf(id) + 1) + (q.done ? ': ' + esc(D.get(id).en) : '') + '">' + plate(id) + '</button>';
        }).join('') + '</div>';
    } else {
      var top = m === 'shadow' ?
        '<div class="nat-qshadow">' + (q.done ? plate(q.a) : plate(q.a, { sil: true })) + '</div><p class="nat-qask nat-pencil">' + (q.done ? (q.pts ? 'Yes! ' : 'It was… ') + a.es + ' · ' + a.en : 'Whose shadow is this?') + '</p>' :
        '<div class="nat-qclues">' + (q.done ? '<div class="nat-qreveal">' + plate(q.a) + '</div>' : '') + clueList(a).slice(0, q.done ? 3 : q.clue).map(function(c, j) {
          return '<div class="nat-clue"><span class="nat-clue-n">Clue ' + (j + 1) + '</span><span aria-hidden="true">' + c.ico + '</span><p>' + c.t + '</p></div>';
        }).join('') +
        (!q.done && q.clue < 3 ? '<button type="button" class="nat-btn nat-btn-soft" data-act="clue">+ Show another clue (−1 point)</button>' : '') +
        (q.done ? '<p class="nat-qask nat-pencil">' + (q.pts ? 'Yes! +' + q.pts + ' — ' : 'It was… ') + a.es + ' · ' + a.en + '</p>' : '<p class="nat-qask nat-pencil">Who am I? Worth ' + (4 - q.clue) + ' point' + (4 - q.clue > 1 ? 's' : '') + ' now.</p>') + '</div>';
      body = top + '<div class="nat-qnames">' + q.ch.map(function(id) {
        var s = D.get(id), st = q.done && id === q.a ? ' right' : q.wrong.indexOf(id) >= 0 ? ' wrong' : '';
        return '<button type="button" class="nat-qname' + st + '" data-act="ans" data-id="' + id + '"' + (q.done || q.wrong.indexOf(id) >= 0 ? ' disabled' : '') + '><b>' + s.es + '</b><small>' + s.en + '</small></button>';
      }).join('') + '</div>';
    }
    var foot = q.done ? '<div class="nat-qnext"><button type="button" class="nat-btn nat-btn-big" data-act="qnext">' + (quiz.i + 1 < quiz.qs.length ? 'Next ›' : 'See my stars ›') + '</button></div>' : '';
    var mm = MODES.filter(function(x) { return x.id === m; })[0];
    setView(header(mm.en, mm.es + ' · question ' + (quiz.i + 1) + ' of ' + quiz.qs.length, 'quiz') +
      '<div class="nat-qbar"><div class="nat-qdots">' + dots + '</div><b>' + quiz.score + ' pts</b></div>' + body + foot, 'is-quizplay q-' + m);
    if (m === 'tap' && !q.done && !q.spoken) { q.spoken = true; sayTarget(); }
  }
  function sayTarget() {
    var a = D.get(quiz.qs[quiz.i].a);
    speak([{ text: 'Find the ' + a.en + '!', lang: 'en-US' }, { text: a.es, lang: 'es-CL' }]);
  }
  function answer(id) {
    var q = quiz.qs[quiz.i];
    if (q.done) return;
    if (id === q.a) {
      q.done = true;
      q.pts = quiz.mode === 'clues' ? Math.max(0, Math.min(3, 4 - q.clue - (q.pen || 0))) : (q.tries ? 0 : 1);
      quiz.score += q.pts;
      sfx(q.pts ? 'correct' : 'click');
      if (quiz.mode === 'tap') { var a = D.get(q.a); speak([{ text: (q.pts ? 'Yes! ' : '') + a.en, lang: 'en-US' }]); }
    } else {
      q.tries++;
      q.wrong.push(id);
      sfx('wrong');
      if (quiz.mode === 'clues') { if (q.clue < 3) q.clue++; else q.pen = (q.pen || 0) + 1; }
      var left = q.ch.length - q.wrong.length;
      if (left <= 1 || (quiz.mode === 'clues' && q.tries >= 3)) { q.done = true; q.pts = 0; }
    }
    viewQuizPlay();
  }
  function nextQ() {
    if (quiz.i + 1 < quiz.qs.length) { quiz.i++; viewQuizPlay(); return; }
    var max = quiz.qs.length * quiz.per, ratio = quiz.score / max;
    var st = ratio >= 0.9 ? 3 : ratio >= 0.66 ? 2 : ratio >= 0.4 ? 1 : 0;
    var key = quiz.mode + '_' + quiz.group, prev = data.quiz[key] || 0;
    if (st > prev) { data.quiz[key] = st; _save(); }
    var mm = MODES.filter(function(x) { return x.id === quiz.mode; })[0];
    var g = quiz.group === 'all' ? 'Everything' : group(quiz.group).en;
    logAct('🦅', mm.en + ' quiz (' + g + ') — ' + quiz.score + '/' + max + ' points, ' + st + ' star' + (st === 1 ? '' : 's'));
    var html = header(mm.en, mm.es + ' · ' + g, 'quiz') +
      '<div class="nat-qend"><div class="nat-qend-plate">' + plate(quiz.qs[0].a) + '</div><h2>' + (st === 3 ? '¡Excelente!' : st === 2 ? 'Great work!' : st === 1 ? 'Good try!' : 'Keep exploring!') + '</h2>' +
      stars(st) + '<p>' + quiz.score + ' of ' + max + ' points' + (st > prev ? ' · new best!' : prev ? ' · best so far ' + prev + '★' : '') + '</p>' +
      '<div class="nat-qend-btns"><button type="button" class="nat-btn nat-btn-big" data-act="qagain">Play again</button><a class="nat-btn nat-btn-soft" href="#quiz">Choose another game</a></div></div>';
    setView(html, 'is-quiz');
    if (st > 0) celebrateLite(st);
    else sfx('click');
  }
  function celebrateLite(st) { sfx(st >= 3 ? 'cheer' : 'star'); }

  // ---------------- router + events ----------------
  function route() {
    var h = (location.hash || '#home').slice(1).split('/');
    if (typeof ZsTTS !== 'undefined' && ZsTTS.stop) ZsTTS.stop();
    switch (h[0]) {
      case 'guide': viewGuide(h[1]); break;
      case 'sp': viewSpecies(h[1]); break;
      case 'spot': viewSpot(h[1]); break;
      case 'notebook': viewNotebook(); break;
      case 'quiz': if (h[1] === 'play') viewQuizPlay(); else viewQuizMenu(); break;
      default: viewHome();
    }
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || b.disabled) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    switch (act) {
      case 'log': openLog(id); break;
      case 'peek': location.hash = 'sp/' + id; break;
      case 'read': readSpecies(id); break;
      case 'close': closeLog(); break;
      case 'place': pickPlace(b.getAttribute('data-place')); break;
      case 'day': pickDay(+b.getAttribute('data-off')); break;
      case 'save': saveLog(); break;
      case 'del': delSighting(+b.getAttribute('data-ix')); break;
      case 'qmode': quiz.pick.mode = b.getAttribute('data-mode'); sfx('click'); viewQuizMenu(); break;
      case 'qgroup': quiz.pick.group = b.getAttribute('data-group'); sfx('click'); viewQuizMenu(); break;
      case 'qstart': sfx('click'); startQuiz(); break;
      case 'qagain': startQuiz(); break;
      case 'ans': answer(id); break;
      case 'clue': if (quiz.qs[quiz.i].clue < 3) { quiz.qs[quiz.i].clue++; sfx('click'); viewQuizPlay(); } break;
      case 'qnext': nextQ(); break;
      case 'say': sayTarget(); break;
    }
  }

  function init() {
    root = document.getElementById('nat-wrap');
    if (!root) return;
    var u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    userName = u ? u.name : '';
    tier = typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate';
    if (typeof CloudSync !== 'undefined' && CloudSync.online && _key()) { try { CloudSync.pull(_key()); } catch (e) {} }
    data = _load();
    root.addEventListener('click', onClick);
    window.addEventListener('hashchange', route);
    window.addEventListener('storage', function(ev) { if (ev.key === _key()) { data = _load(); route(); } });
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { starsFor: starsFor, seasonFor: seasonFor, route: route };
})();
