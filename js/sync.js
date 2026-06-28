/* ================================================================
   CLOUD SYNC CLIENT
   Plain REST sync for VPS + Tailscale. No dependencies.
   ================================================================ */

var CloudSync = (function() {
  'use strict';

  // ── Set this to your VPS Tailscale IP ──────────────────────
  var SYNC_SERVER = 'https://all-options-dev.tail57521e.ts.net';
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
    'zs_bmcheck_': 'bmcheck',
    'zs_activity_': 'activity',
    'zs_routines_': 'routines',
    'zs_money_': 'money',
    'zs_worldcup_': 'worldcup',
    'littlemaestro_': 'littlemaestro',
  };

  // Household-shared single-key items (no per-kid prefix). All clients
  // sync these to/from the synthetic kid `_household` so the family
  // sees the same shopping list, weekly menu, and calendar URLs across
  // every device. Sports matches use a dedicated shared bucket of
  // their own (zs_sports_matches_shared) and ride along here too.
  var HOUSEHOLD_KEYS = {
    'zs_shopping_list':         'shopping',
    'zs_menu':                  'menu',
    'zs_fcal_urls':             'fcal_urls',
    'zs_sports_matches_shared': 'sports_matches',
    'zs_home_location':         'home_location',
    'zs_deleted_profiles':      'deleted_profiles',
    'zs_summer_todos':          'summer',
    'wc2026.v2':                'worldcup',
    'zs_vacation':              'vacation'
  };
  var HOUSEHOLD_KID = '_household';

  var state = {
    online: false,
    server: SYNC_SERVER,
    isConfigured: function() { return SYNC_SERVER.indexOf('x.x.x') === -1; },
  };

  function _getAppInfo(key) {
    if (!key) return null;
    if (HOUSEHOLD_KEYS[key]) {
      return { kidKey: HOUSEHOLD_KID, appName: HOUSEHOLD_KEYS[key], household: true };
    }
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
    
    if (typeof AbortController !== 'undefined') {
      var controller = new AbortController();
      var id = setTimeout(function() { controller.abort(); }, timeout);

      var fetchOpts = Object.assign({}, options, { signal: controller.signal });
      delete fetchOpts.timeout;

      return fetch(url, fetchOpts)
        .then(function(res) { clearTimeout(id); return res; })
        .catch(function(err) { clearTimeout(id); throw err; });
    } else {
      // Fallback for browsers without AbortController
      return fetch(url, options);
    }
  }

  function _mergeLists(listA, listB) {
    var map = {};
    if (!Array.isArray(listA)) listA = [];
    if (!Array.isArray(listB)) listB = [];
    listA.concat(listB).forEach(function(item) {
      if (!item || !item.ts) return;
      var key = item.ts + '_' + (item.app || '') + '_' + (item.desc || '');
      map[key] = item;
    });
    var merged = [];
    for (var k in map) merged.push(map[k]);
    return merged.sort(function(a, b) { return b.ts - a.ts; }).slice(0, 100);
  }

  // Parse _syncedAt regardless of whether the producer wrote a number
  // (client) or an ISO string (server.js stamps `new Date().toISOString()`
  // on every PUT). Without this, Number(isoString) → NaN → 0, and the
  // pull comparison `sTime > lTime` was always 0 > 0 = false. The
  // server-stored copy was only ever written to a fresh device.
  function _parseTs(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    var n = new Date(v).getTime();
    return isNaN(n) ? 0 : n;
  }

  // Count "filled" fields in a World Cup picks object — used as the
  // tiebreaker when two devices have a bracket for the same member id
  // and we want to keep the more complete one rather than coin-flip.
  function _wcPickRichness(p) {
    if (!p) return 0;
    var n = 0;
    ['groupWinners','groupRunnersUp','groupThird','ko','scores'].forEach(function(k) {
      var v = p[k];
      if (v && typeof v === 'object') n += Object.keys(v).length;
    });
    ['champion','runnerUp','goldenBoot'].forEach(function(k) {
      if (p[k]) n += 1;
    });
    return n;
  }

  // Deep-merge two World Cup picks objects. Union every collection
  // (groupWinners, ko[stage], scores, etc.) so a key entered on either
  // side never disappears; on a direct key conflict, the newer
  // snapshot wins. Scalars (champion, runnerUp, goldenBoot) prefer
  // the newer side's non-empty value.
  function _mergeWcPicks(local, server, localNewer) {
    if (!local && !server) return null;
    if (!local) return server;
    if (!server) return local;
    var older = localNewer ? server : local;
    var newer = localNewer ? local : server;
    function unionMap(o, n) { return Object.assign({}, o || {}, n || {}); }
    var oko = older.ko || {}, nko = newer.ko || {};
    function nonEmpty(a, b) { return (a !== null && a !== undefined && a !== '') ? a : b; }
    return {
      groupWinners:    unionMap(older.groupWinners,    newer.groupWinners),
      groupRunnersUp:  unionMap(older.groupRunnersUp,  newer.groupRunnersUp),
      groupThird:      unionMap(older.groupThird,      newer.groupThird),
      ko: {
        R32:   unionMap(oko.R32,   nko.R32),
        R16:   unionMap(oko.R16,   nko.R16),
        QF:    unionMap(oko.QF,    nko.QF),
        SF:    unionMap(oko.SF,    nko.SF),
        '3rd': unionMap(oko['3rd'], nko['3rd']),
        Final: unionMap(oko.Final, nko.Final),
      },
      champion:          nonEmpty(newer.champion,   older.champion)   || null,
      runnerUp:          nonEmpty(newer.runnerUp,   older.runnerUp)   || null,
      goldenBoot:        nonEmpty(newer.goldenBoot, older.goldenBoot) || '',
      goldenBootCorrect: !!(older.goldenBootCorrect || newer.goldenBootCorrect),
      mode:              nonEmpty(newer.mode, older.mode) || 'buildup',
      // Score predictions: union by match id. On direct conflict
      // (same match, two predictions), newer side wins so the most
      // recent typed prediction doesn't get clobbered.
      scores: unionMap(older.scores, newer.scores),
    };
  }

  // Deep-merge two match-override objects (per match id). Every
  // editable field is unioned with newer-side-wins on conflict, except
  // that a side with a real `result` always beats a side without one.
  function _mergeWcOverride(local, server, localNewer) {
    if (!local) return server;
    if (!server) return local;
    var older = localNewer ? server : local;
    var newer = localNewer ? local : server;
    var out = Object.assign({}, older, newer);
    var sHasRes = server.result != null, lHasRes = local.result != null;
    if (sHasRes && !lHasRes) out.result = server.result;
    else if (lHasRes && !sHasRes) out.result = local.result;
    // both have result → newer's wins via Object.assign above; if both
    // have it as the same score this is a no-op.
    return out;
  }

  // Union-merge two World Cup snapshots so neither side ever loses
  // members, picks, or match results just because its _syncedAt got
  // out-flanked by a stale device's push. Conflicts ("both sides
  // have this member id") resolve toward whichever side has more
  // filled-in fields; match results prefer a side that actually has
  // a result over a side that doesn't.
  function _mergeWorldCup(server, local) {
    var s = server || {};
    var l = local || {};
    var out = {};

    // Members: union by id, falling back to lowercase name. Local
    // first so the device's own member identity wins if both sides
    // have the same person under different ids.
    var byKey = {};
    function _key(m) { return (m && m.id) || (m && m.name ? '_n:' + m.name.toLowerCase().trim() : null); }
    (l.members || []).forEach(function(m) { var k = _key(m); if (k) byKey[k] = m; });
    (s.members || []).forEach(function(m) {
      var k = _key(m);
      if (!k) return;
      var existing = byKey[k];
      if (!existing) { byKey[k] = m; return; }
      byKey[k] = {
        id: existing.id || m.id,
        name: existing.name || m.name,
        avatar: existing.avatar || m.avatar || null,
      };
    });
    out.members = Object.keys(byKey).map(function(k) { return byKey[k]; });

    // Snapshot-level recency for per-field conflict resolution. Lacking
    // per-field timestamps, the newer snapshot wins on direct collisions
    // (one device's last edit beats an older one's stale value for the
    // same key), while every non-conflicting key from both sides
    // survives the union.
    var localNewer = _parseTs(l._syncedAt) >= _parseTs(s._syncedAt);

    // Picks: union by id; on shared ids, deep-merge each picks object.
    var pickIds = {};
    Object.keys(l.picks || {}).forEach(function(id) { pickIds[id] = 1; });
    Object.keys(s.picks || {}).forEach(function(id) { pickIds[id] = 1; });
    out.picks = {};
    Object.keys(pickIds).forEach(function(id) {
      out.picks[id] = _mergeWcPicks((l.picks || {})[id], (s.picks || {})[id], localNewer);
    });

    // matchOverrides: union by id; on shared ids, deep-merge each
    // override (field-by-field) so a venue/team edit on one device
    // can't wipe a `result` recorded on another.
    var ovIds = {};
    Object.keys(l.matchOverrides || {}).forEach(function(id) { ovIds[id] = 1; });
    Object.keys(s.matchOverrides || {}).forEach(function(id) { ovIds[id] = 1; });
    out.matchOverrides = {};
    Object.keys(ovIds).forEach(function(id) {
      out.matchOverrides[id] = _mergeWcOverride((l.matchOverrides || {})[id], (s.matchOverrides || {})[id], localNewer);
    });

    // Groups: take whichever side actually has a draw recorded.
    out.groups = (s.groups && Object.keys(s.groups).length) ? s.groups : (l.groups || {});

    // koTeams: confirmed knockout team assignments (official feed or a
    // manual correction), keyed "matchId.side" -> team code. Union by
    // key so an official team confirmed on one device propagates to the
    // rest; on a direct conflict the newer snapshot wins.
    out.koTeams = {};
    var koIds = {};
    Object.keys(l.koTeams || {}).forEach(function(k) { koIds[k] = 1; });
    Object.keys(s.koTeams || {}).forEach(function(k) { koIds[k] = 1; });
    Object.keys(koIds).forEach(function(k) {
      var lv = (l.koTeams || {})[k], sv = (s.koTeams || {})[k];
      if (!lv) { out.koTeams[k] = sv; return; }
      if (!sv) { out.koTeams[k] = lv; return; }
      out.koTeams[k] = localNewer ? lv : sv;
    });

    // Other top-level fields: server wins on conflict, but keep
    // local-only keys (uiSelectedMember, stickers, scorers, etc.).
    var skip = { members:1, picks:1, matchOverrides:1, groups:1, koTeams:1, _syncedAt:1 };
    Object.keys(l).forEach(function(k) { if (!skip[k]) out[k] = l[k]; });
    Object.keys(s).forEach(function(k) { if (!skip[k]) out[k] = s[k]; });

    // Stamp the merge with the max of both timestamps + now so the
    // next pull on this device doesn't redo the work, and the next
    // push wins over either side's prior state.
    out._syncedAt = Math.max(_parseTs(s._syncedAt), _parseTs(l._syncedAt), Date.now());
    return out;
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
    } else if (info.appName === 'worldcup') {
      // Before pushing the World Cup snapshot, fetch the server's
      // current copy and union-merge it with ours, then push the
      // result. Prevents a stale device's save from wiping members or
      // results that another device has added since the last pull.
      mergeStep = _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + info.kidKey + '/' + info.appName)
        .then(function(res) {
          if (!res.ok) return data;
          return res.json().then(function(serverData) {
            if (!serverData) return data;
            var merged = _mergeWorldCup(serverData, data);
            try { localStorage.setItem(key, JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
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
      if (typeof Debug !== 'undefined') Debug.error('[Sync] Push failed: ' + key, e && e.message ? e.message : '(no message)');
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
        
        var sTime = _parseTs(serverData._syncedAt);
        var lTime = _parseTs(localData._syncedAt);
        var localMissing = !localStorage.getItem(key);

        // World Cup pulls always union-merge — never overwrite — so a
        // device whose _syncedAt got out-flanked by a stale push still
        // picks up the missing members / results, and one that has
        // unique local additions keeps them.
        if (info.appName === 'worldcup') {
          var mergedWc = _mergeWorldCup(serverData, localData);
          try { localStorage.setItem(key, JSON.stringify(mergedWc)); }
          catch (e) {
            if (typeof Debug !== 'undefined') Debug.error('[Sync] Quota Exceeded', key + ' size: ' + JSON.stringify(mergedWc).length);
            throw e;
          }
          return true;
        }

        if (sTime > lTime || localMissing || info.appName === 'activity') {
          var toStore = serverData;
          if (serverData._isList && Array.isArray(serverData._items)) {
            toStore = serverData._items;
            if (info.appName === 'activity') {
              var localItems = Array.isArray(localData) ? localData : (localData._items || []);
              toStore = _mergeLists(toStore, localItems);
            }
          }

          try {
            if (info.appName === 'art' && !Array.isArray(toStore)) {
              var merged = Object.assign({}, toStore, { gallery: localData.gallery || [] });
              localStorage.setItem(key, JSON.stringify(merged));
            } else {
              localStorage.setItem(key, JSON.stringify(toStore));
            }
          } catch (storageError) {
            if (typeof Debug !== 'undefined') {
              Debug.error('[Sync] Quota Exceeded', key + ' size: ' + JSON.stringify(toStore).length);
            }
            throw storageError;
          }
          return true;
        }
        return false;
      }).catch(function(e) {
        if (typeof Debug !== 'undefined') Debug.error('[Sync] Pull failed', e.message);
        _updatePill('error');
        return false;
      });
  };

  state.pullAll = function(kidKey) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    if (kidKey === 'guest') return Promise.resolve();
    _updatePill('syncing');
    if (typeof Debug !== 'undefined') Debug.log('[Sync] Pulling all for ' + kidKey);
    return _fetchWithTimeout(SYNC_SERVER + '/api/kids/' + kidKey)
      .then(function(res) {
        if (!res.ok) throw new Error('Server error (' + res.status + ')');
        return res.json();
      })
      .then(function(allData) {
        var changed = false;
        var promises = [];
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
            
            var sTime = _parseTs(serverData._syncedAt);
            var lTime = _parseTs(localData._syncedAt);
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
              
              try {
                if (appName === 'art' && !Array.isArray(toStore)) {
                  var merged = Object.assign({}, toStore, { gallery: localData.gallery || [] });
                  localStorage.setItem(key, JSON.stringify(merged));
                } else {
                  localStorage.setItem(key, JSON.stringify(toStore));
                }
                changed = true;
              } catch (storageError) {
                if (typeof Debug !== 'undefined') {
                  Debug.warn('[Sync] Quota Exceeded for ' + key + ' skipping pull.');
                }
              }
            }
          } else if (localStorage.getItem(key)) {
            promises.push(state.push(key));
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
          var sTimeR = _parseTs(sData._syncedAt);
          var lTimeR = _parseTs(lData._syncedAt);
          if (sTimeR > lTimeR || !localStorage.getItem(rKey)) {
            try {
              localStorage.setItem(rKey, JSON.stringify(sData));
              changed = true;
            } catch (storageError) {
              if (typeof Debug !== 'undefined') {
                Debug.error('[Sync] Quota Exceeded in recital pull', rKey + ' size: ' + JSON.stringify(sData).length);
              }
            }
          }
        } else if (localStorage.getItem(rKey)) {
          promises.push(state.push(rKey));
        }

        return Promise.all(promises).then(function() {
          if (changed) window.dispatchEvent(new CustomEvent('zs:synced'));
          _updatePill('idle');
          return true;
        });
      })
      .catch(function(e) {
        if (typeof Debug !== 'undefined') Debug.error('[Sync] PullAll failed', e.message);
        _updatePill('error');
        throw e;
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
        if (!res.ok) throw new Error('Fetch failed (' + res.status + ')');
        return res.json();
      })
      .then(function(serverProfiles) {
        var localProfiles = (typeof getProfiles === 'function') ? getProfiles() : [];
        var profileMap = {};
        // Read tombstones (zs_deleted_profiles) so a profile that was
        // deleted on any device stays gone on this one. Tombstones are
        // synced as part of HOUSEHOLD_KEYS so they reach every device.
        // Trim+lowercase both sides of the tombstone match so a name with
        // stray whitespace (e.g. legacy "Diego " on one device) can't
        // bypass the skip and resurrect a deleted profile.
        var tombstones = {};
        try {
          var rawTomb = localStorage.getItem('zs_deleted_profiles');
          var tombArr = rawTomb ? JSON.parse(rawTomb) : [];
          if (Array.isArray(tombArr)) {
            tombArr.forEach(function(t) {
              if (t && t.name) tombstones[(t.name || '').trim().toLowerCase()] = Number(t.ts) || 0;
            });
          }
        } catch (e) {}

        var merged = [].concat(serverProfiles || [], localProfiles);
        var finalProfiles = [];
        var nameToIdx = {};

        for (var i = 0; i < merged.length; i++) {
          var p = merged[i];
          if (!p || !p.name) continue;
          var key = (p.name || '').trim().toLowerCase();
          // Skip tombstoned names unless the profile was created after
          // the deletion (createdAt > tombstone ts) — that lets you
          // legitimately recreate a profile with the same name later.
          if (tombstones[key] && (!p.createdAt || p.createdAt < tombstones[key])) continue;

          if (nameToIdx.hasOwnProperty(key)) {
            var existing = finalProfiles[nameToIdx[key]];
            if (p.age > existing.age) {
              finalProfiles[nameToIdx[key]] = p;
            }
          } else {
            nameToIdx[key] = finalProfiles.length;
            finalProfiles.push(p);
          }
        }

        if (typeof saveProfiles === 'function') saveProfiles(finalProfiles);

        return _fetchWithTimeout(SYNC_SERVER + '/api/profiles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalProfiles)
        });
      })
      .catch(function(e) {
        if (typeof Debug !== 'undefined') Debug.error('[Sync] Profile sync failed', e.message);
        throw e;
      });
  };

  state.overwriteProfiles = function(profiles) {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    return _fetchWithTimeout(SYNC_SERVER + '/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles)
    }).catch(function(e) {
      if (typeof Debug !== 'undefined') Debug.error('[Sync] Profile overwrite failed', e.message);
      throw e;
    });
  };

  // Pull every household-shared key (shopping list, menu, calendar
  // URLs, sports matches) from the synthetic _household kid bucket
  // so a new device picks up the family-wide state on first sync.
  state.pullHousehold = function() {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    var promises = [];
    for (var key in HOUSEHOLD_KEYS) {
      promises.push(state.pull(key));
    }
    return Promise.all(promises);
  };

  // Push every household-shared key from this device. Used by the
  // "Push All to Cloud" button and on profile sync.
  state.pushHousehold = function() {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    var promises = [];
    for (var key in HOUSEHOLD_KEYS) {
      if (localStorage.getItem(key)) promises.push(state.push(key));
    }
    return Promise.all(promises);
  };

  state.pushAllKids = function() {
    if (!state.isConfigured() || !state.online) return Promise.resolve();
    var profiles = (typeof getProfiles === 'function') ? getProfiles() : [];
    var promises = [];
    for (var i = 0; i < profiles.length; i++) {
      promises.push(state.pushAll(profiles[i].name.toLowerCase().replace(/\s+/g, '_')));
    }
    // Also push the household-shared bucket (shopping, menu, calendar
    // URLs, sports matches, home location, profile tombstones). This
    // is the recovery path for state that was added when CloudSync was
    // still offline (e.g. before the initial Tailscale ping resolved).
    promises.push(state.pushHousehold());
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
        // And mirror the household bucket back so a fresh device picks
        // up the same shopping list / menu / calendar URLs.
        promises.push(state.pullHousehold());
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
        if (!state.isConfigured()) { alert('Cloud Sync not configured.'); return; }
        if (typeof Debug !== 'undefined') Debug.show();
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

  // Run the initial sync flow once a successful ping comes back. Split
  // out of the DOMContentLoaded handler so we can retry/reconnect later
  // without re-doing the household pull every visibilitychange.
  var _initialSynced = false;
  function _runInitialSync() {
    if (_initialSynced) return;
    _initialSynced = true;
    var path = window.location.pathname;
    var isHub = path.indexOf('index.html') !== -1 || path === '/' || (path.length > 0 && path[path.length - 1] === '/');
    state.pullHousehold().then(function() {
      try { window.dispatchEvent(new CustomEvent('zs:household-synced')); } catch (e) {}
      state.pushHousehold();
      if (isHub) {
        state.syncProfiles()
          .then(function() {
            var loginScr = document.getElementById('login-screen');
            if (typeof renderLogin === 'function' && loginScr && loginScr.style.display !== 'none') {
              renderLogin();
            }
          })
          .catch(function() { _updatePill('offline'); });
      } else {
        var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
        if (user) {
          var kidKey = user.name.toLowerCase().replace(/\s+/g, '_');
          state.pullAll(kidKey).catch(function() { _updatePill('offline'); });
        }
      }
    }).catch(function() { _updatePill('offline'); _initialSynced = false; });
  }

  // Ping the VPS, flip the pill, and kick the initial sync on first
  // success. On failure, schedule the next attempt with backoff (up to
  // ~1 min) so a cold Tailscale handshake or transient drop heals on
  // its own — previously a single 5s timeout left the pill stuck red.
  var _pingAttempt = 0;
  var _pingTimer = null;
  var _pinging = false;
  function _scheduleReping(delayMs) {
    if (_pingTimer) clearTimeout(_pingTimer);
    _pingTimer = setTimeout(_pingNow, delayMs);
  }
  function _pingNow() {
    if (_pinging) return;
    if (!state.isConfigured()) { _updatePill('unconfigured'); return; }
    _pinging = true;
    _fetchWithTimeout(SYNC_SERVER + '/api/ping', { timeout: 5000 })
      .then(function(res) {
        _pinging = false;
        if (res && res.ok) {
          _pingAttempt = 0;
          state.online = true;
          _updatePill('idle');
          _runInitialSync();
        } else {
          throw new Error('ping http ' + (res && res.status));
        }
      })
      .catch(function() {
        _pinging = false;
        state.online = false;
        _updatePill('offline');
        _pingAttempt++;
        // 2s, 5s, 10s, 20s, 30s, then cap at 60s.
        var schedule = [2000, 5000, 10000, 20000, 30000];
        var delay = schedule[_pingAttempt - 1] || 60000;
        _scheduleReping(delay);
      });
  }

  document.addEventListener('DOMContentLoaded', function() {
    _pingNow();
    // Reconnect attempts triggered by the tab returning to the
    // foreground or the OS reporting the network back. Both are
    // common scenarios where the initial 5s ping lost a race with a
    // cold Tailscale handshake.
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible' && !state.online) {
        _pingAttempt = 0;
        _pingNow();
      }
    });
    window.addEventListener('online', function() {
      if (!state.online) { _pingAttempt = 0; _pingNow(); }
    });
  });

  return state;
})();
