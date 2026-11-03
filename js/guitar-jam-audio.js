/* ================================================================
   GUITAR JAM — AUDIO ENGINE (js/guitar-jam-audio.js)

   A plucked-string synth built on the Karplus–Strong algorithm
   (Karplus & Strong, 1983), with the usual "extended" refinements
   (Jaffe & Smith, 1983):
     - a first-order all-pass in the loop for exact tuning,
     - a pick-position comb on the excitation (where the pick hits
       the string changes the tone),
     - a brightness low-pass on the excitation (soft vs hard pick),
     - per-string decay times (bass strings ring longer).
   Each note is rendered once into an AudioBuffer and cached, then
   played through a small "guitar body" chain: two resonance peaks
   (air and top), a gentle treble roll-off, a short room reverb and
   a compressor so a full strum never clips.

   Standard tuning, low to high: E2 A2 D3 G3 B3 E4
   (82.41, 110.00, 146.83, 196.00, 246.94, 329.63 Hz).

   Everything is computed locally — no samples, no network.
   ================================================================ */

const GJAudio = (() => {
  'use strict';

  // MIDI numbers of the open strings, low E (index 0) to high E (index 5).
  const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // Ring time (seconds to fall 60 dB) of each open string.
  const T60 = [4.6, 4.1, 3.7, 3.2, 2.9, 2.6];
  // Excitation brightness per string (wound strings are darker).
  const BRIGHT = [0.42, 0.46, 0.52, 0.62, 0.68, 0.74];

  let ctx = null;
  let bus = null;        // strings → body
  let metroBus = null;   // metronome clicks
  let master = null;
  const cache = new Map();
  const voices = [null, null, null, null, null, null];
  let scheduled = [];    // sources that may need stopping (count-in, clicks)
  let clickBufs = null;

  function midiFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function noteMidi(string, fret) { return OPEN_MIDI[string] + fret; }
  function noteName(string, fret, withOctave) {
    const m = noteMidi(string, fret);
    return NOTE_NAMES[m % 12] + (withOctave ? (Math.floor(m / 12) - 1) : '');
  }
  function freqOf(string, fret) { return midiFreq(noteMidi(string, fret)); }

  // ── Context + body chain ──────────────────────────────────────
  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      buildChain();
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    return ctx;
  }

  function buildChain() {
    master = ctx.createGain();
    master.gain.value = 0.9;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;

    bus = ctx.createGain();
    bus.gain.value = 0.55;

    // Body: air resonance (~100 Hz) and top-plate resonance (~210 Hz),
    // a little presence, and the treble a wooden box absorbs.
    const air = ctx.createBiquadFilter();
    air.type = 'peaking'; air.frequency.value = 102; air.Q.value = 1.3; air.gain.value = 4.5;
    const top = ctx.createBiquadFilter();
    top.type = 'peaking'; top.frequency.value = 215; top.Q.value = 1.6; top.gain.value = 2.5;
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking'; presence.frequency.value = 2600; presence.Q.value = 0.9; presence.gain.value = 2;
    const roll = ctx.createBiquadFilter();
    roll.type = 'highshelf'; roll.frequency.value = 6500; roll.gain.value = -7;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 55; hp.Q.value = 0.7;

    bus.connect(hp); hp.connect(air); air.connect(top); top.connect(presence); presence.connect(roll);

    // Short room reverb from a generated, decaying noise impulse.
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(1.3, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.16;
    const dry = ctx.createGain(); dry.gain.value = 1;
    roll.connect(dry); roll.connect(conv); conv.connect(wet);
    dry.connect(comp); wet.connect(comp);

    metroBus = ctx.createGain();
    metroBus.gain.value = 0.5;
    metroBus.connect(comp);

    comp.connect(master);
    master.connect(ctx.destination);
  }

  function makeImpulse(seconds, decay) {
    const sr = ctx.sampleRate;
    const n = Math.floor(sr * seconds);
    const buf = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        lp += 0.35 * ((Math.random() * 2 - 1) - lp);
        d[i] = lp * Math.pow(1 - t, decay) * (i < sr * 0.008 ? i / (sr * 0.008) : 1);
      }
    }
    return buf;
  }

  // ── Karplus–Strong renderer ───────────────────────────────────
  // Notes are rendered at half the device rate (24 kHz on most devices):
  // the body chain rolls off the treble anyway, and it halves memory.
  function renderRate() { return ctx.sampleRate > 30000 ? ctx.sampleRate / 2 : ctx.sampleRate; }

  function renderString(freq, opts) {
    const sr = renderRate();
    const t60 = opts.t60;
    const dur = Math.min(3.4, Math.max(1.2, t60 * 0.75));
    const n = Math.floor(sr * dur);
    const out = new Float32Array(n);

    // Loop delay = L (buffer) + 0.5 (averaging filter) + d (all-pass).
    const P = sr / freq;
    let L = Math.floor(P - 0.5);
    let d = P - 0.5 - L;
    if (d < 0.1) { L -= 1; d += 1; }
    const C = (1 - d) / (1 + d);
    const buf = new Float32Array(L);

    // Excitation: low-passed noise, then the pick-position comb.
    const a = Math.min(0.95, Math.max(0.08, opts.bright));
    const exc = new Float32Array(L);
    let lp = 0;
    for (let i = 0; i < L; i++) {
      lp += a * ((Math.random() * 2 - 1) - lp);
      exc[i] = lp;
    }
    const M = Math.max(1, Math.round(opts.pickPos * L));
    let mean = 0;
    for (let i = 0; i < L; i++) {
      buf[i] = exc[i] - (i >= M ? exc[i - M] : 0);
      mean += buf[i];
    }
    mean /= L;
    let peak = 0;
    for (let i = 0; i < L; i++) { buf[i] -= mean; peak = Math.max(peak, Math.abs(buf[i])); }
    const norm = peak > 0 ? 1 / peak : 1;
    for (let i = 0; i < L; i++) buf[i] *= norm;

    // Loss so the fundamental falls 60 dB in t60 seconds.
    const g = Math.pow(10, -3 / (freq * t60));
    const rho = Math.min(0.99995, g / Math.cos(Math.PI * freq / sr));

    let idx = 0, prev = 0, apX = 0, apY = 0, dcX = 0, dcY = 0;
    for (let t = 0; t < n; t++) {
      const cur = buf[idx];
      // DC blocker on the way out.
      dcY = cur - dcX + 0.995 * dcY; dcX = cur;
      out[t] = dcY;
      const avg = rho * 0.5 * (cur + prev);
      prev = cur;
      const y = C * avg + apX - C * apY;
      apX = avg; apY = y;
      buf[idx] = y;
      idx++; if (idx === L) idx = 0;
    }
    // Fade the tail so the buffer never ends on a click.
    const fade = Math.floor(sr * 0.08);
    for (let i = 0; i < fade; i++) out[n - 1 - i] *= i / fade;

    const ab = ctx.createBuffer(1, n, sr);
    if (ab.copyToChannel) ab.copyToChannel(out, 0); else ab.getChannelData(0).set(out);
    return ab;
  }

  const CACHE_MAX = 64; // ~20 MB of notes at most
  function noteBuffer(string, fret, variant) {
    const key = string + ':' + fret + ':' + variant;
    let b = cache.get(key);
    if (b) { cache.delete(key); cache.set(key, b); return b; }
    b = renderString(freqOf(string, fret), {
      t60: T60[string] * Math.pow(0.965, fret),
      bright: BRIGHT[string] + 0.06,
      pickPos: variant ? 0.15 : 0.12
    });
    cache.set(key, b);
    while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return b;
  }
  function getBuffer(string, fret) { return noteBuffer(string, fret, Math.random() < 0.5 ? 0 : 1); }

  // ── Public: pluck / strum ─────────────────────────────────────
  // Returns the AudioContext time the note starts (or null when muted).
  function pluck(string, fret, opts) {
    if (!init() || fret < 0 || fret == null) return null;
    opts = opts || {};
    const vel = opts.vel == null ? 0.8 : opts.vel;
    const when = Math.max(ctx.currentTime, opts.when || 0);
    const src = ctx.createBufferSource();
    src.buffer = getBuffer(string, fret);
    const g = ctx.createGain();
    g.gain.value = 0.18 + vel * 0.55;
    src.connect(g); g.connect(bus);
    // A real string can only sound one note: damp what it was playing.
    const old = voices[string];
    if (old) {
      try {
        old.gain.gain.setTargetAtTime(0, when, 0.012);
        old.src.stop(when + 0.12);
      } catch (e) { /* already stopped */ }
    }
    src.start(when);
    const v = { src, gain: g };
    voices[string] = v;
    src.onended = () => { if (voices[string] === v) voices[string] = null; };
    return when;
  }

  // frets: 6 numbers, -1 = muted. dir: 'down' (low→high) or 'up'.
  // Returns [{string, when, vel}] for the visuals.
  function strum(frets, opts) {
    if (!init()) return [];
    opts = opts || {};
    const dir = opts.dir === 'up' ? 'up' : 'down';
    const base = Math.max(ctx.currentTime, opts.when || 0) + 0.005;
    const spread = (opts.spread == null ? 0.018 : opts.spread);
    const velBase = opts.vel == null ? (dir === 'up' ? 0.62 : 0.85) : opts.vel;
    let order = [0, 1, 2, 3, 4, 5];
    if (dir === 'up') {
      order = order.reverse();
      // Up-strums mostly catch the treble strings.
      if (!opts.full) order = order.slice(0, 4);
    }
    const out = [];
    let k = 0;
    order.forEach(s => {
      const f = frets[s];
      if (f == null || f < 0) return;
      const jitter = (Math.random() - 0.5) * 0.004;
      const when = base + k * spread + jitter;
      const vel = Math.max(0.2, velBase * (1 - k * 0.035) + (Math.random() - 0.5) * 0.06);
      pluck(s, f, { when, vel });
      out.push({ string: s, when, vel });
      k++;
    });
    return out;
  }

  // Damp every string (palm on the strings).
  function mute(when) {
    if (!ctx) return;
    const t = Math.max(ctx.currentTime, when || 0);
    voices.forEach((v, i) => {
      if (!v) return;
      try { v.gain.gain.setTargetAtTime(0, t, 0.02); v.src.stop(t + 0.2); } catch (e) { /* ignore */ }
      voices[i] = null;
    });
  }

  // Pre-render the notes of some chords while the kid is reading.
  function prewarm(fretSets) {
    if (!ctx) return;
    const jobs = [];
    fretSets.forEach(fr => fr.forEach((f, s) => { if (f >= 0) jobs.push([s, f]); }));
    let i = 0;
    const step = () => {
      const end = Math.min(jobs.length, i + 3);
      for (; i < end; i++) {
        const [s, f] = jobs[i];
        for (let variant = 0; variant < 2; variant++) {
          if (!cache.has(s + ':' + f + ':' + variant)) noteBuffer(s, f, variant);
        }
      }
      if (i < jobs.length) setTimeout(step, 30);
    };
    setTimeout(step, 30);
  }

  // ── Metronome ─────────────────────────────────────────────────
  function makeClick(freq, len) {
    const sr = ctx.sampleRate;
    const n = Math.floor(sr * len);
    const b = ctx.createBuffer(1, n, sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 60);
      d[i] = env * (0.75 * Math.sin(2 * Math.PI * freq * t) + 0.25 * (Math.random() * 2 - 1) * Math.exp(-t * 300));
    }
    return b;
  }

  function click(when, accent) {
    if (!init()) return;
    if (!clickBufs) clickBufs = { hi: makeClick(1850, 0.07), lo: makeClick(1250, 0.06) };
    const src = ctx.createBufferSource();
    src.buffer = accent ? clickBufs.hi : clickBufs.lo;
    const g = ctx.createGain();
    g.gain.value = accent ? 0.9 : 0.6;
    src.connect(g); g.connect(metroBus);
    src.start(Math.max(ctx.currentTime, when || 0));
    scheduled.push(src);
    src.onended = () => { const i = scheduled.indexOf(src); if (i >= 0) scheduled.splice(i, 1); };
  }

  function setMetronome(on) {
    if (!init()) return;
    metroBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.01);
  }

  function cancelScheduled() {
    scheduled.forEach(s => { try { s.stop(); } catch (e) { /* ignore */ } });
    scheduled = [];
  }

  function now() { return ctx ? ctx.currentTime : performance.now() / 1000; }
  function latency() {
    if (!ctx) return 0;
    return (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
  }

  // iOS: a silent buffer on the first gesture unlocks the audio session.
  function unlock() {
    if (!init()) return;
    try {
      const b = ctx.createBuffer(1, 1, ctx.sampleRate);
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) { /* ignore */ }
  }

  // ── Microphone pitch (tuner) — only after the kid taps "use mic" ──
  let mic = null;

  function startMic() {
    if (!init()) return Promise.reject(new Error('no-audio'));
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('no-mic'));
    }
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(stream => {
      const source = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 4096;
      source.connect(an); // analyser only — never routed to the speakers
      mic = { stream, source, an, data: new Float32Array(an.fftSize) };
      return true;
    });
  }

  function stopMic() {
    if (!mic) return;
    try { mic.stream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
    try { mic.source.disconnect(); } catch (e) { /* ignore */ }
    mic = null;
  }

  function micOn() { return !!mic; }

  // McLeod-style normalised autocorrelation. Returns Hz or 0.
  function readPitch() {
    if (!mic) return 0;
    const buf = mic.data;
    if (mic.an.getFloatTimeDomainData) mic.an.getFloatTimeDomainData(buf);
    else return 0;
    const n = buf.length;
    let rms = 0;
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.008) return 0;
    const sr = ctx.sampleRate;
    const minLag = Math.floor(sr / 1000), maxLag = Math.min(Math.floor(sr / 60), n >> 1);
    const W = n - maxLag;
    const nsdf = new Float32Array(maxLag + 1);
    for (let lag = minLag; lag <= maxLag; lag++) {
      let ac = 0, m = 0;
      for (let i = 0; i < W; i++) {
        const a = buf[i], b = buf[i + lag];
        ac += a * b; m += a * a + b * b;
      }
      nsdf[lag] = m > 0 ? 2 * ac / m : 0;
    }
    let best = 0;
    for (let lag = minLag; lag <= maxLag; lag++) if (nsdf[lag] > best) best = nsdf[lag];
    if (best < 0.6) return 0;
    const thr = best * 0.9;
    let lag = minLag;
    // first lag after the zero crossing that reaches the threshold, at its local peak
    while (lag < maxLag && nsdf[lag] > 0) lag++;
    while (lag < maxLag && nsdf[lag] < thr) lag++;
    while (lag < maxLag && nsdf[lag + 1] > nsdf[lag]) lag++;
    if (lag >= maxLag) return 0;
    const y0 = nsdf[lag - 1], y1 = nsdf[lag], y2 = nsdf[lag + 1];
    const den = (y0 - 2 * y1 + y2);
    const shift = den !== 0 ? 0.5 * (y0 - y2) / den : 0;
    return sr / (lag + shift);
  }

  return {
    OPEN_MIDI, NOTE_NAMES,
    init, unlock, pluck, strum, mute, prewarm, click, setMetronome, cancelScheduled,
    now, latency, noteName, freqOf, midiFreq,
    startMic, stopMic, micOn, readPitch,
    get ctx() { return ctx; }
  };
})();
