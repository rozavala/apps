/* ================================================================
   FAMILY SUNDAY REPORT — sunday-report.js
   Reads ActivityLog, getPlayerStats, Routines, the progress catalog
   (through ProgressAdmin), Banco Familia (BankEngine, household key
   zs_bank) and profile data to produce a weekly family summary that
   prints well and can be shared as an image. Per kid: the week (minutes
   per subject, stars, streaks), what is going well and what they are
   still working on, one suggested next step that opens a real app, and
   the week's Banco Familia.

   Read-only: no writes to localStorage, no network calls.
   Query params:
     ?week=YYYY-MM-DD  Monday anchor; default = this week (local time)
   ================================================================ */

var SundayReport = (function() {
  'use strict';

  var APP_LABELS = {
    math: 'Math Galaxy', chile: 'Descubre Chile', chess: 'Chess Quest',
    piano: 'Little Maestro', faith: 'Fe Explorador', guitar: 'Guitar Jam',
    art: 'Art Studio', sports: 'Sports Arena', lab: 'Lab Explorer',
    world: 'World Explorer', story: 'Story Explorer', guess: 'Guess Quest',
    quest: 'Quest Adventure', bmcheck: 'Book & Movie Check',
    Routines: 'Routines'
  };

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _getParam(k) {
    var m = window.location.search.match(new RegExp('[?&]' + k + '=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function _mondayAnchor(d) {
    // Return the Monday of the week containing d (local time).
    var day = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    var offset = (day === 0 ? -6 : 1 - day);
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
    m.setHours(0, 0, 0, 0);
    return m;
  }

  function _weekBounds() {
    var param = _getParam('week');
    var base;
    if (param && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
      var parts = param.split('-');
      base = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      base = new Date();
    }
    var from = _mondayAnchor(base);
    var to = new Date(from.getTime() + 7 * 24 * 3600 * 1000 - 1);
    return { from: from, to: to };
  }

  function _fmtDate(d) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate();
  }

  function _fmtDateRange(from, to) {
    return _fmtDate(from) + ' – ' + _fmtDate(to) + ', ' + to.getFullYear();
  }

  function _timeOfDayLabel(ts) {
    var d = new Date(ts);
    var m = d.getMonth() + 1;
    return (d.getDate()) + '/' + m;
  }

  // Banco Familia: the kid's latest monthly statement as of the end of the
  // week, summed over their accounts (a shared account counts for each
  // member). null if they have no account or no finished month yet.
  function _bankLine(name, weekTo) {
    if (typeof BankEngine === 'undefined') return null;
    try {
      var bank = JSON.parse(localStorage.getItem('zs_bank') || 'null') || {};
      var events = Array.isArray(bank.events) ? bank.events : [];
      var spx = (JSON.parse(localStorage.getItem('zs_bank_spx') || 'null') || {}).prices || {};
      var asOf = BankEngine.iso(weekTo);
      var out = null;
      BankEngine.accounts(events).forEach(function(a) {
        if (a.archived || !BankEngine.isMember(a, name)) return;
        var m = BankEngine.statementMonths(events, a.id, spx, asOf)[0];
        if (!m) return;
        var st = BankEngine.statement(events, a.id, spx, m);
        if (!out) out = { month: m, saved: 0, matched: 0, growth: 0, given: 0, end: 0 };
        if (out.month !== m) return;
        out.saved += st.saved; out.matched += st.matched; out.growth += st.growth; out.given += st.given; out.end += st.end;
      });
      return out;
    } catch (e) { return null; }
  }
  function _money(x) { return '$' + (Math.round(x * 100) / 100).toFixed(2); }
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ── Banco Familia, this week ─────────────────────────────────────
  // The kid's accounts (a shared account counts for each member), the
  // week's change: what was saved (plus the parents' match), what was
  // given from the Giving jar, how much it grew by itself, and the
  // balance at the end of the week. null if no account yet.
  function _bankWeek(name, bounds, now) {
    if (typeof BankEngine === 'undefined') return null;
    try {
      var bank = JSON.parse(localStorage.getItem('zs_bank') || 'null') || {};
      var events = Array.isArray(bank.events) ? bank.events : [];
      var spx = (JSON.parse(localStorage.getItem('zs_bank_spx') || 'null') || {}).prices || {};
      var weekEnd = BankEngine.iso(bounds.to);
      var today = BankEngine.iso(now);
      var asOf = weekEnd < today ? weekEnd : today;
      var before = BankEngine.addDays(BankEngine.iso(bounds.from), -1);
      var out = null;
      BankEngine.accounts(events).forEach(function(a) {
        if (a.archived || !BankEngine.isMember(a, name)) return;
        var b = BankEngine.compute(events, a.id, spx, asOf);
        if (!b.firstDate) return;                       // nothing in this account yet
        var z = BankEngine.compute(events, a.id, spx, before);
        if (!out) out = { saved: 0, matched: 0, given: 0, growth: 0, balance: 0 };
        out.saved += b.deposited - z.deposited;
        out.matched += b.matched - z.matched;
        out.given += b.given - z.given;
        out.growth += b.growth - z.growth;
        out.balance += b.total;
      });
      if (out) Object.keys(out).forEach(function(k) { out[k] = Math.round(out[k] * 100) / 100; });
      return out;
    } catch (e) { return null; }
  }

  // ── What the log can tell us ─────────────────────────────────────
  function _dayKey(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // The activity log keeps when something happened, not for how long.
  // So minutes are an estimate: each recorded event is credited the time
  // since the one before it when that was ten minutes or less (they were
  // in the middle of playing), and five minutes otherwise (the start of a
  // session). Rounded, and always shown as "about".
  var GAP_MAX = 10 * 60000, SESSION_START = 5 * 60000;

  // Stars named in a log line: "— 3 stars", "(2★)", "Ganó una estrella".
  function _starsIn(desc) {
    var s = String(desc || '');
    var m = /(\d+)\s*(?:★|⭐|stars?\b|estrellas?\b)/i.exec(s);
    if (m) return Math.min(5, parseInt(m[1], 10));
    return /\b(?:una|a|one)\s+(?:estrella|star)\b/i.test(s) ? 1 : 0;
  }

  function _hubApp(logName) {
    return typeof HubPlan !== 'undefined' && HubPlan.appForLogName ? HubPlan.appForLogName(logName) : null;
  }
  function _groupOf(app) {
    return app && app.group && app.group !== 'more' ? app.group : 'other';
  }
  function _groupInfo(id) {
    var g = null;
    if (typeof HubPlan !== 'undefined') HubPlan.GROUPS.forEach(function(x) { if (x.id === id) g = x; });
    return g ? { icon: g.icon, name: g.en } : { icon: '✨', name: 'Other' };
  }

  // What the apps are called, by their id in HubPlan.APPS.
  var APP_NAMES = {
    math: 'Math Galaxy', guess: 'Guess Quest', chess: 'Chess Quest', clock: '¿Qué Hora Es?', euclid: "Euclid's Workshop",
    lab: 'Lab Explorer', naturaleza: 'Explorador de Naturaleza', cocina: 'Cocina Lab', circuit: 'Circuit Lab',
    engineer: 'Little Engineer', marinero: 'Marinero', secretos: 'Mensajes Secretos', code: 'Code Cadet',
    story: 'Story Explorer', vocab: 'Vocabulario Vivo', world: 'World Explorer', quest: 'Quest Adventure',
    chile: 'Descubre Chile', atlas: 'World Atlas', civics: 'Civics Lab', faith: 'Fe Explorador', bible: 'Bible Explorer',
    piano: 'Little Maestro', art: 'Art Studio', guitar: 'Guitar Jam', bank: 'Banco Familia', money: 'Money Master',
    negocio: 'Mi Negocio', invest: 'Invest Quest', move: 'Move Quest', sports: 'Sports Arena', worldcup: 'World Cup 2026', review: 'Repaso', lector: 'Lector'
  };
  function _appName(app) { return app ? (APP_NAMES[app.id] || app.id) : ''; }

  function _plural(noun, n) {
    if (n === 1) return noun;
    return /y$/.test(noun) ? noun.slice(0, -1) + 'ies' : noun + 's';
  }

  // ── Extra insight sources ────────────────────────────────────────
  // REPASO HOOK. The review items that keep coming back ("Repaso") have
  // not landed yet. When they do, register a function from the Repaso
  // module and its lines join "Going well" / "Still working on":
  //   SundayReport.addInsightSource(function(kidName) {
  //     return { strong: [{ text: '…' }], working: [{ text: '…' }] };
  //   });
  // Until then nothing is registered and the report leaves that source out.
  var _insightSources = [];
  function addInsightSource(fn) { if (typeof fn === 'function') _insightSources.push(fn); }

  // Progress-catalog view of one kid: apps they have started, how far,
  // and what comes next. Reads through ProgressAdmin (the same reader
  // Parents Corner uses), so the numbers match the Progress Manager.
  function _catalogStates(name) {
    var out = [];
    if (typeof ProgressAdmin === 'undefined') return out;
    ProgressAdmin.APPS.forEach(function(a) {
      if (a.mode !== 'sequence') return;
      var st;
      try { st = ProgressAdmin.getState(name, a.id); } catch (e) { return; }
      if (!st || !st.hasData || !st.total || st.doneCount < 1) return;
      out.push({
        id: a.id, label: a.label, href: a.href, noun: a.noun || 'step',
        done: st.doneCount, total: st.total, finished: !st.current,
        prev: st.units[st.doneCount - 1] || null, current: st.current,
        fraction: st.doneCount / st.total
      });
    });
    return out;
  }

  // ── The model for one kid ────────────────────────────────────────
  function _kidModel(p, bounds, now) {
    var name = p.name;
    var nameKey = name.toLowerCase().replace(/\s+/g, '_');
    var fromMs = bounds.from.getTime(), toMs = bounds.to.getTime();
    var playerStats = typeof getPlayerStats === 'function' ? getPlayerStats(name) : { totalStars: 0, appStats: {} };
    var log = [];
    try { log = (typeof ActivityLog !== 'undefined' && ActivityLog.getForUser) ? ActivityLog.getForUser(name) : []; } catch (e) {}
    log = log.filter(function(e) { return e && typeof e.ts === 'number'; }).sort(function(a, b) { return a.ts - b.ts; });
    var weekLog = log.filter(function(e) { return e.ts >= fromMs && e.ts <= toMs; });
    var logIsFull = log.length >= 100 && log[0].ts > fromMs;   // the log keeps the last 100 entries

    // minutes per subject, stars noted, last time in each app
    var minutes = {}, minutesByApp = {}, lastByApp = {}, appCounts = {}, stars = 0, total = 0, prevMapped = null;
    log.forEach(function(e) {
      var app = _hubApp(e.app);
      if (app) lastByApp[app.id] = e.ts;
      if (e.ts < fromMs || e.ts > toMs) { if (app) prevMapped = e.ts; return; }
      appCounts[e.app || 'Other'] = (appCounts[e.app || 'Other'] || 0) + 1;
      stars += _starsIn(e.desc);
      if (!app) return;
      var gap = prevMapped == null ? Infinity : e.ts - prevMapped;
      var credit = gap <= GAP_MAX ? Math.max(60000, gap) : SESSION_START;
      var g = _groupOf(app);
      minutes[g] = (minutes[g] || 0) + credit;
      minutesByApp[app.id] = (minutesByApp[app.id] || 0) + credit;
      total += credit;
      prevMapped = e.ts;
    });
    var subjects = Object.keys(minutes).map(function(g) {
      var info = _groupInfo(g);
      return { id: g, icon: info.icon, name: info.name, min: Math.max(1, Math.round(minutes[g] / 60000)) };
    }).sort(function(a, b) { return b.min - a.min; });

    // days active and the day streak
    var days = {}, weekDays = {};
    log.forEach(function(e) { days[_dayKey(e.ts)] = true; if (e.ts >= fromMs && e.ts <= toMs) weekDays[_dayKey(e.ts)] = true; });
    var endMs = Math.min(toMs, now.getTime());
    var d = new Date(endMs);
    if (!days[_dayKey(d.getTime())]) d.setDate(d.getDate() - 1);   // today may still be ahead of them
    var streak = 0;
    while (days[_dayKey(d.getTime())] && streak < 400) { streak++; d.setDate(d.getDate() - 1); }

    // Routines streak
    var routineStreak = 0;
    try {
      var raw = localStorage.getItem('zs_routines_' + nameKey);
      var rd = raw ? JSON.parse(raw) : null;
      if (rd && typeof rd.streak === 'number') routineStreak = rd.streak;
    } catch (e) {}

    // Top apps, and a few highlights. Book & Movie Check lines name
    // titles and verdicts: they stay out of a sheet that goes on the fridge.
    var topApps = Object.keys(appCounts).sort(function(a, b) { return appCounts[b] - appCounts[a]; }).slice(0, 3)
      .map(function(app) { return { app: app, count: appCounts[app] }; });
    var seen = {}, highlights = [];
    weekLog.forEach(function(e) {
      if (highlights.length >= 4 || e.app === 'Book & Movie Check') return;
      var tag = e.app + '|' + (e.desc || '').slice(0, 40);
      if (seen[tag]) return;
      seen[tag] = true;
      highlights.push(e);
    });

    var rank = typeof getExplorerRank === 'function' ? getExplorerRank(name, playerStats) : { icon: '🛸', name: 'Cadet' };

    var model = {
      profile: p, name: name, rank: rank,
      totalStars: playerStats.totalStars || 0, stats: playerStats,
      events: weekLog.length, starsWeek: stars, minutes: Math.round(total / 60000),
      subjects: subjects, minutesByApp: minutesByApp, lastByApp: lastByApp,
      daysActive: Object.keys(weekDays).length, streak: streak, routineStreak: routineStreak,
      topApps: topApps, highlights: highlights, logIsFull: logIsFull,
      bank: _bankWeek(name, bounds, now), bankMonth: _bankLine(name, bounds.to)
    };
    model.catalog = _catalogStates(name);
    var ins = _insights(model);
    model.strong = ins.strong; model.working = ins.working;
    model.suggestion = _suggest(model, now);
    return model;
  }

  // ── Going well / still working on ────────────────────────────────
  function _progressText(c) {
    return c.finished
      ? 'all ' + c.total + ' ' + _plural(c.noun, c.total) + ' done'
      : c.done + ' of ' + c.total + ' ' + _plural(c.noun, c.total) + ' done';
  }
  function _insights(m) {
    var strong = [], working = [];
    var byFraction = m.catalog.filter(function(c) { return c.finished || c.done >= 3; })
      .sort(function(a, b) { return (b.fraction - a.fraction) || (b.done - a.done); }).slice(0, 2);
    byFraction.forEach(function(c) { strong.push({ text: c.label + ' — ' + _progressText(c) }); });
    var skip = {};
    byFraction.forEach(function(c) { skip[c.id] = true; });
    // Started but still near the beginning: the ones to sit down with.
    var open = {};
    _eligibleApps(m.profile).forEach(function(x) { open[x.id] = true; });
    m.catalog.filter(function(c) { return !skip[c.id] && !c.finished && c.fraction < 0.5 && open[_hubIdFor(c.href)]; })
      .sort(function(a, b) {
        var la = m.lastByApp[_hubIdFor(a.href)] || 0, lb = m.lastByApp[_hubIdFor(b.href)] || 0;
        return (lb - la) || (a.fraction - b.fraction);
      }).slice(0, 2).forEach(function(c) {
        working.push({ text: c.label + ' — ' + _progressText(c) + (c.current ? '; next up ' + c.current.l : '') });
      });
    _insightSources.forEach(function(fn) {
      try {
        var r = fn(m.name) || {};
        (r.strong || []).forEach(function(x) { if (x && x.text) strong.push({ text: String(x.text) }); });
        (r.working || []).forEach(function(x) { if (x && x.text) working.push({ text: String(x.text) }); });
      } catch (e) {}
    });
    return { strong: strong, working: working };
  }

  function _hubIdFor(href) {
    var a = typeof HubPlan !== 'undefined' && HubPlan.appForHref ? HubPlan.appForHref(href) : null;
    return a ? a.id : null;
  }

  // ── Suggested next ───────────────────────────────────────────────
  // One concrete nudge that points to an app the kid can open: it is in
  // HubPlan.APPS, and the kid's age, the apps a parent hid and (for the
  // youngest) the short list all allow it.
  function _eligibleApps(p) {
    if (typeof HubPlan === 'undefined') return [];
    var little = HubPlan.isLittle(p);
    return HubPlan.APPS.filter(function(a) {
      if (a.list === false) return false;
      if (!HubPlan.allowed(p, a)) return false;
      if (a.id === 'faith' && p.faithVisible === false) return false;
      if (little && !a.beginner) return false;
      return true;
    });
  }

  function _hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function _suggest(m, now) {
    var p = m.profile;
    var eligible = _eligibleApps(p);
    var byId = {};
    eligible.forEach(function(a) { byId[a.id] = a; });
    var first = p.name;
    var DAY = 86400000;

    // 1. Pick up where they are: an unfinished app they have started,
    //    the one they played most recently first.
    var cont = m.catalog.filter(function(c) { return !c.finished && c.current && byId[_hubIdFor(c.href)]; })
      .sort(function(a, b) {
        var la = m.lastByApp[_hubIdFor(a.href)] || 0, lb = m.lastByApp[_hubIdFor(b.href)] || 0;
        return (lb - la) || (b.done - a.done);
      });
    if (cont.length) {
      var c = cont[0], app = byId[_hubIdFor(c.href)];
      var recent = (m.lastByApp[app.id] || 0) > now.getTime() - 14 * DAY;
      return {
        kind: 'continue', app: app, appName: _appName(app), href: app.href,
        text: first + ' finished ' + (c.prev ? c.prev.l : 'the first steps') + ' in ' + _appName(app) + '. ' +
          (recent ? 'Next up: ' : 'Whenever there is a spare ten minutes, next up is ') + c.current.l + '.'
      };
    }

    // 2. A week with some play: something from a subject that was quiet.
    var playedGroups = {};
    m.subjects.forEach(function(s) { playedGroups[s.id] = true; });
    if (m.subjects.length) {
      var fresh = eligible.filter(function(a) { return !playedGroups[_groupOf(a)] && !m.minutesByApp[a.id]; });
      if (fresh.length) {
        var stars = function(a) {
          try { return typeof getAppStars === 'function' && m.stats.appStats ? getAppStars(a.id, m.stats.appStats[a.id] || {}) : 0; } catch (e) { return 0; }
        };
        fresh.sort(function(a, b) {
          return (stars(a) - stars(b)) || ((m.lastByApp[a.id] || 0) - (m.lastByApp[b.id] || 0)) ||
            (_hash(first + a.id + _dayKey(now.getTime())) - _hash(first + b.id + _dayKey(now.getTime())));
        });
        var f = fresh[0], g = _groupInfo(_groupOf(f));
        return {
          kind: 'fresh', app: f, appName: _appName(f), href: f.href,
          text: 'A change of pace for ' + first + ': ' + _appName(f) + ' (' + g.name + '), a different kind of fun from this week.'
        };
      }
    }

    // 3. A quiet week, or nothing else fits: an easy, friendly way back in.
    var pick = null;
    if (eligible.length && typeof HubPlan.pickToday === 'function') {
      try {
        var ids = HubPlan.pickToday(p, eligible.map(function(a) { return a.id; }),
          { now: now, activity: { last: m.lastByApp, today: {} }, stats: m.stats, scheduled: [] });
        pick = byId[ids[0]] || null;
      } catch (e) {}
    }
    if (!pick) pick = eligible[0] || HubPlan.APPS.filter(function(a) { return a.id === 'math'; })[0];
    return {
      kind: m.subjects.length ? 'open' : 'gentle', app: pick, appName: _appName(pick), href: pick.href,
      text: (m.subjects.length ? '' : 'A quiet week is fine. ') + 'No pressure: ten minutes of ' + _appName(pick) + ' together would be a nice way to start.'
    };
  }

  // ── Rendering ────────────────────────────────────────────────────
  function _list(items, icon) {
    return items.map(function(x) {
      return '<div class="sr-moment"><span class="ic">' + icon + '</span><span class="ds">' + _esc(x.text) + '</span></div>';
    }).join('');
  }

  function _weekBlock(m) {
    var max = m.subjects.length ? m.subjects[0].min : 1;
    var bars = m.subjects.slice(0, 5).map(function(s) {
      return '<div class="sr-bar" data-subject="' + _esc(s.id) + '">' +
        '<span class="sr-bar-name">' + s.icon + ' ' + _esc(s.name) + '</span>' +
        '<span class="sr-bar-track"><span class="sr-bar-fill" style="width:' + Math.max(6, Math.round(s.min / max * 100)) + '%"></span></span>' +
        '<span class="sr-bar-min">about ' + s.min + ' min</span></div>';
    }).join('');
    return '<div class="sr-kid-grid">' +
        '<div class="sr-stat-pill"><div class="num">⏱ ' + m.minutes + '</div><div class="lbl">Minutes (about)</div></div>' +
        '<div class="sr-stat-pill"><div class="num">⭐ ' + m.starsWeek + '</div><div class="lbl">Stars this week</div></div>' +
        '<div class="sr-stat-pill"><div class="num">📅 ' + m.daysActive + '/7</div><div class="lbl">Days played</div></div>' +
        '<div class="sr-stat-pill"><div class="num">🔥 ' + m.streak + '</div><div class="lbl">Day streak</div></div>' +
        (m.routineStreak ? '<div class="sr-stat-pill"><div class="num">✅ ' + m.routineStreak + '</div><div class="lbl">Routine streak</div></div>' : '') +
        '<div class="sr-stat-pill"><div class="num">' + m.rank.icon + '</div><div class="lbl">' + _esc(m.rank.name) + ' · ⭐ ' + m.totalStars + '</div></div>' +
      '</div>' +
      (bars ? '<div class="sr-moments sr-subjects"><h3>Time by subject</h3>' + bars +
        '<div class="sr-note">Minutes are estimated from the times the apps recorded.' +
        (m.logIsFull ? ' The log holds the latest 100 entries, so the start of a very busy week may be missing.' : '') + '</div></div>' : '');
  }

  function _insightBlock(m) {
    if (!m.strong.length && !m.working.length) return '';
    return '<div class="sr-two">' +
      '<div class="sr-moments sr-strong"><h3>🌟 Going well</h3>' +
        (m.strong.length ? _list(m.strong, '•') : '<div class="sr-note">Nothing to show yet.</div>') + '</div>' +
      '<div class="sr-moments sr-working"><h3>🌱 Still working on</h3>' +
        (m.working.length ? _list(m.working, '•') : '<div class="sr-note">Nothing waiting.</div>') + '</div>' +
      '</div>';
  }

  function _suggestBlock(m) {
    var s = m.suggestion;
    return '<div class="sr-next" data-kind="' + _esc(s.kind) + '"><h3>👉 Suggested next</h3>' +
      '<div class="sr-next-text">' + _esc(s.text) + '</div>' +
      '<a class="sr-next-link" href="' + _esc(s.href) + '" data-app="' + _esc(s.app.id) + '">Open ' + _esc(s.appName) + ' →</a></div>';
  }

  function _bankBlock(m) {
    var b = m.bank;
    var out = '';
    if (b) {
      var saved = b.saved + b.matched;
      out += '<div class="sr-moments sr-bank-week"><h3>🏦 Banco Familia · this week</h3>' +
        '<div class="sr-moment"><span class="ic">💵</span><span class="ds">Saved ' + _money(b.saved) +
          (b.matched > 0 ? ' (+' + _money(b.matched) + ' from Papá &amp; Mamá)' : '') + '</span></div>' +
        '<div class="sr-moment"><span class="ic">💛</span><span class="ds">' + (b.given > 0 ? 'Gave ' + _money(b.given) : 'Nothing given this week') + '</span></div>' +
        '<div class="sr-moment"><span class="ic">' + (b.growth >= 0 ? '🌱' : '🌧️') + '</span><span class="ds">' +
          (Math.abs(b.growth) < 0.005 ? 'No change from growth this week' : b.growth > 0 ? 'Grew by itself ' + _money(b.growth) : 'Market dip ' + _money(-b.growth) + ' (it moves up and down)') + '</span></div>' +
        '<div class="sr-moment"><span class="ic">🏦</span><span class="ds">Balance now <b>' + _money(b.balance) + '</b></span></div></div>';
    }
    var bk = m.bankMonth;
    if (bk) {
      out += '<div class="sr-moments"><h3>🏦 Banco Familia · ' + MONTH_NAMES[+bk.month.slice(5) - 1] + '</h3>' +
        '<div class="sr-moment"><span class="ic">💵</span><span class="ds">Saved ' + _money(bk.saved) + (bk.matched > 0 ? ' (+' + _money(bk.matched) + ' from Papá &amp; Mamá)' : '') + '</span></div>' +
        (Math.abs(bk.growth) >= 0.005 ? '<div class="sr-moment"><span class="ic">' + (bk.growth > 0 ? '🌱' : '🌧️') + '</span><span class="ds">' + (bk.growth > 0 ? 'Grew by itself ' + _money(bk.growth) : 'Market dip ' + _money(-bk.growth)) + '</span></div>' : '') +
        (bk.given > 0 ? '<div class="sr-moment"><span class="ic">💛</span><span class="ds">Gave ' + _money(bk.given) + '</span></div>' : '') +
        '<div class="sr-moment"><span class="ic">🏦</span><span class="ds">Balance at month end ' + _money(bk.end) + '</span></div></div>';
    }
    return out;
  }

  var _models = [];
  var _bounds = null;

  function _render() {
    var bounds = _weekBounds();
    _bounds = bounds;
    var now = new Date();
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    var content = document.getElementById('sr-content');
    if (!content) return;
    _models = [];

    if (!profiles || profiles.length === 0) {
      content.innerHTML = '<div class="sr-sheet"><div class="sr-kid-empty">No profiles found yet. Add a kid in the hub first.</div></div>';
      return;
    }

    var kidBlocks = '';
    var familyStars = 0, familyStarsWeek = 0, familyEvents = 0, familyMinutes = 0;
    var bestStreak = { name: '', streak: 0 };

    profiles.forEach(function(p) {
      var m = _kidModel(p, bounds, now);
      _models.push(m);
      familyStars += m.totalStars;
      familyStarsWeek += m.starsWeek;
      familyEvents += m.events;
      familyMinutes += m.minutes;
      if (m.routineStreak > bestStreak.streak) bestStreak = { name: p.name, streak: m.routineStreak };

      var color = typeof safeColor === 'function' ? safeColor(p.color) : (p.color || '#7C3AED');
      var quiet = m.events === 0;
      var body;
      if (quiet) {
        body = '<div class="sr-kid-empty">No recorded activity this week. That is okay: a fresh week is a fresh start.</div>' +
          _insightBlock(m) + _suggestBlock(m) + _bankBlock(m);
      } else {
        var appLines = m.topApps.map(function(a) {
          var label = APP_LABELS[a.app] || a.app;
          return '<div class="sr-moment"><span class="ic">•</span><span class="ds">' + _esc(label) + '</span><span class="ts">' + a.count + '×</span></div>';
        }).join('');
        var highlightLines = m.highlights.map(function(h) {
          return '<div class="sr-moment"><span class="ic">' + _esc(h.icon || '⭐') + '</span>' +
            '<span class="ds">' + _esc((h.desc || '').slice(0, 80)) + '</span>' +
            '<span class="ts">' + _timeOfDayLabel(h.ts) + '</span></div>';
        }).join('');
        body = _weekBlock(m) + _insightBlock(m) + _suggestBlock(m) + _bankBlock(m) +
          (appLines ? '<div class="sr-moments"><h3>Most active apps</h3>' + appLines + '</div>' : '') +
          (highlightLines ? '<div class="sr-moments"><h3>Highlights</h3>' + highlightLines + '</div>' : '');
      }

      kidBlocks +=
        '<div class="sr-kid" data-kid="' + _esc(p.name) + '">' +
          '<div class="sr-kid-head">' +
            '<div class="sr-kid-avatar" style="background:' + color + '22;border-color:' + color + ';">' + _esc(p.avatar || '🦊') + '</div>' +
            '<div>' +
              '<div class="sr-kid-name">' + _esc(p.name) + (p.age ? ' · ' + _esc(p.age) + ' yrs' : '') + '</div>' +
              '<div class="sr-kid-rank">' + m.rank.icon + ' ' + _esc(m.rank.name) + '</div>' +
            '</div>' +
          '</div>' +
          body +
        '</div>';
    });

    var highlight;
    if (bestStreak.streak > 0) {
      highlight = '🔥 Longest routine streak this week: <b>' + _esc(bestStreak.name) + '</b> with ' + bestStreak.streak + ' day' + (bestStreak.streak === 1 ? '' : 's') + '.';
    } else if (familyEvents > 0) {
      highlight = 'A busy week across the suite. Keep it going!';
    } else {
      highlight = 'A quieter week. Consider trying a new app together.';
    }

    content.innerHTML =
      '<div class="sr-sheet">' +
        '<div class="sr-header">' +
          '<div class="sr-title">👨‍👩‍👧‍👦 Family Sunday Report</div>' +
          '<div class="sr-subtitle">Zavala · Serra</div>' +
          '<div class="sr-dates">' + _fmtDateRange(bounds.from, bounds.to) + '</div>' +
        '</div>' +
        '<div class="sr-family">' +
          '<h2>This week in one glance</h2>' +
          '<div class="sr-family-stats">' +
            '<div class="sr-family-stat"><div class="num">⭐ ' + familyStars + '</div><div class="lbl">Family stars</div></div>' +
            '<div class="sr-family-stat"><div class="num">⏱ ' + familyMinutes + '</div><div class="lbl">Minutes (about)</div></div>' +
            '<div class="sr-family-stat"><div class="num">' + familyEvents + '</div><div class="lbl">Recorded events</div></div>' +
            '<div class="sr-family-stat"><div class="num">👧👦 ' + profiles.length + '</div><div class="lbl">Explorers</div></div>' +
          '</div>' +
          '<div class="sr-family-highlight">' + highlight + '</div>' +
        '</div>' +
        kidBlocks +
        '<div class="sr-footer">Generated ' + new Date().toLocaleString() + ' · Print to stick on the fridge.</div>' +
      '</div>';

    document.title = 'Family Sunday Report — ' + _fmtDateRange(bounds.from, bounds.to);
  }

  // ── Share as an image ────────────────────────────────────────────
  // A summary card drawn on a canvas (no libraries): each kid's week and
  // next step. Bank balances are left off the picture, since it is made
  // to be sent; saved and given this week are enough.
  var IMG_FONT = "'Nunito','Baloo 2',system-ui,-apple-system,'Segoe UI',sans-serif";

  function _wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function(w) {
      var t = line ? line + ' ' + w : w;
      if (line && ctx.measureText(t).width > maxW) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }

  function _paint(ctx, W, dry) {
    var M = 56, y = 0;
    function font(size, weight) { ctx.font = (weight || 600) + ' ' + size + 'px ' + IMG_FONT; }
    function text(t, x, yy, size, weight, color, align) {
      font(size, weight);
      if (!dry) { ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.fillText(t, x, yy); }
    }
    function para(t, x, yy, size, weight, color, maxW, lh) {
      font(size, weight);
      var lines = _wrap(ctx, t, maxW);
      lines.forEach(function(l, i) { text(l, x, yy + i * lh, size, weight, color); });
      return lines.length * lh;
    }
    if (!dry) {
      ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, ctx.canvas.height);
    }
    y = 84;
    text('Family Sunday Report', W / 2, y, 52, 800, '#1f1934', 'center');
    y += 52;
    text(_fmtDateRange(_bounds.from, _bounds.to), W / 2, y, 28, 700, '#7a2a2a', 'center');
    y += 56;

    _models.forEach(function(m) {
      var cardTop = y, innerX = M + 28, innerW = W - 2 * M - 56;
      // size the card first (dry measure), then draw it
      var h = 0;
      h += 90;                                                   // name row
      h += 44;                                                   // stats row
      var top = m.subjects[0];
      if (top) h += 40;
      var nextH = (function() { font(28, 600); return _wrap(ctx, 'Next: ' + m.suggestion.text, innerW).length * 38; })();
      h += nextH + 14;
      if (m.bank) h += 40;
      h += 24;
      if (!dry) {
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(201,164,73,0.5)'; ctx.lineWidth = 3;
        _roundRect(ctx, M, cardTop, W - 2 * M, h, 26); ctx.fill(); ctx.stroke();
      }
      var cy = cardTop + 62;
      text((m.profile.avatar || '🦊') + '  ' + m.name, innerX, cy, 40, 800, '#1f1934');
      cy += 52;
      text(m.events === 0 ? 'A quiet week, and that is okay.'
        : 'About ' + m.minutes + ' min  ·  ' + m.starsWeek + ' stars  ·  ' + m.daysActive + '/7 days  ·  ' + m.streak + '-day streak',
        innerX, cy, 28, 700, '#3c3256');
      cy += 44;
      if (top) { text('Most time: ' + top.name + ' (about ' + top.min + ' min)', innerX, cy, 26, 600, '#6b5a82'); cy += 40; }
      cy += 6;
      para('Next: ' + m.suggestion.text, innerX, cy, 28, 600, '#1f1934', innerW, 38);
      cy += nextH;
      if (m.bank) {
        cy += 8;
        text('🏦 Banco: saved ' + _money(m.bank.saved + m.bank.matched) + ' · gave ' + _money(m.bank.given) + ' this week',
          innerX, cy + 20, 26, 700, '#7a2a2a');
      }
      y = cardTop + h + 28;
    });

    text('Made with Zavala Serra Apps', W / 2, y + 20, 24, 700, '#6b5a82', 'center');
    return y + 70;
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  // The finished canvas, or null when the device cannot make one.
  function buildImage() {
    if (!_models.length || !_bounds) return null;
    var W = 1080;
    var c = document.createElement('canvas');
    c.width = W; c.height = 16;
    var ctx = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(c) : c.getContext('2d');
    if (!ctx) return null;
    var H = _paint(ctx, W, true);              // measure
    c.width = W; c.height = H;                 // resizing resets the context
    ctx = typeof ZsCanvas !== 'undefined' ? ZsCanvas.get2d(c) : c.getContext('2d');
    if (!ctx) { if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(c); return null; }
    ctx.textBaseline = 'alphabetic';
    _paint(ctx, W, false);
    return c;
  }

  function _status(msg) {
    var el = document.getElementById('sr-status');
    if (el) el.textContent = msg;
  }

  function _download(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 4000);
    _status('Saved ' + fileName + ' to your downloads.');
  }

  function shareImage() {
    var c = buildImage();
    if (!c) { _status('This device could not make the picture. Printing still works.'); return; }
    var fileName = 'sunday-report-' + _dayKey(_bounds.from.getTime()) + '.png';
    c.toBlob(function(blob) {
      if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(c);
      if (!blob) { _status('This device could not make the picture. Printing still works.'); return; }
      var file = null;
      try { file = new File([blob], fileName, { type: 'image/png' }); } catch (e) {}
      if (file && navigator.canShare && navigator.share) {
        var ok = false;
        try { ok = navigator.canShare({ files: [file] }); } catch (e) {}
        if (ok) {
          navigator.share({ files: [file], title: 'Family Sunday Report' })
            .then(function() { _status('Shared.'); })
            .catch(function(err) {
              if (err && err.name === 'AbortError') _status('');
              else _download(blob, fileName);
            });
          return;
        }
      }
      _download(blob, fileName);
    }, 'image/png');
  }

  function print() { window.print(); }
  function refresh() { _render(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _render);
  } else {
    _render();
  }

  return {
    print: print, refresh: refresh, shareImage: shareImage, buildImage: buildImage,
    addInsightSource: addInsightSource, APP_NAMES: APP_NAMES
  };
})();
