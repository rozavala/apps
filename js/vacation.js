/* ================================================================
   VACATION PLANNER — vacation.js
   Family-shared trip planner: countdown, packing list, itinerary,
   and one-tap jumps to relevant learning apps for the destination.

   Storage key: zs_vacation
     {
       trips: [
         { id, name, destination, country, icon,
           startDate, endDate, notes,
           hidden,     // when true, trip is a "surprise": invisible in
                       // the list and blocked from detail view until a
                       // parent unlocks with the PIN. Kids never see it.
           overview,   // free text intro (blank lines separate paragraphs)
           images: [ { url, caption } ],      // photo gallery
           suggestions: [ { icon, title, text } ], // things to do / tips
           packing: { shared: [...], <profileName>: [...] },
                       // each item: { id, label, packed: bool }
           itinerary: { "YYYY-MM-DD": "Activities text…" }
         },
         ...
       ]
     }

   Uses parent PIN to unlock editing (reuses requestPinThen).
   Read-only browsing by default. Surprise trips (hidden:true) stay
   out of sight for kids until a parent unlocks with the PIN.
   ================================================================ */

var Vacation = (function() {
  'use strict';

  var STORAGE_KEY = 'zs_vacation';
  var _parentUnlocked = false;
  var _viewing = null;  // currently-open trip id, or null
  var _mode = 'list';   // 'list' | 'detail' | 'edit' | 'new'
  var _quiz = null;     // in-progress quiz: { tripId, idx, score, answered, chosen }

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
    try {
      // Bump our own sync stamp so a later pull doesn't treat the
      // server's (pre-edit) copy as newer and clobber this change, then
      // push to the VPS like every other household-synced module. Without
      // this, edits live only in this browser and get overwritten on the
      // next household pull.
      data._syncedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(STORAGE_KEY);
    }
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
    _quiz = null;
    _render();
  }

  function editTrip(id) {
    if (!_parentUnlocked) { unlockParent(); return; }
    _viewing = id;
    _mode = 'edit';
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
    var overview = document.getElementById('vc-new-overview').value.trim();
    var slidesUrl = document.getElementById('vc-new-slides').value.trim();
    var hidden = document.getElementById('vc-new-hidden').checked;

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
      hidden: hidden,
      overview: overview,
      slidesUrl: slidesUrl,
      images: [],
      suggestions: [],
      packing: packing,
      itinerary: {}
    });
    _save(data);
    _mode = 'list';
    _render();
  }

  // Photos editor uses one line per image: "url | caption" (caption optional).
  function _parseImages(text) {
    return String(text || '').split('\n').map(function(line) {
      var s = line.trim();
      if (!s) return null;
      var bar = s.indexOf('|');
      var url = (bar === -1 ? s : s.slice(0, bar)).trim();
      var cap = bar === -1 ? '' : s.slice(bar + 1).trim();
      if (!url) return null;
      return { url: url, caption: cap };
    }).filter(Boolean);
  }

  // Tips editor uses one line per tip: "icon | title | text".
  function _parseSuggestions(text) {
    return String(text || '').split('\n').map(function(line) {
      var s = line.trim();
      if (!s) return null;
      var parts = s.split('|');
      var icon = (parts[0] || '').trim() || '💡';
      var title = (parts[1] || '').trim();
      var rest = parts.slice(2).join('|').trim();
      // Allow "title | text" (no icon) too: if only two parts and the first
      // isn't a short emoji-ish token, treat it as the title.
      if (parts.length === 2 && (parts[0] || '').trim().length > 3) {
        title = (parts[0] || '').trim();
        rest = (parts[1] || '').trim();
        icon = '💡';
      }
      if (!title && !rest) return null;
      return { icon: icon, title: title, text: rest };
    }).filter(Boolean);
  }

  function saveEditTrip() {
    if (!_parentUnlocked) return;
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === _viewing; });
    if (!trip) { backToList(); return; }

    var name = document.getElementById('vc-edit-name').value.trim();
    var start = document.getElementById('vc-edit-start').value;
    if (!name || !start) {
      alert('Pick a trip name and a start date.');
      return;
    }
    var end = document.getElementById('vc-edit-end').value;

    trip.name = name;
    trip.destination = document.getElementById('vc-edit-dest').value.trim();
    trip.country = document.getElementById('vc-edit-country').value.trim();
    trip.icon = document.getElementById('vc-edit-icon').value.trim() || '✈️';
    trip.startDate = start;
    trip.endDate = end || start;
    trip.overview = document.getElementById('vc-edit-overview').value.trim();
    trip.hidden = document.getElementById('vc-edit-hidden').checked;
    trip.slidesUrl = document.getElementById('vc-edit-slides').value.trim();
    trip.images = _parseImages(document.getElementById('vc-edit-images').value);
    trip.suggestions = _parseSuggestions(document.getElementById('vc-edit-suggestions').value);

    _save(data);
    _mode = 'detail';
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
    if (_mode === 'edit' && _viewing) return _renderEditForm(wrap);
    if (_mode === 'detail' && _viewing) return _renderDetail(wrap);
    return _renderList(wrap);
  }

  function _renderList(wrap) {
    var data = _load();
    var trips = data.trips.slice();
    // Surprise trips (hidden:true) are kept out of the list entirely
    // until a parent unlocks with the PIN — that's what keeps a planned
    // surprise invisible to the kids browsing the planner.
    var hiddenCount = trips.filter(function(t) { return t.hidden; }).length;
    if (!_parentUnlocked) {
      trips = trips.filter(function(t) { return !t.hidden; });
    }
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
      (_parentUnlocked && hiddenCount > 0
        ? '<div class="vc-surprise-note">🤫 ' + hiddenCount + ' surprise trip' +
          (hiddenCount === 1 ? '' : 's') + ' shown below — hidden from the kids until you reveal ' +
          (hiddenCount === 1 ? 'it' : 'them') + '.</div>'
        : '') +
      (trips.length === 0
        ? '<div class="vc-empty">No trips yet. Tap "Unlock to edit" then "New trip" to add one.</div>'
        : '<div class="vc-trips">' + trips.map(_tripCardHtml).join('') + '</div>');
  }

  function _tripCardHtml(trip) {
    var cd = _countdown(trip);
    var cls = cd ? cd.kind : 'upcoming';
    return '<div class="vc-trip ' + cls + (trip.hidden ? ' surprise' : '') + '" onclick="Vacation.openTrip(\'' + trip.id + '\')">' +
      '<div class="vc-trip-head">' +
        '<span class="vc-trip-icon">' + _esc(trip.icon || '✈️') + '</span>' +
        '<span class="vc-trip-name">' + _esc(trip.name) + '</span>' +
        (trip.hidden ? '<span class="vc-surprise-badge">🤫 Surprise</span>' : '') +
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
          '<div class="vc-field"><label>Overview (optional)</label><textarea id="vc-new-overview" rows="3" placeholder="A short intro to the trip…" maxlength="2000"></textarea></div>' +
          '<div class="vc-field"><label>Reveal slideshow URL (optional)</label><input type="text" id="vc-new-slides" placeholder="e.g. vacation-reveal.html"></div>' +
          '<label class="vc-check"><input type="checkbox" id="vc-new-hidden">' +
            '<span>🤫 Surprise — hide from the kids until I reveal it</span></label>' +
          '<div class="vc-form-actions">' +
            '<button class="vc-btn-secondary" onclick="Vacation.backToList()">Cancel</button>' +
            '<button class="vc-btn-primary" onclick="Vacation.saveNewTrip()">Save trip</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _renderEditForm(wrap) {
    if (!_parentUnlocked) { backToList(); return; }
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === _viewing; });
    if (!trip) { backToList(); return; }

    var imagesText = (Array.isArray(trip.images) ? trip.images : []).map(function(im) {
      return (im && im.url ? im.url : '') + (im && im.caption ? ' | ' + im.caption : '');
    }).join('\n');
    var suggText = (Array.isArray(trip.suggestions) ? trip.suggestions : []).map(function(s) {
      return [(s && s.icon) || '💡', (s && s.title) || '', (s && s.text) || ''].join(' | ');
    }).join('\n');

    wrap.innerHTML =
      '<div class="vc-toolbar">' +
        '<button onclick="Vacation.openTrip(\'' + trip.id + '\')">← Back to trip</button>' +
      '</div>' +
      '<div class="vc-header">' +
        '<span class="vc-icon">✏️</span>' +
        '<h1>Edit trip</h1>' +
      '</div>' +
      '<div class="vc-detail">' +
        '<div class="vc-form">' +
          '<div class="vc-field"><label>Name</label><input type="text" id="vc-edit-name" maxlength="40" value="' + _esc(trip.name || '') + '"></div>' +
          '<div class="vc-field"><label>Destination</label><input type="text" id="vc-edit-dest" maxlength="60" value="' + _esc(trip.destination || '') + '"></div>' +
          '<div class="vc-field"><label>Country</label><input type="text" id="vc-edit-country" maxlength="40" value="' + _esc(trip.country || '') + '"></div>' +
          '<div class="vc-field"><label>Icon (one emoji)</label><input type="text" id="vc-edit-icon" maxlength="2" value="' + _esc(trip.icon || '✈️') + '"></div>' +
          '<div class="vc-field"><label>Start date</label><input type="date" id="vc-edit-start" value="' + _esc(trip.startDate || '') + '"></div>' +
          '<div class="vc-field"><label>End date</label><input type="date" id="vc-edit-end" value="' + _esc(trip.endDate || '') + '"></div>' +
          '<div class="vc-field"><label>Overview</label><textarea id="vc-edit-overview" rows="4" maxlength="2000" placeholder="A short intro to the trip…">' + _esc(trip.overview || '') + '</textarea></div>' +
          '<div class="vc-field"><label>Photos — one per line: <code>url | caption</code></label>' +
            '<textarea id="vc-edit-images" rows="5" placeholder="https://example.com/photo.jpg | A sunny beach">' + _esc(imagesText) + '</textarea></div>' +
          '<div class="vc-field"><label>Ideas &amp; tips — one per line: <code>icon | title | text</code></label>' +
            '<textarea id="vc-edit-suggestions" rows="5" placeholder="🛂 | Passports | Check they\'re valid 6+ months out">' + _esc(suggText) + '</textarea></div>' +
          '<div class="vc-field"><label>Reveal slideshow URL (optional)</label>' +
            '<input type="text" id="vc-edit-slides" placeholder="e.g. vacation-reveal.html" value="' + _esc(trip.slidesUrl || '') + '"></div>' +
          '<label class="vc-check"><input type="checkbox" id="vc-edit-hidden"' + (trip.hidden ? ' checked' : '') + '>' +
            '<span>🤫 Surprise — hide from the kids until I reveal it</span></label>' +
          '<p class="vc-form-hint">Packing and the day-by-day itinerary are edited on the trip page itself.</p>' +
          '<div class="vc-form-actions">' +
            '<button class="vc-btn-secondary" onclick="Vacation.openTrip(\'' + trip.id + '\')">Cancel</button>' +
            '<button class="vc-btn-primary" onclick="Vacation.saveEditTrip()">Save changes</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _renderDetail(wrap) {
    var data = _load();
    var trip = data.trips.find(function(t) { return t.id === _viewing; });
    if (!trip) { backToList(); return; }
    // A surprise trip can only be opened while a parent is unlocked —
    // belt-and-suspenders so it can never be reached from a kid session.
    if (trip.hidden && !_parentUnlocked) { backToList(); return; }

    var cd = _countdown(trip);
    var overviewHtml = _renderOverview(trip);
    var flightsHtml = _renderFlights(trip);
    var countriesHtml = _renderCountries(trip);
    var placesHtml = _renderPlaces(trip);
    var quizHtml = _renderQuiz(trip);
    var galleryHtml = _renderGallery(trip);
    var suggestionsHtml = _renderSuggestions(trip);
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
          ? '<button class="vc-tb-primary" onclick="Vacation.editTrip(\'' + trip.id + '\')">✏️ Edit trip</button>' +
            '<button class="vc-btn-danger" style="border-color:rgba(248,113,113,0.25);" onclick="Vacation.deleteTrip(\'' + trip.id + '\')">🗑 Delete</button>'
          : '<button onclick="Vacation.unlockParent()">🔒 Unlock to edit</button>') +
      '</div>' +
      '<div class="vc-detail">' +
        '<div class="vc-detail-head">' +
          '<span class="vc-detail-icon">' + _esc(trip.icon || '✈️') + '</span>' +
          '<div class="vc-detail-title">' + _esc(trip.name) + '</div>' +
        '</div>' +
        '<div class="vc-detail-meta">' +
          (trip.hidden ? '<span class="vc-surprise-badge">🤫 Surprise</span>' : '') +
          (trip.destination ? '<span>📍 ' + _esc(trip.destination) + '</span>' : '') +
          (trip.country ? '<span>' + _esc(trip.country) + '</span>' : '') +
          (trip.startDate ? '<span>📅 ' + _esc(trip.startDate) +
            (trip.endDate && trip.endDate !== trip.startDate ? ' → ' + _esc(trip.endDate) : '') + '</span>' : '') +
          (cd ? '<span class="vc-countdown ' + cd.kind + '">' + _esc(cd.text) + '</span>' : '') +
        '</div>' +
        (trip.slidesUrl
          ? '<a class="vc-reveal-btn" href="' + _esc(trip.slidesUrl) + '" target="_blank" rel="noopener">🎉 Reveal slideshow</a>'
          : '') +
        overviewHtml +
        flightsHtml +
        galleryHtml +
        countriesHtml +
        placesHtml +
        quizHtml +
        suggestionsHtml +
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

  // Free-text intro. Blank lines split paragraphs; single newlines become
  // line breaks. Everything is escaped first, so trip data can't inject HTML.
  function _renderOverview(trip) {
    var txt = String(trip.overview || '').trim();
    if (!txt) return '';
    var paras = txt.split(/\n\s*\n/).map(function(p) {
      return '<p>' + _esc(p).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    return '<div class="vc-section">' +
      '<div class="vc-section-head">📝 About this trip</div>' +
      '<div class="vc-overview">' + paras + '</div>' +
    '</div>';
  }

  // Photo strip. Images that fail to load (e.g. a bad URL) hide their own
  // tile via onerror so a broken-image icon never spoils the page.
  function _renderGallery(trip) {
    var imgs = Array.isArray(trip.images) ? trip.images : [];
    if (imgs.length === 0) return '';
    var tiles = imgs.map(function(im) {
      var url = String(im && im.url || '');
      if (!url) return '';
      var cap = im.caption ? '<span class="vc-photo-cap">' + _esc(im.caption) + '</span>' : '';
      return '<div class="vc-photo">' +
        '<img src="' + _esc(url) + '" alt="' + _esc(im.caption || trip.name || '') + '" ' +
          'loading="lazy" referrerpolicy="no-referrer" ' +
          'onerror="this.closest(\'.vc-photo\').style.display=\'none\'">' +
        cap +
      '</div>';
    }).join('');
    return '<div class="vc-section">' +
      '<div class="vc-section-head">📸 Photos</div>' +
      '<div class="vc-gallery">' + tiles + '</div>' +
    '</div>';
  }

  // Curated ideas / tips for the trip (things to do, good-to-know notes).
  function _renderSuggestions(trip) {
    var list = Array.isArray(trip.suggestions) ? trip.suggestions : [];
    if (list.length === 0) return '';
    var rows = list.map(function(s) {
      if (!s || (!s.title && !s.text)) return '';
      return '<div class="vc-sugg">' +
        '<span class="vc-sugg-icon">' + _esc(s.icon || '💡') + '</span>' +
        '<div class="vc-sugg-body">' +
          (s.title ? '<div class="vc-sugg-title">' + _esc(s.title) + '</div>' : '') +
          (s.text ? '<div class="vc-sugg-text">' + _esc(s.text) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="vc-section">' +
      '<div class="vc-section-head">💡 Ideas &amp; tips</div>' +
      '<div class="vc-suggs">' + rows + '</div>' +
    '</div>';
  }

  // ── Flights board ──
  function _renderFlights(trip) {
    var f = Array.isArray(trip.flights) ? trip.flights : [];
    if (f.length === 0) return '';
    var rows = f.map(function(fl) {
      if (!fl) return '';
      return '<div class="vc-flight">' +
        '<div class="vc-flight-top">' +
          '<span class="vc-flight-air">' + _esc(fl.airline || '') +
            (fl.number ? ' <b>' + _esc(fl.number) + '</b>' : '') + '</span>' +
          (fl.date ? '<span class="vc-flight-date">' + _esc(fl.date) + '</span>' : '') +
        '</div>' +
        '<div class="vc-flight-route">' +
          '<div class="vc-fl-end">' +
            '<span class="vc-fl-code">' + _esc(fl.fromCode || '') + '</span>' +
            '<span class="vc-fl-city">' + _esc(fl.fromCity || '') + '</span>' +
            (fl.depLocal ? '<span class="vc-fl-time">' + _esc(fl.depLocal) + '</span>' : '') +
          '</div>' +
          '<div class="vc-fl-mid">✈️' + (fl.duration ? '<span>' + _esc(fl.duration) + '</span>' : '') + '</div>' +
          '<div class="vc-fl-end">' +
            '<span class="vc-fl-code">' + _esc(fl.toCode || '') + '</span>' +
            '<span class="vc-fl-city">' + _esc(fl.toCity || '') + '</span>' +
            (fl.arrLocal ? '<span class="vc-fl-time">' + _esc(fl.arrLocal) + '</span>' : '') +
          '</div>' +
        '</div>' +
        (fl.note ? '<div class="vc-flight-note">' + _esc(fl.note) + '</div>' : '') +
      '</div>';
    }).join('');
    return '<div class="vc-section"><div class="vc-section-head">✈️ Flights</div>' +
      '<div class="vc-flights">' + rows + '</div></div>';
  }

  // ── Countries & culture ──
  function _renderCountries(trip) {
    var c = Array.isArray(trip.countries) ? trip.countries : [];
    if (c.length === 0) return '';
    var cards = c.map(function(co) {
      if (!co) return '';
      var facts = Array.isArray(co.facts) ? co.facts : [];
      return '<div class="vc-country">' +
        '<div class="vc-country-head">' +
          '<span class="vc-country-flag">' + _esc(co.flag || '🏳️') + '</span>' +
          '<span class="vc-country-name">' + _esc(co.name || '') + '</span>' +
        '</div>' +
        '<div class="vc-country-meta">' +
          (co.capital ? '<span>🏙️ ' + _esc(co.capital) + '</span>' : '') +
          (co.language ? '<span>🗣️ ' + _esc(co.language) + '</span>' : '') +
          (co.currency ? '<span>💰 ' + _esc(co.currency) + '</span>' : '') +
        '</div>' +
        (co.blurb ? '<p class="vc-country-blurb">' + _esc(co.blurb) + '</p>' : '') +
        (facts.length ? '<ul class="vc-country-facts">' +
          facts.map(function(x) { return '<li>' + _esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '</div>';
    }).join('');
    return '<div class="vc-section"><div class="vc-section-head">🌏 Countries &amp; culture</div>' +
      '<div class="vc-countries">' + cards + '</div></div>';
  }

  // ── Places & landmarks, with a fit-to-route mini map ──
  function _renderPlaces(trip) {
    var p = Array.isArray(trip.places) ? trip.places : [];
    if (p.length === 0) return '';
    var cards = p.map(function(pl) {
      if (!pl) return '';
      return '<div class="vc-place">' +
        (pl.image
          ? '<div class="vc-place-img"><img src="' + _esc(pl.image) + '" alt="' + _esc(pl.name || '') + '" ' +
            'loading="lazy" referrerpolicy="no-referrer" ' +
            'onerror="this.closest(\'.vc-place-img\').style.display=\'none\'"></div>'
          : '') +
        '<div class="vc-place-body">' +
          '<div class="vc-place-name">' + _esc(pl.emoji || '📍') + ' ' + _esc(pl.name || '') + '</div>' +
          (pl.blurb ? '<div class="vc-place-blurb">' + _esc(pl.blurb) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="vc-section"><div class="vc-section-head">📍 Places we\'ll visit</div>' +
      _placesMap(p) +
      '<div class="vc-places">' + cards + '</div></div>';
  }

  // Self-contained SVG route map: fits all places with lat/lon into a
  // padded bounding box, draws the route line, numbered pins and labels.
  // No external tiles, so it always renders.
  function _placesMap(places) {
    var pts = (places || []).filter(function(p) {
      return p && typeof p.lat === 'number' && typeof p.lon === 'number';
    });
    if (pts.length < 2) return '';
    var lats = pts.map(function(p) { return p.lat; });
    var lons = pts.map(function(p) { return p.lon; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
    var padLat = (maxLat - minLat) * 0.25 || 2, padLon = (maxLon - minLon) * 0.25 || 2;
    minLat -= padLat; maxLat += padLat; minLon -= padLon; maxLon += padLon;
    var W = 100, H = 60;
    function fx(lon) { return ((lon - minLon) / (maxLon - minLon) * W).toFixed(2); }
    function fy(lat) { return ((maxLat - lat) / (maxLat - minLat) * H).toFixed(2); }

    var poly = pts.map(function(p) { return fx(p.lon) + ',' + fy(p.lat); }).join(' ');
    var dots = '', labels = '';
    pts.forEach(function(p, i) {
      var x = fx(p.lon), y = fy(p.lat);
      dots += '<circle cx="' + x + '" cy="' + y + '" r="1.6" fill="#DB2777" stroke="#fff" stroke-width="0.5"/>' +
        '<text x="' + x + '" y="' + (parseFloat(y) + 0.55).toFixed(2) + '" text-anchor="middle" ' +
        'font-size="1.7" font-weight="800" fill="#fff">' + (i + 1) + '</text>';
      labels += '<div class="vc-map-label" style="left:' + x + '%; top:' + y + '%;">' +
        (i + 1) + '. ' + _esc(p.name || '') + '</div>';
    });
    return '<div class="vc-map">' +
      '<svg viewBox="0 0 100 60" preserveAspectRatio="none" class="vc-map-svg">' +
        '<polyline points="' + poly + '" fill="none" stroke="#6366F1" stroke-width="0.7" ' +
          'stroke-dasharray="1.8 1.4" stroke-linecap="round"/>' + dots +
      '</svg>' + labels +
    '</div>';
  }

  // ── Interactive quiz (per-kid best score, synced) ──
  function _quizKey() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('vacquiz') : null;
  }
  function _quizLoad() {
    try {
      var k = _quizKey();
      if (!k) return {};
      return JSON.parse(localStorage.getItem(k)) || {};
    } catch (e) { return {}; }
  }
  function _quizSaveScore(tripId, score, total) {
    var k = _quizKey();
    if (!k) return null; // no logged-in kid → play without saving
    var data = _quizLoad();
    var prev = data[tripId] || { best: 0, total: total };
    var best = Math.max(prev.best || 0, score);
    data[tripId] = { best: best, total: total, lastScore: score };
    try {
      localStorage.setItem(k, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(k);
    } catch (e) {}
    return data[tripId];
  }

  function _renderQuiz(trip) {
    var q = Array.isArray(trip.quiz) ? trip.quiz : [];
    if (q.length === 0) return '';
    return '<div class="vc-section"><div class="vc-section-head">🧠 Trip quiz</div>' +
      '<div id="vc-quiz" class="vc-quiz">' + _quizBody(trip) + '</div></div>';
  }

  // Renders the quiz box for the current _quiz state (intro / question / done).
  function _quizBody(trip) {
    var q = Array.isArray(trip.quiz) ? trip.quiz : [];
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    var running = _quiz && _quiz.tripId === trip.id;

    if (!running) {
      var saved = _quizLoad()[trip.id];
      var bestLine = saved
        ? '<div class="vc-quiz-best">🏆 Best: ' + saved.best + ' / ' + (saved.total || q.length) +
          (user ? ' · ' + _esc(user.name) : '') + '</div>'
        : '';
      return '<div class="vc-quiz-intro">' +
        '<p>' + q.length + ' questions about our trip. Ready?</p>' +
        bestLine +
        (user ? '' : '<p class="vc-quiz-hint">Log in as yourself to save your score.</p>') +
        '<button class="vc-btn-primary" onclick="Vacation.quizStart(\'' + trip.id + '\')">▶ Start quiz</button>' +
      '</div>';
    }

    if (_quiz.idx >= q.length) {
      var pct = Math.round(_quiz.score / q.length * 100);
      var msg = pct === 100 ? '🌟 Perfect!' : pct >= 60 ? '🎉 Great job!' : '👍 Nice try!';
      var savedRes = _quizSaveScore(trip.id, _quiz.score, q.length);
      return '<div class="vc-quiz-done">' +
        '<div class="vc-quiz-score">' + _quiz.score + ' / ' + q.length + '</div>' +
        '<div class="vc-quiz-msg">' + msg + '</div>' +
        (savedRes ? '<div class="vc-quiz-best">🏆 Best: ' + savedRes.best + ' / ' + q.length + '</div>' : '') +
        '<button class="vc-btn-primary" onclick="Vacation.quizStart(\'' + trip.id + '\')">↻ Play again</button>' +
      '</div>';
    }

    var item = q[_quiz.idx] || {};
    var opts = Array.isArray(item.options) ? item.options : [];
    var optHtml = opts.map(function(opt, i) {
      var cls = 'vc-quiz-opt';
      if (_quiz.answered) {
        if (i === item.answer) cls += ' correct';
        else if (i === _quiz.chosen) cls += ' wrong';
      }
      return '<button class="' + cls + '" ' + (_quiz.answered ? 'disabled' : '') +
        ' onclick="Vacation.quizAnswer(\'' + trip.id + '\', ' + i + ')">' + _esc(opt) + '</button>';
    }).join('');

    return '<div class="vc-quiz-q">' +
      '<div class="vc-quiz-progress">Question ' + (_quiz.idx + 1) + ' / ' + q.length +
        ' · Score ' + _quiz.score + '</div>' +
      '<div class="vc-quiz-question">' + _esc(item.q || '') + '</div>' +
      '<div class="vc-quiz-opts">' + optHtml + '</div>' +
      (_quiz.answered
        ? '<div class="vc-quiz-explain">' +
            (_quiz.chosen === item.answer ? '✅ Correct! ' : '❌ ') +
            _esc(item.explain || '') + '</div>' +
          '<button class="vc-btn-primary" onclick="Vacation.quizNext(\'' + trip.id + '\')">' +
            (_quiz.idx + 1 >= q.length ? 'See results →' : 'Next →') + '</button>'
        : '') +
    '</div>';
  }

  function _quizRerender(trip) {
    var box = document.getElementById('vc-quiz');
    if (box) box.innerHTML = _quizBody(trip);
  }

  function quizStart(tripId) {
    var trip = _load().trips.find(function(t) { return t.id === tripId; });
    if (!trip) return;
    _quiz = { tripId: tripId, idx: 0, score: 0, answered: false, chosen: -1 };
    _quizRerender(trip);
  }
  function quizAnswer(tripId, i) {
    if (!_quiz || _quiz.tripId !== tripId || _quiz.answered) return;
    var trip = _load().trips.find(function(t) { return t.id === tripId; });
    if (!trip) return;
    var item = (trip.quiz || [])[_quiz.idx];
    if (!item) return;
    _quiz.answered = true;
    _quiz.chosen = i;
    if (i === item.answer) _quiz.score++;
    _quizRerender(trip);
  }
  function quizNext(tripId) {
    if (!_quiz || _quiz.tripId !== tripId) return;
    var trip = _load().trips.find(function(t) { return t.id === tripId; });
    if (!trip) return;
    _quiz.idx++;
    _quiz.answered = false;
    _quiz.chosen = -1;
    _quizRerender(trip);
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
    editTrip: editTrip,
    backToList: backToList,
    deleteTrip: deleteTrip,
    saveNewTrip: saveNewTrip,
    saveEditTrip: saveEditTrip,
    quizStart: quizStart,
    quizAnswer: quizAnswer,
    quizNext: quizNext,
    _togglePack: togglePackItem,
    _addPack: addPackItem,
    _delPack: removePackItem,
    _setItin: setItinerary
  };
})();
