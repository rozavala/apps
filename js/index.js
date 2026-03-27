
    // ── State ──
    let selectedEmoji = AVATARS[0];
    let selectedColor = COLORS[0];
    let selectedAge   = null;

    // Edit state
    let editingIndex   = -1;
    let editEmoji      = null;
    let editColor      = null;
    let editAge        = null;

    // PIN state
    let pinCallback    = null;

    // ── Render login screen ──
    function renderLogin() {
      const grid = document.getElementById('profiles-grid');
      const profiles = getProfiles();
      if (!grid) return;
      grid.innerHTML = '';

      profiles.forEach((p, i) => {
        const safe = {
          name: escHtml(p.name),
          avatar: escHtml(p.avatar),
          color: safeColor(p.color)
        };
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.style.animationDelay = `${0.1 + i * 0.05}s`;
        // Position relative for edit button
        card.style.position = 'relative';

        card.innerHTML = `
          <div class="profile-avatar" style="background:${safe.color}22;border-color:${safe.color}">${safe.avatar}</div>
          <div class="profile-name">${safe.name}</div>
          ${p.age ? `<div class="profile-age">Age ${p.age}</div>` : ''}
          <button class="profile-edit-btn" data-index="${i}" title="Edit ${safe.name}" onclick="event.stopPropagation(); requestPinThen(() => openEditModal(${i}))">✏️</button>
        `;

        card.onclick = (e) => {
          if (e.target.closest('.profile-edit-btn')) return;
          setActiveUser(p);
          if (typeof CloudSync !== 'undefined' && CloudSync.online) {
            const key = p.name.toLowerCase().replace(/\s+/g, '_');
            const banner = document.createElement('div');
            banner.id = 'sync-banner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:8px;background:rgba(124,58,237,0.9);color:#fff;text-align:center;font-family:var(--font-display);font-weight:700;font-size:0.85rem;z-index:9999;';
            banner.textContent = '☁️ Syncing...';
            document.body.appendChild(banner);
            CloudSync.pullAll(key)
              .then(() => { banner.textContent = '✅ Synced!'; setTimeout(() => { banner.remove(); showHub(); }, 600); })
              .catch(() => { banner.textContent = '⚠️ Offline — using local data'; setTimeout(() => { banner.remove(); showHub(); }, 1200); });
          } else {
            showHub();
          }
        };

        grid.appendChild(card);
      });

      // Add new card
      const addCard = document.createElement('div');
      addCard.className = 'profile-card add-card';
      addCard.style.animationDelay = `${0.1 + profiles.length * 0.05}s`;
      addCard.onclick = openModal;
      addCard.innerHTML = `
        <div class="add-icon">+</div>
        <div class="add-label">Add Player</div>
      `;
      grid.appendChild(addCard);

      // Guest card
      const guestCard = document.createElement('div');
      guestCard.className = 'profile-card guest-card';
      guestCard.style.animationDelay = `${0.15 + profiles.length * 0.05}s`;
      guestCard.onclick = loginAsGuest;
      guestCard.innerHTML = `
        <div class="profile-avatar" style="background:rgba(96,165,250,0.15);border-color:#60A5FA">🌟</div>
        <div class="profile-name">Guest</div>
        <div class="profile-age" style="font-size:0.7rem;">🔒 PIN required</div>
      `;
      grid.appendChild(guestCard);
    }

    function loginAs(user) {
      setActiveUser(user);
      showHub();
    }

    // ── Guest Player ──
    function loginAsGuest() {
      requestPinThen(() => {
        const guestProfile = {
          name: 'Guest',
          avatar: '🌟',
          color: '#60A5FA',
          age: 7,
          isGuest: true,
          maxMinutes: 15
        };
        setActiveUser(guestProfile);
        showHub();
      });
    }

    function isGuestUser() {
      const user = getActiveUser();
      return user && user.isGuest === true;
    }

    function _cleanupGuestData() {
      const key = 'guest'; // guest profile uses name "Guest" → key "guest"
      const prefixes = [
        'zs_mathgalaxy_', 'zs_chile_', 'zs_chess_', 'zs_chess_plays_',
        'zs_timer_', 'zs_chores_', 'zs_fe_', 'zs_guitar_', 'zs_art_',
        'zs_sports_', 'zs_lab_', 'zs_world_', 'zs_story_', 'zs_quest_',
        'zs_lcheck_', 'zs_lastrank_', 'littlemaestro_'
      ];
      prefixes.forEach(p => localStorage.removeItem(p + key));
      localStorage.removeItem('littlemaestro_guest_recital');
    }

    function switchUser() {
      if (isGuestUser()) {
        _cleanupGuestData();
      }
      localStorage.removeItem(ACTIVE_KEY);
      document.getElementById('hub-screen').classList.remove('active');
      document.getElementById('login-screen').style.display = '';
      renderLogin();
    }

    function showHub() {
      const user = getActiveUser();
      if (!user) return;
      const key = user.name.toLowerCase().replace(/\s+/g, '_');
      
      const els = {
        login: document.getElementById('login-screen'),
        hub: document.getElementById('hub-screen'),
        avatar: document.getElementById('ub-avatar'),
        name: document.getElementById('ub-name'),
        greeting: document.getElementById('ub-greeting'),
        timer: document.getElementById('timer-display'),
        tokens: document.getElementById('token-balance'),
        challenge: document.getElementById('next-challenge-wrap')
      };

      if (els.login) els.login.style.display = 'none';
      if (els.hub) els.hub.classList.add('active');

      const color = safeColor(user.color);
      if (els.avatar) {
        els.avatar.textContent = user.avatar;
        els.avatar.style.cssText = `background:${color}22;border-color:${color}`;
      }
      if (els.name) els.name.textContent = user.name;
      
      let totalStars = 0;
      let rank = { icon: '🛸', name: 'Cadet' };
      if (typeof getPlayerStats === 'function') {
        const stats = getPlayerStats(user.name);
        totalStars = stats.totalStars;
        rank = typeof getExplorerRank === 'function' ? getExplorerRank(user.name, stats) : { icon: '🛸', name: 'Cadet' };
      } else {
        totalStars = typeof getTotalStars === 'function' ? getTotalStars(user.name) : 0;
        rank = typeof getExplorerRank === 'function' ? getExplorerRank(user.name) : { icon: '🛸', name: 'Cadet' };
      }

      const rankText = `${rank.icon} ${rank.name}`;
      const starText = totalStars > 0 ? ` · ⭐ ${totalStars}` : '';
      
      if (isGuestUser()) {
        if (els.greeting) els.greeting.textContent = `🌟 Guest Player · 15 min session`;
      } else {
        if (els.greeting) els.greeting.textContent = `${rankText}${starText} · ${getGreeting()}`;
      }

      // Rank-up celebration
      if (!isGuestUser()) {
        const lastRank = localStorage.getItem(`zs_lastrank_${key}`) || 'Cadet';
        if (rank.name !== lastRank && lastRank !== 'Cadet') {
          showRankUpCelebration(rank);
        }
        localStorage.setItem(`zs_lastrank_${key}`, rank.name);
      }

      // Update timer and token display
      if (typeof TimerManager !== 'undefined' && els.timer) {
        const rem = TimerManager.getRemaining();
        els.timer.textContent = `⏰ ${rem} min left`;
      }
      if (typeof ChoresManager !== 'undefined' && els.tokens) {
        if (isGuestUser()) {
          els.tokens.style.display = 'none';
        } else {
          const tokens = ChoresManager.getStatus().totalTokens;
          els.tokens.textContent = `⭐ ${tokens} tokens`;
          els.tokens.style.display = '';
        }
      }

      renderAppCards(user);
      updateStatsCards(user);

      // Render Next Challenge
      const challenge = getNextChallenge(user);
      if (els.challenge && challenge) {
        els.challenge.innerHTML = `
          <div class="next-challenge" onclick="${challenge.href ? `location.href='${challenge.href}'` : ''}" 
               style="border: 2px solid ${color}44; background: var(--bg-surface); padding: 16px; border-radius: 16px;
                      display: flex; align-items: center; gap: 16px; cursor: pointer; margin-bottom: 24px; animation: fadeUp 0.6s ease-out both;">
            <span style="font-size: 2rem;">${challenge.icon}</span>
            <div style="flex: 1;">
              <div style="font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">${challenge.text}</div>
              <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">${challenge.sub}</div>
            </div>
            <span style="font-size: 1.5rem; color: var(--purple); animation: rocketBounce 2s infinite;">→</span>
          </div>
        `;
      }
    }

    function showRankUpCelebration(rank) {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(11, 11, 26, 0.9); backdrop-filter: blur(8px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; color: #F0EDFF; font-family: var(--font-display);
        animation: fadeIn 0.5s ease-out;
      `;
      overlay.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px; animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);">
          ${rank.icon}
        </div>
        <h2 style="font-size: 2.5rem; margin-bottom: 10px;">🎉 Rank Up!</h2>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--purple);">${rank.name}</div>
        <p style="margin-top: 20px; opacity: 0.8;">You've reached a new explorer level!</p>
      `;
      document.body.appendChild(overlay);
      if (typeof showConfetti === 'function') showConfetti();
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => overlay.remove(), 500);
      }, 3000);
    }

    function getNextChallenge(user) {
      if (!user) user = getActiveUser();
      if (!user) return null;
      const key = user.name.toLowerCase().replace(/\s+/g, '_');

      // Check which apps have zero progress
      const apps = [
        { name: 'Math Galaxy', icon: '🧮', href: 'math-galaxy.html', key: `zs_mathgalaxy_${key}` },
        { name: 'Descubre Chile', icon: '🇨🇱', href: 'descubre-chile.html', key: `zs_chile_${key}` },
        { name: 'Chess Quest', icon: '♟️', href: 'chess-quest.html', key: `zs_chess_${key}` },
        { name: 'Little Maestro', icon: '🎹', href: 'little-maestro.html', key: `littlemaestro_${key}` },
        { name: 'Fe Explorador', icon: '⛪', href: 'fe-explorador.html', key: `zs_fe_${key}` },
        { name: 'Guitar Jam', icon: '🎸', href: 'guitar-jam.html', key: `zs_guitar_${key}` },
        { name: 'Art Studio', icon: '🎨', href: 'art-studio.html', key: `zs_art_${key}` },
        { name: 'Sports Arena', icon: '🏓', href: 'sports-arena.html', key: `zs_sports_${key}` },
        { name: 'Lab Explorer', icon: '🔬', href: 'lab-explorer.html', key: `zs_lab_${key}` },
        { name: 'World Explorer', icon: '🌍', href: 'world-explorer.html', key: `zs_world_${key}` },
        { name: 'Story Explorer', icon: '📚', href: 'story-explorer.html', key: `zs_story_${key}` }
      ];

      const noProgress = [];
      apps.forEach(app => {
        try {
          const data = JSON.parse(localStorage.getItem(app.key)) || {};
          let hasProg = false;
          if (app.name === 'Math Galaxy') hasProg = Object.keys(data).length > 0;
          else if (app.name === 'Descubre Chile') hasProg = Object.keys(data).filter(k => k!=='vr' && k!=='memBest').length > 0;
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
        } catch { noProgress.push(app); }
      });

      if (noProgress.length > 0) {
        const pick = noProgress[Math.floor(Math.random() * noProgress.length)];
        return { text: `Try something new!`, sub: pick.name, icon: pick.icon, href: pick.href };
      }

      return { text: 'Keep practicing!', sub: 'Play any app to earn more stars', icon: '⭐', href: null };
    }



    // ── Stats cards on hub ──
    function updateStatsCards(user) {
      try {
        if (!user) user = getActiveUser();
        if (!user) return;
        const key = user.name.toLowerCase().replace(/\s+/g, '_');

        const els = {
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
          quest:  document.getElementById('stats-quest')
        };

        // Fetch stats which caches the parsed JSON objects
        const stats = typeof getPlayerStats === 'function' ? getPlayerStats(user.name) : { appStats: {} };
        const appStats = stats.appStats || {};

        // Guitar Jam
        try {
          const gj = appStats.guitar || {};
          if (els.guitar && (gj.totalStars || 0) > 0) els.guitar.innerHTML = `<span class="cs-item active">⭐ ${gj.totalStars}</span>`;
        } catch {}

        // Art Studio
        try {
          const as = appStats.art || {};
          if (els.art && (as.totalStars || 0) > 0) els.art.innerHTML = `<span class="cs-item active">⭐ ${as.totalStars}</span>`;
        } catch {}

        // Fe Explorador
        try {
          const fe = appStats.faith || {};
          if (els.faith && (fe.totalStars || 0) > 0) els.faith.innerHTML = `<span class="cs-item active">⭐ ${fe.totalStars}</span>`;
        } catch {}

        // Little Maestro
        try {
          const lm = appStats.piano || {};
          const prog = lm.progress || {};
          const completedSongs = Object.entries(prog)
            .filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).length;
          const totalLMStars = Object.entries(prog)
            .filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0)
            .reduce((s, [, v]) => s + v.stars, 0);
          const streak = (lm.stats && lm.stats.currentStreak) || 0;
          if (els.piano) {
            if (completedSongs > 0) {
              const items = [`⭐ ${totalLMStars} stars`, `🎼 ${completedSongs} songs`];
              if (streak > 0) items.push(`🔥 ${streak} streak`);
              els.piano.innerHTML = items.map(i => `<span class="cs-item active">${i}</span>`).join('');
            } else {
              els.piano.innerHTML = '';
            }
          }
        } catch { if (els.piano) els.piano.innerHTML = ''; }

        // Math Galaxy
        try {
          const mg = appStats.math || {};
          const levels = Object.entries(mg);
          if (els.math) {
            if (levels.length > 0) {
              const totalStars = levels.reduce((s, [, l]) => s + (l.bestStars || 0), 0);
              els.math.innerHTML = `<span class="cs-item active">⭐ ${totalStars} stars</span>`;
            } else {
              els.math.innerHTML = '';
            }
          }
        } catch { if (els.math) els.math.innerHTML = ''; }

        // Chile
        try {
          const dc = appStats.chile || {};
          if (els.chile) {
            const totalStars = Object.entries(dc)
              .filter(([k]) => k !== 'vr' && k !== 'memBest')
              .reduce((s, [, v]) => s + ((v && v.bestStars) || 0), 0);
            if (totalStars > 0) {
              els.chile.innerHTML = `<span class="cs-item active">⭐ ${totalStars} stars</span>`;
            } else {
              els.chile.innerHTML = '';
            }
          }
        } catch { if (els.chile) els.chile.innerHTML = ''; }

        // Chess
        try {
          const cq = appStats.chess || {};
          if (els.chess) {
            const total = (cq.puzzlesSolved || 0) + (cq.wins || 0);
            if (total > 0) {
              els.chess.innerHTML = `<span class="cs-item active">⭐ ${total} stars</span>`;
            } else {
              els.chess.innerHTML = '';
            }
          }
        } catch { if (els.chess) els.chess.innerHTML = ''; }

        // Sports Arena stats
        try {
          const sa = appStats.sports || JSON.parse(localStorage.getItem(`zs_sports_${key}`)) || {};
          const matchCount = (sa.matches || []).length;
          const actCount = (sa.activities || []).length;
          if (els.sports && (matchCount + actCount) > 0) {
            els.sports.innerHTML = `
              <span style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">
                ⭐ ${sa.totalStars || 0} · ${matchCount} matches · ${actCount} activities
              </span>
            `;
          }
        } catch {}

        // Lab Explorer stats
        try {
          const le = appStats.lab || JSON.parse(localStorage.getItem(`zs_lab_${key}`)) || {};
          if (els.lab && (le.totalStars || 0) > 0) {
            const labs = Object.keys(le).filter(k => k !== 'totalStars' && (le[k].completed || 0) > 0).length;
            els.lab.innerHTML = `<span class="cs-item active">⭐ ${le.totalStars} · ${labs} labs</span>`;
          }
        } catch {}

        // World Explorer stats
        try {
          const we = appStats.world || JSON.parse(localStorage.getItem(`zs_world_${key}`)) || {};
          if (els.world && (we.totalStars || 0) > 0) {
            const visited = we.visited ? we.visited.length : 0;
            els.world.innerHTML = `<span class="cs-item active">⭐ ${we.totalStars} · ${visited} countries</span>`;
          }
        } catch {}

        // Story Explorer stats
        try {
          const se = appStats.story || JSON.parse(localStorage.getItem(`zs_story_${key}`)) || {};
          if (els.story && (se.totalStars || 0) > 0) {
            const stories = se.storiesRead ? se.storiesRead.length : 0;
            const words = se.wordsLearned ? se.wordsLearned.length : 0;
            els.story.innerHTML = `<span class="cs-item active">⭐ ${se.totalStars} · ${stories} stories · ${words} words</span>`;
          }
        } catch {}

        // Quest Adventure stats
        try {
          const ep = typeof QuestAdventure !== 'undefined' ? QuestAdventure.calculateEP() : 0;
          if (els.quest && ep > 0) {
            els.quest.innerHTML = `<span class="cs-item active">⚡ ${ep} EP</span>`;
          }
        } catch {}

      } catch(e) {}
    }

    // ── Parent Dashboard ──
    function openDashboard() {
      const profiles = getProfiles();
      const content = document.getElementById('dash-content');

      if (profiles.length === 0) {
        content.innerHTML = '<p style="color:var(--text-muted)">No profiles created yet.</p>';
        document.getElementById('dash-overlay').classList.add('active');
        return;
      }

      content.innerHTML = profiles.map(p => {
        const key = p.name.toLowerCase().replace(/\s+/g, '_');
        const tier = typeof getAgeTier === 'function' ? getAgeTier(p.age) : 'Intermediate';
        const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
        let appRows = '';

        // ⚡ Bolt Optimization: Use cached `appStats` object returned by `getPlayerStats`
        // instead of redundantly parsing 8 different JSON objects per user iteration.
        const stats = typeof getPlayerStats === 'function' ? getPlayerStats(p.name) : { appStats: {} };
        const appStats = stats.appStats || {};

        const mg = appStats.math || {};
        const levels = Object.entries(mg);
        if (levels.length > 0) {
          const totalStars = levels.reduce((s, [, l]) => s + (l.bestStars || 0), 0);
          const totalPlays = levels.reduce((s, [, l]) => s + (l.plays || 0), 0);
          const pct = (totalStars / 40) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">🧮</span>
            <span class="dash-app-name">Math Galaxy</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-math" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${totalStars}</span>
          </div>`;
        }

        const dc = appStats.chile || {};
        const totalChileStars = Object.entries(dc).filter(([k]) => k !== 'vr' && k !== 'memBest').reduce((s, [, v]) => s + ((v && v.bestStars) || 0), 0);
        if (totalChileStars > 0) {
          const pct = (totalChileStars / 30) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">🇨🇱</span>
            <span class="dash-app-name">Descubre Chile</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-chile" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${totalChileStars}</span>
          </div>`;
        }

        const cq = appStats.chess || {};
        const totalCQ = (cq.puzzlesSolved || 0) + (cq.wins || 0);
        if (totalCQ > 0) {
          const pct = (totalCQ / 50) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">♟️</span>
            <span class="dash-app-name">Chess Quest</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-chess" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${totalCQ}</span>
          </div>`;
        }

        const lm = appStats.piano || {};
        const prog = lm.progress || {};
        const totalLMStars = Object.entries(prog).filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).reduce((s, [, v]) => s + v.stars, 0);
        if (totalLMStars > 0) {
          const pct = (totalLMStars / 50) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">🎹</span>
            <span class="dash-app-name">Little Maestro</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-piano" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${totalLMStars}</span>
          </div>`;
        }

        const fe = appStats.faith || {};
        if (fe.totalStars > 0) {
          const pct = (fe.totalStars / 20) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">⛪</span>
            <span class="dash-app-name">Fe Explorador</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-faith" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${fe.totalStars}</span>
          </div>`;
        }

        const gj = appStats.guitar || {};
        if ((gj.totalStars || 0) > 0) {
          const pct = (gj.totalStars / 20) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">🎸</span>
            <span class="dash-app-name">Guitar Jam</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-guitar" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${gj.totalStars}</span>
          </div>`;
        }

        const as = appStats.art || {};
        if ((as.totalStars || 0) > 0) {
          const pct = (as.totalStars / 20) * 100;
          appRows += `<div class="dash-app-row">
            <span class="dash-app-icon">🎨</span>
            <span class="dash-app-name">Art Studio</span>
            <div class="dash-bar-wrap"><div class="dash-bar dash-bar-art" style="width:${Math.min(100, pct)}%"></div></div>
            <span class="dash-app-stat">⭐ ${as.totalStars}</span>
          </div>`;
        }

        try {
          const sa = appStats.sports || JSON.parse(localStorage.getItem(`zs_sports_${key}`)) || {};
          const stars = sa.totalStars || 0;
          if (stars > 0) {
            const pct = (stars / 50) * 100;
            appRows += `<div class="dash-app-row">
              <span class="dash-app-icon">🏓</span>
              <span class="dash-app-name">Sports Arena</span>
              <div class="dash-bar-wrap"><div class="dash-bar dash-bar-sports" style="width:${Math.min(100, pct)}%"></div></div>
              <span class="dash-app-stat">⭐ ${stars}</span>
            </div>`;
          }
        } catch {}

        // Lab Explorer dashboard row
        try {
          const le = appStats.lab || JSON.parse(localStorage.getItem(`zs_lab_${key}`)) || {};
          if ((le.totalStars || 0) > 0) {
            const pct = (le.totalStars / 18) * 100;
            appRows += `<div class="dash-app-row">
              <span class="dash-app-icon">🔬</span>
              <span class="dash-app-name">Lab Explorer</span>
              <div class="dash-bar-wrap"><div class="dash-bar dash-bar-lab" style="width:${Math.min(100, pct)}%"></div></div>
              <span class="dash-app-stat">⭐ ${le.totalStars}</span>
            </div>`;
          }
        } catch {}

        // World Explorer dashboard row
        try {
          const we = appStats.world || JSON.parse(localStorage.getItem(`zs_world_${key}`)) || {};
          if ((we.totalStars || 0) > 0) {
            const pct = (we.totalStars / 50) * 100;
            appRows += `<div class="dash-app-row">
              <span class="dash-app-icon">🌍</span>
              <span class="dash-app-name">World Explorer</span>
              <div class="dash-bar-wrap"><div class="dash-bar dash-bar-world" style="width:${Math.min(100, pct)}%"></div></div>
              <span class="dash-app-stat">⭐ ${we.totalStars}</span>
            </div>`;
          }
        } catch {}

        // Story Explorer dashboard row
        try {
          const se = appStats.story || JSON.parse(localStorage.getItem(`zs_story_${key}`)) || {};
          if ((se.totalStars || 0) > 0) {
            const pct = (se.totalStars / 30) * 100;
            appRows += `<div class="dash-app-row">
              <span class="dash-app-icon">📚</span>
              <span class="dash-app-name">Story Explorer</span>
              <div class="dash-bar-wrap"><div class="dash-bar dash-bar-story" style="width:${Math.min(100, pct)}%"></div></div>
              <span class="dash-app-stat">⭐ ${se.totalStars}</span>
            </div>`;
          }
        } catch {}

        // Quest Adventure dashboard row
        try {
          const qa = appStats.quest || JSON.parse(localStorage.getItem(`zs_quest_${key}`)) || {};
          const ep = typeof QuestAdventure !== 'undefined' ? QuestAdventure.calculateEP() : 0;
          if (ep > 0) {
            const pct = (ep / 250) * 100;
            appRows += `<div class="dash-app-row">
              <span class="dash-app-icon">🧗</span>
              <span class="dash-app-name">Quest Adventure</span>
              <div class="dash-bar-wrap"><div class="dash-bar dash-bar-quest" style="width:${Math.min(100, pct)}%"></div></div>
              <span class="dash-app-stat">⚡ ${ep}</span>
            </div>`;
          }
        } catch {}

        // ⚡ Bolt Optimization: Reuse precalculated overall stars logic to avoid
        // `getExplorerRank` repeating all the same `localStorage` parsing operations
        const rank = typeof getExplorerRank === 'function' ? getExplorerRank(p.name, stats) : { icon: '🛸', name: 'Cadet' };

        return `<div class="dash-profile">
          <div class="dash-profile-header">
            <div class="dash-avatar" style="background:${escHtml(p.color)}22;border-color:${escHtml(p.color)}">${escHtml(p.avatar)}</div>
            <div>
              <div class="dash-name">${escHtml(p.name)}</div>
              <div style="display:flex; gap:8px; font-size:0.78rem; font-weight:600;">
                <div class="dash-age">${p.age ? 'Age ' + p.age : ''}</div>
                <div class="dash-rank" style="color:var(--purple);">${rank.icon} ${rank.name}</div>
              </div>
            </div>
          </div>
          ${appRows}
        </div>`;
      }).join('');

      document.getElementById('dash-overlay').classList.add('active');
    }

    function closeDashboard() {
      document.getElementById('dash-overlay').classList.remove('active');
    }

    function exportProgress() {
      const profiles = getProfiles();
      const exportData = {
        exported: new Date().toISOString(),
        suite: 'Zavala Serra Apps',
        profiles: profiles.map(p => {
          const key = p.name.toLowerCase().replace(/\s+/g, '_');
          return {
            name: p.name,
            age: p.age,
            rank: typeof getExplorerRank === 'function' ? getExplorerRank(p.name) : null,
            apps: {
              math: JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`) || '{}'),
              chile: JSON.parse(localStorage.getItem(`zs_chile_${key}`) || '{}'),
              chess: JSON.parse(localStorage.getItem(`zs_chess_${key}`) || '{}'),
              piano: JSON.parse(localStorage.getItem(`littlemaestro_${key}`) || '{}'),
              faith: JSON.parse(localStorage.getItem(`zs_fe_${key}`) || '{}'),
              guitar: JSON.parse(localStorage.getItem(`zs_guitar_${key}`) || '{}'),
              art: JSON.parse(localStorage.getItem(`zs_art_${key}`) || '{}'),
              sports: JSON.parse(localStorage.getItem(`zs_sports_${key}`) || '{}'),
              lab: JSON.parse(localStorage.getItem(`zs_lab_${key}`) || '{}'),
              world: JSON.parse(localStorage.getItem(`zs_world_${key}`) || '{}'),
              story: JSON.parse(localStorage.getItem(`zs_story_${key}`) || '{}'),
              quest: JSON.parse(localStorage.getItem(`zs_quest_${key}`) || '{}'),
            }
          };
        })
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zavala-serra-progress-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // ── Chores List ──
    function openChores() {
      renderChoresList();
      document.getElementById('chores-overlay').classList.add('active');
    }
    function closeChores() {
      document.getElementById('chores-overlay').classList.remove('active');
    }
    function renderChoresList() {
      const content = document.getElementById('chores-content');
      const chores = ChoresManager.getChores();
      const status = ChoresManager.getStatus();

      content.innerHTML = `
        <div class="tokens-summary">
          <div class="tokens-count">⭐ ${status.totalTokens} <span>Adventure Tokens</span></div>
          <button class="btn-redeem" onclick="redeemForTime()" ${status.totalTokens < 3 ? 'disabled' : ''}>
            Redeem 3 Tokens for +15 min ⏰
          </button>
        </div>
        <div class="chores-grid">
          ${chores.map(c => `
            <div class="chore-item ${status.completed.includes(c.id) ? 'completed' : ''}" 
                 onclick="ChoresManager.completeChore('${c.id}')">
              <div class="chore-check">${status.completed.includes(c.id) ? '✅' : '○'}</div>
              <div class="chore-label">${c.label}</div>
              <div class="chore-tokens">+${c.tokens} ⭐</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    function redeemForTime() {
      if (ChoresManager.redeemTokens(3)) {
        if (typeof showConfetti === 'function') showConfetti();
        alert('¡Genial! Has ganado 15 minutos extra de juego. 🚀');
      }
    }

    // ── Parents Corner ──
    function openParentsCorner() {
      requestPinThen(() => {
        renderParentsCorner();
        
        const syncEl = document.getElementById('sync-section');
        if (syncEl && typeof CloudSync !== 'undefined') {
          const configured = CloudSync.isConfigured();
          const online = CloudSync.online;
          syncEl.innerHTML = `
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
              <h3 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:12px;">
                ☁️ Cloud Sync
                <span style="font-size:0.75rem;margin-left:8px;padding:2px 8px;border-radius:99px;
                  background:${online ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'};
                  color:${online ? '#34D399' : '#F87171'};">
                  ${configured ? (online ? '● Connected' : '● Offline') : '○ Not set up'}
                </span>
              </h3>
              ${configured ? `
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="parent-btn" style="margin:0;font-size:0.8rem;padding:8px 16px;"
                    onclick="_syncPushAll()">⬆️ Push All to Cloud</button>
                  <button class="parent-btn" style="margin:0;font-size:0.8rem;padding:8px 16px;"
                    onclick="_syncPullAll()">⬇️ Pull All from Cloud</button>
                </div>
                <p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;">
                  Sync is automatic — progress pushes on save and pulls on login.
                  Use these buttons for a manual full sync.
                </p>
              ` : `
                <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">
                  To sync progress across devices, set SYNC_SERVER in js/sync.js
                  to your VPS Tailscale IP.
                </p>
              `}
            </div>`;
        }

        document.getElementById('parents-overlay').classList.add('active');
      });
    }
    function closeParentsCorner() {
      document.getElementById('parents-overlay').classList.remove('active');
    }
    function renderParentsCorner() {
      const profiles = getProfiles();
      const container = document.getElementById('parents-content');
      const isPaused = TimerManager.isPaused();
      
      container.innerHTML = `
        <div class="parents-top-actions" style="margin-bottom:20px; padding:16px; background:rgba(255,255,255,0.05); border-radius:16px; display:flex; flex-direction:column; gap:16px;">
          <label class="pk-toggle" style="justify-content:center; font-size:1.1rem;">
            <input type="checkbox" ${isPaused ? 'checked' : ''} onchange="toggleAllTimers(this.checked)">
            ⏸ Pause All Timers
          </label>
          <div style="display:flex; gap:12px; align-items:center; justify-content:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
            <span style="font-size:0.9rem; font-weight:700;">Parent PIN:</span>
            <input type="password" id="new-parent-pin" maxlength="4" value="${getParentPin()}" 
                   style="width:60px; padding:4px 8px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:4px; text-align:center;">
            <button class="hub-action-btn secondary" style="padding:4px 12px; font-size:0.8rem;" onclick="updateParentPin()">Update</button>
          </div>
        </div>
        ${typeof AppSchedule !== 'undefined' ? AppSchedule.renderScheduleConfig() : ''}
        <div class="parents-grid">
          ${profiles.map((p, i) => {
            const timerData = TimerManager.getDataForKid(p.name) || { minutesUsed: 0, maxMinutes: 45 };
            return `
              <div class="parent-kid-card">
                <div class="pk-header">
                  <span class="pk-avatar">${escHtml(p.avatar)}</span>
                  <span class="pk-name">${escHtml(p.name)}</span>
                </div>
                <div class="pk-status" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; font-weight:700;">
                  ⏰ Used ${timerData.minutesUsed} of ${timerData.maxMinutes} min today
                </div>
                <div class="pk-setting">
                  <label>Daily Time Limit: <span id="val-${i}">${p.maxMinutes || 45}</span> min</label>
                  <input type="range" min="15" max="120" step="15" value="${p.maxMinutes || 45}" 
                         oninput="updateKidLimit(${i}, this.value)">
                </div>
                <div class="pk-setting">
                  <label>Chess per week: <span id="chess-val-${i}">${p.chessPlaysPerWeek !== undefined ? (p.chessPlaysPerWeek === 7 ? 'Daily' : p.chessPlaysPerWeek === 0 ? 'Off' : p.chessPlaysPerWeek + 'x') : '2x'}</span></label>
                  <input type="range" min="0" max="7" step="1" value="${p.chessPlaysPerWeek ?? 2}" 
                         oninput="updateKidChess(${i}, this.value)">
                </div>
                <div class="pk-setting" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
                  <button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1;" 
                          onclick="addKidBonus(getProfiles()[${i}].name, 15)">+15 min</button>
                  <button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1;" 
                          onclick="addKidBonus(getProfiles()[${i}].name, 30)">+30 min</button>
                  <button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1; border-color:rgba(239,68,68,0.3); color:#F87171;" 
                          onclick="resetKidTimer(getProfiles()[${i}].name)">Reset Today</button>
                </div>
                <div class="pk-setting" style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05);">
                  <label class="pk-toggle">
                    <input type="checkbox" ${p.faithVisible !== false ? 'checked' : ''} 
                           onchange="updateKidFaith(${i}, this.checked)">
                    Show Faith Module (Fe Explorador)
                  </label>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    function toggleAllTimers(paused) {
      if (paused) TimerManager.pauseAll();
      else TimerManager.resumeAll();
      renderParentsCorner();
    }
    window.addCustomChore = function() {
      const label = document.getElementById('new-chore-label').value.trim();
      const tokens = parseInt(document.getElementById('new-chore-tokens').value);
      if (label && tokens > 0 && typeof ChoresManager !== 'undefined') {
         const current = ChoresManager.getChores();
         current.push({ id: `custom_${Date.now()}`, label, tokens });
         localStorage.setItem('zs_chores_list', JSON.stringify(current));
         renderParentsCorner();
      }
    };

    window.removeChore = function(idx) {
      if (typeof ChoresManager !== 'undefined') {
         const current = ChoresManager.getChores();
         current.splice(idx, 1);
         localStorage.setItem('zs_chores_list', JSON.stringify(current));
         renderParentsCorner();
      }
    };

    window.updateParentPin = function() {
      const pin = document.getElementById('new-parent-pin').value;
      if (/^\d{4}$/.test(pin)) {
        localStorage.setItem('zs_parent_pin', pin);
        alert('PIN updated successfully!');
      } else {
        alert('Please enter a 4-digit numeric PIN.');
      }
    };
    function resetKidTimer(name) {
      if (confirm(`Reset timer for ${name}?`)) {
        TimerManager.reset(name);
        renderParentsCorner();
      }
    }
    function addKidBonus(name, mins) {
      TimerManager.addBonusForKid(name, mins);
      renderParentsCorner();
    }

    async function _syncPushAll(btn) {
      btn.textContent = '⬆️ Pushing...';
      btn.disabled = true;
      try {
        await CloudSync.pushAllKids();
        btn.textContent = '✅ Pushed!';
      } catch (e) { btn.textContent = '❌ Failed'; }
      setTimeout(() => { btn.textContent = '⬆️ Push All to Cloud'; btn.disabled = false; }, 2000);
    }

    async function _syncPullAll(btn) {
      btn.textContent = '⬇️ Pulling...';
      btn.disabled = true;
      try {
        await CloudSync.pullAllKids();
        btn.textContent = '✅ Pulled!';
        // Refresh hub UI
        updateStatsCards();
        renderAppCards();
      } catch (e) { btn.textContent = '❌ Failed'; }
      setTimeout(() => { btn.textContent = '⬇️ Pull All from Cloud'; btn.disabled = false; }, 2000);
    }

    function updateKidLimit(idx, val) {
      const profiles = getProfiles();
      profiles[idx].maxMinutes = parseInt(val);
      saveProfiles(profiles);
      document.getElementById(`val-${idx}`).textContent = val;
      // If current user, update timer
      const active = getActiveUser();
      if (active && active.name === profiles[idx].name) {
        TimerManager.setMax(parseInt(val));
      }
    }
    function updateKidChess(idx, val) {
      const profiles = getProfiles();
      const v = parseInt(val);
      profiles[idx].chessPlaysPerWeek = v;
      saveProfiles(profiles);
      const label = v === 7 ? 'Daily' : v === 0 ? 'Off' : v + 'x';
      document.getElementById(`chess-val-${idx}`).textContent = label;
    }
    function updateKidFaith(idx, checked) {
      const profiles = getProfiles();
      profiles[idx].faithVisible = checked;
      saveProfiles(profiles);
      // If hub is showing, refresh app cards to hide/show faith
      if (document.getElementById('hub-screen').classList.contains('active')) {
        renderAppCards();
      }
    }

    // ── Render App Cards (now dynamic for faith toggle) ──
    function renderAppCards(user) {
      if (!user) user = getActiveUser();
      if (!user) return;

      const feEl = document.querySelector('.card-faith');
      if (feEl) feEl.style.display = (user.faithVisible !== false) ? 'flex' : 'none';

      // Chess limit display
      const chessCard = document.querySelector('.card-chess');
      if (chessCard) {
        const remaining = chessPlaysRemaining(user.name);
        const limit = getChessLimit(user.name);
        const tag = chessCard.querySelector('.card-tag');
        
        if (limit === 0) {
          chessCard.classList.add('coming-soon');
          if (tag) tag.textContent = '🔒 Off';
        } else if (remaining === 0 && limit < 7) {
          chessCard.classList.add('coming-soon');
          if (tag) tag.textContent = '🔒 Back on Monday';
        } else {
          chessCard.classList.remove('coming-soon');
          if (tag) {
            if (limit >= 7) tag.textContent = '⚔️ Play Daily';
            else tag.textContent = `⚔️ ${remaining} of ${limit} left`;
          }
        }
      }

      // Apply daily app rotation schedule
      if (typeof AppSchedule !== 'undefined') {
        AppSchedule.applyToHub(user);

        // Update schedule banner
        const msg = AppSchedule.getTodayMessage();
        const dayEl = document.getElementById('schedule-day');
        const themeEl = document.getElementById('schedule-theme');
        if (dayEl) dayEl.textContent = '📅 ' + msg.day + ' — ' + msg.count + ' apps today';
        if (themeEl) themeEl.textContent = msg.theme;
      }
    }

    // ── Add Modal ──
    function openModal() {
      selectedEmoji = AVATARS[0];
      selectedColor = COLORS[0];
      selectedAge   = null;
      document.getElementById('new-name').value = '';
      renderAgePicker();
      renderEmojiPicker();
      renderColorPicker();
      document.getElementById('add-modal').classList.add('active');
      setTimeout(() => document.getElementById('new-name').focus(), 100);
    }
    function closeModal() { document.getElementById('add-modal').classList.remove('active'); }

    function renderAgePicker() {
      const el = document.getElementById('age-picker');
      el.innerHTML = '';
      AGE_OPTIONS.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'age-option' + (selectedAge === opt.age ? ' selected' : '');
        btn.innerHTML = `<span class="age-num">${opt.label}</span>`;
        btn.onclick = () => { selectedAge = opt.age; renderAgePicker(); };
        el.appendChild(btn);
      });
    }

    function renderEmojiPicker() {
      const el = document.getElementById('emoji-picker');
      el.innerHTML = '';
      AVATARS.forEach(a => {
        const btn = document.createElement('div');
        btn.className = 'emoji-option' + (a === selectedEmoji ? ' selected' : '');
        btn.textContent = a;
        btn.onclick = () => { selectedEmoji = a; renderEmojiPicker(); };
        el.appendChild(btn);
      });
    }
    function renderColorPicker() {
      const el = document.getElementById('color-picker');
      el.innerHTML = '';
      COLORS.forEach(c => {
        const btn = document.createElement('div');
        btn.className = 'color-option' + (c === selectedColor ? ' selected' : '');
        btn.style.background = c;
        btn.onclick = () => { selectedColor = c; renderColorPicker(); };
        el.appendChild(btn);
      });
    }
function createProfile() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) { document.getElementById('new-name').focus(); return; }
  if (!selectedAge) {
    document.getElementById('age-picker').style.outline = '2px solid #EF4444';
    setTimeout(() => document.getElementById('age-picker').style.outline = '', 1500);
    return;
  }
  const profiles = getProfiles();
  const newUser = { 
    name, 
    avatar: selectedEmoji, 
    color: selectedColor, 
    age: selectedAge,
    maxMinutes: 45,
    chessPlaysPerWeek: 2,
    faithVisible: true 
  };  profiles.push(newUser);
  saveProfiles(profiles);
  closeModal();
  loginAs(newUser);
}


    // ══════════════════════════════════════════════════════════════
    // PIN MODAL
    // ══════════════════════════════════════════════════════════════

    function requestPinThen(callback) {
      pinCallback = callback;
      const modal = document.getElementById('pin-modal');
      const input = document.getElementById('pin-input');
      const error = document.getElementById('pin-error');
      if (error) error.style.display = 'none';
      if (input) input.value = '';
      modal.classList.add('active');

      // Trap focus inside modal
      const focusable = modal.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      modal._trapFocus = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      modal.addEventListener('keydown', modal._trapFocus);
      setTimeout(() => { if (input) input.focus(); }, 100);
    }

    function closePinModal() {
      const modal = document.getElementById('pin-modal');
      if (modal._trapFocus) modal.removeEventListener('keydown', modal._trapFocus);
      modal.classList.remove('active');
      pinCallback = null;
    }

    function submitPin() {
      const input = document.getElementById('pin-input');
      const error = document.getElementById('pin-error');
      if (input.value === getParentPin()) {
        document.getElementById('pin-modal').classList.remove('active');
        if (pinCallback) {
          const cb = pinCallback;
          pinCallback = null;
          cb();
        }
      } else {
        if (error) { error.style.display = 'block'; }
        input.value = '';
        input.focus();
        setTimeout(() => { if (error) error.style.display = 'none'; }, 2000);
      }
    }

    // PIN keyboard support
    document.addEventListener('DOMContentLoaded', () => {
      const pinInput = document.getElementById('pin-input');
      if (pinInput) {
        pinInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') submitPin();
          if (e.key === 'Escape') closePinModal();
        });
      }
    });


    // ══════════════════════════════════════════════════════════════
    // EDIT PROFILE MODAL
    // ══════════════════════════════════════════════════════════════

    function openEditModal(index) {
      const profiles = getProfiles();
      if (index < 0 || index >= profiles.length) return;

      editingIndex = index;
      const p = profiles[index];
      editEmoji = p.avatar;
      editColor = p.color;
      editAge   = p.age || null;

      // Set name
      document.getElementById('edit-name').value = p.name;

      // Update preview
      _updateEditPreview();

      // Render pickers
      _renderEditAgePicker();
      _renderEditEmojiPicker();
      _renderEditColorPicker();

      // Clear error
      const err = document.getElementById('edit-error');
      if (err) err.style.display = 'none';

      // Show
      document.getElementById('edit-modal').classList.add('active');
      setTimeout(() => document.getElementById('edit-name').focus(), 100);

      // Wire live preview for name
      const nameInput = document.getElementById('edit-name');
      nameInput.oninput = () => {
        document.getElementById('edit-preview-name').textContent =
          nameInput.value.trim() || 'Student';
      };
    }

    function closeEditModal() {
      document.getElementById('edit-modal').classList.remove('active');
      editingIndex = -1;
    }

    function _updateEditPreview() {
      const avatar = document.getElementById('edit-preview-avatar');
      const name   = document.getElementById('edit-preview-name');
      const nameInput = document.getElementById('edit-name');
      if (avatar) {
        avatar.textContent = editEmoji;
        avatar.style.cssText = `background:${editColor}22;border-color:${editColor};`;
      }
      if (name && nameInput) {
        name.textContent = nameInput.value.trim() || 'Student';
      }
    }

    function _renderEditAgePicker() {
      const el = document.getElementById('edit-age-picker');
      el.innerHTML = '';
      AGE_OPTIONS.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'age-option' + (editAge === opt.age ? ' selected' : '');
        btn.innerHTML = `<span class="age-num">${opt.label}</span>`;
        btn.onclick = () => { editAge = opt.age; _renderEditAgePicker(); };
        el.appendChild(btn);
      });
    }

    function _renderEditEmojiPicker() {
      const el = document.getElementById('edit-emoji-picker');
      el.innerHTML = '';
      AVATARS.forEach(a => {
        const btn = document.createElement('div');
        btn.className = 'emoji-option' + (a === editEmoji ? ' selected' : '');
        btn.textContent = a;
        btn.onclick = () => { editEmoji = a; _renderEditEmojiPicker(); _updateEditPreview(); };
        el.appendChild(btn);
      });
    }

    function _renderEditColorPicker() {
      const el = document.getElementById('edit-color-picker');
      el.innerHTML = '';
      COLORS.forEach(c => {
        const btn = document.createElement('div');
        btn.className = 'color-option' + (c === editColor ? ' selected' : '');
        btn.style.background = c;
        btn.onclick = () => { editColor = c; _renderEditColorPicker(); _updateEditPreview(); };
        el.appendChild(btn);
      });
    }

    function saveEditProfile() {
      const profiles = getProfiles();
      if (editingIndex < 0 || editingIndex >= profiles.length) return;

      const newName = document.getElementById('edit-name').value.trim();
      const errEl   = document.getElementById('edit-error');

      if (!newName) {
        errEl.textContent = 'Name cannot be empty.';
        errEl.style.display = 'block';
        return;
      }

      // Check for duplicate name (but allow same index)
      const duplicate = profiles.findIndex((p, i) =>
        i !== editingIndex && p.name.toLowerCase() === newName.toLowerCase()
      );
      if (duplicate !== -1) {
        errEl.textContent = 'A player named "' + newName + '" already exists.';
        errEl.style.display = 'block';
        return;
      }

      const oldName = profiles[editingIndex].name;

      // Update profile
      profiles[editingIndex].name   = newName;
      profiles[editingIndex].avatar = editEmoji;
      profiles[editingIndex].color  = editColor;
      if (editAge) profiles[editingIndex].age = editAge;

      saveProfiles(profiles);

      // Update active user if it's the one being edited
      const active = getActiveUser();
      if (active && active.name.toLowerCase() === oldName.toLowerCase()) {
        setActiveUser(profiles[editingIndex]);
      }

      // Migrate app-specific localStorage keys if name changed
      if (oldName.toLowerCase() !== newName.toLowerCase()) {
        _migrateAppData(oldName, newName);
      }

      closeEditModal();
      renderLogin();

      // If hub is showing, refresh it too
      if (document.getElementById('hub-screen').classList.contains('active')) {
        showHub();
      }
    }

    function deleteEditingProfile() {
      const profiles = getProfiles();
      if (editingIndex < 0 || editingIndex >= profiles.length) return;

      const name = profiles[editingIndex].name;
      if (!confirm('Delete "' + name + '"? All progress will be lost.')) return;

      // Remove app-specific data
      const key = name.toLowerCase().replace(/\s+/g, '_');
      localStorage.removeItem(`littlemaestro_${key}`);
      localStorage.removeItem(`littlemaestro_${key}_recital`);
      localStorage.removeItem(`zs_mathgalaxy_${key}`);
      localStorage.removeItem(`zs_chile_${key}`);
      localStorage.removeItem(`zs_chess_${key}`);
      localStorage.removeItem(`zs_timer_${key}`);
      localStorage.removeItem(`zs_chores_${key}`);
      localStorage.removeItem(`zs_chess_plays_${key}`);
      localStorage.removeItem(`zs_fe_${key}`);
      localStorage.removeItem(`zs_guitar_${key}`);
      localStorage.removeItem(`zs_art_${key}`);
      localStorage.removeItem(`zs_sports_${key}`);
      localStorage.removeItem(`zs_lcheck_${key}`);
      localStorage.removeItem(`zs_lab_${key}`);
      localStorage.removeItem(`zs_world_${key}`);
      localStorage.removeItem(`zs_story_${key}`);
      localStorage.removeItem(`zs_quest_${key}`);
      localStorage.removeItem(`zs_lastrank_${key}`);

      // Remove from Little Maestro index if present
      try {
        const lmIdx = JSON.parse(localStorage.getItem('littlemaestro__index') || '[]');
        const newIdx = lmIdx.filter(n => n.toLowerCase() !== name.toLowerCase());
        localStorage.setItem('littlemaestro__index', JSON.stringify(newIdx));
      } catch {}

      // Remove from profiles
      profiles.splice(editingIndex, 1);
      saveProfiles(profiles);

      // Clear active user if it was the deleted one
      const active = getActiveUser();
      if (active && active.name.toLowerCase() === name.toLowerCase()) {
        localStorage.removeItem(ACTIVE_KEY);
      }

      closeEditModal();

      // Go back to login screen
      document.getElementById('hub-screen').classList.remove('active');
      document.getElementById('login-screen').style.display = '';
      renderLogin();
    }

    // ── Migrate app data when profile is renamed ──
    function _migrateAppData(oldName, newName) {
      const oldKey = oldName.toLowerCase().replace(/\s+/g, '_');
      const newKey = newName.toLowerCase().replace(/\s+/g, '_');
      if (oldKey === newKey) return;

      // List of app-specific keys to migrate
      const suffixes = [
        `littlemaestro_`,
        `zs_mathgalaxy_`,
        `zs_chile_`,
        `zs_chess_`,
        `zs_chess_plays_`,
        `zs_timer_`,
        `zs_chores_`,
        `zs_fe_`,
        `zs_guitar_`,
        `zs_art_`,
        `zs_sports_`,
        `zs_lcheck_`,
        `zs_lab_`,
        `zs_world_`,
        `zs_story_`,
        `zs_quest_`,
        `zs_lastrank_`,
      ];

      suffixes.forEach(prefix => {
        const data = localStorage.getItem(prefix + oldKey);
        if (data) {
          localStorage.setItem(prefix + newKey, data);
          localStorage.removeItem(prefix + oldKey);
        }
      });

      // Little Maestro recital key
      const oldRecital = `littlemaestro_${oldKey}_recital`;
      const newRecital = `littlemaestro_${newKey}_recital`;
      const recitalData = localStorage.getItem(oldRecital);
      if (recitalData) {
        localStorage.setItem(newRecital, recitalData);
        localStorage.removeItem(oldRecital);
      }

      // Update Little Maestro profile name inside the stored object
      try {
        const lmData = JSON.parse(localStorage.getItem(`littlemaestro_${newKey}`));
        if (lmData && lmData.profile) {
          lmData.profile.name = newName;
          localStorage.setItem(`littlemaestro_${newKey}`, JSON.stringify(lmData));
        }
      } catch {}

      // Update Little Maestro index
      try {
        const lmIdx = JSON.parse(localStorage.getItem('littlemaestro__index') || '[]');
        const idx = lmIdx.findIndex(n => n.toLowerCase() === oldName.toLowerCase());
        if (idx !== -1) {
          lmIdx[idx] = newName;
          localStorage.setItem('littlemaestro__index', JSON.stringify(lmIdx));
        }
      } catch {}
    }

    // Escape key to close edit modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (document.getElementById('edit-modal').classList.contains('active')) closeEditModal();
        else if (document.getElementById('pin-modal').classList.contains('active')) closePinModal();
      }
    });

    window.addEventListener('zs:synced', () => {
      if (document.getElementById('hub-screen')?.classList.contains('active')) {
        updateStatsCards(); renderAppCards();
      }
    });


    // ── Init ──
    (function init() {
      const active = getActiveUser();
      if (active) {
        showHub();
      } else {
        renderLogin();
      }
    })();
