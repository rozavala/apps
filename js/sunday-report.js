/* ================================================================
   FAMILY SUNDAY REPORT — sunday-report.js
   Reads ActivityLog, getPlayerStats, Routines, and profile data to
   produce a weekly family summary optimised for printing.

   Pure read-only: no writes to localStorage, no network calls.
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

  function _kidStats(name, weekFromMs, weekToMs) {
    var nameKey = name.toLowerCase().replace(/\s+/g, '_');
    var playerStats = typeof getPlayerStats === 'function' ? getPlayerStats(name) : { totalStars: 0, appStats: {} };
    var activity = typeof ActivityLog !== 'undefined' && ActivityLog.getRecent
      ? ActivityLog.getRecent(name, 14)
      : [];
    // Filter to the specific week
    var weekActivity = activity.filter(function(e) {
      return e && e.ts >= weekFromMs && e.ts <= weekToMs;
    });

    // Count events per app for the week
    var appCounts = {};
    weekActivity.forEach(function(e) {
      var app = e.app || 'Other';
      appCounts[app] = (appCounts[app] || 0) + 1;
    });
    var topApps = Object.keys(appCounts)
      .sort(function(a, b) { return appCounts[b] - appCounts[a]; })
      .slice(0, 3)
      .map(function(app) { return { app: app, count: appCounts[app] }; });

    // Routines streak
    var routineStreak = 0;
    try {
      var rk = 'zs_routines_' + nameKey;
      var raw = localStorage.getItem(rk);
      if (raw) {
        var rd = JSON.parse(raw);
        if (rd && typeof rd.streak === 'number') routineStreak = rd.streak;
      }
    } catch (e) {}

    // Top 3 activity highlights — spread across apps when possible
    var seenApps = {};
    var highlights = [];
    weekActivity.forEach(function(e) {
      if (highlights.length >= 4) return;
      var tag = e.app + '|' + (e.desc || '').slice(0, 40);
      if (seenApps[tag]) return;
      seenApps[tag] = true;
      highlights.push(e);
    });

    // Total events this week
    var totalEvents = weekActivity.length;

    // Rank
    var rank = typeof getExplorerRank === 'function'
      ? getExplorerRank(name, playerStats)
      : { icon: '🛸', name: 'Cadet' };

    return {
      totalStars: playerStats.totalStars,
      rank: rank,
      totalEvents: totalEvents,
      topApps: topApps,
      routineStreak: routineStreak,
      highlights: highlights
    };
  }

  function _render() {
    var bounds = _weekBounds();
    var weekFromMs = bounds.from.getTime();
    var weekToMs = bounds.to.getTime();
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    var content = document.getElementById('sr-content');
    if (!content) return;

    if (!profiles || profiles.length === 0) {
      content.innerHTML = '<div class="sr-sheet"><div class="sr-kid-empty">No profiles found yet. Add a kid in the hub first.</div></div>';
      return;
    }

    var kidBlocks = '';
    var familyStars = 0;
    var familyEvents = 0;
    var bestStreak = { name: '', streak: 0 };

    profiles.forEach(function(p) {
      var stats = _kidStats(p.name, weekFromMs, weekToMs);
      familyStars += stats.totalStars;
      familyEvents += stats.totalEvents;
      if (stats.routineStreak > bestStreak.streak) {
        bestStreak = { name: p.name, streak: stats.routineStreak };
      }

      var color = typeof safeColor === 'function' ? safeColor(p.color) : (p.color || '#7C3AED');
      var appLines = stats.topApps.map(function(a) {
        var label = APP_LABELS[a.app] || a.app;
        return '<div class="sr-moment"><span class="ic">•</span><span class="ds">' + _esc(label) + '</span><span class="ts">' + a.count + '×</span></div>';
      }).join('');

      var highlightLines = stats.highlights.map(function(h) {
        return '<div class="sr-moment">' +
          '<span class="ic">' + _esc(h.icon || '⭐') + '</span>' +
          '<span class="ds">' + _esc((h.desc || '').slice(0, 80)) + '</span>' +
          '<span class="ts">' + _timeOfDayLabel(h.ts) + '</span>' +
        '</div>';
      }).join('');

      var body;
      if (stats.totalEvents === 0 && stats.totalStars === 0) {
        body = '<div class="sr-kid-empty">No recorded activity this week — a gentle nudge for next week!</div>';
      } else {
        body =
          '<div class="sr-kid-grid">' +
            '<div class="sr-stat-pill"><div class="num">⭐ ' + stats.totalStars + '</div><div class="lbl">Total stars</div></div>' +
            '<div class="sr-stat-pill"><div class="num">' + stats.totalEvents + '</div><div class="lbl">This week</div></div>' +
            '<div class="sr-stat-pill"><div class="num">🔥 ' + stats.routineStreak + '</div><div class="lbl">Routine streak</div></div>' +
            '<div class="sr-stat-pill"><div class="num">' + stats.rank.icon + '</div><div class="lbl">' + _esc(stats.rank.name) + '</div></div>' +
          '</div>' +
          (appLines ? '<div class="sr-moments"><h3>Most active apps</h3>' + appLines + '</div>' : '') +
          (highlightLines ? '<div class="sr-moments"><h3>Highlights</h3>' + highlightLines + '</div>' : '');
      }

      kidBlocks +=
        '<div class="sr-kid">' +
          '<div class="sr-kid-head">' +
            '<div class="sr-kid-avatar" style="background:' + color + '22;border-color:' + color + ';">' + _esc(p.avatar || '🦊') + '</div>' +
            '<div>' +
              '<div class="sr-kid-name">' + _esc(p.name) + (p.age ? ' · ' + p.age + ' yrs' : '') + '</div>' +
              '<div class="sr-kid-rank">' + stats.rank.icon + ' ' + _esc(stats.rank.name) + '</div>' +
            '</div>' +
          '</div>' +
          body +
        '</div>';
    });

    // Family highlight sentence
    var highlight;
    if (bestStreak.streak > 0) {
      highlight = '🔥 Longest routine streak this week: <b>' + _esc(bestStreak.name) + '</b> with ' + bestStreak.streak + ' day' + (bestStreak.streak === 1 ? '' : 's') + '.';
    } else if (familyEvents > 0) {
      highlight = 'A busy week across the suite. Keep it going!';
    } else {
      highlight = 'A quieter week — consider trying a new app together.';
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

  function print() { window.print(); }
  function refresh() { _render(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _render);
  } else {
    _render();
  }

  return { print: print, refresh: refresh };
})();
