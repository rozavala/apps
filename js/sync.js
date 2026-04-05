/* ================================================================
   CLOUD SYNC CLIENT
   Plain REST sync for VPS + Tailscale. No dependencies.
   ================================================================ */

var CloudSync = (function() {
  'use strict';

  // ── Set this to your VPS Tailscale IP ──────────────────────
  var SYNC_SERVER = 'https://real-options-dev.tail57521e.ts.net';
  // ──────────────────────────────────────────────────────────

  var KEY_MAP = {
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

  var state = {
    online: false,
    isConfigured: function() { return SYNC_SERVER.indexOf('x.x.x') === -1; },
  };

  function _getAppInfo(key) {
    if (!key) return null;
    for (var prefix in KEY_MAP) {
      if (key.indexOf(prefix) === 0) {
        var kidKey = key.replace(prefix, '').replace('_recital', '');
        var appName = KEY_MAP[prefix];
        if (key.indexOf('_recital') !== -1) appName = 'lm_recital';
        return { kidKey: kidKey, appName: appName };
      }
    }
    return null;
  }

  function _fetchWithTimeout(url, options) {
    if (!options) options = {};
    var timeout = options.timeout || 8000;
    var controller = new AbortController();
    var id = setTimeout(function() { controller.abort(); }, timeout);

    var fetchOpts = Object.assign({}, options, { signal: controller.signal });
    delete fetchOpts.timeout;

    return fetch(url, fetchOpts)
      .then(function(res) { clearTimeout(id); return res; })
      .catch(function(err) { clearTimeout(id); throw err; });
  }

  function _mergeLists(listA, listB) {
    var map = {};
    if (!Array.isArray(listA)) listA = [];
    if (!Array.isArray(listB)) listB = [];
    listA.concat(listB).forEach(function(item) {
      if (!item || !item.ts) return;
      var key = item.ts + '_' + (item.desc || '');
      map[key] = item;
    });
    var merged = [];
    for (var k in map) merged.push(map[k]);
    return merged.sort(function(a, b) { return b.ts - a.ts; }).slice(0, 100);
  }

  state.push = function(key) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    var info = _getAppInfo(key);
    if (!info) return Promise.resolve();
    if (info.kidKey === 'guest') return Promise.resolve();

    var raw = localStorage.getItem(key);
    if (!raw) return Promise.resolve();
    var data;
    try { data = JSON.parse(raw); } catch(e) { return Promise.resolve(); }

    _updatePill('syncing');

    var mergeStep = Promise.resolve(data);
    if (info.appName === 'activity') {
      mergeStep = _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName)
        .then(function(res) {
          if (res.ok) {
            return res.json().then(function(serverData) {
              var serverItems = serverData._isList ? (serverData._items || []) : [];
              var localItems = Array.isArray(data) ? data : (data._items || []);
              var merged = _mergeLists(localItems, serverItems);
              localStorage.setItem(key, JSON.stringify(merged));
              return merged;
            });
          }
          return data;
        })
        .catch(function() { return data; });
    }

    return mergeStep.then(function(finalData) {
      if (info.appName === 'art' && finalData.gallery) {
        finalData.gallery = finalData.gallery.map(function(item) {
          var newItem = Object.assign({}, item);
          delete newItem.dataUrl;
          return newItem;
        });
      }

      var ts = Date.now();
      var payload = Array.isArray(finalData)
        ? { _isList: true, _items: finalData, _syncedAt: ts }
        : Object.assign({}, finalData, { _syncedAt: ts });

      return _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function() {
        try {
          var rawReload = localStorage.getItem(key);
          if (rawReload) {
            var current = JSON.parse(rawReload);
            if (!Array.isArray(current)) {
              current._syncedAt = ts;
              localStorage.setItem(key, JSON.stringify(current));
            }
          }
        } catch(ignore) {}
        _updatePill('idle');
      });
    }).catch(function(e) {
      console.warn('[Sync] Push failed:', e);
      _updatePill('error');
    });
  };

  state.pull = function(key) {
    if (!state.isConfigured() || !state.online) return Promise.resolve(false);
    var info = _getAppInfo(key);
    if (!info) return Promise.resolve(false);

    _updatePill('syncing');
    return _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName)
      .then(function(res) {
        if (!res.ok) {
          if (res.status === 404 && localStorage.getItem(key)) state.push(key);
          _updatePill('idle');
          return false;
        }
        return res.json();
      })
      .then(function(serverData) {
        _updatePill('idle');
        if (!serverData) return false;

        var localData = {};
        try {
          var rawLocal = localStorage.getItem(key);
          localData = rawLocal ? JSON.parse(rawLocal) : {};
        } catch(e) {}
        
        var sTime = Number(serverData._syncedAt) || 0;
        var lTime = Number(localData._syncedAt) || 0;
        var localMissing = !localStorage.getItem(key);

        if (sTime > lTime || localMissing || info.appName === 'activity') {
          var toStore = serverData;
          if (serverData._isList && Array.isArray(serverData._items)) {
            toStore = serverData._items;
            if (info.appName === 'activity') {
              var localItems = Array.isArray(localData) ? localData : (localData._items || []);
              toStore = _mergeLists(toStore, localItems);
            }
          }
          if (info.appName === 'art' && !Array.isArray(toStore)) {
            var merged = Object.assign({}, toStore, { gallery: localData.gallery || [] });
            localStorage.setItem(key, JSON.stringify(merged));
          } else {
            localStorage.setItem(key, JSON.stringify(toStore));
          }
          return true;
        }
        return false;
      })
      .catch(function(e) {
        console.warn('[Sync] Pull failed:', e);
        _updatePill('error');
        return false;
      });
  };

  state.pullAll = function(kidKey) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    _updatePill('syncing');
    return _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + kidKey)
      .then(function(res) {
        if (!res.ok) throw new Error('Server error');
        return res.json();
      })
      .then(function(allData) {
        var changed = false;
        for (var prefix in KEY_MAP) {
          var appName = KEY_MAP[prefix];
          var key = prefix + kidKey;
          if (allData[appName]) {
            var serverData = allData[appName];
            var localData = {};
            try {
              var rawLocal = localStorage.getItem(key);
              localData = rawLocal ? JSON.parse(rawLocal) : {};
            } catch(e) {}
            
            var sTime = Number(serverData._syncedAt) || 0;
            var lTime = Number(localData._syncedAt) || 0;
            var localMissing = !localStorage.getItem(key);

            if (sTime > lTime || localMissing || appName === 'activity') {
              var toStore = serverData;
              if (serverData._isList && Array.isArray(serverData._items)) {
                toStore = serverData._items;
                if (appName === 'activity') {
                  var localItems = Array.isArray(localData) ? localData : (localData._items || []);
                  toStore = _mergeLists(toStore, localItems);
                }
              }
              if (appName === 'art' && !Array.isArray(toStore)) {
                var merged = Object.assign({}, toStore, { gallery: localData.gallery || [] });
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
        
        var rKey = 'littlemaestro_' + kidKey + '_recital';
        if (allData['lm_recital']) {
          var sData = allData['lm_recital'];
          var lData = {};
          try {
            var rawRecital = localStorage.getItem(rKey);
            lData = rawRecital ? JSON.parse(rawRecital) : {};
          } catch(e) {}
          var sTimeR = Number(sData._syncedAt) || 0;
          var lTimeR = Number(lData._syncedAt) || 0;
          if (sTimeR > lTimeR || !localStorage.getItem(rKey)) {
            localStorage.setItem(rKey, JSON.stringify(sData));
            changed = true;
          }
        } else if (localStorage.getItem(rKey)) {
          state.push(rKey);
        }

        if (changed) window.dispatchEvent(new CustomEvent('zs:synced'));
        _updatePill('idle');
      })
      .catch(function(e) {
        console.warn('[Sync] PullAll failed:', e);
        _updatePill('error');
      });
  };

  state.pushAll = function(kidKey) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    var promises = [];
    for (var prefix in KEY_MAP) {
      var key = prefix + kidKey;
      if (localStorage.getItem(key)) promises.push(state.push(key));
    }
    var rKey = 'littlemaestro_' + kidKey + '_recital';
    if (localStorage.getItem(rKey)) promises.push(state.push(rKey));
    return Promise.all(promises);
  };

  state.syncProfiles = function() {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    return _fetchWithTimeout(SYNC_SERVER + '/api/profiles')
      .then(function(res) {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(function(serverProfiles) {
        var localProfiles = (typeof getProfiles === 'function') ? getProfiles() : [];
        var map = new Map();
        [].concat(serverProfiles || [], localProfiles).forEach(function(p) {
          if (!p || !p.name) return;
          var key = p.name.toLowerCase();
          if (!map.has(key) || (p.age > map.get(key).age)) {
            map.set(key, p);
          }
        });
        var merged = Array.from(map.values());
        if (typeof saveProfiles === 'function') saveProfiles(merged);
        
        return _fetchWithTimeout(SYNC_SERVER + '/api/profiles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged)
        });
      })
      .catch(function(e) {
        console.warn('[Sync] Profile sync failed:', e);
      });
  };

  state.overwriteProfiles = function(profiles) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    return _fetchWithTimeout(SYNC_SERVER + '/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles)
    }).catch(function(e) {
      console.warn('[Sync] Profile overwrite failed:', e);
    });
  };

  state.pushAllKids = function() {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    var profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    var promises = [];
    for (var i = 0; i < profiles.length; i++) {
      promises.push(state.pushAll(profiles[i].name.toLowerCase().replace(/\s+/g, '_')));
    }
    return Promise.all(promises).then(function() { return state.syncProfiles(); });
  };

  state.pullAllKids = function() {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    return state.syncProfiles()
      .then(function() {
        var profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
        var promises = [];
        for (var i = 0; i < profiles.length; i++) {
          promises.push(state.pullAll(profiles[i].name.toLowerCase().replace(/\s+/g, '_')));
        }
        return Promise.all(promises);
      })
      .then(function() {
        window.dispatchEvent(new CustomEvent('zs:synced'));
      });
  };

  function _updatePill(status) {
    var pill = document.getElementById('zs-sync-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'zs-sync-pill';
      pill.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9000;background:var(--bg-surface,#1E1B2E);border:1.5px solid rgba(255,255,255,0.08);border-radius:99px;padding:6px 12px;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.3);color:#fff;';
      pill.onclick = function() {
        if (!state.isConfigured()) alert('Cloud Sync not configured.');
      };
      document.body.appendChild(pill);
      
      var style = document.createElement('style');
      style.textContent = '@keyframes syncPulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }';
      document.head.appendChild(style);
    }

    var colors = { idle: '#10B981', syncing: '#3B82F6', error: '#EF4444', offline: '#EF4444', unconfigured: '#F59E0B' };
    var emojis = { idle: '☁️', syncing: '🔄', error: '☁️', offline: '☁️', unconfigured: '⚙️' };
    
    pill.innerHTML = '<span class="sync-emoji">' + emojis[status] + '</span><div style="width:6px;height:6px;border-radius:50%;background:' + colors[status] + '"></div>';
    pill.style.animation = (status === 'syncing') ? 'syncPulse 1s infinite' : '';
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (!state.isConfigured()) { _updatePill('unconfigured'); return; }
    
    _fetchWithTimeout(SYNC_SERVER + '/api/ping', { timeout: 2000 })
      .then(function(res) {
        if (res.ok) {
          state.online = true;
          _updatePill('idle');

          var path = window.location.pathname;
          var isHub = path.indexOf('index.html') !== -1 || path === '/' || (path.length > 0 && path[path.length - 1] === '/');
          
          if (isHub) {
            state.syncProfiles()
              .then(function() {
                var loginScr = document.getElementById('login-screen');
                if (typeof renderLogin === 'function' && loginScr && loginScr.style.display !== 'none') {
                  renderLogin();
                }
              });
          } else {
            var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
            if (user) {
              var kidKey = user.name.toLowerCase().replace(/\s+/g, '_');
              state.pullAll(kidKey);
            }
          }
        } else {
          state.online = false;
          _updatePill('offline');
        }
      })
      .catch(function(e) {
        state.online = false;
        _updatePill('offline');
      });
  });

  return state;
})();
