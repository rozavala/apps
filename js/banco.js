/* ================================================================
   BANCO FAMILIA — banco.js
   The kids give their real cash to a parent, who is the bank. Each
   deposit is recorded here with where the money came from, the
   parent's 10% match is added, and the money grows in the mix the
   kid picks: 🛡️ Bonds (steady, fixed rate) and 📈 S&P 500 (follows the
   real market). Only a parent adds or takes out money.

   Giving: a share of every deposit (10% at least; a kid can choose
   more) goes to a 💛 Giving jar that isn't invested. Each kid picks
   where it goes (their parish first on the list), and on Sundays a
   parent records the gift when it's given at Mass.

   Statements: on the first visit after the 1st, each kid gets last
   month's statement (what came in, the match, giving, gifts, spent and
   growth), kept in an archive; a past month is recomputed from the log.

   Wishlist: a kid adds things they want and has to wait 7 days before
   deciding ("Do you still want it?"). It is a thinking tool, not a
   spending button: only a parent takes money out, and a "still want
   it" item shows on the parent's list with a one-tap way to record it.

   Storage: household key zs_bank (synced; an event log — see
   js/bank-engine.js for the event shapes and all the maths). The S&P
   500 closes come from the sync server (/api/market/spx) and are
   cached at zs_bank_spx; a parent can also type one in.
   ================================================================ */
