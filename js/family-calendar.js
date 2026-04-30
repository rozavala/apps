/* ================================================================
   FAMILY CALENDAR — read-only iCal mirror (#150 v1)

   Surfaces a shared family Google Calendar (or any iCal feed) on
   the hub. Parents add public .ics URLs in Parents Corner; the
   client fetches, parses, expands the next ~30 days of events,
   and shows the next 3 on the hub.

   Storage:
     zs_fcal_urls   = [{ id, label, url, color, addedTs }]
     zs_fcal_cache  = {
       url: { fetchedTs, etag, events: [{uid, summary, start, end, allDay}] }
     }

   Limitations (v1):
   - Recurrence: FREQ DAILY/WEEKLY/MONTHLY/YEARLY with INTERVAL,
     UNTIL, COUNT. BYDAY not implemented (Google Calendar's typical
     "every Mon/Wed" rules will collapse to FREQ=WEEKLY without
     respecting day list — events still appear at the right cadence
     starting from DTSTART).
   - Timezones: events tagged with TZID (e.g. Google Calendar's
     TZID=America/Santiago) are converted to a real UTC instant via
     Intl.DateTimeFormat, so they display correctly even when the
     source calendar's zone differs from this device's zone.
     Floating-time events (no TZID, no Z suffix) fall back to local.
   - No write-back. No OAuth. Public ICS URLs only.
   ================================================================ */

