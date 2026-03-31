/* ================================================================
   ZAVALA SERRA APPS — Sound Effects (sounds.js)
   
   Pure Web Audio API — no external .mp3 files needed.
   
   Usage:
     SFX.correct()   → happy ascending chime
     SFX.wrong()     → low descending buzz
     SFX.cheer()     → triumphant arpeggio
     SFX.click()     → soft UI click
     SFX.star()      → sparkle/coin sound
   
   Import after auth.js:
     <script src="js/sounds.js"></script>
   ================================================================ */

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { return null; }
    }
    // Resume if suspended (autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playTone(freq, duration, startDelay, type, volume, fade) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.15;
    osc.connect(gain);
    gain.connect(c.destination);
    const t = c.currentTime + (startDelay || 0);
    osc.start(t);
    if (fade !== false) {
      gain.gain.setValueAtTime(volume || 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    }
    osc.stop(t + duration);
  }

  function correct() {
    // Ascending two-note chime: C5 → E5
    playTone(523, 0.15, 0, 'sine', 0.18);
    playTone(659, 0.25, 0.1, 'sine', 0.15);
  }

  function wrong() {
    // Low descending buzz
    playTone(220, 0.12, 0, 'square', 0.08);
    playTone(180, 0.2, 0.08, 'square', 0.06);
  }

  function cheer() {
    // Ascending arpeggio: C5 → E5 → G5 → C6
    playTone(523, 0.15, 0, 'sine', 0.14);
    playTone(659, 0.15, 0.08, 'sine', 0.14);
    playTone(784, 0.15, 0.16, 'sine', 0.14);
    playTone(1047, 0.35, 0.24, 'sine', 0.12);
  }

  function click() {
    // Soft tick
    playTone(800, 0.05, 0, 'sine', 0.08);
  }

  function star() {
    // Sparkle: high quick notes
    playTone(1200, 0.08, 0, 'sine', 0.1);
    playTone(1600, 0.08, 0.06, 'sine', 0.08);
    playTone(2000, 0.12, 0.12, 'sine', 0.06);
  }

  // Auto-init AudioContext on first user interaction (autoplay policy).
  // Playing a silent buffer upgrades the iOS audio session so it
  // ignores the silent/ringer switch — just resume() alone is not enough.
  function _warmup() {
    const c = getCtx();
    try {
      if (c) {
        const buf = c.createBuffer(1, 1, c.sampleRate);
        const src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
      }
    } catch (e) { /* ignore */ }
    document.removeEventListener('click', _warmup);
    document.removeEventListener('touchstart', _warmup);
    document.removeEventListener('touchend', _warmup);
  }
  document.addEventListener('click', _warmup, { once: true });
  document.addEventListener('touchstart', _warmup, { once: true });
  document.addEventListener('touchend', _warmup, { once: true });

  return { correct, wrong, cheer, click, star };
})();
