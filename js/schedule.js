/* ================================================================
   APP ROTATION SCHEDULER — schedule.js
   
   Controls which apps are visible each day in the hub grid.
   Smart defaults ensure weekly variety across all subjects.
   Parents can override from Parents Corner (PIN-protected).
   
   Requires: auth.js loaded first (getActiveUser, getProfiles, etc.)
   
   Storage:
     zs_schedule_override  → { [dayIndex]: ['piano','math',...] }  (parent overrides)
     zs_schedule_mode      → 'smart' | 'custom'
   
   The hub's renderAppCards() calls AppSchedule.getTodayApps()
   to decide which cards to show/hide.
   ================================================================ */

const AppSchedule = (() => {
  'use strict';

  // ── All app definitions (id must match data-app-id on cards) ──
  const ALL_APPS = [
    { id: 'piano',   card: '.card-piano',   name: 'Little Maestro', icon: '🎹', category: 'music' },
    { id: 'math',    card: '.card-math',     name: 'Math Galaxy',    icon: '🧮', category: 'stem' },
    { id: 'chile',   card: '.card-history',  name: 'Descubre Chile', icon: '🇨🇱', category: 'culture' },
    { id: 'chess',   card: '.card-chess',    name: 'Chess Quest',    icon: '♟️', category: 'strategy' },
    { id: 'faith',   card: '.card-faith',    name: 'Fe Explorador',  icon: '⛪', category: 'faith' },
    { id: 'guitar',  card: '.card-guitar',   name: 'Guitar Jam',     icon: '🎸', category: 'music' },
    { id: 'art',     card: '.card-art',      name: 'Art Studio',     icon: '🎨', category: 'creative' },
    { id: 'sports',  card: '.card-sports',   name: 'Sports Arena',   icon: '🏓', category: 'outdoor' },
  ];

  // ── Smart defaults: 4–5 apps per day, every app appears 3–4x/week ──
  // Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const SMART_SCHEDULE = {
    0: ['piano', 'chile', 'art'],           // Sunday — relaxed: music, culture, creativity
    1: ['math', 'chess', 'guitar'],          // Monday — logic + music
    2: ['piano', 'chile', 'art', 'math'],              // Tuesday — well-rounded
    3: ['math', 'chess', 'guitar'],          // Wednesday — strategy day
    4: ['piano', 'art', 'chile'],            // Thursday — creative + culture
    5: ['math', 'guitar', 'chess', 'art'],             // Friday — challenge day
    6: ['piano', 'chile', 'guitar', 'art'],  // Saturday — big day, more apps
  };

  // Faith is handled separately (faithVisible toggle) — if visible, always included
  // Sports Arena is always available (outdoor activity isn't "screen time")

  const OVERRIDE_KEY  = 'zs_schedule_override';
  const MODE_KEY      = 'zs_schedule_mode';

  // ── Getters ──

  function getMode() {
    return localStorage.getItem(MODE_KEY) || 'smart';
  }

  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
  }

  function getOverrides() {
    try {
      return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {};
    } catch { return {}; }
  }

  function setOverride(dayIndex, appIds) {
    const overrides = getOverrides();
    overrides[dayIndex] = appIds;
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  }

  function clearOverride(dayIndex) {
    const overrides = getOverrides();
    delete overrides[dayIndex];
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  }

  function clearAllOverrides() {
    localStorage.removeItem(OVERRIDE_KEY);
    setMode('smart');
  }

  // ── Core: which apps should be visible today? ──

  function getTodayApps() {
    const day = new Date().getDay(); // 0–6
    const mode = getMode();
    const overrides = getOverrides();

    // If parent set a custom schedule for today, use it
    if (overrides[day] && overrides[day].length > 0) {
      return overrides[day];
    }

    // Smart mode: use the default rotation
    return SMART_SCHEDULE[day] || Object.values(SMART_SCHEDULE)[0];
  }

  function getScheduleForDay(dayIndex) {
    const overrides = getOverrides();
    if (overrides[dayIndex] && overrides[dayIndex].length > 0) {
      return { apps: overrides[dayIndex], isCustom: true };
    }
    return { apps: SMART_SCHEDULE[dayIndex] || [], isCustom: false };
  }

  // ── Apply visibility to hub cards ──

  function applyToHub(user) {
    const visibleIds = getTodayApps();

    ALL_APPS.forEach(app => {
      const el = document.querySelector(app.card);
      if (!el) return;

      // Faith has its own toggle — skip if handled elsewhere
      if (app.id === 'faith') return;

      // Sports Arena is always visible (it's outdoor, not screen time)
      if (app.id === 'sports') {
        el.style.display = '';
        return;
      }

      if (visibleIds.includes(app.id)) {
        el.style.display = '';
        el.classList.remove('schedule-hidden');
      } else {
        el.style.display = 'none';
        el.classList.add('schedule-hidden');
      }
    });
  }

  // ── Get today's banner message for the hub ──

  function getTodayMessage() {
    const apps = getTodayApps();
    const day = new Date().getDay();
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const THEMES = {
      0: "Relaxation & Creativity",
      1: "Logic & Rhythm",
      2: "Well-Rounded Explorer",
      3: "Strategy & Skill",
      4: "Creative & Cultural",
      5: "Challenge Day",
      6: "Weekend Adventure"
    };
    return {
      day: DAYS[day],
      theme: THEMES[day] || 'Learning Day',
      count: apps.length
    };
  }

  // ── Render schedule config for Parents Corner ──

  function renderScheduleConfig() {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mode = getMode();
    const overrides = getOverrides();
    const today = new Date().getDay();

    let html = `
      <div style="margin-bottom:16px;">
        <div style="font-weight:800; font-family:var(--font-display); font-size:1.1rem; margin-bottom:8px;">
          📅 App Rotation Schedule
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
          Kids see a different mix of apps each day. Tap a day to customize which apps appear.
        </div>
        <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
          <button class="hub-action-btn ${mode === 'smart' ? 'active' : 'secondary'}" 
                  style="padding:6px 14px; font-size:0.8rem;" 
                  onclick="AppSchedule.setMode('smart'); AppSchedule.clearAllOverrides(); openParentsCorner();">
            🤖 Smart Rotation
          </button>
          <button class="hub-action-btn secondary" style="padding:6px 14px; font-size:0.8rem;" 
                  onclick="AppSchedule.clearAllOverrides(); openParentsCorner();">
            ↩️ Reset All
          </button>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:10px;">
    `;

    DAYS.forEach((dayName, i) => {
      const sched = getScheduleForDay(i);
      const isToday = i === today;
      const appNames = sched.apps.map(id => {
        const app = ALL_APPS.find(a => a.id === id);
        return app ? app.icon : '';
      }).join(' ');

      html += `
        <div style="padding:12px; background:rgba(255,255,255,${isToday ? '0.06' : '0.02'}); 
             border:1.5px solid ${isToday ? 'var(--purple)' : 'rgba(255,255,255,0.06)'};
             border-radius:12px; cursor:pointer; transition:all 0.2s;"
             onclick="AppSchedule.openDayEditor(${i})">
          <div style="font-weight:800; font-size:0.9rem; margin-bottom:4px;">
            ${isToday ? '▶ ' : ''}${dayName}
            ${sched.isCustom ? '<span style="color:var(--purple);font-size:0.7rem;"> ✏️</span>' : ''}
          </div>
          <div style="font-size:1.1rem; line-height:1.6;">${appNames}</div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${sched.apps.length} apps</div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  // ── Day editor modal ──

  function openDayEditor(dayIndex) {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sched = getScheduleForDay(dayIndex);
    const selected = new Set(sched.apps);

    // Build modal content
    const editableApps = ALL_APPS.filter(a => a.id !== 'faith' && a.id !== 'sports');
    let checkboxes = editableApps.map(app => {
      const checked = selected.has(app.id);
      return `
        <label style="display:flex; align-items:center; gap:10px; padding:10px; cursor:pointer;
               background:rgba(255,255,255,${checked ? '0.06' : '0.02'}); border-radius:10px;
               border:1px solid rgba(255,255,255,${checked ? '0.12' : '0.04'});">
          <input type="checkbox" value="${app.id}" ${checked ? 'checked' : ''} 
                 style="width:18px; height:18px; accent-color:var(--purple);"
                 onchange="AppSchedule._dayEditorChanged()">
          <span style="font-size:1.2rem;">${app.icon}</span>
          <span style="font-weight:700; font-size:0.95rem;">${app.name}</span>
        </label>
      `;
    }).join('');

    // Create or reuse overlay
    let overlay = document.getElementById('schedule-day-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'schedule-day-overlay';
      overlay.className = 'dash-overlay';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('active'); };
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="dash-panel" style="max-width:400px;">
        <h2>📅 ${DAYS[dayIndex]} 
          <button class="dash-close" onclick="document.getElementById('schedule-day-overlay').classList.remove('active')">✕</button>
        </h2>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
          Pick which apps are available on ${DAYS[dayIndex]}s.<br>
          <em>Sports Arena & Fe Explorador are managed separately.</em>
        </div>
        <div id="schedule-day-checkboxes" style="display:flex; flex-direction:column; gap:8px;">
          ${checkboxes}
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
          <button class="hub-action-btn" style="flex:1;" 
                  onclick="AppSchedule._saveDayEditor(${dayIndex})">
            ✅ Save
          </button>
          <button class="hub-action-btn secondary" style="flex:1;" 
                  onclick="AppSchedule.clearOverride(${dayIndex}); document.getElementById('schedule-day-overlay').classList.remove('active'); openParentsCorner();">
            ↩️ Reset to Smart
          </button>
        </div>
      </div>
    `;
    overlay.classList.add('active');
  }

  function _dayEditorChanged() {
    // Visual feedback when toggling
    const boxes = document.querySelectorAll('#schedule-day-checkboxes input[type="checkbox"]');
    boxes.forEach(cb => {
      const label = cb.closest('label');
      if (label) {
        label.style.background = cb.checked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
        label.style.borderColor = cb.checked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
      }
    });
  }

  function _saveDayEditor(dayIndex) {
    const boxes = document.querySelectorAll('#schedule-day-checkboxes input[type="checkbox"]:checked');
    const selected = Array.from(boxes).map(cb => cb.value);

    if (selected.length < 2) {
      alert('Please select at least 2 apps for each day.');
      return;
    }

    setOverride(dayIndex, selected);
    document.getElementById('schedule-day-overlay').classList.remove('active');

    // Refresh Parents Corner and hub
    if (typeof openParentsCorner === 'function') openParentsCorner();
    if (typeof renderAppCards === 'function') renderAppCards();
  }

  // ── Public API ──
  return {
    ALL_APPS,
    getTodayApps,
    getScheduleForDay,
    applyToHub,
    getTodayMessage,
    renderScheduleConfig,
    openDayEditor,
    getMode,
    setMode,
    getOverrides,
    setOverride,
    clearOverride,
    clearAllOverrides,
    _dayEditorChanged,
    _saveDayEditor
  };
})();