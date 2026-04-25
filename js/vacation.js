/* ================================================================
   VACATION PLANNER — vacation.js
   Family-shared trip planner: countdown, packing list, itinerary,
   and one-tap jumps to relevant learning apps for the destination.

   Storage key: zs_vacation
     {
       trips: [
         { id, name, destination, country, icon,
           startDate, endDate, notes,
           packing: { shared: [...], <profileName>: [...] },
                       // each item: { id, label, packed: bool }
           itinerary: { "YYYY-MM-DD": "Activities text…" }
         },
         ...
       ]
     }

   Uses parent PIN to unlock editing (reuses requestPinThen).
   Read-only browsing by default.
   ================================================================ */

var Vacation = (function() {
  'use strict';

  var STORAGE_KEY = 'zs_vacation';
  var _parentUnlocked = false;
  var _viewing = null;  // currently-open trip id, or null
  var _mode = 'list';   // 'list' | 'detail' | 'edit' | 'new'

  // Default packing categories per kid + shared family items.
  var DEFAULT_PACKING = {
    shared: [
      'Suitcase', 'Passports', 'Tickets',
      'First-aid kit', 'Sunscreen'
    ],
    perKid: [
      'Underwear', 'Socks', 'T-shirts',
      'Pants/shorts', 'Pyjamas', 'Toothbrush',
      'Hairbrush', 'Favourite stuffed animal'
    ]
  };

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var d = raw ? JSON.parse(raw) : {};
      if (!Array.isArray(d.trips)) d.trips = [];
      return d;
    } catch (e) { return { trips: [] }; }
  }

  function _save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) {}
  }

  function _uid() {
    return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5);
  }

  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _daysBetween(from, to) {
    var a = new Date(from + 'T00:00:00');
    var b = new Date(to + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function _countdown(trip) {
    if (!trip.startDate) return null;
    var today = _today();
    var d = _daysBetween(today, trip.startDate);
    if (d > 0) return { kind: 'upcoming', text: d + ' day' + (d === 1 ? '' : 's') + ' to ' + trip.name };
    if (d === 0) return { kind: 'now', text: 'Starts today!' };
    if (trip.endDate) {
      var e = _daysBetween(today, trip.endDate);
      if (e >= 0) return { kind: 'now', text: 'Day ' + Math.abs(d) + ' of trip' };
    }
    return { kind: 'past', text: 'Past trip' };
  }

  function _isUpcomingOrCurrent(trip) {
    if (!trip.endDate) return _daysBetween(_today(), trip.startDate || _today()) >= 0;
    return _daysBetween(_today(), trip.endDate) >= 0;
  }

  // ── Public actions ──
  function unlockParent() {
    if (typeof requestPinThen === 'function') {
      requestPinThen(function() { _parentUnlocked = true; _render(); });
    } else {
      _parentUnlocked = true; _render();
    }
  }

  function newTrip() {
    if (!_parentUnlocked) { unlockParent(); return; }
    _mode = 'new';
    _viewing = null;
    _render();
  }

  function openTrip(id) {
    _viewing = id;
    _mode = 'detail';
    _render();
  }

  function backToList() {
    _viewing = null;
    _mode = 'list';
    _render();
  }

  function deleteTrip(id) {
    if (!_parentUnlocked) return;
    if (!confirm('Delete this trip and all its data?')) return;
    var data = _load();
    data.trips = data.trips.filter(function(t) { return t.id !== id; });
    _save(data);
    _viewing = null;
    _mode = 'list';
    _render();
  }

  function saveNewTrip() {
    if (!_parentUnlocked) return;
    var name = document.getElementById('vc-new-name').value.trim();
    var dest = document.getElementById('vc-new-dest').value.trim();
    var country = document.getElementById('vc-new-country').value.trim();
    var start = document.getElementById('vc-new-start').value;
    var end = document.getElementById('vc-new-end').value;
    var icon = document.getElementById('vc-new-icon').value.trim() || '✈️';

    if (!name || !start) {
      alert('Pick a trip name and a start date.');
      return;
    }
    var data = _load();
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    var packing = {
      shared: DEFAULT_PACKING.shared.map(function(label, i) {
        return { id: 'p_s_' + i, label: label, packed: false };
      })
    };
    profiles.forEach(function(p) {
      packing[p.name] = DEFAULT_PACKING.perKid.map(function(label, i) {
        return { id: 'p_' + p.name + '_' + i, label: label, packed: false };
      });
    });

    data.trips.push({
      id: _uid(),
      name: name,
      destination: dest,
      country: country,
      icon: icon,
      startDate: start,
      endDate: end || start,
      notes: '',
      packing: packing,
      itinerary: {}
    });
    _save(data);
    _mode = 'list';
    _render();
  }

  function togglePackItem(tripId, key, itemId) {
    if (!_parentUnlocked) return;
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === tripId; });
    if (!trip || !trip.packing[key]) return;
    var item = trip.packing[key].find(function(it) { return it.id === itemId; });
    if (!item) return;
    item.packed = !item.packed;
    _save(data);
    _render();
  }

  function addPackItem(tripId, key) {
    if (!_parentUnlocked) return;
    var inp = document.getElementById('vc-add-' + key);
    if (!inp) return;
    var label = inp.value.trim();
    if (!label) return;
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === tripId; });
    if (!trip) return;
    if (!trip.packing[key]) trip.packing[key] = [];
    trip.packing[key].push({ id: 'pi_' + Date.now().toString(36), label: label, packed: false });
    _save(data);
    inp.value = '';
    _render();
  }

  function removePackItem(tripId, key, itemId) {
    if (!_parentUnlocked) return;
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === tripId; });
    if (!trip || !trip.packing[key]) return;
    trip.packing[key] = trip.packing[key].filter(function(it) { return it.id !== itemId; });
    _save(data);
    _render();
  }

  function setItinerary(tripId, dayKey, value) {
    if (!_parentUnlocked) return;
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === tripId; });
    if (!trip) return;
    if (!trip.itinerary) trip.itinerary = {};
    trip.itinerary[dayKey] = String(value).slice(0, 500);
    _save(data);
    // No re-render — preserve textarea focus/cursor while typing.
  }

  // Suggested learning-app jumps based on country.
  // Currently: only Chile gets a Descubre Chile shortcut. Easy to
  // extend per destination later.
  function _learningLinks(trip) {
    var links = [];
    var country = String(trip.country || '').toLowerCase();
    if (country === 'chile') {
      links.push({ href: 'descubre-chile.html', label: '🇨🇱 Descubre Chile', sub: 'Learn about Chilean regions and culture' });
    }
    // World Explorer always offered as a generic geography jump.
    if (country) {
      links.push({ href: 'world-explorer.html', label: '🌍 World Explorer', sub: 'Find ' + trip.country + ' on the map' });
    }
    return links;
  }

  // ── Rendering ──
  function _render() {
    var wrap = document.getElementById('vc-wrap');
    if (!wrap) return;

    if (_mode === 'new') return _renderNewForm(wrap);
    if (_mode === 'detail' && _viewing) return _renderDetail(wrap);
    return _renderList(wrap);
  }

  function _renderList(wrap) {
    var data = _load();
    var trips = data.trips.slice();
    // Sort: upcoming/current first by start date, then past
    trips.sort(function(a, b) {
      var aPast = !_isUpcomingOrCurrent(a);
      var bPast = !_isUpcomingOrCurrent(b);
      if (aPast !== bPast) return aPast ? 1 : -1;
      return String(a.startDate || '').localeCompare(String(b.startDate || ''));
    });

    var lockTxt = _parentUnlocked ? '🔓 Editing' : '🔒 Unlock to edit';
    wrap.innerHTML =
      '<div class="vc-header">' +
        '<span class="vc-icon">✈️</span>' +
        '<h1>Vacation Planner</h1>' +
        '<p>Countdowns, packing lists, and day-by-day plans for upcoming trips.</p>' +
      '</div>' +
      '<div class="vc-toolbar">' +
        (_parentUnlocked
          ? '<button class="vc-tb-primary" onclick="Vacation.newTrip()">＋ New trip</button>'
          : '<button onclick="Vacation.unlockParent()">' + lockTxt + '</button>') +
      '</div>' +
      (trips.length === 0
        ? '<div class="vc-empty">No trips yet. Tap "Unlock to edit" then "New trip" to add one.</div>'
        : '<div class="vc-trips">' + trips.map(_tripCardHtml).join('') + '</div>');
  }

  function _tripCardHtml(trip) {
    var cd = _countdown(trip);
    var cls = cd ? cd.kind : 'upcoming';
    return '<div class="vc-trip ' + cls + '" onclick="Vacation.openTrip(\'' + trip.id + '\')">' +
      '<div class="vc-trip-head">' +
        '<span class="vc-trip-icon">' + _esc(trip.icon || '✈️') + '</span>' +
        '<span class="vc-trip-name">' + _esc(trip.name) + '</span>' +
      '</div>' +
      '<div class="vc-trip-dest">' + _esc(trip.destination || '') +
        (trip.country ? ' · ' + _esc(trip.country) : '') + '</div>' +
      (cd ? '<div class="vc-countdown ' + cd.kind + '">' + _esc(cd.text) + '</div>' : '') +
    '</div>';
  }

  function _renderNewForm(wrap) {
    wrap.innerHTML =
      '<div class="vc-header">' +
        '<span class="vc-icon">✈️</span>' +
        '<h1>New trip</h1>' +
      '</div>' +
      '<div class="vc-detail">' +
        '<div class="vc-form">' +
          '<div class="vc-field"><label>Name</label><input type="text" id="vc-new-name" placeholder="e.g. Patagonia summer" maxlength="40"></div>' +
          '<div class="vc-field"><label>Destination</label><input type="text" id="vc-new-dest" placeholder="e.g. Pucón" maxlength="60"></div>' +
          '<div class="vc-field"><label>Country</label><input type="text" id="vc-new-country" placeholder="e.g. Chile" maxlength="40"></div>' +
          '<div class="vc-field"><label>Icon (one emoji)</label><input type="text" id="vc-new-icon" maxlength="2" placeholder="✈️"></div>' +
          '<div class="vc-field"><label>Start date</label><input type="date" id="vc-new-start"></div>' +
          '<div class="vc-field"><label>End date (optional)</label><input type="date" id="vc-new-end"></div>' +
          '<div class="vc-form-actions">' +
            '<button class="vc-btn-secondary" onclick="Vacation.backToList()">Cancel</button>' +
            '<button class="vc-btn-primary" onclick="Vacation.saveNewTrip()">Save trip</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _renderDetail(wrap) {
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === _viewing; });
    if (!trip) { backToList(); return; }

    var cd = _countdown(trip);
    var packingHtml = _renderPacking(trip);
    var itinHtml = _renderItinerary(trip);
    var linksHtml = _learningLinks(trip).map(function(l) {
      return '<a class="vc-trip" href="' + _esc(l.href) + '" style="text-decoration:none;color:inherit;display:block;">' +
        '<div class="vc-trip-head">' +
          '<span class="vc-trip-icon">' + l.label.split(' ')[0] + '</span>' +
          '<span class="vc-trip-name">' + _esc(l.label.replace(/^[^ ]+ /, '')) + '</span>' +
        '</div>' +
        '<div class="vc-trip-dest">' + _esc(l.sub) + '</div>' +
      '</a>';
    }).join('');

    wrap.innerHTML =
      '<div class="vc-toolbar">' +
        '<button onclick="Vacation.backToList()">← All trips</button>' +
        (_parentUnlocked
          ? '<button class="vc-btn-danger" style="border-color:rgba(248,113,113,0.25);" onclick="Vacation.deleteTrip(\'' + trip.id + '\')">🗑 Delete</button>'
          : '<button onclick="Vacation.unlockParent()">🔒 Unlock to edit</button>') +
      '</div>' +
      '<div class="vc-detail">' +
        '<div class="vc-detail-head">' +
          '<span class="vc-detail-icon">' + _esc(trip.icon || '✈️') + '</span>' +
          '<div class="vc-detail-title">' + _esc(trip.name) + '</div>' +
        '</div>' +
        '<div class="vc-detail-meta">' +
          (trip.destination ? '<span>📍 ' + _esc(trip.destination) + '</span>' : '') +
          (trip.country ? '<span>' + _esc(trip.country) + '</span>' : '') +
          (trip.startDate ? '<span>📅 ' + _esc(trip.startDate) +
            (trip.endDate && trip.endDate !== trip.startDate ? ' → ' + _esc(trip.endDate) : '') + '</span>' : '') +
          (cd ? '<span class="vc-countdown ' + cd.kind + '">' + _esc(cd.text) + '</span>' : '') +
        '</div>' +
        '<div class="vc-section">' +
          '<div class="vc-section-head">🧳 Packing</div>' +
          packingHtml +
        '</div>' +
        '<div class="vc-section">' +
          '<div class="vc-section-head">🗓 Itinerary</div>' +
          itinHtml +
        '</div>' +
        (linksHtml ? '<div class="vc-section">' +
          '<div class="vc-section-head">📖 Learn before you go</div>' +
          '<div class="vc-trips">' + linksHtml + '</div>' +
        '</div>' : '') +
      '</div>';
  }

  function _renderPacking(trip) {
    var keys = Object.keys(trip.packing || {});
    if (keys.length === 0) return '<div class="vc-empty" style="padding:12px 0;">No packing list yet.</div>';
    keys.sort(function(a, b) {
      // Shared first, then alphabetical
      if (a === 'shared') return -1;
      if (b === 'shared') return 1;
      return a.localeCompare(b);
    });
    var cols = keys.map(function(k) {
      var items = trip.packing[k] || [];
      var rows = items.map(function(it) {
        return '<div class="vc-pack-row ' + (it.packed ? 'done' : '') + '">' +
          '<input type="checkbox" id="' + it.id + '" ' + (it.packed ? 'checked' : '') +
            (_parentUnlocked ? '' : ' disabled') +
            ' onchange="Vacation._togglePack(\'' + trip.id + '\', \'' + k + '\', \'' + it.id + '\')">' +
          '<label for="' + it.id + '">' + _esc(it.label) + '</label>' +
          (_parentUnlocked
            ? '<button class="vc-pack-del" onclick="Vacation._delPack(\'' + trip.id + '\', \'' + k + '\', \'' + it.id + '\')" aria-label="Remove">✕</button>'
            : '') +
        '</div>';
      }).join('');
      var addRow = _parentUnlocked
        ? '<div class="vc-pack-add">' +
            '<input type="text" id="vc-add-' + k + '" placeholder="Add item…" maxlength="40" ' +
                   'onkeydown="if(event.key===\'Enter\'){event.preventDefault();Vacation._addPack(\'' + trip.id + '\', \'' + k + '\');}">' +
            '<button onclick="Vacation._addPack(\'' + trip.id + '\', \'' + k + '\')">＋</button>' +
          '</div>'
        : '';
      var heading = k === 'shared' ? '🧳 Shared' : '👤 ' + k;
      return '<div class="vc-pack-col">' +
        '<h4>' + _esc(heading) + '</h4>' +
        rows +
        addRow +
      '</div>';
    }).join('');
    return '<div class="vc-pack-cols">' + cols + '</div>';
  }

  function _renderItinerary(trip) {
    if (!trip.startDate) return '<div class="vc-empty" style="padding:12px 0;">Add a start date to plan day-by-day.</div>';
    var start = new Date(trip.startDate + 'T00:00:00');
    var end = new Date((trip.endDate || trip.startDate) + 'T00:00:00');
    var dayCount = Math.max(1, Math.round((end - start) / 86400000) + 1);
    if (dayCount > 30) dayCount = 30; // sanity cap

    var html = '';
    for (var i = 0; i < dayCount; i++) {
      var d = new Date(start.getTime() + i * 86400000);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var label = months[d.getMonth()] + ' ' + d.getDate();
      var val = (trip.itinerary && trip.itinerary[key]) || '';
      html +=
        '<div class="vc-day">' +
          '<div class="vc-day-head">' +
            '<span class="vc-day-num">Day ' + (i + 1) + '</span>' +
            '<span class="vc-day-date">' + label + '</span>' +
          '</div>' +
          '<textarea ' + (_parentUnlocked ? '' : 'disabled') +
            ' placeholder="Activities, meals, places to visit…"' +
            ' oninput="Vacation._setItin(\'' + trip.id + '\', \'' + key + '\', this.value)">' +
            _esc(val) +
          '</textarea>' +
        '</div>';
    }
    return html;
  }

  // ── Init ──
  function init() {
    _parentUnlocked = false;
    _viewing = null;
    _mode = 'list';
    _render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    unlockParent: unlockParent,
    newTrip: newTrip,
    openTrip: openTrip,
    backToList: backToList,
    deleteTrip: deleteTrip,
    saveNewTrip: saveNewTrip,
    _togglePack: togglePackItem,
    _addPack: addPackItem,
    _delPack: removePackItem,
    _setItin: setItinerary
  };
})();
