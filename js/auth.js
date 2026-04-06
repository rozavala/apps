/* ================================================================
   ZAVALA SERRA APPS — Shared Auth & Stats (auth.js)
   
   Handles:
   - Profile management (localStorage 'zs_profiles')
   - Active user session ('zs_active_user')
   - Cross-app star aggregation (getTotalStars)
   - Explorer Ranks (getExplorerRank)
   ================================================================ */

var AVATARS = ['🦊','🐱','🐶','🦋','🐰','🐸','🦄','🐨','🦁','🐧','🦖','🐬'];
var COLORS  = ['#7C3AED','#EF4444','#F59E0B','#10B981','#0EA5E9','#EC4899','#F97316','#14B8A6'];
var AGE_OPTIONS = [
  { age: 4,  label: '4' },
  { age: 5,  label: '5' },
  { age: 6,  label: '6' },
  { age: 7,  label: '7' },
  { age: 8,  label: '8' },
  { age: 9,  label: '9' },
  { age: 10, label: '10' },
  { age: 11, label: '11+' }
];

var STORAGE_KEY = 'zs_profiles';
var ACTIVE_KEY  = 'zs_active_user';

var _cachedProfiles = null;
var _profilesCached = false;
var _cachedActiveUser = null;
var _activeUserCached = false;

// ── Profiles ──────────────────────────────────────────────────────

function getProfiles() {
  if (_profilesCached) return _cachedProfiles || [];
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    var parsed = raw ? JSON.parse(raw) : [];
    
    // Fix for corrupted array-to-object serialization
    if (parsed && !Array.isArray(parsed)) {
      var keys = [];
      for (var prop in parsed) { if (/^\d+$/.test(prop)) keys.push(prop); }
      parsed = keys.sort(function(a, b){ return Number(a) - Number(b); })
                   .map(function(k){ return parsed[k]; })
                   .filter(function(x){ return !!x; });
    }
    
    _cachedProfiles = parsed || [];
    _profilesCached = true;
    return _cachedProfiles;
  } catch (e) {
    if (typeof Debug !== 'undefined') Debug.error('[Auth] Failed to parse profiles', e.message);
    return [];
  }
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    _cachedProfiles = profiles;
    _profilesCached = true;
  } catch (e) {
    if (typeof Debug !== 'undefined') Debug.error('[Auth] Failed to save profiles', e.message);
  }
}

// ── Active User ───────────────────────────────────────────────────

function setActiveUser(user) {
  if (typeof Debug !== 'undefined') Debug.log('[Auth] setActiveUser: ' + (user ? user.name : 'null'));
  if (!user) {
    localStorage.removeItem(ACTIVE_KEY);
    try { sessionStorage.removeItem(ACTIVE_KEY); } catch(e) {}
    _cachedActiveUser = null;
    _activeUserCached = true;
  } else {
    var json = JSON.stringify(user);
    _cachedActiveUser = user;
    _activeUserCached = true;
    
    try {
      localStorage.setItem(ACTIVE_KEY, json);
      if (typeof Debug !== 'undefined') Debug.log('[Auth] setActiveUser saved to localStorage');
    } catch (e) {
      if (typeof Debug !== 'undefined') Debug.warn('[Auth] localStorage FULL, falling back to sessionStorage');
      try {
        sessionStorage.setItem(ACTIVE_KEY, json);
      } catch (e2) {
        if (typeof Debug !== 'undefined') Debug.error('[Auth] ALL STORAGE FAILED', e2.message);
      }
    }
  }
}

