/* ================================================================
   BANCO FAMILIA — banco.js
   The kids give their real cash to a parent, who is the bank. Each
   deposit is recorded here with where the money came from, the
   parent's 10% match is added, and the money grows in the mix the
   kid picks: 🛡️ Bonds (steady, fixed rate) and 📈 S&P 500 (follows the
   real market). Only a parent adds or takes out money.

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
    else if (v === 'newShared') root.innerHTML = renderSharedForm();
    else if (v === 'settings') root.innerHTML = renderSettings();
    else root.innerHTML = renderHome();
    var r = document.getElementById('bk-mix-range');
    if (r) r.addEventListener('input', function () { pickMix(r.value, true); });
    var tm = document.getElementById('bk-tm-month');
    if (tm) tm.addEventListener('input', function () { timeMachine(); });
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
          (s.deposits ? '<small class="' + (s.growth >= 0 ? 'up' : 'down') + '">' + signed(s.growth) + ' grown</small>' : '<small>No money yet</small>') + '</span>' +
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

    return head + parentBar +
      (accs.length ? '<h2 class="bk-h2">' + (_parent ? 'All accounts' : 'My accounts') + '</h2><div class="bk-accs">' + cards + '</div>' : empty) +
      (_parent ? renderFamilyTotal(accs) : '') +
      '<div class="bk-foot">' + lock + '</div>';
  }

  function renderFamilyTotal(accs) {
    if (!accs.length) return '';
    var pr = prices(), t = 0, put = 0, m = 0;
    accs.forEach(function (a) { var s = E.compute(load().events, a.id, pr); t += s.value; put += s.deposited - s.withdrawn; m += s.matched; });
    return '<div class="bk-card bk-total"><div><small>Held for the kids</small><b>' + money(t) + '</b></div>' +
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
    var tm = renderTimeMachine(acc, s, rate, events);
    var log = renderHistory(acc, events, pr);

    var priceNote = s.price ? '<p class="bk-small">S&amp;P 500 last close: ' + Math.round(s.price).toLocaleString('en-US') +
      (priceMeta().updatedAt ? ' · updated ' + fmtDate(E.iso(new Date(priceMeta().updatedAt))) : '') + '</p>' : '';

    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← All accounts</button>' +
      (_parent ? '<button type="button" class="bk-btn green small" onclick="Banco.go(\'deposit\', \'' + id + '\')">＋ Deposit</button>' +
                 '<button type="button" class="bk-btn small" onclick="Banco.go(\'spend\', \'' + id + '\')">− Spent</button>' : '') +
      '</div>' + top + dropCard + goal + mixCard + chartCard + sources + tm + log + priceNote;
  }

  function tile(icon, label, val, cls) {
    return '<div class="bk-tile ' + cls + '"><span>' + icon + '</span><small>' + esc(label) + '</small><b>' + val + '</b></div>';
  }

  // Mix controls: own account → change directly (once a month); shared
  // → propose, and every member votes. A parent can always set it.
  function renderMixControls(acc, s) {
    var events = load().events, today = E.today();
    var props = acc.kind === 'shared' ? E.proposals(events, acc) : [];
    var open = props.filter(function (p) { return p.status === 'open'; })[0];
    var html = '';

    if (open) {
      var n = me();
      var voted = open.votes[n.toLowerCase()];
      html += '<div class="bk-vote"><b>🗳️ ' + esc(open.by) + ' wants to change the mix to ' + open.bonds + '% bonds · ' + (100 - open.bonds) + '% S&amp;P 500.</b>' +
        '<div class="bk-votes">' + acc.members.map(function (m) {
          var v = open.votes[m.toLowerCase()];
          return '<span class="bk-voter ' + (v === true ? 'yes' : v === false ? 'no' : '') + '">' + (v === true ? '✅' : '⏳') + ' ' + esc(m) + '</span>';
        }).join('') + '</div>' +
        (!_parent && E.isMember(acc, n) && voted !== true
          ? '<div class="bk-row"><button type="button" class="bk-btn green small" onclick="Banco.vote(\'' + open.id + '\', true)">👍 I agree</button>' +
            '<button type="button" class="bk-btn small" onclick="Banco.vote(\'' + open.id + '\', false)">👎 No</button></div>'
          : '<small>It changes when everyone agrees. One "no" cancels it.</small>') +
        '</div>';
    }

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
      return (e.account === acc.id && /^(deposit|withdraw|mix|proposal)$/.test(e.type)) ||
        (e.type === 'vote' && acc.kind === 'shared' && E.proposals(events, acc).some(function (p) { return p.id === e.proposal; }));
    }).reverse().slice(0, 60).map(function (e) {
      var g = gone[e.id], line = '', amt = '';
      if (e.type === 'deposit') {
        var so = source(e.source);
        line = so.emoji + ' ' + esc(so.label) + (e.note ? ' — ' + esc(e.note) : '');
        amt = '<b class="up">+' + money(e.amount) + '</b>' + (Number(e.match) > 0 ? '<small>🎁 +' + money(e.match) + ' match</small>' : '');
      } else if (e.type === 'withdraw') {
        line = '🧾 Spent' + (e.note ? ': ' + esc(e.note) : '');
        amt = '<b class="down">−' + money(e.amount) + '</b>';
      } else if (e.type === 'mix') {
        line = '🎛️ Mix set to ' + e.bonds + '% bonds · ' + (100 - e.bonds) + '% S&amp;P 500' + (e.by && e.by !== 'parent' ? ' by ' + esc(e.by) : '');
      } else if (e.type === 'proposal') {
        line = '🗳️ ' + esc(e.by) + ' suggested ' + e.bonds + '% bonds';
      } else if (e.type === 'vote') {
        line = (e.yes ? '👍 ' : '👎 ') + esc(e.by) + (e.yes ? ' agreed' : ' said no');
      }
      var undo = _parent && !g && (e.type === 'deposit' || e.type === 'withdraw')
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
    return '<div class="bk-top"><button type="button" class="bk-ghost" onclick="Banco.go(\'home\')">← Back</button></div>' +
      '<div class="bk-card bk-form"><h2>' + (dep ? '＋ Money in' : '− Money spent') + '</h2>' +
      '<label for="bk-f-acc">Account</label><select id="bk-f-acc">' + accs + '</select>' +
      '<label for="bk-f-amt">Amount (USD)</label><input id="bk-f-amt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00"' +
        (dep ? ' oninput="Banco.matchPreview()"' : '') + '>' +
      (dep ? '<fieldset class="bk-sources"><legend>Where did it come from?</legend>' + E.SOURCES.map(function (so, i) {
          return '<label class="bk-chip"><input type="radio" name="bk-src" value="' + so.id + '"' + (i === 0 ? ' checked' : '') + '><span>' + so.emoji + ' ' + so.label + '</span></label>';
        }).join('') + '</fieldset>' +
        '<label class="bk-check"><input type="checkbox" id="bk-f-match" checked onchange="Banco.matchPreview()"> Add the ' + pct + '% match <b id="bk-f-matchamt"></b></label>' : '') +
      '<label for="bk-f-note">' + (dep ? 'Note (optional)' : 'What was it for?') + '</label><input id="bk-f-note" type="text" maxlength="80" placeholder="' + (dep ? 'e.g. Saturday lemonade stand' : 'e.g. Lego set') + '">' +
      '<label for="bk-f-date">Date</label><input id="bk-f-date" type="date" value="' + E.today() + '" max="' + E.today() + '">' +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.go(\'home\')">Cancel</button>' +
      '<button type="button" class="bk-btn green" onclick="Banco.saveMoney(\'' + kind + '\')">' + (dep ? 'Add to account' : 'Take it out') + '</button></div></div>';
  }
  function matchPreview() {
    var a = parseFloat((document.getElementById('bk-f-amt') || {}).value), on = (document.getElementById('bk-f-match') || {}).checked;
    var out = document.getElementById('bk-f-matchamt');
    if (out) out.textContent = on && a > 0 ? '(+' + money(a * E.matchPctOn(load().events) / 100) + ')' : '';
  }
  function saveMoney(kind) {
    if (!_parent) return;
    var acc = document.getElementById('bk-f-acc').value;
    var amt = Math.round(parseFloat(document.getElementById('bk-f-amt').value) * 100) / 100;
    var note = document.getElementById('bk-f-note').value.trim().slice(0, 80);
    var date = document.getElementById('bk-f-date').value;
    if (!findAccount(acc)) return;
    if (!(amt > 0) || amt > 100000) { ZsDialog.toast('Type an amount.'); return; }
    if (!E.isDate(date) || date > E.today()) date = E.today();
    if (kind === 'deposit') {
      var srcEl = document.querySelector('input[name="bk-src"]:checked');
      var withMatch = document.getElementById('bk-f-match').checked;
      var m = withMatch ? Math.round(amt * E.matchPctOn(load().events, date)) / 100 : 0;
      add(ev('deposit', { account: acc, amount: amt, match: m, source: srcEl ? srcEl.value : 'other', note: note, date: date }));
      ZsDialog.toast('Added ' + money(amt) + (m ? ' + ' + money(m) + ' match' : '') + '.');
    } else {
      var s = E.compute(load().events, acc, prices(), date);
      if (amt > s.value + 0.005) { ZsDialog.toast('That account only has ' + money(s.value) + '.'); return; }
      add(ev('withdraw', { account: acc, amount: amt, note: note, date: date }));
      ZsDialog.toast('Took out ' + money(amt) + '.');
    }
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
      '<p class="bk-small">New rates count from today; money already earned stays earned.</p>' +
      '<div class="bk-row"><button type="button" class="bk-btn green" onclick="Banco.saveSettings()">Save</button></div></div>' +
      '<div class="bk-card bk-form"><h2>📈 S&amp;P 500 price</h2>' +
      '<p class="bk-small">' + (last ? 'Last close the bank knows: ' + Math.round(prices()[last]).toLocaleString('en-US') + ' (' + fmtDate(last) + ').' : 'No price yet — the family server fetches it every day.') +
        ' If it\'s missing, type a close here.</p>' +
      '<label for="bk-p-date">Date</label><input id="bk-p-date" type="date" value="' + E.today() + '" max="' + E.today() + '">' +
      '<label for="bk-p-close">S&amp;P 500 close</label><input id="bk-p-close" type="number" step="0.01" min="100" placeholder="e.g. 6712.50">' +
      '<div class="bk-row"><button type="button" class="bk-btn" onclick="Banco.refreshPrices()">Fetch now</button>' +
      '<button type="button" class="bk-btn green" onclick="Banco.savePrice()">Save price</button></div></div>' +
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
    ZsDialog.toast(p && p.status === 'passed' ? '🎉 Everyone agreed — the new mix is on!' : (yes ? 'Thanks! Waiting for the others.' : 'You said no — the mix stays the same.'));
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
  function go(name, id) { _chooser = null; _view = { name: name, id: id }; render(); window.scrollTo(0, 0); }
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
  function lock() { _parent = false; _chooser = null; go('home'); }

  // Re-draw after a background change, but never under a form the parent
  // is filling in (that would wipe what they typed).
  function softRender() {
    if (/^(deposit|spend|newShared|settings)$/.test(_view.name)) return;
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
    go: go, open: open, unlock: unlock, lock: lock,
    saveMoney: saveMoney, matchPreview: matchPreview, saveShared: saveShared, openOwnAccounts: openOwnAccounts,
    saveSettings: saveSettings, savePrice: savePrice, refreshPrices: refreshPrices,
    renameAccount: renameAccount, editMembers: editMembers, archive: archive, undo: undo,
    chooseMix: chooseMix, pickMix: pickMix, saveMix: saveMix, vote: vote, setGoal: setGoal,
    _render: render
  };
})();
