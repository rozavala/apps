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
  // Bar marks (see js/lm-score.js): written before or after a bar's notes
  var START_MARKS = { '[:': 'start', 'segno': 'segno' };
  var END_MARKS = { ':]': 'end', 'fine': 'fine', 'dc': 'dc', 'ds': 'ds' };

  // Events of one hand; bar marks found go into `marks[barIndex]` (optional)
  function parseVoice(src, marks) {
    var evs = [];
    String(src || '').split('|').forEach(function (bar, bi) {
      bar.trim().split(/\s+/).forEach(function (tok) {
        if (!tok) return;
        var low = tok.toLowerCase(), v = /^\{([1-4])\}$/.exec(tok);
        if (v || START_MARKS[low] || END_MARKS[low]) {
          if (marks) {
            var f = marks[bi] = marks[bi] || {};
            if (v) f.volta = +v[1]; else f[START_MARKS[low] || END_MARKS[low]] = true;
          }
          return;
        }
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
    var bm = d.barMarks || {};
    Object.keys(bm).forEach(function (k) { if (+k + 1 > n) n = +k + 1; });
    function voice(bars, withMarks) {
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
        var f = withMarks && bm[i];
        if (f) {
          var pre = [], post = [];
          if (f.segno) pre.push('Segno');
          if (f.start) pre.push('[:');
          if (f.volta) pre.push('{' + f.volta + '}');
          if (f.end) post.push(':]');
          if (f.fine) post.push('Fine');
          if (f.dc) post.push('DC');
          if (f.ds) post.push('DS');
          toks = pre.concat(toks, post);
        }
        out.push(toks.join(' '));
      }
      return out.join(' | ');
    }
    var spec = { time: d.time, key: d.key };
    if (d.pickup) spec.pickup = d.pickup;
    spec.rh = voice(rh, true);
    if (hasLH) spec.lh = voice(lh, false);
    if (d.tempo) spec.tempo = d.tempo;
    if (d.marks && d.marks.length) spec.marks = d.marks.slice();
    return spec;
  }

  // Bars written so far (the longer hand)
  function barCount(d) {
    var a = d.rh.length ? layout(d.rh, d).length : 0, b = d.lh.length ? layout(d.lh, d).length : 0;
    return Math.max(a, b);
  }

  // Fill both hands with rests to the end of bar n (so new music starts a fresh bar)
  function padTo(d, n) {
    var time = LMScore.parseTime(d.time);
    ['rh', 'lh'].forEach(function (h) {
      if (!d[h].length && h === 'lh') return;
      var bars = layout(d[h], d);
      var last = bars[bars.length - 1];
      if (d[h].length && last.used < last.cap - EPS) {
        restTokens(last.cap - last.used).forEach(function (t) { d[h] = d[h].concat(parseVoice(t)); });
      }
      var have = d[h].length ? layout(d[h], d).length : 0;
      for (var i = have; i < n; i++) {
        var cap = (i === 0 && d.pickup) ? d.pickup : time.barBeats;
        restTokens(cap).forEach(function (t) { d[h] = d[h].concat(parseVoice(t)); });
      }
    });
  }

  function _song(d) {
    var b = Math.max(30, Math.min(200, d.bpm || 80));
    return {
      id: d.id, title: d.title || 'My piece', composer: d.book || 'From my lesson book',
      world: WORLD, difficulty: 3, custom: true, alwaysUnlocked: true, isBonus: false,
      funFact: d.book ? 'This piece is from ' + d.book + '. Practise it a little every day!' : 'This piece is from your own lesson book.',
      concept: d.tip || (d.tempo ? 'Tempo: ' + d.tempo : ''),
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
        barMarks: {}, marks: (existing.score.marks || []).slice(), tempo: existing.score.tempo || '',
      };
      _d.rh = parseVoice(existing.score.rh, _d.barMarks);
      _d.lh = existing.score.lh ? parseVoice(existing.score.lh, _d.barMarks) : [];
      // An all-rest hand counts as empty
      ['rh', 'lh'].forEach(function (h) { if (_d[h].every(function (e) { return e.rest; })) _d[h] = []; });
    } else {
      var used = list().map(function (s) { return s.id; });
      var nid = ID_BASE + 1;
      while (used.indexOf(nid) >= 0) nid++;
      _d = { id: nid, title: '', book: '', tip: '', time: '4/4', key: 'C', pickup: 0, bpm: 80, rh: [], lh: [],
             barMarks: {}, marks: [], tempo: '' };
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

  function _stop() {
    if (_ui.player) { _ui.player.stop(); _ui.player = null; }
    _ui.listenToken = null;
    var b = document.getElementById('lmb-listen');
    if (b) b.textContent = '▶ Listen';
  }

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
      '<div class="lml-text">Copy a piece from the lesson book: take a photo of the page, or enter it one note at a time. It stays private to this student and syncs to your family\'s devices.</div>' +
      '<div class="lmb-help">📷 Tip: if the camera screen stays black, take the picture with the iPad\'s Camera app first, then choose it under <b>Photo Library</b>.</div>' +
      '<div class="lmb-form">' +
        '<label>Title<input id="lmb-title" class="lmp-pm-input" value="' + _esc(_d.title) + '" placeholder="e.g. Sonatina"></label>' +
        '<label>Book &amp; page<input id="lmb-book" class="lmp-pm-input" value="' + _esc(_d.book) + '" placeholder="e.g. Alfred\'s Lesson Book 1B, p. 44"></label>' +
        '<label>Time signature<select id="lmb-time" class="lmp-pm-input">' + opt(['2/4', '3/4', '4/4', '3/8', '6/8'], _d.time) + '</select></label>' +
        '<label>Key<select id="lmb-key" class="lmp-pm-input">' + opt([['C', 'C major (no sharps or flats)'], ['G', 'G major (F♯)'], ['F', 'F major (B♭)'], ['D', 'D major (F♯ C♯)'], ['Am', 'A minor'], ['Dm', 'D minor (B♭)'], ['Em', 'E minor (F♯)']], _d.key) + '</select></label>' +
        '<label>Starts with a pickup?<select id="lmb-pickup" class="lmp-pm-input">' + opt([[0, 'No — starts on beat 1'], [0.5, '½ beat'], [1, '1 beat'], [1.5, '1½ beats'], [2, '2 beats'], [3, '3 beats']], _d.pickup) + '</select></label>' +
        '<label>Speed (beats per minute)<input id="lmb-bpm" class="lmp-pm-input" type="number" min="30" max="200" step="4" value="' + _d.bpm + '"></label>' +
        '<label>Tempo marking (optional)<input id="lmb-tempo" class="lmp-pm-input" value="' + _esc(_d.tempo) + '" placeholder="e.g. Moderately"></label>' +
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
    photo.textContent = '📷 Read it from photos';
    photo.title = 'One page or several (up to 4) — pick them in order';
    photo.onclick = function () { _readDetails(); _pickPhoto('new'); };
    foot.appendChild(photo);

    var next = document.createElement('button');
    next.className = 'lesson-btn lesson-btn--primary';
    next.textContent = 'Enter the notes →';
    next.onclick = function () {
      var hadNotes = _d.rh.length || _d.lh.length;
      var t = document.getElementById('lmb-time').value, p = parseFloat(document.getElementById('lmb-pickup').value) || 0;
      if (hadNotes && (t !== _d.time || p !== _d.pickup)) {
        ZsDialog.confirm({ title: 'Change the time signature?', message: 'Changing the time signature or pickup re-flows the bars you entered.', confirmLabel: 'Change it' })
          .then(function (ok) { if (ok) go(); });
      } else go();
    };
    function go() {
      var t = document.getElementById('lmb-time').value, p = parseFloat(document.getElementById('lmb-pickup').value) || 0;
      _readDetails();
      _d.time = t;
      _d.key = document.getElementById('lmb-key').value;
      _d.pickup = p >= LMScore.parseTime(t).barBeats ? 0 : p;
      _d.bpm = parseInt(document.getElementById('lmb-bpm').value, 10) || 80;
      _notes();
    }
    foot.appendChild(next);
  }

  function _readDetails() {
    var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    if (document.getElementById('lmb-title')) {
      _d.title = v('lmb-title'); _d.book = v('lmb-book'); _d.tip = v('lmb-tip'); _d.tempo = v('lmb-tempo');
      _d.bpm = parseInt(v('lmb-bpm'), 10) || _d.bpm;
    }
  }

  // ── Photo → notes (vps/omr.js) ─────────────────────────────────
  var KEYS_OK = { C: 1, G: 1, D: 1, A: 1, E: 1, F: 1, Bb: 1, Eb: 1, Am: 1, Em: 1, Bm: 1, Dm: 1, Gm: 1, Cm: 1 };
  var _omrAbort = null;

  function _log(msg) { if (typeof Debug !== 'undefined' && Debug.log) Debug.log('[MyBook photo] ' + msg); }

  // No `capture` attribute on purpose: forcing the camera leaves no way out
  // when the browser app has no camera permission (iPadOS then shows a black
  // camera). Without it, iOS offers Take Photo / Photo Library / Choose File,
  // so a photo taken with the Camera app works too.
  // The input is attached to the page: on iOS WebKit a detached file input
  // can open the picker and then never fire `change`.
  // mode: 'new' (the piece starts here) or 'append' (pages that follow what's entered)
  function _pickPhoto(mode) {
    var old = document.getElementById('lmb-photo-input');
    if (old) old.remove();
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;               // several pages from the Photo Library
    input.id = 'lmb-photo-input';
    input.style.cssText = 'position:fixed;left:-1000px;top:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(input);
    var handled = false;
    var onPick = function () {
      if (handled) return;
      var files = input.files ? Array.prototype.slice.call(input.files) : [];
      if (!files.length) return;
      handled = true;
      _log('picked ' + files.length + ' file(s): ' + files.map(function (f) { return (f.type || '?') + ' ' + Math.round(f.size / 1024) + ' KB'; }).join(', '));
      if (files.length > 4) { ZsDialog.toast('Up to 4 pages at a time. Reading the first 4; use "Add next page" for the rest.', 6000); files = files.slice(0, 4); }
      if (files.length > 1) _pageOrder(files, mode);
      else _readPhotos(files, mode);
      setTimeout(function () { input.remove(); }, 1000);
    };
    input.addEventListener('change', onPick);
    input.addEventListener('input', onPick);
    _log('opening picker');
    input.click();
  }

  // Shrink to ~2000 px on the long side: plenty for notes, quick to send.
  // Older iPads can hand back an empty canvas when memory is tight, so
  // step down in size until the JPEG comes out.
  function _shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        _log('decoded ' + img.width + '×' + img.height);
        var sizes = [2000, 1600, 1200];
        for (var i = 0; i < sizes.length; i++) {
          var scale = Math.min(1, sizes[i] / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          try {
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            var data = c.toDataURL('image/jpeg', 0.85);
            if (data && data.length > 5000) {
              URL.revokeObjectURL(url);
              _log('jpeg ' + c.width + '×' + c.height + ', ' + Math.round(data.length / 1024) + ' KB');
              return resolve(data);
            }
          } catch (e) { _log('canvas failed at ' + sizes[i] + ': ' + e.message); }
        }
        URL.revokeObjectURL(url);
        reject(new Error('This picture is too big for the iPad to process. Try a photo from the Camera app.'));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        _log('decode failed for ' + (file.type || 'unknown type'));
        reject(new Error('That file is not a picture I can open. Take the photo with the Camera app and choose it from Photos.'));
      };
      img.src = url;
    });
  }

  // Several pages: show them in order with ↑ ↓ before reading
  function _pageOrder(files, mode) {
    var body = document.getElementById('lmb-body'), foot = document.getElementById('lmb-foot');
    document.getElementById('lmb-kb').style.display = 'none';
    var urls = files.map(function (f) { return URL.createObjectURL(f); });
    var order = files.map(function (_, i) { return i; });
    function draw() {
      body.innerHTML = '<div class="lml-text"><b>Put the pages in order</b> — page 1 first.</div>' +
        '<div class="lmb-pages">' + order.map(function (fi, pos) {
          return '<div class="lmb-page"><img src="' + urls[fi] + '" alt="Page ' + (pos + 1) + '">' +
            '<div class="lmb-page-bar"><b>Page ' + (pos + 1) + '</b>' +
            '<button class="lesson-btn" data-up="' + pos + '"' + (pos ? '' : ' disabled') + ' aria-label="Move earlier">↑</button>' +
            '<button class="lesson-btn" data-down="' + pos + '"' + (pos < order.length - 1 ? '' : ' disabled') + ' aria-label="Move later">↓</button></div></div>';
        }).join('') + '</div>';
      body.querySelectorAll('[data-up]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.up; order.splice(i - 1, 0, order.splice(i, 1)[0]); draw(); }; });
      body.querySelectorAll('[data-down]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.down; order.splice(i + 1, 0, order.splice(i, 1)[0]); draw(); }; });
    }
    draw();
    foot.innerHTML = '';
    var back = document.createElement('button');
    back.className = 'lesson-btn';
    back.textContent = 'Cancel';
    back.onclick = function () { urls.forEach(URL.revokeObjectURL); if (mode === 'append') _notes(); else _details(); };
    var go = document.createElement('button');
    go.className = 'lesson-btn lesson-btn--primary';
    go.textContent = '📷 Read ' + files.length + ' pages';
    go.onclick = function () { urls.forEach(URL.revokeObjectURL); _readPhotos(order.map(function (i) { return files[i]; }), mode); };
    foot.appendChild(back); foot.appendChild(go);
  }

  // The last written bar of a hand, for telling the reader where to carry on
  function _lastBar(spec, h) {
    var bars = String(spec[h] || '').split('|');
    return (bars[bars.length - 1] || '').trim();
  }

  function _readPhotos(files, mode) {
    var body = document.getElementById('lmb-body'), foot = document.getElementById('lmb-foot');
    document.getElementById('lmb-kb').style.display = 'none';
    var server = typeof CloudSync !== 'undefined' && CloudSync.server;
    if (!server) { ZsDialog.alert({ title: 'No connection to the family server', message: 'Reading photos needs the family sync server.' }); return; }
    body.innerHTML = '<div class="lml-done"><div class="lml-done-icon lmb-reading">📷</div>' +
      '<div class="lml-done-title">Reading ' + (files.length > 1 ? files.length + ' pages' : 'the music') + '…</div>' +
      '<div class="lml-done-sub" id="lmb-omr-time">Usually under a minute. Keep the app open.</div></div>';
    foot.innerHTML = '';
    var cancel = document.createElement('button');
    cancel.className = 'lesson-btn';
    cancel.textContent = 'Cancel';
    foot.appendChild(cancel);
    var started = Date.now();
    var tick = setInterval(function () {
      var el = document.getElementById('lmb-omr-time');
      if (el) el.textContent = Math.round((Date.now() - started) / 1000) + ' s — reading every bar three times, then proofreading…';
    }, 1000);
    var done = function () { clearInterval(tick); _omrAbort = null; };
    _omrAbort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var back = function () { if (mode === 'append') _notes(); else _details(); };
    cancel.onclick = function () { if (_omrAbort) _omrAbort.abort(); done(); back(); };

    var payload = { title: _d.title, hint: [_d.title, _d.book].filter(Boolean).join(' — ') };
    if (mode === 'append') {
      var spec = toSpec(_d);
      payload.continueFrom = { bars: barCount(_d), time: _d.time, key: _d.key, rh: _lastBar(spec, 'rh'), lh: _lastBar(spec, 'lh') };
    }
    // The server is only reachable over the family VPN (Tailscale): check it
    // answers before spending time on the photos, and say so if it doesn't.
    var offline = new Error('OFFLINE');
    var ping = new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(offline); }, 8000);
      fetch(server + '/api/ping', { cache: 'no-store', signal: _omrAbort ? _omrAbort.signal : undefined })
        .then(function (r) { clearTimeout(t); if (r.ok) resolve(); else reject(offline); },
              function (e) { clearTimeout(t); reject(e && e.name === 'AbortError' ? e : offline); });
    });
    // Shrink the pages one after another (older iPads run out of memory doing them at once)
    ping.then(function () { return files; }).then(function (files) { return files.reduce(function (p, f) {
      return p.then(function (list) { return _shrink(f).then(function (d) { return list.concat([d]); }); });
    }, Promise.resolve([])); }).then(function (images) {
      payload.images = images;
      return fetch(server + '/api/omr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: _omrAbort ? _omrAbort.signal : undefined,
      });
    }).then(function (r) {
      _log('server answered ' + r.status);
      return r.json();
    }).then(function (res) {
      done();
      if (!res.piece) throw new Error(res.error || 'Could not read the photo.');
      _applyPhoto(res, mode, files.length);
    }).catch(function (e) {
      done();
      if (e && e.name === 'AbortError') return;
      _log('failed: ' + (e && e.message));
      back();
      // fetch() itself failing ("Load failed" on iPad, "Failed to fetch" in Chrome) means no connection
      if (e === offline || (e && e.name === 'TypeError' && /load failed|failed to fetch|network/i.test(e.message || ''))) {
        ZsDialog.alert({ title: 'Can\'t reach the family server',
          message: 'Reading photos goes through the family server. Check that the iPad is online and that Tailscale (the VPN) is connected, then try again.' });
        return;
      }
      ZsDialog.alert({ title: 'Could not read the photo', message: (e && e.message) || 'Check the internet connection and try again.' });
    });
  }

  function _applyPhoto(res, mode, pages) {
    var p = res.piece;
    var problem = res.ok ? null : res.error;
    var newMarks = {}, rh = [], lh = [];
    try {
      rh = p.rh ? parseVoice(p.rh, newMarks) : [];
      lh = p.lh ? parseVoice(p.lh, newMarks) : [];
    } catch (e) { problem = e.message; rh = []; lh = []; }
    if (rh.length && rh.every(function (e) { return e.rest; })) rh = [];
    if (lh.length && lh.every(function (e) { return e.rest; })) lh = [];
    var offset = 0;
    if (mode === 'append') {
      // New pages start on a fresh bar after everything entered so far
      offset = barCount(_d);
      padTo(_d, offset);
      // A left hand that only starts on the new pages: rests until then
      if (lh.length && !_d.lh.length) {
        var time = LMScore.parseTime(_d.time);
        for (var i = 0; i < offset; i++) restTokens((i === 0 && _d.pickup) ? _d.pickup : time.barBeats).forEach(function (t) { _d.lh = _d.lh.concat(parseVoice(t)); });
      }
      // (A hand missing from the new pages is filled with rests by toSpec)
      _d.rh = _d.rh.concat(rh);
      _d.lh = _d.lh.concat(lh);
    } else {
      if (!_d.title && p.title) _d.title = p.title;
      if (p.time) _d.time = p.time;
      if (p.key && KEYS_OK[p.key]) _d.key = p.key;
      _d.pickup = p.pickup || 0;
      _d.rh = rh; _d.lh = lh;
      _d.barMarks = {}; _d.marks = [];
      if (p.tempo && !_d.tempo) _d.tempo = p.tempo;
      if (p.bpm) _d.bpm = p.bpm;
    }
    Object.keys(newMarks).forEach(function (k) { _d.barMarks[+k + offset] = newMarks[k]; });
    var found = (p.marks || []).map(function (m) { return { bar: m.bar + offset, kind: m.kind, text: m.text, fromPhoto: true }; });
    _d.marks = (_d.marks || []).concat(found);
    _ui.unsure = (mode === 'append' ? _ui.unsure : []).concat((res.unsure || []).map(function (b) { return b + offset; }));
    _ui.followEnd = false;
    _ui.fromPhoto = { problem: problem, notes: res.notes || '', rh: p.rh, lh: p.lh, pages: pages || 1, appended: mode === 'append',
                      from: offset + 1, marks: found.length };
    _notes();
    if (problem) {
      // Leave the raw reading in the text boxes to fix by hand
      var det = document.querySelector('.lmb-text');
      if (det) det.open = true;
      if (!rh.length && p.rh) document.getElementById('lmb-rh-text').value = p.rh;
      if (!lh.length && p.lh) document.getElementById('lmb-lh-text').value = p.lh;
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
      '<div class="lmb-barmarks">Bar: ' +
        '<button class="lmb-mark" data-mark="start" title="Repeat starts at the bar you are entering">𝄆 Repeat start</button>' +
        '<button class="lmb-mark" data-mark="end" title="Repeat ends after the last note">𝄇 Repeat end</button>' +
        '<button class="lmb-mark" data-mark="v1" title="The bar you are entering starts the 1st ending">1st ending</button>' +
        '<button class="lmb-mark" data-mark="v2" title="The bar you are entering starts the 2nd ending">2nd ending</button>' +
        '<button class="lmb-mark" data-mark="fine" title="Fine after the last note">Fine</button>' +
        '<button class="lmb-mark" data-mark="dc" title="D.C. al Fine after the last note">D.C.</button>' +
      '</div>' +
      (_ui.fromPhoto ? '<div class="lmb-photo-note" id="lmb-photo-note"></div>' : '') +
      '<div class="lml-feedback" id="lmb-status"></div>' +
      '<div class="lmb-preview" id="lmb-preview"></div>' +
      '<div class="lmb-notes"><div class="lmb-notes-head"><b>Bar notes</b> <small>tips from the book, the teacher\'s notes, p / f · drag one on the music to move it</small></div>' +
        '<div id="lmb-notes-list"></div>' +
        '<div class="lmb-notes-add">Bar <input id="lmb-note-bar" class="lmp-pm-input" type="number" min="1" style="width:64px">' +
          '<select id="lmb-note-kind" class="lmp-pm-input"><option value="tip">Tip</option><option value="teacher">Teacher\'s note</option><option value="dynamic">Dynamic (p, f…)</option></select>' +
          '<input id="lmb-note-text" class="lmp-pm-input" placeholder="e.g. Move thumb up to G" style="flex:1;min-width:140px">' +
          '<button class="lesson-btn" id="lmb-note-add">+ Add</button></div>' +
      '</div>' +
      '<details class="lmb-text"><summary>Edit as text</summary>' +
        '<label>Right hand<textarea id="lmb-rh-text" class="pm-teacher-notes-area" rows="3"></textarea></label>' +
        '<label>Left hand<textarea id="lmb-lh-text" class="pm-teacher-notes-area" rows="3"></textarea></label>' +
        '<button class="lesson-btn" id="lmb-apply-text">Apply text</button>' +
        '<div class="lmb-help">Notes like <code>C4q</code>, <code>G4h.</code> (dotted), <code>E4q~</code> (tie), <code>C3+E3+G3w</code> (chord), <code>Rq</code> (rest), <code>:3</code> finger; bars split with <code>|</code>. Repeats <code>[:</code> <code>:]</code>, endings <code>{1}</code> <code>{2}</code>, <code>Fine</code>, <code>DC</code>.</div>' +
      '</details>';
    foot.innerHTML = '';
    var back = document.createElement('button');
    back.className = 'lesson-btn';
    back.textContent = '← Details';
    back.onclick = function () { _stop(); _details(); };
    var listen = document.createElement('button');
    listen.className = 'lesson-btn';
    listen.id = 'lmb-listen';
    listen.textContent = '▶ Listen';
    listen.onclick = function () { if (_ui.player || _ui.listenToken) _stop(); else _listen(); };
    var more = document.createElement('button');
    more.className = 'lesson-btn';
    more.textContent = '📷 ＋ Add next page';
    more.title = 'Read the following page(s) and add them after the last bar';
    more.onclick = function () { _stop(); _pickPhoto('append'); };
    var save = document.createElement('button');
    save.className = 'lesson-btn lesson-btn--primary';
    save.textContent = 'Save piece ✓';
    save.onclick = _finish;
    foot.appendChild(back); foot.appendChild(more); foot.appendChild(listen); foot.appendChild(save);

    body.querySelectorAll('[data-hand]').forEach(function (b) { b.onclick = function () { _ui.hand = b.dataset.hand; _refresh(); }; });
    body.querySelectorAll('[data-dur]').forEach(function (b) { b.onclick = function () { _ui.dur = b.dataset.dur; _refresh(); }; });
    body.querySelector('[data-act=dot]').onclick = function () { _ui.dots = _ui.dots ? 0 : 1; _refresh(); };
    body.querySelector('[data-act=chord]').onclick = function () { _ui.chord = !_ui.chord; _refresh(); };
    body.querySelector('[data-act=rest]').onclick = function () { _add(null); };
    body.querySelector('[data-act=tie]').onclick = _tie;
    body.querySelector('[data-act=undo]').onclick = _undo;
    body.querySelectorAll('[data-finger]').forEach(function (b) { b.onclick = function () { _finger(+b.dataset.finger); }; });
    document.getElementById('lmb-apply-text').onclick = _applyText;
    body.querySelectorAll('[data-mark]').forEach(function (b) { b.onclick = function () { _barMark(b.dataset.mark); }; });
    document.getElementById('lmb-note-add').onclick = _addNote;
    if (_ui.fromPhoto) {
      var fp = _ui.fromPhoto;
      document.getElementById('lmb-photo-note').innerHTML =
        '📷 <b>' + (fp.appended ? 'Added ' + (fp.pages > 1 ? fp.pages + ' pages' : 'the next page') + ' from bar ' + fp.from + '.'
                                : 'Read from ' + (fp.pages > 1 ? fp.pages + ' photos' : 'the photo') + '.') + '</b> ' +
        'Now check it against the book: press <b>▶ Listen</b> and follow along bar by bar. ' +
        (fp.marks ? '<br>Found ' + fp.marks + ' bar note' + (fp.marks > 1 ? 's' : '') + ' — check them under <b>Bar notes</b> and remove any that are wrong.' : '') +
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
      // Follow the end while entering notes; start at the top when checking a
      // photo; stay put after dragging a bar note
      if (_ui.keepScroll != null) { prev.scrollTop = _ui.keepScroll; _ui.keepScroll = null; }
      else prev.scrollTop = _ui.followEnd ? prev.scrollHeight : 0;
      _wireMarkDrag(out, prev);
    } catch (e) {
      prev.innerHTML = '<div class="lmp-muted">' + _esc(e.message) + '</div>';
    }
    var spec = toSpec(_d);
    var rt = document.getElementById('lmb-rh-text'), lt = document.getElementById('lmb-lh-text');
    if (rt && document.activeElement !== rt) rt.value = spec.rh || '';
    if (lt && document.activeElement !== lt) lt.value = _d.lh.length ? spec.lh : '';
    _drawNotes();
    var nb = document.getElementById('lmb-note-bar');
    if (nb && !nb.value) nb.value = Math.max(1, barNo);
    return spec;
  }

  // ── Bar marks and bar notes ────────────────────────────────────
  // Marks that open a bar go on the bar about to be entered; marks that
  // close one go on the bar of the last note.
  function _barMark(kind) {
    var evs = _d[_ui.hand].length ? _d[_ui.hand] : _d.rh;
    var bars = layout(evs, _d);
    var cur = bars[bars.length - 1];
    var curIdx = bars.length - 1;
    var nextIdx = evs.length && cur.used >= cur.cap - EPS ? bars.length : curIdx;
    var opening = kind === 'start' || kind === 'v1' || kind === 'v2';
    var idx = opening ? nextIdx : curIdx;
    var f = _d.barMarks[idx] = _d.barMarks[idx] || {};
    var label;
    if (kind === 'v1' || kind === 'v2') {
      var n = kind === 'v1' ? 1 : 2;
      f.volta = f.volta === n ? 0 : n;
      label = n + (n === 1 ? 'st' : 'nd') + ' ending';
      if (!f.volta) delete f.volta;
    } else {
      f[kind] = !f[kind];
      if (!f[kind]) delete f[kind];
      label = { start: 'Repeat start', end: 'Repeat end', fine: 'Fine', dc: 'D.C. al Fine' }[kind];
    }
    var on = kind === 'v1' || kind === 'v2' ? !!f.volta : !!f[kind];
    if (!Object.keys(f).length) delete _d.barMarks[idx];
    _refresh(label + (on ? ' set on bar ' : ' removed from bar ') + (idx + 1) + '.');
  }

  // Bar notes on the preview can be dragged off whatever they cover; the
  // move is kept on the mark (dx / dy, in staff units) and saved with the piece.
  function _wireMarkDrag(out, prev) {
    if (!out || !out.svg || !out.marks) return;
    out.marks.forEach(function (m) {
      var el = m.el;
      el.style.cursor = 'grab';
      el.style.touchAction = 'none';
      // Without this the iPad scrolls the preview instead of moving the note
      el.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
      el.addEventListener('pointerdown', function (e) {
        var mk = _d.marks[m.src];
        if (!mk) return;
        e.preventDefault();
        e.stopPropagation();
        var ctm = out.svg.getScreenCTM();
        var k = ctm && ctm.a ? ctm.a : 1;
        var sx = e.clientX, sy = e.clientY, moved = false;
        try { el.setPointerCapture(e.pointerId); } catch (er) {}
        el.classList.add('lmb-dragging');
        var move = function (ev) {
          var dx = (ev.clientX - sx) / k, dy = (ev.clientY - sy) / k;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
          el.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')');
        };
        var up = function (ev) {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          el.classList.remove('lmb-dragging');
          if (!moved || ev.type === 'pointercancel') { el.removeAttribute('transform'); return; }
          mk.dx = Math.round((mk.dx || 0) + (ev.clientX - sx) / k);
          mk.dy = Math.round((mk.dy || 0) + (ev.clientY - sy) / k);
          _ui.keepScroll = prev.scrollTop;
          _refresh('Moved the note on bar ' + mk.bar + '. Tap ↺ in Bar notes to put it back.');
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });
    });
  }

  function _drawNotes() {
    var el = document.getElementById('lmb-notes-list');
    if (!el) return;
    var KIND = { tip: '📝 Tip', teacher: '✎ Teacher', dynamic: '🔊 Dynamic' };
    el.innerHTML = (_d.marks || []).map(function (m, i) {
      return '<div class="lmb-note-row' + (m.fromPhoto ? ' lmb-note-row--photo' : '') + '">' +
        '<span class="lmb-note-bar">Bar ' + m.bar + '</span><span class="lmb-note-kind">' + (KIND[m.kind] || m.kind) + '</span>' +
        '<span class="lmb-note-text">' + _esc(m.text) + (m.fromPhoto ? ' <small>(from the photo — check it)</small>' : '') + '</span>' +
        (m.dx || m.dy ? '<button class="lmb-finger" data-reset-note="' + i + '" aria-label="Put back in place" title="Put back in place">↺</button>' : '') +
        '<button class="lmb-finger" data-del-note="' + i + '" aria-label="Remove">✕</button></div>';
    }).join('') || '<div class="lmp-muted">None yet.</div>';
    el.querySelectorAll('[data-reset-note]').forEach(function (b) {
      b.onclick = function () { var mk = _d.marks[+b.dataset.resetNote]; delete mk.dx; delete mk.dy; _refresh('Note put back in place.'); };
    });
    el.querySelectorAll('[data-del-note]').forEach(function (b) {
      b.onclick = function () { _d.marks.splice(+b.dataset.delNote, 1); _refresh(); };
    });
  }

  function _addNote() {
    var bar = parseInt(document.getElementById('lmb-note-bar').value, 10);
    var kind = document.getElementById('lmb-note-kind').value;
    var text = document.getElementById('lmb-note-text').value.trim();
    if (!bar || bar < 1 || !text) { _status('Pick a bar number and write the note first.', true); return; }
    _d.marks.push({ bar: bar, kind: kind, text: text.slice(0, 120) });
    _d.marks.sort(function (a, b) { return a.bar - b.bar; });
    document.getElementById('lmb-note-text').value = '';
    _refresh('Note added to bar ' + bar + '.');
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
      var marks = {};
      var rh = parseVoice(document.getElementById('lmb-rh-text').value, marks);
      var lh = parseVoice(document.getElementById('lmb-lh-text').value, marks);
      if (lh.length && lh.every(function (e) { return e.rest; })) lh = [];
      LMScore.compile({ id: 'check', title: 'check', score: toSpec(Object.assign({}, _d, { rh: rh, lh: lh, barMarks: marks })) });
      _d.rh = rh; _d.lh = lh; _d.barMarks = marks;
      _refresh('Text applied.');
    } catch (e) {
      _status(e.message, true);
    }
  }

  function _listen() {
    _stop();
    var c;
    try { c = LMScore.compile(_song(_d)); } catch (e) { _status(e.message, true); return; }
    if (!c.events.length) { _status('Enter some notes first.', true); return; }
    AudioEngine.init();
    var btn = document.getElementById('lmb-listen');
    if (btn) btn.textContent = '■ Stop';
    var token = _ui.listenToken = {};
    var start = function () {
      if (_ui.listenToken !== token || !_ui.active) return;
      _ui.player = LMScore.play(c, AudioEngine, { bpm: _d.bpm, onEnd: function () { _ui.player = null; _stop(); } });
      _ui.listenToken = null;
    };
    // After the camera or photo picker, iOS leaves the audio suspended; notes
    // sent before it is running again are lost, so wait for it (briefly).
    var ac = AudioEngine.context;
    if (ac && ac.state !== 'running' && ac.resume) {
      var once = function () { var f = start; start = function () {}; f(); };
      ac.resume().then(once, once);
      setTimeout(once, 500);
    } else start();
  }

  // ── Step 3: save ───────────────────────────────────────────────
  function _finish() {
    _stop();
    if (!_d.rh.length && !_d.lh.length) { _status('Enter some notes first.', true); return; }
    var song;
    _d.marks = (_d.marks || []).map(function (m) {
      var o = { bar: m.bar, kind: m.kind, text: m.text };
      if (m.dx) o.dx = m.dx;
      if (m.dy) o.dy = m.dy;
      return o;
    });
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
    ZsDialog.confirm({ title: 'Delete "' + (_d.title || 'this piece') + '"?', message: 'Stars earned on it stay in the history.', confirmLabel: 'Delete', danger: true })
      .then(function (ok) { if (ok) _deleteNow(); });
  }
  function _deleteNow() {
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
