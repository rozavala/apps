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

  // Default morning/afternoon/night templates, transcribed from the
  // family's paper checklists. Labels are deliberately short — they
  // render as chips in a row per kid on the Family Wall, and long text
  // wraps the grid. Parents edit (and translate) them per kid via the
  // Routines editor in Parents Corner or on the Family Wall; "↻ Default"
  // brings a kid back to this list.
  var DEFAULTS = {
    morning: [
      { id: 'dressed',   label: 'Dressed + shoes 👟' },
      { id: 'breakfast', label: 'Breakfast 🥣' },
      { id: 'bed',       label: 'Make the bed 🛏️' },
      { id: 'tidy_am',   label: 'Tidy the room 🧸' },
      { id: 'backpack',  label: 'Lunchbox + water 🎒', when: 'school' },
      { id: 'wash_am',   label: 'Teeth, face, hair 🦷' },
      { id: 'lotion_am', label: 'Sunscreen 🧴', when: 'sunny' },
      { id: 'ready',     label: 'Ready by 7:45 → mint 🍬', when: 'school' }
    ],
    afternoon: [
      { id: 'hands',      label: 'Wash hands 🧼' },
      { id: 'unpack',     label: 'Unpack backpack 🎒', when: 'school' },
      { id: 'tea',        label: 'Tea time 🫖' },
      { id: 'homework',   label: 'Homework ✏️', only: ['Rodrigo'], when: 'school' },
      { id: 'piano',      label: 'Piano 20 min 🎹', only: ['Pablo'] },
      { id: 'football',   label: 'Football kit ⚽', when: 'football' },
      { id: 'clothes_pm', label: 'Clothes away 👕' },
      { id: 'lotion_pm',  label: 'Sunscreen 🧴', when: 'sunny' }
    ],
    evening: [
      { id: 'dinner',   label: 'Dinner 🍽️' },
      { id: 'table',    label: 'Clear the table 🧽' },
      { id: 'shower',   label: 'Shower 🚿' },
      { id: 'laundry',  label: 'Laundry basket 🧺' },
      { id: 'towel',    label: 'Towel on chair 🪑' },
      { id: 'teeth_pm', label: 'Teeth + floss 🦷' },
      { id: 'cleats',   label: 'Cleats away ⚽', when: 'football' },
      { id: 'tidy_pm',  label: 'Tidy the room 🧸' },
      { id: 'read',     label: 'Read in bed 📖' }
    ]
  };

  // ── Conditional tasks ───────────────────────────────────────────
  // A task shows every day for everybody unless it carries:
  //   when: 'sunny'     → only when the day earns sunscreen
  //   when: 'football'  → only on days that kid has football on the
  //                       family calendar
  //   only: ['Rodrigo'] → only for the kid(s) whose name matches
  // A hidden task is not shown, not tickable, and not counted, so a
  // rainy day's routine is complete without the sunscreen chip.

  var WEATHER_KEY = 'zs_fw_weather';   // written by the Family Wall

  // WHO puts sun protection at UV 3 and up. The temperature is a
  // backstop for a hot day whose UV forecast is missing.
  var UV_SUNSCREEN = 3;
  var TEMP_SUNSCREEN = 24;

  // Calendar events are written the way the family talks ("futbol
  // Rorro"), not the way the profiles are named. Each row lists the
  // names that mean the same kid, so it doesn't matter which one the
  // profile carries or which one the event uses.
  var KID_NAMES = [
    ['rodrigo jr', 'rodrigo', 'rorro'],
    ['emilia', 'pilita'],
    ['pablo'],
    ['ignacio'],
    ['isabel']
  ];

  var FOOTBALL_WORDS = ['futbol', 'football', 'soccer'];

  // Lowercase and strip accents so "Fútbol" matches "futbol".
  function _norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    return s.trim();
  }

  // Everything a calendar event (or an `only` list) might call this
  // kid: the name as written, each word of it, and every other name on
  // the same roster row.
  function _kidTokens(userName) {
    var raw = _norm(userName);
    if (!raw) return [];
    var tokens = [raw];
    raw.split(/\s+/).forEach(function(part) {
      if (part.length >= 3 && tokens.indexOf(part) === -1) tokens.push(part);
    });
    tokens.slice().forEach(function(t) {
      KID_NAMES.forEach(function(row) {
        if (row.indexOf(t) === -1) return;
        row.forEach(function(name) {
          if (tokens.indexOf(name) === -1) tokens.push(name);
        });
      });
    });
    return tokens;
  }

  // Conditions are read once per paint rather than once per kid per
  // task — expanding the calendar is not free. The cache is cleared at
  // the start of every render (refreshConditions), so a forecast or a
  // calendar that lands after the first paint is picked up straight
  // away; the TTL is only a backstop for a page left open all day.
  var _memo = {};

  function refreshConditions() { _memo = {}; }
  function _memoized(key, ttlMs, fn) {
    var now = Date.now();
    var today = _today();
    var hit = _memo[key];
    if (hit && hit.day === today && (now - hit.ts) < ttlMs) return hit.val;
    var val = fn();
    _memo[key] = { day: today, ts: now, val: val };
    return val;
  }

  // ── School calendar ───────────────────────────────────────────
  // Santa Clara Unified, 2026-27 (board approved 11/12/25). Tasks
  // tagged `when: 'school'` only show on days school is actually in
  // session: weekdays, inside the school year, minus every holiday,
  // break and non-student day below.
  //
  // UPDATE ME EACH AUGUST: when the year rolls over, replace these
  // dates from the district calendar at santaclarausd.org/calendar.
  // Until then, every day after `lastDay` counts as "no school",
  // which is right for the summer and wrong from the moment the next
  // year starts.
  var SCHOOL_YEAR = {
    label: 'Santa Clara Unified 2026\u201327',
    firstDay: '2026-08-10',
    lastDay:  '2027-06-04',
    // [from, to] inclusive; a single date may be given on its own.
    off: [
      ['2026-09-07'],                // Labor Day
      ['2026-09-08'],                // Professional development
      ['2026-10-12', '2026-10-13'],  // School not in session
      ['2026-11-11'],                // Veterans Day
      ['2026-11-23', '2026-11-27'],  // Thanksgiving week
      ['2026-12-21', '2027-01-04'],  // Winter break, incl. the Jan 4 PD day
      ['2027-01-18'],                // Martin Luther King Jr. Day
      ['2027-02-15', '2027-02-19'],  // Presidents' week
      ['2027-03-18', '2027-03-19'],  // Professional development
      ['2027-04-12', '2027-04-16'],  // Spring break
      ['2027-05-31']                 // Memorial Day
    ]
  };

  // A one-off day the district calls off (teacher training, a smoke
  // day, an early closure) shows up on the family calendar long before
  // anyone edits the table above, so an event saying so wins.
  var NO_SCHOOL_WORDS = [
    'no school', 'non-student', 'non student', 'school holiday',
    'teacher work day', 'staff development', 'pupil free',
    'sin clases', 'no hay clases',
    'winter break', 'spring break', 'thanksgiving break', 'summer break'
  ];

  function _calendarSaysNoSchool() {
    if (typeof FamilyCalendar === 'undefined' || !FamilyCalendar.getUpcoming) return false;
    var events;
    try { events = FamilyCalendar.getUpcoming(300); } catch (e) { return false; }
    var todayStr = new Date().toDateString();
    return events.some(function(ev) {
      if (!ev || !ev.start || typeof ev.start.toDateString !== 'function') return false;
      if (ev.start.toDateString() !== todayStr) return false;
      var text = _norm(ev.summary);
      return NO_SCHOOL_WORDS.some(function(w) { return text.indexOf(w) !== -1; });
    });
  }

  function _isSchoolDay() {
    return _memoized('school', 60 * 1000, function() {
      var day = new Date().getDay();
      if (day === 0 || day === 6) return false;          // weekend
      var today = _today();                              // YYYY-MM-DD, sorts as text
      if (today < SCHOOL_YEAR.firstDay) return false;    // before the year starts
      if (today > SCHOOL_YEAR.lastDay) return false;     // summer, or a stale table
      var off = SCHOOL_YEAR.off.some(function(range) {
        return today >= range[0] && today <= (range[1] || range[0]);
      });
      if (off) return false;
      return !_calendarSaysNoSchool();
    });
  }

  function _sunnyEnough() {
    return _memoized('sunny', 10 * 60 * 1000, function() {
      var daily = null;
      try {
        var w = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');
        daily = w && w.payload && w.payload.daily;
      } catch (e) { daily = null; }
      if (!daily) return true;   // no forecast — a spare chip beats a burn
      var uv = daily.uv_index_max && daily.uv_index_max[0];
      var maxT = daily.temperature_2m_max && daily.temperature_2m_max[0];
      if (typeof uv !== 'number' && typeof maxT !== 'number') return true;
      if (typeof uv === 'number' && uv >= UV_SUNSCREEN) return true;
      if (typeof maxT === 'number' && maxT >= TEMP_SUNSCREEN) return true;
      return false;
    });
  }

  function _hasFootballToday(userName) {
    var tokens = _kidTokens(userName);
    if (!tokens.length) return false;
    return _memoized('football:' + tokens[0], 60 * 1000, function() {
      if (typeof FamilyCalendar === 'undefined' || !FamilyCalendar.getUpcoming) return false;
      var events;
      try { events = FamilyCalendar.getUpcoming(300); } catch (e) { return false; }
      var todayStr = new Date().toDateString();
      return events.some(function(ev) {
        if (!ev || !ev.start || typeof ev.start.toDateString !== 'function') return false;
        if (ev.start.toDateString() !== todayStr) return false;
        var text = _norm(ev.summary);
        var isFootball = FOOTBALL_WORDS.some(function(w) { return text.indexOf(w) !== -1; });
        if (!isFootball) return false;
        return tokens.some(function(t) { return text.indexOf(t) !== -1; });
      });
    });
  }

  function _taskVisible(item, userName) {
    if (!item) return false;
    if (Array.isArray(item.only) && item.only.length) {
      var tokens = _kidTokens(userName);
      var mine = item.only.some(function(n) {
        return _kidTokens(n).some(function(want) {
          return want && tokens.indexOf(want) !== -1;
        });
      });
      if (!mine) return false;
    }
    if (item.when === 'sunny') return _sunnyEnough();
    if (item.when === 'football') return _hasFootballToday(userName);
    if (item.when === 'school') return _isSchoolDay();
    return true;
  }

  // What a parent sees next to a conditional task in the editor.
  function conditionLabel(item) {
    if (!item) return '';
    var bits = [];
    if (Array.isArray(item.only) && item.only.length) {
      bits.push('👤 ' + item.only.join(', ') + ' only');
    }
    if (item.when === 'sunny') bits.push('🌡 hot or sunny days');
    if (item.when === 'football') bits.push('📅 football days');
    return bits.join(' · ');
  }

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
  var _pushTimers = {};
  function _push(key) {
    if (!key) return;
    if (typeof CloudSync === 'undefined' || !CloudSync.push) return;
    // Debounced: ticking five boxes in a row is one PUT, not five, and
    // each push now costs a read-merge-write round trip on the server.
    if (_pushTimers[key]) clearTimeout(_pushTimers[key]);
    _pushTimers[key] = setTimeout(function() {
      delete _pushTimers[key];
      try { CloudSync.push(key); } catch (e) {}
    }, 600);
  }

  // Per-item mark log: marks[YYYY-MM-DD][routine][itemId] = {done, ts}.
  // The `days` arrays stay the source of truth for every reader; marks
  // exist purely so two devices can be merged item-by-item instead of
  // one whole-object snapshot clobbering the other (sync.js
  // _mergeRoutines). An item with no mark is legacy data and loses to
  // an explicit mark from the other side.
  var MARK_KEEP_DAYS = 30;
  function _setMark(data, dayKey, routine, itemId, done) {
    if (!data.marks) data.marks = {};
    if (!data.marks[dayKey]) data.marks[dayKey] = {};
    if (!data.marks[dayKey][routine]) data.marks[dayKey][routine] = {};
    data.marks[dayKey][routine][itemId] = { done: !!done, ts: Date.now() };
    var days = Object.keys(data.marks);
    if (days.length > MARK_KEEP_DAYS) {
      days.sort();
      days.slice(0, days.length - MARK_KEEP_DAYS).forEach(function(d) {
        delete data.marks[d];
      });
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

  // The tasks actually on show for this kid today, after the weather,
  // the calendar and the per-kid conditions have had their say.
  function _visibleTemplate(data, which, userName) {
    return _getTemplate(data, which).filter(function(it) {
      return _taskVisible(it, userName);
    });
  }

  // Copy, so an editor mutating a label can't reach back into DEFAULTS
  // — a shared object — and change it for every other kid on the page.
  function _copyItem(it) {
    var out = { id: it.id, label: it.label };
    if (it.when) out.when = it.when;
    if (Array.isArray(it.only) && it.only.length) out.only = it.only.slice();
    return out;
  }

  // One routine's slice of the status object: the items with their
  // done flags, plus the counts the progress bars need.
  //
  // Only ticks whose id is still in the template count. Editing a list
  // part-way through the day (or copying one kid's list to everyone)
  // strands the ids of tasks that are gone; counting those would show
  // "5 / 3" and hand out a streak nobody earned.
  function _block(data, day, which, userName) {
    var tpl = _visibleTemplate(data, which, userName);
    var ticked = day[which] || [];
    var doneCount = 0;
    var items = tpl.map(function(c) {
      var done = ticked.indexOf(c.id) !== -1;
      if (done) doneCount++;
      return { id: c.id, label: c.label, done: done };
    });
    return {
      items: items,
      doneCount: doneCount,
      total: tpl.length,
      complete: doneCount >= tpl.length
    };
  }

  // A day counts for the streak once every routine is fully ticked.
  function _allComplete(data, day, userName) {
    return ROUTINE_IDS.every(function(which) {
      return _block(data, day, which, userName).complete;
    });
  }

  function _bumpStreak(data, day, userName) {
    var today = _today();
    if (!_allComplete(data, day, userName) || data.lastFullDay === today) return false;
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
      status[which] = _block(data, day, which, userName);
    });
    return status;
  }

  function getTemplates(userName) {
    // Used by the Parents Corner editor and the Family Wall editor.
    var data = userName ? _read(_keyForName(userName)) : (_load() || {});
    var out = {};
    ROUTINE_IDS.forEach(function(which) {
      out[which] = _getTemplate(data, which).map(_copyItem);
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
      var out = {
        id: it && it.id ? String(it.id) : 'custom_' + i + '_' + Date.now().toString(36),
        label: String(it && it.label ? it.label : '').slice(0, 80)
      };
      // Keep "sunny days only" / "Pablo only" through a label edit.
      if (it && it.when) out.when = String(it.when);
      if (it && Array.isArray(it.only) && it.only.length) out.only = it.only.map(String);
      return out;
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
    var active = (typeof getActiveUser === 'function') ? getActiveUser() : null;
    return _statusFrom(data, active && active.name);
  }

  function toggle(routine, itemId) {
    if (!_isRoutine(routine)) return getStatus();
    var data = _load();
    if (!data) return null;
    var today = _today();
    var day = _getDay(data, today);
    var active = (typeof getActiveUser === 'function') ? getActiveUser() : null;
    var activeName = active && active.name;
    var list = day[routine];
    var idx = list.indexOf(itemId);
    var tpl = _visibleTemplate(data, routine, activeName);
    if (idx === -1) {
      // Don't add ids that aren't on show today (defence).
      var isKnown = tpl.some(function(c) { return c.id === itemId; });
      if (!isKnown) return getStatus();
      list.push(itemId);
      _setMark(data, today, routine, itemId, true);
    } else {
      list.splice(idx, 1);
      _setMark(data, today, routine, itemId, false);
    }

    // Update the streak when EVERY routine hits 100% for the day.
    if (_bumpStreak(data, day, activeName)) {
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
    refreshConditions();
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
    var tpl = _visibleTemplate(data, routine, userName);
    var idx = list.indexOf(itemId);
    if (idx === -1) {
      var isKnown = tpl.some(function(c) { return c.id === itemId; });
      if (!isKnown) return getStatusFor(userName);
      list.push(itemId);
      _setMark(data, today, routine, itemId, true);
    } else {
      list.splice(idx, 1);
      _setMark(data, today, routine, itemId, false);
    }

    _bumpStreak(data, day, userName);
    _write(k, data);
    return getStatusFor(userName);
  }

  return {
    getStatus: getStatus,
    getStatusFor: getStatusFor,
    toggleFor: toggleFor,
    getActiveRoutine: getActiveRoutine,
    labelFor: labelFor,
    conditionLabel: conditionLabel,
    refreshConditions: refreshConditions,
    toggle: toggle,
    renderHubWidget: renderHubWidget,
    getTemplates: getTemplates,
    setTemplate: setTemplate,
    resetTemplate: resetTemplate,
    isEnabledFor: isEnabledFor,
    ROUTINE_IDS: ROUTINE_IDS,
    LABELS: ROUTINE_LABELS,
    DEFAULTS: DEFAULTS,
    SCHOOL_YEAR: SCHOOL_YEAR,
    isSchoolDay: _isSchoolDay,
    _open: _open,
    _close: _close,
    _toggle: _toggle
  };
})();
