/* ================================================================
   MONEY MASTER — Currency identification, change-making, counting.
   Supports CLP (Chilean peso) and USD. Per-kid storage at zs_money_<key>.
   Issue #163.
   ================================================================ */

(function() {
  'use strict';

  var ROUND_LEN = 10;

  // USD denominations are stored in CENTS (so we can mix coins + bills cleanly).
  var DENOMS = {
    CLP: [
      { v: 10,    label: '$10',     name: '10 pesos',     kind: 'coin' },
      { v: 50,    label: '$50',     name: '50 pesos',     kind: 'coin' },
      { v: 100,   label: '$100',    name: '100 pesos',    kind: 'coin' },
      { v: 500,   label: '$500',    name: '500 pesos',    kind: 'coin' },
      { v: 1000,  label: '$1.000',  name: '1.000 pesos',  kind: 'bill' },
      { v: 2000,  label: '$2.000',  name: '2.000 pesos',  kind: 'bill' },
      { v: 5000,  label: '$5.000',  name: '5.000 pesos',  kind: 'bill' },
      { v: 10000, label: '$10.000', name: '10.000 pesos', kind: 'bill' },
      { v: 20000, label: '$20.000', name: '20.000 pesos', kind: 'bill' }
    ],
    USD: [
      { v: 1,    label: '1¢',  name: 'penny',     kind: 'coin' },
      { v: 5,    label: '5¢',  name: 'nickel',    kind: 'coin' },
      { v: 10,   label: '10¢', name: 'dime',      kind: 'coin' },
      { v: 25,   label: '25¢', name: 'quarter',   kind: 'coin' },
      { v: 100,  label: '$1',  name: 'one dollar',     kind: 'bill' },
      { v: 500,  label: '$5',  name: 'five dollars',   kind: 'bill' },
      { v: 1000, label: '$10', name: 'ten dollars',    kind: 'bill' },
      { v: 2000, label: '$20', name: 'twenty dollars', kind: 'bill' }
    ]
  };

  var MODES = [
    { id: 'identify', icon: '🔎', name: 'Identify',   desc: 'Spot a coin or bill — what is it worth?' },
    { id: 'count',    icon: '🧮', name: 'Count Up',   desc: 'Add up a small pile of coins and bills.' },
    { id: 'change',   icon: '🛒', name: 'Make Change', desc: 'You buy something. How much change comes back?' }
  ];

  var STORAGE_PREFIX = 'zs_money_';
  var PREF_KEY = 'zs_money_pref';

  // ---- helpers ----
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

  function _loadPref() {
    try {
      var raw = localStorage.getItem(PREF_KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }

  function _savePref(p) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {}
  }

  function _rand(n) { return Math.floor(Math.random() * n); }
  function _pick(arr) { return arr[_rand(arr.length)]; }
  function _shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = _rand(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function _formatAmount(currency, valueCents) {
    if (currency === 'USD') {
      // Cents stored as integers. Show $X.XX, or NN¢ if under a dollar.
      if (valueCents < 100) return valueCents + '¢';
      var dollars = Math.floor(valueCents / 100);
      var rem = valueCents % 100;
      return '$' + dollars + (rem ? '.' + (rem < 10 ? '0' : '') + rem : '');
    }
    // CLP — integer pesos with thousands separator (Chile uses '.').
    return '$' + String(valueCents).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function _renderDenom(currency, d) {
    var cls = 'mm-c-' + currency.toLowerCase() + '-' + d.v;
    if (d.kind === 'coin') {
      return '<div class="mm-coin ' + cls + '">' + d.label + '</div>';
    }
    return '<div class="mm-bill ' + cls + '">' + d.label + '</div>';
  }

  // ---- state ----
  var state = {
    currency: 'CLP',
    mode: null,
    qIdx: 0,
    score: 0,
    correct: 0,
    questions: []
  };

  // ---- screens ----
  function _root() { return document.getElementById('mm-wrap'); }

  function open() {
    var pref = _loadPref();
    state.currency = pref.currency || 'CLP';
    _renderHome();
  }

  function _renderHome() {
    var data = _load();
    var bestKey = state.currency.toLowerCase();
    var modeCards = MODES.map(function(m) {
      var best = (data[bestKey] && data[bestKey][m.id]) || null;
      var bestText = best && best.score
        ? 'Best: ' + best.score + '/' + ROUND_LEN + ' · ⭐ ' + (best.stars || 0)
        : 'No score yet';
      return '<div class="mm-mode-card" onclick="MoneyMaster.start(\'' + m.id + '\')">' +
        '<span class="mm-mode-icon">' + m.icon + '</span>' +
        '<div class="mm-mode-name">' + m.name + '</div>' +
        '<div class="mm-mode-desc">' + m.desc + '</div>' +
        '<div class="mm-mode-best">' + bestText + '</div>' +
      '</div>';
    }).join('');

    _root().innerHTML =
      '<div class="mm-header">' +
        '<span class="icon">💰</span>' +
        '<h1>Money Master</h1>' +
        '<p>Coins, bills, and change-making — pick a currency.</p>' +
      '</div>' +
      '<div class="mm-currency" role="group" aria-label="Choose currency">' +
        '<button type="button" class="' + (state.currency === 'CLP' ? 'active' : '') + '" onclick="MoneyMaster.setCurrency(\'CLP\')">🇨🇱 Pesos (CLP)</button>' +
        '<button type="button" class="' + (state.currency === 'USD' ? 'active' : '') + '" onclick="MoneyMaster.setCurrency(\'USD\')">🇺🇸 Dollars (USD)</button>' +
      '</div>' +
      '<div class="mm-mode-grid">' + modeCards + '</div>';
  }

  function setCurrency(c) {
    if (c !== 'CLP' && c !== 'USD') return;
    state.currency = c;
    _savePref({ currency: c });
    _renderHome();
  }

  // ---- question generators ----
  function _genIdentify(currency) {
    var denoms = DENOMS[currency];
    var target = _pick(denoms);
    // Pick 3 distractors at similar magnitudes when possible.
    var others = denoms.filter(function(d) { return d.v !== target.v; });
    var distractors = _shuffle(others).slice(0, 3);
    var options = _shuffle([target].concat(distractors));
    return {
      type: 'identify',
      prompt: 'How much is this worth?',
      display: _renderDenom(currency, target),
      options: options.map(function(o) { return { text: _formatAmount(currency, o.v), correct: o.v === target.v }; }),
      answer: _formatAmount(currency, target.v)
    };
  }

  function _genCount(currency) {
    // Build a pile of 2-5 denoms, then ask for total.
    var denoms = DENOMS[currency];
    // Skip the very largest in count mode to keep totals tractable.
    var pool = denoms.slice(0, denoms.length - 2);
    var pileSize = 2 + _rand(4); // 2-5
    var pile = [];
    var total = 0;
    for (var i = 0; i < pileSize; i++) {
      var d = _pick(pool);
      pile.push(d);
      total += d.v;
    }
    pile.sort(function(a, b) { return b.v - a.v; });

    // Build 3 distractors — close-but-wrong totals.
    var distractors = [];
    var seen = { };
    seen[total] = 1;
    var attempts = 0;
    while (distractors.length < 3 && attempts < 30) {
      attempts++;
      var swap = _pick(denoms);
      var alt = total - pile[0].v + swap.v;
      if (alt > 0 && !seen[alt] && alt !== total) {
        seen[alt] = 1;
        distractors.push(alt);
      }
    }
    while (distractors.length < 3) {
      var fallback = total + (_rand(3) - 1) * (currency === 'USD' ? 25 : 100);
      if (fallback > 0 && !seen[fallback]) { seen[fallback] = 1; distractors.push(fallback); }
      else { distractors.push(total + 100 + distractors.length); }
    }

    var optionVals = _shuffle([total].concat(distractors));
    return {
      type: 'count',
      prompt: 'Add it up!',
      display: pile.map(function(d) { return _renderDenom(currency, d); }).join(''),
      options: optionVals.map(function(v) { return { text: _formatAmount(currency, v), correct: v === total }; }),
      answer: _formatAmount(currency, total)
    };
  }

  function _genChange(currency) {
    // Generate a "price" you would pay with cash.
    var price, paid;
    if (currency === 'USD') {
      // Whole-dollar amounts under $20 paid with $5/$10/$20.
      var dollarPrices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18];
      var p = _pick(dollarPrices);
      price = p * 100;
      var paidOptions = [500, 1000, 2000].filter(function(x) { return x > price; });
      paid = _pick(paidOptions);
    } else {
      // CLP — round to nearest $100 to keep arithmetic fair.
      var clpPrices = [];
      for (var c = 100; c <= 19000; c += 100) clpPrices.push(c);
      price = _pick(clpPrices);
      var bills = [1000, 2000, 5000, 10000, 20000].filter(function(x) { return x > price; });
      paid = _pick(bills);
    }
    var change = paid - price;
    var distractors = _shuffle([
      change + (currency === 'USD' ? 100 : 1000),
      Math.max(currency === 'USD' ? 5 : 10, change - (currency === 'USD' ? 100 : 1000)),
      paid - change, // common mistake: subtract change from paid
      change + (currency === 'USD' ? 50 : 500)
    ].filter(function(x, i, a) { return x > 0 && x !== change && a.indexOf(x) === i; })).slice(0, 3);

    while (distractors.length < 3) distractors.push(change + (distractors.length + 1) * (currency === 'USD' ? 25 : 250));

    var options = _shuffle([change].concat(distractors));
    return {
      type: 'change',
      prompt: 'Item costs ' + _formatAmount(currency, price) + '. You pay with ' + _formatAmount(currency, paid) + '. Change?',
      display: '<div class="mm-q-text">' + _formatAmount(currency, paid) + ' − ' + _formatAmount(currency, price) + ' = ?</div>',
      options: options.map(function(v) { return { text: _formatAmount(currency, v), correct: v === change }; }),
      answer: _formatAmount(currency, change)
    };
  }

  function _generateQuestions(mode, currency) {
    var fns = { identify: _genIdentify, count: _genCount, change: _genChange };
    var fn = fns[mode];
    var qs = [];
    var seen = {};
    var safety = 0;
    while (qs.length < ROUND_LEN && safety < 200) {
      safety++;
      var q = fn(currency);
      // crude dedupe to avoid back-to-back repeats
      var fp = q.prompt + '|' + q.answer;
      if (seen[fp]) continue;
      seen[fp] = 1;
      qs.push(q);
    }
    return qs;
  }

  // ---- gameplay ----
  function start(mode) {
    state.mode = mode;
    state.qIdx = 0;
    state.score = 0;
    state.correct = 0;
    state.questions = _generateQuestions(mode, state.currency);
    _renderQuestion();
  }

  function _renderQuestion() {
    var q = state.questions[state.qIdx];
    if (!q) return _renderResults();

    var modeMeta = MODES.filter(function(m) { return m.id === state.mode; })[0] || {};
    var pct = Math.round((state.qIdx / ROUND_LEN) * 100);
    var optionsHtml = q.options.map(function(o, i) {
      return '<button type="button" class="mm-option" data-correct="' + (o.correct ? '1' : '0') + '" onclick="MoneyMaster._answer(this, ' + i + ')">' +
        o.text +
      '</button>';
    }).join('');

    _root().innerHTML =
      '<div class="mm-game">' +
        '<div class="mm-game-top">' +
          '<button class="mm-back-btn" aria-label="Back to modes" onclick="MoneyMaster.back()">←</button>' +
          '<div class="mm-progress"><div class="mm-progress-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="mm-score">⭐ ' + state.score + '</div>' +
        '</div>' +
        '<div class="mm-question-card">' +
          '<div class="mm-q-prompt">' + (modeMeta.icon || '') + ' ' + q.prompt + '</div>' +
          '<div class="mm-q-display">' + q.display + '</div>' +
          '<div style="font-size:0.78rem;color:var(--text-muted,#8B86B0);font-weight:700;">Question ' + (state.qIdx + 1) + ' of ' + ROUND_LEN + '</div>' +
        '</div>' +
        '<div class="mm-options" id="mm-opts">' + optionsHtml + '</div>' +
        '<div class="mm-hint" id="mm-hint"></div>' +
      '</div>';
  }

  function _answer(btn, idx) {
    var q = state.questions[state.qIdx];
    var correct = btn.getAttribute('data-correct') === '1';
    var opts = document.querySelectorAll('#mm-opts .mm-option');
    for (var i = 0; i < opts.length; i++) {
      opts[i].disabled = true;
      var isC = opts[i].getAttribute('data-correct') === '1';
      if (isC) opts[i].classList.add('correct');
    }
    if (correct) {
      btn.classList.add('correct');
      state.score++;
      state.correct++;
      if (typeof Sounds !== 'undefined' && Sounds.correct) Sounds.correct();
      _showFeedback('✅');
    } else {
      btn.classList.add('wrong');
      if (typeof Sounds !== 'undefined' && Sounds.wrong) Sounds.wrong();
      var hint = document.getElementById('mm-hint');
      if (hint) hint.textContent = 'Correct answer: ' + q.answer;
      _showFeedback('💡');
    }

    setTimeout(function() {
      state.qIdx++;
      if (state.qIdx >= ROUND_LEN) _renderResults();
      else _renderQuestion();
    }, correct ? 700 : 1400);
  }

  function _showFeedback(emoji) {
    var fb = document.getElementById('feedback');
    var em = document.getElementById('feedbackEmoji');
    if (!fb || !em) return;
    em.textContent = emoji;
    fb.classList.add('show');
    setTimeout(function() { fb.classList.remove('show'); }, 700);
  }

  function _starsFor(score) {
    if (score >= ROUND_LEN) return 3;
    if (score >= Math.ceil(ROUND_LEN * 0.7)) return 2;
    if (score >= Math.ceil(ROUND_LEN * 0.4)) return 1;
    return 0;
  }

  function _renderResults() {
    var stars = _starsFor(state.score);
    var data = _load();
    var ck = state.currency.toLowerCase();
    if (!data[ck]) data[ck] = {};
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
      ActivityLog.push({
        app: 'money',
        kind: 'round',
        meta: {
          mode: state.mode,
          currency: state.currency,
          score: state.score,
          stars: stars,
          newRecord: newRecord
        }
      });
    }

    var emoji = stars >= 3 ? '🏆' : stars >= 2 ? '🌟' : stars >= 1 ? '💪' : '🎯';
    var title = stars >= 3 ? 'Money Master!' : stars >= 2 ? 'Great work!' : stars >= 1 ? 'Nice try!' : 'Keep practicing';
    var starsHtml = '';
    for (var i = 0; i < 3; i++) starsHtml += (i < stars ? '⭐' : '☆');

    _root().innerHTML =
      '<div class="mm-results">' +
        '<span class="mm-results-emoji">' + emoji + '</span>' +
        '<div class="mm-results-title">' + title + '</div>' +
        '<div class="mm-results-sub">' + state.score + ' / ' + ROUND_LEN + ' correct' +
          (newRecord ? ' · 🎉 New best!' : '') +
        '</div>' +
        '<div class="mm-stars-row">' + starsHtml + '</div>' +
        '<div class="mm-results-btns">' +
          '<button class="mm-btn mm-btn-primary" onclick="MoneyMaster.start(\'' + state.mode + '\')">Play Again 🔁</button>' +
          '<button class="mm-btn mm-btn-secondary" onclick="MoneyMaster.back()">Other Modes</button>' +
        '</div>' +
      '</div>';
  }

  function back() { _renderHome(); }

  // ---- expose ----
  window.MoneyMaster = {
    open: open,
    setCurrency: setCurrency,
    start: start,
    back: back,
    _answer: _answer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', open);
  } else {
    open();
  }
})();
