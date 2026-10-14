/* ================================================================
   LITTLE MAESTRO — Theory lessons (lm-lessons.js)

   Short card-by-card lessons that open from the song map at the start
   of each Level 1 / Level 2 world. Card types:

     learn  text, an optional little staff, and an optional "Listen"
     find   read a note (or chord) on the staff and play it — no key
            hints until the second miss, because reading is the point
     quiz   pick an answer; can show a staff and/or play a sound first
     tap    tap a rhythm in time after a one-bar count-in

   Staff snippets use the js/lm-score.js notation: { clef, notes }
   where notes is one bar-string for that clef, e.g. 'C3w | G3w'.

   Progress lives in the student's Little Maestro record under
   progress.lessons[id] = { done, best, at } so it syncs with the rest.
   ================================================================ */

var LM_LESSONS = [
  // ── Level 1 ─────────────────────────────────────────────────────
  {
    id: 'grand-staff', world: 20, icon: '🎼', title: 'The Grand Staff',
    cards: [
      { type: 'learn', text: 'Piano music uses <b>two staffs</b> joined by a brace: the <b>treble clef</b> on top for your right hand, and the <b>bass clef</b> below for your left hand. Together they are the grand staff.',
        staff: { rh: 'C4w | G4w', lh: 'C3w | G3w' } },
      { type: 'learn', text: '<b>Middle C</b> lives right between the two staffs, on its own little line. Your left hand plays the five notes just below it, starting with finger 5 on the C one octave lower.',
        staff: { clef: 'bass', notes: 'C3q D3q E3q F3q | G3w' }, listen: true },
      { type: 'learn', text: 'Bass clef trick: the two dots of the clef hug the <b>F line</b>. C sits in the second space from the bottom, and G sits on the top line.',
        staff: { clef: 'bass', notes: 'F3w | C3w | G3w' }, listen: true },
      { type: 'find', text: 'Read each note and play it with your <b>left hand</b>.', clef: 'bass',
        targets: ['C3', 'G3', 'E3', 'D3', 'F3', 'C3', 'E3', 'G3'] },
      { type: 'quiz', text: 'Which note is this?', staff: { clef: 'bass', notes: 'E3w' },
        choices: ['C', 'E', 'G'], answer: 'E' },
      { type: 'quiz', text: 'And this one?', staff: { clef: 'bass', notes: 'G3w' },
        choices: ['F', 'G', 'A'], answer: 'G' },
      { type: 'find', text: 'Now both clefs, one note at a time. Use the right hand for the top staff and the left hand for the bottom one.', clef: 'grand',
        targets: ['C4', 'G3', 'E4', 'C3', 'G4', 'F3', 'D4', 'E3'] },
    ],
  },
  {
    id: 'chords-c', world: 20, icon: '🎹', title: 'Chords: C, F and G7',
    cards: [
      { type: 'learn', text: 'A <b>chord</b> is several notes played together. With your left hand in C position, the <b>C chord</b> is C–E–G, fingers 5–3–1.',
        staff: { clef: 'bass', notes: 'C3+E3+G3w' }, listen: true },
      { type: 'learn', text: 'For the <b>F chord</b>, keep finger 5 on C, move finger 2 to F and finger 1 to A: C–F–A.',
        staff: { clef: 'bass', notes: 'C3+F3+A3w' }, listen: true },
      { type: 'learn', text: 'For the <b>G7 chord</b>, slide finger 5 down to B, put finger 2 on F and keep finger 1 on G: B–F–G.',
        staff: { clef: 'bass', notes: 'B2+F3+G3w' }, listen: true },
      { type: 'find', text: 'Play each chord. Press all the keys together.', clef: 'bass',
        targets: [['C3', 'E3', 'G3'], ['B2', 'F3', 'G3'], ['C3', 'E3', 'G3'], ['C3', 'F3', 'A3'], ['C3', 'E3', 'G3'], ['B2', 'F3', 'G3'], ['C3', 'E3', 'G3']] },
      { type: 'quiz', text: 'Listen. Is this the C chord or the G7 chord?', sound: ['B2', 'F3', 'G3'],
        choices: ['C chord', 'G7 chord'], answer: 'G7 chord' },
    ],
  },
  {
    id: 'three-four', world: 21, icon: '💃', title: 'Time Signatures & 3/4',
    cards: [
      { type: 'learn', text: 'The two numbers at the start of the music are the <b>time signature</b>. The top number says how many beats are in each bar; the bottom 4 means a quarter note gets one beat.',
        staff: { clef: 'treble', time: '4/4', notes: 'C4q D4q E4q F4q | G4w' } },
      { type: 'learn', text: 'In <b>3/4</b> there are three beats in a bar: <b>ONE</b>-two-three, ONE-two-three. That is the rhythm of a waltz.',
        staff: { clef: 'treble', time: '3/4', notes: 'G4q E4q E4q | F4q D4q D4q' }, listen: true },
      { type: 'learn', text: 'A <b>dot</b> after a note makes it half as long again. A dotted half note lasts <b>3 beats</b> — a whole bar of 3/4.',
        staff: { clef: 'treble', time: '3/4', notes: 'C4h. | E4h. | G4h.' }, listen: true },
      { type: 'quiz', text: 'How many beats does a dotted half note get?', staff: { clef: 'treble', time: '3/4', notes: 'E4h.' },
        choices: ['2', '3', '4'], answer: '3' },
      { type: 'tap', text: 'Tap along: ONE-two-three. Tap on the beat for each note.', time: '3/4', rhythm: 'q q q | h q | h. | q q q', bpm: 80 },
    ],
  },
  {
    id: 'g-position', world: 21, icon: '🖐️', title: 'G Position',
    cards: [
      { type: 'learn', text: 'Move both hands up to <b>G position</b>. Right hand: thumb on G above middle C, fingers on G–A–B–C–D.',
        staff: { clef: 'treble', notes: 'G4q A4q B4q C5q | D5w' }, listen: true },
      { type: 'learn', text: 'Left hand: finger 5 on the low G, then A–B–C–D up to finger 1.',
        staff: { clef: 'bass', notes: 'G2q A2q B2q C3q | D3w' }, listen: true },
      { type: 'find', text: 'Play each note in G position.', clef: 'treble',
        targets: ['G4', 'B4', 'D5', 'A4', 'C5', 'G4'] },
      { type: 'find', text: 'Now the left hand.', clef: 'bass',
        targets: ['G2', 'D3', 'B2', 'C3', 'A2', 'G2'] },
    ],
  },
  {
    id: 'eighths', world: 22, icon: '🚂', title: 'Eighth Notes',
    cards: [
      { type: 'learn', text: 'Two <b>eighth notes</b> fit in one beat. They are joined by a beam. Count them "1 &, 2 &".',
        staff: { clef: 'treble', notes: 'C4e D4e E4e F4e G4q G4q' }, listen: true },
      { type: 'quiz', text: 'How many eighth notes fit in one beat?', choices: ['1', '2', '4'], answer: '2' },
      { type: 'tap', text: 'Tap the rhythm. Quarter notes are "ta", eighth notes are "ti-ti".', time: '4/4', rhythm: 'q q e e q | e e e e h', bpm: 72 },
    ],
  },
  {
    id: 'six-eight', world: 22, icon: '⛵', title: '6/8 Time',
    cards: [
      { type: 'learn', text: 'In <b>6/8</b> an eighth note gets the count, and there are six in a bar. They are grouped in two sets of three, so it feels like <b>two big swaying beats</b>: ONE-two-three FOUR-five-six.',
        staff: { clef: 'treble', time: '6/8', notes: 'C4e D4e E4e F4e E4e D4e | C4q. C4q.' }, listen: true },
      { type: 'quiz', text: 'How many eighth notes are in a bar of 6/8?', choices: ['3', '6', '8'], answer: '6' },
      { type: 'tap', text: 'Tap "Row, row, row your boat": long, long, long-short-long.', time: '6/8', rhythm: 'q. q. | q e q.', bpm: 84 },
    ],
  },
  // ── Level 2 ─────────────────────────────────────────────────────
  {
    id: 'sharps-flats', world: 23, icon: '♯', title: 'Sharps, Flats & Naturals',
    cards: [
      { type: 'learn', text: 'A <b>sharp</b> (♯) means play the very next key to the right — usually a black key. F-sharp is the black key just right of F.',
        staff: { clef: 'treble', notes: 'F4h F#4h' }, listen: true },
      { type: 'learn', text: 'A <b>flat</b> (♭) means the next key to the left. B-flat is the black key just left of B.',
        staff: { clef: 'treble', notes: 'B4h Bb4h' }, listen: true },
      { type: 'learn', text: 'A sharp or flat lasts until the end of the bar. A <b>natural</b> (♮) cancels it.',
        staff: { clef: 'treble', notes: 'F#4q G4q F4h' }, listen: true },
      { type: 'find', text: 'Play each note — watch for sharps and flats!', clef: 'treble',
        targets: ['F#4', 'Bb4', 'C#4', 'Eb4', 'G#4', 'F4', 'B4'] },
      { type: 'quiz', text: 'Which key is B-flat?', choices: ['The black key left of B', 'The black key right of B', 'The white key B'], answer: 'The black key left of B' },
    ],
  },
  {
    id: 'major-minor', world: 23, icon: '🌗', title: 'Major & Minor',
    cards: [
      { type: 'learn', text: 'A <b>major</b> chord sounds bright and happy. C major is C–E–G.',
        staff: { clef: 'treble', notes: 'C4+E4+G4w' }, listen: true },
      { type: 'learn', text: 'Lower the middle note by one key and you get a <b>minor</b> chord: C–E♭–G. It sounds darker, a little sad or mysterious.',
        staff: { clef: 'treble', notes: 'C4+Eb4+G4w' }, listen: true },
      { type: 'quiz', text: 'Listen. Major or minor?', sound: ['A3', 'C4', 'E4'], choices: ['Major', 'Minor'], answer: 'Minor' },
      { type: 'quiz', text: 'And this one?', sound: ['F3', 'A3', 'C4'], choices: ['Major', 'Minor'], answer: 'Major' },
      { type: 'quiz', text: 'One more!', sound: ['D4', 'F4', 'A4'], choices: ['Major', 'Minor'], answer: 'Minor' },
      { type: 'find', text: 'Play these chords. The first is major, the second minor.', clef: 'treble',
        targets: [['C4', 'E4', 'G4'], ['C4', 'Eb4', 'G4'], ['A3', 'C4', 'E4'], ['G3', 'B3', 'D4']] },
    ],
  },
  {
    id: 'key-signatures', world: 24, icon: '🔑', title: 'Key Signatures',
    cards: [
      { type: 'learn', text: 'Instead of writing a sharp on every F, music in <b>G major</b> puts one sharp at the start of each line. That is the <b>key signature</b>: every F is F-sharp.',
        staff: { clef: 'treble', key: 'G', notes: 'G4q A4q B4q C5q | D5q E5q F#5q G5q' }, listen: true },
      { type: 'learn', text: 'In <b>F major</b> the key signature has one flat: every B is B-flat.',
        staff: { clef: 'treble', key: 'F', notes: 'F4q G4q A4q Bb4q | C5q D5q E5q F5q' }, listen: true },
      { type: 'quiz', text: 'In this key signature, which note is always sharp?', staff: { clef: 'treble', key: 'G', notes: 'Rw' },
        choices: ['C', 'F', 'B'], answer: 'F' },
      { type: 'find', text: 'This music is in G major. Play each note — remember the F-sharp!', clef: 'treble', key: 'G',
        targets: ['G4', 'F#4', 'A4', 'F#5', 'D5', 'G4'] },
    ],
  },
  {
    id: 'scales', world: 24, icon: '🪜', title: 'Scales & Thumb-Under',
    cards: [
      { type: 'learn', text: 'A <b>scale</b> walks up eight notes in a row. To play C major with one hand, tuck your <b>thumb under</b> after finger 3: 1-2-3, thumb under, 1-2-3-4-5.',
        staff: { clef: 'treble', notes: 'C4e:1 D4e:2 E4e:3 F4e:1 G4e:2 A4e:3 B4e:4 C5e:5' }, listen: true },
      { type: 'find', text: 'Play the C major scale going up. Fingers 1-2-3, thumb under, 1-2-3-4-5.', clef: 'treble',
        targets: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] },
      { type: 'learn', text: 'Coming down, finger 3 crosses <b>over</b> the thumb: 5-4-3-2-1, then 3-2-1.',
        staff: { clef: 'treble', notes: 'C5e:5 B4e:4 A4e:3 G4e:2 F4e:1 E4e:3 D4e:2 C4e:1' }, listen: true },
      { type: 'find', text: 'Now G major. It has one sharp — F-sharp.', clef: 'treble', key: 'G',
        targets: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'] },
    ],
  },
  {
    id: 'intervals', world: 25, icon: '📏', title: 'Intervals',
    cards: [
      { type: 'learn', text: 'An <b>interval</b> is the distance between two notes. Count both notes: C up to E is a <b>3rd</b> (C-D-E).',
        staff: { clef: 'treble', notes: 'C4h E4h' }, listen: true },
      { type: 'learn', text: 'On the staff, a <b>2nd</b> goes line to space, a <b>3rd</b> skips to the next line, and a <b>5th</b> jumps line to line with one line between.',
        staff: { clef: 'treble', notes: 'C4h D4h | C4h E4h | C4h G4h' }, listen: true },
      { type: 'quiz', text: 'What interval is this?', staff: { clef: 'treble', notes: 'D4h A4h' }, choices: ['3rd', '4th', '5th'], answer: '5th' },
      { type: 'quiz', text: 'And this?', staff: { clef: 'treble', notes: 'E4h G4h' }, choices: ['2nd', '3rd', '4th'], answer: '3rd' },
      { type: 'quiz', text: 'Listen: is the second note higher or lower?', sound: ['G4', 'D4'], melodic: true, choices: ['Higher', 'Lower'], answer: 'Lower' },
      { type: 'find', text: 'Play both notes of each interval together.', clef: 'treble',
        targets: [['C4', 'G4'], ['D4', 'F4'], ['E4', 'A4'], ['F4', 'C5'], ['G4', 'B4']] },
    ],
  },
];

