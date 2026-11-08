/* ================================================================
   BANK ENGINE — bank-engine.js
   The maths behind Banco Familia, with no DOM and no storage, so the
   page, the hub card and the tests all compute the same numbers.

   The whole bank is an append-only log of events (household key
   zs_bank: { v: 1, events: [...] }). Nothing stores a balance:
   balances are recomputed from the log, a price table and today's
   date. That is what makes sync safe — two devices merge by taking
   the union of their events by id (see _mergeBank in sync.js).

   Event shapes (every event has id, type, ts = Date.now(), date =
   'YYYY-MM-DD' it takes effect, by = who entered it):
     account   { account, name, emoji, members: [kid names], kind: 'own'|'shared' }
     accountEdit { account, name?, emoji?, members?, archived? }
     deposit   { account, amount, source, note, match, give }
                                                           match = $ added by the parent;
                                                           give = $ of (amount + match) set
                                                           aside in the Giving jar
     withdraw  { account, amount, note, category }        parent only ("spent")
     mix       { account, bonds }                          % in bonds; the rest is S&P 500
     proposal  { account, bonds | givePct | cause }        a shared account's proposed change
     vote      { proposal, yes }                           one member's answer
     goal      { account, name, amount }                   latest one wins; amount 0 clears it
     rate      { rate }                                    bond rate per year from `date` on
     matchPct  { pct }                                     match % for new deposits
     price     { close }                                   a parent-typed S&P 500 close for `date`
     void      { target }                                  cancels a deposit/withdraw/give entered by mistake
     givePct   { account, pct }                            % of each deposit for giving (≥ the minimum)
     giveMin   { pct }                                     the household minimum, 10 to start
     giveTo    { account, cause }                          where the next gift goes
     give      { account, amount, cause, note }            a gift made from the Giving jar (parent)
     cause     { cause, name, emoji }                      a place to give, added by a parent
     causeEdit { cause, name?, emoji?, removed? }
   ================================================================ */
