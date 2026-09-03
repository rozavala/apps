(function() {
  'use strict';

  function openParentsCornerWrapper() {
    try {
      renderParentsCorner();
      var syncEl = document.getElementById('sync-section');
      if (syncEl && typeof CloudSync !== 'undefined') {
        var configured = CloudSync.isConfigured();
        var online = CloudSync.online;
        syncEl.innerHTML = 
          '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">' +
            '<h3 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:12px;">' +
              '☁️ Cloud Sync ' +
              '<span style="font-size:0.75rem;margin-left:8px;padding:2px 8px;border-radius:99px;' +
                'background:' + (online ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)') + ';' +
                'color:' + (online ? '#34D399' : '#F87171') + ';">' +
                (configured ? (online ? '● Connected' : '● Offline') : '○ Not set up') +
              '</span>' +
            '</h3>' +
            (configured ? 
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<button class="parent-btn" style="margin:0;font-size:0.8rem;padding:8px 16px;" ' +
                  'onclick="_syncPushAll(this)">⬆️ Push All to Cloud</button>' +
                '<button class="parent-btn" style="margin:0;font-size:0.8rem;padding:8px 16px;" ' +
                  'onclick="_syncPullAll(this)">⬇️ Pull All from Cloud</button>' +
              '</div>' +
              '<p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;">' +
                'Sync is automatic — progress pushes on save and pulls on login.' +
              '</p>' : 
              '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">' +
                'Set SYNC_SERVER in js/sync.js to sync across devices.' +
              '</p>') +
          '</div>';
      }
      var p = document.getElementById('parents-overlay');
      if (p) p.classList.add('active');
    } catch(e) {
      if (typeof Debug !== 'undefined') Debug.error('openParentsCorner failed', e.message);
    }
  }

  function openDashboardWrapper() { 
    try {
      _openDashboard(); 
    } catch(e) {
      if (typeof Debug !== 'undefined') Debug.error('openDashboard failed', e.message);
    }
  }

  // ── Public Exports (Direct Assignment at Top) ──
  window.switchUser = function() {
    if (isGuestUser()) {
      _cleanupGuestData();
    }
    setActiveUser(null);
    var hub = document.getElementById('hub-screen');
    if (hub) hub.classList.remove('active');
    var login = document.getElementById('login-screen');
    if (login) login.style.display = '';
    renderLogin();
  };

  window.openChores = function() {
    renderChoresList();
    var c = document.getElementById('chores-overlay');
    if (c) c.classList.add('active');
  };

  window.closeChores = function() {
    var c = document.getElementById('chores-overlay');
    if (c) c.classList.remove('active');
  };

  window.openParentsCorner = openParentsCornerWrapper;
  window.closeParentsCorner = function() {
    var p = document.getElementById('parents-overlay');
    if (p) p.classList.remove('active');
  };

  window.openDashboard = openDashboardWrapper;
  window.closeDashboard = function() {
    var d = document.getElementById('dash-overlay');
    if (d) d.classList.remove('active');
  };

  window.exportProgress = function() { exportProgress(); };
  window.requestPinThen = function(cb) { requestPinThen(cb); };
  window.submitPin = function() { submitPin(); };
  window.closePinModal = function() { closePinModal(); };
  window.createProfile = function() { createProfile(); };
  window.saveEditProfile = function() { saveEditProfile(); };
  window.deleteEditingProfile = function() { deleteEditingProfile(); };
  window.loginAsGuest = function() { loginAsGuest(); };
  window.openModal = function() { openModal(); };
  window.closeModal = function() { closeModal(); };
  window.updateKidLimit = function(idx, val) { updateKidLimit(idx, val); };
  window.addKidBonus = function(name, mins) { addKidBonus(name, mins); };
  window.resetKidTimer = function(name) { resetKidTimer(name); };
  window.toggleAllTimers = function(p) { toggleAllTimers(p); };
  window._syncPushAll = function(b) { _syncPushAll(b); };
  window._syncPullAll = function(b) { _syncPullAll(b); };
  window.openEditModal = function(i) { openEditModal(i); };
  window.closeEditModal = function() { closeEditModal(); };
  window.redeemForTime = function() { redeemForTime(); };
  window.updateKidChess = function(idx, val) { updateKidChess(idx, val); };
  window.updateKidFaith = function(idx, val) { updateKidFaith(idx, val); };
  window.updateKidRoutinesEnabled = function(idx, val) { updateKidRoutinesEnabled(idx, val); };
  window.addRoutineItem = function(idx, which) { addRoutineItem(idx, which); };
  window.updateRoutineItem = function(idx, which, j, val) { updateRoutineItem(idx, which, j, val); };
  window.removeRoutineItem = function(idx, which, j) { removeRoutineItem(idx, which, j); };
  window.resetRoutine = function(idx, which) { resetRoutine(idx, which); };
  window.updateKidTts = function(idx, field, val) {
    if (typeof ZsTTS === 'undefined') return;
    var profiles = getProfiles();
    var name = profiles[idx] && profiles[idx].name;
    if (!name) return;
    var patch = {};
    patch[field] = val;
    ZsTTS.setSettings(patch, name);
    if (field === 'rate') {
      var label = document.getElementById('tts-rate-val-' + idx);
      if (label) label.textContent = Number(val).toFixed(2) + 'x';
    }
  };
  window.updateKidA11y = function(idx, field, val) {
    if (typeof ZsA11y === 'undefined') return;
    var profiles = getProfiles();
    var name = profiles[idx] && profiles[idx].name;
    if (!name) return;
    var patch = {};
    patch[field] = val;
    ZsA11y.setSettings(patch, name);
    renderParentsCorner();
  };
  window.updateParentPin = function() { updateParentPin(); };
  window.openProgressManager = function() { openProgressManager(); };
  window.closeProgressManager = function() {
    var p = document.getElementById('progress-overlay');
    if (p) p.classList.remove('active');
  };
  window.selectProgressKid = function(name) { selectProgressKid(name); };
  window.applyProgressPosition = function(appId) { applyProgressPosition(appId); };
  window.completeProgressApp = function(appId) { completeProgressApp(appId); };
  window.resetProgressApp = function(appId) { resetProgressApp(appId); };
  window.resetProgressAllApps = function() { resetProgressAllApps(); };
  window.renderChoresList = function() { renderChoresList(); };
  window.completeChore = function(id) { if (typeof ChoresManager !== 'undefined') ChoresManager.completeChore(id); };

  // ── State ──
  var selectedEmoji, selectedColor, selectedAge;
  try {
    selectedEmoji = (typeof AVATARS !== 'undefined') ? AVATARS[0] : '🦊';
    selectedColor = (typeof COLORS !== 'undefined') ? COLORS[0] : '#7C3AED';
    selectedAge   = null;
  } catch(e) {
    selectedEmoji = '🦊';
    selectedColor = '#7C3AED';
  }

  var editingIndex = -1;
  var editEmoji = null;
  var editColor = null;
  var editAge = null;
  // Tap-to-confirm state for the Delete button. The native confirm()
  // dialog used to live here, but it is unreliable in iPad PWAs (the
  // standalone shell silently auto-dismisses with `false`) — which
  // made Delete look like a dead button: click did nothing, modal
  // never closed. The button now arms on first tap and commits on the
  // second tap within ARM_WINDOW_MS.
  var _deleteArmedAt   = 0;
  var _deleteArmTimer  = 0;
  var DELETE_ARM_WINDOW_MS = 5000;
  var pinCallback = null;

  // ── Implementation ──

  function renderLogin() {
    var grid = document.getElementById('profiles-grid');
    var profiles = getProfiles();
    if (!grid) return;
    grid.innerHTML = '';

    profiles.forEach(function(p, i) {
      var safe = {
        name: escHtml(p.name),
        avatar: escHtml(p.avatar),
        color: safeColor(p.color)
      };
      var card = document.createElement('div');
      card.className = 'profile-card';
      card.style.animationDelay = (0.1 + i * 0.05) + 's';
      card.style.position = 'relative';

      card.innerHTML = 
        '<div class="profile-avatar" style="background:' + safe.color + '22;border-color:' + safe.color + '">' + safe.avatar + '</div>' +
        '<div class="profile-name">' + safe.name + '</div>' +
        (p.age ? '<div class="profile-age">Age ' + escHtml(p.age) + '</div>' : '') +
        '<button class="profile-edit-btn" data-index="' + i + '" aria-label="Edit ' + safe.name + '" title="Edit ' + safe.name + '" onclick="event.stopPropagation(); requestPinThen(function() { openEditModal(' + i + '); })">✏️</button>';

      card.onclick = function(e) {
        if (e.target.closest('.profile-edit-btn')) return;
        if (typeof Debug !== 'undefined') Debug.log('Profile clicked: ' + p.name);
        setActiveUser(p);
        
        // Ensure auth.js cache is cleared so showHub reads fresh from localStorage
        if (typeof _activeUserCached !== 'undefined') window._activeUserCached = false;

        if (typeof CloudSync !== 'undefined' && CloudSync.online) {
          var key = p.name.toLowerCase().replace(/\s+/g, '_');
          var banner = document.createElement('div');
          banner.id = 'sync-banner';
          banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:8px;background:rgba(124,58,237,0.9);color:#fff;text-align:center;font-family:var(--font-display);font-weight:700;font-size:0.85rem;z-index:9999;';
          banner.textContent = '☁️ Syncing...';
          document.body.appendChild(banner);
          
          if (typeof Debug !== 'undefined') Debug.log('Starting CloudSync.pullAll for ' + key);
          CloudSync.pullAll(key)
            .then(function() { 
              if (typeof Debug !== 'undefined') Debug.log('CloudSync.pullAll success');
              banner.textContent = '✅ Synced!'; 
              setTimeout(function() { if (banner.parentNode) banner.remove(); showHub(); }, 600); 
            })
            .catch(function(err) { 
              if (typeof Debug !== 'undefined') Debug.error('CloudSync.pullAll failed', err.message);
              banner.textContent = '⚠️ Offline — using local data'; 
              setTimeout(function() { if (banner.parentNode) banner.remove(); showHub(); }, 1200); 
            });
        } else {
          if (typeof Debug !== 'undefined') Debug.log('CloudSync offline or undefined, skipping pullAll');
          showHub();
        }
      };

      grid.appendChild(card);
    });

    var addCard = document.createElement('div');
    addCard.className = 'profile-card add-card';
    addCard.style.animationDelay = (0.1 + profiles.length * 0.05) + 's';
    addCard.onclick = openModal;
    addCard.innerHTML = '<div class="add-icon">+</div><div class="add-label">Add Player</div>';
    grid.appendChild(addCard);

    var guestCard = document.createElement('div');
    guestCard.className = 'profile-card guest-card';
    guestCard.style.animationDelay = (0.15 + profiles.length * 0.05) + 's';
    guestCard.onclick = loginAsGuest;
    guestCard.innerHTML = 
      '<div class="profile-avatar" style="background:rgba(96,165,250,0.15);border-color:#60A5FA">🌟</div>' +
      '<div class="profile-name">Guest</div>' +
      '<div class="profile-age" style="font-size:0.7rem;">🔒 PIN required</div>';
    grid.appendChild(guestCard);
  }

  function loginAsGuest() {
    requestPinThen(function() {
      var guestProfile = {
        name: 'Guest',
        avatar: '🌟',
        color: '#60A5FA',
        age: 7,
        isGuest: true,
        maxMinutes: 15
      };
      
      if (typeof Debug !== 'undefined') Debug.log('loginAsGuest: Setting active user and forcing cache clear');
      setActiveUser(guestProfile);
      
      // Global reset for the auth cache to force a fresh read from localStorage in showHub
      if (typeof _activeUserCached !== 'undefined') window._activeUserCached = false;
      
      showHub();
    });
  }

  function isGuestUser() {
    var user = getActiveUser();
    return user && user.isGuest === true;
  }

  function _cleanupGuestData() {
    var key = 'guest';
    var prefixes = [
      'zs_mathgalaxy_', 'zs_chile_', 'zs_chess_', 'zs_chess_plays_',
      'zs_timer_', 'zs_chores_', 'zs_fe_', 'zs_guitar_', 'zs_art_',
      'zs_sports_', 'zs_move_', 'zs_lab_', 'zs_world_', 'zs_story_', 'zs_quest_',
      'zs_lcheck_', 'zs_lastrank_', 'littlemaestro_'
    ];
    prefixes.forEach(function(p) {
      try { localStorage.removeItem(p + key); } catch (e) {}
    });
    try { localStorage.removeItem('littlemaestro_guest_recital'); } catch (e) {}
  }

  function showHub() {
    if (typeof Debug !== 'undefined') Debug.log('showHub started');
    var user = getActiveUser();
    if (!user) {
      if (typeof Debug !== 'undefined') Debug.error('showHub failed: no active user');
      return;
    }
    if (typeof Debug !== 'undefined') Debug.log('showHub user: ' + user.name);
    var key = user.name.toLowerCase().replace(/\s+/g, '_');
    
    var els = {
      login: document.getElementById('login-screen'),
      hub: document.getElementById('hub-screen'),
      avatar: document.getElementById('ub-avatar'),
      name: document.getElementById('ub-name'),
      greeting: document.getElementById('ub-greeting'),
      timer: document.getElementById('timer-display'),
      tokens: document.getElementById('token-balance'),
      challenge: document.getElementById('next-challenge-wrap')
    };

    if (els.login) {
      els.login.style.display = 'none';
      if (typeof Debug !== 'undefined') Debug.log('login-screen hidden');
    } else {
      if (typeof Debug !== 'undefined') Debug.warn('login-screen NOT FOUND');
    }
    
    if (els.hub) {
      els.hub.classList.add('active');
      if (typeof Debug !== 'undefined') Debug.log('hub-screen active');
    } else {
      if (typeof Debug !== 'undefined') Debug.error('hub-screen NOT FOUND');
    }

    var color = safeColor(user.color);
    if (els.avatar) {
      els.avatar.textContent = user.avatar;
      els.avatar.style.cssText = 'background:' + color + '22;border-color:' + color;
    }
    if (els.name) els.name.textContent = user.name;
    
    if (typeof Debug !== 'undefined') Debug.log('Calculating stats and rank...');
    var totalStars = 0;
    var rank = { icon: '🛸', name: 'Cadet' };
    var precalcStats = null;
    if (typeof getPlayerStats === 'function') {
      try {
        precalcStats = getPlayerStats(user.name);
        totalStars = precalcStats.totalStars;
        rank = typeof getExplorerRank === 'function' ? getExplorerRank(user.name, precalcStats) : { icon: '🛸', name: 'Cadet' };
      } catch(e) { if (typeof Debug !== 'undefined') Debug.error('getPlayerStats/Rank failed', e.message); }
    } else {
      try {
        totalStars = typeof getTotalStars === 'function' ? getTotalStars(user.name) : 0;
        rank = typeof getExplorerRank === 'function' ? getExplorerRank(user.name) : { icon: '🛸', name: 'Cadet' };
      } catch(e) { if (typeof Debug !== 'undefined') Debug.error('getTotalStars/Rank failed', e.message); }
    }

    var rankText = rank.icon + ' ' + rank.name;
    var starText = totalStars > 0 ? ' · ⭐ ' + totalStars : '';
    
    if (isGuestUser()) {
      if (els.greeting) els.greeting.textContent = '🌟 Guest Player · 15 min session';
    } else {
      if (els.greeting) els.greeting.textContent = rankText + starText + ' · ' + getGreeting();
    }

    if (!isGuestUser()) {
      var lastRank = 'Cadet';
      try {
        lastRank = localStorage.getItem('zs_lastrank_' + key) || 'Cadet';
      } catch (e) {}
      
      if (rank.name !== lastRank && lastRank !== 'Cadet') {
        if (typeof Debug !== 'undefined') Debug.log('Rank Up! Show celebration');
        showRankUpCelebration(rank);
      }
      try {
        localStorage.setItem('zs_lastrank_' + key, rank.name);
      } catch (e) {}
    }

    if (typeof TimerManager !== 'undefined' && els.timer) {
      var rem = TimerManager.getRemaining();
      els.timer.textContent = '⏰ ' + rem + ' min left';
    }
    
    if (typeof ChoresManager !== 'undefined' && els.tokens) {
      if (isGuestUser()) {
        els.tokens.style.display = 'none';
      } else {
        var tokens = ChoresManager.getStatus().totalTokens;
        els.tokens.textContent = '⭐ ' + tokens + ' tokens';
        els.tokens.style.display = '';
      }
    }

    if (typeof ChileanCalendar !== 'undefined') {
      try { ChileanCalendar.renderHubWidget('calendar-widget'); }
      catch(e) { if (typeof Debug !== 'undefined') Debug.error('renderHubWidget failed', e.message); }
    }

    if (typeof Routines !== 'undefined') {
      try { Routines.renderHubWidget('routines-widget'); }
      catch(e) { if (typeof Debug !== 'undefined') Debug.error('Routines.renderHubWidget failed', e.message); }
    }

    if (typeof Debug !== 'undefined') Debug.log('Rendering app cards...');
    try {
      renderAppCards(user);
    } catch(e) { if (typeof Debug !== 'undefined') Debug.error('renderAppCards failed', e.message); }
    
    try {
      updateStatsCards(user, precalcStats);
    } catch(e) { if (typeof Debug !== 'undefined') Debug.error('updateStatsCards failed', e.message); }

    if (typeof Debug !== 'undefined') Debug.log('Calculating next challenge...');
    try {
      var challenge = getNextChallenge(user, precalcStats);
      if (els.challenge && challenge) {
        els.challenge.innerHTML = 
          '<div class="next-challenge" onclick="' + (challenge.href ? "location.href='" + challenge.href + "'" : "") + '" ' +
               'style="border: 2px solid ' + color + '44; background: var(--bg-surface); padding: 16px; border-radius: 16px;' +
                      'display: flex; align-items: center; gap: 16px; cursor: pointer; margin-bottom: 24px; animation: fadeUp 0.6s ease-out both;">' +
            '<span style="font-size: 2rem;">' + challenge.icon + '</span>' +
            '<div style="flex: 1;">' +
              '<div style="font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">' + challenge.text + '</div>' +
              '<div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">' + challenge.sub + '</div>' +
            '</div>' +
            '<span style="font-size: 1.5rem; color: var(--purple); animation: rocketBounce 2s infinite;">→</span>' +
          '</div>';
      }
    } catch(e) { if (typeof Debug !== 'undefined') Debug.error('getNextChallenge failed', e.message); }
    
    if (typeof Debug !== 'undefined') Debug.log('showHub finished');
  }

  function showRankUpCelebration(rank) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 
      'position: fixed; inset: 0; z-index: 9999;' +
      'background: rgba(11, 11, 26, 0.9); backdrop-filter: blur(8px);' +
      'display: flex; flex-direction: column; align-items: center; justify-content: center;' +
      'text-align: center; color: #F0EDFF; font-family: var(--font-display);' +
      'animation: fadeIn 0.5s ease-out;';
    overlay.innerHTML = 
      '<div style="font-size: 80px; margin-bottom: 20px; animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);">' +
        rank.icon +
      '</div>' +
      '<h2 style="font-size: 2.5rem; margin-bottom: 10px;">🎉 Rank Up!</h2>' +
      '<div style="font-size: 1.8rem; font-weight: 800; color: var(--purple);">' + rank.name + '</div>' +
      '<p style="margin-top: 20px; opacity: 0.8;">You\'ve reached a new explorer level!</p>';
    document.body.appendChild(overlay);
    if (typeof showConfetti === 'function') showConfetti();
    setTimeout(function() {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s ease';
      setTimeout(function() { overlay.remove(); }, 500);
    }, 3000);
  }

  function getNextChallenge(user, precalculatedStats) {
    if (!user) user = getActiveUser();
    if (!user) return null;
    var key = user.name.toLowerCase().replace(/\s+/g, '_');
    var todayAppIds = (typeof AppSchedule !== 'undefined') ? AppSchedule.getTodayApps() : [];
    var alwaysVisible = ['sports', 'move', 'quest'];

    var apps = [
      { name: 'Math Galaxy', icon: '🧮', href: 'math-galaxy.html', key: 'zs_mathgalaxy_' + key, schedId: 'math' },
      { name: 'Descubre Chile', icon: '🇨🇱', href: 'descubre-chile.html', key: 'zs_chile_' + key, schedId: 'chile' },
      { name: 'Chess Quest', icon: '♟️', href: 'chess-quest.html', key: 'zs_chess_' + key, schedId: 'chess' },
      { name: 'Little Maestro', icon: '🎹', href: 'little-maestro.html', key: 'littlemaestro_' + key, schedId: 'piano' },
      { name: 'Fe Explorador', icon: '⛪', href: 'fe-explorador.html', key: 'zs_fe_' + key, schedId: 'faith' },
      { name: 'Guitar Jam', icon: '🎸', href: 'guitar-jam.html', key: 'zs_guitar_' + key, schedId: 'guitar' },
      { name: 'Art Studio', icon: '🎨', href: 'art-studio.html', key: 'zs_art_' + key, schedId: 'art' },
      { name: 'Sports Arena', icon: '🏓', href: 'sports-arena.html', key: 'zs_sports_' + key, schedId: 'sports' },
      { name: 'Move Quest', icon: '💪', href: 'move-quest.html', key: 'zs_move_' + key, schedId: 'move' },
      { name: 'Lab Explorer', icon: '🔬', href: 'lab-explorer.html', key: 'zs_lab_' + key, schedId: 'lab' },
      { name: 'World Explorer', icon: '🌍', href: 'world-explorer.html', key: 'zs_world_' + key, schedId: 'world' },
      { name: 'World Atlas', icon: '🗺️', href: 'world-atlas.html', key: 'zs_atlas_' + key, schedId: 'atlas' },
      { name: 'Story Explorer', icon: '📚', href: 'story-explorer.html', key: 'zs_story_' + key, schedId: 'story' }
    ];

    var visibleApps = apps.filter(function(app) {
      return todayAppIds.indexOf(app.schedId) !== -1 ||
             alwaysVisible.indexOf(app.schedId) !== -1 ||
             (app.schedId === 'faith' && user.faithVisible !== false);
    });

    var stats = precalculatedStats || (typeof getPlayerStats === 'function' ? getPlayerStats(user.name) : { appStats: {} });
    var appStats = stats.appStats || {};

    var noProgress = [];
    visibleApps.forEach(function(app) {
      try {
        var data = appStats[app.schedId] || JSON.parse(localStorage.getItem(app.key)) || {};
        var hasProg = false;
        if (app.name === 'Math Galaxy') hasProg = Object.keys(data).length > 0;
        else if (app.name === 'Descubre Chile') hasProg = Object.keys(data).filter(function(k) { return k!=='vr' && k!=='memBest'; }).length > 0;
        else if (app.name === 'Chess Quest') hasProg = (data.puzzlesSolved || 0) + (data.wins || 0) > 0;
        else if (app.name === 'Little Maestro') hasProg = (data.progress && Object.keys(data.progress).length > 0);
        else if (app.name === 'Fe Explorador') hasProg = (data.totalStars || 0) > 0;
        else if (app.name === 'Guitar Jam') hasProg = (data.totalStars || 0) > 0;
        else if (app.name === 'Art Studio') hasProg = (data.totalStars || 0) > 0;
        else if (app.name === 'Sports Arena') hasProg = (data.matches || []).length + (data.activities || []).length > 0;
        else if (app.name === 'Move Quest') hasProg = (data.workoutsDone || 0) > 0;
        else if (app.name === 'Lab Explorer') hasProg = (data.totalStars || 0) > 0;
        else if (app.name === 'World Explorer') hasProg = (data.totalStars || 0) > 0;
        else if (app.name === 'World Atlas') hasProg = (data.totalStars || 0) + (data.cardsStudied || 0) > 0;
        else if (app.name === 'Story Explorer') hasProg = (data.totalStars || 0) > 0;

        if (!hasProg) noProgress.push(app);
      } catch (e) { noProgress.push(app); }
    });
    if (noProgress.length > 0) {
      var pick = noProgress[Math.floor(Math.random() * noProgress.length)];
      return { text: 'Try something new!', sub: pick.name, icon: pick.icon, href: pick.href };
    }

    return { text: 'Keep practicing!', sub: 'Play any app to earn more stars', icon: '⭐', href: null };
  }

  function updateStatsCards(user, precalculatedStats) {
    try {
      if (!user) user = getActiveUser();
      if (!user) return;

      var els = {
        guitar: document.getElementById('stats-guitar'),
        art:    document.getElementById('stats-art'),
        faith:  document.getElementById('stats-faith'),
        piano:  document.getElementById('stats-piano'),
        math:   document.getElementById('stats-math'),
        chile:  document.getElementById('stats-chile'),
        chess:  document.getElementById('stats-chess'),
        sports: document.getElementById('stats-sports'),
        move:   document.getElementById('stats-move'),
        lab:    document.getElementById('stats-lab'),
        world:  document.getElementById('stats-world'),
        atlas:  document.getElementById('stats-atlas'),
        story:  document.getElementById('stats-story'),
        quest:  document.getElementById('stats-quest'),
        guess:  document.getElementById('stats-guess'),
        money:  document.getElementById('stats-money'),
        invest: document.getElementById('stats-invest')
      };

      var stats = precalculatedStats || (typeof getPlayerStats === 'function' ? getPlayerStats(user.name) : { appStats: {} });
      var appStats = stats.appStats || {};

      try {
        var gj = appStats.guitar || {};
        if (els.guitar && (gj.totalStars || 0) > 0) els.guitar.innerHTML = '<span class="cs-item active">⭐ ' + gj.totalStars + '</span>';
      } catch (e) {}

      try {
        var as = appStats.art || {};
        if (els.art && (as.totalStars || 0) > 0) els.art.innerHTML = '<span class="cs-item active">⭐ ' + as.totalStars + '</span>';
      } catch (e) {}

      try {
        var fe = appStats.faith || {};
        if (els.faith && (fe.totalStars || 0) > 0) els.faith.innerHTML = '<span class="cs-item active">⭐ ' + fe.totalStars + '</span>';
      } catch (e) {}

      try {
        var lm = appStats.piano || {};
        var prog = lm.progress || {};
        var completedSongs = 0;
        var totalLMStars = 0;
        for (var songId in prog) {
          var v = prog[songId];
          if (typeof v === 'object' && v !== null && v.stars > 0) {
            completedSongs++;
            totalLMStars += v.stars;
          }
        }
        var streak = (lm.stats && lm.stats.currentStreak) || 0;
        if (els.piano) {
          if (completedSongs > 0) {
            var items = ['⭐ ' + totalLMStars + ' stars', '🎼 ' + completedSongs + ' songs'];
            if (streak > 0) items.push('🔥 ' + streak + ' streak');
            els.piano.innerHTML = items.map(function(i) { return '<span class="cs-item active">' + i + '</span>'; }).join('');
          } else {
            els.piano.innerHTML = '';
          }
        }
      } catch (e) { if (els.piano) els.piano.innerHTML = ''; }

      try {
        var mg = appStats.math || {};
        var totalMGStars = 0;
        var hasMG = false;
        for (var lvl in mg) {
          hasMG = true;
          totalMGStars += (mg[lvl].bestStars || 0);
        }
        if (els.math) {
          if (hasMG) {
            els.math.innerHTML = '<span class="cs-item active">⭐ ' + totalMGStars + ' stars</span>';
          } else {
            els.math.innerHTML = '';
          }
        }
      } catch (e) { if (els.math) els.math.innerHTML = ''; }

      try {
        var dc = appStats.chile || {};
        var totalDCStars = 0;
        if (els.chile) {
          for (var tId in dc) {
            if (tId !== 'vr' && tId !== 'memBest' && dc[tId]) {
              totalDCStars += (dc[tId].bestStars || 0);
            }
          }
          if (totalDCStars > 0) {
            els.chile.innerHTML = '<span class="cs-item active">⭐ ' + totalDCStars + ' stars</span>';
          } else {
            els.chile.innerHTML = '';
          }
        }
      } catch (e) { if (els.chile) els.chile.innerHTML = ''; }

      try {
        var cq = appStats.chess || {};
        if (els.chess) {
          var total = (cq.puzzlesSolved || 0) + (cq.wins || 0);
          if (total > 0) {
            els.chess.innerHTML = '<span class="cs-item active">⭐ ' + total + ' stars</span>';
          } else {
            els.chess.innerHTML = '';
          }
        }
      } catch (e) { if (els.chess) els.chess.innerHTML = ''; }

      try {
        var sa = appStats.sports || {};
        var matchCount = (sa.matches || []).length;
        var actCount = (sa.activities || []).length;
        if (els.sports && (matchCount + actCount) > 0) {
          els.sports.innerHTML = 
            '<span style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">' +
              '⭐ ' + (sa.totalStars || 0) + ' · ' + matchCount + ' matches · ' + actCount + ' activities' +
            '</span>';
        }
      } catch (e) {}

      try {
        var mq = appStats.move || {};
        var workouts = mq.workoutsDone || 0;
        if (els.move && workouts > 0) {
          els.move.innerHTML = '<span class="cs-item active">💪 ' + workouts + ' workout' +
                               (workouts === 1 ? '' : 's') + ' · Level ' + (mq.level || 1) + '</span>';
        }
      } catch (e) {}

      try {
        var le = appStats.lab || {};
        if (els.lab && (le.totalStars || 0) > 0) {
          var labs = 0;
          for (var lk in le) {
            if (lk !== 'totalStars' && (le[lk].completed || 0) > 0) labs++;
          }
          els.lab.innerHTML = '<span class="cs-item active">⭐ ' + le.totalStars + ' · ' + labs + ' labs</span>';
        }
      } catch (e) {}

      try {
        var we = appStats.world || {};
        if (els.world && (we.totalStars || 0) > 0) {
          var visited = we.visited ? we.visited.length : 0;
          els.world.innerHTML = '<span class="cs-item active">⭐ ' + we.totalStars + ' · ' + visited + ' countries</span>';
        }
      } catch (e) {}

      try {
        var wa = appStats.atlas || {};
        var mastered = 0;
        for (var iso in (wa.countries || {})) {
          if (wa.countries[iso] && wa.countries[iso].m) mastered++;
        }
        if (els.atlas && ((wa.totalStars || 0) > 0 || mastered > 0)) {
          els.atlas.innerHTML = '<span class="cs-item active">⭐ ' + (wa.totalStars || 0) +
                                ' · ' + mastered + ' mastered</span>';
        }
      } catch (e) {}

      try {
        var se = appStats.story || {};
        if (els.story && (se.totalStars || 0) > 0) {
          var sRead = se.storiesRead ? se.storiesRead.length : 0;
          var wLrn = se.wordsLearned ? se.wordsLearned.length : 0;
          els.story.innerHTML = '<span class="cs-item active">⭐ ' + se.totalStars + ' · ' + sRead + ' stories · ' + wLrn + ' words</span>';
        }
      } catch (e) {}

      try {
        var ep = typeof QuestAdventure !== 'undefined' ? QuestAdventure.calculateEP() : 0;
        if (els.quest && ep > 0) {
          els.quest.innerHTML = '<span class="cs-item active">⚡ ' + ep + ' EP</span>';
        }
      } catch (e) {}

      try {
        if (els.guess && typeof GuessQuest !== 'undefined') {
          var gs = GuessQuest.getStats();
          if (gs.roundsPlayed > 0) {
            els.guess.innerHTML = '<span class="cs-item active">⭐ ' + gs.totalStars + '</span><span class="cs-item">🎮 ' + gs.roundsWon + '/' + gs.roundsPlayed + '</span>';
          }
        }
      } catch (e) {}

      try {
        if (els.money) {
          var mkey = 'zs_money_' + (user.name ? user.name.toLowerCase().replace(/\s+/g, '_') : '_default');
          var mraw = localStorage.getItem(mkey);
          var mdata = mraw ? (JSON.parse(mraw) || {}) : {};
          var mStars = 0, mRounds = 0;
          ['clp', 'usd'].forEach(function(c) {
            var bucket = mdata[c] || {};
            for (var mk in bucket) {
              mStars += (bucket[mk].stars || 0);
              if (bucket[mk].score) mRounds++;
            }
          });
          if (mStars > 0 || mRounds > 0) {
            els.money.innerHTML = '<span class="cs-item active">⭐ ' + mStars + '</span><span class="cs-item">🪙 ' + mRounds + ' modes</span>';
          }
        }
      } catch (e) {}

      try {
        if (els.invest) {
          var ikey = 'zs_invest_' + (user.name ? user.name.toLowerCase().replace(/\s+/g, '_') : '_default');
          var iraw = localStorage.getItem(ikey);
          var idata = iraw ? (JSON.parse(iraw) || {}) : {};
          var iGames = idata.games || 0;
          if (iGames > 0) {
            var iBest = idata.bestRoi != null ? Math.round(idata.bestRoi * 100) : 0;
            els.invest.innerHTML = '<span class="cs-item active">📈 ' + (iBest > 0 ? '+' : '') + iBest + '%</span><span class="cs-item">🎮 ' + iGames + '</span>';
          }
        }
      } catch (e) {}

    } catch(err) {}
  }

  // ════════════════════════════════════════════════════════════════
  //  REDESIGN — Dashboard "Overview" (charts from real local data)
  //  All values are derived from data the suite already stores:
  //    • totalStars / rank  → getPlayerStats / getExplorerRank
  //    • screen time today  → TimerManager (per-kid minutesUsed/max)
  //    • tokens             → zs_chores_<kid>.totalTokens
  //    • activity trend +   → ActivityLog timestamped events
  //      app usage + streak
  // ════════════════════════════════════════════════════════════════
  var _DASH_RANKS = [
    { n: 'Cadet', s: 0, i: '🛸' }, { n: 'Apprentice', s: 15, i: '🌟' },
    { n: 'Veteran', s: 30, i: '🛡️' }, { n: 'Explorer', s: 60, i: '🌍' },
    { n: 'Pilot', s: 100, i: '🚀' }, { n: 'Astronaut', s: 150, i: '🌌' },
    { n: 'Elite', s: 250, i: '💎' }, { n: 'Grand Master', s: 500, i: '👑' }
  ];
  var _APP_COLOR = {
    'Math Galaxy': '#1D4ED8', 'Little Maestro': '#6D28D9', 'Chess Quest': '#B45309',
    'Art Studio': '#BE185D', 'Descubre Chile': '#B91C1C', 'Lab Explorer': '#047857',
    'World Explorer': '#1D4ED8', 'Story Explorer': '#6D28D9', 'Guitar Jam': '#047857',
    'Fe Explorador': '#B45309', 'Sports Arena': '#0D9488', 'Guess Quest': '#B45309',
    'Quest Adventure': '#B45309', 'Book & Movie Check': '#1D4ED8', 'Routines': '#0D9488'
  };
  function _appColor(name) { return _APP_COLOR[name] || '#4338CA'; }
  function _slug(s) { return String(s || '').toLowerCase().replace(/\s+/g, '_'); }
  function _nextRank(stars) {
    for (var i = 0; i < _DASH_RANKS.length; i++) {
      if (stars < _DASH_RANKS[i].s) return { next: _DASH_RANKS[i], prev: _DASH_RANKS[i - 1] || _DASH_RANKS[0] };
    }
    return { next: null, prev: _DASH_RANKS[_DASH_RANKS.length - 1] };
  }

  // Weekly STARS history — one snapshot per ISO week (Monday key), last 12 weeks.
  function _starsWeekKey(ts) { var d = new Date(ts); var dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return d.toISOString().split('T')[0]; }
  function _readStarsHistory() { try { return JSON.parse(localStorage.getItem('zs_stars_history')) || {}; } catch (e) { return {}; } }
  function _recordStarsSnapshot(profiles) {
    var h = _readStarsHistory();
    try {
      var total = 0;
      (profiles || []).forEach(function(p) { try { var s = (typeof getPlayerStats === 'function') ? getPlayerStats(p.name) : {}; total += (s.totalStars || 0); } catch (e) {} });
      h[_starsWeekKey(Date.now())] = total;
      var keys = Object.keys(h).sort();
      while (keys.length > 12) { delete h[keys.shift()]; }
      localStorage.setItem('zs_stars_history', JSON.stringify(h));
    } catch (e) {}
    return h;
  }
  function _seriesSvg(vals, color) {
    var n = vals.length; if (n < 2) return '';
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), span = (max - min) || 1;
    var pts = vals.map(function(v, i) { return [i * (520 / (n - 1)), 80 - ((v - min) / span) * 62]; });
    var line = pts.map(function(pt, i) { return (i ? 'L' : 'M') + pt[0].toFixed(0) + ',' + pt[1].toFixed(0); }).join(' ');
    var last = pts[n - 1];
    return '<svg viewBox="0 0 520 96" width="100%" height="120" preserveAspectRatio="none" style="display:block;">' +
      '<defs><linearGradient id="ovTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.22"></stop><stop offset="100%" stop-color="' + color + '" stop-opacity="0"></stop></linearGradient></defs>' +
      '<path d="' + line + ' L520,90 L0,90 Z" fill="url(#ovTrend)"></path>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
      '<circle cx="' + last[0].toFixed(0) + '" cy="' + last[1].toFixed(0) + '" r="4.5" fill="' + color + '" stroke="#ffffff" stroke-width="2"></circle>' +
    '</svg>';
  }
  // Accrue a weekly snapshot on every hub load (so the trend fills even if the dashboard is rarely opened).
  try { document.addEventListener('DOMContentLoaded', function() { try { if (typeof getProfiles === 'function') _recordStarsSnapshot(getProfiles()); } catch (e) {} }); } catch (e) {}

  function _renderOverview(profiles) {
    if (!profiles || !profiles.length) return '';
    var DAY = 86400000, now = Date.now();
    var totalStars = 0, tokens = 0, usedMin = 0, maxMin = 0;
    var activeDays = {}, weekBuckets = [0,0,0,0,0,0,0,0];
    var appCount = {}, appIcon = {};
    var perKid = [];

    profiles.forEach(function(p) {
      var stats = {}, ts = 0, rank = { icon: '🛸', name: 'Cadet' };
      try { stats = (typeof getPlayerStats === 'function') ? getPlayerStats(p.name) : {}; ts = stats.totalStars || 0; } catch (e) {}
      try { rank = (typeof getExplorerRank === 'function') ? getExplorerRank(p.name, stats) : rank; } catch (e) {}
      totalStars += ts;
      try { var ch = JSON.parse(localStorage.getItem('zs_chores_' + _slug(p.name))); if (ch && ch.totalTokens) tokens += ch.totalTokens; } catch (e) {}
      try { var td = (typeof TimerManager !== 'undefined' && TimerManager.getDataForKid) ? TimerManager.getDataForKid(p.name) : null; if (td) { usedMin += (td.minutesUsed || 0); maxMin += (td.maxMinutes || 0); } } catch (e) {}

      var ev = [];
      try { ev = (typeof ActivityLog !== 'undefined') ? (ActivityLog.getForUser(p.name) || []) : []; } catch (e) {}
      var kidDays = {}, kidWeek = 0, kidApps = {};
      ev.forEach(function(e) {
        if (!e || !e.ts) return;
        var age = now - e.ts;
        var wk = Math.floor(age / (7 * DAY));
        if (wk >= 0 && wk < 8) weekBuckets[7 - wk]++;
        if (age <= 7 * DAY) {
          var d = new Date(e.ts).toISOString().split('T')[0];
          activeDays[d] = true; kidDays[d] = true; kidWeek++;
          if (e.app) { appCount[e.app] = (appCount[e.app] || 0) + 1; if (e.icon) appIcon[e.app] = e.icon; }
        }
      });
      // streak: consecutive days ending today (or yesterday) with activity
      var streak = 0;
      for (var i = 0; i < 60; i++) {
        var dk = new Date(now - i * DAY).toISOString().split('T')[0];
        if (kidDays[dk]) streak++;
        else if (i > 0) break;
      }
      var topApps = Object.keys(kidApps).sort(function(a, b) { return kidApps[b] - kidApps[a]; }).slice(0, 2);
      perKid.push({ p: p, stars: ts, rank: rank, week: kidWeek, streak: streak, top: topApps, used: 0, max: 0 });
    });

    var activeDayCount = Object.keys(activeDays).length;
    var hasActivity = weekBuckets.some(function(v) { return v > 0; });

    // ---------- summary tiles ----------
    function tile(accent, icon, big, sub) {
      return '<div style="padding:16px 16px 14px;border-radius:16px;background:linear-gradient(180deg,' + accent + '14,' + accent + '05);border:1px solid ' + accent + '55;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="width:34px;height:34px;border-radius:10px;background:' + accent + '22;display:flex;align-items:center;justify-content:center;font-size:18px;">' + icon + '</div>' +
        '</div>' +
        '<div style="font-family:var(--font-display);font-weight:800;font-size:1.85rem;line-height:1;margin-top:12px;color:#1c1b29;">' + big + '</div>' +
        '<div style="font-size:0.78rem;font-weight:700;color:#6b6878;margin-top:3px;">' + sub + '</div>' +
      '</div>';
    }
    var tiles = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;">' +
      tile('#B45309', '⭐', totalStars, 'Total stars · family') +
      tile('#0D9488', '🔥', activeDayCount + '<span style="font-size:0.95rem;color:#6b6878;">/7</span>', 'Active days this week') +
      tile('#2563EB', '⏱', (maxMin ? usedMin : 0) + '<span style="font-size:0.95rem;color:#6b6878;">m</span>', 'Screen time today' + (maxMin ? ' · ' + maxMin + 'm limit' : '')) +
      tile('#6D28D9', '🪙', tokens, 'Adventure tokens') +
    '</div>';

    // ---------- trend: prefer real weekly STARS history, else activity sessions ----------
    var starsHist = _recordStarsSnapshot(profiles);
    var histKeys = Object.keys(starsHist).sort();
    var trend, trendTitle, trendBadge, axisL = '', trendAxis = '';
    if (histKeys.length >= 2) {
      trend = _seriesSvg(histKeys.map(function(k) { return starsHist[k]; }), '#B45309');
      trendTitle = 'Stars earned · last ' + histKeys.length + ' weeks';
      trendBadge = totalStars + ' total';
      axisL = histKeys.length + ' wks ago';
    } else if (hasActivity) {
      trend = _seriesSvg(weekBuckets, '#4338CA');
      trendTitle = 'Activity · last 8 weeks';
      trendBadge = weekBuckets.reduce(function(a, b) { return a + b; }, 0) + ' this week';
      axisL = '8 wks ago';
    } else {
      trend = '<div style="padding:28px 8px;text-align:center;color:#9a97a8;font-weight:700;font-size:0.85rem;">Trend builds up one snapshot per week — check back soon.</div>';
      trendTitle = 'Stars earned · trend';
      trendBadge = totalStars + ' total';
    }
    if (trend.indexOf('<svg') === 0) {
      trendAxis = '<div style="display:flex;justify-content:space-between;font-size:0.66rem;font-weight:700;color:#9a97a8;margin-top:2px;"><span>' + axisL + '</span><span>now</span></div>';
    }

    // ---------- screen-time donut (today) ----------
    var pct = maxMin ? Math.min(1, usedMin / maxMin) : 0;
    var donutColor = pct < 0.8 ? '#0D9488' : (pct < 1 ? '#B45309' : '#DC2626');
    var off = (314 * (1 - pct)).toFixed(0);
    var donut = '<div style="display:flex;align-items:center;gap:16px;">' +
      '<div style="position:relative;width:104px;height:104px;flex:none;">' +
        '<svg viewBox="0 0 120 120" width="104" height="104">' +
          '<circle cx="60" cy="60" r="50" fill="none" stroke="#ece9f5" stroke-width="13"></circle>' +
          '<circle cx="60" cy="60" r="50" fill="none" stroke="' + donutColor + '" stroke-width="13" stroke-linecap="round" stroke-dasharray="314" stroke-dashoffset="' + off + '" transform="rotate(-90 60 60)"></circle>' +
        '</svg>' +
        '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
          '<div style="font-family:var(--font-display);font-weight:800;font-size:1.3rem;line-height:1;color:#1c1b29;">' + Math.round(pct * 100) + '%</div>' +
          '<div style="font-size:0.62rem;font-weight:700;color:#6b6878;">of limit</div>' +
        '</div>' +
      '</div>' +
      '<div style="flex:1;font-size:0.8rem;font-weight:700;color:#3a3850;line-height:1.7;">' +
        '<div>Used <b style="float:right;">' + usedMin + ' min</b></div>' +
        '<div>Left <b style="float:right;">' + Math.max(0, maxMin - usedMin) + ' min</b></div>' +
        '<div style="border-top:1px solid #eceaf3;margin-top:6px;padding-top:6px;color:#6b6878;">Daily limit <b style="color:#1c1b29;">' + maxMin + ' min</b></div>' +
      '</div>' +
    '</div>';

    // ---------- charts row ----------
    var charts = '<div style="display:grid;grid-template-columns:1.7fr 1fr;gap:14px;margin-bottom:18px;">' +
      '<div style="padding:18px 20px 14px;border-radius:16px;background:#ffffff;border:1px solid #e6e6ee;box-shadow:0 4px 14px rgba(15,15,25,0.08);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><div style="font-weight:800;font-size:0.9rem;color:#1c1b29;">' + trendTitle + '</div><div style="font-size:0.78rem;font-weight:800;color:#4338CA;">' + trendBadge + '</div></div>' +
        trend + trendAxis +
      '</div>' +
      '<div style="padding:18px 20px;border-radius:16px;background:#ffffff;border:1px solid #e6e6ee;box-shadow:0 4px 14px rgba(15,15,25,0.08);">' +
        '<div style="font-weight:800;font-size:0.9rem;color:#1c1b29;margin-bottom:12px;">Screen time today</div>' + donut +
      '</div>' +
    '</div>';

    // ---------- per-kid snapshot cards ----------
    var kidCards = perKid.map(function(k) {
      var col = safeColor(k.p.color);
      var nr = _nextRank(k.stars);
      var pPct = 100;
      if (nr.next) { var span = nr.next.s - nr.prev.s; pPct = span > 0 ? Math.round(((k.stars - nr.prev.s) / span) * 100) : 0; }
      var chips = k.top.map(function(a) {
        return '<span style="font-size:0.62rem;font-weight:800;color:#fff;background:' + _appColor(a) + ';padding:3px 8px;border-radius:99px;">' + escHtml((appIcon[a] || '') + ' ' + a) + '</span>';
      }).join('');
      return '<div style="padding:15px;border-radius:16px;background:#ffffff;border:1px solid #e6e6ee;box-shadow:0 4px 14px rgba(15,15,25,0.08);">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:11px;">' +
          '<div style="width:40px;height:40px;border-radius:50%;border:2.5px solid ' + col + ';background:' + col + '1a;display:flex;align-items:center;justify-content:center;font-size:20px;">' + escHtml(k.p.avatar) + '</div>' +
          '<div style="min-width:0;"><div style="font-family:var(--font-display);font-weight:800;font-size:0.98rem;color:#1c1b29;">' + escHtml(k.p.name) + '</div>' +
          '<div style="font-size:0.7rem;font-weight:800;color:' + col + ';">' + k.rank.icon + ' ' + escHtml(k.rank.name) + ' · ' + k.stars + ' ★</div></div>' +
          (k.streak > 1 ? '<div style="margin-left:auto;font-size:0.7rem;font-weight:800;color:#C2410C;">🔥 ' + k.streak + 'd</div>' : '') +
        '</div>' +
        '<div style="height:7px;border-radius:99px;background:#ece9f5;overflow:hidden;margin-bottom:6px;"><div style="width:' + Math.max(3, Math.min(100, pPct)) + '%;height:100%;border-radius:99px;background:' + col + ';"></div></div>' +
        '<div style="font-size:0.68rem;font-weight:700;color:#6b6878;margin-bottom:' + (chips ? '10' : '0') + 'px;">' + (nr.next ? (nr.next.s - k.stars) + ' ★ to ' + nr.next.i + ' ' + nr.next.n : 'Top rank reached! 👑') + '</div>' +
        (chips ? '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + chips + '</div>' : '') +
      '</div>';
    }).join('');
    var kids = '<div style="font-weight:800;font-size:0.9rem;color:#1c1b29;margin:4px 0 12px;">Explorers</div>' +
      '<div style="display:grid;grid-template-columns:repeat(' + Math.min(3, perKid.length) + ',1fr);gap:14px;margin-bottom:18px;">' + kidCards + '</div>';

    // ---------- most-used apps (last 7 days) ----------
    var apps = '';
    var appList = Object.keys(appCount).sort(function(a, b) { return appCount[b] - appCount[a]; }).slice(0, 5);
    if (appList.length) {
      var amax = Math.max.apply(null, appList.map(function(a) { return appCount[a]; }).concat([1]));
      var rows = appList.map(function(a) {
        var w = Math.round((appCount[a] / amax) * 100);
        return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
          '<span style="font-size:15px;width:20px;text-align:center;">' + escHtml(appIcon[a] || '📦') + '</span>' +
          '<span style="font-size:0.8rem;font-weight:700;width:110px;color:#1c1b29;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(a) + '</span>' +
          '<div style="flex:1;height:9px;border-radius:99px;background:#ece9f5;overflow:hidden;"><div style="width:' + w + '%;height:100%;border-radius:99px;background:' + _appColor(a) + ';"></div></div>' +
          '<span style="font-size:0.72rem;font-weight:800;color:#6b6878;width:34px;text-align:right;">' + appCount[a] + '×</span>' +
        '</div>';
      }).join('');
      apps = '<div style="padding:18px 20px;border-radius:16px;background:#ffffff;border:1px solid #e6e6ee;box-shadow:0 4px 14px rgba(15,15,25,0.08);margin-bottom:24px;">' +
        '<div style="font-weight:800;font-size:0.9rem;color:#1c1b29;margin-bottom:14px;">Most-used apps · this week</div>' + rows +
      '</div>';
    }

    return '<div style="margin-bottom:8px;">' + tiles + charts + kids + apps + '</div>';
  }

  function _openDashboard() {
    if (typeof Debug !== 'undefined') Debug.log('Opening Dashboard...');
    var content = document.getElementById('dash-content');

    var finishOpening = function() {
      if (typeof Debug !== 'undefined') Debug.log('Dashboard: finishOpening started');
      var profiles = getProfiles();
        
      if (profiles.length === 0) {
        content.innerHTML = '<p style="color:var(--text-muted)">No profiles created yet.</p>';
        document.getElementById('dash-overlay').classList.add('active');
        return;
      }

      var html = '';

      // ── Redesign: at-a-glance overview (charts wired to real data) ──
      try { html += _renderOverview(profiles); } catch (e) { if (typeof Debug !== 'undefined') Debug.error('overview render failed', e.message); }

      // Diagnostics flush row — small utility for parents / dev
      if (typeof ZsDiag !== 'undefined') {
        var pending = ZsDiag.pendingCount();
        html += '<div id="dash-diag-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 14px;background:rgba(96,165,250,0.06);border:1.5px dashed rgba(96,165,250,0.2);border-radius:12px;font-size:0.82rem;">' +
          '<div style="font-weight:700;color:var(--text-muted);">' +
            '🩺 Diagnostics · <span id="dash-diag-pending">' + pending + '</span> pending on this device' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button id="dash-diag-flush" class="hub-action-btn secondary" style="padding:6px 12px;font-size:0.78rem;margin:0;" onclick="flushDiagnostics(this)">📤 Flush now</button>' +
          '</div>' +
        '</div>';
      }

      // ── Insights & nudges — passive, rule-based (no AI) ──
      if (typeof ActivityLog !== 'undefined') {
        html += _renderInsights(profiles);
      }

      if (typeof ActivityLog !== 'undefined') {
        html += '<div style="margin-bottom:24px;">' +
          '<div style="font-weight:800; font-family:var(--font-display); font-size:1.1rem; margin-bottom:12px;">' +
            '📋 Recent Activity (Last 7 Days)' +
          '</div>';
        
        var allRecent = [];
        profiles.forEach(function(p) {
          try {
            var recent = ActivityLog.getRecent(p.name, 7);
            if (Array.isArray(recent)) {
              recent.forEach(function(e) {
                if (e && e.ts) {
                  allRecent.push(Object.assign({}, e, { kidName: p.name, kidAvatar: p.avatar }));
                }
              });
            }
          } catch(e) { console.warn('[Dashboard] Failed to load activity for ' + p.name + ':', e); }
        });
        
        allRecent.sort(function(a, b) { return (Number(b.ts) || 0) - (Number(a.ts) || 0); });
        allRecent = allRecent.slice(0, 20);

        if (allRecent.length === 0) {
          html += '<p style="color:var(--text-muted); font-size:0.85rem;">No recent activity recorded yet.</p>';
        } else {
          html += '<div style="display:flex; flex-direction:column; gap:8px;">';
          allRecent.forEach(function(e) {
            var when = _timeAgo(e.ts);
            html += '<div style="display:flex; align-items:center; gap:10px; padding:10px; background:#ffffff; border:1px solid #e6e6ee; box-shadow:0 2px 6px rgba(15,15,25,0.05); border-radius:12px;">' +
              '<span style="font-size:1.2rem;">' + escHtml(e.icon) + '</span>' +
              '<div style="flex:1; min-width:0;">' +
                '<div style="font-weight:700; font-size:0.85rem;">' + escHtml(e.kidName) + ' · ' + escHtml(e.app) + '</div>' +
                '<div style="font-size:0.78rem; color:var(--text-muted);">' + escHtml(e.desc) + '</div>' +
              '</div>' +
              '<div style="font-size:0.7rem; color:var(--text-muted); white-space:nowrap;">' + when + '</div>' +
            '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      }

      // Recitals section (music recordings via RecitalRecorder)
      if (typeof RecitalRecorder !== 'undefined') {
        html += '<div id="dash-recitals" style="margin-bottom:24px;">' +
          '<div style="font-weight:800; font-family:var(--font-display); font-size:1.1rem; margin-bottom:12px;">🎙 Recitals</div>' +
          '<div id="dash-recitals-body" style="color:var(--text-muted); font-size:0.85rem;">Loading…</div>' +
        '</div>';
      }

      html += profiles.map(function(p) {
        var stats = typeof getPlayerStats === 'function' ? getPlayerStats(p.name) : { appStats: {} };
        var appStats = stats.appStats || {};
        var appRows = '';

        var mg = appStats.math || {};
        var totalMG = 0;
        var mgCount = 0;
        for (var mk in mg) { totalMG += (mg[mk].bestStars || 0); mgCount++; }
        if (mgCount > 0) {
          var pct = (totalMG / 40) * 100;
          appRows += '<div class="dash-app-row">' +
            '<span class="dash-app-icon">🧮</span>' +
            '<span class="dash-app-name">Math Galaxy</span>' +
            '<div class="dash-bar-wrap"><div class="dash-bar dash-bar-math" style="width:' + Math.min(100, pct) + '%"></div></div>' +
            '<span class="dash-app-stat">⭐ ' + totalMG + '</span>' +
          '</div>';
        }

        var dc = appStats.chile || {};
        var totalDC = 0;
        for (var dk in dc) { if (dk !== 'vr' && dk !== 'memBest' && dc[dk]) totalDC += (dc[dk].bestStars || 0); }
        if (totalDC > 0) {
          var pct = (totalDC / 30) * 100;
          appRows += '<div class="dash-app-row">' +
            '<span class="dash-app-icon">🇨🇱</span>' +
            '<span class="dash-app-name">Descubre Chile</span>' +
            '<div class="dash-bar-wrap"><div class="dash-bar dash-bar-chile" style="width:' + Math.min(100, pct) + '%"></div></div>' +
            '<span class="dash-app-stat">⭐ ' + totalDC + '</span>' +
          '</div>';
        }

        var cq = appStats.chess || {};
        var totalCQ = (cq.puzzlesSolved || 0) + (cq.wins || 0);
        if (totalCQ > 0) {
          var pct = (totalCQ / 50) * 100;
          appRows += '<div class="dash-app-row">' +
            '<span class="dash-app-icon">♟️</span>' +
            '<span class="dash-app-name">Chess Quest</span>' +
            '<div class="dash-bar-wrap"><div class="dash-bar dash-bar-chess" style="width:' + Math.min(100, pct) + '%"></div></div>' +
            '<span class="dash-app-stat">⭐ ' + totalCQ + '</span>' +
          '</div>';
        }

        var lm = appStats.piano || {};
        var prog = lm.progress || {};
        var totalLM = 0;
        for (var lk in prog) { if (typeof prog[lk] === 'object' && prog[lk] !== null) totalLM += (prog[lk].stars || 0); }
        if (totalLM > 0) {
          var pct = (totalLM / 50) * 100;
          appRows += '<div class="dash-app-row">' +
            '<span class="dash-app-icon">🎹</span>' +
            '<span class="dash-app-name">Little Maestro</span>' +
            '<div class="dash-bar-wrap"><div class="dash-bar dash-bar-piano" style="width:' + Math.min(100, pct) + '%"></div></div>' +
            '<span class="dash-app-stat">⭐ ' + totalLM + '</span>' +
          '</div>';
        }

        var rank = typeof getExplorerRank === 'function' ? getExplorerRank(p.name, stats) : { icon: '🛸', name: 'Cadet' };

        return '<div class="dash-profile">' +
          '<div class="dash-profile-header">' +
            '<div class="dash-avatar" style="background:' + safeColor(p.color) + '22;border-color:' + safeColor(p.color) + '">' + escHtml(p.avatar) + '</div>' +
            '<div>' +
              '<div class="dash-name">' + escHtml(p.name) + '</div>' +
              '<div style="display:flex; gap:8px; font-size:0.78rem; font-weight:600;">' +
                '<div class="dash-age">' + (p.age ? 'Age ' + escHtml(p.age) : '') + '</div>' +
                '<div class="dash-rank" style="color:var(--purple);">' + rank.icon + ' ' + rank.name + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          appRows +
        '</div>';
      }).join('');

      content.innerHTML = html;
      document.getElementById('dash-overlay').classList.add('active');

      // Populate recitals asynchronously (IndexedDB)
      if (typeof RecitalRecorder !== 'undefined') {
        _renderRecitals();
      }
    };

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      if (typeof Debug !== 'undefined') Debug.log('Dashboard: starting cloud sync');
      content.innerHTML = '<div style="text-align:center; padding:40px 20px;"><div class="sync-emoji" style="font-size:3rem; margin-bottom:12px; animation: syncPulse 1s infinite;">🔄</div><p style="color:var(--text-muted); font-weight:700;">Syncing latest activity from cloud…</p></div>';
      document.getElementById('dash-overlay').classList.add('active');
      CloudSync.pullAllKids()
        .then(function() {
          if (typeof Debug !== 'undefined') Debug.log('Dashboard: sync complete');
          finishOpening();
        })
        .catch(function(e) { 
          if (typeof Debug !== 'undefined') Debug.error('Dashboard: sync failed', e.message);
          console.warn('[Dashboard] Sync pull failed:', e);
          content.innerHTML += '<p style="color:var(--red); font-size:0.8rem; font-weight:700; margin-top:12px;">⚠️ Sync failed. Showing local data only.</p>';
          setTimeout(finishOpening, 1500);
        });
    } else {
      if (typeof Debug !== 'undefined') Debug.log('Dashboard: offline mode');
      if (typeof CloudSync !== 'undefined' && !CloudSync.online) {
        content.innerHTML = '<p style="color:var(--orange); font-size:0.85rem; font-weight:700; text-align:center; margin-bottom:20px;">☁️ Offline — showing local data only</p>';
      }
      finishOpening();
    }
  }

  function _fmtDuration(ms) {
    var s = Math.round((ms || 0) / 1000);
    var m = Math.floor(s / 60); s = s % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  // ── Insights & nudges ──────────────────────────────────────────
  // Purely rule-based. Reads last-7-day ActivityLog entries for each
  // kid, classifies events by category, and surfaces:
  //   - A tiny horizontal bar showing category split (where time
  //     actually went this week)
  //   - One or two nudge chips ("Only 1 physical activity —
  //     suggest Sports Arena?") when the balance is skewed
  // No writes, no push notifications — nudges live inside this panel.
  var _INSIGHT_CATEGORIES = {
    physical:       { label: 'Physical', color: '#0D9488', apps: ['Sports Arena', 'Move Quest'] },
    math:           { label: 'Math',     color: '#1D4ED8', apps: ['Math Galaxy'] },
    music:          { label: 'Music',    color: '#6D28D9', apps: ['Little Maestro', 'Guitar Jam'] },
    creative:       { label: 'Creative', color: '#BE185D', apps: ['Art Studio'] },
    language:       { label: 'Language', color: '#C2410C', apps: ['Story Explorer', 'Guess Quest'] },
    culture:        { label: 'Culture',  color: '#B91C1C', apps: ['Descubre Chile', 'Fe Explorador', 'World Explorer'] },
    science:        { label: 'Science',  color: '#0E7490', apps: ['Lab Explorer'] },
    strategy:       { label: 'Strategy', color: '#B45309', apps: ['Chess Quest'] },
    adventure:      { label: 'Quests',   color: '#4338CA', apps: ['Quest Adventure', 'Book & Movie Check'] },
    habit:          { label: 'Habits',   color: '#047857', apps: ['Routines'] }
  };

  function _classifyApp(appName) {
    if (!appName) return null;
    for (var k in _INSIGHT_CATEGORIES) {
      if (_INSIGHT_CATEGORIES[k].apps.indexOf(appName) !== -1) return k;
    }
    return null;
  }

  function _weekInsightsFor(profileName) {
    var events = [];
    try {
      if (typeof ActivityLog !== 'undefined' && ActivityLog.getRecent) {
        events = ActivityLog.getRecent(profileName, 7) || [];
      }
    } catch (e) { events = []; }

    var total = 0;
    var byCat = {};
    var distinctApps = {};
    events.forEach(function(e) {
      var cat = _classifyApp(e.app);
      if (!cat) return;
      total++;
      byCat[cat] = (byCat[cat] || 0) + 1;
      if (e.app) distinctApps[e.app] = true;
    });

    // Routine streak
    var streak = 0;
    try {
      var rk = 'zs_routines_' + profileName.toLowerCase().replace(/\s+/g, '_');
      var raw = localStorage.getItem(rk);
      if (raw) {
        var rd = JSON.parse(raw);
        if (rd && typeof rd.streak === 'number') streak = rd.streak;
      }
    } catch (e) {}

    // Nudges — simple, honest, age-agnostic rules.
    var nudges = [];
    var physCount = byCat.physical || 0;
    if (total > 0 && physCount < 2) {
      nudges.push({ icon: '🏓', text: 'Only ' + physCount + ' physical activit' + (physCount === 1 ? 'y' : 'ies') + ' this week — try Sports Arena or Move Quest.' });
    }
    var topCat = null, topCount = 0;
    Object.keys(byCat).forEach(function(c) {
      if (byCat[c] > topCount) { topCount = byCat[c]; topCat = c; }
    });
    if (total >= 8 && topCat && topCount / total >= 0.6) {
      nudges.push({ icon: '🎯', text: 'Heavy on ' + _INSIGHT_CATEGORIES[topCat].label + ' (' + Math.round(topCount / total * 100) + '%) — try something new.' });
    }
    if (total > 0 && streak === 0) {
      nudges.push({ icon: '🌅', text: 'No routine streak yet this week — the morning checklist is a fast win.' });
    }
    if (total === 0) {
      nudges.push({ icon: '👀', text: 'No recorded activity this week — a quiet stretch or a sign to nudge?' });
    }
    return { total: total, byCat: byCat, appCount: Object.keys(distinctApps).length, nudges: nudges, streak: streak };
  }

  function _renderInsights(profiles) {
    if (!profiles || profiles.length === 0) return '';

    var cards = profiles.map(function(p) {
      var ins = _weekInsightsFor(p.name);
      var barSegments = '';
      if (ins.total > 0) {
        barSegments = Object.keys(_INSIGHT_CATEGORIES).map(function(cat) {
          var n = ins.byCat[cat] || 0;
          if (n === 0) return '';
          var pct = (n / ins.total) * 100;
          var c = _INSIGHT_CATEGORIES[cat];
          return '<span class="ins-seg" title="' + escHtml(c.label) + ': ' + n + '" ' +
                 'style="width:' + pct.toFixed(1) + '%;background:' + c.color + ';"></span>';
        }).join('');
      }

      var legend = Object.keys(_INSIGHT_CATEGORIES).map(function(cat) {
        var n = ins.byCat[cat] || 0;
        if (n === 0) return '';
        var c = _INSIGHT_CATEGORIES[cat];
        return '<span class="ins-legend"><span class="ins-dot" style="background:' + c.color + ';"></span>' +
               escHtml(c.label) + ' ' + n + '</span>';
      }).join('');

      var nudgeHtml = ins.nudges.slice(0, 2).map(function(n) {
        return '<div class="ins-nudge"><span class="ins-n-ic">' + escHtml(n.icon) + '</span><span>' + escHtml(n.text) + '</span></div>';
      }).join('');

      var avatar = '<div class="ins-avatar" style="background:' + safeColor(p.color) + '22;border-color:' + safeColor(p.color) + ';">' + escHtml(p.avatar) + '</div>';
      var summary = ins.total === 0
        ? '<div class="ins-empty">No activity recorded this week.</div>'
        : '<div class="ins-bar" role="img" aria-label="Activity by category">' + barSegments + '</div>' +
          '<div class="ins-legend-row">' + legend + '</div>' +
          '<div class="ins-stats">' +
            '<span>✨ ' + ins.total + ' events</span>' +
            '<span>🎨 ' + ins.appCount + ' apps</span>' +
            '<span>🔥 Streak ' + ins.streak + '</span>' +
          '</div>';

      return '<div class="ins-card">' +
        '<div class="ins-head">' + avatar +
          '<div class="ins-name">' + escHtml(p.name) + '</div>' +
        '</div>' +
        summary +
        (nudgeHtml ? '<div class="ins-nudges">' + nudgeHtml + '</div>' : '') +
      '</div>';
    }).join('');

    return '<div style="margin-bottom:24px;">' +
      '<div style="font-weight:800; font-family:var(--font-display); font-size:1.1rem; margin-bottom:12px;">' +
        '🧭 Insights & nudges (Last 7 Days)' +
      '</div>' +
      '<div class="ins-grid">' + cards + '</div>' +
    '</div>';
  }

  function _renderRecitals() {
    var body = document.getElementById('dash-recitals-body');
    if (!body) return;
    if (typeof RecitalRecorder === 'undefined') {
      body.textContent = 'Recitals module not loaded.';
      return;
    }
    RecitalRecorder.list().then(function(recs) {
      if (!recs || recs.length === 0) {
        body.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">' +
          'No recitals recorded yet. Ask your kid to tap the 🎙 button in Little Maestro or Guitar Jam.' +
        '</p>';
        return;
      }

      // Group by user
      var byUser = {};
      recs.forEach(function(r) {
        if (!byUser[r.user]) byUser[r.user] = [];
        byUser[r.user].push(r);
      });

      var html = '';
      Object.keys(byUser).forEach(function(name) {
        html += '<div style="margin-bottom:16px;">' +
          '<div style="font-weight:800;font-size:0.95rem;margin-bottom:8px;">' + escHtml(name) + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">';
        byUser[name].forEach(function(r) {
          var when = _timeAgo(r.createdAt);
          html +=
            '<div class="dash-recital" data-id="' + r.id + '" ' +
              'style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">' +
              '<span style="font-size:1.2rem;">' + (r.app === 'piano' ? '🎹' : '🎸') + '</span>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-weight:700;font-size:0.85rem;">' + escHtml(r.appTitle || r.app) + ' · ' + _fmtDuration(r.duration) + '</div>' +
                '<div style="font-size:0.75rem;color:var(--text-muted);">' + when + '</div>' +
              '</div>' +
              '<button style="padding:6px 10px;border-radius:99px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:var(--text);cursor:pointer;font-size:0.78rem;font-weight:700;" ' +
                      'onclick="playRecital(' + r.id + ')" aria-label="Play recital">▶</button>' +
              '<button style="padding:6px 10px;border-radius:99px;border:1px solid rgba(248,113,113,0.25);background:rgba(248,113,113,0.08);color:#F87171;cursor:pointer;font-size:0.78rem;font-weight:700;" ' +
                      'onclick="deleteRecital(' + r.id + ')" aria-label="Delete recital">🗑</button>' +
            '</div>';
        });
        html += '</div></div>';
      });

      body.innerHTML = html;
    }).catch(function(e) {
      body.innerHTML = '<p style="color:#F87171;font-size:0.8rem;font-weight:700;">⚠️ Could not load recitals: ' + escHtml(e.message || e) + '</p>';
    });
  }

  window.playRecital = function(id) {
    if (typeof RecitalRecorder !== 'undefined') RecitalRecorder.play(Number(id));
  };
  window.deleteRecital = function(id) {
    if (typeof RecitalRecorder === 'undefined') return;
    _ask({ title: 'Delete this recital?', confirmLabel: 'Delete', danger: true }, function() {
      RecitalRecorder.remove(Number(id)).then(_renderRecitals);
    });
  };

  window.flushDiagnostics = function(btn) {
    if (typeof ZsDiag === 'undefined') return;
    var orig = btn ? btn.textContent : null;
    if (btn) { btn.textContent = '⏳ Flushing…'; btn.disabled = true; }

    // Two steps: (1) ship local buffer to VPS, (2) ask VPS to run the
    // scrub-and-push bridge so the digest lands on the diag branch.
    ZsDiag.flushNow().then(function(r1) {
      var server = (typeof CloudSync !== 'undefined' && CloudSync.server) ? CloudSync.server : null;
      if (!server) return Promise.resolve({ status: 'no-server' });
      return fetch(server + '/api/diag/flush', { method: 'POST' })
        .then(function(res) { return res.json().catch(function() { return { status: 'ok' }; }); })
        .catch(function(e) { return { status: 'error', error: e && e.message }; });
    }).then(function(r2) {
      if (btn) {
        btn.textContent = (r2 && r2.status === 'ok') ? '✅ Pushed' : '⚠️ ' + (r2 && r2.status || 'unknown');
        setTimeout(function() {
          btn.textContent = orig || '📤 Flush now';
          btn.disabled = false;
        }, 2500);
      }
      var pendEl = document.getElementById('dash-diag-pending');
      if (pendEl) pendEl.textContent = String(ZsDiag.pendingCount());
    }).catch(function(e) {
      if (btn) { btn.textContent = '❌ Failed'; setTimeout(function() { btn.textContent = orig || '📤 Flush now'; btn.disabled = false; }, 2500); }
    });
  };

  function _timeAgo(ts) {
    var diff = Date.now() - ts;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    return days + 'd ago';
  }

  function exportProgress() {
    var profiles = getProfiles();
    var exportData = {
      exported: new Date().toISOString(),
      suite: 'Zavala Serra Apps',
      profiles: profiles.map(function(p) {
        var key = p.name.toLowerCase().replace(/\s+/g, '_');
        return {
          name: p.name,
          age: p.age,
          apps: {
            math: JSON.parse(localStorage.getItem('zs_mathgalaxy_' + key) || '{}'),
            chile: JSON.parse(localStorage.getItem('zs_chile_' + key) || '{}'),
            chess: JSON.parse(localStorage.getItem('zs_chess_' + key) || '{}'),
            piano: JSON.parse(localStorage.getItem('littlemaestro_' + key) || '{}')
          }
        };
      })
    };
    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'progress.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function renderChoresList() {
    var content = document.getElementById('chores-content');
    if (!content || typeof ChoresManager === 'undefined') return;
    var chores = ChoresManager.getChores();
    var status = ChoresManager.getStatus();

    content.innerHTML = 
      '<div class="tokens-summary">' +
        '<div class="tokens-count">⭐ ' + status.totalTokens + ' <span>Adventure Tokens</span></div>' +
        '<button class="btn-redeem" onclick="redeemForTime()" ' + (status.totalTokens < 3 ? 'disabled' : '') + '>' +
          'Redeem 3 Tokens for +15 min ⏰' +
        '</button>' +
      '</div>' +
      '<div class="chores-grid">' +
        chores.map(function(c) {
          var isDone = status.completed.indexOf(c.id) !== -1;
          return '<div class="chore-item ' + (isDone ? 'completed' : '') + '" onclick="completeChore(\'' + c.id + '\')">' +
            '<div class="chore-check">' + (isDone ? '✅' : '○') + '</div>' +
            '<div class="chore-label">' + c.label + '</div>' +
            '<div class="chore-tokens">+' + c.tokens + ' ⭐</div>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  function redeemForTime() {
    if (ChoresManager.redeemTokens(3)) {
      if (typeof showConfetti === 'function') showConfetti();
      _say('¡Genial! Has ganado 15 minutos extra de juego. 🚀');
    }
  }

  /* ──────────────────────────────────────────────────────────────
     PROGRESS MANAGER

     Parents Corner → "Set / Reset Progress". Two jobs:

       • put a kid at a specific point in an app — pick the song
         they're practising and everything before it counts as done;
       • wipe an app (or every app) for a kid whose saved progress
         was lost, or who is starting over.

     All the storage logic lives in js/progress-admin.js; this is the
     screen on top of it.
     ────────────────────────────────────────────────────────────── */

  var _progressKid = null;

  function _progressKidName() {
    var profiles = getProfiles();
    if (!profiles.length) return null;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].name === _progressKid) return _progressKid;
    }
    return profiles[0].name;
  }

  function openProgressManager() {
    _progressKid = _progressKidName();
    renderProgressManager();
    var o = document.getElementById('progress-overlay');
    if (o) o.classList.add('active');
  }

  function selectProgressKid(name) {
    _progressKid = name;
    renderProgressManager();
  }

  function _progressAppRow(state) {
    var app = state.app;
    var body;

    if (state.mode === 'reset') {
      body =
        '<div class="pg-note">' +
          (state.hasData
            ? 'Stars and history are a running tally here, so there is no place to set — only a reset.'
            : 'Nothing saved yet.') +
        '</div>';
    } else if (!state.total) {
      body = '<div class="pg-note">No lesson list available.</div>';
    } else {
      var done = state.doneCount;
      var current = state.current;
      var options = '';
      var group = null;
      state.units.forEach(function(u, idx) {
        if (u.g !== group) {
          if (group !== null) options += '</optgroup>';
          group = u.g;
          options += '<optgroup label="' + escHtml(group) + '">';
        }
        options += '<option value="' + idx + '"' + (idx === state.index ? ' selected' : '') + '>' +
                     escHtml(u.l) +
                   '</option>';
      });
      if (group !== null) options += '</optgroup>';

      body =
        '<div class="pg-status">' +
          (current
            ? 'Working on <strong>' + escHtml(current.l) + '</strong> — ' + done + ' of ' + state.total + ' done'
            : 'All ' + state.total + ' done 🎉') +
        '</div>' +
        '<label class="pg-label" for="pg-sel-' + app.id + '">' +
          'Set the ' + app.noun + ' they are on (everything before it counts as done):' +
        '</label>' +
        '<select class="pg-select" id="pg-sel-' + app.id + '">' + options + '</select>' +
        '<div class="pg-actions">' +
          '<button class="hub-action-btn" onclick="applyProgressPosition(\'' + app.id + '\')">Set</button>' +
          '<button class="hub-action-btn secondary" onclick="completeProgressApp(\'' + app.id + '\')">Mark all done</button>' +
        '</div>';
    }

    return '<div class="pg-app-card">' +
        '<div class="pg-app-head">' +
          '<span class="pg-app-icon">' + app.icon + '</span>' +
          '<a class="pg-app-name" href="' + app.href + '">' + escHtml(app.label) + '</a>' +
          '<button class="pg-reset-btn" onclick="resetProgressApp(\'' + app.id + '\')"' +
                  (state.hasData ? '' : ' disabled') + '>Reset</button>' +
        '</div>' +
        body +
      '</div>';
  }

  function renderProgressManager() {
    var container = document.getElementById('progress-content');
    if (!container) return;

    if (typeof ProgressAdmin === 'undefined') {
      container.innerHTML = '<p style="color:var(--text-muted);">Progress Manager could not load.</p>';
      return;
    }

    var profiles = getProfiles();
    if (!profiles.length) {
      container.innerHTML = '<p style="color:var(--text-muted);">Add a player first.</p>';
      return;
    }

    var name = _progressKidName();
    _progressKid = name;

    var tabs = profiles.map(function(p) {
      return '<button class="pg-kid-tab' + (p.name === name ? ' active' : '') + '" ' +
                'onclick="selectProgressKid(' + escHtml(JSON.stringify(p.name)) + ')">' +
               escHtml(p.avatar) + ' ' + escHtml(p.name) +
             '</button>';
    }).join('');

    var rows = ProgressAdmin.summary(name).map(_progressAppRow).join('');

    container.innerHTML =
      '<p class="pg-intro">' +
        'Pick where <strong>' + escHtml(name) + '</strong> is in each app. Handy when a device was ' +
        'wiped, or when they already play a piece the app has not seen them finish.' +
      '</p>' +
      '<div class="pg-kid-tabs">' + tabs + '</div>' +
      '<div class="pg-app-list">' + rows + '</div>' +
      '<div class="pg-danger">' +
        '<button class="pg-reset-btn wide" onclick="resetProgressAllApps()">' +
          '⚠️ Reset every app for ' + escHtml(name) +
        '</button>' +
      '</div>';
  }

  function applyProgressPosition(appId) {
    var name = _progressKidName();
    var sel = document.getElementById('pg-sel-' + appId);
    if (!name || !sel) return;
    var idx = parseInt(sel.value, 10);
    var app = ProgressAdmin.getApp(appId);
    var units = ProgressAdmin.unitsFor(app);
    var label = units[idx] ? units[idx].l : '';
    _ask({
      title: 'Set ' + name + "'s place in " + app.label + '?',
      message: 'They will be working on "' + label + '". The ' + idx + ' ' +
               app.noun + (idx === 1 ? '' : 's') + ' before it will count as done, ' +
               'and anything after it will not.',
      confirmLabel: 'Set'
    }, function() {
      ProgressAdmin.setPosition(name, appId, idx);
      _afterProgressChange(app.label + ' set to "' + label + '" for ' + name + '.');
    });
  }

  function completeProgressApp(appId) {
    var name = _progressKidName();
    var app = ProgressAdmin.getApp(appId);
    if (!name || !app) return;
    var total = ProgressAdmin.unitsFor(app).length;
    _ask({
      title: 'Mark ' + app.label + ' complete?',
      message: 'All ' + total + ' ' + app.noun + 's will count as done for ' + name + '.',
      confirmLabel: 'Mark all done'
    }, function() {
      ProgressAdmin.setPosition(name, appId, total);
      _afterProgressChange(app.label + ' marked complete for ' + name + '.');
    });
  }

  function resetProgressApp(appId) {
    var name = _progressKidName();
    var app = ProgressAdmin.getApp(appId);
    if (!name || !app) return;
    _ask({
      title: 'Erase ' + name + "'s progress in " + app.label + '?',
      message: 'This cannot be undone.',
      confirmLabel: 'Erase',
      danger: true
    }, function() {
      ProgressAdmin.reset(name, appId);
      _afterProgressChange(app.label + ' reset for ' + name + '.');
    });
  }

  function resetProgressAllApps() {
    var name = _progressKidName();
    if (!name) return;
    _ask({
      title: 'Erase every app for ' + name + '?',
      message: 'Every app\u2019s saved progress for ' + name + ' will be wiped. This cannot be undone.',
      confirmLabel: 'Erase everything',
      danger: true
    }, function() {
      _ask({
        title: 'Last chance',
        message: 'Really wipe every app for ' + name + '?',
        confirmLabel: 'Yes, wipe it all',
        danger: true
      }, function() {
        var n = ProgressAdmin.resetAll(name);
        _afterProgressChange('Reset ' + n + ' apps for ' + name + '.');
      });
    });
  }

  // Ask, then act. Falls back to window.confirm only where ZsDialog is
  // missing — the in-page dialog exists because some iOS webviews never
  // show the native one, and there confirm() answers "no" on its own.
  function _ask(opts, onYes) {
    if (typeof ZsDialog === 'undefined') {
      if (window.confirm(opts.title + (opts.message ? '\n\n' + opts.message : ''))) onYes();
      return;
    }
    ZsDialog.confirm(opts).then(function(yes) { if (yes) onYes(); });
  }

  // Say something to the parent without a native alert(), for the same
  // reason _ask exists.
  function _say(message) {
    if (typeof ZsDialog !== 'undefined') ZsDialog.toast(message);
    else window.alert(message);
  }

  function _afterProgressChange(message) {
    renderProgressManager();
    // The hub's own stat cards read the same storage, so refresh them.
    try {
      var user = getActiveUser();
      if (user) updateStatsCards(user);
    } catch (e) {}
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      try { ActivityLog.log('Parents Corner', '📈', message); } catch (e) {}
    }
    _say(message);
  }

  function renderParentsCorner() {
    if (typeof Debug !== 'undefined') Debug.log('Opening Parents Corner...');
    var profiles = getProfiles();
    var container = document.getElementById('parents-content');
    if (!container) return;
    var isPaused = TimerManager.isPaused();
    
    container.innerHTML = 
      '<div class="parents-top-actions" style="margin-bottom:20px; padding:16px; background:rgba(255,255,255,0.05); border-radius:16px; display:flex; flex-direction:column; gap:16px;">' +
        '<label class="pk-toggle" style="justify-content:center; font-size:1.1rem;">' +
          '<input type="checkbox" ' + (isPaused ? 'checked' : '') + ' onchange="toggleAllTimers(this.checked)">' +
          ' ⏸ Pause All Timers' +
        '</label>' +
        '<button class="hub-action-btn secondary" style="margin:0;" onclick="openProgressManager()">' +
          '📈 Set / Reset Progress' +
        '</button>' +
        '<div style="display:flex; gap:12px; align-items:center; justify-content:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">' +
          '<span style="font-size:0.9rem; font-weight:700;">Parent PIN:</span>' +
          '<input type="password" id="new-parent-pin" maxlength="4" value="' + getParentPin() + '" ' +
                 'style="width:60px; padding:4px 8px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:4px; text-align:center;">' +
          '<button class="hub-action-btn secondary" style="padding:4px 12px; font-size:0.8rem;" onclick="updateParentPin()">Update</button>' +
        '</div>' +
      '</div>' +
      (typeof AppSchedule !== 'undefined' ? AppSchedule.renderScheduleConfig() : '') +
      '<div class="parents-grid">' +
        profiles.map(function(p, i) {
          var timerData = TimerManager.getDataForKid(p.name) || { minutesUsed: 0, maxMinutes: 45 };
          return '<div class="parent-kid-card">' +
              '<div class="pk-header">' +
                '<span class="pk-avatar">' + escHtml(p.avatar) + '</span>' +
                '<span class="pk-name">' + escHtml(p.name) + '</span>' +
              '</div>' +
              '<div class="pk-status" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; font-weight:700;">' +
                '⏰ Used ' + timerData.minutesUsed + ' of ' + timerData.maxMinutes + ' min today' +
              '</div>' +
              '<div class="pk-setting">' +
                '<label>Daily Time Limit: <span id="val-' + i + '">' + escHtml(p.maxMinutes || 45) + '</span> min</label>' +
                '<input type="range" min="15" max="120" step="15" value="' + escHtml(p.maxMinutes || 45) + '" oninput="updateKidLimit(' + i + ', this.value)">' +
              '</div>' +
              '<div class="pk-setting" style="margin-top:12px;">' +
                '<label>♟ Chess Plays/Week: <span id="chess-val-' + i + '">' + escHtml(_chessLabel(p.chessPlaysPerWeek)) + '</span></label>' +
                '<input type="range" min="0" max="7" step="1" value="' + (p.chessPlaysPerWeek === undefined ? 2 : p.chessPlaysPerWeek) + '" oninput="updateKidChess(' + i + ', this.value)">' +
              '</div>' +
              '<div class="pk-setting" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">' +
                '<button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1;" onclick="addKidBonus(getProfiles()[' + i + '].name, 15)">+15 min</button>' +
                '<button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1;" onclick="addKidBonus(getProfiles()[' + i + '].name, 30)">+30 min</button>' +
                '<button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1; border-color:rgba(239,68,68,0.3); color:#F87171;" onclick="resetKidTimer(getProfiles()[' + i + '].name)">Reset Today</button>' +
              '</div>' +
              (typeof ZsTTS !== 'undefined' ? (
                '<div class="pk-setting" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">' +
                  '<label class="pk-toggle" style="font-size:0.9rem;">' +
                    '<input type="checkbox" ' + (ZsTTS.getSettings(p.name).enabled ? 'checked' : '') + ' onchange="updateKidTts(' + i + ', \'enabled\', this.checked)">' +
                    ' 🗣 Read-aloud enabled' +
                  '</label>' +
                  '<label style="display:block;margin-top:8px;font-size:0.8rem;color:var(--text-muted);font-weight:700;">' +
                    'Rate: <span id="tts-rate-val-' + i + '">' + ZsTTS.getSettings(p.name).rate.toFixed(2) + '×</span>' +
                  '</label>' +
                  '<input type="range" min="0.5" max="1.2" step="0.05" value="' + ZsTTS.getSettings(p.name).rate + '" ' +
                         'oninput="updateKidTts(' + i + ', \'rate\', parseFloat(this.value))" ' +
                         'style="width:100%;">' +
                '</div>'
              ) : '') +
              (typeof Routines !== 'undefined' ? _renderRoutinesEditor(p, i) : '') +
              (typeof ZsA11y !== 'undefined' ? _renderA11yEditor(p, i) : '') +
            '</div>';
        }).join('') +
      '</div>' +
      (typeof FamilyCalendar !== 'undefined' ?
        '<div id="parents-fcal-editor" data-fcal-editor style="margin-top:24px;"></div>' : '') +
      '<div style="margin-top:32px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); text-align:center;">' +
        '<button class="parent-btn" style="background:#333; font-size:0.8rem;" onclick="if(typeof Debug!==\'undefined\')Debug.show()">' +
          '🛠 View Debug Log' +
        '</button>' +
      '</div>';

    if (typeof FamilyCalendar !== 'undefined') {
      try { FamilyCalendar.renderEditor('parents-fcal-editor'); } catch (e) {}
    }
  }

  function toggleAllTimers(paused) {
    if (paused) TimerManager.pauseAll();
    else TimerManager.resumeAll();
    renderParentsCorner();
  }

  function resetKidTimer(name) {
    _ask({
      title: 'Reset today\u2019s timer for ' + name + '?',
      message: 'Their screen time for today goes back to zero.',
      confirmLabel: 'Reset'
    }, function() {
      TimerManager.reset(name);
      renderParentsCorner();
      if (typeof ZsDialog !== 'undefined') ZsDialog.toast('Timer reset for ' + name + '.');
    });
  }
  function addKidBonus(name, mins) {
    TimerManager.addBonusForKid(name, mins);
    renderParentsCorner();
  }

  function _syncPushAll(btn) {
    btn.textContent = '⬆️ Pushing...';
    btn.disabled = true;
    CloudSync.pushAllKids()
      .then(function() { btn.textContent = '✅ Pushed!'; })
      .catch(function() { btn.textContent = '❌ Failed'; })
      .then(function() { setTimeout(function() { btn.textContent = '⬆️ Push All to Cloud'; btn.disabled = false; }, 2000); });
  }

  function _syncPullAll(btn) {
    btn.textContent = '⬇️ Pulling...';
    btn.disabled = true;
    CloudSync.pullAllKids()
      .then(function() {
        btn.textContent = '✅ Pulled!';
        updateStatsCards();
        renderAppCards();
      })
      .catch(function() { btn.textContent = '❌ Failed'; })
      .then(function() { setTimeout(function() { btn.textContent = '⬇️ Pull All from Cloud'; btn.disabled = false; }, 2000); });
  }

  function updateKidLimit(idx, val) {
    var profiles = getProfiles();
    profiles[idx].maxMinutes = parseInt(val);
    saveProfiles(profiles);
    if (typeof CloudSync !== 'undefined' && CloudSync.overwriteProfiles) {
      try { CloudSync.overwriteProfiles(profiles); } catch (e) {}
    }
    var label = document.getElementById('val-' + idx);
    if (label) label.textContent = val;
    var active = getActiveUser();
    if (active && active.name === profiles[idx].name) {
      TimerManager.setMax(parseInt(val));
    }
  }

  function _chessLabel(v) {
    if (v === undefined || v === null || isNaN(v)) v = 2;
    v = parseInt(v);
    return v >= 7 ? 'Daily' : v <= 0 ? 'Off' : v + 'x';
  }

  function updateKidChess(idx, val) {
    var profiles = getProfiles();
    profiles[idx].chessPlaysPerWeek = parseInt(val);
    saveProfiles(profiles);
    if (typeof CloudSync !== 'undefined' && CloudSync.overwriteProfiles) {
      try { CloudSync.overwriteProfiles(profiles); } catch (e) {}
    }
    var label = document.getElementById('chess-val-' + idx);
    if (label) label.textContent = _chessLabel(val);
  }

  function updateKidFaith(idx, checked) {
    var profiles = getProfiles();
    profiles[idx].faithVisible = checked;
    saveProfiles(profiles);
    if (typeof CloudSync !== 'undefined' && CloudSync.overwriteProfiles) {
      try { CloudSync.overwriteProfiles(profiles); } catch (e) {}
    }
    renderAppCards();
  }

  function updateKidRoutinesEnabled(idx, checked) {
    var profiles = getProfiles();
    if (!profiles[idx]) return;
    profiles[idx].routinesEnabled = !!checked;
    saveProfiles(profiles);
    // Profiles array is part of the standard profiles sync; push.
    if (typeof CloudSync !== 'undefined' && CloudSync.overwriteProfiles) {
      try { CloudSync.overwriteProfiles(profiles); } catch (e) {}
    }
    // Re-render the corner so the editor body collapses/expands.
    renderParentsCorner();
    // Refresh the hub widget if the active user just toggled themselves.
    var active = getActiveUser();
    if (active && active.name === profiles[idx].name && typeof Routines !== 'undefined') {
      try { Routines.renderHubWidget('routines-widget'); } catch (e) {}
    }
  }

  function _renderRoutinesEditor(profile, idx) {
    var tpls = Routines.getTemplates(profile.name);
    function block(which, icon, label) {
      var items = tpls[which];
      var rows = items.map(function(it, j) {
        return '<div class="rn-ed-row" data-which="' + which + '" data-j="' + j + '">' +
          '<input type="text" class="rn-ed-label" value="' + escHtml(it.label) + '" ' +
                 'maxlength="80" data-which="' + which + '" data-idx="' + idx + '" data-j="' + j + '" ' +
                 'oninput="updateRoutineItem(' + idx + ', \'' + which + '\', ' + j + ', this.value)" />' +
          '<button type="button" class="rn-ed-del" onclick="removeRoutineItem(' + idx + ', \'' + which + '\', ' + j + ')" aria-label="Remove">✕</button>' +
        '</div>';
      }).join('');
      return '<div class="rn-ed-block">' +
        '<div class="rn-ed-head">' +
          '<span>' + icon + ' ' + label + '</span>' +
          '<button type="button" class="rn-ed-reset" onclick="resetRoutine(' + idx + ', \'' + which + '\')" title="Restore defaults">↻ Default</button>' +
        '</div>' +
        rows +
        '<div class="rn-ed-row rn-ed-add">' +
          '<input type="text" id="rn-add-' + which + '-' + idx + '" placeholder="New task…" maxlength="80" ' +
                 'onkeydown="if(event.key===\'Enter\'){event.preventDefault();addRoutineItem(' + idx + ', \'' + which + '\');}" />' +
          '<button type="button" class="rn-ed-add-btn" onclick="addRoutineItem(' + idx + ', \'' + which + '\')">＋ Add</button>' +
        '</div>' +
      '</div>';
    }
    var enabled = profile.routinesEnabled !== false;
    return '<div class="pk-setting" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">' +
      '<label style="font-size:0.9rem; font-weight:700; color:var(--text); display:block; margin-bottom:10px;">📋 Routines</label>' +
      '<label class="pk-toggle" style="font-size:0.88rem; margin-bottom:10px;">' +
        '<input type="checkbox" ' + (enabled ? 'checked' : '') + ' onchange="updateKidRoutinesEnabled(' + idx + ', this.checked)">' +
        ' Show routines for ' + escHtml(profile.name) +
      '</label>' +
      (enabled
        ? block('morning', '🌅', 'Morning') + block('evening', '🌙', 'Night')
        : '<div class="pk-hint" style="font-size:0.82rem; color:var(--text-muted); font-weight:600;">Routines hidden from the hub and Family Wall for ' + escHtml(profile.name) + '.</div>') +
    '</div>';
  }

  function _renderA11yEditor(profile, idx) {
    var s = ZsA11y.getSettings(profile.name);
    var scales = [
      { k: 's',  label: 'S' },
      { k: 'm',  label: 'M' },
      { k: 'l',  label: 'L' },
      { k: 'xl', label: 'XL' }
    ];
    var scaleBtns = scales.map(function(sc) {
      var on = s.scale === sc.k;
      return '<button type="button" class="a11y-scale-btn' + (on ? ' active' : '') + '" ' +
             'onclick="updateKidA11y(' + idx + ', \'scale\', \'' + sc.k + '\')" ' +
             'aria-pressed="' + (on ? 'true' : 'false') + '">' + sc.label + '</button>';
    }).join('');
    var motionVal = s.motion;
    return '<div class="pk-setting" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">' +
      '<label style="font-size:0.9rem; font-weight:700; color:var(--text); display:block; margin-bottom:10px;">♿ Accessibility</label>' +

      '<label style="display:block; font-size:0.78rem; color:var(--text-muted); font-weight:700; margin-bottom:6px;">Text size</label>' +
      '<div class="a11y-scale-row" role="group" aria-label="Text size for ' + escHtml(profile.name) + '">' + scaleBtns + '</div>' +

      '<label class="pk-toggle" style="font-size:0.9rem; margin-top:12px;">' +
        '<input type="checkbox" ' + (s.contrast ? 'checked' : '') + ' ' +
               'onchange="updateKidA11y(' + idx + ', \'contrast\', this.checked)">' +
        ' 🌓 High-contrast mode' +
      '</label>' +

      '<label class="pk-toggle" style="font-size:0.9rem; margin-top:8px;">' +
        '<input type="checkbox" ' + (s.dyslexia ? 'checked' : '') + ' ' +
               'onchange="updateKidA11y(' + idx + ', \'dyslexia\', this.checked)">' +
        ' 📖 Dyslexia-friendly font' +
      '</label>' +

      '<label style="display:block; font-size:0.78rem; color:var(--text-muted); font-weight:700; margin-top:12px; margin-bottom:6px;">Animations</label>' +
      '<div class="a11y-scale-row" role="group" aria-label="Animations for ' + escHtml(profile.name) + '">' +
        '<button type="button" class="a11y-scale-btn' + (motionVal === 'auto'   ? ' active' : '') + '" onclick="updateKidA11y(' + idx + ', \'motion\', \'auto\')">Auto</button>' +
        '<button type="button" class="a11y-scale-btn' + (motionVal === 'normal' ? ' active' : '') + '" onclick="updateKidA11y(' + idx + ', \'motion\', \'normal\')">On</button>' +
        '<button type="button" class="a11y-scale-btn' + (motionVal === 'reduce' ? ' active' : '') + '" onclick="updateKidA11y(' + idx + ', \'motion\', \'reduce\')">Reduce</button>' +
      '</div>' +
    '</div>';
  }

  function addRoutineItem(idx, which) {
    if (typeof Routines === 'undefined') return;
    var profiles = getProfiles();
    var name = profiles[idx] && profiles[idx].name;
    if (!name) return;
    var input = document.getElementById('rn-add-' + which + '-' + idx);
    if (!input) return;
    var val = input.value.trim();
    if (!val) return;
    var tpl = Routines.getTemplates(name)[which];
    tpl.push({ id: 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5), label: val });
    Routines.setTemplate(which, tpl, name);
    input.value = '';
    renderParentsCorner();
  }

  function updateRoutineItem(idx, which, j, val) {
    if (typeof Routines === 'undefined') return;
    var profiles = getProfiles();
    var name = profiles[idx] && profiles[idx].name;
    if (!name) return;
    var tpl = Routines.getTemplates(name)[which];
    if (!tpl[j]) return;
    tpl[j].label = String(val).slice(0, 80);
    Routines.setTemplate(which, tpl, name);
    // Don't re-render on every keystroke — the input is already live.
  }

  function removeRoutineItem(idx, which, j) {
    if (typeof Routines === 'undefined') return;
    var profiles = getProfiles();
    var name = profiles[idx] && profiles[idx].name;
    if (!name) return;
    var tpl = Routines.getTemplates(name)[which];
    if (!tpl[j]) return;
    if (tpl.length <= 1) { _say('Keep at least one task in this routine.'); return; }
    tpl.splice(j, 1);
    Routines.setTemplate(which, tpl, name);
    renderParentsCorner();
  }

  function resetRoutine(idx, which) {
    if (typeof Routines === 'undefined') return;
    var profiles = getProfiles();
    var name = profiles[idx] && profiles[idx].name;
    if (!name) return;
    _ask({
      title: 'Restore the ' + (which === 'morning' ? 'morning' : 'night') + ' routine?',
      message: 'The tasks go back to the defaults for ' + name + '.',
      confirmLabel: 'Restore'
    }, function() {
      Routines.resetTemplate(which, name);
      renderParentsCorner();
    });
  }

  function updateParentPin() {
    var input = document.getElementById('new-parent-pin');
    if (!input) return;
    if (input.value.length !== 4 || !/^\d{4}$/.test(input.value)) {
      _say('The PIN needs to be 4 digits.');
      return;
    }
    if (typeof saveParentPin !== 'function') return;
    saveParentPin(input.value);
    _say('PIN updated! ✅');
  }

  function renderAppCards(user) {
    if (!user) user = getActiveUser();
    if (!user) return;
    var feEl = document.querySelector('.card-faith');
    if (feEl) feEl.style.display = (user.faithVisible !== false) ? 'flex' : 'none';
    if (typeof AppSchedule !== 'undefined') {
      AppSchedule.applyToHub(user);
      var msg = AppSchedule.getTodayMessage();
      var dayEl = document.getElementById('schedule-day');
      var themeEl = document.getElementById('schedule-theme');
      if (dayEl) dayEl.textContent = '📅 ' + msg.day + ' — ' + msg.count + ' apps today';
      if (themeEl) themeEl.textContent = msg.theme;
    }
  }

  function openModal() {
    selectedEmoji = AVATARS[0];
    selectedColor = COLORS[0];
    selectedAge   = null;
    var inp = document.getElementById('new-name');
    if (inp) inp.value = '';
    renderAgePicker();
    renderEmojiPicker();
    renderColorPicker();
    var mod = document.getElementById('add-modal');
    if (mod) mod.classList.add('active');
    setTimeout(function() { if (inp) inp.focus(); }, 100);
  }
  function closeModal() { 
    var mod = document.getElementById('add-modal');
    if (mod) mod.classList.remove('active');
  }

  function renderAgePicker() {
    var el = document.getElementById('age-picker');
    if (!el) return;
    el.innerHTML = '';
    AGE_OPTIONS.forEach(function(opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'age-option' + (selectedAge === opt.age ? ' selected' : '');
      btn.innerHTML = '<span class="age-num">' + opt.label + '</span>';
      btn.onclick = function() { selectedAge = opt.age; renderAgePicker(); };
      el.appendChild(btn);
    });
  }

  function renderEmojiPicker() {
    var el = document.getElementById('emoji-picker');
    if (!el) return;
    el.innerHTML = '';
    AVATARS.forEach(function(a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-option' + (a === selectedEmoji ? ' selected' : '');
      btn.textContent = a;
      btn.onclick = function() { selectedEmoji = a; renderEmojiPicker(); };
      el.appendChild(btn);
    });
  }
  function renderColorPicker() {
    var el = document.getElementById('color-picker');
    if (!el) return;
    el.innerHTML = '';
    COLORS.forEach(function(c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-option' + (c === selectedColor ? ' selected' : '');
      btn.style.background = c;
      btn.onclick = function() { selectedColor = c; renderColorPicker(); };
      el.appendChild(btn);
    });
  }
  function createProfile() {
    var name = document.getElementById('new-name').value.trim();
    if (!name) return;
    if (!selectedAge) return;
    var profiles = getProfiles();
    var newUser = { 
      name: name, 
      avatar: selectedEmoji, 
      color: selectedColor, 
      age: selectedAge,
      maxMinutes: 45,
      faithVisible: true 
    };
    profiles.push(newUser);
    saveProfiles(profiles);
    closeModal();
    // Auto-login the new profile: mirror the flow used by the existing
    // profile-card click handler (setActiveUser → invalidate cache →
    // showHub). Previous code called a non-existent loginAs() helper,
    // which threw ReferenceError and left the user on the login screen.
    setActiveUser(newUser);
    if (typeof _activeUserCached !== 'undefined') window._activeUserCached = false;
    showHub();
  }

  function requestPinThen(callback) {
    if (typeof Debug !== 'undefined') Debug.log('Requesting Parent PIN...');
    pinCallback = callback;
    var modal = document.getElementById('pin-modal');
    var input = document.getElementById('pin-input');
    var err = document.getElementById('pin-error');
    if (err) err.style.display = 'none';
    if (modal) modal.classList.add('active');
    if (input) { 
      input.value = ''; 
      setTimeout(function() { input.focus(); }, 100); 
    }
  }

  function closePinModal() {
    if (typeof Debug !== 'undefined') Debug.log('Closing PIN modal');
    var modal = document.getElementById('pin-modal');
    if (modal) modal.classList.remove('active');
    pinCallback = null;
  }

  function submitPin() {
    if (typeof Debug !== 'undefined') Debug.log('submitPin called');
    try {
      var input = document.getElementById('pin-input');
      var err = document.getElementById('pin-error');
      var entered = input ? input.value : '';
      var expected = getParentPin();
      
      if (typeof Debug !== 'undefined') Debug.log('PIN attempt: ' + (entered === expected ? 'CORRECT' : 'INCORRECT'));
      
      if (entered === expected) {
        if (err) err.style.display = 'none';
        var cb = pinCallback;
        if (typeof Debug !== 'undefined') Debug.log('PIN success, closing modal. Callback exists: ' + (!!cb));
        closePinModal();
        if (cb) {
          if (typeof Debug !== 'undefined') Debug.log('Executing callback...');
          cb();
        }
      } else {
        if (err) {
          err.style.display = 'block';
          err.textContent = 'Incorrect PIN';
        }
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    } catch(e) {
      if (typeof Debug !== 'undefined') Debug.error('submitPin CRASHED', e.message);
    }
  }

  function openEditModal(index) {
    var profiles = getProfiles();
    if (index < 0 || index >= profiles.length) return;
    editingIndex = index;
    var p = profiles[index];
    editEmoji = p.avatar;
    editColor = p.color;
    editAge   = p.age || null;
    var inp = document.getElementById('edit-name');
    if (inp) inp.value = p.name;
    _updateEditPreview();
    _renderEditAgePicker();
    _renderEditEmojiPicker();
    _renderEditColorPicker();
    var mod = document.getElementById('edit-modal');
    if (mod) mod.classList.add('active');
  }

  function closeEditModal() {
    var mod = document.getElementById('edit-modal');
    if (mod) mod.classList.remove('active');
    editingIndex = -1;
    _resetDeleteButton();
  }

  function _resetDeleteButton() {
    var btn = document.querySelector('.btn-delete-profile');
    if (btn) {
      btn.textContent = '🗑 Delete';
      btn.style.background = '';
      btn.style.color = '';
      btn.style.fontWeight = '';
    }
    _deleteArmedAt = 0;
    if (_deleteArmTimer) { clearTimeout(_deleteArmTimer); _deleteArmTimer = 0; }
  }

  function _updateEditPreview() {
    var av = document.getElementById('edit-preview-avatar');
    var nm = document.getElementById('edit-preview-name');
    var inp = document.getElementById('edit-name');
    if (av) {
      av.textContent = editEmoji;
      var c = safeColor(editColor);
      av.style.cssText = 'background:' + c + '22;border-color:' + c;
    }
    if (nm && inp) nm.textContent = inp.value.trim() || 'Student';
  }

  function _renderEditAgePicker() {
    var el = document.getElementById('edit-age-picker');
    if (!el) return;
    el.innerHTML = '';
    AGE_OPTIONS.forEach(function(opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'age-option' + (editAge === opt.age ? ' selected' : '');
      btn.innerHTML = '<span class="age-num">' + opt.label + '</span>';
      btn.onclick = function() { editAge = opt.age; _renderEditAgePicker(); };
      el.appendChild(btn);
    });
  }

  function _renderEditEmojiPicker() {
    var el = document.getElementById('edit-emoji-picker');
    if (!el) return;
    el.innerHTML = '';
    AVATARS.forEach(function(a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-option' + (a === editEmoji ? ' selected' : '');
      btn.textContent = a;
      btn.onclick = function() { editEmoji = a; _renderEditEmojiPicker(); _updateEditPreview(); };
      el.appendChild(btn);
    });
  }

  function _renderEditColorPicker() {
    var el = document.getElementById('edit-color-picker');
    if (!el) return;
    el.innerHTML = '';
    COLORS.forEach(function(c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-option' + (c === editColor ? ' selected' : '');
      btn.style.background = c;
      btn.onclick = function() { editColor = c; _renderEditColorPicker(); _updateEditPreview(); };
      el.appendChild(btn);
    });
  }

  function saveEditProfile() {
    var profiles = getProfiles();
    if (editingIndex < 0) return;
    var name = document.getElementById('edit-name').value.trim();
    if (!name) return;
    var oldName = profiles[editingIndex].name;
    profiles[editingIndex].name = name;
    profiles[editingIndex].avatar = editEmoji;
    profiles[editingIndex].color = editColor;
    if (editAge) profiles[editingIndex].age = editAge;
    saveProfiles(profiles);
    var act = getActiveUser();
    if (act && act.name === oldName) setActiveUser(profiles[editingIndex]);
    closeEditModal();
    renderLogin();
    if (document.getElementById('hub-screen').classList.contains('active')) showHub();
  }

  function deleteEditingProfile() {
    var armed = _deleteArmedAt > 0 && (Date.now() - _deleteArmedAt) <= DELETE_ARM_WINDOW_MS;
    if (typeof Debug !== 'undefined') Debug.log('[Profile] delete clicked, editingIndex=' + editingIndex + ' armed=' + armed);
    if (editingIndex < 0) {
      if (typeof Debug !== 'undefined') Debug.warn('[Profile] delete: editingIndex < 0 — no-op');
      return;
    }
    var profiles = getProfiles();
    if (!profiles[editingIndex]) {
      if (typeof Debug !== 'undefined') Debug.warn('[Profile] delete: profiles[' + editingIndex + '] missing — no-op');
      return;
    }
    var name = (profiles[editingIndex].name || '').trim();

    // First tap arms the button; second tap within the window commits.
    if (!armed) {
      _deleteArmedAt = Date.now();
      var btn = document.querySelector('.btn-delete-profile');
      if (btn) {
        btn.textContent = 'Tap again to delete ' + name;
        btn.style.background = '#EF4444';
        btn.style.color = '#fff';
        btn.style.fontWeight = '800';
      }
      if (_deleteArmTimer) clearTimeout(_deleteArmTimer);
      _deleteArmTimer = setTimeout(_resetDeleteButton, DELETE_ARM_WINDOW_MS);
      if (typeof Debug !== 'undefined') Debug.log('[Profile] delete armed for "' + name + '" (' + DELETE_ARM_WINDOW_MS + 'ms)');
      return;
    }

    if (typeof Debug !== 'undefined') Debug.log('[Profile] deleting "' + name + '"');
    profiles.splice(editingIndex, 1);
    saveProfiles(profiles);

    // Write a household-synced tombstone so other devices know not to
    // resurrect this profile from their local copy. zs_deleted_profiles
    // is in HOUSEHOLD_KEYS, so CloudSync.push mirrors it to the VPS.
    try {
      var key = 'zs_deleted_profiles';
      var existing = [];
      try { existing = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
      if (!Array.isArray(existing)) existing = [];
      // Drop any older tombstone for the same name, then add a fresh one.
      // Matching is trim+lowercase so a stored name with stray whitespace
      // can't bypass the tombstone (same defensive normalization we did
      // for the Little Maestro profile dedup).
      var lname = name.toLowerCase();
      existing = existing.filter(function(t) {
        return !t || !t.name || (t.name || '').trim().toLowerCase() !== lname;
      });
      existing.push({ name: name, ts: Date.now() });
      localStorage.setItem(key, JSON.stringify(existing));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(key);
      if (typeof Debug !== 'undefined') Debug.log('[Profile] tombstone written for "' + name + '"');
    } catch (e) {
      if (typeof Debug !== 'undefined') Debug.error('[Profile] tombstone failed', e.message);
    }

    // Push the shorter profile list to the server so even devices that
    // sync before they see the tombstone get a clean state.
    if (typeof CloudSync !== 'undefined' && CloudSync.overwriteProfiles) {
      try { CloudSync.overwriteProfiles(profiles); } catch (e) {}
    }

    closeEditModal();
    switchUser();
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function() {
    var pinIn = document.getElementById('pin-input');
    if (pinIn) {
      pinIn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') submitPin();
        if (e.key === 'Escape') closePinModal();
      });
    }
    var hub = document.getElementById('hub-screen');
    window.addEventListener('zs:synced', function() {
      if (hub && hub.classList.contains('active')) {
        updateStatsCards(); renderAppCards();
      }
    });

    var active = getActiveUser();
    if (active) showHub();
    else renderLogin();
  });

})();
