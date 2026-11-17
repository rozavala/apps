/* ================================================================
   LÓGICA 🧩 — puzzles and clear thinking (ages 4 to 13)

   Eight rooms (js/logica-engine.js makes and checks every puzzle):
     Sudoku · Nonograms · Logic grids · What comes next? · The balance
     (and the fake coin) · River crossings · Truth or fib · Clear thinking
   plus a daily puzzle with a streak.

   Per kid, one JSON blob at zs_logica_<kid>:
     { v:1,
       lv:   { '<levelId>': 0..3 },         // best stars per level
       n:    { '<levelId>': timesSolved },
       pics: { '<pictureId>': 1 },          // nonogram pictures revealed
       daily:{ last:'YYYY-MM-DD', streak, best, n },
       last: 'YYYY-MM-DD' }
   Stars (js/auth.js, APP_STAR_CONFIGS 'logica'): the best of each level
   (up to 3) plus one for every 3 daily puzzles solved (up to 10).
   Fields are only ever added, so older saves keep working.
   ================================================================ */

var Logica = (function () {
  'use strict';

  var E = LogicaEngine, D = LogicaData, Art = LogicaArt;
  var PREFIX = 'zs_logica_';

  var data = null, user = null, tier = 'advanced', root = null;
  var seedBase = 0, seedN = 0;
  var view = { screen: 'home', room: null, level: null, daily: false };
  var game = null;

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function load() {
    var k = key(), d = {};
    if (k) { try { d = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { d = {}; } }
    d = obj(d);
    d.lv = obj(d.lv); d.n = obj(d.n); d.pics = obj(d.pics); d.daily = obj(d.daily);
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
  function lvStars(id) { return Math.max(0, Math.min(3, data.lv[id] | 0)); }
  function totalStars() {
    if (typeof getAppStars === 'function') { try { return getAppStars('logica', data); } catch (e) {} }
    var n = 0, k;
    for (k in data.lv) n += Math.max(0, Math.min(3, data.lv[k] | 0));
    return n + Math.min(10, Math.floor((data.daily.n | 0) / 3));
  }

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function T(es, en) { if (es === en) return es; return typeof zsT === 'function' ? zsT(es, en) : en; }
  function P(pair) { return T(pair[0], pair[1]); }
  function lang1() { return lang() === 'en' ? 'en' : 'es'; }      // one language, for read-aloud and generated text
  function P1(pair) { return lang1() === 'es' ? pair[0] : pair[1]; }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function log(msg) { if (typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Lógica', '🧩', msg); } catch (e) {} } }
  function nextSeed() { seedN++; return (seedBase + seedN * 7919) >>> 0; }
  function both() { return lang() === 'both'; }

  function h(tag, attrs, kids) {
    var el = document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;          // only our own SVG / static strings
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function clear(el) { if (typeof ZsCanvas !== 'undefined') ZsCanvas.releaseIn(el); while (el.firstChild) el.removeChild(el.firstChild); }
  function scanSpeak() { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.scan) { try { ZsSpeak.scan(); } catch (e) {} } }
  function stopSpeak() { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.stop) { try { ZsSpeak.stop(); } catch (e) {} } }
  // A paragraph that the read-aloud button can say (in one language)
  function sayP(cls, es, en) { return h('p', { class: cls, 'data-speak': lang1() === 'es' ? es : en, text: T(es, en) }); }

  function starRow(n, size) {
    var row = h('span', { class: 'lg-stars', role: 'img', 'aria-label': n + ' / 3 ' + T('estrellas', 'stars') });
    for (var i = 1; i <= 3; i++) row.appendChild(h('span', { class: 'lg-star', html: Art.star(i <= n, size || 16) }));
    return row;
  }

  // ---------------------------------------------------------------
  // Names
  // ---------------------------------------------------------------
  var ROOM_TXT = {
    sudoku: { t: ['Sudoku', 'Sudoku'], d: ['Cada fila, columna y caja tiene cada número una sola vez.', 'Every row, column and box has each number exactly once.'] },
    nono: { t: ['Nonogramas', 'Nonograms'], d: ['Los números dicen cuántos cuadros seguidos pintar. ¡Aparece un dibujo!', 'The numbers say how many squares in a row to fill. A picture appears!'] },
    grid: { t: ['¿Quién tiene el perro?', 'Who has the dog?'], d: ['Lee las pistas y marca ✓ o ✗ en la tabla.', 'Read the clues and mark ✓ or ✗ in the grid.'] },
    pattern: { t: ['¿Qué sigue?', 'What comes next?'], d: ['Encuentra la regla de la serie.', 'Find the rule of the pattern.'] },
    balance: { t: ['La balanza', 'The balance'], d: ['Frutas, bloques y la moneda falsa.', 'Fruit, blocks and the fake coin.'] },
    river: { t: ['Cruzar el río', 'River crossing'], d: ['Lleva a todos al otro lado sin que nadie tenga problemas.', 'Get everyone across without any trouble.'] },
    knights: { t: ['Verdad o mentira', 'Truth or fib'], d: ['Unos siempre dicen la verdad y otros siempre mienten. ¿Quién es quién?', 'Some always tell the truth and some always lie. Who is who?'] },
    think: { t: ['Pensar con claridad', 'Clear thinking'], d: ['Hechos y opiniones, qué hay que saber y el paso débil de un argumento.', 'Facts and opinions, what you need to know, and the weak step in an argument.'] }
  };
  var LEVEL_TXT = {
    su4p: ['Frutas 4×4', 'Fruit 4×4'], su4: ['4×4', '4×4'], su4h: ['4×4 difícil', '4×4 hard'], su6a: ['6×6', '6×6'], su6b: ['6×6 difícil', '6×6 hard'],
    su9a: ['9×9 fácil', '9×9 easy'], su9b: ['9×9', '9×9'], su9c: ['9×9 difícil', '9×9 hard'],
    no5: ['5×5', '5×5'], no7: ['7×7', '7×7'], no10: ['10×10', '10×10'],
    lg3p: ['3 mascotas', '3 pets'], lg3: ['3 niños, 2 cosas', '3 kids, 2 things'], lg4: ['4 niños, 2 cosas', '4 kids, 2 things'], lg4x3: ['4 niños, 3 cosas', '4 kids, 3 things'],
    pa_pic: ['Figuras', 'Shapes'], pa_num1: ['Números', 'Numbers'], pa_num2: ['Series difíciles', 'Tricky series'], pa_mat: ['Tablas 3×3', '3×3 grids'],
    ba_order: ['¿Cuál pesa más?', 'Which is heaviest?'], ba_eq2: ['Bloques: 2 frutas', 'Blocks: 2 fruits'], ba_eq3: ['Bloques: 3 frutas', 'Blocks: 3 fruits'],
    co3: ['3 monedas, 1 pesada', '3 coins, 1 weighing'], co9: ['9 monedas, 2 pesadas', '9 coins, 2 weighings'], co8: ['8 monedas, 2 pesadas', '8 coins, 2 weighings'], co12: ['12 monedas, 3 pesadas', '12 coins, 3 weighings'],
    rv_fox: ['El zorro, la gallina y el maíz', 'The fox, the hen and the corn'], rv_family: ['La familia en el bote', 'The family boat'],
    rv_bridge: ['El puente de noche', 'The night bridge'], rv_hens: ['Tres gallinas y tres zorros', 'Three hens and three foxes'],
    kk2: ['Dos isleños', 'Two islanders'], kk3: ['Tres isleños', 'Three islanders'], kk3h: ['Tres isleños, difícil', 'Three islanders, hard'],
    ct_fo: ['¿Hecho u opinión?', 'Fact or opinion?'], ct_need: ['¿Qué necesitas saber?', 'What would you need to know?'], ct_arg: ['El paso débil', 'The weak step']
  };
  function levelName(id) { return P(LEVEL_TXT[id] || [id, id]); }
  function roomOf(id) { return E.LEVEL_BY_ID[id] ? E.LEVEL_BY_ID[id].room : null; }
  var TIER_AGES = ['4–5', '6–8', '9–11', '12+'];

  // ---------------------------------------------------------------
  // Screens: home
  // ---------------------------------------------------------------
  function header(sub, back) {
    return h('div', { class: 'lg-head' }, [
      back ? h('button', { type: 'button', class: 'lg-back', 'aria-label': T('Volver', 'Back'), onclick: back, text: '‹' }) : null,
      h('div', { class: 'lg-brand' }, [h('span', { class: 'lg-brand-ico', html: Art.owl(40) }), h('span', { text: 'Lógica' })]),
      h('span', { class: 'lg-total', id: 'lg-total', text: '★ ' + totalStars() })
    ]);
  }
  function leave() { game = null; stopSpeak(); }

  function showHome() {
    leave();
    view = { screen: 'home' };
    clear(root);
    root.appendChild(header());
    var t = today(), dp = E.dailyPick(t, tier), doneToday = data.daily.last === t;
    var streak = E.dailyStreak(data.daily, t);
    root.appendChild(h('div', { class: 'lg-hero' }, [
      h('div', { class: 'lg-hero-art', html: Art.owl(96) }),
      h('div', { class: 'lg-hero-txt' }, [
        sayP('lg-lead', 'Piensa paso a paso. Cada puzzle tiene una sola solución, y siempre se puede llegar a ella pensando.', 'Think step by step. Every puzzle has exactly one answer, and you can always reach it by thinking.')
      ])
    ]));
    var dl = E.LEVEL_BY_ID[dp.level];
    root.appendChild(h('section', { class: 'lg-daily' + (doneToday ? ' done' : ''), 'aria-label': T('Puzzle del día', 'Daily puzzle') }, [
      h('div', { class: 'lg-daily-flame', html: Art.flame(44, streak > 0) }),
      h('div', { class: 'lg-daily-txt' }, [
        h('div', { class: 'lg-daily-k', text: T('Puzzle del día', 'Daily puzzle') }),
        h('div', { class: 'lg-daily-t', text: P(ROOM_TXT[dl.room].t) + ' · ' + levelName(dp.level) }),
        h('div', { class: 'lg-daily-s', id: 'lg-streak', text: streak ? T('Racha: ' + streak + (streak === 1 ? ' día' : ' días'), 'Streak: ' + streak + (streak === 1 ? ' day' : ' days')) + (data.daily.best > streak ? ' · ' + T('récord ', 'best ') + data.daily.best : '')
                                                         : T('¡Empieza una racha hoy!', 'Start a streak today!') })
      ]),
      h('button', { type: 'button', class: 'lg-btn lg-primary', id: 'lg-daily-go', onclick: function () { play(dp.level, { daily: true, seed: dp.seed }); } },
        [doneToday ? T('Jugar otra vez', 'Play again') : T('Resolver', 'Solve it')])
    ]));
    var grid = h('div', { class: 'lg-rooms' });
    E.roomsFor(tier).forEach(function (id) {
      var lvls = E.levelsFor(id, tier), got = 0;
      lvls.forEach(function (l) { got += lvStars(l.id); });
      grid.appendChild(h('button', { type: 'button', class: 'lg-room lg-room-' + id, 'data-room': id, onclick: function () { showRoom(id); } }, [
        h('span', { class: 'lg-room-ico', html: Art.room(id, 56) }),
        h('span', { class: 'lg-room-txt' }, [
          h('span', { class: 'lg-room-t', text: P(ROOM_TXT[id].t) }),
          h('span', { class: 'lg-room-d', text: P(ROOM_TXT[id].d) }),
          h('span', { class: 'lg-room-s', text: '★ ' + got + ' / ' + lvls.length * 3 })
        ])
      ]));
    });
    root.appendChild(grid);
    scanSpeak();
  }

  // ---------------------------------------------------------------
  // Screens: one room
  // ---------------------------------------------------------------
  function showRoom(id) {
    leave();
    view = { screen: 'room', room: id };
    clear(root);
    root.appendChild(header(null, showHome));
    root.appendChild(h('div', { class: 'lg-room-head' }, [
      h('span', { class: 'lg-room-ico', html: Art.room(id, 64) }),
      h('div', {}, [h('h1', { class: 'lg-h1', text: P(ROOM_TXT[id].t) }), sayP('lg-sub', ROOM_TXT[id].d[0], ROOM_TXT[id].d[1])])
    ]));
    var list = h('div', { class: 'lg-levels' }), ti = E.tierIdx(tier);
    E.levelsFor(id, tier).forEach(function (l) {
      var s = lvStars(l.id);
      list.appendChild(h('button', { type: 'button', class: 'lg-level' + (s ? ' got' : ''), 'data-level': l.id, onclick: function () { play(l.id); } }, [
        h('span', { class: 'lg-level-t', text: levelName(l.id) }),
        l.min === ti ? h('span', { class: 'lg-badge', text: T('Para ti', 'For you') }) : (l.min > ti ? h('span', { class: 'lg-badge lg-badge-hard', text: T('Desafío', 'Challenge') }) : null),
        h('span', { class: 'lg-level-age', text: T('edad ', 'age ') + TIER_AGES[l.min] }),
        starRow(s, 18)
      ]));
    });
    root.appendChild(list);
    if (id === 'nono') {
      var gal = h('div', { class: 'lg-gallery', 'aria-label': T('Dibujos descubiertos', 'Pictures found') });
      D.NONOGRAMS.forEach(function (p) {
        if (!data.pics[p.id]) return;
        gal.appendChild(h('span', { class: 'lg-gal-pic', title: P(p.name), html: pixelArt(p, 44) }));
      });
      if (gal.firstChild) root.appendChild(h('div', {}, [h('h2', { class: 'lg-h2', text: T('Tus dibujos', 'Your pictures') }), gal]));
    }
    scanSpeak();
  }
  function pixelArt(p, size) {
    var rows = p.rows, n = rows.length, s = '';
    rows.forEach(function (row, y) { row.split('').forEach(function (c, x) { if (c === '#') s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + p.color + '"/>'; }); });
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + P(p.name) + '"><rect width="' + n + '" height="' + n + '" fill="#fff"/>' + s + '</svg>';
  }

  // ---------------------------------------------------------------
  // The play screen (shared frame) — each kind fills `stage`
  // ---------------------------------------------------------------
  function play(levelId, opts) {
    opts = opts || {};
    leave();
    var L = E.LEVEL_BY_ID[levelId];
    if (!L) return showHome();
    view = { screen: 'play', room: L.room, level: levelId, daily: !!opts.daily };
    clear(root);
    root.appendChild(header(null, function () { if (view.daily) showHome(); else showRoom(L.room); }));
    var top = h('div', { class: 'lg-play-head' }, [
      h('span', { class: 'lg-room-ico sm', html: Art.room(L.room, 40) }),
      h('div', {}, [
        h('div', { class: 'lg-play-k', text: (opts.daily ? T('Puzzle del día · ', 'Daily puzzle · ') : '') + P(ROOM_TXT[L.room].t) }),
        h('h1', { class: 'lg-h1', text: levelName(levelId) })
      ]),
      starRow(lvStars(levelId), 18)
    ]);
    root.appendChild(top);
    var intro = h('div', { class: 'lg-intro' });
    var stage = h('div', { class: 'lg-stage', id: 'lg-stage' });
    var msg = h('div', { class: 'lg-msg', id: 'lg-msg', role: 'status', 'aria-live': 'polite' });
    var bar = h('div', { class: 'lg-tools' });
    root.appendChild(intro); root.appendChild(stage); root.appendChild(msg); root.appendChild(bar);
    var seed = opts.seed != null ? opts.seed : nextSeed();
    game = { level: levelId, L: L, seed: seed, daily: !!opts.daily, hints: 0, mistakes: 0, done: false,
      intro: intro, stage: stage, msgEl: msg, bar: bar };
    var maker = KINDS[L.room];
    maker(game);
    buildTools(game);
    scanSpeak();
  }
  function say(g, text, kind) {
    g.msgEl.className = 'lg-msg' + (kind ? ' ' + kind : '');
    g.msgEl.textContent = text || '';
  }
  function buildTools(g) {
    clear(g.bar);
    if (g.hint) g.bar.appendChild(h('button', { type: 'button', class: 'lg-btn', id: 'lg-hint', onclick: function () { if (g.done) return; g.hints++; g.hint(); } }, ['💡 ' + T('Pista', 'Hint')]));
    if (g.check) g.bar.appendChild(h('button', { type: 'button', class: 'lg-btn', id: 'lg-check', onclick: function () { if (!g.done) g.check(); } }, ['✔ ' + T('Comprobar', 'Check')]));
    if (g.undo) g.bar.appendChild(h('button', { type: 'button', class: 'lg-btn', id: 'lg-undo', onclick: function () { if (!g.done) g.undo(); } }, ['↶ ' + T('Deshacer', 'Undo')]));
    if (g.reset) g.bar.appendChild(h('button', { type: 'button', class: 'lg-btn', id: 'lg-reset', onclick: function () { if (!g.done) g.reset(); } }, ['⟲ ' + T('Empezar de nuevo', 'Start over')]));
    if (!g.daily && g.fresh !== false) g.bar.appendChild(h('button', { type: 'button', class: 'lg-btn', id: 'lg-new', onclick: function () { play(g.level); } }, ['🎲 ' + T('Otro puzzle', 'New puzzle')]));
  }

  // The puzzle is solved: stars, saving, the daily streak, and what next.
  function win(g, stars, extra) {
    if (g.done) return;
    g.done = true;
    stars = Math.max(1, Math.min(3, stars | 0));
    var before = lvStars(g.level);
    if (stars > before) data.lv[g.level] = stars;
    data.n[g.level] = (data.n[g.level] | 0) + 1;
    var streakMsg = '';
    if (g.daily && data.daily.last !== today()) {
      data.daily = E.dailySolve(data.daily, today());
      streakMsg = T('¡Racha de ' + data.daily.streak + (data.daily.streak === 1 ? ' día!' : ' días!'), 'Streak: ' + data.daily.streak + (data.daily.streak === 1 ? ' day!' : ' days!'));
    }
    if (extra && extra.pic) data.pics[extra.pic] = 1;
    save();
    sfx('cheer');
    log(levelName(g.level) + ' — ' + stars + '★');
    var tot = document.getElementById('lg-total');
    if (tot) tot.textContent = '★ ' + totalStars();
    var L = g.L, list = E.levelsFor(L.room, tier), idx = list.map(function (x) { return x.id; }).indexOf(g.level);
    var next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
    var card = h('div', { class: 'lg-win', id: 'lg-win', role: 'dialog', 'aria-label': T('¡Resuelto!', 'Solved!') }, [
      h('div', { class: 'lg-win-art', html: Art.owl(70) }),
      h('div', { class: 'lg-win-t', text: extra && extra.title ? extra.title : T('¡Resuelto!', 'Solved!') }),
      starRow(stars, 30),
      extra && extra.note ? h('p', { class: 'lg-win-note', text: extra.note }) : null,
      streakMsg ? h('p', { class: 'lg-win-streak', html: Art.flame(22) + '<span></span>' }) : null,
      h('div', { class: 'lg-win-btns' }, [
        g.daily ? h('button', { type: 'button', class: 'lg-btn lg-primary', onclick: showHome }, [T('Listo', 'Done')])
                : h('button', { type: 'button', class: 'lg-btn lg-primary', id: 'lg-again', onclick: function () { play(g.level); } }, [T('Otro igual', 'Another one')]),
        !g.daily && next ? h('button', { type: 'button', class: 'lg-btn', id: 'lg-next', onclick: function () { play(next.id); } }, [T('Siguiente: ', 'Next: ') + levelName(next.id)]) : null,
        h('button', { type: 'button', class: 'lg-btn', onclick: function () { showRoom(L.room); } }, [T('Más de ', 'More ') + P(ROOM_TXT[L.room].t)])
      ])
    ]);
    if (streakMsg) card.querySelector('.lg-win-streak span').textContent = streakMsg;
    g.bar.parentNode.insertBefore(card, g.bar);
    clear(g.bar);
    say(g, '');
    try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }

  // ---------------------------------------------------------------
  // Sudoku
  // ---------------------------------------------------------------
  var SU_FRUIT = ['apple', 'pear', 'orange', 'grapes'];
  function playSudoku(g) {
    var L = g.L, n = L.n, pz = E.sudokuMake(n, L.lv, g.seed), pics = !!L.pics;
    var cur = pz.puzzle.slice(), sel = -1, hinted = {}, wrong = {};
    var box = pz.box;
    g.intro.appendChild(pics
      ? sayP('lg-txt', 'Cada fila, cada columna y cada caja de 2×2 tiene las cuatro frutas, una sola vez.', 'Every row, every column and every 2×2 box has all four fruits, once each.')
      : sayP('lg-txt', 'Pon los números del 1 al ' + n + ': cada fila, cada columna y cada caja los tiene todos, una sola vez.', 'Fill in 1 to ' + n + ': every row, every column and every box has each number exactly once.'));
    var board = h('div', { class: 'lg-su lg-su-' + n, role: 'grid', 'aria-label': 'Sudoku ' + n + '×' + n, style: '--n:' + n });
    var pad = h('div', { class: 'lg-pad lg-pad-' + n });
    function sym(v, size) { return pics ? Art.fruit(SU_FRUIT[v - 1], size || 30, fruitName(v)) : String(v); }
    function fruitName(v) { var o = D.BAL_OBJECTS.filter(function (b) { return b.id === SU_FRUIT[v - 1]; })[0]; return o ? P1(o.n) : String(v); }
    function draw() {
      clear(board);
      for (var k = 0; k < n * n; k++) {
        var r = Math.floor(k / n), c = k % n, given = pz.puzzle[k] !== 0;
        var cls = 'lg-su-cell';
        if (given) cls += ' given';
        if (hinted[k]) cls += ' hinted';
        if (wrong[k]) cls += ' wrong';
        if (k === sel) cls += ' sel';
        else if (sel >= 0 && (Math.floor(sel / n) === r || sel % n === c || E.boxOf(n, Math.floor(sel / n), sel % n) === E.boxOf(n, r, c))) cls += ' peer';
        if (sel >= 0 && cur[sel] && cur[k] === cur[sel]) cls += ' same';
        if ((c + 1) % box[1] === 0 && c < n - 1) cls += ' br';
        if ((r + 1) % box[0] === 0 && r < n - 1) cls += ' bb';
        var label = T('Fila ', 'Row ') + (r + 1) + ', ' + T('columna ', 'column ') + (c + 1) + ': ' + (cur[k] ? (pics ? fruitName(cur[k]) : cur[k]) : T('vacía', 'empty'));
        var cell = h('button', { type: 'button', class: cls, 'data-k': k, 'aria-label': label, disabled: given ? true : null });
        if (cur[k]) { if (pics) cell.innerHTML = sym(cur[k], n === 4 ? 40 : 28); else cell.textContent = cur[k]; }
        (function (kk) { cell.addEventListener('click', function () { sel = kk; draw(); }); })(k);
        board.appendChild(cell);
      }
    }
    function put(v) {
      if (g.done || sel < 0 || pz.puzzle[sel]) return;
      cur[sel] = v; delete wrong[sel]; delete hinted[sel];
      sfx('click');
      draw();
      if (cur.every(function (x, i) { return x === pz.solution[i]; })) win(g, E.puzzleStars(g.hints, g.mistakes));
      else if (cur.every(function (x) { return x; })) say(g, T('El tablero está lleno, pero algo no calza. Usa «Comprobar».', 'The board is full, but something doesn’t fit. Use "Check".'), 'warn');
    }
    for (var v = 1; v <= n; v++) (function (vv) {
      pad.appendChild(h('button', { type: 'button', class: 'lg-pad-btn', 'data-v': vv, 'aria-label': pics ? fruitName(vv) : String(vv), html: pics ? sym(vv, 34) : String(vv), onclick: function () { put(vv); } }));
    })(v);
    pad.appendChild(h('button', { type: 'button', class: 'lg-pad-btn lg-pad-erase', 'aria-label': T('Borrar', 'Erase'), onclick: function () { put(0); } }, ['⌫']));
    g.stage.appendChild(board); g.stage.appendChild(pad);
    // keyboard: arrows and digits
    board.addEventListener('keydown', function (e) {
      if (sel < 0) return;
      var r = Math.floor(sel / n), c = sel % n;
      if (/^[1-9]$/.test(e.key) && +e.key <= n) { put(+e.key); e.preventDefault(); }
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { put(0); e.preventDefault(); }
      else if (e.key.indexOf('Arrow') === 0) {
        if (e.key === 'ArrowUp') r = (r + n - 1) % n; if (e.key === 'ArrowDown') r = (r + 1) % n;
        if (e.key === 'ArrowLeft') c = (c + n - 1) % n; if (e.key === 'ArrowRight') c = (c + 1) % n;
        sel = r * n + c; draw(); var b = board.querySelector('[data-k="' + sel + '"]'); if (b && !b.disabled) b.focus(); e.preventDefault();
      }
    });
    g.check = function () {
      wrong = {}; var bad = 0, empty = 0;
      cur.forEach(function (x, i) { if (x && x !== pz.solution[i]) { wrong[i] = 1; bad++; } if (!x) empty++; });
      if (bad) { g.mistakes++; sfx('wrong'); say(g, T(bad === 1 ? 'Hay 1 casilla que no calza (en rojo).' : 'Hay ' + bad + ' casillas que no calzan (en rojo).', bad === 1 ? '1 square doesn’t fit (in red).' : bad + ' squares don’t fit (in red).'), 'warn'); }
      else say(g, empty ? T('Todo bien hasta ahora. Faltan ' + empty + '.', 'All good so far. ' + empty + ' to go.') : '', 'ok');
      draw();
    };
    g.hint = function () {
      var hi = E.sudokuHint(pz, cur);
      if (!hi) return;
      cur[hi.cell] = hi.value; hinted[hi.cell] = 1; delete wrong[hi.cell]; sel = hi.cell;
      var r = Math.floor(hi.cell / n) + 1, c = hi.cell % n + 1, val = pics ? fruitName(hi.value) : hi.value;
      say(g, hi.single ? T('Fila ' + r + ', columna ' + c + ': mira su fila, su columna y su caja. Solo cabe ' + val + '.', 'Row ' + r + ', column ' + c + ': look at its row, column and box. Only ' + val + ' fits.')
                       : T('Fila ' + r + ', columna ' + c + ': aquí va ' + val + '.', 'Row ' + r + ', column ' + c + ': ' + val + ' goes here.'), 'hint');
      draw();
      if (cur.every(function (x, i) { return x === pz.solution[i]; })) win(g, E.puzzleStars(g.hints, g.mistakes));
    };
    g.reset = function () { cur = pz.puzzle.slice(); wrong = {}; hinted = {}; sel = -1; say(g, ''); draw(); };
    g._t = { pz: pz, put: function (k, v) { sel = k; put(v); }, solve: function () { pz.solution.forEach(function (v, k) { if (!pz.puzzle[k]) { sel = k; if (!g.done) put(v); } }); } };
    draw();
  }

  // ---------------------------------------------------------------
  // Nonograms
  // ---------------------------------------------------------------
  function playNono(g) {
    var size = g.L.size, pics = E.nonoPictures(size);
    // the first picture not yet revealed, else one at random
    var fresh = pics.filter(function (p) { return !data.pics[p.id]; });
    var r = E.rng(g.seed), pic = (fresh.length && !g.daily ? fresh : pics)[Math.floor(r() * (fresh.length && !g.daily ? fresh : pics).length)];
    var pz = E.nonoMake(pic), w = pz.w, hh = pz.h, cur = [], mode = 1, i;
    for (i = 0; i < hh; i++) cur.push(new Array(w).fill(0));    // 0 empty, 1 filled, 2 marked ✗
    g.intro.appendChild(sayP('lg-txt', 'Los números de cada fila y columna dicen cuántos cuadros seguidos hay que pintar, en orden. Entre dos grupos hay al menos un cuadro en blanco.', 'The numbers on each row and column say how many squares in a row to fill, in order. There is at least one blank square between two groups.'));
    var modes = h('div', { class: 'lg-modes', role: 'radiogroup', 'aria-label': T('Herramienta', 'Tool') });
    function modeBtn(m, label) {
      return h('button', { type: 'button', class: 'lg-btn lg-mode' + (mode === m ? ' on' : ''), 'data-mode': m, role: 'radio', 'aria-checked': mode === m ? 'true' : 'false',
        onclick: function () { mode = m; Array.prototype.forEach.call(modes.children, function (b) { var on = +b.getAttribute('data-mode') === mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); }); } }, [label]);
    }
    modes.appendChild(modeBtn(1, '■ ' + T('Pintar', 'Fill')));
    modes.appendChild(modeBtn(2, '✗ ' + T('Marcar vacío', 'Mark empty')));
    var board = h('div', { class: 'lg-nono lg-nono-' + size, style: '--w:' + w + ';--h:' + hh, role: 'grid', 'aria-label': T('Nonograma ', 'Nonogram ') + w + '×' + hh });
    var cells = [];
    function lineOk(clue, line) { return E.lineClue(line.map(function (x) { return x === 1 ? 1 : 0; })).join(',') === clue.join(','); }
    function build() {
      clear(board); cells = [];
      board.appendChild(h('div', { class: 'lg-nono-corner' }));
      for (var c = 0; c < w; c++) board.appendChild(h('div', { class: 'lg-nono-cc', 'data-c': c }, pz.cols[c].length ? pz.cols[c].map(function (x) { return h('span', { text: String(x) }); }) : [h('span', { text: '0' })]));
      for (var y = 0; y < hh; y++) {
        board.appendChild(h('div', { class: 'lg-nono-rc', 'data-r': y }, pz.rows[y].length ? pz.rows[y].map(function (x) { return h('span', { text: String(x) }); }) : [h('span', { text: '0' })]));
        cells.push([]);
        for (var x = 0; x < w; x++) {
          var b = h('button', { type: 'button', class: 'lg-nono-cell', 'data-y': y, 'data-x': x, 'aria-label': T('Fila ', 'Row ') + (y + 1) + ', ' + T('columna ', 'column ') + (x + 1) });
          if ((x + 1) % 5 === 0 && x < w - 1) b.classList.add('br');
          if ((y + 1) % 5 === 0 && y < hh - 1) b.classList.add('bb');
          cells[y].push(b);
          board.appendChild(b);
        }
      }
      paintAll();
    }
    function paint(y, x) {
      var b = cells[y][x], v = cur[y][x];
      b.classList.toggle('on', v === 1); b.classList.toggle('x', v === 2);
      b.setAttribute('aria-pressed', v === 1 ? 'true' : 'false');
      b.textContent = v === 2 ? '✗' : '';
    }
    function paintAll() {
      for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) paint(y, x);
      for (var y2 = 0; y2 < hh; y2++) { var rc = board.querySelector('[data-r="' + y2 + '"]'); if (rc) rc.classList.toggle('ok', lineOk(pz.rows[y2], cur[y2])); }
      for (var c2 = 0; c2 < w; c2++) {
        var col = []; for (var y3 = 0; y3 < hh; y3++) col.push(cur[y3][c2]);
        var cc = board.querySelector('[data-c="' + c2 + '"]'); if (cc) cc.classList.toggle('ok', lineOk(pz.cols[c2], col));
      }
    }
    function solved() {
      for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) if ((cur[y][x] === 1) !== (pz.solution[y][x] === 1)) return false;
      return true;
    }
    function after() {
      paintAll();
      if (solved()) {
        board.classList.add('solved');
        board.style.setProperty('--pic', pz.color);
        win(g, E.puzzleStars(g.hints, g.mistakes), { pic: pz.id, title: T('¡' + pz.name[0] + '!', pz.name[1] + '!'), note: T('Encontraste el dibujo «' + pz.name[0] + '».', 'You found the picture "' + pz.name[1] + '".') });
      }
    }
    // tap or drag to paint: the first cell decides what the drag does
    var dragVal = null, last = null;
    function cellAt(ev) {
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      return el && el.classList && el.classList.contains('lg-nono-cell') && board.contains(el) ? el : null;
    }
    function apply(el) {
      var y = +el.getAttribute('data-y'), x = +el.getAttribute('data-x');
      if (last === el) return;
      last = el;
      if (cur[y][x] === dragVal) return;
      cur[y][x] = dragVal; paint(y, x);
    }
    board.addEventListener('pointerdown', function (ev) {
      var el = cellAt(ev); if (!el || g.done) return;
      ev.preventDefault();
      var y = +el.getAttribute('data-y'), x = +el.getAttribute('data-x');
      dragVal = cur[y][x] === mode ? 0 : mode;
      last = null; apply(el); sfx('click');
    });
    board.addEventListener('pointermove', function (ev) { if (dragVal === null) return; var el = cellAt(ev); if (el) apply(el); });
    function end() { if (dragVal === null) return; dragVal = null; last = null; after(); }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    board.addEventListener('click', function (ev) {        // keyboard (Enter / Space) without a pointer
      if (ev.detail !== 0) return;
      var el = ev.target.closest && ev.target.closest('.lg-nono-cell'); if (!el || g.done) return;
      var y = +el.getAttribute('data-y'), x = +el.getAttribute('data-x');
      cur[y][x] = cur[y][x] === mode ? 0 : mode; paint(y, x); after();
    });
    g.stage.appendChild(modes); g.stage.appendChild(h('div', { class: 'lg-nono-wrap' }, [board]));
    g.check = function () {
      var bad = 0;
      for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) {
        var wrongCell = (cur[y][x] === 1 && !pz.solution[y][x]) || (cur[y][x] === 2 && pz.solution[y][x]);
        cells[y][x].classList.toggle('wrong', wrongCell);
        if (wrongCell) bad++;
      }
      if (bad) { g.mistakes++; sfx('wrong'); say(g, T(bad + (bad === 1 ? ' cuadro no calza' : ' cuadros no calzan') + ' (en rojo).', bad + (bad === 1 ? ' square doesn’t fit' : ' squares don’t fit') + ' (in red).'), 'warn'); }
      else say(g, T('Todo bien hasta ahora.', 'All good so far.'), 'ok');
    };
    g.hint = function () {
      var hi = E.nonoHint(pz, cur);
      if (!hi) return;
      var n = 0;
      if (hi.kind === 'row') for (var x = 0; x < w; x++) { var v = pz.solution[hi.i][x] ? 1 : 2; if (cur[hi.i][x] !== v) { cur[hi.i][x] = v; n++; } }
      else for (var y = 0; y < hh; y++) { var v2 = pz.solution[y][hi.i] ? 1 : 2; if (cur[y][hi.i] !== v2) { cur[y][hi.i] = v2; n++; } }
      say(g, hi.kind === 'row' ? T('Mira la fila ' + (hi.i + 1) + ': así queda.', 'Look at row ' + (hi.i + 1) + ': this is how it goes.') : T('Mira la columna ' + (hi.i + 1) + ': así queda.', 'Look at column ' + (hi.i + 1) + ': this is how it goes.'), 'hint');
      for (var a = 0; a < hh; a++) for (var b2 = 0; b2 < w; b2++) cells[a][b2].classList.remove('wrong');
      after();
    };
    g.reset = function () { for (var y = 0; y < hh; y++) cur[y].fill(0); say(g, ''); for (var a = 0; a < hh; a++) for (var b2 = 0; b2 < w; b2++) cells[a][b2].classList.remove('wrong'); paintAll(); };
    g._t = { pz: pz, set: function (y, x, v) { cur[y][x] = v; after(); }, solve: function () { for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) cur[y][x] = pz.solution[y][x] ? 1 : 0; after(); } };
    build();
  }

  // ---------------------------------------------------------------
  // Logic grids
  // ---------------------------------------------------------------
  function playGrid(g) {
    var pz = E.gridMake(g.L.lv, g.seed), n = pz.n, m = pz.cats.length;
    var marks = pz.cats.map(function () { return range2(n, n); });     // 0 blank, 1 ✗, 2 ✓ (auto ✗ = 3)
    var hist = [];
    function range2(a, b) { var o = []; for (var i = 0; i < a; i++) o.push(new Array(b).fill(0)); return o; }
    var es = lang1() === 'es';
    var catNames = pz.cats.map(function (c) { return D.GRID_CATS[c.id].label; });
    g.intro.appendChild(sayP('lg-txt', m === 1 ? 'Cada niño tiene una mascota distinta. Lee las pistas y marca la tabla: ✓ sí, ✗ no.' : 'Cada niño tiene una cosa distinta de cada tipo. Lee las pistas y marca las tablas: ✓ sí, ✗ no.',
      m === 1 ? 'Each kid has a different pet. Read the clues and mark the grid: ✓ yes, ✗ no.' : 'Each kid has a different thing of each kind. Read the clues and mark the grids: ✓ yes, ✗ no.'));
    var clues = h('ol', { class: 'lg-clues', 'aria-label': T('Pistas', 'Clues') });
    pz.clues.forEach(function (cl, i) {
      var es1 = E.gridClueText(pz, cl, 'es'), en1 = E.gridClueText(pz, cl, 'en');
      var li = h('li', { class: 'lg-clue', 'data-speak': es ? es1 : en1 }, [
        h('button', { type: 'button', class: 'lg-clue-btn', 'aria-pressed': 'false', title: T('Tócala para tacharla cuando la uses', 'Tap to cross it out once used'),
          onclick: function () { var on = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', on ? 'true' : 'false'); } }, [both() ? es1 + ' · ' + en1 : (es ? es1 : en1)])
      ]);
      clues.appendChild(li);
    });
    g.stage.appendChild(clues);
    var tables = h('div', { class: 'lg-gtables' });
    g.stage.appendChild(tables);
    var pics = g.L.lv === 0;
    function draw() {
      clear(tables);
      pz.cats.forEach(function (cat, c) {
        var t = h('table', { class: 'lg-gtable' + (pics ? ' pics' : ''), 'aria-label': P(catNames[c]) });
        var head = h('tr', {}, [h('th', { class: 'lg-g-corner', text: P(catNames[c]) })]);
        cat.items.forEach(function (it) {
          head.appendChild(h('th', { scope: 'col', class: 'lg-g-col' }, [h('span', { class: 'lg-g-ico', html: Art.item(it.id, pics ? 40 : 28) }), h('span', { class: 'lg-g-name', text: P(it.s) })]));
        });
        t.appendChild(h('thead', {}, [head]));
        var tb = h('tbody');
        pz.people.forEach(function (pn, p) {
          var tr = h('tr', {}, [h('th', { scope: 'row', class: 'lg-g-who', text: pn })]);
          cat.items.forEach(function (it, i) {
            var v = marks[c][p][i];
            var b = h('button', { type: 'button', class: 'lg-g-cell v' + v, 'data-c': c, 'data-p': p, 'data-i': i,
              'aria-label': pn + ' · ' + P(it.s) + ': ' + (v === 2 ? T('sí', 'yes') : v ? T('no', 'no') : T('sin marcar', 'blank')),
              text: v === 2 ? '✓' : v ? '✗' : '' });
            b.addEventListener('click', function () { tap(c, p, i); });
            tr.appendChild(h('td', {}, [b]));
          });
          tb.appendChild(tr);
        });
        t.appendChild(tb);
        tables.appendChild(t);
      });
    }
    function snapshot() { return JSON.stringify(marks); }
    function setYes(c, p, i) {
      for (var q = 0; q < n; q++) { if (q !== i && !marks[c][p][q]) marks[c][p][q] = 3; if (q !== p && !marks[c][q][i]) marks[c][q][i] = 3; }
      marks[c][p][i] = 2;
    }
    function clearAuto(c) { for (var p = 0; p < n; p++) for (var i = 0; i < n; i++) if (marks[c][p][i] === 3) marks[c][p][i] = 0; for (var p2 = 0; p2 < n; p2++) for (var i2 = 0; i2 < n; i2++) if (marks[c][p2][i2] === 2) setYes(c, p2, i2); }
    function tap(c, p, i) {
      if (g.done) return;
      hist.push(snapshot());
      var v = marks[c][p][i];
      if (v === 0 || v === 3) marks[c][p][i] = v === 3 ? 2 : 1;
      else if (v === 1) marks[c][p][i] = 2;
      else marks[c][p][i] = 0;
      if (marks[c][p][i] === 2) setYes(c, p, i); else clearAuto(c);
      sfx('click');
      draw(); done();
    }
    function done() {
      for (var c = 0; c < m; c++) for (var p = 0; p < n; p++) if (marks[c][p].indexOf(2) < 0) return;
      for (var c2 = 0; c2 < m; c2++) for (var p2 = 0; p2 < n; p2++) if (marks[c2][p2].indexOf(2) !== pz.solution[c2][p2]) {
        say(g, T('La tabla está completa, pero alguna pista no se cumple. Revisa con «Comprobar».', 'The grid is full, but some clue is not met. Use "Check".'), 'warn');
        return;
      }
      win(g, E.puzzleStars(g.hints, g.mistakes), { note: pz.people.map(function (pn, p) { return pn + ': ' + pz.cats.map(function (cat, c) { return P(cat.items[pz.solution[c][p]].s); }).join(', '); }).join(' · ') });
    }
    g.check = function () {
      var bad = 0;
      tables.querySelectorAll('.lg-g-cell').forEach(function (b) {
        var c = +b.getAttribute('data-c'), p = +b.getAttribute('data-p'), i = +b.getAttribute('data-i'), v = marks[c][p][i], yes = pz.solution[c][p] === i;
        var w = (v === 2 && !yes) || ((v === 1 || v === 3) && yes);
        b.classList.toggle('wrong', w); if (w) bad++;
      });
      if (bad) { g.mistakes++; sfx('wrong'); say(g, T(bad + (bad === 1 ? ' marca no calza' : ' marcas no calzan') + ' (en rojo).', bad + (bad === 1 ? ' mark doesn’t fit' : ' marks don’t fit') + ' (in red).'), 'warn'); }
      else say(g, T('Todo bien hasta ahora.', 'All good so far.'), 'ok');
    };
    g.hint = function () {
      hist.push(snapshot());
      // first clear a wrong mark, else reveal one ✓
      for (var c = 0; c < m; c++) for (var p = 0; p < n; p++) for (var i = 0; i < n; i++) {
        var v = marks[c][p][i], yes = pz.solution[c][p] === i;
        if ((v === 2 && !yes) || (v === 1 && yes)) {
          marks[c][p][i] = 0; clearAuto(c); draw();
          say(g, T('Esta marca no calzaba y la borré: ' + pz.people[p] + ' · ' + P(pz.cats[c].items[i].s) + '.', 'That mark didn’t fit, so I cleared it: ' + pz.people[p] + ' · ' + P(pz.cats[c].items[i].s) + '.'), 'hint');
          return;
        }
      }
      for (var c2 = 0; c2 < m; c2++) for (var p2 = 0; p2 < n; p2++) if (marks[c2][p2][pz.solution[c2][p2]] !== 2) {
        var it = pz.cats[c2].items[pz.solution[c2][p2]];
        setYes(c2, p2, pz.solution[c2][p2]); draw();
        say(g, T(pz.people[p2] + ' → ' + P(it.s) + '.', pz.people[p2] + ' → ' + P(it.s) + '.'), 'hint');
        done();
        return;
      }
    };
    g.undo = function () { if (!hist.length) return; marks = JSON.parse(hist.pop()); draw(); };
    g.reset = function () { hist.push(snapshot()); marks = pz.cats.map(function () { return range2(n, n); }); say(g, ''); draw(); };
    g._t = { pz: pz, tap: tap, solve: function () { for (var c = 0; c < m; c++) for (var p = 0; p < n; p++) setYes(c, p, pz.solution[c][p]); draw(); done(); } };
    draw();
  }

  // ---------------------------------------------------------------
  // Rounds of questions (patterns, balance scales, clear thinking)
  // ---------------------------------------------------------------
  // items: [{ render(into), choices: [{html|text, label}], answer, why? }]
  function runRound(g, items, opts) {
    var i = 0, right = 0, locked = false, used = 0;
    var box = h('div', { class: 'lg-round' });
    var prog = h('div', { class: 'lg-prog', 'aria-hidden': 'true' });
    g.stage.appendChild(prog); g.stage.appendChild(box);
    function dots() {
      clear(prog);
      items.forEach(function (it, k) { prog.appendChild(h('span', { class: 'lg-dot' + (k < i ? (it._ok ? ' ok' : ' no') : k === i ? ' cur' : '') })); });
    }
    function show() {
      locked = false; used = 0;
      dots(); clear(box); say(g, '');
      var it = items[i];
      var q = h('div', { class: 'lg-q-wrap' });
      it.render(q);
      box.appendChild(q);
      var opts2 = h('div', { class: 'lg-opts' + (it.wide ? ' wide' : '') + (it.pics ? ' pics' : '') });
      it.choices.forEach(function (ch, k) {
        var b = h('button', { type: 'button', class: 'lg-opt', 'data-k': k, 'aria-label': ch.label || null }, []);
        if (ch.html) b.innerHTML = ch.html; else b.textContent = ch.text;
        b.addEventListener('click', function () { answer(k, b); });
        opts2.appendChild(b);
      });
      box.appendChild(opts2);
      scanSpeak();
    }
    function answer(k, b) {
      if (locked || g.done) return;
      locked = true;
      var it = items[i], ok = k === it.answer;
      it._ok = ok;
      if (ok) right += used ? 0.5 : 1;
      box.querySelectorAll('.lg-opt').forEach(function (x, j) { x.disabled = true; if (j === it.answer) x.classList.add('right'); });
      if (!ok) { b.classList.add('wrongp'); sfx('wrong'); } else sfx('correct');
      var why = it.why ? (typeof it.why === 'function' ? it.why() : it.why) : '';
      say(g, (ok ? T('¡Bien! ', 'Right! ') : T('No era esa. ', 'Not that one. ')) + why, ok ? 'ok' : 'warn');
      var last = i === items.length - 1;
      box.appendChild(h('div', { class: 'lg-next-row' }, [h('button', { type: 'button', class: 'lg-btn lg-primary', id: 'lg-q-next', onclick: function () {
        if (last) finish(); else { i++; show(); }
      } }, [last ? T('Ver resultado', 'See result') : T('Siguiente', 'Next')])]));
    }
    function finish() {
      dots(); clear(box);
      var stars = E.roundStars(right, items.length);
      var note = T(Math.floor(right) + ' de ' + items.length + ' correctas.', Math.floor(right) + ' of ' + items.length + ' right.');
      if (stars < 1) {
        say(g, note + ' ' + T('Inténtalo otra vez: cada vuelta trae preguntas nuevas.', 'Try again: every round has new questions.'), 'warn');
        box.appendChild(h('div', { class: 'lg-next-row' }, [h('button', { type: 'button', class: 'lg-btn lg-primary', onclick: function () { play(g.level, g.daily ? { daily: true, seed: g.seed } : null); } }, [T('Otra vuelta', 'Another round')])]));
        return;
      }
      win(g, stars, { note: note });
    }
    g.hint = function () {
      if (locked) return;
      var it = items[i], btns = box.querySelectorAll('.lg-opt:not(:disabled)');
      for (var k = 0; k < btns.length; k++) {
        var kk = +btns[k].getAttribute('data-k');
        if (kk !== it.answer) { btns[k].disabled = true; btns[k].classList.add('out'); used++; break; }
      }
      say(g, it.hint ? it.hint() : T('Quité una opción que no es.', 'I took away one choice that isn’t it.'), 'hint');
    };
    g._t = { items: items, answer: function (k) { var b = box.querySelector('.lg-opt[data-k="' + k + '"]'); if (b) answer(k, b); }, next: function () { var b = document.getElementById('lg-q-next'); if (b) b.click(); } };
    show();
  }

  // Patterns
  function tokHtml(t, size) { return Art.shape(t.s, t.c, size || 34, Art.shapeName(t.s, t.c, lang1())); }
  function playPattern(g) {
    var lv = g.L.lv, qs = E.patternRound(lv, g.seed, 6);
    g.intro.appendChild(sayP('lg-txt', '¿Qué viene después? Busca la regla.', 'What comes next? Look for the rule.'));
    var items = qs.map(function (q) {
      if (q.kind === 'pic') return {
        pics: true,
        render: function (into) {
          into.appendChild(sayP('lg-q', '¿Qué figura sigue?', 'Which shape comes next?'));
          var row = h('div', { class: 'lg-seq' });
          q.seq.forEach(function (t) { row.appendChild(h('span', { class: 'lg-seq-it', html: tokHtml(t, 34) })); });
          row.appendChild(h('span', { class: 'lg-seq-it q', text: '?' }));
          into.appendChild(row);
        },
        choices: q.choices.map(function (t) { return { html: tokHtml(t, 44), label: Art.shapeName(t.s, t.c, lang1()) }; }),
        answer: q.answer,
        why: T('La serie se repite: ' + q.unit.split('').join(' ') + '.', 'The pattern repeats: ' + q.unit.split('').join(' ') + '.')
      };
      if (q.kind === 'num') return {
        render: function (into) {
          into.appendChild(h('p', { class: 'lg-q', 'data-speak': (lang1() === 'es' ? '¿Qué número sigue? ' : 'Which number comes next? ') + q.seq.join(', '), text: T('¿Qué número sigue?', 'Which number comes next?') }));
          var row = h('div', { class: 'lg-seq nums' });
          q.seq.forEach(function (v) { row.appendChild(h('span', { class: 'lg-seq-n', text: String(v) })); });
          row.appendChild(h('span', { class: 'lg-seq-n q', text: '?' }));
          into.appendChild(row);
        },
        choices: q.choices.map(function (v) { return { text: String(v) }; }),
        answer: q.answer,
        hint: function () { return ruleHint(q); },
        why: ruleWhy(q)
      };
      return {
        wide: true, pics: true,
        render: function (into) {
          into.appendChild(sayP('lg-q', '¿Qué va en el cuadro vacío? Mira las filas y las columnas.', 'What goes in the empty square? Look at the rows and the columns.'));
          var m = h('div', { class: 'lg-mat' });
          q.cells.forEach(function (c) { m.appendChild(h('span', { class: 'lg-mat-c', html: matCell(c, 22) })); });
          m.appendChild(h('span', { class: 'lg-mat-c q', text: '?' }));
          into.appendChild(m);
        },
        choices: q.choices.map(function (c) { return { html: matCell(c, 20), label: c.n + ' × ' + Art.shapeName(c.s, c.c, lang1()) }; }),
        answer: q.answer,
        hint: function () { return T('En cada fila hay una figura de cada forma, y en cada columna un color de cada uno.', 'Each row has one of each shape, and each column has one of each colour.'); },
        why: T('Cada fila tiene las tres formas, cada columna los tres colores, y hay 1, 2 y 3 figuras.', 'Each row has all three shapes, each column all three colours, and there are 1, 2 and 3 shapes.')
      };
    });
    runRound(g, items);
  }
  function matCell(c, size) { var s = ''; for (var i = 0; i < c.n; i++) s += Art.shape(c.s, c.c, size); return '<span class="lg-mat-in">' + s + '</span>'; }
  function ruleWhy(q) {
    var s = q.seq, d = s[1] - s[0];
    switch (q.rule) {
      case 'arith': return T('Cada número suma ' + d + '.', 'Each number adds ' + d + '.');
      case 'down': return T('Cada número resta ' + (-d) + '.', 'Each number takes away ' + (-d) + '.');
      case 'geom': return T('Cada número se multiplica por ' + (s[1] / s[0]) + '.', 'Each number is multiplied by ' + (s[1] / s[0]) + '.');
      case 'alt': return T('Se suma ' + (s[1] - s[0]) + ', luego ' + (s[2] - s[1]) + ', y se repite.', 'Add ' + (s[1] - s[0]) + ', then ' + (s[2] - s[1]) + ', and repeat.');
      case 'quad': return T('Son números al cuadrado: ' + s.map(function (v) { return Math.round(Math.sqrt(v)) + '×' + Math.round(Math.sqrt(v)); }).join(', ') + '.', 'They are square numbers: ' + s.map(function (v) { return Math.round(Math.sqrt(v)) + '×' + Math.round(Math.sqrt(v)); }).join(', ') + '.');
      case 'fib': return T('Cada número es la suma de los dos anteriores.', 'Each number is the sum of the two before it.');
    }
    return '';
  }
  function ruleHint(q) {
    var s = q.seq, diffs = [];
    for (var i = 1; i < s.length; i++) diffs.push(s[i] - s[i - 1]);
    return T('Mira cuánto cambia de un número al siguiente: ', 'Look at how much it changes from one number to the next: ') + diffs.map(function (d) { return (d > 0 ? '+' : '') + d; }).join(', ') + '.';
  }

  // The balance
  function objUn(id) { var o = D.BAL_OBJECTS.filter(function (b) { return b.id === id; })[0]; return o && o.un ? o.un : 'un'; }
  function objName(id) { var o = D.BAL_OBJECTS.filter(function (b) { return b.id === id; })[0]; return o ? o.n : [id, id]; }
  function scaleLabel(sc) {
    function side(s) {
      var parts = [];
      var cnt = {}; (s.o || []).forEach(function (o) { cnt[o] = (cnt[o] || 0) + 1; });
      for (var k in cnt) parts.push(cnt[k] + ' ' + P1(objName(k)));
      if (s.b) parts.push(s.b + ' ' + (lang1() === 'es' ? (s.b === 1 ? 'bloque' : 'bloques') : (s.b === 1 ? 'block' : 'blocks')));
      return parts.join(' + ');
    }
    var rel = sc.tilt === -1 ? (lang1() === 'es' ? ' pesa más que ' : ' is heavier than ') : sc.tilt === 1 ? (lang1() === 'es' ? ' pesa menos que ' : ' is lighter than ') : ' = ';
    return side(sc.left) + rel + side(sc.right);
  }
  function playBalance(g) {
    if (g.L.coins != null) return playCoins(g);
    var lv = g.L.lv, items = [];
    for (var k = 0; k < 4; k++) items.push(E.balMake(lv, (g.seed + k * 101) >>> 0));
    g.intro.appendChild(lv === 0
      ? sayP('lg-txt', 'El lado que baja es el que pesa más.', 'The side that goes down is the heavier one.')
      : sayP('lg-txt', 'Las balanzas están en equilibrio: los dos lados pesan lo mismo. Todas las frutas iguales pesan lo mismo.', 'These scales balance: both sides weigh the same. Fruits of the same kind weigh the same.'));
    runRound(g, items.map(function (b) {
      if (b.kind === 'order') return {
        pics: true,
        render: function (into) {
          var row = h('div', { class: 'lg-scales' });
          b.scales.forEach(function (sc) { row.appendChild(h('div', { class: 'lg-scale', html: Art.scale(sc, 230, scaleLabel(sc)) })); });
          into.appendChild(row);
          into.appendChild(sayP('lg-q', '¿Cuál pesa más de todas?', 'Which one is the heaviest of all?'));
        },
        choices: b.choices.map(function (o) { return { html: Art.fruit(o, 46) + '<span>' + P(objName(o)) + '</span>', label: P1(objName(o)) }; }),
        answer: b.choices.indexOf(b.answer),
        hint: function () { return T('Busca la fruta que nunca queda arriba.', 'Look for the fruit that is never on the high side.'); },
        why: T(P(objName(b.objs[2])) + ' pesa más que ' + P(objName(b.objs[1])) + ', y ' + P(objName(b.objs[1])) + ' más que ' + P(objName(b.objs[0])) + '.',
               'The ' + P(objName(b.objs[2])) + ' is heavier than the ' + P(objName(b.objs[1])) + ', and the ' + P(objName(b.objs[1])) + ' is heavier than the ' + P(objName(b.objs[0])) + '.')
      };
      var ask = objName(b.ask);
      return {
        render: function (into) {
          var row = h('div', { class: 'lg-scales' });
          b.scales.forEach(function (sc) { row.appendChild(h('div', { class: 'lg-scale', html: Art.scale(sc, 230, scaleLabel(sc)) })); });
          into.appendChild(row);
          into.appendChild(h('div', { class: 'lg-q-row' }, [h('span', { class: 'lg-q-ico', html: Art.fruit(b.ask, 40) }),
            sayP('lg-q', '¿Cuántos bloques pesa ' + objUn(b.ask) + ' ' + ask[0] + '?', 'How many blocks does one ' + ask[1] + ' weigh?')]));
        },
        choices: b.choices.map(function (v) { return { text: String(v) }; }),
        answer: b.choices.indexOf(b.answer),
        hint: function () { return T('Empieza por la balanza que tiene una sola clase de fruta. Si sacas lo mismo de los dos lados, sigue en equilibrio.', 'Start with the scale that has only one kind of fruit. If you take the same thing off both sides, it still balances.'); },
        why: T(b.objs.map(function (o) { return '1 ' + objName(o)[0] + ' = ' + b.weights[o]; }).join(' · '), b.objs.map(function (o) { return '1 ' + objName(o)[1] + ' = ' + b.weights[o]; }).join(' · '))
      };
    }));
  }

  // The fake coin
  function playCoins(g) {
    var st = E.coinsNew(g.L.coins), place = [], r = E.rng(g.seed), guessing = false;
    var n = st.n;
    for (var i = 0; i < n; i++) place.push(0);      // 0 table, 1 left pan, 2 right pan
    g.intro.appendChild(st.either
      ? sayP('lg-txt', 'Una de las ' + n + ' monedas es falsa: pesa distinto (puede ser más o menos). Tienes ' + st.weighings + ' pesadas para encontrarla.', 'One of the ' + n + ' coins is fake: it weighs a little different (more or less). You have ' + st.weighings + ' weighings to find it.')
      : sayP('lg-txt', 'Una de las ' + n + ' monedas es falsa y pesa un poco más. Tienes ' + st.weighings + (st.weighings === 1 ? ' pesada' : ' pesadas') + ' para encontrarla. ¡Ojo! No basta con tener suerte.', 'One of the ' + n + ' coins is fake and a little heavier. You have ' + st.weighings + (st.weighings === 1 ? ' weighing' : ' weighings') + ' to find it. Careful: luck is not enough.'));
    var scaleBox = h('div', { class: 'lg-coin-scale', id: 'lg-coin-scale' });
    var coinsRow = h('div', { class: 'lg-coins' });
    var info = h('p', { class: 'lg-coin-info', id: 'lg-coin-info' });
    var logEl = h('ol', { class: 'lg-coin-log' });
    var btns = h('div', { class: 'lg-coin-btns' });
    var lastTilt = 0;
    function sides() { var L = [], R = []; place.forEach(function (p, k) { if (p === 1) L.push(k); if (p === 2) R.push(k); }); return { L: L, R: R }; }
    function draw() {
      var s = sides();
      scaleBox.innerHTML = Art.scale({ left: { c: s.L }, right: { c: s.R }, tilt: lastTilt }, 300, T('Balanza', 'Balance'));
      clear(coinsRow);
      for (var k = 0; k < n; k++) (function (kk) {
        var where = place[kk] === 1 ? T('izquierda', 'left') : place[kk] === 2 ? T('derecha', 'right') : T('en la mesa', 'on the table');
        coinsRow.appendChild(h('button', { type: 'button', class: 'lg-coin p' + place[kk] + (guessing ? ' pick' : ''), 'data-coin': kk, 'aria-label': T('Moneda ', 'Coin ') + (kk + 1) + ': ' + (guessing ? T('¿es esta?', 'is it this one?') : where),
          html: Art.coin(kk + 1, 40) + (guessing ? '' : '<span class="lg-coin-where">' + (place[kk] === 1 ? '◀' : place[kk] === 2 ? '▶' : '') + '</span>'),
          onclick: function () { tapCoin(kk); } }));
      })(k);
      info.textContent = guessing ? T('¿Cuál es la moneda falsa? Tócala.', 'Which coin is fake? Tap it.')
        : T('Toca una moneda para ponerla a la izquierda, a la derecha o de vuelta en la mesa. Pesadas: ' + st.log.length + ' de ' + st.weighings + '.', 'Tap a coin to put it on the left, on the right, or back on the table. Weighings: ' + st.log.length + ' of ' + st.weighings + '.');
      clear(btns);
      if (!guessing) {
        btns.appendChild(h('button', { type: 'button', class: 'lg-btn lg-primary', id: 'lg-weigh', disabled: st.log.length >= st.weighings ? true : null, onclick: weigh }, ['⚖ ' + T('Pesar', 'Weigh')]));
        btns.appendChild(h('button', { type: 'button', class: 'lg-btn', id: 'lg-guess', onclick: function () { guessing = true; draw(); } }, ['🔍 ' + T('Ya sé cuál es', 'I know which one')]));
      } else btns.appendChild(h('button', { type: 'button', class: 'lg-btn', onclick: function () { guessing = false; draw(); } }, [T('Volver a pesar', 'Back to weighing')]));
    }
    function tapCoin(k) {
      if (g.done) return;
      if (guessing) return guess(k);
      place[k] = (place[k] + 1) % 3; lastTilt = 0; sfx('click'); draw();
    }
    function weigh() {
      var s = sides();
      var res = E.coinsWeigh(st, s.L, s.R, r);
      if (res.error === 'equal') { say(g, T('Pon la misma cantidad de monedas en cada lado (al menos una).', 'Put the same number of coins on each side (at least one).'), 'warn'); return; }
      if (res.error) return;
      lastTilt = res.out === 'L' ? -1 : res.out === 'R' ? 1 : 0;
      sfx('click');
      logEl.appendChild(h('li', { text: (s.L.map(function (c) { return c + 1; }).join(' ')) + '  ⚖  ' + (s.R.map(function (c) { return c + 1; }).join(' ')) + '  →  ' +
        (res.out === 'L' ? T('baja la izquierda', 'left goes down') : res.out === 'R' ? T('baja la derecha', 'right goes down') : T('en equilibrio', 'balanced')) }));
      say(g, res.out === '=' ? T('¡En equilibrio! Las monedas de la balanza pesan lo mismo.', 'Balanced! The coins on the scale weigh the same.') : T('Bajó un lado.', 'One side went down.'), 'ok');
      if (st.log.length >= st.weighings) guessing = true;
      draw();
    }
    function guess(k) {
      var res = E.coinsGuess(st, k);
      if (res.ok) {
        win(g, E.puzzleStars(g.hints, g.mistakes), { note: T('¡Era la moneda ' + (k + 1) + '!', 'It was coin ' + (k + 1) + '!') });
        draw();
        return;
      }
      g.mistakes++;
      sfx('wrong');
      say(g, T('Todavía no se podía saber: podía ser ' + res.could.map(function (c) { return c + 1; }).join(', ') + '. Esta vez era la ' + (res.coin + 1) + '. Prueba otra estrategia.',
               'You couldn’t know yet: it could be ' + res.could.map(function (c) { return c + 1; }).join(', ') + '. This time it was coin ' + (res.coin + 1) + '. Try another plan.'), 'warn');
      restart();
    }
    function restart() { st = E.coinsNew(g.L.coins); for (var i2 = 0; i2 < n; i2++) place[i2] = 0; guessing = false; lastTilt = 0; clear(logEl); draw(); }
    g.stage.appendChild(scaleBox); g.stage.appendChild(info); g.stage.appendChild(coinsRow); g.stage.appendChild(btns); g.stage.appendChild(logEl);
    var HINTS = {
      0: ['Pon una moneda en cada lado. Si quedan en equilibrio, ¿cuál es la falsa?', 'Put one coin on each side. If they balance, which one is fake?'],
      1: ['Haz tres grupos de tres. Pesa dos grupos: así sabes en qué grupo está.', 'Make three groups of three. Weigh two groups: then you know which group it is in.'],
      2: ['Pesa 3 contra 3 y deja 2 en la mesa.', 'Weigh 3 against 3 and leave 2 on the table.'],
      3: ['Pesa 4 contra 4 y deja 4 en la mesa. Anota qué lado bajó: eso dice si la falsa pesa más o menos.', 'Weigh 4 against 4 and leave 4 on the table. Note which side went down: that tells you whether the fake is heavier or lighter.']
    };
    g.hint = function () { say(g, P(HINTS[g.L.coins]), 'hint'); };
    g.reset = function () { restart(); say(g, ''); };
    g._t = { st: function () { return st; }, place: function (L, R) { for (var i3 = 0; i3 < n; i3++) place[i3] = L.indexOf(i3) >= 0 ? 1 : R.indexOf(i3) >= 0 ? 2 : 0; draw(); }, weigh: weigh, guess: function (k) { guessing = true; guess(k); } };
    draw();
  }

  // ---------------------------------------------------------------
  // River crossings
  // ---------------------------------------------------------------
  var CROSS_NAMES = {
    farmer: ['el granjero', 'the farmer'], fox: ['el zorro', 'the fox'], hen: ['la gallina', 'the hen'], corn: ['el maíz', 'the corn'],
    dad: ['papá', 'Dad'], mom: ['mamá', 'Mom'], kid1: ['Tomi', 'Tomi'], kid2: ['Sofi', 'Sofi'],
    hen1: ['gallina 1', 'hen 1'], hen2: ['gallina 2', 'hen 2'], hen3: ['gallina 3', 'hen 3'], fox1: ['zorro 1', 'fox 1'], fox2: ['zorro 2', 'fox 2'], fox3: ['zorro 3', 'fox 3'],
    p1: ['Pía · 1 min', 'Pía · 1 min'], p2: ['Nico · 2 min', 'Nico · 2 min'], p5: ['Tito · 5 min', 'Tito · 5 min'], p10: ['Coni · 10 min', 'Coni · 10 min']
  };
  var RIVER_INTRO = {
    fox: ['Un granjero tiene que cruzar el río con un zorro, una gallina y un saco de maíz. En el bote caben el granjero y una cosa más, y solo él sabe remar. Si los deja solos, el zorro persigue a la gallina, y la gallina se come el maíz.',
          'A farmer must cross the river with a fox, a hen and a sack of corn. The boat holds the farmer and one more thing, and only he can row. Left alone, the fox chases the hen, and the hen eats the corn.'],
    family: ['Papá, mamá, Tomi y Sofi quieren cruzar el lago. El bote aguanta a un adulto solo, o a los dos niños, nada más. Todos saben remar.',
             'Dad, Mom, Tomi and Sofi want to cross the lake. The boat holds one grown-up alone, or the two kids, nothing more. Everyone can row.'],
    bridge: ['Es de noche. Cuatro amigos tienen que cruzar un puente con una sola linterna. Cruzan máximo dos a la vez, siempre con la linterna, y dos juntos van al paso del más lento. ¿Pueden cruzar todos en 17 minutos?',
             'It’s night. Four friends must cross a bridge with one lantern. At most two cross at a time, always with the lantern, and two together go at the slower one’s pace. Can everyone cross in 17 minutes?'],
    hens: ['Tres gallinas y tres zorros cruzan el río en un bote para dos. Si en una orilla hay más zorros que gallinas, las gallinas se asustan. Cualquiera puede remar.',
           'Three hens and three foxes cross the river in a boat for two. If a bank has more foxes than hens, the hens get scared. Anyone can row.']
  };
  var RIVER_WHY = {
    rower: ['Solo el granjero sabe remar.', 'Only the farmer can row.'],
    boat: ['No caben así en el bote.', 'They don’t fit in the boat like that.'],
    boatFamily: ['¡Muy pesado! El bote lleva a un adulto solo, o a los dos niños.', 'Too heavy! The boat takes one grown-up alone, or the two kids.'],
    foxhen: ['¡El zorro perseguiría a la gallina! No pueden quedarse solos.', 'The fox would chase the hen! They can’t be left alone.'],
    hencorn: ['¡La gallina se comería el maíz! No pueden quedarse solos.', 'The hen would eat the corn! They can’t be left alone.'],
    outnumber: ['En una orilla quedarían más zorros que gallinas: ¡las gallinas se asustan!', 'A bank would have more foxes than hens: the hens get scared!'],
    empty: ['Primero sube a alguien al bote.', 'First put someone in the boat.']
  };
  function playRiver(g) {
    var id = g.L.river, P0 = E.RIVERS[id], bridge = !!P0.time;
    var st = E.riverStart(id), aboard = [], hist = [];
    g.intro.appendChild(sayP('lg-txt', RIVER_INTRO[id][0], RIVER_INTRO[id][1]));
    var scene = h('div', { class: 'lg-river' + (bridge ? ' night' : ''), id: 'lg-river' });
    scene.innerHTML = Art.riverScene(bridge ? 'bridge' : 'river');
    var near = h('div', { class: 'lg-bank near', 'aria-label': T('Esta orilla', 'This side') });
    var mid = h('div', { class: 'lg-water' });
    var far = h('div', { class: 'lg-bank far', 'aria-label': T('La otra orilla', 'The other side') });
    var boatEl = h('div', { class: 'lg-boat' });
    var seats = h('div', { class: 'lg-seats', 'aria-label': bridge ? T('En el puente', 'On the bridge') : T('En el bote', 'In the boat') });
    boatEl.appendChild(seats);
    if (!bridge) boatEl.appendChild(h('div', { class: 'lg-boat-art', html: Art.boat(130) }));
    mid.appendChild(boatEl);
    var lay = h('div', { class: 'lg-river-lay' }, [near, mid, far]);
    scene.appendChild(lay);
    var status = h('div', { class: 'lg-river-status' });
    var goBtn = h('button', { type: 'button', class: 'lg-btn lg-primary', id: 'lg-cross', onclick: cross }, [bridge ? '🔦 ' + T('Cruzar el puente', 'Cross the bridge') : '⛵ ' + T('Cruzar', 'Cross')]);
    g.stage.appendChild(scene);
    g.stage.appendChild(h('div', { class: 'lg-river-bar' }, [status, goBtn]));
    function nm(x) { return P(CROSS_NAMES[x]); }
    function charBtn(x, where) {
      return h('button', { type: 'button', class: 'lg-char', 'data-who': x, 'aria-label': nm(x) + ' — ' + where,
        html: Art.crosser(x, 58), onclick: function () { tap(x); } });
    }
    function draw() {
      var banks = E.riverBanks(P0, st);
      clear(near); clear(far); clear(seats);
      banks.near.forEach(function (x) { if (aboard.indexOf(x) < 0) near.appendChild(charBtn(x, T('en esta orilla', 'on this side'))); });
      banks.far.forEach(function (x) { if (aboard.indexOf(x) < 0) far.appendChild(charBtn(x, T('en la otra orilla', 'on the other side'))); });
      aboard.forEach(function (x) { seats.appendChild(charBtn(x, bridge ? T('en el puente', 'on the bridge') : T('en el bote', 'in the boat'))); });
      if (bridge) {
        var lan = h('span', { class: 'lg-lantern', html: Art.lantern(34) });
        (st.boat === 0 ? near : far).appendChild(lan);
      }
      boatEl.classList.toggle('at-far', st.boat === 1);
      status.textContent = bridge ? T('Minutos: ' + st.minutes + ' de 17', 'Minutes: ' + st.minutes + ' of 17') : T('Viajes: ' + st.moves, 'Crossings: ' + st.moves);
    }
    function tap(x) {
      if (g.done) return;
      var i = aboard.indexOf(x);
      if (i >= 0) { aboard.splice(i, 1); sfx('click'); draw(); return; }
      var banks = E.riverBanks(P0, st), side = st.boat === 0 ? banks.near : banks.far;
      if (side.indexOf(x) < 0) { say(g, bridge ? T('La linterna está en la otra orilla.', 'The lantern is on the other side.') : T('El bote está en la otra orilla.', 'The boat is on the other side.'), 'warn'); return; }
      if (aboard.length >= 2) { say(g, bridge ? T('En el puente caben dos a la vez.', 'Two at a time on the bridge.') : T('En el bote caben dos.', 'The boat holds two.'), 'warn'); return; }
      aboard.push(x); sfx('click'); say(g, ''); draw();
    }
    function cross() {
      if (g.done) return;
      var res = E.riverMove(id, st, aboard);
      if (!res.ok) {
        var why = res.why === 'boat' && id === 'family' ? 'boatFamily' : res.why;
        if (res.state) { g.mistakes++; sfx('wrong'); }
        say(g, P(RIVER_WHY[why] || RIVER_WHY.boat), 'warn');
        return;
      }
      hist.push(JSON.stringify(st));
      st = res.state; aboard = [];
      sfx('click');
      draw();
      if (E.riverDone(id, st)) {
        var stars = E.riverStars(id, st, g.hints), min = bridge ? 17 : E.riverSolve(id).cost;
        var note = bridge ? T('Cruzaron en ' + st.minutes + ' minutos.', 'Everyone crossed in ' + st.minutes + ' minutes.') + (st.minutes > 17 ? ' ' + T('¿Puedes hacerlo en 17?', 'Can you do it in 17?') : '')
                          : T('Lo lograste en ' + st.moves + ' viajes.', 'You did it in ' + st.moves + ' crossings.') + (st.moves > min ? ' ' + T('Se puede en ' + min + '.', 'It can be done in ' + min + '.') : ' ' + T('¡La menor cantidad posible!', 'The fewest possible!'));
        win(g, stars, { note: note });
      } else if (bridge && st.minutes > 17) say(g, T('Ya van más de 17 minutos. Puedes terminar, o empezar de nuevo para hacerlo más rápido.', 'That’s over 17 minutes. You can finish, or start over to do it faster.'), 'warn');
    }
    g.hint = function () {
      var sol = E.riverSolve(id, st);
      if (!sol || !sol.path.length) return;
      aboard = sol.path[0].slice();
      draw();
      say(g, T('Prueba con: ', 'Try: ') + aboard.map(nm).join(' + ') + '.', 'hint');
    };
    g.undo = function () { if (!hist.length) return; st = JSON.parse(hist.pop()); aboard = []; say(g, ''); draw(); };
    g.reset = function () { st = E.riverStart(id); aboard = []; hist = []; say(g, ''); draw(); };
    g.fresh = false;
    g._t = { st: function () { return st; }, go: function (group) { aboard = group.slice(); cross(); } };
    draw();
  }

  // ---------------------------------------------------------------
  // Truth or fib (knights and knaves)
  // ---------------------------------------------------------------
  function playKnights(g) {
    var pz = E.kkMake(g.L.lv, g.seed), n = pz.n, pickd = new Array(n).fill(-1), locked = {};
    g.intro.appendChild(sayP('lg-txt', 'En esta isla, unos siempre dicen la verdad y otros siempre mienten. Lee lo que dice cada uno y decide quién es quién.',
      'On this island, some people always tell the truth and the others always lie. Read what each one says and decide who is who.'));
    var wrap = h('div', { class: 'lg-isle' });
    g.stage.appendChild(wrap);
    function draw() {
      clear(wrap);
      pz.statements.forEach(function (stm) {
        var i = stm.s, es1 = E.kkText(pz, stm, 'es'), en1 = E.kkText(pz, stm, 'en');
        var card = h('div', { class: 'lg-isl' + (locked[i] ? ' locked' : ''), 'data-i': i }, [
          h('div', { class: 'lg-isl-art', html: Art.islander(D.ISLANDERS.indexOf(pz.names[i]), 92) }),
          h('div', { class: 'lg-isl-body' }, [
            h('div', { class: 'lg-isl-name', text: pz.names[i] + T(' dice:', ' says:') }),
            h('blockquote', { class: 'lg-bubble', 'data-speak': pz.names[i] + (lang1() === 'es' ? ' dice: ' : ' says: ') + (lang1() === 'es' ? es1 : en1) }, [both() ? es1 + ' · ' + en1 : (lang1() === 'es' ? es1 : en1)]),
            h('div', { class: 'lg-isl-pick', role: 'radiogroup', 'aria-label': pz.names[i] }, [
              h('button', { type: 'button', class: 'lg-btn lg-truth' + (pickd[i] === 1 ? ' on' : ''), role: 'radio', 'aria-checked': pickd[i] === 1 ? 'true' : 'false', 'data-v': 1, disabled: locked[i] ? true : null, onclick: function () { set(i, 1); } }, ['😇 ' + T('Dice la verdad', 'Tells the truth')]),
              h('button', { type: 'button', class: 'lg-btn lg-fib' + (pickd[i] === 0 ? ' on' : ''), role: 'radio', 'aria-checked': pickd[i] === 0 ? 'true' : 'false', 'data-v': 0, disabled: locked[i] ? true : null, onclick: function () { set(i, 0); } }, ['🙃 ' + T('Miente', 'Lies')])
            ])
          ])
        ]);
        wrap.appendChild(card);
      });
      scanSpeak();
    }
    function set(i, v) { if (g.done) return; pickd[i] = v; sfx('click'); say(g, ''); draw(); }
    g.check = function () {
      if (pickd.indexOf(-1) >= 0) { say(g, T('Decide primero para cada uno.', 'Decide for everyone first.'), 'warn'); return; }
      var ok = pickd.every(function (v, i) { return v === pz.solution[i]; });
      if (ok) {
        win(g, E.puzzleStars(g.hints, g.mistakes), { note: pz.names.map(function (nn, i) { return nn + ': ' + (pz.solution[i] ? T('verdad', 'truth') : T('mentira', 'lies')); }).join(' · ') });
        return;
      }
      g.mistakes++; sfx('wrong');
      // find a statement that contradicts the kid's choice, to point at
      var bad = pz.statements.filter(function (stm) { return E.kkTruth(stm, pickd) !== (pickd[stm.s] === 1); })[0];
      if (bad) say(g, T('Algo no calza: si ' + pz.names[bad.s] + (pickd[bad.s] ? ' dice la verdad' : ' miente') + ', ¿lo que dice ' + (pickd[bad.s] ? 'es verdad?' : 'es mentira?'),
                       'Something doesn’t fit: if ' + pz.names[bad.s] + (pickd[bad.s] ? ' tells the truth, is what they say true?' : ' lies, is what they say false?')), 'warn');
      else say(g, T('Así todo calza… pero hay otra forma que también calza. Hmm, revisa otra vez.', 'That fits… but check again.'), 'warn');
    };
    g.hint = function () {
      for (var i = 0; i < n; i++) if (pickd[i] !== pz.solution[i]) {
        pickd[i] = pz.solution[i]; locked[i] = 1; draw();
        say(g, T(pz.names[i] + (pz.solution[i] ? ' dice la verdad.' : ' miente.') + ' Ahora piensa en los demás.', pz.names[i] + (pz.solution[i] ? ' tells the truth.' : ' lies.') + ' Now think about the others.'), 'hint');
        return;
      }
    };
    g.reset = function () { pickd = new Array(n).fill(-1); locked = {}; say(g, ''); draw(); };
    g._t = { pz: pz, set: set };
    draw();
  }

  // ---------------------------------------------------------------
  // Clear thinking
  // ---------------------------------------------------------------
  function playThink(g) {
    var set = g.L.set, qs = E.thinkRound(set, g.seed, 6);
    g.intro.appendChild(set === 'fo'
      ? sayP('lg-txt', 'Un hecho se puede comprobar. Una opinión dice lo que alguien piensa o siente.', 'A fact can be checked. An opinion says what someone thinks or feels.')
      : set === 'need'
        ? sayP('lg-txt', 'Antes de creer algo, piensa: ¿qué tendría que saber para estar seguro?', 'Before believing something, think: what would I need to know to be sure?')
        : sayP('lg-txt', 'Cada razonamiento tiene un paso débil. ¿Cuál es?', 'Each argument has one weak step. Which is it?'));
    runRound(g, qs.map(function (q) {
      return {
        wide: set !== 'fo',
        render: function (into) {
          var lead = set === 'arg' ? ['¿Cuál es el paso débil?', 'What is the weak step?'] : set === 'fo' ? ['¿Hecho u opinión?', 'Fact or opinion?'] : null;
          into.appendChild(h('div', { class: 'lg-think-card' }, [
            h('p', { class: 'lg-q lg-think-q', 'data-speak': P1(q.q), text: P(q.q) }),
            lead ? h('p', { class: 'lg-think-lead', text: P(lead) }) : null
          ]));
        },
        choices: q.o.map(function (o) { return { text: P(o) }; }),
        answer: q.a,
        why: P(q.why)
      };
    }));
  }

  var KINDS = { sudoku: playSudoku, nono: playNono, grid: playGrid, pattern: playPattern, balance: playBalance, river: playRiver, knights: playKnights, think: playThink };

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function init() {
    root = document.getElementById('lg-main');
    if (!root || typeof getActiveUser !== 'function') return;
    user = getActiveUser();
    if (!user) return;
    tier = typeof getAgeTier === 'function' ? getAgeTier(user.age) : 'advanced';
    data = load();
    var m = /[?&]seed=(\d+)/.exec(location.search);
    seedBase = m ? +m[1] : (Date.now() >>> 0);
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.watch) ZsSpeak.watch({ prompt: '.lg-q', group: '.lg-opts', choice: '.lg-opt', lang: lang1() });
    var lv = /[?&]level=([a-z0-9_]+)/.exec(location.search);
    if (lv && E.LEVEL_BY_ID[lv[1]]) play(lv[1]); else showHome();
  }

  var api = {
    init: init, home: showHome, room: showRoom, play: play,
    state: function () { return { view: view.screen, room: view.room, level: view.level, tier: tier, stars: totalStars(), data: data }; },
    game: function () { return game; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  return api;
})();
