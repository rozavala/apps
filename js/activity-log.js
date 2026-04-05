/* ================================================================
   ACTIVITY LOG — Lightweight timestamped activity tracking
   Records what each kid did and when, for the parent dashboard.
   Storage key: zs_activity_[username]
   ================================================================ */

var ActivityLog = (function() {
  'use strict';

  var MAX_ENTRIES = 100; // Keep last 100 activities per kid

  function _key() {
    var u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!u) return null;
    return 'zs_activity_' + u.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _load() {
    var k = _key();
    if (!k) return [];
    try {
      var raw = JSON.parse(localStorage.getItem(k));
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      
      // Legacy fix for corrupted objects
      var keys = [];
      for (var prop in raw) { if (/^\d+$/.test(prop)) keys.push(prop); }
      return keys.sort(function(a, b){ return Number(a) - Number(b); })
                 .map(function(k){ return raw[k]; })
                 .filter(function(x){ return !!x; });
    } catch (e) { return []; }
  }

  // Log an activity: ActivityLog.log('Math Galaxy', '🧮', 'Completed Cadet level — 3 stars')
  function log(appName, icon, description) {
    // Don't log for guest users
    if (typeof isGuestUser === 'function' && isGuestUser()) return;
    
    if (typeof Debug !== 'undefined') Debug.log('Activity: ' + appName, description);

    var entries = _load();
    entries.push({
      app: appName,
      icon: icon,
      desc: description,
      ts: Date.now()
    });

    // Trim to MAX_ENTRIES
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(entries.length - MAX_ENTRIES);
    }

    var k = _key();
    if (k) {
      try {
        localStorage.setItem(k, JSON.stringify(entries));
        // Auto-push to cloud
        if (typeof CloudSync !== 'undefined' && CloudSync.online) {
          CloudSync.push(k);
        }
      } catch (e) {}
    }
  }

  function getForUser(userName) {
    var k = 'zs_activity_' + userName.toLowerCase().replace(/\s+/g, '_');
    try {
      var raw = JSON.parse(localStorage.getItem(k));
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      
      var keys = [];
      for (var prop in raw) { if (/^\d+$/.test(prop)) keys.push(prop); }
      return keys.sort(function(a, b){ return Number(a) - Number(b); })
                 .map(function(k){ return raw[k]; })
                 .filter(function(x){ return !!x; });
    } catch (e) { return []; }
  }

  // Return activities from last X days
  function getRecent(userName, days) {
    var all = getForUser(userName);
    var cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return all.filter(function(e){ return e.ts >= cutoff; });
  }

  return { log: log, getForUser: getForUser, getRecent: getRecent };
})();
