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

// ── Legacy un-prefixed storage keys ───────────────────────────────
//
// getUserAppKey just concatenates, so getUserAppKey('world') saves to
// `worlddiego`, not `zs_world_diego`. Five apps shipped that way —
// World Explorer, Story Explorer, Lab Explorer, Quest Adventure and
// the vacation quiz — while everything that reads across apps looks
// for the zs_ form: getPlayerStats below (so their stars never counted
// toward the Explorer Rank or lit a Trophy Room badge), CloudSync's
// KEY_MAP (so they never synced between devices), Quest Adventure's
// own tour goals, and Parents Corner's Progress Manager.
//
// The apps now ask for the right prefix and call this on load to carry
// any old blob across. It is safe to call on every read: the common
// case costs one localStorage lookup that finds nothing, and it only
// moves data when the new key holds nothing worth keeping, so a re-run
// can never overwrite real progress.
function adoptLegacyAppKey(legacyPrefix, prefix, userName) {
  var name = userName;
  if (!name) {
    var u = getActiveUser();
    name = u ? u.name : null;
  }
  if (!name) return false;

  var suffix = name.toLowerCase().replace(/\s+/g, '_');
  var legacyKey = legacyPrefix + suffix;

  try {
    var legacy = localStorage.getItem(legacyKey);
    if (!legacy) return false;
    if (!_isEmptyRecord(localStorage.getItem(prefix + suffix))) return false;

    localStorage.setItem(prefix + suffix, legacy);
    localStorage.removeItem(legacyKey);
    if (typeof Debug !== 'undefined') Debug.log('[Auth] Adopted ' + legacyKey + ' as ' + prefix + suffix);
    return true;
  } catch (e) {
    if (typeof Debug !== 'undefined') Debug.error('[Auth] Key adoption failed', legacyKey + ': ' + e.message);
    return false;
  }
}

// A missing record, or one carrying nothing but sync bookkeeping — the
// shape Progress Manager's reset leaves behind. Either way there is no
// progress here to protect.
function _isEmptyRecord(raw) {
  if (!raw) return true;
  try {
    var d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return true;
    var keys = Object.keys(d);
    return keys.length === 0 || (keys.length === 1 && keys[0] === '_syncedAt');
  } catch (e) { return false; }
}

// ── Player Stats ──────────────────────────────────────────────────

// Sum one numeric field across a map of records — the shape most apps
// use for "how did they do on each unit". `skip` names sibling keys in
// the same object that are not units (Descubre Chile keeps its visited
// list and memory best in there too).
function _sumField(field, skip) {
  return function(map) {
    var n = 0;
    for (var k in map) {
      if (skip && skip.indexOf(k) !== -1) continue;
      var rec = map[k];
      if (rec && typeof rec === 'object') n += rec[field] || 0;
    }
    return n;
  };
}

