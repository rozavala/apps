/* ================================================================
   CLOUD SYNC CLIENT
   Plain REST sync for VPS + Tailscale. No dependencies.
   ================================================================ */

const CloudSync = (function() {
  'use strict';

  // ── Set this to your VPS Tailscale IP ──────────────────────
  const SYNC_SERVER = 'https://real-options-dev.tail57521e.ts.net';
  // ──────────────────────────────────────────────────────────

  const KEY_MAP = {
    'zs_mathgalaxy_': 'mathgalaxy',
    'zs_chile_': 'chile',
    'zs_chess_': 'chess',
    'zs_fe_': 'fe',
    'zs_guitar_': 'guitar',
    'zs_art_': 'art',
    'zs_sports_': 'sports',
    'zs_lab_': 'lab',
    'zs_world_': 'world',
    'zs_story_': 'story',
    'zs_quest_': 'quest',
    'zs_guess_': 'guess',
    'zs_activity_': 'activity',
    'littlemaestro_': 'littlemaestro',
  };

  const state = {
    online: false,
    isConfigured: function() { return SYNC_SERVER.indexOf('x.x.x') === -1; },
  };

  function _getAppInfo(key) {
    if (!key) return null;
    for (const prefix in KEY_MAP) {
      if (key.indexOf(prefix) === 0) {
        const kidKey = key.replace(prefix, '').replace('_recital', '');
        let appName = KEY_MAP[prefix];
        if (key.indexOf('_recital') !== -1) appName = 'lm_recital';
        return { kidKey, appName };
      }
    }
    return null;
  }

  async function _fetchWithTimeout(url, options) {
    if (!options) options = {};
    const timeout = options.timeout || 8000;
    const controller = new AbortController();
    const id = setTimeout(function() { controller.abort(); }, timeout);

    try {
      const fetchOpts = Object.assign({}, options, { signal: controller.signal });
      delete fetchOpts.timeout;
      const response = await fetch(url, fetchOpts);
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  function _mergeLists(listA, listB) {
    const map = {};
    if (!Array.isArray(listA)) listA = [];
    if (!Array.isArray(listB)) listB = [];
    listA.concat(listB).forEach(function(item) {
      if (!item || !item.ts) return;
      // Key by timestamp + description to avoid duplicates across devices
      const key = item.ts + '_' + (item.desc || '');
      map[key] = item;
    });
    const merged = [];
    for (const k in map) merged.push(map[k]);
    return merged.sort(function(a, b) { return b.ts - a.ts; }).slice(0, 100);
  }

  state.push = async function(key) {
    if (!state.isConfigured() || !state.online) return;
    const info = _getAppInfo(key);
    if (!info) return;
    if (info.kidKey === 'guest') return;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      let data = JSON.parse(raw);

      _updatePill('syncing');

      // ── SMART MERGE ON PUSH (Fixes Lost History) ──
      // If this is an activity log, fetch current server state first and merge
      // so we don't overwrite other devices' recent entries.
      if (info.appName === 'activity') {
        try {
          const res = await _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName);
          if (res.ok) {
            const serverData = await res.json();
            const serverItems = serverData._isList ? (serverData._items || []) : [];
            const localItems = Array.isArray(data) ? data : (data._items || []);
            data = _mergeLists(localItems, serverItems);
            // Update local copy too so it's consistent
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch(e) { console.warn('[Sync] Pre-push merge failed, sending local only'); }
      }

      // Strip large art data
      if (info.appName === 'art' && data.gallery) {
        data.gallery = data.gallery.map(function(item) {
          const newItem = Object.assign({}, item);
          delete newItem.dataUrl;
          return newItem;
        });
      }

      const ts = Date.now();
      const payload = Array.isArray(data)
        ? { _isList: true, _items: data, _syncedAt: ts }
        : Object.assign({}, data, { _syncedAt: ts });

      await _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      try {
        const rawReload = localStorage.getItem(key);
        if (rawReload) {
          const current = JSON.parse(rawReload);
          if (!Array.isArray(current)) {
            current._syncedAt = ts;
            localStorage.setItem(key, JSON.stringify(current));
          }
        }
      } catch(ignore) {}

      _updatePill('idle');
    } catch (e) {
      console.warn('[Sync] Push failed:', e);
      _updatePill('error');
    }
  };

  state.pull = async function(key) {
    if (!state.isConfigured() || !state.online) return false;
    const info = _getAppInfo(key);
    if (!info) return false;

    try {
      _updatePill('syncing');
      const res = await _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName);
      if (!res.ok) {
        if (res.status === 404 && localStorage.getItem(key)) {
          state.push(key);
        }
        _updatePill('idle');
        return false;
      }
      const serverData = await res.json();
      _updatePill('idle');

      if (serverData) {
        let localData = {};
        try {
          const rawLocal = localStorage.getItem(key);
          localData = rawLocal ? JSON.parse(rawLocal) : {};
        } catch(e) {}
        
        const sTime = Number(serverData._syncedAt) || 0;
        const lTime = Number(localData._syncedAt) || 0;
        const localMissing = !localStorage.getItem(key);

        if (sTime > lTime || localMissing || info.appName === 'activity') {
          let toStore = serverData;
          if (serverData._isList && Array.isArray(serverData._items)) {
            toStore = serverData._items;
            if (info.appName === 'activity') {
              const localItems = Array.isArray(localData) ? localData : (localData._items || []);
              toStore = _mergeLists(toStore, localItems);
            }
          }
          if (info.appName === 'art' && !Array.isArray(toStore)) {
            const merged = Object.assign({}, toStore, { gallery: localData.gallery || [] });
            localStorage.setItem(key, JSON.stringify(merged));
          } else {
            localStorage.setItem(key, JSON.stringify(toStore));
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('[Sync] Pull failed:', e);
      _updatePill('error');
    }
    return false;
  };

  state.pullAll = async function(kidKey) {
    if (!state.isConfigured() || !state.online) return;
    try {
      _updatePill('syncing');
      const res = await _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + kidKey);
      if (!res.ok) throw new Error('Server error');
      const allData = await res.json();
      
      let changed = false;
      for (const prefix in KEY_MAP) {
        const appName = KEY_MAP[prefix];
        const key = prefix + kidKey;
        if (allData[appName]) {
          const serverData = allData[appName];
          let localData = {};
          try {
            const rawLocal = localStorage.getItem(key);
            localData = rawLocal ? JSON.parse(rawLocal) : {};
          } catch(e) {}
          
          const sTime = Number(serverData._syncedAt) || 0;
          const lTime = Number(localData._syncedAt) || 0;
          const localMissing = !localStorage.getItem(key);

          if (sTime > lTime || localMissing || appName === 'activity') {
            let toStore = serverData;
            if (serverData._isList && Array.isArray(serverData._items)) {
              toStore = serverData._items;
              if (appName === 'activity') {
                const localItems = Array.isArray(localData) ? localData : (localData._items || []);
                toStore = _mergeLists(toStore, localItems);
              }
            }
            if (appName === 'art' && !Array.isArray(toStore)) {
              const merged = Object.assign({}, toStore, { gallery: localData.gallery || [] });
              localStorage.setItem(key, JSON.stringify(merged));
            } else {
              localStorage.setItem(key, JSON.stringify(toStore));
            }
            changed = true;
          }
        } else if (localStorage.getItem(key)) {
          state.push(key);
        }
      }
      
      const rKey = 'littlemaestro_' + kidKey + '_recital';
      if (allData['lm_recital']) {
        const sData = allData['lm_recital'];
        let lData = {};
        try {
          const rawRecital = localStorage.getItem(rKey);
          lData = rawRecital ? JSON.parse(rawRecital) : {};
        } catch(e) {}
        const sTime = Number(sData._syncedAt) || 0;
        const lTime = Number(lData._syncedAt) || 0;
        if (sTime > lTime || !localStorage.getItem(rKey)) {
          localStorage.setItem(rKey, JSON.stringify(sData));
          changed = true;
        }
      } else if (localStorage.getItem(rKey)) {
        state.push(rKey);
      }

      if (changed) window.dispatchEvent(new CustomEvent('zs:synced'));
      _updatePill('idle');
    } catch (e) {
      console.warn('[Sync] PullAll failed:', e);
      _updatePill('error');
    }
  };

  state.pushAll = async function(kidKey) {
    if (!state.isConfigured() || !state.online) return;
    const promises = [];
    for (const prefix in KEY_MAP) {
      const key = prefix + kidKey;
      if (localStorage.getItem(key)) promises.push(state.push(key));
    }
    const rKey = 'littlemaestro_' + kidKey + '_recital';
    if (localStorage.getItem(rKey)) promises.push(state.push(rKey));
    await Promise.all(promises);
  };

  state.syncProfiles = async function() {
    if (!state.isConfigured() || !state.online) return;
    try {
      const res = await _fetchWithTimeout(SYNC_SERVER + '/api/profiles');
      const serverProfiles = await res.json() || [];
      const localProfiles = (typeof getProfiles === 'function') ? getProfiles() : [];
      
      const map = new Map();
      [].concat(serverProfiles, localProfiles).forEach(function(p) {
        if (!p || !p.name) return;
        const key = p.name.toLowerCase();
        if (!map.has(key) || (p.age > map.get(key).age)) {
          map.set(key, p);
        }
      });
      const merged = Array.from(map.values());
      
      if (typeof saveProfiles === 'function') saveProfiles(merged);
      await _fetchWithTimeout(SYNC_SERVER + '/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
    } catch (e) {
      console.warn('[Sync] Profile sync failed:', e);
    }
  };

  state.overwriteProfiles = async function(profiles) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    try {
      await _fetchWithTimeout(SYNC_SERVER + '/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profiles)
      });
    } catch (e) {
      console.warn('[Sync] Profile overwrite failed:', e);
    }
  };

  state.pushAllKids = async function() {
    if (!state.isConfigured() || !state.online) return;
    const profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];
      await state.pushAll(p.name.toLowerCase().replace(/\s+/g, '_'));
    }
    await state.syncProfiles();
  };

  state.pullAllKids = async function() {
    if (!state.isConfigured() || !state.online) return;
    await state.syncProfiles();
    const profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i];
      await state.pullAll(p.name.toLowerCase().replace(/\s+/g, '_'));
    }
    window.dispatchEvent(new CustomEvent('zs:synced'));
  };

  function _updatePill(status) {
    let pill = document.getElementById('zs-sync-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'zs-sync-pill';
      pill.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9000;background:var(--bg-surface,#1E1B2E);border:1.5px solid rgba(255,255,255,0.08);border-radius:99px;padding:6px 12px;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.3);color:#fff;';
      pill.onclick = function() {
        if (!state.isConfigured()) alert('Cloud Sync not configured.');
      };
      document.body.appendChild(pill);
      
      const style = document.createElement('style');
      style.textContent = '@keyframes syncPulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }';
      document.head.appendChild(style);
    }

    const colors = { idle: '#10B981', syncing: '#3B82F6', error: '#EF4444', offline: '#EF4444', unconfigured: '#F59E0B' };
    const emojis = { idle: '☁️', syncing: '🔄', error: '☁️', offline: '☁️', unconfigured: '⚙️' };
    
    pill.innerHTML = '<span class="sync-emoji">' + emojis[status] + '</span><div style="width:6px;height:6px;border-radius:50%;background:' + colors[status] + '"></div>';
    pill.style.animation = (status === 'syncing') ? 'syncPulse 1s infinite' : '';
  }

  document.addEventListener('DOMContentLoaded', async function() {
    if (!state.isConfigured()) { _updatePill('unconfigured'); return; }
    
    try {
      const res = await _fetchWithTimeout(SYNC_SERVER + '/api/ping', { timeout: 2000 });
      if (res.ok) {
        state.online = true;
        _updatePill('idle');

        const path = window.location.pathname;
        const isHub = path.indexOf('index.html') !== -1 || path === '/' || (path.length > 0 && path[path.length - 1] === '/');
        
        if (isHub) {
          await state.syncProfiles();
          const loginScr = document.getElementById('login-screen');
          if (typeof renderLogin === 'function' && loginScr && loginScr.style.display !== 'none') {
            renderLogin();
          }
        } else {
          // If in an app, try to pull latest for active user on start
          const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
          if (user) {
            const kidKey = user.name.toLowerCase().replace(/\s+/g, '_');
            state.pullAll(kidKey);
          }
        }
      } else {
        state.online = false;
        _updatePill('offline');
      }
    } catch (e) {
      state.online = false;
      _updatePill('offline');
    }
  });

  return state;
})();
