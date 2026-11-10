/* ================================================================
   APP SCHEDULE — Shared Logic
   Manages which apps are visible today based on Smart Schedule.
   ================================================================ */

var AppSchedule = (function() {
  'use strict';

  var ALL_APPS = [
    { id: 'math',    card: '.card-math' },
    // Descubre Chile uses class `card-history` on the hub; the previous
    // .card-chile selector returned null, so the rotation never hid this
    // app on its off-days. Same lesson: keep this list in sync with
    // index.html's class names.
    { id: 'chile',   card: '.card-history' },
    { id: 'chess',   card: '.card-chess' },
    { id: 'piano',   card: '.card-piano' },
    { id: 'guitar',  card: '.card-guitar' },
    { id: 'art',     card: '.card-art' },
    { id: 'lab',     card: '.card-lab' },
    { id: 'world',   card: '.card-world' },
    { id: 'atlas',   card: '.card-atlas' },
    { id: 'story',   card: '.card-story' },
    { id: 'quest',   card: '.card-quest' },
    { id: 'guess',   card: '.card-guess' },
    { id: 'money',   card: '.card-money' },
    { id: 'bmcheck', card: '.card-bmcheck', alwaysVisible: true },
    { id: 'trophy',  card: '.card-trophy',  alwaysVisible: true },
    { id: 'move',    card: '.card-move',    alwaysVisible: true },
    { id: 'bank',    card: '.card-bank',    alwaysVisible: true },
    // Learn-by-doing apps (two days each, matched to the day's theme)
    { id: 'circuit',    card: '.card-circuit' },
    { id: 'engineer',   card: '.card-engineer' },
    { id: 'negocio',    card: '.card-negocio' },
    { id: 'euclid',     card: '.card-euclid' },
    { id: 'cocina',     card: '.card-cocina' },
    { id: 'marinero',   card: '.card-marinero' },
    { id: 'naturaleza', card: '.card-naturaleza' },
    { id: 'secretos',   card: '.card-secretos' },
    { id: 'clock',      card: '.card-clock' },
    { id: 'dictado',    card: '.card-dictado' },
    { id: 'calculo',    card: '.card-calculo' }
  ];
  ALL_APPS.push({ id: 'lector', card: '.card-lector' });
  ALL_APPS.push({ id: 'linea', card: '.card-linea' });
  ALL_APPS.push({ id: 'arbol', card: '.card-arbol' });
  ALL_APPS.push({ id: 'codelab', card: '.card-codelab' });

  var SMART_SCHEDULE = {
    0: ['piano', 'math', 'art', 'world', 'atlas', 'guess',
        'cocina', 'marinero', 'naturaleza'],                           // Sunday
    1: ['piano', 'math', 'chile', 'lab', 'guess', 'money',
        'circuit', 'negocio', 'clock'],                                // Monday
    2: ['piano', 'chess', 'guitar', 'story', 'guess',
        'engineer', 'euclid', 'secretos', 'dictado', 'calculo'],                  // Tuesday
    3: ['piano', 'math', 'art', 'world', 'atlas', 'guess', 'money',
        'marinero', 'clock'],                                          // Wednesday
    4: ['piano', 'math', 'chile', 'lab', 'guess',
        'circuit', 'naturaleza', 'dictado'],                           // Thursday
    5: ['piano', 'chess', 'guitar', 'story', 'guess', 'money',
        'negocio', 'euclid', 'secretos', 'calculo'],                   // Friday
    6: ['piano', 'math', 'art', 'world', 'atlas', 'guess',
        'cocina', 'engineer']                                          // Saturday
  };

  // Lector (reading practice for the youngest) is offered every day.
  Object.keys(SMART_SCHEDULE).forEach(function(d) { SMART_SCHEDULE[d].push('lector'); });
  // Árbol familiar (the family tree) is a Sunday and Wednesday visit.
  [0, 3].forEach(function(d) { SMART_SCHEDULE[d].push('arbol'); });

  // Code Lab (typed coding, age 9 and up) on three days: Tuesday, Thursday and Saturday.
  [2, 4, 6].forEach(function(d) { SMART_SCHEDULE[d].push('codelab'); });

  // Línea del Tiempo (history) rides along with the history and world days.
  [1, 3, 4, 6].forEach(function(d) { SMART_SCHEDULE[d].push('linea'); });

  var OVERRIDE_KEY  = 'zs_schedule_override';
  var MODE_KEY      = 'zs_schedule_mode';

  function getMode() {
    return localStorage.getItem(MODE_KEY) || 'smart';
  }

  function setMode(m) {
    localStorage.setItem(MODE_KEY, m);
  }

  function getOverrides() {
    try {
      return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {};
    } catch(e) { return {}; }
  }

  function saveOverrides(o) {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o));
  }

  function getTodayApps() {
    var day = new Date().getDay(); // 0–6
    var mode = getMode();
    var overrides = getOverrides();

    if (overrides[day]) return overrides[day];
    if (mode === 'all') return ALL_APPS.map(function(a) { return a.id; });
    return SMART_SCHEDULE[day] || [];
  }

  function getScheduleForDay(dayIndex) {
    var overrides = getOverrides();
    if (overrides[dayIndex]) return { mode: 'manual', apps: overrides[dayIndex] };
    return { mode: 'smart', apps: SMART_SCHEDULE[dayIndex] || [] };
  }

  function applyToHub(user) {
    var visibleIds = getTodayApps();
    ALL_APPS.forEach(function(app) {
      var el = document.querySelector(app.card);
      if (!el) return;
      var isVisible = !!app.alwaysVisible || visibleIds.indexOf(app.id) !== -1;
      // Faith follows its own per-kid faithVisible toggle (set elsewhere).
      if (app.id === 'faith' && user && user.faithVisible === false) isVisible = false;
      // Quest is the always-on world map and Sports is the outdoor logger;
      // keep them visible regardless of the rotation.
      if (app.id === 'sports' || app.id === 'quest' || app.id === 'move') isVisible = true;
      el.style.display = isVisible ? 'flex' : 'none';
    });
  }

  function getTodayMessage() {
    var apps = getTodayApps();
    var day = new Date().getDay();
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var THEMES = {
      0: 'Relax & Explore 🌈',
      1: 'Discovery Day 🔬',
      2: 'Strategy & Tales 📚',
      3: 'Creative Arts 🎨',
      4: 'Science & World 🌍',
      5: 'Music & Logic 🎵',
      6: 'Weekend Adventure 🚀'
    };

    var DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    var THEMES_ES = {
      0: 'Relajo y exploración 🌈',
      1: 'Día de descubrimiento 🔬',
      2: 'Estrategia y cuentos 📚',
      3: 'Artes creativas 🎨',
      4: 'Ciencia y mundo 🌍',
      5: 'Música y lógica 🎵',
      6: 'Aventura de fin de semana 🚀'
    };
    var tr = typeof zsT === 'function' ? zsT : function(es, en) { return en; };

    return {
      day: tr(DAYS_ES[day], DAYS[day]),
      theme: tr(THEMES_ES[day], THEMES[day]),
      count: apps.length
    };
  }

  function renderScheduleConfig() {
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var mode = getMode();
    var today = new Date().getDay();

    var html = '<div class="pk-section">' +
      '<h3 style="margin-bottom:12px; font-family:var(--font-display);">📅 Weekly Schedule</h3>' +
      '<div style="display:flex; flex-direction:column; gap:8px;">';

    DAYS.forEach(function(dayName, i) {
      var sched = getScheduleForDay(i);
      var isToday = i === today;
      var appNames = sched.apps.map(function(id) {
        var app = null;
        for(var j=0; j<ALL_APPS.length; j++) { if(ALL_APPS[j].id === id) { app = ALL_APPS[j]; break; } }
        return app ? app.id : id;
      });

      html += '<div onclick="AppSchedule.editDay(' + i + ')" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px; cursor:pointer; border:1.5px solid ' + (isToday ? 'var(--purple)' : 'transparent') + '">' +
        '<div>' +
          '<div style="font-weight:800; font-size:0.85rem;">' + dayName + (isToday ? ' (Today)' : '') + '</div>' +
          '<div style="font-size:0.75rem; color:var(--text-muted);">' + appNames.join(', ') + '</div>' +
        '</div>' +
        '<span style="opacity:0.5;">✏️</span>' +
      '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function editDay(dayIndex) {
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var sched = getScheduleForDay(dayIndex);
    var selected = sched.apps;
    
    // Editable apps (filter out faith/sports/quest as they have special rules)
    var editableApps = ALL_APPS.filter(function(a) { return a.id !== 'faith' && a.id !== 'sports' && a.id !== 'quest' && a.id !== 'move'; });

    var checkboxes = editableApps.map(function(app) {
      var checked = selected.indexOf(app.id) !== -1;
      return '<label style="display:flex; align-items:center; gap:10px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; cursor:pointer;">' +
        '<input type="checkbox" value="' + app.id + '" ' + (checked ? 'checked' : '') + '> ' +
        app.id.charAt(0).toUpperCase() + app.id.slice(1) +
      '</label>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'schedule-day-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = 
      '<div class="dash-panel" style="max-width:400px; width:100%;">' +
        '<h2>Edit ' + DAYS[dayIndex] + '</h2>' +
        '<div id="schedule-day-checkboxes" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:20px 0;">' +
          checkboxes +
        '</div>' +
        '<div style="display:flex; gap:10px;">' +
          '<button class="parent-btn" style="flex:1; background:#333;" onclick="document.getElementById(\'schedule-day-overlay\').remove()">Cancel</button>' +
          '<button class="parent-btn" style="flex:1;" onclick="AppSchedule.saveDay(' + dayIndex + ')">Save Changes</button>' +
        '</div>' +
      '</div>';
    
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }

  function saveDay(dayIndex) {
    var boxes = document.querySelectorAll('#schedule-day-checkboxes input[type="checkbox"]:checked');
    var selected = [];
    for(var i=0; i<boxes.length; i++) { selected.push(boxes[i].value); }
    
    var overrides = getOverrides();
    overrides[dayIndex] = selected;
    saveOverrides(overrides);
    
    var overlay = document.getElementById('schedule-day-overlay');
    if (overlay) overlay.remove();
    
    if (typeof renderParentsCorner === 'function') renderParentsCorner();
  }

  return {
    getTodayApps: getTodayApps,
    getScheduleForDay: getScheduleForDay,
    applyToHub: applyToHub,
    getTodayMessage: getTodayMessage,
    renderScheduleConfig: renderScheduleConfig,
    editDay: editDay,
    saveDay: saveDay
  };
})();
