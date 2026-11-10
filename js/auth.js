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
  if (h < 12) return zsT('¡Buenos días!', 'Good morning!');
  if (h < 17) return zsT('¡Buenas tardes!', 'Good afternoon!');
  return zsT('¡Buenas noches!', 'Good evening!');
}

// ── Language ──────────────────────────────────────────────────────
// Each kid has a language for the shared screens: 'es', 'en' or 'both'
// (Spanish first, English beside or under it). It lives on the profile,
// so it syncs with the profile. A profile with no setting reads as
// English, which is what the shared screens always were; nothing changes
// until a parent picks one.

var KID_LANGS = ['es', 'en', 'both'];

function _kidLangFrom(p) {
  return p && KID_LANGS.indexOf(p.lang) >= 0 ? p.lang : null;
}

// 'es' | 'en' | 'both' as set on the profile, or null when nobody chose.
function getKidLangChoice(userName) {
  var name = userName;
  var active = getActiveUser();
  if (!name && active) name = active.name;
  var lang = null;
  if (name) {
    var profiles = getProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i] && profiles[i].name === name) { lang = _kidLangFrom(profiles[i]); break; }
    }
    // A guest is not in the profile list; use the signed-in copy.
    if (!lang && active && active.name === name) lang = _kidLangFrom(active);
  }
  return lang;
}

function getKidLang(userName) {
  return getKidLangChoice(userName) || 'en';
}

// For an app that keeps its own English/Spanish switch: when a parent has
// set Spanish or English for this kid, the app opens in it; otherwise (not
// set, or 'both') the app keeps the language it saved. The app's switch
// still works while it is open.
function zsAppLang(saved) {
  var choice = getKidLangChoice();
  return choice === 'es' || choice === 'en' ? choice : saved;
}

function setKidLang(userName, lang) {
  if (KID_LANGS.indexOf(lang) < 0) return false;
  var profiles = getProfiles();
  var hit = false;
  for (var i = 0; i < profiles.length; i++) {
    if (profiles[i] && profiles[i].name === userName) { profiles[i].lang = lang; hit = true; }
  }
  if (!hit) return false;
  saveProfiles(profiles);
  var active = getActiveUser();
  if (active && active.name === userName) { active.lang = lang; setActiveUser(active); }
  if (typeof CloudSync !== 'undefined' && CloudSync.overwriteProfiles) {
    try { CloudSync.overwriteProfiles(profiles); } catch (e) {}
  }
  return true;
}

// For short things where saying it twice is clutter (a count, a timer):
// Spanish when the kid has Spanish or both, English otherwise.
function zsShort(es, en) {
  return getKidLang() === 'en' ? en : es;
}

