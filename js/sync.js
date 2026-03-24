/* ================================================================
   CLOUD SYNC CLIENT
   Plain REST sync for VPS + Tailscale. No dependencies.
   ================================================================ */

const CloudSync = (() => {
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
    'littlemaestro_': 'littlemaestro',
  };

  const state = {
    online: false,
    isConfigured: () => !SYNC_SERVER.includes('x.x.x'),
  };

  function _getAppInfo(key) {
    for (const prefix in KEY_MAP) {
      if (key.startsWith(prefix)) {
        const kidKey = key.replace(prefix, '').replace('_recital', '');
        let appName = KEY_MAP[prefix];
        if (key.endsWith('_recital')) appName = 'lm_recital';
        return { kidKey, appName };
      }
    }
    return null;
  }

  async function _fetchWithTimeout(url, options = {}) {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

  state.push = async (key) => {
    if (!state.isConfigured() || !state.online) return;
    const info = _getAppInfo(key);
    if (!info) return;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);

      // Strip large art data
      if (info.appName === 'art' && data.gallery) {
        data.gallery = data.gallery.map(item => ({ ...item, dataUrl: undefined }));
      }

      _updatePill('syncing');
      await _fetchWithTimeout(`${SYNC_SERVER}/api/kids/${info.kidKey}/${info.appName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, _syncedAt: Date.now() })
      });
      _updatePill('idle');
    } catch (e) {
      console.warn('[Sync] Push failed:', e);
      _updatePill('error');
    }
  };

  state.pull = async (key) => {
    if (!state.isConfigured() || !state.online) return false;
    const info = _getAppInfo(key);
    if (!info) return false;

    try {
      _updatePill('syncing');
      const res = await _fetchWithTimeout(`${SYNC_SERVER}/api/kids/${info.kidKey}/${info.appName}`);
      if (!res.ok) throw new Error('Server error');
      const serverData = await res.json();
      _updatePill('idle');

      if (serverData) {
        let localData = {};
        try { localData = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) {}
        
        const sTime = typeof serverData._syncedAt === 'string' ? new Date(serverData._syncedAt).getTime() : (serverData._syncedAt || 0);
        const lTime = typeof localData._syncedAt === 'string' ? new Date(localData._syncedAt).getTime() : (localData._syncedAt || 0);

        if (sTime > lTime) {
          if (info.appName === 'art') {
            const merged = { ...serverData, gallery: localData.gallery || [] };
            localStorage.setItem(key, JSON.stringify(merged));
          } else {
            localStorage.setItem(key, JSON.stringify(serverData));
          }
          return true;
        } else if (lTime > sTime) {
          state.push(key);
        }
      } else {
        state.push(key);
      }
    } catch (e) {
      console.warn('[Sync] Pull failed:', e);
      _updatePill('error');
    }
    return false;
  };

  state.pullAll = async (kidKey) => {
    if (!state.isConfigured() || !state.online) return;
    try {
      _updatePill('syncing');
      const res = await _fetchWithTimeout(`${SYNC_SERVER}/api/kids/${kidKey}`);
      if (!res.ok) throw new Error('Server error');
      const allData = await res.json();
      
      let changed = false;
      for (const prefix in KEY_MAP) {
        const appName = KEY_MAP[prefix];
        const key = prefix + kidKey;
        if (allData[appName]) {
          const serverData = allData[appName];
          let localData = {};
          try { localData = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) {}
          
          const sTime = typeof serverData._syncedAt === 'string' ? new Date(serverData._syncedAt).getTime() : (serverData._syncedAt || 0);
          const lTime = typeof localData._syncedAt === 'string' ? new Date(localData._syncedAt).getTime() : (localData._syncedAt || 0);

          if (sTime > lTime) {
            if (appName === 'art') {
              const merged = { ...serverData, gallery: localData.gallery || [] };
              localStorage.setItem(key, JSON.stringify(merged));
            } else {
              localStorage.setItem(key, JSON.stringify(serverData));
            }
            changed = true;
          } else if (lTime > sTime) {
            state.push(key);
          }
        } else if (localStorage.getItem(key)) {
          state.push(key);
        }
      }
      
      // Special check for recital
      const rKey = 'littlemaestro_' + kidKey + '_recital';
      if (allData['lm_recital']) {
        const sData = allData['lm_recital'];
        let lData = {};
        try { lData = JSON.parse(localStorage.getItem(rKey)) || {}; } catch(e) {}
        
        const sTime = typeof sData._syncedAt === 'string' ? new Date(sData._syncedAt).getTime() : (sData._syncedAt || 0);
        const lTime = typeof lData._syncedAt === 'string' ? new Date(lData._syncedAt).getTime() : (lData._syncedAt || 0);

        if (sTime > lTime) {
          localStorage.setItem(rKey, JSON.stringify(sData));
          changed = true;
        } else if (lTime > sTime) {
          state.push(rKey);
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

  state.pushAll = async (kidKey) => {
    if (!state.isConfigured() || !state.online) return;
    const promises = [];
    for (const prefix in KEY_MAP) {
      const key = prefix + kidKey;
      if (localStorage.getItem(key)) promises.push(state.push(key));
    }
    const rKey = 'littlemaestro_' + kidKey + '_recital';
    if (localStorage.getItem(rKey)) promises.push(state.push(rKey));
    await Promise.allSettled(promises);
  };

  state.syncProfiles = async () => {
    if (!state.isConfigured() || !state.online) return;
    try {
      const res = await _fetchWithTimeout(`${SYNC_SERVER}/api/profiles`);
      const serverProfiles = await res.json() || [];
      const localProfiles = (typeof getProfiles === 'function') ? getProfiles() : [];
      
      const map = new Map();
      [...serverProfiles, ...localProfiles].forEach(p => {
        const key = p.name.toLowerCase();
        if (!map.has(key) || (p.age > map.get(key).age)) {
          map.set(key, p);
        }
      });
      const merged = Array.from(map.values());
      
      if (typeof saveProfiles === 'function') saveProfiles(merged);
      await _fetchWithTimeout(`${SYNC_SERVER}/api/profiles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
    } catch (e) {
      console.warn('[Sync] Profile sync failed:', e);
    }
  };

  state.pushAllKids = async () => {
    const profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    for (const p of profiles) {
      await state.pushAll(p.name.toLowerCase().replace(/\s+/g, '_'));
    }
    await state.syncProfiles();
  };

  state.pullAllKids = async () => {
    await state.syncProfiles();
    const profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    for (const p of profiles) {
      await state.pullAll(p.name.toLowerCase().replace(/\s+/g, '_'));
    }
    window.dispatchEvent(new CustomEvent('zs:synced'));
  };

  function _updatePill(status) {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) return;
    
    let pill = document.getElementById('zs-sync-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'zs-sync-pill';
      pill.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9000;background:var(--bg-surface,#1E1B2E);border:1.5px solid rgba(255,255,255,0.08);border-radius:99px;padding:6px 12px;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.3);color:#fff;';
      pill.onclick = () => {
        if (!state.isConfigured()) alert('Cloud Sync not configured. Edit js/sync.js and set SYNC_SERVER to your VPS Tailscale IP.');
      };
      document.body.appendChild(pill);
      
      const style = document.createElement('style');
      style.textContent = '@keyframes syncPulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }';
      document.head.appendChild(style);
    }

    const colors = { idle: '#10B981', syncing: '#3B82F6', error: '#EF4444', offline: '#EF4444', unconfigured: '#F59E0B' };
    const emojis = { idle: '☁️', syncing: '🔄', error: '☁️', offline: '☁️', unconfigured: '⚙️' };
    
    pill.innerHTML = `<span class="sync-emoji">${emojis[status]}</span><div style="width:6px;height:6px;border-radius:50%;background:${colors[status]}"></div>`;
    pill.style.animation = (status === 'syncing') ? 'syncPulse 1s infinite' : '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!state.isConfigured()) { _updatePill('unconfigured'); return; }
    _fetchWithTimeout(`${SYNC_SERVER}/api/ping`, { timeout: 3000 })
      .then(r => r.json())
      .then(() => { state.online = true; _updatePill('idle'); })
      .catch(() => { state.online = false; _updatePill('offline'); });
  });

  return state;
})();