var Banco = (function () {
  'use strict';

  var E = BankEngine;
  var KEY = 'zs_bank';
  var PRICE_KEY = 'zs_bank_spx';

  var _parent = false;    // unlocked with the PIN this visit
  var _view = { name: 'home' };
  var _chooser = null;    // { account, bonds } while picking a mix

  // ── storage ──
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      if (!Array.isArray(d.events)) d.events = [];
      d.v = 1;
      return d;
    } catch (e) { return { v: 1, events: [] }; }
  }
  function add(evts) {
    var d = load();
    (Array.isArray(evts) ? evts : [evts]).forEach(function (e) { d.events.push(e); });
    d._syncedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(KEY);
    } catch (e) { ZsDialog.toast('Could not save — storage is full.'); }
  }
  function ev(type, fields) {
    return Object.assign({ id: E.uid('b'), type: type, ts: Date.now(), date: E.today(), by: _parent ? 'parent' : me() }, fields);
  }
  function prices() {
    try { var p = JSON.parse(localStorage.getItem(PRICE_KEY) || 'null'); return (p && p.prices) || {}; }
    catch (e) { return {}; }
  }
  function priceMeta() {
    try { return JSON.parse(localStorage.getItem(PRICE_KEY) || 'null') || {}; } catch (e) { return {}; }
  }

  // Fetch closes from the family server. Merges into what we have, so
  // a short reply never loses history.
  function fetchPrices() {
    if (typeof CloudSync === 'undefined' || !CloudSync.online || !CloudSync.server) return Promise.resolve(false);
    var meta = priceMeta(), have = meta.prices || {};
    var dates = Object.keys(have).sort();
    var since = dates.length ? E.addDays(dates[dates.length - 1], -10) : '';
    var url = CloudSync.server + '/api/market/spx' + (since ? '?since=' + since : '');
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.prices) return false;
      var merged = Object.assign({}, have, j.prices);
      var changed = Object.keys(merged).length !== dates.length ||
        Object.keys(j.prices).some(function (d) { return have[d] !== j.prices[d]; });
      localStorage.setItem(PRICE_KEY, JSON.stringify({ updatedAt: j.updatedAt, source: j.source, prices: merged }));
      return changed;
    }).catch(function () { return false; });
  }

  // ── who's looking ──
  function user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function me() { var u = user(); return u ? u.name : ''; }
  function tier() { var u = user(); return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate'; }
  function young() { var t = tier(); return t === 'beginner' || t === 'intermediate'; }
  function profiles() { return typeof getProfiles === 'function' ? getProfiles() : []; }

  function visibleAccounts() {
    var all = E.accounts(load().events).filter(function (a) { return !a.archived; });
    if (_parent) return all;
    var n = me();
    return all.filter(function (a) { return E.isMember(a, n); })
      .sort(function (a, b) { return (a.kind === 'own' ? 0 : 1) - (b.kind === 'own' ? 0 : 1); });
  }
  function findAccount(id) { return E.accounts(load().events).filter(function (a) { return a.id === id; })[0]; }
  function canSee(acc) { return !!acc && (_parent || E.isMember(acc, me())); }

  // ── formatting ──
  function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function money(x, cents) {
    var v = Number(x) || 0;
    var opts = { style: 'currency', currency: 'USD', minimumFractionDigits: cents === false ? 0 : 2, maximumFractionDigits: cents === false ? 0 : 2 };
    try { return new Intl.NumberFormat('en-US', opts).format(v); } catch (e) { return '$' + v.toFixed(2); }
  }
  function signed(x) { return (x >= 0 ? '+' : '−') + money(Math.abs(x)); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(d) { if (!E.isDate(d)) return ''; var p = d.split('-'); return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0]; }
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function monthLabel(m) { var p = String(m).split('-'); return MONTH_NAMES[+p[1] - 1] + ' ' + p[0]; }
  function source(id) { return E.SOURCES.filter(function (s) { return s.id === id; })[0] || E.SOURCES[E.SOURCES.length - 1]; }

  // ── art ──
  function bankArt() {
    return '<svg class="bk-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="bk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#a7f3d0"/></linearGradient>' +
      '<linearGradient id="bk-pig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbcfe8"/><stop offset="1" stop-color="#f472b6"/></linearGradient>' +
      '<radialGradient id="bk-coin" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fef08a"/><stop offset="1" stop-color="#ca8a04"/></radialGradient></defs>' +
      '<rect width="320" height="200" fill="url(#bk-sky)"/>' +
      '<g fill="#fff" opacity=".35"><circle cx="40" cy="40" r="26"/><circle cx="290" cy="50" r="34"/><circle cx="250" cy="170" r="20"/></g>' +
      // bank building
      '<g transform="translate(206 46)"><path d="M0 34 L48 6 L96 34 Z" fill="#f8fafc" stroke="#94a3b8"/>' +
        '<rect x="6" y="34" width="84" height="8" fill="#e2e8f0"/>' +
        '<g fill="#f1f5f9" stroke="#cbd5e1">' + [12, 32, 52, 72].map(function (x) { return '<rect x="' + x + '" y="42" width="10" height="52"/>'; }).join('') + '</g>' +
        '<rect x="0" y="94" width="96" height="10" fill="#cbd5e1"/><text x="48" y="28" text-anchor="middle" font-size="13" font-weight="900" fill="#059669" font-family="sans-serif">$</text></g>' +
      // piggy
      '<g transform="translate(110 118)">' +
        '<ellipse cx="0" cy="44" rx="70" ry="8" fill="#000" opacity=".12"/>' +
        '<ellipse cx="0" cy="0" rx="66" ry="46" fill="url(#bk-pig)"/>' +
        '<circle cx="60" cy="-4" r="20" fill="#f9a8d4"/><ellipse cx="66" cy="-2" rx="10" ry="8" fill="#ec4899"/>' +
        '<circle cx="63" cy="-3" r="2" fill="#831843"/><circle cx="70" cy="-3" r="2" fill="#831843"/>' +
        '<circle cx="40" cy="-20" r="4" fill="#1f2937"/><path d="M26 -40 l10 -16 l8 18 Z" fill="#f472b6"/>' +
        '<rect x="-14" y="-47" width="30" height="6" rx="3" fill="#9d174d"/>' +
        '<g fill="#f472b6"><rect x="-44" y="34" width="16" height="16" rx="4"/><rect x="24" y="34" width="16" height="16" rx="4"/></g>' +
        '<path d="M-66 -6 q-16 -6 -12 -18" stroke="#f472b6" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      // falling coins
      [[100, 36, 14], [124, 14, 11], [80, 12, 9]].map(function (c) {
        return '<g transform="translate(' + c[0] + ' ' + c[1] + ')"><circle r="' + c[2] + '" fill="url(#bk-coin)" stroke="#a16207"/>' +
          '<text y="' + (c[2] * .38) + '" text-anchor="middle" font-size="' + (c[2] * 1.1) + '" font-weight="900" fill="#a16207" font-family="sans-serif">$</text></g>';
      }).join('') +
      '</svg>';
  }

  // A glass jar filled to `fill` (0–1) with coins in the jar's colour.
  function jar(fill, color, icon) {
    var h = Math.max(0, Math.min(1, fill)) * 92;
    var id = 'jar' + Math.random().toString(36).slice(2, 7);
    return '<svg class="bk-jar" viewBox="0 0 120 140" aria-hidden="true">' +
      '<defs><clipPath id="' + id + '"><path d="M20 30 h80 v92 q0 12 -12 12 h-56 q-12 0 -12 -12 Z"/></clipPath></defs>' +
      '<rect x="28" y="12" width="64" height="16" rx="5" fill="#94a3b8"/>' +
      '<path d="M20 30 h80 v92 q0 12 -12 12 h-56 q-12 0 -12 -12 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>' +
      '<g clip-path="url(#' + id + ')">' +
        '<rect x="20" y="' + (134 - h) + '" width="80" height="' + h + '" fill="' + color + '" opacity=".85"/>' +
        (h > 8 ? Array.apply(null, Array(Math.ceil(h / 12))).map(function (_, i) {
          var y = 128 - i * 12;
          return '<ellipse cx="' + (40 + (i % 3) * 20) + '" cy="' + y + '" rx="12" ry="4" fill="#fff" opacity=".25"/>';
        }).join('') : '') +
      '</g>' +
      '<path d="M30 40 v76" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
      '<text x="60" y="88" text-anchor="middle" font-size="28">' + icon + '</text></svg>';
  }

  // Value vs money put in, as an SVG line chart.
  function chart(points) {
    if (points.length < 2) return '<div class="bk-chart-empty">The chart starts after your first week of saving.</div>';
    var W = 320, H = 140, P = 8;
    var vals = points.map(function (p) { return p.value; }).concat(points.map(function (p) { return p.putIn; }));
    var lo = Math.min.apply(null, vals) * 0.96, hi = Math.max.apply(null, vals) * 1.02;
    if (hi - lo < 1) { hi += 1; lo = Math.max(0, lo - 1); }
    function x(i) { return P + i / (points.length - 1) * (W - 2 * P); }
    function y(v) { return H - P - (v - lo) / (hi - lo) * (H - 2 * P); }
    var line = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1); }).join(' ');
    var put = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.putIn).toFixed(1); }).join(' ');
    var area = line + ' L' + x(points.length - 1).toFixed(1) + ' ' + (H - P) + ' L' + x(0).toFixed(1) + ' ' + (H - P) + ' Z';
    return '<svg class="bk-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Your money over time">' +
      '<defs><linearGradient id="bk-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10b981" stop-opacity=".35"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#bk-area)"/>' +
      '<path d="' + put + '" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + line + '" fill="none" stroke="#059669" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '</svg>' +
      '<div class="bk-chart-ends"><span>' + money(points[0].value) + '</span><span><b>' + money(points[points.length - 1].value) + '</b> now</span></div>' +
      '<div class="bk-legend"><span><i class="bk-dot val"></i>What it\'s worth</span><span><i class="bk-dot put"></i>Money put in</span>' +
      '<span class="bk-legend-dates">' + fmtDate(points[0].date) + ' → ' + fmtDate(points[points.length - 1].date) + '</span></div>';
  }

  // ── rendering ──
  function render() {
    var root = document.getElementById('bk-root');
    if (!root) return;
    var v = _view.name;
    if (v === 'account') root.innerHTML = renderAccount(_view.id);
    else if (v === 'deposit' || v === 'spend') root.innerHTML = renderMoneyForm(v);
    else if (v === 'give') root.innerHTML = renderGiveForm();
    else if (v === 'statement') root.innerHTML = renderStatement(_view.id, _view.month);
    else if (v === 'newShared') root.innerHTML = renderSharedForm();
    else if (v === 'settings') root.innerHTML = renderSettings();
    else root.innerHTML = renderHome();
    var r = document.getElementById('bk-mix-range');
    if (r) r.addEventListener('input', function () { pickMix(r.value, true); });
    var tm = document.getElementById('bk-tm-month');
    if (tm) tm.addEventListener('input', function () { timeMachine(); });
    if (document.getElementById('bk-f-give')) matchPreview();
  }

  function renderHome() {
    var accs = visibleAccounts();
    var pr = prices();
    var asOf = E.today();
    var u = user();
    var head =
      '<div class="bk-banner">' + bankArt() +
        '<div class="bk-banner-text"><h1>Banco Familia</h1>' +
        '<p>' + (_parent ? 'You\'re the bank. Record money the kids give you, and watch it grow.'
                         : 'Your money, saved and growing' + (u ? ', ' + esc(u.name) : '') + '!') + '</p></div></div>';

    var cards = accs.map(function (a) {
      var s = E.compute(load().events, a.id, pr, asOf);
      return '<button type="button" class="bk-acc" onclick="Banco.open(\'' + a.id + '\')">' +
        '<span class="bk-acc-emoji">' + esc(a.emoji) + '</span>' +
        '<span class="bk-acc-main"><span class="bk-acc-name">' + esc(a.name) + '</span>' +
          '<span class="bk-acc-kind">' + (a.kind === 'shared' ? '👥 Shared · ' + a.members.map(esc).join(', ') : '👤 Own account') + '</span></span>' +
        '<span class="bk-acc-bal"><b>' + money(s.value) + '</b>' +
          (s.deposits ? '<small class="' + (s.growth >= 0 ? 'up' : 'down') + '">' + signed(s.growth) + ' grown</small>' : '<small>No money yet</small>') +
          (s.giving > 0.004 ? '<small class="bk-give-mini">💛 ' + money(s.giving) + ' to give</small>' : '') + '</span>' +
      '</button>';
    }).join('');

    var empty = '';
    if (!accs.length) {
      empty = _parent
        ? '<div class="bk-empty">No accounts yet. Open one for each kid below.</div>'
        : '<div class="bk-empty">🐷 You don\'t have an account yet.<br>Give your money to Mom or Dad and they\'ll open one for you!</div>';
    }

    var parentBar = _parent ? renderParentBar() : '';
    var lock = _parent
      ? '<button type="button" class="bk-ghost" onclick="Banco.lock()">🔒 Lock bank manager</button>'
      : '<button type="button" class="bk-ghost" onclick="Banco.unlock()">🔑 Bank manager (parents)</button>';

    return head + statementCards(accs) + givingDay(accs) + parentBar + wishInbox(accs) +
      (accs.length ? '<h2 class="bk-h2">' + (_parent ? 'All accounts' : 'My accounts') + '</h2><div class="bk-accs">' + cards + '</div>' : empty) +
      (_parent ? renderFamilyTotal(accs) : '') +
      '<div class="bk-foot">' + lock + '</div>';
  }

  function renderFamilyTotal(accs) {
    if (!accs.length) return '';
    var pr = prices(), t = 0, put = 0, m = 0;
    var g = 0, given = 0;
    accs.forEach(function (a) { var s = E.compute(load().events, a.id, pr); t += s.total; put += s.deposited - s.withdrawn; m += s.matched; g += s.giving; given += s.given; });
    return '<div class="bk-card bk-total"><div><small>Held for the kids</small><b>' + money(t) + '</b></div>' +
      '<div><small>💛 Waiting to be given</small><b>' + money(g) + '</b></div>' +
      '<div><small>💛 Given so far</small><b>' + money(given) + '</b></div>' +
      '<div><small>Cash they gave you</small><b>' + money(put) + '</b></div>' +
      '<div><small>Your match so far</small><b>' + money(m) + '</b></div></div>';
  }

  function renderParentBar() {
    var accs = E.accounts(load().events);
    var missing = profiles().filter(function (p) {
      return !accs.some(function (a) { return a.kind === 'own' && E.isMember(a, p.name); });
    });
    return '<div class="bk-actions">' +
      '<button type="button" class="bk-btn green" onclick="Banco.go(\'deposit\')">＋ Deposit</button>' +
      '<button type="button" class="bk-btn" onclick="Banco.go(\'spend\')">− Money spent</button>' +
      '<button type="button" class="bk-btn" onclick="Banco.go(\'give\')">💛 Record a gift</button>' +
      '<button type="button" class="bk-btn" onclick="Banco.go(\'newShared\')">👥 New shared account</button>' +
      '<button type="button" class="bk-btn" onclick="Banco.go(\'settings\')">⚙️ Settings</button>' +
      '</div>' +
      (missing.length ? '<div class="bk-card bk-open"><b>Open accounts for:</b> ' + missing.map(function (p) { return esc(p.name); }).join(', ') +
        ' <button type="button" class="bk-btn green small" onclick="Banco.openOwnAccounts()">Open ' + (missing.length === 1 ? 'it' : 'them') + '</button></div>' : '');
  }

  function renderAccount(id) {
    var acc = findAccount(id);
    if (!canSee(acc)) { _view = { name: 'home' }; return renderHome(); }
    var events = load().events, pr = prices(), asOf = E.today();
    var s = E.compute(events, id, pr, asOf);
    var rate = E.rateOn(events, asOf);
    var kid = young() && !_parent;

    // Big balance + the three numbers that matter
    var top = '<div class="bk-card bk-hero">' +
      '<div class="bk-hero-name">' + esc(acc.emoji) + ' ' + esc(acc.name) +
        (acc.kind === 'shared' ? ' <span class="bk-pill">👥 ' + acc.members.map(esc).join(' · ') + '</span>' : '') + '</div>' +
      '<div class="bk-hero-bal">' + money(s.value) + '</div>' +
      (s.giving > 0.004 || s.given > 0 ? '<div class="bk-hero-give">+ 💛 ' + money(s.giving) + ' in the Giving jar</div>' : '') +
      (s.spPending ? '<div class="bk-note">Waiting for today\'s market price — S&P 500 money is shown at what went in.</div>' : '') +
      '<div class="bk-tiles">' +
        tile('💵', acc.kind === 'shared' ? 'Saved together' : (kid ? 'You saved' : 'Money saved'), money(s.deposited), '') +
        tile('🎁', 'Papá & Mamá added', money(s.matched), 'match') +
        tile(s.growth >= 0 ? '🌱' : '🌧️', kid ? 'Grew by itself' : 'Growth', signed(s.growth), s.growth >= 0 ? 'up' : 'down') +
        (s.withdrawn > 0 ? tile('🧾', 'Spent', '−' + money(s.withdrawn), 'spent') : '') +
      '</div></div>';

    // Where the money came from
    var srcs = Object.keys(s.bySource).sort(function (a, b) { return s.bySource[b] - s.bySource[a]; });
    var maxSrc = srcs.length ? s.bySource[srcs[0]] : 1;
    var sources = srcs.length ? '<div class="bk-card"><h3>Where your money came from</h3>' +
      srcs.map(function (k) {
        var so = source(k), amt = s.bySource[k];
        return '<div class="bk-src"><span class="bk-src-label">' + so.emoji + ' ' + esc(so.label) + '</span>' +
          '<span class="bk-src-bar"><i style="width:' + Math.max(4, amt / maxSrc * 100).toFixed(1) + '%"></i></span>' +
          '<b>' + money(amt) + '</b></div>';
      }).join('') + '</div>' : '';

    // The mix: two jars
    var total = s.value || 0;
    var bondsShare = total > 0 ? s.bonds / total : s.bondsPct / 100;
    var mixCard = '<div class="bk-card"><h3>How your money is invested</h3>' +
      '<div class="bk-jars">' +
        '<div class="bk-jarbox">' + jar(bondsShare, '#38bdf8', '🛡️') + '<b>Bonds</b><span>' + money(s.bonds) + '</span>' +
          '<small>Steady: about ' + (rate * 100).toFixed(1).replace(/\.0$/, '') + '% a year. Never goes down.</small></div>' +
        '<div class="bk-jarbox">' + jar(1 - bondsShare, '#10b981', '📈') + '<b>S&amp;P 500</b><span>' + money(s.spValue) + '</span>' +
          '<small>The 500 biggest U.S. companies. Grows more over time, but can go down.</small></div>' +
      '</div>' +
      '<div class="bk-mixline">The mix: <b>' + s.bondsPct + '% bonds · ' + (100 - s.bondsPct) + '% S&amp;P 500</b></div>' +
      renderMixControls(acc, s) +
      '</div>';

    var drop = E.dropFromHigh(E.priceTable(pr, events), asOf);
    var dropCard = drop != null && drop >= 5 && s.spValue > 0
      ? '<div class="bk-card bk-calm"><h3>📉 The market is down ' + drop.toFixed(1) + '% this month</h3>' +
        '<p>That\'s normal — the S&amp;P 500 goes down for a while every few years, and it has always come back over time. ' +
        'You only really lose money if you sell when it\'s down. Savers who wait usually end up ahead.</p></div>'
      : '';

    var hist = E.series(events, id, pr, asOf, 40);
    var chartCard = '<div class="bk-card"><h3>Your money over time</h3>' + chart(hist) + '</div>';

    var goal = renderGoal(acc, s, events);
    var wishlist = renderWishlist(acc, events, pr);
    var giving = renderGiving(acc, s, events);
    var tm = renderTimeMachine(acc, s, rate, events);
    var stands = renderStands(acc, events);
    var prices10 = renderTenDollars();
    var stmts = renderStatementList(acc, events, pr);
    var log = renderHistory(acc, events, pr);

    var priceNote = s.price ? '<p class="bk-small">S&amp;P 500 last close: ' + Math.round(s.price).toLocaleString('en-US') +
      (priceMeta().updatedAt ? ' · updated ' + fmtDate(E.iso(new Date(priceMeta().updatedAt))) : '') + '</p>' : '';

    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← All accounts</button>' +
      (_parent ? '<button type="button" class="bk-btn green small" onclick="Banco.go(\'deposit\', \'' + id + '\')">＋ Deposit</button>' +
                 '<button type="button" class="bk-btn small" onclick="Banco.go(\'spend\', \'' + id + '\')">− Spent</button>' +
                 '<button type="button" class="bk-btn small" onclick="Banco.go(\'give\', \'' + id + '\')">💛 Gift</button>' : '') +
      '</div>' + top + dropCard + giving + goal + wishlist + mixCard + chartCard + sources + stands + tm + prices10 + stmts + log + priceNote;
  }

  function tile(icon, label, val, cls) {
    return '<div class="bk-tile ' + cls + '"><span>' + icon + '</span><small>' + esc(label) + '</small><b>' + val + '</b></div>';
  }

  // Mix controls: own account → change directly (once a month); shared
  // → propose, and every member votes. A parent can always set it.
  function renderMixControls(acc, s) {
    var events = load().events, today = E.today();
    var open = openProposal(acc, 'bonds');
    var html = open ? voteBox(acc, open, 'the mix to ' + open.bonds + '% bonds · ' + (100 - open.bonds) + '% S&amp;P 500') : '';

    var gate = E.canChangeMix(events, acc, today);
    if (_chooser && _chooser.account === acc.id) return html + renderChooser(acc, s);
    if (_parent) {
      html += '<button type="button" class="bk-btn small" onclick="Banco.chooseMix(\'' + acc.id + '\')">Set the mix</button>';
    } else if (!gate.ok) {
      html += '<p class="bk-small">You can change the mix again on ' + fmtDate(gate.next) + '. Good investors pick a plan and stick with it! 🧘</p>';
    } else if (!open) {
      html += '<button type="button" class="bk-btn small" onclick="Banco.chooseMix(\'' + acc.id + '\')">' +
        (acc.kind === 'shared' ? '🗳️ Suggest a new mix' : (gate.first ? '✨ Choose your mix' : 'Change my mix')) + '</button>';
    }
    return html;
  }

  function openProposal(acc, kind) {
    if (acc.kind !== 'shared') return null;
    return E.proposals(load().events, acc).filter(function (p) { return p.status === 'open' && p.kind === kind; })[0] || null;
  }
  // A shared account's open proposal, with each member's answer and, for
  // a member who hasn't said yes yet, the buttons to answer.
  function voteBox(acc, p, what) {
    var n = me();
    var voted = p.votes[n.toLowerCase()];
    return '<div class="bk-vote"><b>🗳️ ' + esc(p.by) + ' wants to change ' + what + '.</b>' +
      '<div class="bk-votes">' + acc.members.map(function (m) {
        var v = p.votes[m.toLowerCase()];
        return '<span class="bk-voter ' + (v === true ? 'yes' : v === false ? 'no' : '') + '">' + (v === true ? '✅' : '⏳') + ' ' + esc(m) + '</span>';
      }).join('') + '</div>' +
      (!_parent && E.isMember(acc, n) && voted !== true
        ? '<div class="bk-row"><button type="button" class="bk-btn green small" onclick="Banco.vote(\'' + p.id + '\', true)">👍 I agree</button>' +
          '<button type="button" class="bk-btn small" onclick="Banco.vote(\'' + p.id + '\', false)">👎 No</button></div>'
        : '<small>It changes when everyone agrees. One "no" cancels it.</small>') +
      '</div>';
  }

  // ── monthly statements ──
  var SEEN_KEY = 'zs_bank_stmt_seen';   // this device only: { "kid|account": "YYYY-MM" } = newest one dismissed
  function seenMap() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function markSeen(acc, month) {
    var m = seenMap(), k = me() + '|' + acc.id;
    if ((m[k] || '') >= month) return;
    m[k] = month;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(m)); } catch (e) {}
  }
  function stmtSeen(acc, month) { return (seenMap()[me() + '|' + acc.id] || '') >= month; }

  // The kid-friendly lines of a statement, most important first.
  function stmtStory(st, acc) {
    var shared = acc && acc.kind === 'shared';
    var out = [];
    if (st.growth >= 0.005) out.push(['🌱', 'Your money grew ' + money(st.growth) + ' by itself this month!']);
    else if (st.growth <= -0.005) out.push(['🌧️', 'The market dipped, so your money is down ' + money(-st.growth) + ' this month. That happens — it goes up and down.']);
    if (st.saved > 0) {
      var top = Object.keys(st.bySource).sort(function (a, b) { return st.bySource[b] - st.bySource[a]; })[0];
      out.push(['💵', 'You saved ' + money(st.saved) + (shared ? ' together' : '') + (top ? ', mostly from ' + source(top).label.toLowerCase() : '') + '.']);
    }
    if (st.matched > 0) out.push(['🎁', 'Papá & Mamá added ' + money(st.matched) + '.']);
    if (st.given > 0) out.push(['💛', 'You gave ' + money(st.given) + ' to ' + (Object.keys(st.givenByCause).length > 1 ? 'good causes' : cause(Object.keys(st.givenByCause)[0]).name) + '. Thank you!']);
    else if (st.setAside > 0) out.push(['💛', money(st.setAside) + ' went into the Giving jar.']);
    if (st.spent > 0) out.push(['🧾', 'You spent ' + money(st.spent) + '.']);
    if (!out.length) out.push(['⏳', 'A quiet month. Your money is still here, waiting.']);
    return out;
  }

  function stmtCardLine(st) {
    if (st.growth >= 0.005) return 'Your money grew ' + money(st.growth) + ' by itself!';
    if (st.saved > 0) return 'You saved ' + money(st.saved) + ' this month!';
    return 'See how your money did.';
  }

  // Home page, for a kid: last month's statement until it's been opened
  // or dismissed. Older months stay in each account's archive.
  function statementCards(accs) {
    if (_parent) return '';
    var events = load().events, pr = prices(), today = E.today();
    return accs.map(function (a) {
      var m = E.statementMonths(events, a.id, pr, today)[0];
      if (!m || stmtSeen(a, m)) return '';
      var st = E.statement(events, a.id, pr, m);
      return '<div class="bk-card bk-stmt-card"><span class="bk-stmt-ico" aria-hidden="true">📬</span>' +
        '<div class="bk-stmt-txt"><b>' + esc(a.name) + ': your ' + monthLabel(m).split(' ')[0] + ' statement is here</b><small>' + esc(stmtCardLine(st)) + '</small></div>' +
        '<button type="button" class="bk-btn green small" onclick="Banco.statement(\'' + a.id + '\', \'' + m + '\')">See it</button>' +
        '<button type="button" class="bk-x" aria-label="Dismiss the ' + esc(monthLabel(m)) + ' statement for ' + esc(a.name) + '" onclick="Banco.dismissStatement(\'' + a.id + '\', \'' + m + '\')">✕</button></div>';
    }).join('');
  }

  function renderStatementList(acc, events, pr) {
    var months = E.statementMonths(events, acc.id, pr, E.today());
    if (!months.length) return '';
    return '<div class="bk-card"><h3>📬 Monthly statements</h3><div class="bk-stmt-list">' + months.slice(0, 24).map(function (m, i) {
      var st = E.statement(events, acc.id, pr, m);
      var fresh = !_parent && i === 0 && !stmtSeen(acc, m);
      return '<button type="button" class="bk-stmt-row" onclick="Banco.statement(\'' + acc.id + '\', \'' + m + '\')">' +
        '<span>' + esc(monthLabel(m)) + (fresh ? ' <i class="bk-new">New</i>' : '') + '</span><b>' + money(st.end) + '</b></button>';
    }).join('') + '</div></div>';
  }

  function stmtArt() {
    return '<svg class="bk-stmt-art" viewBox="0 0 96 96" aria-hidden="true">' +
      '<rect x="14" y="8" width="58" height="76" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>' +
      '<g stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"><path d="M24 24h28M24 34h38M24 44h34M24 54h38M24 64h22"/></g>' +
      '<rect x="24" y="16" width="20" height="4" rx="2" fill="#10b981"/>' +
      '<g transform="translate(66 66)"><circle r="20" fill="#10b981" opacity=".15"/><circle r="16" fill="#059669"/><circle r="12.5" fill="none" stroke="#a7f3d0" stroke-width="1.5" stroke-dasharray="2 2.5"/>' +
      '<path d="M-6 0l4.5 5 8.5-10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
  }

  function renderStatement(id, month) {
    var acc = findAccount(id);
    var events = load().events, pr = prices();
    if (!canSee(acc) || E.statementMonths(events, id, pr, E.today()).indexOf(month) < 0) { _view = { name: 'home' }; return renderHome(); }
    if (!_parent) markSeen(acc, month);
    var st = E.statement(events, id, pr, month);
    var shared = acc.kind === 'shared', k = !_parent;
    function row(cls, label, val) { return '<div class="bk-lrow ' + cls + '"><span>' + label + '</span><b>' + val + '</b></div>'; }
    var srcRows = Object.keys(st.bySource).sort(function (a, b) { return st.bySource[b] - st.bySource[a]; }).map(function (kx) {
      var so = source(kx);
      return '<div class="bk-lsub"><span>' + so.emoji + ' ' + esc(so.label) + '</span><span>' + money(st.bySource[kx]) + '</span></div>';
    }).join('');
    var ledger = row('', 'Start of ' + MONTH_NAMES[+month.slice(5) - 1], money(st.start)) +
      (st.saved > 0 ? row('plus', '💵 ' + (k ? (shared ? 'You saved together' : 'You saved') : 'Saved'), '+' + money(st.saved)) + srcRows : '') +
      (st.matched > 0 ? row('plus', '🎁 Papá & Mamá added', '+' + money(st.matched)) : '') +
      (st.growth >= 0.005 ? row('plus', '🌱 Grew by itself', '+' + money(st.growth)) : '') +
      (st.growth <= -0.005 ? row('minus', '🌧️ The market dipped', '−' + money(-st.growth)) : '') +
      (st.given > 0 ? row('minus', '💛 Gave away', '−' + money(st.given)) : '') +
      (st.spent > 0 ? row('minus', '🧾 Spent', '−' + money(st.spent)) : '') +
      row('total', 'End of ' + MONTH_NAMES[+month.slice(5) - 1], money(st.end));

    var months = E.statementMonths(events, id, pr, E.today());
    var i = months.indexOf(month);
    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.open(\'' + id + '\')">← ' + esc(acc.name) + '</button></div>' +
      '<div class="bk-card bk-stmt"><div class="bk-stmt-head">' + stmtArt() +
        '<div><small>Statement</small><h2>' + esc(monthLabel(month)) + '</h2><span>' + esc(acc.emoji + ' ' + acc.name) + '</span></div></div>' +
      (k ? '<ul class="bk-story">' + stmtStory(st, acc).map(function (l) { return '<li><span aria-hidden="true">' + l[0] + '</span><span>' + esc(l[1]) + '</span></li>'; }).join('') + '</ul>' : '') +
      '<div class="bk-ledger">' + ledger + '</div>' +
      '<p class="bk-small">The totals include the Giving jar' + (st.jar > 0.004 ? ' (' + money(st.jar) + ' at the end of the month)' : '') +
        (st.setAside > 0 ? '. ' + money(st.setAside) + ' was set aside for giving this month' : '') + '.</p>' +
      '<div class="bk-row bk-stmt-nav">' +
        (i < months.length - 1 ? '<button type="button" class="bk-btn small" onclick="Banco.statement(\'' + id + '\', \'' + months[i + 1] + '\')">← ' + esc(monthLabel(months[i + 1]).split(' ')[0]) + '</button>' : '') +
        (i > 0 ? '<button type="button" class="bk-btn small" onclick="Banco.statement(\'' + id + '\', \'' + months[i - 1] + '\')">' + esc(monthLabel(months[i - 1]).split(' ')[0]) + ' →</button>' : '') +
      '</div></div>';
  }
  function statement(id, month) {
    _chooser = null; _giveEdit = null; _view = { name: 'statement', id: id, month: month };
    render(); window.scrollTo(0, 0);
  }
  function dismissStatement(id, month) {
    var acc = findAccount(id);
    if (!acc) return;
    markSeen(acc, month);
    render();
  }

  // ── wishlist ──
  var WISH_EMOJI = ['🎁', '🧸', '🎮', '🚲', '📚', '⚽', '🎨', '🎧', '🛹', '👟', '🧩', '⭐'];
  var _wish = null;     // draft of the item being added: { account, name, price, emoji, photo }
  function photoOk(p) { return typeof p === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]{20,80000}$/.test(p); }
  function wishThumb(w) {
    return photoOk(w.photo) ? '<img class="bk-wish-img" src="' + w.photo + '" alt="">'
      : '<span class="bk-wish-emoji" aria-hidden="true">' + esc(w.emoji || '🎁') + '</span>';
  }
  function wishCostLines(c, who) {
    var out = [];
    if (c.share != null) out.push('That\'s ' + c.share + '% of ' + who + ' savings.');
    else out.push('More than ' + who + ' savings right now — ' + money(c.short) + ' to go.');
    if (c.stands) out.push('About ' + c.stands + (c.lemonade ? ' lemonade stand' : ' deposit') + (c.stands === 1 ? '' : 's') + ' like ' + (who === 'your' ? 'your' : 'the') + ' usual (' + money(c.avgDeposit) + ').');
    if (c.months) out.push('At that pace, about ' + c.months + ' month' + (c.months === 1 ? '' : 's') + ' of saving.');
    return out;
  }
  function wishPips(w) {
    var done = E.WISH_DAYS - w.daysLeft, h = '';
    for (var i = 0; i < E.WISH_DAYS; i++) h += '<i class="' + (i < done ? 'on' : '') + '"></i>';
    return '<span class="bk-pips" aria-hidden="true">' + h + '</span>';
  }

  function wishItem(w, acc, events, pr, member) {
    var who = member ? 'your' : acc.name + '\'s';
    var body = '';
    if (w.status === 'waiting') {
      body = '<div class="bk-wish-wait">' + wishPips(w) + '<b>' + w.daysLeft + ' more day' + (w.daysLeft === 1 ? '' : 's') + ' to think 🤔</b></div>';
    } else if (w.status === 'ready') {
      body = member
        ? '<div class="bk-wish-ask"><b>Do you still want it?</b><div class="bk-row">' +
          '<button type="button" class="bk-btn green small" onclick="Banco.wishDecide(\'' + acc.id + '\', \'' + w.id + '\', true)">Still want it</button>' +
          '<button type="button" class="bk-btn small" onclick="Banco.wishDecide(\'' + acc.id + '\', \'' + w.id + '\', false)">Changed my mind</button></div></div>'
        : '<div class="bk-wish-wait"><b>Waiting for ' + esc(acc.name) + ' to decide</b></div>';
    } else if (w.status === 'keep') {
      body = '<div class="bk-wish-keep">⭐ ' + (member ? 'You still want it. Talk about it with Mom or Dad!' : 'Still wants it — ready to talk about.') + '</div>' +
        (_parent ? '<button type="button" class="bk-btn green small" onclick="Banco.buyWish(\'' + acc.id + '\', \'' + w.id + '\')">Bought it</button>' : '');
    } else if (w.status === 'drop') {
      body = '<div class="bk-wish-drop">🎉 ' + (member ? 'You saved ' : 'Saved ') + money(w.price) + ' by thinking it over!</div>';
    } else if (w.status === 'bought') {
      body = '<div class="bk-wish-keep">🎁 Got it on ' + esc(fmtDate(w.boughtOn)) + '.</div>';
    }
    var cost = (w.status === 'waiting' || w.status === 'ready' || w.status === 'keep')
      ? '<ul class="bk-wish-cost">' + wishCostLines(E.wishCost(events, acc.id, w.price, pr, E.today()), who).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '';
    var rm = member && (w.status === 'waiting' || w.status === 'ready')
      ? '<button type="button" class="bk-link" aria-label="Take ' + esc(w.name) + ' off my wishlist" onclick="Banco.wishRemove(\'' + acc.id + '\', \'' + w.id + '\')">Remove</button>' : '';
    return '<div class="bk-wish bk-ws-' + w.status + '">' + wishThumb(w) +
      '<div class="bk-wish-main"><div class="bk-wish-top"><b>' + esc(w.name) + '</b><span>' + money(w.price) + '</span></div>' + body + cost + rm + '</div></div>';
  }

  function wishForm() {
    var d = _wish;
    return '<div class="bk-wish-form">' +
      '<label for="bk-w-name">What do you want?</label><input id="bk-w-name" type="text" maxlength="40" value="' + esc(d.name) + '" placeholder="e.g. Lego set">' +
      '<label for="bk-w-price">How much is it? (USD)</label><input id="bk-w-price" type="number" inputmode="decimal" min="0.01" step="0.01" value="' + esc(d.price) + '" placeholder="0.00">' +
      '<fieldset class="bk-sources"><legend>Pick a picture</legend>' + WISH_EMOJI.map(function (em) {
        return '<button type="button" class="bk-emo' + (em === d.emoji && !d.photo ? ' on' : '') + '" aria-pressed="' + (em === d.emoji && !d.photo) + '" aria-label="Picture ' + em + '" onclick="Banco.wishEmoji(\'' + em + '\')">' + em + '</button>';
      }).join('') + '</fieldset>' +
      '<label for="bk-w-photo">Or a photo (optional)</label><input id="bk-w-photo" type="file" accept="image/*" onchange="Banco.wishPhoto(this)">' +
      (photoOk(d.photo) ? '<div class="bk-wish-prev"><img class="bk-wish-img" src="' + d.photo + '" alt="Your photo"><button type="button" class="bk-link" onclick="Banco.wishEmoji(null)">Use a picture instead</button></div>' : '') +
      '<div class="bk-row"><button type="button" class="bk-btn small" onclick="Banco.wishCancel()">Cancel</button>' +
      '<button type="button" class="bk-btn green small" onclick="Banco.wishSave()">Add to my wishlist</button></div>' +
      '<p class="bk-small">You\'ll get to decide in ' + E.WISH_DAYS + ' days. Only a parent can buy it.</p></div>';
  }

  function renderWishlist(acc, events, pr) {
    if (acc.kind !== 'own') return '';
    var member = !_parent && E.isMember(acc, me());
    if (!member && !_parent) return '';
    var list = E.wishes(events, acc.id, E.today()).filter(function (w) { return w.status !== 'removed'; }).reverse();
    if (!list.length && !member) return '';
    var saved = list.filter(function (w) { return w.status === 'drop'; }).reduce(function (t, w) { return t + w.price; }, 0);
    var adding = member && _wish && _wish.account === acc.id;
    return '<div class="bk-card bk-wishlist"><h3>⭐ ' + (member ? 'My wishlist' : esc(acc.name) + '\'s wishlist') + '</h3>' +
      (saved > 0 ? '<div class="bk-wish-saved">🎉 ' + (member ? 'You\'ve saved ' : 'Saved ') + money(saved) + ' by thinking it over!</div>' : '') +
      (list.length ? list.slice(0, 20).map(function (w) { return wishItem(w, acc, events, pr, member); }).join('')
        : '<p class="bk-small">Things you want go here. Wait ' + E.WISH_DAYS + ' days, then decide if you still want it.</p>') +
      (adding ? wishForm() : (member ? '<div class="bk-row"><button type="button" class="bk-btn small" onclick="Banco.wishAdd(\'' + acc.id + '\')">＋ Add something I want</button></div>' : '')) +
      '</div>';
  }

  // The bank manager's list: items a kid still wants after the wait.
  function wishInbox(accs) {
    if (!_parent) return '';
    var events = load().events, pr = prices(), rows = '';
    accs.forEach(function (a) {
      if (a.kind !== 'own') return;
      E.wishes(events, a.id, E.today()).filter(function (w) { return w.status === 'keep'; }).forEach(function (w) {
        var c = E.wishCost(events, a.id, w.price, pr, E.today());
        rows += '<div class="bk-wish-row">' + wishThumb(w) + '<span class="bk-wish-row-t"><b>' + esc(w.name) + '</b> · ' + esc(a.name) + '<br><small>' +
          (c.share != null ? c.share + '% of their savings' : 'more than they have saved (' + money(c.short) + ' to go)') + '</small></span>' +
          '<span><b>' + money(w.price) + '</b></span>' +
          '<button type="button" class="bk-btn green small" onclick="Banco.buyWish(\'' + a.id + '\', \'' + w.id + '\')">Bought it</button></div>';
      });
    });
    return rows ? '<div class="bk-card bk-wishinbox"><h3>⭐ Still wanted after the wait</h3>' + rows + '</div>' : '';
  }

  function syncWishDraft() {
    if (!_wish) return;
    var n = document.getElementById('bk-w-name'), p = document.getElementById('bk-w-price');
    if (n) _wish.name = n.value;
    if (p) _wish.price = p.value;
  }
  function wishAdd(id) {
    var acc = findAccount(id);
    if (!acc || _parent || !E.isMember(acc, me())) return;
    _wish = { account: id, name: '', price: '', emoji: '🎁', photo: '' };
    render();
    var n = document.getElementById('bk-w-name'); if (n) n.focus();
  }
  function wishCancel() { _wish = null; render(); }
  function wishEmoji(em) {
    syncWishDraft();
    if (!_wish) return;
    if (em) _wish.emoji = em;
    _wish.photo = '';
    render();
  }
  // Shrink a photo to a small JPEG so the event log stays light.
  function wishPhoto(input) {
    var f = input.files && input.files[0];
    if (!f || !_wish) return;
    syncWishDraft();
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var k = Math.min(1, 160 / Math.max(img.width, img.height, 1));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      var ctx = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(c) : c.getContext('2d');
      if (ctx && _wish) {
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var data = c.toDataURL('image/jpeg', 0.6);
        if (photoOk(data)) _wish.photo = data; else ZsDialog.toast('That photo is too big. Pick a picture instead.');
      }
      if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(c);
      URL.revokeObjectURL(url);
      render();
    };
    img.onerror = function () { URL.revokeObjectURL(url); ZsDialog.toast('Could not read that photo.'); };
    img.src = url;
  }
  function wishSave() {
    syncWishDraft();
    var acc = _wish && findAccount(_wish.account);
    if (!acc || _parent || !E.isMember(acc, me())) return;
    var name = _wish.name.trim().slice(0, 40), price = Math.round(parseFloat(_wish.price) * 100) / 100;
    if (!name) { ZsDialog.toast('What do you want?'); return; }
    if (!(price > 0) || price > 100000) { ZsDialog.toast('Type how much it costs.'); return; }
    var f = { account: acc.id, name: name, price: price, emoji: _wish.emoji || '🎁' };
    if (photoOk(_wish.photo)) f.photo = _wish.photo;
    add(ev('wish', f));
    _wish = null;
    ZsDialog.toast('Added! Come back in ' + E.WISH_DAYS + ' days to decide. 🤔');
    render();
  }
  function wishRemove(accId, id) {
    var acc = findAccount(accId);
    if (!acc || _parent || !E.isMember(acc, me())) return;
    add(ev('wishEdit', { wish: id, removed: true }));
    render();
  }
  function wishDecide(accId, id, keep) {
    var acc = findAccount(accId);
    if (!acc || _parent || !E.isMember(acc, me())) return;
    var events = load().events;
    var w = E.wishes(events, accId, E.today()).filter(function (x) { return x.id === id; })[0];
    if (!w || w.status !== 'ready') {
      ZsDialog.toast(w && w.status === 'waiting' ? w.daysLeft + ' more day' + (w.daysLeft === 1 ? '' : 's') + ' to think. 🤔' : 'That one is already decided.');
      render(); return;
    }
    var had = E.badges(events, me(), prices()).filter(function (b) { return b.id === 'waited'; })[0].earned;
    add(ev('wishDecision', { account: accId, wish: id, decision: keep ? 'keep' : 'drop' }));
    ZsDialog.toast(keep ? 'It\'s on the list. Talk about it with Mom or Dad! ⭐'
      : '🎉 You saved ' + money(w.price) + '!' + (had ? '' : ' New badge: Think it over!'));
    render();
  }
  // A parent records the purchase: the usual "Money spent" form, filled in.
  function buyWish(accId, id) {
    if (!_parent) return;
    _chooser = null; _giveEdit = null; _view = { name: 'spend', id: accId, wish: id };
    render(); window.scrollTo(0, 0);
  }

  // ── lemonade-stand profit (ages 9+) ──
  function renderStands(acc, events) {
    var u = user();
    if (!_parent && !(u && u.age >= 9)) return '';
    var st = E.standStats(events, acc.id, E.today());
    if (!st.count) return '';
    var k = !_parent;
    return '<div class="bk-card bk-stands"><h3>🍋 ' + (k ? 'Your stands' : 'Stands') + '</h3>' +
      '<div class="bk-tiles">' +
        tile('🛍️', 'Sales', money(st.sales), '') + tile('🧾', 'Costs', '−' + money(st.costs), 'spent') +
        tile('💵', 'Profit', money(st.profit), st.profit >= 0 ? 'up' : 'down') +
        (st.perHour != null ? tile('⏱️', 'Profit per hour', money(st.perHour), '') : '') +
      '</div>' +
      '<div class="bk-hist">' + st.items.slice(0, 5).map(function (x) {
        return '<div class="bk-hrow"><span class="bk-hdate">' + fmtDate(x.date) + '</span>' +
          '<span class="bk-hline">' + money(x.sales) + ' sales − ' + money(x.costs) + ' costs' + (x.hours ? ' · ' + x.hours + ' h' : '') + (x.note ? ' <small>' + esc(x.note) + '</small>' : '') + '</span>' +
          '<span class="bk-hamt"><b class="up">' + money(x.profit) + '</b></span></div>';
      }).join('') + '</div>' +
      '<p class="bk-small">Only the profit goes into your savings. The costs are just for keeping track.</p>' +
      '<a class="bk-link" href="mi-negocio.html">📘 Learn how profit works in Mi Negocio →</a></div>';
  }

  // ── "What did $10 buy?" ──
  function stampTiles(n) {
    var cols = 22, w = 11, h = 13, rows = Math.ceil(n / cols), out = '';
    for (var i = 0; i < n; i++) {
      var x = (i % cols) * w, y = Math.floor(i / cols) * h;
      out += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="9" height="11" rx="1.5" fill="#fef3c7" stroke="#d97706" stroke-width=".8" stroke-dasharray="1.4 1"/>' +
        '<rect x="' + (x + 3) + '" y="' + (y + 3) + '" width="5" height="7" rx=".8" fill="#34d399"/>';
    }
    return '<svg class="bk-tiles10" viewBox="0 0 ' + (cols * w) + ' ' + (rows * h) + '" role="img" aria-label="' + n + ' stamps">' + out + '</svg>';
  }
  function renderTenDollars() {
    if (typeof BancoPrices === 'undefined') return '';
    return BancoPrices.POINTS.map(function (pt) {
      var rows = pt.rows.map(function (r) {
        var n = BancoPrices.countFor(r.cents);
        return '<div class="bk-p10"><div class="bk-p10-head"><b>' + r.year + '</b><span>' + n + ' ' + (n === 1 ? 'stamp' : 'stamps') + ' · ' + r.cents + '¢ each</span></div>' + stampTiles(n) + '</div>';
      }).join('');
      return '<div class="bk-card bk-prices"><h3>💵 What did $10 buy?</h3>' +
        '<p class="bk-small" style="margin:0 0 10px">How many ' + esc(pt.plural) + ' $10 could buy in different years.</p>' + rows +
        '<p class="bk-small">Prices change slowly over many years, so the same $10 buys a little less later. That\'s one reason savers let their money grow instead of only keeping it in a jar. Growth isn\'t guaranteed, but it gives your money a chance to buy more later.</p>' +
        '<p class="bk-small bk-source">Source: ' + esc(pt.source) + '</p></div>';
    }).join('');
  }

  // ── giving ──
  function cause(id) {
    return E.causes(load().events).filter(function (c) { return c.id === id; })[0] || { id: id, emoji: '💛', name: 'A good cause' };
  }
  function isSunday(d) { var p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).getDay() === 0; }

  // The Sunday reminder on the home page: what's ready to give, per account.
  function givingDay(accs) {
    var events = load().events, pr = prices(), today = E.today();
    var ready = accs.map(function (a) { return { a: a, s: E.compute(events, a.id, pr, today) }; })
      .filter(function (x) { return x.s.giving > 0.004; });
    if (!ready.length || (!_parent && !isSunday(today))) return '';
    return '<div class="bk-card bk-giveday">' +
      '<h3>' + (isSunday(today) ? '💛 It\'s giving day!' : '💛 Ready to give') + '</h3>' +
      (_parent ? '' : '<p>Bring your giving envelope to Mass today.</p>') +
      ready.map(function (x) {
        var to = E.giveToOf(events, x.a);
        return '<div class="bk-give-row"><span>' + esc(x.a.emoji + ' ' + x.a.name) + '</span>' +
          '<span><b>' + money(x.s.giving) + '</b> → ' + (to ? esc(to.emoji + ' ' + to.name) : '') + '</span>' +
          (_parent ? '<button type="button" class="bk-btn green small" onclick="Banco.go(\'give\', \'' + x.a.id + '\')">Given ✓</button>' : '') +
        '</div>';
      }).join('') + '</div>';
  }

  function renderGiving(acc, s, events) {
    var pct = E.givePctOf(events, acc), min = E.giveMinOn(events);
    var to = E.giveToOf(events, acc);
    var member = !_parent && E.isMember(acc, me());
    var openPct = openProposal(acc, 'givePct'), openCause = openProposal(acc, 'cause');
    var byCause = Object.keys(s.givenByCause).sort(function (a, b) { return s.givenByCause[b] - s.givenByCause[a]; });
    var live = E.causes(events).filter(function (c) { return !c.removed; });
    var shared = acc.kind === 'shared';

    var pctCtl = '';
    if (_giveEdit === acc.id + ':pct') {
      var opts = [];
      for (var v = min; v <= Math.max(min, 50); v += 5) opts.push(v);
      if (opts.indexOf(pct) === -1) opts.push(pct);
      pctCtl = '<div class="bk-give-pick">' + opts.sort(function (a, b) { return a - b; }).map(function (v) {
        return '<button type="button" class="bk-preset' + (v === pct ? ' on' : '') + '" aria-pressed="' + (v === pct) + '" onclick="Banco.setGivePct(\'' + acc.id + '\', ' + v + ')"><b>' + v + '%</b></button>';
      }).join('') + '</div>';
    } else if ((member || _parent) && !openPct) {
      pctCtl = '<button type="button" class="bk-link" onclick="Banco.editGive(\'' + acc.id + ':pct\')">' +
        (shared && !_parent ? '🗳️ Suggest giving more' : 'Give more') + '</button>';
    }
    var causeCtl = '';
    if (_giveEdit === acc.id + ':cause') {
      causeCtl = '<div class="bk-give-pick">' + live.map(function (c) {
        var on = to && c.id === to.id;
        return '<button type="button" class="bk-preset' + (on ? ' on' : '') + '" aria-pressed="' + !!on + '" onclick="Banco.setGiveTo(\'' + acc.id + '\', \'' + c.id + '\')"><span>' + esc(c.emoji) + '</span><b>' + esc(c.name) + '</b></button>';
      }).join('') + '</div>';
    } else if ((member || _parent) && !openCause) {
      causeCtl = '<button type="button" class="bk-link" onclick="Banco.editGive(\'' + acc.id + ':cause\')">' +
        (shared && !_parent ? '🗳️ Suggest another place' : 'Choose where') + '</button>';
    }

    return '<div class="bk-card bk-giving">' +
      '<div class="bk-giving-top">' + jar(s.giving > 0.004 ? 0.25 + 0.6 * Math.min(1, s.giving / 50) : 0, '#f472b6', '💛') +
        '<div><h3>Giving jar</h3><div class="bk-giving-amt">' + money(s.giving) + '</div>' +
        '<small>' + pct + '% of every deposit goes here' + (pct > min ? ' — more than the ' + min + '% minimum. How kind! 🌟' : '.') + '</small></div></div>' +
      (openPct ? voteBox(acc, openPct, 'giving to ' + openPct.givePct + '% of every deposit') : '') + pctCtl +
      '<div class="bk-give-to"><span>Next gift goes to</span><b>' + (to ? esc(to.emoji + ' ' + to.name) : '—') + '</b></div>' +
      (openCause ? voteBox(acc, openCause, 'where gifts go, to ' + esc(cause(openCause.cause).emoji + ' ' + cause(openCause.cause).name)) : '') + causeCtl +
      (s.given > 0 ? '<div class="bk-given"><b>💛 Given so far: ' + money(s.given) + '</b>' +
        byCause.map(function (k) { var c = cause(k); return '<span>' + esc(c.emoji + ' ' + c.name) + ': ' + money(s.givenByCause[k]) + '</span>'; }).join('') + '</div>' : '') +
      (!_parent && isSunday(E.today()) && s.giving > 0.004 ? '<p class="bk-small">It\'s Sunday — bring ' + money(s.giving) + ' to Mass today! 🙏</p>' : '') +
      '</div>';
  }

  var _giveEdit = null;
  function editGive(key) { _giveEdit = _giveEdit === key ? null : key; render(); }
  function setGivePct(id, v) {
    var acc = findAccount(id);
    if (!acc || !(_parent || E.isMember(acc, me()))) return;
    var events = load().events;
    v = Math.max(E.giveMinOn(events), Math.min(100, Math.round(v)));
    _giveEdit = null;
    if (v === E.givePctOf(events, acc)) { render(); return; }
    if (acc.kind === 'shared' && !_parent) {
      add(ev('proposal', { account: id, givePct: v }));
      ZsDialog.toast('Asked the others. It changes when everyone agrees.');
    } else {
      add(ev('givePct', { account: id, pct: v }));
      ZsDialog.toast(v + '% of every deposit will go to giving. 💛');
    }
    render();
  }
  function setGiveTo(id, causeId) {
    var acc = findAccount(id);
    if (!acc || !(_parent || E.isMember(acc, me()))) return;
    _giveEdit = null;
    var cur = E.giveToOf(load().events, acc);
    if (cur && cur.id === causeId) { render(); return; }
    if (acc.kind === 'shared' && !_parent) {
      add(ev('proposal', { account: id, cause: causeId }));
      ZsDialog.toast('Asked the others. It changes when everyone agrees.');
    } else {
      add(ev('giveTo', { account: id, cause: causeId }));
      ZsDialog.toast('Your next gift goes to ' + cause(causeId).name + '. 💛');
    }
    render();
  }

  function renderGiveForm() {
    if (!_parent) { _view = { name: 'home' }; return renderHome(); }
    var events = load().events, pr = prices();
    var accs = E.accounts(events).filter(function (a) { return !a.archived; });
    var acc = accs.filter(function (a) { return a.id === _view.id; })[0] ||
      accs.filter(function (a) { return E.compute(events, a.id, pr).giving > 0.004; })[0] || accs[0];
    if (!acc) return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div><div class="bk-empty">Open an account first.</div>';
    var s = E.compute(events, acc.id, pr);
    var to = E.giveToOf(events, acc);
    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div>' +
      '<div class="bk-card bk-form"><h2>💛 Record a gift</h2>' +
      '<label for="bk-g-acc">From</label><select id="bk-g-acc" onchange="Banco.go(\'give\', this.value)">' + accountOptions(acc.id) + '</select>' +
      '<p class="bk-small">In the Giving jar: <b>' + money(s.giving) + '</b></p>' +
      '<label for="bk-g-amt">Amount given (USD)</label><input id="bk-g-amt" type="number" inputmode="decimal" min="0.01" step="0.01" value="' + (s.giving > 0 ? s.giving.toFixed(2) : '') + '">' +
      '<fieldset class="bk-sources"><legend>Given to</legend>' + E.causes(events).filter(function (c) { return !c.removed; }).map(function (c) {
        return '<label class="bk-chip"><input type="radio" name="bk-g-cause" value="' + c.id + '"' + (to && c.id === to.id ? ' checked' : '') + '><span>' + esc(c.emoji + ' ' + c.name) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<label for="bk-g-note">Note (optional)</label><input id="bk-g-note" type="text" maxlength="80" placeholder="e.g. Sunday Mass collection">' +
      '<label for="bk-g-date">Date</label><input id="bk-g-date" type="date" value="' + E.today() + '" max="' + E.today() + '">' +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.go(\'home\')">Cancel</button>' +
      '<button type="button" class="bk-btn green" onclick="Banco.saveGive()">Record gift</button></div></div>';
  }
  function saveGive() {
    if (!_parent) return;
    var id = document.getElementById('bk-g-acc').value;
    var amt = Math.round(parseFloat(document.getElementById('bk-g-amt').value) * 100) / 100;
    var c = document.querySelector('input[name="bk-g-cause"]:checked');
    var date = document.getElementById('bk-g-date').value;
    if (!findAccount(id)) return;
    if (!E.isDate(date) || date > E.today()) date = E.today();
    var s = E.compute(load().events, id, prices(), date);
    if (!(amt > 0)) { ZsDialog.toast('Type an amount.'); return; }
    if (amt > s.giving + 0.005) { ZsDialog.toast('The Giving jar has ' + money(s.giving) + '.'); return; }
    if (!c) { ZsDialog.toast('Pick where it was given.'); return; }
    add(ev('give', { account: id, amount: amt, cause: c.value, note: document.getElementById('bk-g-note').value.trim().slice(0, 80), date: date }));
    ZsDialog.toast('💛 ' + money(amt) + ' given to ' + cause(c.value).name + '. Thank you!');
    _view = { name: 'account', id: id };
    render();
  }

  var PRESETS = [
    { id: 'safe', bonds: 100, emoji: '🐢', name: 'Safe', note: 'All bonds. Grows slowly, never goes down.' },
    { id: 'balanced', bonds: 50, emoji: '🦊', name: 'Balanced', note: 'Half and half.' },
    { id: 'bold', bonds: 20, emoji: '🚀', name: 'Bold', note: 'Mostly S&P 500. Bigger ups and downs.' }
  ];

  function renderChooser(acc, s) {
    var b = _chooser.bonds;
    var rate = E.rateOn(load().events);
    var good = E.yearFor(b, E.SP_YEARS[2013], rate), bad = E.yearFor(b, E.SP_YEARS[2008], rate);
    var amount = Math.max(100, Math.round(s.value || 100));
    var ctrl = (young() && !_parent)
      ? '<div class="bk-presets">' + PRESETS.map(function (p) {
          return '<button type="button" class="bk-preset' + (p.bonds === b ? ' on' : '') + '" aria-pressed="' + (p.bonds === b) + '" onclick="Banco.pickMix(' + p.bonds + ')">' +
            '<span>' + p.emoji + '</span><b>' + p.name + '</b><small>' + p.note + '</small></button>';
        }).join('') + '</div>'
      : '<label class="bk-range-label" for="bk-mix-range">🛡️ Bonds <b id="bk-mix-b">' + b + '%</b> · 📈 S&amp;P 500 <b id="bk-mix-s">' + (100 - b) + '%</b></label>' +
        '<input type="range" id="bk-mix-range" min="0" max="100" step="10" value="' + b + '">';
    return '<div class="bk-chooser">' + ctrl +
      '<div class="bk-whatif" id="bk-whatif">' + whatIf(b, good, bad, amount) + '</div>' +
      '<div class="bk-row"><button type="button" class="bk-btn small" onclick="Banco.chooseMix(null)">Cancel</button>' +
      '<button type="button" class="bk-btn green small" onclick="Banco.saveMix(\'' + acc.id + '\')">' +
        (acc.kind === 'shared' && !_parent ? '🗳️ Ask the others' : 'Save my mix') + '</button></div>' +
      '<p class="bk-small">' + (_parent ? 'A parent can set the mix any time.' : 'You can change it once a month.') + ' The whole balance moves to the new mix.</p></div>';
  }
  function whatIf(b, good, bad, amount) {
    var g = amount * good / 100, d = amount * bad / 100;
    return '<div class="bk-wi up"><small>In a great year (like 2013)</small><b>' + signed(g) + '</b><span>on ' + money(amount, false) + '</span></div>' +
      '<div class="bk-wi ' + (d < 0 ? 'down' : 'up') + '"><small>In a bad year (like 2008)</small><b>' + signed(d) + '</b><span>on ' + money(amount, false) + '</span></div>';
  }

  function renderGoal(acc, s, events) {
    var g = null;
    E.sortEvents(events).forEach(function (e) { if (e.type === 'goal' && e.account === acc.id) g = Number(e.amount) > 0 ? e : null; });
    var canEdit = _parent || E.isMember(acc, me());
    if (!g) {
      return canEdit ? '<div class="bk-card bk-goal-empty"><span>🎯</span><div><b>Saving for something?</b><small>Set a goal and watch it fill up.</small></div>' +
        '<button type="button" class="bk-btn small" onclick="Banco.setGoal(\'' + acc.id + '\')">Set a goal</button></div>' : '';
    }
    var pct = Math.min(100, s.value / Number(g.amount) * 100);
    return '<div class="bk-card bk-goal"><div class="bk-goal-head"><b>🎯 ' + esc(g.name) + '</b><span>' + money(s.value, false) + ' of ' + money(g.amount, false) + '</span></div>' +
      '<div class="bk-goal-bar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
      (pct >= 100 ? '<p class="bk-small">🎉 You reached your goal! Talk with Mom or Dad about what\'s next.</p>' : '') +
      (canEdit ? '<button type="button" class="bk-link" onclick="Banco.setGoal(\'' + acc.id + '\')">Change goal</button>' : '') + '</div>';
  }

  function renderTimeMachine(acc, s, rate, events) {
    var u = user();
    var years = 10, to18 = false;
    if (acc.kind === 'own') {
      var p = profiles().filter(function (x) { return E.isMember(acc, x.name); })[0];
      var age = p && p.age ? p.age : (u && u.age);
      if (age && 18 - age >= 3) { years = 18 - age; to18 = p ? p.name : true; }
    }
    return '<div class="bk-card bk-tm" data-years="' + years + '" data-now="' + s.value.toFixed(2) + '" data-bonds="' + s.bondsPct + '" ' +
      'data-rate="' + rate + '" data-match="' + E.matchPctOn(events) + '" data-to18="' + (to18 ? esc(to18 === true ? '' : to18) : '-') + '">' +
      '<h3>⏳ Time machine</h3>' +
      '<label for="bk-tm-month">If ' + (acc.kind === 'shared' ? 'you all' : 'you') + ' save <b id="bk-tm-amt">$10</b> a month…</label>' +
      '<input type="range" id="bk-tm-month" min="0" max="100" step="5" value="10">' +
      '<div class="bk-tm-out" id="bk-tm-out">' + tmText(s.value, 10, years, s.bondsPct, rate, E.matchPctOn(events), to18 ? (to18 === true ? '' : to18) : null) + '</div>' +
      '<p class="bk-small">A guess, not a promise: bonds at today\'s rate and the S&amp;P 500 at about 7% a year, its long-run average after rising prices.</p></div>';
  }
  // to18: null = "in N years"; '' = "when you're 18"; a name = "when Pablo is 18" (parent view)
  function tmText(now, perMonth, years, bonds, rate, match, to18) {
    var pj = E.project(now, perMonth, years, bonds, rate, match);
    var who = to18 == null ? 'in ' + years + ' years'
      : (!_parent ? 'when you\'re 18' : 'when ' + esc(to18) + ' is 18') + ' (' + years + ' years)';
    return '<b>' + money(pj.value, false) + '</b> ' + who + '<small>' + money(pj.putIn, false) + ' put in · ' +
      money(Math.max(0, pj.value - pj.putIn), false) + ' grown</small>';
  }
  function timeMachine() {
    var box = document.querySelector('.bk-tm'), r = document.getElementById('bk-tm-month');
    if (!box || !r) return;
    var t = box.dataset.to18;
    document.getElementById('bk-tm-amt').textContent = money(r.value, false);
    document.getElementById('bk-tm-out').innerHTML = tmText(Number(box.dataset.now), Number(r.value), Number(box.dataset.years),
      Number(box.dataset.bonds), Number(box.dataset.rate), Number(box.dataset.match), t === '-' ? null : t);
  }

  function renderHistory(acc, events, pr) {
    var gone = {};
    events.forEach(function (e) { if (e.type === 'void') gone[e.target] = true; });
    var rows = E.sortEvents(events).filter(function (e) {
      return (e.account === acc.id && /^(deposit|withdraw|mix|proposal|give|givePct|giveTo)$/.test(e.type)) ||
        (e.type === 'vote' && acc.kind === 'shared' && E.proposals(events, acc).some(function (p) { return p.id === e.proposal; }));
    }).reverse().slice(0, 60).map(function (e) {
      var g = gone[e.id], line = '', amt = '';
      if (e.type === 'deposit') {
        var so = source(e.source);
        line = so.emoji + ' ' + esc(so.label) + (e.note ? ' — ' + esc(e.note) : '') +
          (e.stand ? ' <small>· sales ' + money(e.stand.sales) + ' − costs ' + money(e.stand.costs) + '</small>' : '') + (e.group ? ' <small>· payday split</small>' : '');
        amt = '<b class="up">+' + money(e.amount) + '</b>' + (Number(e.match) > 0 ? '<small>🎁 +' + money(e.match) + ' match</small>' : '') +
          (Number(e.give) > 0 ? '<small class="bk-give-mini">💛 ' + money(e.give) + ' to giving</small>' : '');
      } else if (e.type === 'give') {
        var gc = cause(e.cause);
        line = '💛 Gave to ' + esc(gc.emoji + ' ' + gc.name) + (e.note ? ' — ' + esc(e.note) : '');
        amt = '<b class="bk-give-amt">' + money(e.amount) + '</b>';
      } else if (e.type === 'givePct') {
        line = '💛 Giving set to ' + e.pct + '% of every deposit' + (e.by && e.by !== 'parent' ? ' by ' + esc(e.by) : '');
      } else if (e.type === 'giveTo') {
        line = '💛 Gifts now go to ' + esc(cause(e.cause).name) + (e.by && e.by !== 'parent' ? ' (' + esc(e.by) + '\'s pick)' : '');
      } else if (e.type === 'withdraw') {
        line = '🧾 Spent' + (e.note ? ': ' + esc(e.note) : '');
        amt = '<b class="down">−' + money(e.amount) + '</b>';
      } else if (e.type === 'mix') {
        line = '🎛️ Mix set to ' + e.bonds + '% bonds · ' + (100 - e.bonds) + '% S&amp;P 500' + (e.by && e.by !== 'parent' ? ' by ' + esc(e.by) : '');
      } else if (e.type === 'proposal') {
        line = '🗳️ ' + esc(e.by) + ' suggested ' + (e.givePct != null ? 'giving ' + e.givePct + '%' : e.cause != null ? 'giving to ' + esc(cause(e.cause).name) : e.bonds + '% bonds');
      } else if (e.type === 'vote') {
        line = (e.yes ? '👍 ' : '👎 ') + esc(e.by) + (e.yes ? ' agreed' : ' said no');
      }
      var undo = _parent && !g && (e.type === 'deposit' || e.type === 'withdraw' || e.type === 'give')
        ? '<button type="button" class="bk-link" onclick="Banco.undo(\'' + e.id + '\')" aria-label="Cancel this entry">Undo</button>' : '';
      return '<div class="bk-hrow' + (g ? ' void' : '') + '"><span class="bk-hdate">' + fmtDate(e.date) + '</span>' +
        '<span class="bk-hline">' + line + (g ? ' <em>(cancelled)</em>' : '') + '</span><span class="bk-hamt">' + amt + undo + '</span></div>';
    }).join('');
    return rows ? '<div class="bk-card"><h3>History</h3><div class="bk-hist">' + rows + '</div></div>' : '';
  }

  // ── parent forms ──
  function accountOptions(selected) {
    return E.accounts(load().events).filter(function (a) { return !a.archived; }).map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === selected ? ' selected' : '') + '>' + esc(a.emoji + ' ' + a.name) + '</option>';
    }).join('');
  }
  function renderMoneyForm(kind) {
    if (!_parent) { _view = { name: 'home' }; return renderHome(); }
    var dep = kind === 'deposit';
    var accs = accountOptions(_view.id);
    if (!accs) return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div>' +
      '<div class="bk-empty">Open an account first.</div>';
    var pct = E.matchPctOn(load().events);
    var wish = !dep && _view.wish ? E.wishes(load().events, _view.id, E.today()).filter(function (w) { return w.id === _view.wish; })[0] : null;
    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div>' +
      '<div class="bk-card bk-form"><h2>' + (dep ? '＋ Money in' : '− Money spent') + '</h2>' +
      (wish ? '<div class="bk-wish-for">' + wishThumb(wish) + '<span>For the wish: <b>' + esc(wish.name) + '</b></span></div>' : '') +
      '<div id="bk-f-accbox"><label for="bk-f-acc">Account</label><select id="bk-f-acc"' + (dep ? ' onchange="Banco.matchPreview()"' : '') + '>' + accs + '</select></div>' +
      (dep ? multiBox() : '') +
      '<div id="bk-f-amtbox"><label for="bk-f-amt" id="bk-f-amtlbl">Amount (USD)</label><input id="bk-f-amt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00"' + (wish ? ' value="' + wish.price.toFixed(2) + '"' : '') +
        (dep ? ' oninput="Banco.matchPreview()"' : '') + '></div>' +
      (dep ? '<fieldset class="bk-sources"><legend>Where did it come from?</legend>' + E.SOURCES.map(function (so, i) {
          return '<label class="bk-chip"><input type="radio" name="bk-src" value="' + so.id + '"' + (i === 0 ? ' checked' : '') + '><span>' + so.emoji + ' ' + so.label + '</span></label>';
        }).join('') + '</fieldset>' +
        standBox() +
        '<label class="bk-check"><input type="checkbox" id="bk-f-match" checked onchange="Banco.matchPreview()"> Add the ' + pct + '% match <b id="bk-f-matchamt"></b></label>' +
        '<p class="bk-small" id="bk-f-give"></p><div class="bk-m-prev" id="bk-m-prev" aria-live="polite"></div>' : '') +
      '<label for="bk-f-note">' + (dep ? 'Note (optional)' : 'What was it for?') + '</label><input id="bk-f-note" type="text" maxlength="80" placeholder="' + (dep ? 'e.g. Saturday lemonade stand' : 'e.g. Lego set') + '"' + (wish ? ' value="' + esc(wish.name) + '"' : '') + '>' +
      '<label for="bk-f-date">Date</label><input id="bk-f-date" type="date" value="' + E.today() + '" max="' + E.today() + '">' +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.go(\'home\')">Cancel</button>' +
      '<button type="button" class="bk-btn green" onclick="Banco.saveMoney(\'' + kind + '\')">' + (dep ? 'Add to account' : 'Take it out') + '</button></div></div>';
  }
  // Payday: split a deposit between several accounts.
  function multiBox() {
    var accs = E.accounts(load().events).filter(function (a) { return !a.archived; });
    return '<label class="bk-check"><input type="checkbox" id="bk-f-multi" onchange="Banco.multiToggle()"> Split between several accounts (payday)</label>' +
      '<div id="bk-multi" hidden>' +
      '<fieldset class="bk-sources"><legend>Which accounts?</legend>' + accs.map(function (a) {
        return '<label class="bk-chip"><input type="checkbox" name="bk-m-acc" value="' + a.id + '" onchange="Banco.multiToggle()"><span>' + esc(a.emoji + ' ' + a.name) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<fieldset class="bk-sources"><legend>How to split</legend>' +
        '<label class="bk-chip"><input type="radio" name="bk-m-mode" value="equal" checked onchange="Banco.multiToggle()"><span>Equally</span></label>' +
        '<label class="bk-chip"><input type="radio" name="bk-m-mode" value="custom" onchange="Banco.multiToggle()"><span>Different amounts</span></label></fieldset>' +
      '<div id="bk-m-custom" hidden>' + accs.map(function (a) {
        return '<div class="bk-m-row" data-acc="' + a.id + '" hidden><label for="bk-m-amt-' + a.id + '">' + esc(a.emoji + ' ' + a.name) + '</label>' +
          '<input id="bk-m-amt-' + a.id + '" class="bk-m-amt" data-acc="' + a.id + '" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" oninput="Banco.matchPreview()"></div>';
      }).join('') + '</div></div>';
  }
  // A stand: the sales and costs behind a deposit. Only the profit goes in.
  function standBox() {
    return '<label class="bk-check"><input type="checkbox" id="bk-f-stand" onchange="Banco.standToggle()"> 🍋 Record the stand\'s sales and costs</label>' +
      '<div id="bk-stand" hidden>' +
      '<label for="bk-st-sales">Sales (USD)</label><input id="bk-st-sales" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" oninput="Banco.matchPreview()">' +
      '<label for="bk-st-costs">Costs: lemons, cups, sugar… (USD)</label><input id="bk-st-costs" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" oninput="Banco.matchPreview()">' +
      '<label for="bk-st-hours">Hours at the stand (optional)</label><input id="bk-st-hours" type="number" inputmode="decimal" min="0" step="0.25" placeholder="e.g. 2">' +
      '<p class="bk-small" id="bk-st-profit"></p></div>';
  }
  function val(id) { var el = document.getElementById(id); return el ? parseFloat(el.value) : NaN; }
  function checked(id) { var el = document.getElementById(id); return !!(el && el.checked); }
  function multiState() {
    var on = checked('bk-f-multi');
    var ids = Array.prototype.map.call(document.querySelectorAll('input[name="bk-m-acc"]:checked'), function (x) { return x.value; });
    var mode = (document.querySelector('input[name="bk-m-mode"]:checked') || {}).value || 'equal';
    return { on: on, ids: ids, mode: mode };
  }
  function standState() {
    if (!checked('bk-f-stand')) return null;
    var sales = Math.round(val('bk-st-sales') * 100) / 100 || 0, costs = Math.round(val('bk-st-costs') * 100) / 100 || 0;
    return { sales: sales, costs: costs, profit: Math.round((sales - costs) * 100) / 100, hours: val('bk-st-hours') > 0 ? val('bk-st-hours') : 0 };
  }
  // The amounts the form describes, per account: { items, total, error }.
  function depositItems() {
    var m = multiState(), st = standState();
    var total = st ? Math.max(0, st.profit) : (Math.round(val('bk-f-amt') * 100) / 100 || 0);
    if (!m.on) return { items: [{ account: (document.getElementById('bk-f-acc') || {}).value, amount: total }], total: total, multi: false };
    var items;
    if (m.mode === 'equal') {
      var parts = E.splitEqual(total, Math.max(1, m.ids.length));
      items = m.ids.map(function (id, i) { return { account: id, amount: total > 0 ? parts[i] : 0 }; });
    } else {
      items = m.ids.map(function (id) { return { account: id, amount: Math.round(val('bk-m-amt-' + id) * 100) / 100 || 0 }; });
      var sum = Math.round(items.reduce(function (t, it) { return t + it.amount; }, 0) * 100) / 100;
      if (!st) total = sum;
      else if (Math.abs(sum - total) > 0.004) return { items: items, total: total, multi: true, error: 'The amounts add up to ' + money(sum) + ', but the profit is ' + money(total) + '.' };
    }
    return { items: items, total: total, multi: true };
  }
  function matchPreview() {
    var m = multiState(), st = standState();
    // Show only the parts of the form that apply.
    var multi = document.getElementById('bk-multi'), accBox = document.getElementById('bk-f-accbox'), amtBox = document.getElementById('bk-f-amtbox');
    if (multi) {
      multi.hidden = !m.on;
      accBox.hidden = m.on;
      var custom = document.getElementById('bk-m-custom');
      custom.hidden = !(m.on && m.mode === 'custom');
      Array.prototype.forEach.call(document.querySelectorAll('.bk-m-row'), function (r) { r.hidden = m.ids.indexOf(r.getAttribute('data-acc')) < 0; });
      amtBox.hidden = m.on && m.mode === 'custom' && !st;
      var lbl = document.getElementById('bk-f-amtlbl');
      if (lbl) lbl.textContent = st ? 'Profit to deposit (USD)' : (m.on ? 'Total amount (USD)' : 'Amount (USD)');
    }
    var amtEl = document.getElementById('bk-f-amt'), sp = document.getElementById('bk-st-profit'), stBox = document.getElementById('bk-stand');
    if (stBox) stBox.hidden = !st;
    if (amtEl) amtEl.readOnly = !!st;
    if (st && amtEl) {
      amtEl.value = st.profit > 0 ? st.profit.toFixed(2) : '';
      sp.textContent = st.sales > 0 && st.profit > 0 ? 'Profit: ' + money(st.profit) + ' (sales ' + money(st.sales) + ' minus costs ' + money(st.costs) + '). Only the profit is deposited; the costs stay out of the account.'
        : st.sales > 0 ? 'No profit this time, so there\'s nothing to deposit.' : '';
    }

    var a = depositItems().total, on = checked('bk-f-match');
    var out = document.getElementById('bk-f-matchamt');
    if (out) out.textContent = on && a > 0 ? '(+' + money(a * E.matchPctOn(load().events) / 100) + ' in all)' : '';
    var gOut = document.getElementById('bk-f-give'), accEl = document.getElementById('bk-f-acc'), prev = document.getElementById('bk-m-prev');
    if (gOut && accEl) {
      gOut.hidden = m.on;
      var acc = findAccount(accEl.value);
      var gp = acc ? E.givePctOf(load().events, acc) : E.DEFAULT_GIVE_MIN;
      var tot = a > 0 ? a * (1 + (on ? E.matchPctOn(load().events) / 100 : 0)) : 0;
      gOut.textContent = tot > 0 ? '💛 ' + money(tot * gp / 100) + ' (' + gp + '%) goes to the Giving jar.' : '💛 ' + gp + '% goes to the Giving jar.';
    }
    if (prev) {
      prev.hidden = !m.on;
      var di = depositItems();
      var bodies = m.on && !di.error ? E.payday(load().events, { items: di.items, match: on, date: E.today() }) : [];
      prev.innerHTML = di.error ? esc(di.error) : bodies.map(function (b) {
        var acc2 = findAccount(b.account);
        return '<div><b>' + esc(acc2 ? acc2.name : '') + '</b>: ' + money(b.amount) + (b.match ? ' + ' + money(b.match) + ' match' : '') + ' · 💛 ' + money(b.give) + '</div>';
      }).join('');
    }
  }
  function multiToggle() { matchPreview(); }
  function standToggle() { matchPreview(); }

  function saveDeposit() {
    var date = document.getElementById('bk-f-date').value;
    if (!E.isDate(date) || date > E.today()) date = E.today();
    var note = document.getElementById('bk-f-note').value.trim().slice(0, 80);
    var srcEl = document.querySelector('input[name="bk-src"]:checked');
    var m = multiState(), st = standState(), di = depositItems();
    if (m.on && m.ids.length < 2) { ZsDialog.toast('Pick at least two accounts.'); return; }
    if (st && st.sales > 0 && !(st.profit > 0)) { ZsDialog.toast('No profit this time, so there\'s nothing to deposit.'); return; }
    if (st && !(st.sales > 0)) { ZsDialog.toast('Type the stand\'s sales.'); return; }
    if (di.error) { ZsDialog.toast(di.error); return; }
    var items = di.items.filter(function (it) { return it.amount > 0; });
    if (!items.length || di.total <= 0 || di.total > 100000) { ZsDialog.toast('Type an amount.'); return; }
    if (m.on && m.mode === 'equal' && items.length < m.ids.length) { ZsDialog.toast('That\'s too small to split between ' + m.ids.length + ' accounts.'); return; }
    if (!items.every(function (it) { return findAccount(it.account); })) return;
    var bodies = E.payday(load().events, {
      items: items, date: date, source: srcEl ? srcEl.value : 'other', note: note, match: checked('bk-f-match'),
      stand: st ? { sales: st.sales, costs: st.costs, hours: st.hours } : null
    });
    add(bodies.map(function (b) { return ev('deposit', b); }));
    var matched = bodies.reduce(function (t, b) { return t + b.match; }, 0), given = bodies.reduce(function (t, b) { return t + b.give; }, 0);
    ZsDialog.toast('Added ' + money(di.total) + (bodies.length > 1 ? ' across ' + bodies.length + ' accounts' : '') + (matched ? ' + ' + money(matched) + ' match' : '') + ' · 💛 ' + money(given) + ' to giving.');
    _view = bodies.length > 1 ? { name: 'home' } : { name: 'account', id: bodies[0].account };
    render();
  }

  function saveMoney(kind) {
    if (!_parent) return;
    if (kind === 'deposit') { saveDeposit(); return; }
    var acc = document.getElementById('bk-f-acc').value;
    var amt = Math.round(parseFloat(document.getElementById('bk-f-amt').value) * 100) / 100;
    var note = document.getElementById('bk-f-note').value.trim().slice(0, 80);
    var date = document.getElementById('bk-f-date').value;
    if (!findAccount(acc)) return;
    if (!(amt > 0) || amt > 100000) { ZsDialog.toast('Type an amount.'); return; }
    if (!E.isDate(date) || date > E.today()) date = E.today();
    var s = E.compute(load().events, acc, prices(), date);
    if (amt > s.value + 0.005) { ZsDialog.toast('That account only has ' + money(s.value) + '.'); return; }
    var wf = { account: acc, amount: amt, note: note, date: date };
    if (_view.wish && _view.id === acc) wf.wish = _view.wish;
    add(ev('withdraw', wf));
    ZsDialog.toast('Took out ' + money(amt) + '.');
    _view = { name: 'account', id: acc };
    render();
  }

  function renderSharedForm() {
    if (!_parent) { _view = { name: 'home' }; return renderHome(); }
    var ps = profiles();
    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div>' +
      '<div class="bk-card bk-form"><h2>👥 New shared account</h2>' +
      '<label for="bk-s-name">Name</label><input id="bk-s-name" type="text" maxlength="30" placeholder="e.g. The Boys\' Fund">' +
      '<label for="bk-s-emoji">Emoji</label><input id="bk-s-emoji" type="text" maxlength="2" value="🤝">' +
      '<fieldset class="bk-sources"><legend>Who shares it? (everyone must agree to change its mix)</legend>' +
        ps.map(function (p) {
          return '<label class="bk-chip"><input type="checkbox" name="bk-s-mem" value="' + esc(p.name) + '"><span>' + esc((p.avatar || '') + ' ' + p.name) + '</span></label>';
        }).join('') + '</fieldset>' +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.go(\'home\')">Cancel</button>' +
      '<button type="button" class="bk-btn green" onclick="Banco.saveShared()">Open account</button></div></div>';
  }
  function saveShared() {
    if (!_parent) return;
    var name = document.getElementById('bk-s-name').value.trim().slice(0, 30);
    var emoji = document.getElementById('bk-s-emoji').value.trim() || '🤝';
    var mem = Array.prototype.map.call(document.querySelectorAll('input[name="bk-s-mem"]:checked'), function (x) { return x.value; });
    if (!name) { ZsDialog.toast('Give the account a name.'); return; }
    if (mem.length < 2) { ZsDialog.toast('Pick at least two kids to share it.'); return; }
    var id = E.uid('acc');
    add(ev('account', { account: id, name: name, emoji: emoji, kind: 'shared', members: mem }));
    _view = { name: 'account', id: id };
    render();
  }
  function openOwnAccounts() {
    if (!_parent) return;
    var accs = E.accounts(load().events);
    var evts = profiles().filter(function (p) {
      return !accs.some(function (a) { return a.kind === 'own' && E.isMember(a, p.name); });
    }).map(function (p) {
      return ev('account', { account: E.uid('acc'), name: p.name, emoji: p.avatar || '🐷', kind: 'own', members: [p.name] });
    });
    if (evts.length) add(evts);
    render();
  }

  function renderSettings() {
    if (!_parent) { _view = { name: 'home' }; return renderHome(); }
    var events = load().events;
    var last = Object.keys(prices()).sort().pop();
    var accs = E.accounts(events);
    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div>' +
      '<div class="bk-card bk-form"><h2>⚙️ Bank settings</h2>' +
      '<label for="bk-set-match">Match on new deposits (%)</label><input id="bk-set-match" type="number" min="0" max="100" step="1" value="' + E.matchPctOn(events) + '">' +
      '<label for="bk-set-rate">Bonds interest per year (%)</label><input id="bk-set-rate" type="number" min="0" max="20" step="0.1" value="' + (E.rateOn(events) * 100).toFixed(1) + '">' +
      '<label for="bk-set-give">Minimum for giving (% of each deposit)</label><input id="bk-set-give" type="number" min="0" max="50" step="1" value="' + E.giveMinOn(events) + '">' +
      '<p class="bk-small">New rates count from today; money already earned stays earned.</p>' +
      '<div class="bk-row"><button type="button" class="bk-btn green" onclick="Banco.saveSettings()">Save</button></div></div>' +
      '<div class="bk-card bk-form"><h2>📈 S&amp;P 500 price</h2>' +
      '<p class="bk-small">' + (last ? 'Last close the bank knows: ' + Math.round(prices()[last]).toLocaleString('en-US') + ' (' + fmtDate(last) + ').' : 'No price yet — the family server fetches it every day.') +
        ' If it\'s missing, type a close here.</p>' +
      '<label for="bk-p-date">Date</label><input id="bk-p-date" type="date" value="' + E.today() + '" max="' + E.today() + '">' +
      '<label for="bk-p-close">S&amp;P 500 close</label><input id="bk-p-close" type="number" step="0.01" min="100" placeholder="e.g. 6712.50">' +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.refreshPrices()">Fetch now</button>' +
      '<button type="button" class="bk-btn green" onclick="Banco.savePrice()">Save price</button></div></div>' +
      '<div class="bk-card bk-form"><h2>💛 Places to give</h2>' + E.causes(events).map(function (c) {
        return '<div class="bk-hrow"><span class="bk-hline">' + esc(c.emoji + ' ' + c.name) + (c.removed ? ' <small>· hidden</small>' : '') + '</span>' +
          '<span class="bk-hamt"><button type="button" class="bk-link" onclick="Banco.renameCause(\'' + c.id + '\')">Rename</button>' +
          '<button type="button" class="bk-link" onclick="Banco.hideCause(\'' + c.id + '\', ' + !c.removed + ')">' + (c.removed ? 'Show' : 'Hide') + '</button></span></div>';
      }).join('') +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.addCause()">＋ Add a place</button></div></div>' +
      '<div class="bk-card bk-form"><h2>👥 Accounts</h2>' + accs.map(function (a) {
        return '<div class="bk-hrow"><span class="bk-hline">' + esc(a.emoji + ' ' + a.name) + ' <small>' + (a.kind === 'shared' ? 'shared · ' + a.members.map(esc).join(', ') : 'own') + (a.archived ? ' · closed' : '') + '</small></span>' +
          '<span class="bk-hamt"><button type="button" class="bk-link" onclick="Banco.renameAccount(\'' + a.id + '\')">Rename</button>' +
          (a.kind === 'shared' ? '<button type="button" class="bk-link" onclick="Banco.editMembers(\'' + a.id + '\')">Members</button>' : '') +
          '<button type="button" class="bk-link" onclick="Banco.archive(\'' + a.id + '\', ' + !a.archived + ')">' + (a.archived ? 'Reopen' : 'Close') + '</button></span></div>';
      }).join('') + '</div>';
  }
  function saveSettings() {
    if (!_parent) return;
    var events = load().events, evts = [];
    var pct = Math.round(parseFloat(document.getElementById('bk-set-match').value));
    var rate = Math.round(parseFloat(document.getElementById('bk-set-rate').value) * 10) / 1000;
    if (pct >= 0 && pct <= 100 && pct !== E.matchPctOn(events)) evts.push(ev('matchPct', { pct: pct }));
    if (rate >= 0 && rate <= 0.2 && Math.abs(rate - E.rateOn(events)) > 1e-9) evts.push(ev('rate', { rate: rate }));
    var gmin = Math.round(parseFloat(document.getElementById('bk-set-give').value));
    if (gmin >= 0 && gmin <= 50 && gmin !== E.giveMinOn(events)) evts.push(ev('giveMin', { pct: gmin }));
    if (evts.length) add(evts);
    ZsDialog.toast(evts.length ? 'Saved.' : 'Nothing changed.');
    render();
  }
  function savePrice() {
    if (!_parent) return;
    var d = document.getElementById('bk-p-date').value, c = parseFloat(document.getElementById('bk-p-close').value);
    if (!E.isDate(d) || !(c > 100 && c < 100000)) { ZsDialog.toast('Type a date and a close like 6712.50.'); return; }
    add(ev('price', { date: d, close: Math.round(c * 100) / 100 }));
    ZsDialog.toast('Saved the S&P 500 close for ' + fmtDate(d) + '.');
    render();
  }
  function refreshPrices() {
    fetchPrices().then(function (changed) {
      ZsDialog.toast(changed ? 'Got the latest prices.' : (typeof CloudSync !== 'undefined' && CloudSync.online ? 'Prices are up to date.' : 'The family server isn\'t reachable right now.'));
      render();
    });
  }
  function renameCause(id) {
    if (!_parent) return;
    var c = cause(id);
    ZsDialog.prompt({ title: 'Rename "' + c.name + '"', defaultValue: c.name, confirmLabel: 'Save' }).then(function (v) {
      v = (v || '').trim().slice(0, 40);
      if (v && v !== c.name) { add(ev('causeEdit', { cause: id, name: v })); render(); }
    });
  }
  function hideCause(id, hide) {
    if (!_parent) return;
    add(ev('causeEdit', { cause: id, removed: !!hide }));
    render();
  }
  function addCause() {
    if (!_parent) return;
    ZsDialog.prompt({ title: '💛 A new place to give', placeholder: 'e.g. Christmas toy drive', confirmLabel: 'Next' }).then(function (name) {
      name = (name || '').trim().slice(0, 40);
      if (!name) return;
      return ZsDialog.prompt({ title: 'An emoji for it', defaultValue: '💛', confirmLabel: 'Add' }).then(function (em) {
        add(ev('cause', { cause: E.uid('c'), name: name, emoji: (em || '💛').trim().slice(0, 4) || '💛' }));
        render();
      });
    });
  }

  function renameAccount(id) {
    var a = findAccount(id); if (!_parent || !a) return;
    ZsDialog.prompt({ title: 'Rename account', defaultValue: a.name, confirmLabel: 'Save' }).then(function (v) {
      v = (v || '').trim().slice(0, 30);
      if (v && v !== a.name) { add(ev('accountEdit', { account: id, name: v })); render(); }
    });
  }
  function editMembers(id) {
    var a = findAccount(id); if (!_parent || !a) return;
    ZsDialog.prompt({ title: 'Who shares "' + a.name + '"?', message: 'Names separated by commas.', defaultValue: a.members.join(', '), confirmLabel: 'Save' }).then(function (v) {
      if (v == null) return;
      var names = profiles().map(function (p) { return p.name; });
      var mem = v.split(',').map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) {
        return names.filter(function (n) { return E.sameName(n, x); })[0];
      }).filter(Boolean);
      if (mem.length < 2) { ZsDialog.toast('A shared account needs at least two kids from the profile list.'); return; }
      add(ev('accountEdit', { account: id, members: mem }));
      render();
    });
  }
  function archive(id, closed) {
    var a = findAccount(id); if (!_parent || !a) return;
    var s = E.compute(load().events, id, prices());
    var go = closed && s.value > 0.005
      ? ZsDialog.confirm({ title: 'Close "' + a.name + '"?', message: 'It still holds ' + money(s.value) + '. Closing only hides it; the money stays recorded.', confirmLabel: 'Close it' })
      : Promise.resolve(true);
    go.then(function (ok) { if (ok) { add(ev('accountEdit', { account: id, archived: closed })); render(); } });
  }
  function undo(eventId) {
    if (!_parent) return;
    ZsDialog.confirm({ title: 'Cancel this entry?', message: 'Use this for a mistake. It stays in the history, crossed out.', confirmLabel: 'Cancel entry', danger: true })
      .then(function (ok) { if (ok) { add(ev('void', { target: eventId })); render(); } });
  }

  // ── mix & votes ──
  function chooseMix(id) {
    if (!id) { _chooser = null; render(); return; }
    var acc = findAccount(id);
    if (!canSee(acc)) return;
    var s = E.compute(load().events, id, prices());
    _chooser = { account: id, bonds: s.bondsPct };
    render();
  }
  function pickMix(b, fromRange) {
    if (!_chooser) return;
    _chooser.bonds = Math.max(0, Math.min(100, Math.round(Number(b) / 10) * 10));
    if (fromRange) {
      var rate = E.rateOn(load().events);
      var s = E.compute(load().events, _chooser.account, prices());
      document.getElementById('bk-mix-b').textContent = _chooser.bonds + '%';
      document.getElementById('bk-mix-s').textContent = (100 - _chooser.bonds) + '%';
      document.getElementById('bk-whatif').innerHTML = whatIf(_chooser.bonds, E.yearFor(_chooser.bonds, E.SP_YEARS[2013], rate),
        E.yearFor(_chooser.bonds, E.SP_YEARS[2008], rate), Math.max(100, Math.round(s.value || 100)));
    } else render();
  }
  function saveMix(id) {
    var acc = findAccount(id);
    if (!_chooser || !canSee(acc)) return;
    var b = _chooser.bonds;
    var events = load().events;
    var cur = E.compute(events, id, prices()).bondsPct;
    if (b === cur && E.mixChanges(events, acc).length) { ZsDialog.toast('That\'s already the mix — pick a different one.'); return; }
    if (_parent) {
      add(ev('mix', { account: id, bonds: b, by: 'parent' }));
    } else {
      var gate = E.canChangeMix(events, acc, E.today());
      if (!gate.ok) { ZsDialog.toast('You can change the mix again on ' + fmtDate(gate.next) + '.'); return; }
      if (acc.kind === 'shared') {
        add(ev('proposal', { account: id, bonds: b }));
        ZsDialog.toast('Asked the others. It changes when everyone agrees.');
      } else {
        add(ev('mix', { account: id, bonds: b }));
        ZsDialog.toast('Your mix is saved!');
      }
    }
    _chooser = null;
    render();
  }
  function vote(proposalId, yes) {
    var acc = findAccount(_view.id);
    if (_parent || !acc || !E.isMember(acc, me())) return;
    add(ev('vote', { proposal: proposalId, yes: !!yes }));
    var p = E.proposals(load().events, acc).filter(function (x) { return x.id === proposalId; })[0];
    ZsDialog.toast(p && p.status === 'passed' ? '🎉 Everyone agreed — it\'s changed!' : (yes ? 'Thanks! Waiting for the others.' : 'You said no — the mix stays the same.'));
    render();
  }
  function setGoal(id) {
    var acc = findAccount(id);
    if (!acc || !(_parent || E.isMember(acc, me()))) return;
    ZsDialog.prompt({ title: '🎯 What are you saving for?', placeholder: 'e.g. A new bike', confirmLabel: 'Next' }).then(function (name) {
      name = (name || '').trim().slice(0, 40);
      if (!name) return;
      return ZsDialog.prompt({ title: 'How much does it cost?', inputType: 'number', placeholder: '150', confirmLabel: 'Save goal' }).then(function (v) {
        var amt = Math.round(parseFloat(v));
        if (!(amt > 0)) return;
        add(ev('goal', { account: id, name: name, amount: amt }));
        render();
      });
    });
  }

  // ── navigation & lock ──
  function go(name, id) { _chooser = null; _giveEdit = null; _wish = null; _view = { name: name, id: id }; render(); window.scrollTo(0, 0); }
  function open(id) { go('account', id); }
  function unlock() {
    var pin = typeof getParentPin === 'function' ? getParentPin() : null;
    if (!pin) return;
    ZsDialog.prompt({ title: '🔑 Bank manager', message: 'Parent PIN', inputType: 'password', inputMode: 'numeric', confirmLabel: 'Unlock' }).then(function (v) {
      if (v == null) return;
      if (String(v) === String(pin)) { _parent = true; render(); }
      else ZsDialog.toast('Wrong PIN.');
    });
  }
  function lock() { _parent = false; _chooser = null; _wish = null; go('home'); }

  // Re-draw after a background change, but never under a form the parent
  // is filling in (that would wipe what they typed).
  function softRender() {
    if (/^(deposit|spend|give|newShared|settings)$/.test(_view.name)) return;
    if (document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    render();
  }

  function init() {
    render();
    // Pull the latest bank from the family server, then prices; redraw
    // only when either brought something new.
    function refresh() {
      var before = localStorage.getItem(KEY);
      var p = (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pull) ? CloudSync.pull(KEY) : Promise.resolve(false);
      Promise.resolve(p).then(function () { return fetchPrices(); }).then(function (pricesChanged) {
        if (pricesChanged || localStorage.getItem(KEY) !== before) softRender();
      }).catch(function () {});
    }
    refresh();
    setTimeout(refresh, 2500);   // CloudSync may still be pinging at load
    window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === PRICE_KEY) softRender(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    statement: statement, dismissStatement: dismissStatement,
    wishAdd: wishAdd, wishCancel: wishCancel, wishEmoji: wishEmoji, wishPhoto: wishPhoto, wishSave: wishSave,
    wishRemove: wishRemove, wishDecide: wishDecide, buyWish: buyWish,
    go: go, open: open, unlock: unlock, lock: lock,
    saveMoney: saveMoney, matchPreview: matchPreview, multiToggle: multiToggle, standToggle: standToggle, saveShared: saveShared, openOwnAccounts: openOwnAccounts,
    saveSettings: saveSettings, savePrice: savePrice, refreshPrices: refreshPrices,
    renameAccount: renameAccount, editMembers: editMembers, archive: archive, undo: undo,
    chooseMix: chooseMix, pickMix: pickMix, saveMix: saveMix, vote: vote, setGoal: setGoal,
    editGive: editGive, setGivePct: setGivePct, setGiveTo: setGiveTo, saveGive: saveGive,
    renameCause: renameCause, hideCause: hideCause, addCause: addCause,
    _render: render
  };
})();
