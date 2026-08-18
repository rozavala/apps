/* ================================================================
   MOVE QUEST — move-quest.js

   Guided seven-minute home workouts for the Zavala Serra kids.

   The point of the app is that the screen is *not* needed while the
   kids move: they study the drawings first, put the tablet on the
   floor, and a coach voice plus countdown beeps carry the circuit.

   Storage key: zs_move_{userName}
   Data: {
     level, workoutsDone, totalSeconds, totalStars,
     lastWorkout, streak, history: [...],
     steps: { 'YYYY-MM-DD': n }, stepGoal,
     tier, voice, beeps, doubleRound
   }

   Finished workouts are also logged into Sports Arena as a
   "Home Workout" activity so the family streak counts them.

   Requires: auth.js, sounds.js, tts.js, activity-log.js,
             sports-arena.js, move-quest-moves.js
   ================================================================ */

var MoveQuest = (function() {
  'use strict';

  var STORE_PREFIX = 'zs_move_';
  var MAX_LEVEL = 10;
  var WORKOUTS_PER_LEVEL = 4;
  var DOUBLE_ROUND_LEVEL = 6;
  var COUNT_IN_SECONDS = 10;
  var HISTORY_MAX = 120;

  // Age groups. `work`/`rest`/`moves` are the Level 1 shape; the level
  // stretches them from there. Ages come from the profile but a parent
  // can override in Settings.
  var TIERS = [
    { rank: 1, id: 'sprout', name: 'Sprout', nameEs: 'Brote', icon: '🌱',
      ages: '4 to 6', minAge: 0, work: 20, rest: 20, moves: 8, stretches: 2,
      desc: 'Short bursts with long rests. Animal moves, no push-ups yet.' },
    { rank: 2, id: 'explorer', name: 'Explorer', nameEs: 'Explorador', icon: '🧭',
      ages: '7 to 9', minAge: 7, work: 25, rest: 15, moves: 9, stretches: 2,
      desc: 'Longer efforts, knee push-ups and the first core holds.' },
    { rank: 3, id: 'athlete', name: 'Athlete', nameEs: 'Atleta', icon: '⚡',
      ages: '10 to 12', minAge: 10, work: 30, rest: 10, moves: 12, stretches: 1,
      desc: 'The classic seven-minute circuit: 30 seconds on, 10 off.' },
    { rank: 4, id: 'champion', name: 'Champion', nameEs: 'Campeon', icon: '🔥',
      ages: '13 and up', minAge: 13, work: 40, rest: 15, moves: 12, stretches: 1,
      desc: 'Full-length efforts and every advanced move unlocked.' }
  ];

  var CATEGORY_LABELS = {
    warmup: 'Warm-up', cardio: 'Cardio', strength: 'Strength',
    core: 'Core', balance: 'Balance', stretch: 'Stretch'
  };

  // ── Small helpers ───────────────────────────────────────────────

  function _esc(s) {
    if (typeof escHtml === 'function') return escHtml(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function _pad(n) { return (n < 10 ? '0' : '') + n; }

  function _dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate());
  }

  function _daysBetween(aKey, bKey) {
    var a = new Date(aKey + 'T00:00:00');
    var b = new Date(bKey + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  // Deterministic shuffle so "today's circuit" is the same every time
  // it is opened — until the kid taps Shuffle.
  function _seedFrom(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function _rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Storage ─────────────────────────────────────────────────────

  function _key() {
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return null;
    return STORE_PREFIX + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _empty() {
    return {
      level: 1, workoutsDone: 0, totalSeconds: 0, totalStars: 0,
      lastWorkout: null, streak: 0, history: [],
      steps: {}, stepGoal: 10000,
      tier: null, voice: true, beeps: true, doubleRound: false
    };
  }

  function getData() {
    var key = _key();
    if (!key) return _empty();
    try {
      var raw = JSON.parse(localStorage.getItem(key));
      if (!raw || typeof raw !== 'object') return _empty();
      var base = _empty();
      for (var k in base) {
        if (Object.prototype.hasOwnProperty.call(raw, k) && raw[k] !== null) base[k] = raw[k];
      }
      if (!Array.isArray(base.history)) base.history = [];
      if (!base.steps || typeof base.steps !== 'object') base.steps = {};
      base.lastWorkout = raw.lastWorkout || null;
      return base;
    } catch (e) { return _empty(); }
  }

  function saveData(data) {
    var key = _key();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(key);
    } catch (e) {}
  }

  // ── Tier & level ────────────────────────────────────────────────

  function tierById(id) {
    for (var i = 0; i < TIERS.length; i++) if (TIERS[i].id === id) return TIERS[i];
    return null;
  }

  function tierForAge(age) {
    var pick = TIERS[0];
    for (var i = 0; i < TIERS.length; i++) if (age >= TIERS[i].minAge) pick = TIERS[i];
    return pick;
  }

  function getTier(data) {
    data = data || getData();
    var chosen = data.tier ? tierById(data.tier) : null;
    if (chosen) return chosen;
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    var age = user && typeof user.age === 'number' ? user.age : 8;
    return tierForAge(age);
  }

  function setTier(id) {
    var data = getData();
    data.tier = id;
    saveData(data);
  }

  function getLevel(data) {
    data = data || getData();
    return Math.max(1, Math.min(MAX_LEVEL, data.level || 1));
  }

  // How the circuit grows with the level: a little more work, a little
  // less rest, and one extra move at Level 5 and again at Level 8.
  function planParams(tier, level) {
    var floorRest = tier.rank === 1 ? 12 : 8;
    return {
      work: tier.work + Math.min(15, Math.floor((level - 1) / 2) * 5),
      rest: Math.max(floorRest, tier.rest - Math.floor((level - 1) / 3) * 2),
      count: tier.moves + (level >= 5 ? 1 : 0) + (level >= 8 ? 1 : 0)
    };
  }

  function levelProgress(data) {
    data = data || getData();
    var level = getLevel(data);
    if (level >= MAX_LEVEL) {
      return { level: level, done: WORKOUTS_PER_LEVEL, need: WORKOUTS_PER_LEVEL, pct: 100, maxed: true };
    }
    var done = (data.workoutsDone || 0) % WORKOUTS_PER_LEVEL;
    return {
      level: level, done: done, need: WORKOUTS_PER_LEVEL,
      pct: Math.round((done / WORKOUTS_PER_LEVEL) * 100), maxed: false
    };
  }

  function canDoubleRound(data) {
    return getLevel(data) >= DOUBLE_ROUND_LEVEL;
  }

  // ── Building a circuit ──────────────────────────────────────────

  var _shuffleNonce = 0;

  function buildWorkout(data) {
    data = data || getData();
    var tier = getTier(data);
    var level = getLevel(data);
    var params = planParams(tier, level);
    var pool = MoveQuestMoves.poolFor(tier.rank, level);

    var byCat = {};
    pool.forEach(function(m) {
      if (!byCat[m.cat]) byCat[m.cat] = [];
      byCat[m.cat].push(m);
    });

    var rand = _rng(_seedFrom(_dayKey() + '|' + tier.id + '|L' + level + '|' + _shuffleNonce));
    var used = {};

    function take(cat) {
      var list = (byCat[cat] || []).filter(function(m) { return !used[m.id]; });
      if (!list.length) {
        list = pool.filter(function(m) {
          return !used[m.id] && m.cat !== 'stretch' && m.cat !== 'warmup';
        });
      }
      if (!list.length) {
        // Every move is spoken for — allow a repeat rather than a short circuit.
        list = (byCat[cat] || pool).slice();
      }
      if (!list.length) return null;
      var pick = list[Math.floor(rand() * list.length)];
      used[pick.id] = true;
      return pick;
    }

    var picks = [];
    var warm = take('warmup');
    if (warm) picks.push(warm);

    var stretches = Math.min(tier.stretches, Math.max(1, params.count - picks.length - 1));
    var middle = Math.max(1, params.count - picks.length - stretches);
    var cycle = ['cardio', 'strength', 'core', 'cardio', 'strength', 'balance'];
    for (var i = 0; i < middle; i++) {
      var m = take(cycle[i % cycle.length]);
      if (m) picks.push(m);
    }
    for (var s = 0; s < stretches; s++) {
      var st = take('stretch');
      if (st) picks.push(st);
    }

    var rounds = (data.doubleRound && canDoubleRound(data)) ? 2 : 1;
    var perRound = picks.length * params.work + (picks.length - 1) * params.rest;
    var totalSec = perRound * rounds + (rounds > 1 ? params.rest * 2 : 0);

    return {
      tierId: tier.id, tierName: tier.name, level: level,
      work: params.work, rest: params.rest, rounds: rounds,
      moves: picks, totalSec: totalSec
    };
  }

  function reshuffle() { _shuffleNonce++; }

  // ── Finishing a workout ─────────────────────────────────────────

  function completeWorkout(plan, activeSeconds) {
    var data = getData();
    var today = _dayKey();
    var beforeLevel = getLevel(data);

    data.workoutsDone = (data.workoutsDone || 0) + 1;
    data.totalSeconds = (data.totalSeconds || 0) + Math.max(0, Math.round(activeSeconds || 0));
    data.totalStars = (data.totalStars || 0) + 1;

    // Day streak: consecutive calendar days with at least one workout.
    if (data.lastWorkout === today) {
      // already counted today
    } else if (data.lastWorkout && _daysBetween(data.lastWorkout, today) === 1) {
      data.streak = (data.streak || 0) + 1;
    } else {
      data.streak = 1;
    }
    data.lastWorkout = today;

    var leveledTo = null;
    if (beforeLevel < MAX_LEVEL && data.workoutsDone % WORKOUTS_PER_LEVEL === 0) {
      data.level = beforeLevel + 1;
      leveledTo = data.level;
    }

    var minutes = Math.max(1, Math.round((activeSeconds || 0) / 60));
    data.history.unshift({
      date: new Date().toISOString(),
      tier: plan.tierId, level: plan.level,
      moves: plan.moves.length * plan.rounds,
      rounds: plan.rounds, minutes: minutes
    });
    if (data.history.length > HISTORY_MAX) data.history.length = HISTORY_MAX;

    saveData(data);

    // Hand the workout to Sports Arena so it lands in the family
    // activity log and the weekly streak, not just in this app.
    var logged = false;
    try {
      if (typeof SportsArena !== 'undefined' && SportsArena.logActivity) {
        SportsArena.logActivity({
          sportId: 'workout',
          duration: minutes,
          notes: 'Move Quest — Level ' + plan.level + ', ' +
                 (plan.moves.length * plan.rounds) + ' moves',
          appName: 'Move Quest',
          appIcon: '💪',
          logText: 'Finished a Level ' + plan.level + ' workout (' + minutes + ' min)'
        });
        logged = true;
      }
    } catch (e) {}

    var unlocked = leveledTo
      ? MoveQuestMoves.unlockedAt(getTier(data).rank, leveledTo)
      : [];

    return {
      minutes: minutes, streak: data.streak, leveledTo: leveledTo,
      unlocked: unlocked, logged: logged, workoutsDone: data.workoutsDone
    };
  }

  // ── Steps ───────────────────────────────────────────────────────

  function getStepGoal(data) { return (data || getData()).stepGoal || 10000; }

  function setStepGoal(n) {
    var data = getData();
    data.stepGoal = Math.max(1000, Math.min(50000, Math.round(n) || 10000));
    saveData(data);
    return data.stepGoal;
  }

  function setSteps(dayKey, count) {
    var data = getData();
    var n = Math.max(0, Math.min(200000, Math.round(Number(count) || 0)));
    if (n === 0) delete data.steps[dayKey];
    else data.steps[dayKey] = n;
    saveData(data);
    if (n > 0 && typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Move Quest', '👟', 'Logged ' + n.toLocaleString() + ' steps');
    }
    return n;
  }

  function getSteps(dayKey, data) {
    return ((data || getData()).steps || {})[dayKey] || 0;
  }

  // Last 7 days, oldest first.
  function getStepWeek(data) {
    data = data || getData();
    var out = [];
    var now = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var key = _dayKey(d);
      out.push({ key: key, date: d, steps: (data.steps || {})[key] || 0 });
    }
    return out;
  }

  // ── Importing a steps export ────────────────────────────────────
  // Handles the shapes a watch export actually arrives in: a JSON array
  // of { dateTime, value } samples (summed per day), a JSON array of
  // daily records, or a CSV with a date column and a steps column.
  // Everything happens in the browser — the file is never uploaded.

  function _normDate(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).trim().replace(/^["']|["']$/g, '');
    if (!s) return null;

    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + '-' + _pad(+m[2]) + '-' + _pad(+m[3]);

    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (m) {
      var a = +m[1], b = +m[2], y = +m[3];
      if (y < 100) y += 2000;
      // Exports are usually month-first; a first number above 12 can
      // only be a day, so flip it.
      var mo = a, day = b;
      if (a > 12 && b <= 12) { mo = b; day = a; }
      if (mo < 1 || mo > 12 || day < 1 || day > 31) return null;
      return y + '-' + _pad(mo) + '-' + _pad(day);
    }

    var parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return _dayKey(parsed);
    return null;
  }

  function _normCount(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/["']/g, '').replace(/[.,\s](?=\d{3}\b)/g, '').trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    var n = Math.round(Number(s));
    if (!isFinite(n) || n < 0 || n > 200000) return null;
    return n;
  }

  function _splitCsvLine(line) {
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line.charAt(i);
      if (c === '"') { inQ = !inQ; continue; }
      if ((c === ',' || c === ';' || c === '\t') && !inQ) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }

  var DATE_HEADERS = ['date', 'datetime', 'date_time', 'day', 'fecha', 'activity date', 'start time'];
  var STEP_HEADERS = ['steps', 'step count', 'stepcount', 'value', 'total steps', 'pasos'];

  function _headerIndex(cells, names) {
    for (var i = 0; i < cells.length; i++) {
      var h = cells[i].trim().toLowerCase().replace(/["']/g, '');
      for (var j = 0; j < names.length; j++) if (h === names[j]) return i;
    }
    for (var i2 = 0; i2 < cells.length; i2++) {
      var h2 = cells[i2].trim().toLowerCase();
      for (var j2 = 0; j2 < names.length; j2++) if (h2.indexOf(names[j2]) !== -1) return i2;
    }
    return -1;
  }

  function _collectFromRecords(records) {
    var totals = {};
    records.forEach(function(rec) {
      if (!rec || typeof rec !== 'object') return;
      var dateVal = rec.dateTime || rec.datetime || rec.date || rec.day || rec.Date || rec.DateTime;
      var stepVal = rec.value !== undefined ? rec.value
                  : rec.steps !== undefined ? rec.steps
                  : rec.Steps !== undefined ? rec.Steps
                  : rec.count;
      var key = _normDate(dateVal);
      var n = _normCount(stepVal);
      if (key === null || n === null) return;
      totals[key] = (totals[key] || 0) + n;
    });
    return totals;
  }

  function _collectFromCsv(text) {
    var lines = text.split(/\r?\n/).filter(function(l) { return l.trim() !== ''; });
    if (!lines.length) return {};
    var headerRow = -1, dateIdx = -1, stepIdx = -1;
    for (var i = 0; i < Math.min(lines.length, 12); i++) {
      var cells = _splitCsvLine(lines[i]);
      var d = _headerIndex(cells, DATE_HEADERS);
      var s = _headerIndex(cells, STEP_HEADERS);
      if (d !== -1 && s !== -1) { headerRow = i; dateIdx = d; stepIdx = s; break; }
    }
    if (headerRow === -1) return {};
    var totals = {};
    for (var r = headerRow + 1; r < lines.length; r++) {
      var row = _splitCsvLine(lines[r]);
      var key = _normDate(row[dateIdx]);
      var n = _normCount(row[stepIdx]);
      if (key === null || n === null) continue;
      totals[key] = (totals[key] || 0) + n;
    }
    return totals;
  }

  // Parse one file's text into { 'YYYY-MM-DD': steps }. Throws with a
  // readable message when the file cannot be parsed at all.
  function collectStepTotals(text) {
    var trimmed = String(text || '').trim();
    if (!trimmed) throw new Error('that file is empty.');

    var totals = null;
    if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
      var parsed;
      try { parsed = JSON.parse(trimmed); }
      catch (e) { throw new Error('that JSON file could not be read.'); }
      var records = null;
      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed && typeof parsed === 'object') {
        for (var k in parsed) {
          if (Array.isArray(parsed[k])) { records = parsed[k]; break; }
        }
      }
      if (records) totals = _collectFromRecords(records);
    }
    if (!totals || !Object.keys(totals).length) totals = _collectFromCsv(trimmed);
    return totals || {};
  }

  // Write a collected map to storage. Each date is replaced rather than
  // added to, so importing the same export twice is a no-op.
  function mergeStepTotals(totals) {
    var keys = Object.keys(totals || {}).sort();
    if (!keys.length) return { ok: false, error: 'No dates and step counts were found.' };
    var data = getData();
    keys.forEach(function(key) {
      var n = Math.min(200000, totals[key]);
      if (n > 0) data.steps[key] = n;
    });
    saveData(data);
    return { ok: true, days: keys.length, from: keys[0], to: keys[keys.length - 1] };
  }

  function importSteps(text) {
    var totals;
    try { totals = collectStepTotals(text); }
    catch (e) {
      var msg = e.message;
      return { ok: false, error: msg.charAt(0).toUpperCase() + msg.slice(1) };
    }
    var res = mergeStepTotals(totals);
    if (!res.ok) res.error = 'No dates and step counts were found in that file.';
    return res;
  }

  /* ── Google Takeout archives ──────────────────────────────────────
     Takeout hands back one .zip holding

       Takeout/Fitbit/Global Export Data/steps-YYYY-MM-DD.json

     — one file per month of minute-level samples, and a folder per
     child on a family account. Only the bytes we need are read (the
     directory at the tail of the archive, then the steps entries
     themselves), so a large archive never lands in memory whole.
     Inflating uses the browser's own DecompressionStream: no library,
     nothing downloaded, works with the wifi off.
     ───────────────────────────────────────────────────────────────── */

  var ZIP_EOCD_SIG = 0x06054b50;
  var ZIP_CD_SIG = 0x02014b50;
  var MAX_ENTRY_BYTES = 20 * 1024 * 1024;
  var MAX_ZIP_ENTRIES = 400;

  // Folder names that belong to the export's own structure rather than
  // to a person — whatever is left above them names the child.
  var _EXPORT_FOLDERS = /^(takeout|fitbit|google health|global export data|physical activity|user site export data|other|sleep|activity)$/i;

  function _zipOwner(path) {
    var parts = path.split('/');
    parts.pop();
    while (parts.length && _EXPORT_FOLDERS.test(parts[parts.length - 1])) parts.pop();
    return {
      key: parts.join('/') || 'fitbit',
      label: parts.length ? parts[parts.length - 1] : 'Fitbit'
    };
  }

  function _isStepsEntry(name) {
    if (/\/$/.test(name)) return false;
    var base = name.split('/').pop().toLowerCase();
    if (!base || base.charAt(0) === '.') return false;
    if (!/\.(json|csv)$/.test(base)) return false;
    return base.indexOf('step') !== -1;
  }

  function _sliceBuffer(file, start, end) {
    return file.slice(Math.max(0, start), end).arrayBuffer();
  }

  function _readFileText(file) {
    if (file.text) return file.text();
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() { resolve(String(reader.result || '')); };
      reader.onerror = function() { reject(new Error('unreadable')); };
      reader.readAsText(file);
    });
  }

  async function _readZipDirectory(file) {
    // The end-of-central-directory record lives in the last 22 bytes
    // plus up to 64KB of archive comment.
    var tailLen = Math.min(file.size, 66000);
    var tail = new DataView(await _sliceBuffer(file, file.size - tailLen, file.size));
    var eocd = -1;
    for (var i = tail.byteLength - 22; i >= 0; i--) {
      if (tail.getUint32(i, true) === ZIP_EOCD_SIG) { eocd = i; break; }
    }
    if (eocd === -1) throw new Error('not-a-zip');

    var count = tail.getUint16(eocd + 10, true);
    var cdSize = tail.getUint32(eocd + 12, true);
    var cdOffset = tail.getUint32(eocd + 16, true);
    // Zip64 parks the real values elsewhere; rather than grow a second
    // parser, tell the parent to export a smaller archive.
    if (count === 0xFFFF || cdSize === 0xFFFFFFFF || cdOffset === 0xFFFFFFFF) throw new Error('zip64');

    var cd = new DataView(await _sliceBuffer(file, cdOffset, cdOffset + cdSize));
    var decoder = new TextDecoder('utf-8');
    var entries = [];
    var p = 0;
    while (p + 46 <= cd.byteLength && cd.getUint32(p, true) === ZIP_CD_SIG) {
      var nameLen = cd.getUint16(p + 28, true);
      var extraLen = cd.getUint16(p + 30, true);
      var commentLen = cd.getUint16(p + 32, true);
      entries.push({
        name: decoder.decode(new Uint8Array(cd.buffer, p + 46, nameLen)),
        method: cd.getUint16(p + 10, true),
        compressedSize: cd.getUint32(p + 20, true),
        size: cd.getUint32(p + 24, true),
        localOffset: cd.getUint32(p + 42, true)
      });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  async function _readZipEntry(file, entry) {
    // The local header repeats the name and extra fields, and its own
    // lengths are the only trustworthy ones.
    var head = new DataView(await _sliceBuffer(file, entry.localOffset, entry.localOffset + 30));
    var start = entry.localOffset + 30 + head.getUint16(26, true) + head.getUint16(28, true);
    var buf = await _sliceBuffer(file, start, start + entry.compressedSize);
    if (entry.method === 0) return new TextDecoder('utf-8').decode(new Uint8Array(buf));
    if (entry.method !== 8) throw new Error('unsupported-compression');
    if (typeof DecompressionStream === 'undefined') throw new Error('no-inflate');
    var stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  }

  function _ingestZip(file, add, report) {
    return _readZipDirectory(file).then(function(entries) {
      var wanted = entries.filter(function(e) { return _isStepsEntry(e.name); });
      if (!wanted.length) {
        report.problems.push(file.name + ': no steps files inside — in Takeout, tick Fitbit.');
        return null;
      }
      if (wanted.length > MAX_ZIP_ENTRIES) {
        report.skipped += wanted.length - MAX_ZIP_ENTRIES;
        wanted = wanted.slice(0, MAX_ZIP_ENTRIES);
      }
      var chain = Promise.resolve();
      wanted.forEach(function(entry) {
        chain = chain.then(function() {
          if (entry.size > MAX_ENTRY_BYTES) { report.skipped++; return null; }
          return _readZipEntry(file, entry).then(function(text) {
            var owner = _zipOwner(entry.name);
            try {
              add(owner.key, owner.label, collectStepTotals(text));
              report.scanned++;
            } catch (e) { report.skipped++; }
          }, function() { report.skipped++; });
        });
      });
      return chain;
    }, function(err) {
      var why = err && err.message === 'zip64'
        ? 'that archive is too big to read here — in Takeout, tick only Fitbit.'
        : (err && err.message === 'no-inflate'
            ? 'this browser cannot unzip. Unzip it first and pick the steps files.'
            : 'that is not a readable .zip.');
      report.problems.push(file.name + ': ' + why);
      return null;
    });
  }

  /* Read every chosen file — plain exports or Takeout archives — and
     group the totals by whose folder they came from. Resolves to
     { owners: { key: { label, totals } }, report }. Nothing is saved
     here: a family archive holds every child, so the caller picks. */
  function gatherStepTotals(files) {
    var owners = {};
    var report = { scanned: 0, skipped: 0, problems: [] };

    function add(key, label, totals) {
      var dates = Object.keys(totals || {});
      if (!dates.length) return;
      if (!owners[key]) owners[key] = { label: label, totals: {} };
      var bucket = owners[key].totals;
      // Takeout's monthly files run mid-month to mid-month, so one date
      // can legitimately appear in two of them: sum within an import.
      dates.forEach(function(d) { bucket[d] = (bucket[d] || 0) + totals[d]; });
    }

    var chain = Promise.resolve();
    (files || []).forEach(function(file) {
      chain = chain.then(function() {
        if (/\.zip$/i.test(file.name)) return _ingestZip(file, add, report);
        if (/\.(tgz|gz|tar)$/i.test(file.name)) {
          report.problems.push(file.name + ': choose the .zip version of the export.');
          return null;
        }
        return _readFileText(file).then(function(text) {
          try {
            add('fitbit', 'Fitbit', collectStepTotals(text));
            report.scanned++;
          } catch (e) { report.problems.push(file.name + ': ' + e.message); }
        }, function() { report.problems.push(file.name + ': could not be read.'); });
      });
    });

    return chain.then(function() { return { owners: owners, report: report }; });
  }

  /* ================================================================
     UI
     ================================================================ */

  var el = {};
  var currentPlan = null;
  var libraryFilter = 'all';

  function $(id) { return document.getElementById(id); }

  function showScreen(name) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    var target = $('mq-screen-' + name);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
  }

  // ── Home ────────────────────────────────────────────────────────

  function renderHome() {
    var data = getData();
    var tier = getTier(data);
    var prog = levelProgress(data);
    var plan = currentPlan || buildWorkout(data);
    currentPlan = plan;

    el.tierPill.innerHTML =
      '<span>' + tier.icon + ' ' + _esc(tier.name) + '</span>' +
      '<span class="sep">|</span>' +
      '<span class="lvl">Level ' + prog.level + '</span>';

    el.levelFill.style.width = prog.pct + '%';
    el.levelNote.textContent = prog.maxed
      ? 'Top level reached — every move is unlocked.'
      : prog.done + ' of ' + prog.need + ' workouts to Level ' + (prog.level + 1);

    var mins = Math.round(plan.totalSec / 60);
    el.startDesc.textContent = plan.moves.length * plan.rounds + ' moves · about ' + mins +
      ' min · ' + plan.work + 's on, ' + plan.rest + 's off';

    var streak = data.streak || 0;
    el.streakBadge.textContent = streak > 1 ? '🔥 ' + streak + ' day streak' : '';

    var todaySteps = getSteps(_dayKey(), data);
    el.stepsBadge.textContent = todaySteps > 0
      ? '👟 ' + todaySteps.toLocaleString() + ' steps today'
      : '';
  }

  // ── Circuit preview ─────────────────────────────────────────────

  function renderPreview() {
    var plan = currentPlan || buildWorkout();
    currentPlan = plan;
    var mins = Math.round(plan.totalSec / 60);

    el.previewSummary.innerHTML =
      '<b>' + plan.moves.length + ' moves</b> · ' + plan.work + ' seconds on, ' +
      plan.rest + ' seconds rest' +
      (plan.rounds > 1 ? ' · <b>2 rounds</b>' : '') +
      ' · about <b>' + mins + ' minutes</b>.<br>' +
      'Look through the pictures, then put the screen down — the coach calls every move.';

    el.previewList.innerHTML = plan.moves.map(function(m, i) {
      return '<div class="lib-card">' +
        '<div class="lib-head">' +
          '<span class="lib-icon">' + m.icon + '</span>' +
          '<span>' +
            '<span class="lib-name">' + (i + 1) + '. ' + _esc(m.en) + '</span>' +
            '<span class="lib-name-es">' + _esc(m.es) + '</span>' +
          '</span>' +
          '<span class="lib-tag">' + (CATEGORY_LABELS[m.cat] || m.cat) + '</span>' +
        '</div>' +
        '<div class="lib-frames">' + MoveQuestMoves.figureSvg(m, 'frames') + '</div>' +
        '<div class="lib-cue">' + _esc(m.cue) + '</div>' +
      '</div>';
    }).join('');
  }

  /* ── Printable sheet ──────────────────────────────────────────────
     One page, every time. Rather than hope a flexible layout fits, the
     column count and figure height are worked out in millimetres from
     how many moves there are, so a 6-move Sprout circuit and a 29-move
     wall poster both land on a single sheet.
     ───────────────────────────────────────────────────────────────── */

  /* Only the grid shape is decided here. The sheet itself is a fixed
     height in print CSS and the rows divide it evenly, so the figures
     take whatever space the text leaves rather than pushing the page
     taller. That keeps it on one sheet whatever the fonts do — which
     matters, because the display font arrives over the network and a
     browser print header can eat another centimetre. */
  function _sheetGeometry(count) {
    var cols = count > 20 ? 5 : (count > 12 ? 4 : (count <= 6 ? 2 : 3));
    return { cols: cols, rows: Math.ceil(count / cols) };
  }

  function _sheetCell(move, index, opts) {
    var mode = opts.twoFrames ? 'frames' : 'single';
    return '<div class="sheet-cell">' +
      '<div class="sheet-name">' +
        (opts.numbered ? (index + 1) + '. ' : '') + _esc(move.en) +
        '<div class="sheet-name-es">' + _esc(move.es) + '</div>' +
      '</div>' +
      '<div class="sheet-figs' + (opts.twoFrames ? ' two' : '') + '">' +
        MoveQuestMoves.figureSvg(move, mode) +
      '</div>' +
      (opts.cues
        ? '<div class="sheet-cue">' + (move.hold ? 'Hold. ' : '') + _esc(move.cue) + '</div>'
        : '<div class="sheet-hold">' + (move.hold ? 'hold still' : '&nbsp;') + '</div>') +
    '</div>';
  }

  function buildSheet(moves, opts) {
    opts = opts || {};
    var geo = _sheetGeometry(moves.length);
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    return '<div class="sheet-head">' +
        '<div class="sheet-title">' + _esc(opts.title || 'Move Quest') + '</div>' +
        '<div class="sheet-meta">' + _esc(opts.meta || '') + '</div>' +
      '</div>' +
      '<div class="sheet-rule"></div>' +
      '<div class="sheet-grid" style="grid-template-columns:repeat(' + geo.cols + ',1fr);' +
        'grid-template-rows:repeat(' + geo.rows + ',minmax(0,1fr))">' +
        moves.map(function(m, i) { return _sheetCell(m, i, opts); }).join('') +
      '</div>' +
      '<div class="sheet-foot">' +
        '<span>Move Quest · Zavala Serra Apps</span>' +
        '<span>' + _esc(user ? user.name : '') + '</span>' +
      '</div>';
  }

  function _print(html) {
    var sheet = $('mq-print');
    if (!sheet) return;
    sheet.innerHTML = html;
    window.print();
  }

  function printCircuit() {
    var plan = currentPlan || buildWorkout();
    currentPlan = plan;
    var mins = Math.round(plan.totalSec / 60);
    _print(buildSheet(plan.moves, {
      title: "Today's Circuit",
      meta: plan.tierName + ' · Level ' + plan.level + ' · ' + plan.moves.length + ' moves · ' +
            plan.work + 's on, ' + plan.rest + 's rest' +
            (plan.rounds > 1 ? ' · 2 rounds' : '') + ' · about ' + mins + ' min',
      twoFrames: true, numbered: true, cues: true
    }));
  }

  function printLibrary() {
    var moves = MoveQuestMoves.MOVES.filter(function(m) {
      return libraryFilter === 'all' || m.cat === libraryFilter;
    });
    if (!moves.length) return;
    var what = libraryFilter === 'all'
      ? 'Every move'
      : (CATEGORY_LABELS[libraryFilter] || libraryFilter) + ' moves';
    _print(buildSheet(moves, {
      title: 'Move Quest — ' + what,
      meta: moves.length + ' moves · one picture each',
      twoFrames: false, numbered: false, cues: false
    }));
  }

  // ── Move guide ──────────────────────────────────────────────────

  function renderLibrary() {
    var data = getData();
    var tier = getTier(data);
    var level = getLevel(data);
    var cats = ['all', 'warmup', 'cardio', 'strength', 'core', 'balance', 'stretch'];

    el.libraryFilters.innerHTML = cats.map(function(c) {
      return '<button class="chip' + (libraryFilter === c ? ' on' : '') +
             '" data-cat="' + c + '">' +
             (c === 'all' ? 'All moves' : CATEGORY_LABELS[c]) + '</button>';
    }).join('');

    var list = MoveQuestMoves.MOVES.filter(function(m) {
      return libraryFilter === 'all' || m.cat === libraryFilter;
    });

    el.libraryList.innerHTML = list.map(function(m) {
      var locked = tier.rank < m.minTier || level < m.minLevel;
      var why = tier.rank < m.minTier
        ? '🔒 Unlocks in the ' + tierByRank(m.minTier).name + ' age group'
        : '🔒 Unlocks at Level ' + m.minLevel;
      return '<div class="lib-card' + (locked ? ' locked' : '') + '">' +
        '<div class="lib-head">' +
          '<span class="lib-icon">' + m.icon + '</span>' +
          '<span>' +
            '<span class="lib-name">' + _esc(m.en) + '</span>' +
            '<span class="lib-name-es">' + _esc(m.es) + '</span>' +
          '</span>' +
          '<span class="lib-tag">' + (CATEGORY_LABELS[m.cat] || m.cat) + '</span>' +
        '</div>' +
        '<div class="lib-frames">' + MoveQuestMoves.figureSvg(m, 'frames') + '</div>' +
        '<div class="lib-cue">' + _esc(m.cue) + '</div>' +
        '<div class="lib-cue-es">' + _esc(m.cueEs) + '</div>' +
        (locked ? '<div class="lib-lock">' + why + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function tierByRank(rank) {
    for (var i = 0; i < TIERS.length; i++) if (TIERS[i].rank === rank) return TIERS[i];
    return TIERS[0];
  }

  /* ================================================================
     THE PLAYER
     Timing is driven off wall-clock deadlines rather than counting
     ticks, so a slow frame or a moment in the background does not
     make the circuit drift.
     ================================================================ */

  var play = null;
  var wakeLock = null;

  function _speak(text) {
    var data = getData();
    if (!data.voice) return;
    if (typeof ZsTTS === 'undefined' || !ZsTTS.supported()) return;
    ZsTTS.speak(text, { lang: 'en-US', rate: 0.95 });
  }

  function _beep(kind) {
    var data = getData();
    if (!data.beeps || typeof SFX === 'undefined') return;
    if (kind === 'tick') SFX.click();
    else if (kind === 'done') SFX.correct();
    else if (kind === 'finish') SFX.cheer();
    else if (kind === 'star') SFX.star();
  }

  function _requestWakeLock() {
    try {
      if (!navigator.wakeLock || !navigator.wakeLock.request) return;
      navigator.wakeLock.request('screen').then(function(lock) {
        wakeLock = lock;
      }).catch(function() { /* not critical */ });
    } catch (e) {}
  }

  function _releaseWakeLock() {
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
  }

  function startWorkout() {
    var plan = currentPlan || buildWorkout();
    currentPlan = plan;

    play = {
      plan: plan,
      round: 1,
      idx: -1,          // -1 while counting in
      phase: 'ready',
      remaining: COUNT_IN_SECONDS,
      endsAt: Date.now() + COUNT_IN_SECONDS * 1000,
      paused: false,
      shown: null,
      activeSeconds: 0,
      halfSpoken: false
    };

    showScreen('play');
    if (el.playPause) el.playPause.textContent = '⏸️ Pause';
    _requestWakeLock();
    renderPlay();
    _speak('Get ready. First move: ' + plan.moves[0].en + '.');
    if (play.timer) clearInterval(play.timer);
    play.timer = setInterval(_tick, 200);
  }

  function _currentMove() {
    if (!play || play.idx < 0) return play ? play.plan.moves[0] : null;
    return play.plan.moves[play.idx] || null;
  }

  function _nextMove() {
    if (!play) return null;
    var moves = play.plan.moves;
    if (play.idx + 1 < moves.length) return moves[play.idx + 1];
    if (play.round < play.plan.rounds) return moves[0];
    return null;
  }

  function _tick() {
    if (!play || play.paused) return;
    var left = Math.max(0, Math.ceil((play.endsAt - Date.now()) / 1000));

    if (left !== play.shown) {
      play.shown = left;
      _renderClock(left);
      if (left > 0 && left <= 3) _beep('tick');
      if (play.phase === 'work' && !play.halfSpoken) {
        var half = Math.floor(play.plan.work / 2);
        if (play.plan.work >= 25 && left === half) {
          play.halfSpoken = true;
          _speak('Halfway.');
        }
      }
    }

    if (left <= 0) _advance();
  }

  function _advance() {
    if (!play) return;
    var plan = play.plan;

    if (play.phase === 'ready') {
      play.idx = 0;
      _beginWork();
      return;
    }

    if (play.phase === 'work') {
      play.activeSeconds += plan.work;
      var isLastOfRound = play.idx >= plan.moves.length - 1;
      var isLastRound = play.round >= plan.rounds;
      if (isLastOfRound && isLastRound) { _finish(); return; }
      _beep('done');
      play.phase = 'rest';
      play.halfSpoken = false;
      play.remaining = plan.rest;
      play.endsAt = Date.now() + plan.rest * 1000;
      play.shown = null;
      var upcoming = _nextMove();
      _speak('Rest. Next up: ' + (upcoming ? upcoming.en : 'the last one') + '.');
      renderPlay();
      return;
    }

    // rest → next move
    play.activeSeconds += plan.rest;
    if (play.idx >= plan.moves.length - 1) {
      play.round++;
      play.idx = 0;
    } else {
      play.idx++;
    }
    _beginWork();
  }

  function _beginWork() {
    var plan = play.plan;
    play.phase = 'work';
    play.halfSpoken = false;
    play.endsAt = Date.now() + plan.work * 1000;
    play.shown = null;
    var move = _currentMove();
    var last = play.round >= plan.rounds && play.idx === plan.moves.length - 1;
    _speak((last ? 'Last one. ' : '') + move.en + '. ' + move.cue);
    renderPlay();
  }

  function _renderClock(left) {
    el.playClock.textContent = left;
    el.playClock.classList.toggle('low', left <= 3);
  }

  function renderPlay() {
    if (!play) return;
    var plan = play.plan;
    var move = _currentMove();
    var total = plan.moves.length;

    el.playStage.classList.toggle('resting', play.phase === 'rest');

    if (play.phase === 'ready') {
      el.playPhase.textContent = 'Get ready';
      el.playCounter.textContent = 'Starting ' + plan.moves.length + ' moves';
    } else if (play.phase === 'rest') {
      el.playPhase.textContent = 'Rest — next up';
      el.playCounter.textContent = 'Move ' + (play.idx + 2 > total ? 1 : play.idx + 2) +
        ' of ' + total + (plan.rounds > 1 ? ' · round ' + play.round : '');
    } else {
      el.playPhase.textContent = 'Go!';
      el.playCounter.textContent = 'Move ' + (play.idx + 1) + ' of ' + total +
        (plan.rounds > 1 ? ' · round ' + play.round : '');
    }

    // During a rest the picture shows what is coming, not what is done.
    var shown = (play.phase === 'rest') ? (_nextMove() || move) : move;
    el.playName.textContent = shown.en;
    el.playNameEs.textContent = shown.es;
    el.playFigure.innerHTML = MoveQuestMoves.figureSvg(shown, 'anim');
    el.playCue.textContent = shown.cue;

    var upcoming = _nextMove();
    el.playNext.innerHTML = (play.phase === 'work' && upcoming)
      ? 'Next: <b>' + _esc(upcoming.en) + '</b>'
      : '';

    var segs = [];
    for (var i = 0; i < total; i++) {
      var cls = i < play.idx ? 'done' : (i === play.idx && play.phase !== 'ready' ? 'now' : '');
      segs.push('<i class="' + cls + '"></i>');
    }
    el.playProgress.innerHTML = segs.join('');

    _renderClock(Math.max(0, Math.ceil((play.endsAt - Date.now()) / 1000)));
  }

  function togglePause() {
    if (!play) return;
    if (play.paused) {
      play.paused = false;
      play.endsAt = Date.now() + play.remaining * 1000;
      el.playPause.textContent = '⏸️ Pause';
      _speak('Back to it.');
    } else {
      play.paused = true;
      play.remaining = Math.max(1, Math.ceil((play.endsAt - Date.now()) / 1000));
      el.playPause.textContent = '▶️ Resume';
      if (typeof ZsTTS !== 'undefined') ZsTTS.stop();
    }
  }

  function skipCurrent() {
    if (!play) return;
    if (play.paused) {
      play.paused = false;
      if (el.playPause) el.playPause.textContent = '⏸️ Pause';
    }
    play.endsAt = Date.now();
    play.shown = null;
    _tick();
  }

  function stopWorkout() {
    if (!play) return;
    if (play.timer) clearInterval(play.timer);
    play = null;
    _releaseWakeLock();
    if (typeof ZsTTS !== 'undefined') ZsTTS.stop();
    currentPlan = null;
    renderHome();
    showScreen('home');
  }

  function _finish() {
    var plan = play.plan;
    var seconds = play.activeSeconds;
    if (play.timer) clearInterval(play.timer);
    play = null;
    _releaseWakeLock();

    var result = completeWorkout(plan, seconds);
    _beep('finish');
    _speak('Great work. You finished the whole circuit.');

    el.finishSub.textContent = plan.tierName + ' · Level ' + plan.level + ' · ' +
      (plan.rounds > 1 ? '2 rounds' : '1 round');
    el.finishMins.textContent = result.minutes;
    el.finishMoves.textContent = plan.moves.length * plan.rounds;
    el.finishStreak.textContent = result.streak;

    if (result.leveledTo) {
      _beep('star');
      var names = result.unlocked.map(function(m) { return m.icon + ' ' + m.en; });
      el.finishUnlock.style.display = '';
      el.finishUnlock.textContent = '⬆️ Level ' + result.leveledTo + '!' +
        (names.length ? ' New move' + (names.length > 1 ? 's' : '') + ': ' + names.join(', ') : '');
    } else {
      el.finishUnlock.style.display = 'none';
    }

    el.finishLogged.textContent = result.logged
      ? 'Saved to Sports Arena as a Home Workout. 🏓'
      : '';

    currentPlan = null;
    showScreen('finish');
  }

  // ── Steps screen ────────────────────────────────────────────────

  function renderSteps() {
    var data = getData();
    var today = _dayKey();
    var todaySteps = getSteps(today, data);
    var goal = getStepGoal(data);

    el.stepsToday.textContent = todaySteps.toLocaleString();
    var pct = Math.min(100, Math.round((todaySteps / goal) * 100));
    el.stepsGoal.innerHTML = todaySteps >= goal
      ? 'Goal reached — <b class="hit">' + goal.toLocaleString() + ' steps</b> 🎉'
      : pct + '% of <b>' + goal.toLocaleString() + '</b> steps';
    el.stepsInput.value = todaySteps > 0 ? todaySteps : '';

    var week = getStepWeek(data);
    var max = Math.max(goal, week.reduce(function(a, d) { return Math.max(a, d.steps); }, 0));
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    el.stepsChart.innerHTML = week.map(function(d) {
      var h = max ? Math.round((d.steps / max) * 100) : 0;
      var cls = d.steps >= goal ? 'hit' : (d.steps > 0 ? 'some' : '');
      return '<div class="bar-wrap">' +
        '<div class="val">' + (d.steps ? Math.round(d.steps / 100) / 10 + 'k' : '') + '</div>' +
        '<div class="bar ' + cls + '" style="height:' + h + '%"></div>' +
        '<div class="day">' + DAYS[d.date.getDay()] + '</div>' +
      '</div>';
    }).join('');
  }

  function saveTodaySteps() {
    var raw = el.stepsInput.value;
    var n = Number(raw);
    if (raw === '' || !isFinite(n) || n < 0) {
      el.stepsFeedback.style.color = 'var(--red)';
      el.stepsFeedback.textContent = 'Type the number shown on the watch.';
      return;
    }
    var saved = setSteps(_dayKey(), n);
    el.stepsFeedback.style.color = 'var(--green)';
    el.stepsFeedback.textContent = '✅ Saved ' + saved.toLocaleString() + ' steps for today.';
    if (typeof SFX !== 'undefined') SFX.star();
    renderSteps();
  }

  // A family archive holds every child, so when more than one folder
  // turns up the parent has to say which one is this profile.
  var _pendingOwners = null;
  var _pendingKeys = null;
  var _pendingReport = null;

  function _activeName() {
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    return user ? user.name : 'this explorer';
  }

  function _finishImport(totals, report) {
    var box = el.stepsImport;
    var res = mergeStepTotals(totals);
    if (!res.ok) {
      box.className = 'import-result bad';
      box.textContent = '⚠️ ' + res.error;
      return;
    }
    box.className = 'import-result good';
    box.innerHTML = '✅ Imported ' + res.days + ' day' + (res.days === 1 ? '' : 's') +
      ' of steps (' + res.from + ' to ' + res.to + ').' +
      (report && report.skipped
        ? '<br>Skipped ' + report.skipped + ' file' + (report.skipped === 1 ? '' : 's') +
          ' that were too big or unreadable.'
        : '');
    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Move Quest', '👟', 'Imported ' + res.days + ' days of steps');
    }
    if (typeof SFX !== 'undefined') SFX.star();
    renderSteps();
  }

  function handleStepsFiles(input) {
    var files = Array.prototype.slice.call(input.files || []);
    if (!files.length) return;
    input.value = '';
    var box = el.stepsImport;
    box.style.display = '';
    box.className = 'import-result';

    // Screenshots go through OCR and a review step; everything else
    // through the file importer. When a selection mixes both, the
    // screenshots win the screen — data files save silently first
    // would risk hiding the owner picker, so we ask for them alone.
    var images = files.filter(MoveQuestScan.isImageFile);
    var rest = files.filter(function(f) { return !MoveQuestScan.isImageFile(f); });
    if (images.length) {
      _importScreenshots(images,
        rest.length ? 'The other ' + rest.length + ' file' + (rest.length === 1 ? '' : 's') +
                      ' were skipped — import data files separately from screenshots.' : '');
      return;
    }

    box.textContent = files.length === 1
      ? 'Reading ' + _esc(files[0].name) + '…'
      : 'Reading ' + files.length + ' files…';

    gatherStepTotals(files).then(function(res) {
      var keys = Object.keys(res.owners);
      var problems = res.report.problems.length
        ? '<br>' + _esc(res.report.problems.join(' ')) : '';

      if (!keys.length) {
        box.className = 'import-result bad';
        box.innerHTML = '⚠️ No dates and step counts were found.' + problems +
          '<br>Expected a Takeout <b>.zip</b>, or the <b>.json</b>/<b>.csv</b> steps files from inside one.';
        return;
      }

      if (keys.length > 1) {
        _pendingOwners = res.owners;
        _pendingKeys = keys;
        _pendingReport = res.report;
        box.className = 'import-result';
        box.innerHTML = 'That export holds more than one person. Which folder is <b>' +
          _esc(_activeName()) + '</b>?' +
          '<div class="chip-row" style="margin-top:10px;">' +
          keys.map(function(k, i) {
            var days = Object.keys(res.owners[k].totals).length;
            return '<button class="chip" data-owner="' + i + '">' + _esc(res.owners[k].label) +
                   ' · ' + days + ' day' + (days === 1 ? '' : 's') + '</button>';
          }).join('') + '</div>' + problems;
        return;
      }

      _finishImport(res.owners[keys[0]].totals, res.report);
    }, function() {
      input.value = '';
      box.className = 'import-result bad';
      box.textContent = '⚠️ Those files could not be read.';
    });
  }

  /* ── Screenshots → review → save ──────────────────────────────────
     OCR is good on these screens but not infallible, so nothing is
     stored until the parent has seen the numbers and had the chance
     to fix or drop a row. */

  function _fmtDayKey(key) {
    var d = new Date(key + 'T12:00:00');
    if (isNaN(d.getTime())) return key;
    try {
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (e) { return key; }
  }

  function _importScreenshots(images, extraNote) {
    var box = el.stepsImport;
    var firstRun = typeof Tesseract === 'undefined';
    box.className = 'import-result';
    box.textContent = 'Reading ' + images.length + ' screenshot' + (images.length === 1 ? '' : 's') + '…' +
      (firstRun ? ' (first time loads the picture reader — give it a moment)' : '');

    MoveQuestScan.scanImages(images, function(i, n) {
      box.textContent = 'Reading screenshot ' + i + ' of ' + n + '…' +
        (firstRun ? ' (first time loads the picture reader — give it a moment)' : '');
    }).then(function(res) {
      var keys = Object.keys(res.totals).sort();
      var problems = res.report.problems.length
        ? '<br>' + _esc(res.report.problems.join(' ')) : '';
      var note = extraNote ? '<br>' + _esc(extraNote) : '';
      if (!keys.length) {
        box.className = 'import-result bad';
        box.innerHTML = '⚠️ No step counts could be read.' + problems + note +
          '<br>Screenshot the <b>Movement</b> list in the Fitbit app — the weekly view ' +
          'with the Steps column — and make sure the rows are visible.';
        return;
      }
      box.className = 'import-result';
      box.innerHTML =
        'Read <b>' + keys.length + ' day' + (keys.length === 1 ? '' : 's') + '</b> from ' +
        res.report.scanned + ' screenshot' + (res.report.scanned === 1 ? '' : 's') +
        '. Check the numbers against the pictures, fix anything misread, then save.' +
        problems + note +
        '<div class="scan-list">' +
        keys.map(function(k) {
          return '<div class="scan-row" data-key="' + k + '">' +
            '<span class="scan-date">' + _esc(_fmtDayKey(k)) + '</span>' +
            '<input type="number" class="scan-input" min="0" max="200000" value="' + res.totals[k] +
              '" aria-label="Steps for ' + _esc(_fmtDayKey(k)) + '">' +
            '<button class="scan-del" aria-label="Remove ' + _esc(_fmtDayKey(k)) + '">✕</button>' +
          '</div>';
        }).join('') +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn-primary" data-scan="save">💾 Save for ' + _esc(_activeName()) + '</button>' +
          '<button class="btn-secondary" data-scan="cancel">Cancel</button>' +
        '</div>';
    });
  }

  function _saveScanReview() {
    var box = el.stepsImport;
    var totals = {};
    var rows = box.querySelectorAll('.scan-row');
    for (var i = 0; i < rows.length; i++) {
      var key = rows[i].getAttribute('data-key');
      var input = rows[i].querySelector('.scan-input');
      var n = input ? Math.round(Number(input.value)) : 0;
      if (key && isFinite(n) && n > 0) totals[key] = Math.min(200000, n);
    }
    _finishImport(totals, null);
  }

  // ── Progress screen ─────────────────────────────────────────────

  function renderProgress() {
    var data = getData();
    var prog = levelProgress(data);

    el.statWorkouts.textContent = data.workoutsDone || 0;
    el.statMinutes.textContent = Math.round((data.totalSeconds || 0) / 60);
    el.statStreak.textContent = data.streak || 0;

    el.progressFill.style.width = prog.pct + '%';
    el.progressNote.textContent = prog.maxed
      ? 'Top level reached — every move is unlocked.'
      : prog.done + ' of ' + prog.need + ' workouts to Level ' + (prog.level + 1);

    var hist = data.history || [];
    if (!hist.length) {
      el.historyList.innerHTML =
        '<div class="empty-state"><span class="e-icon">💪</span>' +
        'No workouts yet. Start one and it will show up here.</div>';
      return;
    }

    el.historyList.innerHTML = hist.slice(0, 40).map(function(h) {
      var d = new Date(h.date);
      var when = isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
      });
      var tier = tierById(h.tier);
      return '<div class="hist-item">' +
        '<span class="hist-icon">' + (tier ? tier.icon : '💪') + '</span>' +
        '<span class="hist-main">' +
          '<span class="hist-title">Level ' + h.level + ' · ' + h.moves + ' moves</span>' +
          '<span class="hist-sub">' + _esc(when) + ' · ' + h.minutes + ' min' +
            (h.rounds > 1 ? ' · 2 rounds' : '') + '</span>' +
        '</span>' +
      '</div>';
    }).join('');
  }

  // ── Settings screen ─────────────────────────────────────────────

  function renderSettings() {
    var data = getData();
    var tier = getTier(data);

    el.tierChips.innerHTML = TIERS.map(function(t) {
      return '<button class="chip' + (t.id === tier.id ? ' on' : '') + '" data-tier="' + t.id + '">' +
             t.icon + ' ' + _esc(t.name) + ' (' + _esc(t.ages) + ')</button>';
    }).join('');
    el.tierDesc.textContent = tier.desc;

    var voiceOn = data.voice && (typeof ZsTTS === 'undefined' || ZsTTS.getSettings().enabled);
    el.toggleVoice.classList.toggle('on', !!voiceOn);
    el.toggleVoice.setAttribute('aria-checked', voiceOn ? 'true' : 'false');

    el.toggleBeeps.classList.toggle('on', !!data.beeps);
    el.toggleBeeps.setAttribute('aria-checked', data.beeps ? 'true' : 'false');

    var canDouble = canDoubleRound(data);
    var doubleOn = canDouble && data.doubleRound;
    el.toggleDouble.classList.toggle('on', !!doubleOn);
    el.toggleDouble.setAttribute('aria-checked', doubleOn ? 'true' : 'false');
    el.toggleDouble.disabled = !canDouble;
    el.doubleDesc.textContent = canDouble
      ? 'Run the whole circuit twice, with a longer break between rounds.'
      : 'Run the whole circuit twice. Unlocks at Level ' + DOUBLE_ROUND_LEVEL + '.';

    el.goalInput.value = getStepGoal(data);
  }

  // ── Wiring ──────────────────────────────────────────────────────

  function _bind() {
    el = {
      tierPill: $('mq-tier-pill'), levelFill: $('mq-level-fill'), levelNote: $('mq-level-note'),
      startDesc: $('mq-start-desc'), streakBadge: $('mq-streak-badge'), stepsBadge: $('mq-steps-badge'),

      previewSummary: $('mq-preview-summary'), previewList: $('mq-preview-list'),

      playCounter: $('mq-play-counter'), playProgress: $('mq-play-progress'),
      playStage: $('mq-play-stage'), playPhase: $('mq-play-phase'),
      playName: $('mq-play-name'), playNameEs: $('mq-play-name-es'),
      playFigure: $('mq-play-figure'), playClock: $('mq-play-clock'),
      playCue: $('mq-play-cue'), playNext: $('mq-play-next'), playPause: $('mq-play-pause'),

      finishSub: $('mq-finish-sub'), finishMins: $('mq-finish-mins'),
      finishMoves: $('mq-finish-moves'), finishStreak: $('mq-finish-streak'),
      finishUnlock: $('mq-finish-unlock'), finishLogged: $('mq-finish-logged'),

      libraryFilters: $('mq-library-filters'), libraryList: $('mq-library-list'),

      stepsToday: $('mq-steps-today'), stepsGoal: $('mq-steps-goal'),
      stepsInput: $('mq-steps-input'), stepsFeedback: $('mq-steps-feedback'),
      stepsChart: $('mq-steps-chart'), stepsImport: $('mq-steps-import'),

      statWorkouts: $('mq-stat-workouts'), statMinutes: $('mq-stat-minutes'),
      statStreak: $('mq-stat-streak'), progressFill: $('mq-progress-fill'),
      progressNote: $('mq-progress-note'), historyList: $('mq-history-list'),

      tierChips: $('mq-tier-chips'), tierDesc: $('mq-tier-desc'),
      toggleVoice: $('mq-toggle-voice'), toggleBeeps: $('mq-toggle-beeps'),
      toggleDouble: $('mq-toggle-double'), doubleDesc: $('mq-double-desc'),
      goalInput: $('mq-goal-input'), goalFeedback: $('mq-goal-feedback')
    };

    function on(id, fn) { var node = $(id); if (node) node.addEventListener('click', fn); }

    on('mq-go-start', function() { renderPreview(); showScreen('preview'); });
    on('mq-go-library', function() { renderLibrary(); showScreen('library'); });
    on('mq-go-steps', function() { renderSteps(); showScreen('steps'); });
    on('mq-go-progress', function() { renderProgress(); showScreen('progress'); });
    on('mq-go-settings', function() { renderSettings(); showScreen('settings'); });

    on('mq-preview-back', function() { renderHome(); showScreen('home'); });
    on('mq-preview-shuffle', function() {
      reshuffle();
      currentPlan = buildWorkout();
      renderPreview();
    });
    on('mq-preview-guide', function() { renderLibrary(); showScreen('library'); });
    on('mq-preview-print', printCircuit);
    on('mq-library-print', printLibrary);
    on('mq-preview-start', startWorkout);

    on('mq-play-pause', togglePause);
    on('mq-play-skip', skipCurrent);
    on('mq-play-quit', stopWorkout);

    on('mq-finish-home', function() { renderHome(); showScreen('home'); });
    on('mq-finish-again', function() { renderPreview(); showScreen('preview'); });

    on('mq-library-back', function() { renderHome(); showScreen('home'); });
    on('mq-steps-back', function() { renderHome(); showScreen('home'); });
    on('mq-progress-back', function() { renderHome(); showScreen('home'); });
    on('mq-settings-back', function() { renderHome(); showScreen('home'); });

    on('mq-steps-save', saveTodaySteps);
    if (el.stepsInput) {
      el.stepsInput.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') saveTodaySteps();
      });
    }
    var fileInput = $('mq-steps-file');
    if (fileInput) {
      fileInput.addEventListener('change', function() { handleStepsFiles(fileInput); });
    }

    if (el.stepsImport) {
      el.stepsImport.addEventListener('click', function(ev) {
        var t = ev.target;
        var del = t.closest ? t.closest('.scan-del') : null;
        if (del) {
          var row = del.closest('.scan-row');
          if (row) row.parentNode.removeChild(row);
          return;
        }
        var scanBtn = t.closest ? t.closest('[data-scan]') : null;
        if (scanBtn) {
          if (scanBtn.getAttribute('data-scan') === 'save') _saveScanReview();
          else { el.stepsImport.style.display = 'none'; el.stepsImport.innerHTML = ''; }
          return;
        }
        var btn = t.closest ? t.closest('[data-owner]') : null;
        if (!btn || !_pendingOwners) return;
        var owner = _pendingOwners[_pendingKeys[Number(btn.getAttribute('data-owner'))]];
        var report = _pendingReport;
        _pendingOwners = _pendingKeys = _pendingReport = null;
        if (owner) _finishImport(owner.totals, report);
      });
    }

    if (el.libraryFilters) {
      el.libraryFilters.addEventListener('click', function(ev) {
        var btn = ev.target.closest ? ev.target.closest('[data-cat]') : null;
        if (!btn) return;
        libraryFilter = btn.getAttribute('data-cat');
        renderLibrary();
      });
    }

    if (el.tierChips) {
      el.tierChips.addEventListener('click', function(ev) {
        var btn = ev.target.closest ? ev.target.closest('[data-tier]') : null;
        if (!btn) return;
        setTier(btn.getAttribute('data-tier'));
        currentPlan = null;
        renderSettings();
      });
    }

    on('mq-toggle-voice', function() {
      var data = getData();
      var next = !(data.voice && (typeof ZsTTS === 'undefined' || ZsTTS.getSettings().enabled));
      data.voice = next;
      saveData(data);
      // The coach rides on the suite-wide read-aloud voice, so turning
      // it on here turns it on for the other apps too.
      if (next && typeof ZsTTS !== 'undefined') ZsTTS.setSettings({ enabled: true });
      renderSettings();
    });

    on('mq-toggle-beeps', function() {
      var data = getData();
      data.beeps = !data.beeps;
      saveData(data);
      if (data.beeps && typeof SFX !== 'undefined') SFX.click();
      renderSettings();
    });

    on('mq-toggle-double', function() {
      var data = getData();
      if (!canDoubleRound(data)) return;
      data.doubleRound = !data.doubleRound;
      saveData(data);
      currentPlan = null;
      renderSettings();
    });

    on('mq-goal-save', function() {
      var saved = setStepGoal(Number(el.goalInput.value));
      el.goalInput.value = saved;
      el.goalFeedback.style.color = 'var(--green)';
      el.goalFeedback.textContent = '✅ Goal set to ' + saved.toLocaleString() + ' steps.';
      renderSettings();
    });

    // A tab switch drops the screen wake lock; take it back when the
    // workout is still running.
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible' && play) _requestWakeLock();
    });
  }

  function init() {
    _bind();
    // TimerManager is deliberately left idle: Move Quest is physical
    // activity, so it must not burn daily screen time — same rule as
    // Sports Arena.
    renderHome();
  }

  return {
    init: init,
    TIERS: TIERS,
    getData: getData,
    getTier: getTier,
    getLevel: getLevel,
    levelProgress: levelProgress,
    planParams: planParams,
    buildWorkout: buildWorkout,
    buildSheet: buildSheet,
    printCircuit: printCircuit,
    printLibrary: printLibrary,
    reshuffle: reshuffle,
    completeWorkout: completeWorkout,
    setTier: setTier,
    getSteps: getSteps,
    setSteps: setSteps,
    getStepWeek: getStepWeek,
    getStepGoal: getStepGoal,
    setStepGoal: setStepGoal,
    importSteps: importSteps,
    collectStepTotals: collectStepTotals,
    mergeStepTotals: mergeStepTotals,
    gatherStepTotals: gatherStepTotals,
    showScreen: showScreen,
    _dayKey: _dayKey,
    _normDate: _normDate
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  if (typeof MoveQuest !== 'undefined') MoveQuest.init();
});
