/* ================================================================
   OFF HOURS — Shared Logic
   School-night quiet time: from the evening until the morning the
   apps are asleep. App pages show a night screen; the hub stays usable
   (routines, calendar, Parents Corner) with its app cards dimmed.

   Settings live in 'zs_off_hours' and sync through the household
   bucket, so one change in Parents Corner reaches every device.
   `days` are the MORNINGS that are protected (0 = Sunday); each one
   also covers the evening before it from `start`. The default is
   school mornings: Sun–Thu nights 21:00 → Mon–Fri 07:20.

   Load with data-mode="hub" on index.html; every other page gets the
   full lock. The parent PIN lifts it for this tab until the window ends.
   ================================================================ */

var OffHours = (function() {
  'use strict';

  var KEY        = 'zs_off_hours';
  var UNLOCK_KEY = 'zs_off_hours_unlock';
  var DEFAULTS   = { enabled: true, start: '21:00', end: '07:20', days: [1, 2, 3, 4, 5] };
  var WARN_MIN   = 5;
  var DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var _script = document.currentScript;
  var _mode   = (_script && _script.getAttribute('data-mode')) || 'lock';
  var _warned = null;

  function getSettings() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    // Browser tests run at whatever time it is; they opt in by storing settings.
    if (!s && navigator.webdriver) return Object.assign({}, DEFAULTS, { enabled: false });
    s = Object.assign({}, DEFAULTS, s || {});
    if (!Array.isArray(s.days)) s.days = DEFAULTS.days.slice();
    if (!/^\d\d:\d\d$/.test(s.start)) s.start = DEFAULTS.start;
    if (!/^\d\d:\d\d$/.test(s.end)) s.end = DEFAULTS.end;
    return s;
  }

  function saveSettings(s) {
    var out = { enabled: !!s.enabled, start: s.start, end: s.end, days: s.days.slice().sort(), _syncedAt: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.push) {
      try { CloudSync.push(KEY); } catch (e) {}
    }
    check();
  }

  function _mins(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function _at(day, mins) {
    var d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    d.setMinutes(mins);
    return d;
  }

  // The off window `now` falls in, as { from, until } Dates, or null.
  function currentWindow(now) {
    now = now || new Date();
    var s = getSettings();
    if (!s.enabled || !s.days.length) return null;
    var start = _mins(s.start), end = _mins(s.end);
    var m = now.getHours() * 60 + now.getMinutes();
    var today = now.getDay();
    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (start > end) {
      // Overnight: the morning part, then the evening before a protected morning.
      if (m < end && s.days.indexOf(today) !== -1) return { from: _at(yesterday, start), until: _at(now, end) };
      if (m >= start && s.days.indexOf(tomorrow.getDay()) !== -1) return { from: _at(now, start), until: _at(tomorrow, end) };
    } else if (m >= start && m < end && s.days.indexOf(today) !== -1) {
      return { from: _at(now, start), until: _at(now, end) };
    }
    return null;
  }

  function _unlockedUntil() {
    try { return parseInt(sessionStorage.getItem(UNLOCK_KEY), 10) || 0; } catch (e) { return 0; }
  }

  // True while the apps are asleep for this tab (no parent unlock).
  function isOff(now) {
    var w = currentWindow(now);
    return !!w && _unlockedUntil() < w.until.getTime();
  }

  function _fmt(hhmm) {
    var p = hhmm.split(':'), h = parseInt(p[0], 10);
    return ((h + 11) % 12 + 1) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function _injectStyles() {
    if (document.getElementById('off-hours-styles')) return;
    var style = document.createElement('style');
    style.id = 'off-hours-styles';
    style.textContent =
      '#off-hours-overlay { position:fixed; inset:0; z-index:2147483000; display:flex; align-items:center; justify-content:center; padding:16px; ' +
        'background:radial-gradient(circle at 50% 30%, #1e2a5a 0%, #0b1026 70%); color:#e8ecff; text-align:center; font-family:var(--font-display, system-ui, sans-serif); }' +
      '#off-hours-overlay .oh-panel { max-width:380px; width:100%; }' +
      '#off-hours-overlay .oh-moon { font-size:84px; line-height:1; margin-bottom:18px; }' +
      '#off-hours-overlay h2 { font-size:1.6rem; margin:0 0 10px; }' +
      '#off-hours-overlay .oh-msg { font-size:1.1rem; line-height:1.5; color:#b9c2ea; margin-bottom:28px; }' +
      '#off-hours-overlay .oh-actions { display:flex; flex-direction:column; gap:12px; }' +
      '#off-hours-overlay .oh-btn { display:block; padding:14px; border-radius:12px; border:none; font:inherit; font-weight:800; font-size:1rem; cursor:pointer; text-decoration:none; }' +
      '#off-hours-overlay .oh-main { background:linear-gradient(135deg,#4338CA,#6366F1); color:#fff; }' +
      '#off-hours-overlay .oh-quiet { background:rgba(255,255,255,0.08); color:#b9c2ea; }' +
      '#off-hours-overlay .oh-pin { display:none; flex-direction:column; gap:10px; }' +
      '#off-hours-overlay .oh-pin input { background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.18); color:#fff; padding:12px; border-radius:10px; text-align:center; font-size:1.5rem; letter-spacing:8px; }' +
      '#off-hours-banner { display:flex; align-items:center; gap:12px; margin:0 0 16px; padding:14px 16px; border-radius:16px; background:#1e2a5a; color:#e8ecff; font-weight:700; }' +
      '#off-hours-banner .oh-b-moon { font-size:1.8rem; }' +
      '#off-hours-banner small { display:block; font-weight:600; color:#b9c2ea; }' +
      'body.zs-off-hours .app-card { opacity:0.4; filter:grayscale(0.8); }';
    document.head.appendChild(style);
  }

  function _showLock(w) {
    _injectStyles();
    var overlay = document.getElementById('off-hours-overlay');
    var s = getSettings();
    var morning = new Date().getHours() < 12;
    var html =
      '<div class="oh-panel" role="dialog" aria-modal="true" aria-labelledby="oh-title">' +
        '<div class="oh-moon">' + (morning ? '🌅' : '🌙') + '</div>' +
        '<h2 id="oh-title">' + (morning ? 'Too early for apps' : 'Apps are asleep') + '</h2>' +
        '<div class="oh-msg">They wake up at ' + _fmt(s.end) + '.' +
          (morning ? ' Get ready for school first!' : ' Time to rest — see you in the morning.') + '</div>' +
        '<div class="oh-actions">' +
          '<a class="oh-btn oh-main" href="index.html">🏠 Back to Home</a>' +
          '<button class="oh-btn oh-quiet" type="button" id="oh-parent-btn">🔒 Parents</button>' +
          '<div class="oh-pin" id="oh-pin">' +
            '<input type="password" id="oh-pin-input" placeholder="····" maxlength="4" inputmode="numeric" aria-label="Parent PIN">' +
            '<button class="oh-btn oh-quiet" type="button" id="oh-pin-ok">Unlock until ' + _fmt(s.end) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'off-hours-overlay';
      document.body.appendChild(overlay);
    }
    if (overlay.getAttribute('data-until') === String(w.until.getTime()) && overlay.getAttribute('data-morning') === String(morning)) return;
    overlay.setAttribute('data-until', String(w.until.getTime()));
    overlay.setAttribute('data-morning', String(morning));
    overlay.innerHTML = html;
    document.getElementById('oh-parent-btn').onclick = function() {
      document.getElementById('oh-pin').style.display = 'flex';
      this.style.display = 'none';
      document.getElementById('oh-pin-input').focus();
    };
    document.getElementById('oh-pin-ok').onclick = _tryPin;
    document.getElementById('oh-pin-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') _tryPin();
    });
  }

  function _tryPin() {
    var input = document.getElementById('oh-pin-input');
    var w = currentWindow();
    if (!input) return;
    if (w && typeof getParentPin === 'function' && input.value === getParentPin()) {
      try { sessionStorage.setItem(UNLOCK_KEY, String(w.until.getTime())); } catch (e) {}
      check();
    } else {
      input.value = '';
      input.style.borderColor = '#ef4444';
      setTimeout(function() { input.style.borderColor = ''; }, 1000);
    }
  }

  function _showBanner() {
    _injectStyles();
    document.body.classList.add('zs-off-hours');
    if (document.getElementById('off-hours-banner')) return;
    var hub = document.getElementById('hub-screen');
    if (!hub) return;
    var morning = new Date().getHours() < 12;
    var banner = document.createElement('div');
    banner.id = 'off-hours-banner';
    banner.innerHTML = '<span class="oh-b-moon">' + (morning ? '🌅' : '🌙') + '</span>' +
      '<span>Apps are asleep until ' + _fmt(getSettings().end) +
      '<small>Routines and the calendar still work.</small></span>';
    var anchor = document.getElementById('app-grid');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(banner, anchor);
    else hub.insertBefore(banner, hub.firstChild);
  }

  function _clear() {
    var o = document.getElementById('off-hours-overlay');
    if (o) o.remove();
    var b = document.getElementById('off-hours-banner');
    if (b) b.remove();
    if (document.body) document.body.classList.remove('zs-off-hours');
  }

  function _maybeWarn(now) {
    if (_mode === 'hub') return;
    var soon = new Date(now.getTime() + WARN_MIN * 60000);
    var w = currentWindow(soon);
    if (!w || currentWindow(now) || _warned === w.until.getTime()) return;
    _warned = w.until.getTime();
    if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) {
      ZsDialog.toast('🌙 Apps go to sleep at ' + _fmt(getSettings().start) + ' — time to finish up.');
    }
  }

  function check() {
    if (!document.body) return;
    var now = new Date();
    var w = currentWindow(now);
    if (w && isOff(now)) {
      if (_mode === 'hub') _showBanner();
      else _showLock(w);
    } else {
      _clear();
      _maybeWarn(now);
    }
  }

  // ── Parents Corner ──────────────────────────────────────────────

  function renderConfig() {
    var s = getSettings();
    var chips = [1, 2, 3, 4, 5, 6, 0].map(function(d) {
      var on = s.days.indexOf(d) !== -1;
      return '<label style="display:flex; align-items:center; gap:4px; padding:6px 10px; border-radius:99px; cursor:pointer; font-size:0.8rem; font-weight:700; ' +
          'background:' + (on ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)') + ';">' +
        '<input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="OffHours.setDay(' + d + ', this.checked)"> ' + DAY_NAMES[d] +
      '</label>';
    }).join('');
    return '<div class="pk-section" id="off-hours-config">' +
      '<h3 style="margin-bottom:12px; font-family:var(--font-display);">🌙 Off Hours</h3>' +
      '<label class="pk-toggle" style="margin-bottom:12px;">' +
        '<input type="checkbox" ' + (s.enabled ? 'checked' : '') + ' onchange="OffHours.set(\'enabled\', this.checked)"> Apps sleep at night' +
      '</label>' +
      '<div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:12px; font-size:0.9rem; font-weight:700;">' +
        '<label>From <input type="time" value="' + s.start + '" onchange="OffHours.set(\'start\', this.value)" ' +
          'style="padding:4px 8px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); color:inherit; border-radius:4px;"></label>' +
        '<label>until <input type="time" value="' + s.end + '" onchange="OffHours.set(\'end\', this.value)" ' +
          'style="padding:4px 8px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); color:inherit; border-radius:4px;"></label>' +
      '</div>' +
      '<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">On these mornings (and the night before):</div>' +
      '<div style="display:flex; gap:6px; flex-wrap:wrap;">' + chips + '</div>' +
    '</div>';
  }

  function set(field, value) {
    var s = getSettings();
    if (field === 'enabled') s.enabled = !!value;
    else if ((field === 'start' || field === 'end') && /^\d\d:\d\d$/.test(value)) s[field] = value;
    else return;
    saveSettings(s);
  }

  function setDay(day, on) {
    var s = getSettings();
    var i = s.days.indexOf(day);
    if (on && i === -1) s.days.push(day);
    if (!on && i !== -1) s.days.splice(i, 1);
    saveSettings(s);
    var box = document.getElementById('off-hours-config');
    if (box) box.outerHTML = renderConfig();
  }

  // ── Init ────────────────────────────────────────────────────────

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
  setInterval(check, 20000);
  document.addEventListener('visibilitychange', function() { if (!document.hidden) check(); });
  window.addEventListener('pageshow', check);
  window.addEventListener('storage', function(e) { if (e.key === KEY) check(); });
  window.addEventListener('zs:household-synced', check);

  return {
    getSettings: getSettings,
    currentWindow: currentWindow,
    isOff: isOff,
    check: check,
    renderConfig: renderConfig,
    set: set,
    setDay: setDay
  };
})();
