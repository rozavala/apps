    let selectedEmoji = AVATARS[0];
    let selectedColor = COLORS[0];
    let selectedAge   = null;

    // ── Render login screen ──
    function renderLogin() {
      const grid = document.getElementById('profiles-grid');
      const profiles = getProfiles();
      grid.innerHTML = '';

      profiles.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.style.animationDelay = `${0.1 + i * 0.05}s`;
        card.onclick = () => loginAs(p);
        card.innerHTML = `
          <div class="profile-avatar" style="background:${p.color}22;border-color:${p.color}">${p.avatar}</div>
          <div class="profile-name">${escHtml(p.name)}</div>
          ${p.age ? `<div class="profile-age">Age ${p.age}</div>` : ''}
        `;
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
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('hub-screen').classList.add('active');

      document.getElementById('ub-avatar').textContent = user.avatar;
      document.getElementById('ub-avatar').style.cssText = `background:${user.color}22;border-color:${user.color}`;
      document.getElementById('ub-name').textContent = user.name;
      const totalStars = typeof getTotalStars === 'function' ? getTotalStars() : 0;
      const starText = totalStars > 0 ? ` · ⭐ ${totalStars}` : '';
      document.getElementById('ub-greeting').textContent = (user.age ? `Age ${user.age} · ${getGreeting()}` : getGreeting()) + starText;
      loadCardStats(user);
    }

    // ── Card Progress Stats ──
    function loadCardStats(user) {
      const key = user.name.toLowerCase().replace(/\s+/g, '_');

      // Math Galaxy
      try {
        const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {};
        const levels = Object.values(mg);
        const totalStars = levels.reduce((s, l) => s + (l.bestStars || 0), 0);
        const totalPlays = levels.reduce((s, l) => s + (l.plays || 0), 0);
        const el = document.getElementById('stats-math');
        if (totalPlays > 0) el.innerHTML = `<span class="cs-item active">⭐ ${totalStars} stars</span><span class="cs-item">${totalPlays} games</span>`;
        else el.innerHTML = '';
      } catch { document.getElementById('stats-math').innerHTML = ''; }

      // Descubre Chile
      try {
        const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {};
        const topics = Object.values(dc);
        const completed = topics.filter(t => t.bestStars > 0).length;
        const el = document.getElementById('stats-chile');
        if (completed > 0) el.innerHTML = `<span class="cs-item active">⭐ ${completed}/6 topics</span>`;
        else el.innerHTML = '';
      } catch { document.getElementById('stats-chile').innerHTML = ''; }

      // Chess Quest
      try {
        const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {};
        const items = [];
        if ((cq.learnedPieces || []).length > 0) items.push(`📚 ${cq.learnedPieces.length}/6 pieces`);
        if ((cq.puzzlesSolved || 0) > 0) items.push(`🧩 ${cq.puzzlesSolved} puzzles`);
        const wins = cq.wins || 0, losses = cq.losses || 0;
        if (wins + losses > 0) items.push(`⚔️ ${wins}W ${losses}L`);
        const el = document.getElementById('stats-chess');
        el.innerHTML = items.map(i => `<span class="cs-item active">${i}</span>`).join('');
      } catch { document.getElementById('stats-chess').innerHTML = ''; }

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
        let appRows = '';

        // Math Galaxy
        try {
          const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {};
          const levels = Object.entries(mg);
          if (levels.length > 0) {
            const totalStars = levels.reduce((s, [, l]) => s + (l.bestStars || 0), 0);
            const totalPlays = levels.reduce((s, [, l]) => s + (l.plays || 0), 0);
            const bestLevel = levels.sort((a, b) => (b[1].bestPct || 0) - (a[1].bestPct || 0))[0];
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🧮</span><span class="dash-app-name">Math Galaxy</span><span class="dash-app-stat">⭐ ${totalStars} stars · ${totalPlays} games · Best: ${bestLevel[0]} ${bestLevel[1].bestPct}%</span></div>`;
          } else {
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🧮</span><span class="dash-app-name">Math Galaxy</span><span class="dash-app-stat">Not started</span></div>`;
          }
        } catch {
          appRows += `<div class="dash-app-row"><span class="dash-app-icon">🧮</span><span class="dash-app-name">Math Galaxy</span><span class="dash-app-stat">Not started</span></div>`;
        }

        // Descubre Chile
        try {
          const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {};
          const topics = Object.entries(dc);
          const completed = topics.filter(([, t]) => t.bestStars > 0).length;
          if (completed > 0) {
            const totalStars = topics.reduce((s, [, t]) => s + (t.bestStars || 0), 0);
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🇨🇱</span><span class="dash-app-name">Descubre Chile</span><span class="dash-app-stat">⭐ ${totalStars} stars · ${completed}/6 topics</span></div>`;
          } else {
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🇨🇱</span><span class="dash-app-name">Descubre Chile</span><span class="dash-app-stat">Not started</span></div>`;
          }
        } catch {
          appRows += `<div class="dash-app-row"><span class="dash-app-icon">🇨🇱</span><span class="dash-app-name">Descubre Chile</span><span class="dash-app-stat">Not started</span></div>`;
        }

        // Chess Quest
        try {
          const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {};
          const parts = [];
          if ((cq.learnedPieces || []).length > 0) parts.push(`${cq.learnedPieces.length}/6 pieces`);
          if ((cq.puzzlesSolved || 0) > 0) parts.push(`${cq.puzzlesSolved} puzzles`);
          const w = cq.wins || 0, l = cq.losses || 0, d = cq.draws || 0;
          if (w + l + d > 0) parts.push(`${w}W ${l}L ${d}D`);
          if (parts.length > 0) {
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">♟️</span><span class="dash-app-name">Chess Quest</span><span class="dash-app-stat">${parts.join(' · ')}</span></div>`;
          } else {
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">♟️</span><span class="dash-app-name">Chess Quest</span><span class="dash-app-stat">Not started</span></div>`;
          }
        } catch {
          appRows += `<div class="dash-app-row"><span class="dash-app-icon">♟️</span><span class="dash-app-name">Chess Quest</span><span class="dash-app-stat">Not started</span></div>`;
        }

        // Little Maestro
        try {
          const lm = JSON.parse(localStorage.getItem(`littlemaestro_${key}`)) || {};
          const prog = lm.progress || {};
          const songs = Object.entries(prog).filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).length;
          const lmStars = Object.entries(prog).filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).reduce((s, [, v]) => s + v.stars, 0);
          const streak = (lm.stats && lm.stats.currentStreak) || 0;
          if (songs > 0) {
            const parts = [`⭐ ${lmStars} stars`, `${songs} songs`];
            if (streak > 0) parts.push(`🔥 ${streak} day streak`);
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎹</span><span class="dash-app-name">Little Maestro</span><span class="dash-app-stat">${parts.join(' · ')}</span></div>`;
          } else {
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎹</span><span class="dash-app-name">Little Maestro</span><span class="dash-app-stat">Not started</span></div>`;
          }
        } catch {
          appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎹</span><span class="dash-app-name">Little Maestro</span><span class="dash-app-stat">Not started</span></div>`;
        }

        return `<div class="dash-kid">
          <div class="dash-kid-header">
            <div class="dash-kid-avatar" style="background:${p.color}22;border-color:${p.color}">${p.avatar}</div>
            <div>
              <div class="dash-kid-name">${escHtml(p.name)}</div>
              <div class="dash-kid-age">${p.age ? 'Age ' + p.age : ''}</div>
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

    // ── Modal ──
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
        // Flash the age picker briefly
        document.getElementById('age-picker').style.outline = '2px solid #EF4444';
        setTimeout(() => document.getElementById('age-picker').style.outline = '', 1500);
        return;
      }
      const profiles = getProfiles();
      const newUser = { name, avatar: selectedEmoji, color: selectedColor, age: selectedAge };
      profiles.push(newUser);
      saveProfiles(profiles);
      closeModal();
      loginAs(newUser);
    }

    // ── Init ──
    (function init() {
      const active = getActiveUser();
      if (active) {
        showHub();
      } else {
        renderLogin();
      }
    })();
