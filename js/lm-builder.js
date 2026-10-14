/* ================================================================
   LITTLE MAESTRO — My Book (lm-builder.js)

   Lets a grown-up enter a piece from the student's own lesson book,
   so the homework piece gets the full lesson: hands picker, falling
   notes, loop bars, This Week. The piece is stored only in that
   student's record (customSongs) — it syncs between the family's
   devices like the rest of their progress, and is never part of the
   public song list.

   Entering notes: pick a length (whole … sixteenth, dot, tie), then
   play the key on the piano (MIDI) or tap it on screen. Keys pressed
   together become a chord. Bars fill up by the time signature; the
   left hand is entered the same way on its own tab. "Edit as text"
   shows the js/lm-score.js notation for quick fixes.

   Or take a photo of the page: the sync server reads it (vps/omr.js,
   Gemini) and the editor opens with the notes filled in, bars the
   reads disagreed on tinted, for the student to check with ▶ Listen.

   Custom songs get ids from 9000 and world 90, and are put into SONGS
   for the current student by LMBuilder.syncSongs().
   ================================================================ */

var LMBuilder = (function () {
  'use strict';

  var ID_BASE = 9000;
  var WORLD = 90;

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
  function list() {
    var d = _load();
    return (d && Array.isArray(d.customSongs)) ? d.customSongs : [];
  }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Put this student's pieces into SONGS (and take anyone else's out)
  var _syncedFor = null;
  function syncSongs() {
    if (typeof SONGS === 'undefined') return;
    var mine = list();
    var sig = _key() + '|' + JSON.stringify(mine);
    if (sig === _syncedFor) return;
    _syncedFor = sig;
    for (var i = SONGS.length - 1; i >= 0; i--) if (SONGS[i].custom) SONGS.splice(i, 1);
    mine.forEach(function (s) {
      var copy = JSON.parse(JSON.stringify(s));
      try { LMScore.compile(copy); } catch (e) { return; }   // skip a broken one rather than break the app
      SONGS.push(copy);
    });
    if (typeof LMScore !== 'undefined') LMScore.attach(SONGS.filter(function (s) { return s.custom; }));
  }

  // ── Notation helpers ───────────────────────────────────────────
  var DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
  var REST_SPANS = [[4, 'Rw'], [3, 'Rh.'], [2, 'Rh'], [1.5, 'Rq.'], [1, 'Rq'], [0.75, 'Re.'], [0.5, 'Re'], [0.25, 'Rs']];
  var EPS = 1e-6;
  var FLAT_NAMES = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
  var FLAT_KEYS = { F: 1, Bb: 1, Eb: 1, Ab: 1, Dm: 1, Gm: 1, Cm: 1, Fm: 1 };

  function beatsOf(ev) { return DUR[ev.dur] * (ev.dots ? 1.5 : 1); }

  // Spell a played key for the piece's key: flats in flat keys
  function spell(note, key) {
    var m = /^([A-G]#?)(\d)$/.exec(note);
    if (!m) return note;
    return (FLAT_KEYS[key] && FLAT_NAMES[m[1]] ? FLAT_NAMES[m[1]] : m[1]) + m[2];
  }

  function restTokens(beats) {
    var out = [], left = beats;
    while (left > EPS) {
      var pick = REST_SPANS.find(function (r) { return r[0] <= left + EPS; });
      if (!pick) break;
      out.push(pick[1]);
      left -= pick[0];
    }
    return out;
  }

  function token(ev) {
    var t = ev.rest ? 'R' : ev.pitches.join('+');
    t += ev.dur + (ev.dots ? '.' : '') + (ev.tie && !ev.rest ? '~' : '');
    if (!ev.rest && ev.fingers && ev.fingers.length === ev.pitches.length) t += ':' + ev.fingers.join(',');
    return t;
  }

  var TOKEN_RE = /^((?:[A-G][#b]?\d\+)*[A-G][#b]?\d|R)(w|h|q|e|s)(\.?)(~?)(?::([1-5](?:,[1-5])*))?$/;
  function parseVoice(src) {
    var evs = [];
    String(src || '').split('|').forEach(function (bar) {
      bar.trim().split(/\s+/).forEach(function (tok) {
        if (!tok) return;
        var m = TOKEN_RE.exec(tok);
        if (!m) throw new Error('Cannot read "' + tok + '"');
        evs.push({
          rest: m[1] === 'R', pitches: m[1] === 'R' ? [] : m[1].split('+'),
          dur: m[2], dots: m[3] ? 1 : 0, tie: !!m[4], fingers: m[5] ? m[5].split(',').map(Number) : [],
        });
      });
    });
    return evs;
  }

  // Bar layout of one hand: [{ events, used, cap }]
  function layout(evs, d) {
    var time = LMScore.parseTime(d.time);
    var bars = [];
    var cur = null;
    function open() {
      cur = { events: [], used: 0, cap: (bars.length === 0 && d.pickup) ? d.pickup : time.barBeats };
      bars.push(cur);
    }
    open();
    evs.forEach(function (ev) {
      if (cur.used >= cur.cap - EPS) open();
      cur.events.push(ev);
      cur.used += beatsOf(ev);
    });
    return bars;
  }

  // The score spec for the piece, with short bars filled with rests and
  // the two hands evened out to the same number of bars.
  function toSpec(d) {
    var time = LMScore.parseTime(d.time);
    var rh = layout(d.rh, d), lh = layout(d.lh, d);
    var n = Math.max(rh.length, lh.length);
    var hasLH = d.lh.length > 0, hasRH = d.rh.length > 0;
    function voice(bars) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var b = bars[i];
        var cap = (i === 0 && d.pickup) ? d.pickup : time.barBeats;
        var toks = b ? b.events.map(token) : [];
        var used = b ? b.used : 0;
        // A piece with a pickup may end on the short bar that completes it
        var last = i === n - 1;
        var target = cap;
        if (last && d.pickup && Math.abs(used - (time.barBeats - d.pickup)) < EPS) target = used;
        if (used < target - EPS) toks = toks.concat(restTokens(target - used));
        if (!toks.length) toks = restTokens(cap);
        out.push(toks.join(' '));
      }
      return out.join(' | ');
    }
    var spec = { time: d.time, key: d.key };
    if (d.pickup) spec.pickup = d.pickup;
    if (hasRH || !hasLH) spec.rh = voice(rh);
    if (hasLH) spec.lh = voice(lh);
    if (!hasRH && hasLH) spec.rh = voice([]);
    return spec;
  }

  function _song(d) {
    var b = Math.max(30, Math.min(200, d.bpm || 80));
    return {
      id: d.id, title: d.title || 'My piece', composer: d.book || 'From my lesson book',
      world: WORLD, difficulty: 3, custom: true, alwaysUnlocked: true, isBonus: false,
      funFact: d.book ? 'This piece is from ' + d.book + '. Practise it a little every day!' : 'This piece is from your own lesson book.',
      concept: d.tip || '',
      bpm: { turtle: Math.round(b * 0.7), normal: b, rabbit: Math.round(b * 1.2), rocket: Math.round(b * 1.4) },
      score: toSpec(d),
    };
  }

  // ── Editor state ───────────────────────────────────────────────
  var _d = null;            // draft: { id, title, book, tip, time, key, pickup, bpm, rh:[], lh:[] }
  var _ui = { hand: 'rh', dur: 'q', dots: 0, chord: false, lastAt: 0, active: false, player: null, unsure: [], fromPhoto: null };

  function open(id) {
    syncSongs();
    var existing = id ? list().find(function (s) { return s.id === id; }) : null;
    if (existing) {
      _d = {
        id: existing.id, title: existing.title, book: existing.composer === 'From my lesson book' ? '' : existing.composer,
        tip: existing.concept || '', time: existing.score.time, key: existing.score.key,
        pickup: existing.score.pickup || 0, bpm: existing.bpm.normal,
        rh: parseVoice(existing.score.rh), lh: existing.score.lh ? parseVoice(existing.score.lh) : [],
      };
      // An all-rest hand counts as empty
      ['rh', 'lh'].forEach(function (h) { if (_d[h].every(function (e) { return e.rest; })) _d[h] = []; });
    } else {
      var used = list().map(function (s) { return s.id; });
      var nid = ID_BASE + 1;
      while (used.indexOf(nid) >= 0) nid++;
      _d = { id: nid, title: '', book: '', tip: '', time: '4/4', key: 'C', pickup: 0, bpm: 80, rh: [], lh: [] };
    }
    _ui.hand = 'rh'; _ui.dur = 'q'; _ui.dots = 0; _ui.chord = false; _ui.unsure = []; _ui.fromPhoto = null;
    _overlay();
    _details();
  }

  function close() {
    _ui.active = false;
    _stop();
    var ov = document.getElementById('lmb-overlay');
    if (ov) ov.remove();
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.setClickEnabled(false);
    if (typeof QuestMap !== 'undefined' && document.getElementById('screen-questmap')) QuestMap.render();
  }

  function _stop() { if (_ui.player) { _ui.player.stop(); _ui.player = null; } }

  function _overlay() {
    var old = document.getElementById('lmb-overlay');
    if (old) old.remove();
    _ui.active = true;
    var ov = document.createElement('div');
    ov.id = 'lmb-overlay';
    ov.className = 'lml-overlay';
    ov.innerHTML =
      '<div class="lml-card lmb-card" role="dialog" aria-modal="true" aria-label="Add a piece">' +
        '<div class="lml-head"><span class="lml-title">📒 <span id="lmb-head">A piece from my book</span></span>' +
          '<button class="lml-close" aria-label="Close" onclick="LMBuilder.close()">✕</button></div>' +
        '<div class="lml-body" id="lmb-body"></div>' +
        '<div class="lml-kb" id="lmb-kb" style="display:none"></div>' +
        '<div class="lml-foot" id="lmb-foot"></div>' +
      '</div>';
    document.body.appendChild(ov);
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.render('lmb-kb');
    _wireInput();
  }

  // ── Step 1: details ────────────────────────────────────────────
  function _details() {
    var body = document.getElementById('lmb-body'), foot = document.getElementById('lmb-foot');
    document.getElementById('lmb-kb').style.display = 'none';
    var opt = function (vals, cur) {
      return vals.map(function (v) {
        var val = Array.isArray(v) ? v[0] : v, lab = Array.isArray(v) ? v[1] : v;
        return '<option value="' + val + '"' + (String(val) === String(cur) ? ' selected' : '') + '>' + lab + '</option>';
      }).join('');
    };
    body.innerHTML =
      '<div class="lml-text">Copy a piece from the lesson book, one note at a time. It stays private to this student and syncs to your family\'s devices.</div>' +
      '<div class="lmb-form">' +
        '<label>Title<input id="lmb-title" class="lmp-pm-input" value="' + _esc(_d.title) + '" placeholder="e.g. Sonatina"></label>' +
        '<label>Book &amp; page<input id="lmb-book" class="lmp-pm-input" value="' + _esc(_d.book) + '" placeholder="e.g. Alfred\'s Lesson Book 1B, p. 44"></label>' +
        '<label>Time signature<select id="lmb-time" class="lmp-pm-input">' + opt(['2/4', '3/4', '4/4', '3/8', '6/8'], _d.time) + '</select></label>' +
        '<label>Key<select id="lmb-key" class="lmp-pm-input">' + opt([['C', 'C major (no sharps or flats)'], ['G', 'G major (F♯)'], ['F', 'F major (B♭)'], ['D', 'D major (F♯ C♯)'], ['Am', 'A minor'], ['Dm', 'D minor (B♭)'], ['Em', 'E minor (F♯)']], _d.key) + '</select></label>' +
        '<label>Starts with a pickup?<select id="lmb-pickup" class="lmp-pm-input">' + opt([[0, 'No — starts on beat 1'], [0.5, '½ beat'], [1, '1 beat'], [1.5, '1½ beats'], [2, '2 beats'], [3, '3 beats']], _d.pickup) + '</select></label>' +
        '<label>Speed (beats per minute)<input id="lmb-bpm" class="lmp-pm-input" type="number" min="30" max="200" step="4" value="' + _d.bpm + '"></label>' +
        '<label class="lmb-wide">Teacher\'s tip (optional)<input id="lmb-tip" class="lmp-pm-input" value="' + _esc(_d.tip) + '" placeholder="e.g. Two right-hand positions — move your thumb up to G in bar 5"></label>' +
      '</div>';
    foot.innerHTML = '';
    if (list().some(function (s) { return s.id === _d.id; })) {
      var del = document.createElement('button');
      del.className = 'lesson-btn lesson-btn--danger';
      del.textContent = 'Delete piece';
      del.onclick = _delete;
      foot.appendChild(del);
    }
    var photo = document.createElement('button');
    photo.className = 'lesson-btn';
    photo.textContent = '📷 Read it from a photo';
    photo.onclick = function () { _readDetails(); _pickPhoto(); };
    foot.appendChild(photo);

    var next = document.createElement('button');
    next.className = 'lesson-btn lesson-btn--primary';
    next.textContent = 'Enter the notes →';
    next.onclick = function () {
      var hadNotes = _d.rh.length || _d.lh.length;
      var t = document.getElementById('lmb-time').value, p = parseFloat(document.getElementById('lmb-pickup').value) || 0;
      if (hadNotes && (t !== _d.time || p !== _d.pickup) && !confirm('Changing the time signature or pickup re-flows the bars you entered. Continue?')) return;
      _readDetails();
      _d.time = t;
      _d.key = document.getElementById('lmb-key').value;
      _d.pickup = p >= LMScore.parseTime(t).barBeats ? 0 : p;
      _d.bpm = parseInt(document.getElementById('lmb-bpm').value, 10) || 80;
      _notes();
    };
    foot.appendChild(next);
  }

  function _readDetails() {
    var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    if (document.getElementById('lmb-title')) {
      _d.title = v('lmb-title'); _d.book = v('lmb-book'); _d.tip = v('lmb-tip');
      _d.bpm = parseInt(v('lmb-bpm'), 10) || _d.bpm;
    }
  }

  // ── Photo → notes (vps/omr.js) ─────────────────────────────────
  var KEYS_OK = { C: 1, G: 1, D: 1, A: 1, E: 1, F: 1, Bb: 1, Eb: 1, Am: 1, Em: 1, Bm: 1, Dm: 1, Gm: 1, Cm: 1 };
  var _omrAbort = null;

  function _pickPhoto() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');   // iPad/phone: open the camera
    input.onchange = function () { if (input.files && input.files[0]) _readPhoto(input.files[0]); };
    input.click();
  }

  // Shrink to ~2000 px on the long side: plenty for notes, quick to send
  function _shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 2000 / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('That file is not a picture I can open.')); };
      img.src = url;
    });
  }

  function _readPhoto(file) {
    var body = document.getElementById('lmb-body'), foot = document.getElementById('lmb-foot');
    var server = typeof CloudSync !== 'undefined' && CloudSync.server;
    if (!server) { alert('Reading photos needs the family sync server.'); return; }
    body.innerHTML = '<div class="lml-done"><div class="lml-done-icon lmb-reading">📷</div>' +
      '<div class="lml-done-title">Reading the music…</div>' +
      '<div class="lml-done-sub" id="lmb-omr-time">Usually under 30 seconds. Keep the app open.</div></div>';
    foot.innerHTML = '';
    var cancel = document.createElement('button');
    cancel.className = 'lesson-btn';
    cancel.textContent = 'Cancel';
    foot.appendChild(cancel);
    var started = Date.now();
    var tick = setInterval(function () {
      var el = document.getElementById('lmb-omr-time');
      if (el) el.textContent = Math.round((Date.now() - started) / 1000) + ' s — reading every bar three times to be sure…';
    }, 1000);
    var done = function () { clearInterval(tick); _omrAbort = null; };
    _omrAbort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    cancel.onclick = function () { if (_omrAbort) _omrAbort.abort(); done(); _details(); };

    _shrink(file).then(function (dataUrl) {
      return fetch(server + '/api/omr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, hint: [_d.title, _d.book].filter(Boolean).join(' — ') }),
        signal: _omrAbort ? _omrAbort.signal : undefined,
      });
    }).then(function (r) { return r.json(); }).then(function (res) {
      done();
      if (!res.piece) throw new Error(res.error || 'Could not read the photo.');
      _applyPhoto(res);
    }).catch(function (e) {
      done();
      if (e && e.name === 'AbortError') return;
      _details();
      alert((e && e.message) || 'Could not read the photo. Check the internet connection and try again.');
    });
  }

  function _applyPhoto(res) {
    var p = res.piece;
    if (!_d.title && p.title) _d.title = p.title;
    if (p.time) _d.time = p.time;
    if (p.key && KEYS_OK[p.key]) _d.key = p.key;
    _d.pickup = p.pickup || 0;
    var problem = res.ok ? null : res.error;
    try {
      _d.rh = p.rh ? parseVoice(p.rh) : [];
      _d.lh = p.lh ? parseVoice(p.lh) : [];
    } catch (e) {
      problem = e.message;
      _d.rh = []; _d.lh = [];
    }
    _ui.unsure = res.unsure || [];
    _ui.followEnd = false;
    _ui.fromPhoto = { problem: problem, notes: res.notes || '', rh: p.rh, lh: p.lh };
    _notes();
    if (problem) {
      // Leave the raw reading in the text boxes to fix by hand
      var det = document.querySelector('.lmb-text');
      if (det) det.open = true;
      if (!_d.rh.length && p.rh) document.getElementById('lmb-rh-text').value = p.rh;
      if (!_d.lh.length && p.lh) document.getElementById('lmb-lh-text').value = p.lh;
    }
  }

  // ── Step 2: notes ──────────────────────────────────────────────
  var DUR_BTNS = [['w', '𝅝', 'Whole'], ['h', '𝅗𝅥', 'Half'], ['q', '♩', 'Quarter'], ['e', '♪', 'Eighth'], ['s', '𝅘𝅥𝅯', 'Sixteenth']];

  function _notes() {
    var body = document.getElementById('lmb-body'), foot = document.getElementById('lmb-foot');
    document.getElementById('lmb-head').textContent = _d.title || 'A piece from my book';
    document.getElementById('lmb-kb').style.display = '';
    body.innerHTML =
      '<div class="lmb-hands">' +
        '<button class="qm-tab" data-hand="rh"><span class="hand-badge hand-badge--rh">R</span> Right hand</button>' +
        '<button class="qm-tab" data-hand="lh"><span class="hand-badge hand-badge--lh">L</span> Left hand</button>' +
      '</div>' +
      '<div class="lmb-tools">' +
        DUR_BTNS.map(function (b) { return '<button class="lmb-tool" data-dur="' + b[0] + '" title="' + b[2] + '"><span class="lmb-glyph">' + b[1] + '</span><small>' + b[2] + '</small></button>'; }).join('') +
        '<button class="lmb-tool" data-act="dot" title="Dotted: half as long again"><span class="lmb-glyph">•</span><small>Dot</small></button>' +
        '<button class="lmb-tool" data-act="rest" title="Add a rest of this length"><span class="lmb-glyph">𝄽</span><small>Rest</small></button>' +
        '<button class="lmb-tool" data-act="chord" title="On-screen keys: add the next key to the last note"><span class="lmb-glyph">⧉</span><small>Chord</small></button>' +
        '<button class="lmb-tool" data-act="tie" title="Tie the last note to the next one"><span class="lmb-glyph">⁀</span><small>Tie</small></button>' +
        '<button class="lmb-tool" data-act="undo" title="Remove the last note"><span class="lmb-glyph">⌫</span><small>Undo</small></button>' +
      '</div>' +
      '<div class="lmb-fingers">Finger for the last note: ' +
        [1, 2, 3, 4, 5].map(function (f) { return '<button class="lmb-finger" data-finger="' + f + '">' + f + '</button>'; }).join('') +
        '<button class="lmb-finger" data-finger="0" title="Clear fingers">✕</button></div>' +
      (_ui.fromPhoto ? '<div class="lmb-photo-note" id="lmb-photo-note"></div>' : '') +
      '<div class="lml-feedback" id="lmb-status"></div>' +
      '<div class="lmb-preview" id="lmb-preview"></div>' +
      '<details class="lmb-text"><summary>Edit as text</summary>' +
        '<label>Right hand<textarea id="lmb-rh-text" class="pm-teacher-notes-area" rows="3"></textarea></label>' +
        '<label>Left hand<textarea id="lmb-lh-text" class="pm-teacher-notes-area" rows="3"></textarea></label>' +
        '<button class="lesson-btn" id="lmb-apply-text">Apply text</button>' +
        '<div class="lmb-help">Notes like <code>C4q</code>, <code>G4h.</code> (dotted), <code>E4q~</code> (tie), <code>C3+E3+G3w</code> (chord), <code>Rq</code> (rest), <code>:3</code> finger; bars split with <code>|</code>.</div>' +
      '</details>';
    foot.innerHTML = '';
    var back = document.createElement('button');
    back.className = 'lesson-btn';
    back.textContent = '← Details';
    back.onclick = function () { _stop(); _details(); };
    var listen = document.createElement('button');
    listen.className = 'lesson-btn';
    listen.textContent = '▶ Listen';
    listen.onclick = _listen;
    var save = document.createElement('button');
    save.className = 'lesson-btn lesson-btn--primary';
    save.textContent = 'Save piece ✓';
    save.onclick = _finish;
    foot.appendChild(back); foot.appendChild(listen); foot.appendChild(save);

    body.querySelectorAll('[data-hand]').forEach(function (b) { b.onclick = function () { _ui.hand = b.dataset.hand; _refresh(); }; });
    body.querySelectorAll('[data-dur]').forEach(function (b) { b.onclick = function () { _ui.dur = b.dataset.dur; _refresh(); }; });
    body.querySelector('[data-act=dot]').onclick = function () { _ui.dots = _ui.dots ? 0 : 1; _refresh(); };
    body.querySelector('[data-act=chord]').onclick = function () { _ui.chord = !_ui.chord; _refresh(); };
    body.querySelector('[data-act=rest]').onclick = function () { _add(null); };
    body.querySelector('[data-act=tie]').onclick = _tie;
    body.querySelector('[data-act=undo]').onclick = _undo;
    body.querySelectorAll('[data-finger]').forEach(function (b) { b.onclick = function () { _finger(+b.dataset.finger); }; });
    document.getElementById('lmb-apply-text').onclick = _applyText;
    if (_ui.fromPhoto) {
      var fp = _ui.fromPhoto;
      document.getElementById('lmb-photo-note').innerHTML =
        '📷 <b>Read from the photo.</b> Now check it against the book: press <b>▶ Listen</b> and follow along bar by bar. ' +
        (fp.problem ? '<br><b>One thing to fix:</b> ' + _esc(fp.problem) + ' (see "Edit as text").'
          : _ui.unsure.length ? '<br>Look hardest at the <span class="lmb-unsure-swatch">tinted</span> bar' + (_ui.unsure.length > 1 ? 's' : '') + ' (' + _ui.unsure.join(', ') + ') — the reads disagreed there.'
          : '') +
        (fp.notes ? '<br><small>' + _esc(fp.notes) + '</small>' : '');
    }
    _refresh();
  }

  function _status(msg, bad) {
    var el = document.getElementById('lmb-status');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('lmb-bad', !!bad);
  }

  function _refresh(msg) {
    var body = document.getElementById('lmb-body');
    if (!body) return;
    body.querySelectorAll('[data-hand]').forEach(function (b) { b.classList.toggle('qm-tab--active', b.dataset.hand === _ui.hand); });
    body.querySelectorAll('[data-dur]').forEach(function (b) { b.classList.toggle('lmb-tool--on', b.dataset.dur === _ui.dur); });
    body.querySelector('[data-act=dot]').classList.toggle('lmb-tool--on', !!_ui.dots);
    body.querySelector('[data-act=chord]').classList.toggle('lmb-tool--on', _ui.chord);

    var evs = _d[_ui.hand];
    var bars = layout(evs, _d);
    var cur = bars[bars.length - 1];
    var full = cur.used >= cur.cap - EPS;
    var barNo = full && evs.length ? bars.length + 1 : bars.length;
    var left = full ? LMScore.parseTime(_d.time).barBeats : cur.cap - cur.used;
    _status(msg || ((_ui.hand === 'rh' ? 'Right' : 'Left') + ' hand · bar ' + barNo + ' · ' + _fmtBeats(left) + ' left in this bar. Play the next note.'));

    // Preview
    var prev = document.getElementById('lmb-preview');
    try {
      var song = _song(_d);
      var c = LMScore.compile(song);
      var out = LMScore.render(Vex.Flow, prev, c, { names: true, fingers: true, grand: true });
      // Bars the photo reads disagreed on
      if (_ui.unsure.length && out && out.svg) {
        out.bars.filter(function (b) { return _ui.unsure.indexOf(b.index + 1) >= 0; }).forEach(function (b) {
          var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          r.setAttribute('x', b.x); r.setAttribute('y', b.y - 6); r.setAttribute('width', b.w); r.setAttribute('height', b.h + 12);
          r.setAttribute('rx', 6); r.setAttribute('fill', 'rgba(245,158,11,0.18)');
          out.svg.insertBefore(r, out.svg.firstChild);
        });
      }
      // Ink colour, and mark the bar being entered
      prev.querySelectorAll('path, rect, text').forEach(function (p) {
        if (!p.getAttribute('fill') || p.getAttribute('fill') === 'black') p.setAttribute('fill', '#3D3555');
        if (p.getAttribute('stroke') === 'black') p.setAttribute('stroke', '#3D3555');
      });
      // Follow the end while entering notes; start at the top when checking a photo
      prev.scrollTop = _ui.followEnd ? prev.scrollHeight : 0;
    } catch (e) {
      prev.innerHTML = '<div class="lmp-muted">' + _esc(e.message) + '</div>';
    }
    var spec = toSpec(_d);
    var rt = document.getElementById('lmb-rh-text'), lt = document.getElementById('lmb-lh-text');
    if (rt && document.activeElement !== rt) rt.value = _d.rh.map(token).join(' ');
    if (lt && document.activeElement !== lt) lt.value = _d.lh.map(token).join(' ');
    return spec;
  }

  function _fmtBeats(b) {
    var w = Math.floor(b + EPS), f = b - w;
    var frac = f > 0.7 ? '¾' : f > 0.4 ? '½' : f > 0.2 ? '¼' : '';
    return (w || !frac ? w : '') + frac + ' beat' + (b > 1 + EPS || b < EPS ? 's' : '');
  }

  // Add a note (pitch string) or, with null, a rest of the chosen length
  function _add(pitch) {
    var evs = _d[_ui.hand];
    var last = evs[evs.length - 1];
    var now = Date.now();
    // Keys pressed together (or Chord mode on screen) join the last note
    if (pitch && last && !last.rest && (_ui.chord || now - _ui.lastAt < 140)) {
      if (last.pitches.indexOf(pitch) < 0) {
        last.pitches.push(pitch);
        last.pitches.sort(function (a, b) { return LMScore.midiOf(a) - LMScore.midiOf(b); });
        last.fingers = [];
      }
      _ui.lastAt = now;
      _refresh();
      return;
    }
    var ev = { rest: !pitch, pitches: pitch ? [pitch] : [], dur: _ui.dur, dots: _ui.dots, tie: false, fingers: [] };
    var bars = layout(evs, _d);
    var cur = bars[bars.length - 1];
    var room = cur.used >= cur.cap - EPS ? LMScore.parseTime(_d.time).barBeats : cur.cap - cur.used;
    if (beatsOf(ev) > room + EPS) {
      _refresh('That note is too long — only ' + _fmtBeats(room) + ' left in this bar. Pick a shorter one (and tie it over if it carries on).');
      if (typeof SoundFX !== 'undefined') try { SoundFX.playWrong(); } catch (e) {}
      return;
    }
    evs.push(ev);
    _ui.followEnd = true;
    _ui.lastAt = now;
    _ui.dots = 0;          // a dot is usually a one-off
    _refresh();
  }

  function _undo() {
    var evs = _d[_ui.hand];
    var last = evs[evs.length - 1];
    if (!last) return;
    evs.pop();
    _refresh();
  }

  function _tie() {
    var last = _d[_ui.hand][_d[_ui.hand].length - 1];
    if (!last || last.rest) return;
    last.tie = !last.tie;
    _refresh(last.tie ? 'Tied — now play the same note again for the part after the tie.' : null);
  }

  function _finger(f) {
    var last = _d[_ui.hand][_d[_ui.hand].length - 1];
    if (!last || last.rest) return;
    if (!f) last.fingers = [];
    else if (last.pitches.length === 1) last.fingers = [f];
    else {
      if (last.fingers.length >= last.pitches.length) last.fingers = [];
      last.fingers.push(f);           // chords: bottom note first
    }
    _refresh();
  }

  function _applyText() {
    try {
      var rh = parseVoice(document.getElementById('lmb-rh-text').value);
      var lh = parseVoice(document.getElementById('lmb-lh-text').value);
      LMScore.compile({ id: 'check', title: 'check', score: toSpec(Object.assign({}, _d, { rh: rh, lh: lh })) });
      _d.rh = rh; _d.lh = lh;
      _refresh('Text applied.');
    } catch (e) {
      _status(e.message, true);
    }
  }

  function _listen() {
    _stop();
    try {
      var c = LMScore.compile(_song(_d));
      AudioEngine.init();
      _ui.player = LMScore.play(c, AudioEngine, { bpm: _d.bpm });
    } catch (e) { _status(e.message, true); }
  }

  // ── Step 3: save ───────────────────────────────────────────────
  function _finish() {
    _stop();
    if (!_d.rh.length && !_d.lh.length) { _status('Enter some notes first.', true); return; }
    var song;
    try { song = _song(_d); LMScore.compile(JSON.parse(JSON.stringify(song))); }
    catch (e) { _status(e.message, true); return; }
    var data = _load();
    if (!data) return;
    data.customSongs = (data.customSongs || []).filter(function (s) { return s.id !== song.id; }).concat([song]);
    _save(data);
    _syncedFor = null;
    syncSongs();

    var body = document.getElementById('lmb-body'), foot = document.getElementById('lmb-foot');
    document.getElementById('lmb-kb').style.display = 'none';
    var inWeek = typeof LMPractice !== 'undefined' && LMPractice.hasSong && LMPractice.hasSong(song.id);
    body.innerHTML = '<div class="lml-done"><div class="lml-done-icon">📒</div>' +
      '<div class="lml-done-title">' + _esc(song.title) + ' is ready!</div>' +
      '<div class="lml-done-sub">Find it under 📒 My Book on the song map.</div></div>' +
      (typeof LMPractice !== 'undefined' && !inWeek
        ? '<label class="lmb-week"><input type="checkbox" id="lmb-add-week" checked> Add it to this week\'s practice</label>' : '');
    foot.innerHTML = '';
    var done = document.createElement('button');
    done.className = 'lesson-btn';
    done.textContent = 'Done';
    var go = document.createElement('button');
    go.className = 'lesson-btn lesson-btn--primary';
    go.textContent = '▶ Practise it now';
    function addWeek() {
      var cb = document.getElementById('lmb-add-week');
      if (cb && cb.checked && LMPractice.addSong) LMPractice.addSong(song.id, null, _d.tip);
    }
    done.onclick = function () { addWeek(); close(); };
    go.onclick = function () {
      addWeek();
      close();
      if (typeof showScreen === 'function') showScreen('lesson');
      LessonEngine.startLesson(song.id);
    };
    foot.appendChild(done); foot.appendChild(go);
  }

  function _delete() {
    if (!confirm('Delete "' + (_d.title || 'this piece') + '"? Stars earned on it stay in the history.')) return;
    var data = _load();
    if (!data) return;
    data.customSongs = (data.customSongs || []).filter(function (s) { return s.id !== _d.id; });
    _save(data);
    _syncedFor = null;
    syncSongs();
    close();
  }

  // ── Input ──────────────────────────────────────────────────────
  function _onKey(note) {
    if (!_ui.active || !document.getElementById('lmb-preview')) return;
    try { AudioEngine.playNoteInstant(note, 85); } catch (e) {}
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashCorrect(note);
    _add(spell(note, _d.key));
  }
  function _wireInput() {
    if (typeof PianoKeyboard !== 'undefined') {
      PianoKeyboard.setClickCallback(function (n) { _onKey(LMScore.canonical(n)); });
      PianoKeyboard.setClickEnabled(true);
    }
    if (typeof MIDIManager !== 'undefined' && MIDIManager.listen && !_wireInput.midi) {
      _wireInput.midi = true;
      MIDIManager.listen(function (e) { _onKey(LMScore.canonical(e.fullNote)); });
    }
  }

  return { open: open, close: close, list: list, syncSongs: syncSongs, toSpec: toSpec, parseVoice: parseVoice, spell: spell };
})();

if (typeof module === 'object' && module.exports) module.exports = LMBuilder;
