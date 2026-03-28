/* ================================================================
   GUITAR JAM — CORE APP & CHORD LIBRARY
   ================================================================ */

const CHORDS = [
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
  { name: 'D7', fullName: 'D Dominant 7', tier: 'advanced', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], funFact: 'It looks like a backwards D Major chord.' }
];

const SONGS = [
  { id: 'twinkle', title: 'Twinkle Twinkle', tier: 'beginner', bpm: 90, progression: [['C', 4], ['G', 4], ['Am', 4], ['Em', 4], ['C', 4], ['G', 4], ['C', 8]] },
  { id: 'birthday', title: 'Happy Birthday', tier: 'beginner', bpm: 100, progression: [['G', 4], ['G', 4], ['G', 4], ['C', 4], ['C', 4], ['Am', 4], ['G', 4], ['G', 4], ['C', 8]] },
  { id: 'jingle', title: 'Jingle Bells', tier: 'beginner', bpm: 120, progression: [['G', 8], ['G', 8], ['C', 4], ['G', 4], ['Am', 4], ['Em', 4], ['G', 8], ['G', 8], ['C', 4], ['G', 4], ['Em', 4], ['G', 8]] },
  { id: 'labamba', title: 'La Bamba', tier: 'intermediate', bpm: 130, progression: [['C', 2], ['F', 2], ['G', 4], ['C', 2], ['F', 2], ['G', 4], ['C', 2], ['F', 2], ['G', 4], ['C', 2], ['F', 2], ['G', 4]] },
  { id: 'ode', title: 'Ode to Joy', tier: 'intermediate', bpm: 100, progression: [['G', 4], ['G', 4], ['D', 4], ['D', 4], ['Em', 4], ['Em', 4], ['C', 4], ['C', 4], ['G', 4], ['D', 4], ['G', 8]] },
  { id: 'stand', title: 'Stand By Me', tier: 'intermediate', bpm: 110, progression: [['G', 8], ['Em', 8], ['C', 4], ['D', 4], ['G', 8]] },
  { id: 'house', title: 'House of the Rising Sun', tier: 'advanced', bpm: 80, progression: [['Am', 4], ['C', 4], ['D', 4], ['F', 4], ['Am', 4], ['C', 4], ['E', 8]] },
  { id: 'scarborough', title: 'Scarborough Fair', tier: 'advanced', bpm: 90, progression: [['Am', 8], ['Am', 4], ['G', 4], ['Am', 4], ['G', 4], ['C', 4], ['D', 4], ['F', 4], ['Am', 8]] }
];

