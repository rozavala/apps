
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
          loginAs(p);
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
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('hub-screen').classList.add('active');

      document.getElementById('ub-avatar').textContent = user.avatar;
      document.getElementById('ub-avatar').style.cssText = `background:${user.color}22;border-color:${user.color}`;
      document.getElementById('ub-name').textContent = user.name;
      const totalStars = typeof getTotalStars === 'function' ? getTotalStars() : 0;
      const starText = totalStars > 0 ? ` · ⭐ ${totalStars}` : '';
      document.getElementById('ub-greeting').textContent = (user.age ? `Age ${user.age}` : getGreeting()) + starText;

      updateStatsCards();
    }

    // ── Stats cards on hub ──
    function updateStatsCards() {
      try {
        const user = getActiveUser();
        if (!user) return;
        const key = user.name.toLowerCase().replace(/\s+/g, '_');

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
        let appRows = '';

        try {
          const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {};
          const levels = Object.entries(mg);
          if (levels.length > 0) {
            const totalStars = levels.reduce((s, [, l]) => s + (l.bestStars || 0), 0);
            const totalPlays = levels.reduce((s, [, l]) => s + (l.plays || 0), 0);
            appRows += `<div class="dash-app-row"><span class="dash-app-icon">🧮</span><span class="dash-app-name">Math Galaxy</span><span class="dash-app-stat">⭐ ${totalStars} · ${totalPlays} plays</span></div>`;
          }
        } catch {}
        try {
          const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {};
          const totalStars = Object.entries(dc).filter(([k]) => k !== 'vr' && k !== 'memBest').reduce((s, [, v]) => s + ((v && v.bestStars) || 0), 0);
          if (totalStars > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">🇨🇱</span><span class="dash-app-name">Descubre Chile</span><span class="dash-app-stat">⭐ ${totalStars}</span></div>`;
        } catch {}
        try {
          const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {};
          const total = (cq.puzzlesSolved || 0) + (cq.wins || 0);
          if (total > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">♟️</span><span class="dash-app-name">Chess Quest</span><span class="dash-app-stat">⭐ ${total}</span></div>`;
        } catch {}
        try {
          const lm = JSON.parse(localStorage.getItem(`littlemaestro_${key}`)) || {};
          const prog = lm.progress || {};
          const totalStars = Object.entries(prog).filter(([, v]) => typeof v === 'object' && v !== null && v.stars > 0).reduce((s, [, v]) => s + v.stars, 0);
          if (totalStars > 0) appRows += `<div class="dash-app-row"><span class="dash-app-icon">🎹</span><span class="dash-app-name">Little Maestro</span><span class="dash-app-stat">⭐ ${totalStars}</span></div>`;
        } catch {}

        return `<div class="dash-profile">
          <div class="dash-profile-header">
            <div class="dash-avatar" style="background:${p.color}22;border-color:${p.color}">${p.avatar}</div>
            <div>
              <div class="dash-name">${escHtml(p.name)}</div>
              <div class="dash-age">${p.age ? 'Age ' + p.age : ''}</div>
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
      const newUser = { name, avatar: selectedEmoji, color: selectedColor, age: selectedAge };
      profiles.push(newUser);
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


    // ── Init ──
    (function init() {
      const active = getActiveUser();
      if (active) {
        showHub();
      } else {
        renderLogin();
      }
    })();