// Each app says how many stars a kid has earned in it. The rule is
// the app's own: where an app records stars, we sum those; where it
// only records what got finished, we count completed units. Anything
// without a `stars` function falls back to a plain totalStars field.
//
// `legacy` names the bare, un-prefixed key an app used to save to —
// see adoptLegacyAppKey above.
var APP_STAR_CONFIGS = [
  { id: 'math',   prefix: 'zs_mathgalaxy_', stars: _sumField('bestStars') },
  { id: 'chile',  prefix: 'zs_chile_',      stars: _sumField('bestStars', ['vr', 'memBest']) },
  { id: 'chess',  prefix: 'zs_chess_', stars: function(d) {
      return (d.puzzlesSolved || 0) + (d.wins || 0);
    } },
  { id: 'piano',  prefix: 'littlemaestro_', stars: function(d) {
      return _sumField('stars')(d.progress || {});
    } },
  { id: 'faith',  prefix: 'zs_fe_' },
  { id: 'guitar', prefix: 'zs_guitar_' },
  { id: 'art',    prefix: 'zs_art_' },
  { id: 'sports', prefix: 'zs_sports_' },
  { id: 'move',   prefix: 'zs_move_' },
  { id: 'guess',  prefix: 'zs_guess_' },
  { id: 'lab',    prefix: 'zs_lab_',   legacy: 'lab' },
  { id: 'world',  prefix: 'zs_world_', legacy: 'world' },
  { id: 'atlas',  prefix: 'zs_atlas_' },
  { id: 'story',  prefix: 'zs_story_', legacy: 'story' },
  { id: 'quest',  prefix: 'zs_quest_', legacy: 'quest' },
  { id: 'bmcheck', prefix: 'zs_bmcheck_' },
  { id: 'worldcup', prefix: 'zs_worldcup_' },

  // Money Master keeps {currency: {mode: {score, stars}}}.
  { id: 'money', prefix: 'zs_money_', stars: function(d) {
      var n = 0;
      for (var cur in d) {
        if (!d[cur] || typeof d[cur] !== 'object') continue;
        for (var mode in d[cur]) n += (d[cur][mode] && d[cur][mode].stars) || 0;
      }
      return n;
    } },

  // Invest Quest scores its portfolio game out of 3, then the
  // concept quiz (9 questions) and each math topic practised.
  { id: 'invest', prefix: 'zs_invest_', stars: function(d) {
      return (d.bestStars || 0) +
             ((d.quizBest || 0) >= 7 ? 1 : 0) +
             Object.keys(d.mathBest || {}).length;
    } },

  // Bible Explorer stars stories, memorised verses and book quizzes.
  { id: 'bible', prefix: 'zs_bible_', stars: function(d) {
      var n = 0;
      for (var s1 in (d.storyStars || {})) n += d.storyStars[s1] || 0;
      return n + _sumField('stars')(d.verses || {}) + _sumField('stars')(d.books || {});
    } },

  // Civics Lab records no stars, only what was finished: each branch
  // and institution quiz cleared, the law walkthrough, and a strong
  // comparative round (8+ of 10).
  { id: 'civics', prefix: 'zs_civics_', stars: function(d) {
      return (d.branches || []).length +
             (d.institutions || []).length +
             (d.lawCompleted ? 1 : 0) +
             ((d.comparativeBest || 0) >= 8 ? 1 : 0);
    } },

  // Code Cadet stars every solved puzzle out of 3.
  { id: 'codecadet', prefix: 'zs_codecadet_', stars: _sumField('stars') },

  // Vocabulario Vivo: the match and dictation games are scored, and
  // each word build is a finished exercise. Browsing a root is not an
  // achievement, so seenRoots does not count.
  { id: 'vocab', prefix: 'zs_vocab_', stars: function(d) {
      return (d.matchStars || 0) + (d.dictationStars || 0) + (d.builds || []).length;
    } }
];

var _starConfigById = {};
for (var _c = 0; _c < APP_STAR_CONFIGS.length; _c++) {
  _starConfigById[APP_STAR_CONFIGS[_c].id] = APP_STAR_CONFIGS[_c];
}

// How many stars one app's saved blob is worth. The single place that
// answers this — getPlayerStats and the Trophy Room both call it, so a
// new app's rule cannot land in one and go missing from the other.
function getAppStars(appId, data) {
  var cfg = _starConfigById[appId];
  var d = data || {};
  try {
    return (cfg && cfg.stars) ? (cfg.stars(d) || 0) : (d.totalStars || 0);
  } catch (e) { return 0; }
}

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

  for (var i = 0; i < APP_STAR_CONFIGS.length; i++) {
    var cfg = APP_STAR_CONFIGS[i];
    try {
      if (cfg.legacy) adoptLegacyAppKey(cfg.legacy, cfg.prefix, name);
      var raw = localStorage.getItem(cfg.prefix + key);
      var data = raw ? JSON.parse(raw) : {};
      appStats[cfg.id] = data;

      var appStars = getAppStars(cfg.id, data);

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
