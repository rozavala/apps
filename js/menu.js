/* ================================================================
   WEEKLY MENU PLANNER — menu.js
   Parent-editable 7-day × 3-meal grid (breakfast / lunch / dinner).
   Kid view (read-only) appears until parent unlocks with PIN.
   Data is per-week, keyed by the Monday anchor (YYYY-MM-DD).

   Storage: zs_menu
     {
       weeks: {
         "2026-04-20": { mon: { breakfast, lunch, dinner }, tue: {...}, ... },
         ...
       }
     }

   Tonight's dinner also shows as a small card on the hub (separate PR
   would wire this; for now standalone page is enough).
   ================================================================ */

var WeeklyMenu = (function() {
  'use strict';

  var STORAGE_KEY = 'zs_menu';
  var DAYS = [
    { id: 'mon', name: 'Lunes' },
    { id: 'tue', name: 'Martes' },
    { id: 'wed', name: 'Miércoles' },
    { id: 'thu', name: 'Jueves' },
    { id: 'fri', name: 'Viernes' },
    { id: 'sat', name: 'Sábado' },
    { id: 'sun', name: 'Domingo' }
  ];
  var MEALS = [
    { id: 'breakfast', label: '🥣 Desayuno' },
    { id: 'lunch',     label: '🍽 Almuerzo' },
    { id: 'dinner',    label: '🌙 Cena' }
  ];

  var _parentUnlocked = false;
  var _weekAnchor = null; // 'YYYY-MM-DD' (Monday)

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _iso(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function _mondayOf(d) {
    var day = d.getDay(); // 0=Sun, 1=Mon
    var off = day === 0 ? -6 : 1 - day;
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + off);
    m.setHours(0, 0, 0, 0);
    return m;
  }

  function _addDays(d, n) {
    var r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  function _todayIso() { return _iso(new Date()); }
  function _todayDayId() {
    var d = new Date();
    var map = ['sun','mon','tue','wed','thu','fri','sat'];
    return map[d.getDay()];
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var d = raw ? JSON.parse(raw) : {};
      if (!d.weeks) d.weeks = {};
      return d;
    } catch (e) { return { weeks: {} }; }
  }

  function _save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(STORAGE_KEY);
    } catch (e) {}
  }

  function _getWeek(data, anchorIso) {
    if (!data.weeks[anchorIso]) {
      data.weeks[anchorIso] = {};
    }
    var w = data.weeks[anchorIso];
    DAYS.forEach(function(day) {
      if (!w[day.id]) w[day.id] = { breakfast: '', lunch: '', dinner: '' };
      MEALS.forEach(function(m) {
        if (typeof w[day.id][m.id] !== 'string') w[day.id][m.id] = '';
      });
    });
    return w;
  }

  // ── Public actions ──
  function unlockParent() {
    if (typeof requestPinThen === 'function') {
      requestPinThen(function() { _parentUnlocked = true; _render(); });
    } else {
      _parentUnlocked = true; _render();
    }
  }

  function shiftWeek(delta) {
    var base = new Date(_weekAnchor + 'T00:00:00');
    var newAnchor = _addDays(base, delta * 7);
    _weekAnchor = _iso(newAnchor);
    _render();
  }

  function thisWeek() {
    _weekAnchor = _iso(_mondayOf(new Date()));
    _render();
  }

  function copyLastWeek() {
    if (!_parentUnlocked) return;
    var data = _load();
    var base = new Date(_weekAnchor + 'T00:00:00');
    var prevAnchor = _iso(_addDays(base, -7));
    var prev = data.weeks[prevAnchor];
    if (!prev) { alert('No hay menú de la semana anterior.'); return; }
    if (!confirm('¿Copiar el menú de la semana anterior a esta semana? Reemplaza lo que haya ahora.')) return;
    data.weeks[_weekAnchor] = JSON.parse(JSON.stringify(prev));
    _save(data);
    _render();
  }

  function setMeal(dayId, mealId, value) {
    if (!_parentUnlocked) return;
    var data = _load();
    var week = _getWeek(data, _weekAnchor);
    if (!week[dayId]) week[dayId] = { breakfast: '', lunch: '', dinner: '' };
    week[dayId][mealId] = String(value).slice(0, 80);
    _save(data);
    // No full re-render on every keystroke; only re-render the today
    // card when the edit is for today's date to keep it in sync.
    if (dayId === _todayDayId()) _renderTodayCard();
  }

  function clearWeek() {
    if (!_parentUnlocked) return;
    if (!confirm('¿Borrar todo el menú de esta semana?')) return;
    var data = _load();
    delete data.weeks[_weekAnchor];
    _save(data);
    _render();
  }

  function shareOrPrint() {
    var data = _load();
    var week = _getWeek(data, _weekAnchor);
    var lines = ['📅 Menú · Semana del ' + _fmtRange(_weekAnchor), ''];
    DAYS.forEach(function(day, i) {
      var d = _addDays(new Date(_weekAnchor + 'T00:00:00'), i);
      lines.push('— ' + day.name + ' ' + d.getDate() + '/' + (d.getMonth() + 1) + ' —');
      MEALS.forEach(function(m) {
        var v = week[day.id][m.id] || '—';
        lines.push('  ' + m.label + ': ' + v);
      });
      lines.push('');
    });
    var text = lines.join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Menú semanal', text: text }).catch(function() {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        alert('Menú copiado al portapapeles.');
      });
      return;
    }
    // Open a modal with the text selected for copy
    _showShareModal(text);
  }

  function printWeek() { window.print(); }

  function _showShareModal(text) {
    var mod = document.getElementById('mn-modal');
    if (!mod) {
      mod = document.createElement('div');
      mod.id = 'mn-modal';
      mod.className = 'mn-modal';
      mod.innerHTML =
        '<div class="mn-modal-panel">' +
          '<h3>📤 Compartir menú</h3>' +
          '<textarea id="mn-modal-text" readonly></textarea>' +
          '<div class="mn-modal-actions">' +
            '<button class="mn-btn-secondary" onclick="WeeklyMenu._closeModal()">Cerrar</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(mod);
    }
    var ta = document.getElementById('mn-modal-text');
    if (ta) { ta.value = text; setTimeout(function() { ta.select(); }, 50); }
    mod.classList.add('active');
  }

  function _closeModal() {
    var mod = document.getElementById('mn-modal');
    if (mod) mod.classList.remove('active');
  }

  // ── Rendering ──
  function _fmtRange(anchorIso) {
    var m = new Date(anchorIso + 'T00:00:00');
    var end = _addDays(m, 6);
    var months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return m.getDate() + ' ' + months[m.getMonth()] + ' – ' + end.getDate() + ' ' + months[end.getMonth()];
  }

  function _render() {
    var wrap = document.getElementById('mn-wrap');
    if (!wrap) return;
    if (!_weekAnchor) _weekAnchor = _iso(_mondayOf(new Date()));

    var data = _load();
    var week = _getWeek(data, _weekAnchor);
    var todayDay = _todayDayId();
    var todayInThisWeek = _iso(_mondayOf(new Date())) === _weekAnchor;

    // Toolbar
    var lockTxt = _parentUnlocked ? '🔓 Editando' : '🔒 Desbloquear para editar';
    var tools =
      '<div class="mn-toolbar no-print">' +
        '<button onclick="WeeklyMenu.shiftWeek(-1)">◀</button>' +
        '<button onclick="WeeklyMenu.thisWeek()">Esta semana</button>' +
        '<button onclick="WeeklyMenu.shiftWeek(1)">▶</button>' +
        '<button class="mn-tb-lock" onclick="WeeklyMenu.unlockParent()">' + lockTxt + '</button>' +
        (_parentUnlocked ? '<button onclick="WeeklyMenu.copyLastWeek()">📋 Copiar semana anterior</button>' : '') +
        (_parentUnlocked ? '<button onclick="WeeklyMenu.clearWeek()">🗑 Limpiar</button>' : '') +
        '<button onclick="WeeklyMenu.shareOrPrint()">📤 Compartir</button>' +
        '<button onclick="WeeklyMenu.printWeek()">🖨 Imprimir</button>' +
      '</div>';

    // Today card
    var todayHtml = '';
    if (todayInThisWeek) {
      var t = week[todayDay];
      var todayMeal = t.dinner || t.lunch || t.breakfast;
      todayHtml =
        '<div class="mn-today">' +
          '<div class="mn-today-label">Hoy · ' + (DAYS.filter(function(d){return d.id===todayDay;})[0] || {name:''}).name + '</div>' +
          (t.dinner
            ? '<div class="mn-today-meal">🌙 ' + _esc(t.dinner) + '</div>'
            : '<div class="mn-today-meal empty">Sin cena planificada</div>') +
          (t.lunch
            ? '<div class="mn-today-sub">🍽 ' + _esc(t.lunch) + '</div>'
            : '') +
        '</div>';
    }

    // Week grid
    var days = DAYS.map(function(day, i) {
      var date = _addDays(new Date(_weekAnchor + 'T00:00:00'), i);
      var isToday = todayInThisWeek && day.id === todayDay;
      var meals = MEALS.map(function(m) {
        var v = week[day.id][m.id] || '';
        var roCls = _parentUnlocked ? '' : ' read-only';
        return '<div class="mn-meal' + roCls + '">' +
          '<span class="mn-meal-label">' + m.label + '</span>' +
          '<input type="text" maxlength="80" placeholder="—" value="' + _esc(v) + '" ' +
                 (_parentUnlocked ? '' : 'disabled ') +
                 'onchange="WeeklyMenu.setMeal(\'' + day.id + '\', \'' + m.id + '\', this.value)">' +
        '</div>';
      }).join('');
      return '<div class="mn-day' + (isToday ? ' today' : '') + '">' +
        '<div class="mn-day-head">' +
          '<span class="mn-day-name">' + day.name + '</span>' +
          '<span class="mn-day-date">' + date.getDate() + '/' + (date.getMonth() + 1) + '</span>' +
        '</div>' +
        '<div class="mn-meals">' + meals + '</div>' +
      '</div>';
    }).join('');

    wrap.innerHTML =
      '<div class="mn-header">' +
        '<span class="mn-icon">🍽️</span>' +
        '<h1>Menú Semanal</h1>' +
        '<p>Semana del ' + _fmtRange(_weekAnchor) + '</p>' +
      '</div>' +
      tools +
      todayHtml +
      '<div class="mn-week">' + days + '</div>';
  }

  function _renderTodayCard() {
    // Fast path used while parent types: refresh only the today banner
    // so the hero stays in sync without losing input focus in the grid.
    var wrap = document.getElementById('mn-wrap');
    if (!wrap) return;
    var data = _load();
    var week = _getWeek(data, _weekAnchor);
    var todayInThisWeek = _iso(_mondayOf(new Date())) === _weekAnchor;
    if (!todayInThisWeek) return;
    var todayDay = _todayDayId();
    var t = week[todayDay];
    var existing = wrap.querySelector('.mn-today');
    if (!existing) return;
    existing.innerHTML =
      '<div class="mn-today-label">Hoy · ' + (DAYS.filter(function(d){return d.id===todayDay;})[0] || {name:''}).name + '</div>' +
      (t.dinner
        ? '<div class="mn-today-meal">🌙 ' + _esc(t.dinner) + '</div>'
        : '<div class="mn-today-meal empty">Sin cena planificada</div>') +
      (t.lunch
        ? '<div class="mn-today-sub">🍽 ' + _esc(t.lunch) + '</div>'
        : '');
  }

  // ── Init ──
  function init() {
    _parentUnlocked = false;
    _weekAnchor = _iso(_mondayOf(new Date()));
    _render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    unlockParent: unlockParent,
    shiftWeek: shiftWeek,
    thisWeek: thisWeek,
    copyLastWeek: copyLastWeek,
    setMeal: setMeal,
    clearWeek: clearWeek,
    shareOrPrint: shareOrPrint,
    printWeek: printWeek,
    _closeModal: _closeModal
  };
})();
