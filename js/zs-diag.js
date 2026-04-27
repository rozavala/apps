/* ================================================================
   ZS DIAG — zs-diag.js
   Lightweight error/event capture for the Zavala Serra Apps suite.

   Flow:
     window.onerror / unhandledrejection / console.error
       → local ring buffer in localStorage (`zs_diag_buf`)
       → auto-flush to VPS POST /api/diag on:
            • each captured error (debounced ~2s)
            • visibilitychange to 'hidden'
            • beforeunload
       → manual flush via ZsDiag.flushNow()

   Privacy:
     - Raw entries include profile name & age. They live ONLY on:
         (a) the device's localStorage
         (b) the Tailscale-only VPS
     - A separate scrubber (vps/diag-push.js) strips identifying
       fields before anything is pushed to the public GitHub repo.

   Never sends free-form input text. Only captured:
     - error type / message / stack
     - page URL (pathname only, no query)
     - active profile {name, age}
     - user agent string
     - client-side app id if set via window.ZS_APP
     - last ~10 structured UI breadcrumbs (app-declared, no free text)
   ================================================================ */

(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.ZsDiag) return; // singleton

  var BUF_KEY = 'zs_diag_buf';
  var BUF_MAX = 200;              // per-device cap
  var FLUSH_BATCH = 50;
  var FLUSH_DEBOUNCE_MS = 2000;
  var ENDPOINT_DEFAULT = (typeof CloudSync !== 'undefined' && CloudSync.server)
    ? CloudSync.server + '/api/diag'
    : null;

  function _cfg() {
    // Prefer CloudSync's known server so we follow the user's Tailscale setup.
    if (typeof CloudSync !== 'undefined' && CloudSync.isConfigured && CloudSync.isConfigured()) {
      return {
        enabled: true,
        endpoint: (CloudSync.server || '') + '/api/diag'
      };
    }
    // Fallback: explicit global, otherwise disabled.
    if (window.ZS_DIAG_ENDPOINT) return { enabled: true, endpoint: window.ZS_DIAG_ENDPOINT };
    return { enabled: false, endpoint: null };
  }

  function _read() {
    try {
      var raw = localStorage.getItem(BUF_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function _write(arr) {
    try { localStorage.setItem(BUF_KEY, JSON.stringify(arr.slice(-BUF_MAX))); } catch (e) {}
  }

  function _activeProfile() {
    try {
      if (typeof getActiveUser === 'function') {
        var u = getActiveUser();
        if (u) return { name: u.name, age: u.age || null, isGuest: !!u.isGuest };
      }
    } catch (e) {}
    return null;
  }

  function _pageTag() {
    var p = (window.location && window.location.pathname) || '';
    var last = p.split('/').pop() || 'index.html';
    return last;
  }

  function _appId() {
    if (window.ZS_APP) return String(window.ZS_APP);
    var p = _pageTag();
    // Best-effort mapping from file name
    return p.replace(/\.html$/, '') || 'unknown';
  }

  var _breadcrumbs = [];
  function _pushBreadcrumb(b) {
    _breadcrumbs.push({ ts: Date.now(), label: String(b.label || ''), data: b.data || null });
    if (_breadcrumbs.length > 10) _breadcrumbs = _breadcrumbs.slice(-10);
  }

  function _uid() {
    return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function _enqueue(entry) {
    var buf = _read();
    buf.push(entry);
    _write(buf);
    _scheduleFlush();
  }

  // ── Capture handlers ─────────────────────────────────────────────

  // Errors from third-party browser shells we want to ignore — they
  // pollute the diag log without being real bugs in our code.
  // - WebMIDIBrowser (an iOS Safari shell that polyfills WebMIDI)
  //   injects globals named _callback_receiveMIDIMessage,
  //   _callback_addSource, _callback_addDestination. When the
  //   polyfill misses, every page load throws a ReferenceError for
  //   them — thousands of identical entries that drown out signal.
  function _shouldIgnoreError(message) {
    if (!message) return false;
    var s = String(message);
    if (/_callback_receiveMIDIMessage|_callback_addSource|_callback_addDestination/.test(s)) return true;
    return false;
  }

  window.addEventListener('error', function(ev) {
    try {
      var msg = ev && ev.message ? String(ev.message) : 'unknown error';
      if (_shouldIgnoreError(msg)) return;
      _enqueue({
        id: _uid(),
        ts: Date.now(),
        kind: 'error',
        app: _appId(),
        page: _pageTag(),
        message: msg,
        filename: ev && ev.filename ? String(ev.filename) : null,
        lineno: ev && typeof ev.lineno === 'number' ? ev.lineno : null,
        colno: ev && typeof ev.colno === 'number' ? ev.colno : null,
        stack: ev && ev.error && ev.error.stack ? String(ev.error.stack).slice(0, 4000) : null,
        profile: _activeProfile(),
        ua: navigator.userAgent,
        breadcrumbs: _breadcrumbs.slice()
      });
    } catch (e) {}
  });

  window.addEventListener('unhandledrejection', function(ev) {
    try {
      var reason = ev && ev.reason;
      var msg = reason && reason.message ? reason.message : (reason ? String(reason) : 'unhandled rejection');
      var stk = reason && reason.stack ? String(reason.stack).slice(0, 4000) : null;
      _enqueue({
        id: _uid(),
        ts: Date.now(),
        kind: 'rejection',
        app: _appId(),
        page: _pageTag(),
        message: msg,
        stack: stk,
        profile: _activeProfile(),
        ua: navigator.userAgent,
        breadcrumbs: _breadcrumbs.slice()
      });
    } catch (e) {}
  });

  // Proxy console.error / warn — kept short and deduped at flush time.
  (function() {
    var origErr = console.error;
    var origWarn = console.warn;
    function wrap(kind, orig) {
      return function() {
        try {
          var args = Array.prototype.slice.call(arguments);
          var flat = args.map(function(a) {
            if (a == null) return String(a);
            if (typeof a === 'string') return a;
            if (a && a.message) return a.message;
            try { return JSON.stringify(a).slice(0, 500); } catch (e) { return '[unserialisable]'; }
          }).join(' ').slice(0, 1000);
          _enqueue({
            id: _uid(),
            ts: Date.now(),
            kind: kind,
            app: _appId(),
            page: _pageTag(),
            message: flat,
            profile: _activeProfile(),
            breadcrumbs: _breadcrumbs.slice()
          });
        } catch (e) {}
        return orig.apply(console, arguments);
      };
    }
    console.error = wrap('console.error', origErr);
    console.warn = wrap('console.warn', origWarn);
  })();

  // ── Flush ────────────────────────────────────────────────────────

  var _flushTimer = null;
  var _inFlight = false;

  function _scheduleFlush() {
    if (_flushTimer) return;
    _flushTimer = setTimeout(function() {
      _flushTimer = null;
      flushNow().catch(function() {});
    }, FLUSH_DEBOUNCE_MS);
  }

  function flushNow() {
    if (_inFlight) return Promise.resolve('busy');
    var cfg = _cfg();
    if (!cfg.enabled) return Promise.resolve('disabled');
    var buf = _read();
    if (!buf.length) return Promise.resolve('empty');

    var batch = buf.slice(0, FLUSH_BATCH);
    var payload = JSON.stringify({
      schema: 1,
      sentAt: Date.now(),
      entries: batch
    });

    _inFlight = true;
    return fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true        // still sends on beforeunload
    }).then(function(res) {
      if (!res.ok) throw new Error('status ' + res.status);
      // On success, drop the sent entries from the local buffer.
      var remaining = _read().slice(batch.length);
      _write(remaining);
      return 'ok';
    }).catch(function(err) {
      // Leave the buffer intact for a later retry.
      return 'offline:' + (err && err.message ? err.message : 'unknown');
    }).then(function(r) { _inFlight = false; return r; });
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') flushNow();
  });
  window.addEventListener('beforeunload', function() { flushNow(); });

  // Public API
  window.ZsDiag = {
    flushNow: flushNow,
    breadcrumb: _pushBreadcrumb,
    // For Parent Dashboard to show what's pending
    pendingCount: function() { return _read().length; },
    clearLocal: function() { _write([]); }
  };
})();