(function (root) {
  'use strict';

  var DEFAULT_RATE = 0.04;      // close to what short U.S. government bonds pay in 2026
  var DEFAULT_MATCH = 10;       // %
  var DEFAULT_BONDS = 50;       // % in bonds until the account picks a mix
  var DEFAULT_GIVE_MIN = 10;    // % of every deposit that goes to the Giving jar, at least

  // Places to give before a parent edits the list.
  var DEFAULT_CAUSES = [
    { id: 'parish',   emoji: '🙏', name: 'St. Claire\'s parish' },
    { id: 'missions', emoji: '🌍', name: 'Missions collection' },
    { id: 'foodbank', emoji: '🍞', name: 'Food bank' },
    { id: 'animals',  emoji: '🐾', name: 'Animal shelter' }
  ];

  // Changes of an account's mix allowed per calendar month (kids).
  var MIX_CHANGES_PER_MONTH = 1;

  var SOURCES = [
    { id: 'lemonade', emoji: '🍋', label: 'Lemonade stand' },
    { id: 'sales',    emoji: '🛍️', label: 'Selling things' },
    { id: 'chores',   emoji: '🧹', label: 'Chores & jobs' },
    { id: 'gifts',    emoji: '🎁', label: 'Gifts' },
    { id: 'other',    emoji: '⭐', label: 'Other' }
  ];

  // ── dates ──
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function days(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function today() { return iso(new Date()); }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

  function round2(x) { return Math.round(x * 100) / 100; }

  // ── ordering: by effective date, then entry time, then id ──
  function sortEvents(events) {
    return (events || []).filter(function (e) { return e && e.id && e.type; }).slice().sort(function (a, b) {
      var da = a.date || '', db = b.date || '';
      if (da !== db) return da < db ? -1 : 1;
      if ((a.ts || 0) !== (b.ts || 0)) return (a.ts || 0) - (b.ts || 0);
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }

  // ── prices ──
  // table: { 'YYYY-MM-DD': close } from the server, plus parent-typed
  // `price` events. A day with no close (weekend, holiday) uses the last
  // close before it; a day before the first known close uses the first.
  function priceTable(serverPrices, events) {
    var t = {};
    Object.keys(serverPrices || {}).forEach(function (d) {
      var v = Number(serverPrices[d]);
      if (isDate(d) && v > 0) t[d] = v;
    });
    (events || []).forEach(function (e) {
      if (e && e.type === 'price' && isDate(e.date) && Number(e.close) > 0 && !t[e.date]) t[e.date] = Number(e.close);
    });
    var dates = Object.keys(t).sort();
    return { map: t, dates: dates };
  }
  function priceOn(pt, date) {
    if (!pt || !pt.dates.length) return null;
    var lo = 0, hi = pt.dates.length - 1, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (pt.dates[mid] <= date) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return pt.map[pt.dates[best >= 0 ? best : 0]];
  }

  // ── household-wide settings over time ──
  function rateSchedule(sorted) {
    return sorted.filter(function (e) { return e.type === 'rate' && Number(e.rate) >= 0 && Number(e.rate) < 1; })
      .map(function (e) { return { from: e.date, rate: Number(e.rate) }; });
  }
  function rateOn(sched, date) {
    var r = DEFAULT_RATE;
    for (var i = 0; i < sched.length; i++) if (sched[i].from <= date) r = sched[i].rate;
    return r;
  }
  function matchPctOn(sorted, date) {
    var p = DEFAULT_MATCH;
    sorted.forEach(function (e) {
      if (e.type === 'matchPct' && e.date <= date && Number(e.pct) >= 0 && Number(e.pct) <= 100) p = Number(e.pct);
    });
    return p;
  }
  // Bond growth from d0 to d1, compounding daily at the rate in force each day.
  function growBonds(bal, d0, d1, sched) {
    if (!(bal > 0) || d1 <= d0) return bal;
    var cut = sched.map(function (s) { return s.from; }).filter(function (f) { return f > d0 && f < d1; });
    var pts = [d0].concat(cut, [d1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var r = rateOn(sched, pts[i]);
      bal *= Math.pow(1 + r, days(pts[i], pts[i + 1]) / 365);
    }
    return bal;
  }

  // ── accounts ──
  function accounts(events) {
    var out = {}, order = [];
    sortEvents(events).forEach(function (e) {
      if (e.type === 'account' && e.account && !out[e.account]) {
        out[e.account] = {
          id: e.account, name: String(e.name || 'Account'), emoji: e.emoji || '🏦',
          kind: e.kind === 'shared' ? 'shared' : 'own',
          members: Array.isArray(e.members) ? e.members.slice() : [],
          created: e.date, archived: false
        };
        order.push(e.account);
      } else if (e.type === 'accountEdit' && out[e.account]) {
        var a = out[e.account];
        if (e.name) a.name = String(e.name);
        if (e.emoji) a.emoji = e.emoji;
        if (Array.isArray(e.members) && e.members.length) a.members = e.members.slice();
        if (typeof e.archived === 'boolean') a.archived = e.archived;
      }
    });
    return order.map(function (id) { return out[id]; });
  }
  function sameName(a, b) { return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); }
  function isMember(acc, name) {
    return !!acc && acc.members.some(function (m) { return sameName(m, name); });
  }

  function voided(sorted) {
    var v = {};
    sorted.forEach(function (e) { if (e.type === 'void' && e.target) v[e.target] = true; });
    return v;
  }

  // A shared account's proposals and where each stands. A proposal
  // passes on the day its last member says yes; one "no" rejects it.
  // The proposer counts as a yes. Only the newest open proposal per
  // account is live — a new one replaces an older open one.
  function proposals(events, acc) {
    var sorted = sortEvents(events);
    var list = [];
    sorted.forEach(function (e) {
      if (e.type === 'proposal' && e.account === acc.id) {
        // A new proposal replaces an open one about the same thing.
        var k0 = e.givePct != null ? 'givePct' : e.cause != null ? 'cause' : 'bonds';
        list.forEach(function (p) { if (p.status === 'open' && p.kind === k0) p.status = 'replaced'; });
        var kind = e.givePct != null ? 'givePct' : e.cause != null ? 'cause' : 'bonds';
        list.push({ id: e.id, kind: kind, bonds: kind === 'bonds' ? clampPct(e.bonds) : null,
          givePct: kind === 'givePct' ? clampPct(e.givePct) : null, cause: kind === 'cause' ? String(e.cause) : null,
          by: e.by, date: e.date, ts: e.ts, votes: {}, status: 'open', passedOn: null });
        list[list.length - 1].votes[norm(e.by)] = true;
      } else if (e.type === 'vote') {
        var p = list.filter(function (x) { return x.id === e.proposal; })[0];
        if (!p || p.status !== 'open') return;
        if (!isMember(acc, e.by)) return;
        p.votes[norm(e.by)] = !!e.yes;
        if (!e.yes) { p.status = 'rejected'; return; }
        var all = acc.members.every(function (m) { return p.votes[norm(m)] === true; });
        if (all) { p.status = 'passed'; p.passedOn = e.date; }
      }
    });
    // A single-member "shared" account passes on proposal.
    list.forEach(function (p) {
      if (p.status === 'open' && acc.members.length && acc.members.every(function (m) { return p.votes[norm(m)] === true; })) {
        p.status = 'passed'; p.passedOn = p.date;
      }
    });
    return list;
  }
  function norm(n) { return String(n || '').trim().toLowerCase(); }
  function clampPct(x) { x = Math.round(Number(x)); return isNaN(x) ? DEFAULT_BONDS : Math.max(0, Math.min(100, x)); }

  // Every mix change that took effect for an account, in order:
  // direct `mix` events plus passed proposals.
  function mixChanges(events, acc) {
    var out = [];
    sortEvents(events).forEach(function (e) {
      if (e.type === 'mix' && e.account === acc.id) out.push({ date: e.date, ts: e.ts, bonds: clampPct(e.bonds), by: e.by, id: e.id });
    });
    if (acc.kind === 'shared') {
      proposals(events, acc).forEach(function (p) {
        if (p.status === 'passed' && p.kind === 'bonds') out.push({ date: p.passedOn, ts: p.ts, bonds: p.bonds, by: 'vote', id: p.id });
      });
    }
    return out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ts || 0) - (b.ts || 0); });
  }

  // Can a kid change this account's mix today? One change per calendar
  // month, and the very first choice is always free.
  function canChangeMix(events, acc, date) {
    var ch = mixChanges(events, acc);
    if (!ch.length) return { ok: true, first: true };
    var month = date.slice(0, 7);
    var n = ch.filter(function (c) { return c.date.slice(0, 7) === month && c.by !== 'parent'; }).length;
    if (n >= MIX_CHANGES_PER_MONTH) {
      var d = parse(date); d.setMonth(d.getMonth() + 1, 1);
      return { ok: false, next: iso(d) };
    }
    return { ok: true, first: false };
  }

  // ── giving ──
  function giveMinOn(sorted, date) {
    var p = DEFAULT_GIVE_MIN;
    sorted.forEach(function (e) {
      if (e.type === 'giveMin' && e.date <= date && Number(e.pct) >= 0 && Number(e.pct) <= 100) p = Number(e.pct);
    });
    return p;
  }
  // The account's giving % on a date: its own choice (direct, or a passed
  // vote on a shared account), never below the household minimum.
  function givePctOf(events, acc, date) {
    date = date || today();
    var sorted = sortEvents(events), chosen = null, at = '';
    sorted.forEach(function (e) {
      if (e.type === 'givePct' && e.account === acc.id && e.date <= date) { chosen = clampPct(e.pct); at = e.date; }
    });
    if (acc.kind === 'shared') {
      proposals(sorted, acc).forEach(function (p) {
        if (p.status === 'passed' && p.kind === 'givePct' && p.passedOn <= date && p.passedOn >= at) { chosen = p.givePct; at = p.passedOn; }
      });
    }
    var min = giveMinOn(sorted, date);
    return Math.max(min, chosen == null ? min : chosen);
  }
  function causes(events) {
    var list = DEFAULT_CAUSES.map(function (c) { return { id: c.id, emoji: c.emoji, name: c.name, removed: false }; });
    sortEvents(events).forEach(function (e) {
      if (e.type === 'cause' && e.cause && !list.some(function (c) { return c.id === e.cause; })) {
        list.push({ id: e.cause, emoji: e.emoji || '💛', name: String(e.name || 'A good cause'), removed: false });
      } else if (e.type === 'causeEdit') {
        var c = list.filter(function (x) { return x.id === e.cause; })[0];
        if (!c) return;
        if (e.name) c.name = String(e.name);
        if (e.emoji) c.emoji = e.emoji;
        if (typeof e.removed === 'boolean') c.removed = e.removed;
      }
    });
    return list;
  }
  // Where the account's next gift goes (its own pick or a passed vote),
  // falling back to the first place still on the list.
  function giveToOf(events, acc) {
    var sorted = sortEvents(events), pick = null, at = '';
    sorted.forEach(function (e) { if (e.type === 'giveTo' && e.account === acc.id) { pick = e.cause; at = e.date; } });
    if (acc.kind === 'shared') {
      proposals(sorted, acc).forEach(function (p) {
        if (p.status === 'passed' && p.kind === 'cause' && p.passedOn >= at) { pick = p.cause; at = p.passedOn; }
      });
    }
    var live = causes(sorted).filter(function (c) { return !c.removed; });
    return live.filter(function (c) { return c.id === pick; })[0] || live[0] || null;
  }

  // ── the core: an account's state on a date ──
  // Returns balances plus the running totals the page shows.
  function compute(events, accountId, prices, asOf) {
    asOf = asOf || today();
    var sorted = sortEvents(events);
    var acc = accounts(sorted).filter(function (a) { return a.id === accountId; })[0];
    var pt = prices && prices.map ? prices : priceTable(prices, sorted);
    var sched = rateSchedule(sorted);
    var gone = voided(sorted);

    var mixes = acc ? mixChanges(sorted, acc) : [];
    var st = {
      account: acc || null, asOf: asOf,
      bonds: 0, units: 0, bondsPct: DEFAULT_BONDS,
      deposited: 0, matched: 0, withdrawn: 0,
      giving: 0, setAside: 0, given: 0, givenByCause: {}, gifts: 0,
      bySource: {}, deposits: 0, firstDate: null,
      history: [], spPending: false
    };
    if (!acc) return finish(st, pt, asOf);

    // One timeline of the account's money events and mix changes.
    var tl = [];
    sorted.forEach(function (e) {
      if (e.account !== accountId || gone[e.id] || e.date > asOf) return;
      if (e.type === 'deposit' && Number(e.amount) > 0) tl.push({ date: e.date, ts: e.ts, kind: 'dep', e: e });
      else if (e.type === 'withdraw' && Number(e.amount) > 0) tl.push({ date: e.date, ts: e.ts, kind: 'wd', e: e });
      else if (e.type === 'give' && Number(e.amount) > 0) tl.push({ date: e.date, ts: e.ts, kind: 'give', e: e });
    });
    mixes.forEach(function (m) { if (m.date <= asOf) tl.push({ date: m.date, ts: m.ts, kind: 'mix', m: m }); });
    // Same day and same entry time (two devices, or a frozen test
    // clock): money in before mix changes, gifts and spending, so a gift
    // never meets an empty jar that the same day's deposit fills.
    var ORDER = { dep: 0, mix: 1, give: 2, wd: 3 };
    tl.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if ((a.ts || 0) !== (b.ts || 0)) return (a.ts || 0) - (b.ts || 0);
      return ORDER[a.kind] - ORDER[b.kind];
    });

    var cur = null; // date the bond balance is valued at
    function advance(to) {
      if (cur && to > cur) st.bonds = growBonds(st.bonds, cur, to, sched);
      cur = to;
    }
    function spValue(date) {
      var q = priceOn(pt, date);
      return q == null ? (st.spCost || 0) : st.units * q;
    }

    st.spCost = 0;
    tl.forEach(function (x) {
      advance(x.date);
      var p = priceOn(pt, x.date);
      if (x.kind === 'mix') {
        st.bondsPct = x.m.bonds;
        // Rebalance everything to the new mix on that day.
        var total = st.bonds + spValue(x.date);
        st.bonds = total * st.bondsPct / 100;
        var spPart = total - st.bonds;
        st.units = p ? spPart / p : 0; st.spCost = spPart;
      } else if (x.kind === 'dep') {
        var amt = Number(x.e.amount), m = Math.max(0, Number(x.e.match) || 0);
        // The Giving jar's share comes off the top and isn't invested.
        var g = Math.min(amt + m, Math.max(0, Number(x.e.give) || 0));
        var put = amt + m - g;
        st.giving += g; st.setAside += g;
        st.deposited += amt; st.matched += m; st.deposits++;
        if (!st.firstDate) st.firstDate = x.date;
        var src = x.e.source || 'other';
        st.bySource[src] = (st.bySource[src] || 0) + amt;
        var toB = put * st.bondsPct / 100, toS = put - toB;
        st.bonds += toB;
        if (p) st.units += toS / p;
        st.spCost += toS;
      } else if (x.kind === 'give') {
        var gv = Math.min(Number(x.e.amount), st.giving);
        st.giving -= gv; st.given += gv; st.gifts++;
        var c = x.e.cause || 'other';
        st.givenByCause[c] = (st.givenByCause[c] || 0) + gv;
      } else if (x.kind === 'wd') {
        var total2 = st.bonds + spValue(x.date);
        var take = Math.min(Number(x.e.amount), total2);
        st.withdrawn += take;
        if (total2 > 0) {
          var f = 1 - take / total2;
          st.bonds *= f; st.units *= f; st.spCost *= f;
        }
      }
      st.history.push({ date: x.date, kind: x.kind });
    });
    advance(asOf);
    return finish(st, pt, asOf);
  }

  function finish(st, pt, asOf) {
    var p = priceOn(pt, asOf);
    st.price = p;
    // No S&P price known at all yet (first day offline): hold at cost.
    // Once any close is known every date has a price, and the whole
    // log is recomputed with it.
    st.spPending = p == null && st.spCost > 0;
    st.spValue = p == null ? (st.spCost || 0) : st.units * p;
    st.value = st.bonds + st.spValue;
    // value = the invested money; the Giving jar is counted apart.
    st.putIn = st.deposited + st.matched - st.setAside;
    st.total = st.value + st.giving;
    st.growth = st.value - st.putIn + st.withdrawn;
    st.round = {
      value: round2(st.value), bonds: round2(st.bonds), sp: round2(st.spValue),
      deposited: round2(st.deposited), matched: round2(st.matched), withdrawn: round2(st.withdrawn),
      growth: round2(st.growth), giving: round2(st.giving), given: round2(st.given), total: round2(st.total)
    };
    return st;
  }

  // Value over time for the chart: one point per week from the first
  // deposit to asOf (plus asOf itself), with "money put in" alongside.
  function series(events, accountId, prices, asOf, maxPoints) {
    asOf = asOf || today();
    var sorted = sortEvents(events);
    var pt = prices && prices.map ? prices : priceTable(prices, sorted);
    var first = compute(sorted, accountId, pt, asOf).firstDate;
    if (!first) return [];
    var span = Math.max(1, days(first, asOf));
    var n = Math.min(maxPoints || 60, span + 1);
    var step = span / Math.max(1, n - 1);
    var out = [];
    for (var i = 0; i < n; i++) {
      var d = i === n - 1 ? asOf : addDays(first, Math.round(i * step));
      var s = compute(sorted, accountId, pt, d);
      out.push({ date: d, value: round2(s.value), putIn: round2(s.putIn - s.withdrawn) });
    }
    return out;
  }

  // Projection for the "time machine": monthly saving plus the mix's
  // long-run average (bonds at today's rate, S&P 500 at ~7% after
  // inflation — a cautious long-run figure, not a promise).
  var SP_LONG_RUN = 0.07;
  function project(now, perMonth, years, bondsPct, bondRate, matchPct) {
    var r = (bondsPct / 100) * (bondRate == null ? DEFAULT_RATE : bondRate) + (1 - bondsPct / 100) * SP_LONG_RUN;
    var m = Math.pow(1 + r, 1 / 12) - 1;
    var add = perMonth * (1 + (matchPct == null ? DEFAULT_MATCH : matchPct) / 100);
    var v = now, putIn = now;
    for (var i = 0; i < years * 12; i++) { v = v * (1 + m) + add; putIn += add; }
    return { value: round2(v), putIn: round2(putIn), rate: r };
  }

  // Real calendar-year returns of the S&P 500 (price only, %), used to
  // show what a mix would have done in a good and a bad year.
  var SP_YEARS = { 2008: -38.5, 2013: 29.6, 2019: 28.9, 2022: -19.4, 2023: 24.2 };
  function yearFor(bondsPct, spReturnPct, bondRate) {
    var b = bondsPct / 100;
    return round2((b * (bondRate == null ? DEFAULT_RATE : bondRate) * 100) + (1 - b) * spReturnPct);
  }

  // How far the S&P 500 is below its high of the last 30 days (%), for
  // the "markets go down sometimes" card. null if unknown.
  function dropFromHigh(prices, asOf) {
    var pt = prices && prices.map ? prices : priceTable(prices, []);
    asOf = asOf || today();
    var from = addDays(asOf, -30);
    var recent = pt.dates.filter(function (d) { return d >= from && d <= asOf; });
    if (recent.length < 2) return null;
    var hi = Math.max.apply(null, recent.map(function (d) { return pt.map[d]; }));
    var last = pt.map[recent[recent.length - 1]];
    return round2((1 - last / hi) * 100);
  }

  function uid(prefix) {
    return (prefix || 'e') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  var api = {
    SOURCES: SOURCES, DEFAULT_RATE: DEFAULT_RATE, DEFAULT_MATCH: DEFAULT_MATCH, DEFAULT_BONDS: DEFAULT_BONDS,
    SP_YEARS: SP_YEARS, SP_LONG_RUN: SP_LONG_RUN,
    today: today, iso: iso, addDays: addDays, days: days, isDate: isDate, round2: round2,
    sortEvents: sortEvents, priceTable: priceTable, priceOn: priceOn,
    accounts: accounts, isMember: isMember, sameName: sameName,
    proposals: proposals, mixChanges: mixChanges, canChangeMix: canChangeMix,
    DEFAULT_GIVE_MIN: DEFAULT_GIVE_MIN, causes: causes, givePctOf: givePctOf, giveToOf: giveToOf,
    giveMinOn: function (events, date) { return giveMinOn(sortEvents(events), date || today()); },
    rateOn: function (events, date) { return rateOn(rateSchedule(sortEvents(events)), date || today()); },
    matchPctOn: function (events, date) { return matchPctOn(sortEvents(events), date || today()); },
    compute: compute, series: series, project: project, yearFor: yearFor, dropFromHigh: dropFromHigh,
    uid: uid
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BankEngine = api;
})(this);
