/* ================================================================
   TALLER DE MÁQUINAS ⚙️ — Machine Workshop
   Six simple machines with real numbers, a gear lab, a bicycle,
   challenges, and a chain-reaction builder on an XPBD simulation.

   Per-kid storage: zs_taller_<name>
   { v:1, seen:{ lever:1, pulley:1, …, gears:1, bike:1 },
     ch:{ <challenge id>: best stars 0–3 }, cr:{ <level id>: best stars 0–3 },
     designs:{ <level id>: "type,x,y,a;…" }, last:"YYYY-MM-DD" }
   Stars (mirrors APP_STAR_CONFIGS in js/auth.js): one per machine or
   lab tried, plus the best 0–3 of every challenge and every level.
   ================================================================ */

var Taller = (function() {
  'use strict';

  var Ph = TallerPhysics, D = TallerData, A = TallerArt, SC = TallerScenes;
  var PREFIX = 'zs_taller_';
  var SEEN_IDS = ['lever', 'pulley', 'incline', 'wedge', 'wheel', 'screw', 'gears', 'bike'];
  var TAU = Math.PI * 2;

  // ================================================================
  //  STORAGE
  // ================================================================
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey(PREFIX) : null; }
  function _obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function _load() {
    var key = _key(), d = {};
    if (key) { try { d = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { d = {}; } }
    d = _obj(d);
    d.v = 1; d.seen = _obj(d.seen); d.ch = _obj(d.ch); d.cr = _obj(d.cr); d.designs = _obj(d.designs);
    return d;
  }
  function _save(d) {
    var key = _key();
    if (!key) return;
    d.last = _today();
    try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) { try { CloudSync.push(key); } catch (e) {} }
  }
  function _today() {
    var t = new Date();
    return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  }
  function starsOf(d) {
    var n = 0, k;
    d = d || {};
    SEEN_IDS.forEach(function(id) { if ((d.seen || {})[id]) n++; });
    for (k in (d.ch || {})) n += Math.min(3, Math.max(0, d.ch[k] | 0));
    for (k in (d.cr || {})) n += Math.min(3, Math.max(0, d.cr[k] | 0));
    return n;
  }
  function maxStars() { return SEEN_IDS.length + D.CHALLENGES.length * 3 + D.LEVELS.length * 3; }
  function totalStars(d) { return typeof getAppStars === 'function' ? getAppStars('taller', d) : starsOf(d); }
  function markSeen(id) {
    var d = _load();
    if (d.seen[id]) return false;
    d.seen[id] = 1; _save(d); _refreshNav();
    return true;
  }
  function award(kind, id, stars, label) {
    var d = _load(), box = kind === 'ch' ? d.ch : d.cr, prev = box[id] | 0;
    if (stars > prev) { box[id] = stars; _save(d); _refreshNav(); }
    if (typeof ActivityLog !== 'undefined') { try { ActivityLog.log('Taller de Máquinas', '⚙️', label + ' — ' + stars + ' ★'); } catch (e) {} }
    return prev;
  }
  function _refreshNav() {
    var nav = document.getElementById('zs-star-count');
    if (nav && typeof getTotalStars === 'function') nav.textContent = '⭐ ' + getTotalStars();
  }
  function attemptsToStars(n) { return n <= 1 ? 3 : n <= 3 ? 2 : 1; }

  // ================================================================
  //  HELPERS
  // ================================================================
  function $(id) { return document.getElementById(id); }
  function root() { return $('tm-wrap'); }
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lang() { return typeof getKidLang === 'function' ? getKidLang() : 'en'; }
  function bi(p) { var l = lang(); return l === 'es' ? esc(p[0]) : l === 'en' ? esc(p[1]) : esc(p[0]) + '<span class="tm-en">' + esc(p[1]) + '</span>'; }
  function one(p) { return lang() === 'en' ? p[1] : p[0]; }
  function T(es, en) { return one([es, en]); }
  function speakLang() { return lang() === 'en' ? 'en' : 'es'; }
  function user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function age() { var u = user(); return (u && Number(u.age)) || 8; }
  function tier() { var u = user(); return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate'; }
  function little() { return tier() === 'beginner'; }
  function older() { var t = tier(); return t === 'advanced' || t === 'expert'; }
  function sfx(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function toast(msg) { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg, 2600); }
  function dec(v, d) {
    var p = Math.pow(10, d == null ? 1 : d), r = Math.round(v * p) / p, s = String(r);
    return lang() === 'en' ? s : s.replace('.', ',');
  }
  function num(v) { // kid-friendly: whole numbers when big, one decimal when small
    if (!isFinite(v)) return '∞';
    var a = Math.abs(v);
    var s = a >= 100 ? String(Math.round(v)) : a >= 10 ? dec(v, 1).replace(/[.,]0$/, '') : dec(v, 2).replace(/([.,]\d)0$/, '$1').replace(/[.,]0$/, '');
    if (a >= 1000) s = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, lang() === 'en' ? ',' : '.');
    return s;
  }
  function kgTxt(v) { return num(v) + ' kg'; }
  function newtons(v) { return String(Math.round(v * Ph.G)).replace(/\B(?=(\d{3})+(?!\d))/g, lang() === 'en' ? ',' : '.') + ' N'; }
  function mTxt(v) { return v < 0.1 ? Math.round(v * 1000) + ' mm' : v < 1 ? num(Math.round(v * 100)) + ' cm' : num(v) + ' m'; }
  function starStr(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆'; return s; }
  function say(text) { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.say) { try { ZsSpeak.say(text, speakLang()); } catch (e) {} } }
  function autoSay(text) {
    try { if (typeof ZsTTS !== 'undefined' && ZsTTS.getSettings().mode === 'auto') say(text); } catch (e) {}
  }
  function scanSpeak() { if (typeof ZsSpeak !== 'undefined' && ZsSpeak.scan) { try { ZsSpeak.scan(); } catch (e) {} } }
  function machineDef(id) { for (var i = 0; i < D.MACHINES.length; i++) if (D.MACHINES[i].id === id) return D.MACHINES[i]; return null; }
  function chDef(id) { for (var i = 0; i < D.CHALLENGES.length; i++) if (D.CHALLENGES[i].id === id) return D.CHALLENGES[i]; return null; }
  function levelDef(id) { if (id === 'free') return D.SANDBOX; for (var i = 0; i < D.LEVELS.length; i++) if (D.LEVELS[i].id === id) return D.LEVELS[i]; return null; }
  function leverDef(id) { for (var i = 0; i < D.LEVERS.length; i++) if (D.LEVERS[i].id === id) return D.LEVERS[i]; return D.LEVERS[0]; }

  // ================================================================
  //  STATE + LOOP
  // ================================================================
  var S = { screen: 'home', raf: 0, cv: null, g: null, W: 0, H: 0, dpr: 1, back: null, backKey: '', ro: null, draw: null, tick: null, last: 0 };

  function stop() {
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = 0; S.tick = null; S.draw = null;
    if (S.ro) { try { S.ro.disconnect(); } catch (e) {} S.ro = null; }
    if (typeof ZsSpeak !== 'undefined' && ZsSpeak.stop) { try { ZsSpeak.stop(); } catch (e) {} }
  }
  function loop(ts) {
    S.raf = 0;
    var dt = S.last ? Math.min(0.05, (ts - S.last) / 1000) : 1 / 60;
    S.last = ts;
    var more = S.tick ? S.tick(dt) : false;
    if (S.draw) S.draw();
    if (more) S.raf = requestAnimationFrame(loop);
    else S.last = 0;
  }
  function kick() { if (!S.raf) { S.last = 0; S.raf = requestAnimationFrame(loop); } }
  function redraw() { if (!S.raf && S.draw) S.draw(); }

  function setPage(html) {
    stop();
    ZsCanvas.releaseIn(root());
    if (S.back) { ZsCanvas.release(S.back); S.back = null; S.backKey = ''; }
    root().innerHTML = html;
    window.scrollTo(0, 0);
    _bindBack();
    scanSpeak();
  }
  function topBar(label, back) {
    return '<div class="tm-top"><button type="button" class="tm-back" data-back="' + (back || 'home') + '" aria-label="' + esc(T('Volver', 'Back')) + '">←</button>' +
      '<span class="tm-top-label">' + label + '</span></div>';
  }
  function _bindBack() {
    Array.prototype.forEach.call(root().querySelectorAll('[data-back]'), function(b) {
      b.addEventListener('click', function() {
        sfx('click');
        var t = b.getAttribute('data-back');
        if (t === 'machines') machines(); else if (t === 'challenges') challenges(); else if (t === 'chain') chainList(); else home();
      });
    });
  }

  // Attach a canvas that fills its stage; calls draw on resize.
  function stage(canvasId, aspect, minH, maxH) {
    var cv = $(canvasId);
    if (!cv) return null;
    S.cv = cv;
    function size() {
      var box = cv.parentNode, W = box.clientWidth;
      var H = Math.round(Math.max(minH || 240, Math.min(maxH || 560, W / (aspect || 1.6))));
      var dpr = ZsCanvas.dpr();
      if (W * dpr * H * dpr > 12e6) dpr = 1;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      S.W = W; S.H = H; S.dpr = dpr;
      S.g = ZsCanvas.get2d(cv);
      if (S.g) S.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (S.back) { ZsCanvas.release(S.back); S.back = null; S.backKey = ''; }
      if (S.draw) S.draw();
    }
    size();
    if (typeof ResizeObserver !== 'undefined') {
      var lastW = cv.parentNode.clientWidth;
      S.ro = new ResizeObserver(function() { var w = cv.parentNode.clientWidth; if (Math.abs(w - lastW) > 2) { lastW = w; size(); } });
      S.ro.observe(cv.parentNode);
    }
    return cv;
  }
  // Workshop backdrop, cached per size and floor line.
  function backdrop(floorY, seed, plain) {
    var key = S.W + 'x' + S.H + '@' + Math.round(floorY) + ':' + (seed || 0) + (plain ? 'p' : '');
    if (S.back && S.backKey === key) return S.back;
    if (S.back) ZsCanvas.release(S.back);
    var c = document.createElement('canvas');
    c.width = Math.round(S.W * S.dpr); c.height = Math.round(S.H * S.dpr);
    var g = ZsCanvas.get2d(c);
    if (!g) { S.back = null; return null; }
    g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    A.backdrop(g, S.W, S.H, floorY, seed || 7);
    if (S.W > 520 && !plain) A.pegboard(g, S.W * 0.74, Math.max(14, floorY * 0.08), S.W * 0.2, Math.min(floorY * 0.36, S.W * 0.13));
    S.back = c; S.backKey = key;
    return c;
  }
  function clearCanvas() { if (S.g) { S.g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); S.g.clearRect(0, 0, S.W, S.H); } }
  function pos(e) { var r = S.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  // ================================================================
  //  HOME
  // ================================================================
  function home() {
    S.screen = 'home';
    var d = _load(), total = totalStars(d), max = maxStars();
    var cards = [
      ['machines', '⚖️', ['Seis máquinas simples', 'Six simple machines'], ['Palanca, polea, rampa, cuña, rueda con eje y tornillo. Mueve cosas pesadas y mira los números.', 'Lever, pulley, ramp, wedge, wheel and axle, screw. Move heavy things and see the numbers.'], 'c1'],
      ['gears', '⚙️', ['Engranajes', 'Gears'], ['Junta ruedas dentadas: ¿qué tan rápido y hacia dónde gira la última?', 'Join toothed gears: how fast, and which way, does the last one turn?'], 'c2'],
      ['bike', '🚲', ['La bicicleta', 'The bicycle'], ['Plato, piñón y cadena: elige el cambio y pedalea.', 'Chainring, cog and chain: pick a gear and pedal.'], 'c3'],
      ['challenges', '🏆', ['Desafíos', 'Challenges'], ['«Levanta 100 kg con solo 25 kg de fuerza» y más.', '"Lift 100 kg with only 25 kg of force" and more.'], 'c4'],
      ['chain', '🎳', ['Reacción en cadena', 'Chain reaction'], ['Tablas, dominós, balancines y bolitas: arma una máquina que toque la campana.', 'Planks, dominoes, seesaws and balls: build a machine that rings the bell.'], 'c5']
    ];
    setPage(
      '<div class="tm-home">' +
        '<header class="tm-header"><h1>Taller de Máquinas <span aria-hidden="true">⚙️</span></h1>' +
          '<p class="tm-sub">' + bi(['Máquinas simples, engranajes y reacciones en cadena.', 'Simple machines, gears and chain reactions.']) + '</p></header>' +
        '<div class="tm-hero"><canvas id="tm-hero" role="img" aria-label="' + esc(T('Engranajes de bronce y acero girando en un taller', 'Brass and steel gears turning in a workshop')) + '"></canvas>' +
          '<div class="tm-hero-stat"><b id="tm-total">' + total + '</b> / ' + max + ' ★</div></div>' +
        '<div class="tm-home-grid">' + cards.map(function(c) {
          return '<button type="button" class="tm-home-card tm-' + c[4] + '" data-go="' + c[0] + '">' +
            '<span class="tm-home-icon" aria-hidden="true">' + c[1] + '</span><span class="tm-home-name">' + bi(c[2]) + '</span>' +
            '<span class="tm-home-desc">' + bi(c[3]) + '</span></button>';
        }).join('') + '</div>' +
        '<a class="tm-link-card" href="lab-explorer.html"><span aria-hidden="true">🔬</span><span>' +
          bi(['¿Quieres equilibrar pesas en un balancín? Prueba «Simple Machines» en Lab Explorer.', 'Want to balance weights on a seesaw? Try "Simple Machines" in Lab Explorer.']) + '</span><span aria-hidden="true">→</span></a>' +
      '</div>');
    Array.prototype.forEach.call(root().querySelectorAll('[data-go]'), function(b) {
      b.addEventListener('click', function() {
        sfx('click');
        var g = b.getAttribute('data-go');
        if (g === 'machines') machines(); else if (g === 'gears') gears(); else if (g === 'bike') bike(); else if (g === 'challenges') challenges(); else chainList();
      });
    });
    stage('tm-hero', 2.4, 190, 380);
    var t0 = 0;
    S.draw = function() { heroDraw(t0); };
    S.tick = function(dt) { t0 += dt; return S.screen === 'home' && !document.hidden; };
    kick();
  }

  function heroDraw(t) {
    var g = S.g, W = S.W, H = S.H;
    if (!g) return;
    var fy = H * 0.86, bk = backdrop(fy, 3);
    if (bk) g.drawImage(bk, 0, 0, W, H); else A.backdrop(g, W, H, fy, 3);
    // a gear train on the wall: 40 → 16 → 24 → 12
    var gearsH = [{ teeth: 40 }, { teeth: 16, link: 'mesh' }, { teeth: 24, link: 'mesh' }, { teeth: 12, link: 'mesh' }];
    var lay = Ph.gearLayout(gearsH, 1, [0, 0, -0.5, 0.45, -0.3]);
    var ph = Ph.gearPhases(gearsH, lay), tr = Ph.gearTrain(gearsH, 8);
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    lay.forEach(function(p) { minX = Math.min(minX, p.x - p.r); maxX = Math.max(maxX, p.x + p.r); minY = Math.min(minY, p.y - p.r); maxY = Math.max(maxY, p.y + p.r); });
    var sc = Math.min(W * 0.62 / (maxX - minX), H * 0.8 / (maxY - minY));
    var ox = W * 0.5 - (minX + maxX) / 2 * sc, oy = H * 0.46 + (minY + maxY) / 2 * sc;
    var metals = ['brass', 'steel', 'copper', 'steel'];
    lay.forEach(function(p, k) {
      var ang = -(ph[k] + tr.gears[k].rpm / 60 * TAU * t);
      var px = ox + p.x * sc, py = oy - p.y * sc;
      // wall bracket behind each axle
      g.fillStyle = 'rgba(90,60,30,0.35)'; g.beginPath(); g.arc(px, py, Math.max(6, p.r * sc * 0.28), 0, TAU); g.fill();
      A.drawGear(g, px, py, gearsH[k].teeth, p.r * sc, ang, metals[k]);
    });
    // a crate on the floor and a coil of rope, for scale
    var cs = Math.min(70, H * 0.26);
    A.crate(g, W * 0.12, fy + 2, cs, '50 kg', 9);
    A.crate(g, W * 0.12 + cs * 0.95, fy + 2, cs * 0.62, '', 4);
  }

  // ================================================================
  //  MACHINE LIST
  // ================================================================
  function machines() {
    S.screen = 'machines';
    var d = _load();
    setPage(
      '<div class="tm-page">' + topBar(bi(['Seis máquinas simples', 'Six simple machines'])) +
        '<p class="tm-lead">' + bi(little() ? ['Elige una máquina y hazla funcionar.', 'Pick a machine and make it go.'] :
          ['Cada máquina cambia una fuerza: menos fuerza, pero más camino.', 'Each machine trades force for distance: less force, but a longer way.']) + '</p>' +
        '<div class="tm-mgrid">' + D.MACHINES.map(function(m) {
          return '<button type="button" class="tm-mcard' + (d.seen[m.id] ? ' done' : '') + '" data-m="' + m.id + '">' +
            '<span class="tm-mthumb"><canvas data-thumb="' + m.id + '" aria-hidden="true"></canvas>' + (d.seen[m.id] ? '<span class="tm-check" aria-label="' + esc(T('probada', 'tried')) + '">★</span>' : '') + '</span>' +
            '<span class="tm-mname"><span aria-hidden="true">' + m.icon + '</span> ' + bi(m.name) + '</span>' +
            '<span class="tm-mdesc">' + bi(m.short) + '</span></button>';
        }).join('') + '</div></div>');
    Array.prototype.forEach.call(root().querySelectorAll('[data-m]'), function(b) {
      b.addEventListener('click', function() { sfx('click'); machine(b.getAttribute('data-m')); });
    });
    var thumbs = Array.prototype.slice.call(root().querySelectorAll('[data-thumb]'));
    (function next() {
      var cv = thumbs.shift();
      if (!cv || S.screen !== 'machines') return;
      try { thumb(cv, cv.getAttribute('data-thumb')); } catch (e) {}
      requestAnimationFrame(next);
    })();
  }
  function thumb(cv, kind) {
    var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(ZsCanvas.dpr(), 1.5);
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var g = ZsCanvas.get2d(cv);
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var st = newMachineState(kind, null);
    st.u = 0.55; st.t = 0;
    var res = calc(st), ss = sceneState(st, res);
    ss.showArms = false;
    A.quiet = true;
    try { SC.draw(g, W, H, ss); } finally { A.quiet = false; }
  }

  // ================================================================
  //  ONE MACHINE (free play or a challenge)
  // ================================================================
  // Inputs (sliders and choices) per machine.
  function controlsFor(st) {
    var ch = st.ch, P = st.lever, k = st.kind, c = [];
    function fixed(key) { return ch && ch.setup && ch.setup[key] != null && (key === 'mass' || ch.setup['fix' + key.charAt(0).toUpperCase() + key.slice(1)]); }
    if (k === 'lever') {
      if (P.fulcrum.move) c.push({ key: 'fulcrum', label: ['Punto de apoyo', 'Fulcrum'], min: P.fulcrum.min, max: P.fulcrum.max, step: 0.01, unit: 'm' });
      if (P.load.move) c.push({ key: 'loadPos', label: [P.id === 'barrow' ? 'Dónde va la carga' : 'Carga', 'Where the load sits'], min: P.load.lo, max: P.load.hi, step: 0.01, unit: 'm' });
      if (P.effort.move) c.push({ key: 'effortPos', label: ['Dónde tira tu mano', 'Where your hand pulls'], min: P.effort.lo, max: P.effort.hi, step: 0.01, unit: 'm' });
      if (!ch) c.push({ key: 'mass', label: ['Peso de la carga', 'Load'], min: P.load.min, max: P.load.max, step: P.load.max > 20 ? 5 : 0.5, unit: 'kg' });
    } else if (k === 'pulley') {
      c.push({ key: 'n', label: ['Cuerdas que sostienen', 'Ropes holding the load'], choices: [1, 2, 3, 4, 6] });
      if (!ch) c.push({ key: 'mass', label: ['Peso de la caja', 'Crate'], min: 10, max: 200, step: 5, unit: 'kg' });
    } else if (k === 'incline') {
      if (!fixed('height')) c.push({ key: 'height', label: ['Altura', 'Height'], min: 0.4, max: 1.5, step: 0.05, unit: 'm' });
      c.push({ key: 'length', label: ['Largo de la rampa', 'Ramp length'], min: 1, max: 5, step: 0.1, unit: 'm' });
      if (!ch) c.push({ key: 'mass', label: ['Peso de la caja', 'Crate'], min: 10, max: 150, step: 5, unit: 'kg' });
    } else if (k === 'wedge') {
      c.push({ key: 'length', label: ['Largo de la cuña', 'Wedge length'], min: 0.06, max: 0.4, step: 0.01, unit: 'm' });
      c.push({ key: 'thickness', label: ['Grosor de la cuña', 'Wedge thickness'], min: 0.02, max: 0.12, step: 0.005, unit: 'm' });
    } else if (k === 'wheel') {
      c.push({ key: 'wheelR', label: ['Radio de la rueda (manivela)', 'Wheel (crank) radius'], min: 0.1, max: 0.45, step: 0.01, unit: 'm' });
      if (!fixed('axle')) c.push({ key: 'axleR', label: ['Radio del eje', 'Axle radius'], min: 0.03, max: 0.12, step: 0.005, unit: 'm' });
      if (!ch) c.push({ key: 'mass', label: ['Peso del balde', 'Bucket'], min: 4, max: 40, step: 1, unit: 'kg' });
    } else if (k === 'screw') {
      c.push({ key: 'pitch', label: ['Paso de la rosca', 'Thread pitch'], choices: [0.002, 0.004, 0.006, 0.008, 0.01], unit: 'mm' });
      c.push({ key: 'handleR', label: ['Largo de la manilla', 'Handle length'], min: 0.05, max: 0.4, step: 0.01, unit: 'm' });
    }
    return c;
  }

  function newMachineState(kind, ch, leverId) {
    var st = { kind: kind, ch: ch, u: 0, strain: 0, t: 0, tries: 0, done: false, predicted: null, anim: null };
    var su = (ch && ch.setup) || {};
    if (kind === 'lever') {
      var P = st.lever = leverDef(leverId || (ch && ch.lever) || 'seesaw');
      st.p = { fulcrum: su.fulcrum != null ? su.fulcrum : P.fulcrum.pos, loadPos: su.load != null ? su.load : P.load.pos, effortPos: P.effort.pos, mass: su.mass != null ? su.mass : P.load.mass };
    // free play opens light enough to make it go; challenges open too heavy
    } else if (kind === 'pulley') st.p = { n: su.n || 2, mass: su.mass || 40 };
    else if (kind === 'incline') st.p = { height: su.height || 1, length: su.length || 3, mass: su.mass || 60 };
    else if (kind === 'wedge') st.p = { length: su.length || 0.3, thickness: su.thickness || 0.035, resist: su.resist || 400 };
    else if (kind === 'wheel') st.p = { wheelR: su.wheelR || 0.25, axleR: su.axleR || 0.05, mass: su.mass || 12 };
    else if (kind === 'screw') st.p = { pitch: su.pitch || 0.004, handleR: su.handleR || 0.2, mass: su.mass || 1000 };
    st.strength = ch ? ch.maxEffort : (kind === 'wedge' ? 50 : D.STRENGTH);
    return st;
  }
  function calc(st) {
    var p = st.p;
    if (st.kind === 'lever') return Ph.lever({ fulcrum: p.fulcrum, loadPos: p.loadPos, effortPos: p.effortPos, mass: p.mass, lift: 0.2 });
    if (st.kind === 'pulley') return Ph.pulley({ n: p.n, mass: p.mass, lift: 0.9 });
    if (st.kind === 'incline') { if (p.length < p.height + 0.05) p.length = Math.round((p.height + 0.1) * 10) / 10; return Ph.incline(p); }
    if (st.kind === 'wedge') return Ph.wedge(p);
    if (st.kind === 'wheel') return Ph.wheelAxle({ wheelR: p.wheelR, axleR: p.axleR, mass: p.mass, turns: 3 });
    return Ph.screw({ pitch: p.pitch, handleR: p.handleR, mass: p.mass, turns: 6 });
  }
  function canGo(st, res) { return res.effort <= st.strength + 1e-9; }
  function sceneState(st, res) {
    return { kind: st.kind, p: st.p, res: res, u: st.u, strain: st.strain, t: st.t, lever: st.lever, back: null,
             strength: st.kind === 'wedge' ? res.effort : st.strength, push: st.strength, showArms: !little(),
             armLabel: function(v) { return mTxt(v); }, splitAt: st.splitAt,
             pushLabel: T('Empuje ', 'Push '), ropeLabel: function(n) { return n + ' ' + (n === 1 ? T('cuerda', 'rope') : T('cuerdas', 'ropes')); }, lenLabel: T('largo ', 'length '), thickLabel: T('grosor ', 'thick '), resistLabel: T('El tronco aguanta ', 'Log holds '), pitchLabel: T('paso ', 'pitch ') };
  }

  function hintFor(st, res) {
    var k = st.kind;
    if (k === 'lever') {
      if (st.lever.cls === 1) return T('Acerca el punto de apoyo a la carga.', 'Move the fulcrum closer to the load.');
      if (st.lever.cls === 2) return T('Pon la carga más cerca de la rueda.', 'Put the load closer to the wheel.');
      return T('Tira más lejos de tu otra mano.', 'Pull further from your other hand.');
    }
    if (k === 'pulley') return T('Usa más cuerdas: cada cuerda sostiene una parte.', 'Use more ropes: each one holds a share.');
    if (k === 'incline') return T('Haz la rampa más larga.', 'Make the ramp longer.');
    if (k === 'wedge') return T('Usa una cuña más larga y delgada.', 'Use a longer, thinner wedge.');
    if (k === 'wheel') return T('Una rueda más grande o un eje más delgado.', 'A bigger wheel or a thinner axle.');
    return T('Una manilla más larga o una rosca más fina.', 'A longer handle or a finer thread.');
  }
  function instruction(st) {
    var k = st.kind;
    if (k === 'wheel' || k === 'screw') return T('Gira la manilla con el dedo (o toca «Hacer funcionar»).', 'Turn the handle round with your finger (or tap "Make it go").');
    if (k === 'incline') return T('Arrastra la mano para subir la caja por la rampa.', 'Drag the hand to pull the crate up the ramp.');
    if (k === 'wedge') return T('Arrastra la cuña hacia abajo para partir el tronco.', 'Drag the wedge down to split the log.');
    if (k === 'lever' && st.lever.effort.dir === 'up') return T('Arrastra la mano hacia arriba.', 'Drag the hand up.');
    return T('Arrastra la mano hacia abajo para levantar la carga.', 'Drag the hand down to lift the load.');
  }

  function machine(kind, chId, leverId) {
    var ch = chId ? chDef(chId) : null;
    var M = machineDef(kind);
    var st = newMachineState(kind, ch, leverId);
    S.screen = 'machine';
    S.m = st;
    var title = ch ? '🏆 ' + bi(ch.title) : '<span aria-hidden="true">' + M.icon + '</span> ' + bi(M.name);
    var leverChips = kind === 'lever' && !ch ? '<div class="tm-chips" role="group" aria-label="' + esc(T('Tipo de palanca', 'Kind of lever')) + '">' + D.LEVERS.map(function(L) {
      return '<button type="button" class="tm-chip' + (L.id === st.lever.id ? ' on' : '') + '" data-lever="' + L.id + '" aria-pressed="' + (L.id === st.lever.id) + '">' + bi(L.name) + ' <small>' + L.cls + '°</small></button>';
    }).join('') + '</div>' : '';
    setPage(
      '<div class="tm-page tm-play">' + topBar(title, ch ? 'challenges' : 'machines') +
        (ch ? '<div class="tm-goal" data-speak="' + esc(one(ch.goal)) + '"><b>' + esc(T('Desafío', 'Challenge')) + ':</b> ' + bi(ch.goal) + '</div>' : '') +
        leverChips +
        '<p class="tm-tip" id="tm-tip" data-speak="' + esc(instruction(st)) + '">' + esc(instruction(st)) + '</p>' +
          '<div class="tm-stage"><canvas id="tm-cv" role="img" aria-label="' + esc(one(M.name)) + '"></canvas>' +
          '<div class="tm-flash" id="tm-flash" hidden></div></div>' +
        '<div class="tm-actions">' +
          '<button type="button" class="tm-btn primary" id="tm-go">▶ ' + esc(T('Hacer funcionar', 'Make it go')) + '</button>' +
          '<button type="button" class="tm-btn ghost" id="tm-reset">↺ ' + esc(T('Bajar', 'Lower it')) + '</button></div>' +
        '<div class="tm-panel">' +
          '<div class="tm-controls" id="tm-controls"></div>' +
          '<div class="tm-numbers" id="tm-numbers" aria-live="polite"></div>' +
        '</div>' +
        infoCard(M) +
      '</div>');
    autoSay((ch ? one(ch.goal) + ' ' : '') + instruction(st));
    Array.prototype.forEach.call(root().querySelectorAll('[data-lever]'), function(b) {
      b.addEventListener('click', function() { sfx('click'); machine('lever', null, b.getAttribute('data-lever')); });
    });
    buildControls(st);
    var ASPECT = { lever: 1.75, pulley: 1.05, incline: 1.9, wedge: 1.25, wheel: 1.2, screw: 1.55 };
    if (kind === 'lever' && st.lever.id !== 'seesaw') ASPECT.lever = 1.5;
    stage('tm-cv', ASPECT[kind], 240, 520);
    S.draw = function() { drawMachine(st); };
    $('tm-go').addEventListener('click', function() { tryGo(st, true); });
    $('tm-reset').addEventListener('click', function() { sfx('click'); lower(st); });
    bindMachineDrag(st);
    updateNumbers(st);
    redraw();
  }

  function infoCard(M) {
    var extra = M.id === 'lever' ? '<p class="tm-info-link"><a href="lab-explorer.html">🔬 ' + bi(['Equilibra pesas en el balancín de Lab Explorer', 'Balance weights on the seesaw in Lab Explorer']) + ' →</a></p>' : '';
    return '<section class="tm-info"><h2>' + bi(['¿Cómo funciona?', 'How does it work?']) + '</h2>' +
      '<p class="tm-rule">' + bi(M.rule) + '</p>' +
      '<p>' + bi(M.fact) + '</p>' +
      '<p class="tm-ex"><b>' + esc(T('En la vida real:', 'In real life:')) + '</b> ' + bi(M.examples) + '</p>' + extra + '</section>';
  }

  function buildControls(st) {
    var box = $('tm-controls');
    if (!box) return;
    var cs = controlsFor(st);
    box.innerHTML = cs.map(function(c) {
      var v = st.p[c.key];
      if (c.choices) {
        return '<div class="tm-ctl"><span class="tm-ctl-label">' + bi(c.label) + '</span><div class="tm-chips small" role="group" aria-label="' + esc(one(c.label)) + '">' +
          c.choices.map(function(o) {
            var lbl = c.unit === 'mm' ? Math.round(o * 1000) + ' mm' : String(o);
            return '<button type="button" class="tm-chip' + (o === v ? ' on' : '') + '" data-key="' + c.key + '" data-val="' + o + '" aria-pressed="' + (o === v) + '">' + lbl + '</button>';
          }).join('') + '</div></div>';
      }
      var id = 'tm-s-' + c.key;
      return '<div class="tm-ctl"><label class="tm-ctl-label" for="' + id + '">' + bi(c.label) + ' <output id="' + id + '-v">' + ctlVal(c, v) + '</output></label>' +
        '<input type="range" id="' + id + '" data-key="' + c.key + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + v + '"></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('input[type=range]'), function(inp) {
      inp.addEventListener('input', function() {
        var key = inp.getAttribute('data-key'), c = cs.filter(function(x) { return x.key === key; })[0];
        st.p[key] = parseFloat(inp.value);
        $(inp.id + '-v').textContent = ctlVal(c, st.p[key]);
        changed(st);
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-val]'), function(b) {
      b.addEventListener('click', function() {
        sfx('click');
        var key = b.getAttribute('data-key');
        st.p[key] = parseFloat(b.getAttribute('data-val'));
        Array.prototype.forEach.call(box.querySelectorAll('[data-key="' + key + '"]'), function(o) { var on = o === b; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); });
        changed(st);
      });
    });
  }
  function ctlVal(c, v) { return c.unit === 'kg' ? kgTxt(v) : c.unit === 'mm' ? Math.round(v * 1000) + ' mm' : mTxt(v); }
  function changed(st) {
    st.u = 0; st.done = false; st.predicted = null; st.splitAt = null; st.anim = null;
    updateNumbers(st); redraw();
  }
  function lower(st) { st.anim = { from: st.u, to: 0, t: 0, dur: 0.6 }; st.done = false; st.splitAt = null; kick(); S.tick = machineTick; }

  function drawMachine(st) {
    var g = S.g;
    if (!g) return;
    clearCanvas();
    var res = calc(st), ss = sceneState(st, res);
    var fy = SC.floorY(ss, S.W, S.H);
    ss.back = backdrop(fy, 7);
    st.hit = SC.draw(g, S.W, S.H, ss);
    if (st.hit && !st.dragging && st.u < 0.02 && !little()) {
      // a pulsing ring on the handle so it is clear what to drag
      var r = 18 + Math.sin(Date.now() / 300) * 3;
      g.strokeStyle = 'rgba(37,99,235,0.55)'; g.lineWidth = 3; g.beginPath(); g.arc(st.hit.hx, st.hit.hy, r, 0, TAU); g.stroke();
    }
  }

  function machineTick(dt) {
    var st = S.m;
    if (!st || S.screen !== 'machine') return false;
    st.t += dt;
    var busy = false;
    if (st.strain > 0) { st.strain = Math.max(0, st.strain - dt * 1.4); busy = true; }
    if (st.anim) {
      st.anim.t += dt;
      var k = Math.min(1, st.anim.t / st.anim.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      st.u = st.anim.from + (st.anim.to - st.anim.from) * e;
      if (k >= 1) { st.anim = null; if (st.u >= 0.999) finished(st); }
      busy = true;
    }
    if (st.splitAt && st.t - st.splitAt < 0.6) busy = true;
    updateNumbersLive(st);
    return busy;
  }

  // The kid tries to operate the machine (button or drag start).
  function tryGo(st, animate) {
    var res = calc(st);
    st.tries++;
    if (!canGo(st, res)) {
      st.strain = 1; sfx('wrong');
      flash(T('¡Muy pesado! Se necesitan ', 'Too heavy! It needs ') + kgTxt(res.effort) + T(' y tienes ', ' and you have ') + kgTxt(st.strength) + '. ' + hintFor(st, res), 'bad');
      if (st.predicted == null && older()) st.predicted = 'shown';
      updateNumbers(st);
      S.tick = machineTick; kick();
      return false;
    }
    if (st.predicted == null && older()) st.predicted = 'shown';
    if (animate) { sfx('click'); st.anim = { from: st.u >= 0.999 ? 0 : st.u, to: 1, t: 0, dur: 1.6 }; S.tick = machineTick; kick(); }
    updateNumbers(st);
    return true;
  }

  function finished(st) {
    if (st.done) return;
    st.done = true;
    if (st.kind === 'wedge') st.splitAt = st.t;
    sfx('correct');
    var first = markSeen(st.kind);
    var res = calc(st), ch = st.ch;
    if (ch) {
      var stars = attemptsToStars(st.tries);
      var prev = award('ch', ch.id, stars, one(ch.title));
      showWin(stars, prev, T('¡Lo lograste con ', 'You did it with ') + kgTxt(res.effort) + '!', function() { nextChallenge(ch.id); });
    } else {
      var msg = little() ? T('¡Funciona! 🎉', 'It works! 🎉') :
        T('¡Funciona! Ventaja mecánica ×', 'It works! Mechanical advantage ×') + num(res.ma) + (first ? T(' · ★ nueva estrella', ' · ★ new star') : '');
      flash(msg, 'good');
      if (little()) say(T('¡Funciona!', 'It works!'));
    }
    updateNumbers(st);
    kick(); S.tick = machineTick;
  }

  function flash(text, kind) {
    var f = $('tm-flash');
    if (!f) return;
    f.hidden = false; f.className = 'tm-flash ' + (kind || ''); f.textContent = text;
    clearTimeout(flash._t);
    flash._t = setTimeout(function() { if (f) f.hidden = true; }, kind === 'bad' ? 4200 : 3000);
  }

  // Drag: straight along the effort, or round and round for a crank.
  function bindMachineDrag(st) {
    var cv = S.cv, drag = null;
    if (!cv) return;
    cv.addEventListener('pointerdown', function(e) {
      if (!st.hit) return;
      var p = pos(e), h = st.hit;
      var near = Math.sqrt((p.x - h.hx) * (p.x - h.hx) + (p.y - h.hy) * (p.y - h.hy)) < Math.max(60, S.W * 0.12);
      if (!near && !(h.cx != null)) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      if (!tryGo(st, false)) return;
      if (st.u >= 0.999) st.u = 0, st.done = false, st.splitAt = null;
      st.dragging = true; st.anim = null;
      drag = { x: p.x, y: p.y, u0: st.u, a0: h.cx != null ? Math.atan2((p.y - h.cy) / (h.squash || 1), p.x - h.cx) : 0, acc: 0 };
    });
    cv.addEventListener('pointermove', function(e) {
      if (!drag) return;
      var p = pos(e), h = st.hit;
      if (h.cx != null) {
        var a = Math.atan2((p.y - h.cy) / (h.squash || 1), p.x - h.cx), da = a - drag.a0;
        if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU;
        drag.a0 = a;
        var sign = st.kind === 'wheel' ? -1 : 1;
        drag.acc += sign * da;
        st.u = Math.max(0, Math.min(1, drag.u0 + drag.acc / (TAU * h.turns)));
      } else {
        var d = (p.x - drag.x) * h.ux + (p.y - drag.y) * h.uy;
        st.u = Math.max(0, Math.min(1, drag.u0 + d / h.travel));
      }
      updateNumbersLive(st);
      redraw();
      if (st.u >= 0.999) { drag = null; st.dragging = false; finished(st); }
    });
    function end() { drag = null; st.dragging = false; redraw(); }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }

  // Numbers panel: little kids see a strength meter; older kids predict first.
  function updateNumbers(st) {
    var box = $('tm-numbers');
    if (!box) return;
    var res = calc(st), ok = canGo(st, res), k = st.kind;
    var need = res.effort, have = st.strength;
    if (little()) {
      var pct = Math.min(100, need / have * 100);
      box.innerHTML = '<div class="tm-meter-wrap"><span class="tm-meter-face" aria-hidden="true">' + (ok ? '💪' : '😣') + '</span>' +
        '<div class="tm-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '" aria-label="' + esc(T('Fuerza que se necesita', 'Force needed')) + '"><i class="' + (ok ? 'ok' : 'bad') + '" style="width:' + Math.max(6, pct) + '%"></i></div>' +
        '<b>' + esc(ok ? T('¡Puedes!', 'You can!') : T('¡Muy pesado!', 'Too heavy!')) + '</b></div>' +
        (ok ? '' : '<p class="tm-hint">' + esc(hintFor(st, res)) + '</p>');
      return;
    }
    var hide = older() && st.predicted == null;
    var rows = [];
    var loadLabel = k === 'wedge' ? T('El tronco aguanta', 'The log holds out to') : T('Carga', 'Load');
    rows.push(['📦 ' + loadLabel, kgTxt(res.load) + (older() ? ' <small>(' + newtons(res.load) + ')</small>' : '')]);
    var effLabel = k === 'wedge' ? T('Empuje que se necesita', 'Push needed') : T('Fuerza que se necesita', 'Force needed');
    rows.push(['✋ ' + effLabel, hide ? '<span class="tm-q">?</span>' : '<b class="' + (ok ? 'ok' : 'bad') + '">' + kgTxt(need) + '</b>' + (older() ? ' <small>(' + newtons(need) + ')</small>' : '')]);
    rows.push(['💪 ' + T('Tu fuerza', 'Your strength'), kgTxt(have) + (k === 'wedge' ? ' <small>' + esc(T('(con mazo)', '(with a mallet)')) + '</small>' : '')]);
    if (!hide) rows.push(['⚙️ ' + T('Ventaja mecánica', 'Mechanical advantage'), '×' + num(res.ma)]);
    rows.push(['📏 ' + T('Tu mano recorre', 'Your hand moves'), '<span id="tm-de">' + mTxt(res.effortDist * Math.max(st.u, 0)) + '</span> / ' + mTxt(res.effortDist)]);
    rows.push(['⬆️ ' + (k === 'wedge' ? T('Abre la madera', 'Opens the wood') : T('La carga sube', 'The load rises')), '<span id="tm-dl">' + mTxt(res.loadDist * Math.max(st.u, 0)) + '</span> / ' + mTxt(res.loadDist)]);
    var extra = '';
    if (k === 'lever') extra = '<p class="tm-note">' + esc(T('Palanca de ' + ['', 'primera', 'segunda', 'tercera'][res.cls] + ' clase', 'Class ' + res.cls + ' lever')) + ': ' +
      esc([null, T('el apoyo está entre la fuerza y la carga.', 'the fulcrum is between the effort and the load.'), T('la carga está entre el apoyo y la fuerza.', 'the load is between the fulcrum and the effort.'), T('la fuerza está entre el apoyo y la carga: pierdes fuerza, ganas velocidad.', 'the effort is between the fulcrum and the load: you lose force but gain speed.')][res.cls]) + '</p>';
    if (k === 'pulley') extra = '<p class="tm-note">' + esc(res.n === 1 ? T('Una polea fija no reduce la fuerza: solo cambia la dirección (tiras hacia abajo para subir).', 'A single fixed pulley does not reduce the force: it only changes direction (pull down to lift up).') :
      T(res.n + ' cuerdas sostienen la caja: cada una lleva ' + kgTxt(res.load / res.n) + '. Tiras ' + res.n + ' veces más cuerda de lo que sube la caja.', res.n + ' ropes hold the crate: each carries ' + kgTxt(res.load / res.n) + '. You pull ' + res.n + ' times as much rope as the crate rises.')) + '</p>';
    if (k === 'incline') extra = '<p class="tm-note">' + esc(T('Ángulo de la rampa: ', 'Ramp angle: ') + Math.round(res.angle) + '°. ' + T('Sin roce; con roce real se necesita un poco más.', 'No friction; real friction needs a little more.')) + '</p>';
    if (k === 'screw') extra = '<p class="tm-note">' + esc(T('Ideal, sin roce. Una gata de verdad pierde mucha fuerza en el roce de la rosca, y por eso no baja sola.', 'Ideal, no friction. A real jack loses a lot to thread friction, which is also why it does not slip back down.')) + '</p>';
    if (k === 'wedge') extra = '<p class="tm-note">' + esc(T('Con tu empuje de ' + kgTxt(have) + ', la cuña separa la madera con ' + kgTxt(have * res.ma) + '.', 'With your ' + kgTxt(have) + ' push, the wedge spreads the wood with ' + kgTxt(have * res.ma) + '.')) + '</p>';
    var work = '';
    if (tier() === 'expert' && !hide) {
      work = '<p class="tm-work">' + esc(T('Trabajo que entra = trabajo que sale: ', 'Work in = work out: ')) +
        kgTxt(need) + ' × ' + mTxt(res.effortDist) + ' = ' + kgTxt(res.load) + ' × ' + mTxt(res.loadDist) + '</p>';
    }
    var predict = '';
    if (hide) {
      var opts = predictOptions(res);
      predict = '<div class="tm-predict"><b>🔮 ' + esc(T('Predice: ¿cuánta fuerza se necesita?', 'Predict: how much force will it take?')) + '</b>' +
        '<div class="tm-chips">' + opts.map(function(o) { return '<button type="button" class="tm-chip" data-pred="' + o + '">' + kgTxt(o) + '</button>'; }).join('') + '</div>' +
        '<small>' + esc(T('Usa la regla de abajo. Después, prueba la máquina.', 'Use the rule below. Then test the machine.')) + '</small></div>';
    } else if (typeof st.predicted === 'number') {
      var right = Math.abs(st.predicted - need) <= Math.max(0.051, need * 0.02);
      predict = '<p class="tm-verdict ' + (right ? 'ok' : 'bad') + '">' + (right ? '✅ ' : '🤔 ') + esc(T('Predijiste ', 'You predicted ') + kgTxt(st.predicted) + (right ? T(': ¡exacto!', ': spot on!') : T('; la fuerza real es ', '; the real force is ') + kgTxt(need) + '.')) + '</p>';
    }
    box.innerHTML = predict + '<dl class="tm-dl">' + rows.map(function(r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' + extra + work;
    Array.prototype.forEach.call(box.querySelectorAll('[data-pred]'), function(b) {
      b.addEventListener('click', function() {
        st.predicted = parseFloat(b.getAttribute('data-pred'));
        var right = Math.abs(st.predicted - need) <= Math.max(0.051, need * 0.02);
        sfx(right ? 'correct' : 'wrong');
        updateNumbers(st);
      });
    });
  }
  function updateNumbersLive(st) {
    var res = calc(st), a = $('tm-de'), b = $('tm-dl');
    if (a) a.textContent = mTxt(res.effortDist * st.u);
    if (b) b.textContent = mTxt(res.loadDist * st.u);
  }
  // Four choices: the right force and three common mix-ups.
  function predictOptions(res) {
    function r(v) { return v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100; }
    var right = r(res.effort), set = [right];
    [res.load, res.load * res.ma, res.effort * 2, res.effort / 2, res.effort * 3].forEach(function(v) {
      var x = r(v);
      if (set.length < 4 && isFinite(x) && x > 0 && set.every(function(s) { return Math.abs(s - x) > Math.max(0.05, x * 0.08); })) set.push(x);
    });
    // a fixed shuffle (by value) so the right answer is not always first
    return set.sort(function(a, b) { return ((a * 7919) % 13) - ((b * 7919) % 13) || a - b; });
  }

  function showWin(stars, prev, line, onNext) {
    var box = document.createElement('div');
    box.className = 'tm-win';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T('¡Logrado!', 'Done!'));
    box.innerHTML = '<div class="tm-win-card"><div class="tm-win-stars" aria-label="' + stars + ' ' + esc(T('de 3 estrellas', 'of 3 stars')) + '">' + starStr(stars) + '</div>' +
      '<h2>' + esc(T('¡Logrado!', 'You did it!')) + '</h2><p>' + esc(line) + '</p>' +
      (stars < 3 ? '<p class="tm-win-small">' + esc(T('Tres estrellas si lo logras al primer intento.', 'Three stars for getting it first try.')) + '</p>' : '') +
      (prev && prev >= stars ? '<p class="tm-win-small">' + esc(T('Tu mejor marca: ', 'Your best: ') + starStr(prev)) + '</p>' : '') +
      '<div class="tm-win-btns"><button type="button" class="tm-btn ghost" data-w="stay">' + esc(T('Seguir aquí', 'Stay here')) + '</button>' +
      '<button type="button" class="tm-btn primary" data-w="next">' + esc(T('Siguiente', 'Next')) + ' →</button></div></div>';
    document.body.appendChild(box);
    var nextBtn = box.querySelector('[data-w=next]');
    try { nextBtn.focus(); } catch (e) {}
    say(T('¡Logrado!', 'You did it!'));
    box.addEventListener('click', function(e) {
      var b = e.target.closest('[data-w]');
      if (!b && e.target !== box) return;
      box.parentNode.removeChild(box);
      if (b && b.getAttribute('data-w') === 'next' && onNext) onNext();
    });
  }

  // ================================================================
  //  CHALLENGES
  // ================================================================
  function availableChallenges() { return D.CHALLENGES.filter(function(c) { return age() >= (c.minAge || 0); }); }
  function challenges() {
    S.screen = 'challenges';
    var d = _load(), list = availableChallenges(), hidden = D.CHALLENGES.length - list.length;
    setPage(
      '<div class="tm-page">' + topBar('🏆 ' + bi(['Desafíos', 'Challenges'])) +
        '<p class="tm-lead">' + bi(['★★★ al primer intento · ★★ en tres · ★ cuando lo logras.', '★★★ first try · ★★ within three · ★ when you get it.']) + '</p>' +
        '<div class="tm-chgrid">' + list.map(function(c) {
          var M = c.machine === 'gears' ? { icon: '⚙️', name: ['Engranajes', 'Gears'] } : c.machine === 'bike' ? { icon: '🚲', name: ['Bicicleta', 'Bicycle'] } : machineDef(c.machine);
          var s = d.ch[c.id] | 0;
          return '<button type="button" class="tm-ch' + (s ? ' done' : '') + '" data-ch="' + c.id + '">' +
            '<span class="tm-ch-icon" aria-hidden="true">' + M.icon + '</span>' +
            '<span class="tm-ch-body"><span class="tm-ch-name">' + bi(c.title) + '</span>' +
            '<span class="tm-ch-goal">' + bi(c.goal) + '</span>' +
            '<span class="tm-ch-stars" aria-label="' + s + ' ' + esc(T('de 3 estrellas', 'of 3 stars')) + '">' + starStr(s) + '</span></span></button>';
        }).join('') + '</div>' +
        (hidden ? '<p class="tm-lead">' + esc(T('Hay ' + hidden + ' desafíos más para cuando seas más grande.', hidden + ' more challenges unlock when you are older.')) + '</p>' : '') +
      '</div>');
    Array.prototype.forEach.call(root().querySelectorAll('[data-ch]'), function(b) {
      b.addEventListener('click', function() { sfx('click'); openChallenge(b.getAttribute('data-ch')); });
    });
  }
  function openChallenge(id) {
    var c = chDef(id);
    if (!c) return challenges();
    if (c.machine === 'gears') gears(id); else if (c.machine === 'bike') bike(id); else machine(c.machine, id);
  }
  function nextChallenge(id) {
    var list = availableChallenges(), d = _load(), i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) break;
    for (var k = 1; k <= list.length; k++) { var c = list[(i + k) % list.length]; if (!(d.ch[c.id] > 0)) return openChallenge(c.id); }
    challenges();
  }

  // ================================================================
  //  GEAR LAB
  // ================================================================
  function gears(chId) {
    var ch = chId ? chDef(chId) : null;
    S.screen = 'gears';
    var g0 = ch ? ch.setup.gears[0] : 24;
    var st = { ch: ch, gears: [{ teeth: g0 }, { teeth: 12, link: 'mesh' }], sel: 1, run: true, t: 0, tries: 0, done: false, size: 24, fixedDriver: !!ch };
    if (ch) { st.gears = [{ teeth: g0 }]; st.sel = 0; }
    S.gs = st;
    var compound = older() || (ch && ch.compound);
    setPage(
      '<div class="tm-page tm-play">' + topBar(ch ? '🏆 ' + bi(ch.title) : '⚙️ ' + bi(['Engranajes', 'Gears']), ch ? 'challenges' : 'home') +
        (ch ? '<div class="tm-goal" data-speak="' + esc(one(ch.goal)) + '"><b>' + esc(T('Desafío', 'Challenge')) + ':</b> ' + bi(ch.goal) + '</div>' : '') +
        '<p class="tm-tip" data-speak="' + esc(T('Toca una rueda para elegirla y cambia su tamaño abajo.', 'Tap a gear to pick it, then change its size below.')) + '">' + esc(T('Toca una rueda y cambia su tamaño. El motor mueve la primera.', 'Tap a gear and change its size. The motor drives the first one.')) + '</p>' +
          '<div class="tm-stage"><canvas id="tm-cv" role="img" aria-label="' + esc(T('Tren de engranajes', 'Gear train')) + '"></canvas>' +
          '<div class="tm-flash" id="tm-flash" hidden></div></div>' +
        '<div class="tm-panel">' +
          '<div class="tm-controls">' +
            '<div class="tm-ctl"><span class="tm-ctl-label">' + bi(['Dientes de la rueda elegida', 'Teeth on the chosen gear']) + '</span><div class="tm-chips small" id="tm-sizes" role="group" aria-label="' + esc(T('Número de dientes', 'Number of teeth')) + '">' +
              D.GEAR_SIZES.map(function(z) { return '<button type="button" class="tm-chip" data-z="' + z + '">' + z + '</button>'; }).join('') + '</div></div>' +
            '<div class="tm-actions left">' +
              '<button type="button" class="tm-btn ghost" id="tm-add">＋ ' + esc(T('Rueda', 'Gear')) + '</button>' +
              (compound ? '<button type="button" class="tm-btn ghost" id="tm-axle">＋ ' + esc(T('En el mismo eje', 'On the same axle')) + '</button>' : '') +
              '<button type="button" class="tm-btn ghost" id="tm-del" aria-label="' + esc(T('Quitar la última rueda', 'Remove the last gear')) + '">－ ' + esc(T('Quitar', 'Remove')) + '</button>' +
              '<button type="button" class="tm-btn ghost" id="tm-run" aria-pressed="true">⏸ ' + esc(T('Pausa', 'Pause')) + '</button>' +
              (ch ? '<button type="button" class="tm-btn primary" id="tm-check">✔ ' + esc(T('Probar', 'Test it')) + '</button>' : '') +
            '</div></div>' +
          '<div class="tm-numbers" id="tm-numbers" aria-live="polite"></div>' +
        '</div>' +
        '<section class="tm-info"><h2>' + bi(['¿Cómo funcionan?', 'How do they work?']) + '</h2>' +
          '<p class="tm-rule">' + bi(['Dos ruedas que engranan giran en sentidos contrarios. La chica gira más rápido: velocidad × dientes es igual en las dos.', 'Two meshing gears turn opposite ways. The small one turns faster: speed × teeth is the same for both.']) + '</p>' +
          '<p>' + bi(['Una rueda en medio (rueda loca) no cambia la velocidad, solo el sentido. Dos ruedas pegadas en un mismo eje giran juntas, y así se multiplican los cambios.', 'A gear in the middle (an idler) does not change the speed, only the direction. Two gears fixed on one axle turn together, and that multiplies the changes.']) + '</p>' +
          '<p>' + bi(D.FACTS.gears) + '</p></section>' +
      '</div>');
    autoSay(ch ? one(ch.goal) : T('Toca una rueda y cambia su tamaño.', 'Tap a gear and change its size.'));
    stage('tm-cv', 1.7, 240, 480);
    S.draw = function() { drawGears(st); };
    S.tick = function(dt) { if (st.run) st.t += dt; return S.screen === 'gears' && !document.hidden; };
    function sync() { syncGearUI(st); gearNumbers(st); redraw(); }
    Array.prototype.forEach.call(root().querySelectorAll('[data-z]'), function(b) {
      b.addEventListener('click', function() {
        sfx('click');
        var z = +b.getAttribute('data-z');
        st.size = z;
        if (st.sel === 0 && st.fixedDriver) { flash(T('En este desafío el motor no se cambia.', 'In this challenge the motor gear stays.'), 'bad'); return; }
        if (st.sel >= 0) st.gears[st.sel].teeth = z;
        sync();
      });
    });
    $('tm-add').addEventListener('click', function() { addGear(st, 'mesh'); sync(); });
    if ($('tm-axle')) $('tm-axle').addEventListener('click', function() { addGear(st, 'axle'); sync(); });
    $('tm-del').addEventListener('click', function() {
      sfx('click');
      if (st.gears.length > 1) { st.gears.pop(); st.sel = Math.min(st.sel, st.gears.length - 1); }
      sync();
    });
    $('tm-run').addEventListener('click', function() {
      st.run = !st.run;
      this.setAttribute('aria-pressed', st.run);
      this.textContent = st.run ? '⏸ ' + T('Pausa', 'Pause') : '▶ ' + T('Mover', 'Run');
      kick();
    });
    if ($('tm-check')) $('tm-check').addEventListener('click', function() { checkGears(st); });
    S.cv.addEventListener('pointerdown', function(e) {
      var p = pos(e), hitK = -1;
      (st.screen || []).forEach(function(q, k) { var dx = p.x - q.x, dy = p.y - q.y; if (dx * dx + dy * dy < q.r * q.r) hitK = k; });
      if (hitK >= 0) { st.sel = hitK; sfx('click'); sync(); }
    });
    markSeen('gears');
    sync();
    kick();
  }
  function addGear(st, link) {
    if (st.gears.length >= 7) { flash(T('Hasta 7 ruedas.', 'Up to 7 gears.'), 'bad'); return; }
    sfx('click');
    var last = st.gears[st.gears.length - 1];
    if (link === 'axle' && last.link === 'axle') { flash(T('Engrana una rueda antes de pegar otra al eje.', 'Mesh a gear before putting another on the axle.'), 'bad'); return; }
    st.gears.push({ teeth: st.size || 12, link: link });
    st.sel = st.gears.length - 1;
  }
  function syncGearUI(st) {
    var cur = st.sel >= 0 ? st.gears[st.sel].teeth : null;
    Array.prototype.forEach.call(root().querySelectorAll('[data-z]'), function(b) { var on = +b.getAttribute('data-z') === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }
  function gearNumbers(st) {
    var box = $('tm-numbers');
    if (!box) return;
    var tr = Ph.gearTrain(st.gears, 30), last = tr.gears[tr.gears.length - 1];
    var rows = tr.gears.map(function(q, k) {
      var name = k === 0 ? T('Motor', 'Motor') : T('Rueda ', 'Gear ') + (k + 1);
      var how = k === 0 ? '' : q.link === 'axle' ? T(' (mismo eje)', ' (same axle)') : '';
      return '<div' + (k === st.sel ? ' class="sel"' : '') + '><dt>' + esc(name + how) + ' · ' + q.teeth + ' ' + esc(T('dientes', 'teeth')) + '</dt><dd>' +
        (q.dir > 0 ? '↻' : '↺') + ' ' + (little() ? '' : num(Math.abs(q.rpm)) + ' ' + esc(T('vueltas/min', 'rpm'))) + '</dd></div>';
    }).join('');
    var sum = '';
    if (tr.gears.length > 1) {
      var sp = tr.speedUp;
      var spTxt = Math.abs(sp - 1) < 1e-9 ? T('a la misma velocidad', 'at the same speed') : sp > 1 ? num(sp) + T(' veces más rápido', ' times faster') : num(1 / sp) + T(' veces más lento', ' times slower');
      sum = '<p class="tm-sum">' + esc(T('La última rueda gira ', 'The last gear turns ') + spTxt + T(' que el motor, ', ' than the motor, ') + (tr.sameDir ? T('en el mismo sentido.', 'the same way.') : T('en sentido contrario.', 'the opposite way.'))) + '</p>';
      if (older()) sum += '<p class="tm-note">' + esc(T('Razón: ', 'Ratio: ') + tr.frac[0] + ' : ' + tr.frac[1] + ' — ' + T('multiplica los dientes de cada rueda que mueve y divide por los de cada rueda movida.', 'multiply the teeth of each driving gear and divide by those of each driven gear.')) + '</p>';
    }
    box.innerHTML = '<dl class="tm-dl">' + rows + '</dl>' + sum;
  }
  function gearsMatch(st) {
    var goal = st.ch.gears, tr = Ph.gearTrain(st.gears, 30);
    if (st.gears.length < 2) return false;
    if (goal.count && st.gears.length !== goal.count) return false;
    if (goal.dir === 'same' && !tr.sameDir) return false;
    if (goal.dir === 'opp' && tr.sameDir) return false;
    return Math.abs(tr.speedUp - goal.speed) < 1e-6;
  }
  function checkGears(st) {
    if (st.done) return;
    st.tries++;
    if (!st.run) { st.run = true; var rb = $('tm-run'); if (rb) { rb.textContent = '⏸ ' + T('Pausa', 'Pause'); rb.setAttribute('aria-pressed', 'true'); } kick(); }
    if (gearsMatch(st)) {
      st.done = true; sfx('correct');
      var stars = attemptsToStars(st.tries), prev = award('ch', st.ch.id, stars, one(st.ch.title));
      setTimeout(function() { if (S.gs === st) showWin(stars, prev, T('¡La última rueda hace justo lo que pedía el desafío!', 'The last gear does exactly what the challenge asked!'), function() { nextChallenge(st.ch.id); }); }, 700);
    } else {
      sfx('wrong');
      var tr = Ph.gearTrain(st.gears, 30), goal = st.ch.gears, why;
      if (goal.count && st.gears.length !== goal.count) why = T('Usa exactamente ' + goal.count + ' ruedas.', 'Use exactly ' + goal.count + ' gears.');
      else if (goal.dir === 'same' && !tr.sameDir) why = T('Gira al revés. Una rueda más en medio le da vuelta el sentido.', 'It turns the wrong way. One more gear in the middle flips it.');
      else why = T('La velocidad todavía no es la pedida. Prueba con otros tamaños.', 'The speed is not right yet. Try other sizes.');
      flash(why, 'bad');
    }
  }
  function drawGears(st) {
    var g = S.g;
    if (!g) return;
    clearCanvas();
    var fy = S.H - 26, bk = backdrop(fy, 5, true);
    if (bk) g.drawImage(bk, 0, 0, S.W, S.H);
    var gs = st.gears, lay = Ph.gearLayout(gs, 1), ph = Ph.gearPhases(gs, lay), tr = Ph.gearTrain(gs, 30);
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    lay.forEach(function(p) { var ra = p.r + 1.2; minX = Math.min(minX, p.x - ra); maxX = Math.max(maxX, p.x + ra); minY = Math.min(minY, p.y - ra); maxY = Math.max(maxY, p.y + ra); });
    minX -= lay[0].r + 13; // room for the motor
    // fit, but never bigger than a 64 × 34 tooth-module window, so one gear does not fill the screen
    var bw = Math.max(maxX - minX, 64), bh = Math.max(maxY - minY, 34);
    var sc = Math.min((S.W - 30) / bw, (S.H - 60) / bh);
    var ox = S.W / 2 - (minX + maxX) / 2 * sc, oy = (S.H - 30) / 2 + (minY + maxY) / 2 * sc + 4;
    // motor housing behind gear 0
    var m0x = ox + lay[0].x * sc, m0y = oy - lay[0].y * sc;
    g.save(); A.shadow(g, 10, 4, 0.3);
    var mw = Math.max(46, lay[0].r * sc * 0.9), mh = mw * 0.9;
    A.rr(g, m0x - lay[0].r * sc - mw * 1.05, m0y - mh / 2, mw * 1.5, mh, 8);
    var mg = g.createLinearGradient(0, m0y - mh / 2, 0, m0y + mh / 2); mg.addColorStop(0, '#2563eb'); mg.addColorStop(1, '#1e3a8a');
    g.fillStyle = mg; g.fill(); A.noShadow(g);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '800 11px Nunito, sans-serif'; g.textAlign = 'center';
    g.fillText(T('MOTOR', 'MOTOR'), m0x - lay[0].r * sc - mw * 0.55, m0y - 4);
    g.fillText('30 rpm', m0x - lay[0].r * sc - mw * 0.55, m0y + 10);
    g.restore();
    var metals = ['blue', 'brass', 'steel', 'copper', 'brass', 'steel', 'copper'];
    st.screen = [];
    lay.forEach(function(p, k) {
      var ang = -(ph[k] + tr.gears[k].rpm / 60 * TAU * st.t);
      var px = ox + p.x * sc, py = oy - p.y * sc, rpx = p.r * sc;
      st.screen.push({ x: px, y: py, r: rpx + sc });
      if (gs[k].link === 'axle') { g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(px, py, rpx + sc * 1.2, 0, TAU); g.fill(); }
      else { g.fillStyle = 'rgba(90,60,30,0.3)'; g.beginPath(); g.arc(px, py, Math.max(6, rpx * 0.3), 0, TAU); g.fill(); }
      var spr = A.gearSprite(gs[k].teeth, rpx, metals[k % metals.length], S.dpr);
      if (spr) { g.save(); g.translate(px, py); g.rotate(ang); g.drawImage(spr.cv, -spr.size / 2, -spr.size / 2, spr.size, spr.size); g.restore(); }
      else A.drawGear(g, px, py, gs[k].teeth, rpx, ang, metals[k % metals.length]);
      if (k === st.sel) { g.strokeStyle = 'rgba(37,99,235,0.9)'; g.lineWidth = 3; g.setLineDash([6, 4]); g.beginPath(); g.arc(px, py, rpx + sc * 1.6, 0, TAU); g.stroke(); g.setLineDash([]); }
      // direction and teeth label
      var lab = (tr.gears[k].dir > 0 ? '↻ ' : '↺ ') + gs[k].teeth;
      A.tag(g, px, py + rpx + sc * 2.2 + 8, lab, k === st.sel ? '#1d4ed8' : 'rgba(255,255,255,0.92)', k === st.sel ? '#fff' : '#1f2937', 11);
    });
  }

  // ================================================================
  //  BICYCLE
  // ================================================================
  function bike(chId) {
    var ch = chId ? chDef(chId) : null;
    S.screen = 'bike';
    var st = { ch: ch, front: ch ? ch.setup.front : 38, rear: ch ? ch.setup.rear : 16, crank: 0, wheel: 0, scroll: 0, pedal: 0, tries: 0, done: false, drag: null };
    S.bs = st;
    function chips(list, key) {
      return list.map(function(z) { return '<button type="button" class="tm-chip" data-' + key + '="' + z + '">' + z + '</button>'; }).join('');
    }
    setPage(
      '<div class="tm-page tm-play">' + topBar(ch ? '🏆 ' + bi(ch.title) : '🚲 ' + bi(['La bicicleta', 'The bicycle']), ch ? 'challenges' : 'home') +
        (ch ? '<div class="tm-goal" data-speak="' + esc(one(ch.goal)) + '"><b>' + esc(T('Desafío', 'Challenge')) + ':</b> ' + bi(ch.goal) + '</div>' : '') +
        '<p class="tm-tip" data-speak="' + esc(T('Gira el pedal con el dedo o toca Pedalear.', 'Turn the pedal with your finger or tap Pedal.')) + '">' + esc(T('Gira el pedal con el dedo, o toca «Pedalear».', 'Turn the pedal with your finger, or tap "Pedal".')) + '</p>' +
          '<div class="tm-stage"><canvas id="tm-cv" role="img" aria-label="' + esc(T('Una bicicleta en un camino', 'A bicycle on a road')) + '"></canvas>' +
          '<div class="tm-flash" id="tm-flash" hidden></div></div>' +
        '<div class="tm-actions"><button type="button" class="tm-btn primary" id="tm-pedal">🚴 ' + esc(T('Pedalear (1 vuelta)', 'Pedal (1 turn)')) + '</button>' +
          (ch ? '<button type="button" class="tm-btn ghost" id="tm-check">✔ ' + esc(T('Elijo este cambio', 'This gear')) + '</button>' : '') + '</div>' +
        '<div class="tm-panel"><div class="tm-controls">' +
          '<div class="tm-ctl"><span class="tm-ctl-label">' + bi(['Plato (adelante, dientes)', 'Chainring (front, teeth)']) + '</span><div class="tm-chips small" role="group" aria-label="' + esc(T('Plato', 'Chainring')) + '">' + chips(D.BIKE.fronts, 'front') + '</div></div>' +
          '<div class="tm-ctl"><span class="tm-ctl-label">' + bi(['Piñón (atrás, dientes)', 'Cog (rear, teeth)']) + '</span><div class="tm-chips small" role="group" aria-label="' + esc(T('Piñón', 'Cog')) + '">' + chips(D.BIKE.rears, 'rear') + '</div></div>' +
        '</div><div class="tm-numbers" id="tm-numbers" aria-live="polite"></div></div>' +
        '<section class="tm-info"><h2>' + bi(['¿Cómo funciona?', 'How does it work?']) + '</h2>' +
          '<p class="tm-rule">' + bi(['Vueltas de la rueda por pedalada = dientes del plato ÷ dientes del piñón.', 'Wheel turns per pedal turn = chainring teeth ÷ cog teeth.']) + '</p>' +
          '<p>' + bi(D.FACTS.bike) + '</p></section>' +
      '</div>');
    autoSay(ch ? one(ch.goal) : T('Gira el pedal.', 'Turn the pedal.'));
    stage('tm-cv', 1.8, 230, 440);
    S.draw = function() { drawBike(st); };
    S.tick = function(dt) {
      if (st.pedal > 0) {
        var step = Math.min(st.pedal, dt * TAU * 0.9);
        turnCrank(st, step); st.pedal -= step;
      }
      return st.pedal > 1e-4;
    };
    function sync() {
      Array.prototype.forEach.call(root().querySelectorAll('[data-front]'), function(b) { var on = +b.getAttribute('data-front') === st.front; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      Array.prototype.forEach.call(root().querySelectorAll('[data-rear]'), function(b) { var on = +b.getAttribute('data-rear') === st.rear; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      bikeNumbers(st); redraw();
    }
    Array.prototype.forEach.call(root().querySelectorAll('[data-front]'), function(b) { b.addEventListener('click', function() { sfx('click'); st.front = +b.getAttribute('data-front'); sync(); }); });
    Array.prototype.forEach.call(root().querySelectorAll('[data-rear]'), function(b) { b.addEventListener('click', function() { sfx('click'); st.rear = +b.getAttribute('data-rear'); sync(); }); });
    $('tm-pedal').addEventListener('click', function() { st.pedal += TAU; kick(); markSeen('bike'); });
    if ($('tm-check')) $('tm-check').addEventListener('click', function() { checkBike(st); });
    S.cv.addEventListener('pointerdown', function(e) {
      if (!st.hit) return;
      var p = pos(e); e.preventDefault();
      try { S.cv.setPointerCapture(e.pointerId); } catch (err) {}
      st.drag = Math.atan2(p.y - st.hit.bby, p.x - st.hit.bbx);
    });
    S.cv.addEventListener('pointermove', function(e) {
      if (st.drag == null) return;
      var p = pos(e), a = Math.atan2(p.y - st.hit.bby, p.x - st.hit.bbx), da = a - st.drag;
      if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU;
      st.drag = a;
      if (da > 0) { turnCrank(st, da); markSeen('bike'); }
      redraw();
    });
    function end() { st.drag = null; }
    S.cv.addEventListener('pointerup', end); S.cv.addEventListener('pointercancel', end);
    sync();
  }
  function turnCrank(st, da) {
    var b = Ph.bike(st.front, st.rear, D.BIKE.wheel);
    st.crank += da; st.wheel += da * b.wheelTurns;
    st.scroll += da / TAU * b.metres;
    var el = $('tm-dist');
    if (el) el.textContent = num(st.scroll) + ' m';
  }
  function bikeNumbers(st) {
    var box = $('tm-numbers');
    if (!box) return;
    var b = Ph.bike(st.front, st.rear, D.BIKE.wheel);
    var lightness = (b.wheelTurns - 28 / 32) / (48 / 12 - 28 / 32);
    var meter = '<div class="tm-meter-wrap"><span aria-hidden="true">🪶</span><div class="tm-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(lightness * 100) + '" aria-label="' + esc(T('Cuánto cuesta pedalear', 'How hard to pedal')) + '"><i class="mid" style="width:' + Math.max(6, lightness * 100) + '%"></i></div><span aria-hidden="true">🏋️</span></div>';
    var rows = [
      ['🔁 ' + T('Vueltas de rueda por pedalada', 'Wheel turns per pedal turn'), num(b.wheelTurns) + (older() ? ' <small>(' + st.front + ' ÷ ' + st.rear + ')</small>' : '')],
      ['📏 ' + T('Avanzas por pedalada', 'Distance per pedal turn'), mTxt(b.metres)],
      ['🛣️ ' + T('Recorrido', 'Travelled'), '<span id="tm-dist">' + num(st.scroll) + ' m</span>']
    ];
    if (older()) rows.push(['⭕ ' + T('Una vuelta de rueda', 'One wheel turn'), mTxt(b.circumference) + ' <small>(π × ' + mTxt(D.BIKE.wheel) + ')</small>']);
    box.innerHTML = meter + '<p class="tm-note">' + esc(T('Liviano para subir ← → rápido en plano', 'Easy uphill ← → fast on the flat')) + '</p>' +
      '<dl class="tm-dl">' + rows.map(function(r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
  }
  function checkBike(st) {
    if (st.done) return;
    st.tries++;
    var goal = st.ch.bike, b = Ph.bike(st.front, st.rear, D.BIKE.wheel), ok;
    if (goal.easiest) ok = st.front === Math.min.apply(null, D.BIKE.fronts) && st.rear === Math.max.apply(null, D.BIKE.rears);
    else if (goal.fastest) ok = st.front === Math.max.apply(null, D.BIKE.fronts) && st.rear === Math.min.apply(null, D.BIKE.rears);
    else ok = Math.abs(b.wheelTurns - goal.turns) < 1e-9;
    if (ok) {
      st.done = true; sfx('correct'); st.pedal += TAU * 2; kick();
      var stars = attemptsToStars(st.tries), prev = award('ch', st.ch.id, stars, one(st.ch.title));
      setTimeout(function() { if (S.bs === st) showWin(stars, prev, T('Plato ', 'Chainring ') + st.front + ', ' + T('piñón ', 'cog ') + st.rear + ': ' + num(b.wheelTurns) + T(' vueltas por pedalada.', ' turns per pedal turn.'), function() { nextChallenge(st.ch.id); }); }, 1300);
    } else {
      sfx('wrong');
      flash(goal.easiest ? T('Todavía hay uno más liviano: plato más chico, piñón más grande.', 'There is an easier one: a smaller chainring and a bigger cog.') :
        T('Con este cambio la rueda gira ', 'With this gear the wheel turns ') + num(b.wheelTurns) + T(' veces. Buscamos ', ' times. We want ') + goal.turns + '.', 'bad');
    }
  }
  function drawBike(st) {
    var g = S.g;
    if (!g) return;
    clearCanvas();
    st.hit = A.bikeScene(g, S.W, S.H, { front: st.front, rear: st.rear, crank: st.crank, wheel: st.wheel, scroll: st.scroll, s: Math.min(S.W / 2.3, S.H / 1.2) });
  }

  // ================================================================
  //  CHAIN REACTION
  // ================================================================
  function chainList() {
    S.screen = 'chainlist';
    var d = _load();
    var levels = D.LEVELS.filter(function(l) { return age() >= (l.minAge || 0) || d.cr[l.id]; });
    setPage(
      '<div class="tm-page">' + topBar('🎳 ' + bi(['Reacción en cadena', 'Chain reaction'])) +
        '<p class="tm-lead">' + bi(['★ funciona · ★★ con pocas piezas · ★★★ en tres pruebas o menos.', '★ it works · ★★ with few parts · ★★★ within three runs.']) + '</p>' +
        '<div class="tm-lvgrid">' + levels.map(function(l, i) {
          var s = d.cr[l.id] | 0;
          return '<button type="button" class="tm-lv' + (s ? ' done' : '') + '" data-lv="' + l.id + '">' +
            '<span class="tm-lv-art"><canvas data-cthumb="' + l.id + '" aria-hidden="true"></canvas><span class="tm-lv-num">' + (i + 1) + '</span></span>' +
            '<span class="tm-lv-body"><span class="tm-lv-name">' + bi(l.name) + '</span>' +
            '<span class="tm-lv-goal">' + bi(l.say) + '</span>' +
            '<span class="tm-ch-stars" aria-label="' + s + ' ' + esc(T('de 3 estrellas', 'of 3 stars')) + '">' + starStr(s) + '</span></span></button>';
        }).join('') +
        '<button type="button" class="tm-lv free" data-lv="free"><span class="tm-lv-art"><canvas data-cthumb="free" aria-hidden="true"></canvas></span>' +
          '<span class="tm-lv-body"><span class="tm-lv-name">🛠️ ' + bi(D.SANDBOX.name) + '</span><span class="tm-lv-goal">' + bi(['Todas las piezas, sin meta: inventa tu propia máquina.', 'Every part, no goal: invent your own machine.']) + '</span></span></button>' +
        '</div><p class="tm-info-small">' + bi(D.FACTS.chain) + '</p></div>');
    Array.prototype.forEach.call(root().querySelectorAll('[data-lv]'), function(b) {
      b.addEventListener('click', function() { sfx('click'); chain(b.getAttribute('data-lv')); });
    });
    var thumbs = Array.prototype.slice.call(root().querySelectorAll('[data-cthumb]'));
    (function next() {
      var cv = thumbs.shift();
      if (!cv || S.screen !== 'chainlist') return;
      try { chainThumb(cv, levelDef(cv.getAttribute('data-cthumb'))); } catch (e) {}
      requestAnimationFrame(next);
    })();
  }
  function chainThumb(cv, L) {
    var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(ZsCanvas.dpr(), 1.5);
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var g = ZsCanvas.get2d(cv);
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cam = chainCam(L, W, H);
    A.backdrop(g, W, H, A.Y(cam, 0), 11);
    drawChainStatic(g, cam, L, null, 0);
    var d = _load(), placed = decodeParts(d.designs[L.id]);
    (L.fixed || []).concat(placed).forEach(function(p) { drawPartDef(g, cam, p, {}); });
  }

  function encodeParts(list) { return list.map(function(p) { return [p.type, Math.round(p.x * 1000), Math.round(p.y * 1000), Math.round(p.a || 0)].join(','); }).join(';'); }
  function decodeParts(s) {
    if (typeof s !== 'string' || !s) return [];
    var out = [];
    s.split(';').forEach(function(q) {
      var f = q.split(',');
      if (f.length !== 4 || !Ph.PARTS[f[0]]) return;
      var x = +f[1] / 1000, y = +f[2] / 1000, a = +f[3];
      if (!isFinite(x) || !isFinite(y) || !isFinite(a) || x < 0 || x > 3 || y < 0 || y > 2) return;
      out.push({ type: f[0], x: x, y: y, a: a });
    });
    return out;
  }
  function chainCam(L, W, H) {
    var s = Math.min(W / L.w, H / L.h);
    return { s: s, ox: (W - L.w * s) / 2, oy: H - (H - L.h * s) / 2 };
  }

  function chain(id) {
    var L = levelDef(id);
    if (!L) return chainList();
    S.screen = 'chain';
    var d = _load();
    var placed = decodeParts(d.designs[L.id]).filter(function(p) { return L.parts[p.type]; });
    var st = { L: L, placed: placed, sel: -1, mode: 'build', world: null, runs: 0, done: false, drag: null, ringT: 0, idle: 0, acc: 0 };
    S.cs = st;
    var isFree = L.id === 'free';
    setPage(
      '<div class="tm-page tm-play">' + topBar('🎳 ' + bi(L.name), 'chain') +
        (isFree ? '' : '<div class="tm-goal" data-speak="' + esc(one(L.say)) + '">' + bi(L.say) + '</div>') +
        '<div class="tm-stage chain"><canvas id="tm-cv" tabindex="0" role="application" aria-label="' + esc(T('Muro del taller para armar la máquina. Con el teclado: Tab elige una pieza, las flechas la mueven.', 'Workshop wall to build the machine on. Keyboard: Tab picks a part, the arrow keys move it.')) + '"></canvas>' +
          '<div class="tm-flash" id="tm-flash" hidden></div></div>' +
        '<div class="tm-actions">' +
          '<button type="button" class="tm-btn primary" id="tm-run">▶ ' + esc(T('¡Andando!', 'Run it!')) + '</button>' +
          '<button type="button" class="tm-btn ghost" id="tm-rotl" aria-label="' + esc(T('Girar a la izquierda', 'Turn left')) + '">⟲</button>' +
          '<button type="button" class="tm-btn ghost" id="tm-rotr" aria-label="' + esc(T('Girar a la derecha', 'Turn right')) + '">⟳</button>' +
          '<button type="button" class="tm-btn ghost" id="tm-delp" aria-label="' + esc(T('Quitar la pieza', 'Remove the part')) + '">🗑</button>' +
          '<button type="button" class="tm-btn ghost" id="tm-clear">' + esc(T('Vaciar', 'Clear')) + '</button>' +
        '</div>' +
        '<div class="tm-tray" id="tm-tray" role="group" aria-label="' + esc(T('Piezas', 'Parts')) + '"></div>' +
        '<p class="tm-lead small">' + esc(T('Toca una pieza para ponerla, arrástrala en el muro y gírala con ⟲ ⟳. Los dominós y las bolitas caen al piso o a la tabla de abajo.', 'Tap a part to add it, drag it on the wall and turn it with ⟲ ⟳. Dominoes and balls drop onto the floor or plank below.')) + '</p>' +
      '</div>');
    autoSay(isFree ? T('Inventa tu máquina.', 'Invent your machine.') : one(L.say));
    stage('tm-cv', L.w / L.h, 220, 560);
    S.draw = function() { drawChain(st); };
    S.tick = function(dt) { return chainTick(st, dt); };
    $('tm-run').addEventListener('click', function() { if (st.mode === 'build') runChain(st); else resetChain(st); });
    $('tm-rotl').addEventListener('click', function() { rotateSel(st, 1); });
    $('tm-rotr').addEventListener('click', function() { rotateSel(st, -1); });
    $('tm-delp').addEventListener('click', function() { if (st.sel >= 0 && st.mode === 'build') { st.placed.splice(st.sel, 1); st.sel = -1; chainChanged(st); } });
    $('tm-clear').addEventListener('click', function() { if (st.mode !== 'build') resetChain(st); st.placed = []; st.sel = -1; chainChanged(st); });
    bindChainDrag(st);
    buildTray(st);
    syncChainUI(st);
    redraw();
  }
  function partsLeft(st, type) { var used = st.placed.filter(function(p) { return p.type === type; }).length; return (st.L.parts[type] || 0) - used; }
  function buildTray(st) {
    var box = $('tm-tray');
    if (!box) return;
    box.innerHTML = Object.keys(st.L.parts).map(function(t) {
      var left = partsLeft(st, t);
      return '<button type="button" class="tm-part" data-part="' + t + '"' + (left > 0 && st.mode === 'build' ? '' : ' disabled') + '>' +
        '<canvas data-ptype="' + t + '" aria-hidden="true"></canvas><span>' + bi(D.PART_NAMES[t]) + '</span><b>×' + left + '</b></button>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('[data-part]'), function(b) {
      b.addEventListener('click', function() { addPart(st, b.getAttribute('data-part')); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-ptype]'), function(cv) {
      var dpr = Math.min(ZsCanvas.dpr(), 2), W = 54, H = 40;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      var g = ZsCanvas.get2d(cv); if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var t = cv.getAttribute('data-ptype'), P = Ph.PARTS[t], sz = P.r ? P.r * 2 : Math.max(P.w, P.h);
      var s = Math.min(46 / sz, t === 'domino' ? 160 : 400);
      if (t === 'seesaw') { SC.stand(g, W / 2, H / 2, 0.18, s); }
      SC.part(g, t, W / 2, H / 2, t === 'seesaw' ? 0.3 : 0, s, {});
    });
  }
  function syncChainUI(st) {
    var run = $('tm-run');
    if (run) run.textContent = st.mode === 'build' ? '▶ ' + T('¡Andando!', 'Run it!') : '■ ' + T('Volver a armar', 'Back to building');
    var selOk = st.mode === 'build' && st.sel >= 0;
    ['tm-rotl', 'tm-rotr', 'tm-delp'].forEach(function(id) { var b = $(id); if (b) b.disabled = !selOk; });
    var cl = $('tm-clear'); if (cl) cl.disabled = st.mode !== 'build' || !st.placed.length;
    buildTray(st);
  }
  function chainChanged(st) {
    var d = _load();
    d.designs[st.L.id] = encodeParts(st.placed);
    _save(d);
    syncChainUI(st); redraw();
  }
  function snapPart(st, p, idx) {
    var P = Ph.PARTS[p.type];
    p.x = Math.max(0.05, Math.min(st.L.w - 0.05, Math.round(p.x / 0.01) * 0.01));
    if (P.static) { p.y = Math.max(0.05, Math.min(st.L.h - 0.05, Math.round(p.y / 0.01) * 0.01)); return; }
    var half = P.r ? P.r : p.type === 'seesaw' ? 0.18 : P.h / 2;
    var top = Ph.surfaceBelow(st.L, st.placed, p.x, p.y, idx);
    p.y = Math.round((top + half + (P.r ? 0.001 : 0.0005)) * 1000) / 1000;
    if (p.type === 'seesaw' && !p.a) p.a = -18;
  }
  function addPart(st, type) {
    if (st.mode !== 'build' || partsLeft(st, type) <= 0) return;
    sfx('click');
    var p = { type: type, x: 1.5, y: 1.2, a: 0 };
    if (type === 'plank' || type === 'long') { p.x = 1.5; p.y = 1.2; }
    // drop in a free spot near the middle
    var tries = 0;
    while (tries++ < 12 && st.placed.some(function(q) { return Math.abs(q.x - p.x) < 0.12 && Math.abs(q.y - p.y) < 0.25; })) p.x += 0.14;
    if (p.x > st.L.w - 0.1) p.x = 0.6;
    st.placed.push(p);
    snapPart(st, p, st.placed.length - 1);
    st.sel = st.placed.length - 1;
    chainChanged(st);
  }
  function rotateSel(st, dir) {
    var p = st.placed[st.sel];
    if (!p || st.mode !== 'build') return;
    sfx('click');
    if (p.type === 'seesaw') p.a = -(p.a || -18);
    else if (Ph.PARTS[p.type].static) p.a = Math.max(-60, Math.min(60, (p.a || 0) + dir * 5));
    else return;
    chainChanged(st);
  }
  function hitPart(st, wx, wy) {
    var best = -1, bd = 1e9;
    st.placed.forEach(function(p, i) {
      var P = Ph.PARTS[p.type], dx = wx - p.x, dy = wy - p.y, a = -(p.a || 0) * Math.PI / 180;
      var lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      var hw = (P.r || P.w / 2) + 0.06, hh = (P.r || P.h / 2) + 0.06;
      if (Math.abs(lx) < hw && Math.abs(ly) < hh) { var dd = lx * lx + ly * ly; if (dd < bd) { bd = dd; best = i; } }
    });
    return best;
  }
  function bindChainDrag(st) {
    var cv = S.cv;
    // keyboard: Tab cycles through the placed parts, arrows nudge 5 cm
    cv.addEventListener('keydown', function(e) {
      if (st.mode !== 'build' || !st.placed.length) return;
      var k = e.key, p;
      if (k === 'Tab' && !e.shiftKey && st.sel < st.placed.length - 1) { st.sel++; e.preventDefault(); syncChainUI(st); redraw(); return; }
      if (k === 'Tab' && e.shiftKey && st.sel > 0) { st.sel--; e.preventDefault(); syncChainUI(st); redraw(); return; }
      p = st.placed[st.sel];
      if (!p) return;
      var dx = k === 'ArrowLeft' ? -0.05 : k === 'ArrowRight' ? 0.05 : 0, dy = k === 'ArrowUp' ? 0.05 : k === 'ArrowDown' ? -0.05 : 0;
      if (!dx && !dy) return;
      e.preventDefault();
      p.x = Math.max(0.05, Math.min(st.L.w - 0.05, p.x + dx));
      p.y = Math.max(0.03, Math.min(st.L.h - 0.03, p.y + dy));
      snapPart(st, p, st.sel);
      chainChanged(st);
    });
    cv.addEventListener('pointerdown', function(e) {
      if (st.mode !== 'build') return;
      var p = pos(e), cam = chainCam(st.L, S.W, S.H), wx = (p.x - cam.ox) / cam.s, wy = (cam.oy - p.y) / cam.s;
      var i = hitPart(st, wx, wy);
      st.sel = i;
      if (i >= 0) {
        e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        st.drag = { i: i, dx: st.placed[i].x - wx, dy: st.placed[i].y - wy };
      }
      syncChainUI(st); redraw();
    });
    cv.addEventListener('pointermove', function(e) {
      if (!st.drag) return;
      var p = pos(e), cam = chainCam(st.L, S.W, S.H), wx = (p.x - cam.ox) / cam.s, wy = (cam.oy - p.y) / cam.s;
      var q = st.placed[st.drag.i];
      q.x = Math.max(0.05, Math.min(st.L.w - 0.05, wx + st.drag.dx));
      q.y = Math.max(0.03, Math.min(st.L.h - 0.03, wy + st.drag.dy));
      st.drag.moved = true;
      redraw();
    });
    function end() {
      if (!st.drag) return;
      var q = st.placed[st.drag.i];
      if (q) snapPart(st, q, st.drag.i);
      st.drag = null;
      chainChanged(st);
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }
  function runChain(st) {
    sfx('click');
    st.mode = 'run'; st.sel = -1; st.runs++; st.idle = 0; st.acc = 0; st.ringT = 0; st.held = 0; st.won = false;
    st.world = Ph.buildWorld(st.L, st.placed);
    syncChainUI(st);
    kick();
  }
  function resetChain(st) {
    st.mode = 'build'; st.world = null; st.ringT = 0;
    syncChainUI(st); redraw();
  }
  function chainTick(st, dt) {
    if (S.screen !== 'chain' || st.mode !== 'run' || !st.world) return false;
    var W = st.world;
    st.acc += dt;
    var steps = 0;
    while (st.acc >= Ph.DT && steps < 3) { W.step(Ph.DT); st.acc -= Ph.DT; steps++; }
    if (st.acc > Ph.DT) st.acc = 0;
    if (W.touched.bell && !st.ringT) { st.ringT = 0.001; bellSound(); }
    if (st.ringT) st.ringT += dt;
    if (st.L.goal && !st.won) {
      if (Ph.goalMet(W)) st.held++; else st.held = 0;
      if (st.held >= 12) { st.won = true; chainWin(st); }
    }
    var ke = W.kinetic();
    st.idle = ke < 1e-4 && W.t > 1 ? st.idle + dt : 0;
    if (!st.won && st.L.goal && (W.t > 12 || st.idle > 1.2)) {
      st.mode = 'stopped';
      flash(T('Casi… Cambia algo y prueba otra vez.', 'Nearly… Change something and try again.'), 'bad');
      syncChainUI(st);
      return false;
    }
    if (!st.L.goal && W.t > 30) return false;
    return st.mode === 'run' && (st.won ? st.ringT < 2 || W.t < 14 : true);
  }
  function chainWin(st) {
    sfx('correct');
    var L = st.L, used = st.placed.length;
    var stars = 1 + (used <= L.par ? 1 : 0) + (st.runs <= 3 ? 1 : 0);
    var prev = award('cr', L.id, stars, one(L.name));
    setTimeout(function() {
      if (S.cs !== st) return;
      showWin(stars, prev, T('Usaste ', 'You used ') + used + (used === 1 ? T(' pieza en ', ' part in ') : T(' piezas en ', ' parts in ')) + st.runs + (st.runs === 1 ? T(' prueba.', ' run.') : T(' pruebas.', ' runs.')), function() {
        var i = D.LEVELS.indexOf(L), nx = D.LEVELS[i + 1];
        if (nx && age() >= (nx.minAge || 0)) chain(nx.id); else chainList();
      });
    }, 900);
  }
  var _ac = null;
  function bellSound() {
    try {
      _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
      if (_ac.state === 'suspended') _ac.resume();
      [880, 1320, 2200].forEach(function(f, i) {
        var o = _ac.createOscillator(), gn = _ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        gn.gain.setValueAtTime(0.18 / (i + 1), _ac.currentTime);
        gn.gain.exponentialRampToValueAtTime(0.0001, _ac.currentTime + 1.6);
        o.connect(gn); gn.connect(_ac.destination); o.start(); o.stop(_ac.currentTime + 1.7);
      });
    } catch (e) {}
  }

  function drawChainStatic(g, cam, L, W, ring) {
    (L.statics || []).forEach(function(s) { SC.shelf(g, cam, s, s.tag); });
    if (L.goal && L.goal.type === 'cup') SC.cup(g, cam, L.goal, W && Ph.goalMet(W));
    if (L.goal && L.goal.type === 'bell') SC.bell(g, cam, L.goal, ring);
  }
  function drawPartDef(g, cam, p, opts) {
    var x = A.X(cam, p.x), y = A.Y(cam, p.y), a = -(p.a || 0) * Math.PI / 180;
    if (p.type === 'seesaw') {
      SC.stand(g, x, y, Math.max(0.04, p.y - Ph.surfaceBelow(cam.L || { statics: [] }, [], p.x, p.y)) || 0.18, cam.s);
    }
    SC.part(g, p.type, x, y, a, cam.s, opts);
  }
  function drawChain(st) {
    var g = S.g;
    if (!g) return;
    clearCanvas();
    var L = st.L, cam = chainCam(L, S.W, S.H);
    cam.L = L;
    var bk = backdrop(A.Y(cam, 0), 11, true);
    if (bk) g.drawImage(bk, 0, 0, S.W, S.H);
    // faint grid while building, so parts line up
    if (st.mode === 'build') {
      g.strokeStyle = 'rgba(30,78,140,0.07)'; g.lineWidth = 1;
      for (var gx = 0; gx <= L.w + 1e-6; gx += 0.1) { g.beginPath(); g.moveTo(A.X(cam, gx), A.Y(cam, 0)); g.lineTo(A.X(cam, gx), A.Y(cam, L.h)); g.stroke(); }
      for (var gy = 0; gy <= L.h + 1e-6; gy += 0.1) { g.beginPath(); g.moveTo(A.X(cam, 0), A.Y(cam, gy)); g.lineTo(A.X(cam, L.w), A.Y(cam, gy)); g.stroke(); }
    }
    var W = st.world;
    drawChainStatic(g, cam, L, W, st.ringT);
    if (!W) {
      (L.fixed || []).forEach(function(p) { drawPartDef(g, cam, p, { locked: true }); });
      st.placed.forEach(function(p, i) { drawPartDef(g, cam, p, { sel: i === st.sel }); });
      return;
    }
    // running: draw from the simulation
    W.parts.forEach(function(pt) {
      var ref = pt.ref, def = pt.def;
      if (ref.pts) { drawPartDef(g, cam, def, {}); return; }
      if (ref.p != null) { SC.part(g, def.type, A.X(cam, W.x[ref.p]), A.Y(cam, W.y[ref.p]), 0, cam.s, { roll: ref.roll }); return; }
      var q = W.boxPose(ref);
      if (def.type === 'seesaw') SC.stand(g, A.X(cam, W.x[ref.pivot]), A.Y(cam, W.y[ref.pivot]), Math.max(0.04, W.y[ref.pivot] - Ph.surfaceBelow(L, [], W.x[ref.pivot], W.y[ref.pivot])), cam.s);
      var cx = def.type === 'seesaw' ? W.x[ref.pivot] : q.x, cy = def.type === 'seesaw' ? W.y[ref.pivot] : q.y;
      if (def.type === 'seesaw') {
        // board drawn about its centre; pivot pin drawn on top
        SC.part(g, 'seesaw', A.X(cam, q.x), A.Y(cam, q.y), -q.ang, cam.s, {});
        g.fillStyle = '#1f2937'; g.beginPath(); g.arc(A.X(cam, cx), A.Y(cam, cy), Math.max(3, cam.s * 0.015), 0, TAU); g.fill();
      } else SC.part(g, def.type, A.X(cam, q.x), A.Y(cam, q.y), -q.ang, cam.s, {});
    });
  }

  // ================================================================
  //  INIT
  // ================================================================
  function init() {
    if (!root()) return;
    if (typeof CloudSync !== 'undefined' && CloudSync.online && _key()) { try { CloudSync.pull(_key()); } catch (e) {} }
    var h = (location.hash || '').replace('#', '');
    if (h === 'gears') gears(); else if (h === 'bike') bike(); else if (h === 'challenges') challenges(); else if (h === 'chain') chainList();
    else if (machineDef(h)) machine(h); else home();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    starsOf: starsOf, maxStars: maxStars, home: home, machines: machines, machine: machine, gears: gears, bike: bike,
    challenges: challenges, chainList: chainList, chain: chain, encodeParts: encodeParts, decodeParts: decodeParts,
    _state: S, _calc: calc
  };
})();
