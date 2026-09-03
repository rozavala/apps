/* ================================================================
   PROGRESS ADMIN (js/progress-admin.js)

   The engine behind Parents Corner → Progress Manager. Lets a
   grown-up put a kid at a specific point in an app — "she's
   practising Für Elise now, she already did everything before it" —
   or wipe an app clean, for when a device was reset and the saved
   progress went with it.

   Two kinds of app:

     mode 'sequence'  ordered units (songs, puzzles, stories…) listed
                      in js/progress-catalog.js. Setting a position
                      marks every earlier unit done and every later
                      one not done.
     mode 'reset'     progress that is a running tally rather than a
                      list (stars, matches, step logs). Reset only.

   Everything writes through the same per-kid localStorage key the
   app itself uses, stamps _syncedAt so a later CloudSync pull can't
   quietly undo the change, and pushes when the sync server is up.

   Adding an app: give it an entry in APPS. If it has an ordered
   list, add a builder in tools/build-progress-catalog.js too.
   ================================================================ */

var ProgressAdmin = (function() {
  'use strict';

  var MATH_LEVELS = [
    { i: 'cadet',     l: '🚀 Cadet — addition & subtraction', g: 'Levels' },
    { i: 'explorer',  l: '🛰 Explorer — times tables',        g: 'Levels' },
    { i: 'pilot',     l: '✈️ Pilot — division & mixed',       g: 'Levels' },
    { i: 'commander', l: '👑 Commander — fractions & more',   g: 'Levels' }
  ];

  // ── Storage ─────────────────────────────────────────────────────

  function kidKey(name) {
    return String(name || '').toLowerCase().replace(/\s+/g, '_');
  }

  function _storageKey(app, name) {
    var k = kidKey(name);
    return k ? app.prefix + k : null;
  }

  function _read(app, name) {
    var key = _storageKey(app, name);
    if (!key) return {};
    try {
      var raw = localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) { return {}; }
  }

  function _write(app, name, data) {
    var key = _storageKey(app, name);
    if (!key) return false;
    // Stamp the write as fresh. CloudSync.pull only overwrites when the
    // server copy is newer, so without this a stale server snapshot
    // could roll a grown-up's edit straight back on the next sync.
    data._syncedAt = Date.now();
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (typeof Debug !== 'undefined') Debug.error('[ProgressAdmin] save failed', key + ': ' + e.message);
      return false;
    }
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(key); } catch (e) {}
    }
    return true;
  }

  // ── Small helpers shared by the app adapters ────────────────────

  // Rebuild a list-shaped record ("which ids are done") from a count.
  function _idsUpTo(units, count) {
    return units.slice(0, count).map(function(u) { return u.i; });
  }

  // Rewrite a map-shaped record, keeping whatever a kid genuinely
  // earned on units that stay done, so nudging the pointer forward
  // never downgrades a real 3-star result to a synthetic one.
  function _applyMap(data, units, count, make) {
    units.forEach(function(u, idx) {
      if (idx < count) data[u.i] = make(data[u.i] || {}, u);
      else delete data[u.i];
    });
    return data;
  }

  function _isoNow() { return new Date().toISOString(); }

  // ── The apps ────────────────────────────────────────────────────

  var APPS = [
    {
      id: 'piano', label: 'Little Maestro', icon: '🎹', href: 'little-maestro.html',
      prefix: 'littlemaestro_', catalog: 'piano', mode: 'sequence', noun: 'song',
      done: function(data, u) {
        var p = data.progress || {};
        return !!((p[u.i] && p[u.i].stars > 0) || ((p.songStars || {})[u.i] > 0));
      },
      apply: function(data, units, count) {
        var p = data.progress || {};
        _applyMap(p, units, count, function(prev) {
          return {
            stars: prev.stars > 0 ? prev.stars : 3,
            completedAt: prev.completedAt || _isoNow(),
            sessionCount: prev.sessionCount || 1,
            unlocked: true
          };
        });
        // The song they're on stays uncompleted but explicitly open, so
        // the quest map lets them tap straight into it.
        var current = units[count];
        if (current) p[current.i] = { unlocked: true };

        p.songStars = {};
        units.slice(0, count).forEach(function(u) { p.songStars[u.i] = p[u.i].stars; });
        p.completedSongs = _idsUpTo(units, count);
        var marker = current ? count : units.length - 1;
        p.currentWorld = _worldNumber(units[marker].g);
        p.currentSong = _positionInGroup(units, marker);
        p.flashcardHistory = p.flashcardHistory || {};
        data.progress = p;
        return data;
      },
      clear: function(data) {
        // Keep the profile, settings (the parent PIN lives there!) and
        // practice stats — only the song ladder goes back to the start.
        data.progress = {
          currentWorld: 1, currentSong: 1,
          completedSongs: [], songStars: {}, flashcardHistory: {}
        };
        return data;
      }
    },

    {
      id: 'math', label: 'Math Galaxy', icon: '🧮', href: 'math-galaxy.html',
      prefix: 'zs_mathgalaxy_', units: MATH_LEVELS, mode: 'sequence', noun: 'level',
      done: function(data, u) { return !!(data[u.i] && data[u.i].bestStars > 0); },
      apply: function(data, units, count) {
        return _applyMap(data, units, count, function(prev) {
          return {
            bestStars: prev.bestStars > 0 ? prev.bestStars : 3,
            bestPct: prev.bestPct || 100,
            plays: prev.plays || 1,
            lastPlayed: prev.lastPlayed || _isoNow()
          };
        });
      }
    },

    {
      id: 'codecadet', label: 'Code Cadet', icon: '🤖', href: 'code-cadet.html',
      prefix: 'zs_codecadet_', catalog: 'codecadet', mode: 'sequence', noun: 'puzzle',
      done: function(data, u) { return !!(data[u.i] && data[u.i].stars > 0); },
      apply: function(data, units, count) {
        return _applyMap(data, units, count, function(prev) {
          return { stars: prev.stars > 0 ? prev.stars : 3, best: prev.best || null };
        });
      }
    },

    {
      id: 'chile', label: 'Descubre Chile', icon: '🇨🇱', href: 'descubre-chile.html',
      prefix: 'zs_chile_', catalog: 'chile', mode: 'sequence', noun: 'topic',
      done: function(data, u) { return !!(data[u.i] && data[u.i].bestStars > 0); },
      apply: function(data, units, count) {
        return _applyMap(data, units, count, function(prev) {
          return {
            bestStars: prev.bestStars > 0 ? prev.bestStars : 3,
            bestPct: prev.bestPct || 100,
            lastPlayed: prev.lastPlayed || _isoNow()
          };
        });
      }
    },

    {
      id: 'story', label: 'Story Explorer', icon: '📚', href: 'story-explorer.html',
      prefix: 'zs_story_', catalog: 'story', mode: 'sequence', noun: 'story',
      done: function(data, u) { return (data.storiesRead || []).indexOf(u.i) !== -1; },
      apply: function(data, units, count) {
        data.storiesRead = _idsUpTo(units, count);
        data.totalStars = count * 3;
        return data;
      }
    },

    {
      id: 'bible', label: 'Bible Explorer', icon: '📖', href: 'bible-explorer.html',
      prefix: 'zs_bible_', catalog: 'bible', mode: 'sequence', noun: 'story',
      done: function(data, u) { return (data.stories || []).indexOf(u.i) !== -1; },
      apply: function(data, units, count) {
        data.stories = _idsUpTo(units, count);
        var stars = data.storyStars || {};
        data.storyStars = {};
        units.slice(0, count).forEach(function(u) {
          data.storyStars[u.i] = stars[u.i] > 0 ? stars[u.i] : 3;
        });
        return data; // memorised verses and book quizzes are left alone
      }
    },

    {
      id: 'vocab', label: 'Vocabulario Vivo', icon: '📚', href: 'vocabulario-vivo.html',
      prefix: 'zs_vocab_', catalog: 'vocab', mode: 'sequence', noun: 'root',
      done: function(data, u) { return (data.seenRoots || []).indexOf(u.i) !== -1; },
      apply: function(data, units, count) {
        data.seenRoots = _idsUpTo(units, count);
        return data;
      }
    },

    {
      id: 'civics', label: 'Civics Lab', icon: '🏛️', href: 'civics-lab.html',
      prefix: 'zs_civics_', catalog: 'civics', mode: 'sequence', noun: 'topic',
      done: function(data, u) {
        var list = u.k === 'branch' ? (data.branches || []) : (data.institutions || []);
        return list.indexOf(u.i) !== -1;
      },
      apply: function(data, units, count) {
        var done = units.slice(0, count);
        data.branches = done.filter(function(u) { return u.k === 'branch'; }).map(function(u) { return u.i; });
        data.institutions = done.filter(function(u) { return u.k === 'inst'; }).map(function(u) { return u.i; });
        return data;
      }
    },

    {
      id: 'lab', label: 'Lab Explorer', icon: '🔬', href: 'lab-explorer.html',
      prefix: 'zs_lab_', catalog: 'lab', mode: 'sequence', noun: 'lab',
      done: function(data, u) { return !!(data[u.i] && data[u.i].stars > 0); },
      apply: function(data, units, count) {
        _applyMap(data, units, count, function(prev, u) {
          return {
            completed: prev.completed || u.n || 1,
            stars: prev.stars > 0 ? prev.stars : 3
          };
        });
        data.totalStars = units.slice(0, count).reduce(function(sum, u) {
          return sum + ((data[u.i] || {}).stars || 0);
        }, 0);
        return data;
      }
    },

    {
      id: 'guitar', label: 'Guitar Jam', icon: '🎸', href: 'guitar-jam.html',
      prefix: 'zs_guitar_', catalog: 'guitar', mode: 'sequence', noun: 'song',
      done: function(data, u) {
        return (data.songsCompleted || []).some(function(s) { return s.songId === u.i; });
      },
      apply: function(data, units, count) {
        var prev = data.songsCompleted || [];
        data.songsCompleted = units.slice(0, count).map(function(u) {
          var was = prev.filter(function(s) { return s.songId === u.i; })[0];
          return { songId: u.i, bestStars: (was && was.bestStars) || 3 };
        });
        data.chordsLearned = data.chordsLearned || [];
        return data;
      }
    },

    {
      id: 'art', label: 'Art Studio', icon: '🎨', href: 'art-studio.html',
      prefix: 'zs_art_', catalog: 'art', mode: 'sequence', noun: 'lesson',
      done: function(data, u) { return (data.lessonsCompleted || []).indexOf(u.i) !== -1; },
      apply: function(data, units, count) {
        data.lessonsCompleted = _idsUpTo(units, count);
        return data; // the gallery of drawings is not progress — keep it
      },
      clear: function(data) {
        return { gallery: data.gallery || [], totalStars: 0, lessonsCompleted: [] };
      }
    },

    {
      id: 'world', label: 'World Explorer', icon: '🌍', href: 'world-explorer.html',
      prefix: 'zs_world_', catalog: 'world', mode: 'sequence', noun: 'country',
      done: function(data, u) { return (data.visited || []).indexOf(u.i) !== -1; },
      apply: function(data, units, count) {
        data.visited = _idsUpTo(units, count);
        data.quizDone = data.quizDone || [];
        data.totalStars = count + data.quizDone.length;
        return data;
      }
    },

    {
      id: 'chess', label: 'Chess Quest', icon: '♟️', href: 'chess-quest.html',
      prefix: 'zs_chess_', catalog: 'chess', mode: 'sequence', noun: 'puzzle',
      // Chess Quest keeps a solved count, not a per-puzzle record, so a
      // unit's id is its 1-based place in the puzzle ladder.
      done: function(data, u) { return (data.puzzlesSolved || 0) >= u.i; },
      apply: function(data, units, count) {
        data.puzzlesSolved = count;
        return data;
      }
    },

    // ── Tally-shaped progress: reset only ─────────────────────────
    { id: 'faith',    label: 'Fe Explorador',    icon: '⛪',  href: 'fe-explorador.html',    prefix: 'zs_fe_',       mode: 'reset' },
    { id: 'guess',    label: 'Guess Quest',      icon: '🎯',  href: 'guess-quest.html',      prefix: 'zs_guess_',    mode: 'reset' },
    { id: 'atlas',    label: 'World Atlas',      icon: '🗺️',  href: 'world-atlas.html',      prefix: 'zs_atlas_',    mode: 'reset' },
    { id: 'money',    label: 'Money Master',     icon: '💰',  href: 'money-master.html',     prefix: 'zs_money_',    mode: 'reset' },
    { id: 'invest',   label: 'Invest Quest',     icon: '📈',  href: 'invest-quest.html',     prefix: 'zs_invest_',   mode: 'reset' },
    { id: 'quest',    label: 'Quest Adventure',  icon: '🧗',  href: 'quest-adventure.html',  prefix: 'zs_quest_',    mode: 'reset' },
    { id: 'bmcheck',  label: 'Book & Movie Check', icon: '🔍', href: 'book-movie-check.html', prefix: 'zs_bmcheck_', mode: 'reset' },
    { id: 'worldcup', label: 'World Cup 2026',   icon: '🏆',  href: 'world-cup.html',        prefix: 'zs_worldcup_', mode: 'reset' },
    { id: 'sports',   label: 'Sports Arena',     icon: '🏓',  href: 'sports-arena.html',     prefix: 'zs_sports_',   mode: 'reset' },
    { id: 'move',     label: 'Move Quest',       icon: '💪',  href: 'move-quest.html',       prefix: 'zs_move_',     mode: 'reset' }
  ];

  var _byId = {};
  APPS.forEach(function(a) { _byId[a.id] = a; });

  function _worldNumber(group) {
    var m = /(\d+)/.exec(group || '');
    return m ? parseInt(m[1], 10) : 1;
  }

  // Where the current unit sits inside its own group, 1-based — what
  // Little Maestro shows as "World 3 · Song 7".
  function _positionInGroup(units, index) {
    var group = units[index].g;
    var n = 0;
    for (var i = 0; i <= index; i++) if (units[i].g === group) n++;
    return n;
  }

  // ── Public API ──────────────────────────────────────────────────

  function getApp(appId) { return _byId[appId] || null; }

  function unitsFor(app) {
    if (app.units) return app.units;
    if (!app.catalog) return [];
    return (window.ZSProgressCatalog || {})[app.catalog] || [];
  }

  // Where a kid stands in one app.
  //   doneCount   how many units count as finished
  //   index       the unit they are on (== doneCount), total when finished
  //   current     that unit, or null when everything is done
  //   hasData     whether the app has saved anything for this kid at all
  function getState(kidName, appId) {
    var app = getApp(appId);
    if (!app) return null;
    var key = _storageKey(app, kidName);
    var data = _read(app, kidName);
    var hasData = !!(key && localStorage.getItem(key));

    if (app.mode !== 'sequence') {
      return { app: app, mode: 'reset', hasData: hasData, units: [], total: 0, doneCount: 0, index: 0, current: null };
    }

    var units = unitsFor(app);
    // Read the ladder as a position, not a scattered set: the first
    // unit they have not finished is the one they are working on.
    var doneCount = 0;
    while (doneCount < units.length && app.done(data, units[doneCount])) doneCount++;

    return {
      app: app,
      mode: 'sequence',
      hasData: hasData,
      units: units,
      total: units.length,
      doneCount: doneCount,
      index: doneCount,
      current: units[doneCount] || null
    };
  }

  // Put a kid at `index` — they are working on units[index], and
  // everything before it counts as done. index === units.length marks
  // the whole app finished.
  function setPosition(kidName, appId, index) {
    var app = getApp(appId);
    if (!app || app.mode !== 'sequence') return false;
    var units = unitsFor(app);
    var count = Math.max(0, Math.min(units.length, parseInt(index, 10) || 0));
    var data = app.apply(_read(app, kidName), units, count);
    return _write(app, kidName, data);
  }

  // Wipe one app for one kid. Writes an empty record rather than
  // removing the key, so the cleared state is what syncs to the other
  // devices instead of them pushing the old progress back.
  function reset(kidName, appId) {
    var app = getApp(appId);
    if (!app) return false;
    var fresh = app.clear ? app.clear(_read(app, kidName)) : {};
    return _write(app, kidName, fresh);
  }

  function resetAll(kidName) {
    var n = 0;
    APPS.forEach(function(a) { if (reset(kidName, a.id)) n++; });
    return n;
  }

  // Everything the Progress Manager needs to draw one kid's row set.
  function summary(kidName) {
    return APPS.map(function(a) { return getState(kidName, a.id); });
  }

  return {
    APPS: APPS,
    getApp: getApp,
    unitsFor: unitsFor,
    kidKey: kidKey,
    getState: getState,
    setPosition: setPosition,
    reset: reset,
    resetAll: resetAll,
    summary: summary
  };
})();

if (typeof window !== 'undefined') window.ProgressAdmin = ProgressAdmin;
