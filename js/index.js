
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
    const PARENT_PIN   = '1234';

    // ── Render login screen ──
    function renderLogin() {
      const grid = document.getElementById('profiles-grid');
      const profiles = getProfiles();
      grid.innerHTML = '';

      profiles.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.style.animationDelay = `${0.1 + i * 0.05}s`;
        // Position relative for edit button
        card.style.position = 'relative';

        card.innerHTML = `
          <div class="profile-avatar" style="background:${p.color}22;border-color:${p.color}">${p.avatar}</div>
          <div class="profile-name">${escHtml(p.name)}</div>
          ${p.age ? `<div class="profile-age">Age ${p.age}</div>` : ''}
          <button class="profile-edit-btn" data-index="${i}" title="Edit ${escHtml(p.name)}" onclick="event.stopPropagation(); requestPinThen(() => openEditModal(${i}))">✏️</button>
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
    }

    function loginAs(user) {
      setActiveUser(user);
      showHub();
    }

    function switchUser() {
      localStorage.removeItem(ACTIVE_KEY);
      document.getElementById('hub-screen').classList.remove('active');
      document.getElementById('login-screen').style.display = '';
      renderLogin();
    }

    function showHub() {
      const user = getActiveUser();
      if (!user) return;
      const key = user.name.toLowerCase().replace(/\s+/g, '_');
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('hub-screen').classList.add('active');

      document.getElementById('ub-avatar').textContent = user.avatar;
      document.getElementById('ub-avatar').style.cssText = `background:${user.color}22;border-color:${user.color}`;
      document.getElementById('ub-name').textContent = user.name;
      
      const totalStars = typeof getTotalStars === 'function' ? getTotalStars() : 0;
      const rank = typeof getExplorerRank === 'function' ? getExplorerRank() : { icon: '🛸', name: 'Cadet' };
      const rankText = `${rank.icon} ${rank.name}`;
      const starText = totalStars > 0 ? ` · ⭐ ${totalStars}` : '';
      document.getElementById('ub-greeting').textContent = `${rankText}${starText} · ${getGreeting()}`;

      // Rank-up celebration
      const lastRank = localStorage.getItem(`zs_lastrank_${key}`) || 'Cadet';
      if (rank.name !== lastRank && lastRank !== 'Cadet') {
        showRankUpCelebration(rank);
      }
      localStorage.setItem(`zs_lastrank_${key}`, rank.name);

      // Update timer and token display
      if (typeof TimerManager !== 'undefined') {
        const rem = TimerManager.getRemaining();
        document.getElementById('timer-display').textContent = `⏰ ${rem} min left`;
      }
      if (typeof ChoresManager !== 'undefined') {
        const tokens = ChoresManager.getStatus().totalTokens;
        document.getElementById('token-balance').textContent = `⭐ ${tokens} tokens`;
      }

      renderAppCards();
      updateStatsCards();

      // Render Next Challenge
      const challenge = getNextChallenge();
      const wrap = document.getElementById('next-challenge-wrap');
      if (wrap && challenge) {
        wrap.innerHTML = `
          <div class="next-challenge" onclick="${challenge.href ? `location.href='${challenge.href}'` : ''}" 
               style="border: 2px solid ${user.color}44; background: var(--bg-surface); padding: 16px; border-radius: 16px; 
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

    function getNextChallenge() {
      const user = getActiveUser();
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
        { name: 'Art Studio', icon: '🎨', href: 'art-studio.html', key: `zs_art_${key}` }
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
    function updateStatsCards() {
      try {
        const user = getActiveUser();
        if (!user) return;
        const key = user.name.toLowerCase().replace(/\s+/g, '_');

        // Guitar Jam
        try {
          const gj = JSON.parse(localStorage.getItem(`zs_guitar_${key}`)) || {};
          const el = document.getElementById('stats-guitar');
          if (el && (gj.totalStars || 0) > 0) el.innerHTML = `<span class="cs-item active">⭐ ${gj.totalStars}</span>`;
        } catch {}

        // Art Studio
        try {
          const as = JSON.parse(localStorage.getItem(`zs_art_${key}`)) || {};
          const el = document.getElementById('stats-art');
          if (el && (as.totalStars || 0) > 0) el.innerHTML = `<span class="cs-item active">⭐ ${as.totalStars}</span>`;
        } catch {}

        // Fe Explorador
        try {
          const fe = JSON.parse(localStorage.getItem(`zs_fe_${key}`)) || {};
          const el = document.getElementById('stats-faith');
          if (el && (fe.totalStars || 0) > 0) el.innerHTML = `<span class="cs-item active">⭐ ${fe.totalStars}</span>`;
        } catch {}

        // Little Maestro
        try {
          const lm = JSON.parse(localStorage.getItem(`littlemaestro_${key}`)) || {};
          const prog = lm.progress || {};
          const completedSongs = Object.entries(prog)
            .filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).length;
          const totalLMStars = Object.entries(prog)
            .filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0)
            .reduce((s, [, v]) => s + v.stars, 0);
          const streak = (lm.stats && lm.stats.currentStreak) || 0;
          const pianoEl = document.getElementById('stats-piano');
          if (pianoEl) {
            if (completedSongs > 0) {
              const items = [`⭐ ${totalLMStars} stars`, `🎼 ${completedSongs} songs`];
              if (streak > 0) items.push(`🔥 ${streak} streak`);
              pianoEl.innerHTML = items.map(i => `<span class="cs-item active">${i}</span>`).join('');
            } else {
              pianoEl.innerHTML = '';
            }
          }
        } catch { if (document.getElementById('stats-piano')) document.getElementById('stats-piano').innerHTML = ''; }

        // Math Galaxy
        try {
          const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {};
          const levels = Object.entries(mg);
          const mathEl = document.getElementById('stats-math');
          if (mathEl) {
            if (levels.length > 0) {
              const totalStars = levels.reduce((s, [, l]) => s + (l.bestStars || 0), 0);
              mathEl.innerHTML = `<span class="cs-item active">⭐ ${totalStars} stars</span>`;
            } else {
              mathEl.innerHTML = '';
            }
          }
        } catch { if (document.getElementById('stats-math')) document.getElementById('stats-math').innerHTML = ''; }

        // Chile
        try {
          const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {};
          const chileEl = document.getElementById('stats-chile');
          if (chileEl) {
            const totalStars = Object.entries(dc)
              .filter(([k]) => k !== 'vr' && k !== 'memBest')
              .reduce((s, [, v]) => s + ((v && v.bestStars) || 0), 0);
            if (totalStars > 0) {
              chileEl.innerHTML = `<span class="cs-item active">⭐ ${totalStars} stars</span>`;
            } else {
              chileEl.innerHTML = '';
            }
          }
        } catch { if (document.getElementById('stats-chile')) document.getElementById('stats-chile').innerHTML = ''; }

        // Chess
        try {
          const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {};
          const chessEl = document.getElementById('stats-chess');
          if (chessEl) {
            const total = (cq.puzzlesSolved || 0) + (cq.wins || 0);
            if (total > 0) {
              chessEl.innerHTML = `<span class="cs-item active">⭐ ${total} stars</span>`;
            } else {
              chessEl.innerHTML = '';
            }
          }
        } catch { if (document.getElementById('stats-chess')) document.getElementById('stats-chess').innerHTML = ''; }

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

        try {
          const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {};
          const levels = Object.entries(mg);
          if (levels.length > 0) {
            const totalStars = levels.reduce((s, [, l]) => s + (l.bestStars || 0), 0);
            const totalPlays = levels.reduce((s, [, l]) => s + (l.plays || 0), 0);
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🧮</span><span class="dash-app-name">Math Galaxy <span style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">(${tierName} tier)</span></span><span class="dash-app-stat">⭐ ${totalStars} · ${totalPlays} plays</span></div>`;
          }
        } catch {}
        try {
          const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {};
          const totalStars = Object.entries(dc).filter(([k]) => k !== 'vr' && k !== 'memBest').reduce((s, [, v]) => s + ((v && v.bestStars) || 0), 0);
          if (totalStars > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">🇨🇱</span><span class="dash-app-name">Descubre Chile <span style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">(${tierName} tier)</span></span><span class="dash-app-stat">⭐ ${totalStars}</span></div>`;
        } catch {}
        try {
          const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {};
          const total = (cq.puzzlesSolved || 0) + (cq.wins || 0);
          if (total > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">♟️</span><span class="dash-app-name">Chess Quest <span style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">(${tierName} tier)</span></span><span class="dash-app-stat">⭐ ${total}</span></div>`;
        } catch {}
        try {
          const lm = JSON.parse(localStorage.getItem(`littlemaestro_${key}`)) || {};
          const prog = lm.progress || {};
          const totalStars = Object.entries(prog).filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).reduce((s, [, v]) => s + v.stars, 0);
          if (totalStars > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎹</span><span class="dash-app-name">Little Maestro</span><span class="dash-app-stat">⭐ ${totalStars}</span></div>`;
        } catch {}

        try {
          const fe = JSON.parse(localStorage.getItem(`zs_fe_${key}`)) || {};
          if (fe.totalStars > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">⛪</span><span class="dash-app-name">Fe Explorador</span><span class="dash-app-stat">⭐ ${fe.totalStars}</span></div>`;
        } catch {}

        try {
          const gj = JSON.parse(localStorage.getItem(`zs_guitar_${key}`)) || {};
          if ((gj.totalStars || 0) > 0) {
            const chords = (gj.chordsLearned || []).length;
            const songs = (gj.songsCompleted || []).length;
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎸</span>
              <span class="dash-app-name">Guitar Jam</span>
              <span class="dash-app-stat">⭐ ${gj.totalStars} · ${chords} chords · ${songs} songs</span></div>`;
          }
        } catch {}
        try {
          const as = JSON.parse(localStorage.getItem(`zs_art_${key}`)) || {};
          if ((as.totalStars || 0) > 0) {
            const artworks = (as.gallery || []).length;
            const lessons = (as.lessonsCompleted || []).length;
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎨</span>
              <span class="dash-app-name">Art Studio</span>
              <span class="dash-app-stat">⭐ ${as.totalStars} · ${artworks} artworks · ${lessons} lessons</span></div>`;
          }
        } catch {}

        const rank = typeof getExplorerRank === 'function' ? getExplorerRank(p.name) : { icon: '🛸', name: 'Cadet' };

        return `<div class="dash-profile">
          <div class="dash-profile-header">
            <div class="dash-avatar" style="background:${p.color}22;border-color:${p.color}">${p.avatar}</div>
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
        <div class="parents-top-actions" style="margin-bottom:20px; padding:16px; background:rgba(255,255,255,0.05); border-radius:16px;">
          <label class="pk-toggle" style="justify-content:center; font-size:1.1rem;">
            <input type="checkbox" ${isPaused ? 'checked' : ''} onchange="toggleAllTimers(this.checked)">
            ⏸ Pause All Timers
          </label>
        </div>
        <div class="parents-grid">
          ${profiles.map((p, i) => {
            const timerData = TimerManager.getDataForKid(p.name) || { minutesUsed: 0, maxMinutes: 45 };
            return `
              <div class="parent-kid-card">
                <div class="pk-header">
                  <span class="pk-avatar">${p.avatar}</span>
                  <span class="pk-name">${p.name}</span>
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
                          onclick="addKidBonus('${p.name}', 15)">+15 min</button>
                  <button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1;" 
                          onclick="addKidBonus('${p.name}', 30)">+30 min</button>
                  <button class="hub-action-btn secondary" style="padding:6px 12px; font-size:0.75rem; flex:1; border-color:rgba(239,68,68,0.3); color:#F87171;" 
                          onclick="resetKidTimer('${p.name}')">Reset Today</button>
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

    async function _syncPushAll() {
      const btn = event.target;
      btn.textContent = '⬆️ Pushing...';
      btn.disabled = true;
      try {
        await CloudSync.pushAllKids();
        btn.textContent = '✅ Pushed!';
      } catch (e) { btn.textContent = '❌ Failed'; }
      setTimeout(() => { btn.textContent = '⬆️ Push All to Cloud'; btn.disabled = false; }, 2000);
    }

    async function _syncPullAll() {
      const btn = event.target;
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
    function renderAppCards() {
      const user = getActiveUser();
      if (!user) return;

      const feEl = document.querySelector('.card-faith');
      if (feEl) feEl.style.display = (user.faithVisible !== false) ? 'flex' : 'none';

      // Chess limit display
      const chessCard = document.querySelector('.card-chess');
      if (chessCard) {
        const remaining = chessPlaysRemaining();
        const limit = getChessLimit();
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
      setTimeout(() => { if (input) input.focus(); }, 100);
    }

    function closePinModal() {
      document.getElementById('pin-modal').classList.remove('active');
      pinCallback = null;
    }

    function submitPin() {
      const input = document.getElementById('pin-input');
      const error = document.getElementById('pin-error');
      if (input.value === PARENT_PIN) {
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