const GuitarJam = (() => {

  // ── Audio Engine ────────────────────────────────────────────────
  const Audio = {
    ctx: null,
    osc: null,
    gain: null,
    // E2, A2, D3, G3, B3, E4
    strings: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63],
    
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playString(stringIdx, fret, delayMs = 0) {
      this.init();
      if (fret < 0) return; // muted
      
      const now = this.ctx.currentTime + (delayMs / 1000);
      const baseFreq = this.strings[stringIdx];
      const freq = baseFreq * Math.pow(2, fret / 12);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 1.0);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    },

    strumChord(chordObj) {
      this.init();
      let delay = 0;
      for (let i = 0; i < 6; i++) {
        if (chordObj.frets[i] !== -1) {
          this.playString(i, chordObj.frets[i], delay);
          delay += 30;
        }
      }
    },

    tick(accent = false) {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(accent ? 1200 : 800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    },

    playTone(freq, duration = 2) {
      this.init();
      this.stopTone();
      
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      
      this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.05);
      this.gain.gain.setValueAtTime(0.3, this.ctx.currentTime + duration - 0.2);
      this.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      this.osc.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      
      this.osc.start();
      this.osc.stop(this.ctx.currentTime + duration);
    },

    stopTone() {
      if (this.osc) {
        try { this.osc.stop(); } catch(e) {}
        this.osc = null;
      }
    }
  };


  // ── State & Progress ──────────────────────────────────────────
  let activeChord = null;
  let currentSong = null;
  let gameInterval = null;
  let metroEnabled = true;
  let hits = 0;
  let misses = 0;
  let songStartTime = 0;
  let beatsInSong = 0;
  let currentBeatIdx = 0;
  let expectedStrumTimes = [];
  
  // Ear training state
  let earRound = 0;
  let earScore = 0;
  let earStreak = 0;
  let earCorrectChord = null;

  function getUserKey() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('zs_guitar_') : null;
  }
  
  function getProgress() {
    const k = getUserKey();
    if (!k) return { chordsLearned: [], totalStars: 0, songsCompleted: [], earBestStreak: 0, earStars: 0 };
    try { 
      const p = JSON.parse(localStorage.getItem(k)) || { chordsLearned: [], totalStars: 0, songsCompleted: [], earBestStreak: 0, earStars: 0 };
      if (!p.earStars) p.earStars = 0;
      return p;
    }
    catch { return { chordsLearned: [], totalStars: 0, songsCompleted: [], earBestStreak: 0, earStars: 0 }; }
  }
  
  function saveProgress(data) {
    const k = getUserKey();
    if (!k) return;
    const p = getProgress();
    Object.assign(p, data);
    localStorage.setItem(k, JSON.stringify(p));
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }


  // ── Chord Library UI ──────────────────────────────────────────
  function initLearn() {
    // Auto-pull sync
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      const u = getActiveUser();
      if (u) CloudSync.pull('zs_guitar_' + u.name.toLowerCase().replace(/\s+/g, '_'));
    }

    const tier = getAgeTier();
    const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const maxIdx = tierOrder.indexOf(tier);

    let visibleChords = CHORDS.filter(c => tierOrder.indexOf(c.tier) <= maxIdx);
    if (visibleChords.length === 0) visibleChords = CHORDS;

    const listEl = document.getElementById('chord-list');
    if (!listEl) return;
    
    listEl.innerHTML = visibleChords.map(c => {
      const p = getProgress();
      const viewed = p.chordsLearned.includes(c.name) ? 'viewed' : '';
      return `<button class="chord-btn ${viewed}" data-chord="${c.name}" onclick="GuitarJam.selectChord('${c.name}')">${c.name}</button>`;
    }).join('');

    if (visibleChords.length > 0) selectChord(visibleChords[0].name);

    document.getElementById('strum-btn').onclick = () => {
      if (activeChord) Audio.strumChord(activeChord);
    };
  }

  function selectChord(name) {
    activeChord = CHORDS.find(c => c.name === name);
    if (!activeChord) return;

    document.querySelectorAll('.chord-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.chord === name);
    });
    
    document.getElementById('chord-name').textContent = activeChord.fullName;
    document.getElementById('chord-fact').textContent = activeChord.funFact;
    document.getElementById('strum-btn').style.display = 'inline-block';

    renderFretboard('fretboard-container', activeChord);

    const p = getProgress();
    if (!p.chordsLearned.includes(name)) {
      p.chordsLearned.push(name);
      saveProgress({ chordsLearned: p.chordsLearned });
      if (typeof SFX !== 'undefined') SFX.correct();
      
      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('Guitar Jam', '🎸', `Learned the ${name} chord`);
      }

      checkStarMilestones();
      
      const btn = document.querySelector(`.chord-btn[data-chord="${name}"]`);
      if (btn) btn.classList.add('viewed');
    }
  }

  function renderFretboard(containerId, chord) {
    const svg = document.getElementById(containerId);
    if (!svg) return;

    const w = 200;
    const h = 250;
    const padding = 20;
    const stringSpacing = (w - 2 * padding) / 5;
    const fretSpacing = (h - padding) / 5;

    let html = `<rect x="${padding}" y="${padding - 4}" width="${w - 2 * padding}" height="8" fill="#FFF" />`;

    for (let i = 0; i < 6; i++) {
      const x = padding + i * stringSpacing;
      html += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${h}" stroke="#FFF" stroke-width="2" opacity="0.3" />`;
    }

    for (let i = 1; i <= 5; i++) {
      const y = padding + i * fretSpacing;
      html += `<line x1="${padding}" y1="${y}" x2="${w - padding}" y2="${y}" stroke="#FFF" stroke-width="2" opacity="0.5" />`;
    }

    const colors = ['#fff', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

    for (let i = 0; i < 6; i++) {
      const fret = chord.frets[i];
      const finger = chord.fingers[i];
      const x = padding + i * stringSpacing;

      if (fret === -1) {
        html += `<text x="${x}" y="${padding - 10}" fill="#EF4444" font-size="14" font-family="Nunito" font-weight="bold" text-anchor="middle">X</text>`;
      } else if (fret === 0) {
        html += `<circle cx="${x}" cy="${padding - 14}" r="5" fill="none" stroke="#FFF" stroke-width="2" />`;
      } else {
        const y = padding + (fret - 0.5) * fretSpacing;
        const color = colors[finger] || '#FFF';
        html += `<circle cx="${x}" cy="${y}" r="10" fill="${color}" />`;
        if (finger > 0) {
          html += `<text x="${x}" y="${y + 4}" fill="#000" font-size="12" font-family="Nunito" font-weight="bold" text-anchor="middle">${finger}</text>`;
        }
      }
    }
    svg.innerHTML = html;
  }


  // ── Play Along UI ─────────────────────────────────────────────
  function initPlay() {
    const tier = getAgeTier();
    const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const maxIdx = tierOrder.indexOf(tier);

    const visibleSongs = SONGS.filter(s => tierOrder.indexOf(s.tier) <= maxIdx);
    const listEl = document.getElementById('song-list');
    if (!listEl) return;

    const p = getProgress();
    listEl.innerHTML = visibleSongs.map(s => {
      const completed = p.songsCompleted.find(sc => sc.songId === s.id);
      const stars = completed ? completed.bestStars : 0;
      const starHtml = stars > 0 ? '⭐'.repeat(stars) : '';
      const uniqueChords = [...new Set(s.progression.map(p => p[0]))];
      
      return `
        <div class="song-card" onclick="GuitarJam.startSong('${s.id}')">
          <div class="song-title">${s.title}</div>
          <div class="song-meta">${s.tier.toUpperCase()} · ${s.bpm} BPM</div>
          <div class="song-chords">
            ${uniqueChords.map(c => `<span class="chord-mini">${c}</span>`).join('')}
          </div>
          <div style="margin-top:auto; font-size:1.2rem;">${starHtml}</div>
        </div>
      `;
    }).join('');
  }

  function startSong(id) {
    currentSong = SONGS.find(s => s.id === id);
    if (!currentSong) return;

    hits = 0;
    misses = 0;
    currentBeatIdx = 0;
    expectedStrumTimes = [];

    document.getElementById('song-select-screen').style.display = 'none';
    document.getElementById('gameplay-screen').style.display = 'flex';
    document.getElementById('game-song-title').textContent = currentSong.title;

    const strip = document.getElementById('chord-strip');
    strip.innerHTML = currentSong.progression.map((p, i) => `
      <div class="strip-chord" id="strip-chord-${i}">${p[0]}</div>
    `).join('');

    const beatMs = (60 / currentSong.bpm) * 1000;
    let totalBeats = 0;
    currentSong.progression.forEach((p, i) => {
      // One expected strum per chord segment
      expectedStrumTimes.push({
        time: totalBeats * beatMs,
        endTime: (totalBeats + p[1]) * beatMs,
        chord: p[0],
        chordIdx: i,
        hit: false
      });
      totalBeats += p[1];
    });
    beatsInSong = totalBeats;

    const strumBtn = document.getElementById('big-strum-btn');
    strumBtn.onclick = handleStrum;
    
    document.getElementById('metro-toggle').onclick = (e) => {
      metroEnabled = !metroEnabled;
      e.target.classList.toggle('on', metroEnabled);
      e.target.textContent = metroEnabled ? '⌛ Metro: On' : '⌛ Metro: Off';
    };

    songStartTime = Date.now() + 1000; // 1s lead-in
    gameInterval = requestAnimationFrame(updateGame);
  }

  function handleStrum() {
    Audio.init();
    const now = Date.now() - songStartTime;
    const chordName = currentSong.progression.find((p, i) => {
      let start = 0;
      for (let j = 0; j < i; j++) start += currentSong.progression[j][1];
      const beatMs = (60 / currentSong.bpm) * 1000;
      return now >= start * beatMs && now < (start + currentSong.progression[i][1]) * beatMs;
    })?.[0] || 'C';
    
    const chord = CHORDS.find(c => c.name === chordName);
    if (chord) Audio.strumChord(chord);

    // Hit detection: Check if we are within any chord segment's window
    const activeSegment = expectedStrumTimes.find(s => now >= s.time - 400 && now < s.endTime);

    const btn = document.getElementById('big-strum-btn');
    if (activeSegment && !activeSegment.hit) {
      activeSegment.hit = true;
      hits++;
      btn.classList.add('hit');
      if (typeof SFX !== 'undefined') SFX.correct();
      setTimeout(() => btn.classList.remove('hit'), 200);
    } else {
      misses++;
      btn.classList.add('miss');
      if (typeof SFX !== 'undefined') SFX.wrong();
      setTimeout(() => btn.classList.remove('miss'), 200);
    }
  }

  function updateGame() {
    if (!currentSong) return;
    const now = Date.now() - songStartTime;
    const beatMs = (60 / currentSong.bpm) * 1000;
    const currentBeat = Math.floor(now / beatMs);

    // Metronome
    if (currentBeat > currentBeatIdx) {
      currentBeatIdx = currentBeat;
      if (metroEnabled && currentBeat >= 0 && currentBeat < beatsInSong) {
        Audio.tick(currentBeat % 4 === 0);
      }
    }

    // Update chord strip position
    const strip = document.getElementById('chord-strip');
    const chordWidth = 100; // 60px + 40px gap
    const offset = -(now / beatMs) * chordWidth;
    strip.style.transform = `translateX(${offset}px)`;

    // Update current chord display
    const currentChordEntry = currentSong.progression.find((p, i) => {
      let start = 0;
      for (let j = 0; j < i; j++) start += currentSong.progression[j][1];
      return currentBeat >= start && currentBeat < (start + p[1]);
    });

    if (currentChordEntry) {
      const name = currentChordEntry[0];
      const chord = CHORDS.find(c => c.name === name);
      if (chord) {
        document.getElementById('game-chord-name').textContent = name;
        renderFretboard('game-fretboard', chord);
      }
      
      // Highlight in strip
      const chordIdx = currentSong.progression.indexOf(currentChordEntry);
      document.querySelectorAll('.strip-chord').forEach((el, i) => {
        el.classList.toggle('active', i === chordIdx);
      });
    }

    if (currentBeat >= beatsInSong + 2) {
      endSong();
    } else {
      gameInterval = requestAnimationFrame(updateGame);
    }
  }

  function endSong() {
    cancelAnimationFrame(gameInterval);
    const totalPossible = expectedStrumTimes.length;
    const accuracy = totalPossible > 0 ? Math.round((hits / totalPossible) * 100) : 0;
    let stars = 0;
    if (accuracy >= 90) stars = 3;
    else if (accuracy >= 75) stars = 2;
    else if (accuracy >= 50) stars = 1;

    const showResults = () => {
      document.getElementById('gameplay-screen').style.display = 'none';
      document.getElementById('results-screen').style.display = 'flex';
    };

    if (typeof LearningCheck !== 'undefined') {
      LearningCheck.maybePrompt('music', showResults);
    } else {
      showResults();
    }
    document.getElementById('results-stars').textContent = '⭐'.repeat(stars) || 'Try again!';
    document.getElementById('stat-accuracy').textContent = accuracy + '%';
    document.getElementById('stat-hits').textContent = hits;

    // Save progress
    const p = getProgress();
    const existing = p.songsCompleted.find(s => s.songId === currentSong.id);
    if (!existing || stars > existing.bestStars) {
      if (existing) existing.bestStars = stars;
      else p.songsCompleted.push({ songId: currentSong.id, bestStars: stars });
      saveProgress({ songsCompleted: p.songsCompleted });

      if (typeof ActivityLog !== 'undefined' && stars > 0) {
        ActivityLog.log('Guitar Jam', '🎸', `Completed "${currentSong.title}" — ${stars} star${stars !== 1 ? 's' : ''}`);
      }

      checkStarMilestones();
    }

    if (stars > 0 && typeof SFX !== 'undefined') SFX.cheer();
  }

  function exitSong() {
    cancelAnimationFrame(gameInterval);
    currentSong = null;
    document.getElementById('gameplay-screen').style.display = 'none';
    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('song-select-screen').style.display = 'block';
    initPlay();
  }

  function replaySong() {
    const id = currentSong.id;
    document.getElementById('results-screen').style.display = 'none';
    startSong(id);
  }


  // ── Ear Training UI ───────────────────────────────────────────
  function startEarGame() {
    earRound = 0;
    earScore = 0;
    earStreak = 0;
    
    document.getElementById('ear-game-screen').style.display = 'flex';
    document.getElementById('ear-results-screen').style.display = 'none';
    
    nextEarRound();
  }

  function nextEarRound() {
    if (earRound >= 10) {
      endEarGame();
      return;
    }
    
    earRound++;
    document.getElementById('ear-round').textContent = `Round ${earRound}/10`;
    document.getElementById('ear-streak').textContent = `🔥 ${earStreak}`;
    
    // Pick options based on tier
    const tier = getAgeTier();
    const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const maxIdx = tierOrder.indexOf(tier);
    const available = CHORDS.filter(c => tierOrder.indexOf(c.tier) <= maxIdx);
    
    const count = tier === 'beginner' ? 2 : tier === 'intermediate' ? 3 : 4;
    const options = [];
    while (options.length < count) {
      const pick = available[Math.floor(Math.random() * available.length)];
      if (!options.includes(pick)) options.push(pick);
    }
    
    earCorrectChord = options[Math.floor(Math.random() * options.length)];
    
    const optsEl = document.getElementById('ear-options');
    optsEl.innerHTML = options.map(o => `
      <button class="ear-opt-btn" onclick="GuitarJam.checkEarAnswer(this, '${o.name}')">${o.name}</button>
    `).join('');
    
    document.getElementById('ear-replay-btn').onclick = () => {
      Audio.strumChord(earCorrectChord);
    };
    
    // Play sound after a short delay
    setTimeout(() => Audio.strumChord(earCorrectChord), 500);
  }

  function checkEarAnswer(btn, name) {
    const isCorrect = name === earCorrectChord.name;
    const allBtns = btn.parentElement.querySelectorAll('button');
    allBtns.forEach(b => b.disabled = true);
    
    if (isCorrect) {
      earScore++;
      earStreak++;
      btn.classList.add('correct');
      if (typeof SFX !== 'undefined') SFX.correct();
      showFeedback('✅');
    } else {
      earStreak = 0;
      btn.classList.add('wrong');
      allBtns.forEach(b => {
        if (b.textContent === earCorrectChord.name) b.classList.add('correct');
      });
      if (typeof SFX !== 'undefined') SFX.wrong();
      showFeedback('🤔');
    }
    
    setTimeout(nextEarRound, 1500);
  }

  function endEarGame() {
    const showResults = () => {
      document.getElementById('ear-game-screen').style.display = 'none';
      document.getElementById('ear-results-screen').style.display = 'flex';
    };

    if (typeof LearningCheck !== 'undefined') {
      LearningCheck.maybePrompt('music', showResults);
    } else {
      showResults();
    }
    
    let stars = 0;
    if (earScore >= 9) stars = 3;
    else if (earScore >= 7) stars = 2;
    else if (earScore >= 5) stars = 1;
    
    document.getElementById('ear-results-stars').textContent = '⭐'.repeat(stars) || 'Try again!';
    document.getElementById('ear-stat-score').textContent = `${earScore}/10`;
    document.getElementById('ear-stat-streak').textContent = earStreak;
    
    const p = getProgress();
    const updates = {};
    if (stars > (p.earStars || 0)) updates.earStars = stars;
    if (earStreak > (p.earBestStreak || 0)) updates.earBestStreak = earStreak;
    
    if (Object.keys(updates).length > 0) {
      saveProgress(updates);
      checkStarMilestones();
    }
    
    if (stars > 0 && typeof SFX !== 'undefined') SFX.cheer();
  }


  // ── Tuner UI ──────────────────────────────────────────────────
  function initTuner() {
    const btns = document.querySelectorAll('.tuner-btn');
    btns.forEach(btn => {
      btn.onclick = () => {
        btns.forEach(b => b.classList.remove('playing'));
        btn.classList.add('playing');
        
        const freq = parseFloat(btn.dataset.freq);
        Audio.playTone(freq, 2.5);
        
        setTimeout(() => btn.classList.remove('playing'), 2500);
      };
    });
  }


  function checkStarMilestones() {
    const p = getProgress();
    const learnedCount = p.chordsLearned.length;
    const songStars3Count = p.songsCompleted.filter(s => s.bestStars === 3).length;
    const earStars = p.earStars || 0;
    
    // 1 star per 5 chords (max 2)
    let chordStars = Math.min(2, Math.floor(learnedCount / 5));
    // 1 star per 2 songs aced (max 4)
    let playStars = Math.min(4, Math.floor(songStars3Count / 2));
    // 1 star for acing ear training
    let listenStars = earStars === 3 ? 1 : 0;

    const totalCalculated = chordStars + playStars + listenStars;

    if (totalCalculated > p.totalStars) {
      saveProgress({ totalStars: totalCalculated });
      if (typeof SFX !== 'undefined') setTimeout(() => SFX.cheer(), 500);
      showFeedback('🌟');
    }
  }

  function showFeedback(emoji) {
    const el = document.getElementById('feedback');
    if (!el) return;
    el.querySelector('span').textContent = emoji;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1200);
  }

  // ── Tab Management ────────────────────────────────────────────
  function bindTabs() {
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        if (tabId === 'learn') initLearn();
        if (tabId === 'play') initPlay();
        if (tabId === 'ear') startEarGame();
        if (tabId === 'tuner') initTuner();
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    bindTabs();
    initLearn();
  });

  return { selectChord, startSong, exitSong, replaySong, handleStrum, startEarGame, checkEarAnswer, initLearn };
})();