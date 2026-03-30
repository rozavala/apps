/* ================================================================
   ACTIVITY LOG — Lightweight timestamped activity tracking
   Records what each kid did and when, for the parent dashboard.
   Storage key: zs_activity_[username]
   ================================================================ */

const ActivityLog = (() => {
  'use strict';

  const MAX_ENTRIES = 100; // Keep last 100 activities per kid

  function _key() {
    const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!u) return null;
    return 'zs_activity_' + u.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _load() {
    const k = _key();
    if (!k) return [];
    try {
      const raw = JSON.parse(localStorage.getItem(k));
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (raw._isList && Array.isArray(raw._items)) return raw._items;
      const keys = Object.keys(raw).filter(k => /^\d+$/.test(k));
      if (keys.length > 0) {
        return keys.sort((a, b) => Number(a) - Number(b)).map(k => raw[k]).filter(Boolean);
      }
      return [];
    } catch { return []; }
  }

  function _save(entries) {
    const k = _key();
    if (!k) return;
    // Trim to max
    if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(k, JSON.stringify(entries));
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }

  // Log an activity: ActivityLog.log('Math Galaxy', '🧮', 'Completed Cadet level — 3 stars')
  function log(appName, icon, description) {
    // Don't log for guest users
    if (typeof isGuestUser === 'function' && isGuestUser()) return;
    
    const entries = _load();
    entries.push({
      app: appName,
      icon: icon,
      desc: description,
      ts: Date.now()
    });
    _save(entries);
  }

  // Get activities for a specific kid (by name, for dashboard)
  function getForUser(userName) {
    const k = 'zs_activity_' + userName.toLowerCase().replace(/\s+/g, '_');
    try {
      const raw = JSON.parse(localStorage.getItem(k));
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      // Handle corrupted sync data (array spread into object)
      if (raw._isList && Array.isArray(raw._items)) return raw._items;
      // Legacy corruption: object with numeric keys from old array spread
      const keys = Object.keys(raw).filter(k => /^\d+$/.test(k));
      if (keys.length > 0) {
        return keys.sort((a, b) => Number(a) - Number(b)).map(k => raw[k]).filter(Boolean);
      }
      return [];
    } catch { return []; }
  }

  // Get activities from the last N days
  function getRecent(userName, days) {
    const all = getForUser(userName);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return all.filter(e => e.ts >= cutoff);
  }

  return { log, getForUser, getRecent };
})();
