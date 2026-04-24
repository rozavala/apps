/* ================================================================
   QUEST ADVENTURE — quest-adventure.js
   RPG-style adventure map that connects all apps.
   Storage key: zs_quest_[username] via getUserAppKey('quest')
   Reads (but never writes to) all other app storage keys.
   ================================================================ */

const QuestAdventure = (() => {
  'use strict';

  // ── Adventure Map Regions ──
  const REGIONS = [
    {
      id: 'basecamp', name: 'Base Camp', icon: '⛺', epRequired: 0,
      description: 'Your adventure begins here! Complete challenges in any app to earn Expedition Points.',
      reward: null,
    },
    {
      id: 'forest', name: 'Enchanted Forest', icon: '🌲', epRequired: 10,
      description: 'The trees whisper ancient secrets. Did you know? Trees communicate through underground fungi networks.',
      reward: { type: 'fact', text: 'The tallest tree ever measured was 115.7 meters (Hyperion, a coast redwood).' },
    },
    {
      id: 'river', name: 'Crystal River', icon: '🏞️', epRequired: 25,
      description: 'A sparkling river cuts through the valley. The water is so clear you can see the fish below.',
      reward: { type: 'fact', text: 'The Amazon River carries more water than any other river — about 20% of all fresh water that flows into the oceans.' },
    },
    {
      id: 'mountain', name: 'Thunder Peak', icon: '⛰️', epRequired: 50,
      description: 'The mountain is steep and the air is thin. Only experienced explorers make it here.',
      reward: { type: 'fact', text: 'Mount Everest is 8,849 meters tall — but Mauna Kea in Hawaii is taller when measured from its underwater base (10,210m).' },
    },
    {
      id: 'volcano', name: 'Fire Island', icon: '🌋', epRequired: 80,
      description: 'A volcanic island rises from the sea. The ground rumbles beneath your feet.',
      reward: { type: 'fact', text: 'Chile has over 2,000 volcanoes, about 500 of which are considered active.' },
    },
    {
      id: 'ocean', name: 'Deep Ocean', icon: '🌊', epRequired: 120,
      description: 'You dive into the deep blue. Strange creatures glow in the darkness below.',
      reward: { type: 'fact', text: 'The Mariana Trench is the deepest point in the ocean at 10,994 meters — deeper than Everest is tall.' },
    },
    {
      id: 'sky_temple', name: 'Sky Temple', icon: '🏛️', epRequired: 175,
      description: 'Above the clouds, an ancient temple holds the secrets of the stars.',
      reward: { type: 'fact', text: 'The light from the nearest star (Proxima Centauri) takes 4.24 years to reach Earth.' },
    },
    {
      id: 'legend_peak', name: 'Legend\'s Peak', icon: '🏆', epRequired: 250,
      description: 'Only true Legends reach this peak. You have mastered every challenge!',
      reward: { type: 'achievement', text: 'You are a Legend of the Zavala Serra expedition!' },
    },
  ];

  // ── Seasonal Grand Tours ───────────────────────────────────────
  // Each tour is a multi-app expedition with 3 goals. The current
  // tour is auto-picked from the calendar month (Southern hemisphere
  // seasons); the others are still browsable below the map.
  // Goals are read from whatever storage each app already writes —
  // no schema changes to other apps.
  const TOURS = [
    {
      id: 'summer_andes',
      name: 'Summer of the Andes',
      icon: '☀️',
      months: [12, 1, 2],
      description: 'Long days, outdoor adventures, and deep dives into Chilean culture.',
      goals: [
        { id: 'chile',  label: 'Earn 20 stars in Descubre Chile',      target: 20 },
        { id: 'sports', label: 'Log 10 activities in Sports Arena',    target: 10 },
        { id: 'lab',    label: 'Complete 5 Lab Explorer experiments',  target: 5  }
      ]
    },
    {
      id: 'back_to_school',
      name: 'Back to School',
      icon: '📚',
      months: [3, 4, 5],
      description: 'Settle into a new term: sharpen math, reading, and strategy.',
      goals: [
        { id: 'math',   label: 'Earn 30 stars in Math Galaxy',        target: 30 },
        { id: 'story',  label: 'Read 5 stories in Story Explorer',    target: 5  },
        { id: 'chess',  label: 'Solve 15 Chess puzzles or rush runs', target: 15 }
      ]
    },
    {
      id: 'winter_music',
      name: 'Winter of Music',
      icon: '🎼',
      months: [6, 7, 8],
      description: 'Cozy season — pick up an instrument and fill the house with songs.',
      goals: [
        { id: 'piano',  label: 'Earn 20 stars in Little Maestro', target: 20 },
        { id: 'guitar', label: 'Earn 15 stars in Guitar Jam',     target: 15 },
        { id: 'art',    label: 'Complete 5 Art Studio pieces',    target: 5  }
      ]
    },
    {
      id: 'advent_pilgrimage',
      name: 'Advent Pilgrimage',
      icon: '🕯️',
      months: [9, 10, 11],
      description: 'Spring into Christmas. Prayer, stories, and a steady routine.',
      goals: [
        { id: 'faith',    label: 'Earn 20 stars in Fe Explorador',       target: 20 },
        { id: 'story',    label: 'Read 5 stories in Story Explorer',     target: 5  },
        { id: 'routines', label: 'Reach a 7-day routine streak',         target: 7  }
      ]
    }
  ];

  // Goal readers — one function per app id. Each takes the userKey
  // (lowercased name) and returns the kid's current count for a
  // simplified metric consistent with the tour target.
  function _tourMetric(goalId, userKey) {
    function safe(key) {
      try { return JSON.parse(localStorage.getItem(key)) || {}; }
      catch (e) { return {}; }
    }
    if (goalId === 'chile') {
      const d = safe('zs_chile_' + userKey);
      let s = 0;
      for (const k in d) if (k !== 'vr' && k !== 'memBest' && d[k]) s += (d[k].bestStars || 0);
      return s;
    }
    if (goalId === 'sports') {
      const d = safe('zs_sports_' + userKey);
      return (d.activities || []).length;
    }
    if (goalId === 'lab') {
      const d = safe('zs_lab_' + userKey);
      let count = 0;
      for (const k in d) {
        if (k === 'totalStars' || k === 'weather') continue;
        if (d[k] && (d[k].completed || 0) > 0) count++;
      }
      return count;
    }
    if (goalId === 'math') {
      const d = safe('zs_mathgalaxy_' + userKey);
      let s = 0;
      for (const k in d) { if (d[k] && typeof d[k] === 'object') s += (d[k].bestStars || 0); }
      return s;
    }
    if (goalId === 'story') {
      const d = safe('zs_story_' + userKey);
      return (d.storiesRead || []).length;
    }
    if (goalId === 'chess') {
      const d = safe('zs_chess_' + userKey);
      const rush = (d.rushBest && d.rushBest.score) || 0;
      return (d.puzzlesSolved || 0) + (d.wins || 0) + rush;
    }
    if (goalId === 'piano') {
      const d = safe('littlemaestro_' + userKey);
      let s = 0;
      if (d.progress) {
        for (const k in d.progress) {
          const v = d.progress[k];
          if (v && typeof v === 'object' && v.stars) s += v.stars;
        }
      }
      return s;
    }
    if (goalId === 'guitar') return safe('zs_guitar_' + userKey).totalStars || 0;
    if (goalId === 'art')    return safe('zs_art_' + userKey).totalStars || 0;
    if (goalId === 'faith')  return safe('zs_fe_' + userKey).totalStars || 0;
    if (goalId === 'routines') {
      const d = safe('zs_routines_' + userKey);
      return d.streak || 0;
    }
    return 0;
  }

  function _currentTour() {
    const m = new Date().getMonth() + 1; // 1-12
    for (let i = 0; i < TOURS.length; i++) {
      if (TOURS[i].months.indexOf(m) !== -1) return TOURS[i];
    }
    return TOURS[0];
  }

  function _tourProgress(tour, userKey) {
    let achieved = 0;
    const goals = tour.goals.map(function(g) {
      const v = _tourMetric(g.id, userKey);
      const hit = v >= g.target;
      if (hit) achieved++;
      return { goal: g, value: v, hit: hit, pct: Math.min(100, Math.round((v / g.target) * 100)) };
    });
    return { goals: goals, achieved: achieved, total: goals.length, complete: achieved === goals.length };
  }

  // ── EP Calculation ──
  function calculateEP() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return 0;
    const key = user.name.toLowerCase().replace(/\s+/g, '_');

    let total = 0;

    const apps = [
      { key: `zs_mathgalaxy_${key}`, type: 'mg' },
      { key: `zs_chile_${key}`, type: 'dc' },
      { key: `zs_chess_${key}`, type: 'cq' },
      { key: `littlemaestro_${key}`, type: 'lm' },
      { key: `zs_fe_${key}`, type: 'stars' },
      { key: `zs_guitar_${key}`, type: 'stars' },
      { key: `zs_art_${key}`, type: 'stars' },
      { key: `zs_sports_${key}`, type: 'stars' },
      { key: `zs_lab_${key}`, type: 'stars' },
      { key: `zs_world_${key}`, type: 'stars' },
      { key: `zs_story_${key}`, type: 'stars' }
    ];

    apps.forEach(app => {
      try {
        const data = JSON.parse(localStorage.getItem(app.key)) || {};
        if (app.type === 'mg') {
          total += Object.values(data).reduce((s, l) => s + (l.bestStars || 0), 0);
        } else if (app.type === 'dc') {
          total += Object.entries(data).filter(([k]) => k !== 'vr' && k !== 'memBest').reduce((s, [, v]) => s + ((v && v.bestStars) || 0), 0);
        } else if (app.type === 'cq') {
          total += (data.puzzlesSolved || 0) + (data.wins || 0);
        } else if (app.type === 'lm') {
          if (data.progress) total += Object.values(data.progress).reduce((s, p) => s + (p.stars || 0), 0);
        } else {
          total += data.totalStars || 0;
        }
      } catch {}
    });

    return total;
  }

  // ── Storage ──
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey('quest') : null; }
  function _load() { try { return JSON.parse(localStorage.getItem(_key())) || {}; } catch { return {}; } }
  function _save(data) { 
    const k = _key(); 
    if (k) {
      localStorage.setItem(k, JSON.stringify(data)); 
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }

  // ── Map Rendering ──
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }

    const ep = calculateEP();
    _renderMap(ep);
  }

  function _renderMap(ep) {
    const mapEl = document.getElementById('quest-map');
    if (!mapEl) return;

    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    const userKey = user ? user.name.toLowerCase().replace(/\s+/g, '_') : '';
    const saved = _load();
    const completedTours = saved.tours || {};

    let html = `
      <div class="quest-ep-bar">
        <div class="quest-ep-label">⚡ ${ep} Expedition Points</div>
        <div class="quest-ep-track">
          <div class="quest-ep-fill" style="width:${Math.min(100, (ep / 250) * 100)}%"></div>
        </div>
      </div>
    `;

    // ── Current Seasonal Tour ──
    const now = _currentTour();
    const prog = _tourProgress(now, userKey);
    const wasComplete = !!completedTours[now.id];
    // Auto-record completion the moment the kid hits all goals.
    if (prog.complete && !wasComplete) {
      saved.tours = completedTours;
      saved.tours[now.id] = { completedAt: new Date().toISOString() };
      _save(saved);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Quest Adventure', '🏅',
          'Completed the Grand Tour: ' + now.name);
      }
    }
    html += _renderTour(now, prog, true, completedTours[now.id]);

    // ── Other tours (browseable) ──
    html += '<div class="quest-tours-browse"><h3 class="quest-tours-head">Other Grand Tours</h3>';
    TOURS.forEach(function(t) {
      if (t.id === now.id) return;
      const p = _tourProgress(t, userKey);
      html += _renderTour(t, p, false, completedTours[t.id]);
    });
    html += '</div>';

    REGIONS.forEach((region, i) => {
      const unlocked = ep >= region.epRequired;
      const isCurrent = unlocked && (i === REGIONS.length - 1 || ep < REGIONS[i + 1].epRequired);

      if (i > 0) {
        html += `<div class="quest-connector ${unlocked ? 'active' : ''}"></div>`;
      }

      html += `
        <div class="quest-node ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}"
             ${unlocked ? `onclick="QuestAdventure.openRegion('${region.id}')"` : ''}>
          <div class="quest-node-icon">${unlocked ? region.icon : '🔒'}</div>
          <div class="quest-node-name">${region.name}</div>
          <div class="quest-node-ep">${region.epRequired} EP</div>
        </div>
      `;
    });

    mapEl.innerHTML = html;
  }

  function _renderTour(tour, prog, isCurrent, completedMeta) {
    var done = !!completedMeta || prog.complete;
    var cls = 'quest-tour' + (isCurrent ? ' current' : '') + (done ? ' done' : '');
    var header = (isCurrent ? '🎯 ' : '') + tour.icon + ' ' + tour.name +
      (done ? ' ✅' : '');
    var goalsHtml = prog.goals.map(function(g) {
      return '<div class="quest-goal">' +
        '<div class="quest-goal-head">' +
          '<span>' + (g.hit ? '✅ ' : '') + g.goal.label + '</span>' +
          '<span class="quest-goal-num">' + g.value + ' / ' + g.goal.target + '</span>' +
        '</div>' +
        '<div class="quest-goal-bar"><div class="quest-goal-fill" style="width:' + g.pct + '%"></div></div>' +
      '</div>';
    }).join('');
    var doneLine = done
      ? '<div class="quest-tour-done">🏅 Tour complete' +
          (completedMeta && completedMeta.completedAt
            ? ' · ' + new Date(completedMeta.completedAt).toLocaleDateString()
            : '') +
        '</div>'
      : '';
    return '<div class="' + cls + '">' +
      '<div class="quest-tour-head">' + header + '</div>' +
      (isCurrent ? '<div class="quest-tour-desc">' + tour.description + '</div>' : '') +
      '<div class="quest-goals">' + goalsHtml + '</div>' +
      doneLine +
    '</div>';
  }

  function openRegion(regionId) {
    const region = REGIONS.find(r => r.id === regionId);
    if (!region) return;

    const overlay = document.getElementById('quest-detail');
    overlay.innerHTML = `
      <div class="quest-detail-card">
        <div class="quest-detail-icon">${region.icon}</div>
        <h2>${region.name}</h2>
        <p>${region.description}</p>
        ${region.reward ? `<div class="quest-reward">
          <div class="reward-label">🎁 Discovery:</div>
          <div class="reward-text">${region.reward.text}</div>
        </div>` : ''}
        <button class="action-btn btn-secondary" onclick="document.getElementById('quest-detail').classList.remove('active')">Close</button>
      </div>
    `;
    overlay.classList.add('active');
    if (typeof playSound === 'function') playSound('pop');

    // Mark as visited
    const data = _load();
    if (!data.visited) data.visited = [];
    if (!data.visited.includes(regionId)) {
      data.visited.push(regionId);
      _save(data);
    }
  }

  function getStats() {
    const ep = calculateEP();
    const data = _load();
    return {
      totalEP: ep,
      regionsUnlocked: REGIONS.filter(r => ep >= r.epRequired).length,
      regionsVisited: (data.visited || []).length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, openRegion, calculateEP, getStats, REGIONS, TOURS };
})();
