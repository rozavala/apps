/* ================================================================
   TRIVIA FAMILIAR 🎲 — family game night (js/trivia.js)

   Pass-the-iPad trivia for the whole family. Each player gets questions
   for their own age (js/trivia-engine.js), so the 4-year-old and the
   grown-ups can play together:
     setup → (pass the iPad → question → did you know?) × rounds
           → the steal round → the final "everyone plays" round → podium

   Per-kid progress at zs_trivia_<kid> (one JSON blob, fields only added):
     { v:1, games, wins, right, asked, best, hist:{ qid: n }, last:'YYYY-MM-DD' }
   Every kid who plays a full game gets it saved, not only the one signed
   in. The grown-ups' question history and the last setup stay on this
   device at zs_triviafam (not synced; it is not a kid's progress).
   ================================================================ */

var Trivia = (function () {
  'use strict';

  var E = TriviaEngine, A = TriviaArt;
  var PREFIX = 'zs_trivia_', FAM_KEY = 'zs_triviafam';

  // ── Helpers ──────────────────────────────────────────────────────
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel, r) { return (r || document).querySelector(sel); }
  function $all(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function root() { return document.getElementById('tv-wrap'); }
  function sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }

  var setup = null, game = null, bank = [], screen = 'setup', seed = 0, timer = null, stealer = null;

  // Language of the game: 'es', 'en' or 'both' (Spanish, English under it).
  function lang() { return setup && setup.lang || 'both'; }
  function T(es, en) {
    var l = lang();
    if (es === en) return esc(es);
    return l === 'es' ? esc(es) : l === 'en' ? esc(en) : esc(es) + '<span class="tv-en">' + esc(en) + '</span>';
  }
  function TO(o) { return T(o.es, o.en); }
  function t1(es, en) { return lang() === 'en' ? en : es; }      // one language, for labels
  function short(es, en) { return lang() === 'en' ? en : es; }

  // ── Storage ──────────────────────────────────────────────────────
  function kidKey(name) { return PREFIX + String(name).toLowerCase().replace(/\s+/g, '_'); }
  function loadKid(name) {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(kidKey(name))) || {}; } catch (e) { d = {}; }
    d = obj(d);
    d.v = 1;
    ['games', 'wins', 'right', 'asked', 'best'].forEach(function (k) { d[k] = d[k] | 0; });
    d.hist = obj(d.hist);
    d.g = obj(d.g);   // finished games by id: [right, asked, won (1/0), score]
    return d;
  }
  function saveKid(name, d) {
    var key = kidKey(name);
    d.last = today();
    try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.push) { try { CloudSync.push(key); } catch (e) {} }
  }
  function loadFam() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(FAM_KEY)) || {}; } catch (e) { d = {}; }
    d = obj(d); d.hist = obj(d.hist); d.setup = obj(d.setup);
    return d;
  }
  function saveFam(d) { try { localStorage.setItem(FAM_KEY, JSON.stringify(d)); } catch (e) {} }

  // ── Players ──────────────────────────────────────────────────────
  var GROWNUPS = [
    { id: 'mama', name: 'Mamá', avatar: 'mama', kid: false },
    { id: 'papa', name: 'Papá', avatar: 'papa', kid: false }
  ];
  function roster() {
    var list = [], seen = {};
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    var me = typeof getActiveUser === 'function' ? getActiveUser() : null;
    (profiles || []).concat(me ? [me] : []).forEach(function (p) {
      if (!p || !p.name || seen[p.name]) return;
      seen[p.name] = 1;
      list.push({ id: 'k:' + p.name, name: p.name, age: Number(p.age) || 0, avatar: p.avatar || '🙂', color: typeof safeColor === 'function' ? safeColor(p.color) : '', kid: true });
    });
    list.sort(function (a, b) { return (a.age || 99) - (b.age || 99); });
    return list.concat(GROWNUPS.map(function (g) { return { id: g.id, name: g.name, age: 0, avatar: g.avatar, kid: false }; }));
  }
  function avatarHtml(p, big) {
    if (p.avatar === 'mama' || p.avatar === 'papa') {
      return '<span class="tv-av tv-av-grown' + (big ? ' tv-av-big' : '') + '" aria-hidden="true">' + grownFace(p.avatar) + '</span>';
    }
    return '<span class="tv-av' + (big ? ' tv-av-big' : '') + '" aria-hidden="true">' + esc(p.avatar || '🙂') + '</span>';
  }
  function grownFace(which) {
    var hair = which === 'mama'
      ? '<path d="M12 30c-2-14 6-22 18-22s20 8 18 22c2 10-2 18-4 22h-6V30c-6 0-14-4-16-10-2 6-6 10-6 10v22h-6c-2-4-6-12-4-22z" fill="#5B3A1A"/>'
      : '<path d="M14 24c0-12 8-16 16-16s16 4 16 16c-6-4-10-6-16-6s-10 2-16 6z" fill="#3B2A1A"/>';
    return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="29" fill="' + (which === 'mama' ? '#FCE7F3' : '#DBEAFE') + '"/>' +
      '<path d="M10 60c2-12 10-16 20-16s18 4 20 16z" fill="' + (which === 'mama' ? '#DB2777' : '#2563EB') + '"/>' +
      '<circle cx="30" cy="30" r="14" fill="#F2C9A0"/>' + hair +
      '<circle cx="25" cy="30" r="1.8" fill="#1C1917"/><circle cx="35" cy="30" r="1.8" fill="#1C1917"/><path d="M25 36q5 4 10 0" stroke="#9A3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      (which === 'papa' ? '<path d="M22 40q8 6 16 0" stroke="#3B2A1A" stroke-width="1.4" fill="none" opacity=".5"/>' : '') + '</svg>';
  }
  function tierLabel(tier) {
    return [null, ['4 a 5 años · sin reloj', 'ages 4–5 · no timer'], ['6 a 8 años', 'ages 6–8'], ['9 a 11 años', 'ages 9–11'], ['12 años y más', '12 and up']][tier];
  }
  function sideName(s) {
    if (s.team) return t1('Equipo ', 'Team ') + s.team;
    return game.byId[s.members[0]].name;
  }
  function sideMembers(s) { return s.members.map(function (id) { return game.byId[id]; }); }
  function sideAvatars(s, big) { return sideMembers(s).map(function (p) { return avatarHtml(p, big); }).join(''); }

  // ── Read aloud (shared helper, js/tts.js) ───────────────────────
  function speechOn() { return typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled !== false; }
  function say(es, en) {
    if (!speechOn()) return false;
    var l = lang();
    try {
      if (l === 'en') ZsTTS.speak(en, { lang: 'en-US' });
      else if (l === 'es') ZsTTS.speak(es, { lang: 'es-CL' });
      else ZsTTS.speak(es, { lang: 'es-CL', onEnd: function () { if (screen === 'question' || screen === 'final' || screen === 'reveal') ZsTTS.speak(en, { lang: 'en-US' }); } });
    } catch (e) { return false; }
    return true;
  }
  function stopSpeech() { if (typeof ZsTTS !== 'undefined') { try { ZsTTS.stop(); } catch (e) {} } }
  function optionText(c) {
    if (c.art) { var l = A.label(c.art); return [l.es, l.en]; }
    return [c.es, c.en];
  }
  function questionSpeech(q, choices, withOpts) {
    var es = q.q.es, en = q.q.en;
    if (withOpts && q.type !== 'tf' && q.type !== 'snd') {
      var letters = A.LETTERS;
      es += ' ' + choices.map(function (c, i) { return (q.type === 'map' ? letters[i] + ': ' : '') + optionText(c)[0]; }).join('. ') + '.';
      en += ' ' + choices.map(function (c, i) { return (q.type === 'map' ? letters[i] + ': ' : '') + optionText(c)[1]; }).join('. ') + '.';
    }
    return [es, en];
  }

  // ── Name that tune: Little Maestro's melodies on a soft synth ───
  var actx = null, tuneNodes = [];
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }
  var DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
  var STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function melody(song, maxBeats) {
    var rh = song && song.score && song.score.rh || '', out = [], beats = 0;
    rh.split('|').forEach(function (bar) {
      bar.trim().split(/\s+/).forEach(function (tok) {
        if (!tok || beats >= maxBeats) return;
        var m = /^(R|([A-G])([#b]?)(\d))(?:\+[A-G][#b]?\d)*([whqes])(\.?)(~?)/.exec(tok.replace(/^'+/, ''));
        if (!m) return;
        var b = DUR[m[5]] * (m[6] ? 1.5 : 1), midi = null;
        if (m[1] !== 'R') midi = 12 * (+m[4] + 1) + STEP[m[2]] + (m[3] === '#' ? 1 : m[3] === 'b' ? -1 : 0);
        var last = out[out.length - 1];
        if (last && last.tie && midi === last.midi) { last.beats += b; last.tie = !!m[7]; }
        else out.push({ midi: midi, beats: b, tie: !!m[7] });
        beats += b;
      });
    });
    return out;
  }
  function stopTune() {
    tuneNodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
    tuneNodes = [];
  }
  function playTune(title) {
    var S = typeof LM_SONGS !== 'undefined' ? LM_SONGS : null, song = S && TriviaGen.findSong(S, title);
    var ctx = audio();
    if (!song || !ctx) return 0;
    stopTune();
    var bpm = (song.bpm && song.bpm.normal) || 90, spb = 60 / bpm, t = ctx.currentTime + 0.08;
    var notes = melody(song, 16), master = ctx.createGain();
    master.gain.value = 0.32; master.connect(ctx.destination);
    notes.forEach(function (n) {
      var d = n.beats * spb;
      if (n.midi != null) {
        var f = 440 * Math.pow(2, (n.midi - 69) / 12);
        [[1, 'triangle', 0.9], [2, 'sine', 0.25], [3, 'sine', 0.08]].forEach(function (h) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = h[1]; o.frequency.value = f * h[0];
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(h[2], t + 0.015);
          g.gain.exponentialRampToValueAtTime(h[2] * 0.35, t + Math.min(0.25, d * 0.6));
          g.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.98 + 0.05);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.1);
          tuneNodes.push(o);
        });
      }
      t += d;
    });
    return t - ctx.currentTime;
  }

  // ── Setup ────────────────────────────────────────────────────────
  function christmasSeason(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return (m === 11 && day >= 15) || m === 12 || (m === 1 && day <= 6);
  }
  function defaultSetup() {
    var fam = loadFam(), s = fam.setup || {};
    var choice = typeof getKidLangChoice === 'function' ? getKidLangChoice() : null;
    var me = typeof getActiveUser === 'function' ? getActiveUser() : null;
    return {
      players: Array.isArray(s.players) ? s.players.slice() : (me ? ['k:' + me.name] : []),
      teams: !!s.teams, team: obj(s.team),
      cats: Array.isArray(s.cats) && s.cats.length ? s.cats.slice() : E.CATS.map(function (c) { return c.id; }),
      rounds: [3, 5, 7, 10].indexOf(s.rounds) >= 0 ? s.rounds : 5,
      headStart: s.headStart !== false, timers: s.timers !== false,
      lang: ['es', 'en', 'both'].indexOf(s.lang) >= 0 ? s.lang : (choice === 'es' || choice === 'en' ? choice : 'both')
    };
  }
  function saveSetup() { var fam = loadFam(); fam.setup = setup; saveFam(fam); }

  function head(sub) {
    return '<header class="tv-head"><div class="tv-brand"><span class="tv-logo" aria-hidden="true">' + logo() + '</span>' +
      '<div><h1 class="tv-title">Trivia Familiar</h1>' + (sub ? '<p class="tv-tag">' + sub + '</p>' : '') + '</div></div></header>';
  }
  function logo() {
    return '<svg viewBox="0 0 60 60"><defs><linearGradient id="tvlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F472B6"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>' +
      '<rect x="6" y="6" width="48" height="48" rx="12" fill="url(#tvlg)" transform="rotate(-8 30 30)"/>' +
      '<g fill="#fff" transform="rotate(-8 30 30)"><circle cx="18" cy="18" r="4.4"/><circle cx="42" cy="18" r="4.4"/><circle cx="30" cy="30" r="4.4"/><circle cx="18" cy="42" r="4.4"/><circle cx="42" cy="42" r="4.4"/></g></svg>';
  }

  function viewSetup() {
    screen = 'setup'; stopTimer(); stopSpeech(); stopTune();
    var R = roster(), xmas = christmasSeason();
    var picked = setup.players.filter(function (id) { return R.some(function (p) { return p.id === id; }); });
    setup.players = picked;
    var html = head(T('La noche de juegos de la familia', 'Family game night')) +
      '<main id="tv-main" class="tv-setup">' +
      (xmas ? '<button type="button" class="tv-xmas" data-preset="xmas"><span class="tv-xmas-art" aria-hidden="true">' + A.draw('xmas-tree', { label: false }) + '</span>' +
        '<span><b>' + T('Especial de Navidad', 'Christmas special') + '</b><small>' + T('Villancicos, el pesebre y la Navidad en Chile y Estados Unidos', 'Carols, the Nativity and Christmas in Chile and the US') + '</small></span></button>' : '') +
      '<section class="tv-card"><h2 class="tv-h2">' + T('¿Quiénes juegan?', 'Who is playing?') + '</h2>' +
      '<div class="tv-players" role="group" aria-label="' + esc(t1('Jugadores', 'Players')) + '">' +
      R.map(function (p) {
        var on = picked.indexOf(p.id) >= 0, tier = E.tierOfAge(p.age), tl = tierLabel(tier);
        var team = setup.team[p.id] || '';
        return '<div class="tv-pl' + (on ? ' on' : '') + '">' +
          '<button type="button" class="tv-pl-b" data-pl="' + esc(p.id) + '" aria-pressed="' + on + '">' + avatarHtml(p) +
          '<span class="tv-pl-n">' + esc(p.name) + '</span><span class="tv-pl-t">' + esc(short(tl[0], tl[1])) + '</span>' +
          '<span class="tv-check" aria-hidden="true">✓</span></button>' +
          (setup.teams && on ? '<button type="button" class="tv-team tv-team-' + (team || 'x') + '" data-team="' + esc(p.id) + '" aria-label="' + esc(t1('Equipo de ', 'Team for ') + p.name) + '">' + (team ? esc(t1('Equipo ', 'Team ') + team) : esc(t1('Sin equipo', 'No team'))) + '</button>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<label class="tv-switch"><input type="checkbox" id="tv-teams"' + (setup.teams ? ' checked' : '') + '><span class="tv-sw" aria-hidden="true"></span><span>' + T('Jugar en equipos (los grandes ayudan a los chicos)', 'Play in teams (the older ones help the younger)') + '</span></label>' +
      '</section>' +
      '<section class="tv-card"><div class="tv-row-h"><h2 class="tv-h2">' + T('Temas', 'Subjects') + '</h2>' +
      '<button type="button" class="tv-link" data-preset="all">' + T('Todos', 'All') + '</button></div>' +
      '<div class="tv-cats" role="group" aria-label="' + esc(t1('Temas', 'Subjects')) + '">' +
      E.CATS.map(function (c) {
        var on = setup.cats.indexOf(c.id) >= 0;
        return '<button type="button" class="tv-cat' + (on ? ' on' : '') + '" data-cat="' + c.id + '" aria-pressed="' + on + '" style="--c:' + c.color + '">' +
          '<span class="tv-cat-i" aria-hidden="true">' + A.draw(c.icon, { label: false }) + '</span><span>' + esc(short(c.es, c.en)) + '</span></button>';
      }).join('') + '</div></section>' +
      '<section class="tv-card tv-set">' +
      '<div class="tv-set-o"><h2 class="tv-h3">' + T('Rondas', 'Rounds') + '</h2><div class="tv-seg" role="group" aria-label="' + esc(t1('Rondas', 'Rounds')) + '">' +
      [3, 5, 7, 10].map(function (n) { return '<button type="button" data-rounds="' + n + '" aria-pressed="' + (setup.rounds === n) + '" class="' + (setup.rounds === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>' +
      '<p class="tv-note">' + T('La penúltima es la ronda de robo y la última, la ronda final para todos.', 'The second-to-last is the steal round and the last is the final round for everyone.') + '</p></div>' +
      '<div class="tv-set-o"><h2 class="tv-h3">' + T('Idioma', 'Language') + '</h2><div class="tv-seg" role="group" aria-label="' + esc(t1('Idioma', 'Language')) + '">' +
      [['es', 'Español'], ['en', 'English'], ['both', 'Español + English']].map(function (l) { return '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (setup.lang === l[0]) + '" class="' + (setup.lang === l[0] ? 'on' : '') + '">' + l[1] + '</button>'; }).join('') + '</div></div>' +
      '<label class="tv-switch"><input type="checkbox" id="tv-head"' + (setup.headStart ? ' checked' : '') + '><span class="tv-sw" aria-hidden="true"></span><span>' + T('Ventaja por edad (los más chicos parten con puntos)', 'Age head start (the youngest start with points)') + '</span></label>' +
      '<label class="tv-switch"><input type="checkbox" id="tv-timers"' + (setup.timers ? ' checked' : '') + '><span class="tv-sw" aria-hidden="true"></span><span>' + T('Reloj suave para los mayores (nunca para los de 4 y 5)', 'Gentle timer for the older players (never for ages 4 and 5)') + '</span></label>' +
      '</section>' +
      '<div class="tv-go"><button type="button" class="tv-btn tv-btn-big" id="tv-start"' + (picked.length ? '' : ' disabled') + '>' + T('¡A jugar!', 'Let’s play!') + '</button>' +
      '<p class="tv-note" id="tv-start-note">' + (picked.length ? T(picked.length + ' jugando · ' + countPool() + ' preguntas', picked.length + ' playing · ' + countPool() + ' questions') : T('Elige quién juega.', 'Pick who is playing.')) + '</p></div>' +
      '</main>';
    root().innerHTML = html;
    bindSetup();
  }
  function countPool() { return bank.filter(function (q) { return setup.cats.indexOf(q.cat) >= 0 && playable(q); }).length; }
  function bindSetup() {
    $all('[data-pl]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-pl'), i = setup.players.indexOf(id);
        if (i >= 0) setup.players.splice(i, 1); else setup.players.push(id);
        sound('click'); saveSetup(); viewSetup();
      });
    });
    $all('[data-team]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-team'), cur = setup.team[id] || '';
        setup.team[id] = cur === '' ? 'A' : cur === 'A' ? 'B' : '';
        saveSetup(); viewSetup();
      });
    });
    $all('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-cat'), i = setup.cats.indexOf(id);
        if (i >= 0) { if (setup.cats.length > 1) setup.cats.splice(i, 1); } else setup.cats.push(id);
        saveSetup(); viewSetup();
      });
    });
    $all('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-preset');
        setup.cats = p === 'xmas' ? ['navidad', 'fe', 'biblia', 'musica'] : E.CATS.map(function (c) { return c.id; });
        saveSetup(); viewSetup();
      });
    });
    $all('[data-rounds]').forEach(function (b) { b.addEventListener('click', function () { setup.rounds = +b.getAttribute('data-rounds'); saveSetup(); viewSetup(); }); });
    $all('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { setup.lang = b.getAttribute('data-lang'); saveSetup(); viewSetup(); }); });
    var tm = $('#tv-teams'); if (tm) tm.addEventListener('change', function () {
      setup.teams = tm.checked;
      if (setup.teams) {
        // A first split: alternate youngest and oldest so each team has a
        // little one and a big one.
        var R = roster().filter(function (p) { return setup.players.indexOf(p.id) >= 0; });
        R.forEach(function (p, i) { if (!setup.team[p.id]) setup.team[p.id] = i % 2 ? 'B' : 'A'; });
      }
      saveSetup(); viewSetup();
    });
    var hs = $('#tv-head'); if (hs) hs.addEventListener('change', function () { setup.headStart = hs.checked; saveSetup(); });
    var ti = $('#tv-timers'); if (ti) ti.addEventListener('change', function () { setup.timers = ti.checked; saveSetup(); });
    var st = $('#tv-start'); if (st) st.addEventListener('click', start);
  }

  // A question the device can play: the tune and map data are loaded.
  function playable(q) {
    if (q.type === 'snd') return typeof LM_SONGS !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
    if (q.type === 'map') return q.map === 'chile' ? typeof DC_GEO !== 'undefined' : typeof WorldMap !== 'undefined';
    if (q.art) return A.has(q.art);
    return true;
  }

  // ── The game ─────────────────────────────────────────────────────
  function start() {
    var R = roster(), players = R.filter(function (p) { return setup.players.indexOf(p.id) >= 0; });
    if (!players.length) return;
    var fam = loadFam(), hist = {};
    players.forEach(function (p) {
      p.team = setup.teams ? (setup.team[p.id] || '') : '';
      hist[p.id] = p.kid ? loadKid(p.name).hist : obj(fam.hist[p.id]);
    });
    // Before the game, fetch the other kids' records from the family
    // server, so this device starts from their real history and the save
    // at the end merges onto the latest copy.
    if (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pull) {
      players.forEach(function (p) { if (p.kid) { try { CloudSync.pull(kidKey(p.name)); } catch (e) {} } });
    }
    game = E.createGame(bank, players, {
      cats: setup.cats, rounds: setup.rounds, teams: setup.teams, headStart: setup.headStart, timers: setup.timers,
      seed: seed || Date.now(), hist: hist, canPlay: playable
    });
    game.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    sound('click');
    viewPass();
  }

  function scoreStrip() {
    return '<div class="tv-strip" aria-label="' + esc(t1('Puntajes', 'Scores')) + '">' + game.sides.map(function (s, i) {
      return '<span class="tv-chip' + (game.current && game.current.side === s ? ' now' : '') + '">' + sideAvatars(s) + '<b>' + esc(sideName(s)) + '</b><i>' + s.score + '</i></span>';
    }).join('') + '</div>';
  }
  function roundBadge() {
    var k = E.roundKind(game);
    var name = k === 'steal' ? T('¡Ronda de robo!', 'Steal round!') : k === 'final' ? T('Ronda final', 'Final round') : T('Ronda ' + game.round + ' de ' + game.rounds, 'Round ' + game.round + ' of ' + game.rounds);
    return '<span class="tv-round tv-round-' + k + '">' + name + '</span>';
  }

  // Pass the iPad to whoever is next.
  function viewPass() {
    stopTimer(); stopSpeech(); stopTune();
    if (game.done) return viewEnd();
    if (E.roundKind(game) === 'final') return viewFinalIntro();
    screen = 'pass';
    var s = game.sides[game.turn];
    var firstOfSteal = E.roundKind(game) === 'steal' && game.turn === 0;
    root().innerHTML = head() + '<main id="tv-main" class="tv-pass">' + scoreStrip() +
      '<section class="tv-card tv-pass-card">' + roundBadge() +
      (firstOfSteal ? '<p class="tv-steal-note">' + T('Si alguien se equivoca, otro jugador puede robar la pregunta y ganar 5 puntos.', 'If someone misses, another player can steal the question and win 5 points.') + '</p>' : '') +
      '<div class="tv-pass-av">' + sideAvatars(s, true) + '</div>' +
      '<h2 class="tv-pass-n">' + T('Turno de ' + sideName(s), sideName(s) + '’s turn') + '</h2>' +
      '<p class="tv-lead">' + (s.team ? T('Pásenle el iPad al equipo: ' + sideMembers(s).map(function (p) { return p.name; }).join(', ') + '.', 'Pass the iPad to the team: ' + sideMembers(s).map(function (p) { return p.name; }).join(', ') + '.')
        : T('Pásale el iPad a ' + sideName(s) + '.', 'Pass the iPad to ' + sideName(s) + '.')) + '</p>' +
      '<button type="button" class="tv-btn tv-btn-big" id="tv-ready">' + T('¡Listo!', 'Ready!') + '</button></section></main>';
    $('#tv-ready').addEventListener('click', function () { sound('click'); askNext(); });
  }
  function askNext() {
    var c = E.next(game);
    if (!c) { game.done = true; return viewEnd(); }
    viewQuestion();
  }

  // The question's picture, map or tune.
  function media(q, choices, done, right, picked) {
    if (q.type === 'pic' && q.art) return '<div class="tv-media tv-pic">' + A.draw(q.art, { label: A.label(q.art)[lang() === 'en' ? 'en' : 'es'] }) + '</div>';
    if (q.type === 'map') {
      var codes = choices.map(function (c) { return q.mapOpts[c.value]; });
      var ri = -1; choices.forEach(function (c, i) { if (c.value === 0) ri = i; });
      return '<div class="tv-media tv-mapbox' + (q.map === 'chile' ? ' tv-mapbox-chile' : '') + '">' + A.map(q.map, codes, { state: done ? 'done' : 'ask', right: ri, aria: t1('Mapa con cuatro letras', 'Map with four letters') }) + '</div>';
    }
    if (q.type === 'snd') return '<div class="tv-media tv-tune"><button type="button" class="tv-play" id="tv-play" aria-label="' + esc(t1('Escuchar la canción', 'Play the song')) + '">' +
      '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" fill="#BE185D"/><path d="M24 18l20 12-20 12z" fill="#fff"/></svg>' +
      '<span>' + T('Escuchar', 'Listen') + '</span></button><div class="tv-notes" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i></div></div>';
    return '';
  }
  function choiceButtons(q, choices, cls, all) {
    if (q.type === 'ord') {
      return '<ol class="tv-ord" id="tv-ord">' + choices.map(function (c, i) {
        return '<li><button type="button" class="tv-ord-b" data-v="' + c.value + '"><span class="tv-ord-n" aria-hidden="true"></span><span class="tv-ord-t">' + TO(c) + '</span></button></li>';
      }).join('') + '</ol><div class="tv-ord-bar"><button type="button" class="tv-btn tv-btn-soft" id="tv-ord-clear">' + T('Borrar', 'Clear') + '</button>' +
        '<button type="button" class="tv-btn" id="tv-ord-ok" disabled>' + T('Listo', 'Done') + '</button></div>';
    }
    var pics = choices.some(function (c) { return c.art; });
    return '<div class="tv-opts ' + (cls || '') + (pics ? ' tv-opts-pic' : '') + (q.type === 'tf' ? ' tv-opts-tf' : '') + (choices.length === 3 ? ' tv-opts-3' : '') + '" role="group" aria-label="' + esc(t1('Respuestas', 'Answers')) + '">' +
      choices.map(function (c, j) {
        var i = all ? all.indexOf(c) : j;
        var label = c.art ? A.label(c.art) : c, letter = q.type === 'map' ? A.LETTERS[i] : '';
        var body = c.art ? '<span class="tv-opt-art">' + A.draw(c.art, { label: false }) + '</span><span class="tv-sr">' + esc(lang() === 'en' ? label.en : label.es) + '</span>'
          : q.type === 'tf' ? '<span class="tv-tf-i" aria-hidden="true">' + (c.value ? '✓' : '✗') + '</span><span>' + TO(c) + '</span>'
          : (letter ? '<span class="tv-letter" style="background:' + A.PIN[i] + '">' + letter + '</span>' : '') + '<span class="tv-opt-t">' + TO(c) + '</span>';
        return '<button type="button" class="tv-opt" data-i="' + i + '" data-v="' + (q.type === 'tf' ? String(c.value) : c.value) + '"' + (c.art ? ' aria-label="' + esc(lang() === 'en' ? label.en : label.es) + '"' : '') + '>' + body + '</button>';
      }).join('') + '</div>';
  }
  function qHead(q) {
    var c = E.catById(q.cat);
    return '<div class="tv-qhead"><span class="tv-qcat" style="--c:' + c.color + '"><span class="tv-qcat-i" aria-hidden="true">' + A.draw(c.icon, { label: false }) + '</span>' + esc(short(c.es, c.en)) + '</span>' +
      '<span id="tv-timer" class="tv-timer" hidden></span>' +
      (speechOn() ? '<button type="button" class="tv-say" id="tv-say" aria-label="' + esc(t1('Leer en voz alta', 'Read aloud')) + '">🔊</button>' : '') + '</div>';
  }

  function viewQuestion() {
    screen = 'question';
    var c = game.current, q = c.q, s = c.side;
    root().innerHTML = head() + '<main id="tv-main" class="tv-q tv-type-' + q.type + (s.tier === 1 ? ' tv-little' : '') + '">' + scoreStrip() +
      '<section class="tv-card tv-qcard">' +
      '<div class="tv-who">' + sideAvatars(s) + '<b>' + esc(sideName(s)) + '</b>' + roundBadge() + '</div>' +
      qHead(q) +
      '<h2 class="tv-qtext" id="tv-qtext">' + TO(q.q) + '</h2>' +
      media(q, c.choices, false) + choiceButtons(q, c.choices) + '</section></main>';
    bindQuestion(q, c.choices, function (v) { onAnswer(v); });
    var secs = E.timerFor(game, s);
    if (secs) startTimer(secs, function () { onAnswer(null); });
    if (s.tier === 1) { var sp = questionSpeech(q, c.choices, true); say(sp[0], sp[1]); }
    if (q.type === 'snd') setTimeout(function () { if (screen === 'question' && game.current === c) playTune(q.tune); }, 350);
  }
  function bindQuestion(q, choices, cb) {
    var sb = $('#tv-say');
    if (sb) sb.addEventListener('click', function () { var sp = questionSpeech(q, choices, true); say(sp[0], sp[1]); });
    var pl = $('#tv-play');
    if (pl) pl.addEventListener('click', function () { playTune(q.tune); });
    if (q.type === 'ord') {
      var order = [];
      var paint = function () {
        $all('.tv-ord-b').forEach(function (b) {
          var v = +b.getAttribute('data-v'), k = order.indexOf(v);
          b.classList.toggle('on', k >= 0);
          $('.tv-ord-n', b).textContent = k >= 0 ? String(k + 1) : '';
          b.setAttribute('aria-label', (k >= 0 ? (k + 1) + ': ' : '') + b.textContent.replace(/^\d+/, ''));
        });
        var ok = $('#tv-ord-ok'); if (ok) ok.disabled = order.length !== choices.length;
      };
      $all('.tv-ord-b').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = +b.getAttribute('data-v'), k = order.indexOf(v);
          if (k >= 0) order.splice(k, 1); else order.push(v);
          sound('click'); paint();
        });
      });
      $('#tv-ord-clear').addEventListener('click', function () { order = []; paint(); });
      $('#tv-ord-ok').addEventListener('click', function () { cb(order.slice()); });
      paint();
      return;
    }
    $all('.tv-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        var raw = b.getAttribute('data-v');
        cb(q.type === 'tf' ? raw === 'true' : +raw);
      });
    });
    // Tapping a highlighted country or region picks its letter.
    $all('.tv-map [data-pick]').forEach(function (p) {
      p.style.cursor = 'pointer';
      p.addEventListener('click', function () { var b = $('.tv-opt[data-i="' + p.getAttribute('data-pick') + '"]'); if (b) b.click(); });
    });
  }

  // ── Timer (gentle: a shrinking ring, no buzzer) ─────────────────
  function startTimer(secs, onEnd) {
    stopTimer();
    var el = $('#tv-timer'), left = secs, t0 = Date.now();
    if (!el) return;
    el.hidden = false;
    var paint = function () {
      var frac = Math.max(0, left / secs), r = 15, C = 2 * Math.PI * r;
      el.innerHTML = '<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="' + r + '" fill="none" stroke="#E5E7EB" stroke-width="4"/>' +
        '<circle cx="18" cy="18" r="' + r + '" fill="none" stroke="' + (frac < 0.25 ? '#F59E0B' : '#10B981') + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (C * frac).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 18 18)"/></svg><span>' + Math.ceil(left) + '</span>';
      el.setAttribute('aria-label', Math.ceil(left) + ' ' + t1('segundos', 'seconds'));
    };
    paint();
    timer = setInterval(function () {
      left = secs - (Date.now() - t0) / 1000;
      if (left <= 0) { stopTimer(); onEnd(); return; }
      paint();
    }, 250);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  // ── Answer and "did you know?" ──────────────────────────────────
  function onAnswer(value) {
    stopTimer(); stopSpeech(); stopTune();
    var c = game.current;
    var res = E.answer(game, value);
    if (!res) return;
    sound(res.ok ? 'correct' : 'wrong');
    viewReveal(c, res, value, null);
  }
  function rightIndex(q, choices) { var ri = -1; choices.forEach(function (c, i) { if ((q.type === 'tf' ? c.value === q.truth : c.value === 0)) ri = i; }); return ri; }
  function answerText(q, choices) {
    if (q.type === 'ord') return q.items.map(function (it) { return lang() === 'en' ? it.en : it.es; }).join(' → ');
    var c = choices[rightIndex(q, choices)], tx = optionText(c);
    return (q.type === 'map' ? A.LETTERS[rightIndex(q, choices)] + ': ' : '') + (lang() === 'en' ? tx[1] : tx[0]);
  }
  function factCard(q) {
    return '<div class="tv-fact"><h3>' + T('¿Sabías que…?', 'Did you know?') + '</h3><p>' + TO(q.fact) + '</p>' +
      (q.src ? '<p class="tv-src">' + esc(t1('Fuente: ', 'Source: ') + q.src) + '</p>' : '') + '</div>';
  }
  function markChoices(q, choices, picked, stealPick) {
    var ri = rightIndex(q, choices);
    $all('.tv-opt').forEach(function (b, i) {
      b.disabled = true;
      if (i === ri) b.classList.add('right');
      else if (picked != null && String(b.getAttribute('data-v')) === String(picked)) b.classList.add('wrong');
      else if (stealPick != null && String(b.getAttribute('data-v')) === String(stealPick)) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    $all('.tv-ord-b').forEach(function (b) { b.disabled = true; });
  }
  function viewReveal(c, res, value, steal) {
    screen = 'reveal';
    var q = c.q, s = c.side, ok = res.ok;
    var verdict = value === null ? T('¡Se acabó el tiempo!', 'Time’s up!')
      : ok ? T('¡Correcto! +' + res.points, 'Correct! +' + res.points) : T('¡Uy! No era esa.', 'Oops! Not that one.');
    var stealHtml = '';
    if (steal) {
      stealHtml = '<p class="tv-verdict ' + (steal.ok ? 'ok' : 'no') + '">' + (steal.ok ? T('¡' + sideName(steal.side) + ' robó la pregunta! +' + steal.points, sideName(steal.side) + ' stole it! +' + steal.points) : T(sideName(steal.side) + ' tampoco acertó.', sideName(steal.side) + ' missed it too.')) + '</p>';
    }
    root().innerHTML = head() + '<main id="tv-main" class="tv-q tv-reveal tv-type-' + q.type + '">' + scoreStrip() +
      '<section class="tv-card tv-qcard">' +
      '<div class="tv-who">' + sideAvatars(s) + '<b>' + esc(sideName(s)) + '</b>' + roundBadge() + '</div>' + qHead(q) +
      '<h2 class="tv-qtext">' + TO(q.q) + '</h2>' +
      '<p class="tv-verdict ' + (ok ? 'ok' : 'no') + '" role="status">' + verdict + '</p>' + stealHtml +
      (ok ? '' : '<p class="tv-answer">' + esc(t1('La respuesta: ', 'The answer: ')) + '<b>' + esc(answerText(q, c.choices)) + '</b></p>') +
      media(q, c.choices, true) + (q.type === 'ord' ? '<ol class="tv-ord tv-ord-done">' + q.items.map(function (it) { return '<li><span class="tv-ord-b on"><span class="tv-ord-t">' + TO(it) + '</span></span></li>'; }).join('') + '</ol>' : choiceButtons(q, c.choices)) +
      factCard(q) +
      '<div class="tv-next">' + (c.canSteal && !c.stolen ? stealPicker(s) : '<button type="button" class="tv-btn tv-btn-big" id="tv-next">' + T('Siguiente', 'Next') + '</button>') + '</div>' +
      '</section></main>';
    if (q.type !== 'ord') markChoices(q, c.choices, q.type === 'tf' ? value : value, steal ? steal.value : null);
    if (ok) celebrateSmall();
    var nb = $('#tv-next'); if (nb) nb.addEventListener('click', function () { E.advance(game); viewPass(); });
    $all('[data-steal]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-steal');
        if (id === 'none') { c.canSteal = false; E.advance(game); viewPass(); return; }
        stealer = id; viewSteal(c, value);
      });
    });
    var sb = $('#tv-say');
    if (sb) sb.addEventListener('click', function () { say(q.fact.es, q.fact.en); });
    var pl = $('#tv-play'); if (pl) pl.addEventListener('click', function () { playTune(q.tune); });
    if (s.tier === 1 && speechOn()) say((ok ? '¡Correcto! ' : 'La respuesta es ' + answerText(q, c.choices) + '. ') + q.fact.es, (ok ? 'Correct! ' : 'The answer is ' + answerText(q, c.choices) + '. ') + q.fact.en);
  }
  function stealPicker(s) {
    var others = game.sides.filter(function (x) { return x !== s; });
    return '<div class="tv-steal"><h3>' + T('¡Robo! ¿Quién quiere robar la pregunta?', 'Steal! Who wants to steal the question?') + '</h3><div class="tv-steal-b">' +
      others.map(function (x) { return '<button type="button" class="tv-btn tv-btn-soft" data-steal="' + esc(x.id) + '">' + sideAvatars(x) + esc(sideName(x)) + '</button>'; }).join('') +
      '<button type="button" class="tv-btn tv-btn-ghost" data-steal="none">' + T('Nadie', 'Nobody') + '</button></div></div>';
  }
  // The stealing side answers from what is left (the missed choice is gone).
  function viewSteal(c, missed) {
    screen = 'steal';
    var q = c.q, side = null;
    game.sides.forEach(function (x) { if (x.id === stealer) side = x; });
    var left = c.choices.filter(function (ch) { return missed === null || ch.value !== missed; });
    root().innerHTML = head() + '<main id="tv-main" class="tv-q tv-type-' + q.type + '">' + scoreStrip() +
      '<section class="tv-card tv-qcard">' +
      '<div class="tv-who">' + sideAvatars(side) + '<b>' + esc(sideName(side)) + '</b><span class="tv-round tv-round-steal">' + T('¡Robando!', 'Stealing!') + '</span></div>' + qHead(q) +
      '<h2 class="tv-qtext">' + TO(q.q) + '</h2>' + media(q, c.choices, false) + choiceButtons(q, left, '', c.choices) + '</section></main>';
    bindQuestion(q, left, function (v) {
      var r = E.steal(game, stealer, v);
      if (!r) return;
      sound(r.ok ? 'correct' : 'wrong');
      viewReveal(c, { ok: c.ok, points: c.ok ? E.POINTS.right : 0 }, missed, { ok: r.ok, points: r.points, side: r.side, value: v });
    });
  }

  // ── The final round: everyone plays ─────────────────────────────
  function viewFinalIntro() {
    screen = 'final-intro';
    root().innerHTML = head() + '<main id="tv-main" class="tv-pass">' + scoreStrip() +
      '<section class="tv-card tv-pass-card tv-final-card">' + roundBadge() +
      '<div class="tv-final-art" aria-hidden="true">' + A.draw('trophy', { label: false }) + '</div>' +
      '<h2 class="tv-pass-n">' + T('¡Todos juegan!', 'Everyone plays!') + '</h2>' +
      '<p class="tv-lead">' + T('Pongan el iPad donde todos lo vean. Lean la pregunta juntos y, a la cuenta de tres, cada uno dice su respuesta o muestra la letra. Cada acierto vale ' + E.POINTS.final + ' puntos.',
        'Put the iPad where everyone can see it. Read the question together and, on the count of three, everyone says their answer or shows the letter. Each right answer is worth ' + E.POINTS.final + ' points.') + '</p>' +
      '<button type="button" class="tv-btn tv-btn-big" id="tv-final-go">' + T('¡Empecemos!', 'Let’s start!') + '</button></section></main>';
    $('#tv-final-go').addEventListener('click', function () { sound('click'); viewFinal(false); });
  }
  function viewFinal(revealed) {
    screen = 'final';
    var f = E.finalQuestion(game);
    if (!f) { game.done = true; return viewEnd(); }
    var q = f.q, choices = f.choices;
    // Letters on every answer so people can show them with their fingers.
    var opts = '<div class="tv-opts tv-opts-final' + (choices.some(function (c) { return c.art; }) ? ' tv-opts-pic' : '') + '">' + choices.map(function (c, i) {
      var body = c.art ? '<span class="tv-opt-art">' + A.draw(c.art, { label: false }) + '</span><span class="tv-sr">' + esc(optionText(c)[lang() === 'en' ? 1 : 0]) + '</span>' : '<span class="tv-opt-t">' + (q.type === 'tf' ? TO(c) : TO(c)) + '</span>';
      return '<div class="tv-opt tv-opt-static' + (revealed ? (i === rightIndex(q, choices) ? ' right' : ' dim') : '') + '"><span class="tv-letter" style="background:' + A.PIN[i % 4] + '">' + A.LETTERS[i] + '</span>' + body + '</div>';
    }).join('') + '</div>';
    root().innerHTML = head() + '<main id="tv-main" class="tv-q tv-final tv-type-' + q.type + '">' + scoreStrip() +
      '<section class="tv-card tv-qcard">' +
      '<div class="tv-who">' + roundBadge() + '<span class="tv-fin-n">' + T('Pregunta ' + (game.finalI + 1) + ' de ' + game.finalQs.length, 'Question ' + (game.finalI + 1) + ' of ' + game.finalQs.length) + '</span></div>' +
      qHead(q) + '<h2 class="tv-qtext">' + TO(q.q) + '</h2>' + media(q, choices, revealed) + opts +
      (revealed ? '<p class="tv-answer">' + esc(t1('La respuesta: ', 'The answer: ')) + '<b>' + esc(answerText(q, choices)) + '</b></p>' + factCard(q) +
        '<div class="tv-winners"><h3>' + T('¿Quién acertó? Tóquenlos.', 'Who got it? Tap them.') + '</h3><div class="tv-win-b">' +
        game.sides.map(function (s) { return '<button type="button" class="tv-win" data-win="' + esc(s.id) + '" aria-pressed="false">' + sideAvatars(s) + '<span>' + esc(sideName(s)) + '</span><span class="tv-check" aria-hidden="true">✓</span></button>'; }).join('') +
        '</div><button type="button" class="tv-btn tv-btn-big" id="tv-fin-next">' + T('Siguiente', 'Next') + '</button></div>'
        : '<div class="tv-next"><button type="button" class="tv-btn tv-btn-big" id="tv-reveal">' + T('3, 2, 1… ¡Mostrar la respuesta!', '3, 2, 1… Show the answer!') + '</button></div>') +
      '</section></main>';
    var sb = $('#tv-say'); if (sb) sb.addEventListener('click', function () { var sp = revealed ? [q.fact.es, q.fact.en] : questionSpeech(q, choices, true); say(sp[0], sp[1]); });
    var pl = $('#tv-play'); if (pl) pl.addEventListener('click', function () { playTune(q.tune); });
    if (!revealed) {
      if (q.type === 'snd') setTimeout(function () { if (screen === 'final') playTune(q.tune); }, 350);
      if (game.finalTier === 1) { var sp = questionSpeech(q, choices, true); say(sp[0], sp[1]); }
      $('#tv-reveal').addEventListener('click', function () { stopSpeech(); stopTune(); sound('star'); viewFinal(true); });
      return;
    }
    $all('[data-win]').forEach(function (b) {
      b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); sound('click'); });
    });
    $('#tv-fin-next').addEventListener('click', function () {
      var ids = $all('[data-win]').filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.getAttribute('data-win'); });
      E.finalMark(game, ids);
      if (ids.length) sound('correct');
      if (game.done) viewEnd(); else viewFinal(false);
    });
  }

  // ── The end: podium, scores, stars ──────────────────────────────
  var saved = false;
  function finish() {
    if (saved) return;
    saved = true;
    var top = E.standings(game), fam = loadFam();
    game.players.forEach(function (p) {
      var side = null;
      game.sides.forEach(function (s) { if (s.members.indexOf(p.id) >= 0) side = s; });
      if (p.kid) {
        var d = loadKid(p.name);
        // Kept by game id, so sync can merge two devices' copies without
        // losing a game (see _mergeTrivia in sync.js).
        d.g[game.id] = [side ? side.right : 0, side ? side.asked : 0, side && side.place === 1 ? 1 : 0, side ? side.score : 0];
        d.games++;
        d.right += side ? side.right : 0;
        d.asked += side ? side.asked : 0;
        if (side && side.place === 1) d.wins++;
        if (side && side.score > d.best) d.best = side.score;
        var h = game.hist[p.id] || {};
        for (var k in d.hist) if (!(k in h)) h[k] = d.hist[k];
        d.hist = h;
        saveKid(p.name, d);
      } else {
        fam.hist[p.id] = game.hist[p.id] || {};
      }
    });
    saveFam(fam);
    var winner = top[0];
    try { if (typeof ActivityLog !== 'undefined') ActivityLog.log('Trivia Familiar', '🎲', 'Game night: ' + game.rounds + ' rounds, ' + game.players.length + ' players' + (winner ? ', winner ' + sideName(winner) : '')); } catch (e) {}
  }
  function viewEnd() {
    screen = 'end'; stopTimer(); stopSpeech(); stopTune();
    game.done = true;
    var list = E.standings(game);
    finish();
    var kids = game.players.filter(function (p) { return p.kid; });
    var podium = list.slice(0, 3);
    var order = [podium[1], podium[0], podium[2]];
    root().innerHTML = head() + '<main id="tv-main" class="tv-end">' +
      '<div class="tv-confetti" aria-hidden="true">' + confetti() + '</div>' +
      '<section class="tv-card tv-end-card"><h2 class="tv-end-h">' + (list[0] && list.filter(function (s) { return s.place === 1; }).length > 1 ? T('¡Empate en el primer lugar!', 'A tie for first place!') : T('¡Ganó ' + sideName(list[0]) + '!', sideName(list[0]) + ' wins!')) + '</h2>' +
      '<div class="tv-podium">' + order.map(function (s, i) {
        var place = [2, 1, 3][i];
        return '<div class="tv-pod tv-pod-' + place + '">' + (s ? '<div class="tv-pod-who">' + sideAvatars(s, place === 1) + '<b>' + esc(sideName(s)) + '</b><i>' + s.score + '</i></div>' : '') +
          '<div class="tv-step"><span>' + place + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="tv-table-w"><table class="tv-table"><thead><tr><th>#</th><th>' + esc(t1('Jugador', 'Player')) + '</th><th>' + esc(t1('Ventaja', 'Start')) + '</th><th>' + esc(t1('Aciertos', 'Right')) + '</th><th>' + esc(t1('Robos', 'Steals')) + '</th><th>' + esc(t1('Final', 'Final')) + '</th><th>' + esc(t1('Puntos', 'Points')) + '</th></tr></thead><tbody>' +
      list.map(function (s) {
        return '<tr><td>' + s.place + '</td><td class="tv-t-n">' + esc(sideName(s)) + '</td><td>' + s.headStart + '</td><td>' + s.right + '/' + s.asked + '</td><td>' + s.steals + '</td><td>' + s.finals + '</td><td><b>' + s.score + '</b></td></tr>';
      }).join('') + '</tbody></table></div>' +
      (kids.length ? '<p class="tv-stars">⭐ ' + T('Una estrella para: ' + kids.map(function (p) { return p.name; }).join(', ') + '.', 'A star for: ' + kids.map(function (p) { return p.name; }).join(', ') + '.') + '</p>' : '') +
      '<div class="tv-end-b"><button type="button" class="tv-btn tv-btn-big" id="tv-again">' + T('Jugar otra vez', 'Play again') + '</button>' +
      '<button type="button" class="tv-btn tv-btn-soft" id="tv-setup">' + T('Cambiar jugadores o temas', 'Change players or subjects') + '</button></div>' +
      '</section></main>';
    sound('cheer');
    $('#tv-again').addEventListener('click', function () { saved = false; start(); });
    $('#tv-setup').addEventListener('click', function () { saved = false; game = null; viewSetup(); });
  }
  function confetti() {
    var cols = ['#F472B6', '#FACC15', '#60A5FA', '#34D399', '#F97316', '#A78BFA', '#EF4444'], out = '';
    for (var i = 0; i < 36; i++) {
      out += '<i style="left:' + ((i * 37) % 100) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + ((i % 9) * 0.22).toFixed(2) + 's;animation-duration:' + (2.6 + (i % 5) * 0.4).toFixed(1) + 's;transform:rotate(' + (i * 23) + 'deg)"></i>';
    }
    return out;
  }
  function celebrateSmall() {
    var host = $('.tv-verdict.ok');
    if (!host) return;
    host.classList.add('tv-pop');
  }

  // ── Start-up ─────────────────────────────────────────────────────
  function init() {
    try { seed = +(new URLSearchParams(location.search).get('seed') || 0); } catch (e) { seed = 0; }
    var rows = (window.TRIVIA_ROWS || []).concat(typeof TriviaGen !== 'undefined' ? TriviaGen.rows() : []);
    bank = E.build(rows);
    setup = defaultSetup();
    viewSetup();
  }

  function state() {
    var c = game && game.current;
    var fq = game && E.finalQuestion(game);
    return {
      screen: screen, bank: bank.length, setup: setup,
      round: game ? game.round : 0, kind: game ? E.roundKind(game) : null, done: game ? game.done : false,
      sides: game ? game.sides.map(function (s) { return { id: s.id, tier: s.tier, score: s.score, right: s.right, asked: s.asked, steals: s.steals, finals: s.finals, members: s.members }; }) : [],
      current: c ? { side: c.side.id, id: c.q.id, type: c.q.type, tier: c.q.tier, cat: c.q.cat, rightIndex: rightIndex(c.q, c.choices), choices: c.choices.length, answered: c.answered, canSteal: !!c.canSteal, timer: E.timerFor(game, c.side) } : null,
      final: fq ? { id: fq.q.id, rightIndex: rightIndex(fq.q, fq.choices), i: game.finalI, n: game.finalQs.length } : null
    };
  }

  // Open one question by id on the current turn (tests and checking the
  // art). Starts a game with the chosen players if none is running.
  function show(id) {
    var q = null;
    bank.forEach(function (x) { if (x.id === id) q = x; });
    if (!q) return false;
    if (!game || game.done) start();
    if (!game) return false;
    if (E.roundKind(game) === 'final') return false;
    var side = game.sides[game.turn];
    game.used[q.id] = 1;
    game.current = { side: side, q: q, choices: E.choices(q, side.tier, game.rand), answered: false, stolen: false };
    viewQuestion();
    return true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { state: state, show: show, melody: melody, christmasSeason: christmasSeason, kidKey: kidKey };
})();
