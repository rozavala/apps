/* ================================================================
   DAILY ROUTINES — routines.js
   Morning + evening self-report checklists that live on the hub.
   Separate from the existing Chores/Token system by design: this is
   about building habit (streak) not earning screen-time.

   Storage key: zs_routines_<userkey>
   Shape:
     {
       days: { "YYYY-MM-DD": { morning: ["bed","teeth"], evening: [...] } },
       streak: 3,
       bestStreak: 9,
       lastFullDay: "YYYY-MM-DD"
     }

   Default routines are intentional minimums. Parents can edit later
   (v2 adds a Parents Corner editor; for now DEFAULTS ship in-code).
   ================================================================ */

var Routines = (function() {
  'use strict';

  var STORAGE_PREFIX = 'zs_routines_';

  // Default morning/evening templates. Kid-authored text only.
  var DEFAULTS = {
    morning: [
      { id: 'bed',       label: 'Hacer la cama 🛏️' },
      { id: 'teeth',     label: 'Cepillarse los dientes 🦷' },
      { id: 'dressed',   label: 'Vestirse 👕' },
      { id: 'breakfast', label: 'Desayunar 🥣' },
      { id: 'backpack',  label: 'Preparar la mochila 🎒' }
    ],
    evening: [
      { id: 'homework',  label: 'Tarea del cole ✏️' },
      { id: 'tidy',      label: 'Ordenar el cuarto 🧸' },
      { id: 'laundry',   label: 'Guardar la ropa 🧦' },
      { id: 'teeth_pm',  label: 'Cepillarse los dientes 🦷' },
      { id: 'read',      label: 'Leer un rato 📖' }
    ]
  };

  function _userKey() {
    if (typeof getActiveUser !== 'function') return null;
    var u = getActiveUser();
    if (!u) return null;
    return u.name.toLowerCase().replace(/\s+/g, '_');
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

  function _load() {
    var k = _storageKey();
    if (!k) return null;
    try {
      var raw = localStorage.getItem(k);
      var data = raw ? JSON.parse(raw) : {};
      if (!data.days) data.days = {};
      if (typeof data.streak !== 'number') data.streak = 0;
      if (typeof data.bestStreak !== 'number') data.bestStreak = 0;
      return data;
    } catch (e) { return { days: {}, streak: 0, bestStreak: 0 }; }
  }

  function _save(data) {
    var k = _storageKey();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
  }

  function _getDay(data, dayKey) {
    if (!data.days[dayKey]) data.days[dayKey] = { morning: [], evening: [] };
    var day = data.days[dayKey];
    if (!Array.isArray(day.morning)) day.morning = [];
    if (!Array.isArray(day.evening)) day.evening = [];
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
    return DEFAULTS[which];
  }

  function getTemplates(userName) {
    // Used by the Parents Corner editor.
    var data;
    if (userName) {
      var k = STORAGE_PREFIX + userName.toLowerCase().replace(/\s+/g, '_');
      try { data = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { data = {}; }
    } else {
      data = _load() || {};
    }
    return {
      morning: _getTemplate(data, 'morning').slice(),
      evening: _getTemplate(data, 'evening').slice()
    };
  }

  function setTemplate(which, items, userName) {
    if (which !== 'morning' && which !== 'evening') return;
    var k = userName
      ? STORAGE_PREFIX + userName.toLowerCase().replace(/\s+/g, '_')
      : _storageKey();
    if (!k) return;
    var data;
    try { data = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { data = {}; }
    if (!data.templates) data.templates = {};
    data.templates[which] = items.map(function(it, i) {
      return {
        id: it && it.id ? String(it.id) : 'custom_' + i + '_' + Date.now().toString(36),
        label: String(it && it.label ? it.label : '').slice(0, 80)
      };
    }).filter(function(it) { return it.label.length > 0; });
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
  }

  function resetTemplate(which, userName) {
    var k = userName
      ? STORAGE_PREFIX + userName.toLowerCase().replace(/\s+/g, '_')
      : _storageKey();
    if (!k) return;
    var data;
    try { data = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { data = {}; }
    if (data.templates) delete data.templates[which];
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
  }

  function getStatus() {
    var data = _load();
    if (!data) return null;
    var today = _today();
    var day = _getDay(data, today);
    var morningTpl = _getTemplate(data, 'morning');
    var eveningTpl = _getTemplate(data, 'evening');
    return {
      date: today,
      streak: data.streak,
      bestStreak: data.bestStreak,
      morning: {
        items: morningTpl.map(function(c) {
          return { id: c.id, label: c.label, done: day.morning.indexOf(c.id) !== -1 };
        }),
        doneCount: day.morning.length,
        total: morningTpl.length,
        complete: day.morning.length >= morningTpl.length
      },
      evening: {
        items: eveningTpl.map(function(c) {
          return { id: c.id, label: c.label, done: day.evening.indexOf(c.id) !== -1 };
        }),
        doneCount: day.evening.length,
        total: eveningTpl.length,
        complete: day.evening.length >= eveningTpl.length
      }
    };
  }

  function toggle(routine, itemId) {
    if (routine !== 'morning' && routine !== 'evening') return getStatus();
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

    // Update streak when BOTH routines hit 100% for the day.
    var morningTpl = _getTemplate(data, 'morning');
    var eveningTpl = _getTemplate(data, 'evening');
    var bothDone = day.morning.length >= morningTpl.length &&
                   day.evening.length >= eveningTpl.length;
    if (bothDone && data.lastFullDay !== today) {
      if (data.lastFullDay === _yesterday()) {
        data.streak = (data.streak || 0) + 1;
      } else {
        data.streak = 1;
      }
      data.lastFullDay = today;
      if (data.streak > data.bestStreak) data.bestStreak = data.streak;
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Routines', '✅', 'Day complete (streak ' + data.streak + ')');
      }
    }
    _save(data);
    return getStatus();
  }

  // Which routine is currently "relevant" based on local time.
  // Before 14:00 → morning, after → evening.
  function getActiveRoutine() {
    var hour = new Date().getHours();
    return hour < 14 ? 'morning' : 'evening';
  }

  // ── Hub widget ──
  function renderHubWidget(containerId) {
    var el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!el) return;
    var status = getStatus();
    if (!status) { el.innerHTML = ''; return; }

    var which = getActiveRoutine();
    var block = which === 'morning' ? status.morning : status.evening;
    var heading = which === 'morning' ? '🌅 Buenos días' : '🌙 Buenas noches';

    if (block.complete) {
      el.innerHTML =
        '<div class="rn-card rn-done" onclick="Routines._open(\'' + which + '\')">' +
          '<div class="rn-emoji">🎉</div>' +
          '<div class="rn-body">' +
            '<div class="rn-title">' + heading + ' — ¡listo!</div>' +
            '<div class="rn-sub">Racha: 🔥 ' + status.streak + ' día' + (status.streak === 1 ? '' : 's') + '</div>' +
          '</div>' +
          '<div class="rn-arrow">→</div>' +
        '</div>';
      return;
    }

    var remaining = block.total - block.doneCount;
    el.innerHTML =
      '<div class="rn-card" onclick="Routines._open(\'' + which + '\')">' +
        '<div class="rn-emoji">' + (which === 'morning' ? '🌅' : '🌙') + '</div>' +
        '<div class="rn-body">' +
          '<div class="rn-title">' + heading + '</div>' +
          '<div class="rn-sub">' + remaining + ' cosa' + (remaining === 1 ? '' : 's') + ' por hacer' +
          (status.streak > 0 ? ' · 🔥 ' + status.streak : '') + '</div>' +
          '<div class="rn-bar"><div class="rn-bar-fill" style="width:' + Math.round((block.doneCount / block.total) * 100) + '%"></div></div>' +
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
          '<button class="dash-close" onclick="Routines._close()" aria-label="Cerrar">✕</button>' +
        '</h2>' +
        '<div id="routines-body"></div>' +
      '</div>';
    document.body.appendChild(ov);
  }

  function _open(which) {
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
    var block = which === 'morning' ? status.morning : status.evening;
    var title = which === 'morning' ? '🌅 Rutina de la mañana' : '🌙 Rutina de la noche';
    var other = which === 'morning' ? 'evening' : 'morning';
    var otherLabel = which === 'morning' ? '🌙 Noche' : '🌅 Mañana';

    var titleEl = document.getElementById('routines-title');
    if (titleEl) titleEl.textContent = title;

    var body = document.getElementById('routines-body');
    if (!body) return;

    var progressPct = Math.round((block.doneCount / block.total) * 100);
    var streakLine = status.streak > 0
      ? '<div class="rn-streak">🔥 Racha de ' + status.streak + ' día' + (status.streak === 1 ? '' : 's') +
        (status.bestStreak > status.streak ? ' · Mejor: ' + status.bestStreak : '') + '</div>'
      : '<div class="rn-streak rn-streak-empty">Completa ambas rutinas para empezar una racha</div>';

    var itemsHtml = block.items.map(function(it) {
      return '<label class="rn-item ' + (it.done ? 'rn-done-item' : '') + '">' +
        '<input type="checkbox" ' + (it.done ? 'checked' : '') + ' ' +
               'onchange="Routines._toggle(\'' + which + '\', \'' + it.id + '\')">' +
        '<span class="rn-item-label">' + it.label + '</span>' +
      '</label>';
    }).join('');

    body.innerHTML =
      streakLine +
      '<div class="rn-progress">' +
        '<div class="rn-progress-text">' + block.doneCount + ' / ' + block.total + '</div>' +
        '<div class="rn-progress-bar"><div class="rn-progress-fill" style="width:' + progressPct + '%"></div></div>' +
      '</div>' +
      '<div class="rn-list">' + itemsHtml + '</div>' +
      '<div class="rn-switch">' +
        '<button class="hub-action-btn secondary" onclick="Routines._open(\'' + other + '\')">' +
          'Ver ' + otherLabel +
        '</button>' +
      '</div>';
  }

  function _toggle(which, id) {
    toggle(which, id);
    _renderModal(which);
    renderHubWidget('routines-widget');
  }

  return {
    getStatus: getStatus,
    getActiveRoutine: getActiveRoutine,
    toggle: toggle,
    renderHubWidget: renderHubWidget,
    getTemplates: getTemplates,
    setTemplate: setTemplate,
    resetTemplate: resetTemplate,
    DEFAULTS: DEFAULTS,
    _open: _open,
    _close: _close,
    _toggle: _toggle
  };
})();