var FamilyCalendar = (function() {
  'use strict';

  var URLS_KEY = 'zs_fcal_urls';
  var CACHE_KEY = 'zs_fcal_cache';
  var CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  var EXPAND_DAYS = 30;

  // ---- Storage ----
  function getUrls() {
    try { return JSON.parse(localStorage.getItem(URLS_KEY) || '[]') || []; }
    catch (e) { return []; }
  }

  function _saveUrls(urls) {
    try {
      localStorage.setItem(URLS_KEY, JSON.stringify(urls));
      // Calendar URLs are household-shared; mirror them to the VPS so
      // every device sees the same family calendars.
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(URLS_KEY);
    } catch (e) {}
  }

  function addUrl(label, url, color) {
    var urls = getUrls();
    if (!url || !/^https?:/.test(url)) throw new Error('URL must start with http(s)://');
    urls.push({
      id: 'cal_' + Date.now().toString(36),
      label: label || 'Calendar',
      url: url,
      color: color || '#60A5FA',
      addedTs: Date.now()
    });
    _saveUrls(urls);
    // Kick off a fetch so the hub updates without waiting for next refresh.
    refresh(true).catch(function() {});
    return urls[urls.length - 1];
  }

  function removeUrl(id) {
    var urls = getUrls().filter(function(u) { return u.id !== id; });
    _saveUrls(urls);
    var cache = _getCache();
    var keptUrls = {};
    urls.forEach(function(u) { keptUrls[u.url] = 1; });
    var newCache = {};
    Object.keys(cache).forEach(function(k) { if (keptUrls[k]) newCache[k] = cache[k]; });
    _saveCache(newCache);
  }

  function _getCache() {
    try {
      var raw = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
      // Re-hydrate Date fields after JSON round-trip — saved events
      // store start/end/rrule.until as Dates but JSON serializes them
      // to ISO strings. Without this, _expand throws when calling
      // start.getTime() on a string (#150 hot fix).
      Object.keys(raw).forEach(function(url) {
        var entry = raw[url];
        if (!entry || !Array.isArray(entry.events)) return;
        entry.events.forEach(function(ev) {
          if (ev.start && !(ev.start instanceof Date)) ev.start = new Date(ev.start);
          if (ev.end   && !(ev.end   instanceof Date)) ev.end   = new Date(ev.end);
          if (ev.rrule && ev.rrule.until && !(ev.rrule.until instanceof Date)) {
            ev.rrule.until = new Date(ev.rrule.until);
          }
        });
      });
      return raw;
    }
    catch (e) { return {}; }
  }

  function _saveCache(cache) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
  }

  // ---- ICS parsing ----
  // Unfold continuation lines per RFC 5545 (a leading space/tab on
  // a line means "append to previous line, no newline").
  function _unfold(text) {
    return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  }

  // Convert (y, m, d, hh, mn, ss) wall-clock numbers in a given IANA
  // timezone into a real UTC instant. Strategy: pretend the wall-clock
  // numbers ARE UTC, then ask Intl what wall-clock that "fake UTC"
  // displays as in the target zone. The difference between the two is
  // the zone's offset at that moment — subtract it and we land on the
  // correct UTC instant. Falls back to a local-time Date if the zone
  // is unknown or Intl is unavailable (older WebKit).
  function _wallTimeInTzToDate(y, m, d, hh, mn, ss, tzid) {
    try {
      var asUtc = Date.UTC(y, m, d, hh, mn, ss);
      var dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tzid, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      var parts = dtf.formatToParts(new Date(asUtc));
      var p = {};
      parts.forEach(function(x) { p[x.type] = x.value; });
      var displayed = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
      return new Date(asUtc - (displayed - asUtc));
    } catch (e) {
      return new Date(y, m, d, hh, mn, ss);
    }
  }

  function _parseIcsDate(value, tzid) {
    if (!value) return null;
    // Date only: YYYYMMDD
    if (/^\d{8}$/.test(value)) {
      var y = +value.slice(0, 4), m = +value.slice(4, 6) - 1, d = +value.slice(6, 8);
      return { date: new Date(y, m, d, 0, 0, 0), allDay: true };
    }
    // Datetime: YYYYMMDDTHHMMSS[Z]
    var match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
    if (match) {
      var yy = +match[1], mm = +match[2] - 1, dd = +match[3];
      var hh = +match[4], mn = +match[5], ss = +match[6];
      var dt;
      if (match[7] === 'Z') {
        dt = new Date(Date.UTC(yy, mm, dd, hh, mn, ss));
      } else if (tzid) {
        dt = _wallTimeInTzToDate(yy, mm, dd, hh, mn, ss, tzid);
      } else {
        // Floating time — no zone info. Treat as device-local.
        dt = new Date(yy, mm, dd, hh, mn, ss);
      }
      return { date: dt, allDay: false };
    }
    return null;
  }

  // Pull the parameter map out of a property's left-hand side. For
  // `DTSTART;TZID=America/Santiago;VALUE=DATE-TIME`, returns
  // `{ TZID: 'America/Santiago', VALUE: 'DATE-TIME' }`.
  function _parseParams(lhs) {
    var params = {};
    var parts = lhs.split(';');
    for (var i = 1; i < parts.length; i++) {
      var eq = parts[i].indexOf('=');
      if (eq < 0) continue;
      params[parts[i].slice(0, eq)] = parts[i].slice(eq + 1);
    }
    return params;
  }

  function parseIcs(text) {
    if (!text) return [];
    var unfolded = _unfold(text);
    var lines = unfolded.split(/\r?\n/);
    var events = [];
    var cur = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line === 'BEGIN:VEVENT') { cur = { rrule: null }; continue; }
      if (line === 'END:VEVENT') {
        if (cur && cur.start) events.push(cur);
        cur = null; continue;
      }
      if (!cur) continue;
      // KEY[;PARAMS]:VALUE
      var colon = line.indexOf(':');
      if (colon < 0) continue;
      var lhs = line.slice(0, colon);
      var value = line.slice(colon + 1);
      var semi = lhs.indexOf(';');
      var key = semi < 0 ? lhs : lhs.slice(0, semi);
      switch (key) {
        case 'UID':       cur.uid = value; break;
        case 'SUMMARY':   cur.summary = _unescapeText(value); break;
        case 'LOCATION':  cur.location = _unescapeText(value); break;
        case 'DTSTART':   var sParams = _parseParams(lhs); var s = _parseIcsDate(value, sParams.TZID); if (s) { cur.start = s.date; cur.allDay = s.allDay; if (sParams.TZID) cur.tzid = sParams.TZID; } break;
        case 'DTEND':     var eParams = _parseParams(lhs); var e = _parseIcsDate(value, eParams.TZID); if (e) cur.end = e.date; break;
        case 'RRULE':     cur.rrule = _parseRrule(value); break;
        default: /* ignore */ break;
      }
    }
    return events;
  }

  function _unescapeText(v) {
    return String(v || '')
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  function _parseRrule(value) {
    var rule = {};
    value.split(';').forEach(function(part) {
      var eq = part.indexOf('=');
      if (eq < 0) return;
      var k = part.slice(0, eq);
      var v = part.slice(eq + 1);
      rule[k] = v;
    });
    if (!rule.FREQ) return null;
    return {
      freq: rule.FREQ,
      interval: rule.INTERVAL ? parseInt(rule.INTERVAL, 10) : 1,
      until: rule.UNTIL ? (_parseIcsDate(rule.UNTIL) || {}).date : null,
      count: rule.COUNT ? parseInt(rule.COUNT, 10) : null
    };
  }

  // Read wall-clock parts of `date` in `tzid` (or local if no tzid).
  // Used to anchor recurrences in the source calendar's zone so they
  // don't drift when the device crosses a DST boundary.
  function _wallPartsOf(date, tzid) {
    if (tzid) {
      try {
        var dtf = new Intl.DateTimeFormat('en-US', {
          timeZone: tzid, hourCycle: 'h23',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        var parts = dtf.formatToParts(date);
        var p = {};
        parts.forEach(function(x) { p[x.type] = x.value; });
        return { y: +p.year, m: +p.month - 1, d: +p.day, hh: +p.hour, mn: +p.minute, ss: +p.second };
      } catch (e) {}
    }
    return {
      y: date.getFullYear(), m: date.getMonth(), d: date.getDate(),
      hh: date.getHours(), mn: date.getMinutes(), ss: date.getSeconds()
    };
  }

  // Add a calendar offset to wall-clock parts using a UTC scratch Date
  // (UTC has no DST, so date arithmetic is exact). Returns new parts.
  function _addToParts(parts, deltaDays, deltaMonths, deltaYears) {
    var d = new Date(Date.UTC(parts.y, parts.m, parts.d, parts.hh, parts.mn, parts.ss));
    if (deltaDays)   d.setUTCDate(d.getUTCDate() + deltaDays);
    if (deltaMonths) d.setUTCMonth(d.getUTCMonth() + deltaMonths);
    if (deltaYears)  d.setUTCFullYear(d.getUTCFullYear() + deltaYears);
    return {
      y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(),
      hh: d.getUTCHours(), mn: d.getUTCMinutes(), ss: d.getUTCSeconds()
    };
  }

  function _partsToDate(parts, tzid) {
    if (tzid) return _wallTimeInTzToDate(parts.y, parts.m, parts.d, parts.hh, parts.mn, parts.ss, tzid);
    return new Date(parts.y, parts.m, parts.d, parts.hh, parts.mn, parts.ss);
  }

  // Expand a single VEVENT into instances within [from, to].
  function _expand(event, from, to) {
    var instances = [];
    if (!event || !event.start) return instances;

    function pushInstance(start) {
      var duration = (event.end && event.start) ? (event.end - event.start) : 0;
      instances.push({
        uid: event.uid || (start.getTime() + '_' + (event.summary || '')),
        summary: event.summary || '(no title)',
        location: event.location || '',
        start: new Date(start.getTime()),
        end: duration ? new Date(start.getTime() + duration) : null,
        allDay: !!event.allDay
      });
    }

    if (!event.rrule) {
      if (event.start >= from && event.start <= to) pushInstance(event.start);
      return instances;
    }

    var rr = event.rrule;
    // Anchor recurrences on the wall-clock parts in the source zone so
    // a 14:00 LA weekly event stays at 14:00 LA across DST boundaries
    // (instead of drifting by the offset every time we cross spring-
    // forward / fall-back). All-day events have no zone — use local.
    var tzid = event.allDay ? null : event.tzid;
    var basis = _wallPartsOf(event.start, tzid);
    var n = 0;
    var maxIter = 366 * 2;
    while (n < maxIter) {
      var nextParts;
      if (rr.freq === 'DAILY')        nextParts = _addToParts(basis, n * rr.interval, 0, 0);
      else if (rr.freq === 'WEEKLY')  nextParts = _addToParts(basis, n * rr.interval * 7, 0, 0);
      else if (rr.freq === 'MONTHLY') nextParts = _addToParts(basis, 0, n * rr.interval, 0);
      else if (rr.freq === 'YEARLY')  nextParts = _addToParts(basis, 0, 0, n * rr.interval);
      else break;

      var cur = _partsToDate(nextParts, tzid);
      if (rr.until && cur > rr.until) break;
      if (rr.count && n >= rr.count) break;
      if (cur > to) break;
      if (cur >= from) pushInstance(cur);
      n++;
    }
    return instances;
  }

  // ---- Fetch + cache ----
  // Most public iCal hosts (Google Calendar, iCloud, Outlook) don't
  // return CORS headers, so a direct browser fetch is blocked. When
  // a sync server URL is configured we route through its /api/ical
  // proxy (allowlisted, server-side fetch). We do NOT gate on
  // CloudSync.online — that flag is set asynchronously after a ping
  // completes, and the first calendar refresh fires before the ping
  // resolves, which used to cause a direct fetch and a CORS block.
  // If the proxy is unreachable, fall back to direct (works for
  // hosts that already send CORS, eg. self-hosted Nextcloud).
  function _fetchIcs(url) {
    var useProxy = (typeof CloudSync !== 'undefined') &&
                   CloudSync.isConfigured && CloudSync.isConfigured() &&
                   CloudSync.server;
    var primary = useProxy
      ? CloudSync.server + '/api/ical?url=' + encodeURIComponent(url)
      : url;

    return fetch(primary, { cache: 'no-store' })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .catch(function(err) {
        if (!useProxy) throw err;
        // Proxy unreachable — try direct as a last resort.
        return fetch(url, { cache: 'no-store' }).then(function(res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        });
      });
  }

  function refresh(force) {
    var urls = getUrls();
    if (!urls.length) return Promise.resolve([]);
    var cache = _getCache();
    var now = Date.now();

    var jobs = urls.map(function(u) {
      var entry = cache[u.url];
      if (!force && entry && entry.fetchedTs && (now - entry.fetchedTs) < CACHE_TTL_MS) {
        return Promise.resolve();
      }
      return _fetchIcs(u.url)
        .then(function(text) {
          cache[u.url] = {
            fetchedTs: now,
            events: parseIcs(text)
          };
        })
        .catch(function(e) {
          if (!cache[u.url]) cache[u.url] = { fetchedTs: 0, events: [], error: String(e && e.message || e) };
          else cache[u.url].error = String(e && e.message || e);
        });
    });

    return Promise.all(jobs).then(function() {
      _saveCache(cache);
      return cache;
    });
  }

  function getUpcoming(maxCount) {
    var urls = getUrls();
    var cache = _getCache();
    var from = new Date(); from.setHours(0, 0, 0, 0);
    var to = new Date(from.getTime() + EXPAND_DAYS * 86400000);
    var out = [];
    urls.forEach(function(u) {
      var entry = cache[u.url];
      if (!entry || !entry.events) return;
      entry.events.forEach(function(ev) {
        _expand(ev, from, to).forEach(function(inst) {
          out.push(Object.assign({}, inst, { calLabel: u.label, calColor: u.color }));
        });
      });
    });
    out.sort(function(a, b) { return a.start - b.start; });
    return out.slice(0, maxCount || 100);
  }

  // ---- Hub widget ----
  function renderHubWidget(elId) {
    var el = document.getElementById(elId || 'family-calendar-widget');
    if (!el) return;
    var urls = getUrls();
    if (!urls.length) {
      el.innerHTML = '';
      return;
    }
    // Trigger a refresh in the background; render whatever's cached now.
    refresh(false).then(function() { _paintHubWidget(el); }).catch(function() { _paintHubWidget(el); });
    _paintHubWidget(el);
  }

  function _paintHubWidget(el) {
    var events = getUpcoming(3);
    var head = '<div class="fcal-widget-head">' +
      '<span class="fcal-w-icon">📅</span>' +
      '<span class="fcal-w-title">Family Calendar</span>' +
    '</div>';
    if (!events.length) {
      el.innerHTML = '<div class="fcal-widget">' + head +
        '<div class="fcal-w-empty">No upcoming events in the next ' + EXPAND_DAYS + ' days.</div>' +
      '</div>';
      return;
    }
    var rows = events.map(function(ev) {
      return '<div class="fcal-w-row" style="--fcal-color:' + _esc(ev.calColor || '#60A5FA') + ';">' +
        '<div class="fcal-w-when">' + _formatWhen(ev) + '</div>' +
        '<div class="fcal-w-summary">' + _esc(ev.summary) + '</div>' +
      '</div>';
    }).join('');
    el.innerHTML = '<div class="fcal-widget">' + head + rows + '</div>';
  }

  function _formatWhen(ev) {
    var now = new Date();
    var sameDay = ev.start.toDateString() === now.toDateString();
    var tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    var sameTomorrow = ev.start.toDateString() === tomorrow.toDateString();
    var dateLabel = sameDay ? 'Today' : sameTomorrow ? 'Tomorrow'
      : ev.start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (ev.allDay) return dateLabel + ' · all day';
    var time = ev.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return dateLabel + ' · ' + time;
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---- Parents Corner editor ----
  function renderEditor(elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    var urls = getUrls();
    var rows = urls.length ? urls.map(function(u) {
      return '<div class="fcal-row">' +
        '<span class="fcal-row-dot" style="background:' + _esc(u.color) + '"></span>' +
        '<div class="fcal-row-body">' +
          '<div class="fcal-row-label">' + _esc(u.label) + '</div>' +
          '<div class="fcal-row-url">' + _esc(u.url) + '</div>' +
        '</div>' +
        '<button class="fcal-row-del" onclick="FamilyCalendar._removeAndRender(\'' + u.id + '\')">✕</button>' +
      '</div>';
    }).join('') : '<div class="fcal-empty">No calendars yet.</div>';

    el.innerHTML =
      '<div class="fcal-editor">' +
        '<div class="fcal-editor-title">📅 Family Calendar (read-only iCal)</div>' +
        '<p class="fcal-editor-help">Paste a public Google Calendar <code>.ics</code> URL (Settings → "Secret address in iCal format"). Events refresh every ~10 min.</p>' +
        rows +
        '<div class="fcal-add">' +
          '<input type="text" id="fcal-new-label" placeholder="Label (e.g. Family)" maxlength="30" />' +
          '<input type="text" id="fcal-new-url" placeholder="https://calendar.google.com/.../basic.ics" />' +
          '<button class="fcal-add-btn" onclick="FamilyCalendar._addAndRender()">＋ Add</button>' +
        '</div>' +
        '<div id="fcal-editor-msg" class="fcal-editor-msg"></div>' +
      '</div>';
  }

  function _addAndRender() {
    var label = (document.getElementById('fcal-new-label') || {}).value || '';
    var url = (document.getElementById('fcal-new-url') || {}).value || '';
    var msg = document.getElementById('fcal-editor-msg');
    try {
      addUrl(label.trim() || 'Calendar', url.trim());
      if (msg) { msg.textContent = 'Added ✓ — fetching events…'; msg.style.color = '#34D399'; }
      // Re-render the editor and the hub widget if it's there.
      var holder = document.querySelector('[data-fcal-editor]');
      if (holder) renderEditor(holder.id);
      renderHubWidget('family-calendar-widget');
    } catch (e) {
      if (msg) { msg.textContent = String(e.message || e); msg.style.color = '#F87171'; }
    }
  }

  function _removeAndRender(id) {
    if (!confirm('Remove this calendar?')) return;
    removeUrl(id);
    var holder = document.querySelector('[data-fcal-editor]');
    if (holder) renderEditor(holder.id);
    renderHubWidget('family-calendar-widget');
  }

  // Auto-mount the hub widget if its container exists.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { renderHubWidget('family-calendar-widget'); });
  } else {
    renderHubWidget('family-calendar-widget');
  }

  // When another device pushes new calendar URLs (handled by sync.js
  // pullHousehold → fires `zs:household-synced`), re-render the hub
  // widget. This also force-fetches any newly-pulled URLs that have
  // no local cache entry yet.
  if (typeof window !== 'undefined') {
    window.addEventListener('zs:household-synced', function() {
      renderHubWidget('family-calendar-widget');
      // Also re-render any open editor so the row list updates.
      var holder = document.querySelector('[data-fcal-editor]');
      if (holder) { try { renderEditor(holder.id); } catch (e) {} }
    });
  }

  return {
    getUrls: getUrls,
    addUrl: addUrl,
    removeUrl: removeUrl,
    refresh: refresh,
    getUpcoming: getUpcoming,
    renderHubWidget: renderHubWidget,
    renderEditor: renderEditor,
    parseIcs: parseIcs,
    _addAndRender: _addAndRender,
    _removeAndRender: _removeAndRender
  };
})();
