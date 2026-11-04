/* ================================================================
   GUITAR JAM — CORE APP & CHORD LIBRARY
   Art lives in js/guitar-jam-art.js, sound in js/guitar-jam-audio.js.

   Saved progress (zs_guitar_<name>) — the original fields keep their
   meaning: chordsLearned[], songsCompleted[{songId,bestStars}],
   earStars, earBestStreak, totalStars (see checkStarMilestones).
   Added later (never read by the star rule):
     chordsBuilt[]      chords built in "Place your fingers"
     songBest{id:{acc,tempo}}  best accuracy per song
     earModes{mode:{best,stars}} best score per ear game
     tempoPct           last tempo the kid picked (percent)
   ================================================================ */

const CHORDS = [
  // PRUNED [2026-06-15]: Removed duplicate Dm (already in intermediate section) to make room for Cmaj7.
  { name: 'Cmaj7', fullName: 'C Major 7', tier: 'advanced', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], funFact: 'Cmaj7 sounds very peaceful and jazzy. It is like a regular C chord but you take off your first finger!' },

  // Beginner
  { name: 'Em', fullName: 'E Minor', tier: 'beginner', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], funFact: 'Em is one of the easiest guitar chords — just two fingers!' },
  { name: 'Am', fullName: 'A Minor', tier: 'beginner', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], funFact: 'Am sounds a bit sad or mysterious. It is used in millions of songs.' },
  { name: 'C',  fullName: 'C Major', tier: 'beginner', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], funFact: 'C Major is a very happy, bright sounding chord.' },
  { name: 'G',  fullName: 'G Major', tier: 'beginner', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], funFact: 'G is often the first chord people learn. It uses all six strings!' },
  // Intermediate
  { name: 'D',  fullName: 'D Major', tier: 'intermediate', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], funFact: 'D Major makes a triangle shape with your fingers.' },
  { name: 'E',  fullName: 'E Major', tier: 'intermediate', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], funFact: 'Move your Am shape up one string, and it becomes an E Major!' },
  { name: 'A',  fullName: 'A Major', tier: 'intermediate', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], funFact: 'Three fingers all squeezed into the same fret!' },
  { name: 'Dm', fullName: 'D Minor', tier: 'intermediate', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], funFact: 'Dm sounds very dramatic, like a storm is coming.' },
  // Advanced
  { name: 'F',  fullName: 'F Major (Barre)', tier: 'advanced', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], funFact: 'Barre chords use one finger to press down multiple strings at once. They take practice!' },
  { name: 'Bm', fullName: 'B Minor (Barre)', tier: 'advanced', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], funFact: 'Bm is another classic barre chord, moved down the neck.' },
  { name: 'B7', fullName: 'B Dominant 7', tier: 'advanced', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], funFact: '7th chords sound "bluesy" or like they want to move somewhere else.' },
  { name: 'G7', fullName: 'G Dominant 7', tier: 'advanced', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], funFact: 'A G chord, but stretched way out to reach the 1st fret!' },
  { name: 'C7', fullName: 'C Dominant 7', tier: 'advanced', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], funFact: 'Add your pinky to a regular C chord to make it a C7.' },
  { name: 'D7', fullName: 'D Dominant 7', tier: 'advanced', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], funFact: 'It looks like a backwards D Major chord.' },
  { name: 'A7', fullName: 'A Dominant 7', tier: 'advanced', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], funFact: 'Like an A Major chord, but with an open G string in the middle.' },
  { name: 'E7', fullName: 'E Dominant 7', tier: 'advanced', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], funFact: 'A very bluesy sounding chord.' },
  // PRUNED [2026-05-18]: Removed 'Am7', 'Fm' to make room for 'A#m' and stay within MAX 26 limit.
  { name: 'A#m', fullName: 'A# Minor', tier: 'expert', frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], funFact: 'A difficult barre chord starting on the first fret.' },

  // Sus & add chords
  { name: 'Dsus4', fullName: 'D Suspended 4', tier: 'intermediate', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], funFact: 'Add your pinky to a D chord and it sounds like it is waiting to resolve back to D.' },
  { name: 'Asus2', fullName: 'A Suspended 2', tier: 'intermediate', frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], funFact: 'Lift one finger off an A chord and it becomes Asus2 — open and dreamy.' },
  { name: 'Cadd9', fullName: 'C add 9', tier: 'intermediate', frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], funFact: 'A sparkly version of C that rock and folk players love.' },
  // 7th chords (minor 7ths)
  { name: 'Am7', fullName: 'A Minor 7', tier: 'intermediate', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], funFact: 'Just lift one finger off an Am chord — easy and smooth sounding.' },
  { name: 'Dm7', fullName: 'D Minor 7', tier: 'intermediate', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], funFact: 'A soft, mellow chord that sounds great in slow songs.' },
  { name: 'Em7', fullName: 'E Minor 7', tier: 'beginner', frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0], funFact: 'An easy upgrade from Em — just add one finger on the B string.' },
  // Barre chords
  { name: 'Bb', fullName: 'B Flat Major (Barre)', tier: 'advanced', frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], funFact: 'A barre chord on the first fret — the same shape as A moved up.' },
  { name: 'F#m', fullName: 'F# Minor (Barre)', tier: 'expert', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], funFact: 'An Em barre shape moved up to the second fret. Strong and moody!' }
];

// Progression durations are in beats. `meter` is [beats per bar,
// steps per beat] (default [4, 2] = 4/4 counted in eighths; [3, 2] = 3/4;
// [2, 3] = 6/8 counted in dotted quarters). `strum` overrides the strum
// pattern for older players (D = down, U = up, - = rest, one char per step).
// `retired` songs stay listed here so saved progress and the Parents
// Corner catalog keep their ids and order, but are no longer offered.
// Keep ids and order: tools/build-progress-catalog.js reads this array.
const SONGS = [
  // PRUNED [2026-06-15]: Removed duplicate lalabamba (already in intermediate) to make room for Clementine.
  { id: 'clementine', title: 'Oh My Clementine', tier: 'beginner', bpm: 100, meter: [3, 2], progression: [['D', 6], ['D', 6], ['A', 6], ['D', 6]] },

  { id: 'twinkle', title: 'Twinkle Twinkle', tier: 'beginner', bpm: 90, progression: [['C', 4], ['G', 4], ['Am', 4], ['Em', 4], ['C', 4], ['G', 4], ['C', 8]] },
  { id: 'birthday', title: 'Happy Birthday', tier: 'beginner', bpm: 100, progression: [['G', 4], ['G', 4], ['G', 4], ['C', 4], ['C', 4], ['Am', 4], ['G', 4], ['G', 4], ['C', 8]] },
  { id: 'jingle', title: 'Jingle Bells', tier: 'beginner', bpm: 120, progression: [['G', 8], ['G', 8], ['C', 4], ['G', 4], ['Am', 4], ['Em', 4], ['G', 8], ['G', 8], ['C', 4], ['G', 4], ['Em', 4], ['G', 8]] },
  { id: 'labamba', title: 'La Bamba', tier: 'intermediate', bpm: 130, strum: 'D-DU-UDU', progression: [['C', 2], ['F', 2], ['G', 4], ['C', 2], ['F', 2], ['G', 4], ['C', 2], ['F', 2], ['G', 4], ['C', 2], ['F', 2], ['G', 4]] },
  { id: 'ode', title: 'Ode to Joy', tier: 'intermediate', bpm: 100, progression: [['G', 4], ['G', 4], ['D', 4], ['D', 4], ['Em', 4], ['Em', 4], ['C', 4], ['C', 4], ['G', 4], ['D', 4], ['G', 8]] },
  { id: 'stand', title: 'Stand By Me', tier: 'intermediate', bpm: 110, progression: [['G', 8], ['Em', 8], ['C', 4], ['D', 4], ['G', 8]] },
  { id: 'house', title: 'House of the Rising Sun', tier: 'advanced', bpm: 80, progression: [['Am', 4], ['C', 4], ['D', 4], ['F', 4], ['Am', 4], ['C', 4], ['E', 8]] },
  { id: 'scarborough', title: 'Scarborough Fair', tier: 'advanced', bpm: 90, progression: [['Am', 8], ['Am', 4], ['G', 4], ['Am', 4], ['G', 4], ['C', 4], ['D', 4], ['F', 4], ['Am', 8]] },
  { id: 'amazing', title: 'Amazing Grace', tier: 'intermediate', bpm: 100, meter: [3, 2], progression: [['G', 6], ['G', 6], ['C', 6], ['G', 6], ['G', 6], ['G', 6], ['D', 12]] },
  // PRUNED [2026-05-18]: Removed 'valerie', 'letitbe' to make room for 'twinkle2' and stay within MAX 18 limit.
  { id: 'hallelujah', title: 'Hallelujah', tier: 'intermediate', bpm: 60, progression: [['C', 6], ['Am', 6], ['C', 6], ['Am', 6], ['F', 6], ['G', 6], ['C', 6], ['G', 6]] },
  { id: 'twinkle2', title: 'Twinkle in G', tier: 'beginner', bpm: 90, progression: [['G', 4], ['D', 4], ['Em', 4], ['C', 4], ['G', 4], ['D', 4], ['G', 8]] },
  { id: 'downinvalley', title: 'Down in the Valley', tier: 'beginner', bpm: 90, meter: [3, 2], progression: [['G', 12], ['D7', 12], ['D7', 12], ['G', 12]] },
  { id: 'ohsusanna', title: 'Oh Susanna', tier: 'beginner', bpm: 120, progression: [['G', 4], ['G', 2], ['D7', 2], ['G', 4], ['C', 2], ['G', 2], ['G', 4], ['D7', 4], ['G', 4], ['D7', 4], ['G', 4]] },
  { id: 'saints', title: 'When the Saints Go Marching In', tier: 'beginner', bpm: 110, progression: [['G', 12], ['G', 4], ['D7', 8], ['D7', 12], ['G', 8], ['G', 4], ['C', 8], ['G', 4], ['D7', 4], ['G', 8]] },
  { id: 'auldlang', title: 'Auld Lang Syne', tier: 'intermediate', bpm: 90, progression: [['G', 4], ['C', 4], ['G', 4], ['D7', 4], ['G', 4], ['C', 4], ['G', 4], ['D7', 4], ['G', 8]] },
  { id: 'redriver', title: 'Red River Valley', tier: 'intermediate', bpm: 100, progression: [['G', 8], ['C', 8], ['G', 8], ['D7', 8], ['G', 8], ['C', 4], ['D7', 4], ['G', 8]] },
  { id: 'greensleeves', title: 'Greensleeves', tier: 'advanced', bpm: 90, progression: [['Am', 4], ['C', 4], ['G', 4], ['Em', 4], ['Am', 4], ['E', 4], ['Am', 4], ['C', 4], ['G', 4], ['Em', 4], ['Am', 2], ['E', 2], ['Am', 4]] },
  // Traditional tunes. Chord charts only — no lyrics. Each chord name
  // is already in CHORDS. Beginner charts stay on C and G.
  { id: 'rowboat', title: 'Row, Row, Row Your Boat', tier: 'beginner', bpm: 110, progression: [['C', 4], ['C', 4], ['C', 4], ['G', 4], ['C', 8]] },
  { id: 'frere', title: 'Frère Jacques', tier: 'beginner', bpm: 100, progression: [['C', 4], ['C', 4], ['G', 4], ['C', 8], ['C', 4], ['C', 4], ['G', 4], ['C', 8]] },
  { id: 'mountain', title: "She'll Be Coming Round the Mountain", tier: 'intermediate', bpm: 120, progression: [['G', 8], ['G', 8], ['D', 8], ['G', 8], ['G', 4], ['G', 4], ['D', 4], ['G', 8]] },
  // Added 2026-11: more traditional / public-domain tunes (simple I–IV–V
  // accompaniments, chord charts only, no lyrics).
  { id: 'arrozconleche', title: 'Arroz con leche', origin: 'Tradicional · canción infantil', tier: 'beginner', bpm: 66, meter: [2, 3], progression: [['C', 4], ['G7', 4], ['G7', 4], ['C', 4], ['C', 4], ['G7', 4], ['G7', 4], ['C', 4]] },
  { id: 'mambru', title: 'Mambrú se fue a la guerra', origin: 'Tradicional · canción infantil', tier: 'beginner', bpm: 66, meter: [2, 3], progression: [['C', 4], ['G7', 4], ['C', 4], ['G7', 2], ['C', 2], ['C', 4], ['G7', 4], ['C', 4], ['G7', 2], ['C', 2]] },
  { id: 'oldmacdonald', title: 'Old MacDonald Had a Farm', origin: 'Traditional', tier: 'beginner', bpm: 110, progression: [['G', 4], ['C', 2], ['G', 2], ['D', 2], ['D', 2], ['G', 4], ['G', 4], ['C', 2], ['G', 2], ['D', 2], ['D', 2], ['G', 4]] },
  { id: 'michaelrow', title: 'Michael, Row the Boat Ashore', origin: 'Traditional spiritual', tier: 'intermediate', bpm: 100, progression: [['G', 8], ['C', 4], ['G', 4], ['G', 8], ['D7', 4], ['G', 4]] },
  { id: 'silentnight', title: 'Noche de paz (Silent Night)', origin: 'Franz Xaver Gruber, 1818', tier: 'intermediate', bpm: 84, meter: [3, 2], progression: [['C', 12], ['G7', 6], ['C', 6], ['F', 6], ['C', 6], ['F', 6], ['C', 6], ['G7', 6], ['C', 6], ['G7', 6], ['C', 6]] },
  { id: 'cueca', title: 'Cueca — ritmo en 6/8', origin: 'Danza nacional de Chile', tier: 'advanced', bpm: 72, meter: [2, 3], strum: 'D-UD-U', progression: [['G', 4], ['D7', 4], ['D7', 4], ['G', 4], ['G', 4], ['C', 4], ['D7', 4], ['G', 4]] }
];

