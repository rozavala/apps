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

    let html = `
      <div class="quest-ep-bar">
        <div class="quest-ep-label">⚡ ${ep} Expedition Points</div>
        <div class="quest-ep-track">
          <div class="quest-ep-fill" style="width:${Math.min(100, (ep / 250) * 100)}%"></div>
        </div>
      </div>
    `;

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

  return { init, openRegion, calculateEP, getStats, REGIONS };
})();