// The text in this kid's language. 'both' gives "Spanish · English".
// (Some apps have their own local t(en, es) with the arguments the other
// way round; this one is zsT(es, en).)
function zsT(es, en) {
  var lang = getKidLang();
  return lang === 'es' ? es : lang === 'both' ? es + ' · ' + en : en;
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
var LEGACY_ARCHIVE_PREFIX = 'zs_premigration_';

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

    // Stamp the recovered blob as fresh before storing it. A legacy key
    // was never in CloudSync's KEY_MAP, so what it holds has never been
    // stamped — and CloudSync.pull keeps whichever side is newer, with
    // an unstamped record reading as epoch 0. That let a stale server
    // copy overwrite the progress we just rescued, including the empty
    // {_syncedAt} husk a Progress Manager reset had pushed up.
    var stamped = legacy;
    try {
      var parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsed._syncedAt = Date.now();
        stamped = JSON.stringify(parsed);
      }
    } catch (e) { /* not JSON — store it back untouched */ }

    localStorage.setItem(prefix + suffix, stamped);

    // Keep a copy rather than dropping the only one. This migration
    // moves a kid's real progress; the first version of it deleted the
    // legacy key and a stale cloud pull then overwrote the new one,
    // which lost the lot. The archive is never read back automatically
    // — restoring it on an empty record would undo a deliberate reset
    // from Parents Corner — it is here so the data can be recovered by
    // hand if anything else goes wrong.
    try { localStorage.setItem(LEGACY_ARCHIVE_PREFIX + legacyKey, legacy); } catch (e) {}
    localStorage.removeItem(legacyKey);
    if (typeof Debug !== 'undefined') Debug.log('[Auth] Adopted ' + legacyKey + ' as ' + prefix + suffix);

    // Replace whatever the server is holding for this app, so the other
    // devices stop pulling the record this one just superseded.
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(prefix + suffix); } catch (e) {}
    }
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

  // Repaso (the daily review) earns one star for each day it was finished.
  { id: 'review', prefix: 'zs_review_', stars: function(d) {
      return Object.keys((d && d.done) || {}).length;
    } },

  // Money Master keeps {currency: {mode: {score, stars}}}.
  { id: 'money', prefix: 'zs_money_', stars: function(d) {
      var n = 0;
      for (var cur in d) {
        if (!d[cur] || typeof d[cur] !== 'object') continue;
        for (var mode in d[cur]) n += (d[cur][mode] && d[cur][mode].stars) || 0;
      }
      return n;
    } },

  // Invest Quest scores its portfolio game out of 3, then one
  // concept-quiz round (9 questions drawn from a larger bank)
  // and each math topic practised. A strong round is still 7 of 9.
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
  // Detective (spot the root) and Cognados joined later; blobs without
  // them score exactly as before.
  { id: 'vocab', prefix: 'zs_vocab_', stars: function(d) {
      return (d.matchStars || 0) + (d.dictationStars || 0) + (d.builds || []).length +
             (d.spotStars || 0) + (d.cogStars || 0);
    } },

  // ── Learn-by-doing apps ─────────────────────────────────────────
  // Circuit Lab stars each of its 16 challenges out of 3.
  { id: 'circuit', prefix: 'zs_circuit_', stars: function(d) {
      var n = 0, L = d.levels || {};
      for (var k in L) n += Math.min(3, (L[k] && L[k].stars) || 0);
      return n;
    } },
  // Little Engineer stars each of its 12 bridges out of 3, plus one for
  // the real spaghetti bridge a parent confirmed.
  { id: 'engineer', prefix: 'zs_engineer_', stars: function(d) {
      var n = 0, L = d.levels || {};
      for (var k in L) n += Math.min(3, Math.max(0, (L[k] && L[k].stars) | 0));
      return n + (d.realBuild ? 1 : 0);
    } },
  // Mi Negocio stars each product's best season out of 3, plus one for
  // a strong concept quiz (5+ of 6).
  { id: 'negocio', prefix: 'zs_negocio_', stars: function(d) {
      var n = 0, b = d.best || {};
      for (var k in b) if (b[k]) n += Math.min(3, b[k].stars || 0);
      return n + ((d.quizBest || 0) >= 5 ? 1 : 0);
    } },
  // Mensajes Secretos stars each of its 19 missions out of 3. Opening a
  // tool or reading a history card is not an achievement.
  { id: 'secretos', prefix: 'zs_secretos_', stars: function(d) {
      var n = 0, m = d.missions || {};
      for (var k in m) n += Math.min(3, (m[k] && m[k].stars) || 0);
      return n;
    } },
  // ¿Qué Hora Es? stars each of its 29 levels out of 3.
  { id: 'clock', prefix: 'zs_clock_', stars: function(d) {
      var n = 0, L = d.levels || {};
      for (var k in L) n += Math.min(3, (L[k] && L[k].stars) || 0);
      return n;
    } },
  // Cálculo Rápido: one star for every two sprint levels mastered (up to 6),
  // one for each Estimate-it question landed within double or half (2+ of 3,
  // up to 12), each unit topic's quiz out of 3, and each engineer topic by
  // problems solved (1, 3 and 6 solved give 1, 2 and 3 stars).
  { id: 'calculo', prefix: 'zs_calculo_', stars: function(d) {
      var n = 0, k, sp = d.sprint || {}, e = d.est || {}, u = d.units || {}, g = d.eng || {}, hit = 0, s;
      n += Math.min(6, Math.floor(Math.max(0, Math.min(12, sp.mastered | 0)) / 2));
      for (k in e) if ((e[k] | 0) >= 2) hit++;
      n += Math.min(12, hit);
      for (k in u) n += Math.max(0, Math.min(3, u[k] | 0));
      for (k in g) { s = g[k] | 0; n += s >= 6 ? 3 : s >= 3 ? 2 : s >= 1 ? 1 : 0; }
      return n;
    } },
  // Explorador de Naturaleza: each seasonal Spot it! card scores by how
  // much of it was found outdoors (3/6/9 of 9 squares → 1/2/3 stars), and
  // each quiz mode is starred out of 3. Opening a plate does not score.
  { id: 'naturaleza', prefix: 'zs_naturaleza_', stars: function(d) {
      var n = 0, c, f;
      for (c in (d.cards || {})) { f = ((d.cards[c] || {}).found || []).length; n += f >= 9 ? 3 : f >= 6 ? 2 : f >= 3 ? 1 : 0; }
      for (c in (d.quiz || {})) n += Math.max(0, Math.min(3, d.quiz[c] || 0));
      return n;
    } },
  // Euclid's Workshop stars each of its 18 constructions out of 3.
  { id: 'euclid', prefix: 'zs_euclid_', stars: function(d) {
      var n = 0, L = d.levels || {};
      for (var k in L) n += Math.min(3, (L[k] && L[k].stars) || 0);
      return n;
    } },
  // Cocina Lab: each recipe cooked (confirmed by a grown-up's PIN) and
  // each Measuring Lab task is starred out of 3, plus the safety quiz and
  // the egg-cracking drill.
  { id: 'cocina', prefix: 'zs_cocina_', stars: function(d) {
      var n = 0, k;
      for (k in (d.cooked || {})) n += Math.min(3, (d.cooked[k] && d.cooked[k].stars) || 0);
      for (k in (d.measure || {})) n += Math.min(3, d.measure[k] || 0);
      return n + Math.min(3, d.safetyStars || 0) + Math.min(3, d.eggStars || 0);
    } },
  // Marinero: each knot earns up to 3 (watched the whole animation, quick
  // check right, tied with a real rope and confirmed with the parent PIN),
  // each quiz is starred out of 3, plus up to 3 backyard treasure hunts.
  { id: 'marinero', prefix: 'zs_marinero_', stars: function(d) {
      var n = 0, k, q;
      for (k in (d.knots || {})) { q = d.knots[k] || {}; n += (q.w ? 1 : 0) + (q.c ? 1 : 0) + (q.r ? 1 : 0); }
      for (k in (d.best || {})) n += Math.min(3, d.best[k] || 0);
      return n + Math.min(3, d.hunts || 0);
    } },
  // Dictado: the best round of each list and level, up to 3 stars each
  // (typed from dictation; a round written on paper stops at 2).
  { id: 'dictado', prefix: 'zs_dictado_', stars: function(d) {
      var n = 0, b = (d && d.best) || {};
      for (var k in b) n += Math.min(3, Math.max(0, Number(b[k]) || 0));
      return n;
    } },
  // Lector: each level activity (sounds, syllables or blending, build, read)
  // is starred out of 3 by first-try answers, and each book earns up to 3:
  // listened to it, read it by tapping every word, and read it aloud to a
  // grown-up who confirmed with the PIN.
  { id: 'lector', prefix: 'zs_lector_', stars: function(d) {
      var n = 0, k, q, acts = ['sounds', 'syll', 'blend', 'build', 'read'];
      for (k in (d.lv || {})) { q = d.lv[k] || {}; for (var i = 0; i < acts.length; i++) n += Math.min(3, Math.max(0, q[acts[i]] | 0)); }
      for (k in (d.books || {})) { q = d.books[k] || {}; n += (q.l ? 1 : 0) + (q.r ? 1 : 0) + (q.p ? 1 : 0); }
      return n;
    } },
  // Línea del Tiempo: one star for every 10 events opened (up to 15) and
  // the best round (0 to 3 stars) of each game: put in order (one per
  // number of cards), who lived at the same time, before or after, and
  // time-travel trivia for each era.
  { id: 'linea', prefix: 'zs_linea_', stars: function(d) {
      var n = 0, k, seen = 0, g = d.g || {};
      for (k in (d.seen || {})) seen++;
      n += Math.min(15, Math.floor(seen / 10));
      for (k in g) n += Math.min(3, Math.max(0, g[k] | 0));
      return n;
    } },
  // Árbol familiar: each family game is starred by its best score out of 5
  // (3 right = 1 star, 4 = 2, 5 = 3), one star for every 3 relatives whose page
  // was opened (up to 3), one for 1, 5 and 10 "How are we related?" answers, and
  // one for opening the family map. The tree itself is household data and never scores.
  { id: 'arbol', prefix: 'zs_arbol_', stars: function(d) {
      var n = 0, k, q = d.q || {}, seen = 0, rel = d.rel | 0;
      for (k in q) n += Math.max(0, Math.min(3, (q[k] | 0) - 2));
      for (k in (d.seen || {})) seen++;
      n += Math.min(3, Math.floor(seen / 3));
      n += rel >= 10 ? 3 : rel >= 5 ? 2 : rel >= 1 ? 1 : 0;
      n += d.map ? 1 : 0;
      return n;
    } },
  // Code Lab: each mission is worth up to 3 stars (solved, no hints, a
  // short program), kept in { m: { '<missionId>': { s: 0..3, ... } } }.
  { id: 'codelab', prefix: 'zs_codelab_', stars: function(d) {
      var n = 0, m = d.m && typeof d.m === 'object' ? d.m : {};
      for (var k in m) if (m[k] && typeof m[k] === 'object') n += Math.min(3, Math.max(0, m[k].s | 0));
      return n;
    } },
  // Sibling challenges: one star for each challenge solved, to the kid who
  // set it and the kid who solved it. The record is { stars: { id: 'YYYY-MM-DD' } }
  // (a cache of the household log, see challenge-engine.js); at most 3 a
  // day, so a pile of easy challenges cannot farm stars.
  { id: 'challenge', prefix: 'zs_challenge_', stars: function(d) {
      var per = {}, n = 0, s = d.stars && typeof d.stars === 'object' ? d.stars : {};
      for (var id in s) per[String(s[id])] = (per[String(s[id])] || 0) + 1;
      for (var day in per) n += Math.min(3, per[day]);
      return n;
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

// The kid's total stars across every app — the same number the Explorer
// Rank uses. nav.js shows it in every app's top bar; it was called for
// years but never defined, so that counter always read 0.
function getTotalStars(userName) {
  try { return getPlayerStats(userName).totalStars || 0; } catch (e) { return 0; }
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
