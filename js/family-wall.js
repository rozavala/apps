/* ================================================================
   FAMILY WALL — shared dashboard for the iPad-on-the-fridge
   - Avatar strip up top (tap to log in as that kid)
   - Today's date + greeting
   - Weather card with morning/afternoon clothing suggestion
   - Routines grid: rows = kids, columns = morning + evening tasks
     with checkable chips (trust-based; PIN gate optional via parent
     settings — out of scope for v1)
   - Today's calendar (FamilyCalendar.getUpcoming filtered to today)
   - Today's menu (zs_menu)
   - Active shopping list summary (zs_shopping_list)
   - Quick links: Menu, Shopping, Routines, full app hub

   Storage:
     zs_home_location = { lat, lon, label, ts }
     zs_fw_weather    = { fetchedAt, payload, location }
   ================================================================ */

var FamilyWall = (function() {
  'use strict';

  var WEATHER_KEY = 'zs_fw_weather';
  var LOCATION_KEY = 'zs_home_location';
  var WEATHER_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // Pre-set city options so the location picker works without
  // browser geolocation. Lat/lon to 2 decimals — plenty for weather.
  var CITY_PRESETS = [
    { label: 'Santiago, CL', lat: -33.45, lon: -70.66 },
    { label: 'Viña del Mar, CL', lat: -33.02, lon: -71.55 },
    { label: 'Concepción, CL', lat: -36.83, lon: -73.05 },
    { label: 'La Serena, CL', lat: -29.90, lon: -71.25 },
    { label: 'Punta Arenas, CL', lat: -53.16, lon: -70.91 },
    { label: 'Miami, US', lat: 25.76, lon: -80.19 }
  ];

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _todayIsoLocal() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function _mondayIsoOf(d) {
    var day = d.getDay();
    var off = day === 0 ? -6 : 1 - day;
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + off);
    return m.getFullYear() + '-' + String(m.getMonth()+1).padStart(2,'0') + '-' + String(m.getDate()).padStart(2,'0');
  }

  function _todayDayId() {
    return ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
  }

  function _greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning, family!';
    if (h < 18) return 'Good afternoon, family!';
    return 'Good evening, family!';
  }

  function _formatDate() {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  // ---- Location ----
  function getLocation() {
    try { return JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null'); }
    catch (e) { return null; }
  }

  function setLocation(loc) {
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return;
    localStorage.setItem(LOCATION_KEY, JSON.stringify({
      lat: loc.lat, lon: loc.lon, label: loc.label || 'Home', ts: Date.now()
    }));
    // Force a fresh weather fetch
    localStorage.removeItem(WEATHER_KEY);
    fetchWeather().then(_paint).catch(_paint);
  }

  // ---- Weather (Open-Meteo, free, no key) ----
  function fetchWeather() {
    var loc = getLocation();
    if (!loc) return Promise.resolve(null);
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null'); } catch (e) {}
    if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < WEATHER_TTL_MS &&
        cached.location && cached.location.lat === loc.lat && cached.location.lon === loc.lon) {
      return Promise.resolve(cached);
    }
    var url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + loc.lat + '&longitude=' + loc.lon +
      '&current_weather=true' +
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,weathercode' +
      '&timezone=auto&forecast_days=2';
    return fetch(url, { cache: 'no-store' })
      .then(function(res) {
        if (!res.ok) throw new Error('weather HTTP ' + res.status);
        return res.json();
      })
      .then(function(payload) {
        var record = { fetchedAt: Date.now(), payload: payload, location: loc };
        try { localStorage.setItem(WEATHER_KEY, JSON.stringify(record)); } catch (e) {}
        return record;
      })
      .catch(function(e) {
        return cached || { error: String(e && e.message || e), location: loc };
      });
  }

  // ---- Open-Meteo weathercode → emoji + description ----
  // https://open-meteo.com/en/docs (WMO codes)
  function _wxLabel(code) {
    var map = {
      0:  ['☀️', 'Clear'],
      1:  ['🌤', 'Mainly clear'],
      2:  ['⛅', 'Partly cloudy'],
      3:  ['☁️', 'Overcast'],
      45: ['🌫', 'Fog'],
      48: ['🌫', 'Fog'],
      51: ['🌦', 'Light drizzle'],
      53: ['🌦', 'Drizzle'],
      55: ['🌧', 'Heavy drizzle'],
      61: ['🌦', 'Light rain'],
      63: ['🌧', 'Rain'],
      65: ['🌧', 'Heavy rain'],
      71: ['🌨', 'Light snow'],
      73: ['🌨', 'Snow'],
      75: ['❄️', 'Heavy snow'],
      80: ['🌦', 'Rain showers'],
      81: ['🌧', 'Rain showers'],
      82: ['⛈', 'Violent rain'],
      95: ['⛈', 'Thunderstorm'],
      96: ['⛈', 'Thunder + hail'],
      99: ['⛈', 'Thunder + hail']
    };
    return map[code] || ['🌡', 'Weather'];
  }

  function _suggest(weather) {
    if (!weather || !weather.payload || !weather.payload.daily) return null;
    var d = weather.payload.daily;
    var hour = new Date().getHours();
    var morning = hour < 14;
    var idx = morning ? 0 : 1; // today vs tomorrow
    if (!d.temperature_2m_max || !d.temperature_2m_max[idx]) idx = 0;

    var maxT = d.temperature_2m_max && d.temperature_2m_max[idx];
    var minT = d.temperature_2m_min && d.temperature_2m_min[idx];
    var precip = (d.precipitation_sum && d.precipitation_sum[idx]) || 0;
    var uv = (d.uv_index_max && d.uv_index_max[idx]) || 0;

    var when = morning ? 'Today' : 'Tomorrow';

    if (precip >= 2) {
      return { mood: 'rain', when: when, text: '🧥 Bring a raincoat — ' + precip.toFixed(1) + ' mm of rain expected.' };
    }
    if (typeof minT === 'number' && minT < 8) {
      return { mood: 'cold', when: when, text: '🧣 Bring a parka — low of ' + Math.round(minT) + '°C.' };
    }
    if (typeof maxT === 'number' && maxT >= 26 && uv >= 6) {
      return { mood: 'warm', when: when, text: '🧴 Apply sunscreen — UV ' + Math.round(uv) + ', high of ' + Math.round(maxT) + '°C.' };
    }
    if (typeof maxT === 'number' && maxT >= 28) {
      return { mood: 'warm', when: when, text: '💧 Hot day — bring a water bottle.' };
    }
    if (uv >= 7) {
      return { mood: 'warm', when: when, text: '🧴 High UV (' + Math.round(uv) + ') — apply sunscreen.' };
    }
    return { mood: 'warm', when: when, text: '👍 Mild weather — no special gear needed.' };
  }

  // ---- Render ----
  function _paint() {
    var root = document.getElementById('fw-root');
    if (!root) return;
    var profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    var active = (typeof getActiveUser === 'function') ? getActiveUser() : null;

    var avatars = profiles.map(function(p) {
      var on = active && active.name === p.name;
      return '<div class="fw-avatar ' + (on ? 'active' : '') + '" ' +
               'style="--avatar-color:' + _esc(p.color || '#A78BFA') + '" ' +
               'onclick="FamilyWall.loginAs(\'' + _esc(p.name).replace(/\\/g, '\\\\').replace(/\'/g, '\\\'') + '\')">' +
        _esc(p.avatar || '🦊') +
        '<span class="fw-avatar-name">' + _esc(p.name) + '</span>' +
      '</div>';
    }).join('');

    root.innerHTML =
      '<div class="fw-top">' +
        '<div class="fw-top-left">' +
          '<a class="fw-back" href="index.html" aria-label="Back to hub">←</a>' +
          '<div class="fw-avatars">' + avatars + '</div>' +
        '</div>' +
        '<div class="fw-date-block">' +
          '<div class="fw-date">' + _esc(_formatDate()) + '</div>' +
          '<div class="fw-greeting">' + _esc(_greeting()) + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="fw-grid">' +
        _renderWeatherCard() +
        _renderRoutinesCard(profiles) +
        _renderCalendarCard() +
        _renderWeekCard() +
        _renderMenuCard() +
        _renderShoppingCard() +
        _renderQuickCard() +
      '</div>';

    // After paint, populate location modal cities and lazy-fetch calendar.
    _populateCityList();
    if (typeof FamilyCalendar !== 'undefined' && FamilyCalendar.refresh) {
      FamilyCalendar.refresh(false).then(function() {
        _paintCalendar();
        _paintWeek();
      }).catch(function() {});
    }
  }

  // ---- Card renderers ----
  function _renderWeatherCard() {
    var loc = getLocation();
    if (!loc) {
      return '<div class="fw-card fw-card-weather">' +
        '<div class="fw-card-head"><span class="fw-card-icon">⛅</span> Weather</div>' +
        '<div class="fw-card-empty">Set a home location to see today\'s forecast.</div>' +
        '<div class="fw-weather-cta"><a onclick="FamilyWall.openLocationModal()">Set home location 📍</a></div>' +
      '</div>';
    }
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null'); } catch (e) {}
    if (!cached || cached.error) {
      // Fire fetch and render placeholder; _paint will re-run when it returns.
      fetchWeather().then(_paint).catch(_paint);
      return '<div class="fw-card fw-card-weather">' +
        '<div class="fw-card-head"><span class="fw-card-icon">⛅</span> Weather</div>' +
        '<div class="fw-card-empty">Loading…</div>' +
      '</div>';
    }
    var p = cached.payload || {};
    var current = p.current_weather || {};
    var labelInfo = _wxLabel(current.weathercode);
    var emoji = labelInfo[0], desc = labelInfo[1];
    var d = p.daily || {};
    var hi = d.temperature_2m_max && d.temperature_2m_max[0];
    var lo = d.temperature_2m_min && d.temperature_2m_min[0];
    var sug = _suggest(cached);

    return '<div class="fw-card fw-card-weather">' +
      '<div class="fw-card-head"><span class="fw-card-icon">⛅</span> ' + _esc(loc.label || 'Weather') + '</div>' +
      '<div class="fw-weather-now">' +
        '<div class="fw-weather-icon">' + emoji + '</div>' +
        '<div>' +
          '<div class="fw-weather-temp">' + Math.round(current.temperature || 0) + '°</div>' +
          '<div class="fw-weather-meta">' + _esc(desc) +
            (typeof hi === 'number' && typeof lo === 'number'
              ? ' · H ' + Math.round(hi) + '° / L ' + Math.round(lo) + '°'
              : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      (sug ? '<div class="fw-weather-suggest ' + _esc(sug.mood) + '">' +
        '<span class="when">' + _esc(sug.when) + '</span>' +
        _esc(sug.text) +
      '</div>' : '') +
      '<div class="fw-weather-cta"><a onclick="FamilyWall.openLocationModal()">Change location</a></div>' +
    '</div>';
  }

  function _renderRoutinesCard(profiles) {
    if (!profiles.length || typeof Routines === 'undefined' || !Routines.getStatusFor) {
      return '<div class="fw-card fw-card-routines">' +
        '<div class="fw-card-head"><span class="fw-card-icon">📋</span> Routines</div>' +
        '<div class="fw-card-empty">Add a profile to start tracking routines.</div>' +
      '</div>';
    }
    var rows = profiles.map(function(p) {
      var status = Routines.getStatusFor(p.name);
      if (!status) return '';
      var morningChips = status.morning.items.map(function(it) {
        return '<button class="fw-r-task ' + (it.done ? 'done' : '') + '" ' +
                 'onclick="FamilyWall.toggleRoutine(\'' + _escAttr(p.name) + '\', \'morning\', \'' + _escAttr(it.id) + '\')">' +
          '<span class="fw-r-check">' + (it.done ? '✓' : '') + '</span>' +
          _esc(it.label) +
        '</button>';
      }).join('');
      var eveningChips = status.evening.items.map(function(it) {
        return '<button class="fw-r-task ' + (it.done ? 'done' : '') + '" ' +
                 'onclick="FamilyWall.toggleRoutine(\'' + _escAttr(p.name) + '\', \'evening\', \'' + _escAttr(it.id) + '\')">' +
          '<span class="fw-r-check">' + (it.done ? '✓' : '') + '</span>' +
          _esc(it.label) +
        '</button>';
      }).join('');
      return '<div class="fw-r-kid" style="--avatar-color:' + _esc(p.color || '#A78BFA') + '">' +
          '<div class="fw-r-kid-avatar">' + _esc(p.avatar || '🦊') + '</div>' +
          '<div>' +
            '<div class="fw-r-kid-name">' + _esc(p.name) + '</div>' +
            (status.streak > 0 ? '<div class="fw-r-streak">🔥 ' + status.streak + ' day streak</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="fw-r-tasks">' +
          (morningChips ? '<div class="fw-r-section"><span class="fw-r-section-label">🌅 AM</span>' + morningChips + '</div>' : '') +
          (eveningChips ? '<div class="fw-r-section"><span class="fw-r-section-label">🌙 PM</span>' + eveningChips + '</div>' : '') +
        '</div>';
    }).join('');

    return '<div class="fw-card fw-card-routines">' +
      '<div class="fw-card-head"><span class="fw-card-icon">📋</span> Routines · today</div>' +
      '<div class="fw-routines">' +
        '<div class="fw-routines-head"><div>Kid</div><div>Tasks</div></div>' +
        rows +
      '</div>' +
    '</div>';
  }

  function _renderCalendarCard() {
    return '<div class="fw-card fw-card-calendar" id="fw-calendar-card">' +
      '<div class="fw-card-head"><span class="fw-card-icon">📅</span> Today</div>' +
      _calendarBodyHtml() +
    '</div>';
  }

  function _calendarBodyHtml() {
    if (typeof FamilyCalendar === 'undefined' || !FamilyCalendar.getUpcoming) {
      return '<div class="fw-card-empty">Family Calendar not loaded.</div>';
    }
    var events;
    try {
      var todayStr = new Date().toDateString();
      events = FamilyCalendar.getUpcoming(50).filter(function(ev) {
        return ev.start && typeof ev.start.toDateString === 'function' &&
               ev.start.toDateString() === todayStr;
      });
    } catch (e) {
      // A bad cached event shouldn't black out the whole wall.
      return '<div class="fw-card-empty">Calendar unavailable right now.</div>';
    }
    if (!events.length) {
      var urls = FamilyCalendar.getUrls();
      if (!urls.length) {
        return '<div class="fw-card-empty">No calendars yet — add one in Parents Corner on the hub.</div>';
      }
      return '<div class="fw-card-empty">No events scheduled for today.</div>';
    }
    return events.slice(0, 6).map(function(ev) {
      var when = ev.allDay ? 'All day'
        : ev.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return '<div class="fw-event-row">' +
        '<div class="fw-stripe" style="--stripe:' + _esc(ev.calColor || '#60A5FA') + '"></div>' +
        '<div class="fw-when">' + _esc(when) + '</div>' +
        '<div class="fw-summary">' + _esc(ev.summary) + '</div>' +
      '</div>';
    }).join('');
  }

  function _paintCalendar() {
    var card = document.getElementById('fw-calendar-card');
    if (!card) return;
    card.innerHTML = '<div class="fw-card-head"><span class="fw-card-icon">📅</span> Today</div>' + _calendarBodyHtml();
  }

  function _renderWeekCard() {
    return '<div class="fw-card fw-card-week" id="fw-week-card">' +
      '<div class="fw-card-head"><span class="fw-card-icon">🗓</span> This week</div>' +
      _weekBodyHtml() +
    '</div>';
  }

  function _weekBodyHtml() {
    if (typeof FamilyCalendar === 'undefined' || !FamilyCalendar.getUpcoming) {
      return '<div class="fw-card-empty">Family Calendar not loaded.</div>';
    }
    var urls;
    try { urls = FamilyCalendar.getUrls(); } catch (e) { urls = []; }
    if (!urls.length) {
      return '<div class="fw-card-empty">No calendars yet — add one in Parents Corner.</div>';
    }

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var endOfRange = new Date(today.getTime() + 7 * 86400000);
    var events;
    try {
      events = FamilyCalendar.getUpcoming(500).filter(function(ev) {
        return ev.start && typeof ev.start.getTime === 'function' &&
               ev.start.getTime() >= today.getTime() &&
               ev.start.getTime() < endOfRange.getTime();
      });
    } catch (e) {
      return '<div class="fw-card-empty">Calendar unavailable right now.</div>';
    }

    // Bucket by YYYY-MM-DD so we can render 7 day groups in order.
    var buckets = {};
    events.forEach(function(ev) {
      var d = new Date(ev.start);
      d.setHours(0, 0, 0, 0);
      var key = d.toDateString();
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(ev);
    });

    var inner = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(today.getTime() + i * 86400000);
      var key = d.toDateString();
      var dayEvents = buckets[key] || [];
      // Skip the first day (today) — already in the "Today" tile.
      // Skip days with no events except tomorrow (so the kid has at
      // least one anchor when nothing's happening this week).
      if (i === 0) continue;
      if (!dayEvents.length && i > 1) continue;

      var dayLabel = i === 1 ? 'Tomorrow' :
        d.toLocaleDateString(undefined, { weekday: 'long' });
      var dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      inner += '<div class="fw-week-day">' +
        '<div class="fw-week-day-head">' +
          '<span class="fw-week-day-name">' + _esc(dayLabel) + '</span>' +
          '<span class="fw-week-day-date">' + _esc(dateLabel) + '</span>' +
        '</div>';
      if (!dayEvents.length) {
        inner += '<div class="fw-week-empty">No events.</div>';
      } else {
        dayEvents.forEach(function(ev) {
          var when = ev.allDay ? 'All day'
            : ev.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          inner += '<div class="fw-event-row">' +
            '<div class="fw-stripe" style="--stripe:' + _esc(ev.calColor || '#60A5FA') + '"></div>' +
            '<div class="fw-when">' + _esc(when) + '</div>' +
            '<div class="fw-summary">' + _esc(ev.summary) + '</div>' +
          '</div>';
        });
      }
      inner += '</div>';
    }

    if (!inner) {
      return '<div class="fw-card-empty">Nothing on the calendar for the next 7 days.</div>';
    }
    return '<div class="fw-week-body">' + inner + '</div>';
  }

  function _paintWeek() {
    var card = document.getElementById('fw-week-card');
    if (!card) return;
    card.innerHTML = '<div class="fw-card-head"><span class="fw-card-icon">🗓</span> This week</div>' + _weekBodyHtml();
  }

  function _renderMenuCard() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem('zs_menu') || '{}'); } catch (e) { raw = {}; }
    var weeks = raw.weeks || {};
    var monIso = _mondayIsoOf(new Date());
    var week = weeks[monIso] || {};
    var dayId = _todayDayId();
    var meals = week[dayId] || { breakfast: '', lunch: '', dinner: '' };

    function row(emoji, label, value) {
      var v = (value || '').trim();
      return '<div class="fw-menu-row">' +
        '<div class="fw-menu-meal">' + emoji + ' ' + label + '</div>' +
        '<div class="fw-menu-text ' + (v ? '' : 'empty') + '">' + (v ? _esc(v) : 'Sin asignar') + '</div>' +
      '</div>';
    }
    var anyMeal = !!(meals.breakfast || meals.lunch || meals.dinner);

    return '<div class="fw-card fw-card-menu">' +
      '<div class="fw-card-head"><span class="fw-card-icon">🍽️</span> Today\'s menu</div>' +
      (anyMeal
        ? row('🥣', 'Desayuno', meals.breakfast) +
          row('🍽', 'Almuerzo', meals.lunch) +
          row('🌙', 'Cena', meals.dinner)
        : '<div class="fw-card-empty">No meals planned for today. <a href="menu.html">Plan the week →</a></div>') +
    '</div>';
  }

  function _renderShoppingCard() {
    var items;
    try { items = JSON.parse(localStorage.getItem('zs_shopping_list') || '[]'); }
    catch (e) { items = []; }
    if (!Array.isArray(items)) items = [];
    var pending = items.filter(function(it) { return !it.checked; });
    if (!pending.length) {
      return '<div class="fw-card fw-card-shopping">' +
        '<div class="fw-card-head"><span class="fw-card-icon">🛒</span> Shopping list</div>' +
        '<div class="fw-card-empty">All caught up. <a href="shopping-list.html">Add items →</a></div>' +
      '</div>';
    }
    var top = pending.slice(0, 6).map(function(it) {
      return '<div class="fw-shop-row">' +
        '<div class="fw-shop-cat">' + _esc(it.category || 'Other') + '</div>' +
        '<div class="fw-summary">' + _esc(it.name || it.label || '') + '</div>' +
      '</div>';
    }).join('');
    var more = pending.length > 6 ? '<div class="fw-shop-more">+ ' + (pending.length - 6) + ' more</div>' : '';
    return '<div class="fw-card fw-card-shopping">' +
      '<div class="fw-card-head"><span class="fw-card-icon">🛒</span> Shopping list · ' + pending.length + ' items</div>' +
      top + more +
    '</div>';
  }

  function _renderQuickCard() {
    return '<div class="fw-card fw-card-quick">' +
      '<div class="fw-card-head"><span class="fw-card-icon">🚀</span> Jump in</div>' +
      '<div class="fw-quick">' +
        '<a href="menu.html"><span class="icon">🍽️</span> Weekly menu</a>' +
        '<a href="shopping-list.html"><span class="icon">🛒</span> Shopping list</a>' +
        '<a href="home-timer.html"><span class="icon">⏱</span> Home timer</a>' +
        '<a href="vacation.html"><span class="icon">✈️</span> Vacation</a>' +
        '<a href="index.html"><span class="icon">🏠</span> All apps</a>' +
      '</div>' +
    '</div>';
  }

  // ---- Avatar tap → log in as that kid and go to hub ----
  function loginAs(name) {
    if (!name) return;
    var profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    var p = profiles.filter(function(x) { return x.name === name; })[0];
    if (!p) return;
    if (typeof setActiveUser === 'function') setActiveUser(p);
    try { window._activeUserCached = false; } catch (e) {}
    window.location.href = 'index.html';
  }

  // ---- Routine toggle ----
  function toggleRoutine(name, routine, itemId) {
    if (typeof Routines === 'undefined' || !Routines.toggleFor) return;
    Routines.toggleFor(name, routine, itemId);
    _paint();
  }

  // ---- Location modal ----
  function openLocationModal() {
    var m = document.getElementById('fw-loc-modal');
    if (m) m.classList.add('active');
  }
  function closeLocationModal() {
    var m = document.getElementById('fw-loc-modal');
    if (m) m.classList.remove('active');
  }

  function _populateCityList() {
    var el = document.getElementById('fw-loc-cities');
    if (!el) return;
    el.innerHTML = CITY_PRESETS.map(function(c) {
      return '<button class="fw-loc-city" onclick="FamilyWall._pickCity(' + c.lat + ',' + c.lon + ',\'' + _escAttr(c.label) + '\')">' +
        _esc(c.label) +
      '</button>';
    }).join('');
  }

  function _pickCity(lat, lon, label) {
    setLocation({ lat: lat, lon: lon, label: label });
    closeLocationModal();
    _paint();
  }

  function requestGeo() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser. Pick a city instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        setLocation({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
          label: 'Home'
        });
        closeLocationModal();
        _paint();
      },
      function(err) { alert('Could not get your location: ' + err.message); },
      { timeout: 10000 }
    );
  }

  function _escAttr(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ---- Init ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _paint);
  } else {
    _paint();
  }

  return {
    paint: _paint,
    loginAs: loginAs,
    toggleRoutine: toggleRoutine,
    openLocationModal: openLocationModal,
    closeLocationModal: closeLocationModal,
    requestGeo: requestGeo,
    setLocation: setLocation,
    getLocation: getLocation,
    _pickCity: _pickCity
  };
})();
