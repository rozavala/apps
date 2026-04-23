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
  window.redeemForTime = function() { redeemForTime(); };
  window.updateKidChess = function(idx, val) { updateKidChess(idx, val); };
  window.updateKidFaith = function(idx, val) { updateKidFaith(idx, val); };
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
  window.updateParentPin = function() { updateParentPin(); };
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
      'zs_sports_', 'zs_lab_', 'zs_world_', 'zs_story_', 'zs_quest_',
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
    var alwaysVisible = ['sports', 'quest'];

    var apps = [
      { name: 'Math Galaxy', icon: '🧮', href: 'math-galaxy.html', key: 'zs_mathgalaxy_' + key, schedId: 'math' },
      { name: 'Descubre Chile', icon: '🇨🇱', href: 'descubre-chile.html', key: 'zs_chile_' + key, schedId: 'chile' },
      { name: 'Chess Quest', icon: '♟️', href: 'chess-quest.html', key: 'zs_chess_' + key, schedId: 'chess' },
      { name: 'Little Maestro', icon: '🎹', href: 'little-maestro.html', key: 'littlemaestro_' + key, schedId: 'piano' },
      { name: 'Fe Explorador', icon: '⛪', href: 'fe-explorador.html', key: 'zs_fe_' + key, schedId: 'faith' },
      { name: 'Guitar Jam', icon: '🎸', href: 'guitar-jam.html', key: 'zs_guitar_' + key, schedId: 'guitar' },
      { name: 'Art Studio', icon: '🎨', href: 'art-studio.html', key: 'zs_art_' + key, schedId: 'art' },
      { name: 'Sports Arena', icon: '🏓', href: 'sports-arena.html', key: 'zs_sports_' + key, schedId: 'sports' },
      { name: 'Lab Explorer', icon: '🔬', href: 'lab-explorer.html', key: 'zs_lab_' + key, schedId: 'lab' },
      { name: 'World Explorer', icon: '🌍', href: 'world-explorer.html', key: 'zs_world_' + key, schedId: 'world' },
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
        else if (app.name === 'Lab Explorer') hasProg = (data.totalStars || 0) > 0;
        else if (app.name === 'World Explorer') hasProg = (data.totalStars || 0) > 0;
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
        lab:    document.getElementById('stats-lab'),
        world:  document.getElementById('stats-world'),
        story:  document.getElementById('stats-story'),
        quest:  document.getElementById('stats-quest'),
        guess:  document.getElementById('stats-guess')
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

    } catch(err) {}
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
            html += '<div style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">' +
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
    if (!confirm('Delete this recital?')) return;
    RecitalRecorder.remove(Number(id)).then(_renderRecitals);
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
      alert('¡Genial! Has ganado 15 minutos extra de juego. 🚀');
    }
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
            '</div>';
        }).join('') +
      '</div>' +
      '<div style="margin-top:32px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); text-align:center;">' +
        '<button class="parent-btn" style="background:#333; font-size:0.8rem;" onclick="if(typeof Debug!==\'undefined\')Debug.show()">' +
          '🛠 View Debug Log' +
        '</button>' +
      '</div>';
  }

  function toggleAllTimers(paused) {
    if (paused) TimerManager.pauseAll();
    else TimerManager.resumeAll();
    renderParentsCorner();
  }

  function resetKidTimer(name) {
    if (confirm('Reset timer for ' + name + '?')) {
      TimerManager.reset(name);
      renderParentsCorner();
    }
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
    var label = document.getElementById('val-' + idx);
    if (label) label.textContent = val;
    var active = getActiveUser();
    if (active && active.name === profiles[idx].name) {
      TimerManager.setMax(parseInt(val));
    }
  }

  function updateKidChess(idx, val) {
    var profiles = getProfiles();
    profiles[idx].chessPlaysPerWeek = parseInt(val);
    saveProfiles(profiles);
    var label = document.getElementById('chess-val-' + idx);
    if (label) {
      var v = parseInt(val);
      label.textContent = (v === 7 ? 'Daily' : v === 0 ? 'Off' : v + 'x');
    }
  }

  function updateKidFaith(idx, checked) {
    var profiles = getProfiles();
    profiles[idx].faithVisible = checked;
    saveProfiles(profiles);
    renderAppCards();
  }

  function updateParentPin() {
    var input = document.getElementById('new-parent-pin');
    if (input && input.value.length === 4 && typeof saveParentPin === 'function') {
      saveParentPin(input.value);
      alert('PIN updated! ✅');
    }
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
    loginAs(newUser);
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
    var profiles = getProfiles();
    if (editingIndex < 0) return;
    var name = profiles[editingIndex].name;
    if (!confirm('Delete ' + name + '?')) return;
    profiles.splice(editingIndex, 1);
    saveProfiles(profiles);
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
