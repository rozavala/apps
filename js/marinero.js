/* ================================================================
   MARINERO 🪢 — seamanship for young sailors (ages 6–13)
   The hands-on companion to the parent's "Patrón de Lancha
   Deportiva" study app. Five sections:
     1. Knots (Nudos)         — animated 3-strand rope, tie for real
     2. Compass (Rumbos)      — steer, name points, reciprocals, hunt
     3. Buoys (Boyas)         — IALA Region B marks on the water
     4. Signal flags          — International Code of Signals
     5. Chart work (Carta)    — dividers, latitude scale, time = d / v
   Per-kid progress at zs_marinero_<kid> (one JSON blob):
     { v:1, knots:{id:{w,c,r}}, best:{game:0..3}, hunts:n, last:'YYYY-MM-DD' }
   Graphics: js/marinero-art.js · content: js/marinero-data.js
   ================================================================ */

var Marinero = (function() {
  'use strict';

  var D = MarineroData, A = MarineroArt;
  var PREFIX = 'zs_marinero_';
  var TAU = Math.PI * 2;

  // ---------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    return getUserAppKey(PREFIX);
  }
  function _load() {
    var key = _key();
    var d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    if (!d.knots || typeof d.knots !== 'object') d.knots = {};
    if (!d.best || typeof d.best !== 'object') d.best = {};
    if (typeof d.hunts !== 'number') d.hunts = 0;
    d.v = 1;
    return d;
  }
  function _save(data) {
    var key = _key();
    if (!key) return;
    data.last = _today();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }
  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Stars, computed the same way as the hub does (see the report's star rule).
  function totalStars(d) {
    var n = 0, k;
    for (k in (d.knots || {})) { var q = d.knots[k] || {}; n += (q.w ? 1 : 0) + (q.c ? 1 : 0) + (q.r ? 1 : 0); }
    for (k in (d.best || {})) n += Math.min(3, d.best[k] || 0);
    return n + Math.min(3, d.hunts || 0);
  }
  function knotStars(id) { var q = data.knots[id] || {}; return (q.w ? 1 : 0) + (q.c ? 1 : 0) + (q.r ? 1 : 0); }

  function awardKnot(id, part) {
    var q = data.knots[id] = data.knots[id] || {};
    if (q[part]) return false;
    q[part] = 1;
    _save(data);
    _sound('star');
    _refreshStars();
    return true;
  }
  function recordBest(game, stars, label) {
    var prev = data.best[game] || 0;
    if (stars > prev) { data.best[game] = stars; }
    _save(data);
    _refreshStars();
    if (typeof ActivityLog !== 'undefined' && stars > 0) {
      ActivityLog.log('Marinero', '⚓', label + ' — ' + stars + '★');
    }
    return stars > prev;
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  var data = null, user = null, tier = 'intermediate', age = 8;
  function _sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function root() { return document.getElementById('mar-wrap'); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function starRow(n, max) {
    var s = '';
    for (var i = 0; i < (max || 3); i++) s += '<span class="mar-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="mar-stars" aria-label="' + n + ' of ' + (max || 3) + ' stars">' + s + '</span>';
  }
  function pad3(n) { n = ((Math.round(n) % 360) + 360) % 360; return String(n).padStart(3, '0'); }
  function angDiff(a, b) { var d = ((a - b) % 360 + 540) % 360 - 180; return d; }
  function isOlder() { return tier === 'advanced' || tier === 'expert'; }
  function toast(m) { if (typeof ZsDialog !== 'undefined') ZsDialog.toast(m); }
  function starsFor(correct, total) {
    var r = correct / total;
    return r >= 0.99 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0;
  }

  // One animation loop; the active view sets `frameFn`.
  var frameFn = null, rafId = 0, lastT = 0;
  function setFrame(fn) {
    frameFn = fn;
    lastT = 0;
    if (!rafId && fn) rafId = requestAnimationFrame(_tick);
  }
  function _tick(ts) {
    rafId = 0;
    if (!frameFn) return;
    var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0.016;
    lastT = ts;
    var keep = true;
    try { keep = frameFn(dt, ts / 1000) !== false; } catch (e) { keep = false; if (window.console) console.error(e); }
    if (keep && frameFn) rafId = requestAnimationFrame(_tick);
  }
  function kick() { if (frameFn && !rafId) { lastT = 0; rafId = requestAnimationFrame(_tick); } }

  var cleanup = [];
  function onLeave(fn) { cleanup.push(fn); }
  function leaveView() {
    setFrame(null);
    cleanup.forEach(function(f) { try { f(); } catch (e) {} });
    cleanup = [];
  }

  function celebrate(stars, title, sub) {
    var ov = document.createElement('div');
    ov.className = 'mar-celebrate';
    ov.setAttribute('role', 'status');
    ov.innerHTML = '<div class="mar-cel-card"><div class="mar-cel-stars">' + starRow(stars) + '</div>' +
      '<div class="mar-cel-title">' + esc(title) + '</div>' + (sub ? '<div class="mar-cel-sub">' + esc(sub) + '</div>' : '') +
      '<button type="button" class="mar-btn mar-btn-brass">Aye aye! ⚓</button></div>';
    document.body.appendChild(ov);
    _sound(stars >= 2 ? 'cheer' : 'correct');
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.querySelector('button').addEventListener('click', close);
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    try { ov.querySelector('button').focus(); } catch (e) {}
  }

  function _refreshStars() {
    var el = document.getElementById('mar-total');
    if (el) el.textContent = totalStars(data);
  }

  // ---------------------------------------------------------------
  // Shell: header + section tabs
  // ---------------------------------------------------------------
  var SECTIONS = [
    { id: 'knots', icon: '🪢', en: 'Knots', es: 'Nudos' },
    { id: 'compass', icon: '🧭', en: 'Compass', es: 'Rumbos' },
    { id: 'buoys', icon: '🛟', en: 'Buoys', es: 'Boyas' },
    { id: 'flags', icon: '🚩', en: 'Flags', es: 'Banderas' },
    { id: 'chart', icon: '🗺️', en: 'Chart', es: 'Carta' }
  ];
  var current = { section: 'home' };

  function shell(section, inner) {
    var tabs = SECTIONS.map(function(s) {
      return '<button type="button" class="mar-tab' + (s.id === section ? ' on' : '') + '" data-go="' + s.id + '"' +
        (s.id === section ? ' aria-current="page"' : '') + '><span class="mar-tab-ic" aria-hidden="true">' + s.icon + '</span>' +
        '<span class="mar-tab-en">' + s.en + '</span><span class="mar-tab-es">' + s.es + '</span></button>';
    }).join('');
    return '<header class="mar-head">' +
        '<button type="button" class="mar-brand" data-go="home" aria-label="Marinero home">' +
          '<span class="mar-brand-knot" aria-hidden="true">🪢</span><span class="mar-brand-t">Marinero</span></button>' +
        '<div class="mar-total" title="Marinero stars" aria-label="Marinero stars">★ <span id="mar-total">' + totalStars(data) + '</span></div>' +
      '</header>' +
      '<nav class="mar-tabs" aria-label="Sections">' + tabs + '</nav>' +
      '<main class="mar-main">' + inner + '</main>';
  }

  function render(section, inner, after) {
    leaveView();
    current.section = section;
    ZsCanvas.releaseIn(root()); // free the old view's canvases now
    root().innerHTML = shell(section, inner);
    $all('[data-go]', root()).forEach(function(b) {
      b.addEventListener('click', function() { _sound('click'); go(b.getAttribute('data-go')); });
    });
    if (after) after(root());
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function go(where, arg) {
    switch (where) {
      case 'home': return viewHome();
      case 'knots': return viewKnots();
      case 'knot': return viewKnot(arg);
      case 'compass': return viewCompass();
      case 'steer': return viewSteer();
      case 'names': return viewNames(arg);
      case 'recip': return viewRecip();
      case 'hunt': return viewHuntSetup();
      case 'huntRun': return viewHuntRun(arg);
      case 'buoys': return viewBuoys();
      case 'buoyQuiz': return viewBuoyQuiz();
      case 'flags': return viewFlags();
      case 'flagQuiz': return viewFlagQuiz();
      case 'spell': return viewSpell();
      case 'chart': return viewChart();
    }
  }

  // ---------------------------------------------------------------
  // HOME
  // ---------------------------------------------------------------
  function viewHome() {
    var name = user ? esc(user.name) : 'sailor';
    var cards = [
      { go: 'knots', icon: '🪢', t: 'Knots · Nudos', d: 'Watch real rope tie itself, then tie it yourself.', n: D.KNOTS.reduce(function(s, k) { return s + knotStars(k.id); }, 0), m: D.KNOTS.length * 3 },
      { go: 'compass', icon: '🧭', t: 'Compass · Rumbos', d: 'Steer by compass, name the points, hunt for treasure.', n: ['steer', 'names', 'recip', 'names32'].reduce(function(s, k) { return s + (data.best[k] || 0); }, 0) + Math.min(3, data.hunts), m: 15 },
      { go: 'buoys', icon: '🛟', t: 'Buoys · Boyas', d: 'Red, green, cardinal… which side do you pass?', n: data.best.buoys || 0, m: 3 },
      { go: 'flags', icon: '🚩', t: 'Signal flags · Banderas', d: 'The A–Z flags ships use, and spell your name.', n: data.best.flags || 0, m: 3 },
      { go: 'chart', icon: '🗺️', t: 'Chart work · Carta', d: 'Dividers, nautical miles and time at sea. Ages 10+.', n: data.best.chart || 0, m: 3 }
    ];
    var html = '<section class="mar-hero">' +
        '<div class="mar-hero-txt"><h1>Ahoy, ' + name + '!</h1>' +
        '<p>Learn the skills every sailor needs — the same ones on the <b>Patrón de Lancha</b> exam, made hands-on.</p></div>' +
        '<canvas class="mar-hero-cv" id="mar-hero-cv" aria-hidden="true"></canvas>' +
      '</section>' +
      '<div class="mar-home-grid">' + cards.map(function(c) {
        return '<button type="button" class="mar-home-card" data-go="' + c.go + '">' +
          '<span class="mar-home-ic" aria-hidden="true">' + c.icon + '</span>' +
          '<span class="mar-home-t">' + c.t + '</span><span class="mar-home-d">' + c.d + '</span>' +
          '<span class="mar-home-p">★ ' + c.n + ' / ' + c.m + '</span></button>';
      }).join('') + '</div>';
    render('home', html, function(r) {
      // a small figure-eight on teak in the hero
      var cv = $('#mar-hero-cv', r);
      drawKnotStatic(cv, 'fig8', cv.clientWidth || 300);
    });
  }

  // ---------------------------------------------------------------
  // KNOTS
  // ---------------------------------------------------------------
  var _models = {};
  function knotDef(id) { for (var i = 0; i < D.KNOTS.length; i++) if (D.KNOTS[i].id === id) return D.KNOTS[i]; return null; }
  function modelFor(id, def) {
    if (!_models[id]) _models[id] = A.buildModel(def || knotDef(id));
    return _models[id];
  }
  function grannyDef() {
    var r = knotDef('reef');
    return { id: 'granny', W: r.W, scene: 'deck', ropes: r.ropes, ou: 'UUOUOO', travel: 1 };
  }

  // Draw a knot (fully tied, or partly via opts.vis) on a canvas of css width w.
  function paintKnot(cv, K, M, w, opts) {
    opts = opts || {};
    var h = Math.round(w * 0.72);
    // while the rope is moving, paint at a lower resolution; full detail when it stops
    var f = A.fitCanvas(cv, w, h, opts.fast ? 1 : 2), ctx = f.ctx;
    if (!ctx) return; // no canvas memory left: skip this frame
    var V = K.view || [0, 0, 1000];
    var sc = w / V[2];
    ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    var bg = K.scene === 'post' ? A.harbourBokeh(w, h, f.dpr) : A.teakDeck(w, h, f.dpr);
    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else { ctx.fillStyle = K.scene === 'post' ? '#6f9aa8' : '#8a5a32'; ctx.fillRect(0, 0, w, h); }
    ctx.setTransform(f.dpr * sc, 0, 0, f.dpr * sc, -V[0] * sc * f.dpr, -V[1] * sc * f.dpr);
    A.drawModel(ctx, M, {
      vis: opts.vis, colors: opts.colors, devScale: f.dpr * sc,
      objects: A.knotObjects(K, f.dpr * sc), ground: K.scene !== 'post', debug: opts.debug
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawKnotStatic(cv, id, w) {
    var K = knotDef(id);
    paintKnot(cv, K, modelFor(id), w);
  }

  function viewKnots() {
    var html = '<div class="mar-sec-head"><h2>🪢 Knots · Nudos</h2>' +
      '<p>Each knot ties itself step by step. Watch it, answer one question, then tie it with a real rope and show a grown-up. Three stars per knot.</p></div>' +
      '<div class="mar-knot-grid">' + D.KNOTS.map(function(k) {
        var older = k.tier === 'older';
        return '<button type="button" class="mar-knot-card" data-knot="' + k.id + '">' +
          '<canvas class="mar-knot-thumb" data-thumb="' + k.id + '" aria-hidden="true"></canvas>' +
          '<span class="mar-knot-name">' + esc(k.en) + '</span><span class="mar-knot-es">' + esc(k.es) + '</span>' +
          (older ? '<span class="mar-tag">Older sailors</span>' : '') +
          starRow(knotStars(k.id)) + '</button>';
      }).join('') + '</div>';
    render('knots', html, function(r) {
      $all('[data-knot]', r).forEach(function(b) {
        b.addEventListener('click', function() { _sound('click'); go('knot', b.getAttribute('data-knot')); });
      });
      // thumbnails one per frame so the grid appears at once
      var thumbs = $all('[data-thumb]', r), i = 0;
      setFrame(function() {
        if (i >= thumbs.length) return false;
        var cv = thumbs[i++];
        drawKnotStatic(cv, cv.getAttribute('data-thumb'), cv.clientWidth || 220);
        return true;
      });
    });
  }

  var ROPE_CHOICES = ['manila', 'navy', 'red', 'white', 'green'];

  function viewKnot(id) {
    var K = knotDef(id);
    if (!K) return viewKnots();
    var info = D.KNOT_INFO[id] || {};
    var M = modelFor(id);
    var trav = M.ropes[K.travel || 0];
    var steps = K.steps;
    var N = steps.length;
    var colors = K.ropes.map(function(r) { return r.color; });
    var st = { t: 0, playing: false, hold: 0, dragging: false };
    var q = data.knots[id] || {};
    var debug = /[?&]debug=1/.test(location.search);

    var mist = (info.mistakes || []).map(function(m) { return '<li>' + esc(m) + '</li>'; }).join('');
    var opts = info.opts ? info.opts.map(function(o, i) { return { t: o, ok: i === 0 }; }) : [];
    shuffle(opts);

    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="knots">← All knots</button></div>' +
      '<div class="mar-knot-title"><h2>' + esc(K.en) + ' <span class="mar-es">· ' + esc(K.es) + '</span></h2>' +
        '<div id="mar-kstars">' + starRow(knotStars(id)) + '</div></div>' +
      '<div class="mar-stage mar-stage-knot" id="mar-kstage"><canvas id="mar-kcv" aria-label="' + esc(K.en) + ' being tied, step by step" role="img"></canvas>' +
        '<div class="mar-step-cap" id="mar-cap" aria-live="polite"></div></div>' +
      '<div class="mar-player">' +
        '<button type="button" class="mar-btn mar-btn-navy mar-play" id="mar-play" aria-label="Play">▶</button>' +
        '<label class="mar-sr" for="mar-scrub">Knot progress</label>' +
        '<input type="range" id="mar-scrub" class="mar-scrub" min="0" max="' + N + '" step="0.001" value="0">' +
        '<div class="mar-step-dots" id="mar-dots">' + steps.map(function(s, i) {
          return '<button type="button" class="mar-dot" data-step="' + (i + 1) + '" aria-label="Go to step ' + (i + 1) + '">' + (i + 1) + '</button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="mar-colours" role="group" aria-label="Rope colour">' +
        '<span class="mar-colours-l">' + (K.ropes.length > 1 ? 'Working rope colour' : 'Rope colour') + '</span>' +
        ROPE_CHOICES.map(function(c) {
          return '<button type="button" class="mar-swatch sw-' + c + (colors[K.travel || 0] === c ? ' on' : '') + '" data-col="' + c + '" aria-label="' + A.ROPE_COLORS[c].label + ' rope"></button>';
        }).join('') + '</div>' +
      '<div class="mar-two">' +
        '<section class="mar-card"><h3>⚓ What it’s for</h3><p>' + esc(info.use || '') + '</p>' +
          (info.useEs ? '<p class="mar-es-p">' + esc(info.useEs) + '</p>' : '') +
          (info.rhyme ? '<p class="mar-rhyme">“' + esc(info.rhyme) + '”</p>' : '') + '</section>' +
        '<section class="mar-card"><h3>⚠️ Watch out for</h3><ul class="mar-list">' + mist + '</ul>' +
          (id === 'reef' ? '<div class="mar-vs"><figure><canvas id="mar-reef-ok" aria-label="Reef knot"></canvas><figcaption>✔ Reef knot — flat, parts side by side</figcaption></figure>' +
            '<figure><canvas id="mar-granny" aria-label="Granny knot"></canvas><figcaption>✘ Granny knot — parts come out on opposite sides</figcaption></figure></div>' : '') +
        '</section>' +
      '</div>' +
      '<section class="mar-card mar-check" id="mar-check"><h3>❓ Quick check</h3><p>' + esc(info.q || '') + '</p>' +
        '<div class="mar-opts">' + opts.map(function(o, i) {
          return '<button type="button" class="mar-opt" data-ok="' + (o.ok ? 1 : 0) + '">' + esc(o.t) + '</button>';
        }).join('') + '</div><p class="mar-check-msg" id="mar-check-msg" aria-live="polite"></p></section>' +
      '<section class="mar-card mar-real"><h3>🪢 Tie it for real</h3>' +
        '<p>Get a real rope (a shoelace works too!). Tie the ' + esc(K.en.toLowerCase()) + ', then show a grown-up.</p>' +
        '<button type="button" class="mar-btn mar-btn-brass" id="mar-real"' + (q.r ? ' disabled' : '') + '>' +
        (q.r ? '✔ Tied with a real rope' : 'I tied it with a real rope!') + '</button></section>' +
      '<div class="mar-earn"><b>Stars:</b> ★ watch it all the way · ★ quick check · ★ real rope, checked by a grown-up</div>';

    render('knots', html, function(r) {
      var stage = $('#mar-kstage', r), cv = $('#mar-kcv', r), cap = $('#mar-cap', r);
      var scrub = $('#mar-scrub', r), play = $('#mar-play', r);
      var cssW = 0;

      function uAt(t) {
        var u0 = K.u0 || 1;
        if (t <= 0) return u0;
        var k = Math.min(N - 1, Math.floor(t));
        var f = t - k;
        var a = k === 0 ? u0 : steps[k - 1].u, b = steps[k].u;
        var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        return a + (b - a) * (t >= N ? 1 : e);
      }
      function caption(t) {
        if (t <= 0.001) return '<b>Ready?</b> Press ▶ or drag the slider. <span class="mar-es">¿Listo?</span>';
        var k = Math.min(N - 1, Math.ceil(t) - 1);
        return '<b>Step ' + (k + 1) + ' of ' + N + ':</b> ' + esc(steps[k].en) + ' <span class="mar-es">' + esc(steps[k].es) + '</span>';
      }
      var sharpTmr = 0;
      function draw(fast) {
        cssW = stage.clientWidth;
        var vis = M.ropes.map(function(R, i) { return i === (K.travel || 0) ? A.sAtCP(R, uAt(st.t)) : R.L; });
        paintKnot(cv, K, M, cssW, { vis: vis, colors: colors, debug: debug, fast: fast });
        clearTimeout(sharpTmr);
        if (fast) sharpTmr = setTimeout(function() { if (!st.playing) draw(false); }, 180);
        cap.innerHTML = caption(st.t);
        scrub.value = st.t;
        $all('.mar-dot', r).forEach(function(d, i) { d.classList.toggle('on', st.t >= i + 1 - 0.001); });
        if (st.t >= N - 0.001 && !q.w) {
          q = data.knots[id] = data.knots[id] || {};
          if (awardKnot(id, 'w')) { $('#mar-kstars', r).innerHTML = starRow(knotStars(id)); toast('⭐ You watched the whole knot!'); }
        }
      }
      function setPlaying(p) {
        st.playing = p;
        play.textContent = p ? '❚❚' : '▶';
        play.setAttribute('aria-label', p ? 'Pause' : 'Play');
        if (p) { if (st.t >= N - 0.001) st.t = 0; st.hold = 0.4; kick(); }
      }
      setFrame(function(dt) {
        if (!st.playing) return false;
        if (st.hold > 0) { st.hold -= dt; return true; }
        var before = Math.floor(st.t + 1e-6);
        st.t = Math.min(N, st.t + dt / 2.6);
        if (Math.floor(st.t + 1e-6) > before && st.t < N) { st.hold = 0.9; draw(false); return true; }  // pause at each step
        draw(true);
        if (st.t >= N) { setPlaying(false); draw(false); return false; }
        return true;
      });
      play.addEventListener('click', function() { _sound('click'); setPlaying(!st.playing); });
      scrub.addEventListener('input', function() { setPlaying(false); st.t = parseFloat(scrub.value) || 0; draw(true); });
      $all('.mar-dot', r).forEach(function(d) {
        d.addEventListener('click', function() { setPlaying(false); st.t = +d.getAttribute('data-step'); draw(); });
      });
      $all('.mar-swatch', r).forEach(function(b) {
        b.addEventListener('click', function() {
          colors[K.travel || 0] = b.getAttribute('data-col');
          $all('.mar-swatch', r).forEach(function(x) { x.classList.toggle('on', x === b); });
          draw();
        });
      });
      // quick check
      var answered = false;
      $all('.mar-opt', r).forEach(function(b) {
        b.addEventListener('click', function() {
          if (answered) return;
          var ok = b.getAttribute('data-ok') === '1';
          b.classList.add(ok ? 'ok' : 'bad');
          if (ok) {
            answered = true;
            _sound('correct');
            $all('.mar-opt', r).forEach(function(x) { x.disabled = true; });
            var fresh = awardKnot(id, 'c');
            $('#mar-check-msg', r).textContent = fresh ? '⭐ Correct! Star earned.' : '✔ Correct!';
            $('#mar-kstars', r).innerHTML = starRow(knotStars(id));
          } else {
            _sound('wrong');
            b.disabled = true;
            $('#mar-check-msg', r).textContent = 'Not quite — read “What it’s for” and try again.';
          }
        });
      });
      // real rope, confirmed by a grown-up's PIN
      var realBtn = $('#mar-real', r);
      realBtn.addEventListener('click', function() {
        if (typeof ZsDialog === 'undefined') return;
        ZsDialog.prompt({
          title: 'Grown-up check 🪢',
          message: 'Grown-up: look at the knot. Is it the ' + K.en.toLowerCase() + ', tied correctly? If yes, enter your parent PIN.',
          inputType: 'password', inputMode: 'numeric', placeholder: 'Parent PIN', label: 'Parent PIN',
          confirmLabel: 'Award ⭐', cancelLabel: 'Not yet'
        }).then(function(v) {
          if (v == null) return;
          var pin = typeof getParentPin === 'function' ? getParentPin() : null;
          if (pin && String(v).trim() === String(pin)) {
            awardKnot(id, 'r');
            realBtn.disabled = true; realBtn.textContent = '✔ Tied with a real rope';
            $('#mar-kstars', r).innerHTML = starRow(knotStars(id));
            if (typeof ActivityLog !== 'undefined') ActivityLog.log('Marinero', '🪢', 'Tied a real ' + K.en.toLowerCase());
            celebrate(knotStars(id), 'Real sailor’s knot!', K.en + ' · ' + K.es);
          } else {
            _sound('wrong');
            toast('That PIN is not right. Ask a grown-up to try again.');
          }
        });
      });
      // reef vs granny comparison
      if (id === 'reef') {
        var gD = grannyDef();
        var gM = _models.granny || (_models.granny = A.buildModel(gD));
        var okC = $('#mar-reef-ok', r), grC = $('#mar-granny', r);
        var cmp = function() {
          var w = okC.parentNode.clientWidth;
          paintKnot(okC, K, M, w, { colors: colors });
          paintKnot(grC, gD, gM, w, { colors: colors });
        };
        cmp();
        onLeave(_onResize(cmp));
      }
      draw();
      onLeave(_onResize(function() { draw(); }));
      onLeave(function() { st.playing = false; });
    });
  }

  function _onResize(fn) {
    var tmr = 0, lastW = window.innerWidth;
    function h() {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      clearTimeout(tmr); tmr = setTimeout(fn, 120);
    }
    window.addEventListener('resize', h);
    return function() { window.removeEventListener('resize', h); clearTimeout(tmr); };
  }

  // ---------------------------------------------------------------
  // COMPASS
  // ---------------------------------------------------------------
  function pointName(deg) { return A.POINTS16[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]; }

  function viewCompass() {
    var b = data.best;
    var games = [
      { go: 'steer', ic: '⎈', t: 'Steer the boat', d: 'Turn the wheel until the compass shows your course.', s: b.steer || 0 },
      { go: 'names', ic: '🧭', t: 'Name that direction', d: tier === 'beginner' ? 'North, East, South or West?' : 'The points of the compass: N, NE, SE…', s: b.names || 0 },
      { go: 'recip', ic: '↔️', t: 'Back bearings', d: 'The bearing the other way round (add or subtract 180°).', s: b.recip || 0, older: true },
      { go: 'names32', ic: '✳️', t: '32-point names', d: 'For experts: N by E, NNE, NE by N…', s: b.names32 || 0, older: true },
      { go: 'hunt', ic: '🏴‍☠️', t: 'Backyard treasure hunt', d: 'A grown-up sets bearings and paces. Follow them outside!', s: Math.min(3, data.hunts) }
    ];
    var html = '<div class="mar-sec-head"><h2>🧭 Compass &amp; bearings · Rumbos</h2>' +
      '<p>A <b>bearing</b> is a direction measured clockwise from North, from <b>000°</b> to <b>359°</b>. North 000° · East 090° · South 180° · West 270°.</p></div>' +
      '<div class="mar-compass-intro"><canvas id="mar-cintro" aria-label="A marine compass you can turn" role="img"></canvas>' +
        '<div class="mar-ci-txt"><p>This is a ship’s compass. The <b>card</b> always points North; the red <b>lubber line</b> is fixed to the boat and shows your <b>heading</b>.</p>' +
        '<p class="mar-ci-read">Heading: <b id="mar-ci-h">000°</b> <span id="mar-ci-n">N</span></p>' +
        '<p class="mar-hint">Drag the compass to turn the boat.</p></div></div>' +
      '<div class="mar-game-grid">' + games.map(function(g) {
        return '<button type="button" class="mar-game" data-g="' + g.go + '"><span class="mar-game-ic" aria-hidden="true">' + g.ic + '</span>' +
          '<span class="mar-game-t">' + g.t + '</span><span class="mar-game-d">' + g.d + '</span>' +
          (g.older && !isOlder() ? '<span class="mar-tag">Challenge</span>' : '') + starRow(g.s) + '</button>';
      }).join('') + '</div>';
    render('compass', html, function(r) {
      $all('[data-g]', r).forEach(function(b) {
        b.addEventListener('click', function() {
          _sound('click');
          var g = b.getAttribute('data-g');
          if (g === 'names32') go('names', 32); else go(g);
        });
      });
      // a compass you can drag around
      var cv = $('#mar-cintro', r);
      var h = 0, shown = 0, vel = 0, drag = null;
      function size() { return Math.min(320, cv.parentNode.clientWidth - 8); }
      function draw() {
        var s = size(), f = A.fitCanvas(cv, s, s);
        if (f.ctx) {
          f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
          f.ctx.clearRect(0, 0, s, s);
          A.drawCompass(f.ctx, s / 2, s / 2, s * 0.48, shown, { dpr: f.dpr, tilt: vel * 0.02 });
        }
        $('#mar-ci-h', r).textContent = pad3(h) + '°';
        $('#mar-ci-n', r).textContent = pointName(h) + ' · ' + D.POINT_ES[pointName(h)];
      }
      setFrame(function(dt) {
        var d = angDiff(h, shown);
        vel += (d * 26 - vel * 6) * dt;
        shown = (shown + vel * dt + 360) % 360;
        draw();
        return Math.abs(d) > 0.05 || Math.abs(vel) > 0.05 || !!drag;
      });
      function ang(e) { var b = cv.getBoundingClientRect(); return Math.atan2(e.clientX - b.left - b.width / 2, -(e.clientY - b.top - b.height / 2)) * 180 / Math.PI; }
      cv.addEventListener('pointerdown', function(e) { drag = ang(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} kick(); });
      cv.addEventListener('pointermove', function(e) { if (drag == null) return; var a = ang(e); h = (h - angDiff(a, drag) + 360) % 360; drag = a; kick(); });
      var up = function() { drag = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      draw();
      onLeave(_onResize(draw));
    });
  }

  // ---- Steer the boat ----
  function viewSteer() {
    var tol = { beginner: 12, intermediate: 8, advanced: 5, expert: 3 }[tier];
    var direct = tier === 'beginner' || tier === 'intermediate';
    var WL = direct ? 1e9 : 4.7; // rudder mode: about 1.5 turns lock to lock
    var TOTAL = 5;
    var st = { h: Math.floor(Math.random() * 360), shown: 0, vel: 0, wheel: 0, rate: 0, target: 0, n: 0, onFor: 0, time: 0, done: false, keyTurn: 0 };
    st.shown = st.h;
    function newTarget() {
      var step = tier === 'beginner' ? 90 : tier === 'intermediate' ? 45 : tier === 'advanced' ? 10 : 5;
      var t;
      do { t = Math.floor(Math.random() * (360 / step)) * step; } while (Math.abs(angDiff(t, st.h)) < 40);
      st.target = t; st.onFor = 0;
    }
    newTarget();
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="compass">← Compass</button></div>' +
      '<h2 class="mar-game-h">⎈ Steer the boat</h2>' +
      '<div class="mar-target" id="mar-target"></div>' +
      '<div class="mar-steer">' +
        '<div class="mar-steer-c"><canvas id="mar-scv" role="img" aria-label="Compass"></canvas><div class="mar-headread" id="mar-hr"></div></div>' +
        '<div class="mar-steer-w"><canvas id="mar-wcv" role="img" aria-label="Ship’s wheel — drag to steer"></canvas>' +
          '<div class="mar-wheel-btns"><button type="button" class="mar-btn mar-btn-port" id="mar-portb">◀ Port</button>' +
          '<button type="button" class="mar-btn mar-btn-stbd" id="mar-stbdb">Starboard ▶</button></div>' +
          '<p class="mar-hint">' + (direct ? 'Turn the wheel: the boat turns with it.' : 'Turn the wheel to put the rudder over; centre it to stop turning — like a real boat.') + '</p></div>' +
      '</div>' +
      '<div class="mar-progress" id="mar-prog"></div>';
    render('compass', html, function(r) {
      var cv = $('#mar-scv', r), wv = $('#mar-wcv', r);
      function sizes() {
        var wide = r.clientWidth > 640;
        var cs = Math.min(wide ? 380 : r.clientWidth - 8, wide ? 420 : Math.max(240, window.innerHeight * 0.4));
        var ws = Math.min(wide ? 260 : r.clientWidth * 0.5, wide ? 260 : 200);
        return [cs, ws];
      }
      function label(t) { var p = pointName(t); return (t % 22.5 === 0 ? p + ' · ' + D.POINT_ES[p] : ''); }
      function draw() {
        var s = sizes();
        var f = A.fitCanvas(cv, s[0], s[0]);
        if (f.ctx) {
          f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); f.ctx.clearRect(0, 0, s[0], s[0]);
          A.drawCompass(f.ctx, s[0] / 2, s[0] / 2, s[0] * 0.48, st.shown, { dpr: f.dpr, tilt: st.vel * 0.03, target: st.target });
        }
        var g = A.fitCanvas(wv, s[1], s[1]);
        if (g.ctx) {
          g.ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0); g.ctx.clearRect(0, 0, s[1], s[1]);
          A.drawWheel(g.ctx, s[1] / 2, s[1] / 2, s[1] * 0.47, st.wheel, g.dpr);
        }
        var err = angDiff(st.h, st.target);
        $('#mar-hr', r).innerHTML = 'Heading <b>' + pad3(st.h) + '°</b>' +
          (Math.abs(err) <= tol ? ' <span class="mar-ok">On course! Hold it…</span>' : ' <span class="mar-off">' + (err > 0 ? 'turn to PORT ◀' : 'turn to STARBOARD ▶') + '</span>');
        $('#mar-target', r).innerHTML = 'Course to steer: <b>' + pad3(st.target) + '°</b> <span class="mar-es">' + label(st.target) + '</span>' +
          '<span class="mar-green-mk">green marker</span>';
        $('#mar-prog', r).innerHTML = 'Course ' + Math.min(TOTAL, st.n + 1) + ' of ' + TOTAL + ' · ⏱ ' + Math.round(st.time) + ' s';
      }
      setFrame(function(dt) {
        if (st.done) return false;
        st.time += dt;
        if (st.keyTurn) st.wheel = Math.max(-WL, Math.min(WL, st.wheel + st.keyTurn * dt * 2.2));
        if (direct) {
          // the wheel is the heading: half a turn of the wheel = 90°
          var want = (st.base + st.wheel * 180 / Math.PI * 0.5 + 3600) % 360;
          st.h = want;
        } else {
          st.rate = st.wheel / 4.7 * 28; // degrees per second at full rudder
          st.h = (st.h + st.rate * dt + 360) % 360;
        }
        var d = angDiff(st.h, st.shown);
        st.vel += (d * 22 - st.vel * 5.5) * dt;
        st.shown = (st.shown + st.vel * dt + 360) % 360;
        if (Math.abs(angDiff(st.h, st.target)) <= tol && Math.abs(st.rate) < 8) {
          st.onFor += dt;
          if (st.onFor > 1.1) {
            st.n++;
            _sound('correct');
            if (st.n >= TOTAL) { finish(); return false; }
            newTarget();
          }
        } else st.onFor = 0;
        draw();
        return true;
      });
      st.base = st.h;
      function finish() {
        st.done = true;
        draw();
        var per = st.time / TOTAL;
        var stars = per <= 9 ? 3 : per <= 16 ? 2 : 1;
        recordBest('steer', stars, 'Steered 5 compass courses in ' + Math.round(st.time) + ' s');
        celebrate(stars, 'Five courses steered!', Math.round(st.time) + ' seconds · ' + Math.round(per) + ' s per course');
        $('#mar-prog', r).innerHTML = '<button type="button" class="mar-btn mar-btn-navy" id="mar-again">Steer again</button>';
        $('#mar-again', r).addEventListener('click', function() { go('steer'); });
      }
      // wheel dragging
      var drag = null;
      function ang(e) { var b = wv.getBoundingClientRect(); return Math.atan2(e.clientY - b.top - b.height / 2, e.clientX - b.left - b.width / 2); }
      wv.addEventListener('pointerdown', function(e) { drag = ang(e); try { wv.setPointerCapture(e.pointerId); } catch (x) {} });
      wv.addEventListener('pointermove', function(e) {
        if (drag == null) return;
        var a = ang(e), d = a - drag;
        if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
        st.wheel = Math.max(-WL, Math.min(WL, st.wheel + d));
        drag = a;
      });
      var up = function() { drag = null; };
      wv.addEventListener('pointerup', up); wv.addEventListener('pointercancel', up);
      function holdBtn(btn, dir) {
        var on = function(e) { e.preventDefault(); st.keyTurn = dir; };
        var off = function() { st.keyTurn = 0; };
        btn.addEventListener('pointerdown', on);
        btn.addEventListener('pointerup', off); btn.addEventListener('pointerleave', off); btn.addEventListener('pointercancel', off);
        btn.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { st.wheel = Math.max(-WL, Math.min(WL, st.wheel + dir * 0.35)); } });
      }
      holdBtn($('#mar-portb', r), -1);
      holdBtn($('#mar-stbdb', r), 1);
      draw();
      onLeave(_onResize(draw));
    });
  }

  // ---- Name that direction (16 points, or 32 for experts) ----
  function viewNames(mode) {
    var p32 = mode === 32;
    var pool, letters;
    if (p32) { pool = D.POINTS32.map(function(n, i) { return { n: n, deg: i * 11.25 }; }); letters = 'cardinal'; }
    else if (tier === 'beginner') { pool = ['N', 'E', 'S', 'W'].map(function(n) { return { n: n, deg: A.POINTS16.indexOf(n) * 22.5 }; }); letters = 'north'; }
    else if (tier === 'intermediate') { pool = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(function(n) { return { n: n, deg: A.POINTS16.indexOf(n) * 22.5 }; }); letters = 'cardinal'; }
    else { pool = A.POINTS16.map(function(n, i) { return { n: n, deg: i * 22.5 }; }); letters = tier === 'expert' ? 'north' : 'cardinal'; }
    var TOTAL = 8;
    var qs = [];
    var bag = shuffle(pool.slice());
    for (var i = 0; i < TOTAL; i++) { if (!bag.length) bag = shuffle(pool.slice()); qs.push(bag.pop()); }
    var st = { i: 0, right: 0, pointer: 0, shown: 0, vel: 0, locked: false };
    var nOpts = tier === 'beginner' ? 4 : 4;
    var game = p32 ? 'names32' : 'names';

    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="compass">← Compass</button></div>' +
      '<h2 class="mar-game-h">' + (p32 ? '✳️ The 32 points' : '🧭 Name that direction') + '</h2>' +
      '<div class="mar-quiz">' +
        '<div class="mar-quiz-vis"><canvas id="mar-ncv" role="img" aria-label="Compass with an orange pointer"></canvas></div>' +
        '<div class="mar-quiz-side"><p class="mar-q" id="mar-q"></p><div class="mar-opts" id="mar-opts"></div>' +
        '<p class="mar-fb" id="mar-fb" aria-live="polite"></p><div class="mar-progress" id="mar-prog"></div></div>' +
      '</div>';
    render('compass', html, function(r) {
      var cv = $('#mar-ncv', r);
      function size() { return Math.min(r.clientWidth > 640 ? 400 : r.clientWidth - 8, 420); }
      function drawC() {
        var s = size(), f = A.fitCanvas(cv, s, s);
        if (!f.ctx) return;
        f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); f.ctx.clearRect(0, 0, s, s);
        A.drawCompass(f.ctx, s / 2, s / 2, s * 0.48, 0, { dpr: f.dpr, letters: letters, pointer: st.shown, lubber: false });
      }
      setFrame(function(dt) {
        var d = angDiff(st.pointer, st.shown);
        st.vel += (d * 30 - st.vel * 6) * dt;
        st.shown = (st.shown + st.vel * dt + 360) % 360;
        drawC();
        return Math.abs(d) > 0.05 || Math.abs(st.vel) > 0.05;
      });
      function ask() {
        var q = qs[st.i];
        st.pointer = q.deg; st.locked = false; kick();
        $('#mar-q', r).innerHTML = 'Which direction is the orange pointer showing?';
        var others = shuffle(pool.filter(function(p) { return p.n !== q.n; })).slice(0, nOpts - 1);
        var opts = shuffle([q].concat(others));
        $('#mar-opts', r).innerHTML = opts.map(function(o) {
          var es = D.POINT_ES[o.n];
          return '<button type="button" class="mar-opt mar-opt-big" data-n="' + esc(o.n) + '"><b>' + esc(o.n) + '</b>' +
            (es && !p32 ? '<small>' + esc(D.POINT_EN[o.n]) + ' · ' + esc(es) + '</small>' : '') + '</button>';
        }).join('');
        $('#mar-fb', r).textContent = '';
        $('#mar-prog', r).innerHTML = 'Question ' + (st.i + 1) + ' of ' + TOTAL + ' · ✔ ' + st.right;
        $all('.mar-opt', r).forEach(function(b) {
          b.addEventListener('click', function() {
            if (st.locked) return;
            st.locked = true;
            var ok = b.getAttribute('data-n') === q.n;
            if (ok) { st.right++; b.classList.add('ok'); _sound('correct'); }
            else {
              b.classList.add('bad'); _sound('wrong');
              $all('.mar-opt', r).forEach(function(x) { if (x.getAttribute('data-n') === q.n) x.classList.add('ok'); });
            }
            $('#mar-fb', r).textContent = (ok ? '✔ ' : '✘ ') + q.n + ' is ' + (q.deg % 1 ? q.deg.toFixed(2) : pad3(q.deg)) + '°' + (D.POINT_ES[q.n] ? ' — ' + D.POINT_ES[q.n] : '') + '.';
            setTimeout(next, ok ? 900 : 1700);
          });
        });
      }
      function next() {
        st.i++;
        if (st.i < TOTAL) return ask();
        var stars = starsFor(st.right, TOTAL);
        recordBest(game, stars, (p32 ? '32-point names: ' : 'Compass points: ') + st.right + '/' + TOTAL);
        celebrate(stars, st.right + ' of ' + TOTAL + ' right!', p32 ? 'The 32 points of the compass' : 'Points of the compass');
        $('#mar-opts', r).innerHTML = '<button type="button" class="mar-btn mar-btn-navy" id="mar-again">Play again</button>';
        $('#mar-q', r).textContent = 'Round finished.';
        $('#mar-again', r).addEventListener('click', function() { go('names', mode); });
      }
      ask();
      onLeave(_onResize(drawC));
    });
  }

  // ---- Back (reciprocal) bearings ----
  function viewRecip() {
    var TOTAL = 6;
    var st = { i: 0, right: 0, locked: false, pointer: 0, shown: 0, vel: 0, back: null };
    var objs = [['🗼', 'the lighthouse', 'el faro'], ['⛵', 'a sailboat', 'un velero'], ['🏝️', 'the island', 'la isla'], ['🛟', 'the buoy', 'la boya']];
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="compass">← Compass</button></div>' +
      '<h2 class="mar-game-h">↔️ Back bearings</h2>' +
      '<p class="mar-sub">If you see something at a bearing, someone over there sees <b>you</b> at the opposite bearing: add 180° (or subtract 180° if it is more than 180°).</p>' +
      '<div class="mar-quiz"><div class="mar-quiz-vis"><canvas id="mar-rcv" role="img" aria-label="Compass with bearing pointer"></canvas></div>' +
      '<div class="mar-quiz-side"><p class="mar-q" id="mar-q"></p><div class="mar-opts" id="mar-opts"></div>' +
      '<p class="mar-fb" id="mar-fb" aria-live="polite"></p><div class="mar-progress" id="mar-prog"></div></div></div>';
    render('compass', html, function(r) {
      var cv = $('#mar-rcv', r);
      function size() { return Math.min(r.clientWidth > 640 ? 380 : r.clientWidth - 8, 400); }
      function drawC() {
        var s = size(), f = A.fitCanvas(cv, s, s);
        if (!f.ctx) return;
        f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); f.ctx.clearRect(0, 0, s, s);
        A.drawCompass(f.ctx, s / 2, s / 2, s * 0.48, 0, { dpr: f.dpr, letters: 'cardinal', pointer: st.shown, lubber: false, target: st.back });
      }
      setFrame(function(dt) {
        var d = angDiff(st.pointer, st.shown);
        st.vel += (d * 30 - st.vel * 6) * dt;
        st.shown = (st.shown + st.vel * dt + 360) % 360;
        drawC();
        return Math.abs(d) > 0.05 || Math.abs(st.vel) > 0.05;
      });
      function ask() {
        var step = isOlder() ? 5 : 10;
        var b = Math.floor(Math.random() * (360 / step)) * step;
        var o = pick(objs);
        var rec = (b + 180) % 360;
        st.pointer = b; st.back = null; st.locked = false; kick();
        $('#mar-q', r).innerHTML = 'You see ' + o[0] + ' <b>' + o[1] + '</b> at <b>' + pad3(b) + '°</b>. What bearing would someone at ' + o[1] + ' use to see <b>you</b>?';
        var wrong = [b, (b + 90) % 360, (360 - b) % 360, (b + 270) % 360, (b + 170) % 360].filter(function(x, i, a) { return x !== rec && a.indexOf(x) === i; });
        var opts = shuffle([rec].concat(shuffle(wrong).slice(0, 3)));
        $('#mar-opts', r).innerHTML = opts.map(function(x) { return '<button type="button" class="mar-opt mar-opt-big" data-v="' + x + '"><b>' + pad3(x) + '°</b></button>'; }).join('');
        $('#mar-fb', r).textContent = '';
        $('#mar-prog', r).innerHTML = 'Question ' + (st.i + 1) + ' of ' + TOTAL + ' · ✔ ' + st.right;
        $all('.mar-opt', r).forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (st.locked) return;
            st.locked = true;
            var ok = +btn.getAttribute('data-v') === rec;
            if (ok) { st.right++; btn.classList.add('ok'); _sound('correct'); }
            else { btn.classList.add('bad'); _sound('wrong'); $all('.mar-opt', r).forEach(function(x) { if (+x.getAttribute('data-v') === rec) x.classList.add('ok'); }); }
            st.back = rec; kick(); drawC();
            $('#mar-fb', r).textContent = (ok ? '✔ ' : '✘ ') + pad3(b) + '° ' + (b < 180 ? '+ 180°' : '− 180°') + ' = ' + pad3(rec) + '° (green marker).';
            setTimeout(next, ok ? 1300 : 2200);
          });
        });
      }
      function next() {
        st.i++;
        if (st.i < TOTAL) return ask();
        var stars = starsFor(st.right, TOTAL);
        recordBest('recip', stars, 'Back bearings: ' + st.right + '/' + TOTAL);
        celebrate(stars, st.right + ' of ' + TOTAL + ' back bearings!', 'Add or subtract 180°');
        $('#mar-opts', r).innerHTML = '<button type="button" class="mar-btn mar-btn-navy" id="mar-again">Play again</button>';
        $('#mar-q', r).textContent = 'Round finished.';
        $('#mar-again', r).addEventListener('click', function() { go('recip'); });
      }
      ask();
      onLeave(_onResize(drawC));
    });
  }

  // ---- Backyard treasure hunt ----
  // The hunt (bearings and paces) lives only in this tab's session:
  // it is a game set-up, not progress, so it is not synced.
  var HUNT_KEY = 'marinero_hunt_session';
  function _huntLoad() {
    try { var h = JSON.parse(sessionStorage.getItem(HUNT_KEY)); if (h && h.length >= 3) return h; } catch (e) {}
    return [{ b: 90, p: 10 }, { b: 180, p: 8 }, { b: 315, p: 12 }];
  }
  function _huntSave(legs) { try { sessionStorage.setItem(HUNT_KEY, JSON.stringify(legs)); } catch (e) {} }

  function viewHuntSetup() {
    var legs = _huntLoad();
    function rows() {
      return legs.map(function(l, i) {
        return '<div class="mar-leg"><span class="mar-leg-n">Leg ' + (i + 1) + '</span>' +
          '<label for="mar-lb' + i + '">Bearing °</label><input id="mar-lb' + i + '" type="number" inputmode="numeric" min="0" max="359" value="' + l.b + '" data-i="' + i + '" data-k="b">' +
          '<label for="mar-lp' + i + '">Paces</label><input id="mar-lp' + i + '" type="number" inputmode="numeric" min="1" max="99" value="' + l.p + '" data-i="' + i + '" data-k="p">' +
          '</div>';
      }).join('');
    }
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="compass">← Compass</button></div>' +
      '<h2 class="mar-game-h">🏴‍☠️ Backyard treasure hunt</h2>' +
      '<section class="mar-card"><h3>For the grown-up</h3>' +
        '<p>Hide a “treasure” outside. From a starting spot, walk to it in 3 to 5 straight legs and write down each leg’s compass bearing and number of paces. The kids follow the same legs to find it.</p>' +
        '<div id="mar-legs">' + rows() + '</div>' +
        '<div class="mar-row"><button type="button" class="mar-btn" id="mar-add">+ Add leg</button><button type="button" class="mar-btn" id="mar-del">− Remove leg</button></div>' +
      '</section>' +
      '<div class="mar-row mar-center"><button type="button" class="mar-btn mar-btn-brass mar-btn-lg" id="mar-start">Start the hunt ⚓</button></div>' +
      '<p class="mar-hint mar-center">On a phone or tablet the hunt can use the device’s own compass. Otherwise, use a real compass — or ask a grown-up which way is North.</p>';
    render('compass', html, function(r) {
      function bind() {
        $all('#mar-legs input', r).forEach(function(inp) {
          inp.addEventListener('change', function() {
            var i = +inp.getAttribute('data-i'), k = inp.getAttribute('data-k');
            var v = Math.round(parseFloat(inp.value) || 0);
            v = k === 'b' ? ((v % 360) + 360) % 360 : Math.max(1, Math.min(99, v));
            legs[i][k] = v; inp.value = v; _huntSave(legs);
          });
        });
      }
      bind();
      $('#mar-add', r).addEventListener('click', function() {
        if (legs.length >= 5) return toast('Five legs is the most.');
        legs.push({ b: 0, p: 5 }); _huntSave(legs); $('#mar-legs', r).innerHTML = rows(); bind();
      });
      $('#mar-del', r).addEventListener('click', function() {
        if (legs.length <= 3) return toast('A hunt needs at least three legs.');
        legs.pop(); _huntSave(legs); $('#mar-legs', r).innerHTML = rows(); bind();
      });
      $('#mar-start', r).addEventListener('click', function() { _huntSave(legs); go('huntRun', legs); });
    });
  }

  function startDeviceCompass(onHeading, onFail) {
    var got = false, handler, evName = null;
    function screenAngle() { try { return (screen.orientation && screen.orientation.angle) || window.orientation || 0; } catch (e) { return 0; } }
    handler = function(e) {
      var h = null;
      if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) h = e.webkitCompassHeading;
      else if (e.absolute && e.alpha != null) h = (360 - e.alpha) % 360;
      if (h == null) return;
      got = true;
      onHeading((h + screenAngle() + 360) % 360);
    };
    function listen() {
      evName = ('ondeviceorientationabsolute' in window) ? 'deviceorientationabsolute' : 'deviceorientation';
      window.addEventListener(evName, handler);
      setTimeout(function() { if (!got) onFail('No compass reading from this device.'); }, 2500);
    }
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(function(s) {
          if (s === 'granted') listen(); else onFail('Compass permission was not given.');
        }).catch(function() { onFail('Compass permission was not given.'); });
      } else if (window.DeviceOrientationEvent) listen();
      else onFail('This device has no compass.');
    } catch (e) { onFail('This device has no compass.'); }
    return function() { if (evName) window.removeEventListener(evName, handler); };
  }

  function viewHuntRun(legs) {
    legs = legs || _huntLoad();
    var st = { i: 0, live: false, dev: null, shown: 0, vel: 0 };
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="hunt">← Hunt set-up</button></div>' +
      '<h2 class="mar-game-h">🏴‍☠️ Treasure hunt</h2>' +
      '<div class="mar-quiz"><div class="mar-quiz-vis"><canvas id="mar-hcv" role="img" aria-label="Compass for the hunt"></canvas></div>' +
      '<div class="mar-quiz-side"><div class="mar-leg-big" id="mar-legbig"></div>' +
        '<p class="mar-fb" id="mar-face" aria-live="polite"></p>' +
        '<div class="mar-row"><button type="button" class="mar-btn mar-btn-brass mar-btn-lg" id="mar-walked">I walked it ✔</button></div>' +
        '<div class="mar-row"><button type="button" class="mar-btn" id="mar-live">📱 Use this device’s compass</button></div>' +
        '<p class="mar-hint" id="mar-mode"></p><div class="mar-progress" id="mar-prog"></div></div></div>';
    render('compass', html, function(r) {
      var cv = $('#mar-hcv', r);
      function size() { return Math.min(r.clientWidth > 640 ? 380 : r.clientWidth - 8, 420); }
      function draw() {
        var leg = legs[st.i];
        var s = size(), f = A.fitCanvas(cv, s, s);
        if (!f.ctx) return;
        f.ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); f.ctx.clearRect(0, 0, s, s);
        if (st.live) A.drawCompass(f.ctx, s / 2, s / 2, s * 0.48, st.shown, { dpr: f.dpr, target: leg.b, tilt: st.vel * 0.02 });
        else A.drawCompass(f.ctx, s / 2, s / 2, s * 0.48, 0, { dpr: f.dpr, pointer: leg.b, lubber: false, letters: 'all' });
      }
      function show() {
        var leg = legs[st.i];
        $('#mar-legbig', r).innerHTML = '<span>Leg ' + (st.i + 1) + ' of ' + legs.length + '</span>' +
          '<b>Face ' + pad3(leg.b) + '°</b> <em>' + pointName(leg.b) + '</em><b>Walk ' + leg.p + ' paces</b>';
        $('#mar-prog', r).textContent = legs.map(function(l, i) { return i < st.i ? '✔' : i === st.i ? '➤' : '○'; }).join(' ');
        $('#mar-mode', r).textContent = st.live
          ? 'Hold the device flat, top pointing ahead. Turn until the green marker is under the red line.'
          : 'Manual mode: find North with a real compass (or ask a grown-up), then face the orange arrow and walk.';
        draw();
      }
      setFrame(function(dt) {
        if (!st.live) return false;
        var d = angDiff(st.dev, st.shown);
        st.vel += (d * 18 - st.vel * 5) * dt;
        st.shown = (st.shown + st.vel * dt + 360) % 360;
        var err = angDiff(legs[st.i].b, st.dev);
        $('#mar-face', r).innerHTML = Math.abs(err) <= 10 ? '<span class="mar-ok">✔ Facing the right way — start walking!</span>'
          : '<span class="mar-off">Turn ' + (err > 0 ? 'RIGHT ▶' : '◀ LEFT') + ' (' + Math.round(Math.abs(err)) + '°)</span>';
        draw();
        return true;
      });
      var stopDev = null;
      $('#mar-live', r).addEventListener('click', function() {
        var btn = this;
        btn.disabled = true; btn.textContent = 'Asking for the compass…';
        stopDev = startDeviceCompass(function(h) {
          if (!st.live) { st.live = true; st.shown = h; btn.textContent = '📱 Live compass on'; show(); kick(); }
          st.dev = h;
        }, function(msg) {
          btn.disabled = false; btn.textContent = '📱 Use this device’s compass';
          toast(msg + ' Using manual mode.');
        });
      });
      onLeave(function() { if (stopDev) stopDev(); });
      $('#mar-walked', r).addEventListener('click', function() {
        _sound('click');
        st.i++;
        if (st.i < legs.length) { show(); return; }
        data.hunts = (data.hunts || 0) + 1;
        _save(data); _refreshStars();
        if (typeof ActivityLog !== 'undefined') ActivityLog.log('Marinero', '🏴‍☠️', 'Finished a ' + legs.length + '-leg compass treasure hunt');
        celebrate(Math.min(3, data.hunts), 'Treasure found! 🏴‍☠️', 'Hunt number ' + data.hunts + ' — great navigating.');
        $('#mar-legbig', r).innerHTML = '<b>X marks the spot!</b>';
        $('#mar-walked', r).disabled = true;
        $('#mar-face', r).textContent = '';
      });
      show();
      onLeave(_onResize(draw));
    });
  }

  // ---------------------------------------------------------------
  // BUOYS
  // ---------------------------------------------------------------
  function buoyTier() { return tier === 'beginner' ? 1 : tier === 'intermediate' ? 2 : 3; }

  function viewBuoys() {
    var html = '<div class="mar-sec-head"><h2>🛟 Buoys &amp; lights · Boyas</h2>' +
      '<p>Chile uses the <b>IALA Region B</b> system. Coming <b>into</b> port, keep <b class="mar-red">red to starboard</b> (right) and <b class="mar-green">green to port</b> (left). In Europe (Region A) it is the other way round!</p></div>' +
      '<div class="mar-row mar-center"><button type="button" class="mar-btn mar-btn-brass mar-btn-lg" id="mar-bq">Which side do I pass? — Quiz ' + starRow(data.best.buoys || 0) + '</button></div>' +
      '<div class="mar-buoy-grid">' + D.BUOYS.map(function(b) {
        return '<article class="mar-buoy-card' + (b.tier > buoyTier() ? ' mar-later' : '') + '">' +
          '<canvas class="mar-buoy-cv" data-buoy="' + b.id + '" role="img" aria-label="' + esc(b.en) + '"></canvas>' +
          '<h3>' + esc(b.en) + '</h3><p class="mar-es">' + esc(b.es) + '</p>' +
          '<p class="mar-bshape">' + esc(b.shape) + '</p><p><b>Pass:</b> ' + esc(b.pass) + '</p><p class="mar-blight">💡 ' + esc(b.light) + '</p>' +
          '</article>';
      }).join('') + '</div>' +
      '<p class="mar-hint">Cardinal lights tell the time: East flashes 3 (3 o’clock), South 6, West 9, North never stops.</p>';
    render('buoys', html, function(r) {
      $('#mar-bq', r).addEventListener('click', function() { _sound('click'); go('buoyQuiz'); });
      var cvs = $all('[data-buoy]', r);
      var visible = {};
      var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es) {
        es.forEach(function(e) { visible[e.target.getAttribute('data-buoy')] = e.isIntersecting; });
      }) : null;
      cvs.forEach(function(c) { if (io) io.observe(c); else visible[c.getAttribute('data-buoy')] = true; });
      onLeave(function() { if (io) io.disconnect(); });
      var acc = 0;
      setFrame(function(dt, t) {
        acc += dt;
        if (acc < 1 / 20) return true; // 20 fps is plenty for gently bobbing buoys
        acc = 0;
        cvs.forEach(function(c, i) {
          var id = c.getAttribute('data-buoy');
          if (visible[id] === false) return;
          var w = c.clientWidth || 200, h = Math.round(w * 0.82);
          var f = A.fitCanvas(c, w, h), ctx = f.ctx;
          if (!ctx) return;
          ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
          var hz = 0.4;
          var hb = A.harbourBackdrop(w, h, f.dpr, hz);
          if (hb) ctx.drawImage(hb, 0, 0, w, h);
          A.drawSea(ctx, w, h, t, hz);
          A.drawBuoy(ctx, id, w / 2, h * 0.76, h * 0.26, t, { seed: i * 1.3 });
        });
        return true;
      });
    });
  }

  function viewBuoyQuiz() {
    var bt = buoyTier();
    var TOTAL = 8;
    var pool = [];
    // lateral marks: entering (all), leaving (older)
    ['port', 'stbd'].forEach(function(t) {
      pool.push({ k: 'lat', t: t, dir: 'enter' }, { k: 'lat', t: t, dir: 'enter' });
      if (bt >= 3) pool.push({ k: 'lat', t: t, dir: 'leave' });
    });
    if (bt >= 2) ['danger', 'safe', 'special'].forEach(function(t) { pool.push({ k: 'mean', t: t }); });
    if (bt >= 3) ['north', 'east', 'south', 'west'].forEach(function(t) { pool.push({ k: 'card', t: t }); });
    var qs = [], bag = shuffle(pool.slice());
    for (var i = 0; i < TOTAL; i++) { if (!bag.length) bag = shuffle(pool.slice()); qs.push(bag.pop()); }
    var st = { i: 0, right: 0, locked: false, anim: 0, pass: 0, crash: 0, q: null, t0: 0 };
    var MEAN = {
      danger: ['Danger right here — keep well clear', 'Safe water all around — the way in', 'A special area — check the chart', 'Keep it on your port side'],
      safe: ['Safe water all around — the way in', 'Danger right here — keep well clear', 'A special area — check the chart', 'Keep it on your starboard side'],
      special: ['A special area — check the chart', 'Danger right here — keep well clear', 'Safe water all around — the way in', 'Keep it on your port side']
    };

    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="buoys">← Buoys</button></div>' +
      '<h2 class="mar-game-h">🛟 Which side do I pass?</h2>' +
      '<div class="mar-stage mar-stage-sea"><canvas id="mar-bcv" role="img" aria-label="View from the bow of a small boat with a buoy ahead"></canvas>' +
        '<div class="mar-step-cap" id="mar-q" aria-live="polite"></div></div>' +
      '<div class="mar-opts mar-opts-row" id="mar-opts"></div>' +
      '<p class="mar-fb" id="mar-fb" aria-live="polite"></p><div class="mar-progress" id="mar-prog"></div>';
    render('buoys', html, function(r) {
      var cv = $('#mar-bcv', r);
      var tNow = 0;
      setFrame(function(dt, t) {
        tNow = t;
        var w = cv.parentNode.clientWidth, h = Math.round(w * (w < 560 ? 0.8 : 0.56));
        var f = A.fitCanvas(cv, w, h), ctx = f.ctx;
        if (!ctx) return;
        ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
        var hz = 0.4;
        var hb = A.harbourBackdrop(w, h, f.dpr, hz);
        if (hb) ctx.drawImage(hb, 0, 0, w, h);
        A.drawSea(ctx, w, h, t, hz);
        var q = st.q;
        if (q) {
          if (st.anim > 0) st.anim = Math.min(1, st.anim + dt / 1.6);
          var a = st.anim, e = a * a;
          // the buoy comes closer and slides to one side as the boat passes it
          var bx = w / 2 + st.pass * e * w * 0.55;
          var by = h * (0.6 + e * 0.25);
          var bs = h * (0.13 + e * 0.22);
          if (st.crash && a > 0.5) bx = w / 2 + st.pass * 0.15 * w;
          A.drawBuoy(ctx, q.t, bx, by, bs, t, { seed: 1 });
          if (st.crash && a > 0.45) {
            // shallow water: breaking waves on rocks
            ctx.fillStyle = 'rgba(70,65,55,0.95)';
            for (var k = -3; k <= 3; k++) {
              var rx = w / 2 + k * w * 0.05 - st.pass * w * 0.1, ry = h * 0.86 + Math.abs(k) * 4;
              ctx.beginPath(); ctx.ellipse(rx, ry, w * 0.035, h * 0.03, 0, Math.PI, 0); ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for (var k2 = 0; k2 < 14; k2++) ctx.fillRect(w * (0.32 + Math.random() * 0.36), h * (0.84 + Math.random() * 0.05), 6, 2);
          }
          if (q.k === 'card') {
            ctx.save();
            ctx.font = '800 ' + Math.round(h * 0.034) + 'px "Baloo 2", sans-serif'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
            ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.textAlign = 'center';
            ctx.textAlign = 'left';
            ctx.fillText('▲ N  North is ahead', w * 0.03, h * 0.08);
            ctx.restore();
          }
        }
        var sway = Math.sin(t * 0.9) * 0.6;
        A.drawBow(ctx, w, h, st.crash && st.anim > 0.45 ? Math.sin(t * 40) * 1.5 : sway);
        return true;
      });
      function ask() {
        var q = st.q = qs[st.i];
        st.anim = 0; st.pass = 0; st.crash = 0; st.locked = false;
        var B = D.BUOYS.filter(function(b) { return b.id === q.t; })[0];
        var opts;
        if (q.k === 'lat') {
          $('#mar-q', r).innerHTML = 'You are <b>' + (q.dir === 'enter' ? 'ENTERING port ⬆ (coming in from the sea)' : 'LEAVING port ⬆ (heading out to sea)') + '</b>. Which way do you steer around this ' + (q.t === 'stbd' ? '<b class="mar-red">red</b>' : '<b class="mar-green">green</b>') + ' buoy?';
          opts = [{ v: -1, t: '◀ Pass to the LEFT of it' }, { v: 1, t: 'Pass to the RIGHT of it ▶' }];
        } else if (q.k === 'card') {
          $('#mar-q', r).innerHTML = 'North is straight ahead. On which side of this ' + esc(B.en.toLowerCase()) + ' is the safe water?';
          opts = ['north', 'east', 'south', 'west'].map(function(d) { return { v: d, t: 'Pass ' + d.toUpperCase() + ' of it' }; });
        } else {
          $('#mar-q', r).innerHTML = 'What does this buoy tell you?';
          opts = shuffle(MEAN[q.t].map(function(m, i) { return { v: i === 0 ? 'ok' : 'no' + i, t: m }; }));
        }
        $('#mar-opts', r).innerHTML = opts.map(function(o) { return '<button type="button" class="mar-opt mar-opt-big" data-v="' + o.v + '">' + o.t + '</button>'; }).join('');
        $('#mar-fb', r).textContent = '';
        $('#mar-prog', r).innerHTML = 'Buoy ' + (st.i + 1) + ' of ' + TOTAL + ' · ✔ ' + st.right;
        $all('.mar-opt', r).forEach(function(b) {
          b.addEventListener('click', function() { answer(b, q, B); });
        });
      }
      function answer(btn, q, B) {
        if (st.locked) return;
        st.locked = true;
        var v = btn.getAttribute('data-v'), ok, why;
        if (q.k === 'lat') {
          // Region B: entering, red stays to starboard -> the boat passes to the LEFT of a red buoy.
          var keepRight = (q.t === 'stbd') === (q.dir === 'enter');
          var correct = keepRight ? -1 : 1;
          ok = +v === correct;
          st.pass = -(+v); // the buoy slides the opposite way to the boat
          why = (q.t === 'stbd' ? 'Red' : 'Green') + ' marks the ' + (q.t === 'stbd' ? 'starboard' : 'port') + ' side coming IN. ' +
            (q.dir === 'enter' ? '' : 'Going OUT, it is the other way round. ') +
            'So keep it on your ' + (keepRight ? 'RIGHT (starboard)' : 'LEFT (port)') + ' — pass to its ' + (correct < 0 ? 'left' : 'right') + '.';
        } else if (q.k === 'card') {
          ok = v === q.t;
          st.pass = (v === 'east') ? -1 : (v === 'west') ? 1 : (v === 'north' ? -0.4 : 0.4);
          why = B.en + ': ' + B.pass;
        } else {
          ok = v === 'ok';
          st.pass = 1;
          why = B.en + ': ' + B.pass;
        }
        st.crash = ok ? 0 : (q.k === 'mean' ? 0 : 1);
        st.anim = 0.001;
        btn.classList.add(ok ? 'ok' : 'bad');
        if (ok) { st.right++; _sound('correct'); } else _sound('wrong');
        $('#mar-fb', r).innerHTML = (ok ? '✔ Right! ' : (st.crash ? '✘ Shallow water — crunch! ' : '✘ Not quite. ')) + esc(why);
        setTimeout(next, ok ? 2000 : 3400);
      }
      function next() {
        st.i++;
        if (st.i < TOTAL) return ask();
        st.q = null;
        var stars = starsFor(st.right, TOTAL);
        recordBest('buoys', stars, 'Buoy quiz: ' + st.right + '/' + TOTAL);
        celebrate(stars, st.right + ' of ' + TOTAL + ' buoys passed safely!', 'Red to starboard coming in — Region B');
        $('#mar-q', r).textContent = 'Round finished.';
        $('#mar-opts', r).innerHTML = '<button type="button" class="mar-btn mar-btn-navy" id="mar-again">Play again</button>';
        $('#mar-again', r).addEventListener('click', function() { go('buoyQuiz'); });
      }
      ask();
    });
  }

  // ---------------------------------------------------------------
  // SIGNAL FLAGS
  // ---------------------------------------------------------------
  function viewFlags() {
    var html = '<div class="mar-sec-head"><h2>🚩 Signal flags · Banderas</h2>' +
      '<p>The <b>International Code of Signals</b>: one flag for each letter. Flown alone, many have a special meaning that every ship understands.</p></div>' +
      '<div class="mar-row mar-center">' +
        '<button type="button" class="mar-btn mar-btn-brass mar-btn-lg" id="mar-fq">Flash cards ' + starRow(data.best.flags || 0) + '</button>' +
        '<button type="button" class="mar-btn mar-btn-navy mar-btn-lg" id="mar-sp">Spell your name</button></div>' +
      '<div class="mar-flag-detail" id="mar-fd" aria-live="polite"></div>' +
      '<div class="mar-flag-grid">' + D.FLAGS.map(function(f) {
        return '<button type="button" class="mar-flag-card" data-f="' + f.L + '">' + A.flagSVG(f.L, { w: 96, still: true, label: 'Flag ' + f.name }) +
          '<span class="mar-flag-l">' + f.L + '</span><span class="mar-flag-n">' + f.name + '</span></button>';
      }).join('') + '</div>';
    render('flags', html, function(r) {
      $('#mar-fq', r).addEventListener('click', function() { _sound('click'); go('flagQuiz'); });
      $('#mar-sp', r).addEventListener('click', function() { _sound('click'); go('spell'); });
      function detail(L) {
        var f = D.FLAGS.filter(function(x) { return x.L === L; })[0];
        $('#mar-fd', r).innerHTML = '<div class="mar-fd-flag">' + A.flagSVG(L, { w: 220, label: 'Flag ' + f.name }) + '</div>' +
          '<div class="mar-fd-txt"><h3>' + L + ' · ' + f.name + '</h3>' +
          (f.meaning ? '<p>Flown alone: <b>“' + esc(f.meaning) + '”</b></p>' : '<p>Used to spell words; no special meaning when flown alone.</p>') + '</div>';
      }
      $all('[data-f]', r).forEach(function(b) {
        b.addEventListener('click', function() { _sound('click'); detail(b.getAttribute('data-f')); $all('[data-f]', r).forEach(function(x) { x.classList.toggle('on', x === b); }); });
      });
      detail('O');
    });
  }

  function viewFlagQuiz() {
    var TOTAL = 8;
    var withMeaning = D.FLAGS.filter(function(f) { return f.meaning; });
    var easy = 'ABCDEHIKLNOPQSTUXZ'.split('');
    var qs = [];
    var older = isOlder();
    var pool = shuffle((older ? D.FLAGS : D.FLAGS.filter(function(f) { return easy.indexOf(f.L) >= 0; })).slice());
    for (var i = 0; i < TOTAL; i++) {
      var useMeaning = older && i % 2 === 1;
      if (useMeaning) {
        var m = withMeaning[Math.floor(Math.random() * withMeaning.length)];
        qs.push({ k: 'meaning', f: m });
      } else qs.push({ k: 'letter', f: pool[i % pool.length] });
    }
    var st = { i: 0, right: 0, locked: false };
    var nOpts = tier === 'beginner' ? 3 : 4;
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="flags">← Flags</button></div>' +
      '<h2 class="mar-game-h">🚩 Flag flash cards</h2>' +
      '<div class="mar-flagq"><div class="mar-flagq-vis" id="mar-fv"></div>' +
      '<div class="mar-quiz-side"><p class="mar-q" id="mar-q"></p><div class="mar-opts" id="mar-opts"></div>' +
      '<p class="mar-fb" id="mar-fb" aria-live="polite"></p><div class="mar-progress" id="mar-prog"></div></div></div>';
    render('flags', html, function(r) {
      function ask() {
        var q = qs[st.i]; st.locked = false;
        var others;
        if (q.k === 'letter') {
          $('#mar-fv', r).innerHTML = A.flagSVG(q.f.L, { w: 260, label: 'Which flag is this?' });
          $('#mar-q', r).textContent = 'Which letter is this flag?';
          others = shuffle(D.FLAGS.filter(function(f) { return f.L !== q.f.L; })).slice(0, nOpts - 1);
          $('#mar-opts', r).innerHTML = shuffle([q.f].concat(others)).map(function(f) {
            return '<button type="button" class="mar-opt mar-opt-big" data-v="' + f.L + '"><b>' + f.L + '</b><small>' + f.name + '</small></button>';
          }).join('');
        } else {
          $('#mar-fv', r).innerHTML = '<div class="mar-meaning">“' + esc(q.f.meaning) + '”</div>';
          $('#mar-q', r).textContent = 'Which flag, flown alone, means this?';
          others = shuffle(withMeaning.filter(function(f) { return f.L !== q.f.L; })).slice(0, 3);
          $('#mar-opts', r).innerHTML = '<div class="mar-flag-opts">' + shuffle([q.f].concat(others)).map(function(f) {
            return '<button type="button" class="mar-opt mar-opt-flag" data-v="' + f.L + '">' + A.flagSVG(f.L, { w: 110, still: true, label: 'Flag ' + f.name }) + '<small>' + f.L + '</small></button>';
          }).join('') + '</div>';
        }
        $('#mar-fb', r).textContent = '';
        $('#mar-prog', r).innerHTML = 'Card ' + (st.i + 1) + ' of ' + TOTAL + ' · ✔ ' + st.right;
        $all('.mar-opt', r).forEach(function(b) {
          b.addEventListener('click', function() {
            if (st.locked) return;
            st.locked = true;
            var ok = b.getAttribute('data-v') === q.f.L;
            if (ok) { st.right++; b.classList.add('ok'); _sound('correct'); }
            else { b.classList.add('bad'); _sound('wrong'); $all('.mar-opt', r).forEach(function(x) { if (x.getAttribute('data-v') === q.f.L) x.classList.add('ok'); }); }
            $('#mar-fb', r).innerHTML = (ok ? '✔ ' : '✘ ') + '<b>' + q.f.L + ' · ' + q.f.name + '</b>' + (q.f.meaning ? ' — “' + esc(q.f.meaning) + '”' : '');
            setTimeout(next, ok ? 1400 : 2600);
          });
        });
      }
      function next() {
        st.i++;
        if (st.i < TOTAL) return ask();
        var stars = starsFor(st.right, TOTAL);
        recordBest('flags', stars, 'Signal flags: ' + st.right + '/' + TOTAL);
        celebrate(stars, st.right + ' of ' + TOTAL + ' flags!', 'International Code of Signals');
        $('#mar-q', r).textContent = 'Round finished.';
        $('#mar-fv', r).innerHTML = A.flagSVG('C', { w: 220, label: 'Flag C — yes' });
        $('#mar-opts', r).innerHTML = '<button type="button" class="mar-btn mar-btn-navy" id="mar-again">Play again</button>';
        $('#mar-again', r).addEventListener('click', function() { go('flagQuiz'); });
      }
      ask();
    });
  }

  function viewSpell() {
    var first = user && user.name ? String(user.name).split(/\s+/)[0] : 'MARINERO';
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="flags">← Flags</button></div>' +
      '<h2 class="mar-game-h">🚩 Spell your name in flags</h2>' +
      '<div class="mar-spell-in"><label for="mar-word">Word to hoist</label>' +
      '<input id="mar-word" type="text" maxlength="16" autocomplete="off" autocapitalize="characters" value="' + esc(first) + '"></div>' +
      '<div class="mar-hoist" id="mar-hoist" aria-live="polite"></div>' +
      '<p class="mar-hint">Ships hoist flags in a column from the top down. Letters with accents use the plain letter (Á → A, Ñ → N).</p>';
    render('flags', html, function(r) {
      var inp = $('#mar-word', r);
      function plain(s) {
        return String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z ]/g, '');
      }
      function draw() {
        var word = plain(inp.value).trim();
        var parts = word.split(/\s+/).filter(Boolean);
        if (!parts.length) { $('#mar-hoist', r).innerHTML = '<p class="mar-hint">Type a word with letters A–Z.</p>'; return; }
        $('#mar-hoist', r).innerHTML = parts.map(function(p) {
          return '<div class="mar-hoist-col"><div class="mar-mast" aria-hidden="true"></div>' + p.split('').map(function(L) {
            var f = D.FLAGS.filter(function(x) { return x.L === L; })[0];
            return '<div class="mar-hoist-f">' + A.flagSVG(L, { w: 92, label: 'Flag ' + f.name }) + '<span>' + L + '</span></div>';
          }).join('') + '</div>';
        }).join('');
      }
      inp.addEventListener('input', draw);
      draw();
    });
  }

  // ---------------------------------------------------------------
  // CHART WORK
  // ---------------------------------------------------------------
  function viewChart() {
    var C = D.CHART;
    var P = {}; C.places.forEach(function(p) { P[p.id] = p; });
    var routes = [['muelle', 'faro'], ['muelle', 'boca'], ['fondeo', 'faro'], ['isla', 'muelle'], ['boca', 'faro'], ['roja', 'lobera'], ['verde', 'isla'], ['fondeo', 'boca']];
    var TOTAL = 3;
    var tasks = shuffle(routes.slice()).slice(0, TOTAL).map(function(rt) {
      var a = P[rt[0]], b = P[rt[1]];
      var d = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
      return { a: a, b: b, d: Math.round(d * 10) / 10, v: pick([4, 5, 6, 8, 10, 12]) };
    });
    var young = age < 10;
    var st = { i: 0, phase: 'measure', right: 0, A: null, B: null, drag: -1, onA: false, onB: false };
    var html = '<div class="mar-crumbs"><button type="button" class="mar-link" data-go="home">← Marinero</button></div>' +
      '<div class="mar-sec-head"><h2>🗺️ Chart work · Carta</h2>' +
      '<p>On a chart, <b>1 minute of latitude = 1 nautical mile</b> (1,852 m). Measure with the dividers, then read the distance on the <b>latitude scale</b> at the side. Speed is in <b>knots</b>: 1 knot = 1 nautical mile per hour.</p>' +
      (young ? '<p class="mar-tag mar-tag-inline">Best for ages 10+ — extra help is switched on.</p>' : '') + '</div>' +
      '<div class="mar-task" id="mar-task" aria-live="polite"></div>' +
      '<div class="mar-stage mar-stage-chart"><canvas id="mar-ccv" role="img" aria-label="Practice nautical chart of a fictional bay, with dividers"></canvas></div>' +
      '<div class="mar-opts mar-opts-row" id="mar-opts"></div>' +
      '<p class="mar-fb" id="mar-fb" aria-live="polite"></p><div class="mar-progress" id="mar-prog"></div>';
    render('chart', html, function(r) {
      var cv = $('#mar-ccv', r);
      var L = null, w = 0, h = 0, dpr = 1, img = null;
      function layout() {
        w = cv.parentNode.clientWidth; h = Math.round(w * 0.75);
        var f = A.fitCanvas(cv, w, h); dpr = f.dpr;
        var o = A.chartImage(w, h, dpr, C);
        L = o.layout; img = o.canvas;
      }
      function hingeOf() {
        var a = st.A, b = st.B;
        var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
        var leg = L.ppn * 6.2;
        var hgt = Math.sqrt(Math.max(leg * leg - d * d / 4, 0)) * 0.55 + L.ppn * 0.6;
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        var nx = dy / d, ny = -dx / d;
        if (ny > 0) { nx = -nx; ny = -ny; }
        return [mx + nx * hgt, my + ny * hgt];
      }
      function draw() {
        // the chart image can be freed under memory pressure: make it again
        if (!img || !img.width) layout();
        var ctx = ZsCanvas.get2d(cv);
        if (!ctx || !L) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (img) ctx.drawImage(img, 0, 0, w, h);
        var t = tasks[st.i];
        if (t) {
          [t.a, t.b].forEach(function(p, k) {
            var q = L.toPx(p.x, p.y);
            ctx.beginPath(); ctx.arc(q[0], q[1], L.ppn * 0.42, 0, TAU);
            ctx.lineWidth = 3; ctx.strokeStyle = (k === 0 ? st.onA : st.onB) ? 'rgba(22,163,74,0.95)' : 'rgba(234,88,12,0.9)'; ctx.stroke();
          });
        }
        // highlight the latitude scale when it is time to use it
        if (st.phase === 'scale') {
          ctx.fillStyle = 'rgba(234,179,8,0.25)';
          ctx.fillRect(L.latScale.x0 - 4, L.oy, L.latScale.x1 - L.latScale.x0 + 8, C.hNM * L.ppn);
        }
        var hg = hingeOf();
        A.drawDividers(ctx, st.A, st.B, hg, L.ppn * 1.5, st.drag);
        if (st.phase === 'answer' || st.phase === 'time') {
          var dNM = Math.abs(st.A[1] - st.B[1]) / L.ppn;
          if (young) {
            ctx.font = '800 ' + Math.round(L.ppn * 0.45) + 'px Nunito, sans-serif';
            ctx.fillStyle = '#0b2545'; ctx.textAlign = 'left';
            ctx.fillText('≈ ' + dNM.toFixed(1) + "'", L.latScale.x1 + 6, (st.A[1] + st.B[1]) / 2);
          }
        }
      }
      function startTask() {
        var t = tasks[st.i];
        st.phase = 'measure'; st.onA = st.onB = false;
        var c0 = L.toPx(C.wNM * 0.55, C.hNM * 0.45);
        st.A = [c0[0] - L.ppn * 1.2, c0[1] + L.ppn * 0.6];
        st.B = [c0[0] + L.ppn * 1.2, c0[1] + L.ppn * 0.6];
        $('#mar-task', r).innerHTML = '<b>Leg ' + (st.i + 1) + ' of ' + TOTAL + ':</b> How far is it from <b>' + esc(t.a.name) + '</b> to <b>' + esc(t.b.name) + '</b>?<br>' +
          '① Drag the two dividers points onto the orange circles.';
        $('#mar-opts', r).innerHTML = '';
        $('#mar-fb', r).textContent = '';
        $('#mar-prog', r).innerHTML = 'Leg ' + (st.i + 1) + ' of ' + TOTAL + ' · ✔ ' + st.right + ' answers right';
        draw();
      }
      function checkMeasure() {
        var t = tasks[st.i];
        var pa = L.toPx(t.a.x, t.a.y), pb = L.toPx(t.b.x, t.b.y), tol = L.ppn * 0.45;
        function near(p, q) { return Math.abs(p[0] - q[0]) < tol && Math.abs(p[1] - q[1]) < tol; }
        // either tip may go on either place
        var swap = near(st.A, pb) || near(st.B, pa);
        var tA = swap ? pb : pa, tB = swap ? pa : pb;
        st.onA = near(st.A, tA); st.onB = near(st.B, tB);
        if (st.onA && st.onB && st.phase === 'measure') {
          st.A = tA.slice(); st.B = tB.slice();
          st.phase = 'scale';
          _sound('correct');
          $('#mar-task', r).innerHTML = '② Great! Now drag the dividers — they keep the same opening and stand upright — onto the <b>latitude scale</b> (the striped band on the left edge).';
        }
      }
      function checkScale() {
        var x0 = L.latScale.x0 - L.ppn * 0.3, x1 = L.latScale.x1 + L.ppn * 0.3;
        var inA = st.A[0] > x0 && st.A[0] < x1, inB = st.B[0] > x0 && st.B[0] < x1;
        if (inA && inB && st.A[1] > L.oy - 2 && st.B[1] > L.oy - 2 && st.A[1] < L.oy + C.hNM * L.ppn + 2 && st.B[1] < L.oy + C.hNM * L.ppn + 2) {
          st.phase = 'answer';
          _sound('correct');
          askDistance();
        }
      }
      function askDistance() {
        var t = tasks[st.i];
        $('#mar-task', r).innerHTML = '③ Count the minutes of latitude between the two points' + (young ? ' (the number next to the dividers helps)' : ' — each small tick is 0.1′') + '. How far is it?';
        var opts = [t.d];
        [-1.6, -0.8, 0.8, 1.6, 2.4].forEach(function(dd) { var x = Math.round((t.d + dd) * 10) / 10; if (x > 0.2) opts.push(x); });
        opts = shuffle([t.d].concat(shuffle(opts.slice(1)).slice(0, 3)));
        $('#mar-opts', r).innerHTML = opts.map(function(x) { return '<button type="button" class="mar-opt mar-opt-big" data-v="' + x + '"><b>' + x.toFixed(1) + '</b><small>nautical miles</small></button>'; }).join('');
        $all('.mar-opt', r).forEach(function(b) {
          b.addEventListener('click', function() {
            if (st.phase !== 'answer') return;
            var ok = Math.abs(+b.getAttribute('data-v') - t.d) < 0.05;
            b.classList.add(ok ? 'ok' : 'bad');
            if (ok) { st.right++; _sound('correct'); } else { _sound('wrong'); $all('.mar-opt', r).forEach(function(x) { if (Math.abs(+x.getAttribute('data-v') - t.d) < 0.05) x.classList.add('ok'); }); }
            $('#mar-fb', r).innerHTML = (ok ? '✔ ' : '✘ ') + 'It is <b>' + t.d.toFixed(1) + ' NM</b> (' + Math.round(t.d * 1852) + ' m).';
            st.phase = 'time';
            setTimeout(askTime, 1300);
          });
        });
      }
      function askTime() {
        var t = tasks[st.i];
        var mins = Math.round(t.d / t.v * 60);
        $('#mar-task', r).innerHTML = '④ Your lancha makes <b>' + t.v + ' knots</b>. How long will the trip take? <span class="mar-es">time = distance ÷ speed</span>';
        var opts = [mins, Math.round(mins * 2), Math.max(1, Math.round(mins / 2)), Math.round(t.v * t.d), mins + 10, Math.max(1, mins - 7)];
        opts = opts.filter(function(x, i, a) { return a.indexOf(x) === i && (i === 0 || x !== mins); });
        opts = shuffle([mins].concat(shuffle(opts.slice(1)).slice(0, 3)));
        $('#mar-opts', r).innerHTML = opts.map(function(x) { return '<button type="button" class="mar-opt mar-opt-big" data-v="' + x + '"><b>' + x + ' min</b></button>'; }).join('');
        $all('.mar-opt', r).forEach(function(b) {
          b.addEventListener('click', function() {
            if (st.phase !== 'time') return;
            st.phase = 'done';
            var ok = +b.getAttribute('data-v') === mins;
            b.classList.add(ok ? 'ok' : 'bad');
            if (ok) { st.right++; _sound('correct'); } else { _sound('wrong'); $all('.mar-opt', r).forEach(function(x) { if (+x.getAttribute('data-v') === mins) x.classList.add('ok'); }); }
            $('#mar-fb', r).innerHTML = (ok ? '✔ ' : '✘ ') + t.d.toFixed(1) + ' NM ÷ ' + t.v + ' kn = ' + (t.d / t.v).toFixed(2) + ' h × 60 = <b>' + mins + ' minutes</b>.';
            setTimeout(function() {
              st.i++;
              if (st.i < TOTAL) return startTask();
              var stars = starsFor(st.right, TOTAL * 2);
              recordBest('chart', stars, 'Chart work: ' + st.right + '/' + (TOTAL * 2));
              celebrate(stars, 'Navigator’s log complete!', st.right + ' of ' + (TOTAL * 2) + ' answers right');
              $('#mar-task', r).innerHTML = 'All legs done.';
              $('#mar-opts', r).innerHTML = '<button type="button" class="mar-btn mar-btn-navy" id="mar-again">New legs</button>';
              $('#mar-again', r).addEventListener('click', function() { go('chart'); });
            }, ok ? 1800 : 3000);
          });
        });
      }
      // dragging: tip A, tip B or the hinge (moves both)
      function pos(e) { var b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
      var last = null;
      cv.addEventListener('pointerdown', function(e) {
        var p = pos(e), hg = hingeOf(), grab = L.ppn * 0.9;
        function dist(q) { return Math.sqrt(Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2)); }
        var dA = dist(st.A), dB = dist(st.B), dH = dist(hg);
        var m = Math.min(dA, dB, dH);
        if (m > grab * 1.6) return;
        st.drag = m === dH ? 2 : m === dA ? 0 : 1;
        if (st.phase === 'scale') {
          // keep the opening: move the whole pair, stood upright like on the scale
          st.drag = 2;
          var mx = (st.A[0] + st.B[0]) / 2, my = (st.A[1] + st.B[1]) / 2;
          var dd = Math.sqrt(Math.pow(st.A[0] - st.B[0], 2) + Math.pow(st.A[1] - st.B[1], 2));
          st.A = [mx, my - dd / 2]; st.B = [mx, my + dd / 2];
        }
        last = p;
        try { cv.setPointerCapture(e.pointerId); } catch (x) {}
        e.preventDefault();
        draw();
      });
      cv.addEventListener('pointermove', function(e) {
        if (st.drag < 0 || !last) return;
        var p = pos(e), dx = p[0] - last[0], dy = p[1] - last[1];
        last = p;
        if (st.drag === 2) {
          // move the pair as one, never squeezing it against the edges
          dx = Math.max(4 - Math.min(st.A[0], st.B[0]), Math.min(w - 4 - Math.max(st.A[0], st.B[0]), dx));
          dy = Math.max(4 - Math.min(st.A[1], st.B[1]), Math.min(h - 4 - Math.max(st.A[1], st.B[1]), dy));
          st.A[0] += dx; st.A[1] += dy; st.B[0] += dx; st.B[1] += dy;
        }
        else {
          var tip = st.drag === 0 ? st.A : st.B, other = st.drag === 0 ? st.B : st.A;
          var nx = tip[0] + dx, ny = tip[1] + dy;
          var d = Math.sqrt(Math.pow(nx - other[0], 2) + Math.pow(ny - other[1], 2));
          if (d < L.ppn * 11.5) { tip[0] = nx; tip[1] = ny; }
        }
        [st.A, st.B].forEach(function(q) { q[0] = Math.max(4, Math.min(w - 4, q[0])); q[1] = Math.max(4, Math.min(h - 4, q[1])); });
        if (st.phase === 'measure') checkMeasure();
        else if (st.phase === 'scale') checkScale();
        draw();
      });
      var up = function() { st.drag = -1; last = null; if (L) draw(); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      layout();
      startTask();
      onLeave(_onResize(function() {
        var oldL = L;
        var a = oldL.toNM(st.A[0], st.A[1]), b = oldL.toNM(st.B[0], st.B[1]);
        layout();
        st.A = L.toPx(a[0], a[1]); st.B = L.toPx(b[0], b[1]);
        draw();
      }));
    });
  }

  // ---------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------
  function init() {
    user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;
    age = user.age || 8;
    tier = typeof getAgeTier === 'function' ? getAgeTier(age) : 'intermediate';
    if (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pull) {
      try { CloudSync.pull(_key()); } catch (e) {}
    }
    data = _load();
    viewHome();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { go: go, _totalStars: totalStars };
})();
