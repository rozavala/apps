/* ================================================================
   INVEST QUEST — A kid-friendly market simulator.
   Teaches risk, return, ROI, diversification, compounding and how a
   market moves on news. Two modes: Play (simulator) + Learn (concepts
   & quiz). Per-kid storage at zs_invest_<key>.
   ================================================================ */

(function() {
  'use strict';

  var TARGET_YEARS = 10;
  var STORAGE_PREFIX = 'zs_invest_';

  // ---- the investment menu, ordered low → high risk ----------------
  // mean = average yearly return, vol = how much it swings (volatility).
  var ASSETS = [
    { id: 'savings', icon: '🏦', name: 'Savings Account', tag: 'Very low risk',
      mean: 0.03, vol: 0.01, risk: 1, color: 'var(--iq-teal)',
      desc: 'The bank pays you a little interest for keeping money there. Safe and steady — but it grows slowly.' },
    { id: 'bonds', icon: '📜', name: 'Government Bonds', tag: 'Low risk',
      mean: 0.05, vol: 0.04, risk: 2, color: 'var(--iq-blue)',
      desc: 'You lend money to the government. They pay it back later, plus a bit extra. Pretty safe.' },
    { id: 'stocks', icon: '🏢', name: 'Company Stocks', tag: 'Medium risk',
      mean: 0.09, vol: 0.18, risk: 3, color: 'var(--iq-indigo)',
      desc: 'You own a tiny piece of big companies. Over many years it grows well, but it bounces up and down a lot.' },
    { id: 'biz', icon: '🍋', name: 'Lemonade Business', tag: 'High risk',
      mean: 0.13, vol: 0.28, risk: 4, color: 'var(--iq-gold)',
      desc: 'Invest in a small business, like your own lemonade stand. Big rewards if it does well — but it can flop.' },
    { id: 'crypto', icon: '🚀', name: 'Crypto & Startups', tag: 'Very high risk',
      mean: 0.20, vol: 0.55, risk: 5, color: 'var(--iq-pink)',
      desc: 'Brand-new and exciting. It can rocket to the moon — or crash hard. Only risk what you could lose.' }
  ];

  function _asset(id) {
    for (var i = 0; i < ASSETS.length; i++) if (ASSETS[i].id === id) return ASSETS[i];
    return null;
  }

  // ---- market news events ------------------------------------------
  // adj = extra return added to specific assets that year.
  var EVENTS = [
    { icon: '😴', text: 'A calm, quiet year. Not much happened.', adj: {} },
    { icon: '📈', text: 'Boom! The whole market went up this year.', adj: { stocks: 0.07, biz: 0.06, crypto: 0.10 } },
    { icon: '📉', text: 'A recession hit. Risky investments dropped.', adj: { stocks: -0.13, biz: -0.10, crypto: -0.28 } },
    { icon: '🚀', text: 'Tech mania! Startups and crypto went wild.', adj: { crypto: 0.45, stocks: 0.05 } },
    { icon: '💥', text: 'A startup bubble popped. Crypto tumbled.', adj: { crypto: -0.45, stocks: -0.04 } },
    { icon: '☀️', text: 'Hot summer — lemonade sales soared!', adj: { biz: 0.22 } },
    { icon: '🌧️', text: 'A rainy year — small businesses struggled.', adj: { biz: -0.20 } },
    { icon: '🏦', text: 'The bank raised interest rates.', adj: { savings: 0.02, bonds: 0.02 } },
    { icon: '🎉', text: 'People are spending! Big companies earned more.', adj: { stocks: 0.08, biz: 0.05 } },
    { icon: '🛒', text: 'Prices rose (inflation). Cash buys a little less.', adj: {}, inflation: true }
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

  // Standard normal via Box–Muller, gently clamped so we never get
  // a totally absurd single year.
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
      step: Math.max(10, Math.round(start / 10)),
      cash: start,            // money not yet invested
      holdings: holdings,     // dollars in each asset
      year: 0,
      history: [start],       // net worth at end of each year (index 0 = start)
      lastEvent: null,
      lastReturns: null
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
        '<p>Grow your money — learn about risk, reward and the market.</p>' +
      '</div>' +
      statLine +
      '<div class="iq-home-grid">' +
        '<button type="button" class="iq-home-card iq-home-play" onclick="InvestQuest.setup()">' +
          '<span class="iq-home-icon">🪙</span>' +
          '<span class="iq-home-name">Play the Market</span>' +
          '<span class="iq-home-desc">Invest your lemonade money and grow it over 10 years.</span>' +
        '</button>' +
        '<button type="button" class="iq-home-card iq-home-learn" onclick="InvestQuest.learn()">' +
          '<span class="iq-home-icon">🧠</span>' +
          '<span class="iq-home-name">Learn the Ideas</span>' +
          '<span class="iq-home-desc">What is risk, return, ROI and why spread your money out?</span>' +
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
  function _renderAllocate(isFirst) {
    var net = _netWorth(state);
    var rows = ASSETS.map(function(a) {
      var val = state.holdings[a.id];
      var pctOfNet = net > 0 ? Math.round((val / net) * 100) : 0;
      var dots = '';
      for (var i = 1; i <= 5; i++) {
        dots += '<span class="iq-risk-dot' + (i <= a.risk ? ' on' : '') + '"></span>';
      }
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
          '<button type="button" class="iq-step" aria-label="Take money out of ' + a.name + '" onclick="InvestQuest.adjust(\'' + a.id + '\',-1)">−</button>' +
          '<div class="iq-asset-val"><span>' + _money(val) + '</span><small>' + pctOfNet + '%</small></div>' +
          '<button type="button" class="iq-step plus" aria-label="Put money into ' + a.name + '" onclick="InvestQuest.adjust(\'' + a.id + '\',1)">+</button>' +
        '</div>' +
        '<div class="iq-asset-desc">' + a.desc + '</div>' +
      '</div>';
    }).join('');

    var canGo = state.cash < net; // at least something invested
    var title = isFirst ? 'Spread out your money' : 'Year ' + state.year + ' — adjust your plan';
    var sub = isFirst
      ? 'Tap + to invest, − to pull money back to Cash. Mixing different types is called <b>diversifying</b> — it lowers your risk.'
      : 'You can buy more or sell some before the next year. Or leave it and let it grow!';

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar(isFirst ? 'New game' : 'Manage', true) +
        '<div class="iq-panel">' +
          '<div class="iq-panel-title">' + title + '</div>' +
          '<p class="iq-panel-sub">' + sub + '</p>' +
          '<div class="iq-cash">💵 Cash to invest: <b>' + _money(state.cash) + '</b>' +
            '<span class="iq-cash-note">(uninvested cash does not grow)</span></div>' +
          '<div class="iq-asset-list">' + rows + '</div>' +
          '<div class="iq-actions">' +
            (isFirst
              ? '<button type="button" class="iq-btn ghost" onclick="InvestQuest.autoMix()">✨ Suggest a mix</button>'
              : '') +
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

  // A sensible balanced starter mix so kids see what diversifying looks like.
  function autoMix() {
    _sound('star');
    // pull everything back to cash first
    ASSETS.forEach(function(a) { state.cash += state.holdings[a.id]; state.holdings[a.id] = 0; });
    var weights = { savings: 0.15, bonds: 0.20, stocks: 0.35, biz: 0.20, crypto: 0.10 };
    var net = state.cash;
    ASSETS.forEach(function(a) {
      var want = Math.round((net * weights[a.id]) / state.step) * state.step;
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
    var event = _pick(EVENTS);
    var returns = {};
    var before = {};
    ASSETS.forEach(function(a) {
      before[a.id] = state.holdings[a.id];
      var r = a.mean + a.vol * _gauss();
      if (event.adj[a.id]) r += event.adj[a.id];
      if (r < -0.9) r = -0.9; // can't lose more than 90% in a year
      returns[a.id] = r;
      state.holdings[a.id] = state.holdings[a.id] * (1 + r);
    });
    state.year += 1;
    state.lastEvent = event;
    state.lastReturns = returns;
    state.lastBefore = before;
    state.history.push(_netWorth(state));
    _renderYearResult();
  }

  function _renderYearResult() {
    var event = state.lastEvent;
    var net = _netWorth(state);
    var roi = (net - state.start) / state.start;
    var prevNet = state.history[state.history.length - 2];
    var yearChange = net - prevNet;

    var rows = ASSETS.map(function(a) {
      var before = state.lastBefore[a.id];
      var after = state.holdings[a.id];
      if (before <= 0 && after <= 0) return '';
      var delta = after - before;
      var r = state.lastReturns[a.id];
      var cls = delta > 0.5 ? 'up' : (delta < -0.5 ? 'down' : 'flat');
      return '<div class="iq-res-row">' +
        '<span class="iq-res-icon">' + a.icon + '</span>' +
        '<span class="iq-res-name">' + a.name + '</span>' +
        '<span class="iq-res-val">' + _money(after) + '</span>' +
        '<span class="iq-res-delta ' + cls + '">' + (delta >= 0 ? '+' : '') + _money(delta) +
          ' <small>' + _pct(r) + '</small></span>' +
      '</div>';
    }).join('');

    var cashRow = state.cash > 0
      ? '<div class="iq-res-row"><span class="iq-res-icon">💵</span>' +
        '<span class="iq-res-name">Cash</span>' +
        '<span class="iq-res-val">' + _money(state.cash) + '</span>' +
        '<span class="iq-res-delta flat">+$0 <small>0%</small></span></div>'
      : '';

    var done = state.year >= TARGET_YEARS;
    var roiCls = roi > 0 ? 'up' : (roi < 0 ? 'down' : 'flat');

    _root().innerHTML =
      '<div class="iq-game">' +
        _topBar('Year ' + state.year + ' of ' + TARGET_YEARS, true) +
        '<div class="iq-event ' + (event.inflation ? 'warn' : '') + '">' +
          '<span class="iq-event-icon">' + event.icon + '</span>' +
          '<span class="iq-event-text">' + event.text + '</span>' +
        '</div>' +
        '<div class="iq-networth">' +
          '<div class="iq-nw-label">Your money is now</div>' +
          '<div class="iq-nw-value ' + roiCls + '">' + _money(net) + '</div>' +
          '<div class="iq-nw-sub">' +
            'This year: <b class="' + (yearChange >= 0 ? 'up' : 'down') + '">' +
              (yearChange >= 0 ? '+' : '') + _money(yearChange) + '</b>' +
            ' · Total growth (ROI): <b class="' + roiCls + '">' + _pct(roi) + '</b>' +
          '</div>' +
        '</div>' +
        _chart() +
        '<div class="iq-res-list">' + rows + cashRow + '</div>' +
        '<div class="iq-actions">' +
          (done
            ? '<button type="button" class="iq-btn primary" onclick="InvestQuest.finish()">See my results 🏁</button>'
            : '<button type="button" class="iq-btn ghost" onclick="InvestQuest.manage()">✏️ Adjust plan</button>' +
              '<button type="button" class="iq-btn primary" onclick="InvestQuest.runYear()">Next year ▶</button>') +
        '</div>' +
      '</div>';

    if (yearChange > 0) _sound('correct'); else if (yearChange < 0) _sound('wrong');
  }

  function manage() { _sound('click'); _renderAllocate(false); }

  // ---- tiny SVG line chart of net worth over the years -------------
  function _chart() {
    var h = state.history;
    if (h.length < 2) return '';
    var W = 280, H = 90, pad = 6;
    var max = Math.max.apply(null, h), min = Math.min.apply(null, h);
    if (max === min) max = min + 1;
    var pts = h.map(function(v, i) {
      var x = pad + (i / (h.length - 1)) * (W - pad * 2);
      var y = pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var up = h[h.length - 1] >= state.start;
    var stroke = up ? 'var(--iq-green)' : 'var(--iq-red)';
    var last = pts[pts.length - 1].split(',');
    return '<div class="iq-chart">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<polyline fill="none" stroke="' + stroke + '" stroke-width="2.5" ' +
          'stroke-linecap="round" stroke-linejoin="round" points="' + pts.join(' ') + '"/>' +
        '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3.5" fill="' + stroke + '"/>' +
      '</svg>' +
      '<div class="iq-chart-cap">📅 Your money over ' + (h.length - 1) + ' year' + (h.length - 1 === 1 ? '' : 's') + '</div>' +
    '</div>';
  }

  // ---- final summary -----------------------------------------------
  function finish() {
    _sound('cheer');
    var net = _netWorth(state);
    var roi = (net - state.start) / state.start;
    var perYear = Math.pow(net / state.start, 1 / TARGET_YEARS) - 1;

    // stars: did it grow, beat a savings account, grow strongly?
    var stars = 0;
    if (roi > 0) stars = 1;
    if (perYear >= 0.04) stars = 2;          // beat a plain savings account
    if (perYear >= 0.08) stars = 3;          // strong, stock-market-like growth
    var starsHtml = '';
    for (var i = 0; i < 3; i++) starsHtml += (i < stars ? '⭐' : '☆');

    // lesson tailored to how they did
    var allCrypto = state.history.length > 1;
    var lesson;
    if (roi <= 0) {
      lesson = 'Markets go up and down. Some years you lose money — that is normal. Spreading money across safer and riskier choices (diversifying) softens the bad years.';
    } else if (perYear >= 0.08) {
      lesson = 'Great growth! You took some smart risks and stayed invested. Over many years, that is how money grows the most.';
    } else {
      lesson = 'Nice — your money grew! Safer choices grow slowly but steadily. Adding a little more risk can grow it faster, if you can handle the bumps.';
    }

    var emoji = stars >= 3 ? '🏆' : stars >= 2 ? '🌟' : stars >= 1 ? '💪' : '🌱';
    var title = stars >= 3 ? 'Master Investor!' : stars >= 2 ? 'Smart Investor!' : stars >= 1 ? 'You grew it!' : 'Keep learning!';

    // save best
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
  //  LEARN MODE — concept cards + quick quiz
  // ================================================================
  var CONCEPTS = [
    { icon: '🌱', title: 'What is investing?',
      body: 'Investing means putting your money to work so it can <b>grow</b> over time, instead of just sitting still. You buy something today hoping it will be worth more later.' },
    { icon: '⚖️', title: 'Risk vs. Return',
      body: 'Return is the money you <b>make</b>. Risk is the chance you could <b>lose</b> some. Usually, the bigger the possible reward, the bigger the risk. Safe things grow slowly; risky things can grow fast — or drop.' },
    { icon: '🧺', title: 'Diversify (don\'t put all your eggs in one basket)',
      body: 'Spreading money across many different investments is called <b>diversifying</b>. If one drops, the others can hold you up. It is the smartest way to lower your risk.' },
    { icon: '📊', title: 'What is ROI?',
      body: 'ROI means <b>Return On Investment</b>. It is how much you gained compared to what you put in. Invest $100 and end with $120? That is a $20 gain, or <b>20% ROI</b>.' },
    { icon: '❄️', title: 'Compounding (the snowball)',
      body: 'When your money earns money, and then <i>that</i> money earns even more — that is <b>compounding</b>. Like a snowball rolling downhill, it grows faster the longer you wait.' },
    { icon: '🏪', title: 'What is "the market"?',
      body: 'A market is where people <b>buy and sell</b> investments, like stocks. Prices go up and down every day depending on news and what people think things are worth.' }
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
    { q: 'Which is usually the SAFEST place for money?',
      opts: ['Crypto', 'A savings account', 'A brand-new startup'],
      a: 1, why: 'Savings accounts barely move — safe, but they grow slowly.' },
    { q: 'Why do investors "diversify"?',
      opts: ['To spend money faster', 'So one bad investment won\'t sink everything', 'Because it looks cool'],
      a: 1, why: 'Spreading money out means a single drop won\'t hurt you as much.' },
    { q: 'Higher possible reward usually comes with…',
      opts: ['Higher risk', 'Zero risk', 'A free toy'],
      a: 0, why: 'Bigger rewards almost always mean a bigger chance of loss.' },
    { q: 'You invest $100 and a year later have $130. Your ROI is…',
      opts: ['30%', '$30 only, no percent', '130%'],
      a: 0, why: 'You gained $30 on $100 = 30% ROI.' },
    { q: 'What makes a "snowball" of growth over many years?',
      opts: ['Spending it', 'Compounding — earnings making more earnings', 'Hiding it under the bed'],
      a: 1, why: 'Compounding is money earning money, again and again.' }
  ];

  var quizState = null;

  function quiz() {
    _sound('click');
    quizState = { idx: 0, correct: 0 };
    _renderQuiz();
  }

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
    if (i === item.a) {
      quizState.correct++;
      _sound('correct');
    } else {
      btn.classList.add('wrong');
      _sound('wrong');
    }
    var why = document.getElementById('iq-quiz-why');
    if (why) why.innerHTML = '💡 ' + item.why;
    setTimeout(function() {
      quizState.idx++;
      _renderQuiz();
    }, i === item.a ? 900 : 1700);
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
    open: open,
    home: home,
    setup: setup,
    begin: begin,
    adjust: adjust,
    autoMix: autoMix,
    runYear: runYear,
    manage: manage,
    finish: finish,
    learn: learn,
    quiz: quiz,
    _answer: _answer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', open);
  } else {
    open();
  }
})();
