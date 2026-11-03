/* ================================================================
   MI NEGOCIO — run a summer street stand in Chile for 14 days.
   Teaches revenue vs profit, costs (variable & fixed), supply and
   demand, pricing (elasticity), spoilage, reputation and loans.
   Complements Money Master (coins & change) and Invest Quest
   (risk & markets).
   Per-kid storage: getUserAppKey('zs_negocio_') →
     { seasons, best: { <product>: { profit, stars } }, quizBest,
       lastPlayed, cur: <season in progress or null> }
   Exposes one global: MiNegocio.
   ================================================================ */

var MiNegocio = (function() {
  'use strict';

  var D = MiNegocioData;
  var SEASON_DAYS = 14;
  var PERMIT = 2000;      // permiso municipal per day (Pro)
  var ICE = 1500;         // bag of ice per day for cold products (Pro)
  var UPGRADE = 25000;    // second pot & burner (Pro)
  var LOAN = 30000, LOAN_RATE = 0.10, LOAN_DAY = 8;
  var TIERS = { simple: [0.3, 0.55, 0.8], pro: [0.3, 0.55, 0.78] };

  // ---- storage -----------------------------------------------------
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    return getUserAppKey('zs_negocio_');
  }
  function _load() {
    var key = _key();
    if (!key) return {};
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function _save(data) {
    var key = _key();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync && CloudSync.online) CloudSync.push(key);
    } catch (e) {}
  }

  // ---- helpers -----------------------------------------------------
  function money(n) {
    n = Math.round(n);
    return (n < 0 ? '−$' : '$') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function sound(n) { if (typeof SFX !== 'undefined' && SFX[n]) { try { SFX[n](); } catch (e) {} } }
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s); }
  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function root() { return document.getElementById('mn-wrap'); }
  function user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function age() { var u = user(); return (u && u.age) || 8; }
  function tier() { return typeof getAgeTier === 'function' ? getAgeTier(age()) : 'intermediate'; }
  function defaultMode() { var t = tier(); return (t === 'beginner' || t === 'intermediate') ? 'simple' : 'pro'; }
  function clock(t) {
    var m = Math.round(600 + t), hh = Math.floor(m / 60), mm = m % 60;
    return hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function heartsHtml(rep) {
    var n = clamp(Math.round((rep - 0.7) / 0.6 * 5), 1, 5), s = '';
    for (var i = 0; i < 5; i++) s += '<span class="mn-heart' + (i < n ? ' on' : '') + '" aria-hidden="true">♥</span>';
    return '<span class="mn-hearts" title="Reputation" aria-label="Reputation ' + n + ' of 5">' + s + '</span>';
  }
  function dayName(d) { return D.DAY_NAMES[(d - 1) % 7]; }

  // ---- state -------------------------------------------------------
  var S = null;          // the season in progress
  var scene = null;      // MiNegocioArt scene on screen
  var today = null;      // today's outcome while the day plays
  var quiz = null;
  var setupPick = { product: 'empanadas', place: 'plaza', mode: null };

  // ---- season generation ------------------------------------------
  function genSchedule(r) {
    var bag = shuffle(['hot', 'hot', 'hot', 'hot', 'sunny', 'sunny', 'sunny', 'sunny', 'sunny',
      'cloudy', 'cloudy', 'cloudy', 'rainy', 'rainy'], r);
    // a gentle first day
    var si = bag.indexOf('sunny'); bag[si] = bag[0]; bag[0] = 'sunny';
    var evs = [];
    for (var i = 0; i < SEASON_DAYS; i++) evs.push('normal');
    var fiestaSat = r() < 0.5 ? 5 : 12;
    evs[5] = fiestaSat === 5 ? 'fiesta' : 'sabado';
    evs[12] = fiestaSat === 12 ? 'fiesta' : 'sabado';
    evs[6] = 'misa'; evs[13] = r() < 0.5 ? 'misa' : 'procesion';
    var weekdays = shuffle([1, 2, 3, 4, 7, 8, 9, 10, 11], r);
    var pool = shuffle(['futbol', 'feria', 'tour', 'obras', 'rival', 'campamento'], r).slice(0, 5);
    if (pool.indexOf('futbol') < 0) pool[0] = 'futbol';
    for (var k = 0; k < pool.length; k++) evs[weekdays[k]] = pool[k];
    var out = [];
    for (var d = 0; d < SEASON_DAYS; d++) {
      var w = D.WEATHER[bag[d]];
      var mk = {};
      if (r() < 0.55) mk.fresh = [0.85, 1.15, 1.25][Math.floor(r() * 3)];
      if (r() < 0.3) mk.dry = [0.9, 1.1][Math.floor(r() * 2)];
      out.push({ w: bag[d], temp: w.t[0] + Math.floor(r() * (w.t[1] - w.t[0] + 1)), ev: evs[d], mk: mk });
    }
    return out;
  }

  function placeAdj(place, w) {
    if (place !== 'playa') return 1;
    return { sunny: 1.1, hot: 1.3, cloudy: 0.75, rainy: 0.5 }[w] || 1;
  }

  // Expected buyers (units) for a day at a price — the heart of the model.
  function demand(st, d, price, rep) {
    var p = D.product(st.product), dd = st.sched[d - 1];
    var W = D.WEATHER[dd.w], E = D.EVENTS[dd.ev];
    var traffic = W.traffic * E.traffic * placeAdj(st.place, dd.w);
    var fitE = E.fit[p.id] != null ? E.fit[p.id] : (E.fit.all || 1);
    var tAdj = 1;
    if (p.cold) tAdj = 1 + (dd.temp - 27) * 0.025;
    else if (p.id === 'sopaipillas') tAdj = 1 - (dd.temp - 22) * 0.012;
    else if (p.id === 'empanadas') tAdj = 1 - Math.max(0, dd.temp - 28) * 0.02;
    var interested = p.base * traffic * p.fit[dd.w] * fitE * tAdj * rep;
    var priceF = Math.min(1.7, Math.pow(p.ref / Math.max(1, price), p.e));
    return { interested: interested, priceF: priceF, expected: interested * priceF, traffic: traffic, fit: p.fit[dd.w] * fitE * tAdj };
  }

  function ingPrice(st, g, d) {
    if (st.mode !== 'pro') return g.cost;
    var mk = (st.sched[d - 1] || {}).mk || {};
    var f = g.keeps ? (mk.dry || 1) : (mk.fresh || 1);
    return Math.round(g.cost * f / 10) * 10;
  }

  // Simple mode uses round numbers; Pro uses the exact ingredient maths.
  function uc(p, st) { st = st || S; return (st && st.mode === 'pro') ? p.unitCost : p.roundCost; }
  function fixedCost(st, p) { return st.mode === 'pro' ? PERMIT + (p.cold ? ICE : 0) : 0; }
  function capBatches(st, p) { return st.mode === 'pro' ? p.cap * (st.upgrade ? 2 : 1) : 6; }

  // The goals: a share of what a careful seller could earn this season.
  function benchmark(st) {
    var p = D.product(st.product), tot = 0;
    var cap = (st.mode === 'pro' ? p.cap : 6) * p.batch;
    for (var d = 1; d <= SEASON_DAYS; d++) {
      // a careful seller keeps a good reputation, so assume it a little above neutral
      var e = Math.min(cap, demand(st, d, p.ref, 1.15).expected);
      var day = e * (p.ref - uc(p, st)) - fixedCost(st, p);
      tot += Math.max(0, day);
    }
    return tot;
  }
  function goalsFor(st) {
    var b = benchmark(st), t = TIERS[st.mode];
    var step = b > 150000 ? 5000 : 1000;
    return t.map(function(f) { return Math.max(step, Math.round(b * f / step) * step); });
  }
  function starsFor(st, profit) {
    var n = 0;
    for (var i = 0; i < 3; i++) if (profit >= st.goals[i]) n = i + 1;
    return n;
  }

  function newSeason(pid, place, mode) {
    var p = D.product(pid);
    var seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    var r = rng(seed);
    var start = Math.max(30000, Math.ceil(p.unitCost * p.batch * p.cap * 1.1 / 5000) * 5000);
    var st = {
      v: 1, product: pid, place: place, mode: mode, day: 1, start: start, cash: start, rep: 1,
      sched: genSchedule(r), log: [], pantry: {}, bought: {}, dayOld: 0, freezer: 0,
      loan: 0, loanOffered: false, upgrade: false, plan: null, seed: seed
    };
    p.ings.forEach(function(g) { st.pantry[g.id] = 0; });
    st.goals = goalsFor(st);
    st.plan = defaultPlan(st);
    return st;
  }

  // Tomorrow starts from today's choices — the kid adjusts them to the forecast.
  function defaultPlan(st) {
    var p = D.product(st.product);
    var last = st.log && st.log.length ? st.log[st.log.length - 1] : null;
    var batches = last && last.made ? Math.round(last.made / p.batch) : (p.batch >= 20 ? 1 : 2);
    return { batches: clamp(batches, 1, capBatches(st, p)), price: last ? last.price : p.ref };
  }

  // ---- persistence of the season in progress -------------------------
  function saveCur() {
    var data = _load();
    data.cur = S ? JSON.parse(JSON.stringify(S)) : null;
    _save(data);
  }

  // ================================================================
  //  HOME
  // ================================================================
  function home() {
    sound('click');
    _renderHome();
  }

  function _renderHome() {
    stopScene();
    var data = _load();
    var seasons = data.seasons || 0;
    var best = data.best || {};
    var stars = getStars(data);
    var cur = data.cur && data.cur.v === 1 && data.cur.day <= SEASON_DAYS + 1 ? data.cur : null;
    var bestRows = D.PRODUCTS.filter(function(p) { return best[p.id]; }).map(function(p) {
      var b = best[p.id];
      return '<div class="mn-best-row"><span>' + p.icon + ' ' + esc(p.short) + '</span><b>' + money(b.profit) + '</b>' +
        '<span class="mn-best-stars">' + starStr(b.stars) + '</span></div>';
    }).join('');

    root().innerHTML =
      '<div class="mn-home">' +
        '<div class="mn-hero">' +
          '<canvas id="mn-hero-canvas" class="mn-hero-canvas" aria-label="A street stand in a Chilean plaza" role="img"></canvas>' +
        '</div>' +
        '<div class="mn-header">' +
          '<h1>Mi Negocio</h1>' +
          '<p>Run your own summer street stand in Chile — buy ingredients, set your price, and make a profit!</p>' +
        '</div>' +
        '<div class="mn-home-stats">' +
          '<span>⭐ ' + stars + ' star' + (stars === 1 ? '' : 's') + '</span>' +
          '<span>🗓️ ' + seasons + ' season' + (seasons === 1 ? '' : 's') + '</span>' +
          (data.quizBest ? '<span>🧠 Quiz best ' + data.quizBest + '/6</span>' : '') +
        '</div>' +
        '<div class="mn-home-grid">' +
          (cur ? '<button type="button" class="mn-card mn-card-go" onclick="MiNegocio.resume()">' +
            '<span class="mn-card-icon">▶️</span><span class="mn-card-name">Continue season</span>' +
            '<span class="mn-card-desc">' + esc(D.product(cur.product).name) + ' · ' + (cur.day > SEASON_DAYS ? 'see your results' : 'Day ' + cur.day + ' of ' + SEASON_DAYS) + '</span></button>' : '') +
          '<button type="button" class="mn-card mn-card-new" onclick="MiNegocio.setup()">' +
            '<span class="mn-card-icon">🏪</span><span class="mn-card-name">' + (cur ? 'Start a new season' : 'Open my stand') + '</span>' +
            '<span class="mn-card-desc">14 summer days. Pick a product, watch the weather, earn a profit.</span></button>' +
          '<button type="button" class="mn-card mn-card-learn" onclick="MiNegocio.learn()">' +
            '<span class="mn-card-icon">📒</span><span class="mn-card-name">Business ideas</span>' +
            '<span class="mn-card-desc">Revenue, profit, costs, supply & demand — plus a quiz.</span></button>' +
        '</div>' +
        (bestRows ? '<div class="mn-panel mn-best"><div class="mn-panel-title">🏆 Best season profit</div>' + bestRows + '</div>' : '') +
      '</div>';

    var c = document.getElementById('mn-hero-canvas');
    if (c && typeof MiNegocioArt !== 'undefined') {
      var pids = ['empanadas', 'mote', 'sopaipillas', 'limonada'];
      var pid = pids[new Date().getDate() % pids.length];
      var p = D.product(pid);
      scene = MiNegocioArt.Scene(c, {
        place: 'plaza', weather: 'sunny', product: pid, price: p.ref, label: p.short.toUpperCase(),
        short: p.short, stock: 14, made: 16, dayOld: 0, event: null
      });
      scene.idle();
    }
  }

  function starStr(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '⭐' : '☆'; return s; }

  function getStars(d) {
    var n = 0, b = (d && d.best) || {};
    for (var k in b) if (b[k]) n += Math.min(3, b[k].stars || 0);
    return n + (((d && d.quizBest) || 0) >= 5 ? 1 : 0);
  }

  function stopScene() { if (scene) { scene.stop(); scene = null; } }

  function topBar(label, back) {
    return '<div class="mn-top">' +
      '<button type="button" class="mn-back" aria-label="Back to Mi Negocio home" onclick="MiNegocio.' + (back || 'home') + '()">←</button>' +
      '<div class="mn-top-label">' + label + '</div><span class="mn-top-spacer"></span></div>';
  }

  // ================================================================
  //  SETUP
  // ================================================================
  function setup() {
    sound('click');
    stopScene();
    var data = _load();
    if (!setupPick.mode) setupPick.mode = defaultMode();
    var unlocked = (data.seasons || 0) >= 1;
    var cards = D.PRODUCTS.map(function(p) {
      var locked = p.locked && !unlocked;
      var sel = setupPick.product === p.id;
      var fit = [];
      if (p.fit.hot >= 1.3) fit.push('🔥 loves hot days');
      if (p.fit.rainy >= 1.3) fit.push('🌧️ loves rain');
      if (p.fit.cloudy > 1.05) fit.push('☁️ good when cool');
      return '<button type="button" class="mn-prod' + (sel ? ' sel' : '') + (locked ? ' locked' : '') + '" ' +
        (locked ? 'aria-disabled="true" ' : '') + 'onclick="MiNegocio.pick(\'product\',\'' + p.id + '\')" aria-pressed="' + sel + '">' +
        '<canvas class="mn-prod-thumb" data-thumb="' + p.id + '" aria-hidden="true"></canvas>' +
        '<span class="mn-prod-name">' + esc(p.name) + '</span>' +
        '<span class="mn-prod-blurb">' + esc(p.blurb) + '</span>' +
        '<span class="mn-prod-meta">Costs ~' + money(uc(p)) + ' · sells ~' + money(p.ref) + '</span>' +
        '<span class="mn-prod-fit">' + (fit.join(' · ') || '🙂 steady seller') + '</span>' +
        (locked ? '<span class="mn-lock">🔒 Finish one season to unlock</span>' : '') +
      '</button>';
    }).join('');
    var places = D.PLACES.map(function(pl) {
      var sel = setupPick.place === pl.id;
      return '<button type="button" class="mn-chip' + (sel ? ' sel' : '') + '" aria-pressed="' + sel + '" onclick="MiNegocio.pick(\'place\',\'' + pl.id + '\')">' +
        (pl.id === 'plaza' ? '⛪ ' : '🌊 ') + esc(pl.name) + '<small>' + esc(pl.note) + '</small></button>';
    }).join('');
    var modes = [
      { id: 'simple', name: '🙂 Simple', note: 'Ingredients bought for you, pick from 3 prices.' },
      { id: 'pro', name: '🧑‍💼 Pro', note: 'Shop for ingredients, set any price, pay a permit and ice, loans.' }
    ].map(function(m) {
      var sel = setupPick.mode === m.id;
      return '<button type="button" class="mn-chip' + (sel ? ' sel' : '') + '" aria-pressed="' + sel + '" onclick="MiNegocio.pick(\'mode\',\'' + m.id + '\')">' +
        m.name + '<small>' + m.note + '</small></button>';
    }).join('');
    root().innerHTML =
      '<div class="mn-screen">' + topBar('New season') +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">1 · What will you sell?</div>' +
          '<p class="mn-sub">Each product has its own costs, price and best weather. Fresh food that spoils is riskier!</p>' +
          '<div class="mn-prod-grid">' + cards + '</div>' +
        '</div>' +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">2 · Where is your stand?</div>' +
          '<div class="mn-chip-row">' + places + '</div>' +
          '<div class="mn-panel-title mn-mt">3 · How do you want to play?</div>' +
          '<div class="mn-chip-row">' + modes + '</div>' +
        '</div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn primary big" onclick="MiNegocio.begin()">Start the summer ☀️</button></div>' +
      '</div>';
    var thumbs = document.querySelectorAll('[data-thumb]');
    for (var i = 0; i < thumbs.length; i++) MiNegocioArt.drawThumb(thumbs[i], thumbs[i].getAttribute('data-thumb'));
  }

  function pick(what, val) {
    if (what === 'product') {
      var p = D.product(val), data = _load();
      if (p.locked && !((data.seasons || 0) >= 1)) {
        sound('wrong');
        if (typeof ZsDialog !== 'undefined') ZsDialog.toast('Finish one season to unlock Helados 🍦');
        return;
      }
    }
    setupPick[what] = val;
    sound('click');
    var y = window.scrollY;
    setup();
    window.scrollTo(0, y);
  }

  function begin() {
    var data = _load();
    var go = function() {
      sound('cheer');
      S = newSeason(setupPick.product, setupPick.place, setupPick.mode || defaultMode());
      saveCur();
      renderIntro();
    };
    if (data.cur && typeof ZsDialog !== 'undefined') {
      ZsDialog.confirm({ title: 'Start over?', message: 'Your season in progress will be replaced.', okText: 'Start new', cancelText: 'Keep it' })
        .then(function(ok) { if (ok) go(); });
    } else go();
  }

  function resume() {
    var data = _load();
    if (!data.cur) { setup(); return; }
    S = data.cur;
    sound('click');
    renderMorning();
  }

  function renderIntro() {
    var p = D.product(S.product);
    var simple = S.mode === 'simple';
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Your summer plan') +
        '<div class="mn-panel mn-intro">' +
          '<div class="mn-intro-head"><canvas class="mn-intro-thumb" data-thumb="' + p.id + '" aria-hidden="true"></canvas>' +
            '<div><div class="mn-panel-title">' + esc(p.name) + '</div><p class="mn-sub">' + esc(p.blurb) + '</p></div></div>' +
          '<div class="mn-facts">' +
            '<div><small>Starting savings</small><b>' + money(S.start) + '</b></div>' +
            '<div><small>Cost to make one</small><b>' + money(uc(p)) + '</b></div>' +
            '<div><small>Fair street price</small><b>' + money(p.ref) + '</b></div>' +
            '<div><small>One batch</small><b>' + p.batch + ' ' + esc(p.units) + '</b></div>' +
          '</div>' +
          '<p class="mn-note">🧊 ' + esc(p.keepNote) + '</p>' +
          (simple ? '' : '<p class="mn-note">🧾 Every open day you pay a stand permit (' + money(PERMIT) + ')' + (p.cold ? ' and a bag of ice (' + money(ICE) + ')' : '') + '. Your kitchen can make ' + p.cap + ' batches a day.</p>') +
          '<div class="mn-goals"><div class="mn-goals-title">🎯 Profit goals for 14 days</div>' +
            S.goals.map(function(g, i) { return '<div class="mn-goal"><span>' + starStr(i + 1) + '</span><b>' + money(g) + '</b></div>'; }).join('') +
          '</div>' +
          '<p class="mn-sub">' + (simple
            ? 'Each morning: check the weather, choose how many to make and pick a price. Then watch your stand!'
            : 'Each morning: check the forecast, shop for ingredients, choose how many batches and set your price. Watch the day — then read your receipt.') + '</p>' +
        '</div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn primary big" onclick="MiNegocio.morning()">Day 1 → 🌅</button></div>' +
      '</div>';
    var t = document.querySelector('[data-thumb]');
    if (t) MiNegocioArt.drawThumb(t, p.id);
  }

  // ================================================================
  //  MORNING — forecast + plan
  // ================================================================
  function forecastCard(st) {
    var dd = st.sched[st.day - 1], W = D.WEATHER[dd.w], E = D.EVENTS[dd.ev], dn = dayName(st.day);
    var p = D.product(st.product);
    var dm = demand(st, st.day, p.ref, st.rep);
    var feel = dm.fit >= 1.3 ? { t: 'Perfect weather for ' + p.short.toLowerCase() + '!', c: 'great' }
      : dm.fit >= 0.95 ? { t: 'Good weather for ' + p.short.toLowerCase() + '.', c: 'good' }
      : dm.fit >= 0.7 ? { t: 'So-so weather for ' + p.short.toLowerCase() + '.', c: 'meh' }
      : { t: 'Tough weather for ' + p.short.toLowerCase() + '…', c: 'bad' };
    return '<div class="mn-forecast mn-w-' + dd.w + '">' +
      '<div class="mn-fc-main">' +
        '<span class="mn-fc-icon" aria-hidden="true">' + W.icon + '</span>' +
        '<div><div class="mn-fc-temp">' + dd.temp + '°C</div>' +
          '<div class="mn-fc-name">' + W.name + ' · <i>' + W.es + '</i></div></div>' +
        '<div class="mn-fc-day"><b>Day ' + st.day + '</b><small>' + dn.en + ' · ' + dn.es + '</small></div>' +
      '</div>' +
      '<div class="mn-fc-fit ' + feel.c + '">' + esc(feel.t) + '</div>' +
      '<div class="mn-town"><span class="mn-town-icon" aria-hidden="true">' + E.icon + '</span>' +
        '<div><b>Today in town: ' + esc(E.title) + '</b><small>' + esc(E.note) + '</small></div></div>' +
    '</div>';
  }

  function statusStrip(st) {
    var p = D.product(st.product);
    var extra = '';
    if (st.dayOld > 0) extra += '<span>🥟 ' + st.dayOld + ' day-old (½ price)</span>';
    if (st.freezer > 0) extra += '<span>❄️ ' + st.freezer + ' in the freezer</span>';
    if (st.loan > 0) extra += '<span>🏦 Loan: owe ' + money(st.loan) + '</span>';
    return '<div class="mn-status">' +
      '<span class="mn-cash">💰 ' + money(st.cash) + '</span>' +
      '<span>' + heartsHtml(st.rep) + '</span>' + extra +
      (st.upgrade ? '<span>🍳 Big kitchen</span>' : '') +
      '</div>' + (p ? '' : '');
  }

  function morning() {
    sound('click');
    renderMorning();
  }

  function renderMorning() {
    stopScene();
    if (!S) { _renderHome(); return; }
    if (S.day > SEASON_DAYS) { finishSeason(); return; }
    if (!S.plan) S.plan = defaultPlan(S);
    if (S.mode === 'pro') { renderShop(); return; }
    renderSimplePlan();
  }

  // ---- Simple mode: one screen -------------------------------------
  function renderSimplePlan() {
    var p = D.product(S.product);
    var pl = S.plan;
    var units = pl.batches * p.batch;
    var cost = units * uc(p);
    var maxB = Math.min(capBatches(S, p), Math.floor(S.cash / (uc(p) * p.batch)));
    if (pl.batches > maxB) { pl.batches = Math.max(0, maxB); units = pl.batches * p.batch; cost = units * uc(p); }
    var dm = demand(S, S.day, pl.price, S.rep);
    var lo = Math.max(0, Math.round(dm.expected * 0.85)), hi = Math.round(dm.expected * 1.15);
    var stockNote = S.dayOld ? ' + ' + S.dayOld + ' from yesterday' : (S.freezer ? ' + ' + S.freezer + ' from the freezer' : '');
    var labels = ['Low price', 'Fair price', 'High price'];
    var hints = ['More buyers, less money each', 'What most stands charge', 'More money each, fewer buyers'];
    var prices = p.simple.map(function(v, i) {
      var sel = pl.price === v;
      return '<button type="button" class="mn-price' + (sel ? ' sel' : '') + '" aria-pressed="' + sel + '" onclick="MiNegocio.setPrice(' + v + ')">' +
        '<b>' + money(v) + '</b><span>' + labels[i] + '</span><small>' + hints[i] + '</small></button>';
    }).join('');
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Day ' + S.day + ' of ' + SEASON_DAYS) +
        statusStrip(S) + forecastCard(S) +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">How many will you make?</div>' +
          '<div class="mn-hint">🔮 Today about <b>' + lo + '–' + hi + '</b> ' + esc(p.units) + ' could sell at ' + money(pl.price) + '.</div>' +
          '<div class="mn-stepper">' +
            '<button type="button" class="mn-step" aria-label="Make one batch less" onclick="MiNegocio.batches(-1)">−</button>' +
            '<div class="mn-step-val"><b>' + units + '</b><small>' + esc(p.units) + ' (' + pl.batches + ' batch' + (pl.batches === 1 ? '' : 'es') + ')' + stockNote + '</small></div>' +
            '<button type="button" class="mn-step plus" aria-label="Make one batch more" onclick="MiNegocio.batches(1)">+</button>' +
          '</div>' +
          '<div class="mn-costline">🛒 Ingredients (bought for you): <b>' + money(cost) + '</b> <small>(' + money(uc(p)) + ' each)</small></div>' +
          (maxB < capBatches(S, p) && pl.batches >= maxB ? '<div class="mn-warn">You only have money for ' + maxB + ' batch' + (maxB === 1 ? '' : 'es') + '.</div>' : '') +
        '</div>' +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">Pick your price</div>' +
          '<div class="mn-price-row">' + prices + '</div>' +
        '</div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn primary big" onclick="MiNegocio.open()">Open the stand ▶</button></div>' +
      '</div>';
  }

  function batches(dir) {
    var p = D.product(S.product);
    var max = capBatches(S, p);
    if (S.mode === 'pro') { if (S._screen !== 'shop') max = Math.min(max, Math.floor(makeable() / p.batch)); }
    else max = Math.min(max, Math.floor(S.cash / (uc(p) * p.batch)));
    var nb = clamp(S.plan.batches + dir, 0, Math.max(0, max));
    if (nb === S.plan.batches) { sound('wrong'); return; }
    S.plan.batches = nb;
    sound('click');
    rerender();
  }
  function setPrice(v) {
    var p = D.product(S.product);
    S.plan.price = clamp(Math.round(v), Math.max(50, Math.round(uc(p) * 0.5 / 50) * 50), p.ref * 3);
    sound('click');
    rerender();
  }
  function nudgePrice(dir) {
    var p = D.product(S.product);
    var step = p.ref >= 1000 ? 100 : 50;
    setPrice(S.plan.price + dir * step);
  }
  function rerender() {
    var y = window.scrollY;
    if (S.mode === 'pro') { if (S._screen === 'make') renderMake(); else renderShop(); }
    else renderSimplePlan();
    window.scrollTo(0, y);
  }

  // ---- Pro mode: shopping ------------------------------------------
  function makeable() {
    var p = D.product(S.product), m = Infinity;
    p.ings.forEach(function(g) { m = Math.min(m, S.pantry[g.id] || 0); });
    return m === Infinity ? 0 : m;
  }

  function renderShop() {
    S._screen = 'shop';
    var p = D.product(S.product);
    var rows = p.ings.map(function(g) {
      var pr = ingPrice(S, g, S.day);
      var trend = pr > g.cost ? '<span class="mn-up">▲ pricier today</span>' : pr < g.cost ? '<span class="mn-down">▼ on sale</span>' : '';
      var have = S.pantry[g.id] || 0;
      var bought = S.bought[g.id] || 0;
      return '<div class="mn-ing">' +
        '<div class="mn-ing-info"><b>' + esc(g.name) + '</b> <i>' + esc(g.es) + '</i>' +
          '<small>' + esc(g.pack) + ' · ' + money(pr) + ' · makes ' + g.makes + ' ' + (g.keeps ? '· keeps' : '· <span class="mn-fresh">fresh: use today</span>') + ' ' + trend + '</small>' +
          '<small class="mn-have">In pantry: enough for <b>' + have + '</b></small></div>' +
        '<div class="mn-ing-ctrl">' +
          '<button type="button" class="mn-step sm" aria-label="Return one ' + esc(g.name) + '" ' + (bought ? '' : 'disabled') + ' onclick="MiNegocio.buy(\'' + g.id + '\',-1)">−</button>' +
          '<span class="mn-ing-n">' + bought + '</span>' +
          '<button type="button" class="mn-step sm plus" aria-label="Buy one ' + esc(g.name) + '" onclick="MiNegocio.buy(\'' + g.id + '\',1)">+</button>' +
        '</div></div>';
    }).join('');
    var spent = shopSpent();
    var can = makeable();
    var cap = capBatches(S, p) * p.batch;
    var loanCard = '';
    if (S.day === LOAN_DAY && !S.loanOffered) {
      loanCard = '<div class="mn-panel mn-loan">' +
        '<div class="mn-panel-title">🏦 The bank offers you a loan</div>' +
        '<p class="mn-sub">Borrow <b>' + money(LOAN) + '</b> today. On the last day you pay back <b>' + money(LOAN * (1 + LOAN_RATE)) + '</b> — that extra ' + money(LOAN * LOAN_RATE) + ' is the <b>interest</b> (10%). Worth it only if it helps you earn more than the interest!</p>' +
        '<div class="mn-actions"><button type="button" class="mn-btn ghost" onclick="MiNegocio.loan(false)">No, thanks</button>' +
        '<button type="button" class="mn-btn primary" onclick="MiNegocio.loan(true)">Take the loan</button></div></div>';
    }
    var upCard = !S.upgrade ? '<div class="mn-panel mn-upgrade">' +
        '<div class="mn-panel-title">🍳 Bigger kitchen · ' + money(UPGRADE) + '</div>' +
        '<p class="mn-sub">A second pot and burner: make up to <b>' + (p.cap * 2) + '</b> batches a day instead of ' + p.cap + '. Paid once — it is an investment.</p>' +
        '<div class="mn-actions"><button type="button" class="mn-btn ghost" ' + (S.cash >= UPGRADE ? '' : 'disabled') + ' onclick="MiNegocio.upgrade()">Buy it</button></div></div>' : '';
    var helperB = S.plan.batches;
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Day ' + S.day + ' · Market') +
        statusStrip(S) + forecastCard(S) + loanCard +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">🛒 Shopping · La feria</div>' +
          '<p class="mn-sub">One batch = ' + p.batch + ' ' + esc(p.units) + '. Fresh ingredients left over tonight are thrown out.</p>' +
          '<div class="mn-helper"><span>Helper: buy for</span>' +
            '<button type="button" class="mn-step sm" aria-label="Fewer batches" onclick="MiNegocio.batches(-1)">−</button>' +
            '<b>' + helperB + ' batch' + (helperB === 1 ? '' : 'es') + '</b>' +
            '<button type="button" class="mn-step sm plus" aria-label="More batches" onclick="MiNegocio.helperMore()">+</button>' +
            '<button type="button" class="mn-btn ghost sm" onclick="MiNegocio.fill()">Fill my basket</button></div>' +
          '<div class="mn-ing-list">' + rows + '</div>' +
          '<div class="mn-costline">Spent at the market today: <b>' + money(spent) + '</b> · You can make <b>' + Math.min(can, cap) + '</b> ' + esc(p.units) +
            (can > cap ? ' <small>(kitchen limit ' + cap + ')</small>' : '') + '</div>' +
        '</div>' + upCard +
        '<div class="mn-actions"><button type="button" class="mn-btn primary big" onclick="MiNegocio.toMake()">Next: make & price →</button></div>' +
      '</div>';
  }

  function shopSpent() {
    var p = D.product(S.product), t = 0;
    p.ings.forEach(function(g) { t += (S.bought[g.id] || 0) * ingPrice(S, g, S.day); });
    return t;
  }

  function buy(id, dir) {
    var p = D.product(S.product), g = null;
    p.ings.forEach(function(x) { if (x.id === id) g = x; });
    if (!g) return;
    var pr = ingPrice(S, g, S.day);
    if (dir > 0) {
      if (S.cash < pr) { sound('wrong'); if (typeof ZsDialog !== 'undefined') ZsDialog.toast('Not enough money for that.'); return; }
      S.cash -= pr; S.bought[id] = (S.bought[id] || 0) + 1; S.pantry[id] = (S.pantry[id] || 0) + g.makes;
    } else {
      if (!(S.bought[id] > 0)) return;
      S.cash += pr; S.bought[id] -= 1; S.pantry[id] = Math.max(0, (S.pantry[id] || 0) - g.makes);
    }
    sound('click');
    rerender();
  }

  function helperMore() {
    var p = D.product(S.product);
    if (S.plan.batches >= capBatches(S, p)) { sound('wrong'); return; }
    S.plan.batches += 1; sound('click'); rerender();
  }

  // Buy just enough packs for the chosen number of batches.
  function fill() {
    var p = D.product(S.product);
    var need = S.plan.batches * p.batch, short = false;
    p.ings.forEach(function(g) {
      var pr = ingPrice(S, g, S.day);
      while ((S.pantry[g.id] || 0) < need) {
        if (S.cash < pr) { short = true; break; }
        S.cash -= pr; S.bought[g.id] = (S.bought[g.id] || 0) + 1; S.pantry[g.id] = (S.pantry[g.id] || 0) + g.makes;
      }
    });
    sound(short ? 'wrong' : 'star');
    if (short && typeof ZsDialog !== 'undefined') ZsDialog.toast('You ran out of money before the basket was full.');
    rerender();
  }

  function loan(yes) {
    S.loanOffered = true;
    if (yes) { S.cash += LOAN; S.loan = Math.round(LOAN * (1 + LOAN_RATE)); sound('star'); }
    else sound('click');
    saveCur();
    rerender();
  }

  function upgrade() {
    if (S.upgrade || S.cash < UPGRADE) { sound('wrong'); return; }
    var go = function() {
      S.cash -= UPGRADE; S.upgrade = true; S.upgradeToday = UPGRADE; sound('cheer'); saveCur(); rerender();
    };
    if (typeof ZsDialog !== 'undefined') {
      ZsDialog.confirm({ title: 'Buy the bigger kitchen?', message: 'It costs ' + money(UPGRADE) + ' today and doubles how much you can make each day.', okText: 'Buy it', cancelText: 'Not now' })
        .then(function(ok) { if (ok) go(); });
    } else go();
  }

  function toMake() { sound('click'); renderMake(); window.scrollTo(0, 0); }

  // ---- Pro mode: make & price --------------------------------------
  function renderMake() {
    S._screen = 'make';
    var p = D.product(S.product);
    var maxB = Math.min(capBatches(S, p), Math.floor(makeable() / p.batch));
    if (S.plan.batches > maxB) S.plan.batches = maxB;
    var units = S.plan.batches * p.batch;
    var price = S.plan.price;
    var margin = price - uc(p);
    var fx = fixedCost(S, p);
    var dm = demand(S, S.day, price, S.rep);
    var crowd = dm.expected > units * 1.15 ? 'You may sell out — lots of demand at this price.'
      : dm.expected < units * 0.7 ? 'Careful: you may have leftovers at this price.'
      : 'Your amount looks about right for this price.';
    var vs = price > p.ref * 1.15 ? 'Above most stands (' + money(p.ref) + ') — fewer buyers.' : price < p.ref * 0.85 ? 'Below most stands (' + money(p.ref) + ') — more buyers, less each.' : 'Close to what most stands charge (' + money(p.ref) + ').';
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Day ' + S.day + ' · Make & price', 'backToShop') +
        statusStrip(S) +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">👩‍🍳 How many batches?</div>' +
          '<div class="mn-stepper">' +
            '<button type="button" class="mn-step" aria-label="One batch less" onclick="MiNegocio.batches(-1)">−</button>' +
            '<div class="mn-step-val"><b>' + units + '</b><small>' + esc(p.units) + ' · ' + S.plan.batches + ' of max ' + maxB + ' batches' +
              (S.dayOld ? ' · +' + S.dayOld + ' day-old' : '') + (S.freezer ? ' · +' + S.freezer + ' frozen' : '') + '</small></div>' +
            '<button type="button" class="mn-step plus" aria-label="One batch more" onclick="MiNegocio.batches(1)">+</button>' +
          '</div>' +
          (maxB < capBatches(S, p) ? '<div class="mn-warn">Your pantry has ingredients for ' + maxB + ' batch' + (maxB === 1 ? '' : 'es') + '. Go back to the market to buy more.</div>' : '') +
        '</div>' +
        '<div class="mn-panel">' +
          '<div class="mn-panel-title">🏷️ Set your price</div>' +
          '<div class="mn-stepper">' +
            '<button type="button" class="mn-step" aria-label="Lower the price" onclick="MiNegocio.nudgePrice(-1)">−</button>' +
            '<div class="mn-step-val"><b>' + money(price) + '</b><small>per ' + esc(p.unit) + '</small></div>' +
            '<button type="button" class="mn-step plus" aria-label="Raise the price" onclick="MiNegocio.nudgePrice(1)">+</button>' +
          '</div>' +
          '<div class="mn-costline">Margin: ' + money(price) + ' − ' + money(uc(p)) + ' cost = <b class="' + (margin > 0 ? 'up' : 'down') + '">' + money(margin) + '</b> per ' + esc(p.unit) + '</div>' +
          '<div class="mn-hint">💬 ' + vs + '<br>🔮 ' + crowd + '</div>' +
        '</div>' +
        '<div class="mn-panel mn-fixed">' +
          '<div class="mn-panel-title">🧾 Fixed costs today</div>' +
          '<div class="mn-fixed-row"><span>Stand permit · Permiso municipal</span><b>' + money(PERMIT) + '</b></div>' +
          (p.cold ? '<div class="mn-fixed-row"><span>Bag of ice · Hielo</span><b>' + money(ICE) + '</b></div>' : '') +
          '<small>You pay these whenever the stand is open — even if nobody buys.</small>' +
        '</div>' +
        '<div class="mn-actions">' +
          '<button type="button" class="mn-btn ghost" onclick="MiNegocio.closedDay()">Stay closed today</button>' +
          '<button type="button" class="mn-btn primary big" onclick="MiNegocio.open()">Open the stand ▶</button>' +
        '</div>' +
      '</div>';
    void fx;
  }
  function backToShop() { sound('click'); renderShop(); }

  // ================================================================
  //  THE DAY
  // ================================================================
  function closedDay() {
    var go = function() {
      S.plan.batches = 0; S.closed = true;
      settleDay(computeDay(true));
    };
    if (typeof ZsDialog !== 'undefined') {
      ZsDialog.confirm({ title: 'Stay closed today?', message: 'No sales and no permit or ice to pay. Fresh leftovers still spoil.', okText: 'Stay closed', cancelText: 'Go back' })
        .then(function(ok) { if (ok) go(); });
    } else go();
  }

  function open() {
    var p = D.product(S.product);
    var stock = S.plan.batches * p.batch + S.dayOld + S.freezer;
    if (stock <= 0) {
      if (S.mode === 'pro') { closedDay(); return; }
      sound('wrong');
      if (typeof ZsDialog !== 'undefined') ZsDialog.toast('Make at least one batch to open the stand.');
      return;
    }
    sound('click');
    var out = computeDay(false);
    today = out;
    renderScene(out);
  }

  // Work out today's whole result up front — the animation then shows it.
  function computeDay(closed) {
    var p = D.product(S.product), d = S.day, dd = S.sched[d - 1];
    var made = closed ? 0 : S.plan.batches * p.batch;
    var price = S.plan.price;
    var r = rng((S.seed + d * 7919) >>> 0);
    var dm = demand(S, d, price, S.rep);
    var noise = 0.88 + r() * 0.24;
    var want = closed ? 0 : Math.round(dm.expected * noise);
    var fresh = made + (p.keep === 'freezer' ? S.freezer : 0);
    var sold = Math.min(want, fresh);
    var missed = want - sold;
    var oldPrice = Math.round(price / 2 / 50) * 50;
    var bargainWant = (!closed && S.dayOld > 0) ? Math.round(dm.interested * 0.35 * noise) : 0;
    var oldSold = Math.min(bargainWant, S.dayOld);
    var lostPrice = closed ? 0 : dm.interested * noise * Math.max(0, 1 - dm.priceF);
    var avgPer = (p.perBuy[0] + p.perBuy[1]) / 2;
    // ingredient spend
    var ing;
    if (S.mode === 'pro') ing = shopSpent();
    else ing = made * uc(p);
    var fixed = closed ? 0 : fixedCost(S, p);
    var extra = S.upgradeToday || 0;
    var interest = 0, repay = 0;
    if (d === SEASON_DAYS && S.loan > 0) { repay = S.loan; interest = S.loan - LOAN; }
    var rev = sold * price + oldSold * oldPrice;
    var profit = rev - ing - fixed - extra - interest;
    var leftover = fresh - sold;
    var oldLeft = S.dayOld - oldSold;
    // pantry waste (Pro): fresh ingredients not used today
    var pantryWaste = 0, wasteNames = [];
    if (S.mode === 'pro') {
      p.ings.forEach(function(g) {
        var left = (S.pantry[g.id] || 0) - made;
        if (!g.keeps && left > 0) { pantryWaste += Math.round(left / g.makes * ingPrice(S, g, d)); wasteNames.push(g.es); }
      });
    }
    // customers for the animation
    var plan = buildPlan(p, dd, want, bargainWant, lostPrice / avgPer, dm.traffic, r);
    // when did we sell out?
    var soldOutAt = null;
    if (missed > 0) {
      var acc = 0;
      for (var i = 0; i < plan.length; i++) {
        if (plan[i].kind !== 'want') continue;
        acc += plan[i].units;
        if (acc >= fresh) { soldOutAt = plan[i].t + 15; break; }
      }
    }
    return {
      d: d, closed: closed, made: made, fresh: fresh, price: price, want: want, sold: sold, missed: missed,
      oldPrice: oldPrice, oldSold: oldSold, oldLeft: oldLeft, rev: rev, ing: ing, fixed: fixed, extra: extra,
      interest: interest, repay: repay, profit: profit, leftover: leftover, pantryWaste: pantryWaste,
      wasteNames: wasteNames, lostPrice: Math.round(lostPrice), soldOutAt: soldOutAt, plan: plan,
      w: dd.w, temp: dd.temp, ev: dd.ev, priceF: dm.priceF, expected: dm.expected
    };
  }

  // Arrival times follow the day's rhythm: lunch peak, afternoon peak.
  function arrival(r, p, dd) {
    var peak = p.cold ? 300 : 210;
    if (dd.ev === 'futbol') peak = 420;
    var u = r();
    var t;
    if (u < 0.38) t = peak + (r() + r() + r() - 1.5) * 120;
    else if (u < 0.58) t = 420 + (r() + r() - 1) * 90;
    else t = 10 + r() * 510;
    return clamp(t, 4, 520);
  }

  function buildPlan(p, dd, want, bargain, priceWalkers, traffic, r) {
    var out = [];
    var minB = p.perBuy[0], maxB = p.perBuy[1];
    // keep the crowd watchable: at most ~60 buyers on screen in a day
    var scale = Math.max(1, want / ((minB + maxB) / 2) / 60);
    var left = want;
    while (left > 0) {
      var u = Math.round((minB + r() * (maxB - minB)) * scale);
      u = clamp(u, 1, left);
      out.push({ t: arrival(r, p, dd), kind: 'want', units: u });
      left -= u;
    }
    var bl = bargain;
    while (bl > 0) { var b = Math.min(bl, 1 + Math.floor(r() * 2)); out.push({ t: arrival(r, p, dd), kind: 'bargain', units: b }); bl -= b; }
    var pw = Math.min(14, Math.round(priceWalkers));
    for (var i = 0; i < pw; i++) out.push({ t: arrival(r, p, dd), kind: 'price', units: 0 });
    var passers = Math.round(16 + traffic * 14);
    for (var j = 0; j < passers; j++) out.push({ t: r() * 525, kind: 'pass', units: 0 });
    out.sort(function(a, b) { return a.t - b.t; });
    return out;
  }

  function renderScene(out) {
    var p = D.product(S.product), dd = S.sched[S.day - 1], E = D.EVENTS[dd.ev], W = D.WEATHER[dd.w];
    root().innerHTML =
      '<div class="mn-screen mn-day">' +
        '<div class="mn-top"><span class="mn-top-spacer"></span><div class="mn-top-label">Day ' + S.day + ' · ' + W.icon + ' ' + dd.temp + '°C · ' + E.icon + ' ' + esc(E.title) + '</div><span class="mn-top-spacer"></span></div>' +
        '<div class="mn-stage">' +
          '<canvas id="mn-canvas" class="mn-canvas" role="img" aria-label="Your stand during the day. Customers walk by and some buy."></canvas>' +
          '<div class="mn-hud">' +
            '<span class="mn-pill" id="mn-clock">🕙 10:00</span>' +
            '<span class="mn-pill" id="mn-sold">Sold 0 / ' + out.fresh + '</span>' +
            '<span class="mn-pill">🏷️ ' + money(out.price) + '</span>' +
            '<span class="mn-pill mn-pill-cash" id="mn-till">' + money(0) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="mn-controls">' +
          '<button type="button" class="mn-btn ghost sm sel" id="mn-sp1" onclick="MiNegocio.speed(1)" aria-pressed="true">▶ 1×</button>' +
          '<button type="button" class="mn-btn ghost sm" id="mn-sp2" onclick="MiNegocio.speed(2)" aria-pressed="false">⏩ 2×</button>' +
          '<button type="button" class="mn-btn ghost sm" id="mn-sp4" onclick="MiNegocio.speed(4)" aria-pressed="false">⏩⏩ 4×</button>' +
          '<button type="button" class="mn-btn ghost sm" onclick="MiNegocio.skip()">Skip to closing ⏭</button>' +
        '</div>' +
        '<p class="mn-sub mn-center">Watch your customers! Hearts = happy buyers. “¡Muy caro!” = your price scared them off.</p>' +
      '</div>';
    var c = document.getElementById('mn-canvas');
    var live = { fresh: out.fresh, old: S.dayOld, soldFresh: 0, soldOld: 0, till: 0 };
    today.live = live;
    scene = MiNegocioArt.Scene(c, {
      place: S.place, weather: dd.w, event: E, product: p.id, price: out.price,
      label: p.short.toUpperCase(), short: p.short, stock: out.fresh, made: Math.max(1, out.fresh), dayOld: S.dayOld
    });
    var lastCoin = 0;
    scene.play({ customers: out.plan }, {
      onSale: function(cst) {
        var n = 0, m = 0, old = false;
        if (cst.kind === 'bargain') {
          var capOld = Math.min(out.oldSold - live.soldOld, cst.units, live.old);
          n = Math.max(0, capOld); live.old -= n; live.soldOld += n; m = n * out.oldPrice; old = true;
        } else {
          var capF = Math.min(out.sold - live.soldFresh, cst.units, live.fresh);
          n = Math.max(0, capF); live.fresh -= n; live.soldFresh += n; m = n * out.price;
        }
        live.till += m;
        scene.set({ stock: live.fresh, dayOld: live.old });
        var now = performance.now();
        if (n > 0 && now - lastCoin > 180) { sound('star'); lastCoin = now; }
        updateHud(live, out);
        return { sold: n, money: m, happy: n > 0 && out.price <= D.product(S.product).ref, old: old };
      },
      onTick: function(t) {
        var el = document.getElementById('mn-clock');
        if (el) el.textContent = '🕙 ' + clock(t);
      },
      onDone: function() { setTimeout(function() { if (today === out) settleDay(out); }, 500); }
    });
    var rz = function() { if (scene && document.getElementById('mn-canvas')) scene.resize(); else window.removeEventListener('resize', rz); };
    window.addEventListener('resize', rz);
  }

  function updateHud(live, out) {
    var s = document.getElementById('mn-sold'), t = document.getElementById('mn-till');
    if (s) s.textContent = (live.fresh <= 0 ? 'Sold out! ' : 'Sold ') + live.soldFresh + ' / ' + out.fresh;
    if (t) t.textContent = money(live.till);
  }

  function speed(v) {
    if (!scene) return;
    scene.setSpeed(v);
    [1, 2, 4].forEach(function(n) {
      var b = document.getElementById('mn-sp' + n);
      if (b) { b.classList.toggle('sel', n === v); b.setAttribute('aria-pressed', n === v ? 'true' : 'false'); }
    });
    sound('click');
  }
  function skip() { if (today) { sound('click'); settleDay(today); } }

  // ---- end of day: apply the result & show the receipt ---------------
  function settleDay(out) {
    if (!S || out.d !== S.day || S._settled === S.day) return;
    S._settled = S.day;
    today = null;
    stopScene();
    var p = D.product(S.product);
    // stock & pantry
    if (S.mode === 'pro') {
      p.ings.forEach(function(g) {
        S.pantry[g.id] = Math.max(0, (S.pantry[g.id] || 0) - out.made);
        if (!g.keeps) S.pantry[g.id] = 0;
      });
    }
    var spoiled = 0, carried = 0;
    if (p.keep === 'freezer') { S.freezer = out.leftover; carried = out.leftover; }
    else if (p.keep === 'dayold') { spoiled = out.oldLeft; S.dayOld = out.leftover; carried = out.leftover; }
    else { spoiled = out.leftover; }
    S.dayOld = p.keep === 'dayold' ? out.leftover : 0;
    // money
    S.cash += out.rev - out.fixed - (S.mode === 'pro' ? 0 : out.ing) - out.repay;
    if (out.repay) S.loan = 0;
    // reputation for tomorrow
    var before = S.rep, delta = 0, why = [];
    if (!out.closed) {
      if (out.price <= p.ref * 0.8) { delta += 0.05; why.push('great value'); }
      else if (out.price <= p.ref) { delta += 0.03; why.push('fair price'); }
      else if (out.price > p.ref * 1.5) { delta -= 0.07; why.push('very high price'); }
      else if (out.price > p.ref * 1.25) { delta -= 0.04; why.push('high price'); }
      if (out.missed > Math.max(3, out.want * 0.15)) { delta -= 0.04; why.push('people found it sold out'); }
      if (out.oldSold > 0) delta -= 0.01;
    }
    S.rep = clamp(S.rep + delta + (1 - S.rep) * 0.08, 0.75, 1.3);
    var rec = {
      d: out.d, w: out.w, t: out.temp, ev: out.ev, made: out.made, price: out.price, sold: out.sold, old: out.oldSold,
      want: out.want, missed: out.missed, spoiled: spoiled, rev: out.rev, cost: out.ing + out.fixed + out.extra + out.interest,
      profit: out.profit, closed: out.closed ? 1 : 0
    };
    S.log.push(rec);
    S.bought = {}; S.upgradeToday = 0; S.closed = false;
    var ledger = { out: out, spoiled: spoiled, carried: carried, repBefore: before, repWhy: why };
    S.day += 1;
    S.plan = S.day <= SEASON_DAYS ? defaultPlan(S) : null;
    S._screen = null;
    saveCur();
    renderLedger(ledger);
  }

  function insight(out, spoiled, p) {
    var dd = { w: out.w, ev: out.ev }, W = D.WEATHER[dd.w], E = D.EVENTS[dd.ev];
    if (out.closed) return 'You stayed closed. No costs today — but no sales either. Sometimes resting on a bad day is smart!';
    if (out.soldOutAt != null && out.soldOutAt < 420 && out.missed >= 3)
      return (out.w === 'hot' ? 'Hot day! ' : (E.traffic > 1.2 ? E.title + ' brought crowds! ' : '')) +
        p.short + ' sold out by ' + clock(out.soldOutAt) + ' — about ' + out.missed + ' more ' + p.units + ' could have sold. You could have made more.';
    if (out.lostPrice >= Math.max(4, out.sold * 0.5) && out.price > p.ref * 1.1)
      return 'Lots of people looked at your ' + money(out.price) + ' sign and walked on. A lower price could bring more buyers.';
    if (out.price < p.ref * 0.8 && out.missed > 0)
      return 'Your price was very low — you sold everything but earned only ' + money(out.price - uc(p)) + ' on each. Try a little higher.';
    if (out.made > 0 && spoiled >= Math.max(4, out.made * 0.3))
      return (out.w === 'rainy' ? 'Rain kept people home — ' : out.w === 'cloudy' ? 'Cool weather meant fewer buyers — ' : '') +
        spoiled + ' ' + p.units + ' were thrown away. That is money spent with nothing back. Make less on days like this.';
    if (out.leftover >= Math.max(4, out.fresh * 0.3) && p.keep !== 'spoil')
      return out.leftover + ' ' + p.units + ' were left over' + (p.keep === 'dayold'
        ? ' — tomorrow they sell at half price, so you lose half their value.' : ' — they wait in the freezer, but that money is tied up until they sell.') +
        (p.fit[out.w] < 0.9 ? ' ' + D.WEATHER[out.w].name + ' days are slow for ' + p.short.toLowerCase() + '.' : ' Try making a little less.');
    if (out.profit < 0)
      return 'You spent more than you earned today — that is a loss. Check the weather and make only what you can sell.';
    if (out.missed > 0)
      return 'You sold out near closing time — that is close to perfect planning!';
    if (E.traffic >= 1.4)
      return E.title + ' brought lots of people to the plaza. Busy days are the time to make extra.';
    if (out.w === 'hot' && p.cold) return 'Heat makes people thirsty — cold ' + p.short.toLowerCase() + ' fit a hot day perfectly.';
    if (out.w === 'rainy' && p.id === 'sopaipillas') return 'Rainy day = sopaipilla day! Matching the product to the weather pays.';
    return 'Nice balance! You sold ' + out.sold + ' of ' + out.fresh + ' with little waste.' + (out.w === 'sunny' ? ' Sunny days like this are steady.' : '');
  }

  function renderLedger(L) {
    var out = L.out, p = D.product(S.product);
    var row = function(label, val, cls) { return '<div class="mn-r-row ' + (cls || '') + '"><span>' + label + '</span><span class="mn-dots"></span><b>' + val + '</b></div>'; };
    var lines = '';
    if (out.closed) lines += row('Stand closed', money(0));
    else {
      lines += row('Sold ' + out.sold + ' × ' + money(out.price), money(out.sold * out.price));
      if (out.oldSold) lines += row('Day-old ' + out.oldSold + ' × ' + money(out.oldPrice), money(out.oldSold * out.oldPrice));
    }
    lines += row('REVENUE · Ventas', money(out.rev), 'mn-r-total');
    var costs = '';
    costs += row(S.mode === 'pro' ? 'Ingredients bought' : 'Ingredients (' + out.made + ' × ' + money(uc(p)) + ')', '−' + money(out.ing));
    if (out.fixed) {
      costs += row('Stand permit', '−' + money(PERMIT));
      if (p.cold) costs += row('Bag of ice', '−' + money(ICE));
    }
    if (out.extra) costs += row('Bigger kitchen', '−' + money(out.extra));
    if (out.interest) costs += row('Loan interest (10%)', '−' + money(out.interest));
    var totalCost = out.ing + out.fixed + out.extra + out.interest;
    costs += row('COSTS · Costos', '−' + money(totalCost), 'mn-r-total');
    var notes = [];
    if (L.spoiled > 0) notes.push('🗑️ Thrown away: ' + L.spoiled + ' ' + p.units + ' (cost ' + money(L.spoiled * uc(p)) + ')');
    if (p.keep === 'dayold' && L.carried > 0) notes.push('🥟 ' + L.carried + ' left for tomorrow at half price');
    if (p.keep === 'freezer' && L.carried > 0) notes.push('❄️ ' + L.carried + ' ice pops saved in the freezer');
    if (out.pantryWaste > 0) notes.push('🥬 Fresh ingredients spoiled: ' + out.wasteNames.join(', ') + ' (' + money(out.pantryWaste) + ')');
    if (out.missed > 0) notes.push('😕 ' + out.missed + ' ' + p.units + ' wanted after you sold out');
    if (out.lostPrice >= 3) notes.push('💸 About ' + out.lostPrice + ' ' + p.units + ' not bought because of the price');
    if (out.repay) notes.push('🏦 Loan paid back: ' + money(out.repay) + ' (' + money(LOAN) + ' borrowed + ' + money(out.interest) + ' interest)');
    var repUp = S.rep > L.repBefore + 0.005, repDown = S.rep < L.repBefore - 0.005;
    var repNote = repUp ? 'Reputation up — ' + L.repWhy.join(', ') + '. More buyers tomorrow!' :
      repDown ? 'Reputation down — ' + L.repWhy.filter(function(w) { return w.indexOf('price') >= 0 || w.indexOf('sold') >= 0; }).join(', ') + '.' : 'Reputation steady.';
    var good = out.profit >= 0;
    if (good) sound('correct'); else sound('wrong');
    var last = S.day > SEASON_DAYS;
    var dn = dayName(out.d);
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Day ' + out.d + ' · Receipt') +
        '<div class="mn-receipt" role="group" aria-label="Today\'s receipt">' +
          '<div class="mn-r-head"><b>' + esc(p.name.toUpperCase()) + '</b><small>' + dn.es + ' · Día ' + out.d + ' · ' + D.WEATHER[out.w].icon + ' ' + out.temp + '°C</small></div>' +
          '<div class="mn-r-sec">MONEY IN</div>' + lines +
          '<div class="mn-r-sec">MONEY OUT</div>' + costs +
          '<div class="mn-r-profit ' + (good ? 'up' : 'down') + '"><span>PROFIT · Ganancia</span><b>' + (good ? '' : '') + money(out.profit) + '</b></div>' +
          '<div class="mn-r-eq">Revenue ' + money(out.rev) + ' − costs ' + money(totalCost) + ' = ' + money(out.profit) + '</div>' +
          (notes.length ? '<div class="mn-r-notes">' + notes.map(function(n) { return '<div>' + n + '</div>'; }).join('') + '</div>' : '') +
          '<div class="mn-r-foot">¡Gracias por su compra! · Cash now ' + money(S.cash) + '</div>' +
        '</div>' +
        '<div class="mn-insight"><span class="mn-insight-icon" aria-hidden="true">💡</span><div><b>Why?</b> ' + esc(insight(out, L.spoiled, p)) + '</div></div>' +
        '<div class="mn-rep">' + heartsHtml(S.rep) + ' <span>' + esc(repNote) + '</span></div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn primary big" onclick="MiNegocio.' + (last ? 'finish' : 'morning') + '()">' +
          (last ? 'See my season 🏁' : 'Next day → Day ' + S.day) + '</button></div>' +
      '</div>';
    window.scrollTo(0, 0);
  }

  // ================================================================
  //  SEASON END
  // ================================================================
  function finish() { finishSeason(); }

  function finishSeason() {
    stopScene();
    if (!S) { _renderHome(); return; }
    var p = D.product(S.product);
    var total = S.cash - S.start;
    var stars = starsFor(S, total);
    var data = _load();
    if (!S._recorded) {
      S._recorded = true;
      data.seasons = (data.seasons || 0) + 1;
      data.best = data.best || {};
      var b = data.best[p.id] || { profit: null, stars: 0 };
      if (b.profit == null || total > b.profit) b.profit = total;
      b.stars = Math.max(b.stars || 0, stars);
      data.best[p.id] = b;
      data.lastPlayed = new Date().toISOString().slice(0, 10);
      data.cur = null;
      _save(data);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Mi Negocio', '🥟', 'Finished a 14-day ' + p.short + ' season — profit ' + money(total) + ', ' + stars + '⭐');
      }
      sound(stars >= 2 ? 'cheer' : 'correct');
    }
    var log = S.log;
    var best = null, worst = null;
    log.forEach(function(r) { if (!best || r.profit > best.profit) best = r; if (!worst || r.profit < worst.profit) worst = r; });
    var totRev = 0, totCost = 0, totSold = 0, totMade = 0, totSpoil = 0, soldOutDays = 0;
    log.forEach(function(r) { totRev += r.rev; totCost += r.cost; totSold += r.sold; totMade += r.made; totSpoil += r.spoiled; if (r.missed > 2) soldOutDays++; });
    var lessons = seasonLessons(p, log, totSpoil, totMade, soldOutDays);
    var title = stars >= 3 ? '¡Empresario estrella! Star business owner!' : stars === 2 ? 'Great season!' : stars === 1 ? 'You made a profit!' : (total > 0 ? 'A small profit — keep practising!' : 'A tough summer — you learned a lot!');
    var nextGoal = stars < 3 ? '<div class="mn-next">Next star at ' + money(S.goals[stars]) + ' profit.</div>' : '';
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Season summary') +
        '<div class="mn-final">' +
          '<div class="mn-final-stars" aria-label="' + stars + ' of 3 stars">' + starStr(stars) + '</div>' +
          '<div class="mn-final-title">' + esc(title) + '</div>' +
          '<div class="mn-facts">' +
            '<div><small>Total profit</small><b class="' + (total >= 0 ? 'up' : 'down') + '">' + money(total) + '</b></div>' +
            '<div><small>Revenue</small><b>' + money(totRev) + '</b></div>' +
            '<div><small>Costs</small><b>' + money(totCost) + '</b></div>' +
            '<div><small>Best day</small><b>' + (best ? 'Day ' + best.d + ' · ' + money(best.profit) : '—') + '</b></div>' +
          '</div>' + nextGoal +
          chartSvg(log) +
          '<div class="mn-goals">' + S.goals.map(function(g, i) {
            return '<div class="mn-goal' + (total >= g ? ' hit' : '') + '"><span>' + starStr(i + 1) + '</span><b>' + money(g) + '</b>' + (total >= g ? ' ✓' : '') + '</div>';
          }).join('') + '</div>' +
          '<div class="mn-lessons"><div class="mn-panel-title">📝 Lessons learned</div>' + lessons.map(function(l) { return '<div class="mn-lesson">' + l + '</div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="mn-panel mn-quiz-cta"><div class="mn-panel-title">🧠 Bonus star quiz</div>' +
          '<p class="mn-sub">6 quick questions about revenue, profit, costs and pricing. Get 5 right for an extra ⭐.</p>' +
          '<div class="mn-actions"><button type="button" class="mn-btn primary" onclick="MiNegocio.startQuiz()">Take the quiz</button></div></div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn ghost" onclick="MiNegocio.setup()">New season 🔁</button>' +
          '<button type="button" class="mn-btn ghost" onclick="MiNegocio.home()">Home</button></div>' +
      '</div>';
    window.scrollTo(0, 0);
    S._finalLog = log;
  }

  function seasonLessons(p, log, spoil, made, soldOutDays) {
    var out = [];
    if (made > 0 && spoil / made > 0.12) out.push('🗑️ You threw away <b>' + spoil + '</b> ' + esc(p.units) + '. Spoiled food is money spent for nothing — make less on slow days.');
    if (soldOutDays >= 3) out.push('🏃 You sold out on <b>' + soldOutDays + '</b> days. When demand is bigger than supply, making more (or charging a bit more) earns more.');
    var avgP = 0, n = 0;
    log.forEach(function(r) { if (!r.closed) { avgP += r.price; n++; } });
    if (n) {
      avgP /= n;
      if (avgP > p.ref * 1.2) out.push('🏷️ Your prices averaged ' + money(avgP) + ' — above the usual ' + money(p.ref) + '. Higher prices meant fewer buyers.');
      else if (avgP < p.ref * 0.85) out.push('🏷️ Your prices averaged ' + money(avgP) + ' — below the usual ' + money(p.ref) + '. You sold lots but earned less on each.');
    }
    var byW = {};
    log.forEach(function(r) { if (!byW[r.w]) byW[r.w] = { s: 0, n: 0 }; byW[r.w].s += r.profit; byW[r.w].n++; });
    var bw = null, bv = -Infinity;
    for (var w in byW) { var v = byW[w].s / byW[w].n; if (v > bv) { bv = v; bw = w; } }
    if (bw) out.push(D.WEATHER[bw].icon + ' Your best weather was <b>' + D.WEATHER[bw].name.toLowerCase() + '</b> (about ' + money(bv) + ' profit a day). Matching your plan to the forecast is reading demand.');
    if (out.length < 3) out.push('💡 Profit = revenue − costs. A busy stand is not always a profitable one!');
    return out.slice(0, 3);
  }

  // Daily-profit bar chart (SVG). Gains green, losses red, best day marked.
  function chartSvg(log) {
    if (!log.length) return '';
    var W = 640, H = 260, padL = 54, padR = 12, padT = 22, padB = 48;
    var max = 0, min = 0;
    log.forEach(function(r) { max = Math.max(max, r.profit); min = Math.min(min, r.profit); });
    if (max === min) max = min + 1000;
    var span = max - min;
    var y = function(v) { return padT + (max - v) / span * (H - padT - padB); };
    var bw = (W - padL - padR) / SEASON_DAYS;
    var bestI = 0;
    log.forEach(function(r, i) { if (r.profit > log[bestI].profit) bestI = i; });
    // gridlines at nice steps
    var step = Math.pow(10, Math.floor(Math.log10(span / 3)));
    if (span / step > 8) step *= 2.5;
    if (span / step > 8) step *= 2;
    var grid = '';
    for (var g = Math.ceil(min / step) * step; g <= max + 1; g += step) {
      grid += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(g) + '" y2="' + y(g) + '" class="mn-ch-grid' + (g === 0 ? ' zero' : '') + '"/>' +
        '<text x="' + (padL - 6) + '" y="' + (y(g) + 4) + '" class="mn-ch-axis" text-anchor="end">' + shortMoney(g) + '</text>';
    }
    var bars = log.map(function(r, i) {
      var x0 = padL + i * bw + bw * 0.16, w = bw * 0.68;
      var y0 = y(Math.max(0, r.profit)), y1 = y(Math.min(0, r.profit));
      var h = Math.max(1.5, y1 - y0);
      var cls = r.profit >= 0 ? 'pos' : 'neg';
      var lab = i === bestI ? '<text x="' + (x0 + w / 2) + '" y="' + (y0 - 6) + '" class="mn-ch-best" text-anchor="middle">★ ' + shortMoney(r.profit) + '</text>' : '';
      return '<g><title>Day ' + r.d + ': ' + money(r.profit) + '</title>' +
        '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="3" class="mn-ch-bar ' + cls + (i === bestI ? ' best' : '') + '"/>' + lab +
        '<text x="' + (x0 + w / 2) + '" y="' + (H - padB + 16) + '" class="mn-ch-day" text-anchor="middle">' + r.d + '</text>' +
        '<text x="' + (x0 + w / 2) + '" y="' + (H - padB + 34) + '" class="mn-ch-w" text-anchor="middle">' + D.WEATHER[r.w].icon + '</text></g>';
    }).join('');
    return '<div class="mn-chart"><div class="mn-chart-title">Profit each day</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bar chart of profit for each of the ' + log.length + ' days">' +
      '<defs><linearGradient id="mnPos" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34D399"/><stop offset="1" stop-color="#059669"/></linearGradient>' +
      '<linearGradient id="mnNeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F87171"/><stop offset="1" stop-color="#DC2626"/></linearGradient></defs>' +
      grid + bars + '</svg></div>';
  }
  function shortMoney(v) {
    var a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1000) return s + '$' + (Math.round(a / 100) / 10).toString().replace('.', ',') + 'k';
    return s + '$' + Math.round(a);
  }

  // ================================================================
  //  LEARN + QUIZ
  // ================================================================
  var CONCEPTS = [
    { icon: '💵', t: 'Revenue · Ventas', b: 'All the money that comes IN from selling. 10 empanadas × $2.000 = <b>$20.000</b> revenue.' },
    { icon: '🧾', t: 'Costs · Costos', b: 'Money that goes OUT to run the business. <b>Variable costs</b> grow with how much you make (flour, meat, cups). <b>Fixed costs</b> stay the same every day (stand permit, ice).' },
    { icon: '🏆', t: 'Profit · Ganancia', b: '<b>Profit = revenue − costs.</b> $20.000 in − $12.000 out = $8.000 profit. A busy day with high costs can still be a small profit!' },
    { icon: '⚖️', t: 'Supply & demand', b: '<b>Supply</b> is how much you have. <b>Demand</b> is how much people want. Hot day + mote = big demand. Rainy day + mote = small demand. Sell out early? Demand beat supply.' },
    { icon: '🏷️', t: 'Pricing', b: 'Raise the price → each sale earns more, but fewer people buy. Lower it → more buyers, less each. The best price is in the middle — near what most stands charge.' },
    { icon: '🗑️', t: 'Spoilage · Merma', b: 'Fresh mote and juice must be sold today. Leftovers are thrown out — that is money lost. Empanadas keep one night; ice pops keep in the freezer.' },
    { icon: '♥', t: 'Reputation · Fama', b: 'Fair prices and never running out make customers happy — and happy customers come back with friends tomorrow.' },
    { icon: '🏦', t: 'Loans & interest', b: 'A loan is borrowed money you must pay back, plus <b>interest</b> (the price of borrowing). Borrow only if it helps you earn more than the interest.' }
  ];

  function learn() {
    sound('click'); stopScene();
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Business ideas') +
        '<div class="mn-concepts">' + CONCEPTS.map(function(c) {
          return '<div class="mn-concept"><div class="mn-concept-head"><span aria-hidden="true">' + c.icon + '</span>' + c.t + '</div><div class="mn-concept-body">' + c.b + '</div></div>';
        }).join('') + '</div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn primary big" onclick="MiNegocio.startQuiz()">Take the quiz 🧠</button></div>' +
      '</div>';
    window.scrollTo(0, 0);
  }

  function computedQuestion(r) {
    var log = (S && (S._finalLog || S.log)) || [];
    var day = null;
    log.forEach(function(x) { if (x.sold > 0 && (!day || x.profit > day.profit)) day = x; });
    if (day) {
      var p = D.product(S.product);
      var revv = day.sold * day.price;
      return { q: 'On day ' + day.d + ' you sold ' + day.sold + ' ' + p.units + ' at ' + money(day.price) + ' each. What was your revenue from them?',
        a: [money(revv), money(revv - day.sold * uc(p)), money(day.price + day.sold)], c: 0,
        why: 'Revenue = units sold × price: ' + day.sold + ' × ' + money(day.price) + ' = ' + money(revv) + '.' };
    }
    var n = 5 + Math.floor(r() * 6), pr = [1000, 1500, 2000][Math.floor(r() * 3)];
    return { q: 'You sell ' + n + ' cups at ' + money(pr) + ' each. What is your revenue?', a: [money(n * pr), money(n + pr), money(pr)], c: 0,
      why: 'Revenue = units × price: ' + n + ' × ' + money(pr) + ' = ' + money(n * pr) + '.' };
  }

  function startQuiz() {
    sound('click'); stopScene();
    var r = rng((Date.now() & 0xfffffff) >>> 0);
    var simple = S ? S.mode === 'simple' : defaultMode() === 'simple';
    var easy = shuffle(D.QUIZ.filter(function(q) { return q.easy; }), r);
    var hard = shuffle(D.QUIZ.filter(function(q) { return !q.easy; }), r);
    var items = simple ? easy.slice(0, 5) : easy.slice(0, 2).concat(hard.slice(0, 3));
    items.push(computedQuestion(r));
    items = shuffle(items, r).map(function(q) {
      var order = shuffle([0, 1, 2].slice(0, q.a.length), r);
      return { q: q.q, a: order.map(function(i) { return q.a[i]; }), c: order.indexOf(q.c), why: q.why };
    });
    quiz = { items: items, idx: 0, right: 0, answered: -1 };
    renderQuiz();
  }

  function renderQuiz() {
    var it = quiz.items[quiz.idx];
    var opts = it.a.map(function(a, i) {
      var cls = '';
      if (quiz.answered >= 0) cls = i === it.c ? ' right' : (i === quiz.answered ? ' wrong' : ' dim');
      return '<button type="button" class="mn-opt' + cls + '" ' + (quiz.answered >= 0 ? 'disabled' : '') + ' onclick="MiNegocio.answer(' + i + ')">' + esc(a) + '</button>';
    }).join('');
    var fb = quiz.answered >= 0
      ? '<div class="mn-why ' + (quiz.answered === it.c ? 'good' : 'bad') + '">' + (quiz.answered === it.c ? '✅ Correct! ' : '❌ Not quite. ') + esc(it.why) + '</div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn primary" onclick="MiNegocio.nextQ()">' + (quiz.idx + 1 < quiz.items.length ? 'Next →' : 'See score') + '</button></div>'
      : '';
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Quiz · ' + (quiz.idx + 1) + ' of ' + quiz.items.length) +
        '<div class="mn-panel mn-quiz">' +
          '<div class="mn-quiz-q">' + esc(it.q) + '</div>' +
          '<div class="mn-opts">' + opts + '</div>' + fb +
        '</div>' +
      '</div>';
  }
  function answer(i) {
    if (!quiz || quiz.answered >= 0) return;
    quiz.answered = i;
    var ok = i === quiz.items[quiz.idx].c;
    if (ok) { quiz.right++; sound('correct'); } else sound('wrong');
    renderQuiz();
  }
  function nextQ() {
    sound('click');
    if (quiz.idx + 1 < quiz.items.length) { quiz.idx++; quiz.answered = -1; renderQuiz(); return; }
    var data = _load();
    var prev = data.quizBest || 0;
    if (quiz.right > prev) { data.quizBest = quiz.right; _save(data); }
    var earned = quiz.right >= 5;
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) ActivityLog.log('Mi Negocio', '🧠', 'Business quiz — ' + quiz.right + '/' + quiz.items.length + ' correct');
    sound(earned ? 'cheer' : 'correct');
    root().innerHTML =
      '<div class="mn-screen">' + topBar('Quiz results') +
        '<div class="mn-final">' +
          '<div class="mn-final-stars">' + (earned ? '⭐' : '📒') + '</div>' +
          '<div class="mn-final-title">' + quiz.right + ' of ' + quiz.items.length + ' correct</div>' +
          '<p class="mn-sub mn-center">' + (earned ? 'Bonus star earned! You know your business ideas.' : 'Get 5 right to earn the bonus star. Read the Business ideas and try again!') + '</p>' +
          (prev >= 5 && !earned ? '<p class="mn-sub mn-center">Your bonus star from before is safe ⭐</p>' : '') +
        '</div>' +
        '<div class="mn-actions"><button type="button" class="mn-btn ghost" onclick="MiNegocio.startQuiz()">Try again</button>' +
          '<button type="button" class="mn-btn primary" onclick="MiNegocio.home()">Home</button></div>' +
      '</div>';
  }

  // ---- init ----------------------------------------------------------
  function init() {
    if (!root()) return;
    if (typeof CloudSync !== 'undefined' && CloudSync && CloudSync.online && _key()) {
      try { CloudSync.pull(_key()); } catch (e) {}
    }
    _renderHome();
  }
  document.addEventListener('DOMContentLoaded', init);

  return {
    home: home, setup: setup, pick: pick, begin: begin, resume: resume, morning: morning,
    batches: batches, setPrice: setPrice, nudgePrice: nudgePrice, buy: buy, fill: fill, helperMore: helperMore,
    loan: loan, upgrade: upgrade, toMake: toMake, backToShop: backToShop, open: open, closedDay: closedDay,
    speed: speed, skip: skip, finish: finish, learn: learn, startQuiz: startQuiz, answer: answer, nextQ: nextQ,
    // exposed for tests
    _stars: getStars,
    _hint: function() { var p = D.product(S.product); return { exp: demand(S, S.day, S.plan.price, S.rep).expected, batch: p.batch, b: S.plan.batches }; },
    _setBatches: function(n) { S.plan.batches = n; }
  };
})();
