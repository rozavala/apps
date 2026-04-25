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
   - Timezones: TZID tag is stripped and the time is treated as
     local. Good enough for one-household calendars.
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
    try { localStorage.setItem(URLS_KEY, JSON.stringify(urls)); } catch (e) {}
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
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; }
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

  function _parseIcsDate(value) {
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
      var dt = match[7] === 'Z'
        ? new Date(Date.UTC(yy, mm, dd, hh, mn, ss))
        : new Date(yy, mm, dd, hh, mn, ss);
      return { date: dt, allDay: false };
    }
    return null;
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
        case 'DTSTART':   var s = _parseIcsDate(value); if (s) { cur.start = s.date; cur.allDay = s.allDay; } break;
        case 'DTEND':     var e = _parseIcsDate(value); if (e) cur.end = e.date; break;
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

  // Expand a single VEVENT into instances within [from, to].
  function _expand(event, from, to) {
    var instances = [];
    if (!event || !event.start) return instances;

    function pushIfInRange(start) {
      if (start < from || start > to) return;
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
      pushIfInRange(event.start);
      return instances;
    }

    var rr = event.rrule;
    var step = { DAILY: 1, WEEKLY: 7, MONTHLY: 0, YEARLY: 0 }[rr.freq] || 0;
    var cur = new Date(event.start.getTime());
    var n = 0;
    var maxIter = 366 * 2;
    while (n < maxIter) {
      if (rr.until && cur > rr.until) break;
      if (rr.count && n >= rr.count) break;
      if (cur > to) break;
      pushIfInRange(cur);
      n++;
      // Advance by interval according to freq
      if (rr.freq === 'DAILY' || rr.freq === 'WEEKLY') {
        cur = new Date(cur.getTime() + step * rr.interval * 86400000);
      } else if (rr.freq === 'MONTHLY') {
        var next = new Date(cur);
        next.setMonth(next.getMonth() + rr.interval);
        cur = next;
      } else if (rr.freq === 'YEARLY') {
        var nextY = new Date(cur);
        nextY.setFullYear(nextY.getFullYear() + rr.interval);
        cur = nextY;
      } else {
        break;
      }
    }
    return instances;
  }

  // ---- Fetch + cache ----
  // Most public iCal hosts (Google Calendar, iCloud, Outlook) don't
  // return CORS headers, so a direct browser fetch is blocked. When
  // the Tailscale sync server is reachable we route through its
  // /api/ical proxy (allowlisted, server-side fetch). Direct fetch is
  // still attempted as a fallback for hosts that DO send CORS.
  function _fetchIcs(url) {
    var useProxy = (typeof CloudSync !== 'undefined') &&
                   CloudSync.isConfigured && CloudSync.isConfigured() &&
                   CloudSync.online && CloudSync.server;
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
        // Proxy unreachable — try direct as a last resort (works for
        // hosts that already serve CORS).
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
