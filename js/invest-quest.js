/* ================================================================
   INVEST QUEST — A kid-friendly market simulator.
   Teaches risk, return, ROI, diversification, compounding, and the
   FACTORS that move prices up and down (company news, the whole
   economy, hype & fear, interest rates).
   Two modes: Play (simulator) + Learn (concepts & quiz).
   Per-kid storage at zs_invest_<key>.
   ================================================================ */

(function() {
  'use strict';

  var TARGET_YEARS = 10;
  var STORAGE_PREFIX = 'zs_invest_';

  // ---- groups for the allocation screen ----------------------------
  var GROUPS = [
    { id: 'safe',   label: '🛡️ Safe & Steady',           note: 'Low risk. Grows slowly, rarely loses.' },
    { id: 'stocks', label: '🏢 Company Stocks',            note: 'Own a piece of a real-style company. Moves on its own news + the market.' },
    { id: 'risky',  label: '🔥 High Risk, High Reward',    note: 'Big swings — some are all-or-nothing bets that soar or crash.' }
  ];

  // ---- the investment menu -----------------------------------------
  // mean = average yearly return, vol = how much it swings,
  // beta  = how strongly it follows the whole market's mood.
  var ASSETS = [
    // ---- safe ----
    { id: 'savings', group: 'safe', icon: '🏦', name: 'Savings Account', tag: 'Very low risk',
      mean: 0.03, vol: 0.01, beta: 0, risk: 1, color: '#0D9488',
      desc: 'The bank pays a little interest. Safe and steady — but it grows slowly.' },
    { id: 'bonds', group: 'safe', icon: '📜', name: 'Government Bonds', tag: 'Low risk',
      mean: 0.045, vol: 0.04, beta: -0.2, risk: 1, color: '#2563EB',
      desc: 'You lend money to the government. When the stock market drops, bonds often go UP — a safe harbor.' },
    { id: 'index', group: 'safe', icon: '📊', name: 'S&P 500 Fund', tag: 'The whole market',
      mean: 0.08, vol: 0.14, beta: 1.0, risk: 3, color: '#4338CA',
      desc: 'One fund that owns the 500 biggest companies at once. When people say "the market," they mean this. Built-in diversification — many grown-ups just buy this and relax.' },

    // ---- company stocks (real-style) ----
    { id: 'apple', group: 'stocks', icon: '🍏', name: 'Apple', tag: 'Tech',
      mean: 0.10, vol: 0.20, beta: 1.1, risk: 3, color: '#475569',
      desc: 'Phones, laptops and gadgets. Up when new products sell well; down if sales slow.' },
    { id: 'games', group: 'stocks', icon: '🎮', name: 'Nintendo', tag: 'Video games',
      mean: 0.10, vol: 0.26, beta: 1.0, risk: 4, color: '#DC2626',
      desc: 'Games & consoles. A hit game sends it soaring; a flop drags it down.' },
    { id: 'disney', group: 'stocks', icon: '🏰', name: 'Disney', tag: 'Movies & parks',
      mean: 0.08, vol: 0.22, beta: 1.1, risk: 3, color: '#7C3AED',
      desc: 'Movies, shows and theme parks. Blockbusters and busy parks lift it up.' },
    { id: 'food', group: 'stocks', icon: '🍔', name: "McDonald's", tag: 'Restaurants',
      mean: 0.07, vol: 0.13, beta: 0.7, risk: 2, color: '#D97706',
      desc: 'Restaurants everywhere. People eat in good times and bad, so it is steadier than most stocks.' },
    { id: 'ev', group: 'stocks', icon: '🚗', name: 'Tesla', tag: 'Electric cars',
      mean: 0.14, vol: 0.42, beta: 1.6, risk: 5, color: '#BE123C',
      desc: 'Electric cars and big dreams. Lots of hype = wild swings, big ups AND big downs.' },
    { id: 'shop', group: 'stocks', icon: '🛒', name: 'Amazon', tag: 'Online store',
      mean: 0.11, vol: 0.24, beta: 1.2, risk: 4, color: '#EA580C',
      desc: 'Giant online store. Grows when people shop and ship more online.' },
    { id: 'farms', group: 'stocks', icon: '🌾', name: 'GreenFields Farms', tag: 'Crops & food',
      mean: 0.07, vol: 0.20, beta: 0.8, risk: 3, color: '#16A34A',
      desc: 'Grows crops and sells food. Good weather and high food prices lift it; a drought hurts it. Very real-world!' },

    // ---- risky ----
    { id: 'biz', group: 'risky', icon: '🍋', name: 'Lemonade Business', tag: 'High risk',
      mean: 0.12, vol: 0.30, beta: 1.2, risk: 4, color: '#B45309',
      desc: 'Your own small business. Big rewards if it does well — but it can flop.' },
    { id: 'biotech', group: 'risky', icon: '🧪', name: 'BioCure Labs', tag: 'Biotech · all-or-nothing',
      mean: 0, vol: 0.15, beta: 0.3, risk: 5, color: '#0EA5E9',
      desc: 'A science company betting on ONE new medicine. Pass the big test and it soars; fail and it crashes. Its fate is its own — not the market\'s.',
      binary: { p: 0.5, win: 1.10, lose: -0.62,
        winText: "BioCure's new medicine PASSED its big trial!", winFactor: 'Trial success → huge jump',
        loseText: "BioCure's medicine FAILED its trial.", loseFactor: 'Trial failure → big crash' } },
    { id: 'rocket', group: 'risky', icon: '🚀', name: 'AstroLaunch', tag: 'Space startup · all-or-nothing',
      mean: 0, vol: 0.15, beta: 0.5, risk: 5, color: '#DB2777',
      desc: 'A rocket company. A successful launch sends it to the moon; a failed one sends it down. Thrilling — and very risky.',
      binary: { p: 0.55, win: 0.85, lose: -0.52,
        winText: 'AstroLaunch nailed its big rocket launch! 🌝', winFactor: 'Successful launch → big jump',
        loseText: "AstroLaunch's rocket failed to launch.", loseFactor: 'Failed launch → big drop' } }
  ];

  function _asset(id) {
    for (var i = 0; i < ASSETS.length; i++) if (ASSETS[i].id === id) return ASSETS[i];
    return null;
  }

  // ---- market climate (the macro factor: the whole economy) --------
  // stockAdj is added to every stock-like asset, scaled by its beta.
  var CLIMATES = [
    { id: 'bull', icon: '📈', label: 'Bull market — investors feel great',
      why: 'When people feel good about the economy, almost all stocks rise together.',
      stockAdj: 0.08, volMul: 1.0, weight: 3, tone: 'good' },
    { id: 'normal', icon: '😐', label: 'A calm, normal year',
      why: 'Nothing big happened to the whole market — companies mostly moved on their own news.',
      stockAdj: 0.0, volMul: 1.0, weight: 4, tone: 'calm' },
    { id: 'bear', icon: '📉', label: 'Bear market — investors are nervous',
      why: 'When people get worried, most stocks fall together — even great companies.',
      stockAdj: -0.13, volMul: 1.2, weight: 3, tone: 'bad' },
    { id: 'crash', icon: '💥', label: 'Market crash — a really tough year',
      why: 'Sometimes the whole market drops fast. Notice how bonds held up — that is why we diversify!',
      stockAdj: -0.30, volMul: 1.4, weight: 1, tone: 'bad' }
  ];

  // ---- company / sector news (the specific factors) ----------------
  // Each headline explains WHY something moved. factor = the lesson.
  var NEWS = [
    { icon: '🍏', text: 'Apple launched a phone everyone wanted — it sold out!', factor: 'A popular new product → up', adj: { apple: 0.22 } },
    { icon: '🍏', text: 'Apple sales slowed down this year.', factor: 'Fewer sales → down', adj: { apple: -0.16 } },
    { icon: '🎮', text: 'Nintendo released a smash-hit game.', factor: 'A hit product → up', adj: { games: 0.30 } },
    { icon: '🎮', text: "Nintendo's new console flopped.", factor: 'A flop → down', adj: { games: -0.24 } },
    { icon: '🏰', text: 'Disney made a billion-dollar blockbuster movie.', factor: 'Big success → up', adj: { disney: 0.24 } },
    { icon: '🏰', text: 'Disney parks were quiet and a movie bombed.', factor: 'Weak results → down', adj: { disney: -0.18 } },
    { icon: '🍔', text: "McDonald's opened lots of new restaurants.", factor: 'Steady growth → up a bit', adj: { food: 0.10 } },
    { icon: '🚗', text: 'Electric cars are the hottest trend — Tesla soared!', factor: 'Hype & demand → big up', adj: { ev: 0.45 } },
    { icon: '🚗', text: 'Tesla had to recall some cars. Ouch.', factor: 'Bad news (a recall) → down', adj: { ev: -0.30 } },
    { icon: '🛒', text: 'Amazon shipped record numbers of packages.', factor: 'More customers → up', adj: { shop: 0.22 } },
    { icon: '🛒', text: 'Shipping cost Amazon more than expected.', factor: 'Higher costs → down', adj: { shop: -0.15 } },
    { icon: '🍋', text: 'A hot summer made lemonade sales explode!', factor: 'Great season → up', adj: { biz: 0.28 } },
    { icon: '🌧️', text: 'A rainy summer hurt the lemonade stand.', factor: 'Bad season → down', adj: { biz: -0.22 } },
    { icon: '🌾', text: 'Perfect weather gave farms a record harvest!', factor: 'Great harvest → up', adj: { farms: 0.22 } },
    { icon: '🌵', text: "A drought ruined a lot of this year's crops.", factor: 'Bad weather → down', adj: { farms: -0.22 } },
    { icon: '🍞', text: 'Food prices rose around the world.', factor: 'Pricier crops lift farms', adj: { farms: 0.12, food: -0.05 } },
    { icon: '🏦', text: 'The bank raised interest rates.', factor: 'Higher rates help savers, hurt risky bets', adj: { savings: 0.02, bonds: 0.03, ev: -0.08 } },
    { icon: '🛍️', text: 'People had lots of money to spend this year.', factor: 'Strong shoppers lift many companies', adj: { shop: 0.10, food: 0.06, disney: 0.08, apple: 0.06 } },
    { icon: '🛒', text: 'Prices rose (inflation) — cash buys a little less.', factor: 'Inflation quietly shrinks idle cash', adj: {}, inflation: true }
  ];

  // ---- helpers -----------------------------------------------------
  function _userKey() {
    if (typeof getActiveUser === 'function') {
      var u = getActiveUser();
      if (u) return u.name.toLowerCase().replace(/\s+/g, '_');
    }
    return '_default';
  }
  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + _userKey());
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }
  function _save(data) {
    try { localStorage.setItem(STORAGE_PREFIX + _userKey(), JSON.stringify(data)); }
    catch (e) {}
  }
  function _rand(n) { return Math.floor(Math.random() * n); }
  function _pick(arr) { return arr[_rand(arr.length)]; }
  function _weightedPick(arr) {
    var total = 0, i;
    for (i = 0; i < arr.length; i++) total += (arr[i].weight || 1);
    var r = Math.random() * total;
    for (i = 0; i < arr.length; i++) {
      r -= (arr[i].weight || 1);
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }

  // Standard normal via Box–Muller, gently clamped.
  function _gauss() {
    var u = 1 - Math.random(), v = Math.random();
    var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(-2.6, Math.min(2.6, z));
  }

  function _money(n) {
    n = Math.round(n);
    var sign = n < 0 ? '-' : '';
    return sign + '$' + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function _pct(x) {
    var v = Math.round(x * 1000) / 10;
    return (v > 0 ? '+' : '') + v + '%';
  }
  function _sound(name) {
    if (typeof SFX !== 'undefined' && SFX[name]) { try { SFX[name](); } catch (e) {} }
  }

  // ---- state -------------------------------------------------------
  var state = null;

  function _newState(start) {
    var holdings = {};
    ASSETS.forEach(function(a) { holdings[a.id] = 0; });
    return {
      start: start,
      step: Math.max(5, Math.round(start / 20)),
      cash: start,
      holdings: holdings,
      year: 0,
      history: [start],
      benchmark: [start],   // value of an all-S&P-500 portfolio over time
      returnsLog: [],       // each year's return per asset, for the "what if" replay
      lastClimate: null,
      lastNews: null,
      lastReturns: null,
      lastBefore: null,
      lastWhy: null
    };
  }

  function _netWorth(s) {
    var t = s.cash;
    ASSETS.forEach(function(a) { t += s.holdings[a.id]; });
    return t;
  }

  // ---- root --------------------------------------------------------
  function _root() { return document.getElementById('iq-wrap'); }
  function open() { _renderHome(); }

  function _renderHome() {
    var data = _load();
    var bestRoi = data.bestRoi != null ? data.bestRoi : null;
    var games = data.games || 0;
    var statLine = games > 0
      ? '<div class="iq-home-stat">🏆 Best growth: ' + (bestRoi != null ? _pct(bestRoi) : '—') +
        ' · 🎮 ' + games + ' game' + (games === 1 ? '' : 's') + '</div>'
      : '<div class="iq-home-stat">Your money is waiting to grow 🌱</div>';

    _root().innerHTML =
      '<div class="iq-header">' +
        '<span class="icon">📈</span>' +
        '<h1>Invest Quest</h1>' +
        '<p>Grow your money — and learn what makes the market move.</p>' +
      '</div>' +
      statLine +
      '<div class="iq-home-grid">' +
        '<button type="button" class="iq-home-card iq-home-play" onclick="InvestQuest.setup()">' +
          '<span class="iq-home-icon">🪙</span>' +
          '<span class="iq-home-name">Play the Market</span>' +
          '<span class="iq-home-desc">Invest in real-style companies and grow your money over 10 years.</span>' +
        '</button>' +
        '<button type="button" class="iq-home-card iq-home-learn" onclick="InvestQuest.learn()">' +
          '<span class="iq-home-icon">🧠</span>' +
          '<span class="iq-home-name">Learn the Ideas</span>' +
          '<span class="iq-home-desc">Risk, return, ROI — and why prices go up and down.</span>' +
        '</button>' +
      '</div>';
  }

  // ---- setup: choose starting money --------------------------------
  function setup() {
    _sound('click');
    var amounts = [
      { v: 100,  label: '$100',  note: 'A few weekends of lemonade 🍋' },
      { v: 500,  label: '$500',  note: 'A good summer of selling ☀️' },
      { v: 1000, label: '$1,000', note: 'You saved up all year! 💪' }
    ];
    var cards = amounts.map(function(a) {
      return '<button type="button" class="iq-amount" onclick="InvestQuest.begin(' + a.v + ')">' +
        '<span class="iq-amount-v">' + a.label + '</span>' +
        '<span class="iq-amount-note">' + a.note + '</span>' +
      '</button>';
    }).join('');

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Start a new game', true) +
        '<div class="iq-panel">' +
          '<div class="iq-panel-title">How much did you earn to invest?</div>' +
          '<p class="iq-panel-sub">This is your starting money. Pick an amount and we will try to grow it.</p>' +
          '<div class="iq-amount-grid">' + cards + '</div>' +
        '</div>' +
      '</div>';
  }

  function begin(start) {
    _sound('click');
    state = _newState(start);
    _renderAllocate(true);
  }

  // ---- allocation / rebalance screen -------------------------------
  function _assetRow(a, net) {
    var val = state.holdings[a.id];
    var pctOfNet = net > 0 ? Math.round((val / net) * 100) : 0;
    var dots = '';
    for (var i = 1; i <= 5; i++) dots += '<span class="iq-risk-dot' + (i <= a.risk ? ' on' : '') + '"></span>';
    return '<div class="iq-asset" style="--ac:' + a.color + '">' +
      '<div class="iq-asset-main">' +
        '<span class="iq-asset-icon">' + a.icon + '</span>' +
        '<div class="iq-asset-info">' +
          '<div class="iq-asset-name">' + a.name + '</div>' +
          '<div class="iq-asset-meta"><span class="iq-risk">' + dots + '</span>' +
            '<span class="iq-asset-tag">' + a.tag + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="iq-asset-ctrl">' +
        '<button type="button" class="iq-step" aria-label="Sell ' + a.name + '" onclick="InvestQuest.adjust(\'' + a.id + '\',-1)">−</button>' +
        '<div class="iq-asset-val"><span>' + _money(val) + '</span><small>' + pctOfNet + '%</small></div>' +
        '<button type="button" class="iq-step plus" aria-label="Buy ' + a.name + '" onclick="InvestQuest.adjust(\'' + a.id + '\',1)">+</button>' +
      '</div>' +
      '<div class="iq-asset-desc">' + a.desc + '</div>' +
    '</div>';
  }

  function _renderAllocate(isFirst) {
    var net = _netWorth(state);
    var sections = GROUPS.map(function(g) {
      var rows = ASSETS.filter(function(a) { return a.group === g.id; })
        .map(function(a) { return _assetRow(a, net); }).join('');
      return '<div class="iq-group">' +
        '<div class="iq-group-head"><span class="iq-group-label">' + g.label + '</span>' +
          '<span class="iq-group-note">' + g.note + '</span></div>' +
        '<div class="iq-asset-list">' + rows + '</div>' +
      '</div>';
    }).join('');

    var canGo = state.cash < net;
    var title = isFirst ? 'Spread out your money' : 'Year ' + state.year + ' — adjust your plan';
    var sub = isFirst
      ? 'Tap + to invest, − to sell. Mixing different types is called <b>diversifying</b> — it lowers your risk.'
      : 'Buy more or sell some before the next year — or leave it and let it grow!';

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar(isFirst ? 'New game' : 'Manage', true) +
        '<div class="iq-panel">' +
          '<div class="iq-panel-title">' + title + '</div>' +
          '<p class="iq-panel-sub">' + sub + '</p>' +
          '<div class="iq-cash">💵 Cash to invest: <b>' + _money(state.cash) + '</b>' +
            '<span class="iq-cash-note">(uninvested cash does not grow)</span></div>' +
          sections +
          '<div class="iq-actions">' +
            '<button type="button" class="iq-btn ghost" onclick="InvestQuest.autoMix()">✨ Suggest a mix</button>' +
            '<button type="button" class="iq-btn primary" ' + (canGo ? '' : 'disabled') +
              ' onclick="InvestQuest.runYear()">Run the year ▶</button>' +
          '</div>' +
          (canGo ? '' : '<div class="iq-warn">Invest at least some money to start the year.</div>') +
        '</div>' +
      '</div>';
  }

  function adjust(id, dir) {
    if (!state) return;
    var step = state.step;
    if (dir > 0) {
      var put = Math.min(step, state.cash);
      if (put <= 0) return;
      state.cash -= put;
      state.holdings[id] += put;
    } else {
      var take = Math.min(step, state.holdings[id]);
      if (take <= 0) return;
      state.holdings[id] -= take;
      state.cash += take;
    }
    _sound('click');
    _renderAllocate(state.year === 0);
  }

  // A sensible diversified starter mix.
  function autoMix() {
    _sound('star');
    ASSETS.forEach(function(a) { state.cash += state.holdings[a.id]; state.holdings[a.id] = 0; });
    var weights = {
      savings: 0.07, bonds: 0.10, index: 0.20,
      apple: 0.09, games: 0.06, disney: 0.06, food: 0.08, ev: 0.05, shop: 0.07, farms: 0.07,
      biz: 0.07, biotech: 0.04, rocket: 0.04
    };
    var net = state.cash;
    ASSETS.forEach(function(a) {
      var want = Math.round((net * (weights[a.id] || 0)) / state.step) * state.step;
      want = Math.min(want, state.cash);
      state.holdings[a.id] = want;
      state.cash -= want;
    });
    _renderAllocate(state.year === 0);
  }

  // ---- run one year ------------------------------------------------
  function runYear() {
    if (!state) return;
    _sound('click');

    var climate = _weightedPick(CLIMATES);

    // pick 1–2 distinct news items
    var nNews = 1 + (Math.random() < 0.6 ? 1 : 0);
    var pool = NEWS.slice();
    var chosen = [];
    while (chosen.length < nNews && pool.length) {
      chosen.push(pool.splice(_rand(pool.length), 1)[0]);
    }
    var newsAdj = {};
    var whyMap = {};
    chosen.forEach(function(n) {
      for (var k in n.adj) {
        newsAdj[k] = (newsAdj[k] || 0) + n.adj[k];
        if (!whyMap[k]) whyMap[k] = [];
        whyMap[k].push(n);
      }
    });

    var returns = {}, before = {};
    var binaryHeadlines = [];
    ASSETS.forEach(function(a) {
      before[a.id] = state.holdings[a.id];
      var r;
      if (a.binary) {
        // All-or-nothing: roll a single make-or-break event. Mostly its
        // own destiny (low market beta) — that's company-specific risk.
        var success = Math.random() < a.binary.p;
        r = (success ? a.binary.win : a.binary.lose);
        r += a.vol * _gauss() * 0.4;                  // small wiggle
        r += (a.beta || 0) * climate.stockAdj * 0.5;  // mild market pull
        var factor = success ? a.binary.winFactor : a.binary.loseFactor;
        whyMap[a.id] = [{ factor: factor }];
        if (before[a.id] > 0.5) {
          binaryHeadlines.push({ icon: a.icon, text: success ? a.binary.winText : a.binary.loseText, factor: factor });
        }
      } else {
        var vol = a.vol * (climate.volMul || 1);
        r = a.mean + vol * _gauss();
        r += (a.beta || 0) * climate.stockAdj;   // the whole-market factor
        if (newsAdj[a.id]) r += newsAdj[a.id];    // the company-specific factor
      }
      if (r < -0.9) r = -0.9;
      returns[a.id] = r;
      state.holdings[a.id] = state.holdings[a.id] * (1 + r);
    });
    // Surface make-or-break outcomes for companies the kid actually owns.
    chosen = chosen.concat(binaryHeadlines);

    state.year += 1;
    state.lastClimate = climate;
    state.lastNews = chosen;
    state.lastReturns = returns;
    state.lastBefore = before;
    state.lastWhy = whyMap;
    state.returnsLog.push(returns);
    var bPrev = state.benchmark[state.benchmark.length - 1];
    state.benchmark.push(bPrev * (1 + (returns.index || 0)));
    state.history.push(_netWorth(state));
    _renderYearResult();
  }

  function _renderYearResult() {
    var climate = state.lastClimate;
    var net = _netWorth(state);
    var roi = (net - state.start) / state.start;
    var prevNet = state.history[state.history.length - 2];
    var yearChange = net - prevNet;

    var newsHtml = state.lastNews.map(function(n) {
      return '<div class="iq-news-item">' +
        '<span class="iq-news-icon">' + n.icon + '</span>' +
        '<span class="iq-news-text">' + n.text +
          '<span class="iq-news-factor">' + n.factor + '</span>' +
        '</span>' +
      '</div>';
    }).join('');

    // asset rows, only ones the kid holds, biggest holdings first
    var held = ASSETS.filter(function(a) {
      return state.lastBefore[a.id] > 0.5 || state.holdings[a.id] > 0.5;
    }).sort(function(a, b) { return state.holdings[b.id] - state.holdings[a.id]; });

    var rows = held.map(function(a) {
      var before = state.lastBefore[a.id];
      var after = state.holdings[a.id];
      var delta = after - before;
      var r = state.lastReturns[a.id];
      var cls = delta > 0.5 ? 'up' : (delta < -0.5 ? 'down' : 'flat');
      var why = '';
      if (state.lastWhy[a.id]) {
        why = '<div class="iq-res-why">💬 ' + state.lastWhy[a.id][0].factor + '</div>';
      }
      return '<div class="iq-res-item">' +
        '<div class="iq-res-row">' +
          '<span class="iq-res-icon">' + a.icon + '</span>' +
          '<span class="iq-res-name">' + a.name + '</span>' +
          '<span class="iq-res-val">' + _money(after) + '</span>' +
          '<span class="iq-res-delta ' + cls + '">' + (delta >= 0 ? '+' : '') + _money(delta) +
            ' <small>' + _pct(r) + '</small></span>' +
        '</div>' + why +
      '</div>';
    }).join('');

    var cashRow = state.cash > 0.5
      ? '<div class="iq-res-item"><div class="iq-res-row"><span class="iq-res-icon">💵</span>' +
        '<span class="iq-res-name">Cash</span>' +
        '<span class="iq-res-val">' + _money(state.cash) + '</span>' +
        '<span class="iq-res-delta flat">+$0 <small>0%</small></span></div></div>'
      : '';

    var done = state.year >= TARGET_YEARS;
    var roiCls = roi > 0 ? 'up' : (roi < 0 ? 'down' : 'flat');

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Year ' + state.year + ' of ' + TARGET_YEARS, true) +
        '<div class="iq-climate ' + climate.tone + '">' +
          '<div class="iq-climate-top"><span class="iq-climate-icon">' + climate.icon + '</span>' +
            '<span class="iq-climate-label">' + climate.label + '</span></div>' +
          '<div class="iq-climate-why">' + climate.why + '</div>' +
        '</div>' +
        '<div class="iq-news"><div class="iq-news-head">📰 This year\'s news</div>' + newsHtml + '</div>' +
        '<div class="iq-networth">' +
          '<div class="iq-nw-label">Your money is now</div>' +
          '<div class="iq-nw-value ' + roiCls + '">' + _money(net) + '</div>' +
          '<div class="iq-nw-sub">' +
            'This year: <b class="' + (yearChange >= 0 ? 'up' : 'down') + '">' +
              (yearChange >= 0 ? '+' : '') + _money(yearChange) + '</b>' +
            ' · Total ROI: <b class="' + roiCls + '">' + _pct(roi) + '</b>' +
          '</div>' +
        '</div>' +
        _chart() +
        '<div class="iq-res-list">' + rows + cashRow + '</div>' +
        (done ? '' : '<div class="iq-tip">💡 React to the news! Tap <b>Change my mix</b> to buy or sell before next year.</div>') +
        '<div class="iq-actions">' +
          (done
            ? '<button type="button" class="iq-btn primary" onclick="InvestQuest.finish()">See my results 🏁</button>'
            : '<button type="button" class="iq-btn ghost" onclick="InvestQuest.manage()">✏️ Change my mix</button>' +
              '<button type="button" class="iq-btn primary" onclick="InvestQuest.runYear()">Next year ▶</button>') +
        '</div>' +
      '</div>';

    if (yearChange > 0) _sound('correct'); else if (yearChange < 0) _sound('wrong');
  }

  function manage() { _sound('click'); _renderAllocate(false); }

  // ---- SVG line chart: the player vs the S&P 500 benchmark ---------
  function _chart() {
    var h = state.history;
    if (h.length < 2) return '';
    var b = state.benchmark || [];
    var hasB = b.length === h.length;
    var W = 280, H = 90, pad = 6;
    var all = hasB ? h.concat(b) : h;
    var max = Math.max.apply(null, all), min = Math.min.apply(null, all);
    if (max === min) max = min + 1;
    function pathOf(arr) {
      return arr.map(function(v, i) {
        var x = pad + (i / (arr.length - 1)) * (W - pad * 2);
        var y = pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      });
    }
    var hp = pathOf(h);
    var up = h[h.length - 1] >= state.start;
    var stroke = up ? 'var(--iq-green)' : 'var(--iq-red)';
    var dotColor = up ? '#059669' : '#DC2626';
    var last = hp[hp.length - 1].split(',');
    var marketLine = '';
    if (hasB) {
      var bp = pathOf(b);
      marketLine = '<polyline fill="none" stroke="#9ca3af" stroke-width="2" ' +
        'stroke-dasharray="4 4" stroke-linecap="round" stroke-linejoin="round" points="' + bp.join(' ') + '"/>';
    }
    return '<div class="iq-chart">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
        marketLine +
        '<polyline fill="none" stroke="' + stroke + '" stroke-width="2.5" ' +
          'stroke-linecap="round" stroke-linejoin="round" points="' + hp.join(' ') + '"/>' +
        '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3.5" fill="' + dotColor + '"/>' +
      '</svg>' +
      '<div class="iq-chart-legend">' +
        '<span><span class="iq-dot" style="background:' + dotColor + '"></span> You</span>' +
        (hasB ? '<span><span class="iq-dot dash"></span> S&amp;P 500 (the market)</span>' : '') +
      '</div>' +
    '</div>';
  }

  // ---- "what if" replay: all-in one asset across the same years ----
  function _hypo(assetId) {
    var v = state.start;
    state.returnsLog.forEach(function(yr) { v *= (1 + (yr[assetId] || 0)); });
    return v;
  }

  function _compareBlock(net) {
    var rows = [
      { label: '🧺 Your mix', val: net, me: true },
      { label: '📊 All S&P 500', val: _hypo('index') },
      { label: '🏦 All Savings', val: _hypo('savings') },
      { label: '🧪 All on BioCure (one risky bet)', val: _hypo('biotech') }
    ];
    var maxv = Math.max(state.start, rows[0].val, rows[1].val, rows[2].val, rows[3].val);
    var bars = rows.map(function(r) {
      var w = Math.max(2, Math.round((r.val / maxv) * 100));
      var roiR = (r.val - state.start) / state.start;
      return '<div class="iq-cmp-row' + (r.me ? ' me' : '') + '">' +
        '<span class="iq-cmp-label">' + r.label + '</span>' +
        '<div class="iq-cmp-bar"><div class="iq-cmp-fill" style="width:' + w + '%"></div></div>' +
        '<span class="iq-cmp-val">' + _money(r.val) + ' <small class="' + (roiR >= 0 ? 'up' : 'down') + '">' + _pct(roiR) + '</small></span>' +
      '</div>';
    }).join('');
    var beat = net >= rows[1].val;
    var verdict = beat
      ? '🎉 You beat the market! Your mix did better than just buying the S&P 500.'
      : 'The S&P 500 beat your mix this time — and that is super common! It is why many grown-ups just buy the index and relax.';
    return '<div class="iq-compare">' +
      '<div class="iq-compare-head">📊 What if you had invested it all in one thing?</div>' +
      '<p class="iq-compare-sub">Same 10 years, same news — different choices:</p>' +
      bars +
      '<div class="iq-verdict ' + (beat ? 'good' : '') + '">' + verdict + '</div>' +
    '</div>';
  }

  // ---- final summary -----------------------------------------------
  function finish() {
    _sound('cheer');
    var net = _netWorth(state);
    var roi = (net - state.start) / state.start;
    var perYear = Math.pow(Math.max(net, 1) / state.start, 1 / TARGET_YEARS) - 1;

    var stars = 0;
    if (roi > 0) stars = 1;
    if (perYear >= 0.04) stars = 2;
    if (perYear >= 0.08) stars = 3;
    var starsHtml = '';
    for (var i = 0; i < 3; i++) starsHtml += (i < stars ? '⭐' : '☆');

    var lesson;
    if (roi <= 0) {
      lesson = 'Markets go up AND down — losing some years is totally normal, even for the pros. Spreading money across safe and risky choices (diversifying) softens the bad years.';
    } else if (perYear >= 0.08) {
      lesson = 'Great growth! You took smart risks and stayed invested through the ups and downs. Over many years, that is how money grows the most.';
    } else {
      lesson = 'Nice — your money grew! Safer picks grow slowly but steadily. A little more risk can grow it faster, if you can handle the bumpy years.';
    }

    var emoji = stars >= 3 ? '🏆' : stars >= 2 ? '🌟' : stars >= 1 ? '💪' : '🌱';
    var title = stars >= 3 ? 'Master Investor!' : stars >= 2 ? 'Smart Investor!' : stars >= 1 ? 'You grew it!' : 'Keep learning!';

    var data = _load();
    data.games = (data.games || 0) + 1;
    if (data.bestRoi == null || roi > data.bestRoi) data.bestRoi = roi;
    if (data.bestStars == null || stars > data.bestStars) data.bestStars = stars;
    data.lastRoi = roi;
    _save(data);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Invest Quest', '📈',
        'Finished a 10-year game — ' + _money(net) + ' (' + _pct(roi) + '), ' + stars + '⭐');
    }

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Results', true) +
        '<div class="iq-final">' +
          '<span class="iq-final-emoji">' + emoji + '</span>' +
          '<div class="iq-final-title">' + title + '</div>' +
          '<div class="iq-stars">' + starsHtml + '</div>' +
          '<div class="iq-final-grid">' +
            '<div class="iq-final-stat"><small>Started with</small><b>' + _money(state.start) + '</b></div>' +
            '<div class="iq-final-stat"><small>Ended with</small><b class="' + (roi >= 0 ? 'up' : 'down') + '">' + _money(net) + '</b></div>' +
            '<div class="iq-final-stat"><small>Total ROI</small><b class="' + (roi >= 0 ? 'up' : 'down') + '">' + _pct(roi) + '</b></div>' +
            '<div class="iq-final-stat"><small>Per year</small><b class="' + (perYear >= 0 ? 'up' : 'down') + '">' + _pct(perYear) + '</b></div>' +
          '</div>' +
          _chart() +
          _compareBlock(net) +
          '<div class="iq-lesson">💡 ' + lesson + '</div>' +
          '<div class="iq-actions">' +
            '<button type="button" class="iq-btn primary" onclick="InvestQuest.setup()">Play again 🔁</button>' +
            '<button type="button" class="iq-btn ghost" onclick="InvestQuest.learn()">Learn the ideas 🧠</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ---- top bar -----------------------------------------------------
  function _topBar(label, home) {
    return '<div class="iq-top">' +
      (home ? '<button type="button" class="iq-back" aria-label="Back to start" onclick="InvestQuest.home()">←</button>' : '<span></span>') +
      '<div class="iq-top-label">' + label + '</div>' +
      '<span style="width:38px"></span>' +
    '</div>';
  }
  function home() { _sound('click'); state = null; _renderHome(); }

  // ================================================================
  //  LEARN MODE — concept cards + quiz
  // ================================================================
  var CONCEPTS = [
    { icon: '🌱', title: 'What is investing?',
      body: 'Investing means putting your money to work so it can <b>grow</b> over time, instead of sitting still. You buy something today hoping it is worth more later.' },
    { icon: '⚖️', title: 'Risk vs. Return',
      body: 'Return is the money you <b>make</b>. Risk is the chance you <b>lose</b> some. Usually the bigger the possible reward, the bigger the risk. Safe things grow slowly; risky things can jump — or drop.' },
    { icon: '📊', title: 'What makes a stock go UP or DOWN?',
      body: 'Four big factors: <b>1) Company news</b> — a hit product or more profit pushes it up; a flop or recall pushes it down. <b>2) The whole economy</b> — when times are good most stocks rise together; when scary, they fall together. <b>3) Hype & fear</b> — excited buyers can push prices too high, then they pop. <b>4) Interest rates</b> — when banks pay more, risky bets look less tempting.' },
    { icon: '🧺', title: 'Diversify & the S&P 500',
      body: 'Don\'t put all your eggs in one basket! Spreading money across many investments is <b>diversifying</b>. The <b>S&P 500</b> is a famous index fund that owns the 500 biggest companies at once — instant diversification. It is also "the market": investors love to ask, <b>did I beat the S&P 500?</b> Surprisingly, most people don\'t — so many just buy it.' },
    { icon: '📈', title: 'What is ROI?',
      body: '<b>ROI = Return On Investment</b>: how much you gained compared to what you put in. Invest $100 and end with $120? That is a $20 gain, or <b>20% ROI</b>.' },
    { icon: '❄️', title: 'Compounding (the snowball)',
      body: 'When your money earns money, and then <i>that</i> money earns even more — that is <b>compounding</b>. Like a snowball rolling downhill, it grows faster the longer you wait.' },
    { icon: '🎲', title: 'All-or-nothing bets',
      body: 'Some companies live or die on ONE event — a <b>biotech</b> whose medicine must pass a test, or a <b>rocket</b> that must launch. They can double your money or lose most of it. This is <b>company-specific risk</b>: it happens whether the market is up or down. Fun in small amounts, dangerous if you bet big.' },
    { icon: '🎢', title: 'Losing is part of it',
      body: 'Even the best investors have losing years. Prices go down sometimes — that is normal. The trick is to stay calm, stay diversified, and think <b>long-term</b>.' }
  ];

  function learn() {
    _sound('click');
    var cards = CONCEPTS.map(function(c) {
      return '<div class="iq-concept">' +
        '<div class="iq-concept-head"><span class="iq-concept-icon">' + c.icon + '</span>' + c.title + '</div>' +
        '<div class="iq-concept-body">' + c.body + '</div>' +
      '</div>';
    }).join('');

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Learn', true) +
        '<div class="iq-learn-intro">🧠 The big ideas every investor should know:</div>' +
        '<div class="iq-concepts">' + cards + '</div>' +
        '<div class="iq-actions">' +
          '<button type="button" class="iq-btn primary" onclick="InvestQuest.quiz()">Take the quiz 📝</button>' +
          '<button type="button" class="iq-btn ghost" onclick="InvestQuest.setup()">Play the market 🪙</button>' +
        '</div>' +
      '</div>';
  }

  // ---- quiz --------------------------------------------------------
  var QUIZ = [
    { q: 'What does ROI tell you?',
      opts: ['How much your money grew compared to what you invested', 'How many coins you have', 'The color of a stock'],
      a: 0, why: 'ROI = Return On Investment — your gain compared to what you put in.' },
    { q: 'A company releases a hit new product. Its stock will probably…',
      opts: ['Go down', 'Go up', 'Disappear'],
      a: 1, why: 'Good company news — like a popular product — usually pushes a stock up.' },
    { q: 'Why does the WHOLE market sometimes fall at once?',
      opts: ['Every company had a recall on the same day', 'Investors get nervous about the economy', 'The stock market closes forever'],
      a: 1, why: 'When people worry about the economy, most stocks drop together — even good ones.' },
    { q: 'Why do investors "diversify"?',
      opts: ['To spend money faster', 'So one bad investment won\'t sink everything', 'Because it looks cool'],
      a: 1, why: 'Spreading money out means a single drop won\'t hurt you as much.' },
    { q: 'Higher possible reward usually comes with…',
      opts: ['Higher risk', 'Zero risk', 'A free toy'],
      a: 0, why: 'Bigger rewards almost always mean a bigger chance of loss.' },
    { q: 'You invest $100 and a year later have $130. Your ROI is…',
      opts: ['30%', '$30 only, no percent', '130%'],
      a: 0, why: 'You gained $30 on $100 = 30% ROI.' },
    { q: 'What is the S&P 500?',
      opts: ['A single risky startup', 'An index of the 500 biggest companies — "the market"', 'A type of bank loan'],
      a: 1, why: 'The S&P 500 owns the 500 biggest companies at once — instant diversification, and the benchmark investors try to beat.' },
    { q: 'A biotech\'s new medicine just FAILED its big test. Its stock will likely…',
      opts: ['Soar', 'Crash', 'Stay exactly the same'],
      a: 1, why: 'All-or-nothing companies crash when their one big bet fails — that is company-specific risk.' },
    { q: 'Your stocks dropped this year. The smartest move is usually to…',
      opts: ['Panic and sell everything', 'Remember losses are normal and think long-term', 'Never invest again'],
      a: 1, why: 'Down years happen to everyone. Staying calm and long-term is how investors win.' }
  ];

  var quizState = null;
  function quiz() { _sound('click'); quizState = { idx: 0, correct: 0 }; _renderQuiz(); }

  function _renderQuiz() {
    var item = QUIZ[quizState.idx];
    if (!item) return _renderQuizResult();
    var opts = item.opts.map(function(o, i) {
      return '<button type="button" class="iq-quiz-opt" onclick="InvestQuest._answer(this,' + i + ')">' + o + '</button>';
    }).join('');
    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Quiz · ' + (quizState.idx + 1) + ' of ' + QUIZ.length, true) +
        '<div class="iq-panel">' +
          '<div class="iq-quiz-q">' + item.q + '</div>' +
          '<div class="iq-quiz-opts" id="iq-quiz-opts">' + opts + '</div>' +
          '<div class="iq-quiz-why" id="iq-quiz-why"></div>' +
        '</div>' +
      '</div>';
  }

  function _answer(btn, i) {
    var item = QUIZ[quizState.idx];
    var opts = document.querySelectorAll('#iq-quiz-opts .iq-quiz-opt');
    for (var k = 0; k < opts.length; k++) {
      opts[k].disabled = true;
      if (k === item.a) opts[k].classList.add('correct');
    }
    if (i === item.a) { quizState.correct++; _sound('correct'); }
    else { btn.classList.add('wrong'); _sound('wrong'); }
    var why = document.getElementById('iq-quiz-why');
    if (why) why.innerHTML = '💡 ' + item.why;
    setTimeout(function() { quizState.idx++; _renderQuiz(); }, i === item.a ? 950 : 1750);
  }

  function _renderQuizResult() {
    var n = QUIZ.length, c = quizState.correct;
    var emoji = c === n ? '🏆' : c >= n * 0.6 ? '🌟' : '💪';
    var title = c === n ? 'Perfect score!' : c >= n * 0.6 ? 'Well done!' : 'Good try!';

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Invest Quest', '📝', 'Finished the quiz — ' + c + '/' + n + ' correct');
    }
    var data = _load();
    if (data.quizBest == null || c > data.quizBest) { data.quizBest = c; _save(data); }

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Quiz results', true) +
        '<div class="iq-final">' +
          '<span class="iq-final-emoji">' + emoji + '</span>' +
          '<div class="iq-final-title">' + title + '</div>' +
          '<div class="iq-final-sub">You got <b>' + c + ' / ' + n + '</b> right.</div>' +
          '<div class="iq-actions">' +
            '<button type="button" class="iq-btn primary" onclick="InvestQuest.quiz()">Try again 🔁</button>' +
            '<button type="button" class="iq-btn ghost" onclick="InvestQuest.setup()">Play the market 🪙</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ---- expose ------------------------------------------------------
  window.InvestQuest = {
    open: open, home: home, setup: setup, begin: begin,
    adjust: adjust, autoMix: autoMix, runYear: runYear, manage: manage,
    finish: finish, learn: learn, quiz: quiz, _answer: _answer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', open);
  } else {
    open();
  }
})();