function getActiveUser() {
  if (_activeUserCached && _cachedActiveUser) return _cachedActiveUser;
  try {
    var raw = localStorage.getItem(ACTIVE_KEY) || sessionStorage.getItem(ACTIVE_KEY);
    _cachedActiveUser = raw ? JSON.parse(raw) : null;
    _activeUserCached = true;
    return _cachedActiveUser;
  } catch (e) {
    return null;
  }
}

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return 'Good morning!';
  if (h < 17) return 'Good afternoon!';
  return 'Good evening!';
}

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function getParentPin() {
  try {
    var idxRaw = localStorage.getItem('littlemaestro__index');
    var idx = idxRaw ? JSON.parse(idxRaw) : [];
    if (idx && idx.length > 0 && idx[0]) {
      var nameKey = idx[0].toLowerCase().replace(/\s+/g, '_');
      var dataRaw = localStorage.getItem('littlemaestro_' + nameKey);
      var data = dataRaw ? JSON.parse(dataRaw) : null;
      if (data && data.settings && data.settings.parentPin) return data.settings.parentPin;
    }
  } catch(e) {}
  try {
    var pin = localStorage.getItem('zs_parent_pin');
    if (pin) return pin;
  } catch(e) {}
  return '1234'; // default
}

function saveParentPin(pin) {
  try {
    localStorage.setItem('zs_parent_pin', pin);
  } catch(e) {
    console.warn('[Auth] Failed to save PIN:', e);
  }
}

function safeColor(c) {
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#7C3AED';
}

function getUserAppKey(prefix) {
  var u = getActiveUser();
  if (!u) return null;
  return prefix + u.name.toLowerCase().replace(/\s+/g, '_');
}

// ── Player Stats ──────────────────────────────────────────────────

function getPlayerStats(userName) {
  var name = userName;
  if (!name) {
    var user = getActiveUser();
    name = user ? user.name : null;
  }
  if (!name) return { totalStars: 0, appsWithStars: 0, appStats: {} };

  var key = name.toLowerCase().replace(/\s+/g, '_');
  var totalStars = 0;
  var appsWithStars = 0;
  var appStats = {};

  var appConfigs = [
    { id: 'math',   prefix: 'zs_mathgalaxy_' },
    { id: 'chile',  prefix: 'zs_chile_' },
    { id: 'chess',  prefix: 'zs_chess_' },
    { id: 'piano',  prefix: 'littlemaestro_' },
    { id: 'faith',  prefix: 'zs_fe_' },
    { id: 'guitar', prefix: 'zs_guitar_' },
    { id: 'art',    prefix: 'zs_art_' },
    { id: 'sports', prefix: 'zs_sports_' },
    { id: 'guess',  prefix: 'zs_guess_' },
    { id: 'lab',    prefix: 'zs_lab_' },
    { id: 'world',  prefix: 'zs_world_' },
    { id: 'story',  prefix: 'zs_story_' },
    { id: 'quest',  prefix: 'zs_quest_' }
  ];

  for (var i = 0; i < appConfigs.length; i++) {
    var cfg = appConfigs[i];
    try {
      var raw = localStorage.getItem(cfg.prefix + key);
      var data = raw ? JSON.parse(raw) : {};
      appStats[cfg.id] = data;

      var appStars = 0;
      if (cfg.id === 'math') {
        for (var k in data) { appStars += (data[k].bestStars || 0); }
      } else if (cfg.id === 'chile') {
        for (var k2 in data) { if (k2 !== 'vr' && k2 !== 'memBest') appStars += (data[k2].bestStars || 0); }
      } else if (cfg.id === 'chess') {
        appStars = (data.puzzlesSolved || 0) + (data.wins || 0);
      } else if (cfg.id === 'piano') {
        if (data.progress) {
          for (var k3 in data.progress) {
            var val = data.progress[k3];
            if (val && typeof val === 'object' && val.stars) appStars += val.stars;
          }
        }
      } else if (cfg.id === 'guess') {
        appStars = data.totalStars || 0;
      } else {
        appStars = data.totalStars || 0;
      }

      if (appStars > 0) {
        totalStars += appStars;
        appsWithStars++;
      }
    } catch (e) {}
  }

  return { totalStars: totalStars, appsWithStars: appsWithStars, appStats: appStats };
}

