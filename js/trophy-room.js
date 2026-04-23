/* ================================================================
   TROPHY ROOM — trophy-room.js
   Aggregation-only v1. Reads existing localStorage keys via
   getPlayerStats() and surfaces each app's earned stars as a badge.
   No registry, no new storage writes.
   ================================================================ */

var TrophyRoom = (function() {
  'use strict';

  // App badge metadata. Mirrors the app ids used by getPlayerStats().
  // `threshold` = stars required to consider the badge "earned".
  var APP_BADGES = [
    { id: 'math',    name: 'Math Galaxy',     emoji: '🧮', color: '#60A5FA', threshold: 1 },
    { id: 'chile',   name: 'Descubre Chile',  emoji: '🇨🇱', color: '#F87171', threshold: 1 },
    { id: 'chess',   name: 'Chess Quest',     emoji: '♟️',  color: '#FBBF24', threshold: 1 },
    { id: 'piano',   name: 'Little Maestro',  emoji: '🎹', color: '#A78BFA', threshold: 1 },
    { id: 'faith',   name: 'Fe Explorador',   emoji: '⛪',  color: '#F59E0B', threshold: 1 },
    { id: 'guitar',  name: 'Guitar Jam',      emoji: '🎸', color: '#34D399', threshold: 1 },
    { id: 'art',     name: 'Art Studio',      emoji: '🎨', color: '#F472B6', threshold: 1 },
    { id: 'sports',  name: 'Sports Arena',    emoji: '🏓', color: '#10B981', threshold: 1 },
    { id: 'lab',     name: 'Lab Explorer',    emoji: '🔬', color: '#6EE7B7', threshold: 1 },
    { id: 'world',   name: 'World Explorer',  emoji: '🌍', color: '#3B82F6', threshold: 1 },
    { id: 'story',   name: 'Story Explorer',  emoji: '📚', color: '#8B5CF6', threshold: 1 },
    { id: 'guess',   name: 'Guess Quest',     emoji: '🎯', color: '#FBBF24', threshold: 1 }
  ];

  // Mirror of RANKS in auth.js so we can show the progression strip.
  var RANKS = [
    { minStars: 0,   icon: '🛸', name: 'Cadet' },
    { minStars: 15,  icon: '🌟', name: 'Apprentice' },
    { minStars: 30,  icon: '🛡️', name: 'Veteran' },
    { minStars: 60,  icon: '🌍', name: 'Explorer' },
    { minStars: 100, icon: '🚀', name: 'Pilot' },
    { minStars: 150, icon: '🌌', name: 'Astronaut' },
    { minStars: 250, icon: '💎', name: 'Elite' },
    { minStars: 500, icon: '👑', name: 'Grand Master' }
  ];

  function _appStars(appId, appStats) {
    var data = appStats[appId] || {};
    if (appId === 'math') {
      var s = 0; for (var k in data) { s += (data[k].bestStars || 0); } return s;
    }
    if (appId === 'chile') {
      var s2 = 0;
      for (var k2 in data) {
        if (k2 !== 'vr' && k2 !== 'memBest') s2 += (data[k2].bestStars || 0);
      }
      return s2;
    }
    if (appId === 'chess') return (data.puzzlesSolved || 0) + (data.wins || 0);
    if (appId === 'piano') {
      var s3 = 0;
      if (data.progress) {
        for (var k3 in data.progress) {
          var v = data.progress[k3];
          if (v && typeof v === 'object' && v.stars) s3 += v.stars;
        }
      }
      return s3;
    }
    return data.totalStars || 0;
  }

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render() {
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    var stats = typeof getPlayerStats === 'function' ? getPlayerStats(user.name) : { totalStars: 0, appStats: {} };
    var totalStars = stats.totalStars || 0;
    var appStats = stats.appStats || {};

    // Subtitle personalized
    var sub = document.getElementById('tr-subtitle');
    if (sub) sub.textContent = user.name + "'s badges, ranks and milestones";

    // Current rank banner
    var currentRank = RANKS[0];
    var nextRank = null;
    for (var i = RANKS.length - 1; i >= 0; i--) {
      if (totalStars >= RANKS[i].minStars) { currentRank = RANKS[i]; break; }
    }
    for (var j = 0; j < RANKS.length; j++) {
      if (RANKS[j].minStars > totalStars) { nextRank = RANKS[j]; break; }
    }

    var banner = document.getElementById('tr-rank-banner');
    if (banner) {
      banner.innerHTML =
        '<div class="tr-rank-icon">' + currentRank.icon + '</div>' +
        '<div class="tr-rank-body">' +
          '<div class="tr-rank-label">Current Rank</div>' +
          '<div class="tr-rank-name">' + _esc(currentRank.name) + '</div>' +
          '<div class="tr-rank-stars">⭐ ' + totalStars + ' total star' + (totalStars === 1 ? '' : 's') + '</div>' +
        '</div>';
    }

    // Progress strip
    var strip = document.getElementById('tr-progress-strip');
    if (strip) {
      var pct;
      if (nextRank) {
        var span = nextRank.minStars - currentRank.minStars;
        var inSpan = totalStars - currentRank.minStars;
        pct = span > 0 ? Math.min(100, Math.max(0, (inSpan / span) * 100)) : 100;
      } else {
        pct = 100;
      }

      var labelRight = nextRank
        ? (nextRank.minStars - totalStars) + ' ⭐ to ' + nextRank.name + ' ' + nextRank.icon
        : 'Max rank reached! 👑';

      var ranksHtml = RANKS.map(function(r) {
        var cls = 'tr-ps-rank';
        if (totalStars >= r.minStars) cls += ' earned';
        if (r.name === currentRank.name) cls += ' current';
        return '<span class="' + cls + '" title="' + _esc(r.name) + ' (' + r.minStars + ' ⭐)">' + r.icon + '</span>';
      }).join('');

      strip.innerHTML =
        '<div class="tr-ps-label"><span>' + _esc(currentRank.name) + '</span><span>' + labelRight + '</span></div>' +
        '<div class="tr-ps-bar"><div class="tr-ps-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="tr-ps-ranks">' + ranksHtml + '</div>';
    }

    // Badge grid
    var grid = document.getElementById('tr-grid');
    if (grid) {
      var html = APP_BADGES.map(function(b, idx) {
        var s = _appStars(b.id, appStats);
        var earned = s >= b.threshold;
        return '<div class="tr-badge ' + (earned ? 'earned' : 'locked') + '" ' +
               'style="--badge-color:' + _esc(b.color) + '22;animation-delay:' + (idx * 0.03) + 's;">' +
          '<span class="tr-badge-emoji">' + b.emoji + '</span>' +
          '<div class="tr-badge-name">' + _esc(b.name) + '</div>' +
          (earned ? '<div class="tr-badge-stars">⭐ ' + s + '</div>' : '') +
        '</div>';
      }).join('');
      grid.innerHTML = html;
    }

    // Next up: first unearned badge
    var nextLabel = document.getElementById('tr-next-label');
    var nextEl = document.getElementById('tr-next');
    if (nextEl) {
      var unearned = APP_BADGES.filter(function(b) { return _appStars(b.id, appStats) < b.threshold; });
      if (unearned.length > 0) {
        var pick = unearned[0];
        var hrefMap = {
          math: 'math-galaxy.html', chile: 'descubre-chile.html', chess: 'chess-quest.html',
          piano: 'little-maestro.html', faith: 'fe-explorador.html', guitar: 'guitar-jam.html',
          art: 'art-studio.html', sports: 'sports-arena.html', lab: 'lab-explorer.html',
          world: 'world-explorer.html', story: 'story-explorer.html', guess: 'guess-quest.html'
        };
        nextEl.innerHTML =
          '<div class="tr-next-emoji">' + pick.emoji + '</div>' +
          '<div class="tr-next-body">' +
            '<div class="tr-next-title">Try ' + _esc(pick.name) + '</div>' +
            '<div class="tr-next-desc">Earn your first star to unlock this badge.</div>' +
          '</div>' +
          '<a class="tr-next-link" href="' + hrefMap[pick.id] + '">Open →</a>';
        if (nextLabel) nextLabel.style.display = '';
      } else {
        nextEl.innerHTML = '<div class="tr-next-body" style="text-align:center;width:100%;">' +
          '<div class="tr-next-title">🎉 Every app badge earned!</div>' +
          '<div class="tr-next-desc">Keep playing to climb the ranks.</div>' +
        '</div>';
        if (nextLabel) nextLabel.style.display = '';
      }
    }
  }

  function init() {
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { render: render };
})();