const GuitarJam = (() => {
  'use strict';

  const TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];
  const TIER_COLOR = { beginner: '#059669', intermediate: '#2563EB', advanced: '#C2410C', expert: '#6D28D9' };
  const TIER_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const tier = () => (typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate');
  const tierIdx = () => Math.max(0, TIERS.indexOf(tier()));
  const chordByName = (n) => CHORDS.find(c => c.name === n);
  const A = GJAudio;

  // Unlock audio on the first gesture (iOS needs a sound in a gesture).
  function _warmupAudio() {
    A.unlock();
    document.removeEventListener('click', _warmupAudio);
    document.removeEventListener('touchstart', _warmupAudio);
    document.removeEventListener('touchend', _warmupAudio);
    document.removeEventListener('pointerdown', _warmupAudio);
  }
  document.addEventListener('click', _warmupAudio, { once: true });
  document.addEventListener('touchstart', _warmupAudio, { once: true });
  document.addEventListener('touchend', _warmupAudio, { once: true });
  document.addEventListener('pointerdown', _warmupAudio, { once: true });

  // ── State & Progress ──────────────────────────────────────────
  const DEFAULTS = () => ({ chordsLearned: [], totalStars: 0, songsCompleted: [], earBestStreak: 0, earStars: 0 });

  function getUserKey() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('zs_guitar_') : null;
  }

  function getProgress() {
    const k = getUserKey();
    if (!k) return DEFAULTS();
    try {
      const p = JSON.parse(localStorage.getItem(k)) || DEFAULTS();
      if (!Array.isArray(p.chordsLearned)) p.chordsLearned = [];
      if (!Array.isArray(p.songsCompleted)) p.songsCompleted = [];
      if (typeof p.totalStars !== 'number') p.totalStars = Number(p.totalStars) || 0;
      if (!p.earStars) p.earStars = 0;
      if (!p.earBestStreak) p.earBestStreak = 0;
      return p;
    } catch (e) { return DEFAULTS(); }
  }

  function saveProgress(data) {
    const k = getUserKey();
    if (!k) return;
    const p = getProgress();
    Object.assign(p, data);
    try { localStorage.setItem(k, JSON.stringify(p)); } catch (e) { /* storage full */ }
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }

  // Star rule — unchanged: 1 per 5 chords (max 2), 1 per 2 aced songs
  // (max 4), 1 for acing ear training. totalStars only ever goes up.
  function checkStarMilestones() {
    const p = getProgress();
    const learnedCount = p.chordsLearned.length;
    const songStars3Count = p.songsCompleted.filter(s => s.bestStars === 3).length;
    const earStars = p.earStars || 0;

    const chordStars = Math.min(2, Math.floor(learnedCount / 5));
    const playStars = Math.min(4, Math.floor(songStars3Count / 2));
    const listenStars = earStars === 3 ? 1 : 0;

    const totalCalculated = chordStars + playStars + listenStars;

    if (totalCalculated > p.totalStars) {
      saveProgress({ totalStars: totalCalculated });
      if (typeof SFX !== 'undefined') setTimeout(() => SFX.cheer(), 500);
      showFeedback('star');
      const sc = $('zs-star-count');
      if (sc && typeof getTotalStars === 'function') sc.textContent = '⭐ ' + getTotalStars();
    }
  }

  function showFeedback(kind) {
    const el = $('feedback');
    if (!el) return;
    el.querySelector('span').innerHTML = kind === 'star' ? GJArt.star(true, 90) : esc(kind);
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1200);
  }

  let toastTimer = 0;
  function toast(html, kind) {
    const el = $('gj-toast');
    if (!el) return;
    el.innerHTML = html;
    el.className = 'gj-toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'gj-toast'; }, 1800);
  }

  // Play a chord on a guitar view: sound + vibrating strings.
  function playOn(guitar, frets, dir, opts) {
    opts = opts || {};
    const sched = A.strum(frets, Object.assign({ dir }, opts));
    if (guitar) sched.forEach(n => guitar.vibrate(n.string, n.vel, n.when, frets[n.string]));
    return sched;
  }
  function pluckOn(guitar, string, fret, vel, when) {
    const t = A.pluck(string, fret, { vel: vel || 0.8, when });
    if (guitar && t != null) guitar.vibrate(string, vel || 0.8, t, fret);
    return t;
  }

  function fillIcons(root) {
    (root || document).querySelectorAll('[data-ico]').forEach(el => {
      if (!el.firstChild) el.innerHTML = GJArt.icon(el.dataset.ico, el.classList.contains('tab-ico') ? 24 : 20);
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  LEARN
  // ════════════════════════════════════════════════════════════════
  let learnGuitar = null;
  let activeChord = null;
  let learnMode = 'look';
  let build = null;

  function visibleChords() {
    const max = tierIdx();
    const v = CHORDS.filter(c => TIERS.indexOf(c.tier) <= max);
    return v.length ? v : CHORDS;
  }

  function ensureLearnGuitar() {
    if (learnGuitar) return learnGuitar;
    learnGuitar = new GJArt.Guitar($('learn-guitar'), { clock: () => A.now(), minFretPx: 34, vFretPx: 52 });
    learnGuitar
      .on('strumString', (i, vel, dir) => {
        const fr = learnGuitar.frets()[i];
        if (fr >= 0) pluckOn(learnGuitar, i, fr, vel);
      })
      .on('pluck', (i) => {
        const fr = learnGuitar.frets()[i];
        if (fr >= 0) pluckOn(learnGuitar, i, fr, 0.8);
        else toast('That string is muted (X) in this chord.');
      })
      .on('fretTap', (s, f) => onFretTap(s, f))
      .on('nutTap', (s) => onNutTap(s))
      .on('bodyTap', () => { if (activeChord) playOn(learnGuitar, learnGuitar.frets(), 'down'); });
    return learnGuitar;
  }

  function initLearn() {
    // Auto-pull sync
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      const u = getActiveUser();
      if (u) CloudSync.pull('zs_guitar_' + u.name.toLowerCase().replace(/\s+/g, '_'));
    }
    ensureLearnGuitar();
    renderChordList();
    const vis = visibleChords();
    const keep = activeChord && vis.includes(activeChord) ? activeChord.name : vis[0].name;
    selectChord(keep);

    $('strum-down').onclick = () => { if (activeChord) playOn(learnGuitar, learnGuitar.frets(), 'down'); };
    $('strum-up').onclick = () => { if (activeChord) playOn(learnGuitar, learnGuitar.frets(), 'up', { full: true }); };
    $('arp-btn').onclick = arpeggio;
    $('mode-look').onclick = () => setLearnMode('look');
    $('mode-build').onclick = () => setLearnMode('build');
    $('build-check').onclick = checkBuild;
    $('build-hint').onclick = buildHint;
    $('build-clear').onclick = () => { if (build) startBuild(build.chord); };
    $('build-next').onclick = nextBuildChord;
    $('peek-btn').onclick = () => {
      const box = $('chord-box');
      box.classList.remove('hidden-box');
      if (build) build.peeks++;
      setTimeout(() => { if (learnMode === 'build' && tier() === 'expert' && build && !build.done) box.classList.add('hidden-box'); }, 2000);
    };
  }

  function renderChordList() {
    const listEl = $('chord-list');
    if (!listEl) return;
    const p = getProgress();
    const built = p.chordsBuilt || [];
    const vis = visibleChords();
    const groups = TIERS.filter(t => vis.some(c => c.tier === t));
    listEl.innerHTML = groups.map(t => {
      const cs = vis.filter(c => c.tier === t);
      return '<div class="chord-group"><div class="chord-group-label" style="--tc:' + TIER_COLOR[t] + '">' + TIER_LABEL[t] + '</div><div class="chord-group-btns">' +
        cs.map(c => {
          const viewed = p.chordsLearned.includes(c.name) ? ' viewed' : '';
          const b = built.includes(c.name) ? '<span class="chord-built" aria-label="built">✓</span>' : '';
          return '<button type="button" class="chord-btn' + viewed + '" style="--tc:' + TIER_COLOR[t] + '" data-chord="' + esc(c.name) + '">' + esc(c.name) + b + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    listEl.querySelectorAll('.chord-btn').forEach(b => { b.onclick = () => selectChord(b.dataset.chord); });
    $('chord-count').textContent = p.chordsLearned.filter(n => chordByName(n)).length + ' / ' + CHORDS.length + ' seen';
  }

  function selectChord(name) {
    activeChord = chordByName(name);
    if (!activeChord) return;
    ensureLearnGuitar();

    document.querySelectorAll('.chord-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.chord === name);
      b.setAttribute('aria-pressed', b.dataset.chord === name ? 'true' : 'false');
    });

    $('chord-name').textContent = activeChord.name;
    $('chord-full').textContent = activeChord.fullName;
    $('chord-fact').textContent = activeChord.funFact;
    $('chord-box').innerHTML = GJArt.chordBox(activeChord);
    renderNotes(activeChord);
    renderLegend(activeChord);
    $('learn-guitar').setAttribute('aria-label', activeChord.fullName + ' on the guitar neck');

    if (learnMode === 'build') startBuild(activeChord);
    else { learnGuitar.setPlaced(null); learnGuitar.setMarkers(null); learnGuitar.setGhost(null); learnGuitar.setChord(activeChord); }
    A.prewarm([activeChord.frets]);

    const p = getProgress();
    if (!p.chordsLearned.includes(name)) {
      p.chordsLearned.push(name);
      saveProgress({ chordsLearned: p.chordsLearned });
      if (typeof SFX !== 'undefined') SFX.correct();

      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('Guitar Jam', '🎸', `Learned the ${name} chord`);
      }

      checkStarMilestones();

      const btn = document.querySelector(`.chord-btn[data-chord="${CSS.escape(name)}"]`);
      if (btn) btn.classList.add('viewed');
      $('chord-count').textContent = getProgress().chordsLearned.filter(n => chordByName(n)).length + ' / ' + CHORDS.length + ' seen';
    }
  }

  function renderNotes(chord) {
    const row = $('note-row');
    row.innerHTML = '<span class="gj-notes-label">Notes</span>' + chord.frets.map((f, s) =>
      '<span class="gj-note' + (f < 0 ? ' muted' : '') + '" data-s="' + s + '">' + (f < 0 ? '×' : A.noteName(s, f)) + '</span>').join('');
  }

  function renderLegend(chord) {
    const used = Array.from(new Set(chord.fingers.filter(f => f > 0))).sort();
    const names = { 1: 'index', 2: 'middle', 3: 'ring', 4: 'pinky' };
    const barre = GJArt.findBarre(chord);
    $('finger-legend').innerHTML = used.map(f =>
      '<span class="gj-leg"><i style="background:' + GJArt.FINGER_COL[f] + '">' + f + '</i>' + names[f] + '</span>').join('') +
      (barre ? '<span class="gj-leg barre">Barre: finger 1 lies flat across ' + (barre.to - barre.from + 1) + ' strings</span>' : '') +
      '<span class="gj-leg"><b class="o">O</b> play open</span><span class="gj-leg"><b class="x">X</b> don\'t play</span>';
  }

  function arpeggio() {
    if (!activeChord) return;
    const fr = learnGuitar.frets();
    const t0 = A.now() + 0.05;
    let k = 0;
    const notes = document.querySelectorAll('#note-row .gj-note');
    fr.forEach((f, s) => {
      if (f < 0) return;
      const when = t0 + k * 0.34;
      pluckOn(learnGuitar, s, f, 0.75, when);
      setTimeout(() => {
        notes.forEach(n => n.classList.toggle('lit', Number(n.dataset.s) === s));
      }, (when - A.now()) * 1000);
      k++;
    });
    setTimeout(() => notes.forEach(n => n.classList.remove('lit')), k * 340 + 400);
  }

  function onFretTap(s, f) {
    if (learnMode === 'build') { buildTap(s, f); return; }
    pluckOn(learnGuitar, s, f, 0.8);
    const name = A.noteName(s, f);
    learnGuitar.setHighlight({ string: s, fret: f, label: name });
    clearTimeout(onFretTap._t);
    onFretTap._t = setTimeout(() => learnGuitar.setHighlight(null), 700);
    toast('<b>' + GJArt.STRING_NAMES[s] + ' string</b>, fret ' + f + ' = <b>' + name + '</b>');
  }

  function onNutTap(s) {
    if (learnMode === 'build' && build && build.needMarks) {
      build.marks[s] = build.marks[s] === 'x' ? 'o' : 'x';
      if (build.marks[s] === 'x') build.placed = build.placed.filter(p => p.string !== s);
      learnGuitar.setMarkers(build.marks.slice());
      learnGuitar.setPlaced(build.placed.slice());
      clearMarks();
      return;
    }
    pluckOn(learnGuitar, s, 0, 0.8);
    toast('<b>' + GJArt.STRING_NAMES[s] + ' string</b>, open = <b>' + A.noteName(s, 0) + '</b>');
  }

  // ── Place your fingers ─────────────────────────────────────────
  function setLearnMode(m) {
    learnMode = m;
    $('mode-look').classList.toggle('on', m === 'look');
    $('mode-build').classList.toggle('on', m === 'build');
    $('mode-look').setAttribute('aria-pressed', m === 'look');
    $('mode-build').setAttribute('aria-pressed', m === 'build');
    $('learn-actions').hidden = m === 'build';
    $('build-panel').hidden = m !== 'build';
    $('chord-box').classList.remove('hidden-box');
    $('peek-btn').hidden = true;
    if (m === 'build') startBuild(activeChord);
    else {
      build = null;
      learnGuitar.setPlaced(null); learnGuitar.setMarkers(null); learnGuitar.setGhost(null);
      learnGuitar.setChord(activeChord);
      $('learn-hint').textContent = 'Swipe across the strings over the sound hole to strum. Tap a fret to hear one note.';
    }
  }

  function startBuild(chord) {
    const t = tier();
    build = {
      chord, placed: [], done: false, mistakes: 0, peeks: 0, hints: 0,
      ghost: t === 'beginner',
      instant: t === 'beginner' || t === 'intermediate',
      needMarks: t === 'advanced' || t === 'expert',
      marks: chord.frets.map(() => 'o')
    };
    learnGuitar.setChord(null);
    learnGuitar.setGhost(build.ghost ? chord : null);
    learnGuitar.setMarkers(build.needMarks ? build.marks.slice() : chord.frets.map(f => f < 0 ? 'x' : (f === 0 ? 'o' : null)));
    learnGuitar.setPlaced([]);
    $('build-next').hidden = true;
    $('build-check').hidden = build.instant;
    const box = $('chord-box');
    box.classList.toggle('hidden-box', t === 'expert');
    $('peek-btn').hidden = t !== 'expert';
    const need = chord.frets.filter(f => f > 0).length;
    let txt = '<b>Build ' + esc(chord.name) + '.</b> ';
    if (t === 'beginner') txt += 'Tap each glowing circle to put a finger there.';
    else if (t === 'intermediate') txt += 'Look at the chord box and tap the ' + need + ' frets where your fingers go.';
    else if (t === 'advanced') txt += 'Tap the ' + need + ' frets, and tap the strip by the nut to mark strings you don\'t play (X). Then press Check.';
    else txt += 'From memory! Tap the frets, mark muted strings (X) by the nut, then Check. Peek if you need to.';
    $('build-prompt').innerHTML = txt;
    $('learn-hint').textContent = build.needMarks ? 'Tap the dark strip next to the nut to switch a string between O (open) and X (muted).' : 'Tap between the frets — fingers go just behind the metal fret wire.';
    renderBuildScore();
  }

  function renderBuildScore() {
    const p = getProgress();
    const built = (p.chordsBuilt || []).filter(n => visibleChords().some(c => c.name === n)).length;
    $('build-score').innerHTML = 'Chords built: <b>' + built + '</b> / ' + visibleChords().length;
  }

  function clearMarks() {
    if (!build) return;
    build.placed.forEach(p => { if (p.state === 'bad') p.state = null; });
  }

  function buildTap(s, f) {
    if (!build || build.done) return;
    const ch = build.chord;
    const existing = build.placed.find(p => p.string === s);
    if (existing && existing.fret === f) {
      build.placed = build.placed.filter(p => p !== existing);
      learnGuitar.setPlaced(build.placed.slice());
      return;
    }
    build.placed = build.placed.filter(p => p.string !== s);
    if (build.needMarks && build.marks[s] === 'x') { build.marks[s] = 'o'; learnGuitar.setMarkers(build.marks.slice()); }
    pluckOn(learnGuitar, s, f, 0.75);
    const right = ch.frets[s] === f;
    if (build.instant) {
      if (right) {
        build.placed.push({ string: s, fret: f, state: 'good', label: String(ch.fingers[s] || '') });
        learnGuitar.ring(s, f, '#10B981');
      } else {
        build.mistakes++;
        const p = { string: s, fret: f, state: 'bad' };
        build.placed.push(p);
        learnGuitar.ring(s, f, '#EF4444');
        let why = 'Not there.';
        if (ch.frets[s] < 0) why = 'The ' + GJArt.STRING_NAMES[s] + ' string isn\'t played in ' + ch.name + '.';
        else if (ch.frets[s] === 0) why = 'The ' + GJArt.STRING_NAMES[s] + ' string is played open in ' + ch.name + ' — no finger.';
        else why = 'Right string? Try fret ' + (ch.frets[s] > f ? 'further from' : 'closer to') + ' the nut.';
        toast(why, 'warn');
        setTimeout(() => {
          if (!build) return;
          build.placed = build.placed.filter(q => q !== p);
          learnGuitar.setPlaced(build.placed.slice());
        }, 650);
      }
      learnGuitar.setPlaced(build.placed.slice());
      const need = ch.frets.map((fr, i) => fr > 0 ? i : -1).filter(i => i >= 0);
      if (need.every(i => build.placed.some(p => p.string === i && p.state === 'good'))) setTimeout(buildSuccess, 350);
    } else {
      build.placed.push({ string: s, fret: f, state: null });
      learnGuitar.setPlaced(build.placed.slice());
    }
  }

  function checkBuild() {
    if (!build || build.done) return;
    const ch = build.chord;
    let wrong = 0;
    for (let s = 0; s < 6; s++) {
      const p = build.placed.find(q => q.string === s);
      const got = p ? p.fret : (build.marks[s] === 'x' ? -1 : 0);
      const ok = got === ch.frets[s];
      if (p) p.state = ok ? 'good' : 'bad';
      if (!ok) wrong++;
    }
    learnGuitar.setPlaced(build.placed.slice());
    if (wrong === 0) { buildSuccess(); return; }
    build.mistakes++;
    if (typeof SFX !== 'undefined') SFX.wrong();
    const mutedWrong = ch.frets.some((f, s) => (f < 0) !== (build.marks[s] === 'x'));
    toast(wrong + ' string' + (wrong > 1 ? 's need' : ' needs') + ' fixing.' + (mutedWrong ? ' Check the O / X marks too.' : ''), 'warn');
    playOn(learnGuitar, learnGuitar.frets(), 'down', { vel: 0.6 });
  }

  function buildHint() {
    if (!build || build.done) return;
    build.hints++;
    learnGuitar.setGhost(build.chord);
    if (build.needMarks) learnGuitar.setMarkers(build.chord.frets.map(f => f < 0 ? 'x' : (f === 0 ? 'o' : null)));
    setTimeout(() => {
      if (!build || build.done) return;
      learnGuitar.setGhost(build.ghost ? build.chord : null);
      if (build.needMarks) learnGuitar.setMarkers(build.marks.slice());
    }, 1600);
  }

  function buildSuccess() {
    if (!build || build.done) return;
    build.done = true;
    const ch = build.chord;
    learnGuitar.setPlaced(null); learnGuitar.setGhost(null); learnGuitar.setMarkers(null);
    learnGuitar.setChord(ch);
    playOn(learnGuitar, ch.frets, 'down');
    $('chord-box').classList.remove('hidden-box');
    const clean = build.mistakes === 0 && build.hints === 0 && build.peeks === 0;
    toast((clean ? 'Perfect! ' : 'You did it! ') + 'That\'s <b>' + esc(ch.name) + '</b>.', 'good');
    if (typeof SFX !== 'undefined') SFX.correct();
    const p = getProgress();
    const built = Array.isArray(p.chordsBuilt) ? p.chordsBuilt : [];
    if (!built.includes(ch.name)) {
      built.push(ch.name);
      saveProgress({ chordsBuilt: built });
      if (typeof ActivityLog !== 'undefined') ActivityLog.log('Guitar Jam', '🎸', `Built the ${ch.name} chord on the neck`);
      const btn = document.querySelector(`.chord-btn[data-chord="${CSS.escape(ch.name)}"]`);
      if (btn && !btn.querySelector('.chord-built')) btn.insertAdjacentHTML('beforeend', '<span class="chord-built" aria-label="built">✓</span>');
    }
    $('build-prompt').innerHTML = '<b>' + esc(ch.name) + ' built!</b> Swipe over the sound hole to strum it.';
    $('build-next').hidden = false;
    $('build-check').hidden = true;
    renderBuildScore();
  }

  function nextBuildChord() {
    const vis = visibleChords();
    const built = getProgress().chordsBuilt || [];
    const i = vis.indexOf(activeChord);
    let next = null;
    for (let k = 1; k <= vis.length; k++) {
      const c = vis[(i + k) % vis.length];
      if (!built.includes(c.name)) { next = c; break; }
    }
    selectChord((next || vis[(i + 1) % vis.length]).name);
  }

  // ════════════════════════════════════════════════════════════════
  //  PLAY
  // ════════════════════════════════════════════════════════════════
  const PATTERNS = {
    '4,2': { intermediate: 'D-D-D-D-', advanced: 'D-D-DUDU', expert: 'D-DU-UDU' },
    '3,2': { intermediate: 'D-D-D-', advanced: 'D-DUDU', expert: 'D-DUDU' },
    '2,3': { intermediate: 'D--D--', advanced: 'D-UD-U', expert: 'D-UD-U' }
  };
  const TEMPOS = [60, 70, 80, 90, 100, 110, 120];
  // seconds: [perfect, good] half-widths
  const WINDOWS = { intermediate: [0.09, 0.2], advanced: [0.075, 0.16], expert: [0.06, 0.13] };

  let game = null;
  let gameGuitar = null;
  let lane = null;
  let metroEnabled = true;
  let currentSong = null;

  function visibleSongs() {
    const max = tierIdx();
    return SONGS.filter(s => !s.retired && TIERS.indexOf(s.tier) <= max);
  }

  function meterOf(song) { return song.meter || [4, 2]; }
  function meterLabel(song) { const m = meterOf(song); return m[1] === 3 ? (m[0] * 3) + '/8' : m[0] + '/4'; }

  function patternFor(song, t) {
    if (t === 'beginner') return null;
    const m = meterOf(song);
    const base = PATTERNS[m.join(',')] || PATTERNS['4,2'];
    if ((t === 'advanced' || t === 'expert') && song.strum && song.strum.length === m[0] * m[1]) return song.strum;
    return base[t];
  }

  function patternHTML(pat, sub) {
    if (!pat) return '';
    return pat.split('').map((c, i) => {
      const beatStart = i % sub === 0;
      const lbl = beatStart ? String(i / sub + 1) : (sub === 2 ? '&' : '·');
      const arrow = c === 'D' ? GJArt.icon('down', 18) : c === 'U' ? GJArt.icon('up', 18) : '<span class="rest"></span>';
      return '<span class="pg-step' + (beatStart ? ' beat' : '') + (c === '-' ? ' off' : '') + '">' + arrow + '<small>' + lbl + '</small></span>';
    }).join('');
  }

  function initPlay() {
    const listEl = $('song-list');
    if (!listEl) return;
    const p = getProgress();
    const best = p.songBest || {};
    listEl.innerHTML = visibleSongs().map(s => {
      const completed = p.songsCompleted.find(sc => sc.songId === s.id);
      const stars = completed ? completed.bestStars : 0;
      const uniqueChords = Array.from(new Set(s.progression.map(x => x[0])));
      const acc = best[s.id] ? best[s.id].acc + '% best' : '';
      return '<button type="button" class="song-card" data-song="' + esc(s.id) + '" style="--tc:' + TIER_COLOR[s.tier] + '">' +
        '<span class="song-band">' + GJArt.pick(TIER_COLOR[s.tier], 30) + '<span>' + TIER_LABEL[s.tier] + '</span></span>' +
        '<span class="song-title">' + esc(s.title) + '</span>' +
        (s.origin ? '<span class="song-origin">' + esc(s.origin) + '</span>' : '') +
        '<span class="song-meta">' + meterLabel(s) + ' · ' + s.bpm + ' BPM</span>' +
        '<span class="song-chords">' + uniqueChords.map(c => '<span class="chord-mini">' + esc(c) + '</span>').join('') + '</span>' +
        '<span class="song-foot">' + GJArt.stars(stars, 3, 20) + '<span class="song-acc">' + acc + '</span></span>' +
        '</button>';
    }).join('');
    listEl.querySelectorAll('.song-card').forEach(b => { b.onclick = () => startSong(b.dataset.song); });
  }

  function ensureGameViews() {
    if (!gameGuitar) {
      gameGuitar = new GJArt.Guitar($('game-guitar'), {
        orient: 'h', tapStrum: true, minFretPx: 30, maxFret: 7, clock: () => A.now(),
        hHeight: (W) => Math.max(150, Math.min(W * 0.26, 230))
      });
      gameGuitar.on('strum', (dir, vel, ts) => handleStrum(dir, ts));
    }
    if (!lane) lane = new GJArt.Lane($('chord-lane'));
  }

  function startSong(id) {
    currentSong = SONGS.find(s => s.id === id);
    if (!currentSong) return;
    stopGame();
    $('song-select-screen').hidden = true;
    $('results-screen').hidden = true;
    $('gameplay-screen').hidden = false;
    ensureGameViews();
    gameGuitar.resize(); lane.resize();

    const t = tier();
    const p = getProgress();
    let tempo = p.tempoPct || (t === 'beginner' ? 80 : 100);
    if (!TEMPOS.includes(tempo)) tempo = 100;
    const m = meterOf(currentSong);
    const segs = [];
    let b = 0;
    currentSong.progression.forEach(([name, beats]) => { segs.push({ name, start: b, beats }); b += beats; });
    game = {
      song: currentSong, tier: t, segs, totalBeats: b, bpb: m[0], sub: m[1], tempo,
      pattern: patternFor(currentSong, t), running: false, raf: 0
    };
    buildTargets();

    $('game-song-title').textContent = currentSong.title;
    $('game-song-meta').textContent = meterLabel(currentSong) + ' · ' + currentSong.bpm + ' BPM' + (currentSong.origin ? ' · ' + currentSong.origin : '');
    $('tempo-val').textContent = tempo + '%';
    $('pattern-guide').innerHTML = game.pattern ? '<span class="pg-label">Strum</span>' + patternHTML(game.pattern, game.sub) :
      '<span class="pg-label">Strum once each time a new chord reaches the gold line</span>';
    $('up-strum-btn').hidden = !(game.pattern && game.pattern.includes('U'));
    $('big-strum-label').textContent = $('up-strum-btn').hidden ? 'STRUM' : 'DOWN';
    const first = chordByName(segs[0].name);
    gameGuitar.setChord(first);
    gameGuitar.setGhost(null);
    $('game-chord-name').textContent = segs[0].name;
    $('lane-judge').textContent = ''; $('lane-combo').textContent = '';
    lane.render(laneState(-game.bpb));

    const readyT = $('ready-title'), readyX = $('ready-text');
    readyT.textContent = currentSong.title;
    let how;
    if (t === 'beginner') how = 'Strum when a new chord reaches the gold line. Tap STRUM or tap the guitar.';
    else if (game.pattern.includes('U')) how = 'Follow the arrows: DOWN and UP. Tap the guitar near the top string for a down-strum, near the bottom for an up-strum — or use the buttons. Keyboard: ↓ and ↑.';
    else how = 'Strum on every arrow, right on the beat. Tap STRUM, tap the guitar, or press Space.';
    readyX.textContent = how + ' You\'ll hear ' + countInBeats() + ' clicks first.';
    $('game-ready').hidden = false;
    $('game-ready').style.top = ($('gameplay-screen').querySelector('.game-header').offsetHeight + 8) + 'px';
    $('start-song').onclick = beginSong;
    $('tempo-down').onclick = () => changeTempo(-1);
    $('tempo-up').onclick = () => changeTempo(1);
    $('metro-toggle').onclick = (e) => {
      metroEnabled = !metroEnabled;
      const btn = $('metro-toggle');
      btn.classList.toggle('on', metroEnabled);
      btn.setAttribute('aria-pressed', metroEnabled);
      if (game && game.running) A.setMetronome(metroEnabled);
    };
    $('big-strum-btn').onpointerdown = (e) => { e.preventDefault(); handleStrum('down', e.timeStamp); };
    $('up-strum-btn').onpointerdown = (e) => { e.preventDefault(); handleStrum('up', e.timeStamp); };
    // keyboard / switch access: a click without a pointer (Enter/Space on the focused button)
    $('big-strum-btn').onclick = (e) => { if (e.detail === 0 && performance.now() - lastKeyStrum > 400) handleStrum('down'); };
    $('up-strum-btn').onclick = (e) => { if (e.detail === 0 && performance.now() - lastKeyStrum > 400) handleStrum('up'); };
    $('back-songs').onclick = exitSong;
    A.prewarm(Array.from(new Set(segs.map(s => s.name))).map(n => chordByName(n)).filter(Boolean).map(c => c.frets));
  }

  function countInBeats() { return game.bpb >= 3 ? game.bpb : game.bpb * 2; }

  function buildTargets() {
    const g = game;
    g.targets = [];
    if (!g.pattern) {
      g.segs.forEach((s, i) => g.targets.push({ beat: s.start, dir: 'down', seg: i, res: null, accent: true }));
      return;
    }
    const steps = g.pattern.length;
    const bars = Math.ceil(g.totalBeats / g.bpb);
    for (let bar = 0; bar < bars; bar++) {
      for (let k = 0; k < steps; k++) {
        const c = g.pattern[k];
        if (c === '-') continue;
        const beat = bar * g.bpb + k / g.sub;
        if (beat >= g.totalBeats - 1e-6) continue;
        g.targets.push({ beat, dir: c === 'U' ? 'up' : 'down', res: null, accent: k === 0 });
      }
    }
  }

  function changeTempo(d) {
    if (!game || game.running) return;
    const i = Math.max(0, Math.min(TEMPOS.length - 1, TEMPOS.indexOf(game.tempo) + d));
    game.tempo = TEMPOS[i];
    $('tempo-val').textContent = game.tempo + '%';
    saveProgress({ tempoPct: game.tempo });
  }

  function laneState(beat) {
    return {
      beat, segs: game.segs, targets: game.targets, bpb: game.bpb,
      mode: game.pattern ? 'pattern' : 'chord',
      pxPerBeat: game.pattern ? Math.max(54, Math.min(110, lane.W / 7)) * (game.sub === 3 ? 1.25 : 1) : Math.max(40, Math.min(80, lane.W / 9))
    };
  }

  function beginSong() {
    if (!game) return;
    A.init();
    A.cancelScheduled();
    $('game-ready').hidden = true;
    const g = game;
    g.bpm = g.song.bpm * g.tempo / 100;
    g.beatSec = 60 / g.bpm;
    g.countIn = countInBeats();
    g.t0 = A.now() + 0.3 + g.countIn * g.beatSec;
    g.lat = A.latency();
    g.perfect = 0; g.good = 0; g.miss = 0; g.strays = 0; g.combo = 0; g.maxCombo = 0;
    g.targets.forEach(t => { t.res = null; });
    g.lastSeg = -1;
    g.running = true;
    $('tempo-down').disabled = $('tempo-up').disabled = true;
    A.setMetronome(true);
    for (let b = -g.countIn; b < g.totalBeats; b++) {
      A.click(g.t0 + b * g.beatSec, ((b % g.bpb) + g.bpb) % g.bpb === 0);
    }
    if (!metroEnabled) {
      // count-in always clicks; the metronome during the song is optional
      setTimeout(() => { if (game === g && !metroEnabled) A.setMetronome(false); }, (g.t0 - A.now() - 0.05) * 1000);
    }
    g.raf = requestAnimationFrame(updateGame);
  }

  // Song-time (seconds since beat 0) as the kid hears it.
  function songTime(tsMs) {
    const g = game;
    let now = A.now();
    if (tsMs != null && isFinite(tsMs)) now -= Math.max(0, Math.min(0.25, (performance.now() - tsMs) / 1000));
    return now - g.lat - g.t0;
  }

  function judgeText(kind) {
    const el = $('lane-judge');
    el.textContent = kind === 'perfect' ? 'Perfect!' : kind === 'good' ? 'Good' : kind === 'early' ? 'Too early' : kind === 'late' ? 'Late' : 'Miss';
    el.className = 'gj-judge show ' + kind;
    clearTimeout(judgeText._t);
    judgeText._t = setTimeout(() => { el.className = 'gj-judge'; }, 420);
  }

  function handleStrum(dir, tsMs) {
    dir = dir === 'up' ? 'up' : 'down';
    if (!game || !game.running) {
      if (game && gameGuitar) playOn(gameGuitar, gameGuitar.frets(), dir);
      return;
    }
    const g = game;
    const t = songTime(tsMs);
    const beat = t / g.beatSec;
    let match = null, best = Infinity;
    if (!g.pattern) {
      g.targets.forEach(tg => {
        if (tg.res) return;
        const seg = g.segs[tg.seg];
        const start = seg.start * g.beatSec;
        const end = start + Math.min(seg.beats * g.beatSec * 0.7, 1.6);
        if (t >= start - 0.35 && t <= end) {
          const d = Math.abs(t - start);
          if (d < best) { best = d; match = tg; }
        }
      });
      if (match) match.res = best <= 0.15 ? 'perfect' : 'good';
    } else {
      const [wp, wg] = WINDOWS[g.tier] || WINDOWS.intermediate;
      g.targets.forEach(tg => {
        if (tg.res) return;
        const d = Math.abs(t - tg.beat * g.beatSec);
        if (d <= wg && d < best) { best = d; match = tg; }
      });
      if (match) {
        match.res = best <= wp ? 'perfect' : 'good';
        if (g.tier === 'expert' && match.dir !== dir) match.res = 'good';
      }
    }
    // Sound: the chord at the matched target (so an early strum on a
    // chord change already plays the new chord).
    const atBeat = match ? match.beat + 0.001 : beat;
    const seg = g.segs.find(s => atBeat >= s.start && atBeat < s.start + s.beats) || g.segs[Math.max(0, Math.min(g.segs.length - 1, beat < 0 ? 0 : g.segs.length - 1))];
    const chord = chordByName(seg.name);
    if (chord) playOn(gameGuitar, chord.frets, dir, { vel: match ? 0.9 : 0.7 });
    const btn = dir === 'up' ? $('up-strum-btn') : $('big-strum-btn');
    if (match) {
      g[match.res]++;
      g.combo++;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      judgeText(match.res);
      btn.classList.add('hit');
      setTimeout(() => btn.classList.remove('hit'), 160);
    } else if (beat > -0.5 && beat < g.totalBeats + 0.5) {
      g.strays++;
      g.combo = 0;
      const next = g.targets.find(tg => !tg.res);
      judgeText(next && next.beat * g.beatSec > t ? 'early' : 'late');
      btn.classList.add('miss');
      setTimeout(() => btn.classList.remove('miss'), 160);
    }
    $('lane-combo').textContent = g.combo >= 4 ? g.combo + ' in a row' : '';
  }

  function updateGame() {
    const g = game;
    if (!g || !g.running) return;
    const t = songTime();
    const beat = t / g.beatSec;
    // count-in
    const cEl = $('lane-count');
    if (beat < 0) {
      const n = ((Math.floor(beat) + g.countIn) % g.bpb) + 1;
      if (cEl.textContent !== String(n)) { cEl.textContent = String(n); cEl.className = 'gj-count-in show'; void cEl.offsetWidth; cEl.className = 'gj-count-in show pop'; }
    } else if (cEl.textContent) { cEl.textContent = ''; cEl.className = 'gj-count-in'; }

    // misses
    const wg = g.pattern ? (WINDOWS[g.tier] || WINDOWS.intermediate)[1] : null;
    g.targets.forEach(tg => {
      if (tg.res) return;
      let late;
      if (g.pattern) late = t > tg.beat * g.beatSec + wg;
      else { const s = g.segs[tg.seg]; late = t > s.start * g.beatSec + Math.min(s.beats * g.beatSec * 0.7, 1.6); }
      if (late) { tg.res = 'miss'; g.miss++; g.combo = 0; $('lane-combo').textContent = ''; }
    });

    // current chord on the neck, next chord as a ghost on the last beat
    const bNow = Math.max(0, beat);
    const si = g.segs.findIndex(s => bNow >= s.start && bNow < s.start + s.beats);
    if (si >= 0 && si !== g.lastSeg) {
      g.lastSeg = si;
      const c = chordByName(g.segs[si].name);
      if (c) gameGuitar.setChord(c);
      $('game-chord-name').textContent = g.segs[si].name;
      gameGuitar.setGhost(null);
    }
    if (si >= 0 && si < g.segs.length - 1) {
      const s = g.segs[si], nx = g.segs[si + 1];
      const soon = bNow >= s.start + s.beats - 1 && nx.name !== s.name;
      const want = soon ? chordByName(nx.name) : null;
      if (gameGuitar.ghost !== want) {
        gameGuitar.setGhost(want);
        $('game-chord-name').innerHTML = esc(s.name) + (want ? ' <small>next: ' + esc(nx.name) + '</small>' : '');
      }
    }

    lane.render(laneState(beat));
    if (beat >= g.totalBeats + 1.2) { endSong(); return; }
    g.raf = requestAnimationFrame(updateGame);
  }

  function stopGame() {
    if (game) { game.running = false; cancelAnimationFrame(game.raf); }
    const td = $('tempo-down'), tu = $('tempo-up');
    if (td) td.disabled = tu.disabled = false;
    A.cancelScheduled();
    A.setMetronome(true);
  }

  function endSong() {
    const g = game;
    stopGame();
    const totalPossible = g.targets.length;
    const hits = g.perfect + g.good;
    const allowance = g.tier === 'beginner' ? Infinity : Math.ceil(totalPossible * 0.2);
    const penalty = Math.max(0, g.strays - allowance);
    const accuracy = totalPossible > 0 ? Math.round((hits / (totalPossible + penalty)) * 100) : 0;
    let stars = 0;
    if (accuracy >= 90) stars = 3;
    else if (accuracy >= 75) stars = 2;
    else if (accuracy >= 50) stars = 1;
    let note = '';
    if (g.tier !== 'beginner' && g.tempo < 80 && stars === 3) { stars = 2; note = 'Play at 80% speed or faster for the third star.'; }
    else if (penalty > 0) note = 'Extra strums between the arrows count against you.';

    const showResults = () => {
      $('gameplay-screen').hidden = true;
      $('results-screen').hidden = false;
      $('replay-btn').focus();
    };

    if (typeof LearningCheck !== 'undefined') {
      LearningCheck.maybePrompt('music', showResults);
    } else {
      showResults();
    }
    $('results-art').innerHTML = GJArt.pick(stars >= 2 ? '#F59E0B' : '#2563EB', 76, '<path d="M-7 -6v10a3.5 3.5 0 1 1-2.5-3.3V-9l11-2.5v9a3.5 3.5 0 1 1-2.5-3.3v-5.6z" fill="#fff" opacity="0.92"/>');
    $('results-title').textContent = stars === 3 ? 'Amazing playing!' : stars === 2 ? 'Great playing!' : stars === 1 ? 'Nice work!' : 'Keep practising!';
    $('results-stars').innerHTML = GJArt.stars(stars, 3, 46);
    $('results-note').textContent = note;
    $('stat-accuracy').textContent = accuracy + '%';
    $('stat-hits').textContent = hits + '/' + totalPossible;
    $('stat-perfect').textContent = g.perfect;
    $('stat-combo').textContent = g.maxCombo;
    $('replay-btn').onclick = replaySong;
    $('more-songs-btn').onclick = exitSong;

    // Save progress
    const p = getProgress();
    const existing = p.songsCompleted.find(s => s.songId === g.song.id);
    const sb = p.songBest || {};
    if (!sb[g.song.id] || accuracy > sb[g.song.id].acc) {
      sb[g.song.id] = { acc: accuracy, tempo: g.tempo };
      saveProgress({ songBest: sb });
    }
    if (!existing || stars > existing.bestStars) {
      if (existing) existing.bestStars = stars;
      else p.songsCompleted.push({ songId: g.song.id, bestStars: stars });
      saveProgress({ songsCompleted: p.songsCompleted });

      if (typeof ActivityLog !== 'undefined' && stars > 0) {
        ActivityLog.log('Guitar Jam', '🎸', `Completed "${g.song.title}" — ${stars} star${stars !== 1 ? 's' : ''}`);
      }

      checkStarMilestones();
    }

    if (stars > 0 && typeof SFX !== 'undefined') SFX.cheer();
  }

  function exitSong() {
    stopGame();
    game = null;
    currentSong = null;
    $('gameplay-screen').hidden = true;
    $('results-screen').hidden = true;
    $('song-select-screen').hidden = false;
    initPlay();
  }

  function replaySong() {
    const id = (game && game.song.id) || (currentSong && currentSong.id);
    $('results-screen').hidden = true;
    if (id) startSong(id);
  }

  // ════════════════════════════════════════════════════════════════
  //  EAR TRAINING
  // ════════════════════════════════════════════════════════════════
  const EAR_MODES = [
    { id: 'quality', title: 'Major or minor?', es: '¿Mayor o menor?', desc: 'Bright and happy, or dark and sad?' },
    { id: 'string', title: 'Which string?', es: '¿Qué cuerda?', desc: 'One open string rings. Which one?' },
    { id: 'change', title: 'Chord changes', es: 'Cambios de acorde', desc: 'Two chords play. Listen for the change.' },
    { id: 'chord', title: 'Name the chord', es: '¿Qué acorde?', desc: 'Which chord did you hear?' }
  ];
  let ear = null;
  let earGuitar = null;

  function initEarMenu() {
    stopEar();
    $('ear-menu').hidden = false;
    $('ear-game-screen').hidden = true;
    $('ear-results-screen').hidden = true;
    const p = getProgress();
    const em = p.earModes || {};
    const art = { quality: GJArt.icon('sun', 30) + GJArt.icon('moon', 30), string: stringArt(), change: GJArt.icon('arp', 34), chord: GJArt.icon('speaker', 34) };
    $('ear-modes').innerHTML = EAR_MODES.map(m => {
      const st = em[m.id] ? em[m.id].stars : (m.id === 'chord' ? (p.earStars || 0) : 0);
      return '<button type="button" class="ear-mode" data-mode="' + m.id + '">' +
        '<span class="ear-mode-art">' + art[m.id] + '</span>' +
        '<span class="ear-mode-title">' + m.title + '<small>' + m.es + '</small></span>' +
        '<span class="ear-mode-desc">' + m.desc + ' ' + earLevelText(m.id) + '</span>' +
        '<span class="ear-mode-stars">' + GJArt.stars(st, 3, 18) + '</span></button>';
    }).join('');
    $('ear-modes').querySelectorAll('.ear-mode').forEach(b => { b.onclick = () => startEarGame(b.dataset.mode); });
  }

  function stringArt() {
    return '<svg width="44" height="34" viewBox="0 0 44 34" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(i =>
      '<line x1="2" x2="42" y1="' + (4 + i * 5.2) + '" y2="' + (4 + i * 5.2) + '" stroke="' + (i < 4 ? '#b98a45' : '#9aa0a8') + '" stroke-width="' + (2.8 - i * 0.4) + '"/>').join('') + '</svg>';
  }

  function earLevelText(mode) {
    const t = tierIdx();
    if (mode === 'string') return ['(thick or thin)', '(3 choices)', '(4 choices)', '(all 6)'][t];
    if (mode === 'change') return t < 2 ? '(same or different?)' : '(which change?)';
    if (mode === 'chord') return '(' + [2, 3, 4, 4][t] + ' choices)';
    return t >= 2 ? '(any chord, some played one note at a time)' : '(same root note)';
  }

  function ensureEarGuitar() {
    if (earGuitar) return earGuitar;
    earGuitar = new GJArt.Guitar($('ear-guitar'), {
      orient: 'h', minFretPx: 26, maxFret: 7, clock: () => A.now(),
      hHeight: (W) => Math.max(130, Math.min(W * 0.2, 190))
    });
    return earGuitar;
  }

  function startEarGame(mode) {
    if (!mode || !EAR_MODES.some(m => m.id === mode)) mode = (ear && ear.mode) || 'chord';
    stopEar();
    ear = { mode, round: 0, score: 0, streak: 0, bestStreak: 0, q: null, locked: false, timers: [] };
    $('ear-menu').hidden = true;
    $('ear-game-screen').hidden = false;
    $('ear-results-screen').hidden = true;
    const m = EAR_MODES.find(x => x.id === mode);
    $('ear-mode-title').textContent = m.title;
    ensureEarGuitar();
    earGuitar.resize();
    earGuitar.setChord(null);
    $('ear-back').onclick = initEarMenu;
    $('ear-replay-btn').onclick = () => playQuestion();
    $('ear-ref-btn').onclick = () => {
      const t0 = A.now() + 0.05;
      for (let s = 0; s < 6; s++) pluckOn(earGuitar, s, 0, 0.7, t0 + s * 0.45);
    };
    nextEarRound();
  }

  function stopEar() {
    if (ear) ear.timers.forEach(clearTimeout);
    A.mute();
  }

  function pickN(arr, n) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
  }
  const isMinor = (c) => /m$/.test(c.name);

  function makeQuestion() {
    const t = tierIdx();
    const mode = ear.mode;
    if (mode === 'quality') {
      let chord;
      if (t < 2) {
        const pair = pickN([['E', 'Em'], ['A', 'Am'], ['D', 'Dm']], 1)[0];
        chord = chordByName(pair[Math.random() < 0.5 ? 0 : 1]);
      } else {
        const pool = ['C', 'G', 'D', 'E', 'A', 'F', 'Bb', 'Em', 'Am', 'Dm', 'Bm', 'F#m', 'A#m'].map(chordByName);
        chord = pickN(pool, 1)[0];
      }
      const minor = isMinor(chord);
      return {
        play: { kind: 'chord', chord, arp: t >= 2 && Math.random() < 0.4 },
        prompt: 'Did that chord sound major (bright) or minor (dark)?',
        options: [
          { id: 'major', html: GJArt.icon('sun', 26) + '<span>Major<small>bright</small></span>' },
          { id: 'minor', html: GJArt.icon('moon', 26) + '<span>Minor<small>dark</small></span>' }
        ],
        answer: minor ? 'minor' : 'major',
        explain: 'It was ' + chord.name + ' — ' + (minor ? 'a minor' : 'a major') + ' chord.'
      };
    }
    if (mode === 'string') {
      const n = [2, 3, 4, 6][t];
      let set;
      if (n === 2) set = [0, 5];
      else if (n === 6) set = [0, 1, 2, 3, 4, 5];
      else set = pickN([0, 1, 2, 3, 4, 5], n).sort((a, b) => a - b);
      const ans = pickN(set, 1)[0];
      const label = (s) => ['6th · low E', '5th · A', '4th · D', '3rd · G', '2nd · B', '1st · high e'][s];
      return {
        play: { kind: 'string', string: ans },
        prompt: n === 2 ? 'Was that the thickest string or the thinnest string?' : 'Which open string was that?',
        options: set.map(s => ({ id: String(s), html: '<i class="ear-str" style="height:' + (1 + (5 - s) * 0.8).toFixed(1) + 'px;background:' + (s < 4 ? '#b98a45' : '#9aa0a8') + '"></i><span>' + (n === 2 ? (s === 0 ? 'Thickest<small>low E</small>' : 'Thinnest<small>high e</small>') : label(s)) + '</span>' })),
        answer: String(ans),
        reveal: () => pluckOn(earGuitar, ans, 0, 0.8),
        explain: 'That was the ' + label(ans) + ' string (' + A.noteName(ans, 0, true) + ').',
        ref: t >= 1
      };
    }
    if (mode === 'change') {
      if (t < 2) {
        const pool = ['G', 'C', 'D', 'Em', 'Am'];
        const a = pickN(pool, 1)[0];
        const same = Math.random() < 0.45;
        const b = same ? a : pickN(pool.filter(x => x !== a), 1)[0];
        return {
          play: { kind: 'pair', a: chordByName(a), b: chordByName(b) },
          prompt: 'Did the chord change, or was it the same chord twice?',
          options: [{ id: 'same', html: '<span>Same<small>no change</small></span>' }, { id: 'diff', html: '<span>Changed<small>new chord</small></span>' }],
          answer: same ? 'same' : 'diff',
          explain: a + ' then ' + b + (same ? ' — the same chord.' : ' — it changed.')
        };
      }
      const start = pickN(['G', 'C', 'D', 'A', 'E', 'Am'], 1)[0];
      const n = t === 2 ? 3 : 4;
      const targets = { G: ['C', 'D', 'Em', 'Am', 'D7'], C: ['G', 'Am', 'F', 'Em', 'G7'], D: ['G', 'A', 'Bm', 'Em', 'A7'], A: ['D', 'E', 'F#m', 'Bm', 'E7'], E: ['A', 'B7', 'Am', 'F#m'], Am: ['C', 'G', 'Dm', 'E', 'F'] }[start]
        .filter(x => chordByName(x));
      const opts = pickN(targets, n);
      const ans = pickN(opts, 1)[0];
      return {
        play: { kind: 'pair', a: chordByName(start), b: chordByName(ans) },
        prompt: 'It starts on ' + start + '. Where does it go?',
        options: opts.map(o => ({ id: o, html: '<span>' + esc(start) + ' → <b>' + esc(o) + '</b></span>' })),
        answer: ans,
        explain: start + ' → ' + ans + '.'
      };
    }
    // 'chord' — the original ear game: pick options from the kid's chords
    const max = tierIdx();
    const available = CHORDS.filter(c => TIERS.indexOf(c.tier) <= max);
    const count = tier() === 'beginner' ? 2 : tier() === 'intermediate' ? 3 : 4;
    const options = pickN(available, count);
    const correct = pickN(options, 1)[0];
    return {
      play: { kind: 'chord', chord: correct },
      prompt: 'Which chord did you hear?',
      options: options.map(o => ({ id: o.name, html: '<span class="ear-chord-opt">' + esc(o.name) + '</span>' })),
      answer: correct.name,
      reveal: () => earGuitar.setChord(correct),
      explain: 'It was ' + correct.name + ' (' + correct.fullName + ').'
    };
  }

  function playQuestion() {
    if (!ear || !ear.q) return;
    const pl = ear.q.play;
    const hideNeck = ear.mode === 'string' && !ear.locked;
    const g = hideNeck ? null : earGuitar;
    if (pl.kind === 'chord') {
      if (pl.arp) {
        const t0 = A.now() + 0.05; let k = 0;
        pl.chord.frets.forEach((f, s) => { if (f >= 0) { pluckOn(g, s, f, 0.75, t0 + k * 0.22); k++; } });
      } else playOn(g, pl.chord.frets, 'down');
    } else if (pl.kind === 'string') {
      const t = A.pluck(pl.string, 0, { vel: 0.85 });
      if (g && t != null) g.vibrate(pl.string, 0.85, t, 0);
    } else if (pl.kind === 'pair') {
      playOn(g, pl.a.frets, 'down');
      const when = A.now() + 1.25;
      playOn(g, pl.b.frets, 'down', { when });
    }
  }

  function nextEarRound() {
    if (!ear) return;
    if (ear.round >= 10) { endEarGame(); return; }
    ear.round++;
    ear.locked = false;
    $('ear-round').textContent = `Round ${ear.round}/10`;
    $('ear-streak').textContent = 'Streak ' + ear.streak;
    ear.q = makeQuestion();
    $('ear-prompt').textContent = ear.q.prompt;
    $('ear-explain').textContent = '';
    $('ear-ref-btn').hidden = !ear.q.ref;
    earGuitar.setChord(null); earGuitar.setGhost(null);
    const optsEl = $('ear-options');
    optsEl.className = 'ear-options n' + ear.q.options.length;
    optsEl.innerHTML = ear.q.options.map(o => '<button type="button" class="ear-opt-btn" data-id="' + esc(o.id) + '">' + o.html + '</button>').join('');
    optsEl.querySelectorAll('.ear-opt-btn').forEach(b => { b.onclick = () => checkEarAnswer(b, b.dataset.id); });
    ear.timers.push(setTimeout(playQuestion, 450));
  }

  function checkEarAnswer(btn, id) {
    if (!ear || ear.locked) return;
    ear.locked = true;
    const isCorrect = id === ear.q.answer;
    const allBtns = btn.parentElement.querySelectorAll('button');
    allBtns.forEach(b => { b.disabled = true; });
    if (isCorrect) {
      ear.score++;
      ear.streak++;
      ear.bestStreak = Math.max(ear.bestStreak, ear.streak);
      btn.classList.add('correct');
      if (typeof SFX !== 'undefined') SFX.correct();
    } else {
      ear.streak = 0;
      btn.classList.add('wrong');
      allBtns.forEach(b => { if (b.dataset.id === ear.q.answer) b.classList.add('correct'); });
      if (typeof SFX !== 'undefined') SFX.wrong();
    }
    $('ear-streak').textContent = 'Streak ' + ear.streak;
    $('ear-explain').textContent = (isCorrect ? 'Yes! ' : 'Not quite. ') + ear.q.explain;
    if (ear.q.reveal) ear.timers.push(setTimeout(ear.q.reveal, 350));
    ear.timers.push(setTimeout(nextEarRound, isCorrect ? 1500 : 2300));
  }

  function endEarGame() {
    const showResults = () => {
      $('ear-game-screen').hidden = true;
      $('ear-results-screen').hidden = false;
    };

    if (typeof LearningCheck !== 'undefined') {
      LearningCheck.maybePrompt('music', showResults);
    } else {
      showResults();
    }

    let stars = 0;
    if (ear.score >= 9) stars = 3;
    else if (ear.score >= 7) stars = 2;
    else if (ear.score >= 5) stars = 1;

    $('ear-results-art').innerHTML = '<span class="ear-res-ico">' + GJArt.icon('ear', 64) + '</span>';
    $('ear-results-stars').innerHTML = GJArt.stars(stars, 3, 46);
    $('ear-stat-score').textContent = `${ear.score}/10`;
    $('ear-stat-streak').textContent = ear.bestStreak;
    $('ear-again').onclick = () => startEarGame(ear.mode);
    $('ear-to-menu').onclick = initEarMenu;

    const p = getProgress();
    const updates = {};
    if (stars > (p.earStars || 0)) updates.earStars = stars;
    if (ear.bestStreak > (p.earBestStreak || 0)) updates.earBestStreak = ear.bestStreak;
    const em = p.earModes || {};
    const prev = em[ear.mode] || { best: 0, stars: 0 };
    if (ear.score > prev.best || stars > prev.stars) {
      em[ear.mode] = { best: Math.max(prev.best, ear.score), stars: Math.max(prev.stars, stars) };
      updates.earModes = em;
    }

    if (Object.keys(updates).length > 0) {
      saveProgress(updates);
      checkStarMilestones();
    }

    if (stars > 0 && typeof SFX !== 'undefined') SFX.cheer();
  }

  // ════════════════════════════════════════════════════════════════
  //  TUNER
  // ════════════════════════════════════════════════════════════════
  const tuner = { target: null, angle: 0, vel: 0, goal: 0, raf: 0, hist: [], last: 0, ready: false };

  function initTuner() {
    if (!tuner.ready) {
      $('headstock-art').innerHTML = GJArt.headstock();
      $('gauge-art').innerHTML = GJArt.gauge();
      tuner.ready = true;
    }
    const btns = document.querySelectorAll('.tuner-btn');
    btns.forEach(btn => {
      btn.onclick = () => {
        btns.forEach(b => b.classList.remove('playing'));
        btn.classList.add('playing');
        const s = Number(btn.dataset.string);
        tuner.target = s;
        A.pluck(s, 0, { vel: 0.9 });
        setGaugeNote(btn.dataset.name, parseFloat(btn.dataset.freq).toFixed(2) + ' Hz');
        if (!A.micOn()) {
          tuner.goal = 0;
          $('tuner-readout').innerHTML = 'Reference: <b>' + esc(btn.dataset.name) + '</b> (' + esc(btn.dataset.freq) + ' Hz). Pluck your string and match it.';
        }
        clearTimeout(btn._t);
        btn._t = setTimeout(() => btn.classList.remove('playing'), 2500);
        runNeedle();
      };
    });
    $('mic-btn').onclick = toggleMic;
    runNeedle();
  }

  function setGaugeNote(note, hz) {
    const n = $('gj-gauge-note'), h = $('gj-gauge-hz');
    if (n) n.textContent = note;
    if (h) h.textContent = hz;
  }

  function toggleMic() {
    if (A.micOn()) { stopMic(); return; }
    A.startMic().then(() => {
      $('mic-btn').classList.add('on');
      $('mic-btn').setAttribute('aria-pressed', 'true');
      $('mic-label').textContent = 'Stop microphone';
      $('tuner-readout').textContent = 'Listening… pluck one string.';
      runNeedle();
    }).catch(err => {
      const msg = err && err.name === 'NotAllowedError'
        ? 'The microphone wasn\'t allowed. You can still tune by ear: tap a tuning key to hear each string.'
        : 'The microphone isn\'t available here. You can still tune by ear: tap a tuning key to hear each string.';
      if (typeof ZsDialog !== 'undefined') ZsDialog.alert({ title: 'No microphone', message: msg });
      else $('tuner-readout').textContent = msg;
    });
  }

  function stopMic() {
    A.stopMic();
    const b = $('mic-btn');
    if (!b) return;
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');
    $('mic-label').textContent = 'Use microphone';
    tuner.goal = 0;
    const lamp = $('gj-gauge-lamp');
    if (lamp) lamp.setAttribute('fill', '#3f4a44');
  }

  function runNeedle() {
    if (tuner.raf) return;
    let last = performance.now();
    const step = (now) => {
      tuner.raf = 0;
      if (!$('tab-tuner').classList.contains('active')) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (A.micOn()) readMic(now);
      // damped spring — a real meter movement overshoots a little
      const k = 90, c = 13;
      tuner.vel += ((tuner.goal - tuner.angle) * k - tuner.vel * c) * dt;
      tuner.angle += tuner.vel * dt;
      const nd = $('gj-needle');
      if (nd) nd.style.transform = 'rotate(' + tuner.angle.toFixed(2) + 'deg)';
      if (A.micOn() || Math.abs(tuner.vel) > 0.02 || Math.abs(tuner.goal - tuner.angle) > 0.02) tuner.raf = requestAnimationFrame(step);
    };
    tuner.raf = requestAnimationFrame(step);
  }

  function readMic(now) {
    if (now - tuner.last < 45) return;
    tuner.last = now;
    const f = A.readPitch();
    const lamp = $('gj-gauge-lamp');
    if (!f || f < 60 || f > 1000) {
      tuner.hist = [];
      tuner.goal += (-48 - tuner.goal) * 0.08; // drift to the rest pin
      if (lamp) lamp.setAttribute('fill', '#3f4a44');
      return;
    }
    tuner.hist.push(f);
    if (tuner.hist.length > 5) tuner.hist.shift();
    const med = tuner.hist.slice().sort((a, b) => a - b)[tuner.hist.length >> 1];
    let s = tuner.target;
    if (s == null) {
      let bestD = Infinity;
      for (let i = 0; i < 6; i++) {
        const d = Math.abs(1200 * Math.log2(med / A.freqOf(i, 0)));
        if (d < bestD) { bestD = d; s = i; }
      }
    }
    const target = A.freqOf(s, 0);
    let cents = 1200 * Math.log2(med / target);
    // an octave off still reads as that string, so the needle stays useful
    while (cents > 600) cents -= 1200;
    while (cents < -600) cents += 1200;
    const shown = Math.max(-50, Math.min(50, cents));
    tuner.goal = shown * 0.9;
    setGaugeNote(A.noteName(s, 0, true), med.toFixed(1) + ' Hz');
    const ok = Math.abs(cents) < 5;
    if (Math.abs(cents) > 60) {
      const m = Math.round(69 + 12 * Math.log2(med / 440));
      const heard = A.NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
      if (lamp) lamp.setAttribute('fill', '#ef4444');
      $('tuner-readout').innerHTML = 'I hear about <b>' + esc(heard) + '</b>. Pluck one open string — the nearest is ' + esc(A.noteName(s, 0, true)) + '.';
      return;
    }
    if (lamp) lamp.setAttribute('fill', ok ? '#22c55e' : (Math.abs(cents) < 20 ? '#f59e0b' : '#ef4444'));
    $('tuner-readout').innerHTML = ok ? '<b>In tune!</b> ' + esc(A.noteName(s, 0, true)) :
      (cents < 0 ? '<b>Too low</b> (' + Math.round(cents) + ' cents) — tighten the string a little.' :
        '<b>Too high</b> (+' + Math.round(cents) + ' cents) — loosen the string a little.');
  }

  // ── Tab Management ────────────────────────────────────────────
  function bindTabs() {
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        $(`tab-${tabId}`).classList.add('active');

        if (tabId !== 'play' && game) exitSong();
        if (tabId !== 'ear') stopEar();
        if (tabId !== 'tuner') stopMic();

        if (tabId === 'learn') { initLearn(); learnGuitar.resize(); }
        if (tabId === 'play') initPlay();
        if (tabId === 'ear') initEarMenu();
        if (tabId === 'tuner') initTuner();
      });
    });
  }

  let lastKeyStrum = -1e9;
  document.addEventListener('keydown', (e) => {
    if (!game || !game.running) return;
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.key === 'j') { e.preventDefault(); lastKeyStrum = performance.now(); handleStrum('down', e.timeStamp); }
    else if (e.code === 'ArrowUp' || e.key === 'k') { e.preventDefault(); lastKeyStrum = performance.now(); handleStrum('up', e.timeStamp); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopMic(); if (game && game.running) exitSong(); }
  });

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    $('gj-logo').innerHTML = GJArt.logo(40);
    fillIcons();
    bindTabs();
    initLearn();
  });

  return {
    selectChord, startSong, exitSong, replaySong, handleStrum, startEarGame, checkEarAnswer, initLearn,
    _debug: { getProgress, game: () => game, ear: () => ear, guitar: () => learnGuitar }
  };
})();