function getAgeTier(age) {
  var a = age;
  if (!a) {
    var u = getActiveUser();
    a = u ? u.age : null;
  }
  if (!a) return 'intermediate';
  if (a <= 5) return 'beginner';
  if (a <= 8) return 'intermediate';
  if (a <= 11) return 'advanced';
  return 'expert';
}

function getExplorerRank(userName, precalculatedStats) {
  var name = userName;
  if (!name) {
    var user = getActiveUser();
    name = user ? user.name : null;
  }
  if (!name) return { icon: '🛸', name: 'Cadet' };

  var stats = precalculatedStats || getPlayerStats(name);
  var totalStars = stats.totalStars;
  var appsWithStars = stats.appsWithStars;

  var RANKS = [
    { minStars: 500, icon: '👑', name: 'Grand Master' },
    { minStars: 250, icon: '💎', name: 'Elite' },
    { minStars: 150, icon: '🌌', name: 'Astronaut' },
    { minStars: 100, icon: '🚀', name: 'Pilot' },
    { minStars: 60,  icon: '🌍', name: 'Explorer' },
    { minStars: 30,  icon: '🛡️', name: 'Veteran' },
    { minStars: 15,  icon: '🌟', name: 'Apprentice' },
    { minStars: 0,   icon: '🛸', name: 'Cadet' }
  ];

  for (var i = 0; i < RANKS.length; i++) {
    var rank = RANKS[i];
    if (totalStars >= rank.minStars) return rank;
  }
  return RANKS[RANKS.length - 1];
}

// ── Chess Limits ──

function getChessPlaysThisWeek(userName) {
  var name = userName;
  if (!name) {
    var u = getActiveUser();
    name = u ? u.name : null;
  }
  if (!name) return 0;
  var key = 'zs_chess_plays_' + name.toLowerCase().replace(/\s+/g, '_');
  try {
    var playsRaw = localStorage.getItem(key);
    var plays = playsRaw ? JSON.parse(playsRaw) : [];
    var weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    var count = 0;
    for (var i = 0; i < plays.length; i++) {
      if (new Date(plays[i]).getTime() > weekAgo) count++;
    }
    return count;
  } catch (e) { return 0; }
}

function getChessLimit(userName) {
  var profiles = getProfiles();
  var name = userName;
  if (!name) {
    var u = getActiveUser();
    name = u ? u.name : null;
  }
  if (!name) return 2;
  var profile = null;
  for (var i = 0; i < profiles.length; i++) {
    if (profiles[i].name.toLowerCase() === name.toLowerCase()) {
      profile = profiles[i];
      break;
    }
  }
  if (!profile || profile.chessPlaysPerWeek === undefined) return 2;
  return profile.chessPlaysPerWeek;
}

function recordChessPlay(userName) {
  var name = userName;
  if (!name) {
    var u = getActiveUser();
    name = u ? u.name : null;
  }
  if (!name) return;
  var key = 'zs_chess_plays_' + name.toLowerCase().replace(/\s+/g, '_');
  try {
    var playsRaw = localStorage.getItem(key);
    var plays = playsRaw ? JSON.parse(playsRaw) : [];
    var monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    var filtered = [];
    for (var i = 0; i < plays.length; i++) {
      if (new Date(plays[i]).getTime() > monthAgo) filtered.push(plays[i]);
    }
    filtered.push(new Date().toISOString());
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {}
}

function canPlayChess(userName) {
  var limit = getChessLimit(userName);
  if (limit >= 7) return true; // Daily/Unlimited
  if (limit === 0) return false;
  var current = getChessPlaysThisWeek(userName);
  return current < limit;
}

// ── Initialization ──

window.addEventListener('storage', function(e) {
  if (e.key === STORAGE_KEY) { _profilesCached = false; }
  if (e.key === ACTIVE_KEY) { _activeUserCached = false; }
});