var LMLessons = (function () {
  'use strict';

  var _s = { lesson: null, card: 0, active: false, score: 0, max: 0, onClose: null, cleanup: null };

  // ── Storage ────────────────────────────────────────────────────
  function _store() {
    var u = typeof UserManager !== 'undefined' ? UserManager.getCurrentUser() : null;
    if (!u) return null;
    var key = 'littlemaestro_' + u.profile.name.toLowerCase().replace(/\s+/g, '_');
    try { return { key: key, data: JSON.parse(localStorage.getItem(key) || '{}') }; } catch (e) { return null; }
  }

  function status(id) {
    var st = _store();
    var l = st && st.data.progress && st.data.progress.lessons;
    return (l && l[id]) || null;
  }

  function _save(id, pct) {
    var st = _store();
    if (!st) return;
    st.data.progress = st.data.progress || {};
    var l = st.data.progress.lessons = st.data.progress.lessons || {};
    var prev = l[id] || {};
    l[id] = { done: true, best: Math.max(prev.best || 0, pct), at: new Date().toISOString() };
    localStorage.setItem(st.key, JSON.stringify(st.data));
  }

  function forWorld(world) {
    return LM_LESSONS.filter(function (l) { return l.world === world; });
  }

  // ── Small staff ────────────────────────────────────────────────
  function _staff(el, spec, key) {
    if (!el || !spec || typeof Vex === 'undefined') return;
    var score = { time: spec.time || '4/4', key: spec.key || key || 'C' };
    if (spec.rh || spec.lh) { score.rh = spec.rh; score.lh = spec.lh; }
    else if (spec.clef === 'bass') score.lh = spec.notes;
    else score.rh = spec.notes;
    var song = { id: 'lesson', title: 'lesson', score: score };
    try {
      var c = LMScore.compile(song);
      // One row, sized to the bars it holds, centred in the card
      var bars = Math.min(4, c.measures.length);
      el.style.width = Math.min(560, 150 * bars + (c.hasLH && c.hasRH ? 130 : 110)) + 'px';
      LMScore.render(Vex.Flow, el, c, { noTime: !spec.time, barNumbers: false, fingers: true, perRow: bars });
      // Ink colour to match the sheet music
      el.querySelectorAll('path, rect, text').forEach(function (p) {
        if (!p.getAttribute('fill') || p.getAttribute('fill') === 'black') p.setAttribute('fill', '#3D3555');
        if (p.getAttribute('stroke') === 'black') p.setAttribute('stroke', '#3D3555');
      });
      return c;
    } catch (e) { el.textContent = ''; return null; }
  }

  // A one-note (or one-chord) staff for find cards
  function _noteStaff(el, target, clef, key) {
    var notes = Array.isArray(target) ? target : [target];
    var low = Math.min.apply(null, notes.map(LMScore.midiOf));
    var useBass = clef === 'bass' || (clef === 'grand' && low < LMScore.midiOf('C4'));
    var tok = notes.join('+') + 'w';
    var spec = clef === 'grand'
      ? (useBass ? { rh: 'Rw', lh: tok } : { rh: tok, lh: 'Rw' })
      : (useBass ? { clef: 'bass', notes: tok } : { clef: 'treble', notes: tok });
    _staff(el, spec, key);
  }

  function _listen(spec) {
    if (!spec || typeof AudioEngine === 'undefined') return;
    var score = { time: spec.time || '4/4', key: spec.key || 'C' };
    if (spec.rh || spec.lh) { score.rh = spec.rh; score.lh = spec.lh; }
    else if (spec.clef === 'bass') score.lh = spec.notes;
    else score.rh = spec.notes;
    try {
      _stopAudio();
      _s.player = LMScore.play(LMScore.compile({ id: 'lesson', title: 'lesson', score: score }), AudioEngine, { bpm: 92 });
    } catch (e) {}
  }

  function _sound(notes, melodic) {
    if (typeof AudioEngine === 'undefined') return;
    AudioEngine.init();
    notes.forEach(function (n, i) {
      var canon = LMScore.canonical(n);
      if (melodic) setTimeout(function () { AudioEngine.playNote(canon, 700, 85); }, i * 750);
      else AudioEngine.playNote(canon, 1400, 75);
    });
  }

  function _stopAudio() {
    if (_s.player) { _s.player.stop(); _s.player = null; }
  }

  // ── Piano input (MIDI + on-screen keys) ────────────────────────
  var _onKey = null;
  function _wireInput() {
    if (typeof PianoKeyboard !== 'undefined') {
      PianoKeyboard.setClickCallback(function (note) { if (_s.active && _onKey) _onKey(LMScore.canonical(note)); });
      PianoKeyboard.setClickEnabled(true);
    }
    if (typeof MIDIManager !== 'undefined' && !_wireInput.midi) {
      // MIDIManager has no "off"; one listener, guarded by _s.active
      _wireInput.midi = true;
      MIDIManager.onNoteOn(function (e) { if (_s.active && _onKey) _onKey(LMScore.canonical(e.fullNote), true); });
    }
  }

  function _press(note, fromMidi) {
    try { AudioEngine.playNoteInstant(note, 90); } catch (e) {}
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.highlightPlaying(note);
  }

  // ── Overlay ────────────────────────────────────────────────────
  function open(id, onClose) {
    var lesson = LM_LESSONS.find(function (l) { return l.id === id; });
    if (!lesson) return;
    close(true);
    _s.lesson = lesson; _s.card = 0; _s.score = 0; _s.max = 0; _s.active = true; _s.onClose = onClose || null;

    var ov = document.createElement('div');
    ov.id = 'lml-overlay';
    ov.className = 'lml-overlay';
    ov.innerHTML =
      '<div class="lml-card" role="dialog" aria-modal="true" aria-label="' + lesson.title + '">' +
        '<div class="lml-head">' +
          '<span class="lml-title">' + lesson.icon + ' ' + lesson.title + '</span>' +
          '<span class="lml-step" id="lml-step"></span>' +
          '<button class="lml-close" aria-label="Close lesson" onclick="LMLessons.close()">✕</button>' +
        '</div>' +
        '<div class="lml-progress"><div class="lml-progress-fill" id="lml-progress-fill"></div></div>' +
        '<div class="lml-body" id="lml-body"></div>' +
        '<div class="lml-kb" id="lml-keyboard"></div>' +
        '<div class="lml-foot" id="lml-foot"></div>' +
      '</div>';
    document.body.appendChild(ov);
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.render('lml-keyboard');
    _wireInput();
    _show();
  }

  function close(silent) {
    _stopAudio();
    if (_s.cleanup) { _s.cleanup(); _s.cleanup = null; }
    _onKey = null;
    var ov = document.getElementById('lml-overlay');
    if (ov) ov.remove();
    var was = _s.active;
    _s.active = false;
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.setClickEnabled(false);
    if (was && !silent && _s.onClose) _s.onClose();
  }

  function _show() {
    if (_s.cleanup) { _s.cleanup(); _s.cleanup = null; }
    _stopAudio();
    _onKey = null;
    var lesson = _s.lesson;
    var card = lesson.cards[_s.card];
    var body = document.getElementById('lml-body');
    var foot = document.getElementById('lml-foot');
    var kb = document.getElementById('lml-keyboard');
    if (!body) return;
    document.getElementById('lml-step').textContent = (_s.card + 1) + ' / ' + lesson.cards.length;
    document.getElementById('lml-progress-fill').style.width = (100 * _s.card / lesson.cards.length) + '%';
    body.innerHTML = '';
    foot.innerHTML = '';
    if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.clearAll();
    kb.style.display = (card.type === 'find' || card.type === 'tap') ? '' : 'none';
    ({ learn: _learn, find: _find, quiz: _quiz, tap: _tap })[card.type](card, body, foot);
  }

  function _next() {
    if (_s.card < _s.lesson.cards.length - 1) { _s.card++; _show(); return; }
    _finish();
  }

  function _nextBtn(foot, label, enabled) {
    var b = document.createElement('button');
    b.className = 'lesson-btn lesson-btn--primary lml-next';
    b.textContent = label || 'Next →';
    b.disabled = enabled === false;
    b.onclick = _next;
    foot.appendChild(b);
    return b;
  }

  function _text(body, html) {
    var p = document.createElement('div');
    p.className = 'lml-text';
    p.innerHTML = html;
    body.appendChild(p);
  }

  function _staffBox(body) {
    var d = document.createElement('div');
    d.className = 'lml-staff';
    body.appendChild(d);
    return d;
  }

  // ── Card: learn ────────────────────────────────────────────────
  function _learn(card, body, foot) {
    _text(body, card.text);
    if (card.staff) _staff(_staffBox(body), card.staff);
    if (card.listen && card.staff) {
      var b = document.createElement('button');
      b.className = 'lesson-btn';
      b.textContent = '▶ Listen';
      b.onclick = function () { _listen(card.staff); };
      foot.appendChild(b);
    }
    _nextBtn(foot);
  }

  // ── Card: find ─────────────────────────────────────────────────
  function _find(card, body, foot) {
    _text(body, card.text);
    var box = _staffBox(body);
    var fb = document.createElement('div');
    fb.className = 'lml-feedback';
    body.appendChild(fb);
    var nextB = _nextBtn(foot, 'Next →', false);
    var i = 0, misses = 0, held = {}, firstTry = true;
    _s.max += card.targets.length;

    function want() {
      var t = card.targets[i];
      return (Array.isArray(t) ? t : [t]).map(LMScore.canonical);
    }
    function showTarget() {
      held = {}; misses = 0; firstTry = true;
      _noteStaff(box, card.targets[i], card.clef, card.key);
      fb.textContent = (i + 1) + ' of ' + card.targets.length;
      if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.clearAll();
    }
    _onKey = function (note) {
      _press(note);
      var keys = want();
      if (keys.indexOf(note) >= 0) {
        held[note] = true;
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashCorrect(note);
        if (Object.keys(held).length < keys.length) return;
        if (firstTry) _s.score++;
        i++;
        if (i >= card.targets.length) {
          fb.innerHTML = '✅ Great reading!';
          _onKey = null;
          nextB.disabled = false;
          return;
        }
        fb.innerHTML = '✅';
        setTimeout(function () { if (_s.active) showTarget(); }, 350);
      } else {
        firstTry = false;
        misses++;
        if (typeof PianoKeyboard !== 'undefined') PianoKeyboard.flashWrong(note);
        fb.innerHTML = misses >= 2 ? 'Look again — the glowing key is the answer.' : 'Not quite — read the note again!';
        // Second miss: show where it is
        if (misses >= 2 && typeof PianoKeyboard !== 'undefined') {
          PianoKeyboard.highlightNextSet(keys.filter(function (k) { return !held[k]; }).map(function (k) { return { note: k, hand: LMScore.midiOf(k) < 60 ? 'left' : 'right' }; }));
        }
      }
    };
    showTarget();
  }

  // ── Card: quiz ─────────────────────────────────────────────────
  function _quiz(card, body, foot) {
    _text(body, card.text);
    if (card.staff) _staff(_staffBox(body), card.staff);
    if (card.sound) {
      var play = document.createElement('button');
      play.className = 'lesson-btn lml-play';
      play.textContent = '🔊 Play the sound';
      play.onclick = function () { _sound(card.sound, card.melodic); };
      body.appendChild(play);
      setTimeout(function () { if (_s.active) _sound(card.sound, card.melodic); }, 300);
    }
    var row = document.createElement('div');
    row.className = 'lml-choices';
    body.appendChild(row);
    var fb = document.createElement('div');
    fb.className = 'lml-feedback';
    body.appendChild(fb);
    var nextB = _nextBtn(foot, 'Next →', false);
    var tried = false;
    _s.max++;
    card.choices.forEach(function (ch) {
      var b = document.createElement('button');
      b.className = 'lml-choice';
      b.textContent = ch;
      b.onclick = function () {
        if (ch === card.answer) {
          if (!tried) _s.score++;
          b.classList.add('lml-choice--right');
          fb.textContent = '✅ Yes!';
          row.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          nextB.disabled = false;
          try { SoundFX.playSuccess(); } catch (e) {}
        } else {
          tried = true;
          b.classList.add('lml-choice--wrong');
          b.disabled = true;
          fb.textContent = 'Try again!';
          try { SoundFX.playWrong(); } catch (e) {}
        }
      };
      row.appendChild(b);
    });
  }

  // ── Card: tap ──────────────────────────────────────────────────
  // Rhythm in note values only ('q q e e | h'); played on one pitch.
  function _tap(card, body, foot) {
    _text(body, card.text);
    var notes = card.rhythm.split('|').map(function (bar) {
      return bar.trim().split(/\s+/).map(function (d) { return 'B4' + d; }).join(' ');
    }).join(' | ');
    var spec = { clef: 'treble', time: card.time, notes: notes };
    var c = _staff(_staffBox(body), spec);
    var fb = document.createElement('div');
    fb.className = 'lml-feedback';
    fb.textContent = 'Press Start, listen to the count-in, then tap any piano key (or the big button).';
    body.appendChild(fb);
    var tapBtn = document.createElement('button');
    tapBtn.className = 'lml-tap';
    tapBtn.textContent = 'TAP';
    body.appendChild(tapBtn);
    var start = document.createElement('button');
    start.className = 'lesson-btn';
    start.textContent = '▶ Start';
    foot.appendChild(start);
    var nextB = _nextBtn(foot, 'Next →', false);
    _s.max++;
    var credited = false;
    if (!c) { nextB.disabled = false; return; }

    var onsets = c.events.map(function (e) { return e.t; });
    var qMs = 60000 / (card.bpm || 80);
    var t0 = 0, taps = [], running = false, timer = null;

    function tap() {
      if (!running) return;
      var t = performance.now() - t0;
      if (t < -300) return;            // tapping along with the count-in
      taps.push(t);
      tapBtn.classList.add('lml-tap--hit');
      setTimeout(function () { tapBtn.classList.remove('lml-tap--hit'); }, 90);
    }
    tapBtn.onpointerdown = function (e) { e.preventDefault(); tap(); };
    _onKey = function () { tap(); };

    function judge() {
      running = false;
      var used = {}, hits = 0;
      onsets.forEach(function (beat) {
        var want = beat * qMs, best = -1, bestD = 1e9;
        taps.forEach(function (t, i) { var d = Math.abs(t - want); if (!used[i] && d < bestD) { bestD = d; best = i; } });
        if (best >= 0 && bestD < 200) { used[best] = true; hits++; }
      });
      var extra = taps.length - Object.keys(used).length;
      var pct = Math.max(0, Math.round(100 * (hits - extra * 0.5) / onsets.length));
      if (pct >= 75) {
        fb.innerHTML = '✅ ' + pct + '% in time — nice rhythm!';
        if (!credited) { _s.score++; credited = true; }
        nextB.disabled = false;
      } else {
        fb.innerHTML = '🥁 ' + pct + '% in time. Listen to the count-in and try again!';
        nextB.disabled = false;   // never trap a kid on a card
      }
      start.disabled = false;
    }

    start.onclick = function () {
      _stopAudio();
      taps = []; start.disabled = true;
      fb.textContent = 'Count-in…';
      AudioEngine.init();
      // Count-in of one bar, then the rhythm itself sounds quietly so they can follow
      _s.player = LMScore.play(c, {
        playNote: function (n, ms) { AudioEngine.playNote(n, ms, 40); },
        tick: function (accent) { AudioEngine.tick(accent); },
      }, {
        bpm: card.bpm || 80, countIn: 1, metronome: true,
        onBeat: function (inBar, down, counting) { if (!counting) fb.textContent = 'Tap!'; },
        onEnd: function () { setTimeout(judge, 250); },
      });
      t0 = performance.now() + _s.player.leadMs;
      running = true;
    };
    _s.cleanup = function () { running = false; if (timer) clearTimeout(timer); };
  }

  // ── Done ───────────────────────────────────────────────────────
  function _finish() {
    var pct = _s.max ? Math.round(100 * _s.score / _s.max) : 100;
    var id = _s.lesson.id;
    var first = !(status(id) || {}).done;
    _save(id, pct);
    if (first && typeof GamificationManager !== 'undefined') GamificationManager.awardNotes(15, 'lesson');
    var body = document.getElementById('lml-body');
    var foot = document.getElementById('lml-foot');
    document.getElementById('lml-keyboard').style.display = 'none';
    document.getElementById('lml-progress-fill').style.width = '100%';
    body.innerHTML = '<div class="lml-done"><div class="lml-done-icon">🎓</div>' +
      '<div class="lml-done-title">Lesson complete!</div>' +
      '<div class="lml-done-sub">' + pct + '% right on the first try' + (first ? ' · +15 🎵' : '') + '</div></div>';
    foot.innerHTML = '';
    var b = document.createElement('button');
    b.className = 'lesson-btn lesson-btn--primary';
    b.textContent = 'Back to the map';
    b.onclick = function () { close(); };
    foot.appendChild(b);
  }

  return { open: open, close: close, status: status, forWorld: forWorld, all: function () { return LM_LESSONS; } };
})();

if (typeof module === 'object' && module.exports) module.exports = { LM_LESSONS: LM_LESSONS };
