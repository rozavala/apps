/* ================================================================
   DAILY ROUTINES — routines.js
   Morning + afternoon + night self-report checklists that live on the
   hub and the Family Wall. Separate from the existing Chores/Token
   system by design: this is about building habit (streak) not earning
   screen-time.

   Storage key: zs_routines_<userkey>
   Shape:
     {
       days: { "YYYY-MM-DD": { morning: ["bed","teeth"], afternoon: [...], evening: [...] } },
       templates: { morning: [{id,label}], afternoon: [...], evening: [...] },
       streak: 3,
       bestStreak: 9,
       lastFullDay: "YYYY-MM-DD"
     }

   Default routines are intentional minimums. Parents edit them per kid
   in Parents Corner (hub) or straight from the Family Wall.
   ================================================================ */

var Routines = (function() {
  'use strict';

  var STORAGE_PREFIX = 'zs_routines_';

  // The three checklists, in the order they happen during the day.
  var ROUTINE_IDS = ['morning', 'afternoon', 'evening'];

  // Display strings kept in one place so the hub widget, the modal and
  // the Family Wall all name the routines the same way.
  var ROUTINE_LABELS = {
    morning:   { icon: '🌅', short: 'Morning',   title: 'Morning routine',   greeting: 'Good morning' },
    afternoon: { icon: '☀️', short: 'Afternoon', title: 'Afternoon routine', greeting: 'Good afternoon' },
    evening:   { icon: '🌙', short: 'Night',     title: 'Night routine',     greeting: 'Good night' }
  };

  // Default morning/afternoon/night templates. Kid-authored text only.
  // Labels are English by default; parents can edit (and translate)
  // via the Routines editor in Parents Corner or on the Family Wall.
  var DEFAULTS = {
    morning: [
      { id: 'bed',       label: 'Make the bed 🛏️' },
      { id: 'teeth',     label: 'Brush teeth 🦷' },
      { id: 'dressed',   label: 'Get dressed 👕' },
      { id: 'breakfast', label: 'Eat breakfast 🥣' },
      { id: 'backpack',  label: 'Pack the backpack 🎒' }
    ],
    afternoon: [
      { id: 'snack',      label: 'Snack + clear the plate 🍎' },
      { id: 'homework',   label: 'Homework ✏️' },
      { id: 'practice',   label: 'Practice music 🎹' },
      { id: 'outside',    label: 'Play outside 🏃' },
      { id: 'unpack',     label: 'Empty the backpack 🎒' }
    ],
    evening: [
      { id: 'tidy',      label: 'Tidy the room 🧸' },
      { id: 'laundry',   label: 'Put laundry away 🧦' },
      { id: 'teeth_pm',  label: 'Brush teeth 🦷' },
      { id: 'read',      label: 'Read for a bit 📖' }
    ]
  };

  function _isRoutine(which) {
    return ROUTINE_IDS.indexOf(which) !== -1;
  }

  function _userKey() {
    if (typeof getActiveUser !== 'function') return null;
    var u = getActiveUser();
    if (!u) return null;
    return u.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _keyForName(userName) {
    return STORAGE_PREFIX + String(userName).toLowerCase().replace(/\s+/g, '_');
  }

  function _storageKey() {
    var k = _userKey();
    return k ? (STORAGE_PREFIX + k) : null;
  }

  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _yesterday() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Mirror to the family server so the fridge iPad and the phones agree
  // on both the checklists and what's already ticked off today.
  function _push(key) {
    if (!key) return;
    if (typeof CloudSync !== 'undefined' && CloudSync.push) {
      try { CloudSync.push(key); } catch (e) {}
    }
  }

  function _read(key) {
    var data;
    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { data = {}; }
    if (!data.days) data.days = {};
    if (typeof data.streak !== 'number') data.streak = 0;
    if (typeof data.bestStreak !== 'number') data.bestStreak = 0;
    return data;
  }

  function _write(key, data) {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    _push(key);
  }

  function _load() {
    var k = _storageKey();
    if (!k) return null;
    return _read(k);
  }

  function _save(data) {
    _write(_storageKey(), data);
  }

  // Days saved before the afternoon routine existed only carry morning
  // and evening arrays, so fill in whatever is missing.
  function _getDay(data, dayKey) {
    if (!data.days[dayKey]) data.days[dayKey] = {};
    var day = data.days[dayKey];
    ROUTINE_IDS.forEach(function(which) {
      if (!Array.isArray(day[which])) day[which] = [];
    });
    return day;
  }

  // Returns the effective template for a routine. Priority:
  //   1. Kid-specific override stored under data.templates.<which>
  //   2. The hardcoded DEFAULTS.<which>
  // Templates are arrays of { id, label } — same shape as DEFAULTS.
  function _getTemplate(data, which) {
    if (data && data.templates && Array.isArray(data.templates[which]) && data.templates[which].length > 0) {
      return data.templates[which];
    }
    return DEFAULTS[which] || [];
  }

  // One routine's slice of the status object: the items with their
  // done flags, plus the counts the progress bars need.
  function _block(data, day, which) {
    var tpl = _getTemplate(data, which);
    var ticked = day[which] || [];
    return {
      items: tpl.map(function(c) {
        return { id: c.id, label: c.label, done: ticked.indexOf(c.id) !== -1 };
      }),
      doneCount: ticked.length,
      total: tpl.length,
      complete: ticked.length >= tpl.length
    };
  }

  // A day counts for the streak once every routine is fully ticked.
  function _allComplete(data, day) {
    return ROUTINE_IDS.every(function(which) {
      return (day[which] || []).length >= _getTemplate(data, which).length;
    });
  }

  function _bumpStreak(data, day) {
    var today = _today();
    if (!_allComplete(data, day) || data.lastFullDay === today) return false;
    data.streak = (data.lastFullDay === _yesterday()) ? (data.streak || 0) + 1 : 1;
    data.lastFullDay = today;
    if (data.streak > (data.bestStreak || 0)) data.bestStreak = data.streak;
    return true;
  }

  function _statusFrom(data, userName) {
    var today = _today();
    var day = _getDay(data, today);
    var status = {
      userName: userName || null,
      date: today,
      streak: data.streak,
      bestStreak: data.bestStreak
    };
    ROUTINE_IDS.forEach(function(which) {
      status[which] = _block(data, day, which);
    });
    return status;
  }

  function getTemplates(userName) {
    // Used by the Parents Corner editor and the Family Wall editor.
    var data = userName ? _read(_keyForName(userName)) : (_load() || {});
    var out = {};
    ROUTINE_IDS.forEach(function(which) {
      out[which] = _getTemplate(data, which).slice();
    });
    return out;
  }

  function setTemplate(which, items, userName) {
    if (!_isRoutine(which)) return;
    var k = userName ? _keyForName(userName) : _storageKey();
    if (!k) return;
    var data = _read(k);
    if (!data.templates) data.templates = {};
    data.templates[which] = items.map(function(it, i) {
      return {
        id: it && it.id ? String(it.id) : 'custom_' + i + '_' + Date.now().toString(36),
        label: String(it && it.label ? it.label : '').slice(0, 80)
      };
    }).filter(function(it) { return it.label.length > 0; });
    _write(k, data);
  }

  function resetTemplate(which, userName) {
    if (!_isRoutine(which)) return;
    var k = userName ? _keyForName(userName) : _storageKey();
    if (!k) return;
    var data = _read(k);
    if (data.templates) delete data.templates[which];
    _write(k, data);
  }

  function getStatus() {
    var data = _load();
    if (!data) return null;
    return _statusFrom(data);
  }

  function toggle(routine, itemId) {
    if (!_isRoutine(routine)) return getStatus();
    var data = _load();
    if (!data) return null;
    var today = _today();
    var day = _getDay(data, today);
    var list = day[routine];
    var idx = list.indexOf(itemId);
    var tpl = _getTemplate(data, routine);
    if (idx === -1) {
      // Don't add ids that aren't in the active template (defence).
      var isKnown = tpl.some(function(c) { return c.id === itemId; });
      if (!isKnown) return getStatus();
      list.push(itemId);
    } else {
      list.splice(idx, 1);
    }

    // Update the streak when EVERY routine hits 100% for the day.
    if (_bumpStreak(data, day)) {
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Routines', '✅', 'Day complete (streak ' + data.streak + ')');
      }
      // Already English — left as-is.
    }
    _save(data);
    return getStatus();
  }

  // Which routine is currently "relevant" based on local time. Same cut
  // points as the Family Wall greeting: morning until noon, afternoon
  // until 18:00, night after that.
  function getActiveRoutine() {
    var hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  function labelFor(which) {
    return ROUTINE_LABELS[which] || ROUTINE_LABELS.morning;
  }

  // ── Hub widget ──
  // A profile can opt out of routines entirely (eg. parent profiles
  // who don't want a "Good morning, brush teeth" widget on their hub).
  // The flag lives on the profile itself, not in zs_routines, so it
  // syncs as part of the standard profiles bucket. Default true.
  function isEnabledFor(userName) {
    if (typeof getProfiles !== 'function') return true;
    var profiles = getProfiles();
    if (!Array.isArray(profiles)) return true;
    var match = profiles.filter(function(p) { return p && p.name === userName; })[0];
    if (!match) return true;
    return match.routinesEnabled !== false;
  }

  function renderHubWidget(containerId) {
    var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) return;
    var active = (typeof getActiveUser === 'function') ? getActiveUser() : null;
    if (active && !isEnabledFor(active.name)) {
      el.innerHTML = '';
      return;
    }
    var status = getStatus();
    if (!status) { el.innerHTML = ''; return; }

    var which = getActiveRoutine();
    var block = status[which];
    var info = labelFor(which);
    var heading = info.icon + ' ' + info.greeting;

    if (block.complete) {
      el.innerHTML =
        '<div class="rn-card rn-done" onclick="Routines._open(\'' + which + '\')">' +
          '<div class="rn-emoji">🎉</div>' +
          '<div class="rn-body">' +
            '<div class="rn-title">' + heading + ' — all done!</div>' +
            '<div class="rn-sub">Streak: 🔥 ' + status.streak + ' day' + (status.streak === 1 ? '' : 's') + '</div>' +
          '</div>' +
          '<div class="rn-arrow">→</div>' +
        '</div>';
      return;
    }

    var remaining = block.total - block.doneCount;
    var pct = block.total ? Math.round((block.doneCount / block.total) * 100) : 0;
    el.innerHTML =
      '<div class="rn-card" onclick="Routines._open(\'' + which + '\')">' +
        '<div class="rn-emoji">' + info.icon + '</div>' +
        '<div class="rn-body">' +
          '<div class="rn-title">' + heading + '</div>' +
          '<div class="rn-sub">' + remaining + ' thing' + (remaining === 1 ? '' : 's') + ' to do' +
          (status.streak > 0 ? ' · 🔥 ' + status.streak : '') + '</div>' +
          '<div class="rn-bar"><div class="rn-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<div class="rn-arrow">→</div>' +
      '</div>';
  }

  // ── Modal ──
  function _ensureOverlay() {
    if (document.getElementById('routines-overlay')) return;
    var ov = document.createElement('div');
    ov.className = 'dash-overlay';
    ov.id = 'routines-overlay';
    ov.onclick = function(e) { if (e.target === ov) _close(); };
    ov.innerHTML =
      '<div class="dash-panel" style="max-width:480px;">' +
        '<h2 style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span id="routines-title">Routine</span>' +
          '<button class="dash-close" onclick="Routines._close()" aria-label="Close">✕</button>' +
        '</h2>' +
        '<div id="routines-body"></div>' +
      '</div>';
    document.body.appendChild(ov);
  }

  function _open(which) {
    if (!_isRoutine(which)) which = getActiveRoutine();
    _ensureOverlay();
    _renderModal(which);
    var ov = document.getElementById('routines-overlay');
    if (ov) ov.classList.add('active');
  }

  function _close() {
    var ov = document.getElementById('routines-overlay');
    if (ov) ov.classList.remove('active');
  }

  function _renderModal(which) {
    var status = getStatus();
    if (!status) return;
    var block = status[which];
    var info = labelFor(which);

    var titleEl = document.getElementById('routines-title');
    if (titleEl) titleEl.textContent = info.icon + ' ' + info.title;

    var body = document.getElementById('routines-body');
    if (!body) return;

    var progressPct = block.total ? Math.round((block.doneCount / block.total) * 100) : 0;
    var streakLine = status.streak > 0
      ? '<div class="rn-streak">🔥 ' + status.streak + '-day streak' +
        (status.bestStreak > status.streak ? ' · Best: ' + status.bestStreak : '') + '</div>'
      : '<div class="rn-streak rn-streak-empty">Finish all three routines in the same day to start a streak</div>';

    var itemsHtml = block.items.map(function(it) {
      return '<label class="rn-item ' + (it.done ? 'rn-done-item' : '') + '">' +
        '<input type="checkbox" ' + (it.done ? 'checked' : '') + ' ' +
               'onchange="Routines._toggle(\'' + which + '\', \'' + it.id + '\')">' +
        '<span class="rn-item-label">' + it.label + '</span>' +
      '</label>';
    }).join('');

    // Jump straight to either of the other two routines.
    var switchBtns = ROUTINE_IDS.filter(function(id) { return id !== which; })
      .map(function(id) {
        var other = labelFor(id);
        return '<button class="hub-action-btn secondary" onclick="Routines._open(\'' + id + '\')">' +
          'See ' + other.icon + ' ' + other.short +
        '</button>';
      }).join('');

    body.innerHTML =
      streakLine +
      '<div class="rn-progress">' +
        '<div class="rn-progress-text">' + block.doneCount + ' / ' + block.total + '</div>' +
        '<div class="rn-progress-bar"><div class="rn-progress-fill" style="width:' + progressPct + '%"></div></div>' +
      '</div>' +
      '<div class="rn-list">' + itemsHtml + '</div>' +
      '<div class="rn-switch">' + switchBtns + '</div>';
  }

  function _toggle(which, id) {
    toggle(which, id);
    _renderModal(which);
    renderHubWidget('routines-widget');
  }

  // Status + toggle for any kid by name (used by Family Wall, where
  // multiple kids' routines render side-by-side without switching the
  // active user). Reads/writes zs_routines_<kid>.
  function getStatusFor(userName) {
    if (!userName) return null;
    return _statusFrom(_read(_keyForName(userName)), userName);
  }

  function toggleFor(userName, routine, itemId) {
    if (!userName) return null;
    if (!_isRoutine(routine)) return getStatusFor(userName);
    var k = _keyForName(userName);
    var data = _read(k);
    var today = _today();
    var day = _getDay(data, today);
    var list = day[routine];
    var tpl = _getTemplate(data, routine);
    var idx = list.indexOf(itemId);
    if (idx === -1) {
      var isKnown = tpl.some(function(c) { return c.id === itemId; });
      if (!isKnown) return getStatusFor(userName);
      list.push(itemId);
    } else {
      list.splice(idx, 1);
    }

    _bumpStreak(data, day);
    _write(k, data);
    return getStatusFor(userName);
  }

  return {
    getStatus: getStatus,
    getStatusFor: getStatusFor,
    toggleFor: toggleFor,
    getActiveRoutine: getActiveRoutine,
    labelFor: labelFor,
    toggle: toggle,
    renderHubWidget: renderHubWidget,
    getTemplates: getTemplates,
    setTemplate: setTemplate,
    resetTemplate: resetTemplate,
    isEnabledFor: isEnabledFor,
    ROUTINE_IDS: ROUTINE_IDS,
    LABELS: ROUTINE_LABELS,
    DEFAULTS: DEFAULTS,
    _open: _open,
    _close: _close,
    _toggle: _toggle
  };
})();
