/* ================================================================
   LITTLE MAESTRO — Practice tools (lm-practice.js)

   1. Practice log — minutes actually spent playing. Every key press
      (MIDI or on-screen) is a "ping"; each 10 s slice with a ping in
      the last 15 s counts. Stored per day in stats.practiceSecs
      ({ 'YYYY-MM-DD': seconds }); stats.totalPracticeMinutes is kept
      in step for the screens that already show it.

   2. This week's practice — the teacher's list, entered by a parent in
      Parent Mode: songs, theory lessons or free-text items ("C scale
      hands together ×3"), a note from the teacher, and a daily minutes
      goal. Shown on Home; a song item ticks itself for the day when
      the student plays it. Stored as `assignments` on the student.

   3. Games, from Home:
        Note Rush — sight-reading: a note appears on the grand staff,
                    play it; as many as you can in 60 seconds.
        Echo      — ear training: listen to a short tune, play it back;
                    each round adds a note.
      Best scores in stats.games.

   Everything lives in the student's littlemaestro_<name> record, so it
   syncs with the rest of their Little Maestro data.
   ================================================================ */

var LMPractice = (function () {
  'use strict';

  // ── Storage ────────────────────────────────────────────────────
  function _key() {
    var u = typeof UserManager !== 'undefined' ? UserManager.getCurrentUser() : null;
    return u ? 'littlemaestro_' + u.profile.name.toLowerCase().replace(/\s+/g, '_') : null;
  }
  function _load() {
    var k = _key();
    if (!k) return null;
    try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return null; }
  }
  function _save(data) {
    var k = _key();
    if (k && data) localStorage.setItem(k, JSON.stringify(data));
  }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function _day(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function _monday(d) {
    d = new Date(d || new Date());
    var off = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - off);
    return _day(d);
  }

  // ══════════════════════════════════════════════════════════════
  //  1. PRACTICE LOG
  // ══════════════════════════════════════════════════════════════
  var SLICE = 10;          // seconds per tick
  var IDLE = 15;           // a ping within this many seconds counts the slice
  var _lastPing = 0;
  var _pending = 0;        // seconds not yet written
  var _timer = null;

  function ping() { _lastPing = Date.now(); }

  function _tick() {
    if (document.hidden) return;
    if (Date.now() - _lastPing > IDLE * 1000) return;
    _pending += SLICE;
    if (_pending >= 60) _flush();
  }

  function _flush() {
    if (!_pending) return;
    var data = _load();
    if (!data) { _pending = 0; return; }
    data.stats = data.stats || {};
    var log = data.stats.practiceSecs = data.stats.practiceSecs || {};
    var today = _day();
    log[today] = (log[today] || 0) + _pending;
    var total = Object.keys(log).reduce(function (a, k) { return a + log[k]; }, 0);
    data.stats.totalPracticeMinutes = Math.round(total / 60);
    data.stats.lastPracticeDate = today;
    _pending = 0;
    _save(data);
    _refreshToday();
  }

  function minutesOn(dayStr, data) {
    data = data || _load() || {};
    var log = (data.stats && data.stats.practiceSecs) || {};
    return Math.floor((log[dayStr] || 0) / 60);
  }

  // Last `n` days, oldest first: [{ day, label, minutes }]
  function recentDays(n, data) {
    data = data || _load() || {};
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      out.push({ day: _day(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), minutes: minutesOn(_day(d), data) });
    }
    return out;
  }

  function _refreshToday() {
    var el = document.getElementById('lmp-today-min');
    if (el) el.textContent = String(minutesOn(_day()));
    var ring = document.getElementById('lmp-ring');
    if (ring) {
      var a = (_load() || {}).assignments || {};
      var goal = a.minutesGoal || 15;
      ring.style.setProperty('--pct', Math.min(100, Math.round(100 * minutesOn(_day()) / goal)));
    }
  }

  function start() {
    if (_timer) return;
    _timer = setInterval(_tick, SLICE * 1000);
    if (typeof MIDIManager !== 'undefined' && MIDIManager.listen) MIDIManager.listen(ping);
    // On-screen keys
    document.addEventListener('pointerdown', function (e) {
      if (e.target && e.target.closest && e.target.closest('.pk-white, .pk-black, .lml-tap')) ping();
    }, true);
    document.addEventListener('visibilitychange', function () { if (document.hidden) _flush(); });
    window.addEventListener('pagehide', _flush);
  }

  // ══════════════════════════════════════════════════════════════
  //  2. THIS WEEK'S PRACTICE
  // ══════════════════════════════════════════════════════════════
  function _assign(data) {
    data = data || _load() || {};
    var a = data.assignments;
    if (!a || !Array.isArray(a.items)) a = { week: _monday(), note: '', minutesGoal: 15, items: [] };
    return a;
  }

  function _songTitle(id) {
    var s = typeof SONGS !== 'undefined' ? SONGS.find(function (x) { return x.id === id; }) : null;
    return s ? s.title : 'Song #' + id;
  }
  function _lessonTitle(id) {
    var l = typeof LM_LESSONS !== 'undefined' ? LM_LESSONS.find(function (x) { return x.id === id; }) : null;
    return l ? l.title : id;
  }
  var HANDS_LABEL = { rh: 'right hand', lh: 'left hand', both: 'hands together' };

  function _itemLabel(it) {
    if (it.kind === 'song') return _songTitle(it.ref) + (it.hands ? ' — ' + HANDS_LABEL[it.hands] : '');
    if (it.kind === 'lesson') return 'Lesson: ' + _lessonTitle(it.ref);
    return it.text || '';
  }

  // Called by the lesson when a play-along pass finishes
  function notePlayed(songId, hands) {
    var data = _load();
    if (!data || !data.assignments || !data.assignments.items) return;
    var today = _day(), changed = false;
    data.assignments.items.forEach(function (it) {
      if (it.kind === 'song' && it.ref === songId && (!it.hands || it.hands === hands || hands === 'both')) {
        it.days = it.days || {};
        if (!it.days[today]) { it.days[today] = true; changed = true; }
      }
    });
    if (changed) _save(data);
  }

  // Used by My Book (js/lm-builder.js) when a piece is saved
  function addSong(id, hands, text) {
    var data = _load();
    if (!data) return;
    var a = _assign(data);
    a.items.push({ kind: 'song', ref: id, hands: hands || null, text: text || '' });
    data.assignments = a;
    _save(data);
  }
  // Used by My Book when a piece is deleted
  function removeSong(id) {
    var data = _load();
    if (!data || !data.assignments || !Array.isArray(data.assignments.items)) return;
    var n = data.assignments.items.length;
    data.assignments.items = data.assignments.items.filter(function (it) { return !(it.kind === 'song' && it.ref === id); });
    if (data.assignments.items.length !== n) _save(data);
  }
  function hasSong(id) {
    return _assign().items.some(function (it) { return it.kind === 'song' && it.ref === id; });
  }

  function toggleDone(idx) {
    var data = _load();
    if (!data || !data.assignments) return;
    var it = data.assignments.items[idx];
    if (!it) return;
    it.done = !it.done;
    _save(data);
    _rerenderHome();
  }

  function playItem(idx) {
    var a = _assign();
    var it = a.items[idx];
    if (!it) return;
    if (it.kind === 'song' && typeof LessonEngine !== 'undefined') {
      // A My Book piece can be deleted after it was put on the list
      if (typeof SONGS !== 'undefined' && !SONGS.some(function (s) { return s.id === it.ref; })) {
        if (typeof ZsDialog !== 'undefined') ZsDialog.toast('That piece isn\u2019t in My Book any more.');
        return;
      }
      if (typeof showScreen === 'function') showScreen('lesson');
      LessonEngine.startLesson(it.ref, { hands: it.hands || null, tempo: it.tempo || null });
    } else if (it.kind === 'lesson' && typeof LMLessons !== 'undefined') {
      LMLessons.open(it.ref, _rerenderHome);
    }
  }

  function _rerenderHome() {
    if (typeof renderHomeScreen === 'function') renderHomeScreen();
  }

  // ── Home card ──────────────────────────────────────────────────
  function homeHtml() {
    var data = _load() || {};
    var a = _assign(data);
    var today = _day();
    var mins = minutesOn(today, data);
    var goal = a.minutesGoal || 15;
    var pct = Math.min(100, Math.round(100 * mins / goal));
    var week = recentDays(7, data);
    var maxM = Math.max(goal, Math.max.apply(null, week.map(function (d) { return d.minutes; })));

    var items = a.items.map(function (it, i) {
      var playedToday = it.days && it.days[today];
      var canPlay = it.kind === 'song' || it.kind === 'lesson';
      var count = it.days ? Object.keys(it.days).length : 0;
      return '<div class="lmp-item' + (it.done ? ' lmp-item--done' : '') + '">' +
        '<button class="lmp-check" aria-label="Mark done" onclick="LMPractice.toggleDone(' + i + ')">' + (it.done ? '✓' : '') + '</button>' +
        '<div class="lmp-item-text"><div class="lmp-item-title">' + _esc(_itemLabel(it)) + '</div>' +
          (it.text && it.kind !== 'custom' ? '<div class="lmp-item-note">' + _esc(it.text) + '</div>' : '') +
          (count ? '<div class="lmp-item-note">Practiced ' + count + ' day' + (count > 1 ? 's' : '') + (playedToday ? ' · today ✓' : '') + '</div>' : '') +
        '</div>' +
        (canPlay ? '<button class="home-song-play-btn" aria-label="Practice" onclick="LMPractice.playItem(' + i + ')">▶</button>' : '') +
      '</div>';
    }).join('');

    return '' +
      '<div class="lmp-week">' +
        '<div class="lmp-week-head">' +
          '<div class="lmp-ring" id="lmp-ring" style="--pct:' + pct + '">' +
            '<div class="lmp-ring-inner"><span id="lmp-today-min">' + mins + '</span><small>/' + goal + ' min</small></div>' +
          '</div>' +
          '<div class="lmp-week-title">' +
            '<div class="lmp-week-kicker">This week\'s practice</div>' +
            (a.note ? '<div class="lmp-week-note">“' + _esc(a.note) + '”</div>' : '<div class="lmp-week-note lmp-muted">Ask a grown-up to add this week\'s pieces in Parent Mode 🔒</div>') +
          '</div>' +
          '<div class="lmp-bars" aria-label="Minutes practiced, last 7 days">' + week.map(function (d) {
            var h = Math.round(100 * d.minutes / maxM);
            return '<div class="lmp-bar' + (d.minutes >= goal ? ' lmp-bar--goal' : '') + '" title="' + d.minutes + ' min">' +
              '<div class="lmp-bar-fill" style="height:' + h + '%"></div><span>' + d.label + '</span></div>';
          }).join('') + '</div>' +
        '</div>' +
        (items ? '<div class="lmp-items">' + items + '</div>' : '') +
      '</div>' +
      '<div class="home-section-title">Practice Games</div>' +
      '<div class="home-nav-grid">' +
        '<button class="home-nav-card" onclick="LMPractice.noteRush()">' +
          '<span class="home-nav-card-icon">⚡</span><span class="home-nav-card-title">Note Rush</span>' +
          '<span class="home-nav-card-desc">Read and play notes — 60 seconds' + _best('noteRush', data) + '</span></button>' +
        '<button class="home-nav-card" onclick="LMPractice.echo()">' +
          '<span class="home-nav-card-icon">👂</span><span class="home-nav-card-title">Echo</span>' +
          '<span class="home-nav-card-desc">Listen, then play it back' + _best('echo', data) + '</span></button>' +
      '</div>';
  }

  function _best(game, data) {
    var g = data.stats && data.stats.games && data.stats.games[game];
    return g && g.best ? ' · best ' + g.best : '';
  }

  // ── Parent Mode tab ────────────────────────────────────────────
  function parentHtml() {
    var a = _assign();
    var songs = typeof SONGS !== 'undefined' ? SONGS : [];
    var groups = [];
    if (typeof LM_PATHS !== 'undefined' && typeof pathOrder === 'function') {
      // The student's own path first
      var act = typeof activePathId === 'function' ? activePathId() : null;
      LM_PATHS.slice().sort(function (a, b) { return (b.id === act) - (a.id === act); })
        .forEach(function (p) { groups.push({ label: p.title, songs: pathOrder(p.id) }); });
      if (typeof librarySongs === 'function') groups.push({ label: 'Library', songs: librarySongs() });
    } else {
      groups.push({ label: 'Songs', songs: songs });
    }
    var songOpts = groups.map(function (g) {
      return '<optgroup label="' + _esc(g.label) + '">' + g.songs.map(function (s) {
        return '<option value="' + s.id + '">' + _esc(s.title) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    var lessonOpts = (typeof LM_LESSONS !== 'undefined' ? LM_LESSONS : []).map(function (l) {
      return '<option value="' + l.id + '">' + _esc(l.title) + '</option>';
    }).join('');

    var list = a.items.map(function (it, i) {
      var days = it.days ? Object.keys(it.days).length : 0;
      return '<div class="lmp-pm-item">' +
        '<span>' + (it.done ? '✅ ' : '▫️ ') + _esc(_itemLabel(it)) + (it.text && it.kind !== 'custom' ? ' — <em>' + _esc(it.text) + '</em>' : '') +
        (days ? ' <small>(' + days + ' day' + (days > 1 ? 's' : '') + ')</small>' : '') + '</span>' +
        '<button class="lesson-btn" onclick="LMPractice._remove(' + i + ')">Remove</button></div>';
    }).join('') || '<div class="lmp-muted">Nothing assigned yet.</div>';

    var week = recentDays(7);
    return '' +
      '<div class="pm-section-title">This week\'s practice <small>(week of ' + _esc(a.week) + ')</small></div>' +
      '<label class="lmp-pm-label">Note from the teacher</label>' +
      '<textarea class="pm-teacher-notes-area" id="lmp-note" rows="2" placeholder="e.g. Keep the left-hand chords soft. Count out loud in 3/4!">' + _esc(a.note) + '</textarea>' +
      '<label class="lmp-pm-label">Daily goal (minutes)</label>' +
      '<input class="lmp-pm-input" id="lmp-goal" type="number" min="5" max="90" step="5" value="' + (a.minutesGoal || 15) + '">' +
      '<button class="lesson-btn lesson-btn--primary" style="align-self:flex-start;" onclick="LMPractice._saveMeta()">Save note & goal</button>' +

      '<div class="pm-section-title" style="margin-top:10px;">Assignments</div>' + list +

      '<div class="lmp-pm-add">' +
        '<select class="lmp-pm-input" id="lmp-song">' + songOpts + '</select>' +
        '<select class="lmp-pm-input" id="lmp-hands"><option value="">any hands</option><option value="rh">right hand</option><option value="lh">left hand</option><option value="both">hands together</option></select>' +
        '<input class="lmp-pm-input" id="lmp-song-text" placeholder="Tip (optional), e.g. bars 5–8 slowly">' +
        '<button class="lesson-btn" onclick="LMPractice._addSong()">+ Song</button>' +
      '</div>' +
      '<div class="lmp-pm-add">' +
        '<select class="lmp-pm-input" id="lmp-lesson">' + lessonOpts + '</select>' +
        '<button class="lesson-btn" onclick="LMPractice._addLesson()">+ Lesson</button>' +
      '</div>' +
      '<div class="lmp-pm-add">' +
        '<input class="lmp-pm-input" id="lmp-custom" placeholder="Anything else, e.g. C major scale, hands together ×3">' +
        '<button class="lesson-btn" onclick="LMPractice._addCustom()">+ Item</button>' +
      '</div>' +
      '<button class="lesson-btn" style="align-self:flex-start;margin-top:6px;" onclick="LMPractice._newWeek()">Start a new week</button>' +

      '<div class="pm-section-title" style="margin-top:10px;">Minutes practiced — last 7 days</div>' +
      '<div class="lmp-pm-days">' + week.map(function (d) {
        return '<div><strong>' + d.minutes + '</strong><span>' + d.label + '</span></div>';
      }).join('') + '</div>';
  }

  function _mutate(fn) {
    var data = _load();
    if (!data) return;
    var a = _assign(data);
    fn(a);
    data.assignments = a;
    _save(data);
    var panel = document.getElementById('lmp-pm-panel');
    if (panel) panel.innerHTML = parentHtml();
  }

  function _saveMeta() {
    var note = (document.getElementById('lmp-note') || {}).value || '';
    var goal = parseInt((document.getElementById('lmp-goal') || {}).value, 10);
    _mutate(function (a) { a.note = note.trim(); a.minutesGoal = goal > 0 ? Math.min(90, goal) : 15; });
  }
  function _addSong() {
    var id = parseInt((document.getElementById('lmp-song') || {}).value, 10);
    var hands = (document.getElementById('lmp-hands') || {}).value || '';
    var text = ((document.getElementById('lmp-song-text') || {}).value || '').trim();
    if (!id) return;
    _mutate(function (a) { a.items.push({ kind: 'song', ref: id, hands: hands || null, text: text }); });
  }
  function _addLesson() {
    var id = (document.getElementById('lmp-lesson') || {}).value;
    if (!id) return;
    _mutate(function (a) { a.items.push({ kind: 'lesson', ref: id }); });
  }
  function _addCustom() {
    var text = ((document.getElementById('lmp-custom') || {}).value || '').trim();
    if (!text) return;
    _mutate(function (a) { a.items.push({ kind: 'custom', text: text }); });
  }
  function _remove(i) { _mutate(function (a) { a.items.splice(i, 1); }); }
  function _newWeek() {
    _mutate(function (a) {
      a.week = _monday();
      // Carry unfinished items over, cleared of last week's ticks
      a.items = a.items.filter(function (it) { return !it.done; }).map(function (it) { var c = Object.assign({}, it); delete c.days; return c; });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  3. GAMES
  // ══════════════════════════════════════════════════════════════
  var _g = { active: false, onKey: null, timers: [] };

  function _gameLevel() {
    var p = typeof activePathId === 'function' ? activePathId() : 'primer';
    return p;
  }

  function _saveBest(game, score) {
    var data = _load();
    if (!data) return false;
    data.stats = data.stats || {};
    var g = data.stats.games = data.stats.games || {};
    var rec = g[game] = g[game] || { best: 0, plays: 0 };
    rec.plays++;
    var isBest = score > (rec.best || 0);
    if (isBest) rec.best = score;
    rec.last = score;
    _save(data);
    return isBest;
  }

  function _wireKeys() {
    if (typeof PianoKeyboard !== 'undefined') {
      PianoKeyboard.setClickCallback(function (n) { if (_g.active && _g.onKey) _g.onKey(LMScore.canonical(n)); });
      PianoKeyboard.setClickEnabled(true);
    }
    if (typeof MIDIManager !== 'undefined' && MIDIManager.listen && !_wireKeys.midi) {
      _wireKeys.midi = true;
      MIDIManager.listen(function (e) { if (_g.active && _g.onKey) _g.onKey(LMScore.canonical(e.fullNote)); });
    }
  }

  function _openGame(title, icon) {
    _closeGame();
    _g.active = true;
    var ov = document.createElement('div');
    ov.id = 'lmp-game';
    ov.className = 'lml-overlay';
    ov.innerHTML =
      '<div class="lml-card" role="dialog" aria-modal="true" aria-label="' + title + '">' +
        '<div class="lml-head"><span class="lml-title">' + icon + ' ' + title + '</span>' +
          '<span class="lml-step" id="lmp-g-stat"></span>' +
          '<button class="lml-close" aria-label="Close" onclick="LMPractice.closeGame()">✕</button></div>' +
        '<div class="lml-progress"><div class="lml-progress-fill" id="lmp-g-bar"></div></div>' +
        '<div class="lml-body" id="lmp-g-body"></div>' +
        '<div class="lml-kb" id="lmp-g-kb"></div>' +
        '<div class="lml-foot" id="lmp-g-foot"></div>' +
      '</div>';
    document.body.appendChild(ov);
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.render('lmp-g-kb');
    _wireKeys();
    return {
      body: document.getElementById('lmp-g-body'),
      foot: document.getElementById('lmp-g-foot'),
      stat: document.getElementById('lmp-g-stat'),
      bar: document.getElementById('lmp-g-bar'),
    };
  }

  function _closeGame() {
    _g.timers.forEach(clearTimeout);
    _g.timers = [];
    _g.active = false;
    _g.onKey = null;
    var ov = document.getElementById('lmp-game');
    if (ov) { ov.remove(); _rerenderHome(); }
    if (typeof PianoKeyboard !== 'undefined') {
      PianoKeyboard.setClickEnabled(false);
      // Note Rush hides the key letters; put the student's setting back
      var st = (_load() || {}).settings || {};
      PianoKeyboard.showNoteNames(st.showNoteNames !== false);
    }
  }

  function _later(fn, ms) { _g.timers.push(setTimeout(function () { if (_g.active) fn(); }, ms)); }

  function _sound(note, ms, vel) {
    try { AudioEngine.init(); AudioEngine.playNote(LMScore.canonical(note), ms || 600, vel || 85); } catch (e) {}
  }

  // ── Note Rush ──────────────────────────────────────────────────
  var RUSH_POOLS = {
    primer: { treble: ['C4', 'D4', 'E4', 'F4', 'G4'], bass: ['C3', 'D3', 'E3', 'F3', 'G3'], key: 'C' },
    level1: { treble: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], bass: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'], key: 'C' },
    level2: { treble: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], bass: ['E2', 'F#2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F#3', 'G3', 'A3', 'B3'], key: 'G' },
  };

  function noteRush() {
    var ui = _openGame('Note Rush', '⚡');
    // Reading practice: no letters on the keys
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.showNoteNames(false);
    var pool = RUSH_POOLS[_gameLevel()] || RUSH_POOLS.primer;
    ui.body.innerHTML = '<div class="lml-text">A note appears on the grand staff — play it on the piano. ' +
      'How many can you get in <b>60 seconds</b>?' + (pool.key !== 'C' ? ' Watch the key signature: every F is F-sharp!' : '') + '</div>';
    var go = document.createElement('button');
    go.className = 'lesson-btn lesson-btn--primary';
    go.textContent = '▶ Start';
    ui.foot.appendChild(go);
    go.onclick = function () { _rushRun(ui, pool); };
  }

  function _rushRun(ui, pool) {
    ui.foot.innerHTML = '';
    ui.body.innerHTML = '';
    var staff = document.createElement('div');
    staff.className = 'lml-staff';
    ui.body.appendChild(staff);
    var fb = document.createElement('div');
    fb.className = 'lml-feedback';
    ui.body.appendChild(fb);
    var all = pool.treble.map(function (n) { return { n: n, clef: 'rh' }; })
      .concat(pool.bass.map(function (n) { return { n: n, clef: 'lh' }; }));
    var score = 0, misses = 0, cur = null, last = null, endAt = Date.now() + 60000;

    function pick() {
      do { cur = all[Math.floor(Math.random() * all.length)]; } while (all.length > 1 && last && cur.n === last.n);
      last = cur;
      var spec = cur.clef === 'rh' ? { rh: cur.n + 'w', lh: 'Rw' } : { rh: 'Rw', lh: cur.n + 'w' };
      var song = { id: 'rush', title: 'rush', score: { time: '4/4', key: pool.key, rh: spec.rh, lh: spec.lh } };
      try {
        staff.style.width = '300px';
        LMScore.render(Vex.Flow, staff, LMScore.compile(song), { noTime: true, barNumbers: false, perRow: 1, grand: true });
      } catch (e) {}
    }
    function tick() {
      var left = Math.max(0, endAt - Date.now());
      ui.stat.textContent = '⏱ ' + Math.ceil(left / 1000) + 's · ' + score + ' ✓';
      ui.bar.style.width = (100 * (60000 - left) / 60000) + '%';
      if (left <= 0) return finish();
      _later(tick, 200);
    }
    function finish() {
      _g.onKey = null;
      var best = _saveBest('noteRush', score);
      var acc = score + misses ? Math.round(100 * score / (score + misses)) : 0;
      ui.body.innerHTML = '<div class="lml-done"><div class="lml-done-icon">' + (best ? '🏆' : '⚡') + '</div>' +
        '<div class="lml-done-title">' + score + ' notes!</div>' +
        '<div class="lml-done-sub">' + acc + '% right' + (best ? ' · new best!' : '') + '</div></div>';
      if (score && typeof GamificationManager !== 'undefined') GamificationManager.awardNotes(Math.min(20, score), 'note rush');
      var again = document.createElement('button');
      again.className = 'lesson-btn lesson-btn--primary';
      again.textContent = '↺ Play again';
      again.onclick = function () { _rushRun(ui, pool); };
      ui.foot.appendChild(again);
    }
    _g.onKey = function (note) {
      _sound(note, 500, 80);
      if (note === LMScore.canonical(cur.n)) {
        score++;
        fb.textContent = '✅';
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashCorrect(note);
        pick();
      } else {
        misses++;
        fb.textContent = 'Not that one — read it again!';
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashWrong(note);
      }
    };
    pick();
    tick();
  }

  // ── Echo ───────────────────────────────────────────────────────
  var ECHO_POOLS = {
    primer: ['C4', 'D4', 'E4', 'F4', 'G4'],
    level1: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    level2: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'F#4', 'Bb4'],
  };

  function echo() {
    var ui = _openGame('Echo', '👂');
    ui.body.innerHTML = '<div class="lml-text">Listen to the little tune, then play it back. ' +
      'It starts on the <b>glowing key</b>. Every round adds one more note. You have <b>3 lives</b>.</div>';
    var go = document.createElement('button');
    go.className = 'lesson-btn lesson-btn--primary';
    go.textContent = '▶ Start';
    ui.foot.appendChild(go);
    go.onclick = function () { _echoRun(ui, ECHO_POOLS[_gameLevel()] || ECHO_POOLS.primer); };
  }

  function _echoRun(ui, pool) {
    ui.foot.innerHTML = '';
    var round = 0, lives = 3, tune = [], pos = 0, listening = false;
    ui.body.innerHTML = '<div class="lml-done"><div class="lml-done-icon" id="lmp-echo-icon">👂</div>' +
      '<div class="lml-done-title" id="lmp-echo-title"></div><div class="lml-done-sub" id="lmp-echo-sub"></div></div>';
    var icon = document.getElementById('lmp-echo-icon');
    var title = document.getElementById('lmp-echo-title');
    var sub = document.getElementById('lmp-echo-sub');
    var replay = document.createElement('button');
    replay.className = 'lesson-btn';
    replay.textContent = '🔁 Hear it again';
    replay.onclick = function () { if (listening) playTune(); };
    ui.foot.appendChild(replay);

    function stat() { ui.stat.textContent = 'Round ' + round + ' · ' + '❤️'.repeat(lives); }

    // Stepwise-ish tunes: mostly steps and small skips, like real melodies
    function grow() {
      if (!tune.length) tune.push(pool[Math.floor(Math.random() * Math.min(5, pool.length))]);
      while (tune.length < round + 1) {
        var i = pool.indexOf(tune[tune.length - 1]);
        var step = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
        var j = Math.max(0, Math.min(pool.length - 1, i + step));
        tune.push(pool[j]);
      }
    }
    function playTune() {
      listening = false;
      pos = 0;
      icon.textContent = '🎵';
      title.textContent = 'Listen…';
      sub.textContent = '';
      if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.clearAll();
      tune.forEach(function (n, i) { _later(function () { _sound(n, 520, 90); }, 300 + i * 620); });
      _later(function () {
        listening = true;
        icon.textContent = '🎹';
        title.textContent = 'Your turn!';
        sub.textContent = tune.length + ' notes';
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.highlightNextSet([{ note: LMScore.canonical(tune[0]), hand: 'right' }]);
      }, 300 + tune.length * 620);
    }
    function nextRound() {
      round++;
      grow();
      stat();
      ui.bar.style.width = Math.min(100, round * 10) + '%';
      playTune();
    }
    function over() {
      listening = false;
      _g.onKey = null;
      var score = round - 1;
      var best = _saveBest('echo', score);
      icon.textContent = best ? '🏆' : '👂';
      title.textContent = score + ' round' + (score === 1 ? '' : 's');
      sub.textContent = best ? 'New best!' : 'Great listening!';
      if (score && typeof GamificationManager !== 'undefined') GamificationManager.awardNotes(Math.min(20, score * 2), 'echo');
      ui.foot.innerHTML = '';
      var again = document.createElement('button');
      again.className = 'lesson-btn lesson-btn--primary';
      again.textContent = '↺ Play again';
      again.onclick = function () { _echoRun(ui, pool); };
      ui.foot.appendChild(again);
    }
    _g.onKey = function (note) {
      if (!listening) return;
      _sound(note, 450, 85);
      if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.clearAll();
      if (note === LMScore.canonical(tune[pos])) {
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashCorrect(note);
        pos++;
        if (pos >= tune.length) {
          listening = false;
          icon.textContent = '✅';
          title.textContent = 'Perfect!';
          _later(nextRound, 900);
        }
      } else {
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashWrong(note);
        lives--;
        stat();
        listening = false;
        if (lives <= 0) { _later(over, 600); return; }
        icon.textContent = '🙉';
        title.textContent = 'Oops — listen again';
        _later(playTune, 1100);
      }
    };
    nextRound();
  }

  return {
    start: start, ping: ping, flush: _flush, minutesOn: minutesOn, recentDays: recentDays,
    homeHtml: homeHtml, parentHtml: parentHtml, notePlayed: notePlayed,
    toggleDone: toggleDone, playItem: playItem, addSong: addSong, removeSong: removeSong, hasSong: hasSong,
    noteRush: noteRush, echo: echo, closeGame: _closeGame,
    _saveMeta: _saveMeta, _addSong: _addSong, _addLesson: _addLesson, _addCustom: _addCustom,
    _remove: _remove, _newWeek: _newWeek,
  };
})();
