/* ================================================================
   QUEST ADVENTURE — quest-adventure.js
   RPG-style adventure map that connects all apps.
   Storage key: zs_quest_[username] via getUserAppKey('zs_quest_')
   Reads (but never writes to) all other app storage keys.

   Saved shape (only ever added to):
     visited: [regionId]            regions whose card was opened
     tours:   { tourId: { completedAt } }
     found:   { regionId: ISO }     when the mist over a region cleared
     quests:  { questId: ISO }      when a region quest was completed
     pos:     regionId              where the explorer token stood last

   Expedition Points (EP) are the kid's stars across every other app,
   read with getPlayerStats / getAppStars from auth.js — the same rule
   the Explorer Rank and Trophy Room use. Regions unlock at fixed EP.
   ================================================================ */

const QuestAdventure = (() => {
  'use strict';

  // ── Adventure Map Regions ──
  // Ids, order and epRequired are part of the saved meaning — never
  // change them. New regions go at the end.
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
      description: 'Only true Legends reach this peak. From the summit you can see the trail going on — north to the desert and out across the sea.',
      reward: { type: 'achievement', text: 'You are a Legend of the Zavala Serra expedition!' },
    },
    {
      id: 'observatory', name: 'Desert Observatory', icon: '🔭', epRequired: 350,
      description: 'High on a dry desert plateau, white domes open at night to look at the stars.',
      reward: { type: 'fact', text: 'Chile\'s Atacama Desert is one of the driest places on Earth. Its clear, dark skies are why many of the world\'s largest telescopes are built there.' },
    },
    {
      id: 'glacier', name: 'Glacier Fjord', icon: '🧊', epRequired: 450,
      description: 'A river of ice creeps down from the mountains and breaks into icebergs in a narrow fjord.',
      reward: { type: 'fact', text: 'Glacial ice covers about 10% of Earth\'s land. Chile and Argentina share the Southern Patagonian Ice Field, one of the largest ice fields outside the polar regions.' },
    },
    {
      id: 'rapanui', name: 'Rapa Nui', icon: '🗿', epRequired: 600,
      description: 'Far out in the Pacific, giant stone statues stand on their platforms facing inland.',
      reward: { type: 'fact', text: 'Rapa Nui (Easter Island) is part of Chile, about 3,500 km from the mainland. Its people carved nearly 900 stone statues called moai.' },
    },
  ];

  // ── Seasonal Grand Tours ───────────────────────────────────────
  // Each tour is a multi-app expedition with 3 goals. The current
  // tour is auto-picked from the calendar month (Southern hemisphere
  // seasons); the others are still browsable.
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

  // ── Stars across the suite ──
  // One read of every app's blob per render, scored by auth.js's rules.
  function _appStars() {
    const out = {};
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user || typeof getPlayerStats !== 'function') return out;
    const st = getPlayerStats(user.name);
    for (const id in st.appStats) {
      if (id === 'quest') continue;
      out[id] = typeof getAppStars === 'function' ? getAppStars(id, st.appStats[id]) : 0;
    }
    return out;
  }

  // ── EP Calculation ──
  // Every star earned in any other app is one Expedition Point. This is
  // a superset of what the first version counted (eleven apps), so a
  // kid's unlocked regions can only grow.
  function calculateEP(stars) {
    const s = stars || _appStars();
    let total = 0;
    for (const id in s) total += s[id] || 0;
    return total;
  }

  // ── Storage ──
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    // Saves used to land on a bare `quest<kid>` key — see
    // adoptLegacyAppKey in auth.js for what that cost.
    if (typeof adoptLegacyAppKey === 'function') adoptLegacyAppKey('quest', 'zs_quest_');
    return getUserAppKey('zs_quest_');
  }
  function _load() {
    let d;
    try { d = JSON.parse(localStorage.getItem(_key())) || {}; } catch (e) { d = {}; }
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    return d;
  }
  function _save(data) {
    const k = _key();
    if (k) {
      try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }

  // ── Helpers ──
  const D = QA_DATA;
  const esc = (s) => (typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''));
  const byId = {};
  REGIONS.forEach((r, i) => { byId[r.id] = r; r.index = i; });
  function _user() { return typeof getActiveUser === 'function' ? getActiveUser() : null; }
  function _userKey() { const u = _user(); return u ? u.name.toLowerCase().replace(/\s+/g, '_') : ''; }
  function _older() {
    const u = _user();
    const t = typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate';
    return t === 'advanced' || t === 'expert';
  }
  function _tier() { const u = _user(); return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate'; }
  function _fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function _sfx(name) { try { if (typeof SFX !== 'undefined' && SFX[name]) SFX[name](); } catch (e) {} }
  function _reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function questsFor(regionId) {
    const older = _older();
    return D.QUESTS.filter(q => q.region === regionId && (q.tier === 'all' || older));
  }
  function questValue(q, stars, ep) {
    return q.app === '*' ? ep : (stars[q.app] || 0);
  }
  function questLabel(q) {
    const app = q.app === '*' ? null : D.APPS[q.app];
    const what = q.app === '*'
      ? (q.n === 1 ? 'Earn your first star in any app' : 'Earn ' + q.n + ' stars in any app')
      : 'Earn ' + q.n + (q.n === 1 ? ' star' : ' stars') + ' in ' + app.name;
    return what + ' ' + q.why;
  }

  // ── Model: everything the screen shows, computed once per render ──
  let M = null;
  function _model() {
    const stars = _appStars();
    const ep = calculateEP(stars);
    const saved = _load();
    const unlocked = {};
    REGIONS.forEach(r => { if (ep >= r.epRequired) unlocked[r.id] = true; });
    let cur = REGIONS[0];
    REGIONS.forEach(r => { if (unlocked[r.id]) cur = r; });
    const next = REGIONS.find(r => !unlocked[r.id]) || null;
    const done = Object.assign({}, saved.quests || {});
    const quest = {};
    D.QUESTS.forEach(q => {
      const v = questValue(q, stars, ep);
      quest[q.id] = { q: q, value: Math.min(v, q.n), met: v >= q.n, done: !!done[q.id] || (unlocked[q.region] && v >= q.n), at: done[q.id] || null };
    });
    const sealed = REGIONS.filter(r => {
      const qs = questsFor(r.id);
      return unlocked[r.id] && qs.length && qs.every(q => quest[q.id].done);
    }).map(r => r.id);
    return { stars, ep, saved, unlocked, cur, next, quest, sealed };
  }

  // Record what is new since last time: mist cleared, quests done.
  function _record(m) {
    const s = m.saved;
    const now = new Date().toISOString();
    const fresh = { found: [], quests: [] };
    if (!s.found || typeof s.found !== 'object') s.found = {};
    if (!s.quests || typeof s.quests !== 'object') s.quests = {};
    REGIONS.forEach(r => {
      if (m.unlocked[r.id] && !s.found[r.id]) {
        s.found[r.id] = now;
        if (r.id !== 'basecamp') fresh.found.push(r.id);
      }
    });
    D.QUESTS.forEach(q => {
      const e = m.quest[q.id];
      if (m.unlocked[q.region] && e.met && !s.quests[q.id]) {
        s.quests[q.id] = now;
        e.at = now;
        fresh.quests.push(q.id);
      }
    });
    // Seasonal tour: auto-record completion the moment all goals are hit.
    const tour = _currentTour();
    const prog = _tourProgress(tour, _userKey());
    let tourDone = false;
    if (prog.complete && !(s.tours && s.tours[tour.id])) {
      s.tours = s.tours || {};
      s.tours[tour.id] = { completedAt: now };
      tourDone = true;
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Quest Adventure', '🏅', 'Completed the Grand Tour: ' + tour.name);
      }
    }
    if (fresh.found.length || fresh.quests.length || tourDone) {
      _save(s);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        fresh.found.forEach(id => ActivityLog.log('Quest Adventure', '🗺️', 'Discovered ' + byId[id].name));
        if (fresh.quests.length) ActivityLog.log('Quest Adventure', '✅', 'Completed ' + fresh.quests.length + (fresh.quests.length === 1 ? ' quest' : ' quests'));
      }
    }
    fresh.tour = tourDone ? tour : null;
    return fresh;
  }

  // ── Rendering ──
  let zoom = 1, zoomIdx = 0;
  const ZOOMS = [1, 1.5, 2.2];
  let tab = 'quests';
  let tokenAt = null;   // trail length the token stands at
  let walking = false;

  function init() {
    const user = _user();
    if (!user) return;
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.pull(_key()); } catch (e) {}
    }
    try { tab = localStorage.getItem('zs_quest_tab') || 'quests'; } catch (e) {}
    if (['quests', 'journal', 'tour'].indexOf(tab) === -1) tab = 'quests';

    M = _model();
    const fresh = _record(M);
    _buildShell();
    _buildWorld(fresh);
    _renderNext();
    _renderPanel();
    _celebrate(fresh);

    window.addEventListener('zs:synced', _refresh);
    window.addEventListener('resize', _sizeWorld);
  }

  function _refresh() {
    if (walking) return;
    M = _model();
    const fresh = _record(M);
    _buildWorld(fresh);
    _renderNext();
    _renderPanel();
    _celebrate(fresh);
  }

  function _buildShell() {
    const app = document.getElementById('qa-root');
    if (!app) return;
    const u = _user();
    app.innerHTML =
      '<header class="qa-head">' +
        '<h1 class="qa-title">Quest Adventure</h1>' +
        '<div class="qa-ep" id="qa-ep" aria-live="polite"></div>' +
        '<p class="qa-sub">' + (_tier() === 'beginner'
            ? 'Earn stars in any app to explore the map!'
            : 'Every star you earn in any app is one Expedition Point. Points clear the mist and move you along the trail.') + '</p>' +
      '</header>' +
      '<div class="qa-layout">' +
        '<section class="qa-next" id="qa-next" aria-label="Next goal"></section>' +
          '<section class="qa-mapframe" aria-label="Adventure map">' +
            '<div class="qa-viewport" id="qa-viewport">' +
              '<div class="qa-world" id="qa-world"></div>' +
            '</div>' +
            '<div class="qa-mapctl">' +
              '<button type="button" class="qa-ctl" id="qa-zout" aria-label="Zoom out">−</button>' +
              '<button type="button" class="qa-ctl" id="qa-zin" aria-label="Zoom in">+</button>' +
              '<button type="button" class="qa-ctl qa-ctl-me" id="qa-find" aria-label="Find my explorer">' +
                '<span class="qa-ctl-av">' + esc(u && u.avatar ? u.avatar : '🧭') + '</span></button>' +
            '</div>' +
          '</section>' +
        '<aside class="qa-panel">' +
          '<div class="qa-tabs" role="tablist" aria-label="Quest views">' +
            '<button type="button" role="tab" class="qa-tab" data-tab="quests" id="qa-tab-quests">Quests</button>' +
            '<button type="button" role="tab" class="qa-tab" data-tab="journal" id="qa-tab-journal">Journal</button>' +
            '<button type="button" role="tab" class="qa-tab" data-tab="tour" id="qa-tab-tour">Seasonal Tour</button>' +
          '</div>' +
          '<div id="qa-tabpanel" class="qa-tabpanel" role="tabpanel"></div>' +
        '</aside>' +
      '</div>';

    app.querySelectorAll('.qa-tab').forEach(b => b.addEventListener('click', () => {
      tab = b.getAttribute('data-tab');
      try { localStorage.setItem('zs_quest_tab', tab); } catch (e) {}
      _renderPanel();
    }));
    document.getElementById('qa-zin').addEventListener('click', () => _zoom(1));
    document.getElementById('qa-zout').addEventListener('click', () => _zoom(-1));
    document.getElementById('qa-find').addEventListener('click', () => _scrollTo(_tokenXY(), true));
    _dragPan(document.getElementById('qa-viewport'));
    zoomIdx = window.innerWidth < 640 ? 1 : 0;
    zoom = ZOOMS[zoomIdx];
  }

  // ── The world map ──
  function _buildWorld(fresh) {
    const world = document.getElementById('qa-world');
    if (!world) return;
    const G = QA_ART.geo();
    const m = M;
    const s = m.saved;
    const curLen = G.anchors[m.cur.id].len;
    const clearing = {};
    (fresh.found || []).forEach(id => { clearing[id] = true; });
    const u = _user();

    let h = '<img class="qa-base" alt="" draggable="false" src="' + _baseUrl(curLen) + '">';
    h += '<div class="qa-live-wrap">' + QA_ART.buildOverlay({ walkedLen: curLen, unlocked: m.unlocked, clearing: clearing, sealed: m.sealed }) + '</div>';
    h += '<div class="qa-clouds" aria-hidden="true">';
    for (let i = 0; i < 5; i++) h += '<div class="qa-cloud qa-cloud' + i + '">' + QA_ART.cloud() + '</div>';
    h += '</div>';
    REGIONS.forEach(r => {
      const p = D.POS[r.id];
      const open = !!m.unlocked[r.id];
      const isCur = r.id === m.cur.id;
      const sealed = m.sealed.indexOf(r.id) !== -1;
      const qs = questsFor(r.id);
      const nDone = qs.filter(q => m.quest[q.id].done).length;
      const cls = 'qa-node ' + (open ? 'is-open' : 'is-locked') + (isCur ? ' is-current' : '') + (sealed ? ' is-sealed' : '') + (m.next && m.next.id === r.id ? ' is-next' : '');
      const label = r.name + (open ? (sealed ? ', all quests done' : ', ' + nDone + ' of ' + qs.length + ' quests done') : ', hidden in mist, needs ' + r.epRequired + ' Expedition Points');
      h += '<button type="button" class="' + cls + '" data-region="' + r.id + '" style="left:' + ((p.x - 66) / 10) + '%;top:' + ((p.y - 128) / 15) + '%" aria-label="' + esc(label) + '">' +
        '<span class="qa-plate"><b>' + esc(r.name) + '</b>' +
        (open
          ? '<small>' + (sealed ? '⚑ All quests done' : nDone + '/' + qs.length + ' quests') + '</small>'
          : '<small>🔒 ' + r.epRequired + ' EP</small>') +
        '</span></button>';
    });
    const av = u && u.avatar ? u.avatar : '🧭';
    const ring = typeof safeColor === 'function' ? safeColor(u && u.color) : '#7C3AED';
    h += '<div class="qa-token" id="qa-token" style="--ring:' + ring + '" aria-hidden="true">' +
      '<span class="qa-boat">' + _boatSvg() + '</span>' +
      '<span class="qa-pin"><span class="qa-av">' + esc(av) + '</span></span><span class="qa-tshadow"></span></div>';
    world.innerHTML = h;
    world.querySelectorAll('.qa-node').forEach(b => b.addEventListener('click', (e) => {
      if (_dragMoved) { e.preventDefault(); return; }
      openRegion(b.getAttribute('data-region'));
    }));
    _sizeWorld();

    // Where the explorer starts: last saved position (or Base Camp the
    // first time), then walks on to the newest region.
    const from = s.pos && byId[s.pos] ? G.anchors[s.pos].len : 0;
    const startLen = Math.min(from, curLen);
    _placeToken(startLen);
    requestAnimationFrame(() => _scrollTo(_lenXY(startLen), false));

    const doWalk = () => {
      if (Math.abs(curLen - startLen) < 1) { _savePos(m.cur.id); return; }
      _walk(startLen, curLen, () => _savePos(m.cur.id));
    };
    if (Object.keys(clearing).length && !_reduced()) setTimeout(doWalk, 1300);
    else doWalk();
    if (Object.keys(clearing).length) {
      setTimeout(() => {
        world.querySelectorAll('.qa-clearing').forEach(g => g.parentNode && g.parentNode.removeChild(g));
      }, 3600);
    }
  }

  const _baseCache = {};
  function _baseUrl(len) {
    const k = Math.round(len);
    if (!_baseCache[k]) {
      _baseCache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(QA_ART.buildBase(len));
    }
    return _baseCache[k];
  }
  function _boatSvg() {
    return '<svg viewBox="-30 -14 60 26" aria-hidden="true" focusable="false"><path d="M-26 -2h52l-10 12h-32z" fill="#8a5a2e" stroke="#4e2f14" stroke-width="1.2"/><path d="M-24 -2h48" stroke="#d8a868" stroke-width="2.4"/><path d="M-30 12q8-4 15 0t15 0 15 0 15 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.85"/></svg>';
  }

  function _savePos(id) {
    const s = _load();
    if (s.pos !== id) { s.pos = id; _save(s); }
  }

  function _sizeWorld() {
    const vp = document.getElementById('qa-viewport');
    const world = document.getElementById('qa-world');
    if (!vp || !world) return;
    const w = Math.round(vp.clientWidth * zoom);
    world.style.width = w + 'px';
    world.style.height = Math.round(w * 1.5) + 'px';
    world.style.setProperty('--u', (w / 1000) + 'px');
    world.classList.toggle('qa-small', w < 520);
    const zin = document.getElementById('qa-zin'), zout = document.getElementById('qa-zout');
    if (zin) zin.disabled = zoomIdx >= ZOOMS.length - 1;
    if (zout) zout.disabled = zoomIdx <= 0;
  }

  function _zoom(dir) {
    const vp = document.getElementById('qa-viewport');
    const ni = Math.max(0, Math.min(ZOOMS.length - 1, zoomIdx + dir));
    if (ni === zoomIdx || !vp) return;
    // keep the middle of the view where it is
    const cx = (vp.scrollLeft + vp.clientWidth / 2) / (vp.clientWidth * zoom);
    const cy = (vp.scrollTop + vp.clientHeight / 2) / (vp.clientWidth * zoom * 1.5);
    zoomIdx = ni; zoom = ZOOMS[ni];
    _sizeWorld();
    _scrollTo({ x: cx * 1000, y: cy * 1500 }, false);
    _sfx('click');
  }

  function _scrollTo(pt, smooth) {
    const vp = document.getElementById('qa-viewport');
    if (!vp || !pt) return;
    const s = vp.clientWidth * zoom / 1000;
    const left = pt.x * s - vp.clientWidth / 2;
    const top = pt.y * s - vp.clientHeight * 0.55;
    try { vp.scrollTo({ left: left, top: top, behavior: smooth && !_reduced() ? 'smooth' : 'auto' }); }
    catch (e) { vp.scrollLeft = left; vp.scrollTop = top; }
  }

  // Mouse drag pans the map (touch already scrolls natively).
  let _dragMoved = false;
  function _dragPan(vp) {
    let sx = 0, sy = 0, sl = 0, st = 0, down = false;
    vp.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; _dragMoved = false;
      sx = e.clientX; sy = e.clientY; sl = vp.scrollLeft; st = vp.scrollTop;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!_dragMoved && Math.abs(dx) + Math.abs(dy) > 6) { _dragMoved = true; vp.classList.add('is-dragging'); }
      if (_dragMoved) { vp.scrollLeft = sl - dx; vp.scrollTop = st - dy; }
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false; vp.classList.remove('is-dragging');
      setTimeout(() => { _dragMoved = false; }, 0);
    });
  }

  // ── The explorer token ──
  function _lenXY(len) {
    const S = QA_ART.geo().trailS;
    let lo = 0, hi = S.length - 1;
    if (len <= 0) return S[0];
    if (len >= S[hi].len) return S[hi];
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid].len < len) lo = mid; else hi = mid; }
    const a = S[lo], b = S[hi], t = (len - a.len) / ((b.len - a.len) || 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, sea: t < 0.5 ? a.sea : b.sea };
  }
  function _tokenXY() { return _lenXY(tokenAt || 0); }
  function _placeToken(len) {
    tokenAt = len;
    const t = document.getElementById('qa-token');
    if (!t) return;
    const p = _lenXY(len);
    t.style.left = (p.x / 10) + '%';
    t.style.top = (p.y / 15) + '%';
    t.classList.toggle('at-sea', !!p.sea);
  }
  function _walk(from, to, done) {
    const t = document.getElementById('qa-token');
    if (_reduced() || !t) { _placeToken(to); done(); return; }
    walking = true;
    const dist = Math.abs(to - from);
    const dur = Math.max(1100, Math.min(5200, dist * 4.2));
    const t0 = performance.now();
    t.classList.add('is-walking');
    let lastScroll = 0;
    function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      _placeToken(from + (to - from) * e);
      if (now - lastScroll > 120) { lastScroll = now; _follow(); }
      if (k < 1) requestAnimationFrame(step);
      else {
        walking = false;
        t.classList.remove('is-walking');
        t.classList.add('is-arrived');
        setTimeout(() => t.classList.remove('is-arrived'), 900);
        _sfx('star');
        done();
      }
    }
    requestAnimationFrame(step);
  }
  // keep the walking token comfortably in view
  function _follow() {
    const vp = document.getElementById('qa-viewport');
    if (!vp) return;
    const p = _tokenXY(), s = vp.clientWidth * zoom / 1000;
    const x = p.x * s - vp.scrollLeft, y = p.y * s - vp.scrollTop;
    const mx = vp.clientWidth * 0.22, my = vp.clientHeight * 0.25;
    if (x < mx || x > vp.clientWidth - mx || y < my || y > vp.clientHeight - my) {
      vp.scrollLeft += (x - vp.clientWidth / 2) * 0.25;
      vp.scrollTop += (y - vp.clientHeight * 0.55) * 0.25;
    }
  }

  // ── Next goal ──
  function _bestStep() {
    const m = M;
    const pool = [];
    REGIONS.forEach(r => {
      if (!(m.unlocked[r.id] || (m.next && m.next.id === r.id))) return;
      questsFor(r.id).forEach(q => {
        const e = m.quest[q.id];
        if (e.done || e.met) return; // met-but-waiting quests need EP, not that app
        if (q.app !== '*' && !D.APPS[q.app]) return;
        pool.push({ e: e, r: r, score: e.value / q.n - r.index * 0.01 + (m.unlocked[r.id] ? 0.05 : 0) });
      });
    });
    pool.sort((a, b) => b.score - a.score);
    return pool[0] || null;
  }

  function _renderNext() {
    const el = document.getElementById('qa-next');
    const epEl = document.getElementById('qa-ep');
    if (!el) return;
    const m = M;
    if (epEl) epEl.innerHTML = '<span class="qa-ep-bolt" aria-hidden="true">⚡</span><b>' + m.ep + '</b><span>Expedition<br>Points</span>';
    let h = '';
    if (m.next) {
      const prev = m.cur.epRequired, need = m.next.epRequired - m.ep;
      const pct = Math.max(3, Math.min(100, Math.round((m.ep - prev) / (m.next.epRequired - prev) * 100)));
      h += '<div class="qa-next-top">' +
        '<div class="qa-next-art" aria-hidden="true">' + QA_ART.landmark(m.next.id) + '<span class="qa-next-mist"></span></div>' +
        '<div class="qa-next-txt">' +
          '<div class="qa-kicker">Next goal</div>' +
          '<div class="qa-next-title">Clear the mist over <b>' + esc(m.next.name) + '</b></div>' +
          '<div class="qa-next-sub"><b>' + need + '</b> more ' + (need === 1 ? 'star' : 'stars') + ' in any app · ' + m.ep + ' / ' + m.next.epRequired + ' EP</div>' +
          '<div class="qa-bar" role="progressbar" aria-label="Progress to ' + esc(m.next.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div>' +
        '</div>' +
      '</div>';
    } else {
      const left = D.QUESTS.filter(q => (q.tier === 'all' || _older()) && !m.quest[q.id].done).length;
      h += '<div class="qa-next-top"><div class="qa-next-txt">' +
        '<div class="qa-kicker">Every land discovered</div>' +
        '<div class="qa-next-title">You have explored the whole map!</div>' +
        '<div class="qa-next-sub">' + (left ? left + ' quests left — finish them to plant a flag on every land.' : 'Every quest is done and every flag is planted. A true Legend!') + '</div>' +
      '</div></div>';
    }
    const best = _bestStep();
    if (best) {
      h += '<div class="qa-step"><span class="qa-step-k">Best next step</span>' + _questRow(best.e, best.r, true) + '</div>';
    }
    el.innerHTML = h;
  }

  function _questRow(e, region, compact) {
    const q = e.q;
    const app = q.app === '*' ? { name: 'Any app', icon: '⭐', href: 'index.html' } : D.APPS[q.app];
    const pct = Math.round(e.value / q.n * 100);
    const locked = !M.unlocked[region.id];
    let h = '<div class="qa-q' + (e.done ? ' is-done' : '') + (compact ? ' is-compact' : '') + '">' +
      '<span class="qa-q-ic" aria-hidden="true">' + (e.done ? '✓' : app.icon) + '</span>' +
      '<span class="qa-q-body"><span class="qa-q-txt">' + esc(questLabel(q)) + '</span>' +
        '<span class="qa-q-meta">' +
          (e.done
            ? 'Done' + (e.at ? ' · ' + _fmtDate(e.at) : '')
            : '<span class="qa-q-bar"><span style="width:' + pct + '%"></span></span><span class="qa-q-num">' + e.value + ' / ' + q.n + ' ★</span>' +
              (locked && e.met ? '<span class="qa-q-wait">ready — reach ' + esc(region.name) + '</span>' : '')) +
        '</span>' +
      '</span>';
    if (!e.done && !e.met) h += '<a class="qa-go" href="' + esc(app.href) + '" aria-label="Go to ' + esc(app.name) + '">Go<span aria-hidden="true"> ›</span></a>';
    return h + '</div>';
  }

  // ── Side panel ──
  function _renderPanel() {
    const el = document.getElementById('qa-tabpanel');
    if (!el) return;
    document.querySelectorAll('.qa-tab').forEach(b => {
      const on = b.getAttribute('data-tab') === tab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    el.setAttribute('aria-labelledby', 'qa-tab-' + tab);
    if (tab === 'journal') el.innerHTML = _journalHtml();
    else if (tab === 'tour') el.innerHTML = _toursHtml();
    else el.innerHTML = _questBoardHtml();
    el.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openRegion(b.getAttribute('data-open'))));
    el.querySelectorAll('[data-tabgo]').forEach(b => b.addEventListener('click', () => {
      tab = b.getAttribute('data-tabgo');
      try { localStorage.setItem('zs_quest_tab', tab); } catch (e) {}
      _renderPanel();
      const t = document.getElementById('qa-tab-' + tab);
      if (t) t.focus();
    }));
  }

  function _questBoardHtml() {
    const m = M;
    let h = '';
    const sealedNames = [];
    const order = REGIONS.filter(r => m.unlocked[r.id]).reverse();
    if (m.next) order.splice(1, 0, m.next);
    order.forEach(r => {
      const qs = questsFor(r.id);
      const sealed = m.sealed.indexOf(r.id) !== -1;
      if (sealed) { sealedNames.push(r); return; }
      const locked = !m.unlocked[r.id];
      const nDone = qs.filter(q => m.quest[q.id].done).length;
      h += '<section class="qa-group' + (locked ? ' is-ahead' : '') + (r.id === m.cur.id ? ' is-cur' : '') + '">' +
        '<button type="button" class="qa-group-h" data-open="' + r.id + '">' +
          '<span class="qa-group-art" aria-hidden="true">' + QA_ART.landmark(r.id) + '</span>' +
          '<span class="qa-group-t"><b>' + esc(r.name) + '</b><small>' +
            (locked ? 'Ahead · mist clears at ' + r.epRequired + ' EP' : (r.id === m.cur.id ? 'You are here · ' : '') + nDone + ' of ' + qs.length + ' quests done') +
          '</small></span><span class="qa-chev" aria-hidden="true">›</span>' +
        '</button>';
      // open quests here; finished ones are in the journal
      qs.forEach(q => { if (!m.quest[q.id].done) h += _questRow(m.quest[q.id], r, false); });
      if (nDone) h += '<button type="button" class="qa-donesum" data-tabgo="journal"><span aria-hidden="true">✓</span> ' + nDone + (nDone === 1 ? ' quest' : ' quests') + ' done here — see your journal</button>';
      h += '</section>';
    });
    if (sealedNames.length) {
      h += '<div class="qa-sealed"><span class="qa-sealed-k">Flags planted</span>' +
        sealedNames.map(r => '<button type="button" class="qa-chip" data-open="' + r.id + '"><span aria-hidden="true">⚑</span> ' + esc(r.name) + '</button>').join('') + '</div>';
    }
    if (_older()) h += '<p class="qa-note">Older explorers get extra, harder quests in each land.</p>';
    return h;
  }

  function _journalHtml() {
    const m = M, s = m.saved;
    const items = [];
    Object.keys(s.found || {}).forEach(id => {
      if (!byId[id] || id === 'basecamp') return;
      items.push({ at: s.found[id], ic: '🗺️', t: 'Discovered <b>' + esc(byId[id].name) + '</b>', sub: byId[id].reward ? esc(byId[id].reward.text) : '' });
    });
    Object.keys(s.quests || {}).forEach(id => {
      const q = D.QUESTS.find(x => x.id === id);
      if (!q) return;
      items.push({ at: s.quests[id], ic: '✅', t: esc(questLabel(q)), sub: esc(byId[q.region].name) });
    });
    Object.keys(s.tours || {}).forEach(id => {
      const t = TOURS.find(x => x.id === id);
      if (!t) return;
      items.push({ at: s.tours[id].completedAt, ic: '🏅', t: 'Completed the Grand Tour: <b>' + esc(t.name) + '</b>', sub: '' });
    });
    items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const nLands = REGIONS.filter(r => m.unlocked[r.id]).length;
    const nQuests = Object.keys(s.quests || {}).filter(id => D.QUESTS.some(q => q.id === id)).length;
    let h = '<div class="qa-jstats">' +
      '<div><b>' + nLands + '</b><span>of ' + REGIONS.length + ' lands</span></div>' +
      '<div><b>' + nQuests + '</b><span>quests done</span></div>' +
      '<div><b>' + m.sealed.length + '</b><span>flags planted</span></div>' +
      '</div>';
    if (!items.length) {
      h += '<p class="qa-empty">Your journal is empty. Finish a quest or clear the mist over a new land and it will be written here.</p>';
    } else {
      h += '<ol class="qa-journal">' + items.map(it =>
        '<li><span class="qa-j-ic" aria-hidden="true">' + it.ic + '</span><span class="qa-j-b"><span class="qa-j-t">' + it.t + '</span>' +
        (it.sub ? '<span class="qa-j-s">' + it.sub + '</span>' : '') +
        '<span class="qa-j-d">' + esc(_fmtDate(it.at)) + '</span></span></li>').join('') + '</ol>';
    }
    return h;
  }

  function _toursHtml() {
    const s = M.saved, completed = s.tours || {};
    const now = _currentTour(), uk = _userKey();
    let h = _renderTour(now, _tourProgress(now, uk), true, completed[now.id]);
    h += '<h3 class="qa-tours-head">Other Grand Tours</h3>';
    TOURS.forEach(t => { if (t.id !== now.id) h += _renderTour(t, _tourProgress(t, uk), false, completed[t.id]); });
    return h;
  }

  function _renderTour(tour, prog, isCurrent, completedMeta) {
    var done = !!completedMeta || prog.complete;
    var cls = 'quest-tour' + (isCurrent ? ' current' : '') + (done ? ' done' : '');
    var header = (isCurrent ? '<span class="qa-kicker">This season</span>' : '') +
      '<span class="quest-tour-name">' + tour.icon + ' ' + esc(tour.name) + (done ? ' ✓' : '') + '</span>';
    var goalsHtml = prog.goals.map(function(g) {
      var appId = D.TOUR_GOAL_APP[g.goal.id];
      var app = appId ? D.APPS[appId] : null;
      return '<div class="quest-goal">' +
        '<div class="quest-goal-head">' +
          '<span>' + (g.hit ? '✓ ' : '') + esc(g.goal.label) + '</span>' +
          '<span class="quest-goal-num">' + g.value + ' / ' + g.goal.target + '</span>' +
        '</div>' +
        '<div class="quest-goal-row"><div class="quest-goal-bar"><div class="quest-goal-fill" style="width:' + g.pct + '%"></div></div>' +
        (app && !g.hit ? '<a class="qa-go qa-go-sm" href="' + esc(app.href) + '" aria-label="Go to ' + esc(app.name) + '">Go<span aria-hidden="true"> ›</span></a>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    var doneLine = done
      ? '<div class="quest-tour-done">🏅 Tour complete' +
          (completedMeta && completedMeta.completedAt ? ' · ' + esc(_fmtDate(completedMeta.completedAt)) : '') +
        '</div>'
      : '';
    return '<div class="' + cls + '">' +
      '<div class="quest-tour-head">' + header + '</div>' +
      (isCurrent ? '<div class="quest-tour-desc">' + esc(tour.description) + '</div>' : '') +
      '<div class="quest-goals">' + goalsHtml + '</div>' +
      doneLine +
    '</div>';
  }

  // ── Region card ──
  let _lastFocus = null;
  function openRegion(regionId) {
    const region = byId[regionId];
    if (!region) return;
    if (!M) M = _model();
    const m = M;
    const open = !!m.unlocked[regionId];
    const qs = questsFor(regionId);
    const overlay = document.getElementById('quest-detail');
    if (!overlay) return;
    _lastFocus = document.activeElement;
    const nDone = qs.filter(q => m.quest[q.id].done).length;
    const need = region.epRequired - m.ep;
    let h = '<div class="qa-sheet" role="dialog" aria-modal="true" aria-labelledby="qa-sheet-title">' +
      '<button type="button" class="qa-close" id="qa-close" aria-label="Close">×</button>' +
      '<div class="qa-sheet-art' + (open ? '' : ' is-misty') + '" aria-hidden="true">' + QA_ART.landmark(regionId) + '</div>' +
      '<div class="qa-sheet-body">' +
        '<div class="qa-kicker">' + (open ? (m.sealed.indexOf(regionId) !== -1 ? '⚑ Flag planted' : 'Land ' + (region.index + 1) + ' of ' + REGIONS.length) : 'Hidden in mist') + '</div>' +
        '<h2 id="qa-sheet-title">' + esc(region.name) + '</h2>' +
        '<p class="qa-sheet-desc">' + esc(open ? region.description : 'The mist is too thick to see what is here. Earn ' + need + ' more ' + (need === 1 ? 'star' : 'stars') + ' in any app to clear it.') + '</p>';
    if (open && region.reward) {
      h += '<div class="quest-reward"><div class="reward-label">' + (region.reward.type === 'fact' ? 'Discovery' : 'Achievement') + '</div><div class="reward-text">' + esc(region.reward.text) + '</div></div>';
    }
    if (!open) {
      const prev = REGIONS[Math.max(0, region.index - 1)].epRequired;
      const pct = Math.max(2, Math.min(100, Math.round((m.ep - Math.min(prev, m.ep)) / Math.max(1, region.epRequired - Math.min(prev, m.ep)) * 100)));
      h += '<div class="qa-bar qa-bar-lg" role="progressbar" aria-label="Expedition Points toward ' + esc(region.name) + '" aria-valuemin="0" aria-valuemax="' + region.epRequired + '" aria-valuenow="' + m.ep + '"><span style="width:' + pct + '%"></span></div>' +
        '<div class="qa-bar-cap">' + m.ep + ' / ' + region.epRequired + ' EP</div>';
    }
    if (qs.length) {
      h += '<h3 class="qa-sheet-h">Quests here <small>' + nDone + ' / ' + qs.length + '</small></h3>';
      qs.forEach(q => { h += _questRow(m.quest[q.id], region, false); });
      if (!open) h += '<p class="qa-note">Quests count once the mist over this land has cleared.</p>';
    }
    h += '</div></div>';
    overlay.innerHTML = h;
    overlay.classList.add('active');
    document.body.classList.add('qa-noscroll');
    _sfx('click');
    const close = document.getElementById('qa-close');
    close.addEventListener('click', closeRegion);
    close.focus();

    // Mark as visited (unlocked lands only, as before)
    if (open) {
      const data = _load();
      if (!data.visited) data.visited = [];
      if (!data.visited.includes(regionId)) {
        data.visited.push(regionId);
        _save(data);
      }
    }
  }
  function closeRegion() {
    const overlay = document.getElementById('quest-detail');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.classList.remove('qa-noscroll');
    if (_lastFocus && _lastFocus.focus) { try { _lastFocus.focus(); } catch (e) {} }
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const o = document.getElementById('quest-detail');
      if (o && o.classList.contains('active')) closeRegion();
    }
  });

  // ── Celebrations ──
  function _celebrate(fresh) {
    const msgs = [];
    const nf = (fresh.found || []).length;
    if (nf > 2) msgs.push({ big: nf + ' new lands discovered!', small: fresh.found.map(id => byId[id].name).join(', '), ic: '🗺️' });
    else (fresh.found || []).forEach(id => msgs.push({ big: 'New land discovered!', small: byId[id].name, ic: '🗺️' }));
    const nq = (fresh.quests || []).length;
    if (nq === 1) {
      const q = D.QUESTS.find(x => x.id === fresh.quests[0]);
      msgs.push({ big: 'Quest complete!', small: questLabel(q), ic: '✅' });
    } else if (nq > 1) {
      msgs.push({ big: nq + ' quests complete!', small: 'They are written in your journal.', ic: '✅' });
    }
    if (fresh.tour) msgs.push({ big: 'Grand Tour complete!', small: fresh.tour.name, ic: '🏅' });
    if (!msgs.length) return;
    let host = document.getElementById('qa-toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'qa-toasts'; host.className = 'qa-toasts';
      host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    msgs.slice(0, 3).forEach((mm, i) => {
      setTimeout(() => {
        const t = document.createElement('div');
        t.className = 'qa-toast';
        t.innerHTML = '<span class="qa-toast-ic" aria-hidden="true">' + mm.ic + '</span><span><b>' + esc(mm.big) + '</b><small>' + esc(mm.small) + '</small></span>';
        host.appendChild(t);
        _sfx(i === 0 ? 'cheer' : 'star');
        setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 500); }, 4200);
      }, 900 + i * 1400);
    });
  }

  function getStats() {
    const ep = calculateEP();
    const data = _load();
    return {
      totalEP: ep,
      regionsUnlocked: REGIONS.filter(r => ep >= r.epRequired).length,
      regionsVisited: (data.visited || []).length,
      questsDone: Object.keys(data.quests || {}).length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, openRegion, closeRegion, calculateEP, getStats, REGIONS, TOURS };
})();
